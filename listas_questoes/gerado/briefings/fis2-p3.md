# Briefing da banca — Física II · UFF · P3

Gerado por `scripts/briefing-banca.ts` a partir de **7 provas reais** (2022.1 → 2025.2), 105 questões.

> Tudo neste arquivo é **medido**, não opinião. Onde houver dúvida sobre o estilo da banca, a
> resposta está nos exemplares — eles são as questões que o professor de fato aplicou.

## O que você vai escrever

Questões **autorais**, novas, no estilo desta prova. Três regras que não se negociam:

1. **Nunca copie uma questão real.** O briefing existe pra você reproduzir o *tipo* de
   pergunta, não o enunciado. Trocar os números de uma questão existente é cópia, e o
   importador tem detecção de duplicata que vai pegar — o que é o menor dos problemas.
2. **A questão é sua e o rótulo diz isso.** `instituicao` vai como `"Expectrum"` e
   `prova_codigo` **não existe** no JSON de questão autoral. Uma questão que a gente
   escreveu nunca pode aparecer catalogada como prova da universidade.
3. **Você tem que conseguir resolver.** Escreva a resolução completa antes de fechar o
   gabarito; se a conta não fecha, a questão não vai. Distrator tem que ser o resultado de
   um ERRO PLAUSÍVEL (sinal trocado, fator 2 esquecido, raio no lugar do diâmetro), nunca
   um número aleatório.

## Composição da prova

A próxima edição deve ter **15 questões**, assim distribuídas:

| tópico | questões previstas | apareceu em | faixa por prova |
|---|---|---|---|
| O Campo Magnético | 7 | 7 de 7 | 4–10 |
| Indução Eletromagnética | 5 | 7 de 7 | 3–8 |
| Oscilações Eletromagnéticas e CA | 3 | 7 de 7 | 1–5 |

Mix de dificuldade (ponderado por recência): **medio** 66% · **dificil** 25% · **facil** 9%.

## Arquétipos por tópico

Cada linha é um `subtopico` de uma prova real — é o inventário do que esta banca pergunta.
Escreva questões que caiam NESTES arquétipos, com situação física e números novos.

### O Campo Magnético

7 questão(ões) na prova prevista · 50 no acervo deste slot.

- Força magnética sobre espira em equilíbrio (força IL×B compensando o peso)
- Lei de Biot-Savart para semicircunferências concêntricas de raios diferentes
- Campo magnético de fios retos com corrente uniforme (leitura de gráfico, lei de Ampère)
- Campo magnético no interior de um solenoide longo
- Sinal da carga a partir do sentido de curvatura da trajetória circular
- Polos magnéticos criados ao cortar um ímã em barra
- Lei de Ampère num cabo coaxial com correntes opostas
- Força magnética centrípeta sobre partícula em trajetória circular
- Inexistência de monopolo magnético (ímã cortado ao meio)
- Direção do campo magnético no centro de uma espira circular (regra da mão direita)
- Lei de Ampère com múltiplos fios e caminhos amperianos diferentes
- Força magnética sobre carga em movimento próxima a um fio
- Cancelamento de campo magnético por dois arcos de sentidos opostos
- Força magnética sobre corrente entrando num campo uniforme
- Equilíbrio entre força magnética e peso numa espira
- Dependências do torque magnético sobre uma espira
- Lei de Ampère num cilindro oco com corrente uniforme
- Força magnética sobre uma carga puntiforme próxima a um fio
- Direção da força magnética sobre um elétron
- Cancelamento do campo magnético de quatro fios num quadrado
- Superposição do campo de dois fios paralelos com correntes opostas
- Dependência da força magnética com o ângulo velocidade-campo
- Lei de Ampère com múltiplas correntes e integral de linha
- Filtro de velocidades: sinal do íon e direção do campo magnético
- Força e torque sobre espira de corrente em campo externo uniforme
- Força magnética sobre carga em movimento (produto vetorial v×B)
- Campo magnético externo de cilindro condutor com cavidade coaxial
- Força magnética sobre um fio percorrido por corrente
- Campo de uma bobina e interação magnética com um ímã
- Força entre fios paralelos percorridos por corrente
- Raio da trajetória circular de carga acelerada por uma ddp
- Espectrômetro de massa: raio, massa e sinal da carga
- Lei de Gauss do magnetismo e ausência de monopolos
- Lei de Ampère: integral de linha e corrente envolvida
- Força de Lorentz nula: seletor de velocidades
- Campo de fios retilíneos e superposição vetorial
- Força magnética entre fios paralelos
- Campo resultante nulo de dois fios retilíneos
- Polaridade magnética e linhas de campo de um solenoide
- Efeito Hall usado para medir o campo magnético
- Lei de Ampère e corrente enlaçada por uma curva
- Força sobre carga em movimento paralelo a um fio
- Raio da trajetória circular após aceleração por uma ddp
- Espectrômetro de massa e raio da órbita circular
- Lei de Biot-Savart em arcos semicirculares
- Campo magnético no interior de um solenoide
- Seletor de velocidades e força de Lorentz nula
- Força magnética resultante sobre fio dobrado
- Lei de Ampère em cilindro com cavidade coaxial
- Direção da força magnética sobre cargas em movimento

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p3** · medio · _Força magnética sobre espira em equilíbrio (força IL×B compensando o peso)_

