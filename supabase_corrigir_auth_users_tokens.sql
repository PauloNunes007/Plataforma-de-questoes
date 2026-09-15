-- ============================================================
-- QUESTLY — Conserta o "Database error finding users" da API Admin do Auth
-- Rodar no SQL Editor do Supabase. Aditiva, idempotente, sem schema novo.
--
-- O SINTOMA
--
-- A tela /admin/emails morria com:
--   "Falha ao listar contas ao ler a página 1 do Auth (AuthRetryableFetchError
--    — {"url":"https://.../auth/v1/admin/users?page=1&per_page=200"})"
-- e o mesmo endereço, chamado no braço, responde:
--   HTTP 500 {"error_code":"unexpected_failure","msg":"Database error finding users"}
--
-- Não é rede, não é SUPABASE_SERVICE_ROLE_KEY. A mensagem inútil é só o
-- auth-js: ele recebeu uma Response 500 (que não tem `.message`) e caiu no
-- fallback `JSON.stringify`, que numa Response só enxerga `url`.
--
-- O DIAGNÓSTICO (2026-09-15, com a chave service_role, endpoint no braço)
--
--   per_page=6  -> 200   |  per_page=7 -> 500
--   filter=zzzz -> 200 com 0 contas  (query vazia NÃO quebra)
--   filter=gmail-> 200 com 13 contas (linha a linha, tudo legível)
--   filter=seed -> 500               (x-total-count do Auth: 56)
--
-- Ou seja: o GoTrue quebra ao LER certas linhas — exatamente as 40 contas
-- `seed_N@questly.test` que `supabase_seed_ranking_teste.sql` criou inserindo
-- direto em `auth.users`. Aquele INSERT preenche só um punhado de colunas; as
-- colunas de token (`confirmation_token`, `recovery_token`, …) ficam NULL. No
-- Go, elas são `string` — não `*string` — então a varredura falha com
-- "converting NULL to string is unsupported" e o GoTrue devolve 500 pra
-- QUALQUER página/filtro cujo resultado inclua uma dessas linhas. Por isso o
-- app nunca tinha notado: `getUserById`, login, PostgREST e o resto seguem
-- funcionando; só a LISTAGEM passa por cima de todas as linhas.
--
-- Nota de escala: o mesmo estrago aconteceria com qualquer linha inserida à
-- mão em `auth.users`. O bloco 1 conserta o que existir hoje; o bloco 3 tira
-- o pé da lata pra frente.
-- ============================================================


-- ---------------------------------------------------------------------------
-- 1) Conserto: NULL -> '' nas colunas de token que o GoTrue lê como string
-- ---------------------------------------------------------------------------
-- Vale pra qualquer linha (seed ou não) que tenha nascido de um INSERT manual.
-- Percorre por nome pra não falhar se alguma coluna não existir nesta versão
-- do Auth. `'' `, não NULL, é o que o próprio fluxo de cadastro grava.
do $$
declare
  col text;
  afetadas int;
begin
  foreach col in array array[
    'confirmation_token',
    'recovery_token',
    'email_change',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token'
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'auth' and table_name = 'users' and column_name = col
    ) then
      execute format('update auth.users set %I = '''' where %I is null', col, col);
      get diagnostics afetadas = row_count;
      if afetadas > 0 then
        raise notice 'auth.users.% : % linha(s) corrigida(s)', col, afetadas;
      end if;
    end if;
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- 2) Faxina: as 40 contas de teste do ranking (OPCIONAL, mas recomendado)
-- ---------------------------------------------------------------------------
-- ⚠️ APAGA DADO. Leia antes de rodar.
--
-- Os `profiles` do seed já foram removidos (o ranking não mostra mais ninguém
-- fictício), mas as linhas correspondentes em `auth.users` ficaram órfãs — a
-- limpeza documentada no fim de supabase_seed_ranking_teste.sql nunca rodou.
-- São 40 das 56 contas do projeto.
--
-- Por que remover, e não só consertar: `@questly.test` é domínio reservado
-- (RFC 2606) — nunca entrega. Com a listagem funcionando de novo, o disparo de
-- campanha mandaria 40 e-mails pra endereços que voltam como hard bounce, e
-- taxa de bounce é exatamente o que derruba a reputação do remetente que
-- também entrega a confirmação de cadastro. (O app agora também descarta
-- esses endereços por conta própria — ver lib/email/campanha.ts —, mas o lugar
-- certo de não ter conta fantasma é o banco.)
--
-- Confira antes:
--   select id, email, created_at from auth.users
--   where email like 'seed\_%@questly.test' order by created_at;
--
-- E então descomente:
-- delete from auth.users where email like 'seed\_%@questly.test';


-- ---------------------------------------------------------------------------
-- 3) Verificação
-- ---------------------------------------------------------------------------
-- Deve devolver 0 em todas as colunas. Se alguma continuar > 0, a listagem do
-- Auth vai continuar dando 500 — e o erro_id do 500 aparece nos Logs > Auth do
-- painel, com a mensagem de verdade ("converting NULL to string…").
select
  count(*) filter (where confirmation_token is null)         as confirmation_token_null,
  count(*) filter (where recovery_token is null)             as recovery_token_null,
  count(*) filter (where email_change is null)               as email_change_null,
  count(*) filter (where email_change_token_new is null)     as email_change_token_new_null,
  count(*) filter (where email_change_token_current is null) as email_change_token_current_null,
  count(*) filter (where reauthentication_token is null)     as reauthentication_token_null,
  count(*)                                                   as contas
from auth.users;
