# Briefing da banca — Física I · UFF · P2

Gerado por `scripts/briefing-banca.ts` a partir de **21 provas reais** (2014.1 → 2026.1), 293 questões.

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

A próxima edição deve ter **14 questões**, assim distribuídas:

| tópico | questões previstas | apareceu em | faixa por prova |
|---|---|---|---|
| Energia | 4 | 19 de 21 | 0–8 |
| Impulso e Momento Linear | 4 | 20 de 21 | 0–11 |
| Dinâmica do Movimento no Plano | 2 | 7 de 21 | 0–4 |
| Trabalho | 1 | 14 de 21 | 0–9 |
| Dinâmica do Movimento Retilíneo | 1 | 4 de 21 | 0–2 |
| A Terceira Lei de Newton | 1 | 5 de 21 | 0–1 |
| Força e Movimento | 1 | 4 de 21 | 0–2 |
| Cinemática em Duas Dimensões | 0 | 2 de 21 | 0–3 |
| Rotação de Corpo Rígido | 0 | 9 de 21 | 0–9 |
| Gravitação | 0 | 1 de 21 | 0–1 |

Mix de dificuldade (ponderado por recência): **medio** 53% · **dificil** 26% · **facil** 21%.

⚠️ Confiança **media**: a composição varia bastante entre edições. Use a tabela como tendência, não como gabarito de proporções.

## Arquétipos por tópico

Cada linha é um `subtopico` de uma prova real — é o inventário do que esta banca pergunta.
Escreva questões que caiam NESTES arquétipos, com situação física e números novos.

### Energia

4 questão(ões) na prova prevista · 77 no acervo deste slot.

- Taxa de variação da energia cinética na queda livre
- Conservação de energia mecânica em rampa sem atrito
- Força a partir do gráfico de energia potencial elástica
- Velocidade máxima no ponto de energia potencial mínima
- Balanço de energia na velocidade terminal
- Energia cinética máxima e mínima a partir de gráfico de energia potencial
- Par de energia mecânica total e energia potencial fisicamente possível
- Velocidade de lançamento de bola por mola comprimida na horizontal a partir de calibração vertical
- Altura de lançamento em rampa circular para normal igual ao peso num ponto lateral
- Independência da velocidade final em relação à direção de lançamento — conservação de energia
- Variação de energia cinética em lançamento oblíquo via conservação de energia mecânica
- Bloco preso a mola vertical via polia — velocidade após queda livre parcial
- Comparação de energias cinéticas a partir de vetores velocidade
- Velocidade em fração da altura máxima de lançamento vertical
- Arbitrariedade do referencial de energia potencial — sinal negativo
- Rapidez conservada vs. velocidade vetorial ao retornar a um ponto
- Velocidade e ponto de retorno a partir de um poço de energia potencial
- Energia cinética no ponto mais alto de um lançamento oblíquo
- Arbitrariedade do referencial de energia potencial
- Velocidade máxima a partir de um diagrama de energia potencial
- Conservação de energia mecânica numa superfície curva sem atrito
- Energia potencial gravitacional no ponto mais alto de um lançamento oblíquo
- Interpretação de um gráfico de energia potencial U(x): repouso, equilíbrio estável e energia cinética máxima
- Altura máxima em loop vertical (vale + colina) para manter contato com o trilho — conservação de energia
- Compressão máxima de mola em função da velocidade inicial — conservação de energia
- Gráfico de energia potencial — pontos de energia cinética máxima/mínima e região de movimento permitido
- Perda de energia por atrito num trecho plano entre duas rampas lisas — trajetória de vaivém
- Energia potencial polinomial U(x) — conservação de energia mecânica para achar rapidez na origem
- Velocidade máxima via gráfico de energia potencial
- Conservação de energia mecânica em montanha-russa
- Conservação da energia mecânica com forças conservativas
- Distância de frenagem e velocidade inicial via energia cinética
- Ponto de retorno em energia potencial polinomial
- Compressão de mola em plano inclinado
- Velocidade máxima a partir do mínimo de um gráfico de energia potencial
- Ponto de aceleração máxima pela inclinação de um gráfico de energia potencial
- Lançamento a 45° a partir de uma rampa — altura máxima após o arco de saída
- Coeficiente de atrito cinético a partir do trabalho de atrito num bloco contra uma mola
- Constante elástica da mola via conservação de energia com atrito
- Energia mecânica não conservada vs. energia total do sistema com atrito
- Leitura de gráfico de energia potencial — velocidade e pontos de equilíbrio
- Velocidade em função da altura por conservação de energia em lançamento vertical
- Transformação de energia com atrito — velocidade constante num escorrega
- Coeficiente de atrito cinético via balanço de energia com mola
- Queda livre vs. plano inclinado sem atrito — mesma altura, mesma energia
- Rapidez mínima no ponto mais alto de um loop vertical sem atrito
- Velocidade e força a partir de gráfico de energia potencial linear por partes
- Conservação de energia mecânica em pista sem atrito seguida de trecho com atrito
- Comparação de energias cinéticas a partir do módulo de vetores velocidade
- Velocidade e força normal no ponto mais baixo de trilho semicircular
- Distância de parada de sistema bloco-mola-polia via conservação de energia
- Leitura precisa de gráfico U(x) linear por partes para obter energia cinética em outro ponto
- Razão entre energias cinéticas de dois corpos de massas e velocidades diferentes
- Conservação da energia mecânica em queda livre sem resistência do ar — leitura de gráfico E×y
- Trabalho da gravidade e energia cinética em queda livre — comparação entre massas diferentes
- Leitura de gráfico de energia potencial U(x) — força, equilíbrio estável e trabalho via ΔU
- Altura mínima acima do topo de um laço circular vertical para manter contato com a pista
- Sistema bloco-mola-polia com bloco pendurado — energia cinética via conservação de energia
- Máquina de Atwood — conservação de energia mecânica no sistema
- Fração da energia potencial convertida em cinética — máquina de Atwood
- Conversão de energia potencial elástica em energia potencial gravitacional — mola vertical
- Definição de força conservativa — independência do trabalho em relação à trajetória
- Conservação de energia em colisão elástica com dissipação por atrito
- Pontos de equilíbrio a partir da energia potencial U(x)
- Trabalho calculado a partir da variação de energia potencial U(x)
- Energia mecânica com atrito e compressão de mola — múltiplas etapas
- Igualdade da rapidez de impacto em três lançamentos com ângulos diferentes, por conservação de energia
- Intervalo de movimento de uma partícula a partir do gráfico de energia potencial U(x) e da energia mecânica total
- Rapidez final igual em diferentes rampas sem atrito, por conservação de energia
- Variação da energia térmica do sistema satélite-atmosfera-Terra após a velocidade terminal
- Ponto de retorno de uma partícula a partir do gráfico de energia potencial U(x) e da energia mecânica total
- Movimento permitido a partir do gráfico de energia potencial — condição $E_T \geq E_P$
- Potência a partir de energia potencial gravitacional e vazão mássica
- Lançamento vertical — conservação de energia mecânica e proporcionalidade altura ∝ v²
- Relação entre energia potencial e força a partir de um gráfico — $F=-dU/dx$

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2026.1-p2** · medio · _Taxa de variação da energia cinética na queda livre_

