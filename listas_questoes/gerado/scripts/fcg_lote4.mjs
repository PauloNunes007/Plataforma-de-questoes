// Lote 4 de Fundamentos de Cálculo e Geometria — 50 questões de
// EXPONENCIAIS E LOGARITMOS.
//
// Por que este tópico primeiro: "Funções Exponenciais e Logarítmicas" nasceu em
// 2026-09-15 (supabase_ementas_ciclo_basico.sql) ao ser separado de "Funções em
// R", e herdou só 8 questões — o tópico mais vazio de uma matéria que é base de
// todo o ciclo básico. Aqui ele sobe para ~58.
//
// Variedade deliberada (nenhuma questão repete a forma de cobrança da outra):
//   A. manipulação/mudança de base   B. equações exponenciais
//   C. equações logarítmicas         D. inequações exponenciais
//   E. inequações logarítmicas       F. domínio e imagem
//   G. crescimento e decaimento      H. escalas logarítmicas
//   I. sistemas
//
// Estilo Stewart (Pré-cálculo). Conferência acoplada: ver fcg_kit.mjs.
// Rode: node listas_questoes/gerado/scripts/fcg_lote4.mjs
import {
  R,
  q,
  qConjunto,
  finalizar,
  raizes,
  raizesComTangencia,
  bissecao,
  extremo,
  naImagem,
  grade,
  ge,
  gt,
  le,
  lt,
  igual,
} from "./fcg_kit.mjs";

const T = "Funções Exponenciais e Logarítmicas";
const soma = (xs) => xs.reduce((s, x) => s + x, 0);
const produto = (xs) => xs.reduce((s, x) => s * x, 1);

// ===========================================================================
// A. MANIPULAÇÃO E MUDANÇA DE BASE
// ===========================================================================
q(T, "Soma de logaritmos de bases potências", "facil",
  R`Calcule $\log_{4}8+\log_{9}27+\log_{25}5$.`,
  R`$\dfrac{7}{2}$`,
  [R`$\dfrac{5}{2}$`, R`$\dfrac{9}{2}$`, R`$\dfrac{11}{4}$`, R`$\dfrac{13}{4}$`],
  R`Cada parcela é um logaritmo de potência da mesma base: $\log_{4}8=\log_{2^{2}}2^{3}=\tfrac{3}{2}$, $\log_{9}27=\log_{3^{2}}3^{3}=\tfrac{3}{2}$ e $\log_{25}5=\log_{5^{2}}5^{1}=\tfrac{1}{2}$. Somando, $\tfrac{3}{2}+\tfrac{3}{2}+\tfrac{1}{2}=\tfrac{7}{2}$.`,
  3.5,
  () => Math.log(8) / Math.log(4) + Math.log(27) / Math.log(9) + Math.log(5) / Math.log(25));

q(T, "Logaritmo de produto com radicais", "facil",
  R`Calcule $\log_{2}\left(\dfrac{\sqrt[3]{4}\cdot 8}{\sqrt{2}}\right)$.`,
  R`$\dfrac{19}{6}$`,
  [R`$\dfrac{17}{6}$`, R`$\dfrac{23}{6}$`, R`$\dfrac{13}{6}$`, R`$\dfrac{25}{6}$`],
  R`Escreva tudo como potência de $2$: $\sqrt[3]{4}=2^{2/3}$, $8=2^{3}$ e $\sqrt{2}=2^{1/2}$. O argumento vira $2^{2/3+3-1/2}=2^{19/6}$, e o logaritmo na base $2$ devolve o expoente: $\tfrac{19}{6}$.`,
  19 / 6,
  () => Math.log2((Math.cbrt(4) * 8) / Math.SQRT2));

q(T, "Quantidade de algarismos por logaritmo decimal", "facil",
  R`Usando $\log_{10}2=0{,}30103$, determine quantos algarismos tem $2^{100}$ escrito na base decimal.`,
  R`$31$`,
  [R`$30$`, R`$32$`, R`$29$`, R`$33$`],
  R`O número de algarismos de um inteiro $N$ é $\lfloor\log_{10}N\rfloor+1$. Aqui $\log_{10}2^{100}=100\cdot0{,}30103=30{,}103$, cuja parte inteira é $30$. Logo $2^{100}$ tem $30+1=31$ algarismos — repare que o logaritmo entre $30$ e $31$ significa que o número está entre $10^{30}$ e $10^{31}$.`,
  31,
  () => Math.floor(100 * Math.log10(2)) + 1);

q(T, "Produto telescópico de logaritmos", "medio",
  R`Calcule $\log_{2}3\cdot\log_{3}4\cdot\log_{4}5\cdots\log_{31}32$.`,
  R`$5$`,
  [R`$4$`, R`$6$`, R`$15$`, R`$30$`],
  R`Escreva cada fator pela mudança de base para logaritmo natural: $\log_{k}(k+1)=\dfrac{\ln(k+1)}{\ln k}$. No produto de $k=2$ até $k=31$ cada numerador cancela o denominador seguinte, sobrando $\dfrac{\ln 32}{\ln 2}=\log_{2}32=5$.`,
  5,
  () => {
    let p = 1;
    for (let k = 2; k <= 31; k++) p *= Math.log(k + 1) / Math.log(k);
    return p;
  });

q(T, "Mudança de base com logaritmos tabelados", "medio",
  R`Dados $\log_{10}2=0{,}301$ e $\log_{10}3=0{,}477$, calcule $\log_{6}45$ com duas casas decimais.`,
  R`$2{,}12$`,
  [R`$2{,}00$`, R`$2{,}25$`, R`$1{,}95$`, R`$2{,}38$`],
  R`Mude para a base $10$: $\log_{6}45=\dfrac{\log_{10}45}{\log_{10}6}$. No numerador, $45=9\cdot5=3^{2}\cdot\tfrac{10}{2}$, logo $\log_{10}45=2\log_{10}3+1-\log_{10}2=0{,}954+0{,}699=1{,}653$. No denominador, $\log_{10}6=\log_{10}2+\log_{10}3=0{,}778$. A razão dá $2{,}12$.`,
  2.12,
  () => (2 * 0.477 + (1 - 0.301)) / (0.301 + 0.477),
  { tol: 3e-3 });

// ===========================================================================
// B. EQUAÇÕES EXPONENCIAIS
// ===========================================================================
q(T, "Exponencial reduzida a quadrática — produto das raízes", "medio",
  R`Determine o produto das raízes reais de $4^{x+1}-9\cdot2^{x}+2=0$.`,
  R`$-2$`,
  [R`$-1$`, R`$-3$`, R`$2$`, R`$-4$`],
  R`Com $t=2^{x}>0$ tem-se $4^{x+1}=4\cdot(2^{x})^{2}=4t^{2}$, e a equação vira $4t^{2}-9t+2=0$. As raízes são $t=\dfrac{9\pm7}{8}$, ou seja $t=2$ e $t=\tfrac{1}{4}$ — ambas positivas, portanto ambas aceitáveis. Voltando, $2^{x}=2$ dá $x=1$ e $2^{x}=2^{-2}$ dá $x=-2$. O produto pedido é $1\cdot(-2)=-2$.`,
  -2,
  () => produto(raizes((x) => Math.pow(4, x + 1) - 9 * Math.pow(2, x) + 2, -8, 8)));

