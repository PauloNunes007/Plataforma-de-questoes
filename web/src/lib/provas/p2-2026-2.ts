// A P2 de 2026.2 de Física I e Física Teórica 2 da UFF (17/10/2026), com
// gabarito comentado — o conteúdo da página pública /provas/fisica-uff/p2-2026-2.
//
// É uma PEÇA DE DIVULGAÇÃO pra P3, não parte do acervo: o acervo
// (`supabase_provas_oficiais.sql`, `lib/provas/catalogo.ts`) é derivado do
// banco e esconde gabarito/resolução atrás do cadastro. Aqui é o contrário, e
// de propósito: o gabarito desta prova já circula oficialmente na turma, e o
// que a página mostra de graça é o NOSSO comentário dele — por que cada
// alternativa errada é errada. O que fica atrás do cadastro é o treino: as
// versões parecidas montadas com o banco e o treino da P3.
//
// Conteúdo estático (transcrito dos PDFs da prova, versão A de Física I e
// versão B de Física 2) porque a prova não muda, e assim a página não depende
// do banco pra existir. As figuras estão em public/provas/p2-2026-2/.
//
// `gemeas`: pra cada questão da prova, duas questões do BANCO do mesmo assunto
// e do mesmo tipo de raciocínio (a primeira entra na versão 1, a segunda na
// versão 2). Escolhidas à mão a partir do banco de 2026-09-15; quem monta o
// simulado (lib/provas/p2-2026-2-treino.ts) confere no banco que cada id ainda
// existe e não é desafio, e simplesmente pula o que sumiu.

export const SLUG_P2_2026_2 = "p2-2026-2";
export const ROTA_P2_2026_2 = `/provas/fisica-uff/${SLUG_P2_2026_2}`;
const FIG = "/provas/p2-2026-2";

export type Letra = "A" | "B" | "C" | "D" | "E";

export type QuestaoComentada = {
  numero: number;
  assunto: string;
  enunciado: string;
  /** Figura do enunciado. */
  figura?: string;
  /** Texto da alternativa, ou imagem quando a alternativa é uma figura. */
  alternativas: Record<Letra, { texto?: string; imagem?: string }>;
  gabarito: Letra;
  resolucao: string;
  /** Por que cada alternativa errada é errada — o diferencial do gabarito. */
  porQueNao: Partial<Record<Letra, string>>;
  /** A prova pedia o raciocínio escrito (questão com asterisco). */
  raciocinioObrigatorio?: boolean;
  /** A questão já estava no banco, idêntica, vinda de prova antiga. */
  jaEstavaNoBanco?: boolean;
  /** [versão 1, versão 2] — ids de `questions`. */
  gemeas: [string, string];
};

export type ProvaComentada = {
  chave: "fis1" | "fis2";
  materia: string;
  /** Nome exato em `materias`, pra contar o banco e achar os tópicos da P3. */
  materiaBanco: string;
  titulo: string;
  versao: string;
  data: string;
  duracao: string;
  questoes: QuestaoComentada[];
  /** Tópicos da ementa que vêm depois da P2 (nomes exatos em `topicos`). */
  topicosP3: string[];
};

const t = String.raw;

// ─────────────────────────────────────────────────────────────── FÍSICA I

