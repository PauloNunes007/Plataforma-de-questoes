// ============================================================
// QUESTLY — importar.js
// Ferramenta de conteúdo: carrega um JSON de questões, importa
// automaticamente as que não têm pendência nenhuma (sem imagem,
// matéria/tópico resolvidos, gabarito e dificuldade consistentes,
// LaTeX com delimitadores balanceados, sem duplicata) e só te leva
// pra revisão manual — no card oficial, mesmo visual de
// questao.html — as que sobraram: têm imagem (enunciado ou
// alternativa), alguma inconsistência estrutural, ou enunciado igual
// a uma questão que já existe no banco (ou repetido no próprio
// arquivo) — ver avaliarElegibilidadeAuto. Duplicata é detectada por
// texto normalizado (minúsculas, espaço colapsado), não é fuzzy
// match, e aprovar mesmo assim pede confirmação extra. A checagem
// automática NÃO é revisão de texto/digitação — isso só um humano
// (ou eu, se você colar o JSON no chat antes) pega.
// A fila fica salva no localStorage pra sobreviver a um refresh.
//
// Formato esperado do JSON (array de questões):
//   [
//     {
//       "enunciado": "Calcule $\\lim_{x\\to 2} x^2$.",   // obrigatório
//       "materia": "Cálculo I",                            // nome já cadastrado na plataforma
//       "topico": "Limites",                                // nome já cadastrado dentro da matéria
//       "dificuldade": "medio",                             // facil/medio/dificil, padrão medio
//       "alternativas": {                                  // texto por letra — pode ficar em
//         "a": "2", "b": "4", "c": "6", "d": "8"            // branco/ausente numa letra que só
//       },                                                  // tenha imagem (alternativas_com_imagem)
//       "gabarito": "b",
//       "imagem_enunciado": false,                          // true = enunciado tem/precisa de imagem
//       "alternativas_com_imagem": [],                      // ex.: ["c"] — quais letras têm/precisam de imagem
//       "imagem_url": "https://.../grafico.png",            // opcional — se a imagem já estiver hospedada
//       "alternativas_imagens": { "c": "https://.../c.png" }, // opcional — idem, por alternativa
//       "instituicao": "UFMG",                              // opcional
//       "ano": 2023,                                        // opcional
//       "resolucao": "Substituindo x=2 na função contínua..." // opcional, aceita LaTeX
//     }
//   ]
// ============================================================

const LETRAS_ALTERNATIVA = ['a', 'b', 'c', 'd', 'e'];
const DIFICULDADES_VALIDAS = ['facil', 'medio', 'dificil'];
const STORAGE_KEY = 'questly_importar_fila_v1';
const TAMANHO_LOTE_AUTO = 200;

const KATEX_OPTS = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true },
  ],
  // LaTeX colado de um PDF vem com erro de vez em quando — sem isso, um
  // parse error derruba o render inteiro do card em vez de mostrar só
  // aquele trecho quebrado em vermelho
  throwOnError: false,
};

let currentUser = null;
let todasMaterias = [];
let todosTopicos = [];
let enunciadosExistentes = new Set(); // texto normalizado de toda questão já no banco — detecção de duplicata
let fila = [];
let filaCarregadaTemp = [];
let indiceAtual = 0;

document.addEventListener('DOMContentLoaded', iniciarImportador);

async function iniciarImportador() {
  currentUser = await questlyExigirLogin();
  if (!currentUser) return;

  await Promise.all([carregarMateriasETopicos(), carregarEnunciadosExistentes()]);
  popularSelectMaterias(document.getElementById('materiaLoteSelect'), true);
  popularSelectMaterias(document.getElementById('fMateria'), false);

  checarSessaoSalva();

  document.getElementById('fileInput').addEventListener('change', onArquivoSelecionado);
  document.getElementById('carregarBtn').addEventListener('click', onCarregarClique);
  document.getElementById('iniciarRevisaoBtn').addEventListener('click', iniciarRevisao);
  document.getElementById('importarAutoBtn').addEventListener('click', importarAutomaticamente);

  document.getElementById('anteriorBtn').addEventListener('click', irParaAnterior);
  document.getElementById('pularBtn').addEventListener('click', pularAtual);
  document.getElementById('aprovarBtn').addEventListener('click', aprovarAtual);
  document.getElementById('discardSessionBtn').addEventListener('click', descartarSessao);
  document.getElementById('revisarPuladasBtn').addEventListener('click', revisarPuladas);
}

// ------------------------------------------------------------
// MATÉRIAS / TÓPICOS (já cadastrados na plataforma — só leitura)
// ------------------------------------------------------------
async function carregarMateriasETopicos() {
  const [{ data: materias }, { data: topicos }] = await Promise.all([
    supabaseClient.from('materias').select('id, nome').order('nome'),
    supabaseClient.from('topicos').select('id, materia_id, nome, ordem').order('ordem', { ascending: true, nullsFirst: false }).order('nome'),
  ]);
  todasMaterias = materias || [];
  todosTopicos = topicos || [];
}

// ------------------------------------------------------------
// LIMPAR FORMATAÇÃO — heurística pra texto colado de PDF: junta
// quebra de linha de fim-de-página (não é parágrafo de verdade),
// desfaz hifenização de fim de linha, tira espaço/caractere invisível
// esquisito, normaliza aspas curvas. Não mexe em travessão/pontuação
// de verdade, só em artefato de cópia. Não é undo-ável — o resultado
// aparece na hora no campo e no card, dá pra ajustar à mão se exagerar.
// ------------------------------------------------------------
function limparFormatacao(texto) {
  if (!texto) return texto;
  let t = texto;

  t = t.replace(/\r\n?/g, '\n'); // normaliza quebra de linha
  t = t.replace(/[\u200B\uFEFF\u00AD]/g, ''); // invisiveis de PDF (zero-width, BOM, hifen suave)
  t = t.replace(/[\u00A0\u2007\u202F]/g, ' '); // espacos nao-separaveis -> espaco normal
  t = t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'); // aspas curvas -> retas
  t = t.replace(/\t/g, ' ');

  t = t.replace(/(\p{L})-\n(\p{L})/gu, '$1$2'); // hifenizacao quebrada de PDF

  const MARCA_PARAGRAFO = '\uE000';
  t = t.replace(/\n{2,}/g, MARCA_PARAGRAFO);
  t = t.replace(/\n/g, ' ');
  t = t.split(MARCA_PARAGRAFO).join('\n\n');

  t = t.replace(/ +([,.;:!?])/g, '$1'); // espaco antes de pontuacao
  t = t.split('\n').map(function (linha) { return linha.replace(/ {2,}/g, ' ').trim(); }).join('\n');
  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
}

