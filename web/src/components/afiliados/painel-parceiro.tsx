"use client";

// Painel do parceiro (/parceiro). É a tela que sustenta a relação: alguém está
// divulgando a plataforma pro próprio público e precisa confiar no número que
// aparece aqui — sem ligar pra perguntar, sem esperar o fim do mês pra
// descobrir quanto deu.
//
// Três escolhas de conteúdo:
//
//  • o link vem PRIMEIRO, com botão de copiar. É a única coisa que o parceiro
//    volta aqui pra pegar quando vai gravar um story;
//  • a projeção do mês mostra a faixa atual E quantas vendas faltam pra
//    próxima. A faixa é retroativa ao mês inteiro, então essa frase não é
//    enfeite: é literalmente quanto ele ganha a mais se vender mais duas;
//  • as vendas aparecem sem NADA do aluno — nem nome, nem inicial, nem curso.
//    O painel diz "uma venda de R$ 60 em 14/09", e é tudo que ele precisa
//    saber. Comissão não compra o cadastro de ninguém (ver a migração).
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCopy,
  Clock,
  Info,
  Link2,
  MousePointerClick,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarChavePixAction } from "@/lib/afiliados/actions";
import {
  DIAS_LIBERACAO,
  DIA_REPASSE,
  linkParceiro,
  linkParceiroCurto,
  MINIMO_REPASSE_CENTAVOS,
  rotuloCompetencia,
} from "@/lib/afiliados/afiliados";
import { reais } from "@/lib/plano/plano";
import type { PainelParceiro } from "@/lib/afiliados/painel";

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  pendente: { texto: "Liberando", classe: "bg-muted text-muted-foreground" },
  aprovada: { texto: "Aprovada", classe: "bg-questly-green/15 text-questly-green-dark dark:text-questly-green" },
  paga: { texto: "Paga", classe: "bg-questly-gold/15 text-questly-gold" },
  cancelada: { texto: "Cancelada", classe: "bg-questly-red/10 text-questly-red-dark" },
};

