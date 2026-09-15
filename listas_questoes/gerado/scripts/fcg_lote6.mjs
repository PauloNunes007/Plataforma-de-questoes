// Lote 6 de Fundamentos de Cálculo e Geometria — 36 questões:
// 20 de FUNÇÃO INVERSA + 16 de CLASSES DE FUNÇÕES E SEUS GRÁFICOS.
//
// Estes dois tópicos já tinham 29 questões cada, então o critério aqui foi
// ANGULAR: cada questão ataca o assunto por um mecanismo que o banco ainda não
// cobria — domínio da inversa (= imagem da direta), pontos fixos de $f$ e
// $f^{-1}$, involução homográfica, inversa obtida sem fórmula fechada (função
// monótona resolvida por bisseção), inversa dada e função pedida, dupla
// simetria gerando periodicidade, contagem de interseções de gráficos, o
// parâmetro que faz uma equação modular ter exatamente três raízes.
//
// Estilo Stewart (Pré-cálculo). Conferência acoplada: ver fcg_kit.mjs.
// Rode: node listas_questoes/gerado/scripts/fcg_lote6.mjs
import {
  R,
  q,
  qConjunto,
  qFuncao,
  finalizar,
  raizes,
  raizesComTangencia,
  bissecao,
  extremo,
  inversaNum,
  periodo,
  naImagem,
  grade,
  ge,
  gt,
  le,
  lt,
} from "./fcg_kit.mjs";

const INV = "Função Inversa";
const CLS = "Classes de Funções e seus Gráficos";
const soma = (xs) => xs.reduce((s, x) => s + x, 0);
const TAU = 2 * Math.PI;

// ===========================================================================
// FUNÇÃO INVERSA
// ===========================================================================
q(INV, "Inversa de função logística elementar", "medio",
  R`Seja $f(x)=\dfrac{2^{x}}{2^{x}+1}$. Determine $f^{-1}\left(\dfrac{1}{3}\right)$.`,
  R`$-1$`,
  [R`$1$`, R`$-2$`, R`$2$`, R`$0$`],
  R`Resolva $f(x)=\tfrac{1}{3}$ com $t=2^{x}>0$: $\dfrac{t}{t+1}=\dfrac{1}{3}$ dá $3t=t+1$, isto é $t=\tfrac{1}{2}$. Como $2^{x}=2^{-1}$, tem-se $x=-1$. (A função é crescente e tem imagem $\left(0,1\right)$, então $\tfrac{1}{3}$ realmente tem uma única pré-imagem.)`,
  -1,
  () => inversaNum((x) => Math.pow(2, x) / (Math.pow(2, x) + 1), -40, 40, 1 / 3));

qConjunto(INV, "Domínio da inversa como imagem da direta", "medio",
  R`Seja $f(x)=\sqrt{x-1}+2$, com domínio máximo. Determine o domínio de $f^{-1}$.`,
  R`$\left[2,+\infty\right)$`,
  [R`$\left(2,+\infty\right)$`, R`$\left[1,+\infty\right)$`, R`$\mathbb{R}$`, R`$\left[0,+\infty\right)$`],
  R`O domínio da inversa é exatamente a IMAGEM da função direta — essa é a troca de papéis que define $f^{-1}$. O domínio de $f$ é $x\geq1$; nele, $\sqrt{x-1}$ percorre $\left[0,+\infty\right)$, e somando $2$ a imagem de $f$ é $\left[2,+\infty\right)$. O extremo $2$ entra porque é atingido em $x=1$. Logo o domínio de $f^{-1}$ é $\left[2,+\infty\right)$ — e não $\left[1,+\infty\right)$, que é o domínio de $f$.`,
  {
    alvo: (y) => naImagem((x) => Math.sqrt(x - 1) + 2, y, [[1, 1e8]]),
    cand: (y) => ge(y, 2),
    distCand: [(y) => gt(y, 2), (y) => ge(y, 1), () => true, (y) => ge(y, 0)],
    amostras: grade(-2, 18, 601, [0, 1, 2]),
  });

q(INV, "Interseção dos gráficos de f e da inversa", "dificil",
  R`A função $f(x)=x^{2}-4x+6$, restrita a $\left[2,+\infty\right)$, é crescente e portanto invertível. Determine a soma das abscissas dos pontos em que os gráficos de $f$ e $f^{-1}$ se cruzam.`,
  R`$5$`,
  [R`$6$`, R`$4$`, R`$3$`, R`$7$`],
  R`Os gráficos de $f$ e $f^{-1}$ são simétricos em relação à reta $y=x$. Quando $f$ é CRESCENTE, todo cruzamento entre eles está sobre essa reta, de modo que basta resolver $f(x)=x$: $x^{2}-4x+6=x$, isto é $x^{2}-5x+6=0$, com $x=2$ e $x=3$ — ambos no domínio $\left[2,+\infty\right)$. A soma das abscissas é $5$.`,
  5,
  () => soma(raizes((x) => x * x - 4 * x + 6 - x, 2, 20)));

