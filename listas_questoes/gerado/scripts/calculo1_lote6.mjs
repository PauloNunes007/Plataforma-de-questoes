// Lote 6 de Cálculo I — 75 questões: Cálculo das Derivadas (39) e Aplicações
// da Derivada (36). Segunda parte da equalização do banco (ver o cabeçalho de
// `calculo1_lote5.mjs` e o kit compartilhado `calculo1_kit.mjs`).
//
// Calibragem: nível Guidorizzi vol. 1 / Stewart, P1–P2 de federal. Zero questão
// `facil`; derivação implícita sempre pedindo o valor num ponto (não a fórmula
// genérica), ordem superior com padrão a reconhecer, e em Aplicações a divisão
// clássica taxas relacionadas / otimização / TVM-Rolle / L'Hospital / análise
// de concavidade.
//
// Exponencial e logaritmo aparecem em "Aplicações da Derivada" (a regra de
// L'Hospital está na ementa desse tópico) mas NÃO em "Cálculo das Derivadas",
// que na ordem curricular vem antes de funções inversas.
//
// Rode: node listas_questoes/gerado/scripts/calculo1_lote6.mjs
import { R, q, finalizar, d1, d2, d3, d4, limite, bissecao, extremo } from "./calculo1_kit.mjs";

// ===========================================================================
// CÁLCULO DAS DERIVADAS — 39
// ===========================================================================

// --- regras de derivação combinadas ----------------------------------------
q(
  "Cálculo das Derivadas", "Produto de potências com regra da cadeia", "dificil",
  R`Seja $f(x)=\left(x^{2}+1\right)^{3}\left(2x-1\right)^{4}$. Calcule $f'(1)$.`,
  R`$88$`,
  [R`$24$`, R`$64$`, R`$48$`, R`$96$`],
  R`Derivando pelo produto, com a cadeia em cada fator: $f'(x)=3\left(x^{2}+1\right)^{2}\cdot2x\cdot\left(2x-1\right)^{4}+\left(x^{2}+1\right)^{3}\cdot4\left(2x-1\right)^{3}\cdot2$. Em $x=1$: $3\cdot4\cdot2\cdot1+8\cdot4\cdot1\cdot2=24+64=88$.`,
  88,
  () => d1((x) => (x * x + 1) ** 3 * (2 * x - 1) ** 4, 1)
);

q(
  "Cálculo das Derivadas", "Produto de quatro fatores lineares", "medio",
  R`Seja $f(x)=x\left(x-1\right)\left(x-2\right)\left(x-3\right)$. Calcule $f'(0)$.`,
  R`$-6$`,
  [R`$6$`, R`$-3$`, R`$0$`, R`$-12$`],
  R`Em vez de expandir, use a regra do produto: $f'$ é a soma de quatro parcelas, cada uma obtida derivando um fator e mantendo os outros três. Em $x=0$, toda parcela que conserve o fator $x$ se anula; sobra apenas a que deriva o próprio $x$: $\left(0-1\right)\left(0-2\right)\left(0-3\right)=-6$.`,
  -6,
  () => d1((x) => x * (x - 1) * (x - 2) * (x - 3), 0)
);

q(
  "Cálculo das Derivadas", "Quociente com fatoração no numerador", "medio",
  R`Seja $f(x)=\dfrac{x^{2}-1}{x^{2}+1}$. Calcule $f'(2)$.`,
  R`$\dfrac{8}{25}$`,
  [R`$\dfrac{4}{25}$`, R`$\dfrac{2}{5}$`, R`$\dfrac{12}{25}$`, R`$\dfrac{3}{25}$`],
  R`Pela regra do quociente, $f'(x)=\dfrac{2x\left(x^{2}+1\right)-\left(x^{2}-1\right)2x}{\left(x^{2}+1\right)^{2}}=\dfrac{4x}{\left(x^{2}+1\right)^{2}}$. Em $x=2$, isso vale $\dfrac{8}{25}$.`,
  8 / 25,
  () => d1((x) => (x * x - 1) / (x * x + 1), 2)
);

q(
  "Cálculo das Derivadas", "Quociente com radical no numerador e no denominador", "dificil",
  R`Seja $f(x)=\dfrac{1+\sqrt{x}}{1-\sqrt{x}}$. Calcule $f'(4)$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{4}$`, R`$-\dfrac{1}{2}$`, R`$\dfrac{3}{4}$`, R`$-\dfrac{1}{4}$`],
  R`Escreva $u=\sqrt{x}$, de modo que $f=\dfrac{1+u}{1-u}$ e $\dfrac{df}{du}=\dfrac{\left(1-u\right)+\left(1+u\right)}{\left(1-u\right)^{2}}=\dfrac{2}{\left(1-u\right)^{2}}$. Em $x=4$ tem-se $u=2$ e $\dfrac{df}{du}=2$; como $\dfrac{du}{dx}=\dfrac{1}{2\sqrt{x}}=\dfrac{1}{4}$, a cadeia dá $f'(4)=2\cdot\dfrac{1}{4}=\dfrac{1}{2}$.`,
  1 / 2,
  () => d1((x) => (1 + Math.sqrt(x)) / (1 - Math.sqrt(x)), 4)
);

q(
  "Cálculo das Derivadas", "Produto de potência por radical", "medio",
  R`Seja $f(x)=x^{2}\sqrt{2x+5}$. Calcule $f'(2)$.`,
  R`$\dfrac{40}{3}$`,
  [R`$\dfrac{28}{3}$`, R`$\dfrac{44}{3}$`, R`$\dfrac{38}{3}$`, R`$\dfrac{52}{3}$`],
  R`Pela regra do produto com a cadeia no radical, $f'(x)=2x\sqrt{2x+5}+x^{2}\cdot\dfrac{2}{2\sqrt{2x+5}}=2x\sqrt{2x+5}+\dfrac{x^{2}}{\sqrt{2x+5}}$. Em $x=2$, $\sqrt{9}=3$ e $f'(2)=4\cdot3+\dfrac{4}{3}=\dfrac{40}{3}$.`,
  40 / 3,
  () => d1((x) => x * x * Math.sqrt(2 * x + 5), 2)
);

q(
  "Cálculo das Derivadas", "Produto de radical por quadrado perfeito", "medio",
  R`Seja $f(x)=\sqrt{x}\left(x-2\right)^{2}$. Calcule $f'(4)$.`,
  R`$9$`,
  [R`$5$`, R`$7$`, R`$11$`, R`$13$`],
  R`Pela regra do produto, $f'(x)=\dfrac{\left(x-2\right)^{2}}{2\sqrt{x}}+2\sqrt{x}\left(x-2\right)$. Em $x=4$: $\dfrac{4}{4}+2\cdot2\cdot2=1+8=9$.`,
  9,
  () => d1((x) => Math.sqrt(x) * (x - 2) ** 2, 4)
);

q(
  "Cálculo das Derivadas", "Cadeia com quociente elevado à quarta", "dificil",
  R`Seja $f(x)=\left(\dfrac{2x-1}{x+3}\right)^{4}$. Calcule $f'(1)$.`,
  R`$\dfrac{7}{256}$`,
  [R`$\dfrac{7}{64}$`, R`$\dfrac{7}{512}$`, R`$\dfrac{1}{64}$`, R`$\dfrac{21}{256}$`],
  R`Com $u=\dfrac{2x-1}{x+3}$, a regra do quociente dá $u'=\dfrac{2\left(x+3\right)-\left(2x-1\right)}{\left(x+3\right)^{2}}=\dfrac{7}{\left(x+3\right)^{2}}$, que em $x=1$ vale $\dfrac{7}{16}$; e $u(1)=\dfrac{1}{4}$. Pela cadeia, $f'=4u^{3}u'=4\cdot\dfrac{1}{64}\cdot\dfrac{7}{16}=\dfrac{7}{256}$.`,
  7 / 256,
  () => d1((x) => ((2 * x - 1) / (x + 3)) ** 4, 1)
);

q(
  "Cálculo das Derivadas", "Cadeia com radical de trinômio", "medio",
  R`Seja $f(x)=\sqrt{x^{2}+3x}$. Calcule $f'(1)$.`,
  R`$\dfrac{5}{4}$`,
  [R`$\dfrac{5}{2}$`, R`$\dfrac{3}{4}$`, R`$\dfrac{5}{8}$`, R`$\dfrac{1}{4}$`],
  R`Pela regra da cadeia, $f'(x)=\dfrac{2x+3}{2\sqrt{x^{2}+3x}}$. Em $x=1$, o radicando vale $4$ e $f'(1)=\dfrac{5}{2\cdot2}=\dfrac{5}{4}$.`,
  5 / 4,
  () => d1((x) => Math.sqrt(x * x + 3 * x), 1)
);

