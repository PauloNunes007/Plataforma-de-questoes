// Gerador do lote 1 de Cálculo III — a matéria estava com ZERO questões no
// banco. Nível universitário, estilo Guidorizzi vol. 3 / Stewart (Cálculo 2).
// Todas computacionais, alternativas curtas e simétricas.
// Rode: node listas_questoes/gerado/scripts/calculo3_lote1.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Cálculo III";

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
    "Integrais Duplas",
    "Integral dupla sobre retângulo",
    "facil",
    R`Calcule $\displaystyle\int_0^1\!\!\int_0^2 (x+2y)\,dy\,dx$.`,
    { a: R`$3$`, b: R`$4$`, c: R`$5$`, d: R`$6$`, e: R`$8$` },
    "c",
    R`Integrando primeiro em $y$, com $x$ fixo: $\int_0^2 (x+2y)\,dy=\left[xy+y^2\right]_0^2=2x+4$. Em seguida, $\int_0^1 (2x+4)\,dx=\left[x^2+4x\right]_0^1=1+4=5$.`
  ),
  q(
    "Integrais Duplas",
    "Região de tipo I",
    "medio",
    R`Calcule $\displaystyle\iint_D 2x\,dA$, em que $D$ é a região limitada por $y=x^2$ e $y=x$.`,
    { a: R`$\dfrac{1}{6}$`, b: R`$\dfrac{1}{12}$`, c: R`$\dfrac{1}{3}$`, d: R`$\dfrac{1}{2}$`, e: R`$\dfrac{2}{3}$` },
    "a",
    R`As curvas se cruzam em $x=0$ e $x=1$, e nesse intervalo $x^2\le y\le x$. Assim $\iint_D 2x\,dA=\int_0^1\!\!\int_{x^2}^{x}2x\,dy\,dx=\int_0^1 2x\left(x-x^2\right)dx=\int_0^1\left(2x^2-2x^3\right)dx=\dfrac23-\dfrac12=\dfrac16$.`
  ),
  q(
    "Integrais Duplas",
    "Inversão da ordem de integração",
    "dificil",
    R`Calcule $\displaystyle\int_0^1\!\!\int_y^1 e^{x^2}\,dx\,dy$ invertendo a ordem de integração.`,
    { a: R`$e-1$`, b: R`$\dfrac{e+1}{2}$`, c: R`$\dfrac{e}{2}$`, d: R`$\dfrac{e-1}{2}$`, e: R`$\dfrac{e^2-1}{2}$` },
    "d",
    R`A região é $\{(x,y):0\le y\le 1,\ y\le x\le 1\}$, que descrita na outra ordem vira $0\le x\le 1$, $0\le y\le x$. Logo a integral é $\int_0^1\!\!\int_0^x e^{x^2}dy\,dx=\int_0^1 x\,e^{x^2}dx=\left[\dfrac{e^{x^2}}{2}\right]_0^1=\dfrac{e-1}{2}$. Na ordem original a primitiva de $e^{x^2}$ não é elementar.`
  ),
  q(
    "Integrais Duplas",
    "Coordenadas polares",
    "medio",
    R`Calcule $\displaystyle\iint_D \sqrt{x^2+y^2}\,dA$, em que $D$ é o disco $x^2+y^2\le 9$.`,
    { a: R`$9\pi$`, b: R`$18\pi$`, c: R`$27\pi$`, d: R`$6\pi$`, e: R`$54\pi$` },
    "b",
    R`Em coordenadas polares, $\sqrt{x^2+y^2}=r$ e $dA=r\,dr\,d\theta$. Então a integral é $\int_0^{2\pi}\!\!\int_0^3 r\cdot r\,dr\,d\theta=2\pi\left[\dfrac{r^3}{3}\right]_0^3=2\pi\cdot 9=18\pi$.`
  ),
  q(
    "Integrais Duplas",
    "Jacobiano e mudança de variáveis",
    "dificil",
    R`Use a mudança de variáveis $u=y-x$ e $v=y+2x$ para calcular a área da região limitada pelas retas $y=x$, $y=x+2$, $y=-2x$ e $y=3-2x$.`,
    { a: R`$1$`, b: R`$3$`, c: R`$6$`, d: R`$18$`, e: R`$2$` },
    "e",
    R`As quatro retas viram $u=0$, $u=2$, $v=0$ e $v=3$, ou seja, um retângulo no plano $uv$. O jacobiano da transformação direta é $\dfrac{\partial(u,v)}{\partial(x,y)}=\begin{vmatrix}-1&1\\2&1\end{vmatrix}=-3$, logo $dA=dx\,dy=\dfrac{du\,dv}{3}$. A área é $\dfrac13\int_0^2\!\!\int_0^3 dv\,du=\dfrac{2\cdot 3}{3}=2$.`
  ),
  q(
    "Integrais Triplas",
    "Integral tripla sobre paralelepípedo",
    "facil",
    R`Calcule $\displaystyle\iiint_B xyz\,dV$, em que $B=[0,1]\times[0,2]\times[0,3]$.`,
    { a: R`$\dfrac{9}{2}$`, b: R`$3$`, c: R`$6$`, d: R`$9$`, e: R`$\dfrac{27}{2}$` },
    "a",
    R`Como o integrando se fatora e a região é um paralelepípedo, a integral é o produto das integrais unidimensionais: $\left(\int_0^1 x\,dx\right)\left(\int_0^2 y\,dy\right)\left(\int_0^3 z\,dz\right)=\dfrac12\cdot 2\cdot\dfrac92=\dfrac92$.`
  ),
  q(
    "Integrais Triplas",
    "Volume por integral tripla",
    "medio",
    R`Calcule o volume do sólido limitado superiormente pelo paraboloide $z=4-x^2-y^2$ e inferiormente pelo plano $z=0$.`,
    { a: R`$4\pi$`, b: R`$16\pi$`, c: R`$\dfrac{32\pi}{3}$`, d: R`$8\pi$`, e: R`$\dfrac{64\pi}{3}$` },
    "d",
    R`A projeção no plano $xy$ é o disco $x^2+y^2\le 4$. Em coordenadas polares, $V=\int_0^{2\pi}\!\!\int_0^2\left(4-r^2\right)r\,dr\,d\theta=2\pi\left[2r^2-\dfrac{r^4}{4}\right]_0^2=2\pi\left(8-4\right)=8\pi$.`
  ),
  q(
    "Integrais Triplas",
    "Coordenadas cilíndricas",
    "medio",
    R`Calcule $\displaystyle\iiint_E z\,dV$, em que $E$ é o cilindro $x^2+y^2\le 1$ com $0\le z\le 2$.`,
    { a: R`$\pi$`, b: R`$2\pi$`, c: R`$4\pi$`, d: R`$\dfrac{\pi}{2}$`, e: R`$8\pi$` },
    "b",
    R`Em cilíndricas, $dV=r\,dz\,dr\,d\theta$ e o integrando não depende de $r$ nem de $\theta$: $\int_0^{2\pi}\!\!\int_0^1\!\!\int_0^2 z\,r\,dz\,dr\,d\theta=2\pi\cdot\left[\dfrac{r^2}{2}\right]_0^1\cdot\left[\dfrac{z^2}{2}\right]_0^2=2\pi\cdot\dfrac12\cdot 2=2\pi$.`
  ),
  q(
    "Integrais Triplas",
    "Coordenadas esféricas",
    "dificil",
    R`Calcule $\displaystyle\iiint_E \left(x^2+y^2+z^2\right)dV$, em que $E$ é a bola $x^2+y^2+z^2\le 4$.`,
    { a: R`$\dfrac{32\pi}{5}$`, b: R`$\dfrac{64\pi}{5}$`, c: R`$\dfrac{32\pi}{3}$`, d: R`$\dfrac{256\pi}{5}$`, e: R`$\dfrac{128\pi}{5}$` },
    "e",
    R`Em esféricas, $x^2+y^2+z^2=\rho^2$ e $dV=\rho^2\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta$. Então a integral é $\int_0^{2\pi}\!\!\int_0^{\pi}\!\!\int_0^2\rho^4\operatorname{sen}\varphi\,d\rho\,d\varphi\,d\theta=2\pi\cdot 2\cdot\dfrac{32}{5}=\dfrac{128\pi}{5}$.`
  ),
  q(
    "Integrais Triplas",
    "Massa com densidade variável",
    "medio",
    R`Um cubo ocupa a região $[0,1]^3$ e tem densidade $\delta(x,y,z)=x+y+z$. Calcule sua massa.`,
    { a: R`$1$`, b: R`$\dfrac{1}{2}$`, c: R`$\dfrac{3}{2}$`, d: R`$3$`, e: R`$2$` },
    "c",
    R`A massa é $\iiint_B (x+y+z)\,dV$. Por simetria, as três parcelas dão o mesmo valor: $\iiint_B x\,dV=\left(\int_0^1x\,dx\right)(1)(1)=\dfrac12$. Logo a massa é $3\cdot\dfrac12=\dfrac32$.`
  ),
  q(
    "Integral de Linha",
    "Integral de linha de campo escalar",
    "medio",
    R`Calcule $\displaystyle\int_C (x+y)\,ds$, em que $C$ é o segmento de reta de $(0,0)$ a $(1,2)$.`,
    { a: R`$\sqrt5$`, b: R`$\dfrac{3\sqrt5}{2}$`, c: R`$3\sqrt5$`, d: R`$\dfrac{3\sqrt5}{4}$`, e: R`$\dfrac{3}{2}$` },
    "b",
    R`Parametrize por $x=t$, $y=2t$ com $t\in[0,1]$. Então $ds=\sqrt{1^2+2^2}\,dt=\sqrt5\,dt$ e $x+y=3t$. Logo $\int_C (x+y)\,ds=\int_0^1 3t\sqrt5\,dt=\sqrt5\left[\dfrac{3t^2}{2}\right]_0^1=\dfrac{3\sqrt5}{2}$.`
  ),
  q(
    "Integral de Linha",
    "Independência do caminho",
    "medio",
    R`Seja $\vec{F}(x,y)=\left(y,\ x\right)$. Calcule $\displaystyle\int_C \vec{F}\cdot d\vec{r}$ ao longo de qualquer curva de $(0,0)$ a $(2,3)$.`,
    { a: R`$0$`, b: R`$3$`, c: R`$5$`, d: R`$12$`, e: R`$6$` },
    "e",
    R`O campo é conservativo, pois $\dfrac{\partial}{\partial x}(x)=1=\dfrac{\partial}{\partial y}(y)$, com função potencial $f(x,y)=xy$. Pelo teorema fundamental das integrais de linha, o valor depende só dos extremos: $f(2,3)-f(0,0)=6-0=6$.`
  ),
  q(
    "Integral de Linha",
    "Teorema de Green",
    "medio",
    R`Use o teorema de Green para calcular $\displaystyle\oint_C (x-y)\,dx+(x+y)\,dy$, em que $C$ é a circunferência $x^2+y^2=4$ percorrida no sentido anti-horário.`,
    { a: R`$8\pi$`, b: R`$4\pi$`, c: R`$16\pi$`, d: R`$2\pi$`, e: R`$0$` },
    "a",
    R`Com $P=x-y$ e $Q=x+y$, o teorema de Green dá $\oint_C P\,dx+Q\,dy=\iint_D\left(\dfrac{\partial Q}{\partial x}-\dfrac{\partial P}{\partial y}\right)dA=\iint_D\left[1-(-1)\right]dA=2\cdot\text{área}(D)$. Como $D$ é o disco de raio $2$, a área é $4\pi$ e o resultado é $8\pi$.`
  ),
  q(
    "Integral de Linha",
    "Área por integral de linha",
    "medio",
    R`Use a fórmula $A=\dfrac12\displaystyle\oint_C\left(x\,dy-y\,dx\right)$ para calcular a área da região limitada pela elipse $\dfrac{x^2}{9}+\dfrac{y^2}{4}=1$.`,
    { a: R`$5\pi$`, b: R`$12\pi$`, c: R`$6\pi$`, d: R`$36\pi$`, e: R`$13\pi$` },
    "c",
    R`Parametrize por $x=3\cos t$, $y=2\operatorname{sen}t$, $t\in[0,2\pi]$. Então $x\,dy-y\,dx=\left(6\cos^2t+6\operatorname{sen}^2t\right)dt=6\,dt$, e $A=\dfrac12\int_0^{2\pi}6\,dt=6\pi$. Confere com $A=\pi ab=\pi(3)(2)$.`
  ),
  q(
    "Integral de Linha",
    "Campo conservativo e função potencial",
    "dificil",
    R`Seja $\vec{F}(x,y)=\left(2xy+3,\ x^2-1\right)$, que é conservativo. Calcule $\displaystyle\int_C \vec{F}\cdot d\vec{r}$ de $(0,0)$ a $(1,2)$.`,
    { a: R`$1$`, b: R`$2$`, c: R`$5$`, d: R`$3$`, e: R`$7$` },
    "d",
    R`Procuramos $f$ com $f_x=2xy+3$, logo $f=x^2y+3x+g(y)$. Derivando, $f_y=x^2+g'(y)$, e comparando com $x^2-1$ vem $g'(y)=-1$, isto é, $g(y)=-y$. Assim $f(x,y)=x^2y+3x-y$ e a integral vale $f(1,2)-f(0,0)=(2+3-2)-0=3$.`
  ),
  q(
    "Integrais de Superfície",
    "Área de superfície plana",
    "medio",
    R`Calcule a área da parte do plano $z=2x+3y$ que se projeta sobre o retângulo $[0,1]\times[0,2]$ do plano $xy$.`,
    { a: R`$\sqrt{14}$`, b: R`$4\sqrt{14}$`, c: R`$2\sqrt{13}$`, d: R`$14$`, e: R`$2\sqrt{14}$` },
    "e",
    R`Para $z=f(x,y)$, $dS=\sqrt{1+f_x^2+f_y^2}\,dA$. Aqui $f_x=2$ e $f_y=3$, logo $dS=\sqrt{1+4+9}\,dA=\sqrt{14}\,dA$, constante. A área da projeção é $1\cdot 2=2$, então a área da superfície é $2\sqrt{14}$.`
  ),
  q(
    "Integrais de Superfície",
    "Área de hemisfério",
    "facil",
    R`Calcule a área da parte da esfera $x^2+y^2+z^2=9$ situada acima do plano $z=0$.`,
    { a: R`$18\pi$`, b: R`$36\pi$`, c: R`$9\pi$`, d: R`$12\pi$`, e: R`$27\pi$` },
    "a",
    R`A área total da esfera de raio $a$ é $4\pi a^2$. Com $a=3$, isso dá $36\pi$, e o hemisfério é exatamente metade: $18\pi$.`
  ),
  q(
    "Integrais de Superfície",
    "Integral de superfície de campo escalar",
    "dificil",
    R`Calcule $\displaystyle\iint_S z\,dS$, em que $S$ é o hemisfério $x^2+y^2+z^2=4$ com $z\ge 0$.`,
    { a: R`$4\pi$`, b: R`$2\pi$`, c: R`$8\pi$`, d: R`$16\pi$`, e: R`$\dfrac{32\pi}{3}$` },
    "c",
    R`Parametrize pela esfera de raio $a=2$: $z=a\cos\varphi$ e $dS=a^2\operatorname{sen}\varphi\,d\varphi\,d\theta$. Então $\iint_S z\,dS=\int_0^{2\pi}\!\!\int_0^{\pi/2}a^3\cos\varphi\operatorname{sen}\varphi\,d\varphi\,d\theta=2\pi a^3\cdot\dfrac12=\pi a^3$. Com $a=2$: $8\pi$.`
  ),
  q(
    "Integrais de Superfície",
    "Fluxo de campo vetorial",
    "medio",
    R`Calcule o fluxo do campo $\vec{F}=(0,0,z)$ através do disco $S$ dado por $z=3$, $x^2+y^2\le 4$, orientado com normal para cima.`,
    { a: R`$4\pi$`, b: R`$12\pi$`, c: R`$3\pi$`, d: R`$24\pi$`, e: R`$6\pi$` },
    "b",
    R`Com a normal $\hat{n}=(0,0,1)$, tem-se $\vec{F}\cdot\hat{n}=z$, que sobre $S$ vale constantemente $3$. Logo o fluxo é $3$ vezes a área do disco: $3\cdot\pi(2)^2=12\pi$.`
  ),
  q(
    "Integrais de Superfície",
    "Área lateral de cilindro",
    "facil",
    R`Calcule a área da superfície lateral do cilindro $x^2+y^2=4$ compreendida entre os planos $z=0$ e $z=5$.`,
    { a: R`$10\pi$`, b: R`$40\pi$`, c: R`$5\pi$`, d: R`$20\pi$`, e: R`$80\pi$` },
    "d",
    R`Parametrizando por $\theta$ e $z$, o elemento de área é $dS=a\,d\theta\,dz$ com $a=2$. Assim a área é $\int_0^{5}\!\!\int_0^{2\pi}2\,d\theta\,dz=2\cdot 2\pi\cdot 5=20\pi$, isto é, $2\pi ah$.`
  ),
  q(
    "Teorema de Stokes",
    "Circulação via rotacional",
    "medio",
    R`Use o teorema de Stokes para calcular $\displaystyle\oint_C \vec{F}\cdot d\vec{r}$, com $\vec{F}=(y,-x,0)$ e $C$ a circunferência $x^2+y^2=1$ no plano $z=0$, orientada de modo compatível com a normal $\hat{n}=(0,0,1)$.`,
    { a: R`$-2\pi$`, b: R`$2\pi$`, c: R`$-\pi$`, d: R`$0$`, e: R`$-4\pi$` },
    "a",
    R`O rotacional é $\nabla\times\vec{F}=\left(0-0,\ 0-0,\ \dfrac{\partial(-x)}{\partial x}-\dfrac{\partial y}{\partial y}\right)=(0,0,-2)$. Tomando como superfície o disco de raio $1$ com normal $(0,0,1)$: $\oint_C\vec{F}\cdot d\vec{r}=\iint_S(0,0,-2)\cdot(0,0,1)\,dS=-2\cdot\pi=-2\pi$.`
  ),
  q(
    "Teorema de Stokes",
    "Cálculo do rotacional",
    "medio",
    R`Seja $\vec{F}=\left(xz,\ xyz,\ -y^2\right)$. Calcule $\nabla\times\vec{F}$ no ponto $(1,1,1)$.`,
    { a: R`$(-3,-1,1)$`, b: R`$(3,1,1)$`, c: R`$(-3,1,1)$`, d: R`$(-2,1,1)$`, e: R`$(-3,1,-1)$` },
    "c",
    R`Com $\vec{F}=(P,Q,R)$, vale $\nabla\times\vec{F}=\left(R_y-Q_z,\ P_z-R_x,\ Q_x-P_y\right)$. Aqui $R_y=-2y$, $Q_z=xy$, $P_z=x$, $R_x=0$, $Q_x=yz$ e $P_y=0$, logo $\nabla\times\vec{F}=\left(-2y-xy,\ x,\ yz\right)$. Em $(1,1,1)$: $(-3,1,1)$.`
  ),
  q(
    "Teorema de Stokes",
    "Stokes sobre superfície triangular",
    "dificil",
    R`Seja $\vec{F}=(z,x,y)$ e $C$ o contorno do triângulo de vértices $(1,0,0)$, $(0,1,0)$ e $(0,0,1)$, orientado de modo compatível com a normal que aponta para longe da origem. Calcule $\displaystyle\oint_C \vec{F}\cdot d\vec{r}$.`,
    { a: R`$3$`, b: R`$\dfrac{\sqrt3}{2}$`, c: R`$\dfrac{1}{2}$`, d: R`$\dfrac{3\sqrt3}{2}$`, e: R`$\dfrac{3}{2}$` },
    "e",
    R`O rotacional é $\nabla\times\vec{F}=(1,1,1)$. O triângulo está no plano $x+y+z=1$, de normal unitária $\hat{n}=\dfrac{(1,1,1)}{\sqrt3}$. Seus lados medem $\sqrt2$, então é equilátero de área $\dfrac{\sqrt3}{4}\left(\sqrt2\right)^2=\dfrac{\sqrt3}{2}$. Logo $\oint_C\vec{F}\cdot d\vec{r}=\dfrac{(1,1,1)\cdot(1,1,1)}{\sqrt3}\cdot\dfrac{\sqrt3}{2}=\dfrac{3}{\sqrt3}\cdot\dfrac{\sqrt3}{2}=\dfrac32$.`
  ),
  q(
    "Teorema de Stokes",
    "Campo conservativo no espaço",
    "medio",
    R`O campo $\vec{F}=\left(2xy,\ x^2+z^2,\ 2yz\right)$ tem rotacional nulo. Calcule $\displaystyle\int_C\vec{F}\cdot d\vec{r}$ de $(0,0,0)$ a $(1,1,1)$.`,
    { a: R`$1$`, b: R`$2$`, c: R`$3$`, d: R`$0$`, e: R`$4$` },
    "b",
    R`De $f_x=2xy$ vem $f=x^2y+g(y,z)$. Então $f_y=x^2+g_y=x^2+z^2$ dá $g_y=z^2$, logo $g=yz^2+h(z)$. Por fim $f_z=2yz+h'(z)=2yz$ dá $h$ constante. Com $f(x,y,z)=x^2y+yz^2$, a integral vale $f(1,1,1)-f(0,0,0)=1+1=2$.`
  ),
  q(
    "Teorema de Stokes",
    "Stokes com rotacional variável",
    "dificil",
    R`Seja $\vec{F}=\left(-y^3,\ x^3,\ z^3\right)$ e $C$ a circunferência $x^2+y^2=1$ no plano $z=0$, percorrida no sentido anti-horário. Calcule $\displaystyle\oint_C\vec{F}\cdot d\vec{r}$.`,
    { a: R`$3\pi$`, b: R`$\dfrac{\pi}{2}$`, c: R`$\dfrac{3\pi}{4}$`, d: R`$\dfrac{3\pi}{2}$`, e: R`$6\pi$` },
    "d",
    R`A componente $z$ do rotacional é $Q_x-P_y=3x^2-\left(-3y^2\right)=3\left(x^2+y^2\right)=3r^2$. Tomando o disco unitário com normal $(0,0,1)$: $\oint_C\vec{F}\cdot d\vec{r}=\iint_D 3r^2dA=3\int_0^{2\pi}\!\!\int_0^1 r^3dr\,d\theta=3\cdot 2\pi\cdot\dfrac14=\dfrac{3\pi}{2}$.`
  ),
  q(
    "Teorema de Gauss",
    "Divergência sobre um cubo",
    "medio",
    R`Use o teorema da divergência para calcular o fluxo de $\vec{F}=\left(x^2,y^2,z^2\right)$ através da superfície do cubo $[0,1]^3$, orientada para fora.`,
    { a: R`$1$`, b: R`$3$`, c: R`$6$`, d: R`$2$`, e: R`$\dfrac{3}{2}$` },
    "b",
    R`A divergência é $\nabla\cdot\vec{F}=2x+2y+2z$. Então o fluxo é $\iiint_B(2x+2y+2z)\,dV$. Cada parcela vale $2\cdot\dfrac12=1$ sobre o cubo unitário, logo o total é $3$.`
  ),
  q(
    "Teorema de Gauss",
    "Fluxo através de esfera",
    "facil",
    R`Calcule o fluxo de $\vec{F}=(x,y,z)$ através da esfera $x^2+y^2+z^2=4$, orientada para fora.`,
    { a: R`$16\pi$`, b: R`$8\pi$`, c: R`$64\pi$`, d: R`$96\pi$`, e: R`$32\pi$` },
    "e",
    R`Como $\nabla\cdot\vec{F}=1+1+1=3$, o teorema da divergência dá fluxo $=3\cdot\text{volume da bola}=3\cdot\dfrac{4}{3}\pi(2)^3=32\pi$.`
  ),
  q(
    "Teorema de Gauss",
    "Cálculo da divergência",
    "facil",
    R`Seja $\vec{F}=\left(x^2y,\ yz,\ xz^2\right)$. Calcule $\nabla\cdot\vec{F}$ no ponto $(1,2,3)$.`,
    { a: R`$13$`, b: R`$11$`, c: R`$9$`, d: R`$15$`, e: R`$7$` },
    "a",
    R`A divergência é $\nabla\cdot\vec{F}=\dfrac{\partial}{\partial x}\left(x^2y\right)+\dfrac{\partial}{\partial y}\left(yz\right)+\dfrac{\partial}{\partial z}\left(xz^2\right)=2xy+z+2xz$. Em $(1,2,3)$: $4+3+6=13$.`
  ),
  q(
    "Teorema de Gauss",
    "Fluxo através de cilindro fechado",
    "medio",
    R`Calcule o fluxo de $\vec{F}=(x,y,0)$ através da superfície fechada do cilindro $x^2+y^2\le 9$, $0\le z\le 2$, orientada para fora.`,
    { a: R`$18\pi$`, b: R`$72\pi$`, c: R`$36\pi$`, d: R`$12\pi$`, e: R`$9\pi$` },
    "c",
    R`A divergência é $\nabla\cdot\vec{F}=1+1+0=2$, constante. O volume do cilindro é $\pi(3)^2(2)=18\pi$, logo o fluxo é $2\cdot 18\pi=36\pi$. As tampas não contribuem, pois lá $\vec{F}$ é perpendicular à normal.`
  ),
  q(
    "Teorema de Gauss",
    "Divergência constante sobre bola",
    "medio",
    R`Calcule o fluxo de $\vec{F}=(3x,-2y,4z)$ através da esfera unitária $x^2+y^2+z^2=1$, orientada para fora.`,
    { a: R`$\dfrac{5\pi}{3}$`, b: R`$20\pi$`, c: R`$\dfrac{4\pi}{3}$`, d: R`$\dfrac{20\pi}{3}$`, e: R`$\dfrac{10\pi}{3}$` },
    "d",
    R`A divergência é $\nabla\cdot\vec{F}=3-2+4=5$, constante. O volume da bola unitária é $\dfrac{4\pi}{3}$, logo o fluxo é $5\cdot\dfrac{4\pi}{3}=\dfrac{20\pi}{3}$.`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "calculo3_lote1.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
