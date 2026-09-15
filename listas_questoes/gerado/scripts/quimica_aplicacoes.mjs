// Leva de equalização de Química Geral — tópico 4 da ementa:
// "Funções Inorgânicas e Reações Químicas — aplicações dos elementos e seus
// compostos no contexto das engenharias, energias alternativas e novos
// materiais".
//
// O banco tinha 47 questões no fluxo normal, mas quase todas do lado
// "funções inorgânicas" (nomenclatura, pH, óxidos, estequiometria). Estas 28
// fecham o tópico em 75 puxando para a metade da ementa que estava
// subaproveitada: engenharia de materiais, energia e processos industriais.
//
// Estilo: banca da UFF — o fenômeno e a aplicação, não a fórmula decorada.
import { criarLote, T4 } from "./quimica_kit.mjs";

const { qa, finalizar } = criarLote({ arquivo: "quimica_aplicacoes.json", semente: 20260918 });

// --- Energias alternativas --------------------------------------------------

qa({
  t: T4,
  sub: "Transesterificação na produção de biodiesel",
  dif: "medio",
  e: String.raw`O biodiesel é obtido pela reação de óleos vegetais com um álcool de cadeia curta, em meio catalisado por base. Além dos ésteres que constituem o combustível, essa reação produz:`,
  ok: "Glicerol.",
  err: ["Água.", "Gás carbônico.", "Etanol.", "Ácido sulfúrico."],
  r: String.raw`O óleo vegetal é formado por triglicerídeos: três cadeias de ácido graxo esterificadas a uma molécula de glicerol.

Na transesterificação, cada uma dessas três cadeias troca o glicerol por um álcool curto (metanol ou etanol), formando três ésteres de cadeia menor — é esse conjunto de ésteres que constitui o biodiesel, com viscosidade compatível com o motor diesel.

O glicerol liberado é o coproduto inevitável: cerca de $10\%$ em massa da produção. Denso e imiscível com o biodiesel, separa-se por decantação, e sua valorização (cosméticos, resinas, insumos) é parte importante da economia do processo.

A base (usualmente $\text{NaOH}$ ou $\text{KOH}$) atua como catalisador e não é consumida.`,
});

qa({
  t: T4,
  sub: "Balanço de carbono dos biocombustíveis",
  dif: "medio",
  e: String.raw`A queima do etanol de cana libera $\text{CO}_2$, assim como a da gasolina. Ainda assim, o etanol é considerado um combustível de menor impacto no efeito estufa porque seu carbono:`,
  ok: "Foi retirado da atmosfera pela própria cana.",
  err: [
    "Não se transforma em $\\text{CO}_2$ na combustão.",
    "Provém de reservas fósseis renováveis.",
    "É liberado na forma de $\\text{CO}$, e não de $\\text{CO}_2$.",
    "Permanece fixado nas cinzas da queima.",
  ],
  r: String.raw`A combustão dos dois combustíveis produz $\text{CO}_2$, e por mol de carbono a quantidade é a mesma. A diferença está na ORIGEM desse carbono.

O carbono da gasolina esteve preso no subsolo por milhões de anos; queimá-lo acrescenta $\text{CO}_2$ novo ao ciclo atmosférico atual.

O carbono do etanol foi fixado pela fotossíntese da cana no ciclo anterior, meses antes:

$$6\text{CO}_2 + 6\text{H}_2\text{O} \xrightarrow{\text{luz}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2$$

O que a queima devolve é o que a planta havia retirado, num ciclo curto e fechado — daí a expressão "carbono neutro".

A neutralidade, porém, é aproximada: plantio, fertilizantes, transporte e destilação consomem energia, muitas vezes fóssil. O balanço real é favorável, mas não é zero.`,
});

qa({
  t: T4,
  sub: "Biogás e digestão anaeróbia",
  dif: "facil",
  e: String.raw`Aterros sanitários e biodigestores de resíduos orgânicos produzem biogás pela ação de microrganismos em ausência de oxigênio. O principal componente combustível do biogás é:`,
  ok: "O gás metano.",
  err: ["O gás carbônico.", "O gás hidrogênio.", "O gás nitrogênio.", "O gás sulfídrico."],
  r: String.raw`Na digestão anaeróbia, bactérias metanogênicas degradam a matéria orgânica sem oxigênio disponível, gerando uma mistura tipicamente de $50$ a $70\%$ de $\text{CH}_4$ e $30$ a $50\%$ de $\text{CO}_2$, com traços de $\text{H}_2\text{S}$ e vapor d'água.

O poder calorífico vem só do metano — o $\text{CO}_2$ já é produto de oxidação completa e não queima; o $\text{H}_2\text{S}$ aparece em quantidade mínima e é indesejável, pois gera $\text{SO}_2$ e corrói o equipamento.

Há um segundo ganho ambiental além da energia: o metano tem potencial de aquecimento global muito superior ao do $\text{CO}_2$. Captá-lo e queimá-lo converte um gás de efeito estufa potente em outro bem mais fraco, o que faz do aproveitamento do biogás uma medida climática por si só.`,
});

