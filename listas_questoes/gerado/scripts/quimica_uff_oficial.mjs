// Transcrição fiel das provas de Química Inorgânica da UFF (compilado
// `Questoes_Quimica_Inorganica_UFF_v3.pdf`, na raiz do repo) para o JSON do
// importador. Gera `listas_questoes/gerado/quimica_uff_oficial.json`.
//
// REGRA DE OURO (a mesma de AGENTE_PROVA_UFF_FIS2.md): isto é prova real de
// professor — eu TRANSCREVO, não crio e não melhoro. Em particular:
//   - o formato das alternativas é o da prova: Certo/Errado tem DUAS
//     alternativas e os itens "I / II" têm QUATRO. Não completo pra cinco, que
//     seria inventar distrator que o professor não escreveu (validar.mjs
//     aceita menos de 5 quando `instituicao` está preenchida, justamente por
//     causa disto);
//   - `resolucao` é minha, escrita em português claro a partir da explicação
//     do gabarito compilado e conferida por mim.
//
// As 6 questões DISSERTATIVAS do compilado (Q43–Q48) ficam de fora: sem
// alternativas na origem, transcrevê-las exigiria inventar distratores. Os
// conceitos delas estão cobertos na leva autoral `quimica_uff_estilo.mjs`.
//
// ANO/SEMESTRE: o compilado só data uma das provas ("UFF-P2 nov/25" → 2º
// semestre de 2025). As questões que aparecem nela vão com
// `instituicao: "UFF (2º sem.)"` e `ano: 2025`; as demais vão com "UFF" e
// `ano: null` (o montador de simulados trata ano desconhecido como "0" e
// funciona normalmente). Quando as datas das outras provas (P2 UFF-IQ-GQI,
// Departamento, Certo/Errado, Objetiva B) forem conhecidas, é só preencher.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = resolve(aqui, "..", "quimica_uff_oficial.json");

const T1 = "Estrutura Atômica e Tabela Periódica";
const T2 = "Ligações Químicas";
const T3 = "Termodinâmica, Cinética e Equilíbrio";
const T4 = "Funções Inorgânicas e Reações Químicas";

// Os dois formatos de alternativa que a prova usa, literais.
const CE = () => ({ a: "Certo", b: "Errado" });
const AFIRM = () => ({ a: "I, apenas.", b: "II, apenas.", c: "I e II.", d: "Nenhuma das opções." });

// Única prova datada do compilado.
const NOV25 = { inst: "UFF (2º sem.)", ano: 2025 };

const itens = [];
const q = (o) =>
  itens.push({
    materia: "Química Geral",
    topico: o.t,
    subtopico: o.sub,
    dificuldade: o.dif,
    instituicao: o.inst || "UFF",
    ano: o.ano ?? null,
    enunciado: o.e,
    alternativas: o.alt,
    gabarito: o.g,
    resolucao: o.r,
    tikz_code: null,
    imagem_enunciado: false,
    alternativas_com_imagem: [],
  });

// Q1 — P2 UFF-IQ-GQI Q1 | Certo/Errado Q2 | Departamento Q9(II)
q({
  t: T2,
  sub: "Ligação metálica e mudanças de estado",
  dif: "medio",
  e: String.raw`Para um metal, a mudança do estado líquido para gás requer maior quantidade de calor do que a mudança de sólido para líquido, por causa da:`,
  alt: {
    a: "Separação das fracas interações interatômicas.",
    b: "Quebra das ligações metálicas.",
    c: "Separação das fortes interações intermoleculares.",
    d: "Nenhuma das anteriores.",
  },
  g: "b",
  r: String.raw`No metal sólido os cátions estão presos pelo mar de elétrons deslocalizados — a ligação metálica. Fundir apenas afrouxa esse arranjo: os átomos continuam vizinhos e a ligação metálica continua existindo no líquido.

Vaporizar é outra história. Para virar gás, cada átomo precisa se soltar completamente dos demais, o que exige romper de vez a ligação metálica. Por isso a entalpia de vaporização de um metal é muito maior que a de fusão.

As opções que falam em interações intermoleculares não se aplicam: metal não é formado por moléculas.`,
});

// Q2 — P2 UFF-IQ-GQI Q2 | Objetiva B Q12
q({
  t: T3,
  sub: "Corrosão galvânica e série eletroquímica",
  dif: "medio",
  e: String.raw`Por contato físico, qual dos seguintes metais promove maior oxidação do ferro metálico ao ambiente?`,
  alt: { a: "Au", b: "Cu", c: "Ag", d: "Mg", e: "Na" },
  g: "e",
  r: String.raw`Dois metais em contato, num meio úmido, formam uma pilha. Oxida-se o de menor potencial de redução; o outro fica protegido catodicamente.

Au, Cu e Ag têm $E^\circ$ positivo — são mais nobres que o ferro, de modo que em contato com eles quem corrói é o próprio Fe. Já Mg ($E^\circ = -2{,}37$ V) e Na ($E^\circ = -2{,}71$ V) são mais ativos que o Fe ($E^\circ = -0{,}44$ V) e se oxidam no lugar dele — é o princípio do anodo de sacrifício.

Entre os dois, o sódio é o mais reativo da lista e o que mais intensamente força o processo, sendo a resposta esperada pela banca.`,
});

// Q3 — P2 UFF-IQ-GQI Q3 | Objetiva B Q13
q({
  t: T4,
  sub: "Estequiometria de ligas metálicas",
  dif: "medio",
  e: String.raw`Se $100$ g de um fio de Au e Pt com relação $3:1$ (Au:Pt), respectivamente, contém $5{,}0$ g de cobre, $20$ g de Ag e $5{,}00\%$ de impurezas, a massa de platina em grama nessa amostra é:`,
  alt: { a: "$17{,}5$", b: "$52{,}5$", c: "$53{,}0$", d: "$18{,}0$", e: "$18{,}8$" },
  g: "a",
  r: String.raw`Primeiro se descobre quanto sobra de Au + Pt na amostra de $100$ g:

$$m_{\text{impurezas}} = 5{,}00\% \times 100 = 5{,}0\ \text{g}$$

$$m_{\text{Au+Pt}} = 100 - 5{,}0 - 20 - 5{,}0 = 70\ \text{g}$$

Como a relação Au:Pt é $3:1$, esses $70$ g se dividem em $4$ partes iguais, das quais a platina é $1$:

$$m_{\text{Pt}} = \dfrac{70}{4} = 17{,}5\ \text{g}$$`,
});

