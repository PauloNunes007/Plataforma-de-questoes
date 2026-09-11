// Lote 7 de Cálculo I — 87 questões: Função Inversa (44) e Integral Indefinida
// (43). Terceira parte da equalização do banco (ver `calculo1_lote5.mjs` e o kit
// `calculo1_kit.mjs`).
//
// "Função Inversa" é, nesta ementa, o capítulo de Guidorizzi que reúne teorema
// da função inversa, inversas trigonométricas, exponencial/logaritmo e potência
// com expoente real — daí a variedade dentro do tópico.
//
// Nas questões de teorema da função inversa o verificador NÃO refaz a conta
// $1/f'(a)$: ele constrói $f^{-1}$ numericamente por bisseção e deriva essa
// inversa. Nas de integral, integra por Simpson em vez de usar a primitiva.
//
// Rode: node listas_questoes/gerado/scripts/calculo1_lote7.mjs
import { R, q, finalizar, d1, d2, limite, simpson, bissecao, extremo } from "./calculo1_kit.mjs";

// ===========================================================================
// FUNÇÃO INVERSA — 44
// ===========================================================================

// --- teorema da função inversa ----------------------------------------------
q(
  "Função Inversa", "Teorema da função inversa numa cúbica crescente", "medio",
  R`Seja $f(x)=x^{3}+2x+1$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $\left(f^{-1}\right)'(4)$.`,
  R`$\dfrac{1}{5}$`,
  [R`$\dfrac{1}{4}$`, R`$5$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{9}$`],
  R`Como $f(1)=4$, tem-se $f^{-1}(4)=1$. O teorema da função inversa dá $\left(f^{-1}\right)'(4)=\dfrac{1}{f'(1)}$, e $f'(x)=3x^{2}+2$ vale $5$ em $x=1$. Logo a derivada é $\dfrac{1}{5}$.`,
  1 / 5,
  () => d1((y) => bissecao((x) => x ** 3 + 2 * x + 1 - y, -5, 5), 4, 1e-4)
);

q(
  "Função Inversa", "Teorema da função inversa numa quíntica", "medio",
  R`Seja $f(x)=x^{5}+x^{3}+x$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $\left(f^{-1}\right)'(3)$.`,
  R`$\dfrac{1}{9}$`,
  [R`$\dfrac{1}{3}$`, R`$9$`, R`$\dfrac{1}{5}$`, R`$\dfrac{1}{15}$`],
  R`Por inspeção, $f(1)=1+1+1=3$, logo $f^{-1}(3)=1$. Como $f'(x)=5x^{4}+3x^{2}+1$ vale $9$ em $x=1$, o teorema da função inversa dá $\left(f^{-1}\right)'(3)=\dfrac{1}{9}$.`,
  1 / 9,
  () => d1((y) => bissecao((x) => x ** 5 + x ** 3 + x - y, -5, 5), 3, 1e-4)
);

q(
  "Função Inversa", "Teorema da função inversa com logaritmo", "dificil",
  R`Seja $f(x)=x^{3}+\ln x$, bijetora de $\left(0,+\infty\right)$ em $\mathbb{R}$. Calcule $\left(f^{-1}\right)'(1)$.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{3}$`, R`$4$`, R`$\dfrac{1}{2}$`, R`$\dfrac{1}{6}$`],
  R`Como $f(1)=1+0=1$, tem-se $f^{-1}(1)=1$. Derivando, $f'(x)=3x^{2}+\dfrac{1}{x}$, que em $x=1$ vale $4$. Portanto $\left(f^{-1}\right)'(1)=\dfrac{1}{4}$.`,
  1 / 4,
  () => d1((y) => bissecao((x) => x ** 3 + Math.log(x) - y, 1e-6, 10), 1, 1e-4)
);

q(
  "Função Inversa", "Teorema da função inversa com seno", "medio",
  R`Seja $f(x)=2x+\operatorname{sen}x$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $\left(f^{-1}\right)'(0)$.`,
  R`$\dfrac{1}{3}$`,
  [R`$3$`, R`$\dfrac{1}{2}$`, R`$\dfrac{1}{4}$`, R`$1$`],
  R`Como $f(0)=0$, tem-se $f^{-1}(0)=0$. Derivando, $f'(x)=2+\cos x$, que em $x=0$ vale $3$. Logo $\left(f^{-1}\right)'(0)=\dfrac{1}{3}$.`,
  1 / 3,
  () => d1((y) => bissecao((x) => 2 * x + Math.sin(x) - y, -5, 5), 0, 1e-4)
);

q(
  "Função Inversa", "Teorema da função inversa com termo linear", "medio",
  R`Seja $f(x)=x^{3}+3x-2$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $\left(f^{-1}\right)'(2)$.`,
  R`$\dfrac{1}{6}$`,
  [R`$6$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{1}{12}$`],
  R`De $f(1)=1+3-2=2$ vem $f^{-1}(2)=1$. Como $f'(x)=3x^{2}+3$ vale $6$ em $x=1$, resulta $\left(f^{-1}\right)'(2)=\dfrac{1}{6}$.`,
  1 / 6,
  () => d1((y) => bissecao((x) => x ** 3 + 3 * x - 2 - y, -5, 5), 2, 1e-4)
);

q(
  "Função Inversa", "Teorema da função inversa com exponencial", "medio",
  R`Seja $f(x)=e^{x}+x$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $\left(f^{-1}\right)'(1)$.`,
  R`$\dfrac{1}{2}$`,
  [R`$2$`, R`$\dfrac{1}{e}$`, R`$\dfrac{1}{3}$`, R`$e$`],
  R`Como $f(0)=1+0=1$, tem-se $f^{-1}(1)=0$. Derivando, $f'(x)=e^{x}+1$, que em $x=0$ vale $2$. Logo $\left(f^{-1}\right)'(1)=\dfrac{1}{2}$.`,
  1 / 2,
  () => d1((y) => bissecao((x) => Math.exp(x) + x - y, -10, 5), 1, 1e-4)
);

q(
  "Função Inversa", "Teorema da função inversa com radical", "dificil",
  R`Seja $f(x)=\sqrt{x^{3}+1}$, bijetora de $\left[0,+\infty\right)$ em $\left[1,+\infty\right)$. Calcule $\left(f^{-1}\right)'(3)$.`,
  R`$\dfrac{1}{2}$`,
  [R`$2$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{1}{6}$`],
  R`De $f(2)=\sqrt{9}=3$ vem $f^{-1}(3)=2$. Derivando pela cadeia, $f'(x)=\dfrac{3x^{2}}{2\sqrt{x^{3}+1}}$, que em $x=2$ vale $\dfrac{12}{6}=2$. Portanto $\left(f^{-1}\right)'(3)=\dfrac{1}{2}$.`,
  1 / 2,
  () => d1((y) => bissecao((x) => Math.sqrt(x ** 3 + 1) - y, 0, 10), 3, 1e-4)
);

q(
  "Função Inversa", "Derivada segunda da função inversa", "dificil",
  R`Seja $f(x)=x^{3}+x$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $\left(f^{-1}\right)''(2)$.`,
  R`$-\dfrac{3}{32}$`,
  [R`$\dfrac{3}{32}$`, R`$-\dfrac{3}{16}$`, R`$-\dfrac{1}{32}$`, R`$-\dfrac{3}{64}$`],
  R`Derivando $\left(f^{-1}\right)'(y)=\dfrac{1}{f'\left(f^{-1}(y)\right)}$ mais uma vez, obtém-se $\left(f^{-1}\right)''(y)=-\dfrac{f''\left(f^{-1}(y)\right)}{\left[f'\left(f^{-1}(y)\right)\right]^{3}}$. Como $f(1)=2$, usa-se $x=1$: $f'(1)=4$ e $f''(1)=6$, logo $\left(f^{-1}\right)''(2)=-\dfrac{6}{64}=-\dfrac{3}{32}$.`,
  -3 / 32,
  () => d2((y) => bissecao((x) => x ** 3 + x - y, -5, 5), 2, 1e-3)
);

q(
  "Função Inversa", "Valor pontual da função inversa", "medio",
  R`Seja $f(x)=x^{3}+x-1$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $f^{-1}(9)$.`,
  R`$2$`,
  [R`$3$`, R`$1$`, R`$9$`, R`$4$`],
  R`Procura-se $x$ com $x^{3}+x-1=9$, isto é, $x^{3}+x-10=0$. Testando os divisores de $10$, $x=2$ dá $8+2-10=0$. Como $f$ é estritamente crescente ($f'=3x^{2}+1>0$), essa raiz é única e $f^{-1}(9)=2$.`,
  2,
  () => bissecao((x) => x ** 3 + x - 1 - 9, -5, 5)
);

q(
  "Função Inversa", "Inversa de uma função homográfica", "medio",
  R`Seja $f(x)=\dfrac{2x-1}{x+3}$, definida para $x\neq-3$. Calcule $f^{-1}(1)$.`,
  R`$4$`,
  [R`$2$`, R`$3$`, R`$-4$`, R`$\dfrac{1}{4}$`],
  R`Resolve-se $\dfrac{2x-1}{x+3}=1$, ou seja, $2x-1=x+3$, o que dá $x=4$. Alternativamente, isolando $x$ em $y=\dfrac{2x-1}{x+3}$ obtém-se $f^{-1}(y)=\dfrac{3y+1}{2-y}$, que em $y=1$ vale $4$.`,
  4,
  () => bissecao((x) => (2 * x - 1) / (x + 3) - 1, -2.9, 20)
);

