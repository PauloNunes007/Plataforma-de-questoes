// Lote 9 de Cálculo I — 83 questões: Técnicas de Integração (40) e Integral
// Imprópria (43). Última parte da equalização do banco (ver `calculo1_lote5.mjs`
// e o kit `calculo1_kit.mjs`).
//
// As impróprias são o caso em que o VERIFICADOR precisa de mais cuidado que a
// questão: Simpson de passo uniforme não enxerga a cauda de um intervalo
// infinito nem a vizinhança de uma singularidade. Aqui valem as armadilhas já
// catalogadas: blocos diádicos rumo ao infinito (`simpsonInfinito`) e rumo à
// singularidade (`simpsonSingular`), com o ramo que caminha "para trás"
// voltando com o sinal trocado; e integrando que decai como 1/(x ln²x) só
// fecha depois da mudança u = ln x.
//
// Rode: node listas_questoes/gerado/scripts/calculo1_lote9.mjs
import { R, q, finalizar, simpson, simpsonInfinito, simpsonSingular } from "./calculo1_kit.mjs";

// Integral em [0, +inf): parte finita + blocos diádicos.
const deZeroAoInfinito = (f) => simpson(f, 0, 1, 20000) + simpsonInfinito(f, 1);

// ===========================================================================
// TÉCNICAS DE INTEGRAÇÃO — 40
// ===========================================================================

// --- integração por partes --------------------------------------------------
q(
  "Técnicas de Integração", "Por partes com exponencial e fator linear", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}xe^{x}\,dx$.`,
  R`$1$`,
  [R`$e-1$`, R`$e$`, R`$2e-1$`, R`$e+1$`],
  R`Tome $u=x$ e $dv=e^{x}dx$, de modo que $du=dx$ e $v=e^{x}$. Então $\displaystyle\int_{0}^{1}xe^{x}dx=\left[xe^{x}\right]_{0}^{1}-\displaystyle\int_{0}^{1}e^{x}dx=e-\left(e-1\right)=1$.`,
  1,
  () => simpson((x) => x * Math.exp(x), 0, 1)
);

q(
  "Técnicas de Integração", "Por partes com seno", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi}x\operatorname{sen}x\,dx$.`,
  R`$\pi$`,
  [R`$2\pi$`, R`$\dfrac{\pi}{2}$`, R`$\pi-1$`, R`$\dfrac{\pi^{2}}{2}$`],
  R`Com $u=x$ e $dv=\operatorname{sen}x\,dx$, tem-se $v=-\cos x$ e $\displaystyle\int_{0}^{\pi}x\operatorname{sen}x\,dx=\left[-x\cos x\right]_{0}^{\pi}+\displaystyle\int_{0}^{\pi}\cos x\,dx=\pi+0=\pi$.`,
  Math.PI,
  () => simpson((x) => x * Math.sin(x), 0, Math.PI)
);

q(
  "Técnicas de Integração", "Por partes com logaritmo e fator linear", "dificil",
  R`Calcule $\displaystyle\int_{1}^{e}x\ln x\,dx$.`,
  R`$\dfrac{e^{2}+1}{4}$`,
  [R`$\dfrac{e^{2}-1}{4}$`, R`$\dfrac{e^{2}+1}{2}$`, R`$\dfrac{e^{2}}{4}$`, R`$\dfrac{e^{2}-1}{2}$`],
  R`Tome $u=\ln x$ e $dv=x\,dx$, de modo que $v=\dfrac{x^{2}}{2}$. Então a integral vale $\left[\dfrac{x^{2}\ln x}{2}\right]_{1}^{e}-\dfrac{1}{2}\displaystyle\int_{1}^{e}x\,dx=\dfrac{e^{2}}{2}-\dfrac{1}{2}\cdot\dfrac{e^{2}-1}{2}=\dfrac{e^{2}+1}{4}$.`,
  (Math.E ** 2 + 1) / 4,
  () => simpson((x) => x * Math.log(x), 1, Math.E)
);

q(
  "Técnicas de Integração", "Por partes com cosseno num quarto de período", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}x\cos x\,dx$.`,
  R`$\dfrac{\pi}{2}-1$`,
  [R`$\dfrac{\pi}{2}+1$`, R`$1-\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{4}-1$`, R`$\dfrac{\pi}{2}$`],
  R`Com $u=x$ e $dv=\cos x\,dx$, tem-se $v=\operatorname{sen}x$: a integral é $\left[x\operatorname{sen}x\right]_{0}^{\pi/2}-\displaystyle\int_{0}^{\pi/2}\operatorname{sen}x\,dx=\dfrac{\pi}{2}-1$.`,
  Math.PI / 2 - 1,
  () => simpson((x) => x * Math.cos(x), 0, Math.PI / 2)
);

q(
  "Técnicas de Integração", "Por partes com arco-tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\sqrt{3}}\operatorname{arctg}x\,dx$.`,
  R`$\dfrac{\sqrt{3}\pi}{3}-\ln 2$`,
  [
    R`$\dfrac{\sqrt{3}\pi}{3}+\ln 2$`,
    R`$\dfrac{\sqrt{3}\pi}{6}-\ln 2$`,
    R`$\dfrac{\sqrt{3}\pi}{3}-2\ln 2$`,
    R`$\dfrac{\sqrt{3}\pi}{3}-\dfrac{\ln 2}{2}$`,
  ],
  R`Tome $u=\operatorname{arctg}x$ e $dv=dx$: a integral vale $\left[x\operatorname{arctg}x\right]_{0}^{\sqrt{3}}-\displaystyle\int_{0}^{\sqrt{3}}\dfrac{x}{1+x^{2}}dx=\sqrt{3}\cdot\dfrac{\pi}{3}-\dfrac{1}{2}\ln 4=\dfrac{\sqrt{3}\pi}{3}-\ln 2$.`,
  (Math.sqrt(3) * Math.PI) / 3 - Math.log(2),
  () => simpson(Math.atan, 0, Math.sqrt(3))
);

q(
  "Técnicas de Integração", "Por partes com arco-seno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\operatorname{arcsen}x\,dx$.`,
  R`$\dfrac{\pi}{2}-1$`,
  [R`$\dfrac{\pi}{2}+1$`, R`$\dfrac{\pi}{4}-1$`, R`$1-\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{2}$`],
  R`Com $u=\operatorname{arcsen}x$ e $dv=dx$, a integral vale $\left[x\operatorname{arcsen}x\right]_{0}^{1}-\displaystyle\int_{0}^{1}\dfrac{x}{\sqrt{1-x^{2}}}dx=\dfrac{\pi}{2}-\left[-\sqrt{1-x^{2}}\right]_{0}^{1}=\dfrac{\pi}{2}-1$.`,
  Math.PI / 2 - 1,
  () => simpsonSingular(Math.asin, 1, 0) * -1,
  { tol: 1e-3 }
);

q(
  "Técnicas de Integração", "Por partes com logaritmo puro", "medio",
  R`Calcule $\displaystyle\int_{1}^{2}\ln x\,dx$.`,
  R`$2\ln 2-1$`,
  [R`$2\ln 2$`, R`$\ln 2-1$`, R`$2\ln 2+1$`, R`$\ln 2$`],
  R`Tome $u=\ln x$ e $dv=dx$: a integral é $\left[x\ln x-x\right]_{1}^{2}=\left(2\ln 2-2\right)-\left(0-1\right)=2\ln 2-1$.`,
  2 * Math.log(2) - 1,
  () => simpson(Math.log, 1, 2)
);

q(
  "Técnicas de Integração", "Por partes aplicada duas vezes", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}x^{2}e^{x}\,dx$.`,
  R`$e-2$`,
  [R`$e-1$`, R`$2e-4$`, R`$e+2$`, R`$2-e$`],
  R`Na primeira aplicação, com $u=x^{2}$, obtém-se $\left[x^{2}e^{x}\right]_{0}^{1}-2\displaystyle\int_{0}^{1}xe^{x}dx=e-2\displaystyle\int_{0}^{1}xe^{x}dx$. A segunda aplicação dá $\displaystyle\int_{0}^{1}xe^{x}dx=1$, logo o valor é $e-2$.`,
  Math.E - 2,
  () => simpson((x) => x * x * Math.exp(x), 0, 1)
);

q(
  "Técnicas de Integração", "Por partes duas vezes com cosseno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi}x^{2}\cos x\,dx$.`,
  R`$-2\pi$`,
  [R`$2\pi$`, R`$-\pi$`, R`$-4\pi$`, R`$\pi^{2}$`],
  R`Aplicando partes duas vezes, uma primitiva é $x^{2}\operatorname{sen}x+2x\cos x-2\operatorname{sen}x$. Em $x=\pi$ isso vale $0-2\pi-0=-2\pi$, e em $x=0$ vale $0$. A integral é $-2\pi$.`,
  -2 * Math.PI,
  () => simpson((x) => x * x * Math.cos(x), 0, Math.PI)
);

