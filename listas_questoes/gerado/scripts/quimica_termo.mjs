// Leva de equalização de Química Geral — tópico 3 da ementa:
// "Termodinâmica, Cinética e Equilíbrio" (entalpia, velocidade de reação,
// quociente e constante de equilíbrio, Le Chatelier, oxirredução, células
// galvânicas e eletrólise).
//
// Era o tópico MAIS povoado do banco (61 no fluxo normal), então esta leva é a
// menor: 14 questões para fechar em 75. Por isso os ângulos escolhidos são só
// os que faltavam mesmo — lei de Hess, energia de ligação, temperatura de
// inversão da espontaneidade, Kp vs Kc, Kps e íon comum, tampão, Arrhenius,
// meia-vida, etapa determinante, eletrólise de sal fundido versus aquoso e
// recarga de bateria. Le Chatelier, pilha, corrosão e entropia já tinham
// cobertura densa.
import { criarLote, T3 } from "./quimica_kit.mjs";

const { qa, finalizar } = criarLote({ arquivo: "quimica_termo.json", semente: 20260917 });

// --- Termoquímica -----------------------------------------------------------

qa({
  t: T3,
  sub: "Lei de Hess e soma de etapas",
  dif: "medio",
  e: String.raw`A entalpia de combustão do carbono a $\text{CO}_2$ vale $-394$ kJ/mol e a da combustão do $\text{CO}$ a $\text{CO}_2$ vale $-283$ kJ/mol. Pela lei de Hess, a entalpia de formação do $\text{CO}$ a partir de $\text{C}$ e $\text{O}_2$ é:`,
  ok: String.raw`$-111$ kJ/mol`,
  err: [
    String.raw`$-677$ kJ/mol`,
    String.raw`$+111$ kJ/mol`,
    String.raw`$+677$ kJ/mol`,
    String.raw`$-283$ kJ/mol`,
  ],
  r: String.raw`A entalpia é função de estado: só importam os estados inicial e final, não o caminho. É isso que a lei de Hess permite explorar.

Queremos $\text{C} + \tfrac{1}{2}\text{O}_2 \to \text{CO}$. Montamos essa equação somando as que temos, invertendo a segunda (o que troca o sinal do seu $\Delta H$):

$$\text{C} + \text{O}_2 \to \text{CO}_2 \qquad \Delta H = -394\ \text{kJ}$$
$$\text{CO}_2 \to \text{CO} + \tfrac{1}{2}\text{O}_2 \qquad \Delta H = +283\ \text{kJ}$$

Somando, o $\text{CO}_2$ cancela dos dois lados e resta exatamente a reação desejada:

$$\Delta H = -394 + 283 = -111\ \text{kJ/mol}$$

Esse é o caminho padrão para obter entalpias que não podem ser medidas diretamente: queimar carbono parando no $\text{CO}$, sem seguir até o $\text{CO}_2$, é experimentalmente inviável.`,
});

qa({
  t: T3,
  sub: "Energia de ligação e estimativa da entalpia de reação",
  dif: "medio",
  e: String.raw`A entalpia de uma reação em fase gasosa pode ser estimada a partir das energias de ligação. O cálculo consiste em somar as energias das ligações:`,
  ok: "Rompidas menos as das ligações formadas.",
  err: [
    "Formadas menos as das ligações rompidas.",
    "Rompidas mais as das ligações formadas.",
    "Rompidas apenas, ignorando as formadas.",
    "Formadas apenas, ignorando as rompidas.",
  ],
  r: String.raw`Romper ligação SEMPRE consome energia; formar ligação SEMPRE libera. A reação é o balanço entre as duas etapas:

$$\Delta H \approx \sum E_{\text{rompidas}} - \sum E_{\text{formadas}}$$

Se as ligações dos produtos são mais fortes que as dos reagentes, o segundo termo domina, $\Delta H$ fica negativo e a reação é exotérmica. É o caso das combustões, que trocam ligações C–H e C–C por ligações C=O e O–H, bem mais fortes.

Duas ressalvas importantes: energias de ligação tabeladas são MÉDIAS sobre muitos compostos, então o resultado é aproximado; e o método só vale em fase gasosa, já que não contabiliza as forças intermoleculares de líquidos e sólidos.`,
});

