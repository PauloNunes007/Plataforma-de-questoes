# Conversão de Provas UFF — Física II (`provas_uff/`)

Companheiro do `PROXIMO_CHAT.md` (que cobre Física I, `listas_questoes/provas_antigasUFF/P1`).
Este arquivo cobre a pasta `provas_uff/` (raiz do repo), toda de **Física II**
(eletricidade/magnetismo), 2018–2025, ~350 arquivos DOCX/PDF (P1/P2/P3/VR/VS
por semestre, cada um com várias versões: rascunho, impressão, gabarito,
gabarito detalhado, versões A/B).

## Pipeline validado (2026-09-07)

Os arquivos são **DOCX** (não PDF como em Física I), então o pipeline é
diferente do `pdf-recortador` do `/importar`:

1. **Pandoc converte docx → markdown**, preservando fórmulas como LaTeX real
   (`$...$`) e **extraindo cada imagem embutida como PNG separado** via
   `--extract-media`:
   ```
   pandoc "arquivo.docx" -f docx -t markdown --extract-media=SAIDA/media -o SAIDA/arquivo.md
   ```
   Instalado via `winget install --id JohnMacFarlane.Pandoc` (binário fica em
   `%LOCALAPPDATA%\Pandoc\pandoc.exe`, não fica no PATH do bash por padrão).
   **Isso é estritamente melhor que abrir o DOCX/PDF renderizado**: a imagem
   sai exatamente como o professor colocou no Word, sem artefato de recorte
   de página. **Não tentar COM automation do Word (`New-Object -ComObject
   Word.Application`) neste ambiente — trava indefinidamente (sem diálogo
   visível pra depurar) mesmo com `DisplayAlerts=0`; abandonado a favor do
   pandoc.**
2. Leio o `.md` gerado (texto + LaTeX das fórmulas) pra transcrever cada
   questão. **Achado útil**: nos arquivos "limpos" (sem "Gabarito" no nome),
   a alternativa correta às vezes já vem destacada no Word (`[X)]{.mark}` no
   markdown) — provavelmente a cópia de trabalho do professor. **Sempre
   cruzar com o arquivo "Gabarito Detalhado"** (que tem a resolução
   completa) antes de confiar nisso — é como o gabarito de todas as 15
   questões da P1A 2025-2 foi conferido.
3. **Verificação independente da matemática antes de aceitar o gabarito
   impresso** — mesmo sendo prova real de professor (não conteúdo gerado por
   IA), o texto do "Gabarito Detalhado" pode ter erro de transcrição/digitação
   (achado real: a questão 12 da P1A 2025-2 tem no PDF "m=10⁻⁶ kg" pra uma
   esfera de "1,0 g", que é 10⁻³ kg — cálculo com o valor certo bate com o
   gabarito impresso "82 nC", com 10⁻⁶ NÃO bate. A resolução escrita no JSON
   usa o valor fisicamente correto, não o typo).