qa({
  t: T4,
  sub: "Hidrogênio verde e hidrogênio cinza",
  dif: "medio",
  e: String.raw`Chama-se hidrogênio verde aquele produzido pela eletrólise da água com eletricidade de fonte renovável, em oposição ao hidrogênio cinza, obtido pela reforma a vapor do gás natural. A vantagem ambiental do primeiro é que sua produção:`,
  ok: "Não emite $\\text{CO}_2$ como coproduto.",
  err: [
    "Consome menos energia por mol de $\\text{H}_2$.",
    "Dispensa o uso de água como matéria-prima.",
    "Gera hidrogênio de maior poder calorífico.",
    "Ocorre espontaneamente, sem energia externa.",
  ],
  r: String.raw`A rota cinza parte do metano e libera carbono inevitavelmente:

$$\text{CH}_4 + \text{H}_2\text{O} \to \text{CO} + 3\text{H}_2 \qquad \text{seguido de} \qquad \text{CO} + \text{H}_2\text{O} \to \text{CO}_2 + \text{H}_2$$

Cerca de $9$ kg de $\text{CO}_2$ por kg de $\text{H}_2$ — o hidrogênio sai limpo, mas sua produção não foi.

A rota verde parte da água:

$$2\text{H}_2\text{O} \to 2\text{H}_2 + \text{O}_2$$

Não há carbono envolvido em lugar nenhum, e o único coproduto é oxigênio. Se a eletricidade vem de fonte renovável, o ciclo inteiro fica livre de emissões.

Atenção a duas alternativas tentadoras: a eletrólise é MAIS cara em energia (a reação é fortemente não espontânea, $\Delta G > 0$), e o $\text{H}_2$ produzido é quimicamente idêntico nas duas rotas. A vantagem é exclusivamente de emissão.`,
});

qa({
  t: T4,
  sub: "Armazenamento de hidrogênio em hidretos metálicos",
  dif: "dificil",
  e: String.raw`Uma das estratégias para armazenar hidrogênio com segurança consiste em fazê-lo reagir com ligas metálicas, formando hidretos que o liberam sob aquecimento. A principal vantagem desse método frente ao gás comprimido é:`,
  ok: "A maior quantidade de $\\text{H}_2$ por unidade de volume.",
  err: [
    "A maior energia liberada por mol de $\\text{H}_2$.",
    "A dispensa de qualquer fonte de calor.",
    "A conversão do $\\text{H}_2$ em combustível líquido.",
    "A eliminação da necessidade de célula a combustível.",
  ],
  r: String.raw`O hidrogênio tem excelente energia por unidade de MASSA e péssima por unidade de VOLUME: é a molécula mais leve que existe, e como gás ocupa espaço demais. Daí os cilindros a $700$ bar, com as exigências estruturais e os riscos que isso impõe.

No hidreto metálico, os átomos de hidrogênio se alojam nos interstícios da rede cristalina da liga, empacotados a densidade comparável — às vezes superior — à do hidrogênio líquido, e tudo isso a pressão moderada.

A liberação é controlada por temperatura, o que dá uma vantagem de segurança relevante: um vazamento não esvazia o reservatório de uma vez, porque o hidrogênio só sai com aporte de calor.

O preço a pagar é o peso do metal e a necessidade de gerenciar calor na carga e na descarga — por isso a técnica é atraente em aplicações estacionárias e submarinas, e menos em veículos leves.`,
});

qa({
  t: T4,
  sub: "Purificação do silício para uso eletrônico",
  dif: "dificil",
  e: String.raw`O silício obtido pela redução da sílica com carbono em forno elétrico tem pureza em torno de $98\%$, insuficiente para dispositivos eletrônicos, que exigem pureza muito maior. A necessidade dessa purificação extrema decorre de que as impurezas:`,
  ok: "Alteram de forma descontrolada a condutividade.",
  err: [
    "Elevam demais o ponto de fusão do silício.",
    "Impedem a formação da rede cristalina.",
    "Tornam o silício quimicamente instável ao ar.",
    "Reduzem a resistência mecânica das lâminas.",
  ],
  r: String.raw`Num semicondutor, a condutividade é determinada por dopantes em concentrações minúsculas — partes por bilhão já mudam o comportamento elétrico do material.

Se o cristal traz impurezas em nível percentual, elas próprias funcionam como dopantes aleatórios, e não há como estabelecer o perfil controlado de regiões tipo N e tipo P de que uma junção depende. O dispositivo simplesmente não funciona.

Por isso o silício metalúrgico é convertido em triclorossilano, destilado com rigor e reduzido de volta a silício ultrapuro (processo Siemens), chegando ao grau eletrônico com cerca de $99{,}9999999\%$ — o chamado "9N". Em seguida o método Czochralski puxa dali um monocristal, porque contornos de grão também atrapalham o transporte de carga.

Só depois disso a dopagem intencional é introduzida, em quantidade e posição controladas.`,
});

qa({
  t: T4,
  sub: "Materiais compósitos em pás de aerogeradores",
  dif: "medio",
  e: String.raw`As pás de turbinas eólicas são fabricadas em compósito de fibra de vidro com resina epóxi. Nesse material, a função da resina é:`,
  ok: "Unir as fibras e transferir esforços entre elas.",
  err: [
    "Suportar sozinha os esforços de tração.",
    "Conduzir a eletricidade gerada pela turbina.",
    "Substituir as fibras em regiões de maior carga.",
    "Aumentar a densidade do conjunto estrutural.",
  ],
  r: String.raw`Um compósito combina dois materiais com papéis distintos e complementares.

A fibra de vidro é o REFORÇO: resiste muito bem à tração ao longo de seu eixo, mas isolada é apenas um feixe de filamentos, sem forma nem resistência a compressão.

A resina epóxi é a MATRIZ: envolve as fibras, dá forma à peça, protege contra umidade e abrasão e, principalmente, transfere o esforço de uma fibra para a vizinha por cisalhamento. Sem ela, uma fibra rompida deixaria de contribuir e o dano se propagaria.

O resultado é uma pá com rigidez elevada e densidade baixa — relação resistência/peso decisiva num componente de dezenas de metros que gira em balanço e precisa suportar fadiga por décadas.

É a mesma lógica do concreto armado (aço à tração, concreto à compressão) e da fibra de carbono na aeronáutica.`,
});

