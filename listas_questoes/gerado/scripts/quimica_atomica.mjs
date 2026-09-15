// Leva de equalização de Química Geral — tópico 1 da ementa:
// "Estrutura Atômica e Tabela Periódica" (radiação eletromagnética, modelo de
// Bohr, dualidade partícula-onda, modelo quântico, configurações eletrônicas,
// tendências periódicas).
//
// Era o tópico mais defasado do banco: 28 questões no fluxo normal contra 61 de
// Termodinâmica. Estas 47 fecham o tópico em 75.
//
// Estilo: banca da UFF — pergunta o FENÔMENO. Conta só quando cabe numa linha
// (E = hν − Φ, λν = c, E_n = −13,6/n²). Ver `quimica_kit.mjs`.
import { criarLote, T1 } from "./quimica_kit.mjs";

const { qa, finalizar } = criarLote({ arquivo: "quimica_atomica.json", semente: 20260915 });

// --- Radiação eletromagnética e natureza quântica da luz -------------------

qa({
  t: T1,
  sub: "Efeito fotoelétrico e frequência de corte",
  dif: "medio",
  e: String.raw`Uma placa de potássio iluminada por luz vermelha intensa não emite elétron algum, mas emite elétrons imediatamente sob luz violeta de intensidade muito baixa. Esse resultado mostra que a emissão é governada:`,
  ok: "Pela frequência da radiação incidente.",
  err: [
    "Pela intensidade da radiação incidente.",
    "Pelo tempo total de exposição da placa.",
    "Pela potência total emitida pela fonte.",
    "Pelo ângulo de incidência sobre a placa.",
  ],
  r: String.raw`Se a luz fosse apenas uma onda clássica, bastaria esperar: energia suficiente se acumularia na placa e o elétron sairia, não importa a cor. Não é o que se observa.

Einstein explicou o fenômeno tratando a luz como pacotes de energia $E = h\nu$. Um elétron absorve UM fóton inteiro; se esse fóton não trouxer, sozinho, a energia mínima para vencer a função trabalho do metal, o elétron não escapa — e aumentar a intensidade só aumenta o NÚMERO de fótons, todos igualmente fracos demais.

A luz violeta tem frequência maior, logo fóton mais energético, e arranca elétron mesmo fraca. A intensidade controla quantos elétrons saem; a frequência controla se algum sai.`,
});

qa({
  t: T1,
  sub: "Efeito fotoelétrico e energia cinética do fotoelétron",
  dif: "medio",
  e: String.raw`A função trabalho de certo metal vale $3{,}0$ eV. Ao ser iluminado por fótons de $5{,}0$ eV, a energia cinética máxima dos elétrons emitidos é:`,
  ok: String.raw`$2{,}0$ eV`,
  err: [String.raw`$1{,}5$ eV`, String.raw`$3{,}0$ eV`, String.raw`$5{,}0$ eV`, String.raw`$8{,}0$ eV`],
  r: String.raw`A equação do efeito fotoelétrico é um balanço de energia direto:

$$E_{c,\max} = h\nu - \Phi$$

O fóton entrega $5{,}0$ eV. Desses, $3{,}0$ eV são gastos só para arrancar o elétron da superfície (a função trabalho $\Phi$). O que sobra vira energia de movimento:

$$E_{c,\max} = 5{,}0 - 3{,}0 = 2{,}0\ \text{eV}$$

É o MÁXIMO porque elétrons mais internos gastam mais que $\Phi$ para chegar à superfície e saem mais lentos.`,
});

qa({
  t: T1,
  sub: "Espectro eletromagnético e energia do fóton",
  dif: "facil",
  e: String.raw`Considere as seguintes regiões do espectro eletromagnético: ondas de rádio, micro-ondas, infravermelho, luz visível e ultravioleta. O fóton de MAIOR energia pertence à região:`,
  ok: "Do ultravioleta.",
  err: ["Das ondas de rádio.", "Das micro-ondas.", "Do infravermelho.", "Da luz visível."],
  r: String.raw`A energia do fóton cresce com a frequência e cai com o comprimento de onda:

$$E = h\nu = \frac{hc}{\lambda}$$

Na ordem crescente de energia: rádio $<$ micro-ondas $<$ infravermelho $<$ visível $<$ ultravioleta $<$ raios X $<$ raios gama.

Isso tem consequência química direta: só a partir do ultravioleta o fóton carrega energia comparável à de uma ligação química, e é por isso que o UV degrada polímeros e danifica o DNA enquanto o infravermelho apenas aquece, excitando vibrações.`,
});

qa({
  t: T1,
  sub: "Relação entre comprimento de onda e frequência",
  dif: "medio",
  e: String.raw`Uma radiação monocromática tem comprimento de onda de $600$ nm. Adotando $c = 3{,}0 \times 10^8$ m/s, sua frequência vale:`,
  ok: String.raw`$5{,}0 \times 10^{14}$ Hz`,
  err: [
    String.raw`$1{,}8 \times 10^{14}$ Hz`,
    String.raw`$2{,}0 \times 10^{15}$ Hz`,
    String.raw`$5{,}0 \times 10^{11}$ Hz`,
    String.raw`$1{,}8 \times 10^{17}$ Hz`,
  ],
  r: String.raw`Para qualquer onda eletromagnética no vácuo vale $\lambda\nu = c$.

O cuidado está na unidade: $600$ nm são $600 \times 10^{-9}$ m $= 6{,}0 \times 10^{-7}$ m.

$$\nu = \frac{c}{\lambda} = \frac{3{,}0 \times 10^8}{6{,}0 \times 10^{-7}} = 5{,}0 \times 10^{14}\ \text{Hz}$$

Esse valor cai bem no meio do visível — é luz alaranjada.`,
});

qa({
  t: T1,
  sub: "Comparação de energia entre fótons",
  dif: "medio",
  e: String.raw`Um fóton de radiação ultravioleta tem comprimento de onda de $250$ nm e um fóton de luz vermelha, de $750$ nm. A razão entre a energia do fóton ultravioleta e a do fóton vermelho vale:`,
  ok: String.raw`$3$`,
  err: [String.raw`$0{,}33$`, String.raw`$0{,}5$`, String.raw`$2$`, String.raw`$9$`],
  r: String.raw`Como $E = hc/\lambda$, a energia é inversamente proporcional ao comprimento de onda. Ao dividir uma pela outra, $h$ e $c$ se cancelam:

$$\frac{E_{\text{UV}}}{E_{\text{vermelho}}} = \frac{\lambda_{\text{vermelho}}}{\lambda_{\text{UV}}} = \frac{750}{250} = 3$$

Um terço do comprimento de onda significa o triplo da energia por fóton. É por isso que a radiação ultravioleta dispara processos fotoquímicos — quebra de ligações em polímeros, danos ao DNA — que a luz vermelha, por mais intensa que seja, não provoca.`,
});

