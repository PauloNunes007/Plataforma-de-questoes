// Leva autoral de Química Geral no ESTILO DA BANCA DA UFF, derivada do
// compilado de provas `Questoes_Quimica_Inorganica_UFF_v3.pdf` (transcrito em
// `quimica_uff_oficial.mjs`). Gera `listas_questoes/gerado/quimica_uff_estilo.json`.
//
// POR QUE ESTA LEVA EXISTE: o banco de Química já tinha 204 questões no estilo
// "compêndio Brown" — massa atômica média por abundância isotópica, padrão
// isotópico em espectrometria de massas, lei das proporções múltiplas. É
// conteúdo correto, mas fundo demais para a prova real: a banca da UFF quase
// não pede conta; ela pergunta se o aluno ENTENDEU O FENÔMENO (por que o metal
// corrói, por que o semicondutor conduz melhor quente, por que a pressão
// favorece a amônia). Esta leva segue esse padrão.
//
// REGRAS APLICADAS (ver memória `criacao_questoes_preferencias`):
//   - conceitual, nível universitário, ementa oficial dos 4 tópicos de Química
//     Geral — nada fora dela;
//   - alternativas curtas e simétricas, sem raciocínio embutido; todas as
//     cinco na mesma "forma" (ou todas em prosa, ou todas valores), pra não
//     entregar a resposta pela aparência;
//   - a letra do gabarito vem de uma sequência pré-embaralhada e balanceada
//     (SEQ), nunca escolhida à mão questão a questão;
//   - `instituicao: null` — questão autoral não se passa por prova real. Por
//     isso ela alimenta missões e Banco de Questões, mas NÃO entra no montador
//     de simulados, que sorteia só prova de verdade da universidade do aluno.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = resolve(aqui, "..", "quimica_uff_estilo.json");

const T1 = "Estrutura Atômica e Tabela Periódica";
const T2 = "Ligações Químicas";
const T3 = "Termodinâmica, Cinética e Equilíbrio";
const T4 = "Funções Inorgânicas e Reações Químicas";

const LETRAS = ["a", "b", "c", "d", "e"];

// 13 permutações completas de a–e: cada letra sai 13 vezes em 65 posições.
const SEQ = (
  "cadbe badce edabc cbeda daecb acbed ebdac dceab bacde edcba adbec cbade deacb"
)
  .replace(/ /g, "")
  .split("");

const itens = [];

// `ok` é a correta e `err` os quatro distratores; a posição da correta vem de
// SEQ, e os distratores preenchem as letras restantes na ordem escrita.
const qa = (o) => {
  const letra = SEQ[itens.length];
  if (!letra) throw new Error("SEQ curta demais para o número de questões");
  if (o.err.length !== 4) throw new Error(`precisa de 4 distratores: ${o.e.slice(0, 50)}`);
  const restantes = LETRAS.filter((l) => l !== letra);
  const mapa = { [letra]: o.ok };
  o.err.forEach((t, k) => {
    mapa[restantes[k]] = t;
  });
  itens.push({
    materia: "Química Geral",
    topico: o.t,
    subtopico: o.sub,
    dificuldade: o.dif,
    instituicao: null,
    ano: null,
    enunciado: o.e,
    alternativas: Object.fromEntries(LETRAS.map((l) => [l, mapa[l]])),
    gabarito: letra,
    resolucao: o.r,
    tikz_code: null,
    imagem_enunciado: false,
    alternativas_com_imagem: [],
  });
};

// ---------------------------------------------------------------------------
// Estrutura Atômica e Tabela Periódica
// ---------------------------------------------------------------------------

qa({
  t: T1,
  sub: "Carga nuclear efetiva e raio atômico",
  dif: "medio",
  e: String.raw`Ao percorrer o terceiro período da tabela periódica, do Na ao Cl, o raio atômico diminui, embora o número de elétrons aumente. A causa desse comportamento é:`,
  ok: "O aumento da carga nuclear efetiva.",
  err: [
    "O aumento do número de camadas ocupadas.",
    "A diminuição do número de prótons no núcleo.",
    "O aumento da blindagem pelos elétrons de valência.",
    "A passagem gradual de metal para ametal.",
  ],
  r: String.raw`Dentro de um mesmo período, os elétrons novos entram sempre na MESMA camada, que blinda mal a si própria. Enquanto isso, cada elemento seguinte tem um próton a mais no núcleo.

O resultado é que a carga nuclear efetiva sentida pelos elétrons de valência cresce da esquerda para a direita, puxando a nuvem eletrônica para mais perto do núcleo. Por isso o raio encolhe mesmo com mais elétrons no átomo.

Só ao mudar de período, quando uma camada nova começa, o raio dá um salto para cima.`,
});

qa({
  t: T1,
  sub: "Sucessivas energias de ionização e camada fechada",
  dif: "medio",
  e: String.raw`A primeira energia de ionização do sódio vale cerca de $496$ kJ/mol, enquanto a segunda salta para aproximadamente $4560$ kJ/mol. Esse salto ocorre porque o segundo elétron é retirado:`,
  ok: "De uma camada interna completa.",
  err: [
    "Do mesmo orbital ocupado pelo primeiro.",
    "De um orbital mais distante do núcleo.",
    "De um átomo eletricamente neutro.",
    "De um nível de energia mais externo.",
  ],
  r: String.raw`O sódio é $1s^2\,2s^2\,2p^6\,3s^1$. O primeiro elétron sai do $3s$, sozinho e bem blindado — custa pouco.

Depois disso sobra o cátion $\text{Na}^+$, que já tem a configuração estável do neônio. O segundo elétron teria de ser arrancado de uma camada interna completa, mais próxima do núcleo e sentindo uma carga nuclear efetiva muito maior, e ainda por cima de uma espécie já positiva.

Esse salto brusco nas energias de ionização sucessivas é justamente o que revela quantos elétrons de valência o elemento tem.`,
});

qa({
  t: T1,
  sub: "Eletronegatividade e poder oxidante dos halogênios",
  dif: "medio",
  e: String.raw`O flúor é bem mais eletronegativo que o iodo. A consequência direta disso na química de oxirredução é que:`,
  ok: "O flúor é um oxidante mais forte que o iodo.",
  err: [
    "O iodo é um oxidante mais forte que o flúor.",
    "O fluoreto é um redutor mais forte que o iodeto.",
    "O flúor é menos reativo que o iodo.",
    "Os dois têm o mesmo poder oxidante.",
  ],
  r: String.raw`Eletronegatividade é a tendência de atrair elétrons. Um átomo pequeno e muito eletronegativo como o flúor puxa elétrons com força, o que é exatamente o que define um bom agente oxidante — e isso aparece nos potenciais de redução:

$$E^\circ(\text{F}_2/\text{F}^-) = +2{,}87\ \text{V} \qquad E^\circ(\text{I}_2/\text{I}^-) = +0{,}54\ \text{V}$$

Descendo o grupo dos halogênios, o átomo cresce, a atração pelo elétron extra enfraquece e o poder oxidante cai: $\text{F}_2 > \text{Cl}_2 > \text{Br}_2 > \text{I}_2$.

O ânion segue o caminho inverso: o iodeto, que segura mal seus elétrons, é que é o melhor redutor.`,
});

qa({
  t: T1,
  sub: "Energia de ionização e reatividade dos metais alcalinos",
  dif: "medio",
  e: String.raw`Os metais do grupo 1 reagem com água, e a violência da reação cresce do lítio para o césio. A propriedade periódica que explica essa tendência é:`,
  ok: "A diminuição da energia de ionização.",
  err: [
    "O aumento da eletronegatividade.",
    "A diminuição do raio atômico.",
    "O aumento do número de elétrons de valência.",
    "A diminuição da massa específica.",
  ],
  r: String.raw`Todos os alcalinos reagem com água perdendo um elétron, então o que diferencia um do outro é o custo de perder esse elétron.

Descendo o grupo, o elétron de valência fica em camadas cada vez mais distantes e mais blindadas pelos elétrons internos. Ele está menos preso, e a energia de ionização cai de forma sistemática — o césio cede seu elétron com muito mais facilidade que o lítio.

Metal que perde elétron facilmente é metal que se oxida facilmente: daí a reatividade crescente. O número de elétrons de valência, aliás, é o mesmo (um) para todo o grupo, e por isso não explica diferença nenhuma.`,
});

qa({
  t: T1,
  sub: "Configuração eletrônica e escolha do dopante",
  dif: "medio",
  e: String.raw`Um elemento cuja camada de valência é $3s^2\,3p^3$ pode ser usado para dopar silício e obter um semicondutor do tipo N. Isso porque esse elemento pertence ao:`,
  ok: "Grupo 15.",
  err: ["Grupo 13.", "Grupo 14.", "Grupo 16.", "Grupo 2."],
  r: String.raw`Contando os elétrons de valência: $3s^2\,3p^3$ dá $2 + 3 = 5$ elétrons, o que coloca o elemento no grupo 15 (é o fósforo).

O silício tem 4 elétrons de valência e forma 4 ligações na rede cristalina. Ao substituir um átomo de Si por um do grupo 15, quatro elétrons do dopante entram nas ligações e o quinto sobra, ocupando um nível doador logo abaixo da banda de condução.

Esse elétron extra é promovido com pouquíssima energia e vira portador de carga — é o semicondutor do tipo N. Já o grupo 13, com 3 elétrons, deixaria uma lacuna e daria o tipo P.`,
});