// Q4 — Certo/Errado Q4 | UFF-P2 nov/25 Q8
q({
  t: T4,
  sub: "Estequiometria de ligas metálicas",
  dif: "medio",
  ...NOV25,
  e: String.raw`Se $100$ g de um fio de Au e Pt com relação $1:3$ (Au:Pt) contém $5{,}0$ g de cobre, $20$ g de Ag e $5{,}00\%$ de impurezas, a massa de ouro em grama nessa amostra é $17{,}5$ g.`,
  alt: CE(),
  g: "a",
  r: String.raw`A massa de Au + Pt é a mesma do caso anterior:

$$m_{\text{Au+Pt}} = 100 - 5{,}0 - 20 - 5{,}0 = 70\ \text{g}$$

Agora a relação é $1:3$, ou seja, o ouro é $1$ das $4$ partes:

$$m_{\text{Au}} = \dfrac{70}{4} = 17{,}5\ \text{g}$$

A afirmativa está correta. O valor numérico coincide com o da questão anterior porque a proporção só foi invertida — atenção a qual metal está na parte menor.`,
});

// Q5 — P2 UFF-IQ-GQI Q4 | Departamento Q10 | UFF-P2 nov/25 Q5(I)
q({
  t: T2,
  sub: "Alotropia do carbono e condutividade",
  dif: "medio",
  ...NOV25,
  e: String.raw`Considere as afirmativas: I — Em relação ao $\text{Na}_2\text{CO}_3$, o $\text{CaCO}_3$ é um eletrólito fraco e, por isso, produz menor condutividade elétrica em água. II — Das variedades alotrópicas do carbono, diamante e grafita, a primeira não pode ser utilizada como condutor elétrico por não apresentar ligações $\pi$ deslocalizadas. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "b",
  r: String.raw`I é falsa no motivo, não no efeito. O $\text{CaCO}_3$ realmente conduz muito pouco em água, mas não por ser eletrólito fraco — ele é praticamente insolúvel. Eletrólito fraco é o que dissolve e se ioniza só parcialmente; aqui quase não há sal dissolvido para ionizar. O $\text{Na}_2\text{CO}_3$, esse sim, é solúvel e bom condutor.

II é verdadeira. No diamante cada carbono é $sp^3$ e usa seus quatro elétrons em ligações $\sigma$: não sobra elétron deslocalizado e o material é isolante. Na grafita o carbono é $sp^2$ e o elétron restante forma o sistema $\pi$ deslocalizado que conduz corrente ao longo das camadas.

Logo, só II está correta.`,
});

// Q6 — P2 UFF-IQ-GQI Q5 | Departamento Q10(II) | Certo/Errado Q1 | UFF-P2 nov/25 Q5(II)
q({
  t: T3,
  sub: "Le Chatelier e decomposição do ozônio",
  dif: "dificil",
  ...NOV25,
  e: String.raw`O contato elétrico de alta tensão realizado de forma inadequada pode acarretar fuga de corrente, com consequente formação de $\text{O}_3$ a partir do $\text{O}_2$, além de aquecimento local. Considere o equilíbrio $2\text{O}_3(g) \rightleftharpoons 3\text{O}_2(g)$ e as afirmativas: I — A decomposição do ozônio é entalpicamente favorecida. II — O aumento de temperatura favorece a formação de oxigênio. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "a",
  r: String.raw`I é verdadeira. A entalpia padrão de formação do ozônio é positiva ($\Delta H^\circ_f \approx +142$ kJ/mol): o $\text{O}_3$ está acima do $\text{O}_2$ em energia. Então a decomposição $2\text{O}_3 \to 3\text{O}_2$ libera energia ($\Delta H < 0$), é exotérmica e, portanto, entalpicamente favorecida.

II é falsa, e é aí que a questão pega. Pelo princípio de Le Chatelier, aumentar a temperatura desloca o equilíbrio no sentido endotérmico. Como o sentido direto (formar $\text{O}_2$) é o exotérmico, aquecer favorece o sentido inverso, isto é, a formação de $\text{O}_3$ — coerente, aliás, com o próprio enunciado, em que o aquecimento local acompanha a formação de ozônio.

Só I está correta.`,
});

// Q7 — P2 UFF-IQ-GQI Q6 | UFF-P2 nov/25 Objetiva B Q9
q({
  t: T2,
  sub: "Teoria de bandas e dopagem de semicondutores",
  dif: "medio",
  ...NOV25,
  e: String.raw`Assinale a opção CORRETA sobre condutores, semicondutores e isolantes:`,
  alt: {
    a: "A diferença entre um condutor e um isolante é a quantidade de energia necessária para transferir o elétron da banda de condução para a banda de valência.",
    b: "O semicondutor do tipo P apresenta elétrons de valência com energia próxima à banda de condução.",
    c: "O semicondutor do tipo N pode ser obtido com a dopagem de Si com elementos do grupo 15.",
    d: "O isolante elétrico tem baixa diferença de energia entre as bandas de valência e de condução.",
  },
  g: "c",
  r: String.raw`A correta é a (c). O silício tem 4 elétrons de valência; dopando-o com um elemento do grupo 15 (P, As, Sb), que tem 5, sobra um elétron que não entra em ligação e fica num nível logo abaixo da banda de condução. Esse elétron extra é o portador majoritário — daí o nome tipo N, de negativo.

As demais estão invertidas:

(a) o elétron é promovido da banda de valência para a de condução, e não o contrário;

(b) quem tem elétron extra perto da banda de condução é o tipo N — o tipo P é dopado com o grupo 13 e cria lacunas perto da banda de valência;

(d) isolante tem gap GRANDE (acima de cerca de $5$ eV); gap pequeno é de semicondutor, e gap praticamente nulo, de condutor.`,
});

// Q8 — P2 UFF Q7 | Certo/Errado Q8(I) | Departamento Q8(I)
q({
  t: T3,
  sub: "Força de agentes oxidantes entre halogênios",
  dif: "facil",
  e: String.raw`Para um metal, o $\text{Cl}_2$ é um oxidante mais forte que o $\text{I}_2$.`,
  alt: CE(),
  g: "a",
  r: String.raw`Oxidante forte é quem tem grande tendência a ganhar elétrons, ou seja, potencial de redução alto:

$$E^\circ(\text{Cl}_2/\text{Cl}^-) = +1{,}36\ \text{V} \qquad E^\circ(\text{I}_2/\text{I}^-) = +0{,}54\ \text{V}$$

Como o cloro tem $E^\circ$ bem maior, ele arranca elétrons do metal com mais facilidade que o iodo: é o oxidante mais forte, e a afirmativa está correta.

A tendência geral entre os halogênios é $\text{F}_2 > \text{Cl}_2 > \text{Br}_2 > \text{I}_2$ — por isso um halogênio mais ativo desloca o menos ativo de seus sais.`,
});

