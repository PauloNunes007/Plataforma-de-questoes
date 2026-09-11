// Lote 5 de Cálculo I — 85 questões: Continuidade (42) e A Derivada (43).
//
// Parte da equalização do banco: com "Limites" em 57 questões e o resto da
// ementa entre 13 e 21, os tópicos seguintes sobem para o mesmo patamar. Nível
// Guidorizzi vol. 1 / Stewart / Leithold, calibrado para P1 de federal: zero
// questão `facil` e nenhuma que se resolva num passo só.
//
// Cada questão traz `valor` (a resposta em forma fechada) e `checar` (uma
// recomputação numérica independente). `finalizar()` só escreve o JSON se as
// duas baterem — e se o LaTeX da alternativa do gabarito for avaliado no mesmo
// número. Ver `calculo1_kit.mjs`.
//
// Rode: node listas_questoes/gerado/scripts/calculo1_lote5.mjs
import {
  R,
  q,
  finalizar,
  d1,
  limite,
  bissecao,
  contarRaizes,
  resolverParametro,
} from "./calculo1_kit.mjs";

// ===========================================================================
// CONTINUIDADE — 42
// ===========================================================================

// --- prolongamento contínuo (o valor que "tapa o buraco") ------------------
q(
  "Continuidade", "Prolongamento com fatoração de multiplicidade dois", "dificil",
  R`Seja $f(x)=\dfrac{x^{3}-3x+2}{x^{4}-4x+3}$ para $x\neq1$. Determine o valor que se deve atribuir a $f(1)$ para que $f$ seja contínua em $x=1$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{3}{4}$`],
  R`Tanto o numerador quanto o denominador se anulam em $x=1$, e com multiplicidade dois: $x^{3}-3x+2=(x-1)^{2}(x+2)$ e $x^{4}-4x+3=(x-1)^{2}\left(x^{2}+2x+3\right)$. Cancelando o fator $(x-1)^{2}$, sobra $\dfrac{x+2}{x^{2}+2x+3}$, que em $x=1$ vale $\dfrac{3}{6}=\dfrac{1}{2}$. Cancelar só um fator $(x-1)$ deixaria outra indeterminação — é o erro comum aqui.`,
  1 / 2,
  () => limite((x) => (x ** 3 - 3 * x + 2) / (x ** 4 - 4 * x + 3), 1, 1)
);

q(
  "Continuidade", "Prolongamento com exponencial e cosseno", "dificil",
  R`Seja $f(x)=\dfrac{e^{x^{2}}-\cos x}{x^{2}}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$\dfrac{3}{2}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{5}{2}$`, R`$\dfrac{1}{3}$`],
  R`Escreva o numerador como $\left(e^{x^{2}}-1\right)+\left(1-\cos x\right)$. Dividindo por $x^{2}$, o primeiro pedaço tende a $1$, porque $e^{u}-1\sim u$ com $u=x^{2}$, e o segundo tende a $\dfrac{1}{2}$, pois $1-\cos x\sim\dfrac{x^{2}}{2}$. Logo $f(0)=1+\dfrac{1}{2}=\dfrac{3}{2}$.`,
  3 / 2,
  () => limite((x) => (Math.exp(x * x) - Math.cos(x)) / (x * x), 0, 1)
);

q(
  "Continuidade", "Prolongamento com duas exponenciais de bases distintas", "dificil",
  R`Seja $f(x)=\dfrac{3^{x}-2^{x}}{x}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$\ln\dfrac{3}{2}$`,
  [R`$\ln\dfrac{2}{3}$`, R`$\ln 6$`, R`$\ln\dfrac{1}{6}$`, R`$\ln 5$`],
  R`Some e subtraia $1$ no numerador: $\dfrac{\left(3^{x}-1\right)-\left(2^{x}-1\right)}{x}$. Como $a^{x}-1=e^{x\ln a}-1\sim x\ln a$, cada parcela tende a $\ln 3$ e $\ln 2$. Portanto $f(0)=\ln 3-\ln 2=\ln\dfrac{3}{2}$.`,
  Math.log(3 / 2),
  () => limite((x) => (3 ** x - 2 ** x) / x, 0, 1)
);

q(
  "Continuidade", "Prolongamento com racionalização em ponto simétrico", "medio",
  R`Seja $f(x)=\dfrac{\sqrt{x^{2}+3}-2}{x^{2}-1}$ para $x\neq\pm1$. Determine $f(1)$ para que $f$ seja contínua em $x=1$.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{1}{8}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{6}$`],
  R`Multiplicando pelo conjugado, $\sqrt{x^{2}+3}-2=\dfrac{x^{2}-1}{\sqrt{x^{2}+3}+2}$. O fator $x^{2}-1$ cancela com o denominador e resta $\dfrac{1}{\sqrt{x^{2}+3}+2}$, contínua em $x=1$, onde vale $\dfrac{1}{2+2}=\dfrac{1}{4}$.`,
  1 / 4,
  () => limite((x) => (Math.sqrt(x * x + 3) - 2) / (x * x - 1), 1, 1)
);

q(
  "Continuidade", "Prolongamento com logaritmo e exponencial", "medio",
  R`Seja $f(x)=\dfrac{\ln(1+3x)}{e^{4x}-1}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$\dfrac{3}{4}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{3}{2}$`, R`$\dfrac{1}{3}$`],
  R`Use os infinitésimos equivalentes $\ln(1+u)\sim u$ e $e^{v}-1\sim v$: o numerador se comporta como $3x$ e o denominador como $4x$. O quociente tende a $\dfrac{3}{4}$, que é o valor do prolongamento.`,
  3 / 4,
  () => limite((x) => Math.log(1 + 3 * x) / (Math.exp(4 * x) - 1), 0, 1)
);

q(
  "Continuidade", "Prolongamento com raiz cúbica", "medio",
  R`Seja $f(x)=\dfrac{\sqrt[3]{8+x}-2}{x}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$\dfrac{1}{12}$`,
  [R`$\dfrac{1}{6}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{1}{8}$`],
  R`Ponha $u=\sqrt[3]{8+x}$, de modo que $x=u^{3}-8$ e $u\to2$. O quociente vira $\dfrac{u-2}{u^{3}-8}=\dfrac{1}{u^{2}+2u+4}$, que tende a $\dfrac{1}{4+4+4}=\dfrac{1}{12}$.`,
  1 / 12,
  () => limite((x) => (Math.cbrt(8 + x) - 2) / x, 0, 1)
);

q(
  "Continuidade", "Prolongamento com infinitésimo de terceira ordem", "medio",
  R`Seja $f(x)=\dfrac{x-\operatorname{sen}x}{x^{3}}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$\dfrac{1}{6}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{2}{3}$`],
  R`Aplicando L'Hospital três vezes: $\dfrac{1-\cos x}{3x^{2}}$, depois $\dfrac{\operatorname{sen}x}{6x}$ e por fim $\dfrac{\cos x}{6}\to\dfrac{1}{6}$. O mesmo sai do desenvolvimento $\operatorname{sen}x=x-\dfrac{x^{3}}{6}+\cdots$, que mostra que o numerador é um infinitésimo de terceira ordem.`,
  1 / 6,
  () => limite((x) => (x - Math.sin(x)) / x ** 3, 0, 1)
);

q(
  "Continuidade", "Prolongamento com produto de cossenos", "dificil",
  R`Seja $f(x)=\dfrac{1-\cos x\cos 2x}{x^{2}}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$\dfrac{5}{2}$`,
  [R`$\dfrac{3}{2}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{5}{4}$`, R`$\dfrac{7}{2}$`],
  R`Escreva $1-\cos x\cos 2x=\left(1-\cos x\right)+\cos x\left(1-\cos 2x\right)$. Dividindo por $x^{2}$, a primeira parcela tende a $\dfrac{1}{2}$ e a segunda a $1\cdot\dfrac{4}{2}=2$, pois $1-\cos 2x\sim\dfrac{(2x)^{2}}{2}$. O prolongamento vale $\dfrac{1}{2}+2=\dfrac{5}{2}$.`,
  5 / 2,
  () => limite((x) => (1 - Math.cos(x) * Math.cos(2 * x)) / (x * x), 0, 1)
);

q(
  "Continuidade", "Prolongamento com seno de argumento composto", "medio",
  R`Seja $f(x)=\dfrac{\operatorname{sen}\left(x^{2}-4\right)}{x-2}$ para $x\neq2$. Determine $f(2)$ para que $f$ seja contínua em $x=2$.`,
  R`$4$`,
  [R`$2$`, R`$1$`, R`$8$`, R`$0$`],
  R`Multiplique e divida por $x^{2}-4$: $f(x)=\dfrac{\operatorname{sen}\left(x^{2}-4\right)}{x^{2}-4}\cdot\left(x+2\right)$. Com $u=x^{2}-4\to0$, o primeiro fator tende a $1$ e o segundo a $4$. Logo $f(2)=4$.`,
  4,
  () => limite((x) => Math.sin(x * x - 4) / (x - 2), 2, 1)
);

q(
  "Continuidade", "Prolongamento com diferença de radicais simétricos", "medio",
  R`Seja $f(x)=\dfrac{\sqrt{2+x}-\sqrt{2-x}}{x}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$\dfrac{\sqrt{2}}{2}$`,
  [R`$\dfrac{\sqrt{2}}{4}$`, R`$\sqrt{2}$`, R`$\dfrac{\sqrt{2}}{8}$`, R`$2\sqrt{2}$`],
  R`Racionalizando, $\sqrt{2+x}-\sqrt{2-x}=\dfrac{(2+x)-(2-x)}{\sqrt{2+x}+\sqrt{2-x}}=\dfrac{2x}{\sqrt{2+x}+\sqrt{2-x}}$. Dividindo por $x$ e fazendo $x\to0$, resta $\dfrac{2}{2\sqrt{2}}=\dfrac{1}{\sqrt{2}}=\dfrac{\sqrt{2}}{2}$.`,
  Math.SQRT2 / 2,
  () => limite((x) => (Math.sqrt(2 + x) - Math.sqrt(2 - x)) / x, 0, 1)
);