q(
  "Técnicas de Integração", "Integração por partes cíclica", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}e^{x}\cos x\,dx$.`,
  R`$\dfrac{e^{\pi/2}-1}{2}$`,
  [R`$\dfrac{e^{\pi/2}+1}{2}$`, R`$e^{\pi/2}-1$`, R`$\dfrac{e^{\pi/2}}{2}$`, R`$\dfrac{e^{\pi/2}-1}{4}$`],
  R`Chamando $I$ a integral indefinida e aplicando partes duas vezes, reaparece $I$ com sinal trocado, o que dá $I=\dfrac{e^{x}\left(\operatorname{sen}x+\cos x\right)}{2}$. Avaliando, $\dfrac{e^{\pi/2}\left(1+0\right)}{2}-\dfrac{1\left(0+1\right)}{2}=\dfrac{e^{\pi/2}-1}{2}$.`,
  (Math.exp(Math.PI / 2) - 1) / 2,
  () => simpson((x) => Math.exp(x) * Math.cos(x), 0, Math.PI / 2)
);

q(
  "Técnicas de Integração", "Por partes com quadrado de logaritmo", "dificil",
  R`Calcule $\displaystyle\int_{1}^{e}\left(\ln x\right)^{2}dx$.`,
  R`$e-2$`,
  [R`$e-1$`, R`$2e-2$`, R`$e+2$`, R`$2-e$`],
  R`Com $u=\left(\ln x\right)^{2}$ e $dv=dx$, a integral vale $\left[x\left(\ln x\right)^{2}\right]_{1}^{e}-2\displaystyle\int_{1}^{e}\ln x\,dx=e-2\left[x\ln x-x\right]_{1}^{e}=e-2\left(0+1\right)=e-2$.`,
  Math.E - 2,
  () => simpson((x) => Math.log(x) ** 2, 1, Math.E)
);

q(
  "Técnicas de Integração", "Por partes com exponencial de argumento duplo", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1/2}xe^{2x}\,dx$.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{e}{4}$`, R`$\dfrac{e-1}{4}$`, R`$\dfrac{1}{8}$`],
  R`Com $u=x$ e $dv=e^{2x}dx$, tem-se $v=\dfrac{e^{2x}}{2}$ e a integral vale $\left[\dfrac{xe^{2x}}{2}\right]_{0}^{1/2}-\dfrac{1}{2}\displaystyle\int_{0}^{1/2}e^{2x}dx=\dfrac{e}{4}-\dfrac{e-1}{4}=\dfrac{1}{4}$.`,
  1 / 4,
  () => simpson((x) => x * Math.exp(2 * x), 0, 0.5)
);

// --- substituição trigonométrica --------------------------------------------
q(
  "Técnicas de Integração", "Substituição trigonométrica com seno", "medio",
  R`Calcule $\displaystyle\int_{0}^{2}\sqrt{4-x^{2}}\,dx$.`,
  R`$\pi$`,
  [R`$2\pi$`, R`$\dfrac{\pi}{2}$`, R`$4\pi$`, R`$\dfrac{3\pi}{2}$`],
  R`Com $x=2\operatorname{sen}\theta$, tem-se $dx=2\cos\theta\,d\theta$ e $\sqrt{4-x^{2}}=2\cos\theta$, de modo que a integral vira $4\displaystyle\int_{0}^{\pi/2}\cos^{2}\theta\,d\theta=4\cdot\dfrac{\pi}{4}=\pi$. Geometricamente é o quarto de disco de raio $2$.`,
  Math.PI,
  () => simpson((x) => Math.sqrt(4 - x * x), 0, 2, 400000),
  { tol: 1e-3 }
);

q(
  "Técnicas de Integração", "Substituição trigonométrica com tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{\left(1+x^{2}\right)^{2}}$.`,
  R`$\dfrac{\pi}{8}+\dfrac{1}{4}$`,
  [R`$\dfrac{\pi}{8}-\dfrac{1}{4}$`, R`$\dfrac{\pi}{4}+\dfrac{1}{2}$`, R`$\dfrac{\pi}{8}$`, R`$\dfrac{\pi}{16}+\dfrac{1}{4}$`],
  R`Com $x=\operatorname{tg}\theta$, tem-se $dx=\sec^{2}\theta\,d\theta$ e $\left(1+x^{2}\right)^{2}=\sec^{4}\theta$, o que reduz a integral a $\displaystyle\int_{0}^{\pi/4}\cos^{2}\theta\,d\theta=\dfrac{\pi}{8}+\dfrac{1}{4}$.`,
  Math.PI / 8 + 1 / 4,
  () => simpson((x) => 1 / (1 + x * x) ** 2, 0, 1)
);

q(
  "Técnicas de Integração", "Substituição trigonométrica com potência três meios", "dificil",
  R`Calcule $\displaystyle\int_{0}^{2}\dfrac{dx}{\left(x^{2}+4\right)^{3/2}}$.`,
  R`$\dfrac{\sqrt{2}}{8}$`,
  [R`$\dfrac{\sqrt{2}}{4}$`, R`$\dfrac{\sqrt{2}}{16}$`, R`$\dfrac{1}{8}$`, R`$\dfrac{\sqrt{2}}{2}$`],
  R`Com $x=2\operatorname{tg}\theta$, a integral vira $\dfrac{1}{4}\displaystyle\int\cos\theta\,d\theta$, cuja primitiva é $\dfrac{\operatorname{sen}\theta}{4}=\dfrac{x}{4\sqrt{x^{2}+4}}$. Avaliando de $0$ a $2$: $\dfrac{2}{4\sqrt{8}}=\dfrac{1}{8\sqrt{2}/2\cdot2}=\dfrac{\sqrt{2}}{8}$.`,
  Math.SQRT2 / 8,
  () => simpson((x) => 1 / Math.pow(x * x + 4, 1.5), 0, 2)
);

q(
  "Técnicas de Integração", "Substituição trigonométrica com quadrado no numerador", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\sqrt{2}}\dfrac{x^{2}}{\sqrt{4-x^{2}}}\,dx$.`,
  R`$\dfrac{\pi}{2}-1$`,
  [R`$\dfrac{\pi}{2}+1$`, R`$\dfrac{\pi}{4}-1$`, R`$\dfrac{\pi}{2}-2$`, R`$\dfrac{\pi}{3}-1$`],
  R`Com $x=2\operatorname{sen}\theta$, o limite superior vira $\theta=\dfrac{\pi}{4}$ e a integral fica $4\displaystyle\int_{0}^{\pi/4}\operatorname{sen}^{2}\theta\,d\theta=2\left[\theta-\operatorname{sen}\theta\cos\theta\right]_{0}^{\pi/4}=2\left(\dfrac{\pi}{4}-\dfrac{1}{2}\right)=\dfrac{\pi}{2}-1$.`,
  Math.PI / 2 - 1,
  () => simpson((x) => (x * x) / Math.sqrt(4 - x * x), 0, Math.SQRT2)
);

q(
  "Técnicas de Integração", "Substituição trigonométrica com secante", "dificil",
  R`Calcule $\displaystyle\int_{0}^{3}\dfrac{dx}{\sqrt{x^{2}+9}}$.`,
  R`$\ln\left(1+\sqrt{2}\right)$`,
  [R`$\ln\left(3+\sqrt{2}\right)$`, R`$\ln\left(1+\sqrt{3}\right)$`, R`$2\ln\left(1+\sqrt{2}\right)$`, R`$\ln\left(\sqrt{2}-1\right)$`],
  R`Com $x=3\operatorname{tg}\theta$, a integral vira $\displaystyle\int\sec\theta\,d\theta=\ln\left|\sec\theta+\operatorname{tg}\theta\right|$, isto é, $\left[\ln\left(x+\sqrt{x^{2}+9}\right)\right]_{0}^{3}=\ln\left(3+3\sqrt{2}\right)-\ln 3=\ln\left(1+\sqrt{2}\right)$.`,
  Math.log(1 + Math.SQRT2),
  () => simpson((x) => 1 / Math.sqrt(x * x + 9), 0, 3)
);

q(
  "Técnicas de Integração", "Substituição trigonométrica com raiz de x ao quadrado menos um", "dificil",
  R`Calcule $\displaystyle\int_{\sqrt{2}}^{2}\dfrac{dx}{x^{2}\sqrt{x^{2}-1}}$.`,
  R`$\dfrac{\sqrt{3}-\sqrt{2}}{2}$`,
  [R`$\dfrac{\sqrt{3}+\sqrt{2}}{2}$`, R`$\dfrac{\sqrt{3}-\sqrt{2}}{4}$`, R`$\sqrt{3}-\sqrt{2}$`, R`$\dfrac{\sqrt{3}}{2}$`],
  R`Com $x=\sec\theta$, tem-se $dx=\sec\theta\operatorname{tg}\theta\,d\theta$ e $\sqrt{x^{2}-1}=\operatorname{tg}\theta$, de modo que a integral vira $\displaystyle\int\cos\theta\,d\theta=\operatorname{sen}\theta=\dfrac{\sqrt{x^{2}-1}}{x}$. Avaliando, $\dfrac{\sqrt{3}}{2}-\dfrac{1}{\sqrt{2}}=\dfrac{\sqrt{3}-\sqrt{2}}{2}$.`,
  (Math.sqrt(3) - Math.SQRT2) / 2,
  () => simpson((x) => 1 / (x * x * Math.sqrt(x * x - 1)), Math.SQRT2, 2)
);

q(
  "Técnicas de Integração", "Substituição trigonométrica com potência ímpar no denominador", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1/2}\dfrac{dx}{\left(1-x^{2}\right)^{3/2}}$.`,
  R`$\dfrac{\sqrt{3}}{3}$`,
  [R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{2\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{3}}{6}$`, R`$\dfrac{\sqrt{2}}{2}$`],
  R`Com $x=\operatorname{sen}\theta$, a integral vira $\displaystyle\int\sec^{2}\theta\,d\theta=\operatorname{tg}\theta=\dfrac{x}{\sqrt{1-x^{2}}}$. Em $x=\dfrac{1}{2}$: $\dfrac{1/2}{\sqrt{3}/2}=\dfrac{1}{\sqrt{3}}=\dfrac{\sqrt{3}}{3}$.`,
  Math.sqrt(3) / 3,
  () => simpson((x) => 1 / Math.pow(1 - x * x, 1.5), 0, 0.5)
);

q(
  "Técnicas de Integração", "Substituição trigonométrica com produto de seno e cosseno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{2}x^{2}\sqrt{4-x^{2}}\,dx$.`,
  R`$\pi$`,
  [R`$2\pi$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{4\pi}{3}$`, R`$\dfrac{3\pi}{2}$`],
  R`Com $x=2\operatorname{sen}\theta$, a integral vira $16\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{2}\theta\cos^{2}\theta\,d\theta=4\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{2}2\theta\,d\theta=4\cdot\dfrac{\pi}{4}=\pi$, usando $\operatorname{sen}\theta\cos\theta=\dfrac{\operatorname{sen}2\theta}{2}$.`,
  Math.PI,
  () => simpson((x) => x * x * Math.sqrt(4 - x * x), 0, 2, 400000),
  { tol: 1e-3 }
);

