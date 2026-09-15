// Leva de equalização de Química Geral — tópico 2 da ementa:
// "Ligações Químicas" (iônica, covalente, metálica/teoria de bandas, forças
// intermoleculares e propriedades físicas).
//
// O banco já tinha 47 questões no fluxo normal; estas 28 fecham o tópico em 75.
// Os ângulos repetidos foram evitados um a um contra a lista de subtópicos já
// existente (VSEPR genérico, hibridização genérica, semicondutor tipo N/P,
// "semelhante dissolve semelhante" etc. já estavam cobertos).
//
// Estilo: banca da UFF — o fenômeno antes da fórmula. Ver `quimica_kit.mjs`.
import { criarLote, T2 } from "./quimica_kit.mjs";

const { qa, finalizar } = criarLote({ arquivo: "quimica_ligacoes.json", semente: 20260916 });

// --- Ligação iônica ---------------------------------------------------------

qa({
  t: T2,
  sub: "Energia reticular e tamanho do íon",
  dif: "medio",
  e: String.raw`Os sais $\text{NaF}$ e $\text{NaI}$ têm cátions idênticos e ânions de mesma carga, mas o $\text{NaF}$ funde a $993\ ^\circ$C e o $\text{NaI}$, a $661\ ^\circ$C. A diferença decorre:`,
  ok: "Do menor raio do íon fluoreto.",
  err: [
    "Da maior carga do íon fluoreto.",
    "Da maior massa molar do fluoreto de sódio.",
    "Da ligação covalente presente no fluoreto.",
    "Do maior número de íons na fórmula do fluoreto.",
  ],
  r: String.raw`A energia reticular mede quanto custa desmontar o cristal iônico, e segue a lei de Coulomb:

$$U \propto \frac{|q_+ \cdot q_-|}{r_+ + r_-}$$

Aqui as cargas são as mesmas nos dois sais ($+1$ e $-1$), então só a distância entre os centros dos íons decide. O fluoreto é bem menor que o iodeto, o que aproxima as cargas e aumenta a atração.

Rede mais coesa exige mais energia térmica para colapsar: ponto de fusão maior. O mesmo raciocínio ordena toda a série $\text{NaF} > \text{NaCl} > \text{NaBr} > \text{NaI}$.`,
});

qa({
  t: T2,
  sub: "Energia reticular versus energia de hidratação na dissolução",
  dif: "medio",
  e: String.raw`Alguns sais iônicos dissolvem-se bem em água e outros são praticamente insolúveis, embora todos tenham rede cristalina. O que decide a solubilidade é a comparação entre a energia reticular e:`,
  ok: "A energia de hidratação dos íons.",
  err: [
    "A energia de ionização do metal.",
    "A energia de ligação da molécula de água.",
    "A afinidade eletrônica do ânion.",
    "A energia cinética média dos íons.",
  ],
  r: String.raw`Dissolver um sal envolve duas contas de sinais opostos.

Primeiro é preciso desmontar a rede, vencendo a energia reticular — etapa sempre endotérmica. Em seguida, cada íon livre é cercado por moléculas de água, que se orientam pelo polo adequado; essa solvatação libera a energia de hidratação, sempre exotérmica.

O balanço decide: quando a hidratação compensa a rede (com a ajuda do ganho de entropia da dispersão), o sal dissolve. Quando a rede é forte demais — cargas altas e íons pequenos, como no $\text{CaCO}_3$ ou no $\text{Al}_2\text{O}_3$ —, a água não tem como pagar a conta e o sólido permanece.

É por isso que sais de íons $+1$/$-1$ costumam ser solúveis, enquanto a maioria dos carbonatos e fosfatos, com cargas maiores, não é.`,
});

qa({
  t: T2,
  sub: "Ácido e base de Lewis na formação do aduto",
  dif: "medio",
  e: String.raw`O $\text{BF}_3$, cujo boro tem apenas seis elétrons ao redor, reage prontamente com $\text{NH}_3$ formando o aduto $\text{F}_3\text{B}\!-\!\text{NH}_3$. Nessa reação o $\text{BF}_3$ atua como:`,
  ok: "Ácido de Lewis, recebendo um par eletrônico.",
  err: [
    "Base de Lewis, doando um par eletrônico.",
    "Ácido de Arrhenius, liberando íons $\\text{H}^+$.",
    "Base de Brønsted, recebendo um próton.",
    "Agente oxidante, recebendo dois elétrons.",
  ],
  r: String.raw`O boro é uma das exceções clássicas ao octeto: no $\text{BF}_3$ ele fica com apenas seis elétrons de valência e um orbital $p$ vazio. É uma deficiência que a molécula "procura" resolver.

A amônia oferece exatamente o que falta — o par isolado do nitrogênio. Ao doá-lo, forma-se uma ligação covalente coordenada, em que ambos os elétrons vêm do mesmo átomo.

Na definição de Lewis, quem RECEBE o par é o ácido e quem DOA é a base. Logo $\text{BF}_3$ é o ácido e $\text{NH}_3$, a base — e note que nenhum próton foi transferido, o que mostra por que a definição de Lewis é mais ampla que a de Brønsted.

No aduto o boro atinge o octeto e passa de geometria trigonal plana ($sp^2$) para tetraédrica ($sp^3$).`,
});

