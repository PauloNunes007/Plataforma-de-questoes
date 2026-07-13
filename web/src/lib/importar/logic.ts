// Portado de js/importar.js — funções puras (sem Supabase, sem DOM) da
// ferramenta de importação: limpeza de formatação colada de PDF,
// detecção de duplicata, resolução de matéria/tópico por nome,
// normalização do JSON bruto e a checagem de elegibilidade pra
// importação automática. Ver o cabeçalho do arquivo legado pro
// contrato completo do JSON esperado.
import { DIFICULDADES_VALIDAS, LETRAS_ALTERNATIVA, type ItemImportado, type Letra, type Materia, type QuestionPayload, type Topico } from "./types";

// Heurística pra texto colado de PDF: junta quebra de linha de
// fim-de-página, desfaz hifenização de fim de linha, tira caractere
// invisível, normaliza aspas curvas. Não é undo-ável.
export function limparFormatacao(texto: string | null | undefined): string {
  if (!texto) return texto || "";
  let t = texto;

  t = t.replace(/\r\n?/g, "\n");
  t = t.replace(/[​﻿­]/g, "");
  t = t.replace(/[   ]/g, " ");
  t = t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  t = t.replace(/\t/g, " ");

  t = t.replace(/(\p{L})-\n(\p{L})/gu, "$1$2");

  const MARCA_PARAGRAFO = "";
  t = t.replace(/\n{2,}/g, MARCA_PARAGRAFO);
  t = t.replace(/\n/g, " ");
  t = t.split(MARCA_PARAGRAFO).join("\n\n");

  t = t.replace(/ +([,.;:!?])/g, "$1");
  t = t
    .split("\n")
    .map((linha) => linha.replace(/ {2,}/g, " ").trim())
    .join("\n");
  t = t.replace(/\n{3,}/g, "\n\n");

  return t.trim();
}

export function formatarTudo(item: ItemImportado) {
  item.enunciado = limparFormatacao(item.enunciado);
  LETRAS_ALTERNATIVA.forEach((l) => {
    if (item.alternativas[l]) item.alternativas[l] = limparFormatacao(item.alternativas[l]);
  });
  if (item.resolucao) item.resolucao = limparFormatacao(item.resolucao);
}