q(
  "Continuidade", "Prolongamento com seno sobre diferença de radicais", "medio",
  R`Seja $f(x)=\dfrac{\operatorname{sen}x}{\sqrt{1+x}-\sqrt{1-x}}$ para $x\neq0$. Determine $f(0)$ para que $f$ seja contínua em $x=0$.`,
  R`$1$`,
  [R`$2$`, R`$0$`, R`$3$`, R`$4$`],
  R`Racionalize o denominador: $\sqrt{1+x}-\sqrt{1-x}=\dfrac{2x}{\sqrt{1+x}+\sqrt{1-x}}$. Assim $f(x)=\dfrac{\operatorname{sen}x}{x}\cdot\dfrac{\sqrt{1+x}+\sqrt{1-x}}{2}$, produto que tende a $1\cdot\dfrac{2}{2}=1$.`,
  1,
  () => limite((x) => Math.sin(x) / (Math.sqrt(1 + x) - Math.sqrt(1 - x)), 0, 1)
);

q(
  "Continuidade", "Prolongamento com raiz cúbica no denominador", "medio",
  R`Seja $f(x)=\dfrac{x-1}{\sqrt[3]{x}-1}$ para $x\neq1$. Determine $f(1)$ para que $f$ seja contínua em $x=1$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$6$`, R`$9$`],
  R`Com $u=\sqrt[3]{x}$, tem-se $x=u^{3}$ e $u\to1$, de modo que $\dfrac{x-1}{\sqrt[3]{x}-1}=\dfrac{u^{3}-1}{u-1}=u^{2}+u+1$. O limite é $1+1+1=3$.`,
  3,
  () => limite((x) => (x - 1) / (Math.cbrt(x) - 1), 1, 1)
);

q(
  "Continuidade", "Prolongamento à direita com radicais no denominador", "dificil",
  R`Seja $f(x)=\dfrac{x^{2}-4}{\sqrt{x}-\sqrt{2}}$ para $x>0$, $x\neq2$. Determine o valor que torna $f$ contínua em $x=2$.`,
  R`$8\sqrt{2}$`,
  [R`$4\sqrt{2}$`, R`$16\sqrt{2}$`, R`$2\sqrt{2}$`, R`$6\sqrt{2}$`],
  R`Racionalize multiplicando por $\sqrt{x}+\sqrt{2}$: o denominador vira $x-2$, que cancela com o fator correspondente de $x^{2}-4=(x-2)(x+2)$. Sobra $\left(x+2\right)\left(\sqrt{x}+\sqrt{2}\right)$, contínua em $x=2$, onde vale $4\cdot2\sqrt{2}=8\sqrt{2}$.`,
  8 * Math.SQRT2,
  () => limite((x) => (x * x - 4) / (Math.sqrt(x) - Math.sqrt(2)), 2, 1)
);

// --- parâmetros que forçam a continuidade ----------------------------------
q(
  "Continuidade", "Dois parâmetros com exponencial e radical", "dificil",
  R`Sejam $a$ e $b$ reais tais que $f(x)=\dfrac{e^{ax}-1}{x}$ para $x<0$, $f(0)=b$ e $f(x)=\dfrac{\sqrt{1+4x}-1}{x}$ para $x>0$. Se $f$ é contínua em $x=0$, calcule $a+b$.`,
  R`$4$`,
  [R`$2$`, R`$3$`, R`$6$`, R`$8$`],
  R`Pela direita, racionalizando: $\dfrac{\sqrt{1+4x}-1}{x}=\dfrac{4}{\sqrt{1+4x}+1}\to2$. Pela esquerda, $\dfrac{e^{ax}-1}{x}=a\cdot\dfrac{e^{ax}-1}{ax}\to a$. A continuidade exige que ambos os limites laterais valham $f(0)=b$, logo $a=2$ e $b=2$, donde $a+b=4$.`,
  4,
  () => {
    const Ld = limite((x) => (Math.sqrt(1 + 4 * x) - 1) / x, 0, 1);
    const a = resolverParametro((t) => limite((x) => (Math.exp(t * x) - 1) / x, 0, -1), Ld, 0, 10);
    return a + Ld;
  }
);

q(
  "Continuidade", "Dois parâmetros com cosseno e seno", "dificil",
  R`Sejam $b>0$ e $c$ reais tais que $f(x)=\dfrac{1-\cos(bx)}{x^{2}}$ para $x<0$, $f(0)=2$ e $f(x)=\dfrac{\operatorname{sen}(2x)}{\sqrt{x+1}-1}-c$ para $x>0$. Se $f$ é contínua em $x=0$, calcule $b+c$.`,
  R`$4$`,
  [R`$2$`, R`$3$`, R`$6$`, R`$8$`],
  R`À esquerda, $\dfrac{1-\cos(bx)}{x^{2}}=\dfrac{b^{2}}{2}\cdot\dfrac{1-\cos(bx)}{(bx)^{2}/2\cdot b^{2}/b^{2}}\to\dfrac{b^{2}}{2}$, e igualando a $2$ vem $b=2$. À direita, racionalizando o denominador, $\sqrt{x+1}-1=\dfrac{x}{\sqrt{x+1}+1}$, de modo que $\dfrac{\operatorname{sen}(2x)}{\sqrt{x+1}-1}=\dfrac{\operatorname{sen}(2x)}{x}\left(\sqrt{x+1}+1\right)\to2\cdot2=4$. Então $4-c=2$ e $c=2$, donde $b+c=4$.`,
  4,
  () => {
    const Ld = limite((x) => Math.sin(2 * x) / (Math.sqrt(x + 1) - 1), 0, 1);
    const c = Ld - 2;
    const b = resolverParametro((t) => limite((x) => (1 - Math.cos(t * x)) / (x * x), 0, -1), 2, 0.1, 10);
    return b + c;
  }
);

q(
  "Continuidade", "Três ramos e dois pontos de colagem", "dificil",
  R`Sejam $a$ e $b$ reais tais que $f(x)=x^{2}+a$ para $x<1$, $f(x)=bx+3$ para $1\leq x<2$ e $f(x)=x^{3}$ para $x\geq2$ definam uma função contínua em $\mathbb{R}$. Calcule $a+b$.`,
  R`$7$`,
  [R`$4$`, R`$5$`, R`$6$`, R`$8$`],
  R`A colagem em $x=2$ dá $2b+3=8$, isto é $b=\dfrac{5}{2}$. A colagem em $x=1$ dá $1+a=b+3=\dfrac{11}{2}$, logo $a=\dfrac{9}{2}$. Somando, $a+b=\dfrac{9}{2}+\dfrac{5}{2}=7$. Comece sempre pelo ponto em que só há uma incógnita.`,
  7,
  () => {
    const b = bissecao((t) => 2 * t + 3 - 2 ** 3, -10, 10);
    const a = b * 1 + 3 - 1 ** 2;
    return a + b;
  }
);

q(
  "Continuidade", "Parâmetro dentro de um radical", "dificil",
  R`Sejam $a$ e $b$ reais tais que $f(x)=\dfrac{\sqrt{9+ax}-3}{x}$ para $x<0$, $f(0)=b$ e $f(x)=\dfrac{\ln(1+2x)}{x}$ para $x>0$. Se $f$ é contínua em $x=0$, calcule $a-b$.`,
  R`$10$`,
  [R`$6$`, R`$8$`, R`$12$`, R`$14$`],
  R`Pela direita, $\dfrac{\ln(1+2x)}{x}\to2$, então $b=2$. Pela esquerda, racionalizando, $\dfrac{\sqrt{9+ax}-3}{x}=\dfrac{a}{\sqrt{9+ax}+3}\to\dfrac{a}{6}$. Igualando a $2$, vem $a=12$, e $a-b=10$.`,
  10,
  () => {
    const Ld = limite((x) => Math.log(1 + 2 * x) / x, 0, 1);
    const a = resolverParametro((t) => limite((x) => (Math.sqrt(9 + t * x) - 3) / x, 0, -1), Ld, 1, 30);
    return a - Ld;
  }
);

q(
  "Continuidade", "Parâmetro em diferença de exponenciais", "medio",
  R`Seja $a$ real tal que $f(x)=\dfrac{e^{3x}-e^{ax}}{x}$ para $x\neq0$ e $f(0)=1$ seja contínua em $x=0$. Determine $a$.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$4$`, R`$-2$`],
  R`Some e subtraia $1$: $\dfrac{\left(e^{3x}-1\right)-\left(e^{ax}-1\right)}{x}\to3-a$. A continuidade exige $3-a=1$, ou seja, $a=2$.`,
  2,
  () => resolverParametro((t) => limite((x) => (Math.exp(3 * x) - Math.exp(t * x)) / x, 0, 1), 1, -5, 5)
);

q(
  "Continuidade", "Parâmetro e valor do limite na mesma questão", "dificil",
  R`Seja $a$ o único real para o qual $\displaystyle\lim_{x\to2}\dfrac{x^{2}+ax+2a}{x^{2}-4}$ existe e é finito, e seja $L$ esse limite. Calcule $a+L$.`,
  R`$-\dfrac{1}{4}$`,
  [R`$\dfrac{1}{4}$`, R`$-\dfrac{3}{4}$`, R`$\dfrac{3}{4}$`, R`$-\dfrac{1}{2}$`],
  R`Como o denominador se anula em $x=2$, o limite só é finito se o numerador também se anular ali: $4+2a+2a=0$, isto é, $a=-1$. Com esse valor, $x^{2}-x-2=(x-2)(x+1)$ e $\dfrac{(x-2)(x+1)}{(x-2)(x+2)}=\dfrac{x+1}{x+2}\to\dfrac{3}{4}$. Logo $a+L=-1+\dfrac{3}{4}=-\dfrac{1}{4}$.`,
  -1 / 4,
  () => {
    const a = bissecao((t) => 4 + 2 * t + 2 * t, -5, 5);
    return a + limite((x) => (x * x + a * x + 2 * a) / (x * x - 4), 2, 1);
  }
);

q(
  "Continuidade", "Parâmetro em quociente de senos", "medio",
  R`Seja $a$ real tal que $f(x)=\dfrac{\operatorname{sen}(ax)}{\operatorname{sen}(3x)}$ para $x\neq0$ e $f(0)=\dfrac{5}{3}$ seja contínua em $x=0$. Determine $a$.`,
  R`$5$`,
  [R`$3$`, R`$4$`, R`$6$`, R`$15$`],
  R`Divida numerador e denominador por $x$: $\dfrac{\operatorname{sen}(ax)/x}{\operatorname{sen}(3x)/x}\to\dfrac{a}{3}$. A continuidade exige $\dfrac{a}{3}=\dfrac{5}{3}$, logo $a=5$.`,
  5,
  () => resolverParametro((t) => limite((x) => Math.sin(t * x) / Math.sin(3 * x), 0, 1), 5 / 3, 0, 20)
);

