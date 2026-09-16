"use client";

// Controle manual da missão do dia — **repasse de 2026-09-16**.
//
// O pedido foi explícito: mesmo com o motor montando o plano, o estudante
// precisa poder editar, mover e mandar na própria missão. Então tudo o que o
// motor decidiu ganhou um botão ao lado:
//
//   • Ajustar   → quantas questões hoje (o motor mira o tempo da rotina; aqui
//                 o aluno diz o número) e QUAL assunto (a ementa inteira da
//                 disciplina, não só o que a fronteira curricular liberou).
//   • Trocar    → estudar outra matéria hoje. A de hoje é adiada, não apagada.
//   • Adiar     → "hoje não vai dar", empurra pro próximo dia de estudo.
//
// Nada aqui paga XP nem acende streak: são mudanças de PLANO. A checagem de
// dono e as invariantes (questão respondida nunca sai, missão concluída é
// intocável) vivem no servidor, em lib/missao/actions.ts — isto é só a tela.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Repeat, Settings2 } from "lucide-react";
import { ModalPainel } from "@/components/ui/modal-painel";
import {
  adiarMissaoAction,
  ajustarTamanhoMissaoAction,
  ajustarTopicosMissaoAction,
  carregarTopicosDaMissaoAction,
  trocarDisciplinaDoDiaAction,
} from "@/lib/missao/actions";
import { TAMANHOS_MISSAO, type TopicoOpcao } from "@/lib/missao/tipos";
import type { AlternativaDoDia } from "@/lib/questly/dashboard-data";

const BOTAO =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-questly-green/45 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

