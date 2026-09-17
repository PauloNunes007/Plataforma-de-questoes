"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, Lock } from "lucide-react";
import type { MateriaAcademica } from "@/lib/academico/academico-data";
import { alertasDaVidaAcademica } from "@/lib/academico/academico-data";
import { FaltasCard } from "./faltas-card";
import { NotasCard } from "./notas-card";
import { RelatorioToggle } from "./relatorio-toggle";
import { ProEmblema } from "@/components/plano/pro-ui";

// "Minhas matérias" — o semestre do aluno FORA das questões.
//
// Esta tela existe porque as duas contas que mais decidem a vida acadêmica dele
// não tinham nada a ver com o banco de questões: quantas faltas ainda cabem e
// quanto ele precisa tirar na próxima. Ele fazia as duas no caderno, no grupo
// da turma, ou não fazia — e descobria em novembro.
//
// Uma disciplina = um cartão com DUAS colunas (faltas | notas), lado a lado no
// desktop e empilhadas no celular. Ficam juntas de propósito: são as duas
// metades da mesma pergunta ("eu passo nessa matéria?"), e separá-las em duas
// telas obrigaria o aluno a montar a resposta de cabeça.
//
// PLANO GRÁTIS: a tela aparece inteira, com os dados que existirem, e só a
// EDIÇÃO é travada (`editavel={false}`). Esconder a tela venderia menos e, pior,
// faria quem já foi Pro achar que perdeu o que digitou.
export function MateriasView({
  materias,
  ehPro,
  relatorioSemanal,
}: {
  materias: MateriaAcademica[];
  ehPro: boolean;
  relatorioSemanal: boolean;
}) {
  const router = useRouter();
  const alertas = alertasDaVidaAcademica(materias);

  function recarregar() {
    // O cálculo é todo derivado das linhas do banco (nenhum contador
    // denormalizado), então revalidar o server component é a forma mais barata
    // e menos enganosa de atualizar — não existe estado local pra divergir.
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {!ehPro && <ConvitePro />}

      {alertas.length > 0 && <FaixaAlertas alertas={alertas} />}

      {materias.length === 0 ? (
        <VazioSemDisciplinas />
      ) : (
        <div className="flex flex-col gap-4">
          {materias.map((m) => (
            <section key={m.subjectId} className="surface overflow-hidden">
              <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <h2 className="font-heading text-[15px] font-semibold tracking-tight">{m.nome}</h2>
                <ResumoChip materia={m} />
              </header>

              <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:gap-8">
                <FaltasCard materia={m} editavel={ehPro} onMudou={recarregar} />
                <div className="border-t border-border pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  <NotasCard materia={m} editavel={ehPro} onMudou={recarregar} />
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {ehPro && <RelatorioToggle inicial={relatorioSemanal} />}
    </div>
  );
}

/** Chip de uma palavra no cabeçalho: o veredito do cartão sem abrir o cartão. */
function ResumoChip({ materia }: { materia: MateriaAcademica }) {
  const risco =
    materia.frequencia.nivel === "reprovado" ||
    materia.frequencia.nivel === "limite" ||
    materia.notas.situacao === "impossivel" ||
    materia.notas.situacao === "reprovado";
  const atencao = materia.frequencia.nivel === "atencao" || materia.notas.situacao === "dificil";

  if (risco) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-questly-red/12 px-2 py-[3px] text-[10.5px] font-semibold text-questly-red-dark">
        <AlertTriangle size={11} strokeWidth={2.3} />
        Em risco
      </span>
    );
  }
  if (atencao) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-questly-orange/12 px-2 py-[3px] text-[10.5px] font-semibold text-questly-orange-dark">
        <AlertTriangle size={11} strokeWidth={2.3} />
        Atenção
      </span>
    );
  }
  if (materia.frequencia.nivel === "sem_dados" && materia.notas.situacao === "sem_dados") {
    return <span className="shrink-0 text-[11px] text-muted-foreground">Sem dados ainda</span>;
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-questly-green/12 px-2 py-[3px] text-[10.5px] font-semibold text-questly-green-dark">
      <CheckCircle2 size={11} strokeWidth={2.3} />
      Tranquilo
    </span>
  );
}

function FaixaAlertas({ alertas }: { alertas: ReturnType<typeof alertasDaVidaAcademica> }) {
  return (
    <div className="rounded-2xl border border-questly-orange/30 bg-questly-orange/[0.07] px-5 py-4">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-questly-orange-dark">
        <AlertTriangle size={14} strokeWidth={2.2} />
        {alertas.length === 1 ? "1 ponto de atenção" : `${alertas.length} pontos de atenção`}
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {alertas.map((a, i) => (
          <li key={i} className="text-[12.5px] leading-relaxed">
            <b className="font-semibold">{a.disciplina}:</b>{" "}
            <span className="text-muted-foreground">{a.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConvitePro() {
  return (
    <div className="surface-gold flex flex-col items-start gap-3 rounded-2xl p-5 sm:flex-row sm:items-center">
      <ProEmblema size={38} />
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[15px] font-semibold tracking-tight">
          Faltas e notas fazem parte do Pro
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          Você pode ver o que já registrou, mas pra lançar falta, cadastrar avaliação e projetar a nota que
          falta é preciso assinar.
        </p>
      </div>
      <Link
        href="/pro"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-questly-gold/35 bg-questly-gold/10 px-4 text-[13px] font-semibold text-questly-gold transition-colors hover:bg-questly-gold/20"
      >
        <Lock size={13} strokeWidth={2.1} />
        Conhecer o Pro
        <ArrowRight size={13} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

function VazioSemDisciplinas() {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <BookOpen size={18} strokeWidth={1.75} className="text-muted-foreground" />
      </span>
      <p className="mb-1 text-[15px] font-medium">Você ainda não tem disciplinas</p>
      <p className="mb-5 max-w-[380px] text-sm text-muted-foreground">
        Cadastre as matérias do semestre em Configurações — é a mesma lista que o resto do app usa.
      </p>
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
      >
        Cadastrar disciplinas
        <ArrowRight size={14} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
