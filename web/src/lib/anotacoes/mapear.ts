import type { ItemImportado, Letra } from "@/lib/importar/types";
import type { QuestaoComContexto } from "./dados";

// Pergunta (lib/questao/types.ts) e ItemImportado (lib/importar/types.ts)
// têm quase os mesmos campos de conteúdo — esse mapper deixa reaproveitar
// o PreviewCard do importador (mesmo card visual de questao.html) nas
// telas de Favoritos/Anotações, sem duplicar a renderização de
// enunciado+alternativas+resolução.
export function questaoParaItemImportado(q: QuestaoComContexto): ItemImportado {
  return {
    enunciado: q.enunciado || "",
    imagemUrl: q.imagem_url,
    dificuldade: q.dificuldade || "medio",
    dificuldadeInvalida: false,
    instituicao: q.instituicao,
    ano: q.ano,
    alternativas: (q.alternativas || {}) as Partial<Record<Letra, string>>,
    alternativasImagens: (q.alternativas_imagens || {}) as Partial<Record<Letra, string>>,
    gabarito: q.gabarito,
    resolucao: q.resolucao,
    subtopico: q.subtopico,
    materiaId: null,
    materiaNomeOriginal: q.materiaNome || "",
    topicoId: q.topic_id,
    topicoNomeOriginal: q.topicoNome || "",
    imagemEnunciadoFlag: false,
    alternativasComImagemFlag: [],
    tikzCode: null,
    alternativasTikz: {},
    fonteArquivo: null,
    fontePagina: null,
    status: "pendente",
    dbId: q.id,
  };
}