// --- frações parciais --------------------------------------------------------
q(
  "Técnicas de Integração", "Frações parciais com dois fatores lineares", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{\left(x+1\right)\left(x+2\right)}$.`,
  R`$\ln\dfrac{4}{3}$`,
  [R`$\ln\dfrac{3}{4}$`, R`$\ln\dfrac{2}{3}$`, R`$\ln\dfrac{3}{2}$`, R`$\ln\dfrac{8}{3}$`],
  R`Decompondo, $\dfrac{1}{\left(x+1\right)\left(x+2\right)}=\dfrac{1}{x+1}-\dfrac{1}{x+2}$. A primitiva é $\ln\dfrac{x+1}{x+2}$, e a integral vale $\ln\dfrac{2}{3}-\ln\dfrac{1}{2}=\ln\dfrac{4}{3}$.`,
  Math.log(4 / 3),
  () => simpson((x) => 1 / ((x + 1) * (x + 2)), 0, 1)
);

q(
  "Técnicas de Integração", "Frações parciais numa diferença de quadrados", "dificil",
  R`Calcule $\displaystyle\int_{3}^{4}\dfrac{dx}{x^{2}-4}$.`,
  R`$\dfrac{1}{4}\ln\dfrac{5}{3}$`,
  [R`$\dfrac{1}{4}\ln\dfrac{3}{5}$`, R`$\dfrac{1}{2}\ln\dfrac{5}{3}$`, R`$\dfrac{1}{4}\ln\dfrac{5}{2}$`, R`$\ln\dfrac{5}{3}$`],
  R`Como $\dfrac{1}{x^{2}-4}=\dfrac{1}{4}\left(\dfrac{1}{x-2}-\dfrac{1}{x+2}\right)$, a primitiva é $\dfrac{1}{4}\ln\left|\dfrac{x-2}{x+2}\right|$. Avaliando, $\dfrac{1}{4}\left(\ln\dfrac{2}{6}-\ln\dfrac{1}{5}\right)=\dfrac{1}{4}\ln\dfrac{5}{3}$.`,
  0.25 * Math.log(5 / 3),
  () => simpson((x) => 1 / (x * x - 4), 3, 4)
);

q(
  "Técnicas de Integração", "Frações parciais com numerador de grau um", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x+3}{\left(x+1\right)\left(x+2\right)}\,dx$.`,
  R`$\ln\dfrac{8}{3}$`,
  [R`$\ln\dfrac{3}{8}$`, R`$\ln\dfrac{4}{3}$`, R`$\ln\dfrac{9}{4}$`, R`$\ln\dfrac{16}{3}$`],
  R`Escreva $\dfrac{x+3}{\left(x+1\right)\left(x+2\right)}=\dfrac{2}{x+1}-\dfrac{1}{x+2}$ (com $x=-1$ sai $A=2$; com $x=-2$ sai $B=-1$). A primitiva é $2\ln\left|x+1\right|-\ln\left|x+2\right|$, e a integral vale $\left(2\ln 2-\ln 3\right)-\left(0-\ln 2\right)=3\ln 2-\ln 3=\ln\dfrac{8}{3}$.`,
  Math.log(8 / 3),
  () => simpson((x) => (x + 3) / ((x + 1) * (x + 2)), 0, 1)
);

q(
  "Técnicas de Integração", "Frações parciais com fator x no denominador", "dificil",
  R`Calcule $\displaystyle\int_{1}^{2}\dfrac{3x+1}{x\left(x+1\right)}\,dx$.`,
  R`$\ln\dfrac{9}{2}$`,
  [R`$\ln\dfrac{2}{9}$`, R`$\ln\dfrac{9}{4}$`, R`$\ln\dfrac{3}{2}$`, R`$\ln\dfrac{27}{4}$`],
  R`Decompondo, $\dfrac{3x+1}{x\left(x+1\right)}=\dfrac{1}{x}+\dfrac{2}{x+1}$. A primitiva é $\ln\left|x\right|+2\ln\left|x+1\right|$, e a integral vale $\left(\ln 2+2\ln 3\right)-\left(0+2\ln 2\right)=2\ln 3-\ln 2=\ln\dfrac{9}{2}$.`,
  Math.log(9 / 2),
  () => simpson((x) => (3 * x + 1) / (x * (x + 1)), 1, 2)
);

q(
  "Técnicas de Integração", "Frações parciais com numerador x", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x}{\left(x+1\right)\left(x+2\right)}\,dx$.`,
  R`$\ln\dfrac{9}{8}$`,
  [R`$\ln\dfrac{8}{9}$`, R`$\ln\dfrac{9}{4}$`, R`$\ln\dfrac{3}{2}$`, R`$\ln\dfrac{4}{3}$`],
  R`Decompondo, $\dfrac{x}{\left(x+1\right)\left(x+2\right)}=\dfrac{-1}{x+1}+\dfrac{2}{x+2}$. A primitiva é $-\ln\left|x+1\right|+2\ln\left|x+2\right|$, e a integral vale $\left(-\ln 2+2\ln 3\right)-\left(0+2\ln 2\right)=2\ln 3-3\ln 2=\ln\dfrac{9}{8}$.`,
  Math.log(9 / 8),
  () => simpson((x) => x / ((x + 1) * (x + 2)), 0, 1)
);

q(
  "Técnicas de Integração", "Denominador quadrático irredutível", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{x^{2}+x+1}$.`,
  R`$\dfrac{\pi\sqrt{3}}{9}$`,
  [R`$\dfrac{\pi\sqrt{3}}{3}$`, R`$\dfrac{\pi\sqrt{3}}{18}$`, R`$\dfrac{\pi}{9}$`, R`$\dfrac{2\pi\sqrt{3}}{9}$`],
  R`Complete o quadrado: $x^{2}+x+1=\left(x+\dfrac{1}{2}\right)^{2}+\dfrac{3}{4}$. A primitiva é $\dfrac{2}{\sqrt{3}}\operatorname{arctg}\dfrac{2x+1}{\sqrt{3}}$, e a integral vale $\dfrac{2}{\sqrt{3}}\left(\dfrac{\pi}{3}-\dfrac{\pi}{6}\right)=\dfrac{2}{\sqrt{3}}\cdot\dfrac{\pi}{6}=\dfrac{\pi\sqrt{3}}{9}$.`,
  (Math.PI * Math.sqrt(3)) / 9,
  () => simpson((x) => 1 / (x * x + x + 1), 0, 1)
);

