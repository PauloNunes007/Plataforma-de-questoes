// Conferidor independente dos gabaritos numéricos do lote 3 de Química Geral.
// Recalcula cada resposta a partir dos dados do enunciado, SEM olhar para a
// alternativa, e depois confere que a letra marcada como gabarito contém
// exatamente aquele valor. É a única rede que pega gabarito errado: um erro de
// conta passa limpo por validar.mjs e por render-katex.mjs.
//
// Rode: node listas_questoes/gerado/scripts/conferir-gabaritos-quimica-lote3.mjs
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const itens = JSON.parse(
  readFileSync(resolve(aqui, "..", "quimica_geral_lote3.json"), "utf8")
);

const porSubtopico = new Map(itens.map((q) => [q.subtopico, q]));
const divergencias = [];
let conferidas = 0;

// Extrai o valor numérico de uma alternativa em LaTeX:
//   "$2{,}1\times 10^{24}$"  ->  2.1e24
//   "$-110{,}5$ kJ"          ->  -110.5
//   "$80{,}0\%$"             ->  80
function numeroDe(latex) {
  let t = String(latex)
    .replace(/\$/g, "")
    .replace(/\{,\}/g, ".")
    .replace(/\\,/g, "")
    .replace(/\s+/g, "");
  const cient = t.match(/(-?\d+(?:\.\d+)?)\\times10\^\{?(-?\d+)\}?/);
  if (cient) return Number(cient[1]) * Math.pow(10, Number(cient[2]));
  const simples = t.match(/-?\d+(?:\.\d+)?/);
  return simples ? Number(simples[0]) : NaN;
}

// Confere uma questão numérica: `esperado` é recalculado aqui dentro.
function ok(subtopico, esperado, tolRel = 5e-3) {
  const q = porSubtopico.get(subtopico);
  if (!q) {
    divergencias.push(`SUBTÓPICO INEXISTENTE: ${subtopico}`);
    return;
  }
  conferidas++;
  const bruto = q.alternativas[q.gabarito];
  const obtido = numeroDe(bruto);
  const erro = Math.abs(obtido - esperado) / (Math.abs(esperado) || 1);
  if (!(erro <= tolRel)) {
    divergencias.push(
      `${subtopico}\n    gabarito ${q.gabarito} = ${bruto}  (lido ${obtido})\n    recalculado = ${esperado}`
    );
  }
}

// Confere uma questão cuja resposta é texto: compara o LaTeX exato.
function okTexto(subtopico, esperado) {
  const q = porSubtopico.get(subtopico);
  if (!q) {
    divergencias.push(`SUBTÓPICO INEXISTENTE: ${subtopico}`);
    return;
  }
  conferidas++;
  const bruto = q.alternativas[q.gabarito];
  // \text{C}\text{H} e \text{CH} renderizam igual: normaliza antes de comparar.
  const norm = (t) => String(t).replace(/\}\\text\{/g, "");
  if (norm(bruto) !== norm(esperado)) {
    divergencias.push(`${subtopico}\n    gabarito ${q.gabarito} = ${bruto}\n    esperado = ${esperado}`);
  }
}

const NA = 6.022e23;
const R_J = 8.314; // J/(mol·K)
const R_ATM = 0.0821; // atm·L/(mol·K)
const F = 96500; // C/mol
const h = 6.626e-34;
const log10 = (x) => Math.log(x) / Math.LN10;

// ===========================================================================
// TÓPICO 1 — Estrutura Atômica e Tabela Periódica
// ===========================================================================

// Abundância de 11-B: 11,009x + 10,013(1-x) = 10,81
ok("Massa atômica média e abundância isotópica", (100 * (10.81 - 10.013)) / (11.009 - 10.013), 2e-3);

// Cl2: picos 70/72/74 na razão p35², 2p35p37, p37²; normalizada pelo menor.
{
  const p35 = 0.75, p37 = 0.25;
  const i70 = p35 * p35, i72 = 2 * p35 * p37, i74 = p37 * p37;
  const razao = [i70 / i74, i72 / i74, i74 / i74].map((x) => Math.round(x));
  okTexto("Espectrometria de massas e padrão isotópico", `$${razao.join(":")}$`);
}

