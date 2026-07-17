# Dashboard "Hoje" do Modo Aprovação (`/aprovacao`)

A central diária da preparação Unicamp/Fuvest 2026. Não mexe no dashboard normal do app (`/dashboard`) nem no mission engine — é uma página própria, **visível só pra conta admin** (feature de conta única, ver `caderno-de-erros.md`).

## O que mostra

- **Data + semana do plano**: detecta automaticamente a semana S1–S14 (começa em 14/jul/2026) pela `data_inicio` do `cronograma_semanal`.
- **Countdown**: dias restantes pra Unicamp (18/out) e Fuvest (1º/nov) — constantes em `lib/aprovacao/constantes.ts`.
- **Grade de hoje**: blocos fixos por grupo de dia — Seg/Qua/Sex (Matemática, Física, Biologia, História, Obra, Redação), Ter/Qui/Sáb (Matemática, Química, Exercícios extras, Geografia, Obra, Interpretação/Inglês) e Domingo (bloco único SIMULADO 9h–14h com a prova designada da escada). Cada bloco tem checkbox persistido em `sessoes_estudo` (upsert por `user/data/bloco`). Marcar o bloco de Redação recalcula `metas_mensais.redacoes_atual` (contagem do mês).
- **Tópicos da semana**: um card por disciplina com o tópico da semana atual do cronograma.
- **Revisões pendentes**: contagem de erros com refazer vencido, linkando pro caderno.
- **Progresso das obras**: X de 14, com barra.
- **Metas do mês**: acertos no melhor simulado, redações escritas (com ajuste manual ±) e obras lidas — metas editáveis no lápis do card.
