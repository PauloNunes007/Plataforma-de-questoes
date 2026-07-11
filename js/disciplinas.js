// ============================================================
// QUESTLY — disciplinas.js
// Prática livre: o aluno escolhe disciplina, tópicos, dificuldade
// e quantidade de questões, e o sistema monta uma missão avulsa
// (avulsa=true) igual às missões do dia — mesmo XP, mesma
// contagem pra cobertura/chance de aprovação do Boss — só que
// escolhida na mão em vez de gerada automaticamente.
// ============================================================

// XP por questão vem de questlyXpDaQuestao (js/supabase-client.js),
// ponderado pela dificuldade — mesma régua das missões do dia.

let currentUser = null;
let subjects = [];
let topicosDaMateria = [];
let subjectSelecionado = null;
let topicosSelecionados = new Set(); // vazio = todos os tópicos da matéria
let dificuldadeSelecionada = 'todas';
let qtdSelecionada = 10;
let questoesDisponiveisCount = null;

document.addEventListener('DOMContentLoaded', iniciarDisciplinas);

async function iniciarDisciplinas() {
  currentUser = await questlyExigirLogin();
  if (!currentUser) return;

  inicializarFiltros();
  document.getElementById('startBtn').onclick = comecarPratica;

  await carregarSidebar(currentUser);
  await carregarSubjects(currentUser);
}

// ------------------------------------------------------------
// SIDEBAR
// ------------------------------------------------------------
async function carregarSidebar(user) {
  const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return;
  document.getElementById('sideName').textContent = profile.nome || 'Aluno(a)';
  questlyRenderAvatar(document.getElementById('sideAvatar'), profile);
  document.getElementById('sideCourse').textContent =
    [profile.curso, profile.semestre ? profile.semestre + 'º sem' : null].filter(Boolean).join(' · ');
}

// ------------------------------------------------------------
// PASSO 1 — ESCOLHER DISCIPLINA
// ------------------------------------------------------------
async function carregarSubjects(user) {
  const { data, error } = await supabaseClient
    .from('subjects')
    .select('*, bosses(id, nome, data_prova, preparo_percentual)')
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
  topicosSelecionados = new Set();
  dificuldadeSelecionada = 'todas';

  document.querySelectorAll('.subj-pick').forEach(function (c) {
    c.classList.toggle('selected', c.dataset.id === subject.id);
  });

  document.getElementById('stepTopicos').style.display = 'block';
  document.getElementById('stepFiltros').style.display = 'none';
  document.getElementById('startCard').style.display = 'none';
  carregarTopicos(subject);
}

// ------------------------------------------------------------
// PASSO 2 — ESCOLHER TÓPICOS
// ------------------------------------------------------------
async function carregarTopicos(subject) {
  const topicosWrap = document.getElementById('topicosChips');
  topicosWrap.innerHTML = '<div class="empty-hint">Carregando tópicos...</div>';

  if (!subject.materia_id) {
    topicosWrap.innerHTML = '<div class="empty-hint">Essa disciplina ainda não está ligada a um banco de questões. Cadastre-a em Configurações ou importe questões pra ela.</div>';
    topicosDaMateria = [];
    return;
  }

  const { data, error } = await supabaseClient
    .from('topicos')
    .select('id, nome, subtopico')
    .eq('materia_id', subject.materia_id)
    .order('nome');

  if (error || !data || data.length === 0) {
    topicosWrap.innerHTML = '<div class="empty-hint">Ainda não há tópicos cadastrados pra essa disciplina.</div>';
    topicosDaMateria = [];
    return;
  }

  topicosDaMateria = data;
  topicosWrap.innerHTML = '';
  data.forEach(function (t) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = t.subtopico ? t.nome + ' · ' + t.subtopico : t.nome;
    chip.onclick = function () {
      if (topicosSelecionados.has(t.id)) topicosSelecionados.delete(t.id);
      else topicosSelecionados.add(t.id);
      chip.classList.toggle('active', topicosSelecionados.has(t.id));
      atualizarPreview();
    };
    topicosWrap.appendChild(chip);
  });

  document.getElementById('stepFiltros').style.display = 'block';
  document.getElementById('startCard').style.display = 'block';
  atualizarPreview();
}