qa({
  t: T2,
  sub: "Octeto expandido e disponibilidade de orbitais d",
  dif: "dificil",
  e: String.raw`O fósforo forma o composto $\text{PCl}_5$, mas o nitrogênio, do mesmo grupo, não forma $\text{NCl}_5$. A razão é que o átomo de nitrogênio:`,
  ok: "Não dispõe de orbitais d em sua camada de valência.",
  err: [
    "Possui menos elétrons de valência que o fósforo.",
    "Tem eletronegatividade menor que a do fósforo.",
    "Forma apenas ligações do tipo iônico.",
    "Apresenta raio atômico maior que o do fósforo.",
  ],
  r: String.raw`Os dois elementos têm cinco elétrons de valência, e ambos formam o tricloreto sem dificuldade. O que os separa é o nível em que a valência mora.

O nitrogênio está no segundo período: sua valência é $2s^2\,2p^3$, e no nível $n = 2$ simplesmente não existe subnível $d$. Com apenas quatro orbitais disponíveis ($2s$ e três $2p$), o máximo que ele acomoda são oito elétrons — o octeto é, para ele, um limite rígido.

O fósforo está no terceiro período e tem os orbitais $3d$ acessíveis, além de raio maior, que comporta cinco cloros ao redor sem congestionamento. Ele consegue dez elétrons na valência, no chamado octeto expandido.

Essa é a regra geral: expansão do octeto só a partir do terceiro período, o que explica $\text{SF}_6$, $\text{PCl}_5$ e $\text{XeF}_4$ — e a ausência dos análogos do segundo período.`,
});

// --- Ligação covalente: ordem, ressonância e geometria ---------------------

qa({
  t: T2,
  sub: "Tetravalência do carbono e regra do octeto",
  dif: "facil",
  e: String.raw`Em praticamente todos os compostos estáveis que forma, o carbono estabelece quatro ligações covalentes. Essa tetravalência decorre de o átomo de carbono:`,
  ok: "Possuir quatro elétrons na camada de valência.",
  err: [
    "Possuir quatro camadas eletrônicas ocupadas.",
    "Ter quatro prótons em seu núcleo.",
    "Formar apenas ligações do tipo $\\pi$.",
    "Ceder quatro elétrons ao átomo parceiro.",
  ],
  r: String.raw`O carbono é $1s^2\,2s^2\,2p^2$: quatro elétrons na camada de valência, a meio caminho do octeto.

Ceder os quatro exigiria energia de ionização altíssima; receber quatro esbarraria na repulsão de uma carga $-4$. A saída energeticamente favorável é COMPARTILHAR: cada elétron de valência entra em um par compartilhado, e o carbono chega aos oito elétrons fazendo quatro ligações covalentes.

Essa posição intermediária, somada ao pequeno raio (que permite ligações C–C fortes e estáveis, inclusive $\pi$), é a raiz da química orgânica: cadeias longas, anéis e ramificações, sempre com quatro ligações por carbono — quatro simples, duas simples e uma dupla, duas duplas ou uma simples e uma tripla.`,
});

qa({
  t: T2,
  sub: "Ordem de ligação e comprimento da ligação carbono-carbono",
  dif: "medio",
  e: String.raw`Considere a ligação carbono-carbono no etano, no eteno e no etino. Ao passar de simples para dupla e para tripla, o comprimento da ligação:`,
  ok: "Diminui, e a energia de ligação aumenta.",
  err: [
    "Aumenta, e a energia de ligação diminui.",
    "Diminui, e a energia de ligação diminui.",
    "Aumenta, e a energia de ligação aumenta.",
    "Permanece constante, assim como a energia.",
  ],
  r: String.raw`Cada par eletrônico a mais compartilhado entre os dois carbonos aumenta a densidade eletrônica entre os núcleos, que passam a ser puxados com mais força um contra o outro.

Os valores experimentais mostram a tendência com clareza:

$$\text{C}\!-\!\text{C}: 154\ \text{pm} \qquad \text{C}\!=\!\text{C}: 134\ \text{pm} \qquad \text{C}\!\equiv\!\text{C}: 120\ \text{pm}$$

E as energias acompanham na direção oposta: cerca de $348$, $614$ e $839$ kJ/mol.

Comprimento e energia de ligação são, portanto, grandezas antagônicas: ligação mais curta é ligação mais forte. Note ainda que a dupla não vale o dobro da simples — a ligação $\pi$, feita por superposição lateral, é mais fraca que a $\sigma$, e é justamente ela que reage primeiro nas adições.`,
});

qa({
  t: T2,
  sub: "Ressonância no benzeno e comprimento das ligações",
  dif: "medio",
  e: String.raw`Medidas experimentais mostram que as seis ligações carbono-carbono do benzeno têm exatamente o mesmo comprimento, $139$ pm, intermediário entre o de uma simples e o de uma dupla. Isso indica que a molécula:`,
  ok: "É um híbrido de estruturas de ressonância.",
  err: [
    "Alterna rapidamente entre duas estruturas reais.",
    "Possui três ligações simples e três duplas fixas.",
    "Contém apenas ligações do tipo $\\sigma$.",
    "Apresenta geometria tetraédrica em cada carbono.",
  ],
  r: String.raw`A estrutura de Kekulé, com simples e duplas alternadas, prevê dois comprimentos diferentes: $154$ pm e $134$ pm. O experimento mostra um único valor, $139$ pm, bem no meio.

A explicação não é que a molécula fique oscilando entre as duas formas. Ela é, o tempo todo, UM único estado — o híbrido de ressonância. Os seis elétrons $\pi$ não pertencem a pares específicos de carbonos: estão deslocalizados em nuvens acima e abaixo do anel.

Cada ligação C–C acaba com ordem $1{,}5$, e todas ficam idênticas. Essa deslocalização também estabiliza a molécula em cerca de $150$ kJ/mol em relação ao ciclo-hexatrieno hipotético, o que explica por que o benzeno prefere substituição a adição — reagir por adição custaria destruir a aromaticidade.`,
});

