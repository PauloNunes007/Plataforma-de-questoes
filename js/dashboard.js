// ============================================================
// QUESTLY — dashboard.js
// Busca os dados reais do aluno logado no Supabase e preenche
// o dashboard. Se algo ainda não existir (missão, boss), mostra
// um estado vazio em vez de inventar números.
//
// Novo: trilha estilo Duolingo — cada nó é um dia de estudo
// (dias_disponiveis do onboarding) até o Boss (a prova).
// ============================================================

const XP_POR_NIVEL = 1000; // ajuste depois se quiser curva de XP diferente

document.addEventListener('DOMContentLoaded', iniciarDashboard);

async function iniciarDashboard() {
  const user = await questlyExigirLogin(); // redireciona pro login se não houver sessão
  if (!user) return;

  const profile = await carregarProfile(user);
  const subjects = await carregarDisciplinas(user, profile);
  const missaoInfo = await carregarMissoesDoDia(user, profile);
  await carregarTrilha(user, profile, subjects, missaoInfo);
  await carregarBoss(user);
  await carregarLiga(user);
  await carregarStreak(user);
  await carregarCalendario(user, subjects);
}

// ------------------------------------------------------------
// LIGA (card compacto — o ranking completo mora em questly_ranking.html)
// ------------------------------------------------------------
async function carregarLiga(user) {
  const estado = await questlyGarantirSemanaLiga(user);
  const card = document.getElementById('ligaCard');
  if (!estado) { card.style.display = 'none'; return; }

  const info = QUESTLY_LIGA_INFO[estado.liga] || QUESTLY_LIGA_INFO.bronze;
  document.getElementById('ligaIcone').textContent = info.icone;
  document.getElementById('ligaNome').textContent = info.nome;
  document.getElementById('ligaXp').textContent = (estado.xp_semana || 0) + ' XP essa semana';
}

// ------------------------------------------------------------
// PROFILE (nome, curso, XP total, nível)
// ------------------------------------------------------------
async function carregarProfile(user) {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Erro ao carregar profile:', error);
    document.getElementById('greeting').textContent = 'Bem-vindo(a) 👋';
    return null;
  }

  const primeiroNome = profile.nome ? profile.nome.split(' ')[0] : 'Aluno(a)';
  document.getElementById('greeting').textContent = saudacaoPorHorario() + ', ' + primeiroNome + ' 👋';
  document.getElementById('sideName').textContent = profile.nome || 'Aluno(a)';
  questlyRenderAvatar(document.getElementById('sideAvatar'), profile);
  document.getElementById('sideCourse').textContent =
    [profile.curso, profile.semestre ? profile.semestre + 'º sem' : null].filter(Boolean).join(' · ');

  const xp = profile.xp_total || 0;
  const nivel = profile.nivel || 1;
  document.getElementById('levelBadge').textContent = 'N' + nivel;
  document.getElementById('levelNum').textContent = 'Nível ' + nivel;
  document.getElementById('xpTotalNum').textContent = xp.toLocaleString('pt-BR') + ' XP na campanha';

  const xpNoNivelAtual = xp % XP_POR_NIVEL;
  const pct = Math.min(100, (xpNoNivelAtual / XP_POR_NIVEL) * 100);
  document.getElementById('xpBarFill').style.width = pct + '%';
  document.getElementById('xpBarCurrent').textContent = xpNoNivelAtual.toLocaleString('pt-BR') + ' XP';
  document.getElementById('xpBarTarget').textContent = XP_POR_NIVEL.toLocaleString('pt-BR') + ' XP p/ nível ' + (nivel + 1);
  document.getElementById('streakNum').textContent = profile.streak_atual || 0;

  return profile;
}

function saudacaoPorHorario() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ------------------------------------------------------------
// DISCIPLINAS (lista compacta na coluna direita)
// ------------------------------------------------------------
const EMOJIS_DISCIPLINA = ['📘', '📕', '📗', '📙', '📒', '📓'];