q(
  "Continuidade", "Parâmetro num infinitésimo de terceira ordem", "dificil",
  R`Seja $a>0$ tal que $f(x)=\dfrac{\operatorname{tg}(ax)-\operatorname{sen}(ax)}{x^{3}}$ para $x\neq0$ e $f(0)=4$ seja contínua em $x=0$. Determine $a$.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$4$`, R`$8$`],
  R`Fatorando, $\operatorname{tg}u-\operatorname{sen}u=\operatorname{sen}u\cdot\dfrac{1-\cos u}{\cos u}$, que para $u\to0$ se comporta como $u\cdot\dfrac{u^{2}}{2}=\dfrac{u^{3}}{2}$. Com $u=ax$, o quociente tende a $\dfrac{a^{3}}{2}$. Igualando a $4$, vem $a^{3}=8$ e $a=2$.`,
  2,
  () => resolverParametro((t) => limite((x) => (Math.tan(t * x) - Math.sin(t * x)) / x ** 3, 0, 1), 4, 0.1, 5)
);

q(
  "Continuidade", "Parâmetro no limite exponencial fundamental", "medio",
  R`Seja $a$ real tal que $f(x)=\left(1+ax\right)^{1/x}$ para $x\neq0$ e $f(0)=e^{3}$ seja contínua em $x=0$. Determine $a$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$6$`, R`$9$`],
  R`Tomando logaritmo, $\ln f(x)=\dfrac{\ln(1+ax)}{x}\to a$, pois $\ln(1+u)\sim u$. Pela continuidade da exponencial, $f(x)\to e^{a}$, e a exigência $e^{a}=e^{3}$ dá $a=3$.`,
  3,
  () => resolverParametro((t) => limite((x) => Math.pow(1 + t * x, 1 / x), 0, 1), Math.E ** 3, 0.1, 10)
);

q(
  "Continuidade", "Parâmetro sob radical com prolongamento", "dificil",
  R`Seja $a$ real tal que $f(x)=\dfrac{\sqrt{x+a}-2}{x-3}$, definida para $x\neq3$, admita prolongamento contínuo em $x=3$. Determine o valor desse prolongamento.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{1}{6}$`, R`$\dfrac{1}{8}$`, R`$\dfrac{1}{3}$`],
  R`Para o limite ser finito, o numerador precisa se anular em $x=3$: $\sqrt{3+a}=2$, ou seja, $a=1$. Com $a=1$, racionalizando: $\dfrac{\sqrt{x+1}-2}{x-3}=\dfrac{x-3}{(x-3)\left(\sqrt{x+1}+2\right)}=\dfrac{1}{\sqrt{x+1}+2}\to\dfrac{1}{4}$.`,
  1 / 4,
  () => {
    const a = bissecao((t) => Math.sqrt(3 + t) - 2, -2, 5);
    return limite((x) => (Math.sqrt(x + a) - 2) / (x - 3), 3, 1);
  }
);

// --- Teorema do Valor Intermediário / contagem de raízes -------------------
q(
  "Continuidade", "Contagem de raízes de uma quártica pelo TVI", "dificil",
  R`Determine o número de raízes reais da equação $x^{4}-4x+1=0$.`,
  R`$2$`,
  [R`$0$`, R`$1$`, R`$3$`, R`$4$`],
  R`Seja $f(x)=x^{4}-4x+1$. Como $f'(x)=4x^{3}-4=4\left(x^{3}-1\right)$, a função decresce em $(-\infty,1)$ e cresce em $(1,+\infty)$, com mínimo $f(1)=-2<0$. Em cada ramo de monotonicidade $f$ é injetora e vai a $+\infty$, então o Teorema do Valor Intermediário garante exatamente uma raiz em cada um: são $2$ raízes reais.`,
  2,
  () => contarRaizes((x) => x ** 4 - 4 * x + 1, -5, 5)
);

q(
  "Continuidade", "Contagem de raízes de uma cúbica pelo TVI", "dificil",
  R`Determine o número de raízes reais da equação $x^{3}-3x+1=0$.`,
  R`$3$`,
  [R`$0$`, R`$1$`, R`$2$`, R`$4$`],
  R`Com $f(x)=x^{3}-3x+1$ tem-se $f'(x)=3x^{2}-3$, que anula em $x=\pm1$. Como $f(-1)=3>0$ é máximo local, $f(1)=-1<0$ é mínimo local e $f\to\mp\infty$ nos extremos, o sinal muda três vezes. O TVI dá uma raiz em cada um dos intervalos $(-\infty,-1)$, $(-1,1)$ e $(1,+\infty)$.`,
  3,
  () => contarRaizes((x) => x ** 3 - 3 * x + 1, -5, 5)
);

q(
  "Continuidade", "Interseção entre exponencial e parábola", "dificil",
  R`Determine o número de soluções reais da equação $2^{x}=x^{2}$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$0$`],
  R`Seja $f(x)=2^{x}-x^{2}$, contínua em $\mathbb{R}$. Duas soluções são visíveis: $x=2$ e $x=4$. Além delas, $f(-1)=\dfrac{1}{2}-1<0$ e $f(0)=1>0$, o que pelo TVI dá uma raiz em $(-1,0)$. Para $x>4$ a exponencial domina e $f>0$; entre $2$ e $4$, $f<0$; e para $x<-1$, $f<0$. São exatamente $3$ soluções.`,
  3,
  () => contarRaizes((x) => 2 ** x - x * x, -3, 6)
);

q(
  "Continuidade", "Número de soluções com raiz dupla", "dificil",
  R`Determine o número de soluções reais distintas da equação $x^{3}-6x^{2}+9x=4$.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$0$`, R`$4$`],
  R`A equação equivale a $x^{3}-6x^{2}+9x-4=0$, e $x=1$ é raiz. Dividindo, $x^{3}-6x^{2}+9x-4=(x-1)^{2}(x-4)$. As soluções são $x=1$ (dupla) e $x=4$: apenas $2$ valores distintos. Repare que em $x=1$ o gráfico tangencia o eixo sem trocar de sinal — contar trocas de sinal daria $1$, resposta errada.`,
  2,
  () => contarRaizes((x) => x ** 3 - 6 * x * x + 9 * x - 4, -5, 8)
);

q(
  "Continuidade", "Contagem de raízes de uma quíntica", "dificil",
  R`Determine o número de raízes reais da equação $x^{5}-5x+3=0$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$5$`],
  R`Seja $f(x)=x^{5}-5x+3$. Então $f'(x)=5x^{4}-5=5\left(x^{4}-1\right)$ anula em $x=\pm1$, com máximo local $f(-1)=7>0$ e mínimo local $f(1)=-1<0$. Como $f\to-\infty$ à esquerda e $f\to+\infty$ à direita, há troca de sinal nos três intervalos de monotonicidade: $3$ raízes reais.`,
  3,
  () => contarRaizes((x) => x ** 5 - 5 * x + 3, -5, 5)
);

q(
  "Continuidade", "Localização de raiz num intervalo unitário", "medio",
  R`Seja $n$ o inteiro tal que a equação $x^{3}+x-7=0$ possui raiz no intervalo $(n,\,n+1)$. Determine $n$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$3$`, R`$-1$`],
  R`Seja $f(x)=x^{3}+x-7$, contínua. Como $f(1)=1+1-7=-5<0$ e $f(2)=8+2-7=3>0$, o Teorema do Valor Intermediário garante uma raiz em $(1,2)$, logo $n=1$. Como $f$ é estritamente crescente ($f'=3x^{2}+1>0$), essa raiz é a única.`,
  1,
  () => Math.floor(bissecao((x) => x ** 3 + x - 7, 0, 5))
);

q(
  "Continuidade", "Interseção entre cosseno e cúbica", "medio",
  R`Determine o número de soluções reais da equação $\cos x=x^{3}$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$3$`, R`$4$`],
  R`Seja $f(x)=\cos x-x^{3}$. Para $x\leq0$ tem-se $-x^{3}\geq0$ e, quando $x\leq-1$, $-x^{3}\geq1\geq\cos x$ com desigualdade estrita, de modo que $f>0$; no trecho $(-1,0]$ também $f>0$. Para $x\geq1$, $x^{3}\geq1>\cos x$ e $f<0$. Sobra $(0,1)$, onde $f(0)=1>0$, $f(1)=\cos 1-1<0$ e $f$ é decrescente: exatamente $1$ solução.`,
  1,
  () => contarRaizes((x) => Math.cos(x) - x ** 3, -10, 10)
);

q(
  "Continuidade", "Raízes de uma quártica com três pontos críticos", "dificil",
  R`Determine o número de raízes reais da equação $3x^{4}-8x^{3}-6x^{2}+24x-5=0$.`,
  R`$2$`,
  [R`$0$`, R`$1$`, R`$3$`, R`$4$`],
  R`Com $f(x)=3x^{4}-8x^{3}-6x^{2}+24x-5$, tem-se $f'(x)=12\left(x-2\right)\left(x^{2}-1\right)$, com pontos críticos $-1$, $1$ e $2$. Os valores são $f(-1)=-24$ (mínimo), $f(1)=8$ (máximo) e $f(2)=3$ (mínimo). Como $f\to+\infty$ nos dois extremos, há troca de sinal apenas em $(-\infty,-1)$ e em $(-1,1)$; depois de $x=1$ a função nunca volta a ser negativa. São $2$ raízes.`,
  2,
  () => contarRaizes((x) => 3 * x ** 4 - 8 * x ** 3 - 6 * x * x + 24 * x - 5, -5, 5)
);

// --- descontinuidades: classificação, saltos, composição -------------------
q(
  "Continuidade", "Salto de uma exponencial com expoente 1/x", "dificil",
  R`Seja $f(x)=\dfrac{1}{1+2^{1/x}}$ para $x\neq0$. Calcule $\displaystyle\lim_{x\to0^{+}}f(x)-\lim_{x\to0^{-}}f(x)$.`,
  R`$-1$`,
  [R`$1$`, R`$0$`, R`$2$`, R`$-2$`],
  R`Quando $x\to0^{+}$, $\dfrac{1}{x}\to+\infty$ e $2^{1/x}\to+\infty$, de modo que $f\to0$. Quando $x\to0^{-}$, $\dfrac{1}{x}\to-\infty$ e $2^{1/x}\to0$, de modo que $f\to1$. A diferença pedida é $0-1=-1$: a descontinuidade em $x=0$ é de salto, de amplitude $1$.`,
  -1,
  () => limite((x) => 1 / (1 + 2 ** (1 / x)), 0, 1, 0.02) - limite((x) => 1 / (1 + 2 ** (1 / x)), 0, -1, 0.02)
);

