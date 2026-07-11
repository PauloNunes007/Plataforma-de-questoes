// ============================================================
// QUESTLY — trilha.js
// "Minha trilha de conteúdo": mostra a ementa da disciplina na ordem
// curricular (topicos.ordem) com o status do aluno em cada tópico, e
// deixa quem entrou no meio do semestre marcar o que já sabe:
//   • "Já sei"      -> status 'pulado' (sai das missões, sem XP)
//   • "Fazer recap" -> missão curta do tópico; >= 70% vira 'dominado'
//                      (ver avaliarRecap em js/questao.js). Paga XP,
//                      porque o aluno respondeu questões de verdade.
//   • "Voltar"      -> desfaz um tópico pulado (volta a 'pendente')
//
// A fronteira curricular (primeiro tópico pendente com questões) é o
// mesmo conceito do js/mission-engine.js — aqui a gente só pinta.
// ============================================================

// mantém em sincronia com COBERTURA_TOPICO_QUESTOES (mission-engine)
// e META_QUESTOES_TOPICO (chance-aprovacao)
const COBERTURA_TOPICO = 5;
const RECAP_QTD = 5; // questões numa missão de recap

let currentUser = null;
let subjects = [];
let subjectSelecionado = null;

document.addEventListener('DOMContentLoaded', iniciarTrilha);

async function iniciarTrilha() {
  currentUser = await questlyExigirLogin();
  if (!currentUser) return;

  await carregarSidebar(currentUser);
  await carregarSubjects(currentUser);
}

async function carregarSidebar(user) {
  const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return;
  document.getElementById('sideName').textContent = profile.nome || 'Aluno(a)';
  questlyRenderAvatar(document.getElementById('sideAvatar'), profile);
  document.getElementById('sideCourse').textContent =
    [profile.curso, profile.semestre ? profile.semestre + 'º sem' : null].filter(Boolean).join(' · ');
}

// ------------------------------------------------------------
// ESCOLHER DISCIPLINA
// ------------------------------------------------------------
async function carregarSubjects(user) {
  const { data, error } = await supabaseClient
    .from('subjects')
    .select('*, bosses(id, nome, data_prova)')
    .eq('user_id', user.id)
    .order('nome');

  const wrap = document.getElementById('subjectPickList');

  if (error) {
    wrap.innerHTML = '<div class="empty-hint">Não foi possível carregar suas disciplinas.</div>';
    return;
  }

  subjects = data || [];

  if (subjects.length === 0) {
    document.getElementById('emptySubjects').style.display = 'block';
    document.getElementById('pickCard').style.display = 'none';
    return;
  }

  wrap.innerHTML = '';
  subjects.forEach(function (s) { wrap.appendChild(renderSubjectPickCard(s)); });
}

function renderSubjectPickCard(subject) {
  const hoje = new Date(new Date().toDateString());
  const bossesFuturos = (subject.bosses || [])
    .filter(function (b) { return new Date(b.data_prova) >= hoje; })
    .sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); });
  const proximoBoss = bossesFuturos[0];

  const card = document.createElement('div');
  card.className = 'subj-pick';
  card.dataset.id = subject.id;
  card.innerHTML =
    '<div class="subj-pick-name">' + escapeHtml(subject.nome) + '</div>' +
    '<div class="subj-pick-meta">' + (proximoBoss ? 'Boss em ' + diasAte(proximoBoss.data_prova) + ' dias' : 'Sem prova marcada') + '</div>';

  card.onclick = function () { selecionarSubject(subject); };
  return card;
}

function selecionarSubject(subject) {
  subjectSelecionado = subject;
  document.querySelectorAll('.subj-pick').forEach(function (c) {
    c.classList.toggle('selected', c.dataset.id === subject.id);
  });
  document.getElementById('trilhaCard').style.display = 'block';
  document.getElementById('trilhaTitulo').textContent = 'Trilha de ' + subject.nome;
  carregarTrilha(subject);
}