```
Você solta uma bola de uma sacada alta. Despreze a resistência do ar durante a queda. Marque a alternativa correta sobre a taxa de variação da rapidez e da energia cinética da bola.

  A) Apenas a energia cinética aumenta em quantidades iguais durante intervalos de tempo iguais.
  B) Ambas, energia cinética e rapidez, aumentam em quantidades iguais durante intervalos de tempo iguais.
  C) Apenas a energia cinética aumenta em quantidades iguais durante distâncias percorridas iguais.
  D) Ambas, energia cinética e rapidez, aumentam em quantidades iguais durante distâncias percorridas iguais.
  E) Nenhuma das alternativas anteriores.
```
Gabarito: **C**

**fis1-uff-2026.1-p2** · medio · _Conservação de energia mecânica em rampa sem atrito_

```
A rampa de salto gigante no skate, frequentemente chamada de Mega Rampa ou "Big Air", é uma estrutura colossal projetada para que skatistas atinjam velocidades extremas e realizem manobras a alturas impressionantes. Vamos analisar o movimento de uma skatista numa versão simplificada da Mega Rampa, ilustrada na figura abaixo. Todas as alturas indicadas são com relação ao ponto mais baixo da rampa B, indicado pela seta. O trecho final da Mega Rampa é um arco de circunferência de raio $R = 20$ m. O ponto de partida A está a $60$ metros de altura e o ponto de lançamento C está a $8{,}0$ m — medidos com relação ao ponto mais baixo da pista (ponto B). O skatista, de $70$ kg, percorre um trajeto de $80$ metros ao longo da rampa, desde o ponto A até o ponto de lançamento C. Desprezando o atrito nos rolamentos do skate, o módulo da velocidade no ponto de lançamento (ponto C) é:

  A) aproximadamente 23 m/s.
  B) aproximadamente 32 m/s.
  C) aproximadamente 34 m/s.
  D) aproximadamente 39 m/s.
  E) aproximadamente 43 m/s.
```
Gabarito: **B**
  *(esta questão tem figura)*

**fis1-uff-2026.1-p2** · medio · _Força a partir do gráfico de energia potencial elástica_

```
A figura ao lado mostra o diagrama de energia (curva $E_P(x)$, um poço com mínimo em $x=20$ cm, onde $E_P=5$ J) para um objeto de massa $100$ g sujeito a uma força elástica de uma mola ao longo do eixo $x$. A energia total do objeto é constante, $E_T=15$ J (reta horizontal no gráfico), que intercepta a curva $E_P$ em $x=12$ cm e $x=28$ cm — os pontos de retorno do movimento. Sobre o sentido da força sobre o objeto, é correto afirmar que:

  A) Está sempre orientada no sentido $x < 0$.
  B) Está sempre orientada no sentido $x > 0$.
  C) Está orientada no sentido $x < 0$ apenas na região entre 12 e 20 cm.
  D) Está orientada no sentido $x > 0$ apenas na região entre 12 e 20 cm.
  E) É nula em $x = 12$ e $x = 28$ cm.
```
Gabarito: **D**
  *(esta questão tem figura)*

</details>

### Impulso e Momento Linear

4 questão(ões) na prova prevista · 81 no acervo deste slot.

