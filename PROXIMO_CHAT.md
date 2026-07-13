# Instruções para Continuar a Conversão de Provas UFF P1 Física I

## Status Atual
**Lote 1 CONCLUÍDO** (72 questões): P1 14.1, 14.2, 15.1, 15.2, 16.1
- Arquivo gerado: `listas_questoes/gerado/fisica1_uff_p1_lote1.json`
- Validação: ✅ JSON válido, sem erros de estrutura, gabaritos conferidos

## Próximos Lotes a Fazer

### Lote 2 (próximo):
- **Provas**: P1 (16.2), (17.1), (17.2), (18.1), (18.2) — 5 provas × ~12-14 questões cada
- **Arquivo de saída**: `fisica1_uff_p1_lote2.json`

### Lote 3:
- **Provas**: P1 (19.1), (19.2), (22.1), (22.2), (23.1)
- **Arquivo de saída**: `fisica1_uff_p1_lote3.json`

### Lote 4:
- **Provas**: P1 (23.2), (24.1), (24.2), (25.1), (25.2)
- **Arquivo de saída**: `fisica1_uff_p1_lote4.json`

### Lote 5:
- **Provas**: P1 (26.1)
- **Arquivo de saída**: `fisica1_uff_p1_lote5.json`

## Instruções Importantes

### ⚠️ NÃO CRIAR, APENAS COPIAR
- **Não invente nem parafrasear questões** — copie os enunciados exatamente como estão nos PDFs
- **Não reformule alternativas** — use as opções como aparecem nas provas
- **Não tente "melhorar" as resoluções** — transcorreva a resolução do gabarito (ou do solucionário, se houver) de forma didática, mas fiel ao original

### 🚫 NUNCA redesenhar figura em TikZ — recortar do PDF
- **`tikz_code: null` (e `alternativas_tikz` ausente) em TODAS as questões.** Não tente reconstruir figura de prova em TikZ — o resultado sai errado. A figura correta já está renderizada no PDF de origem.
- Em vez disso, **sinalize** que a questão tem figura para o importador recortar direto da fonte:
  - Figura no enunciado → `"imagem_enunciado": true`
  - Figura numa alternativa → `"alternativas_com_imagem": ["a", "c"]` (as letras que têm figura)
- E **registre de onde a figura vem**, pra o recortador abrir na página certa:
  - `"fonte_arquivo"`: o nome do PDF de origem (ex.: `"P1 (16.2).pdf"` — pode ser aproximado, o match é tolerante a espaço/traço/maiúscula)
  - `"fonte_pagina"`: o número da página do PDF onde a figura aparece (1-based)
- TikZ só continua existindo como fallback raro (figura sintética que não existe em PDF nenhum). Para provas reais, **sempre** flag + fonte, nunca TikZ.

### ✅ O que fazer normalmente
- Extrair enunciado, alternativas (a–e) e gabarito conforme os PDFs
- Preencher `instituicao` como "UFF (1º sem.)" ou "UFF (2º sem.)" e `ano` conforme o nome do arquivo
- Preencher `subtopico` com granularidade adequada (tema específico dentro do tópico)
- Criar `resolucao` **didática e detalhada** (use o gabarito do PDF como base, reescreva com clareza se necessário)
- Seguir o formato JSON do lote 1 exatamente

### Formato JSON padrão
```json
{
  "materia": "Física I",
  "topico": "[do tópico conforme ementa]",
  "subtopico": "[específico]",
  "dificuldade": "facil|medio|dificil",
  "instituicao": "UFF (1º sem.)",
  "ano": 2014,
  "enunciado": "...",
  "alternativas": {"a": "...", "b": "...", "c": "...", "d": "...", "e": "..."},
  "gabarito": "a",
  "resolucao": "...",
  "tikz_code": null,
  "imagem_enunciado": false,
  "alternativas_com_imagem": [],
  "fonte_arquivo": "P1 (14.1).pdf",
  "fonte_pagina": 1
}
```
Se a questão tiver figura no enunciado, ponha `"imagem_enunciado": true`; se tiver em alternativas, liste as letras em `"alternativas_com_imagem"`. Preencha `fonte_arquivo`/`fonte_pagina` em toda questão que tenha qualquer figura (é o que faz o recortador abrir na página certa). Questões sem figura nenhuma podem omitir esses campos.

## Ementas Cobertas até Agora (Lote 1)
- Conceitos de Movimento
- Cinemática em Uma Dimensão
- Cinemática em Duas Dimensões
- Vetores e Sistemas de Coordenadas
- Força e Movimento
- Dinâmica do Movimento Retilíneo
- A Terceira Lei de Newton
- Dinâmica do Movimento no Plano
- Impulso e Momento Linear

Manter coerência com estes tópicos nos próximos lotes.

## Validação Final para Cada Lote
Antes de enviar, rodar:
```python
import json
data = json.load(open('listas_questoes/gerado/fisica1_uff_p1_loteX.json', encoding='utf-8'))
# Verificar: len(data), todos têm 5 alternativas (a-e), gabarito válido, sem erros de sintaxe
print(f"Total: {len(data)}")
for i, item in enumerate(data):
    assert set(item['alternativas'].keys()) == set('abcde'), f"Item {i}: alternativas inválidas"
    assert item['gabarito'] in set('abcde'), f"Item {i}: gabarito inválido"
print("✅ JSON válido")
```

---

**Boa sorte! Basta seguir o padrão do lote 1 e copiar fielmente das provas.**