q(
  "Continuidade", "Descontinuidades removíveis e não removíveis", "medio",
  R`Determine quantos pontos de descontinuidade **não removível** tem a função $f(x)=\dfrac{x^{2}-x-6}{x^{3}-4x}$.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$0$`, R`$4$`],
  R`Fatorando, $f(x)=\dfrac{(x-3)(x+2)}{x(x-2)(x+2)}$. A função não está definida em $x=0$, $x=2$ e $x=-2$. Em $x=-2$ o fator comum cancela e o limite é finito, $\dfrac{-5}{(-2)(-4)}=-\dfrac{5}{8}$: descontinuidade removível. Em $x=0$ e $x=2$ o limite é infinito, e essas duas descontinuidades não são removíveis.`,
  2,
  () => {
    const f = (x) => (x * x - x - 6) / (x ** 3 - 4 * x);
    return [-2, 0, 2].filter((p) => Math.abs(f(p + 1e-6)) > 1e4).length;
  }
);

q(
  "Continuidade", "Descontinuidade de uma função composta", "medio",
  R`Sejam $f(x)=\dfrac{1}{x-2}$ e $g(x)=\sqrt{x+3}$. Determine o valor de $x$ em que a composta $f\circ g$ não é contínua.`,
  R`$1$`,
  [R`$-3$`, R`$2$`, R`$4$`, R`$-1$`],
  R`Tem-se $\left(f\circ g\right)(x)=\dfrac{1}{\sqrt{x+3}-2}$, definida para $x\geq-3$. Ela deixa de existir quando o denominador se anula, isto é, $\sqrt{x+3}=2$, ou seja, $x+3=4$ e $x=1$. Nos demais pontos do domínio a composta de contínuas é contínua.`,
  1,
  () => bissecao((x) => Math.sqrt(x + 3) - 2, -2, 10)
);

q(
  "Continuidade", "Salto de uma função com módulo no denominador", "medio",
  R`Seja $f(x)=\dfrac{\left|x-3\right|\left(x+1\right)}{x-3}$ para $x\neq3$. Calcule $\displaystyle\lim_{x\to3^{+}}f(x)-\lim_{x\to3^{-}}f(x)$.`,
  R`$8$`,
  [R`$4$`, R`$0$`, R`$-8$`, R`$-4$`],
  R`Para $x>3$ vale $\left|x-3\right|=x-3$ e $f(x)=x+1\to4$. Para $x<3$ vale $\left|x-3\right|=3-x$ e $f(x)=-(x+1)\to-4$. A diferença é $4-(-4)=8$.`,
  8,
  () => {
    const f = (x) => (Math.abs(x - 3) * (x + 1)) / (x - 3);
    return limite(f, 3, 1) - limite(f, 3, -1);
  }
);

q(
  "Continuidade", "Duas descontinuidades removíveis com módulo", "dificil",
  R`Seja $f(x)=\dfrac{x^{2}-9}{\left|x\right|-3}$, definida para $\left|x\right|\neq3$. Sabendo que $f$ admite prolongamento contínuo em $x=3$ e em $x=-3$, calcule a soma dos dois valores desse prolongamento.`,
  R`$12$`,
  [R`$0$`, R`$6$`, R`$-6$`, R`$18$`],
  R`Para $x>0$ perto de $3$, $\left|x\right|-3=x-3$ e $f(x)=\dfrac{(x-3)(x+3)}{x-3}=x+3\to6$. Para $x<0$ perto de $-3$, $\left|x\right|-3=-x-3$ e $f(x)=\dfrac{(x-3)(x+3)}{-(x+3)}=3-x\to6$. Os dois prolongamentos valem $6$, e a soma é $12$.`,
  12,
  () => {
    const f = (x) => (x * x - 9) / (Math.abs(x) - 3);
    return limite(f, 3, 1) + limite(f, -3, 1);
  }
);

q(
  "Continuidade", "Salto de um quociente de exponenciais", "dificil",
  R`Seja $f(x)=\dfrac{e^{1/x}-1}{e^{1/x}+1}$ para $x\neq0$. Calcule $\displaystyle\lim_{x\to0^{+}}f(x)-\lim_{x\to0^{-}}f(x)$.`,
  R`$2$`,
  [R`$1$`, R`$0$`, R`$-2$`, R`$-1$`],
  R`Pela direita, $e^{1/x}\to+\infty$; dividindo numerador e denominador por $e^{1/x}$ obtém-se $\dfrac{1-e^{-1/x}}{1+e^{-1/x}}\to1$. Pela esquerda, $e^{1/x}\to0$ e o quociente tende a $\dfrac{-1}{1}=-1$. A diferença é $1-(-1)=2$.`,
  2,
  () => {
    const f = (x) => (Math.exp(1 / x) - 1) / (Math.exp(1 / x) + 1);
    return limite(f, 0, 1, 0.02) - limite(f, 0, -1, 0.02);
  }
);

q(
  "Continuidade", "Descontinuidades da tangente num período", "medio",
  R`Determine quantos pontos do intervalo $\left[0,\,2\pi\right]$ são pontos de descontinuidade de $f(x)=\operatorname{tg}x$.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$4$`, R`$0$`],
  R`Como $\operatorname{tg}x=\dfrac{\operatorname{sen}x}{\cos x}$ é quociente de funções contínuas, ela só deixa de ser contínua onde $\cos x=0$. Em $\left[0,2\pi\right]$ isso ocorre em $x=\dfrac{\pi}{2}$ e $x=\dfrac{3\pi}{2}$: são $2$ pontos, ambos com descontinuidade infinita.`,
  2,
  () => contarRaizes(Math.cos, 0, 2 * Math.PI)
);

q(
  "Continuidade", "Zeros do denominador num intervalo simétrico", "medio",
  R`Determine quantos pontos do intervalo aberto $\left(-2\pi,\,2\pi\right)$ são pontos de descontinuidade de $f(x)=\dfrac{x}{\operatorname{sen}x}$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$5$`],
  R`A função deixa de estar definida onde $\operatorname{sen}x=0$. No intervalo aberto $(-2\pi,2\pi)$ isso acontece em $x=-\pi$, $x=0$ e $x=\pi$ — os pontos $\pm2\pi$ ficam de fora. São $3$ descontinuidades, sendo a de $x=0$ removível (ali o limite vale $1$) e as outras duas infinitas.`,
  3,
  // A borda do intervalo precisa de folga real: com extremo em `2π − 1e-9` o
  // próprio extremo passa no teste |f| < 1e-7 e entra como quarta "raiz".
  () => contarRaizes(Math.sin, -2 * Math.PI + 0.01, 2 * Math.PI - 0.01)
);

q(
  "Continuidade", "Salto com módulo no denominador e fator quadrático", "medio",
  R`Seja $f(x)=\dfrac{x^{2}+2x}{\left|x\right|}$ para $x\neq0$. Calcule $\displaystyle\lim_{x\to0^{+}}f(x)-\lim_{x\to0^{-}}f(x)$.`,
  R`$4$`,
  [R`$2$`, R`$0$`, R`$-4$`, R`$-2$`],
  R`Fatorando, $x^{2}+2x=x(x+2)$. Para $x>0$, $\dfrac{x(x+2)}{x}=x+2\to2$; para $x<0$, $\dfrac{x(x+2)}{-x}=-(x+2)\to-2$. A diferença é $2-(-2)=4$.`,
  4,
  () => {
    const f = (x) => (x * x + 2 * x) / Math.abs(x);
    return limite(f, 0, 1) - limite(f, 0, -1);
  }
);

q(
  "Continuidade", "Salto do arco-tangente de 1/x", "dificil",
  R`Seja $f(x)=\operatorname{arctg}\left(\dfrac{1}{x}\right)$ para $x\neq0$. Calcule $\displaystyle\lim_{x\to0^{+}}f(x)-\lim_{x\to0^{-}}f(x)$.`,
  R`$\pi$`,
  // Distratores propositalmente do mesmo tamanho da correta: com "π/2" e "3π/2"
  // na lista, a resposta era a única alternativa curta do conjunto (razão 0,36
  // no conferir-alternativas.mjs) — um tell visual, ainda que invertido.
  [R`$0$`, R`$2\pi$`, R`$3\pi$`, R`$4\pi$`],
  R`Pela direita, $\dfrac{1}{x}\to+\infty$ e $\operatorname{arctg}$ tende a $\dfrac{\pi}{2}$. Pela esquerda, $\dfrac{1}{x}\to-\infty$ e o arco-tangente tende a $-\dfrac{\pi}{2}$. O salto é $\dfrac{\pi}{2}-\left(-\dfrac{\pi}{2}\right)=\pi$, e nenhum valor atribuído a $f(0)$ remove essa descontinuidade.`,
  Math.PI,
  () => {
    const f = (x) => Math.atan(1 / x);
    return limite(f, 0, 1, 0.01) - limite(f, 0, -1, 0.01);
  }
);

q(
  "Continuidade", "Descontinuidades de uma racional num intervalo fechado", "medio",
  R`Determine quantos pontos do intervalo $\left[0,\,3\right]$ são pontos de descontinuidade de $f(x)=\dfrac{x^{2}-3x+2}{x^{2}-4x+3}$.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$0$`, R`$4$`],
  R`Fatorando, $f(x)=\dfrac{(x-1)(x-2)}{(x-1)(x-3)}$. O denominador anula em $x=1$ e $x=3$, ambos em $\left[0,3\right]$: a função não está definida nesses dois pontos. Em $x=1$ a descontinuidade é removível (o limite vale $\dfrac{1-2}{1-3}=\dfrac{1}{2}$) e em $x=3$ é infinita — mas as duas contam como pontos de descontinuidade.`,
  2,
  () => contarRaizes((x) => x * x - 4 * x + 3, 0, 3)
);

// ===========================================================================
// A DERIVADA — 43
// ===========================================================================

// --- derivada pela definição (e limites disfarçados) -----------------------
q(
  "A Derivada", "Definição com incrementos de sinais opostos", "dificil",
  R`Seja $f(x)=x^{3}-2x$. Calcule $\displaystyle\lim_{h\to0}\dfrac{f(2+3h)-f(2-h)}{h}$.`,
  R`$40$`,
  [R`$10$`, R`$20$`, R`$30$`, R`$50$`],
  R`Some e subtraia $f(2)$ no numerador: $\dfrac{f(2+3h)-f(2)}{h}-\dfrac{f(2-h)-f(2)}{h}$. O primeiro quociente vale $3\cdot\dfrac{f(2+3h)-f(2)}{3h}\to3f'(2)$ e o segundo $-\dfrac{f(2-h)-f(2)}{-h}\to-f'(2)$, com o sinal invertido. O limite é $4f'(2)$, e como $f'(x)=3x^{2}-2$ dá $f'(2)=10$, resulta $40$.`,
  40,
  () => {
    const f = (x) => x ** 3 - 2 * x;
    return limite((h) => (f(2 + 3 * h) - f(2 - h)) / h, 0, 1);
  }
);

