"use client";

import { useEffect, useRef, useState } from "react";
import {
  avaliarElegibilidadeAuto,
  limparFormatacao,
  marcarDuplicatasNoArquivo,
  montarPayload,
  normalizarItemJson,
  normalizarTextoDup,
  validarAntesDeAprovar,
  validarItemJson,
} from "@/lib/importar/logic";
import { aprovarItemAction, importarLoteAction } from "@/lib/importar/actions";
import { ImgPicker } from "@/components/importar/img-picker";
import { PreviewCard } from "@/components/importar/preview-card";
import { LETRAS_ALTERNATIVA, type ItemImportado, type Letra, type Materia, type Topico } from "@/lib/importar/types";

const STORAGE_KEY = "questly_importar_fila_v1";
const TAMANHO_LOTE_AUTO = 200;

type ReportInfo = {
  totalArquivo: number;
  carregadas: number;
  erros: string[];
  prontasCount: number;
};

function salvarFilaLocal(fila: ItemImportado[], indiceAtual: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fila, indiceAtual, savedAt: Date.now() }));
  } catch (err) {
    console.warn("Não foi possível salvar a sessão localmente:", err);
  }
}
function carregarFilaLocal(): { fila: ItemImportado[]; indiceAtual: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function limparFilaLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}

export function Importador({
  materiasIniciais,
  topicosIniciais,
  enunciadosIniciais,
}: {
  materiasIniciais: Materia[];
  topicosIniciais: Topico[];
  enunciadosIniciais: string[];
}) {
  const [materias] = useState<Materia[]>(materiasIniciais);
  const [topicos] = useState<Topico[]>(topicosIniciais);
  const [enunciadosExistentes, setEnunciadosExistentes] = useState<Set<string>>(new Set(enunciadosIniciais));

  const [view, setView] = useState<"step1" | "revisao" | "final">("step1");
  const [jsonPaste, setJsonPaste] = useState("");
  const [materiaLotePadrao, setMateriaLotePadrao] = useState("");
  const [filaCarregadaTemp, setFilaCarregadaTemp] = useState<ItemImportado[]>([]);
  const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);
  const [importandoAuto, setImportandoAuto] = useState(false);
  const [autoProgress, setAutoProgress] = useState<{ feitas: number; total: number } | null>(null);
  const [resumeDisponivel, setResumeDisponivel] = useState<{ fila: ItemImportado[]; indiceAtual: number } | null>(null);

  const [fila, setFila] = useState<ItemImportado[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [aprovando, setAprovando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const salvarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // localStorage não existe no servidor — precisa ler depois do mount
    // (efeito), não em lazy-init do useState, senão o valor divergiria
    // entre o HTML gerado no servidor e a primeira renderização no
    // cliente (hydration mismatch).
    const salvo = carregarFilaLocal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo?.fila?.length) setResumeDisponivel(salvo);
  }, []);

  useEffect(() => {
    if (fila.length === 0) return;
    if (salvarTimeoutRef.current) clearTimeout(salvarTimeoutRef.current);
    salvarTimeoutRef.current = setTimeout(() => salvarFilaLocal(fila, indiceAtual), 300);
    return () => {
      if (salvarTimeoutRef.current) clearTimeout(salvarTimeoutRef.current);
    };
  }, [fila, indiceAtual]);

  useEffect(() => {
    if (view !== "final") return;
    const puladas = fila.filter((i) => i.status === "pulada").length;
    if (puladas === 0) limparFilaLocal();
  }, [view, fila]);

  const itemAtual = fila[indiceAtual] as ItemImportado | undefined;

  function atualizarItem(patch: Partial<ItemImportado>) {
    setFila((prev) => prev.map((it, i) => (i === indiceAtual ? { ...it, ...patch } : it)));
  }

  function atualizarAlternativaTexto(letra: Letra, valor: string) {
    if (!itemAtual) return;
    const alternativas = { ...itemAtual.alternativas };
    if (valor.trim()) alternativas[letra] = valor;
    else delete alternativas[letra];
    let gabarito = itemAtual.gabarito;
    if (gabarito === letra && !(alternativas[letra] || itemAtual.alternativasImagens[letra])) gabarito = null;
    atualizarItem({ alternativas, gabarito });
  }

  function atualizarAlternativaImagem(letra: Letra, url: string | null) {
    if (!itemAtual) return;
    const alternativasImagens = { ...itemAtual.alternativasImagens };
    if (url) alternativasImagens[letra] = url;
    else delete alternativasImagens[letra];
    let gabarito = itemAtual.gabarito;
    if (gabarito === letra && !(itemAtual.alternativas[letra] || alternativasImagens[letra])) gabarito = null;
    atualizarItem({ alternativasImagens, gabarito });
  }

  function formatarTudoClick() {
    if (!itemAtual) return;
    const alternativas = { ...itemAtual.alternativas };
    (Object.keys(alternativas) as Letra[]).forEach((l) => {
      alternativas[l] = limparFormatacao(alternativas[l]);
    });
    atualizarItem({
      enunciado: limparFormatacao(itemAtual.enunciado),
      alternativas,
      resolucao: itemAtual.resolucao ? limparFormatacao(itemAtual.resolucao) : itemAtual.resolucao,
    });
  }

  function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonPaste(String(reader.result));
    reader.onerror = () => alert("Não foi possível ler o arquivo.");
    reader.readAsText(file);
  }

  function handleCarregarClique() {
    const raw = jsonPaste.trim();
    if (!raw) {
      alert("Cole ou escolha um arquivo JSON primeiro.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      alert("JSON inválido: " + (err as Error).message);
      return;
    }
    if (!Array.isArray(parsed)) {
      alert("O JSON precisa ser uma lista de questões (array).");
      return;
    }
    if (parsed.length === 0) {
      alert("A lista está vazia.");
      return;
    }

    const erros: string[] = [];
    const carregados: ItemImportado[] = [];
    parsed.forEach((raw, i) => {
      const erro = validarItemJson(raw, i + 1);
      if (erro) {
        erros.push(erro);
        return;
      }
      carregados.push(
        normalizarItemJson(raw as Record<string, unknown>, materiaLotePadrao || null, materias, topicos),
      );
    });
    marcarDuplicatasNoArquivo(carregados);
    const prontasCount = carregados.filter((it) => avaliarElegibilidadeAuto(it, enunciadosExistentes).length === 0).length;

    setFilaCarregadaTemp(carregados);
    setReportInfo({ totalArquivo: parsed.length, carregadas: carregados.length, erros, prontasCount });
  }

  function iniciarRevisao() {
    setFila(filaCarregadaTemp);
    setIndiceAtual(0);
    setView("revisao");
  }

  async function importarAutomaticamente() {
    const prontas = filaCarregadaTemp.filter((it) => avaliarElegibilidadeAuto(it, enunciadosExistentes).length === 0);
    if (prontas.length === 0) return;

    setImportandoAuto(true);
    setAutoProgress({ feitas: 0, total: prontas.length });

    const sucedidos = new Map<ItemImportado, string | null>();
    let feitas = 0;
    let paradaPorErro = false;

    for (let i = 0; i < prontas.length; i += TAMANHO_LOTE_AUTO) {
      const lote = prontas.slice(i, i + TAMANHO_LOTE_AUTO);
      const resultado = await importarLoteAction(lote.map(montarPayload));
      if ("error" in resultado) {
        alert(
          `Deu erro importando um lote automático (itens ${i + 1}–${i + lote.length}): ${resultado.error}. As já importadas continuam salvas; esse lote e o que vier depois vão pra revisão manual.`,
        );
        paradaPorErro = true;
        break;
      }
      lote.forEach((item, idx) => sucedidos.set(item, resultado.ids[idx] ?? null));
      feitas += lote.length;
      setAutoProgress({ feitas, total: prontas.length });
    }

    setImportandoAuto(false);
    setAutoProgress(null);
    if (paradaPorErro) return;

    const novaFila = filaCarregadaTemp.map((item) =>
      sucedidos.has(item) ? { ...item, status: "aprovada" as const, dbId: sucedidos.get(item) ?? null } : item,
    );
    setFilaCarregadaTemp(novaFila);

    const novosEnunciados = new Set(enunciadosExistentes);
    novaFila.forEach((it) => {
      if (it.status === "aprovada") novosEnunciados.add(normalizarTextoDup(it.enunciado));
    });
    setEnunciadosExistentes(novosEnunciados);

    setFila(novaFila);
    const proximoPendente = novaFila.findIndex((it) => it.status === "pendente");
    if (proximoPendente === -1) {
      setView("final");
    } else {
      setIndiceAtual(proximoPendente);
      setView("revisao");
    }
  }

  function irParaAnterior() {
    if (indiceAtual <= 0) return;
    setIndiceAtual((i) => i - 1);
  }
  function irParaProxima() {
    if (indiceAtual >= fila.length - 1) {
      setView("final");
      return;
    }
    setIndiceAtual((i) => i + 1);
  }
  function pularAtual() {
    atualizarItem({ status: "pulada" });
    irParaProxima();
  }

  async function aprovarAtual() {
    if (!itemAtual) return;
    const erro = validarAntesDeAprovar(itemAtual);
    if (erro) {
      alert(erro);
      return;
    }
    const chaveDup = normalizarTextoDup(itemAtual.enunciado);
    if (chaveDup && enunciadosExistentes.has(chaveDup)) {
      if (!confirm("Já existe uma questão com esse enunciado (ou muito parecido) no banco. Aprovar mesmo assim?")) return;
    }

    setAprovando(true);
    const payload = montarPayload(itemAtual);
    const resultado = await aprovarItemAction(payload, itemAtual.dbId);
    setAprovando(false);

    if ("error" in resultado) {
      alert("Não foi possível salvar essa questão: " + resultado.error);
      return;
    }

    atualizarItem({ status: "aprovada", dbId: resultado.id });
    setEnunciadosExistentes((prev) => new Set(prev).add(chaveDup));
    irParaProxima();
  }

  function descartarSessao() {
    if (
      !confirm(
        "Descartar essa sessão de revisão? Questões já aprovadas continuam salvas no banco; as pendentes/puladas saem da fila.",
      )
    )
      return;
    limparFilaLocal();
    setFila([]);
    setIndiceAtual(0);
    setView("step1");
    setReportInfo(null);
    setFilaCarregadaTemp([]);
    setJsonPaste("");
  }

  function revisarPuladas() {
    const idx = fila.findIndex((i) => i.status === "pulada");
    if (idx === -1) return;
    setIndiceAtual(idx);
    setView("revisao");
  }

  function continuarSessaoSalva() {
    if (!resumeDisponivel) return;
    setFila(resumeDisponivel.fila);
    setIndiceAtual(Math.min(resumeDisponivel.indiceAtual, resumeDisponivel.fila.length - 1));
    setResumeDisponivel(null);
    setView("revisao");
  }
  function descartarSessaoSalva() {
    limparFilaLocal();
    setResumeDisponivel(null);
  }

  if (view === "final") {
    const aprovadas = fila.filter((i) => i.status === "aprovada").length;
    const puladas = fila.filter((i) => i.status === "pulada").length;
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center">
        <div className="mb-3 text-5xl">🎉</div>
        <h2 className="mb-2 font-heading text-2xl font-semibold">Revisão concluída</h2>
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-muted px-2 py-4">
            <div className="font-mono text-xl font-bold text-questly-green-dark">{aprovadas}</div>
            <div className="mt-1 text-[10.5px] font-bold text-muted-foreground">aprovadas</div>
          </div>
          <div className="rounded-2xl bg-muted px-2 py-4">
            <div className="font-mono text-xl font-bold text-questly-orange-dark">{puladas}</div>
            <div className="mt-1 text-[10.5px] font-bold text-muted-foreground">puladas</div>
          </div>
          <div className="rounded-2xl bg-muted px-2 py-4">
            <div className="font-mono text-xl font-bold text-foreground">{fila.length}</div>
            <div className="mt-1 text-[10.5px] font-bold text-muted-foreground">total</div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {puladas > 0 && (
            <button
              type="button"
              onClick={revisarPuladas}
              className="rounded-2xl bg-questly-blue px-6 py-3 font-heading text-sm font-semibold text-white"
            >
              Revisar puladas
            </button>
          )}
          <button
            type="button"
            onClick={descartarSessao}
            className="rounded-2xl border-2 border-border bg-card px-6 py-3 font-heading text-sm font-semibold text-muted-foreground"
          >
            Importar outro lote
          </button>
        </div>
      </div>
    );
  }

  if (view === "revisao" && itemAtual) {
    const motivos = avaliarElegibilidadeAuto(itemAtual, enunciadosExistentes);
    const aprovadas = fila.filter((i) => i.status === "aprovada").length;
    const puladas = fila.filter((i) => i.status === "pulada").length;
    const topicosMateria = topicos.filter((t) => t.materia_id === itemAtual.materiaId);

    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="font-mono text-xs font-bold text-muted-foreground">
            {indiceAtual + 1} / {fila.length}
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-questly-green transition-[width]"
              style={{ width: `${((indiceAtual + 1) / fila.length) * 100}%` }}
            />
          </div>
          <div className="shrink-0 text-xs font-bold text-questly-green-dark">{aprovadas} aprovadas</div>
          <div className="shrink-0 text-xs font-bold text-questly-orange-dark">{puladas} puladas</div>
          <button
            type="button"
            onClick={descartarSessao}
            className="shrink-0 rounded-lg border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold text-questly-red-dark"
          >
            Descartar sessão
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="rounded-[20px] border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold">Editar</h3>
                <button
                  type="button"
                  onClick={formatarTudoClick}
                  className="rounded-lg border-2 border-border bg-card px-3 py-1.5 text-xs font-extrabold text-muted-foreground"
                >
                  ✨ Formatar tudo
                </button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2.5">
                <select
                  value={itemAtual.materiaId || ""}
                  onChange={(e) => atualizarItem({ materiaId: e.target.value || null, topicoId: null })}
                  className="rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-bold"
                >
                  <option value="">Matéria...</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
                <select
                  value={itemAtual.topicoId || ""}
                  disabled={!itemAtual.materiaId}
                  onChange={(e) => atualizarItem({ topicoId: e.target.value || null })}
                  className="rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-bold disabled:opacity-50"
                >
                  <option value="">
                    {itemAtual.materiaId ? "Tópico..." : "Selecione a matéria antes"}
                  </option>
                  {topicosMateria.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2.5">
                <select
                  value={itemAtual.dificuldade}
                  onChange={(e) => atualizarItem({ dificuldade: e.target.value, dificuldadeInvalida: false })}
                  className="rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-bold"
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
                <input
                  value={itemAtual.instituicao || ""}
                  onChange={(e) => atualizarItem({ instituicao: e.target.value.trim() || null })}
                  placeholder="Instituição"
                  className="rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-semibold"
                />
                <input
                  type="number"
                  value={itemAtual.ano ?? ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    atualizarItem({ ano: Number.isNaN(v) ? null : v });
                  }}
                  placeholder="Ano"
                  className="rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-semibold"
                />
              </div>

              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Enunciado
                </span>
                <button
                  type="button"
                  onClick={() => atualizarItem({ enunciado: limparFormatacao(itemAtual.enunciado) })}
                  className="text-[11px] font-extrabold text-questly-blue-dark"
                >
                  ✨ formatar
                </button>
              </div>
              <textarea
                value={itemAtual.enunciado}
                onChange={(e) => atualizarItem({ enunciado: e.target.value })}
                rows={4}
                className="mb-3 w-full rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-semibold outline-none focus:border-questly-blue"
              />

              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                Imagem do enunciado
              </div>
              <div className="mb-4">
                <ImgPicker
                  currentUrl={itemAtual.imagemUrl}
                  pastaPrefixo="enunciado"
                  onChange={(url) => atualizarItem({ imagemUrl: url })}
                />
              </div>

              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                Alternativas (marque a correta)
              </div>
              <div className="mb-4 flex flex-col gap-3">
                {LETRAS_ALTERNATIVA.map((letra) => (
                  <div
                    key={letra}
                    className={`rounded-xl border-2 p-3 ${
                      itemAtual.gabarito === letra ? "border-questly-green bg-questly-green-light" : "border-border"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted font-heading text-xs font-bold">
                        {letra.toUpperCase()}
                      </span>
                      <textarea
                        value={itemAtual.alternativas[letra] || ""}
                        onChange={(e) => atualizarAlternativaTexto(letra, e.target.value)}
                        rows={1}
                        placeholder={`Texto da alternativa ${letra.toUpperCase()} (opcional se tiver imagem)`}
                        className="flex-1 resize-none rounded-lg border-2 border-border bg-card px-2 py-1.5 text-xs font-semibold outline-none focus:border-questly-blue"
                      />
                      <button
                        type="button"
                        title="Limpar formatação"
                        onClick={() => atualizarAlternativaTexto(letra, limparFormatacao(itemAtual.alternativas[letra]))}
                        className="shrink-0 text-sm"
                      >
                        ✨
                      </button>
                      <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <input
                          type="radio"
                          name="gabarito"
                          checked={itemAtual.gabarito === letra}
                          onChange={() => atualizarItem({ gabarito: letra })}
                          className="accent-questly-green"
                        />
                        correta
                      </label>
                    </div>
                    <ImgPicker
                      currentUrl={itemAtual.alternativasImagens[letra] || null}
                      pastaPrefixo={`alt-${letra}`}
                      onChange={(url) => atualizarAlternativaImagem(letra, url)}
                    />
                  </div>
                ))}
              </div>

              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  Resolução (opcional)
                </span>
                <button
                  type="button"
                  onClick={() => atualizarItem({ resolucao: limparFormatacao(itemAtual.resolucao) })}
                  className="text-[11px] font-extrabold text-questly-blue-dark"
                >
                  ✨ formatar
                </button>
              </div>
              <textarea
                value={itemAtual.resolucao || ""}
                onChange={(e) => atualizarItem({ resolucao: e.target.value })}
                rows={3}
                className="w-full rounded-lg border-2 border-border bg-card px-2.5 py-2 text-xs font-semibold outline-none focus:border-questly-blue"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <PreviewCard item={itemAtual} motivos={motivos} />
          </div>
        </div>

        <div className="sticky bottom-0 mt-5 flex gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
          <button
            type="button"
            disabled={indiceAtual === 0}
            onClick={irParaAnterior}
            className="w-[120px] shrink-0 rounded-2xl border-2 border-border bg-card px-4 py-3 font-heading text-sm font-bold text-muted-foreground disabled:opacity-40"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={pularAtual}
            className="w-[120px] shrink-0 rounded-2xl border-2 border-border bg-card px-4 py-3 font-heading text-sm font-bold text-muted-foreground"
          >
            Pular
          </button>
          <button
            type="button"
            disabled={aprovando}
            onClick={aprovarAtual}
            className="flex-1 rounded-2xl bg-questly-green px-6 py-3 font-heading text-sm font-semibold text-white shadow-[0_4px_0_var(--questly-green-dark)] disabled:opacity-50"
          >
            {aprovando ? "Salvando..." : "Aprovar e continuar →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 py-8">
      <h1 className="mb-1 font-heading text-2xl font-semibold">Importar questões</h1>
      <p className="mb-6 text-sm font-semibold text-muted-foreground">
        Cole ou envie um JSON com uma lista de questões. O que estiver sem pendência (sem imagem, matéria/tópico
        resolvidos, gabarito e LaTeX consistentes) pode ser importado automaticamente — o resto vai pra revisão
        manual, uma questão por vez.
      </p>

      {resumeDisponivel && (
        <div className="mb-5 rounded-2xl border-2 border-questly-blue bg-questly-blue-light p-4">
          <p className="mb-3 text-sm font-semibold text-questly-blue-dark">
            Encontramos uma revisão de {resumeDisponivel.fila.length} questões (
            {resumeDisponivel.fila.filter((i) => i.status === "pendente").length} ainda pendentes) salva neste
            navegador.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={continuarSessaoSalva}
              className="rounded-xl bg-questly-blue px-4 py-2 text-xs font-extrabold text-white"
            >
              Continuar de onde parei
            </button>
            <button
              type="button"
              onClick={descartarSessaoSalva}
              className="rounded-xl border-2 border-border bg-card px-4 py-2 text-xs font-extrabold text-muted-foreground"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-[20px] border border-border bg-card p-5">
        <textarea
          value={jsonPaste}
          onChange={(e) => setJsonPaste(e.target.value)}
          placeholder="Cole aqui o JSON (array de questões)..."
          rows={8}
          className="mb-3 w-full rounded-xl border-2 border-border bg-card px-3 py-2.5 font-mono text-xs outline-none focus:border-questly-blue"
        />
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-border bg-card px-4 py-2 text-xs font-extrabold text-muted-foreground"
          >
            Escolher arquivo .json
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={aoEscolherArquivo} />
          <select
            value={materiaLotePadrao}
            onChange={(e) => setMateriaLotePadrao(e.target.value)}
            className="rounded-xl border-2 border-border bg-card px-3 py-2 text-xs font-bold"
          >
            <option value="">Matéria padrão do lote — nenhuma</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleCarregarClique}
          className="rounded-xl bg-questly-green px-6 py-3 font-heading text-sm font-semibold text-white shadow-[0_3px_0_var(--questly-green-dark)]"
        >
          Carregar
        </button>
      </div>

      {reportInfo && (
        <div className="rounded-[20px] border border-border bg-card p-5">
          <p className="mb-1.5 text-sm font-semibold">
            {reportInfo.totalArquivo} questões no arquivo · {reportInfo.carregadas} carregadas · {reportInfo.erros.length}{" "}
            com erro de formato (não entram na fila).
          </p>
          <p className="mb-4 text-sm font-semibold text-muted-foreground">
            {reportInfo.prontasCount} prontas pra importação automática (sem imagem, sem pendências, sem duplicata) ·{" "}
            {reportInfo.carregadas - reportInfo.prontasCount} precisam da sua revisão.
          </p>

          {reportInfo.erros.length > 0 && (
            <div className="mb-4 flex flex-col gap-1.5">
              {reportInfo.erros.map((e, i) => (
                <div key={i} className="rounded-lg bg-questly-red-light px-3 py-2 text-xs font-semibold text-questly-red-dark">
                  {e}
                </div>
              ))}
            </div>
          )}

          {importandoAuto && autoProgress && (
            <div className="mb-4">
              <div className="mb-1.5 text-xs font-bold text-muted-foreground">
                {autoProgress.feitas} / {autoProgress.total} importadas automaticamente
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-questly-green transition-[width]"
                  style={{ width: `${(autoProgress.feitas / autoProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            {reportInfo.prontasCount > 0 && (
              <button
                type="button"
                disabled={importandoAuto}
                onClick={importarAutomaticamente}
                className="rounded-xl bg-questly-green px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
              >
                Importar automaticamente as {reportInfo.prontasCount} sem pendências
              </button>
            )}
            <button
              type="button"
              disabled={filaCarregadaTemp.length === 0}
              onClick={iniciarRevisao}
              className="rounded-xl border-2 border-border bg-card px-5 py-2.5 text-xs font-extrabold text-muted-foreground disabled:opacity-50"
            >
              {reportInfo.prontasCount > 0 ? "Revisar tudo manualmente (ignorar auto-importação)" : "Iniciar revisão"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
