"use client";

// Ranking de uma prova antiga oficial (pedido do dono, 2026-09-16).
//
// Só existe pra prova OFICIAL, e o motivo é o mesmo que dá sentido ao ranking:
// todo mundo fez exatamente a mesma prova, na mesma ordem, com o mesmo tempo.
// Comparar duas provas SORTEADAS seria inventar uma disputa entre exames
// diferentes — por isso o resultado de um simulado montado não tem esta seção.
//
// Privacidade: aparecer é OPT-IN. A linha nasce privada no banco
// (simulados_aluno.publico default false) e só este botão a torna pública; o
// aluno vê o próprio desempenho de qualquer jeito, e desligar tira a linha do
// placar de todo mundo na hora.

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Trophy } from "lucide-react";
import type { LinhaRanking } from "@/lib/simulados/simulados-data";
import { fmtSegundos } from "@/lib/simulados/analise";
import { definirVisibilidadeSimuladoAction } from "@/lib/simulados/actions";
import { RankAvatar } from "@/components/ranking/avatar";

export function RankingProva({
  simuladoId,
  rotulo,
  linhas,
  publico: publicoInicial,
}: {
  simuladoId: string;
  /** "P1 · 2023.1 · Física II" — o placar precisa dizer de que prova ele é */
  rotulo: string;
  linhas: LinhaRanking[];
  publico: boolean;
}) {
  const [publico, setPublico] = useState(publicoInicial);
  const [pendente, iniciarTransicao] = useTransition();
  const [falhou, setFalhou] = useState(false);

  function alternar() {
    const alvo = !publico;
    setFalhou(false);
    // Otimista: o botão é a única coisa que muda, e reverter é barato se o
    // servidor recusar.
    setPublico(alvo);
    iniciarTransicao(async () => {
      const r = await definirVisibilidadeSimuladoAction(simuladoId, alvo);
      if (!r.ok) {
        setPublico(!alvo);
        setFalhou(true);
      } else setPublico(r.publico);
    });
  }

  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="kicker">Ranking da prova</span>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Todo mundo aqui fez a <b className="font-semibold text-foreground">{rotulo}</b> — as mesmas
            questões, na mesma ordem.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={publico}
          onClick={alternar}
          disabled={pendente}
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[12.5px] font-bold transition-colors disabled:opacity-60 ${
            publico
              ? "border-questly-green bg-questly-green/12 text-questly-green-dark dark:text-questly-green"
              : "border-input text-muted-foreground hover:border-questly-green/45"
          }`}
        >
          {pendente ? (
            <Loader2 size={15} className="animate-spin" />
          ) : publico ? (
            <Eye size={15} />
          ) : (
            <EyeOff size={15} />
          )}
          {publico ? "Meu resultado aparece" : "Mostrar meu resultado"}
        </button>
      </div>

      {falhou && (
        <p role="alert" className="mt-2 text-[12px] font-medium text-questly-red-dark">
          Não deu pra mudar isso agora. Tente de novo.
        </p>
      )}

      {!publico && (
        <p className="mt-3 rounded-xl bg-muted/70 px-4 py-3 text-[12.5px] font-medium text-muted-foreground">
          Seu resultado está privado: ninguém além de você o vê. Ligar mostra seu nome, sua nota e seu tempo
          pra quem fez esta mesma prova.
        </p>
      )}

      {linhas.length === 0 ? (
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Ninguém mostrou o resultado desta prova ainda.{" "}
          {publico ? "O seu é o primeiro — ele aparece aqui assim que a página recarregar." : ""}
        </p>
      ) : (
        <ol className="mt-4 flex flex-col">
          {linhas.map((l) => (
            <li
              key={l.simuladoId}
              className={`flex items-center gap-3 rounded-xl px-2 py-2.5 ${
                l.euMesmo ? "bg-questly-green/10" : ""
              }`}
            >
              <span
                className={`tnum w-7 shrink-0 text-center font-heading text-[14px] font-bold ${
                  l.posicao <= 3 ? "text-questly-gold-dark" : "text-muted-foreground"
                }`}
              >
                {l.posicao}
              </span>
              <RankAvatar nome={l.nome} fotoUrl={l.fotoUrl} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold">
                  {l.nome}
                  {l.euMesmo && (
                    <span className="ml-1.5 text-[11px] font-bold text-questly-green-dark dark:text-questly-green">
                      você
                    </span>
                  )}
                </span>
                <span className="tnum block text-[11.5px] font-medium text-muted-foreground">
                  {l.acertos}/{l.total} acertos · {fmtSegundos(l.tempoGastoSeg)}
                </span>
              </span>
              <span className="tnum shrink-0 font-heading text-[15px] font-bold">{l.nota.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
        <Trophy size={12} /> Empate na nota divide a mesma colocação — o tempo só ordena a lista.
      </p>
    </section>
  );
}
