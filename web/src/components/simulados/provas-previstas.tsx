"use client";

// A PROVA QUE AINDA NÃO ACONTECEU.
//
// A tela é, antes de tudo, um ESPELHO DA BANCA: ela mostra a composição medida
// das edições anteriores daquele slot ("A Lei de Gauss caiu em 7 de 7 P1, com
// 6 questões em média") e só depois oferece o botão. A ordem importa — o valor
// aqui é o aluno ENTENDER como a prova dele é feita; montar o simulado é a
// consequência, não o produto.
//
// Nada nesta tela recomenda o que estudar. Ela descreve a prova, não o aluno.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Play, Target } from "lucide-react";

import type { ProvaPrevista } from "@/lib/banca/banca-data";
import { montarSimuladoPrevistoAction } from "@/lib/banca/actions";

const ERROS: Record<string, string> = {
  limite: "Você já usou seu simulado grátis desta semana. No Pro são ilimitados.",
  sem_perfil: "Ainda não há provas antigas suficientes pra descrever essa prova.",
  sem_questoes: "O banco ainda não tem questões suficientes desses tópicos.",
  invalido: "Não foi possível montar essa prova agora.",
};

const ROTULO_CONFIANCA: Record<ProvaPrevista["confianca"], string> = {
  alta: "Padrão estável",
  media: "Padrão com variação",
  baixa: "Amostra pequena",
};

/** O texto que impede a previsão de ser lida como adivinhação. */
function comoLer(p: ProvaPrevista): string {
  const base = `Medido nas ${p.totalEdicoes} edições de ${p.periodoDe} a ${p.periodoAte}`;
  if (p.confianca === "alta") return `${base}. A composição repete com pouca variação.`;
  if (p.confianca === "media")
    return `${base}. A composição varia de um semestre pro outro — trate como tendência.`;
  return `${base}. É pouca prova pra afirmar um padrão; leia como indício.`;
}

export function ProvasPrevistas({ provas }: { provas: ProvaPrevista[] }) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [montando, setMontando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function montar(p: ProvaPrevista) {
    if (pendente) return;
    setErro(null);
    setMontando(`${p.materiaId}-${p.slot}`);
    iniciarTransicao(async () => {
      const r = await montarSimuladoPrevistoAction({ materiaId: p.materiaId, slot: p.slot });
      if (r.ok) router.push(`/simulados/${r.id}`);
      else {
        setErro(ERROS[r.erro] ?? ERROS.invalido);
        setMontando(null);
      }
    });
  }

  if (provas.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-2.5 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Target size={19} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <p className="text-[14px] font-semibold">Ainda não dá pra prever nenhuma prova sua</p>
        <p className="max-w-[46ch] text-[12.5px] leading-relaxed text-muted-foreground">
          A previsão precisa de pelo menos três edições da mesma prova no acervo. Nenhuma das suas
          disciplinas tem isso hoje — quando tiver, ela aparece aqui sozinha.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
          <AlertTriangle size={15} strokeWidth={1.9} />
          {erro}
        </p>
      )}

      {provas.map((p) => {
        const chave = `${p.materiaId}-${p.slot}`;
        const ocupado = montando === chave;
        return (
          <article key={chave} className="surface flex flex-col gap-3.5 p-4 sm:p-5">
            <header className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h2 className="text-[15.5px] font-semibold">
                {p.materiaNome} · {p.slot}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                {p.sigla}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                {ROTULO_CONFIANCA[p.confianca]}
              </span>
            </header>

            <p className="text-[12.5px] leading-relaxed text-muted-foreground">{comoLer(p)}</p>

            <div className="flex flex-col gap-1.5">
              <p className="text-[12px] font-semibold">
                A prova deve ter {p.tamanhoPrevisto} questões:
              </p>
              <ul className="flex flex-col gap-1">
                {p.linhas.map((l) => (
                  <li
                    key={l.topico}
                    className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1 text-[12.5px] last:border-0"
                  >
                    <span className="min-w-0 flex-1 truncate">{l.topico}</span>
                    <span className="tnum shrink-0 font-semibold">
                      {l.previstas} {l.previstas === 1 ? "questão" : "questões"}
                    </span>
                    <span className="tnum shrink-0 text-[11.5px] text-muted-foreground">
                      caiu em {l.edicoes} de {l.totalEdicoes}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {p.nuncaCaem.length > 0 && (
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                <strong className="font-semibold">Nunca caiu nesta prova:</strong>{" "}
                {p.nuncaCaem.join(" · ")}
              </p>
            )}

            <button
              type="button"
              onClick={() => montar(p)}
              disabled={pendente}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-60"
            >
              {ocupado ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Play size={15} strokeWidth={2} />
              )}
              {ocupado ? "Montando…" : "Montar esta prova"}
            </button>
          </article>
        );
      })}

      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        As questões são reais, do banco — a previsão decide a <strong>composição</strong> da prova,
        não inventa conteúdo. Simulado não paga XP nem entra no ranking.
      </p>
    </div>
  );
}
