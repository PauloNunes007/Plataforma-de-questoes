-- ============================================================
-- QUESTLY — Provas antigas oficiais + ranking por prova
-- Rodar no SQL Editor DEPOIS de supabase_simulados.sql e de
-- supabase_escala_lancamento.sql. Aditiva e idempotente: nenhuma coluna
-- existente muda de significado, nenhuma política antiga é afrouxada.
--
-- POR QUE ESTA MIGRAÇÃO EXISTE
--
-- Até aqui o simulado era sempre uma prova SORTEADA: o aluno escolhia o
-- recorte e o app montava um exame que nunca existiu. O acervo, porém, tem
-- provas REAIS da UFF (Física I e Física II) transcritas questão a questão —
-- e a prova real, na ordem original e com o relógio da aplicação, é um
-- treino que o sorteio não substitui (pedido do dono, 2026-09-16).
--
-- Faltava só uma coisa pra isso existir: `questions` guarda `instituicao`
-- ("UFF (1º sem.)") e `ano`, mas NADA que diga de qual prova daquele semestre
-- a questão saiu. P1, P2 e P3 de 2023.1 eram, pro banco, a mesma coisa.
--   • `prova_codigo` = identidade da prova ("fis2-uff-2023.1-p1");
--   • `prova_ordem`  = posição da questão DENTRO dela (1, 2, 3…), que é o que
--     permite reaplicar na ordem original em vez de embaralhar.
-- Os dois são nulos pra toda questão que não veio de uma prova catalogada —
-- a esmagadora maioria do banco — e nada no app muda por causa disso.
--
-- QUAIS PROVAS ENTRAM (e por que não todas)
--
-- Só entram as provas cujas questões estão TODAS no banco e que têm pelo
-- menos 10 questões. Uma transcrição parcial pode virar questão avulsa (e já
-- é: continua no sorteio normal), mas não pode ser oferecida como "a prova
-- original" — quem faz uma P2 de 2018 esperando a prova inteira e recebe 3
-- questões foi enganado. São 31 provas, 461 questões:
--   fis1-uff-2014.1-p1   14 questões  (Física I)
--   fis1-uff-2014.2-p1   14 questões  (Física I)
--   fis1-uff-2015.1-p1   12 questões  (Física I)
--   fis1-uff-2015.1-p2   10 questões  (Física I)
--   fis1-uff-2015.2-p2   10 questões  (Física I)
--   fis1-uff-2016.2-p2   20 questões  (Física I)
--   fis1-uff-2017.1-p2   20 questões  (Física I)
--   fis1-uff-2017.2-p2   20 questões  (Física I)
--   fis1-uff-2025.2-p2   13 questões  (Física I)
--   fis2-uff-2022.1-p1   15 questões  (Física II)
--   fis2-uff-2022.1-p2   15 questões  (Física II)
--   fis2-uff-2022.1-p3   15 questões  (Física II)
--   fis2-uff-2022.2-p2   15 questões  (Física II)
--   fis2-uff-2023.1-p1   15 questões  (Física II)
--   fis2-uff-2023.1-p2   15 questões  (Física II)
--   fis2-uff-2023.1-p3   15 questões  (Física II)
--   fis2-uff-2023.2-p1   15 questões  (Física II)
--   fis2-uff-2023.2-p2   15 questões  (Física II)
--   fis2-uff-2023.2-p3   15 questões  (Física II)
--   fis2-uff-2024.1-p1   15 questões  (Física II)
--   fis2-uff-2024.1-p2   15 questões  (Física II)
--   fis2-uff-2024.1-p3   15 questões  (Física II)
--   fis2-uff-2024.2-p1   13 questões  (Física II)
--   fis2-uff-2024.2-p2   15 questões  (Física II)
--   fis2-uff-2024.2-p3   15 questões  (Física II)
--   fis2-uff-2025.1-p1   15 questões  (Física II)
--   fis2-uff-2025.1-p2   15 questões  (Física II)
--   fis2-uff-2025.1-p3   15 questões  (Física II)
--   fis2-uff-2025.2-p1   15 questões  (Física II)
--   fis2-uff-2025.2-p2   15 questões  (Física II)
--   fis2-uff-2025.2-p3   15 questões  (Física II)
--
-- RANKING (item 5 do mesmo pedido)
--
-- Prova oficial é a ÚNICA comparação justa entre alunos: mesmas questões, na
-- mesma ordem, no mesmo tempo. `simulados_aluno` ganha `prova_codigo` (qual
-- prova oficial este simulado é, nulo pros sorteados) e `publico` (o aluno
-- decide se o resultado dele aparece pros outros — nasce FALSE: aparecer é
-- opt-in, nunca o padrão).
--
-- A leitura do ranking NÃO abre `simulados_aluno` pra ninguém. Uma política
-- RLS a mais deixaria qualquer autenticado ler a linha INTEIRA das provas
-- públicas — inclusive `respostas`, que é o que o colega marcou em cada
-- questão. Em vez disso, uma view SECURITY DEFINER (o padrão do Postgres:
-- roda com os direitos do dono, ignorando a RLS da tabela) devolve só as
-- colunas do ranking e só das linhas públicas e concluídas. Colunas são
-- escolhidas uma a uma aqui; RLS não sabe filtrar coluna.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. Identidade da prova nas questões
-- ---------------------------------------------------------------------------

alter table questions add column if not exists prova_codigo text;
alter table questions add column if not exists prova_ordem smallint;

comment on column questions.prova_codigo is
  'Prova oficial de onde a questão saiu (ex.: fis2-uff-2023.1-p1). Null = questão avulsa/autoral.';
comment on column questions.prova_ordem is
  'Posição da questão na prova original (1..n). Null quando prova_codigo é null.';

-- Parcial: só as 461 linhas que têm prova entram no índice.
create index if not exists idx_questions_prova
  on questions (prova_codigo, prova_ordem)
  where prova_codigo is not null;

-- ---------------------------------------------------------------------------
-- 2. Backfill (gerado a partir dos JSONs de origem em listas_questoes/gerado,
--    casando pelo enunciado). Idempotente: reexecutar grava os mesmos valores.
-- ---------------------------------------------------------------------------

