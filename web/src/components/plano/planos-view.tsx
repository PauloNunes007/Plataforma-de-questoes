"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Minus,
  RefreshCw,
  ShieldCheck,
  Ticket,
  TriangleAlert,
} from "lucide-react";
import {
  OPCOES_PLANO,
  RECURSOS_FREE,
  reais,
  type OpcaoPlano,
} from "@/lib/plano/plano";
import {
  cancelarAssinaturaPendenteAction,
  conferirPagamentoAction,
  criarAssinaturaAction,
  resgatarCupomAction,
  type AssinaturaPendente,
  type ConferenciaPagamento,
  type EstadoPagamento,
} from "@/lib/plano/actions";
import { ProEmblema, ProMark } from "@/components/plano/pro-ui";

type PlanosViewProps = {
  jaEhPro: boolean;
  ciclo: string | null;
  expiraEm: string | null;
  fidelidadeAte: string | null;
  pendenteInicial: AssinaturaPendente | null;
  voltouDoCheckout: boolean;
  conferenciaInicial: ConferenciaPagamento | null;
};

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// Cadência do polling. As primeiras checagens são rápidas (Pix aprova em
// segundos), depois espaçam pra não martelar a API do Mercado Pago. Passado o
// teto, paramos sozinhos e deixamos o botão manual — o webhook continua
// trabalhando por trás de qualquer jeito, então ninguém fica sem o Pro por ter
// fechado a aba.
const POLL_RAPIDO_MS = 3000;
const POLL_LENTO_MS = 6000;
const POLL_CHECAGENS_RAPIDAS = 6;
const POLL_MAX_CHECAGENS = 45; // ≈ 4 minutos

export function PlanosView(props: PlanosViewProps) {
  const router = useRouter();
  const [pendente, setPendente] = useState<AssinaturaPendente | null>(props.pendenteInicial);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ativadoAgora, setAtivadoAgora] = useState(false);
  const [conferindo, setConferindo] = useState(false);
  const [cansou, setCansou] = useState(false);
  const [detalhe, setDetalhe] = useState<string | null>(props.conferenciaInicial?.detalhe ?? null);
  const [estado, setEstado] = useState<EstadoPagamento | null>(() => {
    if (props.jaEhPro) return "ativo";
    if (props.conferenciaInicial) return props.conferenciaInicial.estado;
    return props.pendenteInicial ? "processando" : null;
  });

  // Limpa os `?status=&payment_id=…` que o Mercado Pago cola na volta: a
  // conferência já rodou no servidor, e deixar isso na URL faria um F5
  // reprocessar (inofensivo, mas suja o histórico e confunde o aluno).
  useEffect(() => {
    if (props.voltouDoCheckout && typeof window !== "undefined") {
      window.history.replaceState({}, "", "/pro");
    }
  }, [props.voltouDoCheckout]);

  const conferir = useCallback(async () => {
    const res = await conferirPagamentoAction();
    setEstado(res.estado);
    setDetalhe(res.detalhe ?? null);
    if (res.estado === "ativo") {
      setAtivadoAgora(true);
      setPendente(null);
      router.refresh();
    }
    if (res.estado === "sem_pendencia") setPendente(null);
  }, [router]);

  // Polling: é o que torna o fluxo automático mesmo quando o webhook não
  // chega (URL errada, segredo trocado, MP atrasado). Pergunta direto pro
  // Mercado Pago e ativa na hora em que aprovar — nenhum admin no meio.
  const checagens = useRef(0);
  useEffect(() => {
    if (props.jaEhPro || estado !== "processando" || cansou) return;
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;

    const agendar = () => {
      if (checagens.current >= POLL_MAX_CHECAGENS) {
        setCansou(true);
        return;
      }
      const espera = checagens.current < POLL_CHECAGENS_RAPIDAS ? POLL_RAPIDO_MS : POLL_LENTO_MS;
      timer = setTimeout(async () => {
        checagens.current += 1;
        const novo = await conferirPagamentoAction();
        if (!vivo) return;
        if (novo.estado === "processando") {
          agendar();
          return;
        }
        setEstado(novo.estado);
        setDetalhe(novo.detalhe ?? null);
        if (novo.estado === "ativo") {
          setAtivadoAgora(true);
          setPendente(null);
          router.refresh();
        }
        if (novo.estado === "sem_pendencia") setPendente(null);
      }, espera);
    };

    agendar();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [props.jaEhPro, estado, cansou, router]);

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
    setEstado("indisponivel");
  }

  async function verificarAgora() {
    setConferindo(true);
    checagens.current = 0;
    setCansou(false);
    await conferir();
    setConferindo(false);
  }

  async function cancelar() {
    if (!pendente) return;
    setEnviando("cancelar");
    const res = await cancelarAssinaturaPendenteAction(pendente.id);
    setEnviando(null);
    if ("ok" in res) {
      setPendente(null);
      setEstado(null);
      setDetalhe(null);
    } else setErro(res.error);
  }

  const mostrandoEspera =
    !props.jaEhPro && !!pendente && (estado === "processando" || estado === "indisponivel");
  const mostrandoRecusa = !props.jaEhPro && estado === "recusado";

  return (
    <div className="flex flex-col gap-10">
      <Cabecalho jaEhPro={props.jaEhPro} />

      {!mostrandoEspera && <CupomResgate onResgatado={() => router.refresh()} />}

      {props.jaEhPro ? (
        <StatusPro
          ciclo={props.ciclo}
          expiraEm={props.expiraEm}
          fidelidadeAte={props.fidelidadeAte}
          recemAtivado={ativadoAgora}
        />
      ) : mostrandoEspera && pendente ? (
        <PagamentoEmAnalise
          pendente={pendente}
          manual={estado === "indisponivel"}
          cansou={cansou}
          conferindo={conferindo}
          onVerificar={verificarAgora}
          onCancelar={cancelar}
          cancelando={enviando === "cancelar"}
        />
      ) : (
        <>
          {mostrandoRecusa && (
            <Aviso
              titulo="O pagamento não foi aprovado"
              texto={`${detalhe ?? "O Mercado Pago recusou a cobrança."} Nada foi cobrado — dá pra tentar de novo, com outro cartão ou por Pix.`}
            />
          )}
          {erro && <Aviso titulo="Não deu pra continuar" texto={erro} />}

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

          <LinhaConfianca />
        </>
      )}

      <Comparativo />
    </div>
  );
}