qa({
  t: T1,
  sub: "Diferença de energia e comprimento de onda emitido",
  dif: "medio",
  e: String.raw`Um átomo excitado pode decair por diferentes transições. Aquela que produz luz de MAIOR comprimento de onda é a transição com:`,
  ok: "Menor diferença de energia entre os níveis.",
  err: [
    "Maior diferença de energia entre os níveis.",
    "Maior frequência da radiação emitida.",
    "Maior número quântico do nível final.",
    "Maior número de elétrons envolvidos.",
  ],
  r: String.raw`O fóton emitido carrega exatamente a diferença de energia entre os dois níveis:

$$\Delta E = h\nu = \frac{hc}{\lambda}$$

Isolando, $\lambda = hc/\Delta E$: comprimento de onda e salto de energia são inversamente proporcionais. Um salto pequeno produz fóton pouco energético, ou seja, de comprimento de onda longo, tendendo ao infravermelho.

Por isso, no hidrogênio, as transições que terminam em $n = 3$ (saltos pequenos, série de Paschen) caem no infravermelho, enquanto as que terminam em $n = 1$ (saltos grandes, série de Lyman) caem no ultravioleta.`,
});

// --- Modelo de Bohr e espectros --------------------------------------------

qa({
  t: T1,
  sub: "Modelo de Bohr — raio das órbitas",
  dif: "medio",
  e: String.raw`No modelo de Bohr para o átomo de hidrogênio o raio da órbita permitida é proporcional a $n^2$. O raio da órbita com $n = 3$ supera o da órbita com $n = 1$ em:`,
  ok: String.raw`$9$ vezes`,
  err: [String.raw`$3$ vezes`, String.raw`$6$ vezes`, String.raw`$12$ vezes`, String.raw`$27$ vezes`],
  r: String.raw`Bohr obteve, para o hidrogênio,

$$r_n = a_0\,n^2, \qquad a_0 \approx 0{,}529\ \text{Å}$$

Logo $r_3/r_1 = 3^2/1^2 = 9$.

Vale notar o contraste com a energia, que vai com $-1/n^2$: à medida que o elétron sobe de nível, ele se afasta rapidamente do núcleo (raio cresce com $n^2$) e, ao mesmo tempo, os níveis vão ficando cada vez mais próximos em energia, até convergirem no limite da ionização.`,
});

qa({
  t: T1,
  sub: "Limites do modelo de Bohr",
  dif: "medio",
  e: String.raw`O modelo de Bohr reproduz com precisão o espectro do hidrogênio, mas falha para o hélio e para qualquer átomo com mais de um elétron. A razão dessa falha é que o modelo não trata:`,
  ok: "A repulsão entre os elétrons.",
  err: [
    "A quantização da energia dos níveis.",
    "A atração entre núcleo e elétron.",
    "A emissão de radiação pelo átomo.",
    "A existência de níveis excitados.",
  ],
  r: String.raw`Bohr resolveu um problema de dois corpos: um núcleo e um elétron. A energia de cada nível saiu de um balanço entre atração coulombiana e força centrípeta, com o momento angular quantizado.

Com dois ou mais elétrons aparece um termo que o modelo simplesmente não possui: a repulsão elétron-elétron. Cada elétron passa a sentir um potencial que depende da posição dos outros, e o problema deixa de ter solução analítica.

É daí que vêm blindagem, carga nuclear efetiva e a quebra da degenerescência entre $2s$ e $2p$ — fenômenos reais que só o modelo quântico, com orbitais, descreve.`,
});

qa({
  t: T1,
  sub: "Transição eletrônica: absorção e emissão",
  dif: "facil",
  e: String.raw`Um elétron do átomo de hidrogênio passa do nível $n = 1$ para o nível $n = 3$. Esse processo corresponde a:`,
  ok: "Absorção de um fóton.",
  err: [
    "Emissão de um fóton.",
    "Emissão de dois fótons.",
    "Ionização completa do átomo.",
    "Nenhuma troca de energia.",
  ],
  r: String.raw`Os níveis do hidrogênio valem $E_n = -13{,}6/n^2$ eV, ou seja, ficam menos negativos (mais energéticos) conforme $n$ cresce.

Ir de $n = 1$ para $n = 3$ é subir em energia, e o átomo só faz isso recebendo energia de fora — absorvendo um fóton cuja energia seja exatamente $\Delta E = E_3 - E_1$.

A emissão é o caminho oposto: o elétron cai para um nível mais baixo e o átomo devolve a diferença como luz. A ionização seria o caso extremo, com o elétron levado a $n \to \infty$.`,
});

qa({
  t: T1,
  sub: "Energia de ionização a partir de estado excitado",
  dif: "medio",
  e: String.raw`No átomo de hidrogênio a energia dos níveis é $E_n = -13{,}6/n^2$ eV. A energia necessária para ionizar um átomo que já se encontra excitado no nível $n = 2$ vale:`,
  ok: String.raw`$3{,}4$ eV`,
  err: [String.raw`$1{,}5$ eV`, String.raw`$10{,}2$ eV`, String.raw`$13{,}6$ eV`, String.raw`$27{,}2$ eV`],
  r: String.raw`Ionizar é levar o elétron até $n \to \infty$, onde $E_\infty = 0$. A energia necessária é, portanto, o módulo da energia do nível de partida.

Partindo de $n = 2$:

$$E_2 = -\frac{13{,}6}{2^2} = -3{,}4\ \text{eV} \quad\Longrightarrow\quad \Delta E = 0 - (-3{,}4) = 3{,}4\ \text{eV}$$

O valor $13{,}6$ eV seria a resposta para o átomo no estado fundamental; $10{,}2$ eV é justamente a energia da transição $n = 1 \to n = 2$, e não da ionização.`,
});

qa({
  t: T1,
  sub: "Séries espectrais do hidrogênio",
  dif: "medio",
  e: String.raw`No espectro de emissão do hidrogênio, as transições que terminam em $n = 2$ produzem linhas na região do visível. As transições que terminam em $n = 1$ produzem linhas na região:`,
  ok: "Do ultravioleta.",
  err: ["Do infravermelho.", "Das micro-ondas.", "Das ondas de rádio.", "Dos raios gama."],
  r: String.raw`Quanto mais baixo o nível de chegada, maior o salto de energia e menor o comprimento de onda do fóton emitido.

As transições que caem em $n = 2$ (série de Balmer) envolvem diferenças de alguns eV e aparecem no visível — são as linhas vermelha, azul-esverdeada e violeta clássicas do tubo de hidrogênio.

Chegar em $n = 1$ (série de Lyman) exige descer até o nível mais profundo: a menor dessas transições já vale $10{,}2$ eV, energia de fóton ultravioleta. No outro extremo, terminar em $n = 3$ (Paschen) envolve saltos pequenos e cai no infravermelho.`,
});

qa({
  t: T1,
  sub: "Espectro de absorção versus de emissão",
  dif: "medio",
  e: String.raw`Luz branca de espectro contínuo atravessa vapor de sódio e o espectro resultante exibe linhas escuras exatamente nas posições em que o sódio aquecido emite linhas brilhantes. A explicação é que:`,
  ok: "Os mesmos níveis absorvem e emitem.",
  err: [
    "A absorção ocorre em níveis diferentes da emissão.",
    "O vapor espalha a luz em todas as direções.",
    "O sódio se ioniza ao receber luz branca.",
    "A luz branca não contém a cor do sódio.",
  ],
  r: String.raw`Um átomo só troca energia com a luz em parcelas iguais à diferença entre dois de seus níveis. Essa condição é a MESMA nos dois sentidos.

Na emissão, o elétron cai de um nível para outro e o fóton de energia $\Delta E$ sai. Na absorção, o átomo no estado fundamental retira do feixe contínuo justamente o fóton de energia $\Delta E$ e sobe. O que falta no feixe transmitido aparece como linha escura, na exata posição da linha brilhante.

É esse casamento que permite identificar elementos na atmosfera de estrelas: as linhas escuras do espectro solar denunciam quem está lá.`,
});