qa({
  t: T2,
  sub: "Ligação de hidrogênio versus ligação covalente na ebulição",
  dif: "medio",
  e: String.raw`A ligação de hidrogênio entre duas moléculas de água vale cerca de $20$ kJ/mol, enquanto a ligação covalente O–H dentro da molécula vale cerca de $460$ kJ/mol. Ao ferver a água:`,
  ok: "Apenas as ligações de hidrogênio são rompidas.",
  err: [
    "Apenas as ligações covalentes são rompidas.",
    "Os dois tipos de ligação são rompidos.",
    "Nenhum dos dois tipos de ligação é rompido.",
    "As moléculas se decompõem em seus elementos.",
  ],
  r: String.raw`Mudança de estado físico é um fenômeno INTERMOLECULAR. Ferver significa afastar as moléculas umas das outras até que deixem de interagir, e não desmontá-las.

A ordem de grandeza das energias confirma isso: com a energia disponível à temperatura de ebulição, vencem-se as ligações de hidrogênio de $20$ kJ/mol, mas não chega perto dos $460$ kJ/mol de uma ligação O–H. O vapor d'água continua sendo formado por moléculas de $\text{H}_2\text{O}$ intactas.

Decompor a água em $\text{H}_2$ e $\text{O}_2$ é outra coisa: é reação química, exige cerca de $2000\ ^\circ$C por via térmica, ou eletrólise.

Essa distinção explica também por que a água ferve tão alto para uma molécula tão leve: mesmo sendo a "fraca" das duas, a ligação de hidrogênio é a mais forte das forças intermoleculares, e cada molécula de água faz até quatro delas.`,
});

qa({
  t: T2,
  sub: "Rotação restrita na ligação pi e isomeria geométrica",
  dif: "medio",
  e: String.raw`Existem dois compostos distintos de fórmula $\text{C}_2\text{H}_2\text{Cl}_2$ com os cloros em carbonos diferentes (formas cis e trans), mas não existem isômeros análogos para o $\text{C}_2\text{H}_4\text{Cl}_2$ correspondente. A razão é que a ligação dupla:`,
  ok: "Impede a rotação em torno do eixo C–C.",
  err: [
    "Torna a molécula sempre apolar.",
    "Aumenta o comprimento da ligação C–C.",
    "Confere geometria tetraédrica aos carbonos.",
    "Elimina a ligação $\\sigma$ entre os carbonos.",
  ],
  r: String.raw`Numa ligação simples, a superposição dos orbitais é frontal e cilíndrica em torno do eixo: girar um carbono em relação ao outro não desfaz nada, e a rotação é praticamente livre à temperatura ambiente. Por isso o 1,2-dicloroetano tem uma só forma.

A ligação dupla acrescenta uma ligação $\pi$, formada pela superposição LATERAL de dois orbitais $p$ paralelos. Girar em torno do eixo C–C desalinharia esses orbitais e quebraria a ligação $\pi$ — algo que custa cerca de $270$ kJ/mol, energia indisponível em condições normais.

Com a rotação travada, as posições relativas dos substituintes ficam congeladas, e cis e trans passam a ser compostos diferentes, com pontos de fusão, momentos dipolares e reatividades próprios.`,
});

qa({
  t: T2,
  sub: "Polaridade em isômeros cis e trans",
  dif: "dificil",
  e: String.raw`O cis-1,2-dicloroeteno tem momento dipolar não nulo, enquanto o isômero trans tem momento dipolar praticamente zero, embora ambos tenham as mesmas ligações. A diferença está:`,
  ok: "Na simetria do arranjo dos cloros.",
  err: [
    "Na polaridade de cada ligação C–Cl.",
    "Na eletronegatividade dos átomos de cloro.",
    "No tipo de hibridização dos carbonos.",
    "No número de ligações $\\pi$ da molécula.",
  ],
  r: String.raw`As ligações C–Cl são polares nos dois isômeros, e igualmente polares: o cloro é bem mais eletronegativo que o carbono nos dois casos.

O que muda é a soma VETORIAL desses dipolos. No isômero trans, os dois cloros ficam em lados opostos da dupla, e seus vetores apontam em sentidos contrários com o mesmo módulo: a resultante se cancela e a molécula é apolar.

No cis, os dois cloros estão do mesmo lado. Os vetores se somam parcialmente e sobra uma resultante apreciável, de cerca de $1{,}9$ D.

A consequência prática aparece nos pontos de ebulição: o cis, polar, tem interações dipolo-dipolo adicionais e ferve a $60\ ^\circ$C, contra $48\ ^\circ$C do trans. Molécula com ligações polares só é polar se a geometria não cancelar os dipolos.`,
});

