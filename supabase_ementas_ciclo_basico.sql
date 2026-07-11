-- ============================================================
-- QUESTLY — ementas do ciclo básico de engenharia + trilha de
-- conteúdo (ordem curricular) + pular/recap de tópicos.
-- Rode no SQL Editor DEPOIS de supabase_conteudo_compartilhado.sql.
-- Idempotente: pode rodar de novo pra atualizar as ementas.
--
-- O que muda:
--  1. topicos.ordem     — posição do tópico na ementa da matéria.
--                         As missões do dia seguem essa ordem (a
--                         "fronteira curricular" no mission-engine).
--                         Tópico sem ordem (importado fora da ementa)
--                         fica pro fim da trilha.
--     topicos.descricao — subtópicos da ementa, texto de apoio na UI.
--  2. aluno_topico_progresso.status — 'pendente' | 'pulado' | 'dominado'.
--     Quem entra no meio do semestre marca o que já sabe: 'pulado'
--     (declarado, sem XP) sai das missões; 'dominado' é provado num
--     recap (missão curta do tópico — essa paga XP normal, afinal o
--     aluno respondeu questões de verdade).
--  3. missions.recap_topico_id — marca a missão como recap de um
--     tópico; ao concluir com >= 70% de acerto, js/questao.js grava
--     status='dominado' no progresso do aluno.
--  4. Renomeia 'Geometria Analítica' -> 'Fundamentos de Cálculo e
--     Geometria' e 'Programação' -> 'Programação I' (nomes das
--     ementas oficiais), em materias e nas disciplinas dos alunos.
--  5. Seed das ementas: Cálculo I/II/III, Física I/II, Álgebra
--     Linear, Química Geral, Programação I e Fundamentos de Cálculo
--     e Geometria. Só cria/atualiza tópicos — NENHUMA questão é
--     criada aqui; tópico sem questão não trava a trilha (o
--     mission-engine pula por cima), então ementas de universidades
--     diferentes convivem: o aluno só recebe missão do que tem
--     questão no banco.
-- ============================================================

-- 1) COLUNAS NOVAS ------------------------------------------------
alter table topicos add column if not exists ordem int;
alter table topicos add column if not exists descricao text;

alter table aluno_topico_progresso add column if not exists status text not null default 'pendente';
do $$ begin
  alter table aluno_topico_progresso
    add constraint aluno_topico_progresso_status_chk
    check (status in ('pendente', 'pulado', 'dominado'));
exception when duplicate_object then null; end $$;

alter table missions add column if not exists recap_topico_id uuid references topicos(id) on delete set null;

-- 2) UNICIDADE DE TÓPICO POR MATÉRIA ------------------------------
-- O seed abaixo usa upsert por (materia_id, nome). Antes de criar o
-- índice único, funde eventuais tópicos duplicados (mesmo nome na
-- mesma matéria): as questões migram pro mais antigo, o progresso do
-- aluno no duplicado some em cascata junto com ele.
with dups as (
  select id, first_value(id) over (partition by materia_id, lower(nome) order by id) as keep_id
  from topicos
)
update questions q set topic_id = d.keep_id
from dups d
where q.topic_id = d.id and d.id <> d.keep_id;

with dups as (
  select id, first_value(id) over (partition by materia_id, lower(nome) order by id) as keep_id
  from topicos
)
delete from topicos t
using dups d
where t.id = d.id and d.id <> d.keep_id;

create unique index if not exists ux_topicos_materia_lnome on topicos (materia_id, lower(nome));

-- 3) RENOMES ------------------------------------------------------
update materias set nome = 'Fundamentos de Cálculo e Geometria'
where nome = 'Geometria Analítica'
  and not exists (select 1 from materias where nome = 'Fundamentos de Cálculo e Geometria');
update subjects set nome = 'Fundamentos de Cálculo e Geometria' where nome = 'Geometria Analítica';

update materias set nome = 'Programação I'
where nome = 'Programação'
  and not exists (select 1 from materias where nome = 'Programação I');
update subjects set nome = 'Programação I' where nome = 'Programação';

-- se o nome novo e o antigo coexistiam como materias, religa as
-- disciplinas dos alunos à materia com o nome novo (a canônica)
update subjects s set materia_id = m.id
from materias m
where m.nome in ('Fundamentos de Cálculo e Geometria', 'Programação I')
  and s.nome = m.nome
  and s.materia_id is distinct from m.id;