const FISICA_1: ProvaComentada = {
  chave: "fis1",
  materia: "Física I",
  materiaBanco: "Física I",
  titulo: "Física 1 — Prova 2",
  versao: "Versão A",
  data: "17/10/2026",
  duracao: "2 horas",
  topicosP3: ["Rotação de Corpo Rígido", "Gravitação", "Oscilações"],
  questoes: [
    {
      numero: 1,
      assunto: "Primeira e segunda leis de Newton",
      enunciado: t`Um foguete espacial se move no espaço, viajando com motor desligado (velocidade constante) ao longo de uma linha reta horizontal de um ponto A até um ponto B. O motor do foguete é acionado na posição do ponto B e permanece ligado por exatos 2 segundos até o ponto C. No ponto C, o motor é completamente desligado. Assinale a alternativa que descreve corretamente o formato da trajetória do foguete após o ponto B.`,
      figura: `${FIG}/f1-q1-enunciado.png`,
      alternativas: {
        A: { imagem: `${FIG}/f1-q1-a.png` },
        B: { imagem: `${FIG}/f1-q1-b.png` },
        C: { imagem: `${FIG}/f1-q1-c.png` },
        D: { imagem: `${FIG}/f1-q1-d.png` },
        E: { imagem: `${FIG}/f1-q1-e.png` },
      },
      gabarito: "D",
      resolucao: t`Com o motor ligado, o foguete recebe uma força constante perpendicular à velocidade que ele já tinha — é a mesma situação de um lançamento horizontal: a componente horizontal da velocidade continua igual e a outra cresce. A trajetória de B a C é um **arco de parábola**. Em C o motor desliga, a força resultante zera e, pela 1ª lei, o foguete segue em **linha reta** com a velocidade que tinha em C — que é inclinada, porque tem as duas componentes.`,
      porQueNao: {
        A: "Faz uma curva em ângulo reto e depois volta pra horizontal. Nada anula a velocidade horizontal em B, e nada a devolve em C.",
        B: "Perde a velocidade horizontal. Sem força pra trás, ela continua existindo (1ª lei).",
        C: "Durante a queima a trajetória não é reta: uma força constante perpendicular à velocidade curva o caminho. E depois de C não há por que voltar a ficar horizontal.",
        E: "A curva até C está certa, mas depois de desligar não há força nenhuma: a velocidade não muda de direção, então o foguete não 'endireita' pra vertical.",
      },
      gemeas: ["91977770-8162-437b-a9ed-356a4c11669a", "ebe8aaaa-b352-4648-8cbd-f7f14e6e8f49"],
    },
    {
      numero: 2,
      assunto: "Terceira lei de Newton",
      enunciado: t`Um cavalo de 200 kg está amarrado a uma carroça de 400 kg. O fazendeiro dá o sinal para o cavalo puxar a carga para frente. O cavalo, que andou lendo sobre física, recusa-se a se mover e argumenta: *"Por que me esforçar? De acordo com a Terceira Lei de Newton, por mais forte que eu puxe a carroça para frente, a carroça vai exercer uma força de reação igual e oposta, me puxando para trás com a mesma intensidade. Como essas duas forças são iguais e opostas, elas se anulam, a força resultante é zero, e nós nunca sairemos do lugar."* Com base na modelagem rigorosa das Leis de Newton (isolamento de sistemas e diagramas de corpo livre), assinale a alternativa que apresenta a explicação física correta para refutar o argumento do cavalo e explicar como o movimento ocorre:`,
      alternativas: {
        A: { texto: "O cavalo está errado porque as forças de ação e reação só possuem módulos iguais se os corpos tiverem a mesma inércia. Como a carroça é mais massiva (400 kg) que o cavalo (200 kg), as forças trocadas no engate são assimétricas, permitindo que o sistema tenha uma aceleração resultante não nula." },
        B: { texto: "O cavalo está errado ao tentar somar forças que atuam em corpos diferentes. A força que a carroça faz no cavalo puxa apenas o cavalo para trás; a força que o cavalo faz na carroça puxa apenas a carroça para frente. Para a carroça se mover, basta que a força feita pelo cavalo sobre a carroça seja maior que a força de atrito das rodas com o solo." },
        C: { texto: "O cavalo falha em compreender que as Leis de Newton só preveem o cancelamento exato em referenciais inerciais em repouso absoluto. Quando o cavalo faz o primeiro esforço, a força de ação atua uma fração de segundo antes da força de reação da carroça, gerando o desequilíbrio inicial necessário para o movimento." },
        D: { texto: "O argumento do cavalo é logicamente verdadeiro para o engate, mas o movimento ocorre porque a força resultante que move o sistema é puramente interna. O cavalo gera sua própria propulsão muscular, que supera as forças externas de atrito e arrasta a carroça independentemente do que ocorre no cabo de conexão." },
        E: { texto: "O cavalo está correto ao afirmar que a força resultante entre ele e a carroça é zero, mas o movimento ocorre porque ele deve fazer uma força inicial (ação) que seja estritamente maior que a força de reação da carroça, rompendo a Terceira Lei de Newton apenas durante os primeiros instantes da aceleração." },
      },
      gabarito: "B",
      resolucao: t`Ação e reação atuam em **corpos diferentes**, então nunca aparecem no mesmo diagrama de corpo livre e nunca se cancelam. Isolando a carroça, as forças horizontais são o puxão do cavalo (pra frente) e o atrito das rodas (pra trás): se o puxão vence, ela acelera. Isolando o cavalo, ele é puxado pra trás pela carroça, mas o chão empurra seus cascos pra frente (é a reação ao empurrão que ele dá no chão). É essa força externa do chão que acelera o conjunto.`,
      porQueNao: {
        A: "A 3ª lei vale sempre, com qualquer massa: o par ação-reação tem sempre o mesmo módulo.",
        C: "Ação e reação são simultâneas. Não existe 'fração de segundo' entre elas.",
        D: "Força interna não acelera um sistema. Quem empurra o conjunto cavalo + carroça pra frente é o chão, nos cascos do cavalo — uma força externa.",
        E: "A 3ª lei nunca é 'rompida', nem por um instante.",
      },
      gemeas: ["36c21fba-fbc8-4eda-bd7b-769b4e71078a", "2cf67932-057c-44f5-a3cf-b71b4e161b5b"],
    },
    {
      numero: 3,
      assunto: "Dinâmica — sistemas de blocos",
      enunciado: t`O bloco A ($m_A = 1{,}0$ kg) está suspenso por uma corda ideal 1 e está conectado por uma corda ideal 2 ao bloco B ($m_B = 2{,}0$ kg), que fica suspenso abaixo dele. A corda 1 puxa o conjunto para cima exercendo uma força de tração de módulo $T_1$, fazendo com que ambos os blocos sejam acelerados verticalmente para cima com uma aceleração constante $a$. A corda 2 exerce uma tração de módulo $T_2$ sobre o bloco B.`,
      figura: `${FIG}/f1-q3.png`,
      alternativas: {
        A: { texto: t`$T_1 > T_2$, pois a corda 1 deve acelerar a massa combinada do sistema ($m_A + m_B$), enquanto a corda 2 acelera apenas o bloco B. A diferença entre as trações é $T_1 - T_2 = m_A(g + a)$.` },
        B: { texto: t`$T_1 = T_2$, pois a tração se transmite de forma idêntica por todo o conjunto acoplado, uma vez que as cordas são ideais (sem massa) e os dois blocos se movem com a mesma aceleração $a$.` },
        C: { texto: t`$T_1 < T_2$, pois a corda 1 sustenta apenas o bloco A (1,0 kg), ao passo que a corda 2 precisa sustentar o bloco B (2,0 kg), que é mais massivo.` },
        D: { texto: t`$T_1 > T_2$. A diferença entre as trações é dada por $T_1 - T_2 = m_A g$, pois a aceleração $a$ do sistema é absorvida inteiramente pela corda 1, mantendo a diferença entre os cabos dependente apenas do peso estático do bloco A.` },
        E: { texto: t`$T_2 = m_B g$, pois a corda 2 precisa apenas equilibrar a força peso do bloco B, enquanto a força de tração $T_1$ é a única responsável por fornecer a aceleração $a$ para todo o sistema.` },
      },
      gabarito: "A",
      resolucao: t`Bloco B: $T_2 - m_B g = m_B a \Rightarrow T_2 = m_B(g+a)$. Bloco A: $T_1 - T_2 - m_A g = m_A a \Rightarrow T_1 - T_2 = m_A(g+a)$. Somando, $T_1 = (m_A + m_B)(g+a)$: a corda 1 acelera tudo, a corda 2 só o bloco B.`,
      porQueNao: {
        B: "A tração é a mesma ao longo de UMA corda ideal. Aqui são duas cordas, e a de cima também sustenta o bloco A.",
        C: "Invertida: a corda 1 segura A e B juntos (3 kg); a corda 2, só B.",
        D: t`Esquece a aceleração do bloco A: falta o termo $m_A a$.`,
        E: t`$T_2 = m_B g$ só valeria com $a = 0$. B está acelerando pra cima, então $T_2 > m_B g$.`,
      },
      gemeas: ["c55817b0-0892-4405-8171-b7d8ba4d9bae", "19b4ef79-c2d5-4040-aab8-dafdc107e736"],
    },
    {
      numero: 4,
      assunto: "Movimento circular",
      enunciado: t`Um pai coloca sua filha de 15 kg em um carrinho de 5,0 kg ao qual uma corda de 1,0 m de comprimento foi presa. Ele, então, segura a extremidade livre da corda e faz o carrinho descrever, com velocidade de módulo constante, um círculo, mantendo a corda paralela ao solo. Se a tensão na corda for de 100 N, qual será aproximadamente o valor da velocidade angular (em rad/s)? O atrito de rolamento entre as rodas do carrinho e o solo é desprezível.`,
      alternativas: {
        A: { texto: "1,4 rad/s" },
        B: { texto: "2,2 rad/s" },
        C: { texto: "2,6 rad/s" },
        D: { texto: "4,5 rad/s" },
        E: { texto: "14 rad/s" },
      },
      gabarito: "B",
      resolucao: t`Peso e normal se cancelam; a única força horizontal é a tensão, que faz o papel de resultante centrípeta: $T = m\omega^2 r$, com $m = 15 + 5{,}0 = 20$ kg. Então $\omega = \sqrt{T/(mr)} = \sqrt{100/(20 \cdot 1{,}0)} = \sqrt{5} \approx 2{,}2$ rad/s.`,
      porQueNao: {
        A: "Não sai de T = mω²r com nenhuma das massas do problema.",
        C: "É o que dá usando só a massa da filha (15 kg). A corda gira o carrinho com ela dentro: são 20 kg.",
        D: "É o que dá usando só a massa do carrinho (5 kg). A filha também está fazendo a curva.",
        E: "Não sai de T = mω²r com nenhuma das massas do problema.",
      },
      raciocinioObrigatorio: true,
      gemeas: ["d76b75e6-8678-41d2-aa62-74047b031543", "796bd644-d8f4-4412-95c4-fb7f8759de61"],
    },
    {
      numero: 5,
      assunto: "Impulso e momento linear",
      enunciado: t`Uma bola de borracha de 40 g cai a partir do repouso de uma altura de 1,8 m, ricocheteia no piso horizontal e sobe até atingir exatamente a sua altura inicial. O módulo e a orientação do impulso exercido sobre a bola durante a colisão são, respectivamente:`,
      alternativas: {
        A: { texto: "0,00 N·s, vertical e para cima." },
        B: { texto: "0,24 N·s, vertical e para baixo." },
        C: { texto: "0,24 N·s, vertical e para cima." },
        D: { texto: "0,48 N·s, vertical e para baixo." },
        E: { texto: "0,48 N·s, vertical e para cima." },
      },
      gabarito: "E",
      resolucao: t`A bola chega ao piso com $v = \sqrt{2gh} = \sqrt{2 \cdot 9{,}8 \cdot 1{,}8} \approx 5{,}9$ m/s pra baixo e sai com 5,9 m/s pra cima (volta à mesma altura). Com o eixo pra cima: $J = \Delta p = m(v_f - v_i) = 0{,}040\,[5{,}9 - (-5{,}9)] \approx 0{,}48$ N·s, **pra cima** — o piso empurra a bola pra cima.`,
      porQueNao: {
        A: "A velocidade tem o mesmo módulo, mas o sentido inverte: Δp não é zero, é o dobro de mv.",
        B: "Conta só metade (parar a bola, sem o rebote) e ainda com o sentido trocado.",
        C: "Conta só a metade do impulso: o que para a bola. Falta o que a lança de volta pra cima.",
        D: "O módulo está certo, mas o impulso tem o sentido de Δp — pra cima, que é pra onde o piso empurra.",
      },
      gemeas: ["48f8b9c3-22f5-4566-b213-8bb4289e9104", "50123e27-ceb3-4ee0-bb6f-876430f805b4"],
    },
    {
      numero: 6,
      assunto: "Colisões",
      enunciado: t`Os objetos A e C são feitos de materiais diferentes, com elasticidades diferentes, mas possuem a mesma massa e encontram-se inicialmente em repouso. Quando a bola B tem uma certa rapidez $v_B$ e colide com o objeto A, ela atinge o repouso e o objeto A adquire a rapidez $v_A$. Quando a bola B é arremessada com grande rapidez $v > v_B$ e colide com o objeto C, ela ricocheteia para a esquerda com rapidez $v_{Bf}$ e o objeto C adquire rapidez $v_C$. Assumindo a conservação de momento linear, podemos afirmar que:`,
      figura: `${FIG}/f1-q6.png`,
      alternativas: {
        A: { texto: t`necessariamente $v_A = v_C$.` },
        B: { texto: t`necessariamente $v_A = 2v_C$.` },
        C: { texto: t`$v_A < v_C$.` },
        D: { texto: t`$v_A > v_C$.` },
        E: { texto: "Como os materiais de A e C são diferentes, não se pode afirmar nada." },
      },
      gabarito: "C",
      resolucao: t`Primeira colisão: $m_B v_B = m_A v_A$. Segunda (B volta pra esquerda): $m_B v = m_C v_C - m_B v_{Bf} \Rightarrow m_C v_C = m_B(v + v_{Bf})$. Como $m_A = m_C$, $v > v_B$ e $v_{Bf} > 0$, o lado direito da segunda é maior: $v_C > v_A$. Quanto mais B ricocheteia, mais momento ela entrega ao alvo.`,
      porQueNao: {
        A: "Só seria igual se B chegasse com a mesma velocidade e parasse nos dois casos. Ela chega mais rápida E ainda volta.",
        B: "Não há nada no problema que produza um fator 2.",
        D: "Invertida: a bola que ricocheteia transfere MAIS momento, não menos.",
        E: "A conservação do momento vale com qualquer material. O material só decide quanta energia se perde — e a conta acima nem precisa disso.",
      },
      gemeas: ["80cd0127-c484-4110-8b53-832c60cbde4c", "0142a4e3-2bb6-4f1e-8258-8c1648f48cc2"],
    },
    {
      numero: 7,
      assunto: "Impulso e terceira lei",
      enunciado: t`Suponha que uma bola de borracha colida frontalmente com uma bola de aço de mesma massa, a qual se desloca em sentido oposto com a mesma rapidez (mesmo módulo de velocidade). Com base nos princípios da dinâmica e no teorema do Impulso, assinale a alternativa correta quanto ao módulo do impulso recebido por cada bola durante a colisão.`,
      alternativas: {
        A: { texto: "A bola de borracha recebe um impulso maior, pois, por ser mais deformável, permanece em contato por um intervalo de tempo mais longo." },
        B: { texto: "A bola de aço recebe um impulso maior, pois sua maior rigidez faz com que ela exerça e receba uma força média de maior intensidade." },
        C: { texto: "Ambas as bolas recebem impulsos de mesmo módulo, pois, pela Terceira Lei de Newton, a força de interação entre elas tem o mesmo módulo a cada instante da colisão." },
        D: { texto: "A bola de borracha recebe um impulso maior, pois ela absorve a energia cinética do sistema e ricocheteia com maior velocidade que a bola de aço." },
        E: { texto: "A bola de aço recebe um impulso maior, pois a rigidez do aço impede que ela se deforme, transferindo todo o momento linear para a borracha." },
      },
      gabarito: "C",
      resolucao: t`A cada instante do contato, a força que uma bola faz na outra tem o mesmo módulo (3ª lei), e o tempo de contato é o mesmo pras duas — é o mesmo contato. Logo $\int F\,dt$ tem o mesmo módulo: impulsos iguais e opostos. É exatamente por isso que o momento total do sistema se conserva.`,
      porQueNao: {
        A: "O contato dura o mesmo tempo pras duas: uma não pode tocar a outra por mais tempo do que é tocada.",
        B: "Rigidez não muda a 3ª lei: a força que o aço faz na borracha tem o mesmo módulo da que a borracha faz no aço.",
        D: "Mistura impulso com energia. Quanto de energia se perde não altera a igualdade dos impulsos.",
        E: "Nenhum material 'transfere todo o momento'. Os impulsos são iguais e opostos, qualquer que seja o material.",
      },
      gemeas: ["f71a95b8-7dc9-4ee4-9da7-a42ff99f2e24", "35d915b4-bdc8-4c3e-87c8-19c7a0b3eb11"],
    },
    {
      numero: 8,
      assunto: "Energia — gráfico de energia potencial",
      enunciado: t`Uma partícula, cuja energia potencial está mostrada no gráfico ao lado, está se movendo para a direita. Ela possui 2 J de energia cinética no ponto x = 1 m. Onde se encontra o ponto de retorno da partícula?`,
      figura: `${FIG}/f1-q8.png`,
      alternativas: {
        A: { texto: "x = 4 m." },
        B: { texto: "x = 5 m." },
        C: { texto: "x = 6 m." },
        D: { texto: "x = 7 m." },
        E: { texto: "x = 8 m." },
      },
      gabarito: "D",
      resolucao: t`Em $x = 1$ m o gráfico dá $U = 3$ J, então a energia mecânica é $E = K + U = 2 + 3 = 5$ J. Indo pra direita, $U$ cai a 0 em $x = 2$ m e depois sobe 1 J por metro. O ponto de retorno é onde toda a energia virou potencial ($K = 0$): $U = 5$ J em $x = 7$ m.`,
      porQueNao: {
        A: "Lá U = 2 J: é o que dá tomando E = 2 J, só a energia cinética, e esquecendo os 3 J de potencial em x = 1 m.",
        B: "Lá U = 3 J: é o que dá tomando E = 3 J, só a potencial, e esquecendo os 2 J de cinética.",
        C: "Lá U = 4 J < E: a partícula ainda tem 1 J de energia cinética e continua andando.",
        E: "Lá U = 6 J > E = 5 J: a partícula nem chega a esse ponto.",
      },
      gemeas: ["5d426b27-e42c-43d3-aaba-d05342b0c9aa", "6d458cc8-b6f6-42d5-a11f-ff7e9ab92fa1"],
    },
    {
      numero: 9,
      assunto: "Teorema trabalho-energia",
      enunciado: t`Um carrinho de plástico de 0,2 kg e outro, feito de chumbo de 20 kg, deslocam-se sem atrito sobre uma superfície horizontal. Forças iguais são empregadas para empurrar os dois por uma distância de 1 m, partindo do repouso. Depois de se deslocarem esse 1 m, a energia cinética do carrinho de plástico é maior, menor ou igual à energia cinética do carrinho de chumbo?`,
      alternativas: {
        A: { texto: "Maior. Como a massa do carrinho de plástico é menor, ele adquire uma velocidade muito maior, resultando em uma maior energia cinética final." },
        B: { texto: "Menor. A força atua por um intervalo de tempo mais curto no carrinho de plástico (pois ele acelera mais rápido), transferindo menos energia a ele." },
        C: { texto: "Menor. O carrinho de chumbo possui uma massa muito maior e, portanto, adquire maior energia cinética em virtude de sua maior inércia e quantidade de movimento." },
        D: { texto: "Maior. O carrinho de plástico oferece menos resistência à força aplicada devido à sua baixa inércia, o que maximiza a transferência de energia cinética." },
        E: { texto: "Igual. O trabalho realizado sobre ambos os carrinhos é o mesmo (força igual ao longo da mesma distância), logo, a energia cinética final é a mesma." },
      },
      gabarito: "E",
      resolucao: t`Teorema trabalho-energia: $\Delta K = W = F\,d$. Mesma força, mesma distância, partindo do repouso: mesma energia cinética final. O que muda é o **momento**: o carrinho de chumbo leva mais tempo pra percorrer o metro e sai com mais momento linear ($\Delta p = F\,\Delta t$).`,
      porQueNao: {
        A: "A velocidade é mesmo maior, mas K = ½mv²: a massa 100 vezes menor compensa exatamente.",
        B: "Tempo menor significa menos MOMENTO, não menos energia. Energia depende da distância; momento, do tempo.",
        C: "Confunde energia cinética com quantidade de movimento. O chumbo sai com mais momento, não com mais energia.",
        D: "'Menos resistência à força' não muda o trabalho: W = F·d é o mesmo nos dois.",
      },
      gemeas: ["da2a3f81-4ac6-4aef-b48e-572d5aed06af", "5568b41f-782b-4ef2-a96d-2b68a440a4a1"],
    },
    {
      numero: 10,
      assunto: "Lei de Hooke",
      enunciado: t`Uma mola tem 10 cm de comprimento quando não é esticada. Ela exerce uma força restauradora F quando esticada para 11 cm. Qual é o comprimento dessa mola se a força restauradora valer 3F?`,
      alternativas: {
        A: { texto: "3 cm" },
        B: { texto: "13 cm" },
        C: { texto: "14 cm" },
        D: { texto: "30 cm" },
        E: { texto: "33 cm" },
      },
      gabarito: "B",
      resolucao: t`A força é proporcional ao **alongamento**, não ao comprimento: $F = k\,\Delta x$. Força $F$ ↔ 1 cm de alongamento, então $3F$ ↔ 3 cm. Comprimento: $10 + 3 = 13$ cm.`,
      porQueNao: {
        A: "3 cm é o alongamento. A pergunta é o comprimento da mola.",
        C: "Sobra 1 cm: somou o alongamento triplicado ao comprimento de 11 cm, que já estava esticado.",
        D: "Multiplicou o comprimento natural por 3. Quem é proporcional à força é o alongamento.",
        E: "Multiplicou o comprimento de 11 cm por 3. Quem é proporcional à força é o alongamento.",
      },
      gemeas: ["5d45cba8-1618-40ab-b8b1-7910bd382bb5", "2f07e199-05f7-4ae2-8966-b6038ed5e24e"],
    },
    {
      numero: 11,
      assunto: "Conservação de energia",
      enunciado: t`As alternativas de respostas abaixo propõem descrições de transformações sofridas por diferentes sistemas isolados. Qual das alternativas apresenta uma combinação de variações de energia que é estritamente consistente com os princípios do modelo básico de energia?`,
      alternativas: {
        A: { texto: "O sistema perde 1.000 J de energia potencial, ganha 800 J de energia cinética e sua energia térmica aumenta em 200 J." },
        B: { texto: "O sistema perde 400 J de energia potencial, perde 200 J de energia cinética e sua energia térmica aumenta em 200 J." },
        C: { texto: "O sistema ganha 1.200 J de energia cinética, perde 800 J de energia potencial e sua energia térmica aumenta em 400 J." },
        D: { texto: "O sistema perde 500 J de energia potencial, ganha 500 J de energia cinética e sua energia térmica aumenta em 100 J." },
        E: { texto: "O sistema ganha 600 J de energia cinética, ganha 200 J de energia potencial e sua energia térmica diminui em 800 J." },
      },
      gabarito: "A",
      resolucao: t`Num sistema isolado, $\Delta K + \Delta U + \Delta E_{\text{term}} = 0$, e a energia térmica não pode diminuir sozinha — não se transforma de volta em energia mecânica. Em A: $-1000 + 800 + 200 = 0$, com a térmica aumentando. Só ela fecha as duas condições.`,
      porQueNao: {
        B: "−400 − 200 + 200 = −400 J: some energia de um sistema isolado.",
        C: "+1200 − 800 + 400 = +800 J: aparece energia do nada.",
        D: "−500 + 500 + 100 = +100 J: aparecem 100 J do nada.",
        E: "A soma até dá zero, mas exige a energia térmica DIMINUIR virando energia mecânica, o que o modelo não permite: atrito aquece, não 'desaquece' pra acelerar.",
      },
      gemeas: ["25f6ccdf-0ed2-491a-b034-201f91113d06", "c5a26287-310a-46b9-9c8a-56328c4fe46c"],
    },
    {
      numero: 12,
      assunto: "Energia potencial elástica",
      enunciado: t`A mola da Figura (a) é comprimida em $\Delta x$. Ela lança o bloco com rapidez $v_0$ ao longo de uma superfície livre de atrito. Cada mola da Figura (b) é idêntica à mola da Figura (a). Elas estão comprimidas no mesmo valor $\Delta x$ e são usadas para lançar o mesmo bloco. Qual será, agora, a rapidez de lançamento do bloco?`,
      figura: `${FIG}/f1-q12.png`,
      alternativas: {
        A: { texto: t`$v_0$` },
        B: { texto: t`$\sqrt{2}\,v_0$` },
        C: { texto: t`$2v_0$` },
        D: { texto: t`$v_0/\sqrt{2}$` },
        E: { texto: t`$4v_0$` },
      },
      gabarito: "B",
      resolucao: t`As duas molas lado a lado (em paralelo) guardam o dobro da energia: $2 \cdot \tfrac{1}{2}k\Delta x^2$. Toda ela vira energia cinética: $\tfrac{1}{2}mv^2 = 2 \cdot \tfrac{1}{2}mv_0^2 \Rightarrow v = \sqrt{2}\,v_0$.`,
      porQueNao: {
        A: "Ignora a segunda mola: a energia guardada dobrou.",
        C: "A energia dobra, mas a velocidade cresce com a RAIZ da energia (K = ½mv²).",
        D: "Seria o caso de molas em série (k menor). Aqui elas estão lado a lado, em paralelo.",
        E: "Quadruplicar a velocidade exigiria 16 vezes a energia.",
      },
      gemeas: ["508175b5-fdd0-440d-a934-8a2d7efca7bd", "603dce71-2723-40c7-99ff-b8bbdf2cfa56"],
    },
    {
      numero: 13,
      assunto: "Trabalho",
      enunciado: t`Um bloco pesado é elevado a uma altura $h$ acima de sua posição inicial, mantendo velocidade constante, por meio de uma corda. O processo é realizado de duas formas distintas: (a) erguendo-se o bloco diretamente na vertical até a altura $h$; (b) puxando-se o bloco ao longo de um plano inclinado de 25° e sem atrito, até atingir a mesma altura $h$. Comparando o trabalho realizado pela força exercida pela corda sobre o bloco no caso (a) ($W_a$) e no caso (b) ($W_b$), assinale a alternativa correta:`,
      alternativas: {
        A: { texto: t`$W_a = W_b$, pois o trabalho exercido pela força da corda equivale à variação de energia potencial gravitacional $\Delta U_g = mgh$.` },
        B: { texto: t`$W_a > W_b$, pois a força necessária para puxar o bloco verticalmente tem maior intensidade do que a força exercida ao longo do plano inclinado.` },
        C: { texto: t`$W_a < W_b$, pois a distância percorrida pelo bloco ao longo da rampa é maior do que o deslocamento vertical.` },
        D: { texto: t`$W_a > W_b$, pois parte da energia aplicada no caso (b) é absorvida pela realização de trabalho da força normal.` },
        E: { texto: t`$W_a < W_b$, pois a componente da força paralela ao plano inclinado realiza trabalho adicional para compensar o ângulo de 25°.` },
      },
      gabarito: "A",
      resolucao: t`Velocidade constante: $\Delta K = 0$, então a soma dos trabalhos é zero. A normal é perpendicular ao deslocamento (trabalho nulo) e o peso faz $-mgh$ nos dois casos. Logo $W_{\text{corda}} = mgh$ nos dois. Na rampa a força é menor ($mg\sin 25°$), mas a distância é maior ($h/\sin 25°$): o produto é o mesmo.`,
      porQueNao: {
        B: "A força na rampa é mesmo menor, mas ela atua por uma distância maior. Os dois efeitos se cancelam exatamente.",
        C: "A distância na rampa é mesmo maior, mas a força é menor na mesma proporção.",
        D: "A normal é perpendicular ao deslocamento: não realiza trabalho nenhum.",
        E: "Não existe 'trabalho adicional para compensar o ângulo': o trabalho total é fixado pela variação de energia, mgh.",
      },
      gemeas: ["54eaef5f-a52a-4ade-abb9-6f47ec4f50f1", "41d57b50-a752-497d-b150-c1bb9b919497"],
    },
    {
      numero: 14,
      assunto: "Dinâmica — blocos e polia com atrito",
      enunciado: t`**Enunciado comum às questões 14 e 15.** Considere o sistema ilustrado na figura. Um bloco de massa $m_1 = 3{,}0$ kg está posicionado sobre uma superfície rugosa. O coeficiente de atrito cinético entre o bloco $m_1$ e a mesa é $\mu_c = 0{,}15$. O bloco está conectado ao bloco de massa $m_2 = 2{,}0$ kg por uma corda ideal que passa por uma polia. As massas da corda e da polia são desprezíveis. O sistema é abandonado a partir do repouso. **Questão 14.** Assinale a alternativa que compara corretamente a tensão com as demais forças no sistema.`,
      figura: `${FIG}/f1-q14.png`,
      alternativas: {
        A: { texto: t`A tensão no fio é exatamente igual ao peso do bloco suspenso ($T = m_2 g$), pois a função do fio é transferir esse peso integralmente para o bloco da mesa.` },
        B: { texto: t`A tensão no fio é igual à força de atrito cinético ($T = f_c$), pois o fio precisa aplicar apenas a força necessária para equilibrar a resistência ao deslizamento do bloco sobre a mesa.` },
        C: { texto: t`A tensão no fio é exatamente igual à diferença entre o peso do bloco suspenso e a força de atrito ($T = m_2 g - f_c$), pois ela corresponde à força motriz líquida que puxa o sistema como um todo.` },
        D: { texto: t`A tensão no fio é maior do que a força de atrito, mas menor do que o peso do bloco suspenso ($f_c < T < m_2 g$), garantindo que exista uma força resultante a favor do ganho de velocidade em cada um dos blocos.` },
        E: { texto: t`A tensão no fio é igual à soma do peso do bloco suspenso com a força de atrito ($T = m_2 g + f_c$), pois o fio deve suportar simultaneamente a gravidade de um lado e a rugosidade da mesa do outro.` },
      },
      gabarito: "D",
      resolucao: t`Os dois blocos aceleram. O bloco pendurado desce acelerando, então o peso vence a tensão: $m_2 g > T$. O bloco da mesa vai pra direita acelerando, então a tensão vence o atrito: $T > f_c$. Daí $f_c < T < m_2 g$.`,
      porQueNao: {
        A: t`$T = m_2 g$ só se o bloco pendurado estivesse parado ou em velocidade constante. Ele acelera pra baixo.`,
        B: t`$T = f_c$ só se o bloco da mesa andasse em velocidade constante. Ele acelera.`,
        C: t`$m_2 g - f_c$ é a força que acelera o SISTEMA inteiro, não a tensão no fio.`,
        E: t`Uma tensão maior que o peso puxaria o bloco pendurado pra cima.`,
      },
      gemeas: ["ca9bda11-d9fe-4434-90ab-a534c76e9a07", "3341574f-cb8b-4f5a-b508-fcb0f5323ab2"],
    },
    {
      numero: 15,
      assunto: "Dinâmica — blocos e polia com atrito",
      enunciado: t`(Mesmo sistema da questão 14.) Qual é a aceleração do sistema imediatamente antes do bloco de 2,0 kg de bater no solo?`,
      figura: `${FIG}/f1-q14.png`,
      alternativas: {
        A: { texto: "2,5 m/s²" },
        B: { texto: "3,0 m/s²" },
        C: { texto: "3,3 m/s²" },
        D: { texto: "3,9 m/s²" },
        E: { texto: "4,8 m/s²" },
      },
      gabarito: "B",
      resolucao: t`As forças são constantes até o bloco tocar o solo, então a aceleração "imediatamente antes" é a mesma de todo o trajeto. Tratando os dois blocos como um sistema: $a = \dfrac{m_2 g - \mu_c m_1 g}{m_1 + m_2} = \dfrac{19{,}6 - 4{,}41}{5{,}0} \approx 3{,}0$ m/s².`,
      porQueNao: {
        A: "Calcula o atrito com as duas massas (5 kg). Só o bloco da mesa encosta na mesa: a normal é m₁g.",
        C: "Calcula o atrito com a massa do bloco pendurado. A normal é a do bloco que está na mesa, m₁g.",
        D: "É m₂g/(m₁ + m₂): esquece o atrito.",
        E: "Soma o atrito em vez de subtrair. O atrito freia o sistema.",
      },
      raciocinioObrigatorio: true,
      gemeas: ["69b516e4-6e61-46da-b0f8-24a94a5fa057", "baa64fe8-7852-456a-9034-b0b8b672882b"],
    },
  ],
};

