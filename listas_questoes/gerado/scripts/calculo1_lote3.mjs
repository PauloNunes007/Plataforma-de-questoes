// Lote 3 de Cálculo I — reforço dos tópicos 2 a 11 (Limites já tem 53
// questões no banco e fica de fora). Estilo Guidorizzi / Stewart.
// Rode: node listas_questoes/gerado/scripts/calculo1_lote3.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Cálculo I";

const q = (topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao) => ({
  materia: MATERIA, topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao,
  instituicao: null, ano: null, tikz_code: null,
});

const questoes = [
  q("Continuidade", "Prolongamento contínuo", "facil",
    R`Seja $f(x)=\dfrac{x^3-8}{x-2}$ para $x\neq 2$ e $f(2)=a$. Determine $a$ para que $f$ seja contínua em $x=2$.`,
    { a: R`$4$`, b: R`$6$`, c: R`$8$`, d: R`$12$`, e: R`$0$` }, "d",
    R`Fatorando a diferença de cubos, $x^3-8=(x-2)\left(x^2+2x+4\right)$. Para $x\neq 2$ vale $f(x)=x^2+2x+4$, cujo limite em $x=2$ é $4+4+4=12$. A continuidade exige $a=12$.`),

  q("Continuidade", "Teorema do Valor Intermediário e contagem de raízes", "medio",
    R`Quantas raízes reais a equação $x^4-4x+1=0$ possui no intervalo $[0,2]$?`,
    { a: R`$1$`, b: R`$2$`, c: R`$0$`, d: R`$3$`, e: R`$4$` }, "b",
    R`Seja $f(x)=x^4-4x+1$. Temos $f(0)=1>0$, $f(1)=-2<0$ e $f(2)=9>0$: pelo TVI há pelo menos uma raiz em $(0,1)$ e outra em $(1,2)$. Como $f'(x)=4x^3-4$ se anula apenas em $x=1$ dentro de $[0,2]$, a função é monótona em cada subintervalo e não pode ter mais raízes. São exatamente $2$.`),

  q("A Derivada", "Definição de derivada com radical", "medio",
    R`Usando a definição de derivada, calcule $f'(1)$ para $f(x)=\sqrt{3x+1}$.`,
    { a: R`$\dfrac{3}{4}$`, b: R`$\dfrac{3}{2}$`, c: R`$\dfrac{1}{4}$`, d: R`$\dfrac{2}{3}$`, e: R`$3$` }, "a",
    R`Pela definição, $f'(1)=\lim_{h\to0}\dfrac{\sqrt{4+3h}-2}{h}$. Multiplicando pelo conjugado: $\dfrac{(4+3h)-4}{h\left(\sqrt{4+3h}+2\right)}=\dfrac{3}{\sqrt{4+3h}+2}$. Fazendo $h\to 0$, obtém-se $\dfrac{3}{4}$.`),

  q("A Derivada", "Reta normal ao gráfico", "medio",
    R`Determine a ordenada do ponto em que a reta normal ao gráfico de $y=x^2+1$ no ponto $(1,2)$ intercepta o eixo $y$.`,
    { a: R`$2$`, b: R`$\dfrac{3}{2}$`, c: R`$\dfrac{5}{2}$`, d: R`$-\dfrac{5}{2}$`, e: R`$5$` }, "c",
    R`Como $y'=2x$, a tangente em $(1,2)$ tem inclinação $2$ e a normal, $-\dfrac12$. A normal é $y-2=-\dfrac12(x-1)$, ou seja, $y=-\dfrac{x}{2}+\dfrac52$. Em $x=0$: $y=\dfrac52$.`),

  q("Cálculo das Derivadas", "Regra do quociente com identidades trigonométricas", "medio",
    R`Seja $f(x)=\dfrac{\operatorname{sen}x}{1+\cos x}$. Calcule $f'\!\left(\dfrac{\pi}{3}\right)$.`,
    { a: R`$\dfrac{1}{2}$`, b: R`$\dfrac{1}{3}$`, c: R`$\dfrac{3}{2}$`, d: R`$1$`, e: R`$\dfrac{2}{3}$` }, "e",
    R`Pela regra do quociente, $f'(x)=\dfrac{\cos x(1+\cos x)+\operatorname{sen}^2x}{(1+\cos x)^2}$. Usando $\cos^2x+\operatorname{sen}^2x=1$, o numerador vira $1+\cos x$, e portanto $f'(x)=\dfrac{1}{1+\cos x}$. Em $x=\dfrac{\pi}{3}$, com $\cos=\dfrac12$: $f'=\dfrac{1}{3/2}=\dfrac23$.`),

  q("Cálculo das Derivadas", "Derivação implícita em cônica", "medio",
    R`A curva $x^2+xy+y^2=7$ passa pelo ponto $(1,2)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
    { a: R`$-\dfrac{5}{4}$`, b: R`$-\dfrac{4}{5}$`, c: R`$\dfrac{4}{5}$`, d: R`$-1$`, e: R`$-\dfrac{2}{5}$` }, "b",
    R`Derivando implicitamente: $2x+y+xy'+2yy'=0$, logo $y'(x+2y)=-(2x+y)$ e $y'=-\dfrac{2x+y}{x+2y}$. Em $(1,2)$: $y'=-\dfrac{2+2}{1+4}=-\dfrac45$.`),

  q("Cálculo das Derivadas", "Derivada segunda de produto", "dificil",
    R`Seja $f(x)=e^{-x}\operatorname{sen}x$. Calcule $f''(0)$.`,
    { a: R`$0$`, b: R`$2$`, c: R`$-1$`, d: R`$-2$`, e: R`$1$` }, "d",
    R`Derivando, $f'(x)=e^{-x}\left(\cos x-\operatorname{sen}x\right)$. Derivando de novo: $f''(x)=e^{-x}\left(-\operatorname{sen}x-\cos x\right)-e^{-x}\left(\cos x-\operatorname{sen}x\right)=-2e^{-x}\cos x$. Em $x=0$: $f''(0)=-2$.`),

  q("Aplicações da Derivada", "Taxas relacionadas com volume", "medio",
    R`Um balão esférico é inflado à taxa constante de $100$ cm³/s. Determine a taxa de variação do raio no instante em que ele mede $5{,}0$ cm.`,
    { a: R`$\dfrac{1}{\pi}$ cm/s`, b: R`$\dfrac{1}{2\pi}$ cm/s`, c: R`$\pi$ cm/s`, d: R`$\dfrac{4}{\pi}$ cm/s`, e: R`$\dfrac{2}{\pi}$ cm/s` }, "a",
    R`De $V=\dfrac43\pi r^3$ segue $\dfrac{dV}{dt}=4\pi r^2\dfrac{dr}{dt}$. Com $\dfrac{dV}{dt}=100$ e $r=5$: $100=4\pi(25)\dfrac{dr}{dt}=100\pi\dfrac{dr}{dt}$, de onde $\dfrac{dr}{dt}=\dfrac{1}{\pi}$ cm/s.`),

  q("Aplicações da Derivada", "Otimização com restrição geométrica", "dificil",
    R`Determine a maior área possível de um retângulo inscrito em um semicírculo de raio $2$, com um dos lados sobre o diâmetro.`,
    { a: R`$2$`, b: R`$2\sqrt2$`, c: R`$4$`, d: R`$8$`, e: R`$2\pi$` }, "c",
    R`Com o retângulo de base $2x$ e altura $\sqrt{4-x^2}$, a área é $A(x)=2x\sqrt{4-x^2}$. Maximizar $A$ equivale a maximizar $A^2=4x^2\left(4-x^2\right)$. Pondo $u=x^2$, a parábola $4u(4-u)$ tem máximo em $u=2$, onde vale $16$. Logo $A=4$, atingido com $x=\sqrt2$.`),

  q("Aplicações da Derivada", "Regra de L'Hospital em forma infinito menos infinito", "dificil",
    R`Calcule $\lim_{x\to 0}\left(\dfrac{1}{x}-\dfrac{1}{\operatorname{sen}x}\right)$.`,
    { a: R`$1$`, b: R`$\dfrac{1}{2}$`, c: R`$\infty$`, d: R`$-1$`, e: R`$0$` }, "e",
    R`Reduzindo ao mesmo denominador, o limite é $\lim_{x\to0}\dfrac{\operatorname{sen}x-x}{x\operatorname{sen}x}$, da forma $\tfrac00$. Aplicando L'Hospital: $\lim\dfrac{\cos x-1}{\operatorname{sen}x+x\cos x}$, ainda $\tfrac00$. Aplicando de novo: $\lim\dfrac{-\operatorname{sen}x}{2\cos x-x\operatorname{sen}x}=\dfrac{0}{2}=0$.`),

  q("Aplicações da Derivada", "Ponto de inflexão", "medio",
    R`Determine a ordenada do ponto de inflexão do gráfico de $f(x)=x^3-6x^2+9x$.`,
    { a: R`$0$`, b: R`$2$`, c: R`$4$`, d: R`$-2$`, e: R`$6$` }, "b",
    R`Temos $f''(x)=6x-12$, que se anula em $x=2$ e muda de sinal ali (côncava para baixo antes, para cima depois), caracterizando inflexão. A ordenada é $f(2)=8-24+18=2$.`),

  q("Integral Definida", "Soma de Riemann com deslocamento", "medio",
    R`Calcule $\lim_{n\to\infty}\displaystyle\sum_{i=1}^{n}\dfrac{1}{n}\left(1+\dfrac{i}{n}\right)^3$.`,
    { a: R`$4$`, b: R`$\dfrac{15}{2}$`, c: R`$\dfrac{5}{4}$`, d: R`$\dfrac{15}{4}$`, e: R`$3$` }, "d",
    R`Com $\Delta x=\dfrac1n$ e $x_i=\dfrac{i}{n}$ em $[0,1]$, a soma é a de Riemann de $f(x)=(1+x)^3$. Logo o limite é $\int_0^1(1+x)^3dx=\left[\dfrac{(1+x)^4}{4}\right]_0^1=\dfrac{16-1}{4}=\dfrac{15}{4}$.`),

  q("Integral Definida", "Paridade do integrando", "facil",
    R`Calcule $\displaystyle\int_{-\pi/2}^{\pi/2}\left(x^5\cos x+3\right)dx$.`,
    { a: R`$3\pi$`, b: R`$0$`, c: R`$6\pi$`, d: R`$3$`, e: R`$\pi$` }, "a",
    R`A função $x^5\cos x$ é ímpar (ímpar vezes par), e o intervalo é simétrico, logo sua integral é nula. Resta $\int_{-\pi/2}^{\pi/2}3\,dx=3\pi$.`),

  q("Integral Indefinida", "Substituição com logaritmo", "medio",
    R`Calcule $\displaystyle\int_1^{e}\dfrac{\ln x}{x}\,dx$.`,
    { a: R`$1$`, b: R`$e$`, c: R`$\dfrac{1}{2}$`, d: R`$2$`, e: R`$\dfrac{e}{2}$` }, "c",
    R`Faça $u=\ln x$, de modo que $du=\dfrac{dx}{x}$. Os limites viram $u(1)=0$ e $u(e)=1$, e a integral fica $\int_0^1 u\,du=\left[\dfrac{u^2}{2}\right]_0^1=\dfrac12$.`),

  q("Integral Indefinida", "TFC com limite superior composto", "dificil",
    R`Seja $F(x)=\displaystyle\int_0^{\operatorname{sen}x}\sqrt{1+t^2}\,dt$. Calcule $F'\!\left(\dfrac{\pi}{6}\right)$.`,
    { a: R`$\dfrac{\sqrt5}{2}$`, b: R`$\dfrac{\sqrt3}{2}$`, c: R`$\dfrac{\sqrt{15}}{2}$`, d: R`$\dfrac{\sqrt5}{4}$`, e: R`$\dfrac{\sqrt{15}}{4}$` }, "e",
    R`Pelo TFC com a regra da cadeia, $F'(x)=\sqrt{1+\operatorname{sen}^2x}\cdot\cos x$. Em $x=\dfrac{\pi}{6}$: $\operatorname{sen}x=\dfrac12$, logo $\sqrt{1+\tfrac14}=\dfrac{\sqrt5}{2}$, e $\cos x=\dfrac{\sqrt3}{2}$. O produto é $\dfrac{\sqrt{15}}{4}$.`),

  q("Aplicações da Integral Definida", "Área entre cúbica e reta", "medio",
    R`Calcule a área da região limitada por $y=x$ e $y=x^3$ no primeiro quadrante.`,
    { a: R`$\dfrac{1}{2}$`, b: R`$\dfrac{1}{4}$`, c: R`$\dfrac{1}{3}$`, d: R`$\dfrac{3}{4}$`, e: R`$\dfrac{1}{12}$` }, "b",
    R`As curvas se cruzam em $x=0$ e $x=1$, e em $(0,1)$ vale $x\ge x^3$. A área é $\int_0^1\left(x-x^3\right)dx=\left[\dfrac{x^2}{2}-\dfrac{x^4}{4}\right]_0^1=\dfrac12-\dfrac14=\dfrac14$.`),

  q("Aplicações da Integral Definida", "Volume pelo método das cascas", "dificil",
    R`A região limitada por $y=x^2$, $y=0$ e $x=2$ gira em torno do eixo $y$. Calcule o volume gerado.`,
    { a: R`$8\pi$`, b: R`$4\pi$`, c: R`$16\pi$`, d: R`$\dfrac{32\pi}{5}$`, e: R`$2\pi$` }, "a",
    R`Pelo método das cascas cilíndricas, $V=2\pi\int_0^2 x\cdot f(x)\,dx=2\pi\int_0^2 x\cdot x^2dx=2\pi\left[\dfrac{x^4}{4}\right]_0^2=2\pi\cdot 4=8\pi$.`),

  q("Função Inversa", "Derivada do arco-seno", "medio",
    R`Seja $y=\operatorname{arcsen}(2x)$. Calcule $\dfrac{dy}{dx}$ em $x=\dfrac14$.`,
    { a: R`$\dfrac{2\sqrt3}{3}$`, b: R`$\dfrac{4}{3}$`, c: R`$2$`, d: R`$\dfrac{4\sqrt3}{3}$`, e: R`$\dfrac{\sqrt3}{3}$` }, "d",
    R`Pela regra da cadeia, $\dfrac{dy}{dx}=\dfrac{2}{\sqrt{1-4x^2}}$. Em $x=\dfrac14$: $4x^2=\dfrac14$, logo $\sqrt{1-\tfrac14}=\dfrac{\sqrt3}{2}$ e $\dfrac{dy}{dx}=\dfrac{2}{\sqrt3/2}=\dfrac{4}{\sqrt3}=\dfrac{4\sqrt3}{3}$.`),

  q("Função Inversa", "Derivada da função logarítmica", "facil",
    R`Seja $f(x)=\ln\left(x^2+1\right)$. Calcule $f'(2)$.`,
    { a: R`$\dfrac{2}{5}$`, b: R`$\dfrac{5}{4}$`, c: R`$\dfrac{4}{5}$`, d: R`$\dfrac{1}{5}$`, e: R`$4$` }, "c",
    R`Pela regra da cadeia, $f'(x)=\dfrac{2x}{x^2+1}$. Em $x=2$: $f'(2)=\dfrac{4}{5}$.`),

  q("Técnicas de Integração", "Integração por partes com logaritmo", "medio",
    R`Calcule $\displaystyle\int_1^{e}\ln x\,dx$.`,
    { a: R`$e$`, b: R`$1$`, c: R`$e-1$`, d: R`$0$`, e: R`$2$` }, "b",
    R`Tome $u=\ln x$ e $dv=dx$, logo $du=\dfrac{dx}{x}$ e $v=x$. Então $\int\ln x\,dx=x\ln x-\int dx=x\ln x-x$. Avaliando: $(e-e)-(0-1)=1$.`),

  q("Técnicas de Integração", "Substituição trigonométrica com arco-seno", "medio",
    R`Calcule $\displaystyle\int_0^{\sqrt3}\dfrac{dx}{\sqrt{4-x^2}}$.`,
    { a: R`$\dfrac{\pi}{3}$`, b: R`$\dfrac{\pi}{6}$`, c: R`$\dfrac{\pi}{2}$`, d: R`$\dfrac{\pi}{4}$`, e: R`$\dfrac{2\pi}{3}$` }, "a",
    R`Com $x=2\operatorname{sen}\theta$ obtém-se a primitiva $\operatorname{arcsen}\dfrac{x}{2}$. Avaliando de $0$ a $\sqrt3$: $\operatorname{arcsen}\dfrac{\sqrt3}{2}-\operatorname{arcsen}0=\dfrac{\pi}{3}$.`),

  q("Técnicas de Integração", "Frações parciais com dois fatores lineares", "dificil",
    R`Calcule $\displaystyle\int_0^1\dfrac{x+2}{(x+1)(x+3)}\,dx$.`,
    { a: R`$\ln\dfrac{8}{3}$`, b: R`$\dfrac{1}{2}\ln\dfrac{3}{8}$`, c: R`$\dfrac{1}{2}\ln 8$`, d: R`$\dfrac{1}{2}\ln\dfrac{4}{3}$`, e: R`$\dfrac{1}{2}\ln\dfrac{8}{3}$` }, "e",
    R`Escrevendo $\dfrac{x+2}{(x+1)(x+3)}=\dfrac{A}{x+1}+\dfrac{B}{x+3}$, vem $x+2=A(x+3)+B(x+1)$. Em $x=-1$: $1=2A\Rightarrow A=\tfrac12$; em $x=-3$: $-1=-2B\Rightarrow B=\tfrac12$. Logo a integral é $\dfrac12\left[\ln(x+1)+\ln(x+3)\right]_0^1=\dfrac12\left(\ln 2+\ln 4-\ln 3\right)=\dfrac12\ln\dfrac{8}{3}$.`),

  q("Integral Imprópria", "Integral em toda a semirreta", "facil",
    R`Calcule $\displaystyle\int_0^{\infty}\dfrac{dx}{1+x^2}$, caso convirja.`,
    { a: R`$\pi$`, b: R`$\dfrac{\pi}{4}$`, c: R`$\dfrac{\pi}{2}$`, d: R`$2\pi$`, e: R`divergente` }, "c",
    R`A primitiva é $\operatorname{arctg}x$, logo $\int_0^{b}\dfrac{dx}{1+x^2}=\operatorname{arctg}b$. Fazendo $b\to\infty$, o limite é $\dfrac{\pi}{2}$, e a integral converge.`),

  q("Integral Imprópria", "Singularidade na origem", "medio",
    R`Calcule $\displaystyle\int_0^1\dfrac{dx}{x^{2/3}}$, caso convirja.`,
    { a: R`$1$`, b: R`$\dfrac{3}{2}$`, c: R`$2$`, d: R`$3$`, e: R`divergente` }, "d",
    R`O integrando é ilimitado em $x\to 0^+$, mas o expoente $p=\tfrac23<1$ garante convergência. De fato, $\int_a^1 x^{-2/3}dx=\left[3x^{1/3}\right]_a^1=3-3a^{1/3}$, cujo limite quando $a\to 0^+$ é $3$.`),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "calculo1_lote3.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