qa({
  t: T1,
  sub: "Teste de chama e emissão atômica",
  dif: "medio",
  e: String.raw`Sais de sódio conferem cor amarela à chama e sais de cobre, cor verde-azulada. A cor característica observada no teste de chama resulta de:`,
  ok: "Transições eletrônicas entre níveis quantizados.",
  err: [
    "Vibrações das moléculas do sal aquecido.",
    "Ionização completa dos átomos do metal.",
    "Reflexão da luz da chama pelo sólido.",
    "Emissão térmica contínua do ânion.",
  ],
  r: String.raw`O calor da chama excita os elétrons de valência do cátion metálico para níveis mais altos. Esse estado é instável: em frações de segundo o elétron decai, devolvendo a diferença de energia como fóton.

Como os níveis são característicos de cada elemento, o conjunto de energias emitidas — e portanto a cor resultante — funciona como impressão digital: $589$ nm (amarelo) para o sódio, tons de verde para o cobre, carmim para o lítio.

Nada disso depende do ânion, e é por isso que o ensaio identifica o metal, não o sal.`,
});

qa({
  t: T1,
  sub: "Espectro atômico como identificação do elemento",
  dif: "medio",
  e: String.raw`Cada elemento químico apresenta um conjunto único de linhas espectrais, o que permite identificá-lo à distância. Esse caráter único decorre de:`,
  ok: "Seus níveis de energia serem característicos.",
  err: [
    "Sua massa atômica ser característica.",
    "Seu número de nêutrons ser característico.",
    "Sua densidade ser característica.",
    "Seu raio atômico ser característico.",
  ],
  r: String.raw`O conjunto de energias permitidas ao elétron depende da carga nuclear e do número de elétrons, ou seja, do número atômico. Dois elementos diferentes nunca têm o mesmo arranjo de níveis.

Como cada linha do espectro corresponde a uma diferença $\Delta E$ entre dois desses níveis, o padrão de linhas é tão característico quanto uma impressão digital — e é assim que se determina a composição de estrelas, de ligas metálicas e de amostras ambientais sem tocá-las.

Massa, densidade e raio até variam de elemento para elemento, mas não é delas que a posição das linhas depende.`,
});

// --- Dualidade e modelo quântico -------------------------------------------

qa({
  t: T1,
  sub: "Dualidade partícula-onda em escala macroscópica",
  dif: "medio",
  e: String.raw`A relação de de Broglie, $\lambda = h/mv$, vale para qualquer corpo em movimento, mas não se observa comportamento ondulatório em uma bola de futebol. Isso acontece porque:`,
  ok: "Sua massa torna o comprimento de onda desprezível.",
  err: [
    "Corpos grandes não obedecem à mecânica quântica.",
    "A relação de de Broglie só vale para fótons.",
    "Sua energia cinética não é quantizada.",
    "Seu momento linear é pequeno demais.",
  ],
  r: String.raw`A constante de Planck é minúscula ($h \approx 6{,}6 \times 10^{-34}$ J$\cdot$s). O comprimento de onda de de Broglie só se torna mensurável quando o produto $mv$ também é minúsculo.

Para um elétron ($m \sim 10^{-30}$ kg) acelerado, $\lambda$ fica na faixa de angstroms — comparável ao espaçamento entre átomos de um cristal, e por isso o elétron difrata.

Para uma bola de $0{,}4$ kg a $20$ m/s, $\lambda \sim 10^{-34}$ m: um número tão menor que qualquer obstáculo existente que nenhum fenômeno de difração é possível. A física é a mesma; o que muda é a escala.`,
});

qa({
  t: T1,
  sub: "de Broglie e resolução do microscópio eletrônico",
  dif: "medio",
  e: String.raw`O microscópio eletrônico enxerga detalhes muito menores que o microscópio óptico. A razão fundamental dessa superioridade é que:`,
  ok: "O elétron acelerado tem comprimento de onda menor.",
  err: [
    "O elétron acelerado se desloca mais rápido que a luz.",
    "O feixe de elétrons tem intensidade muito maior.",
    "O elétron não sofre difração ao atravessar fendas.",
    "As lentes eletromagnéticas ampliam mais que as ópticas.",
  ],
  r: String.raw`O poder de resolução de qualquer microscópio é limitado pelo comprimento de onda da radiação usada: não se distingue detalhe muito menor que $\lambda$.

A luz visível tem $\lambda$ entre $400$ e $700$ nm, o que trava o microscópio óptico em torno de $200$ nm. Já um elétron acelerado por alguns milhares de volts tem, pela relação de de Broglie, $\lambda$ da ordem de $0{,}01$ nm.

Ou seja, a vantagem não está na lente nem na intensidade do feixe: está em usar uma onda dezenas de milhares de vezes mais curta. É o mesmo princípio que faz a difração de elétrons revelar estruturas cristalinas.`,
});

qa({
  t: T1,
  sub: "Princípio da incerteza",
  dif: "facil",
  e: String.raw`Segundo o princípio da incerteza de Heisenberg, existe um limite fundamental para a determinação simultânea e precisa de duas grandezas de um elétron. Essas grandezas são:`,
  ok: "Posição e momento linear.",
  err: ["Massa e carga elétrica.", "Energia e carga elétrica.", "Massa e momento linear.", "Posição e massa."],
  r: String.raw`A relação de Heisenberg é

$$\Delta x \cdot \Delta p \geq \frac{h}{4\pi}$$

Quanto melhor se conhece onde o elétron está, pior se conhece para onde ele vai — e vice-versa. Não é limitação do instrumento, e sim da própria natureza da matéria em escala atômica.

A consequência química é direta: falar em "órbita" do elétron, uma trajetória com posição e velocidade bem definidas a cada instante, perde sentido. Sobra a descrição probabilística — o orbital.`,
});

qa({
  t: T1,
  sub: "Significado físico do orbital",
  dif: "medio",
  e: String.raw`No modelo quântico do átomo, o termo orbital designa:`,
  ok: "Região de alta probabilidade de encontrar o elétron.",
  err: [
    "Trajetória circular percorrida pelo elétron.",
    "Superfície que contém toda a carga do átomo.",
    "Camada em que o elétron permanece em repouso.",
    "Caminho definido entre dois níveis de energia.",
  ],
  r: String.raw`A equação de Schrödinger fornece funções de onda $\psi$ para o elétron. O que tem significado físico direto é $|\psi|^2$: a densidade de probabilidade de encontrar o elétron em cada ponto do espaço.

Orbital é a região onde essa probabilidade é alta — costuma-se desenhar a superfície que engloba cerca de $90\%$ da probabilidade total, e daí vêm as formas esférica do $s$ e de haltere do $p$.

A diferença para a "órbita" de Bohr é conceitual e profunda: órbita é um caminho determinado; orbital é uma distribuição de probabilidade, imposta pelo princípio da incerteza.`,
});

