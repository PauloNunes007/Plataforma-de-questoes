// Identidade de curso — transforma o `profiles.curso` (texto livre digitado no
// onboarding) num perfil temático que o app usa pra "reagir" ao curso exato do
// aluno: cor de acento, ícone, tagline de identidade e as disciplinas-núcleo
// típicas daquele curso das exatas. `resolverCurso` normaliza o texto (acento/
// caixa) e casa contra os apelidos; qualquer coisa não reconhecida cai no perfil
// genérico "exatas" — nunca quebra. Módulo de dados puro (sem React/Lucide) pra
// poder ser importado tanto no server (dashboard-data, actions) quanto no client
// (onboarding). O mapa string→ícone Lucide mora em `icones.ts`.

export type CursoIdentidade = {
  id: string;
  nome: string;
  /** Fragmentos já normalizados (minúsculo, sem acento) testados como substring. */
  apelidos: string[];
  corA: string;
  corB: string;
  /** Chave em ICONE_CURSO (icones.ts). */
  icone: string;
  tagline: string;
  /** Disciplinas típicas do curso — as fundacionais (que têm banco de questões)
   *  vêm primeiro, seguidas das assinatura do curso. Usadas como sugestão/pré-
   *  seleção no onboarding. */
  disciplinasNucleo: string[];
};

// Base fundacional das exatas (nomes iguais aos da taxonomia já semeada, então
// mapeiam pra `materias` existentes com banco de questões).
const BASE = [
  "Cálculo I",
  "Cálculo II",
  "Cálculo III",
  "Álgebra Linear",
  "Física I",
  "Física II",
  "Programação I",
];