async function carregarDisciplinas(user, profile) {
  const { data: subjects, error } = await supabaseClient
    .from('subjects')
    .select('*, bosses(id, nome, data_prova, preparo_percentual)')
    .eq('user_id', user.id);

  const list = document.getElementById('subjectList');
  const countEl = document.getElementById('subjectCount');

  if (error) {
    console.error('Erro ao carregar disciplinas:', error);
    list.innerHTML = '<p style="color:var(--text-soft);font-size:13px;font-weight:600;">Não foi possível carregar suas disciplinas.</p>';
    return [];
  }

  if (!subjects || subjects.length === 0) {
    countEl.textContent = '';
    list.innerHTML = `
      <p style="font-size:13px;color:var(--text-dim);font-weight:600;margin-bottom:14px;">
        Você ainda não configurou nenhuma disciplina.
      </p>
      <a class="btn btn-primary" style="width:100%;" href="questly_onboarding.html">Configurar</a>`;
    document.getElementById('subheading').textContent = 'Vamos configurar sua primeira campanha.';
    return [];
  }

  countEl.textContent = subjects.length + (subjects.length === 1 ? ' ativa' : ' ativas');

  list.innerHTML = subjects.map(function (s, i) {
    const bossesFuturos = (s.bosses || [])
      .filter(function (b) { return new Date(b.data_prova) >= new Date(new Date().toDateString()); })
      .sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); });
    const proximoBoss = bossesFuturos[0];
    const diasBoss = proximoBoss ? diasAte(proximoBoss.data_prova) : null;

    // "% preparado" = cobertura real do boss mais próximo (calculada em js/chance-aprovacao.js
    // e gravada em bosses.preparo_percentual ao concluir uma missão) — não é derivado de XP.
    const preparo = proximoBoss && proximoBoss.preparo_percentual != null ? Math.round(proximoBoss.preparo_percentual) : 0;
    const aprovacao = s.chance_aprovacao != null ? Math.round(s.chance_aprovacao) : null;

    return `
      <div class="subject-row">
        <div class="subject-emo">${EMOJIS_DISCIPLINA[i % EMOJIS_DISCIPLINA.length]}</div>
        <div class="subject-info">
          <b>${escapeHtml(s.nome)}</b>
          <span>${proximoBoss ? 'Boss em ' + diasBoss + ' dias' : 'Sem prova marcada'} · Nv. ${s.nivel || 1}</span>
          <div class="mini-track"><div class="mini-fill" style="width:${proximoBoss ? preparo : 0}%;"></div></div>
        </div>
        <div class="subject-pct">${aprovacao != null ? aprovacao + '%' : '–'}</div>
      </div>`;
  }).join('');

  // usa a disciplina com boss mais próximo pro subtítulo do topo
  const comBoss = subjects
    .map(function (s) {
      const proximos = (s.bosses || []).filter(function (b) { return new Date(b.data_prova) >= new Date(new Date().toDateString()); });
      return { nome: s.nome, boss: proximos.sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); })[0] };
    })
    .filter(function (x) { return x.boss; })
    .sort(function (a, b) { return new Date(a.boss.data_prova) - new Date(b.boss.data_prova); })[0];

  document.getElementById('subheading').textContent = comBoss
    ? `Sua campanha de ${comBoss.nome} está a ${diasAte(comBoss.boss.data_prova)} dias do Boss ${comBoss.boss.nome}.`
    : 'Nenhuma prova marcada ainda.';

  return subjects;
}

// ------------------------------------------------------------
// MISSÕES DO DIA (um card por disciplina agendada na grade semanal
// de hoje — js/rotina-engine.js). Busca/gera via
// questlyGerarMissoesDoDia (mission-engine.js), que já devolve o
// conjunto completo (existentes + recém-geradas) e é idempotente.
// Retorna { missoes, todasConcluidas, semMissao, motivo } pra trilha usar.
// ------------------------------------------------------------
async function carregarMissoesDoDia(user, profile) {
  const resultado = await questlyGerarMissoesDoDia(user, profile);
  const lista = document.getElementById('missionBannerList');

  if (!resultado || resultado.semMissaoHoje || resultado.missoes.length === 0) {
    const motivo = (resultado && resultado.motivo) || 'Não foi possível gerar sua missão agora. Tente recarregar a página.';
    lista.innerHTML = bannerVazioHtml('💤 Sem missão hoje', 'Dia de descanso', motivo);
    return { missoes: [], todasConcluidas: false, semMissao: true, motivo: motivo };
  }

  const missoes = resultado.missoes;
  const todasConcluidas = missoes.every(function (m) { return m.concluida; });

  lista.innerHTML = missoes.map(function (m, i) { return bannerMissaoHtml(m, i); }).join('');

  const promessasMestre = [];
  missoes.forEach(function (m, i) {
    const card = document.getElementById('missionCard-' + i);
    const btn = card.querySelector('.mission-card-btn');
    if (btn) {
      btn.onclick = function () { window.location.href = 'questao.html?missao=' + m.id; };
    }
    if (!m.concluida) promessasMestre.push(pintarMissaoDeMestre(user, m, card));
  });
  await Promise.all(promessasMestre);

  return { missoes: missoes, todasConcluidas: todasConcluidas, semMissao: false, motivo: null };
}