// Q9 — P2 UFF Q8 | Departamento Q8(II) | Certo/Errado Q30
q({
  t: T2,
  sub: "Polaridade e miscibilidade",
  dif: "facil",
  e: String.raw`A água e o óleo não são solúveis entre si por causa da grande diferença de polaridade entre as espécies.`,
  alt: CE(),
  g: "a",
  r: String.raw`A água é polar e faz ligações de hidrogênio muito fortes entre suas próprias moléculas; o óleo é apolar e se mantém unido apenas por forças de dispersão de London.

Misturar os dois exigiria quebrar as ligações de hidrogênio da água e substituí-las por interações água–óleo muito mais fracas, o que não compensa energeticamente. É o princípio de que semelhante dissolve semelhante: a imiscibilidade vem da diferença de polaridade.

A afirmativa está correta. Cuidado com a versão da prova que atribui a imiscibilidade a uma variação negativa de entalpia — essa é falsa.`,
});

// Q10 — P2 UFF Q9 | Departamento Q1(I) | Certo/Errado Q15
q({
  t: T3,
  sub: "Eletrólise versus célula galvânica",
  dif: "medio",
  e: String.raw`O carregamento do celular é um processo termodinamicamente desfavorável que transforma energia elétrica em química.`,
  alt: CE(),
  g: "a",
  r: String.raw`Carregar a bateria é forçar as reações a andarem no sentido contrário ao espontâneo — é uma eletrólise. Por definição, esse sentido tem $\Delta G > 0$: é termodinamicamente desfavorável e só acontece porque a fonte externa fornece energia elétrica, que fica armazenada como energia química.

Ao usar o celular ocorre o inverso, e sozinho: a pilha descarrega espontaneamente ($\Delta G < 0$), convertendo energia química em elétrica.

A afirmativa está correta.`,
});

// Q11 — P2 UFF Q10 | Departamento Q1(II) | Certo/Errado Q16
q({
  t: T4,
  sub: "Acidez natural da chuva e CO2 dissolvido",
  dif: "facil",
  e: String.raw`A chuva pode apresentar pH $5{,}5$ por causa do $\text{CO}_2$ dissolvido, que forma equilíbrio com ácido fraco.`,
  alt: CE(),
  g: "a",
  r: String.raw`O gás carbônico do ar se dissolve na gota de chuva e reage com a água:

$$\text{CO}_2(g) + \text{H}_2\text{O}(l) \rightleftharpoons \text{H}_2\text{CO}_3(aq) \rightleftharpoons \text{H}^+(aq) + \text{HCO}_3^-(aq)$$

O ácido carbônico é fraco ($K_a \approx 4{,}3 \times 10^{-7}$), então libera pouco $\text{H}^+$ — o suficiente para levar a chuva limpa a um pH em torno de $5{,}6$, e não a 7.

A afirmativa está correta. Valores bem abaixo disso caracterizam chuva ácida de origem antrópica ($\text{SO}_2$ e $\text{NO}_x$, que geram ácidos fortes).`,
});

// Q12 — P2 UFF Q11 | Departamento Q2
q({
  t: T3,
  sub: "FEM de pilha Zn/Ag",
  dif: "medio",
  e: String.raw`A pilha formada por eletrodos de Zn e Ag, conectados a um voltímetro e imersos nas respectivas soluções de $\text{Zn(NO}_3)_2$ e $\text{AgNO}_3$, com junção líquida feita através de uma ponte salina, fornecerá $1{,}56$ V.`,
  alt: CE(),
  g: "a",
  r: String.raw`O metal de menor potencial de redução é o anodo (oxida) e o de maior é o catodo (reduz):

$$E^\circ(\text{Ag}^+/\text{Ag}) = +0{,}80\ \text{V} \qquad E^\circ(\text{Zn}^{2+}/\text{Zn}) = -0{,}76\ \text{V}$$

$$E^\circ_{\text{pilha}} = E^\circ_{\text{catodo}} - E^\circ_{\text{anodo}} = 0{,}80 - (-0{,}76) = +1{,}56\ \text{V}$$

O zinco se oxida e a prata se deposita. A afirmativa está correta.`,
});

// Q13 — P2 UFF Q12
q({
  t: T4,
  sub: "pH de base forte e de sal neutro",
  dif: "medio",
  e: String.raw`As soluções aquosas de hidróxido de sódio $10^{-4}$ mol/L e cloreto de sódio $10^{-5}$ mol/L apresentam, respectivamente, pH $10$ e $5$.`,
  alt: CE(),
  g: "b",
  r: String.raw`A primeira parte está certa: o NaOH é base forte, então $[\text{OH}^-] = 10^{-4}$, $\text{pOH} = 4$ e $\text{pH} = 14 - 4 = 10$.

A segunda parte é o erro. O NaCl vem de ácido forte (HCl) com base forte (NaOH): nenhum de seus íons sofre hidrólise, de modo que a solução é neutra, $\text{pH} = 7$ — e não 5. Mesmo que hidrolisasse, uma concentração de $10^{-5}$ mol/L seria baixa demais para deslocar o pH de forma apreciável.

Como a afirmativa dá pH 5 para o NaCl, ela está errada.`,
});

// Q14 — P2 UFF Q13
q({
  t: T3,
  sub: "Corrosão galvânica Fe/Cu e efeito do eletrólito",
  dif: "medio",
  e: String.raw`O Fe em contato com Cu sofre corrosão em meio úmido aerado, que é mais rápida em presença de NaCl.`,
  alt: CE(),
  g: "a",
  r: String.raw`Fe ($E^\circ = -0{,}44$ V) e Cu ($E^\circ = +0{,}34$ V) em contato formam uma pilha: o ferro, menos nobre, é o anodo e se corrói; o cobre é o catodo e fica protegido.

O NaCl não muda quem oxida — ele aumenta a condutividade do meio. Com mais íons disponíveis para fechar o circuito, a corrente da pilha de corrosão cresce e o ataque ao ferro fica mais rápido. É por isso que carro em cidade litorânea enferruja mais.

A afirmativa está correta.`,
});

// Q15 — P2 UFF Q14 | Certo/Errado Q18
q({
  t: T3,
  sub: "Agentes oxidantes e formas já reduzidas",
  dif: "medio",
  e: String.raw`Dentre as espécies químicas em solução aquosa $\text{I}_2$, $\text{Cl}^-$ e $\text{Ag}^+$, a única que NÃO oxida o Mg metálico é o $\text{Cl}^-$.`,
  alt: CE(),
  g: "a",
  r: String.raw`O magnésio tem $E^\circ = -2{,}37$ V, ou seja, é oxidado por praticamente qualquer espécie com potencial maior. $\text{I}_2$ ($+0{,}54$ V) e $\text{Ag}^+$ ($+0{,}80$ V) cumprem isso e atacam o Mg.

O $\text{Cl}^-$ é diferente por uma razão conceitual: ele já é a forma REDUZIDA do cloro. Não tem elétrons a receber — pelo contrário, é ele que precisaria ser oxidado a $\text{Cl}_2$. Ânion de halogênio não é agente oxidante.

A afirmativa está correta.`,
});

