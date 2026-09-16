-- supabase_sessao_lista.sql
--
-- Rodar DEPOIS de `supabase_agenda_consolidado.sql` (é ele quem declara a
-- forma final de `tarefas`).
--
-- É um DEPLOY BLOCKER: `carregarTarefasIntervalo` passa a pedir `mission_id`
-- no SELECT, e uma coluna faltando ali derruba a leitura do mês inteiro — o
-- calendário aparece vazio e a home perde as marcações do dia.
--
-- ---------------------------------------------------------------------------
-- Por que existe: o elo entre o PLANO e a EXECUÇÃO
-- ---------------------------------------------------------------------------
-- Até aqui, planejar e estudar eram dois mundos que não se falavam. O aluno
-- marcava "Estudar Cálculo II, quarta, 19h" no calendário e, na quarta, tinha
-- que ir até o Banco de Questões, escolher a disciplina de novo, escolher os
-- assuntos de novo e montar a lista na mão — a plataforma sabia do plano e
-- fingia que não. E o cartão "Você parou aqui" da home só existia DEPOIS da
-- primeira questão respondida, porque ele lê `missions`: quem só tinha
-- planejado não tinha o que retomar.
--
-- `mission_id` é esse elo, e só ele: o item da agenda aponta pra lista de
-- questões que nasceu dele. Com isso a home consegue
--   1. oferecer "Começar" no próprio plano do dia (em vez de um genérico
--      "monte uma lista"),
--   2. manter o NOME que o aluno deu ao bloco enquanto ele resolve as
--      questões ("Revisar derivadas" continua sendo o título do cartão de
--      progresso, no lugar de "Cálculo II"),
--   3. marcar o bloco como feito quando a lista fecha — o registro real
--      riscando o plano, e não o aluno riscando o plano à mão.
--
-- O que NÃO muda: agendar continua sem pagar XP, sem acender a ofensiva e sem
-- gerar missão sozinho. A missão só nasce quando o aluno clica em "Começar" —
-- ou seja, o elo grava uma DECISÃO dele, não uma promessa cumprida sozinha.
--
-- `on delete set null` de propósito: apagar a lista de questões (ou o aluno
-- refazer o plano) não pode apagar o compromisso do calendário. O plano
-- sobrevive à execução; o inverso é que não faz sentido.
alter table tarefas
  add column if not exists mission_id uuid references missions(id) on delete set null;

-- A home pergunta "esse bloco de hoje já virou lista?" e a tela de questões
-- pergunta "essa lista veio de um bloco?" — as duas passam por aqui. Parcial
-- porque a esmagadora maioria das linhas nunca terá missão (tarefa solta).
create index if not exists ix_tarefas_mission_id
  on tarefas (mission_id)
  where mission_id is not null;

-- ---------------------------------------------------------------------------
-- Nenhuma mudança de CHECK é necessária — e isso é o ponto
-- ---------------------------------------------------------------------------
-- O app passou a tratar SESSÃO e META como a mesma marcação ("Estudo"): um
-- bloco de estudo de uma disciplina que pode ter hora, duração e/ou um alvo
-- de questões. Eram dois botões que respondiam à mesma pergunta ("vou estudar
-- tal matéria hoje") e só diferiam na unidade — minutos ou questões.
--
-- Isso não custa migração porque `tarefas_duracao_check` e
-- `tarefas_meta_check` (ver supabase_agenda_consolidado.sql) já são
-- independentes de `tipo`: uma linha `tipo='sessao'` sempre pôde carregar
-- `meta_questoes`, o app é que zerava o campo. As linhas antigas com
-- `tipo='meta'` continuam válidas e são desenhadas do mesmo jeito — nada
-- precisa ser convertido.
--
-- ---------------------------------------------------------------------------
-- Verificação (esperado: uma linha)
-- ---------------------------------------------------------------------------
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_name = 'tarefas' and column_name = 'mission_id';