qa({
  t: T1,
  sub: "Espectro de linhas e quantização de energia",
  dif: "medio",
  e: String.raw`O espectro de emissão do hidrogênio é formado por linhas discretas, e não por uma faixa contínua de cores. Essa observação é evidência de que:`,
  ok: "Os níveis de energia do elétron são quantizados.",
  err: [
    "A massa do átomo se concentra no núcleo.",
    "O elétron descreve órbitas elípticas.",
    "A luz tem natureza exclusivamente ondulatória.",
    "O átomo é eletricamente neutro.",
  ],
  r: String.raw`Cada linha do espectro corresponde a um fóton de energia bem definida, emitido quando o elétron cai de um nível para outro:

$$\Delta E = h\nu$$

Se o elétron pudesse ter qualquer energia, as transições possíveis seriam infinitas e vizinhas, e o resultado seria um espectro contínuo. O que se vê são poucas linhas nítidas — ou seja, só certas energias são permitidas.

Foi justamente esse fato experimental que Bohr usou para propor níveis quantizados, e ele continua valendo no modelo quântico atual.`,
});

qa({
  t: T1,
  sub: "Raio iônico de cátions e ânions",
  dif: "medio",
  e: String.raw`O raio do íon $\text{Na}^+$ é bem menor que o do átomo de sódio neutro. A razão é que o íon:`,
  ok: "Perdeu a camada de valência inteira.",
  err: [
    "Perdeu um próton do núcleo.",
    "Ganhou um próton no núcleo.",
    "Tem mais elétrons do que prótons.",
    "Sofre maior blindagem eletrônica.",
  ],
  r: String.raw`O sódio neutro é $[\text{Ne}]\,3s^1$. Ao virar $\text{Na}^+$, ele perde exatamente esse único elétron $3s$ — isto é, a camada mais externa some por completo, e o íon passa a ter só as camadas do neônio.

Além de perder uma camada inteira, os $11$ prótons continuam lá, agora atraindo $10$ elétrons em vez de $11$: a carga nuclear efetiva por elétron sobe e a nuvem se contrai ainda mais.

Pela mesma lógica invertida, um ânion é sempre MAIOR que o átomo neutro correspondente.`,
});

qa({
  t: T1,
  sub: "Caráter metálico ao longo de um período",
  dif: "facil",
  e: String.raw`Entre os elementos Mg, Al, Si, S e Cl, todos do terceiro período, aquele que forma cátion com maior facilidade é:`,
  ok: "Mg",
  err: ["Al", "Si", "S", "Cl"],
  r: String.raw`Formar cátion é perder elétron, e isso é fácil para quem tem baixa energia de ionização — o caráter metálico.

Da esquerda para a direita no período, a carga nuclear efetiva aumenta, os elétrons de valência ficam mais presos e a energia de ionização sobe. O magnésio é o mais à esquerda da lista, logo é o que cede elétrons com mais facilidade.

Do outro extremo, o cloro faz o oposto: com sete elétrons de valência e alta eletronegatividade, ele GANHA um elétron e forma ânion.`,
});

// ---------------------------------------------------------------------------
// Ligações Químicas
// ---------------------------------------------------------------------------

qa({
  t: T2,
  sub: "Ligação de hidrogênio e ponto de ebulição",
  dif: "medio",
  e: String.raw`A água ferve a $100\ ^\circ$C, enquanto o sulfeto de hidrogênio ($\text{H}_2\text{S}$), de massa molar quase o dobro, ferve a cerca de $-60\ ^\circ$C. A explicação para essa inversão é que a água:`,
  ok: "Forma ligações de hidrogênio entre suas moléculas.",
  err: [
    "É uma molécula apolar e compacta.",
    "Tem geometria linear e simétrica.",
    "Possui ligações covalentes mais fracas.",
    "Se mantém unida apenas por dispersão de London.",
  ],
  r: String.raw`Fervura é vencer as forças INTERMOLECULARES, não quebrar a molécula. Em geral elas crescem com a massa molar, e por isso o normal seria o $\text{H}_2\text{S}$ ferver mais alto.

O que inverte a ordem é a ligação de hidrogênio: o oxigênio é muito eletronegativo e pequeno, então o hidrogênio da água fica bastante positivo e é atraído com força pelo par isolado do oxigênio vizinho. O enxofre, bem menos eletronegativo, não sustenta esse tipo de interação.

É o mesmo motivo pelo qual $\text{NH}_3$ e $\text{HF}$ fervem acima do esperado para seus tamanhos.`,
});

qa({
  t: T2,
  sub: "Forças de dispersão de London e tamanho molecular",
  dif: "medio",
  e: String.raw`Nos hidretos $\text{CH}_4$, $\text{SiH}_4$ e $\text{GeH}_4$, todos apolares, o ponto de ebulição cresce nessa ordem. A força intermolecular responsável por essa tendência é:`,
  ok: "A dispersão de London.",
  err: [
    "A ligação de hidrogênio.",
    "A atração dipolo-dipolo permanente.",
    "A atração íon-dipolo.",
    "A ligação metálica.",
  ],
  r: String.raw`Moléculas apolares não têm dipolo permanente, então a única interação disponível é a dispersão de London: dipolos instantâneos que surgem da flutuação da nuvem eletrônica e induzem dipolos nas vizinhas.

A intensidade dessa força cresce com a polarizabilidade, ou seja, com o número de elétrons e o tamanho da molécula. Do $\text{CH}_4$ ao $\text{GeH}_4$ a nuvem eletrônica fica maior e mais deformável, a atração aumenta e o ponto de ebulição sobe.

Ligação de hidrogênio está fora de questão: não há H ligado a F, O ou N em nenhum deles.`,
});

qa({
  t: T2,
  sub: "Par isolado e geometria molecular",
  dif: "medio",
  e: String.raw`A molécula de $\text{NH}_3$ tem geometria piramidal, e não trigonal plana como os três hidrogênios sozinhos sugeririam. O responsável por isso é:`,
  ok: "O par de elétrons isolado do nitrogênio.",
  err: [
    "A alta eletronegatividade do hidrogênio.",
    "A hibridização sp do nitrogênio.",
    "A presença de uma ligação pi na molécula.",
    "A repulsão entre os núcleos de hidrogênio.",
  ],
  r: String.raw`Pela teoria da repulsão dos pares eletrônicos da camada de valência, quem se afasta ao máximo são todos os domínios eletrônicos ao redor do átomo central — pares ligantes E pares isolados.

O nitrogênio tem quatro domínios (três ligações e um par isolado), que se arranjam de forma aproximadamente tetraédrica. Mas a GEOMETRIA MOLECULAR só leva em conta as posições dos átomos: com um dos vértices ocupado por um par isolado, o que sobra é uma pirâmide de base triangular.

O par isolado ainda repele um pouco mais que os pares ligantes, fechando o ângulo H–N–H para cerca de $107^\circ$, abaixo dos $109{,}5^\circ$ tetraédricos.`,
});

qa({
  t: T2,
  sub: "Simetria molecular e polaridade resultante",
  dif: "dificil",
  e: String.raw`O $\text{CCl}_4$ é apolar, enquanto o $\text{CHCl}_3$ é polar, embora ambos tenham o carbono no centro de um tetraedro e ligações C–Cl polares. A diferença está:`,
  ok: "Na simetria da distribuição das ligações.",
  err: [
    "Na eletronegatividade do átomo de carbono.",
    "No número de pares isolados do carbono.",
    "Na hibridização do átomo central.",
    "No comprimento das ligações carbono-cloro.",
  ],
  r: String.raw`Polaridade da molécula é a SOMA VETORIAL dos dipolos de ligação, não a simples existência deles.

No $\text{CCl}_4$, os quatro dipolos C–Cl são iguais e apontam para os quatro vértices de um tetraedro: eles se cancelam exatamente, e o momento dipolar resultante é zero.

No $\text{CHCl}_3$, um dos vértices tem hidrogênio, cuja ligação com o carbono é muito menos polar. A simetria se quebra, o cancelamento não acontece e sobra um dipolo resultante apontando para o lado dos cloros.

É a mesma lógica que torna o $\text{CO}_2$ (linear e simétrico) apolar e a água (angular) polar.`,
});

qa({
  t: T2,
  sub: "Condutividade de compostos iônicos",
  dif: "facil",
  e: String.raw`O NaCl sólido não conduz corrente elétrica, mas o NaCl fundido conduz muito bem. Isso acontece porque, ao fundir:`,
  ok: "Os íons do retículo ganham mobilidade.",
  err: [
    "Os íons se transformam em átomos neutros.",
    "As ligações covalentes do sal se rompem.",
    "Surgem elétrons livres, como num metal.",
    "O sal se decompõe em sódio e cloro gasosos.",
  ],
  r: String.raw`Num composto iônico os portadores de carga são os próprios íons. No cristal eles existem, mas estão presos em posições fixas do retículo: há carga, e não há movimento — logo, não há corrente.

Fundir rompe o retículo sem desfazer os íons: $\text{Na}^+$ e $\text{Cl}^-$ continuam existindo, agora livres para migrar sob um campo elétrico. O mesmo vale para o sal dissolvido em água.

Repare no contraste com o metal, em que quem se move são os elétrons deslocalizados, e o sólido já conduz.`,
});

