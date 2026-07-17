"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ModalAprovacao } from "./modal";
import { ErroForm } from "./erro-form";
import {
  arquivarErroAction,
  excluirErroAction,
  marcarRefeitoAction,
} from "@/lib/aprovacao/actions";
import { BANCAS, DISCIPLINAS_APROVACAO, TIPOS_ERRO } from "@/lib/aprovacao/constantes";
import { etapasPendentes, todasEtapasFeitas, type Erro, type EtapaRevisao } from "@/lib/aprovacao/tipos";

// Caderno de Erros — três abas: "Refazer hoje" (revisão espaçada 1/7/30
// dias vencida), "Todos" (não arquivados, com filtros) e "Arquivados"
// (consulta). Toda mutação atualiza o estado local no ok:true (mesma
// convenção das tarefas do dashboard — sem refetch).

const ROTULO_ETAPA: Record<EtapaRevisao, string> = { "1d": "D+1", "7d": "D+7", "30d": "D+30" };

function rotuloTipoErro(id: string): string {
  return TIPOS_ERRO.find((t) => t.id === id)?.rotulo || id;
}

const COR_TIPO: Record<string, string> = {
  conteudo: "bg-questly-red/10 text-questly-red",
  interpretacao: "bg-questly-blue/10 text-questly-blue",
  atencao: "bg-questly-orange/10 text-questly-orange",
  tempo: "bg-questly-purple/10 text-questly-purple",
};

const CAMPO_FILTRO =
  "h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none transition-colors focus:border-questly-green/60";

type Aba = "refazer" | "todos" | "arquivados";

