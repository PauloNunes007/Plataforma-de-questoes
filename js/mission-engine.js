// ============================================================
// QUESTLY — mission-engine.js
// Gera as missões do dia por algoritmo (sem IA). Desde a introdução
// da Grade semanal (js/rotina-engine.js), o aluno escolhe QUAIS
// disciplinas estuda em cada dia — a missão do dia virou, na
// verdade, uma missão POR disciplina agendada pra hoje, cada uma
// seguindo a mesma prioridade de sempre dentro da sua disciplina:
//   1. Provas próximas (peso na distribuição do tempo entre disciplinas)
//   2. Conteúdos fracos (taxa de acerto baixa)
//   3. Conteúdos esquecidos — revisão espaçada pela curva de
//      Ebbinghaus (questlyRetencaoTopico em js/supabase-client.js):
//      tópico já coberto cuja retenção estimada caiu abaixo do limiar
//      vira "revisão urgente" e fura a fila, entrando na missão ANTES
//      do conteúdo novo da fronteira.
//   4. Meta de nota
//
// Cada missão respeita a ordem da ementa da SUA disciplina
// (topicos.ordem): existe uma "fronteira curricular" — o primeiro
// tópico da ementa ainda não coberto — e a missão só usa a fronteira
// + tópicos anteriores (revisão). Nunca pula conteúdo pra frente.
// Tópicos sem questões no banco não travam a fronteira (ementas
// variam por universidade; ela avança por cima deles), e tópicos que
// o aluno marcou como 'pulado' ou 'dominado' saem da trilha (ver
// questly_trilha.html).
//
// Chamado pelo dashboard.js — questlyGerarMissoesDoDia é idempotente:
// devolve as missões de hoje já existentes + gera as que faltarem
// pras disciplinas de hoje que ainda não têm uma.
// ============================================================

const TEMPO_MEDIO_POR_QUESTAO_MIN = 3; // fallback se a questão não tiver tempo_medio_seg
// sessões maiores (grade semanal + orçamento de tempo alto) pedem um teto
// mais generoso — a versão antiga (3 tópicos / 15 questões) ficava rasa
// demais pra quem estuda várias horas por dia numa disciplina só
const MAX_TOPICOS_POR_MISSAO = 5;
const MIN_QUESTOES = 4;
const MAX_QUESTOES = 40;
// quantas questões respondidas "cobrem" um tópico e avançam a fronteira
// (manter em sincronia com META_QUESTOES_TOPICO em js/chance-aprovacao.js,
// que não é carregado no dashboard)
const COBERTURA_TOPICO_QUESTOES = 5;
const BONUS_FRONTEIRA = 35; // garante que o tópico novo da ementa quase sempre entra na missão
// revisão espaçada: maior que BONUS_FRONTEIRA de propósito — memória
// vencendo tem prioridade sobre conteúdo novo (Ebbinghaus)
const BONUS_REVISAO_URGENTE = 45;
const DOSE_REVISAO_URGENTE = 3; // questões garantidas por tópico com revisão vencida
// XP por questão vem de questlyXpDaQuestao (js/supabase-client.js),
// ponderado pela dificuldade — a recompensa da missão é a soma exata
// das questões escolhidas, então o banner promete o que a missão paga.

function questlyEmbaralhar(arr) {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
  }
  return copia;
}

