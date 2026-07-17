-- supabase_username.sql
-- Rodar DEPOIS de supabase_nome_editavel.sql (mexe no índice criado lá).
--
-- Username público (@handle) separado do nome de exibição:
--   · `username` é a identidade PÚBLICA do aluno — é o que aparece no
--     ranking, no pódio e no card público. Único (case-insensitive),
--     formato restrito (letras minúsculas, números, "." e "_", 3–20
--     chars) e trocável no máximo a cada 15 dias (`username_alterado_em`,
--     mesma regra que o nome tinha antes).
--   · `nome` volta a ser só o nome de exibição do próprio aluno
--     (saudação do dashboard, sidebar). Como ele deixou de ser a
--     identidade pública, a unicidade e a carência migram pro username —
--     o índice único do nome é removido (dois "João Silva" podem
--     coexistir; quem os distingue publicamente é o @username).
--
-- Contas antigas ficam com username NULL: o ranking cai no `nome` como
-- fallback até o aluno escolher um @ em Configurações. Nenhuma mudança
-- de RLS (profiles já é leitura pública / escrita dono-only, e a
-- unicidade é garantida pelo índice, não por policy).

alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists username_alterado_em timestamptz;

-- Unicidade case-insensitive; parcial pra ignorar NULL/vazio.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null and username <> '';

-- Formato do handle (rede de segurança do servidor; a Server Action
-- valida antes com mensagem amigável). Guardado num DO pra ser
-- idempotente — ADD CONSTRAINT não tem IF NOT EXISTS.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_formato_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_formato_check
      check (username is null or username ~ '^[a-z0-9][a-z0-9_.]{2,19}$');
  end if;
end $$;

-- O nome deixa de precisar ser único (ver cabeçalho).
drop index if exists profiles_nome_lower_key;
