-- ============================================================
-- QUESTLY — Nome editável, único e com carência de 15 dias
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "profiles" já existente). Migração aditiva e idempotente.
--
-- O aluno pode trocar o nome nas Configurações, mas:
--   (1) o nome é ÚNICO entre todos os alunos (case-insensitive) — ele
--       aparece publicamente no ranking, então dois "João Silva" não
--       podem coexistir;
--   (2) a troca só é permitida a cada 15 dias — anti-abuso (evita gente
--       trocando de identidade toda hora no ranking).
--
-- "nome_alterado_em" guarda quando o nome foi trocado pela última vez.
-- NULL = nunca trocou (ou perfil antigo) => primeira troca liberada.
-- A checagem dos 15 dias e a de unicidade são feitas na Server Action
-- "salvarNomeAction" (mensagens amigáveis); o índice único abaixo é a
-- rede de segurança contra corrida entre dois cadastros simultâneos.
--
-- RLS: nenhuma mudança. "profiles" já é legível por qualquer usuário
-- autenticado (o ranking precisa) e a escrita continua owner-only, então
-- o SELECT de unicidade e o UPDATE do próprio nome já funcionam.
-- ============================================================

alter table profiles add column if not exists nome_alterado_em timestamptz;

-- Unicidade case-insensitive, ignorando nomes vazios/nulos (perfis recém
-- criados via questlyGarantirProfile podem não ter nome ainda; múltiplos
-- NULLs/'' não devem colidir entre si).
--
-- ATENÇÃO: se já existirem dois perfis com o mesmo nome (o app não exigia
-- unicidade antes), a criação do índice vai FALHAR. Rode antes, se
-- preciso, pra achar e resolver os duplicados:
--   select lower(nome) as n, count(*)
--   from profiles where nome is not null and nome <> ''
--   group by lower(nome) having count(*) > 1;
create unique index if not exists profiles_nome_lower_key
  on profiles (lower(nome))
  where nome is not null and nome <> '';