4. **Upload direto pro Storage em vez de flag `imagem_enunciado`+
   `fonte_arquivo`/`fonte_pagina`** (que é o fluxo pensado pro
   `pdf-recortador` recortar manualmente dentro do `/importar`): como as
   imagens já saem prontas e individuais do pandoc, um script
   (`scripts/upload-imagens-uff-fis2.mjs`, ver abaixo) sobe cada PNG relevante
   direto pro bucket `questoes` (`uff-fis2/<semestre>-<prova>/qNN.png`) via
   `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS) e devolve a URL pública, que vai
   direto no campo `imagem_url` do JSON. Isso pula a fila de revisão manual
   do importador inteiramente (`avaliarElegibilidadeAuto` só exige revisão
   quando `imagem_enunciado=true` E `imagem_url` está vazio) — mais rápido e
   sem risco de erro humano no recorte. `tikz_code` continua sempre `null`
   (nunca redesenhar figura de prova real — [[recorte_figuras_pdf_importador]]).
   **Nem toda imagem do docx é de uma questão** — a maioria dos exames tem um
   "formulário" de constantes/fórmulas no topo (extraído como várias imagens
   pequenas de fórmula do CodeCogs) que NÃO deve virar `imagem_url` de
   questão nenhuma; só subir as imagens que são de fato a figura de uma
   questão específica (fácil de identificar: aparecem logo depois do
   enunciado daquela questão no markdown, e têm dimensão bem maior que as
   imagens de fórmula isolada).
5. Formato do JSON: igual ao `PROXIMO_CHAT.md` (materia/topico/subtopico/
   dificuldade/instituicao/ano/enunciado/alternativas/gabarito/resolucao/
   tikz_code/imagem_enunciado/alternativas_com_imagem), **acrescido de
   `imagem_url` já preenchido** quando há figura (em vez de deixar pro
   recorte manual). `instituicao`: `"UFF (1º sem.)"` ou `"UFF (2º sem.)"`
   conforme o semestre da prova. Tópicos usam a ementa já cadastrada da
   matéria **"Física II"** (10 tópicos, `ordem` 1–10): A Lei de Coulomb, O
   Campo Elétrico, A Lei de Gauss, Potencial Elétrico, Capacitores e
   Capacitância, Corrente e Resistência Elétricas, Circuitos de Corrente
   Contínua, O Campo Magnético, Indução Eletromagnética, Oscilações
   Eletromagnéticas e CA.
6. Validação — os 3 scripts permanentes de `listas_questoes/gerado/scripts/`
   rodam igual (passar só o nome do arquivo, relativo a `gerado/`):
   ```
   node listas_questoes/gerado/scripts/validar.mjs fisica2_uff_p1_2025_2.json
   node listas_questoes/gerado/scripts/render-katex.mjs fisica2_uff_p1_2025_2.json
   node listas_questoes/gerado/scripts/conferir-alternativas.mjs fisica2_uff_p1_2025_2.json
   ```
   **Falso positivo conhecido do `validar.mjs`** pra prova real (não mexer):
   o checador de "alternativas repetidas" normaliza com `.toLowerCase()`,
   então duas alternativas que só se distinguem por maiúscula/minúscula
   (ex.: carga puntiforme `$q$` vs. carga da casca `$Q$` — variáveis
   fisicamente diferentes, notação real do professor) acusam falso
   "repetidas". Confirmado no item #5 da P1A 2025-2. Como a regra
   "não reformular alternativas" (`PROXIMO_CHAT.md`) tem prioridade pra
   conteúdo copiado de prova real, mantém o texto como está na prova —
   não é pra "consertar" trocando a variável.

## Script de upload de imagens

`scripts/upload-imagens-uff-fis2.mjs` (nome sugerido se for promovido pra
`listas_questoes/gerado/scripts/`; por ora vive só no scratchpad da sessão que
criou este arquivo). Lê pares `caminhoLocal|caminhoDestino` da stdin, um por
linha, e sobe cada um pro bucket `questoes` via REST API do Storage
(`POST {SUPABASE_URL}/storage/v1/object/questoes/{destino}`, headers
`apikey`/`Authorization: Bearer {SERVICE_ROLE_KEY}`, `x-upsert: true`), lendo
as envs de `web/.env.local`. Imprime `destino -> url pública` por linha.

## Status atual (2026-09-07)

**✅ Piloto concluído e validado**: `listas_questoes/gerado/fisica2_uff_p1_2025_2.json`
— P1 versão A, 2025/2º semestre, 15 questões (eletrostática: Coulomb, campo
elétrico, lei de Gauss, potencial elétrico), 8 com figura (já com `imagem_url`
apontando pro bucket `questoes/uff-fis2/2025-2-p1a/`). Passou nos 3 scripts de
validação (só o falso-positivo de case do item #5, ver acima).

**✅ P2 concluída e validada**: `listas_questoes/gerado/fisica2_uff_p2_2025_2.json`
— P2 versão A, 2025/2º semestre (fonte real: pasta `2025 2/P2/`, arquivos
`Cópia de P2-Fis2 02-2025 A_.docx` + `Cópia de P2-Fis2 02-2025 - Gabarito
Detalhado.docx` — nomes diferentes dos supostos no item "Por fazer" abaixo,
mas conferido pelo conteúdo do doc que é a P2 A de 2025-2), 15 questões
(potencial elétrico, capacitores, corrente/resistência, circuitos CC — nenhum
tópico de campo elétrico/Gauss nesta prova), 7 com figura. **Achado**: a
questão 5 tem 4 imagens de gráfico (W/X/Y/Z) que o aluno precisa comparar
lado a lado — como `imagem_url` é um campo único por questão, as 4 foram
compostas numa única grade 2×2 com Python/Pillow (`PIL.Image` + `paste`, sem
ImageMagick disponível no ambiente) antes do upload; script de composição não
foi promovido a arquivo permanente (rodou uma vez no scratchpad da sessão).
Gabarito impresso conferido matematicamente em todas as 15 (nenhum erro de
transcrição desta vez, diferente da P1). Passou nos 3 scripts de validação
sem nenhum falso-positivo.

**✅ P3 concluída e validada**: `listas_questoes/gerado/fisica2_uff_p3_2025_2.json`
— P3 versão A, 2025/2º semestre (fonte: pasta `2025 2/P3/`, `P3-Fis2
02-2025 A.docx` + `P3-Fis2 02-2025 A -- Gabarito Detalhado.docx` — únicos
nomes que bateram exatamente com o previsto no checklist), 15 questões
(magnetismo: campo magnético/Biot-Savart/Ampère, indução eletromagnética,
oscilações eletromagnéticas e CA — os 3 últimos tópicos da ementa de Física
II), 10 com figura. **Achado real (não é falso-positivo do validador)**: a
questão 1 tem as alternativas B e D **literalmente idênticas** ("14 mT,
para fora da página.") — confirmado abrindo o XML bruto de 3 arquivos docx
diferentes (`A.docx`, `A -- impressão.docx`, `A -- Gabarito Detalhado.docx`,
todos com o mesmo texto duplicado), então é um erro genuíno do professor
impresso na prova real, não artefato do pandoc. Como a resposta correta é A
e não temos como saber com que texto o professor pretendia diferenciar B de
D sem inventar conteúdo, a duplicata foi mantida fiel à prova real (mesma
lógica de "não reformular alternativas de prova real" do `PROXIMO_CHAT.md`)
— **o `validar.mjs` aponta esse item como problema; é esperado, não
corrigir**. Passou nos outros 2 scripts sem ressalvas (um warning do KaTeX
sobre acento dentro de modo matemático em "$I_{através}$" foi corrigido
envolvendo em `\text{}` antes de considerar pronto).

**✅ P1 2025-1 concluída e validada**: `listas_questoes/gerado/fisica2_uff_p1_2025_1.json`
— **Achado sobre nomenclatura de arquivo**: para este semestre não existe
um docx "limpo" simples como nos casos anteriores; a pasta `2025 1/P1/`
tem só `P1-Fis2 2025-1 A com Gabarito.docx` (a prova final montada, sem
marcação de gabarito visível no texto — foi usada como fonte do
enunciado), `P1-Fis2 2025-1 A Gabarito Detalhado.docx` (solução completa,
usada pra conferir as respostas) e `P1-Fis2 2025-1 rascunho.docx`/`SOBRAS.docx`
(**não usar** — são bancos de questões maiores dos quais o professor
escolheu as 15 da prova final; o rascunho tem placeholders vazios nas
questões 11-15 e uma seção de questões extras não numeradas de outros
professores ao final, então só a versão "com Gabarito" tem as 15 questões
reais da prova). 15 questões (eletrostática: Lei de Coulomb, campo
elétrico, lei de Gauss — **sem** potencial elétrico neste P1, diferente do
P1 2025-2), 8 com figura. Matemática do gabarito impresso conferida em
todas as 15, nenhum erro de transcrição encontrado. Passou nos 3 scripts
de validação sem nenhuma ressalva.

**✅ P3 2025-1 concluída e validada**: `listas_questoes/gerado/fisica2_uff_p3_2025_1.json`
— **Achado crítico de nomenclatura**: a pasta `2025 1/P3/` tem um arquivo
`P3-Fis2 2025-1 v2.docx` (espaço antes de "v2") que **NÃO é a mesma prova**
do `P3-Fis2 2025-1_v2 Gabarito Detalhado.docx` (sublinhado antes de "v2")
— as questões 6, 8 e 12 diferem completamente entre os dois (assuntos
totalmente diferentes: o primeiro tem uma questão de espira retangular
num campo não uniforme onde o segundo tem lei de Ampère com 8 fios, etc.).
A prova que realmente bate com esse gabarito é `P3-Fis2 2025-1_v2
Cópia.docx` (confirmado conferindo o texto das 3 questões divergentes).
**Lição geral**: nomes de arquivo parecidos (variando só espaço vs.
underscore, ou "Cópia") podem ser versões DIFERENTES da prova — sempre
conferir se o texto das questões do docx da "prova" bate com as questões
resolvidas no docx do "gabarito" antes de dar como pareados, especialmente
quando várias variantes (`v1`, `v2`, `Cópia`, `Versão B`) coexistem na
mesma pasta. 15 questões (campo magnético, indução eletromagnética,
oscilações eletromagnéticas e CA — magnetismo completo), 8 com figura.
Um achado do `conferir-alternativas.mjs` (questão 14: a alternativa
correta "campo magnético é zero" tem formato de prosa enquanto as outras
4 são fórmulas) é fiel à prova real do professor (conferido no docx bruto)
— não reformulado. Matemática de todas as 15 verificada independentemente,
sem erro de transcrição. Passou nos 3 scripts de validação (só esse
achado esperado de formato, não é erro).

**✅ P2 2025-1 concluída e validada**: `listas_questoes/gerado/fisica2_uff_p2_2025_1.json`
— fonte: pasta `2025 1/P2/`, `P2-Fis2 2025-1_v2.docx` (prova, versão A) +
`P2-Fis2 2025-1 Gabarito Detalhado.docx` (solução). **Achado importante,
generalizável pro resto do pipeline**: pra 3 questões (a 4ª, 8ª e 14ª) o
texto das alternativas no docx da prova (`_v2.docx`) diverge do texto no
docx do gabarito — e nesse caso **a prova venceu**, não o gabarito.
Cruzando com uma segunda versão paralela da mesma prova
(`P2_B-Fis2 2025.docx`, existe pra permitir 2 "formas" A/B do mesmo
exame) e com o banco de questões original de onde essas 3 vieram
(`P2-Fis2 2025-1 Gabarito Detalhado1.docx`, que é um banco tipo o
`rascunho` do P1 — **não usar como fonte de prova**, só cruzamento), ficou
claro que a prova impressa (`_v2.docx`, junto com a versão B) tem o texto
correto e ATUALIZADO das alternativas, enquanto os 2 documentos de
gabarito só copiaram o texto antigo do banco de questões sem sincronizar
com a versão final da prova (ex.: questão 8, opção B, banco/gabarito diz
"3,0 A" mas a prova real — nas duas versões A e B — imprime "12,0 A"; a
resposta correta, D, não muda em nenhum dos dois casos). **Regra geral daqui
pra frente**: quando prova e gabarito divergem só no texto de uma
alternativa ERRADA (não na resposta correta), preferir o texto da PROVA
real (não do gabarito) — o gabarito tende a herdar texto obsoleto do banco
de questões original; usar o gabarito só pra achar a letra certa e a
lógica da resolução, cruzando com uma 2ª versão da prova (A/B) quando
disponível para desempatar. 15 questões (potencial elétrico, capacitores,
corrente/resistência, circuitos CC), 6 com figura. Passou nos 3 scripts de
validação sem nenhuma ressalva.

**✅ 2024-2 P3 concluída e validada**: `listas_questoes/gerado/fisica2_uff_p3_2024_2.json`
— **Achado crítico de fonte**: a pasta `2024_2/P3/` não tem NENHUM arquivo
"Gabarito" (só `A.docx`, `A Impressão.docx`, `B.docx`, `B Impressão.docx`,
`Sabatista*.docx` e `Rascunho P3.docx`). A prova (`P3-Fis2 2024_2 A.docx`)
não tem nenhuma alternativa destacada em negrito/cor que indicasse a
resposta certa (o único trecho com `[X)]{.mark}` no markdown foi a questão
10 inteira, todas as 5 alternativas destacadas — não é pista de gabarito,
só formatação do professor). A solução veio do `Rascunho P3.docx`: ele é
um banco de 21 questões com solução completa passo a passo (créditos
"GABRIEL"/"Nivaldo"/"Evandro" nos enunciados — provavelmente 3 professores
diferentes propondo questões), do qual o professor escolheu 15 pra montar
a P3 final. Todas as 14 questões com solução no rascunho bateram
perfeitamente (texto do enunciado e das alternativas idêntico ou
equivalente) com as 14 primeiras questões da prova A — só a ordem das
questões foi embaralhada entre rascunho e prova final. Matemática de
todas as 14 refeita e conferida (`node -e`), nenhum erro de transcrição
do rascunho. **A questão 15 (única sem solução no rascunho — o banco
tinha só o enunciado dela, sem "Resolução")** é a clássica pergunta de
lei de Ampère com um contorno C serpenteante e 9 fios (5 saindo, 4
entrando na página): teve que ser resolvida do zero, incluindo determinar
GEOMETRICAMENTE (a curva não se autointersecta, mas o traçado sinuoso
deixa 4 dos 9 fios de fora da região que ela realmente encerra) quais
fios ficam dentro do contorno — usado processamento de imagem
(flood-fill com `scipy.ndimage.label`, script no scratchpad da sessão,
não promovido a arquivo permanente) pra classificar cada fio como
dentro/fora com confiabilidade, em vez de inspeção visual pura, já que a
figura tem várias reentrâncias sutis (duas delas excluem um ponto cada,
de forma visualmente não óbvia). O sentido de percurso da curva (horário,
confirmado por produto vetorial em 5 trechos diferentes do contorno,
incluindo as duas reentrâncias) dá o sinal da lei de Ampère: ficam
dentro 3 correntes saindo da página e 2 entrando, resultando em
$I_{env}=2I-3I=-I$ e resposta $-I\mu_0$ (bate exatamente com a alternativa
A, sem precisar arredondar/aproximar — bom sinal de que a análise
geométrica está certa). **Achado de digitação no docx original**: a
alternativa E) dessa questão 15 está fisicamente incompleta no XML do
Word — o professor deixou um run de subscrito vazio (só espaços) onde
deveria estar o "0" de "μ₀", terminando em "E) 2I/μ" colado direto em
"-- Fim da prova --". Como não é a alternativa correta e o padrão das
outras opções (D é "-5I/μ₀") deixa claro que faltou o "0" subscrito,
completou-se para "$2I/\mu_0$" no JSON (registrado aqui em vez de manter
o typo, diferente de erros que mudam a resposta certa). 15 questões
(campo magnético: força/torque/Ampère/força sobre carga, indução
eletromagnética, oscilações eletromagnéticas e CA — os 3 últimos tópicos
da ementa), 8 com figura (`uff-fis2/2024-2-p3a/q01.png` a `q15.png`, duas
delas `.jpg` porque a imagem de origem já era jpg no docx: q08 e q12).
Passou nos 3 scripts de validação sem nenhuma ressalva.

**Escopo total combinado com o usuário**: Física II, 2024–2025, mais recentes
primeiro, pra depois seguir cronologicamente pra trás até 2018. Dentro de
cada semestre, usar a versão **A** de cada prova (P1/P2/P3) como fonte
principal — não duplicar A e B (mesmo tipo de questão, números diferentes,
geraria quase-duplicata) a menos que uma B tenha uma questão claramente
diferente da A que valha a pena incluir também. VR/VS (2ª chamada/verificação
suplementar) ficam de fora por padrão — normalmente reaproveitam ou
recombinam questões de P1/P2/P3 do mesmo semestre.

**✅ P1 2024-2 concluída e validada**: `listas_questoes/gerado/fisica2_uff_p1_2024_2.json`
— fonte: pasta `2024_2/P1/`, `P1-Fis2 2024-2 Impressão A.docx` (prova) +
`P1-Fis2 2024-2 Gabarito A.docx` (gabarito). **Achado de nomenclatura**: apesar
do nome, `Gabarito A.docx` tem o MESMO texto que `Impressão A.docx` (nenhuma
resolução, nenhuma tabela de respostas preenchida) — a letra correta de cada
questão não está em texto nem em `[X)]{.mark}`, mas sim marcada por uma
**cor de fonte vermelha** aplicada só ao rótulo da alternativa certa
(`<w:color w:val="ff0000"/>` no XML bruto do docx, invisível no markdown do
pandoc — foi preciso descompactar o docx e procurar diretamente no
`word/document.xml`). Confirmado que `P1-Fis2 2024-2 versão 1.docx` tem
exatamente as mesmas 30 marcações vermelhas (mesma prova). Gabarito de todas
as 15 questões refeito e verificado numericamente com `node -e` antes de
aceitar; nenhum erro de transcrição do professor encontrado desta vez (todas
bateram). 15 questões (eletrostática: Coulomb, campo elétrico, lei de Gauss,
capacitores — a questão do capacitor, sobre o campo entre placas paralelas,
foi classificada em "Capacitores e Capacitância" mesmo sendo P1), 11 com
figura. **Achado real, não recuperável**: a alternativa E da questão 15
(direção do campo elétrico no centro de um semicírculo +Q/-Q) é uma imagem
de **1×1 pixel** (corrompida) tanto na versão A quanto na versão B do
arquivo-fonte do professor — não é artefato do pandoc, confirmado inspecionando
o XML bruto de ambos os docx. Como o gabarito (C, seta pra baixo) foi
recalculado independentemente e não depende do conteúdo de E, a questão foi
mantida com um texto placeholder honesto em vez de inventar o que a
alternativa mostrava — ver `subtopico`/`resolucao` do item 15 no JSON.
Questão 13 (capacitor) tinha as 5 alternativas como um único gráfico
já pronto do professor (não 5 imagens separadas) — usado como está,
composto com a figura do enunciado numa única imagem vertical (Pillow) antes
do upload, sem redesenhar nada. `conferir-alternativas.mjs` aponta duas
assimetrias de tamanho esperadas e fiéis à prova real (questão 6: alternativas
em unidades/notação diferentes por design; questão 14: "zero" em prosa entre
fórmulas) — mesmo padrão já visto e documentado nas provas anteriores, não
corrigido.

## Rodada de 2026-09-09/10 — 2023 e 2022-1 (8 provas)

Feitas por agentes paralelos, um por prova, seguindo
`listas_questoes/gerado/AGENTE_PROVA_UFF_FIS2.md`. **Ano de 2023 completo**
(P1/P2/P3 nos dois semestres) e **2022-1 completo**:
`p2_2023_1`, `p3_2023_1`, `p1_2023_2`, `p2_2023_2`, `p3_2023_2`,
`p1_2022_1`, `p2_2022_1`, `p3_2022_1` — 15 questões cada, todas passando nos
3 validadores (única ressalva: `p2_2023_1#13`, alternativas B e C idênticas
impressas pelo professor, mantida fiel).