// --- exponencial, logaritmo e potência com expoente real --------------------
q(
  "Função Inversa", "Derivada de x elevado a x", "dificil",
  R`Seja $f(x)=x^{x}$, definida para $x>0$. Calcule $f'(e)$.`,
  R`$2e^{e}$`,
  [R`$e^{e}$`, R`$e^{e+1}$`, R`$2e^{e-1}$`, R`$3e^{e}$`],
  R`Escreva $f(x)=e^{x\ln x}$. Pela cadeia, $f'(x)=x^{x}\left(\ln x+1\right)$. Em $x=e$: $\ln e+1=2$ e $f'(e)=2e^{e}$.`,
  2 * Math.E ** Math.E,
  () => d1((x) => Math.pow(x, x), Math.E)
);

q(
  "Função Inversa", "Mínimo de x elevado a x", "dificil",
  R`Determine o valor mínimo de $f(x)=x^{x}$ para $x>0$.`,
  R`$e^{-1/e}$`,
  [R`$e^{1/e}$`, R`$e^{-e}$`, R`$e^{-1}$`, R`$e^{-2/e}$`],
  R`Tomando logaritmo, $g(x)=\ln f(x)=x\ln x$, cuja derivada é $\ln x+1$: negativa para $x<\dfrac{1}{e}$ e positiva depois. O mínimo ocorre em $x=\dfrac{1}{e}$, onde $g=-\dfrac{1}{e}$ e $f=e^{-1/e}$. Como o logaritmo é crescente, minimizar $g$ é o mesmo que minimizar $f$.`,
  Math.pow(Math.E, -1 / Math.E),
  () => extremo((x) => Math.pow(x, x), 0.01, 3, "min").valor,
  { tol: 1e-3 }
);

q(
  "Função Inversa", "Derivação logarítmica com expoente irracional variável", "dificil",
  R`Seja $f(x)=x^{\sqrt{x}}$, definida para $x>0$. Calcule $f'(4)$.`,
  R`$8\ln 2+8$`,
  [R`$8\ln 2$`, R`$4\ln 2+8$`, R`$8\ln 2+4$`, R`$16\ln 2+8$`],
  R`Tomando logaritmo, $\ln f=\sqrt{x}\ln x$, e derivando, $\dfrac{f'}{f}=\dfrac{\ln x}{2\sqrt{x}}+\dfrac{\sqrt{x}}{x}=\dfrac{\ln x}{2\sqrt{x}}+\dfrac{1}{\sqrt{x}}$. Em $x=4$: $\dfrac{\ln 4}{4}+\dfrac{1}{2}=\dfrac{\ln 2}{2}+\dfrac{1}{2}$. Como $f(4)=4^{2}=16$, vem $f'(4)=16\left(\dfrac{\ln 2}{2}+\dfrac{1}{2}\right)=8\ln 2+8$.`,
  8 * Math.log(2) + 8,
  () => d1((x) => Math.pow(x, Math.sqrt(x)), 4)
);

q(
  "Função Inversa", "Derivação logarítmica com expoente trigonométrico", "dificil",
  R`Seja $f(x)=x^{\operatorname{sen}x}$, definida para $x>0$. Calcule $f'\left(\dfrac{\pi}{2}\right)$.`,
  R`$1$`,
  [R`$0$`, R`$\dfrac{\pi}{2}$`, R`$2$`, R`$\dfrac{2}{\pi}$`],
  R`De $\ln f=\operatorname{sen}x\ln x$ vem $\dfrac{f'}{f}=\cos x\ln x+\dfrac{\operatorname{sen}x}{x}$. Em $x=\dfrac{\pi}{2}$, $\cos x=0$ e $\operatorname{sen}x=1$, de modo que $\dfrac{f'}{f}=\dfrac{2}{\pi}$; como $f\left(\dfrac{\pi}{2}\right)=\dfrac{\pi}{2}$, resulta $f'=\dfrac{\pi}{2}\cdot\dfrac{2}{\pi}=1$.`,
  1,
  () => d1((x) => Math.pow(x, Math.sin(x)), Math.PI / 2)
);

q(
  "Função Inversa", "Derivada de uma potência com logaritmo no expoente", "dificil",
  R`Seja $f(x)=x^{\ln x}$, definida para $x>0$. Calcule $f'(e)$.`,
  R`$2$`,
  [R`$1$`, R`$e$`, R`$2e$`, R`$\dfrac{2}{e}$`],
  R`Como $f(x)=e^{\left(\ln x\right)^{2}}$, a cadeia dá $f'(x)=e^{\left(\ln x\right)^{2}}\cdot\dfrac{2\ln x}{x}$. Em $x=e$: $f(e)=e$ e $f'(e)=e\cdot\dfrac{2}{e}=2$.`,
  2,
  () => d1((x) => Math.pow(x, Math.log(x)), Math.E)
);

q(
  "Função Inversa", "Derivada do logaritmo de um argumento com radical", "medio",
  R`Seja $f(x)=\ln\left(x+\sqrt{x^{2}+1}\right)$. Calcule $f'(0)$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$\dfrac{1}{2}$`, R`$-1$`],
  R`Derivando pela cadeia, $f'(x)=\dfrac{1+\dfrac{x}{\sqrt{x^{2}+1}}}{x+\sqrt{x^{2}+1}}=\dfrac{1}{\sqrt{x^{2}+1}}$, depois de simplificar o numerador. Em $x=0$ isso vale $1$.`,
  1,
  () => d1((x) => Math.log(x + Math.sqrt(x * x + 1)), 0)
);

q(
  "Função Inversa", "Derivada do logaritmo de um quociente", "medio",
  R`Seja $f(x)=\ln\dfrac{1+x}{1-x}$, definida para $\left|x\right|<1$. Calcule $f'(0)$.`,
  R`$2$`,
  [R`$1$`, R`$0$`, R`$\dfrac{1}{2}$`, R`$-2$`],
  R`Separando o logaritmo, $f(x)=\ln(1+x)-\ln(1-x)$, de modo que $f'(x)=\dfrac{1}{1+x}+\dfrac{1}{1-x}=\dfrac{2}{1-x^{2}}$. Em $x=0$: $f'(0)=2$.`,
  2,
  () => d1((x) => Math.log((1 + x) / (1 - x)), 0)
);

q(
  "Função Inversa", "Produto de exponencial por logaritmo", "medio",
  R`Seja $f(x)=e^{x^{2}}\ln x$, definida para $x>0$. Calcule $f'(1)$.`,
  R`$e$`,
  [R`$2e$`, R`$\dfrac{e}{2}$`, R`$1$`, R`$e^{2}$`],
  R`Pela regra do produto, $f'(x)=2xe^{x^{2}}\ln x+\dfrac{e^{x^{2}}}{x}$. Em $x=1$, o logaritmo se anula e sobra $f'(1)=e$.`,
  Math.E,
  () => d1((x) => Math.exp(x * x) * Math.log(x), 1)
);

q(
  "Função Inversa", "Derivada de um logaritmo de base dois", "medio",
  R`Seja $f(x)=\log_{2}\left(x^{2}+1\right)$. Calcule $f'(1)$.`,
  R`$\dfrac{1}{\ln 2}$`,
  [R`$\dfrac{2}{\ln 2}$`, R`$\dfrac{1}{2\ln 2}$`, R`$\ln 2$`, R`$\dfrac{1}{\ln 4}$`],
  R`Pela mudança de base, $f(x)=\dfrac{\ln\left(x^{2}+1\right)}{\ln 2}$, logo $f'(x)=\dfrac{2x}{\left(x^{2}+1\right)\ln 2}$. Em $x=1$: $\dfrac{2}{2\ln 2}=\dfrac{1}{\ln 2}$.`,
  1 / Math.log(2),
  () => d1((x) => Math.log(x * x + 1) / Math.log(2), 1)
);

q(
  "Função Inversa", "Derivada de uma exponencial de base dois", "medio",
  R`Seja $f(x)=2^{x^{2}}$. Calcule $f'(1)$.`,
  R`$4\ln 2$`,
  [R`$2\ln 2$`, R`$\ln 2$`, R`$8\ln 2$`, R`$4\ln 4$`],
  R`Escrevendo $f(x)=e^{x^{2}\ln 2}$, a cadeia dá $f'(x)=2^{x^{2}}\ln 2\cdot2x$. Em $x=1$: $2\cdot\ln 2\cdot2=4\ln 2$.`,
  4 * Math.log(2),
  () => d1((x) => Math.pow(2, x * x), 1)
);

