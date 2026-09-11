// Lote 4 de Cálculo I — 89 questões de nível universitário (Guidorizzi vol. 1,
// Stewart, Leithold), calibradas para P1/P2/P3 de federais. O lote anterior foi
// considerado fácil demais: aqui não há nenhuma questão `facil`, e a maioria
// exige duas ou mais etapas encadeadas (conjugado + limite fundamental,
// derivação implícita de segunda ordem, soma de Riemann reconhecida como
// integral, simetria do intervalo, substituição trigonométrica, TFC com regra
// da cadeia nos dois limites).
//
// Cobre TODOS os tópicos de Cálculo I cadastrados, inclusive os que estavam
// zerados no banco (Teorema Fundamental do Cálculo, Problemas de otimização).
//
// Rode: node listas_questoes/gerado/scripts/calculo1_lote4.mjs
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Cálculo I";
const LETRAS = ["a", "b", "c", "d", "e"];

// A letra do gabarito vem de uma sequência pré-embaralhada e balanceada (18/18/
// 18/18/17 em 89 questões) em vez de ser escolhida à mão questão a questão — no
// lote 3, escolher na mão concentrou quase metade dos gabaritos numa letra só.
function sequenciaDeLetras(n) {
  const base = [];
  for (let i = 0; i < n; i++) base.push(LETRAS[i % 5]);
  // Embaralhamento determinístico (LCG) para a ordem não ser cíclica.
  let s = 20260911;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}

const brutas = [];
// correta = texto da alternativa certa; distratores = as outras 4, em ordem.
const q = (topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao) =>
  brutas.push({ topico, subtopico, dificuldade, enunciado, correta, distratores, resolucao });

// ===========================================================================
// 1. LIMITES
// ===========================================================================
q("Limites", "Limite com raízes de índices diferentes", "dificil",
  R`Calcule $\lim_{x\to 0}\dfrac{\sqrt[3]{8+x}-\sqrt{4+x}}{x}$.`,
  R`$-\dfrac{1}{6}$`,
  [R`$\dfrac{1}{6}$`, R`$-\dfrac{1}{12}$`, R`$\dfrac{1}{4}$`, R`$-\dfrac{1}{3}$`],
  R`Separe o quociente somando e subtraindo $2$. Para a raiz cúbica, ponha $u=\sqrt[3]{8+x}$, de modo que $x=u^{3}-8$ e $\dfrac{\sqrt[3]{8+x}-2}{x}=\dfrac{u-2}{u^{3}-8}=\dfrac{1}{u^{2}+2u+4}\to\dfrac{1}{12}$. Para a raiz quadrada, multiplique pelo conjugado: $\dfrac{\sqrt{4+x}-2}{x}=\dfrac{1}{\sqrt{4+x}+2}\to\dfrac{1}{4}$. O limite pedido é a diferença $\dfrac{1}{12}-\dfrac{1}{4}=-\dfrac{1}{6}$.`);

q("Limites", "Limite no infinito com radical e mudança de sinal", "dificil",
  R`Calcule $\lim_{x\to-\infty}\left(x+\sqrt{x^{2}+5x}\right)$.`,
  R`$-\dfrac{5}{2}$`,
  [R`$\dfrac{5}{2}$`, R`$-\dfrac{5}{4}$`, R`$\dfrac{5}{4}$`, R`$-\dfrac{3}{2}$`],
  R`Escreva $x=-t$, com $t\to+\infty$, de modo que a expressão vira $-t+\sqrt{t^{2}-5t}$. Multiplicando pelo conjugado, $\dfrac{\left(t^{2}-5t\right)-t^{2}}{\sqrt{t^{2}-5t}+t}=\dfrac{-5t}{\sqrt{t^{2}-5t}+t}$. Dividindo numerador e denominador por $t>0$, resta $\dfrac{-5}{\sqrt{1-\frac{5}{t}}+1}\to\dfrac{-5}{2}$. O erro comum é concluir $0$ ou $-\infty$ sem racionalizar.`);

q("Limites", "Limite trigonométrico de terceira ordem", "medio",
  R`Calcule $\lim_{x\to 0}\dfrac{\operatorname{tg}x-\operatorname{sen}x}{x^{3}}$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{3}$`, R`$\dfrac{1}{6}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{3}{2}$`],
  R`Fatorando, $\operatorname{tg}x-\operatorname{sen}x=\operatorname{sen}x\left(\dfrac{1}{\cos x}-1\right)=\dfrac{\operatorname{sen}x\left(1-\cos x\right)}{\cos x}$. Assim o quociente se escreve como $\dfrac{\operatorname{sen}x}{x}\cdot\dfrac{1-\cos x}{x^{2}}\cdot\dfrac{1}{\cos x}$, cujos fatores tendem a $1$, $\dfrac{1}{2}$ e $1$. O limite é $\dfrac{1}{2}$.`);

q("Limites", "Limite de potência com base e expoente variáveis", "dificil",
  R`Calcule $\lim_{x\to 0}\left(\cos x\right)^{1/x^{2}}$.`,
  R`$e^{-1/2}$`,
  [R`$e^{-1}$`, R`$e^{-1/4}$`, R`$e^{1/2}$`, R`$e^{-2}$`],
  R`Pondo $y=\left(\cos x\right)^{1/x^{2}}$, tem-se $\ln y=\dfrac{\ln\cos x}{x^{2}}$, uma indeterminação $\tfrac{0}{0}$. Por L'Hospital, $\lim_{x\to0}\dfrac{-\operatorname{tg}x}{2x}=-\dfrac{1}{2}\lim_{x\to0}\dfrac{\operatorname{tg}x}{x}=-\dfrac{1}{2}$. Como a exponencial é contínua, $y\to e^{-1/2}$.`);

// ===========================================================================
// 2. CONTINUIDADE
// ===========================================================================
q("Continuidade", "Dois parâmetros em função definida por partes", "dificil",
  R`Seja $f(x)=\dfrac{\operatorname{sen}(ax)}{x}$ para $x<0$, $f(0)=b$ e $f(x)=\dfrac{\sqrt{x+4}-2}{x}$ para $x>0$. Sabendo que $f$ é contínua em $x=0$, calcule $a+b$.`,
  R`$\dfrac{1}{2}$`,
  [R`$\dfrac{1}{4}$`, R`$\dfrac{1}{8}$`, R`$\dfrac{3}{4}$`, R`$\dfrac{5}{8}$`],
  R`Pela esquerda, $\lim_{x\to0^{-}}\dfrac{\operatorname{sen}(ax)}{x}=a\lim_{x\to0}\dfrac{\operatorname{sen}(ax)}{ax}=a$. Pela direita, racionalizando, $\dfrac{\sqrt{x+4}-2}{x}=\dfrac{1}{\sqrt{x+4}+2}\to\dfrac{1}{4}$. A continuidade em $0$ exige que ambos os limites laterais valham $f(0)$, logo $a=\dfrac{1}{4}$ e $b=\dfrac{1}{4}$, e $a+b=\dfrac{1}{2}$.`);

q("Continuidade", "Teorema do Valor Intermediário e contagem de raízes", "dificil",
  R`Determine o número de raízes reais da equação $3x^{5}-5x^{3}+1=0$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$5$`],
  R`Seja $f(x)=3x^{5}-5x^{3}+1$. Como $f'(x)=15x^{4}-15x^{2}=15x^{2}\left(x^{2}-1\right)$, a função cresce em $(-\infty,-1)$, decresce em $(-1,1)$ e cresce em $(1,+\infty)$. Com $f(-1)=3>0$, $f(1)=-1<0$, $f\to-\infty$ quando $x\to-\infty$ e $f\to+\infty$ quando $x\to+\infty$, o Teorema do Valor Intermediário garante exatamente uma raiz em cada um dos três intervalos de monotonicidade — nem uma a mais, pela injetividade em cada trecho. São $3$ raízes.`);

q("Continuidade", "Salto num ponto de descontinuidade", "medio",
  R`Seja $f(x)=\dfrac{x^{2}-5x+6}{\left|x-2\right|}$ para $x\neq2$. Calcule $\lim_{x\to2^{+}}f(x)-\lim_{x\to2^{-}}f(x)$.`,
  R`$-2$`,
  [R`$2$`, R`$-1$`, R`$1$`, R`$0$`],
  R`Como $x^{2}-5x+6=(x-2)(x-3)$, para $x>2$ vale $\left|x-2\right|=x-2$ e $f(x)=x-3\to-1$; para $x<2$ vale $\left|x-2\right|=2-x$ e $f(x)=3-x\to1$. A diferença pedida é $-1-1=-2$.`);

q("Continuidade", "Parâmetro em limite trigonométrico", "medio",
  R`Seja $f(x)=\dfrac{1-\cos(kx)}{x\operatorname{sen}(3x)}$ para $x\neq0$ e $f(0)=6$, com $k>0$. Determine $k$ para que $f$ seja contínua em $x=0$.`,
  R`$6$`,
  [R`$3$`, R`$4$`, R`$9$`, R`$12$`],
  R`Reescreva o quociente como $\dfrac{1-\cos(kx)}{(kx)^{2}}\cdot\dfrac{k^{2}x^{2}}{x\operatorname{sen}(3x)}$. O primeiro fator tende a $\dfrac{1}{2}$ e o segundo a $\dfrac{k^{2}}{3}$, pois $\operatorname{sen}(3x)\sim3x$. Logo o limite é $\dfrac{k^{2}}{6}$, e a continuidade exige $\dfrac{k^{2}}{6}=6$, isto é $k^{2}=36$ e, como $k>0$, $k=6$.`);

q("Continuidade", "Prolongamento contínuo com dois infinitésimos", "dificil",
  R`Seja $f(x)=\dfrac{\sqrt{x^{2}+9}-3}{1-\cos x}$ para $x\neq0$. Determine o valor de $f(0)$ que torna $f$ contínua em $x=0$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{6}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{2}{3}$`, R`$\dfrac{3}{2}$`],
  R`Racionalizando o numerador, $\sqrt{x^{2}+9}-3=\dfrac{x^{2}}{\sqrt{x^{2}+9}+3}$. Então $f(x)=\dfrac{1}{\sqrt{x^{2}+9}+3}\cdot\dfrac{x^{2}}{1-\cos x}$. O primeiro fator tende a $\dfrac{1}{6}$ e o segundo a $2$, pois $1-\cos x\sim\dfrac{x^{2}}{2}$. Logo $f(0)=\dfrac{2}{6}=\dfrac{1}{3}$.`);