qa({
  t: T1,
  sub: "Número quântico azimutal e forma do orbital",
  dif: "medio",
  e: String.raw`O número quântico secundário (azimutal) $\ell$ de um elétron está diretamente associado:`,
  ok: "À forma do orbital.",
  err: ["Ao tamanho do orbital.", "À orientação do orbital.", "Ao sentido do spin.", "À carga do núcleo."],
  r: String.raw`Os quatro números quânticos repartem a descrição do elétron:

- $n$ (principal) — o nível e, essencialmente, o tamanho do orbital;
- $\ell$ (azimutal) — o subnível e a FORMA: $\ell = 0$ é $s$ (esférico), $\ell = 1$ é $p$ (haltere), $\ell = 2$ é $d$, $\ell = 3$ é $f$;
- $m_\ell$ (magnético) — a orientação espacial do orbital;
- $m_s$ (spin) — o sentido do spin do elétron.

Para um dado $n$, $\ell$ vai de $0$ até $n - 1$, e é por isso que o nível $n = 1$ só tem orbital $s$.`,
});

qa({
  t: T1,
  sub: "Número quântico magnético e quantidade de orbitais",
  dif: "facil",
  e: String.raw`O número de orbitais existentes no subnível $3d$ é:`,
  ok: String.raw`$5$`,
  err: [String.raw`$1$`, String.raw`$3$`, String.raw`$7$`, String.raw`$10$`],
  r: String.raw`Para o subnível $d$ tem-se $\ell = 2$, e o número quântico magnético assume os valores inteiros de $-\ell$ a $+\ell$:

$$m_\ell = -2,\ -1,\ 0,\ +1,\ +2$$

São cinco valores, logo cinco orbitais — em geral $2\ell + 1$.

Como cada orbital comporta no máximo dois elétrons de spins opostos (princípio da exclusão), o subnível $d$ acomoda até $10$ elétrons. É exatamente por isso que cada série de transição da tabela periódica tem dez colunas.`,
});

qa({
  t: T1,
  sub: "Orientação espacial dos orbitais p",
  dif: "medio",
  e: String.raw`Os três orbitais $p$ de um mesmo subnível têm idêntica energia e idêntica forma, diferindo apenas na orientação espacial. Essa diferença é descrita pelo:`,
  ok: "Número quântico magnético.",
  err: [
    "Número quântico principal.",
    "Número quântico azimutal.",
    "Número quântico de spin.",
    "Valor da carga nuclear efetiva.",
  ],
  r: String.raw`Os orbitais $p_x$, $p_y$ e $p_z$ compartilham $n$ (mesmo nível) e $\ell = 1$ (mesma forma de haltere). O que os distingue é $m_\ell = -1, 0, +1$, que fixa a orientação de cada haltere ao longo de um dos três eixos.

Num átomo isolado essas três orientações têm a mesma energia — são degeneradas —, e é por isso que a regra de Hund manda ocupá-las uma a uma antes de emparelhar.

A degenerescência some na presença de campo magnético externo: os níveis se desdobram, e esse desdobramento (efeito Zeeman) foi justamente a evidência experimental que batizou o número quântico "magnético".`,
});

qa({
  t: T1,
  sub: "Princípio da exclusão de Pauli",
  dif: "facil",
  e: String.raw`Dois elétrons ocupam o mesmo orbital $2p$ de um átomo. Necessariamente esses dois elétrons diferem quanto ao:`,
  ok: "Número quântico de spin.",
  err: [
    "Número quântico principal.",
    "Número quântico azimutal.",
    "Número quântico magnético.",
    "Valor da energia do orbital.",
  ],
  r: String.raw`Um orbital é definido pelo trio $(n, \ell, m_\ell)$. Dois elétrons que ocupam o MESMO orbital já compartilham esses três números.

O princípio da exclusão de Pauli proíbe que dois elétrons de um átomo tenham os quatro números quânticos iguais. Como três já coincidem, o quarto tem de diferir: um elétron fica com $m_s = +1/2$ e o outro com $m_s = -1/2$.

É essa proibição que limita cada orbital a dois elétrons e, em cascata, define toda a arquitetura da tabela periódica.`,
});

qa({
  t: T1,
  sub: "Efeito de blindagem e camadas internas",
  dif: "medio",
  e: String.raw`A carga nuclear efetiva sentida por um elétron de valência é menor que a carga real do núcleo por causa da blindagem. A blindagem é exercida com maior eficiência pelos elétrons:`,
  ok: "De camadas internas.",
  err: ["Da mesma camada.", "Do mesmo orbital.", "De camadas mais externas.", "De átomos vizinhos."],
  r: String.raw`Blindar significa ficar, em média, ENTRE o núcleo e o elétron considerado, repelindo-o e cancelando parte da atração nuclear.

Elétrons de camadas internas passam quase todo o tempo mais perto do núcleo que o elétron de valência: blindam muito bem. Elétrons da mesma camada estão em média à mesma distância e se atrapalham pouco — blindam mal. Elétrons mais externos praticamente não blindam.

Essa hierarquia explica a tabela periódica inteira. Ao longo de um período, os elétrons novos entram na mesma camada e blindam mal, então $Z_{\text{ef}}$ cresce e o raio encolhe; ao mudar de período, uma camada interna completa é acrescentada, a blindagem dá um salto e o raio também.`,
});

qa({
  t: T1,
  sub: "Degenerescência de subníveis e penetração orbital",
  dif: "dificil",
  e: String.raw`No átomo de hidrogênio os subníveis $2s$ e $2p$ têm exatamente a mesma energia; no átomo de lítio, o $2s$ é nitidamente mais estável que o $2p$. A causa dessa quebra de degenerescência é:`,
  ok: "A presença de outros elétrons no átomo.",
  err: [
    "A mudança do número quântico principal.",
    "A diferença de spin entre os elétrons.",
    "A menor carga nuclear do lítio.",
    "A ausência de orbitais $p$ no lítio.",
  ],
  r: String.raw`No hidrogênio há um único elétron, e a solução exata da equação de Schrödinger dá energia dependente só de $n$: $2s$ e $2p$ são degenerados.

Assim que existe mais de um elétron, entra em cena a blindagem pelos elétrons internos — no lítio, os dois elétrons $1s$. E aí importa quanto cada orbital PENETRA nessa nuvem interna: o $2s$ tem densidade de probabilidade apreciável bem perto do núcleo, enquanto o $2p$ é praticamente nulo ali.

Penetrando mais, o elétron $2s$ escapa em parte da blindagem, sente $Z_{\text{ef}}$ maior e fica mais estável. A ordem geral, para o mesmo $n$, passa a ser $s < p < d < f$ — e é dela que decorre toda a ordem de preenchimento.`,
});

// --- Configurações eletrônicas ---------------------------------------------

qa({
  t: T1,
  sub: "Ordem de preenchimento: 4s antes de 3d",
  dif: "medio",
  e: String.raw`Nos elementos do quarto período, o subnível $4s$ é preenchido antes do $3d$. A justificativa para essa ordem é que o $4s$:`,
  ok: "Tem energia menor no átomo neutro.",
  err: [
    "Está mais distante do núcleo.",
    "Comporta mais elétrons que o $3d$.",
    "Pertence a um período diferente.",
    "Possui maior número de orbitais.",
  ],
  r: String.raw`A ordem de preenchimento não segue $n$ crescente, e sim a energia efetiva de cada subnível no átomo neutro. O orbital $4s$ é mais penetrante que o $3d$: mesmo pertencendo a um nível superior, ele consegue densidade eletrônica perto do núcleo e acaba com energia ligeiramente menor.

Daí a sequência $\ldots 4s \to 3d \to 4p \ldots$, que o diagrama de Linus Pauling resume.

Há uma sutileza que costuma ser cobrada: uma vez ocupados, os orbitais $3d$ ficam MAIS estáveis que o $4s$. Por isso, ao formar cátions, os metais de transição perdem primeiro os elétrons $4s$, e não os $3d$.`,
});

