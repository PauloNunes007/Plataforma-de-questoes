// Lote 3 de Álgebra Linear — 4 questões por tópico, estilo Boldrini /
// Anton & Rorres. Todas computacionais.
// Rode: node listas_questoes/gerado/scripts/algebra_linear_lote3.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Álgebra Linear";

const q = (topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao) => ({
  materia: MATERIA, topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao,
  instituicao: null, ano: null, tikz_code: null,
});

const questoes = [
  q("Sistemas Lineares, Matrizes e Determinantes", "Determinante por cofatores", "facil",
    R`Calcule o determinante de $A=\begin{pmatrix}1&2&3\\4&5&6\\7&8&10\end{pmatrix}$.`,
    { a: R`$0$`, b: R`$3$`, c: R`$-3$`, d: R`$-6$`, e: R`$6$` }, "c",
    R`Expandindo pela primeira linha: $\det A=1(5\cdot 10-6\cdot 8)-2(4\cdot 10-6\cdot 7)+3(4\cdot 8-5\cdot 7)=1(2)-2(-2)+3(-3)=2+4-9=-3$. Como é não nulo, $A$ é inversível.`),

  q("Sistemas Lineares, Matrizes e Determinantes", "Sistema homogêneo com solução não trivial", "medio",
    R`Para quantos valores reais de $k$ o sistema homogêneo $\begin{cases}kx+y=0\\ x+ky=0\end{cases}$ admite solução diferente da trivial?`,
    { a: R`$2$`, b: R`$1$`, c: R`$0$`, d: R`$3$`, e: R`infinitos` }, "a",
    R`Um sistema homogêneo quadrado tem solução não trivial exatamente quando o determinante da matriz dos coeficientes se anula: $\begin{vmatrix}k&1\\1&k\end{vmatrix}=k^2-1=0$, ou seja, $k=1$ ou $k=-1$. São $2$ valores.`),

  q("Sistemas Lineares, Matrizes e Determinantes", "Traço de um produto de matrizes", "medio",
    R`Sejam $A=\begin{pmatrix}1&2\\3&4\end{pmatrix}$ e $B=\begin{pmatrix}5&6\\7&8\end{pmatrix}$. Calcule o traço de $AB$.`,
    { a: R`$19$`, b: R`$50$`, c: R`$43$`, d: R`$69$`, e: R`$22$` }, "d",
    R`O produto é $AB=\begin{pmatrix}1\cdot 5+2\cdot 7&1\cdot 6+2\cdot 8\\3\cdot 5+4\cdot 7&3\cdot 6+4\cdot 8\end{pmatrix}=\begin{pmatrix}19&22\\43&50\end{pmatrix}$. O traço é $19+50=69$.`),

  q("Sistemas Lineares, Matrizes e Determinantes", "Regra de Cramer", "medio",
    R`Use a regra de Cramer para determinar $x$ no sistema $\begin{cases}2x+3y=0\\ x-y=5\end{cases}$.`,
    { a: R`$5$`, b: R`$3$`, c: R`$-2$`, d: R`$1$`, e: R`$0$` }, "b",
    R`O determinante principal é $D=\begin{vmatrix}2&3\\1&-1\end{vmatrix}=-2-3=-5$. Substituindo a coluna de $x$ pelos termos independentes: $D_x=\begin{vmatrix}0&3\\5&-1\end{vmatrix}=0-15=-15$. Logo $x=\dfrac{D_x}{D}=\dfrac{-15}{-5}=3$ (e $y=-2$).`),

  q("Espaços Vetoriais", "Dimensão de subespaço gerado em R⁴", "medio",
    R`Determine a dimensão do subespaço de $\mathbb{R}^4$ gerado por $(1,2,0,1)$, $(2,4,0,2)$, $(0,1,1,0)$ e $(1,3,1,1)$.`,
    { a: R`$2$`, b: R`$3$`, c: R`$1$`, d: R`$4$`, e: R`$0$` }, "a",
    R`O segundo vetor é o dobro do primeiro, e o quarto é a soma do primeiro com o terceiro: $(1,2,0,1)+(0,1,1,0)=(1,3,1,1)$. Restam $(1,2,0,1)$ e $(0,1,1,0)$, que não são múltiplos um do outro e portanto são independentes. A dimensão é $2$.`),

  q("Espaços Vetoriais", "Dimensão da interseção de subespaços", "medio",
    R`Sejam $U$ e $W$ dois planos distintos de $\mathbb{R}^3$ que passam pela origem. Determine $\dim(U\cap W)$.`,
    { a: R`$0$`, b: R`$2$`, c: R`$1$`, d: R`$3$`, e: R`$4$` }, "c",
    R`Cada plano tem dimensão $2$. Sendo distintos, sua soma é todo o $\mathbb{R}^3$, de dimensão $3$. Pela fórmula de Grassmann, $\dim(U+W)=\dim U+\dim W-\dim(U\cap W)$, isto é, $3=2+2-\dim(U\cap W)$, de onde $\dim(U\cap W)=1$: os planos se cortam segundo uma reta.`),

  q("Espaços Vetoriais", "Coordenadas em base de polinômios", "dificil",
    R`Determine as coordenadas do polinômio $p(x)=2-3x+5x^2$ em relação à base $B=\left\{1,\ 1+x,\ 1+x+x^2\right\}$ de $P_2$.`,
    {
      a: R`$(2,-3,5)$`, b: R`$(5,8,5)$`, c: R`$(-8,5,5)$`, d: R`$(5,-3,2)$`, e: R`$(5,-8,5)$`,
    }, "e",
    R`Procuramos $a,b,c$ com $a+b(1+x)+c\left(1+x+x^2\right)=p(x)$, ou seja, $(a+b+c)+(b+c)x+cx^2$. Comparando coeficientes: $c=5$; $b+c=-3\Rightarrow b=-8$; $a+b+c=2\Rightarrow a=2+8-5=5$. As coordenadas são $(5,-8,5)$.`),

  q("Espaços Vetoriais", "Independência linear de polinômios", "facil",
    R`Determine a dimensão do subespaço de $P_2$ gerado por $\left\{1+x,\ 1-x,\ x^2\right\}$.`,
    { a: R`$2$`, b: R`$3$`, c: R`$1$`, d: R`$4$`, e: R`$0$` }, "b",
    R`A soma dos dois primeiros dá $2$, logo $1$ pertence ao gerado; a diferença dá $2x$, logo $x$ também. Com $x^2$ na lista, o gerado contém $\left\{1,x,x^2\right\}$, isto é, todo o $P_2$. Como são três vetores gerando um espaço de dimensão $3$, eles são independentes e a dimensão é $3$.`),

  q("Transformações Lineares", "Núcleo de transformação com linhas dependentes", "medio",
    R`Seja $T:\mathbb{R}^3\to\mathbb{R}^2$ dada por $T(x,y,z)=(x+2y+z,\ 2x+4y+2z)$. Determine $\dim\left(\ker T\right)$.`,
    { a: R`$0$`, b: R`$1$`, c: R`$3$`, d: R`$2$`, e: R`$4$` }, "d",
    R`A segunda componente é o dobro da primeira, então a imagem é a reta gerada por $(1,2)$ e $\dim\left(\operatorname{Im}T\right)=1$. Pelo teorema do núcleo e da imagem, $\dim\left(\ker T\right)=3-1=2$.`),

  q("Transformações Lineares", "Imagem de vetor pela linearidade", "facil",
    R`Seja $T:\mathbb{R}^2\to\mathbb{R}^3$ linear, com $T(1,0)=(1,2,3)$ e $T(0,1)=(0,-1,4)$. Calcule $T(2,-1)$.`,
    { a: R`$(2,5,2)$`, b: R`$(2,3,10)$`, c: R`$(2,5,10)$`, d: R`$(1,5,2)$`, e: R`$(2,-5,2)$` }, "a",
    R`Pela linearidade, $T(2,-1)=2\,T(1,0)-T(0,1)=2(1,2,3)-(0,-1,4)=(2,4,6)-(0,-1,4)=(2,5,2)$.`),

  q("Transformações Lineares", "Composição de transformações", "medio",
    R`Sejam $S(x,y)=(x-y,\ x+y)$ e $T(x,y)=(2x,\ 3y)$. Calcule $(S\circ T)(1,1)$.`,
    { a: R`$(1,5)$`, b: R`$(-1,-5)$`, c: R`$(-1,5)$`, d: R`$(5,-1)$`, e: R`$(0,5)$` }, "c",
    R`Primeiro aplica-se $T$: $T(1,1)=(2,3)$. Depois $S$: $S(2,3)=(2-3,\ 2+3)=(-1,5)$. A ordem importa — $(T\circ S)(1,1)$ daria $(0,6)$.`),

  q("Transformações Lineares", "Transformações planas: reflexão", "facil",
    R`Determine a imagem do ponto $(3,-5)$ pela reflexão em torno da reta $y=x$.`,
    { a: R`$(3,5)$`, b: R`$(5,-3)$`, c: R`$(-3,5)$`, d: R`$(5,3)$`, e: R`$(-5,3)$` }, "e",
    R`A reflexão em torno de $y=x$ tem matriz $\begin{pmatrix}0&1\\1&0\end{pmatrix}$, que simplesmente troca as coordenadas: $(a,b)\mapsto(b,a)$. Logo $(3,-5)\mapsto(-5,3)$.`),

  q("Operadores Lineares", "Autovalores de matriz triangular", "facil",
    R`Determine o produto dos autovalores de $A=\begin{pmatrix}2&0&0\\1&3&0\\4&5&-1\end{pmatrix}$.`,
    { a: R`$6$`, b: R`$-6$`, c: R`$4$`, d: R`$-4$`, e: R`$-1$` }, "b",
    R`Em uma matriz triangular, os autovalores são os elementos da diagonal: $2$, $3$ e $-1$. O produto é $2\cdot 3\cdot(-1)=-6$, que coincide com $\det A$ — como deve ser, já que o determinante é sempre o produto dos autovalores.`),

  q("Operadores Lineares", "Traço de potência via autovalores", "medio",
    R`Seja $A=\begin{pmatrix}4&-2\\1&1\end{pmatrix}$. Calcule o traço de $A^2$.`,
    { a: R`$25$`, b: R`$5$`, c: R`$6$`, d: R`$13$`, e: R`$36$` }, "d",
    R`O polinômio característico é $\lambda^2-5\lambda+6$, com raízes $\lambda=2$ e $\lambda=3$. Os autovalores de $A^2$ são os quadrados, $4$ e $9$, e o traço é a soma dos autovalores: $4+9=13$.`),

  q("Operadores Lineares", "Operador não invertível", "facil",
    R`Seja $T(x,y)=(x+2y,\ 3x+6y)$. Determine $\dim\left(\operatorname{Im}T\right)$.`,
    { a: R`$1$`, b: R`$2$`, c: R`$0$`, d: R`$3$`, e: R`$4$` }, "a",
    R`A matriz de $T$ é $\begin{pmatrix}1&2\\3&6\end{pmatrix}$, cujo determinante é $6-6=0$: $T$ não é invertível. A segunda linha é o triplo da primeira, logo o posto é $1$ e a imagem é a reta gerada por $(1,3)$.`),

  q("Operadores Lineares", "Matrizes semelhantes", "medio",
    R`Uma matriz $A$ satisfaz $A=PBP^{-1}$, com $B=\begin{pmatrix}1&0\\0&4\end{pmatrix}$. Calcule o traço de $A^3$.`,
    { a: R`$5$`, b: R`$17$`, c: R`$65$`, d: R`$64$`, e: R`$9$` }, "c",
    R`Matrizes semelhantes têm os mesmos autovalores, então os de $A$ são $1$ e $4$. Além disso $A^3=PB^3P^{-1}$, de modo que os autovalores de $A^3$ são $1^3=1$ e $4^3=64$. O traço é $1+64=65$.`),

  q("Diagonalização de Matrizes Simétricas", "Gram-Schmidt em R³", "medio",
    R`Aplique o processo de Gram-Schmidt (sem normalizar) a $v_1=(1,1,1)$ e $v_2=(1,1,0)$, nessa ordem. Qual é o segundo vetor obtido?`,
    {
      a: R`$\left(\tfrac13,-\tfrac13,\tfrac23\right)$`,
      b: R`$\left(-\tfrac13,\tfrac13,\tfrac23\right)$`,
      c: R`$\left(\tfrac23,\tfrac23,-\tfrac13\right)$`,
      d: R`$(1,1,0)$`,
      e: R`$\left(\tfrac13,\tfrac13,-\tfrac23\right)$`,
    }, "e",
    R`Com $u_1=v_1=(1,1,1)$, temos $u_2=v_2-\dfrac{v_2\cdot u_1}{u_1\cdot u_1}u_1$. Como $v_2\cdot u_1=2$ e $u_1\cdot u_1=3$: $u_2=(1,1,0)-\dfrac23(1,1,1)=\left(\dfrac13,\dfrac13,-\dfrac23\right)$. Conferindo, $u_1\cdot u_2=\dfrac13+\dfrac13-\dfrac23=0$.`),

  q("Diagonalização de Matrizes Simétricas", "Matriz ortogonal", "facil",
    R`Seja $P=\dfrac{1}{\sqrt2}\begin{pmatrix}1&1\\1&-1\end{pmatrix}$, que é ortogonal. Calcule $\det P$.`,
    { a: R`$1$`, b: R`$-1$`, c: R`$0$`, d: R`$\dfrac{1}{2}$`, e: R`$2$` }, "b",
    R`O fator $\dfrac{1}{\sqrt2}$ multiplica as duas linhas, contribuindo com $\left(\dfrac{1}{\sqrt2}\right)^2=\dfrac12$. O determinante da matriz interna é $1(-1)-1(1)=-2$. Logo $\det P=\dfrac12(-2)=-1$. Toda matriz ortogonal tem determinante $\pm 1$; o valor $-1$ indica que $P$ inverte a orientação (é uma reflexão).`),

  q("Diagonalização de Matrizes Simétricas", "Potência de matriz simétrica", "medio",
    R`Seja $A=\begin{pmatrix}2&-1\\-1&2\end{pmatrix}$. Calcule o traço de $A^5$.`,
    { a: R`$244$`, b: R`$32$`, c: R`$4$`, d: R`$16$`, e: R`$276$` }, "a",
    R`O polinômio característico é $\lambda^2-4\lambda+3$, com raízes $\lambda=1$ e $\lambda=3$. Como $A$ é simétrica, é ortogonalmente diagonalizável, e os autovalores de $A^5$ são $1^5=1$ e $3^5=243$. O traço é $1+243=244$.`),

  q("Diagonalização de Matrizes Simétricas", "Forma quadrática degenerada", "dificil",
    R`Considere a forma quadrática $q(x,y,z)=x^2+y^2+z^2+2xy$. Determine o menor autovalor de sua matriz simétrica associada.`,
    { a: R`$1$`, b: R`$2$`, c: R`$-1$`, d: R`$0$`, e: R`$3$` }, "d",
    R`A matriz associada é $A=\begin{pmatrix}1&1&0\\1&1&0\\0&0&1\end{pmatrix}$. Ela é diagonal por blocos: o bloco $\begin{pmatrix}1&1\\1&1\end{pmatrix}$ tem traço $2$ e determinante $0$, logo autovalores $0$ e $2$; o bloco restante fornece $1$. O menor autovalor é $0$, o que mostra que $q$ é apenas semidefinida positiva — anula-se, por exemplo, em $(1,-1,0)$.`),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "algebra_linear_lote3.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