export function normalizarTextoDup(texto: string | null | undefined): string {
  return (texto || "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Detecção de duplicata "de verdade" precisa ir além de igualdade exata de
// string: um enunciado reimportado de outro PDF/fonte quase sempre difere em
// pontuação, acentuação ou uma palavra reformulada. Comparamos por
// similaridade de conjunto de tokens (Jaccard) sobre um texto normalizado que
// remove acentos e pontuação mas PRESERVA fórmulas (\, $) — é exatamente a
// parte matemática que distingue duas questões com o mesmo "template" de
// enunciado (ex: "Calcule a derivada de $f(x)=...$" com funções diferentes),
// então não pode ser descartada na normalização.
const LIMIAR_SIMILARIDADE = 0.9;
// Enunciados muito curtos (poucos tokens) geram falsos positivos fácil
// (qualquer overlap pequeno já vira uma fração grande) — só aplica o
// heurístico de similaridade acima de um piso de tokens.
const MIN_TOKENS_SIMILARIDADE = 6;

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function tokenizarParaSimilaridade(textoNormalizado: string): Set<string> {
  const limpo = removerAcentos(textoNormalizado).replace(/[^\p{L}\p{N}\\$]+/gu, " ");
  return new Set(limpo.split(" ").filter(Boolean));
}

function similaridadeJaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersecao = 0;
  a.forEach((token) => {
    if (b.has(token)) intersecao++;
  });
  const uniao = a.size + b.size - intersecao;
  return uniao === 0 ? 0 : intersecao / uniao;
}

export type IndiceDuplicatas = { normalizado: string; tokens: Set<string> }[];

export function construirIndiceDuplicatas(enunciados: Iterable<string>): IndiceDuplicatas {
  const indice: IndiceDuplicatas = [];
  for (const bruto of enunciados) {
    const normalizado = normalizarTextoDup(bruto);
    if (!normalizado) continue;
    indice.push({ normalizado, tokens: tokenizarParaSimilaridade(normalizado) });
  }
  return indice;
}

export type ResultadoDuplicata = { tipo: "exata" | "similar" } | null;

export function verificarDuplicata(enunciado: string, indice: IndiceDuplicatas): ResultadoDuplicata {
  const chave = normalizarTextoDup(enunciado);
  if (!chave) return null;
  const tokens = tokenizarParaSimilaridade(chave);
  let melhorScore = 0;
  for (const entrada of indice) {
    if (entrada.normalizado === chave) return { tipo: "exata" };
    if (tokens.size < MIN_TOKENS_SIMILARIDADE || entrada.tokens.size < MIN_TOKENS_SIMILARIDADE) continue;
    const score = similaridadeJaccard(tokens, entrada.tokens);
    if (score > melhorScore) melhorScore = score;
  }
  return melhorScore >= LIMIAR_SIMILARIDADE ? { tipo: "similar" } : null;
}

export function marcarDuplicatasNoArquivo(lista: ItemImportado[]) {
  const indiceVistos: IndiceDuplicatas = [];
  lista.forEach((item) => {
    const chave = normalizarTextoDup(item.enunciado);
    item.duplicadoNoArquivo = !!chave && !!verificarDuplicata(item.enunciado, indiceVistos);
    if (chave) indiceVistos.push({ normalizado: chave, tokens: tokenizarParaSimilaridade(chave) });
  });
}

export function resolverMateria(materias: Materia[], nome: string | null): string | null {
  if (!nome) return null;
  const alvo = nome.trim().toLowerCase();
  const m = materias.find((m) => m.nome.trim().toLowerCase() === alvo);
  return m ? m.id : null;
}

export function resolverTopico(topicos: Topico[], materiaId: string | null, nome: string | null): string | null {
  if (!materiaId || !nome) return null;
  const alvo = nome.trim().toLowerCase();
  const t = topicos.find((t) => t.materia_id === materiaId && t.nome.trim().toLowerCase() === alvo);
  return t ? t.id : null;
}

export function letraAtiva(item: ItemImportado, letra: Letra): boolean {
  return !!((item.alternativas[letra] || "").trim() || item.alternativasImagens[letra]);
}

function normalizarChavesLetra(obj: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      out[k.trim().toLowerCase()] = v;
    });
  }
  return out;
}

export function validarItemJson(raw: unknown, numero: number): string | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return `item ${numero}: não é um objeto`;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.enunciado !== "string" || !obj.enunciado.trim()) {
    return `item ${numero}: "enunciado" ausente ou vazio`;
  }
  if (
    obj.alternativas !== undefined &&
    obj.alternativas !== null &&
    (typeof obj.alternativas !== "object" || Array.isArray(obj.alternativas))
  ) {
    return `item ${numero}: "alternativas" precisa ser um objeto`;
  }
  return null;
}

