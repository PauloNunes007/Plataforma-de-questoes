"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Printer } from "lucide-react";
import { MathText } from "@/components/questao/math-text";
import type { Pergunta } from "@/lib/questao/types";

// A FOLHA: a lista de questões em formato de prova impressa.
//
// Decisões de impressão que parecem detalhe e não são:
//
//  · a folha é sempre CLARA, mesmo com o app em tema escuro. Papel não tem
//    tema, e um fundo escuro imprimiria como um borrão de toner (ou, com
//    "imprimir fundos" desligado, texto branco em página branca);
//  · as questões não quebram no meio (`break-inside: avoid`), porque
//    enunciado numa página e alternativas na outra é uma prova inutilizável;
//  · o gabarito sai no FIM, numa página nova, e pode ser desligado antes de
//    imprimir — quem imprime pra simular a prova não quer a resposta na mão;
//  · as figuras usam <img> nativo (não next/image): o otimizador serve
//    formatos e tamanhos pensados pra tela, e na hora da impressão o que vale
//    é a URL original, que o browser já tem em cache.
//
// MARCA D'ÁGUA: duas camadas independentes, porque uma sozinha é fácil demais
// de perder. A diagonal repetida atravessa o conteúdo (quem recortar o rodapé
// leva o resto junto) e o rodapé fixo se repete em TODA página impressa
// (`position: fixed` dentro de @media print é o único jeito confiável de
// carimbar todas as folhas sem saber quantas são).

const CSS_IMPRESSAO = `
  .folha { color: #111827; background: #ffffff; }

  @media print {
    /* O que é do app (header, barra de foco, barra inferior, botões) some: o
       que vai pro papel é a folha, e só.
       ATENCAO: nao da pra fazer isso com "body > *:not(.folha-raiz)" — a folha
       nasce DENTRO do layout de (protected), varios niveis abaixo do body,
       entao aquele seletor nao pegaria nada. Cada peca de cromo leva a classe
       print:hidden (ver top-nav, foco-bar, mobile-bottom-nav) e o que e desta
       tela usa .nao-imprimir. */
    .nao-imprimir { display: none !important; }

    @page {
      size: A4;
      margin: 16mm 14mm 20mm 14mm;
    }

    html, body, .folha-raiz, .folha {
      background: #ffffff !important;
      color: #111827 !important;
    }

    .questao-bloco {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .quebra-pagina { break-before: page; page-break-before: always; }

    /* O rodapé com o e-mail em toda folha. -webkit-print-color-adjust mantém
       a cor quando o navegador tenta "economizar tinta" achatando cinzas. */
    .rodape-marca {
      position: fixed;
      bottom: 4mm;
      left: 0;
      right: 0;
      display: block !important;
      font-size: 7.5pt;
      color: #6b7280 !important;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Na tela a marca acompanha a folha (absolute); no papel ela vira fixed,
       que é o que a repete em TODAS as páginas do PDF. */
    .marca-diagonal {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .folha-conteudo { position: relative; z-index: 1; }
  }
`;