// ===========================================================================
// 3. A DERIVADA
// ===========================================================================
q("A Derivada", "Derivabilidade de função definida por partes", "medio",
  R`Sejam $a$ e $b$ reais tais que $f(x)=ax+b$ para $x<1$ e $f(x)=x^{3}-2x$ para $x\geq1$ seja derivável em $x=1$. Calcule o produto $ab$.`,
  R`$-2$`,
  [R`$-3$`, R`$-1$`, R`$1$`, R`$2$`],
  R`Derivabilidade implica continuidade, logo $a+b=f(1)=1-2=-1$. Igualando as derivadas laterais, $a=\left.\left(3x^{2}-2\right)\right|_{x=1}=1$, donde $b=-2$ e $ab=-2$.`);

q("A Derivada", "Tangentes paralelas a uma reta dada", "medio",
  R`Seja $f(x)=x^{3}-3x^{2}+2$. Determine a soma das abscissas dos pontos do gráfico de $f$ em que a reta tangente é paralela à reta $y=9x-4$.`,
  R`$2$`,
  [R`$0$`, R`$1$`, R`$3$`, R`$4$`],
  R`O paralelismo exige $f'(x)=9$, isto é $3x^{2}-6x=9$, ou ainda $x^{2}-2x-3=0$, de raízes $x=3$ e $x=-1$. A soma é $2$ — valor que já se lê direto nas relações de Girard, sem resolver a equação.`);

q("A Derivada", "Derivada pela definição em argumentos compostos", "medio",
  R`Seja $f$ derivável em $\mathbb{R}$, com $f(0)=0$ e $f'(0)=3$. Calcule $\lim_{x\to0}\dfrac{f(5x)-f(2x)}{x}$.`,
  R`$9$`,
  [R`$6$`, R`$21$`, R`$15$`, R`$3$`],
  R`Escreva $\dfrac{f(5x)-f(2x)}{x}=5\cdot\dfrac{f(5x)-f(0)}{5x}-2\cdot\dfrac{f(2x)-f(0)}{2x}$. Quando $x\to0$, cada quociente de Newton tende a $f'(0)=3$, e o limite é $5\cdot3-2\cdot3=9$.`);

q("A Derivada", "Reta tangente ao gráfico de um quociente", "dificil",
  R`Seja $f$ derivável com $f(2)=4$ e $f'(2)=-1$, e seja $g(x)=\dfrac{f(x)}{x^{2}}$. Determine o coeficiente linear da reta tangente ao gráfico de $g$ no ponto de abscissa $x=2$.`,
  R`$\dfrac{7}{2}$`,
  [R`$\dfrac{5}{2}$`, R`$-\dfrac{5}{4}$`, R`$\dfrac{9}{2}$`, R`$\dfrac{3}{2}$`],
  R`Tem-se $g(2)=\dfrac{4}{4}=1$ e, pela regra do quociente, $g'(x)=\dfrac{f'(x)x^{2}-2xf(x)}{x^{4}}$, logo $g'(2)=\dfrac{(-1)(4)-4(4)}{16}=-\dfrac{5}{4}$. A tangente é $y=1-\dfrac{5}{4}(x-2)=-\dfrac{5}{4}x+\dfrac{7}{2}$, cujo coeficiente linear é $\dfrac{7}{2}$.`);

q("A Derivada", "Derivada de função com módulo", "medio",
  R`Seja $f(x)=\left|x^{2}-4\right|$. Calcule $f'(3)+f'(1)$.`,
  R`$4$`,
  [R`$8$`, R`$6$`, R`$2$`, R`$0$`],
  R`Para $\left|x\right|>2$ vale $f(x)=x^{2}-4$ e $f'(x)=2x$, logo $f'(3)=6$. Para $\left|x\right|<2$ vale $f(x)=4-x^{2}$ e $f'(x)=-2x$, logo $f'(1)=-2$. A soma é $4$. Nos pontos $x=\pm2$ a função não é derivável, mas nenhum deles foi pedido.`);

// ===========================================================================
// 4. CÁLCULO DAS DERIVADAS
// ===========================================================================
q("Cálculo das Derivadas", "Derivação logarítmica", "dificil",
  R`Seja $f(x)=x^{\operatorname{sen}x}$, com $x>0$. Calcule $f'\!\left(\dfrac{\pi}{2}\right)$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$\pi$`, R`$\dfrac{2}{\pi}$`],
  R`Tomando logaritmos, $\ln f(x)=\operatorname{sen}x\ln x$. Derivando, $\dfrac{f'(x)}{f(x)}=\cos x\ln x+\dfrac{\operatorname{sen}x}{x}$. Em $x=\dfrac{\pi}{2}$ temos $\cos x=0$ e $\operatorname{sen}x=1$, logo $\dfrac{f'}{f}=\dfrac{2}{\pi}$. Como $f\!\left(\dfrac{\pi}{2}\right)=\dfrac{\pi}{2}$, segue $f'\!\left(\dfrac{\pi}{2}\right)=\dfrac{\pi}{2}\cdot\dfrac{2}{\pi}=1$.`);

q("Cálculo das Derivadas", "Derivada segunda por derivação implícita", "dificil",
  R`A equação $x^{2}+y^{2}=25$ define $y$ como função de $x$ numa vizinhança do ponto $(3,4)$. Calcule $\dfrac{d^{2}y}{dx^{2}}$ nesse ponto.`,
  R`$-\dfrac{25}{64}$`,
  [R`$-\dfrac{25}{16}$`, R`$-\dfrac{9}{64}$`, R`$\dfrac{25}{64}$`, R`$-\dfrac{3}{4}$`],
  R`Derivando, $2x+2yy'=0$, isto é $y'=-\dfrac{x}{y}$, que em $(3,4)$ vale $-\dfrac{3}{4}$. Derivando de novo pela regra do quociente, $y''=-\dfrac{y-xy'}{y^{2}}$. Substituindo, $y''=-\dfrac{4-3\left(-\dfrac{3}{4}\right)}{16}=-\dfrac{\dfrac{25}{4}}{16}=-\dfrac{25}{64}$.`);

q("Cálculo das Derivadas", "Regra da cadeia em quociente elevado a potência", "medio",
  R`Seja $f(x)=\left(\dfrac{1+x}{1-x}\right)^{5}$. Calcule $f'(0)$.`,
  R`$10$`,
  [R`$5$`, R`$25$`, R`$2$`, R`$0$`],
  R`Por derivação logarítmica, $\ln f(x)=5\left[\ln(1+x)-\ln(1-x)\right]$ e $\dfrac{f'(x)}{f(x)}=5\left(\dfrac{1}{1+x}+\dfrac{1}{1-x}\right)$. Em $x=0$ isso vale $10$ e, como $f(0)=1$, segue $f'(0)=10$.`);

q("Cálculo das Derivadas", "Derivada de ordem superior de função racional", "dificil",
  R`Seja $f(x)=\dfrac{1}{1-2x}$. Calcule $f^{(4)}(0)$.`,
  R`$384$`,
  [R`$16$`, R`$24$`, R`$96$`, R`$192$`],
  R`Derivando sucessivamente, $f'(x)=2(1-2x)^{-2}$, $f''(x)=8(1-2x)^{-3}$, $f'''(x)=48(1-2x)^{-4}$ e $f^{(4)}(x)=384(1-2x)^{-5}$ — o padrão geral é $f^{(n)}(x)=n!\,2^{n}(1-2x)^{-(n+1)}$. Em $x=0$, $f^{(4)}(0)=4!\cdot2^{4}=24\cdot16=384$.`);

q("Cálculo das Derivadas", "Potência com expoente racional", "medio",
  R`Seja $f(x)=\sqrt[3]{x}\left(x-4\right)$. Calcule $f'(8)$.`,
  R`$\dfrac{7}{3}$`,
  [R`$\dfrac{5}{3}$`, R`$\dfrac{4}{3}$`, R`$\dfrac{8}{3}$`, R`$\dfrac{10}{3}$`],
  R`Escreva $f(x)=x^{4/3}-4x^{1/3}$, de modo que $f'(x)=\dfrac{4}{3}x^{1/3}-\dfrac{4}{3}x^{-2/3}$. Em $x=8$ valem $x^{1/3}=2$ e $x^{-2/3}=\dfrac{1}{4}$, logo $f'(8)=\dfrac{8}{3}-\dfrac{1}{3}=\dfrac{7}{3}$.`);

q("Cálculo das Derivadas", "Derivação implícita com exponenciais", "dificil",
  R`A curva de equação $x\,e^{y}+y\,e^{x}=2e$ passa pelo ponto $(1,1)$. Calcule $\dfrac{dy}{dx}$ nesse ponto.`,
  R`$-1$`,
  [R`$-e$`, R`$0$`, R`$1$`, R`$-\dfrac{1}{e}$`],
  R`Derivando implicitamente em relação a $x$, $e^{y}+xe^{y}y'+y'e^{x}+ye^{x}=0$. Em $(1,1)$ isso vira $e+ey'+ey'+e=0$, ou seja $2e\left(1+y'\right)=0$. Como $e\neq0$, resulta $y'=-1$.`);

q("Cálculo das Derivadas", "Derivada de ordem n de um produto", "dificil",
  R`Seja $f(x)=x^{2}e^{x}$. Calcule $f^{(10)}(0)$.`,
  R`$90$`,
  [R`$100$`, R`$110$`, R`$20$`, R`$45$`],
  R`Derivando algumas vezes, $f'(x)=e^{x}\left(x^{2}+2x\right)$, $f''(x)=e^{x}\left(x^{2}+4x+2\right)$ e $f'''(x)=e^{x}\left(x^{2}+6x+6\right)$, o que sugere $f^{(n)}(x)=e^{x}\left(x^{2}+2nx+n(n-1)\right)$. A regra de Leibniz confirma a fórmula, já que só três parcelas sobrevivem (as derivadas de $x^{2}$ acima da segunda ordem são nulas). Em $x=0$ com $n=10$: $f^{(10)}(0)=10\cdot9=90$.`);

// ===========================================================================
// 5. APLICAÇÕES DA DERIVADA
// ===========================================================================
q("Aplicações da Derivada", "Teorema do Valor Médio", "medio",
  R`Seja $f(x)=x^{3}-x$ no intervalo $[0,2]$. Determine o valor de $c$ garantido pelo Teorema do Valor Médio.`,
  R`$\dfrac{2\sqrt{3}}{3}$`,
  [R`$\dfrac{\sqrt{3}}{3}$`, R`$\dfrac{4\sqrt{3}}{3}$`, R`$\dfrac{\sqrt{6}}{3}$`, R`$\dfrac{2\sqrt{6}}{3}$`],
  R`A taxa média de variação é $\dfrac{f(2)-f(0)}{2-0}=\dfrac{6-0}{2}=3$. O teorema garante $c\in(0,2)$ com $f'(c)=3$, isto é $3c^{2}-1=3$, logo $c^{2}=\dfrac{4}{3}$ e, dentro do intervalo, $c=\dfrac{2}{\sqrt{3}}=\dfrac{2\sqrt{3}}{3}$.`);

