// Cálculo II — lote 5: curvas, superfícies, funções de várias variáveis e
// otimização (40 questões). Estilo Guidorizzi (vols. 2 e 3).
//
// Cada resposta é conferida por um caminho numérico independente da álgebra da
// resolução: curvatura/torção por diferença central sobre a parametrização,
// distâncias por minimização numérica sobre o objeto geométrico (e não pela
// fórmula fechada), derivada implícita resolvendo F(x,y,z)=k em z por bisseção,
// e todo problema de máximo/mínimo por varredura+refino sobre a restrição
// parametrizada — inclusive os de multiplicadores de Lagrange.
import {
  q, finalizar, R,
  simpson, bissecao, dvec, d2vec, cross, cross2, norma, dot, sub,
  curvatura, torcao, parcial, parcial2, gradiente, otimizar, dupla, linhaVetorial, superficieEscalar,
} from "./calculo23_kit.mjs";

const C2 = "Cálculo II";
const TC = "Funções Vetoriais e Curvas";
const TS = "Superfícies";
const TF = "Funções de Duas e Três Variáveis";
const TM = "Máximos e Mínimos";

// ===========================================================================
// Funções vetoriais e curvas
// ===========================================================================

q(
  C2, TC, "Curvatura de gráfico de função", "medio",
  R`A curvatura da parábola $y = x^2$ no ponto $(1, 1)$ vale:`,
  R`$\frac{2\sqrt{5}}{25}$`,
  [R`$\frac{\sqrt{5}}{25}$`, R`$\frac{2\sqrt{5}}{5}$`, R`$\frac{4\sqrt{5}}{25}$`, R`$\frac{3\sqrt{5}}{25}$`],
  R`Para $y = f(x)$ vale $\kappa = \dfrac{|f''|}{\left(1 + (f')^2\right)^{3/2}}$. Aqui $f' = 2x$ e $f'' = 2$, de modo que em $x = 1$: $\kappa = \frac{2}{(1+4)^{3/2}} = \frac{2}{5\sqrt{5}}$. Racionalizando, $\kappa = \frac{2\sqrt{5}}{25} \approx 0{,}179$.`,
  2 / Math.pow(5, 1.5),
  () => curvatura((t) => [t, t * t], 1)
);

q(
  C2, TC, "Curvatura de curva no espaço", "dificil",
  R`Seja $\mathbf{r}(t) = (t,\, t^2,\, t^3)$. A curvatura da curva no ponto correspondente a $t = 1$ é:`,
  R`$\frac{\sqrt{266}}{98}$`,
  [R`$\frac{\sqrt{266}}{49}$`, R`$\frac{\sqrt{19}}{98}$`, R`$\frac{\sqrt{266}}{196}$`, R`$\frac{2\sqrt{19}}{49}$`],
  R`Use $\kappa = \dfrac{|\mathbf{r}' \times \mathbf{r}''|}{|\mathbf{r}'|^3}$. Em $t = 1$: $\mathbf{r}' = (1,2,3)$ e $\mathbf{r}'' = (0,2,6)$, logo $\mathbf{r}' \times \mathbf{r}'' = (12-6,\; -6,\; 2) = (6,-6,2)$, cuja norma é $\sqrt{76} = 2\sqrt{19}$. Como $|\mathbf{r}'| = \sqrt{14}$, resulta $\kappa = \frac{2\sqrt{19}}{14\sqrt{14}} = \frac{\sqrt{19}}{7\sqrt{14}} = \frac{\sqrt{266}}{98} \approx 0{,}166$.`,
  Math.sqrt(266) / 98,
  () => curvatura((t) => [t, t * t, t * t * t], 1)
);

q(
  C2, TC, "Componente normal da aceleração", "medio",
  R`Uma partícula descreve a curva $\mathbf{r}(t) = (t^2,\, t^3)$. A componente normal da aceleração em $t = 1$ vale:`,
  R`$\frac{6\sqrt{13}}{13}$`,
  [R`$\frac{3\sqrt{13}}{13}$`, R`$\frac{12\sqrt{13}}{13}$`, R`$\frac{6\sqrt{13}}{39}$`, R`$\frac{5\sqrt{13}}{13}$`],
  R`A decomposição da aceleração dá $a_N = \dfrac{|\mathbf{r}' \times \mathbf{r}''|}{|\mathbf{r}'|}$. Em $t = 1$: $\mathbf{r}' = (2,3)$ e $\mathbf{r}'' = (2,6)$; o produto vetorial (componente $z$) vale $2\cdot 6 - 3\cdot 2 = 6$, e $|\mathbf{r}'| = \sqrt{13}$. Logo $a_N = \frac{6}{\sqrt{13}} = \frac{6\sqrt{13}}{13} \approx 1{,}66$.`,
  6 / Math.sqrt(13),
  () => {
    const r = (t) => [t * t, t * t * t];
    const v = dvec(r, 1, 1e-4);
    const a = d2vec(r, 1, 1e-3);
    return Math.abs(cross2(v, a)) / norma(v);
  }
);

q(
  C2, TC, "Torção de curva no espaço", "dificil",
  R`Para a curva $\mathbf{r}(t) = \left(t,\, \tfrac{t^2}{2},\, \tfrac{t^3}{3}\right)$, a torção em $t = 1$ é:`,
  R`$\frac{1}{3}$`,
  [R`$\frac{1}{6}$`, R`$\frac{2}{3}$`, R`$\frac{1}{2}$`, R`$\frac{1}{9}$`],
  R`A torção é $\tau = \dfrac{(\mathbf{r}' \times \mathbf{r}'')\cdot\mathbf{r}'''}{|\mathbf{r}' \times \mathbf{r}''|^2}$. Aqui $\mathbf{r}' = (1,t,t^2)$, $\mathbf{r}'' = (0,1,2t)$ e $\mathbf{r}''' = (0,0,2)$. O produto vetorial é $\mathbf{r}' \times \mathbf{r}'' = (t^2,\, -2t,\, 1)$, cujo produto escalar com $\mathbf{r}'''$ vale $2$, e cuja norma ao quadrado é $t^4 + 4t^2 + 1$. Em $t = 1$: $\tau = \frac{2}{6} = \frac{1}{3}$.`,
  1 / 3,
  () => torcao((t) => [t, (t * t) / 2, (t * t * t) / 3], 1),
  { tol: 1e-3 }
);

