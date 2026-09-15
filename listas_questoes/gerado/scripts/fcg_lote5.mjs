// Lote 5 de Fundamentos de Cálculo e Geometria — 38 questões de FUNÇÕES EM R.
//
// O tópico tinha 24 questões e é o primeiro da ementa (todo aluno passa por
// ele). Como é leva de reforço em tópico já povoado, a calibragem é a de
// 2026-09-11: zero `facil`, maioria `dificil`, e toda questão com pelo menos
// duas etapas encadeadas — o domínio antes da conta, o ramo que o módulo
// esconde, a raiz estranha que o radical cria, o filtro que a função por partes
// impõe.
//
// Blocos (formas de cobrança deliberadamente distintas entre si):
//   J. domínio, contradomínio e pré-imagem   K. inequações
//   L. módulo                                M. polinômios e fatoração
//   N. trigonométricas                       O. composição e função por partes
//   P. problemas aplicados
//
// Estilo Stewart (Pré-cálculo). Conferência acoplada: ver fcg_kit.mjs.
// Rode: node listas_questoes/gerado/scripts/fcg_lote5.mjs
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
  grade,
  ge,
  gt,
  le,
  lt,
  igual,
} from "./fcg_kit.mjs";

const T = "Funções em R";
const soma = (xs) => xs.reduce((s, x) => s + x, 0);
const TAU = 2 * Math.PI;

// ===========================================================================
// J. DOMÍNIO, CONTRADOMÍNIO E PRÉ-IMAGEM
// ===========================================================================
qConjunto(T, "Domínio de radical de quociente", "medio",
  R`Determine o domínio máximo de $f(x)=\sqrt{\dfrac{x+2}{x^{2}-9}}$.`,
  R`$\left(-3,-2\right]\cup\left(3,+\infty\right)$`,
  [
    R`$\left[-2,3\right)\cup\left(3,+\infty\right)$`,
    R`$\left(-3,-2\right)\cup\left(3,+\infty\right)$`,
    R`$\left(-\infty,-3\right)\cup\left[-2,3\right)$`,
    R`$\left[-3,-2\right]\cup\left[3,+\infty\right)$`,
  ],
  R`O radicando inteiro precisa ser $\geq0$, e o denominador não pode zerar, então $x\neq\pm3$. Monte o quadro de sinais com os pontos $-3$, $-2$ e $3$: em $\left(-\infty,-3\right)$ o numerador é negativo e o denominador positivo (quociente negativo); em $\left(-3,-2\right)$ ambos são negativos (quociente positivo); em $\left(-2,3\right)$ o numerador é positivo e o denominador negativo; em $\left(3,+\infty\right)$ ambos positivos. O ponto $x=-2$ entra por anular o radicando, mas $-3$ e $3$ saem por anularem o denominador.`,
  {
    alvo: (x) => !igual(x * x, 9) && ge((x + 2) / (x * x - 9), 0),
    cand: (x) => (gt(x, -3) && le(x, -2)) || gt(x, 3),
    distCand: [
      (x) => (ge(x, -2) && lt(x, 3)) || gt(x, 3),
      (x) => (gt(x, -3) && lt(x, -2)) || gt(x, 3),
      (x) => lt(x, -3) || (ge(x, -2) && lt(x, 3)),
      (x) => (ge(x, -3) && le(x, -2)) || ge(x, 3),
    ],
    amostras: grade(-7, 7, 901, [-3, -2, 3]),
  });

qConjunto(T, "Domínio de soma com radical e denominador", "medio",
  R`Determine o domínio máximo de $f(x)=\sqrt{4-x^{2}}+\dfrac{1}{\sqrt{x-1}}$.`,
  R`$\left(1,2\right]$`,
  [R`$\left[1,2\right]$`, R`$\left(1,2\right)$`, R`$\left[-2,2\right]$`, R`$\left[1,2\right)$`],
  R`A primeira parcela exige $4-x^{2}\geq0$, isto é $-2\leq x\leq2$. A segunda tem o radical no DENOMINADOR: além de $x-1\geq0$ é preciso $x-1\neq0$, ou seja $x>1$ com desigualdade estrita. A interseção é $1<x\leq2$: o extremo $2$ fica (a raiz de zero existe), o extremo $1$ sai (divisão por zero).`,
  {
    alvo: (x) => ge(4 - x * x, 0) && gt(x - 1, 0),
    cand: (x) => gt(x, 1) && le(x, 2),
    distCand: [
      (x) => ge(x, 1) && le(x, 2),
      (x) => gt(x, 1) && lt(x, 2),
      (x) => ge(x, -2) && le(x, 2),
      (x) => ge(x, 1) && lt(x, 2),
    ],
    amostras: grade(-4, 4, 901, [-2, 1, 2]),
  });

q(T, "Pré-imagem de um ponto", "medio",
  R`Seja $f:\mathbb{R}\to\mathbb{R}$ dada por $f(x)=x^{2}-4x$. Determine a soma dos elementos de $f^{-1}\left(\{5\}\right)$.`,
  R`$4$`,
  [R`$5$`, R`$-4$`, R`$1$`, R`$9$`],
  R`A pré-imagem de $\{5\}$ é o conjunto dos $x$ com $f(x)=5$, isto é $x^{2}-4x-5=0$. As raízes são $x=5$ e $x=-1$ (note que $f$ não é injetora, logo a pré-imagem tem dois elementos). A soma é $4$ — o mesmo valor que a relação de Girard dá de imediato, já que a soma das raízes é $-\tfrac{b}{a}=4$.`,
  4,
  () => soma(raizes((x) => x * x - 4 * x - 5, -10, 10)));