q("Aplicações da Derivada", "Taxas relacionadas em tanque cônico", "medio",
  R`Um tanque cônico invertido tem $2$ m de raio no topo e $4$ m de altura. A água escoa dele à taxa constante de $2$ m³/min. Determine a taxa de variação do nível da água no instante em que a altura é $2$ m.`,
  R`$-\dfrac{2}{\pi}$ m/min`,
  [R`$-\dfrac{1}{\pi}$ m/min`, R`$-\dfrac{4}{\pi}$ m/min`, R`$-\dfrac{1}{2\pi}$ m/min`, R`$-\dfrac{8}{\pi}$ m/min`],
  R`Por semelhança de triângulos, $r=\dfrac{h}{2}$, e portanto $V=\dfrac{\pi}{3}r^{2}h=\dfrac{\pi h^{3}}{12}$. Derivando em relação ao tempo, $\dfrac{dV}{dt}=\dfrac{\pi h^{2}}{4}\dfrac{dh}{dt}$. Com $\dfrac{dV}{dt}=-2$ e $h=2$, vem $-2=\pi\dfrac{dh}{dt}$, isto é $\dfrac{dh}{dt}=-\dfrac{2}{\pi}$ m/min.`);

q("Aplicações da Derivada", "Taxas relacionadas com semelhança de triângulos", "dificil",
  R`Um holofote fixo no chão está a $20$ m de um prédio. Um homem de $2$ m de altura caminha, a partir do holofote e em linha reta rumo ao prédio, com velocidade de $1{,}6$ m/s. Determine a taxa com que a sombra dele projetada na parede encurta no instante em que ele está a $8$ m do prédio.`,
  R`$\dfrac{4}{9}$ m/s`,
  [R`$\dfrac{2}{9}$ m/s`, R`$\dfrac{8}{9}$ m/s`, R`$\dfrac{4}{3}$ m/s`, R`$\dfrac{5}{9}$ m/s`],
  R`Sejam $x$ a distância do homem ao holofote e $s$ a altura da sombra na parede. Por semelhança, $\dfrac{2}{x}=\dfrac{s}{20}$, isto é $s=\dfrac{40}{x}$. Derivando, $\dfrac{ds}{dt}=-\dfrac{40}{x^{2}}\dfrac{dx}{dt}$. A $8$ m do prédio tem-se $x=12$ e $\dfrac{dx}{dt}=1{,}6$, logo $\dfrac{ds}{dt}=-\dfrac{40\cdot1{,}6}{144}=-\dfrac{4}{9}$: a sombra encurta a $\dfrac{4}{9}$ m/s.`);

q("Aplicações da Derivada", "Máximo absoluto em intervalo fechado", "medio",
  R`Determine o valor máximo absoluto de $f(x)=x\sqrt{4-x^{2}}$ em $[-2,2]$.`,
  R`$2$`,
  [R`$1$`, R`$4$`, R`$2\sqrt{2}$`, R`$\sqrt{2}$`],
  R`Derivando, $f'(x)=\sqrt{4-x^{2}}-\dfrac{x^{2}}{\sqrt{4-x^{2}}}=\dfrac{4-2x^{2}}{\sqrt{4-x^{2}}}$, que se anula em $x=\pm\sqrt{2}$. Nos extremos, $f(\pm2)=0$; em $x=\sqrt{2}$, $f=\sqrt{2}\cdot\sqrt{2}=2$; em $x=-\sqrt{2}$, $f=-2$. O máximo absoluto é $2$.`);

q("Aplicações da Derivada", "Limite exponencial por L'Hospital", "dificil",
  R`Calcule $\lim_{x\to+\infty}\left(\dfrac{x+2}{x-1}\right)^{3x}$.`,
  R`$e^{9}$`,
  [R`$e^{3}$`, R`$e^{6}$`, R`$e^{-9}$`, R`$e^{1/3}$`],
  R`Chamando o limite de $L$, temos $\ln L=\lim_{x\to+\infty}3x\ln\dfrac{x+2}{x-1}$. Como $\dfrac{x+2}{x-1}=1+\dfrac{3}{x-1}$ e $\ln(1+u)\sim u$ quando $u\to0$, o produto se comporta como $3x\cdot\dfrac{3}{x-1}\to9$. Logo $L=e^{9}$.`);

q("Aplicações da Derivada", "Pontos de inflexão de função racional", "medio",
  R`Determine o número de pontos de inflexão do gráfico de $f(x)=\dfrac{x}{x^{2}+3}$.`,
  R`$3$`,
  [R`$0$`, R`$1$`, R`$2$`, R`$4$`],
  R`Tem-se $f'(x)=\dfrac{3-x^{2}}{\left(x^{2}+3\right)^{2}}$ e, derivando outra vez e simplificando o fator comum, $f''(x)=\dfrac{2x\left(x^{2}-9\right)}{\left(x^{2}+3\right)^{3}}$. Os zeros são $x=-3$, $x=0$ e $x=3$, e em cada um deles $f''$ troca de sinal. São $3$ pontos de inflexão.`);

q("Aplicações da Derivada", "Distância entre os extremos locais", "dificil",
  R`Seja $f(x)=\dfrac{x^{2}}{x-1}$. Determine a distância entre o ponto de máximo local e o ponto de mínimo local do gráfico de $f$.`,
  R`$2\sqrt{5}$`,
  [R`$2\sqrt{2}$`, R`$3\sqrt{2}$`, R`$4\sqrt{5}$`, R`$\sqrt{5}$`],
  R`Derivando, $f'(x)=\dfrac{2x(x-1)-x^{2}}{(x-1)^{2}}=\dfrac{x(x-2)}{(x-1)^{2}}$, que se anula em $x=0$ e $x=2$. O estudo do sinal mostra máximo local em $x=0$, com $f(0)=0$, e mínimo local em $x=2$, com $f(2)=4$. A distância entre $(0,0)$ e $(2,4)$ é $\sqrt{4+16}=\sqrt{20}=2\sqrt{5}$.`);

q("Aplicações da Derivada", "Extremos absolutos de função trigonométrica", "dificil",
  R`Determine a soma dos valores máximo e mínimo absolutos de $f(x)=x-2\operatorname{sen}x$ em $[0,2\pi]$.`,
  R`$2\pi$`,
  [R`$\pi$`, R`$\dfrac{4\pi}{3}$`, R`$2\pi+2\sqrt{3}$`, R`$2\pi-2\sqrt{3}$`],
  R`De $f'(x)=1-2\cos x=0$ vem $\cos x=\dfrac{1}{2}$, isto é $x=\dfrac{\pi}{3}$ ou $x=\dfrac{5\pi}{3}$. Os candidatos são $f(0)=0$, $f\!\left(\dfrac{\pi}{3}\right)=\dfrac{\pi}{3}-\sqrt{3}\approx-0{,}69$, $f\!\left(\dfrac{5\pi}{3}\right)=\dfrac{5\pi}{3}+\sqrt{3}\approx6{,}97$ e $f(2\pi)=2\pi\approx6{,}28$. O mínimo é $\dfrac{\pi}{3}-\sqrt{3}$ e o máximo é $\dfrac{5\pi}{3}+\sqrt{3}$; os radicais se cancelam e a soma é $2\pi$.`);

// ===========================================================================
// 6. INTEGRAL DEFINIDA
// ===========================================================================
q("Integral Definida", "Soma de Riemann que produz arco-tangente", "dificil",
  R`Calcule $\lim_{n\to\infty}\displaystyle\sum_{i=1}^{n}\dfrac{n}{n^{2}+i^{2}}$.`,
  R`$\dfrac{\pi}{4}$`,
  [R`$\dfrac{\pi}{6}$`, R`$\dfrac{\pi}{3}$`, R`$\dfrac{\pi}{2}$`, R`$\dfrac{2\pi}{3}$`],
  R`Dividindo numerador e denominador por $n^{2}$, $\dfrac{n}{n^{2}+i^{2}}=\dfrac{1}{n}\cdot\dfrac{1}{1+\left(\dfrac{i}{n}\right)^{2}}$, que é a soma de Riemann de $f(x)=\dfrac{1}{1+x^{2}}$ em $[0,1]$ com partição uniforme. Logo o limite é $\displaystyle\int_{0}^{1}\dfrac{dx}{1+x^{2}}=\operatorname{arctg}1=\dfrac{\pi}{4}$.`);

q("Integral Definida", "Soma de potências reconhecida como integral", "medio",
  R`Calcule $\lim_{n\to\infty}\dfrac{1^{4}+2^{4}+\cdots+n^{4}}{n^{5}}$.`,
  R`$\dfrac{1}{5}$`,
  [R`$\dfrac{1}{4}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{6}$`, R`$\dfrac{2}{5}$`],
  R`Escreva a expressão como $\displaystyle\sum_{i=1}^{n}\dfrac{1}{n}\left(\dfrac{i}{n}\right)^{4}$, que é a soma de Riemann de $f(x)=x^{4}$ em $[0,1]$. Portanto o limite é $\displaystyle\int_{0}^{1}x^{4}\,dx=\dfrac{1}{5}$.`);

q("Integral Definida", "Simetria do intervalo de integração", "dificil",
  R`Calcule $\displaystyle\int_{0}^{3}\dfrac{\sqrt{x}}{\sqrt{x}+\sqrt{3-x}}\,dx$.`,
  R`$\dfrac{3}{2}$`,
  [R`$1$`, R`$\dfrac{3}{4}$`, R`$3$`, R`$\dfrac{9}{4}$`],
  R`Chame a integral de $I$ e aplique a substituição $u=3-x$, que leva $[0,3]$ nele mesmo: $I=\displaystyle\int_{0}^{3}\dfrac{\sqrt{3-u}}{\sqrt{3-u}+\sqrt{u}}\,du$. Somando as duas expressões de $I$, os integrandos se completam: $2I=\displaystyle\int_{0}^{3}1\,dx=3$, logo $I=\dfrac{3}{2}$.`);

q("Integral Definida", "Integral de função modular", "medio",
  R`Calcule $\displaystyle\int_{0}^{3}\left|x^{2}-2x\right|\,dx$.`,
  R`$\dfrac{8}{3}$`,
  [R`$\dfrac{4}{3}$`, R`$\dfrac{10}{3}$`, R`$2$`, R`$\dfrac{16}{3}$`],
  R`Em $[0,2]$ vale $x^{2}-2x\leq0$ e em $[2,3]$ vale $x^{2}-2x\geq0$. Assim a integral é $\displaystyle\int_{0}^{2}\left(2x-x^{2}\right)dx+\displaystyle\int_{2}^{3}\left(x^{2}-2x\right)dx=\left(4-\dfrac{8}{3}\right)+\left(0-\left(-\dfrac{4}{3}\right)\right)=\dfrac{4}{3}+\dfrac{4}{3}=\dfrac{8}{3}$.`);

