-- ============================================================
-- QUESTLY — corrige disciplinas criadas em Configurações antes do
-- fix (que ainda não tinham materia_id linkado).
-- ============================================================

insert into materias (nome) values ('Cálculo I')
on conflict (nome) do nothing;

update subjects set materia_id = (select id from materias where nome = 'Cálculo I')
where nome = 'Cálculo I' and materia_id is null;