qa({
  t: T2,
  sub: "Momento dipolar de NH3 e NF3",
  dif: "dificil",
  e: String.raw`$\text{NH}_3$ e $\text{NF}_3$ têm a mesma geometria piramidal, mas o momento dipolar da amônia ($1{,}47$ D) é muito maior que o do trifluoreto ($0{,}24$ D). A explicação é que, no $\text{NF}_3$:`,
  ok: "O par isolado e as ligações se opõem.",
  err: [
    "As ligações N–F são pouco polares.",
    "O nitrogênio não possui par isolado.",
    "A geometria molecular é plana.",
    "O flúor é menos eletronegativo que o hidrogênio.",
  ],
  r: String.raw`O momento dipolar total soma dois vetores: o das ligações e o do par isolado do nitrogênio, que aponta para fora do vértice da pirâmide.

Na amônia, o nitrogênio é mais eletronegativo que o hidrogênio, e os dipolos das três ligações N–H apontam DO hidrogênio PARA o nitrogênio, ou seja, na mesma direção do par isolado. Os dois efeitos se reforçam e o dipolo resultante é grande.

No $\text{NF}_3$ o flúor é mais eletronegativo que o nitrogênio, e os dipolos das ligações apontam para FORA, em sentido oposto ao do par isolado. Os dois efeitos se subtraem e resta quase nada, mesmo com ligações individualmente muito polares.

É um bom antídoto contra o atalho "ligação polar implica molécula polar": aqui as ligações mais polares produzem a molécula menos polar.`,
});

qa({
  t: T2,
  sub: "Par isolado e ângulo de ligação",
  dif: "medio",
  e: String.raw`O ângulo H–C–H no metano vale $109{,}5^\circ$, enquanto o ângulo H–N–H na amônia vale $107^\circ$, embora ambos tenham quatro regiões de densidade eletrônica. A redução na amônia ocorre porque o par isolado:`,
  ok: "Repele mais intensamente que um par ligante.",
  err: [
    "Ocupa duas posições no arranjo eletrônico.",
    "Não participa da geometria molecular.",
    "Atrai os hidrogênios para mais perto.",
    "Reduz a hibridização do nitrogênio.",
  ],
  r: String.raw`Pelo modelo VSEPR, quatro regiões de densidade eletrônica sempre se arranjam em tetraedro, o que daria $109{,}5^\circ$ nos dois casos.

A correção vem da natureza das regiões. Um par LIGANTE é dividido entre dois núcleos e fica espremido no eixo da ligação. Um par ISOLADO pertence a um só átomo, espalha-se mais perto dele e ocupa mais espaço angular.

O par isolado da amônia, portanto, empurra as três ligações N–H para baixo, comprimindo o ângulo de $109{,}5^\circ$ para $107^\circ$.

A água leva o mesmo efeito adiante: com DOIS pares isolados, o ângulo cai para $104{,}5^\circ$. A hierarquia de repulsão é isolado-isolado $>$ isolado-ligante $>$ ligante-ligante.`,
});

qa({
  t: T2,
  sub: "Posição do par isolado na bipirâmide trigonal",
  dif: "dificil",
  e: String.raw`No $\text{SF}_4$ o enxofre tem cinco regiões de densidade eletrônica: quatro ligações e um par isolado. O par isolado ocupa uma posição equatorial, e não axial, porque assim:`,
  ok: "Sofre menos repulsões a $90^\circ$.",
  err: [
    "Fica mais distante do núcleo do enxofre.",
    "Permite que a molécula se torne apolar.",
    "Aumenta o ângulo entre as ligações axiais.",
    "Reduz o número de ligações $\\sigma$ formadas.",
  ],
  r: String.raw`Na bipirâmide trigonal as posições não são equivalentes. Uma posição axial tem três vizinhos a $90^\circ$; uma equatorial tem apenas dois a $90^\circ$ (os outros dois estão a $120^\circ$, bem mais folgados).

Como a repulsão a $90^\circ$ é a que realmente pesa, o par isolado — que ocupa mais espaço que um par ligante — se instala onde encontra menos vizinhos próximos: na posição equatorial.

O resultado é a geometria de gangorra, com os ângulos ligeiramente comprimidos pela presença do par isolado.

A mesma lógica explica a série seguinte: no $\text{ClF}_3$, dois pares isolados ocupam posições equatoriais e a molécula fica em forma de T; no $\text{XeF}_2$, três pares equatoriais deixam os flúores nos eixos, e a molécula é linear.`,
});

qa({
  t: T2,
  sub: "Hibridização a partir da geometria molecular",
  dif: "medio",
  e: String.raw`A molécula de $\text{SO}_2$ é angular, com um par isolado sobre o enxofre e três regiões de densidade eletrônica ao seu redor. A hibridização do átomo central é:`,
  ok: String.raw`$sp^2$`,
  err: [String.raw`$sp$`, String.raw`$sp^3$`, String.raw`$sp^3d$`, String.raw`$sp^3d^2$`],
  r: String.raw`O caminho mais seguro é contar REGIÕES de densidade eletrônica ao redor do átomo central — ligações (simples, duplas ou triplas contam como uma região cada) mais pares isolados.

No $\text{SO}_2$ são três regiões: duas ligações com os oxigênios e um par isolado. Três regiões exigem três orbitais híbridos, obtidos pela mistura de um $s$ com dois $p$: hibridização $sp^2$, arranjo trigonal plano.

Como uma das três posições é ocupada pelo par isolado, a GEOMETRIA MOLECULAR observada é angular, com ângulo de cerca de $119^\circ$ — um pouco menor que os $120^\circ$ ideais, pela repulsão extra do par isolado.

A regra prática: 2 regiões $\to sp$; 3 $\to sp^2$; 4 $\to sp^3$; 5 $\to sp^3d$; 6 $\to sp^3d^2$.`,
});