q(
  "A Derivada", "Quociente de Newton com fator polinomial", "dificil",
  R`Seja $f$ derivável com $f(1)=2$ e $f'(1)=-3$. Calcule $\displaystyle\lim_{x\to1}\dfrac{x^{2}f(1)-f(x)}{x-1}$.`,
  R`$7$`,
  [R`$1$`, R`$-7$`, R`$4$`, R`$3$`],
  R`Chame $g(x)=x^{2}f(1)-f(x)$. Como $g(1)=f(1)-f(1)=0$, o limite é exatamente $g'(1)$ pela definição de derivada. Derivando, $g'(x)=2xf(1)-f'(x)$, logo $g'(1)=2\cdot2-(-3)=7$.`,
  7,
  () => {
    const f = (x) => x * x - 5 * x + 6; // f(1)=2 e f'(1)=-3
    return limite((x) => (x * x * f(1) - f(x)) / (x - 1), 1, 1);
  }
);

q(
  "A Derivada", "Definição da derivada com raiz cúbica", "medio",
  R`Calcule $\displaystyle\lim_{h\to0}\dfrac{\sqrt[3]{27+h}-3}{h}$.`,
  R`$\dfrac{1}{27}$`,
  [R`$\dfrac{1}{9}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{81}$`, R`$\dfrac{1}{18}$`],
  R`O quociente é a definição de $f'(27)$ para $f(x)=\sqrt[3]{x}$. Como $f'(x)=\dfrac{1}{3}x^{-2/3}$, tem-se $f'(27)=\dfrac{1}{3\cdot27^{2/3}}=\dfrac{1}{3\cdot9}=\dfrac{1}{27}$.`,
  1 / 27,
  () => limite((h) => (Math.cbrt(27 + h) - 3) / h, 0, 1)
);

q(
  "A Derivada", "Definição da derivada com radical afim", "medio",
  R`Seja $f(x)=\sqrt{2x+1}$. Calcule $f'(4)$ usando a definição de derivada.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{6}$`, R`$\dfrac{1}{9}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{1}{2}$`],
  R`Pela definição, $f'(4)=\lim_{h\to0}\dfrac{\sqrt{9+2h}-3}{h}$. Racionalizando, $\dfrac{\left(9+2h\right)-9}{h\left(\sqrt{9+2h}+3\right)}=\dfrac{2}{\sqrt{9+2h}+3}\to\dfrac{2}{6}=\dfrac{1}{3}$.`,
  1 / 3,
  () => limite((h) => (Math.sqrt(2 * (4 + h) + 1) - 3) / h, 0, 1)
);

q(
  "A Derivada", "Definição da derivada de uma função racional", "medio",
  R`Seja $f(x)=\dfrac{1}{x+2}$. Calcule $\displaystyle\lim_{h\to0}\dfrac{f(1+h)-f(1)}{h}$.`,
  R`$-\dfrac{1}{9}$`,
  [R`$-\dfrac{1}{3}$`, R`$-\dfrac{1}{6}$`, R`$\dfrac{1}{9}$`, R`$-\dfrac{1}{27}$`],
  R`O quociente é $\dfrac{1}{h}\left(\dfrac{1}{3+h}-\dfrac{1}{3}\right)=\dfrac{1}{h}\cdot\dfrac{3-(3+h)}{3(3+h)}=\dfrac{-1}{3(3+h)}$, que tende a $-\dfrac{1}{9}$.`,
  -1 / 9,
  () => {
    const f = (x) => 1 / (x + 2);
    return limite((h) => (f(1 + h) - f(1)) / h, 0, 1);
  }
);

q(
  "A Derivada", "Definição da derivada do seno num ponto notável", "medio",
  R`Calcule $\displaystyle\lim_{h\to0}\dfrac{\operatorname{sen}\left(\dfrac{\pi}{6}+h\right)-\operatorname{sen}\dfrac{\pi}{6}}{h}$.`,
  R`$\dfrac{\sqrt{3}}{2}$`,
  [R`$\dfrac{\sqrt{2}}{2}$`, R`$\dfrac{\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{3}}{4}$`, R`$\dfrac{\sqrt{2}}{4}$`],
  R`O quociente é a definição de $f'\left(\dfrac{\pi}{6}\right)$ com $f=\operatorname{sen}$. Como $f'=\cos$, o limite vale $\cos\dfrac{\pi}{6}=\dfrac{\sqrt{3}}{2}$.`,
  Math.sqrt(3) / 2,
  () => limite((h) => (Math.sin(Math.PI / 6 + h) - Math.sin(Math.PI / 6)) / h, 0, 1)
);

q(
  "A Derivada", "Definição com incremento múltiplo no cosseno", "dificil",
  R`Calcule $\displaystyle\lim_{h\to0}\dfrac{\cos\left(\dfrac{\pi}{3}+2h\right)-\cos\dfrac{\pi}{3}}{h}$.`,
  R`$-\sqrt{3}$`,
  [R`$-\dfrac{\sqrt{3}}{2}$`, R`$\sqrt{3}$`, R`$-2\sqrt{3}$`, R`$-\dfrac{\sqrt{3}}{4}$`],
  R`Multiplique e divida por $2$: $2\cdot\dfrac{\cos\left(\frac{\pi}{3}+2h\right)-\cos\frac{\pi}{3}}{2h}\to2\left(\cos\right)'\left(\dfrac{\pi}{3}\right)=-2\operatorname{sen}\dfrac{\pi}{3}$. Como $\operatorname{sen}\dfrac{\pi}{3}=\dfrac{\sqrt{3}}{2}$, o limite é $-\sqrt{3}$.`,
  -Math.sqrt(3),
  () => limite((h) => (Math.cos(Math.PI / 3 + 2 * h) - Math.cos(Math.PI / 3)) / h, 0, 1)
);

q(
  "A Derivada", "Limite que é a derivada de uma potência alta", "medio",
  R`Calcule $\displaystyle\lim_{x\to2}\dfrac{x^{10}-2^{10}}{x-2}$.`,
  R`$5120$`,
  [R`$2560$`, R`$1024$`, R`$10240$`, R`$512$`],
  R`Esse quociente é a definição de $f'(2)$ para $f(x)=x^{10}$. Como $f'(x)=10x^{9}$, o limite vale $10\cdot2^{9}=10\cdot512=5120$.`,
  5120,
  () => limite((x) => (x ** 10 - 2 ** 10) / (x - 2), 2, 1)
);

q(
  "A Derivada", "Combinação de incrementos com dados pontuais", "dificil",
  R`Seja $f$ derivável com $f(2)=4$ e $f'(2)=5$. Calcule $\displaystyle\lim_{h\to0}\dfrac{f(2+2h)-f(2-3h)}{h}$.`,
  R`$25$`,
  [R`$5$`, R`$10$`, R`$15$`, R`$20$`],
  R`Somando e subtraindo $f(2)$, o quociente vira $2\cdot\dfrac{f(2+2h)-f(2)}{2h}+3\cdot\dfrac{f(2-3h)-f(2)}{-3h}$, cujos limites são $2f'(2)$ e $3f'(2)$. O total é $5f'(2)=25$. Observe que o valor $f(2)=4$ não entra na conta — é um dado deliberadamente inútil.`,
  25,
  () => {
    const f = (x) => x * x + x - 2; // f(2)=4 e f'(2)=5
    return limite((h) => (f(2 + 2 * h) - f(2 - 3 * h)) / h, 0, 1);
  }
);

q(
  "A Derivada", "Derivada num ponto de descontinuidade removível", "medio",
  R`Seja $f(x)=\dfrac{x^{2}-4}{x-2}$ para $x\neq2$ e $f(2)=4$. Calcule $f'(2)$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$4$`, R`$-1$`],
  R`Para $x\neq2$ vale $f(x)=x+2$, e como $f(2)=4$ coincide com o valor do prolongamento, $f(x)=x+2$ em toda a reta. Logo $f'(2)=1$. Se $f(2)$ fosse qualquer outro número, $f$ nem seria contínua em $2$ e a derivada não existiria.`,
  1,
  () => limite((h) => (((2 + h) ** 2 - 4) / h - 4) / h, 0, 1)
);

q(
  "A Derivada", "Derivada pela definição com radical quadrático", "medio",
  R`Seja $f(x)=\sqrt{x^{2}+9}$. Calcule $f'(4)$.`,
  R`$\dfrac{4}{5}$`,
  [R`$\dfrac{3}{5}$`, R`$\dfrac{5}{4}$`, R`$\dfrac{2}{5}$`, R`$\dfrac{4}{3}$`],
  R`Pela definição e racionalizando, $\dfrac{\sqrt{(4+h)^{2}+9}-5}{h}=\dfrac{(4+h)^{2}-16}{h\left(\sqrt{(4+h)^{2}+9}+5\right)}=\dfrac{8+h}{\sqrt{(4+h)^{2}+9}+5}$, que tende a $\dfrac{8}{10}=\dfrac{4}{5}$.`,
  4 / 5,
  () => limite((h) => (Math.sqrt((4 + h) ** 2 + 9) - 5) / h, 0, 1)
);

q(
  "A Derivada", "Abscissa a partir do valor da derivada", "medio",
  R`Seja $f(x)=x^{2}+3x$. Determine o valor de $a$ para o qual $\displaystyle\lim_{h\to0}\dfrac{f(a+h)-f(a)}{h}=9$.`,
  R`$3$`,
  [R`$2$`, R`$4$`, R`$6$`, R`$9$`],
  R`O limite é $f'(a)=2a+3$. A equação $2a+3=9$ dá $a=3$.`,
  3,
  () => bissecao((t) => d1((x) => x * x + 3 * x, t) - 9, -10, 10)
);

// --- reta tangente e reta normal -------------------------------------------
q(
  "A Derivada", "Tangente na origem que reencontra a cúbica", "dificil",
  R`A reta tangente ao gráfico de $f(x)=x^{3}-3x^{2}+2x$ na origem intercepta o gráfico num segundo ponto. Calcule a soma das coordenadas desse ponto.`,
  R`$9$`,
  [R`$3$`, R`$6$`, R`$12$`, R`$15$`],
  R`Como $f'(x)=3x^{2}-6x+2$, tem-se $f'(0)=2$ e a tangente é $y=2x$. Igualando, $x^{3}-3x^{2}+2x=2x$ dá $x^{3}-3x^{2}=0$, isto é, $x^{2}(x-3)=0$. A raiz dupla $x=0$ é o próprio ponto de tangência; o segundo ponto é $x=3$, com $f(3)=27-27+6=6$. A soma é $3+6=9$.`,
  9,
  () => {
    const f = (x) => x ** 3 - 3 * x * x + 2 * x;
    const m = d1(f, 0);
    const r = bissecao((t) => f(t) - m * t, 1, 5);
    return r + f(r);
  }
);