function bannerMissaoHtml(missao, indice) {
  const concluida = missao.concluida;
  const kicker = concluida ? '⭐ Cumprida' : '🎯 Missão do dia';
  const titulo = missao.subjects ? missao.subjects.nome : 'Missão do dia';
  const desc = concluida
    ? 'Cumprida! Quer mais uma rodada dessa disciplina? XP extra pra acelerar a campanha.'
    : 'Gerada com base no seu progresso e nas provas mais próximas.';
  const qtd = missao.qtd_questoes ?? '-';
  const tempo = missao.tempo_previsto_min ? '~' + missao.tempo_previsto_min + ' min' : 'calculando...';
  const xp = missao.xp_recompensa || 0;
  const botaoTexto = concluida ? 'Praticar mais' : 'Começar missão';

  return `
    <div class="banner" id="missionCard-${indice}">
      <div class="banner-top"><span class="banner-kicker">${kicker}</span></div>
      <h2>${escapeHtml(titulo)}</h2>
      <div class="desc">${escapeHtml(desc)}</div>
      <div class="banner-chips">
        <span class="chip">📝 <b>${qtd}</b> questões</span>
        <span class="chip">⏱️ <b>${tempo}</b></span>
        <span class="chip">⚡ <b>${xp}</b> XP</span>
      </div>
      <button class="btn btn-white mission-card-btn">${botaoTexto}</button>
    </div>`;
}

function bannerVazioHtml(kicker, titulo, motivo) {
  return `
    <div class="banner">
      <div class="banner-top"><span class="banner-kicker">${kicker}</span></div>
      <h2>${escapeHtml(titulo)}</h2>
      <div class="desc">${escapeHtml(motivo || '')}</div>
    </div>`;
}

// Maestria: se TODOS os tópicos da missão já são 'Mestre' do aluno
// (questlyEhMestre — >= 90% em >= 20 questões), o card vira dourado:
// é uma missão de manutenção, com XP em 1.5x (ver js/questao.js).
async function pintarMissaoDeMestre(user, missao, cardEl) {
  const topicIds = missao.topic_ids || [];
  if (topicIds.length === 0 || !cardEl) return;

  const { data: progressos } = await supabaseClient
    .from('aluno_topico_progresso')
    .select('topico_id, taxa_acerto, num_questoes_respondidas')
    .eq('user_id', user.id)
    .in('topico_id', topicIds);

  const progPorTopico = {};
  (progressos || []).forEach(function (p) { progPorTopico[p.topico_id] = p; });
  const todosMestre = topicIds.every(function (id) { return questlyEhMestre(progPorTopico[id]); });
  if (!todosMestre) return;

  cardEl.classList.add('mestre');
  const kickerEl = cardEl.querySelector('.banner-kicker');
  const descEl = cardEl.querySelector('.desc');
  if (kickerEl) kickerEl.textContent = '🏅 Missão de Mestre';
  if (descEl) descEl.textContent = 'Você já domina essa disciplina — mantenha a coroa e leve XP em 1.5x.';
}

// ------------------------------------------------------------
// TRILHA (estilo Duolingo)
// Cada nó = um dia de estudo entre os últimos dias e a prova
// mais próxima. Passado: verde (missão concluída) ou cinza
// (perdida). Hoje: nó ativo pulsando + mascote. Futuro: cadeado.
// Fim da trilha: o Boss (a prova).
// ------------------------------------------------------------
const OFFSETS_TRILHA = [0, 45, 80, 45, 0, -45, -80, -45];
const DOW_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const ICONE_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>';
const ICONE_ESTRELA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.3 1.3-6.5L2.5 9.5l6.6-.8z"/></svg>';
const ICONE_CADEADO = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10V8A5 5 0 0 0 7 8v2H5v12h14V10h-2zm-8-2a3 3 0 0 1 6 0v2H9V8z"/></svg>';
const ICONE_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';

