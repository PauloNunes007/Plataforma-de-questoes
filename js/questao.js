// ============================================================
// QUESTLY — questao.js
// Fluxo de responder as questões de uma missão: busca as questões
// dos tópicos sorteados, registra tentativas, dá XP, avança a
// barra do Boss e marca a missão como concluída. Navegação livre
// entre perguntas (cada uma guarda seu próprio estado).
// ============================================================

const KATEX_OPTS = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true },
  ],
  // LaTeX malformado não deve travar a página do aluno — mostra o
  // trecho quebrado em vermelho em vez de interromper a renderização
  throwOnError: false,
};

let currentUser = null;
let missao = null;
let perguntas = [];
let jaAcertadasAntes = new Set(); // questões que o aluno já acertou em missões passadas (XP reduzido — ver confirmarResposta)
let topicosMestreInicio = new Set(); // tópicos em que o aluno JÁ era Mestre quando a missão começou (XP 1.5x — ver confirmarResposta)
let estados = []; // um objeto de estado por pergunta, mesmo índice de `perguntas`
let indiceAtual = 0;
let acertos = 0;
let erros = 0;
let xpGanho = 0;
let tempoInicioMissaoMs = null;

document.addEventListener('DOMContentLoaded', iniciarQuestao);

async function iniciarQuestao() {
  currentUser = await questlyExigirLogin();
  if (!currentUser) return;

  const params = new URLSearchParams(window.location.search);
  const missaoId = params.get('missao');

  if (!missaoId) {
    mostrarVazio('Nenhuma missão selecionada. Volte ao dashboard e clique em "Cumprir missão".');
    return;
  }

  const { data: missaoData, error: missaoError } = await supabaseClient
    .from('missions')
    .select('*, subjects(nome)')
    .eq('id', missaoId)
    .eq('user_id', currentUser.id)
    .single();

  if (missaoError || !missaoData) {
    mostrarVazio('Não foi possível encontrar essa missão.');
    return;
  }

  if (missaoData.concluida) {
    mostrarVazio('Essa missão já foi concluída. Volte amanhã pra uma nova!');
    return;
  }

  missao = missaoData;

  // missões novas já vêm com o conjunto exato de questões fixado na criação
  // (js/mission-engine.js); missões antigas (geradas antes dessa mudança)
  // não têm question_ids — caem no caminho antigo, por tópico.
  const questionIds = missao.question_ids || [];
  const topicIds = missao.topic_ids || [];

  let questoes, questoesError;
  if (questionIds.length > 0) {
    ({ data: questoes, error: questoesError } = await supabaseClient
      .from('questions')
      .select('*')
      .in('id', questionIds));
  } else if (topicIds.length > 0) {
    ({ data: questoes, error: questoesError } = await supabaseClient
      .from('questions')
      .select('*')
      .in('topic_id', topicIds));
  } else {
    mostrarVazio('Essa missão não tem tópicos definidos.');
    return;
  }

  if (questoesError) {
    console.error('Erro ao buscar questões:', questoesError);
    mostrarVazio('Não foi possível carregar as questões dessa missão.');
    return;
  }

  if (!questoes || questoes.length === 0) {
    mostrarVazio('Ainda não há questões cadastradas pros tópicos dessa missão.');
    return;
  }

  perguntas = embaralhar(questoes).slice(0, missao.qtd_questoes || questoes.length);
  estados = perguntas.map(function () {
    return { selecionada: null, respondida: false, correta: null, riscadas: new Set(), tempoInicioMs: null };
  });

  // questões que o aluno já acertou antes valem metade do XP (repetir um
  // item já dominado traz pouca informação nova — e fecha a porta de
  // farmar XP refazendo as mesmas questões fáceis na prática livre)
  const { data: acertosAnteriores } = await supabaseClient
    .from('question_attempts')
    .select('question_id')
    .eq('user_id', currentUser.id)
    .eq('correta', true)
    .in('question_id', perguntas.map(function (p) { return p.id; }));
  jaAcertadasAntes = new Set((acertosAnteriores || []).map(function (t) { return t.question_id; }));

  // maestria: tópicos onde o aluno já é Mestre (>= 90% em >= 20 questões,
  // ver questlyEhMestre) pagam XP com multiplicador — manter a coroa também
  // vale a pena. A foto é tirada AGORA, no começo da missão, pra taxa não
  // mudar no meio e pagar diferente entre a 1ª e a última questão.
  const topicIdsDasPerguntas = Array.from(new Set(
    perguntas.map(function (p) { return p.topic_id; }).filter(Boolean)
  ));
  if (topicIdsDasPerguntas.length > 0) {
    const { data: progsIniciais } = await supabaseClient
      .from('aluno_topico_progresso')
      .select('topico_id, taxa_acerto, num_questoes_respondidas')
      .eq('user_id', currentUser.id)
      .in('topico_id', topicIdsDasPerguntas);
    (progsIniciais || []).forEach(function (p) {
      if (questlyEhMestre(p)) topicosMestreInicio.add(p.topico_id);
    });
  }

  document.getElementById('confirmarBtn').onclick = confirmarResposta;
  document.getElementById('anteriorBtn').onclick = function () { navegarPara(indiceAtual - 1); };
  document.getElementById('proximoBtn').onclick = function () {
    if (indiceAtual >= perguntas.length - 1) {
      finalizarMissao();
    } else {
      navegarPara(indiceAtual + 1);
    }
  };

  tempoInicioMissaoMs = Date.now();
  document.getElementById('questionView').classList.add('active');
  renderPergunta();
}