```
Uma espira retangular pesa $0{,}55\text{ N}$, tem $0{,}20\text{ m}$ de largura e transporta a corrente $I = 2{,}25\text{ A}$. A parte inferior da espira é atravessada por um campo magnético uniforme que aponta para dentro do papel. A espira permanece em repouso num plano vertical. Quais são (a) o sentido da corrente e (b) o módulo do campo magnético?

  A) (a) horário; (b) 0,84 T
  B) (a) anti-horário; (b) 4,5 T
  C) (a) horário; (b) 1,2 T
  D) (a) anti-horário; (b) 0,84 T
  E) (a) anti-horário; (b) 1,2 T
```
Gabarito: **E**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p3** · dificil · _Lei de Biot-Savart para semicircunferências concêntricas de raios diferentes_

```
Na espira representada na figura, os raios das semicircunferências são $R$ e $2R$, respectivamente, unidas por dois segmentos retos radiais. A espira conduz a corrente $I$ no sentido indicado. O módulo e o sentido do campo magnético $\vec{B}$ no ponto $C$ (centro comum das semicircunferências) são

  A) $B = \mu_0 I/8R$ para fora do papel.
  B) $B = \mu_0 I/8R$ para dentro do papel.
  C) $B = \mu_0 I/4R$ para dentro do papel.
  D) $B = 3\mu_0 I/8R$ para dentro do papel.
  E) $B = \mu_0 I/4R$ para fora do papel.
```
Gabarito: **B**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p3** · dificil · _Campo magnético de fios retos com corrente uniforme (leitura de gráfico, lei de Ampère)_

```
A figura mostra o módulo do campo magnético, em função da distância radial $r$, dentro e fora de quatro fios: $a$, $b$, $c$ e $d$. Cada um dos fios conduz corrente uniformemente distribuída em sua seção transversal. Os trechos em que os gráficos correspondentes a dois fios se sobrepõem são indicados por duas letras. Sobre a intensidade do campo magnético na superfície de cada fio, é correto afirmar que

  A) $B_a > B_c > B_b = B_d$
  B) $B_c > B_a > B_b = B_d$
  C) $B_a > B_c > B_b > B_d$
  D) $B_c > B_a > B_d > B_b$
  E) $B_a = B_b = B_c = B_d$
```
Gabarito: **C**
  *(esta questão tem figura)*

</details>

### Indução Eletromagnética

5 questão(ões) na prova prevista · 34 no acervo deste slot.

