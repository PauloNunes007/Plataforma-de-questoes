// Gerador do lote 2 de Álgebra Linear — questões autorais, nível
// universitário, estilo Boldrini / Anton & Rorres. Todas computacionais
// (resolver conta), alternativas curtas e simétricas.
// Rode: node listas_questoes/gerado/scripts/algebra_linear_lote2.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Álgebra Linear";

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
    "Sistemas Lineares, Matrizes e Determinantes",
    "Cálculo de determinante 3×3",
    "facil",
    R`Calcule o determinante da matriz $A=\begin{pmatrix}2&1&3\\0&-1&2\\1&4&1\end{pmatrix}$.`,
    {
      a: R`$13$`,
      b: R`$-7$`,
      c: R`$-13$`,
      d: R`$7$`,
      e: R`$-19$`,
    },
    "c",
    R`Expandindo pela primeira linha: $\det A=2\left[(-1)(1)-2\cdot 4\right]-1\left[0\cdot 1-2\cdot 1\right]+3\left[0\cdot 4-(-1)(1)\right]$. Ou seja, $\det A=2(-9)-1(-2)+3(1)=-18+2+3=-13$.`
  ),
  q(
    "Sistemas Lineares, Matrizes e Determinantes",
    "Discussão de sistema com parâmetro",
    "medio",
    R`Considere o sistema $\begin{cases}x+2y-z=1\\ 2x+5y+z=3\\ x+y+kz=2\end{cases}$. Para qual valor de $k$ o sistema é impossível?`,
    {
      a: R`$-4$`,
      b: R`$4$`,
      c: R`$-1$`,
      d: R`$1$`,
      e: R`$0$`,
    },
    "a",
    R`Escalonando: $L_2\to L_2-2L_1$ dá $y+3z=1$; $L_3\to L_3-L_1$ dá $-y+(k+1)z=1$. Somando as duas equações resultantes: $(k+4)z=2$. Se $k\neq -4$ há solução única; se $k=-4$ a equação vira $0=2$, uma contradição. Logo o sistema é impossível apenas para $k=-4$.`
  ),
  q(
    "Sistemas Lineares, Matrizes e Determinantes",
    "Inversão de matriz 2×2",
    "facil",
    R`Determine a matriz inversa de $A=\begin{pmatrix}2&1\\5&3\end{pmatrix}$.`,
    {
      a: R`$\begin{pmatrix}3&-1\\-5&2\end{pmatrix}$`,
      b: R`$\begin{pmatrix}3&1\\5&2\end{pmatrix}$`,
      c: R`$\begin{pmatrix}2&-1\\-5&3\end{pmatrix}$`,
      d: R`$\begin{pmatrix}-3&1\\5&-2\end{pmatrix}$`,
      e: R`$\begin{pmatrix}3&-5\\-1&2\end{pmatrix}$`,
    },
    "a",
    R`Para $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}$ vale $A^{-1}=\dfrac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$. Aqui $\det A=2\cdot 3-1\cdot 5=1$, logo $A^{-1}=\begin{pmatrix}3&-1\\-5&2\end{pmatrix}$. Conferindo, $AA^{-1}=\begin{pmatrix}1&0\\0&1\end{pmatrix}$.`
  ),
  q(
    "Sistemas Lineares, Matrizes e Determinantes",
    "Propriedades do determinante",
    "medio",
    R`Seja $A$ uma matriz $3\times 3$ inversível com $\det A=4$. Calcule $\det\left(2A^{T}A^{-1}\right)$.`,
    {
      a: R`$2$`,
      b: R`$4$`,
      c: R`$16$`,
      d: R`$32$`,
      e: R`$8$`,
    },
    "e",
    R`Use $\det(kM)=k^n\det M$ com $n=3$, $\det\left(A^{T}\right)=\det A$ e $\det\left(A^{-1}\right)=\dfrac{1}{\det A}$. Então $\det\left(2A^{T}A^{-1}\right)=2^3\det\left(A^{T}\right)\det\left(A^{-1}\right)=8\cdot 4\cdot\dfrac14=8$.`
  ),
  q(
    "Sistemas Lineares, Matrizes e Determinantes",
    "Resolução por escalonamento",
    "medio",
    R`Resolva o sistema $\begin{cases}x+2y+z=8\\ 2x-y+3z=9\\ 3x+y-2z=-1\end{cases}$ e calcule o valor de $x-y+2z$.`,
    {
      a: R`$3$`,
      b: R`$5$`,
      c: R`$7$`,
      d: R`$1$`,
      e: R`$9$`,
    },
    "b",
    R`Como $\det\begin{pmatrix}1&2&1\\2&-1&3\\3&1&-2\end{pmatrix}=30\neq 0$, a solução é única. Escalonando: $L_2\to L_2-2L_1$ dá $-5y+z=-7$; $L_3\to L_3-3L_1$ dá $-5y-5z=-25$, isto é, $y+z=5$. Subtraindo, $6z=18\Rightarrow z=3$, $y=2$ e $x=8-4-3=1$. Logo $x-y+2z=1-2+6=5$.`
  ),
  q(
    "Espaços Vetoriais",
    "Dimensão do subespaço gerado",
    "facil",
    R`Determine a dimensão do subespaço de $\mathbb{R}^3$ gerado por $v_1=(1,2,-1)$, $v_2=(2,4,-2)$ e $v_3=(1,0,1)$.`,
    {
      a: R`$1$`,
      b: R`$2$`,
      c: R`$3$`,
      d: R`$0$`,
      e: R`$4$`,
    },
    "b",
    R`Observe que $v_2=2v_1$, então $v_2$ não acrescenta nada ao espaço gerado. Restam $v_1=(1,2,-1)$ e $v_3=(1,0,1)$, que não são múltiplos um do outro, portanto são linearmente independentes. A dimensão é $2$.`
  ),
  q(
    "Espaços Vetoriais",
    "Coordenadas em relação a uma base",
    "facil",
    R`Seja $B=\left\{(1,1),(1,-1)\right\}$ uma base de $\mathbb{R}^2$. Determine as coordenadas do vetor $(5,1)$ em relação a $B$.`,
    {
      a: R`$(2,3)$`,
      b: R`$(3,-2)$`,
      c: R`$(3,2)$`,
      d: R`$(5,1)$`,
      e: R`$(4,1)$`,
    },
    "c",
    R`Procuramos $a$ e $b$ com $a(1,1)+b(1,-1)=(5,1)$, isto é, $a+b=5$ e $a-b=1$. Somando, $2a=6\Rightarrow a=3$ e $b=2$. As coordenadas são $(3,2)$.`
  ),
  q(
    "Espaços Vetoriais",
    "Matriz de mudança de base",
    "dificil",
    R`Sejam $B=\left\{(1,0),(1,1)\right\}$ e $C=\left\{(2,1),(1,1)\right\}$ bases de $\mathbb{R}^2$. Determine a matriz de mudança de base de $B$ para $C$.`,
    {
      a: R`$\begin{pmatrix}1&0\\-1&1\end{pmatrix}$`,
      b: R`$\begin{pmatrix}1&-1\\0&1\end{pmatrix}$`,
      c: R`$\begin{pmatrix}1&0\\1&1\end{pmatrix}$`,
      d: R`$\begin{pmatrix}-1&0\\1&1\end{pmatrix}$`,
      e: R`$\begin{pmatrix}2&1\\1&1\end{pmatrix}$`,
    },
    "a",
    R`As colunas são as coordenadas dos vetores de $B$ na base $C$. Para $(1,0)$: $a(2,1)+b(1,1)=(1,0)$ dá $a+b=0$ e $2a+b=1$, logo $a=1$ e $b=-1$, coluna $\begin{pmatrix}1\\-1\end{pmatrix}$. Para $(1,1)$: $2a+b=1$ e $a+b=1$ dão $a=0$ e $b=1$, coluna $\begin{pmatrix}0\\1\end{pmatrix}$. A matriz é $\begin{pmatrix}1&0\\-1&1\end{pmatrix}$.`
  ),
  q(
    "Espaços Vetoriais",
    "Interseção de subespaços",
    "medio",
    R`Sejam $W=\left\{(x,y,z)\in\mathbb{R}^3:\ x+2y-z=0\right\}$ e $U=\left\{(x,y,z)\in\mathbb{R}^3:\ x=y\right\}$. Determine $\dim(W\cap U)$.`,
    {
      a: R`$0$`,
      b: R`$2$`,
      c: R`$3$`,
      d: R`$1$`,
      e: R`$4$`,
    },
    "d",
    R`Um vetor na interseção satisfaz simultaneamente $x=y$ e $x+2y-z=0$. Substituindo, $x+2x-z=0\Rightarrow z=3x$. Assim os vetores são da forma $(t,t,3t)=t(1,1,3)$, um subespaço gerado por um único vetor não nulo. Logo $\dim(W\cap U)=1$.`
  ),
  q(
    "Espaços Vetoriais",
    "Dependência linear com parâmetro",
    "medio",
    R`Para qual valor de $k$ o conjunto $\left\{(1,2,3),(2,5,7),(1,3,k)\right\}$ é linearmente dependente?`,
    {
      a: R`$-4$`,
      b: R`$0$`,
      c: R`$2$`,
      d: R`$1$`,
      e: R`$4$`,
    },
    "e",
    R`O conjunto é LD exatamente quando o determinante da matriz cujas linhas são esses vetores se anula. Calculando: $\det\begin{pmatrix}1&2&3\\2&5&7\\1&3&k\end{pmatrix}=1(5k-21)-2(2k-7)+3(6-5)=5k-21-4k+14+3=k-4$. Portanto o conjunto é LD se e somente se $k=4$.`
  ),
  q(
    "Transformações Lineares",
    "Núcleo de uma transformação",
    "facil",
    R`Seja $T:\mathbb{R}^3\to\mathbb{R}^2$ dada por $T(x,y,z)=(x+y,\ y+z)$. Determine $\dim\left(\ker T\right)$.`,
    {
      a: R`$1$`,
      b: R`$2$`,
      c: R`$0$`,
      d: R`$3$`,
      e: R`$4$`,
    },
    "a",
    R`O núcleo é dado por $x+y=0$ e $y+z=0$, ou seja, $y=-x$ e $z=-y=x$. Os vetores têm a forma $(t,-t,t)=t(1,-1,1)$, então o núcleo é gerado por um único vetor não nulo e $\dim(\ker T)=1$.`
  ),
  q(
    "Transformações Lineares",
    "Linearidade e imagem de vetor",
    "medio",
    R`Seja $T:\mathbb{R}^2\to\mathbb{R}^2$ linear, com $T(1,1)=(3,5)$ e $T(1,-1)=(1,1)$. Calcule $T(2,0)$.`,
    {
      a: R`$(2,3)$`,
      b: R`$(4,6)$`,
      c: R`$(3,5)$`,
      d: R`$(6,4)$`,
      e: R`$(2,4)$`,
    },
    "b",
    R`Note que $(2,0)=(1,1)+(1,-1)$. Pela linearidade, $T(2,0)=T(1,1)+T(1,-1)=(3,5)+(1,1)=(4,6)$.`
  ),
  q(
    "Transformações Lineares",
    "Teorema do núcleo e da imagem",
    "facil",
    R`Seja $T:\mathbb{R}^5\to\mathbb{R}^3$ uma transformação linear sobrejetora. Determine $\dim\left(\ker T\right)$.`,
    {
      a: R`$3$`,
      b: R`$5$`,
      c: R`$2$`,
      d: R`$0$`,
      e: R`$1$`,
    },
    "c",
    R`Sobrejetividade significa $\operatorname{Im}T=\mathbb{R}^3$, logo $\dim\left(\operatorname{Im}T\right)=3$. Pelo teorema do núcleo e da imagem, $\dim\left(\ker T\right)+\dim\left(\operatorname{Im}T\right)=\dim\mathbb{R}^5=5$. Portanto $\dim\left(\ker T\right)=5-3=2$.`
  ),
  q(
    "Transformações Lineares",
    "Transformações planas: rotação",
    "facil",
    R`Aplique a rotação de $30^{\circ}$ no sentido anti-horário em torno da origem ao vetor $(2,0)$ de $\mathbb{R}^2$. Qual é o vetor obtido?`,
    {
      a: R`$(1,\sqrt3)$`,
      b: R`$(\sqrt3,-1)$`,
      c: R`$(2\sqrt3,2)$`,
      d: R`$(\sqrt3,1)$`,
      e: R`$\left(\dfrac{\sqrt3}{2},\dfrac12\right)$`,
    },
    "d",
    R`A matriz de rotação é $\begin{pmatrix}\cos\theta&-\operatorname{sen}\theta\\ \operatorname{sen}\theta&\cos\theta\end{pmatrix}$. Com $\theta=30^{\circ}$, aplicada a $(2,0)$, resulta $\left(2\cos 30^{\circ},\ 2\operatorname{sen}30^{\circ}\right)=\left(2\cdot\dfrac{\sqrt3}{2},\ 2\cdot\dfrac12\right)=(\sqrt3,1)$.`
  ),
  q(
    "Transformações Lineares",
    "Matriz de uma transformação em base não canônica",
    "dificil",
    R`Seja $T(x,y)=(x+2y,\ 3x)$ e seja $B=\left\{(1,1),(1,0)\right\}$ uma base de $\mathbb{R}^2$. Determine a matriz $\left[T\right]_B$.`,
    {
      a: R`$\begin{pmatrix}3&0\\3&-2\end{pmatrix}$`,
      b: R`$\begin{pmatrix}3&3\\0&-2\end{pmatrix}$`,
      c: R`$\begin{pmatrix}1&2\\3&0\end{pmatrix}$`,
      d: R`$\begin{pmatrix}3&3\\-2&0\end{pmatrix}$`,
      e: R`$\begin{pmatrix}3&1\\0&2\end{pmatrix}$`,
    },
    "b",
    R`As colunas de $\left[T\right]_B$ são as coordenadas em $B$ das imagens dos vetores de $B$. $T(1,1)=(3,3)$; escrevendo $a(1,1)+b(1,0)=(a+b,a)=(3,3)$ vem $a=3$, $b=0$, primeira coluna $\begin{pmatrix}3\\0\end{pmatrix}$. $T(1,0)=(1,3)$; de $(a+b,a)=(1,3)$ vem $a=3$, $b=-2$, segunda coluna $\begin{pmatrix}3\\-2\end{pmatrix}$. Logo $\left[T\right]_B=\begin{pmatrix}3&3\\0&-2\end{pmatrix}$.`
  ),
  q(
    "Operadores Lineares",
    "Autovalores de uma matriz 2×2",
    "facil",
    R`Determine os autovalores da matriz $A=\begin{pmatrix}3&1\\2&2\end{pmatrix}$.`,
    {
      a: R`$\{2,3\}$`,
      b: R`$\{1,4\}$`,
      c: R`$\{-1,4\}$`,
      d: R`$\{1,-4\}$`,
      e: R`$\{5,0\}$`,
    },
    "b",
    R`O polinômio característico é $\det(A-\lambda I)=(3-\lambda)(2-\lambda)-1\cdot 2=\lambda^2-5\lambda+4$. Suas raízes são $\lambda=1$ e $\lambda=4$. Conferindo: a soma $1+4=5$ é o traço e o produto $1\cdot 4=4$ é o determinante.`
  ),
  q(
    "Operadores Lineares",
    "Autovetores",
    "facil",
    R`Seja $A=\begin{pmatrix}1&2\\2&1\end{pmatrix}$. Determine um autovetor associado ao autovalor $\lambda=-1$.`,
    {
      a: R`$(1,1)$`,
      b: R`$(2,-1)$`,
      c: R`$(0,1)$`,
      d: R`$(1,0)$`,
      e: R`$(1,-1)$`,
    },
    "e",
    R`Resolva $(A+I)v=0$, isto é, $\begin{pmatrix}2&2\\2&2\end{pmatrix}\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}$, o que dá $x+y=0$, ou $y=-x$. Um autovetor é $(1,-1)$. Verificando: $A(1,-1)=(1-2,\ 2-1)=(-1,1)=-1\cdot(1,-1)$.`
  ),
  q(
    "Operadores Lineares",
    "Determinante via diagonalização",
    "medio",
    R`Uma matriz $A$ é diagonalizável e satisfaz $A=PDP^{-1}$, com $D=\operatorname{diag}(2,4)$. Calcule $\det\left(A^3\right)$.`,
    {
      a: R`$64$`,
      b: R`$8$`,
      c: R`$216$`,
      d: R`$512$`,
      e: R`$128$`,
    },
    "d",
    R`Matrizes semelhantes têm o mesmo determinante, logo $\det A=\det D=2\cdot 4=8$. Como $\det\left(A^3\right)=\left(\det A\right)^3$, temos $\det\left(A^3\right)=8^3=512$.`
  ),
  q(
    "Operadores Lineares",
    "Potência de matriz triangular",
    "medio",
    R`Seja $A=\begin{pmatrix}2&1\\0&2\end{pmatrix}$. Calcule $A^4$.`,
    {
      a: R`$\begin{pmatrix}16&32\\0&16\end{pmatrix}$`,
      b: R`$\begin{pmatrix}16&4\\0&16\end{pmatrix}$`,
      c: R`$\begin{pmatrix}16&8\\0&16\end{pmatrix}$`,
      d: R`$\begin{pmatrix}8&16\\0&8\end{pmatrix}$`,
      e: R`$\begin{pmatrix}16&16\\0&16\end{pmatrix}$`,
    },
    "a",
    R`Escreva $A=2I+N$ com $N=\begin{pmatrix}0&1\\0&0\end{pmatrix}$, que é nilpotente ($N^2=0$). Como $I$ e $N$ comutam, o binômio dá $A^n=(2I)^n+n(2I)^{n-1}N=\begin{pmatrix}2^n&n2^{n-1}\\0&2^n\end{pmatrix}$. Para $n=4$: $2^4=16$ e $4\cdot 2^3=32$, ou seja, $A^4=\begin{pmatrix}16&32\\0&16\end{pmatrix}$.`
  ),
  q(
    "Operadores Lineares",
    "Dimensão de autoespaço e diagonalização",
    "dificil",
    R`Seja $A=\begin{pmatrix}1&2&1\\0&1&0\\0&0&2\end{pmatrix}$. Determine a dimensão do autoespaço associado ao autovalor $\lambda=1$.`,
    {
      a: R`$2$`,
      b: R`$3$`,
      c: R`$1$`,
      d: R`$0$`,
      e: R`$4$`,
    },
    "c",
    R`Como $A$ é triangular, os autovalores são $1$, $1$ e $2$, e $\lambda=1$ tem multiplicidade algébrica $2$. O autoespaço é o núcleo de $A-I=\begin{pmatrix}0&2&1\\0&0&0\\0&0&1\end{pmatrix}$, cujas linhas não nulas $(0,2,1)$ e $(0,0,1)$ são independentes, logo o posto é $2$. Pelo teorema do núcleo e da imagem, a nulidade é $3-2=1$. Como $1<2$, $A$ não é diagonalizável.`
  ),
  q(
    "Diagonalização de Matrizes Simétricas",
    "Processo de Gram-Schmidt",
    "medio",
    R`Aplique o processo de Gram-Schmidt (sem normalizar) aos vetores $v_1=(1,1,0)$ e $v_2=(1,0,1)$, nessa ordem. Qual é o segundo vetor obtido?`,
    {
      a: R`$\left(\dfrac12,\dfrac12,1\right)$`,
      b: R`$\left(\dfrac12,-\dfrac12,1\right)$`,
      c: R`$\left(-\dfrac12,\dfrac12,1\right)$`,
      d: R`$(1,-1,1)$`,
      e: R`$(1,0,1)$`,
    },
    "b",
    R`Tome $u_1=v_1=(1,1,0)$. Então $u_2=v_2-\dfrac{v_2\cdot u_1}{u_1\cdot u_1}u_1$. Como $v_2\cdot u_1=1$ e $u_1\cdot u_1=2$, temos $u_2=(1,0,1)-\dfrac12(1,1,0)=\left(\dfrac12,-\dfrac12,1\right)$. Conferindo a ortogonalidade: $u_1\cdot u_2=\dfrac12-\dfrac12+0=0$.`
  ),
  q(
    "Diagonalização de Matrizes Simétricas",
    "Projeção ortogonal",
    "facil",
    R`Determine a projeção ortogonal do vetor $(3,4)$ sobre a reta gerada por $(1,2)$.`,
    {
      a: R`$\left(\dfrac{11}{5},\dfrac{11}{5}\right)$`,
      b: R`$\left(\dfrac{3}{5},\dfrac{6}{5}\right)$`,
      c: R`$(11,22)$`,
      d: R`$\left(\dfrac{22}{5},\dfrac{11}{5}\right)$`,
      e: R`$\left(\dfrac{11}{5},\dfrac{22}{5}\right)$`,
    },
    "e",
    R`A projeção é $\dfrac{u\cdot v}{v\cdot v}v$ com $u=(3,4)$ e $v=(1,2)$. Temos $u\cdot v=3+8=11$ e $v\cdot v=1+4=5$, logo a projeção é $\dfrac{11}{5}(1,2)=\left(\dfrac{11}{5},\dfrac{22}{5}\right)$.`
  ),
  q(
    "Diagonalização de Matrizes Simétricas",
    "Autovalores de matriz simétrica",
    "facil",
    R`Determine o maior autovalor da matriz simétrica $A=\begin{pmatrix}5&4\\4&5\end{pmatrix}$.`,
    {
      a: R`$5$`,
      b: R`$1$`,
      c: R`$4$`,
      d: R`$9$`,
      e: R`$10$`,
    },
    "d",
    R`O polinômio característico é $(5-\lambda)^2-16=\lambda^2-10\lambda+9$, com raízes $\lambda=1$ e $\lambda=9$. O maior autovalor é $9$, associado ao autovetor $(1,1)$.`
  ),
  q(
    "Diagonalização de Matrizes Simétricas",
    "Complemento ortogonal",
    "facil",
    R`Seja $W$ o subespaço de $\mathbb{R}^3$ gerado por $(1,1,1)$. Qual dos vetores abaixo pertence a $W^{\perp}$?`,
    {
      a: R`$(1,-2,1)$`,
      b: R`$(1,1,1)$`,
      c: R`$(2,1,0)$`,
      d: R`$(1,0,0)$`,
      e: R`$(0,1,1)$`,
    },
    "a",
    R`Um vetor pertence a $W^{\perp}$ quando seu produto interno com $(1,1,1)$ é nulo, isto é, quando a soma de suas coordenadas é zero. Testando: $1-2+1=0$ (satisfaz); $1+1+1=3$; $2+1+0=3$; $1+0+0=1$; $0+1+1=2$. Apenas $(1,-2,1)$ está em $W^{\perp}$.`
  ),
  q(
    "Diagonalização de Matrizes Simétricas",
    "Forma quadrática e autovalores",
    "medio",
    R`Considere a forma quadrática $q(x,y)=3x^2+2xy+3y^2$. Determine o valor mínimo de $q$ sobre a circunferência $x^2+y^2=1$.`,
    {
      a: R`$4$`,
      b: R`$3$`,
      c: R`$2$`,
      d: R`$1$`,
      e: R`$6$`,
    },
    "c",
    R`A matriz simétrica associada é $A=\begin{pmatrix}3&1\\1&3\end{pmatrix}$, pois $q(x,y)=\begin{pmatrix}x&y\end{pmatrix}A\begin{pmatrix}x\\y\end{pmatrix}$. Seus autovalores são $\lambda=3\pm 1$, ou seja, $2$ e $4$. Pelo teorema espectral, sobre vetores unitários $q$ varia entre o menor e o maior autovalor. O mínimo é $2$, atingido na direção do autovetor $(1,-1)$.`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "algebra_linear_lote2.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