// ------------------------------------------------------------
// ENTRYPOINT — chamado pelo dashboard. Decide QUAIS disciplinas têm
// missão hoje (grade semanal, js/rotina-engine.js) e devolve o
// conjunto completo: missões de hoje já existentes (de sessões
// anteriores no mesmo dia) + as que faltarem, recém-geradas.
// ------------------------------------------------------------
async function questlyGerarMissoesDoDia(user, profile) {
  // 0. Respeita os dias de estudo escolhidos no onboarding/configurações
  const hojeAbrev = QUESTLY_DIAS_SEMANA[new Date().getDay()];
  if (profile && profile.dias_disponiveis && profile.dias_disponiveis.length > 0) {
    const diasNormalizados = profile.dias_disponiveis.map(questlyNormalizarDia);
    if (diasNormalizados.indexOf(hojeAbrev) === -1) {
      return { missoes: [], semMissaoHoje: true, motivo: "Hoje não está nos seus dias de estudo configurados." };
    }
  }

  // 1. Disciplinas do aluno com seus bosses (provas) — base pra tudo:
  // fallback de disciplina única, pesos da grade e pesos do tempo.
  const { data: subjects, error: subjectsError } = await supabaseClient
    .from("subjects")
    .select("*, bosses(id, nome, data_prova)")
    .eq("user_id", user.id);

  if (subjectsError || !subjects || subjects.length === 0) {
    return { missoes: [], semMissaoHoje: true, motivo: "Nenhuma disciplina configurada ainda." };
  }

  // 2. Grade semanal: quais disciplinas o aluno escolheu estudar hoje.
  // Sem nenhuma linha configurada (conta antiga de antes dessa função
  // existir) cai no comportamento antigo: só a disciplina do boss mais
  // próximo. Com grade configurada mas nada marcado pra hoje, é dia de
  // folga dessa disciplina — não inventa missão.
  const rotinaCompleta = await questlyBuscarRotinaCompleta(user);
  let subjectsHoje;
  if (rotinaCompleta.length === 0) {
    subjectsHoje = [questlyDisciplinaComBossMaisProximo(subjects)];
  } else {
    const idsHoje = new Set(
      rotinaCompleta.filter(function (r) { return r.dia_semana === hojeAbrev; }).map(function (r) { return r.subject_id; })
    );
    subjectsHoje = subjects.filter(function (s) { return idsHoje.has(s.id); });
    if (subjectsHoje.length === 0) {
      return {
        missoes: [], semMissaoHoje: true,
        motivo: "Nenhuma disciplina programada pra hoje na sua grade semanal. Ajuste em Configurações → Grade semanal.",
      };
    }
  }

  // 3. Missões de hoje que já existem (sessão anterior no mesmo dia) —
  // idempotência: não gera de novo o que já foi gerado.
  const hojeStr = new Date().toISOString().slice(0, 10);
  const { data: missoesExistentes } = await supabaseClient
    .from("missions")
    .select("*, subjects(nome)")
    .eq("user_id", user.id)
    .eq("data", hojeStr)
    .eq("avulsa", false);

  const subjectIdsComMissao = new Set((missoesExistentes || []).map(function (m) { return m.subject_id; }));
  const subjectsFaltando = subjectsHoje.filter(function (s) { return !subjectIdsComMissao.has(s.id); });

  // 4. Orçamento de tempo do dia dividido entre as disciplinas de hoje,
  // proporcional ao peso de cada uma (prova próxima + fraqueza + meta de
  // nota — mesma fórmula que monta a recomendação da grade semanal, ver
  // questlyPesoDisciplina em js/rotina-engine.js).
  const tempoDiarioMin = (profile && profile.tempo_diario_min) || 30;
  const minutosPorSubject = questlyApportionarMinutos(subjectsHoje, tempoDiarioMin);

  // 5. Gera só o que falta; disciplina sem tópico/questão elegível não
  // trava as outras — só fica de fora, e o motivo dela é ignorado (as
  // demais missões da grade seguem valendo).
  const geradas = [];
  for (let i = 0; i < subjectsFaltando.length; i++) {
    const subject = subjectsFaltando[i];
    const resultado = await questlyGerarMissaoParaSubject(user, profile, subject, minutosPorSubject[subject.id] || tempoDiarioMin);
    if (resultado && !resultado.semMissaoHoje) geradas.push(resultado);
  }

  const missoes = (missoesExistentes || []).concat(geradas);

  if (missoes.length === 0) {
    return {
      missoes: [], semMissaoHoje: true,
      motivo: "Ainda não há questões cadastradas pros tópicos das disciplinas de hoje.",
    };
  }

  return { missoes: missoes, semMissaoHoje: false };
}

