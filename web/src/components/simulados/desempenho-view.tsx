"use client";

// Desempenho consolidado de TODOS os simulados. É a visão que um simulado
// isolado não dá: um resultado ruim pode ser dia ruim, mas o mesmo tópico
// abaixo de 50% em quatro provas seguidas é diagnóstico.
//
// Toda seção tem porta de amostra: nada vira "ponto forte" ou "ponto fraco" com
// duas questões. Onde falta dado, a seção diz o que falta.

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Grid3x3,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import type { DesempenhoGeral } from "@/lib/simulados/analise";
import { MIN_AMOSTRA_AGREGADO, PCT_BOM, fmtDataCurta, fmtSegundos } from "@/lib/simulados/analise";
import { treinarTopicosDoSimuladoAction } from "@/lib/simulados/actions";
import { CartaoGrafico } from "./graficos/base";
import { BarrasDesempenho } from "./graficos/barras-desempenho";
import { LinhaEvolucao } from "./graficos/linha-evolucao";
import { MapaCalor } from "./graficos/mapa-calor";
import { TendenciaMaterias } from "./graficos/tendencia-materias";

export function DesempenhoView({ dados, podeMontar }: { dados: DesempenhoGeral; podeMontar: boolean }) {
  const pontos = useMemo(
    () =>
      dados.simulados.map((s) => ({
        id: s.id,
        rotulo: fmtDataCurta(s.criadoEm),
        nota: s.nota,
        acertos: s.acertos,
        total: s.total,
      })),
    [dados.simulados],
  );

  const aproveitamentoGeral =
    dados.totalQuestoes > 0
      ? Math.round((dados.questoes.filter((q) => q.status === "acerto").length / dados.totalQuestoes) * 100)
      : 0;

  if (dados.totalSimulados === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <PageHeader
          titulo="Desempenho nos simulados"
          descricao="A leitura consolidada de tudo que você já simulou."
          voltarHref="/simulados"
          voltarLabel="Simulados"
        />
        <div className="surface flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 size={20} className="text-muted-foreground" strokeWidth={1.75} />
          </span>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Você ainda não concluiu nenhum simulado. Assim que concluir o primeiro, esta página passa a mostrar
            sua evolução, seus pontos fortes e onde o estudo rende mais.
          </p>
          {podeMontar && (
            <Link
              href="/simulados/montar"
              className="mt-1 inline-flex items-center gap-2 rounded-xl bg-questly-green px-4 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
            >
              <Plus size={16} strokeWidth={2.5} /> Montar meu primeiro simulado
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        titulo="Desempenho nos simulados"
        descricao="A leitura consolidada de tudo que você já simulou — onde você está bem, onde o estudo rende mais e como isso mudou com o tempo."
        voltarHref="/simulados"
        voltarLabel="Simulados"
      />

      {/* Linha de indicadores — números, não gráficos: cada um é um valor só */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <Indicador
          icone={<Target size={14} />}
          valor={dados.notaMedia.toFixed(1)}
          rotulo="nota média"
          detalhe={`melhor: ${dados.melhorNota.toFixed(1)}`}
        />
        <Indicador
          icone={<TrendingUp size={14} />}
          valor={dados.deltaNota == null ? "—" : `${dados.deltaNota > 0 ? "+" : ""}${dados.deltaNota.toFixed(1)}`}
          rotulo="do 1º ao último"
          detalhe={dados.deltaNota == null ? "precisa de 2 simulados" : "variação da nota"}
          tom={dados.deltaNota == null ? "neutro" : dados.deltaNota >= 0 ? "bom" : "critico"}
        />
        <Indicador icone={<BarChart3 size={14} />} valor={dados.totalSimulados} rotulo="simulados feitos" />
        <Indicador
          icone={<CheckCircle2 size={14} />}
          valor={`${aproveitamentoGeral}%`}
          rotulo="aproveitamento"
          detalhe={`${dados.totalQuestoes} questões`}
        />
        <Indicador
          icone={<Clock size={14} />}
          valor={fmtSegundos(dados.tempoTotalSeg)}
          rotulo="tempo em prova"
          detalhe="somando tudo"
        />
      </motion.div>

      <CartaoGrafico
        titulo="Evolução da nota"
        descricao="Cada ponto é um simulado concluído. Toque num ponto para abrir aquele resultado."
        icone={<Activity size={16} className="text-questly-green" />}
      >
        <LinhaEvolucao pontos={pontos} />
      </CartaoGrafico>

      {/* Fortes × a melhorar, lado a lado */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CartaoGrafico
          titulo="Onde você já está bem"
          descricao={`Tópicos com ${PCT_BOM}% ou mais, considerando pelo menos ${MIN_AMOSTRA_AGREGADO} questões.`}
          icone={<Sparkles size={16} className="text-questly-green" />}
        >
          <BarrasDesempenho
            grupos={dados.fortes}
            mostrarSub
            linhaAlvo={false}
            vazio={`Nenhum tópico bateu ${PCT_BOM}% com pelo menos ${MIN_AMOSTRA_AGREGADO} questões ainda. Isso muda rápido com mais simulados.`}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Onde o estudo rende mais"
          descricao="Seus tópicos mais fracos com amostra suficiente — a lista mais curta de estudo que existe."
          icone={<Swords size={16} className="text-questly-red" />}
          acao={
            dados.aMelhorar.length > 0 ? (
              <BotaoTreinarFracos topicIds={dados.aMelhorar.map((g) => g.chave)} />
            ) : undefined
          }
        >
          <BarrasDesempenho
            grupos={dados.aMelhorar}
            mostrarSub
            linhaAlvo={false}
            vazio="Nada abaixo da linha com amostra suficiente. Ou você está bem, ou ainda faltam questões por tópico."
          />
        </CartaoGrafico>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CartaoGrafico
          titulo="Por disciplina"
          descricao="Somando todas as questões que já caíram nos seus simulados."
          icone={<Layers size={16} className="text-questly-green" />}
        >
          <BarrasDesempenho grupos={dados.materias} mostrarTempo />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Por dificuldade"
          descricao="A curva esperada é cair conforme sobe a dificuldade; um degrau nas fáceis é sinal de pressa."
          icone={<Target size={16} className="text-questly-green" />}
        >
          <BarrasDesempenho
            grupos={dados.dificuldades}
            vazio="As questões dos seus simulados ainda não têm dificuldade catalogada."
          />
        </CartaoGrafico>
      </div>

      <CartaoGrafico
        titulo="Você está melhorando?"
        descricao="Compara o seu aproveitamento na primeira metade dos simulados com o da metade mais recente, disciplina por disciplina."
        icone={<TrendingUp size={16} className="text-questly-green" />}
      >
        <TendenciaMaterias tendencias={dados.tendencias} />
      </CartaoGrafico>

      <CartaoGrafico
        titulo="Consistência"
        descricao="A mesma disciplina, simulado a simulado. Linha irregular é conteúdo que ainda depende de sorte no sorteio."
        icone={<Grid3x3 size={16} className="text-questly-green" />}
      >
        <MapaCalor simulados={dados.simulados} />
      </CartaoGrafico>

      <p className="px-1 text-[11.5px] leading-relaxed text-muted-foreground">
        Estes números descrevem o que você fez nos simulados — não são previsão de nota na prova. A projeção
        para o dia da prova fica no painel da disciplina, na sua trilha.
      </p>
    </div>
  );
}

function Indicador({
  icone,
  valor,
  rotulo,
  detalhe,
  tom = "neutro",
}: {
  icone: React.ReactNode;
  valor: React.ReactNode;
  rotulo: string;
  detalhe?: string;
  tom?: "neutro" | "bom" | "critico";
}) {
  const corValor =
    tom === "bom" ? "text-questly-green-dark" : tom === "critico" ? "text-questly-red-dark" : "text-foreground";
  return (
    <div className="surface p-4">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </span>
      <p className={`mt-1.5 font-heading text-[26px] font-bold leading-none ${corValor}`}>{valor}</p>
      {detalhe && <p className="mt-1 text-[11px] font-medium text-muted-foreground">{detalhe}</p>}
    </div>
  );
}

/** Mesma mecânica do "treinar o que eu errei", só que sobre o histórico todo. */
function BotaoTreinarFracos({ topicIds }: { topicIds: string[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            setErro(false);
            const { missaoId } = await treinarTopicosDoSimuladoAction({ topicIds, quantidade: 12 });
            if (missaoId) router.push(`/questao?missao=${missaoId}`);
            else setErro(true);
          })
        }
        className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:text-[#0c1512]"
      >
        {pendente ? <Loader2 size={13} className="animate-spin" /> : <Swords size={13} />}
        {pendente ? "Montando…" : "Treinar esses"}
      </button>
      {erro && <span className="text-[10.5px] font-medium text-questly-red-dark">Sem questões livres agora.</span>}
    </div>
  );
}