q(
  "A Derivada", "Tangentes à parábola por um ponto do eixo y", "dificil",
  R`Determine o produto dos coeficientes angulares das retas tangentes ao gráfico de $y=x^{2}$ que passam pelo ponto $\left(0,-4\right)$.`,
  R`$-16$`,
  [R`$16$`, R`$-8$`, R`$-4$`, R`$8$`],
  R`A tangente no ponto de abscissa $a$ é $y=2a\left(x-a\right)+a^{2}=2ax-a^{2}$. Impondo que passe por $\left(0,-4\right)$: $-a^{2}=-4$, ou seja, $a=\pm2$. Os coeficientes angulares são $4$ e $-4$, e o produto é $-16$.`,
  -16,
  () => {
    const f = (x) => x * x;
    const h = (a) => f(a) + d1(f, a) * (0 - a) + 4;
    const a1 = bissecao(h, 0.5, 5);
    const a2 = bissecao(h, -5, -0.5);
    return d1(f, a1) * d1(f, a2);
  }
);

q(
  "A Derivada", "Tangentes por um ponto externo a uma parábola transladada", "dificil",
  R`Determine o produto dos coeficientes angulares das retas tangentes ao gráfico de $y=x^{2}+3$ que passam pela origem.`,
  R`$-12$`,
  [R`$12$`, R`$-6$`, R`$-3$`, R`$6$`],
  R`A tangente em $x=a$ é $y=2a\left(x-a\right)+a^{2}+3=2ax-a^{2}+3$. Passando pela origem, $-a^{2}+3=0$ e $a=\pm\sqrt{3}$. Os coeficientes são $2\sqrt{3}$ e $-2\sqrt{3}$, de produto $-12$.`,
  -12,
  () => {
    const f = (x) => x * x + 3;
    const h = (a) => f(a) + d1(f, a) * (0 - a);
    const a1 = bissecao(h, 0.5, 5);
    const a2 = bissecao(h, -5, -0.5);
    return d1(f, a1) * d1(f, a2);
  }
);

q(
  "A Derivada", "Tangente à cúbica por um ponto do eixo y", "dificil",
  R`Existe uma única reta tangente ao gráfico de $y=x^{3}$ que passa pelo ponto $\left(0,2\right)$. Determine seu coeficiente angular.`,
  R`$3$`,
  [R`$1$`, R`$-3$`, R`$6$`, R`$12$`],
  R`A tangente em $x=a$ é $y=3a^{2}\left(x-a\right)+a^{3}=3a^{2}x-2a^{3}$. Passando por $\left(0,2\right)$: $-2a^{3}=2$, logo $a=-1$ — solução única, pois $a\mapsto-2a^{3}$ é injetora. O coeficiente angular é $3a^{2}=3$.`,
  3,
  () => {
    const f = (x) => x ** 3;
    const a = bissecao((t) => f(t) + d1(f, t) * (0 - t) - 2, -3, -0.1);
    return d1(f, a);
  }
);

q(
  "A Derivada", "Soma dos coeficientes de tangentes por um ponto dado", "dificil",
  R`Determine a soma dos coeficientes angulares das retas tangentes ao gráfico de $y=x^{2}-4x+5$ que passam pelo ponto $\left(0,1\right)$.`,
  R`$-8$`,
  [R`$-4$`, R`$0$`, R`$4$`, R`$8$`],
  R`A tangente em $x=a$ tem equação $y=\left(2a-4\right)\left(x-a\right)+a^{2}-4a+5$; fazendo $x=0$, a ordenada do corte é $-a^{2}+5$. Impondo $-a^{2}+5=1$, vem $a=\pm2$, com coeficientes $2a-4$ iguais a $0$ e $-8$. A soma é $-8$.`,
  -8,
  () => {
    const f = (x) => x * x - 4 * x + 5;
    const h = (a) => f(a) + d1(f, a) * (0 - a) - 1;
    const a1 = bissecao(h, 0.5, 5);
    const a2 = bissecao(h, -5, -0.5);
    return d1(f, a1) + d1(f, a2);
  }
);

q(
  "A Derivada", "Área do triângulo formado pela tangente e os eixos", "dificil",
  R`A reta tangente ao gráfico de $y=\dfrac{1}{x}$ no ponto de abscissa $2$ forma, com os eixos coordenados, um triângulo. Calcule sua área.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$4$`, R`$8$`],
  R`Como $y'=-\dfrac{1}{x^{2}}$, o coeficiente angular em $x=2$ é $-\dfrac{1}{4}$ e a tangente é $y=\dfrac{1}{2}-\dfrac{1}{4}\left(x-2\right)=1-\dfrac{x}{4}$. Ela corta os eixos em $\left(4,0\right)$ e $\left(0,1\right)$, e o triângulo retângulo correspondente tem área $\dfrac{4\cdot1}{2}=2$.`,
  2,
  () => {
    const f = (x) => 1 / x;
    const m = d1(f, 2);
    const y0 = f(2);
    const xInt = 2 - y0 / m;
    const yInt = y0 - m * 2;
    return Math.abs(xInt * yInt) / 2;
  }
);

q(
  "A Derivada", "Soma dos interceptos da reta tangente", "medio",
  R`A reta tangente ao gráfico de $y=\dfrac{1}{x^{2}}$ no ponto de abscissa $1$ corta os eixos coordenados em dois pontos. Calcule a soma das coordenadas não nulas desses dois pontos.`,
  R`$\dfrac{9}{2}$`,
  [R`$\dfrac{7}{2}$`, R`$\dfrac{5}{2}$`, R`$\dfrac{11}{2}$`, R`$\dfrac{3}{2}$`],
  R`Com $y'=-\dfrac{2}{x^{3}}$, o coeficiente em $x=1$ é $-2$, e a tangente é $y=1-2\left(x-1\right)=3-2x$. Ela corta o eixo $y$ em $3$ e o eixo $x$ em $\dfrac{3}{2}$. A soma pedida é $3+\dfrac{3}{2}=\dfrac{9}{2}$.`,
  9 / 2,
  () => {
    const f = (x) => 1 / (x * x);
    const m = d1(f, 1);
    const y0 = f(1);
    return y0 - m * 1 + (1 - y0 / m);
  }
);

q(
  "A Derivada", "Reta normal e seu intercepto com o eixo x", "medio",
  R`A reta normal ao gráfico de $y=\sqrt{x}$ no ponto de abscissa $4$ corta o eixo $x$ num ponto. Determine sua abscissa.`,
  R`$\dfrac{9}{2}$`,
  [R`$\dfrac{7}{2}$`, R`$\dfrac{11}{2}$`, R`$\dfrac{17}{4}$`, R`$\dfrac{5}{2}$`],
  R`Como $y'=\dfrac{1}{2\sqrt{x}}$, a tangente em $x=4$ tem coeficiente $\dfrac{1}{4}$ e a normal, coeficiente $-4$. A normal é $y-2=-4\left(x-4\right)$; fazendo $y=0$, obtém-se $x=4+\dfrac{2}{4}=\dfrac{9}{2}$.`,
  9 / 2,
  () => {
    const mn = -1 / d1(Math.sqrt, 4);
    return 4 - Math.sqrt(4) / mn;
  }
);

q(
  "A Derivada", "Normal à parábola que reencontra a curva", "dificil",
  R`A reta normal ao gráfico de $y=x^{2}$ no ponto $\left(1,1\right)$ intercepta a parábola num segundo ponto. Determine sua abscissa.`,
  R`$-\dfrac{3}{2}$`,
  [R`$-\dfrac{1}{2}$`, R`$-\dfrac{3}{4}$`, R`$-\dfrac{2}{3}$`, R`$-\dfrac{5}{2}$`],
  R`A tangente em $\left(1,1\right)$ tem coeficiente $2$, então a normal tem coeficiente $-\dfrac{1}{2}$ e equação $y=1-\dfrac{1}{2}\left(x-1\right)$. Igualando a $x^{2}$: $2x^{2}+x-3=0$, cujas raízes são $x=1$ (o ponto de partida) e $x=-\dfrac{3}{2}$.`,
  -3 / 2,
  () => {
    const f = (x) => x * x;
    const mn = -1 / d1(f, 1);
    return bissecao((x) => f(x) - (1 + mn * (x - 1)), -3, 0);
  }
);

q(
  "A Derivada", "Tangente horizontal que reencontra a cúbica", "medio",
  R`A reta tangente ao gráfico de $y=x^{3}-3x$ no ponto de abscissa $1$ intercepta a curva num segundo ponto. Determine sua abscissa.`,
  R`$-2$`,
  [R`$-1$`, R`$2$`, R`$1$`, R`$-3$`],
  R`Como $y'=3x^{2}-3$ anula em $x=1$, a tangente é horizontal: $y=-2$. Resolvendo $x^{3}-3x=-2$, isto é, $x^{3}-3x+2=0$, fatora-se $\left(x-1\right)^{2}\left(x+2\right)=0$. O segundo ponto tem abscissa $-2$.`,
  -2,
  () => {
    const f = (x) => x ** 3 - 3 * x;
    const m = d1(f, 1);
    return bissecao((x) => f(x) - (f(1) + m * (x - 1)), -3, 0);
  }
);

q(
  "A Derivada", "Tangente à quártica em ponto de tangência dupla", "dificil",
  R`A reta tangente ao gráfico de $y=x^{4}-2x^{2}$ no ponto de abscissa $1$ tangencia a curva num segundo ponto. Determine sua abscissa.`,
  R`$-1$`,
  [R`$0$`, R`$1$`, R`$2$`, R`$-2$`],
  R`Como $y'=4x^{3}-4x$ anula em $x=1$, a tangente é a horizontal $y=-1$. Resolvendo $x^{4}-2x^{2}+1=0$, ou seja, $\left(x^{2}-1\right)^{2}=0$, obtêm-se $x=1$ e $x=-1$, ambas raízes duplas: a reta tangencia a curva nos dois pontos, o que é típico de quárticas com "dois vales" na mesma altura.`,
  -1,
  () => {
    const f = (x) => x ** 4 - 2 * x * x;
    const m = d1(f, 1);
    const g = (x) => (f(x) - (f(1) + m * (x - 1))) ** 2;
    let melhor = -3;
    for (let x = -3; x <= 0; x += 1e-5) if (g(x) < g(melhor)) melhor = x;
    return melhor;
  },
  { tol: 1e-3 }
);