q(
  C2, TC, "Raio do círculo osculador", "medio",
  R`O raio do círculo osculador da curva $y = \ln x$ no ponto $(1, 0)$ é:`,
  R`$2\sqrt{2}$`,
  [R`$\sqrt{2}$`, R`$4\sqrt{2}$`, R`$2\sqrt{3}$`, R`$\frac{\sqrt{2}}{2}$`],
  R`O raio de curvatura é $\rho = \frac{1}{\kappa}$, com $\kappa = \frac{|y''|}{\left(1+(y')^2\right)^{3/2}}$. Como $y' = \frac{1}{x}$ e $y'' = -\frac{1}{x^2}$, em $x = 1$ tem-se $y' = 1$ e $|y''| = 1$, logo $\kappa = \frac{1}{2^{3/2}} = \frac{1}{2\sqrt{2}}$ e $\rho = 2\sqrt{2} \approx 2{,}83$.`,
  2 * Math.SQRT2,
  () => 1 / curvatura((t) => [t, Math.log(t)], 1)
);

q(
  C2, TC, "Comprimento de arco de hélice cônica", "facil",
  R`O comprimento do arco da curva $\mathbf{r}(t) = \left(e^{t}\cos t,\; e^{t}\operatorname{sen}t,\; e^{t}\right)$ para $0 \le t \le \ln 2$ é:`,
  R`$\sqrt{3}$`,
  [R`$2\sqrt{3}$`, R`$\sqrt{6}$`, R`$3\sqrt{2}$`, R`$\frac{\sqrt{3}}{2}$`],
  R`Derivando, $\mathbf{r}'(t) = \left(e^t(\cos t - \operatorname{sen}t),\; e^t(\operatorname{sen}t + \cos t),\; e^t\right)$. Somando os quadrados e usando $(\cos t - \operatorname{sen}t)^2 + (\operatorname{sen}t+\cos t)^2 = 2$, obtém-se $|\mathbf{r}'| = e^t\sqrt{3}$. Assim $L = \int_0^{\ln 2} \sqrt{3}\,e^t\,dt = \sqrt{3}\left(e^{\ln 2} - 1\right) = \sqrt{3}$.`,
  Math.sqrt(3),
  () => simpson((t) => norma(dvec((s) => [Math.exp(s) * Math.cos(s), Math.exp(s) * Math.sin(s), Math.exp(s)], t)), 0, Math.log(2), 4000)
);

q(
  C2, TC, "Reparametrização pelo comprimento de arco", "dificil",
  R`Considere $\mathbf{r}(t) = \left(2t,\, t^2,\, \tfrac{t^3}{3}\right)$, $t \ge 0$. A distância da origem ao ponto da curva situado a $15$ unidades de comprimento de arco do ponto $\mathbf{r}(0)$ é:`,
  R`$3\sqrt{22}$`,
  [R`$3\sqrt{11}$`, R`$2\sqrt{22}$`, R`$3\sqrt{33}$`, R`$9\sqrt{2}$`],
  R`Tem-se $\mathbf{r}'(t) = (2,\, 2t,\, t^2)$, e $|\mathbf{r}'|^2 = 4 + 4t^2 + t^4 = (t^2+2)^2$, de modo que $|\mathbf{r}'| = t^2 + 2$ — o integrando é um quadrado perfeito. Então $s(t) = \int_0^t (u^2+2)\,du = \frac{t^3}{3} + 2t$. Resolvendo $\frac{t^3}{3} + 2t = 15$, isto é $t^3 + 6t = 45$, vem $t = 3$. O ponto é $\mathbf{r}(3) = (6, 9, 9)$, cuja distância à origem é $\sqrt{36+81+81} = \sqrt{198} = 3\sqrt{22} \approx 14{,}07$.`,
  3 * Math.sqrt(22),
  () => {
    const r = (t) => [2 * t, t * t, (t * t * t) / 3];
    const s = (t) => simpson((u) => norma(dvec(r, u)), 0, t, 2000);
    const t = bissecao((x) => s(x) - 15, 0.1, 6);
    return norma(r(t));
  }
);

q(
  C2, TC, "Movimento a partir da aceleração", "medio",
  R`Uma partícula tem aceleração $\mathbf{a}(t) = (6t,\, 0,\, -2)$, com $\mathbf{v}(0) = (0,1,2)$ e $\mathbf{r}(0) = (1,0,0)$. A rapidez da partícula em $t = 1$ é:`,
  R`$\sqrt{10}$`,
  [R`$\sqrt{13}$`, R`$2\sqrt{10}$`, R`$\sqrt{5}$`, R`$\sqrt{26}$`],
  R`Integrando a aceleração componente a componente e impondo $\mathbf{v}(0) = (0,1,2)$: $\mathbf{v}(t) = \left(3t^2,\; 1,\; 2-2t\right)$. Em $t = 1$, $\mathbf{v}(1) = (3, 1, 0)$ e a rapidez é $|\mathbf{v}(1)| = \sqrt{9+1+0} = \sqrt{10} \approx 3{,}16$. (A posição inicial não interfere na rapidez.)`,
  Math.sqrt(10),
  () => {
    const a = (t) => [6 * t, 0, -2];
    const v = [0, 1, 2].map((v0, i) => v0 + simpson((t) => a(t)[i], 0, 1, 2000));
    return norma(v);
  }
);

q(
  C2, TC, "Curvatura máxima de uma elipse", "dificil",
  R`A curva $\mathbf{r}(t) = (3\cos t,\, 2\operatorname{sen}t)$ descreve uma elipse. O maior valor da curvatura ao longo dela é:`,
  R`$\frac{3}{4}$`,
  [R`$\frac{2}{9}$`, R`$\frac{3}{8}$`, R`$\frac{4}{9}$`, R`$\frac{2}{3}$`],
  R`Com $\mathbf{r}' = (-3\operatorname{sen}t,\, 2\cos t)$ e $\mathbf{r}'' = (-3\cos t,\, -2\operatorname{sen}t)$, o produto vetorial tem componente $6\operatorname{sen}^2 t + 6\cos^2 t = 6$, constante. Logo $\kappa = \dfrac{6}{\left(9\operatorname{sen}^2t + 4\cos^2 t\right)^{3/2}}$, que é máxima onde o denominador é mínimo, isto é onde a rapidez é mínima: $t = 0$ ou $t = \pi$, os vértices do eixo maior. Aí $|\mathbf{r}'| = 2$ e $\kappa_{\max} = \frac{6}{8} = \frac{3}{4}$.`,
  0.75,
  () => otimizar((t) => curvatura((s) => [3 * Math.cos(s), 2 * Math.sin(s)], t), [[0, Math.PI]], "max").valor,
  { tol: 1e-3 }
);

q(
  C2, TC, "Rapidez mínima", "facil",
  R`Para a curva $\mathbf{r}(t) = \left(t^2 - 2t,\; t^2 + 2t\right)$, a menor rapidez atingida pela partícula é:`,
  R`$2\sqrt{2}$`,
  [R`$4\sqrt{2}$`, R`$\sqrt{2}$`, R`$2\sqrt{3}$`, R`$3\sqrt{2}$`],
  R`Derivando, $\mathbf{r}'(t) = (2t-2,\; 2t+2)$, logo $|\mathbf{r}'|^2 = (2t-2)^2 + (2t+2)^2 = 8t^2 + 8$. Essa expressão é mínima em $t = 0$, onde $|\mathbf{r}'| = \sqrt{8} = 2\sqrt{2} \approx 2{,}83$. Note que a rapidez nunca se anula: a curva não tem cúspide.`,
  2 * Math.SQRT2,
  () => otimizar((t) => norma(dvec((s) => [s * s - 2 * s, s * s + 2 * s], t)), [[-3, 3]], "min").valor
);

