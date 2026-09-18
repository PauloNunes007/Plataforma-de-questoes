"use client";

// Gestão do programa de parceiros (/admin/afiliados). A tela responde três
// perguntas, nesta ordem de importância:
//
//   1. quanto eu DEVO a cada parceiro agora (e quanto ele me trouxe em troca —
//      as duas colunas lado a lado, porque comissão só faz sentido olhada
//      contra a receita que ela comprou);
//   2. quem está vendendo e quem só pegou o link e sumiu;
//   3. fechar o mês e marcar o Pix como pago.
//
// O fechamento é o único botão irreversível daqui: ele carimba o percentual em
// cada comissão e agrupa tudo num repasse. Por isso ele diz, antes, quanto vai
// fechar — e recusa sozinho quando o saldo não bate o piso do programa.
import { useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  ClipboardCopy,
  Handshake,
  Loader2,
  Plus,
  Wallet,
} from "lucide-react";
import { AdminTabs } from "@/components/admin/admin-tabs";
import {
  atualizarAfiliadoAdminAction,
  criarAfiliadoAdminAction,
  fecharRepasseAdminAction,
  marcarRepassePagoAdminAction,
  type AfiliadoAdmin,
  type RepasseAdmin,
} from "@/lib/admin/actions-afiliados";
import {
  codigoSugerido,
  DIAS_BONUS_PADRAO,
  FAIXAS,
  JANELA_MESES_PADRAO,
  linkParceiroCurto,
  linkPainelParceiro,
  rotuloCompetencia,
} from "@/lib/afiliados/afiliados";
import { reais } from "@/lib/plano/plano";