qa({
  t: T1,
  sub: "Perda de elétrons 4s na formação de cátions",
  dif: "medio",
  e: String.raw`O titânio tem número atômico $22$ e configuração $[	ext{Ar}]\,3d^2\,4s^2$. No íon $	ext{Ti}^{3+}$, o número de elétrons ocupando o subnível $3d$ é:`,
  ok: String.raw`$1$`,
  err: [String.raw`$0$`, String.raw`$2$`, String.raw`$3$`, String.raw`$5$`],
  r: String.raw`A armadilha clássica é supor que os elétrons saem na ordem inversa à do preenchimento. Não é isso que acontece.

Depois que o $3d$ começa a ser ocupado, ele passa a ser mais interno e mais estável que o $4s$. Na ionização, portanto, saem primeiro os elétrons do subnível de maior $n$ — os dois do $4s$. Só então a remoção seguinte alcança o $3d$:

$$[	ext{Ar}]\,3d^2\,4s^2 \;\longrightarrow\; [	ext{Ar}]\,3d^1 + 3e^-$$

Resta um único elétron no $3d$, o que faz do $	ext{Ti}^{3+}$ uma espécie paramagnética e colorida — violeta em solução, por transição $d$-$d$ desse elétron solitário.

Quem parte do fim da configuração escrita e remove três elétrons "de trás para frente" chega a $3d^0$, e erra.`,
});

qa({
  t: T1,
  sub: "Exceção do cromo e subnível semipreenchido",
  dif: "medio",
  e: String.raw`A configuração eletrônica do cromo ($Z = 24$) é $[\text{Ar}]\,3d^5\,4s^1$, e não $[\text{Ar}]\,3d^4\,4s^2$, como o diagrama de preenchimento faria prever. A causa é:`,
  ok: "A estabilidade extra do subnível semipreenchido.",
  err: [
    "A impossibilidade de haver par de elétrons no $4s$.",
    "A energia do $3d$ ser maior que a do $4p$.",
    "A regra de Hund proibir orbitais vazios.",
    "O princípio da exclusão proibir o par no $4s$.",
  ],
  r: String.raw`O diagrama de preenchimento é uma boa aproximação, não uma lei. Ele ignora que $4s$ e $3d$ ficam muito próximos em energia nos metais de transição — e, quando a diferença é pequena, a repulsão entre elétrons decide.

Promover um elétron do $4s$ para o $3d$ custa pouco e rende duas vantagens: espalha os seis elétrons por seis orbitais diferentes, reduzindo a repulsão par a par, e produz dois subníveis semipreenchidos ($3d^5$ e $4s^1$), arranjo de energia de troca favorável.

O cobre ($Z = 29$) faz o mesmo por um motivo análogo, atingindo $[\text{Ar}]\,3d^{10}\,4s^1$, com o $3d$ completo.`,
});

qa({
  t: T1,
  sub: "Regra de Hund e contagem de elétrons desemparelhados",
  dif: "medio",
  e: String.raw`Um íon de metal de transição apresenta configuração de valência $3d^6$. Aplicando a regra de Hund, o número de elétrons desemparelhados nesse íon é:`,
  ok: String.raw`$4$`,
  err: [String.raw`$0$`, String.raw`$1$`, String.raw`$2$`, String.raw`$6$`],
  r: String.raw`O subnível $d$ tem cinco orbitais degenerados. A regra de Hund manda ocupá-los primeiro um a um, todos com spins paralelos, e só depois começar a emparelhar — o que minimiza a repulsão eletrostática entre elétrons.

Com seis elétrons: os cinco primeiros ocupam um orbital cada, desemparelhados; o sexto é obrigado a emparelhar com um deles.

$$\uparrow\downarrow \quad \uparrow \quad \uparrow \quad \uparrow \quad \uparrow$$

Sobram quatro desemparelhados, o que torna a espécie fortemente paramagnética. É o caso do $\text{Fe}^{2+}$ em campo fraco.`,
});

qa({
  t: T1,
  sub: "Diamagnetismo e íons de configuração d10",
  dif: "medio",
  e: String.raw`Entre os íons $\text{Mn}^{2+}$, $\text{Fe}^{3+}$, $\text{Ni}^{2+}$, $\text{Cu}^{2+}$ e $\text{Zn}^{2+}$, o único diamagnético é:`,
  ok: String.raw`$\text{Zn}^{2+}$`,
  err: [
    String.raw`$\text{Mn}^{2+}$`,
    String.raw`$\text{Fe}^{3+}$`,
    String.raw`$\text{Ni}^{2+}$`,
    String.raw`$\text{Cu}^{2+}$`,
  ],
  r: String.raw`Uma espécie é diamagnética quando TODOS os seus elétrons estão emparelhados; basta um desemparelhado para haver paramagnetismo.

Removendo sempre os elétrons $4s$ primeiro:

- $\text{Mn}^{2+}$: $3d^5$ — cinco desemparelhados;
- $\text{Fe}^{3+}$: $3d^5$ — cinco desemparelhados;
- $\text{Ni}^{2+}$: $3d^8$ — dois desemparelhados;
- $\text{Cu}^{2+}$: $3d^9$ — um desemparelhado;
- $\text{Zn}^{2+}$: $3d^{10}$ — subnível completo, nenhum desemparelhado.

O $3d^{10}$ do zinco também explica por que seus compostos são incolores: sem orbital $d$ vago, não há transição $d$-$d$ para absorver luz visível.`,
});

qa({
  t: T1,
  sub: "Localização na tabela a partir da configuração",
  dif: "medio",
  e: String.raw`Um elemento no estado fundamental tem configuração eletrônica terminada em $3s^2\,3p^4$. Esse elemento pertence ao:`,
  ok: "Grupo 16, terceiro período.",
  err: [
    "Grupo 14, terceiro período.",
    "Grupo 16, quarto período.",
    "Grupo 4, terceiro período.",
    "Grupo 6, quarto período.",
  ],
  r: String.raw`A configuração de valência dá a posição na tabela de forma direta.

O período é o maior valor de $n$ que aparece: aqui $n = 3$, terceiro período.

O grupo, para elementos do bloco $p$, vem da contagem de elétrons de valência: $2 + 4 = 6$ elétrons nas camadas $3s$ e $3p$. Elementos do bloco $p$ com seis elétrons de valência estão no grupo 16 (a família do oxigênio) — os grupos 13 a 18 correspondem a 3 a 8 elétrons de valência.

O elemento é o enxofre, $Z = 16$.`,
});

