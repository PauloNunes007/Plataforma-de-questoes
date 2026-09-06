// Gerador do lote 2 de Cálculo I — questões autorais, nível universitário,
// estilo Guidorizzi / Stewart. Todas computacionais (resolver conta), com
// alternativas curtas e simétricas (o raciocínio vive só em `resolucao`).
// Rode: node listas_questoes/gerado/scripts/calculo1_lote2.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Cálculo I";

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
    "Continuidade",
    "Descontinuidade removível",
    "facil",
    R`Seja $f(x)=\dfrac{\sqrt{x+2}-2}{x-2}$ para $x\neq 2$ e $f(2)=a$. Determine o valor de $a$ que torna $f$ contínua em $x=2$.`,
    {
      a: R`$\dfrac{1}{2}$`,
      b: R`$1$`,
      c: R`$\dfrac{1}{4}$`,
      d: R`$4$`,
      e: R`$0$`,
    },
    "c",
    R`Para $x\neq 2$, multiplique numerador e denominador pelo conjugado: $\dfrac{\sqrt{x+2}-2}{x-2}\cdot\dfrac{\sqrt{x+2}+2}{\sqrt{x+2}+2}=\dfrac{(x+2)-4}{(x-2)\left(\sqrt{x+2}+2\right)}=\dfrac{x-2}{(x-2)\left(\sqrt{x+2}+2\right)}=\dfrac{1}{\sqrt{x+2}+2}$. Logo $\lim_{x\to 2}f(x)=\dfrac{1}{\sqrt{4}+2}=\dfrac{1}{4}$. A continuidade em $x=2$ exige $f(2)=\lim_{x\to 2}f(x)$, ou seja, $a=\dfrac14$.`
  ),
  q(
    "Continuidade",
    "Função definida por partes",
    "medio",
    R`Considere $f(x)=\begin{cases}3x+a,& x<1\\ x^2-2,& 1\le x<3\\ bx+5,& x\ge 3\end{cases}$. Sabendo que $f$ é contínua em $\mathbb{R}$, calcule $a+b$.`,
    {
      a: R`$-\dfrac{2}{3}$`,
      b: R`$-\dfrac{10}{3}$`,
      c: R`$\dfrac{10}{3}$`,
      d: R`$-4$`,
      e: R`$\dfrac{2}{3}$`,
    },
    "b",
    R`Continuidade em $x=1$: $\lim_{x\to1^-}f(x)=3+a$ e $\lim_{x\to1^+}f(x)=1-2=-1$. Assim $3+a=-1\Rightarrow a=-4$. Continuidade em $x=3$: $\lim_{x\to3^-}f(x)=9-2=7$ e $\lim_{x\to3^+}f(x)=3b+5$. Assim $3b+5=7\Rightarrow b=\dfrac{2}{3}$. Portanto $a+b=-4+\dfrac{2}{3}=-\dfrac{10}{3}$.`
  ),
  q(
    "Continuidade",
    "Extensão contínua e limites trigonométricos",
    "medio",
    R`Sejam $f(x)=\dfrac{\operatorname{sen}(3x)}{x}$ com $f(0)=k$ e $g(x)=\dfrac{1-\cos(2x)}{x^2}$ com $g(0)=m$. Se ambas são contínuas em $x=0$, calcule $k+m$.`,
    {
      a: R`$2$`,
      b: R`$3$`,
      c: R`$4$`,
      d: R`$6$`,
      e: R`$5$`,
    },
    "e",
    R`Para $f$: $\lim_{x\to0}\dfrac{\operatorname{sen}(3x)}{x}=\lim_{x\to0}3\cdot\dfrac{\operatorname{sen}(3x)}{3x}=3\cdot 1=3$, logo $k=3$. Para $g$: use $1-\cos(2x)=2\operatorname{sen}^2(x)$, de onde $\dfrac{1-\cos(2x)}{x^2}=2\left(\dfrac{\operatorname{sen}x}{x}\right)^2\to 2$, logo $m=2$. Portanto $k+m=5$.`
  ),
  q(
    "Continuidade",
    "Teorema do Valor Intermediário",
    "facil",
    R`A função $f(x)=x^3+x-3$ é contínua em $\mathbb{R}$. Em qual dos intervalos abaixo o Teorema do Valor Intermediário garante a existência de uma raiz de $f$?`,
    {
      a: R`$(-1,0)$`,
      b: R`$(0,1)$`,
      c: R`$\left(\dfrac{3}{2},2\right)$`,
      d: R`$\left(1,\dfrac{3}{2}\right)$`,
      e: R`$\left(2,\dfrac{5}{2}\right)$`,
    },
    "d",
    R`Avalie $f$ nos extremos. $f(-1)=-5$, $f(0)=-3$, $f(1)=1+1-3=-1$, $f\!\left(\tfrac32\right)=\tfrac{27}{8}+\tfrac32-3=\tfrac{15}{8}>0$, $f(2)=8+2-3=7$. A única troca de sinal entre os intervalos listados ocorre em $\left(1,\tfrac32\right)$, onde $f(1)<0<f\!\left(\tfrac32\right)$. Pelo TVI, existe $c\in\left(1,\tfrac32\right)$ com $f(c)=0$.`
  ),
  q(
    "A Derivada",
    "Definição de derivada como limite",
    "medio",
    R`Usando exclusivamente a definição $f'(a)=\lim_{h\to 0}\dfrac{f(a+h)-f(a)}{h}$, calcule $f'(1)$ para $f(x)=\dfrac{1}{2x+1}$.`,
    {
      a: R`$-\dfrac{2}{9}$`,
      b: R`$-\dfrac{1}{9}$`,
      c: R`$\dfrac{2}{9}$`,
      d: R`$-\dfrac{2}{3}$`,
      e: R`$-\dfrac{1}{3}$`,
    },
    "a",
    R`Temos $f(1)=\dfrac13$ e $f(1+h)=\dfrac{1}{2h+3}$. Então $\dfrac{f(1+h)-f(1)}{h}=\dfrac{1}{h}\left(\dfrac{1}{2h+3}-\dfrac13\right)=\dfrac{1}{h}\cdot\dfrac{3-(2h+3)}{3(2h+3)}=\dfrac{-2h}{3h(2h+3)}=\dfrac{-2}{3(2h+3)}$. Fazendo $h\to 0$: $f'(1)=\dfrac{-2}{9}$.`
  ),
  q(
    "A Derivada",
    "Reta tangente ao gráfico",
    "medio",
    R`A reta tangente ao gráfico de $y=x^3-3x+1$ no ponto de abscissa positiva em que a tangente é paralela à reta $y=9x$ tem equação $y=9x+n$. Determine $n$.`,
    {
      a: R`$-9$`,
      b: R`$-3$`,
      c: R`$-15$`,
      d: R`$3$`,
      e: R`$15$`,
    },
    "c",
    R`Paralelismo exige $y'=9$. Como $y'=3x^2-3$, temos $3x^2-3=9\Rightarrow x^2=4\Rightarrow x=\pm 2$. A abscissa positiva é $x=2$, onde $y=8-6+1=3$. A tangente é $y-3=9(x-2)$, isto é, $y=9x-15$. Logo $n=-15$.`
  ),
  q(
    "A Derivada",
    "Diferenciabilidade e continuidade",
    "medio",
    R`Seja $f(x)=\begin{cases}x^2,& x\le 1\\ ax+b,& x>1\end{cases}$. Sabendo que $f$ é derivável em $x=1$, calcule o produto $ab$.`,
    {
      a: R`$2$`,
      b: R`$-2$`,
      c: R`$-1$`,
      d: R`$1$`,
      e: R`$3$`,
    },
    "b",
    R`Derivabilidade implica continuidade, logo $1=a+b$. Igualando as derivadas laterais em $x=1$: pela esquerda $\left.2x\right|_{x=1}=2$, pela direita $a$. Assim $a=2$ e $b=1-2=-1$. Portanto $ab=-2$.`
  ),
  q(
    "Cálculo das Derivadas",
    "Regra do produto com regra da cadeia",
    "medio",
    R`Seja $f(x)=x^2\operatorname{sen}(3x)$. Calcule $f'\!\left(\dfrac{\pi}{6}\right)$.`,
    {
      a: R`$\dfrac{\pi}{6}$`,
      b: R`$\dfrac{\pi}{2}$`,
      c: R`$\dfrac{\pi^2}{12}$`,
      d: R`$\dfrac{\pi}{3}$`,
      e: R`$0$`,
    },
    "d",
    R`Pela regra do produto com a cadeia: $f'(x)=2x\operatorname{sen}(3x)+3x^2\cos(3x)$. Em $x=\dfrac{\pi}{6}$ temos $3x=\dfrac{\pi}{2}$, logo $\operatorname{sen}\!\left(\tfrac{\pi}{2}\right)=1$ e $\cos\!\left(\tfrac{\pi}{2}\right)=0$. Assim $f'\!\left(\tfrac{\pi}{6}\right)=2\cdot\dfrac{\pi}{6}\cdot 1+0=\dfrac{\pi}{3}$.`
  ),
  q(
    "Cálculo das Derivadas",
    "Derivação implícita",
    "medio",
    R`A curva $x^3+y^3=6xy$ (fólio de Descartes) passa pelo ponto $(3,3)$. Determine $\dfrac{dy}{dx}$ nesse ponto.`,
    {
      a: R`$-1$`,
      b: R`$1$`,
      c: R`$-3$`,
      d: R`$0$`,
      e: R`$3$`,
    },
    "a",
    R`Derivando implicitamente: $3x^2+3y^2y'=6y+6xy'$. Isolando, $y'\left(3y^2-6x\right)=6y-3x^2$, ou seja, $y'=\dfrac{2y-x^2}{y^2-2x}$. Em $(3,3)$: $y'=\dfrac{6-9}{9-6}=-1$.`
  ),
  q(
    "Cálculo das Derivadas",
    "Derivadas de ordem superior",
    "dificil",
    R`Seja $y=\dfrac{x}{x^2+1}$. Calcule $y''(1)$.`,
    {
      a: R`$\dfrac{1}{2}$`,
      b: R`$-\dfrac{1}{4}$`,
      c: R`$-1$`,
      d: R`$0$`,
      e: R`$-\dfrac{1}{2}$`,
    },
    "e",
    R`Pela regra do quociente, $y'=\dfrac{\left(x^2+1\right)-x\cdot 2x}{\left(x^2+1\right)^2}=\dfrac{1-x^2}{\left(x^2+1\right)^2}$. Derivando de novo com $u=1-x^2$ e $v=\left(x^2+1\right)^2$, temos $u'=-2x$ e $v'=4x\left(x^2+1\right)$, de onde $y''=\dfrac{-2x\left(x^2+1\right)-4x\left(1-x^2\right)}{\left(x^2+1\right)^3}=\dfrac{2x^3-6x}{\left(x^2+1\right)^3}$. Em $x=1$: $y''(1)=\dfrac{2-6}{8}=-\dfrac{1}{2}$.`
  ),
  q(
    "Cálculo das Derivadas",
    "Regra da cadeia com radical e tangente",
    "medio",
    R`Seja $f(x)=\sqrt{1+\operatorname{tg}(2x)}$. Calcule $f'(0)$.`,
    {
      a: R`$\dfrac{1}{2}$`,
      b: R`$1$`,
      c: R`$2$`,
      d: R`$\dfrac{1}{4}$`,
      e: R`$4$`,
    },
    "b",
    R`Aplicando a regra da cadeia duas vezes: $f'(x)=\dfrac{1}{2\sqrt{1+\operatorname{tg}(2x)}}\cdot 2\sec^2(2x)=\dfrac{\sec^2(2x)}{\sqrt{1+\operatorname{tg}(2x)}}$. Em $x=0$: $\operatorname{tg}0=0$ e $\sec^2 0=1$, logo $f'(0)=1$.`
  ),
  q(
    "Aplicações da Derivada",
    "Taxas relacionadas",
    "medio",
    R`Uma escada de $5{,}0$ m está apoiada em uma parede vertical. A base da escada é afastada da parede a $0{,}60$ m/s. Com que rapidez o topo da escada desce no instante em que a base está a $3{,}0$ m da parede?`,
    {
      a: R`$0{,}30$ m/s`,
      b: R`$0{,}60$ m/s`,
      c: R`$0{,}45$ m/s`,
      d: R`$0{,}80$ m/s`,
      e: R`$1{,}25$ m/s`,
    },
    "c",
    R`Com $x$ a distância da base à parede e $y$ a altura do topo, vale $x^2+y^2=25$. Derivando em relação ao tempo: $2x\dfrac{dx}{dt}+2y\dfrac{dy}{dt}=0$. Quando $x=3$, $y=\sqrt{25-9}=4$. Substituindo $\dfrac{dx}{dt}=0{,}60$: $3(0{,}60)+4\dfrac{dy}{dt}=0\Rightarrow\dfrac{dy}{dt}=-0{,}45$ m/s. O sinal negativo indica descida; a rapidez é $0{,}45$ m/s.`
  ),
  q(
    "Aplicações da Derivada",
    "Problemas de otimização",
    "medio",
    R`De uma folha quadrada de $12$ cm de lado recortam-se quadrados iguais nos quatro cantos, dobrando-se as abas para formar uma caixa sem tampa. Qual é o volume máximo, em cm³, dessa caixa?`,
    {
      a: R`$128$`,
      b: R`$96$`,
      c: R`$108$`,
      d: R`$144$`,
      e: R`$160$`,
    },
    "a",
    R`Sendo $x$ o lado do quadrado recortado, $V(x)=x(12-2x)^2$ com $0<x<6$. Derivando: $V'(x)=(12-2x)^2-4x(12-2x)=(12-2x)\left[(12-2x)-4x\right]=(12-2x)(12-6x)$. Os zeros são $x=6$ (descartado) e $x=2$. Como $V'>0$ em $(0,2)$ e $V'<0$ em $(2,6)$, $x=2$ é máximo. Logo $V(2)=2\cdot 8^2=128$ cm³.`
  ),
  q(
    "Aplicações da Derivada",
    "Regra de L'Hospital",
    "medio",
    R`Calcule $\lim_{x\to 0}\dfrac{e^{2x}-1-2x}{x^2}$.`,
    {
      a: R`$0$`,
      b: R`$\dfrac{1}{2}$`,
      c: R`$1$`,
      d: R`$2$`,
      e: R`$4$`,
    },
    "d",
    R`A forma é $\tfrac00$. Primeira aplicação de L'Hospital: $\lim_{x\to0}\dfrac{2e^{2x}-2}{2x}$, ainda $\tfrac00$. Segunda aplicação: $\lim_{x\to0}\dfrac{4e^{2x}}{2}=2$.`
  ),
  q(
    "Aplicações da Derivada",
    "Máximos e mínimos absolutos em intervalo fechado",
    "medio",
    R`Determine o valor máximo absoluto de $f(x)=x^3-3x^2-9x+5$ no intervalo $[-2,4]$.`,
    {
      a: R`$3$`,
      b: R`$5$`,
      c: R`$-15$`,
      d: R`$27$`,
      e: R`$10$`,
    },
    "e",
    R`$f'(x)=3x^2-6x-9=3(x-3)(x+1)$, com pontos críticos $x=-1$ e $x=3$, ambos em $[-2,4]$. Avaliando: $f(-2)=3$; $f(-1)=10$; $f(3)=-22$; $f(4)=-15$. O maior valor é $10$.`
  ),
  q(
    "Aplicações da Derivada",
    "Teorema do Valor Médio",
    "medio",
    R`Seja $f(x)=x^3-x$ em $[0,2]$. Determine o valor de $c\in(0,2)$ garantido pelo Teorema do Valor Médio.`,
    {
      a: R`$\dfrac{\sqrt3}{3}$`,
      b: R`$\dfrac{2\sqrt3}{3}$`,
      c: R`$\dfrac{4}{3}$`,
      d: R`$\dfrac{2}{3}$`,
      e: R`$\sqrt3$`,
    },
    "b",
    R`A taxa média é $\dfrac{f(2)-f(0)}{2-0}=\dfrac{6-0}{2}=3$. O TVM exige $f'(c)=3$, isto é, $3c^2-1=3\Rightarrow c^2=\dfrac43\Rightarrow c=\dfrac{2}{\sqrt3}=\dfrac{2\sqrt3}{3}\approx 1{,}15$, que pertence a $(0,2)$.`
  ),
  q(
    "Integral Definida",
    "Limite de somas de Riemann",
    "medio",
    R`Calcule $\lim_{n\to\infty}\displaystyle\sum_{i=1}^{n}\dfrac{1}{n}\sqrt{\dfrac{i}{n}}$ reconhecendo a soma de Riemann correspondente.`,
    {
      a: R`$\dfrac{1}{3}$`,
      b: R`$\dfrac{1}{2}$`,
      c: R`$\dfrac{2}{3}$`,
      d: R`$1$`,
      e: R`$\dfrac{3}{2}$`,
    },
    "c",
    R`Com a partição uniforme de $[0,1]$, $\Delta x=\dfrac1n$ e $x_i=\dfrac{i}{n}$, a soma é exatamente $\sum_{i=1}^{n}f(x_i)\Delta x$ com $f(x)=\sqrt{x}$. Logo o limite vale $\displaystyle\int_0^1\sqrt{x}\,dx=\left[\dfrac{2}{3}x^{3/2}\right]_0^1=\dfrac{2}{3}$.`
  ),
  q(
    "Integral Definida",
    "Simetria do integrando",
    "facil",
    R`Calcule $\displaystyle\int_{-2}^{2}\left(x^3+3x^2\right)dx$.`,
    {
      a: R`$16$`,
      b: R`$8$`,
      c: R`$0$`,
      d: R`$24$`,
      e: R`$32$`,
    },
    "a",
    R`A função $x^3$ é ímpar e o intervalo é simétrico, logo $\int_{-2}^{2}x^3dx=0$. Resta $\int_{-2}^{2}3x^2dx=\left[x^3\right]_{-2}^{2}=8-(-8)=16$.`
  ),
  q(
    "Integral Definida",
    "Propriedades da integral definida",
    "medio",
    R`Sabendo que $\displaystyle\int_0^3 f(x)\,dx=7$ e $\displaystyle\int_0^5 f(x)\,dx=12$, calcule $\displaystyle\int_3^5\left[2f(x)-3\right]dx$.`,
    {
      a: R`$-2$`,
      b: R`$6$`,
      c: R`$10$`,
      d: R`$4$`,
      e: R`$16$`,
    },
    "d",
    R`Pela aditividade, $\int_3^5 f=\int_0^5 f-\int_0^3 f=12-7=5$. Então $\int_3^5\left[2f(x)-3\right]dx=2\cdot 5-3(5-3)=10-6=4$.`
  ),
  q(
    "Integral Indefinida",
    "Integração por substituição",
    "medio",
    R`Calcule $\displaystyle\int_0^2 2x\sqrt{x^2+1}\,dx$.`,
    {
      a: R`$\dfrac{2}{3}\left(5\sqrt5+1\right)$`,
      b: R`$\dfrac{2}{3}\left(5\sqrt5-1\right)$`,
      c: R`$\dfrac{1}{3}\left(5\sqrt5-1\right)$`,
      d: R`$\dfrac{3}{2}\left(5\sqrt5-1\right)$`,
      e: R`$5\sqrt5-1$`,
    },
    "b",
    R`Faça $u=x^2+1$, de modo que $du=2x\,dx$. Os limites viram $u(0)=1$ e $u(2)=5$. Assim a integral é $\int_1^5 \sqrt{u}\,du=\left[\dfrac{2}{3}u^{3/2}\right]_1^5=\dfrac{2}{3}\left(5\sqrt5-1\right)$.`
  ),
  q(
    "Integral Indefinida",
    "Teorema Fundamental do Cálculo com limite variável",
    "dificil",
    R`Seja $F(x)=\displaystyle\int_1^{x^2}\left(t^3+1\right)dt$. Calcule $F'(2)$.`,
    {
      a: R`$65$`,
      b: R`$68$`,
      c: R`$130$`,
      d: R`$520$`,
      e: R`$260$`,
    },
    "e",
    R`Pela primeira parte do TFC combinada com a regra da cadeia, se $F(x)=\int_1^{g(x)}h(t)\,dt$ então $F'(x)=h\!\left(g(x)\right)g'(x)$. Aqui $h(t)=t^3+1$ e $g(x)=x^2$, logo $F'(x)=\left(x^6+1\right)2x$. Em $x=2$: $F'(2)=65\cdot 4=260$.`
  ),
  q(
    "Integral Indefinida",
    "Teorema do valor médio para integrais",
    "medio",
    R`Seja $f(x)=x^2$ em $[0,3]$. Determine o valor $c\in(0,3)$ dado pelo teorema do valor médio para integrais.`,
    {
      a: R`$\sqrt3$`,
      b: R`$\sqrt2$`,
      c: R`$\dfrac{3}{2}$`,
      d: R`$3$`,
      e: R`$\dfrac{9}{2}$`,
    },
    "a",
    R`O valor médio é $\dfrac{1}{3-0}\int_0^3 x^2dx=\dfrac13\left[\dfrac{x^3}{3}\right]_0^3=3$. O teorema garante $c$ com $f(c)=3$, ou seja, $c^2=3\Rightarrow c=\sqrt3\approx 1{,}73\in(0,3)$.`
  ),
  q(
    "Aplicações da Integral Definida",
    "Área entre duas curvas",
    "medio",
    R`Calcule a área da região limitada pelas curvas $y=x^2$ e $y=2x-x^2$.`,
    {
      a: R`$\dfrac{1}{6}$`,
      b: R`$\dfrac{1}{2}$`,
      c: R`$\dfrac{1}{3}$`,
      d: R`$\dfrac{2}{3}$`,
      e: R`$1$`,
    },
    "c",
    R`As curvas se cruzam quando $x^2=2x-x^2\Rightarrow 2x^2-2x=0\Rightarrow x=0$ ou $x=1$. Em $(0,1)$ vale $2x-x^2\ge x^2$. Logo a área é $\int_0^1\left(2x-2x^2\right)dx=\left[x^2-\dfrac{2x^3}{3}\right]_0^1=1-\dfrac23=\dfrac13$.`
  ),
  q(
    "Aplicações da Integral Definida",
    "Volume de sólido de revolução",
    "facil",
    R`A região limitada por $y=\sqrt{x}$, $y=0$ e $x=4$ gira em torno do eixo $x$. Calcule o volume do sólido gerado.`,
    {
      a: R`$4\pi$`,
      b: R`$8\pi$`,
      c: R`$16\pi$`,
      d: R`$\dfrac{32\pi}{3}$`,
      e: R`$\dfrac{64\pi}{3}$`,
    },
    "b",
    R`Pelo método dos discos, $V=\pi\int_0^4\left(\sqrt{x}\right)^2dx=\pi\int_0^4 x\,dx=\pi\left[\dfrac{x^2}{2}\right]_0^4=8\pi$.`
  ),
  q(
    "Aplicações da Integral Definida",
    "Comprimento de arco",
    "medio",
    R`Calcule o comprimento do arco da curva $y=\dfrac{2}{3}x^{3/2}$ de $x=0$ a $x=3$.`,
    {
      a: R`$\dfrac{7}{3}$`,
      b: R`$\dfrac{8}{3}$`,
      c: R`$\dfrac{16}{3}$`,
      d: R`$\dfrac{14}{3}$`,
      e: R`$\dfrac{28}{3}$`,
    },
    "d",
    R`Como $y'=x^{1/2}$, temos $\sqrt{1+\left(y'\right)^2}=\sqrt{1+x}$. Assim $L=\int_0^3\sqrt{1+x}\,dx=\left[\dfrac{2}{3}(1+x)^{3/2}\right]_0^3=\dfrac{2}{3}\left(8-1\right)=\dfrac{14}{3}$.`
  ),
  q(
    "Função Inversa",
    "Teorema da função inversa",
    "medio",
    R`Seja $f(x)=x^3+2x+1$, que é inversível em $\mathbb{R}$, e seja $g=f^{-1}$. Calcule $g'(4)$.`,
    {
      a: R`$\dfrac{1}{5}$`,
      b: R`$\dfrac{1}{4}$`,
      c: R`$\dfrac{1}{2}$`,
      d: R`$4$`,
      e: R`$5$`,
    },
    "a",
    R`Procure $a$ com $f(a)=4$: $a=1$, pois $1+2+1=4$. Como $f'(x)=3x^2+2$, temos $f'(1)=5$. Pelo teorema da função inversa, $g'(4)=\dfrac{1}{f'\!\left(g(4)\right)}=\dfrac{1}{f'(1)}=\dfrac{1}{5}$.`
  ),
  q(
    "Função Inversa",
    "Derivada de trigonométrica inversa",
    "medio",
    R`Seja $y=\operatorname{arctg}\left(\sqrt{x}\right)$, com $x>0$. Calcule $\dfrac{dy}{dx}$ em $x=1$.`,
    {
      a: R`$\dfrac{1}{8}$`,
      b: R`$\dfrac{1}{2}$`,
      c: R`$\dfrac{1}{4}$`,
      d: R`$1$`,
      e: R`$2$`,
    },
    "c",
    R`Pela regra da cadeia, $\dfrac{dy}{dx}=\dfrac{1}{1+\left(\sqrt{x}\right)^2}\cdot\dfrac{1}{2\sqrt{x}}=\dfrac{1}{2\sqrt{x}\,(1+x)}$. Em $x=1$: $\dfrac{1}{2\cdot 1\cdot 2}=\dfrac{1}{4}$.`
  ),
  q(
    "Função Inversa",
    "Derivação logarítmica",
    "dificil",
    R`Seja $f(x)=x^{\ln x}$, com $x>0$. Calcule $f'(e)$.`,
    {
      a: R`$1$`,
      b: R`$e$`,
      c: R`$\dfrac{2}{e}$`,
      d: R`$2e$`,
      e: R`$2$`,
    },
    "e",
    R`Tome logaritmos: $\ln f(x)=\left(\ln x\right)^2$. Derivando, $\dfrac{f'(x)}{f(x)}=\dfrac{2\ln x}{x}$. Em $x=e$: $f(e)=e^{\ln e}=e$ e $\dfrac{2\ln e}{e}=\dfrac{2}{e}$. Portanto $f'(e)=e\cdot\dfrac{2}{e}=2$.`
  ),
  q(
    "Técnicas de Integração",
    "Integração por partes",
    "medio",
    R`Calcule $\displaystyle\int_0^1 x\,e^{2x}\,dx$.`,
    {
      a: R`$\dfrac{e^2-1}{4}$`,
      b: R`$\dfrac{e^2+1}{4}$`,
      c: R`$\dfrac{e^2+1}{2}$`,
      d: R`$\dfrac{e^2-1}{2}$`,
      e: R`$\dfrac{e^2}{4}$`,
    },
    "b",
    R`Tome $u=x$ e $dv=e^{2x}dx$, logo $du=dx$ e $v=\dfrac{e^{2x}}{2}$. Então $\int_0^1 xe^{2x}dx=\left[\dfrac{xe^{2x}}{2}\right]_0^1-\dfrac12\int_0^1 e^{2x}dx=\dfrac{e^2}{2}-\dfrac{e^2-1}{4}=\dfrac{e^2+1}{4}$.`
  ),
  q(
    "Técnicas de Integração",
    "Substituição trigonométrica",
    "dificil",
    R`Calcule $\displaystyle\int_0^2\dfrac{dx}{\left(x^2+4\right)^{3/2}}$.`,
    {
      a: R`$\dfrac{1}{8}$`,
      b: R`$\dfrac{1}{4}$`,
      c: R`$\dfrac{\sqrt2}{4}$`,
      d: R`$\dfrac{\sqrt2}{8}$`,
      e: R`$\dfrac{\sqrt2}{16}$`,
    },
    "d",
    R`Faça $x=2\operatorname{tg}\theta$, logo $dx=2\sec^2\theta\,d\theta$ e $\left(x^2+4\right)^{3/2}=8\sec^3\theta$. A integral vira $\dfrac14\int\cos\theta\,d\theta=\dfrac{\operatorname{sen}\theta}{4}$. Como $\operatorname{sen}\theta=\dfrac{x}{\sqrt{x^2+4}}$, o resultado é $\left[\dfrac{x}{4\sqrt{x^2+4}}\right]_0^2=\dfrac{2}{4\sqrt8}=\dfrac{\sqrt2}{8}$.`
  ),
  q(
    "Técnicas de Integração",
    "Frações parciais",
    "dificil",
    R`Calcule $\displaystyle\int_2^3\dfrac{dx}{x^2-1}$.`,
    {
      a: R`$\dfrac{1}{2}\ln\dfrac{3}{2}$`,
      b: R`$\ln\dfrac{3}{2}$`,
      c: R`$\dfrac{1}{2}\ln\dfrac{2}{3}$`,
      d: R`$\dfrac{1}{2}\ln 6$`,
      e: R`$\dfrac{1}{2}\ln 3$`,
    },
    "a",
    R`Decompondo, $\dfrac{1}{x^2-1}=\dfrac{1}{2}\left(\dfrac{1}{x-1}-\dfrac{1}{x+1}\right)$. Assim a integral é $\dfrac12\left[\ln\left|\dfrac{x-1}{x+1}\right|\right]_2^3=\dfrac12\left(\ln\dfrac{2}{4}-\ln\dfrac{1}{3}\right)=\dfrac12\left(\ln\dfrac12+\ln 3\right)=\dfrac12\ln\dfrac{3}{2}$.`
  ),
  q(
    "Técnicas de Integração",
    "Potências de seno e cosseno",
    "medio",
    R`Calcule $\displaystyle\int_0^{\pi/2}\operatorname{sen}^3x\,\cos^2x\,dx$.`,
    {
      a: R`$\dfrac{1}{15}$`,
      b: R`$\dfrac{1}{5}$`,
      c: R`$\dfrac{2}{15}$`,
      d: R`$\dfrac{4}{15}$`,
      e: R`$\dfrac{2}{5}$`,
    },
    "c",
    R`Escreva $\operatorname{sen}^3x=\left(1-\cos^2x\right)\operatorname{sen}x$ e faça $u=\cos x$, $du=-\operatorname{sen}x\,dx$. Os limites viram $u(0)=1$ e $u(\pi/2)=0$, e a integral fica $\int_0^1\left(u^2-u^4\right)du=\dfrac13-\dfrac15=\dfrac{2}{15}$.`
  ),
  q(
    "Integral Imprópria",
    "Integral em intervalo infinito",
    "facil",
    R`Calcule $\displaystyle\int_1^{\infty}\dfrac{dx}{x^{3/2}}$, caso convirja.`,
    {
      a: R`$\dfrac{1}{2}$`,
      b: R`$1$`,
      c: R`$\dfrac{3}{2}$`,
      d: R`divergente`,
      e: R`$2$`,
    },
    "e",
    R`Como $p=\tfrac32>1$, a integral converge. De fato, $\int_1^{b}x^{-3/2}dx=\left[-2x^{-1/2}\right]_1^{b}=2-\dfrac{2}{\sqrt{b}}$. Fazendo $b\to\infty$, o limite é $2$.`
  ),
  q(
    "Integral Imprópria",
    "Integrando ilimitado no extremo",
    "medio",
    R`Calcule $\displaystyle\int_0^{1}\ln x\,dx$, caso convirja.`,
    {
      a: R`$1$`,
      b: R`$-1$`,
      c: R`$0$`,
      d: R`$-2$`,
      e: R`divergente`,
    },
    "b",
    R`O integrando é ilimitado quando $x\to 0^+$. Uma primitiva é $x\ln x-x$, obtida por partes. Então $\int_a^1\ln x\,dx=\left[x\ln x-x\right]_a^1=-1-\left(a\ln a-a\right)$. Como $\lim_{a\to0^+}a\ln a=0$, o limite é $-1$.`
  ),
  q(
    "Integral Imprópria",
    "Integral imprópria com exponencial",
    "medio",
    R`Calcule $\displaystyle\int_0^{\infty}x\,e^{-2x}\,dx$, caso convirja.`,
    {
      a: R`$\dfrac{1}{4}$`,
      b: R`$\dfrac{1}{2}$`,
      c: R`$1$`,
      d: R`$2$`,
      e: R`divergente`,
    },
    "a",
    R`Por partes com $u=x$ e $dv=e^{-2x}dx$: $\int x e^{-2x}dx=-\dfrac{x e^{-2x}}{2}-\dfrac{e^{-2x}}{4}$. Avaliando de $0$ a $b$ e fazendo $b\to\infty$ (ambos os termos tendem a zero, pois a exponencial domina), sobra $-\left(0-\dfrac14\right)=\dfrac14$.`
  ),
  q(
    "Integral Imprópria",
    "Integral imprópria com logaritmo",
    "dificil",
    R`Calcule $\displaystyle\int_2^{\infty}\dfrac{dx}{x\left(\ln x\right)^2}$, caso convirja.`,
    {
      a: R`$\ln 2$`,
      b: R`$\dfrac{1}{2\ln 2}$`,
      c: R`$\dfrac{2}{\ln 2}$`,
      d: R`$\dfrac{1}{\ln 2}$`,
      e: R`divergente`,
    },
    "d",
    R`Substitua $u=\ln x$, $du=\dfrac{dx}{x}$. Os limites viram $u=\ln 2$ e $u\to\infty$, e a integral fica $\int_{\ln 2}^{\infty}\dfrac{du}{u^2}=\left[-\dfrac{1}{u}\right]_{\ln 2}^{\infty}=\dfrac{1}{\ln 2}$.`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "calculo1_lote2.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