function mostrarVazio(msg) {
  document.getElementById('emptyMsg').textContent = msg;
  document.getElementById('emptyView').classList.add('active');
}

function embaralhar(arr) {
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
// NAVEGAÇÃO
// ------------------------------------------------------------
function navegarPara(indice) {
  if (indice < 0 || indice >= perguntas.length) return;
  indiceAtual = indice;
  renderPergunta();
}

// ------------------------------------------------------------
// RENDER DA PERGUNTA
// ------------------------------------------------------------
function renderPergunta() {
  const pergunta = perguntas[indiceAtual];
  const estado = estados[indiceAtual];
  if (!estado.tempoInicioMs) estado.tempoInicioMs = Date.now();

  document.getElementById('progressFill').style.width = ((indiceAtual + 1) / perguntas.length * 100) + '%';
  document.getElementById('qCounter').textContent = 'Pergunta ' + (indiceAtual + 1) + ' de ' + perguntas.length;

  document.getElementById('qMeta').innerHTML =
    (pergunta.dificuldade ? '<span class="q-tag">' + escapeHtml(pergunta.dificuldade) + '</span>' : '') +
    (pergunta.instituicao ? '<span class="q-tag">' + escapeHtml(pergunta.instituicao) + (pergunta.ano ? ' ' + pergunta.ano : '') + '</span>' : '');

  const enunciadoEl = document.getElementById('qEnunciado');
  enunciadoEl.innerHTML = escapeHtml(pergunta.enunciado);
  renderMathInElement(enunciadoEl, KATEX_OPTS);

  // imagem do enunciado (gráfico/figura), se a questão tiver
  const imgBox = document.getElementById('qImagem');
  imgBox.innerHTML = '';
  if (pergunta.imagem_url) {
    imgBox.style.display = 'block';
    const img = document.createElement('img');
    img.src = pergunta.imagem_url;
    img.alt = 'Imagem da questão';
    img.loading = 'lazy';
    img.onerror = function () { imgBox.style.display = 'none'; };
    imgBox.appendChild(img);
  } else {
    imgBox.style.display = 'none';
  }

  // "alternativas" é um objeto { "a": "...", "b": "...", ... } — jsonb não
  // garante ordem de chaves, então ordenamos por letra antes de renderizar.
  const letras = Object.keys(pergunta.alternativas || {}).sort();

  const altList = document.getElementById('altList');
  const imagensAlternativas = pergunta.alternativas_imagens || {};

  altList.innerHTML = '';
  letras.forEach(function (letra, i) {
    const texto = pergunta.alternativas[letra];
    const imgAlt = imagensAlternativas[letra];
    const btn = document.createElement('div');
    btn.className = 'alt-btn';
    btn.style.animationDelay = (i * 0.05) + 's';
    btn.dataset.letra = letra;
    btn.innerHTML =
      '<span class="alt-letra">' + escapeHtml(letra.toUpperCase()) + '</span>' +
      '<span class="alt-texto">' +
        (imgAlt ? '<img class="alt-img" src="' + escapeHtml(imgAlt) + '" alt="Imagem da alternativa ' + escapeHtml(letra.toUpperCase()) + '" loading="lazy" onerror="this.remove()">' : '') +
        '<span class="alt-texto-content">' + escapeHtml(texto) + '</span>' +
      '</span>' +
      '<button type="button" class="alt-cross-btn" title="Marcar como errada">×</button>';

    btn.onclick = function () { selecionarAlternativa(letra); };
    const crossBtn = btn.querySelector('.alt-cross-btn');
    crossBtn.onclick = function (ev) { ev.stopPropagation(); toggleRiscar(letra, btn, crossBtn); };

    if (estado.riscadas.has(letra)) {
      btn.classList.add('riscada');
      crossBtn.classList.add('active');
    }
    if (estado.selecionada === letra && !estado.respondida) btn.classList.add('selecionada');

    if (estado.respondida) {
      btn.classList.add('locked');
      if (letra === pergunta.gabarito) btn.classList.add('correta');
      else if (letra === estado.selecionada) btn.classList.add('errada');
    }

    altList.appendChild(btn);
    renderMathInElement(btn.querySelector('.alt-texto'), KATEX_OPTS);
  });

  const confirmRow = document.getElementById('confirmRow');
  const feedback = document.getElementById('feedback');

  if (estado.respondida) {
    confirmRow.style.display = 'none';
    mostrarFeedback(pergunta, estado);
    feedback.classList.add('show');
  } else {
    confirmRow.style.display = 'flex';
    document.getElementById('confirmarBtn').disabled = !estado.selecionada;
    feedback.classList.remove('show');
  }

  document.getElementById('anteriorBtn').disabled = indiceAtual === 0;
  document.getElementById('proximoBtn').textContent = (indiceAtual < perguntas.length - 1) ? 'Próxima →' : 'Finalizar missão →';
}

function selecionarAlternativa(letra) {
  const estado = estados[indiceAtual];
  if (estado.respondida) return;
  estado.selecionada = letra;
  document.querySelectorAll('.alt-btn').forEach(function (b) {
    b.classList.toggle('selecionada', b.dataset.letra === letra);
  });
  document.getElementById('confirmarBtn').disabled = false;
}

// ------------------------------------------------------------
// RISCAR ALTERNATIVA (reversível, sem limite — estilo sabre de luz)
// ------------------------------------------------------------
function toggleRiscar(letra, btnEl, crossBtnEl) {
  const estado = estados[indiceAtual];
  if (estado.respondida) return;

  if (estado.riscadas.has(letra)) {
    estado.riscadas.delete(letra);
    btnEl.classList.remove('riscada');
    crossBtnEl.classList.remove('active');
  } else {
    estado.riscadas.add(letra);
    // reinicia a animação do "corte" mesmo se já tinha sido riscada antes
    btnEl.classList.remove('riscada');
    void btnEl.offsetWidth;
    btnEl.classList.add('riscada');
    crossBtnEl.classList.add('active');
  }
}

// ------------------------------------------------------------
// CONFIRMAR RESPOSTA
// ------------------------------------------------------------
async function confirmarResposta() {
  const estado = estados[indiceAtual];
  if (estado.respondida || !estado.selecionada) return;

  const pergunta = perguntas[indiceAtual];
  const correta = estado.selecionada === pergunta.gabarito;
  const tempoSeg = Math.round((Date.now() - estado.tempoInicioMs) / 1000);

  estado.respondida = true;
  estado.correta = correta;

  let xpPergunta = 0;
  if (correta) {
    acertos++;
    xpPergunta = questlyXpDaQuestao(pergunta); // ponderado pela dificuldade
    if (jaAcertadasAntes.has(pergunta.id)) xpPergunta = Math.max(1, Math.round(xpPergunta / 2)); // repetida = metade
    // bônus de manutenção da maestria: tópico onde o aluno já é Mestre
    // paga 1.5x (por cima da regra de repetida — manter performance em
    // conteúdo dominado é retrieval de valor, não farming)
    if (topicosMestreInicio.has(pergunta.topic_id)) {
      xpPergunta = Math.round(xpPergunta * QUESTLY_MAESTRIA_MULT_XP);
    }
    xpGanho += xpPergunta;
    document.getElementById('xpCounter').textContent = '+' + xpGanho + ' XP';
  } else {
    erros++;
  }
  estado.xpConcedido = xpPergunta;

  // guarda a promise do insert: se o aluno classificar o motivo do erro,
  // o update precisa do id da tentativa recém-criada
  estado.attemptIdPromise = registrarTentativa(pergunta, correta, tempoSeg, estado.selecionada);
  atualizarEstatisticaTopico(pergunta.topic_id, correta);
  recalibrarTempoMedioQuestao(pergunta, tempoSeg);

  renderPergunta();

  if (correta) {
    animarAcerto(xpPergunta);
  } else {
    animarErro();
  }
}

function mostrarFeedback(pergunta, estado) {
  const banner = document.getElementById('feedbackBanner');
  banner.className = 'feedback-banner ' + (estado.correta ? 'ok' : 'bad');
  banner.innerHTML = estado.correta
    ? '<span class="feedback-ic">🎯</span><span>Isso aí! Resposta certa.</span>'
    : '<span class="feedback-ic">💥</span><span>Não foi dessa vez — a certa era a ' + escapeHtml(pergunta.gabarito.toUpperCase()) + '.</span>';

  const box = document.getElementById('resolucaoBox');
  if (pergunta.resolucao) {
    box.style.display = 'block';
    box.innerHTML = '<b>Resolução:</b><br>' + escapeHtml(pergunta.resolucao);
    renderMathInElement(box, KATEX_OPTS);
  } else {
    box.style.display = 'none';
  }

  // errou? pergunta o motivo (autópsia do erro — opcional)
  const motivoBox = document.getElementById('motivoErroBox');
  if (!estado.correta) {
    motivoBox.style.display = 'block';
    renderMotivoChips(estado);
  } else {
    motivoBox.style.display = 'none';
  }
}

async function registrarTentativa(pergunta, correta, tempoSeg, respostaMarcada) {
  const { data, error } = await supabaseClient.from('question_attempts').insert({
    user_id: currentUser.id,
    question_id: pergunta.id,
    mission_id: missao.id,
    resposta_marcada: respostaMarcada,
    correta: correta,
    tempo_gasto_seg: tempoSeg,
    tentativa_num: 1,
  }).select('id').single();
  if (error) { console.error('Erro ao registrar tentativa:', error); return null; }
  return data.id;
}

// ------------------------------------------------------------
// AUTÓPSIA DO ERRO (metacognição) — depois de errar, o aluno pode
// dizer POR QUE errou. O motivo vai pra question_attempts.motivo_erro
// e o chance-aprovacao.js penaliza menos erro de conta que erro de
// conceito. Classificar é opcional: dá pra seguir sem responder.
// ------------------------------------------------------------
const MOTIVOS_ERRO = [
  { valor: 'conceito', rotulo: '📚 Não sabia o conceito' },
  { valor: 'calculo', rotulo: '✏️ Errei a conta' },
  { valor: 'interpretacao', rotulo: '🔍 Interpretei errado' },
  { valor: 'chute', rotulo: '🎲 Chutei' },
];

function renderMotivoChips(estado) {
  const wrap = document.getElementById('motivoChips');
  wrap.innerHTML = '';
  MOTIVOS_ERRO.forEach(function (m) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'motivo-chip' + (estado.motivoErro === m.valor ? ' ativo' : '');
    chip.textContent = m.rotulo;
    chip.onclick = function () { classificarMotivoErro(estado, m.valor); };
    wrap.appendChild(chip);
  });
}

