// Cálculo III — lote 2: integrais duplas, triplas e de linha (36 questões).
// Estilo Guidorizzi vol. 3 / Stewart.
//
// Conferência: toda integral é recalculada numericamente a partir da REGIÃO
// descrita no enunciado (Simpson iterado em coordenadas cartesianas, polares,
// cilíndricas ou esféricas). Nas questões de mudança de variáveis o jacobiano
// é obtido por derivada numérica da própria transformação — não é o número que
// eu escrevi na resolução. Nas de Green, a conferência integra a CURVA
// parametrizada, do outro lado do teorema.
import {
  q, finalizar, R,
  simpson, dupla, duplaPolar, tripla, triplaCilindrica, triplaEsferica,
  linhaEscalar, linhaVetorial, parcial, dot, cross,
} from "./calculo23_kit.mjs";

const C3 = "Cálculo III";
const TD = "Integrais Duplas";
const TT = "Integrais Triplas";
const TL = "Integral de Linha";

// jacobiano (determinante) de uma transformação T: R^n -> R^n, por derivada numérica
function jacobiano(T, p) {
  const n = p.length;
  const M = [];
  for (let i = 0; i < n; i++) M.push(p.map((_, k) => parcial((...x) => T(...x)[i], p, k)));
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  return dot(M[0], cross(M[1], M[2]));
}

// ===========================================================================
// Integrais duplas
// ===========================================================================

q(
  C3, TD, "Integral iterada sobre retângulo", "medio",
  R`O valor de $\displaystyle\int_0^1\!\!\int_0^3 x\,e^{xy}\,dy\,dx$ é:`,
  R`$\frac{e^3-4}{3}$`,
  [R`$\frac{e^3-1}{3}$`, R`$\frac{e^3-4}{9}$`, R`$\frac{e^3-3}{3}$`, R`$\frac{e^3+4}{3}$`],
  R`Integrando primeiro em $y$ (com $x$ fixo), $\int_0^3 x e^{xy}\,dy = \left[e^{xy}\right]_{y=0}^{y=3} = e^{3x} - 1$ — a ordem escolhida evita integração por partes. Resta $\int_0^1\left(e^{3x}-1\right)dx = \frac{e^3-1}{3} - 1 = \frac{e^3-4}{3} \approx 5{,}36$.`,
  (Math.exp(3) - 4) / 3,
  () => dupla((x, y) => x * Math.exp(x * y), 0, 1, 0, 3, 300)
);

q(
  C3, TD, "Inversão da ordem de integração", "dificil",
  R`O valor de $\displaystyle\int_0^1\!\!\int_{3y}^{3} e^{x^2}\,dx\,dy$ é:`,
  R`$\frac{e^9-1}{6}$`,
  [R`$\frac{e^9-1}{3}$`, R`$\frac{e^9-1}{2}$`, R`$\frac{e^3-1}{6}$`, R`$\frac{e^9+1}{6}$`],
  R`A primitiva de $e^{x^2}$ não é elementar, então é preciso inverter a ordem. A região é $\{(x,y): 0 \le y \le 1,\ 3y \le x \le 3\}$, que descrita em $x$ vira $\{0 \le x \le 3,\ 0 \le y \le \frac{x}{3}\}$. Assim a integral é $\int_0^3\!\!\int_0^{x/3} e^{x^2}dy\,dx = \int_0^3 \frac{x}{3}e^{x^2}dx$. Com $u = x^2$: $\frac{1}{6}\left[e^{x^2}\right]_0^3 = \frac{e^9-1}{6} \approx 1350{,}3$.`,
  (Math.exp(9) - 1) / 6,
  () => dupla((x, y) => Math.exp(x * x), 0, 3, 0, (x) => x / 3, 400)
);

q(
  C3, TD, "Inversão da ordem com integrando não elementar", "dificil",
  R`O valor de $\displaystyle\int_0^1\!\!\int_x^1 \frac{\operatorname{sen}y}{y}\,dy\,dx$ é:`,
  R`$1-\cos 1$`,
  [R`$\cos 1$`, R`$1-\operatorname{sen}1$`, R`$\frac{1-\cos 1}{2}$`, R`$\operatorname{sen}1$`],
  R`A função $\frac{\operatorname{sen}y}{y}$ não tem primitiva elementar, mas a região $\{0 \le x \le 1,\ x \le y \le 1\}$ pode ser lida como $\{0 \le y \le 1,\ 0 \le x \le y\}$. Invertendo, $\int_0^1\!\!\int_0^y \frac{\operatorname{sen}y}{y}dx\,dy = \int_0^1 \frac{\operatorname{sen}y}{y}\cdot y\,dy = \int_0^1 \operatorname{sen}y\,dy = 1 - \cos 1 \approx 0{,}46$.`,
  1 - Math.cos(1),
  () => dupla((x, y) => (y === 0 ? 1 : Math.sin(y) / y), 0, 1, (x) => x, 1, 300)
);

q(
  C3, TD, "Coordenadas polares sobre um anel", "facil",
  R`Seja $D$ o anel $1 \le x^2 + y^2 \le 4$. O valor de $\displaystyle\iint_D \frac{dA}{\sqrt{x^2+y^2}}$ é:`,
  R`$2\pi$`,
  [R`$\pi$`, R`$4\pi$`, R`$3\pi$`, R`$\frac{2\pi}{3}$`],
  R`Em coordenadas polares, $\sqrt{x^2+y^2} = r$ e $dA = r\,dr\,d\theta$, de modo que o integrando vira $\frac{1}{r}\cdot r = 1$. Logo $\iint_D \frac{dA}{r} = \int_0^{2\pi}\!\!\int_1^2 dr\,d\theta = 2\pi(2-1) = 2\pi \approx 6{,}28$.`,
  2 * Math.PI,
  () => duplaPolar((x, y) => 1 / Math.hypot(x, y), 0, 2 * Math.PI, 1, 2, 300)
);