// ===========================================================================
// Superfícies
// ===========================================================================

q(
  C2, TS, "Esfera por completamento de quadrados", "medio",
  R`A superfície $x^2 + y^2 + z^2 - 4x + 6y - 2z + 5 = 0$ é uma esfera. A distância da origem ao ponto dessa esfera mais próximo dela é:`,
  R`$\sqrt{14}-3$`,
  [R`$\sqrt{14}-2$`, R`$\sqrt{11}-3$`, R`$\sqrt{17}-3$`, R`$2\sqrt{14}-3$`],
  R`Completando quadrados: $(x-2)^2 + (y+3)^2 + (z-1)^2 = -5 + 4 + 9 + 1 = 9$, uma esfera de centro $C = (2,-3,1)$ e raio $3$. Como $|OC| = \sqrt{4+9+1} = \sqrt{14} \approx 3{,}74 > 3$, a origem é exterior à esfera, e a menor distância é $|OC| - r = \sqrt{14} - 3 \approx 0{,}74$.`,
  Math.sqrt(14) - 3,
  () =>
    otimizar(
      (u, v) => norma([2 + 3 * Math.sin(u) * Math.cos(v), -3 + 3 * Math.sin(u) * Math.sin(v), 1 + 3 * Math.cos(u)]),
      [[0, Math.PI], [0, 2 * Math.PI]],
      "min"
    ).valor
);

q(
  C2, TS, "Distância entre retas reversas", "dificil",
  R`As retas $r: (1,0,0) + t(1,2,1)$ e $s: (0,1,0) + u(2,1,-1)$ são reversas. A distância entre elas é:`,
  R`$\frac{2\sqrt{3}}{3}$`,
  [R`$\frac{\sqrt{3}}{3}$`, R`$\frac{4\sqrt{3}}{3}$`, R`$\frac{2\sqrt{3}}{9}$`, R`$\frac{2\sqrt{6}}{3}$`],
  R`Com $\mathbf{v}_1 = (1,2,1)$ e $\mathbf{v}_2 = (2,1,-1)$, tem-se $\mathbf{v}_1 \times \mathbf{v}_2 = (-3, 3, -3)$, de norma $3\sqrt{3}$. O vetor que liga um ponto de cada reta é $\mathbf{w} = (0,1,0) - (1,0,0) = (-1,1,0)$, e $\mathbf{w}\cdot(\mathbf{v}_1\times\mathbf{v}_2) = 3 + 3 + 0 = 6$. Logo $d = \frac{|\mathbf{w}\cdot(\mathbf{v}_1\times\mathbf{v}_2)|}{|\mathbf{v}_1\times\mathbf{v}_2|} = \frac{6}{3\sqrt{3}} = \frac{2}{\sqrt{3}} = \frac{2\sqrt{3}}{3} \approx 1{,}15$.`,
  2 / Math.sqrt(3),
  () =>
    otimizar(
      (t, u) => norma(sub([1 + t, 2 * t, t], [2 * u, 1 + u, -u])),
      [[-8, 8], [-8, 8]],
      "min"
    ).valor
);

q(
  C2, TS, "Superfície de revolução: paraboloide", "facil",
  R`Girando a parábola $z = 4 - y^2$ do plano $yz$ em torno do eixo $z$, obtém-se uma superfície. A área da região plana limitada pela curva de interseção dessa superfície com o plano $z = 1$ é:`,
  R`$3\pi$`,
  [R`$\pi$`, R`$4\pi$`, R`$9\pi$`, R`$\frac{3\pi}{2}$`],
  R`Na revolução em torno de $z$, a variável $y$ é substituída pela distância ao eixo, $\sqrt{x^2+y^2}$: a superfície é $z = 4 - (x^2 + y^2)$, um paraboloide. Em $z = 1$ resulta $x^2 + y^2 = 3$, um círculo de raio $\sqrt{3}$, cuja região tem área $\pi\left(\sqrt{3}\right)^2 = 3\pi \approx 9{,}42$.`,
  3 * Math.PI,
  () => dupla((x, y) => (4 - x * x - y * y >= 1 ? 1 : 0), -2, 2, -2, 2, 800),
  { tol: 5e-3 }
);

q(
  C2, TS, "Volume do sólido de revolução (toro)", "dificil",
  R`A elipse $(y-3)^2 + \dfrac{z^2}{4} = 1$, contida no plano $yz$, gira em torno do eixo $z$ e gera um toro. O volume do sólido limitado por essa superfície é:`,
  R`$12\pi^2$`,
  [R`$6\pi^2$`, R`$24\pi^2$`, R`$18\pi^2$`, R`$\frac{12\pi^2}{5}$`],
  R`A região que gira é o interior da elipse, de semi-eixos $1$ (em $y$) e $2$ (em $z$), logo de área $A = \pi\cdot 1\cdot 2 = 2\pi$; seu centroide está a $\bar{y} = 3$ do eixo de rotação. Pelo teorema de Pappus, $V = 2\pi\bar{y}A = 2\pi\cdot 3\cdot 2\pi = 12\pi^2 \approx 118{,}4$. Como $\bar{y} = 3 > 1$, a região não cruza o eixo e o toro não se autointersecta.`,
  12 * Math.PI * Math.PI,
  () =>
    // V = ∫∫ 2πy dA sobre a elipse, em coordenadas elípticas (jacobiano 2s)
    simpson(
      (a) => simpson((s) => 2 * Math.PI * (3 + s * Math.cos(a)) * 2 * s, 0, 1, 400),
      0,
      2 * Math.PI,
      400
    )
);

q(
  C2, TS, "Distância de ponto a reta no espaço", "medio",
  R`A distância do ponto $P = (1,2,3)$ à reta $(0,1,1) + t(2,-1,2)$ é:`,
  R`$\frac{\sqrt{29}}{3}$`,
  [R`$\frac{\sqrt{29}}{9}$`, R`$\frac{\sqrt{26}}{3}$`, R`$\frac{2\sqrt{29}}{3}$`, R`$\frac{\sqrt{29}}{6}$`],
  R`Tome $A = (0,1,1)$ na reta e $\mathbf{v} = (2,-1,2)$, com $|\mathbf{v}| = 3$. Então $\mathbf{w} = P - A = (1,1,2)$ e $\mathbf{w}\times\mathbf{v} = (1\cdot 2 - 2\cdot(-1),\; 2\cdot 2 - 1\cdot 2,\; 1\cdot(-1) - 1\cdot 2) = (4, 2, -3)$, de norma $\sqrt{29}$. Logo $d = \frac{|\mathbf{w}\times\mathbf{v}|}{|\mathbf{v}|} = \frac{\sqrt{29}}{3} \approx 1{,}80$.`,
  Math.sqrt(29) / 3,
  () => otimizar((t) => norma(sub([2 * t, 1 - t, 1 + 2 * t], [1, 2, 3])), [[-10, 10]], "min").valor
);