q(T, "Expoentes polinomiais com bases potências de 3", "medio",
  R`Determine a soma das raízes reais de $9^{x^{2}-x}=27^{x}$.`,
  R`$\dfrac{5}{2}$`,
  [R`$\dfrac{3}{2}$`, R`$\dfrac{7}{2}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{9}{2}$`],
  R`Reduza as duas potências à base $3$: $3^{2(x^{2}-x)}=3^{3x}$. Como a exponencial é injetora, os expoentes coincidem: $2x^{2}-2x=3x$, isto é $2x^{2}-5x=0$, ou $x(2x-5)=0$. As raízes são $x=0$ e $x=\tfrac{5}{2}$, cuja soma é $\tfrac{5}{2}$.`,
  2.5,
  () => soma(raizes((x) => Math.pow(9, x * x - x) - Math.pow(27, x), -2, 4)));

q(T, "Equação homogênea em duas bases", "dificil",
  R`A equação $4^{x}+6^{x}=9^{x}$ tem uma única raiz real. Determine o valor de $\left(\dfrac{3}{2}\right)^{x}$ nessa raiz.`,
  R`$\dfrac{1+\sqrt{5}}{2}$`,
  [R`$\dfrac{1+\sqrt{3}}{2}$`, R`$\dfrac{-1+\sqrt{5}}{2}$`, R`$\dfrac{3+\sqrt{5}}{2}$`, R`$\dfrac{1+\sqrt{5}}{4}$`],
  R`Os três termos são homogêneos de grau $x$: divida tudo por $4^{x}$ e use $\dfrac{6^{x}}{4^{x}}=\left(\tfrac{3}{2}\right)^{x}$ e $\dfrac{9^{x}}{4^{x}}=\left(\tfrac{3}{2}\right)^{2x}$. Chamando $r=\left(\tfrac{3}{2}\right)^{x}>0$, resta $1+r=r^{2}$, isto é $r^{2}-r-1=0$, cujas raízes são $\dfrac{1\pm\sqrt{5}}{2}$. A raiz negativa é descartada porque $r$ é uma potência de base positiva, sobrando $r=\dfrac{1+\sqrt{5}}{2}$.`,
  (1 + Math.sqrt(5)) / 2,
  () => Math.pow(1.5, bissecao((x) => Math.pow(4, x) + Math.pow(6, x) - Math.pow(9, x), 0, 5)));

q(T, "Bases sem potência comum — logaritmo dos dois lados", "medio",
  R`Resolva a equação $2^{x}=3^{x-1}$.`,
  R`$\dfrac{\ln 3}{\ln 3-\ln 2}$`,
  [R`$\dfrac{\ln 2}{\ln 3-\ln 2}$`, R`$\dfrac{\ln 6}{\ln 3-\ln 2}$`, R`$\dfrac{\ln 3}{\ln 2-\ln 3}$`, R`$\dfrac{\ln 3}{\ln 6}$`],
  R`Não há base comum, então aplique logaritmo natural nos dois lados: $x\ln 2=(x-1)\ln 3$. Agrupando os termos em $x$, $x(\ln 3-\ln 2)=\ln 3$, e como $\ln 3>\ln 2$ o coeficiente não é nulo: $x=\dfrac{\ln 3}{\ln 3-\ln 2}$.`,
  Math.log(3) / (Math.log(3) - Math.log(2)),
  () => bissecao((x) => Math.pow(2, x) - Math.pow(3, x - 1), 0, 10));

q(T, "Incógnita na base e no expoente", "dificil",
  R`Determine o produto das raízes reais de $x^{\log_{2}x}=8x^{2}$.`,
  R`$4$`,
  [R`$2$`, R`$8$`, R`$16$`, R`$6$`],
  R`Tome $\log_{2}$ dos dois lados, lembrando que $x>0$. À esquerda, $\log_{2}\left(x^{\log_{2}x}\right)=\left(\log_{2}x\right)^{2}$; à direita, $\log_{2}(8x^{2})=3+2\log_{2}x$. Com $u=\log_{2}x$ isso é $u^{2}-2u-3=0$, ou seja $u=3$ e $u=-1$, de onde $x=8$ e $x=\tfrac{1}{2}$. O produto é $8\cdot\tfrac{1}{2}=4$.`,
  4,
  () => produto(raizes((x) => Math.pow(x, Math.log2(x)) - 8 * x * x, 0.05, 20)));

q(T, "Parâmetro para raiz única em equação exponencial", "dificil",
  R`Determine o valor de $k>0$ para que a equação $5^{2x}-5^{x+1}+k=0$ tenha exatamente uma raiz real.`,
  R`$\dfrac{25}{4}$`,
  [R`$\dfrac{5}{4}$`, R`$\dfrac{25}{2}$`, R`$\dfrac{5}{2}$`, R`$\dfrac{49}{4}$`],
  R`Com $t=5^{x}>0$ a equação vira $t^{2}-5t+k=0$. Cada raiz positiva em $t$ devolve exatamente um $x$, e com $k>0$ o produto das raízes é positivo e a soma vale $5$: ou as duas são positivas, ou são complexas. Portanto "uma única raiz real" exige raiz dupla: $\Delta=25-4k=0$, isto é $k=\tfrac{25}{4}$ — e aí $t=\tfrac{5}{2}>0$, de fato aceitável. Equivalentemente, $k$ é o valor máximo de $5^{x+1}-5^{2x}$.`,
  6.25,
  () => extremo((x) => Math.pow(5, x + 1) - Math.pow(5, 2 * x), -2, 2, "max").y);

q(T, "Equação exponencial com radical", "medio",
  R`Resolva a equação $\sqrt{3^{x}}\cdot9^{x}=\dfrac{1}{81}$.`,
  R`$-\dfrac{8}{5}$`,
  [R`$-\dfrac{5}{8}$`, R`$-\dfrac{8}{3}$`, R`$-\dfrac{4}{5}$`, R`$-\dfrac{16}{5}$`],
  R`Passe tudo para a base $3$: $\sqrt{3^{x}}=3^{x/2}$, $9^{x}=3^{2x}$ e $\tfrac{1}{81}=3^{-4}$. Somando expoentes à esquerda, $3^{\frac{x}{2}+2x}=3^{-4}$, ou seja $\tfrac{5x}{2}=-4$, o que dá $x=-\tfrac{8}{5}$.`,
  -1.6,
  () => bissecao((x) => Math.sqrt(Math.pow(3, x)) * Math.pow(9, x) - 1 / 81, -5, 2));

q(T, "Potência igual a 1 com base variável", "dificil",
  R`Determine a soma de todas as raízes reais de $\left(x^{2}-5x+7\right)^{x-3}=1$.`,
  R`$5$`,
  [R`$3$`, R`$6$`, R`$8$`, R`$2$`],
  R`Uma potência vale $1$ em três situações. (i) Base igual a $1$: $x^{2}-5x+7=1$ dá $x^{2}-5x+6=0$, isto é $x=2$ ou $x=3$. (ii) Expoente nulo com base não nula: $x=3$, e a base vale $1\neq0$ — já contado. (iii) Base $-1$ com expoente par: $x^{2}-5x+8=0$ tem discriminante $-7<0$, não ocorre. Repare ainda que $x^{2}-5x+7$ tem discriminante negativo, logo é sempre positivo e a potência está sempre definida. As raízes são $2$ e $3$, de soma $5$.`,
  5,
  () => soma(raizesComTangencia((x) => Math.pow(x * x - 5 * x + 7, x - 3) - 1, -2, 8)));