const OPCAO =
  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function MissaoControles({
  missaoId,
  qtdAtual,
  alternativas,
}: {
  missaoId: string;
  qtdAtual: number;
  alternativas: AlternativaDoDia[];
}) {
  const router = useRouter();
  const [painel, setPainel] = useState<"ajustar" | "trocar" | null>(null);
  const [topicos, setTopicos] = useState<TopicoOpcao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function fechar() {
    setPainel(null);
    setErro(null);
  }

  /** Toda ação segue o mesmo roteiro: roda no servidor, mostra o erro em
   *  texto (nunca alert) e, no sucesso, recarrega os dados do Server
   *  Component — a missão é reconstruída lá, não remendada aqui. */
  function executar(acao: () => Promise<{ error: string | null }>) {
    setErro(null);
    iniciar(async () => {
      const resultado = await acao();
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      fechar();
      router.refresh();
    });
  }

  async function abrirAjustar() {
    setPainel("ajustar");
    setErro(null);
    if (topicos === null) setTopicos(await carregarTopicosDaMissaoAction(missaoId));
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={abrirAjustar} className={BOTAO}>
          <Settings2 size={14} strokeWidth={2.1} />
          Ajustar
        </button>
        {alternativas.length > 0 && (
          <button type="button" onClick={() => setPainel("trocar")} className={BOTAO}>
            <Repeat size={14} strokeWidth={2.1} />
            Trocar matéria
          </button>
        )}
        <button
          type="button"
          disabled={pendente}
          onClick={() => executar(() => adiarMissaoAction(missaoId))}
          className={BOTAO}
        >
          <CalendarClock size={14} strokeWidth={2.1} />
          Adiar
        </button>
      </div>

      {erro && !painel && <p className="mt-2 text-[12px] font-semibold text-questly-red">{erro}</p>}

      <ModalPainel aberto={painel === "ajustar"} titulo="Ajustar a missão de hoje" onFechar={fechar} largura="max-w-lg">
        <div className="kicker mb-2.5">Quantas questões hoje</div>
        <div className="flex flex-wrap gap-2">
          {TAMANHOS_MISSAO.map((n) => (
            <button
              key={n}
              type="button"
              disabled={pendente}
              onClick={() => executar(() => ajustarTamanhoMissaoAction(missaoId, n))}
              className={`h-10 cursor-pointer rounded-xl border px-4 text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                n === qtdAtual
                  ? "border-questly-green bg-questly-green/10 text-questly-green-dark dark:text-questly-green"
                  : "border-border text-muted-foreground hover:border-questly-green/45 hover:text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
          O que você já respondeu continua valendo — a missão só cresce ou encolhe no que falta.
        </p>

        <div className="kicker mb-2.5 mt-6">Assunto de hoje</div>
        {topicos === null ? (
          <p className="text-[13px] text-muted-foreground">Carregando a ementa…</p>
        ) : topicos.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Essa disciplina ainda não tem tópicos com questões cadastradas.
          </p>
        ) : (
          <div className="flex max-h-[38dvh] flex-col gap-2 overflow-y-auto pr-1">
            {topicos.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={pendente}
                onClick={() => executar(() => ajustarTopicosMissaoAction(missaoId, [t.id]))}
                className={`${OPCAO} ${
                  t.selecionado
                    ? "border-questly-green bg-questly-green/10"
                    : "border-border hover:border-questly-green/45"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{t.nome}</span>
                  <span className="mt-0.5 block text-[11.5px] font-medium text-muted-foreground">
                    {t.questoes} questões
                    {t.status === "dominado" ? " · você já dominou" : t.status === "pulado" ? " · você pulou" : ""}
                  </span>
                </span>
                {t.selecionado && (
                  <Check size={16} strokeWidth={2.4} className="shrink-0 text-questly-green-dark dark:text-questly-green" />
                )}
              </button>
            ))}
          </div>
        )}
        {erro && <p className="mt-3 text-[12px] font-semibold text-questly-red">{erro}</p>}
      </ModalPainel>

      <ModalPainel aberto={painel === "trocar"} titulo="Estudar outra matéria hoje" onFechar={fechar} largura="max-w-lg">
        <p className="mb-4 text-[13px] leading-snug text-muted-foreground">
          A missão de hoje é adiada pro seu próximo dia de estudo — nada do que você já respondeu se perde.
        </p>
        <div className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto pr-1">
          {alternativas.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={pendente}
              onClick={() => executar(() => trocarDisciplinaDoDiaAction(missaoId, a.id))}
              className={`${OPCAO} border-border hover:border-questly-green/45`}
            >
              <span className="min-w-0 truncate">{a.nome}</span>
              {a.naGradeDeHoje && (
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  na grade de hoje
                </span>
              )}
            </button>
          ))}
        </div>
        {erro && <p className="mt-3 text-[12px] font-semibold text-questly-red">{erro}</p>}
      </ModalPainel>
    </>
  );
}

/** Versão sem missão: o dia não tem plano (descanso, grade vazia ou nada
 *  gerado) mas o aluno quer estudar assim mesmo. Só a troca de matéria faz
 *  sentido aqui — não há o que ajustar nem o que adiar. */
export function EscolherDisciplinaDoDia({ alternativas }: { alternativas: AlternativaDoDia[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (alternativas.length === 0) return null;

  function escolher(subjectId: string) {
    setErro(null);
    iniciar(async () => {
      const resultado = await trocarDisciplinaDoDiaAction(null, subjectId);
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className={BOTAO}>
        <Repeat size={14} strokeWidth={2.1} />
        Estudar uma matéria hoje
      </button>

      <ModalPainel aberto={aberto} titulo="Escolher a matéria de hoje" onFechar={() => setAberto(false)} largura="max-w-lg">
        <div className="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto pr-1">
          {alternativas.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={pendente}
              onClick={() => escolher(a.id)}
              className={`${OPCAO} border-border hover:border-questly-green/45`}
            >
              <span className="min-w-0 truncate">{a.nome}</span>
              {a.naGradeDeHoje && (
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  na grade de hoje
                </span>
              )}
            </button>
          ))}
        </div>
        {erro && <p className="mt-3 text-[12px] font-semibold text-questly-red">{erro}</p>}
      </ModalPainel>
    </>
  );
}