q("Integral Definida", "Truque de simetria com exponencial", "dificil",
  R`Calcule $\displaystyle\int_{-1}^{1}\dfrac{x^{2}}{1+e^{x}}\,dx$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{2}{3}$`, R`$\dfrac{1}{2}$`, R`$\dfrac{1}{6}$`, R`$\dfrac{1}{4}$`],
  R`Seja $I$ a integral. Trocando $x$ por $-x$ e usando $\dfrac{1}{1+e^{-x}}=\dfrac{e^{x}}{1+e^{x}}$, obtém-se $I=\displaystyle\int_{-1}^{1}\dfrac{x^{2}e^{x}}{1+e^{x}}\,dx$. Somando as duas formas, $2I=\displaystyle\int_{-1}^{1}x^{2}\cdot\dfrac{1+e^{x}}{1+e^{x}}\,dx=\displaystyle\int_{-1}^{1}x^{2}\,dx=\dfrac{2}{3}$, logo $I=\dfrac{1}{3}$.`);

q("Integral Definida", "Soma de Riemann e logaritmo", "medio",
  R`Calcule $\lim_{n\to\infty}\left(\dfrac{1}{n+1}+\dfrac{1}{n+2}+\cdots+\dfrac{1}{2n}\right)$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$2\ln 2$`, R`$\dfrac{\ln 2}{2}$`, R`$\ln\dfrac{3}{2}$`],
  R`A soma é $\displaystyle\sum_{i=1}^{n}\dfrac{1}{n+i}=\displaystyle\sum_{i=1}^{n}\dfrac{1}{n}\cdot\dfrac{1}{1+\dfrac{i}{n}}$, soma de Riemann de $f(x)=\dfrac{1}{1+x}$ em $[0,1]$. O limite é $\displaystyle\int_{0}^{1}\dfrac{dx}{1+x}=\ln 2$.`);

// ===========================================================================
// 7. INTEGRAL INDEFINIDA
// ===========================================================================
q("Integral Indefinida", "Substituição simples com radical", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\dfrac{\cos x}{\sqrt{1+\operatorname{sen}x}}\,dx$.`,
  R`$2\sqrt{2}-2$`,
  [R`$\sqrt{2}-1$`, R`$2-\sqrt{2}$`, R`$2\sqrt{2}$`, R`$\sqrt{2}+1$`],
  R`Com $u=1+\operatorname{sen}x$ e $du=\cos x\,dx$, os limites passam de $1$ a $2$ e a integral vira $\displaystyle\int_{1}^{2}u^{-1/2}\,du=\left[2\sqrt{u}\right]_{1}^{2}=2\sqrt{2}-2$.`);

q("Integral Indefinida", "Teorema do Valor Médio para integrais", "medio",
  R`Determine o valor de $c$ garantido pelo Teorema do Valor Médio para integrais aplicado a $f(x)=\dfrac{1}{x^{2}}$ em $[1,3]$.`,
  R`$\sqrt{3}$`,
  [R`$\sqrt{2}$`, R`$\sqrt{5}$`, R`$\sqrt{6}$`, R`$2\sqrt{3}$`],
  R`O valor médio de $f$ é $\dfrac{1}{3-1}\displaystyle\int_{1}^{3}\dfrac{dx}{x^{2}}=\dfrac{1}{2}\left[-\dfrac{1}{x}\right]_{1}^{3}=\dfrac{1}{2}\left(1-\dfrac{1}{3}\right)=\dfrac{1}{3}$. O teorema garante $c\in(1,3)$ com $f(c)=\dfrac{1}{3}$, isto é $\dfrac{1}{c^{2}}=\dfrac{1}{3}$, logo $c=\sqrt{3}$.`);

q("Integral Indefinida", "Substituição para racionalizar o integrando", "dificil",
  R`Calcule $\displaystyle\int_{0}^{4}\dfrac{dx}{1+\sqrt{x}}$.`,
  R`$4-2\ln 3$`,
  [R`$2-2\ln 3$`, R`$4-\ln 3$`, R`$2\ln 3$`, R`$4+2\ln 3$`],
  R`Com $u=\sqrt{x}$, tem-se $x=u^{2}$ e $dx=2u\,du$, com $u$ indo de $0$ a $2$. A integral vira $\displaystyle\int_{0}^{2}\dfrac{2u}{1+u}\,du=2\displaystyle\int_{0}^{2}\left(1-\dfrac{1}{1+u}\right)du=2\left[u-\ln(1+u)\right]_{0}^{2}=4-2\ln 3$.`);

q("Integral Indefinida", "Substituição com potência", "medio",
  R`Calcule $\displaystyle\int_{0}^{1}x^{2}\sqrt{1+x^{3}}\,dx$.`,
  R`$\dfrac{2\left(2\sqrt{2}-1\right)}{9}$`,
  [R`$\dfrac{2\left(2\sqrt{2}-1\right)}{3}$`, R`$\dfrac{4\sqrt{2}-1}{9}$`, R`$\dfrac{2\left(\sqrt{2}-1\right)}{9}$`, R`$\dfrac{4\sqrt{2}}{9}$`],
  R`Com $u=1+x^{3}$ e $du=3x^{2}\,dx$, a integral vira $\dfrac{1}{3}\displaystyle\int_{1}^{2}\sqrt{u}\,du=\dfrac{1}{3}\cdot\dfrac{2}{3}\left[u^{3/2}\right]_{1}^{2}=\dfrac{2}{9}\left(2\sqrt{2}-1\right)$.`);

q("Integral Indefinida", "Primitiva com condição inicial", "medio",
  R`Seja $F$ a primitiva de $f(x)=\dfrac{2x}{x^{2}+1}$ que satisfaz $F(0)=3$. Calcule $F\!\left(\sqrt{e-1}\right)$.`,
  R`$4$`,
  [R`$2$`, R`$3$`, R`$5$`, R`$1$`],
  R`Como $\displaystyle\int\dfrac{2x}{x^{2}+1}\,dx=\ln\left(x^{2}+1\right)+C$, tem-se $F(x)=\ln\left(x^{2}+1\right)+C$ e $F(0)=\ln 1+C=C=3$. Então $F\!\left(\sqrt{e-1}\right)=\ln\left(e-1+1\right)+3=\ln e+3=4$.`);

q("Integral Indefinida", "Potência ímpar de tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi/4}\operatorname{tg}^{3}x\,dx$.`,
  R`$\dfrac{1-\ln 2}{2}$`,
  [R`$\dfrac{1+\ln 2}{2}$`, R`$\dfrac{\ln 2}{2}$`, R`$\dfrac{2-\ln 2}{2}$`, R`$\dfrac{1-2\ln 2}{2}$`],
  R`Escreva $\operatorname{tg}^{3}x=\operatorname{tg}x\left(\sec^{2}x-1\right)$. A primeira parcela integra por substituição $u=\operatorname{tg}x$ e a segunda é a tangente simples, dando $\displaystyle\int\operatorname{tg}^{3}x\,dx=\dfrac{\operatorname{tg}^{2}x}{2}+\ln\left|\cos x\right|+C$. Avaliando de $0$ a $\dfrac{\pi}{4}$: $\dfrac{1}{2}+\ln\dfrac{\sqrt{2}}{2}=\dfrac{1}{2}-\dfrac{\ln 2}{2}=\dfrac{1-\ln 2}{2}$.`);

// ===========================================================================
// 8. APLICAÇÕES DA INTEGRAL DEFINIDA
// ===========================================================================
q("Aplicações da Integral Definida", "Área entre seno e cosseno", "dificil",
  R`Determine a área da região limitada pelos gráficos de $y=\operatorname{sen}x$ e $y=\cos x$ com $0\leq x\leq\pi$.`,
  R`$2\sqrt{2}$`,
  [R`$\sqrt{2}$`, R`$\sqrt{2}-1$`, R`$2\sqrt{2}-1$`, R`$3\sqrt{2}$`],
  R`As curvas se cruzam em $x=\dfrac{\pi}{4}$, onde a ordem entre elas se inverte. A área é $\displaystyle\int_{0}^{\pi/4}\left(\cos x-\operatorname{sen}x\right)dx+\displaystyle\int_{\pi/4}^{\pi}\left(\operatorname{sen}x-\cos x\right)dx$. A primeira parcela vale $\left[\operatorname{sen}x+\cos x\right]_{0}^{\pi/4}=\sqrt{2}-1$ e a segunda $\left[-\cos x-\operatorname{sen}x\right]_{\pi/4}^{\pi}=1+\sqrt{2}$. A soma é $2\sqrt{2}$.`);

q("Aplicações da Integral Definida", "Área por integração em relação a y", "medio",
  R`Determine a área da região limitada pelas curvas $x=y^{2}$ e $x=y+2$.`,
  R`$\dfrac{9}{2}$`,
  [R`$\dfrac{7}{2}$`, R`$\dfrac{27}{2}$`, R`$\dfrac{9}{4}$`, R`$\dfrac{5}{2}$`],
  R`As curvas se cortam quando $y^{2}=y+2$, isto é $y=-1$ e $y=2$. Integrando em $y$ (o que evita partir a região em duas), a área é $\displaystyle\int_{-1}^{2}\left(y+2-y^{2}\right)dy=\left[\dfrac{y^{2}}{2}+2y-\dfrac{y^{3}}{3}\right]_{-1}^{2}=\dfrac{10}{3}-\left(-\dfrac{7}{6}\right)=\dfrac{9}{2}$.`);

q("Aplicações da Integral Definida", "Volume de revolução pelo método dos anéis", "medio",
  R`A região limitada por $y=x^{2}$ e $y=2x$ gira em torno do eixo $x$. Determine o volume do sólido gerado.`,
  R`$\dfrac{64\pi}{15}$`,
  [R`$\dfrac{32\pi}{15}$`, R`$\dfrac{16\pi}{15}$`, R`$\dfrac{64\pi}{5}$`, R`$\dfrac{32\pi}{5}$`],
  R`As curvas se cruzam em $x=0$ e $x=2$, e nesse intervalo $2x\geq x^{2}$. Pelo método dos anéis, $V=\pi\displaystyle\int_{0}^{2}\left[(2x)^{2}-\left(x^{2}\right)^{2}\right]dx=\pi\left[\dfrac{4x^{3}}{3}-\dfrac{x^{5}}{5}\right]_{0}^{2}=\pi\left(\dfrac{32}{3}-\dfrac{32}{5}\right)=\dfrac{64\pi}{15}$.`);

