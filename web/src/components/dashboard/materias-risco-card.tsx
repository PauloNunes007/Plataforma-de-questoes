import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarX2, CheckCircle2, Lock } from "lucide-react";
import type { ResumoRiscoAcademico } from "@/lib/academico/academico-data";

// O cartão de "Minhas matérias" na home.
//
// Existe por dois motivos, e o segundo é o mais importante:
//
//  1. no celular, /materias não cabe na barra inferior (5 abas fixas) — este
//     cartão é a porta de entrada em tela estreita;
//  2. um aviso de falta só vale se chegar ANTES da aula. Uma tela que o aluno
//     precisa lembrar de abrir não avisa nada; a home ele abre sozinho.
//
// Server component: o dado já vem calculado do servidor e nada aqui é
// interativo além do link.
export function MateriasRiscoCard({
  resumo,
  ehPro,
}: {
  resumo: ResumoRiscoAcademico;
  ehPro: boolean;
}) {
  // Aluno grátis sem nenhum dado: o cartão vira convite, não relatório vazio.
  if (!ehPro && resumo.materias === 0) return null;

  const temRisco = resumo.alertas.length > 0;

  return (
    <Link
      href="/materias"
      className={`surface-interativa group flex flex-col p-4 ${
        temRisco ? "border-questly-orange/35" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            temRisco
              ? "bg-questly-orange/12 text-questly-orange-dark"
              : "bg-questly-green/12 text-questly-green-dark"
          }`}
        >
          {temRisco ? (
            <AlertTriangle size={14} strokeWidth={2.2} />
          ) : (
            <CalendarX2 size={14} strokeWidth={2} />
          )}
        </span>
        <h3 className="text-[13.5px] font-semibold tracking-tight">Minhas matérias</h3>
        {!ehPro && <Lock size={12} strokeWidth={2} className="ml-auto text-questly-gold" />}
      </div>

      {!ehPro ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Controle de faltas e calculadora de notas — saiba quantas faltas ainda cabem e quanto precisa
          tirar pra passar.
        </p>
      ) : temRisco ? (
        <>
          <p className="mt-2 text-[12.5px] font-medium text-questly-orange-dark">
            {resumo.alertas.length === 1
              ? "1 disciplina pedindo atenção"
              : `${resumo.alertas.length} disciplinas pedindo atenção`}
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {resumo.alertas.slice(0, 2).map((a, i) => (
              <li key={i} className="text-[11.5px] leading-snug text-muted-foreground">
                <b className="font-semibold text-foreground">{a.disciplina}:</b> {a.texto}
              </li>
            ))}
          </ul>
        </>
      ) : resumo.comLimite === 0 ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Diga quantas faltas cada disciplina permite e o app avisa antes de você passar do limite.
        </p>
      ) : (
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-questly-green-dark">
          <CheckCircle2 size={13} strokeWidth={2.2} />
          {resumo.faltasRestantesMin != null
            ? `Sua margem menor: ${resumo.faltasRestantesMin} ${
                resumo.faltasRestantesMin === 1 ? "falta" : "faltas"
              }`
            : "Frequência e notas em dia"}
        </p>
      )}

      <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-questly-green-dark">
        {ehPro ? "Abrir" : "Conhecer"}
        <ArrowRight size={12} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