// Proporções múltiplas: g de O por g de N em cada óxido.
{
  const a = (100 - 63.6) / 63.6;
  const b = (100 - 46.7) / 46.7;
  ok("Lei das proporções múltiplas", Math.round((b / a) * 100) / 100, 1e-2);
}

// Efeito fotoelétrico: Ec = hν - Φ
ok("Efeito fotoelétrico: energia cinética do elétron", 1240 / 400 - 2.28, 1e-2);
ok("Efeito fotoelétrico: comprimento de onda limiar", 1240 / 4.5, 5e-3);

// Fótons por segundo de um laser de 5,0 mW a 633 nm
ok("Contagem de fótons de uma fonte luminosa", 5.0e-3 / (1.986e-25 / 633e-9), 1e-2);

// Limite da série de Balmer: transição n->infinito terminando em n=2
ok("Limite da série de Balmer", 1240 / (13.6 / 4), 5e-3);

// Ionização do He+ (Z=2, n=1)
ok("Íons hidrogenoides e dependência em Z", 13.6 * 4);

// de Broglie do nêutron
ok("Comprimento de onda de de Broglie do nêutron", h / (1.675e-27 * 2.2e3), 1e-2);

// Heisenberg
ok("Princípio da incerteza de Heisenberg", h / (4 * Math.PI * 9.11e-31 * 1.0e-10), 1e-2);

// Nós radiais do 5p: n - l - 1
ok("Nós radiais e angulares de um orbital", 5 - 1 - 1);

// Zef do 3s do sódio por Slater
ok("Carga nuclear efetiva pelas regras de Slater", 11 - (8 * 0.85 + 2 * 1.0));

// Nêutrons em 0,50 mol de 13-C
ok("Contagem de partículas subatômicas em amostra macroscópica", 0.5 * 6.02e23 * (13 - 6), 1e-2);

// Energia molar de fótons de 254 nm
ok("Energia de radiação por mol de fótons", (1240 / 254) * 96.5, 5e-3);

// Transição mais energética do H: varre as cinco opções do enunciado
{
  const dE = (ni, nf) => 13.6 * (1 / (nf * nf) - 1 / (ni * ni));
  const cands = [
    [3, 1, String.raw`$n=3\rightarrow n=1$`],
    [2, 1, String.raw`$n=2\rightarrow n=1$`],
    [4, 2, String.raw`$n=4\rightarrow n=2$`],
    [3, 2, String.raw`$n=3\rightarrow n=2$`],
    [5, 4, String.raw`$n=5\rightarrow n=4$`],
  ];
  cands.sort((a, b) => dE(b[0], b[1]) - dE(a[0], a[1]));
  okTexto("Comparação de energia entre transições eletrônicas", cands[0][2]);
}

// He+ 2->1
ok("Espectro de emissão de íon hidrogenoide", 1240 / (13.6 * 4 * (1 - 1 / 4)), 5e-3);

// ===========================================================================
// TÓPICO 2 — Ligações Químicas
// ===========================================================================

// Elétrons de valência do ClO3-: 7 + 3*6 + 1(carga)
ok("Contagem de elétrons de valência em íon poliatômico", 7 + 3 * 6 + 1);

// Carga formal do S no SO4(2-) só com ligações simples: 6 - 0 - 8/2
ok("Carga formal e escolha da estrutura de Lewis", 6 - 0 - 8 / 2);

// Ordem média de ligação do NO3-: (2+1+1)/3
ok("Ressonância e ordem de ligação fracionária", (2 + 1 + 1) / 3, 5e-3);

// Born-Haber do KCl: AE = dHf - (sub + IE + D/2 + U)
ok("Ciclo de Born-Haber: afinidade eletrônica", -437 - (89 + 419 + 243 / 2 - 717), 2e-3);

// H2 + Cl2 -> 2 HCl por energias de ligação
ok("Entalpia de reação por energias de ligação", 436 + 242 - 2 * 431);