async function classificarMotivoErro(estado, motivo) {
  estado.motivoErro = motivo;
  renderMotivoChips(estado); // marca o chip escolhido na hora

  const attemptId = await estado.attemptIdPromise;
  if (!attemptId) return; // insert falhou — nada pra atualizar

  const { error } = await supabaseClient
    .from('question_attempts')
    .update({ motivo_erro: motivo })
    .eq('id', attemptId);
  if (error) console.error('Erro ao salvar motivo do erro:', error);
}

// O tópico é conteúdo compartilhado agora — o progresso é por (aluno,
// tópico), guardado em aluno_topico_progresso, não no tópico em si.
async function atualizarEstatisticaTopico(topicId, correta) {
  if (!topicId) return;
  const { data: progresso, error } = await supabaseClient
    .from('aluno_topico_progresso')
    .select('taxa_acerto, num_questoes_respondidas')
    .eq('user_id', currentUser.id)
    .eq('topico_id', topicId)
    .maybeSingle();

  if (error) { console.error('Erro ao buscar progresso do tópico:', error); return; }

  const numAnterior = (progresso && progresso.num_questoes_respondidas) || 0;
  const taxaAnterior = (progresso && progresso.taxa_acerto != null) ? progresso.taxa_acerto : 0;
  const novoNum = numAnterior + 1;
  const novaTaxa = (taxaAnterior * numAnterior + (correta ? 1 : 0)) / novoNum;

  const { error: upsertError } = await supabaseClient
    .from('aluno_topico_progresso')
    .upsert({
      user_id: currentUser.id,
      topico_id: topicId,
      taxa_acerto: novaTaxa,
      num_questoes_respondidas: novoNum,
      ultima_revisao: new Date().toISOString(),
    }, { onConflict: 'user_id,topico_id' });

  if (upsertError) console.error('Erro ao atualizar progresso do tópico:', upsertError);
}

