"use client";

import { MathText } from "@/components/questao/math-text";
import type { Pergunta } from "@/lib/questao/types";
import { ALTURA_RESOLUCAO_MM, alternativasEmLinha, type OpcoesFolha } from "@/lib/imprimir/opcoes";
import type { Formulario } from "@/lib/imprimir/formulario";
import { CapaUff, INSTRUCOES_PROVA_PADRAO, MioloUff } from "@/components/imprimir/folha-uff";

// A FOLHA — o que de fato vai pro arquivo.
//
// DOIS MOLDES, um componente (`variante`):
//
//  · "prova"  — o molde da prova impressa da universidade: cabeçalho CENTRADO,
//    filete duplo, "QUESTÃO 01" com a linha correndo até a margem, valor por
//    questão. É o que o aluno vê quando pega uma P1 de Física da UFF na mão, e
//    é o que a folha de um simulado ou de uma prova antiga precisa parecer pra
//    a simulação valer alguma coisa. A identidade é Expectrum, não a da
//    universidade: o nome da instituição aparece como FONTE das questões (que é
//    o que ela é), nunca como quem assina a folha.
//  · "lista"  — material de estudo, não prova: cabeçalho à esquerda com barra
//    verde, título maior, número da questão num quadrado. Deliberadamente
//    DIFERENTE do molde de prova, porque uma lista de exercícios não é uma
//    prova e fazer as duas iguais tira o peso das duas.
//
// TIPOGRAFIA (repasse de 2026-09-17, depois de "a letra tá fraquinha, a cor e
// meio pequena"): corpo a 15px sobre a largura de render de 760px ≈ 10,2pt no
// A4 — antes eram 12,5px ≈ 8,5pt, corpo de nota de rodapé, não de prova. O
// preto também subiu (#0b1016 em vez de #111827) e os cinzas de metadado
// saíram do quase-invisível. Mexer nesses números muda quantas questões cabem
// por página; `paginasEstimadas` (lib/imprimir/opcoes.ts) acompanha.
//
// As figuras usam <img> nativo (não next/image): o otimizador serve formatos e
// tamanhos pensados pra tela, e aqui o que vale é a URL original, que o browser
// já tem em cache.
//
// `data-pdf` — A MARCAÇÃO QUE O GERADOR DE PDF LÊ (lib/imprimir/gerar-pdf.ts).
// Cada elemento com `data-pdf="bloco"` vira uma imagem própria no arquivo, e é
// isso que permite paginar sem cortar questão no meio. Duas regras ao mexer
// aqui:
//
//  · um `data-pdf` NUNCA pode estar dentro de outro — o gerador varre a folha
//    em ordem de documento e desenharia o mesmo conteúdo duas vezes;
//  · o que é ESPAÇO EM BRANCO não vira bloco: `data-pdf-espaco="68"` diz ao
//    gerador quantos milímetros reservar depois do bloco, e ele desenha isso em
//    vetor (e deixa quebrar entre páginas, que o miolo não pode).

export type VarianteFolha = "lista" | "prova" | "uff";

/** O que o molde `uff` precisa saber e os outros dois não: qual prova do
 *  semestre é esta, como a linha abaixo do título se lê e qual formulário a
 *  banca entrega. Vem pronto do servidor (ver lib/imprimir/formulario.ts). */
export type MoldeUff = {
  materiaNome: string;
  /** "1ª prova - 2º período de 2026  22/09/2026" */
  linhaProva: string;
  duracaoRotulo: string | null;
  formulario: Formulario | null;
};

