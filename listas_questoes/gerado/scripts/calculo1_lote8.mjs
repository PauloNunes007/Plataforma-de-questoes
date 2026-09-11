// Lote 8 de Cálculo I — 83 questões: Integral Definida (42) e Aplicações da
// Integral Definida (41). Quarta parte da equalização do banco (ver
// `calculo1_lote5.mjs` e o kit `calculo1_kit.mjs`).
//
// Divisão de escopo entre os dois tópicos de integral, seguindo a ementa:
//   - "Integral Definida" é o capítulo da DEFINIÇÃO — soma de Riemann como
//     limite, propriedades (linearidade, aditividade, simetria/paridade),
//     integrando com módulo e área com sinal;
//   - técnica de primitivação fica em "Integral Indefinida" (lote 7) e em
//     "Técnicas de Integração" (lote 9).
//
// O verificador das somas de Riemann calcula a SOMA com n grande (não a
// integral), e o das áreas/volumes integra por Simpson.
//
// Rode: node listas_questoes/gerado/scripts/calculo1_lote8.mjs
import { R, q, finalizar, simpson, comprimentoArco } from "./calculo1_kit.mjs";

// Soma de Riemann com extremidade direita: (1/n)·Σ g(k/n), k = 1..m·n.
const somaRiemann = (g, n, mult = 1) => {
  let s = 0;
  for (let k = 1; k <= mult * n; k++) s += g(k / n);
  return s / n;
};

// ===========================================================================
// INTEGRAL DEFINIDA — 42
// ===========================================================================

// --- limite de somas de Riemann ---------------------------------------------
q(
  "Integral Definida", "Soma de Riemann que produz o arco-tangente", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1}{n}\sum_{k=1}^{n}\dfrac{1}{1+\left(\dfrac{k}{n}\right)^{2}}$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{6}$`, R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{8}$`],
  R`A soma é exatamente a soma de Riemann de $f(x)=\dfrac{1}{1+x^{2}}$ em $\left[0,1\right]$, com $n$ subintervalos de largura $\dfrac{1}{n}$ e pontos $x_{k}=\dfrac{k}{n}$ nas extremidades direitas. O limite é $\displaystyle\int_{0}^{1}\dfrac{dx}{1+x^{2}}=\operatorname{arctg}1=\dfrac{\pi}{4}$.`,
  Math.PI / 4,
  () => somaRiemann((x) => 1 / (1 + x * x), 2000000)
);

q(
  "Integral Definida", "Soma de raízes reconhecida como integral", "medio",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1}{n}\sum_{k=1}^{n}\sqrt{\dfrac{k}{n}}$.`,
  R`$\dfrac{2}{3}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{3}{2}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{3}{4}$`],
  R`Trata-se da soma de Riemann de $f(x)=\sqrt{x}$ em $\left[0,1\right]$ com pontos $\dfrac{k}{n}$. O limite é $\displaystyle\int_{0}^{1}\sqrt{x}\,dx=\left[\dfrac{2}{3}x^{3/2}\right]_{0}^{1}=\dfrac{2}{3}$.`,
  2 / 3,
  () => somaRiemann(Math.sqrt, 2000000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Soma de cubos dividida pela quarta potência", "medio",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1^{3}+2^{3}+\cdots+n^{3}}{n^{4}}$.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{1}{5}$`, R`$1$`],
  R`Coloque $\dfrac{1}{n}$ em evidência: a expressão é $\dfrac{1}{n}\sum_{k=1}^{n}\left(\dfrac{k}{n}\right)^{3}$, a soma de Riemann de $x^{3}$ em $\left[0,1\right]$. O limite é $\displaystyle\int_{0}^{1}x^{3}dx=\dfrac{1}{4}$.`,
  1 / 4,
  () => somaRiemann((x) => x ** 3, 2000000)
);

q(
  "Integral Definida", "Soma de quartas potências", "medio",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1^{4}+2^{4}+\cdots+n^{4}}{n^{5}}$.`,
  R`$\dfrac{1}{5}$`,
  [R`$\dfrac{1}{4}$`, R`$\dfrac{1}{6}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{2}$`],
  R`Pondo $\dfrac{1}{n}$ em evidência, a expressão é $\dfrac{1}{n}\sum_{k=1}^{n}\left(\dfrac{k}{n}\right)^{4}$, soma de Riemann de $x^{4}$ em $\left[0,1\right]$, cujo limite é $\displaystyle\int_{0}^{1}x^{4}dx=\dfrac{1}{5}$.`,
  1 / 5,
  () => somaRiemann((x) => x ** 4, 2000000)
);

q(
  "Integral Definida", "Soma com k no numerador e n ao quadrado no denominador", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\sum_{k=1}^{n}\dfrac{k}{n^{2}+k^{2}}$.`,
  R`$\dfrac{\ln 2}{2}$`,
  [R`$\ln 2$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{\ln 2}{4}$`, R`$\dfrac{1}{2}$`],
  R`Divida numerador e denominador por $n^{2}$: o termo geral vira $\dfrac{1}{n}\cdot\dfrac{k/n}{1+\left(k/n\right)^{2}}$. É a soma de Riemann de $\dfrac{x}{1+x^{2}}$ em $\left[0,1\right]$, cujo limite é $\left[\dfrac{1}{2}\ln\left(1+x^{2}\right)\right]_{0}^{1}=\dfrac{\ln 2}{2}$.`,
  Math.log(2) / 2,
  () => somaRiemann((x) => x / (1 + x * x), 2000000)
);

q(
  "Integral Definida", "Soma de senos igualmente espaçados", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1}{n}\sum_{k=1}^{n}\operatorname{sen}\dfrac{k\pi}{n}$.`,
  R`$\dfrac{2}{\pi}$`,
  [R`$\dfrac{1}{\pi}$`, R`$\dfrac{4}{\pi}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{2}{\pi^{2}}$`],
  R`É a soma de Riemann de $f(x)=\operatorname{sen}\left(\pi x\right)$ em $\left[0,1\right]$. O limite é $\displaystyle\int_{0}^{1}\operatorname{sen}\left(\pi x\right)dx=\left[-\dfrac{\cos\pi x}{\pi}\right]_{0}^{1}=\dfrac{2}{\pi}$.`,
  2 / Math.PI,
  () => somaRiemann((x) => Math.sin(Math.PI * x), 2000000)
);

q(
  "Integral Definida", "Soma de exponenciais igualmente espaçadas", "medio",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1}{n}\sum_{k=1}^{n}e^{k/n}$.`,
  R`$e-1$`,
  [R`$e$`, R`$e+1$`, R`$\dfrac{e-1}{2}$`, R`$2e-1$`],
  R`É a soma de Riemann de $f(x)=e^{x}$ em $\left[0,1\right]$, logo o limite vale $\displaystyle\int_{0}^{1}e^{x}dx=e-1$. (Como soma geométrica exata, ela também vale $\dfrac{e^{1/n}\left(e-1\right)}{n\left(e^{1/n}-1\right)}$, que tende ao mesmo valor.)`,
  Math.E - 1,
  () => somaRiemann((x) => Math.exp(x), 2000000)
);

q(
  "Integral Definida", "Soma harmônica deslocada", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\left(\dfrac{1}{n+1}+\dfrac{1}{n+2}+\cdots+\dfrac{1}{2n}\right)$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$\dfrac{\ln 2}{2}$`, R`$1$`, R`$\dfrac{1}{2}$`],
  R`O termo geral é $\dfrac{1}{n+k}=\dfrac{1}{n}\cdot\dfrac{1}{1+k/n}$, de modo que a soma é a de Riemann de $\dfrac{1}{1+x}$ em $\left[0,1\right]$. O limite é $\left[\ln\left(1+x\right)\right]_{0}^{1}=\ln 2$.`,
  Math.log(2),
  () => somaRiemann((x) => 1 / (1 + x), 2000000)
);

q(
  "Integral Definida", "Soma com radical no denominador", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\sum_{k=1}^{n}\dfrac{1}{\sqrt{n^{2}+kn}}$.`,
  R`$2\sqrt{2}-2$`,
  [R`$\sqrt{2}-1$`, R`$2-\sqrt{2}$`, R`$4\sqrt{2}-4$`, R`$\sqrt{2}$`],
  R`Ponha $n$ em evidência sob o radical: $\dfrac{1}{\sqrt{n^{2}+kn}}=\dfrac{1}{n}\cdot\dfrac{1}{\sqrt{1+k/n}}$. A soma é a de Riemann de $\dfrac{1}{\sqrt{1+x}}$ em $\left[0,1\right]$, e o limite é $\left[2\sqrt{1+x}\right]_{0}^{1}=2\sqrt{2}-2$.`,
  2 * Math.SQRT2 - 2,
  () => somaRiemann((x) => 1 / Math.sqrt(1 + x), 2000000)
);