- Colisão elástica unidimensional e retroespalhamento
- Velocidade de bala a partir de colisão perfeitamente inelástica que anula o movimento do bloco
- Verificação de conservação de momentum e energia cinética numa colisão a partir de velocidades dadas
- Centro de massa de sistema inicialmente em repouso liberado por mola comprimida
- Comparação de tempo de frenagem e impulso entre veículos de mesma energia cinética
- Aumento de velocidade a partir da área de um gráfico força-tempo trapezoidal
- Colisão elástica bidimensional entre bolas idênticas — velocidade da bola alvo por componentes
- Colisão perfeitamente inelástica seguida de compressão de mola — velocidade inicial do projétil
- Velocidade do centro de massa de dois blocos com velocidades opostas
- Razão entre momentos lineares de duas armas de mesma velocidade e massas diferentes
- Conservação do momento linear numa explosão de dois blocos em repouso
- Igualdade dos impulsos numa colisão entre massas diferentes
- Colisão perfeitamente inelástica bidimensional entre carros
- Energia dissipada numa colisão unidimensional perfeitamente inelástica
- Conservação do momento num sistema pessoa-carrinho-bola com ricochete
- Determinação de massa e classificação elástica/inelástica de uma colisão
- Condição geral de conservação do momento linear numa colisão
- Conservação do momento linear numa explosão no espaço
- Colisão perfeitamente inelástica bidimensional entre asteroides
- Teorema impulso-momento a partir de um gráfico força×tempo
- Colisão inelástica seguida de compressão de mola
- Força média exercida por uma parede numa colisão frontal, via teorema do impulso
- Direção possível do movimento de um carro após colisão 2D, por conservação vetorial do momento
- Conservação do momento linear total numa explosão em fragmentos, sem gravidade
- Velocidade inicial de uma bala a partir da compressão de uma mola após embutir-se num bloco
- Colisão perfeitamente inelástica com gráfico força×tempo — teorema do impulso
- Conservação de momento linear num sistema pessoa-carrinho-bola com colisão interna contra anteparo
- Comparação qualitativa de impulso — ricochete elástico vs. colisão perfeitamente inelástica
- Terceira lei de Newton aplicada aos impulsos numa colisão entre massas diferentes
- Projétil incrustado em bloco — colisão perfeitamente inelástica seguida de frenagem por atrito
- Colisão unidimensional interpretada por gráfico posição-tempo — velocidade final a partir da inclinação
- Colisão unidimensional — massa desconhecida e comparação de energia cinética antes/depois
- Colisão via mola — momento linear e energia potencial elástica para achar a compressão
- Segunda lei de Newton para sistemas de partículas — forças internas vs. externas em subsistemas
- Colisão elástica unidimensional
- Energia cinética perdida em colisão perfeitamente inelástica
- Condições para o centro de massa permanecer parado
- Cálculo da força de impulsão via impulso na largada
- Conservação de momento linear no recuo do skate
- Deslocamento do centro de massa em sistema isolado
- Colisão bidimensional com vetores velocidade
- Colisão perfeitamente inelástica entre veículos
- Conservação de momento e energia no pêndulo de Newton
- Colisão perfeitamente inelástica bidimensional e cinemática até a borda de um círculo
- Centro de massa invariante — pessoa caminhando dentro de uma canoa
- Sistema bala-bloco-mola — dissipação de energia numa colisão perfeitamente inelástica
- Sistema bala-bloco-mola — velocidade inicial da bala a partir da compressão máxima
- Conservação do momento linear em explosão sem força externa
- Colisão perfeitamente inelástica bidimensional entre dois corpos
- Conservação do momento e não conservação da energia cinética em colisão inelástica
- Impulso sobre uma parede — bola que ricocheteia vs. bola que gruda
- Colisão perfeitamente inelástica seguida de compressão de mola
- Identificação de colisão elástica a partir de gráficos de energia cinética em função do tempo
- Bala atravessando esfera pendurada — fração de energia cinética conservada
- Colisão bidimensional — variação de energia cinética via conservação vetorial do momento
- Explosão de corpo em dois fragmentos — ranking da velocidade de um fragmento em diferentes cenários
- Força de colisão via gráfico impulso-tempo em colisão perfeitamente inelástica
- Conservação de momento linear e energia mecânica durante compressão de mola em colisão elástica
- Verificação de colisão elástica via conservação de momento linear e energia cinética
- Conservação de momento em acréscimo de massa — vagão coletando chuva
- Impulso a partir da área do gráfico força × tempo em uma colisão com parede
- Momento linear da bola e da Terra em uma colisão elástica com o solo
- Força média em colisão perfeitamente inelástica — avião e balão meteorológico
- Conservação do momento linear em explosão sem gravidade
- Definição de colisão inelástica — não conservação da energia cinética
- Condição para a conservação do momento linear numa colisão
- Condição para o centro de massa de um sistema permanecer fixo
- Conservação do momento linear em colisão perfeitamente inelástica — menino salta no carrinho
- Direção pós-colisão via conservação vetorial do momento linear
- Variação de energia cinética em colisão a partir das velocidades vetoriais
- Velocidade do centro de massa sob força externa resultante nula
- Centro de massa de sistema de partículas — coordenadas (x,y)
- Variação do momento linear da bola e da Terra numa colisão elástica com o solo (quique)
- Conservação do momento linear na separação de um veículo espacial em duas partes
- Variação do momento linear — direção e sentido, não apenas o módulo da velocidade
- Centro de massa — relação inversa entre massa e distância ao centro de massa
- Momento linear como grandeza vetorial — dependência da massa e da velocidade
- Impulso em colisões — Terceira Lei de Newton aplicada aos impulsos
- Colisão perfeitamente inelástica — conservação do momento e energia cinética dissipada
- Colisão elástica — força média via teorema impulso-momento
- Colisão perfeitamente inelástica seguida de queda livre — energia cinética final por conservação de energia

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2026.1-p2** · dificil · _Colisão elástica unidimensional e retroespalhamento_

```
O Retroespalhamento Rutherford é uma técnica experimental que possibilita a identificação não-destrutiva da composição atômica em filmes finos. A análise modela a colisão entre dois núcleos atômicos como perfeitamente elástica e requer a medição precisa das velocidades das partículas. Um próton (cuja massa atômica é 1 u) é lançado com velocidade de $5{,}0 \times 10^6$ m/s contra um núcleo-alvo, considerado em repouso (ver imagem ao lado). O próton ricocheteia (isto é, retroespalhado, invertendo o sentido do movimento inicial) com sua velocidade reduzida a 75% do valor inicial, enquanto o núcleo-alvo adquire uma velocidade de $7{,}29 \times 10^5$ m/s, no sentido oposto. Considere a colisão unidimensional. Qual é a massa, em unidades de massa atômica, do núcleo-alvo?

  A) 14,0 u.
  B) 12,0 u.
  C) 6,00 u.
  D) 5,14 u.
  E) 1,71 u.
```
Gabarito: **B**
  *(esta questão tem figura)*

**fis1-uff-2025.2-p2** · dificil · _Velocidade de bala a partir de colisão perfeitamente inelástica que anula o movimento do bloco_

```
Um bloco de madeira de massa igual a $2{,}0$ kg, inicialmente em repouso, é colocado a deslizar sem atrito sobre o piso, impulsionado por uma mola sem massa (ver figura ao lado). Inicialmente a mola está comprimida de modo a possuir energia potencial elástica igual a $40$ mJ. Após abandonar a mola, o bloco é atingido por uma bala de massa igual a $2$ g, que se move horizontalmente, em sentido contrário ao do bloco. Após colisão com o bloco, a bala crava-se em seu interior, e o conjunto bala-bloco fica em repouso. Determine a velocidade da bala quando esta atinge o bloco.

  A) $125$ m/s
  B) $150$ m/s
  C) $175$ m/s
  D) $200$ m/s
  E) $225$ m/s
```
Gabarito: **D**
  *(esta questão tem figura)*

**fis1-uff-2025.2-p2** · medio · _Verificação de conservação de momentum e energia cinética numa colisão a partir de velocidades dadas_

```
Os dois blocos mostrados na figura podem deslizar sem atrito sobre o piso. As massas dos blocos são $m_1 = 4$ kg e $m_2 = 12$ kg. Antes da colisão, o bloco 1 move-se a $v_0=10$ m/s e o bloco 2 está em repouso ($v=0$); depois da colisão, o bloco 1 move-se a $v_1=5$ m/s no sentido contrário ao inicial e o bloco 2 move-se a $v_2=5$ m/s no mesmo sentido em que o bloco 1 se movia originalmente. Em relação às conservações da energia cinética e do momentum neste processo de colisão, pode-se afirmar que:

  A) apenas o momentum se conserva.
  B) apenas a energia cinética se conserva.
  C) ambos, energia cinética e momentum, se conservam.
  D) nem a energia cinética nem o momentum se conservam.
  E) não há dados suficientes para responder.
```
Gabarito: **C**
  *(esta questão tem figura)*