export function AfiliadosLista({
  afiliadosIniciais,
  repassesIniciais,
}: {
  afiliadosIniciais: AfiliadoAdmin[];
  repassesIniciais: RepasseAdmin[];
}) {
  const [afiliados, setAfiliados] = useState(afiliadosIniciais);
  const [repasses, setRepasses] = useState(repassesIniciais);
  const [mostrarForm, setMostrarForm] = useState(afiliadosIniciais.length === 0);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const devido = afiliados.reduce((s, a) => s + a.aReceberCentavos, 0);
  const receita = afiliados.reduce((s, a) => s + a.receitaCentavos, 0);

  async function alternarAtivo(a: AfiliadoAdmin) {
    setOcupado(a.id);
    const res = await atualizarAfiliadoAdminAction(a.id, { ativo: !a.ativo });
    setOcupado(null);
    if ("error" in res) return setAviso(res.error);
    setAfiliados((prev) => prev.map((x) => (x.id === a.id ? { ...x, ativo: !x.ativo } : x)));
  }

  async function fechar(a: AfiliadoAdmin) {
    setAviso(null);
    setOcupado(a.id);
    const res = await fecharRepasseAdminAction(a.id);
    setOcupado(null);
    if ("error" in res) return setAviso(res.error);
    setAviso(
      `Repasse de ${reais(res.valorCentavos)} gerado pra ${a.nome} (${res.qtd} ${
        res.qtd === 1 ? "venda" : "vendas"
      }). Faça o Pix e marque como pago.`,
    );
    setRepasses((prev) => [
      {
        id: res.pagamentoId,
        afiliadoId: a.id,
        competencia: new Date().toISOString().slice(0, 8) + "01",
        valorCentavos: res.valorCentavos,
        qtdComissoes: res.qtd,
        status: "a_pagar",
        pagoEm: null,
        comprovante: null,
      },
      ...prev,
    ]);
    setAfiliados((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, aReceberCentavos: 0 } : x)),
    );
  }

  async function marcarPago(r: RepasseAdmin) {
    const comprovante = window.prompt("Identificação do Pix (opcional):") ?? null;
    setOcupado(r.id);
    const res = await marcarRepassePagoAdminAction(r.id, comprovante);
    setOcupado(null);
    if ("error" in res) return setAviso(res.error);
    setRepasses((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, status: "pago", pagoEm: new Date().toISOString() } : x,
      ),
    );
  }

  return (
    <div className="casca py-7 lg:py-9">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-purple/12 text-questly-purple">
            <Handshake size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Parceiros</h1>
            <p className="text-[13px] text-muted-foreground">
              Quem divulga a plataforma, quanto trouxe e quanto está pra receber.
            </p>
          </div>
        </div>
        <AdminTabs />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Resumo rotulo="A repassar agora" valor={reais(devido)} destaque />
        <Resumo rotulo="Receita trazida por parceiros" valor={reais(receita)} />
        <Resumo
          rotulo="Parceiros ativos"
          valor={String(afiliados.filter((a) => a.ativo).length)}
        />
      </div>

      {aviso ? (
        <p className="mb-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed">
          {aviso}
        </p>
      ) : null}

      {mostrarForm ? (
        <FormNovoParceiro
          onCriado={(a) => {
            setAfiliados((prev) => [a, ...prev]);
            setMostrarForm(false);
          }}
          onCancelar={() => setMostrarForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg bg-questly-purple px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <Plus size={14} strokeWidth={2.4} />
          Novo parceiro
        </button>
      )}

      {afiliados.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Handshake size={22} strokeWidth={1.9} />
          </span>
          <p className="text-sm font-medium">Nenhum parceiro ainda</p>
          <p className="max-w-[320px] text-[13px] leading-relaxed text-muted-foreground">
            Cadastre o perfil, mande o link dele e aponte o convite de 1 dia (/convite/AFILIADO) pra
            ele conhecer a plataforma por dentro antes de decidir.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {afiliados.map((a) => (
            <LinhaParceiro
              key={a.id}
              afiliado={a}
              repasses={repasses.filter((r) => r.afiliadoId === a.id)}
              ocupado={ocupado}
              onAlternar={() => alternarAtivo(a)}
              onFechar={() => fechar(a)}
              onMarcarPago={marcarPago}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Resumo({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="surface rounded-2xl px-5 py-4">
      <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        {rotulo}
      </p>
      <p
        className={
          "tnum font-heading mt-1.5 text-[22px] leading-none font-semibold " +
          (destaque ? "text-questly-green-dark dark:text-questly-green" : "")
        }
      >
        {valor}
      </p>
    </div>
  );
}

function LinhaParceiro({
  afiliado: a,
  repasses,
  ocupado,
  onAlternar,
  onFechar,
  onMarcarPago,
}: {
  afiliado: AfiliadoAdmin;
  repasses: RepasseAdmin[];
  ocupado: string | null;
  onAlternar: () => void;
  onFechar: () => void;
  onMarcarPago: (r: RepasseAdmin) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [copiadoPainel, setCopiadoPainel] = useState(false);
  const link = linkParceiroCurto(a.codigo);
  const linkPainel = linkPainelParceiro();

  async function copiar() {
    try {
      await navigator.clipboard.writeText("https://" + link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setCopiado(false);
    }
  }

  async function copiarPainel() {
    try {
      await navigator.clipboard.writeText(linkPainel);
      setCopiadoPainel(true);
      setTimeout(() => setCopiadoPainel(false), 1800);
    } catch {
      setCopiadoPainel(false);
    }
  }

  return (
    <div className="surface rounded-2xl px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
            {a.nome}
            {a.instagram ? (
              <span className="text-[12.5px] font-medium text-muted-foreground">
                @{a.instagram}
              </span>
            ) : null}
            {!a.ativo ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-bold uppercase">
                pausado
              </span>
            ) : null}
            {!a.vinculado ? (
              <span className="rounded-full bg-questly-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-questly-gold uppercase">
                sem conta
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={copiar}
            className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {copiado ? <Check size={13} /> : <ClipboardCopy size={13} />}
            {link}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              a repassar
            </p>
            <p className="tnum text-[17px] font-bold text-questly-green-dark dark:text-questly-green">
              {reais(a.aReceberCentavos)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label="Detalhes"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              size={16}
              className={"transition-transform " + (aberto ? "rotate-180" : "")}
            />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground">
        <Metrica rotulo="cliques" valor={a.cliques} />
        <Metrica rotulo="contas" valor={a.indicacoes} />
        <Metrica rotulo="vendas" valor={a.vendas} />
        <span>
          receita <strong className="tnum text-foreground">{reais(a.receitaCentavos)}</strong>
        </span>
        <span>
          pendente <strong className="tnum text-foreground">{reais(a.pendenteCentavos)}</strong>
        </span>
        <span>
          já pago <strong className="tnum text-foreground">{reais(a.pagoCentavos)}</strong>
        </span>
      </div>

      {aberto ? (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-muted-foreground">
            <span>
              bônus{" "}
              <strong className="text-foreground">
                {a.diasBonus > 0 ? `${a.diasBonus} dias (exceção negociada)` : "nenhum (padrão)"}
              </strong>
            </span>
            <span>
              janela <strong className="text-foreground">{a.janelaMeses} meses</strong>
            </span>
            <span>
              comissão{" "}
              <strong className="text-foreground">
                {a.percentualFixo !== null ? `${a.percentualFixo}% fixo` : "tabela por faixa"}
              </strong>
            </span>
            <span>
              Pix <strong className="text-foreground">{a.chavePix || "não informada"}</strong>
            </span>
            {a.email ? (
              <span>
                e-mail <strong className="text-foreground">{a.email}</strong>
              </span>
            ) : null}
          </div>

          <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
            <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
              Link do painel (privado — manda só pro parceiro)
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {a.vinculado
                ? "Onde ele vê cliques, vendas e quanto está pra receber."
                : `Ainda "sem conta": só funciona depois que ele criar a conta da Expectrum com${
                    a.email ? ` o e-mail ${a.email}` : " o e-mail cadastrado aqui"
                  } e abrir este link uma vez — é isso que vincula o painel a ele.`}
            </p>
            <button
              type="button"
              onClick={copiarPainel}
              className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-questly-purple underline-offset-2 hover:underline"
            >
              {copiadoPainel ? <Check size={13} /> : <ClipboardCopy size={13} />}
              {linkPainel.replace(/^https?:\/\//, "")}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={ocupado === a.id || a.aReceberCentavos <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-questly-purple px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
            >
              {ocupado === a.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wallet size={14} strokeWidth={2.2} />
              )}
              Fechar repasse
            </button>
            <button
              type="button"
              onClick={onAlternar}
              disabled={ocupado === a.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-muted disabled:opacity-50"
            >
              {a.ativo ? "Pausar parceria" : "Reativar"}
            </button>
          </div>

          {repasses.length ? (
            <ul className="mt-4 divide-y divide-border">
              {repasses.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="text-[13px] font-semibold">{rotuloCompetencia(r.competencia)}</p>
                    <p className="tnum text-[11.5px] text-muted-foreground">
                      {r.qtdComissoes} {r.qtdComissoes === 1 ? "venda" : "vendas"}
                      {r.comprovante ? ` · ${r.comprovante}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tnum text-[13.5px] font-bold">{reais(r.valorCentavos)}</span>
                    {r.status === "pago" ? (
                      <span className="rounded-full bg-questly-green/15 px-2.5 py-1 text-[11px] font-bold text-questly-green-dark uppercase dark:text-questly-green">
                        pago
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarcarPago(r)}
                        disabled={ocupado === r.id}
                        className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        Marcar pago
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <span>
      {rotulo} <strong className="tnum text-foreground">{valor}</strong>
    </span>
  );
}

function FormNovoParceiro({
  onCriado,
  onCancelar,
}: {
  onCriado: (a: AfiliadoAdmin) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [codigo, setCodigo] = useState("");
  const [email, setEmail] = useState("");
  const [diasBonus, setDiasBonus] = useState(String(DIAS_BONUS_PADRAO));
  const [percentualFixo, setPercentualFixo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function criar() {
    setErro(null);
    iniciar(async () => {
      const res = await criarAfiliadoAdminAction({
        nome,
        codigo: codigo || codigoSugerido(instagram || nome),
        instagram: instagram || null,
        email: email || null,
        diasBonus: Number(diasBonus) || DIAS_BONUS_PADRAO,
        percentualFixo: percentualFixo ? Number(percentualFixo) : null,
        janelaMeses: JANELA_MESES_PADRAO,
        observacao: null,
      });
      if ("error" in res) return setErro(res.error);
      onCriado({
        id: res.id,
        codigo: codigo || codigoSugerido(instagram || nome),
        nome,
        instagram: instagram || null,
        email: email || null,
        diasBonus: Number(diasBonus) || DIAS_BONUS_PADRAO,
        percentualFixo: percentualFixo ? Number(percentualFixo) : null,
        janelaMeses: JANELA_MESES_PADRAO,
        chavePix: null,
        ativo: true,
        observacao: null,
        criadoEm: new Date().toISOString(),
        vinculado: false,
        cliques: 0,
        indicacoes: 0,
        vendas: 0,
        aReceberCentavos: 0,
        pendenteCentavos: 0,
        pagoCentavos: 0,
        receitaCentavos: 0,
      });
    });
  }

  return (
    <div className="surface mb-5 rounded-2xl px-5 py-5">
      <h2 className="text-[14px] font-semibold">Novo parceiro</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Nome do perfil" valor={nome} onChange={setNome} placeholder="Física UFF Resumos" />
        <Campo
          rotulo="Instagram (sem @)"
          valor={instagram}
          onChange={(v) => {
            setInstagram(v);
            if (!codigo) setCodigo(codigoSugerido(v));
          }}
          placeholder="fisica.uff"
        />
        <Campo
          rotulo="Código do link"
          valor={codigo}
          onChange={setCodigo}
          placeholder={codigoSugerido(instagram || nome) || "FISICAUFF"}
        />
        <Campo
          rotulo="E-mail (vincula o painel)"
          valor={email}
          onChange={setEmail}
          placeholder="perfil@email.com"
        />
        <Campo
          rotulo="Bônus em dias (0 = padrão, sem bônus)"
          valor={diasBonus}
          onChange={setDiasBonus}
          placeholder="0"
        />
        <Campo
          rotulo={`% fixo (vazio = faixas ${FAIXAS[0].percentual}–${FAIXAS[FAIXAS.length - 1].percentual}%)`}
          valor={percentualFixo}
          onChange={setPercentualFixo}
          placeholder="vazio"
        />
      </div>

      {erro ? <p className="mt-3 text-[12.5px] text-questly-red-dark">{erro}</p> : null}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={criar}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-questly-purple px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 disabled:opacity-50"
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Criar parceiro
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        {rotulo}
      </span>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-xl border border-border bg-background px-3 text-[13.5px] outline-none focus:border-questly-purple"
      />
    </label>
  );
}
