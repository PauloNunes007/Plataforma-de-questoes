# Manual do agente: converter UMA prova da UFF (Física II) em JSON

Você recebeu **uma prova** (um semestre + P1/P2/P3) da pasta `provas_uff/`.
Sua entrega é **um arquivo JSON validado** em `listas_questoes/gerado/`, com as
15 questões da prova, imagens já hospedadas, pronto pra importar no banco.

Trabalhe sozinho até o fim — não pare pra perguntar. Se algo for ambíguo, decida
pela regra de fidelidade (abaixo) e **relate a decisão no resumo final**.

---

## 0. Regra de ouro

Isto é **prova real de professor**, não conteúdo gerado. Você **transcreve**, não
cria e não melhora:

- **Nunca reformule alternativas** — nem pra deixá-las mais simétricas, nem pra
  corrigir erro do professor. Se a prova tem duas alternativas idênticas, ou uma
  alternativa em prosa entre quatro fórmulas, **mantenha fiel** e diga isso no
  resumo final.
- **Nunca invente questão, alternativa ou figura.** Se a prova tem 14 questões,
  entregue 14.
- **Nunca entregue um placeholder.** Se uma alternativa for irrecuperável
  (imagem corrompida no docx-fonte, texto ilegível), **descarte a questão
  inteira** — nada de `"(figura corrompida)"` como texto de alternativa: isso
  chega no aluno como questão quebrada. Entregue as 14 boas e diga no resumo
  qual questão você removeu e por quê.
- **Nunca redesenhe uma figura em TikZ.** `tikz_code` é sempre `null`; figura de
  prova real vira imagem hospedada (passo 4).
- A **resolução** (campo `resolucao`) é sua, escrita em português claro, com a
  física correta — essa parte você redige (baseada no gabarito detalhado, mas
  conferida por você).

---

## 1. Achar o par certo (prova + gabarito)

Liste os arquivos da pasta da prova. Tipicamente há muitas variantes:
`... A.docx`, `... A Impressão.docx`, `... Gabarito.docx`, `... Gabarito
Detalhado.docx`, `... Rascunho.docx`, `... Proposta.docx`, `... SABATISTAS ...`,
`Cópia de ...`, `versão 1`, `v2`, `B`.

Regras:

- Use a **versão A** (ou a única versão "final/limpa") como fonte do **enunciado
  e das alternativas**. Ignore a versão B, a menos que ela seja a única com
  gabarito legível.
- Use o **Gabarito Detalhado** (ou `Gabarito`, ou `com Respostas`) só pra
  **descobrir a letra certa e a lógica da resolução**.
- **NÃO use** arquivos `Rascunho`, `Proposta`, `SOBRAS`, `Banco de questões`,
  `Total`: são bancos maiores dos quais o professor escolheu as 15 finais, com
  placeholders e questões de outros professores.
- `SABATISTAS` é uma prova **separada** (turma de sabatistas) — não misture com a
  prova principal; ignore por padrão.
- **Confira que prova e gabarito são a MESMA prova** antes de confiar: compare o
  texto de 2–3 questões do meio (ex.: a 6, a 8 e a 12). Já aconteceu de
  `P3-Fis2 2025-1 v2.docx` (espaço) e `P3-Fis2 2025-1_v2 Gabarito
  Detalhado.docx` (underscore) serem provas **diferentes**. Se não baterem,
  procure na pasta qual arquivo bate de verdade.
- **Prova vence gabarito**: quando o texto de uma alternativa ERRADA diverge
  entre prova e gabarito, use o da **prova** — o gabarito costuma herdar texto
  velho do banco de questões. Se a divergência for na alternativa CORRETA,
  investigue (cruze com a versão B) antes de decidir.
- Se a prova "limpa" tiver a correta já destacada no Word (aparece como
  `[X)]{.mark}` no markdown), use como pista, mas **sempre confirme no
  gabarito detalhado**.
