-- ============================================================
-- QUESTLY — seed de exemplo (schema novo: materias/topicos
-- compartilhados). Rode isso DEPOIS de
-- supabase_conteudo_compartilhado.sql.
--
-- Cria a matéria "Cálculo II" (se não existir), 2 tópicos e 4
-- questões com LaTeX, pra testar o fluxo de ponta a ponta.
-- Ajuste o nome da matéria abaixo se quiser testar em outra
-- disciplina sua.
-- ============================================================

insert into materias (nome) values ('Cálculo II')
on conflict (nome) do nothing;

-- se a disciplina "Cálculo II" já existe na sua conta mas ainda não
-- estava linkada a essa materia (ex: criada antes da migração rodar)
update subjects s set materia_id = m.id
from materias m
where s.nome = 'Cálculo II' and m.nome = 'Cálculo II' and s.materia_id is null;

insert into topicos (materia_id, nome, cai_na_prova)
select id, 'Limites e Derivadas', true from materias
where nome = 'Cálculo II'
and not exists (select 1 from topicos t where t.materia_id = materias.id and t.nome = 'Limites e Derivadas');

insert into topicos (materia_id, nome, cai_na_prova)
select id, 'Integrais', true from materias
where nome = 'Cálculo II'
and not exists (select 1 from topicos t where t.materia_id = materias.id and t.nome = 'Integrais');

insert into questions (topic_id, dificuldade, instituicao, ano, enunciado, alternativas, gabarito, resolucao, tempo_medio_seg)
select id, 'facil', 'Questly', 2026,
  'Calcule o limite $\lim_{x \to 2} (x^2 + 3x - 1)$.',
  '{
    "a": "$7$",
    "b": "$9$",
    "c": "$11$",
    "d": "$13$"
  }'::jsonb,
  'b',
  'Como a função é contínua em $x=2$, basta substituir: $2^2 + 3(2) - 1 = 4 + 6 - 1 = 9$.',
  60
from topicos where nome = 'Limites e Derivadas' limit 1;

insert into questions (topic_id, dificuldade, instituicao, ano, enunciado, alternativas, gabarito, resolucao, tempo_medio_seg)
select id, 'medio', 'Questly', 2026,
  'Se $f(x) = x^3 - 4x$, qual é o valor de $f''(2)$?',
  '{
    "a": "$4$",
    "b": "$6$",
    "c": "$8$",
    "d": "$12$"
  }'::jsonb,
  'c',
  'A derivada é $f''(x) = 3x^2 - 4$. Substituindo $x=2$: $3(4) - 4 = 8$.',
  90
from topicos where nome = 'Limites e Derivadas' limit 1;

insert into questions (topic_id, dificuldade, instituicao, ano, enunciado, alternativas, gabarito, resolucao, tempo_medio_seg)
select id, 'facil', 'Questly', 2026,
  'Calcule a integral $\int_0^1 2x \, dx$.',
  '{
    "a": "$0$",
    "b": "$1$",
    "c": "$2$",
    "d": "$\\frac{1}{2}$"
  }'::jsonb,
  'b',
  'A antiderivada de $2x$ é $x^2$. Avaliando de $0$ a $1$: $1^2 - 0^2 = 1$.',
  75
from topicos where nome = 'Integrais' limit 1;

insert into questions (topic_id, dificuldade, instituicao, ano, enunciado, alternativas, gabarito, resolucao, tempo_medio_seg)
select id, 'dificil', 'Questly', 2026,
  'Qual o valor de $\int x e^x \, dx$?',
  '{
    "a": "$e^x + C$",
    "b": "$x e^x + C$",
    "c": "$(x-1)e^x + C$",
    "d": "$x^2 e^x + C$"
  }'::jsonb,
  'c',
  'Por integração por partes com $u=x$, $dv=e^x dx$: $\int x e^x dx = x e^x - \int e^x dx = x e^x - e^x + C = (x-1)e^x + C$.',
  150
from topicos where nome = 'Integrais' limit 1;
