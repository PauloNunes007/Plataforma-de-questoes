// Lote 3 de Cálculo II — 4 questões por tópico. EDOs no estilo Boyce &
// DiPrima; curvas, superfícies e várias variáveis no estilo Guidorizzi.
// Rode: node listas_questoes/gerado/scripts/calculo2_lote3.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Cálculo II";

const q = (topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao) => ({
  materia: MATERIA, topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao,
  instituicao: null, ano: null, tikz_code: null,
});

const questoes = [
  q("Equações Diferenciais de Primeira Ordem", "Equação separável com condição inicial", "medio",
    R`Resolva o problema de valor inicial $\dfrac{dy}{dx}=\dfrac{x+1}{y}$, com $y(0)=2$, e calcule $y(2)$.`,
    { a: R`$4$`, b: R`$2\sqrt2$`, c: R`$2\sqrt3$`, d: R`$6$`, e: R`$3$` }, "c",
    R`Separando: $y\,dy=(x+1)\,dx$. Integrando, $\dfrac{y^2}{2}=\dfrac{x^2}{2}+x+C$. Com $y(0)=2$: $2=C$, logo $y^2=x^2+2x+4$. Em $x=2$: $y^2=4+4+4=12$, e como $y(0)>0$ a solução é contínua e positiva, $y=\sqrt{12}=2\sqrt3$.`),

  q("Equações Diferenciais de Primeira Ordem", "Equação linear não homogênea", "medio",
    R`Resolva $y'-y=e^{2x}$ com $y(0)=3$ e calcule $y(\ln 2)$.`,
    { a: R`$8$`, b: R`$4$`, c: R`$6$`, d: R`$12$`, e: R`$10$` }, "a",
    R`O fator integrante é $e^{-x}$, e $\left(ye^{-x}\right)'=e^{x}$, logo $ye^{-x}=e^{x}+C$ e $y=e^{2x}+Ce^{x}$. De $y(0)=3$: $1+C=3\Rightarrow C=2$. Em $x=\ln 2$, com $e^{x}=2$ e $e^{2x}=4$: $y=4+4=8$.`),

  q("Equações Diferenciais de Primeira Ordem", "Modelo de crescimento exponencial", "medio",
    R`Uma cultura de bactérias cresce segundo $\dfrac{dP}{dt}=kP$. Se $P(0)=1000$ e $P(2)=4000$, determine $P(3)$, com $t$ em horas.`,
    { a: R`$2000$`, b: R`$4000$`, c: R`$6000$`, d: R`$8000$`, e: R`$16000$` }, "d",
    R`A solução é $P(t)=1000e^{kt}$. De $P(2)=4000$ vem $e^{2k}=4$, ou seja, $e^{k}=2$ e $k=\ln 2$. Então $P(t)=1000\cdot 2^{t}$ e $P(3)=1000\cdot 8=8000$. A população dobra a cada hora.`),

  q("Equações Diferenciais de Primeira Ordem", "Decaimento radioativo", "facil",
    R`Um isótopo radioativo tem meia-vida de $5$ anos. Determine a fração da massa inicial que ainda resta após $15$ anos.`,
    { a: R`$\dfrac{1}{4}$`, b: R`$\dfrac{1}{8}$`, c: R`$\dfrac{1}{16}$`, d: R`$\dfrac{1}{3}$`, e: R`$\dfrac{1}{2}$` }, "b",
    R`O decaimento obedece a $m(t)=m_0e^{-\lambda t}$, e a meia-vida significa que a massa se reduz à metade a cada $5$ anos. Em $15$ anos passam-se $3$ meias-vidas, logo resta $\left(\dfrac12\right)^3=\dfrac18$ da massa inicial.`),

  q("Equações Diferenciais de Segunda Ordem", "Raízes reais simétricas", "medio",
    R`Seja $y$ a solução de $y''-4y=0$ com $y(0)=2$ e $y'(0)=0$. Calcule $y\!\left(\dfrac{\ln 2}{2}\right)$.`,
    { a: R`$2$`, b: R`$\dfrac{3}{2}$`, c: R`$4$`, d: R`$5$`, e: R`$\dfrac{5}{2}$` }, "e",
    R`As raízes de $r^2-4=0$ são $\pm 2$, logo $y=Ae^{2x}+Be^{-2x}$. As condições dão $A+B=2$ e $2A-2B=0$, isto é, $A=B=1$ e $y=e^{2x}+e^{-2x}$. Em $x=\dfrac{\ln 2}{2}$, temos $e^{2x}=2$ e $e^{-2x}=\dfrac12$, logo $y=\dfrac52$.`),

  q("Equações Diferenciais de Segunda Ordem", "Oscilação amortecida", "medio",
    R`Seja $y$ a solução de $y''+2y'+5y=0$ com $y(0)=1$ e $y'(0)=-1$. Calcule $y\!\left(\dfrac{\pi}{2}\right)$.`,
    { a: R`$-e^{-\pi/2}$`, b: R`$e^{-\pi/2}$`, c: R`$-e^{-\pi}$`, d: R`$0$`, e: R`$-2e^{-\pi/2}$` }, "a",
    R`As raízes de $r^2+2r+5=0$ são $-1\pm 2i$, logo $y=e^{-x}\left(A\cos 2x+B\operatorname{sen}2x\right)$. De $y(0)=1$ vem $A=1$; derivando e avaliando em $0$: $-A+2B=-1$, o que dá $B=0$. Assim $y=e^{-x}\cos 2x$ e $y\!\left(\tfrac{\pi}{2}\right)=e^{-\pi/2}\cos\pi=-e^{-\pi/2}$.`),

  q("Equações Diferenciais de Segunda Ordem", "Coeficientes a determinar com termo polinomial", "medio",
    R`Determine uma solução particular de $y''+y=x^2$.`,
    { a: R`$x^2$`, b: R`$x^2+2$`, c: R`$x^2-2$`, d: R`$\dfrac{x^2}{2}-1$`, e: R`$x^2-2x$` }, "c",
    R`Como o termo forçante é polinomial de grau $2$ e $r=0$ não é raiz de $r^2+1=0$, tente $y_p=Ax^2+Bx+C$. Então $y_p''=2A$ e $y_p''+y_p=Ax^2+Bx+(2A+C)$. Igualando a $x^2$: $A=1$, $B=0$ e $2+C=0$, ou seja, $C=-2$. Logo $y_p=x^2-2$.`),

  q("Equações Diferenciais de Segunda Ordem", "Amortecimento crítico", "medio",
    R`Seja $y$ a solução de $y''+4y'+4y=0$ com $y(0)=1$ e $y'(0)=0$. Calcule $y(1)$.`,
    { a: R`$e^{-2}$`, b: R`$3e^{-2}$`, c: R`$2e^{-2}$`, d: R`$3e^{2}$`, e: R`$5e^{-2}$` }, "b",
    R`A característica $r^2+4r+4=(r+2)^2$ tem raiz dupla $r=-2$ (amortecimento crítico), logo $y=(A+Bx)e^{-2x}$. De $y(0)=1$ vem $A=1$; de $y'(0)=B-2A=0$ vem $B=2$. Assim $y=(1+2x)e^{-2x}$ e $y(1)=3e^{-2}$.`),

  q("Funções Vetoriais e Curvas", "Comprimento de hélice circular", "facil",
    R`Calcule o comprimento da curva $\mathbf{r}(t)=\left(3\cos t,\ 3\operatorname{sen}t,\ 4t\right)$ para $t$ de $0$ a $2\pi$.`,
    { a: R`$5\pi$`, b: R`$8\pi$`, c: R`$6\pi$`, d: R`$10\pi$`, e: R`$20\pi$` }, "d",
    R`Temos $\mathbf{r}'(t)=\left(-3\operatorname{sen}t,\ 3\cos t,\ 4\right)$, de módulo $\sqrt{9+16}=5$, constante. Logo $L=\int_0^{2\pi}5\,dt=10\pi$.`),

  q("Funções Vetoriais e Curvas", "Comprimento com integrando que vira quadrado perfeito", "dificil",
    R`Calcule o comprimento de $\mathbf{r}(t)=\left(e^{t},\ e^{-t},\ \sqrt2\,t\right)$ para $t$ de $0$ a $1$.`,
    { a: R`$e-e^{-1}$`, b: R`$e+e^{-1}$`, c: R`$\sqrt2\left(e-1\right)$`, d: R`$e-1$`, e: R`$2\left(e-1\right)$` }, "a",
    R`Com $\mathbf{r}'=\left(e^{t},-e^{-t},\sqrt2\right)$, temos $\left\|\mathbf{r}'\right\|^2=e^{2t}+e^{-2t}+2=\left(e^{t}+e^{-t}\right)^2$, logo $\left\|\mathbf{r}'\right\|=e^{t}+e^{-t}$. Então $L=\int_0^1\left(e^{t}+e^{-t}\right)dt=\left[e^{t}-e^{-t}\right]_0^1=e-e^{-1}$.`),

  q("Funções Vetoriais e Curvas", "Vetor velocidade em curva paramétrica", "facil",
    R`Uma partícula percorre a elipse $\mathbf{r}(t)=\left(2\cos t,\ 3\operatorname{sen}t\right)$. Calcule sua rapidez em $t=\dfrac{\pi}{2}$.`,
    { a: R`$3$`, b: R`$\sqrt{13}$`, c: R`$2$`, d: R`$\sqrt5$`, e: R`$6$` }, "c",
    R`Derivando, $\mathbf{r}'(t)=\left(-2\operatorname{sen}t,\ 3\cos t\right)$. Em $t=\dfrac{\pi}{2}$: $\operatorname{sen}=1$ e $\cos=0$, logo $\mathbf{r}'=(-2,0)$ e a rapidez é $2$.`),

  q("Funções Vetoriais e Curvas", "Vetor tangente unitário", "medio",
    R`Seja $\mathbf{r}(t)=\left(t^2,\ t^3\right)$. Determine a primeira componente do vetor tangente unitário em $t=1$.`,
    { a: R`$\dfrac{3\sqrt{13}}{13}$`, b: R`$\dfrac{2}{3}$`, c: R`$\dfrac{\sqrt{13}}{13}$`, d: R`$2$`, e: R`$\dfrac{2\sqrt{13}}{13}$` }, "e",
    R`Temos $\mathbf{r}'(t)=\left(2t,\ 3t^2\right)$, que em $t=1$ vale $(2,3)$, de módulo $\sqrt{13}$. O tangente unitário é $\mathbf{T}=\dfrac{(2,3)}{\sqrt{13}}$, cuja primeira componente é $\dfrac{2}{\sqrt{13}}=\dfrac{2\sqrt{13}}{13}$.`),

  q("Superfícies", "Reta interseção de dois planos", "medio",
    R`Determine um vetor diretor da reta obtida pela interseção dos planos $x+y+z=3$ e $x-y=1$.`,
    { a: R`$(1,-1,2)$`, b: R`$(1,1,-2)$`, c: R`$(1,1,2)$`, d: R`$(2,1,-1)$`, e: R`$(1,-1,0)$` }, "b",
    R`A reta é perpendicular a ambas as normais, então seu vetor diretor é $\vec{n}_1\times\vec{n}_2$ com $\vec{n}_1=(1,1,1)$ e $\vec{n}_2=(1,-1,0)$. O produto vetorial é $\left(1\cdot 0-1\cdot(-1),\ 1\cdot 1-1\cdot 0,\ 1\cdot(-1)-1\cdot 1\right)=(1,1,-2)$.`),

  q("Superfícies", "Distância entre planos paralelos", "facil",
    R`Determine a distância entre os planos paralelos $2x-y+2z=6$ e $2x-y+2z=12$.`,
    { a: R`$2$`, b: R`$6$`, c: R`$3$`, d: R`$1$`, e: R`$18$` }, "a",
    R`Para planos $ax+by+cz=d_1$ e $ax+by+cz=d_2$, a distância é $\dfrac{\left|d_2-d_1\right|}{\sqrt{a^2+b^2+c^2}}$. Aqui $\dfrac{\left|12-6\right|}{\sqrt{4+1+4}}=\dfrac{6}{3}=2$.`),

  q("Superfícies", "Seção plana de elipsoide", "medio",
    R`Determine a área da região limitada pela curva obtida ao seccionar o elipsoide $\dfrac{x^2}{4}+\dfrac{y^2}{9}+\dfrac{z^2}{16}=1$ pelo plano $y=0$.`,
    { a: R`$4\pi$`, b: R`$6\pi$`, c: R`$12\pi$`, d: R`$8\pi$`, e: R`$16\pi$` }, "d",
    R`Fazendo $y=0$, resta $\dfrac{x^2}{4}+\dfrac{z^2}{16}=1$, uma elipse de semieixos $a=2$ e $b=4$. Sua área é $\pi ab=\pi(2)(4)=8\pi$.`),

  q("Superfícies", "Superfície de revolução: cone", "medio",
    R`A reta $z=2x$, com $x\ge 0$, contida no plano $xz$, gira em torno do eixo $z$. Determine a equação da superfície gerada.`,
    {
      a: R`$z=4\left(x^2+y^2\right)$`,
      b: R`$z^2=x^2+y^2$`,
      c: R`$z^2=4\left(x^2+y^2\right)$`,
      d: R`$z^2=2\left(x^2+y^2\right)$`,
      e: R`$4z^2=x^2+y^2$`,
    }, "c",
    R`Na rotação em torno do eixo $z$, a abscissa $x$ da geratriz é substituída pela distância ao eixo, $r=\sqrt{x^2+y^2}$. De $z=2x$ vem $z=2\sqrt{x^2+y^2}$ e, elevando ao quadrado, $z^2=4\left(x^2+y^2\right)$ — um cone circular reto.`),

  q("Funções de Duas e Três Variáveis", "Derivada parcial mista", "dificil",
    R`Seja $f(x,y)=x^3y^2+e^{xy}$. Calcule $\dfrac{\partial^2 f}{\partial y\,\partial x}(0,1)$.`,
    { a: R`$1$`, b: R`$0$`, c: R`$2$`, d: R`$6$`, e: R`$-1$` }, "a",
    R`Primeiro, $f_x=3x^2y^2+y\,e^{xy}$. Derivando em relação a $y$: $f_{xy}=6x^2y+e^{xy}+xy\,e^{xy}$. Em $(0,1)$, os termos com fator $x$ se anulam e resta $e^{0}=1$.`),

  q("Funções de Duas e Três Variáveis", "Gradiente e taxa máxima de variação", "medio",
    R`Seja $f(x,y)=x^2y+y^3$. Determine a taxa máxima de variação de $f$ no ponto $(1,2)$.`,
    { a: R`$13$`, b: R`$\sqrt{17}$`, c: R`$\sqrt{170}$`, d: R`$17$`, e: R`$\sqrt{185}$` }, "e",
    R`A taxa máxima de variação é o módulo do gradiente. Como $\nabla f=\left(2xy,\ x^2+3y^2\right)$, em $(1,2)$ temos $\nabla f=(4,13)$, de módulo $\sqrt{16+169}=\sqrt{185}$.`),

  q("Funções de Duas e Três Variáveis", "Regra da cadeia com duas variáveis independentes", "medio",
    R`Sejam $z=x^2+y^2$, $x=s+t$ e $y=s-t$. Calcule $\dfrac{\partial z}{\partial s}$ em $s=1$ (para qualquer $t$).`,
    { a: R`$2$`, b: R`$4$`, c: R`$8$`, d: R`$0$`, e: R`$1$` }, "b",
    R`Pela regra da cadeia, $\dfrac{\partial z}{\partial s}=2x\dfrac{\partial x}{\partial s}+2y\dfrac{\partial y}{\partial s}=2x+2y=2(s+t)+2(s-t)=4s$. A dependência em $t$ se cancela, e em $s=1$ o valor é $4$.`),

  q("Funções de Duas e Três Variáveis", "Reta normal a uma superfície", "medio",
    R`Determine um vetor normal à superfície $z=xy$ no ponto $(1,1,1)$.`,
    { a: R`$(1,1,1)$`, b: R`$(1,-1,-1)$`, c: R`$(-1,1,1)$`, d: R`$(1,1,-1)$`, e: R`$(0,0,1)$` }, "d",
    R`Escreva a superfície como nível de $F(x,y,z)=xy-z$. O gradiente é $\nabla F=(y,\ x,\ -1)$, sempre normal às superfícies de nível. Em $(1,1,1)$: $\nabla F=(1,1,-1)$.`),

  q("Máximos e Mínimos", "Mínimo por completamento de quadrados", "facil",
    R`Determine o valor mínimo de $f(x,y)=x^2+y^2-4x+6y+13$.`,
    { a: R`$0$`, b: R`$13$`, c: R`$-13$`, d: R`$1$`, e: R`$-1$` }, "a",
    R`Completando os quadrados, $f(x,y)=(x-2)^2+(y+3)^2+13-4-9=(x-2)^2+(y+3)^2$. Como soma de quadrados, o mínimo é $0$, atingido em $(2,-3)$ — o mesmo ponto crítico que $\nabla f=0$ fornece.`),

  q("Máximos e Mínimos", "Teste da segunda derivada em sistema não linear", "dificil",
    R`Seja $f(x,y)=x^3-3xy+y^3$. Determine o valor de $f$ em seu ponto de mínimo local.`,
    { a: R`$0$`, b: R`$1$`, c: R`$-1$`, d: R`$-3$`, e: R`$3$` }, "c",
    R`De $f_x=3x^2-3y=0$ vem $y=x^2$; de $f_y=-3x+3y^2=0$ vem $x=y^2$. Substituindo, $x=x^4$, logo $x=0$ ou $x=1$, dando os pontos $(0,0)$ e $(1,1)$. O hessiano é $D=f_{xx}f_{yy}-f_{xy}^2=36xy-9$. Em $(0,0)$: $D=-9<0$, sela. Em $(1,1)$: $D=27>0$ com $f_{xx}=6>0$, mínimo local, e $f(1,1)=1-3+1=-1$.`),

  q("Máximos e Mínimos", "Multiplicadores de Lagrange com restrição linear", "medio",
    R`Determine o valor mínimo de $f(x,y)=x^2+y^2$ sujeito a $x+2y=10$.`,
    { a: R`$10$`, b: R`$5$`, c: R`$25$`, d: R`$100$`, e: R`$20$` }, "e",
    R`De $\nabla f=\lambda\nabla g$ vem $(2x,2y)=\lambda(1,2)$, ou seja, $y=2x$. Na restrição: $x+4x=10\Rightarrow x=2$ e $y=4$. Então $f=4+16=20$. Geometricamente, é o quadrado da distância da origem à reta: $\dfrac{10^2}{1^2+2^2}=20$.`),

  q("Máximos e Mínimos", "Extremo em região fechada circular", "medio",
    R`Determine o valor máximo de $f(x,y)=xy$ no disco $x^2+y^2\le 1$.`,
    { a: R`$1$`, b: R`$\dfrac{1}{2}$`, c: R`$\dfrac{1}{4}$`, d: R`$2$`, e: R`$\dfrac{\sqrt2}{2}$` }, "b",
    R`No interior, $\nabla f=(y,x)=0$ só em $(0,0)$, onde $f=0$. Na fronteira, com $x=\cos\theta$ e $y=\operatorname{sen}\theta$, temos $f=\cos\theta\operatorname{sen}\theta=\dfrac{\operatorname{sen}2\theta}{2}$, cujo máximo é $\dfrac12$. Como $\dfrac12>0$, o máximo no disco é $\dfrac12$.`),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "calculo2_lote3.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