q(
  C2, TS, "Seção plana de hiperboloide", "medio",
  R`O plano $z = 1$ corta o hiperboloide de uma folha $\dfrac{x^2}{4} + \dfrac{y^2}{9} - z^2 = 1$ segundo uma elipse. A área da região limitada por essa elipse é:`,
  R`$12\pi$`,
  [R`$6\pi$`, R`$24\pi$`, R`$18\pi$`, R`$8\pi$`],
  R`Substituindo $z = 1$: $\frac{x^2}{4} + \frac{y^2}{9} = 2$, isto é $\frac{x^2}{8} + \frac{y^2}{18} = 1$, uma elipse de semi-eixos $a = 2\sqrt{2}$ e $b = 3\sqrt{2}$. Sua área é $\pi ab = \pi\cdot 2\sqrt{2}\cdot 3\sqrt{2} = 12\pi \approx 37{,}7$.`,
  12 * Math.PI,
  () =>
    linhaVetorial(
      (x, y) => [-y / 2, x / 2],
      (t) => [2 * Math.SQRT2 * Math.cos(t), 3 * Math.SQRT2 * Math.sin(t)],
      0,
      2 * Math.PI
    )
);

q(
  C2, TS, "Plano por uma reta, perpendicular a um plano dado", "dificil",
  R`Seja $\pi$ o plano que contém a reta $(1,0,2) + t(1,1,-1)$ e é perpendicular ao plano $2x - y + z = 5$. A distância da origem a $\pi$ é:`,
  R`$\sqrt{2}$`,
  [R`$2\sqrt{2}$`, R`$\frac{\sqrt{2}}{2}$`, R`$\sqrt{3}$`, R`$\frac{2\sqrt{3}}{3}$`],
  R`O plano procurado contém a direção da reta, $\mathbf{v} = (1,1,-1)$, e — por ser perpendicular ao plano dado — também a direção $\mathbf{n}_0 = (2,-1,1)$. Assim sua normal é $\mathbf{n} = \mathbf{v}\times\mathbf{n}_0 = (1\cdot 1 - (-1)(-1),\; (-1)\cdot 2 - 1\cdot 1,\; 1\cdot(-1) - 1\cdot 2) = (0,-3,-3)$, proporcional a $(0,1,1)$. Passando por $(1,0,2)$: $y + z = 2$. A distância da origem é $\frac{|0+0-2|}{\sqrt{2}} = \sqrt{2} \approx 1{,}41$.`,
  Math.SQRT2,
  () =>
    otimizar(
      (a, b) => norma([1 + a + 2 * b, a - b, 2 - a + b]),
      [[-6, 6], [-6, 6]],
      "min"
    ).valor
);

q(
  C2, TS, "Projeção ortogonal sobre um plano", "medio",
  R`Seja $P' $ a projeção ortogonal do ponto $P = (2,3,1)$ sobre o plano $x + 2y - z = 4$. A distância de $P'$ à origem é:`,
  R`$\frac{\sqrt{34}}{2}$`,
  [R`$\frac{\sqrt{34}}{4}$`, R`$\frac{\sqrt{17}}{2}$`, R`$\sqrt{34}$`, R`$\frac{\sqrt{38}}{2}$`],
  R`Com $\mathbf{n} = (1,2,-1)$ e $|\mathbf{n}|^2 = 6$, a projeção é $P' = P - \frac{\mathbf{n}\cdot P - 4}{|\mathbf{n}|^2}\,\mathbf{n}$. Como $\mathbf{n}\cdot P = 2 + 6 - 1 = 7$, o fator vale $\frac{3}{6} = \frac{1}{2}$ e $P' = (2,3,1) - \frac{1}{2}(1,2,-1) = \left(\frac{3}{2},\, 2,\, \frac{3}{2}\right)$. Portanto $|OP'| = \sqrt{\frac{9}{4} + 4 + \frac{9}{4}} = \sqrt{\frac{17}{2}} = \frac{\sqrt{34}}{2} \approx 2{,}92$.`,
  Math.sqrt(34) / 2,
  () => {
    const X = (a, b) => [4 - 2 * a + b, a, b];
    const m = otimizar((a, b) => norma(sub(X(a, b), [2, 3, 1])), [[-4, 6], [-4, 6]], "min");
    return norma(X(...m.p));
  }
);

q(
  C2, TS, "Tetraedro determinado por um plano", "facil",
  R`O plano $2x + 3y + z = 12$ limita, junto com os planos coordenados, um tetraedro no primeiro octante. O volume desse tetraedro é:`,
  R`$48$`,
  [R`$24$`, R`$96$`, R`$144$`, R`$36$`],
  R`Os interceptos do plano com os eixos são $x = 6$, $y = 4$ e $z = 12$. O tetraedro tem por base o triângulo retângulo de catetos $6$ e $4$ no plano $xy$, de área $12$, e altura $12$. Logo $V = \frac{1}{3}\cdot 12\cdot 12 = 48$ — equivalentemente, $V = \frac{abc}{6} = \frac{6\cdot 4\cdot 12}{6}$.`,
  48,
  () => dupla((x, y) => 12 - 2 * x - 3 * y, 0, 6, 0, (x) => (12 - 2 * x) / 3, 400)
);

q(
  C2, TS, "Área de superfície de revolução", "dificil",
  R`A curva $y = \sqrt{x}$, $0 \le x \le 4$, gira em torno do eixo $x$. A área da superfície gerada é:`,
  R`$\frac{\pi}{6}(17\sqrt{17}-1)$`,
  [R`$\frac{\pi}{6}(17\sqrt{17}+1)$`, R`$\frac{\pi}{3}(17\sqrt{17}-1)$`, R`$\frac{\pi}{6}(17\sqrt{17}-8)$`, R`$\frac{\pi}{12}(17\sqrt{17}-1)$`],
  R`A área é $S = \int_0^4 2\pi y\sqrt{1 + (y')^2}\,dx$ com $y = \sqrt{x}$ e $y' = \frac{1}{2\sqrt{x}}$. Então $y\sqrt{1+(y')^2} = \sqrt{x}\sqrt{1 + \frac{1}{4x}} = \sqrt{x + \frac{1}{4}}$, e $S = 2\pi\int_0^4\sqrt{x+\frac14}\,dx = 2\pi\cdot\frac{2}{3}\left[\left(x+\tfrac14\right)^{3/2}\right]_0^4 = \frac{4\pi}{3}\left(\frac{17\sqrt{17}}{8} - \frac{1}{8}\right) = \frac{\pi}{6}\left(17\sqrt{17}-1\right) \approx 36{,}2$.`,
  (Math.PI / 6) * (17 * Math.sqrt(17) - 1),
  () =>
    superficieEscalar(
      () => 1,
      (u, a) => [u * u, u * Math.cos(a), u * Math.sin(a)],
      0,
      2,
      0,
      2 * Math.PI,
      400
    )
);