with mapa (id, codigo, ordem) as (values
  ('306cbd30-3ae7-4de8-992e-4e5fdaa69c16'::uuid, 'fis1-uff-2014.1-p1', 1),
  ('817aa7b6-b01e-4838-8159-497a1ff091b5'::uuid, 'fis1-uff-2014.1-p1', 2),
  ('c0bd6220-5fe6-4858-91f3-63af68cd886f'::uuid, 'fis1-uff-2014.1-p1', 3),
  ('16d4f10d-f63a-47b6-b6b9-e9a5107603ca'::uuid, 'fis1-uff-2014.1-p1', 4),
  ('75316378-e8a4-4588-8b61-1132ebeab76e'::uuid, 'fis1-uff-2014.1-p1', 5),
  ('01ff6578-c904-4a57-88b2-da7484c45e57'::uuid, 'fis1-uff-2014.1-p1', 6),
  ('4926febd-b58f-4fd2-999a-b8b6e2a401b8'::uuid, 'fis1-uff-2014.1-p1', 7),
  ('b3ca8aa1-2873-4c3a-9158-2e89f3a4883a'::uuid, 'fis1-uff-2014.1-p1', 8),
  ('639fd0d8-78d4-4ca2-9980-55fad0b4eb29'::uuid, 'fis1-uff-2014.1-p1', 9),
  ('65f6b339-ab1c-450b-b97c-eb5f8cf5f8e5'::uuid, 'fis1-uff-2014.1-p1', 10),
  ('b08251a1-1a2e-4f69-9a00-0348d6fd8f30'::uuid, 'fis1-uff-2014.1-p1', 11),
  ('81437551-d7f0-4021-96f1-4cca840944d2'::uuid, 'fis1-uff-2014.1-p1', 12),
  ('c55817b0-0892-4405-8171-b7d8ba4d9bae'::uuid, 'fis1-uff-2014.1-p1', 13),
  ('780fe056-b48a-4948-8967-f50025696315'::uuid, 'fis1-uff-2014.1-p1', 14),
  ('1349eb19-fff4-4284-85e4-16bc5eb3496e'::uuid, 'fis1-uff-2014.2-p1', 1),
  ('72396503-3c40-45f6-b681-955b05f0ede6'::uuid, 'fis1-uff-2014.2-p1', 2),
  ('166382ce-61a8-433e-8232-982d460553ec'::uuid, 'fis1-uff-2014.2-p1', 3),
  ('310d04a9-00a5-486c-ac2c-ec65ba1c84b6'::uuid, 'fis1-uff-2014.2-p1', 4),
  ('64be4d02-e0af-4488-b320-d8d972b2fa31'::uuid, 'fis1-uff-2014.2-p1', 5),
  ('ead8d7a2-ff13-41eb-a6c9-5a3ea810abdf'::uuid, 'fis1-uff-2014.2-p1', 6),
  ('5a8ce074-ef4a-4cce-8402-a87fd60076fa'::uuid, 'fis1-uff-2014.2-p1', 7),
  ('941d0ddf-a550-4cf2-911c-947e8dfc6d3d'::uuid, 'fis1-uff-2014.2-p1', 8),
  ('f8ed4b33-ceb8-445d-b8e7-46a698f5eaff'::uuid, 'fis1-uff-2014.2-p1', 9),
  ('7d41593d-4486-4505-a5e2-a49d30877972'::uuid, 'fis1-uff-2014.2-p1', 10),
  ('66e46705-3de5-41d8-94f7-4818e1915657'::uuid, 'fis1-uff-2014.2-p1', 11),
  ('4ec1b161-2079-4f4e-a26a-dd3a02f56b86'::uuid, 'fis1-uff-2014.2-p1', 12),
  ('9f547574-4dad-45ff-ba6d-feec96558308'::uuid, 'fis1-uff-2014.2-p1', 13),
  ('9612c62f-70b9-46dc-8ec7-2c7b787515ee'::uuid, 'fis1-uff-2014.2-p1', 14),
  ('c3e3538e-7d1d-4e44-824f-72c0872e3b7c'::uuid, 'fis1-uff-2015.1-p1', 1),
  ('9e1fa2fc-cf9a-4be0-949d-8e4d6c2df10a'::uuid, 'fis1-uff-2015.1-p1', 2),
  ('224c07c3-5202-47f3-9b09-6186a82c93fc'::uuid, 'fis1-uff-2015.1-p1', 3),
  ('d4dc71d1-1296-45c8-937c-7fd296d33743'::uuid, 'fis1-uff-2015.1-p1', 4),
  ('7be04737-231a-40e8-8cf3-faf600d747c0'::uuid, 'fis1-uff-2015.1-p1', 5),
  ('0e0794c9-c1f6-4770-af09-185b458741bc'::uuid, 'fis1-uff-2015.1-p1', 6),
  ('0e702eac-99d2-4f4f-a98f-fedff99931fc'::uuid, 'fis1-uff-2015.1-p1', 7),
  ('ebe8aaaa-b352-4648-8cbd-f7f14e6e8f49'::uuid, 'fis1-uff-2015.1-p1', 8),
  ('d1fc1978-3613-4615-b07a-077c39a9ab80'::uuid, 'fis1-uff-2015.1-p1', 9),
  ('02beb4ca-fc8e-4fb0-8583-568f47807bed'::uuid, 'fis1-uff-2015.1-p1', 10),
  ('9016cf4d-b63b-41e2-88e4-73811d8008f3'::uuid, 'fis1-uff-2015.1-p1', 11),
  ('93b8072a-c30a-4bc9-9fcc-436b1bb285d3'::uuid, 'fis1-uff-2015.1-p1', 12),
  ('1815417a-7f9f-4e4b-8de4-5f6e6e973391'::uuid, 'fis1-uff-2015.1-p2', 1),
  ('c5a26287-310a-46b9-9c8a-56328c4fe46c'::uuid, 'fis1-uff-2015.1-p2', 2),
  ('5145aeb1-14a9-456e-ac1f-bcc963d4cf5f'::uuid, 'fis1-uff-2015.1-p2', 3),
  ('1db02505-ea99-40a9-9da5-541a4ca82bbf'::uuid, 'fis1-uff-2015.1-p2', 4),
  ('50123e27-ceb3-4ee0-bb6f-876430f805b4'::uuid, 'fis1-uff-2015.1-p2', 5),
  ('68eff13f-3e0d-4966-bd01-c23eb90209fc'::uuid, 'fis1-uff-2015.1-p2', 6),
  ('d020cc72-a4ca-4374-8c90-9bded324457e'::uuid, 'fis1-uff-2015.1-p2', 7),
  ('d92c0fe6-80d0-44a1-a41d-62551dc8eb3c'::uuid, 'fis1-uff-2015.1-p2', 8),
  ('39e2aba4-b6eb-4eb4-998d-3dabeb450fd0'::uuid, 'fis1-uff-2015.1-p2', 9),
  ('5d426b27-e42c-43d3-aaba-d05342b0c9aa'::uuid, 'fis1-uff-2015.1-p2', 10),
  ('841d84d8-6395-48ca-8e91-9d7206251a58'::uuid, 'fis1-uff-2015.2-p2', 1),
  ('84a7a4ad-dcc2-4437-b24a-0ffa057820ce'::uuid, 'fis1-uff-2015.2-p2', 2),
  ('6d458cc8-b6f6-42d5-a11f-ff7e9ab92fa1'::uuid, 'fis1-uff-2015.2-p2', 3),
  ('38b5e8a1-c596-4709-9a2a-72b67f91c175'::uuid, 'fis1-uff-2015.2-p2', 4),
  ('419ca5cb-b910-4967-883e-b123463dab73'::uuid, 'fis1-uff-2015.2-p2', 5),
  ('1c14d084-25f9-4376-ab3e-2fc2a92c92f6'::uuid, 'fis1-uff-2015.2-p2', 6),
  ('349e6cad-4cd4-4bc8-b06d-aff8dadc411e'::uuid, 'fis1-uff-2015.2-p2', 7),
  ('2a7fbf5b-54f0-486e-a4d5-1ef2b6568b8d'::uuid, 'fis1-uff-2015.2-p2', 8),
  ('58c2ce89-489f-47ee-9279-82c4e2c453bc'::uuid, 'fis1-uff-2015.2-p2', 9),
  ('58c55a7f-4859-4b84-9290-d4e826830263'::uuid, 'fis1-uff-2015.2-p2', 10),
  ('31b1c21c-ee34-430f-b968-60f7890cbaa2'::uuid, 'fis1-uff-2016.2-p2', 1),
  ('c02ec722-c255-4e64-af11-abd7d262f63f'::uuid, 'fis1-uff-2016.2-p2', 2),
  ('4494b0c2-b8df-4e8b-8942-fc2bb24039f2'::uuid, 'fis1-uff-2016.2-p2', 3),
  ('bf65442e-7dd7-47ce-985d-8424580f2394'::uuid, 'fis1-uff-2016.2-p2', 4),
  ('e1552aa0-485e-4a29-aecb-15a4c5a893ad'::uuid, 'fis1-uff-2016.2-p2', 5),
  ('fb73b9aa-3e68-4a7e-87f1-b32e1b9ffd8d'::uuid, 'fis1-uff-2016.2-p2', 6),
  ('143c1429-ad6b-43e8-b0f3-ebfc888a62d7'::uuid, 'fis1-uff-2016.2-p2', 7),
  ('d9821cb9-5cb3-46a7-8d06-e120d572b6c6'::uuid, 'fis1-uff-2016.2-p2', 8),
  ('b344c7df-04b1-4f1c-8978-b17f27a77772'::uuid, 'fis1-uff-2016.2-p2', 9),
  ('4b521c48-7424-4e36-ac5f-513ebddb82dc'::uuid, 'fis1-uff-2016.2-p2', 10),
  ('4fe765d8-6d18-4b88-9d8c-4496e0010bc4'::uuid, 'fis1-uff-2016.2-p2', 11),
  ('3dc45d78-d3f2-4da1-8ad8-458b318306bd'::uuid, 'fis1-uff-2016.2-p2', 12),
  ('3c3a4ef0-2b60-40f8-87da-469af61dfc2b'::uuid, 'fis1-uff-2016.2-p2', 13),
  ('c60c81f2-2474-44e5-ab20-684f9645eecb'::uuid, 'fis1-uff-2016.2-p2', 14),
  ('f54aa642-f0f6-4259-921d-6e507242eee6'::uuid, 'fis1-uff-2016.2-p2', 15),
  ('666db0fb-d9a2-4af5-8e6e-53894dfa046f'::uuid, 'fis1-uff-2016.2-p2', 16),
  ('76721f5e-2c66-4ac7-9f1e-1813fb1761ce'::uuid, 'fis1-uff-2016.2-p2', 17),
  ('4348837f-11cb-488d-bac5-b562314601dd'::uuid, 'fis1-uff-2016.2-p2', 18),
  ('e036db72-3458-4344-90b8-4a1b7f254389'::uuid, 'fis1-uff-2016.2-p2', 19),
  ('0454e3f5-4ec9-406f-8bb2-621e4e93c32f'::uuid, 'fis1-uff-2016.2-p2', 20),
  ('37ceb2d9-c6b0-4ddc-96c8-d95b73d61b44'::uuid, 'fis1-uff-2017.1-p2', 1),
  ('e64f1e39-b9d3-4c20-9ff4-e19daa1ed733'::uuid, 'fis1-uff-2017.1-p2', 2),
  ('e9d54b01-3c4d-4e90-a1af-b3b78df21fb4'::uuid, 'fis1-uff-2017.1-p2', 3),
  ('6794fe43-d34b-41d3-bdc5-b3d52dec7b34'::uuid, 'fis1-uff-2017.1-p2', 4),
  ('ad90aff3-4c03-4a0f-934c-8762a78d8be3'::uuid, 'fis1-uff-2017.1-p2', 5),
  ('a58d9224-9855-41da-b63c-8e5914ca44cb'::uuid, 'fis1-uff-2017.1-p2', 6),
  ('3edc52cf-4ebc-4856-9895-bf37f323c4d4'::uuid, 'fis1-uff-2017.1-p2', 7),
  ('8b66dc43-7792-44d0-8c6b-86621222a340'::uuid, 'fis1-uff-2017.1-p2', 8),
  ('6e4f051e-6082-47ba-963e-5a8eabdcd6eb'::uuid, 'fis1-uff-2017.1-p2', 9),
  ('fff1ac38-a995-414d-b9d6-b3102ca6a548'::uuid, 'fis1-uff-2017.1-p2', 10),
  ('6875f81b-5d9e-4d84-9676-249a25d24899'::uuid, 'fis1-uff-2017.1-p2', 11),
  ('07f9e443-f8b4-4c1b-95a7-67868a4ee697'::uuid, 'fis1-uff-2017.1-p2', 12),
  ('285b8ad3-4bd7-47d2-82c4-dfac9792790a'::uuid, 'fis1-uff-2017.1-p2', 13),
  ('b7a914dc-ad59-43a3-8917-39fea8f04e90'::uuid, 'fis1-uff-2017.1-p2', 14),
  ('72469415-8b4e-4776-bc3a-64e236b38d63'::uuid, 'fis1-uff-2017.1-p2', 15),
  ('eb4be3f1-4ed8-4a5f-9507-aacabdf7eee0'::uuid, 'fis1-uff-2017.1-p2', 16),
  ('31dabfc6-d0fc-428e-9232-dea4b6a8b60c'::uuid, 'fis1-uff-2017.1-p2', 17),
  ('e377bea9-d3e6-4b73-bddf-fe7af9aa4e31'::uuid, 'fis1-uff-2017.1-p2', 18),
  ('a7ec2e90-7bca-4e63-9354-a779cc845acb'::uuid, 'fis1-uff-2017.1-p2', 19),
  ('dd33000f-bd8b-496a-a358-eadc3ff61ab8'::uuid, 'fis1-uff-2017.1-p2', 20),
  ('ffbee224-3142-4cb5-9744-690ceef2e264'::uuid, 'fis1-uff-2017.2-p2', 1),
  ('0c636f0b-32b2-4925-bc04-bdc84f10f36a'::uuid, 'fis1-uff-2017.2-p2', 2),
  ('997b6661-043f-454b-85ab-e5ec1c26a492'::uuid, 'fis1-uff-2017.2-p2', 3),
  ('260f9d42-35a3-495e-8a27-4dc4b84c98f9'::uuid, 'fis1-uff-2017.2-p2', 4),
  ('b68f64db-59b4-4681-a8ce-79d731a44d2c'::uuid, 'fis1-uff-2017.2-p2', 5),
  ('2c8756b3-ecb3-4228-95c6-55f952922701'::uuid, 'fis1-uff-2017.2-p2', 6),
  ('8e373f9f-5537-4cc3-bdc2-25454c4907c2'::uuid, 'fis1-uff-2017.2-p2', 7),
  ('86e91306-47b1-4454-81b0-f747e8997629'::uuid, 'fis1-uff-2017.2-p2', 8),
  ('af56658e-3dd8-4023-b9e5-ee646c9242d0'::uuid, 'fis1-uff-2017.2-p2', 9),
  ('a8043bda-191c-4899-879d-6f26da484e54'::uuid, 'fis1-uff-2017.2-p2', 10),
  ('d2274f2c-eb49-44be-9db5-0106613a19b9'::uuid, 'fis1-uff-2017.2-p2', 11),
  ('9f0ce35f-0d99-49f9-a9bb-89890fc6cf90'::uuid, 'fis1-uff-2017.2-p2', 12),
  ('688669fd-7852-4b5f-ad87-ac98be46e75e'::uuid, 'fis1-uff-2017.2-p2', 13),
  ('1b165471-03da-4f71-8608-7d842757c19d'::uuid, 'fis1-uff-2017.2-p2', 14),
  ('25f6ccdf-0ed2-491a-b034-201f91113d06'::uuid, 'fis1-uff-2017.2-p2', 15),
  ('6d51a2f4-2192-45cb-814d-19f3f96e2539'::uuid, 'fis1-uff-2017.2-p2', 16),
  ('48ca71ea-4aac-4dae-a69d-ec7ccbd06a97'::uuid, 'fis1-uff-2017.2-p2', 17),
  ('ed3f8129-6ab7-4e9f-aa8f-bf3c1fdbc4cc'::uuid, 'fis1-uff-2017.2-p2', 18),
  ('d4fd3cfa-9012-45b1-beb9-b7b084bffe2a'::uuid, 'fis1-uff-2017.2-p2', 19),
  ('16a3cd65-a317-4c59-a0da-24ce9675ee54'::uuid, 'fis1-uff-2017.2-p2', 20),
  ('d96ade7d-4bc7-4d42-acc5-d6c00be6b525'::uuid, 'fis1-uff-2025.2-p2', 1),
  ('0ea9a220-c3ce-4769-bae4-f9e9262e2037'::uuid, 'fis1-uff-2025.2-p2', 2),
  ('baa64fe8-7852-456a-9034-b0b8b672882b'::uuid, 'fis1-uff-2025.2-p2', 3),
  ('ba273112-7a35-42af-abef-472239b2e877'::uuid, 'fis1-uff-2025.2-p2', 4),
  ('0142a4e3-2bb6-4f1e-8258-8c1648f48cc2'::uuid, 'fis1-uff-2025.2-p2', 5),
  ('ef035b3a-8066-4c8d-b2a1-087300f38c0f'::uuid, 'fis1-uff-2025.2-p2', 6),
  ('2c859522-bac5-4a2d-943c-ca79ba5ede47'::uuid, 'fis1-uff-2025.2-p2', 7),
  ('49cdaed4-a06c-49b0-93ca-7e73373468e3'::uuid, 'fis1-uff-2025.2-p2', 8),
  ('51e07d50-17fa-454b-b7ab-e3cb1ac3539d'::uuid, 'fis1-uff-2025.2-p2', 9),
  ('702256ac-b5ef-4adc-be88-e56caea58345'::uuid, 'fis1-uff-2025.2-p2', 10),
  ('62e328aa-94db-4a55-824e-5f4d361f6e16'::uuid, 'fis1-uff-2025.2-p2', 11),
  ('c6bff15a-2e31-44f7-aa46-d0aadaa65cfb'::uuid, 'fis1-uff-2025.2-p2', 12),
  ('8cfe14d7-0458-42bd-9fab-bacb93b796fc'::uuid, 'fis1-uff-2025.2-p2', 13),
  ('93d9860a-222c-493f-adb6-68109f7b2aac'::uuid, 'fis2-uff-2022.1-p1', 1),
  ('0755c55c-75fd-43ad-aaf7-74e78d527c55'::uuid, 'fis2-uff-2022.1-p1', 2),
  ('151f8da0-080e-4435-be58-f2f2c42866be'::uuid, 'fis2-uff-2022.1-p1', 3),
  ('8206abec-d89c-4e19-9af1-28eecd1b7250'::uuid, 'fis2-uff-2022.1-p1', 4),
  ('a67061f6-78f2-41a2-9dc0-7e2d5a96e747'::uuid, 'fis2-uff-2022.1-p1', 5),
  ('363e1148-163b-484a-a236-120114896df5'::uuid, 'fis2-uff-2022.1-p1', 6),
  ('395a5b31-6046-4acc-9a96-ae72d7141a96'::uuid, 'fis2-uff-2022.1-p1', 7),
  ('4d1cfaec-a208-49b2-85c7-a860b6371278'::uuid, 'fis2-uff-2022.1-p1', 8),
  ('e78fa323-3769-4ab0-8f7a-4bafe0b67fe0'::uuid, 'fis2-uff-2022.1-p1', 9),
  ('b0d216b3-eb26-4a3a-972c-c7794f3c0d51'::uuid, 'fis2-uff-2022.1-p1', 10),
  ('275d17e3-c960-4e23-bc6c-0d09c4430bc6'::uuid, 'fis2-uff-2022.1-p1', 11),
  ('55612166-8751-4e92-b1d6-0866b68b9823'::uuid, 'fis2-uff-2022.1-p1', 12),
  ('9b8b7489-980b-4550-b820-f44ff54a5925'::uuid, 'fis2-uff-2022.1-p1', 13),
  ('e6269270-8e15-45fd-935e-2c31b72027fd'::uuid, 'fis2-uff-2022.1-p1', 14),
  ('d00e187c-05a8-4120-8cf5-bf9e2d962ab0'::uuid, 'fis2-uff-2022.1-p1', 15),
  ('c1a12f64-6ef0-4b2c-889c-41dd29b49449'::uuid, 'fis2-uff-2022.1-p2', 1),
  ('a74ca25f-25d8-40bf-9e6b-d5d00128f3b9'::uuid, 'fis2-uff-2022.1-p2', 2),
  ('961dd6bd-788a-4178-88d1-b5ba356ccaf5'::uuid, 'fis2-uff-2022.1-p2', 3),
  ('f878869a-f7a8-4a6f-bfd0-b9de1f24ef14'::uuid, 'fis2-uff-2022.1-p2', 4),
  ('28ad3542-7c3c-49a9-915c-3d0fb3753a0f'::uuid, 'fis2-uff-2022.1-p2', 5),
  ('362be2af-4a99-4846-9547-443f839419fe'::uuid, 'fis2-uff-2022.1-p2', 6),
  ('75e28e63-885f-4543-a0a3-e2ce015c6bd6'::uuid, 'fis2-uff-2022.1-p2', 7),
  ('7ff52913-01af-404f-b7aa-5d0fa232c7ef'::uuid, 'fis2-uff-2022.1-p2', 8),
  ('f80b0e54-e061-4639-839c-d2ae2f7aed04'::uuid, 'fis2-uff-2022.1-p2', 9),
  ('c1f4ba24-97dd-425b-9b17-076d51277734'::uuid, 'fis2-uff-2022.1-p2', 10),
  ('b8c808c4-618b-421a-b40c-1f7ea9336e56'::uuid, 'fis2-uff-2022.1-p2', 11),
  ('238f0ea1-8840-4f5f-9451-331adbd3ae50'::uuid, 'fis2-uff-2022.1-p2', 12),
  ('bf9955f7-babb-43ee-98a7-5c40ff580be5'::uuid, 'fis2-uff-2022.1-p2', 13),
  ('102a70b4-ebe3-436f-82ca-415d93d871a5'::uuid, 'fis2-uff-2022.1-p2', 14),
  ('f66a64b3-3c87-4f7d-84dd-2b5903124fb2'::uuid, 'fis2-uff-2022.1-p2', 15),
  ('cb6ab175-e1c4-409c-a75e-c07e8fb38dc6'::uuid, 'fis2-uff-2022.1-p3', 1),
  ('394599d1-3110-4a9a-9f1f-644bc2d29092'::uuid, 'fis2-uff-2022.1-p3', 2),
  ('dc6fe42e-ad29-4beb-8f24-a7c4f8f08137'::uuid, 'fis2-uff-2022.1-p3', 3),
  ('f2b36433-d054-450f-9745-b1a41d230559'::uuid, 'fis2-uff-2022.1-p3', 4),
  ('0209743f-4211-4313-937d-c845299710aa'::uuid, 'fis2-uff-2022.1-p3', 5),
  ('1e3a04f8-0f5f-46d7-9f7d-44dde2684e87'::uuid, 'fis2-uff-2022.1-p3', 6),
  ('3adf32b3-52c8-4d73-9688-f141accb622a'::uuid, 'fis2-uff-2022.1-p3', 7),
  ('6e1556da-baac-4451-8c66-59643a7478bf'::uuid, 'fis2-uff-2022.1-p3', 8),
  ('22aadcb1-6880-45bc-9752-430ee15c4f27'::uuid, 'fis2-uff-2022.1-p3', 9),
  ('075dadb5-c759-4a80-97b3-d76b7ee58d39'::uuid, 'fis2-uff-2022.1-p3', 10),
  ('fd8332fc-e2ea-46dd-acd0-abd9440ca0ae'::uuid, 'fis2-uff-2022.1-p3', 11),
  ('d9ee1726-899c-40fa-8b76-1fb8396d2dc6'::uuid, 'fis2-uff-2022.1-p3', 12),
  ('1a4966e1-dd9a-4c81-aa98-6ed70941cd6b'::uuid, 'fis2-uff-2022.1-p3', 13),
  ('b397f257-fc8e-4e7d-817f-ee65db495e05'::uuid, 'fis2-uff-2022.1-p3', 14),
  ('3430005a-858c-4b23-a147-25fbdbc95ca6'::uuid, 'fis2-uff-2022.1-p3', 15),
  ('aba97b89-603c-4d7c-b8e0-0ec54ed88efd'::uuid, 'fis2-uff-2022.2-p2', 1),
  ('938bcc1c-996c-4d76-8726-a69569106adf'::uuid, 'fis2-uff-2022.2-p2', 2),
  ('4fbe5957-3ec4-4762-b842-7412308fab5c'::uuid, 'fis2-uff-2022.2-p2', 3),
  ('2c76346a-dd55-45e1-b209-66ebcfb6e325'::uuid, 'fis2-uff-2022.2-p2', 4),
  ('694ee486-554d-4466-a757-752e0daa3956'::uuid, 'fis2-uff-2022.2-p2', 5),
  ('826c5a5c-db20-4998-bbee-8a17cfbabe87'::uuid, 'fis2-uff-2022.2-p2', 6),
  ('58836e94-1e78-4c6d-aca2-cf1032e4eb20'::uuid, 'fis2-uff-2022.2-p2', 7),
  ('f6b335e5-0f42-46cd-b0c3-63b66ef70b7f'::uuid, 'fis2-uff-2022.2-p2', 8),
  ('1294bd2e-b0ac-4b92-bdcf-68cc292fc1d4'::uuid, 'fis2-uff-2022.2-p2', 9),
  ('19d1e727-794d-4c9a-80ba-37a3bd5cbce1'::uuid, 'fis2-uff-2022.2-p2', 10),
  ('46e66db4-bcca-447f-8b21-8a808f00e6fd'::uuid, 'fis2-uff-2022.2-p2', 11),
  ('cc226ff3-19a0-4fe0-9702-b59840cf48ac'::uuid, 'fis2-uff-2022.2-p2', 12),
  ('b2175ec8-d8ad-4f98-a4a3-b2d896bf45fe'::uuid, 'fis2-uff-2022.2-p2', 13),
  ('bd2e4a9a-74a7-483a-a967-cbb59519f6ee'::uuid, 'fis2-uff-2022.2-p2', 14),
  ('8dd8a0b4-2aa1-46b5-980c-0f77782760bf'::uuid, 'fis2-uff-2022.2-p2', 15),
  ('5759205d-f095-48e8-aa51-1fd21ca4004a'::uuid, 'fis2-uff-2023.1-p1', 1),
  ('7e004437-c68e-4465-bff8-1efa334a7580'::uuid, 'fis2-uff-2023.1-p1', 2),
  ('08d60ead-80e5-4028-9b5a-d348f42af000'::uuid, 'fis2-uff-2023.1-p1', 3),
  ('5b932890-b8af-46b0-b6e4-aacea35d56aa'::uuid, 'fis2-uff-2023.1-p1', 4),
  ('539a646d-0f30-4dfe-906d-27c16894d58f'::uuid, 'fis2-uff-2023.1-p1', 5),
  ('d794a06e-2052-4886-a8ba-b660a1815fe3'::uuid, 'fis2-uff-2023.1-p1', 6),
  ('520c37a4-2323-477e-a98e-274f7258cbe6'::uuid, 'fis2-uff-2023.1-p1', 7),
  ('e89f97b1-26ac-4f1f-9606-cbb749e01a39'::uuid, 'fis2-uff-2023.1-p1', 8),
  ('452c073e-f6a2-4b3d-abbf-36f03c20d8b9'::uuid, 'fis2-uff-2023.1-p1', 9),
  ('3128f0a3-45b6-4652-baaa-dc92eb1d4fb2'::uuid, 'fis2-uff-2023.1-p1', 10),
  ('cfac2808-0f52-4bcb-88c2-74fe149ca390'::uuid, 'fis2-uff-2023.1-p1', 11),
  ('e8896621-e886-4ddd-a86b-ff124a478dc0'::uuid, 'fis2-uff-2023.1-p1', 12),
  ('faad2a7d-645e-4a51-a065-b9a3d0c26d4b'::uuid, 'fis2-uff-2023.1-p1', 13),
  ('e4432258-c241-48e7-bb71-2ffeb73415de'::uuid, 'fis2-uff-2023.1-p1', 14),
  ('66cb0bbf-fdc4-4d25-844d-9497a9c03845'::uuid, 'fis2-uff-2023.1-p1', 15),
  ('b35f0fb0-2476-4222-aa86-0baf262f6382'::uuid, 'fis2-uff-2023.1-p2', 1),
  ('a03c8628-dc51-4055-9816-bec406666c7e'::uuid, 'fis2-uff-2023.1-p2', 2),
  ('a4771f71-3a6f-4843-97a7-e1fd9fff3bad'::uuid, 'fis2-uff-2023.1-p2', 3),
  ('0ecf471b-0923-4a40-abdb-ad39bbafc246'::uuid, 'fis2-uff-2023.1-p2', 4),
  ('fc19e539-5061-4084-8fa9-a635a846aba4'::uuid, 'fis2-uff-2023.1-p2', 5),
  ('45464512-34a8-4519-af40-c48ce5481427'::uuid, 'fis2-uff-2023.1-p2', 6),
  ('3658462e-f0ca-4b17-90e6-59be9a424c31'::uuid, 'fis2-uff-2023.1-p2', 7),
  ('ec6e9e7c-3dec-4050-b4d5-39eb87744f75'::uuid, 'fis2-uff-2023.1-p2', 8),
  ('315c36a3-809a-426e-a385-5076ada4a5c3'::uuid, 'fis2-uff-2023.1-p2', 9),
  ('ad922842-dd1e-4ddd-a86b-c5041b50edff'::uuid, 'fis2-uff-2023.1-p2', 10),
  ('21cba2b6-c3fd-4574-b0f3-cd9af1a717c5'::uuid, 'fis2-uff-2023.1-p2', 11),
  ('cda43211-19d6-4089-8550-cceadd648d4a'::uuid, 'fis2-uff-2023.1-p2', 12),
  ('3da3c4a1-6431-4b9a-b684-9e8f3da3c0a4'::uuid, 'fis2-uff-2023.1-p2', 13),
  ('0763ea25-3bef-4522-979f-1acd39154adc'::uuid, 'fis2-uff-2023.1-p2', 14),
  ('cf879fb5-6558-438b-b9d1-2ecea5e68990'::uuid, 'fis2-uff-2023.1-p2', 15),
  ('c8f5a28e-a7ef-4abb-a1d1-1016740ffaaa'::uuid, 'fis2-uff-2023.1-p3', 1),
  ('1c1e527d-e367-4ee0-8484-227ed18d3dcb'::uuid, 'fis2-uff-2023.1-p3', 2),
  ('cb2c4c32-0697-4e38-8ab7-8c2cd896ea97'::uuid, 'fis2-uff-2023.1-p3', 3),
  ('7521d8a5-7fe4-4ac8-9616-9c07f664c635'::uuid, 'fis2-uff-2023.1-p3', 4),
  ('153f14e2-0ba1-4bce-878e-6b7165b10ee9'::uuid, 'fis2-uff-2023.1-p3', 5),
  ('9a9dac7a-b97e-4571-ac89-530621baeb13'::uuid, 'fis2-uff-2023.1-p3', 6),
  ('8e0c532b-3c6c-4e14-a514-bf587824b61e'::uuid, 'fis2-uff-2023.1-p3', 7),
  ('90fce980-b6df-4c53-9e55-09f0495d0305'::uuid, 'fis2-uff-2023.1-p3', 8),
  ('c86105dc-ecc4-4953-bad3-bd80624a7d96'::uuid, 'fis2-uff-2023.1-p3', 9),
  ('2cc9dfdd-0068-4a58-9c68-0a2a85635ddf'::uuid, 'fis2-uff-2023.1-p3', 10),
  ('8ed64b02-d1ca-4937-b3e9-4f833af0de1f'::uuid, 'fis2-uff-2023.1-p3', 11),
  ('1212aae0-2350-4a43-85d5-fc2a1f677770'::uuid, 'fis2-uff-2023.1-p3', 12),
  ('065e8e83-f820-4311-b6e4-7171acd45988'::uuid, 'fis2-uff-2023.1-p3', 13),
  ('56a2ed69-cad2-4e32-a804-382db1b5f2c3'::uuid, 'fis2-uff-2023.1-p3', 14),
  ('06949220-1964-4c7c-bc33-6b7c2bffbe6b'::uuid, 'fis2-uff-2023.1-p3', 15),
  ('5054b5fa-e580-4f68-83fe-4b1a18c3f458'::uuid, 'fis2-uff-2023.2-p1', 1),
  ('21801cc4-a146-4930-bec8-7212697d174c'::uuid, 'fis2-uff-2023.2-p1', 2),
  ('0e886b66-cae9-4a87-98c4-4f68a45d43d3'::uuid, 'fis2-uff-2023.2-p1', 3),
  ('301e9624-068a-43df-bfff-d5bba2f318ac'::uuid, 'fis2-uff-2023.2-p1', 4),
  ('d727f2fa-bb3c-4d0e-9475-0706e8f83752'::uuid, 'fis2-uff-2023.2-p1', 5),
  ('489d413c-0194-4960-9167-9f5a8254b55f'::uuid, 'fis2-uff-2023.2-p1', 6),
  ('31e58507-79d9-415c-b26d-39a40b34fb41'::uuid, 'fis2-uff-2023.2-p1', 7),
  ('0a67691c-19de-4c3d-beab-46427a715515'::uuid, 'fis2-uff-2023.2-p1', 8),
  ('c225ae7a-d8f6-4904-99cd-f438e3d5d9ff'::uuid, 'fis2-uff-2023.2-p1', 9),
  ('35a7b50e-a8f3-4160-8dc9-e10a6ded36b4'::uuid, 'fis2-uff-2023.2-p1', 10),
  ('156bfe2b-47a6-412b-b46a-df50cc43f528'::uuid, 'fis2-uff-2023.2-p1', 11),
  ('d073e8df-76d3-45ef-a708-0482024fdf78'::uuid, 'fis2-uff-2023.2-p1', 12),
  ('9437df85-8d53-4430-a50c-2354d09797d0'::uuid, 'fis2-uff-2023.2-p1', 13),
  ('4ba45534-8065-4c51-8d71-c20b462bdfb5'::uuid, 'fis2-uff-2023.2-p1', 14),
  ('64a632a9-aa88-4ad4-ab02-1276a3709484'::uuid, 'fis2-uff-2023.2-p1', 15),
  ('3f3b7aef-ca10-4447-a6d2-93ddb9cf468b'::uuid, 'fis2-uff-2023.2-p2', 1),
  ('a8eff923-afd9-4898-bc45-1c62fb629aa3'::uuid, 'fis2-uff-2023.2-p2', 2),
  ('914c639c-0ac0-454f-a59d-c9e86776e870'::uuid, 'fis2-uff-2023.2-p2', 3),
  ('54d7be37-8778-4ca8-813c-2d6c78fae17c'::uuid, 'fis2-uff-2023.2-p2', 4),
  ('2489686a-2935-4328-96f4-7d79765ca44c'::uuid, 'fis2-uff-2023.2-p2', 5),
  ('05598c35-43a8-4717-8e3c-1387accecc2a'::uuid, 'fis2-uff-2023.2-p2', 6),
  ('8d423d60-8905-4f11-98e2-5610147c571c'::uuid, 'fis2-uff-2023.2-p2', 7),
  ('2f0610d9-f24a-46d0-b387-325c57bee289'::uuid, 'fis2-uff-2023.2-p2', 8),
  ('92c1da43-34ba-4487-9172-120386d2a195'::uuid, 'fis2-uff-2023.2-p2', 9),
  ('cff4cb98-bffb-4e54-ab1d-633fcaa68b3a'::uuid, 'fis2-uff-2023.2-p2', 10),
  ('3dd8d6da-10b2-4c7b-ae5a-c6e4110b44e7'::uuid, 'fis2-uff-2023.2-p2', 11),
  ('dc1bb375-4979-42fc-a57a-e806e8f3f449'::uuid, 'fis2-uff-2023.2-p2', 12),
  ('f0edc472-1852-4efd-9fc5-1c82e4938751'::uuid, 'fis2-uff-2023.2-p2', 13),
  ('6fcfd12b-fb78-4df6-8f4e-3563bf81128f'::uuid, 'fis2-uff-2023.2-p2', 14),
  ('35b55c38-8cd4-4f52-8a18-1f32651d6e74'::uuid, 'fis2-uff-2023.2-p2', 15),
  ('8d650ba1-03a8-46d3-9c32-ac21d933ae5d'::uuid, 'fis2-uff-2023.2-p3', 1),
  ('ed097cd6-edde-4ab4-a729-3ef71f254f20'::uuid, 'fis2-uff-2023.2-p3', 2),
  ('5b365213-a1ac-4000-9a3b-a041753dbded'::uuid, 'fis2-uff-2023.2-p3', 3),
  ('7947a6f1-a932-4467-8b02-7a3bfdc94a94'::uuid, 'fis2-uff-2023.2-p3', 4),
  ('22c4334b-7ef9-4709-be9a-ca1078699cd6'::uuid, 'fis2-uff-2023.2-p3', 5),
  ('6959264c-81af-43ae-b354-1c51082ea6d5'::uuid, 'fis2-uff-2023.2-p3', 6),
  ('675c3aa5-9f6c-480b-bd61-3b17a8446c35'::uuid, 'fis2-uff-2023.2-p3', 7),
  ('b644e148-0d0b-402c-9757-cf5ff38d0876'::uuid, 'fis2-uff-2023.2-p3', 8),
  ('3cae3ad8-2805-4f8c-903b-2a195f628a26'::uuid, 'fis2-uff-2023.2-p3', 9),
  ('113ac412-aab0-4568-9934-5cfe563399b8'::uuid, 'fis2-uff-2023.2-p3', 10),
  ('30ee2d87-fc8d-4d67-a312-f16981a07951'::uuid, 'fis2-uff-2023.2-p3', 11),
  ('dc818f9a-1f05-477c-af88-0d755872975f'::uuid, 'fis2-uff-2023.2-p3', 12),
  ('60cb48ff-a5e0-4828-9017-0c0bbe52a514'::uuid, 'fis2-uff-2023.2-p3', 13),
  ('eb235a8f-e3a4-482a-9804-16046d28310d'::uuid, 'fis2-uff-2023.2-p3', 14),
  ('303677d6-1f95-45cf-8c39-3235ac85e93f'::uuid, 'fis2-uff-2023.2-p3', 15),
  ('cf11960f-c165-4db8-9274-4487427dc283'::uuid, 'fis2-uff-2024.1-p1', 1),
  ('156a6e5d-8c05-4a03-81d3-3050f25a5b87'::uuid, 'fis2-uff-2024.1-p1', 2),
  ('c5614f33-be54-4b9b-bd39-28e3b2eae9a8'::uuid, 'fis2-uff-2024.1-p1', 3),
  ('1b80b274-f1c1-4c8d-b3b4-c2c9511a1d93'::uuid, 'fis2-uff-2024.1-p1', 4),
  ('215d6699-48b2-4831-8953-db52dd7629b9'::uuid, 'fis2-uff-2024.1-p1', 5),
  ('2167784d-53c8-4b78-8b41-1705235423cd'::uuid, 'fis2-uff-2024.1-p1', 6),
  ('6ef46c34-b798-4756-a6f7-69b79f394a09'::uuid, 'fis2-uff-2024.1-p1', 7),
  ('075cdf17-18a8-4fda-8ef3-9c304acf817e'::uuid, 'fis2-uff-2024.1-p1', 8),
  ('e075a559-5e20-4e95-b8d2-ffc7ff2e098a'::uuid, 'fis2-uff-2024.1-p1', 9),
  ('742724d4-60b3-4b1e-bec1-a24bd066c247'::uuid, 'fis2-uff-2024.1-p1', 10),
  ('4530d797-93b5-40e2-aa57-d51abadb89bd'::uuid, 'fis2-uff-2024.1-p1', 11),
  ('5ee85792-9529-460e-8883-512bc34cd8e5'::uuid, 'fis2-uff-2024.1-p1', 12),
  ('dae9fc02-2645-4040-9c42-a0b41f276cec'::uuid, 'fis2-uff-2024.1-p1', 13),
  ('276946a2-8ce8-4205-a495-dfd54630615b'::uuid, 'fis2-uff-2024.1-p1', 14),
  ('223a26aa-62dd-4e8d-b123-e4d17bdcc9cb'::uuid, 'fis2-uff-2024.1-p1', 15),
  ('f5d51976-a649-4ea3-a945-e241aa9b9ed3'::uuid, 'fis2-uff-2024.1-p2', 1),
  ('9e77ab30-f3c3-4b19-b390-bca779b8de07'::uuid, 'fis2-uff-2024.1-p2', 2),
  ('7f463ccf-90bf-49e4-bb1d-11e4909b17b1'::uuid, 'fis2-uff-2024.1-p2', 3),
  ('3374f437-e655-4513-99c2-5d3204b9c043'::uuid, 'fis2-uff-2024.1-p2', 4),
  ('c03c7c67-45d3-43b2-80b0-28c94d5c7d33'::uuid, 'fis2-uff-2024.1-p2', 5),
  ('21354bf7-4637-40ea-a138-536a566a7d72'::uuid, 'fis2-uff-2024.1-p2', 6),
  ('67f30377-b768-4460-8f8b-1e76dbe24440'::uuid, 'fis2-uff-2024.1-p2', 7),
  ('90c1bcd6-685d-4704-9fba-a4ca0ae67f67'::uuid, 'fis2-uff-2024.1-p2', 8),
  ('b0442b61-cf43-46e8-ab86-e4aa7c99e423'::uuid, 'fis2-uff-2024.1-p2', 9),
  ('643c52e3-6ec0-43bd-b3f1-96d23d805584'::uuid, 'fis2-uff-2024.1-p2', 10),
  ('5d76c2fb-c74c-403c-bdd9-04ea29124b52'::uuid, 'fis2-uff-2024.1-p2', 11),
  ('fd692dd1-08c9-4839-92ef-17d7fe5255cd'::uuid, 'fis2-uff-2024.1-p2', 12),
  ('3acffecf-b812-4e3a-aaed-ed6146f4cdf9'::uuid, 'fis2-uff-2024.1-p2', 13),
  ('2b1dc256-c9c3-4378-8142-e15c985216fc'::uuid, 'fis2-uff-2024.1-p2', 14),
  ('7c03b2fd-bd39-4294-a665-73ef2b904962'::uuid, 'fis2-uff-2024.1-p2', 15),
  ('6954ba2f-7ab8-4ac1-9561-3c42e5f46c2b'::uuid, 'fis2-uff-2024.1-p3', 1),
  ('e1be3d96-43c7-4adc-b83c-ba16ab97b576'::uuid, 'fis2-uff-2024.1-p3', 2),
  ('7ae96fd5-677b-4756-b2d3-a805f200d24c'::uuid, 'fis2-uff-2024.1-p3', 3),
  ('960e00ac-0de6-4733-b8fc-c2d30406def9'::uuid, 'fis2-uff-2024.1-p3', 4),
  ('d29f0729-d95d-44b2-9cfb-8ea456c653c2'::uuid, 'fis2-uff-2024.1-p3', 5),
  ('cd0381ea-490d-447e-b133-f7530cb6d860'::uuid, 'fis2-uff-2024.1-p3', 6),
  ('fea86c96-53bc-48db-befb-237983617b2f'::uuid, 'fis2-uff-2024.1-p3', 7),
  ('f181cbdc-f63a-41fc-8dac-681be44beed7'::uuid, 'fis2-uff-2024.1-p3', 8),
  ('090a6030-5ca6-4201-8b96-46d3db632116'::uuid, 'fis2-uff-2024.1-p3', 9),
  ('bee05b7a-bbc2-43c4-961f-3b26e078802d'::uuid, 'fis2-uff-2024.1-p3', 10),
  ('60a6dc23-f074-4d83-9441-7137342916ae'::uuid, 'fis2-uff-2024.1-p3', 11),
  ('da101aab-7ce1-4d3c-a8db-84dabb03ab6a'::uuid, 'fis2-uff-2024.1-p3', 12),
  ('48d40861-19ae-4493-97b2-8d423d524a48'::uuid, 'fis2-uff-2024.1-p3', 13),
  ('f50f325d-0728-4e5f-ad14-e0dc4dfc34bc'::uuid, 'fis2-uff-2024.1-p3', 14),
  ('25349cb2-bbb0-4ba6-b424-9049cf542a87'::uuid, 'fis2-uff-2024.1-p3', 15),
  ('382b6f47-a509-459c-9d4d-fd73e58923fc'::uuid, 'fis2-uff-2024.2-p1', 1),
  ('e4541b69-7c5d-4ebe-bec5-4645c5e5b266'::uuid, 'fis2-uff-2024.2-p1', 2),
  ('da095156-3f0d-4229-bc1d-2f56a69ffbd5'::uuid, 'fis2-uff-2024.2-p1', 3),
  ('f17d7044-e47e-49a5-914f-a92e32a5c6f9'::uuid, 'fis2-uff-2024.2-p1', 4),
  ('132bb3a8-846f-42e9-a869-b5fec43288ee'::uuid, 'fis2-uff-2024.2-p1', 5),
  ('df05e4df-38ce-4019-8da5-d3f4f6ee1e02'::uuid, 'fis2-uff-2024.2-p1', 6),
  ('ca22e2c1-7c07-4688-855c-7b8003bd8b9a'::uuid, 'fis2-uff-2024.2-p1', 7),
  ('c4ef3213-a138-430d-82e7-c96c35aa28b3'::uuid, 'fis2-uff-2024.2-p1', 8),
  ('cdde86cc-7981-4c0d-869a-bbf4edd8467c'::uuid, 'fis2-uff-2024.2-p1', 9),
  ('eff8aaa9-4e5a-42e1-92f9-81711213e318'::uuid, 'fis2-uff-2024.2-p1', 10),
  ('c7debe5a-ec67-473a-815f-d8a2ce64635c'::uuid, 'fis2-uff-2024.2-p1', 11),
  ('7755e3e9-5620-4d9b-b8cc-44b9411f035b'::uuid, 'fis2-uff-2024.2-p1', 12),
  ('8bdcc0f7-3030-4d15-adcf-ed56e649f5ca'::uuid, 'fis2-uff-2024.2-p1', 13),
  ('dfdf0003-8fd1-4eb1-bdd7-6dcbc81942aa'::uuid, 'fis2-uff-2024.2-p2', 1),
  ('d2c46fca-4dd9-46e3-b5d8-2c7a8192e1ef'::uuid, 'fis2-uff-2024.2-p2', 2),
  ('1edfa51b-b9e8-4a24-9b8e-8786d1ab155a'::uuid, 'fis2-uff-2024.2-p2', 3),
  ('c650bbaa-2091-4bb7-852b-3d5ca0f2caf6'::uuid, 'fis2-uff-2024.2-p2', 4),
  ('858c44fb-1ea7-48d1-b1c1-c79529566f11'::uuid, 'fis2-uff-2024.2-p2', 5),
  ('af17221b-972a-4b47-bbbf-3e08c1ae667e'::uuid, 'fis2-uff-2024.2-p2', 6),
  ('cfc9e16a-5806-46c3-9aec-66235c25027d'::uuid, 'fis2-uff-2024.2-p2', 7),
  ('66b7d18a-1178-49b1-b6c1-4b439b74d332'::uuid, 'fis2-uff-2024.2-p2', 8),
  ('e3db14e4-ce15-44ad-8373-dbc7ddc4706a'::uuid, 'fis2-uff-2024.2-p2', 9),
  ('1468107b-5dbd-4fcc-a147-c2f0395d0243'::uuid, 'fis2-uff-2024.2-p2', 10),
  ('4b8b8c7a-6a31-42e2-863f-46b8fb74a67c'::uuid, 'fis2-uff-2024.2-p2', 11),
  ('22022b0a-15bb-4c94-a64a-0775cd4b7c6f'::uuid, 'fis2-uff-2024.2-p2', 12),
  ('d002488f-a14b-474b-968f-4a5d9aba60a7'::uuid, 'fis2-uff-2024.2-p2', 13),
  ('15abd8da-bfcc-44c5-8619-2a645748a049'::uuid, 'fis2-uff-2024.2-p2', 14),
  ('63cacbf6-b75c-457f-93ad-2ea2a8b0d492'::uuid, 'fis2-uff-2024.2-p2', 15),
  ('f96bade0-d629-404a-808b-53be2e734e7d'::uuid, 'fis2-uff-2024.2-p3', 1),
  ('fd31301a-6fbc-458b-98e0-31147870e2b7'::uuid, 'fis2-uff-2024.2-p3', 2),
  ('f4d7ab83-4c48-442c-8919-413b91f3d8b3'::uuid, 'fis2-uff-2024.2-p3', 3),
  ('e4b827b1-ce15-4b85-bbc6-094a5eb70478'::uuid, 'fis2-uff-2024.2-p3', 4),
  ('656b41df-dcd8-436d-b654-2260f616fd81'::uuid, 'fis2-uff-2024.2-p3', 5),
  ('6ce40099-71b7-4cb5-b9f8-1e25b01e0087'::uuid, 'fis2-uff-2024.2-p3', 6),
  ('a98b176c-112a-4fe3-a013-65e40d8a5ff9'::uuid, 'fis2-uff-2024.2-p3', 7),
  ('aa73c105-03cb-4b17-99c7-2f844531fd5e'::uuid, 'fis2-uff-2024.2-p3', 8),
  ('68f0c227-7b08-4878-b03c-5778d9eebc79'::uuid, 'fis2-uff-2024.2-p3', 9),
  ('f01a7e69-1ea1-421f-9d98-35ab815bdfcc'::uuid, 'fis2-uff-2024.2-p3', 10),
  ('eb677484-c879-4296-90d1-f4c1dd2c3877'::uuid, 'fis2-uff-2024.2-p3', 11),
  ('70e2785e-8ad8-41a4-9ef8-ea23a65d22d1'::uuid, 'fis2-uff-2024.2-p3', 12),
  ('2e0b9c16-66d1-476b-9012-4fb4f99ad7e5'::uuid, 'fis2-uff-2024.2-p3', 13),
  ('efa1f415-0e1f-42ae-9a0d-d114dc0d8f6c'::uuid, 'fis2-uff-2024.2-p3', 14),
  ('896e0abf-b643-4cd7-bf06-6652a661ae04'::uuid, 'fis2-uff-2024.2-p3', 15),
  ('dc8059db-ff73-424a-91ca-9f3f98f9c1fc'::uuid, 'fis2-uff-2025.1-p1', 1),
  ('7cc0648a-5f6d-4f5b-befb-24057becd761'::uuid, 'fis2-uff-2025.1-p1', 2),
  ('62bce556-4d8f-4b7d-b87e-f055e8e26bc2'::uuid, 'fis2-uff-2025.1-p1', 3),
  ('01056624-fd11-4a05-89b7-1f1d86fbe3b2'::uuid, 'fis2-uff-2025.1-p1', 4),
  ('092715a2-6b20-44df-8892-9ee3b2b8ac35'::uuid, 'fis2-uff-2025.1-p1', 5),
  ('0917fdfe-144f-4eaf-9916-90fee6a25119'::uuid, 'fis2-uff-2025.1-p1', 6),
  ('2c864f67-bcbb-4843-b29f-3750efbcd514'::uuid, 'fis2-uff-2025.1-p1', 7),
  ('1de931d8-a65a-4a55-a25e-2dafe51be12f'::uuid, 'fis2-uff-2025.1-p1', 8),
  ('a331e8c1-b53d-4470-b11e-3162f508da93'::uuid, 'fis2-uff-2025.1-p1', 9),
  ('2171ddb5-7518-4afe-9bcc-a3193b35f925'::uuid, 'fis2-uff-2025.1-p1', 10),
  ('cc140c71-ab2b-4be1-b475-edca0cc68fc1'::uuid, 'fis2-uff-2025.1-p1', 11),
  ('ecb964f6-3fe1-4743-8ffc-ad953d686765'::uuid, 'fis2-uff-2025.1-p1', 12),
  ('8f86a5ce-ebb6-41b1-a86d-c8d3463e01fa'::uuid, 'fis2-uff-2025.1-p1', 13),
  ('9a49ca80-1a17-4c79-8c92-4a33bc5387d0'::uuid, 'fis2-uff-2025.1-p1', 14),
  ('471f64e6-f9f9-4994-8a36-593ad654cc9f'::uuid, 'fis2-uff-2025.1-p1', 15),
  ('2639c270-bfac-44c9-bc73-c444314d37ab'::uuid, 'fis2-uff-2025.1-p2', 1),
  ('e6396672-656d-4a27-be1a-38494a38ee2e'::uuid, 'fis2-uff-2025.1-p2', 2),
  ('ac2f5309-28eb-44e3-aee2-910a7660b2f5'::uuid, 'fis2-uff-2025.1-p2', 3),
  ('784c94ca-5922-437f-b5b3-953ca8c42240'::uuid, 'fis2-uff-2025.1-p2', 4),
  ('dc39969d-1356-419b-83a3-575211dbf236'::uuid, 'fis2-uff-2025.1-p2', 5),
  ('97871dcc-3e4c-4013-b820-17cbd6873adb'::uuid, 'fis2-uff-2025.1-p2', 6),
  ('58287e7c-af9c-43b0-812e-3d207b213673'::uuid, 'fis2-uff-2025.1-p2', 7),
  ('daf88455-ee00-4f21-8db5-ff556268c2c6'::uuid, 'fis2-uff-2025.1-p2', 8),
  ('b480ac69-304c-4edc-978f-a5f59760e7f2'::uuid, 'fis2-uff-2025.1-p2', 9),
  ('67f03dbd-e4c5-4530-9ff8-f7071cb0d9e0'::uuid, 'fis2-uff-2025.1-p2', 10),
  ('6c92103d-998e-4b80-8dc1-f0a44730f5b2'::uuid, 'fis2-uff-2025.1-p2', 11),
  ('5abb1b23-d6ce-4f5e-b0c4-c314396d47ac'::uuid, 'fis2-uff-2025.1-p2', 12),
  ('88a565ef-6e9b-4fc8-a1f7-62ebf4af5db4'::uuid, 'fis2-uff-2025.1-p2', 13),
  ('b3607779-2b31-43a7-9d28-6abe186ee036'::uuid, 'fis2-uff-2025.1-p2', 14),
  ('e21652d5-2ea0-4be7-920f-fa1d06116a1e'::uuid, 'fis2-uff-2025.1-p2', 15),
  ('5efcb7f8-a23c-498d-8a5d-05412688c0c3'::uuid, 'fis2-uff-2025.1-p3', 1),
  ('77e05a71-5f97-4155-ac80-2f076be41161'::uuid, 'fis2-uff-2025.1-p3', 2),
  ('1fe9bd5f-4333-46c0-b7de-25eeedfdf534'::uuid, 'fis2-uff-2025.1-p3', 3),
  ('5e132ed9-7e03-466e-a15c-324e7351789c'::uuid, 'fis2-uff-2025.1-p3', 4),
  ('db55be11-3b68-447b-a76f-30ebb397d44c'::uuid, 'fis2-uff-2025.1-p3', 5),
  ('2000357d-4ade-4bf0-a47e-abd1f35e33cc'::uuid, 'fis2-uff-2025.1-p3', 6),
  ('d39cce9c-3899-490c-ba19-71c0bbe7130a'::uuid, 'fis2-uff-2025.1-p3', 7),
  ('d9ddc6c2-3eb3-4387-b4ec-6df26a892f6c'::uuid, 'fis2-uff-2025.1-p3', 8),
  ('6eaee70d-2bdc-461f-a4fb-aaa9eb098eef'::uuid, 'fis2-uff-2025.1-p3', 9),
  ('11e394be-0fc0-47e7-b948-0c3bf9e4d7f8'::uuid, 'fis2-uff-2025.1-p3', 10),
  ('27dcd1b2-a73a-4b07-b318-e8412904b45e'::uuid, 'fis2-uff-2025.1-p3', 11),
  ('671ceeda-c0b4-4441-89ff-c31bf843e662'::uuid, 'fis2-uff-2025.1-p3', 12),
  ('50573e57-3638-4b19-af03-64263c652f85'::uuid, 'fis2-uff-2025.1-p3', 13),
  ('5b318b8d-c8f7-4874-a85a-dec156a791ae'::uuid, 'fis2-uff-2025.1-p3', 14),
  ('b262fa44-95e9-4ae4-832e-4010698ad379'::uuid, 'fis2-uff-2025.1-p3', 15),
  ('739bb7f1-f156-4487-b30e-9a8570ffe168'::uuid, 'fis2-uff-2025.2-p1', 1),
  ('076cbdc2-965e-4eb9-9371-2b6e2f3da1fd'::uuid, 'fis2-uff-2025.2-p1', 2),
  ('79bd23ff-6758-4245-852a-14d12027a18e'::uuid, 'fis2-uff-2025.2-p1', 3),
  ('d790bcae-0616-4083-919c-6668ee622ad8'::uuid, 'fis2-uff-2025.2-p1', 4),
  ('f49cc878-33d6-4631-a3d8-65b81bbd9588'::uuid, 'fis2-uff-2025.2-p1', 5),
  ('50ecc3d1-dbd1-40e2-adcc-b843d535b1c3'::uuid, 'fis2-uff-2025.2-p1', 6),
  ('19de4505-3186-47eb-9421-a3eff0272c2f'::uuid, 'fis2-uff-2025.2-p1', 7),
  ('cc6bc0e5-9f03-4b92-95d0-894d6ac8d4b0'::uuid, 'fis2-uff-2025.2-p1', 8),
  ('7d86526a-211f-47e9-a425-e135222e9202'::uuid, 'fis2-uff-2025.2-p1', 9),
  ('e8e1172e-4fb4-4338-9add-f53d96ef5923'::uuid, 'fis2-uff-2025.2-p1', 10),
  ('d8c0caf2-1d70-4552-bb69-faa99d78d60a'::uuid, 'fis2-uff-2025.2-p1', 11),
  ('0d73d046-4719-4a92-8ea4-89f42a2d4c8f'::uuid, 'fis2-uff-2025.2-p1', 12),
  ('07273bac-1d5f-46ad-8b19-8b5e2abff03f'::uuid, 'fis2-uff-2025.2-p1', 13),
  ('57a2aaab-8c3f-4dff-abbe-2daff1620f66'::uuid, 'fis2-uff-2025.2-p1', 14),
  ('971dc8f1-28d9-4950-b147-89d3feb61939'::uuid, 'fis2-uff-2025.2-p1', 15),
  ('4f5f39f3-85ef-467d-b447-41542892b176'::uuid, 'fis2-uff-2025.2-p2', 1),
  ('164167bb-49ab-45dd-a6ce-28842d046a03'::uuid, 'fis2-uff-2025.2-p2', 2),
  ('0d6d04ed-1741-4eb4-aa0d-5a42ea60ab33'::uuid, 'fis2-uff-2025.2-p2', 3),
  ('b321c91a-62c9-4f4f-83a2-761dd71697a2'::uuid, 'fis2-uff-2025.2-p2', 4),
  ('83d2d245-71bb-4fbb-9d43-859f2059e8b2'::uuid, 'fis2-uff-2025.2-p2', 5),
  ('90a22c40-e6e5-4489-8759-766e6ed3c6fe'::uuid, 'fis2-uff-2025.2-p2', 6),
  ('f629f43e-af5b-4d86-aaaf-7095fd1429e6'::uuid, 'fis2-uff-2025.2-p2', 7),
  ('bf71b768-eff5-49f8-b258-0c9503044022'::uuid, 'fis2-uff-2025.2-p2', 8),
  ('7193aaa1-ec87-4ea7-9e06-ff52b2406976'::uuid, 'fis2-uff-2025.2-p2', 9),
  ('4974cdef-330c-4028-9d85-20419e99f4e7'::uuid, 'fis2-uff-2025.2-p2', 10),
  ('189a0bad-92c6-4599-a662-5be0e054e181'::uuid, 'fis2-uff-2025.2-p2', 11),
  ('e002042d-1b57-495c-80b0-c30c224f29bd'::uuid, 'fis2-uff-2025.2-p2', 12),
  ('6c047b6e-f50a-44e8-96e5-c21e31f8b468'::uuid, 'fis2-uff-2025.2-p2', 13),
  ('91dec8be-3433-4465-8e95-683b57dfd2df'::uuid, 'fis2-uff-2025.2-p2', 14),
  ('c7f14f57-7db9-49a8-b03e-b781119fca96'::uuid, 'fis2-uff-2025.2-p2', 15),
  ('b462da9a-05ae-4cf2-acf1-57aaf318a369'::uuid, 'fis2-uff-2025.2-p3', 1),
  ('43fceb88-b996-4e1f-a0c5-fe3312bc853f'::uuid, 'fis2-uff-2025.2-p3', 2),
  ('69fc2a35-c406-4528-a43c-1a3ee47032d5'::uuid, 'fis2-uff-2025.2-p3', 3),
  ('952fa79e-fb3d-4886-b966-5f624ed23312'::uuid, 'fis2-uff-2025.2-p3', 4),
  ('718caf72-69e6-404e-83f8-3d9065b460d2'::uuid, 'fis2-uff-2025.2-p3', 5),
  ('2277cabe-fd10-41a7-8895-73979670197b'::uuid, 'fis2-uff-2025.2-p3', 6),
  ('40e7ee9b-7354-4a33-9461-bf5dbd0013fe'::uuid, 'fis2-uff-2025.2-p3', 7),
  ('1cdbd6fb-9d81-49f8-96b9-ee30da6e87f0'::uuid, 'fis2-uff-2025.2-p3', 8),
  ('b5a39a85-cac0-40cd-9729-19f1262d1ec3'::uuid, 'fis2-uff-2025.2-p3', 9),
  ('b2d7af9e-ddf8-4819-b6ca-a47f0c42bb5c'::uuid, 'fis2-uff-2025.2-p3', 10),
  ('63a7dedc-5e0f-4c10-9b83-f8fcb28f6994'::uuid, 'fis2-uff-2025.2-p3', 11),
  ('3e686ea5-8704-460a-bc10-d15d4b41e1a1'::uuid, 'fis2-uff-2025.2-p3', 12),
  ('41225ddf-4307-4cdb-b4e1-e09853701224'::uuid, 'fis2-uff-2025.2-p3', 13),
  ('68770693-8a73-407e-81f4-1acb85fbae0e'::uuid, 'fis2-uff-2025.2-p3', 14),
  ('807a4dc4-cf21-40bd-a3de-eb77f13ff1a7'::uuid, 'fis2-uff-2025.2-p3', 15)
)
update questions q
   set prova_codigo = m.codigo,
       prova_ordem  = m.ordem
  from mapa m
 where q.id = m.id
   and (q.prova_codigo is distinct from m.codigo or q.prova_ordem is distinct from m.ordem);

