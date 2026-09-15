// Lote 7 de Fundamentos de Cálculo e Geometria — 36 questões:
// 18 de VETORES E RETAS NO PLANO + 18 de VETORES NO ESPAÇO E GEOMETRIA SÓLIDA.
//
// Estilo Boulos & Camargo. Como os dois tópicos já tinham ~30 questões cada, o
// corte aqui também foi angular: mediana e circuncentro, feixe de retas,
// tangente por ponto externo, condição de tangência reta-circunferência,
// circunferência de Apolônio, decomposição em base não canônica, rotação de
// vetor, pé da perpendicular; no espaço, plano perpendicular a dois planos,
// simétrico em relação a um plano, furo de reta em plano, altura de tetraedro
// por volume/área, planificação de cone, tronco, calota, esfera por quatro
// pontos, diedro do tetraedro regular e as diagonais reversas do cubo.
//
// As checagens de sólido de revolução (cone, tronco, calota) são feitas
// INTEGRANDO o sólido, e não repetindo a fórmula usada na resolução — se a
// fórmula tiver sido aplicada errado, os dois caminhos discordam.
// Rode: node listas_questoes/gerado/scripts/fcg_lote7.mjs
import {
  R,
  q,
  finalizar,
  bissecao,
  simpson,
  V,
  distPontoReta,
  distPontoPlano,
  distRetasReversas,
  projRetaPonto,
  areaTriangulo,
  volumeTetraedro,
} from "./fcg_kit.mjs";

const PLA = "Vetores e Retas no Plano";
const ESP = "Vetores no Espaço e Geometria Sólida";