/* --------------------------------------------------------------- cabeçalho */

function Cabecalho({ jaEhPro }: { jaEhPro: boolean }) {
  return (
    <header className="flex flex-col items-center text-center">
      <ProEmblema size={44} />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-questly-gold">
        Expectrum Pro
      </p>
      <h1 className="mt-2 max-w-2xl font-heading text-[27px] font-semibold leading-tight tracking-tight sm:text-[34px]">
        {jaEhPro ? "Sua assinatura está ativa" : "O motor completo, sem freios"}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
        {jaEhPro
          ? "Todos os recursos avançados estão liberados nesta conta."
          : "O plano grátis já te faz passar numa matéria. O Pro te mostra a nota que você vai tirar, por que você errou e o caminho mais curto pra subir — em todas elas."}
      </p>
    </header>
  );
}

/* ------------------------------------------------------------ cards/planos */

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
  const totalSemestre =
    opcao.ciclo === "semestral"
      ? opcao.forma === "recorrente"
        ? opcao.precoCentavos * 6
        : opcao.precoCentavos
      : opcao.precoCentavos * 6;

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 ${
        destaque ? "surface-gold shadow-[var(--elev-md)]" : "surface"
      }`}
    >
      {opcao.destaque && (
        <span
          className={`absolute -top-2.5 right-5 inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.12em] ${
            destaque
              ? "border border-questly-gold/40 bg-questly-gold-light text-questly-gold"
              : "border border-border bg-card text-muted-foreground"
          }`}
        >
          {destaque && <ProMark size={9} strokeWidth={2.4} />}
          {opcao.destaque}
        </span>
      )}

      <h3 className="font-heading text-[15px] font-semibold tracking-tight">{opcao.titulo}</h3>

      <div className="mt-4 flex items-end gap-1.5">
        <span className="pb-1.5 text-[15px] font-medium text-muted-foreground">R$</span>
        <span className="tnum font-heading text-[42px] font-semibold leading-none tracking-tight">
          {(opcao.precoCentavos / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: opcao.precoCentavos % 100 === 0 ? 0 : 2,
          })}
        </span>
        <span className="pb-1.5 text-[13px] text-muted-foreground">{opcao.cobrancaLabel}</span>
      </div>

      <p className="tnum mt-1.5 text-[12px] text-muted-foreground">
        {reais(totalSemestre)} no semestre
      </p>

      <p className="mt-4 min-h-[2.75rem] border-t border-border pt-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {opcao.observacao}
      </p>

      <button
        type="button"
        onClick={onAssinar}
        disabled={bloqueado}
        className={`mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-[filter,transform,background-color] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          destaque
            ? "bg-gradient-to-br from-[#e8c257] to-[#b98712] text-[#2a1d02] shadow-[var(--elev-sm)]"
            : "border border-border bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08]"
        }`}
      >
        {enviando ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Abrindo checkout…
          </>
        ) : (
          <>
            Assinar
            <ArrowRight size={15} strokeWidth={2.2} />
          </>
        )}
      </button>
    </div>
  );
}

function LinhaConfianca() {
  const itens = [
    { icone: CreditCard, texto: "Cartão de crédito ou Pix" },
    { icone: Lock, texto: "Checkout do Mercado Pago — não guardamos seu cartão" },
    { icone: ShieldCheck, texto: "Liberação automática assim que o pagamento aprovar" },
  ];
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {itens.map((i) => (
        <li key={i.texto} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <i.icone size={13} strokeWidth={1.9} className="text-questly-green" />
          {i.texto}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- cupom Pro */

// Link discreto que expande um campo de código — a maioria dos alunos não tem
// cupom, então isto não pode competir visualmente com os cards de plano.
function CupomResgate({ onResgatado }: { onResgatado: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<number | null>(null);

  async function resgatar() {
    if (!codigo.trim()) return;
    setErro(null);
    setEnviando(true);
    const res = await resgatarCupomAction(codigo);
    setEnviando(false);
    if ("error" in res) {
      setErro(res.error);
      return;
    }
    setSucesso(res.diasConcedidos);
    setCodigo("");
    onResgatado();
  }

  if (sucesso !== null) {
    return (
      <p className="mx-auto flex items-center gap-1.5 text-[12.5px] font-medium text-questly-green-dark">
        <BadgeCheck size={14} strokeWidth={2.2} />
        Cupom aplicado — {sucesso} dias de Pro liberados.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mx-auto flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        <Ticket size={13} strokeWidth={2} />
        Tenho um cupom
      </button>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-2">
      <div className="flex w-full items-center gap-2">
        <input
          autoFocus
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && resgatar()}
          placeholder="Código do cupom"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-2.5 font-mono text-[13px] uppercase tracking-wide outline-none focus:border-questly-gold"
        />
        <button
          type="button"
          disabled={enviando || !codigo.trim()}
          onClick={resgatar}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-questly-gold/15 px-3 text-[12.5px] font-semibold text-questly-gold transition-colors hover:bg-questly-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? <Loader2 size={13} className="animate-spin" /> : "Aplicar"}
        </button>
      </div>
      {erro && <p className="text-[12px] text-questly-red-dark">{erro}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ avisos */

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mx-auto flex w-full max-w-xl items-start gap-3 rounded-xl border border-questly-red/25 bg-questly-red/[0.07] px-4 py-3.5 text-left">
      <span className="mt-0.5 text-questly-red">
        <TriangleAlert size={16} strokeWidth={2} />
      </span>
      <div>
        <p className="text-[13.5px] font-semibold">{titulo}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{texto}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- espera/confirmação */

function PagamentoEmAnalise({
  pendente,
  manual,
  cansou,
  conferindo,
  onVerificar,
  onCancelar,
  cancelando,
}: {
  pendente: AssinaturaPendente;
  manual: boolean;
  cansou: boolean;
  conferindo: boolean;
  onVerificar: () => void;
  onCancelar: () => void;
  cancelando: boolean;
}) {
  const nomeCiclo = pendente.ciclo === "semestral" ? "Pro Semestral" : "Pro Mensal";
  const porMes = pendente.forma === "recorrente" && pendente.ciclo === "semestral";

  return (
    <motion.div
      className="surface mx-auto w-full max-w-xl rounded-2xl p-7 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-questly-gold/10 text-questly-gold ring-1 ring-questly-gold/25">
        {cansou || manual ? (
          <ProMark size={22} strokeWidth={2.1} />
        ) : (
          <Loader2 size={22} className="animate-spin" strokeWidth={2} />
        )}
      </span>

      <h2 className="mt-4 font-heading text-[18px] font-semibold tracking-tight">
        {manual
          ? "Pedido registrado"
          : cansou
            ? "Ainda não consta como pago"
            : "Confirmando seu pagamento…"}
      </h2>

      <p className="tnum mt-1 text-[12.5px] text-muted-foreground">
        {nomeCiclo} · {reais(pendente.valorCentavos)}
        {porMes ? "/mês" : ""}
      </p>

      <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {manual ? (
          <>
            O pagamento online está indisponível no momento. Seu pedido ficou salvo e será
            confirmado manualmente — não pague duas vezes.
          </>
        ) : cansou ? (
          <>
            Se você acabou de pagar, o Mercado Pago pode levar mais alguns minutos. Pode fechar esta
            página: <b>assim que ele aprovar, o Pro entra sozinho</b> na sua conta.
          </>
        ) : (
          <>
            Estamos checando com o Mercado Pago a cada poucos segundos. Assim que aprovar, o{" "}
            <b>Pro é liberado na hora</b>, sem você fazer mais nada.
          </>
        )}
      </p>

      {!manual && (
        <button
          type="button"
          onClick={onVerificar}
          disabled={conferindo}
          className="mt-5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-foreground/[0.04] px-5 text-[13.5px] font-semibold transition-colors hover:bg-foreground/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} strokeWidth={2.1} className={conferindo ? "animate-spin" : ""} />
          {conferindo ? "Verificando…" : "Verificar agora"}
        </button>
      )}

      <div>
        <button
          type="button"
          onClick={onCancelar}
          disabled={cancelando}
          className="mt-4 cursor-pointer text-[11.5px] font-medium text-muted-foreground underline-offset-2 hover:text-questly-red hover:underline disabled:opacity-60"
        >
          {cancelando ? "Cancelando…" : "Cancelar este pedido"}
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ status ativo */

function StatusPro({
  ciclo,
  expiraEm,
  fidelidadeAte,
  recemAtivado,
}: {
  ciclo: string | null;
  expiraEm: string | null;
  fidelidadeAte: string | null;
  recemAtivado: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="surface-gold mx-auto w-full max-w-xl rounded-2xl p-7 text-center"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-questly-green/10 text-questly-green ring-1 ring-questly-green/25">
          <BadgeCheck size={25} strokeWidth={2} />
        </span>
        <h2 className="mt-3.5 font-heading text-[19px] font-semibold tracking-tight">
          {recemAtivado ? "Pagamento aprovado — Pro liberado" : "Assinatura ativa"}
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Plano {ciclo === "semestral" ? "Pro Semestral" : "Pro Mensal"}.
        </p>

        <dl className="mx-auto mt-5 grid max-w-xs gap-2 text-left text-[13px]">
          <div className="flex items-center justify-between gap-4 border-t border-questly-gold/20 pt-2">
            <dt className="text-muted-foreground">Válido até</dt>
            <dd className="tnum font-semibold">{formatarData(expiraEm)}</dd>
          </div>
          {fidelidadeAte && (
            <div className="flex items-center justify-between gap-4 border-t border-questly-gold/20 pt-2">
              <dt className="text-muted-foreground">Fidelidade até</dt>
              <dd className="tnum font-semibold">{formatarData(fidelidadeAte)}</dd>
            </div>
          )}
        </dl>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
          <ShieldCheck size={13} />
          Obrigado por apoiar a Expectrum.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------ comparativo */

// Tabela Grátis × Pro montada a partir de RECURSOS_FREE — a MESMA fonte da
// verdade que a landing usa, pra marketing e produto nunca discordarem.
//
// A coluna Pro é marcada em TODA linha de propósito, e isso não é licença
// poética: RECURSOS_PRO é literalmente "tudo do plano grátis, sem limite" +
// BENEFICIOS_PRO. Não dá pra casar as duas listas por texto (as frases do
// benefício são mais longas que as do comparativo), e inventar um mapa aqui
// criaria uma segunda fonte da verdade — exatamente o que o comentário de
// lib/plano/plano.ts pede pra não fazer.
function Comparativo() {
  return (
    <section className="surface overflow-hidden rounded-2xl">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <h2 className="font-heading text-[15px] font-semibold tracking-tight">
          O que muda com o Pro
        </h2>
        <div className="flex shrink-0 items-center gap-4 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <span className="w-9 text-center">Grátis</span>
          <span className="w-9 text-center text-questly-gold">Pro</span>
        </div>
      </header>

      <ul>
        {RECURSOS_FREE.map((item) => {
          return (
            <li
              key={item.texto}
              className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-2.5 last:border-b-0 sm:px-6"
            >
              <span className="text-[13px] leading-snug">{item.texto}</span>
              <span className="flex shrink-0 items-center gap-4">
                <span className="flex w-9 justify-center">
                  {item.incluso ? (
                    <Check size={15} strokeWidth={2.6} className="text-questly-green" />
                  ) : (
                    <Minus size={15} strokeWidth={2.4} className="text-muted-foreground/45" />
                  )}
                </span>
                <span className="flex w-9 justify-center">
                  <Check size={15} strokeWidth={2.6} className="text-questly-gold" />
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
