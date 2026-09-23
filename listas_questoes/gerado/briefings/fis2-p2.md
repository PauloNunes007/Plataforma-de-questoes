# Briefing da banca — Física II · UFF · P2

Gerado por `scripts/briefing-banca.ts` a partir de **8 provas reais** (2022.1 → 2025.2), 120 questões.

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
| Circuitos de Corrente Contínua | 5 | 8 de 8 | 3–9 |
| Potencial Elétrico | 5 | 7 de 8 | 0–7 |
| Capacitores e Capacitância | 3 | 8 de 8 | 2–4 |
| Corrente e Resistência Elétricas | 2 | 8 de 8 | 1–4 |
| O Campo Elétrico | 0 | 1 de 8 | 0–1 |

Mix de dificuldade (ponderado por recência): **medio** 65% · **facil** 24% · **dificil** 11%.

## Arquétipos por tópico

Cada linha é um `subtopico` de uma prova real — é o inventário do que esta banca pergunta.
Escreva questões que caiam NESTES arquétipos, com situação física e números novos.

### Circuitos de Corrente Contínua

5 questão(ões) na prova prevista · 45 no acervo deste slot.

- Resistores idênticos em paralelo e corrente limite (fusível)
- Resistor em série com associação em paralelo (queda de tensão parcial)
- Constante de tempo RC com resistores em série e capacitores em paralelo
- Carga de capacitor em circuito RC (regime transiente)
- Curto-circuito ao fechar uma chave em paralelo com uma lâmpada
- Tempo para atingir uma fração da carga máxima num circuito RC
- Lei das malhas com múltiplas baterias reais em série e em paralelo
- Lei dos nós de Kirchhoff como consequência da conservação de carga
- Máxima transferência de potência a um resistor variável
- Associação série-paralelo de resistores
- Tempo para atingir uma tensão específica num circuito RC
- Mudança de brilho de uma lâmpada ao alterar a topologia do circuito
- Circuito com resistor variável identificado via gráfico corrente × resistência
- Circuito RC em carga: instante em que a tensão no capacitor iguala a tensão no resistor
- Resistência equivalente de um circuito com interruptores e resistores em série/paralelo
- Potência dissipada em circuito resistivo com resistor em ponte
- Carga total via integração da corrente no tempo
- Transitório RC: tensões no resistor e no capacitor
- Curva de carregamento de capacitor em circuito RC
- Resistência equivalente em série e em paralelo
- Potência dissipada em resistores em série
- Efeito de fechar a chave num circuito com lâmpada
- FEM, resistência interna e potência no resistor externo
- Resistência interna a partir da queda de tensão
- Carga de circuito RC e energia no capacitor
- Corrente no amperímetro com chave aberta e fechada
- Fem a partir das curvas características de resistor ôhmico e não-ôhmico
- Resistor variável em paralelo com bateria ideal
- Bateria real: resistência interna e corrente de curto-circuito
- Leis de Kirchhoff em circuito de duas malhas
- Resistor shunt em paralelo com amperímetro
- Diferença de potencial em resistor e lâmpada em série
- Potência dissipada a partir do gráfico energia × tempo
- Resistores em paralelo ligados diretamente à bateria ideal
- Bateria real com resistência interna e resistor externo
- Descarga de capacitor através de um resistor
- Determinação da fem por análise de nós com voltímetro
- Reconfiguração de resistores em série para paralelo
- Brilho relativo de lâmpadas em circuito misto
- Definição de força eletromotriz
- Brilho de lâmpadas em série e paralelo
- Corrente em ramo ligado direto a uma fonte
- Carga de um circuito RC em série
- Descarga RC e tempo para meia energia

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p2** · medio · _Resistores idênticos em paralelo e corrente limite (fusível)_

```
Lâmpadas idênticas são ligadas em paralelo a uma bateria de $12\text{ V}$. Cada lâmpada dissipa a potência de $6\text{ W}$. O circuito tem um fusível F que queima quando a corrente é igual ou superior a $9\text{ A}$. Qual é o maior número de lâmpadas que podem ser usadas neste circuito sem queimar o fusível?

  A) 9
  B) 17
  C) 25
  D) 34
  E) 36
```
Gabarito: **B**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p2** · medio · _Resistor em série com associação em paralelo (queda de tensão parcial)_

