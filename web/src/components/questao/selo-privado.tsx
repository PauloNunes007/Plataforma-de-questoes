"use client";

import { Lock } from "lucide-react";

// SELO DE SESSÃO PRIVADA (2026-09-22)
//
// Por que existe: alunos estavam travando de medo de errar "em público". O
// conserto de dado foi tornar a acertabilidade privada (ver
// supabase_ranking_privado.sql e lib/ranking/actions.ts) — mas dado privado
// que o aluno não SABE que é privado não muda comportamento nenhum. Este selo
// é a outra metade do conserto: dizer, nos três momentos em que o medo
// aparece, que a sala é fechada.
//
// Por que NÃO é um "modo treino livre": um modo seguro opcional ensina
// exatamente o contrário do que queremos — se existe uma sala segura, as
// outras são inseguras. A plataforma INTEIRA é a sala segura; o trabalho é
// dizer isso. (A plataforma também acabou de remover um modo — ver "Fim do
// motor de missões" no web/CLAUDE.md — e não é hora de inventar outro.)
//
// Três pontos de exibição, e nenhum a mais: repetir demais vira ansiedade,
// que é justamente o que estamos tratando.
//   • `sobreCor` — cabeçalho colorido da questão (runner)
//   • `linha`    — tela de resultado da lista
//   • `chip`     — montagem da lista no Banco de Questões

export function SeloPrivado({
  variante = "chip",
  texto,
}: {
  variante?: "chip" | "linha" | "sobreCor";
  texto?: string;
}) {
  if (variante === "sobreCor") {
    return (
      <span
        title="Ninguém vê sua taxa de acerto"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm"
      >
        <Lock size={10} strokeWidth={2.4} />
        <span className="max-sm:hidden">Sessão privada</span>
        <span className="sm:hidden">Privado</span>
      </span>
    );
  }

  if (variante === "linha") {
    return (
      <p className="flex items-start justify-center gap-1.5 px-1 text-[12px] leading-snug text-muted-foreground">
        <Lock size={12} strokeWidth={2} className="mt-[2px] shrink-0" />
        <span>{texto}</span>
      </p>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      <Lock size={11} strokeWidth={2.2} className="shrink-0" />
      {texto}
    </span>
  );
}