-- ---------------------------------------------------------------------------
-- 3. Catálogo de provas (view) — o que a tela /simulados/provas lista
-- ---------------------------------------------------------------------------
-- Derivada, não tabela: a prova É o conjunto das suas questões. Uma tabela de
-- metadados seria uma segunda casa pra mesma verdade e ficaria dessincronizada
-- na primeira questão corrigida.
--
-- Sem filtro de `desafio`, de propósito — e é a única parte do app que não o
-- aplica. Aprofundamento fica fora de todo SORTEIO automático (missão, rota do
-- GPS, montador), porque lá o app escolhe o que o aluno vai ver. Aqui ele não
-- escolhe nada: a prova de 2023.1 tem as questões que o professor pôs nela, e
-- esconder uma porque alguém a marcou depois entregaria uma prova mutilada
-- com cara de completa.
drop view if exists vw_provas_oficiais;
create view vw_provas_oficiais as
select
  q.prova_codigo                as codigo,
  min(q.instituicao)            as instituicao,
  t.materia_id                  as materia_id,
  m.nome                        as materia_nome,
  max(q.ano)                    as ano,
  count(*)                      as questoes
from questions q
join topicos t  on t.id = q.topic_id
join materias m on m.id = t.materia_id
where q.prova_codigo is not null
group by q.prova_codigo, t.materia_id, m.nome;

