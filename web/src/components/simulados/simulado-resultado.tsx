"use client";

// Resultado de um simulado. A tela responde, nessa ordem: quanto eu tirei →
// isso é melhor ou pior que o meu normal → onde exatamente eu perdi ponto →
// o que eu faço agora → a correção questão a questão.
//
// Nada aqui é inventado: todo número sai das questões aplicadas, das respostas
// e (quando existe) do tempo medido pelo runner. Onde falta dado, a seção diz
// que falta em vez de mostrar zero.

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Gauge,
  Layers,
  Lightbulb,
  Loader2,
  RotateCcw,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { SimuladoCompleto } from "@/lib/simulados/simulados-data";
import {
  PCT_BOM,
  diagnosticar,
  fmtSegundos,
  fmtSegundosPreciso,
  porDificuldade,
  porMateria,
  porTopico,
  tomDoPct,
} from "@/lib/simulados/analise";
import { treinarTopicosDoSimuladoAction } from "@/lib/simulados/actions";
import { CLASSE_TEXTO_STATUS, CartaoGrafico } from "./graficos/base";
import { BarrasDesempenho } from "./graficos/barras-desempenho";
import { RitmoProva } from "./graficos/ritmo-prova";
import { GabaritoSimulado } from "./gabarito-simulado";
import { RankingProva } from "./ranking-prova";
import type { RankingProva as DadosRanking } from "@/lib/simulados/simulados-data";
import { hrefQuestao } from "@/lib/questao/navegacao";

/** Comparação com o próprio histórico — calculada na page, não aqui. */
export type ContextoResultado = {
  /** quantos simulados o aluno já tinha concluído ANTES deste */
  anteriores: number;
  mediaAnterior: number | null;
  melhorAnterior: number | null;
};

function corNota(nota: number): { texto: string; anel: string } {
  if (nota >= 7) return { texto: "text-questly-green-dark", anel: "var(--color-questly-green)" };
  if (nota >= 5) return { texto: "text-questly-gold-dark", anel: "var(--color-questly-gold)" };
  return { texto: "text-questly-red-dark", anel: "var(--color-questly-red)" };
}