qFuncao(INV, "Inversa de quadrática com domínio restrito", "dificil",
  R`Seja $f(x)=x^{2}-6x+5$, restrita a $x\geq3$. Determine a expressão de $f^{-1}(x)$.`,
  R`$3+\sqrt{x+4}$`,
  [R`$3-\sqrt{x+4}$`, R`$3+\sqrt{x-4}$`, R`$\sqrt{x+4}-3$`, R`$3+\sqrt{x+5}$`],
  R`Complete o quadrado: $f(x)=(x-3)^{2}-4$. Trocando os papéis, resolva $y=(x-3)^{2}-4$ para $x$: $(x-3)^{2}=y+4$, logo $x-3=\pm\sqrt{y+4}$. A restrição $x\geq3$ obriga $x-3\geq0$, então fica o sinal POSITIVO: $x=3+\sqrt{y+4}$. Renomeando a variável, $f^{-1}(x)=3+\sqrt{x+4}$, cujo domínio $\left[-4,+\infty\right)$ é a imagem de $f$.`,
  {
    ref: (y) => bissecao((x) => x * x - 6 * x + 5 - y, 3, 200),
    cand: (x) => 3 + Math.sqrt(x + 4),
    distCand: [(x) => 3 - Math.sqrt(x + 4), (x) => 3 + Math.sqrt(x - 4), (x) => Math.sqrt(x + 4) - 3, (x) => 3 + Math.sqrt(x + 5)],
    amostras: [-4, -3, -2, 0, 3, 5, 12, 21, 32, 45, 60, 96],
    tol: 1e-6,
  });

q(INV, "Inversa de exponencial transladada", "medio",
  R`Seja $f(x)=3+2^{x-1}$. Determine $f^{-1}(11)$.`,
  R`$4$`,
  [R`$3$`, R`$5$`, R`$6$`, R`$2$`],
  R`Resolva $3+2^{x-1}=11$, isto é $2^{x-1}=8=2^{3}$. Pela injetividade da exponencial, $x-1=3$ e $x=4$. Repare que a translação vertical $+3$ não some: ela precisa ser desfeita ANTES de aplicar o logaritmo.`,
  4,
  () => bissecao((x) => 3 + Math.pow(2, x - 1) - 11, -10, 20));

q(INV, "Inversa de função algébrica limitada", "dificil",
  R`Seja $f(x)=\dfrac{x}{\sqrt{1+x^{2}}}$. Determine $f^{-1}\left(\dfrac{3}{5}\right)$.`,
  R`$\dfrac{3}{4}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{3}{5}$`, R`$\dfrac{5}{4}$`, R`$\dfrac{4}{5}$`],
  R`De $\dfrac{x}{\sqrt{1+x^{2}}}=\dfrac{3}{5}$, com $x$ necessariamente positivo (o sinal de $f$ é o de $x$), eleve ao quadrado: $\dfrac{x^{2}}{1+x^{2}}=\dfrac{9}{25}$, isto é $25x^{2}=9+9x^{2}$, ou $16x^{2}=9$. Logo $x=\tfrac{3}{4}$. (A imagem de $f$ é $\left(-1,1\right)$, então $\tfrac{3}{5}$ de fato é atingido.)`,
  0.75,
  () => inversaNum((x) => x / Math.sqrt(1 + x * x), -20, 20, 0.6));

q(INV, "Cosseno da soma de dois arcos inversos", "dificil",
  R`Calcule $\cos\left(\operatorname{arcsen}\dfrac{3}{5}+\operatorname{arccos}\dfrac{5}{13}\right)$.`,
  R`$-\dfrac{16}{65}$`,
  [R`$\dfrac{16}{65}$`, R`$-\dfrac{33}{65}$`, R`$\dfrac{56}{65}$`, R`$-\dfrac{63}{65}$`],
  R`Chame $\alpha=\operatorname{arcsen}\tfrac{3}{5}$ e $\beta=\operatorname{arccos}\tfrac{5}{13}$; ambos estão no primeiro quadrante, onde todas as razões são positivas. Do triângulo $3$-$4$-$5$: $\cos\alpha=\tfrac{4}{5}$. Do triângulo $5$-$12$-$13$: $\operatorname{sen}\beta=\tfrac{12}{13}$. Então $\cos(\alpha+\beta)=\cos\alpha\cos\beta-\operatorname{sen}\alpha\operatorname{sen}\beta=\tfrac{4}{5}\cdot\tfrac{5}{13}-\tfrac{3}{5}\cdot\tfrac{12}{13}=\tfrac{20-36}{65}=-\tfrac{16}{65}$.`,
  -16 / 65,
  () => Math.cos(Math.asin(3 / 5) + Math.acos(5 / 13)));

q(INV, "Identidade hiperbólica fundamental", "medio",
  R`Sabendo que $\cosh x-\operatorname{senh}x=\dfrac{1}{3}$, determine $\cosh x+\operatorname{senh}x$.`,
  R`$3$`,
  [R`$\dfrac{1}{3}$`, R`$9$`, R`$\dfrac{1}{9}$`, R`$1$`],
  R`Não é preciso achar $x$. A identidade fundamental das hiperbólicas, $\cosh^{2}x-\operatorname{senh}^{2}x=1$, fatora como $\left(\cosh x-\operatorname{senh}x\right)\left(\cosh x+\operatorname{senh}x\right)=1$: os dois fatores são inversos um do outro. Logo o valor pedido é $\dfrac{1}{1/3}=3$. (Coerente com as definições: $\cosh x-\operatorname{senh}x=e^{-x}$ e $\cosh x+\operatorname{senh}x=e^{x}$, de modo que $e^{-x}=\tfrac{1}{3}$ dá $e^{x}=3$.)`,
  3,
  () => {
    const x = bissecao((t) => Math.cosh(t) - Math.sinh(t) - 1 / 3, -10, 10);
    return Math.cosh(x) + Math.sinh(x);
  },
  { tol: 1e-6 });

