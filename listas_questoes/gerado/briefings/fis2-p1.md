# Briefing da banca — Física II · UFF · P1

Gerado por `scripts/briefing-banca.ts` a partir de **7 provas reais** (2022.1 → 2025.2), 103 questões.

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
| A Lei de Gauss | 6 | 7 de 7 | 4–8 |
| O Campo Elétrico | 5 | 7 de 7 | 3–6 |
| A Lei de Coulomb | 3 | 7 de 7 | 2–3 |
| Potencial Elétrico | 1 | 3 de 7 | 0–4 |
| Capacitores e Capacitância | 0 | 1 de 7 | 0–1 |

Mix de dificuldade (ponderado por recência): **medio** 49% · **facil** 33% · **dificil** 18%.

## Arquétipos por tópico

Cada linha é um `subtopico` de uma prova real — é o inventário do que esta banca pergunta.
Escreva questões que caiam NESTES arquétipos, com situação física e números novos.

### A Lei de Gauss

6 questão(ões) na prova prevista · 42 no acervo deste slot.

- Condutores em equilíbrio eletrostático
- Indução em casca esférica condutora com carga puntiforme no centro
- Campo elétrico de esfera uniformemente carregada (leitura de gráfico)
- Fluxo elétrico por simetria (carga no centro de um cubo imaginário)
- Indução em condutores concêntricos (esfera + casca esférica)
- Fluxo elétrico com duas cargas puntiformes de sinais opostos
- Independência do fluxo elétrico em relação ao tamanho da superfície gaussiana
- Indução em casca esférica condutora com esfera condutora carregada no centro
- Superposição de campos de planos infinitos isolantes com densidades de carga diferentes
- Campo elétrico dentro e na superfície de esferas dielétricas de raios e cargas diferentes
- Campo elétrico dentro e fora de esfera não condutora com densidade volumétrica uniforme
- Densidade superficial que anula o campo elétrico externo de um fio revestido por casca cilíndrica
- Comparação do campo elétrico de esferas carregadas de raios diferentes num ponto à mesma distância
- Fluxo do campo elétrico através de uma superfície inclinada num campo homogêneo
- Comparação do fluxo elétrico por superfícies idênticas ao redor de fio finito e infinito
- Campo elétrico nulo dentro de condutor em equilíbrio
- Fluxo elétrico através de superfície esférica
- Lei de Gauss: fluxo x campo elétrico
- Cargas induzidas em casca condutora esférica
- Cancelamento do campo elétrico externo por casca condutora
- Fluxo elétrico não uniforme numa superfície cilíndrica
- Afirmações conceituais sobre a lei de Gauss
- Propriedades dos condutores em equilíbrio eletrostático
- Campo no interior de uma casca esférica condutora
- Superposição dos campos de dois planos carregados
- Campo elétrico de cilindros condutores coaxiais
- Leitura do gráfico de E(r) para esfera e casca esférica
- Fluxo elétrico em superfícies fechadas e condutor com cavidade
- Cargas induzidas nas superfícies de uma casca condutora
- Densidade de carga induzida na superfície interna de casca esférica condutora
- Campo elétrico entre duas placas isolantes com densidades opostas
- Fluxo elétrico pela superfície lateral de um cone sem carga interna
- Julgamento de afirmações sobre fluxo elétrico nulo e campo em condutores
- Fluxo elétrico por uma face de um cubo em campo uniforme
- Distribuição da carga na superfície de um condutor de forma qualquer
- Campo elétrico a uma distância da superfície de uma esfera carregada
- Campo radial de uma casca esférica carregada
- Fluxo elétrico e argumentos de simetria
- Fluxo através de superfície que envolve um dipolo
- Esfera isolante dentro de casca condutora e leitura do gráfico de E

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p1** · facil · _Condutores em equilíbrio eletrostático_

```
Qual das afirmações abaixo é verdadeira?

  A) A lei de Gauss só vale para distribuições simétricas de carga
  B) O campo elétrico é perpendicular à superfície de um condutor carregado em equilíbrio eletrostático
  C) No interior de um condutor carregado em equilíbrio eletrostático, a densidade volumétrica de carga é diferente de zero
  D) Na superfície de um condutor carregado em equilíbrio eletrostático, o campo elétrico é zero
  E) O campo elétrico é tangente à superfície de um condutor carregado em equilíbrio eletrostático
```
Gabarito: **B**