/** Resolve o sistema linear 3x3 M·x = b por eliminação de Gauss com pivoteamento. */
function resolver3(M, b) {
  const A = M.map((linha, i) => [...linha, b[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let i = c + 1; i < 3; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    [A[c], A[p]] = [A[p], A[c]];
    for (let i = 0; i < 3; i++) {
      if (i === c) continue;
      const f = A[i][c] / A[c][c];
      for (let j = c; j <= 3; j++) A[i][j] -= f * A[c][j];
    }
  }
  return [A[0][3] / A[0][0], A[1][3] / A[1][1], A[2][3] / A[2][2]];
}

/** Centro da esfera/circunferência que passa por pontos dados (mediatrizes). */
function centroEquidistante(pontos) {
  const [P0, ...resto] = pontos;
  const M = [];
  const b = [];
  for (const P of resto) {
    M.push(P.map((c, i) => 2 * (c - P0[i])));
    b.push(V.interno(P, P) - V.interno(P0, P0));
  }
  if (P0.length === 2) {
    // completa para 3x3 com uma equação trivial na terceira coordenada
    M.forEach((linha) => linha.push(0));
    M.push([0, 0, 1]);
    b.push(0);
    return resolver3(M, b).slice(0, 2);
  }
  return resolver3(M, b);
}

// ===========================================================================
// VETORES E RETAS NO PLANO
// ===========================================================================
q(PLA, "Comprimento de mediana", "medio",
  R`Um triângulo tem vértices $A(1,2)$, $B(7,4)$ e $C(3,8)$. Determine o comprimento da mediana relativa ao lado $\overline{BC}$.`,
  R`$4\sqrt{2}$`,
  [R`$2\sqrt{2}$`, R`$\sqrt{34}$`, R`$5\sqrt{2}$`, R`$4\sqrt{3}$`],
  R`A mediana relativa a $\overline{BC}$ liga $A$ ao ponto médio $M$ desse lado. O ponto médio é a média das coordenadas: $M=\left(\tfrac{7+3}{2},\tfrac{4+8}{2}\right)=(5,6)$. Então $\overline{AM}=\sqrt{(5-1)^{2}+(6-2)^{2}}=\sqrt{32}=4\sqrt{2}$.`,
  4 * Math.SQRT2,
  () => {
    const A = [1, 2];
    const M = [(7 + 3) / 2, (4 + 8) / 2];
    return V.norma(V.sub(M, A));
  });

q(PLA, "Circuncentro de um triângulo", "dificil",
  R`Determine a soma das coordenadas do circuncentro do triângulo de vértices $A(1,1)$, $B(7,3)$ e $C(3,7)$.`,
  R`$7$`,
  [R`$6$`, R`$8$`, R`$\dfrac{15}{2}$`, R`$\dfrac{13}{2}$`],
  R`O circuncentro é o ponto equidistante dos três vértices, isto é, a interseção das mediatrizes. De $\overline{PA}=\overline{PB}$ vem $(x-1)^{2}+(y-1)^{2}=(x-7)^{2}+(y-3)^{2}$, que simplifica para $3x+y=14$. De $\overline{PA}=\overline{PC}$ vem $(x-1)^{2}+(y-1)^{2}=(x-3)^{2}+(y-7)^{2}$, isto é $x+3y=14$. Somando e subtraindo as duas, $x=y=\tfrac{7}{2}$, e a soma das coordenadas é $7$.`,
  7,
  () => {
    const c = centroEquidistante([[1, 1], [7, 3], [3, 7]]);
    return c[0] + c[1];
  });

q(PLA, "Ponto da mediatriz de um segmento", "medio",
  R`Determine $k$ para que o ponto $(k,3)$ pertença à mediatriz do segmento de extremos $A(-1,2)$ e $B(5,6)$.`,
  R`$\dfrac{8}{3}$`,
  [R`$\dfrac{3}{8}$`, R`$\dfrac{5}{3}$`, R`$\dfrac{11}{3}$`, R`$\dfrac{4}{3}$`],
  R`A mediatriz é o conjunto dos pontos equidistantes de $A$ e $B$; imponha isso diretamente, sem achar a equação da reta. De $(k+1)^{2}+(3-2)^{2}=(k-5)^{2}+(3-6)^{2}$ vem $k^{2}+2k+1+1=k^{2}-10k+25+9$, isto é $12k=32$ e $k=\tfrac{8}{3}$.`,
  8 / 3,
  () => bissecao((k) => V.norma(V.sub([k, 3], [-1, 2])) - V.norma(V.sub([k, 3], [5, 6])), -20, 20));

q(PLA, "Reta pelo ponto de encontro de duas retas", "dificil",
  R`Determine o coeficiente angular da reta que passa pelo ponto de interseção de $r:2x-y-1=0$ e $s:x+3y-11=0$ e pelo ponto $P(5,1)$.`,
  R`$-\dfrac{2}{3}$`,
  [R`$\dfrac{2}{3}$`, R`$-\dfrac{3}{2}$`, R`$-\dfrac{1}{3}$`, R`$\dfrac{3}{2}$`],
  R`Ache primeiro a interseção: de $r$ vem $y=2x-1$; substituindo em $s$, $x+3(2x-1)-11=0$, isto é $7x=14$ e $x=2$, com $y=3$. O ponto é $Q(2,3)$. O coeficiente angular da reta $QP$ é $\dfrac{1-3}{5-2}=-\dfrac{2}{3}$.`,
  -2 / 3,
  () => {
    const x = bissecao((t) => t + 3 * (2 * t - 1) - 11, -20, 20);
    const y = 2 * x - 1;
    return (1 - y) / (5 - x);
  });

q(PLA, "Área do triângulo formado com os eixos", "medio",
  R`A reta $3x+4y-24=0$ determina, com os eixos coordenados, um triângulo. Determine sua área.`,
  R`$24$`,
  [R`$12$`, R`$48$`, R`$18$`, R`$36$`],
  R`Ache os interceptos. Com $y=0$: $3x=24$, logo $x=8$. Com $x=0$: $4y=24$, logo $y=6$. O triângulo é retângulo, com catetos sobre os eixos medindo $8$ e $6$, então a área é $\tfrac{8\cdot6}{2}=24$.`,
  24,
  () => areaTriangulo([0, 0], [8, 0], [0, 6]));

q(PLA, "Comprimento da tangente por ponto externo", "dificil",
  R`Determine o comprimento do segmento tangente traçado de $P(7,4)$ à circunferência $x^{2}+y^{2}-4x-2y-20=0$.`,
  R`$3$`,
  [R`$5$`, R`$\sqrt{34}$`, R`$4$`, R`$\sqrt{59}$`],
  R`Complete os quadrados: $(x-2)^{2}+(y-1)^{2}=25$, centro $C(2,1)$ e raio $5$. O raio traçado até o ponto de tangência é perpendicular à tangente, então $C$, $P$ e o ponto de tangência formam um triângulo retângulo. Como $\overline{CP}^{2}=(7-2)^{2}+(4-1)^{2}=34$, o cateto tangente vale $\sqrt{34-25}=3$. (O valor $34>25$ confirma que $P$ é exterior.)`,
  3,
  () => {
    const C = [2, 1];
    const raio = Math.sqrt(20 + 4 + 1);
    return Math.sqrt(V.interno(V.sub([7, 4], C), V.sub([7, 4], C)) - raio * raio);
  });

q(PLA, "Condição de tangência entre reta e circunferência", "dificil",
  R`Determine o maior valor de $c$ para o qual a reta $y=2x+c$ é tangente à circunferência $x^{2}+y^{2}=5$.`,
  R`$5$`,
  [R`$\sqrt{5}$`, R`$10$`, R`$25$`, R`$\dfrac{5}{2}$`],
  R`Tangência significa distância do centro à reta igual ao raio. Escreva a reta como $2x-y+c=0$; a distância da origem a ela é $\dfrac{\left|c\right|}{\sqrt{2^{2}+(-1)^{2}}}=\dfrac{\left|c\right|}{\sqrt{5}}$. Igualando ao raio $\sqrt{5}$: $\left|c\right|=5$, isto é $c=5$ ou $c=-5$ (as duas tangentes paralelas, uma de cada lado). O maior é $5$.`,
  5,
  () => {
    let melhor = -Infinity;
    for (const s of [1, -1]) {
      const c = s * bissecao((t) => distPontoReta([0, 0], [0, t], [1, 2]) - Math.sqrt(5), 0.1, 50);
      melhor = Math.max(melhor, c);
    }
    return melhor;
  },
  { tol: 1e-6 });

q(PLA, "Tangência externa entre circunferências", "medio",
  R`Duas circunferências têm centros $(0,0)$ e $(6,8)$ e raios $3$ e $r$. Determine $r$ para que elas sejam tangentes exteriormente.`,
  R`$7$`,
  [R`$13$`, R`$10$`, R`$5$`, R`$8$`],
  R`Na tangência exterior os discos se tocam num único ponto e a distância entre os centros é a SOMA dos raios. Aqui $d=\sqrt{6^{2}+8^{2}}=10$, então $3+r=10$ e $r=7$. (Se fossem tangentes interiormente valeria $\left|r-3\right|=10$, o que daria $r=13$.)`,
  7,
  () => V.norma([6, 8]) - 3);

q(PLA, "Decomposição em base não canônica", "dificil",
  R`Sejam $\vec{u}=(1,2)$ e $\vec{v}=(2,-1)$. Escrevendo $\vec{w}=(4,3)$ como $a\vec{u}+b\vec{v}$, determine $a+b$.`,
  R`$3$`,
  [R`$2$`, R`$4$`, R`$1$`, R`$5$`],
  R`A igualdade $a(1,2)+b(2,-1)=(4,3)$ é o sistema $a+2b=4$ e $2a-b=3$. Da segunda, $b=2a-3$; substituindo na primeira, $a+4a-6=4$, isto é $5a=10$ e $a=2$, com $b=1$. Logo $a+b=3$. (Como $\vec{u}$ e $\vec{v}$ não são paralelos, formam base do plano e a decomposição é única — aliás, aqui eles são ortogonais.)`,
  3,
  () => {
    const a = bissecao((t) => t + 2 * (2 * t - 3) - 4, -20, 20);
    return a + (2 * a - 3);
  });

q(PLA, "Norma de uma combinação com ângulo dado", "dificil",
  R`Os vetores $\vec{u}$ e $\vec{v}$ satisfazem $\left|\vec{u}\right|=3$, $\left|\vec{v}\right|=4$ e formam entre si um ângulo de $60^{\circ}$. Determine $\left|2\vec{u}-3\vec{v}\right|$.`,
  R`$6\sqrt{3}$`,
  [R`$6\sqrt{2}$`, R`$2\sqrt{21}$`, R`$12$`, R`$10$`],
  R`Use a norma ao quadrado e a distributividade do produto escalar: $\left|2\vec{u}-3\vec{v}\right|^{2}=4\left|\vec{u}\right|^{2}-12\,\vec{u}\cdot\vec{v}+9\left|\vec{v}\right|^{2}$. Como $\vec{u}\cdot\vec{v}=3\cdot4\cdot\cos60^{\circ}=6$, isso dá $4\cdot9-12\cdot6+9\cdot16=36-72+144=108$. Logo a norma é $\sqrt{108}=6\sqrt{3}$.`,
  6 * Math.sqrt(3),
  () => {
    const u = [3, 0];
    const v = [4 * Math.cos(Math.PI / 3), 4 * Math.sin(Math.PI / 3)];
    return V.norma(V.sub(V.esc(2, u), V.esc(3, v)));
  });

q(PLA, "Ponto que divide um segmento numa razão dada", "medio",
  R`O ponto $P$ divide o segmento $\overline{AB}$, com $A(2,-1)$ e $B(10,7)$, na razão $\overline{AP}:\overline{PB}=3:1$. Determine a soma das coordenadas de $P$.`,
  R`$13$`,
  [R`$11$`, R`$9$`, R`$15$`, R`$7$`],
  R`Razão $3:1$ significa que $P$ está a três quartos do caminho de $A$ para $B$: $\vec{AP}=\tfrac{3}{4}\vec{AB}$. Como $\vec{AB}=(8,8)$, tem-se $P=A+\tfrac{3}{4}(8,8)=(2+6,-1+6)=(8,5)$, cuja soma de coordenadas é $13$. O erro comum é usar $\tfrac{3}{3+1}$ contado a partir de $B$, o que daria o ponto $(4,1)$.`,
  13,
  () => {
    const P = V.soma([2, -1], V.esc(3 / 4, V.sub([10, 7], [2, -1])));
    return P[0] + P[1];
  });

q(PLA, "Rotação de um vetor em torno da origem", "dificil",
  R`O vetor $\vec{u}=(3,4)$ é girado $90^{\circ}$ no sentido anti-horário em torno da origem, resultando em $\vec{v}$. Determine a soma das coordenadas de $\vec{v}$.`,
  R`$-1$`,
  [R`$1$`, R`$7$`, R`$-7$`, R`$5$`],
  R`A rotação de $90^{\circ}$ no sentido anti-horário leva $(x,y)$ em $(-y,x)$ — basta ver o que acontece com os vetores da base: $(1,0)\mapsto(0,1)$ e $(0,1)\mapsto(-1,0)$. Então $\vec{v}=(-4,3)$, de soma $-1$. Confira a ortogonalidade: $(3,4)\cdot(-4,3)=-12+12=0$, e as normas continuam iguais a $5$.`,
  -1,
  () => {
    const u = [3, 4];
    const a = Math.PI / 2;
    const v = [u[0] * Math.cos(a) - u[1] * Math.sin(a), u[0] * Math.sin(a) + u[1] * Math.cos(a)];
    return v[0] + v[1];
  },
  { tol: 1e-9 });

q(PLA, "Pé da perpendicular de um ponto a uma reta", "dificil",
  R`Determine a soma das coordenadas da projeção ortogonal do ponto $P(4,7)$ sobre a reta $r:x-2y+3=0$.`,
  R`$\dfrac{48}{5}$`,
  [R`$\dfrac{38}{5}$`, R`$\dfrac{53}{5}$`, R`$\dfrac{24}{5}$`, R`$\dfrac{42}{5}$`],
  R`Tome um ponto e um vetor diretor de $r$: com $y=0$ vem $x=-3$, logo $A(-3,0)$, e o diretor é $\vec{d}=(2,1)$ (coeficientes trocados a partir do normal $(1,-2)$). Projete $\vec{AP}=(7,7)$ sobre $\vec{d}$: $t=\dfrac{\vec{AP}\cdot\vec{d}}{\left|\vec{d}\right|^{2}}=\dfrac{14+7}{5}=\dfrac{21}{5}$. O pé é $A+t\vec{d}=\left(-3+\tfrac{42}{5},\tfrac{21}{5}\right)=\left(\tfrac{27}{5},\tfrac{21}{5}\right)$, de soma $\tfrac{48}{5}$.`,
  48 / 5,
  () => {
    const F = projRetaPonto([4, 7], [-3, 0], [2, 1]);
    return F[0] + F[1];
  });

q(PLA, "Circunferência de Apolônio", "dificil",
  R`Determine o raio da circunferência formada pelos pontos $P$ do plano tais que $\dfrac{\overline{PA}}{\overline{PB}}=2$, com $A(0,0)$ e $B(3,0)$.`,
  R`$2$`,
  [R`$3$`, R`$4$`, R`$\sqrt{3}$`, R`$6$`],
  R`Escreva a condição como $\overline{PA}^{2}=4\,\overline{PB}^{2}$, evitando o radical: $x^{2}+y^{2}=4\left[(x-3)^{2}+y^{2}\right]$. Expandindo, $x^{2}+y^{2}=4x^{2}-24x+36+4y^{2}$, isto é $3x^{2}+3y^{2}-24x+36=0$, ou $x^{2}+y^{2}-8x+12=0$. Completando o quadrado, $(x-4)^{2}+y^{2}=4$: uma circunferência de centro $(4,0)$ e raio $2$.`,
  2,
  () => {
    // Recupera o raio direto do lugar geométrico: acha dois pontos do eixo x
    // que satisfazem a condição e toma metade da distância entre eles.
    const g = (x) => V.norma(V.sub([x, 0], [0, 0])) - 2 * V.norma(V.sub([x, 0], [3, 0]));
    const p1 = bissecao(g, 1, 3);
    const p2 = bissecao(g, 4, 20);
    return Math.abs(p2 - p1) / 2;
  });

q(PLA, "Reta paralela a uma distância dada", "medio",
  R`A reta $s$, escrita na forma $3x-4y+c=0$, é paralela a $r:3x-4y+2=0$ e dista $3$ dela. Determine a soma dos valores possíveis de $c$.`,
  R`$4$`,
  [R`$30$`, R`$-30$`, R`$2$`, R`$6$`],
  R`Como as duas retas têm o mesmo vetor normal, a distância entre elas é $\dfrac{\left|c-2\right|}{\sqrt{3^{2}+4^{2}}}=\dfrac{\left|c-2\right|}{5}$. Igualando a $3$: $\left|c-2\right|=15$, isto é $c=17$ ou $c=-13$ — uma paralela de cada lado de $r$. A soma é $17-13=4$, que é também $2\cdot2$, pois os dois valores são simétricos em relação a $c=2$.`,
  4,
  () => {
    const d = (c) => Math.abs(c - 2) / 5;
    const c1 = bissecao((c) => d(c) - 3, 2, 100);
    const c2 = bissecao((c) => d(c) - 3, 2, -100);
    return c1 + c2;
  },
  { tol: 1e-6 });

q(PLA, "Condição de colinearidade com parâmetro", "medio",
  R`Determine $m$ para que os pontos $A(1,3)$, $B(m,m+1)$ e $C(4,9)$ sejam colineares.`,
  R`$0$`,
  [R`$1$`, R`$2$`, R`$-1$`, R`$3$`],
  R`Três pontos são colineares quando os vetores $\vec{AB}$ e $\vec{AC}$ são paralelos, isto é, quando o determinante $\begin{vmatrix}m-1 & m-2\\ 3 & 6\end{vmatrix}$ é nulo: $6(m-1)-3(m-2)=0$, ou $3m=0$, logo $m=0$. Verificação: a reta $AC$ tem coeficiente angular $\tfrac{9-3}{4-1}=2$ e equação $y=2x+1$; o ponto $(0,1)$ realmente pertence a ela.`,
  0,
  () => bissecao((m) => 6 * (m - 1) - 3 * (m - 2), -10, 10),
  { tol: 1e-6, tolLatex: 1e-6 });

q(PLA, "Circunferência tangente ao eixo por dois pontos", "dificil",
  R`Uma circunferência é tangente ao eixo $x$ e passa pelos pontos $(0,4)$ e $(6,4)$. Determine seu raio.`,
  R`$\dfrac{25}{8}$`,
  [R`$\dfrac{25}{4}$`, R`$\dfrac{9}{8}$`, R`$\dfrac{16}{5}$`, R`$\dfrac{25}{16}$`],
  R`Os dois pontos dados têm a mesma ordenada, então o centro está na mediatriz vertical entre eles: $x=3$. Ser tangente ao eixo $x$ (e passar por pontos acima dele) significa que a ordenada do centro é o próprio raio: $C(3,k)$ com raio $k$. Impondo que $(0,4)$ esteja na circunferência: $9+(k-4)^{2}=k^{2}$, isto é $9+k^{2}-8k+16=k^{2}$, ou $8k=25$ e $k=\tfrac{25}{8}$.`,
  25 / 8,
  () => bissecao((k) => V.norma(V.sub([0, 4], [3, k])) - k, 0.5, 50));

q(PLA, "Simétrico da origem em relação à interseção de retas", "dificil",
  R`As retas $r:2x+y-4=0$ e $s:x-2y+3=0$ cortam-se num ponto $P$. Determine a soma das coordenadas do simétrico da origem em relação a $P$.`,
  R`$6$`,
  [R`$3$`, R`$12$`, R`$4$`, R`$9$`],
  R`Resolva o sistema: de $s$ vem $x=2y-3$, e substituindo em $r$, $2(2y-3)+y=4$, isto é $5y=10$, $y=2$ e $x=1$. Logo $P(1,2)$ — e note que $r$ e $s$ são perpendiculares, pois $2\cdot1+1\cdot(-2)=0$. O simétrico de $O$ em relação a $P$ é o ponto $O'$ com $P$ como ponto médio de $\overline{OO'}$, isto é $O'=2P=(2,4)$. A soma é $6$.`,
  6,
  () => {
    const y = bissecao((t) => 2 * (2 * t - 3) + t - 4, -20, 20);
    const P = [2 * y - 3, y];
    const Q = V.esc(2, P);
    return Q[0] + Q[1];
  });

// ===========================================================================
// VETORES NO ESPAÇO E GEOMETRIA SÓLIDA
// ===========================================================================
q(ESP, "Plano perpendicular a dois planos dados", "dificil",
  R`O plano $\pi$ passa por $P(1,2,3)$ e é perpendicular aos planos $x+y-z=0$ e $2x-y+3z=1$. Determine a distância da origem a $\pi$.`,
  R`$\dfrac{17}{\sqrt{38}}$`,
  [R`$\dfrac{17}{\sqrt{14}}$`, R`$\dfrac{17}{38}$`, R`$\dfrac{11}{\sqrt{38}}$`, R`$\dfrac{17}{\sqrt{29}}$`],
  R`Ser perpendicular aos dois planos significa que o normal de $\pi$ é perpendicular a ambos os normais $\vec{n}_{1}=(1,1,-1)$ e $\vec{n}_{2}=(2,-1,3)$ — logo é o produto vetorial deles: $\vec{n}=\vec{n}_{1}\times\vec{n}_{2}=(2,-5,-3)$. Com o ponto $P$: $2(x-1)-5(y-2)-3(z-3)=0$, isto é $2x-5y-3z+17=0$. A distância da origem é $\dfrac{\left|17\right|}{\sqrt{4+25+9}}=\dfrac{17}{\sqrt{38}}$.`,
  17 / Math.sqrt(38),
  () => {
    const n = V.cruz([1, 1, -1], [2, -1, 3]);
    return distPontoPlano([0, 0, 0], n, V.interno(n, [1, 2, 3]));
  });

q(ESP, "Distância entre planos paralelos", "medio",
  R`Determine a distância entre os planos $2x-y+2z=5$ e $4x-2y+4z=1$.`,
  R`$\dfrac{3}{2}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{9}{2}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{5}{6}$`],
  R`Antes de subtrair os termos independentes é obrigatório deixar os dois planos com o MESMO normal: dividindo o segundo por $2$, ele vira $2x-y+2z=\tfrac{1}{2}$. Agora a distância é $\dfrac{\left|5-\tfrac{1}{2}\right|}{\sqrt{4+1+4}}=\dfrac{9/2}{3}=\dfrac{3}{2}$. Quem esquece de normalizar usa $\left|5-1\right|$ e erra.`,
  1.5,
  () => {
    const n = [2, -1, 2];
    const P = [0.25, 0, 0]; // ponto do plano 4x - 2y + 4z = 1
    return distPontoPlano(P, n, 5);
  });

q(ESP, "Ângulo entre duas retas no espaço", "medio",
  R`Determine o cosseno do ângulo agudo entre duas retas de vetores diretores $\vec{u}=(1,2,2)$ e $\vec{v}=(2,-1,2)$.`,
  R`$\dfrac{4}{9}$`,
  [R`$\dfrac{2}{9}$`, R`$\dfrac{4}{3}$`, R`$\dfrac{5}{9}$`, R`$\dfrac{8}{9}$`],
  R`O ângulo entre RETAS é sempre o agudo, então usa-se o módulo do produto escalar: $\cos\theta=\dfrac{\left|\vec{u}\cdot\vec{v}\right|}{\left|\vec{u}\right|\left|\vec{v}\right|}$. Aqui $\vec{u}\cdot\vec{v}=2-2+4=4$ e ambas as normas valem $3$, pois $1+4+4=9$ e $4+1+4=9$. Logo $\cos\theta=\tfrac{4}{9}$.`,
  4 / 9,
  () => Math.abs(V.interno([1, 2, 2], [2, -1, 2])) / (V.norma([1, 2, 2]) * V.norma([2, -1, 2])));

q(ESP, "Simétrico de um ponto em relação a um plano", "dificil",
  R`Determine a soma das coordenadas do simétrico do ponto $P(2,1,-1)$ em relação ao plano $x+2y-z=4$.`,
  R`$\dfrac{4}{3}$`,
  [R`$\dfrac{2}{3}$`, R`$\dfrac{8}{3}$`, R`$\dfrac{5}{3}$`, R`$\dfrac{7}{3}$`],
  R`Caminhe a partir de $P$ na direção do normal $\vec{n}=(1,2,-1)$: o simétrico é $P'=P-2\dfrac{\vec{n}\cdot P-4}{\left|\vec{n}\right|^{2}}\vec{n}$. Como $\vec{n}\cdot P=2+2+1=5$ e $\left|\vec{n}\right|^{2}=6$, o fator vale $2\cdot\tfrac{5-4}{6}=\tfrac{1}{3}$, e $P'=(2,1,-1)-\tfrac{1}{3}(1,2,-1)=\left(\tfrac{5}{3},\tfrac{1}{3},-\tfrac{2}{3}\right)$. A soma é $\tfrac{5+1-2}{3}=\tfrac{4}{3}$.`,
  4 / 3,
  () => {
    const n = [1, 2, -1];
    const P = [2, 1, -1];
    const t = (4 - V.interno(n, P)) / V.interno(n, n);
    const Q = V.soma(P, V.esc(2 * t, n)); // anda o dobro até o outro lado
    if (Math.abs(distPontoPlano(P, n, 4) - distPontoPlano(Q, n, 4)) > 1e-9) return NaN;
    return Q[0] + Q[1] + Q[2];
  });

q(ESP, "Interseção de reta com plano", "dificil",
  R`Determine a soma das coordenadas do ponto em que a reta $(x,y,z)=(1,0,2)+t(2,-1,1)$ intersecta o plano $3x+y-2z=5$.`,
  R`$7$`,
  [R`$5$`, R`$9$`, R`$3$`, R`$11$`],
  R`Substitua as paramétricas na equação do plano e resolva para $t$: $3(1+2t)+(-t)-2(2+t)=5$, isto é $3+6t-t-4-2t=5$, ou $3t=6$ e $t=2$. Voltando às paramétricas, o ponto é $(1+4,\,-2,\,2+2)=(5,-2,4)$, cuja soma de coordenadas é $7$. (O produto escalar do diretor com o normal vale $3$, não nulo, o que garante que reta e plano realmente se cortam.)`,
  7,
  () => {
    const A = [1, 0, 2];
    const d = [2, -1, 1];
    const t = bissecao((s) => V.interno([3, 1, -2], V.soma(A, V.esc(s, d))) - 5, -20, 20);
    const P = V.soma(A, V.esc(t, d));
    return P[0] + P[1] + P[2];
  });

q(ESP, "Altura de tetraedro a partir do volume", "dificil",
  R`O tetraedro $ABCD$ tem vértices $A(1,0,0)$, $B(0,2,0)$, $C(0,0,3)$ e $D(2,2,2)$. Determine a altura relativa à face $ABC$.`,
  R`$\dfrac{16}{7}$`,
  [R`$\dfrac{8}{7}$`, R`$\dfrac{16}{21}$`, R`$\dfrac{24}{7}$`, R`$\dfrac{7}{16}$`],
  R`Use $V=\tfrac{1}{3}\cdot\text{área da base}\cdot\text{altura}$ com o volume vindo do produto misto. Com $\vec{AB}=(-1,2,0)$, $\vec{AC}=(-1,0,3)$ e $\vec{AD}=(1,2,2)$, o produto misto vale $16$, logo $V=\tfrac{16}{6}=\tfrac{8}{3}$. A área da base é $\tfrac{1}{2}\left|\vec{AB}\times\vec{AC}\right|$, e como $\vec{AB}\times\vec{AC}=(6,3,2)$ tem norma $7$, a área é $\tfrac{7}{2}$. Assim $h=\dfrac{3V}{\text{área}}=\dfrac{8}{7/2}=\dfrac{16}{7}$.`,
  16 / 7,
  () => {
    const A = [1, 0, 0];
    const B = [0, 2, 0];
    const C = [0, 0, 3];
    const D = [2, 2, 2];
    const n = V.cruz(V.sub(B, A), V.sub(C, A));
    const porPlano = distPontoPlano(D, n, V.interno(n, A));
    const porVolume = (3 * volumeTetraedro(A, B, C, D)) / areaTriangulo(A, B, C);
    if (Math.abs(porPlano - porVolume) > 1e-9) return NaN; // dois caminhos independentes
    return porPlano;
  });

q(ESP, "Esfera circunscrita a um cubo", "medio",
  R`Um cubo de aresta $6$ está inscrito numa esfera. Determine o raio da esfera.`,
  R`$3\sqrt{3}$`,
  [R`$3\sqrt{2}$`, R`$6\sqrt{3}$`, R`$\dfrac{3\sqrt{3}}{2}$`, R`$2\sqrt{3}$`],
  R`Inscrito significa que os oito vértices estão sobre a esfera, então a diagonal do cubo é um diâmetro. A diagonal de um cubo de aresta $a$ vale $a\sqrt{3}$ (Pitágoras duas vezes: a diagonal da face é $a\sqrt{2}$, e a do cubo fecha o triângulo retângulo com a aresta). Com $a=6$, o diâmetro é $6\sqrt{3}$ e o raio, $3\sqrt{3}$.`,
  3 * Math.sqrt(3),
  () => V.norma([6, 6, 6]) / 2);

q(ESP, "Volume do cone a partir da planificação", "dificil",
  R`Um setor circular de raio $10$ e ângulo central $216^{\circ}$ é a planificação da superfície lateral de um cone reto. Determine o volume do cone.`,
  R`$96\pi$`,
  [R`$64\pi$`, R`$120\pi$`, R`$288\pi$`, R`$48\pi$`],
  R`O raio do setor vira a GERATRIZ do cone: $g=10$. E o arco do setor vira a circunferência da base: $\ell=10\cdot\tfrac{216\pi}{180}=12\pi$, e de $2\pi r=12\pi$ vem $r=6$. A altura sai de Pitágoras no triângulo $r$-$h$-$g$: $h=\sqrt{100-36}=8$. Logo $V=\tfrac{1}{3}\pi r^{2}h=\tfrac{1}{3}\pi\cdot36\cdot8=96\pi$.`,
  96 * Math.PI,
  () => {
    const g = 10;
    const r = (g * ((216 * Math.PI) / 180)) / (2 * Math.PI);
    const h = Math.sqrt(g * g - r * r);
    // volume por integração dos discos, não pela fórmula do cone
    return simpson((z) => Math.PI * Math.pow((r * (h - z)) / h, 2), 0, h, 4000);
  },
  { tol: 1e-6 });

q(ESP, "Volume do tronco de cone", "dificil",
  R`Um tronco de cone reto tem raios das bases iguais a $6$ e $3$ e altura $4$. Determine seu volume.`,
  R`$84\pi$`,
  [R`$63\pi$`, R`$108\pi$`, R`$72\pi$`, R`$126\pi$`],
  R`Use $V=\dfrac{\pi h}{3}\left(R^{2}+Rr+r^{2}\right)$, que vale para qualquer tronco de cone. Com $R=6$, $r=3$ e $h=4$: $V=\dfrac{4\pi}{3}\left(36+18+9\right)=\dfrac{4\pi}{3}\cdot63=84\pi$. Alternativa: completar o cone (por semelhança, o cone pequeno tem altura $4$ e o grande, $8$) e subtrair $\tfrac{1}{3}\pi\cdot36\cdot8-\tfrac{1}{3}\pi\cdot9\cdot4=96\pi-12\pi=84\pi$.`,
  84 * Math.PI,
  () => simpson((z) => Math.PI * Math.pow(6 - (3 * z) / 4, 2), 0, 4, 4000),
  { tol: 1e-6 });

q(ESP, "Centro da esfera por quatro pontos", "dificil",
  R`Determine a soma das coordenadas do centro da esfera que passa por $(0,0,0)$, $(4,0,0)$, $(0,6,0)$ e $(0,0,2)$.`,
  R`$6$`,
  [R`$12$`, R`$3$`, R`$4$`, R`$8$`],
  R`O centro é equidistante dos quatro pontos. Comparando com a origem, a condição $\left|C\right|^{2}=\left|C-(4,0,0)\right|^{2}$ dá $0=-8x+16$, isto é $x=2$ — o centro está no plano que corta o segmento ao meio. Do mesmo modo, os outros dois pontos dão $y=3$ e $z=1$. O centro é $(2,3,1)$ e a soma pedida vale $6$. (O raio seria $\sqrt{14}$.)`,
  6,
  () => {
    const c = centroEquidistante([[0, 0, 0], [4, 0, 0], [0, 6, 0], [0, 0, 2]]);
    return c[0] + c[1] + c[2];
  });

q(ESP, "Vetor unitário ortogonal a dois vetores", "medio",
  R`Determine a soma das coordenadas do vetor unitário ortogonal a $\vec{u}=(1,1,0)$ e a $\vec{v}=(0,1,1)$ cuja primeira coordenada é positiva.`,
  R`$\dfrac{\sqrt{3}}{3}$`,
  [R`$\sqrt{3}$`, R`$\dfrac{2\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{1}{3}$`],
  R`O produto vetorial fornece a direção ortogonal aos dois: $\vec{u}\times\vec{v}=(1\cdot1-0\cdot1,\ 0\cdot0-1\cdot1,\ 1\cdot1-1\cdot0)=(1,-1,1)$. Sua norma é $\sqrt{3}$, então o unitário com primeira coordenada positiva é $\tfrac{1}{\sqrt{3}}(1,-1,1)$. A soma das coordenadas é $\dfrac{1-1+1}{\sqrt{3}}=\dfrac{1}{\sqrt{3}}=\dfrac{\sqrt{3}}{3}$.`,
  Math.sqrt(3) / 3,
  () => {
    const w = V.unit(V.cruz([1, 1, 0], [0, 1, 1]));
    const s = w[0] > 0 ? w : V.esc(-1, w);
    return s[0] + s[1] + s[2];
  });

q(ESP, "Parâmetro a partir de uma distância a plano", "dificil",
  R`Determine o maior valor de $k$ para o qual a distância do ponto $P(1,2,k)$ ao plano $2x-y+2z=3$ é igual a $5$.`,
  R`$9$`,
  [R`$-6$`, R`$6$`, R`$12$`, R`$3$`],
  R`A distância é $\dfrac{\left|2\cdot1-2+2k-3\right|}{\sqrt{4+1+4}}=\dfrac{\left|2k-3\right|}{3}$. Igualando a $5$: $\left|2k-3\right|=15$, o que dá $2k-3=15$ ou $2k-3=-15$, isto é $k=9$ ou $k=-6$ — um ponto de cada lado do plano, ambos a cinco unidades dele. O maior é $9$.`,
  9,
  () => bissecao((k) => distPontoPlano([1, 2, k], [2, -1, 2], 3) - 5, 3, 60));

q(ESP, "Ângulo entre a diagonal do cubo e a diagonal da face", "dificil",
  R`Num cubo, determine o cosseno do ângulo entre uma diagonal do cubo e uma diagonal de face que parte do mesmo vértice.`,
  R`$\dfrac{\sqrt{6}}{3}$`,
  [R`$\dfrac{\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{2}}{2}$`, R`$\dfrac{\sqrt{6}}{6}$`, R`$\dfrac{2}{3}$`],
  R`Ponha o cubo de aresta $1$ com um vértice na origem. A diagonal do cubo é $\vec{d}=(1,1,1)$ e a diagonal da face inferior que sai do mesmo vértice é $\vec{f}=(1,1,0)$. Então $\cos\theta=\dfrac{\vec{d}\cdot\vec{f}}{\left|\vec{d}\right|\left|\vec{f}\right|}=\dfrac{2}{\sqrt{3}\cdot\sqrt{2}}=\dfrac{2}{\sqrt{6}}=\dfrac{\sqrt{6}}{3}$. O resultado não depende da aresta, pois escalar os dois vetores não muda o ângulo.`,
  Math.sqrt(6) / 3,
  () => V.interno([1, 1, 1], [1, 1, 0]) / (V.norma([1, 1, 1]) * V.norma([1, 1, 0])));

q(ESP, "Distância entre a diagonal do cubo e uma aresta reversa", "dificil",
  R`Num cubo de aresta $3$, determine a distância entre a diagonal do cubo e uma aresta reversa a ela.`,
  R`$\dfrac{3\sqrt{2}}{2}$`,
  [R`$\dfrac{3\sqrt{3}}{2}$`, R`$3\sqrt{2}$`, R`$\dfrac{3}{2}$`, R`$\dfrac{3\sqrt{2}}{4}$`],
  R`Ponha o cubo com vértices em $(0,0,0)$ e $(3,3,3)$. A diagonal tem diretor $\vec{u}=(1,1,1)$ passando pela origem; uma aresta reversa a ela é a que liga $(3,0,0)$ a $(3,3,0)$, de diretor $\vec{v}=(0,1,0)$. A distância entre reversas é $\dfrac{\left|\vec{AB}\cdot\left(\vec{u}\times\vec{v}\right)\right|}{\left|\vec{u}\times\vec{v}\right|}$, com $\vec{AB}=(3,0,0)$ e $\vec{u}\times\vec{v}=(-1,0,1)$. Isso dá $\dfrac{3}{\sqrt{2}}=\dfrac{3\sqrt{2}}{2}$.`,
  (3 * Math.SQRT2) / 2,
  () => distRetasReversas([0, 0, 0], [1, 1, 1], [3, 0, 0], [0, 1, 0]));

q(ESP, "Raio da esfera inscrita num cone", "medio",
  R`Um cone reto tem raio da base $3$ e altura $4$. Determine o raio da esfera inscrita.`,
  R`$\dfrac{3}{2}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{12}{7}$`, R`$\dfrac{6}{5}$`, R`$\dfrac{5}{3}$`],
  R`Corte o cone por um plano que contém o eixo: a secção é um triângulo isósceles de base $6$ e lados iguais à geratriz $\sqrt{9+16}=5$, e a esfera inscrita vira o círculo inscrito nesse triângulo. O raio do círculo inscrito é $\dfrac{\text{área}}{p}$, com área $\tfrac{6\cdot4}{2}=12$ e semiperímetro $p=\tfrac{5+5+6}{2}=8$, logo $r=\tfrac{12}{8}=\tfrac{3}{2}$.`,
  1.5,
  () => {
    // Condição direta de tangência: a distância do centro (0, r) à geratriz
    // que liga (3,0) a (0,4) tem de valer r.
    const A = [3, 0];
    const d = V.sub([0, 4], A);
    return bissecao((r) => distPontoReta([0, r], A, d) - r, 0.1, 3.9);
  });