q(
  "Função Inversa", "Derivada de um logaritmo composto", "medio",
  R`Seja $f(x)=\ln\left(\ln x\right)$, definida para $x>1$. Calcule $f'(e)$.`,
  R`$\dfrac{1}{e}$`,
  [R`$e$`, R`$\dfrac{1}{e^{2}}$`, R`$\dfrac{2}{e}$`, R`$1$`],
  R`Pela cadeia, $f'(x)=\dfrac{1}{\ln x}\cdot\dfrac{1}{x}$. Em $x=e$, $\ln e=1$ e $f'(e)=\dfrac{1}{e}$.`,
  1 / Math.E,
  () => d1((x) => Math.log(Math.log(x)), Math.E)
);

q(
  "Função Inversa", "Derivada segunda do logaritmo do seno", "dificil",
  R`Seja $f(x)=\ln\left(\operatorname{sen}x\right)$, definida para $0<x<\pi$. Calcule $f''\left(\dfrac{\pi}{4}\right)$.`,
  R`$-2$`,
  [R`$2$`, R`$-1$`, R`$-\sqrt{2}$`, R`$-\dfrac{1}{2}$`],
  R`Pela cadeia, $f'(x)=\dfrac{\cos x}{\operatorname{sen}x}=\operatorname{cotg}x$, cuja derivada é $-\operatorname{cossec}^{2}x=-\dfrac{1}{\operatorname{sen}^{2}x}$. Em $x=\dfrac{\pi}{4}$, $\operatorname{sen}^{2}x=\dfrac{1}{2}$ e $f''=-2$.`,
  -2,
  () => d2((x) => Math.log(Math.sin(x)), Math.PI / 4, 1e-3)
);

q(
  "Função Inversa", "Derivada segunda de potência por logaritmo", "dificil",
  R`Seja $f(x)=x^{2}\ln x$, definida para $x>0$. Calcule $f''(e)$.`,
  R`$5$`,
  [R`$3$`, R`$4$`, R`$6$`, R`$2$`],
  R`Pela regra do produto, $f'(x)=2x\ln x+x$. Derivando de novo, $f''(x)=2\ln x+2+1=2\ln x+3$. Em $x=e$, $\ln e=1$ e $f''=5$ — repare que $f''$ não depende mais de $x$ a não ser pelo logaritmo.`,
  5,
  () => d2((x) => x * x * Math.log(x), Math.E, 1e-3)
);

q(
  "Função Inversa", "Máximo do logaritmo dividido pela variável", "dificil",
  R`Determine o valor máximo de $f(x)=\dfrac{\ln x}{x}$ para $x>0$.`,
  R`$\dfrac{1}{e}$`,
  [R`$e$`, R`$\dfrac{1}{e^{2}}$`, R`$\dfrac{2}{e}$`, R`$\dfrac{1}{2e}$`],
  R`Derivando pelo quociente, $f'(x)=\dfrac{1-\ln x}{x^{2}}$, positiva para $x<e$ e negativa para $x>e$. O máximo absoluto ocorre em $x=e$ e vale $\dfrac{\ln e}{e}=\dfrac{1}{e}$.`,
  1 / Math.E,
  () => extremo((x) => Math.log(x) / x, 0.1, 60, "max").valor,
  { tol: 1e-3 }
);

q(
  "Função Inversa", "Mínimo da exponencial dividida pela variável", "dificil",
  R`Determine o valor mínimo de $f(x)=\dfrac{e^{x}}{x}$ para $x>0$.`,
  R`$e$`,
  [R`$1$`, R`$e^{2}$`, R`$\dfrac{e}{2}$`, R`$2e$`],
  R`Pela regra do quociente, $f'(x)=\dfrac{e^{x}\left(x-1\right)}{x^{2}}$, negativa em $\left(0,1\right)$ e positiva em $\left(1,+\infty\right)$. O mínimo ocorre em $x=1$, com $f(1)=e$.`,
  Math.E,
  () => extremo((x) => Math.exp(x) / x, 0.05, 20, "min").valor,
  { tol: 1e-3 }
);

q(
  "Função Inversa", "Mínimo de uma soma de exponenciais", "medio",
  R`Determine o valor mínimo de $f(x)=e^{x}+e^{-x}$.`,
  R`$2$`,
  [R`$1$`, R`$e$`, R`$0$`, R`$4$`],
  R`De $f'(x)=e^{x}-e^{-x}=0$ vem $e^{2x}=1$, isto é, $x=0$. Como $f''(x)=e^{x}+e^{-x}>0$, trata-se de mínimo, e $f(0)=1+1=2$. O mesmo sai da desigualdade das médias, já que $e^{x}e^{-x}=1$.`,
  2,
  () => extremo((x) => Math.exp(x) + Math.exp(-x), -5, 5, "min").valor,
  { tol: 1e-3 }
);

q(
  "Função Inversa", "Ponto de máximo com fator exponencial decrescente", "medio",
  R`Determine a abscissa do ponto de máximo de $f(x)=xe^{-2x}$.`,
  R`$\dfrac{1}{2}$`,
  [R`$1$`, R`$2$`, R`$\dfrac{1}{4}$`, R`$\dfrac{1}{e}$`],
  R`Derivando pelo produto, $f'(x)=e^{-2x}\left(1-2x\right)$. Como $e^{-2x}>0$, o sinal de $f'$ é o de $1-2x$: positivo antes de $\dfrac{1}{2}$ e negativo depois. O máximo está em $x=\dfrac{1}{2}$.`,
  1 / 2,
  () => extremo((x) => x * Math.exp(-2 * x), -2, 20, "max").x,
  { tol: 1e-3 }
);

q(
  "Função Inversa", "Equação exponencial com bases relacionadas", "medio",
  R`Determine a solução real da equação $2^{x}=8^{x-1}$.`,
  R`$\dfrac{3}{2}$`,
  [R`$\dfrac{1}{2}$`, R`$3$`, R`$\dfrac{2}{3}$`, R`$\dfrac{5}{2}$`],
  R`Escreva $8=2^{3}$, de modo que $8^{x-1}=2^{3x-3}$. Como a exponencial de base $2$ é injetora, $x=3x-3$, isto é, $x=\dfrac{3}{2}$.`,
  3 / 2,
  () => bissecao((x) => Math.pow(2, x) - Math.pow(8, x - 1), 0, 5)
);

q(
  "Função Inversa", "Equação logarítmica com produto de argumentos", "medio",
  R`Determine a solução real da equação $\log_{3}x+\log_{3}\left(x-2\right)=1$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$5$`, R`$9$`],
  R`Somando os logaritmos, $\log_{3}\left[x\left(x-2\right)\right]=1$, isto é, $x^{2}-2x=3$. As raízes são $x=3$ e $x=-1$, mas o domínio exige $x>2$; sobra $x=3$.`,
  3,
  () => bissecao((x) => Math.log(x) / Math.log(3) + Math.log(x - 2) / Math.log(3) - 1, 2.01, 10)
);

q(
  "Função Inversa", "Equação exponencial redutível a quadrática", "dificil",
  R`Calcule a soma das raízes reais da equação $e^{2x}-3e^{x}+2=0$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$2\ln 2$`, R`$\ln 6$`, R`$\ln\dfrac{3}{2}$`],
  R`Com $u=e^{x}>0$, a equação vira $u^{2}-3u+2=0$, de raízes $u=1$ e $u=2$. Voltando, $e^{x}=1$ dá $x=0$ e $e^{x}=2$ dá $x=\ln 2$. A soma é $0+\ln 2=\ln 2$.`,
  Math.log(2),
  () => {
    const f = (x) => Math.exp(2 * x) - 3 * Math.exp(x) + 2;
    return bissecao(f, -1, 0.3) + bissecao(f, 0.3, 1);
  }
);

q(
  "Função Inversa", "Limite de x elevado a x na origem", "dificil",
  R`Calcule $\displaystyle\lim_{x\to0^{+}}x^{x}$.`,
  R`$1$`,
  [R`$0$`, R`$e$`, R`$\dfrac{1}{e}$`, R`$2$`],
  R`Tome logaritmo: $\ln\left(x^{x}\right)=x\ln x$, indeterminação $0\cdot\infty$. Escrevendo $x\ln x=\dfrac{\ln x}{1/x}$ e aplicando L'Hospital, obtém-se $\dfrac{1/x}{-1/x^{2}}=-x\to0$. Como a exponencial é contínua, o limite é $e^{0}=1$.`,
  1,
  () => limite((x) => Math.pow(x, x), 0, 1, 1e-3),
  { tol: 1e-3 }
);

q(
  "Função Inversa", "Limite exponencial com seno no lugar de x", "dificil",
  R`Calcule $\displaystyle\lim_{x\to0}\left(1+\operatorname{sen}x\right)^{1/x}$.`,
  R`$e$`,
  [R`$1$`, R`$e^{2}$`, R`$\dfrac{1}{e}$`, R`$e^{1/2}$`],
  R`Tomando logaritmo, $\dfrac{\ln\left(1+\operatorname{sen}x\right)}{x}$. Como $\ln(1+u)\sim u$ e $\operatorname{sen}x\sim x$, o quociente tende a $1$. Logo o limite é $e^{1}=e$.`,
  Math.E,
  () => limite((x) => Math.pow(1 + Math.sin(x), 1 / x), 0, 1),
  { tol: 1e-3 }
);

