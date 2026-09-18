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
  DESCONTO_SEMESTRAL_PCT,
  meiosAceitosTexto,
  PRECO_MENSAL_CENTAVOS,
  RECURSOS_FREE,
  reais,
  type MetodosPagamento,
  type OpcaoPlano,
} from "@/lib/plano/plano";
import { ehProDeLancamento, nomeDoPlano } from "@/lib/plano/lancamento";
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
import { BemVindoPro } from "@/components/plano/bem-vindo-pro";

type PlanosViewProps = {
  /** O que esta instalação consegue cobrar — resolvido no servidor. */
  opcoes: OpcaoPlano[];
  /** Meios que a conta do MP aceita hoje. null = não deu pra confirmar. */
  metodos: MetodosPagamento | null;
  jaEhPro: boolean;
  ciclo: string | null;
  expiraEm: string | null;
  fidelidadeAte: string | null;
  pendenteInicial: AssinaturaPendente | null;
  voltouDoCheckout: boolean;
  conferenciaInicial: ConferenciaPagamento | null;
};

// A frase de meios nasce em minúscula ("Pix, cartão de crédito ou boleto") pra
// caber no meio de uma sentença; a linha de confiança a usa como rótulo.
function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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
  const [pendente, setPendente] = useState<AssinaturaPendente | null>(
    props.pendenteInicial,
  );
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ativadoAgora, setAtivadoAgora] = useState(false);
  const [conferindo, setConferindo] = useState(false);
  const [cansou, setCansou] = useState(false);
  const [detalhe, setDetalhe] = useState<string | null>(
    props.conferenciaInicial?.detalhe ?? null,
  );
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
      const espera =
        checagens.current < POLL_CHECAGENS_RAPIDAS
          ? POLL_RAPIDO_MS
          : POLL_LENTO_MS;
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

  // Um clique, um redirect. Nada entre o botão e o Mercado Pago: o que esta
  // instalação consegue cobrar já foi decidido no servidor (ver `opcoes`),
  // então não há surpresa a avisar aqui no meio.
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

  // "Acabou de virar Pro AGORA" tem duas origens, e as duas contam: o polling
  // desta tela (`ativadoAgora`) e a conferência que o servidor já fez antes de
  // renderizar, quando o aluno volta do checkout com o pagamento aprovado
  // (`conferenciaInicial`). Sem a segunda, quem paga no cartão — aprovado na
  // hora — cairia direto no cartão seco de "assinatura ativa" e nunca veria as
  // boas-vindas; só quem paga por Pix, que passa pelo polling, veria.
  const recemAtivado =
    ativadoAgora ||
    (props.voltouDoCheckout && props.conferenciaInicial?.estado === "ativo");

  const mostrandoEspera =
    !props.jaEhPro &&
    !!pendente &&
    (estado === "processando" || estado === "indisponivel");
  const mostrandoRecusa = !props.jaEhPro && estado === "recusado";

  return (
    <div className="flex flex-col gap-10">
      {!recemAtivado && <Cabecalho jaEhPro={props.jaEhPro} />}

      {/* Logo depois do pagamento o campo de cupom vira ruído — e pior, uma
          pergunta ("será que eu podia ter pago menos?"). */}
      {!mostrandoEspera && !recemAtivado && (
        <CupomResgate onResgatado={() => router.refresh()} />
      )}

      {props.jaEhPro ? (
        recemAtivado || ehProDeLancamento({ plano_ciclo: props.ciclo }) ? (
          /* Acabou de pagar — ou está na semana de lançamento: a tela vira as
             BOAS-VINDAS, não o extrato. A semana entra aqui de propósito. Um
             aluno que ganhou Pro sem pedir não sabe o que ganhou, e um cartão
             com "válido até" não ensina: o que converte em sete dias é ele
             ABRIR as telas que só o Pro tem, e esta é a única da /pro que
             manda pra elas por link. Ver
             components/plano/bem-vindo-pro.tsx — este é o único momento em
             que o aluno está totalmente disposto a aprender o que comprou. O
             extrato (validade, fidelidade) continua logo abaixo. */
          <>
            <BemVindoPro ciclo={props.ciclo} expiraEm={props.expiraEm} />
            <StatusPro
              ciclo={props.ciclo}
              expiraEm={props.expiraEm}
              fidelidadeAte={props.fidelidadeAte}
              recemAtivado={false}
              compacto
            />
          </>
        ) : (
          <StatusPro
            ciclo={props.ciclo}
            expiraEm={props.expiraEm}
            fidelidadeAte={props.fidelidadeAte}
            recemAtivado={false}
          />
        )
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
          {/* "ou por Pix" só entra se a conta aceitar Pix: mandar um aluno
              cujo cartão acabou de ser recusado tentar um meio que não existe
              no checkout é a pior hora possível pra uma promessa vazia. */}
          {mostrandoRecusa && (
            <Aviso
              titulo="O pagamento não foi aprovado"
              texto={`${detalhe ?? "O Mercado Pago recusou a cobrança."} Nada foi cobrado — dá pra tentar de novo${
                props.metodos?.pix
                  ? ", com outro cartão ou por Pix"
                  : " com outro cartão"
              }.`}
            />
          )}
          {erro && <Aviso titulo="Não deu pra continuar" texto={erro} />}

          <div className="mx-auto grid w-full max-w-3xl gap-5 sm:grid-cols-2">
            {props.opcoes.map((opcao) => (
              <PlanoCard
                key={opcao.id}
                opcao={opcao}
                metodos={props.metodos}
                enviando={enviando === opcao.id}
                bloqueado={enviando !== null}
                onAssinar={() => assinar(opcao)}
              />
            ))}
          </div>

          <LinhaConfianca metodos={props.metodos} />
        </>
      )}

      {!recemAtivado && <Comparativo />}
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
          : // Nada de "mostra a nota que você vai tirar": o motor de projeção
            // foi removido em 2026-09-16, e a regra do lib/plano/plano.ts vale
            // pra headline também — só se anuncia o que tem gate de verdade.
            "O plano grátis já te faz passar numa matéria. O Pro tira o limite de simulados, te mostra por que você errou e abre as estatísticas que dizem onde você está — em todas elas."}
      </p>
    </header>
  );
}