export function PainelParceiroView({ painel }: { painel: PainelParceiro }) {
  const { parceiro, mes } = painel;

  // `location.origin` no cliente: se NEXT_PUBLIC_APP_URL não estiver definida
  // no deploy, o parceiro copiaria um link pro domínio errado e perderia as
  // indicações sem nunca saber por quê (mesma razão do linkConvite).
  const base = typeof window !== "undefined" ? window.location.origin : undefined;
  const link = linkParceiro(parceiro.codigo, base);

  const [copiado, setCopiado] = useState(false);
  const [pix, setPix] = useState(parceiro.chavePix ?? "");
  const [pixSalvo, setPixSalvo] = useState(false);
  const [erroPix, setErroPix] = useState<string | null>(null);
  const [salvando, iniciarSalvar] = useTransition();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  function salvarPix() {
    setErroPix(null);
    setPixSalvo(false);
    iniciarSalvar(async () => {
      const res = await salvarChavePixAction(pix);
      if ("error" in res) setErroPix(res.error);
      else setPixSalvo(true);
    });
  }

  const conversao =
    painel.cliques.total > 0
      ? Math.round((painel.indicacoes.total / painel.cliques.total) * 100)
      : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-6">
      <PageHeader
        titulo="Sua parceria"
        descricao={`Tudo que veio do seu link, venda por venda. ${
          parceiro.ativo ? "" : "Sua parceria está pausada — o link não libera mais bônus."
        }`}
      />

      {/* -------------------------------------------------------- o link */}
      <section className="surface mt-6 rounded-2xl px-5 py-5">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <Link2 className="size-4 text-questly-green-dark dark:text-questly-green" strokeWidth={2.2} />
          Seu link
        </h2>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-border bg-muted/40 px-4 py-3 text-[14px] font-semibold">
            {linkParceiroCurto(parceiro.codigo, base)}
          </code>
          <Button onClick={copiar} className="h-11 shrink-0 px-5">
            {copiado ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
          Quem cria conta por ele ganha {parceiro.diasBonus} dias de Pro na hora, e toda compra
          dessa pessoa nos próximos {parceiro.janelaMeses} meses paga comissão pra você.
        </p>
      </section>

      {/* ----------------------------------------------------- o dinheiro */}
      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <Cartao
          icone={<Wallet className="size-4" strokeWidth={2.2} />}
          rotulo="Liberado a receber"
          valor={reais(painel.aReceberCentavos)}
          detalhe={
            painel.atingiuMinimo
              ? `Entra no próximo repasse, até o dia ${DIA_REPASSE}`
              : `Acumula até chegar a ${reais(MINIMO_REPASSE_CENTAVOS)}`
          }
          destaque
        />
        <Cartao
          icone={<Clock className="size-4" strokeWidth={2.2} />}
          rotulo="Ainda liberando"
          valor={reais(painel.pendenteCentavos)}
          detalhe={`${DIAS_LIBERACAO} dias após cada venda (prazo de arrependimento do aluno)`}
        />
        <Cartao
          icone={<BadgeCheck className="size-4" strokeWidth={2.2} />}
          rotulo="Já recebido"
          valor={reais(painel.recebidoCentavos)}
          detalhe="Soma de todos os Pix enviados"
        />
      </section>

      {/* -------------------------------------------------- mês corrente */}
      <section className="surface mt-4 rounded-2xl px-5 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <TrendingUp
              className="size-4 text-questly-green-dark dark:text-questly-green"
              strokeWidth={2.2}
            />
            {rotuloCompetencia(mes.competencia)}
          </h2>
          <span className="text-[12.5px] text-muted-foreground">
            faixa {mes.faixa.nome} ·{" "}
            <strong className="tnum text-foreground">{mes.percentual}%</strong>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
              Vendas no mês
            </p>
            <p className="tnum font-heading text-[26px] leading-none font-semibold">{mes.vendas}</p>
          </div>
          <div>
            <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
              Comissão do mês
            </p>
            <p className="tnum font-heading text-[26px] leading-none font-semibold text-questly-green-dark dark:text-questly-green">
              {reais(mes.comissaoCentavos)}
            </p>
          </div>
        </div>

        {mes.faltamProxima ? (
          <p className="mt-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed">
            Faltam <strong className="tnum">{mes.faltamProxima.faltam}</strong>{" "}
            {mes.faltamProxima.faltam === 1 ? "venda" : "vendas"} pra faixa{" "}
            <strong>{mes.faltamProxima.faixa.nome}</strong> ({mes.faltamProxima.faixa.percentual}%)
            — e ela vale pro mês inteiro, inclusive pras vendas que já entraram.
          </p>
        ) : null}
      </section>

      {/* ---------------------------------------------------- alcance */}
      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <Cartao
          icone={<MousePointerClick className="size-4" strokeWidth={2.2} />}
          rotulo="Cliques no link"
          valor={String(painel.cliques.total)}
          detalhe={`${painel.cliques.ultimos30} nos últimos 30 dias`}
        />
        <Cartao
          icone={<Users className="size-4" strokeWidth={2.2} />}
          rotulo="Contas criadas"
          valor={String(painel.indicacoes.total)}
          detalhe={
            conversao !== null
              ? `${conversao}% de quem clicou · ${painel.indicacoes.ultimos30} nos últimos 30 dias`
              : `${painel.indicacoes.ultimos30} nos últimos 30 dias`
          }
        />
        <Cartao
          icone={<BadgeCheck className="size-4" strokeWidth={2.2} />}
          rotulo="Viraram assinantes"
          valor={String(painel.compradores)}
          detalhe="Contas indicadas que já compraram ao menos uma vez"
        />
      </section>

      {/* ------------------------------------------------------- vendas */}
      <section className="surface mt-4 rounded-2xl px-5 py-5">
        <h2 className="text-[14px] font-semibold">Últimas vendas</h2>
        {painel.ultimasVendas.length ? (
          <ul className="mt-3 divide-y divide-border">
            {painel.ultimasVendas.map((v) => {
              const st = ROTULO_STATUS[v.status] ?? ROTULO_STATUS.pendente;
              return (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold">
                      Assinatura de <span className="tnum">{reais(v.brutoCentavos)}</span>
                    </p>
                    <p className="tnum text-[12px] text-muted-foreground">{dataCurta(v.em)}</p>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase " + st.classe
                    }
                  >
                    {st.texto}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            Nenhuma venda ainda. Assim que alguém que entrou pelo seu link assinar, ela aparece aqui
            no mesmo minuto — e fica {DIAS_LIBERACAO} dias liberando antes de virar saldo.
          </p>
        )}
      </section>

      {/* ------------------------------------------------------ repasses */}
      {painel.repasses.length ? (
        <section className="surface mt-4 rounded-2xl px-5 py-5">
          <h2 className="text-[14px] font-semibold">Repasses</h2>
          <ul className="mt-3 divide-y divide-border">
            {painel.repasses.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold">{rotuloCompetencia(r.competencia)}</p>
                  <p className="tnum text-[12px] text-muted-foreground">
                    {r.qtdComissoes} {r.qtdComissoes === 1 ? "venda" : "vendas"}
                    {r.pagoEm ? ` · pago em ${dataCurta(r.pagoEm)}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-[14px] font-bold">{reais(r.valorCentavos)}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                    {r.status === "pago" ? "pago" : "a pagar"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ----------------------------------------------------- chave pix */}
      <section className="surface mt-4 rounded-2xl px-5 py-5">
        <h2 className="text-[14px] font-semibold">Chave Pix do repasse</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          É pra onde o dinheiro vai. CPF/CNPJ, e-mail, telefone ou chave aleatória.
        </p>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <Input
            value={pix}
            onChange={(e) => {
              setPix(e.target.value);
              setPixSalvo(false);
            }}
            placeholder="sua chave Pix"
            className="h-11 flex-1"
          />
          <Button onClick={salvarPix} disabled={salvando} className="h-11 shrink-0 px-5">
            {pixSalvo ? <Check className="size-4" /> : null}
            {salvando ? "Salvando…" : pixSalvo ? "Salvo" : "Salvar"}
          </Button>
        </div>
        {erroPix ? <p className="mt-2 text-[12.5px] text-questly-red-dark">{erroPix}</p> : null}
      </section>

      {/* --------------------------------------------------------- regras */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
        <Info className="mt-px size-4 shrink-0" strokeWidth={2} />
        <p>
          A faixa é recalculada todo mês e vale pro mês inteiro. Comissão cancelada é venda que o
          aluno desfez dentro do prazo legal de arrependimento — nunca é cobrada de volta de você.{" "}
          <Link
            href="/parceria"
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            Ver as regras completas
          </Link>
          .
        </p>
      </div>

      <Link
        href="/parceria"
        className={buttonVariants({ variant: "ghost" }) + " mt-4 text-[13px]"}
      >
        Material e regras do programa
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function Cartao({
  icone,
  rotulo,
  valor,
  detalhe,
  destaque,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  detalhe: string;
  destaque?: boolean;
}) {
  return (
    <div className="surface rounded-2xl px-5 py-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icone}
        <span className="text-[11.5px] font-semibold tracking-wide uppercase">{rotulo}</span>
      </div>
      <p
        className={
          "tnum font-heading mt-2 text-[24px] leading-none font-semibold " +
          (destaque ? "text-questly-green-dark dark:text-questly-green" : "")
        }
      >
        {valor}
      </p>
      <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">{detalhe}</p>
    </div>
  );
}