qa({
  t: T2,
  sub: "Ligação metálica, maleabilidade e fragilidade iônica",
  dif: "dificil",
  e: String.raw`Uma barra de cobre pode ser martelada até virar lâmina, enquanto um cristal de sal se estilhaça sob o mesmo impacto. A diferença se explica porque, no metal:`,
  ok: "Os cátions deslizam mantidos pelo mar de elétrons.",
  err: [
    "As ligações são covalentes e muito direcionais.",
    "As camadas de íons passam a se repelir ao deslizar.",
    "Existem apenas forças de dispersão entre as camadas.",
    "As ligações são mais fracas que as intermoleculares.",
  ],
  r: String.raw`Na ligação metálica os elétrons de valência estão deslocalizados por todo o sólido, e não entre pares específicos de átomos. Quando um plano de cátions desliza sobre o outro, o mar de elétrons acompanha e a ligação continua valendo em qualquer posição: o metal se deforma sem romper.

No cristal iônico, cada íon tem vizinhos de carga oposta em posições rígidas. Deslocar um plano coloca íons de MESMA carga frente a frente, e a repulsão eletrostática rompe o cristal — daí a fragilidade.

Note que não é questão de a ligação metálica ser fraca: o cobre funde a $1085\ ^\circ$C.`,
});

qa({
  t: T2,
  sub: "Efeito da temperatura na condutividade de metais e semicondutores",
  dif: "dificil",
  e: String.raw`Ao serem aquecidos, um metal tem sua condutividade elétrica reduzida, enquanto um semicondutor tem a sua aumentada. No semicondutor, o aquecimento:`,
  ok: "Promove mais elétrons para a banda de condução.",
  err: [
    "Aumenta o gap entre as duas bandas.",
    "Reduz o número de portadores de carga.",
    "Provoca apenas mais vibração da rede cristalina.",
    "Converte o material num isolante elétrico.",
  ],
  r: String.raw`No metal o número de portadores já é enorme e não muda com a temperatura — as bandas se sobrepõem. Aquecer só faz a rede vibrar mais, o que espalha os elétrons e AUMENTA a resistência.

No semicondutor o gap é pequeno (cerca de $1$ eV para o silício). A energia térmica consegue promover elétrons da banda de valência para a de condução, criando pares elétron-lacuna. Quanto mais quente, mais portadores — e o ganho em número supera de longe a perda por espalhamento.

Esse comportamento oposto é a assinatura experimental que distingue um semicondutor de um metal.`,
});

qa({
  t: T2,
  sub: "Semicondutor tipo P e portadores majoritários",
  dif: "medio",
  e: String.raw`O silício dopado com um elemento do grupo 13 forma um semicondutor no qual os portadores majoritários de carga são:`,
  ok: "As lacunas na banda de valência.",
  err: [
    "Os elétrons na banda de condução.",
    "Os íons do dopante na rede.",
    "Os pares elétron-lacuna térmicos.",
    "Os elétrons das camadas internas.",
  ],
  r: String.raw`O átomo do grupo 13 tem apenas $3$ elétrons de valência, um a menos do que a rede de silício precisa para completar as quatro ligações. Fica faltando um elétron numa ligação: essa vaga é a lacuna.

Um elétron vizinho pode ocupar a lacuna, e com isso a lacuna se desloca para o lugar de onde ele veio. Na prática ela se comporta como um portador de carga POSITIVA movendo-se pela banda de valência — daí o nome tipo P.

Pares elétron-lacuna gerados termicamente existem em qualquer semicondutor, mas no material dopado eles são minoria diante dos portadores introduzidos pelo dopante.`,
});

qa({
  t: T2,
  sub: "Alotropia do carbono e forças entre camadas",
  dif: "medio",
  e: String.raw`A grafita é usada como lubrificante sólido e o diamante como abrasivo, embora ambos sejam carbono puro. Essa diferença de comportamento mecânico vem:`,
  ok: "Das fracas forças entre as camadas da grafita.",
  err: [
    "Da maior massa específica do diamante.",
    "Da presença de hidrogênio na estrutura da grafita.",
    "Do caráter iônico das ligações no diamante.",
    "Da menor eletronegatividade do carbono na grafita.",
  ],
  r: String.raw`No diamante, cada carbono $sp^3$ está ligado covalentemente a outros quatro numa rede tridimensional rígida. Riscar o diamante exigiria romper ligações covalentes em todas as direções — por isso ele é o abrasivo por excelência.

Na grafita, cada camada hexagonal é fortíssima (carbono $sp^2$, ligações $\sigma$ no plano), mas as camadas se empilham unidas apenas por forças de van der Waals. Elas deslizam umas sobre as outras com facilidade, e é esse deslizamento que lubrifica.

Ou seja, o mesmo elemento dá materiais opostos porque o que muda é o ARRANJO das ligações, não a natureza do átomo.`,
});

qa({
  t: T2,
  sub: "Sólido covalente versus sólido molecular",
  dif: "medio",
  e: String.raw`O $\text{CO}_2$ é gasoso à temperatura ambiente, enquanto o $\text{SiO}_2$ funde acima de $1600\ ^\circ$C, apesar de ambos terem fórmula do tipo $\text{XO}_2$. A razão é que o $\text{SiO}_2$:`,
  ok: "Forma uma rede covalente tridimensional.",
  err: [
    "É formado por moléculas pequenas e apolares.",
    "É mantido por ligações de hidrogênio.",
    "É um composto iônico bastante solúvel.",
    "Tem massa molar muito maior que a do gás.",
  ],
  r: String.raw`O carbono é pequeno e faz duplas eficientes com o oxigênio: o $\text{CO}_2$ satisfaz suas valências numa molécula discreta e linear. Entre uma molécula e outra só há dispersão de London, fraquíssima — daí ser gás.

O silício é maior e forma duplas ruins; ele prefere quatro ligações simples. Cada Si se cerca de quatro oxigênios e cada O liga dois Si, gerando uma rede covalente contínua. Não existe "molécula de $\text{SiO}_2$": fundir o quartzo significa romper ligações covalentes de verdade.

É o mesmo contraste entre o diamante e um sólido molecular qualquer.`,
});

qa({
  t: T2,
  sub: "Energia reticular e carga dos íons",
  dif: "medio",
  e: String.raw`O MgO funde a cerca de $2850\ ^\circ$C, enquanto o NaCl funde a $801\ ^\circ$C, apesar de os dois serem sólidos iônicos com o mesmo tipo de retículo. A causa principal é:`,
  ok: "A carga maior dos íons no MgO.",
  err: [
    "O raio maior dos íons no MgO.",
    "O caráter covalente das ligações no MgO.",
    "A massa molar maior do NaCl.",
    "A solubilidade maior do NaCl em água.",
  ],
  r: String.raw`A energia reticular cresce com o produto das cargas e cai com a distância entre os íons:

$$U \propto \dfrac{|z_+ \cdot z_-|}{r_+ + r_-}$$

No NaCl as cargas são $+1$ e $-1$, produto $1$. No MgO são $+2$ e $-2$, produto $4$ — quatro vezes maior. Somando a isso o fato de $\text{Mg}^{2+}$ e $\text{O}^{2-}$ serem menores que $\text{Na}^+$ e $\text{Cl}^-$, a atração eletrostática fica muito mais intensa.

Retículo mais coeso significa mais energia para desmontá-lo: ponto de fusão bem mais alto.`,
});

qa({
  t: T2,
  sub: "Hibridização sp e contagem de ligações sigma e pi",
  dif: "medio",
  e: String.raw`No $\text{CO}_2$ o carbono central é $sp$ e a molécula é linear. O número de ligações $\sigma$ e $\pi$ na molécula é, respectivamente:`,
  ok: "$2$ e $2$",
  err: ["$4$ e $0$", "$3$ e $1$", "$1$ e $3$", "$2$ e $4$"],
  r: String.raw`A estrutura é $\text{O}=\text{C}=\text{O}$: duas ligações duplas.

A regra geral é que toda ligação, simples ou múltipla, tem exatamente uma $\sigma$; as demais são $\pi$. Cada dupla, portanto, contribui com $1\sigma + 1\pi$.

Com duas duplas: $2\sigma$ e $2\pi$. Isso é coerente com a hibridização $sp$ do carbono — dois orbitais híbridos formam as duas $\sigma$ a $180^\circ$, e os dois orbitais $p$ puros restantes, perpendiculares entre si, formam as duas $\pi$.`,
});

qa({
  t: T2,
  sub: "Semelhante dissolve semelhante",
  dif: "facil",
  e: String.raw`O etanol se mistura com a água em qualquer proporção, enquanto o hexano forma duas fases. A explicação é que o etanol:`,
  ok: "Faz ligações de hidrogênio com a água.",
  err: [
    "Tem massa molar menor que a da água.",
    "É um composto iônico em solução.",
    "Tem cadeia carbônica mais longa que o hexano.",
    "Reage quimicamente com a água.",
  ],
  r: String.raw`Dissolver exige trocar as interações soluto-soluto e solvente-solvente por interações soluto-solvente de intensidade comparável.

O grupo $-\text{OH}$ do etanol faz ligações de hidrogênio com a água tão boas quanto as que a água faz consigo mesma, e por isso a mistura acontece sem custo energético apreciável.

O hexano só tem cadeia apolar: para ele entrar, a água teria de romper suas ligações de hidrogênio e receber em troca apenas forças de dispersão, muito mais fracas. Não compensa, e as fases se separam.`,
});