// Corrige questions.tempo_medio_seg com o tempo real observado (média móvel
// exponencial), pra mission-engine.js dimensionar as próximas missões com
// base na realidade em vez de ficar preso na estimativa inicial.
async function recalibrarTempoMedioQuestao(pergunta, tempoSeg) {
  const anterior = pergunta.tempo_medio_seg;
  const novoTempoMedio = anterior ? Math.round(anterior * 0.7 + tempoSeg * 0.3) : tempoSeg;

  const { error } = await supabaseClient
    .from('questions')
    .update({ tempo_medio_seg: novoTempoMedio })
    .eq('id', pergunta.id);

  if (error) console.error('Erro ao recalibrar tempo médio da questão:', error);
  else pergunta.tempo_medio_seg = novoTempoMedio; // mantém coerente se a mesma pergunta for revisitada na sessão
}

// ------------------------------------------------------------
// ANIMAÇÕES DE FEEDBACK
// ------------------------------------------------------------
function animarAcerto(xp) {
  flashTela('flash-ok');
  const btn = document.querySelector('.alt-btn.correta');
  spawnXpFloat(btn, xp);
}

function animarErro() {
  flashTela('flash-bad');
}

function flashTela(classe) {
  const el = document.getElementById('screenFlash');
  el.className = 'screen-flash';
  void el.offsetWidth; // força reflow pra reiniciar a animação CSS
  el.classList.add(classe);
}