-- 4) LIMPEZA DO SEED DE DEMONSTRAÇÃO ------------------------------
-- supabase_seed_questoes.sql criava 'Limites e Derivadas' e
-- 'Integrais' dentro de Cálculo II só pra testar o fluxo — isso é
-- conteúdo de Cálculo I e não bate com a ementa real. Remove esses
-- tópicos SÓ se todas as questões deles forem as de demonstração
-- (instituicao = 'Questly'); questões reais importadas preservam tudo.
delete from topicos t
using materias m
where t.materia_id = m.id
  and m.nome = 'Cálculo II'
  and lower(t.nome) in ('limites e derivadas', 'integrais')
  and not exists (
    select 1 from questions q
    where q.topic_id = t.id and coalesce(q.instituicao, '') <> 'Questly'
  );

-- 5) MATÉRIAS DO CICLO BÁSICO -------------------------------------
insert into materias (nome) values
  ('Cálculo I'),
  ('Cálculo II'),
  ('Cálculo III'),
  ('Física I'),
  ('Física II'),
  ('Álgebra Linear'),
  ('Química Geral'),
  ('Programação I'),
  ('Fundamentos de Cálculo e Geometria')
on conflict (nome) do nothing;

-- 6) EMENTAS ------------------------------------------------------
-- Upsert: rodar de novo só atualiza ordem/descricao, sem duplicar nem
-- desligar questões já importadas (o nome existente é preservado).