- **Gabarito que parece idêntico à prova**: acontece — o professor marcou a
  correta por **cor de fonte** (vermelho/negrito), e a conversão pra markdown
  descarta isso. Converta o mesmo docx pra HTML e procure a cor:

  ```bash
  "$PANDOC" "<gabarito.docx>" -f docx -t html -o "$OUT/gabarito.html"
  grep -o 'color:#[0-9A-Fa-f]\{6\}[^<]*' "$OUT/gabarito.html" | sort | uniq -c
  ```

  Depois localize no HTML quais alternativas estão dentro do span colorido.
  Outra saída: descompactar o docx (`unzip -o "<gabarito.docx>" -d "$OUT/xml"`)
  e ler `word/document.xml` procurando `w:color w:val="FF0000"` / `w:highlight`.
- Prova sem nenhum arquivo de gabarito: resolva você mesmo cada questão e diga
  isso no resumo final.

## 2. Converter DOCX → markdown com pandoc

O pandoc preserva as fórmulas como LaTeX real (`$...$`) e extrai cada imagem
embutida como PNG separado. **Não tente COM automation do Word** (`New-Object
-ComObject Word.Application`) — trava indefinidamente neste ambiente.

Use um diretório de trabalho no scratchpad da sessão. No Bash:

```bash
PANDOC="/c/Users/Paulo/AppData/Local/Pandoc/pandoc.exe"
OUT="<scratchpad>/uff/<ano>-<sem>-<prova>"
mkdir -p "$OUT"
"$PANDOC" "<caminho do docx>" -f docx -t markdown --extract-media="$OUT/media" -o "$OUT/prova.md"
"$PANDOC" "<caminho do gabarito>" -f docx -t markdown --extract-media="$OUT/media-gab" -o "$OUT/gabarito.md"
```

Leia os `.md` gerados. Artefatos comuns do pandoc pra limpar na transcrição:
`\` de escape antes de pontuação, `>` de citação, `[texto]{.mark}`,
`\'` , espaços não separáveis, `**negrito**` do Word em lugar aleatório.

## 3. Transcrever as questões

Campos de cada item (array JSON no topo do arquivo):

```json
{
  "materia": "Física II",
  "topico": "<um dos 10 abaixo, exato>",
  "subtopico": "<assunto específico, 3–10 palavras>",
  "dificuldade": "facil | medio | dificil",
  "instituicao": "UFF (1º sem.)" ,
  "ano": 2024,
  "enunciado": "...",
  "alternativas": { "a": "...", "b": "...", "c": "...", "d": "...", "e": "..." },
  "gabarito": "c",
  "resolucao": "...",
  "tikz_code": null,
  "imagem_enunciado": true,
  "alternativas_com_imagem": [],
  "imagem_url": "https://.../storage/v1/object/public/questoes/uff-fis2/..."
}
```

- `instituicao`: `"UFF (1º sem.)"` se a prova é do 1º semestre do ano,
  `"UFF (2º sem.)"` se do 2º. `ano`: o ano da prova.
- `topico`: **exatamente** um destes 10 (ementa cadastrada de Física II):
  `A Lei de Coulomb`, `O Campo Elétrico`, `A Lei de Gauss`, `Potencial Elétrico`,
  `Capacitores e Capacitância`, `Corrente e Resistência Elétricas`,
  `Circuitos de Corrente Contínua`, `O Campo Magnético`,
  `Indução Eletromagnética`, `Oscilações Eletromagnéticas e CA`.
  (P1 ≈ os 4 primeiros, P2 ≈ do potencial aos circuitos, P3 ≈ os 3 últimos —
  mas classifique pelo conteúdo real da questão, não pelo número da prova.)
- `imagem_enunciado`: `true` só se a questão tem figura; nesse caso
  `imagem_url` precisa estar preenchido (passo 4). Sem figura: `false` e
  **omita** `imagem_url`.
- `alternativas_com_imagem`: `[]` (só use se as ALTERNATIVAS forem figuras;
  nesse caso preencha também `alternativas_imagens` com `{ "a": "url", ... }`).