// --- Materiais de construção e cerâmicos -----------------------------------

qa({
  t: T4,
  sub: "Endurecimento do cimento por hidratação",
  dif: "medio",
  e: String.raw`Uma ideia comum, mas equivocada, é a de que o concreto endurece por secagem da água de amassamento. Na verdade, o endurecimento do cimento Portland resulta:`,
  ok: "Da hidratação dos silicatos de cálcio.",
  err: [
    "Da evaporação total da água adicionada.",
    "Da cristalização do carbonato de cálcio.",
    "Da oxidação do ferro presente no clínquer.",
    "Da fusão parcial dos grãos de cimento.",
  ],
  r: String.raw`A água não é apenas veículo para dar plasticidade: ela é REAGENTE.

Os silicatos de cálcio do clínquer reagem com a água formando silicato de cálcio hidratado (o C–S–H), um gel de partículas fibrosas que cresce, se entrelaça e preenche os espaços entre os grãos, além de hidróxido de cálcio.

Daí decorrem duas consequências práticas que todo canteiro conhece. A primeira é a cura úmida: é preciso MANTER a peça úmida por dias, porque a reação precisa de água para prosseguir — concreto que seca cedo demais para de ganhar resistência. A segunda é que o concreto endurece perfeitamente debaixo d'água, o que seria impossível se dependesse de evaporação.

A reação também é exotérmica, e em peças de grande volume o calor de hidratação precisa ser controlado para evitar fissuras térmicas.`,
});

qa({
  t: T4,
  sub: "Carbonatação do concreto e corrosão da armadura",
  dif: "dificil",
  e: String.raw`O aço embutido no concreto é protegido da corrosão pelo meio fortemente alcalino da pasta de cimento. Com o tempo, o $\text{CO}_2$ do ar penetra no concreto e provoca a corrosão da armadura porque:`,
  ok: "Reduz o pH e destrói a camada passivadora.",
  err: [
    "Aumenta o pH e dissolve o óxido de ferro.",
    "Reage diretamente com o aço, formando carbonetos.",
    "Aumenta a condutividade elétrica do concreto úmido.",
    "Converte o ferro metálico em carbonato de ferro.",
  ],
  r: String.raw`O concreto novo tem pH em torno de $13$, graças ao $\text{Ca(OH)}_2$ da hidratação. Nessa alcalinidade o aço forma espontaneamente um filme de óxido aderente e impermeável — está passivado, e não corrói mesmo em presença de umidade e oxigênio.

O $\text{CO}_2$ atmosférico difunde pelos poros e neutraliza essa reserva alcalina:

$$\text{CO}_2 + \text{Ca(OH)}_2 \to \text{CaCO}_3 + \text{H}_2\text{O}$$

À medida que a frente de carbonatação avança da superfície para o interior, o pH cai para valores abaixo de $9$. Nessa faixa o filme passivador deixa de ser estável, e o aço volta a se comportar como metal exposto: começa a corroer.

A ferrugem formada ocupa várias vezes o volume do aço original, e a pressão interna fissura e destaca o cobrimento — quadro clássico de patologia em estruturas antigas. Daí a importância do cobrimento mínimo e da baixa porosidade do concreto.`,
});

qa({
  t: T4,
  sub: "Estrutura amorfa do vidro",
  dif: "medio",
  e: String.raw`Ao ser aquecido, o vidro comum não funde a uma temperatura definida: amolece gradualmente ao longo de uma faixa. Esse comportamento decorre de o vidro ser um sólido:`,
  ok: "Amorfo, sem ordenação de longo alcance.",
  err: [
    "Cristalino, com rede iônica bem definida.",
    "Molecular, unido por forças de dispersão.",
    "Metálico, com elétrons deslocalizados.",
    "Polimérico, formado por cadeias orgânicas.",
  ],
  r: String.raw`Num sólido cristalino todas as ligações são equivalentes e se rompem essencialmente à mesma temperatura — por isso o ponto de fusão é nítido.

O vidro é obtido resfriando a sílica fundida rápido demais para que os tetraedros de $\text{SiO}_4$ se organizem. Eles ficam ligados entre si, mas em arranjo desordenado, sem periodicidade — é um sólido amorfo, por vezes descrito como um líquido de viscosidade altíssima.

Nessa desordem, os ângulos e as tensões das ligações variam de região para região: umas cedem antes, outras depois. O material vai perdendo viscosidade progressivamente em vez de fundir de uma vez.

É justamente essa faixa de amolecimento que permite soprar, moldar e estirar o vidro — trabalhá-lo em estado pastoso seria impossível se ele tivesse ponto de fusão definido.`,
});

qa({
  t: T4,
  sub: "Cerâmicas avançadas e ligações no sólido",
  dif: "medio",
  e: String.raw`Cerâmicas avançadas como a alumina e o carbeto de silício são extremamente duras, resistem a temperaturas muito altas e, ao mesmo tempo, são frágeis. Essa combinação decorre de suas ligações serem:`,
  ok: "Fortes e direcionais, sem elétrons livres.",
  err: [
    "Fracas e direcionais, com elétrons livres.",
    "Fortes e não direcionais, com elétrons livres.",
    "Fracas e não direcionais, sem elétrons livres.",
    "Metálicas, com mar de elétrons deslocalizados.",
  ],
  r: String.raw`As três propriedades citadas têm a mesma raiz estrutural.

As ligações iônicas e covalentes desses materiais são muito fortes, o que exige enorme energia para separar os átomos: daí a dureza, a rigidez e pontos de fusão acima de $2000\ ^\circ$C, que os tornam refratários.

São também DIRECIONAIS: cada átomo tem posição e orientação definidas. Diferente do metal, onde planos deslizam sem quebrar ligação (o mar de elétrons acompanha), na cerâmica um deslizamento colocaria íons de mesma carga frente a frente. O material não tem como se deformar plasticamente e, ao ser sobrecarregado, propaga uma trinca — rompe de forma frágil, sem aviso.

A ausência de elétrons livres completa o quadro: são isolantes elétricos e térmicos.

A engenharia contorna a fragilidade com compósitos e controle rigoroso de defeitos, já que a resistência real é ditada pela maior falha presente.`,
});