// ===========================================================================
// Funções de duas e três variáveis
// ===========================================================================

q(
  C2, TF, "Derivação implícita", "dificil",
  R`A equação $x^2 + y^2 + z^2 + xyz = 8$ define implicitamente $z = z(x,y)$ numa vizinhança do ponto $(1,1,2)$. O valor de $\dfrac{\partial z}{\partial x}$ nesse ponto é:`,
  R`$-\frac{4}{5}$`,
  [R`$-\frac{5}{4}$`, R`$-\frac{4}{3}$`, R`$\frac{4}{5}$`, R`$-\frac{2}{5}$`],
  R`Seja $F(x,y,z) = x^2+y^2+z^2+xyz - 8$. Pelo teorema da função implícita, $\frac{\partial z}{\partial x} = -\frac{F_x}{F_z} = -\frac{2x + yz}{2z + xy}$. No ponto $(1,1,2)$ — que de fato satisfaz a equação, pois $1+1+4+2 = 8$ — vem $F_x = 2 + 2 = 4$ e $F_z = 4 + 1 = 5$, ambos contínuos e com $F_z \ne 0$. Logo $\frac{\partial z}{\partial x} = -\frac{4}{5} = -0{,}8$.`,
  -0.8,
  () => {
    const z = (x) => bissecao((s) => x * x + 1 + s * s + x * s - 8, 1.2, 2.8);
    const h = 1e-4;
    return (z(1 + h) - z(1 - h)) / (2 * h);
  }
);

q(
  C2, TF, "Diferencial total e propagação de erro", "medio",
  R`O raio e a altura de um cilindro circular reto medem $5$ cm e $12$ cm, cada um com erro máximo de $0{,}1$ cm. Usando a diferencial total, o erro máximo estimado no volume, em cm$^3$, é:`,
  R`$\frac{29\pi}{2}$`,
  [R`$\frac{25\pi}{2}$`, R`$\frac{27\pi}{2}$`, R`$\frac{31\pi}{2}$`, R`$\frac{29\pi}{4}$`],
  R`Com $V = \pi r^2 h$, tem-se $dV = 2\pi rh\,dr + \pi r^2\,dh$. Substituindo $r = 5$, $h = 12$ e $|dr| = |dh| = 0{,}1$: $|dV| \le 2\pi\cdot 5\cdot 12\cdot 0{,}1 + \pi\cdot 25\cdot 0{,}1 = 12\pi + 2{,}5\pi = \frac{29\pi}{2} \approx 45{,}6$ cm$^3$.`,
  (29 * Math.PI) / 2,
  () => {
    const V = (r, h) => Math.PI * r * r * h;
    return Math.abs(parcial(V, [5, 12], 0)) * 0.1 + Math.abs(parcial(V, [5, 12], 1)) * 0.1;
  }
);

q(
  C2, TF, "Regra da cadeia ao longo de uma trajetória", "medio",
  R`A temperatura de uma placa é $T(x,y) = x^2y - y^2$ e uma partícula percorre a trajetória $\mathbf{r}(t) = \left(1+2t,\; t^2+1\right)$. A taxa de variação da temperatura sentida pela partícula em $t = 1$ é:`,
  R`$34$`,
  [R`$29$`, R`$38$`, R`$24$`, R`$44$`],
  R`Pela regra da cadeia, $\frac{dT}{dt} = \nabla T\cdot\mathbf{r}'$. Em $t = 1$ a partícula está em $(3,2)$ e $\mathbf{r}'(1) = (2,\, 2)$. Como $\nabla T = \left(2xy,\; x^2 - 2y\right)$, em $(3,2)$ vale $\nabla T = (12,\, 5)$. Logo $\frac{dT}{dt} = 12\cdot 2 + 5\cdot 2 = 34$ unidades de temperatura por unidade de tempo.`,
  34,
  () => {
    const T = (t) => {
      const x = 1 + 2 * t;
      const y = t * t + 1;
      return x * x * y - y * y;
    };
    return (T(1 + 1e-5) - T(1 - 1e-5)) / 2e-5;
  }
);

q(
  C2, TF, "Gradiente a partir de derivadas direcionais", "dificil",
  R`Uma função diferenciável $f$ satisfaz, num ponto $P$, $D_{\mathbf{u}}f(P) = 3\sqrt{2}$ na direção de $\mathbf{u} = \frac{1}{\sqrt{2}}(1,1)$ e $D_{\mathbf{w}}f(P) = \sqrt{2}$ na direção de $\mathbf{w} = \frac{1}{\sqrt{2}}(1,-1)$. A taxa máxima de variação de $f$ em $P$ é:`,
  R`$2\sqrt{5}$`,
  [R`$2\sqrt{10}$`, R`$\sqrt{5}$`, R`$4\sqrt{5}$`, R`$2\sqrt{3}$`],
  R`Escrevendo $\nabla f(P) = (a,b)$, as derivadas direcionais dão $\frac{a+b}{\sqrt{2}} = 3\sqrt{2}$ e $\frac{a-b}{\sqrt{2}} = \sqrt{2}$, isto é $a+b = 6$ e $a-b = 2$. Logo $a = 4$ e $b = 2$. A taxa máxima de variação é $|\nabla f(P)| = \sqrt{16+4} = \sqrt{20} = 2\sqrt{5} \approx 4{,}47$, atingida na direção do próprio gradiente.`,
  2 * Math.sqrt(5),
  () => {
    const s = Math.SQRT1_2;
    // resolve [[s,s],[s,-s]]·(a,b) = (3√2, √2) por Cramer
    const det = s * -s - s * s;
    const a = (3 * Math.SQRT2 * -s - s * Math.SQRT2) / det;
    const b = (s * Math.SQRT2 - 3 * Math.SQRT2 * s) / det;
    return Math.hypot(a, b);
  }
);

