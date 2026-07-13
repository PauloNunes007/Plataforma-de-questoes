"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileJson,
  FileText,
  PartyPopper,
  RotateCcw,
  Scissors,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  avaliarElegibilidadeAuto,
  construirIndiceDuplicatas,
  limparFormatacao,
  marcarDuplicatasNoArquivo,
  montarPayload,
  normalizarItemJson,
  normalizarTextoDup,
  validarAntesDeAprovar,
  validarItemJson,
  verificarDuplicata,
} from "@/lib/importar/logic";
import { aprovarItemAction, importarLoteAction, uploadImagemQuestaoAction } from "@/lib/importar/actions";
import { comprimirImagem } from "@/lib/importar/comprimir-imagem";
import { ImgPicker } from "@/components/importar/img-picker";
import { TikzPicker } from "@/components/importar/tikz-picker";
import { PreviewCard } from "@/components/importar/preview-card";
import {
  PdfRecortador,
  normalizarNomeArquivo,
  type AlvoRecorte,
  type ArquivoPdf,
} from "@/components/importar/pdf-recortador";
import { LETRAS_ALTERNATIVA, type ItemImportado, type Letra, type Materia, type Topico } from "@/lib/importar/types";

const STORAGE_KEY = "questly_importar_fila_v1";
const TAMANHO_LOTE_AUTO = 200;

const BTN_PRIMARIO =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512]";
const BTN_SECUNDARIO =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50";
const INPUT =
  "rounded-lg border border-border bg-card px-2.5 py-2 text-xs outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20";

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