q(ESP, "Volume da calota esférica", "dificil",
  R`Uma esfera de raio $5$ é cortada por um plano que dista $3$ do centro. Determine o volume da calota menor.`,
  R`$\dfrac{52\pi}{3}$`,
  [R`$\dfrac{32\pi}{3}$`, R`$\dfrac{104\pi}{3}$`, R`$\dfrac{26\pi}{3}$`, R`$\dfrac{64\pi}{3}$`],
  R`A altura da calota menor é $h=R-d=5-3=2$. Usando $V=\dfrac{\pi h^{2}}{3}\left(3R-h\right)$: $V=\dfrac{\pi\cdot4}{3}\left(15-2\right)=\dfrac{52\pi}{3}$. O mesmo sai integrando os discos de raio $\sqrt{25-z^{2}}$ de $z=3$ a $z=5$: $\pi\left[25z-\tfrac{z^{3}}{3}\right]_{3}^{5}=\dfrac{52\pi}{3}$.`,
  (52 * Math.PI) / 3,
  () => simpson((z) => Math.PI * (25 - z * z), 3, 5, 4000),
  { tol: 1e-6 });

q(ESP, "Área total de cilindro a partir do volume", "medio",
  R`Um cilindro reto tem volume $250\pi$ e altura igual ao dobro do raio da base. Determine sua área total.`,
  R`$150\pi$`,
  [R`$100\pi$`, R`$125\pi$`, R`$175\pi$`, R`$75\pi$`],
  R`De $h=2r$ e $V=\pi r^{2}h$ vem $\pi r^{2}\cdot2r=250\pi$, isto é $r^{3}=125$ e $r=5$, com $h=10$. A área total soma as duas bases e a lateral: $A=2\pi r^{2}+2\pi rh=50\pi+100\pi=150\pi$. (Repare que esse cilindro é o "equilátero": a altura iguala o diâmetro.)`,
  150 * Math.PI,
  () => {
    const r = Math.cbrt(250 / 2);
    const h = 2 * r;
    if (Math.abs(Math.PI * r * r * h - 250 * Math.PI) > 1e-9) return NaN;
    return 2 * Math.PI * r * r + 2 * Math.PI * r * h;
  });