q(
  C3, TD, "Área entre cardioide e círculo", "dificil",
  R`A área da região interior à cardioide $r = 1 + \cos\theta$ e exterior ao círculo $r = 1$ é:`,
  R`$2+\frac{\pi}{4}$`,
  [R`$2+\frac{\pi}{2}$`, R`$4+\frac{\pi}{4}$`, R`$1+\frac{\pi}{4}$`, R`$2+\frac{\pi}{8}$`],
  R`A cardioide está fora do círculo quando $1 + \cos\theta > 1$, isto é para $-\frac{\pi}{2} < \theta < \frac{\pi}{2}$. A área é $A = \frac{1}{2}\int_{-\pi/2}^{\pi/2}\left[(1+\cos\theta)^2 - 1\right]d\theta = \frac{1}{2}\int_{-\pi/2}^{\pi/2}\left(2\cos\theta + \cos^2\theta\right)d\theta$. O primeiro termo dá $\frac{1}{2}\cdot 4 = 2$ e o segundo, usando $\cos^2\theta = \frac{1+\cos 2\theta}{2}$, dá $\frac{1}{2}\cdot\frac{\pi}{2} = \frac{\pi}{4}$. Logo $A = 2 + \frac{\pi}{4} \approx 2{,}79$.`,
  2 + Math.PI / 4,
  () => duplaPolar(() => 1, -Math.PI / 2, Math.PI / 2, 1, (t) => 1 + Math.cos(t), 400)
);

q(
  C3, TD, "Volume sob paraboloide", "medio",
  R`O volume do sólido limitado inferiormente pelo plano $z = 0$, superiormente pela superfície $z = 9 - x^2 - y^2$ e lateralmente pelo cilindro $x^2 + y^2 = 4$ é:`,
  R`$28\pi$`,
  [R`$14\pi$`, R`$32\pi$`, R`$36\pi$`, R`$56\pi$`],
  R`O volume é $\iint_D (9 - x^2 - y^2)\,dA$ com $D$ o disco de raio $2$. Em polares, $V = \int_0^{2\pi}\!\!\int_0^2 (9 - r^2)r\,dr\,d\theta = 2\pi\left[\frac{9r^2}{2} - \frac{r^4}{4}\right]_0^2 = 2\pi(18 - 4) = 28\pi \approx 88$. (Note que o teto está acima do plano em todo $D$, pois $9 - r^2 \ge 5 > 0$.)`,
  28 * Math.PI,
  () => duplaPolar((x, y) => 9 - x * x - y * y, 0, 2 * Math.PI, 0, 2, 300)
);

q(
  C3, TD, "Mudança de variáveis com jacobiano", "dificil",
  R`Seja $R$ a região do plano limitada pelas retas $x + y = 0$, $x + y = 1$, $x - y = 0$ e $x - y = 2$. Usando $u = x+y$ e $v = x-y$, o valor de $\displaystyle\iint_R (x+y)\,e^{x^2-y^2}\,dA$ é:`,
  R`$\frac{e^2-3}{4}$`,
  [R`$\frac{e^2-3}{2}$`, R`$\frac{e^2-1}{4}$`, R`$\frac{e^2-3}{8}$`, R`$\frac{e^2+3}{4}$`],
  R`Com $u = x+y$ e $v = x-y$ tem-se $x = \frac{u+v}{2}$, $y = \frac{u-v}{2}$ e $x^2 - y^2 = (x+y)(x-y) = uv$. O jacobiano é $\frac{\partial(x,y)}{\partial(u,v)} = \begin{vmatrix} \frac12 & \frac12 \\ \frac12 & -\frac12\end{vmatrix} = -\frac12$, logo $dA = \frac{1}{2}du\,dv$, e a região vira o retângulo $0 \le u \le 1$, $0 \le v \le 2$. Assim a integral é $\frac{1}{2}\int_0^1\!\!\int_0^2 u e^{uv}\,dv\,du = \frac{1}{2}\int_0^1\left(e^{2u}-1\right)du = \frac{1}{2}\left(\frac{e^2-1}{2}-1\right) = \frac{e^2-3}{4} \approx 1{,}10$.`,
  (Math.exp(2) - 3) / 4,
  () => {
    const T = (u, v) => [(u + v) / 2, (u - v) / 2];
    return simpson(
      (u) =>
        simpson((v) => {
          const [x, y] = T(u, v);
          return (x + y) * Math.exp(x * x - y * y) * Math.abs(jacobiano(T, [u, v]));
        }, 0, 2, 200),
      0, 1, 200
    );
  }
);

q(
  C3, TD, "Valor médio sobre região triangular", "medio",
  R`O valor médio de $f(x,y) = xy$ sobre o triângulo de vértices $(0,0)$, $(1,0)$ e $(0,1)$ é:`,
  R`$\frac{1}{12}$`,
  [R`$\frac{1}{24}$`, R`$\frac{1}{6}$`, R`$\frac{1}{8}$`, R`$\frac{1}{4}$`],
  R`O valor médio é $\frac{1}{A(D)}\iint_D f\,dA$, com $A(D) = \frac{1}{2}$. A integral vale $\int_0^1\!\!\int_0^{1-x} xy\,dy\,dx = \int_0^1 x\frac{(1-x)^2}{2}dx = \frac{1}{2}\left(\frac12 - \frac23 + \frac14\right) = \frac{1}{24}$. Portanto o valor médio é $\frac{1/24}{1/2} = \frac{1}{12} \approx 0{,}083$.`,
  1 / 12,
  () => dupla((x, y) => x * y, 0, 1, 0, (x) => 1 - x, 300) / 0.5
);