- LaTeX: use `$...$`. **Acento dentro de modo matemático quebra o KaTeX** —
  escreva `$I_{\text{através}}$`, nunca `$I_{através}$`. Prefira `\dfrac`,
  `\times 10^{-6}`, `\vec{E}`, `\mu`, `\varepsilon_0`. Vírgula decimal em
  português: `$3{,}0$`.
- Escreva a `resolucao` em markdown simples (parágrafos separados por `\n\n`),
  mostrando o caminho: fórmula → substituição → resultado.

### Verificação da matemática — MODO RÁPIDO (vigente desde 2026-09-10)

O dono confirmou: **confie na letra do gabarito impresso, não refaça a conta
de cada questão do zero.** Prioridade agora é velocidade sem perder fidelidade
estrutural. Isso muda o fluxo assim:

- Leia o gabarito detalhado (ou a lógica dele) e **escreva a `resolucao`
  seguindo esse caminho de raciocínio** (fórmula → substituição → resultado),
  chegando na letra marcada. Não é preciso recalcular independentemente com
  `node -e` questão por questão.
- **Só pare pra verificar de verdade** quando algo salta aos olhos: unidade
  visivelmente errada, ordem de grandeza absurda, ou a conta óbvia do
  enunciado claramente não bate com a letra marcada. Nesses casos, aí sim
  recalcule (`node -e`) e decida como antes (typo do gabarito → resolução com
  valor correto; senão marque no resumo como divergência).
- Continuam **inegociáveis** (fidelidade estrutural, não velocidade): nunca
  reformular alternativas, nunca inventar questão/figura, nunca placeholder
  pra alternativa irrecuperável, nunca redesenhar figura em TikZ, sempre
  achar o par prova+gabarito certo (passo 1), sempre validar imagem antes de
  subir, sempre rodar os 3 validadores no final.
- Se a pasta só tem **planilha de respostas** (letra, sem resolução — ex.:
  `Respostas_.xlsx`) e nenhum gabarito com lógica, aí sim resolva a questão
  você mesmo (não tem o que "copiar"), mas sem se aprofundar demais: caminho
  direto até a letra da planilha, sem explorar métodos alternativos.

O texto abaixo ("obrigatória, questão por questão") é o modo antigo,
mais lento — mantido só como referência caso o dono peça pra voltar a ele.

### Verificação da matemática — modo antigo (não é mais o padrão)

**Refaça a conta antes de aceitar a letra do gabarito impresso.** O gabarito é
digitado à mão e já teve erro real (uma esfera de "1,0 g" descrita como
"m=10⁻⁶ kg", que só bate com 10⁻³). Quando o enunciado e o gabarito divergirem
numericamente:

- se a sua conta com os dados do **enunciado** bate com a **letra** marcada,
  o gabarito tem typo na resolução → escreva a resolução com o valor correto;
- se nem assim bate, releia (unidades, fator 2, sinal). Só se ainda assim não
  fechar, **marque a questão no resumo final** como divergência não resolvida —
  não invente um gabarito.

Use `node -e "..."` pra contas numéricas em vez de fazer de cabeça.

## 4. Imagens

Nem toda imagem extraída é figura de questão: quase toda prova tem um
**formulário** de constantes no topo, extraído como várias imagens pequenas de
fórmula. Essas **não** viram `imagem_url`. As figuras de questão aparecem logo
depois do enunciado no markdown e são visivelmente maiores.

Dois problemas reais já vistos, ambos causados por *shapes flutuantes* do Word:

- **Figura que some na conversão.** O pandoc às vezes exporta, no lugar da
  figura, um PNG em branco de ~70 bytes. Se a questão claramente precisa de
  figura e o que saiu é uma imagem minúscula, é placeholder: ache a imagem real
  em `word/media/` do docx descompactado, casando a ordem dos `r:embed` no
  `word/document.xml` com a posição do texto da questão. **Qualquer PNG com
  menos de ~500 bytes não é figura de questão.**
