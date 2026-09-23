-- ===========================================================================
-- PROVA PREVISTA — qual prova do semestre o simulado replica.
--
-- Rodar DEPOIS de `supabase_provas_oficiais.sql`.
--
-- Contexto: o Gêmeo da Banca (web/src/lib/banca/) monta um simulado com a
-- COMPOSIÇÃO medida nas edições anteriores de um slot — "a P1 de Física 2 da
-- UFF tem ~6 de Gauss, ~5 de Campo Elétrico e ~3 de Coulomb". Pra a folha
-- impressa sair no molde daquela prova (capa, cartão óptico, formulário, duas
-- colunas — ver `components/imprimir/folha-uff.tsx`) a linha precisa dizer QUAL
-- prova ela replica, e isso não se deduz do resto: `topico_ids` não distingue
-- uma P1 de uma lista de revisão dos mesmos tópicos.
--
-- **Por que não reusar `prova_codigo`.** Aquela coluna significa "esta linha é
-- a reaplicação de uma prova que EXISTIU", e é o filtro de
-- `vw_ranking_provas_oficiais`. Uma prova prevista nunca foi aplicada e duas
-- provas previstas do mesmo slot não são a mesma prova — preenchê-la colocaria
-- exames sintéticos e mutuamente diferentes num ranking que só faz sentido
-- entre quem fez exatamente as mesmas questões.
--
-- Sem mudança de RLS: a coluna herda a política dono-only de
-- `supabase_simulados.sql`. Aditiva e idempotente.
-- ===========================================================================

alter table simulados_aluno add column if not exists prova_prevista text;

comment on column simulados_aluno.prova_prevista is
  'Slot que este simulado replica ("P1", "P2", "P3"). Null = simulado comum. '
  'Não confundir com prova_codigo, que é a reaplicação de uma prova real.';

-- O formato é fechado (P + um dígito), como o sufixo de `prova_codigo`. O
-- CHECK é o backstop; quem gera o valor é `montarSimuladoPrevistoAction`.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'simulados_aluno_prova_prevista_check'
  ) then
    alter table simulados_aluno
      add constraint simulados_aluno_prova_prevista_check
      check (prova_prevista is null or prova_prevista ~ '^P[0-9]$');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Conferência (o esperado está escrito ao lado)
-- ---------------------------------------------------------------------------

-- 1) A coluna existe e nenhum simulado anterior foi tocado:
--    prova_prevista deve vir 0 aqui.
select count(*) filter (where prova_prevista is not null) as previstas,
       count(*)                                          as total
  from simulados_aluno;

-- 2) As duas colunas são independentes: nenhuma linha pode ter as duas.
--    Esperado: 0 linhas.
select id, titulo, prova_codigo, prova_prevista
  from simulados_aluno
 where prova_codigo is not null
   and prova_prevista is not null;