qa({
  t: T2,
  sub: "Superposição lateral e fragilidade da ligação pi",
  dif: "medio",
  e: String.raw`Numa ligação dupla carbono-carbono, a ligação $\pi$ é mais fraca e mais reativa que a ligação $\sigma$ que a acompanha. Isso decorre de ela resultar da:`,
  ok: String.raw`Superposição lateral de orbitais $p$.`,
  err: [
    String.raw`Superposição frontal de orbitais $p$.`,
    String.raw`Superposição frontal de orbitais híbridos.`,
    String.raw`Transferência de elétrons entre os carbonos.`,
    String.raw`Superposição de orbitais de camadas distintas.`,
  ],
  r: String.raw`A ligação $\sigma$ nasce da superposição FRONTAL de orbitais ao longo do eixo que une os núcleos. A densidade eletrônica se concentra exatamente entre eles, onde a atração é máxima: é a ligação mais forte e a que existe em qualquer ligação química.

A ligação $\pi$ nasce da superposição LATERAL de dois orbitais $p$ paralelos, perpendiculares ao eixo. A densidade fica em duas nuvens, acima e abaixo da linha internuclear — mais afastada dos núcleos, portanto menos estabilizada.

Superposição lateral é também geometricamente menos eficiente que a frontal, o que reforça a diferença.

Daí as duas consequências práticas: a ligação $\pi$ é a que se rompe nas reações de adição de alcenos, deixando a $\sigma$ intacta; e é ela que trava a rotação em torno da dupla, já que girar desalinharia os orbitais $p$.

Vale a contagem geral: dupla $= 1\sigma + 1\pi$; tripla $= 1\sigma + 2\pi$.`,
});

qa({
  t: T2,
  sub: "Ordem de ligação nula e inexistência da molécula",
  dif: "dificil",
  e: String.raw`A molécula $\text{H}_2$ é estável, mas $\text{He}_2$ não existe em condições normais. Na teoria do orbital molecular, a razão é que no $\text{He}_2$:`,
  ok: "A ordem de ligação resultante é zero.",
  err: [
    "Não há superposição entre os orbitais $1s$.",
    "Os dois núcleos se repelem eletrostaticamente.",
    "Os elétrons ocupam apenas orbitais ligantes.",
    "O princípio da exclusão impede a ligação.",
  ],
  r: String.raw`Quando dois orbitais $1s$ se combinam, surgem dois orbitais moleculares: um ligante $\sigma_{1s}$, de energia menor, e um antiligante $\sigma^*_{1s}$, de energia maior.

No $\text{H}_2$ há dois elétrons, que preenchem só o ligante:

$$\text{OL} = \frac{2 - 0}{2} = 1$$

No $\text{He}_2$ há quatro elétrons. Os dois primeiros ocupam o ligante, mas os outros dois são obrigados a ocupar o antiligante, cuja desestabilização anula (na verdade, supera ligeiramente) a estabilização do ligante:

$$\text{OL} = \frac{2 - 2}{2} = 0$$

Ordem de ligação zero significa que não há ganho em permanecer unido: os átomos se separam. É o mesmo cálculo que prevê corretamente $\text{Be}_2$ instável e $\text{Li}_2$ estável — algo fora do alcance das estruturas de Lewis.`,
});

// --- Forças intermoleculares e propriedades físicas ------------------------

qa({
  t: T2,
  sub: "Ramificação da cadeia e ponto de ebulição",
  dif: "medio",
  e: String.raw`O n-pentano e o neopentano têm a mesma fórmula molecular, $\text{C}_5\text{H}_{12}$, mas fervem a $36\ ^\circ$C e a $10\ ^\circ$C, respectivamente. A diferença é explicada pela:`,
  ok: "Menor superfície de contato do isômero ramificado.",
  err: [
    "Maior polaridade do isômero de cadeia linear.",
    "Presença de ligações de hidrogênio no isômero linear.",
    "Maior massa molar do isômero de cadeia linear.",
    "Maior número de ligações covalentes no isômero linear.",
  ],
  r: String.raw`Os dois isômeros são hidrocarbonetos apolares de mesma massa molar, então as únicas forças em jogo são as de dispersão de London — e elas dependem de quanta superfície as moléculas conseguem aproximar.

O n-pentano é um bastão: duas moléculas se alinham lado a lado e mantêm contato ao longo de toda a cadeia, multiplicando os dipolos instantâneos induzidos.

O neopentano é praticamente esférico, com um carbono central e quatro metilas ao redor. Esferas se tocam quase em um ponto, e a área de contato despenca.

Menos contato significa dispersão mais fraca e menos energia para separar as moléculas: o isômero ramificado ferve antes. A regra vale em geral — quanto mais ramificada a cadeia, menor o ponto de ebulição, mantida a massa molar.`,
});