q(
  "Integral Definida", "Soma de logaritmos reconhecida como integral", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1}{n}\sum_{k=1}^{n}\ln\left(1+\dfrac{k}{n}\right)$.`,
  R`$2\ln 2-1$`,
  [R`$\ln 2-1$`, R`$2\ln 2$`, R`$\ln 2$`, R`$1-\ln 2$`],
  R`É a soma de Riemann de $\ln\left(1+x\right)$ em $\left[0,1\right]$. Integrando por partes, $\displaystyle\int_{0}^{1}\ln(1+x)dx=\left[\left(1+x\right)\ln\left(1+x\right)-x\right]_{0}^{1}=2\ln 2-1$.`,
  2 * Math.log(2) - 1,
  () => somaRiemann((x) => Math.log(1 + x), 2000000)
);

q(
  "Integral Definida", "Soma de Riemann com intervalo deslocado", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1}{n}\sum_{k=1}^{n}\left(2+\dfrac{k}{n}\right)^{2}$.`,
  R`$\dfrac{19}{3}$`,
  [R`$\dfrac{13}{3}$`, R`$\dfrac{7}{3}$`, R`$\dfrac{26}{3}$`, R`$\dfrac{19}{6}$`],
  R`É a soma de Riemann de $f(x)=\left(2+x\right)^{2}$ em $\left[0,1\right]$, cujo limite é $\displaystyle\int_{0}^{1}\left(2+x\right)^{2}dx=\left[\dfrac{\left(2+x\right)^{3}}{3}\right]_{0}^{1}=\dfrac{27-8}{3}=\dfrac{19}{3}$.`,
  19 / 3,
  () => somaRiemann((x) => (2 + x) ** 2, 2000000)
);

q(
  "Integral Definida", "Soma de Riemann com o dobro de parcelas", "dificil",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1}{n}\sum_{k=1}^{2n}\dfrac{1}{1+\dfrac{k}{n}}$.`,
  R`$\ln 3$`,
  [R`$\ln 2$`, R`$2\ln 2$`, R`$\ln 4$`, R`$\dfrac{\ln 3}{2}$`],
  R`A largura de cada subintervalo continua $\dfrac{1}{n}$, mas o índice vai até $2n$: os pontos $\dfrac{k}{n}$ varrem $\left[0,2\right]$. O limite é $\displaystyle\int_{0}^{2}\dfrac{dx}{1+x}=\ln 3-\ln 1=\ln 3$.`,
  Math.log(3),
  () => somaRiemann((x) => 1 / (1 + x), 1000000, 2)
);

q(
  "Integral Definida", "Soma de quadrados dividida pelo cubo", "medio",
  R`Calcule $\displaystyle\lim_{n\to\infty}\dfrac{1^{2}+2^{2}+\cdots+n^{2}}{n^{3}}$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{2}{3}$`, R`$1$`],
  R`Pondo $\dfrac{1}{n}$ em evidência, a expressão é $\dfrac{1}{n}\sum_{k=1}^{n}\left(\dfrac{k}{n}\right)^{2}$, soma de Riemann de $x^{2}$ em $\left[0,1\right]$, de limite $\dfrac{1}{3}$. Confere com a fórmula fechada $\dfrac{n(n+1)(2n+1)}{6n^{3}}$.`,
  1 / 3,
  () => somaRiemann((x) => x * x, 2000000)
);

// --- soma de Riemann com partição explícita ---------------------------------
q(
  "Integral Definida", "Soma de Riemann à direita com quatro subintervalos", "medio",
  R`Seja $f(x)=x^{2}$ em $\left[0,2\right]$. Calcule a soma de Riemann associada à partição em $4$ subintervalos de mesma largura, tomando as extremidades direitas como pontos amostrais.`,
  R`$\dfrac{15}{4}$`,
  [R`$\dfrac{7}{4}$`, R`$\dfrac{11}{4}$`, R`$\dfrac{17}{4}$`, R`$\dfrac{8}{3}$`],
  R`A largura é $\Delta x=\dfrac{1}{2}$ e os pontos são $\dfrac{1}{2}$, $1$, $\dfrac{3}{2}$ e $2$. A soma vale $\dfrac{1}{2}\left(\dfrac{1}{4}+1+\dfrac{9}{4}+4\right)=\dfrac{1}{2}\cdot\dfrac{30}{4}=\dfrac{15}{4}$ — maior que a integral $\dfrac{8}{3}$, como se espera de uma função crescente com pontos à direita.`,
  15 / 4,
  () => {
    let s = 0;
    for (let k = 1; k <= 4; k++) s += (k / 2) ** 2 * 0.5;
    return s;
  }
);

q(
  "Integral Definida", "Soma de Riemann à esquerda com quatro subintervalos", "dificil",
  R`Seja $f(x)=\dfrac{1}{x}$ em $\left[1,3\right]$. Calcule a soma de Riemann associada à partição em $4$ subintervalos de mesma largura, tomando as extremidades esquerdas como pontos amostrais.`,
  R`$\dfrac{77}{60}$`,
  [R`$\dfrac{57}{60}$`, R`$\dfrac{67}{60}$`, R`$\dfrac{87}{60}$`, R`$\dfrac{11}{10}$`],
  R`A largura é $\Delta x=\dfrac{1}{2}$ e os pontos são $1$, $\dfrac{3}{2}$, $2$ e $\dfrac{5}{2}$. A soma vale $\dfrac{1}{2}\left(1+\dfrac{2}{3}+\dfrac{1}{2}+\dfrac{2}{5}\right)=\dfrac{1}{2}\cdot\dfrac{77}{30}=\dfrac{77}{60}$, uma superestimativa de $\ln 3$, já que $\dfrac{1}{x}$ é decrescente.`,
  77 / 60,
  () => {
    let s = 0;
    for (let k = 0; k <= 3; k++) s += (1 / (1 + k / 2)) * 0.5;
    return s;
  }
);

// --- integrando com módulo e área com sinal ---------------------------------
q(
  "Integral Definida", "Integral do módulo num intervalo assimétrico", "medio",
  R`Calcule $\displaystyle\int_{-1}^{2}\left|x\right|dx$.`,
  R`$\dfrac{5}{2}$`,
  [R`$\dfrac{3}{2}$`, R`$2$`, R`$\dfrac{7}{2}$`, R`$3$`],
  R`Quebre no ponto em que o módulo muda de expressão: $\displaystyle\int_{-1}^{0}\left(-x\right)dx+\displaystyle\int_{0}^{2}x\,dx=\dfrac{1}{2}+2=\dfrac{5}{2}$. Geometricamente, são dois triângulos de áreas $\dfrac{1}{2}$ e $2$.`,
  5 / 2,
  () => simpson(Math.abs, -1, 2, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral de um módulo com vértice interior", "medio",
  R`Calcule $\displaystyle\int_{0}^{4}\left|x-1\right|dx$.`,
  R`$5$`,
  [R`$3$`, R`$4$`, R`$\dfrac{9}{2}$`, R`$\dfrac{11}{2}$`],
  R`Separando em $\left[0,1\right]$ e $\left[1,4\right]$: $\displaystyle\int_{0}^{1}\left(1-x\right)dx+\displaystyle\int_{1}^{4}\left(x-1\right)dx=\dfrac{1}{2}+\dfrac{9}{2}=5$. São dois triângulos, de catetos $1$ e $1$ e de catetos $3$ e $3$.`,
  5,
  () => simpson((x) => Math.abs(x - 1), 0, 4, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral do módulo de uma parábola", "dificil",
  R`Calcule $\displaystyle\int_{-2}^{2}\left|x^{2}-1\right|dx$.`,
  R`$4$`,
  [R`$\dfrac{8}{3}$`, R`$\dfrac{16}{3}$`, R`$2$`, R`$\dfrac{10}{3}$`],
  R`O integrando é par, então basta o dobro de $\displaystyle\int_{0}^{2}$. Em $\left[0,1\right]$, $\left|x^{2}-1\right|=1-x^{2}$, com integral $\dfrac{2}{3}$; em $\left[1,2\right]$, vale $x^{2}-1$, com integral $\dfrac{8}{3}-2-\left(\dfrac{1}{3}-1\right)=\dfrac{4}{3}$. O total é $2\left(\dfrac{2}{3}+\dfrac{4}{3}\right)=4$.`,
  4,
  () => simpson((x) => Math.abs(x * x - 1), -2, 2, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Área com sinal do seno num período", "medio",
  R`Calcule $\displaystyle\int_{0}^{2\pi}\operatorname{sen}x\,dx$.`,
  R`$0$`,
  [R`$2$`, R`$4$`, R`$-2$`, R`$2\pi$`],
  R`A primitiva é $-\cos x$, e $-\cos 2\pi+\cos 0=-1+1=0$. A integral definida é uma área COM SINAL: a região acima do eixo em $\left[0,\pi\right]$ e a de baixo em $\left[\pi,2\pi\right]$ têm áreas iguais e se cancelam. A área geométrica total seria $4$.`,
  0,
  () => simpson(Math.sin, 0, 2 * Math.PI)
);

q(
  "Integral Definida", "Máximo e mínimo de uma função com módulo", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\max\left\{x,\,x^{2}\right\}dx$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{5}{6}$`, R`$\dfrac{1}{6}$`],
  R`Em $\left[0,1\right]$ vale $x^{2}\leq x$, pois $x^{2}-x=x\left(x-1\right)\leq0$ nesse intervalo. Logo o máximo é sempre $x$, e a integral é $\displaystyle\int_{0}^{1}x\,dx=\dfrac{1}{2}$.`,
  1 / 2,
  () => simpson((x) => Math.max(x, x * x), 0, 1, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral do mínimo de duas retas", "dificil",
  R`Calcule $\displaystyle\int_{0}^{2}\min\left\{x,\,2-x\right\}dx$.`,
  R`$1$`,
  [R`$\dfrac{1}{2}$`, R`$2$`, R`$\dfrac{3}{2}$`, R`$\dfrac{4}{3}$`],
  R`As duas retas se cruzam em $x=1$. Em $\left[0,1\right]$ o mínimo é $x$; em $\left[1,2\right]$ é $2-x$. A região é um triângulo de base $2$ e altura $1$, de área $1$ — e a integral vale $\dfrac{1}{2}+\dfrac{1}{2}=1$.`,
  1,
  () => simpson((x) => Math.min(x, 2 - x), 0, 2, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral da função piso", "dificil",
  R`Calcule $\displaystyle\int_{0}^{3}\lfloor x\rfloor\,dx$, em que $\lfloor x\rfloor$ é o maior inteiro menor ou igual a $x$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$\dfrac{9}{2}$`, R`$6$`],
  R`A função é constante em cada intervalo unitário: vale $0$ em $\left[0,1\right)$, $1$ em $\left[1,2\right)$ e $2$ em $\left[2,3\right)$. A integral é a soma das áreas dos retângulos: $0\cdot1+1\cdot1+2\cdot1=3$. Os três pontos de descontinuidade não afetam o valor da integral.`,
  3,
  () => {
    let s = 0;
    const h = 1e-6;
    for (let x = h / 2; x < 3; x += h) s += Math.floor(x) * h;
    return s;
  },
  { tol: 1e-3 }
);