qa({
  t: T4,
  sub: "Polímeros termoplásticos e termofixos",
  dif: "medio",
  e: String.raw`Uma garrafa de polietileno pode ser fundida e remoldada várias vezes, enquanto um cabo de panela em baquelite carboniza sem amolecer. A diferença estrutural entre os dois polímeros é a presença, no termofixo, de:`,
  ok: "Ligações covalentes cruzadas entre as cadeias.",
  err: [
    "Cadeias mais longas e de maior massa molar.",
    "Ligações de hidrogênio entre as cadeias.",
    "Anéis aromáticos na cadeia principal.",
    "Cadeias lineares sem ramificações.",
  ],
  r: String.raw`No termoplástico as cadeias são independentes, mantidas juntas apenas por forças intermoleculares. Aquecer vence essas forças: as cadeias deslizam umas sobre as outras e o material escoa. Ao resfriar, as forças voltam a atuar e o sólido se refaz — processo reversível, e por isso o termoplástico é reciclável mecanicamente.

No termofixo, a cura cria ligações covalentes ENTRE as cadeias, transformando todo o objeto numa única rede tridimensional. Não existem mais moléculas separadas que possam deslizar.

Aquecer, então, não amolece: a energia térmica acaba rompendo ligações covalentes ao acaso, e o material degrada ou carboniza antes de escoar.

Esse é o compromisso de projeto: o termofixo oferece estabilidade dimensional e resistência térmica superiores (daí o cabo de panela), ao custo de não poder ser remoldado nem reciclado por fusão.`,
});

qa({
  t: T4,
  sub: "Polimerização por adição e por condensação",
  dif: "medio",
  e: String.raw`O polietileno é obtido pela ligação sucessiva de moléculas de eteno, sem que nenhuma outra substância seja formada. Já o náilon se forma com eliminação de água a cada ligação. Essas reações são classificadas, respectivamente, como polimerização por:`,
  ok: "Adição e por condensação.",
  err: [
    "Condensação e por adição.",
    "Adição e por substituição.",
    "Substituição e por condensação.",
    "Oxidação e por redução.",
  ],
  r: String.raw`Na polimerização por ADIÇÃO, o monômero precisa ter uma insaturação. A ligação $\pi$ se abre e o carbono passa a ligar-se ao monômero seguinte; todos os átomos do monômero permanecem no polímero, e não há subproduto:

$$n\,\text{CH}_2\!=\!\text{CH}_2 \to (\text{CH}_2\!-\!\text{CH}_2)_n$$

Na polimerização por CONDENSAÇÃO, o monômero traz dois grupos funcionais reativos nas pontas (amina e ácido, no caso do náilon). A cada ligação formada, uma molécula pequena é eliminada — geralmente água.

A distinção tem consequência industrial: por condensação, a água precisa ser removida continuamente, ou o equilíbrio para; e a massa do polímero é menor que a soma dos monômeros, justamente pelo que foi eliminado.

Poliésteres (PET), poliamidas (náilon) e poliuretanos são de condensação; polietileno, PVC, poliestireno e polipropileno, de adição.`,
});

qa({
  t: T4,
  sub: "Reciclagem química do PET por despolimerização",
  dif: "dificil",
  e: String.raw`Além da reciclagem mecânica, o PET admite reciclagem química, em que o polímero é tratado de modo a regenerar seus monômeros de partida. Isso é possível porque o PET é formado por ligações:`,
  ok: "Éster, passíveis de hidrólise.",
  err: [
    "Amida, resistentes à hidrólise.",
    "Carbono-carbono, apolares e inertes.",
    "Iônicas, dissociáveis em água.",
    "De hidrogênio, rompidas por aquecimento.",
  ],
  r: String.raw`O PET é um poliéster: sua cadeia principal é formada por ligações éster entre um diácido (tereftálico) e um diol (etilenoglicol), que se alternam.

A ligação éster é reversível. Em condições adequadas — hidrólise, glicólise ou metanólise, com calor e catalisador — a cadeia é quebrada exatamente nos pontos onde foi formada, devolvendo os monômeros originais. Purificados, eles voltam a polimerizar com qualidade de resina virgem.

Essa é a grande vantagem sobre a reciclagem mecânica, em que cada ciclo de fusão degrada um pouco as cadeias e o material vai perdendo propriedades até só servir para aplicações menos exigentes.

Poliolefinas como polietileno e polipropileno não têm essa saída: sua cadeia é só carbono-carbono, sem ponto fraco para atacar seletivamente. A rota química para elas é a pirólise, que quebra a cadeia ao acaso e produz uma mistura de hidrocarbonetos, não os monômeros de volta.`,
});