qa({
  t: T2,
  sub: "Ligação de hidrogênio intramolecular",
  dif: "dificil",
  e: String.raw`O orto-nitrofenol é bem mais volátil que o para-nitrofenol, apesar de os dois terem a mesma fórmula molecular e os mesmos grupos funcionais. A explicação é que, no isômero orto, a ligação de hidrogênio:`,
  ok: "Ocorre dentro da própria molécula.",
  err: [
    "Ocorre entre um número maior de moléculas.",
    "É substituída por interações do tipo íon-dipolo.",
    "Deixa de existir por ausência de hidrogênio ácido.",
    "Se converte em ligação covalente com o nitrogênio.",
  ],
  r: String.raw`No isômero orto os grupos $-\text{OH}$ e $-\text{NO}_2$ são vizinhos no anel, próximos o bastante para que o hidrogênio da hidroxila se ligue ao oxigênio do nitro da MESMA molécula. Forma-se um anel de seis membros fechado internamente.

Com o hidrogênio ácido já comprometido, sobra pouco para interagir com as moléculas vizinhas: as ligações de hidrogênio INTERmoleculares praticamente somem, e separar as moléculas fica barato — o composto é volátil e funde a $45\ ^\circ$C.

No isômero para os grupos estão em extremos opostos do anel, geometricamente impedidos de se alcançarem. A ligação de hidrogênio então só pode ser intermolecular, formando uma rede extensa que exige muito mais energia para desmontar: fusão a $114\ ^\circ$C.

Mesmos átomos, mesmas ligações — o que muda é para ONDE a ligação de hidrogênio aponta.`,
});

qa({
  t: T2,
  sub: "Forças de dispersão e liquefação de gases nobres",
  dif: "medio",
  e: String.raw`Os gases nobres são átomos isolados, apolares e de camada completa, mas ainda assim podem ser liquefeitos a baixas temperaturas. As forças responsáveis por manter esses átomos unidos no líquido são:`,
  ok: "As forças de dispersão de London.",
  err: [
    "As ligações de hidrogênio.",
    "As interações dipolo-dipolo permanentes.",
    "As ligações covalentes entre os átomos.",
    "As interações do tipo íon-dipolo.",
  ],
  r: String.raw`Um átomo de gás nobre não tem dipolo permanente nem hidrogênio para doar. Ainda assim, a nuvem eletrônica não é estática: a cada instante ela pode estar momentaneamente deslocada, criando um dipolo instantâneo.

Esse dipolo induz outro no átomo vizinho, e a atração entre os dois — repetida bilhões de vezes por segundo — é a força de dispersão de London. Fraca, mas real: basta resfriar o suficiente para que ela vença a agitação térmica.

A intensidade cresce com a polarizabilidade, ou seja, com o tamanho da nuvem eletrônica. E os pontos de ebulição confirmam: hélio ferve a $4$ K, neônio a $27$ K, argônio a $87$ K, xenônio a $165$ K.

Esse é o único tipo de força intermolecular presente em TODA substância — inclusive naquelas que também têm dipolo ou ligação de hidrogênio.`,
});

qa({
  t: T2,
  sub: "Pressão de vapor e intensidade das forças intermoleculares",
  dif: "medio",
  e: String.raw`A uma mesma temperatura, o éter dietílico apresenta pressão de vapor muito maior que a da água. Isso indica que, no éter, as forças intermoleculares são:`,
  ok: "Mais fracas, facilitando a evaporação.",
  err: [
    "Mais fortes, facilitando a evaporação.",
    "Mais fracas, dificultando a evaporação.",
    "Mais fortes, dificultando a condensação.",
    "Idênticas, pois ambos são líquidos polares.",
  ],
  r: String.raw`Pressão de vapor é a pressão exercida pelo vapor em equilíbrio com o líquido. Ela mede, na prática, a facilidade com que as moléculas escapam da superfície.

A água forma uma rede extensa de ligações de hidrogênio: cada molécula é segurada por várias vizinhas, e só as mais energéticas conseguem sair. Pressão de vapor baixa.

O éter tem oxigênio, mas nenhum hidrogênio ligado a ele — logo não doa ligação de hidrogênio, contando apenas com dipolo-dipolo e dispersão. Suas moléculas escapam com facilidade, e a pressão de vapor é alta.

A consequência direta está no ponto de ebulição, atingido quando a pressão de vapor iguala a atmosférica: $35\ ^\circ$C para o éter contra $100\ ^\circ$C para a água. Alta volatilidade e baixo ponto de ebulição são duas leituras do mesmo fato.`,
});

qa({
  t: T2,
  sub: "Tensão superficial e coesão do líquido",
  dif: "medio",
  e: String.raw`A água apresenta tensão superficial muito maior que a de hidrocarbonetos líquidos, a ponto de sustentar um clipe metálico depositado com cuidado sobre ela. A tensão superficial elevada resulta:`,
  ok: "Das ligações de hidrogênio entre as moléculas.",
  err: [
    "Da baixa densidade do líquido.",
    "Da elevada massa molar da substância.",
    "Da repulsão entre moléculas da superfície.",
    "Da presença de ar dissolvido no líquido.",
  ],
  r: String.raw`No interior do líquido, cada molécula é puxada em todas as direções pelas vizinhas, e a resultante é nula. Na superfície não há vizinhas acima: a resultante aponta para dentro, e a superfície se comporta como uma membrana elástica.

A intensidade dessa "membrana" é proporcional à força de coesão. Na água, cada molécula pode fazer até quatro ligações de hidrogênio, o que produz coesão muito maior que a dos hidrocarbonetos, onde só atuam forças de dispersão.

Daí a tensão superficial de $72$ mN/m da água, contra cerca de $20$ mN/m de um alcano típico — suficiente para sustentar um clipe (que afunda assim que se adiciona detergente, um tensoativo que rompe essa rede na superfície) e para o inseto que anda sobre a lagoa.

É a mesma coesão que explica a formação de gotas esféricas e a subida da água em capilares.`,
});

