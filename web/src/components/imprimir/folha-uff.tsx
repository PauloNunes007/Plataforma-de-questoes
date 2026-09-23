"use client";

// O MOLDE "PROVA DE FACULDADE" — a réplica fiel da folha que a banca aplica.
//
// Por que existe: o molde `prova` (folha-prova.tsx) é uma prova BONITA, do
// jeito Expectrum. Esta aqui é a prova que o aluno vai receber na mão — mesma
// capa, mesmas instruções, mesmo cartão-resposta, mesmo formulário, mesmo
// miolo em duas colunas serifadas. Treinar no formato faz parte de treinar a
// prova: quem nunca viu a folha perde minutos na prova real só entendendo
// onde marcar.
//
// **A identidade é Expectrum, não a da universidade.** A geometria é a mesma;
// o brasão, o nome do instituto e a assinatura são nossos. A universidade
// aparece como FONTE das questões, que é o que ela é — reproduzir a marca de
// uma instituição numa folha que não é dela seria se passar por ela. Regra
// que já valia no molde `prova` e não muda aqui.
//
// DUAS COLUNAS: cada questão sai com `data-pdf-coluna="1"`, e é o gerador
// (lib/imprimir/gerar-pdf.ts) que faz o fluxo — enche a esquerda, passa pra
// direita, vira a página. A capa e o formulário são blocos de largura inteira
// e por isso vêm ANTES de qualquer bloco de coluna: um bloco largo depois de
// um estreito força página nova.

import { MathText } from "@/components/questao/math-text";
import type { Pergunta } from "@/lib/questao/types";
import { type Formulario, tituloFormulario } from "@/lib/imprimir/formulario";

/** Linhas do cartão-resposta. A prova da UFF imprime 20 mesmo quando tem 15 —
 *  o cartão é o mesmo formulário óptico pra todas as provas do período. */
const LINHAS_CARTAO = 20;
const LETRAS_CARTAO = ["A", "B", "C", "D", "E"] as const;

/**
 * As instruções da prova, na ordem da folha original. O molde `uff` usa SEMPRE
 * esta lista, e não a que o chamador passa: a do chamador é escrita pro molde
 * `prova` ("a prova tem 13 questões e duração de 1h30") e, somada aos itens que
 * a capa gera a partir desta prova, saía duplicada — "1- A prova tem 13
 * questões" seguido de "4- A prova consiste em 13 questões objetivas".
 */
export const INSTRUCOES_PROVA_PADRAO = [
  "Escreva seu nome de forma LEGÍVEL na folha do cartão de respostas.",
  "Analise sua resposta. Ela faz sentido? Isso poderá ajudá-lo a encontrar erros.",
  "A não ser que seja instruído de forma diferente, assinale apenas uma das alternativas de cada questão.",
  "Marque as respostas das questões no CARTÃO RESPOSTA preenchendo integralmente o círculo (com caneta) referente a sua resposta.",
  "É permitido o uso de calculadora científica simples, sem conectividade e sem gráficos.",
  "Não é permitido portar celular (mesmo que desligado) durante a prova.",
  "Ao terminar, transcreva as marcações no Expectrum pra receber a correção, o tempo por questão e a análise de erros.",
];

// ---------------------------------------------------------------------------
// Capa
// ---------------------------------------------------------------------------

/** Marca quadrada preta de referência óptica, nos cantos do cartão. */
function Fiducial() {
  return <span className="tinta-exata block h-[13px] w-[13px] bg-black" aria-hidden />;
}

function CabecalhoUff({
  materiaNome,
  linhaProva,
}: {
  materiaNome: string;
  linhaProva: string;
}) {
  return (
    <div className="tinta-exata flex items-stretch border border-black">
      {/* Selo — onde a prova original traz o brasão do instituto. */}
      <div className="flex w-[150px] shrink-0 flex-col items-center justify-center border-r border-black px-2 py-2.5 text-center">
        <span className="sans text-[17px] font-black uppercase leading-none tracking-[0.12em] text-black">
          Expectrum
        </span>
        <span className="sans mt-1 text-[7.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-black">
          Prova prevista
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-3 py-2">
        <h1 className="sans text-center text-[30px] font-bold leading-none text-black">
          {materiaNome}
        </h1>
        <p className="mt-1.5 text-center text-[13px] leading-none text-black">{linhaProva}</p>
      </div>

      <div className="flex w-[135px] shrink-0 items-center justify-center gap-2 border-l border-black px-2.5 py-2">
        <span className="sans text-right text-[10px] font-semibold uppercase leading-tight text-black">
          Nota da
          <br />
          prova
        </span>
        <span className="block h-[46px] w-[46px] border border-black" aria-hidden />
      </div>
    </div>
  );
}