qa({
  t: T3,
  sub: "Temperatura de inversão da espontaneidade",
  dif: "dificil",
  e: String.raw`Certa reação tem $\Delta H = +60$ kJ/mol e $\Delta S = +0{,}20$ kJ/(mol$\cdot$K), ambos praticamente constantes. Essa reação passa a ser espontânea acima de:`,
  ok: String.raw`$300$ K`,
  err: [String.raw`$120$ K`, String.raw`$180$ K`, String.raw`$333$ K`, String.raw`$1200$ K`],
  r: String.raw`A espontaneidade é decidida pela energia livre de Gibbs:

$$\Delta G = \Delta H - T\Delta S$$

Com $\Delta H > 0$ e $\Delta S > 0$, os dois termos brigam: a entalpia desfavorece e a entropia favorece, e quem vence depende da temperatura, já que $\Delta S$ aparece multiplicado por $T$.

O ponto de virada é onde $\Delta G = 0$:

$$T = \frac{\Delta H}{\Delta S} = \frac{60}{0{,}20} = 300\ \text{K}$$

Abaixo disso, $\Delta G > 0$ e a reação não é espontânea; acima, o termo $-T\Delta S$ supera $\Delta H$ e a reação passa a ocorrer. É exatamente esse o caso da fusão do gelo, espontânea só acima de $273$ K, e da decomposição do calcário, que exige quase $1100$ K num forno de cal.`,
});

qa({
  t: T3,
  sub: "Primeira lei: trabalho de expansão e variação de energia interna",
  dif: "dificil",
  e: String.raw`Uma reação gasosa ocorre a pressão constante liberando $100$ kJ de calor e realizando $15$ kJ de trabalho de expansão sobre a vizinhança. A variação de energia interna do sistema é:`,
  ok: String.raw`$-115$ kJ`,
  err: [String.raw`$-100$ kJ`, String.raw`$-85$ kJ`, String.raw`$+85$ kJ`, String.raw`$+115$ kJ`],
  r: String.raw`A primeira lei da termodinâmica, na convenção do sistema, é

$$\Delta U = q + w$$

O sistema LIBERA calor, então $q = -100$ kJ. Ele também REALIZA trabalho sobre a vizinhança ao empurrar a atmosfera para expandir, e nesse caso o sistema perde energia: $w = -15$ kJ.

$$\Delta U = -100 - 15 = -115\ \text{kJ}$$

Repare na distinção que a questão cobra: o calor trocado a pressão constante é o $\Delta H$ ($-100$ kJ), enquanto o $\Delta U$ ($-115$ kJ) contabiliza também a energia gasta na expansão. Os dois se relacionam por $\Delta H = \Delta U + P\Delta V$.

Em reações sem variação no número de mols gasosos, $P\Delta V = 0$ e os dois valores coincidem.`,
});

// --- Equilíbrio químico -----------------------------------------------------