q(T, "Equação exponencial simétrica", "medio",
  R`Determine o produto das raízes reais de $2^{x}+2^{-x}=\dfrac{17}{4}$.`,
  R`$-4$`,
  [R`$-2$`, R`$4$`, R`$-8$`, R`$-1$`],
  R`Com $t=2^{x}>0$, $2^{-x}=\tfrac{1}{t}$ e a equação vira $t+\tfrac{1}{t}=\tfrac{17}{4}$, isto é $4t^{2}-17t+4=0$. As raízes são $t=4$ e $t=\tfrac{1}{4}$, de onde $x=2$ e $x=-2$ — a simetria era esperada, já que trocar $x$ por $-x$ não altera a equação. O produto é $-4$.`,
  -4,
  () => produto(raizes((x) => Math.pow(2, x) + Math.pow(2, -x) - 17 / 4, -6, 6)));

// ===========================================================================
// C. EQUAÇÕES LOGARÍTMICAS
// ===========================================================================
q(T, "Soma de logaritmos com raiz estranha", "medio",
  R`Resolva a equação $\log_{3}(x+2)+\log_{3}(x-4)=3$.`,
  R`$7$`,
  [R`$-5$`, R`$5$`, R`$9$`, R`$35$`],
  R`O domínio exige $x+2>0$ e $x-4>0$, ou seja $x>4$ — anote isso antes de operar. Juntando os logaritmos, $\log_{3}\left[(x+2)(x-4)\right]=3$, logo $(x+2)(x-4)=27$, isto é $x^{2}-2x-35=0$, cujas raízes são $x=7$ e $x=-5$. A segunda viola o domínio (o logaritmo de número negativo não existe) e é descartada: resta $x=7$.`,
  7,
  () => bissecao((x) => Math.log(x + 2) / Math.log(3) + Math.log(x - 4) / Math.log(3) - 3, 4.0001, 40));

q(T, "Quadrática no logaritmo", "dificil",
  R`Determine o produto das raízes reais de $\left(\log_{2}x\right)^{2}-\log_{2}x^{3}+2=0$.`,
  R`$8$`,
  [R`$6$`, R`$16$`, R`$4$`, R`$12$`],
  R`Como $x>0$, vale $\log_{2}x^{3}=3\log_{2}x$. Com $u=\log_{2}x$ a equação vira $u^{2}-3u+2=0$, de raízes $u=1$ e $u=2$, o que dá $x=2$ e $x=4$. O produto é $8$ — e repare que ele podia ser obtido direto de Girard: $u_{1}+u_{2}=3$, logo $x_{1}x_{2}=2^{u_{1}+u_{2}}=2^{3}$.`,
  8,
  () => produto(raizes((x) => Math.pow(Math.log2(x), 2) - 3 * Math.log2(x) + 2, 0.5, 20)));

q(T, "Produto de logaritmos de bases diferentes", "dificil",
  R`Determine a soma das raízes reais de $\log_{2}x\cdot\log_{4}x=8$.`,
  R`$\dfrac{257}{16}$`,
  [R`$\dfrac{255}{16}$`, R`$\dfrac{65}{4}$`, R`$\dfrac{17}{16}$`, R`$\dfrac{129}{8}$`],
  R`Leve tudo à base $2$: $\log_{4}x=\dfrac{\log_{2}x}{2}$. Com $u=\log_{2}x$, a equação é $\dfrac{u^{2}}{2}=8$, isto é $u^{2}=16$ e $u=\pm4$. O sinal negativo é legítimo (não é o logaritmo de um negativo, é um logaritmo negativo), então $x=16$ e $x=2^{-4}=\tfrac{1}{16}$. A soma vale $16+\tfrac{1}{16}=\tfrac{257}{16}$.`,
  257 / 16,
  () => soma(raizes((x) => (Math.log2(x) * Math.log(x)) / Math.log(4) - 8, 0.01, 40)));

q(T, "Logaritmos em bases 5 e 25", "medio",
  R`Resolva a equação $\log_{5}(x+3)=\log_{25}(4x+21)$.`,
  R`$-1+\sqrt{13}$`,
  [R`$-1+\sqrt{11}$`, R`$1+\sqrt{13}$`, R`$-1-\sqrt{13}$`, R`$-2+\sqrt{13}$`],
  R`Como $25=5^{2}$, vale $\log_{25}(4x+21)=\tfrac{1}{2}\log_{5}(4x+21)$. Multiplicando por $2$: $2\log_{5}(x+3)=\log_{5}(4x+21)$, ou seja $(x+3)^{2}=4x+21$. Isso dá $x^{2}+2x-12=0$ e $x=-1\pm\sqrt{13}$. O domínio pede $x+3>0$, e como $\sqrt{13}\approx3{,}6$ a raiz $-1-\sqrt{13}$ é descartada; fica $x=-1+\sqrt{13}$.`,
  -1 + Math.sqrt(13),
  () => bissecao((x) => Math.log(x + 3) / Math.log(5) - Math.log(4 * x + 21) / Math.log(25), 0, 10));

q(T, "Domínio que elimina toda a solução", "dificil",
  R`Quantas raízes reais tem a equação $\ln\left(x^{2}\right)=2\ln(x-1)$?`,
  R`$0$`,
  [R`$1$`, R`$2$`, R`$3$`, R`$4$`],
  R`O lado direito só existe para $x>1$; o esquerdo, para $x\neq0$. No domínio comum $x>1$ tem-se $\ln(x^{2})=2\ln x$, e a equação vira $2\ln x=2\ln(x-1)$, isto é $x=x-1$ — impossível. A armadilha é "cancelar" os logaritmos escrevendo $x^{2}=(x-1)^{2}$ e concluir $x=\tfrac{1}{2}$: esse valor não pertence ao domínio, logo a equação não tem raiz real alguma.`,
  0,
  () => raizes((x) => 2 * Math.log(x) - 2 * Math.log(x - 1), 1.000001, 1e4, 200000).length);

q(T, "Logaritmo de soma de potências", "dificil",
  R`Determine a soma das raízes reais de $\log_{2}\left(9^{x-1}+7\right)=2+\log_{2}\left(3^{x-1}+1\right)$.`,
  R`$3$`,
  [R`$2$`, R`$4$`, R`$5$`, R`$1$`],
  R`Escreva $2=\log_{2}4$ e junte os logaritmos do lado direito: $\log_{2}\left(9^{x-1}+7\right)=\log_{2}\left[4\left(3^{x-1}+1\right)\right]$. Pela injetividade, $9^{x-1}+7=4\cdot3^{x-1}+4$. Com $t=3^{x-1}>0$ isso é $t^{2}-4t+3=0$, de raízes $t=1$ e $t=3$, ou seja $x-1=0$ e $x-1=1$. As raízes são $x=1$ e $x=2$, de soma $3$; ambas mantêm positivos os dois argumentos.`,
  3,
  () => soma(raizes((x) => Math.log2(Math.pow(9, x - 1) + 7) - 2 - Math.log2(Math.pow(3, x - 1) + 1), -3, 6)));

q(T, "Igualdade de logaritmos com verificação de domínio", "medio",
  R`Determine a soma das raízes reais de $\log_{5}\left(x^{2}-2x\right)=\log_{5}(3x-4)$.`,
  R`$4$`,
  [R`$5$`, R`$1$`, R`$3$`, R`$9$`],
  R`Pela injetividade do logaritmo, $x^{2}-2x=3x-4$, isto é $x^{2}-5x+4=0$, com $x=1$ e $x=4$. Falta o filtro do domínio: é preciso $x^{2}-2x>0$, ou seja $x<0$ ou $x>2$. O valor $x=1$ não passa (o argumento daria $-1$), enquanto $x=4$ passa nas duas condições. A soma pedida é apenas $4$ — quem soma $1+4=5$ esqueceu de verificar o domínio.`,
  4,
  () => soma(raizes((x) => Math.log(x * x - 2 * x) - Math.log(3 * x - 4), 2.0001, 12)));