q(
  C3, TD, "Centro de massa de lâmina", "dificil",
  R`Uma lâmina ocupa o triângulo de vértices $(0,0)$, $(1,0)$ e $(1,1)$ e tem densidade $\delta(x,y) = x$. A abscissa $\bar{x}$ do centro de massa é:`,
  R`$\frac{3}{4}$`,
  [R`$\frac{2}{3}$`, R`$\frac{1}{2}$`, R`$\frac{4}{5}$`, R`$\frac{5}{8}$`],
  R`A região é $\{0 \le x \le 1,\ 0 \le y \le x\}$. A massa é $m = \int_0^1\!\!\int_0^x x\,dy\,dx = \int_0^1 x^2dx = \frac{1}{3}$, e o momento em relação ao eixo $y$ é $M_y = \int_0^1\!\!\int_0^x x^2\,dy\,dx = \int_0^1 x^3dx = \frac{1}{4}$. Logo $\bar{x} = \frac{M_y}{m} = \frac{1/4}{1/3} = \frac{3}{4}$.`,
  0.75,
  () => dupla((x, y) => x * x, 0, 1, 0, (x) => x, 300) / dupla((x, y) => x, 0, 1, 0, (x) => x, 300)
);

q(
  C3, TD, "Integral em polares com potência fracionária", "medio",
  R`O valor de $\displaystyle\iint_D \left(x^2+y^2\right)^{3/2}dA$, em que $D$ é o disco $x^2+y^2 \le 1$, é:`,
  R`$\frac{2\pi}{5}$`,
  [R`$\frac{2\pi}{3}$`, R`$\frac{\pi}{5}$`, R`$\frac{4\pi}{5}$`, R`$\frac{2\pi}{7}$`],
  R`Em polares o integrando vira $r^3$ e $dA = r\,dr\,d\theta$, logo $\iint_D\left(x^2+y^2\right)^{3/2}dA = \int_0^{2\pi}\!\!\int_0^1 r^4\,dr\,d\theta = 2\pi\cdot\frac{1}{5} = \frac{2\pi}{5} \approx 1{,}26$.`,
  (2 * Math.PI) / 5,
  () => duplaPolar((x, y) => Math.pow(x * x + y * y, 1.5), 0, 2 * Math.PI, 0, 1, 300)
);

q(
  C3, TD, "Área por integral dupla", "facil",
  R`A área da região limitada pelas parábolas $y = x^2$ e $y = 2 - x^2$, calculada como $\iint_D dA$, é:`,
  R`$\frac{8}{3}$`,
  [R`$\frac{4}{3}$`, R`$\frac{16}{3}$`, R`$\frac{8}{5}$`, R`$\frac{10}{3}$`],
  R`As curvas se cruzam quando $x^2 = 2 - x^2$, isto é $x = \pm 1$. Entre elas, $2 - x^2 \ge x^2$, de modo que $A = \int_{-1}^{1}\!\!\int_{x^2}^{2-x^2}dy\,dx = \int_{-1}^{1}\left(2-2x^2\right)dx = \left[2x - \frac{2x^3}{3}\right]_{-1}^{1} = \frac{8}{3} \approx 2{,}67$.`,
  8 / 3,
  () => dupla(() => 1, -1, 1, (x) => x * x, (x) => 2 - x * x, 300)
);

q(
  C3, TD, "Integral dupla imprópria", "dificil",
  R`O valor de $\displaystyle\iint_D \frac{dA}{\left(x^2+y^2\right)^2}$, em que $D$ é a região $x^2+y^2 \ge 1$, é:`,
  R`$\pi$`,
  [R`$2\pi$`, R`$3\pi$`, R`$4\pi$`, R`$\frac{\pi}{2}$`],
  R`Em polares, $\iint_D \frac{dA}{r^4} = \int_0^{2\pi}\!\!\int_1^{\infty} \frac{r}{r^4}dr\,d\theta = 2\pi\int_1^{\infty} r^{-3}dr$. A integral imprópria converge (expoente $-3 < -1$): $\int_1^{\infty}r^{-3}dr = \left[-\frac{1}{2r^2}\right]_1^{\infty} = \frac{1}{2}$. Logo o valor é $2\pi\cdot\frac12 = \pi \approx 3{,}14$.`,
  Math.PI,
  () => {
    // blocos diádicos [2^k, 2^{k+1}): Simpson uniforme não enxerga a cauda
    let s = 0;
    for (let k = 0; k < 45; k++) s += duplaPolar((x, y) => 1 / (x * x + y * y) ** 2, 0, 2 * Math.PI, 2 ** k, 2 ** (k + 1), 120);
    return s;
  }
);

// ===========================================================================
// Integrais triplas
// ===========================================================================

q(
  C3, TT, "Integral tripla sobre paralelepípedo", "facil",
  R`O valor de $\displaystyle\int_0^1\!\!\int_0^2\!\!\int_0^3 xyz\,dz\,dy\,dx$ é:`,
  R`$\frac{9}{2}$`,
  [R`$\frac{9}{4}$`, R`$\frac{27}{2}$`, R`$\frac{9}{8}$`, R`$\frac{15}{2}$`],
  R`Como o integrando é um produto de funções de uma variável cada e a região é um paralelepípedo, a integral se fatora: $\left(\int_0^1 x\,dx\right)\left(\int_0^2 y\,dy\right)\left(\int_0^3 z\,dz\right) = \frac{1}{2}\cdot 2\cdot\frac{9}{2} = \frac{9}{2} = 4{,}5$.`,
  4.5,
  () => tripla((x, y, z) => x * y * z, 0, 1, 0, 2, 0, 3, 40)
);

