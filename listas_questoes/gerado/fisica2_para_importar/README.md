# Física II UFF — importação

**Atualização 2026-09-10: todos os 22 arquivos desta pasta (e da subpasta
`NOVOS_ESTA_SESSAO/`) já foram importados** via
`node listas_questoes/gerado/scripts/importar-supabase.mjs <arquivos...> --confirm`
(direto no banco com `SUPABASE_SERVICE_ROLE_KEY`, não pelo `/importar`
colando na mão). A maioria dos 16 "antigos" já estava no banco de uma rodada
anterior (0 novas); só `p1_2025_1` (15), `p3_2022_1` (2) e os 6 da
`NOVOS_ESTA_SESSAO/` (77, incl. 20 de `p2_2018_1`) entraram de fato nesta
passada — 112 questões novas no total. **Banco agora: 611 questões distintas
de Física II** (655 linhas — 44 são duplicatas conhecidas de `p3_2025_1`/
`p3_2025_2` importadas 2x antes, decisão de limpeza ainda pendente do dono,
ver `PROXIMO_CHAT_FIS2_UFF.md`). Meta de 500 **atingida e superada**.

Achado no processo: o script `importar-supabase.mjs` tinha um bug — tratava
só HTTP 204 como "sem corpo", mas o Supabase responde 201 com corpo vazio
quando `Prefer: return=minimal`, e `r.json()` quebrava em corpo vazio.
Corrigido pra ler o texto primeiro e só fazer `JSON.parse` se não-vazio.

Todo arquivo aqui já passou pelos 3 validadores
(`validar.mjs`, `render-katex.mjs`, `conferir-alternativas.mjs`).

## Já prontos (copiados de `listas_questoes/gerado/`, 16 arquivos, 238 questões)

- fisica2_uff_p1_2022_1.json (15)
- fisica2_uff_p1_2023_1.json (15)
- fisica2_uff_p1_2023_2.json (15)
- fisica2_uff_p1_2024_1.json (15)
- fisica2_uff_p1_2024_2.json (13 — 2 questões descartadas na origem, ver nota
  no `PROXIMO_CHAT_FIS2_UFF.md`: figura corrompida no docx-fonte)
- fisica2_uff_p1_2025_1.json (15)
- fisica2_uff_p2_2022_1.json (15)
- fisica2_uff_p2_2022_2.json (15)
- fisica2_uff_p2_2023_1.json (15)
- fisica2_uff_p2_2023_2.json (15)
- fisica2_uff_p2_2024_1.json (15)
- fisica2_uff_p2_2024_2.json (15)
- fisica2_uff_p3_2022_1.json (15)
- fisica2_uff_p3_2023_1.json (15)
- fisica2_uff_p3_2023_2.json (15)
- fisica2_uff_p3_2024_1.json (15)

## Novos desta sessão (2026-09-10) — ver `NOVOS_ESTA_SESSAO/`

6 arquivos, 95 questões, gerados nesta sessão e separados numa subpasta
própria pra não esquecer de importar (ver README lá dentro). Faltam ainda 8
provas do checklist original de 14 — ver `PROXIMO_CHAT_FIS2_UFF.md` (raiz do
repo) pro status completo, achados de cada prova e o que retomar (3 provas
falharam por limite de gasto mensal nesta rodada e precisam ser refeitas do
zero: P1 2018-1, P2 2019-1, P2 2019-2).

## Já estão no banco (NÃO estão aqui, não reimportar)

p1_2025_2, p2_2025_1, p2_2025_2, p3_2024_2, p3_2025_1, p3_2025_2.

## Como importar

Colar o conteúdo de cada JSON em `questly_importar.html` (ou
`/importar` no Next.js) — itens sem imagem pendente entram automaticamente,
o resto cai na fila de revisão. Import um arquivo de cada vez pra facilitar
conferência caso algo dê errado.
