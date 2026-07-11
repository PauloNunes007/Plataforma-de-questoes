// ============================================================
// QUESTLY — ranking.js
// Ranking semanal por liga (estilo Duolingo): mostra os alunos da
// mesma liga que você essa semana, ordenados por XP da semana.
// Zona verde = promove liga na virada da semana, zona vermelha =
// rebaixa (mesmo critério de js/liga.js — puramente visual aqui,
// quem decide de verdade é questlyGarantirSemanaLiga). Clicar num
// aluno abre o card público dele: nome, foto e disciplinas.
// ============================================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', iniciarRanking);

async function iniciarRanking() {
  currentUser = await questlyExigirLogin();
  if (!currentUser) return;

  document.getElementById('userCardClose').onclick = fecharCardUsuario;
  document.getElementById('userCardOverlay').onclick = function (ev) {
    if (ev.target.id === 'userCardOverlay') fecharCardUsuario();
  };

  await carregarSidebar(currentUser);

  const estado = await questlyGarantirSemanaLiga(currentUser);
  if (!estado) return;

  renderCabecalhoLiga(estado);
  await carregarRanking(currentUser, estado);
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
// CABEÇALHO DA LIGA
// ------------------------------------------------------------
function renderCabecalhoLiga(estado) {
  const info = QUESTLY_LIGA_INFO[estado.liga] || QUESTLY_LIGA_INFO.bronze;
  const dias = diasAteProximaSegunda();

  document.getElementById('ligaHeadIcon').textContent = info.icone;
  document.getElementById('ligaHeadNome').textContent = 'Liga ' + info.nome;
  document.getElementById('ligaHeadSub').textContent = 'Fecha em ' + dias + (dias === 1 ? ' dia' : ' dias') + ' · ' + (estado.xp_semana || 0) + ' XP essa semana';

  const ribbon = document.getElementById('ligaRibbon');
  ribbon.innerHTML = '';
  QUESTLY_LIGAS.forEach(function (liga) {
    const i = QUESTLY_LIGA_INFO[liga];
    const pill = document.createElement('div');
    pill.className = 'liga-pill' + (liga === estado.liga ? ' current' : '');
    pill.innerHTML = '<span>' + i.icone + '</span>' + i.nome;
    ribbon.appendChild(pill);
  });
}

function diasAteProximaSegunda() {
  const hoje = new Date().getDay();
  return hoje === 0 ? 1 : 8 - hoje;
}

// ------------------------------------------------------------
// LISTA DO RANKING
// ------------------------------------------------------------
async function carregarRanking(user, estado) {
  const lista = document.getElementById('rankList');
  const hint = document.getElementById('rankHint');
  lista.innerHTML = '<div class="empty-hint">Carregando ranking...</div>';
  hint.textContent = '';

  const { data: alunos, error } = await supabaseClient
    .from('profiles')
    .select('id, nome, foto_url, xp_semana, questoes_semana')
    .eq('liga', estado.liga)
    .eq('semana_inicio', estado.semana_inicio)
    .order('xp_semana', { ascending: false });

  if (error) {
    lista.innerHTML = '<div class="empty-hint">Não foi possível carregar o ranking.</div>';
    return;
  }

  const grupo = alunos || [];
  lista.innerHTML = '';

  if (grupo.length === 0) {
    lista.innerHTML = '<div class="empty-hint">Ninguém na sua liga ainda essa semana.</div>';
    return;
  }
  if (grupo.length === 1) {
    hint.textContent = 'Você é o único na sua liga essa semana até agora — colegas aparecem aqui assim que jogarem.';
  } else if (grupo.length < QUESTLY_MIN_GRUPO_REBAIXAMENTO) {
    hint.textContent = 'Zona verde sobe de liga. Liga pequena essa semana: ninguém é rebaixado com menos de ' + QUESTLY_MIN_GRUPO_REBAIXAMENTO + ' participantes.';
  } else {
    hint.textContent = 'Zona verde sobe de liga no fim da semana · zona vermelha cai.';
  }

  // mesma função que decide a virada de verdade (js/liga.js) — o que o
  // aluno vê pintado aqui é exatamente o que acontece na segunda-feira
  const indiceLiga = QUESTLY_LIGAS.indexOf(estado.liga);
  const xps = grupo.map(function (a) { return a.xp_semana || 0; });
  const medalhas = ['🥇', '🥈', '🥉'];

  grupo.forEach(function (aluno, i) {
    const row = document.createElement('div');
    row.className = 'rank-row';
    if (aluno.id === user.id) row.classList.add('me');
    const destino = questlyDestinoNaLiga(xps, aluno.xp_semana || 0, indiceLiga);
    if (destino > 0) row.classList.add('zone-up');
    else if (destino < 0) row.classList.add('zone-down');

    row.innerHTML =
      '<div class="rank-num">' + (medalhas[i] || (i + 1)) + '</div>' +
      '<div class="rank-avatar" id="av-' + aluno.id + '"></div>' +
      '<div class="rank-info"><b>' + escapeHtml(aluno.nome || 'Aluno(a)') + (aluno.id === user.id ? ' (você)' : '') + '</b><span>' + (aluno.questoes_semana || 0) + ' questões essa semana</span></div>' +
      '<div class="rank-xp">' + (aluno.xp_semana || 0) + ' <small>XP</small></div>';

    row.onclick = function () { abrirCardUsuario(aluno.id); };
    lista.appendChild(row);
    questlyRenderAvatar(document.getElementById('av-' + aluno.id), aluno);
  });
}

// ------------------------------------------------------------
// CARD PÚBLICO DO ALUNO
// ------------------------------------------------------------
async function abrirCardUsuario(userId) {
  const overlay = document.getElementById('userCardOverlay');
  const content = document.getElementById('userCardContent');
  content.innerHTML = '<div class="empty-hint">Carregando...</div>';
  overlay.classList.add('show');

  const [{ data: profile }, { data: subjects }] = await Promise.all([
    supabaseClient.from('profiles').select('nome, curso, semestre, foto_url, liga, xp_semana').eq('id', userId).single(),
    supabaseClient.from('subjects').select('nome').eq('user_id', userId).order('nome'),
  ]);

  if (!profile) {
    content.innerHTML = '<div class="empty-hint">Não foi possível carregar esse aluno.</div>';
    return;
  }

  const info = QUESTLY_LIGA_INFO[profile.liga] || QUESTLY_LIGA_INFO.bronze;
  const discChips = (subjects || []).length > 0
    ? subjects.map(function (s) { return '<span class="chip">' + escapeHtml(s.nome) + '</span>'; }).join('')
    : '<span class="empty-hint">Nenhuma disciplina cadastrada ainda.</span>';

  content.innerHTML =
    '<div class="uc-avatar" id="ucAvatar"></div>' +
    '<h3>' + escapeHtml(profile.nome || 'Aluno(a)') + '</h3>' +
    '<p class="uc-sub">' + (escapeHtml([profile.curso, profile.semestre ? profile.semestre + 'º sem' : null].filter(Boolean).join(' · ')) || 'Curso não informado') + '</p>' +
    '<div class="uc-liga">' + info.icone + ' Liga ' + info.nome + ' · ' + (profile.xp_semana || 0) + ' XP essa semana</div>' +
    '<div class="disc-label" style="margin-top:18px;">Disciplinas</div>' +
    '<div class="chip-row">' + discChips + '</div>';

  questlyRenderAvatar(document.getElementById('ucAvatar'), profile);
}

function fecharCardUsuario() {
  document.getElementById('userCardOverlay').classList.remove('show');
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