- **Figura ancorada na questão errada.** Um shape flutuante pode ficar ancorado
  num parágrafo que não é o dele e aparecer no meio de outra questão. Antes de
  associar, confira que a figura combina com o enunciado (mesma notação de
  variáveis, mesmos valores) — numa prova real havia uma figura rotulada com
  σ/-σ ancorada numa questão cujas alternativas usavam η.

Sempre abra a imagem (Read) antes de subir.

1. Identifique quais `media/*.png` pertencem a quais questões (pela posição no
   markdown). **Abra as imagens candidatas com a ferramenta Read** pra confirmar
   que é mesmo a figura da questão certa antes de subir.
2. Suba com o script permanente (lê `web/.env.local`, usa service_role):

```bash
printf '%s\n' \
  "$OUT/media/media/image5.png|uff-fis2/2024-2-p1a/q03.png" \
  "$OUT/media/media/image7.png|uff-fis2/2024-2-p1a/q07.png" \
  | node listas_questoes/gerado/scripts/upload-imagens-uff-fis2.mjs
```

   Convenção de caminho: `uff-fis2/<ano>-<sem>-<prova><versão>/qNN.png`
   (ex.: `uff-fis2/2024-2-p1a/q03.png`). O script imprime a URL pública de cada
   uma — cole no `imagem_url` da questão correspondente.
3. **Questão com várias figuras** (ex.: 4 gráficos W/X/Y/Z pra comparar): como
   `imagem_url` é um campo único, componha as imagens numa grade única antes de
   subir. Python + Pillow funciona (ImageMagick não está instalado):

```python
from PIL import Image
imgs = [Image.open(p) for p in caminhos]
w, h = max(i.width for i in imgs), max(i.height for i in imgs)
grade = Image.new("RGB", (w*2, h*2), "white")
for k, im in enumerate(imgs):
    grade.paste(im, ((k % 2)*w, (k // 2)*h))
grade.save(destino)
```

## 5. Validar

Escreva o arquivo em `listas_questoes/gerado/fisica2_uff_<p1|p2|p3>_<ano>_<sem>.json`
(ex.: `fisica2_uff_p2_2024_2.json`) e rode os 3 validadores (passe só o nome do
arquivo, relativo a `gerado/`):

```bash
node listas_questoes/gerado/scripts/validar.mjs fisica2_uff_p2_2024_2.json
node listas_questoes/gerado/scripts/render-katex.mjs fisica2_uff_p2_2024_2.json
node listas_questoes/gerado/scripts/conferir-alternativas.mjs fisica2_uff_p2_2024_2.json
```

- `render-katex.mjs` **precisa passar limpo** — falha aqui é erro seu de LaTeX.
- `validar.mjs` e `conferir-alternativas.mjs` podem apontar coisas que são
  **fiéis à prova real** e não devem ser "consertadas":
  - "alternativas repetidas" quando duas só diferem por maiúscula/minúscula
    (`$q$` vs `$Q$` — variáveis diferentes): falso positivo do normalizador;
  - alternativas de fato idênticas impressas pelo professor;
  - a correta ser a única em prosa entre fórmulas.
  Em todos esses casos: **mantenha o texto da prova** e registre no resumo.
- Erro de verdade (matéria/tópico inexistente, gabarito apontando pra
  alternativa vazia, menos de 5 alternativas, LaTeX quebrado, enunciado
  duplicado com outra prova): **conserte**.

## 6. Resumo final

Termine reportando, em poucas linhas:

- arquivo gerado + nº de questões + quantas com figura;
- quais docx foram usados como prova e como gabarito;
- tópicos cobertos;
- **qualquer achado**: divergência prova×gabarito, erro do professor mantido,
  typo do gabarito corrigido na resolução, aviso esperado dos validadores,
  questão cuja matemática não fechou.

Não commite nada no git. Não importe nada no banco — quem coordena faz isso.