// aplica limparFormatacao em todos os campos de texto da questão de
// uma vez (enunciado, alternativas preenchidas, resolução)
function formatarTudo(item) {
  item.enunciado = limparFormatacao(item.enunciado) || '';
  LETRAS_ALTERNATIVA.forEach(function (l) {
    if (item.alternativas[l]) item.alternativas[l] = limparFormatacao(item.alternativas[l]);
  });
  if (item.resolucao) item.resolucao = limparFormatacao(item.resolucao);
}

// ------------------------------------------------------------
// DETECÇÃO DE DUPLICATA — texto normalizado (minúsculas, espaços
// colapsados) de todo enunciado já no banco, carregado uma vez no
// início. Não é fuzzy match: pega enunciado idêntico (ou só com
// diferença de espaçamento/maiúscula), que é o caso comum de
// reimportar sem querer o mesmo lote ou lotes que se sobrepõem.
// ------------------------------------------------------------
function normalizarTextoDup(texto) {
  return (texto || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

async function carregarEnunciadosExistentes() {
  const { data } = await supabaseClient.from('questions').select('enunciado');
  enunciadosExistentes = new Set((data || []).map(function (q) { return normalizarTextoDup(q.enunciado); }));
}

// duas (ou mais) questões do próprio arquivo carregado com o mesmo
// enunciado — marca todas menos a primeira ocorrência como suspeitas,
// pra não importar as duas automaticamente na mesma leva
function marcarDuplicatasNoArquivo(lista) {
  const vistos = new Set();
  lista.forEach(function (item) {
    const chave = normalizarTextoDup(item.enunciado);
    item.duplicadoNoArquivo = !!chave && vistos.has(chave);
    if (chave) vistos.add(chave);
  });
}

// resolve materia/topico pelo nome (vindos do JSON) contra o que já
// está cadastrado na plataforma — não cria nada novo, só casa
function resolverMateria(nome) {
  if (!nome) return null;
  const alvo = nome.trim().toLowerCase();
  const m = todasMaterias.find(function (m) { return m.nome.trim().toLowerCase() === alvo; });
  return m ? m.id : null;
}

function resolverTopico(materiaId, nome) {
  if (!materiaId || !nome) return null;
  const alvo = nome.trim().toLowerCase();
  const t = todosTopicos.find(function (t) { return t.materia_id === materiaId && t.nome.trim().toLowerCase() === alvo; });
  return t ? t.id : null;
}

function popularSelectMaterias(selectEl, ehLotePadrao) {
  const placeholder = ehLotePadrao ? '<option value="">— nenhuma —</option>' : '<option value="">Selecione...</option>';
  selectEl.innerHTML = placeholder + todasMaterias.map(function (m) {
    return '<option value="' + m.id + '">' + escapeHtml(m.nome) + '</option>';
  }).join('');
}

function popularSelectTopicos(selectEl, materiaId, topicoSelecionadoId) {
  if (!materiaId) {
    selectEl.innerHTML = '<option value="">Selecione a matéria antes</option>';
    selectEl.disabled = true;
    return;
  }
  const topicos = todosTopicos.filter(function (t) { return t.materia_id === materiaId; });
  selectEl.disabled = false;
  if (topicos.length === 0) {
    selectEl.innerHTML = '<option value="">Nenhum tópico cadastrado nessa matéria</option>';
    return;
  }
  selectEl.innerHTML = '<option value="">Selecione...</option>' + topicos.map(function (t) {
    return '<option value="' + t.id + '"' + (t.id === topicoSelecionadoId ? ' selected' : '') + '>' + escapeHtml(t.nome) + '</option>';
  }).join('');
}

// ------------------------------------------------------------
// CARREGAR O JSON
// ------------------------------------------------------------
function onArquivoSelecionado(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () { document.getElementById('jsonPaste').value = reader.result; };
  reader.onerror = function () { alert('Não foi possível ler o arquivo.'); };
  reader.readAsText(file);
}

function onCarregarClique() {
  const raw = document.getElementById('jsonPaste').value.trim();
  if (!raw) { alert('Cole ou escolha um arquivo JSON primeiro.'); return; }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    alert('JSON inválido: ' + err.message);
    return;
  }
  if (!Array.isArray(parsed)) { alert('O JSON precisa ser uma lista de questões (array).'); return; }
  if (parsed.length === 0) { alert('A lista está vazia.'); return; }

  processarItensJson(parsed);
}

function processarItensJson(itens) {
  const erros = [];
  filaCarregadaTemp = [];
  const materiaLotePadrao = document.getElementById('materiaLoteSelect').value || null;

  itens.forEach(function (raw, i) {
    const erro = validarItemJson(raw, i + 1);
    if (erro) { erros.push(erro); return; }
    filaCarregadaTemp.push(normalizarItemJson(raw, materiaLotePadrao));
  });

  marcarDuplicatasNoArquivo(filaCarregadaTemp);

  const prontas = filaCarregadaTemp.filter(function (it) { return avaliarElegibilidadeAuto(it).length === 0; });
  const precisamRevisao = filaCarregadaTemp.length - prontas.length;

  document.getElementById('reportSummary').textContent =
    itens.length + ' questões no arquivo · ' + filaCarregadaTemp.length + ' carregadas · ' + erros.length + ' com erro de formato (não entram na fila).';
  document.getElementById('reportAutoInfo').textContent =
    prontas.length + ' prontas pra importação automática (sem imagem, sem pendências, sem duplicata) · ' +
    precisamRevisao + ' precisam da sua revisão (imagem, matéria/tópico não encontrados, gabarito inconsistente, LaTeX que parece quebrado ou possível duplicata).';

  const errorList = document.getElementById('errorList');
  if (erros.length > 0) {
    errorList.classList.remove('hidden');
    errorList.innerHTML = erros.map(function (e) { return '<div class="error-item">' + escapeHtml(e) + '</div>'; }).join('');
  } else {
    errorList.classList.add('hidden');
    errorList.innerHTML = '';
  }

  const importarAutoBtn = document.getElementById('importarAutoBtn');
  importarAutoBtn.classList.toggle('hidden', prontas.length === 0);
  importarAutoBtn.textContent = 'Importar automaticamente as ' + prontas.length + ' sem pendências';

  const iniciarRevisaoBtn = document.getElementById('iniciarRevisaoBtn');
  iniciarRevisaoBtn.disabled = filaCarregadaTemp.length === 0;
  iniciarRevisaoBtn.textContent = prontas.length > 0 ? 'Revisar tudo manualmente (ignorar auto-importação)' : 'Iniciar revisão';

  document.getElementById('reportCard').classList.remove('hidden');
}

// os dois pontos abaixo aceitam as letras em qualquer caixa ("A"/"a") —
// alguns JSONs exportados de outras fontes vêm com as chaves maiúsculas
function normalizarChavesLetra(obj) {
  const out = {};
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(function (k) { out[k.trim().toLowerCase()] = obj[k]; });
  }
  return out;
}