/* ------------------------------------------------------------ cards/planos */

function PlanoCard({
  opcao,
  metodos,
  enviando,
  bloqueado,
  onAssinar,
}: {
  opcao: OpcaoPlano;
  metodos: MetodosPagamento | null;
  enviando: boolean;
  bloqueado: boolean;
  onAssinar: () => void;
}) {
  const destaque = opcao.destaque === "Mais popular";
  const meses = opcao.mesesCreditados;
  // Ancoragem: no semestral, o preço grande é o equivalente mensal e o mensal
  // cheio aparece riscado ao lado. A economia é derivada dos dois preços —
  // nenhum número de desconto é digitado na tela.
  const ancorado = opcao.precoMensalEquivalente < PRECO_MENSAL_CENTAVOS;
  const economiaCentavos = PRECO_MENSAL_CENTAVOS * meses - opcao.precoCentavos;

  // Como a cobrança acontece de verdade. Vale a linha porque as opções são
  // materialmente diferentes no gateway, e o aluno só descobria isso depois de
  // pagar.
  //
  // Os MEIOS saem de `metodos`, lido da conta do MP — não de uma frase fixa.
  // A versão fixa dizia "Pix" numa conta sem chave Pix cadastrada, e o aluno
  // só descobria no checkout. Mesma regra do "sem juros": não se promete o que
  // não se controla (ver lib/plano/plano.ts).
  const meios = meiosAceitosTexto(metodos);
  const comoCobra =
    opcao.forma === "recorrente"
      ? "Cobrado no cartão de crédito todo mês, até você cancelar."
      : opcao.parcelasMax > 1
        ? `Uma cobrança de ${reais(opcao.precoCentavos)} — ${meios}, ou em até ${opcao.parcelasMax}× no cartão.`
        : `Uma cobrança de ${reais(opcao.precoCentavos)} — ${meios}.`;

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

      <div className="flex items-center gap-2">
        <h3 className="font-heading text-[15px] font-semibold tracking-tight">
          {opcao.titulo}
        </h3>
        {ancorado && (
          <span className="tnum rounded-md bg-questly-green/12 px-1.5 py-[2px] text-[10px] font-bold tracking-tight text-questly-green-dark">
            −{DESCONTO_SEMESTRAL_PCT}%
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-1.5">
        <span className="pb-1.5 text-[15px] font-medium text-muted-foreground">
          R$
        </span>
        <span className="tnum font-heading text-[42px] font-semibold leading-none tracking-tight">
          {(opcao.precoMensalEquivalente / 100).toLocaleString("pt-BR", {
            minimumFractionDigits:
              opcao.precoMensalEquivalente % 100 === 0 ? 0 : 2,
          })}
        </span>
        <span className="pb-1.5 text-[13px] text-muted-foreground">
          {opcao.cobrancaLabel}
        </span>
        {ancorado && (
          <span className="tnum pb-[7px] text-[13px] text-muted-foreground/60 line-through">
            {reais(PRECO_MENSAL_CENTAVOS)}
          </span>
        )}
      </div>

      <p className="tnum mt-1.5 text-[12px] font-medium">
        {reais(opcao.precoCentavos)} · {meses} {meses === 1 ? "mês" : "meses"}{" "}
        de Pro
        {economiaCentavos > 0 && (
          <span className="text-questly-green-dark">
            {" "}
            · economia de {reais(economiaCentavos)}
          </span>
        )}
      </p>

      <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground/85">
        {comoCobra}
      </p>

      <p className="mt-4 min-h-[3.25rem] border-t border-border pt-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
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
            {/* "Assinar" só quando assinatura é o que acontece de verdade —
                no avulso o botão promete o que ele entrega: acesso liberado. */}
            {opcao.forma === "recorrente" ? "Assinar" : "Liberar o Pro"}
            <ArrowRight size={15} strokeWidth={2.2} />
          </>
        )}
      </button>
    </div>
  );
}

