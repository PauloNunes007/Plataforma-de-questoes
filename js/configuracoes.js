// ============================================================
// QUESTLY — configuracoes.js
// Tela pra editar rotina de estudos, disciplinas e provas depois
// do onboarding, sem precisar mexer direto no banco.
// ============================================================

const TEMPO_MAP = { '30 min': 30, '1 hora': 60, '1h30': 90, '2h': 120, '3h': 180, '4h': 240, '6h': 360, '8h ou mais': 480 };
const TEMPO_MAP_REVERSO = { 30: '30 min', 60: '1 hora', 90: '1h30', 120: '2h', 180: '3h', 240: '4h', 360: '6h', 480: '8h ou mais' };

// mesma lista de sugestões do onboarding (questly_onboarding.html #discChips)
const DISCIPLINAS_PADRAO = [
  'Fundamentos de Cálculo e Geometria', 'Cálculo I', 'Cálculo II', 'Cálculo III',
  'Álgebra Linear', 'Física I', 'Física II', 'Química Geral', 'Programação I',
];

let currentUser = null;
let subjectsAtuais = []; // cache pra grade semanal se redesenhar sem refazer a query de disciplinas
let profileAtual = null; // idem, pra dias_disponiveis/tempo_diario_min

document.addEventListener('DOMContentLoaded', iniciarConfiguracoes);

async function iniciarConfiguracoes() {
  currentUser = await questlyExigirLogin(); // redireciona pro login se não houver sessão
  if (!currentUser) return;

  const profile = await carregarSidebar(currentUser);
  profileAtual = profile;
  carregarRotina(profile);
  carregarFoto(profile);
  const subjects = await carregarDisciplinasEProvas(currentUser);
  await carregarGradeSemanal(currentUser, profile, subjects);
}

// ------------------------------------------------------------
// SIDEBAR (nome/avatar/curso)
// ------------------------------------------------------------
async function carregarSidebar(user) {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Erro ao carregar profile:', error);
    return null;
  }

  document.getElementById('sideName').textContent = profile.nome || 'Aluno(a)';
  questlyRenderAvatar(document.getElementById('sideAvatar'), profile);
  document.getElementById('sideCourse').textContent =
    [profile.curso, profile.semestre ? profile.semestre + 'º sem' : null].filter(Boolean).join(' · ');

  return profile;
}

// ------------------------------------------------------------
// FOTO DE PERFIL — upload pro Supabase Storage (bucket "avatars").
// A imagem é redimensionada pra 256x256 JPEG no navegador antes de
// subir (~30 KB), então o 1 GB grátis do Storage rende muito.
// ------------------------------------------------------------
let fotoPendente = null; // blob já redimensionado, aguardando "Salvar foto"
let nomePerfilAtual = '';

function carregarFoto(profile) {
  nomePerfilAtual = (profile && profile.nome) || '';
  questlyRenderAvatar(document.getElementById('fotoPreview'), profile || {});
  document.getElementById('removerFotoBtn').style.display = profile && profile.foto_url ? '' : 'none';

  document.getElementById('escolherFotoBtn').onclick = function () { document.getElementById('fotoInput').click(); };
  document.getElementById('fotoInput').addEventListener('change', aoEscolherFoto);
  document.getElementById('salvarFotoBtn').onclick = salvarFoto;
  document.getElementById('removerFotoBtn').onclick = removerFoto;
}

// corta o centro quadrado e reduz pra 256x256 JPEG
function redimensionarAvatar(file) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      const TAM = 256;
      const canvas = document.createElement('canvas');
      canvas.width = TAM;
      canvas.height = TAM;
      const lado = Math.min(img.width, img.height);
      const sx = (img.width - lado) / 2;
      const sy = (img.height - lado) / 2;
      canvas.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, TAM, TAM);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob falhou'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(img.src); reject(new Error('imagem inválida')); };
    img.src = URL.createObjectURL(file);
  });
}