q(
  "Função Inversa", "Produto de x por diferença de logaritmos no infinito", "dificil",
  R`Calcule $\displaystyle\lim_{x\to+\infty}x\left[\ln\left(x+1\right)-\ln x\right]$.`,
  R`$1$`,
  [R`$0$`, R`$e$`, R`$2$`, R`$\dfrac{1}{2}$`],
  R`Junte os logaritmos: a expressão é $x\ln\left(1+\dfrac{1}{x}\right)$. Com $t=\dfrac{1}{x}\to0^{+}$, isso vira $\dfrac{\ln\left(1+t\right)}{t}\to1$. Equivalentemente, $\left(1+\frac{1}{x}\right)^{x}\to e$ e o logaritmo disso tende a $1$.`,
  1,
  () => limite((t) => Math.log(1 + t) / t, 0, 1)
);

q(
  "Função Inversa", "Derivada de uma potência de expoente irracional", "dificil",
  R`Seja $f(x)=x^{\pi}+\pi^{x}$, definida para $x>0$. Calcule $f'(1)$.`,
  R`$\pi+\pi\ln\pi$`,
  [R`$\pi\ln\pi$`, R`$1+\pi\ln\pi$`, R`$\pi+\ln\pi$`, R`$2\pi\ln\pi$`],
  R`As duas parcelas têm regras diferentes: $x^{\pi}$ é potência de expoente constante, com derivada $\pi x^{\pi-1}$; já $\pi^{x}$ é exponencial de base constante, com derivada $\pi^{x}\ln\pi$. Em $x=1$: $\pi\cdot1+\pi\ln\pi$.`,
  Math.PI + Math.PI * Math.log(Math.PI),
  () => d1((x) => Math.pow(x, Math.PI) + Math.pow(Math.PI, x), 1)
);

// --- inversas trigonométricas -----------------------------------------------
q(
  "Função Inversa", "Derivada do arco-seno com argumento escalado", "medio",
  R`Seja $f(x)=\operatorname{arcsen}\dfrac{x}{2}$. Calcule $f'(1)$.`,
  R`$\dfrac{\sqrt{3}}{3}$`,
  [R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{2\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{3}}{6}$`, R`$\dfrac{\sqrt{2}}{2}$`],
  R`Pela cadeia, $f'(x)=\dfrac{1/2}{\sqrt{1-\dfrac{x^{2}}{4}}}$. Em $x=1$, o radicando vale $\dfrac{3}{4}$ e $f'(1)=\dfrac{1/2}{\sqrt{3}/2}=\dfrac{1}{\sqrt{3}}=\dfrac{\sqrt{3}}{3}$.`,
  Math.sqrt(3) / 3,
  () => d1((x) => Math.asin(x / 2), 1)
);

q(
  "Função Inversa", "Derivada segunda do arco-tangente de um quadrado", "dificil",
  R`Seja $f(x)=\operatorname{arctg}\left(x^{2}\right)$. Calcule $f''(1)$.`,
  R`$-1$`,
  [R`$1$`, R`$-\dfrac{1}{2}$`, R`$-2$`, R`$\dfrac{1}{2}$`],
  R`Pela cadeia, $f'(x)=\dfrac{2x}{1+x^{4}}$. Derivando pelo quociente, $f''(x)=\dfrac{2\left(1+x^{4}\right)-2x\cdot4x^{3}}{\left(1+x^{4}\right)^{2}}=\dfrac{2-6x^{4}}{\left(1+x^{4}\right)^{2}}$. Em $x=1$: $\dfrac{2-6}{4}=-1$.`,
  -1,
  () => d2((x) => Math.atan(x * x), 1, 1e-3)
);

q(
  "Função Inversa", "Derivada do arco-seno de um radical", "dificil",
  R`Seja $f(x)=\operatorname{arcsen}\sqrt{x}$, definida para $0<x<1$. Calcule $f'\left(\dfrac{1}{4}\right)$.`,
  R`$\dfrac{2\sqrt{3}}{3}$`,
  [R`$\dfrac{\sqrt{3}}{3}$`, R`$\dfrac{4\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{\sqrt{3}}{6}$`],
  R`Pela cadeia, $f'(x)=\dfrac{1}{\sqrt{1-x}}\cdot\dfrac{1}{2\sqrt{x}}$. Em $x=\dfrac{1}{4}$: $\dfrac{1}{\sqrt{3}/2}\cdot\dfrac{1}{2\cdot\frac{1}{2}}=\dfrac{2}{\sqrt{3}}=\dfrac{2\sqrt{3}}{3}$.`,
  (2 * Math.sqrt(3)) / 3,
  () => d1((x) => Math.asin(Math.sqrt(x)), 0.25)
);

q(
  "Função Inversa", "Produto de x pelo arco-tangente", "medio",
  R`Seja $f(x)=x\operatorname{arctg}x$. Calcule $f'(1)$.`,
  R`$\dfrac{\pi}{4}+\dfrac{1}{2}$`,
  [R`$\dfrac{\pi}{4}-\dfrac{1}{2}$`, R`$\dfrac{\pi}{2}+\dfrac{1}{2}$`, R`$\dfrac{\pi}{4}+1$`, R`$\dfrac{\pi}{2}-\dfrac{1}{2}$`],
  R`Pela regra do produto, $f'(x)=\operatorname{arctg}x+\dfrac{x}{1+x^{2}}$. Em $x=1$: $\dfrac{\pi}{4}+\dfrac{1}{2}$.`,
  Math.PI / 4 + 0.5,
  () => d1((x) => x * Math.atan(x), 1)
);

q(
  "Função Inversa", "Soma do arco-tangente com o do inverso", "dificil",
  R`Seja $f(x)=\operatorname{arctg}x+\operatorname{arctg}\dfrac{1}{x}$, definida para $x>0$. Calcule $f(3)$.`,
  R`$\dfrac{\pi}{2}$`,
  [R`$\dfrac{\pi}{4}$`, R`$\pi$`, R`$\dfrac{3\pi}{4}$`, R`$\dfrac{\pi}{3}$`],
  R`Derivando, $f'(x)=\dfrac{1}{1+x^{2}}+\dfrac{-1/x^{2}}{1+1/x^{2}}=\dfrac{1}{1+x^{2}}-\dfrac{1}{1+x^{2}}=0$, logo $f$ é constante em $\left(0,+\infty\right)$. Avaliando em $x=1$: $\dfrac{\pi}{4}+\dfrac{\pi}{4}=\dfrac{\pi}{2}$. Esse é o valor em $x=3$ também.`,
  Math.PI / 2,
  () => Math.atan(3) + Math.atan(1 / 3)
);

q(
  "Função Inversa", "Derivada da soma do arco-seno com o arco-cosseno", "medio",
  R`Seja $f(x)=\operatorname{arcsen}x+\operatorname{arccos}x$, definida para $\left|x\right|<1$. Calcule $f'\left(\dfrac{3}{10}\right)$.`,
  R`$0$`,
  [R`$1$`, R`$2$`, R`$-1$`, R`$\dfrac{1}{2}$`],
  R`As derivadas são $\dfrac{1}{\sqrt{1-x^{2}}}$ e $-\dfrac{1}{\sqrt{1-x^{2}}}$, que se cancelam em todo o intervalo. Assim $f'\equiv0$ — de fato $f(x)=\dfrac{\pi}{2}$ é constante, e o ponto $\dfrac{3}{10}$ não tem nada de especial.`,
  0,
  () => d1((x) => Math.asin(x) + Math.acos(x), 0.3)
);

q(
  "Função Inversa", "Derivada do arco-cosseno com argumento afim", "dificil",
  R`Seja $f(x)=\operatorname{arccos}\left(1-2x\right)$, definida para $0<x<1$. Calcule $f'\left(\dfrac{1}{2}\right)$.`,
  R`$2$`,
  [R`$1$`, R`$-2$`, R`$4$`, R`$\dfrac{1}{2}$`],
  R`Pela cadeia, $f'(x)=\dfrac{-\left(-2\right)}{\sqrt{1-\left(1-2x\right)^{2}}}=\dfrac{2}{\sqrt{1-\left(1-2x\right)^{2}}}$. Em $x=\dfrac{1}{2}$ o argumento $1-2x$ se anula, o radical vale $1$ e $f'=2$.`,
  2,
  () => d1((x) => Math.acos(1 - 2 * x), 0.5)
);

q(
  "Função Inversa", "Arco-tangente de uma exponencial", "medio",
  R`Seja $f(x)=\operatorname{arctg}\left(e^{x}\right)$. Calcule $f'(0)$.`,
  R`$\dfrac{1}{2}$`,
  [R`$1$`, R`$\dfrac{1}{4}$`, R`$2$`, R`$\dfrac{1}{e}$`],
  R`Pela cadeia, $f'(x)=\dfrac{e^{x}}{1+e^{2x}}$. Em $x=0$: $\dfrac{1}{1+1}=\dfrac{1}{2}$.`,
  1 / 2,
  () => d1((x) => Math.atan(Math.exp(x)), 0)
);

q(
  "Função Inversa", "Quadrado do arco-seno", "dificil",
  R`Seja $f(x)=\left(\operatorname{arcsen}x\right)^{2}$. Calcule $f'\left(\dfrac{1}{2}\right)$.`,
  R`$\dfrac{2\pi\sqrt{3}}{9}$`,
  [R`$\dfrac{\pi\sqrt{3}}{9}$`, R`$\dfrac{4\pi\sqrt{3}}{9}$`, R`$\dfrac{2\pi\sqrt{3}}{3}$`, R`$\dfrac{\pi\sqrt{3}}{6}$`],
  R`Pela cadeia, $f'(x)=\dfrac{2\operatorname{arcsen}x}{\sqrt{1-x^{2}}}$. Em $x=\dfrac{1}{2}$: $\operatorname{arcsen}\dfrac{1}{2}=\dfrac{\pi}{6}$ e $\sqrt{1-\frac{1}{4}}=\dfrac{\sqrt{3}}{2}$, logo $f'=\dfrac{2\cdot\frac{\pi}{6}}{\frac{\sqrt{3}}{2}}=\dfrac{2\pi}{3\sqrt{3}}=\dfrac{2\pi\sqrt{3}}{9}$.`,
  (2 * Math.PI * Math.sqrt(3)) / 9,
  () => d1((x) => Math.asin(x) ** 2, 0.5)
);

q(
  "Função Inversa", "Derivada segunda do arco-tangente", "medio",
  R`Seja $f(x)=\operatorname{arctg}x$. Calcule $f''(1)$.`,
  R`$-\dfrac{1}{2}$`,
  [R`$\dfrac{1}{2}$`, R`$-\dfrac{1}{4}$`, R`$-1$`, R`$-\dfrac{1}{8}$`],
  R`De $f'(x)=\dfrac{1}{1+x^{2}}$ vem, pela cadeia, $f''(x)=-\dfrac{2x}{\left(1+x^{2}\right)^{2}}$. Em $x=1$: $-\dfrac{2}{4}=-\dfrac{1}{2}$.`,
  -1 / 2,
  () => d2((x) => Math.atan(x), 1, 1e-3)
);

// ===========================================================================
// INTEGRAL INDEFINIDA — 43
// ===========================================================================

// --- integração por substituição --------------------------------------------
q(
  "Integral Indefinida", "Substituição com radical de um polinômio", "medio",
  R`Calcule $\displaystyle\int_{0}^{4}x\sqrt{x^{2}+9}\,dx$.`,
  R`$\dfrac{98}{3}$`,
  [R`$\dfrac{49}{3}$`, R`$\dfrac{125}{3}$`, R`$\dfrac{98}{9}$`, R`$\dfrac{196}{3}$`],
  R`Com $u=x^{2}+9$ tem-se $du=2x\,dx$, e a integral vira $\dfrac{1}{2}\displaystyle\int_{9}^{25}\sqrt{u}\,du=\dfrac{1}{3}\left[u^{3/2}\right]_{9}^{25}=\dfrac{125-27}{3}=\dfrac{98}{3}$.`,
  98 / 3,
  () => simpson((x) => x * Math.sqrt(x * x + 9), 0, 4)
);

q(
  "Integral Indefinida", "Substituição que produz logaritmo", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x}{x^{2}+1}\,dx$.`,
  R`$\dfrac{\ln 2}{2}$`,
  // "ln 4 / 4" seria idêntico à resposta (= ln 2 / 2) — trocado por ln 3 / 2.
  [R`$\ln 2$`, R`$\dfrac{\ln 2}{4}$`, R`$2\ln 2$`, R`$\dfrac{\ln 3}{2}$`],
  R`Com $u=x^{2}+1$ e $du=2x\,dx$, a integral vale $\dfrac{1}{2}\displaystyle\int_{1}^{2}\dfrac{du}{u}=\dfrac{1}{2}\left[\ln u\right]_{1}^{2}=\dfrac{\ln 2}{2}$.`,
  Math.log(2) / 2,
  () => simpson((x) => x / (x * x + 1), 0, 1)
);

q(
  "Integral Indefinida", "Substituição com potência de seno", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{3}x\cos x\,dx$.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{1}{8}$`, R`$\dfrac{3}{4}$`],
  R`Com $u=\operatorname{sen}x$ e $du=\cos x\,dx$, a integral vira $\displaystyle\int_{0}^{1}u^{3}du=\left[\dfrac{u^{4}}{4}\right]_{0}^{1}=\dfrac{1}{4}$.`,
  1 / 4,
  () => simpson((x) => Math.sin(x) ** 3 * Math.cos(x), 0, Math.PI / 2)
);

