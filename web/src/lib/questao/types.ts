export type Pergunta = {
  id: string;
  topic_id: string | null;
  enunciado: string;
  alternativas: Record<string, string> | null;
  alternativas_imagens: Record<string, string> | null;
  gabarito: string;
  dificuldade: string | null;
  instituicao: string | null;
  ano: number | null;
  imagem_url: string | null;
  resolucao: string | null;
  subtopico: string | null;
  tempo_medio_seg: number | null;
};

export type MissaoResumo = {
  id: string;
  subject_id: string | null;
  subjectNome: string | null;
  recap_topico_id: string | null;
  avulsa: boolean;
  tempo_previsto_min: number | null;
};