q(T, "Sistema com logaritmo e diferença", "medio",
  R`Os reais $x>y>0$ satisfazem $\log_{2}x+\log_{2}y=4$ e $x-y=6$. Determine $x+y$.`,
  R`$10$`,
  [R`$8$`, R`$12$`, R`$14$`, R`$9$`],
  R`A primeira equação diz $\log_{2}(xy)=4$, ou seja $xy=16$. Junto com $x-y=6$, substitua $x=y+6$: $y^{2}+6y-16=0$, de raízes $y=2$ e $y=-8$; só $y=2$ serve, pois o logaritmo exige $y>0$. Então $x=8$ e $x+y=10$. Alternativa elegante: $(x+y)^{2}=(x-y)^{2}+4xy=36+64=100$.`,
  10,
  () => {
    const y = bissecao((t) => t * (t + 6) - 16, 0.01, 20);
    return y + (y + 6);
  });

// ===========================================================================
// D. INEQUAÇÕES EXPONENCIAIS
// ===========================================================================
qConjunto(T, "Inequação exponencial de base menor que 1", "medio",
  R`Resolva, em $\mathbb{R}$, a inequação $\left(\dfrac{1}{3}\right)^{x^{2}-1}\geq\dfrac{1}{27}$.`,
  R`$\left[-2,2\right]$`,
  [R`$\left(-2,2\right)$`, R`$\left(-\infty,-2\right]\cup\left[2,+\infty\right)$`, R`$\left[-\sqrt{3},\sqrt{3}\right]$`, R`$\left[-4,4\right]$`],
  R`Os dois lados são potências de $\tfrac{1}{3}$: à direita, $\tfrac{1}{27}=\left(\tfrac{1}{3}\right)^{3}$. Como a base está entre $0$ e $1$, a função é decrescente e a desigualdade entre potências INVERTE ao passar para os expoentes: $x^{2}-1\leq3$. Daí $x^{2}\leq4$, isto é $-2\leq x\leq2$; os extremos entram porque a desigualdade original não é estrita.`,
  {
    alvo: (x) => ge(Math.pow(1 / 3, x * x - 1), 1 / 27),
    cand: (x) => ge(x, -2) && le(x, 2),
    distCand: [
      (x) => gt(x, -2) && lt(x, 2),
      (x) => le(x, -2) || ge(x, 2),
      (x) => ge(x, -Math.sqrt(3)) && le(x, Math.sqrt(3)),
      (x) => ge(x, -4) && le(x, 4),
    ],
    amostras: grade(-5, 5, 901, [-2, 2, -Math.sqrt(3), Math.sqrt(3), -4, 4]),
  });

qConjunto(T, "Inequação exponencial quadrática", "dificil",
  R`Resolva a inequação $2^{2x}-3\cdot2^{x+1}+8<0$.`,
  R`$\left(1,2\right)$`,
  [R`$\left[1,2\right]$`, R`$\left(-\infty,1\right)\cup\left(2,+\infty\right)$`, R`$\left(0,2\right)$`, R`$\left(1,3\right)$`],
  R`Com $t=2^{x}>0$, note que $2^{2x}=t^{2}$ e $2^{x+1}=2t$, de modo que a inequação vira $t^{2}-6t+8<0$, isto é $(t-2)(t-4)<0$, ou $2<t<4$. Voltando: $2^{1}<2^{x}<2^{2}$ e, como a base $2$ é maior que $1$, a função é crescente e a desigualdade se transmite aos expoentes sem inverter: $1<x<2$.`,
  {
    alvo: (x) => lt(Math.pow(4, x) - 6 * Math.pow(2, x) + 8, 0),
    cand: (x) => gt(x, 1) && lt(x, 2),
    distCand: [
      (x) => ge(x, 1) && le(x, 2),
      (x) => lt(x, 1) || gt(x, 2),
      (x) => gt(x, 0) && lt(x, 2),
      (x) => gt(x, 1) && lt(x, 3),
    ],
    amostras: grade(-3, 5, 901, [1, 2, 0, 3]),
  });

qConjunto(T, "Inequação quociente com exponencial", "dificil",
  R`Resolva a inequação $\dfrac{3^{x}-9}{3^{x}-1}\leq0$.`,
  R`$\left(0,2\right]$`,
  [R`$\left[0,2\right]$`, R`$\left(0,2\right)$`, R`$\left(-\infty,0\right)\cup\left[2,+\infty\right)$`, R`$\left(1,9\right]$`],
  R`Com $t=3^{x}>0$, o quociente $\dfrac{t-9}{t-1}$ é negativo ou nulo exatamente quando $1<t\leq9$: o numerador zera em $t=9$ (entra) e o denominador zera em $t=1$ (sai obrigatoriamente). Traduzindo pela função crescente $t=3^{x}$: $3^{0}<3^{x}\leq3^{2}$, ou seja $0<x\leq2$. O erro clássico é responder em $t$ e escrever $\left(1,9\right]$.`,
  {
    alvo: (x) => {
      const t = Math.pow(3, x);
      if (igual(t, 1)) return false;
      return le((t - 9) / (t - 1), 0);
    },
    cand: (x) => gt(x, 0) && le(x, 2),
    distCand: [
      (x) => ge(x, 0) && le(x, 2),
      (x) => gt(x, 0) && lt(x, 2),
      (x) => lt(x, 0) || ge(x, 2),
      (x) => gt(x, 1) && le(x, 9),
    ],
    amostras: grade(-3, 10, 901, [0, 2, 1, 9]),
  });

qConjunto(T, "Bases inversas em lados opostos", "medio",
  R`Resolva a inequação $\left(\dfrac{2}{5}\right)^{x^{2}}>\left(\dfrac{5}{2}\right)^{3x-10}$.`,
  R`$\left(-5,2\right)$`,
  [R`$\left(-2,5\right)$`, R`$\left[-5,2\right]$`, R`$\left(-\infty,-5\right)\cup\left(2,+\infty\right)$`, R`$\left(-5,10\right)$`],
  R`As bases são inversas: $\left(\tfrac{5}{2}\right)^{3x-10}=\left(\tfrac{2}{5}\right)^{-(3x-10)}$. Com a mesma base $\tfrac{2}{5}$, menor que $1$, a comparação de potências inverte ao descer aos expoentes: $x^{2}<-(3x-10)$, isto é $x^{2}+3x-10<0$, ou $(x+5)(x-2)<0$. A parábola é negativa entre as raízes: $-5<x<2$.`,
  {
    // Comparação feita nos expoentes: em $xpprox-5$ os dois lados valem
    // ~1e-10 e a diferença some na tolerância se comparada nas potências.
    alvo: (x) => gt(x * x * Math.log(0.4), (3 * x - 10) * Math.log(2.5)),
    cand: (x) => gt(x, -5) && lt(x, 2),
    distCand: [
      (x) => gt(x, -2) && lt(x, 5),
      (x) => ge(x, -5) && le(x, 2),
      (x) => lt(x, -5) || gt(x, 2),
      (x) => gt(x, -5) && lt(x, 10),
    ],
    amostras: grade(-8, 6, 801, [-5, 2, -2, 5, 10]),
  });

