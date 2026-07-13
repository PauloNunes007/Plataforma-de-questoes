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
  // Subtópico específico da ementa que essa questão testa (ex: "Regra da
  // cadeia" dentro do tópico "Cálculo das Derivadas") — mais granular que
  // topicos.descricao, que é um texto único por tópico inteiro.
  subtopico: string | null;
  materiaId: string | null;
  materiaNomeOriginal: string;
  topicoId: string | null;
  topicoNomeOriginal: string;
  imagemEnunciadoFlag: boolean;
  alternativasComImagemFlag: string[];
  // Código TikZ opcional pra gerar a figura, compilado no backend
  // (ver lib/importar/tikz-server.ts) — guardado só durante a sessão de
  // revisão, não é enviado pro banco (o que vai pra `questions.imagem_url`/
  // `alternativas_imagens` é sempre a URL do SVG já compilado).
  tikzCode: string | null;
  alternativasTikz: Partial<Record<Letra, string>>;
  // Origem da questão pra recortar a figura direto do PDF no importador
  // (ver components/importar/pdf-recortador.tsx). Só usados durante a
  // sessão de revisão — NÃO vão pro banco (como tikzCode). fontePagina é
  // 1-based, como o usuário conta as páginas.
  fonteArquivo: string | null;
  fontePagina: number | null;
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
  subtopico: string | null;
};