// Estrutural apenas — o enunciado é a única coisa que precisa vir pronta.
// Alternativas sem texto (só imagem, colada depois na revisão) são
// normais: a tela de revisão sempre oferece as 5 letras pra preencher,
// e quem exige "pelo menos 2 preenchidas" é validarAntesDeAprovar, na
// hora de aprovar — não o carregamento do JSON.
function validarItemJson(raw, numero) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return 'item ' + numero + ': não é um objeto';
  if (typeof raw.enunciado !== 'string' || !raw.enunciado.trim()) return 'item ' + numero + ': "enunciado" ausente ou vazio';
  if (raw.alternativas !== undefined && raw.alternativas !== null &&
      (typeof raw.alternativas !== 'object' || Array.isArray(raw.alternativas))) {
    return 'item ' + numero + ': "alternativas" precisa ser um objeto';
  }
  return null;
}

// uma letra conta como preenchida se tiver texto OU imagem — várias
// questões (gráficos, diagramas) só têm sentido como imagem
function letraAtiva(item, letra) {
  return !!((item.alternativas[letra] || '').trim() || item.alternativasImagens[letra]);
}

function normalizarItemJson(raw, materiaLotePadrao) {
  const alternativasRaw = normalizarChavesLetra(raw.alternativas);
  const alternativas = {};
  LETRAS_ALTERNATIVA.forEach(function (l) {
    const v = alternativasRaw[l];
    if (typeof v === 'string' && v.trim()) alternativas[l] = v.trim();
  });

  const altImgsRaw = normalizarChavesLetra(raw.alternativas_imagens);
  const alternativasImagens = {};
  LETRAS_ALTERNATIVA.forEach(function (l) {
    const v = altImgsRaw[l];
    if (typeof v === 'string' && v.trim()) alternativasImagens[l] = v.trim();
  });

  let gabarito = typeof raw.gabarito === 'string' ? raw.gabarito.trim().toLowerCase() : null;
  if (gabarito && !(alternativas[gabarito] || alternativasImagens[gabarito])) gabarito = null;

  const dificuldadeBruta = typeof raw.dificuldade === 'string' ? raw.dificuldade.trim().toLowerCase() : '';
  const dificuldadeInvalida = DIFICULDADES_VALIDAS.indexOf(dificuldadeBruta) === -1;
  const dificuldade = dificuldadeInvalida ? 'medio' : dificuldadeBruta;

  let ano = raw.ano;
  ano = (ano === null || ano === undefined || ano === '') ? null : parseInt(ano, 10);
  if (Number.isNaN(ano)) ano = null;

  // matéria/tópico vêm pelo nome no JSON e são resolvidos contra o que já
  // existe na plataforma; se a matéria não veio no item, cai no padrão do
  // lote (se houver) — mas se veio e não bateu com nada, NÃO cai no padrão:
  // isso é uma inconsistência de verdade, melhor mandar pra revisão
  const materiaNomeOriginal = typeof raw.materia === 'string' ? raw.materia.trim() : '';
  let materiaId = materiaNomeOriginal ? resolverMateria(materiaNomeOriginal) : null;
  if (!materiaNomeOriginal && materiaLotePadrao) materiaId = materiaLotePadrao;

  const topicoNomeOriginal = typeof raw.topico === 'string' ? raw.topico.trim() : '';
  const topicoId = (materiaId && topicoNomeOriginal) ? resolverTopico(materiaId, topicoNomeOriginal) : null;

  const imagemEnunciadoFlag = raw.imagem_enunciado === true;
  const alternativasComImagemFlag = (Array.isArray(raw.alternativas_com_imagem) ? raw.alternativas_com_imagem : [])
    .filter(function (l) { return typeof l === 'string'; })
    .map(function (l) { return l.trim().toLowerCase(); })
    .filter(function (l) { return LETRAS_ALTERNATIVA.indexOf(l) !== -1; });

  return {
    enunciado: raw.enunciado.trim(),
    imagemUrl: (typeof raw.imagem_url === 'string' && raw.imagem_url.trim()) ? raw.imagem_url.trim() : null,
    dificuldade: dificuldade,
    dificuldadeInvalida: dificuldadeInvalida,
    instituicao: (typeof raw.instituicao === 'string' && raw.instituicao.trim()) ? raw.instituicao.trim() : null,
    ano: ano,
    alternativas: alternativas,
    alternativasImagens: alternativasImagens,
    gabarito: gabarito,
    resolucao: (typeof raw.resolucao === 'string' && raw.resolucao.trim()) ? raw.resolucao.trim() : null,
    materiaId: materiaId,
    materiaNomeOriginal: materiaNomeOriginal,
    topicoId: topicoId,
    topicoNomeOriginal: topicoNomeOriginal,
    imagemEnunciadoFlag: imagemEnunciadoFlag,
    alternativasComImagemFlag: alternativasComImagemFlag,
    status: 'pendente',
    dbId: null,
  };
}