q(ESP, "Ângulo diedro do tetraedro regular", "dificil",
  R`Determine o cosseno do ângulo diedro entre duas faces de um tetraedro regular.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{\sqrt{3}}{3}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{1}{4}$`],
  R`Tome a aresta comum às duas faces e, em cada face, o segmento que vai do ponto médio dessa aresta ao vértice oposto — ambos são perpendiculares à aresta, então o ângulo entre eles é o diedro. Num tetraedro de aresta $a$, cada um desses segmentos é a altura de um triângulo equilátero, de medida $\tfrac{a\sqrt{3}}{2}$, e os vértices opostos distam $a$ entre si. Pela lei dos cossenos, $a^{2}=2\cdot\tfrac{3a^{2}}{4}-2\cdot\tfrac{3a^{2}}{4}\cos\theta$, de onde $\cos\theta=\tfrac{1}{3}$ (cerca de $70{,}5^{\circ}$).`,
  1 / 3,
  () => {
    const A = [1, 1, 1];
    const B = [1, -1, -1];
    const C = [-1, 1, -1];
    const D = [-1, -1, 1];
    const M = V.esc(0.5, V.soma(A, B)); // ponto médio da aresta comum
    const p = V.sub(C, M);
    const r = V.sub(D, M);
    if (Math.abs(V.interno(p, V.sub(B, A))) > 1e-12 || Math.abs(V.interno(r, V.sub(B, A))) > 1e-12) return NaN;
    return V.interno(p, r) / (V.norma(p) * V.norma(r));
  });

finalizar("fcg_lote7.json", 20260918);
