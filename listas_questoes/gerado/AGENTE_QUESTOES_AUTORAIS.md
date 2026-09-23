# Manual do agente: escrever questões AUTORAIS no estilo de uma banca

Este manual é o **inverso** de `AGENTE_PROVA_UFF_FIS2.md`. Lá você transcreve uma
prova que existiu, sem criar nada. Aqui você **cria** — questões novas, que nunca
foram aplicadas, no estilo de uma prova real.

Entrega: **um arquivo JSON validado** em `listas_questoes/gerado/`, pronto pra
entrar pela fila de revisão de `/importar`.

Trabalhe sozinho até o fim. Se algo for ambíguo, decida pela regra de ouro
abaixo e **relate a decisão no resumo final**.

---

## 0. Regra de ouro

**Questão que você não consegue resolver não vai.** Não existe "provavelmente é
a C". Antes de fechar cada item:

1. resolva do zero, com as contas escritas;
2. confira que **exatamente uma** alternativa bate com o seu resultado;
3. confira que cada distrator é o resultado de **um erro plausível e nomeável**
   (sinal trocado, fator 2 esquecido, raio no lugar do diâmetro, esquecer a
   componente perpendicular). Distrator que é número aleatório entrega a
   resposta por eliminação e não ensina nada;
4. escreva a `resolucao` — ela é parte da entrega, não um extra.

Se a conta não fecha, **descarte a questão**. Entregar 11 boas é melhor que 15
com uma errada: uma questão com gabarito errado destrói a confiança do aluno no
banco inteiro, e ele não tem como saber que o erro é nosso.

---

## 1. Antes de escrever: o briefing

O dossiê da banca é gerado por um script, a partir das provas reais:

```
cd web && npx tsx scripts/briefing-banca.ts fis2 P1
```

Saída em `listas_questoes/gerado/briefings/<curso>-<slot>.md`. Ele traz, tudo
medido e nada opinado:

- **a composição da prova** — quantas questões de cada tópico, em quantas das
  edições aquele tópico caiu, e a faixa por prova;
- **o mix de dificuldade** ponderado por recência;
- **o inventário de arquétipos** — os `subtopico` das questões reais daquele
  slot. É aqui que o estilo da banca mora: não é "questão de Gauss", é
  *"indução em casca esférica condutora com carga puntiforme no centro"*;
- **exemplares íntegros** de cada tópico, os mais recentes primeiro, com
  enunciado, alternativas e gabarito.

Leia os exemplares antes de escrever a primeira linha. Eles respondem o que
nenhuma instrução responde: o comprimento típico do enunciado, se a banca usa
números redondos ou feios, se ela pergunta "qual é o valor" ou "está(ão)
correta(s)", se usa afirmativas I/II/III, se dá o resultado em símbolos ou em
unidades.

---

## 2. O que "no estilo da banca" significa

**Significa:** mesmo arquétipo, mesma profundidade de conta, mesmo formato de
alternativa, mesma quantidade de passos até a resposta.

**Não significa:** mesmo enunciado com outros números. Isso é cópia, o
importador tem detecção de duplicata por texto normalizado, e o aluno que já fez
a prova antiga reconhece na hora.

Três coisas concretas que separam uma questão que parece da banca de uma que
parece de livro:

- **A situação física é específica.** "Uma casca esférica condutora oca de raios
  0,80 m e 1,20 m com uma carga de +300 nC no centro" — não "um condutor
  carregado".
- **O número de passos é o da prova**, não o do exercício resolvido do capítulo.
  Uma questão de 2h/15 questões tem ~8 min: duas ou três etapas, não sete.
- **As cinco alternativas são plausíveis entre si** — mesma ordem de grandeza,
  mesma unidade, mesmo formato. Quatro fórmulas e uma prosa entregam a resposta.

---

## 3. O JSON

Mesmo contrato de campos e imagens de `AGENTE_PROVA_UFF_FIS2.md` — leia lá pra
figuras, LaTeX e nomes de tópico. As diferenças de questão autoral:

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

- **`instituicao` é `"Expectrum"`**, sempre. É o rótulo de autoria própria que o
  app já reconhece (`ehRotuloAutoral`, `web/src/lib/simulados/fontes.ts`).
- **`prova_codigo` não existe** em questão autoral, e não é pra inventar. Aquela
  coluna significa "esta questão saiu de uma prova que foi aplicada". Uma
  questão nossa catalogada como prova da universidade é uma mentira no banco, e
  ela vazaria pro acervo público de provas antigas.
- **`topico` tem que bater com um tópico existente** de `topicos` (o briefing
  lista os nomes exatos). O importador não cria tópico; nome novo cai na fila
  de revisão pro humano resolver.
- **`desafio` fica de fora** (ou `false`): o que se escreve aqui é questão *de
  prova*. Aprofundamento é outra coisa, com selo próprio (ver
  `supabase_questao_desafio.sql`).
- **Cinco alternativas**, como a prova.

Nomeie o arquivo por lote e origem: `fisica2_autoral_gauss_lote1.json`.

---

## 4. Quantas, e de quê

Siga a composição do briefing. Se a P1 tem 6 de Gauss e 5 de Campo Elétrico,
escrever 15 de Gauss não ajuda — a prova prevista sorteia por tópico e vai
deixar 9 delas de fora.

Distribua também pelos **arquétipos**: seis questões de Gauss todas sobre fluxo
por superfície fechada cobrem um sexto do que a banca pergunta. Varra a lista de
subtópicos.

E respeite o **mix de dificuldade**. Um lote só de difíceis desequilibra o
sorteio da prova prevista, que tenta bater o mix real da banca.

---

## 5. Depois da entrega

O arquivo entra por `/importar`. A fila de revisão mostra cada questão com o
LaTeX renderizado e a checagem de duplicata, e **nada vai pro banco sem alguém
aprovar** — é o único portão entre o que você escreveu e o aluno. Não tente
contorná-lo, e não escreva assumindo que alguém vai consertar depois.

Aprovadas, as questões entram no sorteio normal, no Banco de Questões e na
**prova prevista** daquele slot, porque a previsão sorteia por tópico e
dificuldade, não por origem.

---

## 6. Resumo final

Ao terminar, relate:

- quantas questões entregou, por tópico e por dificuldade;
- quantas você **descartou** e por quê (a conta não fechou, duas alternativas
  empatadas, arquétipo que não deu pra montar sem figura);
- qualquer decisão que você tomou sozinho e que alguém poderia ter tomado
  diferente.
