// Gerador do lote 2 de Fundamentos de Cálculo e Geometria — nível
// universitário. Funções no estilo Stewart (Pré-cálculo) e a parte de vetores
// e geometria analítica no estilo Boulos & Camargo. Todas computacionais.
// Rode: node listas_questoes/gerado/scripts/fcg_lote2.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Fundamentos de Cálculo e Geometria";

const q = (topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao) => ({
  materia: MATERIA,
  topico,
  subtopico,
  dificuldade,
  enunciado,
  alternativas,
  gabarito,
  resolucao,
  instituicao: null,
  ano: null,
  tikz_code: null,
});

const questoes = [
  q(
    "Funções em R",
    "Domínio de função",
    "facil",
    R`Determine o domínio da função $f(x)=\dfrac{\sqrt{x-1}}{x-3}$.`,
    {
      a: R`$[1,\infty)$`,
      b: R`$[1,3)\cup(3,\infty)$`,
      c: R`$(1,3)\cup(3,\infty)$`,
      d: R`$(-\infty,1]\cup(3,\infty)$`,
      e: R`$\mathbb{R}\setminus\{3\}$`,
    },
    "b",
    R`O radicando exige $x-1\ge 0$, ou seja, $x\ge 1$ (note que $x=1$ é permitido, pois o numerador pode ser zero). O denominador exige $x\neq 3$. Interceptando as duas condições, o domínio é $[1,3)\cup(3,\infty)$.`
  ),
  q(
    "Funções em R",
    "Inequação modular",
    "facil",
    R`Resolva a inequação $\left|2x-3\right|<5$.`,
    {
      a: R`$(-4,1)$`,
      b: R`$[-1,4]$`,
      c: R`$(-\infty,-1)\cup(4,\infty)$`,
      d: R`$(-1,4)$`,
      e: R`$(1,4)$`,
    },
    "d",
    R`A desigualdade $\left|A\right|<k$ com $k>0$ equivale a $-k<A<k$. Assim $-5<2x-3<5$. Somando $3$: $-2<2x<8$. Dividindo por $2$: $-1<x<4$, isto é, o intervalo aberto $(-1,4)$.`
  ),
  q(
    "Funções em R",
    "Fatoração de polinômio",
    "medio",
    R`Determine a maior raiz real do polinômio $p(x)=x^3-4x^2+x+6$.`,
    { a: R`$3$`, b: R`$2$`, c: R`$6$`, d: R`$-1$`, e: R`$1$` },
    "a",
    R`Pelo teorema das raízes racionais, testamos os divisores de $6$. Como $p(-1)=-1-4-1+6=0$, o fator $(x+1)$ divide $p$. A divisão dá $p(x)=(x+1)\left(x^2-5x+6\right)=(x+1)(x-2)(x-3)$. As raízes são $-1$, $2$ e $3$, e a maior é $3$.`
  ),
  q(
    "Funções em R",
    "Equação trigonométrica",
    "medio",
    R`Determine quantas soluções a equação $2\operatorname{sen}^2x+\operatorname{sen}x-1=0$ possui no intervalo $[0,2\pi)$.`,
    { a: R`$1$`, b: R`$2$`, c: R`$3$`, d: R`$4$`, e: R`$5$` },
    "c",
    R`Fazendo $t=\operatorname{sen}x$, temos $2t^2+t-1=(2t-1)(t+1)=0$, ou seja, $t=\dfrac12$ ou $t=-1$. De $\operatorname{sen}x=\dfrac12$ vêm $x=\dfrac{\pi}{6}$ e $x=\dfrac{5\pi}{6}$; de $\operatorname{sen}x=-1$ vem $x=\dfrac{3\pi}{2}$. São $3$ soluções.`
  ),
  q(
    "Funções em R",
    "Equação exponencial",
    "facil",
    R`Resolva a equação $3^{2x-1}=27^{x+1}$.`,
    { a: R`$4$`, b: R`$-2$`, c: R`$2$`, d: R`$-1$`, e: R`$-4$` },
    "e",
    R`Escrevendo tudo na base $3$: $27^{x+1}=\left(3^3\right)^{x+1}=3^{3x+3}$. Como a função exponencial é injetora, $2x-1=3x+3$, de onde $x=-4$.`
  ),
  q(
    "Funções em R",
    "Composição de funções",
    "medio",
    R`Sejam $f(x)=2x+1$ e $g(x)=x^2-3$. Calcule $(f\circ g)(2)+(g\circ f)(2)$.`,
    { a: R`$25$`, b: R`$22$`, c: R`$3$`, d: R`$28$`, e: R`$19$` },
    "a",
    R`Primeiro, $g(2)=4-3=1$, logo $(f\circ g)(2)=f(1)=3$. Depois, $f(2)=5$, logo $(g\circ f)(2)=g(5)=25-3=22$. A soma é $3+22=25$.`
  ),
  q(
    "Função Inversa",
    "Inversa de função homográfica",
    "medio",
    R`Seja $f(x)=\dfrac{2x+1}{x-3}$, definida para $x\neq 3$. Calcule $f^{-1}(3)$.`,
    { a: R`$7$`, b: R`$5$`, c: R`$4$`, d: R`$10$`, e: R`$1$` },
    "d",
    R`Basta resolver $f(x)=3$: $\dfrac{2x+1}{x-3}=3\Rightarrow 2x+1=3x-9\Rightarrow x=10$. Conferindo, $f(10)=\dfrac{21}{7}=3$. (Em geral, $f^{-1}(x)=\dfrac{3x+1}{x-2}$.)`
  ),
  q(
    "Função Inversa",
    "Inversa de função cúbica",
    "facil",
    R`Seja $f(x)=x^3+1$, bijetora de $\mathbb{R}$ em $\mathbb{R}$. Calcule $f^{-1}(9)$.`,
    { a: R`$3$`, b: R`$2$`, c: R`$8$`, d: R`$10$`, e: R`$512$` },
    "b",
    R`Procuramos $x$ com $x^3+1=9$, ou seja, $x^3=8$ e $x=2$. Logo $f^{-1}(9)=2$.`
  ),
  q(
    "Função Inversa",
    "Relação entre logaritmo e exponencial",
    "medio",
    R`Resolva a equação $\log_2(x-1)+\log_2(x+1)=3$.`,
    { a: R`$2$`, b: R`$4$`, c: R`$9$`, d: R`$-3$`, e: R`$3$` },
    "e",
    R`O domínio exige $x>1$. Somando os logaritmos, $\log_2\left[(x-1)(x+1)\right]=\log_2\left(x^2-1\right)=3$, ou seja, $x^2-1=2^3=8$, de onde $x^2=9$ e $x=\pm 3$. A raiz $x=-3$ é descartada pelo domínio, restando $x=3$.`
  ),
  q(
    "Função Inversa",
    "Funções hiperbólicas",
    "medio",
    R`Sabendo que $\operatorname{senh}x=\dfrac{e^{x}-e^{-x}}{2}$, calcule $\operatorname{senh}(\ln 2)$.`,
    { a: R`$\dfrac{3}{4}$`, b: R`$\dfrac{5}{4}$`, c: R`$\dfrac{1}{2}$`, d: R`$\dfrac{3}{2}$`, e: R`$1$` },
    "a",
    R`Como $e^{\ln 2}=2$ e $e^{-\ln 2}=\dfrac12$, temos $\operatorname{senh}(\ln 2)=\dfrac{2-\frac12}{2}=\dfrac{3/2}{2}=\dfrac34$.`
  ),
  q(
    "Função Inversa",
    "Trigonométricas inversas",
    "medio",
    R`Calcule $\operatorname{sen}\left[\arccos\left(\dfrac{3}{5}\right)\right]$.`,
    { a: R`$\dfrac{3}{5}$`, b: R`$\dfrac{5}{3}$`, c: R`$\dfrac{4}{5}$`, d: R`$\dfrac{5}{4}$`, e: R`$1$` },
    "c",
    R`Seja $\theta=\arccos\left(\tfrac35\right)$, com $\theta\in[0,\pi]$, de modo que $\operatorname{sen}\theta\ge 0$. Da identidade fundamental, $\operatorname{sen}\theta=\sqrt{1-\cos^2\theta}=\sqrt{1-\dfrac{9}{25}}=\sqrt{\dfrac{16}{25}}=\dfrac45$.`
  ),
  q(
    "Função Inversa",
    "Exponencial e logaritmo como inversas",
    "medio",
    R`Sejam $f(x)=2^{x}$ e $g(x)=\log_2 x$. Calcule $f\left[g(5)+g(3)\right]$.`,
    { a: R`$8$`, b: R`$5$`, c: R`$2$`, d: R`$15$`, e: R`$32$` },
    "d",
    R`Pela propriedade da soma de logaritmos, $g(5)+g(3)=\log_2 5+\log_2 3=\log_2 15$. Como $f$ e $g$ são inversas, $f\left(\log_2 15\right)=2^{\log_2 15}=15$.`
  ),
  q(
    "Classes de Funções e seus Gráficos",
    "Função par e função ímpar",
    "facil",
    R`Seja $f$ uma função par e $g$ uma função ímpar, com $f(3)=5$ e $g(3)=-2$. Calcule $f(-3)\cdot g(-3)$.`,
    { a: R`$-10$`, b: R`$10$`, c: R`$3$`, d: R`$-3$`, e: R`$7$` },
    "b",
    R`Por definição, $f$ par satisfaz $f(-x)=f(x)$, logo $f(-3)=5$. E $g$ ímpar satisfaz $g(-x)=-g(x)$, logo $g(-3)=-(-2)=2$. O produto é $5\cdot 2=10$.`
  ),
  q(
    "Classes de Funções e seus Gráficos",
    "Translação de gráfico",
    "facil",
    R`O gráfico de $y=x^2$ é transladado $3$ unidades para a direita e $2$ unidades para baixo. Determine a ordenada do ponto do novo gráfico cuja abscissa é $x=5$.`,
    { a: R`$4$`, b: R`$23$`, c: R`$6$`, d: R`$-2$`, e: R`$2$` },
    "e",
    R`Transladar $h$ unidades para a direita substitui $x$ por $x-h$; transladar $k$ para baixo subtrai $k$. O novo gráfico é $y=(x-3)^2-2$. Em $x=5$: $y=(2)^2-2=2$.`
  ),
  q(
    "Classes de Funções e seus Gráficos",
    "Homotetia e compressão horizontal",
    "medio",
    R`Uma função $f$ atinge seu valor máximo em $x=6$. Seja $g(x)=3f(2x)$. Determine a abscissa em que $g$ atinge seu valor máximo.`,
    { a: R`$3$`, b: R`$6$`, c: R`$12$`, d: R`$2$`, e: R`$4$` },
    "a",
    R`O fator $3$ multiplica os valores, mas não muda onde o máximo ocorre. Já $f(2x)$ comprime o gráfico horizontalmente por um fator $2$: $g$ assume em $x$ o valor que $f$ assume em $2x$. O máximo de $g$ ocorre quando $2x=6$, ou seja, em $x=3$.`
  ),
  q(
    "Classes de Funções e seus Gráficos",
    "Função limitada",
    "facil",
    R`Determine o valor máximo da função $f(x)=5-3\cos(2x)$.`,
    { a: R`$5$`, b: R`$2$`, c: R`$8$`, d: R`$3$`, e: R`$11$` },
    "c",
    R`Como $-1\le\cos(2x)\le 1$, temos $-3\le -3\cos(2x)\le 3$, logo $2\le f(x)\le 8$. O máximo é $8$, atingido quando $\cos(2x)=-1$.`
  ),
  q(
    "Classes de Funções e seus Gráficos",
    "Crescimento e vértice de parábola",
    "facil",
    R`Determine o valor mínimo da função $f(x)=x^2-6x+5$.`,
    { a: R`$5$`, b: R`$3$`, c: R`$-5$`, d: R`$-4$`, e: R`$4$` },
    "d",
    R`Completando o quadrado, $f(x)=\left(x^2-6x+9\right)-9+5=(x-3)^2-4$. Como $(x-3)^2\ge 0$, o mínimo é $-4$, atingido em $x=3$ (a função é decrescente antes desse ponto e crescente depois).`
  ),
  q(
    "Classes de Funções e seus Gráficos",
    "Reflexão e translação combinadas",
    "medio",
    R`Seja $f(x)=\left|x\right|$ e $h(x)=-f(x-1)+2$. Calcule $h(4)$.`,
    { a: R`$1$`, b: R`$-1$`, c: R`$5$`, d: R`$-5$`, e: R`$3$` },
    "b",
    R`Aplicando a definição, $h(4)=-f(4-1)+2=-\left|3\right|+2=-3+2=-1$. Geometricamente, o gráfico de $f$ foi transladado $1$ à direita, refletido em relação ao eixo $x$ e subido $2$ unidades.`
  ),
  q(
    "Vetores e Retas no Plano",
    "Equação da circunferência",
    "facil",
    R`Determine o raio da circunferência de equação $x^2+y^2-6x+8y=0$.`,
    { a: R`$5$`, b: R`$25$`, c: R`$10$`, d: R`$\sqrt7$`, e: R`$3$` },
    "a",
    R`Completando quadrados: $\left(x^2-6x+9\right)+\left(y^2+8y+16\right)=0+9+16$, ou seja, $(x-3)^2+(y+4)^2=25$. O centro é $(3,-4)$ e o raio é $\sqrt{25}=5$.`
  ),
  q(
    "Vetores e Retas no Plano",
    "Ângulo entre vetores pelo produto escalar",
    "medio",
    R`Determine o ângulo entre os vetores $\vec{u}=(2,1)$ e $\vec{v}=(1,3)$.`,
    { a: R`$30^{\circ}$`, b: R`$60^{\circ}$`, c: R`$45^{\circ}$`, d: R`$90^{\circ}$`, e: R`$135^{\circ}$` },
    "c",
    R`O produto escalar é $\vec{u}\cdot\vec{v}=2+3=5$, e os módulos são $\left|\vec{u}\right|=\sqrt5$ e $\left|\vec{v}\right|=\sqrt{10}$. Assim $\cos\theta=\dfrac{5}{\sqrt5\sqrt{10}}=\dfrac{5}{5\sqrt2}=\dfrac{\sqrt2}{2}$, de onde $\theta=45^{\circ}$.`
  ),
  q(
    "Vetores e Retas no Plano",
    "Projeção ortogonal de vetores",
    "medio",
    R`Determine o módulo da projeção ortogonal de $\vec{u}=(5,1)$ sobre $\vec{v}=(3,4)$.`,
    { a: R`$\dfrac{19}{25}$`, b: R`$5$`, c: R`$19$`, d: R`$\dfrac{3}{5}$`, e: R`$\dfrac{19}{5}$` },
    "e",
    R`O módulo da projeção de $\vec{u}$ sobre $\vec{v}$ é $\dfrac{\left|\vec{u}\cdot\vec{v}\right|}{\left|\vec{v}\right|}$. Aqui $\vec{u}\cdot\vec{v}=15+4=19$ e $\left|\vec{v}\right|=\sqrt{9+16}=5$, logo o módulo é $\dfrac{19}{5}$.`
  ),
  q(
    "Vetores e Retas no Plano",
    "Área de paralelogramo no plano",
    "facil",
    R`Determine a área do paralelogramo determinado pelos vetores $\vec{u}=(3,1)$ e $\vec{v}=(2,5)$.`,
    { a: R`$17$`, b: R`$13$`, c: R`$11$`, d: R`$26$`, e: R`$\dfrac{13}{2}$` },
    "b",
    R`No plano, a área do paralelogramo é o módulo do determinante formado pelas coordenadas: $\left|\begin{matrix}3&1\\2&5\end{matrix}\right|=15-2=13$. Logo a área é $13$ (a do triângulo correspondente seria $\tfrac{13}{2}$).`
  ),
  q(
    "Vetores e Retas no Plano",
    "Perpendicularismo entre retas",
    "medio",
    R`Determine a equação da reta que passa por $(2,3)$ e é perpendicular à reta $3x-4y=5$.`,
    {
      a: R`$3x+4y=18$`,
      b: R`$4x-3y=-1$`,
      c: R`$3x-4y=-6$`,
      d: R`$4x+3y=17$`,
      e: R`$4x+3y=11$`,
    },
    "d",
    R`A reta dada tem coeficiente angular $\dfrac34$, então a perpendicular tem coeficiente $-\dfrac43$. Por $(2,3)$: $y-3=-\dfrac43(x-2)$, ou seja, $3y-9=-4x+8$, isto é, $4x+3y=17$. Conferindo o ponto: $8+9=17$.`
  ),
  q(
    "Vetores e Retas no Plano",
    "Distância de ponto a reta",
    "facil",
    R`Determine a distância do ponto $(1,2)$ à reta $3x+4y-10=0$.`,
    { a: R`$\dfrac{1}{5}$`, b: R`$\dfrac{2}{5}$`, c: R`$1$`, d: R`$\dfrac{3}{5}$`, e: R`$5$` },
    "a",
    R`Pela fórmula $d=\dfrac{\left|ax_0+by_0+c\right|}{\sqrt{a^2+b^2}}$: $d=\dfrac{\left|3(1)+4(2)-10\right|}{\sqrt{9+16}}=\dfrac{\left|3+8-10\right|}{5}=\dfrac{1}{5}$.`
  ),
  q(
    "Vetores no Espaço e Geometria Sólida",
    "Equação da esfera",
    "facil",
    R`Determine o raio da esfera de equação $x^2+y^2+z^2-2x+4y-6z=11$.`,
    { a: R`$\sqrt{14}$`, b: R`$3$`, c: R`$5$`, d: R`$25$`, e: R`$11$` },
    "c",
    R`Completando os três quadrados: $(x-1)^2+(y+2)^2+(z-3)^2=11+1+4+9=25$. O centro é $(1,-2,3)$ e o raio é $\sqrt{25}=5$.`
  ),
  q(
    "Vetores no Espaço e Geometria Sólida",
    "Produto vetorial e área de triângulo",
    "medio",
    R`Determine a área do triângulo determinado pelos vetores $\vec{u}=(1,2,3)$ e $\vec{v}=(2,-1,1)$.`,
    { a: R`$\dfrac{5\sqrt3}{2}$`, b: R`$5\sqrt3$`, c: R`$\dfrac{5\sqrt3}{4}$`, d: R`$\dfrac{15}{2}$`, e: R`$25\sqrt3$` },
    "a",
    R`O produto vetorial é $\vec{u}\times\vec{v}=\left(2\cdot 1-3\cdot(-1),\ 3\cdot 2-1\cdot 1,\ 1\cdot(-1)-2\cdot 2\right)=(5,5,-5)$, de módulo $\sqrt{75}=5\sqrt3$. Esse é o valor da área do paralelogramo; a do triângulo é a metade: $\dfrac{5\sqrt3}{2}$.`
  ),
  q(
    "Vetores no Espaço e Geometria Sólida",
    "Produto misto e volume",
    "medio",
    R`Determine o volume do paralelepípedo determinado por $\vec{u}=(1,0,2)$, $\vec{v}=(0,3,1)$ e $\vec{w}=(2,1,0)$.`,
    { a: R`$11$`, b: R`$15$`, c: R`$7$`, d: R`$26$`, e: R`$13$` },
    "e",
    R`O volume é o módulo do produto misto, isto é, do determinante $\begin{vmatrix}1&0&2\\0&3&1\\2&1&0\end{vmatrix}=1(0-1)-0(0-2)+2(0-6)=-1-12=-13$. Portanto o volume é $\left|-13\right|=13$.`
  ),
  q(
    "Vetores no Espaço e Geometria Sólida",
    "Equação do plano",
    "facil",
    R`Determine a equação do plano que passa pelo ponto $(1,2,3)$ e tem vetor normal $\vec{n}=(2,-1,4)$.`,
    {
      a: R`$2x-y+4z=0$`,
      b: R`$2x-y+4z=12$`,
      c: R`$x+2y+3z=12$`,
      d: R`$2x-y+4z=9$`,
      e: R`$2x+y+4z=16$`,
    },
    "b",
    R`O plano de normal $(a,b,c)$ por $\left(x_0,y_0,z_0\right)$ é $a\left(x-x_0\right)+b\left(y-y_0\right)+c\left(z-z_0\right)=0$. Aqui $2(x-1)-1(y-2)+4(z-3)=0$, ou seja, $2x-y+4z=2-2+12=12$.`
  ),
  q(
    "Vetores no Espaço e Geometria Sólida",
    "Ângulo entre planos",
    "medio",
    R`Determine o cosseno do ângulo agudo entre os planos $x+y+z=1$ e $x+y=2$.`,
    { a: R`$\dfrac{\sqrt3}{3}$`, b: R`$\dfrac{\sqrt2}{2}$`, c: R`$\dfrac{2}{3}$`, d: R`$\dfrac{\sqrt6}{3}$`, e: R`$\dfrac{1}{2}$` },
    "d",
    R`O ângulo entre planos é o ângulo entre suas normais, $\vec{n}_1=(1,1,1)$ e $\vec{n}_2=(1,1,0)$. Então $\cos\theta=\dfrac{\left|\vec{n}_1\cdot\vec{n}_2\right|}{\left|\vec{n}_1\right|\left|\vec{n}_2\right|}=\dfrac{2}{\sqrt3\sqrt2}=\dfrac{2}{\sqrt6}=\dfrac{\sqrt6}{3}$.`
  ),
  q(
    "Vetores no Espaço e Geometria Sólida",
    "Esfera inscrita em cilindro",
    "medio",
    R`Uma esfera de raio $3$ está inscrita em um cilindro circular reto (tangenciando a superfície lateral e as duas bases). Determine a razão entre o volume da esfera e o volume do cilindro.`,
    { a: R`$\dfrac{1}{2}$`, b: R`$\dfrac{3}{4}$`, c: R`$\dfrac{2}{3}$`, d: R`$\dfrac{1}{3}$`, e: R`$\dfrac{4}{3}$` },
    "c",
    R`O cilindro tem raio $3$ e altura igual ao diâmetro, $6$. Então $V_{cil}=\pi(3)^2(6)=54\pi$ e $V_{esf}=\dfrac43\pi(3)^3=36\pi$. A razão é $\dfrac{36\pi}{54\pi}=\dfrac23$ — resultado clássico de Arquimedes, válido para qualquer raio.`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "fcg_lote2.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