export function ErrosView({ errosIniciais, hoje }: { errosIniciais: Erro[]; hoje: string }) {
  const [erros, setErros] = useState<Erro[]>(errosIniciais);
  const [aba, setAba] = useState<Aba>("refazer");
  const [fDisciplina, setFDisciplina] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fBanca, setFBanca] = useState("");
  const [fTema, setFTema] = useState("");
  const [modalNovo, setModalNovo] = useState(false);
  const [editando, setEditando] = useState<Erro | null>(null);

  const refazerHoje = useMemo(() => erros.filter((e) => etapasPendentes(e, hoje).length > 0), [erros, hoje]);

  const filtrados = useMemo(() => {
    const base = aba === "refazer" ? refazerHoje : erros.filter((e) => e.arquivado === (aba === "arquivados"));
    return base.filter(
      (e) =>
        (!fDisciplina || e.disciplina === fDisciplina) &&
        (!fTipo || e.tipoErro === fTipo) &&
        (!fBanca || e.banca === fBanca) &&
        (!fTema || (e.tema || "").toLowerCase().includes(fTema.toLowerCase())),
    );
  }, [aba, erros, refazerHoje, fDisciplina, fTipo, fBanca, fTema]);

  function trocarErro(atualizado: Erro) {
    setErros((lista) => lista.map((e) => (e.id === atualizado.id ? atualizado : e)));
  }

  async function marcarRefeito(erro: Erro, etapa: EtapaRevisao) {
    const patch: Partial<Erro> =
      etapa === "1d" ? { feito1d: true } : etapa === "7d" ? { feito7d: true } : { feito30d: true };
    trocarErro({ ...erro, ...patch });
    const res = await marcarRefeitoAction(erro.id, etapa, true);
    if (!res.ok) trocarErro(erro);
  }

  async function arquivar(erro: Erro, arquivado: boolean) {
    trocarErro({ ...erro, arquivado });
    const res = await arquivarErroAction(erro.id, arquivado);
    if (!res.ok) trocarErro(erro);
  }

  async function excluir(erro: Erro) {
    if (!window.confirm("Excluir esse erro do caderno? Isso não tem volta.")) return;
    const antes = erros;
    setErros((lista) => lista.filter((e) => e.id !== erro.id));
    const res = await excluirErroAction(erro.id);
    if (!res.ok) setErros(antes);
  }

  const abas: { id: Aba; rotulo: string; badge?: number }[] = [
    { id: "refazer", rotulo: "Refazer hoje", badge: refazerHoje.length },
    { id: "todos", rotulo: "Todos" },
    { id: "arquivados", rotulo: "Arquivados" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                aba === a.id
                  ? "bg-questly-green/12 text-questly-green"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {a.rotulo}
              {a.badge ? (
                <span className="tnum flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-questly-orange px-1 text-[10px] font-bold text-white">
                  {a.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setModalNovo(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-questly-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
        >
          <Plus size={16} strokeWidth={2.25} /> Novo erro
        </button>
      </div>

      {/* Filtros (valem nas três abas) */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={fDisciplina} onChange={(e) => setFDisciplina(e.target.value)} className={CAMPO_FILTRO}>
          <option value="">Disciplina: todas</option>
          {DISCIPLINAS_APROVACAO.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} className={CAMPO_FILTRO}>
          <option value="">Tipo: todos</option>
          {TIPOS_ERRO.map((t) => (
            <option key={t.id} value={t.id}>
              {t.rotulo}
            </option>
          ))}
        </select>
        <select value={fBanca} onChange={(e) => setFBanca(e.target.value)} className={CAMPO_FILTRO}>
          <option value="">Banca: todas</option>
          {BANCAS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <input
          value={fTema}
          onChange={(e) => setFTema(e.target.value)}
          placeholder="Filtrar por tema…"
          className={`${CAMPO_FILTRO} w-44`}
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="surface flex flex-col items-center gap-1.5 p-10 text-center">
          <CheckCircle2 size={22} strokeWidth={1.75} className="text-questly-green" />
          <p className="text-sm font-semibold">
            {aba === "refazer" ? "Nenhuma revisão vencida — caderno em dia." : "Nada por aqui ainda."}
          </p>
          {aba !== "arquivados" && (
            <p className="text-[12.5px] text-muted-foreground">
              Errou uma questão no simulado ou numa lista? Registra ela no caderno pra revisar em 1, 7 e 30 dias.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrados.map((erro) => (
            <ErroCard
              key={erro.id}
              erro={erro}
              hoje={hoje}
              somenteLeitura={aba === "arquivados"}
              onRefeito={(etapa) => void marcarRefeito(erro, etapa)}
              onArquivar={(v) => void arquivar(erro, v)}
              onEditar={() => setEditando(erro)}
              onExcluir={() => void excluir(erro)}
            />
          ))}
        </div>
      )}

      <ModalAprovacao aberto={modalNovo} titulo="Novo erro" onFechar={() => setModalNovo(false)}>
        <ErroForm
          onSalvo={(novo) => {
            setErros((lista) => [novo, ...lista]);
            setModalNovo(false);
          }}
          onCancelar={() => setModalNovo(false)}
        />
      </ModalAprovacao>

      <ModalAprovacao aberto={!!editando} titulo="Editar erro" onFechar={() => setEditando(null)}>
        {editando && (
          <ErroForm
            inicial={editando}
            onSalvo={(atualizado) => {
              trocarErro(atualizado);
              setEditando(null);
            }}
            onCancelar={() => setEditando(null)}
          />
        )}
      </ModalAprovacao>
    </div>
  );
}

// Linhas da resolução que são só ![...](url) viram <img>; o resto é
// texto pre-wrap. Markdown de verdade não é necessário aqui.
function ResolucaoTexto({ texto }: { texto: string }) {
  const linhas = texto.split("\n");
  return (
    <div className="flex flex-col gap-1.5">
      {linhas.map((linha, i) => {
        const img = linha.trim().match(/^!\[[^\]]*\]\((https?:\/\/\S+)\)$/);
        if (img) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={i} src={img[1]} alt="Figura da resolução" className="max-h-64 max-w-full rounded-lg object-contain" />;
        }
        return linha.trim() ? (
          <p key={i} className="whitespace-pre-wrap text-[13px] leading-relaxed">
            {linha}
          </p>
        ) : (
          <span key={i} className="h-1" />
        );
      })}
    </div>
  );
}

function ErroCard({
  erro,
  hoje,
  somenteLeitura,
  onRefeito,
  onArquivar,
  onEditar,
  onExcluir,
}: {
  erro: Erro;
  hoje: string;
  somenteLeitura: boolean;
  onRefeito: (etapa: EtapaRevisao) => void;
  onArquivar: (arquivado: boolean) => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const pendentes = etapasPendentes(erro, hoje);
  const completo = todasEtapasFeitas(erro);

  return (
    <article className="surface overflow-hidden">
      <div className="flex gap-3.5 p-4">
        {erro.imagemUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={erro.imagemUrl}
            alt=""
            className="h-20 w-24 shrink-0 cursor-pointer rounded-lg border border-border object-cover"
            onClick={() => setAberto((v) => !v)}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-questly-green/10 px-2 py-0.5 text-[11px] font-semibold text-questly-green">
              {erro.disciplina}
            </span>
            {erro.tema && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {erro.tema}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${COR_TIPO[erro.tipoErro] || "bg-muted"}`}>
              {rotuloTipoErro(erro.tipoErro)}
            </span>
            {erro.banca && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {[erro.banca, erro.provaAno, erro.provaFase && `${erro.provaFase} fase`, erro.questaoNum]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>
          {erro.conceitoChave && (
            <p className="mt-1.5 text-[13.5px] font-medium leading-snug">{erro.conceitoChave}</p>
          )}

          {/* Revisão espaçada: chips D+1/D+7/D+30 */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(["1d", "7d", "30d"] as EtapaRevisao[]).map((etapa) => {
              const feita = etapa === "1d" ? erro.feito1d : etapa === "7d" ? erro.feito7d : erro.feito30d;
              const vencida = pendentes.includes(etapa);
              if (feita) {
                return (
                  <span
                    key={etapa}
                    className="flex items-center gap-1 rounded-full bg-questly-green/10 px-2 py-0.5 text-[11px] font-semibold text-questly-green"
                  >
                    <CheckCircle2 size={11} strokeWidth={2.5} /> {ROTULO_ETAPA[etapa]}
                  </span>
                );
              }
              if (vencida && !somenteLeitura) {
                return (
                  <button
                    key={etapa}
                    type="button"
                    onClick={() => onRefeito(etapa)}
                    className="cursor-pointer rounded-full bg-questly-orange px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-95"
                  >
                    Refiz {ROTULO_ETAPA[etapa]} ✓
                  </button>
                );
              }
              return (
                <span key={etapa} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {ROTULO_ETAPA[etapa]}
                </span>
              );
            })}
            {completo && !erro.arquivado && !somenteLeitura && (
              <button
                type="button"
                onClick={() => onArquivar(true)}
                className="flex cursor-pointer items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Archive size={11} strokeWidth={2} /> Arquivar
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? "Recolher" : "Expandir"}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {aberto && (
        <div className="border-t border-border bg-muted/30 px-4 py-3.5">
          {erro.imagemUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={erro.imagemUrl} alt="Print da questão" className="mb-3 max-h-96 max-w-full rounded-lg border border-border object-contain" />
          )}
          <div className="mb-2 flex flex-wrap gap-4 text-[13px]">
            {erro.oQueMarquei && (
              <span>
                Marquei: <strong className="text-questly-red">{erro.oQueMarquei}</strong>
              </span>
            )}
            {erro.gabarito && (
              <span>
                Gabarito: <strong className="text-questly-green">{erro.gabarito}</strong>
              </span>
            )}
          </div>
          {erro.resolucao && (
            <div className="rounded-lg border border-border bg-card p-3">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Resolução
              </span>
              <ResolucaoTexto texto={erro.resolucao} />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            {!somenteLeitura ? (
              <>
                <button
                  type="button"
                  onClick={onEditar}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil size={13} strokeWidth={2} /> Editar
                </button>
                <button
                  type="button"
                  onClick={onExcluir}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-questly-red/10 hover:text-questly-red"
                >
                  <Trash2 size={13} strokeWidth={2} /> Excluir
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onArquivar(false)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArchiveRestore size={13} strokeWidth={2} /> Desarquivar
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
