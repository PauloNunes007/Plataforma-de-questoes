"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ClipboardPaste, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { comprimirImagem } from "@/lib/importar/comprimir-imagem";
import { salvarErroAction, uploadImagemErroAction } from "@/lib/aprovacao/actions";
import {
  BANCAS,
  DISCIPLINAS_APROVACAO,
  FASES,
  SUGESTOES_TEMA,
  TIPOS_ERRO,
  type TipoErro,
} from "@/lib/aprovacao/constantes";
import type { Erro } from "@/lib/aprovacao/tipos";

// Formulário de erro — usado na página /aprovacao/erros e no modal do
// botão flutuante "+ Erro rápido". A área de imagem aceita Ctrl+V
// (colar print), arrastar arquivo ou escolher; o upload comprime pra
// JPEG no cliente (mesma comprimirImagem do importador) e sobe pro
// bucket erros-imagens via Server Action.

const CAMPO =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-questly-green/60 focus:ring-2 focus:ring-questly-green/15";

function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">{children}</span>;
}

export function ErroForm({
  inicial,
  onSalvo,
  onCancelar,
}: {
  inicial?: Erro | null;
  onSalvo: (erro: Erro) => void;
  onCancelar?: () => void;
}) {
  const [imagemUrl, setImagemUrl] = useState<string | null>(inicial?.imagemUrl ?? null);
  const [disciplina, setDisciplina] = useState(inicial?.disciplina ?? "");
  const [tema, setTema] = useState(inicial?.tema ?? "");
  const [banca, setBanca] = useState(inicial?.banca ?? "");
  const [provaAno, setProvaAno] = useState(inicial?.provaAno ? String(inicial.provaAno) : "");
  const [provaFase, setProvaFase] = useState(inicial?.provaFase ?? "");
  const [questaoNum, setQuestaoNum] = useState(inicial?.questaoNum ?? "");
  const [oQueMarquei, setOQueMarquei] = useState(inicial?.oQueMarquei ?? "");
  const [gabarito, setGabarito] = useState(inicial?.gabarito ?? "");
  const [tipoErro, setTipoErro] = useState<TipoErro | "">(inicial?.tipoErro ?? "");
  const [resolucao, setResolucao] = useState(inicial?.resolucao ?? "");
  const [conceitoChave, setConceitoChave] = useState(inicial?.conceitoChave ?? "");

  const [enviandoImg, setEnviandoImg] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const sugestoesTema = useMemo(() => SUGESTOES_TEMA[disciplina] || [], [disciplina]);
  const datalistId = useId();

  async function subirArquivo(file: File): Promise<string | null> {
    setEnviandoImg(true);
    setMensagem(null);
    try {
      const blob = await comprimirImagem(file);
      const fd = new FormData();
      fd.append("file", new File([blob], "print.jpg", { type: "image/jpeg" }));
      const res = await uploadImagemErroAction(fd);
      if ("url" in res) return res.url;
      setMensagem(res.error);
      return null;
    } catch {
      setMensagem("Não consegui ler essa imagem.");
      return null;
    } finally {
      setEnviandoImg(false);
    }
  }

  async function tratarArquivoPrincipal(file: File | null | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = await subirArquivo(file);
    if (url) setImagemUrl(url);
  }

  function arquivoDoClipboard(e: React.ClipboardEvent): File | null {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    return item?.getAsFile() ?? null;
  }

  // Colar imagem dentro da resolução vira markdown ![figura](url).
  async function colarNaResolucao(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = arquivoDoClipboard(e);
    if (!file) return;
    e.preventDefault();
    const url = await subirArquivo(file);
    if (url) setResolucao((r) => `${r ? `${r}\n` : ""}![figura](${url})`);
  }

  async function salvar() {
    if (!disciplina) {
      setMensagem("Escolha a disciplina.");
      return;
    }
    if (!tipoErro) {
      setMensagem("Classifique o tipo do erro.");
      return;
    }
    setSalvando(true);
    setMensagem(null);
    const res = await salvarErroAction({
      id: inicial?.id ?? null,
      imagemUrl,
      disciplina,
      tema: tema || null,
      banca: banca || null,
      provaAno: provaAno ? Number(provaAno) : null,
      provaFase: provaFase || null,
      questaoNum: questaoNum || null,
      oQueMarquei: oQueMarquei || null,
      gabarito: gabarito || null,
      tipoErro,
      resolucao: resolucao || null,
      conceitoChave: conceitoChave || null,
    });
    setSalvando(false);
    if (res.ok && res.erro) {
      onSalvo(res.erro);
    } else {
      setMensagem("Não consegui salvar. Confira a migração supabase_modo_aprovacao.sql e tente de novo.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Print da questão — destaque no topo, como o fluxo real de uso:
          tirou o print, cola aqui primeiro. */}
      <div
        role="button"
        tabIndex={0}
        onPaste={(e) => {
          const file = arquivoDoClipboard(e);
          if (file) {
            e.preventDefault();
            void tratarArquivoPrincipal(file);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void tratarArquivoPrincipal(e.dataTransfer.files?.[0]);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputArquivo.current?.click();
        }}
        className="relative flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-4 text-center outline-none transition-colors focus:border-questly-green/60 hover:border-questly-green/50"
        onClick={() => inputArquivo.current?.click()}
      >
        {imagemUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagemUrl} alt="Print da questão" className="max-h-56 rounded-lg object-contain" />
            <button
              type="button"
              aria-label="Remover imagem"
              onClick={(e) => {
                e.stopPropagation();
                setImagemUrl(null);
              }}
              className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-questly-red"
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </>
        ) : enviandoImg ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Enviando imagem…
          </span>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-questly-green/12 text-questly-green">
              <ClipboardPaste size={18} strokeWidth={1.9} />
            </span>
            <p className="text-[13px] font-semibold">Clique aqui e cole o print (Ctrl+V)</p>
            <p className="text-[12px] text-muted-foreground">
              <Upload size={12} className="mr-1 inline" strokeWidth={2} />
              …ou arraste / escolha um arquivo
            </p>
          </>
        )}
        <input
          ref={inputArquivo}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void tratarArquivoPrincipal(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <Rotulo>Disciplina *</Rotulo>
          <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} className={CAMPO}>
            <option value="">Selecionar…</option>
            {DISCIPLINAS_APROVACAO.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <Rotulo>Tema</Rotulo>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            list={datalistId}
            placeholder="Ex.: Trigonometria"
            className={CAMPO}
          />
          <datalist id={datalistId}>
            {sugestoesTema.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block">
          <Rotulo>Banca</Rotulo>
          <select value={banca} onChange={(e) => setBanca(e.target.value)} className={CAMPO}>
            <option value="">—</option>
            {BANCAS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <Rotulo>Ano</Rotulo>
          <input
            type="number"
            value={provaAno}
            onChange={(e) => setProvaAno(e.target.value)}
            placeholder="2024"
            className={CAMPO}
          />
        </label>
        <label className="block">
          <Rotulo>Fase</Rotulo>
          <select value={provaFase} onChange={(e) => setProvaFase(e.target.value)} className={CAMPO}>
            <option value="">—</option>
            {FASES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <Rotulo>Questão nº</Rotulo>
          <input value={questaoNum} onChange={(e) => setQuestaoNum(e.target.value)} placeholder="Q17" className={CAMPO} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <Rotulo>O que marquei</Rotulo>
          <input value={oQueMarquei} onChange={(e) => setOQueMarquei(e.target.value)} placeholder="B" className={CAMPO} />
        </label>
        <label className="block">
          <Rotulo>Gabarito</Rotulo>
          <input value={gabarito} onChange={(e) => setGabarito(e.target.value)} placeholder="D" className={CAMPO} />
        </label>
      </div>

      <div>
        <Rotulo>Tipo de erro *</Rotulo>
        <div className="flex flex-wrap gap-2">
          {TIPOS_ERRO.map((t) => {
            const ativo = tipoErro === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipoErro(t.id)}
                aria-pressed={ativo}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  ativo
                    ? "border-questly-green/40 bg-questly-green/12 text-questly-green"
                    : "border-border text-muted-foreground hover:border-questly-green/30 hover:text-foreground"
                }`}
              >
                {t.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <Rotulo>Resolução (aceita colar imagem — vira figura no card)</Rotulo>
        <textarea
          value={resolucao}
          onChange={(e) => setResolucao(e.target.value)}
          onPaste={(e) => void colarNaResolucao(e)}
          rows={4}
          placeholder="Passo a passo da resolução certa…"
          className={`${CAMPO} resize-y font-mono text-[13px]`}
        />
      </label>

      <label className="block">
        <Rotulo>Conceito-chave (1 frase)</Rotulo>
        <input
          value={conceitoChave}
          onChange={(e) => setConceitoChave(e.target.value)}
          placeholder="Ex.: Em MRUV, a área do gráfico v×t é o deslocamento."
          className={CAMPO}
        />
      </label>

      {mensagem && (
        <p className="rounded-lg bg-questly-red/10 px-3 py-2 text-[13px] font-medium text-questly-red">{mensagem}</p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={() => void salvar()}
          disabled={salvando || enviandoImg}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-questly-green px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#0c1512]"
        >
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} strokeWidth={2} />}
          {inicial?.id ? "Salvar alterações" : "Salvar erro"}
        </button>
      </div>
    </div>
  );
}
