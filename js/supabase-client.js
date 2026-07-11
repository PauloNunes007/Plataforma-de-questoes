// ============================================================
// QUESTLY — Conexão com o Supabase
// Esse arquivo é importado por TODAS as páginas HTML do projeto.
// Troque SUPABASE_URL e SUPABASE_ANON_KEY pelos valores do seu
// projeto (Settings → API no painel do Supabase).
// ============================================================

const SUPABASE_URL = "https://xgaqkmgdoocwlklvdapw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OrAeg3c_zS36xTgurhY8jA_HaYIN8Fd";

// Cria o cliente global do Supabase (a lib vem do CDN, ver abaixo)
// OBS: a variável se chama supabaseClient (não "supabase"), porque
// a própria biblioteca do CDN já usa o nome "supabase" internamente.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------------------------------------------
// Garante que existe uma linha em "profiles" pro usuário logado.
// Chamado depois do login e sempre que uma página protegida
// carrega — cobre o caso de confirmação de email, onde o
// cadastro não tem sessão ainda e não cria o profile na hora.
// ------------------------------------------------------------
async function questlyGarantirProfile(user) {
  if (!user) return;

  const { data: existente, error: selectError } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("Erro ao checar profile:", selectError);
    return;
  }
  if (existente) return; // já existe, não faz nada

  const nome = (user.user_metadata && user.user_metadata.nome) || (user.email ? user.email.split("@")[0] : "Aluno(a)");

  const { error: insertError } = await supabaseClient.from("profiles").insert({
    id: user.id,
    nome: nome,
  });

  if (insertError) {
    console.error("Erro ao criar profile de fallback:", insertError);
  }
}

// ------------------------------------------------------------
// Funções de auth reutilizáveis (usadas em login.html / cadastro.html)
// ------------------------------------------------------------

async function questlyCadastrar(email, senha, nome) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome: nome }, // guarda o nome nos metadados, pro fallback usar depois se precisar
    },
  });
  if (error) return { error };

  // Se a confirmação de email estiver ativada no seu projeto,
  // data.session vem null aqui — o profile só será criado quando
  // a pessoa efetivamente logar pela primeira vez (ver questlyLogin).
  if (!data.session) {
    return { data, error: null, precisaConfirmarEmail: true };
  }

  const { error: profileError } = await supabaseClient.from("profiles").insert({
    id: data.user.id,
    nome: nome,
  });

  return { data, error: profileError };
}

async function questlyLogin(email, senha) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (!error && data.user) {
    await questlyGarantirProfile(data.user);
  }

  return { data, error };
}

async function questlyLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = "questly_login.html";
}

// ------------------------------------------------------------
// Guarda de rota: chame isso no topo de páginas protegidas
// (dashboard.html, onboarding.html, etc). Redireciona pra login
// se não houver sessão ativa, e garante que o profile existe.
// ------------------------------------------------------------
async function questlyExigirLogin() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "questly_login.html";
    return null;
  }
  await questlyGarantirProfile(data.session.user);
  return data.session.user;
}

// ------------------------------------------------------------
// XP por questão, ponderado pela dificuldade (inspirado em teoria
// de resposta ao item: acertar uma questão difícil é mais evidência
// de domínio — e mais esforço — que acertar uma fácil, então vale
// mais). Usado pelo mission-engine, pela prática livre e pela tela
// de questões, pra recompensa prometida = recompensa paga.
// ------------------------------------------------------------
const QUESTLY_XP_POR_DIFICULDADE = { facil: 3, medio: 5, dificil: 8 };

function questlyXpDaQuestao(q) {
  return QUESTLY_XP_POR_DIFICULDADE[q && q.dificuldade] || 5;
}