-- CÁLCULO I --------------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1,  'Limites',                          'Definição de limite, teoremas sobre limites, limites unilaterais, limites no infinito, assíntotas horizontais e verticais'),
  (2,  'Continuidade',                     'Definição e teoremas de continuidade, soma, diferença, produto, quociente, composta e o Teorema do Valor Intermediário'),
  (3,  'A Derivada',                       'Reta tangente ao gráfico, definição de derivada, relação entre diferenciabilidade e continuidade'),
  (4,  'Cálculo das Derivadas',            'Regras de derivação, funções trigonométricas, regra da cadeia, derivação implícita, potência com expoente racional, derivadas de ordem superior'),
  (5,  'Aplicações da Derivada',           'Taxas relacionadas, máximos e mínimos, Rolle e Teorema do Valor Médio, regra de L''Hospital, testes da 1ª e 2ª derivadas, concavidade, esboço de gráficos'),
  (6,  'Integral Definida',                'Definição de integral definida'),
  (7,  'Integral Indefinida',              'Propriedades da integral, integração por substituição, teorema do valor médio para integrais, Teorema Fundamental do Cálculo'),
  (8,  'Aplicações da Integral Definida',  'Áreas, volume de sólido de revolução, comprimento de arco'),
  (9,  'Função Inversa',                   'Teorema da função inversa, inversas das trigonométricas e suas derivadas, funções logarítmica e exponencial, potência com expoente real'),
  (10, 'Técnicas de Integração',           'Integração por partes, substituição simples, substituições trigonométricas, frações parciais'),
  (11, 'Integral Imprópria',               'Integrais impróprias')
) as t(ordem, nome, descricao)
where m.nome = 'Cálculo I'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- CÁLCULO II -------------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1, 'Equações Diferenciais de Primeira Ordem', 'Equações separáveis, lineares homogêneas e não homogêneas, modelos matemáticos'),
  (2, 'Equações Diferenciais de Segunda Ordem',  'EDOs lineares com coeficientes constantes, homogêneas e não homogêneas, método dos coeficientes a determinar, modelos matemáticos'),
  (3, 'Funções Vetoriais e Curvas',              'Equações paramétricas (reta, parábola, elipse, hipérbole, circunferência), vetor velocidade e aceleração, comprimento de arco'),
  (4, 'Superfícies',                             'Vetores no espaço tridimensional, retas e planos, cilindros e superfícies de revolução, superfícies quádricas'),
  (5, 'Funções de Duas e Três Variáveis',        'Domínio, imagem, curvas e superfícies de nível, limites, continuidade, derivadas parciais, regra da cadeia, gradiente, derivadas direcionais, plano tangente e reta normal'),
  (6, 'Máximos e Mínimos',                       'Pontos críticos, teste da segunda derivada, máximos e mínimos em regiões fechadas, multiplicadores de Lagrange')
) as t(ordem, nome, descricao)
where m.nome = 'Cálculo II'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- CÁLCULO III ------------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1, 'Integrais Duplas',        'Definição, aplicações, jacobiano e mudança de variáveis em integrais duplas'),
  (2, 'Integrais Triplas',       'Definição, aplicações, jacobiano em dimensão 3, coordenadas cilíndricas e esféricas'),
  (3, 'Integral de Linha',       'Integral de linha no plano e no espaço, campo escalar e vetorial, Teorema de Green, independência de caminho e campos conservativos'),
  (4, 'Integrais de Superfície', 'Parametrização e área de superfícies, integral de superfície escalar e vetorial, orientação'),
  (5, 'Teorema de Stokes',       'Teorema de Stokes e campos conservativos'),
  (6, 'Teorema de Gauss',        'Teorema de Gauss (divergência)')
) as t(ordem, nome, descricao)
where m.nome = 'Cálculo III'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- FÍSICA I ---------------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1,  'Conceitos de Movimento',               'Posição, velocidade e aceleração linear, movimento em uma dimensão, unidades e algarismos significativos'),
  (2,  'Cinemática em Uma Dimensão',           'Movimento uniforme, velocidade instantânea, aceleração constante, queda livre, plano inclinado'),
  (3,  'Vetores e Sistemas de Coordenadas',    'Vetores e suas propriedades, sistemas de coordenadas, componentes vetoriais, álgebra vetorial'),
  (4,  'Cinemática em Duas Dimensões',         'Movimento de projéteis, movimento relativo, movimento circular uniforme e não-uniforme, aceleração angular'),
  (5,  'Força e Movimento',                    'Forças, primeira e segunda leis de Newton, dinâmica de corpo livre'),
  (6,  'Dinâmica do Movimento Retilíneo',      'Equilíbrio, aplicações da segunda lei, massa, peso e gravidade, atrito, força de arraste'),
  (7,  'A Terceira Lei de Newton',             'Objetos em interação, cordas e polias, aplicações da terceira lei'),
  (8,  'Dinâmica do Movimento no Plano',       'Dinâmica em duas dimensões, movimento circular uniforme, órbitas circulares, forças fictícias'),
  (9,  'Impulso e Momento Linear',             'Momento e impulso, conservação do momento, centro de massa, colisões inelásticas, explosões, momento em duas dimensões'),
  (10, 'Energia',                              'Energia cinética e potencial gravitacional, Lei de Hooke, energia potencial elástica, colisões elásticas, diagramas de energia'),
  (11, 'Trabalho',                             'Trabalho e energia cinética, força variável, energia potencial, conservação de energia, potência'),
  (12, 'Rotação de Corpo Rígido',              'Momento de inércia, torque, dinâmica de rotação, equilíbrio estático, rolamento, momento angular'),
  (13, 'Gravitação',                           'Lei de Newton da gravitação, aceleração da gravidade, energia potencial gravitacional, órbitas e energias'),
  (14, 'Oscilações',                           'Movimento harmônico simples, energia no MHS, oscilações verticais, pêndulo, oscilações amortecidas e forçadas, ressonância')
) as t(ordem, nome, descricao)
where m.nome = 'Física I'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- FÍSICA II --------------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1,  'A Lei de Coulomb',                      'Cargas elétricas, condutores e isolantes, processos de eletrização, força eletrostática, princípio de superposição'),
  (2,  'O Campo Elétrico',                      'Campos de múltiplas cargas puntiformes, dipolos, distribuições contínuas de carga, movimento de partículas carregadas'),
  (3,  'A Lei de Gauss',                        'Fluxo de campo vetorial, Lei de Gauss, simetrias cilíndrica, planar e esférica, condutores em equilíbrio eletrostático'),
  (4,  'Potencial Elétrico',                    'Energia potencial elétrica, potencial de cargas puntiformes e distribuições contínuas, superfícies equipotenciais, relação entre potencial e campo'),
  (5,  'Capacitores e Capacitância',            'Capacitor de placas paralelas, associações em série e paralelo, energia armazenada, dielétricos'),
  (6,  'Corrente e Resistência Elétricas',      'Corrente e densidade de corrente, condutividade e resistividade, Lei de Ohm'),
  (7,  'Circuitos de Corrente Contínua',        'Elementos e diagramas, energia, potência e fem, Leis de Kirchhoff, associação de resistores, circuitos com mais de uma malha, circuito RC'),
  (8,  'O Campo Magnético',                     'Lei de Biot-Savart, Lei de Ampère, dipolos magnéticos, movimento de cargas em campo magnético, força em fios, torque em espiras'),
  (9,  'Indução Eletromagnética',               'Leis de Faraday e de Lenz, campos elétricos induzidos, indutores e indutância, energia no indutor, circuito LR'),
  (10, 'Oscilações Eletromagnéticas e CA',      'Circuitos LC e RLC, fasores, oscilações forçadas, energia e potência em corrente alternada')
) as t(ordem, nome, descricao)
where m.nome = 'Física II'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- ÁLGEBRA LINEAR ---------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1, 'Sistemas Lineares, Matrizes e Determinantes', 'Resolução por Gauss-Jordan, operações com matrizes, inversão, transposta e simétricas, determinantes e propriedades'),
  (2, 'Espaços Vetoriais',                           'Subespaços, combinações lineares, subespaço gerado, dependência e independência linear, bases, dimensão, coordenadas e mudança de base'),
  (3, 'Transformações Lineares',                     'Definição e exemplos, núcleo, imagem, teorema da dimensão, matriz de uma transformação, transformações planas e no espaço'),
  (4, 'Operadores Lineares',                         'Operadores invertíveis, matrizes semelhantes, autovalores e autovetores, autoespaços, diagonalização de operadores'),
  (5, 'Diagonalização de Matrizes Simétricas',       'Produto interno, complemento ortogonal, bases ortonormais, Gram-Schmidt, operadores ortogonais e simétricos')
) as t(ordem, nome, descricao)
where m.nome = 'Álgebra Linear'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- QUÍMICA GERAL ----------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1, 'Estrutura Atômica e Tabela Periódica',    'Radiação eletromagnética, modelo de Bohr, dualidade partícula-onda, modelo quântico, configurações eletrônicas, tendências periódicas'),
  (2, 'Ligações Químicas',                       'Ligação iônica (Born-Haber), covalente (eletronegatividade, hibridização, estrutura molecular), metálica (teoria de bandas), forças intermoleculares e propriedades físicas'),
  (3, 'Termodinâmica, Cinética e Equilíbrio',    'Variação de entalpia, fatores que afetam a velocidade de reações, quociente e constante de equilíbrio, princípio de Le Chatelier, oxirredução, células galvânicas e eletrólise'),
  (4, 'Funções Inorgânicas e Reações Químicas',  'Aplicações dos elementos e seus compostos no contexto das engenharias, energias alternativas e novos materiais')
) as t(ordem, nome, descricao)
where m.nome = 'Química Geral'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- PROGRAMAÇÃO I ----------------------------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1, 'Algoritmos e Lógica de Programação',  'Método de Pólya, algoritmo, pseudocódigo e fluxograma, diferença entre algoritmo e programa'),
  (2, 'Ambiente de Desenvolvimento',         'Introdução ao ambiente de desenvolvimento da linguagem adotada'),
  (3, 'Tipos de Dados',                      'Tipos primitivos, conversão de tipos, constantes'),
  (4, 'Operadores',                          'Atribuição simples e múltipla, aritméticos, relacionais, lógicos, precedência'),
  (5, 'Tipos Agregados',                     'Agregados homogêneos (vetores e matrizes) e heterogêneos'),
  (6, 'Estruturas de Controle',              'Estruturas de seleção e repetição, entrada e saída padrão, formatação de strings'),
  (7, 'Subprogramação e Escopo',             'Módulos, definição de funções, passagem de parâmetros, retorno, escopo de variáveis')
) as t(ordem, nome, descricao)
where m.nome = 'Programação I'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- FUNDAMENTOS DE CÁLCULO E GEOMETRIA --------------------------------
insert into topicos (materia_id, nome, ordem, descricao)
select m.id, t.nome, t.ordem, t.descricao
from materias m
cross join (values
  (1, 'Funções em R',                        'Domínio, contradomínio e pré-imagem, inequações e módulo, funções básicas, polinômios e fatoração, trigonométricas, exponencial e logarítmica, composição, gráficos no GeoGebra'),
  (2, 'Função Inversa',                      'Funções injetoras e bijetoras, inversa, relação entre logarítmica e exponencial, funções hiperbólicas e trigonométricas inversas'),
  (3, 'Classes de Funções e seus Gráficos',  'Função par e ímpar, crescente e decrescente, limitada, translações e homotetias'),
  (4, 'Vetores e Retas no Plano',            'Coordenadas cartesianas, distância e circunferência, vetores no plano, produto escalar, projeções e área, equação da reta, paralelismo, perpendicularismo, ângulos e distâncias'),
  (5, 'Vetores no Espaço e Geometria Sólida','Distância e esfera, vetores no espaço, produto escalar, produto vetorial e volume, equações da reta e do plano, ângulos e distâncias entre retas e planos')
) as t(ordem, nome, descricao)
where m.nome = 'Fundamentos de Cálculo e Geometria'
on conflict (materia_id, lower(nome)) do update set ordem = excluded.ordem, descricao = excluded.descricao;

-- 7) POLICY: o app atualiza status do próprio progresso — já coberto
-- pela policy "usuario gerencia o proprio progresso" (for all).
-- Nada a fazer aqui; deixado como registro.