qa({
  t: T4,
  sub: "Nanotubos de carbono e grafeno como novos materiais",
  dif: "medio",
  e: String.raw`Grafeno e nanotubos de carbono apresentam resistência mecânica excepcional aliada a alta condutividade elétrica. Ambas as propriedades decorrem de seus átomos de carbono estarem:`,
  ok: "Ligados em rede $sp^2$ com elétrons deslocalizados.",
  err: [
    "Ligados em rede $sp^3$ com elétrons localizados.",
    "Unidos por forças de dispersão entre camadas.",
    "Arranjados de forma amorfa, sem periodicidade.",
    "Ligados a átomos de hidrogênio nas bordas.",
  ],
  r: String.raw`Cada carbono $sp^2$ faz três ligações $\sigma$ no plano, a $120^\circ$, formando a malha hexagonal. Essas ligações C–C estão entre as mais fortes que se conhece, e é delas que vem a resistência à tração — cerca de $130$ GPa para o grafeno, mais de cem vezes a de um aço estrutural, com uma fração do peso.

Sobra em cada carbono um orbital $p$ perpendicular ao plano. Todos eles se superpõem lateralmente, formando uma nuvem $\pi$ contínua sobre e sob a folha, na qual os elétrons circulam sem estarem presos a nenhum átomo: daí a condutividade elétrica elevada.

As duas propriedades, portanto, são faces do MESMO arranjo eletrônico — o que é raro, já que bons condutores costumam ser metais dúcteis e materiais muito rígidos costumam ser isolantes.

O contraste com o diamante fecha o argumento: lá o carbono é $sp^3$, usa os quatro elétrons em ligações $\sigma$, e o resultado é duríssimo, porém isolante.`,
});

// --- Água, ambiente e processos --------------------------------------------

qa({
  t: T4,
  sub: "Coagulação no tratamento de água",
  dif: "medio",
  e: String.raw`Na estação de tratamento, a adição de sulfato de alumínio à água bruta antecede a floculação e a decantação. A função desse sal é:`,
  ok: "Aglomerar as partículas coloidais em suspensão.",
  err: [
    "Eliminar os microrganismos patogênicos presentes.",
    "Corrigir a dureza causada por cálcio e magnésio.",
    "Neutralizar a acidez da água captada no manancial.",
    "Oxidar a matéria orgânica dissolvida na água.",
  ],
  r: String.raw`A turbidez da água bruta vem de partículas coloidais — argila, silte, matéria orgânica — pequenas demais para decantar sozinhas. Elas se mantêm dispersas porque têm carga superficial negativa e se repelem mutuamente.

O $\text{Al}_2(\text{SO}_4)_3$ fornece íons $\text{Al}^{3+}$, cuja carga alta neutraliza essa repulsão, e hidrolisa formando hidróxido de alumínio gelatinoso:

$$\text{Al}^{3+} + 3\text{H}_2\text{O} \to \text{Al(OH)}_3 + 3\text{H}^+$$

Esse precipitado volumoso arrasta e engloba as partículas ao sedimentar. Na floculação, a agitação lenta faz os aglomerados crescerem até ficarem pesados o bastante para decantar.

Repare que cada etapa da ETA resolve um problema: a coagulação/floculação tira a turbidez, a filtração retém o que restou, e só a desinfecção com cloro elimina patógenos. A hidrólise ainda acidifica a água, o que costuma exigir correção de pH com cal.`,
});

qa({
  t: T4,
  sub: "Cloração da água e ação do ácido hipocloroso",
  dif: "medio",
  e: String.raw`A desinfecção da água por cloro gasoso baseia-se na reação $\text{Cl}_2 + \text{H}_2\text{O} \rightleftharpoons \text{HClO} + \text{HCl}$. A espécie responsável pelo efeito germicida é:`,
  ok: "O ácido hipocloroso.",
  err: [
    "O ácido clorídrico.",
    "O íon cloreto.",
    "O gás oxigênio dissolvido.",
    "O íon hidrônio formado.",
  ],
  r: String.raw`Dos produtos da hidrólise, o $\text{HCl}$ é apenas um ácido forte que se dissocia em $\text{H}^+$ e $\text{Cl}^-$ — íons inócuos para bactérias nas concentrações usadas.

O agente ativo é o ácido hipocloroso. Ele é um oxidante forte e, por ser uma molécula NEUTRA e pequena, atravessa a membrana celular do microrganismo, oxidando enzimas e proteínas no interior da célula.

Daí uma consequência operacional importante: o $\text{HClO}$ é um ácido fraco, e em pH alto ele se converte em hipoclorito, $\text{ClO}^-$. O ânion, carregado, atravessa mal a membrana e é várias vezes menos eficiente.

Por isso a cloração é muito mais eficaz em pH ligeiramente ácido a neutro, e o controle de pH faz parte do processo de desinfecção — não é um detalhe à parte.`,
});

qa({
  t: T4,
  sub: "Dureza da água e incrustação",
  dif: "facil",
  e: String.raw`A água dura provoca incrustações em caldeiras e tubulações industriais e reduz a eficiência de sabões. A dureza é causada pela presença de concentrações elevadas de íons:`,
  ok: "Cálcio e magnésio.",
  err: [
    "Sódio e potássio.",
    "Cloreto e nitrato.",
    "Ferro e alumínio.",
    "Amônio e fosfato.",
  ],
  r: String.raw`Dureza é o teor de cátions divalentes na água, essencialmente $\text{Ca}^{2+}$ e $\text{Mg}^{2+}$, dissolvidos na passagem por terrenos calcários.

Os dois problemas clássicos vêm da mesma origem. Aquecida, a água perde $\text{CO}_2$ e o bicarbonato dissolvido se converte em carbonato insolúvel, que incrusta a superfície de troca térmica:

$$\text{Ca(HCO}_3)_2 \to \text{CaCO}_3 + \text{H}_2\text{O} + \text{CO}_2$$

Essa crosta é isolante térmica e derruba a eficiência da caldeira, além de superaquecer localmente o metal. Com o sabão, os mesmos cátions formam sais de ácido graxo insolúveis — a nata que gruda no azulejo — consumindo o produto antes que ele espume.

O abrandamento se faz precipitando esses íons com cal e barrilha, ou trocando-os por sódio numa resina de troca iônica.`,
});