// ------------------------------------------------------------
// CARREGAR A TRILHA (ementa + status do aluno)
// ------------------------------------------------------------
async function carregarTrilha(subject) {
  const lista = document.getElementById('topicosLista');
  lista.innerHTML = '<div class="empty-hint">Carregando trilha...</div>';
  document.getElementById('progSummary').innerHTML = '';
  document.getElementById('progFill').style.width = '0%';

  if (!subject.materia_id) {
    lista.innerHTML = '<div class="empty-hint">Essa disciplina ainda não está ligada a um banco de conteúdo. Cadastre-a de novo em Configurações.</div>';
    return;
  }

  // tópicos da ementa (ordem curricular; tópico sem ordem vai pro fim)
  const { data: topicos, error } = await supabaseClient
    .from('topicos')
    .select('id, nome, descricao, ordem, cai_na_prova')
    .eq('materia_id', subject.materia_id);

  if (error || !topicos || topicos.length === 0) {
    lista.innerHTML = '<div class="empty-hint">Ainda não há ementa cadastrada pra essa disciplina.</div>';
    return;
  }

  topicos.sort(function (a, b) {
    const oa = a.ordem != null ? a.ordem : Infinity;
    const ob = b.ordem != null ? b.ordem : Infinity;
    if (oa !== ob) return oa - ob;
    return a.nome.localeCompare(b.nome);
  });

  const topicoIds = topicos.map(function (t) { return t.id; });

  // progresso do aluno + contagem de questões por tópico
  const [{ data: progressos }, { data: questoes }] = await Promise.all([
    supabaseClient
      .from('aluno_topico_progresso')
      .select('topico_id, num_questoes_respondidas, taxa_acerto, status')
      .eq('user_id', currentUser.id)
      .in('topico_id', topicoIds),
    supabaseClient
      .from('questions')
      .select('topic_id')
      .in('topic_id', topicoIds),
  ]);

  const progPorTopico = {};
  (progressos || []).forEach(function (p) { progPorTopico[p.topico_id] = p; });
  const qtdQuestoes = {};
  (questoes || []).forEach(function (q) { qtdQuestoes[q.topic_id] = (qtdQuestoes[q.topic_id] || 0) + 1; });

  // classifica cada tópico e acha a fronteira (1º pendente com questões)
  let fronteiraId = null;
  const enriquecidos = topicos.map(function (t) {
    const p = progPorTopico[t.id] || {};
    const num = p.num_questoes_respondidas || 0;
    const status = p.status || 'pendente';
    const temQ = (qtdQuestoes[t.id] || 0) > 0;
    let estado;
    if (status === 'pulado') estado = 'pulado';
    // Mestre (>= 90% em >= 20 questões, questlyEhMestre) vence os demais:
    // é o degrau acima de 'coberto'/'dominado' — a linha fica dourada
    else if (questlyEhMestre(p)) estado = 'mestre';
    else if (status === 'dominado') estado = 'dominado';
    else if (!temQ) estado = 'vazio';
    else if (num >= COBERTURA_TOPICO) estado = 'coberto';
    else estado = 'pendente';

    if (fronteiraId === null && estado === 'pendente') fronteiraId = t.id;
    return { t: t, num: num, temQ: temQ, estado: estado };
  });

  // resumo de progresso
  const total = enriquecidos.length;
  const concluidos = enriquecidos.filter(function (e) { return e.estado === 'coberto' || e.estado === 'dominado' || e.estado === 'mestre'; }).length;
  const pulados = enriquecidos.filter(function (e) { return e.estado === 'pulado'; }).length;
  const pct = total > 0 ? Math.round((concluidos + pulados) / total * 100) : 0;
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progSummary').innerHTML =
    '<span class="prog-stat"><b>' + concluidos + '</b> estudados</span>' +
    '<span class="prog-stat"><b>' + pulados + '</b> pulados</span>' +
    '<span class="prog-stat"><b>' + (total - concluidos - pulados) + '</b> na fila</span>' +
    '<span class="prog-stat"><b>' + total + '</b> tópicos na ementa</span>';
  document.getElementById('trilhaSub').textContent =
    'Você concluiu ou pulou ' + (concluidos + pulados) + ' de ' + total + ' tópicos (' + pct + '%).';

  lista.innerHTML = '';
  enriquecidos.forEach(function (e, i) {
    lista.appendChild(renderTopico(e, i, e.t.id === fronteiraId));
  });
}

function renderTopico(e, indice, ehFronteira) {
  const t = e.t;
  const row = document.createElement('div');
  const classeEstado = ehFronteira && e.estado === 'pendente' ? 'atual' : e.estado;
  row.className = 'topico ' + classeEstado;

  const badge = badgeDoEstado(e.estado, ehFronteira);
  const numLabel = t.ordem != null ? t.ordem : (indice + 1);

  row.innerHTML =
    '<div class="topico-num">' + escapeHtml(String(numLabel)) + '</div>' +
    '<div class="topico-body">' +
      '<div class="topico-nome">' + escapeHtml(t.nome) + badge + '</div>' +
      (t.descricao ? '<div class="topico-desc">' + escapeHtml(t.descricao) + '</div>' : '') +
      '<div class="topico-acoes"></div>' +
    '</div>';

  const acoes = row.querySelector('.topico-acoes');
  montarAcoes(acoes, e);
  return row;
}

function badgeDoEstado(estado, ehFronteira) {
  if (estado === 'mestre') return '<span class="badge b-mestre">🏅 Mestre</span>';
  if (estado === 'dominado') return '<span class="badge b-dominado">Dominado</span>';
  if (estado === 'coberto') return '<span class="badge b-coberto">Estudado</span>';
  if (estado === 'pulado') return '<span class="badge b-pulado">Pulado</span>';
  if (estado === 'vazio') return '<span class="badge b-vazio">Sem questões ainda</span>';
  if (ehFronteira) return '<span class="badge b-atual">Você está aqui</span>';
  return '<span class="badge b-pendente">Na fila</span>';
}