q(
  C3, TT, "Volume entre paraboloide e plano inclinado", "dificil",
  R`O volume do sólido limitado pelo paraboloide $z = x^2+y^2$ e pelo plano $z = 2y$ é:`,
  R`$\frac{\pi}{2}$`,
  [R`$\pi$`, R`$\frac{\pi}{4}$`, R`$\frac{3\pi}{8}$`, R`$\frac{2\pi}{3}$`],
  R`A projeção do sólido é $x^2+y^2 \le 2y$, isto é $x^2 + (y-1)^2 \le 1$, e o volume é $\iint_D (2y - x^2-y^2)\,dA$. Em polares essa região é $0 \le r \le 2\operatorname{sen}\theta$, $0 \le \theta \le \pi$, e $V = \int_0^{\pi}\!\!\int_0^{2\operatorname{sen}\theta}\left(2r\operatorname{sen}\theta - r^2\right)r\,dr\,d\theta = \int_0^{\pi}\frac{4}{3}\operatorname{sen}^4\theta\,d\theta$. Como $\int_0^\pi \operatorname{sen}^4\theta\,d\theta = \frac{3\pi}{8}$, resulta $V = \frac{4}{3}\cdot\frac{3\pi}{8} = \frac{\pi}{2} \approx 1{,}57$.`,
  Math.PI / 2,
  () => duplaPolar((x, y) => 2 * y - x * x - y * y, 0, Math.PI, 0, (t) => 2 * Math.sin(t), 400)
);

q(
  C3, TT, "Massa em coordenadas cilíndricas", "medio",
  R`Um cilindro sólido de raio $2$ e altura $5$, com eixo no eixo $z$ e base em $z = 0$, tem densidade igual à distância ao eixo. Sua massa é:`,
  R`$\frac{80\pi}{3}$`,
  [R`$\frac{40\pi}{3}$`, R`$\frac{160\pi}{3}$`, R`$\frac{80\pi}{9}$`, R`$20\pi$`],
  R`Com $\delta = \sqrt{x^2+y^2} = r$ e $dV = r\,dz\,dr\,d\theta$, a massa é $m = \int_0^{2\pi}\!\!\int_0^2\!\!\int_0^5 r\cdot r\,dz\,dr\,d\theta = 2\pi\cdot 5\cdot\int_0^2 r^2dr = 10\pi\cdot\frac{8}{3} = \frac{80\pi}{3} \approx 83{,}8$.`,
  (80 * Math.PI) / 3,
  () => triplaCilindrica((x, y) => Math.hypot(x, y), 0, 2 * Math.PI, 0, 2, 0, 5, 60)
);

q(
  C3, TT, "Coordenadas esféricas com cone", "dificil",
  R`Seja $E$ o sólido interior à esfera $\rho = 2$ e acima do cone $\varphi = \dfrac{\pi}{3}$. O valor de $\displaystyle\iiint_E z\,dV$ é:`,
  R`$3\pi$`,
  [R`$6\pi$`, R`$\frac{3\pi}{2}$`, R`$4\pi$`, R`$2\pi$`],
  R`Em esféricas, $z = \rho\cos\varphi$ e $dV = \rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$, logo $\iiint_E z\,dV = \int_0^{2\pi}\!\!\int_0^{\pi/3}\!\!\int_0^{2}\rho^3\cos\varphi\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$. A integral em $\rho$ dá $4$; a em $\varphi$, $\left[\frac{\operatorname{sen}^2\varphi}{2}\right]_0^{\pi/3} = \frac{3}{8}$; e a em $\theta$, $2\pi$. Produto: $2\pi\cdot 4\cdot\frac{3}{8} = 3\pi \approx 9{,}42$.`,
  3 * Math.PI,
  () => triplaEsferica((x, y, z) => z, 0, 2 * Math.PI, 0, Math.PI / 3, 0, 2, 60)
);

q(
  C3, TT, "Volume comum a esfera e cilindro", "dificil",
  R`O volume do sólido interior simultaneamente à esfera $x^2+y^2+z^2 = 4$ e ao cilindro $x^2+y^2 = 1$ é:`,
  R`$\frac{4\pi}{3}(8-3\sqrt{3})$`,
  [R`$\frac{4\pi}{3}(8-3\sqrt{2})$`, R`$\frac{2\pi}{3}(8-3\sqrt{3})$`, R`$\frac{4\pi}{3}(4-3\sqrt{3})$`, R`$\frac{8\pi}{3}(8-3\sqrt{3})$`],
  R`Em cilíndricas o sólido é $0 \le r \le 1$, $-\sqrt{4-r^2} \le z \le \sqrt{4-r^2}$, logo $V = \int_0^{2\pi}\!\!\int_0^1 2\sqrt{4-r^2}\,r\,dr\,d\theta = 4\pi\int_0^1 r\sqrt{4-r^2}\,dr$. Com $u = 4-r^2$: $4\pi\left[-\frac{(4-r^2)^{3/2}}{3}\right]_0^1 = \frac{4\pi}{3}\left(8 - 3\sqrt{3}\right) \approx 11{,}7$.`,
  ((4 * Math.PI) / 3) * (8 - 3 * Math.sqrt(3)),
  () => triplaCilindrica(() => 1, 0, 2 * Math.PI, 0, 1, (r) => -Math.sqrt(4 - r * r), (r) => Math.sqrt(4 - r * r), 60)
);

q(
  C3, TT, "Centroide de hemisfério sólido", "medio",
  R`A cota $\bar{z}$ do centroide do hemisfério sólido homogêneo $x^2+y^2+z^2 \le 9$, $z \ge 0$, é:`,
  R`$\frac{9}{8}$`,
  [R`$\frac{3}{8}$`, R`$\frac{9}{16}$`, R`$\frac{3}{2}$`, R`$\frac{27}{8}$`],
  R`O volume é $V = \frac{2}{3}\pi\cdot 27 = 18\pi$. Em esféricas, $\iiint z\,dV = \int_0^{2\pi}\!\!\int_0^{\pi/2}\!\!\int_0^3 \rho^3\cos\varphi\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta = 2\pi\cdot\frac{81}{4}\cdot\frac12 = \frac{81\pi}{4}$. Logo $\bar z = \frac{81\pi/4}{18\pi} = \frac{9}{8} = 1{,}125$ — coerente com a fórmula $\bar z = \frac{3a}{8}$ para $a = 3$.`,
  9 / 8,
  () =>
    triplaEsferica((x, y, z) => z, 0, 2 * Math.PI, 0, Math.PI / 2, 0, 3, 60) /
    triplaEsferica(() => 1, 0, 2 * Math.PI, 0, Math.PI / 2, 0, 3, 60)
);