// ===========================================================================
// E. INEQUAÇÕES LOGARÍTMICAS
// ===========================================================================
qConjunto(T, "Inequação logarítmica de base 1/2", "medio",
  R`Resolva a inequação $\log_{1/2}(x-1)>-2$.`,
  R`$\left(1,5\right)$`,
  [R`$\left[1,5\right]$`, R`$\left(5,+\infty\right)$`, R`$\left(1,3\right)$`, R`$\left(-\infty,5\right)$`],
  R`Primeiro o domínio: $x-1>0$, isto é $x>1$. Agora escreva $-2=\log_{1/2}4$, já que $\left(\tfrac{1}{2}\right)^{-2}=4$. Base entre $0$ e $1$ significa logaritmo decrescente, então $\log_{1/2}(x-1)>\log_{1/2}4$ equivale a $x-1<4$. Intersectando com o domínio: $1<x<5$.`,
  {
    alvo: (x) => gt(x, 1) && gt(Math.log(x - 1) / Math.log(0.5), -2),
    cand: (x) => gt(x, 1) && lt(x, 5),
    distCand: [
      (x) => ge(x, 1) && le(x, 5),
      (x) => gt(x, 5),
      (x) => gt(x, 1) && lt(x, 3),
      (x) => lt(x, 5),
    ],
    amostras: grade(-2, 9, 901, [1, 5, 3]),
  });

qConjunto(T, "Inequação logarítmica com argumento quadrático", "dificil",
  R`Resolva a inequação $\log_{3}\left(x^{2}-4x\right)\leq1$.`,
  R`$\left[2-\sqrt{7},0\right)\cup\left(4,2+\sqrt{7}\right]$`,
  [
    R`$\left(2-\sqrt{7},0\right)\cup\left(4,2+\sqrt{7}\right)$`,
    R`$\left[2-\sqrt{7},2+\sqrt{7}\right]$`,
    R`$\left(-\infty,0\right)\cup\left(4,+\infty\right)$`,
    R`$\left[-1,0\right)\cup\left(4,5\right]$`,
  ],
  R`São duas condições simultâneas. Domínio: $x^{2}-4x>0$, isto é $x<0$ ou $x>4$ (desigualdade ESTRITA, os extremos $0$ e $4$ ficam de fora). Inequação: base $3>1$, logo $x^{2}-4x\leq3^{1}$, ou $x^{2}-4x-3\leq0$, cujas raízes são $2\pm\sqrt{7}$ e que vale entre elas. Cruzando as duas, $\left[2-\sqrt{7},0\right)\cup\left(4,2+\sqrt{7}\right]$ — fechado onde manda a inequação, aberto onde manda o domínio.`,
  {
    alvo: (x) => {
      const u = x * x - 4 * x;
      return gt(u, 0) && le(Math.log(u) / Math.log(3), 1);
    },
    cand: (x) => (ge(x, 2 - Math.sqrt(7)) && lt(x, 0)) || (gt(x, 4) && le(x, 2 + Math.sqrt(7))),
    distCand: [
      (x) => (gt(x, 2 - Math.sqrt(7)) && lt(x, 0)) || (gt(x, 4) && lt(x, 2 + Math.sqrt(7))),
      (x) => ge(x, 2 - Math.sqrt(7)) && le(x, 2 + Math.sqrt(7)),
      (x) => lt(x, 0) || gt(x, 4),
      (x) => (ge(x, -1) && lt(x, 0)) || (gt(x, 4) && le(x, 5)),
    ],
    amostras: grade(-3, 8, 901, [0, 4, 2 - Math.sqrt(7), 2 + Math.sqrt(7), -1, 5]),
  });

qConjunto(T, "Inequação logarítmica de base variável", "dificil",
  R`Resolva a inequação $\log_{x}(5x-4)>1$.`,
  R`$\left(\dfrac{4}{5},1\right)\cup\left(1,+\infty\right)$`,
  [
    R`$\left(1,+\infty\right)$`,
    R`$\left(\dfrac{4}{5},1\right)$`,
    R`$\left(\dfrac{4}{5},+\infty\right)$`,
    R`$\left(0,1\right)\cup\left(1,+\infty\right)$`,
  ],
  R`Condições de existência: a base pede $x>0$ e $x\neq1$; o argumento pede $5x-4>0$, isto é $x>\tfrac{4}{5}$. Agora separe em dois casos, porque o sentido da desigualdade depende da base. Se $x>1$, o logaritmo é crescente e $\log_{x}(5x-4)>\log_{x}x$ equivale a $5x-4>x$, ou $x>1$ — verdadeiro em todo o caso. Se $\tfrac{4}{5}<x<1$, o logaritmo é DECRESCENTE e a condição inverte: $5x-4<x$, isto é $x<1$ — também verdadeiro em todo o caso. Os dois ramos entram, e só o ponto $x=1$ fica de fora (ali não há base legítima).`,
  {
    alvo: (x) => {
      if (!gt(x, 0) || igual(x, 1) || !gt(5 * x - 4, 0)) return false;
      return gt(Math.log(5 * x - 4) / Math.log(x), 1);
    },
    cand: (x) => (gt(x, 0.8) && lt(x, 1)) || gt(x, 1),
    distCand: [
      (x) => gt(x, 1),
      (x) => gt(x, 0.8) && lt(x, 1),
      (x) => gt(x, 0.8),
      (x) => gt(x, 0) && !igual(x, 1),
    ],
    amostras: grade(-1, 12, 901, [0, 0.8, 1]),
  });

qConjunto(T, "Quadrática no logaritmo — inequação", "medio",
  R`Resolva a inequação $\left(\log_{2}x\right)^{2}-3\log_{2}x+2\leq0$.`,
  R`$\left[2,4\right]$`,
  [R`$\left(2,4\right)$`, R`$\left[1,2\right]$`, R`$\left(0,2\right]\cup\left[4,+\infty\right)$`, R`$\left[4,8\right]$`],
  R`O domínio é $x>0$. Com $u=\log_{2}x$, a inequação é $u^{2}-3u+2\leq0$, isto é $(u-1)(u-2)\leq0$, satisfeita para $1\leq u\leq2$. Como $\log_{2}$ é crescente, isso corresponde a $2^{1}\leq x\leq2^{2}$, ou seja $2\leq x\leq4$.`,
  {
    alvo: (x) => gt(x, 0) && le(Math.pow(Math.log2(x), 2) - 3 * Math.log2(x) + 2, 0),
    cand: (x) => ge(x, 2) && le(x, 4),
    distCand: [
      (x) => gt(x, 2) && lt(x, 4),
      (x) => ge(x, 1) && le(x, 2),
      (x) => (gt(x, 0) && le(x, 2)) || ge(x, 4),
      (x) => ge(x, 4) && le(x, 8),
    ],
    amostras: grade(-1, 10, 901, [0, 1, 2, 4, 8]),
  });

// ===========================================================================
// F. DOMÍNIO E IMAGEM
// ===========================================================================
qConjunto(T, "Domínio com logaritmo de base variável", "medio",
  R`Determine o domínio máximo de $f(x)=\log_{x-2}\left(9-x^{2}\right)$.`,
  R`$\left(2,3\right)$`,
  [
    R`$\left(-3,3\right)$`,
    R`$\left(2,+\infty\right)$`,
    R`$\left(2,3\right)\cup\left(3,+\infty\right)$`,
    R`$\left[2,3\right]$`,
  ],
  R`Três exigências. O argumento precisa ser positivo: $9-x^{2}>0$, ou $-3<x<3$. A base precisa ser positiva: $x-2>0$, ou $x>2$. E a base não pode valer $1$: $x-2\neq1$, isto é $x\neq3$ — que já estava fora pela primeira condição. A interseção é $2<x<3$.`,
  {
    alvo: (x) => gt(9 - x * x, 0) && gt(x - 2, 0) && !igual(x - 2, 1),
    cand: (x) => gt(x, 2) && lt(x, 3),
    distCand: [
      (x) => gt(x, -3) && lt(x, 3),
      (x) => gt(x, 2),
      (x) => gt(x, 2) && !igual(x, 3),
      (x) => ge(x, 2) && le(x, 3),
    ],
    amostras: grade(-5, 7, 901, [-3, 2, 3]),
  });