grant select on vw_provas_oficiais to authenticated;

-- ---------------------------------------------------------------------------
-- 4. O simulado sabe que prova ele é, e se o aluno quer aparecer
-- ---------------------------------------------------------------------------

alter table simulados_aluno add column if not exists prova_codigo text;
alter table simulados_aluno add column if not exists publico boolean not null default false;

comment on column simulados_aluno.prova_codigo is
  'Prova oficial reaplicada (questions.prova_codigo). Null = simulado sorteado pelo montador.';
comment on column simulados_aluno.publico is
  'O aluno autorizou mostrar este resultado no ranking da prova. Opt-in: nasce false.';

-- Ordem do ranking: nota desc, desempate pelo tempo.
create index if not exists idx_simulados_prova_ranking
  on simulados_aluno (prova_codigo, nota desc, tempo_gasto_seg)
  where prova_codigo is not null;

-- ---------------------------------------------------------------------------
-- 5. Ranking (view security definer — ver o cabeçalho)
-- ---------------------------------------------------------------------------
-- Só linhas públicas, concluídas e de prova oficial; só as colunas do placar.
-- `user_id` sai junto porque a tela precisa marcar "este é você" — é o mesmo
-- id que já aparece no ranking semanal da liga, não um dado novo.
drop view if exists vw_ranking_provas_oficiais;
create view vw_ranking_provas_oficiais as
select
  s.prova_codigo                                       as prova_codigo,
  s.id                                                 as simulado_id,
  s.user_id                                            as user_id,
  coalesce(nullif(p.username, ''), nullif(p.nome, '')) as nome,
  p.foto_url                                           as foto_url,
  s.acertos                                            as acertos,
  s.total                                              as total,
  s.nota                                               as nota,
  s.tempo_gasto_seg                                    as tempo_gasto_seg,
  s.concluido_em                                       as concluido_em
from simulados_aluno s
join profiles p on p.id = s.user_id
where s.prova_codigo is not null
  and s.status = 'concluido'
  and s.publico is true;

grant select on vw_ranking_provas_oficiais to authenticated;

-- ---------------------------------------------------------------------------
-- Conferência (o esperado está escrito ao lado)
-- ---------------------------------------------------------------------------

-- 1) Deve devolver 31 provas e 461 questões no total.
select count(*) as provas, sum(questoes) as questoes from vw_provas_oficiais;

-- 2) Toda prova tem ordem completa 1..n, sem buraco nem repetição.
--    O esperado é NENHUMA linha.
select prova_codigo, count(*) as questoes, count(distinct prova_ordem) as ordens,
       min(prova_ordem) as primeira, max(prova_ordem) as ultima
  from questions
 where prova_codigo is not null
 group by prova_codigo
having count(*) <> count(distinct prova_ordem)
    or min(prova_ordem) <> 1
    or max(prova_ordem) <> count(*);

-- 3) Nenhum simulado existente foi tocado: todos continuam sem prova_codigo e
--    privados (publico = false).
select count(*) filter (where prova_codigo is not null) as de_prova_oficial,
       count(*) filter (where publico) as publicos,
       count(*) as total
  from simulados_aluno;