function spawnXpFloat(anchorEl, xp) {
  if (!anchorEl) return;
  const rect = anchorEl.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'xp-float';
  el.textContent = '+' + xp + ' XP';
  el.style.left = (rect.right - 60) + 'px';
  el.style.top = rect.top + 'px';
  document.body.appendChild(el);
  setTimeout(function () { el.remove(); }, 1200);
}

// ------------------------------------------------------------
// FINALIZAÇÃO DA MISSÃO
// ------------------------------------------------------------
async function finalizarMissao() {
  document.getElementById('questionView').classList.remove('active');

  const tempoGastoMinMissao = Math.max(1, Math.round((Date.now() - tempoInicioMissaoMs) / 60000));
  await supabaseClient.from('missions').update({ concluida: true, tempo_gasto_min: tempoGastoMinMissao }).eq('id', missao.id);

  await atualizarXpELiga();
  await atualizarStreakEDailyLog();
  const recapResultado = await avaliarRecap();
  await atualizarMetricasSubject();
  await celebrarNovasMaestrias();
  await prepararDesafioRecuperacao();

  document.getElementById('statAcertos').textContent = acertos;
  document.getElementById('statErros').textContent = erros;
  document.getElementById('statXp').textContent = xpGanho;
  document.getElementById('statTempo').textContent = tempoGastoMinMissao + ' min';
  document.getElementById('statTempoPrevisto').textContent = missao.tempo_previsto_min
    ? 'previsto: ~' + missao.tempo_previsto_min + ' min'
    : '';

  const total = acertos + erros;
  const taxa = total > 0 ? acertos / total : 0;

  if (recapResultado) {
    // recap: a tela fala do veredito "você já domina isso?" em vez do
    // texto genérico de missão
    if (recapResultado.dominou) {
      document.getElementById('resultIc').textContent = '✅';
      document.getElementById('resultTitle').textContent = 'Recap aprovado!';
      document.getElementById('resultSub').textContent = 'Você provou que domina esse tópico — ele saiu das suas missões. Pode focar no que falta.';
    } else {
      document.getElementById('resultIc').textContent = '📚';
      document.getElementById('resultTitle').textContent = 'Ainda vale revisar';
      document.getElementById('resultSub').textContent = 'Faltou pouco pra fechar o recap — esse tópico continua na sua trilha pra você reforçar.';
    }
  } else if (taxa >= 0.8) {
    document.getElementById('resultIc').textContent = '🏆';
    document.getElementById('resultTitle').textContent = 'Missão dominada!';
    document.getElementById('resultSub').textContent = 'Mandou muito bem — continue assim.';
  } else if (taxa >= 0.5) {
    document.getElementById('resultIc').textContent = '🎉';
    document.getElementById('resultTitle').textContent = 'Missão cumprida!';
    document.getElementById('resultSub').textContent = 'Bom progresso. Alguns pontos pra revisar.';
  } else {
    document.getElementById('resultIc').textContent = '💪';
    document.getElementById('resultTitle').textContent = 'Missão concluída';
    document.getElementById('resultSub').textContent = 'Foi difícil dessa vez — esses tópicos vão voltar em revisão.';
  }

  document.getElementById('resultView').classList.add('active');
}