qa({
  t: T3,
  sub: "Relação entre Kp e Kc",
  dif: "medio",
  e: String.raw`Para a síntese da amônia, $\text{N}_2(g) + 3\text{H}_2(g) \rightleftharpoons 2\text{NH}_3(g)$, as constantes $K_p$ e $K_c$ se relacionam por $K_p = K_c(RT)^{\Delta n}$. Nesse caso o expoente $\Delta n$ vale:`,
  ok: String.raw`$-2$`,
  err: [String.raw`$-4$`, String.raw`$0$`, String.raw`$+2$`, String.raw`$+4$`],
  r: String.raw`O expoente $\Delta n$ é a variação no número de mols de espécies GASOSAS, contada como produtos menos reagentes:

$$\Delta n = 2 - (1 + 3) = -2$$

Logo $K_p = K_c(RT)^{-2}$, e as duas constantes têm valores numéricos diferentes.

Vale registrar o caso particular: quando $\Delta n = 0$, tem-se $(RT)^0 = 1$ e $K_p = K_c$ — é o que acontece, por exemplo, em $\text{H}_2 + \text{I}_2 \rightleftharpoons 2\text{HI}$.

Esse mesmo $\Delta n$ negativo, aliás, é o que faz o aumento de pressão deslocar a síntese da amônia para a direita: o lado com menos mols gasosos é favorecido.`,
});

qa({
  t: T3,
  sub: "Efeito do íon comum sobre a solubilidade",
  dif: "medio",
  e: String.raw`O cloreto de prata é pouco solúvel em água, segundo $\text{AgCl}(s) \rightleftharpoons \text{Ag}^+(aq) + \text{Cl}^-(aq)$. Ao se adicionar $\text{NaCl}$ à solução saturada, a solubilidade do $\text{AgCl}$:`,
  ok: "Diminui, por deslocamento do equilíbrio.",
  err: [
    "Aumenta, por deslocamento do equilíbrio.",
    "Diminui, por aumento do valor de $K_{ps}$.",
    "Aumenta, por aumento do valor de $K_{ps}$.",
    "Permanece igual, pois $K_{ps}$ é constante.",
  ],
  r: String.raw`O $\text{NaCl}$ é solúvel e se dissocia totalmente, injetando íons $\text{Cl}^-$ na solução — um íon que já participa do equilíbrio do $\text{AgCl}$. É o efeito do íon comum.

Pelo princípio de Le Chatelier, o sistema reage ao excesso de $\text{Cl}^-$ consumindo-o: o equilíbrio desloca para a esquerda e mais $\text{AgCl}$ precipita. A solubilidade cai.

O detalhe conceitual que a questão cobra está na última alternativa: $K_{ps}$ realmente NÃO muda, pois só depende da temperatura. O que muda é a repartição entre os íons — com $[\text{Cl}^-]$ alto, $[\text{Ag}^+]$ precisa ser proporcionalmente menor para manter o produto constante:

$$K_{ps} = [\text{Ag}^+][\text{Cl}^-]$$

Constância do $K_{ps}$ e queda da solubilidade convivem sem contradição. É esse efeito que a análise gravimétrica usa para precipitar quantitativamente um íon.`,
});

qa({
  t: T3,
  sub: "Quociente iônico e previsão de precipitação",
  dif: "medio",
  e: String.raw`Ao misturar duas soluções diluídas, verifica-se que o quociente iônico $Q$ da mistura é MENOR que o $K_{ps}$ do sal formado. Nessas condições:`,
  ok: "Não há formação de precipitado.",
  err: [
    "Forma-se precipitado até $Q$ igualar $K_{ps}$.",
    "Forma-se precipitado de toda a massa do sal.",
    "A solução torna-se supersaturada no sal.",
    "O valor de $K_{ps}$ diminui até igualar $Q$.",
  ],
  r: String.raw`O quociente $Q$ tem a mesma forma do $K_{ps}$, mas é calculado com as concentrações do MOMENTO, que não precisam ser as de equilíbrio. Comparar os dois diz em que direção o sistema vai andar.

- $Q < K_{ps}$: a solução ainda está insaturada. Ela comportaria mais íons, então nada precipita — e, se houvesse sólido no fundo, ele continuaria se dissolvendo.
- $Q = K_{ps}$: solução exatamente saturada, em equilíbrio.
- $Q > K_{ps}$: há íons demais para a solução sustentar; precipita sólido até que $Q$ caia de volta a $K_{ps}$.

É exatamente o mesmo raciocínio do quociente de reação $Q$ frente a $K$ num equilíbrio homogêneo, aplicado ao caso da dissolução.

Na prática, é assim que se decide se a mistura de dois efluentes vai ou não entupir uma tubulação com incrustação.`,
});

