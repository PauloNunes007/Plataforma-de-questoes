export const LETRAS_ALTERNATIVA = ["a", "b", "c", "d", "e"] as const;
export type Letra = (typeof LETRAS_ALTERNATIVA)[number];
export const DIFICULDADES_VALIDAS = ["facil", "medio", "dificil"] as const;

export type Materia = { id: string; nome: string };
export type Topico = { id: string; materia_id: string; nome: string; ordem: number | null };

export type ItemImportado = {
  enunciado: string;
  imagemUrl: string | null;
  dificuldade: string;
  dificuldadeInvalida: boolean;
  instituicao: string | null;
  ano: number | null;
  alternativas: Partial<Record<Letra, string>>;
  alternativasImagens: Partial<Record<Letra, string>>;
  gabarito: string | null;
  resolucao: string | null;
  materiaId: string | null;
  materiaNomeOriginal: string;
  topicoId: string | null;
  topicoNomeOriginal: string;
  imagemEnunciadoFlag: boolean;
  alternativasComImagemFlag: string[];
  status: "pendente" | "aprovada" | "pulada";
  dbId: string | null;
  duplicadoNoArquivo?: boolean;
};

export type QuestionPayload = {
  topic_id: string | null;
  dificuldade: string;
  instituicao: string | null;
  ano: number | null;
  enunciado: string;
  imagem_url: string | null;
  alternativas: Partial<Record<Letra, string>>;
  alternativas_imagens: Partial<Record<Letra, string>> | null;
  gabarito: string | null;
  resolucao: string | null;
};