- Fem motriz (barra condutora em movimento num campo magnético)
- Variação de fluxo magnético em espiras com diferentes movimentos
- Lei de Lenz aplicada a um circuito de área variável (trilhos condutores)
- Transiente inicial de circuito RL (indutor como circuito aberto em t=0)
- Fem induzida ao entrar num campo magnético (dependência da geometria da espira)
- Transiente inicial de circuito com indutor em paralelo com resistor
- Corrente induzida por campo magnético crescente numa espira circular
- Energia armazenada num indutor durante o transiente de um circuito RL
- Fluxo magnético e corrente induzida numa bobina alinhada a um solenoide
- Fem induzida em espiras por corrente variável num fio longo
- Fem induzida pela variação temporal de um campo magnético
- Gerador CA: fem nula quando o fluxo magnético é máximo
- Sentido da corrente induzida com campo magnético variável no tempo
- Transiente inicial de circuito RL com duas lâmpadas em paralelo
- Regime permanente de circuito RL com duas lâmpadas em paralelo
- Fem induzida numa barra condutora em movimento (fem motional)
- Corrente induzida por movimento relativo entre dois solenoides
- Polaridade da fem autoinduzida num indutor com corrente decrescente
- Transiente de circuito com resistores, indutor e capacitor
- Fem de movimento: força para puxar uma barra sobre trilhos
- Lei de Faraday e lei de Lenz: fem e sentido da corrente
- Fem de movimento: avião no campo magnético terrestre
- Conceitos da lei de Faraday e campos elétricos induzidos
- Indutor: relação entre a ddp e a variação da corrente
- Lei de Faraday em bobinas acopladas por núcleo de ferro
- F.e.m. de movimento e sentido da corrente induzida
- Potência dissipada pela f.e.m. de movimento
- Circuito RL: corrente logo após a abertura da chave
- F.e.m. de movimento e força de freio (lei de Lenz)
- Corrente induzida a partir do gráfico da corrente indutora
- Lei de Faraday e lei de Lenz (verdadeiro ou falso)
- Fem de movimento com ângulo entre velocidade e campo
- Sentido da corrente induzida com campo dependente do tempo
- Variação de fluxo em espiras que oscilam

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p3** · medio · _Fem motriz (barra condutora em movimento num campo magnético)_

```
Uma diferença de potencial de $27\text{ mV}$ é estabelecida através de uma barra de comprimento $9{,}0\text{ cm}$ quando ela se move a $21{,}6\text{ km/h}$ na presença de um campo magnético constante, homogêneo e perpendicular ao plano da figura (as cargas positivas se acumulam na extremidade superior da barra, indicada por $+$, e as negativas na extremidade inferior, indicada por $-$, com a barra se movendo para a esquerda). A intensidade e o sentido do campo magnético são:

  A) 50 mT, para fora da página.
  B) 14 mT, para fora da página.
  C) 140 mT, para dentro da página.
  D) 14 mT, para fora da página.
  E) 50 mT, para dentro da página.
```
Gabarito: **A**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p3** · medio · _Variação de fluxo magnético em espiras com diferentes movimentos_

```
As três espiras circulares da figura estão submetidas ao mesmo campo magnético uniforme $\vec{B}$, que aponta para fora do papel. As espiras 1 e 2 estão penduradas cada uma na extremidade de uma corda, sendo que a espira 1 oscila como um pêndulo (seu plano permanece sempre perpendicular a $\vec{B}$) e a espira 2 gira em torno de seu eixo vertical (um diâmetro da espira). A espira 3 oscila verticalmente pendurada na extremidade de uma mola (seu plano também permanece sempre perpendicular a $\vec{B}$). Em qual(is) espira(s) ocorrerá fem induzida não nula?

  A) Nas espiras 1 e 2.
  B) Nas espiras 2 e 3.
  C) Somente na espira 1.
  D) Somente na espira 2.
  E) Somente na espira 3.
```
Gabarito: **D**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p3** · medio · _Lei de Lenz aplicada a um circuito de área variável (trilhos condutores)_

```
Uma barra condutora move-se para a esquerda com velocidade constante sobre trilhos condutores formando um circuito fechado, como mostra a figura (a barra se aproxima do lado fechado do circuito, diminuindo sua área). Uma corrente $I$ é induzida na direção indicada pelo movimento da barra no campo magnético uniforme $\vec{B}$ existente na região onde se encontra o circuito. Qual das afirmações abaixo sobre $\vec{B}$ é correta?

  A) $\vec{B}$ aponta para a esquerda.
  B) $\vec{B}$ aponta para a direita.
  C) $\vec{B}$ é paralelo à barra.
  D) $\vec{B}$ aponta para fora do papel.
  E) $\vec{B}$ aponta para dentro do papel.
```
Gabarito: **D**
  *(esta questão tem figura)*

</details>

### Oscilações Eletromagnéticas e CA

3 questão(ões) na prova prevista · 21 no acervo deste slot.