qa({
  t: T2,
  sub: "Energia de ligação e inércia química do N2",
  dif: "medio",
  e: String.raw`O nitrogênio é o gás mais abundante da atmosfera e, ainda assim, praticamente inerte em condições ambientes. A causa dessa inércia é:`,
  ok: "A alta energia da sua ligação tripla.",
  err: [
    "A sua elevada eletronegatividade.",
    "A sua baixa massa molar.",
    "A ausência de elétrons de valência.",
    "A sua geometria angular.",
  ],
  r: String.raw`A molécula $\text{N}_2$ tem uma ligação tripla $\text{N}\equiv\text{N}$, com energia da ordem de $941$ kJ/mol — uma das ligações mais fortes que se conhece.

Qualquer reação do $\text{N}_2$ começa por romper (ou ao menos enfraquecer bastante) essa ligação, o que impõe uma barreira de ativação enorme. A inércia é, portanto, CINÉTICA: não falta espontaneidade a muitas reações do nitrogênio, falta caminho acessível.

É exatamente por isso que o processo Haber-Bosch precisa de catalisador de ferro, altas pressões e centenas de graus para transformar $\text{N}_2$ em amônia.`,
});

qa({
  t: T2,
  sub: "Estrutura aberta do gelo e densidade da água",
  dif: "medio",
  e: String.raw`O gelo flutua na água líquida, ao contrário do que se observa na quase totalidade das substâncias. Isso acontece porque, ao solidificar, a água:`,
  ok: "Forma uma rede aberta de ligações de hidrogênio.",
  err: [
    "Perde as ligações de hidrogênio entre as moléculas.",
    "Aumenta a massa de cada uma de suas moléculas.",
    "Aproxima ao máximo as moléculas umas das outras.",
    "Passa a apresentar geometria molecular linear.",
  ],
  r: String.raw`Cada molécula de água pode fazer quatro ligações de hidrogênio, duas pelos hidrogênios e duas pelos pares isolados do oxigênio, em direções aproximadamente tetraédricas.

No gelo essa geometria é satisfeita por completo, e o preço é uma estrutura hexagonal cheia de espaços vazios. No líquido as ligações se rompem e refazem o tempo todo, permitindo que as moléculas se empacotem mais próximas — em média, mais densas.

Por isso o gelo é menos denso e flutua, o que preserva a vida aquática sob a superfície congelada dos lagos.`,
});

qa({
  t: T2,
  sub: "Comparação entre forças intermoleculares",
  dif: "facil",
  e: String.raw`O propano e o etanol têm massas molares próximas ($44$ e $46$ g/mol), mas o etanol ferve a $78\ ^\circ$C e o propano a $-42\ ^\circ$C. A causa dessa diferença é:`,
  ok: "A ligação de hidrogênio do grupo hidroxila.",
  err: [
    "A massa molar ligeiramente maior do etanol.",
    "A presença de ligações iônicas no etanol.",
    "A cadeia carbônica mais longa do etanol.",
    "A polaridade menor da molécula de etanol.",
  ],
  r: String.raw`Com massas molares praticamente iguais, as forças de dispersão de London são semelhantes nos dois — elas não explicam nada aqui.

O que o etanol tem de diferente é o grupo $-\text{OH}$, que permite ligações de hidrogênio entre suas moléculas. Essa interação é uma ordem de grandeza mais forte que a dispersão, e separar as moléculas na ebulição custa muito mais energia.

Repare que os dois têm o mesmo número de carbonos: a cadeia do etanol não é mais longa, é o grupo funcional que muda tudo.`,
});

// ---------------------------------------------------------------------------
// Termodinâmica, Cinética e Equilíbrio (inclui oxirredução, pilhas e eletrólise)
// ---------------------------------------------------------------------------

qa({
  t: T3,
  sub: "Ação do catalisador sobre a energia de ativação",
  dif: "facil",
  e: String.raw`Um catalisador acelera uma reação química porque:`,
  ok: "Oferece um caminho com menor energia de ativação.",
  err: [
    "Aumenta a energia cinética média das moléculas.",
    "Torna a reação mais exotérmica do que era.",
    "Desloca o equilíbrio no sentido dos produtos.",
    "Aumenta o valor da constante de equilíbrio.",
  ],
  r: String.raw`O catalisador participa da reação formando um intermediário e é regenerado no fim. Com isso ele abre um MECANISMO alternativo, cuja barreira energética é mais baixa.

Com $E_a$ menor, uma fração muito maior das moléculas tem energia suficiente para reagir a uma dada temperatura, e a velocidade cresce.

O que o catalisador não faz: mexer na energia dos reagentes e dos produtos. Como $\Delta H$ e $\Delta G$ dependem só dos estados inicial e final, eles ficam intactos — e, portanto, $K$ também.`,
});

qa({
  t: T3,
  sub: "Catalisador em sistema já em equilíbrio",
  dif: "medio",
  e: String.raw`Um sistema gasoso já em equilíbrio recebe um catalisador, a temperatura constante. O efeito observado é que:`,
  ok: "O equilíbrio é atingido mais rapidamente.",
  err: [
    "O rendimento em produto aumenta.",
    "A constante de equilíbrio aumenta.",
    "A reação passa a ser exotérmica.",
    "O equilíbrio se desloca para a direita.",
  ],
  r: String.raw`O catalisador baixa a energia de ativação do caminho, e o mesmo caminho é percorrido nos dois sentidos: as velocidades direta e inversa aumentam na MESMA proporção.

Se as duas sobem igualmente, a razão entre elas — e portanto a composição do equilíbrio — não muda. O sistema não se desloca.

Num sistema que ainda não chegou ao equilíbrio, o catalisador faz diferença prática grande: ele encurta o tempo até lá. Mas a posição final é a mesma, com ou sem ele.`,
});

qa({
  t: T3,
  sub: "Distribuição de energias e efeito da temperatura",
  dif: "dificil",
  e: String.raw`Um aumento de apenas $10\ ^\circ$C costuma dobrar a velocidade de uma reação, efeito grande demais para ser explicado pelo aumento do número de colisões. O fator decisivo é:`,
  ok: "A fração de moléculas com energia acima da de ativação.",
  err: [
    "A diminuição da energia de ativação da reação.",
    "O aumento da concentração dos reagentes no meio.",
    "A diminuição da entalpia da reação direta.",
    "O aumento da constante de equilíbrio do sistema.",
  ],
  r: String.raw`Aquecer $10\ ^\circ$C perto da temperatura ambiente muda a velocidade média das moléculas em poucos por cento — muito pouco para dobrar a velocidade da reação.

O que muda muito é a CAUDA da distribuição de Maxwell-Boltzmann. Como a fração de moléculas com energia acima de $E_a$ é governada por um fator exponencial,

$$k = A\,e^{-E_a/RT}$$

um pequeno aumento de $T$ multiplica essa fração. São as colisões EFETIVAS que disparam, não o número total de colisões.

E note: a energia de ativação é característica do caminho da reação; quem a diminui é catalisador, não aquecimento.`,
});

qa({
  t: T3,
  sub: "Pressão em equilíbrio com igual número de mols gasosos",
  dif: "medio",
  e: String.raw`Considere o equilíbrio $\text{H}_2(g) + \text{I}_2(g) \rightleftharpoons 2\text{HI}(g)$. Uma compressão do sistema a temperatura constante:`,
  ok: "Não desloca o equilíbrio do sistema.",
  err: [
    "Desloca o equilíbrio no sentido do HI.",
    "Desloca o equilíbrio no sentido dos reagentes.",
    "Aumenta o valor da constante de equilíbrio.",
    "Diminui o valor da constante de equilíbrio.",
  ],
  r: String.raw`A pressão só desloca um equilíbrio gasoso quando os dois lados têm números DIFERENTES de mols de gás — o sistema responde indo para o lado que ocupa menos volume.

Aqui há $1 + 1 = 2$ mols de gás nos reagentes e $2$ mols no produto. Comprimir aumenta igualmente as concentrações dos dois lados, o quociente de reação não se altera e o sistema continua em equilíbrio.

A constante, por sua vez, só muda com a temperatura — nunca com pressão ou concentração.`,
});

qa({
  t: T3,
  sub: "Adição de gás inerte a volume constante",
  dif: "dificil",
  e: String.raw`Argônio é injetado num sistema gasoso em equilíbrio, mantendo-se o volume e a temperatura constantes. O resultado é que:`,
  ok: "As concentrações das espécies não se alteram.",
  err: [
    "O equilíbrio se desloca no sentido dos produtos.",
    "O equilíbrio se desloca no sentido dos reagentes.",
    "A constante de equilíbrio aumenta de valor.",
    "A velocidade da reação direta diminui.",
  ],
  r: String.raw`A pressão TOTAL do recipiente aumenta, e é aí que mora a pegadinha. O que governa o equilíbrio, porém, são as concentrações (ou pressões parciais) das espécies participantes.

A volume constante, cada espécie continua com o mesmo número de mols no mesmo volume: as concentrações e as pressões parciais ficam exatamente como estavam. O quociente de reação não muda, e nada se desloca.

Seria diferente se o argônio fosse adicionado a PRESSÃO constante: aí o recipiente se expandiria, diluindo as espécies, e o equilíbrio se deslocaria para o lado com mais mols de gás.`,
});