q(
  "Cálculo das Derivadas", "Quociente com radical no denominador", "medio",
  R`Seja $f(x)=\dfrac{x}{\sqrt{x^{2}+1}}$. Calcule $f'(1)$.`,
  R`$\dfrac{\sqrt{2}}{4}$`,
  [R`$\dfrac{\sqrt{2}}{2}$`, R`$\dfrac{\sqrt{2}}{8}$`, R`$\dfrac{3\sqrt{2}}{4}$`, R`$\dfrac{\sqrt{2}}{16}$`],
  R`Derivando pelo quociente e simplificando, $f'(x)=\dfrac{\sqrt{x^{2}+1}-x\cdot\dfrac{x}{\sqrt{x^{2}+1}}}{x^{2}+1}=\dfrac{1}{\left(x^{2}+1\right)^{3/2}}$. Em $x=1$: $\dfrac{1}{2\sqrt{2}}=\dfrac{\sqrt{2}}{4}$.`,
  Math.SQRT2 / 4,
  () => d1((x) => x / Math.sqrt(x * x + 1), 1)
);

q(
  "Cálculo das Derivadas", "Potência com expoente racional e produto", "medio",
  R`Seja $f(x)=x^{2/3}\left(x-5\right)$. Calcule $f'(8)$.`,
  R`$5$`,
  [R`$3$`, R`$4$`, R`$6$`, R`$8$`],
  R`Pela regra do produto, $f'(x)=\dfrac{2}{3}x^{-1/3}\left(x-5\right)+x^{2/3}$. Em $x=8$, $x^{-1/3}=\dfrac{1}{2}$ e $x^{2/3}=4$, logo $f'(8)=\dfrac{2}{3}\cdot\dfrac{1}{2}\cdot3+4=1+4=5$.`,
  5,
  () => d1((x) => Math.cbrt(x) ** 2 * (x - 5), 8)
);

q(
  "Cálculo das Derivadas", "Expoente racional dentro de expoente racional", "dificil",
  R`Seja $f(x)=\left(x^{3/2}+1\right)^{2/3}$. Calcule $f'(1)$.`,
  R`$\dfrac{\sqrt[3]{4}}{2}$`,
  [R`$\dfrac{\sqrt[3]{2}}{2}$`, R`$\dfrac{\sqrt[3]{4}}{4}$`, R`$\dfrac{\sqrt[3]{2}}{4}$`, R`$\dfrac{\sqrt[3]{4}}{3}$`],
  R`Com $u=x^{3/2}+1$, tem-se $u(1)=2$ e $u'(1)=\dfrac{3}{2}\sqrt{x}\big|_{x=1}=\dfrac{3}{2}$. Pela cadeia, $f'=\dfrac{2}{3}u^{-1/3}u'=\dfrac{2}{3}\cdot2^{-1/3}\cdot\dfrac{3}{2}=2^{-1/3}=\dfrac{2^{2/3}}{2}=\dfrac{\sqrt[3]{4}}{2}$.`,
  Math.pow(2, -1 / 3),
  () => d1((x) => Math.pow(Math.pow(x, 1.5) + 1, 2 / 3), 1)
);

// --- trigonométricas --------------------------------------------------------
q(
  "Cálculo das Derivadas", "Quociente trigonométrico que simplifica", "medio",
  R`Seja $f(x)=\dfrac{\operatorname{sen}x}{1+\cos x}$. Calcule $f'\left(\dfrac{\pi}{3}\right)$.`,
  R`$\dfrac{2}{3}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{3}{2}$`, R`$\dfrac{4}{3}$`, R`$\dfrac{1}{2}$`],
  R`Pela regra do quociente, $f'(x)=\dfrac{\cos x\left(1+\cos x\right)+\operatorname{sen}^{2}x}{\left(1+\cos x\right)^{2}}=\dfrac{\cos x+1}{\left(1+\cos x\right)^{2}}=\dfrac{1}{1+\cos x}$, usando $\operatorname{sen}^{2}+\cos^{2}=1$. Em $x=\dfrac{\pi}{3}$, $\cos x=\dfrac{1}{2}$ e $f'=\dfrac{1}{3/2}=\dfrac{2}{3}$.`,
  2 / 3,
  () => d1((x) => Math.sin(x) / (1 + Math.cos(x)), Math.PI / 3)
);

q(
  "Cálculo das Derivadas", "Derivada da secante num ponto notável", "medio",
  R`Seja $f(x)=\sec x$. Calcule $f'\left(\dfrac{\pi}{4}\right)$.`,
  R`$\sqrt{2}$`,
  [R`$\dfrac{\sqrt{2}}{2}$`, R`$2\sqrt{2}$`, R`$\dfrac{\sqrt{2}}{4}$`, R`$\dfrac{3\sqrt{2}}{2}$`],
  R`Como $\sec x=\left(\cos x\right)^{-1}$, a cadeia dá $f'(x)=\dfrac{\operatorname{sen}x}{\cos^{2}x}=\sec x\operatorname{tg}x$. Em $x=\dfrac{\pi}{4}$: $\sec\dfrac{\pi}{4}=\sqrt{2}$ e $\operatorname{tg}\dfrac{\pi}{4}=1$, logo $f'=\sqrt{2}$.`,
  Math.SQRT2,
  () => d1((x) => 1 / Math.cos(x), Math.PI / 4)
);

q(
  "Cálculo das Derivadas", "Quadrado de seno de argumento múltiplo", "medio",
  R`Seja $f(x)=\operatorname{sen}^{2}\left(3x\right)$. Calcule $f'\left(\dfrac{\pi}{12}\right)$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$6$`, R`$9$`],
  R`Aplicando a cadeia duas vezes, $f'(x)=2\operatorname{sen}(3x)\cos(3x)\cdot3=3\operatorname{sen}(6x)$. Em $x=\dfrac{\pi}{12}$, $\operatorname{sen}\dfrac{\pi}{2}=1$ e $f'=3$.`,
  3,
  () => d1((x) => Math.sin(3 * x) ** 2, Math.PI / 12)
);

q(
  "Cálculo das Derivadas", "Potência de tangente", "medio",
  R`Seja $f(x)=\operatorname{tg}^{3}x$. Calcule $f'\left(\dfrac{\pi}{4}\right)$.`,
  R`$6$`,
  [R`$3$`, R`$4$`, R`$9$`, R`$12$`],
  R`Pela cadeia, $f'(x)=3\operatorname{tg}^{2}x\sec^{2}x$. Em $x=\dfrac{\pi}{4}$, $\operatorname{tg}x=1$ e $\sec^{2}x=2$, logo $f'=3\cdot1\cdot2=6$.`,
  6,
  () => d1((x) => Math.tan(x) ** 3, Math.PI / 4)
);

q(
  "Cálculo das Derivadas", "Cadeia tripla com seno e cosseno", "dificil",
  R`Seja $f(x)=\operatorname{sen}\left(\cos 3x\right)$. Calcule $f'\left(\dfrac{\pi}{6}\right)$.`,
  R`$-3$`,
  [R`$3$`, R`$-1$`, R`$0$`, R`$-6$`],
  R`Pela cadeia, $f'(x)=\cos\left(\cos 3x\right)\cdot\left(-\operatorname{sen}3x\right)\cdot3$. Em $x=\dfrac{\pi}{6}$ tem-se $3x=\dfrac{\pi}{2}$, logo $\cos 3x=0$, $\operatorname{sen}3x=1$ e $f'=\cos(0)\cdot(-1)\cdot3=-3$.`,
  -3,
  () => d1((x) => Math.sin(Math.cos(3 * x)), Math.PI / 6)
);

q(
  "Cálculo das Derivadas", "Produto de três fatores com trigonométricas", "dificil",
  R`Seja $f(x)=x^{2}\operatorname{sen}x\cos x$. Calcule $f'\left(\dfrac{\pi}{4}\right)$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{8}$`, R`$\dfrac{\pi^{2}}{8}$`, R`$\dfrac{\pi}{16}$`],
  R`Use $\operatorname{sen}x\cos x=\dfrac{\operatorname{sen}2x}{2}$, de modo que $f(x)=\dfrac{x^{2}\operatorname{sen}2x}{2}$ e $f'(x)=x\operatorname{sen}2x+x^{2}\cos 2x$. Em $x=\dfrac{\pi}{4}$: $\operatorname{sen}\dfrac{\pi}{2}=1$ e $\cos\dfrac{\pi}{2}=0$, logo $f'=\dfrac{\pi}{4}$.`,
  Math.PI / 4,
  () => d1((x) => x * x * Math.sin(x) * Math.cos(x), Math.PI / 4)
);