// ------------------------------------------------------------
// CIÊNCIA DA APRENDIZAGEM — helpers puros compartilhados
// (mission-engine, questao, trilha e dashboard usam os mesmos
// números; manter aqui evita a constante triplicada dessincronizar)
//
// Maestria (mastery learning): o aluno vira "Mestre" num tópico com
// taxa_acerto >= 90% e volume mínimo de 20 questões respondidas.
// Questões de tópicos já dominados pagam XP 1.5x (manutenção da
// performance — retrieval de conteúdo forte também vale a pena).
//
// Revisão espaçada (Ebbinghaus): retenção estimada R = e^(-t/S),
// onde t = dias desde a última revisão e S = "estabilidade" da
// memória em dias, que cresce com volume e precisão no tópico
// (quanto mais repetições bem-sucedidas, mais devagar esquece).
// Quando R cai abaixo de QUESTLY_RETENCAO_LIMIAR, o tópico está
// "vencido" e o mission-engine o força na missão do dia antes de
// avançar em conteúdo novo.
// ------------------------------------------------------------
const QUESTLY_MAESTRIA_TAXA = 0.9;
const QUESTLY_MAESTRIA_MIN_QUESTOES = 20;
const QUESTLY_MAESTRIA_MULT_XP = 1.5;

function questlyEhMestre(progresso) {
  if (!progresso) return false;
  return (
    (progresso.num_questoes_respondidas || 0) >= QUESTLY_MAESTRIA_MIN_QUESTOES &&
    (progresso.taxa_acerto || 0) >= QUESTLY_MAESTRIA_TAXA
  );
}

const QUESTLY_ESTABILIDADE_BASE_DIAS = 2; // memória "nova" segura ~2 dias
const QUESTLY_RETENCAO_LIMIAR = 0.6;      // abaixo disso o tópico precisa de revisão

// Estabilidade S em dias: base + volume ponderado pela precisão.
// Ex.: 5 questões a 60% -> S ≈ 4.4 dias; Mestre (20 a 90%) -> S ≈ 16 dias.
function questlyEstabilidadeDias(progresso) {
  const num = (progresso && progresso.num_questoes_respondidas) || 0;
  const taxa = (progresso && progresso.taxa_acerto) || 0;
  return QUESTLY_ESTABILIDADE_BASE_DIAS + num * taxa * 0.8;
}

// Retenção estimada [0..1], ou null se o tópico nunca foi revisado
// (aí não existe "esquecimento" a medir — é conteúdo novo).
function questlyRetencaoTopico(progresso, agoraMs) {
  if (!progresso || !progresso.ultima_revisao) return null;
  const dias = Math.max(0, (agoraMs - new Date(progresso.ultima_revisao).getTime()) / (1000 * 60 * 60 * 24));
  return Math.exp(-dias / questlyEstabilidadeDias(progresso));
}

// ------------------------------------------------------------
// Dias da semana — compartilhado por mission-engine.js, rotina-engine.js
// e dashboard.js (grade semanal, trilha, "hoje é dia de estudo?").
// Fica aqui (carregado em toda página protegida) em vez de duplicado
// por arquivo, já que top-level `const` colide entre <script> tags
// carregadas na mesma página.
// ------------------------------------------------------------
const QUESTLY_DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]; // índice = Date.getDay()

function questlyNormalizarDia(d) {
  return String(d)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (ex: "Sáb" -> "sab")
    .toLowerCase()
    .slice(0, 3);
}

// ------------------------------------------------------------
// Avatar (foto de perfil opcional) — usado na sidebar de todas as
// páginas e no ranking/card público, pra não repetir a lógica de
// "tem foto? mostra <img>; não tem? mostra a inicial do nome" em
// cada arquivo. Se a foto falhar ao carregar, cai pra inicial.
// ------------------------------------------------------------
function questlyIniciais(nome) {
  return (nome || "A").trim().charAt(0).toUpperCase();
}

function questlyRenderAvatar(container, profile) {
  if (!container) return;
  const nome = profile && profile.nome;

  if (profile && profile.foto_url) {
    container.innerHTML = "";
    const img = document.createElement("img");
    img.src = profile.foto_url;
    img.alt = nome || "Avatar";
    img.className = "avatar-img";
    img.onerror = function () { container.textContent = questlyIniciais(nome); };
    container.appendChild(img);
  } else {
    container.textContent = questlyIniciais(nome);
  }
}