qConjunto(T, "Domínio com radical de logaritmo", "dificil",
  R`Determine o domínio máximo de $f(x)=\sqrt{\log_{1/2}\left(\dfrac{x-1}{x+2}\right)}$.`,
  R`$\left(1,+\infty\right)$`,
  [
    R`$\left(-\infty,-2\right)\cup\left(1,+\infty\right)$`,
    R`$\left[1,+\infty\right)$`,
    R`$\left(-2,1\right)$`,
    R`$\left(-\infty,-2\right)$`,
  ],
  R`Chame $r=\dfrac{x-1}{x+2}$. O logaritmo pede $r>0$, o que ocorre para $x<-2$ ou $x>1$. O radical pede $\log_{1/2}r\geq0$, e como a base é menor que $1$ isso equivale a $r\leq1$. Ora, $r-1=\dfrac{-3}{x+2}$, que é $\leq0$ somente quando $x+2>0$. Cruzando $\left(x<-2\ \text{ou}\ x>1\right)$ com $x>-2$, sobra $x>1$; em $x=1$ o argumento zera e o logaritmo não existe.`,
  {
    alvo: (x) => {
      const r = (x - 1) / (x + 2);
      return gt(r, 0) && ge(Math.log(r) / Math.log(0.5), 0);
    },
    cand: (x) => gt(x, 1),
    distCand: [(x) => lt(x, -2) || gt(x, 1), (x) => ge(x, 1), (x) => gt(x, -2) && lt(x, 1), (x) => lt(x, -2)],
    amostras: grade(-8, 8, 901, [-2, 1]),
  });

qConjunto(T, "Imagem de logaritmo de quadrática", "medio",
  R`Determine a imagem da função $f(x)=\log_{2}\left(x^{2}-4x+20\right)$.`,
  R`$\left[4,+\infty\right)$`,
  [R`$\left(4,+\infty\right)$`, R`$\left[2,+\infty\right)$`, R`$\mathbb{R}$`, R`$\left[0,+\infty\right)$`],
  R`Complete o quadrado no argumento: $x^{2}-4x+20=(x-2)^{2}+16$, cujo valor mínimo é $16$, atingido em $x=2$, e que cresce sem limite. O argumento percorre então $\left[16,+\infty\right)$, e como $\log_{2}$ é crescente e contínua, a imagem é $\left[\log_{2}16,+\infty\right)=\left[4,+\infty\right)$ — fechada em $4$ porque o mínimo é de fato atingido.`,
  {
    alvo: (y) => naImagem((x) => Math.log2(x * x - 4 * x + 20), y, [[2, 1e6], [-1e6, 2]]),
    cand: (y) => ge(y, 4),
    distCand: [(y) => gt(y, 4), (y) => ge(y, 2), () => true, (y) => ge(y, 0)],
    amostras: grade(0, 12, 601, [4, 2, 0]),
  });

qConjunto(T, "Imagem de exponencial com expoente quadrático", "medio",
  R`Determine a imagem da função $f(x)=3^{x^{2}-4x+1}$.`,
  R`$\left[\dfrac{1}{27},+\infty\right)$`,
  [
    R`$\left(\dfrac{1}{27},+\infty\right)$`,
    R`$\left[\dfrac{1}{9},+\infty\right)$`,
    R`$\left(0,+\infty\right)$`,
    R`$\left[27,+\infty\right)$`,
  ],
  R`O expoente $x^{2}-4x+1=(x-2)^{2}-3$ tem mínimo $-3$ em $x=2$ e cresce sem limite. Como $3^{u}$ é crescente, o menor valor de $f$ é $3^{-3}=\tfrac{1}{27}$, atingido em $x=2$, e não há teto superior. A imagem é $\left[\tfrac{1}{27},+\infty\right)$; ela é fechada à esquerda justamente porque o mínimo do expoente é atingido.`,
  {
    alvo: (y) => naImagem((x) => Math.pow(3, x * x - 4 * x + 1), y, [[2, 12], [-8, 2]]),
    cand: (y) => ge(y, 1 / 27),
    distCand: [(y) => gt(y, 1 / 27), (y) => ge(y, 1 / 9), (y) => gt(y, 0), (y) => ge(y, 27)],
    amostras: grade(0, 40, 601, [0, 0.005, 0.02, 1 / 27, 0.05, 1 / 9, 27]),
  });

qConjunto(T, "Imagem de função homográfica em exponencial", "dificil",
  R`Determine a imagem da função $f(x)=\dfrac{4^{x}+1}{4^{x}+2}$.`,
  R`$\left(\dfrac{1}{2},1\right)$`,
  [
    R`$\left[\dfrac{1}{2},1\right]$`,
    R`$\left(\dfrac{1}{2},1\right]$`,
    R`$\left(0,1\right)$`,
    R`$\left(\dfrac{1}{3},1\right)$`,
  ],
  R`Com $t=4^{x}$, que percorre todo o intervalo $\left(0,+\infty\right)$ sem atingir os extremos, estude $y=\dfrac{t+1}{t+2}=1-\dfrac{1}{t+2}$. Essa expressão é crescente em $t$: quando $t\to0^{+}$ ela tende a $\tfrac{1}{2}$, e quando $t\to+\infty$ tende a $1$. Como nenhum dos dois limites é atingido, a imagem é o intervalo ABERTO $\left(\tfrac{1}{2},1\right)$.`,
  {
    alvo: (y) => naImagem((x) => (Math.pow(4, x) + 1) / (Math.pow(4, x) + 2), y, [[-20, 20]]),
    cand: (y) => gt(y, 0.5) && lt(y, 1),
    distCand: [
      (y) => ge(y, 0.5) && le(y, 1),
      (y) => gt(y, 0.5) && le(y, 1),
      (y) => gt(y, 0) && lt(y, 1),
      (y) => gt(y, 1 / 3) && lt(y, 1),
    ],
    amostras: grade(0.2, 1.3, 441, [0.5, 1, 1 / 3]),
  });

qConjunto(T, "Domínio com logaritmo e radical", "dificil",
  R`Determine o domínio máximo de $f(x)=\ln\left(x^{2}-5x+6\right)+\sqrt{7-x}$.`,
  R`$\left(-\infty,2\right)\cup\left(3,7\right]$`,
  [
    R`$\left(-\infty,2\right]\cup\left[3,7\right]$`,
    R`$\left(-\infty,2\right)\cup\left(3,7\right)$`,
    R`$\left(2,3\right)$`,
    R`$\left(-\infty,2\right)\cup\left(3,+\infty\right)$`,
  ],
  R`O logaritmo exige $x^{2}-5x+6>0$, isto é $(x-2)(x-3)>0$, ou seja $x<2$ ou $x>3$ — os pontos $2$ e $3$ saem, pois ali o argumento zera. O radical exige $7-x\geq0$, isto é $x\leq7$, e o $7$ ENTRA porque a raiz de zero existe. A interseção é $\left(-\infty,2\right)\cup\left(3,7\right]$.`,
  {
    alvo: (x) => gt(x * x - 5 * x + 6, 0) && ge(7 - x, 0),
    cand: (x) => lt(x, 2) || (gt(x, 3) && le(x, 7)),
    distCand: [
      (x) => le(x, 2) || (ge(x, 3) && le(x, 7)),
      (x) => lt(x, 2) || (gt(x, 3) && lt(x, 7)),
      (x) => gt(x, 2) && lt(x, 3),
      (x) => lt(x, 2) || gt(x, 3),
    ],
    amostras: grade(-4, 11, 901, [2, 3, 7]),
  });

