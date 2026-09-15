// Cálculo III — lote 3: integrais de superfície, teorema de Stokes e teorema
// da divergência (36 questões). Estilo Guidorizzi vol. 3 / Stewart.
//
// Conferência deliberadamente PELO OUTRO LADO do teorema: as questões de
// Stokes são recalculadas integrando a circulação sobre a curva parametrizada,
// e as de Gauss somando o fluxo face a face (ou sobre a superfície fechada
// parametrizada) — nunca repetindo a integral de volume da resolução. Se o
// teorema tiver sido aplicado errado, os dois lados discordam e nada é escrito.
import {
  q, finalizar, R,
  superficieEscalar, fluxo, linhaVetorial, dupla, rotacional, divergente, norma, bissecao,
} from "./calculo23_kit.mjs";

const C3 = "Cálculo III";
const TS = "Integrais de Superfície";
const TK = "Teorema de Stokes";
const TG = "Teorema de Gauss";

// --- parametrizações reutilizadas -----------------------------------------
const esfera = (a, cx = 0, cy = 0, cz = 0) => (f, t) => [
  cx + a * Math.sin(f) * Math.cos(t),
  cy + a * Math.sin(f) * Math.sin(t),
  cz + a * Math.cos(f),
];
// fluxo pelas 6 faces de uma caixa, com normais para fora
function fluxoCaixa(F, [x0, x1], [y0, y1], [z0, z1], n = 200) {
  const face = (g, a, b, c, d, comp, sinal) => sinal * dupla((u, v) => F(...g(u, v))[comp], a, b, c, d, n);
  return (
    face((y, z) => [x1, y, z], y0, y1, z0, z1, 0, 1) +
    face((y, z) => [x0, y, z], y0, y1, z0, z1, 0, -1) +
    face((x, z) => [x, y1, z], x0, x1, z0, z1, 1, 1) +
    face((x, z) => [x, y0, z], x0, x1, z0, z1, 1, -1) +
    face((x, y) => [x, y, z1], x0, x1, y0, y1, 2, 1) +
    face((x, y) => [x, y, z0], x0, x1, y0, y1, 2, -1)
  );
}
// circulação ao longo do contorno de um triângulo de vértices A, B, C
function circuitoTriangulo(F, A, B, C) {
  const lado = (P, Q) => linhaVetorial(F, (t) => P.map((p, i) => p + t * (Q[i] - p)), 0, 1);
  return lado(A, B) + lado(B, C) + lado(C, A);
}

// ===========================================================================
// Integrais de superfície
// ===========================================================================