### Lições novas (incorporar ao manual)

1. **Concorrência de agentes**: 8 agentes Opus simultâneos estouram o limite
   de sessão da conta (HTTP 429) e morrem todos sem entregar nada. **3 por vez**
   roda estável. O trabalho de pandoc/XML já feito fica no scratchpad e é
   reaproveitável na retomada — vale passar o caminho da pasta parcial no
   prompt do agente.
2. **A marcação vermelha do gabarito também vive na marca de parágrafo**
   (`w:pPr/w:rPr`), não só nos runs de texto. Quando as alternativas são
   auto-numeradas pelo Word, a letra "a)" vem da numeração e NÃO existe como
   texto — a cor está só no `pPr`. Em `p1_2022_1`, 13 das 15 corretas vieram
   daí; em `p3_2023_2`, 11 das 15. Um extrator que só olha `w:rPr` acha metade.
   Tons vistos: `ff0000` e `e6000e`.
3. **Questão com alternativas em figura não tem marcação de cor** (não dá pra
   colorir imagem) — o professor às vezes escreve "Resposta correta é a C" em
   vermelho ao lado do enunciado, às vezes não escreve nada. Nesses casos,
   resolver do zero e conferir com um segundo arquivo de gabarito se existir.
4. **Ângulo que só existe na figura** — armadilha recorrente e perigosa. Em
   `p3_2023_2#9` o "60°" é entre $\vec v$ e $\vec B$ (não entre $\hat n$ e
   $\vec B$); a leitura errada dá 90 mV, que é exatamente o distrator B. Mesmo
   padrão em `p3_2022_1#6` (239 mV correto; 276 mV e 138 mV são as leituras de
   90° e 30°). **Sempre medir o ângulo na imagem antes de aceitar a conta.**