q(
  C2, TF, "Função harmônica", "medio",
  R`Para que valor de $k$ a função $u(x,y) = x^3 + kxy^2$ é harmônica, isto é, satisfaz $u_{xx} + u_{yy} = 0$?`,
  R`$-3$`,
  [R`$3$`, R`$-6$`, R`$-1$`, R`$-\frac{1}{3}$`],
  R`Calculando as derivadas de segunda ordem: $u_x = 3x^2 + ky^2$ e $u_{xx} = 6x$; $u_y = 2kxy$ e $u_{yy} = 2kx$. O laplaciano é $u_{xx} + u_{yy} = 6x + 2kx = (6 + 2k)x$, que só se anula para todo $(x,y)$ se $6 + 2k = 0$, isto é $k = -3$. (A função resultante, $x^3 - 3xy^2$, é a parte real de $z^3$.)`,
  -3,
  () =>
    bissecao((k) => {
      const u = (x, y) => x * x * x + k * x * y * y;
      return parcial2(u, [1, 1], 0, 0) + parcial2(u, [1, 1], 1, 1);
    }, -10, 0),
  { tol: 1e-3 }
);

q(
  C2, TF, "Derivada mista de função potência", "dificil",
  R`Seja $f(x,y) = x^{y}$, com $x > 0$. O valor de $\dfrac{\partial^2 f}{\partial y\,\partial x}$ no ponto $(2,1)$ é:`,
  R`$1+\ln 2$`,
  [R`$1+2\ln 2$`, R`$2+\ln 2$`, R`$\ln 2$`, R`$1-\ln 2$`],
  R`Primeiro $f_x = yx^{y-1}$. Derivando essa expressão em relação a $y$ — agora $x$ é constante e aparece a derivada de $x^{y-1} = e^{(y-1)\ln x}$ — obtém-se $f_{xy} = x^{y-1} + yx^{y-1}\ln x$. No ponto $(2,1)$: $x^{y-1} = 2^0 = 1$, de modo que $f_{xy} = 1 + \ln 2 \approx 1{,}69$.`,
  1 + Math.log(2),
  () => parcial2((x, y) => Math.pow(x, y), [2, 1], 1, 0),
  { tol: 1e-3 }
);

q(
  C2, TF, "Plano tangente a superfície de nível", "medio",
  R`Seja $\pi$ o plano tangente à superfície $x^2 + 2y^2 + 3z^2 = 21$ no ponto $(1,2,2)$. A distância da origem a $\pi$ é:`,
  R`$\frac{21\sqrt{53}}{53}$`,
  [R`$\frac{21\sqrt{53}}{106}$`, R`$\frac{42\sqrt{53}}{53}$`, R`$\frac{21\sqrt{51}}{51}$`, R`$\frac{7\sqrt{53}}{53}$`],
  R`O gradiente de $F = x^2+2y^2+3z^2$ é $\nabla F = (2x, 4y, 6z)$, que no ponto vale $(2,8,12)$ — uma normal ao plano tangente. O plano é $2(x-1) + 8(y-2) + 12(z-2) = 0$, isto é $x + 4y + 6z = 21$. Sua distância à origem é $\frac{21}{\sqrt{1+16+36}} = \frac{21}{\sqrt{53}} = \frac{21\sqrt{53}}{53} \approx 2{,}88$.`,
  21 / Math.sqrt(53),
  () => {
    const n = gradiente((x, y, z) => x * x + 2 * y * y + 3 * z * z, [1, 2, 2]);
    const u1 = cross(n, [1, 0, 0]);
    const u2 = cross(n, u1);
    const e1 = u1.map((x) => x / norma(u1));
    const e2 = u2.map((x) => x / norma(u2));
    return otimizar(
      (a, b) => norma([1 + a * e1[0] + b * e2[0], 2 + a * e1[1] + b * e2[1], 2 + a * e1[2] + b * e2[2]]),
      [[-12, 12], [-12, 12]],
      "min"
    ).valor;
  }
);

q(
  C2, TF, "Módulo do gradiente", "facil",
  R`Para $f(x,y,z) = xyz + z^2$, o módulo do gradiente no ponto $(1,2,3)$ é:`,
  R`$\sqrt{109}$`,
  [R`$\sqrt{101}$`, R`$\sqrt{85}$`, R`$\sqrt{117}$`, R`$\sqrt{94}$`],
  R`As derivadas parciais são $f_x = yz$, $f_y = xz$ e $f_z = xy + 2z$. No ponto $(1,2,3)$: $\nabla f = (6,\, 3,\, 2 + 6) = (6,3,8)$. Portanto $|\nabla f| = \sqrt{36+9+64} = \sqrt{109} \approx 10{,}44$, que é também a maior taxa de variação de $f$ nesse ponto.`,
  Math.sqrt(109),
  () => norma(gradiente((x, y, z) => x * y * z + z * z, [1, 2, 3]))
);

q(
  C2, TF, "Regra da cadeia em coordenadas polares", "medio",
  R`Seja $z = f(x,y)$ diferenciável, com $x = r\cos\theta$ e $y = r\operatorname{sen}\theta$. Sabendo que $f_x = 3$ e $f_y = -1$ no ponto $(x,y) = \left(1,\sqrt{3}\right)$, o valor de $\dfrac{\partial z}{\partial r}$ em $r = 2$, $\theta = \dfrac{\pi}{3}$ é:`,
  R`$\frac{3-\sqrt{3}}{2}$`,
  [R`$\frac{3+\sqrt{3}}{2}$`, R`$\frac{\sqrt{3}-3}{2}$`, R`$\frac{3-\sqrt{3}}{4}$`, R`$3-\sqrt{3}$`],
  R`Note que $r = 2$ e $\theta = \frac{\pi}{3}$ correspondem exatamente a $(x,y) = \left(2\cdot\frac12,\; 2\cdot\frac{\sqrt3}{2}\right) = \left(1,\sqrt3\right)$. Pela regra da cadeia, $\frac{\partial z}{\partial r} = f_x\frac{\partial x}{\partial r} + f_y\frac{\partial y}{\partial r} = f_x\cos\theta + f_y\operatorname{sen}\theta$. Substituindo: $3\cdot\frac{1}{2} + (-1)\cdot\frac{\sqrt3}{2} = \frac{3-\sqrt3}{2} \approx 0{,}63$.`,
  (3 - Math.sqrt(3)) / 2,
  () => parcial((r, t) => 3 * (r * Math.cos(t)) - r * Math.sin(t), [2, Math.PI / 3], 0)
);