async function aoEscolherFoto(ev) {
  const file = ev.target.files[0];
  if (!file) return;

  try {
    fotoPendente = await redimensionarAvatar(file);
  } catch (err) {
    console.error('Erro ao processar imagem:', err);
    alert('Não foi possível ler essa imagem. Tente outro arquivo (JPG ou PNG).');
    return;
  }

  const preview = document.getElementById('fotoPreview');
  preview.innerHTML = '';
  const img = document.createElement('img');
  img.className = 'avatar-img';
  img.src = URL.createObjectURL(fotoPendente);
  preview.appendChild(img);
  document.getElementById('salvarFotoBtn').disabled = false;
}

async function salvarFoto() {
  if (!fotoPendente) return;
  const btn = document.getElementById('salvarFotoBtn');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const path = currentUser.id + '/avatar.jpg';
  const { error: uploadError } = await supabaseClient.storage
    .from('avatars')
    .upload(path, fotoPendente, { upsert: true, contentType: 'image/jpeg' });

  if (uploadError) {
    console.error('Erro no upload do avatar:', uploadError);
    alert('Não foi possível enviar sua foto. Tente novamente.');
    btn.disabled = false;
    btn.textContent = 'Salvar foto';
    return;
  }

  // ?v= cache-bust: o caminho é sempre o mesmo, então sem isso o navegador
  // continuaria mostrando a foto antiga depois de uma troca
  const { data: pub } = supabaseClient.storage.from('avatars').getPublicUrl(path);
  const url = pub.publicUrl + '?v=' + Date.now();

  const { error } = await supabaseClient.from('profiles').update({ foto_url: url }).eq('id', currentUser.id);

  btn.textContent = 'Salvar foto';

  if (error) {
    console.error('Erro ao salvar foto no profile:', error);
    alert('A foto subiu, mas não foi possível salvá-la no seu perfil. Tente de novo.');
    btn.disabled = false;
    return;
  }

  fotoPendente = null;
  questlyRenderAvatar(document.getElementById('sideAvatar'), { nome: nomePerfilAtual, foto_url: url });
  document.getElementById('removerFotoBtn').style.display = '';
  mostrarSalvo(document.getElementById('fotoSavedTag'));
}

async function removerFoto() {
  if (!confirm('Remover sua foto de perfil?')) return;

  await supabaseClient.storage.from('avatars').remove([currentUser.id + '/avatar.jpg']); // best-effort
  const { error } = await supabaseClient.from('profiles').update({ foto_url: null }).eq('id', currentUser.id);
  if (error) {
    console.error('Erro ao remover foto:', error);
    alert('Não foi possível remover a foto.');
    return;
  }

  fotoPendente = null;
  document.getElementById('salvarFotoBtn').disabled = true;
  document.getElementById('removerFotoBtn').style.display = 'none';
  questlyRenderAvatar(document.getElementById('fotoPreview'), { nome: nomePerfilAtual });
  questlyRenderAvatar(document.getElementById('sideAvatar'), { nome: nomePerfilAtual });
}

// ------------------------------------------------------------
// ROTINA (dias disponíveis + tempo diário)
// ------------------------------------------------------------
function carregarRotina(profile) {
  const diasAtuais = (profile && profile.dias_disponiveis) || [];
  document.querySelectorAll('#diasChips .chip').forEach(function (c) {
    if (diasAtuais.indexOf(c.dataset.day) !== -1) c.classList.add('active');
    c.onclick = function () { c.classList.toggle('active'); };
  });

  const tempoAtual = profile && profile.tempo_diario_min ? TEMPO_MAP_REVERSO[profile.tempo_diario_min] : null;
  document.querySelectorAll('#tempoChips .chip').forEach(function (c) {
    if (c.dataset.val === tempoAtual) c.classList.add('active');
    c.onclick = function () {
      document.querySelectorAll('#tempoChips .chip').forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
    };
  });

  document.getElementById('salvarRotinaBtn').onclick = salvarRotina;
}

