-- supabase_modo_estudo.sql
--
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql e de
-- supabase_seguranca_hardening.sql (nada aqui depende do hardening, mas as
-- duas colunas abaixo precisam conviver com o trigger questly_proteger_colunas_profile
-- — e NENHUMA delas é protegida por ele, de propósito: são preferências de
-- estudo, não plano/XP/liga/streak, então o UPDATE dono-only que já existe em
-- `profiles` alcança as duas, igual a `aceita_emails` e a
-- `distintivos_selecionados`).
--
-- É um DEPLOY BLOCKER: o app lê `profiles.modo_estudo` na home, na trilha, em
-- Configurações e no onboarding, e lê/escreve `missions.adiada_para` no
-- controle manual da missão do dia.
--
-- ---------------------------------------------------------------------------
-- 1) profiles.modo_estudo — a plataforma é MODULAR
-- ---------------------------------------------------------------------------
-- 'guiado' = o aluno aceita a trajetória por data de prova: o motor monta a
--            missão do dia, o cerco ao Boss e a projeção existem.
-- 'livre'  = o aluno só quer resolver questão, montar lista, fazer simulado e
--            competir no ranking. Missões, Boss e a projeção somem da interface
--            (o app esconde; nada é apagado, então voltar pro guiado restaura
--            tudo o que já existia).
--
-- Default 'guiado' de propósito: é o comportamento que todas as contas atuais
-- já têm, e nenhuma delas muda ao rodar esta migração.
alter table profiles
  add column if not exists modo_estudo text not null default 'guiado';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_modo_estudo_check'
  ) then
    alter table profiles
      add constraint profiles_modo_estudo_check
      check (modo_estudo in ('guiado', 'livre'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) missions.adiada_para — o aluno manda no próprio dia
-- ---------------------------------------------------------------------------
-- null            = missão normal.
-- uma data futura = o aluno ADIOU (ou trocou a disciplina de hoje). A linha
--                   CONTINUA com `data` = o dia original, e é isso que faz o
--                   mission-engine não regerar a mesma missão cinco segundos
--                   depois: o índice único ux_missions_dia
--                   (user_id, subject_id, data) já está ocupado. No dia
--                   apontado, o motor volta a incluir aquela disciplina mesmo
--                   que a grade semanal não a tenha marcado.
--
-- Não existe "desfazer o adiamento" no schema: adiar de novo é só gravar outra
-- data, e o passado nunca é reescrito (a missão adiada fica no histórico do dia
-- em que foi adiada, sem contar como missão pendente).
alter table missions
  add column if not exists adiada_para date;

-- O motor pergunta "que disciplinas foram empurradas PRA HOJE?" em toda carga
-- da home; sem índice isso é um seq scan na tabela que mais cresce por aluno.
create index if not exists ix_missions_adiada_para
  on missions (user_id, adiada_para)
  where adiada_para is not null;

-- ---------------------------------------------------------------------------
-- Verificação (esperado: uma linha por coluna)
-- ---------------------------------------------------------------------------
-- select column_name, data_type, column_default
--   from information_schema.columns
--  where (table_name = 'profiles' and column_name = 'modo_estudo')
--     or (table_name = 'missions' and column_name = 'adiada_para');