// ------------------------------------------------------------
// ELEGIBILIDADE PRA IMPORTAÇÃO AUTOMÁTICA — lista de motivos pelos
// quais uma questão precisa de revisão manual; vazio = pode importar
// direto. Isso é checagem estrutural (consistência), não revisão de
// texto/digitação — essa parte continua exigindo um humano.
// ------------------------------------------------------------
function pareceLatexQuebrado(texto) {
  if (!texto) return false;
  const cifroesSimples = (texto.match(/(?<!\\)\$/g) || []).length;
  if (cifroesSimples % 2 !== 0) return true;
  let abertas = 0;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (ch === '\\') { i++; continue; } // pula o caractere escapado
    if (ch === '{') abertas++;
    else if (ch === '}') abertas--;
    if (abertas < 0) return true;
  }
  return abertas !== 0;
}

function avaliarElegibilidadeAuto(item) {
  const motivos = [];

  // fallbacks defensivos: uma sessão salva no localStorage antes dessa
  // versão não tem esses campos — sem isso um refresh no meio de uma
  // revisão antiga quebraria a tela inteira
  if (item.imagemEnunciadoFlag && !item.imagemUrl) motivos.push('enunciado precisa de imagem');
  (item.alternativasComImagemFlag || []).forEach(function (l) {
    if (!item.alternativasImagens[l]) motivos.push('alternativa ' + l.toUpperCase() + ' precisa de imagem');
  });

  if (!item.materiaId) motivos.push('matéria "' + (item.materiaNomeOriginal || '(não informada)') + '" não encontrada');
  else if (!item.topicoId) motivos.push('tópico "' + (item.topicoNomeOriginal || '(não informado)') + '" não encontrado nessa matéria');

  if (item.dificuldadeInvalida) motivos.push('dificuldade ausente ou inválida');

  const chaveDup = normalizarTextoDup(item.enunciado);
  if (chaveDup && enunciadosExistentes.has(chaveDup)) {
    motivos.push('já existe uma questão com esse enunciado no banco');
  } else if (item.duplicadoNoArquivo) {
    motivos.push('esse enunciado se repete em mais de uma questão do arquivo carregado');
  }

  const letrasAtivas = LETRAS_ALTERNATIVA.filter(function (l) { return letraAtiva(item, l); });
  if (letrasAtivas.length < 2) motivos.push('menos de 2 alternativas preenchidas');
  if (!item.gabarito || letrasAtivas.indexOf(item.gabarito) === -1) motivos.push('gabarito ausente ou não corresponde a alternativa preenchida');

  if (pareceLatexQuebrado(item.enunciado)) motivos.push('possível LaTeX quebrado no enunciado');
  LETRAS_ALTERNATIVA.forEach(function (l) {
    if (pareceLatexQuebrado(item.alternativas[l])) motivos.push('possível LaTeX quebrado na alternativa ' + l.toUpperCase());
  });
  if (pareceLatexQuebrado(item.resolucao)) motivos.push('possível LaTeX quebrado na resolução');

  return motivos;
}

function atualizarMotivoBanner(item) {
  const banner = document.getElementById('motivoBanner');
  if (!banner) return;
  const motivos = avaliarElegibilidadeAuto(item);
  if (motivos.length > 0) {
    banner.classList.remove('hidden');
    banner.innerHTML = '<b>Por que está aqui:</b> ' + motivos.map(function (m) { return escapeHtml(m); }).join(' · ');
  } else {
    banner.classList.add('hidden');
  }
}

function iniciarRevisao() {
  fila = filaCarregadaTemp;
  indiceAtual = 0;
  salvarFilaLocal();
  mostrarViewRevisao();
}

function mostrarViewRevisao() {
  document.getElementById('wrapStep1').classList.add('hidden');
  document.getElementById('viewFinal').classList.remove('active');
  document.getElementById('viewRevisao').classList.add('active');
  renderItemAtual();
}

