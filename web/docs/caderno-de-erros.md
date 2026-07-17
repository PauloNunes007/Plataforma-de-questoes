# Caderno de Erros (`/aprovacao/erros`)

> **Feature de conta única**: todo o Modo Aprovação (link, botão flutuante, rotas, actions e RLS) só funciona pra conta admin (`paulocresponunes@gmail.com`).

Registra toda questão errada em simulados e listas, com print, e agenda a revisão espaçada (refazer em 1, 7 e 30 dias).

## Como usar

1. **Registrar um erro**: clique em **Novo erro** na página, ou no botão flutuante laranja **Erro rápido** — que aparece em *todas* as páginas logadas (menos dentro de `/questao`, pra não atrapalhar a missão). Cole o print direto do clipboard (Ctrl+V na área tracejada), arraste um arquivo ou escolha um. Preencha disciplina (obrigatório), tema, banca/ano/fase/questão, o que marcou, gabarito, o **tipo de erro** (obrigatório: Conteúdo / Interpretação / Atenção / Tempo), a resolução (aceita colar imagem — vira figura) e o conceito-chave em 1 frase.
2. **Aba "Refazer hoje"**: mostra os erros com revisão vencida (D+1, D+7 ou D+30 ≤ hoje). Clique em **Refiz D+N ✓** ao refazer. Quando as três etapas estão feitas, aparece **Arquivar**.
3. **Aba "Todos"**: todos os erros não arquivados, com filtros por disciplina, tipo de erro, banca e tema.
4. **Aba "Arquivados"**: consulta (com opção de desarquivar).

## Por baixo do capô

- Tabela `erros` (RLS dono-only) + bucket público `erros-imagens` (cada aluno só escreve na própria pasta) — ver `supabase_modo_aprovacao.sql`.
- As datas `refazer_em_1d/7d/30d` são preenchidas na criação (`salvarErroAction`); editar um erro não reagenda.
- Upload comprime pra JPEG no cliente (mesma `comprimirImagem` do importador).