q(
  "A Derivada", "Tangente a partir de um ponto de reencontro conhecido", "dificil",
  R`A reta tangente ao gráfico de $y=x^{3}$ no ponto de abscissa $a>0$ intercepta a curva no ponto $\left(-4,-64\right)$. Determine o coeficiente angular dessa tangente.`,
  R`$12$`,
  [R`$3$`, R`$6$`, R`$24$`, R`$48$`],
  R`A tangente em $x=a$ é $y=3a^{2}x-2a^{3}$. Igualando a $x^{3}$, obtém-se $x^{3}-3a^{2}x+2a^{3}=\left(x-a\right)^{2}\left(x+2a\right)=0$, de modo que o segundo ponto tem abscissa $-2a$. De $-2a=-4$ vem $a=2$, e o coeficiente angular é $3a^{2}=12$.`,
  12,
  () => {
    const f = (x) => x ** 3;
    const a = bissecao((t) => f(-4) - (f(t) + d1(f, t) * (-4 - t)), 0.5, 5);
    return d1(f, a);
  }
);

q(
  "A Derivada", "Tangente paralela a uma reta dada e distância entre os pontos", "dificil",
  R`Seja $f(x)=x^{3}+x$. As retas tangentes ao gráfico de $f$ paralelas à reta $y=4x+1$ tocam o gráfico em dois pontos. Calcule a distância entre eles.`,
  R`$2\sqrt{5}$`,
  [R`$\sqrt{5}$`, R`$4\sqrt{5}$`, R`$2\sqrt{10}$`, R`$3\sqrt{5}$`],
  R`O paralelismo exige $f'(x)=3x^{2}+1=4$, isto é, $x=\pm1$. Os pontos são $\left(1,2\right)$ e $\left(-1,-2\right)$, e a distância vale $\sqrt{2^{2}+4^{2}}=\sqrt{20}=2\sqrt{5}$.`,
  2 * Math.sqrt(5),
  () => {
    const f = (x) => x ** 3 + x;
    const a = bissecao((t) => d1(f, t) - 4, 0.2, 3);
    return Math.hypot(a - -a, f(a) - f(-a));
  }
);

q(
  "A Derivada", "Tangente paralela à corda (ponto de contato)", "medio",
  R`Determine a abscissa do ponto do gráfico de $y=\sqrt{x}$ em que a reta tangente é paralela à corda que une $\left(1,1\right)$ a $\left(4,2\right)$.`,
  R`$\dfrac{9}{4}$`,
  [R`$\dfrac{3}{2}$`, R`$\dfrac{5}{2}$`, R`$\dfrac{9}{8}$`, R`$\dfrac{7}{4}$`],
  R`O coeficiente angular da corda é $\dfrac{2-1}{4-1}=\dfrac{1}{3}$. Igualando à derivada, $\dfrac{1}{2\sqrt{x}}=\dfrac{1}{3}$, donde $\sqrt{x}=\dfrac{3}{2}$ e $x=\dfrac{9}{4}$.`,
  9 / 4,
  () => bissecao((t) => d1(Math.sqrt, t) - 1 / 3, 1, 4)
);

q(
  "A Derivada", "Tangente perpendicular a uma reta dada", "medio",
  R`A reta tangente ao gráfico de $y=\sqrt{x+1}$ num ponto $P$ é perpendicular à reta $y=-4x$. Calcule a soma das coordenadas de $P$.`,
  R`$5$`,
  [R`$3$`, R`$4$`, R`$6$`, R`$7$`],
  R`A perpendicularidade exige coeficiente angular $\dfrac{1}{4}$. Como $y'=\dfrac{1}{2\sqrt{x+1}}$, resolve-se $\dfrac{1}{2\sqrt{x+1}}=\dfrac{1}{4}$, isto é, $\sqrt{x+1}=2$ e $x=3$. Então $y=2$ e a soma é $5$.`,
  5,
  () => {
    const f = (x) => Math.sqrt(x + 1);
    const r = bissecao((t) => d1(f, t) - 0.25, 0, 10);
    return r + f(r);
  }
);

q(
  "A Derivada", "Reta tangente escrita na forma y = ax + b", "medio",
  R`A reta $y=ax+b$ é tangente ao gráfico de $y=\sqrt{x}$ no ponto de abscissa $9$. Calcule $a+b$.`,
  R`$\dfrac{5}{3}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{7}{3}$`, R`$\dfrac{3}{2}$`, R`$\dfrac{5}{6}$`],
  R`Tem-se $a=\dfrac{1}{2\sqrt{9}}=\dfrac{1}{6}$ e, como a reta passa por $\left(9,3\right)$, $b=3-\dfrac{9}{6}=\dfrac{3}{2}$. Logo $a+b=\dfrac{1}{6}+\dfrac{3}{2}=\dfrac{5}{3}$.`,
  5 / 3,
  () => {
    const a = d1(Math.sqrt, 9);
    return a + (3 - a * 9);
  }
);

q(
  "A Derivada", "Tangente comum a duas parábolas", "dificil",
  R`As parábolas $y=x^{2}$ e $y=-x^{2}+4x-4$ admitem duas retas tangentes comuns. Calcule a soma dos coeficientes angulares dessas retas.`,
  R`$4$`,
  [R`$0$`, R`$2$`, R`$6$`, R`$8$`],
  R`A tangente à primeira em $x=a$ é $y=2ax-a^{2}$; à segunda em $x=b$ é $y=\left(4-2b\right)x+b^{2}-4$. Igualando coeficientes angulares, $b=2-a$; igualando os termos independentes, $-a^{2}=\left(2-a\right)^{2}-4=a^{2}-4a$, ou seja, $2a^{2}-4a=0$ e $a\in\left\{0,2\right\}$. Os coeficientes são $0$ e $4$, de soma $4$.`,
  4,
  () => {
    const f = (x) => x * x;
    const g = (x) => -x * x + 4 * x - 4;
    const intercepto = (h, t) => h(t) - d1(h, t) * t;
    const cond = (a) => intercepto(f, a) - intercepto(g, (4 - d1(f, a)) / 2);
    return d1(f, bissecao(cond, -1, 1)) + d1(f, bissecao(cond, 1, 3));
  }
);

q(
  "A Derivada", "Tangentes horizontais e soma das ordenadas", "dificil",
  R`Seja $f(x)=x^{4}-8x^{2}+3$. Calcule a soma das ordenadas dos pontos do gráfico de $f$ em que a reta tangente é horizontal.`,
  R`$-23$`,
  [R`$-13$`, R`$-10$`, R`$3$`, R`$-26$`],
  R`De $f'(x)=4x^{3}-16x=4x\left(x^{2}-4\right)$ vêm as abscissas $x=0$ e $x=\pm2$. As ordenadas são $f(0)=3$ e $f(\pm2)=16-32+3=-13$ (duas vezes). A soma é $3-13-13=-23$.`,
  -23,
  () => {
    const f = (x) => x ** 4 - 8 * x * x + 3;
    const r1 = bissecao((t) => d1(f, t), -3, -1);
    const r2 = bissecao((t) => d1(f, t), -1, 1);
    const r3 = bissecao((t) => d1(f, t), 1, 3);
    return f(r1) + f(r2) + f(r3);
  }
);

q(
  "A Derivada", "Produto das ordenadas com tangente horizontal", "dificil",
  R`Seja $f(x)=\dfrac{x}{x^{2}+1}$. Calcule o produto das ordenadas dos pontos do gráfico de $f$ em que a reta tangente é horizontal.`,
  R`$-\dfrac{1}{4}$`,
  [R`$\dfrac{1}{4}$`, R`$-\dfrac{1}{2}$`, R`$\dfrac{1}{2}$`, R`$-\dfrac{1}{8}$`],
  R`Pela regra do quociente, $f'(x)=\dfrac{\left(x^{2}+1\right)-x\cdot2x}{\left(x^{2}+1\right)^{2}}=\dfrac{1-x^{2}}{\left(x^{2}+1\right)^{2}}$, que anula em $x=\pm1$. As ordenadas correspondentes são $f(1)=\dfrac{1}{2}$ e $f(-1)=-\dfrac{1}{2}$, de produto $-\dfrac{1}{4}$.`,
  -1 / 4,
  () => {
    const f = (x) => x / (x * x + 1);
    return f(bissecao((t) => d1(f, t), 0.2, 3)) * f(bissecao((t) => d1(f, t), -3, -0.2));
  }
);

// --- ângulo entre curvas ----------------------------------------------------
q(
  "A Derivada", "Ângulo entre a parábola e a raiz quadrada", "dificil",
  R`As curvas $y=x^{2}$ e $y=\sqrt{x}$ se cruzam no ponto $\left(1,1\right)$. Calcule a tangente do ângulo agudo entre elas nesse ponto.`,
  R`$\dfrac{3}{4}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{3}{2}$`, R`$\dfrac{4}{3}$`, R`$\dfrac{2}{3}$`],
  R`Os coeficientes angulares são $m_{1}=2$ e $m_{2}=\dfrac{1}{2}$. O ângulo entre as curvas é o ângulo entre as tangentes: $\operatorname{tg}\theta=\left|\dfrac{m_{1}-m_{2}}{1+m_{1}m_{2}}\right|=\left|\dfrac{2-\frac{1}{2}}{1+1}\right|=\dfrac{3}{4}$.`,
  3 / 4,
  () => {
    const m1 = d1((x) => x * x, 1);
    const m2 = d1(Math.sqrt, 1);
    return Math.abs((m1 - m2) / (1 + m1 * m2));
  }
);

q(
  "A Derivada", "Ângulo entre a parábola e a cúbica", "medio",
  R`As curvas $y=x^{2}$ e $y=x^{3}$ se cruzam no ponto $\left(1,1\right)$. Calcule a tangente do ângulo agudo entre elas nesse ponto.`,
  R`$\dfrac{1}{7}$`,
  [R`$\dfrac{1}{5}$`, R`$\dfrac{1}{6}$`, R`$\dfrac{1}{8}$`, R`$\dfrac{5}{7}$`],
  R`Os coeficientes angulares em $x=1$ são $2$ e $3$. Logo $\operatorname{tg}\theta=\left|\dfrac{3-2}{1+6}\right|=\dfrac{1}{7}$.`,
  1 / 7,
  () => {
    const m1 = d1((x) => x * x, 1);
    const m2 = d1((x) => x ** 3, 1);
    return Math.abs((m2 - m1) / (1 + m1 * m2));
  }
);