```
Um trecho de um circuito tem três resistores conforme a figura: um resistor de $10\ \Omega$ em série com uma associação em paralelo de $60\ \Omega$ e $30\ \Omega$. A diferença de potencial $\Delta V = V_A - V_B$ entre os pontos A e B é de $30\text{ V}$. Qual é a queda de voltagem através do resistor de $30\ \Omega$?

  A) 10 V
  B) 20 V
  C) 30 V
  D) 60 V
  E) 100 V
```
Gabarito: **B**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p2** · medio · _Constante de tempo RC com resistores em série e capacitores em paralelo_

```
Um circuito RC é montado com dois resistores conectados em série, tais que $R_1 = 200\ \Omega$ e $R_2 = 300\ \Omega$, e dois capacitores com capacitâncias $C_1$ e $C_2 = 6\ \mu\text{F}$ conectados em paralelo. A constante de tempo do circuito é $\tau = 7\text{ ms}$. Nessas condições, a capacitância $C_1$ vale

  A) 1 μF
  B) 2 μF
  C) 4 μF
  D) 6 μF
  E) 8 μF
```
Gabarito: **E**

</details>

### Potencial Elétrico

5 questão(ões) na prova prevista · 36 no acervo deste slot.

- Trabalho por unidade de carga (ddp) entre infinito e ponto equidistante de um dipolo
- Superfícies equipotenciais a partir de V(x)
- Potencial de um anel de carga não uniforme, fora do eixo de simetria de carga
- Potencial dentro e fora de uma esfera condutora carregada (leitura de gráfico)
- Comportamento qualitativo do potencial dentro de uma esfera isolante uniformemente carregada
- Relação entre linhas de campo, equipotenciais e comparação de potenciais
- Potencial constante no interior de um condutor em equilíbrio
- Energia potencial elétrica de um sistema de três cargas
- Sentido do movimento espontâneo de uma carga negativa
- Conservação de energia de um bastão carregado num campo não uniforme
- Potencial elétrico no centro de um quadrado com quatro cargas iguais
- Relação entre campo elétrico radial e diferença de potencial via integração
- Conservação de energia com energia potencial elétrica de um sistema de cargas
- Campo elétrico obtido do gradiente do potencial em duas dimensões
- Energia cinética a partir da variação de energia potencial elétrica entre duas cargas
- Direção e módulo do campo elétrico a partir do espaçamento de superfícies equipotenciais
- Movimento de uma carga a partir do gráfico do potencial elétrico
- Variação de energia potencial elétrica em deslocamento ao longo de uma equipotencial
- Diferença de potencial a partir do trabalho elétrico
- Diferença de potencial a partir do gráfico do campo elétrico
- Energia potencial elétrica convertida em energia cinética
- Campo elétrico a partir de superfícies equipotenciais
- Potencial de uma esfera condutora carregada
- Campo elétrico pela inclinação do gráfico $V \times r$
- Deslocamento perpendicular ao campo e trabalho nulo
- Potencial pela área sob o gráfico de $E_x$
- Variação de energia potencial em campo uniforme
- Energia mecânica de elétron no potencial de um anel carregado
- Esferas condutoras ligadas por fio: carga, potencial e densidade
- Superfícies equipotenciais e o vetor campo elétrico
- Campo elétrico a partir do gráfico do potencial
- Superposição de potenciais de cargas puntiformes
- Variação da energia potencial em campo elétrico uniforme
- Campo uniforme a partir de potenciais em três pontos
- Campo como gradiente do potencial em uma dimensão
- Potencial dentro e fora de uma esfera condutora

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p2** · medio · _Trabalho por unidade de carga (ddp) entre infinito e ponto equidistante de um dipolo_

```
Duas cargas de sinais opostos e mesmo módulo $Q = 0{,}82\text{ C}$ são mantidas fixas a $2{,}0\text{ m}$ de distância uma da outra, como mostra a figura. Se uma carga é trazida do infinito até o ponto P, qual é o trabalho por unidade de carga realizado pela força elétrica?

  A) infinito
  B) $1{,}8\times10^{9}\text{ J/C}$
  C) $3{,}7\times10^{9}\text{ J/C}$
  D) $9{,}2\times10^{8}\text{ J/C}$
  E) zero
```
Gabarito: **E**
  *(esta questão tem figura)*

**fis2-uff-2025.2-p2** · medio · _Superfícies equipotenciais a partir de V(x)_