// ===========================================================================
// G. CRESCIMENTO E DECAIMENTO
// ===========================================================================
q(T, "Tempo de duplicação a partir de um crescimento percentual", "medio",
  R`Uma cultura cresce segundo $P(t)=P_{0}e^{kt}$ e aumenta $40\%$ em $5$ horas. Em quantas horas, aproximadamente, a população dobra?`,
  R`$10{,}3$`,
  [R`$8{,}7$`, R`$12{,}5$`, R`$9{,}2$`, R`$14{,}0$`],
  R`De $P(5)=1{,}4P_{0}$ vem $e^{5k}=1{,}4$, ou $k=\dfrac{\ln 1{,}4}{5}$. A duplicação pede $e^{kt}=2$, isto é $t=\dfrac{\ln 2}{k}=5\cdot\dfrac{\ln 2}{\ln 1{,}4}$. Numericamente, $5\cdot\dfrac{0{,}693}{0{,}336}\approx10{,}3$ horas. Repare que o tempo de duplicação não depende de $P_{0}$ — é uma característica do modelo exponencial.`,
  10.3,
  () => (5 * Math.log(2)) / Math.log(1.4),
  { tol: 1e-3 });

q(T, "Duas amostras com meias-vidas diferentes", "dificil",
  R`Uma amostra de $40$ g tem meia-vida de $5$ dias e outra, de $10$ g, tem meia-vida de $15$ dias. Após quantos dias as duas massas se igualam?`,
  R`$15$`,
  [R`$10$`, R`$20$`, R`$12$`, R`$30$`],
  R`As massas são $m_{1}(t)=40\cdot2^{-t/5}$ e $m_{2}(t)=10\cdot2^{-t/15}$. Igualando e dividindo, $\dfrac{40}{10}=\dfrac{2^{-t/15}}{2^{-t/5}}$, isto é $4=2^{\frac{t}{5}-\frac{t}{15}}=2^{\frac{2t}{15}}$. Logo $\tfrac{2t}{15}=2$ e $t=15$ dias — instante em que ambas valem $5$ g.`,
  15,
  () => bissecao((t) => 40 * Math.pow(2, -t / 5) - 10 * Math.pow(2, -t / 15), 0, 60));

q(T, "Decaimento de concentração até uma fração dada", "medio",
  R`A concentração de um fármaco no sangue obedece a $C(t)=C_{0}e^{-0{,}25t}$, com $t$ em horas. Em quantas horas a concentração cai a $20\%$ do valor inicial?`,
  R`$6{,}44$`,
  [R`$5{,}54$`, R`$8{,}05$`, R`$4{,}62$`, R`$7{,}20$`],
  R`Imponha $e^{-0{,}25t}=0{,}2$. Tomando logaritmo natural, $-0{,}25t=\ln 0{,}2=-\ln 5$, de onde $t=\dfrac{\ln 5}{0{,}25}=4\ln 5$. Como $\ln 5\approx1{,}609$, resulta $t\approx6{,}44$ horas.`,
  6.44,
  () => Math.log(5) / 0.25,
  { tol: 1e-3 });

q(T, "Taxa nominal que dobra o capital", "dificil",
  R`A que taxa anual nominal, capitalizada mensalmente, um capital dobra em exatamente $6$ anos? Responda em porcentagem ao ano, com duas casas decimais.`,
  R`$11{,}61$`,
  [R`$11{,}00$`, R`$12{,}25$`, R`$10{,}45$`, R`$13{,}00$`],
  R`Com taxa nominal anual $i$ capitalizada mensalmente, a taxa mensal é $\tfrac{i}{12}$ e em $6$ anos há $72$ capitalizações: $\left(1+\tfrac{i}{12}\right)^{72}=2$. Extraindo a raiz, $1+\tfrac{i}{12}=2^{1/72}=e^{\frac{\ln 2}{72}}\approx1{,}009673$, logo $i\approx12\cdot0{,}009673=0{,}11608$, ou seja $11{,}61\%$ ao ano.`,
  11.61,
  () => 1200 * (Math.pow(2, 1 / 72) - 1),
  { tol: 1e-3 });

q(T, "Depreciação percentual e o primeiro inteiro", "medio",
  R`Uma máquina avaliada em $80$ mil reais desvaloriza $15\%$ ao ano. Após quantos anos completos o valor cai abaixo de $30$ mil reais?`,
  R`$7$`,
  [R`$6$`, R`$5$`, R`$8$`, R`$9$`],
  R`O valor após $n$ anos é $80\cdot0{,}85^{n}$ (em milhares). A condição é $0{,}85^{n}<\tfrac{30}{80}=0{,}375$, e aplicando logaritmo — cuja base $0{,}85$ é menor que $1$, o que inverte a desigualdade — obtém-se $n>\dfrac{\ln 0{,}375}{\ln 0{,}85}\approx6{,}03$. Como $n$ é inteiro, o primeiro ano que cumpre é $n=7$: em $6$ anos o valor ainda é cerca de $30{,}2$ mil.`,
  7,
  () => {
    let n = 0;
    while (80000 * Math.pow(0.85, n) >= 30000) n++;
    return n;
  });

q(T, "Colônia que triplica em intervalo fixo", "dificil",
  R`Uma colônia triplica a cada $4$ horas. Quantas horas, aproximadamente, são necessárias para que a população fique $100$ vezes maior?`,
  R`$16{,}8$`,
  [R`$12{,}0$`, R`$18{,}4$`, R`$14{,}6$`, R`$20{,}2$`],
  R`Triplicar a cada $4$ horas significa $P(t)=P_{0}\cdot3^{t/4}$. Impondo $3^{t/4}=100$ e tomando logaritmos, $\tfrac{t}{4}\ln 3=\ln 100$, de onde $t=\dfrac{4\ln 100}{\ln 3}=\dfrac{4\cdot4{,}605}{1{,}099}\approx16{,}8$ horas. Note que $100$ está entre $3^{4}=81$ e $3^{5}=243$, o que já situa a resposta entre $16$ e $20$ horas.`,
  16.8,
  () => (4 * Math.log(100)) / Math.log(3),
  { tol: 3e-3 });

q(T, "Modelo exponencial ajustado por dois pontos", "medio",
  R`Uma população segue $N(t)=Ae^{kt}$, com $N(0)=5$ e $N(3)=40$, sendo $t$ medido em horas. Em que instante a população atinge $1280$?`,
  R`$8$`,
  [R`$6$`, R`$7$`, R`$9$`, R`$10$`],
  R`De $N(0)=5$ vem $A=5$. De $N(3)=40$ vem $e^{3k}=8$, isto é $e^{k}=2$ e portanto $N(t)=5\cdot2^{t}$ — o modelo é uma duplicação a cada hora. Impondo $5\cdot2^{t}=1280$ obtém-se $2^{t}=256=2^{8}$, logo $t=8$ horas.`,
  8,
  () => {
    const k = Math.log(8) / 3;
    return bissecao((t) => 5 * Math.exp(k * t) - 1280, 0, 30);
  });