q(
  C2, TF, "Taxas relacionadas com duas variáveis", "dificil",
  R`Num triângulo, dois lados medem $5$ m e $8$ m e crescem a $0{,}1$ m/s e $0{,}2$ m/s, respectivamente, enquanto o ângulo entre eles mede $\dfrac{\pi}{6}$ e cresce a $0{,}05$ rad/s. A taxa de variação da área, em m$^2$/s, nesse instante é:`,
  R`$\frac{9+10\sqrt{3}}{20}$`,
  [R`$\frac{9+5\sqrt{3}}{20}$`, R`$\frac{9+10\sqrt{3}}{10}$`, R`$\frac{9+10\sqrt{3}}{40}$`, R`$\frac{18+5\sqrt{3}}{20}$`],
  R`Com $A = \frac{1}{2}ab\operatorname{sen}\theta$, a regra da cadeia dá $\frac{dA}{dt} = \frac{1}{2}\left(\dot{a}b\operatorname{sen}\theta + a\dot{b}\operatorname{sen}\theta + ab\cos\theta\,\dot{\theta}\right)$. Substituindo $a=5$, $b=8$, $\theta=\frac{\pi}{6}$, $\dot a = 0{,}1$, $\dot b = 0{,}2$ e $\dot\theta = 0{,}05$: $\frac{dA}{dt} = \frac{1}{2}\left(0{,}4 + 0{,}5 + 40\cdot\frac{\sqrt3}{2}\cdot 0{,}05\right) = \frac{1}{2}\left(0{,}9 + \sqrt3\right) = \frac{9 + 10\sqrt3}{20} \approx 1{,}32$.`,
  (9 + 10 * Math.sqrt(3)) / 20,
  () => {
    const A = (t) => 0.5 * (5 + 0.1 * t) * (8 + 0.2 * t) * Math.sin(Math.PI / 6 + 0.05 * t);
    return (A(1e-5) - A(-1e-5)) / 2e-5;
  }
);

// ===========================================================================
// Máximos e mínimos
// ===========================================================================

q(
  C2, TM, "Lagrange com duas restrições", "dificil",
  R`O valor máximo de $f(x,y,z) = x + 2y + 3z$ sobre a curva definida por $x - y + z = 1$ e $x^2 + y^2 = 1$ é:`,
  R`$3+\sqrt{29}$`,
  [R`$3+\sqrt{26}$`, R`$3+2\sqrt{29}$`, R`$1+\sqrt{29}$`, R`$3+\frac{\sqrt{29}}{2}$`],
  R`Da primeira restrição, $z = 1 - x + y$, de modo que $f = x + 2y + 3(1-x+y) = -2x + 5y + 3$. Resta maximizar uma função linear sobre o círculo $x^2+y^2=1$: pela desigualdade de Cauchy-Schwarz (ou por Lagrange, $\nabla f = \lambda\nabla g$), o máximo de $-2x+5y$ é $\sqrt{(-2)^2+5^2} = \sqrt{29}$. Logo o máximo é $3 + \sqrt{29} \approx 8{,}39$.`,
  3 + Math.sqrt(29),
  () => otimizar((t) => -2 * Math.cos(t) + 5 * Math.sin(t) + 3, [[0, 2 * Math.PI]], "max").valor
);

q(
  C2, TM, "Reta de mínimos quadrados", "dificil",
  R`Ajusta-se a reta $y = ax + b$ aos pontos $(0,1)$, $(1,3)$, $(2,4)$ e $(3,6)$ minimizando $S(a,b) = \sum \left(y_i - ax_i - b\right)^2$. O valor de $a$ é:`,
  R`$\frac{8}{5}$`,
  [R`$\frac{7}{5}$`, R`$\frac{9}{5}$`, R`$\frac{8}{3}$`, R`$\frac{11}{10}$`],
  R`Anulando $S_a$ e $S_b$ chega-se às equações normais $a\sum x_i^2 + b\sum x_i = \sum x_iy_i$ e $a\sum x_i + 4b = \sum y_i$. Com $\sum x_i = 6$, $\sum x_i^2 = 14$, $\sum y_i = 14$ e $\sum x_iy_i = 0 + 3 + 8 + 18 = 29$, resolve-se $14a + 6b = 29$ e $6a + 4b = 14$. Eliminando $b$: $a = \frac{4\cdot 29 - 6\cdot 14}{4\cdot 14 - 36} = \frac{32}{20} = \frac{8}{5} = 1{,}6$.`,
  1.6,
  () => {
    const P = [[0, 1], [1, 3], [2, 4], [3, 6]];
    const S = (a, b) => P.reduce((s, [x, y]) => s + (y - a * x - b) ** 2, 0);
    return otimizar(S, [[0, 4], [-2, 4]], "min").p[0];
  },
  { tol: 1e-3 }
);

q(
  C2, TM, "Distância mínima a uma superfície", "medio",
  R`A menor distância da origem à superfície $xyz = 8$, com $x, y, z > 0$, é:`,
  R`$2\sqrt{3}$`,
  [R`$2\sqrt{2}$`, R`$3\sqrt{3}$`, R`$2\sqrt{6}$`, R`$4\sqrt{2}$`],
  R`Minimize $g = x^2+y^2+z^2$ sob $xyz = 8$. Por Lagrange, $2x = \lambda yz$, $2y = \lambda xz$ e $2z = \lambda xy$; multiplicando a primeira por $x$, a segunda por $y$ e a terceira por $z$, os lados direitos ficam todos iguais a $8\lambda$, donde $x^2 = y^2 = z^2$ e, com as variáveis positivas, $x = y = z$. A restrição dá $x^3 = 8$, isto é $x = 2$, e a distância é $\sqrt{4+4+4} = 2\sqrt{3} \approx 3{,}46$.`,
  2 * Math.sqrt(3),
  () => otimizar((x, y) => Math.sqrt(x * x + y * y + (8 / (x * y)) ** 2), [[0.5, 6], [0.5, 6]], "min").valor,
  { tol: 1e-3 }
);

q(
  C2, TM, "Extremos em região triangular fechada", "dificil",
  R`O valor mínimo de $f(x,y) = x^2 + 2y^2 - x$ na região triangular fechada de vértices $(0,0)$, $(2,0)$ e $(0,2)$ é:`,
  R`$-\frac{1}{4}$`,
  [R`$-\frac{1}{2}$`, R`$\frac{1}{4}$`, R`$-\frac{1}{8}$`, R`$-\frac{3}{4}$`],
  R`Os pontos críticos interiores exigem $f_x = 2x - 1 = 0$ e $f_y = 4y = 0$, isto é $\left(\frac12, 0\right)$ — que está na fronteira, não no interior; logo o mínimo ocorre na fronteira. No lado $y = 0$, $f = x^2 - x$, cujo mínimo em $[0,2]$ é $-\frac14$ em $x = \frac12$. No lado $x = 0$, $f = 2y^2 \ge 0$. No lado $x + y = 2$, $f = 3x^2 - 9x + 8$, com mínimo $\frac{5}{4}$ em $x = \frac32$. Comparando, o mínimo absoluto é $-\frac{1}{4}$.`,
  -0.25,
  () => otimizar((x, y) => (x < 0 || y < 0 || x + y > 2 ? Infinity : x * x + 2 * y * y - x), [[0, 2], [0, 2]], "min").valor
);