// Caráter iônico do HCl
ok("Momento dipolar e caráter iônico percentual", (1.08 / 6.1) * 100, 5e-3);

// Propino CH3-C≡CH: sigma = 3(C-H) + (C-C) + 1 da tripla + (C-H) ; pi = 2
{
  const sigma = 3 + 1 + 1 + 1, pi = 2;
  okTexto("Contagem de ligações sigma e pi", `$${sigma}\\ \\sigma$ e $${pi}\\ \\pi$`);
}

// Ordem de ligação do He2+: (ligantes - antiligantes)/2
ok("TOM: existência de espécies com ordem fracionária", (2 - 1) / 2);

// Energia de ressonância do benzeno
ok("Energia de ressonância do benzeno", 3 * 120 - 208);

// Átomos por cela CFC
ok("Cela unitária cúbica de faces centradas", 8 / 8 + 6 / 2);

// Densidade do ferro CCC
ok("Densidade a partir da cela unitária", (2 * 55.85) / 6.022e23 / Math.pow(2.87e-8, 3), 5e-3);

// Ressonâncias equivalentes do SO3 (a dupla em cada um dos 3 oxigênios)
ok("Número de estruturas de ressonância equivalentes", 3);

// ===========================================================================
// TÓPICO 3 — Termodinâmica, Cinética e Equilíbrio
// ===========================================================================

// Calorimetria: c do metal
ok("Calorimetria e calor específico", (100.0 * 4.18 * (25.0 - 20.0)) / (100.0 * (80.0 - 25.0)), 1e-2);

// Bomba calorimétrica: dE por mol
ok("Calorímetro de bomba a volume constante", -(5.0 * 4.67) / (1.5 / 180), 5e-3);

// Hess
ok("Lei de Hess", -393.5 + 283.0);

// dHf do etanol a partir da combustão
ok("Entalpia de formação a partir da combustão", 2 * -393.5 + 3 * -285.8 + 1367);

// dE = dH - dn R T
ok("Relação entre entalpia e energia interna", -92.2 - -2 * 8.314e-3 * 298, 1e-2);

// w = -P dV
ok("Trabalho de expansão contra pressão constante", -1.5 * (6.0 - 2.0) * 101.3, 1e-2);

// dS da síntese da amônia
ok("Cálculo de entropia padrão de reação", 2 * 192.5 - (191.5 + 3 * 130.6), 1e-3);

// T de inversão
ok("Temperatura de inversão da espontaneidade", 178000 / 160, 1e-3);

// K a partir de dG°
ok("Relação entre energia livre padrão e constante de equilíbrio", Math.exp(34200 / (R_J * 298)), 5e-2);

// k pela tabela de velocidades iniciais (ordem 2 em A, 1 em B)
{
  const ordemA = Math.round(Math.log(8.0e-3 / 2.0e-3) / Math.log(0.2 / 0.1));
  const ordemB = Math.round(Math.log(4.0e-3 / 2.0e-3) / Math.log(0.2 / 0.1));
  ok(
    "Determinação da lei de velocidade por velocidades iniciais",
    2.0e-3 / (Math.pow(0.1, ordemA) * Math.pow(0.1, ordemB))
  );
}

// Segunda ordem: t = (1/[A] - 1/[A]0)/k
ok("Cinética de segunda ordem", (1 / 0.1 - 1 / 0.5) / 0.2);

// Quatro meias-vidas
ok("Meias-vidas sucessivas em primeira ordem", Math.pow(0.5, 120 / 30) * 100, 2e-3);

// Ea de Arrhenius (k dobra de 300 K para 310 K), em kJ/mol
ok("Energia de ativação pela equação de Arrhenius", (R_J * Math.log(2)) / (1 / 300 - 1 / 310) / 1000, 5e-3);

// Aceleração por catalisador
ok("Efeito do catalisador sobre a velocidade", Math.exp(25000 / (R_J * 298)), 2e-2);

// Kp = Kc (RT)^dn
ok("Conversão entre Kc e Kp", 280.0 * Math.pow(R_ATM * 1000, -1), 1e-2);