q(
  C3, TT, "Integral tripla sobre tetraedro", "medio",
  R`Seja $T$ o tetraedro de vértices $(0,0,0)$, $(1,0,0)$, $(0,2,0)$ e $(0,0,3)$. O valor de $\displaystyle\iiint_T x\,dV$ é:`,
  R`$\frac{1}{4}$`,
  [R`$\frac{1}{2}$`, R`$\frac{1}{8}$`, R`$\frac{1}{3}$`, R`$\frac{1}{6}$`],
  R`O plano que contém os três vértices não nulos é $\frac{x}{1} + \frac{y}{2} + \frac{z}{3} = 1$. Então $\iiint_T x\,dV = \int_0^1\!\!\int_0^{2(1-x)}\!\!\int_0^{3\left(1-x-\frac{y}{2}\right)} x\,dz\,dy\,dx$. Integrando em $z$ e depois em $y$: $\int_0^1 3x\left[(1-x)y - \frac{y^2}{4}\right]_0^{2(1-x)}dx = \int_0^1 3x(1-x)^2dx = 3\left(\frac12 - \frac23 + \frac14\right) = \frac{1}{4}$.`,
  0.25,
  () => tripla((x, y, z) => x, 0, 1, 0, (x) => 2 * (1 - x), 0, (x, y) => 3 * (1 - x - y / 2), 40)
);

q(
  C3, TT, "Momento de inércia de cilindro", "medio",
  R`O momento de inércia em relação ao eixo $z$, $I_z = \iiint (x^2+y^2)\,dV$, do cilindro sólido homogêneo de raio $2$ e altura $3$ com eixo em $Oz$ e densidade $1$ é:`,
  R`$24\pi$`,
  [R`$12\pi$`, R`$48\pi$`, R`$16\pi$`, R`$32\pi$`],
  R`Em cilíndricas, $x^2+y^2 = r^2$ e $dV = r\,dz\,dr\,d\theta$, logo $I_z = \int_0^{2\pi}\!\!\int_0^2\!\!\int_0^3 r^3\,dz\,dr\,d\theta = 2\pi\cdot 3\cdot\left[\frac{r^4}{4}\right]_0^2 = 6\pi\cdot 4 = 24\pi \approx 75{,}4$. (Como $M = 12\pi$, isso confirma $I_z = \frac{Ma^2}{2}$.)`,
  24 * Math.PI,
  () => triplaCilindrica((x, y) => x * x + y * y, 0, 2 * Math.PI, 0, 2, 0, 3, 60)
);

q(
  C3, TT, "Esféricas com integrando exponencial", "dificil",
  R`O valor de $\displaystyle\iiint_B e^{\left(x^2+y^2+z^2\right)^{3/2}}dV$, em que $B$ é a bola $x^2+y^2+z^2\le 1$, é:`,
  R`$\frac{4\pi}{3}(e-1)$`,
  [R`$\frac{4\pi}{3}(e+1)$`, R`$\frac{2\pi}{3}(e-1)$`, R`$\frac{4\pi}{3}e$`, R`$4\pi(e-1)$`],
  R`Em esféricas o expoente vira $\rho^3$ e a integral se separa: $\int_0^{2\pi}\!\!\int_0^{\pi}\!\!\int_0^1 e^{\rho^3}\rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta = 2\pi\cdot 2\cdot\int_0^1 \rho^2e^{\rho^3}d\rho$. Com $u = \rho^3$, $\int_0^1 \rho^2e^{\rho^3}d\rho = \frac{e-1}{3}$. Logo o valor é $4\pi\cdot\frac{e-1}{3} = \frac{4\pi}{3}(e-1) \approx 7{,}19$.`,
  ((4 * Math.PI) / 3) * (Math.E - 1),
  () => triplaEsferica((x, y, z) => Math.exp(Math.pow(x * x + y * y + z * z, 1.5)), 0, 2 * Math.PI, 0, Math.PI, 0, 1, 60)
);

q(
  C3, TT, "Volume entre cone e plano", "medio",
  R`O volume do sólido limitado pelo cone $z = \sqrt{x^2+y^2}$ e pelo plano $z = 2$ é:`,
  R`$\frac{8\pi}{3}$`,
  [R`$\frac{4\pi}{3}$`, R`$\frac{16\pi}{3}$`, R`$\frac{8\pi}{9}$`, R`$4\pi$`],
  R`A interseção do cone com $z = 2$ é o círculo $r = 2$, logo a projeção é o disco de raio $2$ e o sólido vai de $z = r$ até $z = 2$. Em cilíndricas, $V = \int_0^{2\pi}\!\!\int_0^2 (2-r)\,r\,dr\,d\theta = 2\pi\left[r^2 - \frac{r^3}{3}\right]_0^2 = 2\pi\left(4 - \frac83\right) = \frac{8\pi}{3} \approx 8{,}38$ — um terço do cilindro circunscrito, como esperado para um cone.`,
  (8 * Math.PI) / 3,
  () => triplaCilindrica(() => 1, 0, 2 * Math.PI, 0, 2, (r) => r, 2, 60)
);