async function salvarRotina() {
  const dias = Array.from(document.querySelectorAll('#diasChips .chip.active')).map(function (c) { return c.dataset.day; });
  const tempoChip = document.querySelector('#tempoChips .chip.active');
  const tempoMin = tempoChip ? TEMPO_MAP[tempoChip.dataset.val] : null;

  const btn = document.getElementById('salvarRotinaBtn');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const { error } = await supabaseClient
    .from('profiles')
    .update({ dias_disponiveis: dias, tempo_diario_min: tempoMin })
    .eq('id', currentUser.id);

  btn.disabled = false;
  btn.textContent = 'Salvar rotina';

  if (error) {
    console.error('Erro ao salvar rotina:', error);
    alert('Não foi possível salvar sua rotina. Tente novamente.');
    return;
  }

  mostrarSalvo(document.getElementById('rotinaSavedTag'));
  // dias/tempo mudaram -> a grade semanal (colunas = dias) precisa redesenhar
  profileAtual = { dias_disponiveis: dias, tempo_diario_min: tempoMin };
  await carregarGradeSemanal(currentUser, profileAtual, subjectsAtuais);
}

// ------------------------------------------------------------
// DISCIPLINAS + PROVAS
// ------------------------------------------------------------
async function carregarDisciplinasEProvas(user) {
  const { data: subjects, error } = await supabaseClient
    .from('subjects')
    .select('*, bosses(id, nome, data_prova)')
    .eq('user_id', user.id)
    .order('nome');

  const discList = document.getElementById('disciplinasList');
  const provasContainer = document.getElementById('provasContainer');

  document.getElementById('addDiscBtn').onclick = function () {
    const input = document.getElementById('novaDiscNome');
    const nome = input.value.trim();
    if (!nome) return;
    input.value = '';
    criarDisciplina(nome);
  };

  if (error) {
    console.error('Erro ao carregar disciplinas:', error);
    discList.innerHTML = '<div class="empty-hint">Não foi possível carregar suas disciplinas.</div>';
    provasContainer.innerHTML = '';
    renderChipsAdicionar([]);
    return [];
  }

  renderChipsAdicionar(subjects || []);

  if (!subjects || subjects.length === 0) {
    discList.innerHTML = '<div class="empty-hint">Nenhuma disciplina ainda. Adicione uma abaixo.</div>';
    provasContainer.innerHTML = '<div class="empty-hint">Adicione uma disciplina pra poder cadastrar provas.</div>';
    return [];
  }

  discList.innerHTML = '';
  subjects.forEach(function (s) { discList.appendChild(renderDisciplinaCard(s)); });

  provasContainer.innerHTML = '';
  subjects.forEach(function (s) { provasContainer.appendChild(renderProvasCard(s)); });

  return subjects;
}

// chips com as disciplinas comuns (mesma lista do onboarding) que o aluno
// ainda não tem cadastradas — clicar já adiciona na hora
function renderChipsAdicionar(subjects) {
  const jaTem = subjects.map(function (s) { return s.nome.trim().toLowerCase(); });
  const container = document.getElementById('discChipsAdd');
  container.innerHTML = '';

  DISCIPLINAS_PADRAO
    .filter(function (nome) { return jaTem.indexOf(nome.toLowerCase()) === -1; })
    .forEach(function (nome) {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = nome;
      chip.onclick = function () { criarDisciplina(nome); };
      container.appendChild(chip);
    });
}