// ------------------------------------------------------------
// MAESTRIA — depois da missão, checa se algum tópico ACABOU de cruzar
// a régua de Mestre (>= 90% em >= 20 questões) comparando com a foto
// tirada no início (topicosMestreInicio). Só celebra a conquista nova;
// o estado "Mestre" em si é derivado, não gravado (questlyEhMestre).
// ------------------------------------------------------------
async function celebrarNovasMaestrias() {
  const topicIds = Array.from(new Set(
    perguntas.map(function (p) { return p.topic_id; }).filter(Boolean)
  ));
  if (topicIds.length === 0) return;

  const { data: progs } = await supabaseClient
    .from('aluno_topico_progresso')
    .select('topico_id, taxa_acerto, num_questoes_respondidas')
    .eq('user_id', currentUser.id)
    .in('topico_id', topicIds);

  const novosMestres = (progs || []).filter(function (p) {
    return questlyEhMestre(p) && !topicosMestreInicio.has(p.topico_id);
  });
  if (novosMestres.length === 0) return;

  const { data: topicos } = await supabaseClient
    .from('topicos')
    .select('id, nome')
    .in('id', novosMestres.map(function (p) { return p.topico_id; }));

  const nomes = (topicos || []).map(function (t) { return t.nome; }).join(', ');
  const boxEl = document.getElementById('mestreBox');
  boxEl.style.display = 'block';
  boxEl.innerHTML =
    '<div class="mestre-titulo">🏅 Novo distintivo de Mestre!</div>' +
    '<div class="mestre-texto">Você atingiu 90%+ de acerto em <b>' + escapeHtml(nomes) + '</b>. ' +
    'A partir de agora, questões desse tópico pagam <b>XP em 1.5x</b> pra manter a coroa.</div>';
}

// ------------------------------------------------------------
// DESAFIO DE RECUPERAÇÃO (retrieval practice) — ao fim da missão do
// dia, oferece UMA questão aleatória de um tópico que o aluno não
// toca há mais de DESAFIO_DIAS_SEM_TOCAR dias. Vira uma missão avulsa
// de 1 questão (mesma infra/XP/RLS de sempre). Só aparece depois de
// missões não-avulsas, pra não virar corrente infinita de desafios.
// ------------------------------------------------------------
const DESAFIO_DIAS_SEM_TOCAR = 7;

async function prepararDesafioRecuperacao() {
  if (missao.avulsa) return;

  // tópicos que o aluno estuda (das matérias das disciplinas dele)
  const { data: meusSubjects } = await supabaseClient
    .from('subjects')
    .select('id, materia_id')
    .eq('user_id', currentUser.id);
  const materiaIds = (meusSubjects || []).map(function (s) { return s.materia_id; }).filter(Boolean);
  if (materiaIds.length === 0) return;

  const { data: topicos } = await supabaseClient
    .from('topicos')
    .select('id, nome, materia_id')
    .in('materia_id', materiaIds);
  const topicoPorId = {};
  (topicos || []).forEach(function (t) { topicoPorId[t.id] = t; });

  // progresso "empoeirado": já estudado, não pulado, sem toque há 7+ dias
  const corte = new Date(Date.now() - DESAFIO_DIAS_SEM_TOCAR * 24 * 60 * 60 * 1000).toISOString();
  const { data: empoeirados } = await supabaseClient
    .from('aluno_topico_progresso')
    .select('topico_id, status, num_questoes_respondidas, ultima_revisao')
    .eq('user_id', currentUser.id)
    .gt('num_questoes_respondidas', 0)
    .lt('ultima_revisao', corte);

  const candidatos = (empoeirados || []).filter(function (p) {
    return p.status !== 'pulado' && topicoPorId[p.topico_id];
  });
  if (candidatos.length === 0) return;

  const sorteado = candidatos[Math.floor(Math.random() * candidatos.length)];
  const topico = topicoPorId[sorteado.topico_id];

  const { data: questoesTopico } = await supabaseClient
    .from('questions')
    .select('id, dificuldade, tempo_medio_seg')
    .eq('topic_id', topico.id);
  if (!questoesTopico || questoesTopico.length === 0) return;
  const questaoDesafio = questoesTopico[Math.floor(Math.random() * questoesTopico.length)];

  const diasSemTocar = Math.round((Date.now() - new Date(sorteado.ultima_revisao).getTime()) / (1000 * 60 * 60 * 24));

  const boxEl = document.getElementById('desafioBox');
  boxEl.style.display = 'block';
  boxEl.innerHTML =
    '<div class="desafio-titulo">🧠 Desafio de Recuperação</div>' +
    '<div class="desafio-texto">Você não toca em <b>' + escapeHtml(topico.nome) + '</b> há ' + diasSemTocar +
    ' dias. Resgatar da memória agora é o que fixa de verdade. Topa 1 questão?</div>' +
    '<button type="button" class="btn btn-gold" id="desafioBtn">Aceitar desafio ⚡</button>';

  document.getElementById('desafioBtn').onclick = async function () {
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Preparando...';

    const meuSubject = (meusSubjects || []).find(function (s) { return s.materia_id === topico.materia_id; });
    const { data: missaoDesafio, error } = await supabaseClient
      .from('missions')
      .insert({
        user_id: currentUser.id,
        subject_id: (meuSubject && meuSubject.id) || missao.subject_id,
        data: new Date().toISOString().slice(0, 10),
        topic_ids: [topico.id],
        question_ids: [questaoDesafio.id],
        qtd_questoes: 1,
        tempo_previsto_min: questaoDesafio.tempo_medio_seg ? Math.max(1, Math.round(questaoDesafio.tempo_medio_seg / 60)) : null,
        xp_recompensa: questlyXpDaQuestao(questaoDesafio),
        concluida: false,
        avulsa: true, // não ocupa o slot da missão do dia e não gera novo desafio ao terminar
      })
      .select('id')
      .single();

    if (error || !missaoDesafio) {
      console.error('Erro ao criar desafio de recuperação:', error);
      btn.disabled = false;
      btn.textContent = 'Aceitar desafio ⚡';
      return;
    }
    window.location.href = 'questao.html?missao=' + missaoDesafio.id;
  };
}