```
O potencial elétrico numa certa região do espaço é $V = -8x^2 + 3x$, com $V$ em volts e $x$ em metros. Nessa região as superfícies equipotenciais são

  A) planos paralelos ao eixo $x$
  B) planos paralelos ao plano $yz$
  C) planos paralelos ao plano $xz$
  D) planos paralelos ao plano $xy$
  E) cilindros com eixo coincidente com o eixo $x$
```
Gabarito: **B**

**fis2-uff-2025.2-p2** · medio · _Potencial de um anel de carga não uniforme, fora do eixo de simetria de carga_

```
Uma haste fina de plástico tem a forma de uma circunferência de raio $R$. Um quarto da circunferência tem carga $-Q$ e o restante tem carga $2Q$. As cargas estão uniformemente distribuídas nas duas partes. O ponto $P$ está sobre o eixo do anel à distância $D$ do seu centro $C$. Com $k = 1/4\pi\varepsilon_0$, o potencial elétrico no ponto $P$ é dado por

  A) $kQ/(R^2+D^2)^{1/2}$
  B) $kQ/(R^2+D^2)$
  C) $k(5Q/4)/(R^2+D^2)^{1/2}$
  D) $k(5Q/4)/(R^2+D^2)$
  E) $kQ/D$
```
Gabarito: **A**
  *(esta questão tem figura)*

</details>

### Capacitores e Capacitância

3 questão(ões) na prova prevista · 19 no acervo deste slot.

- Independência da capacitância em relação à carga (capacitor isolado)
- Escala geométrica da capacitância de placas paralelas circulares
- Capacitores idênticos em série: carga e tensão
- Gráfico da tensão num capacitor carregado por corrente constante
- Energia armazenada em capacitores associados em paralelo
- Associação série-paralelo de capacitores: carga num ramo em paralelo
- Comparação de carga total em capacitores ligados separadamente, em paralelo e em série
- Carga em capacitores associados série-paralelo
- Propriedades de capacitores associados em série
- Densidade de energia elétrica em capacitor de placas paralelas
- Carga acumulada em capacitores de placas paralelas ligados em paralelo
- Associação de capacitores em série e paralelo
- Energia armazenada em um capacitor
- Associação de capacitores em série e em paralelo
- Capacitores em série com distância entre placas reduzida
- Capacitor de placas paralelas ligado à bateria com placas se aproximando
- Energia armazenada em ponte de capacitores idênticos
- Energia em associação mista de capacitores
- Afastamento das placas com bateria ligada

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p2** · facil · _Independência da capacitância em relação à carga (capacitor isolado)_

```
Duplica-se o módulo da carga nas placas de um capacitor de placas paralelas isolado. Qual das afirmações abaixo a respeito da capacitância do capacitor é verdadeira?

  A) A capacitância é reduzida à metade do seu valor original
  B) A capacitância é aumentada para o dobro do seu valor original
  C) A capacitância não muda.
  D) A capacitância depende do campo elétrico entre as placas.
  E) A capacitância depende da diferença de potencial elétrico entre as placas.
```
Gabarito: **C**

**fis2-uff-2025.2-p2** · medio · _Escala geométrica da capacitância de placas paralelas circulares_

```
Um capacitor ideal de placas paralelas é feito com placas circulares de tal modo que a capacitância é $C_0$. Se o diâmetro das placas e a separação entre elas forem dobrados, o novo valor de capacitância é $C$. Assinale abaixo a opção com a relação correta entre $C$ e $C_0$.

  A) $C = 2C_0$
  B) $C = C_0/2$
  C) $C = C_0$
  D) $C = 8C_0$
  E) $C = C_0/4$
```
Gabarito: **A**

**fis2-uff-2025.1-p2** · medio · _Capacitores idênticos em série: carga e tensão_

```
Uma bateria é usada para carregar uma combinação em série de dois capacitores idênticos. Se a fem da bateria for $V$ e a carga total $Q$ fluir através da bateria durante o processo de carregamento, então a carga na placa positiva de cada capacitor e a voltagem em cada capacitor são, respectivamente:

  A) Q/2 e V/2
  B) Q e V
  C) Q/2 e V
  D) Q e V/2
  E) Q e 2V
```
Gabarito: **D**

</details>

### Corrente e Resistência Elétricas

2 questão(ões) na prova prevista · 19 no acervo deste slot.