// ICE do H2 + I2
{
  const hi = 1.56, resto = 1.0 - hi / 2;
  ok("Cálculo de constante de equilíbrio por tabela ICE", (hi * hi) / (resto * resto), 5e-3);
}

// pH do Ba(OH)2 5,0e-3 mol/L
ok("pH de solução de base forte diprótica", 14 + log10(2 * 5.0e-3), 2e-3);

// pH do ácido acético 0,20 mol/L
ok("pH de ácido fraco a partir do Ka", -log10(Math.sqrt(1.8e-5 * 0.2)), 5e-3);

// Henderson-Hasselbalch
ok("pH de solução-tampão pela equação de Henderson-Hasselbalch", 4.74 + log10(0.3 / 0.2), 2e-3);

// Tampão após NaOH
ok("Resposta de um tampão à adição de base forte", 4.74 + log10((0.4 + 0.1) / (0.4 - 0.1)), 2e-3);

// Ponto de equivalência de ácido fraco com base forte
{
  const cSal = 0.1 / 2;
  const kb = 1.0e-14 / 1.8e-5;
  const oh = Math.sqrt(kb * cSal);
  ok("pH no ponto de equivalência de titulação de ácido fraco", 14 + log10(oh), 2e-3);
}

// Solubilidade do CaF2: Kps = 4s³
ok("Solubilidade molar a partir do produto de solubilidade", Math.cbrt(3.9e-11 / 4), 2e-2);

// Íon comum: s = Kps/[Cl-]
ok("Efeito do íon comum sobre a solubilidade", 1.8e-10 / 0.1, 1e-3);

// Q do CaF2 após mistura de volumes iguais
ok("Previsão de precipitação pelo quociente iônico", 1.0e-3 * Math.pow(1.0e-3, 2), 1e-3);

// Nernst
ok("Equação de Nernst", 1.1 - (0.0592 / 2) * log10(1.0 / 0.01), 5e-3);

// dG° = -nFE°, em kJ
ok("Energia livre a partir do potencial de célula", (-2 * F * 1.1) / 1000, 5e-3);

// Eletrólise: V de H2 nas CNTP
ok("Eletrólise e volume de gás produzido", ((1.93 * 1000) / F / 2) * 22.4, 5e-3);

// ===========================================================================
// TÓPICO 4 — Funções Inorgânicas e Reações Químicas
// ===========================================================================

// Neutralização do H3PO4 (triprótico)
ok("Neutralização de ácido poliprótico", ((3 * 0.025 * 0.2) / 0.5) * 1000, 1e-3);

// Titulação do H2SO4 (diprótico)
ok("Titulação e determinação de concentração", (0.025 * 0.2) / 2 / 0.02, 1e-3);

// Redox em meio ácido: MnO4- + 5 Fe2+ + 8 H+ -> Mn2+ + 5 Fe3+ + 4 H2O
{
  const eMn = 7 - 2, eFe = 3 - 2;
  const nFe = eMn / eFe; // 5
  const nH2O = 4; // os 4 O do permanganato
  const nH = 2 * nH2O;
  // conferência de carga: -1 + 2*nFe + nH  ===  +2 + 3*nFe
  const cargaEsq = -1 + 2 * nFe + nH;
  const cargaDir = 2 + 3 * nFe;
  if (cargaEsq !== cargaDir) divergencias.push("redox ácido: cargas não fecham");
  ok("Balanceamento de equação redox em meio ácido", nH);
}

// Redox em meio básico: 2 MnO4- + I- + H2O -> 2 MnO2 + IO3- + 2 OH-
{
  const eMn = 7 - 4, eI = 5 - -1;
  const nMn = eI / eMn; // 2
  // carga: (-nMn - 1) = (-1 - nOH)  ->  nOH = nMn
  const nOH = nMn;
  const oEsq = 4 * nMn + 1; // MnO4- + H2O
  const oDir = 2 * nMn + 3 + nOH;
  if (oEsq !== oDir) divergencias.push("redox básico: oxigênios não fecham");
  ok("Balanceamento de equação redox em meio básico", nOH);
}