q(T, "Juros compostos e o primeiro mês que dobra", "medio",
  R`Um investimento rende $0{,}8\%$ ao mês a juros compostos. Em quantos meses completos o montante passa a ser maior que o dobro do capital?`,
  R`$87$`,
  [R`$85$`, R`$88$`, R`$90$`, R`$92$`],
  R`O montante é $C\cdot1{,}008^{n}$, e a condição é $1{,}008^{n}>2$, isto é $n>\dfrac{\ln 2}{\ln 1{,}008}=\dfrac{0{,}6931}{0{,}007968}\approx86{,}99$. Como $n$ é inteiro, o primeiro mês em que o montante supera o dobro é $n=87$ — a proximidade de $87$ mostra por que arredondar para baixo daria a resposta errada.`,
  87,
  () => {
    let n = 0;
    while (Math.pow(1.008, n) <= 2) n++;
    return n;
  });

q(T, "Meia-vida a partir da fração remanescente", "medio",
  R`Uma amostra radioativa decai para $\dfrac{1}{5}$ da massa inicial em $30$ anos. Determine a meia-vida do material, em anos.`,
  R`$12{,}9$`,
  [R`$15{,}0$`, R`$10{,}5$`, R`$6{,}0$`, R`$18{,}6$`],
  R`Escreva a massa como $m(t)=m_{0}\,2^{-t/T}$, em que $T$ é a meia-vida. A condição é $2^{-30/T}=\tfrac{1}{5}$, isto é $2^{30/T}=5$. Tomando logaritmo natural, $\tfrac{30}{T}\ln 2=\ln 5$, de onde $T=\dfrac{30\ln 2}{\ln 5}=\dfrac{30\cdot0{,}693}{1{,}609}\approx12{,}9$ anos. Faz sentido: em $30$ anos cabem pouco mais de duas meias-vidas, e $\tfrac{1}{5}$ está mesmo entre $\tfrac{1}{4}$ e $\tfrac{1}{8}$.`,
  12.9,
  () => (30 * Math.log(2)) / Math.log(5),
  { tol: 3e-3 });

// ===========================================================================
// H. ESCALAS LOGARÍTMICAS
// ===========================================================================
q(T, "Razão de energias na escala Richter", "medio",
  R`A energia $E$, em joules, liberada por um sismo de magnitude $M$ satisfaz $\log_{10}E=11{,}8+1{,}5M$. Quantas vezes a energia de um sismo de magnitude $7{,}2$ supera a de um de magnitude $5{,}4$?`,
  R`$5{,}0\times10^{2}$`,
  [R`$1{,}0\times10^{2}$`, R`$2{,}5\times10^{3}$`, R`$6{,}3\times10^{1}$`, R`$1{,}6\times10^{3}$`],
  R`Subtraia as duas relações em vez de calcular cada energia: $\log_{10}\dfrac{E_{1}}{E_{2}}=1{,}5\left(M_{1}-M_{2}\right)=1{,}5\cdot1{,}8=2{,}7$. Logo a razão é $10^{2{,}7}=10^{2}\cdot10^{0{,}7}\approx100\cdot5{,}01\approx5{,}0\times10^{2}$: uma diferença de menos de dois graus na magnitude significa cerca de $500$ vezes mais energia.`,
  500,
  () => Math.pow(10, 1.5 * (7.2 - 5.4)),
  { tol: 5e-3 });

q(T, "Variação de nível sonoro em decibéis", "medio",
  R`O nível sonoro é dado por $\beta=10\log_{10}\left(\dfrac{I}{I_{0}}\right)$, em decibéis. Se a intensidade $I$ é multiplicada por $250$, de quantos decibéis $\beta$ aumenta?`,
  R`$24{,}0$`,
  [R`$25{,}0$`, R`$20{,}0$`, R`$22{,}5$`, R`$27{,}5$`],
  R`O aumento é $\Delta\beta=10\log_{10}\dfrac{250I}{I}=10\log_{10}250$. Escreva $250=\dfrac{1000}{4}$: $\log_{10}250=3-2\log_{10}2\approx3-0{,}602=2{,}398$. Assim $\Delta\beta\approx24{,}0$ dB — e note que a resposta não depende da intensidade original, só do fator multiplicativo.`,
  24.0,
  () => 10 * Math.log10(250),
  { tol: 2e-3 });

q(T, "pH a partir da concentração de íons", "facil",
  R`O pH de uma solução é $\mathrm{pH}=-\log_{10}\left[\mathrm{H}^{+}\right]$. Calcule o pH de uma solução com $\left[\mathrm{H}^{+}\right]=4{,}0\times10^{-5}$ mol/L, usando $\log_{10}2=0{,}30$.`,
  R`$4{,}40$`,
  [R`$4{,}60$`, R`$5{,}40$`, R`$3{,}40$`, R`$4{,}20$`],
  R`Separe o produto dentro do logaritmo: $\log_{10}\left(4{,}0\times10^{-5}\right)=\log_{10}4-5=2\log_{10}2-5=0{,}60-5=-4{,}40$. Com o sinal trocado, $\mathrm{pH}=4{,}40$ — levemente ácida, como se espera de uma concentração maior que $10^{-7}$.`,
  4.4,
  () => -Math.log10(4.0e-5),
  { tol: 1e-3 });

// ===========================================================================
// I. SISTEMAS
// ===========================================================================
q(T, "Sistema exponencial por soma e produto", "dificil",
  R`O par de inteiros $(x,y)$ satisfaz $2^{x}\cdot3^{y}=72$ e $2^{x}+3^{y}=17$. Determine $x+y$.`,
  R`$5$`,
  [R`$4$`, R`$6$`, R`$7$`, R`$3$`],
  R`Chame $u=2^{x}$ e $v=3^{y}$: o sistema vira $uv=72$ e $u+v=17$, de modo que $u$ e $v$ são as raízes de $t^{2}-17t+72=0$, isto é $8$ e $9$. Como $x$ e $y$ são inteiros, $u$ tem de ser potência de $2$ e $v$ potência de $3$: $u=8=2^{3}$ e $v=9=3^{2}$, ou seja $x=3$ e $y=2$. Logo $x+y=5$.`,
  5,
  () => {
    for (let x = -6; x <= 6; x++)
      for (let y = -6; y <= 6; y++) {
        const u = Math.pow(2, x);
        const v = Math.pow(3, y);
        if (Math.abs(u * v - 72) < 1e-9 && Math.abs(u + v - 17) < 1e-9) return x + y;
      }
    return NaN;
  });

q(T, "Sistema com logaritmos recíprocos", "dificil",
  R`Os reais $x$ e $y$, ambos maiores que $1$, satisfazem $\log_{x}y+\log_{y}x=\dfrac{5}{2}$ e $xy=27$, com $x<y$. Determine $x+y$.`,
  R`$12$`,
  [R`$10$`, R`$14$`, R`$18$`, R`$9$`],
  R`Como $\log_{y}x=\dfrac{1}{\log_{x}y}$, ponha $t=\log_{x}y$: a primeira equação é $t+\tfrac{1}{t}=\tfrac{5}{2}$, isto é $2t^{2}-5t+2=0$, com $t=2$ ou $t=\tfrac{1}{2}$. Como $x<y$ e ambos excedem $1$, tem-se $t>1$, logo $t=2$ e $y=x^{2}$. Substituindo em $xy=27$: $x^{3}=27$, $x=3$ e $y=9$. Portanto $x+y=12$.`,
  12,
  () => {
    const x = bissecao((t) => Math.log(27 / t) / Math.log(t) + Math.log(t) / Math.log(27 / t) - 2.5, 1.5, 5.1);
    return x + 27 / x;
  });

finalizar("fcg_lote4.json", 20260915);