q(
  C2, TM, "Teste da hessiana", "medio",
  R`A função $f(x,y) = x^3 + y^3 - 3xy$ possui um mínimo local. O valor de $f$ nesse ponto é:`,
  R`$-1$`,
  [R`$1$`, R`$-3$`, R`$-2$`, R`$-\frac{1}{2}$`],
  R`De $f_x = 3x^2 - 3y = 0$ e $f_y = 3y^2 - 3x = 0$ vem $y = x^2$ e $x = y^2$, logo $x^4 = x$ e os pontos críticos são $(0,0)$ e $(1,1)$. Com $f_{xx} = 6x$, $f_{yy} = 6y$ e $f_{xy} = -3$, o discriminante é $D = 36xy - 9$: em $(0,0)$, $D = -9 < 0$ (sela); em $(1,1)$, $D = 27 > 0$ com $f_{xx} = 6 > 0$, um mínimo local. O valor é $f(1,1) = 1 + 1 - 3 = -1$.`,
  -1,
  () => otimizar((x, y) => x * x * x + y * y * y - 3 * x * y, [[0.2, 2], [0.2, 2]], "min").valor
);

q(
  C2, TM, "Caixa de custo mínimo", "dificil",
  R`Uma caixa retangular sem tampa deve ter volume $4$ m$^3$. O material da base custa R\$ $3$ por m$^2$ e o das laterais R\$ $1$ por m$^2$. O custo mínimo, em reais, é:`,
  R`$12\sqrt[3]{3}$`,
  [R`$6\sqrt[3]{3}$`, R`$12\sqrt[3]{9}$`, R`$18\sqrt[3]{3}$`, R`$12\sqrt[3]{2}$`],
  R`Com base $x \times y$ e altura $z = \frac{4}{xy}$, o custo é $C = 3xy + 2(xz + yz) = 3xy + \frac{8}{y} + \frac{8}{x}$. As condições $C_x = 3y - \frac{8}{x^2} = 0$ e $C_y = 3x - \frac{8}{y^2} = 0$ dão, por simetria, $x = y$ e $3x^3 = 8$, isto é $x = \frac{2}{\sqrt[3]{3}}$. Então $C = 3x^2 + \frac{16}{x} = 4\sqrt[3]{3} + 8\sqrt[3]{3} = 12\sqrt[3]{3} \approx 17{,}31$ reais.`,
  12 * Math.cbrt(3),
  () => otimizar((x, y) => 3 * x * y + 8 / x + 8 / y, [[0.4, 5], [0.4, 5]], "min").valor,
  { tol: 1e-3 }
);

q(
  C2, TM, "Lagrange sobre uma elipse", "medio",
  R`O valor máximo de $f(x,y) = xy$ sobre a elipse $\dfrac{x^2}{8} + \dfrac{y^2}{2} = 1$ é:`,
  R`$2$`,
  [R`$4$`, R`$1$`, R`$3$`, R`$8$`],
  R`Parametrizando a elipse por $x = 2\sqrt{2}\cos t$ e $y = \sqrt{2}\operatorname{sen}t$, tem-se $xy = 4\cos t\operatorname{sen}t = 2\operatorname{sen}2t$, cujo máximo é $2$. Por Lagrange chega-se ao mesmo: $y = \lambda\frac{x}{4}$ e $x = \lambda y$ levam a $x^2 = 4y^2$, e com a restrição $\frac{4y^2}{8} + \frac{y^2}{2} = 1$ resulta $y = 1$ e $x = 2$, ponto em que $xy = 2$.`,
  2,
  () => otimizar((t) => 2 * Math.SQRT2 * Math.cos(t) * Math.SQRT2 * Math.sin(t), [[0, Math.PI / 2]], "max").valor
);

q(
  C2, TM, "Mínimo absoluto de função de quarto grau", "dificil",
  R`O valor mínimo absoluto de $f(x,y) = x^4 + y^4 - 4xy + 5$ é:`,
  R`$3$`,
  [R`$5$`, R`$1$`, R`$4$`, R`$2$`],
  R`De $f_x = 4x^3 - 4y = 0$ e $f_y = 4y^3 - 4x = 0$ vem $y = x^3$ e $x = y^3$, logo $x^9 = x$ e os pontos críticos são $(0,0)$, $(1,1)$ e $(-1,-1)$. O discriminante $D = 144x^2y^2 - 16$ vale $-16 < 0$ em $(0,0)$ (sela) e $128 > 0$ nos outros dois, com $f_{xx} = 12 > 0$: mínimos locais. Como $f \to +\infty$ quando $|(x,y)| \to \infty$, o mínimo local é absoluto: $f(1,1) = 1+1-4+5 = 3$.`,
  3,
  () => otimizar((x, y) => x ** 4 + y ** 4 - 4 * x * y + 5, [[-2, 2], [-2, 2]], "min").valor
);

q(
  C2, TM, "Ponto crítico de forma quadrática", "facil",
  R`O valor mínimo de $f(x,y) = x^2 + y^2 + xy - 3x$ é:`,
  R`$-3$`,
  [R`$-1$`, R`$-4$`, R`$-2$`, R`$-6$`],
  R`As condições de ponto crítico são $f_x = 2x + y - 3 = 0$ e $f_y = 2y + x = 0$. Da segunda, $x = -2y$; substituindo na primeira, $-4y + y = 3$, logo $y = -1$ e $x = 2$. Como $f_{xx} = 2 > 0$ e $D = f_{xx}f_{yy} - f_{xy}^2 = 4 - 1 = 3 > 0$, trata-se de mínimo (e absoluto, por ser a forma quadrática definida positiva). O valor é $f(2,-1) = 4 + 1 - 2 - 6 = -3$.`,
  -3,
  () => otimizar((x, y) => x * x + y * y + x * y - 3 * x, [[-4, 6], [-6, 4]], "min").valor
);

q(
  C2, TM, "Lagrange com expoentes distintos", "dificil",
  R`O valor máximo de $f(x,y,z) = x^2y^3z$ com $x + y + z = 12$ e $x, y, z > 0$ é:`,
  R`$6912$`,
  [R`$3456$`, R`$5184$`, R`$8640$`, R`$6144$`],
  R`Por Lagrange, $2xy^3z = \lambda$, $3x^2y^2z = \lambda$ e $x^2y^3 = \lambda$. Dividindo a primeira pela terceira: $\frac{2z}{x} = 1$, isto é $x = 2z$; dividindo a segunda pela terceira: $\frac{3z}{y} = 1$, ou $y = 3z$. A restrição dá $2z + 3z + z = 12$, logo $z = 2$, $x = 4$ e $y = 6$ — os expoentes repartem a soma na proporção $2:3:1$. O máximo é $16\cdot 216\cdot 2 = 6912$.`,
  6912,
  () => otimizar((x, y) => (x + y >= 12 ? -Infinity : x * x * y * y * y * (12 - x - y)), [[0.2, 11], [0.2, 11]], "max").valor,
  { tol: 1e-3 }
);

finalizar("calculo2_lote5.json", 20260916);