// --- simetria e paridade ----------------------------------------------------
q(
  "Integral Definida", "Parcela ímpar que se anula no intervalo simétrico", "medio",
  R`Calcule $\displaystyle\int_{-1}^{1}\left(x^{3}\cos x+x^{2}\right)dx$.`,
  R`$\dfrac{2}{3}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{4}{3}$`, R`$0$`, R`$2$`],
  R`A função $x^{3}\cos x$ é ímpar (ímpar vezes par), então sua integral no intervalo simétrico é nula. Já $x^{2}$ é par: $\displaystyle\int_{-1}^{1}x^{2}dx=2\displaystyle\int_{0}^{1}x^{2}dx=\dfrac{2}{3}$.`,
  2 / 3,
  () => simpson((x) => x ** 3 * Math.cos(x) + x * x, -1, 1)
);

q(
  "Integral Definida", "Simetria com quinta potência e seno ao quadrado", "dificil",
  R`Calcule $\displaystyle\int_{-\pi/2}^{\pi/2}\left(x^{5}\operatorname{sen}^{2}x+\cos x\right)dx$.`,
  R`$2$`,
  [R`$0$`, R`$1$`, R`$\pi$`, R`$4$`],
  R`O produto $x^{5}\operatorname{sen}^{2}x$ é ímpar, pois $x^{5}$ é ímpar e $\operatorname{sen}^{2}x$ é par; sua integral no intervalo simétrico é zero. Resta $\displaystyle\int_{-\pi/2}^{\pi/2}\cos x\,dx=\left[\operatorname{sen}x\right]_{-\pi/2}^{\pi/2}=2$.`,
  2,
  () => simpson((x) => x ** 5 * Math.sin(x) ** 2 + Math.cos(x), -Math.PI / 2, Math.PI / 2)
);

q(
  "Integral Definida", "Integrando ímpar num intervalo simétrico", "medio",
  R`Calcule $\displaystyle\int_{-3}^{3}\dfrac{x}{1+x^{2}}\,dx$.`,
  R`$0$`,
  [R`$\ln 10$`, R`$\dfrac{\ln 10}{2}$`, R`$2\ln 10$`, R`$3$`],
  R`A função $\dfrac{x}{1+x^{2}}$ é ímpar: trocar $x$ por $-x$ inverte o sinal do numerador e mantém o denominador. Num intervalo simétrico, a integral de uma função ímpar é $0$.`,
  0,
  () => simpson((x) => x / (1 + x * x), -3, 3)
);