// Nox médio do S no S2O3(2-)
ok("Número de oxidação em íon poliatômico", (-2 - 3 * -2) / 2);

// Reagente limitante N2/H2
{
  const nN2 = 28 / 28, nH2 = 3.0 / 2.0;
  const nNH3 = Math.min(2 * nN2, (2 / 3) * nH2);
  ok("Reagente limitante", nNH3 * 17);
}

// Rendimento percentual
ok("Rendimento percentual", (13.6 / (2 * 0.5 * 17)) * 100, 2e-3);

// Pureza do calcário
ok("Grau de pureza de amostra", (((8.8 / 44) * 100) / 25.0) * 100, 2e-3);

// Fórmula mínima por composição percentual
{
  const c = 40.0 / 12, hh = 6.7 / 1, o = 53.3 / 16;
  const m = Math.min(c, hh, o);
  const idx = [c / m, hh / m, o / m].map((x) => Math.round(x));
  okTexto(
    "Fórmula mínima a partir da composição percentual",
    `$\\text{C}${idx[0] > 1 ? `_${idx[0]}` : ""}\\text{H}_${idx[1]}\\text{O}${idx[2] > 1 ? `_${idx[2]}` : ""}$`
  );
}

// Fórmula molecular a partir da mínima
{
  const fator = 180 / (12 + 2 * 1 + 16);
  okTexto(
    "Fórmula molecular a partir da fórmula mínima",
    `$\\text{C}_${1 * fator}\\text{H}_{${2 * fator}}\\text{O}_${1 * fator}$`
  );
}

// Análise elementar por combustão
{
  const nC = 0.561 / 44;
  const nH = (0.306 / 18) * 2;
  const mO = 0.255 - nC * 12 - nH * 1;
  const nO = mO / 16;
  const m = Math.min(nC, nH, nO);
  const idx = [nC / m, nH / m, nO / m].map((x) => Math.round(x));
  okTexto("Análise elementar por combustão", `$\\text{C}_${idx[0]}\\text{H}_${idx[1]}\\text{O}$`);
  if (idx[2] !== 1) divergencias.push("combustão: índice do oxigênio não deu 1");
}

// Diluição
ok("Preparo de solução por diluição", (0.1 * 500) / 2.0, 1e-3);

// Cloreto na mistura
ok("Concentração de íons em mistura de soluções", (0.1 * 0.1 + 0.1 * 0.1 * 2) / 0.2, 1e-3);

// CO2 da calcinação a 300 K
ok("Estequiometria com volume de gás", ((10.0 / 100) * R_ATM * 300) / 1.0, 5e-3);

// Pressão parcial do hélio
ok("Pressões parciais e lei de Dalton", (0.2 * R_ATM * 300) / 10.0, 1e-2);

// Graham
ok("Lei de efusão de Graham", Math.sqrt(16.0 / 4.0));

// Massa molar por densidade
ok("Massa molar a partir da densidade de um gás", 1.96 * 22.4, 5e-3);

// H2 do zinco com HCl
ok("Volume de gás em reação de metal com ácido", (1.3 / 65.0) * 22.4, 5e-3);

// Resíduo da decomposição do bicarbonato
ok("Decomposição térmica e massa residual", (8.4 / 84 / 2) * 106, 5e-3);

// Amônia industrial com rendimento
ok("Estequiometria industrial com rendimento", (28 / 28) * 2 * 17 * 0.6, 2e-3);

// Gravimetria do cloreto
ok("Análise gravimétrica de cloreto", ((1.435 / 143.5) * 35.5 * 100) / 1.0, 2e-3);

// Título -> mol/L
ok("Conversão entre título e concentração em quantidade de matéria", (1000 * 1.84 * 0.98) / 98, 5e-3);

// ===========================================================================
console.log(`${itens.length} questões no arquivo; ${conferidas} conferidas numericamente`);
if (divergencias.length === 0) {
  console.log("OK — todo gabarito recalculado bate com a alternativa marcada.");
} else {
  console.log(`\n${divergencias.length} divergência(s):\n`);
  divergencias.forEach((d) => console.log("  " + d + "\n"));
  process.exit(1);
}