// Q16 — P2 UFF Q15 | Departamento Q3(I) | UFF-P2 nov/25 Q2(I) | Certo/Errado Q13
q({
  t: T3,
  sub: "Compatibilidade entre eletrodo e solução",
  dif: "facil",
  ...NOV25,
  e: String.raw`Um eletrodo de zinco pode entrar em contato com solução de $\text{ZnCl}_2$ $1$ mol/L.`,
  alt: CE(),
  g: "a",
  r: String.raw`Um eletrodo só é atacado pela solução se houver no meio um íon com potencial de redução maior que o do metal do eletrodo.

Aqui o metal é Zn e o cátion da solução é $\text{Zn}^{2+}$ — o mesmo par. Não existe diferença de potencial que force reação: o sistema fica no próprio equilíbrio $\text{Zn} \rightleftharpoons \text{Zn}^{2+} + 2e^-$. É exatamente a semicélula padrão de zinco.

A afirmativa está correta.`,
});

// Q17 — P2 UFF Q16 | Certo/Errado Q14
q({
  t: T3,
  sub: "Fatores que afetam a velocidade de oxidação",
  dif: "facil",
  e: String.raw`A oxidação de um eletrodo metálico por $\text{O}_2(g)$ é mais rápida quanto maior a superfície de contato do metal e maior a pressão do gás.`,
  alt: CE(),
  g: "a",
  r: String.raw`A reação acontece na interface metal–gás, então tudo que aumenta o número de colisões efetivas por segundo acelera o processo. Maior área superficial significa mais sítios expostos ao mesmo tempo (por isso limalha oxida muito mais rápido que uma barra maciça), e maior pressão de $\text{O}_2$ significa mais moléculas por unidade de volume batendo na superfície — o análogo, para gases, do aumento de concentração.

Os dois fatores são cinéticos e agem no mesmo sentido. A afirmativa está correta.`,
});

// Q18 — Certo/Errado Q9 | UFF-P2 nov/25 Q1(II)
q({
  t: T4,
  sub: "pH de ácido forte versus ácido fraco",
  dif: "facil",
  ...NOV25,
  e: String.raw`O pH de uma solução aquosa $0{,}1$ mol/L de ácido clorídrico (HCl) é menor do que o da solução aquosa $0{,}1$ mol/L de ácido carbônico ($\text{H}_2\text{CO}_3$).`,
  alt: CE(),
  g: "a",
  r: String.raw`Na mesma concentração, quem manda no pH é o grau de ionização.

O HCl é ácido forte: ioniza-se praticamente por completo, então $[\text{H}^+] = 0{,}1$ mol/L e $\text{pH} = 1$.

O $\text{H}_2\text{CO}_3$ é fraco ($K_a \approx 4{,}3 \times 10^{-7}$): libera só uma fração do $\text{H}^+$ possível, e o pH fica em torno de $3{,}9$.

Como $1 < 3{,}9$, o pH do HCl é mesmo o menor e a afirmativa está correta.`,
});

// Q19 — Departamento Q2 | UFF-P2 nov/25 Q1(I) | Certo/Errado Q17
q({
  t: T3,
  sub: "FEM de pilha Cu/Ag",
  dif: "medio",
  ...NOV25,
  e: String.raw`A pilha formada por eletrodos de Cu e Ag, conectados a um voltímetro e imersos nas respectivas soluções de $\text{Cu(NO}_3)_2$ e $\text{AgNO}_3$, com junção líquida feita através de uma ponte salina, fornecerá $0{,}46$ V.`,
  alt: CE(),
  g: "a",
  r: String.raw`Entre os dois, a prata tem o maior potencial de redução, então ela é o catodo e o cobre é o anodo:

$$E^\circ(\text{Ag}^+/\text{Ag}) = +0{,}80\ \text{V} \qquad E^\circ(\text{Cu}^{2+}/\text{Cu}) = +0{,}34\ \text{V}$$

$$E^\circ_{\text{pilha}} = 0{,}80 - 0{,}34 = +0{,}46\ \text{V}$$

O cobre se dissolve e a prata se deposita. A afirmativa está correta.

Vale notar que o $E^\circ$ da pilha não depende de quantos elétrons a reação global envolve — não se multiplica o potencial pelo coeficiente ao balancear.`,
});

// Q20 — Departamento Q1 (variante) | UFF-P2 nov/25 Q1
q({
  t: T4,
  sub: "pH de ácido forte e de sal neutro",
  dif: "medio",
  ...NOV25,
  e: String.raw`As soluções aquosas de ácido clorídrico (HCl) $10^{-4}$ mol/L e cloreto de sódio (NaCl) $10^{-5}$ mol/L apresentam, respectivamente, pH $4$ e $5$.`,
  alt: CE(),
  g: "b",
  r: String.raw`A primeira parte está certa: o HCl é ácido forte, então $[\text{H}^+] = 10^{-4}$ mol/L e $\text{pH} = 4$.

A segunda está errada. O NaCl é sal de ácido forte com base forte — não hidrolisa, e a solução permanece neutra, $\text{pH} = 7$. Um sal neutro não acidifica a água só porque foi dissolvido nela; a concentração dele é irrelevante para o pH.

Como a afirmativa atribui pH 5 ao NaCl, o conjunto está errado.`,
});

