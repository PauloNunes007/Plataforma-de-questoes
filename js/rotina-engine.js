// ============================================================
// QUESTLY — rotina-engine.js
// Grade semanal: em qual dia da semana o aluno estuda cada
// disciplina. Isso é o que decide quantas missões (uma por
// disciplina) o aluno recebe em cada dia — ver questlyGerarMissoesDoDia
// em js/mission-engine.js.
//
// A grade é SEMPRE editável pelo aluno (armazenada crua na tabela
// rotina_semanal); o que este arquivo calcula é só a RECOMENDAÇÃO
// inicial, que ele pode aceitar, ajustar ou ignorar.
//
// Duas contas matemáticas, ambas com fundamento estatístico padrão
// (não é "IA" nem nada probabilístico sofisticado, é escalonamento
// determinístico com peso):
//   1. questlyRecomendarRotina — QUAIS dias da semana cada disciplina
//      entra na grade. Usa escalonamento por crédito ponderado
//      (o mesmo princípio de Weighted Fair Queuing / Deficit Round
//      Robin de escalonadores de SO/rede): a cada dia, o crédito de
//      cada disciplina cresce proporcional ao seu peso; as disciplinas
//      com maior crédito naquele dia entram e têm o crédito descontado.
//      Ao longo da semana, a frequência de cada disciplina converge
//      pra proporção do seu peso, sem monopolizar nem faltar dias.
//   2. questlyApportionarMinutos — como o tempo diário do aluno se
//      divide ENTRE as disciplinas de um mesmo dia. Usa o método dos
//      maiores restos (Hamilton apportionment — o mesmo usado pra
//      distribuir cadeiras em sistemas proporcionais): divide o total
//      pela proporção de cada peso, arredonda pra baixo, e distribui
//      as sobras pros maiores restos — sem viés sistemático.
//
// O peso de uma disciplina (questlyPesoDisciplina) combina 3 sinais
// já existentes no app, mesma filosofia do mission-engine e do
// chance-aprovacao: prova próxima (urgência), desempenho fraco
// (fragilidade — 1 - chance_aprovacao) e meta de nota alta.
// ============================================================

const QUESTLY_PESO_URGENCIA = 0.45;
const QUESTLY_PESO_FRAGILIDADE = 0.35;
const QUESTLY_PESO_META = 0.20;
// normaliza 1/(dias+3) (tipicamente 0.01–0.25) pra competir em escala
// com fragilidade/meta (0–1) sem deixar uma prova amanhã dominar sozinha
const QUESTLY_ESCALA_URGENCIA = 3;

const QUESTLY_MIN_MINUTOS_POR_DISCIPLINA = 75; // sessão mínima que vale abrir uma disciplina no dia
const QUESTLY_MAX_DISCIPLINAS_POR_DIA = 4; // foco realista por dia, mesmo num dia de várias horas

/**
 * Peso de uma disciplina pra fins de escalonamento (grade semanal E
 * divisão de minutos do dia). Quanto maior, mais dias/minutos ela puxa.
 * @param {{bosses?: Array, chance_aprovacao?: number, nota_desejada?: number}} subject
 * @param {Date} hoje
 */
function questlyPesoDisciplina(subject, hoje) {
  const bossesFuturos = (subject.bosses || [])
    .filter(function (b) { return new Date(b.data_prova) >= hoje; })
    .sort(function (a, b) { return new Date(a.data_prova) - new Date(b.data_prova); });
  const proximoBoss = bossesFuturos[0] || null;
  // sem prova marcada: trata como se fosse daqui a 60 dias — baixa
  // urgência, mas a disciplina continua entrando na conta normalmente
  const diasAteProva = proximoBoss
    ? Math.max(1, Math.round((new Date(proximoBoss.data_prova) - hoje) / (1000 * 60 * 60 * 24)))
    : 60;
  const urgencia = (1 / (diasAteProva + 3)) * QUESTLY_ESCALA_URGENCIA;

  // sem chance_aprovacao calculada ainda (poucos dados): fragilidade
  // neutra — nem puxa nem segura a disciplina até haver dado real
  const chance = subject.chance_aprovacao != null ? subject.chance_aprovacao / 100 : 0.5;
  const fragilidade = 1 - chance;

  const meta = (subject.nota_desejada || 6) / 10;

  return urgencia * QUESTLY_PESO_URGENCIA + fragilidade * QUESTLY_PESO_FRAGILIDADE + meta * QUESTLY_PESO_META;
}

/**
 * Quantas disciplinas cabem num dia, dado o tempo diário disponível —
 * usado pela recomendação da grade (não limita a escolha manual do
 * aluno, que pode marcar quantas disciplinas quiser por dia).
 */
function questlyDisciplinasPorDia(numDisciplinas, tempoDiarioMin) {
  const bruto = Math.round((tempoDiarioMin || 30) / QUESTLY_MIN_MINUTOS_POR_DISCIPLINA);
  return Math.max(1, Math.min(bruto, numDisciplinas, QUESTLY_MAX_DISCIPLINAS_POR_DIA));
}

