"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { MundoIlhas } from "./mundo-ilhas";
import { CaminhoJornada } from "./caminho-jornada";
import { buscarCaminhoDisciplinaAction } from "@/lib/trilha/actions";
import type { CaminhoDisciplina as CaminhoDisciplinaData, RegiaoMapa } from "@/lib/trilha/trilha-data";

type TrilhaViewProps = {
  regioes: RegiaoMapa[];
};

export function TrilhaView({ regioes }: TrilhaViewProps) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [caminho, setCaminho] = useState<CaminhoDisciplinaData | null>(null);
  const [carregando, setCarregando] = useState(false);
  const caminhoRef = useRef<HTMLDivElement>(null);

  // com uma única disciplina não há mapa pra escolher — já abre a trilha dela
  useEffect(() => {
    if (regioes.length === 1) selecionar(regioes[0].subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selecionar(subjectId: string, rolarAteAJornada = false) {
    if (subjectId === selecionada) {
      setSelecionada(null);
      setCaminho(null);
      return;
    }
    setSelecionada(subjectId);
    setCarregando(true);
    // No celular a jornada abre ABAIXO da grade de ilhas — sem esse scroll o
    // aluno toca na disciplina e "nada acontece" (o conteúdo fica fora da
    // tela e parece bug). O timeout dá tempo do skeleton montar.
    if (rolarAteAJornada) {
      setTimeout(() => {
        caminhoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 90);
    }
    const dados = await buscarCaminhoDisciplinaAction(subjectId);
    setCaminho(dados);
    setCarregando(false);
  }

  async function recarregarCaminho() {
    if (!selecionada) return;
    const dados = await buscarCaminhoDisciplinaAction(selecionada);
    setCaminho(dados);
  }

  // deriva as estatísticas da região selecionada a partir do caminho
  // recém-carregado, pra não fazer duas viagens ao servidor a cada
  // pular/recap
  const regioesAtualizadas = regioes.map((r) => {
    if (r.subjectId !== caminho?.subjectId) return r;
    const mestres = caminho.topicos.filter((t) => t.estado === "mestre").length;
    return {
      ...r,
      bossNome: caminho.bossNome,
      diasAteProva: caminho.diasAteProva,
      preparoPercentual: caminho.preparoPercentual,
      totalTopicos: caminho.progresso.total,
      concluidos: caminho.progresso.concluidos,
      pulados: caminho.progresso.pulados,
      mestres,
      completo: caminho.progresso.total > 0 && caminho.progresso.concluidos + caminho.progresso.pulados === caminho.progresso.total,
      notaProjetada: caminho.projecao.notaProjetada,
      emRisco: caminho.projecao.emRisco,
    };
  });

  if (regioes.length === 0) {
    return (
      <div className="surface flex flex-col items-center px-6 py-10 text-center">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <MapIcon size={18} strokeWidth={1.75} className="text-muted-foreground" />
        </span>
        <p className="mb-1 text-[15px] font-medium">Sua campanha nasce aqui</p>
        <p className="mb-5 max-w-[360px] text-sm text-muted-foreground">
          Configure suas disciplinas pra desenhar o mapa da sua trilha.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          Configurar agora
        </Link>
      </div>
    );
  }

  return (
    <>
      {regioes.length > 1 && (
        <MundoIlhas
          regioes={regioesAtualizadas}
          selecionada={selecionada}
          onSelecionar={(id) => selecionar(id, true)}
        />
      )}

      <div ref={caminhoRef} className={selecionada ? "scroll-mt-20 lg:scroll-mt-6" : "hidden"}>
      <AnimatePresence mode="wait">
        {selecionada && (
          <motion.div
            key={selecionada}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {carregando || !caminho ? (
              <div className="surface flex flex-col gap-3 p-6">
                <div className="h-5 w-2/5 animate-pulse rounded-md bg-muted" />
                <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
                <div className="mt-2 flex flex-col gap-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                      <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <CaminhoJornada caminho={caminho} onAtualizar={setCaminho} onSalvo={recarregarCaminho} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
