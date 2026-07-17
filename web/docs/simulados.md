# Rastreador de Simulados (`/aprovacao/simulados`)

Um domingo, uma prova: a escada de simulados (seed em `supabase_modo_aprovacao.sql`, tabela global `escada_simulados`) vai de Unicamp 2019 (19/jul, diagnóstico) até Fuvest 2025 (25/out, ensaio geral).

## Como usar

1. **Card "Próximo simulado"**: mostra a próxima entrada futura da escada, com a "função" daquele simulado.
2. **Novo simulado**: data, banca (Unicamp máx. 72 / Fuvest máx. 80 — validado), prova de referência (sugere a da escada), acertos por disciplina (o total é somado sozinho), tempo, erros por tipo (conteúdo/interpretação/atenção/tempo) e observações.
3. **Ao salvar**: `metas_mensais.acertos_atual` do mês vira o **melhor** total do mês (não o último).
4. **Lista**: cards por data desc com total, % e mini-barras por disciplina.
5. **Gráfico de evolução**: aparece com 2+ simulados — uma linha por disciplina (SVG puro, sem Chart.js: o eixo Y é *acertos por disciplina*, porque as provas não expõem o total de questões por disciplina — % seria inventado). Filtro por banca em cima.