// Insere direto no banco as questões sem nenhuma pendência (sem imagem,
// matéria/tópico resolvidos, gabarito/dificuldade/LaTeX consistentes) em
// lotes, igual o importador antigo de CSV — sem passar pelo card de
// revisão. O que sobrar (tem imagem ou alguma inconsistência) cai direto
// na revisão manual, já na primeira pendência.
async function importarAutomaticamente() {
  const prontas = filaCarregadaTemp.filter(function (it) { return avaliarElegibilidadeAuto(it).length === 0; });
  if (prontas.length === 0) return;

  const btn = document.getElementById('importarAutoBtn');
  btn.disabled = true;
  document.getElementById('iniciarRevisaoBtn').disabled = true;
  document.getElementById('autoProgressCard').classList.remove('hidden');

  let feitas = 0;
  let paradaPorErro = false;

  for (let i = 0; i < prontas.length; i += TAMANHO_LOTE_AUTO) {
    const lote = prontas.slice(i, i + TAMANHO_LOTE_AUTO);
    const { data, error } = await supabaseClient.from('questions').insert(lote.map(montarPayload)).select('id');

    if (error) {
      console.error('Erro na importação automática:', error);
      alert('Deu erro importando um lote automático (itens ' + (i + 1) + '–' + (i + lote.length) + '): ' + error.message +
        '. As já importadas continuam salvas; esse lote e o que vier depois vão pra revisão manual.');
      paradaPorErro = true;
      break;
    }

    lote.forEach(function (item, idx) {
      item.status = 'aprovada';
      item.dbId = data && data[idx] ? data[idx].id : null;
      enunciadosExistentes.add(normalizarTextoDup(item.enunciado));
    });

    feitas += lote.length;
    document.getElementById('autoProgressLabel').textContent = feitas + ' / ' + prontas.length + ' importadas automaticamente';
    document.getElementById('autoProgressFill').style.width = (feitas / prontas.length * 100) + '%';
  }

  document.getElementById('autoProgressCard').classList.add('hidden');
  btn.disabled = false;
  document.getElementById('iniciarRevisaoBtn').disabled = false;
  if (paradaPorErro) return;

  fila = filaCarregadaTemp;
  salvarFilaLocal();

  const proximoPendente = fila.findIndex(function (it) { return it.status === 'pendente'; });
  if (proximoPendente === -1) {
    document.getElementById('wrapStep1').classList.add('hidden');
    mostrarFinal();
  } else {
    indiceAtual = proximoPendente;
    mostrarViewRevisao();
  }
}

// ------------------------------------------------------------
// SESSÃO SALVA (localStorage) — sobrevive a um refresh no meio
// de um lote grande. Só guarda texto/URLs (imagens já sobem pro
// Storage antes de entrar no estado), então fica leve.
// ------------------------------------------------------------
function checarSessaoSalva() {
  const salvo = carregarFilaLocal();
  if (!salvo || !salvo.fila || salvo.fila.length === 0) return;

  const pendentes = salvo.fila.filter(function (i) { return i.status === 'pendente'; }).length;
  document.getElementById('resumeMsg').textContent =
    'Encontramos uma revisão de ' + salvo.fila.length + ' questões (' + pendentes + ' ainda pendentes) salva neste navegador.';
  document.getElementById('resumeCard').classList.remove('hidden');

  document.getElementById('resumeBtn').onclick = function () {
    fila = salvo.fila;
    indiceAtual = Math.min(salvo.indiceAtual || 0, fila.length - 1);
    mostrarViewRevisao();
  };
  document.getElementById('resumeDiscardBtn').onclick = function () {
    limparFilaLocal();
    document.getElementById('resumeCard').classList.add('hidden');
  };
}

function salvarFilaLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fila: fila, indiceAtual: indiceAtual, savedAt: Date.now() }));
  } catch (err) {
    console.warn('Não foi possível salvar a sessão localmente:', err);
  }
}

function carregarFilaLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function limparFilaLocal() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignora */ }
}

// ------------------------------------------------------------
// RENDER DO ITEM ATUAL (form de edição + card oficial ao lado)
// ------------------------------------------------------------
function renderItemAtual() {
  if (fila.length === 0) return;
  const item = fila[indiceAtual];

  atualizarToolbar();

  document.getElementById('fMateria').value = item.materiaId || '';
  popularSelectTopicos(document.getElementById('fTopico'), item.materiaId, item.topicoId);

  document.getElementById('fDificuldade').value = item.dificuldade;
  document.getElementById('fInstituicao').value = item.instituicao || '';
  document.getElementById('fAno').value = item.ano || '';
  document.getElementById('fEnunciado').value = item.enunciado;
  document.getElementById('fResolucao').value = item.resolucao || '';

  document.getElementById('fmtTudoBtn').onclick = function () {
    formatarTudo(item);
    salvarFilaLocal();
    renderItemAtual();
  };

  document.getElementById('fmtEnunciadoBtn').onclick = function () {
    const novo = limparFormatacao(document.getElementById('fEnunciado').value);
    document.getElementById('fEnunciado').value = novo;
    item.enunciado = novo;
    salvarFilaLocal();
    renderPreview(item);
  };

  document.getElementById('fmtResolucaoBtn').onclick = function () {
    const novo = limparFormatacao(document.getElementById('fResolucao').value);
    document.getElementById('fResolucao').value = novo;
    item.resolucao = novo;
    salvarFilaLocal();
    renderPreview(item);
  };

  document.getElementById('fMateria').onchange = function (ev) {
    item.materiaId = ev.target.value || null;
    item.topicoId = null;
    popularSelectTopicos(document.getElementById('fTopico'), item.materiaId, null);
    salvarFilaLocal();
    renderPreview(item);
  };
  document.getElementById('fTopico').onchange = function (ev) {
    item.topicoId = ev.target.value || null;
    salvarFilaLocal();
    renderPreview(item);
  };
  document.getElementById('fDificuldade').onchange = function (ev) {
    item.dificuldade = ev.target.value;
    item.dificuldadeInvalida = false;
    salvarFilaLocal();
    renderPreview(item);
  };
  document.getElementById('fInstituicao').oninput = debounce(function (ev) {
    item.instituicao = ev.target.value.trim() || null;
    salvarFilaLocal();
    renderPreview(item);
  }, 200);
  document.getElementById('fAno').oninput = debounce(function (ev) {
    const v = parseInt(ev.target.value, 10);
    item.ano = Number.isNaN(v) ? null : v;
    salvarFilaLocal();
    renderPreview(item);
  }, 200);
  document.getElementById('fEnunciado').oninput = debounce(function (ev) {
    item.enunciado = ev.target.value;
    salvarFilaLocal();
    renderPreview(item);
  }, 200);
  document.getElementById('fResolucao').oninput = debounce(function (ev) {
    item.resolucao = ev.target.value;
    salvarFilaLocal();
    renderPreview(item);
  }, 200);

  function atualizarImgEnunciado(novaUrl) {
    item.imagemUrl = novaUrl;
    salvarFilaLocal();
    renderImgPicker(document.getElementById('imgEnunciadoPicker'), item.imagemUrl, 'enunciado', atualizarImgEnunciado);
    renderPreview(item);
  }
  renderImgPicker(document.getElementById('imgEnunciadoPicker'), item.imagemUrl, 'enunciado', atualizarImgEnunciado);

  renderAltEditList(item);
  renderPreview(item);

  document.getElementById('anteriorBtn').disabled = indiceAtual === 0;
}