qConjunto(T, "Pré-imagem de um intervalo", "dificil",
  R`Seja $f(x)=x^{2}-6x+5$. Determine $f^{-1}\left(\left[-3,0\right]\right)$, isto é, o conjunto dos $x$ reais com $-3\leq f(x)\leq0$.`,
  R`$\left[1,2\right]\cup\left[4,5\right]$`,
  [
    R`$\left[1,5\right]$`,
    R`$\left(1,2\right)\cup\left(4,5\right)$`,
    R`$\left[2,4\right]$`,
    R`$\left[-3,0\right]$`,
  ],
  R`São duas inequações simultâneas. De $f(x)\leq0$: $x^{2}-6x+5\leq0$, isto é $1\leq x\leq5$. De $f(x)\geq-3$: $x^{2}-6x+8\geq0$, ou $(x-2)(x-4)\geq0$, isto é $x\leq2$ ou $x\geq4$ — aqui a parábola precisa estar FORA das raízes. Interseccionando, $\left[1,2\right]\cup\left[4,5\right]$; o miolo $\left(2,4\right)$ sai porque ali $f$ desce abaixo de $-3$ (o mínimo é $-4$, em $x=3$).`,
  {
    alvo: (x) => {
      const y = x * x - 6 * x + 5;
      return ge(y, -3) && le(y, 0);
    },
    cand: (x) => (ge(x, 1) && le(x, 2)) || (ge(x, 4) && le(x, 5)),
    distCand: [
      (x) => ge(x, 1) && le(x, 5),
      (x) => (gt(x, 1) && lt(x, 2)) || (gt(x, 4) && lt(x, 5)),
      (x) => ge(x, 2) && le(x, 4),
      (x) => ge(x, -3) && le(x, 0),
    ],
    amostras: grade(-5, 8, 901, [1, 2, 4, 5, 0, -3, 3]),
  });

qConjunto(T, "Domínio com radical e módulo no denominador", "dificil",
  R`Determine o domínio máximo de $f(x)=\dfrac{\sqrt{x+3}}{\left|x\right|-2}$.`,
  R`$\left[-3,-2\right)\cup\left(-2,2\right)\cup\left(2,+\infty\right)$`,
  [
    R`$\left[-3,+\infty\right)$`,
    R`$\left[-3,2\right)\cup\left(2,+\infty\right)$`,
    R`$\left(-3,-2\right)\cup\left(-2,2\right)\cup\left(2,+\infty\right)$`,
    R`$\left[-3,-2\right]\cup\left[2,+\infty\right)$`,
  ],
  R`O radical exige $x+3\geq0$, ou $x\geq-3$ — e o $-3$ ENTRA, pois só o denominador pode ser proibido. O denominador exige $\left|x\right|\neq2$, isto é $x\neq2$ e $x\neq-2$; ambos os valores estão dentro de $\left[-3,+\infty\right)$ e precisam ser retirados, o que quebra o intervalo em três pedaços.`,
  {
    alvo: (x) => ge(x + 3, 0) && !igual(Math.abs(x), 2),
    cand: (x) => (ge(x, -3) && lt(x, -2)) || (gt(x, -2) && lt(x, 2)) || gt(x, 2),
    distCand: [
      (x) => ge(x, -3),
      (x) => (ge(x, -3) && lt(x, 2)) || gt(x, 2),
      (x) => (gt(x, -3) && lt(x, -2)) || (gt(x, -2) && lt(x, 2)) || gt(x, 2),
      (x) => (ge(x, -3) && le(x, -2)) || ge(x, 2),
    ],
    amostras: grade(-6, 6, 901, [-3, -2, 2]),
  });

q(T, "Valor fora da imagem de uma homográfica", "medio",
  R`Seja $f(x)=\dfrac{3x-1}{x+2}$, definida para $x\neq-2$. Determine o único número real que NÃO pertence à imagem de $f$.`,
  R`$3$`,
  [R`$-2$`, R`$\dfrac{1}{3}$`, R`$2$`, R`$-3$`],
  R`Procure quais $y$ têm pré-imagem: de $y=\dfrac{3x-1}{x+2}$ vem $y(x+2)=3x-1$, isto é $x(y-3)=-1-2y$. Se $y\neq3$, existe $x=\dfrac{-1-2y}{y-3}$ e o valor é atingido. Se $y=3$, a equação vira $0\cdot x=-7$, impossível. Logo a imagem é $\mathbb{R}\setminus\{3\}$ — e $3$ é justamente o valor da assíntota horizontal, já que $\dfrac{3x-1}{x+2}\to3$ quando $\left|x\right|\to\infty$.`,
  3,
  () => (3 * 1e9 - 1) / (1e9 + 2),
  { tol: 1e-6 });

qConjunto(T, "Domínio com quociente dentro do radical", "dificil",
  R`Determine o domínio máximo de $f(x)=\sqrt{\dfrac{10+3x-x^{2}}{x-1}}$.`,
  R`$\left(-\infty,-2\right]\cup\left(1,5\right]$`,
  [
    R`$\left[-2,1\right)\cup\left[5,+\infty\right)$`,
    R`$\left(-\infty,-2\right)\cup\left(1,5\right)$`,
    R`$\left(1,5\right]$`,
    R`$\left(-\infty,-2\right]\cup\left[1,5\right]$`,
  ],
  R`Fatore o numerador: $10+3x-x^{2}=-(x-5)(x+2)$, que é positivo apenas em $\left(-2,5\right)$ e zera em $-2$ e $5$. O denominador troca de sinal em $1$. Quadro de sinais: em $\left(-\infty,-2\right)$ numerador e denominador são ambos negativos, quociente positivo; em $\left(-2,1\right)$ o numerador é positivo e o denominador negativo; em $\left(1,5\right)$ ambos positivos; em $\left(5,+\infty\right)$ o numerador volta a ser negativo. Os zeros do numerador entram, e $x=1$ sai.`,
  {
    alvo: (x) => !igual(x, 1) && ge((10 + 3 * x - x * x) / (x - 1), 0),
    cand: (x) => le(x, -2) || (gt(x, 1) && le(x, 5)),
    distCand: [
      (x) => (ge(x, -2) && lt(x, 1)) || ge(x, 5),
      (x) => lt(x, -2) || (gt(x, 1) && lt(x, 5)),
      (x) => gt(x, 1) && le(x, 5),
      (x) => le(x, -2) || (ge(x, 1) && le(x, 5)),
    ],
    amostras: grade(-8, 9, 901, [-2, 1, 5]),
  });