q("Aplicações da Integral Definida", "Volume por cascas cilíndricas", "dificil",
  R`A região sob o gráfico de $y=\operatorname{sen}\left(x^{2}\right)$, com $0\leq x\leq\sqrt{\pi}$, gira em torno do eixo $y$. Determine o volume do sólido gerado.`,
  R`$2\pi$`,
  [R`$\pi$`, R`$4\pi$`, R`$\pi^{2}$`, R`$\dfrac{\pi}{2}$`],
  R`Pelo método das cascas cilíndricas, $V=2\pi\displaystyle\int_{0}^{\sqrt{\pi}}x\operatorname{sen}\left(x^{2}\right)dx$ — escolha obrigatória aqui, pois a inversa de $\operatorname{sen}\left(x^{2}\right)$ não é elementar. Com $u=x^{2}$ e $du=2x\,dx$, isso vira $\pi\displaystyle\int_{0}^{\pi}\operatorname{sen}u\,du=\pi\left[-\cos u\right]_{0}^{\pi}=\pi(1+1)=2\pi$.`);

q("Aplicações da Integral Definida", "Comprimento de arco de curva algébrica", "dificil",
  R`Determine o comprimento do arco da curva $y=\dfrac{x^{3}}{3}+\dfrac{1}{4x}$ de $x=1$ a $x=2$.`,
  R`$\dfrac{59}{24}$`,
  [R`$\dfrac{53}{24}$`, R`$\dfrac{67}{24}$`, R`$\dfrac{59}{12}$`, R`$\dfrac{47}{24}$`],
  R`Temos $y'=x^{2}-\dfrac{1}{4x^{2}}$, logo $1+\left(y'\right)^{2}=x^{4}+\dfrac{1}{2}+\dfrac{1}{16x^{4}}=\left(x^{2}+\dfrac{1}{4x^{2}}\right)^{2}$ — o quadrado perfeito é o que torna a raiz tratável. Assim $L=\displaystyle\int_{1}^{2}\left(x^{2}+\dfrac{1}{4x^{2}}\right)dx=\left[\dfrac{x^{3}}{3}-\dfrac{1}{4x}\right]_{1}^{2}=\dfrac{61}{24}-\dfrac{2}{24}=\dfrac{59}{24}$.`);

q("Aplicações da Integral Definida", "Comprimento de arco com secante", "dificil",
  R`Determine o comprimento do arco da curva $y=\ln\left(\cos x\right)$ de $x=0$ a $x=\dfrac{\pi}{3}$.`,
  R`$\ln\left(2+\sqrt{3}\right)$`,
  [R`$\ln\left(1+\sqrt{3}\right)$`, R`$\ln\left(2-\sqrt{3}\right)$`, R`$\ln\left(3+\sqrt{2}\right)$`, R`$\ln\left(2+\sqrt{2}\right)$`],
  R`Como $y'=-\operatorname{tg}x$, vem $\sqrt{1+\left(y'\right)^{2}}=\sqrt{1+\operatorname{tg}^{2}x}=\sec x$, positiva no intervalo dado. Então $L=\displaystyle\int_{0}^{\pi/3}\sec x\,dx=\left[\ln\left|\sec x+\operatorname{tg}x\right|\right]_{0}^{\pi/3}=\ln\left(2+\sqrt{3}\right)-\ln 1=\ln\left(2+\sqrt{3}\right)$.`);

q("Aplicações da Integral Definida", "Volume em torno de uma reta vertical", "dificil",
  R`A região limitada por $y=\sqrt{x}$, $y=0$ e $x=4$ gira em torno da reta $x=4$. Determine o volume do sólido gerado.`,
  R`$\dfrac{256\pi}{15}$`,
  [R`$\dfrac{128\pi}{15}$`, R`$\dfrac{64\pi}{15}$`, R`$\dfrac{256\pi}{5}$`, R`$\dfrac{512\pi}{15}$`],
  R`Integrando em $y$, com $0\leq y\leq2$, a seção perpendicular ao eixo de rotação é um disco de raio $4-y^{2}$, pois a curva é $x=y^{2}$. Assim $V=\pi\displaystyle\int_{0}^{2}\left(4-y^{2}\right)^{2}dy=\pi\displaystyle\int_{0}^{2}\left(16-8y^{2}+y^{4}\right)dy=\pi\left(32-\dfrac{64}{3}+\dfrac{32}{5}\right)=\dfrac{256\pi}{15}$.`);

// ===========================================================================
// 9. FUNÇÃO INVERSA
// ===========================================================================
q("Função Inversa", "Teorema da função inversa", "medio",
  R`Seja $f(x)=x^{3}+2x+1$ e $g=f^{-1}$. Calcule $g'(4)$.`,
  R`$\dfrac{1}{5}$`,
  [R`$\dfrac{1}{14}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{50}$`, R`$\dfrac{1}{4}$`],
  R`Como $f(1)=1+2+1=4$, tem-se $g(4)=1$. O teorema da função inversa dá $g'(4)=\dfrac{1}{f'\left(g(4)\right)}=\dfrac{1}{f'(1)}$. De $f'(x)=3x^{2}+2$ vem $f'(1)=5$, logo $g'(4)=\dfrac{1}{5}$.`);

q("Função Inversa", "Derivadas das inversas trigonométricas", "dificil",
  R`Seja $h(x)=\arcsin\!\left(\dfrac{x}{2}\right)+\operatorname{arctg}\!\left(\dfrac{2}{x}\right)$. Calcule $h'(1)$.`,
  R`$\dfrac{5\sqrt{3}-6}{15}$`,
  [R`$\dfrac{5\sqrt{3}+6}{15}$`, R`$\dfrac{5\sqrt{3}-6}{3}$`, R`$\dfrac{\sqrt{3}-6}{15}$`, R`$\dfrac{5\sqrt{3}-2}{15}$`],
  R`Pela regra da cadeia, $\dfrac{d}{dx}\arcsin\dfrac{x}{2}=\dfrac{1/2}{\sqrt{1-\dfrac{x^{2}}{4}}}=\dfrac{1}{\sqrt{4-x^{2}}}$, que em $x=1$ vale $\dfrac{1}{\sqrt{3}}=\dfrac{\sqrt{3}}{3}$. Também $\dfrac{d}{dx}\operatorname{arctg}\dfrac{2}{x}=\dfrac{1}{1+\dfrac{4}{x^{2}}}\cdot\left(-\dfrac{2}{x^{2}}\right)=-\dfrac{2}{x^{2}+4}$, que em $x=1$ vale $-\dfrac{2}{5}$. Somando, $h'(1)=\dfrac{\sqrt{3}}{3}-\dfrac{2}{5}=\dfrac{5\sqrt{3}-6}{15}$.`);

q("Função Inversa", "Limite com logaritmo no infinito", "medio",
  R`Calcule $\lim_{x\to+\infty}x\left[\ln(x+3)-\ln x\right]$.`,
  R`$3$`,
  [R`$0$`, R`$1$`, R`$9$`, R`$6$`],
  R`Pela propriedade do logaritmo, $\ln(x+3)-\ln x=\ln\left(1+\dfrac{3}{x}\right)$. Pondo $t=\dfrac{3}{x}\to0^{+}$, a expressão vira $\dfrac{3}{t}\ln(1+t)=3\cdot\dfrac{\ln(1+t)}{t}$, e como $\dfrac{\ln(1+t)}{t}\to1$, o limite é $3$.`);

q("Função Inversa", "Máximo de potência com expoente real", "medio",
  R`Determine o valor máximo de $f(x)=x^{1/x}$ para $x>0$.`,
  R`$e^{1/e}$`,
  [R`$e^{e}$`, R`$e^{1/2}$`, R`$e^{2}$`, R`$2^{1/2}$`],
  R`Como o logaritmo é crescente, basta maximizar $g(x)=\ln f(x)=\dfrac{\ln x}{x}$. Derivando, $g'(x)=\dfrac{1-\ln x}{x^{2}}$, positiva para $x<e$ e negativa para $x>e$, de modo que $x=e$ é o ponto de máximo. O valor máximo é $f(e)=e^{1/e}$.`);

q("Função Inversa", "Simplificação na derivada do arco-tangente", "dificil",
  R`Seja $f(x)=\operatorname{arctg}\!\left(\dfrac{1-x}{1+x}\right)$, com $x>-1$. Calcule $f'(2)$.`,
  R`$-\dfrac{1}{5}$`,
  [R`$-\dfrac{1}{2}$`, R`$\dfrac{1}{5}$`, R`$-\dfrac{2}{5}$`, R`$-\dfrac{1}{9}$`],
  R`Com $u=\dfrac{1-x}{1+x}$, tem-se $u'=\dfrac{-(1+x)-(1-x)}{(1+x)^{2}}=\dfrac{-2}{(1+x)^{2}}$ e $1+u^{2}=\dfrac{(1+x)^{2}+(1-x)^{2}}{(1+x)^{2}}=\dfrac{2\left(1+x^{2}\right)}{(1+x)^{2}}$. Logo $f'(x)=\dfrac{u'}{1+u^{2}}=-\dfrac{1}{1+x^{2}}$, e $f'(2)=-\dfrac{1}{5}$.`);

q("Função Inversa", "Derivada de logaritmo de um quociente", "medio",
  R`Seja $f(x)=\ln\left|\dfrac{x-1}{x+1}\right|$. Calcule $f'(3)$.`,
  R`$\dfrac{1}{4}$`,
  [R`$\dfrac{1}{8}$`, R`$\dfrac{1}{2}$`, R`$-\dfrac{1}{4}$`, R`$\dfrac{1}{16}$`],
  R`Usando $\ln\left|\dfrac{x-1}{x+1}\right|=\ln\left|x-1\right|-\ln\left|x+1\right|$, vem $f'(x)=\dfrac{1}{x-1}-\dfrac{1}{x+1}=\dfrac{2}{x^{2}-1}$. Em $x=3$, $f'(3)=\dfrac{2}{8}=\dfrac{1}{4}$.`);

// ===========================================================================
// 10. TÉCNICAS DE INTEGRAÇÃO
// ===========================================================================
q("Técnicas de Integração", "Integração por partes cíclica", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\pi}e^{x}\operatorname{sen}x\,dx$.`,
  R`$\dfrac{e^{\pi}+1}{2}$`,
  [R`$\dfrac{e^{\pi}-1}{2}$`, R`$e^{\pi}+1$`, R`$\dfrac{e^{\pi}}{2}$`, R`$\dfrac{1-e^{\pi}}{2}$`],
  R`Integrando por partes duas vezes, a integral reaparece do outro lado da igualdade e pode ser isolada, dando $\displaystyle\int e^{x}\operatorname{sen}x\,dx=\dfrac{e^{x}\left(\operatorname{sen}x-\cos x\right)}{2}+C$. Avaliando de $0$ a $\pi$: $\dfrac{e^{\pi}(0+1)}{2}-\dfrac{1\cdot(0-1)}{2}=\dfrac{e^{\pi}+1}{2}$.`);

q("Técnicas de Integração", "Frações parciais com fatores lineares", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x}{(x+1)(x+2)}\,dx$.`,
  R`$\ln\dfrac{9}{8}$`,
  [R`$\ln\dfrac{4}{3}$`, R`$\ln\dfrac{3}{2}$`, R`$\ln\dfrac{8}{9}$`, R`$\ln\dfrac{16}{9}$`],
  R`Decompondo em frações parciais, $\dfrac{x}{(x+1)(x+2)}=-\dfrac{1}{x+1}+\dfrac{2}{x+2}$. Então a integral vale $\left[-\ln(x+1)+2\ln(x+2)\right]_{0}^{1}=\left(-\ln 2+2\ln 3\right)-\left(0+2\ln 2\right)=2\ln 3-3\ln 2=\ln\dfrac{9}{8}$.`);