q(
  C3, TT, "Massa com densidade radial", "medio",
  R`Uma bola de raio $2$ centrada na origem tem densidade $\delta = \dfrac{1}{\sqrt{x^2+y^2+z^2}}$. Sua massa é:`,
  R`$8\pi$`,
  [R`$4\pi$`, R`$16\pi$`, R`$\frac{8\pi}{3}$`, R`$2\pi$`],
  R`Em esféricas, $\delta = \frac{1}{\rho}$ e $dV = \rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$, de modo que o integrando vira $\rho\operatorname{sen}\varphi$ — a singularidade na origem é integrável. Então $m = \int_0^{2\pi}\!\!\int_0^{\pi}\!\!\int_0^2\rho\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta = 2\pi\cdot 2\cdot\frac{4}{2} = 8\pi \approx 25{,}1$.`,
  8 * Math.PI,
  () =>
    triplaEsferica(
      (x, y, z) => {
        const r = Math.hypot(x, y, z);
        return r === 0 ? 0 : 1 / r;
      },
      0, 2 * Math.PI, 0, Math.PI, 0, 2, 60
    )
);

q(
  C3, TT, "Volume de elipsoide por mudança de variáveis", "facil",
  R`O volume do sólido $\dfrac{x^2}{4} + \dfrac{y^2}{9} + \dfrac{z^2}{25} \le 1$ é:`,
  R`$40\pi$`,
  [R`$120\pi$`, R`$\frac{40\pi}{3}$`, R`$20\pi$`, R`$60\pi$`],
  R`A mudança $x = 2u$, $y = 3v$, $z = 5w$ tem jacobiano constante $\frac{\partial(x,y,z)}{\partial(u,v,w)} = 2\cdot 3\cdot 5 = 30$ e leva o elipsoide na bola unitária $u^2+v^2+w^2 \le 1$. Logo $V = 30\cdot\frac{4\pi}{3} = 40\pi \approx 125{,}7$ — a fórmula $\frac{4}{3}\pi abc$.`,
  40 * Math.PI,
  () => {
    // esféricas na bola unitária compostas com o escalonamento; jacobiano numérico
    const T = (u, v, w) => [2 * u, 3 * v, 5 * w];
    return triplaEsferica((u, v, w) => Math.abs(jacobiano(T, [u, v, w])), 0, 2 * Math.PI, 0, Math.PI, 0, 1, 60);
  }
);

// ===========================================================================
// Integral de linha
// ===========================================================================

q(
  C3, TL, "Integral de linha de campo escalar sobre arco de círculo", "medio",
  R`Seja $C$ o arco de $x^2+y^2 = 4$ do ponto $(2,0)$ ao ponto $(0,2)$, no primeiro quadrante. O valor de $\displaystyle\int_C \left(x + y^2\right)ds$ é:`,
  R`$4+2\pi$`,
  [R`$2+2\pi$`, R`$4+\pi$`, R`$4+4\pi$`, R`$8+2\pi$`],
  R`Parametrize por $\mathbf{r}(t) = (2\cos t,\, 2\operatorname{sen}t)$, $0 \le t \le \frac{\pi}{2}$, com $ds = |\mathbf{r}'|dt = 2\,dt$. Então $\int_C (x+y^2)ds = \int_0^{\pi/2}\left(2\cos t + 4\operatorname{sen}^2t\right)2\,dt = 4\left[\operatorname{sen}t\right]_0^{\pi/2} + 8\cdot\frac{\pi}{4} = 4 + 2\pi \approx 10{,}3$.`,
  4 + 2 * Math.PI,
  () => linhaEscalar((x, y) => x + y * y, (t) => [2 * Math.cos(t), 2 * Math.sin(t)], 0, Math.PI / 2)
);

q(
  C3, TL, "Trabalho de campo não conservativo", "medio",
  R`O trabalho realizado pelo campo $\mathbf{F}(x,y) = \left(y^2,\, x^2\right)$ ao longo do arco de $y = x^2$ de $(0,0)$ a $(1,1)$ é:`,
  R`$\frac{7}{10}$`,
  [R`$\frac{3}{10}$`, R`$\frac{9}{10}$`, R`$\frac{7}{5}$`, R`$\frac{1}{2}$`],
  R`Com $x = t$ e $y = t^2$, $0\le t\le 1$, tem-se $dx = dt$ e $dy = 2t\,dt$. Então $W = \int_C y^2dx + x^2dy = \int_0^1\left(t^4 + t^2\cdot 2t\right)dt = \frac{1}{5} + \frac{1}{2} = \frac{7}{10} = 0{,}7$. (O campo não é conservativo: $\frac{\partial}{\partial y}y^2 = 2y \ne 2x = \frac{\partial}{\partial x}x^2$, logo o valor depende do caminho.)`,
  0.7,
  () => linhaVetorial((x, y) => [y * y, x * x], (t) => [t, t * t], 0, 1)
);

q(
  C3, TL, "Campo conservativo no espaço", "medio",
  R`O campo $\mathbf{F}(x,y,z) = \left(2xy,\; x^2+z^2,\; 2yz\right)$ é conservativo. O trabalho realizado por ele ao longo de qualquer curva de $(0,0,0)$ a $(1,2,3)$ é:`,
  R`$20$`,
  [R`$18$`, R`$22$`, R`$11$`, R`$38$`],
  R`Procura-se $f$ com $\nabla f = \mathbf{F}$. De $f_x = 2xy$ vem $f = x^2y + g(y,z)$; então $f_y = x^2 + g_y = x^2+z^2$ dá $g_y = z^2$, isto é $g = yz^2 + h(z)$; por fim $f_z = 2yz + h'(z) = 2yz$ dá $h$ constante. Logo $f = x^2y + yz^2$ e, pelo teorema fundamental das integrais de linha, $W = f(1,2,3) - f(0,0,0) = 2 + 18 = 20$.`,
  20,
  () => linhaVetorial((x, y, z) => [2 * x * y, x * x + z * z, 2 * y * z], (t) => [t, 2 * t * t, 3 * Math.sin((Math.PI * t) / 2)], 0, 1)
);