function CartaoOptico() {
  const metade = LINHAS_CARTAO / 2;
  const colunas = [
    Array.from({ length: metade }, (_, i) => i + 1),
    Array.from({ length: metade }, (_, i) => i + 1 + metade),
  ];

  return (
    <div className="tinta-exata">
      {/* Identificação, dentro do cartão como na prova original. */}
      <div className="mx-[22px] rounded-[10px] border-[1.6px] border-black">
        <div className="border-b border-black px-2.5 py-[7px] text-[13px] font-semibold text-black">
          Nome:
        </div>
        <div className="border-b border-black px-2.5 py-[7px] text-[13px] font-semibold text-black">
          Matrícula:
        </div>
        <div className="flex items-center justify-between px-2.5 py-[7px] text-[13px] font-semibold text-black">
          <span>Prof(a):</span>
          <span className="pr-5">Turma:</span>
        </div>
      </div>

      <div className="mt-1.5 flex items-start justify-between">
        <Fiducial />
        <div className="flex flex-1 justify-center gap-7 px-2">
          {colunas.map((numeros, ci) => (
            <div key={ci} className="flex flex-col">
              <div className="mb-[2px] flex items-end justify-end gap-[7px] pl-[26px]">
                {LETRAS_CARTAO.map((l) => (
                  <span
                    key={l}
                    className="sans w-[15px] text-center text-[13px] font-medium leading-none text-black"
                  >
                    {l}
                  </span>
                ))}
              </div>
              {numeros.map((n) => (
                <div key={n} className="flex items-center gap-[7px] py-[1.5px]">
                  <span className="sans tnum w-[22px] text-right text-[14px] font-bold leading-none text-black">
                    {n}
                  </span>
                  {LETRAS_CARTAO.map((l) => (
                    <span
                      key={l}
                      className="block h-[15px] w-[15px] rounded-full border-[1.3px] border-black"
                      aria-hidden
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <Fiducial />
      </div>

      <div className="mt-1 flex items-center justify-between">
        <Fiducial />
        <Fiducial />
      </div>
    </div>
  );
}

function FormularioImpresso({
  formulario,
  materiaNome,
}: {
  formulario: Formulario;
  materiaNome: string;
}) {
  const grupos: { rotulo: string; itens: string[] }[] = [
    {
      rotulo: "- Constantes: a não ser que seja instruído de forma diferente, use",
      itens: formulario.constantes,
    },
    { rotulo: "- Fórmulas matemáticas", itens: formulario.matematicas },
    { rotulo: "- Fórmulas e leis físicas", itens: formulario.fisicas },
  ].filter((g) => g.itens.length > 0);

  if (grupos.length === 0) return null;

  return (
    <section className="sem-quebra mt-6" data-pdf="bloco">
      <h2 className="sans text-[21px] font-bold leading-none text-black">
        {tituloFormulario(materiaNome)}
      </h2>
      {grupos.map((g) => (
        <div key={g.rotulo} className="mt-2.5">
          <p className="sans text-[10.5px] font-bold leading-tight text-black">{g.rotulo}</p>
          <div className="mt-1 flex flex-col gap-[3px] text-[13px] leading-[1.55] text-black">
            {g.itens.map((item, i) => (
              <div key={i}>
                <MathText text={`$${item}$`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function CapaUff({
  materiaNome,
  linhaProva,
  instrucoes,
  totalQuestoes,
  duracaoRotulo,
  formulario,
}: {
  materiaNome: string;
  linhaProva: string;
  instrucoes: string[];
  totalQuestoes: number;
  duracaoRotulo: string | null;
  formulario: Formulario | null;
}) {
  // As duas instruções que dependem DESTA prova entram numeradas no meio da
  // lista, como na original (itens 4 e 6), em vez de virarem texto solto.
  const lista = [...instrucoes];
  lista.splice(3, 0, `A prova consiste em ${totalQuestoes} questões objetivas de múltipla escolha.`);
  if (duracaoRotulo) {
    lista.splice(5, 0, `A prova deverá ser feita em até ${duracaoRotulo}, portanto seja objetivo nas suas respostas.`);
  }

  return (
    <>
      <header className="sem-quebra" data-pdf="bloco">
        <CabecalhoUff materiaNome={materiaNome} linhaProva={linhaProva} />
      </header>

      <section className="sem-quebra mt-5" data-pdf="bloco">
        <div className="flex items-start gap-6">
          <div className="w-[44%] shrink-0">
            <h2 className="sans mb-2 text-[13px] font-bold text-black">Instruções:</h2>
            <ol className="flex flex-col gap-2">
              {lista.map((t, i) => (
                <li
                  key={i}
                  className="sans text-justify text-[10.5px] font-semibold leading-[1.35] text-black"
                >
                  {i + 1}- {t}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex-1">
            <CartaoOptico />
          </div>
        </div>

        {/* O tracejado de destaque da prova original: ali ele separa o cartão
            (que o professor recolhe) do resto da folha. */}
        <div className="mt-4 border-t-[1.5px] border-dashed border-black" aria-hidden />
      </section>

      {formulario && (
        <FormularioImpresso formulario={formulario} materiaNome={materiaNome} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Miolo
// ---------------------------------------------------------------------------

function AlternativasUff({ q }: { q: Pergunta }) {
  const letras = Object.keys(q.alternativas || {}).sort();
  if (letras.length === 0) return null;
  const imagens = q.alternativas_imagens || {};

  return (
    <div className="mt-2.5 flex flex-col gap-[7px]">
      {letras.map((letra) => (
        <div key={letra} className="flex gap-1.5 text-[12.5px] leading-[1.5] text-black">
          <span className="shrink-0 font-normal">{letra.toUpperCase()})</span>
          <span className="min-w-0 flex-1">
            <MathText text={(q.alternativas || {})[letra] || ""} />
            {imagens[letra] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagens[letra]}
                alt=""
                className="mt-1 max-h-[64px] w-auto max-w-full object-contain"
              />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * O ordinal que a prova usa: "1ª questão -", colado no começo do enunciado.
 * Não é um título em linha própria — na folha original o número faz parte do
 * parágrafo, e isso é o que deixa a coluna compacta.
 */
export function MioloUff({ questoes }: { questoes: Pergunta[] }) {
  return (
    // DUAS COLUNAS DE VERDADE, no DOM — e não só no gerador de PDF.
    //
    // Isto não é estética: `gerar-pdf.ts` fotografa cada bloco e ESCALA a
    // imagem pra largura de destino. Um bloco que ocupa a folha inteira no DOM,
    // desenhado em meia coluna, sai com a letra pela METADE do tamanho — foi
    // exatamente o defeito do primeiro PDF. Com `column-count`, o <li> já nasce
    // com a largura de uma coluna e a escala fecha: (664px − gola)/2 sobre
    // 87,5mm dá os mesmos 3,65 px/mm de um bloco inteiro sobre 182mm.
    //
    // A gola vai em PORCENTAGEM (7mm / 182mm) pra acompanhar `GOLA_COLUNA_MM`
    // do gerador seja qual for a largura de render. Se mexer num, mexa no outro.
    //
    // De quebra, a tela passa a mostrar o que o PDF vai ser — e a ordem de
    // leitura é a mesma: desce a coluna da esquerda, depois a da direita.
    <ol className="mt-5" style={{ columnCount: 2, columnGap: "3.85%" }}>
      {questoes.map((q, i) => (
        <li
          key={q.id}
          className="pb-6"
          style={{ breakInside: "avoid" }}
          data-pdf="bloco"
          data-pdf-coluna="1"
          // A capa é a folha que o professor recolhe (por isso o tracejado de
          // corte): as questões começam em página nova, como na prova real.
          data-pdf-pagina={i === 0 ? "nova" : undefined}
        >
          <div className="text-justify text-[12.5px] leading-[1.5] text-black">
            <span className="font-bold">{i + 1}ª questão - </span>
            <MathText text={q.enunciado} />
          </div>

          {q.imagem_url && (
            <div className="mt-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.imagem_url}
                alt=""
                className="max-h-[150px] w-auto max-w-full object-contain"
              />
            </div>
          )}

          <AlternativasUff q={q} />
        </li>
      ))}
    </ol>
  );
}