// ------------------------------------------------------------
// PASSO 3 — DIFICULDADE + QUANTIDADE
// ------------------------------------------------------------
function inicializarFiltros() {
  document.querySelectorAll('#dificuldadeChips .chip').forEach(function (c) {
    c.onclick = function () {
      dificuldadeSelecionada = c.dataset.val;
      document.querySelectorAll('#dificuldadeChips .chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      atualizarPreview();
    };
  });

  document.querySelectorAll('#qtdChips .chip').forEach(function (c) {
    c.onclick = function () {
      qtdSelecionada = c.dataset.val === 'todas' ? 'todas' : parseInt(c.dataset.val, 10);
      document.querySelectorAll('#qtdChips .chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      atualizarPreview();
    };
  });
}

function topicIdsAtivos() {
  return topicosSelecionados.size > 0
    ? Array.from(topicosSelecionados)
    : topicosDaMateria.map(function (t) { return t.id; });
}

// ------------------------------------------------------------
// PRÉVIA — quantas questões existem com o filtro atual
// ------------------------------------------------------------
async function atualizarPreview() {
  const topicIds = topicIdsAtivos();
  const startBtn = document.getElementById('startBtn');
  const previewEl = document.getElementById('previewText');

  if (topicIds.length === 0) {
    previewEl.textContent = 'Nenhum tópico disponível.';
    startBtn.disabled = true;
    return;
  }

  let query = supabaseClient.from('questions').select('id', { count: 'exact', head: true }).in('topic_id', topicIds);
  if (dificuldadeSelecionada !== 'todas') query = query.eq('dificuldade', dificuldadeSelecionada);

  const { count, error } = await query;
  if (error) {
    previewEl.textContent = 'Não foi possível contar as questões disponíveis.';
    startBtn.disabled = true;
    return;
  }

  questoesDisponiveisCount = count || 0;

  if (questoesDisponiveisCount === 0) {
    previewEl.textContent = 'Nenhuma questão encontrada com esse filtro. Tente outra combinação.';
    startBtn.disabled = true;
    return;
  }

  const vaiUsar = qtdSelecionada === 'todas' ? questoesDisponiveisCount : Math.min(qtdSelecionada, questoesDisponiveisCount);
  // com dificuldade fixa o XP é exato; com "todas" é estimativa (peso médio 5)
  const xpTxt = dificuldadeSelecionada !== 'todas'
    ? '+' + (vaiUsar * QUESTLY_XP_POR_DIFICULDADE[dificuldadeSelecionada]) + ' XP em jogo'
    : '~' + (vaiUsar * 5) + ' XP em jogo';
  previewEl.textContent = vaiUsar + ' questão(ões) disponível(eis) · ' + xpTxt;
  startBtn.disabled = false;
}

// ------------------------------------------------------------
// COMEÇAR PRÁTICA — monta a missão avulsa e vai pra questao.html
// ------------------------------------------------------------
async function comecarPratica() {
  const startBtn = document.getElementById('startBtn');
  startBtn.disabled = true;
  startBtn.textContent = 'Preparando...';

  try {
    const topicIds = topicIdsAtivos();

    let query = supabaseClient.from('questions').select('id, tempo_medio_seg, dificuldade').in('topic_id', topicIds);
    if (dificuldadeSelecionada !== 'todas') query = query.eq('dificuldade', dificuldadeSelecionada);
    const { data: candidatas, error: candidatasError } = await query;

    if (candidatasError || !candidatas || candidatas.length === 0) {
      alert('Não foi possível montar a prática: nenhuma questão encontrada.');
      startBtn.disabled = false;
      startBtn.textContent = '🚀 Começar prática';
      return;
    }

    const embaralhadas = embaralhar(candidatas);
    const qtdQuestoes = qtdSelecionada === 'todas' ? embaralhadas.length : Math.min(qtdSelecionada, embaralhadas.length);
    const escolhidas = embaralhadas.slice(0, qtdQuestoes);
    const questionIds = escolhidas.map(function (q) { return q.id; });

    // mesmo critério do mission-engine: só extrapola tempo com dado real,
    // nunca inventa a partir do fallback genérico
    const comDadoReal = escolhidas.filter(function (q) { return q.tempo_medio_seg; });
    let tempoPrevistoMin = null;
    if (comDadoReal.length > 0) {
      const somaRealSeg = comDadoReal.reduce(function (acc, q) { return acc + q.tempo_medio_seg; }, 0);
      const mediaRealSeg = somaRealSeg / comDadoReal.length;
      const somaTotalEstimadaSeg = somaRealSeg + (qtdQuestoes - comDadoReal.length) * mediaRealSeg;
      tempoPrevistoMin = Math.round(somaTotalEstimadaSeg / 60);
    }

    const { data: missaoCriada, error: insertError } = await supabaseClient
      .from('missions')
      .insert({
        user_id: currentUser.id,
        subject_id: subjectSelecionado.id,
        data: new Date().toISOString().slice(0, 10),
        topic_ids: topicIds,
        question_ids: questionIds,
        qtd_questoes: qtdQuestoes,
        tempo_previsto_min: tempoPrevistoMin,
        xp_recompensa: escolhidas.reduce(function (acc, q) { return acc + questlyXpDaQuestao(q); }, 0),
        concluida: false,
        avulsa: true,
      })
      .select('id')
      .single();

    if (insertError || !missaoCriada) {
      console.error('Erro ao criar missão avulsa:', insertError);
      alert('Não foi possível preparar sua prática. Tente novamente.');
      startBtn.disabled = false;
      startBtn.textContent = '🚀 Começar prática';
      return;
    }

    window.location.href = 'questao.html?missao=' + missaoCriada.id;
  } catch (err) {
    console.error('Erro ao preparar prática:', err);
    alert('Não foi possível preparar sua prática. Tente novamente.');
    startBtn.disabled = false;
    startBtn.textContent = '🚀 Começar prática';
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
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