q(
  "Integral Indefinida", "Numerador que é a derivada do denominador", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{2x+1}{x^{2}+x+1}\,dx$.`,
  R`$\ln 3$`,
  [R`$\ln 2$`, R`$\dfrac{\ln 3}{2}$`, R`$2\ln 3$`, R`$\ln 6$`],
  R`O numerador é exatamente a derivada do denominador, então a primitiva é $\ln\left|x^{2}+x+1\right|$. Avaliando, $\ln 3-\ln 1=\ln 3$.`,
  Math.log(3),
  () => simpson((x) => (2 * x + 1) / (x * x + x + 1), 0, 1)
);

q(
  "Integral Indefinida", "Substituição com exponencial de argumento quadrático", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}xe^{x^{2}}\,dx$.`,
  R`$\dfrac{e-1}{2}$`,
  [R`$e-1$`, R`$\dfrac{e}{2}$`, R`$\dfrac{e+1}{2}$`, R`$\dfrac{e-1}{4}$`],
  R`Com $u=x^{2}$ e $du=2x\,dx$, a integral vale $\dfrac{1}{2}\displaystyle\int_{0}^{1}e^{u}du=\dfrac{e-1}{2}$.`,
  (Math.E - 1) / 2,
  () => simpson((x) => x * Math.exp(x * x), 0, 1)
);

q(
  "Integral Indefinida", "Substituição com logaritmo no denominador", "dificil",
  R`Calcule $\displaystyle\int_{e}^{e^{2}}\dfrac{dx}{x\ln x}$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$2\ln 2$`, R`$1$`, R`$\dfrac{\ln 2}{2}$`],
  R`Com $u=\ln x$ e $du=\dfrac{dx}{x}$, os limites passam a $1$ e $2$, e a integral vira $\displaystyle\int_{1}^{2}\dfrac{du}{u}=\ln 2$.`,
  Math.log(2),
  () => simpson((x) => 1 / (x * Math.log(x)), Math.E, Math.E ** 2)
);

q(
  "Integral Indefinida", "Integral da tangente", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/3}\operatorname{tg}x\,dx$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$\dfrac{\ln 2}{2}$`, R`$\ln\dfrac{1}{2}$`, R`$2\ln 2$`],
  R`Escreva $\operatorname{tg}x=\dfrac{\operatorname{sen}x}{\cos x}$ e use $u=\cos x$, $du=-\operatorname{sen}x\,dx$: a primitiva é $-\ln\left|\cos x\right|$. Avaliando, $-\ln\dfrac{1}{2}+\ln 1=\ln 2$.`,
  Math.log(2),
  () => simpson(Math.tan, 0, Math.PI / 3)
);

q(
  "Integral Indefinida", "Substituição linear com secante ao quadrado", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/12}\sec^{2}\left(3x\right)dx$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{6}$`, R`$1$`, R`$3$`, R`$\dfrac{2}{3}$`],
  R`Com $u=3x$ e $du=3\,dx$, a integral vira $\dfrac{1}{3}\displaystyle\int_{0}^{\pi/4}\sec^{2}u\,du=\dfrac{1}{3}\left[\operatorname{tg}u\right]_{0}^{\pi/4}=\dfrac{1}{3}$.`,
  1 / 3,
  () => simpson((x) => 1 / Math.cos(3 * x) ** 2, 0, Math.PI / 12)
);