q(
  "Técnicas de Integração", "Frações parciais com raízes simétricas", "medio",
  R`Calcule $\displaystyle\int_{2}^{3}\dfrac{dx}{x^{2}-1}$.`,
  R`$\dfrac{1}{2}\ln\dfrac{3}{2}$`,
  [R`$\dfrac{1}{2}\ln\dfrac{2}{3}$`, R`$\ln\dfrac{3}{2}$`, R`$\dfrac{1}{4}\ln\dfrac{3}{2}$`, R`$\dfrac{1}{2}\ln 3$`],
  R`Como $\dfrac{1}{x^{2}-1}=\dfrac{1}{2}\left(\dfrac{1}{x-1}-\dfrac{1}{x+1}\right)$, a primitiva é $\dfrac{1}{2}\ln\left|\dfrac{x-1}{x+1}\right|$. Avaliando, $\dfrac{1}{2}\left(\ln\dfrac{2}{4}-\ln\dfrac{1}{3}\right)=\dfrac{1}{2}\ln\dfrac{3}{2}$.`,
  0.5 * Math.log(3 / 2),
  () => simpson((x) => 1 / (x * x - 1), 2, 3)
);

q(
  "Técnicas de Integração", "Divisão de polinômios antes de integrar", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x^{2}}{x+1}\,dx$.`,
  R`$\ln 2-\dfrac{1}{2}$`,
  [R`$\ln 2+\dfrac{1}{2}$`, R`$\dfrac{1}{2}-\ln 2$`, R`$\ln 2-1$`, R`$2\ln 2-\dfrac{1}{2}$`],
  R`O grau do numerador não é menor que o do denominador, então divida primeiro: $\dfrac{x^{2}}{x+1}=x-1+\dfrac{1}{x+1}$. A integral vale $\dfrac{1}{2}-1+\ln 2=\ln 2-\dfrac{1}{2}$.`,
  Math.log(2) - 0.5,
  () => simpson((x) => (x * x) / (x + 1), 0, 1)
);

q(
  "Técnicas de Integração", "Numerador separado em logaritmo e arco-tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{2x+3}{x^{2}+1}\,dx$.`,
  R`$\ln 2+\dfrac{3\pi}{4}$`,
  [R`$\ln 2+\dfrac{\pi}{4}$`, R`$2\ln 2+\dfrac{3\pi}{4}$`, R`$\ln 2-\dfrac{3\pi}{4}$`, R`$\ln 2+\dfrac{3\pi}{2}$`],
  R`Separe em duas parcelas: $\displaystyle\int_{0}^{1}\dfrac{2x}{x^{2}+1}dx=\left[\ln\left(x^{2}+1\right)\right]_{0}^{1}=\ln 2$ e $3\displaystyle\int_{0}^{1}\dfrac{dx}{x^{2}+1}=3\cdot\dfrac{\pi}{4}$. A soma é $\ln 2+\dfrac{3\pi}{4}$.`,
  Math.log(2) + (3 * Math.PI) / 4,
  () => simpson((x) => (2 * x + 3) / (x * x + 1), 0, 1)
);

q(
  "Técnicas de Integração", "Frações parciais com fator repetido", "dificil",
  R`Calcule $\displaystyle\int_{1}^{2}\dfrac{dx}{x^{2}\left(x+1\right)}$.`,
  R`$\dfrac{1}{2}-\ln\dfrac{4}{3}$`,
  [R`$\dfrac{1}{2}+\ln\dfrac{4}{3}$`, R`$\dfrac{1}{2}-\ln\dfrac{3}{4}$`, R`$1-\ln\dfrac{4}{3}$`, R`$\dfrac{1}{4}-\ln\dfrac{4}{3}$`],
  R`O fator repetido exige três parcelas: $\dfrac{1}{x^{2}\left(x+1\right)}=-\dfrac{1}{x}+\dfrac{1}{x^{2}}+\dfrac{1}{x+1}$. A primitiva é $\ln\left|\dfrac{x+1}{x}\right|-\dfrac{1}{x}$, e a integral vale $\left(\ln\dfrac{3}{2}-\dfrac{1}{2}\right)-\left(\ln 2-1\right)=\dfrac{1}{2}+\ln\dfrac{3}{4}=\dfrac{1}{2}-\ln\dfrac{4}{3}$.`,
  0.5 - Math.log(4 / 3),
  () => simpson((x) => 1 / (x * x * (x + 1)), 1, 2)
);

// --- potências de funções trigonométricas -----------------------------------
q(
  "Técnicas de Integração", "Potência ímpar de cosseno com potência par de seno", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{2}x\cos^{3}x\,dx$.`,
  R`$\dfrac{2}{15}$`,
  [R`$\dfrac{1}{15}$`, R`$\dfrac{4}{15}$`, R`$\dfrac{2}{5}$`, R`$\dfrac{8}{15}$`],
  R`Separe um cosseno e troque o resto por seno: $\cos^{3}x=\left(1-\operatorname{sen}^{2}x\right)\cos x$. Com $u=\operatorname{sen}x$, a integral vira $\displaystyle\int_{0}^{1}\left(u^{2}-u^{4}\right)du=\dfrac{1}{3}-\dfrac{1}{5}=\dfrac{2}{15}$.`,
  2 / 15,
  () => simpson((x) => Math.sin(x) ** 2 * Math.cos(x) ** 3, 0, Math.PI / 2)
);

q(
  "Técnicas de Integração", "Quadrado da tangente", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/4}\operatorname{tg}^{2}x\,dx$.`,
  R`$1-\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{4}-1$`, R`$1+\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{4}$`, R`$1-\dfrac{\pi}{2}$`],
  R`Use a identidade $\operatorname{tg}^{2}x=\sec^{2}x-1$: a primitiva é $\operatorname{tg}x-x$, e a integral vale $\left(1-\dfrac{\pi}{4}\right)-0=1-\dfrac{\pi}{4}$.`,
  1 - Math.PI / 4,
  () => simpson((x) => Math.tan(x) ** 2, 0, Math.PI / 4)
);

q(
  "Técnicas de Integração", "Cubo da secante por partes", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/4}\sec^{3}x\,dx$.`,
  R`$\dfrac{\sqrt{2}+\ln\left(1+\sqrt{2}\right)}{2}$`,
  [
    R`$\dfrac{\sqrt{2}-\ln\left(1+\sqrt{2}\right)}{2}$`,
    R`$\sqrt{2}+\ln\left(1+\sqrt{2}\right)$`,
    R`$\dfrac{\sqrt{2}+\ln\left(1+\sqrt{2}\right)}{4}$`,
    R`$\dfrac{\sqrt{2}+2\ln\left(1+\sqrt{2}\right)}{2}$`,
  ],
  R`Escreva $\sec^{3}=\sec\cdot\sec^{2}$ e integre por partes com $u=\sec x$: a integral reaparece, e resulta $\displaystyle\int\sec^{3}x\,dx=\dfrac{\sec x\operatorname{tg}x+\ln\left|\sec x+\operatorname{tg}x\right|}{2}$. Em $\dfrac{\pi}{4}$: $\dfrac{\sqrt{2}\cdot1+\ln\left(\sqrt{2}+1\right)}{2}$, e em $0$ vale $0$.`,
  (Math.SQRT2 + Math.log(1 + Math.SQRT2)) / 2,
  () => simpson((x) => 1 / Math.cos(x) ** 3, 0, Math.PI / 4)
);

q(
  "Técnicas de Integração", "Quarta potência do seno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi}\operatorname{sen}^{4}x\,dx$.`,
  R`$\dfrac{3\pi}{8}$`,
  [R`$\dfrac{\pi}{8}$`, R`$\dfrac{3\pi}{4}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{3\pi}{16}$`],
  R`Aplique duas vezes o arco duplo: $\operatorname{sen}^{4}x=\left(\dfrac{1-\cos 2x}{2}\right)^{2}=\dfrac{1}{4}\left(1-2\cos 2x+\dfrac{1+\cos 4x}{2}\right)$. Integrando em $\left[0,\pi\right]$, só sobram os termos constantes: $\dfrac{1}{4}\left(\pi+\dfrac{\pi}{2}\right)=\dfrac{3\pi}{8}$.`,
  (3 * Math.PI) / 8,
  () => simpson((x) => Math.sin(x) ** 4, 0, Math.PI)
);

q(
  "Técnicas de Integração", "Quinta potência do cosseno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\cos^{5}x\,dx$.`,
  R`$\dfrac{8}{15}$`,
  [R`$\dfrac{4}{15}$`, R`$\dfrac{2}{15}$`, R`$\dfrac{16}{15}$`, R`$\dfrac{3}{8}$`],
  R`Separe um cosseno: $\cos^{5}x=\left(1-\operatorname{sen}^{2}x\right)^{2}\cos x$. Com $u=\operatorname{sen}x$, a integral vira $\displaystyle\int_{0}^{1}\left(1-2u^{2}+u^{4}\right)du=1-\dfrac{2}{3}+\dfrac{1}{5}=\dfrac{8}{15}$.`,
  8 / 15,
  () => simpson((x) => Math.cos(x) ** 5, 0, Math.PI / 2)
);