function AbaImagemTikz({ aba, onMudar }: { aba: "imagem" | "tikz" | undefined; onMudar: (aba: "imagem" | "tikz") => void }) {
  const atual = aba ?? "imagem";
  return (
    <div className="flex gap-0.5 rounded-lg bg-muted p-0.5 text-[10.5px] font-semibold">
      {(["imagem", "tikz"] as const).map((opcao) => (
        <button
          key={opcao}
          type="button"
          onClick={() => onMudar(opcao)}
          className={`rounded-md px-2.5 py-1 uppercase tracking-wide transition-colors ${
            atual === opcao ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {opcao === "imagem" ? "Imagem" : "TikZ"}
        </button>
      ))}
    </div>
  );
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
  // Índice tokenizado só é reconstruído quando o conjunto de enunciados
  // existentes muda (nova aprovação) — não a cada tecla digitada no card.
  const indiceExistentes = useMemo(() => construirIndiceDuplicatas(enunciadosExistentes), [enunciadosExistentes]);

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
  // Aba Imagem/TikZ escolhida por figura ("enunciado" ou a letra da
  // alternativa) — chave própria por item pra não vazar a escolha de uma
  // questão pra outra ao navegar na fila.
  const [abaFigura, setAbaFigura] = useState<Record<string, "imagem" | "tikz">>({});

  // PDFs de origem carregados na sessão (só em memória — o recortador lê a
  // figura direto deles em vez de a IA redesenhar em TikZ). Não persiste em
  // localStorage: ArrayBuffer não serializa e provas são grandes.
  const [arquivosPdf, setArquivosPdf] = useState<ArquivoPdf[]>([]);
  const [alvoRecorte, setAlvoRecorte] = useState<AlvoRecorte | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (!itemAtual) return;
    const inicial: Record<string, "imagem" | "tikz"> = {
      enunciado: itemAtual.tikzCode && !itemAtual.imagemUrl ? "tikz" : "imagem",
    };
    LETRAS_ALTERNATIVA.forEach((l) => {
      inicial[l] = itemAtual.alternativasTikz[l] && !itemAtual.alternativasImagens[l] ? "tikz" : "imagem";
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAbaFigura(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceAtual]);

  function atualizarAlternativaTikz(letra: Letra, codigo: string | null) {
    if (!itemAtual) return;
    const alternativasTikz = { ...itemAtual.alternativasTikz };
    if (codigo) alternativasTikz[letra] = codigo;
    else delete alternativasTikz[letra];
    atualizarItem({ alternativasTikz });
  }

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

  async function aoEscolherPdfs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // permite re-selecionar o mesmo arquivo depois
    if (files.length === 0) return;
    const novos: ArquivoPdf[] = [];
    for (const f of files) {
      try {
        novos.push({ nome: f.name, data: await f.arrayBuffer() });
      } catch {
        alert(`Não foi possível ler o PDF "${f.name}".`);
      }
    }
    setArquivosPdf((prev) => {
      const porNome = new Map(prev.map((a) => [a.nome, a]));
      novos.forEach((a) => porNome.set(a.nome, a));
      return Array.from(porNome.values());
    });
  }

  // Nome do PDF que casa com o `fonte_arquivo` da questão atual (match
  // tolerante); null se nenhum bater, e aí o recortador deixa escolher.
  function pdfCasadoDoItem(item: ItemImportado | undefined): string | null {
    if (!item?.fonteArquivo || arquivosPdf.length === 0) return null;
    const alvo = normalizarNomeArquivo(item.fonteArquivo);
    const achado = arquivosPdf.find((a) => normalizarNomeArquivo(a.nome) === alvo);
    return achado?.nome ?? null;
  }

  async function usarRecorte(alvo: AlvoRecorte, blob: Blob) {
    const prefixo = alvo.tipo === "enunciado" ? "enunciado" : `alt-${alvo.letra}`;
    const file = new File([blob], "recorte.jpg", { type: "image/jpeg" });
    const comprimido = await comprimirImagem(file);
    const formData = new FormData();
    formData.append("file", comprimido, "recorte.jpg");
    formData.append("pastaPrefixo", prefixo);
    const resultado = await uploadImagemQuestaoAction(formData);
    if ("error" in resultado) {
      alert("Falha ao enviar o recorte: " + resultado.error);
      return;
    }
    if (alvo.tipo === "enunciado") atualizarItem({ imagemUrl: resultado.url });
    else atualizarAlternativaImagem(alvo.letra, resultado.url);
    setAlvoRecorte(null);
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
    const prontasCount = carregados.filter((it) => avaliarElegibilidadeAuto(it, indiceExistentes).length === 0).length;

    setFilaCarregadaTemp(carregados);
    setReportInfo({ totalArquivo: parsed.length, carregadas: carregados.length, erros, prontasCount });
  }

  function iniciarRevisao() {
    setFila(filaCarregadaTemp);
    setIndiceAtual(0);
    setView("revisao");
  }

  async function importarAutomaticamente() {
    const prontas = filaCarregadaTemp.filter((it) => avaliarElegibilidadeAuto(it, indiceExistentes).length === 0);
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
    // Sem dbId: é uma questão nova, ainda não salva nessa sessão — se já tem
    // dbId a comparação encontraria a própria questão no índice. Bloqueio
    // definitivo (sem confirm() pra contornar) — a única saída é editar o
    // enunciado até ele deixar de bater com algo existente, ou pular o item.
    if (!itemAtual.dbId) {
      const duplicata = verificarDuplicata(itemAtual.enunciado, indiceExistentes);
      if (duplicata) {
        alert(
          duplicata.tipo === "exata"
            ? "Essa questão já existe no banco com o mesmo enunciado. Edite o enunciado se for uma questão diferente, ou pule esse item."
            : "Já existe uma questão muito parecida com essa no banco (possível duplicata). Edite o enunciado se for uma questão diferente, ou pule esse item.",
        );
        return;
      }
    }

    const chaveDup = normalizarTextoDup(itemAtual.enunciado);
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-questly-green-light">
            <PartyPopper size={26} strokeWidth={1.75} className="text-questly-green" />
          </span>
          <h2 className="mb-1 text-xl font-semibold tracking-tight">Revisão concluída</h2>
          <p className="mb-6 text-sm text-muted-foreground">Tudo pronto — suas questões já estão no banco.</p>
          <div className="mb-7 grid grid-cols-3 gap-2.5">
            <StatBox valor={aprovadas} label="aprovadas" cor="text-questly-green-dark" />
            <StatBox valor={puladas} label="puladas" cor="text-questly-orange-dark" />
            <StatBox valor={fila.length} label="total" cor="text-foreground" />
          </div>
          <div className="flex flex-col gap-2.5">
            {puladas > 0 && (
              <button
                type="button"
                onClick={revisarPuladas}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-questly-blue px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
              >
                <RotateCcw size={15} strokeWidth={2} /> Revisar puladas
              </button>
            )}
            <button type="button" onClick={descartarSessao} className={`${BTN_SECUNDARIO} py-3`}>
              Importar outro lote
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === "revisao" && itemAtual) {
    const motivos = avaliarElegibilidadeAuto(itemAtual, indiceExistentes);
    const aprovadas = fila.filter((i) => i.status === "aprovada").length;
    const puladas = fila.filter((i) => i.status === "pulada").length;
    const topicosMateria = topicos.filter((t) => t.materia_id === itemAtual.materiaId);

    return (
      <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-2.5">
          <div className="flex items-center gap-4">
            <div className="tnum shrink-0 text-xs font-semibold text-muted-foreground">
              {indiceAtual + 1} / {fila.length}
            </div>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-questly-green"
                animate={{ width: `${((indiceAtual + 1) / fila.length) * 100}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tnum inline-flex items-center gap-1.5 text-xs font-medium text-questly-green-dark">
              <Check size={13} strokeWidth={2.5} /> {aprovadas} aprovadas
            </span>
            <span className="tnum text-xs font-medium text-questly-orange-dark">{puladas} puladas</span>
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <FileText size={13} strokeWidth={1.75} />
              {arquivosPdf.length > 0 ? `${arquivosPdf.length} PDF${arquivosPdf.length > 1 ? "s" : ""}` : "Carregar PDFs"}
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={aoEscolherPdfs}
            />
            <button
              type="button"
              onClick={descartarSessao}
              className="ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-questly-red-dark transition-colors hover:bg-questly-red-light"
            >
              <Trash2 size={13} strokeWidth={1.75} /> Descartar sessão
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold tracking-tight">Editar</h3>
                <button type="button" onClick={formatarTudoClick} className={BTN_SECUNDARIO}>
                  <Sparkles size={13} strokeWidth={1.75} /> Formatar tudo
                </button>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <select
                  value={itemAtual.materiaId || ""}
                  onChange={(e) => atualizarItem({ materiaId: e.target.value || null, topicoId: null })}
                  className={`${INPUT} font-medium`}
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
                  className={`${INPUT} font-medium disabled:opacity-50`}
                >
                  <option value="">{itemAtual.materiaId ? "Tópico..." : "Selecione a matéria antes"}</option>
                  {topicosMateria.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <input
                  value={itemAtual.subtopico || ""}
                  onChange={(e) => atualizarItem({ subtopico: e.target.value.trim() || null })}
                  placeholder="Subtópico (opcional, ex: Regra da cadeia)"
                  className={`${INPUT} w-full`}
                />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <select
                  value={itemAtual.dificuldade}
                  onChange={(e) => atualizarItem({ dificuldade: e.target.value, dificuldadeInvalida: false })}
                  className={`${INPUT} font-medium`}
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
                <input
                  value={itemAtual.instituicao || ""}
                  onChange={(e) => atualizarItem({ instituicao: e.target.value.trim() || null })}
                  placeholder="Instituição"
                  className={INPUT}
                />
                <input
                  type="number"
                  value={itemAtual.ano ?? ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    atualizarItem({ ano: Number.isNaN(v) ? null : v });
                  }}
                  placeholder="Ano"
                  className={`${INPUT} tnum`}
                />
              </div>

              <div className="mb-1.5 flex items-center justify-between">
                <span className="kicker">Enunciado</span>
                <button
                  type="button"
                  onClick={() => atualizarItem({ enunciado: limparFormatacao(itemAtual.enunciado) })}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-questly-green-dark transition-opacity hover:opacity-80"
                >
                  <Sparkles size={11} strokeWidth={2} /> formatar
                </button>
              </div>
              <textarea
                value={itemAtual.enunciado}
                onChange={(e) => atualizarItem({ enunciado: e.target.value })}
                rows={4}
                className={`${INPUT} mb-4 w-full`}
              />

              <div className="mb-1.5 flex items-center justify-between">
                <span className="kicker">Imagem do enunciado</span>
                <AbaImagemTikz aba={abaFigura.enunciado} onMudar={(a) => setAbaFigura((prev) => ({ ...prev, enunciado: a }))} />
              </div>
              <div className="mb-4">
                {abaFigura.enunciado === "tikz" ? (
                  <TikzPicker
                    code={itemAtual.tikzCode}
                    currentUrl={itemAtual.imagemUrl}
                    onCodeChange={(codigo) => atualizarItem({ tikzCode: codigo })}
                    onUrlChange={(url) => atualizarItem({ imagemUrl: url })}
                  />
                ) : (
                  <ImgPicker
                    currentUrl={itemAtual.imagemUrl}
                    pastaPrefixo="enunciado"
                    onChange={(url) => atualizarItem({ imagemUrl: url })}
                    onRecortarPdf={arquivosPdf.length > 0 ? () => setAlvoRecorte({ tipo: "enunciado" }) : undefined}
                  />
                )}
              </div>

              <div className="kicker mb-2">Alternativas (marque a correta)</div>
              <div className="mb-4 flex flex-col gap-2.5">
                {LETRAS_ALTERNATIVA.map((letra) => (
                  <div
                    key={letra}
                    className={`rounded-xl border p-3 transition-colors ${
                      itemAtual.gabarito === letra ? "border-questly-green/60 bg-questly-green-light" : "border-border"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                        {letra.toUpperCase()}
                      </span>
                      <textarea
                        value={itemAtual.alternativas[letra] || ""}
                        onChange={(e) => atualizarAlternativaTexto(letra, e.target.value)}
                        rows={1}
                        placeholder={`Texto da alternativa ${letra.toUpperCase()} (opcional se tiver imagem)`}
                        className={`${INPUT} flex-1 resize-none`}
                      />
                      <button
                        type="button"
                        title="Limpar formatação"
                        onClick={() => atualizarAlternativaTexto(letra, limparFormatacao(itemAtual.alternativas[letra]))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Sparkles size={14} strokeWidth={1.75} />
                      </button>
                      <label className="flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <input
                          type="radio"
                          name="gabarito"
                          checked={itemAtual.gabarito === letra}
                          onChange={() => atualizarItem({ gabarito: letra })}
                          className="h-4 w-4 accent-questly-green"
                        />
                        correta
                      </label>
                    </div>
                    <div className="mb-1.5 flex justify-end">
                      <AbaImagemTikz
                        aba={abaFigura[letra]}
                        onMudar={(a) => setAbaFigura((prev) => ({ ...prev, [letra]: a }))}
                      />
                    </div>
                    {abaFigura[letra] === "tikz" ? (
                      <TikzPicker
                        code={itemAtual.alternativasTikz[letra] || null}
                        currentUrl={itemAtual.alternativasImagens[letra] || null}
                        onCodeChange={(codigo) => atualizarAlternativaTikz(letra, codigo)}
                        onUrlChange={(url) => atualizarAlternativaImagem(letra, url)}
                      />
                    ) : (
                      <ImgPicker
                        currentUrl={itemAtual.alternativasImagens[letra] || null}
                        pastaPrefixo={`alt-${letra}`}
                        onChange={(url) => atualizarAlternativaImagem(letra, url)}
                        onRecortarPdf={arquivosPdf.length > 0 ? () => setAlvoRecorte({ tipo: "alt", letra }) : undefined}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-1.5 flex items-center justify-between">
                <span className="kicker">Resolução (opcional)</span>
                <button
                  type="button"
                  onClick={() => atualizarItem({ resolucao: limparFormatacao(itemAtual.resolucao) })}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-questly-green-dark transition-opacity hover:opacity-80"
                >
                  <Sparkles size={11} strokeWidth={2} /> formatar
                </button>
              </div>
              <textarea
                value={itemAtual.resolucao || ""}
                onChange={(e) => atualizarItem({ resolucao: e.target.value })}
                rows={3}
                className={`${INPUT} w-full`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <PreviewCard item={itemAtual} motivos={motivos} />
          </div>
        </div>

        {/* bottom-16 (não bottom-0) em telas < lg pra não empilhar em cima
            da MobileBottomNav fixa; em lg+ ela não existe, então volta a
            colar no rodapé da viewport. Empilha em coluna no celular —
            "Aprovar" (a ação principal) em cima e cheia, Anterior/Pular
            embaixo — pra nenhuma virar um botão espremido. */}
        <div className="sticky bottom-16 mt-5 flex flex-col gap-2 border-t border-border bg-background/95 py-4 backdrop-blur sm:flex-row sm:gap-3 lg:bottom-0">
          <button
            type="button"
            disabled={aprovando}
            onClick={aprovarAtual}
            className="order-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-questly-green px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512] sm:order-2 sm:flex-1"
          >
            {aprovando ? "Salvando..." : "Aprovar e continuar"}
            {!aprovando && <ArrowRight size={15} strokeWidth={2} />}
          </button>
          <div className="order-2 flex gap-2 sm:order-1 sm:contents">
            <button
              type="button"
              disabled={indiceAtual === 0}
              onClick={irParaAnterior}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 sm:w-[130px] sm:flex-none"
            >
              <ArrowLeft size={15} strokeWidth={2} /> Anterior
            </button>
            <button
              type="button"
              onClick={pularAtual}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted sm:w-[130px] sm:flex-none"
            >
              Pular
            </button>
          </div>
        </div>

        {alvoRecorte && (
          <PdfRecortador
            arquivos={arquivosPdf}
            nomeInicial={pdfCasadoDoItem(itemAtual)}
            paginaInicial={itemAtual.fontePagina}
            alvoInicial={alvoRecorte}
            onRecortar={usarRecorte}
            onFechar={() => setAlvoRecorte(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Importar questões</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Cole ou envie um JSON com uma lista de questões. O que estiver sem pendência (sem imagem, matéria/tópico
        resolvidos, gabarito e LaTeX consistentes) pode ser importado automaticamente — o resto vai pra revisão manual,
        uma questão por vez.
      </p>

      {resumeDisponivel && (
        <div className="surface-brand mb-5 rounded-2xl p-4">
          <p className="mb-3 text-sm font-medium">
            Encontramos uma revisão de {resumeDisponivel.fila.length} questões (
            {resumeDisponivel.fila.filter((i) => i.status === "pendente").length} ainda pendentes) salva neste
            navegador.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={continuarSessaoSalva}
              className="inline-flex items-center gap-1.5 rounded-xl bg-questly-blue px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
            >
              <RotateCcw size={13} strokeWidth={2} /> Continuar de onde parei
            </button>
            <button type="button" onClick={descartarSessaoSalva} className={BTN_SECUNDARIO}>
              Descartar
            </button>
          </div>
        </div>
      )}

      <div className="surface mb-4 p-5">
        <textarea
          value={jsonPaste}
          onChange={(e) => setJsonPaste(e.target.value)}
          placeholder="Cole aqui o JSON (array de questões)..."
          rows={8}
          className="mb-3 w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-xs outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20"
        />
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={() => fileInputRef.current?.click()} className={BTN_SECUNDARIO}>
            <FileJson size={14} strokeWidth={1.75} /> Escolher arquivo .json
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={aoEscolherArquivo} />
          <select
            value={materiaLotePadrao}
            onChange={(e) => setMateriaLotePadrao(e.target.value)}
            className={`${INPUT} font-medium`}
          >
            <option value="">Matéria padrão do lote — nenhuma</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={() => pdfInputRef.current?.click()} className={BTN_SECUNDARIO}>
              <FileText size={14} strokeWidth={1.75} /> Carregar PDFs de origem
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={aoEscolherPdfs}
            />
            {arquivosPdf.length > 0 && (
              <span className="tnum text-xs font-medium text-questly-green-dark">
                {arquivosPdf.length} PDF{arquivosPdf.length > 1 ? "s" : ""} carregado{arquivosPdf.length > 1 ? "s" : ""}
              </span>
            )}
            {arquivosPdf.length > 0 && (
              <button
                type="button"
                onClick={() => setArquivosPdf([])}
                className="text-xs font-medium text-questly-red-dark transition-opacity hover:opacity-80"
              >
                limpar
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <Scissors size={11} strokeWidth={1.75} className="mr-0.5 inline align-[-1px]" />
            Carregue as provas/listas em PDF pra <strong>recortar as figuras direto da fonte</strong> na revisão — sem
            redesenhar em TikZ. As questões com <code>fonte_arquivo</code>/<code>fonte_pagina</code> já abrem na página
            certa.
          </p>
        </div>
        <button type="button" onClick={handleCarregarClique} className={BTN_PRIMARIO}>
          <Upload size={15} strokeWidth={2} /> Carregar
        </button>
      </div>

      {reportInfo && (
        <div className="surface p-5">
          <p className="mb-1.5 text-sm font-medium">
            {reportInfo.totalArquivo} questões no arquivo · {reportInfo.carregadas} carregadas · {reportInfo.erros.length}{" "}
            com erro de formato (não entram na fila).
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            {reportInfo.prontasCount} prontas pra importação automática (sem imagem, sem pendências, sem duplicata) ·{" "}
            {reportInfo.carregadas - reportInfo.prontasCount} precisam da sua revisão.
          </p>

          {reportInfo.erros.length > 0 && (
            <div className="mb-4 flex flex-col gap-1.5">
              {reportInfo.erros.map((e, i) => (
                <div key={i} className="rounded-lg bg-questly-red-light px-3 py-2 text-xs font-medium text-questly-red-dark">
                  {e}
                </div>
              ))}
            </div>
          )}

          {importandoAuto && autoProgress && (
            <div className="mb-4">
              <div className="tnum mb-1.5 text-xs font-medium text-muted-foreground">
                {autoProgress.feitas} / {autoProgress.total} importadas automaticamente
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-questly-green transition-[width]"
                  style={{ width: `${(autoProgress.feitas / autoProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            {reportInfo.prontasCount > 0 && (
              <button type="button" disabled={importandoAuto} onClick={importarAutomaticamente} className={BTN_PRIMARIO}>
                <Sparkles size={14} strokeWidth={2} /> Importar as {reportInfo.prontasCount} sem pendências
              </button>
            )}
            <button type="button" disabled={filaCarregadaTemp.length === 0} onClick={iniciarRevisao} className={BTN_SECUNDARIO}>
              {reportInfo.prontasCount > 0 ? "Revisar tudo manualmente" : "Iniciar revisão"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ valor, label, cor }: { valor: string | number; label: string; cor: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-4">
      <div className={`tnum text-xl font-semibold tracking-tight ${cor}`}>{valor}</div>
      <div className="mt-1 text-[10.5px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