qa({
  t: T1,
  sub: "Elétrons de valência e grupo da tabela",
  dif: "facil",
  e: String.raw`Um elemento representativo pertence ao grupo 15 da tabela periódica. O número de elétrons em sua camada de valência é:`,
  ok: String.raw`$5$`,
  err: [String.raw`$2$`, String.raw`$3$`, String.raw`$6$`, String.raw`$7$`],
  r: String.raw`Para os elementos representativos (blocos $s$ e $p$) o número do grupo informa diretamente os elétrons de valência: grupos 1 e 2 têm 1 e 2; do grupo 13 ao 18, subtrai-se 10.

Grupo 15: $15 - 10 = 5$ elétrons de valência, na configuração $ns^2\,np^3$.

Isso já explica a química da família: com cinco elétrons, falta três para o octeto, e daí a valência 3 típica da amônia ($\text{NH}_3$) e da fosfina ($\text{PH}_3$), assim como o estado de oxidação $+5$ quando todos os elétrons de valência são compartilhados, como em $\text{HNO}_3$.`,
});

qa({
  t: T1,
  sub: "Íon isoeletrônico com gás nobre",
  dif: "facil",
  e: String.raw`Ao formar seu íon estável, o cálcio ($Z = 20$) adquire a configuração eletrônica do:`,
  ok: "Argônio.",
  err: ["Neônio.", "Criptônio.", "Potássio.", "Cloro."],
  r: String.raw`O cálcio tem $[\text{Ar}]\,4s^2$. Perdendo os dois elétrons do $4s$, resta exatamente $1s^2\,2s^2\,2p^6\,3s^2\,3p^6$, que é a configuração do argônio ($Z = 18$).

Os elementos representativos tendem a ganhar ou perder elétrons até atingir a configuração do gás nobre mais próximo — é a regra do octeto.

Note que $\text{K}^+$ e $\text{Cl}^-$ também são isoeletrônicos com o argônio, com os mesmos $18$ elétrons. Mas a pergunta é pela configuração adquirida, e ela é sempre nomeada pelo GÁS NOBRE de referência.`,
});

qa({
  t: T1,
  sub: "Isótopos e identidade química",
  dif: "facil",
  e: String.raw`Dois isótopos de um mesmo elemento apresentam comportamento químico praticamente idêntico. Isso ocorre porque eles têm:`,
  ok: "A mesma configuração eletrônica.",
  err: [
    "O mesmo número de nêutrons.",
    "A mesma massa atômica.",
    "O mesmo número de massa.",
    "A mesma densidade nuclear.",
  ],
  r: String.raw`Isótopos têm o mesmo número atômico $Z$ e diferentes números de massa $A$ — ou seja, mesmo número de prótons e diferentes números de nêutrons.

Como o número de prótons fixa o número de elétrons do átomo neutro, isótopos têm exatamente a mesma configuração eletrônica. E é a camada de valência que determina ligação, geometria, acidez, potencial de redução: toda a química.

O nêutron a mais muda a massa, e com ela propriedades físicas (densidade, velocidade de difusão, estabilidade nuclear) e a velocidade de reações sensíveis à massa — o chamado efeito isotópico, notável entre $\text{H}$ e $\text{D}$, mas discreto nos elementos pesados.`,
});

qa({
  t: T1,
  sub: "Isótopos, isóbaros e isótonos",
  dif: "medio",
  e: String.raw`Os nuclídeos $^{40}\text{Ar}$ ($Z = 18$) e $^{40}\text{Ca}$ ($Z = 20$) possuem o mesmo número de massa e números atômicos diferentes. Eles são classificados como:`,
  ok: "Isóbaros.",
  err: ["Isótopos.", "Isótonos.", "Alótropos.", "Isômeros."],
  r: String.raw`As três classificações nucleares comparam grandezas diferentes:

- isótopos — mesmo $Z$, diferentes $A$ (mesmo elemento);
- isóbaros — mesmo $A$, diferentes $Z$ (elementos diferentes);
- isótonos — mesmo número de nêutrons, diferentes $Z$ e $A$.

Aqui $A = 40$ nos dois casos e $Z$ difere: são isóbaros. Repare que são elementos QUÍMICOS distintos, com propriedades completamente diferentes — um gás nobre inerte e um metal alcalinoterroso reativo —, porque a química depende de $Z$, não de $A$.

Alotropia, por sua vez, nem é conceito nuclear: refere-se a formas diferentes do mesmo elemento, como grafita e diamante.`,
});

qa({
  t: T1,
  sub: "Critério de ordenação da tabela periódica",
  dif: "facil",
  e: String.raw`Na tabela periódica moderna o argônio (massa atômica $39{,}9$) aparece ANTES do potássio (massa atômica $39{,}1$). Isso é possível porque os elementos estão ordenados por:`,
  ok: "Número atômico crescente.",
  err: [
    "Massa atômica crescente.",
    "Número de nêutrons crescente.",
    "Raio atômico crescente.",
    "Eletronegatividade crescente.",
  ],
  r: String.raw`Mendeleev ordenou por massa atômica e precisou inverter alguns pares à mão para preservar a semelhança química das colunas — o par $\text{Ar}/\text{K}$ é justamente um deles.

Moseley resolveu a questão ao medir a frequência dos raios X característicos de cada elemento e mostrar que ela varia regularmente com a carga do núcleo. O critério correto era o número atômico $Z$: $\text{Ar}$ tem $Z = 18$ e $\text{K}$, $Z = 19$.

Faz todo sentido: é $Z$ que fixa o número de elétrons e, por consequência, a configuração de valência de que dependem as propriedades periódicas. A inversão de massa acontece porque o argônio natural é rico no isótopo $^{40}\text{Ar}$.`,
});

// --- Tendências periódicas --------------------------------------------------

qa({
  t: T1,
  sub: "Raios em série isoeletrônica",
  dif: "medio",
  e: String.raw`Os íons $\text{N}^{3-}$, $\text{O}^{2-}$, $\text{F}^{-}$, $\text{Na}^{+}$ e $\text{Mg}^{2+}$ possuem todos $10$ elétrons. O de MAIOR raio iônico é:`,
  ok: String.raw`$\text{N}^{3-}$`,
  err: [
    String.raw`$\text{O}^{2-}$`,
    String.raw`$\text{F}^{-}$`,
    String.raw`$\text{Na}^{+}$`,
    String.raw`$\text{Mg}^{2+}$`,
  ],
  r: String.raw`Numa série isoeletrônica o número de elétrons é fixo, e portanto a repulsão entre eles também. O que varia é a carga do núcleo que os segura.

Na ordem de $Z$ crescente: $\text{N}$ (7), $\text{O}$ (8), $\text{F}$ (9), $\text{Na}$ (11), $\text{Mg}$ (12). Quanto mais prótons puxando os mesmos $10$ elétrons, mais compacta fica a nuvem eletrônica.

$$\text{N}^{3-} > \text{O}^{2-} > \text{F}^{-} > \text{Na}^{+} > \text{Mg}^{2+}$$

O maior raio é o do nitreto, com apenas $7$ prótons para $10$ elétrons; o menor é o do magnésio, com $12$.`,
});

