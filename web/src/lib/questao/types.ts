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
  /** Questão de APROFUNDAMENTO (ver supabase_questao_desafio.sql): vai além
   *  do nível cobrado na prova. Fica fora de todo sorteio automático e o
   *  aluno a vê com selo próprio. Não confundir com o "desafio de
   *  recuperação" do fim da missão, que é outra coisa (retrieval practice). */
  desafio: boolean | null;
};

export type MissaoResumo = {
  id: string;
  subject_id: string | null;
  subjectNome: string | null;
  recap_topico_id: string | null;
  avulsa: boolean;
  tempo_previsto_min: number | null;
};