q(
  "Integral Definida", "Constante mais parcela ímpar", "medio",
  R`Calcule $\displaystyle\int_{-2}^{2}\left(3+x\sqrt{4-x^{2}}\right)dx$.`,
  R`$12$`,
  [R`$6$`, R`$0$`, R`$3$`, R`$24$`],
  R`A parcela $x\sqrt{4-x^{2}}$ é ímpar — produto de uma função ímpar por uma par — e sua integral no intervalo simétrico é nula. Sobra $\displaystyle\int_{-2}^{2}3\,dx=3\cdot4=12$.`,
  12,
  () => simpson((x) => 3 + x * Math.sqrt(4 - x * x), -2, 2, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Simetria do intervalo com seno ao quadrado", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{2}x\,dx$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{8}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{\pi}{3}$`],
  R`A substituição $x\mapsto\dfrac{\pi}{2}-x$ transforma $\operatorname{sen}^{2}$ em $\cos^{2}$ sem mudar o intervalo, de modo que as integrais de $\operatorname{sen}^{2}$ e de $\cos^{2}$ ali são iguais. Como a soma delas é $\displaystyle\int_{0}^{\pi/2}1\,dx=\dfrac{\pi}{2}$, cada uma vale $\dfrac{\pi}{4}$.`,
  Math.PI / 4,
  () => simpson((x) => Math.sin(x) ** 2, 0, Math.PI / 2)
);

q(
  "Integral Definida", "Truque de simetria com potência da tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\dfrac{dx}{1+\operatorname{tg}^{\sqrt{2}}x}$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{2\sqrt{2}}$`, R`$\dfrac{\pi}{8}$`, R`$\dfrac{\pi}{3}$`],
  R`Chame a integral de $I$ e aplique $x\mapsto\dfrac{\pi}{2}-x$: como $\operatorname{tg}\left(\dfrac{\pi}{2}-x\right)=\operatorname{cotg}x$, obtém-se $I=\displaystyle\int_{0}^{\pi/2}\dfrac{\operatorname{tg}^{\sqrt{2}}x}{1+\operatorname{tg}^{\sqrt{2}}x}dx$. Somando as duas expressões, $2I=\displaystyle\int_{0}^{\pi/2}1\,dx=\dfrac{\pi}{2}$, logo $I=\dfrac{\pi}{4}$ — o expoente é irrelevante.`,
  Math.PI / 4,
  () => simpson((x) => 1 / (1 + Math.pow(Math.tan(x), Math.SQRT2)), 1e-9, Math.PI / 2 - 1e-9, 200000),
  { tol: 1e-3 }
);

// --- propriedades e estimativas ---------------------------------------------
q(
  "Integral Definida", "Linearidade com duas funções", "medio",
  R`Sabendo que $\displaystyle\int_{1}^{4}f(x)dx=6$ e $\displaystyle\int_{1}^{4}g(x)dx=-2$, calcule $\displaystyle\int_{1}^{4}\left[2f(x)-3g(x)\right]dx$.`,
  R`$18$`,
  [R`$6$`, R`$12$`, R`$-18$`, R`$24$`],
  R`Pela linearidade, a integral vale $2\cdot6-3\cdot\left(-2\right)=12+6=18$.`,
  18,
  () => {
    const f = (x) => 2; // integral 6 em [1,4]
    const g = (x) => -2 / 3; // integral -2 em [1,4]
    return simpson((x) => 2 * f(x) - 3 * g(x), 1, 4);
  }
);

q(
  "Integral Definida", "Maior valor possível com integrando limitado", "medio",
  R`Sabe-se que $1\leq f(x)\leq3$ para todo $x\in\left[0,4\right]$. Determine o maior valor possível de $\displaystyle\int_{0}^{4}f(x)dx$.`,
  R`$12$`,
  [R`$4$`, R`$8$`, R`$16$`, R`$3$`],
  R`A monotonicidade da integral dá $\displaystyle\int_{0}^{4}1\,dx\leq\displaystyle\int_{0}^{4}f\leq\displaystyle\int_{0}^{4}3\,dx$, isto é, $4\leq\displaystyle\int_{0}^{4}f\leq12$. O teto $12$ é atingido por $f\equiv3$, logo é o maior valor possível.`,
  12,
  () => simpson(() => 3, 0, 4)
);

q(
  "Integral Definida", "Mudança de escala no argumento", "dificil",
  R`Sabendo que $\displaystyle\int_{0}^{2}f(x)dx=7$, calcule $\displaystyle\int_{0}^{1}f\left(2x\right)dx$.`,
  R`$\dfrac{7}{2}$`,
  [R`$7$`, R`$14$`, R`$\dfrac{7}{4}$`, R`$\dfrac{2}{7}$`],
  R`Com $u=2x$ tem-se $du=2\,dx$ e os limites $0$ e $2$: $\displaystyle\int_{0}^{1}f(2x)dx=\dfrac{1}{2}\displaystyle\int_{0}^{2}f(u)du=\dfrac{7}{2}$. Comprimir o gráfico horizontalmente pela metade divide a área por dois.`,
  7 / 2,
  () => {
    const f = (x) => 3.5 * x; // integral 7 em [0,2]
    return simpson((x) => f(2 * x), 0, 1);
  }
);

q(
  "Integral Definida", "Reflexão do intervalo de integração", "dificil",
  R`Sabendo que $\displaystyle\int_{0}^{1}f(x)dx=5$, calcule $\displaystyle\int_{0}^{1}f\left(1-x\right)dx$.`,
  R`$5$`,
  [R`$-5$`, R`$\dfrac{5}{2}$`, R`$10$`, R`$1$`],
  R`Com $u=1-x$ tem-se $du=-dx$, e os limites se invertem: $\displaystyle\int_{0}^{1}f(1-x)dx=\displaystyle\int_{0}^{1}f(u)du=5$. Refletir o gráfico em torno de $x=\dfrac{1}{2}$ não muda a área sob ele.`,
  5,
  () => {
    const f = (x) => 4 + 3 * x * x; // integral 5 em [0,1]
    return simpson((x) => f(1 - x), 0, 1);
  }
);

q(
  "Integral Definida", "Aditividade com intervalo intermediário", "medio",
  R`Sabendo que $\displaystyle\int_{2}^{7}f(x)dx=10$ e $\displaystyle\int_{5}^{7}f(x)dx=3$, calcule $\displaystyle\int_{2}^{5}f(x)dx$.`,
  R`$7$`,
  [R`$13$`, R`$-7$`, R`$\dfrac{10}{3}$`, R`$30$`],
  R`Pela aditividade, $\displaystyle\int_{2}^{7}=\displaystyle\int_{2}^{5}+\displaystyle\int_{5}^{7}$, logo $\displaystyle\int_{2}^{5}f=10-3=7$.`,
  7,
  () => {
    // reta com integral 10 em [2,7] E integral 3 em [5,7]
    const f = (x) => 7 / 2 - x / 3;
    return simpson(f, 2, 5);
  }
);

q(
  "Integral Definida", "Integral com limites invertidos", "medio",
  R`Sabendo que $\displaystyle\int_{1}^{3}f(x)dx=8$, calcule $\displaystyle\int_{3}^{1}\left[f(x)+2\right]dx$.`,
  R`$-12$`,
  [R`$12$`, R`$-8$`, R`$-4$`, R`$4$`],
  R`Primeiro, $\displaystyle\int_{1}^{3}\left[f+2\right]=8+2\cdot2=12$. Inverter os limites troca o sinal: $\displaystyle\int_{3}^{1}\left[f+2\right]=-12$.`,
  -12,
  () => {
    const f = (x) => 4; // integral 8 em [1,3]
    return -simpson((x) => f(x) + 2, 1, 3);
  }
);

// --- área com sinal e avaliação direta --------------------------------------
q(
  "Integral Definida", "Integral avaliada por área geométrica", "medio",
  R`Calcule $\displaystyle\int_{-2}^{2}\sqrt{4-x^{2}}\,dx$ interpretando-a como área.`,
  R`$2\pi$`,
  [R`$4\pi$`, R`$\pi$`, R`$8\pi$`, R`$\dfrac{\pi}{2}$`],
  R`O gráfico de $y=\sqrt{4-x^{2}}$ é a semicircunferência superior de raio $2$, pois $y\geq0$ e $x^{2}+y^{2}=4$. A integral é a área do semicírculo: $\dfrac{\pi\cdot2^{2}}{2}=2\pi$.`,
  2 * Math.PI,
  () => simpson((x) => Math.sqrt(4 - x * x), -2, 2, 400000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral de uma reta como área de trapézio", "medio",
  R`Calcule $\displaystyle\int_{0}^{3}\left(2x+1\right)dx$ interpretando-a como área.`,
  R`$12$`,
  [R`$9$`, R`$10$`, R`$15$`, R`$6$`],
  R`A região é o trapézio de bases $f(0)=1$ e $f(3)=7$ e altura $3$: $\dfrac{\left(1+7\right)\cdot3}{2}=12$. Pelo Teorema Fundamental, $\left[x^{2}+x\right]_{0}^{3}=9+3=12$.`,
  12,
  () => simpson((x) => 2 * x + 1, 0, 3)
);

q(
  "Integral Definida", "Soma de módulo com constante", "medio",
  R`Calcule $\displaystyle\int_{-1}^{3}\left(\left|x\right|+1\right)dx$.`,
  R`$9$`,
  [R`$5$`, R`$7$`, R`$11$`, R`$13$`],
  R`Separe as parcelas: $\displaystyle\int_{-1}^{3}\left|x\right|dx=\dfrac{1}{2}+\dfrac{9}{2}=5$ e $\displaystyle\int_{-1}^{3}1\,dx=4$. O total é $9$.`,
  9,
  () => simpson((x) => Math.abs(x) + 1, -1, 3, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral com sinal de uma cúbica deslocada", "dificil",
  R`Calcule $\displaystyle\int_{-1}^{2}\left(x^{3}-x\right)dx$.`,
  R`$\dfrac{9}{4}$`,
  [R`$0$`, R`$\dfrac{3}{4}$`, R`$\dfrac{15}{4}$`, R`$-\dfrac{9}{4}$`],
  R`Integrando, $\left[\dfrac{x^{4}}{4}-\dfrac{x^{2}}{2}\right]_{-1}^{2}=\left(4-2\right)-\left(\dfrac{1}{4}-\dfrac{1}{2}\right)=2+\dfrac{1}{4}=\dfrac{9}{4}$. O intervalo não é simétrico, então a imparidade do integrando não ajuda aqui.`,
  9 / 4,
  () => simpson((x) => x ** 3 - x, -1, 2)
);

q(
  "Integral Definida", "Integral de função definida por partes", "dificil",
  R`Seja $f(x)=x^{2}$ para $x\leq1$ e $f(x)=2-x$ para $x>1$. Calcule $\displaystyle\int_{0}^{2}f(x)dx$.`,
  R`$\dfrac{5}{6}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{7}{6}$`, R`$\dfrac{4}{3}$`],
  R`Pela aditividade, $\displaystyle\int_{0}^{1}x^{2}dx+\displaystyle\int_{1}^{2}\left(2-x\right)dx=\dfrac{1}{3}+\left(4-2-2+\dfrac{1}{2}\right)=\dfrac{1}{3}+\dfrac{1}{2}=\dfrac{5}{6}$.`,
  5 / 6,
  () => simpson((x) => (x <= 1 ? x * x : 2 - x), 0, 2, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Média de uma função afim por partes", "dificil",
  R`Seja $f(x)=\left|2x-4\right|$. Calcule $\displaystyle\int_{0}^{5}f(x)dx$.`,
  R`$13$`,
  [R`$9$`, R`$11$`, R`$15$`, R`$17$`],
  R`O vértice está em $x=2$. Em $\left[0,2\right]$, $f(x)=4-2x$, com integral $8-4=4$; em $\left[2,5\right]$, $f(x)=2x-4$, com integral $\left(25-20\right)-\left(4-8\right)=9$. O total é $13$ — ou, geometricamente, dois triângulos de áreas $4$ e $9$.`,
  13,
  () => simpson((x) => Math.abs(2 * x - 4), 0, 5, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral de uma função escada", "medio",
  R`Seja $f(x)=1$ para $0\leq x<2$, $f(x)=3$ para $2\leq x<3$ e $f(x)=-1$ para $3\leq x\leq5$. Calcule $\displaystyle\int_{0}^{5}f(x)dx$.`,
  R`$3$`,
  [R`$5$`, R`$7$`, R`$1$`, R`$-3$`],
  R`A integral de uma função escada é a soma das áreas com sinal dos retângulos: $1\cdot2+3\cdot1+\left(-1\right)\cdot2=2+3-2=3$.`,
  3,
  () => simpson((x) => (x < 2 ? 1 : x < 3 ? 3 : -1), 0, 5, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Definida", "Integral com sinal de um cosseno em três quartos de período", "dificil",
  R`Calcule $\displaystyle\int_{0}^{3\pi/2}\cos x\,dx$.`,
  R`$-1$`,
  [R`$1$`, R`$0$`, R`$2$`, R`$-2$`],
  R`A primitiva é $\operatorname{sen}x$, logo a integral vale $\operatorname{sen}\dfrac{3\pi}{2}-\operatorname{sen}0=-1$. A área positiva de $\left[0,\frac{\pi}{2}\right]$ vale $1$ e a negativa de $\left[\frac{\pi}{2},\frac{3\pi}{2}\right]$ vale $-2$.`,
  -1,
  () => simpson(Math.cos, 0, (3 * Math.PI) / 2)
);

// ===========================================================================
// APLICAÇÕES DA INTEGRAL DEFINIDA — 41
// ===========================================================================

// --- áreas ------------------------------------------------------------------
q(
  "Aplicações da Integral Definida", "Área entre duas parábolas opostas", "medio",
  R`Calcule a área da região limitada pelas curvas $y=x^{2}$ e $y=2x-x^{2}$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{6}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{4}{3}$`],
  R`Igualando, $x^{2}=2x-x^{2}$ dá $2x\left(x-1\right)=0$, com interseções em $x=0$ e $x=1$. Nesse intervalo a segunda curva está acima, e a área é $\displaystyle\int_{0}^{1}\left(2x-2x^{2}\right)dx=1-\dfrac{2}{3}=\dfrac{1}{3}$.`,
  1 / 3,
  () => simpson((x) => 2 * x - x * x - x * x, 0, 1)
);

q(
  "Aplicações da Integral Definida", "Área entre a cúbica e a bissetriz", "dificil",
  R`Calcule a área total da região limitada pelas curvas $y=x^{3}$ e $y=x$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{4}$`, R`$\dfrac{1}{3}$`, R`$1$`, R`$\dfrac{3}{4}$`],
  R`As curvas se cruzam em $x=-1$, $0$ e $1$. Como $\left|x-x^{3}\right|$ é par, a área total é $2\displaystyle\int_{0}^{1}\left(x-x^{3}\right)dx=2\left(\dfrac{1}{2}-\dfrac{1}{4}\right)=\dfrac{1}{2}$. Integrar $x-x^{3}$ direto de $-1$ a $1$ daria $0$: os dois laços têm sinais opostos.`,
  1 / 2,
  () => simpson((x) => Math.abs(x - x ** 3), -1, 1, 200000),
  { tol: 1e-3 }
);

q(
  "Aplicações da Integral Definida", "Área entre a raiz e a parábola", "medio",
  R`Calcule a área da região limitada pelas curvas $y=\sqrt{x}$ e $y=x^{2}$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{6}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{5}{6}$`],
  R`As curvas se cruzam em $x=0$ e $x=1$, e ali $\sqrt{x}\geq x^{2}$. A área é $\displaystyle\int_{0}^{1}\left(\sqrt{x}-x^{2}\right)dx=\dfrac{2}{3}-\dfrac{1}{3}=\dfrac{1}{3}$.`,
  1 / 3,
  () => simpson((x) => Math.sqrt(x) - x * x, 0, 1, 200000),
  { tol: 1e-3 }
);

q(
  "Aplicações da Integral Definida", "Área entre uma parábola e o eixo x", "medio",
  R`Calcule a área da região limitada pela parábola $y=x^{2}-4$ e pelo eixo $x$.`,
  R`$\dfrac{32}{3}$`,
  [R`$\dfrac{16}{3}$`, R`$\dfrac{64}{3}$`, R`$8$`, R`$16$`],
  R`A parábola corta o eixo em $x=\pm2$ e fica abaixo dele entre esses pontos. A área é $\displaystyle\int_{-2}^{2}\left(4-x^{2}\right)dx=2\left(8-\dfrac{8}{3}\right)=\dfrac{32}{3}$.`,
  32 / 3,
  () => simpson((x) => 4 - x * x, -2, 2)
);

q(
  "Aplicações da Integral Definida", "Área geométrica do seno num período", "medio",
  R`Calcule a área total da região limitada pela curva $y=\operatorname{sen}x$ e pelo eixo $x$, com $0\leq x\leq2\pi$.`,
  R`$4$`,
  [R`$0$`, R`$2$`, R`$2\pi$`, R`$\pi$`],
  R`Área é sempre positiva, então integra-se o módulo: $\displaystyle\int_{0}^{2\pi}\left|\operatorname{sen}x\right|dx=2\displaystyle\int_{0}^{\pi}\operatorname{sen}x\,dx=2\cdot2=4$. A integral sem módulo daria $0$.`,
  4,
  () => simpson((x) => Math.abs(Math.sin(x)), 0, 2 * Math.PI, 200000),
  { tol: 1e-3 }
);

q(
  "Aplicações da Integral Definida", "Área entre a exponencial e uma reta horizontal", "medio",
  R`Calcule a área da região limitada por $y=e^{x}$, $y=1$ e $x=1$.`,
  R`$e-2$`,
  [R`$e-1$`, R`$e$`, R`$\dfrac{e-1}{2}$`, R`$e+1$`],
  R`As curvas $y=e^{x}$ e $y=1$ se cruzam em $x=0$, e para $x>0$ a exponencial está acima. A área é $\displaystyle\int_{0}^{1}\left(e^{x}-1\right)dx=\left(e-1\right)-1=e-2$.`,
  Math.E - 2,
  () => simpson((x) => Math.exp(x) - 1, 0, 1)
);

q(
  "Aplicações da Integral Definida", "Área entre a hipérbole e seu quadrado", "dificil",
  R`Calcule a área da região limitada por $y=\dfrac{1}{x}$, $y=\dfrac{1}{x^{2}}$, $x=1$ e $x=2$.`,
  R`$\ln 2-\dfrac{1}{2}$`,
  [R`$\ln 2+\dfrac{1}{2}$`, R`$\dfrac{1}{2}-\ln 2$`, R`$\ln 2-1$`, R`$2\ln 2-\dfrac{1}{2}$`],
  R`Para $x>1$ vale $\dfrac{1}{x}>\dfrac{1}{x^{2}}$. A área é $\displaystyle\int_{1}^{2}\left(\dfrac{1}{x}-\dfrac{1}{x^{2}}\right)dx=\left[\ln x+\dfrac{1}{x}\right]_{1}^{2}=\left(\ln 2+\dfrac{1}{2}\right)-1=\ln 2-\dfrac{1}{2}$.`,
  Math.log(2) - 0.5,
  () => simpson((x) => 1 / x - 1 / (x * x), 1, 2)
);

q(
  "Aplicações da Integral Definida", "Área entre uma reta e uma parábola achatada", "medio",
  R`Calcule a área da região limitada pelas curvas $y=x$ e $y=\dfrac{x^{2}}{4}$.`,
  R`$\dfrac{8}{3}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{16}{3}$`, R`$\dfrac{32}{3}$`, R`$4$`],
  R`Igualando, $x=\dfrac{x^{2}}{4}$ dá $x=0$ e $x=4$, e nesse intervalo a reta está acima. A área é $\displaystyle\int_{0}^{4}\left(x-\dfrac{x^{2}}{4}\right)dx=8-\dfrac{16}{3}=\dfrac{8}{3}$.`,
  8 / 3,
  () => simpson((x) => x - (x * x) / 4, 0, 4)
);

q(
  "Aplicações da Integral Definida", "Área entre parábola e reta com raízes assimétricas", "dificil",
  R`Calcule a área da região limitada pela parábola $y=4-x^{2}$ e pela reta $y=x+2$.`,
  R`$\dfrac{9}{2}$`,
  [R`$\dfrac{7}{2}$`, R`$\dfrac{9}{4}$`, R`$6$`, R`$\dfrac{27}{2}$`],
  R`Igualando, $4-x^{2}=x+2$ dá $x^{2}+x-2=0$, com raízes $x=-2$ e $x=1$. Entre elas a parábola está acima, e a área é $\displaystyle\int_{-2}^{1}\left(2-x-x^{2}\right)dx=\left[2x-\dfrac{x^{2}}{2}-\dfrac{x^{3}}{3}\right]_{-2}^{1}=\dfrac{7}{6}+\dfrac{10}{3}=\dfrac{9}{2}$.`,
  9 / 2,
  () => simpson((x) => 4 - x * x - (x + 2), -2, 1)
);

q(
  "Aplicações da Integral Definida", "Área entre cosseno e seno num quarto de período", "medio",
  R`Calcule a área da região limitada por $y=\cos x$, $y=\operatorname{sen}x$, $x=0$ e $x=\dfrac{\pi}{4}$.`,
  R`$\sqrt{2}-1$`,
  [R`$1-\dfrac{\sqrt{2}}{2}$`, R`$2-\sqrt{2}$`, R`$\sqrt{2}$`, R`$\dfrac{\sqrt{2}}{2}$`],
  R`Em $\left[0,\dfrac{\pi}{4}\right]$ vale $\cos x\geq\operatorname{sen}x$. A área é $\displaystyle\int_{0}^{\pi/4}\left(\cos x-\operatorname{sen}x\right)dx=\left[\operatorname{sen}x+\cos x\right]_{0}^{\pi/4}=\sqrt{2}-1$.`,
  Math.SQRT2 - 1,
  () => simpson((x) => Math.cos(x) - Math.sin(x), 0, Math.PI / 4)
);

q(
  "Aplicações da Integral Definida", "Área por integração em relação a y", "dificil",
  R`Calcule a área da região limitada pelas curvas $x=y^{2}$ e $x=y+2$.`,
  R`$\dfrac{9}{2}$`,
  [R`$\dfrac{7}{2}$`, R`$\dfrac{9}{4}$`, R`$\dfrac{11}{2}$`, R`$6$`],
  R`Integrar em $y$ evita quebrar a região em duas. Igualando, $y^{2}=y+2$ dá $y=-1$ e $y=2$; entre esses valores a reta está à direita da parábola. A área é $\displaystyle\int_{-1}^{2}\left(y+2-y^{2}\right)dy=\left[\dfrac{y^{2}}{2}+2y-\dfrac{y^{3}}{3}\right]_{-1}^{2}=\dfrac{10}{3}+\dfrac{7}{6}=\dfrac{9}{2}$.`,
  9 / 2,
  () => simpson((y) => y + 2 - y * y, -1, 2)
);

q(
  "Aplicações da Integral Definida", "Área sob o logaritmo", "dificil",
  R`Calcule a área da região limitada por $y=\ln x$, pelo eixo $x$ e pela reta $x=e$.`,
  R`$1$`,
  [R`$e$`, R`$e-1$`, R`$2$`, R`$\dfrac{e}{2}$`],
  R`A curva corta o eixo em $x=1$ e fica acima dele até $x=e$. A área é $\displaystyle\int_{1}^{e}\ln x\,dx$; integrando por partes, $\left[x\ln x-x\right]_{1}^{e}=\left(e-e\right)-\left(0-1\right)=1$.`,
  1,
  () => simpson(Math.log, 1, Math.E)
);

q(
  "Aplicações da Integral Definida", "Área entre um módulo e uma parábola", "dificil",
  R`Calcule a área da região limitada pelas curvas $y=\left|x\right|$ e $y=2-x^{2}$.`,
  R`$\dfrac{7}{3}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{5}{3}$`, R`$\dfrac{8}{3}$`, R`$\dfrac{7}{6}$`],
  R`Por simetria, basta o dobro da parte com $x\geq0$. Ali $x=2-x^{2}$ dá $x^{2}+x-2=0$, isto é, $x=1$. A área é $2\displaystyle\int_{0}^{1}\left(2-x^{2}-x\right)dx=2\left(2-\dfrac{1}{3}-\dfrac{1}{2}\right)=\dfrac{7}{3}$.`,
  7 / 3,
  () => simpson((x) => 2 - x * x - Math.abs(x), -1, 1, 200000),
  { tol: 1e-3 }
);