q(
  C3, TL, "Teorema de Green sobre um círculo", "medio",
  R`Seja $C$ o círculo $x^2+y^2 = 4$ percorrido no sentido anti-horário. O valor de $\displaystyle\oint_C y^3\,dx - x^3\,dy$ é:`,
  R`$-24\pi$`,
  [R`$-12\pi$`, R`$24\pi$`, R`$-48\pi$`, R`$-8\pi$`],
  R`Pelo teorema de Green, com $P = y^3$ e $Q = -x^3$: $\oint_C P\,dx + Q\,dy = \iint_D\left(Q_x - P_y\right)dA = \iint_D\left(-3x^2-3y^2\right)dA$. Em polares, $\iint_D\left(x^2+y^2\right)dA = \int_0^{2\pi}\!\!\int_0^2 r^3dr\,d\theta = 8\pi$, logo a integral vale $-3\cdot 8\pi = -24\pi \approx -75{,}4$.`,
  -24 * Math.PI,
  () =>
    linhaVetorial((x, y) => [y * y * y, -x * x * x], (t) => [2 * Math.cos(t), 2 * Math.sin(t)], 0, 2 * Math.PI)
);

q(
  C3, TL, "Teorema de Green sobre região triangular", "dificil",
  R`Seja $C$ a fronteira do triângulo de vértices $(0,0)$, $(1,0)$ e $(1,1)$, percorrida no sentido anti-horário. O valor de $\displaystyle\oint_C \left(e^{x}+y^2\right)dx + \left(x^2+\operatorname{sen}y\right)dy$ é:`,
  R`$\frac{1}{3}$`,
  [R`$\frac{1}{6}$`, R`$\frac{2}{3}$`, R`$\frac{1}{2}$`, R`$\frac{1}{4}$`],
  R`Green transforma a integral em $\iint_D (Q_x - P_y)\,dA = \iint_D (2x - 2y)\,dA$ — os termos $e^x$ e $\operatorname{sen}y$, que tornariam o cálculo direto trabalhoso, desaparecem na derivação. Com $D = \{0\le x\le 1,\ 0\le y\le x\}$: $\int_0^1\!\!\int_0^x (2x-2y)\,dy\,dx = \int_0^1\left(2x^2 - x^2\right)dx = \frac{1}{3} \approx 0{,}33$.`,
  1 / 3,
  () => {
    const F = (x, y) => [Math.exp(x) + y * y, x * x + Math.sin(y)];
    return (
      linhaVetorial(F, (t) => [t, 0], 0, 1) +
      linhaVetorial(F, (t) => [1, t], 0, 1) +
      linhaVetorial(F, (t) => [1 - t, 1 - t], 0, 1)
    );
  }
);

q(
  C3, TL, "Massa de arame helicoidal", "dificil",
  R`Um arame tem a forma da hélice $\mathbf{r}(t) = \left(\cos t,\, \operatorname{sen}t,\, t\right)$, $0 \le t \le 2\pi$, e densidade $\delta(x,y,z) = x^2+y^2+z^2$. Sua massa é:`,
  R`$\sqrt{2}\left(2\pi+\frac{8\pi^3}{3}\right)$`,
  [R`$\sqrt{2}\left(2\pi+\frac{4\pi^3}{3}\right)$`, R`$\sqrt{2}\left(\pi+\frac{8\pi^3}{3}\right)$`, R`$\sqrt{3}\left(2\pi+\frac{8\pi^3}{3}\right)$`, R`$\sqrt{2}\left(2\pi+\frac{8\pi^3}{9}\right)$`],
  R`Sobre a hélice, $x^2+y^2 = 1$, logo $\delta = 1 + t^2$. Além disso $\mathbf{r}' = (-\operatorname{sen}t,\, \cos t,\, 1)$ e $ds = \sqrt{2}\,dt$. Assim $m = \int_0^{2\pi}\left(1+t^2\right)\sqrt{2}\,dt = \sqrt{2}\left(2\pi + \frac{(2\pi)^3}{3}\right) = \sqrt{2}\left(2\pi + \frac{8\pi^3}{3}\right) \approx 125{,}8$.`,
  Math.SQRT2 * (2 * Math.PI + (8 * Math.PI ** 3) / 3),
  () => linhaEscalar((x, y, z) => x * x + y * y + z * z, (t) => [Math.cos(t), Math.sin(t), t], 0, 2 * Math.PI)
);

q(
  C3, TL, "Área por integral de linha", "dificil",
  R`A área da região limitada pela astroide $x = \cos^3 t$, $y = \operatorname{sen}^3 t$, $0 \le t \le 2\pi$, calculada por $A = \frac{1}{2}\oint_C x\,dy - y\,dx$, é:`,
  R`$\frac{3\pi}{8}$`,
  [R`$\frac{3\pi}{4}$`, R`$\frac{\pi}{8}$`, R`$\frac{3\pi}{16}$`, R`$\frac{5\pi}{8}$`],
  R`Com $dx = -3\cos^2t\operatorname{sen}t\,dt$ e $dy = 3\operatorname{sen}^2t\cos t\,dt$, o integrando fica $x\,dy - y\,dx = 3\cos^2t\operatorname{sen}^2t\left(\cos^2t + \operatorname{sen}^2t\right)dt = 3\cos^2t\operatorname{sen}^2t\,dt = \frac{3}{4}\operatorname{sen}^2 2t\,dt$. Logo $A = \frac{1}{2}\int_0^{2\pi}\frac{3}{4}\operatorname{sen}^22t\,dt = \frac{3}{8}\cdot\pi = \frac{3\pi}{8} \approx 1{,}18$.`,
  (3 * Math.PI) / 8,
  () =>
    linhaVetorial(
      (x, y) => [-y / 2, x / 2],
      (t) => [Math.cos(t) ** 3, Math.sin(t) ** 3],
      0,
      2 * Math.PI
    )
);