</details>

### Dinâmica do Movimento no Plano

2 questão(ões) na prova prevista · 21 no acervo deste slot.

- Velocidade mínima no topo do círculo vertical
- Corte do barbante em MCU vertical e lançamento horizontal
- Força normal na base de uma rampa curva
- Tensão no barbante em movimento circular uniforme
- Direção da força resultante em movimento circular com velocidade angular decrescente
- Velocidade máxima numa curva plana limitada pelo atrito estático
- Força normal na lateral de um loop circular
- Velocidade angular mínima no brinquedo Rotor
- Velocidade angular mínima no topo de um círculo vertical
- Tração no ponto mais baixo de um círculo vertical
- Atrito estático fornecendo força centrípeta em curva de caminhão
- Velocidade máxima numa curva plana com atrito estático
- Velocidade no topo de um loop quando a normal sentida é igual ao peso
- Forças tangencial, centrípeta e resultante num carrinho que acelera numa trajetória circular
- Razão entre força normal e peso no topo de um loop vertical, com velocidade dobrada em relação à crítica
- Velocidade máxima numa curva bancada sem atrito
- Força resultante em movimento circular quando aceleração centrípeta iguala a tangencial
- Força normal no ponto mais baixo de um loop — normal dada como múltiplo do peso
- Pêndulo cônico com dois fios (um vertical, um inclinado) — tensão no fio vertical
- Força normal no topo de uma colina e no fundo de uma depressão de mesmo raio
- Velocidade máxima numa curva plana com atrito estático fornecendo a força centrípeta

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2026.1-p2** · medio · _Velocidade mínima no topo do círculo vertical_

```
Uma pequena bola amarrada a um barbante de massa desprezível é girada descrevendo uma circunferência em um plano vertical. Observa-se que existe uma velocidade escalar mínima que a bola deve ter ao passar pelo ponto mais alto da trajetória; caso contrário, o barbante fica frouxo e a bola abandona a trajetória circular antes de completar a volta. De acordo com as Leis de Newton, qual das alternativas a seguir explica fisicamente o motivo da existência dessa velocidade mínima no topo da trajetória?

  A) Uma "força centrífuga" empurra a bola para fora da trajetória. Se a velocidade for muito baixa, essa força será menor que a força peso, fazendo com que a bola caia e o barbante afrouxe.
  B) No topo, a velocidade precisa ser suficiente para que a força de tensão do barbante seja igual e oposta à força da gravidade, mantendo a bola em equilíbrio momentâneo no eixo vertical.
  C) A força resultante apontando para o centro do círculo não pode ser menor que a força gravitacional, pois o barbante só pode puxar, e não empurrar. Assim, a velocidade mínima ocorre quando a gravidade, sozinha, fornece a aceleração centrípeta necessária.
  D) A inércia da bola gera uma força radial apontando para fora do círculo. A velocidade mínima garante que essa força inercial anule exatamente a tensão e a força gravitacional, tornando a aceleração nula no topo.
  E) Para que o movimento seja circular, a tensão no barbante deve ser constante em todos os pontos da trajetória. Velocidades abaixo da mínima não conseguem manter essa tensão constante no ponto mais alto.
```
Gabarito: **C**

**fis1-uff-2026.1-p2** · dificil · _Corte do barbante em MCU vertical e lançamento horizontal_

```
Uma bola de massa $60$ g, presa por um barbante de $100$ cm de comprimento, é girada descrevendo uma circunferência em um plano vertical ao redor de um ponto $200$ cm acima do solo. Quando a bola está na parte mais baixa do círculo, a tensão no barbante é de $5{,}0$ N. Uma lâmina muito afiada é subitamente inserida, como mostra a Figura ao lado, a fim de cortar o barbante diretamente abaixo do seu ponto de fixação. A que distância horizontal, à direita de onde o barbante foi cortado, a bola aterrissará?

  A) 3,87 m
  B) 4,12 m
  C) 4,36 m
  D) 5,48 m
  E) 5,83 m
```
Gabarito: **A**
  *(esta questão tem figura)*

**fis1-uff-2026.1-p2** · dificil · _Força normal na base de uma rampa curva_

```
A rampa de salto gigante no skate, frequentemente chamada de Mega Rampa ou "Big Air", é uma estrutura colossal projetada para que skatistas atinjam velocidades extremas e realizem manobras a alturas impressionantes. Vamos analisar o movimento de uma skatista numa versão simplificada da Mega Rampa, ilustrada na figura abaixo. Todas as alturas indicadas são com relação ao ponto mais baixo da rampa B, indicado pela seta. O trecho final da Mega Rampa é um arco de circunferência de raio $R = 20$ m. O ponto de partida A está a $60$ metros de altura e o ponto de lançamento C está a $8{,}0$ m — medidos com relação ao ponto mais baixo da pista (ponto B). O skatista, de $70$ kg, percorre um trajeto de $80$ metros ao longo da rampa, desde o ponto A até o ponto de lançamento C. Ainda desconsiderando o atrito nos rolamentos do skate, qual é o módulo da força normal agindo sobre o skatista no ponto mais baixo da Mega Rampa (ponto B)? As alternativas estão em unidade $mg$, onde $m$ é a massa do skatista e $g$ o módulo da aceleração da gravidade local.

  A) nulo
  B) $0{,}5\,mg$
  C) $1{,}0\,mg$
  D) $5{,}0\,mg$
  E) $7{,}0\,mg$
```
Gabarito: **E**
  *(esta questão tem figura)*

</details>

### Trabalho

1 questão(ões) na prova prevista · 54 no acervo deste slot.