qa({
  t: T4,
  sub: "CFC e destruição catalítica do ozônio",
  dif: "dificil",
  e: String.raw`Os clorofluorcarbonos são gases inertes na baixa atmosfera, mas causam grande destruição da camada de ozônio na estratosfera. Isso ocorre porque a radiação ultravioleta libera deles átomos de cloro que:`,
  ok: "Destroem muitas moléculas de ozônio cada um.",
  err: [
    "Destroem uma molécula de ozônio cada um.",
    "Reagem com o oxigênio formando mais ozônio.",
    "Absorvem diretamente a radiação ultravioleta.",
    "Se combinam permanentemente com o ozônio.",
  ],
  r: String.raw`A inércia dos CFCs na troposfera é parte do problema: por não reagirem com nada, sobrevivem anos e chegam intactos à estratosfera. Lá o UV de alta energia quebra a ligação C–Cl e libera radicais cloro.

O ponto decisivo é que o cloro age como CATALISADOR, em ciclo:

$$\text{Cl} + \text{O}_3 \to \text{ClO} + \text{O}_2$$
$$\text{ClO} + \text{O} \to \text{Cl} + \text{O}_2$$

Na segunda etapa o cloro é REGENERADO e volta a atacar outra molécula de ozônio. Um único átomo pode destruir da ordem de $10^5$ moléculas de $\text{O}_3$ antes de ser removido por alguma reação de terminação.

É esse fator de amplificação que explica como concentrações ínfimas de CFC produziram o buraco na camada de ozônio, e por que o Protocolo de Montreal, ao eliminar a fonte, foi um dos acordos ambientais mais bem-sucedidos já firmados.`,
});

qa({
  t: T4,
  sub: "Potencial de aquecimento global do metano",
  dif: "medio",
  e: String.raw`Vazamentos de gás natural preocupam do ponto de vista climático mesmo em pequena escala, pois o metano, comparado a massa igual de $\text{CO}_2$:`,
  ok: "Retém muito mais calor na atmosfera.",
  err: [
    "Retém a mesma quantidade de calor.",
    "Permanece muito mais tempo na atmosfera.",
    "Destrói a camada de ozônio estratosférico.",
    "Produz chuva ácida ao ser oxidado.",
  ],
  r: String.raw`Um gás de efeito estufa absorve radiação infravermelha emitida pela superfície terrestre. A eficiência com que faz isso depende de seus modos vibracionais, e a molécula de $\text{CH}_4$ absorve em faixas do infravermelho onde o $\text{CO}_2$ e o vapor d'água absorvem pouco — justamente por isso cada molécula sua rende muito mais aquecimento.

Em base mássica e horizonte de $100$ anos, o metano tem potencial de aquecimento global cerca de $28$ vezes maior que o do $\text{CO}_2$.

O tempo de permanência vai na direção OPOSTA e é o que torna a alternativa sobre duração incorreta: o metano é oxidado na atmosfera em cerca de $12$ anos, enquanto parte do $\text{CO}_2$ permanece por séculos.

A combinação das duas coisas tem uma implicação prática relevante: cortar emissões de metano produz efeito climático rápido, ao contrário do $\text{CO}_2$, cujo estoque já emitido continuará atuando por muito tempo.`,
});

qa({
  t: T4,
  sub: "Conversor catalítico e controle de emissões veiculares",
  dif: "medio",
  e: String.raw`O conversor catalítico dos automóveis trata simultaneamente os gases de escapamento, convertendo $\text{CO}$ e hidrocarbonetos em $\text{CO}_2$ e $\text{H}_2\text{O}$ e tratando os óxidos de nitrogênio. Estes últimos são convertidos em:`,
  ok: String.raw`$\text{N}_2$, por redução.`,
  err: [
    String.raw`$\text{N}_2$, por oxidação.`,
    String.raw`$\text{NH}_3$, por oxidação.`,
    String.raw`$\text{HNO}_3$, por redução.`,
    String.raw`$\text{N}_2\text{O}$, por oxidação.`,
  ],
  r: String.raw`O conversor é chamado de "três vias" porque trata três poluentes com processos de naturezas opostas, no mesmo dispositivo.

Duas vias são de OXIDAÇÃO, sobre platina e paládio: o monóxido de carbono e os hidrocarbonetos não queimados são levados até $\text{CO}_2$ e $\text{H}_2\text{O}$.

A terceira é de REDUÇÃO, sobre ródio. Os óxidos $\text{NO}$ e $\text{NO}_2$ — formados a partir do $\text{N}_2$ e do $\text{O}_2$ do ar sob a alta temperatura da combustão — têm o nitrogênio em estado de oxidação positivo, e devolvê-lo à forma elementar exige ganho de elétrons:

$$2\text{NO} + 2\text{CO} \to \text{N}_2 + 2\text{CO}_2$$

A reação é elegante porque um poluente reduz o outro. Para que as três vias funcionem ao mesmo tempo, a mistura ar/combustível precisa ficar muito próxima da estequiométrica — é o que a sonda lambda controla.

Tratar o $\text{NO}_x$ importa porque ele forma ozônio troposférico, chuva ácida e material particulado fino.`,
});

// --- Metalurgia e indústria química ----------------------------------------