5. **Divergência prova × gabarito pode cair na alternativa CORRETA**
   (`p3_2022_1#10`: prova "528 μT", gabarito "527 μT"). A conta deu 527,8 —
   os dois arredondam pro mesmo item, então "prova vence" seguiu valendo, mas
   a regra do manual pressupunha divergência só em alternativa errada.
6. **O pandoc zera fórmulas OMML nativas do Word** (alternativas saem como `$$`
   vazio). Duas saídas usadas: recortar do PDF impresso, ou ler o OMML direto
   do `word/document.xml` e converter pra LaTeX.
7. **Word reusa a mesma arte rodada** via `<a:xfrm rot="...">` — em
   `p1_2022_1#11` havia 3 PNGs de seta para 5 alternativas, todas a mesma seta
   em rotações diferentes. Reconstruir com Pillow aplicando as rotações reais,
   e conferir a ordem pelos offsets das âncoras (cada shape renderiza um
   parágrafo abaixo do que o ancora).
8. **Questão que referencia a vizinha** ("na questão anterior…", "o movimento
   descrito na 1ª questão") é padrão deste professor e chega quebrada no app,
   onde as questões vêm embaralhadas. Decisão adotada: **inlinar o contexto
   necessário** com as palavras da questão de origem, sem tocar nas
   alternativas. Aconteceu em `p2_2023_1#2`, `p3_2023_1#5`, `p3_2023_2#11-13`.

### Bug corrigido no `snapshot-banco.mjs`

A paginação por `Range` rodava sem `ORDER BY`, e o Postgres não garante a mesma
ordem entre as requisições — o snapshot vinha com linhas repetidas no lugar de
linhas que nunca chegavam (1179 baixadas, 1128 ids distintos), furando a
checagem de enunciado duplicado do `validar.mjs`. Agora os 3 alvos usam
`&order=id`.

### Duplicatas no banco (pendente de decisão)

`p3_2025_1` e `p3_2025_2` foram **importadas duas vezes** (30 linhas para 15
questões cada). O banco tem 308 linhas de Física II mas **278 questões
distintas**. Limpar isso é destrutivo (DELETE) e ficou pendente de decisão do
dono.

### Estado em 2026-09-10 (fim da tarde)

- **22 arquivos** `fisica2_uff_*.json`, **328 questões, nenhuma duplicata**
  entre lotes nem contra o banco (`p2_2022_2` novo, validado).
- **238 pendentes de importar** (só `p1_2025_2`, `p2_2025_1`, `p2_2025_2`,
  `p3_2024_2`, `p3_2025_1`, `p3_2025_2` já estão no banco).
- Importando as 238 pendentes: **516 questões distintas de Física II** — já
  passa da meta de 500 do dono, mas ainda faltam 13 provas do checklist
  abaixo (2022-2 P1/P3, 2019-1, 2019-2, 2018-1, 2018-2) pra fechar o escopo
  combinado (2018–2025 completo).

## Rodada de 2026-09-10 (tarde) — 2022-2, interrompida por rate limit

Disparados 3 agentes paralelos (P1/P2/P3 2022-2, mesmo padrão do
`AGENTE_PROVA_UFF_FIS2.md`). **Os 3 bateram no limite de sessão da conta
(HTTP 429, "session limit", reset 13:20 America/Sao_Paulo) e morreram no meio
do trabalho** — mesmo sintoma já visto com 8 agentes simultâneos, mas desta
vez com só 3, então o limite de sessão parece ser por *tempo/consumo*, não só
por concorrência; **ao retomar, espaçar os agentes ou rodar menos por vez**.

Resultado:
- **`fisica2_uff_p2_2022_2.json` ficou pronto e validado** (o agente chegou a
  escrever o arquivo antes de morrer) — 15 questões, 12 com figura, tópicos
  Corrente/Resistência (4), Circuitos CC (9), Capacitores (2). Passou nos 3
  validadores sem nenhuma ressalva.
- **P1 2022-2 e P3 2022-2 não geraram arquivo** — os agentes ainda estavam
  verificando figuras/física quando morreram (nenhum JSON parcial no disco).
  Fontes já identificadas (não precisa reachar):
  - P1: pasta `2022-2/`, `P1-Fis2 2022-2 Impressao.docx` +
    `P1-Fis2 2022-2 Gabarito.docx`.
  - P3: mesma pasta, `P3-Fis2 2022-2 Impressao.docx` +
    `P3-Fis2 2022-2 Gabarito.docx` (tem `.pdf` de backup também).
  Refazer do zero seguindo o manual.

### Por fazer (ordem: mais recente primeiro)
- [x] 2025-2 P1 (A) — `fisica2_uff_p1_2025_2.json` ✅
- [x] 2025-2 P2 (A) — `fisica2_uff_p2_2025_2.json` ✅ (fonte real: pasta
      `2025 2/P2/`, `Cópia de P2-Fis2 02-2025 A_.docx` + `Cópia de P2-Fis2
      02-2025 - Gabarito Detalhado.docx` — os nomes de arquivo previstos
      abaixo não bateram com o que existe na pasta; **conferir sempre o
      conteúdo real da pasta antes de assumir o nome do arquivo**, os nomes
      neste checklist são só uma expectativa pré-conversão)
- [x] 2025-2 P3 (A) — `fisica2_uff_p3_2025_2.json` ✅
- [x] 2025-1 P1 — `fisica2_uff_p1_2025_1.json` ✅
- [x] 2025-1 P2 — `fisica2_uff_p2_2025_1.json` ✅
- [x] 2025-1 P3 — `fisica2_uff_p3_2025_1.json` ✅
- [x] 2024-2 P1 — `fisica2_uff_p1_2024_2.json` ✅ (ver achado acima sobre
      marcação de gabarito por cor vermelha no XML do docx)
- [x] 2024-2 P2 — `fisica2_uff_p2_2024_2.json` ✅
- [~] (nota antiga) 2024-2 P2 (pasta `2024_2/`) — **conferir sempre se o docx da
      prova bate com o docx do gabarito antes de transcrever** (ver nota
      acima sobre `P3-Fis2 2025-1 v2.docx` vs. `..._v2 Cópia.docx`); e
      verificar se o gabarito usa a mesma marcação por cor vermelha (não
      texto/tabela) encontrada na P1
- [x] 2024-2 P3 — `fisica2_uff_p3_2024_2.json` ✅ (ver achado acima: pasta
      SEM nenhum arquivo "Gabarito"; gabarito veio de `Rascunho P3.docx`,
      um banco de 21 questões resolvidas do qual saíram 14 das 15 da prova;
      a 15ª — lei de Ampère com contorno serpenteante — foi resolvida do
      zero com apoio de flood-fill de imagem)
- [x] 2024-1 P1/P2/P3 ✅
- [x] 2023-1 P1/P2/P3 ✅
- [x] 2023-2 P1/P2/P3 ✅
- [x] 2022-1 P1/P2/P3 ✅
- [x] 2022-2 P1 — `fisica2_uff_p1_2022_2.json` ✅ (rodada 2026-09-10 noite,
      `fisica2_para_importar/NOVOS_ESTA_SESSAO/`)
- [x] 2022-2 P2 — `fisica2_uff_p2_2022_2.json` ✅ (validado, ver rodada
      2026-09-10 tarde acima)
- [x] 2022-2 P3 — `fisica2_uff_p3_2022_2.json` ✅ (rodada 2026-09-10 noite,
      `fisica2_para_importar/NOVOS_ESTA_SESSAO/`)
- [ ] 2019-1 P1 (pasta `2019/2019-1/Provas/P1/`, `P1 Fis2 2019-1.docx` —
      **sem gabarito dedicado**, só `Provas-Física2 - 2019-1
      Respostas_.xlsx`, letras sem lógica; resolver do zero guiado pela
      planilha) — nunca tentada
- [ ] 2019-1 P2 (pasta `.../P2/`, `P2 Fis2 2019-1 - vA.docx`; gabarito
      `P2resolvida.pdf` + `... vA - comrespostas.pdf`) — **agente morreu por
      limite de gasto mensal em 2026-09-10 noite**, refazer do zero
- [ ] 2019-1 P3 (pasta `.../P3/`, `P3-a Fis2 2019-1.docx` — **sem gabarito
      dedicado**, só a planilha de respostas) — nunca tentada
- [x] 2019-2 P1 — `fisica2_uff_p1_2019_2.json` ✅ (rodada 2026-09-10 noite,
      `fisica2_para_importar/NOVOS_ESTA_SESSAO/` — achado importante: 2
      tabelas de gabarito divergentes, resolvido cruzando 3 fontes)
- [ ] 2019-2 P2 (pasta `2019/2019-2/P2/`, `P2 Fis2 2019-2 -vA.docx`; gabarito
      escaneado `Digitalizado_gabp2 fis2 20192.pdf` um nível acima) —
      **agente morreu por limite de gasto mensal em 2026-09-10 noite**,
      refazer do zero
- [ ] 2019-2 P3 (pasta `.../P3/`, `P3 Fis2 2019-2 vA.docx` — **sem gabarito
      dedicado**, só a planilha de respostas) — nunca tentada
- [ ] 2018-1 P1 (pasta `2018/1o semestre/P1/`, `P1-A_2018-1_vFINAL.docx` —
      **sem gabarito dedicado**, usar `P1-errata_2018-1_vRespostas.docx`
      + planilha de respostas como desempate, conferir se é a mesma prova) —
      **agente morreu por limite de gasto mensal em 2026-09-10 noite**,
      refazer do zero
- [x] 2018-1 P2 — `fisica2_uff_p2_2018_1.json` ✅ (rodada 2026-09-10 noite,
      `fisica2_para_importar/NOVOS_ESTA_SESSAO/` — **20 questões**, não 15)
- [ ] 2018-1 P3 (pasta `.../P3/`, candidatos `P3-2018vFINAL-A_impressão.docx`
      + `P3 modelo I solução.docx`/`Prova 03 F solução.doc` — nomenclatura
      confusa, conferir pareamento com cuidado) — nunca tentada
- [x] 2018-2 P1 — `fisica2_uff_p1_2018_2.json` ✅ (rodada 2026-09-10 noite,
      `fisica2_para_importar/NOVOS_ESTA_SESSAO/`)
- [ ] 2018-2 P2 (pasta `.../P2/`, `P2_2018-2 - VersãoFinal.docx` — **NENHUM
      arquivo de gabarito existe nesta pasta**, resolver 100% do zero; deixar
      por último, é a mais difícil do checklist) — nunca tentada
- [x] 2018-2 P3 — `fisica2_uff_p3_2018_2.json` ✅ (rodada 2026-09-10 noite,
      `fisica2_para_importar/NOVOS_ESTA_SESSAO/`)
- [ ] (depois, se pedido) VR/VS e Curso de Verão de 2019

Cada prova gera seu próprio `fisica2_uff_<tipo>_<ano>_<sem>[_v].json` em
`listas_questoes/gerado/`, sempre passando pelos 3 scripts de validação antes
de considerar pronta pra importar via `/importar` (colar o JSON — o
auto-elegível entra direto, sem imagem pendente nenhuma nesse lote).

## Rodada de 2026-09-10 (noite) — pasta separada pro que falta importar + MODO RÁPIDO

O dono pediu pra acelerar (confiar na letra do gabarito impresso em vez de
recalcular cada questão do zero — ver seção nova "MODO RÁPIDO" em
`listas_questoes/gerado/AGENTE_PROVA_UFF_FIS2.md`, que agora é o padrão) e
pra separar tudo que falta importar numa pasta própria:
`listas_questoes/gerado/fisica2_para_importar/` (16 arquivos antigos, 238
questões, copiados de `gerado/` — README lá dentro lista quais) +
`listas_questoes/gerado/fisica2_para_importar/NOVOS_ESTA_SESSAO/` (6 arquivos
novos desta sessão, 95 questões — separados numa subpasta própria a pedido
explícito do dono, pra não esquecer especificamente destes).

**6 provas concluídas e validadas nesta sessão** (agentes paralelos, 3 por
vez, seguindo o manual):
- `fisica2_uff_p1_2018_2.json` (15) — gabarito por cor vermelha no XML;
  achado: várias figuras ancoradas na questão seguinte (deslocamento),
  reassociadas por notação/valores; Q4 resolvida por análise visual (sem
  gabarito) e recortada em 5 imagens de alternativa.
- `fisica2_uff_p3_2018_2.json` (15) — gabarito por parágrafo inteiro colorido;
  achado real: Q9 (fasores) tem os painéis A/D idênticos entre si e B/C
  idênticos entre si (resolvida por medição de ângulo em pixel, gabarito não
  marcava nada porque é só imagem); Q10 tem unidade errada do professor
  (mF em vez de mH) mantida fiel; Q15 tem duas alternativas idênticas
  (fidelidade, não erro).
- `fisica2_uff_p2_2018_1.json` (**20 questões**, não 15 — a prova real tem 20
  itens) — gabarito em 3 seções internas com embaralhamento independente
  entre si e vs. a prova A (resolvido por conteúdo, não por letra); duas
  figuras ancoradas na questão errada (corrigidas); Q20 tinha duas
  alternativas rotuladas "D" no impresso (relabeled a 2ª pra "e", texto
  intacto); Q17 o próprio professor anotou erro no gabarito ("faltou o ponto
  P na figura"), mantido.
- `fisica2_uff_p1_2022_2.json` (15) — gabarito por cor vermelha; pandoc
  perdeu 2 de 5 imagens de alternativa da Q10, recuperadas do XML bruto.
- `fisica2_uff_p3_2022_2.json` (15) — duas figuras corrompidas no docx-fonte
  (mesmo `r:embed`, 70 bytes) recuperadas recortando do gabarito em PDF;
  gabarito PDF tinha 16 questões (1 extra de outro banco, ignorada); Q6 sem
  alternativas em texto nem no gabarito, resolvida do zero e bateu com o PDF.
- `fisica2_uff_p1_2019_2.json` (15) — achado importante: duas tabelas da
  planilha de respostas discordam entre si em ~11/15 questões; resolvido
  cruzando resolução manuscrita parcial (7 questões) + física recomputada +
  cor `\color{red}` residual em 2 fórmulas do docx-fonte — todas as 3 fontes
  bateram com a tabela "versão A", não a de estatística; registrado como
  achado, não como decisão arbitrária.

**3 provas FALHARAM por limite de gasto mensal da conta** (não é o limite de
sessão/tempo já visto antes — mensagem HTTP 429 explícita "monthly spend
limit", reset mencionado 18:30 America/Sao_Paulo mas pode não ser o horário
real de reset de um limite mensal) — **nenhum arquivo foi gerado**, refazer
do zero na próxima sessão:
- P1 2018-1 — fontes: pasta `2018/1o semestre/P1/`, `P1-A_2018-1_vFINAL.docx`
  (ou `_vIMPRESSAO.docx`) como prova; **sem gabarito dedicado nesta pasta** —
  usar `P1-errata_2018-1_vRespostas.docx` (conferir se é a mesma prova antes)
  + `Provas-Física2 - 2018-1 Respostas_.xlsx` como desempate.
- P2 2019-1 — fontes: pasta `2019/2019-1/Provas/P2/`, `P2 Fis2 2019-1 -
  vA.docx` como prova; gabarito em `P2resolvida.pdf` (solução completa) +
  `P2 Fis2 2019-1 - vA - comrespostas.pdf` (cross-check).
- P2 2019-2 — fontes: pasta `2019/2019-2/P2/`, `P2 Fis2 2019-2 -vA.docx` como
  prova; gabarito escaneado `Digitalizado_gabp2 fis2 20192.pdf` (nível acima
  da pasta P2) + `Provas-Física2 - 2019-2 Respostas_.xlsx` como cross-check;
  há também um `P2_q1.jpg` solto na pasta P2, conferir se é figura útil.

**Ainda faltam 5 provas do checklist original de 14** (além das 3 que
falharam acima): P3 2018-1, P1 2019-1, P3 2019-1, P3 2019-2, P2 2018-2.
Caminhos já levantados (ver seção "Por fazer" abaixo, que tem o checklist
completo com anotações de qual arquivo é prova/gabarito pra cada uma —
**P2 2018-2 não tem NENHUM arquivo de gabarito na pasta**, é a mais difícil,
deixar por último).

**Lição nova**: rodar só 3 agentes por vez continua sendo o padrão seguro
pra concorrência, mas **o limite de gasto mensal é uma parede dura e
diferente do limite de sessão/tempo** — quando bater, não adianta esperar
poucos minutos e tentar de novo; melhor conferir o uso em
claude.ai/settings/usage antes de disparar uma nova leva grande.

### Status agregado (2026-09-10 noite)
- **28 arquivos** `fisica2_uff_*.json` no total do projeto (22 antigos + 6
  novos), **423 questões** (328 antigas + 95 novas), nenhuma duplicata
  conhecida.
- **333 questões pendentes de importar** (238 antigas + 95 novas) — já bem
  acima da meta de 500 somando com as ~90 já no banco (banco atual ~278-308
  distintas + 333 pendentes ≈ 611-641 depois de importar tudo).
- Restam **8 provas** pra fechar o escopo 2018-2025 completo (3 que falharam
  por rate limit + 5 nunca tentadas nesta rodada).

## Importação final — meta de 500 atingida (2026-09-10, madrugada)

Rodado `scripts/importar-supabase.mjs` com todos os 22 arquivos de
`fisica2_para_importar/` (+ `NOVOS_ESTA_SESSAO/`) direto contra o banco via
`SUPABASE_SERVICE_ROLE_KEY`. **Descoberta**: a maioria dos 16 arquivos
"antigos" já estava importada de uma rodada anterior desta mesma sessão (o
`README.md` da pasta estava desatualizado) — só 112 questões eram de fato
novas (`p1_2025_1`: 15, `p3_2022_1`: 2, os 6 de `NOVOS_ESTA_SESSAO/`: 77+20=97,
conferir: 15+2+95=112). Todas as 112 foram inseridas com sucesso.

**Bug corrigido no script**: `importar-supabase.mjs` só tratava HTTP 204 como
"resposta sem corpo"; o insert com `Prefer: return=minimal` volta 201 com
corpo vazio, e `r.json()` quebrava em `SyntaxError: Unexpected end of JSON
input` no meio do lote (o primeiro `POST` de 50 já tinha inserido antes de
morrer). Corrigido pra ler `r.text()` e só fazer `JSON.parse` se não-vazio;
rodar de novo é idempotente (dedupe por enunciado contra o banco).

**Resultado final: 611 questões distintas de Física II no banco** (655
linhas — as 44 de diferença são as duplicatas conhecidas de `p3_2025_1`/
`p3_2025_2`, importadas 2x numa rodada anterior; limpeza é destrutiva
[DELETE] e segue pendente de decisão do dono, não mexida nesta passada).
**Meta de 500 do dono: atingida e superada.**

Ainda restam as **8 provas nunca convertidas** do checklist original
(P1/P3 2018-1, P1/P3 2019-1, P2/P3 2019-2, P2 2018-2) — não são necessárias
pra bater a meta de 500, ficam pro próximo pedido explícito de fechar o
escopo 2018–2025 completo (ver checklist "Por fazer" acima pra retomar).