qa({
  t: T1,
  sub: "Caráter metálico ao longo de um grupo",
  dif: "facil",
  e: String.raw`Descendo o grupo 14 da tabela periódica, do carbono ao chumbo, observa-se:`,
  ok: "Aumento do caráter metálico.",
  err: [
    "Aumento da energia de ionização.",
    "Aumento da eletronegatividade.",
    "Redução do raio atômico.",
    "Redução do número de camadas.",
  ],
  r: String.raw`Descendo um grupo, cada elemento ganha uma camada eletrônica: o raio cresce e o elétron de valência fica mais distante e mais blindado. Solto assim, é cedido com facilidade crescente — a energia de ionização e a eletronegatividade caem.

Ceder elétron com facilidade é exatamente a definição operacional de caráter metálico. O grupo 14 exibe essa transição de forma escolar: carbono é ametal, silício e germânio são semimetais, estanho e chumbo são metais francos.

É por isso que o caráter metálico cresce da direita para a esquerda nos períodos e de cima para baixo nos grupos, com o césio no canto mais metálico da tabela.`,
});

qa({
  t: T1,
  sub: "Lei periódica e propriedades aperiódicas",
  dif: "medio",
  e: String.raw`A lei periódica afirma que as propriedades dos elementos são função periódica de seus números atômicos. Entre as propriedades abaixo, a única que NÃO varia periodicamente é:`,
  ok: "A massa atômica.",
  err: [
    "O raio atômico.",
    "A energia de ionização.",
    "A eletronegatividade.",
    "A afinidade eletrônica.",
  ],
  r: String.raw`Propriedade periódica é aquela que sobe e desce em ciclos ao longo da tabela, repetindo o padrão a cada novo período. Isso acontece porque todas elas dependem da configuração da camada de VALÊNCIA, que se repete de período em período: todo grupo 1 recomeça em $ns^1$, todo grupo 18 fecha em $ns^2\,np^6$.

Raio atômico, energia de ionização, eletronegatividade e afinidade eletrônica seguem esse comportamento — daí os máximos recorrentes nos gases nobres e os mínimos nos alcalinos.

A massa atômica é diferente: ela depende do número de prótons e nêutrons do núcleo, que só aumenta. Cresce de forma monotônica com $Z$, sem voltar atrás, e por isso é classificada como propriedade APERIÓDICA — assim como o calor específico e o próprio número atômico.

É essa distinção que justifica a troca do critério de ordenação feita por Moseley: ordenar por uma grandeza aperiódica que cresce sempre ($Z$) é o que faz as propriedades periódicas caírem alinhadas em colunas.`,
});

qa({
  t: T1,
  sub: "Anomalia da energia de ionização entre N e O",
  dif: "dificil",
  e: String.raw`A primeira energia de ionização do oxigênio é MENOR que a do nitrogênio, contrariando a tendência geral do período. A explicação é que, no oxigênio, o elétron removido:`,
  ok: "Está emparelhado num orbital $2p$.",
  err: [
    "Ocupa um subnível $2p$ completo.",
    "Ocupa um orbital de camada interna.",
    "Sente uma carga nuclear menor.",
    "Pertence a um nível mais externo.",
  ],
  r: String.raw`As configurações de valência são $2s^2\,2p^3$ para o nitrogênio e $2s^2\,2p^4$ para o oxigênio.

No nitrogênio os três elétrons $2p$ ocupam um orbital cada, todos desemparelhados — o subnível está exatamente semipreenchido, arranjo de baixa repulsão e estabilidade extra.

No oxigênio o quarto elétron $2p$ é obrigado a dividir orbital com outro. Dois elétrons no mesmo lóbulo se repelem fortemente, e essa repulsão já deixa o elétron "meio expulso": tirá-lo custa menos do que a tendência periódica previa e ainda devolve o átomo à configuração semipreenchida estável.

A mesma anomalia se repete no par $\text{P}/\text{S}$, pelo mesmo motivo.`,
});

qa({
  t: T1,
  sub: "Anomalia da energia de ionização entre Be e B",
  dif: "dificil",
  e: String.raw`A primeira energia de ionização do boro é menor que a do berílio, apesar de o boro vir depois no período. Isso ocorre porque, no boro, o elétron removido sai de um orbital:`,
  ok: String.raw`$2p$, mais energético que o $2s$.`,
  err: [
    String.raw`$2s$, mais energético que o $2p$.`,
    String.raw`$1s$, muito próximo do núcleo.`,
    String.raw`$3s$, ainda desocupado no átomo.`,
    String.raw`$2p$, já ocupado por dois elétrons.`,
  ],
  r: String.raw`O berílio é $1s^2\,2s^2$; o boro, $1s^2\,2s^2\,2p^1$.

No berílio o elétron sai de um $2s$ preenchido, orbital bastante penetrante, que mantém densidade eletrônica perto do núcleo e sente $Z_{\text{ef}}$ elevada. Está firmemente preso.

No boro, o elétron mais fácil de remover é o único $2p$. O orbital $p$ penetra menos, é blindado pelo par $2s$ e fica em energia mais alta. Sai com menos energia que o $2s$ do berílio, mesmo com um próton a mais no núcleo — e ainda deixa para trás a configuração estável $2s^2$.

Junto com a anomalia $\text{N}/\text{O}$, este é o segundo degrau que quebra a subida monotônica da energia de ionização ao longo do segundo período.`,
});

qa({
  t: T1,
  sub: "Salto nas energias de ionização e identificação do grupo",
  dif: "dificil",
  e: String.raw`As energias de ionização sucessivas de certo elemento crescem suavemente até a terceira e dão um salto brusco na quarta. Esse elemento pertence ao:`,
  ok: "Grupo 13.",
  err: ["Grupo 1.", "Grupo 2.", "Grupo 14.", "Grupo 16."],
  r: String.raw`Enquanto os elétrons retirados vêm da camada de valência, o custo sobe de forma gradual — cada remoção deixa o íon mais positivo, mas o elétron seguinte ainda está no mesmo nível.

O salto brusco marca o momento em que a valência ACABOU e a próxima remoção precisa atacar uma camada interna completa, muito mais próxima do núcleo e muito mais estável.

Se o salto ocorre na QUARTA ionização, é porque as três primeiras esgotaram a valência: o elemento tem três elétrons de valência, configuração $ns^2\,np^1$, grupo 13.

Esse raciocínio é a forma clássica de identificar o grupo de um elemento a partir de dados experimentais puros, sem consultar a tabela.`,
});

qa({
  t: T1,
  sub: "Tendência periódica da afinidade eletrônica",
  dif: "medio",
  e: String.raw`Ao percorrer um período da esquerda para a direita, a afinidade eletrônica dos elementos torna-se, em módulo:`,
  ok: "Maior, com algumas exceções.",
  err: [
    "Menor, sem nenhuma exceção.",
    "Constante ao longo do período.",
    "Menor apenas entre os metais.",
    "Nula a partir do grupo 14.",
  ],
  r: String.raw`Afinidade eletrônica é a energia envolvida quando um átomo gasoso captura um elétron. Quanto mais negativa, mais o átomo "gosta" de receber.

Da esquerda para a direita a carga nuclear efetiva cresce e o raio diminui: o elétron adicional é atraído com mais força e entra numa camada que está mais perto do octeto. Os halogênios, a um elétron de fechar a camada, exibem os maiores valores.

As exceções são informativas: grupo 2 e grupo 15 têm afinidades pequenas ou até positivas porque o elétron novo teria de entrar num subnível já preenchido ($ns^2$) ou emparelhar num $np$ semipreenchido. E os gases nobres, com a camada fechada, encerram o período com afinidade essencialmente nula.`,
});