// Q21 — Departamento Q3 | UFF-P2 nov/25
q({
  t: T3,
  sub: "Corrosão galvânica Fe/Ag e oxidantes em solução",
  dif: "medio",
  ...NOV25,
  e: String.raw`Considere as afirmativas: I — Em contato com Ag, o Fe sofre corrosão em meio úmido aerado, que é mais rápida em presença do eletrólito forte NaCl. II — Dentre as espécies químicas em solução aquosa $\text{I}_2$, $\text{Cl}^-$ e $\text{Ag}^+$, a única que não oxida o Mg é o $\text{Cl}^-$. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "c",
  r: String.raw`I é verdadeira. Fe ($E^\circ = -0{,}44$ V) em contato com Ag ($E^\circ = +0{,}80$ V) vira o anodo da pilha e se corrói. O NaCl, eletrólito forte, aumenta a condutividade do meio e portanto a corrente da pilha de corrosão, acelerando o ataque.

II também é verdadeira. $\text{I}_2$ e $\text{Ag}^+$ têm potencial de redução muito acima do magnésio ($-2{,}37$ V) e o oxidam; o $\text{Cl}^-$ é a forma já reduzida do cloro e não tem elétrons a receber, logo não é agente oxidante.

As duas estão corretas.`,
});

// Q22 — Departamento Q3(I) | UFF-P2 nov/25 Q2
q({
  t: T3,
  sub: "Eletrodo de Cu em ZnCl2 e cinética de oxidação",
  dif: "dificil",
  ...NOV25,
  e: String.raw`Considere as afirmativas: I — Um eletrodo de cobre NÃO pode entrar em contato com solução de $\text{ZnCl}_2$ $1$ mol/L. II — A oxidação de um eletrodo metálico por HCl(aq) é mais rápida quanto maior a superfície de contato e maior a concentração do metal. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "d",
  r: String.raw`I é falsa. Para a solução atacar o eletrodo, o cátion do meio precisaria ter potencial de redução MAIOR que o do metal. Aqui é o oposto: $\text{Zn}^{2+}$ ($-0{,}76$ V) contra Cu ($+0{,}34$ V). O cobre não é oxidado pelo $\text{Zn}^{2+}$, então ele PODE ficar em contato com a solução sem reagir.

II é falsa por um detalhe de redação, que é o que a questão está testando: o que acelera a reação é a concentração do ÁCIDO, não a do metal. Metal sólido não tem concentração que se altere — dele o que importa é a área superficial exposta.

Como as duas afirmativas estão erradas, a resposta é "nenhuma das opções".`,
});

// Q23 — Departamento Q6 | UFF-P2 nov/25 Q3 | Certo/Errado Q24
q({
  t: T3,
  sub: "Entropia com a temperatura e hibridização do grafite",
  dif: "medio",
  ...NOV25,
  e: String.raw`Considere as afirmativas: I — Um fio aquecido tem maior desordem (entropia) que outro não aquecido. II — O átomo de carbono no grafite apresenta hibridização $sp^2$, contendo $3$ ligações $\sigma$ e $1$ ligação $\pi$. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "c",
  r: String.raw`I é verdadeira. Aquecer aumenta a agitação térmica e o número de microestados acessíveis ao sistema, e entropia é exatamente a medida desse número de microestados. Daí $\Delta S > 0$ ao aquecer.

II também é verdadeira. No grafite cada carbono é $sp^2$: três orbitais híbridos no plano formam $3$ ligações $\sigma$ com os vizinhos a $120^\circ$, e o orbital $p$ puro perpendicular ao plano forma $1$ ligação $\pi$, que se deslocaliza pela camada inteira. Total de quatro ligações por carbono, como esperado para o grupo 14.

As duas estão corretas.`,
});

// Q24 — Departamento Q8(I) | UFF-P2 nov/25 Q4(I) | Certo/Errado Q27
q({
  t: T3,
  sub: "Resistência à oxidação e potencial de redução",
  dif: "medio",
  ...NOV25,
  e: String.raw`Em água, o Hg apresenta menor resistência à oxidação do que o Mg.`,
  alt: CE(),
  g: "b",
  r: String.raw`Resistência à oxidação anda junto com o potencial de redução: quanto mais positivo o $E^\circ$, mais difícil oxidar o metal.

$$E^\circ(\text{Hg}^{2+}/\text{Hg}) = +0{,}85\ \text{V} \qquad E^\circ(\text{Mg}^{2+}/\text{Mg}) = -2{,}37\ \text{V}$$

O mercúrio é nobre e resiste muito; o magnésio é extremamente ativo e oxida com facilidade. Ou seja, quem tem MENOR resistência é o Mg — a afirmativa inverte os dois e está errada.`,
});

// Q25 — Departamento Q7(II) | Certo/Errado Q28
q({
  t: T4,
  sub: "pH de base forte versus base fraca",
  dif: "facil",
  e: String.raw`Dentre as espécies em água NaOH e $\text{Mg(OH)}_2$, o NaOH apresenta menor pH.`,
  alt: CE(),
  g: "b",
  r: String.raw`O NaOH é base forte e se dissocia por completo, liberando toda a hidroxila disponível. O $\text{Mg(OH)}_2$ é base fraca e pouco solúvel: só uma fração pequena vira $\text{OH}^-$ em solução.

Mais $\text{OH}^-$ significa pOH menor e, portanto, pH MAIOR. Na mesma concentração, o NaOH tem o pH mais alto, não o mais baixo.

A afirmativa está errada.`,
});

// Q26 — Departamento Q7(I) | Certo/Errado Q27
q({
  t: T3,
  sub: "Nobreza relativa de Ag e Hg",
  dif: "dificil",
  e: String.raw`Dentre as espécies em água Ag e Hg, a Ag apresenta maior resistência à oxidação.`,
  alt: CE(),
  g: "b",
  r: String.raw`Os dois são metais nobres, mas a comparação é decidida pelo potencial de redução:

$$E^\circ(\text{Ag}^+/\text{Ag}) = +0{,}80\ \text{V} \qquad E^\circ(\text{Hg}^{2+}/\text{Hg}) = +0{,}85\ \text{V}$$

O mercúrio tem $E^\circ$ ligeiramente maior, então é ele o mais resistente à oxidação — e não a prata. A diferença é pequena, mas a afirmativa como está escrita é errada.`,
});

// Q27 — Departamento Q6(I) | Certo/Errado Q25 | UFF-P2 nov/25
q({
  t: T3,
  sub: "Le Chatelier e efeito da pressão na síntese da amônia",
  dif: "medio",
  ...NOV25,
  e: String.raw`Na reação não equilibrada $\text{N}_2 + \text{H}_2 \rightleftharpoons \text{NH}_3$, o aumento de pressão favorece a formação de amônia.`,
  alt: CE(),
  g: "a",
  r: String.raw`Primeiro se equilibra a equação, porque é dela que sai a contagem de mols gasosos:

$$\text{N}_2(g) + 3\text{H}_2(g) \rightleftharpoons 2\text{NH}_3(g)$$

São $4$ mols de gás do lado dos reagentes contra $2$ do lado do produto. Aumentar a pressão comprime o sistema, e pelo princípio de Le Chatelier o equilíbrio se desloca para o lado que ocupa menos volume, isto é, para a amônia.

A afirmativa está correta — é justamente por isso que o processo Haber-Bosch opera a centenas de atmosferas.`,
});

// Q28 — Departamento Q8(I) | Certo/Errado Q29
q({
  t: T3,
  sub: "H2 como redutor e não como oxidante",
  dif: "medio",
  e: String.raw`Para um metal, o $\text{H}_2$ é um oxidante mais forte que o $\text{I}_2$.`,
  alt: CE(),
  g: "b",
  r: String.raw`O gás hidrogênio é caracteristicamente um agente REDUTOR: ele cede elétrons. Quem oxida metal em meio ácido é o $\text{H}^+$, e mesmo esse é a referência da escala, com $E^\circ = 0{,}00$ V.

$$E^\circ(\text{I}_2/\text{I}^-) = +0{,}54\ \text{V} > E^\circ(\text{H}^+/\text{H}_2) = 0{,}00\ \text{V}$$

Ou seja, o iodo é o oxidante mais forte dos dois. A afirmativa está errada.`,
});

// Q29 — Departamento Q4 | Certo/Errado Q21-Q22
q({
  t: T3,
  sub: "Cinética e espontaneidade da reação Zn + HCl",
  dif: "medio",
  e: String.raw`Sobre a reação entre zinco e solução aquosa de ácido clorídrico (HCl), considere as afirmativas: I — O aumento da concentração do HCl aumenta a probabilidade de choques efetivos. II — A reação é termodinamicamente favorável porque o potencial total padrão é positivo. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "c",
  r: String.raw`I é verdadeira, e é cinética pura: mais $\text{H}^+$ por unidade de volume significa mais colisões por segundo com a superfície do zinco e, portanto, mais colisões efetivas — a reação fica mais rápida.

II é verdadeira, e é termodinâmica. A reação é $\text{Zn}(s) + 2\text{HCl}(aq) \to \text{ZnCl}_2(aq) + \text{H}_2(g)$, com

$$E^\circ = E^\circ(\text{H}^+/\text{H}_2) - E^\circ(\text{Zn}^{2+}/\text{Zn}) = 0{,}00 - (-0{,}76) = +0{,}76\ \text{V}$$

Como $\Delta G = -nFE^\circ$, um $E^\circ$ positivo dá $\Delta G < 0$: processo espontâneo.

Note que as duas afirmativas falam de coisas diferentes — velocidade e espontaneidade — e ambas estão certas.`,
});