qa({
  t: T3,
  sub: "Efeito da temperatura sobre a constante de equilíbrio",
  dif: "medio",
  e: String.raw`Para uma reação exotérmica que se encontra em equilíbrio, um aumento de temperatura:`,
  ok: "Diminui o valor da constante de equilíbrio.",
  err: [
    "Aumenta o valor da constante de equilíbrio.",
    "Não altera o valor da constante de equilíbrio.",
    "Aumenta o rendimento em produto do sistema.",
    "Inverte o sinal da entalpia da reação.",
  ],
  r: String.raw`Numa reação exotérmica, pode-se encarar o calor como um produto:

$$\text{reagentes} \rightleftharpoons \text{produtos} + \text{calor}$$

Aquecer é como adicionar produto: o sistema reage consumindo esse excesso, deslocando-se no sentido dos reagentes. Menos produto e mais reagente no equilíbrio significa $K$ menor.

É o único fator que realmente altera $K$ — pressão, concentração e catalisador deslocam ou aceleram, mas não mudam a constante.

Daí o dilema industrial da síntese da amônia, exotérmica: temperatura alta ajuda a cinética e atrapalha o rendimento.`,
});

qa({
  t: T3,
  sub: "Quociente de reação e sentido do deslocamento",
  dif: "medio",
  e: String.raw`Num dado instante, o quociente de reação de um sistema vale $Q = 2$, enquanto a constante de equilíbrio vale $K = 10$, na mesma temperatura. O sistema evolui:`,
  ok: "No sentido de formar mais produtos.",
  err: [
    "No sentido de formar mais reagentes.",
    "Sem deslocamento, pois já está em equilíbrio.",
    "No sentido que diminui a constante de equilíbrio.",
    "No sentido que aumenta a constante de equilíbrio.",
  ],
  r: String.raw`$Q$ tem a mesma forma de $K$, mas é calculado com as concentrações do momento. Comparar os dois diz de que lado o sistema está do equilíbrio.

Com $Q < K$, o numerador (produtos) está pequeno demais em relação ao denominador (reagentes). Para $Q$ crescer até $K$, o sistema precisa consumir reagentes e formar produtos — desloca-se para a direita.

A constante em si não se mexe: ela é o alvo, não a variável. Se fosse $Q > K$, o caminho seria o inverso.`,
});

qa({
  t: T3,
  sub: "Energia livre de Gibbs e dependência da temperatura",
  dif: "medio",
  e: String.raw`Uma reação endotérmica que ocorre com aumento de entropia é espontânea:`,
  ok: "Apenas em temperaturas suficientemente altas.",
  err: [
    "Em qualquer temperatura.",
    "Apenas em temperaturas suficientemente baixas.",
    "Em nenhuma temperatura.",
    "Apenas sob pressão elevada.",
  ],
  r: String.raw`A espontaneidade é decidida pelo sinal de

$$\Delta G = \Delta H - T\Delta S$$

Aqui $\Delta H > 0$ (endotérmica), o que empurra $\Delta G$ para cima, e $\Delta S > 0$, o que faz o termo $-T\Delta S$ empurrar para baixo — e com peso proporcional à temperatura.

Em $T$ baixa o termo entálpico manda e $\Delta G > 0$: não espontânea. Acima de $T = \Delta H/\Delta S$ o termo entrópico vence e $\Delta G < 0$.

É o caso da fusão do gelo e da decomposição do calcário, que só andam acima de certa temperatura.`,
});

qa({
  t: T3,
  sub: "Espontaneidade termodinâmica versus velocidade",
  dif: "dificil",
  e: String.raw`A conversão do diamante em grafita tem $\Delta G < 0$ a $25\ ^\circ$C, e ainda assim nenhum diamante é visto se transformando. Isso mostra que:`,
  ok: "A espontaneidade não informa a velocidade.",
  err: [
    "A reação é, na verdade, endotérmica.",
    "O equilíbrio favorece o diamante.",
    "A variação de entropia do processo é negativa.",
    "O diamante é o alótropo termodinamicamente estável.",
  ],
  r: String.raw`Termodinâmica e cinética respondem a perguntas diferentes. O sinal de $\Delta G$ diz se o processo PODE ocorrer sozinho; ele não diz nada sobre quanto tempo isso leva.

A transformação diamante $\to$ grafita exige rearranjar uma rede covalente inteira, rompendo ligações C–C $sp^3$. A energia de ativação é altíssima e, à temperatura ambiente, a velocidade é indistinguível de zero.

Diz-se então que o diamante é estável CINETICAMENTE, ou metaestável. O mesmo raciocínio explica por que a gasolina não pega fogo sozinha à temperatura ambiente, embora sua combustão seja espontaneíssima.`,
});

qa({
  t: T3,
  sub: "Variação de entropia em mudanças de estado",
  dif: "medio",
  e: String.raw`Dentre os processos a seguir, aquele que ocorre com maior aumento de entropia é:`,
  ok: "A sublimação do gelo seco.",
  err: [
    "A condensação do vapor de água.",
    "A solidificação de um metal fundido.",
    "A compressão isotérmica de um gás.",
    "A cristalização de um sal dissolvido.",
  ],
  r: String.raw`Entropia mede o número de microestados acessíveis, e o estado gasoso é disparado o mais rico em microestados: as moléculas ocupam qualquer posição e qualquer direção de movimento.

A sublimação do gelo seco leva $\text{CO}_2$ sólido, com moléculas fixas num retículo, direto a gás — o maior salto de desordem possível numa mudança de estado.

Todas as outras opções vão no sentido contrário, concentrando ou ordenando a matéria: condensar, solidificar, comprimir e cristalizar têm $\Delta S < 0$.`,
});

qa({
  t: T3,
  sub: "Sentido dos elétrons numa pilha galvânica",
  dif: "medio",
  e: String.raw`Numa pilha de Daniell, formada por eletrodos de zinco e de cobre em suas respectivas soluções, os elétrons percorrem o circuito externo:`,
  ok: "Do eletrodo de zinco para o de cobre.",
  err: [
    "Do eletrodo de cobre para o de zinco.",
    "Através da ponte salina, nos dois sentidos.",
    "Das soluções em direção aos dois eletrodos.",
    "Em ambos os sentidos, alternadamente.",
  ],
  r: String.raw`Os potenciais decidem os papéis: $E^\circ(\text{Zn}^{2+}/\text{Zn}) = -0{,}76$ V contra $E^\circ(\text{Cu}^{2+}/\text{Cu}) = +0{,}34$ V.

O zinco, de menor potencial, é o ANODO: oxida-se, $\text{Zn} \to \text{Zn}^{2+} + 2e^-$, e injeta elétrons no fio. Eles atravessam o circuito externo até o cobre, o CATODO, onde reduzem os íons $\text{Cu}^{2+}$ da solução.

Elétrons nunca atravessam a ponte salina nem a solução — lá quem se move são íons, justamente para manter as duas soluções eletricamente neutras.`,
});

qa({
  t: T3,
  sub: "Função da ponte salina",
  dif: "medio",
  e: String.raw`Se a ponte salina de uma pilha em funcionamento for retirada, o que se observa é que:`,
  ok: "A corrente cessa por acúmulo de carga nas soluções.",
  err: [
    "A corrente dobra, por diminuir a resistência interna.",
    "A pilha passa a funcionar como uma eletrólise.",
    "O potencial padrão da pilha aumenta de valor.",
    "Nada muda, pois ela apenas sustenta os eletrodos.",
  ],
  r: String.raw`Enquanto a pilha opera, a solução do anodo ganha cátions ($\text{Zn}^{2+}$) e a do catodo perde cátions ($\text{Cu}^{2+}$ que se depositam). Sem compensação, uma solução ficaria positiva e a outra negativa.

Esse desbalanço cria um campo elétrico contrário que, em frações de segundo, impede a saída de mais elétrons — a corrente para.

A ponte salina evita isso migrando seus próprios íons: ânions para o compartimento do anodo, cátions para o do catodo. Ela fecha o circuito pelo lado iônico e mantém as duas soluções neutras.`,
});

qa({
  t: T3,
  sub: "Potencial padrão como propriedade intensiva",
  dif: "dificil",
  e: String.raw`Ao se multiplicarem por dois todos os coeficientes da equação global de uma pilha, o potencial padrão dela:`,
  ok: "Permanece o mesmo.",
  err: ["Dobra de valor.", "Cai pela metade.", "Troca de sinal.", "Torna-se igual a zero."],
  r: String.raw`O potencial é energia POR CARGA, e não energia total — uma grandeza intensiva, como a densidade ou a temperatura.

Ao dobrar os coeficientes, dobram a energia liberada e o número de elétrons transferidos. A razão entre as duas não muda:

$$\Delta G = -nFE^\circ \Rightarrow E^\circ = -\dfrac{\Delta G}{nF}$$

com $\Delta G$ e $n$ dobrando juntos.

Em termos práticos: ligar pilhas em paralelo aumenta a corrente disponível, não a tensão. Quem troca de sinal é o potencial ao se inverter o sentido da reação, e não ao se mudar a estequiometria.`,
});

qa({
  t: T3,
  sub: "Relação entre FEM e energia livre",
  dif: "medio",
  e: String.raw`Uma reação de oxirredução cuja força eletromotriz padrão é positiva apresenta:`,
  ok: "Energia livre negativa, sendo espontânea.",
  err: [
    "Energia livre positiva, sendo espontânea.",
    "Energia livre negativa, sendo não espontânea.",
    "Energia livre positiva, sendo não espontânea.",
    "Energia livre nula, estando em equilíbrio.",
  ],
  r: String.raw`A ponte entre eletroquímica e termodinâmica é

$$\Delta G^\circ = -nFE^\circ$$

com $n$ o número de elétrons transferidos e $F$ a constante de Faraday, ambos positivos. O sinal de menos faz o resto: $E^\circ > 0$ implica $\Delta G^\circ < 0$.

E $\Delta G < 0$ é exatamente o critério de espontaneidade. Ou seja, pilha que marca tensão positiva no voltímetro é reação que anda sozinha — é o caso de toda célula galvânica.

Quando $E^\circ < 0$, só forçando de fora: é a eletrólise.`,
});