async function carregarTrilha(user, profile, subjects, missaoInfo) {
  const wrap = document.getElementById('pathNodes');

  if (!subjects || subjects.length === 0) {
    wrap.innerHTML = `
      <div class="path-empty" style="width:100%;">
        <div class="emo">🗺️</div>
        <p>Sua trilha nasce aqui: configure suas disciplinas e as datas das provas.</p>
        <a class="btn btn-primary" href="questly_onboarding.html">Montar minha campanha</a>
      </div>`;
    return;
  }

  const hoje = new Date(new Date().toDateString());

  // disciplina-alvo = a com boss futuro mais próximo (mesmo critério do mission-engine)
  const alvo = subjects
    .map(function (s) {
      const futuros = (s.bosses || [])
        .filter(function (b) { return new Date(b.data_prova) >= hoje; })
        .sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); });
      return { subject: s, boss: futuros[0] || null };
    })
    .filter(function (x) { return x.boss; })
    .sort(function (a, b) { return new Date(a.boss.data_prova) - new Date(b.boss.data_prova); })[0];

  if (!alvo) {
    wrap.innerHTML = `
      <div class="path-empty" style="width:100%;">
        <div class="emo">⚔️</div>
        <p>Cadastre a data da sua próxima prova pra gerar o roteiro até o Boss.</p>
        <a class="btn btn-primary" href="questly_configuracoes.html">Cadastrar prova</a>
      </div>`;
    return;
  }

  const exam = new Date(new Date(alvo.boss.data_prova).toDateString());

  // dias de estudo escolhidos no onboarding (vazio = todos os dias)
  let diasSet = null;
  if (profile && profile.dias_disponiveis && profile.dias_disponiveis.length > 0) {
    diasSet = new Set(profile.dias_disponiveis.map(questlyNormalizarDia));
  }
  function ehDiaDeEstudo(d) { return !diasSet || diasSet.has(DOW_ABREV[d.getDay()]); }

  // últimos 5 dias de estudo (histórico curto pra dar contexto)
  const passados = [];
  let d = addDias(hoje, -1);
  for (let guard = 0; passados.length < 5 && guard < 30; guard++) {
    if (ehDiaDeEstudo(d)) passados.unshift(new Date(d));
    d = addDias(d, -1);
  }

  // hoje + todos os dias de estudo até a véspera da prova
  const futuros = [];
  d = new Date(hoje);
  while (d < exam) {
    if (d.getTime() === hoje.getTime() || ehDiaDeEstudo(d)) futuros.push(new Date(d));
    d = addDias(d, 1);
  }

  const datas = passados.concat(futuros);

  // dias em que o aluno concluiu missão (qualquer disciplina conta como
  // "cumpriu o dia" — a trilha mede o ritmo de estudo, não só essa matéria)
  const inicioStr = toISODate(datas[0] || hoje);
  const { data: missoes } = await supabaseClient
    .from('missions')
    .select('data, concluida')
    .eq('user_id', user.id)
    .gte('data', inicioStr);

  const cumpriuNoDia = {};
  (missoes || []).forEach(function (m) { if (m.concluida) cumpriuNoDia[m.data] = true; });

  // contagem pro topo do banner
  const missoesRestantes = futuros.filter(function (dt) { return dt.getTime() > hoje.getTime(); }).length
    + (missaoInfo && missaoInfo.todasConcluidas ? 0 : 1);
  document.getElementById('bannerDays').textContent =
    '⚔️ ' + diasAte(alvo.boss.data_prova) + ' dias · ' + missoesRestantes + (missoesRestantes === 1 ? ' missão até a prova' : ' missões até a prova');

  // monta os nós
  let html = '';
  let divisorSemanaInserido = false;
  const hojeStr = toISODate(hoje);

  datas.forEach(function (dt, i) {
    const offset = OFFSETS_TRILHA[i % OFFSETS_TRILHA.length];
    const dtStr = toISODate(dt);
    const label = DOW_ABREV[dt.getDay()] + ' ' + dt.getDate();
    const diasPraProva = Math.round((exam - dt) / 86400000);

    // divisor "semana da prova" antes do primeiro nó a ≤7 dias do boss
    if (!divisorSemanaInserido && diasPraProva <= 7 && i > 0) {
      html += '<div class="path-divider">🔥 Semana da prova</div>';
      divisorSemanaInserido = true;
    }

    if (dtStr === hojeStr) {
      const semMissao = missaoInfo && missaoInfo.semMissao && !missaoInfo.todasConcluidas;
      const feita = missaoInfo && missaoInfo.todasConcluidas;
      const classe = semMissao ? 'rest' : (feita ? 'active done-today' : 'active');
      const bolha = semMissao ? 'Descanso' : (feita ? 'Concluída!' : 'Começar');
      const icone = semMissao ? '<span style="font-size:26px;">💤</span>' : (feita ? ICONE_CHECK : ICONE_ESTRELA);
      const ladoMascote = offset <= 0 ? 'lado-direito' : 'lado-esquerdo';

      html += `
        <div class="path-node ${classe}" style="transform:translateX(${offset}px);">
          <div class="start-bubble">${bolha}</div>
          <div class="node-ring"><button class="node-btn" id="nodeHoje" title="Hoje">${icone}</button></div>
          <img class="mascote ${ladoMascote}" src="img/mascote.png" alt="" onerror="this.remove()">
          <span class="node-date">Hoje</span>
        </div>`;
      return;
    }

    let classe, icone, titulo;
    if (dt < hoje) {
      const feita = cumpriuNoDia[dtStr];
      classe = feita ? 'done' : 'missed';
      icone = feita ? ICONE_CHECK : ICONE_X;
      titulo = feita ? 'Missão concluída' : 'Missão não realizada';
    } else {
      classe = 'locked';
      icone = ICONE_CADEADO;
      titulo = 'Desbloqueia em ' + label;
    }

    html += `
      <div class="path-node ${classe}" style="transform:translateX(${offset}px);">
        <button class="node-btn" title="${titulo}">${icone}</button>
        <span class="node-date">${label}</span>
      </div>`;
  });

  // nó final: o Boss (a prova)
  html += `
    <div class="path-node boss">
      <button class="node-btn" title="${escapeHtml(alvo.subject.nome + ' — ' + alvo.boss.nome)}">⚔️</button>
      <div class="boss-flag">${escapeHtml(alvo.boss.nome)} · ${escapeHtml(alvo.subject.nome)}</div>
      <span class="node-date">${fmtDataCurta(exam)}</span>
    </div>`;

  wrap.innerHTML = html;

  // nó de hoje leva pra missão — direto se só tem uma pendente hoje,
  // ou rola até a lista de cards se tem mais de uma disciplina agendada
  const nodeHoje = document.getElementById('nodeHoje');
  const pendentesHoje = missaoInfo && missaoInfo.missoes ? missaoInfo.missoes.filter(function (m) { return !m.concluida; }) : [];
  if (nodeHoje && pendentesHoje.length === 1) {
    nodeHoje.onclick = function () {
      window.location.href = 'questao.html?missao=' + pendentesHoje[0].id;
    };
  } else if (nodeHoje && pendentesHoje.length > 1) {
    nodeHoje.onclick = function () {
      const lista = document.getElementById('missionBannerList');
      if (lista) lista.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
  }

  // se o nó ativo ficou abaixo da dobra, centraliza nele suavemente
  setTimeout(function () {
    const ativo = wrap.querySelector('.path-node.active, .path-node.rest');
    if (!ativo) return;
    const r = ativo.getBoundingClientRect();
    if (r.top > window.innerHeight - 140) {
      ativo.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, 450);
}

// ------------------------------------------------------------
// BOSS ATUAL (o mais próximo entre todas as disciplinas)
// ------------------------------------------------------------
async function carregarBoss(user) {
  const { data: subjects } = await supabaseClient
    .from('subjects')
    .select('id, nome, chance_aprovacao, bosses(id, nome, data_prova, preparo_percentual)')
    .eq('user_id', user.id);

  const bossCard = document.getElementById('bossCard');
  if (!subjects) { bossCard.style.display = 'none'; return; }

  const todosBosses = subjects.flatMap(function (s) {
    return (s.bosses || []).map(function (b) { return Object.assign({}, b, { subjectNome: s.nome, aprovacao: s.chance_aprovacao }); });
  }).filter(function (b) { return new Date(b.data_prova) >= new Date(new Date().toDateString()); })
    .sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); });

  const proximo = todosBosses[0];

  if (!proximo) {
    bossCard.innerHTML = '<div class="card-label">Boss atual</div><p style="font-size:13px;color:var(--text-soft);font-weight:600;">Nenhuma prova cadastrada ainda.</p>';
    return;
  }

  document.getElementById('bossName').textContent = proximo.subjectNome + ' — ' + proximo.nome;
  document.getElementById('bossCountdown').textContent = 'Prova em ' + diasAte(proximo.data_prova) + ' dias';
  document.getElementById('bossHpFill').style.width = (proximo.preparo_percentual || 0) + '%';
  document.getElementById('bossPrep').textContent = 'Preparação: ' + Math.round(proximo.preparo_percentual || 0) + '%';
  document.getElementById('bossTopics').textContent = '';
  document.getElementById('bossApproval').textContent = proximo.aprovacao != null ? Math.round(proximo.aprovacao) + '%' : '-';
}

