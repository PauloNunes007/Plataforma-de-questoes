// Gerador do lote 2 de Cálculo II — questões autorais, nível universitário.
// EDOs no estilo Boyce & DiPrima; curvas/superfícies/várias variáveis no
// estilo Guidorizzi. Todas computacionais, alternativas curtas e simétricas.
// Rode: node listas_questoes/gerado/scripts/calculo2_lote2.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Cálculo II";

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
    "Equações Diferenciais de Primeira Ordem",
    "Equação separável",
    "medio",
    R`Resolva o problema de valor inicial $\dfrac{dy}{dx}=y^2\cos x$, com $y(0)=1$, e calcule $y\!\left(\dfrac{\pi}{6}\right)$.`,
    {
      a: R`$\dfrac{1}{2}$`,
      b: R`$1$`,
      c: R`$\dfrac{3}{2}$`,
      d: R`$2$`,
      e: R`$\dfrac{2}{3}$`,
    },
    "d",
    R`Separando as variáveis: $\dfrac{dy}{y^2}=\cos x\,dx$. Integrando, $-\dfrac{1}{y}=\operatorname{sen}x+C$. Com $y(0)=1$: $-1=0+C\Rightarrow C=-1$. Logo $-\dfrac1y=\operatorname{sen}x-1$, isto é, $y=\dfrac{1}{1-\operatorname{sen}x}$. Em $x=\dfrac{\pi}{6}$: $y=\dfrac{1}{1-\tfrac12}=2$.`
  ),
  q(
    "Equações Diferenciais de Primeira Ordem",
    "Equação linear de primeira ordem",
    "medio",
    R`Resolva o problema de valor inicial $y'+2y=e^{-x}$, com $y(0)=0$, e calcule $y(\ln 2)$.`,
    {
      a: R`$\dfrac{1}{8}$`,
      b: R`$\dfrac{1}{4}$`,
      c: R`$\dfrac{1}{2}$`,
      d: R`$\dfrac{3}{4}$`,
      e: R`$2$`,
    },
    "b",
    R`O fator integrante é $\mu(x)=e^{\int 2dx}=e^{2x}$. Multiplicando, $\left(ye^{2x}\right)'=e^{x}$, logo $ye^{2x}=e^{x}+C$ e $y=e^{-x}+Ce^{-2x}$. Com $y(0)=0$: $0=1+C\Rightarrow C=-1$, de onde $y=e^{-x}-e^{-2x}$. Em $x=\ln 2$: $y=\dfrac12-\dfrac14=\dfrac14$.`
  ),
  q(
    "Equações Diferenciais de Primeira Ordem",
    "Lei do resfriamento de Newton",
    "medio",
    R`Um corpo a $100\,^{\circ}$C é colocado em um ambiente mantido a $20\,^{\circ}$C e, após $10$ minutos, sua temperatura é de $60\,^{\circ}$C. Supondo válida a lei do resfriamento de Newton, após quanto tempo, contado do início, a temperatura do corpo será de $40\,^{\circ}$C?`,
    {
      a: R`$15$ min`,
      b: R`$25$ min`,
      c: R`$20$ min`,
      d: R`$30$ min`,
      e: R`$40$ min`,
    },
    "c",
    R`A lei fornece $\dfrac{dT}{dt}=-k(T-20)$, cuja solução é $T-20=80e^{-kt}$. Em $t=10$: $40=80e^{-10k}\Rightarrow e^{-10k}=\dfrac12$. Para $T=40$ precisamos de $20=80e^{-kt}\Rightarrow e^{-kt}=\dfrac14=\left(\dfrac12\right)^2=\left(e^{-10k}\right)^2=e^{-20k}$. Logo $t=20$ minutos.`
  ),
  q(
    "Equações Diferenciais de Primeira Ordem",
    "Equação linear com coeficiente variável",
    "dificil",
    R`Resolva o problema de valor inicial $xy'+2y=x^3$, com $x>0$ e $y(1)=1$, e calcule $y(2)$.`,
    {
      a: R`$\dfrac{8}{5}$`,
      b: R`$\dfrac{12}{5}$`,
      c: R`$2$`,
      d: R`$\dfrac{4}{5}$`,
      e: R`$\dfrac{9}{5}$`,
    },
    "e",
    R`Na forma padrão, $y'+\dfrac{2}{x}y=x^2$, com fator integrante $\mu(x)=e^{\int 2/x\,dx}=x^2$. Então $\left(x^2y\right)'=x^4$, logo $x^2y=\dfrac{x^5}{5}+C$ e $y=\dfrac{x^3}{5}+\dfrac{C}{x^2}$. Com $y(1)=1$: $1=\dfrac15+C\Rightarrow C=\dfrac45$. Em $x=2$: $y=\dfrac85+\dfrac{4}{5\cdot 4}=\dfrac85+\dfrac15=\dfrac95$.`
  ),
  q(
    "Equações Diferenciais de Primeira Ordem",
    "Modelo de mistura em tanque",
    "medio",
    R`Um tanque contém $100$ L de água pura. A partir de $t=0$ entra salmoura com $2$ g/L de sal à taxa de $5$ L/min, e a mistura, mantida homogênea, sai à mesma taxa. Qual é a quantidade de sal no tanque em $t=20$ min?`,
    {
      a: R`$200e^{-1}$ g`,
      b: R`$100\left(1-e^{-1}\right)$ g`,
      c: R`$200\left(1-e^{-1}\right)$ g`,
      d: R`$200\left(1-e^{-2}\right)$ g`,
      e: R`$100e^{-1}$ g`,
    },
    "c",
    R`Como as vazões são iguais, o volume permanece em $100$ L. Sendo $Q(t)$ a massa de sal, $\dfrac{dQ}{dt}=2\cdot 5-\dfrac{Q}{100}\cdot 5=10-\dfrac{Q}{20}$, com $Q(0)=0$. Essa linear tem solução $Q(t)=200\left(1-e^{-t/20}\right)$. Em $t=20$: $Q=200\left(1-e^{-1}\right)\approx 126$ g.`
  ),
  q(
    "Equações Diferenciais de Segunda Ordem",
    "Raízes reais distintas",
    "medio",
    R`Determine a solução do problema de valor inicial $y''-5y'+6y=0$, com $y(0)=1$ e $y'(0)=0$.`,
    {
      a: R`$2e^{3x}-3e^{2x}$`,
      b: R`$3e^{2x}-2e^{3x}$`,
      c: R`$3e^{3x}-2e^{2x}$`,
      d: R`$e^{2x}+e^{3x}$`,
      e: R`$-2e^{2x}+3e^{3x}$`,
    },
    "b",
    R`A equação característica $r^2-5r+6=0$ tem raízes $r=2$ e $r=3$, logo $y=Ae^{2x}+Be^{3x}$. As condições dão $A+B=1$ e $2A+3B=0$. Da segunda, $B=-\dfrac{2A}{3}$; substituindo na primeira, $A-\dfrac{2A}{3}=1\Rightarrow A=3$ e $B=-2$. Portanto $y=3e^{2x}-2e^{3x}$.`
  ),
  q(
    "Equações Diferenciais de Segunda Ordem",
    "Raízes complexas conjugadas",
    "medio",
    R`Seja $y$ a solução de $y''+4y'+13y=0$ com $y(0)=0$ e $y'(0)=6$. Calcule $y\!\left(\dfrac{\pi}{6}\right)$.`,
    {
      a: R`$2e^{-\pi/6}$`,
      b: R`$e^{-\pi/3}$`,
      c: R`$3e^{-\pi/3}$`,
      d: R`$2e^{-\pi/3}$`,
      e: R`$0$`,
    },
    "d",
    R`As raízes de $r^2+4r+13=0$ são $r=-2\pm 3i$, logo $y=e^{-2x}\left(A\cos 3x+B\operatorname{sen}3x\right)$. De $y(0)=0$ vem $A=0$. Então $y'=e^{-2x}\left(3B\cos 3x\right)-2e^{-2x}B\operatorname{sen}3x$, e $y'(0)=3B=6\Rightarrow B=2$. Assim $y=2e^{-2x}\operatorname{sen}3x$ e $y\!\left(\tfrac{\pi}{6}\right)=2e^{-\pi/3}\operatorname{sen}\tfrac{\pi}{2}=2e^{-\pi/3}$.`
  ),
  q(
    "Equações Diferenciais de Segunda Ordem",
    "Raiz real dupla",
    "medio",
    R`Seja $y$ a solução de $y''+6y'+9y=0$ com $y(0)=2$ e $y'(0)=1$. Calcule $y(1)$.`,
    {
      a: R`$9e^{-3}$`,
      b: R`$7e^{-3}$`,
      c: R`$2e^{-3}$`,
      d: R`$5e^{-3}$`,
      e: R`$9e^{3}$`,
    },
    "a",
    R`A característica $r^2+6r+9=(r+3)^2=0$ tem raiz dupla $r=-3$, logo $y=(A+Bx)e^{-3x}$. De $y(0)=2$ vem $A=2$. Derivando, $y'=Be^{-3x}-3(A+Bx)e^{-3x}$, e $y'(0)=B-3A=B-6=1\Rightarrow B=7$. Assim $y=(2+7x)e^{-3x}$ e $y(1)=9e^{-3}$.`
  ),
  q(
    "Equações Diferenciais de Segunda Ordem",
    "Método dos coeficientes a determinar",
    "medio",
    R`Determine uma solução particular da equação $y''-y=3e^{2x}$.`,
    {
      a: R`$3e^{2x}$`,
      b: R`$\dfrac{3}{5}e^{2x}$`,
      c: R`$e^{2x}$`,
      d: R`$-e^{2x}$`,
      e: R`$\dfrac{1}{3}e^{2x}$`,
    },
    "c",
    R`Como $r=2$ não é raiz de $r^2-1=0$, tente $y_p=Ae^{2x}$. Então $y_p''=4Ae^{2x}$ e $y_p''-y_p=(4A-A)e^{2x}=3Ae^{2x}$. Igualando a $3e^{2x}$: $3A=3\Rightarrow A=1$. Logo $y_p=e^{2x}$.`
  ),
  q(
    "Equações Diferenciais de Segunda Ordem",
    "Ressonância no método dos coeficientes a determinar",
    "dificil",
    R`Determine uma solução particular da equação $y''+4y=\operatorname{sen}(2x)$.`,
    {
      a: R`$\dfrac{x}{4}\cos 2x$`,
      b: R`$-\dfrac{x}{2}\cos 2x$`,
      c: R`$\dfrac{1}{3}\operatorname{sen}2x$`,
      d: R`$-\dfrac{x}{4}\cos 2x$`,
      e: R`$\dfrac{x}{4}\operatorname{sen}2x$`,
    },
    "d",
    R`A homogênea associada tem soluções $\cos 2x$ e $\operatorname{sen}2x$, então o termo forçante é ressonante e a tentativa deve ser $y_p=x\left(A\cos 2x+B\operatorname{sen}2x\right)$. Testando $y_p=-\dfrac{x}{4}\cos 2x$: $y_p'=-\dfrac14\cos 2x+\dfrac{x}{2}\operatorname{sen}2x$ e $y_p''=\operatorname{sen}2x+x\cos 2x$. Assim $y_p''+4y_p=\operatorname{sen}2x+x\cos 2x-x\cos 2x=\operatorname{sen}2x$, como desejado.`
  ),
  q(
    "Funções Vetoriais e Curvas",
    "Vetor velocidade e rapidez",
    "facil",
    R`Uma partícula descreve a curva $\mathbf{r}(t)=\left(t^2,\,t^3\right)$. Calcule a rapidez $\left\|\mathbf{r}'(t)\right\|$ em $t=1$.`,
    {
      a: R`$\sqrt5$`,
      b: R`$\sqrt{11}$`,
      c: R`$\sqrt{13}$`,
      d: R`$5$`,
      e: R`$13$`,
    },
    "c",
    R`Derivando componente a componente, $\mathbf{r}'(t)=\left(2t,\,3t^2\right)$. Em $t=1$: $\mathbf{r}'(1)=(2,3)$, de módulo $\sqrt{2^2+3^2}=\sqrt{13}$.`
  ),
  q(
    "Funções Vetoriais e Curvas",
    "Comprimento de arco de hélice",
    "medio",
    R`Calcule o comprimento da hélice $\mathbf{r}(t)=\left(\cos t,\,\operatorname{sen}t,\,t\right)$ para $t$ de $0$ a $2\pi$.`,
    {
      a: R`$2\pi$`,
      b: R`$\sqrt2\,\pi$`,
      c: R`$4\pi$`,
      d: R`$2\sqrt3\,\pi$`,
      e: R`$2\sqrt2\,\pi$`,
    },
    "e",
    R`Temos $\mathbf{r}'(t)=\left(-\operatorname{sen}t,\,\cos t,\,1\right)$, cujo módulo é $\sqrt{\operatorname{sen}^2t+\cos^2t+1}=\sqrt2$, constante. Logo $L=\int_0^{2\pi}\sqrt2\,dt=2\sqrt2\,\pi$.`
  ),
  q(
    "Funções Vetoriais e Curvas",
    "Componente tangencial da aceleração",
    "medio",
    R`Uma partícula percorre a curva $\mathbf{r}(t)=\left(t,\,t^2\right)$. Determine a componente tangencial da aceleração em $t=1$.`,
    {
      a: R`$\dfrac{4\sqrt5}{5}$`,
      b: R`$\dfrac{2\sqrt5}{5}$`,
      c: R`$\dfrac{4}{5}$`,
      d: R`$2$`,
      e: R`$\dfrac{2\sqrt5}{3}$`,
    },
    "a",
    R`Temos $\mathbf{v}(t)=(1,2t)$ e $\mathbf{a}(t)=(0,2)$. Em $t=1$: $\mathbf{v}=(1,2)$, $\left\|\mathbf{v}\right\|=\sqrt5$ e $\mathbf{a}=(0,2)$. A componente tangencial é $a_T=\dfrac{\mathbf{a}\cdot\mathbf{v}}{\left\|\mathbf{v}\right\|}=\dfrac{0\cdot 1+2\cdot 2}{\sqrt5}=\dfrac{4}{\sqrt5}=\dfrac{4\sqrt5}{5}$.`
  ),
  q(
    "Funções Vetoriais e Curvas",
    "Comprimento de arco de espiral logarítmica",
    "medio",
    R`Calcule o comprimento de arco da curva $\mathbf{r}(t)=\left(e^{t}\cos t,\,e^{t}\operatorname{sen}t\right)$ para $t$ de $0$ a $\ln 2$.`,
    {
      a: R`$2\sqrt2$`,
      b: R`$\sqrt2$`,
      c: R`$\ln 2$`,
      d: R`$\sqrt2\ln 2$`,
      e: R`$2$`,
    },
    "b",
    R`Derivando, $\mathbf{r}'(t)=e^{t}\left(\cos t-\operatorname{sen}t,\ \operatorname{sen}t+\cos t\right)$. Como $(\cos t-\operatorname{sen}t)^2+(\operatorname{sen}t+\cos t)^2=2$, vale $\left\|\mathbf{r}'(t)\right\|=\sqrt2\,e^{t}$. Logo $L=\sqrt2\int_0^{\ln 2}e^{t}dt=\sqrt2\left(2-1\right)=\sqrt2$.`
  ),
  q(
    "Funções Vetoriais e Curvas",
    "Integração de funções vetoriais",
    "medio",
    R`Uma partícula tem aceleração $\mathbf{a}(t)=(6t,\,2)$, com $\mathbf{v}(0)=(1,0)$ e $\mathbf{r}(0)=(0,1)$. Determine $\mathbf{r}(2)$.`,
    {
      a: R`$(8,4)$`,
      b: R`$(10,4)$`,
      c: R`$(12,5)$`,
      d: R`$(10,5)$`,
      e: R`$(8,5)$`,
    },
    "d",
    R`Integrando a aceleração: $\mathbf{v}(t)=\left(3t^2+C_1,\ 2t+C_2\right)$, e $\mathbf{v}(0)=(1,0)$ dá $C_1=1$, $C_2=0$. Integrando de novo: $\mathbf{r}(t)=\left(t^3+t+D_1,\ t^2+D_2\right)$, e $\mathbf{r}(0)=(0,1)$ dá $D_1=0$, $D_2=1$. Em $t=2$: $\mathbf{r}(2)=\left(8+2,\ 4+1\right)=(10,5)$.`
  ),
  q(
    "Superfícies",
    "Equação do plano por três pontos",
    "medio",
    R`Determine a equação do plano que passa pelos pontos $A(1,0,0)$, $B(0,2,0)$ e $C(0,0,3)$.`,
    {
      a: R`$x+y+z=1$`,
      b: R`$6x+3y+2z=6$`,
      c: R`$3x+6y+2z=6$`,
      d: R`$2x+3y+6z=6$`,
      e: R`$6x+3y+2z=1$`,
    },
    "b",
    R`Os pontos são interceptos dos eixos, então vale a forma segmentária $\dfrac{x}{1}+\dfrac{y}{2}+\dfrac{z}{3}=1$. Multiplicando por $6$: $6x+3y+2z=6$. Conferindo em $B$: $0+6+0=6$; em $C$: $0+0+6=6$.`
  ),
  q(
    "Superfícies",
    "Distância de ponto a plano",
    "facil",
    R`Calcule a distância do ponto $P(1,2,3)$ ao plano $2x-y+2z=5$.`,
    {
      a: R`$\dfrac{2}{3}$`,
      b: R`$1$`,
      c: R`$\dfrac{1}{3}$`,
      d: R`$\dfrac{5}{3}$`,
      e: R`$\dfrac{1}{9}$`,
    },
    "c",
    R`Pela fórmula $d=\dfrac{\left|ax_0+by_0+cz_0-d_0\right|}{\sqrt{a^2+b^2+c^2}}$, temos $d=\dfrac{\left|2(1)-1(2)+2(3)-5\right|}{\sqrt{4+1+4}}=\dfrac{\left|2-2+6-5\right|}{3}=\dfrac{1}{3}$.`
  ),
  q(
    "Superfícies",
    "Interseção de reta com plano",
    "medio",
    R`Determine o ponto de interseção da reta $(x,y,z)=(1,0,2)+t(2,-1,1)$ com o plano $x+y+z=6$.`,
    {
      a: R`$(3,-1,3)$`,
      b: R`$(5,-2,4)$`,
      c: R`$\left(4,\tfrac32,\tfrac72\right)$`,
      d: R`$\left(2,-\tfrac12,\tfrac52\right)$`,
      e: R`$\left(4,-\tfrac32,\tfrac72\right)$`,
    },
    "e",
    R`Substituindo as paramétricas na equação do plano: $(1+2t)+(-t)+(2+t)=6$, ou seja, $3+2t=6\Rightarrow t=\dfrac32$. O ponto é $\left(1+3,\ -\tfrac32,\ 2+\tfrac32\right)=\left(4,-\tfrac32,\tfrac72\right)$.`
  ),
  q(
    "Superfícies",
    "Superfícies quádricas e seções",
    "facil",
    R`A superfície $x^2+y^2-z^2=1$ é um hiperboloide de uma folha. Qual é o raio da circunferência obtida ao seccioná-la pelo plano $z=2$?`,
    {
      a: R`$\sqrt3$`,
      b: R`$\sqrt5$`,
      c: R`$2$`,
      d: R`$3$`,
      e: R`$5$`,
    },
    "b",
    R`Fazendo $z=2$ na equação: $x^2+y^2-4=1$, ou seja, $x^2+y^2=5$. É uma circunferência de raio $\sqrt5$.`
  ),
  q(
    "Superfícies",
    "Superfície de revolução",
    "medio",
    R`A curva $z=\sqrt{x}$, com $x\ge 0$, contida no plano $xz$, gira em torno do eixo $z$. Determine a equação da superfície gerada.`,
    {
      a: R`$z^2=x^2+y^2$`,
      b: R`$z=x^2+y^2$`,
      c: R`$z^4=x^2+y^2$`,
      d: R`$z^4=x^2-y^2$`,
      e: R`$z^2=x^4+y^4$`,
    },
    "c",
    R`Na rotação em torno do eixo $z$, a abscissa $x$ da curva geratriz é substituída pela distância ao eixo, $r=\sqrt{x^2+y^2}$. Assim $z=\sqrt{r}=\left(x^2+y^2\right)^{1/4}$. Elevando à quarta potência, $z^4=x^2+y^2$ (com $z\ge 0$).`
  ),
  q(
    "Funções de Duas e Três Variáveis",
    "Derivadas parciais",
    "medio",
    R`Seja $f(x,y)=x^2y^3+\dfrac{x}{y}$. Calcule $\dfrac{\partial f}{\partial x}(1,2)$.`,
    {
      a: R`$16$`,
      b: R`$\dfrac{17}{2}$`,
      c: R`$12$`,
      d: R`$\dfrac{33}{2}$`,
      e: R`$\dfrac{65}{4}$`,
    },
    "d",
    R`Tratando $y$ como constante, $\dfrac{\partial f}{\partial x}=2xy^3+\dfrac{1}{y}$. Em $(1,2)$: $2\cdot 1\cdot 8+\dfrac12=16+\dfrac12=\dfrac{33}{2}$.`
  ),
  q(
    "Funções de Duas e Três Variáveis",
    "Regra da cadeia",
    "medio",
    R`Sejam $z=x^2y$, $x=e^{2t}$ e $y=\operatorname{sen}t$. Calcule $\dfrac{dz}{dt}$ em $t=0$.`,
    {
      a: R`$1$`,
      b: R`$2$`,
      c: R`$0$`,
      d: R`$4$`,
      e: R`$5$`,
    },
    "a",
    R`Pela regra da cadeia, $\dfrac{dz}{dt}=2xy\dfrac{dx}{dt}+x^2\dfrac{dy}{dt}$. Em $t=0$: $x=1$, $y=0$, $\dfrac{dx}{dt}=2e^{0}=2$ e $\dfrac{dy}{dt}=\cos 0=1$. Logo $\dfrac{dz}{dt}=2\cdot 1\cdot 0\cdot 2+1\cdot 1=1$.`
  ),
  q(
    "Funções de Duas e Três Variáveis",
    "Derivada direcional",
    "medio",
    R`Seja $f(x,y)=x^2+xy$. Calcule a derivada direcional de $f$ em $(1,2)$ na direção do vetor unitário $\mathbf{u}=\left(\dfrac{3}{5},\dfrac{4}{5}\right)$.`,
    {
      a: R`$\dfrac{12}{5}$`,
      b: R`$\dfrac{16}{5}$`,
      c: R`$4$`,
      d: R`$16$`,
      e: R`$\dfrac{8}{5}$`,
    },
    "b",
    R`O gradiente é $\nabla f=(2x+y,\ x)$, que em $(1,2)$ vale $(4,1)$. Como $\mathbf{u}$ já é unitário, $D_{\mathbf{u}}f=\nabla f\cdot\mathbf{u}=4\cdot\dfrac35+1\cdot\dfrac45=\dfrac{12+4}{5}=\dfrac{16}{5}$.`
  ),
  q(
    "Funções de Duas e Três Variáveis",
    "Plano tangente",
    "medio",
    R`Determine a equação do plano tangente ao gráfico de $z=x^2+y^2$ no ponto $(1,1,2)$.`,
    {
      a: R`$2x+2y+z=6$`,
      b: R`$x+y-z=0$`,
      c: R`$2x+2y-z=2$`,
      d: R`$2x+2y-z=0$`,
      e: R`$x+y-2z=-2$`,
    },
    "c",
    R`Com $f(x,y)=x^2+y^2$, temos $f_x=2x$ e $f_y=2y$, que em $(1,1)$ valem $2$ e $2$. O plano tangente é $z=f(1,1)+2(x-1)+2(y-1)=2+2x-2+2y-2$, ou seja, $z=2x+2y-2$, que se escreve $2x+2y-z=2$.`
  ),
  q(
    "Funções de Duas e Três Variáveis",
    "Limite de função de duas variáveis",
    "medio",
    R`Calcule $\displaystyle\lim_{(x,y)\to(0,0)}\dfrac{x^2y}{x^2+y^2}$.`,
    {
      a: R`$1$`,
      b: R`$\dfrac{1}{2}$`,
      c: R`$\infty$`,
      d: R`$0$`,
      e: R`não existe`,
    },
    "d",
    R`Em coordenadas polares, $x=r\cos\theta$ e $y=r\operatorname{sen}\theta$, a expressão vira $\dfrac{r^3\cos^2\theta\operatorname{sen}\theta}{r^2}=r\cos^2\theta\operatorname{sen}\theta$. Como $\left|r\cos^2\theta\operatorname{sen}\theta\right|\le r\to 0$ independentemente de $\theta$, o limite existe e vale $0$.`
  ),
  q(
    "Máximos e Mínimos",
    "Teste da segunda derivada",
    "medio",
    R`Seja $f(x,y)=x^3-3x+y^2$. Determine o valor de $f$ no ponto de mínimo local.`,
    {
      a: R`$-2$`,
      b: R`$2$`,
      c: R`$0$`,
      d: R`$-1$`,
      e: R`$4$`,
    },
    "a",
    R`Os pontos críticos vêm de $f_x=3x^2-3=0$ e $f_y=2y=0$, ou seja, $(\pm 1,0)$. O hessiano é $D=f_{xx}f_{yy}-f_{xy}^2=(6x)(2)-0=12x$. Em $(1,0)$: $D=12>0$ e $f_{xx}=6>0$, portanto mínimo local. Em $(-1,0)$: $D=-12<0$, ponto de sela. O valor é $f(1,0)=1-3+0=-2$.`
  ),
  q(
    "Máximos e Mínimos",
    "Multiplicadores de Lagrange no plano",
    "medio",
    R`Determine o valor máximo de $f(x,y)=xy$ sujeito à restrição $x^2+y^2=8$.`,
    {
      a: R`$2$`,
      b: R`$2\sqrt2$`,
      c: R`$4$`,
      d: R`$8$`,
      e: R`$16$`,
    },
    "c",
    R`Com $\nabla f=\lambda\nabla g$ e $g=x^2+y^2$: $y=2\lambda x$ e $x=2\lambda y$. Multiplicando, $xy=4\lambda^2xy$, e para $xy\neq 0$ vem $\lambda=\pm\dfrac12$, isto é, $y=\pm x$. Na restrição, $2x^2=8\Rightarrow x=\pm 2$. O máximo ocorre com $y=x$: $f=4$.`
  ),
  q(
    "Máximos e Mínimos",
    "Multiplicadores de Lagrange no espaço",
    "medio",
    R`Determine o valor máximo de $f(x,y,z)=x+2y+3z$ sujeito a $x^2+y^2+z^2=14$.`,
    {
      a: R`$\sqrt{14}$`,
      b: R`$7$`,
      c: R`$6$`,
      d: R`$28$`,
      e: R`$14$`,
    },
    "e",
    R`De $\nabla f=\lambda\nabla g$ vem $(1,2,3)=2\lambda(x,y,z)$, logo $(x,y,z)=\dfrac{1}{2\lambda}(1,2,3)$. Impondo a restrição, $\dfrac{14}{4\lambda^2}=14\Rightarrow \lambda=\pm\dfrac12$. O sinal positivo dá $(x,y,z)=(1,2,3)$ e $f=1+4+9=14$.`
  ),
  q(
    "Máximos e Mínimos",
    "Extremos em região fechada e limitada",
    "dificil",
    R`Determine o valor máximo de $f(x,y)=x^2+2y^2-4x$ na região $0\le x\le 3$ e $-1\le y\le 1$.`,
    {
      a: R`$0$`,
      b: R`$-1$`,
      c: R`$2$`,
      d: R`$3$`,
      e: R`$4$`,
    },
    "c",
    R`No interior, $f_x=2x-4=0$ e $f_y=4y=0$ dão $(2,0)$, com $f=-4$. Nas bordas: em $x=0$, $f=2y^2\in[0,2]$; em $x=3$, $f=-3+2y^2\in[-3,-1]$; em $y=\pm 1$, $f=x^2-4x+2$, que em $[0,3]$ vai de $-2$ (em $x=2$) a $2$ (em $x=0$). O maior valor encontrado é $2$, atingido em $(0,\pm 1)$.`
  ),
  q(
    "Máximos e Mínimos",
    "Otimização com restrição de volume",
    "medio",
    R`Uma caixa retangular sem tampa deve ter volume de $32$ cm³. Qual é a menor área de material possível?`,
    {
      a: R`$32$ cm²`,
      b: R`$40$ cm²`,
      c: R`$64$ cm²`,
      d: R`$48$ cm²`,
      e: R`$96$ cm²`,
    },
    "d",
    R`Com base $x\times y$ e altura $z$, a área é $S=xy+2xz+2yz$ e $xyz=32$. Substituindo $z=\dfrac{32}{xy}$: $S=xy+\dfrac{64}{y}+\dfrac{64}{x}$. Anulando as parciais, $S_x=y-\dfrac{64}{x^2}=0$ e $S_y=x-\dfrac{64}{y^2}=0$, o que dá $x=y=4$ e $z=\dfrac{32}{16}=2$. Logo $S=16+2\cdot 8+2\cdot 8=48$ cm².`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "calculo2_lote2.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
