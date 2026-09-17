"use client";

import { MathText } from "@/components/questao/math-text";
import type { Pergunta } from "@/lib/questao/types";
import { ALTURA_RESOLUCAO_MM, alternativasEmLinha, type OpcoesFolha } from "@/lib/imprimir/opcoes";

// A FOLHA — o que de fato vai pro papel.
//
// O molde é o da prova impressa da universidade, não o do app: cabeçalho com
// identificação pra preencher à mão, bloco de instruções, questões numeradas
// com espaço pra desenvolver, cartão-resposta e gabarito em páginas próprias.
// Quem imprime isso vai colocar ao lado de uma prova da UFF; se parecer um
// site impresso, o recurso não cumpriu o que prometeu.
//
// As figuras usam <img> nativo (não next/image): o otimizador serve formatos e
// tamanhos pensados pra tela, e na hora da impressão o que vale é a URL
// original, que o browser já tem em cache.

export function FolhaProva({
  titulo,
  disciplina,
  linhaContexto,
  instrucoes,
  questoes,
  opcoes,
  emailAluno,
  nomeAluno,
}: {
  titulo: string;
  disciplina: string | null;
  linhaContexto: string | null;
  instrucoes: string[];
  questoes: Pergunta[];
  opcoes: OpcoesFolha;
  emailAluno: string;
  nomeAluno: string | null;
}) {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const alturaResolucao = ALTURA_RESOLUCAO_MM[opcoes.espacamento];

  return (
    <div className="folha relative mx-auto w-full max-w-[820px] px-6 py-9 sm:px-12">
      <MarcaDiagonal email={emailAluno} />

      <div className="folha-conteudo">
        {/* -------------------------------------------------- cabeçalho */}
        <header className="sem-quebra mb-6">
          <div className="flex items-end justify-between gap-4 border-b-[1.5px] border-[#111827] pb-2.5">
            <div className="min-w-0">
              <p className="sans text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#0a855c]">
                Expectrum
              </p>
              <h1 className="mt-1 text-[19px] font-bold leading-tight tracking-tight">{titulo}</h1>
              {disciplina && (
                <p className="sans mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5b6472]">
                  {disciplina}
                </p>
              )}
            </div>
            <p className="sans shrink-0 text-right text-[10px] leading-snug text-[#5b6472]">
              {questoes.length} {questoes.length === 1 ? "questão" : "questões"}
              <br />
              {hoje}
            </p>
          </div>

          {linhaContexto && (
            <p className="sans mt-2 text-[10.5px] font-medium text-[#5b6472]">{linhaContexto}</p>
          )}

          {/* Linhas pra preencher à mão. São `border-bottom` sobre um espaço em
              branco, não underscores repetidos: underscore quebra em lugar
              errado quando o nome do aluno é longo. */}
          {opcoes.identificacao && (
            <div className="sans mt-3 flex flex-col gap-2.5 text-[10.5px] text-[#5b6472]">
              <div className="flex items-end gap-2">
                <span className="shrink-0 font-semibold">Nome:</span>
                <span className="tinta-exata h-[13px] flex-1 border-b border-[#9aa3ad]" />
                <span className="shrink-0 font-semibold">Matrícula:</span>
                <span className="tinta-exata h-[13px] w-[110px] border-b border-[#9aa3ad]" />
              </div>
              <div className="flex items-end gap-2">
                <span className="shrink-0 font-semibold">Turma:</span>
                <span className="tinta-exata h-[13px] w-[90px] border-b border-[#9aa3ad]" />
                <span className="shrink-0 font-semibold">Data:</span>
                <span className="tinta-exata h-[13px] flex-1 border-b border-[#9aa3ad]" />
                <span className="shrink-0 font-semibold">Nota:</span>
                <span className="tinta-exata h-[13px] w-[70px] border-b border-[#9aa3ad]" />
              </div>
            </div>
          )}

          {instrucoes.length > 0 && (
            <div className="tinta-exata sans mt-3.5 rounded-[3px] border border-[#d4d9dd] bg-[#f7f8f9] px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#5b6472]">
                Instruções
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {instrucoes.map((t, i) => (
                  <li key={i} className="flex gap-1.5 text-[10px] leading-snug text-[#3f4852]">
                    <span className="shrink-0 font-semibold">{i + 1}.</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </header>

        {/* -------------------------------------------------- questões */}
        <ol className="flex flex-col">
          {questoes.map((q, i) => (
            <li
              key={q.id}
              className="questao-bloco border-t border-[#e8ebed] pt-4 first:border-t-0 first:pt-0"
              style={{ paddingBottom: opcoes.espacamento === "compacto" ? "18px" : "14px" }}
            >
              {/* O miolo é o que não pode partir entre páginas; o espaço de
                  resolução, logo abaixo, pode — ver estilos-impressao.ts. */}
              <div className="questao-miolo">
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span className="sans text-[11.5px] font-bold uppercase tracking-[0.1em]">
                    Questão {i + 1}
                  </span>
                  {(q.instituicao || q.ano || q.dificuldade) && (
                    <span className="sans text-[9.5px] font-medium uppercase tracking-wide text-[#8b949e]">
                      {[q.instituicao, q.ano, rotuloDificuldade(q.dificuldade)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>

                <div className="text-[12.5px] leading-[1.6]">
                  <MathText text={q.enunciado} />
                </div>

                {q.imagem_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.imagem_url}
                    alt=""
                    className="figura-enunciado mt-2.5 max-h-[190px] w-auto max-w-full object-contain"
                  />
                )}

                <Alternativas q={q} />
              </div>

              {alturaResolucao > 0 && (
                <div
                  className="espaco-resolucao mt-3"
                  style={{ height: `${alturaResolucao}mm` }}
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>

        {/* -------------------------------------------------- cartão-resposta */}
        {opcoes.cartaoResposta && <CartaoRespostaImpresso questoes={questoes} />}

        {/* -------------------------------------------------- gabarito */}
        {opcoes.gabarito && (
          <section className="quebra-pagina pt-2">
            <h2 className="mb-3 border-b-[1.5px] border-[#111827] pb-1.5 text-[16px] font-bold tracking-tight">
              Gabarito
            </h2>
            {/* Grade tabular (não uma linha corrida): conferir 40 respostas
                numa lista separada por ponto é onde o aluno perde a conta. */}
            <div className="grade-impressao tinta-exata grid grid-cols-[repeat(auto-fill,minmax(58px,1fr))] gap-px border border-[#d4d9dd] bg-[#d4d9dd]">
              {questoes.map((q, i) => (
                <div key={q.id} className="linha-impressao flex items-center justify-between gap-1 bg-white px-2 py-1.5">
                  <span className="sans tnum text-[10px] font-semibold text-[#5b6472]">{i + 1}</span>
                  <span className="sans text-[12.5px] font-bold">{(q.gabarito || "").toUpperCase()}</span>
                </div>
              ))}
            </div>

            {opcoes.resolucoes && questoes.some((q) => q.resolucao) && (
              <div className="mt-7 flex flex-col gap-4">
                <h3 className="text-[13.5px] font-bold">Resoluções</h3>
                {questoes.map((q, i) =>
                  q.resolucao ? (
                    <div key={q.id} className="questao-bloco text-[11.5px] leading-[1.6]">
                      <b className="sans">Questão {i + 1}.</b> <MathText text={q.resolucao} />
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </section>
        )}

        <p className="sans mt-9 border-t border-[#e2e6e4] pt-3 text-center text-[9px] text-[#8b949e]">
          Gerado por Expectrum para {nomeAluno ? `${nomeAluno} · ` : ""}
          {emailAluno} · uso pessoal
        </p>
      </div>
    </div>
  );
}

/**
 * Alternativas. Três formas, nesta ordem de preferência:
 *
 *  · COM FIGURA  — grade de duas colunas, figura pequena e contida. Empilhadas
 *    em coluna única, cinco figuras de alternativa somavam mais de uma folha
 *    inteira: a questão não cabia na página, o `break-inside: avoid` do miolo
 *    a jogava pra folha seguinte e sobrava meia página em branco atrás. O
 *    tamanho impresso é travado em mm no CSS (.figura-alternativa), não em px,
 *    porque o que importa aqui é quanto da FOLHA a figura ocupa;
 *  · EM LINHA    — (a) 2 m/s (b) 4 m/s ... quando todas são curtas, como na
 *    prova impressa de verdade;
 *  · EMPILHADAS  — o resto.
 */
function Alternativas({ q }: { q: Pergunta }) {
  const letras = Object.keys(q.alternativas || {}).sort();
  if (letras.length === 0) return null;
  const imagens = q.alternativas_imagens || {};
  const comFigura = Object.keys(imagens).length > 0;

  if (comFigura) {
    return (
      <ul className="grade-impressao mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
        {letras.map((letra) => (
          <li key={letra} className="sem-quebra text-[11.5px] leading-snug">
            <span className="linha-impressao flex items-start gap-1.5">
              <span className="sans shrink-0 font-bold">({letra.toLowerCase()})</span>
              <span className="min-w-0 flex-1">
                <MathText text={q.alternativas?.[letra] ?? ""} />
              </span>
            </span>
            {imagens[letra] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagens[letra]}
                alt=""
                className="figura-alternativa mt-1 max-h-[78px] w-auto max-w-full object-contain"
              />
            )}
          </li>
        ))}
      </ul>
    );
  }

  const emLinha = alternativasEmLinha(q);
  return (
    <ul className={emLinha ? "mt-2 flex flex-wrap gap-x-6 gap-y-1.5" : "mt-2.5 flex flex-col gap-1.5"}>
      {letras.map((letra) => (
        <li key={letra} className="flex items-start gap-1.5 text-[12px] leading-snug">
          <span className="sans shrink-0 font-bold">({letra.toLowerCase()})</span>
          <span className="min-w-0 flex-1">
            <MathText text={q.alternativas?.[letra] ?? ""} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Cartão-resposta em branco, em página própria.
 *
 * As bolhas são círculos vazados com a letra dentro — não bolhas cegas: uma
 * folha de leitura ótica de verdade depende de um scanner que ninguém aqui
 * tem, e sem a letra impressa o aluno perde a referência ao transcrever.
 */
function CartaoRespostaImpresso({ questoes }: { questoes: Pergunta[] }) {
  return (
    <section className="quebra-pagina pt-2">
      <h2 className="mb-1 border-b-[1.5px] border-[#111827] pb-1.5 text-[16px] font-bold tracking-tight">
        Cartão-resposta
      </h2>
      <p className="sans mb-4 text-[10px] text-[#5b6472]">
        Preencha a alternativa escolhida. Depois transcreva as marcações no Expectrum pra receber a
        correção e a análise de erros.
      </p>
      <div className="grade-impressao grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3">
        {questoes.map((q, i) => (
          <div key={q.id} className="sem-quebra linha-impressao flex items-center gap-2 py-[2px]">
            <span className="sans tnum w-[18px] shrink-0 text-right text-[10.5px] font-semibold text-[#5b6472]">
              {i + 1}
            </span>
            <span className="flex gap-1.5">
              {/* As letras de CADA questão: uma com 4 alternativas não pode
                  oferecer uma (e) que não existe na prova. */}
              {letrasDaQuestao(q).map((l) => (
                <span
                  key={l}
                  className="tinta-exata flex h-[15px] w-[15px] items-center justify-center rounded-full border border-[#9aa3ad] text-[8px] font-semibold text-[#9aa3ad]"
                >
                  {l.toUpperCase()}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * A marca d'água diagonal repetida.
 *
 * SEIS carimbos por página, posicionados em porcentagem — não um `<pattern>`
 * SVG. A versão em SVG era elegante e frágil: um padrão vetorial com
 * `patternTransform` dentro de um elemento `position: fixed`, repintado em
 * todas as páginas, é exatamente o tipo de coisa que faz o Chrome desistir com
 * "Falha ao carregar documento PDF" na hora de salvar. Texto rotacionado é
 * primitivo, continua vetorial no PDF (o Chrome escreve a matriz do texto, não
 * um bitmap) e custa seis desenhos por folha.
 *
 * A cor é um cinza-claro SÓLIDO, não preto com `fill-opacity`. A diferença é
 * invisível na tela e decisiva no arquivo: uma camada semitransparente cobrindo
 * a página inteira obriga o gerador de PDF a achatar tudo que está embaixo num
 * BITMAP — era isso que fazia o texto sair borrado e o arquivo engordar.
 *
 * Claro o bastante pra não atrapalhar a leitura da questão e escuro o bastante
 * pra sobreviver a uma fotocópia — é o mesmo compromisso dos PDFs de editora
 * acadêmica. A atribuição não depende de todas sobreviverem: basta UMA.
 */
const POSICOES_MARCA = [
  { top: "9%", left: "5%" },
  { top: "24%", left: "52%" },
  { top: "43%", left: "16%" },
  { top: "58%", left: "58%" },
  { top: "77%", left: "7%" },
  { top: "90%", left: "48%" },
];

export function MarcaDiagonal({ email }: { email: string }) {
  return (
    <div
      className="marca-diagonal pointer-events-none absolute inset-0 select-none overflow-hidden"
      aria-hidden
    >
      {POSICOES_MARCA.map((pos, i) => (
        <span
          key={i}
          className="sans absolute whitespace-nowrap"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "rotate(-30deg)",
            transformOrigin: "left center",
            color: "#dfe3e8",
            fontSize: "12px",
            letterSpacing: "0.04em",
          }}
        >
          {email}
        </span>
      ))}
    </div>
  );
}

/** Letras da questão; cinco por padrão quando a questão veio sem alternativas. */
function letrasDaQuestao(q: Pergunta): string[] {
  const letras = Object.keys(q.alternativas || {}).map((l) => l.toLowerCase()).sort();
  return letras.length > 0 ? letras : ["a", "b", "c", "d", "e"];
}

function rotuloDificuldade(d: string | null): string | null {
  if (!d) return null;
  if (d === "facil") return "fácil";
  if (d === "medio") return "médio";
  if (d === "dificil") return "difícil";
  return d;
}