qa({
  t: T3,
  sub: "Solução-tampão e resistência à variação de pH",
  dif: "dificil",
  e: String.raw`Uma solução contendo ácido acético e acetato de sódio em concentrações comparáveis mantém o pH praticamente constante quando se adiciona um pouco de ácido forte ou de base forte. Essa estabilidade se deve à presença simultânea de:`,
  ok: "Um ácido fraco e sua base conjugada.",
  err: [
    "Um ácido forte e sua base conjugada.",
    "Dois ácidos fracos de mesma constante.",
    "Uma base forte e seu ácido conjugado.",
    "Um sal neutro e um ácido forte diluído.",
  ],
  r: String.raw`O tampão funciona porque mantém em solução, ao mesmo tempo, um estoque de espécie capaz de NEUTRALIZAR ácido e outro capaz de neutralizar base.

Se chega $\text{H}^+$, o acetato o consome, virando ácido acético:

$$\text{CH}_3\text{COO}^- + \text{H}^+ \to \text{CH}_3\text{COOH}$$

Se chega $\text{OH}^-$, o ácido acético o consome, virando acetato:

$$\text{CH}_3\text{COOH} + \text{OH}^- \to \text{CH}_3\text{COO}^- + \text{H}_2\text{O}$$

Nos dois casos o que muda é a RAZÃO entre as duas formas, e o pH depende dela apenas logaritmicamente — por isso varia pouco enquanto os dois estoques existirem.

A exigência de que o ácido seja FRACO é essencial: um ácido forte estaria totalmente ionizado e não teria forma molecular em reserva para consumir a base adicionada. É esse mecanismo que mantém o sangue em pH $7{,}4$, pelo par $\text{H}_2\text{CO}_3/\text{HCO}_3^-$.`,
});

qa({
  t: T3,
  sub: "Constante de ionização e força relativa de ácidos",
  dif: "medio",
  e: String.raw`Em soluções de mesma concentração, o ácido A tem $K_a = 1{,}8 \times 10^{-5}$ e o ácido B, $K_a = 6{,}5 \times 10^{-8}$. Comparando os dois:`,
  ok: "A é mais forte e dá solução de menor pH.",
  err: [
    "B é mais forte e dá solução de menor pH.",
    "A é mais forte e dá solução de maior pH.",
    "B é mais forte e dá solução de maior pH.",
    "Ambos dão soluções de mesmo pH.",
  ],
  r: String.raw`A constante $K_a$ mede até onde a ionização avança:

$$\text{HA} + \text{H}_2\text{O} \rightleftharpoons \text{H}_3\text{O}^+ + \text{A}^- \qquad K_a = \frac{[\text{H}_3\text{O}^+][\text{A}^-]}{[\text{HA}]}$$

Quanto maior o $K_a$, mais o equilíbrio pende para os produtos e mais $\text{H}_3\text{O}^+$ a solução contém. Aqui $1{,}8 \times 10^{-5}$ é cerca de $280$ vezes maior que $6{,}5 \times 10^{-8}$: o ácido A é nitidamente o mais forte.

Mais $\text{H}_3\text{O}^+$ significa pH MENOR, já que $\text{pH} = -\log[\text{H}_3\text{O}^+]$ — a confusão entre "mais forte" e "pH maior" é o erro clássico aqui.

Os valores não são inventados: correspondem ao ácido acético e ao ácido hipocloroso. E há uma consequência útil: quanto mais forte o ácido, mais FRACA sua base conjugada, razão pela qual o hipoclorito hidrolisa bem mais que o acetato.`,
});

// --- Cinética ---------------------------------------------------------------