function atualizarToolbar() {
  document.getElementById('toolbarCounter').textContent = (indiceAtual + 1) + ' / ' + fila.length;
  document.getElementById('toolbarProgress').style.width = ((indiceAtual + 1) / fila.length * 100) + '%';
  const aprovadas = fila.filter(function (i) { return i.status === 'aprovada'; }).length;
  const puladas = fila.filter(function (i) { return i.status === 'pulada'; }).length;
  document.getElementById('toolbarOk').textContent = aprovadas + ' aprovadas';
  document.getElementById('toolbarSkip').textContent = puladas + ' puladas';
}

function renderAltEditList(item) {
  const container = document.getElementById('altEditList');
  container.innerHTML = '';

  LETRAS_ALTERNATIVA.forEach(function (letra) {
    const texto = item.alternativas[letra] || '';

    const row = document.createElement('div');
    row.className = 'alt-edit-row' + (item.gabarito === letra ? ' is-gabarito' : '');

    const top = document.createElement('div');
    top.className = 'alt-edit-top';

    const letraBadge = document.createElement('div');
    letraBadge.className = 'alt-edit-letra';
    letraBadge.textContent = letra.toUpperCase();
    top.appendChild(letraBadge);

    const textarea = document.createElement('textarea');
    textarea.className = 'alt-edit-texto';
    textarea.placeholder = 'Texto da alternativa ' + letra.toUpperCase() + ' (opcional se você colar uma imagem abaixo)';
    textarea.value = texto;
    textarea.oninput = debounce(function (ev) {
      const v = ev.target.value;
      if (v.trim()) {
        item.alternativas[letra] = v;
      } else {
        delete item.alternativas[letra];
      }
      if (item.gabarito === letra && !letraAtiva(item, letra)) {
        item.gabarito = null;
        const radio = row.querySelector('input[type=radio]');
        if (radio) radio.checked = false;
      }
      row.classList.toggle('is-gabarito', item.gabarito === letra);
      salvarFilaLocal();
      renderPreview(item);
    }, 200);
    top.appendChild(textarea);

    const fmtBtn = document.createElement('button');
    fmtBtn.type = 'button';
    fmtBtn.className = 'fmt-btn-icon';
    fmtBtn.title = 'Limpar formatação dessa alternativa';
    fmtBtn.textContent = '✨';
    fmtBtn.onclick = function () {
      const novo = limparFormatacao(textarea.value);
      textarea.value = novo;
      if (novo && novo.trim()) item.alternativas[letra] = novo;
      else delete item.alternativas[letra];
      salvarFilaLocal();
      renderPreview(item);
    };
    top.appendChild(fmtBtn);

    const gabaritoPick = document.createElement('label');
    gabaritoPick.className = 'gabarito-pick';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'gabarito';
    radio.checked = item.gabarito === letra;
    radio.onchange = function () {
      item.gabarito = letra;
      document.querySelectorAll('.alt-edit-row').forEach(function (r) { r.classList.remove('is-gabarito'); });
      row.classList.add('is-gabarito');
      salvarFilaLocal();
      renderPreview(item);
    };
    gabaritoPick.appendChild(radio);
    gabaritoPick.appendChild(document.createTextNode('correta'));
    top.appendChild(gabaritoPick);

    row.appendChild(top);

    const imgRow = document.createElement('div');
    imgRow.className = 'alt-edit-imgrow';
    renderImgPicker(imgRow, item.alternativasImagens[letra] || null, 'alt-' + letra, function (novaUrl) {
      if (novaUrl) item.alternativasImagens[letra] = novaUrl;
      else delete item.alternativasImagens[letra];
      if (item.gabarito === letra && !letraAtiva(item, letra)) item.gabarito = null;
      salvarFilaLocal();
      renderAltEditList(item);
      renderPreview(item);
    });
    row.appendChild(imgRow);

    container.appendChild(row);
  });
}