// Q30 — Departamento Q5 | Certo/Errado Q23
q({
  t: T3,
  sub: "Energia de ativação em reação exotérmica",
  dif: "facil",
  e: String.raw`Na reação exotérmica não equilibrada $\text{H}_2 + \text{O}_2 \to \text{H}_2\text{O}$, energia inicial é necessária para formação do produto.`,
  alt: CE(),
  g: "a",
  r: String.raw`Ser exotérmica diz respeito ao balanço final: no total a reação libera energia ($\Delta H < 0$). Isso não isenta o sistema de vencer a barreira inicial.

Antes de formar as ligações novas, as ligações $\text{H}-\text{H}$ e $\text{O}=\text{O}$ precisam ser rompidas, e isso custa energia — a energia de ativação. Por isso $\text{H}_2$ e $\text{O}_2$ convivem indefinidamente à temperatura ambiente e só reagem com uma faísca.

A afirmativa está correta: toda reação, exotérmica ou não, tem $E_a > 0$.`,
});

// Q31 — Certo/Errado Q24 | Departamento Q5(II)
q({
  t: T3,
  sub: "Entropia e temperatura",
  dif: "facil",
  e: String.raw`Um fio aquecido tem maior entropia que outro não aquecido.`,
  alt: CE(),
  g: "a",
  r: String.raw`Entropia mede quantos microestados o sistema pode ocupar. Aquecer o fio distribui energia por mais níveis vibracionais dos átomos da rede, aumentando o número de microestados acessíveis — logo, a entropia sobe.

É a mesma ideia do terceiro princípio da termodinâmica, que leva $S \to 0$ quando $T \to 0$ K num cristal perfeito.

A afirmativa está correta.`,
});

// Q32 — Certo/Errado Q25
q({
  t: T3,
  sub: "Le Chatelier e efeito da pressão na síntese da amônia",
  dif: "medio",
  e: String.raw`Na reação não equilibrada $\text{N}_2 + \text{H}_2 \rightleftharpoons \text{NH}_3$, o aumento de pressão DIMINUI a formação de amônia.`,
  alt: CE(),
  g: "b",
  r: String.raw`Com a equação equilibrada, $\text{N}_2(g) + 3\text{H}_2(g) \rightleftharpoons 2\text{NH}_3(g)$, há $4$ mols de gás nos reagentes e $2$ nos produtos.

Aumentar a pressão desloca o equilíbrio para o lado de MENOR número de mols gasosos, ou seja, no sentido de formar amônia. A afirmativa diz o contrário e está errada.

É a mesma situação de outra questão do compilado, com o efeito invertido na redação — vale ler o verbo com atenção.`,
});

// Q33 — Certo/Errado Q26
q({
  t: T2,
  sub: "Contagem de ligações sigma e pi no carbono sp2",
  dif: "medio",
  e: String.raw`O átomo de carbono no grafite apresenta hibridização $sp^2$, com $2$ ligações $\sigma$ e $2$ ligações $\pi$.`,
  alt: CE(),
  g: "b",
  r: String.raw`A hibridização está certa, a contagem não. Um carbono $sp^2$ tem três orbitais híbridos, que formam $3$ ligações $\sigma$, e um orbital $p$ puro, que forma $1$ ligação $\pi$.

Para comparar: $sp^3$ dá $4\sigma$ e nenhum $\pi$ (diamante); $sp^2$ dá $3\sigma + 1\pi$ (grafite, eteno); $sp$ dá $2\sigma + 2\pi$ (etino). A contagem descrita na afirmativa é a do carbono $sp$, não a do grafite.

A afirmativa está errada.`,
});

// Q34 — Certo/Errado Q3
q({
  t: T3,
  sub: "Intensidade da corrosão galvânica e diferença de potencial",
  dif: "medio",
  e: String.raw`Por contato físico, a prata promove baixa oxidação do zinco metálico ao ambiente.`,
  alt: CE(),
  g: "b",
  r: String.raw`Quanto maior a diferença de potencial entre os dois metais em contato, mais intensa é a corrosão do menos nobre.

$$E^\circ(\text{Ag}^+/\text{Ag}) - E^\circ(\text{Zn}^{2+}/\text{Zn}) = 0{,}80 - (-0{,}76) = +1{,}56\ \text{V}$$

Uma diferença dessas é enorme: em meio úmido o par Ag–Zn forma uma pilha de FEM alta e o zinco se oxida intensamente, não pouco.

A afirmativa está errada.`,
});