qa({
  t: T1,
  sub: "Segunda afinidade eletrônica e repulsão",
  dif: "dificil",
  e: String.raw`A formação do íon $\text{O}^{2-}$ a partir do íon $\text{O}^{-}$ em fase gasosa é um processo endotérmico, ao contrário da primeira captura de elétron. A razão é que:`,
  ok: "Uma espécie negativa repele o elétron adicional.",
  err: [
    "O oxigênio já completou o octeto no $\\text{O}^{-}$.",
    "A carga nuclear do oxigênio diminui no processo.",
    "O raio do íon diminui ao receber o elétron.",
    "O elétron precisa entrar numa camada interna.",
  ],
  r: String.raw`A primeira afinidade do oxigênio é exotérmica: um átomo neutro atrai o elétron extra, e energia é liberada.

Para a segunda captura o cenário se inverte. O alvo agora é o $\text{O}^{-}$, já carregado negativamente, e aproximar dele mais um elétron exige vencer repulsão eletrostática. Essa etapa consome energia, e bastante — cerca de $+780$ kJ/mol.

Fica a pergunta natural: por que, então, o íon $\text{O}^{2-}$ é onipresente em óxidos? Porque no SÓLIDO a conta não para aí. A energia reticular liberada ao arranjar cátions e ânions na rede cristalina é enorme e paga com folga o custo da segunda afinidade. O $\text{O}^{2-}$ é estável no cristal, não isolado no vácuo.`,
});

qa({
  t: T1,
  sub: "Número de elementos por período e subníveis preenchidos",
  dif: "dificil",
  e: String.raw`O segundo período da tabela periódica contém $8$ elementos, enquanto o quarto contém $18$. O quarto período é mais longo porque nele são preenchidos os subníveis:`,
  ok: String.raw`$4s$, $3d$ e $4p$.`,
  err: [
    String.raw`$4s$, $4p$ e $4d$.`,
    String.raw`$4s$, $4d$ e $4f$.`,
    String.raw`$3s$, $3p$ e $3d$.`,
    String.raw`$4s$, $4p$ e $4f$.`,
  ],
  r: String.raw`O comprimento de cada período é simplesmente a capacidade dos subníveis preenchidos nele.

No segundo período entram $2s$ e $2p$: $2 + 6 = 8$ elementos. O subnível $2d$ não existe, pois para $n = 2$ o número quântico $\ell$ só vai até $1$.

No quarto período, a ordem energética coloca o $4s$ antes do $3d$, e este entra em cena:

$$4s\ (2) + 3d\ (10) + 4p\ (6) = 18$$

São os dez elementos do bloco $d$ que alongam o período — e o mesmo raciocínio explica os $32$ elementos do sexto período, em que os catorze do bloco $f$ ($4f$) se somam a $6s$, $5d$ e $6p$.

Repare que o subnível $3d$ é preenchido no QUARTO período, e não no terceiro: o número do período é o $n$ do subnível $s$ que o abre, não o de todos os subníveis envolvidos.`,
});

qa({
  t: T1,
  sub: "Reatividade dos gases nobres e energia de ionização",
  dif: "dificil",
  e: String.raw`O xenônio forma compostos estáveis, como $\text{XeF}_4$, enquanto o hélio não forma composto algum em condições normais. A diferença entre os dois está:`,
  ok: "Na menor energia de ionização do xenônio.",
  err: [
    "No maior número de elétrons de valência do xenônio.",
    "Na maior eletronegatividade do xenônio.",
    "Na ausência de camada de valência no hélio.",
    "No menor raio atômico do xenônio.",
  ],
  r: String.raw`Os dois têm camada de valência completa, e nesse aspecto são iguais — o que muda é o quanto essa camada está presa.

O hélio tem só dois elétrons, num orbital $1s$ colado ao núcleo e sem blindagem. Sua energia de ionização é a maior de toda a tabela, cerca de $2372$ kJ/mol: nenhum parceiro químico consegue perturbar essa camada.

No xenônio, os elétrons de valência estão no nível $n = 5$, distantes e blindados por muitas camadas internas. A energia de ionização cai para cerca de $1170$ kJ/mol — valor comparável ao de ametais comuns. Um oxidante muito forte, como o flúor, consegue então partilhar esses elétrons, gerando $\text{XeF}_2$, $\text{XeF}_4$ e $\text{XeF}_6$.

Por isso a reatividade dos gases nobres cresce de cima para baixo no grupo 18.`,
});

qa({
  t: T1,
  sub: "Posição anômala do hidrogênio na tabela",
  dif: "medio",
  e: String.raw`O hidrogênio costuma ser representado no alto do grupo 1, mas não é considerado um metal alcalino. A razão química para essa distinção é que o hidrogênio:`,
  ok: "Não perde elétron com facilidade.",
  err: [
    "Possui dois elétrons de valência.",
    "Tem raio atômico maior que o do lítio.",
    "Não forma compostos com o oxigênio.",
    "É o único elemento sem nêutrons.",
  ],
  r: String.raw`A semelhança com o grupo 1 é apenas de configuração: $1s^1$, um elétron de valência, como o $ns^1$ dos alcalinos.

A química, porém, é outra. Os alcalinos têm energias de ionização baixas (o sódio, $496$ kJ/mol) e perdem o elétron com facilidade, formando cátions em solução. O hidrogênio precisa de $1312$ kJ/mol — seu único elétron está num orbital $1s$ sem qualquer blindagem, firmemente preso.

Na prática, o hidrogênio raramente cede elétron: ele os COMPARTILHA, formando ligações covalentes em $\text{H}_2\text{O}$, $\text{NH}_3$, $\text{CH}_4$ e hidrocarbonetos. Diante de metais muito ativos, chega a receber elétron e formar o hidreto $\text{H}^-$ — comportamento de ametal, não de alcalino.

Por isso muitas tabelas o exibem isolado, sem grupo.`,
});

qa({
  t: T1,
  sub: "Semimetais e posição na tabela periódica",
  dif: "medio",
  e: String.raw`Silício e germânio ocupam a faixa divisória entre metais e ametais e são classificados como semimetais. A propriedade que justifica essa classificação é que eles:`,
  ok: "Conduzem eletricidade de forma intermediária.",
  err: [
    "Possuem elétrons livres como os metais.",
    "São isolantes em qualquer temperatura.",
    "Cedem elétrons tão bem quanto os alcalinos.",
    "Têm eletronegatividade maior que a dos halogênios.",
  ],
  r: String.raw`Os semimetais ficam na escada diagonal que corta o bloco $p$, justamente onde a eletronegatividade é intermediária — nem baixa o bastante para ceder elétrons como um metal, nem alta o bastante para capturá-los como um ametal.

Eletricamente, isso se traduz num gap de energia pequeno entre a banda de valência e a banda de condução: grande demais para conduzir bem à temperatura ambiente, pequeno o bastante para que aquecimento, luz ou dopagem promovam elétrons. Metal puro tem bandas superpostas; isolante tem gap largo.

Há ainda um comportamento revelador: no metal a condutividade CAI com a temperatura, enquanto no semicondutor ela SOBE, porque mais portadores são promovidos.

É essa janela intermediária, e a possibilidade de controlá-la por dopagem, que torna o silício a base de toda a eletrônica.`,
});

finalizar();