**fis2-uff-2025.2-p1** · medio · _Indução em casca esférica condutora com carga puntiforme no centro_

```
Uma casca esférica condutora de raio interno $a$ e raio externo $b$ possui uma carga líquida $Q$. Uma carga puntiforme $q$ é colocada no centro da casca. Qual é a carga total na superfície externa da casca?

  A) 0
  B) $q$
  C) $-q$
  D) $Q$
  E) $Q+q$
```
Gabarito: **E**

**fis2-uff-2025.2-p1** · dificil · _Campo elétrico de esfera uniformemente carregada (leitura de gráfico)_

```
A figura abaixo mostra o módulo do campo elétrico do lado de dentro e do lado de fora de uma esfera com uma distribuição uniforme de cargas positivas, em função da distância do centro da esfera. Qual é o valor aproximado da carga total da esfera?

  A) $3{,}2\times10^{-9}\text{ C}$
  B) $3{,}2\times10^{-6}\text{ C}$
  C) $4{,}4\times10^{-7}\text{ C}$
  D) $2{,}2\times10^{-2}\text{ C}$
  E) $2{,}2\times10^{-6}\text{ C}$
```
Gabarito: **E**
  *(esta questão tem figura)*

</details>

### O Campo Elétrico

5 questão(ões) na prova prevista · 34 no acervo deste slot.

- Superposição de campos elétricos de cargas puntiformes (direção)
- Energia potencial de um dipolo elétrico em campo uniforme
- Torque e força sobre um dipolo elétrico em campo uniforme
- Movimento de partícula carregada em campo uniforme (deflexão tipo projétil)
- Ponto de campo elétrico nulo entre/fora de duas cargas puntiformes
- Movimento de elétron e próton num campo elétrico uniforme (comparação de acelerações)
- Força sobre cargas de prova em diferentes pontos de um campo uniforme
- Carga total e campo elétrico de uma linha semicircular com densidade de carga variável
- Superposição de campos elétricos em vértices de um quadrado (cargas distintas)
- Aproximação de carga puntiforme para bastão carregado visto de longe
- Torque e força sobre um dipolo elétrico em campo uniforme e não uniforme
- Existência de campo elétrico versus existência de força num ponto vazio do espaço
- Movimento de elétron e próton liberados entre placas com campo elétrico uniforme
- Campo elétrico no centro de um círculo formado por dois arcos de cargas opostas
- Campo elétrico no centro de um anel uniformemente carregado
- Campo elétrico entre placas paralelas infinitas
- Campo elétrico de um dipolo no eixo axial
- Movimento de carga no eixo de um anel carregado
- Campo de um conjunto de cargas e movimento de elétrons
- Movimento de carga em campo elétrico uniforme entre placas
- Força e aceleração de uma carga em campo uniforme
- Superposição dos campos de duas esferas carregadas
- Campo de uma distribuição linear não homogênea
- Cálculo de carga desconhecida para campo elétrico nulo na origem
- Ganho de energia cinética de íon ao atravessar campo entre placas
- Independência da magnitude do campo elétrico em relação ao sinal da carga fonte
- Direção do campo elétrico a partir da trajetória de uma partícula carregada
- Dipolo elétrico em campo não uniforme
- Campo de uma distribuição linear finita de carga
- Equilíbrio entre força elétrica e peso
- Partilha de carga entre esferas condutoras idênticas
- Direção do campo de um fio com densidade não uniforme

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p1** · facil · _Superposição de campos elétricos de cargas puntiformes (direção)_

```
A figura mostra duas cargas elétricas de mesmo módulo e sinais opostos. Algumas linhas do campo elétrico são mostradas. Qual das setas representa corretamente o vetor campo elétrico no ponto P?

  A) A
  B) B
  C) C
  D) D
  E) O campo elétrico é zero
```
Gabarito: **A**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p1** · medio · _Energia potencial de um dipolo elétrico em campo uniforme_

```
Uma molécula de água no estado de vapor tem um momento de dipolo elétrico cujo módulo é $6{,}2\times10^{-30}\text{ C}\cdot\text{m}$. Considere que a molécula seja submetida a um campo elétrico de $1{,}5\times10^{4}\text{ N/C}$. Que quantidade de energia é necessária para fazer a molécula girar de $180^\circ$ na presença desse campo, partindo de uma posição em que a energia potencial é mínima ($\phi = 0^\circ$)?

  A) $9{,}3\times10^{-26}\text{ J}$
  B) $1{,}9\times10^{-25}\text{ J}$
  C) $4{,}7\times10^{-26}\text{ J}$
  D) $9{,}0\times10^{-26}\text{ J}$
  E) $0$
```
Gabarito: **B**