q("Técnicas de Integração", "Substituição trigonométrica com tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{\sqrt{3}}\dfrac{dx}{\left(1+x^{2}\right)^{2}}$.`,
  R`$\dfrac{\pi}{6}+\dfrac{\sqrt{3}}{8}$`,
  [R`$\dfrac{\pi}{6}-\dfrac{\sqrt{3}}{8}$`, R`$\dfrac{\pi}{3}+\dfrac{\sqrt{3}}{8}$`, R`$\dfrac{\pi}{6}+\dfrac{\sqrt{3}}{4}$`, R`$\dfrac{\pi}{3}+\dfrac{\sqrt{3}}{4}$`],
  R`Com $x=\operatorname{tg}\theta$ e $dx=\sec^{2}\theta\,d\theta$, o integrando vira $\dfrac{\sec^{2}\theta}{\sec^{4}\theta}=\cos^{2}\theta$, com $\theta$ indo de $0$ a $\dfrac{\pi}{3}$. Usando $\cos^{2}\theta=\dfrac{1+\cos 2\theta}{2}$, a integral é $\left[\dfrac{\theta}{2}+\dfrac{\operatorname{sen}2\theta}{4}\right]_{0}^{\pi/3}=\dfrac{\pi}{6}+\dfrac{1}{4}\cdot\dfrac{\sqrt{3}}{2}=\dfrac{\pi}{6}+\dfrac{\sqrt{3}}{8}$.`);

q("Técnicas de Integração", "Substituição trigonométrica com seno", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{x^{2}}{\sqrt{4-x^{2}}}\,dx$.`,
  R`$\dfrac{\pi}{3}-\dfrac{\sqrt{3}}{2}$`,
  [R`$\dfrac{\pi}{6}-\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{\pi}{3}+\dfrac{\sqrt{3}}{2}$`, R`$\dfrac{\pi}{3}-\dfrac{\sqrt{3}}{4}$`, R`$\dfrac{2\pi}{3}-\dfrac{\sqrt{3}}{2}$`],
  R`Com $x=2\operatorname{sen}\theta$ e $dx=2\cos\theta\,d\theta$, tem-se $\sqrt{4-x^{2}}=2\cos\theta$ e $\theta$ varia de $0$ a $\dfrac{\pi}{6}$. A integral vira $\displaystyle\int_{0}^{\pi/6}4\operatorname{sen}^{2}\theta\,d\theta=\left[2\theta-\operatorname{sen}2\theta\right]_{0}^{\pi/6}=\dfrac{\pi}{3}-\dfrac{\sqrt{3}}{2}$.`);

q("Técnicas de Integração", "Frações parciais com fator quadrático irredutível", "dificil",
  R`Calcule $\displaystyle\int_{1}^{2}\dfrac{dx}{x\left(x^{2}+1\right)}$.`,
  R`$\dfrac{1}{2}\ln\dfrac{8}{5}$`,
  [R`$\dfrac{1}{2}\ln\dfrac{5}{8}$`, R`$\ln\dfrac{8}{5}$`, R`$\dfrac{1}{2}\ln\dfrac{4}{5}$`, R`$\dfrac{1}{2}\ln\dfrac{16}{5}$`],
  R`Decompondo, $\dfrac{1}{x\left(x^{2}+1\right)}=\dfrac{1}{x}-\dfrac{x}{x^{2}+1}$. A integral vale $\left[\ln x-\dfrac{1}{2}\ln\left(x^{2}+1\right)\right]_{1}^{2}=\left(\ln 2-\dfrac{1}{2}\ln 5\right)-\left(0-\dfrac{1}{2}\ln 2\right)=\dfrac{3}{2}\ln 2-\dfrac{1}{2}\ln 5=\dfrac{1}{2}\ln\dfrac{8}{5}$.`);

q("Técnicas de Integração", "Integração por partes com logaritmo", "medio",
  R`Calcule $\displaystyle\int_{1}^{e}x^{2}\ln x\,dx$.`,
  R`$\dfrac{2e^{3}+1}{9}$`,
  [R`$\dfrac{2e^{3}-1}{9}$`, R`$\dfrac{e^{3}+1}{9}$`, R`$\dfrac{2e^{3}+1}{3}$`, R`$\dfrac{e^{3}-1}{3}$`],
  R`Tome $u=\ln x$ e $dv=x^{2}\,dx$, de modo que $du=\dfrac{dx}{x}$ e $v=\dfrac{x^{3}}{3}$. Então a integral é $\left[\dfrac{x^{3}\ln x}{3}\right]_{1}^{e}-\dfrac{1}{3}\displaystyle\int_{1}^{e}x^{2}\,dx=\dfrac{e^{3}}{3}-\dfrac{e^{3}-1}{9}=\dfrac{2e^{3}+1}{9}$.`);

q("Técnicas de Integração", "Potências de seno e cosseno", "medio",
  R`Calcule $\displaystyle\int_{0}^{\pi/2}\operatorname{sen}^{3}x\cos^{2}x\,dx$.`,
  R`$\dfrac{2}{15}$`,
  [R`$\dfrac{1}{15}$`, R`$\dfrac{4}{15}$`, R`$\dfrac{1}{5}$`, R`$\dfrac{8}{15}$`],
  R`Como a potência do seno é ímpar, separe um fator: $\operatorname{sen}^{3}x\cos^{2}x=\left(1-\cos^{2}x\right)\cos^{2}x\operatorname{sen}x$. Com $u=\cos x$ e $du=-\operatorname{sen}x\,dx$, a integral vira $\displaystyle\int_{0}^{1}\left(u^{2}-u^{4}\right)du=\dfrac{1}{3}-\dfrac{1}{5}=\dfrac{2}{15}$.`);

q("Técnicas de Integração", "Integração por partes com arco-tangente", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\operatorname{arctg}x\,dx$.`,
  R`$\dfrac{\pi}{4}-\dfrac{\ln 2}{2}$`,
  [R`$\dfrac{\pi}{4}+\dfrac{\ln 2}{2}$`, R`$\dfrac{\pi}{2}-\dfrac{\ln 2}{2}$`, R`$\dfrac{\pi}{4}-\ln 2$`, R`$\dfrac{\pi}{4}-\dfrac{\ln 2}{4}$`],
  R`Tome $u=\operatorname{arctg}x$ e $dv=dx$, o truque padrão para integrar uma função inversa isolada. Então $\displaystyle\int_{0}^{1}\operatorname{arctg}x\,dx=\left[x\operatorname{arctg}x\right]_{0}^{1}-\displaystyle\int_{0}^{1}\dfrac{x}{1+x^{2}}\,dx=\dfrac{\pi}{4}-\dfrac{1}{2}\left[\ln\left(1+x^{2}\right)\right]_{0}^{1}=\dfrac{\pi}{4}-\dfrac{\ln 2}{2}$.`);

// ===========================================================================
// 11. INTEGRAL IMPRÓPRIA
// ===========================================================================
q("Integral Imprópria", "Intervalo infinito com frações parciais", "medio",
  R`Calcule $\displaystyle\int_{1}^{+\infty}\dfrac{dx}{x(x+1)}$.`,
  R`$\ln 2$`,
  [R`$\ln 3$`, R`$2\ln 2$`, R`$\dfrac{\ln 2}{2}$`, R`$\ln\dfrac{3}{2}$`],
  R`Como $\dfrac{1}{x(x+1)}=\dfrac{1}{x}-\dfrac{1}{x+1}$, para $b>1$ vale $\displaystyle\int_{1}^{b}\dfrac{dx}{x(x+1)}=\left[\ln\dfrac{x}{x+1}\right]_{1}^{b}=\ln\dfrac{b}{b+1}-\ln\dfrac{1}{2}$. Quando $b\to+\infty$ o primeiro termo tende a $0$, e a integral converge para $\ln 2$.`);

q("Integral Imprópria", "Intervalo infinito com logaritmo", "dificil",
  R`Calcule $\displaystyle\int_{1}^{+\infty}\dfrac{\ln x}{x^{2}}\,dx$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$4$`, R`$3$`],
  R`Integrando por partes com $u=\ln x$ e $dv=x^{-2}dx$: $\displaystyle\int_{1}^{b}\dfrac{\ln x}{x^{2}}\,dx=\left[-\dfrac{\ln x}{x}\right]_{1}^{b}+\displaystyle\int_{1}^{b}\dfrac{dx}{x^{2}}=-\dfrac{\ln b}{b}+1-\dfrac{1}{b}$. Como $\dfrac{\ln b}{b}\to0$, a integral converge e vale $1$.`);

q("Integral Imprópria", "Singularidade no extremo do intervalo", "dificil",
  R`Calcule $\displaystyle\int_{0}^{1}\dfrac{\ln x}{\sqrt{x}}\,dx$.`,
  R`$-4$`,
  [R`$-2$`, R`$-1$`, R`$2$`, R`$4$`],
  R`A integral é imprópria em $0$, onde o integrando não é limitado. Por partes com $u=\ln x$ e $dv=x^{-1/2}dx$: $\displaystyle\int_{a}^{1}\dfrac{\ln x}{\sqrt{x}}\,dx=\left[2\sqrt{x}\ln x\right]_{a}^{1}-\displaystyle\int_{a}^{1}\dfrac{2}{\sqrt{x}}\,dx=-2\sqrt{a}\ln a-\left(4-4\sqrt{a}\right)$. Como $\sqrt{a}\ln a\to0$ quando $a\to0^{+}$, o valor é $-4$.`);

q("Integral Imprópria", "Logaritmo no denominador", "dificil",
  R`Calcule $\displaystyle\int_{2}^{+\infty}\dfrac{dx}{x\left(\ln x\right)^{2}}$.`,
  R`$\dfrac{1}{\ln 2}$`,
  [R`$\ln 2$`, R`$\dfrac{1}{2\ln 2}$`, R`$\dfrac{2}{\ln 2}$`, R`$\dfrac{1}{\ln 3}$`],
  R`Com $u=\ln x$ e $du=\dfrac{dx}{x}$, a integral vira $\displaystyle\int_{\ln 2}^{+\infty}\dfrac{du}{u^{2}}=\left[-\dfrac{1}{u}\right]_{\ln 2}^{+\infty}=0+\dfrac{1}{\ln 2}$. O expoente $2$ é o que garante a convergência: com expoente $1$ a integral divergiria.`);