q(
  "Integral Indefinida", "Primitiva que é o arco-seno", "medio",
  R`Calcule $\displaystyle\int_{0}^{1/2}\dfrac{dx}{\sqrt{1-x^{2}}}$.`,
  R`$\dfrac{\pi}{6}$`,
  [R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{12}$`],
  R`A primitiva é $\operatorname{arcsen}x$, de modo que a integral vale $\operatorname{arcsen}\dfrac{1}{2}-\operatorname{arcsen}0=\dfrac{\pi}{6}$.`,
  Math.PI / 6,
  () => simpson((x) => 1 / Math.sqrt(1 - x * x), 0, 0.5)
);

q(
  "Integral Indefinida", "Primitiva que é o arco-tangente", "medio",
  R`Calcule $\displaystyle\int_{0}^{\sqrt{3}}\dfrac{dx}{1+x^{2}}$.`,
  R`$\dfrac{\pi}{3}$`,
  [R`$\dfrac{\pi}{6}$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{2\pi}{3}$`],
  R`A primitiva é $\operatorname{arctg}x$, logo a integral vale $\operatorname{arctg}\sqrt{3}-\operatorname{arctg}0=\dfrac{\pi}{3}$.`,
  Math.PI / 3,
  () => simpson((x) => 1 / (1 + x * x), 0, Math.sqrt(3))
);

q(
  "Integral Indefinida", "Potência de logaritmo dividida pela variável", "medio",
  R`Calcule $\displaystyle\int_{1}^{e}\dfrac{\left(\ln x\right)^{2}}{x}\,dx$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{2}$`, R`$1$`, R`$\dfrac{2}{3}$`, R`$\dfrac{1}{6}$`],
  R`Com $u=\ln x$ e $du=\dfrac{dx}{x}$, os limites viram $0$ e $1$, e a integral é $\displaystyle\int_{0}^{1}u^{2}du=\dfrac{1}{3}$.`,
  1 / 3,
  () => simpson((x) => Math.log(x) ** 2 / x, 1, Math.E)
);

q(
  "Integral Indefinida", "Substituição com cubo sob o radical", "dificil",
  R`Calcule $\displaystyle\int_{0}^{2}x^{2}\sqrt{x^{3}+1}\,dx$.`,
  R`$\dfrac{52}{9}$`,
  [R`$\dfrac{26}{9}$`, R`$\dfrac{52}{3}$`, R`$\dfrac{104}{9}$`, R`$\dfrac{27}{9}$`],
  R`Com $u=x^{3}+1$ e $du=3x^{2}dx$, a integral vira $\dfrac{1}{3}\displaystyle\int_{1}^{9}\sqrt{u}\,du=\dfrac{2}{9}\left[u^{3/2}\right]_{1}^{9}=\dfrac{2}{9}\left(27-1\right)=\dfrac{52}{9}$.`,
  52 / 9,
  () => simpson((x) => x * x * Math.sqrt(x ** 3 + 1), 0, 2)
);

q(
  "Integral Indefinida", "Substituição que leva ao arco-tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\dfrac{\cos x}{1+\operatorname{sen}^{2}x}\,dx$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{6}$`, R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{8}$`],
  R`Com $u=\operatorname{sen}x$ e $du=\cos x\,dx$, a integral vira $\displaystyle\int_{0}^{1}\dfrac{du}{1+u^{2}}=\operatorname{arctg}1-\operatorname{arctg}0=\dfrac{\pi}{4}$.`,
  Math.PI / 4,
  () => simpson((x) => Math.cos(x) / (1 + Math.sin(x) ** 2), 0, Math.PI / 2)
);

q(
  "Integral Indefinida", "Exponencial sobre um mais exponencial", "medio",
  R`Calcule $\displaystyle\int_{0}^{\ln 3}\dfrac{e^{x}}{1+e^{x}}\,dx$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$\ln 4$`, R`$\dfrac{\ln 3}{2}$`, R`$\ln\dfrac{3}{2}$`],
  R`Com $u=1+e^{x}$ e $du=e^{x}dx$, os limites passam a $2$ e $4$, e a integral vira $\displaystyle\int_{2}^{4}\dfrac{du}{u}=\ln 4-\ln 2=\ln 2$.`,
  Math.log(2),
  () => simpson((x) => Math.exp(x) / (1 + Math.exp(x)), 0, Math.log(3))
);

q(
  "Integral Indefinida", "Substituição com radical no denominador", "dificil",
  R`Calcule $\displaystyle\int_{0}^{3}\dfrac{x}{\sqrt{x+1}}\,dx$.`,
  R`$\dfrac{8}{3}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{16}{3}$`, R`$\dfrac{10}{3}$`, R`$\dfrac{14}{3}$`],
  R`Com $u=x+1$, tem-se $x=u-1$ e $dx=du$, e a integral vira $\displaystyle\int_{1}^{4}\dfrac{u-1}{\sqrt{u}}\,du=\displaystyle\int_{1}^{4}\left(u^{1/2}-u^{-1/2}\right)du=\left[\dfrac{2}{3}u^{3/2}-2u^{1/2}\right]_{1}^{4}=\left(\dfrac{16}{3}-4\right)-\left(\dfrac{2}{3}-2\right)=\dfrac{8}{3}$.`,
  8 / 3,
  () => simpson((x) => x / Math.sqrt(x + 1), 0, 3)
);

q(
  "Integral Indefinida", "Substituição com raiz quadrada da variável", "dificil",
  R`Calcule $\displaystyle\int_{1}^{3}\dfrac{dx}{\sqrt{x}\left(1+x\right)}$.`,
  R`$\dfrac{\pi}{6}$`,
  [R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{12}$`, R`$\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{2}$`],
  R`Com $u=\sqrt{x}$, tem-se $du=\dfrac{dx}{2\sqrt{x}}$ e a integral vira $2\displaystyle\int_{1}^{\sqrt{3}}\dfrac{du}{1+u^{2}}=2\left[\operatorname{arctg}u\right]_{1}^{\sqrt{3}}=2\left(\dfrac{\pi}{3}-\dfrac{\pi}{4}\right)=\dfrac{\pi}{6}$.`,
  Math.PI / 6,
  () => simpson((x) => 1 / (Math.sqrt(x) * (1 + x)), 1, 3)
);

q(
  "Integral Indefinida", "Seno de raiz sobre raiz", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi^{2}/4}\dfrac{\operatorname{sen}\sqrt{x}}{\sqrt{x}}\,dx$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$\pi$`, R`$\dfrac{\pi}{2}$`],
  R`Com $u=\sqrt{x}$ e $du=\dfrac{dx}{2\sqrt{x}}$, a integral vira $2\displaystyle\int_{0}^{\pi/2}\operatorname{sen}u\,du=2\left[-\cos u\right]_{0}^{\pi/2}=2\left(0+1\right)=2$.`,
  2,
  () => simpson((x) => Math.sin(Math.sqrt(x)) / Math.sqrt(x), 1e-12, Math.PI ** 2 / 4, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Indefinida", "Substituição com quarta potência no denominador", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x}{x^{4}+1}\,dx$.`,
  R`$\dfrac{\pi}{8}$`,
  [R`$\dfrac{\pi}{4}$`, R`$\dfrac{\pi}{16}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{6}$`],
  R`Com $u=x^{2}$ e $du=2x\,dx$, a integral vira $\dfrac{1}{2}\displaystyle\int_{0}^{1}\dfrac{du}{1+u^{2}}=\dfrac{1}{2}\cdot\dfrac{\pi}{4}=\dfrac{\pi}{8}$.`,
  Math.PI / 8,
  () => simpson((x) => x / (x ** 4 + 1), 0, 1)
);

q(
  "Integral Indefinida", "Secante ao quadrado vezes tangente", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/4}\sec^{2}x\operatorname{tg}x\,dx$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{4}$`, R`$1$`, R`$\dfrac{1}{3}$`, R`$\dfrac{3}{2}$`],
  R`Com $u=\operatorname{tg}x$ e $du=\sec^{2}x\,dx$, a integral vira $\displaystyle\int_{0}^{1}u\,du=\dfrac{1}{2}$.`,
  1 / 2,
  () => simpson((x) => Math.tan(x) / Math.cos(x) ** 2, 0, Math.PI / 4)
);

q(
  "Integral Indefinida", "Soma de potências de expoente fracionário", "medio",
  R`Calcule $\displaystyle\int_{1}^{4}\left(\sqrt{x}+\dfrac{1}{\sqrt{x}}\right)dx$.`,
  R`$\dfrac{20}{3}$`,
  [R`$\dfrac{14}{3}$`, R`$\dfrac{16}{3}$`, R`$\dfrac{22}{3}$`, R`$\dfrac{26}{3}$`],
  R`As primitivas são $\dfrac{2}{3}x^{3/2}$ e $2x^{1/2}$. Avaliando, $\left(\dfrac{16}{3}+4\right)-\left(\dfrac{2}{3}+2\right)=\dfrac{14}{3}+2=\dfrac{20}{3}$.`,
  20 / 3,
  () => simpson((x) => Math.sqrt(x) + 1 / Math.sqrt(x), 1, 4)
);

q(
  "Integral Indefinida", "Potência de um binômio linear", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\left(3x-1\right)^{2}dx$.`,
  R`$1$`,
  [R`$\dfrac{1}{3}$`, R`$3$`, R`$\dfrac{2}{3}$`, R`$\dfrac{4}{3}$`],
  R`Com $u=3x-1$ e $du=3\,dx$, a integral vira $\dfrac{1}{3}\displaystyle\int_{-1}^{2}u^{2}du=\dfrac{1}{9}\left[u^{3}\right]_{-1}^{2}=\dfrac{8+1}{9}=1$.`,
  1,
  () => simpson((x) => (3 * x - 1) ** 2, 0, 1)
);

q(
  "Integral Indefinida", "Cosseno de argumento múltiplo", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/9}\cos\left(3x\right)dx$.`,
  R`$\dfrac{\sqrt{3}}{6}$`,
  [R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{3}}{12}$`, R`$\dfrac{\sqrt{2}}{6}$`],
  R`A primitiva é $\dfrac{\operatorname{sen}(3x)}{3}$. Avaliando, $\dfrac{\operatorname{sen}\frac{\pi}{3}}{3}=\dfrac{\sqrt{3}/2}{3}=\dfrac{\sqrt{3}}{6}$.`,
  Math.sqrt(3) / 6,
  () => simpson((x) => Math.cos(3 * x), 0, Math.PI / 9)
);