qa({
  t: T4,
  sub: "Redução do minério de ferro no alto-forno",
  dif: "medio",
  e: String.raw`No alto-forno, a hematita ($\text{Fe}_2\text{O}_3$) é convertida em ferro metálico. A espécie que atua como agente redutor principal nesse processo é:`,
  ok: String.raw`$\text{CO}$`,
  err: [
    String.raw`$\text{CO}_2$`,
    String.raw`$\text{O}_2$`,
    String.raw`$\text{SiO}_2$`,
    String.raw`$\text{CaCO}_3$`,
  ],
  r: String.raw`O coque carregado no topo do forno queima na região das ventaneiras e, em seguida, reage com o excesso de carbono quente gerando monóxido:

$$\text{C} + \text{CO}_2 \to 2\text{CO}$$

É esse $\text{CO}$, subindo em contracorrente, que retira o oxigênio do minério em etapas sucessivas:

$$\text{Fe}_2\text{O}_3 + 3\text{CO} \to 2\text{Fe} + 3\text{CO}_2$$

O carbono do coque, portanto, cumpre três papéis — combustível que fornece calor, fonte do redutor e, dissolvido no ferro líquido, componente que abaixa o ponto de fusão e produz o gume bruto.

Os outros itens têm funções distintas: o $\text{O}_2$ do ar soprado é oxidante, o $\text{CaCO}_3$ entra como fundente e se decompõe em $\text{CaO}$ para capturar a ganga de sílica, formando a escória, e o $\text{SiO}_2$ é justamente essa impureza a ser removida.`,
});

qa({
  t: T4,
  sub: "Criolita na obtenção eletrolítica do alumínio",
  dif: "dificil",
  e: String.raw`Na produção industrial do alumínio pelo processo Hall-Héroult, a alumina é dissolvida em criolita fundida antes da eletrólise. A função da criolita é:`,
  ok: "Reduzir a temperatura de operação da célula.",
  err: [
    "Atuar como agente redutor da alumina.",
    "Fornecer os íons alumínio que serão reduzidos.",
    "Impedir a oxidação dos eletrodos de carbono.",
    "Aumentar a voltagem necessária à eletrólise.",
  ],
  r: String.raw`O alumínio é reativo demais para ser obtido por redução com carbono, como o ferro: só a eletrólise dá conta. E ela exige o óxido no estado líquido, para que os íons tenham mobilidade.

O problema é que a alumina pura funde a cerca de $2050\ ^\circ$C — temperatura proibitiva em custo de energia e em materiais de contenção.

Dissolvida em criolita fundida ($\text{Na}_3\text{AlF}_6$), a alumina forma um banho eletrolítico que opera em torno de $960\ ^\circ$C. É o mesmo princípio do abaixamento crioscópico levado à escala industrial: mais de mil graus economizados.

A criolita não é consumida na reação — quem se reduz no catodo é o alumínio da alumina, e os anodos de carbono é que são gastos, consumidos pelo oxigênio liberado.

Ainda assim o processo é dos mais intensivos em eletricidade da indústria, o que explica por que fábricas de alumínio se instalam junto a hidrelétricas e por que reciclar alumínio economiza cerca de $95\%$ dessa energia.`,
});

qa({
  t: T4,
  sub: "Ligas leves de alta resistência específica",
  dif: "facil",
  e: String.raw`Ligas de alumínio e de titânio são amplamente empregadas na indústria aeronáutica em substituição ao aço. A propriedade que justifica essa escolha é a elevada:`,
  ok: "Resistência mecânica por unidade de massa.",
  err: [
    "Resistência mecânica por unidade de volume.",
    "Condutividade elétrica do material.",
    "Temperatura de fusão do material.",
    "Dureza superficial do material.",
  ],
  r: String.raw`Em estrutura de aeronave, o que conta não é a resistência absoluta, e sim a resistência ESPECÍFICA — resistência dividida pela densidade. Cada quilo de estrutura é um quilo a menos de carga paga, e consome combustível durante toda a vida do avião.

O aço é muito resistente, mas tem densidade de $7{,}8$ g/cm³. As ligas de alumínio ficam em torno de $2{,}7$ g/cm³ e as de titânio, em $4{,}5$ g/cm³, com resistência comparável à de aços estruturais. A relação resistência/peso, portanto, é bem superior.

Cada uma tem seu nicho: o alumínio domina a fuselagem e as asas, por custo e conformabilidade; o titânio vai onde há temperatura elevada e exigência de resistência à corrosão, como em componentes de motor e trens de pouso.

Os dois ainda contam com uma camada de óxido passivadora que os protege da corrosão — vantagem adicional relevante em serviço.`,
});

qa({
  t: T4,
  sub: "Ímãs de terras raras em geradores e motores",
  dif: "medio",
  e: String.raw`Aerogeradores modernos e motores elétricos de alto desempenho empregam ímãs permanentes de neodímio-ferro-boro. A vantagem desses ímãs sobre os de ferrita é permitirem:`,
  ok: "Campo magnético intenso em volume reduzido.",
  err: [
    "Operação em temperaturas muito mais altas.",
    "Maior resistência à corrosão atmosférica.",
    "Custo de matéria-prima significativamente menor.",
    "Condutividade elétrica muito mais elevada.",
  ],
  r: String.raw`O neodímio é um lantanídeo com muitos elétrons $4f$ desemparelhados, o que lhe confere momento magnético elevado. Combinado a ferro e boro numa estrutura cristalina de forte anisotropia, resulta o ímã permanente mais potente disponível comercialmente.

O ganho prático é de densidade de energia: o mesmo campo é obtido com uma fração do volume e da massa de um ímã de ferrita. Num aerogerador instalado no topo de uma torre, ou num motor de veículo elétrico, isso permite máquinas compactas, de acionamento direto, dispensando caixas de engrenagens.

As alternativas descartadas são, na verdade, as DESVANTAGENS conhecidas desses ímãs: eles desmagnetizam acima de cerca de $80\ ^\circ$C (o que exige composições especiais com disprósio), oxidam com facilidade e precisam de revestimento protetor, e custam caro, com oferta geopoliticamente concentrada.

É justamente esse conjunto de restrições que motiva a busca por motores sem terras raras.`,
});

