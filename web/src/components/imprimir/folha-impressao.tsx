"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  Layers,
  ListChecks,
  Printer,
  Ruler,
  Settings2,
  SquarePen,
} from "lucide-react";
import type { Pergunta } from "@/lib/questao/types";
import { CSS_IMPRESSAO } from "@/components/imprimir/estilos-impressao";
import { FolhaProva } from "@/components/imprimir/folha-prova";
import {
  ESPACAMENTOS,
  limitarQuantidade,
  nomeDoArquivo,
  opcoesPadrao,
  PAGINAS_DEMAIS,
  paginasEstimadas,
  sugestoesDeQuantidade,
  type Espacamento,
  type OpcoesFolha,
} from "@/lib/imprimir/opcoes";

// A TELA DE EXPORTAR: um passo de preparo e, depois dele, a folha.
//
// O passo de preparo existe por um defeito concreto: a lista de um tópico
// inteiro passa fácil de 100 questões, e a tela jogava TODAS numa folha só —
// trinta e tantas páginas que ninguém imprime, e que o navegador às vezes nem
// consegue gerar. Hoje o padrão é um RECORTE (PADRAO_QUESTOES_FOLHA), e o
// preparo aparece exatamente quando há recorte: quantas questões, com ou sem
// gabarito, quanto espaço pra resolver. Nada aqui vai pro papel
// (`nao-imprimir`), e as mesmas opções continuam na barra de cima depois da
// folha montada, pra ajustar sem recomeçar.
//
// Numa prova (simulado/prova antiga) o recorte não faz sentido — a prova é a
// prova —, então `permitirRecorte={false}` some com a pergunta de quantidade e
// trava a folha no total.