q(
  "Integral Indefinida", "Substituição com radical de soma de quadrados", "medio",
  R`Calcule $\displaystyle\int_{0}^{2}\dfrac{x}{\sqrt{x^{2}+5}}\,dx$.`,
  R`$3-\sqrt{5}$`,
  [R`$\sqrt{5}-3$`, R`$3-2\sqrt{5}$`, R`$9-\sqrt{5}$`, R`$\dfrac{3-\sqrt{5}}{2}$`],
  R`Com $u=x^{2}+5$ e $du=2x\,dx$, a integral vira $\dfrac{1}{2}\displaystyle\int_{5}^{9}u^{-1/2}du=\left[\sqrt{u}\right]_{5}^{9}=3-\sqrt{5}$.`,
  3 - Math.sqrt(5),
  () => simpson((x) => x / Math.sqrt(x * x + 5), 0, 2)
);

q(
  "Integral Indefinida", "Substituição com quadrado no denominador", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{2x}{\left(1+x^{2}\right)^{2}}\,dx$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{4}$`, R`$1$`, R`$\dfrac{3}{4}$`, R`$\dfrac{1}{3}$`],
  R`Com $u=1+x^{2}$ e $du=2x\,dx$, a integral vira $\displaystyle\int_{1}^{2}\dfrac{du}{u^{2}}=\left[-\dfrac{1}{u}\right]_{1}^{2}=-\dfrac{1}{2}+1=\dfrac{1}{2}$.`,
  1 / 2,
  () => simpson((x) => (2 * x) / (1 + x * x) ** 2, 0, 1)
);

q(
  "Integral Indefinida", "Quadrado dividido pelo cubo mais um", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x^{2}}{x^{3}+1}\,dx$.`,
  R`$\dfrac{\ln 2}{3}$`,
  [R`$\dfrac{\ln 2}{2}$`, R`$\ln 2$`, R`$\dfrac{\ln 3}{3}$`, R`$\dfrac{\ln 2}{6}$`],
  R`Com $u=x^{3}+1$ e $du=3x^{2}dx$, a integral vira $\dfrac{1}{3}\displaystyle\int_{1}^{2}\dfrac{du}{u}=\dfrac{\ln 2}{3}$.`,
  Math.log(2) / 3,
  () => simpson((x) => (x * x) / (x ** 3 + 1), 0, 1)
);

// --- Teorema Fundamental do Cálculo ----------------------------------------
q(
  "Integral Indefinida", "TFC com limite superior quadrático", "dificil",
  R`Seja $F(x)=\displaystyle\int_{0}^{x^{2}}\sqrt{1+t^{3}}\,dt$. Calcule $F'(1)$.`,
  R`$2\sqrt{2}$`,
  [R`$\sqrt{2}$`, R`$4\sqrt{2}$`, R`$2$`, R`$\dfrac{\sqrt{2}}{2}$`],
  R`Pelo Teorema Fundamental combinado com a regra da cadeia, $F'(x)=\sqrt{1+\left(x^{2}\right)^{3}}\cdot2x=2x\sqrt{1+x^{6}}$. Em $x=1$: $2\sqrt{2}$. Esquecer o fator $2x$ é o erro clássico.`,
  2 * Math.SQRT2,
  () => d1((x) => simpson((t) => Math.sqrt(1 + t ** 3), 0, x * x, 2000), 1, 1e-4)
);

q(
  "Integral Indefinida", "TFC com os dois limites variáveis", "dificil",
  R`Seja $F(x)=\displaystyle\int_{x}^{x^{2}}\dfrac{dt}{t}$, definida para $x>1$. Calcule $F'(2)$.`,
  R`$\dfrac{1}{2}$`,
  [R`$1$`, R`$\dfrac{1}{4}$`, R`$2$`, R`$\dfrac{3}{2}$`],
  R`Pelo Teorema Fundamental, $F'(x)=\dfrac{1}{x^{2}}\cdot2x-\dfrac{1}{x}=\dfrac{2}{x}-\dfrac{1}{x}=\dfrac{1}{x}$. Em $x=2$: $\dfrac{1}{2}$. (De fato $F(x)=\ln x^{2}-\ln x=\ln x$.)`,
  1 / 2,
  () => d1((x) => simpson((t) => 1 / t, x, x * x, 2000), 2, 1e-4)
);

q(
  "Integral Indefinida", "TFC com limite superior trigonométrico", "dificil",
  R`Seja $F(x)=\displaystyle\int_{1}^{\operatorname{sen}x}e^{t^{2}}dt$. Calcule $F'\left(\dfrac{\pi}{3}\right)$.`,
  R`$\dfrac{e^{3/4}}{2}$`,
  [R`$e^{3/4}$`, R`$\dfrac{e^{3/4}}{4}$`, R`$\dfrac{e^{1/4}}{2}$`, R`$\dfrac{\sqrt{3}e^{3/4}}{2}$`],
  R`Pelo Teorema Fundamental com a cadeia, $F'(x)=e^{\operatorname{sen}^{2}x}\cos x$. Em $x=\dfrac{\pi}{3}$: $\operatorname{sen}^{2}x=\dfrac{3}{4}$ e $\cos x=\dfrac{1}{2}$, logo $F'=\dfrac{e^{3/4}}{2}$. Note que a primitiva de $e^{t^{2}}$ não é elementar — e nem precisa ser.`,
  Math.exp(0.75) / 2,
  () => d1((x) => simpson((t) => Math.exp(t * t), 1, Math.sin(x), 2000), Math.PI / 3, 1e-4)
);

q(
  "Integral Indefinida", "Mínimo de uma função definida por integral", "dificil",
  R`Seja $F(x)=\displaystyle\int_{0}^{x}\left(t^{2}-4\right)dt$. Determine o valor mínimo de $F$ em $\left[0,4\right]$.`,
  R`$-\dfrac{16}{3}$`,
  [R`$-\dfrac{8}{3}$`, R`$-\dfrac{32}{3}$`, R`$-\dfrac{16}{9}$`, R`$-\dfrac{4}{3}$`],
  R`Pelo TFC, $F'(x)=x^{2}-4$, negativa em $\left(0,2\right)$ e positiva em $\left(2,4\right)$: o mínimo está em $x=2$. Calculando, $F(2)=\dfrac{8}{3}-8=-\dfrac{16}{3}$.`,
  -16 / 3,
  () => extremo((x) => simpson((t) => t * t - 4, 0, x, 2000), 0, 4, "min").valor,
  { tol: 1e-3 }
);

q(
  "Integral Indefinida", "Derivada segunda de uma função definida por integral", "dificil",
  R`Seja $F(x)=\displaystyle\int_{0}^{x}\sqrt{4+t^{2}}\,dt$. Calcule $F''(2)$.`,
  R`$\dfrac{\sqrt{2}}{2}$`,
  [R`$\sqrt{2}$`, R`$\dfrac{\sqrt{2}}{4}$`, R`$2\sqrt{2}$`, R`$\dfrac{\sqrt{2}}{8}$`],
  R`Pelo TFC, $F'(x)=\sqrt{4+x^{2}}$, e derivando de novo, $F''(x)=\dfrac{x}{\sqrt{4+x^{2}}}$. Em $x=2$: $\dfrac{2}{\sqrt{8}}=\dfrac{2}{2\sqrt{2}}=\dfrac{\sqrt{2}}{2}$.`,
  Math.SQRT2 / 2,
  () => d2((x) => simpson((t) => Math.sqrt(4 + t * t), 0, x, 4000), 2, 1e-3)
);

q(
  "Integral Indefinida", "TFC com limites variáveis e integrando trigonométrico", "dificil",
  R`Seja $F(x)=\displaystyle\int_{x}^{x^{3}}\operatorname{sen}\left(t^{2}\right)dt$. Calcule $F'(1)$.`,
  R`$2\operatorname{sen}1$`,
  [R`$\operatorname{sen}1$`, R`$3\operatorname{sen}1$`, R`$4\operatorname{sen}1$`, R`$-2\operatorname{sen}1$`],
  R`Pelo Teorema Fundamental, $F'(x)=\operatorname{sen}\left(x^{6}\right)\cdot3x^{2}-\operatorname{sen}\left(x^{2}\right)$. Em $x=1$: $3\operatorname{sen}1-\operatorname{sen}1=2\operatorname{sen}1$.`,
  2 * Math.sin(1),
  () => d1((x) => simpson((t) => Math.sin(t * t), x, x ** 3, 4000), 1, 1e-4)
);

q(
  "Integral Indefinida", "Limite com integral no numerador", "dificil",
  R`Calcule $\displaystyle\lim_{x\to0}\dfrac{1}{x^{3}}\int_{0}^{x}\dfrac{t^{2}}{1+t}\,dt$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{2}$`, R`$1$`, R`$\dfrac{1}{6}$`, R`$\dfrac{2}{3}$`],
  R`É uma indeterminação $\dfrac{0}{0}$. Por L'Hospital, derivando numerador (pelo TFC) e denominador, obtém-se $\dfrac{\dfrac{x^{2}}{1+x}}{3x^{2}}=\dfrac{1}{3\left(1+x\right)}\to\dfrac{1}{3}$.`,
  1 / 3,
  () => limite((x) => simpson((t) => (t * t) / (1 + t), 0, x, 2000) / x ** 3, 0, 1)
);