function montarAcoes(container, e) {
  // pulado: só oferece desfazer
  if (e.estado === 'pulado') {
    const undo = botao('mini-btn undo', '↩ Voltar pra trilha', function () { mudarStatus(e.t.id, 'pendente'); });
    container.appendChild(undo);
    return;
  }
  // mestre, dominado ou já coberto: nada a marcar (pode praticar na aba Disciplinas)
  if (e.estado === 'mestre' || e.estado === 'dominado' || e.estado === 'coberto') return;
  // sem questões: não dá pra recap nem faz diferença pular (não entra em missão)
  if (e.estado === 'vazio') return;

  // pendente com questões: pular ou recap
  container.appendChild(botao('mini-btn skip', '✓ Já sei isso', function () { mudarStatus(e.t.id, 'pulado'); }));
  container.appendChild(botao('mini-btn recap', '⚡ Fazer recap', function (btn) { iniciarRecap(e.t, btn); }));
}

function botao(classe, texto, onClick) {
  const b = document.createElement('button');
  b.className = classe;
  b.textContent = texto;
  b.onclick = function () { onClick(b); };
  return b;
}

// ------------------------------------------------------------
// AÇÕES
// ------------------------------------------------------------
async function mudarStatus(topicoId, novoStatus) {
  const { error } = await supabaseClient
    .from('aluno_topico_progresso')
    .upsert({
      user_id: currentUser.id,
      topico_id: topicoId,
      status: novoStatus,
    }, { onConflict: 'user_id,topico_id' });

  if (error) {
    console.error('Erro ao atualizar status do tópico:', error);
    alert('Não foi possível salvar. Tente de novo.');
    return;
  }
  await carregarTrilha(subjectSelecionado); // repinta a trilha
}

// cria uma missão de recap (curta, um tópico só, recap_topico_id) e vai
// pra questao.html — mesma régua de XP/tempo das outras missões
async function iniciarRecap(topico, btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Preparando...'; }

  const { data: candidatas, error } = await supabaseClient
    .from('questions')
    .select('id, tempo_medio_seg, dificuldade')
    .eq('topic_id', topico.id);

  if (error || !candidatas || candidatas.length === 0) {
    alert('Esse tópico ainda não tem questões pra fazer um recap.');
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Fazer recap'; }
    return;
  }

  const escolhidas = embaralhar(candidatas).slice(0, Math.min(RECAP_QTD, candidatas.length));
  const questionIds = escolhidas.map(function (q) { return q.id; });

  // só extrapola tempo com dado real (mesmo critério do mission-engine)
  const comDadoReal = escolhidas.filter(function (q) { return q.tempo_medio_seg; });
  let tempoPrevistoMin = null;
  if (comDadoReal.length > 0) {
    const somaRealSeg = comDadoReal.reduce(function (acc, q) { return acc + q.tempo_medio_seg; }, 0);
    const mediaRealSeg = somaRealSeg / comDadoReal.length;
    const somaTotalSeg = somaRealSeg + (escolhidas.length - comDadoReal.length) * mediaRealSeg;
    tempoPrevistoMin = Math.round(somaTotalSeg / 60);
  }

  const { data: missaoCriada, error: insertError } = await supabaseClient
    .from('missions')
    .insert({
      user_id: currentUser.id,
      subject_id: subjectSelecionado.id,
      data: new Date().toISOString().slice(0, 10),
      topic_ids: [topico.id],
      question_ids: questionIds,
      qtd_questoes: escolhidas.length,
      tempo_previsto_min: tempoPrevistoMin,
      xp_recompensa: escolhidas.reduce(function (acc, q) { return acc + questlyXpDaQuestao(q); }, 0),
      concluida: false,
      avulsa: true,               // não ocupa o slot da missão do dia
      recap_topico_id: topico.id, // marca como recap -> avaliarRecap em questao.js
    })
    .select('id')
    .single();

  if (insertError || !missaoCriada) {
    console.error('Erro ao criar recap:', insertError);
    alert('Não foi possível preparar o recap. Tente novamente.');
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Fazer recap'; }
    return;
  }

  window.location.href = 'questao.html?missao=' + missaoCriada.id;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function embaralhar(arr) {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copia[i]; copia[i] = copia[j]; copia[j] = tmp;
  }
  return copia;
}

function diasAte(dataStr) {
  const hoje = new Date(new Date().toDateString());
  const alvo = new Date(dataStr);
  return Math.max(0, Math.round((alvo - hoje) / (1000 * 60 * 60 * 24)));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
