"use client";

// O painel da home no MODO LIVRE (ver lib/questly/modo-estudo.ts).
//
// Quem desligou a trajetória guiada não tem missão, nem Boss, nem projeção de
// nota — e a home não pode ficar com um buraco no lugar deles. O que sobra é
// o que essa pessoa veio fazer: montar lista, resolver questão, fazer
// simulado e competir. Este cartão é isso, sem fingir que existe um plano.
//
// O contador no canto é o total de questões resolvidas na vida, não uma meta
// do dia: sem trajetória não existe "quanto falta pra hoje", e inventar um
// alvo diário aqui seria trazer de volta, disfarçada, a cobrança que o aluno
// desligou.

import Link from "next/link";
import { ArrowRight, FileText, Library, Map, Target, Timer } from "lucide-react";
import { useFoco } from "@/components/foco/foco-provider";
import type { HeroDados } from "@/lib/dashboard/hero-data";

const ATALHOS = [
  {
    href: "/questoes/banco",
    icone: Library,
    titulo: "Banco de questões",
    desc: "Escolha disciplina, assunto e dificuldade — a lista sai na hora.",
  },
  {
    href: "/simulados",
    icone: FileText,
    titulo: "Simulados",
    desc: "Prova cronometrada montada com provas antigas e questões autorais.",
  },
  {
    href: "/trilha",
    icone: Map,
    titulo: "Minha trilha",
    desc: "Veja o que você já domina em cada disciplina, assunto por assunto.",
  },
] as const;

export function PraticaLivreCard({ hero }: { hero: HeroDados }) {
  const foco = useFoco();

  return (
    <section className="surface flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[15px] font-semibold tracking-tight">Praticar agora</h2>
          <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
            Sem plano automático: você escolhe o que estudar, quando quiser.
          </p>
        </div>
        <span className="tnum flex shrink-0 items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
          <Target size={13} className="text-questly-green-dark dark:text-questly-green" />
          <span className="font-heading text-[14px] font-bold leading-none">{hero.totalQuestoes}</span>
          <span className="text-[10.5px] font-bold uppercase text-muted-foreground">questões</span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {ATALHOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 py-3 transition-colors hover:border-questly-green/45"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <a.icone size={16} strokeWidth={2} className="text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold">{a.titulo}</span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">{a.desc}</span>
            </span>
            <ArrowRight size={15} strokeWidth={2.2} className="shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={foco.abrirBarra}
        className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground"
      >
        <Timer size={14} strokeWidth={2.1} />
        Sessão de foco
      </button>
    </section>
  );
}
