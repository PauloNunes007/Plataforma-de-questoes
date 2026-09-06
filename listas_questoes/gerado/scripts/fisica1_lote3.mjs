// Lote 3 de Física I — 3 questões em cada um dos 8 tópicos ainda mais rasos
// do banco. Estilo Halliday-Resnick-Walker / Young & Freedman.
// Rode: node listas_questoes/gerado/scripts/fisica1_lote3.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Física I";

const q = (topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao) => ({
  materia: MATERIA, topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao,
  instituicao: null, ano: null, tikz_code: null,
});

const questoes = [
  q("Vetores e Sistemas de Coordenadas", "Soma de vetores no espaço", "facil",
    R`Sejam $\vec{A}=(3,-4,12)$ e $\vec{B}=(-3,4,1)$. Determine o módulo de $\vec{A}+\vec{B}$.`,
    { a: R`$5$`, b: R`$17$`, c: R`$13$`, d: R`$\sqrt{26}$`, e: R`$1$` }, "c",
    R`Somando componente a componente, $\vec{A}+\vec{B}=(0,0,13)$. Seu módulo é $\sqrt{0^2+0^2+13^2}=13$. Note que as componentes $x$ e $y$ se cancelam exatamente.`),

  q("Vetores e Sistemas de Coordenadas", "Direção de um vetor no plano", "facil",
    R`Determine o ângulo que o vetor $\vec{v}=\left(-1,\ \sqrt3\right)$ forma com o semieixo $x$ positivo, medido no sentido anti-horário.`,
    { a: R`$120^{\circ}$`, b: R`$60^{\circ}$`, c: R`$150^{\circ}$`, d: R`$30^{\circ}$`, e: R`$240^{\circ}$` }, "a",
    R`O módulo é $\left|\vec{v}\right|=\sqrt{1+3}=2$, logo $\cos\theta=-\dfrac12$ e $\operatorname{sen}\theta=\dfrac{\sqrt3}{2}$. Cosseno negativo e seno positivo colocam o vetor no segundo quadrante, o que dá $\theta=120^{\circ}$.`),

  q("Vetores e Sistemas de Coordenadas", "Componente de um vetor em uma direção", "medio",
    R`Determine a componente do vetor $\vec{A}=(5,10)$ na direção do vetor $\vec{B}=(3,4)$.`,
    { a: R`$55$`, b: R`$\dfrac{55}{13}$`, c: R`$5$`, d: R`$22$`, e: R`$11$` }, "e",
    R`A componente escalar de $\vec{A}$ na direção de $\vec{B}$ é $\dfrac{\vec{A}\cdot\vec{B}}{\left|\vec{B}\right|}$. Com $\vec{A}\cdot\vec{B}=15+40=55$ e $\left|\vec{B}\right|=\sqrt{9+16}=5$, o valor é $\dfrac{55}{5}=11$.`),

  q("A Terceira Lei de Newton", "Três blocos em contato", "medio",
    R`Três blocos, de $1{,}0$ kg, $2{,}0$ kg e $3{,}0$ kg, encostados nessa ordem sobre uma superfície horizontal sem atrito, são empurrados por uma força horizontal de $12$ N aplicada no primeiro. Determine o módulo da força que o segundo bloco exerce sobre o terceiro.`,
    { a: R`$4{,}0$ N`, b: R`$6{,}0$ N`, c: R`$2{,}0$ N`, d: R`$12$ N`, e: R`$10$ N` }, "b",
    R`Para o conjunto, $a=\dfrac{12}{1{,}0+2{,}0+3{,}0}=2{,}0$ m/s². Isolando o terceiro bloco, a única força horizontal sobre ele é a de contato com o segundo: $F=m_3a=3{,}0\cdot 2{,}0=6{,}0$ N.`),

  q("A Terceira Lei de Newton", "Corpos ligados com atrito na mesa", "dificil",
    R`Um bloco de $2{,}0$ kg está sobre uma mesa horizontal com coeficiente de atrito cinético $0{,}25$ e é ligado por um fio ideal, passando por uma polia na borda, a um bloco de $3{,}0$ kg pendurado. Adotando $g=10$ m/s², determine a tração no fio.`,
    { a: R`$10$ N`, b: R`$30$ N`, c: R`$20$ N`, d: R`$15$ N`, e: R`$5{,}0$ N` }, "d",
    R`A força de atrito sobre o bloco da mesa é $f=\mu m_1g=0{,}25(2{,}0)(10)=5{,}0$ N. Para o sistema, $a=\dfrac{m_2g-f}{m_1+m_2}=\dfrac{30-5{,}0}{5{,}0}=5{,}0$ m/s². Isolando o bloco da mesa: $T-f=m_1a\Rightarrow T=5{,}0+2{,}0(5{,}0)=15$ N. Conferindo pelo pendurado: $30-T=3{,}0(5{,}0)\Rightarrow T=15$ N.`),

  q("A Terceira Lei de Newton", "Força normal em elevador acelerado", "facil",
    R`Uma pessoa de $60$ kg está sobre uma balança no piso de um elevador que sobe com aceleração de $2{,}0$ m/s². Adotando $g=10$ m/s², determine a força normal indicada pela balança.`,
    { a: R`$720$ N`, b: R`$600$ N`, c: R`$480$ N`, d: R`$120$ N`, e: R`$660$ N` }, "a",
    R`Com o eixo positivo para cima, a segunda lei dá $N-mg=ma$, logo $N=m(g+a)=60(10+2{,}0)=720$ N. Pela terceira lei, a pessoa comprime a balança com essa mesma intensidade — daí a sensação de "peso maior".`),

  q("Impulso e Momento Linear", "Força média em uma colisão", "medio",
    R`Uma bola de $0{,}50$ kg tem sua velocidade alterada em $20$ m/s durante um choque que dura $0{,}010$ s. Determine o módulo da força média sobre a bola.`,
    { a: R`$100$ N`, b: R`$250$ N`, c: R`$500$ N`, d: R`$2000$ N`, e: R`$1000$ N` }, "e",
    R`Pelo teorema do impulso e do momento, $F_{m}\Delta t=m\Delta v$, logo $F_m=\dfrac{m\Delta v}{\Delta t}=\dfrac{0{,}50\cdot 20}{0{,}010}=1000$ N. É por isso que aumentar o tempo de colisão (air bag, luva acolchoada) reduz tanto a força.`),

  q("Impulso e Momento Linear", "Centro de massa de duas partículas", "facil",
    R`Duas partículas, de $2{,}0$ kg e $3{,}0$ kg, ocupam as posições $x=0$ e $x=5{,}0$ m sobre um eixo. Determine a posição do centro de massa do sistema.`,
    { a: R`$2{,}0$ m`, b: R`$2{,}5$ m`, c: R`$3{,}0$ m`, d: R`$3{,}5$ m`, e: R`$1{,}5$ m` }, "c",
    R`Pela definição, $x_{cm}=\dfrac{m_1x_1+m_2x_2}{m_1+m_2}=\dfrac{2{,}0(0)+3{,}0(5{,}0)}{5{,}0}=\dfrac{15}{5{,}0}=3{,}0$ m. O centro de massa fica mais próximo da partícula mais pesada, como esperado.`),

  q("Impulso e Momento Linear", "Coeficiente de restituição", "medio",
    R`Uma bola é solta de uma altura de $1{,}25$ m e, após colidir com o solo, retorna a $0{,}45$ m. Determine o coeficiente de restituição da colisão.`,
    { a: R`$0{,}36$`, b: R`$0{,}60$`, c: R`$0{,}80$`, d: R`$0{,}45$`, e: R`$0{,}75$` }, "b",
    R`As velocidades imediatamente antes e depois do choque valem $v=\sqrt{2gh}$ e $v'=\sqrt{2gh'}$, logo $e=\dfrac{v'}{v}=\sqrt{\dfrac{h'}{h}}=\sqrt{\dfrac{0{,}45}{1{,}25}}=\sqrt{0{,}36}=0{,}60$.`),

  q("Energia", "Pêndulo e conservação de energia", "medio",
    R`Um pêndulo de comprimento $1{,}6$ m é abandonado do repouso com o fio formando $60^{\circ}$ com a vertical. Adotando $g=10$ m/s², determine a velocidade da massa ao passar pelo ponto mais baixo.`,
    { a: R`$2{,}0$ m/s`, b: R`$5{,}7$ m/s`, c: R`$3{,}2$ m/s`, d: R`$4{,}0$ m/s`, e: R`$8{,}0$ m/s` }, "d",
    R`A altura de queda é $h=L\left(1-\cos 60^{\circ}\right)=1{,}6(1-0{,}5)=0{,}80$ m. Pela conservação da energia, $\dfrac{v^2}{2}=gh$, logo $v=\sqrt{2(10)(0{,}80)}=\sqrt{16}=4{,}0$ m/s. A massa não influi no resultado.`),

  q("Energia", "Lei de Hooke e energia potencial elástica", "facil",
    R`Uma força de $50$ N comprime certa mola em $0{,}20$ m. Determine a energia potencial elástica armazenada nessa compressão.`,
    { a: R`$5{,}0$ J`, b: R`$10$ J`, c: R`$2{,}5$ J`, d: R`$250$ J`, e: R`$1{,}0$ J` }, "a",
    R`Pela lei de Hooke, $k=\dfrac{F}{x}=\dfrac{50}{0{,}20}=250$ N/m. A energia armazenada é $U=\dfrac12kx^2=\dfrac12(250)(0{,}20)^2=\dfrac12(250)(0{,}040)=5{,}0$ J.`),

  q("Energia", "Partição entre energia cinética e potencial", "medio",
    R`Um corpo é lançado verticalmente para cima a $20$ m/s. Adotando $g=10$ m/s² e desprezando a resistência do ar, determine a altura em que sua energia cinética iguala sua energia potencial gravitacional.`,
    { a: R`$5{,}0$ m`, b: R`$20$ m`, c: R`$10$ m`, d: R`$15$ m`, e: R`$2{,}5$ m` }, "c",
    R`A energia mecânica total por unidade de massa é $\dfrac{v_0^2}{2}=\dfrac{400}{2}=200$ J/kg, conservada. Quando $K=U$, cada uma vale metade do total, isto é, $U=100$ J/kg. De $U=gh$ vem $h=\dfrac{100}{10}=10$ m — exatamente metade da altura máxima, que é $20$ m.`),

  q("Trabalho", "Trabalho para deformar uma mola", "medio",
    R`Determine o trabalho necessário para distender de $0$ a $0{,}30$ m uma mola de constante elástica $400$ N/m.`,
    { a: R`$120$ J`, b: R`$36$ J`, c: R`$60$ J`, d: R`$12$ J`, e: R`$18$ J` }, "e",
    R`Como a força elástica é variável, $W=\displaystyle\int_0^{0{,}30}kx\,dx=\dfrac{kx^2}{2}=\dfrac{400(0{,}30)^2}{2}=\dfrac{400(0{,}090)}{2}=18$ J. Usar $F_{max}\cdot d=120\cdot 0{,}30=36$ J seria o erro de tratar a força como constante.`),

  q("Trabalho", "Trabalho da força peso em plano inclinado", "facil",
    R`Um bloco de $5{,}0$ kg desliza $4{,}0$ m ao longo de um plano inclinado de $30^{\circ}$ com a horizontal. Adotando $g=10$ m/s², determine o trabalho realizado pela força peso.`,
    { a: R`$200$ J`, b: R`$100$ J`, c: R`$173$ J`, d: R`$50$ J`, e: R`$0$` }, "b",
    R`O trabalho do peso depende apenas do desnível vertical: $h=d\operatorname{sen}30^{\circ}=4{,}0(0{,}50)=2{,}0$ m. Então $W=mgh=5{,}0(10)(2{,}0)=100$ J, positivo por o bloco descer. O peso é conservativo: o caminho não importa.`),

  q("Trabalho", "Potência média de um motor", "facil",
    R`Um motor eleva uma carga de $200$ kg a uma altura de $15$ m em $30$ s, com velocidade praticamente constante. Adotando $g=10$ m/s², determine a potência média desenvolvida.`,
    { a: R`$1{,}0$ kW`, b: R`$2{,}0$ kW`, c: R`$100$ W`, d: R`$500$ W`, e: R`$30$ kW` }, "a",
    R`O trabalho contra a gravidade é $W=mgh=200(10)(15)=3{,}0\times 10^{4}$ J. A potência média é $P=\dfrac{W}{\Delta t}=\dfrac{3{,}0\times 10^{4}}{30}=1000$ W $=1{,}0$ kW.`),

  q("Rotação de Corpo Rígido", "Momento de inércia de sistema de partículas", "facil",
    R`Três partículas de $2{,}0$ kg cada estão fixas a $0{,}50$ m de um eixo de rotação, por hastes de massa desprezível. Determine o momento de inércia do sistema em relação a esse eixo.`,
    { a: R`$0{,}50$ kg·m²`, b: R`$3{,}0$ kg·m²`, c: R`$1{,}0$ kg·m²`, d: R`$1{,}5$ kg·m²`, e: R`$6{,}0$ kg·m²` }, "d",
    R`Para partículas, $I=\sum m_ir_i^2$. Como todas têm a mesma massa e a mesma distância, $I=3\left(2{,}0\right)\left(0{,}50\right)^2=3(2{,}0)(0{,}25)=1{,}5$ kg·m².`),

  q("Rotação de Corpo Rígido", "Energia cinética de rotação", "facil",
    R`Um volante de momento de inércia $0{,}50$ kg·m² gira a $20$ rad/s. Determine sua energia cinética de rotação.`,
    { a: R`$10$ J`, b: R`$50$ J`, c: R`$100$ J`, d: R`$200$ J`, e: R`$5{,}0$ J` }, "c",
    R`A energia cinética de rotação é $K=\dfrac12I\omega^2=\dfrac12(0{,}50)(20)^2=\dfrac12(0{,}50)(400)=100$ J.`),

  q("Rotação de Corpo Rígido", "Momento angular de uma partícula", "medio",
    R`Uma partícula de $0{,}20$ kg move-se em linha reta a $10$ m/s, passando a uma distância perpendicular de $3{,}0$ m de um ponto $O$. Determine o módulo de seu momento angular em relação a $O$.`,
    { a: R`$2{,}0$ kg·m²/s`, b: R`$6{,}0$ kg·m²/s`, c: R`$30$ kg·m²/s`, d: R`$0{,}60$ kg·m²/s`, e: R`$60$ kg·m²/s` }, "b",
    R`O momento angular é $L=\left|\vec{r}\times\vec{p}\right|=mvd$, em que $d$ é a distância perpendicular (o braço) entre a reta do movimento e o ponto. Assim $L=0{,}20(10)(3{,}0)=6{,}0$ kg·m²/s. Mesmo em movimento retilíneo o momento angular em relação a um ponto fora da reta é não nulo — e constante.`),

  q("Gravitação", "Lei da gravitação universal", "medio",
    R`Determine o módulo da força gravitacional entre duas esferas homogêneas de $100$ kg e $200$ kg, cujos centros distam $2{,}0$ m. Use $G=6{,}67\times 10^{-11}$ N·m²/kg².`,
    {
      a: R`$1{,}3\times 10^{-6}$ N`, b: R`$6{,}7\times 10^{-7}$ N`, c: R`$3{,}3\times 10^{-6}$ N`,
      d: R`$1{,}7\times 10^{-7}$ N`, e: R`$3{,}3\times 10^{-7}$ N`,
    }, "e",
    R`Pela lei da gravitação, $F=G\dfrac{m_1m_2}{r^2}=6{,}67\times 10^{-11}\cdot\dfrac{100\cdot 200}{(2{,}0)^2}=6{,}67\times 10^{-11}\cdot 5000\approx 3{,}3\times 10^{-7}$ N. O valor minúsculo mostra por que a gravitação só é perceptível quando um dos corpos tem massa astronômica.`),

  q("Gravitação", "Período de órbita rasante", "dificil",
    R`Determine o período de um satélite em órbita circular rasante à superfície terrestre, com $R_T=6{,}4\times 10^{6}$ m e $g=10$ m/s².`,
    { a: R`$84$ min`, b: R`$24$ h`, c: R`$42$ min`, d: R`$168$ min`, e: R`$12$ h` }, "a",
    R`Na órbita rasante, a gravidade fornece a resultante centrípeta: $g=\dfrac{4\pi^2R_T}{T^2}$, de onde $T=2\pi\sqrt{\dfrac{R_T}{g}}=2\pi\sqrt{\dfrac{6{,}4\times 10^{6}}{10}}=2\pi\sqrt{6{,}4\times 10^{5}}=2\pi(800)\approx 5{,}0\times 10^{3}$ s, isto é, cerca de $84$ minutos.`),

  q("Gravitação", "Variação da energia potencial gravitacional", "dificil",
    R`Determine o trabalho necessário para levar um corpo de $1000$ kg da superfície da Terra até uma altitude igual ao raio terrestre, desprezando a rotação e a resistência do ar. Use $R_T=6{,}4\times 10^{6}$ m e $g=10$ m/s².`,
    {
      a: R`$6{,}4\times 10^{10}$ J`, b: R`$1{,}6\times 10^{10}$ J`, c: R`$6{,}4\times 10^{7}$ J`,
      d: R`$3{,}2\times 10^{10}$ J`, e: R`$1{,}3\times 10^{11}$ J`,
    }, "d",
    R`A energia potencial é $U=-\dfrac{GMm}{r}$. Indo de $r=R_T$ a $r=2R_T$: $\Delta U=GMm\left(\dfrac{1}{R_T}-\dfrac{1}{2R_T}\right)=\dfrac{GMm}{2R_T}$. Usando $GM=gR_T^2$: $\Delta U=\dfrac{mgR_T}{2}=\dfrac{1000(10)\left(6{,}4\times 10^{6}\right)}{2}=3{,}2\times 10^{10}$ J. Usar $mgh$ daria $6{,}4\times 10^{10}$ J, errado porque $g$ não é constante nessa escala.`),

  q("Oscilações", "Frequência do oscilador massa-mola", "medio",
    R`Um bloco de $0{,}20$ kg preso a uma mola de constante $80$ N/m oscila em MHS. Determine a frequência do movimento.`,
    { a: R`$20$ Hz`, b: R`$0{,}31$ Hz`, c: R`$3{,}2$ Hz`, d: R`$6{,}3$ Hz`, e: R`$400$ Hz` }, "c",
    R`A frequência angular é $\omega=\sqrt{\dfrac{k}{m}}=\sqrt{\dfrac{80}{0{,}20}}=\sqrt{400}=20$ rad/s. A frequência é $f=\dfrac{\omega}{2\pi}=\dfrac{20}{6{,}28}\approx 3{,}2$ Hz.`),

  q("Oscilações", "Aceleração máxima no MHS", "facil",
    R`Um oscilador harmônico simples tem frequência angular $20$ rad/s e amplitude $0{,}050$ m. Determine o módulo de sua aceleração máxima.`,
    { a: R`$1{,}0$ m/s²`, b: R`$20$ m/s²`, c: R`$10$ m/s²`, d: R`$400$ m/s²`, e: R`$2{,}0$ m/s²` }, "b",
    R`No MHS, $a=-\omega^2x$, de modo que o módulo máximo ocorre nos extremos, onde $\left|x\right|=A$: $a_{max}=\omega^2A=(20)^2(0{,}050)=400(0{,}050)=20$ m/s².`),

  q("Oscilações", "Pêndulo simples em outro planeta", "medio",
    R`Um pêndulo simples tem período de $2{,}0$ s na Terra, onde $g=10$ m/s². Determine seu período em um planeta cuja gravidade é $2{,}5$ m/s².`,
    { a: R`$1{,}0$ s`, b: R`$8{,}0$ s`, c: R`$2{,}0$ s`, d: R`$0{,}50$ s`, e: R`$4{,}0$ s` }, "e",
    R`Como $T=2\pi\sqrt{\dfrac{L}{g}}$ e o comprimento não muda, $T\propto\dfrac{1}{\sqrt{g}}$. Reduzir $g$ por um fator $4$ multiplica o período por $\sqrt4=2$, logo $T'=2\left(2{,}0\right)=4{,}0$ s.`),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "fisica1_lote3.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
