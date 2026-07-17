// Constantes do Modo Aprovação (vestibular Unicamp/Fuvest 2026) —
// grade horária fixa por grupo de dia, provas-alvo e vocabulário dos
// formulários (disciplinas, bancas, tipos de erro). Conteúdo dinâmico
// (cronograma semanal, escada de simulados, obras) vem do banco — ver
// supabase_modo_aprovacao.sql.

export const PROVAS_ALVO = [
  { id: "unicamp", nome: "Unicamp", detalhe: "1ª fase", data: "2026-10-18" },
  { id: "fuvest", nome: "Fuvest", detalhe: "1ª fase", data: "2026-11-01" },
] as const;

export const DISCIPLINAS_APROVACAO = [
  "Matemática",
  "Física",
  "Química",
  "Biologia",
  "História",
  "Geografia",
  "Português",
  "Inglês",
  "Filosofia",
  "Sociologia",
  "Literatura",
  "Redação",
] as const;

// Disciplinas com input de acertos no cadastro de simulado (as provas de
// 1ª fase são multidisciplinares — o total é a soma do que for preenchido).
export const DISCIPLINAS_SIMULADO = [
  "Matemática",
  "Física",
  "Química",
  "Biologia",
  "História",
  "Geografia",
  "Português",
  "Inglês",
] as const;

export const BANCAS = ["Unicamp", "Fuvest", "ITA", "Outro"] as const;
export const FASES = ["1ª", "2ª", "Simulado"] as const;

export const MAX_QUESTOES_BANCA: Record<string, number> = {
  Unicamp: 72,
  Fuvest: 80,
};

export const TIPOS_ERRO = [
  { id: "conteudo", rotulo: "Conteúdo" },
  { id: "interpretacao", rotulo: "Interpretação" },
  { id: "atencao", rotulo: "Atenção" },
  { id: "tempo", rotulo: "Tempo" },
] as const;
export type TipoErro = (typeof TIPOS_ERRO)[number]["id"];

export type BlocoGrade = {
  bloco: string; // chave persistida em sessoes_estudo.bloco
  horario: string;
  titulo: string;
  tipo: "questoes" | "obra" | "redacao" | "simulado";
};

const GRADE_SEG_QUA_SEX: BlocoGrade[] = [
  { bloco: "8h", horario: "8h", titulo: "Matemática", tipo: "questoes" },
  { bloco: "10h15", horario: "10h15", titulo: "Física", tipo: "questoes" },
  { bloco: "14h", horario: "14h", titulo: "Biologia", tipo: "questoes" },
  { bloco: "16h", horario: "16h", titulo: "História", tipo: "questoes" },
  { bloco: "19h", horario: "19h", titulo: "Obra literária", tipo: "obra" },
  { bloco: "20h", horario: "20h", titulo: "Redação", tipo: "redacao" },
];

const GRADE_TER_QUI_SAB: BlocoGrade[] = [
  { bloco: "8h", horario: "8h", titulo: "Matemática", tipo: "questoes" },
  { bloco: "10h15", horario: "10h15", titulo: "Química", tipo: "questoes" },
  { bloco: "14h", horario: "14h", titulo: "Exercícios extras", tipo: "questoes" },
  { bloco: "16h", horario: "16h", titulo: "Geografia", tipo: "questoes" },
  { bloco: "19h", horario: "19h", titulo: "Obra literária", tipo: "obra" },
  { bloco: "20h", horario: "20h", titulo: "Interpretação / Inglês", tipo: "questoes" },
];

const GRADE_DOMINGO: BlocoGrade[] = [
  { bloco: "9h", horario: "9h–14h", titulo: "Simulado", tipo: "simulado" },
];

export type GrupoDia = "domingo" | "segQuaSex" | "terQuiSab";

// getDay(): 0=dom, 1=seg ... 6=sáb
export function grupoDoDia(diaSemana: number): GrupoDia {
  if (diaSemana === 0) return "domingo";
  return diaSemana % 2 === 1 ? "segQuaSex" : "terQuiSab";
}

export function gradeDoDia(diaSemana: number): BlocoGrade[] {
  const grupo = grupoDoDia(diaSemana);
  if (grupo === "domingo") return GRADE_DOMINGO;
  return grupo === "segQuaSex" ? GRADE_SEG_QUA_SEX : GRADE_TER_QUI_SAB;
}

// Sugestões de tema no formulário de erro (datalist), tiradas do próprio
// cronograma S1–S14 — só conveniência de digitação, o campo é livre.
export const SUGESTOES_TEMA: Record<string, string[]> = {
  Matemática: [
    "Funções afim e quadrática",
    "Exponencial e logaritmo",
    "Geometria plana",
    "Trigonometria",
    "Geometria espacial",
    "Combinatória e probabilidade",
    "Geometria analítica",
    "PA, PG, matrizes",
    "Complexos e polinômios",
  ],
  Física: [
    "Cinemática",
    "Dinâmica",
    "Trabalho e energia",
    "Impulso e quantidade de movimento",
    "Gravitação e estática",
    "Hidrostática e termologia",
    "Termodinâmica",
    "Eletrostática",
    "Eletrodinâmica",
    "Óptica geométrica",
    "Ondas e som",
  ],
  Química: [
    "Atomística e ligações",
    "Estequiometria",
    "Soluções e concentração",
    "Termoquímica",
    "Cinética e equilíbrio",
    "Eletroquímica",
    "Orgânica — funções e isomeria",
    "Orgânica — reações",
    "Gases",
  ],
  Biologia: [
    "Citologia",
    "Metabolismo",
    "Genética",
    "Evolução",
    "Ecologia",
    "Fisiologia humana",
    "Biotecnologia",
    "Microbiologia e saúde",
  ],
  História: [
    "Brasil colônia",
    "Escravidão e resistência",
    "Brasil império",
    "República Velha",
    "Era Vargas",
    "Ditadura civil-militar",
    "Revoluções burguesas",
    "Guerras mundiais",
    "América Latina",
  ],
  Geografia: [
    "Cartografia",
    "Urbanização",
    "Globalização",
    "Geografia agrária",
    "Indústria e energia",
    "Geopolítica",
    "População e migrações",
    "Questão ambiental",
    "Hidrografia e relevo",
  ],
};

export const TOTAL_OBRAS = 14;