q(
  "Aplicações da Integral Definida", "Área entre cúbica e eixo com dois laços", "dificil",
  R`Calcule a área total da região limitada pela curva $y=x^{3}-4x$ e pelo eixo $x$.`,
  R`$8$`,
  [R`$4$`, R`$16$`, R`$\dfrac{16}{3}$`, R`$12$`],
  R`As raízes são $x=0$ e $x=\pm2$, e $\left|x^{3}-4x\right|$ é par. A área total é $2\displaystyle\int_{0}^{2}\left(4x-x^{3}\right)dx=2\left(8-4\right)=8$.`,
  8,
  () => simpson((x) => Math.abs(x ** 3 - 4 * x), -2, 2, 200000),
  { tol: 1e-3 }
);

q(
  "Aplicações da Integral Definida", "Área sob uma curva com arco-tangente", "medio",
  R`Calcule a área da região limitada por $y=\dfrac{1}{1+x^{2}}$, pelo eixo $x$ e pelas retas $x=0$ e $x=1$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{6}$`, R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{8}$`],
  R`A função é positiva em todo o intervalo, então a área é a própria integral: $\displaystyle\int_{0}^{1}\dfrac{dx}{1+x^{2}}=\operatorname{arctg}1=\dfrac{\pi}{4}$.`,
  Math.PI / 4,
  () => simpson((x) => 1 / (1 + x * x), 0, 1)
);

// --- volumes de sólidos de revolução ----------------------------------------
q(
  "Aplicações da Integral Definida", "Volume por discos com a raiz quadrada", "medio",
  R`A região sob $y=\sqrt{x}$, com $0\leq x\leq4$, gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$8\pi$`,
  [R`$4\pi$`, R`$16\pi$`, R`$\dfrac{16\pi}{3}$`, R`$32\pi$`],
  R`Pelo método dos discos, $V=\pi\displaystyle\int_{0}^{4}\left(\sqrt{x}\right)^{2}dx=\pi\displaystyle\int_{0}^{4}x\,dx=\pi\cdot8=8\pi$.`,
  8 * Math.PI,
  () => Math.PI * simpson((x) => x, 0, 4)
);

q(
  "Aplicações da Integral Definida", "Volume por discos com uma parábola", "medio",
  R`A região sob $y=x^{2}$, com $0\leq x\leq1$, gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{\pi}{5}$`,
  [R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{2\pi}{5}$`, R`$\dfrac{\pi}{2}$`],
  R`Pelo método dos discos, $V=\pi\displaystyle\int_{0}^{1}x^{4}dx=\dfrac{\pi}{5}$.`,
  Math.PI / 5,
  () => Math.PI * simpson((x) => x ** 4, 0, 1)
);