// --- teorema do valor médio para integrais ----------------------------------
q(
  "Integral Indefinida", "Ponto médio integral de uma parábola", "medio",
  R`Seja $f(x)=x^{2}$ em $\left[0,3\right]$. Determine o valor de $c$ dado pelo Teorema do Valor Médio para integrais.`,
  R`$\sqrt{3}$`,
  [R`$\dfrac{3}{2}$`, R`$2\sqrt{3}$`, R`$\dfrac{\sqrt{3}}{2}$`, R`$\sqrt{6}$`],
  R`O valor médio é $\dfrac{1}{3}\displaystyle\int_{0}^{3}x^{2}dx=\dfrac{1}{3}\cdot9=3$. Procura-se $c\in\left(0,3\right)$ com $c^{2}=3$, isto é, $c=\sqrt{3}$.`,
  Math.sqrt(3),
  () => {
    const media = simpson((x) => x * x, 0, 3) / 3;
    return bissecao((c) => c * c - media, 0, 3);
  }
);

q(
  "Integral Indefinida", "Valor médio do seno num semiperíodo", "medio",
  R`Determine o valor médio de $f(x)=\operatorname{sen}x$ no intervalo $\left[0,\pi\right]$.`,
  R`$\dfrac{2}{\pi}$`,
  [R`$\dfrac{1}{\pi}$`, R`$\dfrac{4}{\pi}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{2}{\pi^{2}}$`],
  R`O valor médio é $\dfrac{1}{\pi}\displaystyle\int_{0}^{\pi}\operatorname{sen}x\,dx=\dfrac{1}{\pi}\left[-\cos x\right]_{0}^{\pi}=\dfrac{2}{\pi}$.`,
  2 / Math.PI,
  () => simpson(Math.sin, 0, Math.PI) / Math.PI
);

q(
  "Integral Indefinida", "Ponto médio integral da raiz quadrada", "dificil",
  R`Seja $f(x)=\sqrt{x}$ em $\left[0,4\right]$. Determine o valor de $c$ dado pelo Teorema do Valor Médio para integrais.`,
  R`$\dfrac{16}{9}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{9}{4}$`, R`$\dfrac{8}{9}$`, R`$\dfrac{16}{3}$`],
  R`O valor médio vale $\dfrac{1}{4}\displaystyle\int_{0}^{4}\sqrt{x}\,dx=\dfrac{1}{4}\cdot\dfrac{16}{3}=\dfrac{4}{3}$. De $\sqrt{c}=\dfrac{4}{3}$ vem $c=\dfrac{16}{9}$ — repare que $c$ não é o ponto médio do intervalo.`,
  16 / 9,
  () => {
    const media = simpson(Math.sqrt, 0, 4) / 4;
    return bissecao((c) => Math.sqrt(c) - media, 0, 4);
  },
  { tol: 1e-3 }
);

q(
  "Integral Indefinida", "Valor médio da função inverso", "medio",
  R`Determine o valor médio de $f(x)=\dfrac{1}{x}$ no intervalo $\left[1,e\right]$.`,
  R`$\dfrac{1}{e-1}$`,
  [R`$\dfrac{1}{e}$`, R`$\dfrac{e}{e-1}$`, R`$\dfrac{1}{e+1}$`, R`$e-1$`],
  R`O valor médio é $\dfrac{1}{e-1}\displaystyle\int_{1}^{e}\dfrac{dx}{x}=\dfrac{\ln e-\ln 1}{e-1}=\dfrac{1}{e-1}$.`,
  1 / (Math.E - 1),
  () => simpson((x) => 1 / x, 1, Math.E) / (Math.E - 1)
);

// --- primitivas com condição inicial e propriedades -------------------------
q(
  "Integral Indefinida", "Primitiva com condição inicial num polinômio", "medio",
  R`Seja $f$ tal que $f'(x)=3x^{2}-2x$ e $f(1)=4$. Calcule $f(2)$.`,
  R`$8$`,
  [R`$6$`, R`$10$`, R`$12$`, R`$4$`],
  R`Integrando, $f(x)=x^{3}-x^{2}+C$. De $f(1)=1-1+C=4$ vem $C=4$, logo $f(x)=x^{3}-x^{2}+4$ e $f(2)=8-4+4=8$.`,
  8,
  () => 4 + simpson((x) => 3 * x * x - 2 * x, 1, 2)
);

q(
  "Integral Indefinida", "Primitiva de segunda ordem com duas condições", "dificil",
  R`Seja $f$ tal que $f''(x)=6x$, $f'(0)=1$ e $f(0)=2$. Calcule $f(2)$.`,
  R`$12$`,
  [R`$8$`, R`$10$`, R`$14$`, R`$16$`],
  R`Integrando uma vez, $f'(x)=3x^{2}+C_{1}$, e $f'(0)=1$ dá $C_{1}=1$. Integrando de novo, $f(x)=x^{3}+x+C_{2}$, e $f(0)=2$ dá $C_{2}=2$. Então $f(2)=8+2+2=12$.`,
  12,
  () => 2 + simpson((x) => 1 + simpson((s) => 6 * s, 0, x, 500), 0, 2, 2000),
  { tol: 1e-3 }
);

q(
  "Integral Indefinida", "Primitiva de uma exponencial com condição inicial", "medio",
  R`Seja $f$ tal que $f'(x)=e^{2x}$ e $f(0)=1$. Calcule $f\left(\dfrac{1}{2}\right)$.`,
  R`$\dfrac{e+1}{2}$`,
  [R`$\dfrac{e-1}{2}$`, R`$\dfrac{e}{2}$`, R`$\dfrac{e+2}{2}$`, R`$e+1$`],
  R`Integrando, $f(x)=\dfrac{e^{2x}}{2}+C$, e $f(0)=\dfrac{1}{2}+C=1$ dá $C=\dfrac{1}{2}$. Então $f\left(\dfrac{1}{2}\right)=\dfrac{e}{2}+\dfrac{1}{2}=\dfrac{e+1}{2}$.`,
  (Math.E + 1) / 2,
  () => 1 + simpson((x) => Math.exp(2 * x), 0, 0.5)
);

q(
  "Integral Indefinida", "Primitiva do inverso com condição inicial", "medio",
  R`Seja $f$ tal que $f'(x)=\dfrac{1}{x}$ para $x>0$ e $f(1)=0$. Calcule $f\left(e^{2}\right)$.`,
  R`$2$`,
  [R`$1$`, R`$e$`, R`$e^{2}$`, R`$4$`],
  R`Integrando, $f(x)=\ln x+C$, e $f(1)=0$ dá $C=0$. Logo $f\left(e^{2}\right)=\ln e^{2}=2$.`,
  2,
  () => simpson((x) => 1 / x, 1, Math.E ** 2, 200000),
  { tol: 1e-3 }
);

q(
  "Integral Indefinida", "Aditividade do intervalo de integração", "medio",
  R`Sabendo que $\displaystyle\int_{0}^{3}f(x)\,dx=5$ e $\displaystyle\int_{0}^{1}f(x)\,dx=2$, calcule $\displaystyle\int_{1}^{3}f(x)\,dx$.`,
  R`$3$`,
  [R`$7$`, R`$-3$`, R`$\dfrac{5}{2}$`, R`$10$`],
  R`Pela aditividade em relação ao intervalo, $\displaystyle\int_{0}^{3}=\displaystyle\int_{0}^{1}+\displaystyle\int_{1}^{3}$. Logo $\displaystyle\int_{1}^{3}f=5-2=3$.`,
  3,
  () => {
    // reta que satisfaz exatamente as duas integrais dadas
    const f = (x) => 13 / 6 - x / 3;
    return simpson(f, 1, 3);
  }
);

q(
  "Integral Indefinida", "Linearidade da integral definida", "medio",
  R`Sabendo que $\displaystyle\int_{0}^{2}f(x)\,dx=4$, calcule $\displaystyle\int_{0}^{2}\left[3f(x)-2\right]dx$.`,
  R`$8$`,
  [R`$12$`, R`$10$`, R`$4$`, R`$6$`],
  R`Pela linearidade, $\displaystyle\int_{0}^{2}\left[3f-2\right]=3\displaystyle\int_{0}^{2}f-\displaystyle\int_{0}^{2}2\,dx=3\cdot4-2\cdot2=12-4=8$. O segundo termo é a área do retângulo de base $2$ e altura $2$.`,
  8,
  () => simpson((x) => 3 * (2 * x) - 2, 0, 2)
);

q(
  "Integral Indefinida", "Paridade do integrando num intervalo simétrico", "medio",
  R`Calcule $\displaystyle\int_{-2}^{2}\left(x^{3}+3x^{2}\right)dx$.`,
  R`$16$`,
  [R`$8$`, R`$32$`, R`$0$`, R`$24$`],
  R`A parcela $x^{3}$ é ímpar e sua integral no intervalo simétrico é nula. Já $3x^{2}$ é par, então $\displaystyle\int_{-2}^{2}3x^{2}dx=2\displaystyle\int_{0}^{2}3x^{2}dx=2\cdot8=16$.`,
  16,
  () => simpson((x) => x ** 3 + 3 * x * x, -2, 2)
);

finalizar("calculo1_lote7.json", 20260914);