- Trabalho da força de atrito e balanço de energia
- Trabalho nulo em força estática sem deslocamento
- Relação entre a resultante das forças e a energia cinética ao longo do tempo
- Trabalho do atrito entre duas compressões de mola numa rampa
- Trabalho resultante nulo entre dois pontos de repouso
- Trabalho da gravidade numa calha semicircular
- Trabalho de três forças com componentes diferentes num plano inclinado sem atrito
- Força de atrito média sobre uma bala que atravessa um saco de areia, via teorema trabalho-energia
- Potência mecânica e atrito cinético — força de empurrão constante a velocidade constante
- Trabalho de força constante via produto escalar
- Relação entre trabalho, velocidade e distância percorrida
- Potência da força de tração em elevador
- Trabalho de força constante em diferentes situações
- Trabalho da força gravitacional e da força aplicada no supino
- Trabalho de força variável via gráfico F(x) e velocidade final
- Trabalho da força gravitacional em trilho sem atrito
- Potência solar e área do coletor
- Potência em escada rolante
- Teorema trabalho-energia como afirmação sempre válida
- Trabalho nulo da força gravitacional num movimento circular uniforme
- Trabalho da força peso numa calha que leva de um ponto a outro duas vezes mais alto
- Trabalho nulo de uma força sempre perpendicular à velocidade
- Trabalho como área sob o gráfico força-posição — teorema trabalho-energia
- Independência do trabalho e da variação de energia cinética em relação ao caminho para força constante
- Trabalho da força peso e da tensão num pêndulo simples
- Força de atrito via teorema trabalho-energia com compressão de mola
- Trabalho nulo da tração centrípeta em movimento circular uniforme
- Tempo de elevação de carga a partir da potência do guindaste
- Efeito de trabalho conservativo e dissipativo sobre energia cinética e mecânica
- Teorema trabalho-energia com força aplicada em ângulo, atrito e mola
- Trabalho de força constante via produto escalar com deslocamento vetorial
- Relação entre resultante de duas forças horizontais e evolução da energia cinética no tempo
- Conservação de energia mecânica sob força conservativa — rapidez ao retornar a um ponto
- Energia cinética máxima a partir de gráfico força-posição (F×x)
- Relação entre trabalho de forças conservativa e dissipativa, energia cinética, potencial, mecânica e térmica
- Propriedades do trabalho de uma força conservativa — independência da trajetória e reversão de sinal
- Potência de uma força e coeficiente de atrito cinético em movimento a velocidade constante
- Trabalho de força externa contra duas molas em configuração assimétrica
- Relação entre sinal do trabalho de uma força constante e a direção do deslocamento/velocidade média
- Comparação de energia cinética entre corpos de massas diferentes no plano inclinado com atrito
- Sinal do trabalho de gravidade, tração e atrito no pêndulo
- Trabalho da força elástica em colisão elástica carrinho-mola
- Potência constante e teorema trabalho-energia
- Trabalho como área sob o gráfico força × deslocamento
- Trabalho de força constante em ângulo com o deslocamento
- Trabalho da tensão e da força gravitacional numa rotação completa em círculo vertical
- Força a partir da inclinação do gráfico de energia potencial U(x)
- Potência adicional necessária para manter velocidade constante subindo uma ladeira
- Propriedade que não caracteriza uma força conservativa (módulo constante)
- Sinal do trabalho da tensão, do peso e da força resultante num elevador em descida a velocidade constante
- Definição de força conservativa via independência do trabalho em relação ao caminho
- Energia cinética final a partir da área sob o gráfico força-posição (teorema trabalho-energia)
- Trabalho necessário para parar um objeto em movimento, via teorema trabalho-energia cinética
- Teorema trabalho-energia — trabalho igual implica mesma energia cinética, independente da massa

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2026.1-p2** · dificil · _Trabalho da força de atrito e balanço de energia_

```
A rampa de salto gigante no skate, frequentemente chamada de Mega Rampa ou "Big Air", é uma estrutura colossal projetada para que skatistas atinjam velocidades extremas e realizem manobras a alturas impressionantes. Vamos analisar o movimento de uma skatista numa versão simplificada da Mega Rampa, ilustrada na figura abaixo. Todas as alturas indicadas são com relação ao ponto mais baixo da rampa B, indicado pela seta. O trecho final da Mega Rampa é um arco de circunferência de raio $R = 20$ m. O ponto de partida A está a $60$ metros de altura e o ponto de lançamento C está a $8{,}0$ m — medidos com relação ao ponto mais baixo da pista (ponto B). O skatista, de $70$ kg, percorre um trajeto de $80$ metros ao longo da rampa, desde o ponto A até o ponto de lançamento C. Agora vamos considerar uma força de atrito constante nos rolamentos do skate, sempre contrária à velocidade da skatista. O módulo da força de atrito é $150$ N, que atua ao longo do percurso total da rampa (ponto A até o ponto C) — lembrando que o comprimento total é $80$ m. Nessa situação, o módulo da velocidade de lançamento no ponto de lançamento é:

  A) aproximadamente 12 m/s.
  B) aproximadamente 22 m/s.
  C) aproximadamente 26 m/s.
  D) aproximadamente 32 m/s.
  E) aproximadamente 34 m/s.
```
Gabarito: **C**
  *(esta questão tem figura)*

**fis1-uff-2026.1-p2** · facil · _Trabalho nulo em força estática sem deslocamento_

```
Uma halterofilista participa de uma competição onde deve levantar uma barra de 100 kg acima da cabeça. A atleta levanta a barra e, em seguida, consegue segurá-la de forma estática (completamente parada), a uma altura $h = 2{,}2$ m do chão, durante um intervalo de tempo de $\Delta t = 10$ s. Nesse período de 10 segundos, seus músculos tremem, ele transpira intensamente e consome muita energia metabólica para manter a barra no lugar. Considerando a definição física de trabalho mecânico, qual afirmação descreve corretamente o trabalho (W) realizado pela força que o atleta exerce sobre a barra durante o intervalo de 10 segundos em que ela permanece imóvel?

  A) O trabalho é positivo e tem um valor elevado ($W > 0$), pois o atleta está gastando energia química (calorias) e exercendo uma força intensa para vencer a gravidade.
  B) O trabalho é dado pelo produto do peso da barra pelo tempo ($W = mg \cdot \Delta t$), pois a força deve ser mantida ao longo do tempo.
  C) O trabalho é nulo ($W = 0$), pois, embora haja força aplicada, não há deslocamento da barra durante esse intervalo.
  D) O trabalho é igual à energia potencial gravitacional da barra ($W = mg \cdot h$), pois o atleta está sustentando a energia que ele deu à barra.
  E) O trabalho é negativo ($W < 0$), pois a gravidade está tentando puxar a barra para baixo enquanto o atleta empurra para cima.
```
Gabarito: **C**