q(
  "Aplicações da Integral Definida", "Volume por anéis entre reta e parábola", "dificil",
  R`A região entre $y=x$ e $y=x^{2}$ gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{2\pi}{15}$`,
  [R`$\dfrac{\pi}{15}$`, R`$\dfrac{4\pi}{15}$`, R`$\dfrac{\pi}{6}$`, R`$\dfrac{\pi}{5}$`],
  R`As curvas se cruzam em $x=0$ e $x=1$, com $x\geq x^{2}$ ali. Pelo método dos anéis, $V=\pi\displaystyle\int_{0}^{1}\left(x^{2}-x^{4}\right)dx=\pi\left(\dfrac{1}{3}-\dfrac{1}{5}\right)=\dfrac{2\pi}{15}$.`,
  (2 * Math.PI) / 15,
  () => Math.PI * simpson((x) => x * x - x ** 4, 0, 1)
);

q(
  "Aplicações da Integral Definida", "Volume por cascas cilíndricas", "dificil",
  R`A região sob $y=x^{2}$, com $0\leq x\leq2$, gira em torno do eixo $y$. Calcule o volume do sólido gerado.`,
  R`$8\pi$`,
  [R`$4\pi$`, R`$16\pi$`, R`$\dfrac{32\pi}{5}$`, R`$\dfrac{16\pi}{3}$`],
  R`Pelo método das cascas, $V=2\pi\displaystyle\int_{0}^{2}x\cdot x^{2}dx=2\pi\left[\dfrac{x^{4}}{4}\right]_{0}^{2}=2\pi\cdot4=8\pi$.`,
  8 * Math.PI,
  () => 2 * Math.PI * simpson((x) => x * x * x, 0, 2)
);

q(
  "Aplicações da Integral Definida", "Cascas cilíndricas numa região entre curvas", "dificil",
  R`A região entre $y=x$ e $y=x^{2}$ gira em torno do eixo $y$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{\pi}{6}$`,
  [R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{12}$`, R`$\dfrac{2\pi}{15}$`, R`$\dfrac{\pi}{2}$`],
  R`Pelo método das cascas, $V=2\pi\displaystyle\int_{0}^{1}x\left(x-x^{2}\right)dx=2\pi\left(\dfrac{1}{3}-\dfrac{1}{4}\right)=\dfrac{2\pi}{12}=\dfrac{\pi}{6}$.`,
  Math.PI / 6,
  () => 2 * Math.PI * simpson((x) => x * (x - x * x), 0, 1)
);

q(
  "Aplicações da Integral Definida", "Cascas cilíndricas com a cúbica", "medio",
  R`A região sob $y=x^{3}$, com $0\leq x\leq1$, gira em torno do eixo $y$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{2\pi}{5}$`,
  [R`$\dfrac{\pi}{5}$`, R`$\dfrac{\pi}{7}$`, R`$\dfrac{2\pi}{7}$`, R`$\dfrac{\pi}{4}$`],
  R`Pelo método das cascas, $V=2\pi\displaystyle\int_{0}^{1}x\cdot x^{3}dx=2\pi\cdot\dfrac{1}{5}=\dfrac{2\pi}{5}$.`,
  (2 * Math.PI) / 5,
  () => 2 * Math.PI * simpson((x) => x ** 4, 0, 1)
);

q(
  "Aplicações da Integral Definida", "Revolução em torno de uma reta horizontal", "dificil",
  R`A região entre $y=x^{2}$ e o eixo $x$, com $0\leq x\leq1$, gira em torno da reta $y=-1$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{13\pi}{15}$`,
  [R`$\dfrac{8\pi}{15}$`, R`$\dfrac{\pi}{5}$`, R`$\dfrac{23\pi}{15}$`, R`$\dfrac{7\pi}{15}$`],
  R`O raio externo é $x^{2}+1$ e o interno é $1$ (a distância do eixo $x$ à reta). Pelo método dos anéis, $V=\pi\displaystyle\int_{0}^{1}\left[\left(x^{2}+1\right)^{2}-1\right]dx=\pi\displaystyle\int_{0}^{1}\left(x^{4}+2x^{2}\right)dx=\pi\left(\dfrac{1}{5}+\dfrac{2}{3}\right)=\dfrac{13\pi}{15}$.`,
  (13 * Math.PI) / 15,
  () => Math.PI * simpson((x) => (x * x + 1) ** 2 - 1, 0, 1)
);

q(
  "Aplicações da Integral Definida", "Volume com a hipérbole em torno do eixo x", "medio",
  R`A região sob $y=\dfrac{1}{x}$, com $1\leq x\leq2$, gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{\pi}{2}$`,
  [R`$\pi$`, R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{4}$`, R`$2\pi$`],
  R`Pelo método dos discos, $V=\pi\displaystyle\int_{1}^{2}\dfrac{dx}{x^{2}}=\pi\left[-\dfrac{1}{x}\right]_{1}^{2}=\pi\left(1-\dfrac{1}{2}\right)=\dfrac{\pi}{2}$.`,
  Math.PI / 2,
  () => Math.PI * simpson((x) => 1 / (x * x), 1, 2)
);

q(
  "Aplicações da Integral Definida", "Volume gerado pelo arco de seno", "dificil",
  R`A região sob $y=\operatorname{sen}x$, com $0\leq x\leq\pi$, gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{\pi^{2}}{2}$`,
  [R`$\dfrac{\pi^{2}}{4}$`, R`$\pi^{2}$`, R`$2\pi^{2}$`, R`$\dfrac{\pi}{2}$`],
  R`Pelo método dos discos, $V=\pi\displaystyle\int_{0}^{\pi}\operatorname{sen}^{2}x\,dx$. Usando $\operatorname{sen}^{2}x=\dfrac{1-\cos 2x}{2}$, a integral vale $\dfrac{\pi}{2}$, logo $V=\pi\cdot\dfrac{\pi}{2}=\dfrac{\pi^{2}}{2}$.`,
  Math.PI ** 2 / 2,
  () => Math.PI * simpson((x) => Math.sin(x) ** 2, 0, Math.PI)
);