// --- derivação implícita ----------------------------------------------------
q(
  "Cálculo das Derivadas", "Derivação implícita no fólio de Descartes", "dificil",
  R`A curva $x^{3}+y^{3}=6xy$ passa pelo ponto $\left(3,3\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-1$`,
  [R`$1$`, R`$-2$`, R`$-\dfrac{1}{2}$`, R`$2$`],
  R`Derivando implicitamente, $3x^{2}+3y^{2}y'=6y+6xy'$, donde $y'=\dfrac{6y-3x^{2}}{3y^{2}-6x}=\dfrac{2y-x^{2}}{y^{2}-2x}$. Em $\left(3,3\right)$: $\dfrac{6-9}{9-6}=-1$ — a tangente ao fólio nesse ponto faz $45^{\circ}$ com os eixos.`,
  -1,
  () => {
    const y = (x) => bissecao((t) => x ** 3 + t ** 3 - 6 * x * t, 2.5, 4);
    return d1(y, 3, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita numa cônica com termo misto", "dificil",
  R`A curva $x^{2}+xy+y^{2}=7$ passa pelo ponto $\left(1,2\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-\dfrac{4}{5}$`,
  [R`$-\dfrac{5}{4}$`, R`$\dfrac{4}{5}$`, R`$-\dfrac{2}{5}$`, R`$-\dfrac{3}{5}$`],
  R`Derivando implicitamente, $2x+y+xy'+2yy'=0$, isto é, $y'=-\dfrac{2x+y}{x+2y}$. Em $\left(1,2\right)$: $-\dfrac{4}{5}$.`,
  -4 / 5,
  () => {
    const y = (x) => bissecao((t) => x * x + x * t + t * t - 7, 1, 3);
    return d1(y, 1, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita com soma de radicais", "medio",
  R`A curva $\sqrt{x}+\sqrt{y}=4$ passa pelo ponto $\left(1,9\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-3$`,
  [R`$3$`, R`$-\dfrac{1}{3}$`, R`$-9$`, R`$\dfrac{1}{3}$`],
  R`Derivando, $\dfrac{1}{2\sqrt{x}}+\dfrac{y'}{2\sqrt{y}}=0$, logo $y'=-\dfrac{\sqrt{y}}{\sqrt{x}}$. Em $\left(1,9\right)$: $-\dfrac{3}{1}=-3$.`,
  -3,
  () => {
    const y = (x) => bissecao((t) => Math.sqrt(x) + Math.sqrt(t) - 4, 4, 16);
    return d1(y, 1, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita com cúbica e termo misto", "dificil",
  R`A curva $y^{3}+3xy=14$ passa pelo ponto $\left(1,2\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-\dfrac{2}{5}$`,
  [R`$-\dfrac{5}{2}$`, R`$\dfrac{2}{5}$`, R`$-\dfrac{1}{5}$`, R`$-\dfrac{3}{5}$`],
  R`Derivando implicitamente, $3y^{2}y'+3y+3xy'=0$, ou seja, $y'=-\dfrac{y}{y^{2}+x}$. Em $\left(1,2\right)$: $-\dfrac{2}{5}$.`,
  -2 / 5,
  () => {
    const y = (x) => bissecao((t) => t ** 3 + 3 * x * t - 14, 1, 3);
    return d1(y, 1, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita com dois termos mistos", "dificil",
  R`A curva $x^{2}y+xy^{2}=6$ passa pelo ponto $\left(1,2\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-\dfrac{8}{5}$`,
  [R`$-\dfrac{5}{8}$`, R`$\dfrac{8}{5}$`, R`$-\dfrac{4}{5}$`, R`$-\dfrac{6}{5}$`],
  R`Derivando os dois produtos, $2xy+x^{2}y'+y^{2}+2xyy'=0$. Em $\left(1,2\right)$: $4+y'+4+4y'=0$, logo $5y'=-8$ e $y'=-\dfrac{8}{5}$.`,
  -8 / 5,
  () => {
    const y = (x) => bissecao((t) => x * x * t + x * t * t - 6, 1, 3);
    return d1(y, 1, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita numa soma de cubos", "medio",
  R`A curva $x^{3}+y^{3}=9$ passa pelo ponto $\left(1,2\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-\dfrac{1}{4}$`,
  [R`$-4$`, R`$\dfrac{1}{4}$`, R`$-\dfrac{1}{2}$`, R`$-\dfrac{1}{8}$`],
  R`Derivando, $3x^{2}+3y^{2}y'=0$, donde $y'=-\dfrac{x^{2}}{y^{2}}$. Em $\left(1,2\right)$: $-\dfrac{1}{4}$.`,
  -1 / 4,
  () => {
    const y = (x) => bissecao((t) => x ** 3 + t ** 3 - 9, 1, 3);
    return d1(y, 1, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita na astroide", "dificil",
  R`A curva $x^{2/3}+y^{2/3}=5$ passa pelo ponto $\left(8,1\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-\dfrac{1}{2}$`,
  [R`$-2$`, R`$\dfrac{1}{2}$`, R`$-\dfrac{1}{4}$`, R`$-\dfrac{1}{8}$`],
  R`Derivando, $\dfrac{2}{3}x^{-1/3}+\dfrac{2}{3}y^{-1/3}y'=0$, isto é, $y'=-\left(\dfrac{y}{x}\right)^{1/3}$. Em $\left(8,1\right)$: $-\sqrt[3]{\dfrac{1}{8}}=-\dfrac{1}{2}$.`,
  -1 / 2,
  () => {
    const y = (x) => bissecao((t) => Math.cbrt(x) ** 2 + Math.cbrt(t) ** 2 - 5, 0.2, 3);
    return d1(y, 8, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita com funções trigonométricas", "dificil",
  R`A curva $x\cos y+y\cos x=1$ passa pelo ponto $\left(0,1\right)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-\cos 1$`,
  [R`$\cos 1$`, R`$-\operatorname{sen}1$`, R`$\operatorname{sen}1$`, R`$-\cos 2$`],
  R`Derivando os dois produtos, $\cos y-x\operatorname{sen}y\cdot y'+y'\cos x-y\operatorname{sen}x=0$. Em $\left(0,1\right)$, os termos com $x$ e com $\operatorname{sen}x$ somem: $\cos 1+y'=0$, logo $y'=-\cos 1$.`,
  -Math.cos(1),
  () => {
    const y = (x) => bissecao((t) => x * Math.cos(t) + t * Math.cos(x) - 1, 0, 2);
    return d1(y, 0, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivação implícita com seno de um produto", "dificil",
  R`A curva $x+\operatorname{sen}\left(xy\right)=y$ passa pela origem. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$1$`,
  [R`$0$`, R`$-1$`, R`$2$`, R`$\dfrac{1}{2}$`],
  R`Derivando implicitamente, $1+\cos\left(xy\right)\left(y+xy'\right)=y'$. Na origem, $\cos 0=1$, $y=0$ e $x=0$, de modo que $1+1\cdot\left(0+0\right)=y'$, isto é, $y'=1$.`,
  1,
  () => {
    const y = (x) => bissecao((t) => x + Math.sin(x * t) - t, -1, 1);
    return d1(y, 0, 1e-4);
  }
);

q(
  "Cálculo das Derivadas", "Derivada segunda implícita numa circunferência", "dificil",
  R`A curva $x^{2}+y^{2}=25$ passa pelo ponto $\left(3,4\right)$. Determine $\dfrac{d^{2}y}{dx^{2}}$ nesse ponto.`,
  R`$-\dfrac{25}{64}$`,
  [R`$-\dfrac{25}{16}$`, R`$\dfrac{25}{64}$`, R`$-\dfrac{9}{64}$`, R`$-\dfrac{3}{16}$`],
  R`De $x+yy'=0$ vem $y'=-\dfrac{x}{y}$. Derivando de novo, $1+\left(y'\right)^{2}+yy''=0$, logo $y''=-\dfrac{1+\left(y'\right)^{2}}{y}$. Em $\left(3,4\right)$, $y'=-\dfrac{3}{4}$ e $y''=-\dfrac{1+\frac{9}{16}}{4}=-\dfrac{25}{64}$.`,
  -25 / 64,
  () => d2((x) => Math.sqrt(25 - x * x), 3, 1e-3)
);

q(
  "Cálculo das Derivadas", "Derivada segunda implícita numa hipérbole", "dificil",
  R`A curva $x^{2}-y^{2}=16$ passa pelo ponto $\left(5,3\right)$. Determine $\dfrac{d^{2}y}{dx^{2}}$ nesse ponto.`,
  R`$-\dfrac{16}{27}$`,
  [R`$\dfrac{16}{27}$`, R`$-\dfrac{25}{27}$`, R`$-\dfrac{16}{9}$`, R`$-\dfrac{8}{27}$`],
  R`De $2x-2yy'=0$ vem $y'=\dfrac{x}{y}$. Derivando, $1-\left(y'\right)^{2}-yy''=0$, isto é, $y''=\dfrac{1-\left(y'\right)^{2}}{y}=\dfrac{y^{2}-x^{2}}{y^{3}}=-\dfrac{16}{y^{3}}$. Em $y=3$: $-\dfrac{16}{27}$.`,
  -16 / 27,
  () => d2((x) => Math.sqrt(x * x - 16), 5, 1e-3)
);

// --- derivadas de ordem superior --------------------------------------------
q(
  "Cálculo das Derivadas", "Quarta derivada de um seno de argumento duplo", "medio",
  R`Seja $f(x)=\operatorname{sen}\left(2x\right)$. Calcule $f^{(4)}\left(\dfrac{\pi}{8}\right)$.`,
  R`$8\sqrt{2}$`,
  [R`$4\sqrt{2}$`, R`$16\sqrt{2}$`, R`$2\sqrt{2}$`, R`$\dfrac{\sqrt{2}}{2}$`],
  R`Cada derivação multiplica por $2$ e avança a fase em $\dfrac{\pi}{2}$; após quatro derivações a fase volta ao início: $f^{(4)}(x)=2^{4}\operatorname{sen}(2x)=16\operatorname{sen}(2x)$. Em $x=\dfrac{\pi}{8}$, $\operatorname{sen}\dfrac{\pi}{4}=\dfrac{\sqrt{2}}{2}$ e $f^{(4)}=16\cdot\dfrac{\sqrt{2}}{2}=8\sqrt{2}$.`,
  8 * Math.SQRT2,
  () => d4((x) => Math.sin(2 * x), Math.PI / 8, 0.01),
  { tol: 1e-3 }
);

q(
  "Cálculo das Derivadas", "Derivada de ordem muito alta do cosseno", "dificil",
  R`Seja $f(x)=\cos x$. Calcule $f^{(2026)}(0)$.`,
  R`$-1$`,
  [R`$1$`, R`$0$`, R`$2$`, R`$-2$`],
  R`As derivadas do cosseno se repetem com período $4$: $-\operatorname{sen}x$, $-\cos x$, $\operatorname{sen}x$, $\cos x$. Como $2026=4\cdot506+2$, tem-se $f^{(2026)}(x)=-\cos x$, e em $x=0$ isso vale $-1$.`,
  -1,
  () => {
    // valida a fórmula cos^{(n)}(x) = cos(x + nπ/2) contra diferenças finitas
    // em n = 1, 2, 3 antes de usá-la na ordem 2026.
    const formula = (n, x) => Math.cos(x + (n * Math.PI) / 2);
    const aprox = [d1(Math.cos, 0.7), d2(Math.cos, 0.7), d3(Math.cos, 0.7)];
    for (let n = 1; n <= 3; n++) if (Math.abs(aprox[n - 1] - formula(n, 0.7)) > 1e-4) return NaN;
    return formula(2026, 0);
  }
);

q(
  "Cálculo das Derivadas", "Quarta derivada na origem pela regra de Leibniz", "dificil",
  R`Seja $f(x)=x^{3}\operatorname{sen}x$. Calcule $f^{(4)}(0)$.`,
  R`$24$`,
  [R`$6$`, R`$12$`, R`$48$`, R`$0$`],
  R`Pela regra de Leibniz, $f^{(4)}=\sum_{k=0}^{4}\binom{4}{k}\left(x^{3}\right)^{(k)}\left(\operatorname{sen}x\right)^{(4-k)}$. Em $x=0$ só sobrevive o termo com $\left(x^{3}\right)'''=6$: $\binom{4}{3}\cdot6\cdot\left(\operatorname{sen}\right)'(0)=4\cdot6\cdot1=24$. O mesmo se lê no desenvolvimento $x^{3}\operatorname{sen}x=x^{4}-\dfrac{x^{6}}{6}+\cdots$, cujo coeficiente de $x^{4}$ é $\dfrac{f^{(4)}(0)}{4!}=1$.`,
  24,
  () => d4((x) => x ** 3 * Math.sin(x), 0, 0.01),
  { tol: 1e-3 }
);

q(
  "Cálculo das Derivadas", "Quarta derivada na origem de um produto com cosseno", "dificil",
  R`Seja $f(x)=x^{2}\cos x$. Calcule $f^{(4)}(0)$.`,
  R`$-12$`,
  [R`$12$`, R`$-24$`, R`$-6$`, R`$24$`],
  R`Por Leibniz, em $x=0$ só sobrevive o termo com $\left(x^{2}\right)''=2$: $\binom{4}{2}\cdot2\cdot\left(\cos\right)''(0)=6\cdot2\cdot\left(-1\right)=-12$. Conferindo pelo desenvolvimento, $x^{2}\cos x=x^{2}-\dfrac{x^{4}}{2}+\cdots$, e $\dfrac{f^{(4)}(0)}{4!}=-\dfrac{1}{2}$ dá $f^{(4)}(0)=-12$.`,
  -12,
  () => d4((x) => x * x * Math.cos(x), 0, 0.02),
  { tol: 1e-3 }
);

q(
  "Cálculo das Derivadas", "Quarta derivada de uma racional na origem", "dificil",
  R`Seja $f(x)=\dfrac{1}{1+2x}$. Calcule $f^{(4)}(0)$.`,
  R`$384$`,
  [R`$24$`, R`$96$`, R`$192$`, R`$768$`],
  R`Derivando sucessivamente, $f^{(n)}(x)=\dfrac{\left(-1\right)^{n}n!\,2^{n}}{\left(1+2x\right)^{n+1}}$ — cada derivação traz um fator $-2$ e aumenta o expoente. Para $n=4$ e $x=0$: $4!\cdot2^{4}=24\cdot16=384$.`,
  384,
  () => d4((x) => 1 / (1 + 2 * x), 0, 0.005),
  { tol: 1e-3 }
);

q(
  "Cálculo das Derivadas", "Quarta derivada de 1/x num ponto", "dificil",
  R`Seja $f(x)=\dfrac{1}{x}$. Calcule $f^{(4)}(1)$.`,
  R`$24$`,
  [R`$-24$`, R`$6$`, R`$120$`, R`$-6$`],
  R`Tem-se $f^{(n)}(x)=\dfrac{\left(-1\right)^{n}n!}{x^{n+1}}$: o sinal alterna e o fatorial cresce. Para $n=4$, o sinal é positivo e $f^{(4)}(1)=4!=24$.`,
  24,
  () => d4((x) => 1 / x, 1, 0.005),
  { tol: 1e-3 }
);

q(
  "Cálculo das Derivadas", "Terceira derivada de um polinômio", "medio",
  R`Seja $f(x)=x^{5}-3x^{4}$. Calcule $f'''(2)$.`,
  R`$96$`,
  [R`$48$`, R`$72$`, R`$120$`, R`$144$`],
  R`Derivando três vezes: $f'=5x^{4}-12x^{3}$, $f''=20x^{3}-36x^{2}$ e $f'''=60x^{2}-72x$. Em $x=2$: $240-144=96$.`,
  96,
  () => d3((x) => x ** 5 - 3 * x ** 4, 2, 0.01),
  { tol: 1e-3 }
);

q(
  "Cálculo das Derivadas", "Derivada segunda de uma racional na origem", "medio",
  R`Seja $f(x)=\dfrac{1}{1+x^{2}}$. Calcule $f''(0)$.`,
  R`$-2$`,
  [R`$2$`, R`$-1$`, R`$0$`, R`$-4$`],
  R`Pela cadeia, $f'(x)=-\dfrac{2x}{\left(1+x^{2}\right)^{2}}$. Derivando de novo pelo quociente, $f''(x)=\dfrac{-2\left(1+x^{2}\right)^{2}+2x\cdot2\left(1+x^{2}\right)2x}{\left(1+x^{2}\right)^{4}}$, que em $x=0$ vale $-2$.`,
  -2,
  () => d2((x) => 1 / (1 + x * x), 0, 1e-3)
);

q(
  "Cálculo das Derivadas", "Derivada segunda de um produto com cosseno", "medio",
  R`Seja $f(x)=x^{2}\cos\left(2x\right)$. Calcule $f''(0)$.`,
  R`$2$`,
  [R`$-2$`, R`$4$`, R`$-4$`, R`$0$`],
  R`Derivando pelo produto, $f'=2x\cos 2x-2x^{2}\operatorname{sen}2x$ e $f''=2\cos 2x-4x\operatorname{sen}2x-4x\operatorname{sen}2x-4x^{2}\cos 2x$. Em $x=0$ todos os termos com fator $x$ somem e resta $2\cos 0=2$.`,
  2,
  () => d2((x) => x * x * Math.cos(2 * x), 0, 1e-3)
);

// --- regra da cadeia com valores tabelados ---------------------------------
q(
  "Cálculo das Derivadas", "Cadeia com a função composta consigo mesma", "dificil",
  R`Seja $f(x)=g\left(g(x)\right)$, onde $g$ é derivável com $g(1)=2$, $g(2)=5$, $g'(1)=3$ e $g'(2)=-1$. Calcule $f'(1)$.`,
  R`$-3$`,
  [R`$3$`, R`$-1$`, R`$15$`, R`$-5$`],
  R`Pela regra da cadeia, $f'(x)=g'\left(g(x)\right)g'(x)$. Em $x=1$: $g'\left(g(1)\right)g'(1)=g'(2)\cdot3=-1\cdot3=-3$. Os valores $g(2)=5$ e $g(1)=2$ servem só para localizar o ponto em que $g'$ deve ser lida.`,
  -3,
  () => {
    // cúbica que realiza exatamente os quatro dados do enunciado
    const g = (x) => -4 * x ** 3 + 16 * x * x - 17 * x + 7;
    return d1((x) => g(g(x)), 1);
  }
);

q(
  "Cálculo das Derivadas", "Cadeia com radical de função tabelada", "medio",
  R`Seja $f(x)=\sqrt{g(x)}$, onde $g$ é derivável com $g(4)=9$ e $g'(4)=-2$. Calcule $f'(4)$.`,
  R`$-\dfrac{1}{3}$`,
  [R`$-\dfrac{1}{6}$`, R`$\dfrac{1}{3}$`, R`$-\dfrac{2}{3}$`, R`$-\dfrac{1}{9}$`],
  R`Pela cadeia, $f'(x)=\dfrac{g'(x)}{2\sqrt{g(x)}}$. Em $x=4$: $\dfrac{-2}{2\cdot3}=-\dfrac{1}{3}$.`,
  -1 / 3,
  () => d1((x) => Math.sqrt(17 - 2 * x), 4)
);

// ===========================================================================
// APLICAÇÕES DA DERIVADA — 36
// ===========================================================================

// --- taxas relacionadas -----------------------------------------------------
q(
  "Aplicações da Derivada", "Escada que escorrega pela parede", "medio",
  R`Uma escada de $5$ m está apoiada numa parede vertical. O pé da escada é puxado horizontalmente, afastando-se da parede a $2$ m/s. Determine, em m/s, a velocidade com que o topo desce quando o pé está a $3$ m da parede.`,
  R`$\dfrac{3}{2}$`,
  [R`$\dfrac{2}{3}$`, R`$\dfrac{4}{3}$`, R`$\dfrac{5}{3}$`, R`$\dfrac{8}{3}$`],
  R`Com $x^{2}+y^{2}=25$, derivando em relação ao tempo: $x\dfrac{dx}{dt}+y\dfrac{dy}{dt}=0$. Quando $x=3$, tem-se $y=4$, e $3\cdot2+4\dfrac{dy}{dt}=0$ dá $\dfrac{dy}{dt}=-\dfrac{3}{2}$. O sinal negativo diz que o topo desce; a rapidez é $\dfrac{3}{2}$ m/s.`,
  3 / 2,
  () => Math.abs(d1((x) => Math.sqrt(25 - x * x), 3) * 2)
);

q(
  "Aplicações da Derivada", "Balão esférico sendo inflado", "medio",
  R`Um balão esférico é inflado a uma taxa constante de $100$ cm$^{3}$/s. Determine, em cm/s, a taxa de variação do raio no instante em que ele mede $5$ cm.`,
  R`$\dfrac{1}{\pi}$`,
  [R`$\dfrac{2}{\pi}$`, R`$\dfrac{1}{2\pi}$`, R`$\dfrac{4}{\pi}$`, R`$\dfrac{1}{4\pi}$`],
  R`De $V=\dfrac{4}{3}\pi r^{3}$ vem $\dfrac{dV}{dt}=4\pi r^{2}\dfrac{dr}{dt}$. Com $\dfrac{dV}{dt}=100$ e $r=5$: $\dfrac{dr}{dt}=\dfrac{100}{4\pi\cdot25}=\dfrac{1}{\pi}$.`,
  1 / Math.PI,
  () => {
    const V = (r) => (4 / 3) * Math.PI * r ** 3;
    return 100 / d1(V, 5);
  }
);

q(
  "Aplicações da Derivada", "Ponta da sombra projetada por um poste", "dificil",
  R`Um homem de $1{,}8$ m de altura afasta-se de um poste de $6$ m a $1{,}5$ m/s. Determine, em m/s, a velocidade com que a ponta de sua sombra se move sobre o chão.`,
  R`$\dfrac{15}{7}$`,
  [R`$\dfrac{9}{7}$`, R`$\dfrac{5}{7}$`, R`$\dfrac{10}{7}$`, R`$\dfrac{20}{7}$`],
  R`Sendo $x$ a distância do homem ao poste e $s$ o comprimento da sombra, a semelhança de triângulos dá $\dfrac{s}{1{,}8}=\dfrac{x+s}{6}$, isto é, $4{,}2\,s=1{,}8\,x$ e $s=\dfrac{3}{7}x$. A ponta da sombra está em $x+s=\dfrac{10}{7}x$, cuja taxa é $\dfrac{10}{7}\cdot1{,}5=\dfrac{15}{7}$ m/s. Repare que ela não depende da distância ao poste.`,
  15 / 7,
  () => {
    const ponta = (x) => x + bissecao((s) => 6 * s - 1.8 * (x + s), 0, 1000);
    return d1(ponta, 10) * 1.5;
  }
);

q(
  "Aplicações da Derivada", "Ponto que percorre uma parábola", "dificil",
  R`Um ponto move-se sobre a parábola $y=x^{2}$ de modo que sua abscissa cresce a $3$ cm/s. Determine, em cm/s, a taxa de variação da distância do ponto à origem no instante em que $x=1$.`,
  R`$\dfrac{9\sqrt{2}}{2}$`,
  [R`$\dfrac{3\sqrt{2}}{2}$`, R`$\dfrac{9\sqrt{2}}{4}$`, R`$3\sqrt{2}$`, R`$\dfrac{15\sqrt{2}}{2}$`],
  R`A distância é $D=\sqrt{x^{2}+x^{4}}$, logo $\dfrac{dD}{dx}=\dfrac{2x+4x^{3}}{2\sqrt{x^{2}+x^{4}}}$, que em $x=1$ vale $\dfrac{6}{2\sqrt{2}}=\dfrac{3}{\sqrt{2}}$. Pela cadeia, $\dfrac{dD}{dt}=\dfrac{3}{\sqrt{2}}\cdot3=\dfrac{9}{\sqrt{2}}=\dfrac{9\sqrt{2}}{2}$.`,
  (9 * Math.SQRT2) / 2,
  () => d1((x) => Math.sqrt(x * x + x ** 4), 1) * 3
);

q(
  "Aplicações da Derivada", "Cubo com aresta crescendo", "medio",
  R`A aresta de um cubo cresce a $2$ cm/s. Determine, em cm$^{2}$/s, a taxa de variação da área total de sua superfície no instante em que a aresta mede $5$ cm.`,
  R`$120$`,
  [R`$60$`, R`$100$`, R`$150$`, R`$240$`],
  R`A área total é $S=6a^{2}$, logo $\dfrac{dS}{dt}=12a\dfrac{da}{dt}$. Com $a=5$ e $\dfrac{da}{dt}=2$: $12\cdot5\cdot2=120$ cm$^{2}$/s.`,
  120,
  () => d1((a) => 6 * a * a, 5) * 2
);

q(
  "Aplicações da Derivada", "Monte de areia em forma de cone", "dificil",
  R`Areia cai formando um monte cônico cuja altura é sempre igual ao raio da base, a uma taxa de $10$ m$^{3}$/min. Determine, em m/min, a taxa de variação da altura no instante em que ela mede $5$ m.`,
  R`$\dfrac{2}{5\pi}$`,
  [R`$\dfrac{1}{5\pi}$`, R`$\dfrac{2}{25\pi}$`, R`$\dfrac{4}{5\pi}$`, R`$\dfrac{10}{\pi}$`],
  R`Com $r=h$, o volume é $V=\dfrac{\pi}{3}h^{2}\cdot h=\dfrac{\pi h^{3}}{3}$, logo $\dfrac{dV}{dt}=\pi h^{2}\dfrac{dh}{dt}$. Com $h=5$: $\dfrac{dh}{dt}=\dfrac{10}{25\pi}=\dfrac{2}{5\pi}$.`,
  2 / (5 * Math.PI),
  () => 10 / d1((h) => (Math.PI * h ** 3) / 3, 5)
);

q(
  "Aplicações da Derivada", "Área de um triângulo com ângulo variável", "medio",
  R`Dois lados de um triângulo medem $4$ m e $5$ m, e o ângulo entre eles cresce a $0{,}06$ rad/s. Determine, em m$^{2}$/s, a taxa de variação da área quando esse ângulo vale $\dfrac{\pi}{3}$.`,
  R`$0{,}3$`,
  [R`$0{,}15$`, R`$0{,}6$`, R`$0{,}12$`, R`$0{,}24$`],
  R`A área é $A=\dfrac{1}{2}\cdot4\cdot5\operatorname{sen}\theta=10\operatorname{sen}\theta$, logo $\dfrac{dA}{dt}=10\cos\theta\dfrac{d\theta}{dt}$. Com $\cos\dfrac{\pi}{3}=\dfrac{1}{2}$: $10\cdot\dfrac{1}{2}\cdot0{,}06=0{,}3$ m$^{2}$/s.`,
  0.3,
  () => d1((t) => 10 * Math.sin(t), Math.PI / 3) * 0.06
);

q(
  "Aplicações da Derivada", "Ângulo de observação de um balão que sobe", "dificil",
  R`Um balão sobe verticalmente a $10$ m/s, e um observador está a $100$ m do ponto de lançamento. Determine, em rad/s, a taxa de variação do ângulo de elevação quando o balão está a $100$ m de altura.`,
  R`$\dfrac{1}{20}$`,
  [R`$\dfrac{1}{10}$`, R`$\dfrac{1}{40}$`, R`$\dfrac{1}{5}$`, R`$\dfrac{1}{100}$`],
  R`Com $\theta=\operatorname{arctg}\dfrac{h}{100}$, tem-se $\dfrac{d\theta}{dt}=\dfrac{1}{1+\left(h/100\right)^{2}}\cdot\dfrac{1}{100}\cdot\dfrac{dh}{dt}$. Para $h=100$: $\dfrac{1}{2}\cdot\dfrac{1}{100}\cdot10=\dfrac{1}{20}$ rad/s.`,
  1 / 20,
  () => d1((h) => Math.atan(h / 100), 100) * 10
);

// --- otimização -------------------------------------------------------------
q(
  "Aplicações da Derivada", "Caixa aberta de base quadrada e área mínima", "dificil",
  R`Uma caixa sem tampa, de base quadrada, deve ter volume $32$ cm$^{3}$. Determine, em cm$^{2}$, a menor área total possível de material.`,
  R`$48$`,
  [R`$32$`, R`$40$`, R`$64$`, R`$96$`],
  R`Sendo $x$ o lado da base e $h$ a altura, $x^{2}h=32$ e a área é $A=x^{2}+4xh=x^{2}+\dfrac{128}{x}$. De $A'=2x-\dfrac{128}{x^{2}}=0$ vem $x^{3}=64$, isto é, $x=4$ (mínimo, pois $A''>0$). Então $A=16+32=48$ cm$^{2}$.`,
  48,
  () => extremo((x) => x * x + 128 / x, 0.5, 20, "min").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Retângulo de área máxima inscrito numa elipse", "dificil",
  R`Determine a maior área possível de um retângulo de lados paralelos aos eixos inscrito na elipse $\dfrac{x^{2}}{9}+\dfrac{y^{2}}{4}=1$.`,
  R`$12$`,
  [R`$6$`, R`$18$`, R`$24$`, R`$36$`],
  R`Com o vértice $\left(x,y\right)$ no primeiro quadrante, a área é $A=4xy=4x\cdot2\sqrt{1-\dfrac{x^{2}}{9}}$. Maximizar $A$ equivale a maximizar $x^{2}\left(1-\dfrac{x^{2}}{9}\right)$, o que ocorre em $x=\dfrac{3}{\sqrt{2}}$, e então $y=\sqrt{2}$. A área vale $4\cdot\dfrac{3}{\sqrt{2}}\cdot\sqrt{2}=12$ — resultado geral $2ab$ para a elipse de semieixos $a$ e $b$.`,
  12,
  () => extremo((x) => 4 * x * 2 * Math.sqrt(1 - (x * x) / 9), 0, 3, "max").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Menor distância de um ponto a uma parábola", "dificil",
  R`Determine a menor distância do ponto $\left(4,0\right)$ à parábola $y^{2}=2x$.`,
  R`$\sqrt{7}$`,
  [R`$\sqrt{5}$`, R`$2\sqrt{2}$`, R`$\sqrt{10}$`, R`$3$`],
  R`Um ponto da parábola é $\left(x,y\right)$ com $y^{2}=2x$, e o quadrado da distância vale $D=\left(x-4\right)^{2}+2x$. De $D'=2\left(x-4\right)+2=0$ vem $x=3$, valor admissível (pois $x\geq0$), e $D=1+6=7$. A distância mínima é $\sqrt{7}$.`,
  Math.sqrt(7),
  () => Math.sqrt(extremo((x) => (x - 4) ** 2 + 2 * x, 0, 20, "min").valor),
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Triângulo isósceles de área máxima inscrito num círculo", "dificil",
  R`Determine a maior área possível de um triângulo isósceles inscrito num círculo de raio $1$.`,
  R`$\dfrac{3\sqrt{3}}{4}$`,
  [R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{3\sqrt{3}}{2}$`, R`$\dfrac{\sqrt{3}}{4}$`, R`$\dfrac{2\sqrt{3}}{3}$`],
  R`Coloque a base a uma distância $d\in\left[-1,1\right]$ do centro, do lado oposto ao vértice. Então a base mede $2\sqrt{1-d^{2}}$, a altura é $1+d$ e a área vale $A(d)=\sqrt{1-d^{2}}\left(1+d\right)$. Derivando e igualando a zero, $d=\dfrac{1}{2}$, o que dá $A=\dfrac{\sqrt{3}}{2}\cdot\dfrac{3}{2}=\dfrac{3\sqrt{3}}{4}$ — o triângulo ótimo é o equilátero.`,
  (3 * Math.sqrt(3)) / 4,
  () => extremo((d) => Math.sqrt(1 - d * d) * (1 + d), -1, 1, "max").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Cilindro de volume máximo inscrito num cone", "dificil",
  R`Determine o maior volume possível de um cilindro reto inscrito num cone de raio $3$ e altura $9$, com as bases apoiadas na base do cone.`,
  R`$12\pi$`,
  [R`$9\pi$`, R`$18\pi$`, R`$24\pi$`, R`$27\pi$`],
  R`Se o cilindro tem raio $r$, a semelhança de triângulos dá altura $h=9\left(1-\dfrac{r}{3}\right)$, e $V=\pi r^{2}h=9\pi r^{2}-3\pi r^{3}$. De $V'=18\pi r-9\pi r^{2}=0$ vem $r=2$ (o valor $r=0$ é mínimo), e $V=36\pi-24\pi=12\pi$ — exatamente $\dfrac{4}{9}$ do volume do cone.`,
  12 * Math.PI,
  () => extremo((r) => Math.PI * r * r * 9 * (1 - r / 3), 0, 3, "max").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Fio cortado entre quadrado e círculo", "dificil",
  R`Um fio de $100$ cm é cortado em dois pedaços: com um faz-se um quadrado e com o outro, um círculo. Determine, em cm, o comprimento do pedaço usado no quadrado para que a soma das áreas seja mínima.`,
  R`$\dfrac{400}{\pi+4}$`,
  [R`$\dfrac{100}{\pi+4}$`, R`$\dfrac{400}{\pi+2}$`, R`$\dfrac{100\pi}{\pi+4}$`, R`$\dfrac{200}{\pi+4}$`],
  R`Se $x$ é o pedaço do quadrado, seu lado é $\dfrac{x}{4}$ e sua área $\dfrac{x^{2}}{16}$; o círculo tem comprimento $100-x$, raio $\dfrac{100-x}{2\pi}$ e área $\dfrac{\left(100-x\right)^{2}}{4\pi}$. De $S'=\dfrac{x}{8}-\dfrac{100-x}{2\pi}=0$ vem $\pi x=4\left(100-x\right)$, isto é, $x=\dfrac{400}{\pi+4}$. Como $S''>0$, é mínimo.`,
  400 / (Math.PI + 4),
  () => extremo((x) => (x * x) / 16 + (100 - x) ** 2 / (4 * Math.PI), 0, 100, "min").x,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Máximo de uma função com fator exponencial", "dificil",
  R`Determine o valor máximo de $f(x)=x^{2}e^{-x}$ no intervalo $\left[0,+\infty\right)$.`,
  R`$\dfrac{4}{e^{2}}$`,
  [R`$\dfrac{2}{e^{2}}$`, R`$\dfrac{4}{e}$`, R`$\dfrac{1}{e^{2}}$`, R`$\dfrac{4}{e^{3}}$`],
  R`Derivando, $f'(x)=\left(2x-x^{2}\right)e^{-x}=x\left(2-x\right)e^{-x}$, que anula em $x=0$ e $x=2$. O sinal de $f'$ é positivo em $\left(0,2\right)$ e negativo depois, então $x=2$ é máximo absoluto, com $f(2)=\dfrac{4}{e^{2}}$.`,
  4 / Math.E ** 2,
  () => extremo((x) => x * x * Math.exp(-x), 0, 40, "max").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Soma do máximo e do mínimo num intervalo fechado", "medio",
  R`Seja $f(x)=x^{3}-3x+1$ em $\left[0,3\right]$. Calcule a soma do valor máximo absoluto com o valor mínimo absoluto de $f$ nesse intervalo.`,
  R`$18$`,
  [R`$16$`, R`$20$`, R`$19$`, R`$12$`],
  R`Os candidatos são os extremos do intervalo e os pontos críticos: $f'(x)=3x^{2}-3$ anula em $x=1$ (o ponto $x=-1$ está fora). Comparando $f(0)=1$, $f(1)=-1$ e $f(3)=19$, o máximo é $19$ e o mínimo é $-1$. A soma vale $18$.`,
  18,
  () => extremo((x) => x ** 3 - 3 * x + 1, 0, 3, "max").valor + extremo((x) => x ** 3 - 3 * x + 1, 0, 3, "min").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Extremos absolutos de x mais seu inverso", "medio",
  R`Seja $f(x)=x+\dfrac{1}{x}$ em $\left[\dfrac{1}{2},3\right]$. Calcule a soma do valor máximo absoluto com o valor mínimo absoluto de $f$ nesse intervalo.`,
  R`$\dfrac{16}{3}$`,
  [R`$\dfrac{13}{3}$`, R`$\dfrac{19}{3}$`, R`$\dfrac{9}{2}$`, R`$\dfrac{11}{2}$`],
  R`De $f'(x)=1-\dfrac{1}{x^{2}}$ vem o ponto crítico $x=1$, com $f(1)=2$. Nas bordas, $f\left(\dfrac{1}{2}\right)=\dfrac{5}{2}$ e $f(3)=\dfrac{10}{3}$. O máximo é $\dfrac{10}{3}$ e o mínimo é $2$, de soma $\dfrac{16}{3}$.`,
  16 / 3,
  () => {
    const f = (x) => x + 1 / x;
    return extremo(f, 0.5, 3, "max").valor + extremo(f, 0.5, 3, "min").valor;
  },
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Máximo de uma combinação de seno e cosseno", "medio",
  R`Determine o valor máximo de $f(x)=\operatorname{sen}x+\cos x$.`,
  R`$\sqrt{2}$`,
  [R`$2$`, R`$\dfrac{\sqrt{2}}{2}$`, R`$2\sqrt{2}$`, R`$\dfrac{3}{2}$`],
  R`De $f'(x)=\cos x-\operatorname{sen}x=0$ vem $\operatorname{tg}x=1$, isto é, $x=\dfrac{\pi}{4}+k\pi$. Em $x=\dfrac{\pi}{4}$, $f=\dfrac{\sqrt{2}}{2}+\dfrac{\sqrt{2}}{2}=\sqrt{2}$, e $f''<0$ ali. O mesmo sai de $f(x)=\sqrt{2}\operatorname{sen}\left(x+\dfrac{\pi}{4}\right)$.`,
  Math.SQRT2,
  () => extremo((x) => Math.sin(x) + Math.cos(x), 0, 2 * Math.PI, "max").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Valor do máximo local de uma cúbica", "medio",
  R`Seja $f(x)=x^{3}-3x^{2}-9x+5$. Determine o valor do máximo local de $f$.`,
  R`$10$`,
  [R`$5$`, R`$-22$`, R`$8$`, R`$12$`],
  R`De $f'(x)=3x^{2}-6x-9=3\left(x-3\right)\left(x+1\right)$ vêm os críticos $x=-1$ e $x=3$. Como $f''(x)=6x-6$, tem-se $f''(-1)=-12<0$: máximo local em $x=-1$, com $f(-1)=-1-3+9+5=10$.`,
  10,
  () => {
    const f = (x) => x ** 3 - 3 * x * x - 9 * x + 5;
    return extremo(f, -3, 1, "max").valor;
  },
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Distância entre os valores extremos locais", "dificil",
  R`Seja $f(x)=\dfrac{x^{2}+1}{x}$. Calcule a diferença entre o valor do mínimo local e o valor do máximo local de $f$.`,
  R`$4$`,
  [R`$2$`, R`$1$`, R`$-4$`, R`$8$`],
  R`Escrevendo $f(x)=x+\dfrac{1}{x}$, tem-se $f'(x)=1-\dfrac{1}{x^{2}}$, que anula em $x=\pm1$. Para $x>0$, $x=1$ é mínimo local com $f(1)=2$; para $x<0$, $x=-1$ é máximo local com $f(-1)=-2$. A diferença é $2-\left(-2\right)=4$. Note que o "mínimo" local supera o "máximo" local — os dois ramos são separados pela assíntota $x=0$.`,
  4,
  () => {
    const f = (x) => (x * x + 1) / x;
    return extremo(f, 0.1, 10, "min").valor - extremo(f, -10, -0.1, "max").valor;
  },
  { tol: 1e-3 }
);

// --- Rolle e Teorema do Valor Médio -----------------------------------------
q(
  "Aplicações da Derivada", "Ponto dado pelo Teorema do Valor Médio numa cúbica", "dificil",
  R`Seja $f(x)=x^{3}-x$ em $\left[0,2\right]$. Determine o valor de $c\in\left(0,2\right)$ dado pelo Teorema do Valor Médio.`,
  R`$\dfrac{2\sqrt{3}}{3}$`,
  [R`$\dfrac{\sqrt{3}}{3}$`, R`$\dfrac{4\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{3\sqrt{3}}{4}$`],
  R`A taxa média é $\dfrac{f(2)-f(0)}{2-0}=\dfrac{6-0}{2}=3$. Impondo $f'(c)=3c^{2}-1=3$, vem $c^{2}=\dfrac{4}{3}$ e, tomando a raiz positiva do intervalo, $c=\dfrac{2}{\sqrt{3}}=\dfrac{2\sqrt{3}}{3}$.`,
  (2 * Math.sqrt(3)) / 3,
  () => {
    const f = (x) => x ** 3 - x;
    const taxa = (f(2) - f(0)) / 2;
    return bissecao((c) => d1(f, c) - taxa, 0.1, 2);
  }
);

q(
  "Aplicações da Derivada", "Ponto do Teorema do Valor Médio para a raiz quadrada", "medio",
  R`Seja $f(x)=\sqrt{x}$ em $\left[0,4\right]$. Determine o valor de $c\in\left(0,4\right)$ dado pelo Teorema do Valor Médio.`,
  R`$1$`,
  [R`$2$`, R`$3$`, R`$4$`, R`$0$`],
  R`A taxa média vale $\dfrac{2-0}{4-0}=\dfrac{1}{2}$. De $f'(c)=\dfrac{1}{2\sqrt{c}}=\dfrac{1}{2}$ vem $\sqrt{c}=1$, isto é, $c=1$.`,
  1,
  () => {
    const taxa = (Math.sqrt(4) - 0) / 4;
    return bissecao((c) => d1(Math.sqrt, c) - taxa, 0.05, 4);
  }
);

q(
  "Aplicações da Derivada", "Ponto do Teorema de Rolle", "dificil",
  R`Seja $f(x)=x\sqrt{4-x^{2}}$ em $\left[-2,2\right]$. Determine o valor positivo de $c$ dado pelo Teorema de Rolle.`,
  R`$\sqrt{2}$`,
  [R`$2\sqrt{2}$`, R`$\dfrac{\sqrt{2}}{2}$`, R`$\sqrt{3}$`, R`$\dfrac{\sqrt{3}}{2}$`],
  R`Como $f(-2)=f(2)=0$ e $f$ é contínua em $\left[-2,2\right]$ e derivável no interior, Rolle garante $c$ com $f'(c)=0$. Derivando, $f'(x)=\sqrt{4-x^{2}}-\dfrac{x^{2}}{\sqrt{4-x^{2}}}=\dfrac{4-2x^{2}}{\sqrt{4-x^{2}}}$, que anula quando $x^{2}=2$. O valor positivo é $c=\sqrt{2}$.`,
  Math.SQRT2,
  () => bissecao((c) => d1((x) => x * Math.sqrt(4 - x * x), c), 0.5, 1.9)
);

// --- regra de L'Hospital ----------------------------------------------------
q(
  "Aplicações da Derivada", "L'Hospital com arco-tangente", "dificil",
  R`Calcule $\displaystyle\lim_{x\to0}\dfrac{x-\operatorname{arctg}x}{x^{3}}$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{6}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{1}{12}$`],
  R`É uma indeterminação $\dfrac{0}{0}$. Derivando numerador e denominador, $\dfrac{1-\dfrac{1}{1+x^{2}}}{3x^{2}}=\dfrac{x^{2}}{3x^{2}\left(1+x^{2}\right)}=\dfrac{1}{3\left(1+x^{2}\right)}\to\dfrac{1}{3}$. Uma única aplicação basta porque o numerador simplifica.`,
  1 / 3,
  () => limite((x) => (x - Math.atan(x)) / x ** 3, 0, 1)
);

q(
  "Aplicações da Derivada", "L'Hospital com tangente e seno", "dificil",
  R`Calcule $\displaystyle\lim_{x\to0}\dfrac{\operatorname{tg}x-x}{x-\operatorname{sen}x}$.`,
  R`$2$`,
  [R`$1$`, R`$\dfrac{1}{2}$`, R`$3$`, R`$\dfrac{1}{3}$`],
  R`Ambos são infinitésimos de terceira ordem: $\operatorname{tg}x-x\sim\dfrac{x^{3}}{3}$ e $x-\operatorname{sen}x\sim\dfrac{x^{3}}{6}$. O quociente tende a $\dfrac{1/3}{1/6}=2$. Por L'Hospital chega-se ao mesmo após três derivações — bem mais trabalhoso.`,
  2,
  () => limite((x) => (Math.tan(x) - x) / (x - Math.sin(x)), 0, 1)
);

q(
  "Aplicações da Derivada", "L'Hospital com raízes de índices diferentes", "medio",
  R`Calcule $\displaystyle\lim_{x\to1}\dfrac{\sqrt[3]{x}-1}{\sqrt{x}-1}$.`,
  R`$\dfrac{2}{3}$`,
  [R`$\dfrac{3}{2}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{5}{6}$`],
  R`Derivando numerador e denominador, $\dfrac{\frac{1}{3}x^{-2/3}}{\frac{1}{2}x^{-1/2}}$, que em $x=1$ vale $\dfrac{1/3}{1/2}=\dfrac{2}{3}$. Também se resolve com $u=x^{1/6}$, que transforma o quociente em $\dfrac{u^{2}-1}{u^{3}-1}$.`,
  2 / 3,
  () => limite((x) => (Math.cbrt(x) - 1) / (Math.sqrt(x) - 1), 1, 1)
);

q(
  "Aplicações da Derivada", "Indeterminação do tipo um elevado a infinito", "dificil",
  R`Calcule $\displaystyle\lim_{x\to+\infty}\left(1+\dfrac{3}{x}\right)^{2x}$.`,
  R`$e^{6}$`,
  [R`$e^{3}$`, R`$e^{2}$`, R`$e^{5}$`, R`$e^{9}$`],
  R`Tomando logaritmo, $2x\ln\left(1+\dfrac{3}{x}\right)$. Com $t=\dfrac{1}{x}\to0^{+}$, isso é $\dfrac{2\ln\left(1+3t\right)}{t}\to6$, pois $\ln(1+u)\sim u$. Pela continuidade da exponencial, o limite é $e^{6}$.`,
  Math.E ** 6,
  () => limite((t) => Math.pow(1 + 3 * t, 2 / t), 0, 1)
);

q(
  "Aplicações da Derivada", "Potência com base tendendo a um e expoente explodindo", "dificil",
  R`Calcule $\displaystyle\lim_{x\to0}\left(\cos 2x\right)^{3/x^{2}}$.`,
  R`$e^{-6}$`,
  [R`$e^{-3}$`, R`$e^{-2}$`, R`$e^{-12}$`, R`$e^{6}$`],
  R`Tomando logaritmo, $\dfrac{3\ln\cos 2x}{x^{2}}$, uma indeterminação $\dfrac{0}{0}$. Como $\ln\cos u\sim-\dfrac{u^{2}}{2}$ com $u=2x$, o numerador se comporta como $-6x^{2}$, e o quociente tende a $-6$. Logo o limite é $e^{-6}$.`,
  Math.exp(-6),
  () => limite((x) => Math.pow(Math.cos(2 * x), 3 / (x * x)), 0, 1)
);

q(
  "Aplicações da Derivada", "Indeterminação infinito menos infinito com seno", "dificil",
  R`Calcule $\displaystyle\lim_{x\to0}\left(\dfrac{1}{x^{2}}-\dfrac{1}{\operatorname{sen}^{2}x}\right)$.`,
  R`$-\dfrac{1}{3}$`,
  [R`$\dfrac{1}{3}$`, R`$-\dfrac{1}{6}$`, R`$\dfrac{1}{6}$`, R`$-\dfrac{2}{3}$`],
  R`Reduzindo ao mesmo denominador, a expressão vira $\dfrac{\operatorname{sen}^{2}x-x^{2}}{x^{2}\operatorname{sen}^{2}x}$. O denominador se comporta como $x^{4}$; no numerador, $\operatorname{sen}^{2}x=x^{2}-\dfrac{x^{4}}{3}+\cdots$, de modo que $\operatorname{sen}^{2}x-x^{2}\sim-\dfrac{x^{4}}{3}$. O limite é $-\dfrac{1}{3}$.`,
  -1 / 3,
  () => limite((x) => 1 / (x * x) - 1 / Math.sin(x) ** 2, 0, 1)
);

q(
  "Aplicações da Derivada", "Produto de zero por infinito com arco-tangente", "dificil",
  R`Calcule $\displaystyle\lim_{x\to+\infty}x\left(\dfrac{\pi}{2}-\operatorname{arctg}x\right)$.`,
  R`$1$`,
  [R`$0$`, R`$\dfrac{\pi}{2}$`, R`$2$`, R`$\dfrac{1}{2}$`],
  R`Escreva $t=\dfrac{1}{x}\to0^{+}$; o produto vira $\dfrac{\frac{\pi}{2}-\operatorname{arctg}\frac{1}{t}}{t}$, indeterminação $\dfrac{0}{0}$. Como $\dfrac{\pi}{2}-\operatorname{arctg}\dfrac{1}{t}=\operatorname{arctg}t$, o quociente é $\dfrac{\operatorname{arctg}t}{t}\to1$.`,
  1,
  () => limite((t) => (Math.PI / 2 - Math.atan(1 / t)) / t, 0, 1)
);

// --- concavidade, inflexão e esboço ----------------------------------------
q(
  "Aplicações da Derivada", "Distância entre os pontos de inflexão", "dificil",
  R`Seja $f(x)=x^{4}-6x^{2}$. Calcule a distância entre os dois pontos de inflexão do gráfico de $f$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$2\sqrt{2}$`, R`$\sqrt{5}$`],
  R`De $f''(x)=12x^{2}-12$ vêm os candidatos $x=\pm1$, e $f''$ de fato troca de sinal em cada um. Como $f(1)=f(-1)=-5$, os pontos de inflexão são $\left(-1,-5\right)$ e $\left(1,-5\right)$: têm a mesma ordenada, e a distância é simplesmente $2$.`,
  2,
  () => {
    const f = (x) => x ** 4 - 6 * x * x;
    const a = bissecao((x) => d2(f, x, 1e-2), -3, 0);
    const b = bissecao((x) => d2(f, x, 1e-2), 0, 3);
    return Math.hypot(a - b, f(a) - f(b));
  },
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Comprimento do intervalo de concavidade para baixo", "dificil",
  R`Determine o comprimento do intervalo em que o gráfico de $f(x)=x^{4}-4x^{3}+10$ tem concavidade voltada para baixo.`,
  R`$2$`,
  [R`$1$`, R`$3$`, R`$4$`, R`$6$`],
  R`Derivando duas vezes, $f''(x)=12x^{2}-24x=12x\left(x-2\right)$, que é negativa exatamente para $0<x<2$. Nesse intervalo — e só nele — a concavidade é para baixo; seu comprimento é $2$. Os pontos $x=0$ e $x=2$ são de inflexão, já que $f''$ troca de sinal em ambos.`,
  2,
  () => {
    const f = (x) => x ** 4 - 4 * x ** 3 + 10;
    return bissecao((x) => d2(f, x, 1e-2), 1, 4) - bissecao((x) => d2(f, x, 1e-2), -2, 1);
  },
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "Abscissa do ponto de inflexão com fator exponencial", "medio",
  R`Determine a abscissa do único ponto de inflexão do gráfico de $f(x)=xe^{x}$.`,
  R`$-2$`,
  [R`$-1$`, R`$0$`, R`$1$`, R`$2$`],
  R`Derivando, $f'(x)=\left(1+x\right)e^{x}$ e $f''(x)=\left(2+x\right)e^{x}$. Como $e^{x}>0$ sempre, $f''$ troca de sinal apenas em $x=-2$, que é, portanto, o único ponto de inflexão (em $x=-1$ há mínimo, não inflexão).`,
  -2,
  () => bissecao((x) => d2((t) => t * Math.exp(t), x, 1e-3), -5, 0)
);

q(
  "Aplicações da Derivada", "Facho de farol varrendo uma praia reta", "dificil",
  R`Um farol situado a $1$ km de uma praia reta gira a $3$ voltas por minuto. Determine, em km/min, a velocidade com que o facho de luz varre a praia no ponto mais próximo do farol.`,
  R`$6\pi$`,
  [R`$3\pi$`, R`$12\pi$`, R`$2\pi$`, R`$9\pi$`],
  R`Se $\theta$ é o ângulo entre a perpendicular à praia e o facho, o ponto iluminado fica em $x=\operatorname{tg}\theta$, logo $\dfrac{dx}{dt}=\sec^{2}\theta\dfrac{d\theta}{dt}$. No ponto mais próximo, $\theta=0$ e $\sec^{2}\theta=1$. Como $3$ voltas por minuto valem $\dfrac{d\theta}{dt}=6\pi$ rad/min, a velocidade é $6\pi$ km/min.`,
  6 * Math.PI,
  () => d1(Math.tan, 0) * (3 * 2 * Math.PI)
);

q(
  "Aplicações da Derivada", "Retângulo de área máxima sob uma parábola", "dificil",
  R`Um retângulo tem a base sobre o eixo $x$ e os dois vértices superiores sobre a parábola $y=12-x^{2}$. Determine sua maior área possível.`,
  R`$32$`,
  [R`$16$`, R`$24$`, R`$36$`, R`$48$`],
  R`Com o vértice superior direito em $\left(x,12-x^{2}\right)$, a base mede $2x$ e a área é $A(x)=2x\left(12-x^{2}\right)=24x-2x^{3}$, com $0<x<2\sqrt{3}$. De $A'(x)=24-6x^{2}=0$ vem $x=2$, e $A''<0$ ali. A área máxima é $A(2)=4\cdot8=32$.`,
  32,
  () => extremo((x) => 2 * x * (12 - x * x), 0, 2 * Math.sqrt(3), "max").valor,
  { tol: 1e-3 }
);

q(
  "Aplicações da Derivada", "L'Hospital com exponencial e termo linear", "medio",
  R`Calcule $\displaystyle\lim_{x\to0}\dfrac{e^{2x}-1-2x}{x^{2}}$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$\dfrac{1}{2}$`, R`$\dfrac{3}{2}$`],
  R`É uma indeterminação $\dfrac{0}{0}$. Uma aplicação de L'Hospital dá $\dfrac{2e^{2x}-2}{2x}$, ainda $\dfrac{0}{0}$; a segunda dá $\dfrac{4e^{2x}}{2}\to2$. O mesmo se lê no desenvolvimento $e^{2x}=1+2x+2x^{2}+\cdots$, cujo primeiro termo restante é $2x^{2}$.`,
  2,
  () => limite((x) => (Math.exp(2 * x) - 1 - 2 * x) / (x * x), 0, 1)
);

finalizar("calculo1_lote6.json", 20260913);