// ─────────────────────────────────────────────────────────────── FÍSICA 2

const FISICA_2: ProvaComentada = {
  chave: "fis2",
  materia: "Física II",
  materiaBanco: "Física II",
  titulo: "Física Teórica 2 — 2ª prova",
  versao: "Versão B",
  data: "17/10/2026",
  duracao: "2 horas",
  topicosP3: ["O Campo Magnético", "Indução Eletromagnética", "Oscilações Eletromagnéticas e CA"],
  questoes: [
    {
      numero: 1,
      assunto: "Corrente, resistência e efeito Joule",
      enunciado: t`Um resistor ôhmico é submetido a uma diferença de potencial $V$ e é percorrido por uma corrente elétrica $I$. Com o tempo, sua temperatura aumenta. Sobre a relação entre a lei de Ohm, a corrente elétrica e o aquecimento do resistor, é correto afirmar:`,
      alternativas: {
        A: { texto: t`A lei de Ohm ($V = RI$) explica diretamente o aquecimento, pois a resistência $R$ converte tensão $V$ em calor.` },
        B: { texto: "O campo elétrico realiza trabalho sobre os portadores de carga; nas colisões com a rede, parte da energia cinética adquirida é transferida para o material, aumentando sua temperatura." },
        C: { texto: "A lei de Ohm afirma que a corrente é inversamente proporcional à resistência. Portanto, quanto maior a resistência, menor a corrente e menor o aquecimento, independentemente da tensão aplicada." },
        D: { texto: "O aquecimento ocorre porque a resistência elétrica \"consome\" parte da carga elétrica que atravessa o resistor, convertendo essa carga em calor." },
        E: { texto: t`A lei de Ohm só é válida enquanto a resistência do resistor permanece constante. Quando há aquecimento, a relação $V = RI$ deixa de valer, pois $R$ passa a depender da temperatura, que aumenta com a corrente.` },
      },
      gabarito: "B",
      resolucao: t`O campo dentro do condutor acelera os portadores de carga; eles colidem com os íons da rede e entregam a energia que ganharam. Essa energia vira agitação térmica — é o efeito Joule, à taxa $P = VI$. A lei de Ohm só diz que $V$ é proporcional a $I$; ela não é o mecanismo do aquecimento.`,
      porQueNao: {
        A: "A lei de Ohm é uma relação entre V e I. Ela não descreve mecanismo nenhum, e tensão não 'vira' calor: quem vira calor é energia.",
        C: "Com V fixo, P = V²/R: mais resistência dá menos potência — mas isso depende da tensão, e o 'independentemente da tensão' derruba a frase.",
        D: "A carga se conserva: a corrente que entra é a mesma que sai. O que se converte em calor é energia, não carga.",
        E: "R pode variar com a temperatura e V = RI continua valendo instante a instante, com o valor de R daquele instante.",
      },
      gemeas: ["b0442b61-cf43-46e8-ab86-e4aa7c99e423", "586f3c90-e23f-4d8f-a908-1d24da20a745"],
    },
    {
      numero: 2,
      assunto: "Potencial elétrico a partir do campo",
      enunciado: t`O campo elétrico em uma região do espaço é dado por $E_x = (3{,}0\,x)$ N/C, $E_y = E_z = 0$, onde $x$ é medido em metros. Os pontos A e B estão sobre o eixo $x$, nas posições $x_A = 3{,}0$ m e $x_B = 5{,}0$ m. Determine a diferença de potencial $V_B - V_A$.`,
      alternativas: {
        A: { texto: "−24 V" },
        B: { texto: "+24 V" },
        C: { texto: "−18 V" },
        D: { texto: "+30 V" },
        E: { texto: "−6 V" },
      },
      gabarito: "A",
      resolucao: t`$V_B - V_A = -\int_{x_A}^{x_B} E_x\,dx = -\int_3^5 3x\,dx = -\tfrac{3}{2}(5^2 - 3^2) = -\tfrac{3}{2}\cdot 16 = -24$ V. O potencial cai no sentido do campo, que aqui aponta pra $+x$.`,
      porQueNao: {
        B: "Esquece o sinal de menos: o potencial DIMINUI quando se anda no sentido do campo.",
        C: "Trata o campo como constante e igual ao valor em x = 3 m (9 N/C × 2 m). O campo cresce com x: tem que integrar.",
        D: "Nem o sinal nem o valor saem da integral.",
        E: "Trata o campo como constante (3 N/C), esquecendo o x.",
      },
      gemeas: ["c03c7c67-45d3-43b2-80b0-28c94d5c7d33", "2e32397f-761a-41bf-9866-e2c425aa6847"],
    },
    {
      numero: 3,
      assunto: "Associação de capacitores",
      enunciado: t`Considere o circuito mostrado na figura, no qual os capacitores possuem capacitâncias $C_1 = 12\ \mu$F, $C_2 = 2\ \mu$F e $C_3 = 4\ \mu$F. Uma diferença de potencial de 12 V é mantida entre os terminais da associação. Qual é a carga elétrica armazenada no capacitor $C_3$?`,
      figura: `${FIG}/f2-q3.png`,
      alternativas: {
        A: { texto: t`16 $\mu$C` },
        B: { texto: t`24 $\mu$C` },
        C: { texto: t`32 $\mu$C` },
        D: { texto: t`48 $\mu$C` },
        E: { texto: t`64 $\mu$C` },
      },
      gabarito: "C",
      resolucao: t`$C_2$ e $C_3$ estão em paralelo: $6\ \mu$F. Em série com $C_1$: $C_{eq} = \dfrac{12 \cdot 6}{12 + 6} = 4\ \mu$F, e a carga total é $Q = 4 \cdot 12 = 48\ \mu$C. Essa carga passa por $C_1$ e chega ao paralelo, que fica com $V = 48/6 = 8$ V. Então $Q_3 = C_3 V = 4 \cdot 8 = 32\ \mu$C.`,
      porQueNao: {
        A: t`É a carga de $C_2$ ($2\ \mu$F × 8 V). A pergunta é sobre $C_3$.`,
        B: "Não sai de nenhuma divisão correta da carga entre os capacitores.",
        D: t`É a carga total (a de $C_1$). No paralelo ela se divide entre $C_2$ e $C_3$.`,
        E: "Seria C₃ com mais de 12 V — impossível: a tensão total é 12 V e parte dela fica em C₁.",
      },
      gemeas: ["858c44fb-1ea7-48d1-b1c1-c79529566f11", "0b0ff312-ec38-4921-8b93-8aa390643ee7"],
    },
    {
      numero: 4,
      assunto: "Potência em associações de resistores",
      enunciado: t`Três resistores iguais estão conectados em paralelo. Quando uma determinada diferença de potencial é aplicada à combinação, a potência total consumida é de 7,0 W. Qual potência seria consumida se os três resistores fossem conectados em série sob a mesma diferença de potencial?`,
      alternativas: {
        A: { texto: "7,0 W" },
        B: { texto: "0,8 W" },
        C: { texto: "4,5 W" },
        D: { texto: "70,0 W" },
        E: { texto: "7,8 W" },
      },
      gabarito: "B",
      resolucao: t`Com a mesma tensão, $P = V^2/R_{eq}$. Em paralelo $R_{eq} = R/3$; em série, $3R$: a resistência equivalente fica **9 vezes maior**, e a potência, 9 vezes menor. $7{,}0/9 \approx 0{,}8$ W.`,
      porQueNao: {
        A: "A resistência equivalente mudou, então a potência muda.",
        C: "Não sai da razão entre as resistências equivalentes, que é 9.",
        D: "Multiplicou em vez de dividir: em série a resistência AUMENTA, e a potência cai.",
        E: "Multiplicou em vez de dividir — em série a potência cai.",
      },
      gemeas: ["05598c35-43a8-4717-8e3c-1387accecc2a", "f629f43e-af5b-4d86-aaaf-7095fd1429e6"],
    },
    {
      numero: 5,
      assunto: "Energia em capacitores",
      enunciado: t`Um capacitor de placas paralelas, com capacitância $C_0 = 4{,}0\ \mu$F, é carregado por uma bateria de fem $\mathcal{E} = 10$ V. A distância entre as placas é então duplicada. Considere duas situações: I) a bateria permanece conectada enquanto a distância é alterada; II) a bateria é desconectada antes da distância ser alterada. Qual é o trabalho realizado pela força externa em cada caso, respectivamente?`,
      alternativas: {
        A: { texto: t`$W_I = 200\ \mu$J e $W_{II} = 400\ \mu$J` },
        B: { texto: t`$W_I = 400\ \mu$J e $W_{II} = 200\ \mu$J` },
        C: { texto: t`$W_I = 100\ \mu$J e $W_{II} = 200\ \mu$J` },
        D: { texto: t`$W_I = 200\ \mu$J e $W_{II} = 100\ \mu$J` },
        E: { texto: t`$W_I = 200\ \mu$J e $W_{II} = 200\ \mu$J` },
      },
      gabarito: "C",
      resolucao: t`Início: $U_0 = \tfrac{1}{2}C_0\mathcal{E}^2 = 200\ \mu$J, $Q_0 = 40\ \mu$C. Dobrar $d$ faz $C = C_0/2$. **II (desligado)**: a carga fica, $U = Q^2/2C$ dobra pra 400 μJ, e todo o aumento veio da força externa: $W_{II} = 200\ \mu$J. **I (ligado)**: a tensão fica, $U = \tfrac{1}{2}CV^2$ cai pra 100 μJ, e a carga cai pra 20 μC — esses 20 μC voltam pela bateria, que recebe $20\ \mu\text{C} \cdot 10\ \text{V} = 200\ \mu$J. Balanço: $W_I = \Delta U + 200 = -100 + 200 = 100\ \mu$J.`,
      porQueNao: {
        A: "400 μJ é a energia FINAL no caso II, não o trabalho (o capacitor já tinha 200 μJ). E no caso I esquece a energia devolvida à bateria.",
        B: "Inverte os dois casos e no I esquece a bateria.",
        D: "Inverte os dois casos.",
        E: "No caso I, ignora que o capacitor PERDE energia e que a bateria recebe parte dela.",
      },
      gemeas: ["c11bf7e0-5fc7-4aaa-8514-c293d9a95611", "d8979bca-bd68-42c2-8fee-62b6f4398b69"],
    },
    {
      numero: 6,
      assunto: "Potencial de distribuições contínuas",
      enunciado: t`A figura mostra um bastão com carga $Q$ uniformemente distribuída em forma de semicírculo de raio $R$. O potencial elétrico no centro será`,
      figura: `${FIG}/f2-q6.png`,
      alternativas: {
        A: { texto: t`$\dfrac{Q}{2\pi\varepsilon_0 R}$` },
        B: { texto: t`$\dfrac{Q}{4\pi\varepsilon_0 R}$` },
        C: { texto: t`$\dfrac{Q}{4\pi\varepsilon_0 R^2}$` },
        D: { texto: t`$\dfrac{2Q}{\pi\varepsilon_0 R}$` },
        E: { texto: t`$\dfrac{Q\pi R}{2\varepsilon_0}$` },
      },
      gabarito: "B",
      resolucao: t`O potencial é **escalar**: cada pedacinho $dq$ contribui com $k\,dq/R$, e todos estão à mesma distância $R$ do centro. Somando, $V = kQ/R = \dfrac{Q}{4\pi\varepsilon_0 R}$. O formato de semicírculo não importa — só a distância. (Pro **campo**, que é vetor, importaria.)`,
      porQueNao: {
        A: "É o dobro do certo. Fatores como esse aparecem no CAMPO do semicírculo, onde as componentes se somam como vetores — o potencial é escalar.",
        C: "R² é do campo de uma carga pontual. Potencial cai com 1/R.",
        D: "Não sai da soma de k·dq/R.",
        E: "Nem tem unidade de potencial.",
      },
      gemeas: ["186d18de-911d-42f1-8272-569e0f27f202", "0d6d04ed-1741-4eb4-aa0d-5a42ea60ab33"],
    },
    {
      numero: 7,
      assunto: "Densidade de corrente e condutividade",
      enunciado: t`Os resistores ôhmicos 1 e 2 (com $R_1 > R_2$) são conectados em série, através de fios ideais, a uma bateria de fem $\mathcal{E}$. Sabe-se que os resistores apresentam geometria cilíndrica com o mesmo comprimento e a mesma área de seção reta: $L_1 = L_2$ e $A_1 = A_2$. Sendo $\sigma_1$ e $\sigma_2$ as condutividades dos materiais, $E_1$ e $E_2$ os campos elétricos no interior dos resistores, $j_1$ e $j_2$ as densidades de corrente nos resistores, é CORRETO afirmar que:`,
      alternativas: {
        A: { texto: t`$j_1 = j_2,\ E_1 = E_2,\ \sigma_1 > \sigma_2$` },
        B: { texto: t`$j_1 > j_2,\ E_1 > E_2,\ \sigma_1 < \sigma_2$` },
        C: { texto: t`$j_1 < j_2,\ E_1 < E_2,\ \sigma_1 = \sigma_2$` },
        D: { texto: t`$j_1 = j_2,\ E_1 = E_2,\ \sigma_1 < \sigma_2$` },
        E: { texto: t`$j_1 = j_2,\ E_1 > E_2,\ \sigma_1 < \sigma_2$` },
      },
      gabarito: "E",
      resolucao: t`Em série a corrente é a mesma, e com áreas iguais $j = I/A$ também é: $j_1 = j_2$. Com a mesma geometria, $R = L/(\sigma A)$, então $R_1 > R_2$ exige $\sigma_1 < \sigma_2$. Por fim $E = j/\sigma$: mesmo $j$ e $\sigma_1$ menor dão $E_1 > E_2$.`,
      porQueNao: {
        A: "σ₁ > σ₂ daria R₁ < R₂ — o contrário do enunciado.",
        B: "Em série a corrente é a mesma; com a mesma área, j também.",
        C: "Com σ e geometria iguais, as resistências seriam iguais.",
        D: "Com o mesmo j e condutividades diferentes, E = j/σ não pode ser igual.",
      },
      jaEstavaNoBanco: true,
      gemeas: ["2c76346a-dd55-45e1-b209-66ebcfb6e325", "3658462e-f0ca-4b17-90e6-59be9a424c31"],
    },
    {
      numero: 8,
      assunto: "Superfícies equipotenciais e trabalho",
      enunciado: t`Na figura, as linhas pontilhadas representam algumas superfícies equipotenciais de uma distribuição de cargas esfericamente simétrica com carga total positiva. Uma partícula de **carga positiva** pode ser deslocada do ponto *a* até alguns possíveis pontos finais *b*, indicados na figura. O deslocamento é feito por meio das trajetórias A, B, C e D indicadas. Sobre o trabalho realizado pela força elétrica que atua sobre a partícula ao longo dessas trajetórias ($W_A$, $W_B$, $W_C$ e $W_D$, respectivamente), é CORRETO afirmar que:`,
      figura: `${FIG}/f2-q8.png`,
      alternativas: {
        A: { texto: t`$W_D < W_A < W_B < W_C$` },
        B: { texto: t`$W_B < W_C < W_D < W_A$` },
        C: { texto: t`$W_C < W_D < W_A < W_B$` },
        D: { texto: t`$W_A < W_B < W_C < W_D$` },
        E: { texto: t`$W_A < W_D < W_C < W_B$` },
      },
      gabarito: "D",
      resolucao: t`A força elétrica é conservativa: o trabalho só depende do começo e do fim, $W = q(V_a - V_b)$. Todas partem do mesmo $a$, então quanto **menor** o potencial no ponto final, **maior** o trabalho. Os pontos finais estão, em ordem de potencial decrescente: A (perto dos 30 V), B (7,5 V), C (entre 5 V e 4,3 V) e D (3,3 V). Logo $W_A < W_B < W_C < W_D$. As voltas das trajetórias são distração.`,
      porQueNao: {
        A: "Ordena pelo tamanho ou pelo desenho do caminho. Com força conservativa, só os pontos final e inicial contam.",
        B: "Ordena pelo tamanho ou pelo desenho do caminho. Com força conservativa, só os pontos final e inicial contam.",
        C: "Ordena pelo tamanho ou pelo desenho do caminho. Com força conservativa, só os pontos final e inicial contam.",
        E: "Ordena pelo tamanho ou pelo desenho do caminho. Com força conservativa, só os pontos final e inicial contam.",
      },
      jaEstavaNoBanco: true,
      gemeas: ["162bc374-13f3-4514-b907-403b6fe0f4a2", "c2ee60a7-4ab8-4dce-8ac1-53c557c66321"],
    },
    {
      numero: 9,
      assunto: "Circuito RC — descarga",
      enunciado: t`Um capacitor de 10 µF, inicialmente carregado com carga $Q$, é descarregado por um resistor de 1 kΩ. Quanto tempo leva para reduzir a carga do capacitor pela metade?`,
      alternativas: {
        A: { texto: "7 ms" },
        B: { texto: "70 ms" },
        C: { texto: "700 ms" },
        D: { texto: "0,7 ms" },
        E: { texto: "0,07 ms" },
      },
      gabarito: "A",
      resolucao: t`$Q(t) = Q_0 e^{-t/\tau}$ com $\tau = RC = 10^3 \cdot 10 \times 10^{-6} = 10$ ms. Pra $Q = Q_0/2$: $t = \tau \ln 2 \approx 10 \cdot 0{,}69 \approx 7$ ms.`,
      porQueNao: {
        B: "O ln 2 está certo, mas τ = RC = 10 ms, não 100 ms: erro de potência de 10 no μ ou no k.",
        C: "Erro de potência de 10 em τ = RC = 10 ms.",
        D: "Erro de potência de 10 em τ = RC = 10 ms.",
        E: "Erro de potência de 10 em τ = RC = 10 ms.",
      },
      gemeas: ["f66a64b3-3c87-4f7d-84dd-2b5903124fb2", "03f96014-3595-48b7-94f8-91c661f074e8"],
    },
    {
      numero: 10,
      assunto: "Circuitos — energia dissipada",
      enunciado: t`Qual é a quantidade de energia térmica dissipada no resistor de 10 Ω durante 5 s, quando $\mathcal{E} = 18$ V?`,
      figura: `${FIG}/f2-q10.png`,
      alternativas: {
        A: { texto: "72 J" },
        B: { texto: "32 J" },
        C: { texto: "50 J" },
        D: { texto: "18 J" },
        E: { texto: "90 J" },
      },
      gabarito: "D",
      resolucao: t`15 Ω ∥ 10 Ω $= 6\ \Omega$; com os 12 Ω em série, $R_{eq} = 18\ \Omega$ e $I = 18/18 = 1$ A. A tensão no paralelo é $1 \cdot 6 = 6$ V, então o resistor de 10 Ω dissipa $P = 6^2/10 = 3{,}6$ W. Em 5 s: $3{,}6 \cdot 5 = 18$ J.`,
      porQueNao: {
        A: "Não sai da tensão de 6 V no paralelo.",
        B: "Não sai da tensão de 6 V no paralelo.",
        C: "Não sai da tensão de 6 V no paralelo.",
        E: "É a energia que a BATERIA entrega em 5 s (18 V × 1 A × 5 s), dividida entre os três resistores.",
      },
      gemeas: ["7f463ccf-90bf-49e4-bb1d-11e4909b17b1", "826c5a5c-db20-4998-bbee-8a17cfbabe87"],
    },
    {
      numero: 11,
      assunto: "Corrente elétrica",
      enunciado: t`Uma fita plástica isolante de largura $L$ possui densidade superficial de carga positiva e uniforme $\sigma$ e move-se com velocidade constante $v$, conforme a figura. Desprezando-se os efeitos de borda, qual é a intensidade da corrente elétrica transportada pela fita?`,
      figura: `${FIG}/f2-q11.png`,
      alternativas: {
        A: { texto: t`$I = v/(\sigma L)$` },
        B: { texto: t`$I = \sigma L/v$` },
        C: { texto: t`$I = \sigma L v$` },
        D: { texto: t`$I = \sigma/(Lv)$` },
        E: { texto: t`$I = Lv/\sigma$` },
      },
      gabarito: "C",
      resolucao: t`Em um intervalo $\Delta t$ passa pela seção transversal um pedaço de fita de comprimento $v\Delta t$, com área $L\,v\Delta t$ e carga $\Delta q = \sigma L v\,\Delta t$. Então $I = \Delta q/\Delta t = \sigma L v$. (Confere: C/m² × m × m/s = C/s.)`,
      porQueNao: {
        A: "A unidade não dá ampère.",
        B: "A unidade não dá ampère: mais rápido teria que dar MAIS corrente, não menos.",
        D: "A unidade não dá ampère.",
        E: "A unidade não dá ampère.",
      },
      gemeas: ["cfc9e16a-5806-46c3-9aec-66235c25027d", "67f30377-b768-4460-8f8b-1e76dbe24440"],
    },
    {
      numero: 12,
      assunto: "Bateria real — resistência interna",
      enunciado: t`O gráfico mostra os dados da diferença de potencial nos terminais de uma bateria real em função da corrente. A partir da reta ajustada aos dados, qual a resistência interna da bateria?`,
      figura: `${FIG}/f2-q12.png`,
      alternativas: {
        A: { texto: "0,4 Ω" },
        B: { texto: "0,4 mΩ" },
        C: { texto: "2,5 Ω" },
        D: { texto: "2,5 mΩ" },
        E: { texto: "4 Ω" },
      },
      gabarito: "A",
      resolucao: t`Bateria real: $\Delta V = \mathcal{E} - rI$. A resistência interna é o módulo da inclinação: $r = \dfrac{8\ \text{mV}}{20\ \text{mA}} = 0{,}4\ \Omega$. Repare que mV/mA = V/A: os "mili" se cancelam.`,
      porQueNao: {
        B: "Os 'mili' se cancelam: mV/mA = V/A = Ω.",
        C: "É o inverso da inclinação (I/V).",
        D: "É o inverso da inclinação (I/V), e com o 'mili' a mais.",
        E: "Erro de um fator 10 na inclinação.",
      },
      gemeas: ["72fc4045-47fa-4c68-bdea-3c6476a30f19", "36b2444d-17e3-44af-aa10-1e2a442822d1"],
    },
    {
      numero: 13,
      assunto: "Campo elétrico a partir do potencial",
      enunciado: t`O potencial elétrico em uma região entre $x = 0$ e $x = 6$ m é dado por $V(x) = a + bx$, onde $a = 10$ V e $b = 7$ V/m. Considerando o eixo $x$ orientado da esquerda para a direita, qual é a direção e o sentido do campo elétrico em $x = 6$ m?`,
      alternativas: {
        A: { texto: t`Direção $x$, sentido positivo do eixo $x$.` },
        B: { texto: t`Direção $x$, sentido negativo do eixo $x$.` },
        C: { texto: t`Direção $y$, sentido positivo do eixo $y$.` },
        D: { texto: t`Direção $y$, sentido negativo do eixo $y$.` },
        E: { texto: "O campo elétrico é nulo nesse ponto." },
      },
      gabarito: "B",
      resolucao: t`$E_x = -\dfrac{dV}{dx} = -b = -7$ V/m, em qualquer ponto da região (inclusive $x = 6$ m). O campo aponta pra onde o potencial **diminui**: como $V$ cresce pra direita, o campo aponta pra esquerda.`,
      porQueNao: {
        A: "Esquece o sinal de menos em E = −dV/dx: o campo aponta pra onde V diminui.",
        C: "V só depende de x, então E não tem componente em y.",
        D: "V só depende de x, então E não tem componente em y.",
        E: "O que importa é a inclinação de V, não o seu valor. A inclinação é 7 V/m em toda a região.",
      },
      gemeas: ["aabfd72a-c41a-425c-8f05-c873f6eb6eae", "238f0ea1-8840-4f5f-9451-331adbd3ae50"],
    },
    {
      numero: 14,
      assunto: "Capacitores com dielétrico",
      enunciado: t`Um capacitor de placas paralelas, inicialmente no vácuo, possui capacitância de 20 pF e é carregado até atingir uma diferença de potencial de 40 V. Em seguida, a bateria é desconectada, isolando eletricamente o capacitor, e um pedaço de Teflon (de constante dielétrica 2,1) é então inserido preenchendo completamente o espaço entre as placas. Qual é a razão $U_f/U_i$ entre a energia final e a energia inicial armazenada no capacitor?`,
      alternativas: {
        A: { texto: "0,48" },
        B: { texto: "2,10" },
        C: { texto: "1,00" },
        D: { texto: "0,69" },
        E: { texto: "4,41" },
      },
      gabarito: "A",
      resolucao: t`Desconectado, a **carga** fica constante. O dielétrico multiplica a capacitância por $\kappa$, e $U = Q^2/2C$, então $U_f/U_i = 1/\kappa = 1/2{,}1 \approx 0{,}48$. Os 20 pF e os 40 V não são necessários.`,
      porQueNao: {
        B: "Seria com a bateria ligada (tensão constante, U = ½CV²). Aqui ela foi desconectada: o que fica constante é a carga.",
        C: "A energia muda: o dielétrico é puxado pra dentro do capacitor, e o campo realiza trabalho sobre ele.",
        D: "É 1/√2,1: a energia não depende da raiz de κ.",
        E: "É κ²: nada no problema eleva κ ao quadrado.",
      },
      gemeas: ["11c70d07-ce96-4af0-ade3-bff7804b6db4", "46f5e6ac-32bd-42df-acd8-a5ee13dfc563"],
    },
    {
      numero: 15,
      assunto: "Leis de Kirchhoff",
      enunciado: t`As leis de Kirchhoff são importantes na análise de circuitos elétricos. No entanto, essas leis são consequências diretas de princípios mais fundamentais. Assinale a alternativa que descreve corretamente o princípio físico fundamental que dá origem à lei dos nós e à lei das malhas, respectivamente.`,
      alternativas: {
        A: { texto: "A lei dos nós origina-se da conservação da energia; a lei das malhas origina-se da conservação da carga." },
        B: { texto: "A lei dos nós origina-se da conservação da carga; a lei das malhas origina-se da conservação da energia." },
        C: { texto: "Ambas as leis originam-se da conservação da energia." },
        D: { texto: "Ambas as leis originam-se da conservação da carga." },
        E: { texto: "Ambas as leis originam-se da lei de Ohm." },
      },
      gabarito: "B",
      resolucao: t`**Nós**: a carga não se acumula num nó nem some, então o que entra sai — conservação da carga. **Malhas**: uma carga que dá a volta numa malha e volta ao ponto de partida tem a mesma energia potencial do início, então a soma das variações de potencial é zero — conservação da energia.`,
      porQueNao: {
        A: "Inverte as duas.",
        C: "A lei dos nós é sobre corrente (carga por tempo), não energia.",
        D: "A lei das malhas é sobre potencial (energia por carga), não carga.",
        E: "A lei de Ohm é uma propriedade de certos materiais. Kirchhoff vale com qualquer componente, ôhmico ou não.",
      },
      gemeas: ["b480ac69-304c-4edc-978f-a5f59760e7f2", "9a26542a-209d-4a38-b476-de795f4a84fc"],
    },
  ],
};

export const PROVAS_P2_2026_2: ProvaComentada[] = [FISICA_1, FISICA_2];

/** O que o botão "Treinar" pode pedir. As versões vêm da prova; "p3" sorteia
 *  dos tópicos que vêm depois da P2 na ementa. */
export type ChaveTreino = `${ProvaComentada["chave"]}-${"v1" | "v2" | "p3"}`;

export function lerChaveTreino(bruta: string): {
  prova: ProvaComentada;
  tipo: "v1" | "v2" | "p3";
} | null {
  const m = /^(fis1|fis2)-(v1|v2|p3)$/.exec(bruta);
  if (!m) return null;
  const prova = PROVAS_P2_2026_2.find((p) => p.chave === m[1]);
  if (!prova) return null;
  return { prova, tipo: m[2] as "v1" | "v2" | "p3" };
}

export function hrefTreino(chave: ChaveTreino): string {
  return `${ROTA_P2_2026_2}/treinar/${chave}`;
}