function LinhaConfianca({ metodos }: { metodos: MetodosPagamento | null }) {
  const itens = [
    { icone: CreditCard, texto: capitalizar(meiosAceitosTexto(metodos)) },
    {
      icone: Lock,
      texto: "Checkout do Mercado Pago — não guardamos seu cartão",
    },
    {
      icone: ShieldCheck,
      texto: "Liberação automática assim que o pagamento aprovar",
    },
  ];
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {itens.map((i) => (
        <li
          key={i.texto}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
        >
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
          {enviando ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            "Aplicar"
          )}
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
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {texto}
        </p>
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
  const nomeCiclo =
    pendente.ciclo === "semestral" ? "Pro Semestral" : "Pro Mensal";
  const porMes =
    pendente.forma === "recorrente" && pendente.ciclo === "semestral";

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
            O pagamento online está indisponível no momento. Seu pedido ficou
            salvo e será confirmado manualmente — não pague duas vezes.
          </>
        ) : cansou ? (
          <>
            Se você acabou de pagar, o Mercado Pago pode levar mais alguns
            minutos. Pode fechar esta página:{" "}
            <b>assim que ele aprovar, o Pro entra sozinho</b> na sua conta.
          </>
        ) : (
          <>
            Estamos checando com o Mercado Pago a cada poucos segundos. Assim
            que aprovar, o <b>Pro é liberado na hora</b>, sem você fazer mais
            nada.
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
          <RefreshCw
            size={14}
            strokeWidth={2.1}
            className={conferindo ? "animate-spin" : ""}
          />
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
  compacto = false,
}: {
  ciclo: string | null;
  expiraEm: string | null;
  fidelidadeAte: string | null;
  recemAtivado: boolean;
  /** Logo depois do pagamento, este cartão é só o EXTRATO embaixo das
   *  boas-vindas — sem ícone gigante nem título competindo com elas. */
  compacto?: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className={`surface-gold mx-auto w-full max-w-xl rounded-2xl text-center ${compacto ? "p-5" : "p-7"}`}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {!compacto && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-questly-green/10 text-questly-green ring-1 ring-questly-green/25">
              <BadgeCheck size={25} strokeWidth={2} />
            </span>
            <h2 className="mt-3.5 font-heading text-[19px] font-semibold tracking-tight">
              {recemAtivado
                ? "Pagamento aprovado — Pro liberado"
                : ehProDeLancamento({ plano_ciclo: ciclo })
                  ? "Semana Pro de lançamento"
                  : "Assinatura ativa"}
            </h2>
          </>
        )}
        <p
          className={`text-[13px] text-muted-foreground ${compacto ? "" : "mt-1"}`}
        >
          Plano {nomeDoPlano(ciclo)}.
        </p>

        <dl className="mx-auto mt-5 grid max-w-xs gap-2 text-left text-[13px]">
          <div className="flex items-center justify-between gap-4 border-t border-questly-gold/20 pt-2">
            <dt className="text-muted-foreground">Válido até</dt>
            <dd className="tnum font-semibold">{formatarData(expiraEm)}</dd>
          </div>
          {fidelidadeAte && (
            <div className="flex items-center justify-between gap-4 border-t border-questly-gold/20 pt-2">
              <dt className="text-muted-foreground">Fidelidade até</dt>
              <dd className="tnum font-semibold">
                {formatarData(fidelidadeAte)}
              </dd>
            </div>
          )}
        </dl>

        {/* O fecho segue o que a linha REALMENTE é. Agradecer o apoio de quem
            ainda não pagou nada soa a cobrança disfarçada; e quem está na
            semana de lançamento precisa ler, aqui também, que ela acaba. */}
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
          <ShieldCheck size={13} />
          {ehProDeLancamento({ plano_ciclo: ciclo })
            ? "Liberado no lançamento. Depois dessa data a conta volta ao grátis — sem cobrança automática."
            : "Obrigado por apoiar a Expectrum."}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------ comparativo */

// Tabela Grátis × Pro montada a partir de RECURSOS_FREE — a MESMA fonte da
// verdade que a landing usa, pra marketing e produto nunca discordarem.
//
// A coluna Pro marca ✓ em quase toda linha, e isso não é licença poética:
// RECURSOS_PRO é literalmente "tudo do plano grátis, sem limite" +
// BENEFICIOS_PRO.
//
// A exceção são as linhas com TETO NUMÉRICO (2026-09-17). Quando o grátis
// passou a ter "30 questões por dia", o ✓ do lado do Pro passou a afirmar que
// o Pro também tem esse teto — um comparativo confundindo a favor do plano
// grátis. Essas linhas trazem `item.pro` ("Ilimitado", "Sem limite"), escrito
// na MESMA fonte da verdade (lib/plano/plano.ts), e não num mapa daqui.
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
                    <Check
                      size={15}
                      strokeWidth={2.6}
                      className="text-questly-green"
                    />
                  ) : (
                    <Minus
                      size={15}
                      strokeWidth={2.4}
                      className="text-muted-foreground/45"
                    />
                  )}
                </span>
                <span className="flex w-9 justify-center">
                  {item.pro ? (
                    <span className="text-center text-[10px] font-bold leading-tight text-questly-gold">
                      {item.pro}
                    </span>
                  ) : (
                    <Check
                      size={15}
                      strokeWidth={2.6}
                      className="text-questly-gold"
                    />
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
