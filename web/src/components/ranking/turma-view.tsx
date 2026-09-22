"use client";

import { GraduationCap, Users } from "lucide-react";
import { RankAvatar } from "@/components/ranking/avatar";
import { PRO_ARO, ProMarcaLinha } from "@/components/ranking/pro-visual";
import { TURMA_MINIMA, type RankingTurma } from "@/lib/ranking/turma-data";

// "Minha turma": o ranking dos colegas da mesma universidade na mesma
// disciplina — os que vão sentar na MESMA prova.
//
// O ranking global compara o aluno de Cálculo II da UFF com gente de outra
// universidade e outra ementa; é uma régua honesta, só que distante. Esta é a
// comparação que ele já faz de cabeça no grupo do WhatsApp.
//
// Ordena por XP (esforço), como todo ranking do app. Acertabilidade é dado
// privado desde 2026-09-22 e não aparece aqui — nem como "média da turma".

export function TurmaView({
  turma,
  carregando,
  onTrocarMateria,
  onAbrirCard,
}: {
  turma: RankingTurma;
  carregando: boolean;
  onTrocarMateria: (materiaId: string) => void;
  onAbrirCard: (id: string) => void;
}) {
  // Sem universidade no perfil não há recorte possível — e o conserto é uma
  // tela só, então o vazio aponta pra ela em vez de só lamentar.
  if (!turma.universidade) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-[15px] font-medium">Sua turma depende da universidade</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Adicione a sua em Configurações e você passa a ver como está indo em
          relação a quem faz as mesmas provas que você.
        </p>
      </div>
    );
  }

  if (turma.disciplinas.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-[15px] font-medium">Cadastre uma disciplina</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A turma é formada por quem cursa a mesma matéria que você.
        </p>
      </div>
    );
  }

  return (
    <div className="surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-questly-blue/12 text-questly-blue-dark">
          <GraduationCap size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[17px] font-semibold tracking-tight">Minha turma</h2>
          <p className="truncate text-[12.5px] text-muted-foreground">
            {turma.universidade}
            {turma.materiaNome ? ` · ${turma.materiaNome}` : ""}
          </p>
        </div>
      </div>

      {/* Seletor de disciplina: uma turma por matéria, porque é a matéria que
          define quem faz a mesma prova. Só aparece com mais de uma. */}
      {turma.disciplinas.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {turma.disciplinas.map((d) => (
            <button
              key={d.materiaId}
              type="button"
              disabled={carregando}
              onClick={() => onTrocarMateria(d.materiaId)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors disabled:opacity-60 ${
                d.materiaId === turma.materiaSelecionada
                  ? "bg-questly-blue text-white dark:text-[#0b0f1a]"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {d.nome}
            </button>
          ))}
        </div>
      )}

      {turma.poucaGente ? (
        // Um ranking de duas pessoas não é competição, é constrangimento —
        // então a tela conta a verdade em vez de desenhar um pódio de dois.
        <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center">
          <Users size={20} strokeWidth={1.8} className="mx-auto text-muted-foreground" />
          <p className="mt-2 text-[14px] font-medium">Sua turma ainda está pequena</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            {turma.total === 1
              ? "Você é o primeiro da sua universidade nessa disciplina por aqui."
              : `Vocês são ${turma.total}. A partir de ${TURMA_MINIMA} colegas o ranking da turma aparece.`}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-[12.5px] text-muted-foreground">
            {turma.total} {turma.total === 1 ? "colega" : "colegas"} nesta
            disciplina · por XP da semana
          </p>

          <ul className={`mt-3 flex flex-col gap-1.5 ${carregando ? "opacity-60" : ""}`}>
            {turma.linhas.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onAbrirCard(l.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                    l.ehVoce
                      ? "border-questly-blue/45 bg-questly-blue/5"
                      : "border-transparent"
                  }`}
                >
                  <span className="tnum w-7 shrink-0 text-center text-[13px] font-semibold text-muted-foreground">
                    {l.posicao}
                  </span>
                  <RankAvatar
                    nome={l.nome}
                    fotoUrl={l.fotoUrl}
                    size={34}
                    className={l.pro ? PRO_ARO : ""}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-medium">
                        {l.username ? `@${l.username}` : l.nome}
                      </span>
                      {l.pro && <ProMarcaLinha />}
                    </span>
                    <span className="tnum block text-[11.5px] text-muted-foreground">
                      {l.questoesSemana}{" "}
                      {l.questoesSemana === 1 ? "questão" : "questões"} esta semana
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[13px] font-semibold">
                    {l.xpSemana.toLocaleString("pt-BR")} XP
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Fora do Top 100, a própria linha é justamente a que mais importa. */}
          {turma.voce && !turma.linhas.some((l) => l.ehVoce) && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center gap-3 rounded-xl border border-questly-blue/45 bg-questly-blue/5 px-3 py-2.5">
                <span className="tnum w-7 shrink-0 text-center text-[13px] font-semibold text-muted-foreground">
                  {turma.voce.posicao}
                </span>
                <RankAvatar nome={turma.voce.nome} fotoUrl={turma.voce.fotoUrl} size={34} />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">Você</span>
                <span className="tnum shrink-0 text-[13px] font-semibold">
                  {turma.voce.xpSemana.toLocaleString("pt-BR")} XP
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
