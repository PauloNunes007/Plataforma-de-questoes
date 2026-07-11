import { MathText } from "@/components/questao/math-text";
import { LETRAS_ALTERNATIVA, type ItemImportado } from "@/lib/importar/types";
import { letraAtiva } from "@/lib/importar/logic";

// Portado de renderPreview() em js/importar.js — mesmo card visual de
// questao.html, sempre mostrando a alternativa marcada como correta em
// verde (não é um quiz, é conferência de conteúdo antes de aprovar).
export function PreviewCard({ item, motivos }: { item: ItemImportado; motivos: string[] }) {
  const letras = LETRAS_ALTERNATIVA.filter((l) => letraAtiva(item, l));

  return (
    <div className="rounded-[24px] border border-border bg-card p-7">
      {motivos.length > 0 && (
        <div className="mb-4 rounded-xl bg-questly-red-light px-4 py-3 text-xs font-semibold leading-relaxed text-questly-red-dark">
          <b>Por que está aqui:</b> {motivos.join(" · ")}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-questly-blue-light px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-questly-blue-dark">
          {item.dificuldade}
        </span>
        {(item.instituicao || item.ano) && (
          <span className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
            {item.instituicao}
            {item.ano ? ` ${item.ano}` : ""}
          </span>
        )}
      </div>

      {item.enunciado.trim() ? (
        <div className="mb-5 text-base font-semibold leading-relaxed">
          <MathText text={item.enunciado} />
        </div>
      ) : (
        <p className="mb-5 text-base font-semibold text-muted-foreground">O enunciado aparece aqui...</p>
      )}

      {item.imagemUrl && (
        <div className="mb-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imagemUrl}
            alt="Imagem da questão"
            className="mx-auto max-h-[280px] max-w-full rounded-xl border border-border"
          />
        </div>
      )}

      {letras.length < 2 ? (
        <p className="mb-2 text-sm font-semibold text-muted-foreground">
          Preencha pelo menos 2 alternativas pra ver a pré-visualização.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {letras.map((letra) => {
            const texto = item.alternativas[letra] || "";
            const imgAlt = item.alternativasImagens[letra];
            const correta = item.gabarito === letra;
            return (
              <div
                key={letra}
                className={`flex items-center gap-3.5 rounded-xl border-2 px-4 py-3 ${
                  correta ? "border-questly-green bg-questly-green-light" : "border-border"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 font-heading text-sm font-bold ${
                    correta ? "border-questly-green bg-questly-green text-white" : "border-border bg-muted"
                  }`}
                >
                  {letra.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
                  {imgAlt && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgAlt} alt="" className="mb-1.5 block max-h-[120px] max-w-full rounded-lg object-contain" />
                  )}
                  <MathText text={texto} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {item.resolucao && item.resolucao.trim() && (
        <div className="mt-5 rounded-xl bg-muted px-4 py-3.5 text-sm font-semibold leading-relaxed text-muted-foreground">
          <b className="text-foreground">Resolução:</b>
          <br />
          <MathText text={item.resolucao} />
        </div>
      )}
    </div>
  );
}