/**
 * Recomenda uma grade semanal completa (ver algoritmo no cabeçalho do
 * arquivo). Não salva nada — só calcula; quem chama decide se grava.
 * @param {Array} subjects  disciplinas do aluno (com bosses e chance_aprovacao)
 * @param {string[]} diasDisponiveis  dias normalizados (QUESTLY_DIAS_SEMANA), na ordem em que a semana deve ser preenchida
 * @param {number} tempoDiarioMin
 * @returns {{ [dia: string]: string[] }} subject_id[] recomendados por dia
 */
function questlyRecomendarRotina(subjects, diasDisponiveis, tempoDiarioMin) {
  if (!subjects || subjects.length === 0 || !diasDisponiveis || diasDisponiveis.length === 0) return {};

  const hoje = new Date(new Date().toDateString());
  const pesos = subjects.map(function (s) { return { id: s.id, peso: Math.max(0.001, questlyPesoDisciplina(s, hoje)) }; });
  const disciplinasPorDia = questlyDisciplinasPorDia(subjects.length, tempoDiarioMin);
  const somaPesos = pesos.reduce(function (a, p) { return a + p.peso; }, 0);
  const mediaPeso = somaPesos / pesos.length;

  const credito = {};
  pesos.forEach(function (p) { credito[p.id] = 0; });

  const rotina = {};
  diasDisponiveis.forEach(function (dia) {
    // crédito cresce proporcional ao peso a cada dia (Weighted Fair Queuing)
    pesos.forEach(function (p) { credito[p.id] += p.peso; });
    const ordenados = pesos.slice().sort(function (a, b) { return credito[b.id] - credito[a.id]; });
    const escolhidos = ordenados.slice(0, disciplinasPorDia);
    rotina[dia] = escolhidos.map(function (p) { return p.id; });
    escolhidos.forEach(function (p) { credito[p.id] -= mediaPeso; });
  });

  return rotina;
}

/**
 * Divide o tempo diário disponível entre as disciplinas de HOJE,
 * proporcional ao peso de cada uma (método dos maiores restos).
 * @param {Array} subjectsHoje
 * @param {number} tempoDiarioMin
 * @returns {{ [subjectId: string]: number }} minutos por disciplina
 */
function questlyApportionarMinutos(subjectsHoje, tempoDiarioMin) {
  if (!subjectsHoje || subjectsHoje.length === 0) return {};
  if (subjectsHoje.length === 1) {
    const unico = {};
    unico[subjectsHoje[0].id] = tempoDiarioMin;
    return unico;
  }

  const hoje = new Date(new Date().toDateString());
  const pesos = subjectsHoje.map(function (s) { return { id: s.id, peso: Math.max(0.001, questlyPesoDisciplina(s, hoje)) }; });
  const somaPesos = pesos.reduce(function (a, p) { return a + p.peso; }, 0);

  const exatos = pesos.map(function (p) { return { id: p.id, exato: (p.peso / somaPesos) * tempoDiarioMin }; });
  const base = exatos.map(function (e) { return { id: e.id, min: Math.floor(e.exato), resto: e.exato - Math.floor(e.exato) }; });
  let atribuido = base.reduce(function (a, b) { return a + b.min; }, 0);
  let falta = tempoDiarioMin - atribuido;
  base.sort(function (a, b) { return b.resto - a.resto; });
  for (let i = 0; i < falta; i++) base[i % base.length].min++;

  const resultado = {};
  base.forEach(function (b) { resultado[b.id] = b.min; });
  return resultado;
}

// ------------------------------------------------------------
// Persistência (rotina_semanal — ver supabase_rotina_semanal.sql)
// ------------------------------------------------------------

// Todas as linhas da grade do aluno (todos os dias, não só hoje) — usado
// pelo mission-engine (decide hoje + fallback pra quem nunca configurou)
// e pela tela de Configurações (pré-preencher a grade editável).
async function questlyBuscarRotinaCompleta(user) {
  const { data, error } = await supabaseClient
    .from('rotina_semanal')
    .select('subject_id, dia_semana')
    .eq('user_id', user.id);
  if (error) { console.error('Erro ao buscar grade semanal:', error); return []; }
  return data || [];
}

// Substitui a grade inteira do aluno pela passada (full-replace, mesmo
// padrão do "dias_disponiveis" em profiles — mais simples e sem risco
// de linha órfã do que um diff incremental).
async function questlySalvarRotina(user, rotinaPorDia) {
  const { error: delError } = await supabaseClient.from('rotina_semanal').delete().eq('user_id', user.id);
  if (delError) { console.error('Erro ao limpar grade semanal:', delError); return { error: delError }; }

  const linhas = [];
  Object.keys(rotinaPorDia).forEach(function (dia) {
    (rotinaPorDia[dia] || []).forEach(function (subjectId) {
      linhas.push({ user_id: user.id, subject_id: subjectId, dia_semana: dia });
    });
  });
  if (linhas.length === 0) return { error: null };

  const { error: insError } = await supabaseClient.from('rotina_semanal').insert(linhas);
  if (insError) console.error('Erro ao salvar grade semanal:', insError);
  return { error: insError };
}
