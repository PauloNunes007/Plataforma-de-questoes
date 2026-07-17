# Rastreador de Obras Literárias (`/aprovacao/obras`)

As 14 obras obrigatórias (9 Unicamp + 5 Fuvest), seed na tabela global `obras` com ordem de leitura e data-alvo por obra (cronograma jul→out/2026).

## Como usar

- **Barra global** no topo: X de 14 obras concluídas.
- Cada card mostra título, autor, % lido, data-alvo (fica laranja se venceu sem concluir).
- **Atualizar progresso**: informe página atual e total — o % é recalculado; ao chegar em 100%, a obra marca `concluida` e `metas_mensais.obras_atual` é recontado.
- **Fichamento**: modal com 5 campos (enredo/estrutura, narrador e foco narrativo, temas centrais, contexto do autor/movimento, trechos-chave). **Salva sozinho** enquanto digita (debounce de 1s), com indicador "Salvando…/Salvo".

Progresso e fichamento ficam em `obras_progresso` (RLS dono-only, uma linha por `user × obra`).