export function normalizarItemJson(raw: Record<string, unknown>, materiaLotePadrao: string | null, materias: Materia[], topicos: Topico[]): ItemImportado {
  const alternativasRaw = normalizarChavesLetra(raw.alternativas);
  const alternativas: Partial<Record<Letra, string>> = {};
  LETRAS_ALTERNATIVA.forEach((l) => {
    const v = alternativasRaw[l];
    if (typeof v === "string" && v.trim()) alternativas[l] = v.trim();
  });

  const altImgsRaw = normalizarChavesLetra(raw.alternativas_imagens);
  const alternativasImagens: Partial<Record<Letra, string>> = {};
  LETRAS_ALTERNATIVA.forEach((l) => {
    const v = altImgsRaw[l];
    if (typeof v === "string" && v.trim()) alternativasImagens[l] = v.trim();
  });

  let gabarito = typeof raw.gabarito === "string" ? raw.gabarito.trim().toLowerCase() : null;
  if (gabarito && !(alternativas[gabarito as Letra] || alternativasImagens[gabarito as Letra])) gabarito = null;

  const dificuldadeBruta = typeof raw.dificuldade === "string" ? raw.dificuldade.trim().toLowerCase() : "";
  const dificuldadeInvalida = !DIFICULDADES_VALIDAS.includes(dificuldadeBruta as (typeof DIFICULDADES_VALIDAS)[number]);
  const dificuldade = dificuldadeInvalida ? "medio" : dificuldadeBruta;

  let ano: number | null = null;
  if (raw.ano !== null && raw.ano !== undefined && raw.ano !== ("" as unknown)) {
    const parsed = parseInt(String(raw.ano), 10);
    ano = Number.isNaN(parsed) ? null : parsed;
  }

  const materiaNomeOriginal = typeof raw.materia === "string" ? raw.materia.trim() : "";
  let materiaId = materiaNomeOriginal ? resolverMateria(materias, materiaNomeOriginal) : null;
  if (!materiaNomeOriginal && materiaLotePadrao) materiaId = materiaLotePadrao;

  const topicoNomeOriginal = typeof raw.topico === "string" ? raw.topico.trim() : "";
  const topicoId = materiaId && topicoNomeOriginal ? resolverTopico(topicos, materiaId, topicoNomeOriginal) : null;

  const imagemEnunciadoFlag = raw.imagem_enunciado === true;
  const alternativasComImagemFlag = (Array.isArray(raw.alternativas_com_imagem) ? raw.alternativas_com_imagem : [])
    .filter((l): l is string => typeof l === "string")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => (LETRAS_ALTERNATIVA as readonly string[]).includes(l));

  const fonteArquivo = typeof raw.fonte_arquivo === "string" && raw.fonte_arquivo.trim() ? raw.fonte_arquivo.trim() : null;
  let fontePagina: number | null = null;
  if (raw.fonte_pagina !== null && raw.fonte_pagina !== undefined && raw.fonte_pagina !== ("" as unknown)) {
    const parsedPag = parseInt(String(raw.fonte_pagina), 10);
    fontePagina = Number.isNaN(parsedPag) || parsedPag < 1 ? null : parsedPag;
  }

  const tikzCode = typeof raw.tikz_code === "string" && raw.tikz_code.trim() ? raw.tikz_code.trim() : null;
  const tikzRaw = normalizarChavesLetra(raw.alternativas_tikz);
  const alternativasTikz: Partial<Record<Letra, string>> = {};
  LETRAS_ALTERNATIVA.forEach((l) => {
    const v = tikzRaw[l];
    if (typeof v === "string" && v.trim()) alternativasTikz[l] = v.trim();
  });

  return {
    enunciado: (raw.enunciado as string).trim(),
    imagemUrl: typeof raw.imagem_url === "string" && raw.imagem_url.trim() ? raw.imagem_url.trim() : null,
    dificuldade,
    dificuldadeInvalida,
    instituicao: typeof raw.instituicao === "string" && raw.instituicao.trim() ? raw.instituicao.trim() : null,
    ano,
    alternativas,
    alternativasImagens,
    gabarito,
    resolucao: typeof raw.resolucao === "string" && raw.resolucao.trim() ? raw.resolucao.trim() : null,
    subtopico: typeof raw.subtopico === "string" && raw.subtopico.trim() ? raw.subtopico.trim() : null,
    materiaId,
    materiaNomeOriginal,
    topicoId,
    topicoNomeOriginal,
    imagemEnunciadoFlag,
    alternativasComImagemFlag,
    tikzCode,
    alternativasTikz,
    fonteArquivo,
    fontePagina,
    status: "pendente",
    dbId: null,
  };
}

export function pareceLatexQuebrado(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const cifroesSimples = (texto.match(/(?<!\\)\$/g) || []).length;
  if (cifroesSimples % 2 !== 0) return true;
  let abertas = 0;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "{") abertas++;
    else if (ch === "}") abertas--;
    if (abertas < 0) return true;
  }
  return abertas !== 0;
}

