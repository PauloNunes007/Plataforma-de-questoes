// Lote 3 de Física II — cobre os 9 tópicos ainda mais rasos, com destaque
// para Oscilações Eletromagnéticas e CA (o menos coberto do banco).
// Estilo Halliday-Resnick-Walker / Young & Freedman.
// Rode: node listas_questoes/gerado/scripts/fisica2_lote3.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const R = String.raw;
const MATERIA = "Física II";

const q = (topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao) => ({
  materia: MATERIA, topico, subtopico, dificuldade, enunciado, alternativas, gabarito, resolucao,
  instituicao: null, ano: null, tikz_code: null,
});

const questoes = [
  q("A Lei de Coulomb", "Quantização da carga elétrica", "facil",
    R`Um corpo inicialmente neutro perde $5{,}0\times 10^{12}$ elétrons por atrito. Sabendo que $e=1{,}6\times 10^{-19}$ C, determine sua carga elétrica final.`,
    { a: R`$-0{,}80\ \mu$C`, b: R`$+0{,}80\ \mu$C`, c: R`$+8{,}0\ \mu$C`, d: R`$+1{,}6\ \mu$C`, e: R`$+0{,}16\ \mu$C` }, "b",
    R`Perder elétrons deixa o corpo positivo. Pela quantização, $Q=ne=\left(5{,}0\times 10^{12}\right)\left(1{,}6\times 10^{-19}\right)=8{,}0\times 10^{-7}$ C $=+0{,}80\ \mu$C.`),

  q("A Lei de Coulomb", "Dependência da força com a distância", "facil",
    R`Duas cargas puntiformes separadas por $30$ cm se repelem com força de $8{,}0$ N. Determine a força de repulsão quando a separação passa a $60$ cm.`,
    { a: R`$4{,}0$ N`, b: R`$16$ N`, c: R`$8{,}0$ N`, d: R`$2{,}0$ N`, e: R`$32$ N` }, "d",
    R`A lei de Coulomb dá $F\propto\dfrac{1}{r^2}$. Dobrar a distância divide a força por $2^2=4$, logo $F'=\dfrac{8{,}0}{4}=2{,}0$ N.`),

  q("A Lei de Coulomb", "Superposição em cargas colineares", "dificil",
    R`Três cargas estão sobre um eixo: $q_1=+1{,}0\ \mu$C em $x=0$, $q_2=-2{,}0\ \mu$C em $x=0{,}10$ m e $q_3=+3{,}0\ \mu$C em $x=0{,}20$ m. Determine o módulo da força resultante sobre $q_2$. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    { a: R`$3{,}6$ N`, b: R`$7{,}2$ N`, c: R`$1{,}8$ N`, d: R`$5{,}4$ N`, e: R`$0$` }, "a",
    R`A força de $q_1$ sobre $q_2$ é atrativa e aponta para $-x$: $F_{12}=\dfrac{9{,}0\times 10^{9}\left(1{,}0\times 10^{-6}\right)\left(2{,}0\times 10^{-6}\right)}{(0{,}10)^2}=1{,}8$ N. A de $q_3$ sobre $q_2$ também é atrativa, mas aponta para $+x$: $F_{32}=\dfrac{9{,}0\times 10^{9}\left(2{,}0\times 10^{-6}\right)\left(3{,}0\times 10^{-6}\right)}{(0{,}10)^2}=5{,}4$ N. A resultante é $5{,}4-1{,}8=3{,}6$ N, no sentido $+x$.`),

  q("O Campo Elétrico", "Campo de carga puntiforme", "facil",
    R`Determine o módulo do campo elétrico produzido por uma carga de $2{,}0\ \mu$C a $30$ cm de distância. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$6{,}0\times 10^{4}$ N/C`, b: R`$1{,}8\times 10^{5}$ N/C`, c: R`$2{,}0\times 10^{4}$ N/C`,
      d: R`$6{,}7\times 10^{4}$ N/C`, e: R`$2{,}0\times 10^{5}$ N/C`,
    }, "e",
    R`Para uma carga puntiforme, $E=\dfrac{kQ}{r^2}=\dfrac{9{,}0\times 10^{9}\left(2{,}0\times 10^{-6}\right)}{(0{,}30)^2}=\dfrac{1{,}8\times 10^{4}}{0{,}090}=2{,}0\times 10^{5}$ N/C.`),

  q("O Campo Elétrico", "Força sobre carga negativa", "facil",
    R`Uma carga de $-3{,}0\ \mu$C é colocada em uma região de campo elétrico uniforme de módulo $4{,}0\times 10^{4}$ N/C. Determine o módulo da força elétrica sobre ela.`,
    { a: R`$1{,}2$ N`, b: R`$0{,}012$ N`, c: R`$0{,}12$ N`, d: R`$12$ N`, e: R`$1{,}3\times 10^{10}$ N` }, "c",
    R`O módulo é $F=\left|q\right|E=\left(3{,}0\times 10^{-6}\right)\left(4{,}0\times 10^{4}\right)=0{,}12$ N. Por a carga ser negativa, a força tem sentido oposto ao do campo.`),

  q("O Campo Elétrico", "Experimento da gota de óleo", "dificil",
    R`Uma gotícula de óleo de massa $1{,}6\times 10^{-15}$ kg fica em equilíbrio dentro de um campo elétrico vertical de $1{,}0\times 10^{4}$ N/C. Adotando $g=10$ m/s² e $e=1{,}6\times 10^{-19}$ C, determine o número de elétrons em excesso na gota.`,
    { a: R`$10$`, b: R`$1$`, c: R`$100$`, d: R`$16$`, e: R`$1000$` }, "a",
    R`O equilíbrio exige $qE=mg$, logo $q=\dfrac{mg}{E}=\dfrac{\left(1{,}6\times 10^{-15}\right)(10)}{1{,}0\times 10^{4}}=1{,}6\times 10^{-18}$ C. Como a carga é quantizada, $n=\dfrac{1{,}6\times 10^{-18}}{1{,}6\times 10^{-19}}=10$ elétrons. É a essência do experimento de Millikan.`),

  q("A Lei de Gauss", "Condutor em equilíbrio eletrostático", "dificil",
    R`Uma casca esférica condutora de raio $10$ cm possui carga $4{,}0\ \mu$C distribuída em sua superfície. Determine o potencial elétrico em um ponto a $5{,}0$ cm do centro. Use $k=9{,}0\times 10^{9}$ N·m²/C².`,
    {
      a: R`$1{,}8\times 10^{5}$ V`, b: R`$7{,}2\times 10^{5}$ V`, c: R`$3{,}6\times 10^{6}$ V`,
      d: R`$3{,}6\times 10^{5}$ V`, e: R`$1{,}4\times 10^{7}$ V`,
    }, "d",
    R`Pela lei de Gauss, o campo é nulo dentro da casca: a superfície gaussiana de raio $5{,}0$ cm não envolve carga alguma. Campo nulo implica potencial constante em toda a região interna, e por continuidade esse valor é o da própria superfície: $V=\dfrac{kQ}{R}=\dfrac{9{,}0\times 10^{9}\left(4{,}0\times 10^{-6}\right)}{0{,}10}=3{,}6\times 10^{5}$ V. Atenção: usa-se o raio da casca, $R=0{,}10$ m, e não a distância $0{,}050$ m ao centro.`),

  q("A Lei de Gauss", "Simetria planar", "medio",
    R`Um plano infinito não condutor tem densidade superficial de carga $\sigma=8{,}85\times 10^{-9}$ C/m². Adotando $\varepsilon_0=8{,}85\times 10^{-12}$ C²/(N·m²), determine o módulo do campo elétrico nas proximidades do plano.`,
    { a: R`$1000$ N/C`, b: R`$500$ N/C`, c: R`$250$ N/C`, d: R`$2000$ N/C`, e: R`$125$ N/C` }, "b",
    R`Aplicando a lei de Gauss a um cilindro que atravessa o plano, o fluxo sai pelas duas tampas, o que dá $E=\dfrac{\sigma}{2\varepsilon_0}=\dfrac{8{,}85\times 10^{-9}}{2\left(8{,}85\times 10^{-12}\right)}=500$ N/C. O campo é uniforme e não depende da distância ao plano.`),

  q("Potencial Elétrico", "Campo uniforme entre placas", "facil",
    R`As placas paralelas de um capacitor estão separadas por $2{,}0$ mm e submetidas a uma diferença de potencial de $100$ V. Determine o módulo do campo elétrico entre elas.`,
    {
      a: R`$2{,}0\times 10^{2}$ V/m`, b: R`$5{,}0\times 10^{3}$ V/m`, c: R`$2{,}0\times 10^{5}$ V/m`,
      d: R`$5{,}0\times 10^{2}$ V/m`, e: R`$5{,}0\times 10^{4}$ V/m`,
    }, "e",
    R`Para campo uniforme, $E=\dfrac{U}{d}=\dfrac{100}{2{,}0\times 10^{-3}}=5{,}0\times 10^{4}$ V/m. A relação vem de $U=\int\vec{E}\cdot d\vec{\ell}$ com $\vec{E}$ constante e paralelo ao deslocamento.`),

  q("Potencial Elétrico", "Aceleração de elétron por diferença de potencial", "dificil",
    R`Um elétron parte do repouso e é acelerado por uma diferença de potencial de $100$ V. Usando $e=1{,}6\times 10^{-19}$ C e $m=9{,}11\times 10^{-31}$ kg, determine sua velocidade final.`,
    {
      a: R`$1{,}9\times 10^{6}$ m/s`, b: R`$3{,}5\times 10^{13}$ m/s`, c: R`$5{,}9\times 10^{6}$ m/s`,
      d: R`$1{,}2\times 10^{7}$ m/s`, e: R`$4{,}2\times 10^{5}$ m/s`,
    }, "c",
    R`O trabalho do campo vira energia cinética: $eU=\dfrac{mv^2}{2}$, logo $v=\sqrt{\dfrac{2eU}{m}}=\sqrt{\dfrac{2\left(1{,}6\times 10^{-19}\right)(100)}{9{,}11\times 10^{-31}}}=\sqrt{3{,}5\times 10^{13}}\approx 5{,}9\times 10^{6}$ m/s — cerca de $2\%$ da velocidade da luz, o que ainda dispensa correção relativística.`),

  q("Capacitores e Capacitância", "Associação em paralelo", "facil",
    R`Três capacitores, de $2{,}0\ \mu$F, $3{,}0\ \mu$F e $5{,}0\ \mu$F, são ligados em paralelo a uma fonte de $20$ V. Determine a carga total armazenada.`,
    { a: R`$200\ \mu$C`, b: R`$20\ \mu$C`, c: R`$100\ \mu$C`, d: R`$21{,}5\ \mu$C`, e: R`$600\ \mu$C` }, "a",
    R`Em paralelo as capacitâncias se somam: $C_{eq}=2{,}0+3{,}0+5{,}0=10\ \mu$F. Todos ficam sob a mesma tensão, logo $Q=C_{eq}U=\left(10\times 10^{-6}\right)(20)=2{,}0\times 10^{-4}$ C $=200\ \mu$C.`),

  q("Capacitores e Capacitância", "Capacitor de placas paralelas no vácuo", "medio",
    R`Um capacitor de placas paralelas no vácuo tem área de $100$ cm² e separação de $0{,}50$ mm. Adotando $\varepsilon_0=8{,}85\times 10^{-12}$ F/m, determine sua capacitância.`,
    {
      a: R`$8{,}9\times 10^{-11}$ F`, b: R`$1{,}8\times 10^{-8}$ F`, c: R`$4{,}4\times 10^{-10}$ F`,
      d: R`$1{,}8\times 10^{-10}$ F`, e: R`$8{,}9\times 10^{-13}$ F`,
    }, "d",
    R`Convertendo, $A=100$ cm² $=1{,}0\times 10^{-2}$ m² e $d=5{,}0\times 10^{-4}$ m. Então $C=\dfrac{\varepsilon_0A}{d}=\dfrac{\left(8{,}85\times 10^{-12}\right)\left(1{,}0\times 10^{-2}\right)}{5{,}0\times 10^{-4}}=1{,}77\times 10^{-10}$ F, ou cerca de $177$ pF.`),

  q("Corrente e Resistência Elétricas", "Carga transportada pela corrente", "facil",
    R`Uma corrente constante de $2{,}5$ A percorre um condutor durante $4{,}0$ minutos. Determine a carga total que atravessa uma seção reta do fio.`,
    { a: R`$10$ C`, b: R`$600$ C`, c: R`$150$ C`, d: R`$60$ C`, e: R`$1{,}0$ C` }, "b",
    R`Para corrente constante, $Q=I\Delta t$. Convertendo o tempo, $4{,}0$ min $=240$ s, logo $Q=2{,}5(240)=600$ C.`),

  q("Corrente e Resistência Elétricas", "Variação da resistência com a temperatura", "medio",
    R`Um resistor de $100\ \Omega$ a $20\,^{\circ}$C tem coeficiente de temperatura $\alpha=4{,}0\times 10^{-3}\ ^{\circ}$C$^{-1}$. Determine sua resistência a $70\,^{\circ}$C.`,
    { a: R`$104\ \Omega$`, b: R`$140\ \Omega$`, c: R`$100{,}2\ \Omega$`, d: R`$80\ \Omega$`, e: R`$120\ \Omega$` }, "e",
    R`Usando $R=R_0\left(1+\alpha\Delta T\right)$ com $\Delta T=70-20=50\,^{\circ}$C: $R=100\left[1+\left(4{,}0\times 10^{-3}\right)(50)\right]=100(1+0{,}20)=120\ \Omega$.`),

  q("Corrente e Resistência Elétricas", "Condutividade e resistividade", "facil",
    R`Um material tem resistividade $\rho=2{,}0\times 10^{-8}\ \Omega\cdot$m. Determine sua condutividade elétrica.`,
    {
      a: R`$2{,}0\times 10^{8}$ S/m`, b: R`$5{,}0\times 10^{-8}$ S/m`, c: R`$5{,}0\times 10^{7}$ S/m`,
      d: R`$2{,}0\times 10^{-8}$ S/m`, e: R`$5{,}0\times 10^{8}$ S/m`,
    }, "c",
    R`A condutividade é o inverso da resistividade: $\sigma=\dfrac{1}{\rho}=\dfrac{1}{2{,}0\times 10^{-8}}=5{,}0\times 10^{7}$ S/m — valor típico de um bom condutor metálico.`),

  q("Circuitos de Corrente Contínua", "Resistores iguais em paralelo", "facil",
    R`Três resistores de $6{,}0\ \Omega$ cada são ligados em paralelo. Determine a resistência equivalente.`,
    { a: R`$2{,}0\ \Omega$`, b: R`$18\ \Omega$`, c: R`$3{,}0\ \Omega$`, d: R`$0{,}50\ \Omega$`, e: R`$6{,}0\ \Omega$` }, "a",
    R`Para $n$ resistores iguais em paralelo, $R_{eq}=\dfrac{R}{n}=\dfrac{6{,}0}{3}=2{,}0\ \Omega$. A equivalente em paralelo é sempre menor que a menor das resistências associadas.`),

  q("Circuitos de Corrente Contínua", "Energia dissipada por efeito Joule", "medio",
    R`Um resistor de $10\ \Omega$ é percorrido por corrente de $3{,}0$ A durante $2{,}0$ minutos. Determine a energia dissipada.`,
    {
      a: R`$180$ J`, b: R`$90$ J`, c: R`$1{,}8\times 10^{3}$ J`,
      d: R`$1{,}08\times 10^{4}$ J`, e: R`$3{,}6\times 10^{3}$ J`,
    }, "d",
    R`A potência dissipada é $P=Ri^2=10(3{,}0)^2=90$ W. Em $\Delta t=120$ s, a energia é $E=P\Delta t=90(120)=1{,}08\times 10^{4}$ J.`),

  q("Circuitos de Corrente Contínua", "Divisor de tensão", "facil",
    R`Dois resistores, $R_1=3{,}0\ \Omega$ e $R_2=9{,}0\ \Omega$, são ligados em série a uma fonte ideal de $12$ V. Determine a diferença de potencial em $R_2$.`,
    { a: R`$3{,}0$ V`, b: R`$9{,}0$ V`, c: R`$6{,}0$ V`, d: R`$12$ V`, e: R`$4{,}0$ V` }, "b",
    R`A corrente é $i=\dfrac{12}{3{,}0+9{,}0}=1{,}0$ A, logo $U_2=R_2i=9{,}0$ V. Equivalentemente, pelo divisor de tensão, $U_2=U\dfrac{R_2}{R_1+R_2}=12\cdot\dfrac{9}{12}=9{,}0$ V.`),

  q("Indução Eletromagnética", "Lei de Faraday com campo variável", "medio",
    R`Uma espira plana de área $0{,}020$ m² está imersa em um campo magnético perpendicular ao seu plano, que decresce uniformemente de $0{,}50$ T a zero em $0{,}10$ s. Determine o módulo da força eletromotriz induzida.`,
    { a: R`$1{,}0$ V`, b: R`$0{,}010$ V`, c: R`$0{,}50$ V`, d: R`$0{,}0010$ V`, e: R`$0{,}10$ V` }, "e",
    R`Pela lei de Faraday, $\left|\varepsilon\right|=\left|\dfrac{d\Phi}{dt}\right|=A\left|\dfrac{dB}{dt}\right|=0{,}020\cdot\dfrac{0{,}50}{0{,}10}=0{,}020(5{,}0)=0{,}10$ V. Pela lei de Lenz, a corrente induzida circula de modo a se opor à diminuição do fluxo.`),

  q("Indução Eletromagnética", "Força eletromotriz de movimento", "facil",
    R`Uma barra condutora de $0{,}50$ m desliza perpendicularmente a um campo magnético uniforme de $0{,}20$ T, com velocidade de $4{,}0$ m/s perpendicular tanto à barra quanto ao campo. Determine a fem induzida.`,
    { a: R`$0{,}10$ V`, b: R`$1{,}0$ V`, c: R`$0{,}40$ V`, d: R`$0{,}80$ V`, e: R`$4{,}0$ V` }, "c",
    R`Para a barra deslizante, $\varepsilon=B\ell v=0{,}20(0{,}50)(4{,}0)=0{,}40$ V. Essa fem resulta da força magnética $q\vec{v}\times\vec{B}$ que separa as cargas ao longo da barra.`),

  q("Indução Eletromagnética", "Energia armazenada em indutor", "medio",
    R`Um indutor de $0{,}50$ H é percorrido por corrente de $3{,}0$ A. Determine a energia magnética armazenada.`,
    { a: R`$2{,}25$ J`, b: R`$0{,}75$ J`, c: R`$4{,}5$ J`, d: R`$1{,}5$ J`, e: R`$9{,}0$ J` }, "a",
    R`A energia armazenada no campo magnético do indutor é $U=\dfrac12Li^2=\dfrac12(0{,}50)(3{,}0)^2=\dfrac12(0{,}50)(9{,}0)=2{,}25$ J.`),

  q("Oscilações Eletromagnéticas e CA", "Frequência de oscilação do circuito LC", "medio",
    R`Um circuito LC ideal é formado por um indutor de $1{,}0$ H e um capacitor de $1{,}0\ \mu$F. Determine a frequência angular das oscilações.`,
    {
      a: R`$10$ rad/s`, b: R`$1{,}0\times 10^{6}$ rad/s`, c: R`$100$ rad/s`,
      d: R`$1{,}0\times 10^{3}$ rad/s`, e: R`$1{,}0\times 10^{-6}$ rad/s`,
    }, "d",
    R`No circuito LC ideal a carga oscila harmonicamente com $\omega=\dfrac{1}{\sqrt{LC}}=\dfrac{1}{\sqrt{\left(1{,}0\right)\left(1{,}0\times 10^{-6}\right)}}=\dfrac{1}{1{,}0\times 10^{-3}}=1{,}0\times 10^{3}$ rad/s. A energia migra periodicamente do capacitor para o indutor e vice-versa.`),

  q("Oscilações Eletromagnéticas e CA", "Impedância de circuito RLC série", "medio",
    R`Em um circuito RLC série, $R=30\ \Omega$, a reatância indutiva vale $80\ \Omega$ e a capacitiva, $40\ \Omega$. Determine a impedância do circuito.`,
    { a: R`$150\ \Omega$`, b: R`$50\ \Omega$`, c: R`$70\ \Omega$`, d: R`$110\ \Omega$`, e: R`$30\ \Omega$` }, "b",
    R`A reatância líquida é $X=X_L-X_C=80-40=40\ \Omega$. No diagrama de fasores, $R$ e $X$ são catetos e a impedância é a hipotenusa: $Z=\sqrt{R^2+X^2}=\sqrt{900+1600}=\sqrt{2500}=50\ \Omega$.`),

  q("Oscilações Eletromagnéticas e CA", "Valor eficaz em corrente alternada", "facil",
    R`Uma tensão alternada senoidal tem valor de pico de $311$ V. Determine seu valor eficaz.`,
    { a: R`$311$ V`, b: R`$440$ V`, c: R`$156$ V`, d: R`$127$ V`, e: R`$220$ V` }, "e",
    R`Para uma onda senoidal, $V_{ef}=\dfrac{V_{max}}{\sqrt2}=\dfrac{311}{1{,}414}\approx 220$ V. O valor eficaz é aquele que produziria a mesma potência média de uma tensão contínua de igual valor — daí a rede de $220$ V ter picos de cerca de $311$ V.`),
];

const aqui = dirname(fileURLToPath(import.meta.url));
const saida = resolve(aqui, "..", "fisica2_lote3.json");
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify(questoes, null, 2), "utf8");
console.log(`${questoes.length} questoes escritas em ${saida}`);