qa({
  t: T3,
  sub: "Eletrólise como processo forçado",
  dif: "facil",
  e: String.raw`Na eletrólise da água, a energia elétrica fornecida pela fonte externa serve para:`,
  ok: "Forçar uma reação não espontânea.",
  err: [
    "Acelerar uma reação espontânea.",
    "Aumentar a constante de equilíbrio do sistema.",
    "Diminuir a energia de ativação da reação.",
    "Aquecer a solução até a temperatura de ebulição.",
  ],
  r: String.raw`A reação $2\text{H}_2\text{O}(l) \to 2\text{H}_2(g) + \text{O}_2(g)$ tem $\Delta G > 0$: ela não acontece sozinha, tanto que a água não se decompõe num copo.

A fonte externa fornece o trabalho elétrico que falta, empurrando a reação no sentido contrário ao espontâneo. É o inverso exato de uma pilha, que colhe trabalho elétrico de uma reação espontânea.

Note a diferença com um catalisador: ele acelera o que já é espontâneo, sem nunca inverter o sentido natural do processo.`,
});

qa({
  t: T3,
  sub: "Proteção catódica por anodo de sacrifício",
  dif: "medio",
  e: String.raw`Para proteger da corrosão o casco de aço de uma embarcação, deve-se conectar a ele blocos metálicos de:`,
  ok: "Zinco",
  err: ["Cobre", "Prata", "Estanho", "Ouro"],
  r: String.raw`A ideia da proteção catódica é oferecer ao ambiente um metal mais fácil de oxidar do que o ferro, para que ele se corroa no lugar do casco.

Isso exige potencial de redução MENOR que o do ferro ($E^\circ = -0{,}44$ V). O zinco cumpre o papel ($E^\circ = -0{,}76$ V): ele vira o anodo do par e se consome aos poucos, enquanto o aço fica catodicamente protegido — daí o nome anodo de sacrifício.

Todos os outros da lista são mais nobres que o ferro. Ligados ao casco, inverteriam o arranjo e o ferro é que passaria a corroer mais rápido.`,
});

qa({
  t: T3,
  sub: "Passivação do alumínio",
  dif: "dificil",
  e: String.raw`O alumínio tem $E^\circ = -1{,}66$ V, bem mais negativo que o do ferro, e mesmo assim esquadrias e panelas de alumínio não se deterioram ao ar. A explicação é:`,
  ok: "A camada de óxido aderente formada na superfície.",
  err: [
    "A ausência de reação entre o alumínio e o oxigênio.",
    "O potencial de redução positivo do alumínio puro.",
    "A dissolução do óxido de alumínio na água da chuva.",
    "O caráter não espontâneo da oxidação do alumínio.",
  ],
  r: String.raw`O alumínio de fato se oxida — e depressa. O ponto é o que acontece depois: o $\text{Al}_2\text{O}_3$ formado é fino, muito aderente, impermeável e tem volume compatível com o do metal, de modo que sela a superfície e impede o oxigênio de chegar ao alumínio de baixo. A corrosão para sozinha.

Esse fenômeno se chama passivação, e é também o que protege cromo, titânio e zinco.

O contraste com o ferro é justamente esse: a ferrugem é porosa e se desprende, expondo metal novo continuamente até consumir a peça inteira.`,
});

qa({
  t: T3,
  sub: "Condutividade do eletrólito e velocidade de corrosão",
  dif: "medio",
  e: String.raw`Uma tubulação de aço enterrada corrói mais rapidamente em solo úmido e salino. O papel do sal nesse processo é:`,
  ok: "Aumentar a condutividade do eletrólito.",
  err: [
    "Aumentar o potencial padrão de redução do ferro.",
    "Reagir diretamente com o ferro metálico da tubulação.",
    "Reduzir o oxigênio dissolvido na umidade do solo.",
    "Diminuir a energia de ativação da oxidação do ferro.",
  ],
  r: String.raw`A corrosão é um processo eletroquímico: há regiões anódicas onde o ferro se oxida e regiões catódicas onde o oxigênio é reduzido, e entre elas precisa circular corrente iônica pelo meio.

Água pura conduz mal, o que limita a velocidade do processo. Dissolver sal enche o meio de íons móveis, a resistência do eletrólito despenca e a corrente da pilha de corrosão aumenta — logo, mais metal consumido por unidade de tempo.

O sal não muda a termodinâmica (o $E^\circ$ do ferro é o que é); ele remove o gargalo que segurava a velocidade.`,
});

qa({
  t: T3,
  sub: "Reação de deslocamento entre metal e cátion",
  dif: "facil",
  e: String.raw`Uma lâmina de zinco é mergulhada em solução azul de $\text{CuSO}_4$. Com o tempo, a lâmina fica recoberta por um depósito avermelhado e a cor azul desaparece. Isso ocorre porque:`,
  ok: "O zinco é oxidado e o cobre é reduzido.",
  err: [
    "O cobre é oxidado e o zinco é reduzido.",
    "O sulfato se decompõe liberando enxofre.",
    "O zinco dissolve fisicamente o cobre metálico.",
    "A água oxida o zinco, formando seu óxido.",
  ],
  r: String.raw`Como $E^\circ(\text{Cu}^{2+}/\text{Cu}) = +0{,}34$ V é maior que $E^\circ(\text{Zn}^{2+}/\text{Zn}) = -0{,}76$ V, os íons $\text{Cu}^{2+}$ conseguem arrancar elétrons do zinco metálico:

$$\text{Zn}(s) + \text{Cu}^{2+}(aq) \to \text{Zn}^{2+}(aq) + \text{Cu}(s)$$

O cobre metálico formado se deposita sobre a lâmina — é o depósito avermelhado. E como quem dá cor azul à solução é o íon $\text{Cu}^{2+}$, a cor some à medida que ele é consumido; o $\text{Zn}^{2+}$ que entra no lugar é incolor.

É a mesma reação da pilha de Daniell, só que em contato direto: a energia sai como calor em vez de corrente elétrica.`,
});

qa({
  t: T3,
  sub: "Ausência de reação entre metal nobre e cátion menos nobre",
  dif: "medio",
  e: String.raw`Uma lâmina de cobre mergulhada em solução de $\text{ZnSO}_4$ permanece inalterada por tempo indefinido. A razão é que:`,
  ok: "O cobre tem potencial de redução maior que o do zinco.",
  err: [
    "O cobre tem potencial de redução menor que o do zinco.",
    "O sulfato de zinco é insolúvel em água fria.",
    "O cobre é um dos metais mais ativos da série.",
    "A reação é rápida demais para ser percebida.",
  ],
  r: String.raw`Para o metal sólido ser dissolvido, o cátion presente na solução precisa ter potencial de redução MAIOR que o do metal — só assim a transferência de elétrons é espontânea.

Aqui teríamos $\text{Zn}^{2+}$ ($-0{,}76$ V) tentando oxidar o cobre ($+0{,}34$ V). A FEM da reação seria $-1{,}10$ V, ou seja, $\Delta G > 0$: ela simplesmente não ocorre.

É o inverso exato do caso do zinco em $\text{CuSO}_4$, e é isso que a série eletroquímica resume: metal só desloca da solução um outro metal MENOS nobre que ele.`,
});

qa({
  t: T3,
  sub: "Temperatura e conservação de alimentos",
  dif: "medio",
  e: String.raw`Guardar alimentos na geladeira retarda sua deterioração. Do ponto de vista cinético, a redução da temperatura:`,
  ok: "Diminui a fração de colisões efetivas.",
  err: [
    "Aumenta a energia de ativação das reações.",
    "Torna as reações termodinamicamente desfavoráveis.",
    "Diminui a concentração dos reagentes no alimento.",
    "Elimina completamente os microrganismos presentes.",
  ],
  r: String.raw`As reações de degradação continuam espontâneas dentro da geladeira — o que muda é a velocidade com que ocorrem.

Com $T$ menor, a distribuição de Maxwell-Boltzmann se desloca para energias mais baixas e a fração de moléculas capazes de vencer a barreira $E_a$ cai exponencialmente, conforme $k = A\,e^{-E_a/RT}$. Menos colisões efetivas por segundo, processo mais lento.

Repare que a energia de ativação não muda com a temperatura: ela é característica do caminho da reação. E o frio apenas desacelera os microrganismos, sem eliminá-los — por isso o alimento estraga assim mesmo, só que depois.`,
});

qa({
  t: T3,
  sub: "Le Chatelier e remoção contínua de produto",
  dif: "dificil",
  e: String.raw`Na calcinação do calcário, $\text{CaCO}_3(s) \rightleftharpoons \text{CaO}(s) + \text{CO}_2(g)$, o forno é mantido aberto de modo que o $\text{CO}_2$ escape continuamente. Esse procedimento:`,
  ok: "Desloca o equilíbrio no sentido da decomposição.",
  err: [
    "Desloca o equilíbrio no sentido do calcário.",
    "Não altera o equilíbrio, por envolver sólidos.",
    "Aumenta o valor da constante de equilíbrio.",
    "Diminui a velocidade da reação direta.",
  ],
  r: String.raw`Neste equilíbrio, só o $\text{CO}_2$ é gasoso; os sólidos têm atividade constante e não entram na expressão da constante, que se reduz a $K_p = p_{\text{CO}_2}$.

Retirando o gás sem parar, a pressão parcial de $\text{CO}_2$ fica sempre abaixo do valor de equilíbrio, ou seja, $Q < K$. O sistema tenta repor o produto que some e decompõe mais calcário.

Como a retirada nunca cessa, o equilíbrio nunca é alcançado e a conversão pode ser levada perto de $100\%$. É exatamente assim que se produz cal virgem em escala industrial.`,
});