q(INV, "Inversa do cosseno hiperbólico", "dificil",
  R`Determine o único $x>0$ tal que $\cosh x=2$, onde $\cosh x=\dfrac{e^{x}+e^{-x}}{2}$.`,
  R`$\ln\left(2+\sqrt{3}\right)$`,
  [
    R`$\ln\left(2-\sqrt{3}\right)$`,
    R`$\ln\left(2+\sqrt{5}\right)$`,
    R`$\ln\left(4+\sqrt{3}\right)$`,
    R`$\dfrac{\ln\left(2+\sqrt{3}\right)}{2}$`,
  ],
  R`Com $t=e^{x}>0$, a equação $\dfrac{t+t^{-1}}{2}=2$ vira $t^{2}-4t+1=0$, cujas raízes são $t=2\pm\sqrt{3}$ — as duas positivas, e uma o inverso da outra. Como $\cosh$ é par, elas correspondem a $x$ e $-x$; o valor positivo pedido vem de $t=2+\sqrt{3}>1$, isto é $x=\ln\left(2+\sqrt{3}\right)$.`,
  Math.log(2 + Math.sqrt(3)),
  () => bissecao((x) => Math.cosh(x) - 2, 0.1, 5));

q(INV, "Inversa sem fórmula fechada de polinômio monótono", "dificil",
  R`Seja $f(x)=x^{5}+x^{3}+x$, que é estritamente crescente em $\mathbb{R}$. Determine $f^{-1}(42)$.`,
  R`$2$`,
  [R`$3$`, R`$4$`, R`$1$`, R`$6$`],
  R`Não há fórmula para a inversa de um polinômio de grau $5$, mas ela existe: a soma $x^{5}+x^{3}+x$ é crescente (cada parcela é), logo $f$ é injetora e sobrejetora sobre $\mathbb{R}$. Basta então achar $x$ com $f(x)=42$, e o teste dos inteiros pequenos resolve: $f(2)=32+8+2=42$. Portanto $f^{-1}(42)=2$.`,
  2,
  () => inversaNum((x) => x ** 5 + x ** 3 + x, -10, 10, 42));

q(INV, "Homográfica que é a própria inversa", "dificil",
  R`Determine o valor de $a$ para que $f(x)=\dfrac{ax+3}{x-2}$ satisfaça $f\left(f(x)\right)=x$ para todo $x$ do seu domínio.`,
  R`$2$`,
  [R`$-2$`, R`$3$`, R`$-3$`, R`$1$`],
  R`Uma função que é a própria inversa cumpre $f\circ f=\mathrm{id}$. Componha: $f\left(f(x)\right)=\dfrac{a\cdot\frac{ax+3}{x-2}+3}{\frac{ax+3}{x-2}-2}=\dfrac{\left(a^{2}+3\right)x+3a-6}{(a-2)x+7}$. Para isso ser $x$ em todo o domínio, os polinômios $\left(a^{2}+3\right)x+3a-6$ e $x\left[(a-2)x+7\right]$ têm de coincidir: o termo em $x^{2}$ exige $a=2$, e com esse valor sobra $\dfrac{7x}{7}=x$, como queríamos. (Em geral, $\dfrac{ax+b}{cx+d}$ é involutiva exatamente quando $a+d=0$.)`,
  2,
  () => {
    const fa = (a, x) => (a * x + 3) / (x - 2);
    return extremo((a) => Math.abs(fa(a, fa(a, 5)) - 5) + Math.abs(fa(a, fa(a, -3)) + 3), 0, 5, "min").x;
  },
  { tol: 1e-4 });

q(INV, "Ponto do gráfico de uma inversa transladada", "medio",
  R`Sabe-se que $(3,7)$ pertence ao gráfico da função invertível $f$. Determine a soma das coordenadas do ponto que necessariamente pertence ao gráfico de $g(x)=f^{-1}(x-2)$.`,
  R`$12$`,
  [R`$10$`, R`$8$`, R`$14$`, R`$5$`],
  R`De $f(3)=7$ segue $f^{-1}(7)=3$ — no gráfico da inversa as coordenadas trocam de papel. Para usar essa informação em $g$, é preciso que o argumento de $f^{-1}$ seja $7$: $x-2=7$, isto é $x=9$. Aí $g(9)=f^{-1}(7)=3$, e o ponto é $(9,3)$, de soma $12$. O deslocamento $-2$ dentro da função empurra o gráfico para a DIREITA, não para a esquerda.`,
  12,
  () => {
    const f = (x) => 2 * x + 1; // f(3) = 7
    const finv = (y) => inversaNum(f, -100, 100, y);
    const g = (x) => finv(x - 2);
    const x = inversaNum(g, -100, 100, 3);
    return x + g(x);
  },
  { tol: 1e-6 });

q(INV, "Inversa de soma de identidade com exponencial", "dificil",
  R`Seja $f(x)=x+e^{x}$, estritamente crescente em $\mathbb{R}$. Determine $f^{-1}(1+e)$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$e$`, R`$e-1$`],
  R`A inversa de $x+e^{x}$ não se escreve com funções elementares, mas o valor pedido sim: procure $x$ com $x+e^{x}=1+e$. A forma do lado direito entrega a resposta — $x=1$ dá $1+e^{1}$ exatamente. Como $f$ é crescente (soma de duas funções crescentes), essa pré-imagem é única, e $f^{-1}(1+e)=1$.`,
  1,
  () => inversaNum((x) => x + Math.exp(x), -20, 20, 1 + Math.E));