// --- Sólidos, metais e teoria de bandas ------------------------------------

qa({
  t: T2,
  sub: "Caráter anfifílico e ação do sabão",
  dif: "medio",
  e: String.raw`A molécula de sabão é formada por uma longa cadeia carbônica ligada a um grupo carboxilato iônico. Sua capacidade de remover gordura com água decorre de a molécula:`,
  ok: "Ter uma extremidade polar e outra apolar.",
  err: [
    "Ser polar em toda a sua extensão.",
    "Ser apolar em toda a sua extensão.",
    "Reagir quimicamente com a gordura.",
    "Aumentar a polaridade da água usada.",
  ],
  r: String.raw`Gordura é apolar e água é polar: sozinhas, não se misturam, porque as moléculas de água preferem manter suas ligações de hidrogênio entre si a envolver uma cadeia carbônica.

O sabão resolve o impasse por ser anfifílico, atendendo aos dois lados ao mesmo tempo. A cauda de hidrocarboneto, apolar, dissolve-se na gordura por forças de dispersão; a cabeça carboxilato, iônica, interage com a água por íon-dipolo.

Muitas moléculas se organizam então em micelas: caudas voltadas para dentro, envolvendo a gotícula de gordura, e cabeças iônicas voltadas para fora, de frente para a água. A gordura fica encapsulada numa partícula de superfície carregada, que a água carrega embora.

Não há reação química nenhuma nesse processo — a gordura sai quimicamente intacta, apenas dispersa. A reação (saponificação) aconteceu antes, na fabricação do sabão.

O mesmo princípio explica detergentes, emulsificantes de alimentos e a própria membrana celular.`,
});

qa({
  t: T2,
  sub: "Número de coordenação em cristais iônicos",
  dif: "dificil",
  e: String.raw`No cloreto de sódio cada íon é cercado por seis vizinhos de carga oposta, enquanto no cloreto de césio cada íon é cercado por oito. A causa dessa diferença de número de coordenação é:`,
  ok: "O maior raio do cátion no césio.",
  err: [
    "A maior carga do cátion no césio.",
    "A natureza covalente do cloreto de césio.",
    "A maior massa molar do cloreto de césio.",
    "A menor eletronegatividade do cloro no césio.",
  ],
  r: String.raw`Os dois sais têm a mesma proporção $1{:}1$ e cargas idênticas ($+1$ e $-1$), então a diferença não pode vir da estequiometria nem da carga.

O que decide é a GEOMETRIA: quantos ânions cabem, sem se tocarem, ao redor do cátion. Isso é governado pela razão entre os raios.

O $\text{Na}^+$ é pequeno ($102$ pm) frente ao $\text{Cl}^-$ ($181$ pm): só há espaço para seis vizinhos, num arranjo octaédrico. O $\text{Cs}^+$ é bem maior ($170$ pm), e a razão de raios sobe o bastante para acomodar oito, em arranjo cúbico.

A tendência é geral: cátion maior comporta número de coordenação maior. E há consequência energética direta — mais vizinhos significam mais interações atrativas por íon, o que entra na energia reticular através da constante de Madelung, característica de cada tipo de rede.`,
});

qa({
  t: T2,
  sub: "Elétrons deslocalizados e ponto de fusão dos metais",
  dif: "medio",
  e: String.raw`O sódio funde a $98\ ^\circ$C e o alumínio, a $660\ ^\circ$C, ambos metais de estrutura semelhante e do mesmo período. A causa dessa grande diferença é que o alumínio:`,
  ok: "Contribui com mais elétrons para o mar eletrônico.",
  err: [
    "Possui raio atômico maior que o do sódio.",
    "Forma ligações covalentes entre seus átomos.",
    "Tem menor carga nuclear efetiva na valência.",
    "Apresenta menor densidade que o sódio.",
  ],
  r: String.raw`No modelo do mar de elétrons, a coesão metálica vem da atração entre os cátions fixos e os elétrons deslocalizados que circulam entre eles. Quanto mais elétrons na nuvem e maior a carga do cátion, mais forte a ligação.

O sódio é $3s^1$: cede um elétron por átomo e deixa cátions $\text{Na}^+$. O alumínio é $3s^2\,3p^1$: cede TRÊS elétrons por átomo e deixa cátions $\text{Al}^{3+}$, menores e de carga tripla.

O resultado é uma ligação metálica muito mais intensa, que se traduz em ponto de fusão sete vezes maior, dureza superior e maior resistência mecânica.

Levando o raciocínio ao extremo, chega-se ao tungstênio, com muitos elétrons $d$ participando da ligação e fusão a $3422\ ^\circ$C — motivo pelo qual ele, e não o alumínio, era o filamento das lâmpadas incandescentes.`,
});