qa({
  t: T3,
  sub: "Área superficial e velocidade de reação",
  dif: "medio",
  e: String.raw`Limalha de ferro jogada sobre uma chama queima em faíscas brilhantes, enquanto um prego colocado na mesma chama apenas se aquece. A diferença está:`,
  ok: "Na área superficial exposta ao oxigênio.",
  err: [
    "Na composição química dos dois materiais.",
    "Na entalpia da reação de oxidação do ferro.",
    "Na energia de ativação da combustão do ferro.",
    "Na pressão parcial de oxigênio junto à chama.",
  ],
  r: String.raw`A oxidação do ferro é heterogênea: ela só acontece na interface entre o sólido e o gás. A velocidade, portanto, é proporcional à área de contato disponível.

Dividir a mesma massa de ferro em partículas minúsculas multiplica essa área por ordens de grandeza. Cada grão ainda aquece muito rápido, por ter pouca massa, o que realimenta o processo — e o resultado é a queima explosiva.

No prego, a área é ridiculamente pequena diante da massa, e o calor liberado se dissipa pelo metal. A química é idêntica nos dois casos; o que muda é só a geometria.

Esse é o mesmo princípio por trás do risco de explosão em silos de grãos e moinhos de pó.`,
});

// ---------------------------------------------------------------------------
// Funções Inorgânicas e Reações Químicas
// ---------------------------------------------------------------------------

qa({
  t: T4,
  sub: "pH de solução de ácido forte",
  dif: "facil",
  e: String.raw`O pH de uma solução aquosa de ácido clorídrico $10^{-3}$ mol/L, a $25\ ^\circ$C, é:`,
  ok: "$3$",
  err: ["$1$", "$7$", "$11$", "$14$"],
  r: String.raw`O HCl é ácido forte: ioniza-se praticamente por completo, de modo que a concentração de $\text{H}^+$ é igual à do ácido colocado.

$$[\text{H}^+] = 10^{-3}\ \text{mol/L} \Rightarrow \text{pH} = -\log(10^{-3}) = 3$$

Só se pode ler o pH diretamente da concentração porque o ácido é forte. Para um ácido fraco de mesma concentração, seria preciso passar pelo $K_a$, e o pH ficaria mais alto (mais perto de 7).`,
});

qa({
  t: T4,
  sub: "pH de solução de base forte",
  dif: "facil",
  e: String.raw`O pH de uma solução aquosa de hidróxido de sódio $10^{-2}$ mol/L, a $25\ ^\circ$C, é:`,
  ok: "$12$",
  err: ["$2$", "$7$", "$10$", "$14$"],
  r: String.raw`O NaOH é base forte e se dissocia por completo, então $[\text{OH}^-] = 10^{-2}$ mol/L.

$$\text{pOH} = -\log(10^{-2}) = 2$$

$$\text{pH} = 14 - \text{pOH} = 14 - 2 = 12$$

O erro clássico aqui é aplicar o logaritmo direto à concentração e responder $2$ — mas $2$ seria o pOH, ou o pH de um ÁCIDO forte nessa concentração.`,
});

qa({
  t: T4,
  sub: "Hidrólise de sal de base forte com ácido fraco",
  dif: "medio",
  e: String.raw`Uma solução aquosa de acetato de sódio apresenta pH:`,
  ok: "Maior que 7, por hidrólise do ânion.",
  err: [
    "Menor que 7, por hidrólise do cátion.",
    "Igual a 7, por se tratar de um sal solúvel.",
    "Menor que 7, por hidrólise do ânion.",
    "Maior que 7, por hidrólise do cátion.",
  ],
  r: String.raw`O acetato de sódio vem de base forte (NaOH) com ácido fraco (ácido acético). Quem decide o pH é a parte que veio do componente FRACO.

O $\text{Na}^+$ é o cátion de uma base forte e não tem tendência alguma a reagir com a água. Já o acetato é a base conjugada de um ácido fraco, e por isso é uma base razoável:

$$\text{CH}_3\text{COO}^-(aq) + \text{H}_2\text{O}(l) \rightleftharpoons \text{CH}_3\text{COOH}(aq) + \text{OH}^-(aq)$$

A hidrólise do ânion libera $\text{OH}^-$ e a solução fica básica, com pH acima de 7.`,
});

qa({
  t: T4,
  sub: "Hidrólise de sal de ácido forte com base fraca",
  dif: "medio",
  e: String.raw`Uma solução aquosa de cloreto de amônio apresenta caráter:`,
  ok: "Ácido, por hidrólise do cátion.",
  err: [
    "Básico, por hidrólise do ânion.",
    "Neutro, por se tratar de um sal solúvel.",
    "Básico, por hidrólise do cátion.",
    "Ácido, por hidrólise do ânion.",
  ],
  r: String.raw`O cloreto de amônio vem de ácido forte (HCl) com base fraca (amônia), então a herança é do lado fraco — o cátion.

O $\text{Cl}^-$, base conjugada de um ácido forte, é praticamente inerte em água. O $\text{NH}_4^+$, por sua vez, é o ácido conjugado de uma base fraca e cede próton:

$$\text{NH}_4^+(aq) + \text{H}_2\text{O}(l) \rightleftharpoons \text{NH}_3(aq) + \text{H}_3\text{O}^+(aq)$$

O excesso de $\text{H}_3\text{O}^+$ deixa a solução ácida, com pH abaixo de 7.`,
});

qa({
  t: T4,
  sub: "Grau de ionização e condutividade de eletrólitos",
  dif: "medio",
  e: String.raw`Duas soluções de mesma concentração, uma de ácido clorídrico e outra de ácido acético, são testadas num circuito com lâmpada. A do ácido clorídrico acende com muito mais intensidade porque ele:`,
  ok: "Ioniza-se em extensão muito maior.",
  err: [
    "Apresenta massa molar bem mais elevada.",
    "Forma moléculas apolares em solução.",
    "É um eletrólito que não se dissocia em água.",
    "Possui mais átomos de hidrogênio na fórmula.",
  ],
  r: String.raw`A lâmpada mede a quantidade de ÍONS LIVRES na solução, não a quantidade de soluto dissolvido.

O HCl é eletrólito forte: praticamente toda molécula vira $\text{H}^+$ e $\text{Cl}^-$, e a solução fica cheia de portadores de carga. O ácido acético é fraco, com $K_a = 1{,}8 \times 10^{-5}$: apenas cerca de $1\%$ das moléculas se ioniza numa solução $0{,}1$ mol/L, e o resto permanece como molécula neutra, que não conduz.

Vale notar que o ácido acético tem até mais hidrogênios na fórmula — só que três deles estão presos ao carbono e não são ionizáveis.`,
});

qa({
  t: T4,
  sub: "Neutralização entre ácido forte e base forte",
  dif: "medio",
  e: String.raw`Misturando-se quantidades estequiométricas de ácido clorídrico e hidróxido de sódio, a solução final apresenta pH:`,
  ok: "Igual a 7, pois o sal formado não hidrolisa.",
  err: [
    "Menor que 7, pois o sal formado hidrolisa.",
    "Maior que 7, pois o sal formado hidrolisa.",
    "Menor que 7, pois resta ácido clorídrico livre.",
    "Maior que 7, pois resta hidróxido de sódio livre.",
  ],
  r: String.raw`A reação é $\text{HCl} + \text{NaOH} \to \text{NaCl} + \text{H}_2\text{O}$, e em quantidades estequiométricas nenhum dos dois sobra.

O que resta em solução é NaCl. Seus íons vêm ambos de espécies fortes: $\text{Na}^+$ de uma base forte e $\text{Cl}^-$ de um ácido forte. Nenhum dos dois reage com a água, ou seja, não há hidrólise, e o pH fica em 7.

Cuidado com a generalização: neutralização só termina em pH 7 quando ácido e base são AMBOS fortes. Ácido fraco com base forte dá sal básico, e o inverso dá sal ácido.`,
});

qa({
  t: T4,
  sub: "Óxidos ácidos e chuva ácida industrial",
  dif: "medio",
  e: String.raw`A chuva ácida de origem industrial se forma porque os óxidos de enxofre e de nitrogênio lançados na atmosfera, ao se dissolverem na água, produzem:`,
  ok: "Ácidos fortes.",
  err: ["Bases fortes.", "Sais neutros.", "Óxidos básicos.", "Peróxidos estáveis."],
  r: String.raw`Óxidos de ametais são óxidos ÁCIDOS: reagem com a água formando ácidos. No caso,

$$\text{SO}_3 + \text{H}_2\text{O} \to \text{H}_2\text{SO}_4 \qquad 3\text{NO}_2 + \text{H}_2\text{O} \to 2\text{HNO}_3 + \text{NO}$$

Ácido sulfúrico e ácido nítrico são fortes, ionizam-se por completo e derrubam o pH da chuva para valores bem abaixo de 5 — daí o ataque a monumentos, lavouras e lagos.

É diferente da acidez natural da chuva, causada pelo $\text{CO}_2$, que forma apenas o ácido carbônico, fraco, e estaciona em torno de pH $5{,}6$.`,
});