**fis1-uff-2024.2-p2** · medio · _Relação entre a resultante das forças e a energia cinética ao longo do tempo_

```
A figura (a) mostra duas forças horizontais que agem sobre um bloco que, no instante $t=0$, está deslizando para a direita sobre uma superfície sem atrito. A figura (b) mostra três gráficos da energia cinética $K$ desse bloco em função do tempo $t$, com $t=0$ e $K=0$ na origem dos eixos. Qual dos gráficos corresponde melhor a cada uma das três situações a seguir: 1) $F_1=F_2$; 2) $F_1>F_2$; 3) $F_1<F_2$?

  A) A, B, C
  B) A, C, B
  C) C, B, A
  D) B, A, C
  E) B, C, A
```
Gabarito: **E**
  *(esta questão tem figura)*

</details>

### Dinâmica do Movimento Retilíneo

1 questão(ões) na prova prevista · 6 no acervo deste slot.

- Sistema de dois corpos conectados por cabo
- Peso aparente em elevador e compressão de mola
- Aceleração de bloco suspenso ligado por corda e polia a bloco em rampa com atrito
- Sistema de três blocos e polia em plano inclinado composto — razão de tensões
- Coeficiente de atrito cinético em plano inclinado com bloco em velocidade constante
- Tração na corda entre dois blocos puxados juntos com atrito cinético

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2026.1-p2** · medio · _Sistema de dois corpos conectados por cabo_

```
Uma caminhonete de socorro mecânico (guincho) está rebocando um carro enguiçado por uma estrada horizontal reta. O carro, que está atrás da caminhonete, é puxado por um cabo de aço inextensível e de massa desprezível. Em um determinado momento, o motorista da caminhonete pisa no acelerador e o sistema (caminhonete + carro) começa a se mover com aceleração constante para frente. Despreze a resistência do ar e qualquer atrito nas rodas do carro enguiçado (considere que elas rolam livremente). Considere também que as rodas da caminhonete rolam sem deslizamentos e as seguintes forças horizontais: $\vec f_e$: força de atrito estático que o chão exerce sobre os pneus da caminhonete para frente (a força de propulsão); $\vec T$: força de tensão no cabo de aço que conecta os veículos. Qual das alternativas descreve corretamente a relação entre os módulos dessas forças?

  A) $f_e = T$.
  B) $f_e > T$.
  C) $f_e < T$.
  D) A relação depende da massa do carro enguiçado em comparação com a massa da caminhonete.
  E) $\vec f_e$ é a resultante do motor, enquanto $\vec T$ é uma força externa; portanto, não podem ser comparadas.
```
Gabarito: **B**

**fis1-uff-2026.1-p2** · medio · _Peso aparente em elevador e compressão de mola_

```
Uma estudante de 60 kg está em pé sobre uma mola, dentro de um elevador que desce acelerando a $3{,}0$ m/s². A mola tem constante elástica igual a 2.500 N/m. Nesta condição, assinale a alternativa correta com relação ao estado da mola.

  A) A mola está esticada de aproximadamente 31 cm.
  B) A mola está esticada de aproximadamente 16 cm.
  C) A mola está com seu comprimento natural.
  D) A mola está comprimida de aproximadamente 16 cm.
  E) A mola está comprimida de aproximadamente 31 cm.
```
Gabarito: **D**

**fis1-uff-2025.2-p2** · dificil · _Aceleração de bloco suspenso ligado por corda e polia a bloco em rampa com atrito_

```
A figura ao lado mostra um bloco de massa $m=1{,}5$ kg subindo sobre uma rampa com $20°$ de inclinação. Ele está ligado a outro bloco, de $2{,}0$ kg, suspenso por meio de uma corda sem massa que passa por uma polia também desprovida de massa e livre de atrito. Sabendo-se que o coeficiente de atrito cinético entre o bloco e a superfície vale $\mu_c=0{,}5$, qual é o valor da aceleração do bloco de $2{,}0$ kg? Dado: $\text{sen}\,20° \approx 0{,}342$; $\cos 20° \approx 0{,}940$.

  A) $0{,}7$ m/s²
  B) $2{,}2$ m/s²
  C) $1{,}0$ m/s²
  D) $6{,}1$ m/s²
  E) $5{,}1$ m/s²
```
Gabarito: **B**
  *(esta questão tem figura)*

</details>

### A Terceira Lei de Newton

1 questão(ões) na prova prevista · 5 no acervo deste slot.

- Par ação-reação da força normal
- Par ação-reação numa colisão entre dois corpos
- Par ação-reação numa colisão entre carros de massas diferentes
- Tensão na corda de uma máquina de Atwood simples
- Pares ação-reação entre dois corpos de massas diferentes durante um empurrão mútuo

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2026.1-p2** · facil · _Par ação-reação da força normal_

```
Você coloca sua caneca favorita de café, cheia e quente, sobre a mesa da cozinha, que é perfeitamente horizontal. A caneca permanece em repouso absoluto enquanto você procura um biscoito. Considere as seguintes forças: $\vec{n}$: a força normal que a mesa exerce para cima sobre a caneca; $\vec{F}_G$: a força gravitacional que a Terra exerce para baixo sobre a caneca. De acordo com a 3ª Lei de Newton, qual é a força que forma o par de reação correspondente à força normal $\vec{n}$?

  A) A força gravitacional $\vec{F}_G$ de atração da Terra sobre a caneca.
  B) A força gravitacional que a caneca exerce sobre a Terra (puxando a Terra para cima).
  C) A força de contato que a caneca exerce para baixo sobre a mesa.
  D) Não existe par de reação neste caso, pois a força resultante é nula (equilíbrio estático).
  E) A força de atrito estático entre a caneca e a mesa.
```
Gabarito: **C**

**fis1-uff-2024.2-p2** · facil · _Par ação-reação numa colisão entre dois corpos_

```
Dois corpos estão sobre uma reta. A está inicialmente em repouso e B, que se encontra atrás de A, colide com ele. O que podemos afirmar sobre as intensidades das forças que um exerce sobre o outro durante a colisão?

  A) B exerce uma força sobre A, mas este não exerce uma força sobre B.
  B) B exerce uma força sobre A maior do que a força que este exerce sobre B.
  C) A exerce uma força sobre B maior do que a força que este exerce sobre A.
  D) B exerce uma força sobre A de mesma intensidade que a força que este exerce sobre B.
  E) A exerce uma força sobre B, mas este não exerce uma força sobre A.
```
Gabarito: **D**