function renderDisciplinaCard(subject) {
  const card = document.createElement('div');
  card.className = 'disc-card';

  const top = document.createElement('div');
  top.className = 'disc-top';
  top.innerHTML = '<h4>' + escapeHtml(subject.nome) + '</h4>';

  const rmBtn = document.createElement('button');
  rmBtn.className = 'btn-danger';
  rmBtn.textContent = 'Remover';
  rmBtn.onclick = function () { removerDisciplina(subject); };
  top.appendChild(rmBtn);
  card.appendChild(top);

  const notaLabel = document.createElement('div');
  notaLabel.className = 'disc-label';
  notaLabel.textContent = 'Nota desejada';
  card.appendChild(notaLabel);

  const notaRow = document.createElement('div');
  notaRow.className = 'chip-row nota-row';
  [6, 7, 8, 9, 10].forEach(function (n) {
    const chip = document.createElement('div');
    chip.className = 'chip nota-chip' + (subject.nota_desejada === n ? ' active' : '');
    chip.textContent = n;
    chip.onclick = function () { salvarNota(subject.id, n, notaRow, chip); };
    notaRow.appendChild(chip);
  });
  card.appendChild(notaRow);

  return card;
}

async function salvarNota(subjectId, nota, notaRow, chip) {
  const { error } = await supabaseClient
    .from('subjects')
    .update({ nota_desejada: nota })
    .eq('id', subjectId);

  if (error) {
    console.error('Erro ao salvar nota:', error);
    alert('Não foi possível salvar a nota desejada.');
    return;
  }

  notaRow.querySelectorAll('.nota-chip').forEach(function (x) { x.classList.remove('active'); });
  chip.classList.add('active');
}

async function criarDisciplina(nome) {
  const btn = document.getElementById('addDiscBtn');
  btn.disabled = true;

  // materia = taxonomia compartilhada de conteúdo (tópicos/questões pendem
  // dela, não da disciplina pessoal do aluno) — busca ou cria, mesma
  // lógica do onboarding (questly_onboarding.html)
  let materiaId = null;
  const materiaExistente = await supabaseClient.from('materias').select('id').eq('nome', nome).maybeSingle();
  if (materiaExistente.data) {
    materiaId = materiaExistente.data.id;
  } else {
    const materiaNova = await supabaseClient.from('materias').insert({ nome: nome }).select().single();
    if (materiaNova.error) {
      console.error('Erro ao criar matéria:', materiaNova.error);
    } else {
      materiaId = materiaNova.data.id;
    }
  }

  const subjectResult = await supabaseClient
    .from('subjects')
    .insert({ user_id: currentUser.id, nome: nome, nota_desejada: 8, materia_id: materiaId })
    .select()
    .single();

  if (subjectResult.error) {
    console.error('Erro ao criar disciplina:', subjectResult.error);
    alert('Não foi possível adicionar essa disciplina.');
    btn.disabled = false;
    return;
  }

  await supabaseClient.from('campaigns').insert({ user_id: currentUser.id, subject_id: subjectResult.data.id });

  btn.disabled = false;
  const subjectsNovas = await carregarDisciplinasEProvas(currentUser);
  await carregarGradeSemanal(currentUser, profileAtual, subjectsNovas);
}

async function removerDisciplina(subject) {
  const provasCount = (subject.bosses || []).length;
  const aviso = provasCount > 0
    ? 'Remover "' + subject.nome + '" também vai remover ' + provasCount + ' prova(s) cadastrada(s). Continuar?'
    : 'Remover "' + subject.nome + '"?';
  if (!confirm(aviso)) return;

  await supabaseClient.from('bosses').delete().eq('subject_id', subject.id);
  await supabaseClient.from('campaigns').delete().eq('subject_id', subject.id);
  await supabaseClient.from('rotina_semanal').delete().eq('subject_id', subject.id);

  const { error } = await supabaseClient.from('subjects').delete().eq('id', subject.id);

  if (error) {
    console.error('Erro ao remover disciplina:', error);
    alert('Não foi possível remover essa disciplina — ela ainda tem missões ou questões vinculadas a ela.');
    return;
  }

  const subjectsRestantes = await carregarDisciplinasEProvas(currentUser);
  await carregarGradeSemanal(currentUser, profileAtual, subjectsRestantes);
}