- Impedância independente da frequência (circuito puramente resistivo)
- Ressonância em circuito RLC série (cancelamento das reatâncias)
- Circuito LC ideal: conservação de energia elétrica-magnética
- Potência média em circuito RLC via fator de potência
- Fase da corrente e das tensões num circuito RLC série
- Identificação da ressonância via diagrama de fasores
- Corrente num circuito LC em função da fração de carga do capacitor
- Tensão e corrente rms num circuito RLC série com fonte alternada
- Comportamento assintótico da impedância de um circuito RLC com a frequência
- Indutância a partir da d.d.p. máxima num indutor
- Fase corrente-fem e potência média num resistor em CA
- Amplitude de corrente em circuito RL com fonte CA
- Ressonância em circuito RLC série: amplitude e fase da corrente
- Amplitude da corrente em circuito RLC série via impedância
- Oscilações LC: troca de energia entre capacitor e indutor
- Energia armazenada num circuito LC
- Corrente máxima em um circuito LC ideal
- Troca de energia em um circuito LC ideal
- Corrente no indutor em circuito RLC paralelo
- Ressonância em circuito RLC série
- Diagrama de fasores de um circuito LC

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p3** · medio · _Impedância independente da frequência (circuito puramente resistivo)_

```
A corrente de pico num circuito de corrente alternada não depende da frequência da fonte de fem alternada. Além da fonte, de que combinação de elementos pode ser formado esse circuito?

  A) somente resistor.
  B) somente capacitor.
  C) somente indutor.
  D) resistor e indutor.
  E) indutor e capacitor.
```
Gabarito: **A**

**fis2-uff-2025.2-p3** · medio · _Ressonância em circuito RLC série (cancelamento das reatâncias)_

```
Em um circuito RLC em série operando com corrente alternada, o diagrama de fasores mostra que o fasor da tensão no indutor está $90°$ adiantado em relação ao fasor da corrente, enquanto o fasor da tensão no capacitor está $90°$ atrasado. Se as amplitudes das tensões no indutor e no capacitor forem iguais, o que se pode concluir sobre o comportamento do circuito?

  A) O circuito é puramente resistivo e a impedância é máxima.
  B) O circuito é predominantemente capacitivo, com corrente adiantada.
  C) O circuito está em ressonância, com fator de potência igual a 1.
  D) A potência dissipada no resistor é zero.
  E) A tensão da fonte não está em fase com a tensão no resistor.
```
Gabarito: **C**

**fis2-uff-2025.2-p3** · medio · _Circuito LC ideal: conservação de energia elétrica-magnética_

```
Um capacitor de $C = 3{,}0\ \mu\text{F}$ é carregado por uma fonte de $V_0 = 120\text{ V}$ e, em seguida, é conectado a um indutor de $L = 0{,}080\text{ H}$, formando um circuito LC ideal. Qual é o valor aproximado da corrente máxima no circuito?

  A) 0,25 A
  B) 0,74 A
  C) 1,23 A
  D) 1,0 A
  E) 0,42 A
```
Gabarito: **B**

</details>

## O JSON que você entrega

Um array por lote, em `listas_questoes/gerado/`, no mesmo formato que o importador já lê
(ver `AGENTE_PROVA_UFF_FIS2.md` pra o contrato completo de campos e imagens):

```json
[
  {
    "materia": "Física II",
    "topico": "O Campo Magnético",
    "subtopico": "o arquétipo que esta questão cobra",
    "dificuldade": "medio",
    "instituicao": "Expectrum",
    "ano": 2026,
    "enunciado": "…",
    "alternativas": { "a": "…", "b": "…", "c": "…", "d": "…", "e": "…" },
    "gabarito": "c",
    "resolucao": "…",
    "tikz_code": null
  }
]
```

Cinco alternativas, como a prova. `desafio` fica de fora (ou `false`): o que se está
escrevendo aqui é questão **de prova**, não aprofundamento.

## Depois

O arquivo entra por `/importar`. A fila de revisão mostra cada questão com o LaTeX
renderizado e a checagem de duplicata; **nada vai pro banco sem alguém aprovar**. Assim que
aprovadas, elas entram no sorteio normal e na **prova prevista** deste slot, porque a
previsão sorteia por tópico e dificuldade — não por origem.