qa({
  t: T4,
  sub: "Processo de contato e produção de ácido sulfúrico",
  dif: "medio",
  e: String.raw`O ácido sulfúrico é o produto químico de maior tonelagem da indústria mundial. Em sua obtenção pelo processo de contato, a etapa que exige catalisador é a conversão de:`,
  ok: String.raw`$\text{SO}_2$ em $\text{SO}_3$.`,
  err: [
    String.raw`$\text{S}$ em $\text{SO}_2$.`,
    String.raw`$\text{SO}_3$ em $\text{H}_2\text{SO}_4$.`,
    String.raw`$\text{H}_2\text{S}$ em $\text{S}$.`,
    String.raw`$\text{H}_2\text{SO}_4$ em óleum.`,
  ],
  r: String.raw`A sequência industrial tem três etapas, e só a do meio é problemática.

Queimar enxofre a $\text{SO}_2$ é rápido e fortemente exotérmico, sem necessidade de catalisador. Absorver o $\text{SO}_3$ para formar o ácido também é imediato.

Já a oxidação intermediária

$$2\text{SO}_2 + \text{O}_2 \rightleftharpoons 2\text{SO}_3$$

é exotérmica e reversível, mas de cinética lenta: sem catalisador, a velocidade em temperatura moderada é inviável, e elevar a temperatura para acelerar deslocaria o equilíbrio para os reagentes (Le Chatelier). O pentóxido de vanádio resolve o impasse, oferecendo rendimento alto em torno de $450\ ^\circ$C.

Esse é o mesmo tipo de compromisso entre cinética e equilíbrio que aparece na síntese da amônia — e o nome "contato" vem justamente do contato dos gases com o catalisador sólido.`,
});

qa({
  t: T4,
  sub: "Produção de fertilizantes fosfatados",
  dif: "medio",
  e: String.raw`A rocha fosfática, rica em $\text{Ca}_3(\text{PO}_4)_2$, não serve diretamente como fertilizante e é tratada com ácido sulfúrico para produzir o superfosfato. O objetivo desse tratamento é obter um composto de fósforo:`,
  ok: "Solúvel, assimilável pelas raízes.",
  err: [
    "Insolúvel, de liberação mais lenta.",
    "Volátil, distribuído pelo ar no solo.",
    "Gasoso, absorvido pelas folhas.",
    "Metálico, de maior estabilidade.",
  ],
  r: String.raw`A planta só absorve nutrientes DISSOLVIDOS na solução do solo, na forma iônica. O fosfato de cálcio da rocha é praticamente insolúvel em água — aplicá-lo moído seria enterrar fósforo indisponível.

O ácido sulfúrico converte o fosfato em di-hidrogenofosfato, bem mais solúvel:

$$\text{Ca}_3(\text{PO}_4)_2 + 2\text{H}_2\text{SO}_4 \to \text{Ca(H}_2\text{PO}_4)_2 + 2\text{CaSO}_4$$

A lógica química é a mesma que torna o $\text{NaH}_2\text{PO}_4$ solúvel e o $\text{Ca}_3(\text{PO}_4)_2$ não: quanto menor a carga do ânion, mais fraca a rede cristalina e mais fácil a hidratação vencê-la.

O sulfato de cálcio formado junto (gesso) não é problema — corrige acidez e fornece cálcio e enxofre.

O mesmo raciocínio vale para o nitrogênio: o $\text{N}_2$ do ar é inassimilável e precisa ser fixado como amônia antes de virar fertilizante.`,
});

qa({
  t: T4,
  sub: "Atmosfera inerte na soldagem de metais",
  dif: "facil",
  e: String.raw`Processos de soldagem de alumínio e de aço inoxidável utilizam um fluxo contínuo de argônio sobre a poça de fusão. A função desse gás é:`,
  ok: "Impedir o contato do metal quente com o ar.",
  err: [
    "Fornecer o calor necessário à fusão do metal.",
    "Reagir com o metal formando a solda.",
    "Resfriar rapidamente o cordão de solda.",
    "Aumentar a condutividade elétrica do arco.",
  ],
  r: String.raw`Metal fundido é extremamente reativo. Exposto ao ar, oxida-se de imediato pelo $\text{O}_2$, absorve nitrogênio formando nitretos frágeis e dissolve hidrogênio da umidade, que depois gera porosidade ao solidificar. O resultado é um cordão poroso, quebradiço e de baixa resistência.

O argônio é um gás nobre de camada de valência completa: não reage com o metal em temperatura nenhuma. Sendo mais denso que o ar, forma uma cortina que desloca a atmosfera da região da poça até que o metal solidifique e resfrie.

Ele não participa da solda, não aquece nem resfria — apenas isola. É por isso que os processos se chamam TIG e MIG, com "IG" de gás inerte.

O cuidado é especialmente crítico no alumínio e no titânio, cuja afinidade pelo oxigênio é altíssima, e no aço inoxidável, em que a oxidação do cromo comprometeria exatamente a resistência à corrosão que justifica o material.`,
});

finalizar();