export function FolhaProva({
  titulo,
  disciplina,
  linhaContexto,
  instrucoes,
  questoes,
  opcoes,
  emailAluno,
  nomeAluno,
  folhaRef,
  variante = "lista",
  moldeUff = null,
}: {
  titulo: string;
  disciplina: string | null;
  linhaContexto: string | null;
  instrucoes: string[];
  questoes: Pergunta[];
  opcoes: OpcoesFolha;
  emailAluno: string;
  nomeAluno: string | null;
  folhaRef?: React.Ref<HTMLDivElement>;
  variante?: VarianteFolha;
  moldeUff?: MoldeUff | null;
}) {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const alturaResolucao = ALTURA_RESOLUCAO_MM[opcoes.espacamento];
  const ehProva = variante === "prova";

  // O molde `uff` é outra folha, não uma variação de estilo desta: capa com
  // cartão óptico, formulário e miolo em duas colunas. Sai por aqui pra não
  // encher o corpo comum de condicionais que só valem pra ele.
  if (variante === "uff" && moldeUff) {
    return (
      <div
        ref={folhaRef}
        className="folha folha-uff relative mx-auto w-full max-w-[820px] px-6 py-9 sm:px-12"
      >
        <MarcaDiagonal email={emailAluno} />
        <div className="folha-conteudo">
          <CapaUff
            materiaNome={moldeUff.materiaNome}
            linhaProva={moldeUff.linhaProva}
            instrucoes={INSTRUCOES_PROVA_PADRAO}
            totalQuestoes={questoes.length}
            duracaoRotulo={moldeUff.duracaoRotulo}
            formulario={moldeUff.formulario}
          />
          <MioloUff questoes={questoes} />
          {opcoes.gabarito && <Gabarito questoes={questoes} opcoes={opcoes} />}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={folhaRef}
      className="folha relative mx-auto w-full max-w-[820px] px-6 py-9 sm:px-12"
    >
      <MarcaDiagonal email={emailAluno} />

      <div className="folha-conteudo">
        {/* -------------------------------------------------- cabeçalho */}
        <header className="sem-quebra mb-7" data-pdf="bloco">
          {ehProva ? (
            <CabecalhoProva
              titulo={titulo}
              disciplina={disciplina}
              linhaContexto={linhaContexto}
              total={questoes.length}
            />
          ) : (
            <CabecalhoLista
              titulo={titulo}
              disciplina={disciplina}
              linhaContexto={linhaContexto}
              total={questoes.length}
              hoje={hoje}
            />
          )}

          {opcoes.identificacao && <Identificacao ehProva={ehProva} />}

          {instrucoes.length > 0 && <Instrucoes itens={instrucoes} ehProva={ehProva} />}
        </header>

        {/* -------------------------------------------------- questões */}
        <ol className="flex flex-col">
          {questoes.map((q, i) => (
            <li
              key={q.id}
              className="questao-bloco pt-5 first:pt-0"
              style={{ paddingBottom: opcoes.espacamento === "compacto" ? "20px" : "14px" }}
            >
              {/* O miolo é o que não pode partir entre páginas; o espaço de
                  resolução, logo abaixo, pode — ver estilos-impressao.ts. */}
              <div
                className="questao-miolo"
                data-pdf="bloco"
                data-pdf-espaco={alturaResolucao || undefined}
                data-pdf-separador={i > 0 ? "1" : undefined}
              >
                <TituloQuestao numero={i + 1} q={q} ehProva={ehProva} />

                <div className="text-[15px] leading-[1.62] text-[#0b1016]">
                  <MathText text={q.enunciado} />
                </div>

                {q.imagem_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.imagem_url}
                    alt=""
                    className="figura-enunciado mt-3 max-h-[190px] w-auto max-w-full object-contain"
                  />
                )}

                <Alternativas q={q} />
              </div>

              {alturaResolucao > 0 && (
                <div
                  className="espaco-resolucao mt-3.5"
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
        {opcoes.gabarito && <Gabarito questoes={questoes} opcoes={opcoes} />}

        <p className="sans mt-10 border-t border-[#dde2e6] pt-3 text-center text-[10px] text-[#8b949e]">
          Gerado por Expectrum para {nomeAluno ? `${nomeAluno} · ` : ""}
          {emailAluno} · uso pessoal
        </p>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Gabarito
// ---------------------------------------------------------------------------

/** O gabarito (e as resoluções) no fim, em página nova. Compartilhado pelos
 *  três moldes — o molde `uff` chama esta mesma seção, porque conferir
 *  resposta é conferir resposta em qualquer folha. */
function Gabarito({ questoes, opcoes }: { questoes: Pergunta[]; opcoes: OpcoesFolha }) {
  return (
          <section className="quebra-pagina pt-2">
            {/* O título e a grade são UM bloco no PDF; cada resolução é outro.
                Se a seção inteira fosse um bloco só, uma página de resoluções
                seria fatiada no meio de uma linha de texto. */}
            <div data-pdf="bloco" data-pdf-pagina="nova">
              <TituloSecao>Gabarito</TituloSecao>
              {/* Grade tabular (não uma linha corrida): conferir 40 respostas
                  numa lista separada por ponto é onde o aluno perde a conta. */}
              <div className="grade-impressao tinta-exata mt-3 grid grid-cols-[repeat(auto-fill,minmax(62px,1fr))] gap-px border border-[#c9d0d7] bg-[#c9d0d7]">
                {questoes.map((q, i) => (
                  <div
                    key={q.id}
                    className="linha-impressao flex items-center justify-between gap-1 bg-white px-2.5 py-2"
                  >
                    <span className="sans tnum text-[11px] font-semibold text-[#6a737e]">
                      {i + 1}
                    </span>
                    <span className="sans text-[14px] font-bold text-[#0b1016]">
                      {(q.gabarito || "").toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {opcoes.resolucoes && questoes.some((q) => q.resolucao) && (
              <div className="mt-8 flex flex-col gap-5">
                <h3
                  className="sans text-[12px] font-bold uppercase tracking-[0.16em] text-[#6a737e]"
                  data-pdf="bloco"
                >
                  Resoluções
                </h3>
                {questoes.map((q, i) =>
                  q.resolucao ? (
                    <div
                      key={q.id}
                      className="questao-bloco text-[13.5px] leading-[1.62] text-[#0b1016]"
                      data-pdf="bloco"
                    >
                      <b className="sans">Questão {i + 1}.</b> <MathText text={q.resolucao} />
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </section>
  );
}

// ---------------------------------------------------------------------------
// Cabeçalhos
// ---------------------------------------------------------------------------

/**
 * Molde de prova: tudo centrado, filete duplo, hierarquia de prova impressa.
 *
 * A instituição vem em cima como CONTEXTO (a fonte das questões), o título da
 * prova no corpo maior e a linha de detalhes embaixo. Quem já fez uma P1 na
 * faculdade reconhece a forma antes de ler.
 */
function CabecalhoProva({
  titulo,
  disciplina,
  linhaContexto,
  total,
}: {
  titulo: string;
  disciplina: string | null;
  linhaContexto: string | null;
  total: number;
}) {
  return (
    <div className="text-center">
      <p className="sans text-[9px] font-bold uppercase tracking-[0.34em] text-[#0a855c]">
        Expectrum
      </p>
      <div className="tinta-exata mx-auto mt-2 h-px w-full bg-[#0b1016]" />
      {disciplina && (
        <p className="sans mt-3 text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#39424d]">
          {disciplina}
        </p>
      )}
      <h1 className="mt-1.5 text-[24px] font-bold leading-tight tracking-tight text-[#0b1016]">
        {titulo}
      </h1>
      <p className="sans mt-1.5 text-[11.5px] text-[#5a636e]">
        {linhaContexto ? `${linhaContexto} · ` : ""}
        {total} {total === 1 ? "questão" : "questões"}
      </p>
      {/* Filete duplo: a assinatura visual da prova impressa. */}
      <div className="tinta-exata mt-3 border-t-[2.5px] border-double border-[#0b1016] pt-px" />
    </div>
  );
}

/**
 * Molde de lista: editorial, alinhado à esquerda, com a barra verde.
 *
 * Diferente do de prova de propósito. Uma lista de exercícios é material de
 * estudo — quem a pega não está sendo avaliado, e vestir as duas coisas com a
 * mesma roupa tira o peso das duas.
 */
function CabecalhoLista({
  titulo,
  disciplina,
  linhaContexto,
  total,
  hoje,
}: {
  titulo: string;
  disciplina: string | null;
  linhaContexto: string | null;
  total: number;
  hoje: string;
}) {
  return (
    <div>
      <div className="flex items-start gap-3.5">
        <span className="tinta-exata mt-1 h-[52px] w-[4px] shrink-0 rounded-full bg-[#0a855c]" />
        <div className="min-w-0 flex-1">
          <p className="sans text-[9px] font-bold uppercase tracking-[0.28em] text-[#0a855c]">
            Expectrum · Lista de exercícios
          </p>
          <h1 className="mt-1 text-[26px] font-bold leading-[1.15] tracking-tight text-[#0b1016]">
            {titulo}
          </h1>
          {disciplina && (
            <p className="sans mt-1 text-[12px] font-bold uppercase tracking-[0.13em] text-[#39424d]">
              {disciplina}
            </p>
          )}
        </div>
        <p className="sans shrink-0 pt-1 text-right text-[11px] leading-snug text-[#5a636e]">
          {total} {total === 1 ? "questão" : "questões"}
          <br />
          {hoje}
        </p>
      </div>

      {linhaContexto && (
        <p className="sans mt-2.5 text-[11.5px] font-medium text-[#5a636e]">{linhaContexto}</p>
      )}

      <div className="tinta-exata mt-3.5 h-px w-full bg-[#c9d0d7]" />
    </div>
  );
}

/**
 * Linhas pra preencher à mão.
 *
 * São `border-bottom` sobre um espaço em branco, não underscores repetidos:
 * underscore quebra em lugar errado quando o nome do aluno é longo.
 */
function Identificacao({ ehProva }: { ehProva: boolean }) {
  return (
    <div className="sans mt-4 flex flex-col gap-3 text-[11.5px] text-[#39424d]">
      <div className="flex items-end gap-2">
        <span className="shrink-0 font-semibold">Nome:</span>
        <span className="tinta-exata h-[14px] flex-1 border-b border-[#8b949e]" />
        <span className="shrink-0 font-semibold">Matrícula:</span>
        <span className="tinta-exata h-[14px] w-[118px] border-b border-[#8b949e]" />
      </div>
      <div className="flex items-end gap-2">
        <span className="shrink-0 font-semibold">Turma:</span>
        <span className="tinta-exata h-[14px] w-[96px] border-b border-[#8b949e]" />
        <span className="shrink-0 font-semibold">Data:</span>
        <span className="tinta-exata h-[14px] flex-1 border-b border-[#8b949e]" />
        <span className="shrink-0 font-semibold">{ehProva ? "Nota:" : "Acertos:"}</span>
        <span className="tinta-exata h-[14px] w-[76px] border-b border-[#8b949e]" />
      </div>
    </div>
  );
}

function Instrucoes({ itens, ehProva }: { itens: string[]; ehProva: boolean }) {
  return (
    <div
      className={`tinta-exata sans mt-4 px-4 py-3 ${
        ehProva
          ? "border-y border-[#0b1016]"
          : "rounded-[4px] border border-[#dde2e6] bg-[#f6f8f9]"
      }`}
    >
      <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#6a737e]">Instruções</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {itens.map((t, i) => (
          <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-[#39424d]">
            <span className="shrink-0 font-bold">{i + 1}.</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Questão
// ---------------------------------------------------------------------------

/**
 * O título da questão, nos dois moldes.
 *
 * Na prova, "QUESTÃO 01" com a linha correndo até a margem — a forma que toda
 * prova impressa usa pra separar uma questão da anterior sem gastar espaço. Na
 * lista, o número num quadrado à esquerda, que é o que faz a folha parecer
 * material editorial e não um formulário.
 */
function TituloQuestao({ numero, q, ehProva }: { numero: number; q: Pergunta; ehProva: boolean }) {
  const meta = [q.instituicao, q.ano, rotuloDificuldade(q.dificuldade)].filter(Boolean).join(" · ");

  if (ehProva) {
    return (
      <div className="mb-2 flex items-center gap-3">
        <span className="sans shrink-0 text-[13px] font-bold uppercase tracking-[0.13em] text-[#0b1016]">
          Questão {String(numero).padStart(2, "0")}
        </span>
        <span className="tinta-exata h-px min-w-[16px] flex-1 bg-[#c9d0d7]" />
        {meta && (
          <span className="sans shrink-0 text-[10px] font-medium uppercase tracking-wide text-[#7a828c]">
            {meta}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="tinta-exata sans tnum flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-[#0b1016] text-[12px] font-bold text-[#0b1016]">
        {numero}
      </span>
      {meta && (
        <span className="sans text-[10px] font-medium uppercase tracking-wide text-[#7a828c]">
          {meta}
        </span>
      )}
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
      <ul className="grade-impressao mt-3 grid grid-cols-2 gap-x-5 gap-y-2.5">
        {letras.map((letra) => (
          <li key={letra} className="sem-quebra text-[13.5px] leading-snug text-[#0b1016]">
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
    <ul
      className={
        emLinha ? "mt-2.5 flex flex-wrap gap-x-7 gap-y-2" : "mt-3 flex flex-col gap-2"
      }
    >
      {letras.map((letra) => (
        <li
          key={letra}
          className="flex items-start gap-1.5 text-[14.5px] leading-snug text-[#0b1016]"
        >
          <span className="sans shrink-0 font-bold">({letra.toLowerCase()})</span>
          <span className="min-w-0 flex-1">
            <MathText text={q.alternativas?.[letra] ?? ""} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Folhas extras
// ---------------------------------------------------------------------------

function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="tinta-exata border-b-[2px] border-[#0b1016] pb-2 text-[18px] font-bold tracking-tight text-[#0b1016]">
      {children}
    </h2>
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
    <section className="quebra-pagina pt-2" data-pdf="bloco" data-pdf-pagina="nova">
      <TituloSecao>Cartão-resposta</TituloSecao>
      <p className="sans mb-5 mt-2 text-[11px] text-[#5a636e]">
        Preencha a alternativa escolhida. Depois transcreva as marcações no Expectrum pra receber a
        correção e a análise de erros.
      </p>
      <div className="grade-impressao grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3">
        {questoes.map((q, i) => (
          <div key={q.id} className="sem-quebra linha-impressao flex items-center gap-2.5 py-[3px]">
            <span className="sans tnum w-[20px] shrink-0 text-right text-[11.5px] font-semibold text-[#39424d]">
              {i + 1}
            </span>
            <span className="flex gap-2">
              {/* As letras de CADA questão: uma com 4 alternativas não pode
                  oferecer uma (e) que não existe na prova. */}
              {letrasDaQuestao(q).map((l) => (
                <span
                  key={l}
                  className="tinta-exata flex h-[17px] w-[17px] items-center justify-center rounded-full border border-[#8b949e] text-[9px] font-semibold text-[#8b949e]"
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
 * A marca d'água diagonal da TELA.
 *
 * Só da tela: no arquivo, quem carimba é o gerador (lib/imprimir/gerar-pdf.ts),
 * em duas camadas — a vetorial, que procura o branco de cada página, e o
 * carimbo RASTERIZADO, desenhado dentro dos pixels de cada bloco com blend
 * `darken` e por isso impossível de apagar num editor de PDF.
 *
 * Aqui a grade existe pra a pré-visualização ser honesta sobre o que vai sair:
 * é a mesma grade em tijolo do carimbo rasterizado (passo de ~62mm × 26mm a
 * -26°, linhas ímpares deslocadas meio passo), nas proporções da folha da tela.
 *
 * Um SVG repetido como `background-image` em vez de dezenas de `<span>`: é um
 * nó só no DOM, não entra na captura do html2canvas (que fotografa os blocos
 * `[data-pdf]`, não esta camada) e a cor é um cinza-claro SÓLIDO, nunca preto
 * com `fill-opacity` — camada semitransparente cobrindo a página obriga o
 * gerador de PDF a achatar tudo que está embaixo num BITMAP.
 */
const MARCA_TILE = { largura: 259, altura: 108 };

export function MarcaDiagonal({ email }: { email: string }) {
  const texto = email.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const meio = MARCA_TILE.largura / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MARCA_TILE.largura}" height="${MARCA_TILE.altura}">` +
    `<g font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="13" fill="#e8ecf0" letter-spacing="0.5">` +
    `<text x="4" y="34" transform="rotate(-26 4 34)">${texto}</text>` +
    `<text x="${meio}" y="88" transform="rotate(-26 ${meio} 88)">${texto}</text>` +
    `</g></svg>`;

  return (
    <div
      className="marca-diagonal pointer-events-none absolute inset-0 select-none overflow-hidden"
      aria-hidden
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`,
        backgroundRepeat: "repeat",
        backgroundSize: `${MARCA_TILE.largura}px ${MARCA_TILE.altura}px`,
      }}
    />
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