qa({
  t: T3,
  sub: "Equação de Arrhenius e energia de ativação",
  dif: "medio",
  e: String.raw`Duas reações ocorrem à mesma temperatura e têm fatores pré-exponenciais semelhantes, mas a reação X tem energia de ativação bem menor que a Y. Comparando suas constantes de velocidade:`,
  ok: "A de X é maior, pela dependência exponencial.",
  err: [
    "A de Y é maior, pela dependência exponencial.",
    "A de X é maior, pela dependência linear.",
    "As duas são iguais, pois a temperatura é a mesma.",
    "As duas são iguais, pois o fator pré-exponencial domina.",
  ],
  r: String.raw`A equação de Arrhenius relaciona a constante de velocidade à barreira energética:

$$k = A\,e^{-E_a/RT}$$

A energia de ativação aparece no EXPOENTE, e com sinal negativo: barreira menor significa expoente menos negativo e $k$ maior. Como a dependência é exponencial, diferenças modestas em $E_a$ produzem diferenças enormes em velocidade.

Um exemplo concreto: a $298$ K, reduzir $E_a$ em $20$ kJ/mol multiplica $k$ por cerca de $3000$.

É exatamente esse o mecanismo pelo qual um catalisador age — ele não muda $\Delta H$ nem a constante de equilíbrio, apenas oferece um caminho de $E_a$ menor, e a reação acelera nos dois sentidos.`,
});

qa({
  t: T3,
  sub: "Meia-vida em cinética de primeira ordem",
  dif: "medio",
  e: String.raw`Uma reação de primeira ordem consome metade do reagente em $20$ minutos. Partindo de uma concentração inicial DUAS vezes maior, o tempo necessário para consumir metade do reagente passa a ser:`,
  ok: String.raw`$20$ minutos`,
  err: [
    String.raw`$10$ minutos`,
    String.raw`$28$ minutos`,
    String.raw`$40$ minutos`,
    String.raw`$80$ minutos`,
  ],
  r: String.raw`Para uma reação de primeira ordem, a meia-vida é

$$t_{1/2} = \frac{\ln 2}{k}$$

A concentração inicial não aparece na expressão: a meia-vida é uma propriedade da reação e da temperatura, não da quantidade de material. Dobrar $[\text{A}]_0$ não muda nada — continuam sendo $20$ minutos.

A consequência prática é o decaimento em degraus regulares: após $20$ min resta $50\%$; após $40$ min, $25\%$; após $60$ min, $12{,}5\%$.

Essa independência é característica exclusiva da primeira ordem. Em ordem zero, $t_{1/2} = [\text{A}]_0/2k$ e dobrar a concentração DOBRA a meia-vida; em segunda ordem, $t_{1/2} = 1/(k[\text{A}]_0)$ e dobrar a concentração REDUZ a meia-vida à metade. É por isso que medir a meia-vida em concentrações diferentes é uma forma de descobrir a ordem da reação.`,
});

qa({
  t: T3,
  sub: "Etapa determinante e intermediário de reação",
  dif: "dificil",
  e: String.raw`Um mecanismo em duas etapas tem a primeira lenta e a segunda rápida, e certa espécie é PRODUZIDA na primeira etapa e CONSUMIDA na segunda. Essa espécie é classificada como:`,
  ok: "Intermediário de reação.",
  err: [
    "Catalisador da reação.",
    "Reagente da reação global.",
    "Produto da reação global.",
    "Complexo ativado da etapa lenta.",
  ],
  r: String.raw`A distinção se faz pela ORDEM em que a espécie aparece no mecanismo.

O intermediário é formado numa etapa e consumido numa etapa posterior. Ele existe de verdade, com ligações completas, mas em concentração baixíssima e por tempo curto — e, como se cancela na soma das etapas, não aparece na equação global.

O catalisador faz o caminho inverso: é consumido primeiro e regenerado depois, saindo intacto ao fim. Também não aparece na equação global, mas por outro motivo.

O complexo ativado é diferente dos dois: não é uma substância, e sim a configuração do topo da barreira energética, com ligações se rompendo e se formando ao mesmo tempo; não pode ser isolado.

A informação sobre a etapa lenta, por sua vez, define a lei de velocidade: a reação inteira não anda mais rápido que seu passo determinante.`,
});