export function FolhaImpressao({
  titulo,
  questoes,
  emailAluno,
  nomeAluno,
  missaoId,
}: {
  titulo: string;
  questoes: Pergunta[];
  emailAluno: string;
  nomeAluno: string | null;
  missaoId: string;
}) {
  const [comGabarito, setComGabarito] = useState(false);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="folha-raiz">
      <style dangerouslySetInnerHTML={{ __html: CSS_IMPRESSAO }} />

      {/* Barra de controle — não vai pro papel. */}
      <div className="nao-imprimir sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="casca-leitura flex flex-wrap items-center gap-2 py-3">
          <Link
            href={`/questao?missao=${missaoId}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Voltar pra lista
          </Link>

          <button
            type="button"
            onClick={() => setComGabarito((v) => !v)}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-semibold transition-colors hover:bg-foreground/[0.05]"
          >
            {comGabarito ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
            {comGabarito ? "Sem gabarito" : "Com gabarito"}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-questly-green px-3.5 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 dark:text-[#0c1512]"
          >
            <Printer size={14} strokeWidth={2.1} />
            Imprimir / salvar PDF
          </button>
        </div>
        <p className="casca-leitura pb-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
          No diálogo de impressão, escolha <b>&quot;Salvar como PDF&quot;</b> como destino. O arquivo sai
          marcado com o seu e-mail ({emailAluno}) em todas as páginas.
        </p>
      </div>

      <div className="folha relative mx-auto w-full max-w-[820px] px-6 py-8 sm:px-10">
        <MarcaDiagonal email={emailAluno} />

        <div className="folha-conteudo">
          <header className="mb-6 border-b-2 border-[#111827] pb-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0a855c]">
                  Expectrum
                </p>
                <h1 className="mt-0.5 text-[20px] font-bold leading-tight tracking-tight">{titulo}</h1>
              </div>
              <p className="shrink-0 text-right text-[10.5px] leading-snug text-[#5b6472]">
                {questoes.length} {questoes.length === 1 ? "questão" : "questões"}
                <br />
                {hoje}
              </p>
            </div>
            <p className="mt-2 text-[10.5px] text-[#5b6472]">
              {nomeAluno ? `${nomeAluno} — ` : ""}
              {emailAluno}
            </p>
          </header>

          <ol className="flex flex-col gap-7">
            {questoes.map((q, i) => (
              <li key={q.id} className="questao-bloco">
                <div className="flex items-start gap-2.5">
                  <span className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#111827] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {(q.instituicao || q.ano) && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5b6472]">
                        {[q.instituicao, q.ano].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div className="text-[13px] leading-relaxed">
                      <MathText text={q.enunciado} />
                    </div>

                    {q.imagem_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={q.imagem_url}
                        alt=""
                        className="mt-2.5 max-h-[280px] w-auto max-w-full object-contain"
                      />
                    )}

                    <ul className="mt-2.5 flex flex-col gap-1.5">
                      {Object.keys(q.alternativas || {})
                        .sort()
                        .map((letra) => (
                          <li key={letra} className="flex items-start gap-2 text-[12.5px] leading-snug">
                            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[#111827] text-[10px] font-bold">
                              {letra}
                            </span>
                            <span className="min-w-0 flex-1">
                              <MathText text={q.alternativas?.[letra] ?? ""} />
                              {q.alternativas_imagens?.[letra] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={q.alternativas_imagens[letra]}
                                  alt=""
                                  className="mt-1 max-h-[140px] w-auto max-w-full object-contain"
                                />
                              )}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {comGabarito && (
            <section className="quebra-pagina mt-10 pt-6">
              <h2 className="mb-3 border-b-2 border-[#111827] pb-1.5 text-[16px] font-bold tracking-tight">
                Gabarito
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {questoes.map((q, i) => (
                  <span key={q.id} className="tnum text-[12.5px]">
                    <b>{i + 1}.</b> {q.gabarito}
                  </span>
                ))}
              </div>

              {questoes.some((q) => q.resolucao) && (
                <div className="mt-6 flex flex-col gap-4">
                  <h3 className="text-[13.5px] font-bold">Resoluções</h3>
                  {questoes.map((q, i) =>
                    q.resolucao ? (
                      <div key={q.id} className="questao-bloco text-[12px] leading-relaxed">
                        <b>{i + 1}.</b> <MathText text={q.resolucao} />
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </section>
          )}

          <p className="mt-10 border-t border-[#e2e6e4] pt-3 text-center text-[9.5px] text-[#5b6472]">
            Gerado por Expectrum para {emailAluno} · uso pessoal
          </p>
        </div>
      </div>

      {/* Rodapé carimbado em toda página impressa (fica escondido na tela). */}
      <div className="rodape-marca hidden">
        Expectrum · cópia pessoal de {emailAluno} · a redistribuição identifica esta conta
      </div>
    </div>
  );
}

/**
 * A marca d'água diagonal repetida.
 *
 * É um SVG com `<pattern>` em vez de texto repetido no DOM: um padrão vetorial
 * cobre qualquer altura de página sem o app precisar saber quantas páginas o
 * PDF terá, e o texto continua nítido em qualquer zoom (o leitor de PDF não
 * reamostra vetor).
 *
 * Opacidade baixa o bastante pra não atrapalhar a leitura da questão e alta o
 * bastante pra sobreviver a uma fotocópia — é o mesmo compromisso dos PDFs de
 * editora acadêmica.
 */
function MarcaDiagonal({ email }: { email: string }) {
  return (
    <div className="marca-diagonal pointer-events-none absolute inset-0 select-none overflow-hidden">
      <svg width="100%" height="100%" aria-hidden>
        <defs>
          <pattern
            id="marca-expectrum"
            width="320"
            height="200"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-30)"
          >
            <text x="0" y="40" fill="#111827" fillOpacity="0.07" fontSize="13" fontFamily="sans-serif">
              {email}
            </text>
            <text x="160" y="140" fill="#111827" fillOpacity="0.07" fontSize="13" fontFamily="sans-serif">
              {email}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#marca-expectrum)" />
      </svg>
    </div>
  );
}