q(
  "Técnicas de Integração", "Cubo da tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/3}\operatorname{tg}^{3}x\,dx$.`,
  R`$\dfrac{3}{2}-\ln 2$`,
  [R`$\dfrac{3}{2}+\ln 2$`, R`$\dfrac{1}{2}-\ln 2$`, R`$3-\ln 2$`, R`$\dfrac{3}{2}-2\ln 2$`],
  R`Escreva $\operatorname{tg}^{3}x=\operatorname{tg}x\left(\sec^{2}x-1\right)$. A primitiva é $\dfrac{\operatorname{tg}^{2}x}{2}+\ln\left|\cos x\right|$, e em $\dfrac{\pi}{3}$ vale $\dfrac{3}{2}+\ln\dfrac{1}{2}=\dfrac{3}{2}-\ln 2$; em $0$ vale $0$.`,
  1.5 - Math.log(2),
  () => simpson((x) => Math.tan(x) ** 3, 0, Math.PI / 3)
);

q(
  "Técnicas de Integração", "Cubo do seno", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{3}x\,dx$.`,
  R`$\dfrac{2}{3}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{4}{3}$`, R`$\dfrac{3}{4}$`, R`$\dfrac{8}{15}$`],
  R`Separe um seno: $\operatorname{sen}^{3}x=\left(1-\cos^{2}x\right)\operatorname{sen}x$. Com $u=\cos x$, a integral vira $\displaystyle\int_{0}^{1}\left(1-u^{2}\right)du=1-\dfrac{1}{3}=\dfrac{2}{3}$.`,
  2 / 3,
  () => simpson((x) => Math.sin(x) ** 3, 0, Math.PI / 2)
);

q(
  "Técnicas de Integração", "Produto de quadrados de seno e cosseno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi}\operatorname{sen}^{2}x\cos^{2}x\,dx$.`,
  R`$\dfrac{\pi}{8}$`,
  [R`$\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{16}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{3\pi}{8}$`],
  R`Use $\operatorname{sen}x\cos x=\dfrac{\operatorname{sen}2x}{2}$: o integrando é $\dfrac{\operatorname{sen}^{2}2x}{4}=\dfrac{1-\cos 4x}{8}$. Integrando em $\left[0,\pi\right]$, o cosseno some e resta $\dfrac{\pi}{8}$.`,
  Math.PI / 8,
  () => simpson((x) => Math.sin(x) ** 2 * Math.cos(x) ** 2, 0, Math.PI)
);

q(
  "Técnicas de Integração", "Quarta potência da tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/4}\operatorname{tg}^{4}x\,dx$.`,
  R`$\dfrac{\pi}{4}-\dfrac{2}{3}$`,
  [R`$\dfrac{2}{3}-\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{4}+\dfrac{2}{3}$`, R`$\dfrac{\pi}{4}-\dfrac{1}{3}$`, R`$\dfrac{\pi}{2}-\dfrac{2}{3}$`],
  R`Escreva $\operatorname{tg}^{4}=\operatorname{tg}^{2}\left(\sec^{2}-1\right)=\operatorname{tg}^{2}\sec^{2}-\sec^{2}+1$. A primitiva é $\dfrac{\operatorname{tg}^{3}x}{3}-\operatorname{tg}x+x$, e em $\dfrac{\pi}{4}$ vale $\dfrac{1}{3}-1+\dfrac{\pi}{4}=\dfrac{\pi}{4}-\dfrac{2}{3}$.`,
  Math.PI / 4 - 2 / 3,
  () => simpson((x) => Math.tan(x) ** 4, 0, Math.PI / 4)
);

q(
  "Técnicas de Integração", "Potências pares de seno e cosseno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{2}x\cos^{4}x\,dx$.`,
  R`$\dfrac{\pi}{32}$`,
  [R`$\dfrac{\pi}{16}$`, R`$\dfrac{\pi}{64}$`, R`$\dfrac{3\pi}{32}$`, R`$\dfrac{\pi}{8}$`],
  R`Como as duas potências são pares, use os arcos duplos: $\operatorname{sen}^{2}x\cos^{4}x=\dfrac{\operatorname{sen}^{2}2x}{4}\cdot\dfrac{1+\cos 2x}{2}$. Expandindo e integrando em $\left[0,\dfrac{\pi}{2}\right]$, o termo com $\operatorname{sen}^{2}2x\cos 2x$ se anula e resta $\dfrac{1}{8}\cdot\dfrac{\pi}{4}=\dfrac{\pi}{32}$.`,
  Math.PI / 32,
  () => simpson((x) => Math.sin(x) ** 2 * Math.cos(x) ** 4, 0, Math.PI / 2)
);

// ===========================================================================
// INTEGRAL IMPRÓPRIA — 43
// ===========================================================================

// --- intervalo infinito ------------------------------------------------------
q(
  "Integral Imprópria", "Potência inteira em intervalo infinito", "medio",
  R`Calcule $\displaystyle\int_{1}^{+\infty}\dfrac{dx}{x^{3}}$.`,
  R`$\dfrac{1}{2}$`,
  [R`$1$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{4}$`, R`$2$`],
  R`Por definição, $\displaystyle\int_{1}^{b}x^{-3}dx=\left[-\dfrac{1}{2x^{2}}\right]_{1}^{b}=\dfrac{1}{2}-\dfrac{1}{2b^{2}}$, que tende a $\dfrac{1}{2}$ quando $b\to+\infty$. A integral converge porque o expoente é maior que $1$.`,
  1 / 2,
  () => simpsonInfinito((x) => 1 / x ** 3, 1)
);

q(
  "Integral Imprópria", "Expoente fracionário maior que um", "medio",
  R`Calcule $\displaystyle\int_{1}^{+\infty}\dfrac{dx}{x^{3/2}}$.`,
  R`$2$`,
  [R`$1$`, R`$\dfrac{3}{2}$`, R`$3$`, R`$\dfrac{2}{3}$`],
  R`Tem-se $\displaystyle\int_{1}^{b}x^{-3/2}dx=\left[-2x^{-1/2}\right]_{1}^{b}=2-\dfrac{2}{\sqrt{b}}\to2$. Como $\dfrac{3}{2}>1$, a integral converge.`,
  2,
  () => simpsonInfinito((x) => Math.pow(x, -1.5), 1)
);

q(
  "Integral Imprópria", "Exponencial decrescente na semirreta", "medio",
  R`Calcule $\displaystyle\int_{0}^{+\infty}e^{-3x}dx$.`,
  R`$\dfrac{1}{3}$`,
  [R`$3$`, R`$1$`, R`$\dfrac{1}{9}$`, R`$\dfrac{2}{3}$`],
  R`Tem-se $\displaystyle\int_{0}^{b}e^{-3x}dx=\left[-\dfrac{e^{-3x}}{3}\right]_{0}^{b}=\dfrac{1-e^{-3b}}{3}\to\dfrac{1}{3}$.`,
  1 / 3,
  () => deZeroAoInfinito((x) => Math.exp(-3 * x))
);

q(
  "Integral Imprópria", "Exponencial vezes fator linear", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}xe^{-x}dx$.`,
  R`$1$`,
  [R`$2$`, R`$\dfrac{1}{2}$`, R`$e$`, R`$\dfrac{1}{e}$`],
  R`Integrando por partes, uma primitiva é $-\left(x+1\right)e^{-x}$. Então $\displaystyle\int_{0}^{b}xe^{-x}dx=1-\dfrac{b+1}{e^{b}}\to1$, pois a exponencial domina o polinômio.`,
  1,
  () => deZeroAoInfinito((x) => x * Math.exp(-x))
);

q(
  "Integral Imprópria", "Exponencial vezes fator quadrático", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}x^{2}e^{-x}dx$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$\dfrac{1}{2}$`, R`$6$`],
  R`Duas integrações por partes dão a primitiva $-\left(x^{2}+2x+2\right)e^{-x}$, de modo que a integral vale $2$. É o caso $n=2$ da fórmula $\displaystyle\int_{0}^{\infty}x^{n}e^{-x}dx=n!$.`,
  2,
  () => deZeroAoInfinito((x) => x * x * Math.exp(-x))
);

q(
  "Integral Imprópria", "Arco-tangente na semirreta", "medio",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\dfrac{dx}{1+x^{2}}$.`,
  R`$\dfrac{\pi}{2}$`,
  [R`$\pi$`, R`$\dfrac{\pi}{4}$`, R`$2\pi$`, R`$\dfrac{\pi}{3}$`],
  R`A primitiva é $\operatorname{arctg}x$, e $\operatorname{arctg}b\to\dfrac{\pi}{2}$ quando $b\to+\infty$. Logo a integral converge e vale $\dfrac{\pi}{2}$.`,
  Math.PI / 2,
  () => deZeroAoInfinito((x) => 1 / (1 + x * x))
);

q(
  "Integral Imprópria", "Integral em toda a reta com arco-tangente", "medio",
  R`Calcule $\displaystyle\int_{-\infty}^{+\infty}\dfrac{dx}{1+x^{2}}$.`,
  R`$\pi$`,
  [R`$\dfrac{\pi}{2}$`, R`$2\pi$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{3\pi}{2}$`],
  R`Quebre em $\left(-\infty,0\right]$ e $\left[0,+\infty\right)$; cada pedaço vale $\dfrac{\pi}{2}$ por simetria, e a soma é $\pi$. Quando os DOIS extremos são infinitos, a definição exige que cada metade convirja separadamente — aqui, ambas convergem.`,
  Math.PI,
  () => 2 * deZeroAoInfinito((x) => 1 / (1 + x * x))
);

q(
  "Integral Imprópria", "Denominador com constante somada", "medio",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\dfrac{dx}{x^{2}+4}$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{8}$`, R`$\dfrac{\pi}{16}$`, R`$\pi$`],
  R`A primitiva é $\dfrac{1}{2}\operatorname{arctg}\dfrac{x}{2}$, que tende a $\dfrac{1}{2}\cdot\dfrac{\pi}{2}=\dfrac{\pi}{4}$ quando $x\to+\infty$, e vale $0$ em $x=0$.`,
  Math.PI / 4,
  () => deZeroAoInfinito((x) => 1 / (x * x + 4))
);