function renderProvasCard(subject) {
  const card = document.createElement('div');
  card.className = 'disc-card';
  card.style.marginBottom = '14px';

  const label = document.createElement('div');
  label.className = 'disc-label';
  label.textContent = subject.nome;
  card.appendChild(label);

  const list = document.createElement('div');
  card.appendChild(list);

  const bosses = subject.bosses || [];
  if (bosses.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'empty-hint';
    hint.style.padding = '2px 0 8px';
    hint.textContent = 'Nenhuma prova cadastrada ainda.';
    list.appendChild(hint);
  }
  bosses.forEach(function (b) {
    const row = document.createElement('div');
    row.className = 'prova-row';

    const nomeInput = document.createElement('input');
    nomeInput.type = 'text';
    nomeInput.value = b.nome || '';
    nomeInput.onchange = function () { atualizarProva(b.id, { nome: nomeInput.value }, row); };
    row.appendChild(nomeInput);

    const dataInput = document.createElement('input');
    dataInput.type = 'date';
    // normaliza pra "YYYY-MM-DD": se a coluna for timestamp, o Supabase
    // devolve algo como "2026-07-21T00:00:00+00:00", que um <input type="date">
    // rejeita silenciosamente (o campo fica em branco e parece travado)
    dataInput.value = b.data_prova ? String(b.data_prova).slice(0, 10) : '';
    dataInput.onchange = function () { atualizarProva(b.id, { data_prova: dataInput.value }, row); };
    row.appendChild(dataInput);

    const rmBtn = document.createElement('button');
    rmBtn.className = 'rm';
    rmBtn.textContent = '×';
    rmBtn.onclick = function () { removerProva(b.id); };
    row.appendChild(rmBtn);

    list.appendChild(row);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'add-prova-btn';
  addBtn.textContent = '+ Adicionar prova';
  addBtn.onclick = function () { adicionarProva(subject); };
  card.appendChild(addBtn);

  return card;
}

async function atualizarProva(bossId, campos, row) {
  const { error } = await supabaseClient.from('bosses').update(campos).eq('id', bossId);
  if (error) {
    console.error('Erro ao atualizar prova:', error);
    alert('Não foi possível salvar essa prova.');
    return;
  }
  flashSaved(row);
}

async function adicionarProva(subject) {
  const proximoNumero = (subject.bosses || []).length + 1;
  const hoje = new Date().toISOString().slice(0, 10);

  const { error } = await supabaseClient
    .from('bosses')
    .insert({ subject_id: subject.id, nome: 'P' + proximoNumero, data_prova: hoje });

  if (error) {
    console.error('Erro ao adicionar prova:', error);
    alert('Não foi possível adicionar a prova.');
    return;
  }

  await carregarDisciplinasEProvas(currentUser);
}

async function removerProva(bossId) {
  if (!confirm('Remover essa prova?')) return;

  const { error } = await supabaseClient.from('bosses').delete().eq('id', bossId);
  if (error) {
    console.error('Erro ao remover prova:', error);
    alert('Não foi possível remover essa prova.');
    return;
  }

  await carregarDisciplinasEProvas(currentUser);
}

// ------------------------------------------------------------
// GRADE SEMANAL — em qual dia da semana o aluno estuda cada disciplina
// (js/rotina-engine.js). Uma missão é gerada por disciplina agendada no
// dia (ver questlyGerarMissoesDoDia em js/mission-engine.js), então essa
// grade é o que decide quantas missões o aluno recebe em cada dia.
// ------------------------------------------------------------
async function carregarGradeSemanal(user, profile, subjects) {
  subjectsAtuais = subjects || [];
  const body = document.getElementById('gradeBody');
  const recomendarBtn = document.getElementById('recomendarGradeBtn');
  const salvarBtn = document.getElementById('salvarGradeBtn');

  if (subjectsAtuais.length === 0) {
    body.innerHTML = '<div class="empty-hint">Adicione uma disciplina abaixo pra montar sua grade semanal.</div>';
    recomendarBtn.style.display = 'none';
    salvarBtn.style.display = 'none';
    return;
  }

  const diasAtuais = (profile && profile.dias_disponiveis) || [];
  if (diasAtuais.length === 0) {
    body.innerHTML = '<div class="empty-hint">Escolha seus dias disponíveis em "Rotina de estudos" acima primeiro.</div>';
    recomendarBtn.style.display = 'none';
    salvarBtn.style.display = 'none';
    return;
  }

  recomendarBtn.style.display = '';
  salvarBtn.style.display = '';

  // dias na ordem da semana (QUESTLY_DIAS_SEMANA), mantendo o rótulo
  // original (ex. "Sáb") pra exibir, mas comparando normalizado
  const diasOrdenados = QUESTLY_DIAS_SEMANA
    .map(function (abrev) {
      const label = diasAtuais.find(function (d) { return questlyNormalizarDia(d) === abrev; });
      return label ? { abrev: abrev, label: label } : null;
    })
    .filter(Boolean);

  const rotinaExistente = await questlyBuscarRotinaCompleta(user);
  const marcado = {};
  rotinaExistente.forEach(function (r) { marcado[r.subject_id + '|' + r.dia_semana] = true; });

  renderGradeTabela(diasOrdenados, marcado);

  recomendarBtn.onclick = function () {
    const recomendacao = questlyRecomendarRotina(
      subjectsAtuais,
      diasOrdenados.map(function (d) { return d.abrev; }),
      (profile && profile.tempo_diario_min) || 30
    );
    const novoMarcado = {};
    Object.keys(recomendacao).forEach(function (dia) {
      recomendacao[dia].forEach(function (subjectId) { novoMarcado[subjectId + '|' + dia] = true; });
    });
    renderGradeTabela(diasOrdenados, novoMarcado);
  };

  salvarBtn.onclick = async function () {
    salvarBtn.disabled = true;
    salvarBtn.textContent = 'Salvando...';

    const rotinaPorDia = {};
    diasOrdenados.forEach(function (d) { rotinaPorDia[d.abrev] = []; });
    document.querySelectorAll('#gradeBody input[type="checkbox"]:checked').forEach(function (cb) {
      rotinaPorDia[cb.dataset.dia].push(cb.dataset.subject);
    });

    const { error } = await questlySalvarRotina(user, rotinaPorDia);

    salvarBtn.disabled = false;
    salvarBtn.textContent = 'Salvar grade';

    if (error) {
      alert('Não foi possível salvar sua grade semanal. Tente novamente.');
      return;
    }
    mostrarSalvo(document.getElementById('gradeSavedTag'));
  };
}

function renderGradeTabela(diasOrdenados, marcado) {
  const body = document.getElementById('gradeBody');
  const colunas = '160px repeat(' + diasOrdenados.length + ', 44px)';

  let html = '<div class="grade-row grade-head" style="grid-template-columns:' + colunas + ';"><div></div>' +
    diasOrdenados.map(function (d) { return '<div class="grade-col-label">' + escapeHtml(d.label) + '</div>'; }).join('') +
    '</div>';

  subjectsAtuais.forEach(function (s) {
    html += '<div class="grade-row" style="grid-template-columns:' + colunas + ';">' +
      '<div class="grade-disc">' + escapeHtml(s.nome) + '</div>' +
      diasOrdenados.map(function (d) {
        const marcada = !!marcado[s.id + '|' + d.abrev];
        return '<div class="grade-col"><input type="checkbox" data-subject="' + s.id + '" data-dia="' + d.abrev + '"' + (marcada ? ' checked' : '') + '></div>';
      }).join('') +
      '</div>';
  });

  body.innerHTML = html;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function mostrarSalvo(el) {
  el.classList.add('show');
  setTimeout(function () { el.classList.remove('show'); }, 1800);
}

function flashSaved(row) {
  row.style.transition = 'background .3s';
  row.style.background = 'var(--green-light)';
  row.style.borderRadius = '9px';
  setTimeout(function () { row.style.background = ''; }, 700);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
