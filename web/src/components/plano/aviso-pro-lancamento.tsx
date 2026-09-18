"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Infinity as InfinityIcon,
  FileText,
  Target,
  X,
} from "lucide-react";
import { ProEmblema, ProBadge } from "@/components/plano/pro-ui";

// O AVISO da semana Pro de lançamento, mostrado uma vez, logo depois que o
// aluno fecha uma lista de questões.
//
// Por que aqui e não na home: quem abre a home ainda não fez nada hoje, e um
// pop-up antes do primeiro esforço é interrupção. Quem acabou de fechar uma
// lista já provou que usa o produto — e é nesse minuto que "ganhou uma semana
// de Pro" chega como recompensa em vez de anúncio.
//
// O QUE ELE NÃO PODE FAZER: dizer só "você ganhou Pro". A promoção só cumpre
// seu papel se as três coisas aparecerem na mesma tela — o SELO (pra ele
// reconhecer a marcação nova no perfil e no ranking), o que o selo DESTRAVA
// (senão não usa, e quem não usa não assina) e a DATA em que acaba (senão
// acha que a plataforma ficou grátis e se sente enganado no oitavo dia).
//
// Quem decide se o aviso vale é o servidor (`FinalizarMissaoResultado.lancamento`).
// O localStorage aqui guarda só o "já vi isso" — conveniência por navegador,
// nunca a fonte da verdade do plano. Se ele vier vazio (aba anônima, dados
// limpos), o pior caso é o aviso aparecer de novo; por isso toda leitura e
// escrita vai dentro de try/catch e a tela funciona sem ele.
const CHAVE_VISTO = "expectrum_aviso_pro_lancamento_v1";

function jaViu(chave: string): boolean {
  try {
    return localStorage.getItem(CHAVE_VISTO) === chave;
  } catch {
    return false;
  }
}

function marcarVisto(chave: string) {
  try {
    localStorage.setItem(CHAVE_VISTO, chave);
  } catch {
    /* modo anônimo / storage bloqueado — o aviso só vai reaparecer, e tudo bem */
  }
}

const DESTAQUES = [
  { icone: InfinityIcon, texto: "Questões sem o teto diário de 30" },
  { icone: FileText, texto: "Simulados cronometrados ilimitados" },
  { icone: Target, texto: "Faltas e notas: quanto falta pra passar" },
];

export function AvisoProLancamento({
  lancamento,
}: {
  lancamento: { expiraEm: string | null } | null;
}) {
  // A chave inclui a validade: se a semana for estendida (ou a conta ganhar
  // outro período depois), o aviso volta a ser novidade — e não fica preso no
  // "já vi" de uma promoção que acabou.
  const chave = lancamento?.expiraEm ?? "sem-validade";
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!lancamento) return;
    if (jaViu(chave)) return;
    // Meio segundo depois do placar: o aluno lê primeiro quantas acertou —
    // aparecer por cima disso transformaria a recompensa em atropelo.
    const t = setTimeout(() => setAberto(true), 600);
    return () => clearTimeout(t);
  }, [lancamento, chave]);

  function fechar() {
    marcarVisto(chave);
    setAberto(false);
  }

  const validade = lancamento?.expiraEm
    ? new Date(lancamento.expiraEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
      })
    : null;

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fechar}
        >
          <motion.div
            role="dialog"
            aria-labelledby="aviso-pro-titulo"
            className="surface-gold relative w-full max-w-[420px] rounded-3xl p-6 text-center shadow-2xl shadow-black/25"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={16} strokeWidth={2} />
            </button>

            <motion.span
              className="mx-auto block w-fit"
              initial={{ rotate: -12, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 14,
                delay: 0.1,
              }}
            >
              <ProEmblema size={52} />
            </motion.span>

            <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-questly-gold">
              Semana de lançamento
            </p>
            <h2
              id="aviso-pro-titulo"
              className="mt-1.5 font-heading text-[21px] font-semibold leading-tight tracking-tight"
            >
              Seu Pro está liberado
            </h2>

            <p className="mx-auto mt-2 max-w-[330px] text-[13px] leading-relaxed text-muted-foreground">
              Estamos lançando a Expectrum e destravamos o plano Pro na sua
              conta por 7 dias. Aquele selo{" "}
              <ProBadge size="sm" className="mx-0.5 align-middle" /> no seu
              perfil e no ranking é ele — todo mundo vê.
            </p>

            <ul className="mx-auto mt-4 flex w-fit flex-col gap-2 text-left">
              {DESTAQUES.map((d) => (
                <li
                  key={d.texto}
                  className="flex items-center gap-2.5 text-[12.5px]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-questly-gold/12 text-questly-gold">
                    <d.icone size={13} strokeWidth={2.2} />
                  </span>
                  {d.texto}
                </li>
              ))}
            </ul>

            {/* A data é o item mais importante do cartão. Sem ela o aviso
                anuncia que a plataforma ficou grátis — e o oitavo dia vira
                reclamação em vez de venda. */}
            {validade && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-questly-gold/30 bg-questly-gold/10 px-3 py-1 text-[11.5px] font-semibold text-questly-gold">
                <CalendarClock size={12} strokeWidth={2.2} />
                Vai até {validade} — depois volta ao grátis
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/pro"
                onClick={fechar}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-questly-green px-5 text-[13.5px] font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Ver tudo que destravou
              </Link>
              <button
                type="button"
                onClick={fechar}
                className="cursor-pointer text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Agora não, quero continuar estudando
              </button>
            </div>

            <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
              Não pedimos cartão e não cobramos nada agora.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