// --- Eletroquímica ----------------------------------------------------------

qa({
  t: T3,
  sub: "Eletrólise de sal fundido versus solução aquosa",
  dif: "dificil",
  e: String.raw`A eletrólise do $\text{NaCl}$ FUNDIDO produz sódio metálico no catodo, mas a eletrólise da solução aquosa de $\text{NaCl}$ produz gás hidrogênio nesse eletrodo. A causa dessa diferença é que, em meio aquoso:`,
  ok: "A água se reduz mais facilmente que o sódio.",
  err: [
    "O sódio se reduz mais facilmente que a água.",
    "O íon sódio não migra para o catodo.",
    "A água impede a passagem de corrente elétrica.",
    "O cloreto se reduz no lugar do sódio.",
  ],
  r: String.raw`No sal fundido só existem $\text{Na}^+$ e $\text{Cl}^-$. Sem alternativa, o catodo reduz o que há: $\text{Na}^+ + e^- \to \text{Na}$.

Em solução aquosa surge um segundo candidato à redução — a própria água. E aí vale a regra geral de qualquer eletrodo: reduz-se preferencialmente a espécie de MAIOR potencial de redução. Comparando,

$$\text{Na}^+ + e^- \to \text{Na} \qquad E^\circ = -2{,}71\ \text{V}$$
$$2\text{H}_2\text{O} + 2e^- \to \text{H}_2 + 2\text{OH}^- \qquad E^\circ = -0{,}83\ \text{V}$$

A água ganha com folga, e o produto catódico passa a ser $\text{H}_2$, deixando a solução alcalina pelo $\text{OH}^-$ liberado.

É justamente por isso que sódio metálico é obtido industrialmente na célula de Downs, com sal FUNDIDO, enquanto a eletrólise da salmoura é usada para outro fim: produzir $\text{Cl}_2$, $\text{H}_2$ e $\text{NaOH}$ — o processo cloro-álcali.`,
});

qa({
  t: T3,
  sub: "Inversão dos eletrodos na recarga de uma bateria",
  dif: "medio",
  e: String.raw`Uma bateria recarregável, ao ser recarregada por uma fonte externa, deixa de funcionar como célula galvânica e passa a operar como célula eletrolítica. Durante a recarga, o eletrodo que era o anodo passa a ser:`,
  ok: "O catodo, onde ocorre redução.",
  err: [
    "O catodo, onde ocorre oxidação.",
    "O anodo, onde ocorre redução.",
    "O anodo, onde ocorre oxidação.",
    "Um eletrodo inerte, sem reação.",
  ],
  r: String.raw`A convenção é fixa e não depende do sentido do processo: ANODO é onde ocorre OXIDAÇÃO e CATODO é onde ocorre REDUÇÃO.

Durante a descarga, a bateria é uma célula galvânica: a reação espontânea oxida uma placa (anodo) e reduz a outra (catodo), fornecendo corrente.

Na recarga, a fonte externa força a corrente no sentido contrário, invertendo as reações em cada placa. A placa que estava se oxidando passa a receber elétrons e se reduzir — sua espécie oxidada é reconvertida na original. Como agora ali ocorre redução, ela é o catodo.

Na bateria de chumbo-ácido do automóvel é o que se vê: o $\text{PbSO}_4$ formado na descarga volta a $\text{Pb}$ de um lado e a $\text{PbO}_2$ do outro. E isso deixa claro por que a recarga não é espontânea: é uma eletrólise, e exige energia elétrica de fora.`,
});

finalizar();
