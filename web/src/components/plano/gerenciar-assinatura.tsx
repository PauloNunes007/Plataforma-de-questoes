"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, Loader2, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  cancelarComReembolsoAction,
  cancelarRenovacaoAction,
  type ResumoAssinatura,
} from "@/lib/plano/actions";
import { DIAS_ARREPENDIMENTO, reais } from "@/lib/plano/plano";

// O MENU DE CANCELAMENTO — a porta de saída, no mesmo lugar onde fica a porta
// de entrada.
//
// Não é cortesia: o CDC art. 6º pede que cancelar custe o mesmo esforço que
// contratar, e o art. 49 dá 7 dias corridos de arrependimento em qualquer
// compra feita pela internet, sem precisar de motivo. Um "fale com o suporte"
// respondido em dias úteis não cumpre nenhum dos dois. Por isso o cancelamento
// mora AQUI, na /pro, e resolve no clique — ver o cabeçalho de
// lib/plano/actions.ts pra regra de cada caminho.
//
// A tela mostra exatamente UMA saída, a que existe pro caso do aluno, e diz
// quando não existe nenhuma. Empilhar "cancelar renovação" numa compra à vista
// (que não renova) seria oferecer um botão que não faz nada — a forma mais
// rápida de alguém achar que cancelou e continuar esperando um estorno.

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function GerenciarAssinatura({ resumo }: { resumo: ResumoAssinatura }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState<"renovacao" | "reembolso" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<string | null>(null);

  async function executar(qual: "renovacao" | "reembolso") {
    setEnviando(true);
    setErro(null);
    const res =
      qual === "renovacao" ? await cancelarRenovacaoAction() : await cancelarComReembolsoAction();
    setEnviando(false);
    setConfirmando(null);

    if ("error" in res) {
      setErro(res.error);
      return;
    }

    if (qual === "renovacao") {
      setFeito(
        `Renovação cancelada. Seu Pro continua até ${formatarData(resumo.expiraEm)} e você não será cobrado de novo.`,
      );
    } else {
      const valor = "centavos" in res && res.centavos ? ` de ${reais(res.centavos)}` : "";
      setFeito(
        `Estorno${valor} solicitado ao Mercado Pago. O prazo de devolução é do banco/emissor do cartão — no Pix costuma ser imediato, no cartão pode aparecer na próxima fatura. O acesso Pro foi encerrado.`,
      );
    }
    router.refresh();
  }

  if (feito) {
    return (
      <section className="surface mx-auto w-full max-w-xl rounded-2xl p-5">
        <p className="flex items-start gap-2 text-[13px] leading-relaxed">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-questly-green" />
          <span>{feito}</span>
        </p>
      </section>
    );
  }

  return (
    <section className="surface mx-auto w-full max-w-xl rounded-2xl p-5">
      <h3 className="font-heading text-[14px] font-semibold tracking-tight">
        Gerenciar assinatura
      </h3>

      {erro && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-[12.5px] leading-relaxed text-destructive">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </p>
      )}

      {/* Caminho 1 — arrependimento. Vem PRIMEIRO enquanto está aberto: é o
          único que devolve dinheiro, e é o que tem prazo. */}
      {resumo.arrependimento.aberto ? (
        <Bloco
          icone={<RotateCcw size={15} />}
          titulo={`Desistir e receber o dinheiro de volta (até ${formatarData(resumo.arrependimento.prazoAte)})`}
          texto={`Você tem ${DIAS_ARREPENDIMENTO} dias corridos desde o pagamento pra desistir da compra, sem precisar dar motivo (Código de Defesa do Consumidor, art. 49). A devolução é do valor integral e o acesso Pro é encerrado na hora.`}
          rotulo="Cancelar e ser reembolsado"
          destrutivo
          confirmando={confirmando === "reembolso"}
          enviando={enviando}
          onPedir={() => setConfirmando("reembolso")}
          onDesistir={() => setConfirmando(null)}
          onConfirmar={() => executar("reembolso")}
          confirmacao="O estorno é do valor integral e o Pro é encerrado agora. Confirmar?"
        />
      ) : null}

      {/* Caminho 2 — parar a próxima cobrança. Só existe com assinatura
          recorrente de verdade no gateway. */}
      {resumo.renovacaoAutomatica ? (
        <Bloco
          icone={<CalendarX2 size={15} />}
          titulo="Cancelar a renovação automática"
          texto={`O cartão deixa de ser cobrado. O período que você já pagou continua seu até ${formatarData(resumo.expiraEm)} — nada é estornado.`}
          rotulo="Cancelar renovação"
          confirmando={confirmando === "renovacao"}
          enviando={enviando}
          onPedir={() => setConfirmando("renovacao")}
          onDesistir={() => setConfirmando(null)}
          onConfirmar={() => executar("renovacao")}
          confirmacao="A cobrança automática para. Seu acesso continua até o fim do período pago. Confirmar?"
        />
      ) : null}

      {/* Nenhum dos dois: não há o que cancelar, e dizer isso é a informação
          útil. O aluno veio aqui procurando um botão — encontrar a explicação
          de por que ele não existe é melhor do que não encontrar nada. */}
      {!resumo.arrependimento.aberto && !resumo.renovacaoAutomatica && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">
            Não há cobrança automática nesta conta
          </strong>{" "}
          {resumo.ultimaCobranca
            ? `— você pagou uma vez, pelo período contratado, e nada será cobrado de novo.`
            : `— este acesso Pro não veio de uma compra (cupom ou liberação manual), então não há nada a cancelar.`}{" "}
          Seu acesso vai até {formatarData(resumo.expiraEm)}; depois disso a conta volta ao plano
          grátis sozinha.
          {resumo.ultimaCobranca
            ? ` O prazo de arrependimento de ${DIAS_ARREPENDIMENTO} dias sobre a última cobrança (${formatarData(resumo.ultimaCobranca.em)}) já passou.`
            : ""}
        </p>
      )}

      <p className="mt-4 border-t border-border pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
        Precisa de algo que não está aqui? Escreva pra{" "}
        <a className="font-medium underline" href="mailto:contato@expectrum.com.br">
          contato@expectrum.com.br
        </a>
        .
      </p>
    </section>
  );
}

function Bloco({
  icone,
  titulo,
  texto,
  rotulo,
  confirmacao,
  destrutivo = false,
  confirmando,
  enviando,
  onPedir,
  onDesistir,
  onConfirmar,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
  rotulo: string;
  confirmacao: string;
  destrutivo?: boolean;
  confirmando: boolean;
  enviando: boolean;
  onPedir: () => void;
  onDesistir: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="mt-4 border-t border-border pt-4 first:mt-3 first:border-t-0 first:pt-0">
      <p className="flex items-center gap-2 text-[13px] font-semibold">
        <span className="text-muted-foreground">{icone}</span>
        {titulo}
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{texto}</p>

      {confirmando ? (
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-[12.5px] leading-relaxed">{confirmacao}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onConfirmar}
              disabled={enviando}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60 ${
                destrutivo ? "bg-destructive" : "bg-foreground"
              }`}
            >
              {enviando && <Loader2 size={14} className="animate-spin" />}
              Sim, confirmar
            </button>
            <button
              type="button"
              onClick={onDesistir}
              disabled={enviando}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-[12.5px] font-semibold transition-colors hover:bg-muted disabled:opacity-60"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPedir}
          className="mt-3 inline-flex h-9 items-center rounded-lg border border-border px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {rotulo}
        </button>
      )}
    </div>
  );
}