q(
  "Aplicações da Integral Definida", "Volume com integrando exponencial", "dificil",
  R`A região sob $y=e^{-x}$, com $0\leq x\leq1$, gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{\pi\left(1-e^{-2}\right)}{2}$`,
  [R`$\pi\left(1-e^{-2}\right)$`, R`$\dfrac{\pi\left(1-e^{-1}\right)}{2}$`, R`$\dfrac{\pi\left(1+e^{-2}\right)}{2}$`, R`$\dfrac{\pi e^{-2}}{2}$`],
  R`Pelo método dos discos, $V=\pi\displaystyle\int_{0}^{1}e^{-2x}dx=\pi\left[-\dfrac{e^{-2x}}{2}\right]_{0}^{1}=\dfrac{\pi\left(1-e^{-2}\right)}{2}$.`,
  (Math.PI * (1 - Math.exp(-2))) / 2,
  () => Math.PI * simpson((x) => Math.exp(-2 * x), 0, 1)
);

q(
  "Aplicações da Integral Definida", "Volume de uma esfera por integração", "medio",
  R`A região sob $y=\sqrt{9-x^{2}}$, com $-3\leq x\leq3$, gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$36\pi$`,
  [R`$18\pi$`, R`$27\pi$`, R`$12\pi$`, R`$72\pi$`],
  R`O sólido é a esfera de raio $3$. Pelos discos, $V=\pi\displaystyle\int_{-3}^{3}\left(9-x^{2}\right)dx=\pi\left(54-18\right)=36\pi$, que confere com $\dfrac{4}{3}\pi r^{3}$.`,
  36 * Math.PI,
  () => Math.PI * simpson((x) => 9 - x * x, -3, 3)
);