- Potência elétrica e custo de energia (kWh)
- Densidade de corrente uniforme e área da seção transversal
- Velocidade de deriva e densidade numérica de portadores
- Carga elétrica como área sob o gráfico corrente × tempo
- Resistência de um fio em função do comprimento e associação em paralelo
- Continuidade da corrente e densidade de corrente em fio com dois diâmetros
- Lei de Ohm, resistência e potência dissipada
- Densidade de corrente em condutores de seções diferentes
- Resistência em função do comprimento e do diâmetro
- Velocidade de deriva e área da seção reta
- Densidade de corrente e campo interno em resistores em série
- Densidade de corrente em fios de mesma resistividade
- Densidade de corrente e campo elétrico em resistores em série
- Corrente em fios de resistividades e comprimentos diferentes em série
- Conceitos de campo elétrico, corrente e carga superficial em condutores
- Resistência de fio cortado e potência dissipada
- Campo elétrico interno e condução em fios
- Densidade de corrente e dimensionamento de cabo

<details><summary>Exemplares (3 mais recentes)</summary>

**fis2-uff-2025.2-p2** · facil · _Potência elétrica e custo de energia (kWh)_

```
O monitor de um computador funciona com uma corrente de $0{,}30\text{ A}$ quando conectado a uma tomada de $110\text{ V}$. O monitor nunca é desligado. Qual é aproximadamente o gasto anual pela utilização do monitor, se o custo da eletricidade é de R\$0,90 por kWh?

  A) R\$70,00
  B) R\$95,00
  C) R\$140,00
  D) R\$260,00
  E) R\$289,00
```
Gabarito: **D**

**fis2-uff-2025.2-p2** · facil · _Densidade de corrente uniforme e área da seção transversal_

```
Dois fios feitos de materiais diferentes têm a mesma densidade de corrente uniforme. Se os fios transportam a mesma corrente, é correto afirmar que necessariamente

  A) seus comprimentos são iguais
  B) suas seções transversais têm a mesma área
  C) tanto seus comprimentos quanto suas seções transversais são iguais
  D) a diferença de potencial através deles é a mesma
  E) os campos elétricos neles são iguais
```
Gabarito: **B**

**fis2-uff-2025.1-p2** · facil · _Velocidade de deriva e densidade numérica de portadores_

```
A densidade de corrente é a mesma em dois fios. O fio A tem o dobro da densidade numérica de elétrons de condução do fio B. A velocidade de deriva dos elétrons em A é:

  A) o dobro da dos elétrons em B
  B) quatro vezes a dos elétrons em B
  C) metade da dos elétrons em B
  D) um quarto da dos elétrons em B
  E) a mesma que a dos elétrons em B
```
Gabarito: **C**

</details>

### O Campo Elétrico

0 questão(ões) na prova prevista · 1 no acervo deste slot.

- Força restauradora no eixo de um anel carregado

<details><summary>Exemplares (1 mais recentes)</summary>

**fis2-uff-2023.1-p2** · medio · _Força restauradora no eixo de um anel carregado_

```
Um elétron descreve um movimento oscilatório sobre o eixo de coordenada $z$, devido ao potencial eletrostático criado por um anel de raio $R$ e carga total $Q > 0$ situado no plano $z = 0$, como mostra a figura. A força de restauração que o elétron experimenta durante esse movimento oscilatório é: ($e$ é a carga elétrica fundamental e $\hat{k}$ o versor do eixo $z$.)

  A) $\vec{F} = -\dfrac{eQ}{4\pi\varepsilon_0}\dfrac{z}{(z^2+R^2)^{3/2}}\,\hat{k}$
  B) $\vec{F} = \dfrac{eQ}{4\pi\varepsilon_0}\dfrac{z}{(z^2+R^2)^{3/2}}\,\hat{k}$
  C) $\vec{F} = \dfrac{eQ}{4\pi\varepsilon_0}\dfrac{1}{(z^2+R^2)^{3/2}}\,\hat{k}$
  D) $\vec{F} = -\dfrac{eQ}{4\pi\varepsilon_0}\dfrac{1}{\sqrt{z^2+R^2}}\,\hat{k}$
  E) $\vec{F} = -\dfrac{eQ}{4\pi\varepsilon_0}\dfrac{z}{\sqrt{z^2+R^2}}\,\hat{k}$
```
Gabarito: **A**
  *(esta questão tem figura)*

</details>

## O JSON que você entrega

Um array por lote, em `listas_questoes/gerado/`, no mesmo formato que o importador já lê
(ver `AGENTE_PROVA_UFF_FIS2.md` pra o contrato completo de campos e imagens):

```json
[
  {
    "materia": "Física II",
    "topico": "Circuitos de Corrente Contínua",
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