// ------------------------------------------------------------
// SELETOR DE IMAGEM — upload de arquivo, colar uma URL, ou colar
// (Ctrl+V) a imagem direto da área de transferência (útil pra quem
// copia um recorte de um PDF/print e não quer salvar em disco antes).
// ------------------------------------------------------------
function renderImgPicker(container, currentUrl, pastaPrefixo, onChange) {
  container.innerHTML = '';
  container.classList.add('img-picker');

  const thumbWrap = document.createElement('div');
  thumbWrap.tabIndex = 0;
  thumbWrap.className = 'thumb-focus';
  thumbWrap.title = 'Clique aqui e cole (Ctrl+V) uma imagem copiada';
  if (currentUrl) {
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = currentUrl;
    img.onerror = function () { img.replaceWith(criarThumbVazio()); };
    thumbWrap.appendChild(img);
  } else {
    thumbWrap.appendChild(criarThumbVazio());
  }
  container.appendChild(thumbWrap);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const btnRow = document.createElement('div');
  btnRow.className = 'btn-row';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.className = 'hidden';

  const uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'mini-btn';
  uploadBtn.textContent = currentUrl ? 'Trocar imagem' : 'Enviar imagem';
  uploadBtn.onclick = function () { fileInput.click(); };
  btnRow.appendChild(uploadBtn);

  if (currentUrl) {
    const rmBtn = document.createElement('button');
    rmBtn.type = 'button';
    rmBtn.className = 'mini-btn rm';
    rmBtn.textContent = 'Remover';
    rmBtn.onclick = function () { onChange(null); };
    btnRow.appendChild(rmBtn);
  }
  actions.appendChild(btnRow);

  const urlRow = document.createElement('div');
  urlRow.className = 'url-row';
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'ou cole uma URL de imagem';
  urlInput.value = currentUrl || '';
  urlInput.onchange = function () {
    const v = urlInput.value.trim();
    if (v && !/^https?:\/\//i.test(v)) { alert('URL de imagem precisa começar com http(s)://'); return; }
    onChange(v || null);
  };
  urlRow.appendChild(urlInput);
  actions.appendChild(urlRow);

  const pasteHint = document.createElement('div');
  pasteHint.className = 'paste-hint';
  pasteHint.textContent = 'dica: clique na miniatura e cole (Ctrl+V) uma imagem copiada';
  actions.appendChild(pasteHint);

  const status = document.createElement('div');
  status.className = 'status';
  actions.appendChild(status);

  container.appendChild(actions);
  container.appendChild(fileInput);

  async function processarArquivo(file) {
    if (!file) return;
    status.textContent = 'Enviando...';
    status.classList.remove('err');
    uploadBtn.disabled = true;
    try {
      const url = await enviarImagem(file, pastaPrefixo);
      status.textContent = '';
      onChange(url);
    } catch (err) {
      console.error('Erro ao enviar imagem:', err);
      status.textContent = 'Falha ao enviar. Tente de novo.';
      status.classList.add('err');
      uploadBtn.disabled = false;
    }
  }

  fileInput.onchange = function () { processarArquivo(fileInput.files[0]); };

  thumbWrap.addEventListener('paste', function (ev) {
    const itens = (ev.clipboardData && ev.clipboardData.items) || [];
    let itemImagem = null;
    for (let i = 0; i < itens.length; i++) {
      if (itens[i].type && itens[i].type.indexOf('image/') === 0) { itemImagem = itens[i]; break; }
    }
    if (!itemImagem) return;
    ev.preventDefault();
    processarArquivo(itemImagem.getAsFile());
  });
}

function criarThumbVazio() {
  const div = document.createElement('div');
  div.className = 'thumb-empty';
  div.textContent = '🖼️';
  return div;
}

async function enviarImagem(file, pastaPrefixo) {
  const blob = await comprimirImagem(file);
  const nomeArquivo = pastaPrefixo + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
  const { error } = await supabaseClient.storage.from('questoes').upload(nomeArquivo, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  const { data: pub } = supabaseClient.storage.from('questoes').getPublicUrl(nomeArquivo);
  return pub.publicUrl;
}

// redimensiona pro maior lado caber em 1280px e comprime pra JPEG —
// enunciados/alternativas viram gráficos/prints, não precisam de mais
// resolução que isso, e mantém o Storage grátis rendendo bem
function comprimirImagem(file) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    img.onload = function () {
      const MAX = 1280;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob); else reject(new Error('canvas.toBlob falhou'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(img.src); reject(new Error('imagem inválida')); };
    img.src = URL.createObjectURL(file);
  });
}

// ------------------------------------------------------------
// PRÉ-VISUALIZAÇÃO — mesmo card visual de questao.html, sempre
// mostrando a alternativa marcada como correta em verde (não é
// um quiz, é conferência de conteúdo).
// ------------------------------------------------------------
function renderPreview(item) {
  atualizarMotivoBanner(item);

  const metaEl = document.getElementById('pMeta');
  metaEl.innerHTML =
    '<span class="q-tag">' + escapeHtml(item.dificuldade) + '</span>' +
    (item.instituicao
      ? '<span class="q-tag muted">' + escapeHtml(item.instituicao) + (item.ano ? ' ' + item.ano : '') + '</span>'
      : (item.ano ? '<span class="q-tag muted">' + item.ano + '</span>' : ''));

  const enunciadoEl = document.getElementById('pEnunciado');
  if (item.enunciado.trim()) {
    enunciadoEl.classList.remove('empty');
    enunciadoEl.innerHTML = escapeHtml(item.enunciado);
    renderMathInElement(enunciadoEl, KATEX_OPTS);
  } else {
    enunciadoEl.classList.add('empty');
    enunciadoEl.textContent = 'O enunciado aparece aqui...';
  }

  const imgBox = document.getElementById('pImagem');
  imgBox.innerHTML = '';
  if (item.imagemUrl) {
    imgBox.style.display = 'block';
    const img = document.createElement('img');
    img.src = item.imagemUrl;
    img.alt = 'Imagem da questão';
    img.onerror = function () { imgBox.style.display = 'none'; };
    imgBox.appendChild(img);
  } else {
    imgBox.style.display = 'none';
  }

  const letras = LETRAS_ALTERNATIVA.filter(function (l) { return letraAtiva(item, l); });
  const altList = document.getElementById('pAltList');
  const altEmpty = document.getElementById('pAltEmpty');

  altList.innerHTML = '';
  if (letras.length < 2) {
    altEmpty.classList.remove('hidden');
  } else {
    altEmpty.classList.add('hidden');
    letras.forEach(function (letra) {
      const texto = item.alternativas[letra] || '';
      const imgAlt = item.alternativasImagens[letra];
      const btn = document.createElement('div');
      btn.className = 'alt-btn' + (item.gabarito === letra ? ' correta' : '');
      btn.innerHTML =
        '<span class="alt-letra">' + letra.toUpperCase() + '</span>' +
        '<span class="alt-texto">' +
          (imgAlt ? '<img class="alt-img" src="' + escapeHtml(imgAlt) + '" alt="">' : '') +
          '<span class="alt-texto-content">' + escapeHtml(texto) + '</span>' +
        '</span>';
      altList.appendChild(btn);
      renderMathInElement(btn.querySelector('.alt-texto'), KATEX_OPTS);
    });
  }

  const resolucaoEl = document.getElementById('pResolucao');
  if (item.resolucao && item.resolucao.trim()) {
    resolucaoEl.classList.remove('hidden');
    resolucaoEl.innerHTML = '<b>Resolução:</b><br>' + escapeHtml(item.resolucao);
    renderMathInElement(resolucaoEl, KATEX_OPTS);
  } else {
    resolucaoEl.classList.add('hidden');
    resolucaoEl.innerHTML = '';
  }
}

