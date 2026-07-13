"use client";

import { useRef, useState } from "react";
import { ImageIcon, Scissors } from "lucide-react";
import { comprimirImagem } from "@/lib/importar/comprimir-imagem";
import { uploadImagemQuestaoAction } from "@/lib/importar/actions";

// Portado de renderImgPicker() em js/importar.js — upload de arquivo,
// colar uma URL, ou colar (Ctrl+V) a imagem direto da área de
// transferência (útil pra recorte de PDF/print). `onRecortarPdf`, quando
// fornecido, adiciona o botão "Recortar do PDF" que arma esse picker como
// alvo do recorte no PdfRecortador (ver importador.tsx).
export function ImgPicker({
  currentUrl,
  pastaPrefixo,
  onChange,
  onRecortarPdf,
}: {
  currentUrl: string | null;
  pastaPrefixo: string;
  onChange: (url: string | null) => void;
  onRecortarPdf?: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || "");
  const [imgFalhou, setImgFalhou] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processarArquivo(file: File | null | undefined) {
    if (!file) return;
    setEnviando(true);
    setErro(false);
    try {
      const blob = await comprimirImagem(file);
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");
      formData.append("pastaPrefixo", pastaPrefixo);
      const resultado = await uploadImagemQuestaoAction(formData);
      setEnviando(false);
      if ("error" in resultado) {
        setErro(true);
        return;
      }
      setUrlInput(resultado.url);
      setImgFalhou(false);
      onChange(resultado.url);
    } catch (err) {
      console.error("Erro ao enviar imagem:", err);
      setEnviando(false);
      setErro(true);
    }
  }

  function aoColar(e: React.ClipboardEvent<HTMLDivElement>) {
    const itens = e.clipboardData?.items;
    if (!itens) return;
    let itemImagem: DataTransferItem | null = null;
    for (let i = 0; i < itens.length; i++) {
      if (itens[i].type?.startsWith("image/")) {
        itemImagem = itens[i];
        break;
      }
    }
    if (!itemImagem) return;
    e.preventDefault();
    processarArquivo(itemImagem.getAsFile());
  }

  return (
    <div className="flex gap-3 rounded-xl border border-dashed border-border p-3">
      <div
        tabIndex={0}
        onPaste={aoColar}
        title="Clique aqui e cole (Ctrl+V) uma imagem copiada"
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground outline-none focus:ring-2 focus:ring-questly-green/40"
      >
        {currentUrl && !imgFalhou ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgFalhou(true)}
          />
        ) : (
          <ImageIcon size={20} strokeWidth={1.75} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {currentUrl ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {onRecortarPdf && (
            <button
              type="button"
              onClick={onRecortarPdf}
              className="inline-flex items-center gap-1 rounded-lg border border-questly-green/40 bg-questly-green-light px-3 py-1.5 text-xs font-medium text-questly-green-dark transition-colors hover:brightness-105"
            >
              <Scissors size={13} strokeWidth={1.75} /> Recortar do PDF
            </button>
          )}
          {currentUrl && (
            <button
              type="button"
              onClick={() => {
                setUrlInput("");
                setImgFalhou(false);
                onChange(null);
              }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-questly-red-dark transition-colors hover:bg-questly-red-light"
            >
              Remover
            </button>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => processarArquivo(e.target.files?.[0])}
        />
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onBlur={() => {
            const v = urlInput.trim();
            if (v && !/^https?:\/\//i.test(v)) {
              alert("URL de imagem precisa começar com http(s)://");
              return;
            }
            setImgFalhou(false);
            onChange(v || null);
          }}
          placeholder="ou cole uma URL de imagem"
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20"
        />
        <p className="text-[10.5px] text-muted-foreground">dica: clique na miniatura e cole (Ctrl+V) uma imagem copiada</p>
        {enviando && <p className="text-[10.5px] font-semibold text-questly-green-dark">Enviando...</p>}
        {erro && <p className="text-[10.5px] font-semibold text-questly-red-dark">Falha ao enviar. Tente de novo.</p>}
      </div>
    </div>
  );
}