q(INV, "Compostas de uma função com sua inversa", "medio",
  R`Seja $f(x)=\dfrac{x+1}{x-3}$, invertível em seu domínio. Calcule $\left(f^{-1}\circ f\right)(5)+\left(f\circ f^{-1}\right)(2)$.`,
  R`$7$`,
  [R`$5$`, R`$2$`, R`$10$`, R`$3$`],
  R`Não é preciso calcular $f^{-1}$. Por definição de inversa, $f^{-1}\left(f(x)\right)=x$ para todo $x$ do domínio de $f$, e $f\left(f^{-1}(y)\right)=y$ para todo $y$ da imagem. Como $5$ está no domínio ($5\neq3$) e $2$ está na imagem (a imagem é $\mathbb{R}\setminus\{1\}$), as duas compostas devolvem os próprios argumentos: $5+2=7$.`,
  7,
  () => {
    const f = (x) => (x + 1) / (x - 3);
    const finv = (y) => bissecao((x) => f(x) - y, 3.0000001, 1e7);
    return finv(f(5)) + f(finv(2));
  },
  { tol: 1e-6 });

// Os valores foram escolhidos para a resposta cair na MESMA forma dos
// distratores (fração de pi): com a soma dando pi redondo, a correta era a
// única sem fração e se entregava pela aparência.
q(INV, "Soma de arco-seno com arco-cosseno", "medio",
  R`Calcule $\operatorname{arcsen}\dfrac{1}{2}+\operatorname{arccos}\left(-\dfrac{1}{2}\right)$.`,
  R`$\dfrac{5\pi}{6}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{2\pi}{3}$`, R`$\dfrac{7\pi}{6}$`, R`$\dfrac{\pi}{3}$`],
  R`Cada arco inverso devolve um valor no seu intervalo principal. Para $\operatorname{arcsen}$, o intervalo é $\left[-\tfrac{\pi}{2},\tfrac{\pi}{2}\right]$, e o arco com seno $\tfrac{1}{2}$ ali é $\tfrac{\pi}{6}$. Para $\operatorname{arccos}$, o intervalo é $\left[0,\pi\right]$, e o arco com cosseno $-\tfrac{1}{2}$ é $\tfrac{2\pi}{3}$ (segundo quadrante — não $-\tfrac{\pi}{3}$, que tem o mesmo cosseno mas está fora do intervalo principal). A soma é $\tfrac{\pi}{6}+\tfrac{2\pi}{3}=\tfrac{5\pi}{6}$.`,
  (5 * Math.PI) / 6,
  () => Math.asin(0.5) + Math.acos(-0.5),
  { tol: 1e-9 });

q(INV, "Tangente de um arco-cosseno", "medio",
  R`Calcule $\operatorname{tg}\left(\operatorname{arccos}\dfrac{2}{3}\right)$.`,
  R`$\dfrac{\sqrt{5}}{2}$`,
  [R`$\dfrac{\sqrt{5}}{3}$`, R`$\dfrac{2}{\sqrt{5}}$`, R`$\dfrac{3}{\sqrt{5}}$`, R`$\dfrac{\sqrt{3}}{2}$`],
  R`Seja $\theta=\operatorname{arccos}\tfrac{2}{3}$, que está em $\left[0,\pi\right]$ e, por ter cosseno positivo, no primeiro quadrante. De $\operatorname{sen}^{2}\theta=1-\tfrac{4}{9}=\tfrac{5}{9}$ vem $\operatorname{sen}\theta=\tfrac{\sqrt{5}}{3}$ (positivo). Logo $\operatorname{tg}\theta=\dfrac{\sqrt{5}/3}{2/3}=\dfrac{\sqrt{5}}{2}$.`,
  Math.sqrt(5) / 2,
  () => Math.tan(Math.acos(2 / 3)));

q(INV, "Função dada por uma composição e inversa pedida", "dificil",
  R`Uma função $f$ satisfaz $f(2x+1)=3x-4$ para todo $x$ real. Determine $f^{-1}(5)$.`,
  R`$7$`,
  [R`$5$`, R`$3$`, R`$9$`, R`$11$`],
  R`Primeiro obtenha $f$ explicitamente: ponha $u=2x+1$, de onde $x=\dfrac{u-1}{2}$, e substitua: $f(u)=3\cdot\dfrac{u-1}{2}-4=\dfrac{3u-11}{2}$. Agora $f^{-1}(5)$ é o $u$ com $f(u)=5$: $\dfrac{3u-11}{2}=5$, isto é $3u=21$ e $u=7$. Atalho equivalente: $f(2x+1)=5$ exige $3x-4=5$, ou $x=3$, e o argumento correspondente é $2\cdot3+1=7$.`,
  7,
  () => {
    const f = (u) => 3 * ((u - 1) / 2) - 4;
    for (const x of [-2, 0, 1.5, 4]) if (Math.abs(f(2 * x + 1) - (3 * x - 4)) > 1e-9) return NaN;
    return inversaNum(f, -100, 100, 5);
  });