function questlyDisciplinaComBossMaisProximo(subjects) {
  const hoje = new Date(new Date().toDateString());
  const comBossInfo = subjects.map(function (s) {
    const futuros = (s.bosses || [])
      .filter(function (b) { return new Date(b.data_prova) >= hoje; })
      .sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); });
    const proximoBoss = futuros[0] || null;
    const diasAteProva = proximoBoss
      ? Math.round((new Date(proximoBoss.data_prova) - hoje) / (1000 * 60 * 60 * 24))
      : Infinity; // disciplinas sem prova marcada ficam por último
    return { subject: s, diasAteProva: diasAteProva };
  });
  comBossInfo.sort(function (a, b) { return a.diasAteProva - b.diasAteProva; });
  return comBossInfo[0].subject;
}

/**
 * Gera (e salva) a missão do dia de UMA disciplina específica, com um
 * orçamento de tempo já definido (minutos). Retorna a missão criada, ou
 * um objeto { semMissaoHoje, motivo } se não for possível gerar (ex: a
 * disciplina não tem tópicos/questões cadastrados ainda).
 */
async function questlyGerarMissaoParaSubject(user, profile, subject, tempoAlocadoMin) {
  // 1. Busca os tópicos da matéria (conteúdo compartilhado) e o progresso
  // deste aluno neles (aluno_topico_progresso — por aluno, não pendurado
  // no tópico, já que o tópico agora é compartilhado entre todos)
  if (!subject.materia_id) {
    return { semMissaoHoje: true, motivo: "Essa disciplina ainda não está ligada a uma matéria." };
  }

  const { data: topicosMateria, error: topicsError } = await supabaseClient
    .from("topicos")
    .select("*")
    .eq("materia_id", subject.materia_id);

  if (topicsError || !topicosMateria || topicosMateria.length === 0) {
    return { semMissaoHoje: true, motivo: "Essa disciplina ainda não tem tópicos cadastrados." };
  }

  const topicoIdsDaMateria = topicosMateria.map(function (t) { return t.id; });
  const { data: progressos } = await supabaseClient
    .from("aluno_topico_progresso")
    .select("*")
    .eq("user_id", user.id)
    .in("topico_id", topicoIdsDaMateria);

  const progressoPorTopico = {};
  (progressos || []).forEach(function (p) { progressoPorTopico[p.topico_id] = p; });

  // quais tópicos têm questões no banco — tópico sem questão não pode
  // gerar missão nem travar a fronteira (a ementa é um superconjunto:
  // cada universidade cobre um recorte, e questões chegam aos poucos).
  // Uma linha por questão da matéria; ok pro tamanho atual do banco.
  const { data: questoesDaMateria } = await supabaseClient
    .from("questions")
    .select("topic_id")
    .in("topic_id", topicoIdsDaMateria);

  const temQuestao = {};
  (questoesDaMateria || []).forEach(function (q) { temQuestao[q.topic_id] = true; });

  const topics = topicosMateria.map(function (t) {
    const p = progressoPorTopico[t.id];
    return {
      id: t.id,
      cai_na_prova: t.cai_na_prova,
      // tópico fora da ementa (importado sem ordem) fica pro fim da trilha
      ordem: t.ordem != null ? t.ordem : Infinity,
      status: (p && p.status) || "pendente",
      taxa_acerto: p ? p.taxa_acerto : 0,
      num_questoes_respondidas: p ? p.num_questoes_respondidas : 0,
      ultima_revisao: p ? p.ultima_revisao : null,
    };
  });

  // elegíveis pra missão: têm questões e o aluno não marcou como
  // 'pulado' (declarou que já sabe — sem XP) nem 'dominado' (provou
  // num recap). Esses dois continuam disponíveis na prática livre.
  const elegiveis = topics.filter(function (t) {
    return temQuestao[t.id] && t.status !== "pulado" && t.status !== "dominado";
  });

  if (elegiveis.length === 0) {
    const algumComQuestao = topics.some(function (t) { return temQuestao[t.id]; });
    return {
      semMissaoHoje: true,
      motivo: algumComQuestao
        ? "Você já dominou (ou pulou) todos os tópicos com questões dessa disciplina. Use a prática livre pra revisar!"
        : "Ainda não há questões cadastradas pros tópicos dessa disciplina.",
    };
  }

  // fronteira curricular: primeiro tópico da ementa (menor ordem) ainda
  // não coberto. A missão só pode usar a fronteira + tópicos anteriores.
  const porOrdem = elegiveis.slice().sort(function (a, b) { return a.ordem - b.ordem; });
  const fronteira = porOrdem.find(function (t) {
    return (t.num_questoes_respondidas || 0) < COBERTURA_TOPICO_QUESTOES;
  }) || null;

  // fronteira null = tudo coberto -> modo revisão pura (todos elegíveis)
  const candidatos = fronteira
    ? elegiveis.filter(function (t) { return t.ordem <= fronteira.ordem; })
    : elegiveis;

  // 2. Pontua cada tópico pelas 4 prioridades do documento
  const agoraMs = Date.now();
  const pontuados = candidatos.map(function (t) {
    let score = 0;

    // Prioridade 0: avançar na ementa — o tópico da fronteira quase
    // sempre entra, o resto da missão vira revisão do que veio antes
    if (fronteira && t.id === fronteira.id) score += BONUS_FRONTEIRA;

    // Prioridade 1: cai na prova mais próxima
    if (t.cai_na_prova) score += 40;

    // Prioridade 2: conteúdo fraco (quanto menor a taxa de acerto, maior o score)
    const taxaAcerto = t.taxa_acerto != null ? t.taxa_acerto : 0;
    score += (1 - taxaAcerto) * 30;

    // Prioridade 3: conteúdo esquecido — retenção estimada pela curva
    // de Ebbinghaus (R = e^(-t/S), ver js/supabase-client.js). Quanto
    // menor a retenção, mais urgente revisar. Nunca revisado = urgência
    // máxima (mas isso só importa se o tópico já tem histórico).
    const retencao = questlyRetencaoTopico(t, agoraMs);
    score += retencao == null ? 30 : (1 - retencao) * 30;

    // Revisão espaçada VENCIDA: tópico já coberto cuja retenção caiu
    // abaixo do limiar entra na missão antes do conteúdo novo — o bônus
    // supera o da fronteira de propósito.
    const coberto = (t.num_questoes_respondidas || 0) >= COBERTURA_TOPICO_QUESTOES;
    t.revisaoUrgente = coberto && retencao != null && retencao < QUESTLY_RETENCAO_LIMIAR;
    if (t.revisaoUrgente) score += BONUS_REVISAO_URGENTE;

    // Prioridade 4: meta de nota (metas mais altas dão peso extra a tópicos fracos)
    const notaDesejada = subject.nota_desejada || 6;
    if (notaDesejada >= 9) score += (1 - taxaAcerto) * 10;

    return { topic: t, score: score };
  });

  pontuados.sort(function (a, b) { return b.score - a.score; });
  const topicosEscolhidos = pontuados.slice(0, MAX_TOPICOS_POR_MISSAO).map(function (p) { return p.topic; });
  const topicIds = topicosEscolhidos.map(function (t) { return t.id; });

  // 3. Busca as questões candidatas dos tópicos escolhidos e já fixa o
  // conjunto exato que a missão vai usar (em vez de só guardar topic_ids e
  // sortear depois) — assim o tempo previsto pode ser a soma real dessas
  // questões específicas, não uma média de amostra aleatória.
  const { data: candidatas } = await supabaseClient
    .from("questions")
    .select("id, topic_id, tempo_medio_seg, dificuldade")
    .in("topic_id", topicIds);

  if (!candidatas || candidatas.length === 0) {
    return { semMissaoHoje: true, motivo: "Ainda não há questões cadastradas pros tópicos dessa disciplina." };
  }

  // ordem de prioridade dentro da missão: 1º a dose de revisão espaçada
  // vencida (memória vencendo vem antes de tudo — Ebbinghaus), 2º a dose
  // garantida do conteúdo novo da fronteira, 3º o resto vira revisão comum
  let embaralhadas = questlyEmbaralhar(candidatas);
  const prioritarias = [];
  topicosEscolhidos
    .filter(function (t) { return t.revisaoUrgente; })
    .forEach(function (t) {
      embaralhadas
        .filter(function (q) { return q.topic_id === t.id; })
        .slice(0, DOSE_REVISAO_URGENTE)
        .forEach(function (q) { prioritarias.push(q); });
    });
  if (fronteira) {
    const faltamPraCobrir = Math.max(1, COBERTURA_TOPICO_QUESTOES - (fronteira.num_questoes_respondidas || 0));
    embaralhadas
      .filter(function (q) { return q.topic_id === fronteira.id && prioritarias.indexOf(q) === -1; })
      .slice(0, faltamPraCobrir)
      .forEach(function (q) { prioritarias.push(q); });
  }
  if (prioritarias.length > 0) {
    const resto = embaralhadas.filter(function (q) { return prioritarias.indexOf(q) === -1; });
    embaralhadas = prioritarias.concat(resto);
  }
  const orcamentoSeg = (tempoAlocadoMin || 30) * 60;

  // monta a missão somando o tempo (real ou, só pra decidir quantas cabem
  // no orçamento, o fallback) até estourar o tempo disponível do aluno
  const escolhidas = [];
  let somaSegParaTamanho = 0;
  for (let i = 0; i < embaralhadas.length && escolhidas.length < MAX_QUESTOES; i++) {
    const q = embaralhadas[i];
    const tempoEstimadoSeg = q.tempo_medio_seg || TEMPO_MEDIO_POR_QUESTAO_MIN * 60;
    if (escolhidas.length >= MIN_QUESTOES && somaSegParaTamanho + tempoEstimadoSeg > orcamentoSeg) break;
    escolhidas.push(q);
    somaSegParaTamanho += tempoEstimadoSeg;
  }
  if (escolhidas.length === 0) escolhidas.push(embaralhadas[0]);

  const qtdQuestoes = escolhidas.length;
  const questionIds = escolhidas.map(function (q) { return q.id; });

  // tempo previsto exibido usa só dado real: soma o tempo_medio_seg de quem
  // já tem, e só extrapola as sem-dado pela média das que têm dado real
  // dessa mesma missão (nunca usa o fallback genérico na exibição). Se
  // nenhuma questão escolhida já foi cronometrada, fica null — o
  // dashboard mostra "calculando..." em vez de inventar um número.
  const comDadoReal = escolhidas.filter(function (q) { return q.tempo_medio_seg; });
  let tempoPrevistoMin = null;
  if (comDadoReal.length > 0) {
    const somaRealSeg = comDadoReal.reduce(function (acc, q) { return acc + q.tempo_medio_seg; }, 0);
    const mediaRealSeg = somaRealSeg / comDadoReal.length;
    const somaTotalEstimadaSeg = somaRealSeg + (qtdQuestoes - comDadoReal.length) * mediaRealSeg;
    tempoPrevistoMin = Math.round(somaTotalEstimadaSeg / 60);
  }

  const xpRecompensa = escolhidas.reduce(function (acc, q) { return acc + questlyXpDaQuestao(q); }, 0);

  // 4. Salva a missão gerada
  const { data: missaoCriada, error: insertError } = await supabaseClient
    .from("missions")
    .insert({
      user_id: user.id,
      subject_id: subject.id,
      data: new Date().toISOString().slice(0, 10),
      topic_ids: topicIds,
      question_ids: questionIds,
      qtd_questoes: qtdQuestoes,
      tempo_previsto_min: tempoPrevistoMin,
      xp_recompensa: xpRecompensa,
      concluida: false,
    })
    .select("*, subjects(nome)")
    .single();

  if (insertError) {
    console.error("Erro ao gerar missão do dia:", insertError);
    return { semMissaoHoje: true, motivo: "Não foi possível gerar a missão agora." };
  }

  return missaoCriada;
}
