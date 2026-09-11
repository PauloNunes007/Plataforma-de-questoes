-- ============================================================
-- QUESTLY — questão de desafio (aprofundamento)
-- Rodar DEPOIS de supabase_conteudo_compartilhado.sql (precisa de
-- "questions" já existente). Migração aditiva e idempotente.
--
-- POR QUE EXISTE: o banco de Química Geral foi povoado com um lote de
-- compêndio (estilo Brown) que vai muito além do que a prova cobra —
-- regras de Slater, de Broglie do nêutron, densidade de probabilidade
-- radial, Born-Haber, tabela ICE, Nernst. O dono, que cursou a
-- disciplina, avaliou como "longe demais no conteúdo": o professor quer
-- saber se o aluno entendeu o FENÔMENO. Apagar seria jogar fora conteúdo
-- correto; a decisão foi marcá-lo como DESAFIO e deixar claro pro aluno
-- que aquilo é aprofundamento, não o nível da prova.
--
-- EFEITO NO APP (web/):
--   - /questao mostra um selo "Desafio · aprofundamento" com uma linha
--     explicando que aquilo vai além do nível cobrado na prova;
--   - o sorteio AUTOMÁTICO de questões passa a ignorar desafio: missão
--     diária (mission-engine), desafio de recuperação, rota do GPS e
--     sorteio de simulado. Aprofundamento não entra sem o aluno pedir;
--   - o Banco de Questões ganha o chip "Incluir questões de desafio",
--     que é como o aluno opta por encará-las. Elas pagam XP normalmente.
--
-- Sem mudança de RLS (a coluna herda as policies já existentes de
-- "questions"; escrita continua restrita ao admin pelo
-- supabase_seguranca_hardening.sql).
-- ============================================================

alter table questions add column if not exists desafio boolean not null default false;

-- Índice parcial: as consultas de sorteio filtram "desafio = false" e
-- esse é o caso da esmagadora maioria das linhas, então o índice útil é
-- o do conjunto pequeno (quem É desafio), usado pelas telas que listam
-- aprofundamento.
create index if not exists questions_desafio_idx on questions (desafio) where desafio;

