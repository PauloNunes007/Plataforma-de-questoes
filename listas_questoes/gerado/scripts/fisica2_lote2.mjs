// Gerador do lote 2 de Física II — questões autorais, nível universitário,
// estilo Halliday-Resnick-Walker / Young & Freedman. Foco nos tópicos com
// menos cobertura (Coulomb, campo elétrico, corrente, circuitos CC) e
// reforço em Gauss, potencial, capacitores e campo magnético.
// Rode: node listas_questoes/gerado/scripts/fisica2_lote2.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Física II";

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
    "A Lei de Coulomb",
    "Força entre duas cargas puntiformes",
    "facil",
    R`Duas cargas puntiformes, $q_1=+3{,}0\ \mu$C e $q_2=-4{,}0\ \mu$C, estão separadas por $30$ cm no vácuo. Adotando $k=9{,}0\times 10^{9}$ N·m²/C², determine o módulo da força eletrostática entre elas.`,
    {
      a: R`$0{,}12$ N`,
      b: R`$1{,}2$ N`,
      c: R`$3{,}6$ N`,
      d: R`$12$ N`,
      e: R`$0{,}36$ N`,
    },
    "b",
    R`Pela lei de Coulomb, $F=k\dfrac{\left|q_1q_2\right|}{r^2}=9{,}0\times 10^{9}\cdot\dfrac{\left(3{,}0\times 10^{-6}\right)\left(4{,}0\times 10^{-6}\right)}{\left(0{,}30\right)^2}=\dfrac{9{,}0\times 10^{9}\cdot 1{,}2\times 10^{-11}}{0{,}090}=\dfrac{0{,}108}{0{,}090}=1{,}2$ N, atrativa por serem cargas de sinais opostos.`
  ),
  q(
    "A Lei de Coulomb",
    "Princípio da superposição",
    "medio",
    R`Três cargas iguais a $+2{,}0\ \mu$C ocupam os vértices de um triângulo equilátero de lado $10$ cm. Adotando $k=9{,}0\times 10^{9}$ N·m²/C², determine o módulo da força elétrica resultante sobre uma delas.`,
    {
      a: R`$3{,}1$ N`,
      b: R`$3{,}6$ N`,
      c: R`$7{,}2$ N`,
      d: R`$6{,}2$ N`,
      e: R`$10{,}8$ N`,
    },
    "d",
    R`Cada uma das outras cargas exerce $F=k\dfrac{q^2}{r^2}=9{,}0\times 10^{9}\cdot\dfrac{\left(2{,}0\times 10^{-6}\right)^2}{\left(0{,}10\right)^2}=3{,}6$ N. As duas forças formam entre si $60^{\circ}$, logo a resultante é $R=2F\cos 30^{\circ}=2(3{,}6)(0{,}866)\approx 6{,}2$ N, dirigida ao longo da bissetriz, para fora do triângulo.`
  ),
  q(
    "A Lei de Coulomb",
    "Posição de equilíbrio eletrostático",
    "medio",
    R`Duas cargas positivas, $Q_1=9q$ e $Q_2=q$, estão fixas sobre uma reta, separadas por $40$ cm. Determine a que distância de $Q_1$ deve ser colocada uma terceira carga para que a força resultante sobre ela seja nula.`,
    {
      a: R`$0{,}10$ m`,
      b: R`$0{,}15$ m`,
      c: R`$0{,}20$ m`,
      d: R`$0{,}36$ m`,
      e: R`$0{,}30$ m`,
    },
    "e",
    R`O ponto de equilíbrio fica entre as cargas. Sendo $x$ a distância a $Q_1$, exige-se $\dfrac{9q}{x^2}=\dfrac{q}{(0{,}40-x)^2}$. Extraindo a raiz quadrada, $\dfrac{3}{x}=\dfrac{1}{0{,}40-x}$, ou seja, $3(0{,}40-x)=x\Rightarrow 1{,}2=4x\Rightarrow x=0{,}30$ m.`
  ),
  q(
    "O Campo Elétrico",
    "Campo nulo de duas cargas",
    "medio",
    R`Uma carga $q_1=+8{,}0\ \mu$C está em $x=0$ e uma carga $q_2=-2{,}0\ \mu$C está em $x=0{,}60$ m. Determine a coordenada $x$ do ponto do eixo em que o campo elétrico resultante é nulo.`,
    {
      a: R`$0{,}40$ m`,
      b: R`$0{,}90$ m`,
      c: R`$1{,}2$ m`,
      d: R`$1{,}8$ m`,
      e: R`$0{,}60$ m`,
    },
    "c",
    R`Cargas de sinais opostos só têm campo nulo fora do segmento, do lado da carga de menor módulo, isto é, $x>0{,}60$ m. A condição é $\dfrac{8{,}0}{x^2}=\dfrac{2{,}0}{(x-0{,}60)^2}$, e extraindo a raiz, $\dfrac{2}{x}=\dfrac{1}{x-0{,}60}$, ou $2(x-0{,}60)=x\Rightarrow x=1{,}2$ m.`
  ),
  q(
    "O Campo Elétrico",
    "Movimento de partícula carregada em campo uniforme",
    "dificil",
    R`Um elétron entra paralelamente às placas de um capacitor, com velocidade $2{,}0\times 10^{6}$ m/s, em uma região de campo uniforme de $100$ N/C perpendicular a essa velocidade. As placas têm $4{,}0$ cm de comprimento. Usando $e=1{,}6\times 10^{-19}$ C e $m=9{,}1\times 10^{-31}$ kg, determine o desvio vertical do elétron ao sair da região.`,
    {
      a: R`$0{,}35$ mm`,
      b: R`$1{,}8$ mm`,
      c: R`$7{,}0$ mm`,
      d: R`$35$ mm`,
      e: R`$3{,}5$ mm`,
    },
    "e",
    R`O movimento é análogo ao de um projétil. O tempo dentro das placas é $t=\dfrac{L}{v}=\dfrac{0{,}040}{2{,}0\times 10^{6}}=2{,}0\times 10^{-8}$ s. A aceleração transversal é $a=\dfrac{eE}{m}=\dfrac{1{,}6\times 10^{-19}\cdot 100}{9{,}1\times 10^{-31}}\approx 1{,}76\times 10^{13}$ m/s². Então $y=\dfrac12at^2=\dfrac12\left(1{,}76\times 10^{13}\right)\left(4{,}0\times 10^{-16}\right)\approx 3{,}5\times 10^{-3}$ m $=3{,}5$ mm.`
  ),
  q(
    "O Campo Elétrico",
    "Torque sobre dipolo elétrico",
    "medio",
    R`Um dipolo elétrico é formado por cargas $\pm 2{,}0$ nC separadas por $2{,}0$ cm e está imerso em um campo uniforme de $5{,}0\times 10^{5}$ N/C. Determine o torque máximo sobre o dipolo.`,
    {
      a: R`$2{,}0\times 10^{-5}$ N·m`,
      b: R`$4{,}0\times 10^{-5}$ N·m`,
      c: R`$1{,}0\times 10^{-5}$ N·m`,
      d: R`$2{,}0\times 10^{-6}$ N·m`,
      e: R`$8{,}0\times 10^{-5}$ N·m`,
    },
    "a",
    R`O momento de dipolo é $p=qd=\left(2{,}0\times 10^{-9}\right)\left(2{,}0\times 10^{-2}\right)=4{,}0\times 10^{-11}$ C·m. Como $\tau=pE\operatorname{sen}\theta$, o máximo ocorre em $\theta=90^{\circ}$: $\tau_{max}=pE=\left(4{,}0\times 10^{-11}\right)\left(5{,}0\times 10^{5}\right)=2{,}0\times 10^{-5}$ N·m.`
  ),
  q(
    "O Campo Elétrico",
    "Campo no eixo de um anel carregado",
    "dificil",
    R`Um anel fino de raio $0{,}10$ m tem carga total $5{,}0$ nC uniformemente distribuída. Determine o módulo do campo elétrico em um ponto do eixo situado a $0{,}10$ m do centro. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$8{,}0\times 10^{2}$ N/C`,
      b: R`$1{,}6\times 10^{3}$ N/C`,
      c: R`$2{,}2\times 10^{3}$ N/C`,
      d: R`$3{,}2\times 10^{3}$ N/C`,
      e: R`$4{,}5\times 10^{3}$ N/C`,
    },
    "b",
    R`Por simetria só sobrevive a componente axial: $E=\dfrac{kQx}{\left(x^2+R^2\right)^{3/2}}$. Com $x=R=0{,}10$ m, $x^2+R^2=0{,}020$ m² e $\left(0{,}020\right)^{3/2}\approx 2{,}83\times 10^{-3}$. O numerador é $9{,}0\times 10^{9}\cdot 5{,}0\times 10^{-9}\cdot 0{,}10=4{,}5$. Logo $E\approx\dfrac{4{,}5}{2{,}83\times 10^{-3}}\approx 1{,}6\times 10^{3}$ N/C.`
  ),
  q(
    "A Lei de Gauss",
    "Esfera condutora carregada",
    "facil",
    R`Uma esfera condutora de raio $10$ cm tem carga $6{,}0\ \mu$C uniformemente distribuída em sua superfície. Determine o módulo do campo elétrico em um ponto a $20$ cm do centro. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$6{,}75\times 10^{5}$ N/C`,
      b: R`$2{,}7\times 10^{6}$ N/C`,
      c: R`$5{,}4\times 10^{6}$ N/C`,
      d: R`$1{,}35\times 10^{6}$ N/C`,
      e: R`$0$`,
    },
    "d",
    R`Fora de uma distribuição esférica, a lei de Gauss mostra que o campo é o de uma carga puntiforme no centro: $E=\dfrac{kQ}{r^2}=\dfrac{9{,}0\times 10^{9}\cdot 6{,}0\times 10^{-6}}{\left(0{,}20\right)^2}=\dfrac{5{,}4\times 10^{4}}{0{,}040}=1{,}35\times 10^{6}$ N/C.`
  ),
  q(
    "A Lei de Gauss",
    "Simetria cilíndrica: fio infinito",
    "facil",
    R`Um fio retilíneo muito longo tem densidade linear de carga $\lambda=5{,}0\ \mu$C/m. Determine o módulo do campo elétrico a $10$ cm do fio. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$4{,}5\times 10^{5}$ N/C`,
      b: R`$9{,}0\times 10^{4}$ N/C`,
      c: R`$9{,}0\times 10^{5}$ N/C`,
      d: R`$1{,}8\times 10^{6}$ N/C`,
      e: R`$4{,}5\times 10^{6}$ N/C`,
    },
    "c",
    R`Aplicando a lei de Gauss a um cilindro coaxial, $E=\dfrac{\lambda}{2\pi\varepsilon_0 r}=\dfrac{2k\lambda}{r}$. Substituindo, $E=\dfrac{2\left(9{,}0\times 10^{9}\right)\left(5{,}0\times 10^{-6}\right)}{0{,}10}=\dfrac{9{,}0\times 10^{4}}{0{,}10}=9{,}0\times 10^{5}$ N/C.`
  ),
  q(
    "A Lei de Gauss",
    "Campo interno de esfera isolante",
    "medio",
    R`Uma esfera isolante de raio $20$ cm tem carga $8{,}0$ nC uniformemente distribuída em todo o seu volume. Determine o módulo do campo elétrico a $10$ cm do centro. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$450$ N/C`,
      b: R`$1800$ N/C`,
      c: R`$3600$ N/C`,
      d: R`$0$`,
      e: R`$900$ N/C`,
    },
    "e",
    R`A superfície gaussiana de raio $r<R$ envolve apenas a fração $\dfrac{r^3}{R^3}$ da carga, o que leva a $E=\dfrac{kQr}{R^3}$. Substituindo: $E=\dfrac{9{,}0\times 10^{9}\cdot 8{,}0\times 10^{-9}\cdot 0{,}10}{\left(0{,}20\right)^3}=\dfrac{7{,}2}{8{,}0\times 10^{-3}}=900$ N/C.`
  ),
  q(
    "A Lei de Gauss",
    "Fluxo através de superfície fechada",
    "medio",
    R`Uma superfície fechada envolve duas cargas puntiformes, de $+5{,}0$ nC e $-3{,}0$ nC. Adotando $\varepsilon_0=8{,}85\times 10^{-12}$ C²/(N·m²), determine o fluxo elétrico total através dessa superfície.`,
    {
      a: R`$226$ N·m²/C`,
      b: R`$339$ N·m²/C`,
      c: R`$565$ N·m²/C`,
      d: R`$904$ N·m²/C`,
      e: R`$0$`,
    },
    "a",
    R`A lei de Gauss depende apenas da carga interna líquida: $q_{int}=5{,}0-3{,}0=2{,}0$ nC. Assim $\Phi=\dfrac{q_{int}}{\varepsilon_0}=\dfrac{2{,}0\times 10^{-9}}{8{,}85\times 10^{-12}}\approx 226$ N·m²/C, independentemente da forma da superfície ou da posição das cargas dentro dela.`
  ),
  q(
    "Potencial Elétrico",
    "Potencial de cargas puntiformes",
    "medio",
    R`Em um ponto $P$, uma carga $q_1=+4{,}0\ \mu$C está a $20$ cm e uma carga $q_2=-1{,}0\ \mu$C está a $10$ cm. Determine o potencial elétrico resultante em $P$. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$4{,}5\times 10^{4}$ V`,
      b: R`$9{,}0\times 10^{4}$ V`,
      c: R`$1{,}8\times 10^{5}$ V`,
      d: R`$2{,}7\times 10^{5}$ V`,
      e: R`$0$`,
    },
    "b",
    R`O potencial é escalar e se soma algebricamente: $V=k\left(\dfrac{q_1}{r_1}+\dfrac{q_2}{r_2}\right)=9{,}0\times 10^{9}\left(\dfrac{4{,}0\times 10^{-6}}{0{,}20}-\dfrac{1{,}0\times 10^{-6}}{0{,}10}\right)=9{,}0\times 10^{9}\left(2{,}0\times 10^{-5}-1{,}0\times 10^{-5}\right)=9{,}0\times 10^{4}$ V.`
  ),
  q(
    "Potencial Elétrico",
    "Trabalho e diferença de potencial",
    "medio",
    R`Uma carga de $2{,}0\ \mu$C é transportada, sem variação de energia cinética, de um ponto $A$ com potencial $100$ V até um ponto $B$ com potencial $-50$ V. Determine o trabalho realizado pelo agente externo.`,
    {
      a: R`$+3{,}0\times 10^{-4}$ J`,
      b: R`$-1{,}0\times 10^{-4}$ J`,
      c: R`$-3{,}0\times 10^{-4}$ J`,
      d: R`$+1{,}0\times 10^{-4}$ J`,
      e: R`$-3{,}0\times 10^{-3}$ J`,
    },
    "c",
    R`Sem variação de energia cinética, o trabalho externo iguala a variação de energia potencial: $W_{ext}=\Delta U=q\left(V_B-V_A\right)=\left(2{,}0\times 10^{-6}\right)\left(-50-100\right)=-3{,}0\times 10^{-4}$ J. O sinal negativo indica que o campo elétrico é que realiza trabalho positivo no processo.`
  ),
  q(
    "Potencial Elétrico",
    "Relação entre campo e potencial",
    "dificil",
    R`O potencial elétrico em uma região é $V(x,y,z)=3x^2y-2z$, com $V$ em volts e as coordenadas em metros. Determine o módulo do campo elétrico no ponto $(1,2,0)$.`,
    {
      a: R`$12$ V/m`,
      b: R`$13$ V/m`,
      c: R`$\sqrt{148}$ V/m`,
      d: R`$\sqrt{153}$ V/m`,
      e: R`$\sqrt{157}$ V/m`,
    },
    "e",
    R`O campo é o oposto do gradiente: $\vec{E}=-\nabla V=\left(-6xy,\ -3x^2,\ 2\right)$. Em $(1,2,0)$: $\vec{E}=(-12,\ -3,\ 2)$ V/m. Seu módulo é $\sqrt{144+9+4}=\sqrt{157}\approx 12{,}5$ V/m.`
  ),
  q(
    "Potencial Elétrico",
    "Energia potencial de um sistema de cargas",
    "medio",
    R`Três cargas iguais a $+1{,}0\ \mu$C são fixadas nos vértices de um triângulo equilátero de lado $10$ cm. Determine a energia potencial elétrica do sistema. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$0{,}09$ J`,
      b: R`$0{,}18$ J`,
      c: R`$0{,}27$ J`,
      d: R`$0{,}54$ J`,
      e: R`$0{,}90$ J`,
    },
    "c",
    R`Há três pares de cargas, cada um contribuindo com $\dfrac{kq^2}{a}$. Assim $U=3\dfrac{kq^2}{a}=3\cdot\dfrac{9{,}0\times 10^{9}\left(1{,}0\times 10^{-6}\right)^2}{0{,}10}=3\cdot\dfrac{9{,}0\times 10^{-3}}{0{,}10}=0{,}27$ J.`
  ),
  q(
    "Capacitores e Capacitância",
    "Associação em série",
    "medio",
    R`Dois capacitores, de $3{,}0\ \mu$F e $6{,}0\ \mu$F, são ligados em série a uma fonte de $12$ V. Determine a diferença de potencial no capacitor de $3{,}0\ \mu$F.`,
    {
      a: R`$2{,}0$ V`,
      b: R`$4{,}0$ V`,
      c: R`$6{,}0$ V`,
      d: R`$8{,}0$ V`,
      e: R`$12$ V`,
    },
    "d",
    R`Em série, $\dfrac{1}{C_{eq}}=\dfrac13+\dfrac16=\dfrac12$, logo $C_{eq}=2{,}0\ \mu$F e a carga comum é $Q=C_{eq}V=24\ \mu$C. No capacitor de $3{,}0\ \mu$F: $V_1=\dfrac{Q}{C_1}=\dfrac{24}{3{,}0}=8{,}0$ V (e $V_2=4{,}0$ V, somando os $12$ V da fonte).`
  ),
  q(
    "Capacitores e Capacitância",
    "Capacitor de placas paralelas com dielétrico",
    "medio",
    R`Um capacitor de placas paralelas tem área $0{,}020$ m² e separação $1{,}0$ mm, com um dielétrico de constante $\kappa=3{,}0$ preenchendo o espaço entre as placas. Adotando $\varepsilon_0=8{,}85\times 10^{-12}$ F/m, determine sua capacitância.`,
    {
      a: R`$5{,}3\times 10^{-12}$ F`,
      b: R`$1{,}8\times 10^{-10}$ F`,
      c: R`$2{,}7\times 10^{-10}$ F`,
      d: R`$5{,}3\times 10^{-10}$ F`,
      e: R`$1{,}6\times 10^{-9}$ F`,
    },
    "d",
    R`Com dielétrico, $C=\dfrac{\kappa\varepsilon_0A}{d}=\dfrac{3{,}0\left(8{,}85\times 10^{-12}\right)\left(0{,}020\right)}{1{,}0\times 10^{-3}}=\dfrac{5{,}31\times 10^{-13}}{1{,}0\times 10^{-3}}=5{,}3\times 10^{-10}$ F, ou seja, cerca de $0{,}53$ nF.`
  ),
  q(
    "Capacitores e Capacitância",
    "Energia armazenada e redistribuição de carga",
    "dificil",
    R`Um capacitor de $10\ \mu$F é carregado sob $100$ V e, em seguida, desligado da fonte e ligado em paralelo a outro capacitor idêntico, inicialmente descarregado. Determine a energia dissipada no processo.`,
    {
      a: R`$12{,}5$ mJ`,
      b: R`$25$ mJ`,
      c: R`$50$ mJ`,
      d: R`$100$ mJ`,
      e: R`$0$`,
    },
    "b",
    R`A energia inicial é $U_i=\dfrac12CV^2=\dfrac12\left(10\times 10^{-6}\right)\left(100\right)^2=0{,}050$ J. A carga $Q=1{,}0\times 10^{-3}$ C se conserva e passa a se distribuir por $C_{eq}=20\ \mu$F, resultando em $V_f=50$ V. Então $U_f=\dfrac12\left(20\times 10^{-6}\right)\left(50\right)^2=0{,}025$ J. A energia dissipada (por efeito Joule nos fios) é $0{,}050-0{,}025=25$ mJ.`
  ),
  q(
    "Corrente e Resistência Elétricas",
    "Resistividade e resistência de um fio",
    "facil",
    R`Um fio de cobre de $20$ m de comprimento tem seção reta de $2{,}0$ mm². Sabendo que a resistividade do cobre é $1{,}7\times 10^{-8}\ \Omega\cdot$m, determine sua resistência.`,
    {
      a: R`$0{,}017\ \Omega$`,
      b: R`$0{,}34\ \Omega$`,
      c: R`$0{,}17\ \Omega$`,
      d: R`$1{,}7\ \Omega$`,
      e: R`$3{,}4\ \Omega$`,
    },
    "c",
    R`Pela segunda lei de Ohm, $R=\rho\dfrac{L}{A}$. Convertendo a área para $2{,}0\times 10^{-6}$ m²: $R=\dfrac{1{,}7\times 10^{-8}\cdot 20}{2{,}0\times 10^{-6}}=\dfrac{3{,}4\times 10^{-7}}{2{,}0\times 10^{-6}}=0{,}17\ \Omega$.`
  ),
  q(
    "Corrente e Resistência Elétricas",
    "Densidade de corrente",
    "facil",
    R`Uma corrente de $6{,}0$ A percorre um condutor de seção reta $3{,}0$ mm². Determine o módulo da densidade de corrente.`,
    {
      a: R`$5{,}0\times 10^{5}$ A/m²`,
      b: R`$2{,}0\times 10^{3}$ A/m²`,
      c: R`$1{,}8\times 10^{6}$ A/m²`,
      d: R`$2{,}0\times 10^{6}$ A/m²`,
      e: R`$2{,}0\times 10^{9}$ A/m²`,
    },
    "d",
    R`Para corrente uniformemente distribuída, $J=\dfrac{I}{A}=\dfrac{6{,}0}{3{,}0\times 10^{-6}}=2{,}0\times 10^{6}$ A/m².`
  ),
  q(
    "Corrente e Resistência Elétricas",
    "Velocidade de deriva",
    "medio",
    R`Um fio de cobre com seção reta de $2{,}0$ mm² conduz $10$ A. Sabendo que a densidade de portadores é $n=8{,}5\times 10^{28}$ elétrons/m³ e que $e=1{,}6\times 10^{-19}$ C, determine a velocidade de deriva dos elétrons.`,
    {
      a: R`$1{,}8\times 10^{-4}$ m/s`,
      b: R`$7{,}4\times 10^{-4}$ m/s`,
      c: R`$3{,}7\times 10^{-3}$ m/s`,
      d: R`$2{,}7\times 10^{3}$ m/s`,
      e: R`$3{,}7\times 10^{-4}$ m/s`,
    },
    "e",
    R`De $I=nqAv_d$ vem $v_d=\dfrac{I}{nqA}$. Substituindo: $v_d=\dfrac{10}{\left(8{,}5\times 10^{28}\right)\left(1{,}6\times 10^{-19}\right)\left(2{,}0\times 10^{-6}\right)}=\dfrac{10}{2{,}72\times 10^{4}}\approx 3{,}7\times 10^{-4}$ m/s. É uma velocidade muito pequena, o que ilustra que o sinal elétrico não se propaga pelo deslocamento dos portadores.`
  ),
  q(
    "Corrente e Resistência Elétricas",
    "Potência e resistência",
    "facil",
    R`Um chuveiro elétrico de $4400$ W opera em $220$ V. Determine sua resistência elétrica em funcionamento.`,
    {
      a: R`$11\ \Omega$`,
      b: R`$5{,}5\ \Omega$`,
      c: R`$20\ \Omega$`,
      d: R`$22\ \Omega$`,
      e: R`$44\ \Omega$`,
    },
    "a",
    R`De $P=\dfrac{V^2}{R}$ vem $R=\dfrac{V^2}{P}=\dfrac{\left(220\right)^2}{4400}=\dfrac{48400}{4400}=11\ \Omega$. A corrente correspondente é $I=\dfrac{P}{V}=20$ A.`
  ),
  q(
    "Circuitos de Corrente Contínua",
    "Associação série-paralelo",
    "medio",
    R`Uma fonte ideal de $24$ V alimenta um resistor $R_1=4{,}0\ \Omega$ em série com a associação em paralelo de $R_2=6{,}0\ \Omega$ e $R_3=12\ \Omega$. Determine a corrente que atravessa $R_3$.`,
    {
      a: R`$0{,}50$ A`,
      b: R`$1{,}0$ A`,
      c: R`$1{,}5$ A`,
      d: R`$2{,}0$ A`,
      e: R`$3{,}0$ A`,
    },
    "b",
    R`A associação paralela vale $\dfrac{6\cdot 12}{6+12}=4{,}0\ \Omega$, logo $R_{eq}=4{,}0+4{,}0=8{,}0\ \Omega$ e a corrente total é $I=\dfrac{24}{8{,}0}=3{,}0$ A. A tensão sobre o paralelo é $3{,}0\cdot 4{,}0=12$ V, de onde $I_3=\dfrac{12}{12}=1{,}0$ A (e $I_2=2{,}0$ A).`
  ),
  q(
    "Circuitos de Corrente Contínua",
    "Fem e resistência interna",
    "facil",
    R`Uma bateria de fem $12$ V e resistência interna $0{,}50\ \Omega$ alimenta um resistor externo de $5{,}5\ \Omega$. Determine a tensão nos terminais da bateria.`,
    {
      a: R`$1{,}0$ V`,
      b: R`$6{,}0$ V`,
      c: R`$10$ V`,
      d: R`$11$ V`,
      e: R`$12$ V`,
    },
    "d",
    R`A corrente é $I=\dfrac{\varepsilon}{R+r}=\dfrac{12}{5{,}5+0{,}50}=2{,}0$ A. A tensão nos terminais é $U=\varepsilon-rI=12-\left(0{,}50\right)\left(2{,}0\right)=11$ V.`
  ),
  q(
    "Circuitos de Corrente Contínua",
    "Circuito RC em carga",
    "medio",
    R`Em um circuito RC série, um capacitor de $5{,}0\ \mu$F descarregado é ligado por meio de um resistor de $2{,}0$ M$\Omega$ a uma fonte de $10$ V. Determine a carga do capacitor após $10$ s.`,
    {
      a: R`$5{,}0\ \mu$C`,
      b: R`$18\ \mu$C`,
      c: R`$25\ \mu$C`,
      d: R`$32\ \mu$C`,
      e: R`$50\ \mu$C`,
    },
    "d",
    R`A constante de tempo é $\tau=RC=\left(2{,}0\times 10^{6}\right)\left(5{,}0\times 10^{-6}\right)=10$ s e a carga final seria $Q_{max}=C\varepsilon=50\ \mu$C. Como $Q(t)=Q_{max}\left(1-e^{-t/\tau}\right)$, em $t=\tau$: $Q=50\left(1-e^{-1}\right)\approx 50(0{,}632)\approx 32\ \mu$C.`
  ),
  q(
    "Circuitos de Corrente Contínua",
    "Leis de Kirchhoff em circuito de duas malhas",
    "dificil",
    R`Entre os nós $A$ e $B$ há três ramos em paralelo: (i) uma fem de $12$ V em série com $2{,}0\ \Omega$; (ii) uma fem de $6{,}0$ V em série com $3{,}0\ \Omega$; (iii) um resistor de $6{,}0\ \Omega$. Os polos positivos das duas fontes estão voltados para $A$. Determine a corrente que atravessa o resistor de $6{,}0\ \Omega$.`,
    {
      a: R`$\dfrac{2}{3}$ A`,
      b: R`$1$ A`,
      c: R`$\dfrac{4}{3}$ A`,
      d: R`$2$ A`,
      e: R`$\dfrac{8}{3}$ A`,
    },
    "c",
    R`Chame $V=V_A-V_B$ e aplique a lei dos nós em $A$: $\dfrac{12-V}{2}+\dfrac{6-V}{3}=\dfrac{V}{6}$. Multiplicando por $6$: $36-3V+12-2V=V$, ou seja, $48=6V\Rightarrow V=8{,}0$ V. A corrente no resistor de $6{,}0\ \Omega$ é $\dfrac{8{,}0}{6{,}0}=\dfrac43$ A. Conferindo: o ramo (i) entrega $\dfrac{12-8}{2}=2$ A e o ramo (ii) recebe $\dfrac{8-6}{3}=\dfrac23$ A, e $2-\dfrac23=\dfrac43$ A.`
  ),
  q(
    "O Campo Magnético",
    "Força magnética sobre carga em movimento",
    "facil",
    R`Uma carga de $2{,}0\ \mu$C move-se a $3{,}0\times 10^{5}$ m/s perpendicularmente a um campo magnético uniforme de $0{,}40$ T. Determine o módulo da força magnética sobre a carga.`,
    {
      a: R`$0{,}24$ N`,
      b: R`$0{,}024$ N`,
      c: R`$0{,}12$ N`,
      d: R`$0{,}48$ N`,
      e: R`$2{,}4$ N`,
    },
    "a",
    R`Como $\vec{v}\perp\vec{B}$, vale $F=qvB=\left(2{,}0\times 10^{-6}\right)\left(3{,}0\times 10^{5}\right)\left(0{,}40\right)=0{,}24$ N, com direção perpendicular ao plano formado por $\vec{v}$ e $\vec{B}$.`
  ),
  q(
    "O Campo Magnético",
    "Raio da trajetória circular",
    "medio",
    R`Um próton ($m=1{,}67\times 10^{-27}$ kg, $q=1{,}6\times 10^{-19}$ C) entra perpendicularmente em um campo magnético uniforme de $0{,}50$ T com velocidade $2{,}0\times 10^{6}$ m/s. Determine o raio de sua trajetória circular.`,
    {
      a: R`$1{,}0$ cm`,
      b: R`$2{,}1$ cm`,
      c: R`$8{,}4$ cm`,
      d: R`$42$ cm`,
      e: R`$4{,}2$ cm`,
    },
    "e",
    R`A força magnética é a resultante centrípeta: $qvB=\dfrac{mv^2}{r}$, logo $r=\dfrac{mv}{qB}=\dfrac{\left(1{,}67\times 10^{-27}\right)\left(2{,}0\times 10^{6}\right)}{\left(1{,}6\times 10^{-19}\right)\left(0{,}50\right)}=\dfrac{3{,}34\times 10^{-21}}{8{,}0\times 10^{-20}}\approx 0{,}042$ m $=4{,}2$ cm.`
  ),
  q(
    "O Campo Magnético",
    "Campo de um fio retilíneo longo",
    "facil",
    R`Determine o módulo do campo magnético a $5{,}0$ cm de um fio retilíneo muito longo percorrido por corrente de $10$ A. Use $\mu_0=4\pi\times 10^{-7}$ T·m/A.`,
    {
      a: R`$4{,}0\times 10^{-6}$ T`,
      b: R`$2{,}0\times 10^{-5}$ T`,
      c: R`$4{,}0\times 10^{-5}$ T`,
      d: R`$8{,}0\times 10^{-5}$ T`,
      e: R`$1{,}0\times 10^{-4}$ T`,
    },
    "c",
    R`Pela lei de Ampère, $B=\dfrac{\mu_0I}{2\pi r}=\dfrac{\left(2\times 10^{-7}\right)\left(10\right)}{0{,}050}=\dfrac{2{,}0\times 10^{-6}}{0{,}050}=4{,}0\times 10^{-5}$ T. As linhas de campo são circunferências concêntricas ao fio.`
  ),
  q(
    "O Campo Magnético",
    "Campo no interior de um solenoide",
    "medio",
    R`Um solenoide longo tem $2000$ espiras por metro e é percorrido por corrente de $3{,}0$ A. Determine o módulo do campo magnético em seu interior. Use $\mu_0=4\pi\times 10^{-7}$ T·m/A.`,
    {
      a: R`$7{,}5\times 10^{-4}$ T`,
      b: R`$2{,}4\times 10^{-3}$ T`,
      c: R`$3{,}8\times 10^{-3}$ T`,
      d: R`$7{,}5\times 10^{-3}$ T`,
      e: R`$1{,}5\times 10^{-2}$ T`,
    },
    "d",
    R`No interior de um solenoide longo o campo é uniforme e vale $B=\mu_0nI=\left(4\pi\times 10^{-7}\right)\left(2000\right)\left(3{,}0\right)\approx 7{,}5\times 10^{-3}$ T.`
  ),
  q(
    "O Campo Magnético",
    "Torque sobre espira percorrida por corrente",
    "medio",
    R`Uma bobina plana de $50$ espiras, área $0{,}010$ m², conduz corrente de $2{,}0$ A em um campo magnético uniforme de $0{,}30$ T. Determine o torque máximo sobre a bobina.`,
    {
      a: R`$0{,}03$ N·m`,
      b: R`$0{,}30$ N·m`,
      c: R`$0{,}15$ N·m`,
      d: R`$0{,}60$ N·m`,
      e: R`$3{,}0$ N·m`,
    },
    "b",
    R`O momento de dipolo magnético é $\mu=NIA=50\left(2{,}0\right)\left(0{,}010\right)=1{,}0$ A·m². Como $\tau=\mu B\operatorname{sen}\theta$, o máximo (com o plano da bobina paralelo ao campo) é $\tau_{max}=\mu B=1{,}0\left(0{,}30\right)=0{,}30$ N·m.`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "fisica2_lote2.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