// ------------------------------------------------------------
// RECAP — missão curta de um tópico só (recap_topico_id) que o aluno
// marcou "acho que já sei" na trilha. Se acertar >= RECAP_APROVACAO,
// o tópico vira 'dominado' e sai das missões do dia; senão continua
// pendente. O recap paga XP normal (respondeu questões de verdade),
// diferente de "pular" (que é declarado, sem XP).
// ------------------------------------------------------------
const RECAP_APROVACAO = 0.7;

async function avaliarRecap() {
  if (!missao || !missao.recap_topico_id) return null;

  const total = acertos + erros;
  const taxa = total > 0 ? acertos / total : 0;
  const dominou = taxa >= RECAP_APROVACAO;

  if (dominou) {
    // upsert do status; taxa_acerto/num já foram atualizados por
    // atualizarEstatisticaTopico a cada questão respondida
    const { error } = await supabaseClient
      .from('aluno_topico_progresso')
      .upsert({
        user_id: currentUser.id,
        topico_id: missao.recap_topico_id,
        status: 'dominado',
        ultima_revisao: new Date().toISOString(),
      }, { onConflict: 'user_id,topico_id' });
    if (error) console.error('Erro ao marcar tópico como dominado:', error);
  }

  return { dominou: dominou, taxa: taxa };
}

// Soma XP total + XP/contagem da semana (ranking em ligas, ver js/liga.js).
// Passa pelo virador de semana primeiro pra garantir que está somando no
// balde da semana certa — ele mesmo já zera sozinho se a semana rolou.
async function atualizarXpELiga() {
  const estado = await questlyGarantirSemanaLiga(currentUser);

  const { data: profile } = await supabaseClient.from('profiles').select('xp_total').eq('id', currentUser.id).single();
  const novoXpTotal = ((profile && profile.xp_total) || 0) + xpGanho;
  const novoXpSemana = ((estado && estado.xp_semana) || 0) + xpGanho;
  const novasQuestoesSemana = ((estado && estado.questoes_semana) || 0) + (acertos + erros);

  await supabaseClient
    .from('profiles')
    .update({ xp_total: novoXpTotal, xp_semana: novoXpSemana, questoes_semana: novasQuestoesSemana })
    .eq('id', currentUser.id);
}

async function atualizarStreakEDailyLog() {
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: logHoje } = await supabaseClient
    .from('daily_logs')
    .select('data')
    .eq('user_id', currentUser.id)
    .eq('data', hoje)
    .maybeSingle();

  await supabaseClient
    .from('daily_logs')
    .upsert({ user_id: currentUser.id, data: hoje, estudou: true }, { onConflict: 'user_id,data' });

  if (!logHoje) {
    const { data: profile } = await supabaseClient.from('profiles').select('streak_atual').eq('id', currentUser.id).single();
    const novoStreak = ((profile && profile.streak_atual) || 0) + 1;
    await supabaseClient.from('profiles').update({ streak_atual: novoStreak }).eq('id', currentUser.id);
  }
}

