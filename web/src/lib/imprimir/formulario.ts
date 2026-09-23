// O FORMULÁRIO que a prova imprime na primeira folha.
//
// Não é enfeite: a prova da UFF entrega constantes, integrais e leis na capa, e
// quem treina sem elas está treinando uma prova mais difícil do que a que vai
// fazer (decorar integral que a banca dá de graça). Pra a simulação valer, o
// formulário tem que estar lá — e tem que ser O MESMO.
//
// **Transcrito de prova real, nunca inventado.** O conteúdo abaixo saiu das
// provas em `provas_uff/`: constantes e fórmulas matemáticas conferidas na P1
// de 2023.1 e na P3 de 2024.1 (idênticas nas duas, com μ₀ entrando a partir
// das provas de magnetismo), e as leis físicas conferidas na P1.
//
// Slot sem transcrição conferida entra com `fisicas: []` e a folha **omite a
// seção** em vez de preenchê-la com o formulário padrão de um livro: o que
// esta folha promete é ser igual à prova, e um formulário plausível mas
// diferente quebraria exatamente essa promessa. Completar é transcrever a
// prova correspondente, não escrever de memória.

export type Formulario = {
  /** Constantes numéricas (LaTeX inline, sem os cifrões). */
  constantes: string[];
  /** Integrais e aproximações que a banca fornece. */
  matematicas: string[];
  /** Leis e definições do conteúdo daquela prova. Vazio = seção omitida. */
  fisicas: string[];
};

const FIS2_CONSTANTES = [
  "g = 9{,}8\\,\\mathrm{m/s^2}",
  "m_{\\text{elétron}} = 9{,}11 \\times 10^{-31}\\,\\mathrm{kg}",
  "m_{\\text{próton}} = 1{,}67 \\times 10^{-27}\\,\\mathrm{kg}",
  "e = 1{,}60 \\times 10^{-19}\\,\\mathrm{C}",
  "\\epsilon_0 = 8{,}85 \\times 10^{-12}\\,\\mathrm{C^2/N\\,m^2}",
  "k = 1/4\\pi\\epsilon_0 = 8{,}99 \\times 10^{9}\\,\\mathrm{N \\cdot m^2/C^2}",
];

const FIS2_MATEMATICAS = [
  "\\int (u^2+a^2)^{-1/2}\\,u\\,du = \\sqrt{u^2+a^2}",
  "\\int (u^2+a^2)^{-3/2}\\,u\\,du = -1/\\sqrt{u^2+a^2}",
  "\\int (u^2+a^2)^{-1/2}\\,du = \\ln[u+\\sqrt{u^2+a^2}]",
  "\\int (u^2+a^2)^{-3/2}\\,du = u/[a^2\\sqrt{u^2+a^2}]",
  "\\text{Aprox. binomial: } (1+x)^n \\approx 1+nx \\;\\; \\text{se } x \\ll 1",
];

/** Entra a partir das provas que cobram magnetismo (conferido na P3 de 2024.1). */
const FIS2_CONSTANTE_MAGNETICA = "\\mu_0 = 4\\pi \\times 10^{-7}\\,\\mathrm{T\\,m/A}";

const FIS2_P1_FISICAS = [
  "\\vec{F}_E = q\\vec{E}",
  "\\vec{E} = K\\dfrac{q}{r^2}\\hat{r}; \\quad d\\vec{E} = K\\dfrac{dq}{r^2}\\hat{r}; \\quad V(r) = K\\dfrac{q}{r}",
  "\\Phi_E = \\oint_S \\vec{E} \\cdot d\\vec{A} = Q_{int}/\\epsilon_0",
  "\\Delta U = q\\Delta V; \\quad \\Delta V = -\\dfrac{W_{F\\text{elétrica}}}{q} = -\\int_i^f \\vec{E} \\cdot d\\vec{l}",
  "\\vec{E} = -\\nabla V = -\\left[\\dfrac{\\partial V}{\\partial x}\\hat{x} + \\dfrac{\\partial V}{\\partial y}\\hat{y} + \\dfrac{\\partial V}{\\partial z}\\hat{z}\\right]",
  "\\vec{p}_E = q\\vec{d}; \\quad U_E = -\\vec{p}_E \\cdot \\vec{E}; \\quad \\vec{\\tau}_E = \\vec{p}_E \\times \\vec{E}",
  "E^{\\parallel}_{dip} \\approx 2p_E/4\\pi\\epsilon_0 r^3; \\quad E^{\\perp}_{dip} \\approx -p_E/4\\pi\\epsilon_0 r^3",
];

/**
 * Chave: nome da matéria normalizado + slot. O nome vem de `materias.nome`, e
 * a normalização tira acento/caixa porque "Física II" e "Fisica 2" são a mesma
 * disciplina em bancos diferentes.
 */
function normalizar(v: string): string {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "física ii" e "fisica 2" caem na mesma família. */
function familiaDaMateria(nome: string): string | null {
  const n = normalizar(nome);
  if (/^fisica (2|ii)\b/.test(n) || n === "fisica 2" || n === "fisica ii") return "fisica2";
  return null;
}

const POR_FAMILIA: Record<string, Record<string, Formulario>> = {
  fisica2: {
    P1: {
      constantes: FIS2_CONSTANTES,
      matematicas: FIS2_MATEMATICAS,
      fisicas: FIS2_P1_FISICAS,
    },
    P2: {
      constantes: FIS2_CONSTANTES,
      matematicas: FIS2_MATEMATICAS,
      // Não transcrita ainda — ver o comentário no topo do arquivo.
      fisicas: [],
    },
    P3: {
      constantes: [...FIS2_CONSTANTES, FIS2_CONSTANTE_MAGNETICA],
      matematicas: FIS2_MATEMATICAS,
      fisicas: [],
    },
  },
};

/**
 * O formulário daquela prova, ou `null` quando não há transcrição — e aí a
 * folha simplesmente não imprime a seção.
 */
export function formularioDaProva(materiaNome: string, slot: string): Formulario | null {
  const familia = familiaDaMateria(materiaNome);
  if (!familia) return null;
  const porSlot = POR_FAMILIA[familia];
  if (!porSlot) return null;
  return porSlot[String(slot || "").trim().toUpperCase()] ?? null;
}

/** Título da seção, como na prova: "Formulário - Física 2". */
export function tituloFormulario(materiaNome: string): string {
  return `Formulário - ${materiaNome}`;
}

/**
 * A linha que fica sob o título, no formato da prova original:
 * "1ª prova - 2º período de 2026  22/09/2026".
 *
 * O ordinal vem do slot ("P1" -> "1ª"); o período e a data são os da prova
 * quando ela existiu, e os de hoje quando é uma prova prevista — que é a data
 * em que o aluno está de fato aplicando a prova em si mesmo.
 */
export function linhaDaProva({
  slot,
  ano,
  semestre,
  data,
}: {
  slot: string;
  ano: number;
  semestre: number;
  data: Date;
}): string {
  const n = Number(String(slot || "").replace(/\D/g, "")) || 1;
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${n}ª prova - ${semestre}º período de ${ano}  ${dia}/${mes}/${data.getFullYear()}`;
}

/** Em qual semestre letivo cai uma data (1 até junho, 2 daí em diante). */
export function semestreDe(data: Date): number {
  return data.getMonth() < 6 ? 1 : 2;
}