qa({
  t: T2,
  sub: "Elétrons deslocalizados e condução de calor",
  dif: "medio",
  e: String.raw`Uma panela de alumínio esquenta por igual em poucos segundos, enquanto um cabo de madeira do mesmo tamanho permanece frio. A alta condutividade térmica do metal é explicada:`,
  ok: "Pelos elétrons livres que transportam energia.",
  err: [
    "Pela vibração dos cátions da rede apenas.",
    "Pela baixa capacidade calorífica do metal.",
    "Pelas ligações covalentes direcionais do metal.",
    "Pela alta densidade do material metálico.",
  ],
  r: String.raw`Num isolante como a madeira, o calor só avança por vibração da rede: um átomo agitado empurra o vizinho, que empurra o próximo. É um mecanismo lento e de curto alcance.

No metal há um segundo canal, muito mais eficiente. Os elétrons deslocalizados do mar eletrônico não estão presos a átomo nenhum: ao receberem energia na região aquecida, movem-se rapidamente e a entregam por colisões em regiões distantes.

Como os mesmos elétrons livres respondem pela condução elétrica, as duas propriedades andam juntas — é o conteúdo da lei de Wiedemann-Franz, e por isso a prata e o cobre lideram as duas listas.

Fica explicado o projeto da panela: corpo metálico para distribuir calor depressa, cabo de polímero ou madeira para interromper esse transporte antes da mão.`,
});

qa({
  t: T2,
  sub: "Ligas metálicas e bloqueio do deslizamento de planos",
  dif: "dificil",
  e: String.raw`O aço, liga de ferro com pequena fração de carbono, é bem mais duro e resistente que o ferro puro. Do ponto de vista estrutural, isso ocorre porque os átomos de carbono:`,
  ok: "Dificultam o deslizamento entre planos de átomos.",
  err: [
    "Formam ligações iônicas com os átomos de ferro.",
    "Aumentam o número de elétrons deslocalizados.",
    "Reduzem a distância entre os cátions da rede.",
    "Substituem o mar de elétrons por ligações covalentes.",
  ],
  r: String.raw`A maleabilidade do metal puro vem da regularidade do cristal: os planos de átomos deslizam uns sobre os outros, e o mar de elétrons acompanha o movimento sem que nenhuma ligação específica seja rompida. Deformar é fácil.

O carbono é um átomo pequeno que se aloja nos interstícios da rede do ferro, formando uma liga intersticial. Essas irregularidades ancoram o movimento das discordâncias — os defeitos cuja propagação permite o deslizamento.

Com o deslizamento travado, o material resiste muito mais à deformação: mais duro, mais resistente e, como contrapartida, menos dúctil. Daí a diferença entre ferro doce, aço de baixo carbono e aço de alto carbono, que é duríssimo e quebradiço.

O princípio vale para as ligas em geral, e é a base de toda a engenharia de materiais metálicos — endurecer sem mudar o elemento principal.`,
});

qa({
  t: T2,
  sub: "Largura do gap e cor da luz emitida por LED",
  dif: "medio",
  e: String.raw`Diodos emissores de luz (LEDs) construídos com diferentes materiais semicondutores emitem cores diferentes. Um LED azul, comparado a um LED vermelho, é feito de um material com:`,
  ok: "Gap de energia maior.",
  err: [
    "Gap de energia menor.",
    "Dopagem apenas do tipo N.",
    "Condutividade elétrica menor.",
    "Temperatura de operação maior.",
  ],
  r: String.raw`No LED, elétrons injetados na banda de condução recombinam-se com lacunas da banda de valência. A energia liberada em cada recombinação sai como um fóton, e ela vale justamente a largura do gap:

$$E_{\text{fóton}} = E_g = \frac{hc}{\lambda}$$

Como a energia do fóton é inversamente proporcional ao comprimento de onda, cor e gap ficam amarrados: vermelho ($\approx 650$ nm) corresponde a $E_g \approx 1{,}9$ eV, e azul ($\approx 450$ nm) exige $E_g \approx 2{,}8$ eV.

Materiais de gap pequeno, como o arseneto de gálio, dão vermelho e infravermelho. Para chegar ao azul foi preciso dominar semicondutores de gap largo, como o nitreto de gálio — conquista que rendeu o Nobel de Física de 2014 e viabilizou a iluminação branca de LED, obtida com um LED azul recobrindo um fósforo amarelo.`,
});

qa({
  t: T2,
  sub: "Gap de energia e transparência do sólido",
  dif: "dificil",
  e: String.raw`O diamante é transparente à luz visível, enquanto o silício, de mesma estrutura cristalina, é opaco e acinzentado. A diferença decorre de o diamante ter:`,
  ok: "Gap maior que a energia do fóton visível.",
  err: [
    "Gap menor que a energia do fóton visível.",
    "Elétrons livres na banda de condução.",
    "Ligações covalentes mais longas que as do silício.",
    "Estrutura amorfa, sem bandas definidas.",
  ],
  r: String.raw`Um sólido absorve um fóton visível quando esse fóton consegue promover um elétron da banda de valência para a de condução. Se não consegue, a luz atravessa.

Os fótons visíveis têm entre $1{,}8$ e $3{,}1$ eV. O gap do silício é de $1{,}1$ eV — menor que qualquer um deles, de modo que todo o visível é absorvido e o material aparece opaco e escuro.

No diamante, as ligações C–C são curtas e fortes, e o gap sobe para $5{,}5$ eV. Nenhum fóton do visível tem energia suficiente para vencer esse degrau: a luz passa sem ser absorvida, e o cristal é transparente. Só a partir do ultravioleta profundo o diamante começa a absorver.

O mesmo critério explica por que isolantes de gap largo, como o quartzo e a alumina, são transparentes, enquanto metais, que sequer têm gap, refletem tudo.`,
});

finalizar();