// Ordem importa: os perfis mais específicos vêm antes do catch-all "engenharia"
// e do fallback. Ex.: "Eng. Elétrica com ênfase em Telecom" casa Telecom (1º)
// antes de Elétrica.
export const CURSOS: CursoIdentidade[] = [
  {
    id: "telecom",
    nome: "Engenharia de Telecomunicações",
    apelidos: ["telecomunicac", "telecom"],
    corA: "#6a5cf0",
    corB: "#4032c4",
    icone: "radio",
    tagline: "Você fala a língua dos sinais.",
    disciplinasNucleo: [...BASE, "Circuitos Elétricos", "Sinais e Sistemas", "Eletromagnetismo"],
  },
  {
    id: "eletronica",
    nome: "Engenharia Eletrônica",
    apelidos: ["eletronic"],
    corA: "#3fa9f0",
    corB: "#1f6fc4",
    icone: "cpu",
    tagline: "Do elétron ao sistema — você domina os dois.",
    disciplinasNucleo: [...BASE, "Circuitos Elétricos", "Eletrônica Analógica", "Microcontroladores"],
  },
  {
    id: "computacao",
    nome: "Computação & Software",
    apelidos: ["computac", "sistemas de informac", "engenharia de software", "desenvolvimento de sistemas"],
    corA: "#3fbf78",
    corB: "#279357",
    icone: "code",
    tagline: "Você transforma lógica em máquina.",
    disciplinasNucleo: [
      "Cálculo I",
      "Cálculo II",
      "Álgebra Linear",
      "Física I",
      "Programação I",
      "Estruturas de Dados",
      "Matemática Discreta",
      "Cálculo Numérico",
    ],
  },
  {
    id: "mecatronica",
    nome: "Engenharia Mecatrônica",
    apelidos: ["mecatron", "controle e automac", "automac"],
    corA: "#2fb6c9",
    corB: "#1a8c9c",
    icone: "bot",
    tagline: "Mecânica, eletrônica e código no mesmo projeto.",
    disciplinasNucleo: [...BASE, "Circuitos Elétricos", "Sistemas de Controle", "Mecânica dos Sólidos"],
  },
  {
    id: "mecanica",
    nome: "Engenharia Mecânica",
    apelidos: ["mecanic"],
    corA: "#8a94a6",
    corB: "#5b6474",
    icone: "cog",
    tagline: "Você faz o mundo girar — literalmente.",
    disciplinasNucleo: [...BASE, "Mecânica dos Sólidos", "Termodinâmica", "Resistência dos Materiais"],
  },
  {
    id: "civil",
    nome: "Engenharia Civil",
    apelidos: ["civil"],
    corA: "#c78a3a",
    corB: "#96591f",
    icone: "building",
    tagline: "Você constrói o que fica de pé por décadas.",
    disciplinasNucleo: [...BASE, "Química Geral", "Resistência dos Materiais", "Mecânica dos Sólidos", "Topografia"],
  },
  {
    id: "producao",
    nome: "Engenharia de Produção",
    apelidos: ["producao"],
    corA: "#f0a23f",
    corB: "#d67c1a",
    icone: "trending",
    tagline: "Você otimiza tudo que toca.",
    disciplinasNucleo: [...BASE, "Estatística", "Pesquisa Operacional", "Cálculo Numérico"],
  },
  {
    id: "quimica",
    nome: "Engenharia Química",
    apelidos: ["quimic"],
    corA: "#f0555a",
    corB: "#c93338",
    icone: "flask",
    tagline: "Você orquestra reações em escala industrial.",
    disciplinasNucleo: [
      "Cálculo I",
      "Cálculo II",
      "Cálculo III",
      "Álgebra Linear",
      "Física I",
      "Química Geral",
      "Química Orgânica",
      "Termodinâmica",
    ],
  },
  {
    id: "ambiental",
    nome: "Engenharia Ambiental",
    apelidos: ["ambiental"],
    corA: "#3fbf78",
    corB: "#1f8f52",
    icone: "leaf",
    tagline: "Você equaciona o equilíbrio do planeta.",
    disciplinasNucleo: [...BASE, "Química Geral", "Hidrologia", "Saneamento"],
  },
  {
    id: "materiais",
    nome: "Engenharia de Materiais",
    apelidos: ["materiais"],
    corA: "#9b6ff0",
    corB: "#7443d6",
    icone: "layers",
    tagline: "Você projeta a matéria do futuro.",
    disciplinasNucleo: [...BASE, "Química Geral", "Ciência dos Materiais", "Físico-Química"],
  },
  {
    id: "aeroespacial",
    nome: "Engenharia Aeroespacial",
    apelidos: ["aeronaut", "aeroespac", "aerospacial"],
    corA: "#3fa9f0",
    corB: "#1f6fc4",
    icone: "plane",
    tagline: "Seu campo de prova é o céu.",
    disciplinasNucleo: [...BASE, "Mecânica dos Fluidos", "Aerodinâmica", "Mecânica dos Sólidos"],
  },
  {
    id: "petroleo",
    nome: "Engenharia de Petróleo",
    apelidos: ["petroleo"],
    corA: "#4a4f5c",
    corB: "#2c2f38",
    icone: "droplet",
    tagline: "Você extrai energia das profundezas.",
    disciplinasNucleo: [...BASE, "Mecânica dos Fluidos", "Termodinâmica", "Geologia"],
  },
  {
    id: "naval",
    nome: "Engenharia Naval",
    apelidos: ["naval", "oceanic"],
    corA: "#2f7dc9",
    corB: "#1a5896",
    icone: "ship",
    tagline: "Seus projetos flutuam e cruzam oceanos.",
    disciplinasNucleo: [...BASE, "Mecânica dos Fluidos", "Hidrostática", "Resistência dos Materiais"],
  },
  {
    id: "eletrica",
    nome: "Engenharia Elétrica",
    apelidos: ["eletric"],
    corA: "#f0c23f",
    corB: "#d69a1a",
    icone: "zap",
    tagline: "Você domestica a corrente.",
    disciplinasNucleo: [...BASE, "Circuitos Elétricos", "Eletromagnetismo", "Sistemas de Controle"],
  },
  {
    id: "fisica",
    nome: "Física",
    apelidos: ["fisica"],
    corA: "#5b7cf0",
    corB: "#3a52c4",
    icone: "atom",
    tagline: "Você lê as leis que regem tudo.",
    disciplinasNucleo: [
      "Cálculo I",
      "Cálculo II",
      "Cálculo III",
      "Álgebra Linear",
      "Física I",
      "Física II",
      "Mecânica Clássica",
      "Eletromagnetismo",
    ],
  },
  {
    id: "matematica",
    nome: "Matemática",
    apelidos: ["matematic"],
    corA: "#6a5cf0",
    corB: "#4032c4",
    icone: "sigma",
    tagline: "Você vive na linguagem pura da lógica.",
    disciplinasNucleo: [
      "Cálculo I",
      "Cálculo II",
      "Cálculo III",
      "Álgebra Linear",
      "Análise Real",
      "Álgebra Abstrata",
      "Geometria Analítica",
    ],
  },
  {
    id: "estatistica",
    nome: "Estatística & Ciência de Dados",
    apelidos: ["estatistic", "ciencia de dados", "data science"],
    corA: "#2fb6c9",
    corB: "#1a8c9c",
    icone: "chart",
    tagline: "Você encontra o sinal no ruído.",
    disciplinasNucleo: [
      "Cálculo I",
      "Cálculo II",
      "Álgebra Linear",
      "Programação I",
      "Probabilidade",
      "Inferência Estatística",
      "Cálculo Numérico",
    ],
  },
  {
    id: "engenharia",
    nome: "Engenharia",
    apelidos: ["engenhar"],
    corA: "#5b7cf0",
    corB: "#3a52c4",
    icone: "compass",
    tagline: "Toda engenharia começa nas exatas.",
    disciplinasNucleo: [...BASE, "Química Geral", "Fundamentos de Cálculo e Geometria"],
  },
];

// Perfil de fallback — texto não reconhecido ou vazio.
export const CURSO_GENERICO: CursoIdentidade = {
  id: "exatas",
  nome: "Ciências Exatas",
  apelidos: [],
  corA: "#5b7cf0",
  corB: "#3a52c4",
  icone: "compass",
  tagline: "As exatas são o seu terreno.",
  disciplinasNucleo: [
    "Fundamentos de Cálculo e Geometria",
    "Cálculo I",
    "Cálculo II",
    "Cálculo III",
    "Álgebra Linear",
    "Física I",
    "Física II",
    "Química Geral",
    "Programação I",
  ],
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Resolve o texto livre do curso pra uma identidade. Nunca retorna null —
 *  cai em CURSO_GENERICO quando nada casa. */
export function resolverCurso(texto: string | null | undefined): CursoIdentidade {
  if (!texto) return CURSO_GENERICO;
  const alvo = normalizar(texto);
  if (!alvo) return CURSO_GENERICO;
  const achado = CURSOS.find((c) => c.apelidos.some((ap) => alvo.includes(ap)));
  return achado ?? CURSO_GENERICO;
}

/** True quando o curso foi de fato reconhecido (não é o fallback genérico) —
 *  usado pra decidir se aplica o acento temático ou mantém o verde padrão. */
export function cursoReconhecido(identidade: CursoIdentidade): boolean {
  return identidade.id !== CURSO_GENERICO.id;
}