export function FolhaImpressao({
  titulo,
  disciplina = null,
  linhaContexto = null,
  instrucoes,
  questoes,
  emailAluno,
  nomeAluno,
  voltarHref,
  voltarRotulo = "Voltar",
  permitirRecorte = true,
}: {
  titulo: string;
  disciplina?: string | null;
  linhaContexto?: string | null;
  instrucoes?: string[];
  questoes: Pergunta[];
  emailAluno: string;
  nomeAluno: string | null;
  voltarHref: string;
  voltarRotulo?: string;
  permitirRecorte?: boolean;
}) {
  const total = questoes.length;
  const temResolucao = useMemo(() => questoes.some((q) => q.resolucao), [questoes]);

  const [opcoes, setOpcoes] = useState<OpcoesFolha>(() => {
    const base = opcoesPadrao(total, temResolucao);
    // Prova impressa: sem recorte, e o gabarito começa DESLIGADO — quem vai
    // cronometrar uma prova não quer a resposta na mesa.
    return permitirRecorte ? base : { ...base, quantidade: total, gabarito: false, cartaoResposta: true };
  });

  // O preparo aparece exatamente quando a folha ESTÁ SENDO CORTADA — o padrão
  // não é mais a lista inteira (ver PADRAO_QUESTOES_FOLHA). A regra é essa e
  // não um limiar solto: nenhuma questão pode ficar de fora sem o aluno saber,
  // e numa lista que cabe inteira perguntar seria burocracia.
  const [preparando, setPreparando] = useState(
    () => permitirRecorte && total > opcoesPadrao(total, false).quantidade,
  );
  const [painelAberto, setPainelAberto] = useState(false);

  const selecionadas = useMemo(
    () => questoes.slice(0, opcoes.quantidade),
    [questoes, opcoes.quantidade],
  );
  const paginas = useMemo(() => paginasEstimadas(questoes, opcoes), [questoes, opcoes]);

  const instrucoesFinais =
    instrucoes ??
    [
      "Resolva sem consultar material — o valor da lista está em tentar antes de olhar a resposta.",
      "Marque uma única alternativa por questão.",
      opcoes.gabarito
        ? "O gabarito está na última folha: só confira depois de terminar."
        : "O gabarito não foi impresso: confira suas respostas no Expectrum.",
    ];

  function mudar<K extends keyof OpcoesFolha>(chave: K, valor: OpcoesFolha[K]) {
    setOpcoes((o) => ({ ...o, [chave]: valor }));
  }

  // O nome do arquivo salvo sai do `document.title` — e o título da rota
  // ("Imprimir lista do tópico · Expectrum") não diz o que o aluno baixou.
  //
  // O título é trocado AO ABRIR a tela, não no clique de imprimir. A primeira
  // versão trocava dentro de `imprimir()`, logo antes de `window.print()`, e
  // isso deu errado duas vezes: mexer no documento no instante em que o Chrome
  // monta a pré-visualização é receita de "Falha ao carregar documento PDF", e
  // quem imprime por Ctrl+P nunca passava pela função — o arquivo saía sem
  // nome mesmo. Trocando na montagem, o documento fica PARADO durante a
  // impressão e os dois caminhos ganham o nome certo.
  useEffect(() => {
    const anterior = document.title;
    document.title = nomeDoArquivo(disciplina, titulo);
    return () => {
      document.title = anterior;
    };
  }, [disciplina, titulo]);

  return (
    <div className="folha-raiz">
      <style dangerouslySetInnerHTML={{ __html: CSS_IMPRESSAO }} />

      {preparando ? (
        <PreparoImpressao
          titulo={titulo}
          total={total}
          paginas={paginas}
          opcoes={opcoes}
          temResolucao={temResolucao}
          voltarHref={voltarHref}
          voltarRotulo={voltarRotulo}
          onMudar={mudar}
          onPronto={() => setPreparando(false)}
        />
      ) : (
        <>
          {/* Barra de controle — não vai pro papel. */}
          <div className="nao-imprimir sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
            <div className="casca-leitura flex flex-wrap items-center gap-2 py-3">
              <Link
                href={voltarHref}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={15} strokeWidth={2} />
                {voltarRotulo}
              </Link>

              <button
                type="button"
                onClick={() => setPainelAberto((v) => !v)}
                aria-expanded={painelAberto}
                className={`ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors ${
                  painelAberto
                    ? "border-questly-green bg-questly-green-light text-questly-green-dark"
                    : "border-border hover:bg-foreground/[0.05]"
                }`}
              >
                <Settings2 size={14} strokeWidth={2} />
                Opções
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

            {painelAberto ? (
              <div className="casca-leitura pb-4">
                <OpcoesImpressao
                  total={total}
                  paginas={paginas}
                  opcoes={opcoes}
                  temResolucao={temResolucao}
                  permitirRecorte={permitirRecorte}
                  onMudar={mudar}
                />
              </div>
            ) : (
              <p className="casca-leitura pb-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                {selecionadas.length} de {total} {total === 1 ? "questão" : "questões"} · ~{paginas}{" "}
                {paginas === 1 ? "página" : "páginas"} ·{" "}
                {opcoes.gabarito ? "com gabarito no fim" : "sem gabarito"}. No diálogo, escolha{" "}
                <b>&quot;Salvar como PDF&quot;</b> e desmarque{" "}
                <b>&quot;Cabeçalhos e rodapés&quot;</b> — é o que tira a data e o endereço do site de
                cima da folha. O arquivo sai marcado com o seu e-mail ({emailAluno}).
              </p>
            )}
          </div>

          <FolhaProva
            titulo={titulo}
            disciplina={disciplina}
            linhaContexto={linhaContexto}
            instrucoes={instrucoesFinais}
            questoes={selecionadas}
            opcoes={opcoes}
            emailAluno={emailAluno}
            nomeAluno={nomeAluno}
          />
        </>
      )}

      {/* Rodapé carimbado em toda página impressa (escondido na tela). Não há
          cabeçalho corrente — ver estilos-impressao.ts: `fixed` + `top` cai
          por cima da primeira linha de cada página no Chrome. */}
      <div className="rodape-marca hidden">
        Expectrum · cópia pessoal de {emailAluno} · a redistribuição identifica esta conta
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passo de preparo (lista longa)
// ---------------------------------------------------------------------------

function PreparoImpressao({
  titulo,
  total,
  paginas,
  opcoes,
  temResolucao,
  voltarHref,
  voltarRotulo,
  onMudar,
  onPronto,
}: {
  titulo: string;
  total: number;
  paginas: number;
  opcoes: OpcoesFolha;
  temResolucao: boolean;
  voltarHref: string;
  voltarRotulo: string;
  onMudar: <K extends keyof OpcoesFolha>(chave: K, valor: OpcoesFolha[K]) => void;
  onPronto: () => void;
}) {
  return (
    <div className="casca-leitura py-6">
      <Link
        href={voltarHref}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        {voltarRotulo}
      </Link>

      <div className="surface p-5 sm:p-7">
        <span className="kicker">Preparar impressão</span>
        <h1 className="mt-1 font-heading text-[20px] font-bold tracking-tight">{titulo}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Essa lista tem <b className="tnum text-foreground">{total} questões</b>. Já deixamos{" "}
          <b className="tnum text-foreground">{opcoes.quantidade}</b> marcadas — o bastante pra uma
          sessão e pra um arquivo que cabe na impressora. Suba se quiser mais.
        </p>

        <div className="mt-5">
          <OpcoesImpressao
            total={total}
            paginas={paginas}
            opcoes={opcoes}
            temResolucao={temResolucao}
            permitirRecorte
            onMudar={onMudar}
          />
        </div>

        <button
          type="button"
          onClick={onPronto}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-questly-green px-5 text-[15px] font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99] dark:text-[#0c1512]"
        >
          <FileText size={17} strokeWidth={2.1} />
          Gerar folha · {opcoes.quantidade} {opcoes.quantidade === 1 ? "questão" : "questões"}
        </button>
        <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
          Dá pra mudar tudo isso depois, sem recomeçar.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Opções (usadas no preparo e na barra)
// ---------------------------------------------------------------------------

function OpcoesImpressao({
  total,
  paginas,
  opcoes,
  temResolucao,
  permitirRecorte,
  onMudar,
}: {
  total: number;
  paginas: number;
  opcoes: OpcoesFolha;
  temResolucao: boolean;
  permitirRecorte: boolean;
  onMudar: <K extends keyof OpcoesFolha>(chave: K, valor: OpcoesFolha[K]) => void;
}) {
  const sugestoes = useMemo(() => sugestoesDeQuantidade(total), [total]);

  return (
    <div className="flex flex-col gap-4">
      {permitirRecorte && total > 1 && (
        <Campo icone={<ListChecks size={13} />} rotulo="Quantas questões">
          <div className="flex flex-wrap items-center gap-1.5">
            {sugestoes.map((n) => (
              <Chip
                key={n}
                ativo={opcoes.quantidade === n}
                onClick={() => onMudar("quantidade", n)}
              >
                {n === total ? `Todas (${n})` : n}
              </Chip>
            ))}
            <label className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="sr-only">Quantidade personalizada</span>
              <input
                type="number"
                min={1}
                max={total}
                value={opcoes.quantidade}
                onChange={(e) => onMudar("quantidade", limitarQuantidade(Number(e.target.value), total))}
                className="tnum h-9 w-[72px] rounded-lg border border-border bg-card px-2 text-[12.5px] font-semibold"
              />
            </label>
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">
            As {opcoes.quantidade} primeiras da lista · ~{paginas} {paginas === 1 ? "página" : "páginas"}{" "}
            no A4.
          </p>
          {/* Aviso, não bloqueio: a pré-visualização do Chrome falha em
              documentos muito longos com muitas figuras, e sem isto o aluno
              conclui que o site quebrou. */}
          {paginas > PAGINAS_DEMAIS && (
            <p className="mt-1.5 text-[11.5px] font-medium text-questly-orange-dark">
              Arquivo longo. Alguns navegadores falham ao gerar PDFs desse tamanho — se der erro, baixe
              em duas partes ou escolha menos espaço pra resolver.
            </p>
          )}
        </Campo>
      )}

      <Campo icone={<Check size={13} />} rotulo="Respostas">
        <div className="flex flex-wrap gap-1.5">
          <Chip ativo={opcoes.gabarito} onClick={() => onMudar("gabarito", true)}>
            Gabarito no fim
          </Chip>
          <Chip ativo={!opcoes.gabarito} onClick={() => onMudar("gabarito", false)}>
            Sem gabarito
          </Chip>
          {temResolucao && opcoes.gabarito && (
            <Chip ativo={opcoes.resolucoes} onClick={() => onMudar("resolucoes", !opcoes.resolucoes)}>
              {opcoes.resolucoes ? "Com resoluções" : "Só as letras"}
            </Chip>
          )}
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          {opcoes.gabarito
            ? "Sai numa folha separada, no fim — dá pra destacar e deixar de lado enquanto resolve."
            : "A folha vai sem respostas. Confira depois no app, com a análise de erros."}
        </p>
      </Campo>

      <Campo icone={<Ruler size={13} />} rotulo="Espaço pra resolver">
        <div className="flex flex-wrap gap-1.5">
          {ESPACAMENTOS.map((e) => (
            <Chip
              key={e.valor}
              ativo={opcoes.espacamento === e.valor}
              onClick={() => onMudar("espacamento", e.valor as Espacamento)}
            >
              {e.rotulo}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          {ESPACAMENTOS.find((e) => e.valor === opcoes.espacamento)?.ajuda}
        </p>
      </Campo>

      <Campo icone={<Layers size={13} />} rotulo="Folhas extras">
        <div className="flex flex-wrap gap-1.5">
          <Chip
            ativo={opcoes.cartaoResposta}
            onClick={() => onMudar("cartaoResposta", !opcoes.cartaoResposta)}
          >
            <SquarePen size={12} className="mr-1.5" />
            Cartão-resposta
          </Chip>
          <Chip
            ativo={opcoes.identificacao}
            onClick={() => onMudar("identificacao", !opcoes.identificacao)}
          >
            Cabeçalho de identificação
          </Chip>
        </div>
      </Campo>
    </div>
  );
}

function Campo({
  icone,
  rotulo,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {icone}
        {rotulo}
      </span>
      {children}
    </div>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`tnum inline-flex min-h-9 items-center rounded-lg border px-3 text-[12.5px] font-bold transition-colors ${
        ativo
          ? "border-questly-green bg-questly-green-light text-questly-green-dark"
          : "border-border bg-card text-muted-foreground hover:border-questly-green/45 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