// ------------------------------------------------------------
// NAVEGAÇÃO / APROVAÇÃO
// ------------------------------------------------------------
function irParaAnterior() {
  if (indiceAtual <= 0) return;
  indiceAtual--;
  salvarFilaLocal();
  renderItemAtual();
}

function irParaProxima() {
  if (indiceAtual >= fila.length - 1) {
    mostrarFinal();
    return;
  }
  indiceAtual++;
  salvarFilaLocal();
  renderItemAtual();
}

function pularAtual() {
  fila[indiceAtual].status = 'pulada';
  salvarFilaLocal();
  irParaProxima();
}

function validarAntesDeAprovar(item) {
  if (!item.materiaId) return 'Selecione a matéria.';
  if (!item.topicoId) return 'Selecione o tópico.';
  if (!item.enunciado.trim()) return 'O enunciado não pode ficar vazio.';
  const letras = LETRAS_ALTERNATIVA.filter(function (l) { return letraAtiva(item, l); });
  if (letras.length < 2) return 'Preencha pelo menos 2 alternativas (texto ou imagem).';
  if (!item.gabarito || letras.indexOf(item.gabarito) === -1) return 'Marque qual alternativa é a correta.';
  if (DIFICULDADES_VALIDAS.indexOf(item.dificuldade) === -1) return 'Dificuldade inválida.';
  return null;
}

function montarPayload(item) {
  return {
    topic_id: item.topicoId,
    dificuldade: item.dificuldade,
    instituicao: item.instituicao || null,
    ano: item.ano || null,
    enunciado: item.enunciado.trim(),
    imagem_url: item.imagemUrl || null,
    alternativas: alternativasPreenchidas(item),
    alternativas_imagens: Object.keys(item.alternativasImagens).length > 0 ? item.alternativasImagens : null,
    gabarito: item.gabarito,
    resolucao: (item.resolucao && item.resolucao.trim()) ? item.resolucao.trim() : null,
  };
}

async function aprovarAtual() {
  const item = fila[indiceAtual];
  const erro = validarAntesDeAprovar(item);
  if (erro) { alert(erro); return; }

  const chaveDup = normalizarTextoDup(item.enunciado);
  if (chaveDup && enunciadosExistentes.has(chaveDup)) {
    if (!confirm('Já existe uma questão com esse enunciado (ou muito parecido) no banco. Aprovar mesmo assim?')) return;
  }

  const aprovarBtn = document.getElementById('aprovarBtn');
  aprovarBtn.disabled = true;
  aprovarBtn.textContent = 'Salvando...';

  const payload = montarPayload(item);

  let error;
  if (item.dbId) {
    ({ error } = await supabaseClient.from('questions').update(payload).eq('id', item.dbId));
  } else {
    const res = await supabaseClient.from('questions').insert(payload).select('id').single();
    error = res.error;
    if (!error) item.dbId = res.data.id;
  }

  aprovarBtn.disabled = false;
  aprovarBtn.textContent = 'Aprovar e continuar →';

  if (error) {
    console.error('Erro ao salvar questão:', error);
    alert('Não foi possível salvar essa questão: ' + error.message);
    return;
  }

  item.status = 'aprovada';
  enunciadosExistentes.add(normalizarTextoDup(item.enunciado));
  salvarFilaLocal();
  irParaProxima();
}

function alternativasPreenchidas(item) {
  // a letra entra mesmo sem texto quando tem imagem — sem isso a chave
  // some do jsonb e questao.js (que lê Object.keys(alternativas) pra saber
  // quais letras existem) nunca desenharia essa alternativa
  const out = {};
  LETRAS_ALTERNATIVA.forEach(function (l) {
    if (letraAtiva(item, l)) out[l] = (item.alternativas[l] || '').trim();
  });
  return out;
}

function mostrarFinal() {
  document.getElementById('viewRevisao').classList.remove('active');
  document.getElementById('viewFinal').classList.add('active');

  const aprovadas = fila.filter(function (i) { return i.status === 'aprovada'; }).length;
  const puladas = fila.filter(function (i) { return i.status === 'pulada'; }).length;
  document.getElementById('doneOk').textContent = aprovadas;
  document.getElementById('doneSkip').textContent = puladas;
  document.getElementById('doneTotal').textContent = fila.length;

  if (puladas === 0) limparFilaLocal();

  document.getElementById('revisarPuladasBtn').classList.toggle('hidden', puladas === 0);
}

function revisarPuladas() {
  const idx = fila.findIndex(function (i) { return i.status === 'pulada'; });
  if (idx === -1) return;
  indiceAtual = idx;
  document.getElementById('viewFinal').classList.remove('active');
  document.getElementById('viewRevisao').classList.add('active');
  renderItemAtual();
}

function descartarSessao() {
  if (!confirm('Descartar essa sessão de revisão? Questões já aprovadas continuam salvas no banco; as pendentes/puladas saem da fila.')) return;
  limparFilaLocal();
  fila = [];
  indiceAtual = 0;
  document.getElementById('viewRevisao').classList.remove('active');
  document.getElementById('viewFinal').classList.remove('active');
  document.getElementById('wrapStep1').classList.remove('hidden');
  document.getElementById('reportCard').classList.add('hidden');
  document.getElementById('resumeCard').classList.add('hidden');
  document.getElementById('jsonPaste').value = '';
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function debounce(fn, ms) {
  let t;
  return function () {
    const args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