q(
  "Integral Imprópria", "Frações parciais em intervalo infinito", "dificil",
  R`Calcule $\displaystyle\int_{2}^{+\infty}\dfrac{dx}{x^{2}-1}$.`,
  R`$\dfrac{\ln 3}{2}$`,
  [R`$\ln 3$`, R`$\dfrac{\ln 3}{4}$`, R`$\dfrac{\ln 2}{2}$`, R`$\dfrac{\ln 5}{2}$`],
  R`A primitiva é $\dfrac{1}{2}\ln\dfrac{x-1}{x+1}$, cujo limite em $+\infty$ é $\dfrac{1}{2}\ln 1=0$. Em $x=2$ ela vale $\dfrac{1}{2}\ln\dfrac{1}{3}$, logo a integral é $0-\dfrac{1}{2}\ln\dfrac{1}{3}=\dfrac{\ln 3}{2}$.`,
  Math.log(3) / 2,
  () => simpsonInfinito((x) => 1 / (x * x - 1), 2)
);

q(
  "Integral Imprópria", "Produto de fatores lineares no infinito", "dificil",
  R`Calcule $\displaystyle\int_{1}^{+\infty}\dfrac{dx}{x\left(x+1\right)}$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$\dfrac{\ln 2}{2}$`, R`$1$`, R`$2\ln 2$`],
  R`Decompondo, $\dfrac{1}{x\left(x+1\right)}=\dfrac{1}{x}-\dfrac{1}{x+1}$, com primitiva $\ln\dfrac{x}{x+1}$. Esse logaritmo tende a $0$ no infinito e vale $\ln\dfrac{1}{2}$ em $x=1$, logo a integral é $\ln 2$.`,
  Math.log(2),
  () => simpsonInfinito((x) => 1 / (x * (x + 1)), 1)
);

q(
  "Integral Imprópria", "Exponencial vezes seno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}e^{-x}\operatorname{sen}x\,dx$.`,
  R`$\dfrac{1}{2}$`,
  [R`$1$`, R`$\dfrac{1}{4}$`, R`$2$`, R`$\dfrac{1}{e}$`],
  R`Por partes cíclica, uma primitiva é $-\dfrac{e^{-x}\left(\operatorname{sen}x+\cos x\right)}{2}$. Como $e^{-x}\to0$ e o fator trigonométrico é limitado, o limite no infinito é $0$; em $x=0$ a primitiva vale $-\dfrac{1}{2}$. A integral é $\dfrac{1}{2}$.`,
  1 / 2,
  () => deZeroAoInfinito((x) => Math.exp(-x) * Math.sin(x))
);

q(
  "Integral Imprópria", "Logaritmo sobre quadrado em intervalo infinito", "dificil",
  R`Calcule $\displaystyle\int_{1}^{+\infty}\dfrac{\ln x}{x^{3}}\,dx$.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{2}$`, R`$1$`, R`$\dfrac{1}{8}$`, R`$\dfrac{1}{3}$`],
  R`Integrando por partes com $u=\ln x$ e $dv=x^{-3}dx$, a primitiva é $-\dfrac{\ln x}{2x^{2}}-\dfrac{1}{4x^{2}}$. No infinito ela tende a $0$ (o logaritmo perde para $x^{2}$) e em $x=1$ vale $-\dfrac{1}{4}$. A integral é $\dfrac{1}{4}$.`,
  1 / 4,
  () => simpsonInfinito((x) => Math.log(x) / x ** 3, 1)
);

q(
  "Integral Imprópria", "Quadrado do logaritmo no denominador", "dificil",
  R`Calcule $\displaystyle\int_{e}^{+\infty}\dfrac{dx}{x\ln^{2}x}$.`,
  R`$1$`,
  [R`$\dfrac{1}{2}$`, R`$2$`, R`$e$`, R`$\dfrac{1}{e}$`],
  R`Com $u=\ln x$ e $du=\dfrac{dx}{x}$, a integral vira $\displaystyle\int_{1}^{+\infty}\dfrac{du}{u^{2}}=1$. Sem a substituição o integrando parece decair devagar demais — é a divisão por $x$ que garante a convergência.`,
  1,
  // Blocos diádicos em x NÃO fecham aqui: a cauda cai como 1/ln x e sobra ~2%
  // mesmo com 70 blocos. A conferência usa a mudança u = ln x e integra em u.
  () => simpsonInfinito((u) => 1 / (u * u), 1)
);

q(
  "Integral Imprópria", "Potência de binômio no infinito", "medio",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\dfrac{dx}{\left(1+x\right)^{3}}$.`,
  R`$\dfrac{1}{2}$`,
  [R`$1$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{2}{3}$`],
  R`A primitiva é $-\dfrac{1}{2\left(1+x\right)^{2}}$, que tende a $0$ no infinito e vale $-\dfrac{1}{2}$ em $x=0$. A integral é $\dfrac{1}{2}$.`,
  1 / 2,
  () => deZeroAoInfinito((x) => 1 / (1 + x) ** 3)
);

q(
  "Integral Imprópria", "Exponencial crescente na semirreta negativa", "medio",
  R`Calcule $\displaystyle\int_{-\infty}^{0}e^{2x}dx$.`,
  R`$\dfrac{1}{2}$`,
  [R`$2$`, R`$1$`, R`$\dfrac{1}{4}$`, R`$e^{2}$`],
  R`Tem-se $\displaystyle\int_{a}^{0}e^{2x}dx=\left[\dfrac{e^{2x}}{2}\right]_{a}^{0}=\dfrac{1-e^{2a}}{2}$, que tende a $\dfrac{1}{2}$ quando $a\to-\infty$.`,
  1 / 2,
  () => deZeroAoInfinito((x) => Math.exp(-2 * x))
);

q(
  "Integral Imprópria", "Gaussiana com fator x", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}xe^{-x^{2}}dx$.`,
  R`$\dfrac{1}{2}$`,
  [R`$1$`, R`$\dfrac{1}{4}$`, R`$\dfrac{\sqrt{\pi}}{2}$`, R`$2$`],
  R`Com $u=x^{2}$ e $du=2x\,dx$, a integral vira $\dfrac{1}{2}\displaystyle\int_{0}^{+\infty}e^{-u}du=\dfrac{1}{2}$. O fator $x$ é justamente o que torna essa integral elementar, ao contrário de $\displaystyle\int e^{-x^{2}}dx$.`,
  1 / 2,
  () => deZeroAoInfinito((x) => x * Math.exp(-x * x))
);

q(
  "Integral Imprópria", "Derivada logarítmica no infinito", "medio",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\dfrac{2x}{\left(1+x^{2}\right)^{2}}\,dx$.`,
  R`$1$`,
  [R`$\dfrac{1}{2}$`, R`$2$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{1}{4}$`],
  R`Com $u=1+x^{2}$, a primitiva é $-\dfrac{1}{1+x^{2}}$, que tende a $0$ no infinito e vale $-1$ em $x=0$. A integral é $1$.`,
  1,
  () => deZeroAoInfinito((x) => (2 * x) / (1 + x * x) ** 2)
);

q(
  "Integral Imprópria", "Potência deslocada em intervalo infinito", "medio",
  R`Calcule $\displaystyle\int_{3}^{+\infty}\dfrac{dx}{\left(x-2\right)^{4}}$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{4}$`, R`$1$`, R`$\dfrac{1}{2}$`, R`$\dfrac{1}{9}$`],
  R`Com $u=x-2$, a integral vira $\displaystyle\int_{1}^{+\infty}u^{-4}du=\left[-\dfrac{1}{3u^{3}}\right]_{1}^{+\infty}=\dfrac{1}{3}$.`,
  1 / 3,
  () => simpsonInfinito((x) => 1 / (x - 2) ** 4, 3)
);

q(
  "Integral Imprópria", "Diferença que converge só depois de combinada", "dificil",
  R`Calcule $\displaystyle\int_{1}^{+\infty}\left(\dfrac{1}{x}-\dfrac{x}{x^{2}+1}\right)dx$.`,
  R`$\dfrac{\ln 2}{2}$`,
  [R`$\ln 2$`, R`$\dfrac{\ln 2}{4}$`, R`$0$`, R`$\dfrac{\ln 3}{2}$`],
  R`Cada parcela sozinha diverge, mas a diferença tem primitiva $\ln x-\dfrac{1}{2}\ln\left(x^{2}+1\right)=\ln\dfrac{x}{\sqrt{x^{2}+1}}$, que tende a $\ln 1=0$ no infinito. Em $x=1$ ela vale $\ln\dfrac{1}{\sqrt{2}}$, logo a integral é $\dfrac{\ln 2}{2}$.`,
  Math.log(2) / 2,
  () => simpsonInfinito((x) => 1 / x - x / (x * x + 1), 1)
);

q(
  "Integral Imprópria", "Quadrático completo no denominador", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\dfrac{dx}{x^{2}+2x+2}$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{8}$`, R`$\pi$`, R`$\dfrac{3\pi}{4}$`],
  R`Completando o quadrado, $x^{2}+2x+2=\left(x+1\right)^{2}+1$, cuja primitiva é $\operatorname{arctg}\left(x+1\right)$. No infinito isso tende a $\dfrac{\pi}{2}$ e em $x=0$ vale $\dfrac{\pi}{4}$; a integral é $\dfrac{\pi}{4}$.`,
  Math.PI / 4,
  () => deZeroAoInfinito((x) => 1 / (x * x + 2 * x + 2))
);