**fis1-uff-2024.1-p2** · facil · _Par ação-reação numa colisão entre carros de massas diferentes_

```
O carro B parou em um sinal vermelho. O motorista do carro A, cuja massa é diferente da do carro B, não vê a luz vermelha e vai de encontro à traseira de B. Qual das seguintes afirmações é verdadeira?

  A) B exerce uma força sobre A, mas este não exerce uma força sobre B.
  B) B exerce uma força sobre A maior do que a força que este exerce sobre B.
  C) B exerce uma força sobre A de mesma intensidade que a força que este exerce sobre B.
  D) A exerce uma força sobre B maior do que a força que este exerce sobre A.
  E) A exerce uma força sobre B, mas este não exerce uma força sobre A.
```
Gabarito: **C**

</details>

### Força e Movimento

1 questão(ões) na prova prevista · 5 no acervo deste slot.

- Terceira Lei de Newton — força de contato entre três blocos empurrados em sequência
- Terceira Lei de Newton — força de contato entre dois blocos empurrados
- Sistema de polia fixa sustentando homem e plataforma em equilíbrio
- Força de contato entre dois blocos empurrados juntos por uma força externa, superfície sem atrito
- Força vertical necessária para erguer dois blocos conectados por corda com velocidade constante

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2025.2-p2** · medio · _Terceira Lei de Newton — força de contato entre três blocos empurrados em sequência_

```
Três blocos de massas $m_1=5$ kg, $m_2=2$ kg e $m_3=10$ kg são empurrados por uma força constante $\vec F$ ao longo de uma superfície horizontal de atrito desprezível, conforme mostra a figura (a força $\vec F$ está aplicada sobre o bloco 1, que empurra o bloco 2, que por sua vez empurra o bloco 3). É correto afirmar que:

  A) A força de contato entre os blocos 1 e 2 é menor do que a força contato entre os blocos 2 e 3.
  B) A força de contato entre os blocos 1 e 2 é maior do que a força de contato entre os blocos 2 e 3.
  C) A força de contato entre os blocos 1 e 2 é igual à força de contato entre blocos 2 e 3.
  D) A força de contato entre blocos 1 e 2 é igual à força F que empurra o bloco 1.
  E) A força de contato entre blocos 2 e 3 é igual à força F que empurra o bloco 1.
```
Gabarito: **B**
  *(esta questão tem figura)*

**fis1-uff-2025.1-p2** · medio · _Terceira Lei de Newton — força de contato entre dois blocos empurrados_

```
Dois blocos de massas $M = 4{,}0$ kg e $m = 2{,}0$ kg são acelerados por uma força horizontal de $12$ N que empurra o bloco maior em direção ao menor sobre uma superfície sem atrito, conforme ilustrado na figura abaixo.

Quais são o módulo e a direção força que o bloco menor exerce sobre o bloco maior?

  A) $4$ N, horizontal para a esquerda
  B) $12$ N, horizontal para a esquerda
  C) $0$ N
  D) $4$ N, horizontal para a direita
  E) $8$ N, horizontal para a direita
```
Gabarito: **A**
  *(esta questão tem figura)*

**fis1-uff-2024.1-p2** · medio · _Sistema de polia fixa sustentando homem e plataforma em equilíbrio_

```
Um homem está sobre uma plataforma. O homem mantém a plataforma em repouso através de uma corda que passa por uma polia presa ao teto, como na figura. As massas da corda e da polia podem ser desprezadas, assim como o atrito na polia. Se o homem tem massa $m$ e a plataforma tem massa $M$, qual é o módulo da força que o homem precisa fazer para manter a plataforma em repouso? (Dica: faça diagramas de corpo livre antes de responder!)

  A) $Mg$
  B) $mg$
  C) $\dfrac{(M+m)g}{3}$
  D) $(M+m)g$
  E) $\dfrac{(M+m)g}{2}$
```
Gabarito: **E**
  *(esta questão tem figura)*

</details>

### Cinemática em Duas Dimensões

0 questão(ões) na prova prevista · 5 no acervo deste slot.

- Propriedades do movimento circular uniforme — força, aceleração e velocidade
- Movimento circular com aceleração tangencial constante — instante em que a_t iguala a_centrípeta
- Cinemática angular com aceleração angular constante — velocidade inicial a partir de Δθ e ωf
- Direção do vetor aceleração em movimento circular não uniforme — soma de centrípeta e tangencial
- Aceleração centrípeta dada em múltiplos de g — velocidade no topo de um loop vertical

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2022.2-p2** · facil · _Propriedades do movimento circular uniforme — força, aceleração e velocidade_

```
Considere uma partícula que realiza um movimento circular com rapidez constante. Sobre este movimento, podemos afirmar que

  A) Existe somente uma força atuando sobre a partícula.
  B) O movimento não é acelerado.
  C) A aceleração da partícula é constante.
  D) A magnitude da aceleração da partícula é constante.
  E) A direção da aceleração da partícula é tangente ao círculo.
```
Gabarito: **D**

**fis1-uff-2022.2-p2** · medio · _Movimento circular com aceleração tangencial constante — instante em que a_t iguala a_centrípeta_

```
Em $t=0$, um objeto inicia um movimento circular de raio igual a $8$ m a partir do repouso com aceleração tangencial constante de $2$ m/s². Em que instante o módulo da sua aceleração tangencial é igual ao módulo da sua aceleração centrípeta?

  A) 0,5 s
  B) 4 s
  C) 0,4 s
  D) 0,25 s
  E) 2 s
```
Gabarito: **E**

**fis1-uff-2022.1-p2** · facil · _Cinemática angular com aceleração angular constante — velocidade inicial a partir de Δθ e ωf_

```
Uma partícula executa um movimento circular com aceleração angular constante $\alpha=\pi$ rad/s². Durante um certo intervalo de tempo, $\Delta t=t_f-t_i$, seu deslocamento angular é de $\Delta\theta=\pi$ rad. Ao final deste intervalo de tempo sua velocidade angular é $\omega_f=2\pi$ rad/s. A velocidade angular da partícula no instante de tempo inicial, $t_i$, é:

  A) $\omega_i=0$ rad/s
  B) $\omega_i=1$ rad/s
  C) $\omega_i=\pi$ rad/s
  D) $\omega_i=\sqrt{2}\,\pi$ rad/s
  E) $\omega_i=2\pi$ rad/s
```
Gabarito: **D**

