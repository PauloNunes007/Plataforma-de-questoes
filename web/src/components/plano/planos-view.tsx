"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  BENEFICIOS_PRO,
  OPCOES_PLANO,
  reais,
  type OpcaoPlano,
} from "@/lib/plano/plano";
import {
  cancelarAssinaturaPendenteAction,
  criarAssinaturaAction,
  type AssinaturaPendente,
} from "@/lib/plano/actions";

type PlanosViewProps = {
  jaEhPro: boolean;
  ciclo: string | null;
  expiraEm: string | null;
  fidelidadeAte: string | null;
  pendenteInicial: AssinaturaPendente | null;
};

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function PlanosView(props: PlanosViewProps) {
  const [pendente, setPendente] = useState<AssinaturaPendente | null>(props.pendenteInicial);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function assinar(opcao: OpcaoPlano) {
    setErro(null);
    setEnviando(opcao.id);
    const res = await criarAssinaturaAction(opcao.id);
    if ("error" in res) {
      setEnviando(null);
      setErro(res.error);
      return;
    }
    // Gateway configurado: redireciona pro checkout do Mercado Pago (mantém o
    // "enviando" ligado durante o redirect pra não piscar o botão).
    if ("checkoutUrl" in res) {
      window.location.assign(res.checkoutUrl);
      return;
    }
    // Fallback manual (sem gateway): mostra o estado "aguardando confirmação".
    setEnviando(null);
    setPendente(res.assinatura);
  }

  async function cancelar() {
    if (!pendente) return;
    setEnviando("cancelar");
    const res = await cancelarAssinaturaPendenteAction(pendente.id);
    setEnviando(null);
    if ("ok" in res) setPendente(null);
    else setErro(res.error);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-questly-gold/15 px-3 py-1 text-xs font-semibold text-questly-gold">
          <Crown size={13} strokeWidth={2.5} className="fill-current" />
          Questly Pro
        </span>
        <h1 className="mt-3 font-heading text-[26px] font-semibold tracking-tight sm:text-[30px]">
          {props.jaEhPro ? "Você é Questly Pro 🎉" : "Destrave o semestre inteiro"}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {props.jaEhPro
            ? "Todos os recursos avançados estão liberados na sua conta."
            : "O plano grátis já te faz passar numa matéria. O Pro é o motor completo, sem freios — grade automática, projeção pro dia da prova, autópsia do erro e estatísticas avançadas."}
        </p>
      </header>

      {props.jaEhPro ? (
        <StatusPro ciclo={props.ciclo} expiraEm={props.expiraEm} fidelidadeAte={props.fidelidadeAte} />
      ) : pendente ? (
        <PagamentoPendente pendente={pendente} onCancelar={cancelar} cancelando={enviando === "cancelar"} />
      ) : (
        <>
          {erro && (
            <p className="rounded-xl bg-questly-red/10 px-4 py-3 text-center text-sm text-questly-red">{erro}</p>
          )}
          <div className="grid gap-5 lg:grid-cols-3">
            {OPCOES_PLANO.map((opcao) => (
              <PlanoCard
                key={opcao.id}
                opcao={opcao}
                enviando={enviando === opcao.id}
                bloqueado={enviando !== null}
                onAssinar={() => assinar(opcao)}
              />
            ))}
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock size={12} strokeWidth={2.5} />
            Pagamento processado com segurança pelo Mercado Pago · cartão de crédito ou Pix
          </p>
        </>
      )}

      {/* benefícios — sempre visíveis */}
      <div className="surface rounded-2xl p-6">
        <h2 className="font-heading text-base font-semibold">O que vem no Pro</h2>
        <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {BENEFICIOS_PRO.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[13.5px]">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-questly-green">
                <Check size={11} strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PlanoCard({
  opcao,
  enviando,
  bloqueado,
  onAssinar,
}: {
  opcao: OpcaoPlano;
  enviando: boolean;
  bloqueado: boolean;
  onAssinar: () => void;
}) {
  const destaque = opcao.destaque === "Mais popular";
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 ${
        destaque ? "surface-brand shadow-lg ring-1 ring-questly-green/30" : "surface"
      }`}
    >
      {opcao.destaque && (
        <span
          className={`absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
            destaque
              ? "bg-questly-green text-white dark:text-[#0c1512]"
              : "bg-questly-gold text-[#3a2a05]"
          }`}
        >
          <Sparkles size={12} strokeWidth={2.5} />
          {opcao.destaque}
        </span>
      )}
      <h3 className="font-heading text-lg font-semibold tracking-tight">{opcao.titulo}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-base font-medium text-muted-foreground">R$</span>
        <span className="tnum font-heading text-4xl font-semibold tracking-tight">
          {(opcao.precoCentavos / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: opcao.precoCentavos % 100 === 0 ? 0 : 2,
          })}
        </span>
        <span className="text-sm text-muted-foreground">{opcao.cobrancaLabel}</span>
      </div>
      {opcao.forma === "recorrente" && opcao.ciclo === "semestral" && (
        <p className="tnum mt-1 text-xs text-muted-foreground">
          {reais(opcao.precoCentavos * 6)} no semestre
        </p>
      )}
      <p className="mt-3 min-h-[2.5rem] text-[12.5px] text-muted-foreground">{opcao.observacao}</p>
      <button
        type="button"
        onClick={onAssinar}
        disabled={bloqueado}
        className={`mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-sm transition-[filter,transform] hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          destaque
            ? "bg-questly-green text-white dark:text-[#0c1512]"
            : "bg-foreground text-background"
        }`}
      >
        {enviando ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Assinar
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}

function PagamentoPendente({
  pendente,
  onCancelar,
  cancelando,
}: {
  pendente: AssinaturaPendente;
  onCancelar: () => void;
  cancelando: boolean;
}) {
  const nomeCiclo = pendente.ciclo === "semestral" ? "Pro Semestral" : "Pro Mensal";

  return (
    <motion.div
      className="surface-gold mx-auto w-full max-w-xl rounded-2xl p-7 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-questly-gold/20 text-questly-gold">
        <Loader2 size={24} className="animate-spin" strokeWidth={2} />
      </span>
      <h2 className="mt-3 font-heading text-lg font-semibold">Confirmando seu pagamento…</h2>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">
        {nomeCiclo} · <span className="tnum">{reais(pendente.valorCentavos)}</span>
        {pendente.forma === "recorrente" && pendente.ciclo === "semestral" ? "/mês" : ""}. Assim que o
        pagamento for aprovado, seu <b>Pro é liberado automaticamente</b> — pode fechar esta página, você
        não precisa fazer mais nada.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
      >
        Já paguei — atualizar
      </button>

      <div>
        <button
          type="button"
          onClick={onCancelar}
          disabled={cancelando}
          className="mt-4 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-questly-red hover:underline disabled:opacity-60"
        >
          {cancelando ? "Cancelando…" : "Cancelar este pedido"}
        </button>
      </div>
    </motion.div>
  );
}

function StatusPro({
  ciclo,
  expiraEm,
  fidelidadeAte,
}: {
  ciclo: string | null;
  expiraEm: string | null;
  fidelidadeAte: string | null;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="surface-gold mx-auto w-full max-w-xl rounded-2xl p-7 text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-questly-gold/20 text-questly-gold">
          <BadgeCheck size={26} strokeWidth={2} />
        </span>
        <h2 className="mt-3 font-heading text-xl font-semibold">Assinatura ativa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plano {ciclo === "semestral" ? "Pro Semestral" : "Pro Mensal"}.
        </p>
        <dl className="mx-auto mt-5 grid max-w-xs gap-2 text-left text-[13px]">
          <div className="flex items-center justify-between gap-4 border-t border-questly-gold/20 pt-2">
            <dt className="text-muted-foreground">Válido até</dt>
            <dd className="font-semibold">{formatarData(expiraEm)}</dd>
          </div>
          {fidelidadeAte && (
            <div className="flex items-center justify-between gap-4 border-t border-questly-gold/20 pt-2">
              <dt className="text-muted-foreground">Fidelidade até</dt>
              <dd className="font-semibold">{formatarData(fidelidadeAte)}</dd>
            </div>
          )}
        </dl>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck size={13} />
          Obrigado por apoiar a Questly.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