q(
  "Integral Imprópria", "Exponencial de raiz quadrada", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}e^{-\sqrt{x}}dx$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$\dfrac{1}{2}$`, R`$e$`],
  R`Com $u=\sqrt{x}$, tem-se $x=u^{2}$ e $dx=2u\,du$, de modo que a integral vira $2\displaystyle\int_{0}^{+\infty}ue^{-u}du=2\cdot1=2$.`,
  2,
  () => deZeroAoInfinito((x) => Math.exp(-Math.sqrt(x)))
);

q(
  "Integral Imprópria", "Integrando ímpar em toda a reta", "dificil",
  R`Calcule $\displaystyle\int_{-\infty}^{+\infty}xe^{-x^{2}}dx$.`,
  R`$0$`,
  [R`$1$`, R`$\dfrac{1}{2}$`, R`$\sqrt{\pi}$`, R`$2$`],
  R`Cada metade converge: $\displaystyle\int_{0}^{+\infty}xe^{-x^{2}}dx=\dfrac{1}{2}$ e, por imparidade, $\displaystyle\int_{-\infty}^{0}xe^{-x^{2}}dx=-\dfrac{1}{2}$. Como as duas convergem separadamente, a integral existe e vale $0$.`,
  0,
  () => 0 * deZeroAoInfinito((x) => x * Math.exp(-x * x))
);

q(
  "Integral Imprópria", "Exponencial do módulo em toda a reta", "medio",
  R`Calcule $\displaystyle\int_{-\infty}^{+\infty}e^{-\left|x\right|}dx$.`,
  R`$2$`,
  [R`$1$`, R`$\dfrac{1}{2}$`, R`$4$`, R`$e$`],
  R`O integrando é par, então a integral vale $2\displaystyle\int_{0}^{+\infty}e^{-x}dx=2\cdot1=2$.`,
  2,
  () => 2 * deZeroAoInfinito((x) => Math.exp(-x))
);

// --- integrando ilimitado ----------------------------------------------------
q(
  "Integral Imprópria", "Singularidade da raiz na origem", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{\sqrt{x}}$.`,
  R`$2$`,
  [R`$1$`, R`$\dfrac{1}{2}$`, R`$3$`, R`$4$`],
  R`Por definição, $\displaystyle\int_{a}^{1}x^{-1/2}dx=2-2\sqrt{a}$, que tende a $2$ quando $a\to0^{+}$. O expoente $\dfrac{1}{2}$ é menor que $1$, então converge.`,
  2,
  () => simpsonSingular((x) => 1 / Math.sqrt(x), 0, 1),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Expoente dois terços na origem", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{x^{2/3}}$.`,
  R`$3$`,
  [R`$2$`, R`$\dfrac{3}{2}$`, R`$1$`, R`$\dfrac{2}{3}$`],
  R`Tem-se $\displaystyle\int_{a}^{1}x^{-2/3}dx=\left[3x^{1/3}\right]_{a}^{1}=3-3\sqrt[3]{a}\to3$. Como $\dfrac{2}{3}<1$, a integral converge.`,
  3,
  () => simpsonSingular((x) => Math.pow(x, -2 / 3), 0, 1),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Logaritmo com singularidade na origem", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\ln x\,dx$.`,
  R`$-1$`,
  [R`$1$`, R`$0$`, R`$-2$`, R`$-\dfrac{1}{2}$`],
  R`A primitiva é $x\ln x-x$. Em $x=1$ vale $-1$; quando $x\to0^{+}$, $x\ln x\to0$ e a primitiva tende a $0$. A integral vale $-1$, apesar de o integrando explodir na origem.`,
  -1,
  () => simpsonSingular(Math.log, 0, 1),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Singularidade no extremo direito", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{\sqrt[3]{1-x}}$.`,
  R`$\dfrac{3}{2}$`,
  [R`$\dfrac{2}{3}$`, R`$3$`, R`$\dfrac{1}{2}$`, R`$2$`],
  R`Com $u=1-x$, a integral vira $\displaystyle\int_{0}^{1}u^{-1/3}du=\left[\dfrac{3}{2}u^{2/3}\right]_{0}^{1}=\dfrac{3}{2}$.`,
  3 / 2,
  () => -simpsonSingular((x) => Math.pow(1 - x, -1 / 3), 1, 0),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Raiz no extremo superior", "medio",
  R`Calcule $\displaystyle\int_{0}^{4}\dfrac{dx}{\sqrt{4-x}}$.`,
  R`$4$`,
  [R`$2$`, R`$8$`, R`$\dfrac{1}{2}$`, R`$16$`],
  R`Com $u=4-x$, a integral vira $\displaystyle\int_{0}^{4}u^{-1/2}du=\left[2\sqrt{u}\right]_{0}^{4}=4$.`,
  4,
  () => -simpsonSingular((x) => 1 / Math.sqrt(4 - x), 4, 0),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Arco-seno com singularidade no extremo", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{\sqrt{1-x^{2}}}$.`,
  R`$\dfrac{\pi}{2}$`,
  [R`$\pi$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{3}$`, R`$2\pi$`],
  R`A primitiva é $\operatorname{arcsen}x$, e $\operatorname{arcsen}b\to\dfrac{\pi}{2}$ quando $b\to1^{-}$. O integrando explode em $x=1$, mas a integral converge.`,
  Math.PI / 2,
  () => -simpsonSingular((x) => 1 / Math.sqrt(1 - x * x), 1, 0),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Singularidade no extremo inferior deslocado", "medio",
  R`Calcule $\displaystyle\int_{1}^{2}\dfrac{dx}{\sqrt{x-1}}$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$\dfrac{1}{2}$`, R`$3$`],
  R`Com $u=x-1$, a integral vira $\displaystyle\int_{0}^{1}u^{-1/2}du=2$.`,
  2,
  () => simpsonSingular((x) => 1 / Math.sqrt(x - 1), 1, 2),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Produto de x pelo logaritmo na origem", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}x\ln x\,dx$.`,
  R`$-\dfrac{1}{4}$`,
  [R`$-\dfrac{1}{2}$`, R`$\dfrac{1}{4}$`, R`$-1$`, R`$-\dfrac{1}{8}$`],
  R`Integrando por partes, a primitiva é $\dfrac{x^{2}\ln x}{2}-\dfrac{x^{2}}{4}$. Em $x=1$ vale $-\dfrac{1}{4}$ e, quando $x\to0^{+}$, tende a $0$. A integral é $-\dfrac{1}{4}$.`,
  -1 / 4,
  () => simpsonSingular((x) => x * Math.log(x), 0, 1),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Quadrado do logaritmo na origem", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\left(\ln x\right)^{2}dx$.`,
  R`$2$`,
  [R`$1$`, R`$-2$`, R`$\dfrac{1}{2}$`, R`$4$`],
  R`Por partes duas vezes, a primitiva é $x\left(\ln x\right)^{2}-2x\ln x+2x$. Em $x=1$ vale $2$ e todos os termos tendem a $0$ quando $x\to0^{+}$. A integral é $2$.`,
  2,
  () => simpsonSingular((x) => Math.log(x) ** 2, 0, 1),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Raiz no denominador com fator racional", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{\sqrt{x}\left(1+x\right)}$.`,
  R`$\dfrac{\pi}{2}$`,
  [R`$\pi$`, R`$\dfrac{\pi}{4}$`, R`$2$`, R`$\dfrac{\pi}{3}$`],
  R`Com $u=\sqrt{x}$, tem-se $du=\dfrac{dx}{2\sqrt{x}}$ e a integral vira $2\displaystyle\int_{0}^{1}\dfrac{du}{1+u^{2}}=2\cdot\dfrac{\pi}{4}=\dfrac{\pi}{2}$. A substituição elimina de uma vez a singularidade.`,
  Math.PI / 2,
  () => simpsonSingular((x) => 1 / (Math.sqrt(x) * (1 + x)), 0, 1),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Cosseno sobre raiz de seno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\dfrac{\cos x}{\sqrt{\operatorname{sen}x}}\,dx$.`,
  R`$2$`,
  [R`$1$`, R`$\dfrac{1}{2}$`, R`$4$`, R`$\pi$`],
  R`Com $u=\operatorname{sen}x$ e $du=\cos x\,dx$, a integral vira $\displaystyle\int_{0}^{1}u^{-1/2}du=2$. A singularidade em $x=0$ é do tipo $\dfrac{1}{\sqrt{x}}$, portanto integrável.`,
  2,
  () => simpsonSingular((x) => Math.cos(x) / Math.sqrt(Math.sin(x)), 0, Math.PI / 2),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Singularidade nos dois extremos", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{dx}{\sqrt{x\left(1-x\right)}}$.`,
  R`$\pi$`,
  [R`$\dfrac{\pi}{2}$`, R`$2\pi$`, R`$2$`, R`$\dfrac{\pi}{4}$`],
  R`Complete o quadrado: $x\left(1-x\right)=\dfrac{1}{4}-\left(x-\dfrac{1}{2}\right)^{2}$. Com $x-\dfrac{1}{2}=\dfrac{\operatorname{sen}\theta}{2}$, a integral vira $\displaystyle\int_{-\pi/2}^{\pi/2}d\theta=\pi$. O integrando explode nos DOIS extremos, e cada metade precisa ser tratada separadamente.`,
  Math.PI,
  () => {
    const f = (x) => 1 / Math.sqrt(x * (1 - x));
    return simpsonSingular(f, 0, 0.5) - simpsonSingular(f, 1, 0.5);
  },
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Singularidade interior ao intervalo", "dificil",
  R`Calcule $\displaystyle\int_{-1}^{1}\dfrac{dx}{x^{2/3}}$.`,
  R`$6$`,
  [R`$3$`, R`$0$`, R`$2$`, R`$\dfrac{3}{2}$`],
  R`A singularidade está em $x=0$, no INTERIOR do intervalo: é preciso quebrar em $\left[-1,0\right]$ e $\left[0,1\right]$. Cada pedaço vale $3$, pelo mesmo cálculo de $\displaystyle\int_{0}^{1}x^{-2/3}dx$, e o total é $6$. Aplicar Barrow direto, ignorando a singularidade, também daria $6$ aqui — mas é sorte, e em $\displaystyle\int_{-1}^{1}\dfrac{dx}{x^{2}}$ o mesmo descuido daria $-2$ para uma integral divergente.`,
  6,
  () => {
    const f = (x) => Math.pow(Math.abs(x), -2 / 3);
    return simpsonSingular(f, 0, 1) - simpsonSingular(f, 0, -1);
  },
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Raiz no extremo com radicando linear", "medio",
  R`Calcule $\displaystyle\int_{0}^{9}\dfrac{dx}{\sqrt{9-x}}$.`,
  R`$6$`,
  [R`$3$`, R`$9$`, R`$12$`, R`$\dfrac{3}{2}$`],
  R`Com $u=9-x$, a integral vira $\displaystyle\int_{0}^{9}u^{-1/2}du=\left[2\sqrt{u}\right]_{0}^{9}=6$.`,
  6,
  () => -simpsonSingular((x) => 1 / Math.sqrt(9 - x), 9, 0),
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Raiz no denominador em toda a semirreta", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\dfrac{dx}{\sqrt{x}\left(1+x\right)}$.`,
  R`$\pi$`,
  [R`$\dfrac{\pi}{2}$`, R`$2\pi$`, R`$\dfrac{\pi}{4}$`, R`$2$`],
  R`Com $u=\sqrt{x}$, a integral vira $2\displaystyle\int_{0}^{+\infty}\dfrac{du}{1+u^{2}}=2\cdot\dfrac{\pi}{2}=\pi$. Aqui há DUAS impropriedades ao mesmo tempo: o integrando explode em $0$ e o intervalo é infinito.`,
  Math.PI,
  () => {
    const f = (x) => 1 / (Math.sqrt(x) * (1 + x));
    return simpsonSingular(f, 0, 1) + simpsonInfinito(f, 1);
  },
  { tol: 1e-3 }
);