// --- diferenciabilidade × continuidade -------------------------------------
q(
  "A Derivada", "Colagem derivável de parábola e raiz", "dificil",
  R`Sejam $a$ e $b$ reais tais que $f(x)=ax^{2}+bx$ para $x\leq1$ e $f(x)=2\sqrt{x}+1$ para $x>1$ seja derivável em $x=1$. Calcule $ab$.`,
  R`$-10$`,
  [R`$10$`, R`$-6$`, R`$6$`, R`$-15$`],
  R`A continuidade em $x=1$ dá $a+b=3$. A igualdade das derivadas laterais dá $2a+b=\left.\dfrac{1}{\sqrt{x}}\right|_{x=1}=1$. Subtraindo, $a=-2$ e $b=5$, logo $ab=-10$. Note que derivabilidade exige as duas condições: só igualar derivadas deixaria um degrau no gráfico.`,
  -10,
  () => {
    const g = (x) => 2 * Math.sqrt(x) + 1;
    const a = d1(g, 1) - g(1);
    return a * (g(1) - a);
  }
);

q(
  "A Derivada", "Colagem derivável com radical deslocado", "dificil",
  R`Sejam $a$ e $b$ reais tais que $f(x)=ax^{2}+1$ para $x\leq2$ e $f(x)=\sqrt{x+2}+b$ para $x>2$ seja derivável em $x=2$. Calcule $a+b$.`,
  R`$-\dfrac{11}{16}$`,
  [R`$-\dfrac{5}{16}$`, R`$-\dfrac{9}{16}$`, R`$-\dfrac{13}{16}$`, R`$-\dfrac{3}{16}$`],
  R`A derivada à direita em $x=2$ é $\dfrac{1}{2\sqrt{4}}=\dfrac{1}{4}$, e a da esquerda é $4a$; logo $a=\dfrac{1}{16}$. A continuidade exige $4a+1=2+b$, isto é, $\dfrac{1}{4}+1=2+b$ e $b=-\dfrac{3}{4}$. Somando, $a+b=\dfrac{1}{16}-\dfrac{12}{16}=-\dfrac{11}{16}$.`,
  -11 / 16,
  () => {
    const g = (x) => Math.sqrt(x + 2);
    const a = d1(g, 2) / (2 * 2);
    const b = a * 4 + 1 - g(2);
    return a + b;
  }
);

q(
  "A Derivada", "Pontos angulosos de um módulo de cúbica", "medio",
  R`Determine o número de pontos em que a função $f(x)=\left|x^{3}-3x\right|$ não é derivável.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$0$`],
  R`O módulo só pode criar bico onde o argumento troca de sinal. As raízes de $x^{3}-3x=x\left(x^{2}-3\right)$ são $0$ e $\pm\sqrt{3}$, todas simples, então em cada uma a derivada do argumento é não nula e as derivadas laterais de $f$ têm sinais opostos. São $3$ pontos angulosos.`,
  3,
  () => contarRaizes((x) => x ** 3 - 3 * x, -5, 5)
);

q(
  "A Derivada", "Pontos angulosos de um módulo de parábola", "medio",
  R`Determine o número de pontos em que a função $f(x)=\left|x^{2}-3x+2\right|$ não é derivável.`,
  R`$2$`,
  [R`$0$`, R`$1$`, R`$3$`, R`$4$`],
  R`As raízes de $x^{2}-3x+2$ são $1$ e $2$, ambas simples. Em cada uma delas o gráfico da parábola cruza o eixo e o módulo o reflete, criando um bico: as derivadas laterais valem $\mp1$ em $x=1$ e $\pm1$ em $x=2$. São $2$ pontos.`,
  2,
  () => contarRaizes((x) => x * x - 3 * x + 2, -2, 5)
);

q(
  "A Derivada", "Derivadas laterais de um produto com módulo", "medio",
  R`Seja $f(x)=\left|x-1\right|\left(x+1\right)$. Calcule $f'_{+}(1)-f'_{-}(1)$, a diferença entre as derivadas laterais em $x=1$.`,
  R`$4$`,
  [R`$2$`, R`$0$`, R`$-2$`, R`$-4$`],
  R`Para $x>1$, $f(x)=\left(x-1\right)\left(x+1\right)=x^{2}-1$ e $f'=2x\to2$. Para $x<1$, $f(x)=\left(1-x\right)\left(x+1\right)=1-x^{2}$ e $f'=-2x\to-2$. A diferença é $2-\left(-2\right)=4$, e o ponto é anguloso.`,
  4,
  () => {
    const f = (x) => Math.abs(x - 1) * (x + 1);
    const h = 1e-6;
    return (f(1 + h) - f(1)) / h - (f(1) - f(1 - h)) / h;
  },
  { tol: 1e-4 }
);

q(
  "A Derivada", "Bico de um produto por módulo na origem", "medio",
  R`Determine o número de pontos em que a função $f(x)=\left(x^{2}-1\right)\left|x\right|$ não é derivável.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$3$`, R`$4$`],
  R`Para $x>0$, $f(x)=x^{3}-x$ e $f'\to-1$ quando $x\to0^{+}$; para $x<0$, $f(x)=-x^{3}+x$ e $f'\to1$ quando $x\to0^{-}$. As derivadas laterais diferem apenas em $x=0$; nos demais pontos $f$ é polinomial em cada semirreta. É $1$ ponto.`,
  1,
  () => {
    const f = (x) => (x * x - 1) * Math.abs(x);
    const h = 1e-6;
    return Math.abs((f(h) - f(0)) / h - (f(0) - f(-h)) / h) > 1e-6 ? 1 : 0;
  }
);

q(
  "A Derivada", "Derivadas laterais de x vezes um módulo", "medio",
  R`Seja $f(x)=x\left|x-2\right|$. Calcule $f'(1)+f'(3)$.`,
  R`$4$`,
  [R`$0$`, R`$2$`, R`$6$`, R`$8$`],
  R`Para $x<2$, $f(x)=x\left(2-x\right)=2x-x^{2}$ e $f'(x)=2-2x$, donde $f'(1)=0$. Para $x>2$, $f(x)=x\left(x-2\right)=x^{2}-2x$ e $f'(x)=2x-2$, donde $f'(3)=4$. A soma é $4$ — em $x=2$ a derivada nem existiria, mas o enunciado não pede ali.`,
  4,
  () => {
    const f = (x) => x * Math.abs(x - 2);
    return d1(f, 1) + d1(f, 3);
  }
);

q(
  "A Derivada", "Expoente mínimo para a derivada existir na origem", "dificil",
  R`Seja $f(x)=x^{p}\operatorname{sen}\dfrac{1}{x}$ para $x\neq0$ e $f(0)=0$, com $p$ inteiro positivo. Determine o menor valor de $p$ para o qual $f'(0)$ existe.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$4$`, R`$5$`],
  R`Pela definição, $\dfrac{f(h)-f(0)}{h}=h^{p-1}\operatorname{sen}\dfrac{1}{h}$. Para $p=1$ isso é $\operatorname{sen}\dfrac{1}{h}$, que oscila entre $-1$ e $1$ e não tem limite. Para $p=2$ o quociente é $h\operatorname{sen}\dfrac{1}{h}$, com módulo $\leq\left|h\right|$, e o confronto dá limite $0$. O menor $p$ é $2$.`,
  2,
  () => {
    const oscilacao = (p) => {
      let mx = -Infinity;
      let mn = Infinity;
      for (let k = 0; k < 400; k++) {
        const h = 1 / (1000 + k * 0.37);
        const v = Math.pow(h, p - 1) * Math.sin(1 / h);
        mx = Math.max(mx, v);
        mn = Math.min(mn, v);
      }
      return mx - mn;
    };
    let p = 1;
    while (oscilacao(p) > 1e-2 && p < 6) p++;
    return p;
  }
);

q(
  "A Derivada", "Ordem máxima de derivação de um módulo cúbico", "dificil",
  R`Seja $f(x)=\left|x\right|^{3}$. Determine o maior inteiro $n$ para o qual a derivada $f^{(n)}(0)$ existe.`,
  R`$2$`,
  [R`$0$`, R`$1$`, R`$3$`, R`$4$`],
  R`Para $x>0$, $f(x)=x^{3}$, e para $x<0$, $f(x)=-x^{3}$. Então $f'(x)=3x^{2}$ e $-3x^{2}$, que colam em $0$ com valor $0$; $f''(x)=6x$ e $-6x$, que também colam com valor $0$. Já $f'''$ vale $6$ à direita e $-6$ à esquerda: as derivadas laterais de terceira ordem diferem, e $f'''(0)$ não existe. O maior $n$ é $2$.`,
  2,
  () => {
    const f = (x) => Math.abs(x) ** 3;
    const h = 1e-3;
    const fw3 = (f(3 * h) - 3 * f(2 * h) + 3 * f(h) - f(0)) / h ** 3;
    const bw3 = -(f(-3 * h) - 3 * f(-2 * h) + 3 * f(-h) - f(0)) / h ** 3;
    return Math.abs(fw3 - bw3) > 1 ? 2 : 3;
  }
);

q(
  "A Derivada", "Ordem máxima de derivação de uma potência racional", "dificil",
  R`Seja $f(x)=x^{4/3}$, definida em $\mathbb{R}$. Determine o maior inteiro $n$ para o qual a derivada $f^{(n)}(0)$ existe.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$3$`, R`$4$`],
  R`Pela definição, $\dfrac{f(h)-f(0)}{h}=h^{1/3}\to0$, logo $f'(0)=0$ existe e $f'(x)=\dfrac{4}{3}x^{1/3}$. Já $\dfrac{f'(h)-f'(0)}{h}=\dfrac{4}{3}h^{-2/3}\to+\infty$ pelos dois lados, de modo que $f''(0)$ não existe. O maior $n$ é $1$.`,
  1,
  () => {
    // f'' ~ h^{-2/3} explode devagar: com h = 1e-4 a diferença central ainda dá
    // ~9e2 e passaria por "finita". Precisa de h bem menor para o teste separar.
    const f = (x) => Math.cbrt(x) ** 4;
    const h = 1e-6;
    const seg = (f(h) - 2 * f(0) + f(-h)) / h ** 2;
    return Math.abs(seg) > 1e3 ? 1 : 2;
  }
);

finalizar("calculo1_lote5.json", 20260912);