-- ------------------------------------------------------------
-- Backfill: as 128 questões de Química Geral dos lotes de compêndio
-- (quimica_geral.json, _lote2, _lote3) marcadas como "dificil".
--
-- A lista é explícita, por id, de propósito: o critério "Química Geral +
-- sem instituição + dificuldade dificil" também pegaria as autorais
-- novas (quimica_uff_estilo.json), que são conceituais e devem continuar
-- no fluxo normal. Reexecutar este bloco é inofensivo.
--
-- Nível de prova que PERMANECE normal: as 76 questões médio/fácil dos
-- mesmos lotes, as 46 transcrições de prova da UFF (quimica_uff_oficial)
-- e as 61 autorais conceituais (quimica_uff_estilo).
-- ------------------------------------------------------------
update questions set desafio = true where id in (
  '01145445-3e6f-425d-8e3c-a2efd3bd559b', '03098cc7-b5c4-44b5-ae6d-d147219fc9ce', '03e4e2e0-a3b7-4a44-8ad8-995247216d22',
  '04af1a7b-ffa6-4c83-a77b-305d1f25231d', '057907f4-5392-4d22-a463-fd9f8f2ec4d2', '08f3991b-1cc7-4501-8742-93a0ed196e3c',
  '0c95ace8-d252-4b37-92af-1e5b7ccff290', '103de137-7db1-4839-93a6-40a687daa0ae', '1185f957-bf7f-4d3f-8b7e-95515ad95e2f',
  '13072e8e-73b6-4b7b-8050-2084ae2b1a0d', '1514f81a-3dea-4fc2-aa8c-60a28c14c768', '1b917705-45a3-4fdb-ad5e-dc8d01a3c284',
  '1d061ab2-5cc9-42e8-8f8f-62d46dd9e2d2', '1eb5bd1a-aa8b-4205-8183-dde13f0e8461', '1f3efff7-3fb4-4a88-94cc-a2c680e45e0f',
  '226a150e-6748-4fc2-8809-77c78dfa5d1c', '22767177-0cef-4fbb-94d9-35c9a1fe5d48', '25ade9d7-54c0-4df7-9bb5-80e16ab746cb',
  '283b0f86-b053-4545-bfb9-b7a3c1063a2f', '2999b891-1e00-4780-ba0b-61bd3f9afb68', '2b952aee-aab6-48b8-82c2-187d6975514d',
  '2bbc3c49-23cb-48d7-9b06-26f14bc21545', '2bfcb034-023d-45ec-80cb-1a9c346daa99', '2d650914-b9de-4b45-85bb-e7cb7b7fa624',
  '3175bcb7-80f8-4d60-b05a-58da9af109ec', '346aa79f-20a5-42d9-b31a-ddf1b4bd2566', '351cf9af-0f1a-4604-a225-00fa5527fa06',
  '361572eb-9cb1-4a39-a60e-9b66fbe82257', '36d7ba2a-1384-4e78-bbbe-2d9a50080001', '3782350a-108b-4f12-accd-4349f257bac3',
  '383ac2c9-bfb0-4ee1-b616-5a4ba3c53ce5', '39d18883-4ffb-4592-8d8d-932aa1d5caa1', '3b2f015d-84c5-485c-bbfb-2c8294ff0f01',
  '3dc88929-d8ea-4f95-9dfe-81be2bd0375b', '3ed28c81-c8a6-4a90-bdf2-4eeba4186ba4', '4305eebf-a2b3-43ab-ad63-f18fb7df2111',
  '4422dddc-0999-4996-8629-2f4a704609dc', '4547d9d0-4fbd-4b4e-b07c-3446f63dc52c', '467ec130-6e56-4f1a-95f0-f38b9e9d5c4b',
  '48e04833-5a60-456f-b93d-28b53d86263d', '4ad32a60-2e17-432f-b93f-64597f3ae6e5', '4f845e03-f1d2-45f1-934b-087d01b49136',
  '4fa09f4f-517a-4e15-8458-9926a9978e3a', '509b4b06-ea34-400e-a495-66824d643612', '51267610-0b01-40bc-9bd9-b5738a5d6b65',
  '5301638d-a4ca-4470-81ef-360ecd4e3621', '56f73033-4bbf-45bc-b12e-eca12c1a8560', '58f30a0d-6d83-49f9-a5b0-fa269aa8cf2d',
  '5fb15a05-debb-4fda-99d1-3ab5fbcf5920', '6415410e-ad7b-4016-bcfa-bf7352f65d0a', '64aa1d3a-b906-42a9-a566-5fb62b19ba54',
  '683b28c0-5055-4c97-b37f-3b907ac9037f', '6865dd82-7264-4b29-b8ad-9ef037b20c6f', '69a6a205-eb5e-496a-85b9-693251d81b80',
  '7056ca1e-895d-46d3-88d5-491c0f85e5d2', '74340a11-3fd0-4c6c-8cbe-7ba6101aeac8', '79143c1b-0e67-4f6d-b365-a4277749e236',
  '798a36ef-2a10-4e0b-b4d5-0110709b6251', '7ac6241c-552c-417b-9f62-b4317621be5a', '81dce091-0f05-46c3-a886-449904318b6e',
  '83dad428-33e9-4203-bc7a-ede073f66fbf', '848021bf-49e7-4fac-af26-274373f01d54', '85fcc203-5c48-4b0c-974d-30565a2bd5cd',
  '868f3f2d-2019-4a6b-a60c-2d949974bade', '879ed603-8981-4131-929b-039c97a66373', '8f3b9717-767c-4dc0-ae81-a59e2936e338',
  '9053cf62-6b64-4b8d-aef4-a7d16fa59509', '913d1489-ccaf-484c-9055-8d41183c082c', '9144ed64-41e4-4a18-ac64-52b8f33e8dd3',
  '915dffe1-100f-4db6-8f89-f97ff15f9023', '926ad8bd-151e-4cdb-9b50-449be11a0a93', '96add6d1-3c18-4685-9935-03da3cb6756b',
  '96e8de36-34e7-4af2-881c-a7cb4139a688', '9a7e9b9c-0e4c-461d-8f22-d8550518e318', '9bbb1f85-a6e5-4b5a-8731-2681a2fed680',
  '9e18731c-5f20-4cbc-83e2-f13467a514e9', 'a17ed93a-7636-43d5-b7d5-31c9d38a962b', 'a3449781-a5c2-46ed-824e-214a529f9ad0',
  'a51a08c7-4b4c-464c-8c4c-70ea8773cd72', 'a53e4b22-3a5b-4a22-a3d5-02ae4909a426', 'a7a27431-82b8-4585-b4f6-ee6dfe85564f',
  'a7bfa660-6745-47a9-980f-c10262afa5df', 'a97ad039-4d53-416a-a933-746c27b0ca5d', 'aa5346c3-9b0a-4873-8930-6bdfc0c734c9',
  'ab273e29-9067-4b65-bba3-bfba76396216', 'ab4a0ddb-735f-409a-8f4a-4316ac7e3b69', 'ad433e35-ec5d-4de5-9f51-2eea1b6e6415',
  'afcbd7db-31ac-4d67-963a-b47ce4f2852b', 'b2a92d8f-4baf-4c44-87a6-93e07851a071', 'b356362d-2065-4041-ae41-6501dca6e6e4',
  'b3fc4352-9752-40e8-90d6-e3568ed8542b', 'b43cc333-766a-46f7-a1c2-b105ce6edf39', 'b4f9c316-b306-463e-b752-08175feab9a1',
  'b5b5b05a-7684-49b1-94e5-332d1e9a885f', 'ba6d4b5d-82f7-49f4-bcea-78474ae7ca31', 'bed2a4d6-bc81-4b2b-9e59-2aa539483cd3',
  'c06ef6e0-4533-4575-8647-ec56e29c9977', 'c0e39083-efe0-47c9-990f-4910452fb7aa', 'c3d5207d-5e8c-4c0b-915d-a3026f524f48',
  'c46e2884-5cab-49c8-9226-a15029e388f7', 'c53c423f-821d-4bf7-aa63-ab900aa70ec7', 'c69e40bd-3722-4e68-b92a-b666f2e4515e',
  'c7d19f91-607d-4126-a0a3-3d4e16bd89a1', 'c95abd77-9665-4a62-b9fc-1b3422097f17', 'cfd4ec70-c2b9-47d3-9f95-55ef11ae7690',
  'd05c34c9-7b37-48f6-86a6-0d7ac7e092c3', 'd27915c9-1bbe-4960-ac71-4a126d595318', 'd9d21574-1728-4cb4-874f-22bcba8a3076',
  'da7bde41-87d7-4fc1-ba5e-9a0b6caad49e', 'db3f01d5-73b6-4ef0-ae2b-39192f2ab4f4', 'dbe5331a-2978-43eb-8db5-772c004bc8fb',
  'e06e249e-079f-4573-a9ad-18a2a2f4795b', 'e875a8aa-2938-4861-b42c-d85bb064c885', 'e9a4b346-4351-411b-ad24-96569efe9d94',
  'edf83fdb-1a87-49f8-8286-375c4a4b6078', 'ee00c82c-6235-4631-81d1-fd4528e26c8e', 'ef8c5d53-3544-4059-8970-421040490118',
  'f1181e41-1954-475b-b728-97ddff866c5d', 'f50d90ef-6a45-4aff-8cb5-f25b32af449c', 'f65974f4-9d0e-4333-88c4-345867f3a682',
  'f967bd61-937e-4c0c-98ee-6e96bcb95d64', 'f9a0f5d1-bd8c-4494-89fe-1f6700223caf', 'f9dc120b-9e07-40f0-adda-d24d2a305c8d',
  'fa3c5b6f-e2af-4573-9240-51cb0265dc7e', 'fb850b5c-8632-4fff-be76-504f716a8a3a', 'fc5fb3e2-a913-4d0b-a718-aeb88e85571e',
  'fef80528-8a2a-43d2-9dfb-2bbf98b70892', 'ff4f0fe5-84ad-4546-a037-a0843c7ef415'
);