export function avaliarElegibilidadeAuto(item: ItemImportado, indiceExistentes: IndiceDuplicatas): string[] {
  const motivos: string[] = [];

  if (item.imagemEnunciadoFlag && !item.imagemUrl) motivos.push("enunciado precisa de imagem");
  (item.alternativasComImagemFlag || []).forEach((l) => {
    if (!item.alternativasImagens[l as Letra]) motivos.push(`alternativa ${l.toUpperCase()} precisa de imagem`);
  });

  if (item.tikzCode && !item.imagemUrl) motivos.push("enunciado tem código TikZ pendente de renderização");
  LETRAS_ALTERNATIVA.forEach((l) => {
    if (item.alternativasTikz[l] && !item.alternativasImagens[l]) {
      motivos.push(`alternativa ${l.toUpperCase()} tem código TikZ pendente de renderização`);
    }
  });

  if (!item.materiaId) motivos.push(`matéria "${item.materiaNomeOriginal || "(não informada)"}" não encontrada`);
  else if (!item.topicoId) motivos.push(`tópico "${item.topicoNomeOriginal || "(não informado)"}" não encontrado nessa matéria`);

  if (item.dificuldadeInvalida) motivos.push("dificuldade ausente ou inválida");

  // Sem dbId ainda (não salva nessa sessão) — se já tiver dbId a comparação
  // encontraria a própria questão (adicionada ao índice quando foi aprovada).
  if (!item.dbId) {
    const duplicata = verificarDuplicata(item.enunciado, indiceExistentes);
    if (duplicata?.tipo === "exata") {
      motivos.push("já existe uma questão com esse enunciado no banco");
    } else if (duplicata?.tipo === "similar") {
      motivos.push("já existe uma questão muito parecida (possível duplicata) no banco");
    } else if (item.duplicadoNoArquivo) {
      motivos.push("esse enunciado se repete (ou é muito parecido com outro) em mais de uma questão do arquivo carregado");
    }
  }

  const letrasAtivas = LETRAS_ALTERNATIVA.filter((l) => letraAtiva(item, l));
  if (letrasAtivas.length < 2) motivos.push("menos de 2 alternativas preenchidas");
  if (!item.gabarito || !letrasAtivas.includes(item.gabarito as Letra)) {
    motivos.push("gabarito ausente ou não corresponde a alternativa preenchida");
  }

  if (pareceLatexQuebrado(item.enunciado)) motivos.push("possível LaTeX quebrado no enunciado");
  LETRAS_ALTERNATIVA.forEach((l) => {
    if (pareceLatexQuebrado(item.alternativas[l])) motivos.push(`possível LaTeX quebrado na alternativa ${l.toUpperCase()}`);
  });
  if (pareceLatexQuebrado(item.resolucao)) motivos.push("possível LaTeX quebrado na resolução");

  return motivos;
}

export function validarAntesDeAprovar(item: ItemImportado): string | null {
  if (!item.materiaId) return "Selecione a matéria.";
  if (!item.topicoId) return "Selecione o tópico.";
  if (!item.enunciado.trim()) return "O enunciado não pode ficar vazio.";
  const letras = LETRAS_ALTERNATIVA.filter((l) => letraAtiva(item, l));
  if (letras.length < 2) return "Preencha pelo menos 2 alternativas (texto ou imagem).";
  if (!item.gabarito || !letras.includes(item.gabarito as Letra)) return "Marque qual alternativa é a correta.";
  if (!DIFICULDADES_VALIDAS.includes(item.dificuldade as (typeof DIFICULDADES_VALIDAS)[number])) return "Dificuldade inválida.";
  return null;
}

export function alternativasPreenchidas(item: ItemImportado): Partial<Record<Letra, string>> {
  const out: Partial<Record<Letra, string>> = {};
  LETRAS_ALTERNATIVA.forEach((l) => {
    if (letraAtiva(item, l)) out[l] = (item.alternativas[l] || "").trim();
  });
  return out;
}

export function montarPayload(item: ItemImportado): QuestionPayload {
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
    resolucao: item.resolucao && item.resolucao.trim() ? item.resolucao.trim() : null,
    subtopico: item.subtopico && item.subtopico.trim() ? item.subtopico.trim() : null,
  };
}