q(
  C3, TL, "Independência do caminho", "medio",
  R`O campo $\mathbf{F}(x,y) = \left(3 + 2xy,\; x^2 - 3y^2\right)$ é conservativo. O trabalho realizado por ele de $(-1,2)$ até $(1,3)$ é:`,
  R`$-12$`,
  [R`$-30$`, R`$12$`, R`$-21$`, R`$-9$`],
  R`Como $P_y = 2x = Q_x$ em todo o plano, o campo é conservativo. De $f_x = 3 + 2xy$ vem $f = 3x + x^2y + g(y)$, e $f_y = x^2 + g'(y) = x^2 - 3y^2$ dá $g = -y^3$. Assim $f(x,y) = 3x + x^2y - y^3$, e $W = f(1,3) - f(-1,2) = (3 + 3 - 27) - (-3 + 2 - 8) = -21 + 9 = -12$.`,
  -12,
  () => linhaVetorial((x, y) => [3 + 2 * x * y, x * x - 3 * y * y], (t) => [-1 + 2 * t, 2 + t + t * t * (1 - t)], 0, 1)
);

q(
  C3, TL, "Campo singular na origem", "dificil",
  R`Seja $C$ uma curva fechada simples, percorrida no sentido anti-horário, que envolve a origem. O valor de $\displaystyle\oint_C \frac{-y\,dx + x\,dy}{x^2+y^2}$ é:`,
  R`$2\pi$`,
  [R`$0$`, R`$4\pi$`, R`$\pi$`, R`$-2\pi$`],
  R`Aqui $P_y = Q_x = \frac{y^2-x^2}{(x^2+y^2)^2}$ em todo ponto diferente da origem, mas o campo não está definido em $(0,0)$, de modo que Green não se aplica diretamente à região interna. Recorta-se um pequeno círculo $C_\varepsilon$ de raio $\varepsilon$ em torno da origem: na região entre as curvas Green vale e dá zero, logo $\oint_C = \oint_{C_\varepsilon}$. Sobre $C_\varepsilon$, com $x = \varepsilon\cos t$ e $y = \varepsilon\operatorname{sen}t$, o integrando vale $dt$, e a integral é $2\pi$ — independentemente de $\varepsilon$ e do formato de $C$.`,
  2 * Math.PI,
  () =>
    linhaVetorial(
      (x, y) => [-y / (x * x + y * y), x / (x * x + y * y)],
      (t) => [2 * Math.cos(t), 3 * Math.sin(t)],
      0,
      2 * Math.PI
    )
);

q(
  C3, TL, "Integral de linha sobre segmento", "facil",
  R`O valor de $\displaystyle\int_C xy\,ds$, em que $C$ é o segmento de reta de $(1,2)$ a $(4,6)$, é:`,
  R`$55$`,
  [R`$45$`, R`$60$`, R`$50$`, R`$66$`],
  R`Parametrize por $\mathbf{r}(t) = (1+3t,\; 2+4t)$, $0\le t\le 1$, de modo que $|\mathbf{r}'| = \sqrt{9+16} = 5$ e $ds = 5\,dt$. Então $\int_C xy\,ds = 5\int_0^1 (1+3t)(2+4t)\,dt = 5\int_0^1\left(2 + 10t + 12t^2\right)dt = 5\left(2 + 5 + 4\right) = 55$.`,
  55,
  () => linhaEscalar((x, y) => x * y, (t) => [1 + 3 * t, 2 + 4 * t], 0, 1)
);

q(
  C3, TL, "Green com orientação horária", "dificil",
  R`Seja $C$ a fronteira do triângulo de vértices $(0,0)$, $(2,0)$ e $(2,2)$, percorrida no sentido horário. O valor de $\displaystyle\oint_C y^2\,dx + 3xy\,dy$ é:`,
  R`$-\frac{4}{3}$`,
  [R`$\frac{4}{3}$`, R`$-\frac{8}{3}$`, R`$-\frac{2}{3}$`, R`$-4$`],
  R`O teorema de Green pressupõe orientação anti-horária; percorrendo no sentido horário, o resultado troca de sinal. No sentido positivo, $\iint_D (Q_x - P_y)\,dA = \iint_D (3y - 2y)\,dA = \iint_D y\,dA$, e com $D = \{0\le x\le 2,\ 0\le y\le x\}$: $\int_0^2\frac{x^2}{2}dx = \frac{4}{3}$. Como a orientação é horária, a resposta é $-\frac{4}{3} \approx -1{,}33$.`,
  -4 / 3,
  () => {
    // percurso horário: (0,0) -> (2,2) -> (2,0) -> (0,0), lado a lado
    const F = (x, y) => [y * y, 3 * x * y];
    return (
      linhaVetorial(F, (t) => [t, t], 0, 2) +
      linhaVetorial(F, (t) => [2, 2 - t], 0, 2) +
      linhaVetorial(F, (t) => [2 - t, 0], 0, 2)
    );
  }
);

q(
  C3, TL, "Função potencial com funções trigonométricas", "medio",
  R`O campo $\mathbf{F}(x,y) = \left(2x\cos y,\; -x^2\operatorname{sen}y\right)$ é conservativo. O trabalho realizado por ele de $(1,0)$ a $\left(2,\tfrac{\pi}{3}\right)$ é:`,
  R`$1$`,
  [R`$3$`, R`$-1$`, R`$2$`, R`$5$`],
  R`Verifica-se $P_y = -2x\operatorname{sen}y = Q_x$. De $f_x = 2x\cos y$ vem $f = x^2\cos y + g(y)$, e $f_y = -x^2\operatorname{sen}y + g'(y)$ coincide com $Q$ para $g$ constante. Logo $f = x^2\cos y$ e $W = f\left(2,\frac{\pi}{3}\right) - f(1,0) = 4\cdot\frac{1}{2} - 1 = 1$.`,
  1,
  () => linhaVetorial((x, y) => [2 * x * Math.cos(y), -x * x * Math.sin(y)], (t) => [1 + t, (Math.PI / 3) * t * t], 0, 1)
);

finalizar("calculo3_lote2.json", 20260917);