export function SimuladoResultado({
  simulado,
  contexto,
  ranking,
  rotuloProva,
}: {
  simulado: SimuladoCompleto;
  contexto: ContextoResultado;
  /** só vem preenchido quando o simulado é uma prova antiga oficial */
  ranking?: DadosRanking | null;
  rotuloProva?: string | null;
}) {
  const analise = simulado.analise;
  const nota = Number(simulado.nota ?? 0);
  const total = simulado.total ?? analise.length;
  const acertos = simulado.acertos ?? analise.filter((q) => q.status === "acerto").length;
  const erros = analise.filter((q) => q.status === "erro").length;
  const brancos = analise.filter((q) => q.status === "branco").length;
  const cor = corNota(nota);

  const materias = useMemo(() => porMateria(analise), [analise]);
  const topicos = useMemo(() => porTopico(analise), [analise]);
  const dificuldades = useMemo(() => porDificuldade(analise), [analise]);
  const diag = useMemo(() => diagnosticar(analise), [analise]);

  const topicosParaTreinar = useMemo(
    () =>
      [...new Set(analise.filter((q) => q.status !== "acerto" && q.topicoId).map((q) => q.topicoId))].filter(
        Boolean,
      ) as string[],
    [analise],
  );

  const anguloAcertos = total > 0 ? (acertos / total) * 360 : 0;
  const tempoPorQuestao = simulado.tempo_gasto_seg != null && total > 0 ? simulado.tempo_gasto_seg / total : null;
  const deltaMedia = contexto.mediaAnterior != null ? Math.round((nota - contexto.mediaAnterior) * 10) / 10 : null;
  const ehRecorde = contexto.melhorAnterior != null && nota > contexto.melhorAnterior;

  return (
    <div className="casca-media flex flex-col gap-5 py-6 lg:py-8">
      <Link
        href="/simulados"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} /> Simulados
      </Link>

      {/* ---------------- Resultado ---------------- */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="kicker">Resultado</span>
          {ehRecorde && (
            <span className="inline-flex items-center gap-1 rounded-full bg-questly-gold-light px-2.5 py-0.5 text-[11px] font-bold text-questly-gold-dark">
              <TrendingUp size={12} /> Sua melhor nota até agora
            </span>
          )}
        </div>
        <h1 className="mt-1 font-heading text-lg font-bold sm:text-xl">{simulado.titulo}</h1>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `conic-gradient(${cor.anel} ${anguloAcertos}deg, var(--color-muted) 0deg)` }}
            />
            <div className="absolute inset-[10px] rounded-full bg-card" />
            <div className="relative text-center">
              {/* figura-herói: proporcional, não tabular */}
              <div className={`font-heading text-[44px] font-bold leading-none ${cor.texto}`}>{nota.toFixed(1)}</div>
              <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">de 10</div>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Tile valor={acertos} rotulo="acertos" tom="bom" />
            <Tile valor={erros} rotulo="erros" tom="critico" />
            <Tile valor={brancos} rotulo="em branco" tom="neutro" />
            <Tile valor={fmtSegundos(simulado.tempo_gasto_seg)} rotulo="tempo total" tom="neutro" icone={<Clock size={13} />} />
          </div>
        </div>

        {/* leitura contra o próprio histórico */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-[12.5px]">
          {deltaMedia != null ? (
            <span className="inline-flex items-center gap-1.5 font-medium">
              {deltaMedia >= 0 ? (
                <TrendingUp size={14} className="text-questly-green" />
              ) : (
                <TrendingDown size={14} className="text-questly-red" />
              )}
              <span className={deltaMedia >= 0 ? "text-questly-green-dark" : "text-questly-red-dark"}>
                {deltaMedia >= 0 ? "+" : ""}
                {deltaMedia.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                em relação à sua média ({contexto.mediaAnterior?.toFixed(1)}) nos {contexto.anteriores} simulados
                anteriores
              </span>
            </span>
          ) : (
            <span className="font-medium text-muted-foreground">
              Este é o seu primeiro simulado concluído — ele vira a sua linha de base para comparar os próximos.
            </span>
          )}
          {tempoPorQuestao != null && (
            <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
              <Gauge size={14} /> {fmtSegundosPreciso(tempoPorQuestao)} por questão, na média
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {topicosParaTreinar.length > 0 && <BotaoTreinarErros topicIds={topicosParaTreinar} />}
          <Link
            href="/simulados/montar"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-questly-green/50"
          >
            <RotateCcw size={15} /> Montar outro
          </Link>
          <Link
            href="/simulados/desempenho"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-questly-green/50"
          >
            <BarChart3 size={15} /> Desempenho geral
          </Link>
        </div>
      </motion.section>

      {/* Ranking logo depois da nota: numa prova que todo mundo fez igual, "e
          os outros?" é a pergunta seguinte imediata — antes do diagnóstico por
          tópico, que é a conversa do aluno com ele mesmo. */}
      {ranking && (
        <RankingProva
          simuladoId={simulado.id}
          rotulo={rotuloProva || simulado.titulo}
          linhas={ranking.linhas}
          publico={simulado.publico}
        />
      )}

      {/* ---------------- Diagnóstico ---------------- */}
      <CartaoGrafico
        titulo="O que esse simulado diz"
        descricao="Leitura automática do seu resultado — só entra o que tem dado suficiente para afirmar."
        icone={<Lightbulb size={16} className="text-questly-gold" />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CartaoDestaque
            tom="critico"
            titulo="Onde o estudo rende mais agora"
            grupo={diag.fraco}
            vazio="Nenhum tópico teve questões suficientes nesse simulado para eleger um ponto fraco com honestidade."
          />
          <CartaoDestaque
            tom="bom"
            titulo="Onde você já está bem"
            grupo={diag.forte}
            vazio="Faça um simulado com mais questões por tópico para destacar um ponto forte."
          />
        </div>

        {diag.observacoes.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {diag.observacoes.map((o) => (
              <li key={o} className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-questly-green" />
                {o}
              </li>
            ))}
          </ul>
        )}
      </CartaoGrafico>

      {/* ---------------- Recortes do desempenho ---------------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {materias.length > 1 && (
          <CartaoGrafico
            titulo="Por disciplina"
            descricao="Da que mais precisa de você para a que menos precisa."
            icone={<Layers size={16} className="text-questly-green" />}
          >
            <BarrasDesempenho grupos={materias} mostrarTempo />
          </CartaoGrafico>
        )}

        {dificuldades.length > 1 && (
          <CartaoGrafico
            titulo="Por dificuldade"
            descricao="Cair só nas difíceis é normal; cair nas fáceis é sinal de pressa ou de base."
            icone={<Target size={16} className="text-questly-green" />}
          >
            <BarrasDesempenho grupos={dificuldades} />
          </CartaoGrafico>
        )}
      </div>

      {topicos.length > 1 && (
        <CartaoGrafico
          titulo="Por tópico"
          descricao={`Os tópicos abaixo de ${PCT_BOM}% são a lista de estudo mais curta que existe para a próxima prova.`}
          icone={<Swords size={16} className="text-questly-green" />}
        >
          <BarrasDesempenho grupos={topicos} mostrarSub mostrarTempo />
        </CartaoGrafico>
      )}

      <CartaoGrafico
        titulo="Ritmo da prova"
        descricao="Quanto cada questão custou de tempo, na ordem em que você resolveu."
        icone={<Clock size={16} className="text-questly-green" />}
      >
        <RitmoProva questoes={analise} duracaoMin={simulado.duracao_min} />
      </CartaoGrafico>

      {/* ---------------- Gabarito ---------------- */}
      <GabaritoSimulado perguntas={simulado.perguntas} analise={analise} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Tile({
  valor,
  rotulo,
  tom,
  icone,
}: {
  valor: React.ReactNode;
  rotulo: string;
  tom: "bom" | "critico" | "neutro";
  icone?: React.ReactNode;
}) {
  const fundo =
    tom === "bom" ? "bg-questly-green-light" : tom === "critico" ? "bg-questly-red-light" : "bg-muted";
  return (
    <div className={`rounded-xl p-3 text-center ${fundo}`}>
      <div className="flex items-center justify-center gap-1 font-heading text-xl font-bold leading-none">
        {icone}
        {valor}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{rotulo}</div>
    </div>
  );
}

function CartaoDestaque({
  tom,
  titulo,
  grupo,
  vazio,
}: {
  tom: "bom" | "critico";
  titulo: string;
  grupo: { rotulo: string; sub?: string; acertos: number; total: number; pct: number } | null;
  vazio: string;
}) {
  if (!grupo) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{vazio}</p>
      </div>
    );
  }
  const borda = tom === "bom" ? "border-questly-green/40 bg-questly-green-light/50" : "border-questly-red/40 bg-questly-red-light/50";
  return (
    <div className={`rounded-xl border p-4 ${borda}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-[15px] font-bold leading-tight">{grupo.rotulo}</p>
      {grupo.sub && <p className="text-[11.5px] font-medium text-muted-foreground">{grupo.sub}</p>}
      <p className={`tnum mt-1.5 text-[12.5px] font-bold ${CLASSE_TEXTO_STATUS[tomDoPct(grupo.pct)]}`}>
        {grupo.acertos} de {grupo.total} · {grupo.pct}%
      </p>
    </div>
  );
}

/**
 * Transforma os tópicos errados numa missão avulsa de prática e leva direto
 * pra ela — o atalho entre "vi o resultado" e "fiz algo com ele".
 */
function BotaoTreinarErros({ topicIds }: { topicIds: string[] }) {
  const router = useRouter();
  // De onde o aluno saiu — o "X" da tela de questões devolve pra cá.
  const origem = usePathname();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            setErro(false);
            const { missaoId } = await treinarTopicosDoSimuladoAction({ topicIds, quantidade: 10 });
            if (missaoId) router.push(hrefQuestao(missaoId, origem));
            else setErro(true);
          })
        }
        className="inline-flex items-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:text-[#0c1512]"
      >
        {pendente ? <Loader2 size={15} className="animate-spin" /> : <Swords size={15} />}
        {pendente ? "Montando prática…" : "Treinar o que eu errei"}
      </button>
      {erro && (
        <span className="text-[11px] font-medium text-questly-red-dark">
          Não há questões livres nesses tópicos agora. Tente pelo Banco de Questões.
        </span>
      )}
    </div>
  );
}