// ------------------------------------------------------------
// STREAK (heatmap simplificado a partir de daily_logs)
// ------------------------------------------------------------
async function carregarStreak(user) {
  const dezDiasAtras = new Date();
  dezDiasAtras.setDate(dezDiasAtras.getDate() - 9);

  const { data: logs } = await supabaseClient
    .from('daily_logs')
    .select('data, estudou')
    .eq('user_id', user.id)
    .gte('data', dezDiasAtras.toISOString().slice(0, 10));

  const heat = document.getElementById('heatGrid');
  const porData = {};
  (logs || []).forEach(function (l) { porData[l.data] = l.estudou; });

  let html = '';
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    const estudou = porData[chave];
    html += `<div class="${estudou ? 'l3' : ''}"></div>`;
  }
  heat.innerHTML = html;
}

// ------------------------------------------------------------
// CALENDÁRIO (mês atual, com provas e dias estudados reais)
// ------------------------------------------------------------
const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

async function carregarCalendario(user, subjects) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth(); // 0-indexado
  const primeiroDia = new Date(ano, mes, 1);
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const offsetSemana = primeiroDia.getDay();

  document.getElementById('calMonthLabel').textContent = MESES_PT[mes] + ' ' + ano;

  // provas do mês corrente, de todas as disciplinas
  const provasPorDia = {};
  (subjects || []).forEach(function (s) {
    (s.bosses || []).forEach(function (b) {
      if (!b.data_prova) return;
      const dataProvaStr = String(b.data_prova).slice(0, 10); // normaliza timestamp -> YYYY-MM-DD
      const d = new Date(b.data_prova);
      if (d.getFullYear() === ano && d.getMonth() === mes) {
        provasPorDia[dataProvaStr] = (s.nome ? s.nome + ' — ' : '') + b.nome;
      }
    });
  });

  // dias efetivamente estudados no mês (daily_logs)
  const inicioMesStr = primeiroDia.toISOString().slice(0, 10);
  const fimMesStr = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);
  const { data: logs } = await supabaseClient
    .from('daily_logs')
    .select('data, estudou')
    .eq('user_id', user.id)
    .gte('data', inicioMesStr)
    .lte('data', fimMesStr);

  const estudadoPorDia = {};
  (logs || []).forEach(function (l) { estudadoPorDia[l.data] = l.estudou; });

  const hojeStr = hoje.toISOString().slice(0, 10);

  let html = '';
  for (let i = 0; i < offsetSemana; i++) {
    html += '<div class="cal-day" style="visibility:hidden;">.</div>';
  }
  for (let dia = 1; dia <= totalDias; dia++) {
    const dataStr = ano + '-' + String(mes + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
    const classes = ['cal-day'];
    let title = '';
    if (dataStr === hojeStr) {
      classes.push('today');
    } else if (provasPorDia[dataStr]) {
      classes.push('exam');
      title = ' title="' + escapeHtml(provasPorDia[dataStr]) + '"';
    } else if (estudadoPorDia[dataStr]) {
      classes.push('study');
    }
    html += '<div class="' + classes.join(' ') + '"' + title + '>' + dia + '</div>';
  }

  document.getElementById('calDays').innerHTML = html;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function diasAte(dataStr) {
  const hoje = new Date(new Date().toDateString());
  const alvo = new Date(dataStr);
  return Math.max(0, Math.round((alvo - hoje) / (1000 * 60 * 60 * 24)));
}

function addDias(d, n) {
  const copia = new Date(d);
  copia.setDate(copia.getDate() + n);
  return copia;
}

function toISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtDataCurta(d) {
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