**fis2-uff-2025.2-p1** · facil · _Torque e força sobre um dipolo elétrico em campo uniforme_

```
A figura mostra um dipolo elétrico que acaba de ser liberado em repouso numa região em que o campo elétrico é uniforme. Qual das opções abaixo descreve corretamente o torque resultante e a força resultante sobre o dipolo?

  A) Torque zero e força zero
  B) Torque no sentido horário e força zero
  C) Torque no sentido anti-horário e força zero
  D) Torque no sentido horário e força para a direita
  E) Torque no sentido anti-horário e força para a direita
```
Gabarito: **B**
  *(esta questão tem figura)*

</details>

### A Lei de Coulomb

3 questão(ões) na prova prevista · 17 no acervo deste slot.

- Carga por contato entre condutores idênticos
- Superposição de forças elétricas em triângulo equilátero
- Força elétrica e dinâmica (2ª lei de Newton)
- Eletrização por indução em esferas condutoras em contato
- Indução eletrostática num condutor neutro isolado, sem contato
- Atração entre um isolante carregado e um condutor neutro por indução
- Equilíbrio de três cargas puntiformes sobre uma reta
- Distância de equilíbrio da terceira carga entre duas cargas fixas
- Força elétrica resultante de duas cargas puntiformes
- Carga por indução em condutores em contato
- Conservação e redistribuição de carga entre condutores
- Força resultante de cargas nos vértices de um quadrado
- Indução eletrostática e atração de um condutor neutro
- Redistribuição de carga por contato entre esferas condutoras idênticas
- Componentes da força elétrica resultante sobre uma carga puntiforme
- Força resultante por superposição e simetria
- Eletrização por indução em condutores

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p1** · facil · _Carga por contato entre condutores idênticos_

```
Duas esferas condutoras idênticas, A e B, possuem cargas iniciais $q_A = +12\text{ nC}$ e $q_B = -4\text{ nC}$. Elas são colocadas em contato e, após atingirem o equilíbrio eletrostático, são separadas. Em seguida, uma terceira esfera idêntica C, inicialmente descarregada, é colocada em contato primeiro com a esfera A e depois com a esfera B. Qual é a carga final da esfera C?

  A) +2 nC
  B) +3 nC
  C) +4 nC
  D) +6 nC
  E) +8 nC
```
Gabarito: **B**

**fis2-uff-2025.2-p1** · medio · _Superposição de forças elétricas em triângulo equilátero_

```
Três partículas de mesma carga $Q$ ocupam os vértices de um triângulo equilátero, como mostra a figura. Cada lado do triângulo tem comprimento $d$. Quais são o módulo e a orientação da força elétrica resultante sobre a carga que está no vértice superior do triângulo? Informações úteis: $\text{sen }45^\circ = \cos 45^\circ = \sqrt{2}/2$; $\text{sen }60^\circ = \sqrt{3}/2$; $\cos 60^\circ = 1/2$.

  A) $k\sqrt{3}Q^2/d^2$ para cima
  B) $k\sqrt{3}Q^2/d^2$ para baixo
  C) $k\sqrt{2}Q^2/d^2$ para cima
  D) $k\sqrt{2}Q^2/d^2$ para baixo
  E) $2kQ^2/d^2$ para cima
```
Gabarito: **A**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p1** · medio · _Força elétrica e dinâmica (2ª lei de Newton)_

```
Duas esferas de $1{,}0\text{ g}$ são carregadas igualmente e mantidas separadas por $2{,}0\text{ cm}$. Quando soltas, elas imediatamente adquirem uma aceleração de módulo $150\text{ m/s}^2$. Qual é o valor absoluto da carga de cada esfera, aproximadamente?

  A) $8{,}2\text{ nC}$
  B) $8{,}2\text{ C}$
  C) $82\text{ nC}$
  D) $580\text{ nC}$
  E) $5{,}8\text{ nC}$
```
Gabarito: **C**

</details>

### Potencial Elétrico

1 questão(ões) na prova prevista · 9 no acervo deste slot.

