"use client";

// Plano de ataque: a trilha já calculava memória caindo, risco na prova,
// fronteira e "rumo a Mestre" — mas tudo isso só aparecia se o aluno
// clicasse tópico por tópico. Este card lê a jornada inteira, ordena o que
// é mais urgente e dá o botão que já começa a prática, sem caça ao tesouro.
//
// Ordem de urgência (a mesma do mission-engine: memória vencida > conteúdo
// novo): revisar (Ebbinghaus) → reforçar (chega fraco no dia D) → avançar
// (fronteira) → consolidar (rumo a Mestre).
import { AlertTriangle, BrainCircuit, Check, ChevronRight, Crown, MapPin, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { TopicoTrilha } from "@/lib/trilha/trilha-data";

export type TipoPasso = "revisar" | "risco" | "avancar" | "mestre";

export type PassoPlano = {
  topico: TopicoTrilha;
  numero: number;
  tipo: TipoPasso;
  motivo: string;
};

const ESTILO: Record<
  TipoPasso,
  { rotulo: string; icone: React.ReactNode; chip: string; botao: string; acao: string }
> = {
  revisar: {
    rotulo: "Revisar",
    icone: <BrainCircuit size={13} strokeWidth={2} />,
    chip: "bg-questly-orange-light text-questly-orange-dark",
    botao: "bg-questly-orange text-white hover:brightness-105 dark:text-[#241703]",
    acao: "Revisar",
  },
  risco: {
    rotulo: "Reforçar",
    icone: <AlertTriangle size={13} strokeWidth={2} />,
    chip: "bg-questly-red-light text-questly-red-dark",
    botao: "bg-questly-red text-white hover:brightness-105",
    acao: "Reforçar",
  },
  avancar: {
    rotulo: "Avançar",
    icone: <MapPin size={13} strokeWidth={2} />,
    chip: "bg-questly-green-light text-questly-green-dark",
    botao: "bg-questly-green text-white hover:brightness-105 dark:text-[#0c1512]",
    acao: "Continuar",
  },
  mestre: {
    rotulo: "Consolidar",
    icone: <Crown size={13} strokeWidth={2} />,
    chip: "bg-questly-gold-light text-questly-gold-dark",
    botao: "bg-questly-gold-light text-questly-gold-dark hover:brightness-[0.97]",
    acao: "Treinar",
  },
};

// Monta a fila de recomendações a partir dos tópicos já enriquecidos pelo
// server. Só entra tópico que dá pra praticar de fato (tem questão no banco).
export function montarPlano(topicos: TopicoTrilha[]): PassoPlano[] {
  const passos: PassoPlano[] = [];
  const jaEntrou = new Set<string>();

  const empurrar = (t: TopicoTrilha, i: number, tipo: TipoPasso, motivo: string) => {
    if (jaEntrou.has(t.id) || t.questoesDisponiveis === 0) return;
    jaEntrou.add(t.id);
    passos.push({ topico: t, numero: i + 1, tipo, motivo });
  };

  const comIndice = topicos.map((t, i) => ({ t, i }));

  // 1. memória caindo — do mais esquecido pro menos
  comIndice
    .filter(({ t }) => t.memoriaCaindo)
    .sort((a, b) => (a.t.retencao ?? 1) - (b.t.retencao ?? 1))
    .forEach(({ t, i }) =>
      empurrar(t, i, "revisar", `Memória em ${Math.round((t.retencao ?? 0) * 100)}% — revise antes de esquecer.`),
    );

  // 2. chega fraco no dia da prova (Pro; sem Pro forcaNaProva vem null)
  comIndice
    .filter(({ t }) => t.emRiscoProva)
    .sort((a, b) => (a.t.forcaNaProva ?? 1) - (b.t.forcaNaProva ?? 1))
    .forEach(({ t, i }) =>
      empurrar(t, i, "risco", `Projeção de ~${Math.round((t.forcaNaProva ?? 0) * 100)}% no dia D.`),
    );

  // 3. a fronteira curricular — onde a trilha avança
  comIndice
    .filter(({ t }) => t.ehFronteira && t.estado === "pendente")
    .forEach(({ t, i }) => empurrar(t, i, "avancar", "É aqui que a sua trilha avança agora."));

  // 4. quase Mestre — o gap menor primeiro
  comIndice
    .filter(({ t }) => t.rumoMestre && !t.rumoMestre.pronto && (t.estado === "coberto" || t.estado === "dominado"))
    .sort((a, b) => (a.t.rumoMestre!.faltamQuestoes || 0) - (b.t.rumoMestre!.faltamQuestoes || 0))
    .forEach(({ t, i }) => {
      const faltam = t.rumoMestre!.faltamQuestoes;
      empurrar(
        t,
        i,
        "mestre",
        faltam > 0
          ? `Faltam ${faltam} ${faltam === 1 ? "questão" : "questões"} pra virar Mestre.`
          : "Só falta subir o acerto pra cravar a maestria.",
      );
    });

  return passos;
}

const MAX_VISIVEIS = 3;

export function PlanoDeAtaque({
  topicos,
  pendingId,
  revisandoTudo,
  onPraticar,
  onSelecionar,
  onRevisarTudo,
}: {
  topicos: TopicoTrilha[];
  pendingId: string | null;
  revisandoTudo: boolean;
  onPraticar: (topicoId: string) => void;
  onSelecionar: (topicoId: string) => void;
  onRevisarTudo: (topicoIds: string[]) => void;
}) {
  const plano = montarPlano(topicos);
  const visiveis = plano.slice(0, MAX_VISIVEIS);

  // revisão relâmpago só faz sentido com 2+ tópicos vencidos — com um só, o
  // botão "Revisar" do próprio passo já resolve
  const paraRevisar = plano.filter((p) => p.tipo === "revisar" || p.tipo === "risco").map((p) => p.topico.id);
  const mostrarRelampago = paraRevisar.length >= 2;

  return (
    <div className="surface overflow-hidden p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-[14px] font-semibold tracking-tight">Plano de ataque</h3>
        {plano.length > MAX_VISIVEIS && (
          <span className="tnum text-[11px] font-medium text-muted-foreground">
            {MAX_VISIVEIS} de {plano.length}
          </span>
        )}
      </div>

      {plano.length === 0 ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-questly-green/25 bg-questly-green-light/50 px-3 py-2.5 text-questly-green-dark">
          <Check size={15} strokeWidth={2.25} className="mt-0.5 shrink-0" />
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold">Nada urgente por aqui</span>
            <span className="block text-[11.5px] leading-snug opacity-80">
              Sua trilha está em dia. Siga a missão do dia no painel principal.
            </span>
          </span>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {visiveis.map((p, idx) => {
            const e = ESTILO[p.tipo];
            const ocupado = pendingId === p.topico.id;
            return (
              <motion.li
                key={p.topico.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl border border-border bg-background/60 p-2.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${e.chip}`}
                  >
                    {e.icone}
                    {e.rotulo}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelecionar(p.topico.id)}
                    className="min-w-0 flex-1 cursor-pointer truncate text-left text-[12.5px] font-semibold hover:underline"
                    title={`Ver a parada ${p.numero} no mapa`}
                  >
                    <span className="tnum text-muted-foreground">{p.numero}.</span> {p.topico.nome}
                  </button>
                </div>
                <p className="mb-2 text-[11.5px] leading-snug text-muted-foreground">{p.motivo}</p>
                <button
                  type="button"
                  onClick={() => onPraticar(p.topico.id)}
                  disabled={ocupado || revisandoTudo}
                  className={`inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${e.botao}`}
                >
                  {ocupado ? (
                    "Preparando..."
                  ) : (
                    <>
                      <Zap size={12} strokeWidth={2.25} />
                      {e.acao} agora
                      <ChevronRight size={12} strokeWidth={2.5} className="opacity-70" />
                    </>
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}

      {mostrarRelampago && (
        <button
          type="button"
          onClick={() => onRevisarTudo(paraRevisar)}
          disabled={revisandoTudo || pendingId != null}
          className="mt-2.5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-questly-orange/40 bg-questly-orange-light/60 px-3 py-2 text-[12px] font-semibold text-questly-orange-dark transition-all hover:brightness-[0.98] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          title="Uma missão só, com questões misturadas de todos os tópicos atrasados"
        >
          <BrainCircuit size={13} strokeWidth={2.25} />
          {revisandoTudo ? "Montando revisão..." : `Revisão relâmpago · ${paraRevisar.length} tópicos`}
        </button>
      )}
    </div>
  );
}