qa({
  t: T4,
  sub: "Célula a combustível de hidrogênio",
  dif: "medio",
  e: String.raw`Numa célula a combustível de hidrogênio, o produto da reação global e a forma de energia obtida são, respectivamente:`,
  ok: "Água líquida e energia elétrica.",
  err: [
    "Água e apenas energia térmica.",
    "Gás carbônico e energia elétrica.",
    "Peróxido de hidrogênio e energia elétrica.",
    "Hidrogênio e energia química armazenada.",
  ],
  r: String.raw`A célula a combustível separa espacialmente as duas semirreações da queima do hidrogênio: o $\text{H}_2$ se oxida num eletrodo e o $\text{O}_2$ se reduz no outro.

$$2\text{H}_2(g) + \text{O}_2(g) \to 2\text{H}_2\text{O}(l)$$

Como os elétrons são obrigados a atravessar um circuito externo para ir de um eletrodo ao outro, a energia da reação sai como trabalho elétrico, e não apenas como calor — é uma célula galvânica alimentada continuamente.

Não havendo carbono no combustível, não há emissão de $\text{CO}_2$: o único produto é água. O desafio ambiental se desloca para COMO o hidrogênio foi produzido.`,
});

qa({
  t: T4,
  sub: "Dopagem e funcionamento da célula fotovoltaica",
  dif: "dificil",
  e: String.raw`A junção p-n de uma célula solar de silício é obtida por dopagem controlada. O papel da dopagem nesse dispositivo é:`,
  ok: "Criar portadores de carga em quantidade controlada.",
  err: [
    "Aumentar o gap de energia do silício puro.",
    "Converter o silício num condutor metálico.",
    "Eliminar as impurezas presentes no cristal.",
    "Reduzir a absorção de luz pelo material.",
  ],
  r: String.raw`O silício puro absorve o fóton e gera um par elétron-lacuna, mas sem nada que separe as duas cargas elas simplesmente se recombinam e a energia vira calor.

A dopagem resolve isso. De um lado do cristal, átomos do grupo 15 fornecem elétrons em excesso (tipo N); do outro, átomos do grupo 13 criam lacunas (tipo P). Na interface entre os dois surge um campo elétrico interno.

É esse campo que empurra o elétron para um lado e a lacuna para o outro assim que o fóton é absorvido, gerando corrente no circuito externo.

Note que a dopagem não altera o gap do silício (cerca de $1{,}1$ eV, bem casado com o espectro solar) — ela introduz níveis dentro dele.`,
});

qa({
  t: T4,
  sub: "Aço inoxidável e camada passivadora",
  dif: "medio",
  e: String.raw`O aço inoxidável resiste à corrosão porque o cromo presente na liga:`,
  ok: "Forma uma camada de óxido aderente e protetora.",
  err: [
    "Tem potencial de redução maior que o do ouro.",
    "Impede a difusão do carbono no ferro fundido.",
    "Reage com a umidade formando um sal solúvel.",
    "Torna a oxidação do ferro não espontânea.",
  ],
  r: String.raw`Parece contraditório: o cromo é MAIS fácil de oxidar que o ferro. E é justamente por isso que funciona.

O cromo da liga reage primeiro com o oxigênio e forma um filme de $\text{Cr}_2\text{O}_3$ de poucos nanômetros, contínuo, aderente e impermeável, que isola o metal do ambiente. Acima de cerca de $11\%$ de cromo, o filme cobre toda a superfície e a corrosão cessa — é passivação, o mesmo fenômeno do alumínio.

O filme ainda se regenera sozinho quando a peça é riscada, o que explica a durabilidade do material.

Nenhuma liga torna a corrosão termodinamicamente desfavorável: o que se faz é bloquear o acesso do oxidante.`,
});

qa({
  t: T4,
  sub: "Galvanização versus revestimento de estanho",
  dif: "dificil",
  e: String.raw`Uma chapa de aço galvanizada continua protegida mesmo depois de riscada, enquanto a folha de flandres (aço revestido de estanho) passa a corroer rapidamente no risco. A razão é que:`,
  ok: "O zinco é menos nobre que o ferro, e o estanho é mais nobre.",
  err: [
    "O estanho é menos nobre que o ferro, e o zinco é mais nobre.",
    "O zinco é mais duro que o estanho e resiste melhor ao risco.",
    "O estanho forma óxido protetor no risco, e o zinco não.",
    "O zinco se dissolve na água da chuva, e o estanho não.",
  ],
  r: String.raw`Enquanto o revestimento está íntegro, os dois funcionam igual: são barreiras físicas. A diferença aparece quando o risco expõe o ferro e os dois metais ficam em contato no mesmo eletrólito.

No aço galvanizado, o par Zn–Fe tem o zinco como anodo ($E^\circ = -0{,}76$ V contra $-0{,}44$ V): ele se sacrifica e o ferro exposto fica protegido catodicamente, mesmo sem estar coberto.

Na folha de flandres, o estanho ($E^\circ = -0{,}14$ V) é mais nobre que o ferro. Invertem-se os papéis: o ferro vira o anodo e, pior, uma área anódica pequena (o risco) alimenta uma área catódica enorme, o que concentra o ataque e fura a lata rapidamente.

Por isso lata amassada e riscada estraga o alimento, e telhado galvanizado dura décadas.`,
});

qa({
  t: T4,
  sub: "Reação de carbonatos com ácidos",
  dif: "medio",
  e: String.raw`Monumentos de mármore se deterioram quando expostos à chuva ácida porque o carbonato de cálcio:`,
  ok: "Reage com ácidos liberando gás carbônico.",
  err: [
    "Se dissolve fisicamente na água da chuva.",
    "Se oxida em contato com o oxigênio do ar.",
    "Se decompõe termicamente pela ação do sol.",
    "Absorve a umidade formando um hidrato frágil.",
  ],
  r: String.raw`O mármore é essencialmente $\text{CaCO}_3$, praticamente insolúvel em água neutra — por isso a chuva comum não o dissolve.

Com ácido é outra história. O carbonato é a base conjugada de um ácido fraco e captura prótons, com o produto escapando como gás:

$$\text{CaCO}_3(s) + 2\text{H}^+(aq) \to \text{Ca}^{2+}(aq) + \text{H}_2\text{O}(l) + \text{CO}_2(g)$$

A saída contínua do $\text{CO}_2$ impede que o sistema volte ao equilíbrio, e a reação segue até consumir a pedra: o cálcio vai embora dissolvido e a superfície esculpida se perde.

É a mesma reação da efervescência do antiácido e do teste de campo para identificar calcário.`,
});

qa({
  t: T4,
  sub: "Neutralização de acidez estomacal",
  dif: "facil",
  e: String.raw`O bicarbonato de sódio alivia a azia porque, no estômago, ele:`,
  ok: "Neutraliza parte do ácido clorídrico presente.",
  err: [
    "Aumenta a acidez natural do suco gástrico.",
    "Precipita as enzimas responsáveis pela digestão.",
    "Se oxida liberando oxigênio na mucosa.",
    "Forma uma base forte em meio aquoso.",
  ],
  r: String.raw`O suco gástrico é uma solução de HCl com pH em torno de $1{,}5$. O íon bicarbonato é uma base fraca e reage com esse excesso de ácido:

$$\text{HCO}_3^-(aq) + \text{H}^+(aq) \to \text{H}_2\text{O}(l) + \text{CO}_2(g)$$

O ácido é consumido, o pH sobe um pouco e o desconforto passa — e o $\text{CO}_2$ formado é o responsável pela eructação típica.

Repare que a espécie usada é uma base FRACA de propósito. Uma base forte neutralizaria com a mesma eficiência, mas levaria o pH a valores perigosos e queimaria a mucosa.`,
});

qa({
  t: T4,
  sub: "Aplicação industrial da amônia",
  dif: "facil",
  e: String.raw`A amônia produzida em larga escala pelo processo Haber-Bosch tem como principal destino industrial:`,
  ok: "A produção de fertilizantes nitrogenados.",
  err: [
    "A produção de ácido clorídrico.",
    "A galvanização de chapas de aço.",
    "A dopagem de semicondutores de silício.",
    "A fabricação de vidro comum.",
  ],
  r: String.raw`As plantas precisam de nitrogênio, mas não conseguem usar o $\text{N}_2$ do ar por causa da inércia da ligação tripla. Ele precisa ser FIXADO numa forma assimilável.

É o que o processo Haber-Bosch faz, convertendo $\text{N}_2$ e $\text{H}_2$ em amônia, matéria-prima de ureia, nitrato de amônio e sulfato de amônio — os fertilizantes que sustentam a agricultura moderna. Algo em torno de $80\%$ de toda a amônia produzida no mundo segue esse caminho.

O restante se reparte entre explosivos, ácido nítrico, fluidos de refrigeração e produtos de limpeza.`,
});

writeFileSync(destino, JSON.stringify(itens, null, 2), "utf8");
console.log(`${itens.length} questões escritas em ${destino}`);

const conta = (chave) => {
  const m = new Map();
  itens.forEach((i) => m.set(i[chave], (m.get(i[chave]) || 0) + 1));
  return [...m.entries()].sort();
};
console.log("\npor tópico:");
conta("topico").forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
console.log("\npor dificuldade:");
conta("dificuldade").forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
console.log("\npor gabarito:");
conta("gabarito").forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