q(
  C3, TS, "Área de paraboloide", "medio",
  R`A área da porção do paraboloide $z = x^2+y^2$ situada abaixo do plano $z = 1$ é:`,
  R`$\frac{\pi}{6}(5\sqrt{5}-1)$`,
  [R`$\frac{\pi}{6}(5\sqrt{5}+1)$`, R`$\frac{\pi}{3}(5\sqrt{5}-1)$`, R`$\frac{\pi}{6}(5\sqrt{5}-2)$`, R`$\frac{\pi}{12}(5\sqrt{5}-1)$`],
  R`Para $z = g(x,y)$ vale $dS = \sqrt{1 + g_x^2 + g_y^2}\,dA = \sqrt{1+4x^2+4y^2}\,dA$, e a projeção é o disco $x^2+y^2\le 1$. Em polares, $A = \int_0^{2\pi}\!\!\int_0^1\sqrt{1+4r^2}\,r\,dr\,d\theta = 2\pi\left[\frac{(1+4r^2)^{3/2}}{12}\right]_0^1 = \frac{\pi}{6}\left(5\sqrt5 - 1\right) \approx 5{,}33$.`,
  (Math.PI / 6) * (5 * Math.sqrt(5) - 1),
  () => superficieEscalar(() => 1, (r, t) => [r * Math.cos(t), r * Math.sin(t), r * r], 0, 1, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Área de porção plana dentro de cilindro", "facil",
  R`A área da porção do plano $z = 2x + 3y$ interior ao cilindro $x^2+y^2 = 4$ é:`,
  R`$4\sqrt{14}\pi$`,
  [R`$2\sqrt{14}\pi$`, R`$4\sqrt{13}\pi$`, R`$8\sqrt{14}\pi$`, R`$\sqrt{14}\pi$`],
  R`Com $z = 2x+3y$, $dS = \sqrt{1 + 2^2 + 3^2}\,dA = \sqrt{14}\,dA$ — fator constante, pois o plano tem inclinação fixa. A projeção é o disco de raio $2$, de área $4\pi$. Logo $A = 4\sqrt{14}\,\pi \approx 47{,}0$.`,
  4 * Math.sqrt(14) * Math.PI,
  () => superficieEscalar(() => 1, (r, t) => [r * Math.cos(t), r * Math.sin(t), 2 * r * Math.cos(t) + 3 * r * Math.sin(t)], 0, 2, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Integral de superfície sobre esfera", "dificil",
  R`O valor de $\displaystyle\iint_S \left(x^2+y^2\right)dS$, em que $S$ é a esfera $x^2+y^2+z^2 = 9$, é:`,
  R`$216\pi$`,
  [R`$108\pi$`, R`$72\pi$`, R`$324\pi$`, R`$144\pi$`],
  R`Em coordenadas esféricas com $\rho = 3$: $x^2+y^2 = 9\operatorname{sen}^2\varphi$ e $dS = 9\operatorname{sen}\varphi\,d\varphi\,d\theta$. Então $\iint_S (x^2+y^2)dS = \int_0^{2\pi}\!\!\int_0^{\pi}81\operatorname{sen}^3\varphi\,d\varphi\,d\theta = 81\cdot 2\pi\cdot\frac{4}{3} = 216\pi \approx 678{,}6$. (Caminho alternativo: por simetria $\iint_S x^2dS = \iint_S y^2dS = \iint_S z^2dS = \frac{1}{3}\iint_S \rho^2dS = \frac{9\cdot 36\pi}{3} = 108\pi$, e a resposta é o dobro disso.)`,
  216 * Math.PI,
  () => superficieEscalar((x, y) => x * x + y * y, esfera(3), 0, Math.PI, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Fluxo através de paraboloide", "dificil",
  R`O fluxo do campo $\mathbf{F}(x,y,z) = (x, y, z)$ através da superfície $z = 4 - x^2 - y^2$, $z \ge 0$, orientada para cima, é:`,
  R`$24\pi$`,
  [R`$12\pi$`, R`$48\pi$`, R`$16\pi$`, R`$32\pi$`],
  R`Para $z = g(x,y)$ com orientação para cima, $\mathbf{F}\cdot d\mathbf{S} = \left(-Pg_x - Qg_y + R\right)dA$. Aqui $g_x = -2x$, $g_y = -2y$, logo o integrando é $2x^2 + 2y^2 + \left(4 - x^2-y^2\right) = x^2+y^2+4$. Em polares sobre o disco de raio $2$: $\int_0^{2\pi}\!\!\int_0^2\left(r^2+4\right)r\,dr\,d\theta = 2\pi\left[\frac{r^4}{4} + 2r^2\right]_0^2 = 2\pi(4+8) = 24\pi \approx 75{,}4$.`,
  24 * Math.PI,
  () => fluxo((x, y, z) => [x, y, z], (r, t) => [r * Math.cos(t), r * Math.sin(t), 4 - r * r], 0, 2, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Fluxo de campo constante através de triângulo", "medio",
  R`O fluxo de $\mathbf{F} = (1,2,3)$ através da porção do plano $x+y+z = 1$ situada no primeiro octante, orientada com normal de componente $z$ positiva, é:`,
  R`$3$`,
  [R`$6$`, R`$2$`, R`$1$`, R`$\frac{3}{2}$`],
  R`A normal unitária é $\hat{\mathbf{n}} = \frac{(1,1,1)}{\sqrt3}$, de modo que $\mathbf{F}\cdot\hat{\mathbf{n}} = \frac{1+2+3}{\sqrt3} = \frac{6}{\sqrt3}$, constante. A porção é o triângulo de vértices $(1,0,0)$, $(0,1,0)$ e $(0,0,1)$, cuja área é $\frac{\sqrt3}{2}$. Logo o fluxo é $\frac{6}{\sqrt3}\cdot\frac{\sqrt3}{2} = 3$.`,
  3,
  () => fluxo(() => [1, 2, 3], (x, y) => [x, y, 1 - x - y], 0, 1, 0, (x) => 1 - x, 300)
);

q(
  C3, TS, "Integral de campo escalar sobre hemisfério", "medio",
  R`O valor de $\displaystyle\iint_S z\,dS$, em que $S$ é o hemisfério $x^2+y^2+z^2 = 4$ com $z \ge 0$, é:`,
  R`$8\pi$`,
  [R`$4\pi$`, R`$16\pi$`, R`$\frac{8\pi}{3}$`, R`$2\pi$`],
  R`Em esféricas com $\rho = 2$: $z = 2\cos\varphi$ e $dS = 4\operatorname{sen}\varphi\,d\varphi\,d\theta$, com $0\le\varphi\le\frac{\pi}{2}$. Então $\iint_S z\,dS = \int_0^{2\pi}\!\!\int_0^{\pi/2}8\cos\varphi\operatorname{sen}\varphi\,d\varphi\,d\theta = 2\pi\cdot 8\cdot\left[\frac{\operatorname{sen}^2\varphi}{2}\right]_0^{\pi/2} = 8\pi \approx 25{,}1$.`,
  8 * Math.PI,
  () => superficieEscalar((x, y, z) => z, esfera(2), 0, Math.PI / 2, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Fluxo através de superfície cilíndrica", "medio",
  R`O fluxo de $\mathbf{F}(x,y,z) = (x,y,z)$ através da superfície lateral do cilindro $x^2+y^2 = 9$, $0 \le z \le 5$, orientada para fora, é:`,
  R`$90\pi$`,
  [R`$45\pi$`, R`$180\pi$`, R`$30\pi$`, R`$60\pi$`],
  R`Na lateral, a normal unitária é $\hat{\mathbf{n}} = \frac{(x,y,0)}{3}$, logo $\mathbf{F}\cdot\hat{\mathbf{n}} = \frac{x^2+y^2}{3} = \frac{9}{3} = 3$, constante — a componente $z$ do campo é tangente e não contribui. A área lateral é $2\pi\cdot 3\cdot 5 = 30\pi$, e o fluxo vale $3\cdot 30\pi = 90\pi \approx 282{,}7$.`,
  90 * Math.PI,
  () => fluxo((x, y, z) => [x, y, z], (t, z) => [3 * Math.cos(t), 3 * Math.sin(t), z], 0, 2 * Math.PI, 0, 5, 300)
);

q(
  C3, TS, "Área lateral de cone truncado", "facil",
  R`A área da porção do cone $z = \sqrt{x^2+y^2}$ compreendida entre os planos $z = 1$ e $z = 2$ é:`,
  R`$3\sqrt{2}\pi$`,
  [R`$3\pi$`, R`$6\sqrt{2}\pi$`, R`$\frac{3\sqrt{2}\pi}{2}$`, R`$3\sqrt{3}\pi$`],
  R`Com $z = \sqrt{x^2+y^2}$ tem-se $z_x = \frac{x}{\sqrt{x^2+y^2}}$ e $z_y = \frac{y}{\sqrt{x^2+y^2}}$, logo $z_x^2+z_y^2 = 1$ e $dS = \sqrt{2}\,dA$ — o cone tem inclinação constante. A projeção é o anel $1 \le r \le 2$, de área $\pi(4-1) = 3\pi$. Portanto $A = 3\sqrt{2}\,\pi \approx 13{,}3$.`,
  3 * Math.SQRT2 * Math.PI,
  () => superficieEscalar(() => 1, (r, t) => [r * Math.cos(t), r * Math.sin(t), r], 1, 2, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Massa de superfície cônica", "medio",
  R`Uma lâmina tem a forma do cone $z = \sqrt{x^2+y^2}$, $0 \le z \le 3$, e densidade superficial $\delta(x,y,z) = z$. Sua massa é:`,
  R`$18\sqrt{2}\pi$`,
  [R`$9\sqrt{2}\pi$`, R`$36\sqrt{2}\pi$`, R`$18\pi$`, R`$6\sqrt{2}\pi$`],
  R`Como $dS = \sqrt2\,dA$ e sobre o cone $z = r$, a massa é $m = \iint_D r\sqrt{2}\,dA$ com $D$ o disco de raio $3$. Em polares: $m = \sqrt2\int_0^{2\pi}\!\!\int_0^3 r\cdot r\,dr\,d\theta = \sqrt2\cdot 2\pi\cdot 9 = 18\sqrt{2}\,\pi \approx 80{,}0$.`,
  18 * Math.SQRT2 * Math.PI,
  () => superficieEscalar((x, y, z) => z, (r, t) => [r * Math.cos(t), r * Math.sin(t), r], 0, 3, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Fluxo através de hemisfério", "dificil",
  R`O fluxo de $\mathbf{F}(x,y,z) = (0,0,z)$ através do hemisfério $x^2+y^2+z^2 = 1$, $z\ge 0$, orientado para fora, é:`,
  R`$\frac{2\pi}{3}$`,
  [R`$\frac{4\pi}{3}$`, R`$\frac{\pi}{3}$`, R`$\frac{2\pi}{5}$`, R`$\pi$`],
  R`Na esfera unitária a normal exterior é $\hat{\mathbf{n}} = (x,y,z)$, logo $\mathbf{F}\cdot\hat{\mathbf{n}} = z^2$. Em esféricas com $\rho = 1$, $z^2 = \cos^2\varphi$ e $dS = \operatorname{sen}\varphi\,d\varphi\,d\theta$, de modo que o fluxo é $\int_0^{2\pi}\!\!\int_0^{\pi/2}\cos^2\varphi\operatorname{sen}\varphi\,d\varphi\,d\theta = 2\pi\left[-\frac{\cos^3\varphi}{3}\right]_0^{\pi/2} = \frac{2\pi}{3} \approx 2{,}09$.`,
  (2 * Math.PI) / 3,
  () => fluxo((x, y, z) => [0, 0, z], esfera(1), 0, Math.PI / 2, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Área de calota esférica", "medio",
  R`A área da porção da esfera $\rho = 2$ situada acima do cone $\varphi = \dfrac{\pi}{3}$ é:`,
  R`$4\pi$`,
  [R`$8\pi$`, R`$2\pi$`, R`$6\pi$`, R`$\frac{4\pi}{3}$`],
  R`Com $\rho = 2$ fixo, $dS = 4\operatorname{sen}\varphi\,d\varphi\,d\theta$. A calota corresponde a $0\le\varphi\le\frac{\pi}{3}$, logo $A = \int_0^{2\pi}\!\!\int_0^{\pi/3}4\operatorname{sen}\varphi\,d\varphi\,d\theta = 8\pi\left[-\cos\varphi\right]_0^{\pi/3} = 8\pi\left(1-\frac12\right) = 4\pi \approx 12{,}6$. (Confere com $A = 2\pi a h$, sendo $h = 2 - 1 = 1$ a altura da calota.)`,
  4 * Math.PI,
  () => superficieEscalar(() => 1, esfera(2), 0, Math.PI / 3, 0, 2 * Math.PI, 300)
);

q(
  C3, TS, "Integral de superfície sobre plano oblíquo", "medio",
  R`O valor de $\displaystyle\iint_S (x+y+z)\,dS$, em que $S$ é a porção do plano $x+y+z = 2$ no primeiro octante, é:`,
  R`$4\sqrt{3}$`,
  [R`$2\sqrt{3}$`, R`$8\sqrt{3}$`, R`$4\sqrt{2}$`, R`$6\sqrt{3}$`],
  R`Sobre $S$ o integrando é constante e vale $2$, de modo que a integral é $2\cdot\text{área}(S)$. Com $z = 2-x-y$, $dS = \sqrt{1+1+1}\,dA = \sqrt3\,dA$, e a projeção é o triângulo $x,y\ge 0$, $x+y\le 2$, de área $2$. Logo $\text{área}(S) = 2\sqrt3$ e a integral vale $4\sqrt{3} \approx 6{,}93$.`,
  4 * Math.sqrt(3),
  () => superficieEscalar((x, y, z) => x + y + z, (x, y) => [x, y, 2 - x - y], 0, 2, 0, (x) => 2 - x, 300)
);

// ===========================================================================
// Teorema de Stokes
// ===========================================================================

q(
  C3, TK, "Cálculo do rotacional", "medio",
  R`Para $\mathbf{F}(x,y,z) = \left(xz,\; xyz,\; -y^2\right)$, o módulo de $\operatorname{rot}\mathbf{F}$ no ponto $(1,1,1)$ é:`,
  R`$\sqrt{11}$`,
  [R`$\sqrt{10}$`, R`$\sqrt{13}$`, R`$\sqrt{6}$`, R`$\sqrt{14}$`],
  R`Pelo determinante simbólico, $\operatorname{rot}\mathbf{F} = \left(R_y - Q_z,\; P_z - R_x,\; Q_x - P_y\right)$ com $P = xz$, $Q = xyz$ e $R = -y^2$. Assim $R_y - Q_z = -2y - xy$, $P_z - R_x = x - 0$ e $Q_x - P_y = yz - 0$. Em $(1,1,1)$: $\operatorname{rot}\mathbf{F} = (-3,\,1,\,1)$, de módulo $\sqrt{9+1+1} = \sqrt{11} \approx 3{,}32$.`,
  Math.sqrt(11),
  () => norma(rotacional((x, y, z) => [x * z, x * y * z, -y * y], [1, 1, 1]))
);

q(
  C3, TK, "Circulação por Stokes sobre círculo", "medio",
  R`Seja $C$ o círculo $x^2+y^2 = 1$ no plano $z = 0$, orientado no sentido anti-horário visto de cima, e $\mathbf{F} = \left(-y^3,\; x^3,\; z^3\right)$. O valor de $\displaystyle\oint_C \mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$\frac{3\pi}{2}$`,
  [R`$\frac{3\pi}{4}$`, R`$3\pi$`, R`$\frac{\pi}{2}$`, R`$\frac{9\pi}{2}$`],
  R`O rotacional é $\operatorname{rot}\mathbf{F} = \left(0,\,0,\,3x^2+3y^2\right)$. Tomando como superfície o disco $x^2+y^2\le1$ em $z=0$, com normal $\hat{\mathbf{k}}$, Stokes dá $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_D 3\left(x^2+y^2\right)dA = 3\int_0^{2\pi}\!\!\int_0^1 r^3dr\,d\theta = 3\cdot\frac{2\pi}{4} = \frac{3\pi}{2} \approx 4{,}71$.`,
  (3 * Math.PI) / 2,
  () => linhaVetorial((x, y, z) => [-(y ** 3), x ** 3, z ** 3], (t) => [Math.cos(t), Math.sin(t), 0], 0, 2 * Math.PI)
);

q(
  C3, TK, "Stokes sobre contorno triangular", "dificil",
  R`Seja $C$ o triângulo de vértices $(1,0,0)$, $(0,1,0)$ e $(0,0,1)$, percorrido nessa ordem, e $\mathbf{F} = \left(x^2z,\; xy^2,\; z^2\right)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$\frac{1}{6}$`,
  [R`$\frac{1}{3}$`, R`$\frac{1}{12}$`, R`$\frac{1}{2}$`, R`$\frac{2}{3}$`],
  R`O rotacional é $\operatorname{rot}\mathbf{F} = \left(0,\; x^2,\; y^2\right)$. Como superfície tome o triângulo do plano $z = 1-x-y$, cuja normal (compatível com a orientação dada, pela regra da mão direita) satisfaz $d\mathbf{S} = (1,1,1)\,dA$. Então $\oint_C \mathbf{F}\cdot d\mathbf{r} = \iint_D\left(x^2+y^2\right)dA$ sobre o triângulo $x,y\ge0$, $x+y\le1$. Por simetria, $\iint_D x^2dA = \int_0^1 x^2(1-x)dx = \frac{1}{12}$, e o total é $2\cdot\frac{1}{12} = \frac{1}{6} \approx 0{,}17$.`,
  1 / 6,
  () => circuitoTriangulo((x, y, z) => [x * x * z, x * y * y, z * z], [1, 0, 0], [0, 1, 0], [0, 0, 1])
);

q(
  C3, TK, "Stokes com rotacional constante", "medio",
  R`Seja $C$ o triângulo de vértices $(2,0,0)$, $(0,2,0)$ e $(0,0,2)$, percorrido nessa ordem, e $\mathbf{F} = (y,\,z,\,x)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$-6$`,
  [R`$6$`, R`$-3$`, R`$-12$`, R`$-2$`],
  R`Aqui $\operatorname{rot}\mathbf{F} = (0-1,\; 0-1,\; 0-1) = (-1,-1,-1)$, constante. A superfície é a porção do plano $x+y+z = 2$ no primeiro octante, com $d\mathbf{S} = (1,1,1)\,dA$ e projeção de área $2$. Logo $\oint_C\mathbf{F}\cdot d\mathbf{r} = \iint_D(-1-1-1)\,dA = -3\cdot 2 = -6$.`,
  -6,
  () => circuitoTriangulo((x, y, z) => [y, z, x], [2, 0, 0], [0, 2, 0], [0, 0, 2])
);

q(
  C3, TK, "Circulação com rotacional variável", "medio",
  R`Seja $C$ o círculo $x^2+y^2 = 1$ em $z = 0$, orientado no sentido anti-horário visto de cima, e $\mathbf{F} = \left(y^2,\; x,\; z^2\right)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$\pi$`,
  [R`$2\pi$`, R`$-\pi$`, R`$\frac{\pi}{2}$`, R`$3\pi$`],
  R`A componente $z$ do rotacional é $Q_x - P_y = 1 - 2y$ (as outras componentes não importam, pois a normal do disco é $\hat{\mathbf{k}}$). Por Stokes, $\oint_C \mathbf{F}\cdot d\mathbf{r} = \iint_D (1-2y)\,dA = \text{área}(D) - 2\iint_D y\,dA = \pi - 0 = \pi$, já que $\iint_D y\,dA = 0$ por simetria do disco em relação ao eixo $x$.`,
  Math.PI,
  () => linhaVetorial((x, y, z) => [y * y, x, z * z], (t) => [Math.cos(t), Math.sin(t), 0], 0, 2 * Math.PI)
);

q(
  C3, TK, "Campo irrotacional: determinação de parâmetro", "medio",
  R`O campo $\mathbf{F}(x,y,z) = \left(a\,xy + z^3,\; 3x^2 - z,\; 3xz^2 - y\right)$ é irrotacional (e portanto conservativo em $\mathbb{R}^3$) para:`,
  R`$a = 6$`,
  [R`$a = 3$`, R`$a = 2$`, R`$a = 12$`, R`$a = 9$`],
  R`Impondo $\operatorname{rot}\mathbf{F} = \mathbf{0}$ componente a componente: $R_y - Q_z = -1 - (-1) = 0$ já vale; $P_z - R_x = 3z^2 - 3z^2 = 0$ também; resta $Q_x - P_y = 6x - a x = 0$ para todo $x$, o que exige $a = 6$. Com esse valor, $f(x,y,z) = 3x^2y + xz^3 - yz$ é uma função potencial.`,
  6,
  () => bissecao((a) => rotacional((x, y, z) => [a * x * y + z ** 3, 3 * x * x - z, 3 * x * z * z - y], [1, 1, 1])[2], 0, 12),
  { tol: 1e-3, semLatex: true }
);

q(
  C3, TK, "Stokes sobre curva em plano inclinado", "medio",
  R`Seja $C$ a curva de interseção do cilindro $x^2+y^2 = 4$ com o plano $z = x+2$, orientada no sentido anti-horário vista de cima, e $\mathbf{F} = \left(x^2,\; 2x,\; z^2\right)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$8\pi$`,
  [R`$4\pi$`, R`$16\pi$`, R`$2\pi$`, R`$12\pi$`],
  R`O rotacional é $\operatorname{rot}\mathbf{F} = (0,\,0,\,2)$. Tomando a porção do plano $z = x+2$ interior ao cilindro, com $d\mathbf{S} = \left(-z_x,\,-z_y,\,1\right)dA = (-1,0,1)\,dA$, resulta $\operatorname{rot}\mathbf{F}\cdot d\mathbf{S} = 2\,dA$. A projeção é o disco de raio $2$, logo a circulação vale $2\cdot 4\pi = 8\pi \approx 25{,}1$.`,
  8 * Math.PI,
  () => linhaVetorial((x, y, z) => [x * x, 2 * x, z * z], (t) => [2 * Math.cos(t), 2 * Math.sin(t), 2 * Math.cos(t) + 2], 0, 2 * Math.PI)
);

q(
  C3, TK, "Stokes com rotacional linear", "dificil",
  R`Seja $C$ o triângulo de vértices $(3,0,0)$, $(0,3,0)$ e $(0,0,3)$, percorrido nessa ordem, e $\mathbf{F} = \left(z^2,\; x^2,\; y^2\right)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$27$`,
  [R`$9$`, R`$54$`, R`$18$`, R`$81$`],
  R`O rotacional é $\operatorname{rot}\mathbf{F} = (2y,\; 2z,\; 2x)$. A superfície é a porção do plano $x+y+z = 3$ no primeiro octante, com $d\mathbf{S} = (1,1,1)\,dA$; então $\operatorname{rot}\mathbf{F}\cdot d\mathbf{S} = 2(x+y+z)\,dA = 6\,dA$ — constante sobre o plano. A projeção é o triângulo $x,y\ge0$, $x+y\le3$, de área $\frac{9}{2}$. Logo a circulação é $6\cdot\frac92 = 27$.`,
  27,
  () => circuitoTriangulo((x, y, z) => [z * z, x * x, y * y], [3, 0, 0], [0, 3, 0], [0, 0, 3])
);

q(
  C3, TK, "Módulo do rotacional", "medio",
  R`Para $\mathbf{F}(x,y,z) = \left(x^2y,\; y^2z,\; z^2x\right)$, o módulo de $\operatorname{rot}\mathbf{F}$ no ponto $(1,2,3)$ é:`,
  R`$7\sqrt{2}$`,
  [R`$7\sqrt{3}$`, R`$14\sqrt{2}$`, R`$5\sqrt{2}$`, R`$7\sqrt{5}$`],
  R`Com $P = x^2y$, $Q = y^2z$ e $R = z^2x$: $R_y - Q_z = 0 - y^2 = -y^2$; $P_z - R_x = 0 - z^2 = -z^2$; $Q_x - P_y = 0 - x^2 = -x^2$. Em $(1,2,3)$: $\operatorname{rot}\mathbf{F} = (-4,-9,-1)$, cujo módulo é $\sqrt{16+81+1} = \sqrt{98} = 7\sqrt{2} \approx 9{,}90$.`,
  7 * Math.SQRT2,
  () => norma(rotacional((x, y, z) => [x * x * y, y * y * z, z * z * x], [1, 2, 3]))
);

q(
  C3, TK, "Circulação sobre curva em plano horizontal", "medio",
  R`Seja $C$ a interseção da esfera $x^2+y^2+z^2 = 4$ com o plano $z = 1$, orientada no sentido anti-horário vista de cima, e $\mathbf{F} = (y,\,-x,\,0)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$-6\pi$`,
  [R`$6\pi$`, R`$-3\pi$`, R`$-12\pi$`, R`$-2\pi$`],
  R`A curva é o círculo $x^2+y^2 = 3$ no plano $z = 1$, de raio $\sqrt3$. O rotacional é $\operatorname{rot}\mathbf{F} = (0,0,-2)$, e tomando como superfície o disco plano limitado por $C$, com normal $\hat{\mathbf{k}}$: $\oint_C\mathbf{F}\cdot d\mathbf{r} = -2\cdot\text{área} = -2\cdot 3\pi = -6\pi \approx -18{,}8$.`,
  -6 * Math.PI,
  () => linhaVetorial((x, y, z) => [y, -x, 0], (t) => [Math.sqrt(3) * Math.cos(t), Math.sqrt(3) * Math.sin(t), 1], 0, 2 * Math.PI)
);

q(
  C3, TK, "Stokes sobre elipse em plano inclinado", "dificil",
  R`Seja $C$ a curva de interseção do plano $z = x$ com o cilindro $x^2+y^2 = 4$, orientada no sentido anti-horário vista de cima, e $\mathbf{F} = \left(2z,\; x,\; 3y\right)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$-8\pi$`,
  [R`$8\pi$`, R`$-4\pi$`, R`$-16\pi$`, R`$-2\pi$`],
  R`O rotacional é $\operatorname{rot}\mathbf{F} = \left(3-0,\; 2-0,\; 1-0\right) = (3,2,1)$. Sobre a porção do plano $z = x$ interior ao cilindro, $d\mathbf{S} = (-1,0,1)\,dA$, logo $\operatorname{rot}\mathbf{F}\cdot d\mathbf{S} = (-3+1)\,dA = -2\,dA$. Com projeção igual ao disco de raio $2$ (área $4\pi$), a circulação vale $-8\pi \approx -25{,}1$.`,
  -8 * Math.PI,
  () => linhaVetorial((x, y, z) => [2 * z, x, 3 * y], (t) => [2 * Math.cos(t), 2 * Math.sin(t), 2 * Math.cos(t)], 0, 2 * Math.PI)
);

q(
  C3, TK, "Circulação de campo rotacional puro", "facil",
  R`Seja $C$ o círculo $x^2+y^2 = 9$ em $z = 0$, orientado no sentido anti-horário visto de cima, e $\mathbf{F} = (-y,\,x,\,0)$. O valor de $\displaystyle\oint_C\mathbf{F}\cdot d\mathbf{r}$ é:`,
  R`$18\pi$`,
  [R`$9\pi$`, R`$36\pi$`, R`$6\pi$`, R`$27\pi$`],
  R`O rotacional é $\operatorname{rot}\mathbf{F} = (0,0,2)$, de modo que, por Stokes sobre o disco de raio $3$, $\oint_C\mathbf{F}\cdot d\mathbf{r} = 2\cdot\text{área} = 2\cdot 9\pi = 18\pi \approx 56{,}5$. (O cálculo direto confirma: com $x = 3\cos t$ e $y = 3\operatorname{sen}t$, o integrando vale $9\,dt$.)`,
  18 * Math.PI,
  () => linhaVetorial((x, y, z) => [-y, x, 0], (t) => [3 * Math.cos(t), 3 * Math.sin(t), 0], 0, 2 * Math.PI)
);

// ===========================================================================
// Teorema de Gauss (divergência)
// ===========================================================================

q(
  C3, TG, "Cálculo da divergência", "facil",
  R`A divergência do campo $\mathbf{F}(x,y,z) = \left(xy^2,\; yz^2,\; zx^2\right)$ no ponto $(1,2,3)$ é:`,
  R`$14$`,
  [R`$12$`, R`$6$`, R`$36$`, R`$11$`],
  R`Derivando cada componente em relação à sua própria variável: $\operatorname{div}\mathbf{F} = \frac{\partial}{\partial x}\left(xy^2\right) + \frac{\partial}{\partial y}\left(yz^2\right) + \frac{\partial}{\partial z}\left(zx^2\right) = y^2 + z^2 + x^2$. Em $(1,2,3)$: $4 + 9 + 1 = 14$.`,
  14,
  () => divergente((x, y, z) => [x * y * y, y * z * z, z * x * x], [1, 2, 3])
);

q(
  C3, TG, "Fluxo através de um cubo", "medio",
  R`O fluxo de $\mathbf{F}(x,y,z) = \left(x^2, y^2, z^2\right)$ através da fronteira do cubo $[0,1]^3$, orientada para fora, é:`,
  R`$3$`,
  [R`$1$`, R`$6$`, R`$9$`, R`$2$`],
  R`Pelo teorema da divergência, $\iint_S\mathbf{F}\cdot d\mathbf{S} = \iiint_E 2(x+y+z)\,dV$. Por simetria do cubo, $\iiint_E x\,dV = \iiint_E y\,dV = \iiint_E z\,dV = \frac{1}{2}$, logo o fluxo é $2\cdot 3\cdot\frac12 = 3$. (Face a face dá o mesmo: só as faces $x=1$, $y=1$ e $z=1$ contribuem, com $1$ cada.)`,
  3,
  () => fluxoCaixa((x, y, z) => [x * x, y * y, z * z], [0, 1], [0, 1], [0, 1], 200)
);

q(
  C3, TG, "Fluxo através de esfera com divergência variável", "dificil",
  R`O fluxo de $\mathbf{F}(x,y,z) = \left(x^3, y^3, z^3\right)$ através da esfera $x^2+y^2+z^2 = 1$, orientada para fora, é:`,
  R`$\frac{12\pi}{5}$`,
  [R`$\frac{4\pi}{5}$`, R`$\frac{12\pi}{25}$`, R`$\frac{24\pi}{5}$`, R`$\frac{3\pi}{5}$`],
  R`Como $\operatorname{div}\mathbf{F} = 3\left(x^2+y^2+z^2\right) = 3\rho^2$, o teorema da divergência dá $\iiint_B 3\rho^2\,dV = 3\int_0^{2\pi}\!\!\int_0^{\pi}\!\!\int_0^1\rho^4\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta = 3\cdot 4\pi\cdot\frac{1}{5} = \frac{12\pi}{5} \approx 7{,}54$.`,
  (12 * Math.PI) / 5,
  () => fluxo((x, y, z) => [x ** 3, y ** 3, z ** 3], esfera(1), 0, Math.PI, 0, 2 * Math.PI, 300)
);

q(
  C3, TG, "Gauss em superfície aberta (fechando com tampa)", "dificil",
  R`O fluxo de $\mathbf{F}(x,y,z) = (x,\,2y,\,3z)$ através do paraboloide $z = 4-x^2-y^2$, $z\ge 0$, orientado para cima, é:`,
  R`$48\pi$`,
  [R`$24\pi$`, R`$96\pi$`, R`$16\pi$`, R`$32\pi$`],
  R`A superfície é aberta; fecha-se com o disco $D$: $x^2+y^2\le4$ em $z=0$, orientado para baixo. Como $\operatorname{div}\mathbf{F} = 6$ e o volume do sólido é $V = \int_0^{2\pi}\!\!\int_0^2(4-r^2)r\,dr\,d\theta = 8\pi$, o fluxo total pela superfície fechada é $6\cdot 8\pi = 48\pi$. No disco, $\mathbf{F}\cdot\hat{\mathbf{n}} = -3z = 0$ (pois $z=0$), de modo que sua contribuição é nula e o fluxo pelo paraboloide é $48\pi \approx 150{,}8$.`,
  48 * Math.PI,
  () => fluxo((x, y, z) => [x, 2 * y, 3 * z], (r, t) => [r * Math.cos(t), r * Math.sin(t), 4 - r * r], 0, 2, 0, 2 * Math.PI, 300)
);

q(
  C3, TG, "Fluxo através de cilindro fechado", "medio",
  R`O fluxo de $\mathbf{F}(x,y,z) = \left(x+z^2,\; y-xz,\; z+xy\right)$ através da fronteira do cilindro sólido $x^2+y^2\le 1$, $0\le z\le 2$, orientada para fora, é:`,
  R`$6\pi$`,
  [R`$3\pi$`, R`$12\pi$`, R`$2\pi$`, R`$9\pi$`],
  R`Apesar do aspecto do campo, $\operatorname{div}\mathbf{F} = 1 + 1 + 1 = 3$: os termos $z^2$, $-xz$ e $xy$ não dependem da variável em relação à qual são derivados. Pelo teorema da divergência, o fluxo é $3V$, com $V = \pi\cdot 1^2\cdot 2 = 2\pi$. Logo o fluxo vale $6\pi \approx 18{,}8$.`,
  6 * Math.PI,
  () => {
    const F = (x, y, z) => [x + z * z, y - x * z, z + x * y];
    const lateral = fluxo(F, (t, z) => [Math.cos(t), Math.sin(t), z], 0, 2 * Math.PI, 0, 2, 300);
    const topo = dupla((x, y) => (x * x + y * y <= 1 ? F(x, y, 2)[2] : 0), -1, 1, -1, 1, 800);
    const base = -dupla((x, y) => (x * x + y * y <= 1 ? F(x, y, 0)[2] : 0), -1, 1, -1, 1, 800);
    return lateral + topo + base;
  },
  { tol: 5e-3 }
);

q(
  C3, TG, "Campo do inverso do quadrado", "dificil",
  R`Seja $\mathbf{F} = \dfrac{\mathbf{r}}{|\mathbf{r}|^3}$, com $\mathbf{r} = (x,y,z)$. O fluxo de $\mathbf{F}$ através de qualquer superfície fechada orientada para fora que envolva a origem é:`,
  R`$4\pi$`,
  [R`$0$`, R`$2\pi$`, R`$\frac{4\pi}{3}$`, R`$8\pi$`],
  R`Fora da origem, $\operatorname{div}\mathbf{F} = 0$ — mas o campo não está definido na origem, e o teorema da divergência não se aplica diretamente ao sólido inteiro. Recorta-se uma pequena esfera $S_\varepsilon$ em torno da origem: na região entre as superfícies a divergência é nula, de modo que o fluxo por $S$ é igual ao fluxo por $S_\varepsilon$. Nesta, $\hat{\mathbf{n}} = \frac{\mathbf{r}}{\varepsilon}$ e $\mathbf{F}\cdot\hat{\mathbf{n}} = \frac{1}{\varepsilon^2}$, logo o fluxo é $\frac{1}{\varepsilon^2}\cdot 4\pi\varepsilon^2 = 4\pi$, independentemente de $\varepsilon$ e do formato de $S$ (lei de Gauss).`,
  4 * Math.PI,
  () =>
    fluxo(
      (x, y, z) => {
        const r = Math.hypot(x, y, z);
        return [x / r ** 3, y / r ** 3, z / r ** 3];
      },
      (f, t) => [2 * Math.sin(f) * Math.cos(t), 3 * Math.sin(f) * Math.sin(t), 1.5 * Math.cos(f)],
      0, Math.PI, 0, 2 * Math.PI, 300
    )
);

q(
  C3, TG, "Fluxo através de tetraedro", "dificil",
  R`O fluxo de $\mathbf{F}(x,y,z) = \left(x,\; y^2,\; z\right)$ através da fronteira do tetraedro $x,y,z\ge0$, $x+y+z\le1$, orientada para fora, é:`,
  R`$\frac{5}{12}$`,
  [R`$\frac{1}{3}$`, R`$\frac{7}{12}$`, R`$\frac{5}{6}$`, R`$\frac{1}{4}$`],
  R`Tem-se $\operatorname{div}\mathbf{F} = 1 + 2y + 1 = 2 + 2y$. O volume do tetraedro é $\frac16$ e, por simetria das três variáveis, $\bar{y} = \frac{1}{4}$, ou seja $\iiint_E y\,dV = \frac{1}{6}\cdot\frac14 = \frac{1}{24}$. Logo o fluxo é $2\cdot\frac16 + 2\cdot\frac{1}{24} = \frac13 + \frac{1}{12} = \frac{5}{12} \approx 0{,}42$.`,
  5 / 12,
  () => {
    // só a face inclinada contribui: nas três faces coordenadas F·n = 0
    const F = (x, y, z) => [x, y * y, z];
    return fluxo(F, (x, y) => [x, y, 1 - x - y], 0, 1, 0, (x) => 1 - x, 300);
  }
);

q(
  C3, TG, "Fluxo com divergência constante", "facil",
  R`O fluxo de $\mathbf{F}(x,y,z) = (2x,\,3y,\,-z)$ através da esfera $x^2+y^2+z^2 = 9$, orientada para fora, é:`,
  R`$144\pi$`,
  [R`$72\pi$`, R`$36\pi$`, R`$108\pi$`, R`$288\pi$`],
  R`Como $\operatorname{div}\mathbf{F} = 2 + 3 - 1 = 4$ é constante, o teorema da divergência dá $\iint_S\mathbf{F}\cdot d\mathbf{S} = 4V$, em que $V = \frac{4}{3}\pi\cdot 27 = 36\pi$. Portanto o fluxo é $144\pi \approx 452{,}4$.`,
  144 * Math.PI,
  () => fluxo((x, y, z) => [2 * x, 3 * y, -z], esfera(3), 0, Math.PI, 0, 2 * Math.PI, 300)
);

q(
  C3, TG, "Fluxo através de esfera transladada", "dificil",
  R`O fluxo de $\mathbf{F}(x,y,z) = \left(x^2, y^2, z^2\right)$ através da esfera $(x-1)^2+y^2+z^2 = 1$, orientada para fora, é:`,
  R`$\frac{8\pi}{3}$`,
  [R`$\frac{4\pi}{3}$`, R`$\frac{16\pi}{3}$`, R`$4\pi$`, R`$\frac{8\pi}{9}$`],
  R`Aqui $\operatorname{div}\mathbf{F} = 2(x+y+z)$, e o fluxo é $2\iiint_E (x+y+z)\,dV = 2V\left(\bar x + \bar y + \bar z\right)$. O centroide da bola é o próprio centro $(1,0,0)$ e $V = \frac{4\pi}{3}$, logo o fluxo vale $2\cdot\frac{4\pi}{3}\cdot 1 = \frac{8\pi}{3} \approx 8{,}38$. (Note que, centrada na origem, a mesma integral daria zero.)`,
  (8 * Math.PI) / 3,
  () => fluxo((x, y, z) => [x * x, y * y, z * z], esfera(1, 1, 0, 0), 0, Math.PI, 0, 2 * Math.PI, 300)
);

q(
  C3, TG, "Divergência com funções transcendentes", "medio",
  R`A divergência de $\mathbf{F}(x,y,z) = \left(e^{xy},\; \operatorname{sen}(yz),\; z^2x\right)$ no ponto $(0,1,\pi)$ é:`,
  R`$1-\pi$`,
  [R`$1+\pi$`, R`$-\pi$`, R`$\pi-1$`, R`$1-2\pi$`],
  R`Derivando: $\operatorname{div}\mathbf{F} = y\,e^{xy} + z\cos(yz) + 2zx$. Em $(0,1,\pi)$: o primeiro termo vale $1\cdot e^0 = 1$; o segundo, $\pi\cos\pi = -\pi$; e o terceiro, $2\pi\cdot 0 = 0$. Logo $\operatorname{div}\mathbf{F} = 1 - \pi \approx -2{,}14$.`,
  1 - Math.PI,
  () => divergente((x, y, z) => [Math.exp(x * y), Math.sin(y * z), z * z * x], [0, 1, Math.PI])
);

q(
  C3, TG, "Fluxo pela fronteira de uma casca esférica", "medio",
  R`O fluxo de $\mathbf{F}(x,y,z) = (x,y,z)$ através da fronteira completa da casca $1 \le x^2+y^2+z^2 \le 4$, orientada para fora do sólido, é:`,
  R`$28\pi$`,
  [R`$12\pi$`, R`$32\pi$`, R`$84\pi$`, R`$21\pi$`],
  R`A fronteira tem duas partes: a esfera de raio $2$ (normal para fora) e a de raio $1$ (normal apontando para a origem, isto é, para dentro da bola menor). Como $\operatorname{div}\mathbf{F} = 3$, o fluxo total é $3V$, com $V = \frac{4\pi}{3}(8-1) = \frac{28\pi}{3}$. Logo o fluxo vale $28\pi \approx 88$ — o mesmo que $3\cdot\frac{32\pi}{3} - 3\cdot\frac{4\pi}{3}$, isto é, o fluxo pela esfera externa menos o da interna.`,
  28 * Math.PI,
  () => {
    const F = (x, y, z) => [x, y, z];
    return (
      fluxo(F, esfera(2), 0, Math.PI, 0, 2 * Math.PI, 300) - fluxo(F, esfera(1), 0, Math.PI, 0, 2 * Math.PI, 300)
    );
  }
);

q(
  C3, TG, "Volume por integral de superfície", "medio",
  R`O fluxo de $\mathbf{F}(x,y,z) = (x,\,0,\,0)$ através da fronteira do elipsoide sólido $\dfrac{x^2}{4}+\dfrac{y^2}{9}+z^2\le 1$, orientada para fora, é:`,
  R`$8\pi$`,
  [R`$24\pi$`, R`$\frac{8\pi}{3}$`, R`$4\pi$`, R`$12\pi$`],
  R`Como $\operatorname{div}\mathbf{F} = 1$, o teorema da divergência transforma o fluxo no próprio volume do sólido: $\iint_S\mathbf{F}\cdot d\mathbf{S} = \iiint_E dV = V$. Para o elipsoide de semi-eixos $2$, $3$ e $1$, $V = \frac{4}{3}\pi abc = \frac{4}{3}\pi\cdot 6 = 8\pi \approx 25{,}1$.`,
  8 * Math.PI,
  () =>
    fluxo(
      (x) => [x, 0, 0],
      (f, t) => [2 * Math.sin(f) * Math.cos(t), 3 * Math.sin(f) * Math.sin(t), Math.cos(f)],
      0, Math.PI, 0, 2 * Math.PI, 300
    )
);

finalizar("calculo3_lote3.json", 20260918);