q(INV, "Inversa conhecida e função direta pedida", "dificil",
  R`Sabe-se que $f^{-1}(x)=\dfrac{2x+1}{x-3}$. Determine $f(4)$.`,
  R`$\dfrac{13}{2}$`,
  [R`$\dfrac{9}{2}$`, R`$\dfrac{13}{4}$`, R`$\dfrac{11}{2}$`, R`$\dfrac{7}{2}$`],
  R`Calcular $f(4)$ é achar o valor $y$ tal que $f^{-1}(y)=4$ — de novo a troca de papéis. Então $\dfrac{2y+1}{y-3}=4$, isto é $2y+1=4y-12$, ou $2y=13$ e $y=\tfrac{13}{2}$. O erro típico é substituir $x=4$ na expressão dada, o que fornece $f^{-1}(4)=9$, e não $f(4)$.`,
  6.5,
  () => bissecao((y) => (2 * y + 1) / (y - 3) - 4, 3.5, 100));

q(INV, "Maior intervalo simétrico de invertibilidade", "dificil",
  R`A função $f(x)=x^{3}-3x$ não é injetora em $\mathbb{R}$. Determine o maior $c>0$ para o qual $f$ é invertível em $\left[-c,c\right]$.`,
  R`$1$`,
  [R`$2$`, R`$3$`, R`$\dfrac{1}{2}$`, R`$\dfrac{3}{2}$`],
  R`A função sobe, desce e volta a subir: ela troca de comportamento nos pontos em que $x^{3}-3x$ tem máximo e mínimo locais, que são $x=-1$ e $x=1$ (ali $f$ vale $2$ e $-2$). Num intervalo $\left[-c,c\right]$ com $c\leq1$ a função é monótona decrescente, logo injetora; assim que $c$ passa de $1$, o trecho crescente à direita repete valores já assumidos — por exemplo $f(2)=2=f(-1)$. O maior $c$ é $1$.`,
  1,
  () => extremo((x) => x ** 3 - 3 * x, 0.05, 3, "min").x,
  { tol: 1e-5 });

q(INV, "Parâmetro a partir de um ponto da inversa", "medio",
  R`O gráfico de $f^{-1}$ passa pelo ponto $(5,2)$, e sabe-se que $f(x)=ax^{2}+3$ com $x\geq0$. Determine $a$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{4}$`, R`$\dfrac{3}{2}$`, R`$\dfrac{2}{5}$`, R`$\dfrac{5}{4}$`],
  R`Se $(5,2)$ está no gráfico de $f^{-1}$, então $f^{-1}(5)=2$ e, invertendo, $(2,5)$ está no gráfico de $f$, isto é $f(2)=5$. Substituindo: $4a+3=5$, logo $a=\tfrac{1}{2}$. Quem usa $f(5)=2$ troca os papéis e chega a $25a+3=2$, um valor negativo que nem seria compatível com a restrição dada.`,
  0.5,
  () => bissecao((a) => 4 * a + 3 - 5, -5, 5));

// ===========================================================================
// CLASSES DE FUNÇÕES E SEUS GRÁFICOS
// ===========================================================================
q(CLS, "Duas simetrias que geram periodicidade", "dificil",
  R`Uma função $f:\mathbb{R}\to\mathbb{R}$ satisfaz $f(2+x)=f(2-x)$ e $f(7+x)=f(7-x)$ para todo $x$ real, e $f(0)=3$. Determine $f(2020)$.`,
  R`$3$`,
  [R`$0$`, R`$7$`, R`$-3$`, R`$6$`],
  R`Cada identidade diz que o gráfico é simétrico em relação a uma reta vertical: $x=2$ e $x=7$. Duas simetrias de eixos verticais distintos compõem uma TRANSLAÇÃO de amplitude igual ao dobro da distância entre os eixos: $f$ é periódica de período $2(7-2)=10$. Formalmente, $f(x)=f(4-x)=f(4-x+10)$, isto é $f(x+10)=f(x)$. Como $2020=10\cdot202$, tem-se $f(2020)=f(0)=3$.`,
  3,
  () => {
    // Função concreta com as duas simetrias pedidas e f(0) = 3.
    const A = 3 / Math.cos((2 * Math.PI * 2) / 10);
    const f = (x) => A * Math.cos((2 * Math.PI * (x - 2)) / 10);
    for (const x of [0.7, 3.1, 5.9]) {
      if (Math.abs(f(2 + x) - f(2 - x)) > 1e-9) return NaN;
      if (Math.abs(f(7 + x) - f(7 - x)) > 1e-9) return NaN;
    }
    return f(2020);
  },
  { tol: 1e-6 });

qConjunto(CLS, "Imagem de função racional ímpar", "medio",
  R`Determine a imagem da função $f(x)=\dfrac{x}{x^{2}+1}$.`,
  R`$\left[-\dfrac{1}{2},\dfrac{1}{2}\right]$`,
  [
    R`$\left(-\dfrac{1}{2},\dfrac{1}{2}\right)$`,
    R`$\left[-1,1\right]$`,
    R`$\left[0,\dfrac{1}{2}\right]$`,
    R`$\left[-\dfrac{1}{4},\dfrac{1}{4}\right]$`,
  ],
  R`Procure para quais $y$ a equação $y=\dfrac{x}{x^{2}+1}$ tem solução. Ela equivale a $yx^{2}-x+y=0$. Se $y=0$, vale $x=0$. Se $y\neq0$, é uma quadrática em $x$ e precisa de discriminante não negativo: $1-4y^{2}\geq0$, isto é $-\tfrac{1}{2}\leq y\leq\tfrac{1}{2}$. Os extremos são atingidos em $x=1$ e $x=-1$, então a imagem é o intervalo FECHADO $\left[-\tfrac{1}{2},\tfrac{1}{2}\right]$.`,
  {
    alvo: (y) => naImagem((x) => x / (x * x + 1), y, [[0, 1], [1, 60], [-1, 0], [-60, -1]]),
    cand: (y) => ge(y, -0.5) && le(y, 0.5),
    distCand: [
      (y) => gt(y, -0.5) && lt(y, 0.5),
      (y) => ge(y, -1) && le(y, 1),
      (y) => ge(y, 0) && le(y, 0.5),
      (y) => ge(y, -0.25) && le(y, 0.25),
    ],
    amostras: grade(-1.2, 1.2, 481, [-0.5, 0.5, -0.25, 0.25, 0, -1, 1]),
  });