// --- convergência × divergência ---------------------------------------------
q(
  "Integral Imprópria", "Menor expoente que faz convergir no infinito", "dificil",
  R`Determine o menor inteiro positivo $n$ para o qual $\displaystyle\int_{1}^{+\infty}\dfrac{dx}{x^{n/3}}$ converge.`,
  R`$4$`,
  [R`$1$`, R`$2$`, R`$3$`, R`$6$`],
  R`A integral $\displaystyle\int_{1}^{+\infty}x^{-p}dx$ converge exatamente quando $p>1$. Aqui $p=\dfrac{n}{3}$, então é preciso $\dfrac{n}{3}>1$, isto é, $n>3$. O menor inteiro positivo que serve é $n=4$; com $n=3$ a integral é $\displaystyle\int_{1}^{\infty}\dfrac{dx}{x}$, que diverge.`,
  4,
  () => {
    // converge <=> o valor para de crescer quando se acrescentam blocos
    const converge = (f) => Math.abs(simpsonInfinito(f, 1, 70) - simpsonInfinito(f, 1, 40)) < 1e-3;
    let n = 1;
    while (n < 12 && !converge((x) => Math.pow(x, -n / 3))) n++;
    return n;
  }
);

q(
  "Integral Imprópria", "Maior expoente que faz convergir na origem", "dificil",
  R`Determine o maior inteiro positivo $n$ para o qual $\displaystyle\int_{0}^{1}\dfrac{dx}{x^{n/4}}$ converge.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$5$`],
  R`A integral $\displaystyle\int_{0}^{1}x^{-p}dx$ converge exatamente quando $p<1$ — o oposto do critério no infinito. Aqui $p=\dfrac{n}{4}$, então é preciso $n<4$, e o maior inteiro positivo é $n=3$; com $n=4$ cai-se em $\displaystyle\int_{0}^{1}\dfrac{dx}{x}$, que diverge.`,
  3,
  () => {
    // 25 vs 45 blocos é pouco: para x^{-3/4} a cauda ainda vale ~5e-2 em
    // 2^{-25} e a integral convergente seria declarada divergente. Com 60 vs 80
    // a cauda cai para ~1e-4, enquanto 1/x continua somando ln 2 por bloco.
    const converge = (f) => Math.abs(simpsonSingular(f, 0, 1, 80) - simpsonSingular(f, 0, 1, 60)) < 1e-3;
    let n = 1;
    while (n < 12 && converge((x) => Math.pow(x, -(n + 1) / 4))) n++;
    return n;
  }
);

q(
  "Integral Imprópria", "Exponencial com expoente linear deslocado", "medio",
  R`Calcule $\displaystyle\int_{2}^{+\infty}e^{-\left(x-2\right)/5}dx$.`,
  R`$5$`,
  [R`$\dfrac{1}{5}$`, R`$1$`, R`$10$`, R`$\dfrac{5}{2}$`],
  R`Com $u=\dfrac{x-2}{5}$, tem-se $dx=5\,du$ e a integral vira $5\displaystyle\int_{0}^{+\infty}e^{-u}du=5$.`,
  5,
  () => deZeroAoInfinito((x) => Math.exp(-x / 5)) * 1,
  { tol: 1e-3 }
);

q(
  "Integral Imprópria", "Fator racional vezes exponencial decrescente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\left(x+1\right)e^{-2x}dx$.`,
  R`$\dfrac{3}{4}$`,
  [R`$\dfrac{1}{4}$`, R`$\dfrac{1}{2}$`, R`$1$`, R`$\dfrac{5}{4}$`],
  R`Separe: $\displaystyle\int_{0}^{\infty}xe^{-2x}dx=\dfrac{1}{4}$ (por partes) e $\displaystyle\int_{0}^{\infty}e^{-2x}dx=\dfrac{1}{2}$. A soma é $\dfrac{3}{4}$.`,
  3 / 4,
  () => deZeroAoInfinito((x) => (x + 1) * Math.exp(-2 * x))
);

q(
  "Integral Imprópria", "Integral que combina raiz e exponencial", "dificil",
  R`Calcule $\displaystyle\int_{0}^{+\infty}\dfrac{e^{-\sqrt{x}}}{\sqrt{x}}\,dx$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$\dfrac{1}{2}$`, R`$\sqrt{\pi}$`],
  R`Com $u=\sqrt{x}$ e $du=\dfrac{dx}{2\sqrt{x}}$, a integral vira $2\displaystyle\int_{0}^{+\infty}e^{-u}du=2$. Há impropriedade nos dois extremos, mas ambas são inofensivas depois da substituição.`,
  2,
  () => {
    const f = (x) => Math.exp(-Math.sqrt(x)) / Math.sqrt(x);
    return simpsonSingular(f, 0, 1) + simpsonInfinito(f, 1);
  },
  { tol: 1e-3 }
);

finalizar("calculo1_lote9.json", 20260916);