</details>

### Rotação de Corpo Rígido

0 questão(ões) na prova prevista · 38 no acervo deste slot.

- Energia cinética de rotação de sistema de partículas em triângulo
- Conceitos de rotação com velocidade angular constante
- Momento de inércia de roda com anel e raios
- Direção do atrito estático em esfera que rola sem escorregar
- Aceleração do centro de massa de cilindro em queda com fios
- Ranking de torques em régua pivotada com cinco forças
- Comparação de momentos de inércia — haste homogênea vs. massas concentradas
- Torque de forças de mesmo módulo em diferentes distâncias do eixo
- Teorema do impulso angular-momento angular num haltere sob par de forças
- Energia cinética de rotação de duas massas diferentes em torno do centro de massa
- Conservação de energia rotacional — haste girando 180° em torno de extremidade fixa
- Aceleração angular de roldana com corda ligada a bloco puxado por força horizontal
- Tensão na corda em sistema roldana com inércia rotacional e bloco pendurado
- Momento de inércia de discos de mesma massa e espessura, densidades diferentes
- Ordenação de torques de forças de mesmo módulo em pontos diferentes de uma placa
- Comparação de momento de inércia e tempo de queda de bloco pendurado em dois sistemas de polia
- Conceitos de centro de massa e momento de inércia de corpos rígidos
- Momento de inércia de sistema de partículas em cruz simétrica em torno do eixo y
- Velocidade angular final de polia a partir da energia — bloco suspenso por fio
- Velocidade angular igual para todos os pontos de um corpo rígido em rotação
- Velocidade do centro de massa de esfera pivotada — energia e teorema dos eixos paralelos
- Tensão em cordas de discos coaxiais de raios diferentes — dinâmica rotacional
- Aceleração de corpo suspenso a partir de torque aplicado numa manivela
- Direção do vetor aceleração de um ponto na borda de roda com aceleração angular constante
- Fatores dos quais o momento de inércia de uma roda não depende
- Comparação de momentos de inércia de esferas de raios diferentes e mesma massa
- Propriedades do momento de inércia
- Momento de inércia de sistema de partículas em torno de eixo no vértice
- Energia cinética de rotação a partir do momento de inércia
- Torque de uma força aplicada em ângulo sobre uma porta
- Teorema dos eixos paralelos aplicado a um anel
- Comparação de acelerações tangencial, centrípeta e total entre dois discos conectados por correia
- Propriedades de um corpo rígido girando com energia cinética de rotação constante
- Propriedade sempre válida num corpo rígido girando em torno de um eixo fixo
- Comparação do momento de inércia entre disco, anel e aro fino de mesma massa
- Teorema dos eixos paralelos (Steiner)
- Momento de inércia e aceleração — sistema roldana/disco com massas na haste
- Torque resultante de várias forças aplicadas a um disco — soma vetorial de torques

<details><summary>Exemplares (3 mais recentes)</summary>

**fis1-uff-2019.2-p2** · medio · _Energia cinética de rotação de sistema de partículas em triângulo_

```
As três massas $m$ de $200$ g cada da figura estão ligadas por hastes rígidas e de massas desprezíveis, formando um triângulo equilátero de lado $40$ cm. Qual é a energia cinética de rotação desse triângulo se ele gira a $5{,}0$ rev/s em torno de um eixo perpendicular ao seu plano, passando pelo centro (o mesmo eixo mostrado na figura, marcado como "Eixo")?

  A) $15{,}8$ J
  B) $15.800{,}0$ J
  C) $0{,}032$ J
  D) $25$ J
  E) $18$ J
```
Gabarito: **A**
  *(esta questão tem figura)*

**fis1-uff-2019.2-p2** · medio · _Conceitos de rotação com velocidade angular constante_

```
Um corpo rígido gira em torno de um eixo fixo com velocidade angular constante $\omega$. Qual das afirmações não é verdadeira?

  A) Em qualquer ponto do corpo a aceleração angular é nula
  B) Um ponto qualquer do corpo, menos no eixo fixo, possui aceleração radial
  C) Se o corpo parar de girar, seu momento de inércia se torna nulo
  D) Todos os pontos do corpo têm a mesma velocidade angular
  E) O momento de inércia é de menor valor se o corpo gira em torno de um eixo que passa pelo seu centro de massa
```
Gabarito: **C**

**fis1-uff-2019.2-p2** · medio · _Momento de inércia de roda com anel e raios_

```
Uma roda é formada por um anel de raio $R$ e massa $M$, e 4 raios finos, perpendiculares entre si, de massa $m=3M/8$ cada um. Qual o momento de inércia da roda em relação ao eixo perpendicular à roda e passando pelo centro de massa?

  A) $\dfrac{1}{2}(M R^2)$
  B) $M R^2$
  C) $\dfrac{3}{2}(M R^2)$
  D) $2 M R^2$
  E) $3M R^2$
```
Gabarito: **C**

</details>

### Gravitação

0 questão(ões) na prova prevista · 1 no acervo deste slot.

- Velocidade orbital de satélite em órbita circular a partir da gravidade local

<details><summary>Exemplares (1 mais recentes)</summary>

**fis1-uff-2023.2-p2** · medio · _Velocidade orbital de satélite em órbita circular a partir da gravidade local_

```
Um satélite está em órbita circular em torno da Terra, a uma altura de $3{,}00\times10^5$ m, onde a aceleração da gravidade já é um pouco menor, valendo $8{,}90$ m/s². Qual é a sua velocidade orbital? (Dado: raio da Terra vale $6{,}37\times10^6$ m)

  A) $1{,}63\times10^3$ m/s
  B) $1{,}71\times10^3$ m/s
  C) $2{,}94\times10^3$ m/s
  D) $7{,}70\times10^3$ m/s
  E) $8{,}09\times10^3$ m/s
```
Gabarito: **D**

</details>

## O JSON que você entrega

Um array por lote, em `listas_questoes/gerado/`, no mesmo formato que o importador já lê
(ver `AGENTE_PROVA_UFF_FIS2.md` pra o contrato completo de campos e imagens):

```json
[
  {
    "materia": "Física I",
    "topico": "Energia",
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