-- supabase_seed_ranking_teste.sql
-- ⚠️ APENAS PARA TESTE do ranking. Cria ~40 alunos fictícios (auth.users +
-- profiles) com XP/nível/liga variados, pra o Ranking Geral / Semana /
-- Divisão terem gente. Rodar no SQL Editor do Supabase.
--
-- profiles.id referencia auth.users(id), então precisamos criar o auth.users
-- primeiro (esses usuários nunca logam — é só presença no ranking). A senha
-- fica vazia de propósito. Para REMOVER tudo depois, use o bloco de limpeza
-- no fim (basta apagar o auth.users; profiles cai por ON DELETE CASCADE).
--
-- Idempotente: reexecutar não duplica (checa o username seed_N).
--
-- ⚠️ LIMPE DEPOIS DE USAR. Apagar só os `profiles` não basta: a linha em
-- auth.users fica órfã e continua contando como conta do projeto — inclusive
-- na lista de destinatários do e-mail de campanha, onde `@questly.test` (RFC
-- 2606, domínio que nunca entrega) viraria hard bounce. Use o bloco de limpeza
-- do fim do arquivo, que apaga o auth.users e leva o profile junto.

do $$
declare
  primeiros text[] := array['Ana','Bruno','Carla','Diego','Elisa','Felipe','Gabi','Heitor','Isa','João',
    'Kaique','Lara','Marina','Nicolas','Olívia','Pedro','Rafa','Sofia','Tiago','Úrsula',
    'Vitor','Yasmin','Bia','Caio','Duda','Enzo','Flávia','Gustavo','Helena','Igor',
    'Júlia','Lucas','Manu','Otávio','Paula','Renan','Sara','Théo','Valentina','William'];
  ultimos text[] := array['Silva','Souza','Costa','Pereira','Almeida','Ferrari','Pompeu','Crespo','Alves','Ramos',
    'Nunes','Rocha','Mendes','Barros','Cardoso','Teixeira','Moreira','Freitas','Pinto','Araújo'];
  ligas text[] := array['bronze','prata','ouro','platina','diamante'];
  seg date := date_trunc('week', now())::date; -- segunda-feira desta semana
  i int;
  uid uuid;
  nome_i text;
  user_i text;
  xp_total_i int;
  xp_sem_i int;
  liga_i text;
begin
  for i in 1..40 loop
    user_i := 'seed_' || i;

    -- pula se já existe (idempotência)
    if exists (select 1 from public.profiles where username = user_i) then
      continue;
    end if;

    uid := gen_random_uuid();
    nome_i := primeiros[1 + (i * 7) % array_length(primeiros, 1)] || ' ' ||
              ultimos[1 + (i * 3) % array_length(ultimos, 1)];
    xp_total_i := 400 + (i * 1637) % 60000;
    xp_sem_i := (i * 173) % 1500;
    liga_i := ligas[1 + i % 5];

    -- As colunas de token vão com '' DE PROPÓSITO, nunca NULL. No GoTrue elas
    -- são `string` (não `*string`), então uma linha com NULL aqui derruba a
    -- API Admin inteira com 500 "Database error finding users" — não só pra
    -- esta conta: pra QUALQUER listagem cujo resultado passe por ela. Foi o
    -- que aconteceu em 2026-09-15 e quebrou o disparo de e-mail de campanha;
    -- o conserto está em supabase_corrigir_auth_users_tokens.sql.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'seed_' || i || '@questly.test', '',
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      '', '', '',
      '', '', ''
    ) on conflict (id) do nothing;

    insert into public.profiles (
      id, nome, username, curso,
      xp_total, nivel, xp_semana, questoes_semana,
      liga, semana_inicio, questoes_total
    ) values (
      uid, nome_i, user_i, 'Engenharia',
      xp_total_i, greatest(1, xp_total_i / 1750), xp_sem_i, (i * 11) % 400,
      liga_i, seg, 100 + (i * 97) % 3000
    ) on conflict (id) do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- LIMPEZA (rodar só quando quiser remover os alunos de teste):
--   delete from auth.users where email like 'seed\_%@questly.test';
-- (profiles cai junto por ON DELETE CASCADE)
-- ---------------------------------------------------------------------------