// Q35 — Certo/Errado Q5
q({
  t: T2,
  sub: "Geometria, polaridade e solubilidade do CO2",
  dif: "medio",
  e: String.raw`O $\text{CO}_2$ apresenta geometria linear e alta solubilidade em água.`,
  alt: CE(),
  g: "b",
  r: String.raw`A geometria está certa: o carbono central não tem par isolado e as duas duplas se afastam ao máximo, dando uma molécula linear ($180^\circ$).

Justamente por ser linear e simétrica, os dois dipolos $\text{C}=\text{O}$ se cancelam e a molécula é APOLAR — o que explica a segunda metade estar errada: a solubilidade física do $\text{CO}_2$ em água é baixa (cerca de $1{,}7$ g/L a $20\ ^\circ$C). O pouco que se dissolve ainda reage formando $\text{H}_2\text{CO}_3$, mas isso não faz dele um gás muito solúvel, como $\text{HCl}$ ou $\text{NH}_3$.

Como a segunda parte é falsa, a afirmativa está errada.`,
});

// Q36 — Certo/Errado Q6
q({
  t: T2,
  sub: "Sentido da promoção eletrônica entre bandas",
  dif: "medio",
  e: String.raw`A diferença entre um condutor e um isolante é a quantidade de energia necessária para transferir o elétron da banda de condução para a banda de valência.`,
  alt: CE(),
  g: "b",
  r: String.raw`O sentido está trocado. Para o material conduzir, o elétron precisa ser promovido da banda de VALÊNCIA (cheia) para a banda de CONDUÇÃO (vazia) — e é a energia desse salto, o gap, que separa condutor de isolante.

No condutor as bandas se sobrepõem e o gap é praticamente nulo; no semicondutor ele é da ordem de $1$ eV; no isolante passa de $5$ eV.

A afirmativa está errada.`,
});

// Q37 — Certo/Errado Q7
q({
  t: T2,
  sub: "Nível doador do semicondutor tipo N",
  dif: "medio",
  e: String.raw`O semicondutor do tipo N apresenta elétrons de valência com energia próxima à banda de condução.`,
  alt: CE(),
  g: "a",
  r: String.raw`No tipo N o dopante vem do grupo 15 e tem $5$ elétrons de valência, um a mais do que o silício precisa para as quatro ligações da rede. Esse elétron sobrando ocupa um nível doador logo abaixo da banda de condução.

Como a distância energética até a banda de condução é pequena, basta pouca energia térmica para promovê-lo, e ele passa a conduzir. Por isso os portadores majoritários do tipo N são elétrons.

A afirmativa está correta.`,
});

// Q38 — Certo/Errado Q8
q({
  t: T2,
  sub: "Gap de energia em isolantes",
  dif: "facil",
  e: String.raw`O isolante elétrico tem alta diferença de energia entre as bandas de valência e de condução.`,
  alt: CE(),
  g: "a",
  r: String.raw`É a definição de isolante na teoria de bandas: gap grande, tipicamente acima de $5$ eV. A energia térmica disponível à temperatura ambiente é da ordem de $0{,}025$ eV, longe demais do necessário para promover elétrons — então praticamente nenhum portador chega à banda de condução.

Ordens de grandeza para comparar: diamante $\approx 5{,}5$ eV e $\text{SiO}_2 \approx 9$ eV (isolantes), contra $\text{Si} \approx 1{,}1$ eV (semicondutor).

A afirmativa está correta.`,
});

// Q39 — Departamento Q9(I)
q({
  t: T4,
  sub: "Ordenação de pH entre ácidos e bases fortes e fracos",
  dif: "dificil",
  e: String.raw`Sejam as seguintes espécies em água: NaOH, $\text{Al(OH)}_3$, $\text{HNO}_3$ e $\text{H}_2\text{CO}_3$. A ordem crescente de pH é $\text{HNO}_3 < \text{H}_2\text{CO}_3 < \text{NaOH} < \text{Al(OH)}_3$.`,
  alt: CE(),
  g: "b",
  r: String.raw`Classificando cada espécie: $\text{HNO}_3$ é ácido forte (pH mais baixo de todos); $\text{H}_2\text{CO}_3$ é ácido fraco (ácido, mas bem menos); $\text{Al(OH)}_3$ é base fraca e pouco solúvel (levemente básica); NaOH é base forte (pH mais alto de todos).

A ordem crescente correta é, portanto,

$$\text{HNO}_3 < \text{H}_2\text{CO}_3 < \text{Al(OH)}_3 < \text{NaOH}$$

A afirmativa troca as duas últimas, colocando a base fraca acima da base forte. Está errada.`,
});

// Q40 — Departamento Q9(II)
q({
  t: T2,
  sub: "Condutividade de semicondutor intrínseco versus dopado",
  dif: "medio",
  e: String.raw`Um semicondutor não dopado oferece melhor condutividade elétrica do que o semicondutor do tipo P.`,
  alt: CE(),
  g: "b",
  r: String.raw`No semicondutor intrínseco (não dopado), os únicos portadores são os pares elétron-lacuna gerados termicamente — poucos, e dependentes só da temperatura.

Dopar é exatamente o recurso para contornar isso: no tipo P, o dopante do grupo 13 cria lacunas em quantidade controlada perto da banda de valência, aumentando a condutividade em várias ordens de grandeza.

Logo, o dopado conduz melhor que o puro, e a afirmativa está errada.`,
});

// Q41 — Certo/Errado Q10
q({
  t: T3,
  sub: "Espontaneidade termodinâmica da corrosão",
  dif: "facil",
  e: String.raw`A corrosão de um metal é um processo termodinamicamente favorável.`,
  alt: CE(),
  g: "a",
  r: String.raw`A maioria dos metais é encontrada na natureza na forma de óxidos e sulfetos, não como metal puro — sinal de que a forma oxidada é a mais estável na presença de $\text{O}_2$ e água. Refinar o minério é que exige energia.

Corroer é o sistema voltando a essa forma mais estável: um processo espontâneo, com $\Delta G < 0$. O que se pode fazer é atrasá-lo (pintura, passivação, anodo de sacrifício), não torná-lo desfavorável.

A afirmativa está correta.`,
});

// Q42 — Certo/Errado Q12
q({
  t: T2,
  sub: "Condutividade da grafita por elétrons pi deslocalizados",
  dif: "facil",
  e: String.raw`Das variedades alotrópicas do carbono, diamante e grafita, a segunda pode ser utilizada como condutor elétrico devido às ligações $\pi$ deslocalizadas.`,
  alt: CE(),
  g: "a",
  r: String.raw`Na grafita cada carbono é $sp^2$ e o quarto elétron de valência fica num orbital $p$ puro, perpendicular à camada. Esses orbitais se superpõem lado a lado por toda a folha hexagonal, formando um sistema $\pi$ deslocalizado: os elétrons se movem livremente ao longo da camada e o material conduz.

No diamante ($sp^3$) todos os elétrons estão presos em ligações $\sigma$ localizadas, e por isso ele é isolante.

A afirmativa está correta.`,
});