// ===========================================================================
// K. INEQUAÇÕES
// ===========================================================================
qConjunto(T, "Inequação racional com numerador fatorável", "medio",
  R`Resolva a inequação $\dfrac{x^{2}-x-6}{x+1}\geq0$.`,
  R`$\left[-2,-1\right)\cup\left[3,+\infty\right)$`,
  [
    R`$\left(-2,-1\right)\cup\left(3,+\infty\right)$`,
    R`$\left(-\infty,-2\right]\cup\left(-1,3\right]$`,
    R`$\left[-2,-1\right]\cup\left[3,+\infty\right)$`,
    R`$\left(-1,3\right]$`,
  ],
  R`Fatore o numerador: $x^{2}-x-6=(x-3)(x+2)$. Os pontos críticos são $-2$, $-1$ e $3$. O sinal do quociente é: negativo em $\left(-\infty,-2\right)$, positivo em $\left(-2,-1\right)$, negativo em $\left(-1,3\right)$ e positivo em $\left(3,+\infty\right)$. Como a desigualdade não é estrita, os zeros do numerador ($-2$ e $3$) entram; o zero do denominador ($-1$) fica de fora obrigatoriamente.`,
  {
    alvo: (x) => !igual(x, -1) && ge((x * x - x - 6) / (x + 1), 0),
    cand: (x) => (ge(x, -2) && lt(x, -1)) || ge(x, 3),
    distCand: [
      (x) => (gt(x, -2) && lt(x, -1)) || gt(x, 3),
      (x) => le(x, -2) || (gt(x, -1) && le(x, 3)),
      (x) => (ge(x, -2) && le(x, -1)) || ge(x, 3),
      (x) => gt(x, -1) && le(x, 3),
    ],
    amostras: grade(-6, 7, 901, [-2, -1, 3]),
  });

qConjunto(T, "Inequação com radical e sinal do lado direito", "dificil",
  R`Resolva a inequação $\sqrt{x^{2}-4}<x-1$.`,
  R`$\left[2,\dfrac{5}{2}\right)$`,
  [
    R`$\left(2,\dfrac{5}{2}\right)$`,
    R`$\left[2,\dfrac{5}{2}\right]$`,
    R`$\left(-\infty,-2\right]\cup\left[2,\dfrac{5}{2}\right)$`,
    R`$\left[-2,\dfrac{5}{2}\right)$`,
  ],
  R`O domínio pede $x^{2}-4\geq0$, isto é $x\leq-2$ ou $x\geq2$. Elevar ao quadrado só é legítimo com o lado direito positivo, então é preciso $x-1>0$: isso já elimina todo o ramo $x\leq-2$ (ali a raiz é $\geq0$ e o lado direito é negativo). Restando $x\geq2$, eleve: $x^{2}-4<x^{2}-2x+1$, ou seja $2x<5$ e $x<\tfrac{5}{2}$. A resposta é $\left[2,\tfrac{5}{2}\right)$ — em $x=2$ a raiz vale $0$ e o lado direito vale $1$, então o extremo entra.`,
  {
    alvo: (x) => ge(x * x - 4, 0) && lt(Math.sqrt(Math.max(0, x * x - 4)), x - 1),
    cand: (x) => ge(x, 2) && lt(x, 2.5),
    distCand: [
      (x) => gt(x, 2) && lt(x, 2.5),
      (x) => ge(x, 2) && le(x, 2.5),
      (x) => le(x, -2) || (ge(x, 2) && lt(x, 2.5)),
      (x) => ge(x, -2) && lt(x, 2.5),
    ],
    amostras: grade(-6, 6, 901, [-2, 2, 2.5]),
  });

qConjunto(T, "Inequação-produto com fator de multiplicidade par", "medio",
  R`Resolva a inequação $\left(x-1\right)^{2}\left(x+2\right)\left(x-4\right)<0$.`,
  R`$\left(-2,1\right)\cup\left(1,4\right)$`,
  [
    R`$\left(-2,4\right)$`,
    R`$\left[-2,4\right]$`,
    R`$\left(-\infty,-2\right)\cup\left(4,+\infty\right)$`,
    R`$\left(-2,1\right)$`,
  ],
  R`O fator $(x-1)^{2}$ nunca é negativo, então ele não troca o sinal do produto — mas ANULA a expressão em $x=1$, e a desigualdade é estrita, de modo que $1$ tem de sair. Sobra estudar $(x+2)(x-4)<0$, verdadeiro entre as raízes: $-2<x<4$. Retirando o ponto $1$, a resposta é $\left(-2,1\right)\cup\left(1,4\right)$.`,
  {
    alvo: (x) => lt(Math.pow(x - 1, 2) * (x + 2) * (x - 4), 0),
    cand: (x) => (gt(x, -2) && lt(x, 1)) || (gt(x, 1) && lt(x, 4)),
    distCand: [
      (x) => gt(x, -2) && lt(x, 4),
      (x) => ge(x, -2) && le(x, 4),
      (x) => lt(x, -2) || gt(x, 4),
      (x) => gt(x, -2) && lt(x, 1),
    ],
    amostras: grade(-5, 7, 901, [-2, 1, 4]),
  });