q(
  "Aplicações da Integral Definida", "Volume com a raiz do seno", "medio",
  R`A região sob $y=\sqrt{\operatorname{sen}x}$, com $0\leq x\leq\pi$, gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
  R`$2\pi$`,
  [R`$\pi$`, R`$4\pi$`, R`$\dfrac{\pi^{2}}{2}$`, R`$\dfrac{\pi}{2}$`],
  R`Pelos discos, $V=\pi\displaystyle\int_{0}^{\pi}\left(\sqrt{\operatorname{sen}x}\right)^{2}dx=\pi\displaystyle\int_{0}^{\pi}\operatorname{sen}x\,dx=\pi\cdot2=2\pi$. Elevar ao quadrado elimina o radical — por isso este é mais simples que o caso $y=\operatorname{sen}x$.`,
  2 * Math.PI,
  () => Math.PI * simpson(Math.sin, 0, Math.PI)
);

// --- volumes por seções transversais ----------------------------------------
q(
  "Aplicações da Integral Definida", "Sólido de seções quadradas sobre um disco", "dificil",
  R`A base de um sólido é o disco $x^{2}+y^{2}\leq4$, e as seções perpendiculares ao eixo $x$ são quadrados. Calcule seu volume.`,
  R`$\dfrac{128}{3}$`,
  [R`$\dfrac{64}{3}$`, R`$\dfrac{256}{3}$`, R`$32$`, R`$\dfrac{32}{3}$`],
  R`Em cada $x$, o lado do quadrado é a corda vertical do disco, de comprimento $2\sqrt{4-x^{2}}$, e a área da seção é $4\left(4-x^{2}\right)$. Logo $V=\displaystyle\int_{-2}^{2}4\left(4-x^{2}\right)dx=4\left(16-\dfrac{16}{3}\right)=\dfrac{128}{3}$.`,
  128 / 3,
  () => simpson((x) => (2 * Math.sqrt(4 - x * x)) ** 2, -2, 2)
);

q(
  "Aplicações da Integral Definida", "Sólido de seções triangulares equiláteras", "dificil",
  R`A base de um sólido é o disco $x^{2}+y^{2}\leq4$, e as seções perpendiculares ao eixo $x$ são triângulos equiláteros. Calcule seu volume.`,
  R`$\dfrac{32\sqrt{3}}{3}$`,
  [R`$\dfrac{16\sqrt{3}}{3}$`, R`$\dfrac{64\sqrt{3}}{3}$`, R`$\dfrac{32\sqrt{3}}{9}$`, R`$32\sqrt{3}$`],
  R`O lado é a corda $L=2\sqrt{4-x^{2}}$, e a área do triângulo equilátero é $\dfrac{\sqrt{3}}{4}L^{2}=\sqrt{3}\left(4-x^{2}\right)$. Então $V=\sqrt{3}\displaystyle\int_{-2}^{2}\left(4-x^{2}\right)dx=\sqrt{3}\cdot\dfrac{32}{3}=\dfrac{32\sqrt{3}}{3}$.`,
  (32 * Math.sqrt(3)) / 3,
  () => simpson((x) => (Math.sqrt(3) / 4) * (2 * Math.sqrt(4 - x * x)) ** 2, -2, 2)
);

q(
  "Aplicações da Integral Definida", "Sólido de seções semicirculares", "dificil",
  R`A base de um sólido é a região limitada por $y=1-x^{2}$ e pelo eixo $x$, e as seções perpendiculares ao eixo $x$ são semicírculos de diâmetro sobre a base. Calcule seu volume.`,
  R`$\dfrac{2\pi}{15}$`,
  [R`$\dfrac{4\pi}{15}$`, R`$\dfrac{16\pi}{15}$`, R`$\dfrac{\pi}{15}$`, R`$\dfrac{8\pi}{15}$`],
  R`O diâmetro da seção é $1-x^{2}$, então o raio é $\dfrac{1-x^{2}}{2}$ e a área do semicírculo é $\dfrac{\pi}{2}\cdot\dfrac{\left(1-x^{2}\right)^{2}}{4}=\dfrac{\pi\left(1-x^{2}\right)^{2}}{8}$. Como $\displaystyle\int_{-1}^{1}\left(1-x^{2}\right)^{2}dx=\dfrac{16}{15}$, vem $V=\dfrac{\pi}{8}\cdot\dfrac{16}{15}=\dfrac{2\pi}{15}$.`,
  (2 * Math.PI) / 15,
  () => simpson((x) => (Math.PI / 8) * (1 - x * x) ** 2, -1, 1)
);

// --- comprimento de arco ----------------------------------------------------
q(
  "Aplicações da Integral Definida", "Comprimento de arco de potência três meios", "dificil",
  R`Calcule o comprimento do arco da curva $y=\dfrac{2}{3}x^{3/2}$ de $x=1$ a $x=4$.`,
  R`$\dfrac{2\left(5\sqrt{5}-2\sqrt{2}\right)}{3}$`,
  [
    R`$\dfrac{2\left(5\sqrt{5}+2\sqrt{2}\right)}{3}$`,
    R`$\dfrac{5\sqrt{5}-2\sqrt{2}}{3}$`,
    R`$\dfrac{4\left(5\sqrt{5}-2\sqrt{2}\right)}{3}$`,
    R`$\dfrac{2\left(5\sqrt{5}-\sqrt{2}\right)}{3}$`,
  ],
  R`Como $y'=\sqrt{x}$, tem-se $1+\left(y'\right)^{2}=1+x$ e $L=\displaystyle\int_{1}^{4}\sqrt{1+x}\,dx=\left[\dfrac{2}{3}\left(1+x\right)^{3/2}\right]_{1}^{4}=\dfrac{2}{3}\left(5^{3/2}-2^{3/2}\right)=\dfrac{2\left(5\sqrt{5}-2\sqrt{2}\right)}{3}$.`,
  (2 * (5 * Math.sqrt(5) - 2 * Math.SQRT2)) / 3,
  () => comprimentoArco((x) => (2 / 3) * Math.pow(x, 1.5), 1, 4)
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco com quadrado perfeito", "dificil",
  R`Calcule o comprimento do arco da curva $y=\dfrac{x^{3}}{3}+\dfrac{1}{4x}$ de $x=1$ a $x=2$.`,
  R`$\dfrac{59}{24}$`,
  [R`$\dfrac{49}{24}$`, R`$\dfrac{67}{24}$`, R`$\dfrac{59}{12}$`, R`$\dfrac{7}{3}$`],
  R`Tem-se $y'=x^{2}-\dfrac{1}{4x^{2}}$, de modo que $1+\left(y'\right)^{2}=x^{4}+\dfrac{1}{2}+\dfrac{1}{16x^{4}}=\left(x^{2}+\dfrac{1}{4x^{2}}\right)^{2}$ — o radical some. Assim $L=\displaystyle\int_{1}^{2}\left(x^{2}+\dfrac{1}{4x^{2}}\right)dx=\left[\dfrac{x^{3}}{3}-\dfrac{1}{4x}\right]_{1}^{2}=\left(\dfrac{8}{3}-\dfrac{1}{8}\right)-\left(\dfrac{1}{3}-\dfrac{1}{4}\right)=\dfrac{59}{24}$.`,
  59 / 24,
  () => comprimentoArco((x) => x ** 3 / 3 + 1 / (4 * x), 1, 2)
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco com logaritmo", "dificil",
  R`Calcule o comprimento do arco da curva $y=\dfrac{x^{2}}{2}-\dfrac{\ln x}{4}$ de $x=1$ a $x=2$.`,
  R`$\dfrac{3}{2}+\dfrac{\ln 2}{4}$`,
  [R`$\dfrac{3}{2}-\dfrac{\ln 2}{4}$`, R`$\dfrac{3}{2}+\dfrac{\ln 2}{2}$`, R`$\dfrac{5}{2}+\dfrac{\ln 2}{4}$`, R`$3+\dfrac{\ln 2}{4}$`],
  R`Tem-se $y'=x-\dfrac{1}{4x}$ e $1+\left(y'\right)^{2}=x^{2}+\dfrac{1}{2}+\dfrac{1}{16x^{2}}=\left(x+\dfrac{1}{4x}\right)^{2}$. Logo $L=\displaystyle\int_{1}^{2}\left(x+\dfrac{1}{4x}\right)dx=\left[\dfrac{x^{2}}{2}+\dfrac{\ln x}{4}\right]_{1}^{2}=\dfrac{3}{2}+\dfrac{\ln 2}{4}$.`,
  1.5 + Math.log(2) / 4,
  () => comprimentoArco((x) => (x * x) / 2 - Math.log(x) / 4, 1, 2)
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco com radical de dois", "dificil",
  R`Calcule o comprimento do arco da curva $y=\dfrac{1}{3}\left(x^{2}+2\right)^{3/2}$ de $x=0$ a $x=1$.`,
  R`$\dfrac{4}{3}$`,
  [R`$\dfrac{2}{3}$`, R`$\dfrac{5}{3}$`, R`$\dfrac{8}{3}$`, R`$\dfrac{7}{6}$`],
  R`Derivando, $y'=x\sqrt{x^{2}+2}$, de modo que $1+\left(y'\right)^{2}=1+x^{4}+2x^{2}=\left(x^{2}+1\right)^{2}$. Então $L=\displaystyle\int_{0}^{1}\left(x^{2}+1\right)dx=\dfrac{1}{3}+1=\dfrac{4}{3}$.`,
  4 / 3,
  () => comprimentoArco((x) => (1 / 3) * Math.pow(x * x + 2, 1.5), 0, 1)
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco da catenária", "dificil",
  R`Calcule o comprimento do arco da curva $y=\dfrac{e^{x}+e^{-x}}{2}$ de $x=0$ a $x=1$.`,
  R`$\dfrac{e-e^{-1}}{2}$`,
  [R`$\dfrac{e+e^{-1}}{2}$`, R`$e-e^{-1}$`, R`$\dfrac{e-1}{2}$`, R`$\dfrac{e^{2}-1}{2}$`],
  R`Com $y'=\dfrac{e^{x}-e^{-x}}{2}$, tem-se $1+\left(y'\right)^{2}=\left(\dfrac{e^{x}+e^{-x}}{2}\right)^{2}$, porque $\cosh^{2}-\operatorname{senh}^{2}=1$. Assim $L=\displaystyle\int_{0}^{1}\dfrac{e^{x}+e^{-x}}{2}dx=\left[\dfrac{e^{x}-e^{-x}}{2}\right]_{0}^{1}=\dfrac{e-e^{-1}}{2}$.`,
  (Math.E - 1 / Math.E) / 2,
  () => comprimentoArco((x) => (Math.exp(x) + Math.exp(-x)) / 2, 0, 1)
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco com potência três meios deslocada", "dificil",
  R`Calcule o comprimento do arco da curva $y=x^{3/2}$ de $x=0$ a $x=4$.`,
  R`$\dfrac{8\left(10\sqrt{10}-1\right)}{27}$`,
  [R`$\dfrac{4\left(10\sqrt{10}-1\right)}{27}$`, R`$\dfrac{8\left(10\sqrt{10}+1\right)}{27}$`, R`$\dfrac{8\left(10\sqrt{10}-1\right)}{9}$`, R`$\dfrac{10\sqrt{10}-1}{27}$`],
  R`Com $y'=\dfrac{3}{2}\sqrt{x}$, tem-se $1+\left(y'\right)^{2}=1+\dfrac{9x}{4}$ e $L=\displaystyle\int_{0}^{4}\sqrt{1+\dfrac{9x}{4}}\,dx=\dfrac{8}{27}\left[\left(1+\dfrac{9x}{4}\right)^{3/2}\right]_{0}^{4}=\dfrac{8}{27}\left(10^{3/2}-1\right)=\dfrac{8\left(10\sqrt{10}-1\right)}{27}$.`,
  (8 * (10 * Math.sqrt(10) - 1)) / 27,
  () => comprimentoArco((x) => Math.pow(x, 1.5), 1e-5, 4),
  { tol: 1e-3 }
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco de uma reta por integração", "medio",
  R`Calcule o comprimento do arco da curva $y=3x+1$ de $x=0$ a $x=2$.`,
  R`$2\sqrt{10}$`,
  [R`$\sqrt{10}$`, R`$4\sqrt{10}$`, R`$2\sqrt{5}$`, R`$6$`],
  R`Com $y'=3$, tem-se $1+\left(y'\right)^{2}=10$ e $L=\displaystyle\int_{0}^{2}\sqrt{10}\,dx=2\sqrt{10}$ — que é exatamente a distância entre $\left(0,1\right)$ e $\left(2,7\right)$, como tem de ser para uma reta.`,
  2 * Math.sqrt(10),
  () => comprimentoArco((x) => 3 * x + 1, 0, 2)
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco com quarta potência", "dificil",
  R`Calcule o comprimento do arco da curva $y=\dfrac{x^{4}}{8}+\dfrac{1}{4x^{2}}$ de $x=1$ a $x=2$.`,
  R`$\dfrac{33}{16}$`,
  [R`$\dfrac{31}{16}$`, R`$\dfrac{35}{16}$`, R`$\dfrac{33}{8}$`, R`$\dfrac{17}{8}$`],
  R`Tem-se $y'=\dfrac{x^{3}}{2}-\dfrac{1}{2x^{3}}$ e $1+\left(y'\right)^{2}=\dfrac{x^{6}}{4}+\dfrac{1}{2}+\dfrac{1}{4x^{6}}=\left(\dfrac{x^{3}}{2}+\dfrac{1}{2x^{3}}\right)^{2}$. Logo $L=\displaystyle\int_{1}^{2}\left(\dfrac{x^{3}}{2}+\dfrac{1}{2x^{3}}\right)dx=\left[\dfrac{x^{4}}{8}-\dfrac{1}{4x^{2}}\right]_{1}^{2}=\left(2-\dfrac{1}{16}\right)-\left(\dfrac{1}{8}-\dfrac{1}{4}\right)=\dfrac{33}{16}$.`,
  33 / 16,
  () => comprimentoArco((x) => x ** 4 / 8 + 1 / (4 * x * x), 1, 2)
);

q(
  "Aplicações da Integral Definida", "Área entre duas parábolas de concavidades opostas", "medio",
  R`Calcule a área da região limitada pelas curvas $y=x^{2}$ e $y=8-x^{2}$.`,
  R`$\dfrac{64}{3}$`,
  [R`$\dfrac{32}{3}$`, R`$\dfrac{128}{3}$`, R`$\dfrac{16}{3}$`, R`$32$`],
  R`Igualando, $x^{2}=8-x^{2}$ dá $x=\pm2$, e entre esses pontos a segunda curva está acima. A área é $\displaystyle\int_{-2}^{2}\left(8-2x^{2}\right)dx=32-2\cdot\dfrac{16}{3}=\dfrac{64}{3}$.`,
  64 / 3,
  () => simpson((x) => 8 - x * x - x * x, -2, 2)
);

q(
  "Aplicações da Integral Definida", "Cascas cilíndricas com a raiz quadrada", "dificil",
  R`A região sob $y=\sqrt{x}$, com $0\leq x\leq1$, gira em torno do eixo $y$. Calcule o volume do sólido gerado.`,
  R`$\dfrac{4\pi}{5}$`,
  [R`$\dfrac{2\pi}{5}$`, R`$\dfrac{8\pi}{5}$`, R`$\dfrac{4\pi}{7}$`, R`$\dfrac{\pi}{5}$`],
  R`Pelo método das cascas, $V=2\pi\displaystyle\int_{0}^{1}x\sqrt{x}\,dx=2\pi\displaystyle\int_{0}^{1}x^{3/2}dx=2\pi\cdot\dfrac{2}{5}=\dfrac{4\pi}{5}$.`,
  (4 * Math.PI) / 5,
  () => 2 * Math.PI * simpson((x) => x * Math.sqrt(x), 0, 1, 200000),
  { tol: 1e-3 }
);

q(
  "Aplicações da Integral Definida", "Comprimento de arco com secante", "dificil",
  R`Calcule o comprimento do arco da curva $y=\ln\left(\cos x\right)$ de $x=0$ a $x=\dfrac{\pi}{4}$.`,
  R`$\ln\left(1+\sqrt{2}\right)$`,
  [R`$\ln\left(2+\sqrt{2}\right)$`, R`$\ln\left(\sqrt{2}-1\right)$`, R`$\ln\left(2+\sqrt{3}\right)$`, R`$2\ln\left(1+\sqrt{2}\right)$`],
  R`Como $y'=-\operatorname{tg}x$, tem-se $1+\left(y'\right)^{2}=1+\operatorname{tg}^{2}x=\sec^{2}x$, e o radical vira $\sec x$ (positivo no intervalo). Então $L=\displaystyle\int_{0}^{\pi/4}\sec x\,dx=\left[\ln\left|\sec x+\operatorname{tg}x\right|\right]_{0}^{\pi/4}=\ln\left(\sqrt{2}+1\right)$.`,
  Math.log(1 + Math.SQRT2),
  () => comprimentoArco((x) => Math.log(Math.cos(x)), 0, Math.PI / 4)
);

finalizar("calculo1_lote8.json", 20260915);