q(CLS, "Período de soma de quartas potências trigonométricas", "dificil",
  R`Determine o período fundamental de $f(x)=\operatorname{sen}^{4}x+\cos^{4}x$.`,
  R`$\dfrac{\pi}{2}$`,
  [R`$\pi$`, R`$2\pi$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{3\pi}{2}$`],
  R`Reescreva usando a identidade fundamental: $\operatorname{sen}^{4}x+\cos^{4}x=\left(\operatorname{sen}^{2}x+\cos^{2}x\right)^{2}-2\operatorname{sen}^{2}x\cos^{2}x=1-\tfrac{1}{2}\operatorname{sen}^{2}(2x)$. Usando ainda $\operatorname{sen}^{2}(2x)=\dfrac{1-\cos(4x)}{2}$, obtém-se $f(x)=\dfrac{3+\cos(4x)}{4}$. O período de $\cos(4x)$ é $\dfrac{2\pi}{4}=\dfrac{\pi}{2}$ — bem menor que o $2\pi$ das funções originais, porque as quartas potências apagam as trocas de sinal.`,
  Math.PI / 2,
  () =>
    periodo(
      (x) => Math.sin(x) ** 4 + Math.cos(x) ** 4,
      [Math.PI / 8, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, Math.PI, (3 * Math.PI) / 2, TAU]
    ),
  { tol: 1e-6 });