q("Integral Imprópria", "Integral em toda a reta", "dificil",
  R`Calcule $\displaystyle\int_{-\infty}^{+\infty}\dfrac{dx}{x^{2}+4x+13}$.`,
  R`$\dfrac{\pi}{3}$`,
  [R`$\dfrac{\pi}{2}$`, R`$\dfrac{\pi}{9}$`, R`$\dfrac{\pi}{6}$`, R`$\pi$`],
  R`Completando o quadrado, $x^{2}+4x+13=(x+2)^{2}+9$, de modo que uma primitiva é $\dfrac{1}{3}\operatorname{arctg}\dfrac{x+2}{3}$. Como $\operatorname{arctg}t\to\pm\dfrac{\pi}{2}$ quando $t\to\pm\infty$, a integral vale $\dfrac{1}{3}\left(\dfrac{\pi}{2}+\dfrac{\pi}{2}\right)=\dfrac{\pi}{3}$.`);

q("Integral Imprópria", "Singularidade interior ao intervalo", "dificil",
  R`Calcule $\displaystyle\int_{0}^{3}\dfrac{dx}{\sqrt[3]{(x-1)^{2}}}$.`,
  R`$3\left(1+\sqrt[3]{2}\right)$`,
  [R`$3\sqrt[3]{2}$`, R`$3\left(\sqrt[3]{2}-1\right)$`, R`$1+\sqrt[3]{2}$`, R`$6\left(1+\sqrt[3]{2}\right)$`],
  R`O integrando explode em $x=1$, que é interior ao intervalo, então a integral precisa ser partida: $\displaystyle\int_{0}^{1}(x-1)^{-2/3}dx+\displaystyle\int_{1}^{3}(x-1)^{-2/3}dx$. Como $\displaystyle\int(x-1)^{-2/3}dx=3\sqrt[3]{x-1}$, a primeira parcela vale $0-3(-1)=3$ e a segunda $3\sqrt[3]{2}-0$. O total é $3+3\sqrt[3]{2}=3\left(1+\sqrt[3]{2}\right)$.`);

// ===========================================================================
// 12. DERIVADAS (tópico avulso do banco)
// ===========================================================================
q("Derivadas", "Limite que é uma derivada disfarçada", "medio",
  R`Calcule $\lim_{h\to0}\dfrac{\sqrt[3]{27+h}-3}{h}$.`,
  R`$\dfrac{1}{27}$`,
  [R`$\dfrac{1}{9}$`, R`$\dfrac{1}{3}$`, R`$\dfrac{1}{81}$`, R`$\dfrac{1}{6}$`],
  R`O limite é, por definição, a derivada de $f(t)=\sqrt[3]{t}$ em $t=27$. Como $f'(t)=\dfrac{1}{3}t^{-2/3}$ e $27^{2/3}=9$, o valor é $\dfrac{1}{3\cdot9}=\dfrac{1}{27}$.`);

q("Derivadas", "Derivação logarítmica com base variável", "dificil",
  R`Seja $f(x)=\left(x^{2}+1\right)^{x}$. Calcule $f'(1)$.`,
  R`$2+2\ln 2$`,
  [R`$1+\ln 2$`, R`$2\ln 2$`, R`$2+\ln 2$`, R`$4+2\ln 2$`],
  R`Como base e expoente variam, tome logaritmos: $\ln f(x)=x\ln\left(x^{2}+1\right)$, de onde $\dfrac{f'(x)}{f(x)}=\ln\left(x^{2}+1\right)+\dfrac{2x^{2}}{x^{2}+1}$. Em $x=1$ isso vale $\ln 2+1$ e, como $f(1)=2$, vem $f'(1)=2\left(1+\ln 2\right)=2+2\ln 2$.`);

// ===========================================================================
// 13. TEOREMA FUNDAMENTAL DO CÁLCULO
// ===========================================================================
q("Teorema Fundamental do Cálculo", "Limite superior composto", "medio",
  R`Seja $F(x)=\displaystyle\int_{0}^{x^{2}}\sqrt{1+t^{3}}\,dt$. Calcule $F'(2)$.`,
  R`$4\sqrt{65}$`,
  [R`$\sqrt{65}$`, R`$2\sqrt{65}$`, R`$4\sqrt{5}$`, R`$16\sqrt{65}$`],
  R`Pelo Teorema Fundamental do Cálculo combinado com a regra da cadeia, $F'(x)=\sqrt{1+\left(x^{2}\right)^{3}}\cdot2x=2x\sqrt{1+x^{6}}$. Em $x=2$: $F'(2)=4\sqrt{1+64}=4\sqrt{65}$.`);

q("Teorema Fundamental do Cálculo", "Os dois limites de integração variáveis", "dificil",
  R`Seja $G(x)=\displaystyle\int_{x}^{x^{2}}\dfrac{dt}{\ln t}$, definida para $x>1$. Calcule $G'(e)$.`,
  R`$e-1$`,
  [R`$e$`, R`$2e-1$`, R`$e+1$`, R`$2e$`],
  R`Aplicando o TFC com regra da cadeia nos dois limites, $G'(x)=\dfrac{2x}{\ln\left(x^{2}\right)}-\dfrac{1}{\ln x}=\dfrac{2x}{2\ln x}-\dfrac{1}{\ln x}=\dfrac{x-1}{\ln x}$. Em $x=e$, com $\ln e=1$, resulta $G'(e)=e-1$.`);

q("Teorema Fundamental do Cálculo", "Derivação implícita com funções integrais", "dificil",
  R`As funções $x$ e $y$ se relacionam por $\displaystyle\int_{0}^{y}e^{t^{2}}dt+\displaystyle\int_{0}^{x}\cos\left(t^{2}\right)dt=0$, com $y=0$ quando $x=0$. Calcule $\dfrac{dy}{dx}$ em $x=0$.`,
  R`$-1$`,
  [R`$0$`, R`$1$`, R`$2$`, R`$-2$`],
  R`Derivando os dois lados em relação a $x$ e usando o TFC em cada integral (a primeira com regra da cadeia, pois o limite superior é $y$), $e^{y^{2}}\dfrac{dy}{dx}+\cos\left(x^{2}\right)=0$. Em $x=0$, onde $y=0$, isso vira $1\cdot\dfrac{dy}{dx}+1=0$, logo $\dfrac{dy}{dx}=-1$.`);

q("Teorema Fundamental do Cálculo", "L'Hospital com função integral", "dificil",
  R`Calcule $\lim_{x\to0}\dfrac{1}{x^{3}}\displaystyle\int_{0}^{x}\operatorname{sen}\left(t^{2}\right)dt$.`,
  R`$\dfrac{1}{3}$`,
  [R`$\dfrac{1}{2}$`, R`$\dfrac{1}{6}$`, R`$\dfrac{1}{4}$`, R`$\dfrac{2}{3}$`],
  R`É uma indeterminação $\tfrac{0}{0}$. Derivando o numerador pelo TFC e o denominador pela regra da potência, o limite vira $\lim_{x\to0}\dfrac{\operatorname{sen}\left(x^{2}\right)}{3x^{2}}$. Como $\operatorname{sen}u\sim u$ quando $u\to0$, o valor é $\dfrac{1}{3}$.`);

q("Teorema Fundamental do Cálculo", "Mínimo de uma função definida por integral", "medio",
  R`Seja $F(x)=\displaystyle\int_{0}^{x}\left(t^{2}-4\right)dt$, com $x\in[0,3]$. Determine o valor mínimo de $F$.`,
  R`$-\dfrac{16}{3}$`,
  [R`$-\dfrac{8}{3}$`, R`$-\dfrac{20}{3}$`, R`$-\dfrac{4}{3}$`, R`$-\dfrac{32}{3}$`],
  R`Pelo TFC, $F'(x)=x^{2}-4$, negativa em $[0,2)$ e positiva em $(2,3]$, de modo que o mínimo ocorre em $x=2$. Calculando explicitamente, $F(x)=\dfrac{x^{3}}{3}-4x$, logo $F(2)=\dfrac{8}{3}-8=-\dfrac{16}{3}$.`);

// ===========================================================================
// 14. PROBLEMAS DE OTIMIZAÇÃO
// ===========================================================================
q("Problemas de otimização", "Lata cilíndrica de área mínima", "medio",
  R`Uma lata cilíndrica fechada deve ter volume $16\pi$ cm³. Determine o raio que minimiza a área total de sua superfície.`,
  R`$2$ cm`,
  [R`$1$ cm`, R`$3$ cm`, R`$4$ cm`, R`$8$ cm`],
  R`De $V=\pi r^{2}h=16\pi$ vem $h=\dfrac{16}{r^{2}}$. A área total é $A(r)=2\pi r^{2}+2\pi rh=2\pi r^{2}+\dfrac{32\pi}{r}$. Então $A'(r)=4\pi r-\dfrac{32\pi}{r^{2}}$, que se anula quando $r^{3}=8$, isto é $r=2$. Como $A''(r)=4\pi+\dfrac{64\pi}{r^{3}}>0$, o ponto é de mínimo.`);

q("Problemas de otimização", "Distância mínima de um ponto a uma parábola", "medio",
  R`Determine a menor distância entre o ponto $(4,0)$ e a parábola $y^{2}=2x$.`,
  R`$\sqrt{7}$`,
  [R`$\sqrt{5}$`, R`$\sqrt{6}$`, R`$2\sqrt{2}$`, R`$\sqrt{10}$`],
  R`Para um ponto $(x,y)$ da parábola, $d^{2}=(x-4)^{2}+y^{2}=(x-4)^{2}+2x$, com $x\geq0$; minimizar $d$ equivale a minimizar $d^{2}$. Derivando, $2(x-4)+2=0$ dá $x=3$, e a derivada segunda é $2>0$. Logo $d^{2}=1+6=7$ e $d=\sqrt{7}$.`);

q("Problemas de otimização", "Tempo mínimo remando e caminhando", "dificil",
  R`Um bote está a $3$ km de um ponto $A$ da praia, medidos perpendicularmente à costa (suposta reta), e precisa chegar ao ponto $B$, situado $8$ km adiante sobre a costa. Remando a $4$ km/h e caminhando a $5$ km/h, determine o menor tempo possível de percurso.`,
  R`$\dfrac{41}{20}$ h`,
  [R`$\dfrac{39}{20}$ h`, R`$\dfrac{43}{20}$ h`, R`$\dfrac{21}{10}$ h`, R`$\dfrac{37}{20}$ h`],
  R`Se o bote atraca a $x$ km de $A$, com $0\leq x\leq8$, o tempo total é $T(x)=\dfrac{\sqrt{9+x^{2}}}{4}+\dfrac{8-x}{5}$. De $T'(x)=\dfrac{x}{4\sqrt{9+x^{2}}}-\dfrac{1}{5}=0$ vem $5x=4\sqrt{9+x^{2}}$, isto é $25x^{2}=144+16x^{2}$, logo $x=4$. Então $T(4)=\dfrac{5}{4}+\dfrac{4}{5}=\dfrac{41}{20}$ h.`);