q(T, "Interseção de duas condições — contagem de inteiros", "dificil",
  R`Quantos números inteiros satisfazem simultaneamente $x^{2}-9x+14<0$ e $\dfrac{x+1}{x-4}\geq0$?`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$4$`, R`$0$`],
  R`A primeira inequação dá $(x-2)(x-7)<0$, isto é $2<x<7$. A segunda tem pontos críticos $-1$ e $4$: o quociente é positivo em $\left(-\infty,-1\right]$ (o $-1$ entra por anular o numerador) e em $\left(4,+\infty\right)$, saindo $x=4$. A interseção das duas é $\left(4,7\right)$, que contém exatamente os inteiros $5$ e $6$.`,
  2,
  () => {
    let n = 0;
    for (let x = -60; x <= 60; x++) {
      if (x === 4) continue;
      if (x * x - 9 * x + 14 < 0 && (x + 1) / (x - 4) >= 0) n++;
    }
    return n;
  });

qConjunto(T, "Parâmetro para duas raízes reais distintas", "dificil",
  R`Determine todos os valores reais de $m$ para os quais a equação $x^{2}-2mx+m+6=0$ tem duas raízes reais distintas.`,
  R`$\left(-\infty,-2\right)\cup\left(3,+\infty\right)$`,
  [
    R`$\left(-2,3\right)$`,
    R`$\left(-\infty,-2\right]\cup\left[3,+\infty\right)$`,
    R`$\left(-\infty,-3\right)\cup\left(2,+\infty\right)$`,
    R`$\left(3,+\infty\right)$`,
  ],
  R`Duas raízes reais distintas equivalem a discriminante estritamente positivo: $\Delta=4m^{2}-4(m+6)>0$, isto é $m^{2}-m-6>0$, ou $(m-3)(m+2)>0$. Uma parábola com concavidade para cima é positiva FORA das raízes, logo $m<-2$ ou $m>3$. Os extremos $-2$ e $3$ saem porque ali $\Delta=0$ e a raiz é dupla, não duas distintas.`,
  {
    alvo: (m) => gt(4 * m * m - 4 * (m + 6), 0),
    cand: (m) => lt(m, -2) || gt(m, 3),
    distCand: [
      (m) => gt(m, -2) && lt(m, 3),
      (m) => le(m, -2) || ge(m, 3),
      (m) => lt(m, -3) || gt(m, 2),
      (m) => gt(m, 3),
    ],
    amostras: grade(-8, 8, 901, [-2, 3, -3, 2]),
  });

q(T, "Menor inteiro que mantém a parábola positiva", "dificil",
  R`Determine o menor valor inteiro de $k$ para que $x^{2}+kx+9>0$ para todo $x$ real.`,
  R`$-5$`,
  [R`$-6$`, R`$-3$`, R`$0$`, R`$5$`],
  R`Uma parábola com concavidade para cima é positiva em toda a reta exatamente quando não tem raiz real, isto é $\Delta<0$: $k^{2}-36<0$, ou $-6<k<6$. Os inteiros que servem vão de $-5$ a $5$, e o menor deles é $-5$. Repare que $k=-6$ não serve: ali $\Delta=0$ e a parábola toca o eixo em $x=3$, onde vale zero — e zero não é maior que zero.`,
  -5,
  () => {
    for (let k = -30; k <= 30; k++) if (extremo((x) => x * x + k * x + 9, -50, 50, "min", 4000).y > 0) return k;
    return NaN;
  });

// ===========================================================================
// L. MÓDULO
// ===========================================================================
q(T, "Equação com dois módulos", "medio",
  R`Determine a soma das raízes reais de $\left|x-1\right|+\left|x+2\right|=7$.`,
  R`$-1$`,
  [R`$1$`, R`$-7$`, R`$7$`, R`$3$`],
  R`Divida a reta nos pontos em que cada módulo troca de expressão: $-2$ e $1$. Para $x\geq1$: $(x-1)+(x+2)=2x+1=7$, logo $x=3$, que respeita $x\geq1$. Para $-2\leq x<1$: $(1-x)+(x+2)=3$, constante — nunca igual a $7$. Para $x<-2$: $(1-x)+(-x-2)=-2x-1=7$, logo $x=-4$, que respeita $x<-2$. As raízes são $3$ e $-4$, de soma $-1$.`,
  -1,
  () => soma(raizes((x) => Math.abs(x - 1) + Math.abs(x + 2) - 7, -12, 12)));

q(T, "Módulo de quadrática igualado a uma reta", "dificil",
  R`Determine o número de raízes reais de $\left|x^{2}-4\right|=x+2$.`,
  R`$3$`,
  [R`$2$`, R`$4$`, R`$1$`, R`$0$`],
  R`Separe pelos sinais do que está dentro do módulo. Se $\left|x\right|\geq2$: $x^{2}-4=x+2$, isto é $x^{2}-x-6=0$, com $x=3$ (aceito) e $x=-2$ (aceito, pois $\left|-2\right|\geq2$). Se $-2<x<2$: $4-x^{2}=x+2$, isto é $x^{2}+x-2=0$, com $x=1$ (aceito) e $x=-2$ (fora deste ramo, mas já contado). É preciso ainda $x+2\geq0$, satisfeito pelas três. As raízes distintas são $-2$, $1$ e $3$: três ao todo.`,
  3,
  () => raizesComTangencia((x) => Math.abs(x * x - 4) - (x + 2), -6, 6).length);

qConjunto(T, "Inequação com módulo dentro de módulo", "medio",
  R`Resolva a inequação $\left|\left|x-2\right|-3\right|\leq1$.`,
  R`$\left[-2,0\right]\cup\left[4,6\right]$`,
  [
    R`$\left[-2,6\right]$`,
    R`$\left(-2,0\right)\cup\left(4,6\right)$`,
    R`$\left[0,4\right]$`,
    R`$\left[-4,-2\right]\cup\left[2,4\right]$`,
  ],
  R`Trabalhe de fora para dentro. O módulo externo dá $-1\leq\left|x-2\right|-3\leq1$, isto é $2\leq\left|x-2\right|\leq4$. Agora o módulo interno: $\left|x-2\right|\geq2$ significa $x\leq0$ ou $x\geq4$, e $\left|x-2\right|\leq4$ significa $-2\leq x\leq6$. Cruzando as duas condições sobra $\left[-2,0\right]\cup\left[4,6\right]$ — uma "coroa" simétrica em torno de $x=2$.`,
  {
    alvo: (x) => le(Math.abs(Math.abs(x - 2) - 3), 1),
    cand: (x) => (ge(x, -2) && le(x, 0)) || (ge(x, 4) && le(x, 6)),
    distCand: [
      (x) => ge(x, -2) && le(x, 6),
      (x) => (gt(x, -2) && lt(x, 0)) || (gt(x, 4) && lt(x, 6)),
      (x) => ge(x, 0) && le(x, 4),
      (x) => (ge(x, -4) && le(x, -2)) || (ge(x, 2) && le(x, 4)),
    ],
    amostras: grade(-8, 10, 901, [-2, 0, 2, 4, 6, -4]),
  });

qConjunto(T, "Inequação com módulo sobre denominador de sinal variável", "dificil",
  R`Resolva a inequação $\dfrac{\left|x-3\right|}{x+1}\geq1$.`,
  R`$\left(-1,1\right]$`,
  [
    R`$\left[-1,1\right]$`,
    R`$\left(-1,1\right)$`,
    R`$\left(-\infty,-1\right)\cup\left(-1,1\right]$`,
    R`$\left(-1,3\right]$`,
  ],
  R`Não multiplique cruzado sem olhar o sinal do denominador. Se $x<-1$, o lado esquerdo é um número não negativo dividido por um negativo, portanto $\leq0$, nunca $\geq1$. Se $x>-1$, multiplicar por $x+1>0$ preserva o sentido: $\left|x-3\right|\geq x+1$. Para $x\geq3$ isso vira $x-3\geq x+1$, falso; para $-1<x<3$ vira $3-x\geq x+1$, isto é $x\leq1$. A resposta é $\left(-1,1\right]$: o $1$ entra (ali vale exatamente $1$) e o $-1$ sai por anular o denominador.`,
  {
    alvo: (x) => !igual(x, -1) && ge(Math.abs(x - 3) / (x + 1), 1),
    cand: (x) => gt(x, -1) && le(x, 1),
    distCand: [
      (x) => ge(x, -1) && le(x, 1),
      (x) => gt(x, -1) && lt(x, 1),
      (x) => lt(x, -1) || (gt(x, -1) && le(x, 1)),
      (x) => gt(x, -1) && le(x, 3),
    ],
    amostras: grade(-6, 6, 901, [-1, 1, 3]),
  });

q(T, "Produto de módulos igual a uma constante", "dificil",
  R`Determine a soma das raízes reais de $\left|x-1\right|\cdot\left|x+3\right|=5$.`,
  R`$-2$`,
  [R`$2$`, R`$-4$`, R`$0$`, R`$-6$`],
  R`Como $\left|a\right|\left|b\right|=\left|ab\right|$, a equação é $\left|x^{2}+2x-3\right|=5$, que se abre em duas. Primeira: $x^{2}+2x-3=5$, isto é $x^{2}+2x-8=0$, com $x=2$ e $x=-4$. Segunda: $x^{2}+2x-3=-5$, isto é $x^{2}+2x+2=0$, de discriminante $-4$, sem raiz real. Restam $2$ e $-4$, de soma $-2$.`,
  -2,
  () => soma(raizes((x) => Math.abs(x - 1) * Math.abs(x + 3) - 5, -10, 10)));

// ===========================================================================
// M. POLINÔMIOS E FATORAÇÃO
// ===========================================================================
q(T, "Divisibilidade por produto de fatores lineares", "medio",
  R`O polinômio $p(x)=x^{4}-3x^{3}+ax+b$ é divisível por $x^{2}-1$. Determine $a+b$.`,
  R`$2$`,
  [R`$4$`, R`$-2$`, R`$3$`, R`$0$`],
  R`Divisível por $x^{2}-1=(x-1)(x+1)$ significa que $1$ e $-1$ são raízes. De $p(1)=0$: $1-3+a+b=0$, logo $a+b=2$. De $p(-1)=0$: $1+3-a+b=0$, logo $a-b=4$. Resolvendo, $a=3$ e $b=-1$ — e a soma pedida é $a+b=2$, que já saía direto da primeira condição.`,
  2,
  () => {
    const a = bissecao((t) => 1 + 3 - t + (2 - t), -10, 10);
    return a + (2 - a);
  });

qFuncao(T, "Resto da divisão por um produto de binômios", "dificil",
  R`Um polinômio $p(x)$ deixa resto $5$ na divisão por $x-1$ e resto $-4$ na divisão por $x+2$. Determine o resto da divisão de $p(x)$ por $(x-1)(x+2)$.`,
  R`$3x+2$`,
  [R`$3x-2$`, R`$2x+3$`, R`$-3x+2$`, R`$x+4$`],
  R`O divisor tem grau $2$, logo o resto tem grau no máximo $1$: escreva $r(x)=\alpha x+\beta$ e $p(x)=(x-1)(x+2)\,q(x)+r(x)$. Substituindo $x=1$, o produto zera e sobra $r(1)=p(1)=5$, isto é $\alpha+\beta=5$ (teorema do resto). Substituindo $x=-2$: $r(-2)=p(-2)=-4$, isto é $-2\alpha+\beta=-4$. Subtraindo, $3\alpha=9$, logo $\alpha=3$ e $\beta=2$: o resto é $3x+2$.`,
  {
    // Referência: resolve o sistema {r(1)=5, r(-2)=-4} numericamente, sem usar
    // a resposta declarada.
    ref: (() => {
      const alfa = bissecao((a) => -2 * a + (5 - a) + 4, -20, 20);
      const beta = 5 - alfa;
      return (x) => alfa * x + beta;
    })(),
    cand: (x) => 3 * x + 2,
    distCand: [(x) => 3 * x - 2, (x) => 2 * x + 3, (x) => -3 * x + 2, (x) => x + 4],
    amostras: [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7],
    tol: 1e-6,
  });

q(T, "Raízes em progressão aritmética", "dificil",
  R`As três raízes reais de $x^{3}-9x^{2}+ax-15=0$ estão em progressão aritmética. Determine $a$.`,
  R`$23$`,
  [R`$21$`, R`$26$`, R`$18$`, R`$27$`],
  R`Escreva as raízes como $r-d$, $r$ e $r+d$. Por Girard, a soma vale $9$, e como ela é $3r$, tem-se $r=3$ — isto é, o termo do meio da progressão é raiz, então $p(3)=0$. Substituindo: $27-81+3a-15=0$, logo $3a=69$ e $a=23$. (De fato, $x^{3}-9x^{2}+23x-15$ tem raízes $1$, $3$ e $5$, em progressão de razão $2$.)`,
  23,
  () => {
    const a = bissecao((t) => 27 - 81 + 3 * t - 15, 0, 60);
    const rs = raizes((x) => x * x * x - 9 * x * x + a * x - 15, -10, 20);
    if (rs.length !== 3 || Math.abs(rs[0] + rs[2] - 2 * rs[1]) > 1e-6) return NaN;
    return a;
  });

q(T, "Equação recíproca de grau 4", "dificil",
  R`Determine a maior raiz real de $2x^{4}-9x^{3}+14x^{2}-9x+2=0$.`,
  R`$2$`,
  [R`$\dfrac{5}{2}$`, R`$1$`, R`$\dfrac{1}{2}$`, R`$4$`],
  R`Os coeficientes se leem iguais de trás para frente (equação recíproca), então $x=0$ não é raiz e podemos dividir tudo por $x^{2}$: $2\left(x^{2}+\tfrac{1}{x^{2}}\right)-9\left(x+\tfrac{1}{x}\right)+14=0$. Com $u=x+\tfrac{1}{x}$, vale $x^{2}+\tfrac{1}{x^{2}}=u^{2}-2$, e a equação vira $2u^{2}-9u+10=0$, com $u=2$ e $u=\tfrac{5}{2}$. De $x+\tfrac{1}{x}=\tfrac{5}{2}$ vêm $x=2$ e $x=\tfrac{1}{2}$; de $x+\tfrac{1}{x}=2$ vem a raiz dupla $x=1$. A maior é $2$.`,
  2,
  () => Math.max(...raizesComTangencia((x) => 2 * x ** 4 - 9 * x ** 3 + 14 * x * x - 9 * x + 2, 0.1, 5)));

q(T, "Raiz racional e fatoração de cúbica", "medio",
  R`Determine a soma das raízes reais de $3x^{3}-x^{2}-8x-4=0$.`,
  R`$\dfrac{1}{3}$`,
  [R`$-\dfrac{1}{3}$`, R`$\dfrac{8}{3}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{4}{3}$`],
  R`Pelo teste das raízes racionais, os candidatos são $\pm1,\pm2,\pm4,\pm\tfrac{1}{3},\pm\tfrac{2}{3},\pm\tfrac{4}{3}$; testando, $x=2$ anula: $24-4-16-4=0$. Dividindo por $x-2$ resta $3x^{2}+5x+2=(3x+2)(x+1)$, cujas raízes são $-\tfrac{2}{3}$ e $-1$. As três são reais e somam $2-\tfrac{2}{3}-1=\tfrac{1}{3}$ — exatamente $-\tfrac{b}{a}=\tfrac{1}{3}$, como manda Girard.`,
  1 / 3,
  () => soma(raizes((x) => 3 * x ** 3 - x * x - 8 * x - 4, -8, 8)));

q(T, "Coeficientes determinados por três valores", "dificil",
  R`Um polinômio $p(x)=x^{3}+ax^{2}+bx+c$ satisfaz $p(1)=0$, $p(-1)=8$ e $p(2)=8$. Determine $p(3)$.`,
  R`$32$`,
  [R`$26$`, R`$38$`, R`$24$`, R`$44$`],
  R`As três condições dão um sistema linear: $1+a+b+c=0$, $-1+a-b+c=8$ e $8+4a+2b+c=8$. Subtraindo a segunda da primeira, $2b=-10$, logo $b=-5$. Com isso a primeira vira $a+c=4$ e a terceira, $4a+c=10$; subtraindo, $3a=6$, ou $a=2$ e $c=2$. Então $p(x)=x^{3}+2x^{2}-5x+2$ e $p(3)=27+18-15+2=32$.`,
  32,
  () => {
    // Elimina a, b, c por substituição numérica a partir das três condições.
    const b = -5;
    const a = bissecao((t) => 4 * t + (4 - t) - 10, -20, 20);
    const c = 4 - a;
    const erro = Math.abs(1 + a + b + c) + Math.abs(-1 + a - b + c - 8) + Math.abs(8 + 4 * a + 2 * b + c - 8);
    if (erro > 1e-6) return NaN;
    return 27 + 9 * a + 3 * b + c;
  });

// ===========================================================================
// N. FUNÇÕES TRIGONOMÉTRICAS
// ===========================================================================
q(T, "Soma de tangente com cotangente", "medio",
  R`Sabendo que $\operatorname{tg}x+\operatorname{cotg}x=4$, determine $\operatorname{sen}(2x)$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{4}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{3}{4}$`],
  R`Some as duas frações: $\dfrac{\operatorname{sen}x}{\cos x}+\dfrac{\cos x}{\operatorname{sen}x}=\dfrac{\operatorname{sen}^{2}x+\cos^{2}x}{\operatorname{sen}x\cos x}=\dfrac{1}{\operatorname{sen}x\cos x}$. Como $\operatorname{sen}(2x)=2\operatorname{sen}x\cos x$, isso é $\dfrac{2}{\operatorname{sen}(2x)}$. Igualando a $4$, obtém-se $\operatorname{sen}(2x)=\tfrac{1}{2}$.`,
  0.5,
  () => {
    const x = bissecao((t) => Math.tan(t) + 1 / Math.tan(t) - 4, 0.05, Math.PI / 4);
    return Math.sin(2 * x);
  });

q(T, "Equação trigonométrica com arco duplo", "dificil",
  R`Determine o número de soluções de $\cos(2x)+3\operatorname{sen}x=2$ no intervalo $\left[0,2\pi\right)$.`,
  R`$3$`,
  [R`$2$`, R`$4$`, R`$1$`, R`$5$`],
  R`Use $\cos(2x)=1-2\operatorname{sen}^{2}x$ para deixar tudo em $s=\operatorname{sen}x$: $1-2s^{2}+3s=2$, isto é $2s^{2}-3s+1=0$, com $s=1$ e $s=\tfrac{1}{2}$. De $\operatorname{sen}x=1$ vem apenas $x=\tfrac{\pi}{2}$; de $\operatorname{sen}x=\tfrac{1}{2}$ vêm $x=\tfrac{\pi}{6}$ e $x=\tfrac{5\pi}{6}$. São três soluções — e repare que $s=1$ contribui com uma só porque ali o seno atinge o máximo.`,
  3,
  () => raizesComTangencia((x) => Math.cos(2 * x) + 3 * Math.sin(x) - 2, 0, TAU - 1e-9).length);

q(T, "Igualdade entre seno e cosseno de arcos múltiplos", "dificil",
  R`Determine o número de soluções de $\operatorname{sen}(3x)=\cos(2x)$ no intervalo $\left[0,2\pi\right)$.`,
  R`$5$`,
  [R`$4$`, R`$6$`, R`$3$`, R`$7$`],
  R`Escreva $\cos(2x)=\operatorname{sen}\left(\tfrac{\pi}{2}-2x\right)$ e use que $\operatorname{sen}\alpha=\operatorname{sen}\beta$ equivale a $\alpha=\beta+2k\pi$ ou $\alpha=\pi-\beta+2k\pi$. Da primeira família, $3x=\tfrac{\pi}{2}-2x+2k\pi$, isto é $x=\tfrac{\pi}{10}+\tfrac{2k\pi}{5}$, que fornece cinco valores em $\left[0,2\pi\right)$. Da segunda, $3x=\pi-\tfrac{\pi}{2}+2x+2k\pi$, ou $x=\tfrac{\pi}{2}+2k\pi$, cujo único valor no intervalo já aparecia na primeira família. Total: cinco soluções.`,
  5,
  () => raizesComTangencia((x) => Math.sin(3 * x) - Math.cos(2 * x), 0, TAU - 1e-9).length);

q(T, "Arco duplo com quadrante determinado", "medio",
  R`Sabendo que $\cos x=-\dfrac{3}{5}$ e que $x$ pertence ao segundo quadrante, determine $\operatorname{sen}(2x)$.`,
  R`$-\dfrac{24}{25}$`,
  [R`$\dfrac{24}{25}$`, R`$-\dfrac{7}{25}$`, R`$-\dfrac{12}{25}$`, R`$\dfrac{7}{25}$`],
  R`Da identidade fundamental, $\operatorname{sen}^{2}x=1-\tfrac{9}{25}=\tfrac{16}{25}$, e no segundo quadrante o seno é POSITIVO: $\operatorname{sen}x=\tfrac{4}{5}$. Então $\operatorname{sen}(2x)=2\operatorname{sen}x\cos x=2\cdot\tfrac{4}{5}\cdot\left(-\tfrac{3}{5}\right)=-\tfrac{24}{25}$ — negativo, coerente com $2x$ caindo no terceiro ou quarto quadrante.`,
  -24 / 25,
  () => Math.sin(2 * Math.acos(-0.6)));

q(T, "Soma das soluções de uma equação na tangente", "dificil",
  R`Determine a soma de todas as soluções de $\operatorname{tg}^{2}x-3=0$ no intervalo $\left[0,2\pi\right)$.`,
  R`$4\pi$`,
  [R`$2\pi$`, R`$3\pi$`, R`$\dfrac{10\pi}{3}$`, R`$\dfrac{14\pi}{3}$`],
  R`A equação dá $\operatorname{tg}x=\sqrt{3}$ ou $\operatorname{tg}x=-\sqrt{3}$ — os dois sinais, e é aí que se perdem soluções. A tangente tem período $\pi$, então cada valor fornece dois arcos na volta completa: de $\operatorname{tg}x=\sqrt{3}$ vêm $x=\tfrac{\pi}{3}$ e $x=\tfrac{4\pi}{3}$; de $\operatorname{tg}x=-\sqrt{3}$ vêm $x=\tfrac{2\pi}{3}$ e $x=\tfrac{5\pi}{3}$. Somando, $\tfrac{\pi+2\pi+4\pi+5\pi}{3}=\tfrac{12\pi}{3}=4\pi$.`,
  4 * Math.PI,
  // A tangente ao quadrado explode nos polos, mas SEM trocar de sinal (os dois
  // lados vão para +infinito), então a varredura de raízes não inventa raiz lá.
  () => soma(raizes((x) => Math.pow(Math.tan(x), 2) - 3, 0, TAU - 0.01)),
  { tol: 1e-6 });

q(T, "Arcos côngruos", "medio",
  R`Calcule $\operatorname{sen}\dfrac{37\pi}{6}+\cos\dfrac{25\pi}{3}$.`,
  R`$1$`,
  [R`$0$`, R`$\dfrac{1}{2}$`, R`$-1$`, R`$-\dfrac{1}{2}$`],
  R`Reduza cada arco à primeira volta descontando múltiplos de $2\pi$. Como $\tfrac{37\pi}{6}=6\pi+\tfrac{\pi}{6}$ e $6\pi$ são três voltas completas, $\operatorname{sen}\tfrac{37\pi}{6}=\operatorname{sen}\tfrac{\pi}{6}=\tfrac{1}{2}$. Como $\tfrac{25\pi}{3}=8\pi+\tfrac{\pi}{3}$, $\cos\tfrac{25\pi}{3}=\cos\tfrac{\pi}{3}=\tfrac{1}{2}$. A soma vale $1$.`,
  1,
  () => Math.sin((37 * Math.PI) / 6) + Math.cos((25 * Math.PI) / 3),
  { tol: 1e-9 });

qConjunto(T, "Inequação trigonométrica quadrática", "dificil",
  R`Resolva, no intervalo $\left[0,2\pi\right)$, a inequação $2\operatorname{sen}^{2}x-3\operatorname{sen}x+1\leq0$.`,
  R`$\left[\dfrac{\pi}{6},\dfrac{5\pi}{6}\right]$`,
  [
    R`$\left(\dfrac{\pi}{6},\dfrac{5\pi}{6}\right)$`,
    R`$\left[0,\dfrac{\pi}{6}\right]\cup\left[\dfrac{5\pi}{6},2\pi\right)$`,
    R`$\left[\dfrac{\pi}{3},\dfrac{2\pi}{3}\right]$`,
    R`$\left[\dfrac{\pi}{6},\dfrac{\pi}{2}\right]$`,
  ],
  R`Com $s=\operatorname{sen}x$, a inequação é $2s^{2}-3s+1\leq0$, isto é $(2s-1)(s-1)\leq0$, satisfeita para $\tfrac{1}{2}\leq s\leq1$. O teto $s\leq1$ é automático, então basta $\operatorname{sen}x\geq\tfrac{1}{2}$. No círculo trigonométrico, o seno é maior ou igual a $\tfrac{1}{2}$ no arco que vai de $\tfrac{\pi}{6}$ a $\tfrac{5\pi}{6}$, extremos incluídos (ali vale exatamente $\tfrac{1}{2}$).`,
  {
    alvo: (x) => le(2 * Math.sin(x) ** 2 - 3 * Math.sin(x) + 1, 0),
    cand: (x) => ge(x, Math.PI / 6) && le(x, (5 * Math.PI) / 6),
    distCand: [
      (x) => gt(x, Math.PI / 6) && lt(x, (5 * Math.PI) / 6),
      (x) => (ge(x, 0) && le(x, Math.PI / 6)) || (ge(x, (5 * Math.PI) / 6) && lt(x, TAU)),
      (x) => ge(x, Math.PI / 3) && le(x, (2 * Math.PI) / 3),
      (x) => ge(x, Math.PI / 6) && le(x, Math.PI / 2),
    ],
    amostras: grade(0, TAU - 1e-9, 901, [Math.PI / 6, (5 * Math.PI) / 6, Math.PI / 3, (2 * Math.PI) / 3, Math.PI / 2]),
  });

// ===========================================================================
// O. COMPOSIÇÃO E FUNÇÃO DEFINIDA POR PARTES
// ===========================================================================
q(T, "Composições que comutam", "medio",
  R`Sejam $f(x)=2x-3$ e $g(x)=x^{2}+1$. Determine a soma dos valores de $x$ para os quais $\left(f\circ g\right)(x)=\left(g\circ f\right)(x)$.`,
  R`$6$`,
  [R`$3$`, R`$12$`, R`$-6$`, R`$4$`],
  R`Calcule as duas compostas na ordem certa. $\left(f\circ g\right)(x)=f\left(x^{2}+1\right)=2\left(x^{2}+1\right)-3=2x^{2}-1$. Já $\left(g\circ f\right)(x)=g(2x-3)=(2x-3)^{2}+1=4x^{2}-12x+10$. Igualando, $2x^{2}-1=4x^{2}-12x+10$, isto é $2x^{2}-12x+11=0$. O discriminante é $144-88=56>0$, logo há duas raízes reais, e por Girard a soma delas é $\tfrac{12}{2}=6$.`,
  6,
  () => soma(raizes((x) => 2 * (x * x + 1) - 3 - (Math.pow(2 * x - 3, 2) + 1), -10, 10)));

q(T, "Composição iterada de função com radical", "dificil",
  R`Seja $f(x)=\dfrac{x}{\sqrt{1+x^{2}}}$. Determine $\left(f\circ f\circ f\right)(1)$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{\sqrt{2}}{2}$`, R`$\dfrac{1}{\sqrt{5}}$`, R`$\dfrac{2}{3}$`],
  R`Vale a pena descobrir o padrão em vez de calcular às cegas. Se $y=f(x)=\dfrac{x}{\sqrt{1+x^{2}}}$, então $1+y^{2}=\dfrac{1+2x^{2}}{1+x^{2}}$ e $f(y)=\dfrac{x}{\sqrt{1+2x^{2}}}$; repetindo, a $n$-ésima composta é $\dfrac{x}{\sqrt{1+nx^{2}}}$. Com $n=3$ e $x=1$, o resultado é $\dfrac{1}{\sqrt{4}}=\tfrac{1}{2}$.`,
  0.5,
  () => {
    const f = (x) => x / Math.sqrt(1 + x * x);
    return f(f(f(1)));
  });

q(T, "Equação em função de três ramos", "dificil",
  R`Seja $f(x)=\begin{cases}-x-2,& x<-1\\ x^{2},& -1\leq x\leq2\\ 8-2x,& x>2\end{cases}$. Determine o número de soluções reais de $f(x)=3$.`,
  R`$3$`,
  [R`$2$`, R`$4$`, R`$1$`, R`$5$`],
  R`Resolva ramo a ramo, sempre conferindo se a solução cai no intervalo daquele ramo. Em $x<-1$: $-x-2=3$ dá $x=-5$, que serve. Em $-1\leq x\leq2$: $x^{2}=3$ dá $x=\pm\sqrt{3}$, e só $\sqrt{3}\approx1{,}73$ está no intervalo ($-\sqrt{3}\approx-1{,}73$ está fora). Em $x>2$: $8-2x=3$ dá $x=2{,}5$, que serve. São três soluções: $-5$, $\sqrt{3}$ e $2{,}5$.`,
  3,
  () => {
    const f = (x) => (x < -1 ? -x - 2 : x <= 2 ? x * x : 8 - 2 * x);
    return raizesComTangencia((x) => f(x) - 3, -10, 10).length;
  });

q(T, "Composição iterada periódica", "dificil",
  R`Seja $f(x)=\dfrac{1}{1-x}$ e denote por $f^{n}$ a composição de $f$ consigo mesma $n$ vezes. Determine $f^{2026}(2)$.`,
  R`$-1$`,
  [R`$2$`, R`$\dfrac{1}{2}$`, R`$-2$`, R`$\dfrac{1}{3}$`],
  R`Itere algumas vezes: $f(2)=\dfrac{1}{1-2}=-1$, $f(-1)=\dfrac{1}{1+1}=\tfrac{1}{2}$ e $f\left(\tfrac{1}{2}\right)=\dfrac{1}{1-\tfrac{1}{2}}=2$ — voltamos ao ponto de partida, então a composição tem período $3$. Como $2026=3\cdot675+1$, tem-se $f^{2026}(2)=f^{1}(2)=-1$.`,
  -1,
  () => {
    let x = 2;
    for (let i = 0; i < 2026; i++) x = 1 / (1 - x);
    return x;
  });

// ===========================================================================
// P. PROBLEMAS APLICADOS
// ===========================================================================
q(T, "Área máxima com um lado apoiado num muro", "medio",
  R`Um terreno retangular será cercado com $120$ m de tela, aproveitando um muro já existente como um dos lados. Determine a maior área possível, em metros quadrados.`,
  R`$1800$`,
  [R`$900$`, R`$1200$`, R`$3600$`, R`$1600$`],
  R`Chame de $x$ cada um dos dois lados perpendiculares ao muro e de $y$ o lado paralelo a ele. A tela cobre três lados: $2x+y=120$, logo $y=120-2x$. A área é $A(x)=x(120-2x)=-2x^{2}+120x$, uma parábola com concavidade para baixo cujo vértice está em $x=\dfrac{120}{4}=30$. Então $y=60$ e $A=30\cdot60=1800$ metros quadrados.`,
  1800,
  () => extremo((x) => x * (120 - 2 * x), 0, 60, "max").y);

q(T, "Preço que maximiza o lucro", "dificil",
  R`A receita mensal de uma empresa, em função do preço unitário $p$, é $R(p)=p\left(600-4p\right)$ e o custo é $C(p)=2000+50p$. Determine o preço que maximiza o lucro.`,
  R`$68{,}75$`,
  [R`$75{,}00$`, R`$62{,}50$`, R`$70{,}00$`, R`$65{,}25$`],
  R`O lucro é a diferença: $L(p)=600p-4p^{2}-2000-50p=-4p^{2}+550p-2000$. É uma parábola com concavidade para baixo, então o máximo está no vértice: $p=-\dfrac{550}{2\cdot(-4)}=\dfrac{550}{8}=68{,}75$. O erro comum é maximizar a receita ($p=75$), esquecendo que o custo também cresce com o preço.`,
  68.75,
  () => extremo((p) => p * (600 - 4 * p) - (2000 + 50 * p), 0, 200, "max").x,
  { tol: 1e-5 });

q(T, "Mínimo do custo médio", "medio",
  R`O custo para produzir $x$ unidades de um produto é $C(x)=x^{2}-40x+625$ reais. Determine o número de unidades que minimiza o custo médio $\dfrac{C(x)}{x}$.`,
  R`$25$`,
  [R`$20$`, R`$30$`, R`$40$`, R`$50$`],
  R`O custo médio é $M(x)=\dfrac{x^{2}-40x+625}{x}=x+\dfrac{625}{x}-40$, definido para $x>0$. Pela desigualdade entre as médias aritmética e geométrica, $x+\dfrac{625}{x}\geq2\sqrt{625}=50$, com igualdade exatamente quando $x=\dfrac{625}{x}$, isto é $x=25$. O custo médio mínimo é então $50-40=10$ reais por unidade.`,
  25,
  () => extremo((x) => (x * x - 40 * x + 625) / x, 1, 200, "min").x,
  { tol: 1e-5 });

finalizar("fcg_lote5.json", 20260916);
