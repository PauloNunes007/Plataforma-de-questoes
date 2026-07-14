"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Loader2, Swords } from "lucide-react";
import type { DisciplinaPratica } from "@/lib/disciplinas/disciplinas-data";
import { NIVEIS_IA } from "@/lib/xadrez/regras";
import type { CorEscolhida, NivelIa } from "@/lib/xadrez/types";
import { ProBloqueio } from "@/components/plano/pro-ui";

// Tela de setup da Arena: disciplina (ou Geral), força da IA e cor das
// peças. O gate freemium aparece no lugar do CTA — o formulário continua
// visível pra deixar claro o que o recurso faz (mesma filosofia do
// ProBloqueio em vez de esconder).

const OPCOES_COR: { valor: CorEscolhida; rotulo: string; img: string | null }[] = [
  { valor: "brancas", rotulo: "Brancas", img: "/pecas/wK.svg" },
  { valor: "pretas", rotulo: "Pretas", img: "/pecas/bK.svg" },
  { valor: "aleatoria", rotulo: "Aleatória", img: null },
];

export function SetupPartida({
  disciplinas,
  bloqueado,
  iniciando,
  erro,
  onIniciar,
}: {
  disciplinas: DisciplinaPratica[];
  bloqueado: boolean;
  iniciando: boolean;
  erro: string | null;
  onIniciar: (config: { subjectId: string | null; nivelIa: NivelIa; cor: CorEscolhida }) => void;
}) {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [nivelIa, setNivelIa] = useState<NivelIa>("medio");
  const [cor, setCor] = useState<CorEscolhida>("aleatoria");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="surface flex flex-col gap-7 p-5 sm:p-8"
    >
      {/* disciplina */}
      <section>
        <span className="kicker mb-3 block">Disciplina</span>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <BotaoTile
            ativo={subjectId === null}
            onClick={() => setSubjectId(null)}
            titulo="Geral"
            detalhe="Todas as suas matérias"
            icone={<Globe2 size={16} strokeWidth={2} />}
          />
          {disciplinas.map((d) => (
            <BotaoTile
              key={d.subjectId}
              ativo={subjectId === d.subjectId}
              onClick={() => setSubjectId(d.subjectId)}
              titulo={d.nome}
              detalhe={d.bossNome ? `${d.bossNome} em ${d.diasAteProva}d` : "Sem prova marcada"}
            />
          ))}
        </div>
      </section>

      {/* nível da IA */}
      <section>
        <span className="kicker mb-3 block">Força da máquina</span>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {(Object.keys(NIVEIS_IA) as NivelIa[]).map((nivel) => (
            <BotaoTile
              key={nivel}
              ativo={nivelIa === nivel}
              onClick={() => setNivelIa(nivel)}
              titulo={NIVEIS_IA[nivel].rotulo}
              detalhe={NIVEIS_IA[nivel].descricao}
            />
          ))}
        </div>
      </section>

      {/* cor */}
      <section>
        <span className="kicker mb-3 block">Suas peças</span>
        <div className="flex flex-wrap gap-2.5">
          {OPCOES_COR.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => setCor(o.valor)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                cor === o.valor
                  ? "border-questly-green/60 bg-questly-green-light text-questly-green-dark"
                  : "border-border bg-card hover:border-questly-green/40"
              }`}
            >
              {o.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.img} alt="" className="h-5 w-5" draggable={false} />
              ) : (
                <span className="relative h-5 w-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pecas/wK.svg" alt="" className="absolute inset-0 h-5 w-5 [clip-path:inset(0_50%_0_0)]" draggable={false} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pecas/bK.svg" alt="" className="absolute inset-0 h-5 w-5 [clip-path:inset(0_0_0_50%)]" draggable={false} />
                </span>
              )}
              {o.rotulo}
            </button>
          ))}
        </div>
      </section>

      {erro && (
        <p className="rounded-xl bg-questly-red-light px-4 py-3 text-[13px] font-medium text-questly-red-dark">
          {erro}
        </p>
      )}

      {bloqueado ? (
        <ProBloqueio
          titulo="Sua partida grátis de hoje já foi"
          descricao="No plano gratuito é 1 partida por dia. Com o Pro você joga na Arena sem limite."
        />
      ) : (
        <button
          type="button"
          disabled={iniciando}
          onClick={() => onIniciar({ subjectId, nivelIa, cor })}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-questly-green px-6 py-3 text-[14.5px] font-semibold text-white shadow-sm transition-[filter] hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
        >
          {iniciando ? <Loader2 size={16} strokeWidth={2.25} className="animate-spin" /> : <Swords size={16} strokeWidth={2.25} />}
          {iniciando ? "Preparando a partida…" : "Começar partida"}
        </button>
      )}
    </motion.div>
  );
}

function BotaoTile({
  ativo,
  onClick,
  titulo,
  detalhe,
  icone,
}: {
  ativo: boolean;
  onClick: () => void;
  titulo: string;
  detalhe: string;
  icone?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors ${
        ativo
          ? "border-questly-green/60 bg-questly-green-light"
          : "border-border bg-card hover:border-questly-green/40"
      }`}
    >
      <span className={`flex items-center gap-1.5 text-[13.5px] font-semibold ${ativo ? "text-questly-green-dark" : ""}`}>
        {icone}
        <span className="min-w-0 truncate">{titulo}</span>
      </span>
      <span className="line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">{detalhe}</span>
    </button>
  );
}
