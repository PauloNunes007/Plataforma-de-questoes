"use client";

// Catálogo das provas antigas OFICIAIS (pedido do dono, 2026-09-16): as provas
// reais da UFF de Física I e II que já estão no acervo, aplicadas do jeito que
// foram aplicadas — mesmas questões, mesma ordem, relógio correndo.
//
// É o oposto do montador, e a tela precisa deixar isso claro em um olhar: aqui
// não há recorte, nem dificuldade, nem quantidade. A única decisão do aluno é
// QUAL prova. Por isso a lista é a tela inteira e cada linha é um botão.
//
// A filtragem por disciplina existe porque o acervo tem 31 provas de duas
// matérias e vai crescer; a disciplina que o aluno cursa vem selecionada.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Clock, FileCheck2, Loader2, Lock, Play, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import type { CatalogoProvas, ProvaOficialComTentativa, StatusPlanoSimulado } from "@/lib/simulados/simulados-data";
import { rotuloDuracao } from "@/lib/simulados/constantes";
import { iniciarProvaOficialAction } from "@/lib/simulados/actions";
import { CLASSE_BG_STATUS, CLASSE_TEXTO_STATUS } from "./graficos/base";
import { tomDoPct } from "@/lib/simulados/analise";

const ERROS: Record<string, string> = {
  limite: "Você já usou seu simulado grátis desta semana. No Pro são ilimitados.",
  sem_questoes: "Não conseguimos montar essa prova agora. Tente outra.",
  invalido: "Essa prova não está disponível.",
};

export function ProvasOficiais({
  catalogo,
  status,
}: {
  catalogo: CatalogoProvas;
  status: StatusPlanoSimulado;
}) {
  const router = useRouter();
  const semMovimento = useReducedMotion();
  const [pendente, iniciarTransicao] = useTransition();
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [materiaId, setMateriaId] = useState<string | null>(catalogo.materias[0]?.id ?? null);

  const provas = useMemo(
    () => catalogo.provas.filter((p) => !materiaId || p.materiaId === materiaId),
    [catalogo.provas, materiaId],
  );

  function abrir(p: ProvaOficialComTentativa) {
    if (pendente) return;
    setErro(null);
    setAbrindo(p.codigo);
    iniciarTransicao(async () => {
      const r = await iniciarProvaOficialAction(p.codigo);
      if (r.ok) router.push(`/simulados/${r.id}`);
      else {
        setErro(ERROS[r.erro] ?? ERROS.invalido);
        setAbrindo(null);
      }
    });
  }

  const anim = semMovimento ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  if (catalogo.provas.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-2.5 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <FileCheck2 size={19} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <p className="max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
          Ainda não há prova antiga catalogada inteira. Enquanto isso, o montador usa as mesmas questões de
          prova, sorteadas do jeito que você quiser.
        </p>
        <Link
          href="/simulados/montar"
          className="mt-1 inline-flex min-h-11 items-center rounded-xl bg-questly-green px-4 text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          Montar um simulado
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Regra da tela, dita uma vez: o que muda em relação ao montador. */}
      <motion.p {...anim} className="text-[13px] leading-relaxed text-muted-foreground">
        Cada uma destas caiu de verdade. A prova vem inteira, na ordem original — sem sorteio, sem filtro. O
        tempo é o ritmo da aplicação e o resultado pode entrar no{" "}
        <b className="font-semibold text-foreground">ranking da prova</b>, se você quiser.
      </motion.p>

      {catalogo.materias.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {catalogo.materias.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMateriaId(m.id)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-bold transition-colors ${
                materiaId === m.id
                  ? "border-questly-green bg-questly-green/12 text-questly-green-dark dark:text-questly-green"
                  : "border-input text-muted-foreground hover:border-questly-green/45"
              }`}
            >
              {m.nome}
              <span className="tnum opacity-60">{m.provas}</span>
            </button>
          ))}
        </div>
      )}

      {erro && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-questly-red/40 bg-questly-red-light/60 px-4 py-3 text-[13px] font-medium text-questly-red-dark"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {erro}
        </p>
      )}

      {!status.ehPro && !status.podeMontar && (
        <div className="surface flex flex-col gap-3 border-questly-gold/40 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-questly-gold-light text-questly-gold-dark">
            <Lock size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Você usou seu simulado grátis da semana</p>
            <p className="text-xs font-medium text-muted-foreground">
              Uma prova antiga conta como um simulado. No Pro são ilimitados.
            </p>
          </div>
          <Link
            href="/pro"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-questly-gold px-3.5 text-sm font-bold text-[#3a2c05] transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <Sparkles size={15} /> Seja Pro
          </Link>
        </div>
      )}

      {/* Duas colunas a partir de lg: cada prova é uma linha curta, e o
         catálogo tem dezenas delas — numa coluna só a lista virava uma
         rolagem longa com a metade direita da tela vazia. */}
      <ul className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-x-4">
        {provas.map((p, i) => {
          const feita = p.tentativas.find((t) => t.status === "concluido") ?? null;
          const aberta = p.tentativas.find((t) => t.status === "em_andamento") ?? null;
          const melhor = p.tentativas
            .filter((t) => t.status === "concluido" && t.nota != null)
            .reduce<number | null>((m, t) => (m == null || (t.nota ?? 0) > m ? (t.nota ?? 0) : m), null);
          const tom = tomDoPct(melhor != null ? melhor * 10 : 0);
          const carregando = abrindo === p.codigo;

          return (
            <motion.li
              key={p.codigo}
              {...(semMovimento
                ? {}
                : {
                    initial: { opacity: 0, y: 6 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: Math.min(i * 0.03, 0.2) },
                  })}
            >
              <button
                type="button"
                onClick={() => abrir(p)}
                disabled={pendente || (!status.podeMontar && !aberta)}
                className="group surface-interativa flex w-full items-center gap-3.5 p-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className={`tnum flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-heading text-[13px] font-bold ${
                    melhor != null
                      ? `${CLASSE_BG_STATUS[tom]} ${CLASSE_TEXTO_STATUS[tom]}`
                      : "bg-questly-green-light text-questly-green-dark"
                  }`}
                >
                  {melhor != null ? melhor.toFixed(1) : p.prova}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold">
                    {p.prova} · {p.ano}.{p.semestre}
                  </span>
                  <span className="tnum mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[12px] font-medium text-muted-foreground">
                    <span>{p.materiaNome}</span>
                    <span>{p.questoes} questões</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {rotuloDuracao(p.duracaoMin)}
                    </span>
                    {aberta && <span className="font-bold text-questly-blue-dark">relógio correndo</span>}
                    {!aberta && feita && <span>já feita</span>}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-bold text-questly-green-dark dark:text-questly-green">
                  {carregando ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" />
                      {aberta ? "Continuar" : feita ? "Refazer" : "Fazer"}
                    </>
                  )}
                </span>
              </button>

              {/* O ranking existe mesmo pra quem ainda não fez: ver quem já
                  encarou aquela prova é parte do convite. */}
              {feita && (
                <Link
                  href={`/simulados/${feita.simuladoId}`}
                  className="mt-1 ml-1 inline-flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Trophy size={12} /> Ver meu resultado e o ranking
                </Link>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