- Trabalho do campo elétrico via diferença de potencial (duas cargas fixas)
- Trabalho e energia cinética via diferença de potencial (próton vs. elétron)
- Energia potencial elétrica de três cargas puntiformes
- Variação de energia potencial em capacitor de placas paralelas
- Energia de escape de elétron perto de esfera carregada
- Força conservativa e definição de potencial
- Energia potencial e cinética de um elétron
- Comparação de potenciais pela variação de energia cinética
- Energia potencial de um conjunto de cargas puntiformes

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p1** · dificil · _Trabalho do campo elétrico via diferença de potencial (duas cargas fixas)_

```
Duas cargas pontuais estão fixas e separadas pela distância de $1{,}00\times10^{-2}\text{ m}$. O valor de uma das cargas é $-2{,}8\times10^{-8}\text{ C}$ e o da outra é $+2{,}8\times10^{-8}\text{ C}$. Os pontos A e B estão situados a $2{,}5\times10^{-3}\text{ m}$ da carga inferior e da carga superior, respectivamente, conforme a figura. Se um próton, cuja carga elétrica é $1{,}60\times10^{-19}\text{ C}$, é deslocado do ponto A ao ponto B, qual é o trabalho realizado pelo campo elétrico criado pelas cargas fixas?

  A) $4{,}3\times10^{-15}\text{ J}$
  B) $-5{,}4\times10^{-15}\text{ J}$
  C) $-2{,}1\times10^{-14}\text{ J}$
  D) $2{,}1\times10^{-14}\text{ J}$
  E) $0$
```
Gabarito: **C**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p1** · facil · _Trabalho e energia cinética via diferença de potencial (próton vs. elétron)_

```
Qual é a razão $|\Delta V_p|/|\Delta V_e|$ entre os módulos das diferenças de potencial que aceleram um próton e um elétron, partindo do repouso, até a mesma energia cinética? As massas do próton e do elétron são $m_p$ e $m_e$, respectivamente.

  A) $(m_p/m_e)^{1/2}$
  B) $(m_e/m_p)^{1/2}$
  C) $2$
  D) $1$
  E) $1/2$
```
Gabarito: **D**

**fis2-uff-2024.1-p1** · medio · _Energia potencial elétrica de três cargas puntiformes_

```
Três cargas pontuais se localizam nos vértices do triângulo equilátero da figura de lado igual a 1 m. Sabendo-se que a carga $q=1C$, a energia potencial eletrostática do sistema se aproxima mais do item: Considere a constante eletrostática $K=9,0\times10^{9}\ \text{N}\cdot\text{m}^2/\text{C}^2$.

  A) $+1,0\times10^{10}$ J
  B) $-5,0\times10^{9}$ J
  C) $+2,7\times10^{8}$ J
  D) $-2,7\times10^{10}$ J
  E) $+4,4\times10^{10}$ J
```
Gabarito: **D**
  *(esta questão tem figura)*

</details>

### Capacitores e Capacitância

0 questão(ões) na prova prevista · 1 no acervo deste slot.

- Campo elétrico uniforme entre as placas de um capacitor de placas paralelas

<details><summary>Exemplares (1 mais recentes)</summary>

**fis2-uff-2024.2-p1** · facil · _Campo elétrico uniforme entre as placas de um capacitor de placas paralelas_

```
Um capacitor é um dispositivo eletrônico formado por duas placas metálicas idênticas, carregadas com cargas $\pm Q$, separadas por uma distância $d$, conforme ilustrado abaixo.

Capacitores comerciais são construídos com placas cujos diâmetros são muito maiores que a separação $d$ e são de grande interesse em aplicações de eletrônica. Considerando o capacitor comercial abaixo, com a origem do referencial na placa negativa, assinale a opção que melhor descreve a intensidade do campo elétrico entre as placas carregadas $\pm Q$ (gráfico de $E$ em função de $x$, com $x$ indo de $0$, na placa negativa, até $d$, na placa positiva).

  A) A
  B) B
  C) C
  D) D
  E) E
```
Gabarito: **D**
  *(esta questão tem figura)*

</details>

## O JSON que você entrega

Um array por lote, em `listas_questoes/gerado/`, no mesmo formato que o importador já lê
(ver `AGENTE_PROVA_UFF_FIS2.md` pra o contrato completo de campos e imagens):

```json
[
  {
    "materia": "Física II",
    "topico": "A Lei de Gauss",
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