q(CLS, "Valor máximo de um quociente trigonométrico", "dificil",
  R`Determine o valor máximo de $f(x)=\dfrac{\operatorname{sen}x}{2+\cos x}$.`,
  R`$\dfrac{\sqrt{3}}{3}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{\sqrt{2}}{2}$`, R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{1}{3}$`],
  R`Chame $y=f(x)$ e transforme em uma condição de existência: $y\left(2+\cos x\right)=\operatorname{sen}x$, isto é $\operatorname{sen}x-y\cos x=2y$. O lado esquerdo é da forma $a\operatorname{sen}x+b\cos x$, cujo valor absoluto nunca passa de $\sqrt{1+y^{2}}$. Logo é preciso $\left|2y\right|\leq\sqrt{1+y^{2}}$, ou $4y^{2}\leq1+y^{2}$, ou ainda $y^{2}\leq\tfrac{1}{3}$. O maior valor possível é $y=\tfrac{1}{\sqrt{3}}=\tfrac{\sqrt{3}}{3}$, de fato atingido.`,
  Math.sqrt(3) / 3,
  () => extremo((x) => Math.sin(x) / (2 + Math.cos(x)), 0, TAU, "max").y,
  { tol: 1e-6 });

q(CLS, "Centro de simetria de uma homográfica", "medio",
  R`O gráfico de $f(x)=\dfrac{2x-1}{x+3}$ é uma hipérbole com centro de simetria no encontro de suas assíntotas. Determine a soma das coordenadas desse centro.`,
  R`$-1$`,
  [R`$1$`, R`$5$`, R`$-5$`, R`$-6$`],
  R`A assíntota vertical está onde o denominador zera: $x=-3$. A horizontal é o limite para $\left|x\right|$ grande, que é a razão dos coeficientes de maior grau: $y=2$. Outra forma de ver: $\dfrac{2x-1}{x+3}=2-\dfrac{7}{x+3}$, o que exibe o gráfico como a hipérbole $y=-\dfrac{7}{x}$ transladada $3$ para a esquerda e $2$ para cima. O centro é $(-3,2)$ e a soma pedida é $-1$.`,
  -1,
  () => {
    const f = (x) => (2 * x - 1) / (x + 3);
    return -3 + f(1e9);
  },
  { tol: 1e-6 });

q(CLS, "Parâmetro que produz exatamente três raízes", "dificil",
  R`Para quantos valores reais de $k$ a equação $\left|x^{2}-4x+3\right|=k$ tem exatamente três soluções reais?`,
  R`$1$`,
  [R`$2$`, R`$3$`, R`$0$`, R`$4$`],
  R`O gráfico de $\left|x^{2}-4x+3\right|$ é a parábola $x^{2}-4x+3$ com a parte negativa refletida para cima, o que cria um "morro" entre as raízes $1$ e $3$, de altura igual a $\left|f(2)\right|=1$. A reta horizontal $y=k$ corta esse desenho em: $2$ pontos se $k=0$; $4$ pontos se $0<k<1$; $3$ pontos se $k=1$ (ali a reta passa exatamente pelo topo do morro, que conta uma vez, mais os dois ramos externos); e $2$ pontos se $k>1$. Só o valor $k=1$ dá três soluções.`,
  1,
  () => {
    let n = 0;
    for (let i = 0; i <= 60; i++) {
      const k = i * 0.05;
      if (raizesComTangencia((x) => Math.abs(x * x - 4 * x + 3) - k, -2, 6, 20000, 1e-2).length === 3) n++;
    }
    return n;
  });

q(CLS, "Menor cota superior de uma função limitada", "medio",
  R`Determine o menor valor de $M$ para o qual $\left|\dfrac{3x}{x^{2}+4}\right|\leq M$ para todo $x$ real.`,
  R`$\dfrac{3}{4}$`,
  [R`$\dfrac{3}{2}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{3}{8}$`, R`$\dfrac{2}{3}$`],
  R`Como a função é ímpar, basta achar o máximo para $x>0$. Ali vale $\dfrac{3x}{x^{2}+4}=\dfrac{3}{x+\frac{4}{x}}$, e pela desigualdade entre as médias $x+\dfrac{4}{x}\geq2\sqrt{4}=4$, com igualdade em $x=2$. O denominador é mínimo justamente onde o quociente é máximo, que vale $\tfrac{3}{4}$ — atingido, portanto é o MENOR $M$ que serve.`,
  0.75,
  () => extremo((x) => Math.abs((3 * x) / (x * x + 4)), -60, 60, "max").y,
  { tol: 1e-6 });

q(CLS, "Função ímpar e periódica", "dificil",
  R`Uma função ímpar $f:\mathbb{R}\to\mathbb{R}$ é periódica de período $6$, com $f(1)=4$ e $f(2)=-1$. Determine $f(11)+f(16)$.`,
  R`$-3$`,
  [R`$3$`, R`$-5$`, R`$5$`, R`$-4$`],
  R`Use primeiro a periodicidade para trazer os argumentos para perto de zero, e depois a imparidade. Como $11-12=-1$, vale $f(11)=f(-1)=-f(1)=-4$. Como $16-12=4$ e $4-6=-2$, vale $f(16)=f(-2)=-f(2)=1$. A soma é $-4+1=-3$.`,
  -3,
  () => {
    const tabela = { 1: 4, 2: -1 };
    const f = (x) => {
      const r = ((((x + 3) % 6) + 6) % 6) - 3; // reduz ao intervalo [-3, 3)
      return r >= 0 ? tabela[r] : -tabela[-r];
    };
    return f(11) + f(16);
  });

q(CLS, "Parábola determinada por vértice e um ponto", "medio",
  R`O gráfico de $y=f(x)$ é uma parábola de vértice $(1,-4)$ que passa pelo ponto $(3,0)$. Determine $f(5)$.`,
  R`$12$`,
  [R`$8$`, R`$16$`, R`$20$`, R`$10$`],
  R`Use a forma canônica $f(x)=a(x-1)^{2}-4$, que já embute o vértice. De $f(3)=0$ vem $4a-4=0$, logo $a=1$ e $f(x)=(x-1)^{2}-4$. Então $f(5)=16-4=12$. Um atalho: $5$ está a $4$ unidades do eixo de simetria, e $3$ está a $2$; como a parábola cresce com o quadrado da distância ao vértice, a altura acima do vértice quadruplica de $4$ para $16$.`,
  12,
  () => {
    const a = bissecao((t) => 4 * t - 4, -10, 10);
    return a * Math.pow(5 - 1, 2) - 4;
  });

q(CLS, "Mínimo de uma soma de módulos", "dificil",
  R`Determine o valor mínimo de $f(x)=\left|x-1\right|+\left|x-4\right|+\left|x-6\right|$.`,
  R`$5$`,
  [R`$4$`, R`$6$`, R`$7$`, R`$3$`],
  R`Cada parcela é a distância de $x$ a um dos pontos $1$, $4$ e $6$, então $f(x)$ é a soma das distâncias de $x$ a esses três pontos. O gráfico é poligonal, com quebras exatamente neles, e o mínimo de uma soma de distâncias a um número ÍMPAR de pontos ocorre na MEDIANA — aqui, $x=4$. Ali $f(4)=3+0+2=5$. Um argumento alternativo: $\left|x-1\right|+\left|x-6\right|\geq5$ sempre (com igualdade entre $1$ e $6$) e $\left|x-4\right|\geq0$, de modo que $f(x)\geq5$, valor atingido em $x=4$.`,
  5,
  () => extremo((x) => Math.abs(x - 1) + Math.abs(x - 4) + Math.abs(x - 6), -20, 30, "min").y,
  { tol: 1e-6 });

q(CLS, "Amplitude, período e deslocamento de uma cossenoide", "medio",
  R`A função $f(x)=a\cos(bx)+c$, com $a>0$ e $b>0$, tem valor máximo $7$, valor mínimo $-1$ e período $\dfrac{2\pi}{3}$. Determine $a+b+c$.`,
  R`$10$`,
  [R`$8$`, R`$12$`, R`$9$`, R`$11$`],
  R`O cosseno varia entre $-1$ e $1$, então $f$ varia entre $c-a$ e $c+a$. Da diferença, $2a=7-(-1)=8$, logo $a=4$; da soma, $2c=7+(-1)=6$, logo $c=3$. O período de $\cos(bx)$ é $\dfrac{2\pi}{b}$, e igualando a $\dfrac{2\pi}{3}$ vem $b=3$. Portanto $a+b+c=4+3+3=10$.`,
  10,
  () => {
    const a = (7 - -1) / 2;
    const c = (7 + -1) / 2;
    const b = TAU / (TAU / 3);
    const f = (x) => a * Math.cos(b * x) + c;
    const max = extremo(f, 0, TAU, "max").y;
    const min = extremo(f, 0, TAU, "min").y;
    const p = periodo(f, [Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, Math.PI, TAU]);
    if (Math.abs(max - 7) > 1e-6 || Math.abs(min + 1) > 1e-6 || Math.abs(p - TAU / 3) > 1e-6) return NaN;
    return a + b + c;
  });

q(CLS, "Eixo de simetria após translação do gráfico", "dificil",
  R`O gráfico de $g(x)=f(x-3)+2$ é simétrico em relação à reta $x=5$. Sabendo que $f$ é uma função quadrática com $f(0)=1$ e $f(3)=4$, determine $f(-2)$.`,
  R`$-11$`,
  [R`$-7$`, R`$11$`, R`$-16$`, R`$5$`],
  R`A translação horizontal de $3$ unidades leva o eixo de simetria de $f$ para $3$ unidades à direita, e a translação vertical não mexe nele. Se o eixo de $g$ é $x=5$, o de $f$ é $x=2$ — isto é, o vértice de $f$ tem abscissa $2$ e vale $f(x)=a(x-2)^{2}+k$. As duas condições dão $4a+k=1$ e $a+k=4$; subtraindo, $3a=-3$, logo $a=-1$ e $k=5$. Então $f(-2)=-(-4)^{2}+5=-11$.`,
  -11,
  () => {
    const a = bissecao((t) => 4 * t + (4 - t) - 1, -10, 10);
    const k = 4 - a;
    if (Math.abs(a * 4 + k - 1) > 1e-9 || Math.abs(a + k - 4) > 1e-9) return NaN;
    return a * Math.pow(-2 - 2, 2) + k;
  });

qConjunto(CLS, "Onde o gráfico coincide com o de seu módulo", "medio",
  R`Seja $f(x)=x^{2}-3x-4$. Determine o conjunto dos $x$ reais em que $\left|f(x)\right|=f(x)$.`,
  R`$\left(-\infty,-1\right]\cup\left[4,+\infty\right)$`,
  [
    R`$\left[-1,4\right]$`,
    R`$\left(-\infty,-1\right)\cup\left(4,+\infty\right)$`,
    R`$\left(-\infty,-4\right]\cup\left[1,+\infty\right)$`,
    R`$\mathbb{R}$`,
  ],
  R`A igualdade $\left|u\right|=u$ vale exatamente quando $u\geq0$ — nos pontos em que $f$ é negativa, o módulo reflete o gráfico para cima e os dois deixam de coincidir. Basta então resolver $x^{2}-3x-4\geq0$, isto é $(x-4)(x+1)\geq0$: uma parábola com concavidade para cima é não negativa FORA das raízes, o que dá $x\leq-1$ ou $x\geq4$. Os próprios zeros entram, pois ali $\left|0\right|=0$.`,
  {
    alvo: (x) => ge(x * x - 3 * x - 4, 0),
    cand: (x) => le(x, -1) || ge(x, 4),
    distCand: [
      (x) => ge(x, -1) && le(x, 4),
      (x) => lt(x, -1) || gt(x, 4),
      (x) => le(x, -4) || ge(x, 1),
      () => true,
    ],
    amostras: grade(-8, 9, 901, [-1, 4, -4, 1]),
  });

q(CLS, "Parte ímpar de um polinômio", "dificil",
  R`A função $f(x)=x^{5}+ax^{3}+bx+7$ satisfaz $f(-3)=2$. Determine $f(3)$.`,
  R`$12$`,
  [R`$-12$`, R`$2$`, R`$5$`, R`$16$`],
  R`Separe a parte ímpar: escreva $f(x)=g(x)+7$ com $g(x)=x^{5}+ax^{3}+bx$, que só tem potências ímpares e portanto satisfaz $g(-x)=-g(x)$. Então $f(3)+f(-3)=g(3)+g(-3)+14=14$, qualquer que sejam $a$ e $b$. Com $f(-3)=2$, resulta $f(3)=14-2=12$. Note que os valores de $a$ e $b$ não são necessários — e nem ficam determinados.`,
  12,
  () => {
    const a = 0;
    const b = bissecao((t) => -243 - 27 * a - 3 * t + 7 - 2, -500, 500);
    return 243 + 27 * a + 3 * b + 7;
  },
  { tol: 1e-6 });

q(CLS, "Interseções entre módulo e cosseno", "dificil",
  R`Determine o número de soluções reais da equação $\left|x\right|=\cos x$.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$0$`, R`$4$`],
  R`Os dois gráficos são simétricos em relação ao eixo $y$ (ambas as funções são pares), então basta contar as soluções com $x\geq0$ e dobrar. Para $x\geq0$, $\left|x\right|=x$ cresce de $0$ a $+\infty$ enquanto $\cos x$ decresce de $1$ a $-1$ no primeiro trecho: como $0<1$ em $x=0$ e $1>\cos 1\approx0{,}54$ em $x=1$, há exatamente um cruzamento, e depois de $x=1$ a reta já passou de $1$, teto do cosseno, então não há outros. Uma solução positiva e sua simétrica: duas ao todo.`,
  2,
  () => raizes((x) => Math.abs(x) - Math.cos(x), -3, 3).length);

finalizar("fcg_lote6.json", 20260917);
