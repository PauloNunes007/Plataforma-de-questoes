// Gerador do lote 2 de Física I — questões autorais, nível universitário,
// estilo Halliday-Resnick-Walker / Knight. Foco nos tópicos com pouca
// cobertura no banco (vetores, terceira lei, momento, energia, trabalho,
// rotação, gravitação, oscilações). Predominam problemas de conta.
// Rode: node listas_questoes/gerado/scripts/fisica1_lote2.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Física I";

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
    "Vetores e Sistemas de Coordenadas",
    "Produto vetorial",
    "medio",
    R`Dados $\vec{A}=2\hat{\imath}-\hat{\jmath}+3\hat{k}$ e $\vec{B}=\hat{\imath}+2\hat{\jmath}-\hat{k}$, determine $\vec{A}\times\vec{B}$.`,
    {
      a: R`$(5,-5,5)$`,
      b: R`$(-5,5,5)$`,
      c: R`$(-5,-5,5)$`,
      d: R`$(5,5,-5)$`,
      e: R`$(-5,5,-5)$`,
    },
    "b",
    R`Pelo determinante simbólico, a componente $x$ é $A_yB_z-A_zB_y=(-1)(-1)-(3)(2)=1-6=-5$; a componente $y$ é $A_zB_x-A_xB_z=(3)(1)-(2)(-1)=3+2=5$; a componente $z$ é $A_xB_y-A_yB_x=(2)(2)-(-1)(1)=4+1=5$. Logo $\vec{A}\times\vec{B}=(-5,5,5)$.`
  ),
  q(
    "Vetores e Sistemas de Coordenadas",
    "Decomposição em componentes e resultante",
    "medio",
    R`Sobre um corpo atuam duas forças coplanares: $\vec{F}_1$, de módulo $200$ N, formando $30^{\circ}$ com o eixo $x$ positivo, e $\vec{F}_2$, de módulo $100$ N, apontando no sentido $-y$. Determine o módulo da força resultante.`,
    {
      a: R`$200$ N`,
      b: R`$100$ N`,
      c: R`$100\sqrt3$ N`,
      d: R`$300$ N`,
      e: R`$100\sqrt2$ N`,
    },
    "c",
    R`Decompondo: $\vec{F}_1=\left(200\cos 30^{\circ},\ 200\operatorname{sen}30^{\circ}\right)=\left(100\sqrt3,\ 100\right)$ N e $\vec{F}_2=(0,-100)$ N. Somando, $\vec{R}=\left(100\sqrt3,\ 0\right)$ N, cujo módulo é $100\sqrt3\approx 173$ N.`
  ),
  q(
    "Vetores e Sistemas de Coordenadas",
    "Produto escalar e ângulo entre vetores",
    "medio",
    R`Determine o ângulo entre $\vec{A}=(1,2,2)$ e $\vec{B}=(2,-1,2)$.`,
    {
      a: R`$\arccos\left(\dfrac{2}{9}\right)$`,
      b: R`$\arccos\left(\dfrac{1}{3}\right)$`,
      c: R`$\arccos\left(\dfrac{8}{9}\right)$`,
      d: R`$\arccos\left(\dfrac{4}{9}\right)$`,
      e: R`$\arccos\left(\dfrac{4}{3}\right)$`,
    },
    "d",
    R`O produto escalar é $\vec{A}\cdot\vec{B}=1(2)+2(-1)+2(2)=4$. Os módulos são $\left|\vec{A}\right|=\sqrt{1+4+4}=3$ e $\left|\vec{B}\right|=\sqrt{4+1+4}=3$. Assim $\cos\theta=\dfrac{4}{3\cdot 3}=\dfrac{4}{9}$, ou seja, $\theta=\arccos\left(\dfrac49\right)\approx 63{,}6^{\circ}$.`
  ),
  q(
    "A Terceira Lei de Newton",
    "Força de contato entre blocos",
    "facil",
    R`Dois blocos, de massas $m_1=3{,}0$ kg e $m_2=2{,}0$ kg, estão encostados um no outro sobre uma superfície horizontal sem atrito. Uma força horizontal de $10$ N é aplicada em $m_1$, empurrando o conjunto. Determine o módulo da força que $m_1$ exerce sobre $m_2$.`,
    {
      a: R`$2{,}0$ N`,
      b: R`$4{,}0$ N`,
      c: R`$5{,}0$ N`,
      d: R`$6{,}0$ N`,
      e: R`$10$ N`,
    },
    "b",
    R`Tratando o conjunto como um único corpo: $a=\dfrac{F}{m_1+m_2}=\dfrac{10}{5{,}0}=2{,}0$ m/s². Isolando $m_2$, a única força horizontal sobre ele é a de contato: $F_{12}=m_2a=2{,}0\cdot 2{,}0=4{,}0$ N. Pela terceira lei, $m_2$ empurra $m_1$ com $4{,}0$ N no sentido oposto.`
  ),
  q(
    "A Terceira Lei de Newton",
    "Máquina de Atwood",
    "medio",
    R`Em uma máquina de Atwood ideal (fio e polia de massas desprezíveis, sem atrito), penduram-se $m_1=2{,}0$ kg e $m_2=6{,}0$ kg. Adotando $g=10$ m/s², determine a tração no fio.`,
    {
      a: R`$30$ N`,
      b: R`$20$ N`,
      c: R`$40$ N`,
      d: R`$60$ N`,
      e: R`$80$ N`,
    },
    "a",
    R`A aceleração do sistema é $a=\dfrac{\left(m_2-m_1\right)g}{m_1+m_2}=\dfrac{4{,}0\cdot 10}{8{,}0}=5{,}0$ m/s². Isolando $m_1$ (que sobe): $T-m_1g=m_1a\Rightarrow T=m_1(g+a)=2{,}0\cdot 15=30$ N. Conferindo com $m_2$, que desce: $T=m_2(g-a)=6{,}0\cdot 5{,}0=30$ N. Note que $T$ não é nem $m_1g=20$ N nem $m_2g=60$ N.`
  ),
  q(
    "A Terceira Lei de Newton",
    "Corpos ligados por fio e polia",
    "medio",
    R`Um bloco de $2{,}0$ kg repousa sobre uma mesa horizontal sem atrito e é ligado por um fio ideal, que passa por uma polia na borda da mesa, a um bloco de $3{,}0$ kg pendurado. Adotando $g=10$ m/s², determine a tração no fio após a liberação do sistema.`,
    {
      a: R`$12$ N`,
      b: R`$18$ N`,
      c: R`$30$ N`,
      d: R`$20$ N`,
      e: R`$6{,}0$ N`,
    },
    "a",
    R`Para o sistema, a única força motora é o peso do bloco pendurado: $a=\dfrac{m_2g}{m_1+m_2}=\dfrac{3{,}0\cdot 10}{5{,}0}=6{,}0$ m/s². Isolando o bloco da mesa, a tração é a única força horizontal: $T=m_1a=2{,}0\cdot 6{,}0=12$ N.`
  ),
  q(
    "Impulso e Momento Linear",
    "Colisão perfeitamente inelástica",
    "medio",
    R`Um corpo de $2{,}0$ kg move-se a $6{,}0$ m/s e colide frontalmente com outro de $4{,}0$ kg em repouso, ficando os dois grudados. Determine a energia cinética dissipada na colisão.`,
    {
      a: R`$12$ J`,
      b: R`$18$ J`,
      c: R`$24$ J`,
      d: R`$36$ J`,
      e: R`$6{,}0$ J`,
    },
    "c",
    R`Conservação do momento: $2{,}0\cdot 6{,}0=6{,}0\,v\Rightarrow v=2{,}0$ m/s. A energia cinética inicial é $K_i=\dfrac12(2{,}0)(6{,}0)^2=36$ J e a final é $K_f=\dfrac12(6{,}0)(2{,}0)^2=12$ J. A energia dissipada é $36-12=24$ J.`
  ),
  q(
    "Impulso e Momento Linear",
    "Impulso e variação do momento",
    "facil",
    R`Uma bola de $0{,}20$ kg atinge perpendicularmente uma parede a $10$ m/s e ricocheteia, no sentido oposto, a $8{,}0$ m/s. Determine o módulo do impulso aplicado pela parede na bola.`,
    {
      a: R`$0{,}40$ N·s`,
      b: R`$1{,}6$ N·s`,
      c: R`$2{,}0$ N·s`,
      d: R`$3{,}0$ N·s`,
      e: R`$3{,}6$ N·s`,
    },
    "e",
    R`O teorema do impulso e do momento dá $J=\Delta p=m\left(v_f-v_i\right)$. Adotando como positivo o sentido de saída, $v_i=-10$ m/s e $v_f=+8{,}0$ m/s, logo $J=0{,}20\left[8{,}0-(-10)\right]=0{,}20\cdot 18=3{,}6$ N·s.`
  ),
  q(
    "Impulso e Momento Linear",
    "Explosão e conservação do momento",
    "facil",
    R`Um corpo de $6{,}0$ kg, inicialmente em repouso, explode em dois fragmentos. Um deles, de $2{,}0$ kg, sai a $9{,}0$ m/s para leste. Determine o módulo da velocidade do outro fragmento.`,
    {
      a: R`$2{,}25$ m/s`,
      b: R`$3{,}0$ m/s`,
      c: R`$4{,}5$ m/s`,
      d: R`$9{,}0$ m/s`,
      e: R`$18$ m/s`,
    },
    "c",
    R`O momento total antes é nulo e deve permanecer nulo. O fragmento de $2{,}0$ kg carrega $p=2{,}0\cdot 9{,}0=18$ kg·m/s para leste, então o outro, de $6{,}0-2{,}0=4{,}0$ kg, carrega $18$ kg·m/s para oeste. Logo $v=\dfrac{18}{4{,}0}=4{,}5$ m/s.`
  ),
  q(
    "Impulso e Momento Linear",
    "Momento em duas dimensões",
    "medio",
    R`Dois discos de $0{,}50$ kg deslizam sem atrito sobre um plano horizontal: um a $4{,}0$ m/s no sentido $+x$ e outro a $3{,}0$ m/s no sentido $+y$. Eles colidem e ficam grudados. Determine o módulo da velocidade do conjunto após a colisão.`,
    {
      a: R`$1{,}75$ m/s`,
      b: R`$2{,}5$ m/s`,
      c: R`$3{,}5$ m/s`,
      d: R`$5{,}0$ m/s`,
      e: R`$7{,}0$ m/s`,
    },
    "b",
    R`O momento total é $\vec{p}=\left(0{,}50\cdot 4{,}0,\ 0{,}50\cdot 3{,}0\right)=(2{,}0,\ 1{,}5)$ kg·m/s. Como a massa final é $1{,}0$ kg, $\vec{v}=(2{,}0,\ 1{,}5)$ m/s, de módulo $\sqrt{2{,}0^2+1{,}5^2}=\sqrt{6{,}25}=2{,}5$ m/s.`
  ),
  q(
    "Energia",
    "Energia potencial elástica",
    "facil",
    R`Uma mola de constante elástica $200$ N/m é comprimida em $0{,}10$ m e, ao ser solta, lança um bloco de $0{,}50$ kg sobre uma superfície horizontal sem atrito. Determine a velocidade do bloco ao perder contato com a mola.`,
    {
      a: R`$0{,}50$ m/s`,
      b: R`$1{,}0$ m/s`,
      c: R`$2{,}0$ m/s`,
      d: R`$2{,}8$ m/s`,
      e: R`$4{,}0$ m/s`,
    },
    "c",
    R`A energia armazenada é $U=\dfrac12kx^2=\dfrac12(200)(0{,}10)^2=1{,}0$ J. Sem atrito, toda ela vira energia cinética: $\dfrac12mv^2=1{,}0\Rightarrow v=\sqrt{\dfrac{2\cdot 1{,}0}{0{,}50}}=\sqrt4=2{,}0$ m/s.`
  ),
  q(
    "Energia",
    "Colisão elástica unidimensional",
    "medio",
    R`Um corpo de $2{,}0$ kg move-se a $5{,}0$ m/s e colide elasticamente e frontalmente com um corpo de $3{,}0$ kg em repouso. Determine a velocidade do corpo de $3{,}0$ kg após a colisão.`,
    {
      a: R`$1{,}0$ m/s`,
      b: R`$2{,}0$ m/s`,
      c: R`$3{,}0$ m/s`,
      d: R`$4{,}0$ m/s`,
      e: R`$5{,}0$ m/s`,
    },
    "d",
    R`Para colisão elástica com alvo em repouso, $v_2'=\dfrac{2m_1}{m_1+m_2}v_1=\dfrac{2(2{,}0)}{5{,}0}(5{,}0)=4{,}0$ m/s. Conferindo com o projétil, $v_1'=\dfrac{m_1-m_2}{m_1+m_2}v_1=-1{,}0$ m/s: o momento total é $2{,}0(-1{,}0)+3{,}0(4{,}0)=10$ kg·m/s, igual ao inicial, e a energia cinética também se conserva em $25$ J.`
  ),
  q(
    "Energia",
    "Conservação de energia com atrito",
    "medio",
    R`Um bloco parte do repouso e desce um plano inclinado de altura $3{,}0$ m, com $\operatorname{sen}\theta=0{,}60$ e $\cos\theta=0{,}80$. O coeficiente de atrito cinético é $0{,}30$ e $g=10$ m/s². Determine a velocidade do bloco na base do plano.`,
    {
      a: R`$6{,}0$ m/s`,
      b: R`$4{,}0$ m/s`,
      c: R`$5{,}0$ m/s`,
      d: R`$7{,}7$ m/s`,
      e: R`$8{,}0$ m/s`,
    },
    "a",
    R`O comprimento do plano é $L=\dfrac{h}{\operatorname{sen}\theta}=\dfrac{3{,}0}{0{,}60}=5{,}0$ m. Por unidade de massa, a energia liberada pela gravidade é $gh=30$ J/kg e o trabalho do atrito é $\mu g\cos\theta\,L=0{,}30\cdot 10\cdot 0{,}80\cdot 5{,}0=12$ J/kg. Assim $\dfrac{v^2}{2}=30-12=18\Rightarrow v^2=36\Rightarrow v=6{,}0$ m/s.`
  ),
  q(
    "Trabalho",
    "Trabalho de força variável",
    "facil",
    R`Uma força horizontal de módulo $F(x)=3x^2$ (em newtons, com $x$ em metros) atua sobre um corpo que se desloca de $x=0$ a $x=2{,}0$ m. Determine o trabalho realizado.`,
    {
      a: R`$4{,}0$ J`,
      b: R`$6{,}0$ J`,
      c: R`$12$ J`,
      d: R`$24$ J`,
      e: R`$8{,}0$ J`,
    },
    "e",
    R`Para força variável ao longo do deslocamento, $W=\displaystyle\int_0^{2}F(x)\,dx=\int_0^{2}3x^2dx=\left[x^3\right]_0^{2}=8{,}0$ J.`
  ),
  q(
    "Trabalho",
    "Teorema do trabalho e energia cinética",
    "medio",
    R`Um bloco de $4{,}0$ kg, lançado a $10$ m/s sobre uma superfície horizontal, percorre $12{,}5$ m até parar. Adotando $g=10$ m/s², determine o coeficiente de atrito cinético entre o bloco e a superfície.`,
    {
      a: R`$0{,}20$`,
      b: R`$0{,}25$`,
      c: R`$0{,}50$`,
      d: R`$0{,}40$`,
      e: R`$0{,}80$`,
    },
    "d",
    R`Pelo teorema do trabalho e energia cinética, $W_{at}=\Delta K=0-\dfrac12(4{,}0)(10)^2=-200$ J. Como $W_{at}=-\mu mgd=-\mu(4{,}0)(10)(12{,}5)=-500\mu$, temos $500\mu=200\Rightarrow\mu=0{,}40$.`
  ),
  q(
    "Trabalho",
    "Potência mecânica",
    "facil",
    R`Um guindaste eleva uma carga de $500$ kg com velocidade constante de $0{,}40$ m/s. Adotando $g=10$ m/s², determine a potência desenvolvida pelo guindaste.`,
    {
      a: R`$2{,}0$ kW`,
      b: R`$200$ W`,
      c: R`$1{,}0$ kW`,
      d: R`$5{,}0$ kW`,
      e: R`$20$ kW`,
    },
    "a",
    R`Com velocidade constante, a força aplicada equilibra o peso: $F=mg=500\cdot 10=5000$ N. A potência é $P=Fv=5000\cdot 0{,}40=2000$ W $=2{,}0$ kW.`
  ),
  q(
    "Trabalho",
    "Trabalho de força constante em deslocamento vetorial",
    "facil",
    R`Uma força constante $\vec{F}=\left(4\hat{\imath}-3\hat{\jmath}\right)$ N atua sobre uma partícula durante o deslocamento $\vec{d}=\left(2\hat{\imath}+5\hat{\jmath}\right)$ m. Determine o trabalho realizado.`,
    {
      a: R`$-23$ J`,
      b: R`$-7{,}0$ J`,
      c: R`$0$`,
      d: R`$7{,}0$ J`,
      e: R`$23$ J`,
    },
    "b",
    R`Para força constante, $W=\vec{F}\cdot\vec{d}=(4)(2)+(-3)(5)=8-15=-7{,}0$ J. O sinal negativo indica que a força tem componente contrária ao deslocamento.`
  ),
  q(
    "Rotação de Corpo Rígido",
    "Momento de inércia e torque",
    "medio",
    R`Um disco homogêneo de $2{,}0$ kg e raio $0{,}50$ m gira em torno de seu eixo central. Aplica-se um torque resultante de $1{,}0$ N·m. Determine a aceleração angular do disco.`,
    {
      a: R`$0{,}25$ rad/s²`,
      b: R`$1{,}0$ rad/s²`,
      c: R`$2{,}0$ rad/s²`,
      d: R`$4{,}0$ rad/s²`,
      e: R`$8{,}0$ rad/s²`,
    },
    "d",
    R`O momento de inércia do disco em torno do eixo central é $I=\dfrac12MR^2=\dfrac12(2{,}0)(0{,}50)^2=0{,}25$ kg·m². Pela segunda lei de Newton para rotações, $\tau=I\alpha\Rightarrow\alpha=\dfrac{1{,}0}{0{,}25}=4{,}0$ rad/s².`
  ),
  q(
    "Rotação de Corpo Rígido",
    "Rolamento sem deslizamento",
    "dificil",
    R`Um cilindro maciço e homogêneo parte do repouso e rola sem deslizar por uma rampa, descendo uma altura de $1{,}2$ m. Adotando $g=10$ m/s², determine a velocidade do centro de massa na base.`,
    {
      a: R`$2{,}0$ m/s`,
      b: R`$3{,}5$ m/s`,
      c: R`$4{,}0$ m/s`,
      d: R`$4{,}6$ m/s`,
      e: R`$4{,}9$ m/s`,
    },
    "c",
    R`No rolamento sem deslizamento, $K=\dfrac12Mv^2+\dfrac12I\omega^2$ com $I=\dfrac12MR^2$ e $\omega=\dfrac{v}{R}$, o que dá $K=\dfrac34Mv^2$. Igualando a $Mgh$: $\dfrac34v^2=gh\Rightarrow v=\sqrt{\dfrac{4gh}{3}}=\sqrt{\dfrac{4(10)(1{,}2)}{3}}=\sqrt{16}=4{,}0$ m/s.`
  ),
  q(
    "Rotação de Corpo Rígido",
    "Conservação do momento angular",
    "medio",
    R`Uma patinadora gira com momento de inércia $6{,}0$ kg·m² a $2{,}0$ rad/s. Ao encolher os braços, seu momento de inércia cai para $2{,}0$ kg·m². Determine sua energia cinética de rotação final.`,
    {
      a: R`$6{,}0$ J`,
      b: R`$12$ J`,
      c: R`$18$ J`,
      d: R`$24$ J`,
      e: R`$36$ J`,
    },
    "e",
    R`Sem torque externo, $L=I\omega$ se conserva: $6{,}0(2{,}0)=2{,}0\,\omega_f\Rightarrow\omega_f=6{,}0$ rad/s. A energia cinética final é $K_f=\dfrac12I_f\omega_f^2=\dfrac12(2{,}0)(6{,}0)^2=36$ J (a inicial era $12$ J; a diferença vem do trabalho muscular).`
  ),
  q(
    "Rotação de Corpo Rígido",
    "Equilíbrio estático",
    "medio",
    R`Uma barra homogênea de $4{,}0$ m e $20$ kg está apoiada em dois suportes, $A$ e $B$, situados nas extremidades. Um bloco de $30$ kg é colocado a $1{,}0$ m do apoio $A$. Adotando $g=10$ m/s², determine a reação normal no apoio $A$.`,
    {
      a: R`$175$ N`,
      b: R`$250$ N`,
      c: R`$400$ N`,
      d: R`$500$ N`,
      e: R`$325$ N`,
    },
    "e",
    R`Tomando os torques em relação ao apoio $B$ (que elimina $N_B$), com a barra tendo peso aplicado no centro, a $2{,}0$ m de $B$, e o bloco a $3{,}0$ m de $B$: $N_A(4{,}0)=20(10)(2{,}0)+30(10)(3{,}0)=400+900=1300$. Logo $N_A=325$ N (e $N_B=500-325=175$ N, fechando o equilíbrio vertical).`
  ),
  q(
    "Gravitação",
    "Aceleração da gravidade com a altitude",
    "facil",
    R`Na superfície da Terra a aceleração da gravidade vale $10$ m/s². Determine seu valor a uma altitude igual ao raio terrestre.`,
    {
      a: R`$1{,}25$ m/s²`,
      b: R`$2{,}5$ m/s²`,
      c: R`$3{,}3$ m/s²`,
      d: R`$5{,}0$ m/s²`,
      e: R`$10$ m/s²`,
    },
    "b",
    R`A aceleração varia com $g'=\dfrac{GM}{(R+h)^2}=g\left(\dfrac{R}{R+h}\right)^2$. Com $h=R$: $g'=g\left(\dfrac{R}{2R}\right)^2=\dfrac{g}{4}=2{,}5$ m/s².`
  ),
  q(
    "Gravitação",
    "Velocidade orbital",
    "medio",
    R`Um satélite descreve órbita circular de raio $r=2R_T$ em torno da Terra, com $R_T=6{,}4\times 10^{6}$ m e $g=10$ m/s² na superfície. Determine a velocidade orbital do satélite.`,
    {
      a: R`$2{,}8$ km/s`,
      b: R`$4{,}0$ km/s`,
      c: R`$8{,}0$ km/s`,
      d: R`$11{,}2$ km/s`,
      e: R`$5{,}7$ km/s`,
    },
    "e",
    R`Na órbita circular, a gravitação fornece a resultante centrípeta: $\dfrac{GMm}{r^2}=\dfrac{mv^2}{r}\Rightarrow v=\sqrt{\dfrac{GM}{r}}$. Usando $GM=gR_T^2$ e $r=2R_T$: $v=\sqrt{\dfrac{gR_T}{2}}=\sqrt{\dfrac{10\cdot 6{,}4\times 10^{6}}{2}}=\sqrt{3{,}2\times 10^{7}}\approx 5{,}7\times 10^{3}$ m/s.`
  ),
  q(
    "Gravitação",
    "Terceira lei de Kepler",
    "facil",
    R`Um planeta hipotético descreve órbita circular em torno do Sol com raio quatro vezes maior que o da órbita da Terra. Determine seu período de revolução.`,
    {
      a: R`$8$ anos`,
      b: R`$2$ anos`,
      c: R`$4$ anos`,
      d: R`$16$ anos`,
      e: R`$64$ anos`,
    },
    "a",
    R`A terceira lei de Kepler dá $\dfrac{T^2}{r^3}$ constante, logo $T\propto r^{3/2}$. Com $r'=4r$: $T'=4^{3/2}T=8T$. Como o período da Terra é $1$ ano, $T'=8$ anos.`
  ),
  q(
    "Gravitação",
    "Energia em órbita",
    "dificil",
    R`Qual é o trabalho mínimo necessário para levar um satélite de $500$ kg da superfície da Terra até uma órbita circular de raio $2R_T$? Use $R_T=6{,}4\times 10^{6}$ m, $g=10$ m/s² e despreze a rotação terrestre.`,
    {
      a: R`$8{,}0\times 10^{9}$ J`,
      b: R`$1{,}6\times 10^{10}$ J`,
      c: R`$2{,}4\times 10^{10}$ J`,
      d: R`$3{,}2\times 10^{10}$ J`,
      e: R`$6{,}4\times 10^{10}$ J`,
    },
    "c",
    R`A energia mecânica em repouso na superfície é $E_i=-\dfrac{GMm}{R_T}$. Na órbita circular de raio $r$, $E_f=-\dfrac{GMm}{2r}=-\dfrac{GMm}{4R_T}$. Então $W=E_f-E_i=GMm\left(\dfrac{1}{R_T}-\dfrac{1}{4R_T}\right)=\dfrac{3}{4}\dfrac{GMm}{R_T}=\dfrac34 gR_Tm$. Numericamente, $W=0{,}75\cdot 10\cdot 6{,}4\times 10^{6}\cdot 500=2{,}4\times 10^{10}$ J.`
  ),
  q(
    "Oscilações",
    "Período do pêndulo simples",
    "facil",
    R`Determine o período de um pêndulo simples de comprimento $1{,}0$ m, para pequenas oscilações, adotando $g=10$ m/s².`,
    {
      a: R`$0{,}50$ s`,
      b: R`$1{,}0$ s`,
      c: R`$3{,}1$ s`,
      d: R`$2{,}0$ s`,
      e: R`$6{,}3$ s`,
    },
    "d",
    R`Para pequenas amplitudes, $T=2\pi\sqrt{\dfrac{L}{g}}=2\pi\sqrt{\dfrac{1{,}0}{10}}=2\pi(0{,}316)\approx 1{,}99$ s, ou seja, aproximadamente $2{,}0$ s.`
  ),
  q(
    "Oscilações",
    "Velocidade máxima no MHS",
    "medio",
    R`Um bloco de $0{,}50$ kg preso a uma mola de constante $200$ N/m oscila em MHS com amplitude de $0{,}040$ m sobre superfície sem atrito. Determine a velocidade máxima do bloco.`,
    {
      a: R`$0{,}80$ m/s`,
      b: R`$0{,}20$ m/s`,
      c: R`$0{,}40$ m/s`,
      d: R`$1{,}6$ m/s`,
      e: R`$8{,}0$ m/s`,
    },
    "a",
    R`A frequência angular é $\omega=\sqrt{\dfrac{k}{m}}=\sqrt{\dfrac{200}{0{,}50}}=\sqrt{400}=20$ rad/s. A velocidade máxima ocorre na posição de equilíbrio: $v_{max}=\omega A=20(0{,}040)=0{,}80$ m/s.`
  ),
  q(
    "Oscilações",
    "Energia no MHS",
    "medio",
    R`Um oscilador massa-mola tem constante elástica $100$ N/m e amplitude $0{,}10$ m. Determine a energia cinética do bloco no instante em que ele passa pela posição $x=\dfrac{A}{2}$.`,
    {
      a: R`$0{,}125$ J`,
      b: R`$0{,}250$ J`,
      c: R`$0{,}500$ J`,
      d: R`$0{,}750$ J`,
      e: R`$0{,}375$ J`,
    },
    "e",
    R`A energia mecânica total é $E=\dfrac12kA^2=\dfrac12(100)(0{,}10)^2=0{,}50$ J. Em $x=0{,}050$ m, a energia potencial é $U=\dfrac12kx^2=\dfrac12(100)(0{,}050)^2=0{,}125$ J. Logo $K=E-U=0{,}50-0{,}125=0{,}375$ J.`
  ),
  q(
    "Oscilações",
    "Oscilação vertical massa-mola",
    "medio",
    R`Ao pendurar um bloco em uma mola vertical, ela se distende $0{,}050$ m até o novo equilíbrio. Adotando $g=10$ m/s², determine o período das pequenas oscilações verticais desse sistema.`,
    {
      a: R`$0{,}10$ s`,
      b: R`$0{,}44$ s`,
      c: R`$0{,}22$ s`,
      d: R`$0{,}89$ s`,
      e: R`$1{,}4$ s`,
    },
    "b",
    R`No equilíbrio, $k\Delta\ell=mg$, ou seja, $\dfrac{k}{m}=\dfrac{g}{\Delta\ell}$. Então $\omega=\sqrt{\dfrac{g}{\Delta\ell}}=\sqrt{\dfrac{10}{0{,}050}}=\sqrt{200}\approx 14{,}1$ rad/s e $T=\dfrac{2\pi}{\omega}\approx 0{,}44$ s. Note que a massa não precisa ser conhecida.`
  ),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "fisica1_lote2.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