// Recalcula cobertura/precisão/frequência reais (js/chance-aprovacao.js) e
// grava: preparo_percentual do boss mais próximo (cobertura) e
// subjects.chance_aprovacao (fórmula completa, ou null se ainda não há
// questões suficientes respondidas — mostra "sem dados" no dashboard).
async function atualizarMetricasSubject() {
  if (!missao.subject_id) return;

  const { data: subject } = await supabaseClient
    .from('subjects')
    .select('id, nota_desejada, materia_id')
    .eq('id', missao.subject_id)
    .single();
  if (!subject || !subject.materia_id) return;

  const { data: topicosMateria } = await supabaseClient
    .from('topicos')
    .select('id')
    .eq('materia_id', subject.materia_id)
    .eq('cai_na_prova', true);

  const topicoIds = (topicosMateria || []).map(function (t) { return t.id; });
  const { data: progressos } = topicoIds.length > 0
    ? await supabaseClient
        .from('aluno_topico_progresso')
        .select('topico_id, taxa_acerto, num_questoes_respondidas, status')
        .eq('user_id', currentUser.id)
        .in('topico_id', topicoIds)
    : { data: [] };

  // tópicos sem progresso ainda entram como 0/0 (aluno nunca respondeu).
  // Tópicos marcados 'pulado' saem da conta: o aluno declarou que já sabe,
  // então não é justo contá-los como 0% de cobertura puxando a chance pra
  // baixo. 'dominado' fica (tem dado real do recap). Se ele pulou tudo,
  // o gate de dados mínimos (js/chance-aprovacao.js) ainda segura o número.
  const progressoPorTopico = {};
  (progressos || []).forEach(function (p) { progressoPorTopico[p.topico_id] = p; });
  const topicos = topicoIds
    .map(function (id) {
      return progressoPorTopico[id] || { taxa_acerto: 0, num_questoes_respondidas: 0, status: 'pendente' };
    })
    .filter(function (t) { return t.status !== 'pulado'; });

  const { data: bosses } = await supabaseClient
    .from('bosses')
    .select('id, data_prova, preparo_percentual')
    .eq('subject_id', missao.subject_id);

  const hoje = new Date(new Date().toDateString());
  const futuros = (bosses || [])
    .filter(function (b) { return new Date(b.data_prova) >= hoje; })
    .sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); });
  const bossAlvo = futuros[0] || null;
  const diasRestantes = bossAlvo ? Math.round((new Date(bossAlvo.data_prova) - hoje) / (1000 * 60 * 60 * 24)) : null;

  const janelaInicio = new Date();
  janelaInicio.setDate(janelaInicio.getDate() - (FREQUENCIA_JANELA_DIAS - 1));
  const { data: logs } = await supabaseClient
    .from('daily_logs')
    .select('estudou')
    .eq('user_id', currentUser.id)
    .gte('data', janelaInicio.toISOString().slice(0, 10));
  const diasEstudados = (logs || []).filter(function (l) { return l.estudou; }).length;

  // metacognição: conta os erros CLASSIFICADOS do aluno nas questões dessa
  // matéria — chance-aprovacao.js perdoa parte da penalidade de erro de
  // conta/interpretação (o aluno sabia o conceito). Uma linha por questão
  // da matéria, mesmo padrão de escala do mission-engine.
  const errosPorMotivo = {};
  if (topicoIds.length > 0) {
    const { data: questoesMateria } = await supabaseClient
      .from('questions')
      .select('id')
      .in('topic_id', topicoIds);
    const questaoIds = (questoesMateria || []).map(function (q) { return q.id; });
    if (questaoIds.length > 0) {
      const { data: errosClassificados } = await supabaseClient
        .from('question_attempts')
        .select('motivo_erro')
        .eq('user_id', currentUser.id)
        .eq('correta', false)
        .not('motivo_erro', 'is', null)
        .in('question_id', questaoIds);
      (errosClassificados || []).forEach(function (a) {
        errosPorMotivo[a.motivo_erro] = (errosPorMotivo[a.motivo_erro] || 0) + 1;
      });
    }
  }

  const metricas = questlyCalcularMetricas(subject, topicos || [], diasRestantes, diasEstudados, errosPorMotivo);

  if (bossAlvo) {
    await supabaseClient
      .from('bosses')
      .update({ preparo_percentual: Math.round(metricas.coberturaMedia * 100) })
      .eq('id', bossAlvo.id);
  }

  await supabaseClient
    .from('subjects')
    .update({ chance_aprovacao: metricas.chanceAprovacao })
    .eq('id', subject.id);
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
