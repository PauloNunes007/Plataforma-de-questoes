import { AlertTriangle } from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import { LETRAS_ALTERNATIVA, type ItemImportado } from "@/lib/importar/types";
import { letraAtiva } from "@/lib/importar/logic";

// Portado de renderPreview() em js/importar.js — mesmo card visual de
// questao.html, sempre mostrando a alternativa marcada como correta em
// verde (não é um quiz, é conferência de conteúdo antes de aprovar).
export function PreviewCard({ item, motivos }: { item: ItemImportado; motivos: string[] }) {
  const letras = LETRAS_ALTERNATIVA.filter((l) => letraAtiva(item, l));

  return (
    <div className="surface p-5 sm:p-7">
      {motivos.length > 0 && (
        <div className="mb-5 flex gap-2.5 rounded-xl bg-questly-red-light px-4 py-3 text-xs leading-relaxed text-questly-red-dark">
          <AlertTriangle size={15} strokeWidth={2} className="mt-px shrink-0" />
          <span>
            <b className="font-semibold">Por que está aqui:</b> {motivos.join(" · ")}
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          {item.dificuldade}
        </span>
        {(item.instituicao || item.ano) && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.instituicao}
            {item.ano ? ` ${item.ano}` : ""}
          </span>
        )}
        {item.subtopico && (
          <span className="rounded-full bg-questly-blue-light px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-questly-blue-dark">
            {item.subtopico}
          </span>
        )}
      </div>

      {item.enunciado.trim() ? (
        <div className="mb-6 text-[17px] font-medium leading-relaxed tracking-tight">
          <MathText text={item.enunciado} />
        </div>
      ) : (
        <p className="mb-6 text-[17px] font-medium text-muted-foreground">O enunciado aparece aqui...</p>
      )}

      {item.imagemUrl && (
        <div className="mb-6 flex h-[240px] items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-3 sm:h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imagemUrl} alt="Imagem da questão" className="h-full w-full object-contain" />
        </div>
      )}

      {letras.length < 2 ? (
        <p className="text-sm text-muted-foreground">Preencha pelo menos 2 alternativas pra ver a pré-visualização.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {letras.map((letra) => {
            const texto = item.alternativas[letra] || "";
            const imgAlt = item.alternativasImagens[letra];
            const correta = item.gabarito === letra;
            return (
              <div
                key={letra}
                className={`flex items-center gap-3.5 rounded-xl border px-4 py-3.5 ${
                  correta ? "border-questly-green/60 bg-questly-green-light" : "border-border bg-card"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[13px] font-semibold ${
                    correta
                      ? "border-transparent bg-questly-green text-white dark:text-[#0c1512]"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {letra.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-normal leading-relaxed">
                  {imgAlt && (
                    <div className="mb-1.5 flex h-[130px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgAlt} alt="" className="h-full w-full object-contain" />
                    </div>
                  )}
                  <MathText text={texto} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {item.resolucao && item.resolucao.trim() && (
        <div className="mt-5 rounded-xl bg-muted/60 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          <b className="font-semibold text-foreground">Resolução:</b>
          <br />
          <MathText text={item.resolucao} />
        </div>
      )}
    </div>
  );
}
