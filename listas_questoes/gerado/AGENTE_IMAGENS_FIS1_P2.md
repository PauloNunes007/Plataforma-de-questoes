# Manual do agente: preencher as figuras de UMA prova P2 de Física I (UFF)

Você recebeu **uma prova** (um semestre, P2 de Física I). O JSON com as 15–20
questões **já está transcrito e validado** (enunciado, alternativas, gabarito,
resolução, tópico — tudo certo). O que falta é só isto: **as questões com
figura têm `imagem_enunciado: true` (ou `alternativas_com_imagem` preenchido),
`fonte_arquivo`/`fonte_pagina` apontando pro PDF de origem, e `imagem_url: null`**.
Sua entrega é o mesmo arquivo com essas figuras recortadas do PDF real,
hospedadas, e `imagem_url`/`alternativas_imagens` preenchidos.

Não mexa em enunciado, alternativas, gabarito, resolução ou tópico — a menos
que veja um erro genuíno (aí registre no resumo, não corrija silenciosamente).

---

## 0. Regra de ouro

- **Nunca redesenhe a figura** (TikZ, à mão, etc.) — sempre recorte do PDF real.
  `tikz_code` fica `null`.
- **Nunca invente o que uma figura mostra.** Se não der pra recuperar (PDF
  corrompido/ilegível), documente no resumo em vez de inventar.
- A prova é **real**: os PDFs em `fisicaI_p2/` já têm a resposta certa marcada
  em **vermelho** no texto impresso (ex.: `(B) 45 km/h` em vermelho). Isso é só
  uma checagem de brinde — se a letra vermelha bater com o `gabarito` do JSON,
  ótimo; se divergir, **registre no resumo, não corrija sozinho** (o JSON já foi
  validado numa sessão anterior, mas vale reportar).

## 1. Achar o PDF de origem

Os arquivos estão em `fisicaI_p2/` na raiz do repo, nomeados `P2 (AA.S) Física
I.pdf` (AA = 2 dígitos do ano, S = semestre). **O nome tem acento e o terminal
frequentemente corrompe "Física" ao imprimir — não digite o nome inteiro.**
Ache o arquivo por glob, casando só o prefixo sem acento:

```python
from pathlib import Path
pdf = next(Path('fisicaI_p2').glob('P2 (17.1)*.pdf'))  # ano 2017, 1º sem.
```

(Ano 2026 tem só `P2 (26.1)`, sem 2º semestre ainda — não é erro.)

## 2. Detectar e recortar a figura

Script pronto em `listas_questoes/gerado/scripts/pdf_figuras.py` (usa
PyMuPDF): porta o mesmo heurístico do recortador de PDF do `/importar`
(subtrai texto da "tinta" da página, agrupa em componentes conexos). Rode do
Bash (o Python do PATH já tem `fitz`/`numpy`/`scipy`/`PIL`):

```bash
python listas_questoes/gerado/scripts/pdf_figuras.py render "<pdf>" <pagina 1-based> "<outdir>" --dpi 220
```

Isso escreve em `<outdir>`: `clean.png` (render limpo), `annotated.png` (com
caixas candidatas numeradas #0, #1, #2…) e `boxes.json` (coordenadas de cada
caixa, em pixels da imagem). Use um `outdir` no scratchpad da sessão, um
subdiretório por página (`<scratch>/fis1p2/<ano>-<sem>/pXX/`).

**Abra `annotated.png` com a ferramenta Read** pra ver as caixas sugeridas.
Elas são só sugestão — a detecção às vezes junta duas figuras vizinhas numa
caixa só, ou separa uma figura em várias caixas (comum quando a questão tem
vários gráficos pequenos pra comparar). Você não está preso às caixas: pode
recortar **qualquer retângulo** olhando a imagem (a ferramenta Read mostra as
dimensões originais da imagem — ex. "1819x2573" — e o fator de escala em que
foi exibida; calcule x/y/w/h na resolução ORIGINAL, não na exibida).

Recortar (a partir do `clean.png`, nunca do `annotated.png`):

```bash
python listas_questoes/gerado/scripts/pdf_figuras.py crop "<outdir>/clean.png" <x> <y> <w> <h> "<saida.png>"
```

**Questão com várias figuras que o aluno precisa comparar lado a lado** (ex.:
gráficos I/II/III/IV/V, ou W/X/Y/Z) e que são uma ÚNICA figura de enunciado:
recorte cada uma separada, depois componha numa grade:

```bash
python listas_questoes/gerado/scripts/pdf_figuras.py compor "<saida_grade.png>" "<img1.png>" "<img2.png>" ...
```

Isso só se aplica a `imagem_enunciado` (a alternativa é texto "I"/"II"/etc.).
Se em vez disso CADA alternativa (a, b, c, d, e) tem sua própria figura
diferente, recorte cada uma separadamente e mande pra
`alternativas_imagens` (uma URL por letra), sem compor.

**Antes de subir, abra o PNG recortado com Read** pra confirmar que pegou a
figura certa (não cortou metade, não pegou a figura da questão vizinha).

## 3. Subir pro Storage

Script permanente e genérico (lê `web/.env.local`, usa `service_role`, já
usado no pipeline de Física II — o nome do arquivo é histórico, funciona pra
qualquer destino no bucket `questoes`):

```bash
printf '%s\n' \
  "<saida1.png>|uff-fis1/2017-1-p2/q02.png" \
  "<saida2.png>|uff-fis1/2017-1-p2/q05_a.png" \
  | node listas_questoes/gerado/scripts/upload-imagens-uff-fis2.mjs
```

Convenção de caminho: `uff-fis1/<ano>-<sem>-p2/qNN.png` pro enunciado
(NN = número da questão, 2 dígitos, na ordem em que aparece no PDF — **não**
o índice do array, que pode diferir se alguma questão foi descartada antes);
`uff-fis1/<ano>-<sem>-p2/qNN_<letra>.png` pra figura de alternativa. Rode o
upload de uma vez só pro lote inteiro da prova (uma chamada, várias linhas),
não uma chamada por imagem. O script imprime a URL pública de cada uma.

## 4. Atualizar o JSON

Pra cada questão que ganhou imagem:

- `imagem_enunciado: true` → preencha `"imagem_url": "<url pública>"`.
- `alternativas_com_imagem: ["a","c"]` → preencha `"alternativas_imagens":
  {"a": "<url a>", "c": "<url c>"}` (mesma chave usada no resto do banco —
  confira um exemplo real com
  `grep -l alternativas_imagens listas_questoes/gerado/fisica2_uff_p1_2022_1.json`
  se quiser conferir o formato).
- Depois de preencher, **remova os campos `fonte_arquivo` e `fonte_pagina`**
  dessa questão (eram só pro recorte manual; o formato final não os usa — os
  arquivos de Física II não têm esses campos).

Edite o arquivo `listas_questoes/gerado/fisica1_uff_p2_<ano>_<sem>.json`
diretamente (Edit tool, não reescreva o array inteiro à mão — risco de
corromper o JSON).

## 5. Validar

```bash
node listas_questoes/gerado/scripts/validar.mjs fisica1_uff_p2_<ano>_<sem>.json
node listas_questoes/gerado/scripts/render-katex.mjs fisica1_uff_p2_<ano>_<sem>.json
node listas_questoes/gerado/scripts/conferir-alternativas.mjs fisica1_uff_p2_<ano>_<sem>.json
```

Nenhuma questão deve sobrar com `imagem_enunciado: true` e `imagem_url: null`,
nem letra em `alternativas_com_imagem` sem entrada correspondente em
`alternativas_imagens`. Rode este check antes de finalizar:

```bash
node -e "
const d = require('./listas_questoes/gerado/fisica1_uff_p2_<ano>_<sem>.json');
d.forEach((q,i) => {
  if (q.imagem_enunciado && !q.imagem_url) console.log('FALTA enunciado', i);
  (q.alternativas_com_imagem||[]).forEach(l => {
    if (!q.alternativas_imagens || !q.alternativas_imagens[l]) console.log('FALTA alt', i, l);
  });
});
console.log('ok, checado', d.length, 'questões');
"
```

## 6. Resumo final

Reporte em poucas linhas: quantas figuras subiu (enunciado vs. alternativa),
qualquer figura que não deu pra recuperar (e por quê), qualquer divergência
entre o gabarito do JSON e a letra marcada em vermelho no PDF, e confirmação
de que os 3 validadores passaram limpo.

Não commite nada no git. Não importe nada no banco — quem coordena faz isso
depois de conferir uma amostra das imagens.