q("Problemas de otimização", "Cilindro inscrito em uma esfera", "dificil",
  R`Determine o volume máximo de um cilindro circular reto inscrito em uma esfera de raio $3$.`,
  R`$12\sqrt{3}\,\pi$`,
  [R`$6\sqrt{3}\,\pi$`, R`$18\sqrt{3}\,\pi$`, R`$12\sqrt{2}\,\pi$`, R`$9\sqrt{3}\,\pi$`],
  R`Se o cilindro tem raio $r$ e altura $h$, o teorema de Pitágoras na seção meridiana dá $r^{2}+\dfrac{h^{2}}{4}=9$. O volume é $V(h)=\pi r^{2}h=\pi\left(9-\dfrac{h^{2}}{4}\right)h$. De $V'(h)=\pi\left(9-\dfrac{3h^{2}}{4}\right)=0$ vem $h^{2}=12$, isto é $h=2\sqrt{3}$, e então $r^{2}=6$. Logo $V=\pi\cdot6\cdot2\sqrt{3}=12\sqrt{3}\,\pi$.`);

q("Problemas de otimização", "Janela normanda de área máxima", "dificil",
  R`Uma janela tem a forma de um retângulo encimado por um semicírculo, e seu perímetro total é $12$ m. Determine o raio do semicírculo que maximiza a área da janela.`,
  R`$\dfrac{12}{4+\pi}$ m`,
  [R`$\dfrac{12}{2+\pi}$ m`, R`$\dfrac{6}{4+\pi}$ m`, R`$\dfrac{24}{4+\pi}$ m`, R`$\dfrac{12}{4-\pi}$ m`],
  R`Sejam $r$ o raio do semicírculo e $h$ a altura do retângulo, cuja base mede $2r$. O perímetro é $2r+2h+\pi r=12$, logo $h=\dfrac{12-2r-\pi r}{2}$. A área é $A=2rh+\dfrac{\pi r^{2}}{2}=12r-2r^{2}-\dfrac{\pi r^{2}}{2}$. De $A'(r)=12-4r-\pi r=0$ vem $r=\dfrac{12}{4+\pi}$, e $A''(r)=-4-\pi<0$ confirma o máximo.`);

// ===========================================================================
// 15. FUNÇÕES CONTÍNUAS
// ===========================================================================
q("Funções Contínuas", "Parâmetro para continuidade", "medio",
  R`Seja $f(x)=\dfrac{x^{2}-a^{2}}{x-a}$ para $x\neq a$ e $f(a)=3a-4$. Determine $a$ para que $f$ seja contínua em $x=a$.`,
  R`$4$`,
  [R`$2$`, R`$-4$`, R`$1$`, R`$-2$`],
  R`Para $x\neq a$ vale $\dfrac{x^{2}-a^{2}}{x-a}=x+a$, cujo limite quando $x\to a$ é $2a$. A continuidade exige $2a=3a-4$, isto é $a=4$.`);

q("Funções Contínuas", "Descontinuidades de uma função composta", "medio",
  R`Sejam $f(x)=\dfrac{1}{x-2}$ e $g(x)=x^{2}-1$. Determine o número de pontos de descontinuidade de $f\circ g$.`,
  R`$2$`,
  [R`$0$`, R`$1$`, R`$3$`, R`$4$`],
  R`Tem-se $(f\circ g)(x)=\dfrac{1}{\left(x^{2}-1\right)-2}=\dfrac{1}{x^{2}-3}$, que deixa de estar definida exatamente quando $x^{2}=3$. São os dois pontos $x=\sqrt{3}$ e $x=-\sqrt{3}$.`);

q("Funções Contínuas", "Parâmetro com indeterminação e radical", "medio",
  R`Seja $f(x)=\dfrac{\sqrt{x+k}-2}{x-1}$ para $x\neq1$ e $f(1)=\dfrac{1}{4}$, com $k>0$. Determine $k$ para que $f$ seja contínua em $x=1$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$5$`],
  R`Para que o limite em $x=1$ exista e seja finito, o numerador precisa se anular ali: $\sqrt{1+k}=2$, isto é $k=3$. Com esse valor, racionalizando, $\dfrac{\sqrt{x+3}-2}{x-1}=\dfrac{1}{\sqrt{x+3}+2}\to\dfrac{1}{4}$, que coincide com $f(1)$.`);

q("Funções Contínuas", "Maior intervalo de continuidade", "dificil",
  R`Determine o maior intervalo contendo $x=0$ em que $f(x)=\dfrac{\sqrt{4-x^{2}}}{\ln(x+2)}$ é contínua.`,
  R`$(-1,2]$`,
  [R`$(-2,2]$`, R`$[-2,2]$`, R`$(-1,2)$`, R`$(-2,-1)$`],
  R`O radicando exige $-2\leq x\leq2$; o logaritmo exige $x>-2$; e o denominador se anula quando $x+2=1$, isto é $x=-1$, ponto que precisa ser excluído. Restam os intervalos $(-2,-1)$ e $(-1,2]$, e o que contém $x=0$ é $(-1,2]$.`);

q("Funções Contínuas", "Função contínua definida em três ramos", "medio",
  R`Seja $f(x)=2$ para $x\leq-1$, $f(x)=ax+b$ para $-1<x<3$ e $f(x)=-2$ para $x\geq3$. Determine $a+b$ para que $f$ seja contínua em $\mathbb{R}$.`,
  R`$0$`,
  [R`$-1$`, R`$1$`, R`$2$`, R`$-2$`],
  R`A continuidade em $x=-1$ dá $-a+b=2$ e a continuidade em $x=3$ dá $3a+b=-2$. Subtraindo as equações, $4a=-4$, logo $a=-1$ e $b=1$. Portanto $a+b=0$.`);

// ===========================================================================
// 16. ANÁLISE DE GRÁFICOS
// ===========================================================================
q("Análise de Gráficos", "Assíntota oblíqua de função racional", "medio",
  R`O gráfico de $f(x)=\dfrac{2x^{2}-3x+1}{x-2}$ tem uma assíntota oblíqua de equação $y=ax+b$. Determine $b$.`,
  R`$1$`,
  [R`$-1$`, R`$2$`, R`$3$`, R`$0$`],
  R`Efetuando a divisão, $2x^{2}-3x+1=(x-2)(2x+1)+3$, logo $f(x)=2x+1+\dfrac{3}{x-2}$. Como $\dfrac{3}{x-2}\to0$ quando $x\to\pm\infty$, a assíntota é $y=2x+1$, e $b=1$.`);

q("Análise de Gráficos", "Sinal da derivada e extremos locais", "dificil",
  R`Seja $f$ derivável em $\mathbb{R}$ com $f'(x)=x^{2}(x-1)^{3}(x-2)$. Determine o número de pontos de máximo local de $f$.`,
  R`$1$`,
  [R`$0$`, R`$2$`, R`$3$`, R`$4$`],
  R`O fator $x^{2}$ tem multiplicidade par e não troca o sinal de $f'$, então $x=0$ não é extremo. Para $0<x<1$, $(x-1)^{3}<0$ e $(x-2)<0$, logo $f'>0$; para $1<x<2$, $(x-1)^{3}>0$ e $(x-2)<0$, logo $f'<0$; e para $x>2$, $f'>0$. Assim $f$ tem máximo local apenas em $x=1$, e mínimo local em $x=2$.`);

q("Análise de Gráficos", "Contagem de assíntotas", "medio",
  R`Determine a soma do número de assíntotas verticais com o número de assíntotas horizontais do gráfico de $f(x)=\dfrac{x^{2}}{x^{2}-4}$.`,
  R`$3$`,
  [R`$2$`, R`$4$`, R`$1$`, R`$5$`],
  R`O denominador se anula em $x=2$ e $x=-2$, e o numerador não se anula nesses pontos: são duas assíntotas verticais. Como $f(x)\to1$ quando $x\to\pm\infty$, há uma única assíntota horizontal, $y=1$. A soma é $3$.`);

q("Análise de Gráficos", "Assíntota oblíqua com denominador quadrático", "dificil",
  R`O gráfico de $f(x)=\dfrac{x^{3}}{(x-1)^{2}}$ tem uma assíntota oblíqua de equação $y=ax+b$. Determine $a+b$.`,
  R`$3$`,
  [R`$1$`, R`$2$`, R`$4$`, R`$0$`],
  R`Efetuando a divisão de $x^{3}$ por $x^{2}-2x+1$, obtém-se $x^{3}=\left(x^{2}-2x+1\right)(x+2)+(3x-2)$, isto é $f(x)=x+2+\dfrac{3x-2}{(x-1)^{2}}$. A fração tende a $0$ quando $x\to\pm\infty$, então a assíntota é $y=x+2$, com $a=1$ e $b=2$, e $a+b=3$.`);

// ===========================================================================
// Montagem final: distribui as letras e escreve o JSON.
// ===========================================================================
const letras = sequenciaDeLetras(brutas.length);
const questoes = brutas.map((b, i) => {
  const certa = letras[i];
  const alternativas = {};
  let k = 0;
  for (const l of LETRAS) alternativas[l] = l === certa ? b.correta : b.distratores[k++];
  return {
    materia: MATERIA,
    topico: b.topico,
    subtopico: b.subtopico,
    dificuldade: b.dificuldade,
    enunciado: b.enunciado,
    alternativas,
    gabarito: certa,
    resolucao: b.resolucao,
    instituicao: null,
    ano: null,
    tikz_code: null,
  };
});

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = resolve(aqui, "..", "calculo1_lote4.json");
writeFileSync(destino, JSON.stringify(questoes, null, 2), "utf8");

const porTopico = new Map();
const porLetra = new Map();
const porDif = new Map();
for (const q of questoes) {
  porTopico.set(q.topico, (porTopico.get(q.topico) || 0) + 1);
  porLetra.set(q.gabarito, (porLetra.get(q.gabarito) || 0) + 1);
  porDif.set(q.dificuldade, (porDif.get(q.dificuldade) || 0) + 1);
}
console.log(`${questoes.length} questões escritas em ${destino}`);
console.log("por tópico:");
[...porTopico.entries()].forEach(([t, n]) => console.log(`  ${String(n).padStart(3)}  ${t}`));
console.log("por dificuldade:", Object.fromEntries(porDif));
console.log("por letra:", Object.fromEntries([...porLetra.entries()].sort()));
