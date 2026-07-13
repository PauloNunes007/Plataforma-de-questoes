-- ============================================================
-- QUESTLY — subtópico por questão
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "questions" já existente). Migração aditiva e idempotente.
--
-- topicos.descricao já guarda os subtópicos da ementa, mas como um
-- texto único por tópico (ex: "Regras de derivação, funções
-- trigonométricas, regra da cadeia, ..."). Esta coluna deixa CADA
-- questão marcada com qual subtópico específico ela testa (ex:
-- "Regra da cadeia"), pra detalhar o banco de questões — usado pelo
-- importador (web/src/lib/importar) e exibido junto da questão em
-- /questao. Nullable: questões antigas ficam sem subtópico, sem
-- travar nada (mission-engine e chance-aprovacao não dependem disso).
-- Sem mudança de RLS (coluna herda a policy já existente de "questions").
-- ============================================================

alter table questions add column if not exists subtopico text;