// Q49 — UFF-P2 nov/25 Q1
q({
  t: T3,
  sub: "FEM de pilha Cu/Ag e pH de ácido fraco",
  dif: "dificil",
  ...NOV25,
  e: String.raw`Considere as afirmativas: I — A pilha formada por eletrodos de Cu e Ag, imersos em $\text{Cu(NO}_3)_2$ e $\text{AgNO}_3$, com ponte salina, fornecerá $0{,}46$ V. II — As soluções aquosas de HCl $0{,}1$ mol/L e de ácido carbônico ($\text{H}_2\text{CO}_3$) $10^{-2}$ mol/L apresentam, respectivamente, pH $1$ e $2$. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "a",
  r: String.raw`I é verdadeira:

$$E^\circ_{\text{pilha}} = E^\circ(\text{Ag}^+/\text{Ag}) - E^\circ(\text{Cu}^{2+}/\text{Cu}) = 0{,}80 - 0{,}34 = +0{,}46\ \text{V}$$

II é falsa. O pH $1$ do HCl está certo (ácido forte, $[\text{H}^+] = 0{,}1$ mol/L), mas o do ácido carbônico não: por ser fraco, ele não libera $10^{-2}$ mol/L de $\text{H}^+$. Com $K_a \approx 4{,}3 \times 10^{-7}$,

$$[\text{H}^+] = \sqrt{K_a \cdot C} = \sqrt{4{,}3\times10^{-7} \times 10^{-2}} \approx 6{,}6 \times 10^{-5}\ \text{mol/L} \Rightarrow \text{pH} \approx 4{,}2$$

Logo, só I está correta. O ponto conceitual é que só se lê o pH direto da concentração quando o ácido é forte.`,
});

// Q50 — UFF-P2 nov/25 Q4
q({
  t: T4,
  sub: "Resistência à oxidação e pH de ácido forte versus muito fraco",
  dif: "dificil",
  ...NOV25,
  e: String.raw`Considere as afirmativas: I — Em água, o Hg apresenta menor resistência à oxidação do que o Mg. II — O pH de uma solução aquosa $0{,}1$ mol/L de ácido nítrico ($\text{HNO}_3$) é maior do que o pH da solução aquosa $0{,}1$ mol/L de ácido bórico ($\text{H}_3\text{BO}_3$). É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "d",
  r: String.raw`I é falsa: o Hg ($E^\circ = +0{,}85$ V) é nobre e resiste muito à oxidação, enquanto o Mg ($E^\circ = -2{,}37$ V) é dos metais mais fáceis de oxidar. Quem tem menor resistência é o magnésio.

II também é falsa: o $\text{HNO}_3$ é ácido forte e dá pH $1$ a $0{,}1$ mol/L; o ácido bórico é muito fraco ($K_a \approx 5{,}8 \times 10^{-10}$) e fica em pH $\approx 5$. Portanto o pH do $\text{HNO}_3$ é MENOR, não maior.

Como as duas estão erradas, a resposta é "nenhuma das opções".`,
});

// Q51 — UFF-P2 nov/25 Q6
q({
  t: T4,
  sub: "Bateria de íon-lítio e entalpia de formação",
  dif: "medio",
  ...NOV25,
  e: String.raw`Considere as afirmativas: I — Na bateria de íon lítio, a energia envolvida na oxidação do lítio leva à geração de energia elétrica. II — Se a entalpia padrão de formação do $\text{F}^-(aq)$ é igual a $-333$ kJ/mol, o íon fluoreto é mais estável do que o $\text{F}_2(g)$. É correto o que se afirma em:`,
  alt: AFIRM(),
  g: "c",
  r: String.raw`I é verdadeira. Na descarga, o lítio se oxida no anodo ($\text{Li} \to \text{Li}^+ + e^-$) e os elétrons liberados percorrem o circuito externo: é essa corrente que alimenta o aparelho. A energia química da reação vira energia elétrica.

II é verdadeira. Por convenção, a entalpia padrão de formação de um elemento na sua forma mais estável é zero, então $\Delta H^\circ_f(\text{F}_2(g)) = 0$. Como $\Delta H^\circ_f(\text{F}^-(aq)) = -333$ kJ/mol é negativa, o fluoreto aquoso está abaixo em energia, ou seja, é mais estável que o $\text{F}_2$ gasoso.

As duas estão corretas.`,
});

// Q52 — UFF-P2 nov/25 Q7 (Objetiva B)
q({
  t: T3,
  sub: "Calor sensível e calor específico",
  dif: "medio",
  ...NOV25,
  e: String.raw`Um isolante elétrico termofixo foi utilizado para revestir adequadamente $25$ g de fio de cobre. Sabe-se que a temperatura inicial do fio revestido é $25{,}6\ ^\circ$C. Após ser submetido a $100$ J, a temperatura do revestimento em $^\circ$C é, aproximadamente: [dados: $c(\text{Cu}) = 0{,}4$ J/g$\cdot$K; $c(\text{H}_2\text{O}) = 4$ J/g$\cdot$K]`,
  alt: { a: "$-35{,}6$", b: "$35{,}6$", c: "$15{,}6$", d: "$-15{,}6$", e: "$25{,}6$" },
  g: "b",
  r: String.raw`O revestimento é um isolante térmico bem aplicado, de modo que o calor fornecido fica no cobre e leva o conjunto ao equilíbrio térmico. Usa-se então o calor específico do cobre — o dado da água é distrator:

$$Q = m\,c\,\Delta T \Rightarrow \Delta T = \dfrac{Q}{m\,c} = \dfrac{100}{25 \times 0{,}4} = 10\ ^\circ\text{C}$$

$$T_f = 25{,}6 + 10 = 35{,}6\ ^\circ\text{C}$$

Repare que $\Delta T$ em kelvin e em grau Celsius tem o mesmo valor numérico, então não é preciso converter.`,
});

writeFileSync(destino, JSON.stringify(itens, null, 2), "utf8");
console.log(`${itens.length} questões escritas em ${destino}`);
const porTopico = new Map();
const porInst = new Map();
itens.forEach((i) => {
  porTopico.set(i.topico, (porTopico.get(i.topico) || 0) + 1);
  const chave = `${i.instituicao} ${i.ano ?? "(sem ano)"}`;
  porInst.set(chave, (porInst.get(chave) || 0) + 1);
});
[...porTopico.entries()].forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
[...porInst.entries()].forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
