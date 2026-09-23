"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  FileCheck2,
  FileText,
  Info,
  Layers,
  ListChecks,
  Loader2,
  Printer,
  Ruler,
  Settings2,
  SquarePen,
  Share2,
  X,
} from "lucide-react";
import type { Pergunta } from "@/lib/questao/types";
import { CSS_IMPRESSAO } from "@/components/imprimir/estilos-impressao";
import { FolhaProva, type MoldeUff, type VarianteFolha } from "@/components/imprimir/folha-prova";
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
import type { ProgressoPdf } from "@/lib/imprimir/tipos-pdf";

// A TELA DE EXPORTAR: um passo de preparo e, depois dele, a folha.
//
// O BOTÃO PRINCIPAL BAIXA UM PDF — não abre o diálogo de impressão. A diferença
// não é de rótulo: até aqui o "PDF" era o *Imprimir → Salvar como PDF* do
// navegador, e isso trazia três defeitos que não eram do nosso CSS (arquivo sem
// nome, "Falha ao carregar documento PDF" em folha longa, e nada acontecendo no
// CELULAR, onde `window.print()` é opcional e várias vezes não faz nada). Hoje
// o arquivo é montado aqui, em `lib/imprimir/gerar-pdf.ts`, e sai por um
// download comum. Imprimir continua existindo como botão secundário, pra quem
// tem impressora ligada e quer pular o arquivo.
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
  variante = "lista",
  moldeUff = null,
  avisoCota = null,
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
  /** O molde da folha — ver folha-prova.tsx. */
  variante?: VarianteFolha;
  /** Só pro molde `uff`: qual prova do semestre esta folha replica. */
  moldeUff?: MoldeUff | null;
  /**
   * Uma linha sobre a COTA de exportação (lib/imprimir/cota.ts), quando há o
   * que dizer: "restam 2 exportações nesta semana" ou "a lista tem 120
   * questões e a folha leva as 60 primeiras".
   *
   * Vem pronta do servidor, que é quem conhece a contagem, e sai com
   * `nao-imprimir` — é conversa com o aluno, não parte do documento.
   */
  avisoCota?: string | null;
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

  // O caminho Ctrl+P continua existindo, e o nome do arquivo dele sai do
  // `document.title`. Trocado na MONTAGEM (e devolvido no unmount), nunca no
  // clique: mexer no documento no instante em que o navegador monta a
  // pré-visualização é caminho conhecido pra "Falha ao carregar documento PDF".
  // Pro botão "Baixar PDF" isso é irrelevante — lá o nome é nosso.
  const arquivo = nomeDoArquivo(disciplina, titulo);
  useEffect(() => {
    const anterior = document.title;
    document.title = arquivo;
    return () => {
      document.title = anterior;
    };
  }, [arquivo]);

  // ------------------------------------------------------------- baixar PDF
  const folhaRef = useRef<HTMLDivElement | null>(null);
  const [progresso, setProgresso] = useState<ProgressoPdf | null>(null);
  const [erroPdf, setErroPdf] = useState<string | null>(null);
  const [pronto, setPronto] = useState<ArquivoPronto | null>(null);

  // A URL do blob segura o arquivo na memória até alguém soltar.
  useEffect(() => {
    return () => {
      if (pronto) URL.revokeObjectURL(pronto.url);
    };
  }, [pronto]);

  async function baixarPdf() {
    const folha = folhaRef.current;
    if (!folha || progresso) return;
    setErroPdf(null);
    if (pronto) {
      URL.revokeObjectURL(pronto.url);
      setPronto(null);
    }
    setProgresso({ feitos: 0, total: selecionadas.length + 2 });
    try {
      const { baixarFolhaEmPdf } = await import("@/lib/imprimir/gerar-pdf");
      const { blob, nome } = await baixarFolhaEmPdf({
        folha,
        nomeArquivo: arquivo,
        email: emailAluno,
        onProgresso: setProgresso,
      });
      setPronto(entregarPdf(blob, nome));
    } catch (e) {
      console.error("[imprimir] falha ao gerar o PDF", e);
      setErroPdf(
        "Não consegui montar o arquivo. Tente de novo com menos questões ou com menos espaço pra resolver.",
      );
    } finally {
      setProgresso(null);
    }
  }

  return (
    <div className={`folha-raiz${progresso ? " overflow-hidden" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS_IMPRESSAO }} />

      {avisoCota && (
        <div className="nao-imprimir border-b border-questly-gold/25 bg-questly-gold/[0.07]">
          <p className="casca-leitura flex items-start gap-2 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
            <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-questly-gold" />
            <span>{avisoCota}</span>
          </p>
        </div>
      )}

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

              {/* Imprimir direto é o caminho SECUNDÁRIO: serve pra quem tem a
                  impressora ligada agora. No celular ele costuma não fazer
                  nada (`window.print()` é opcional em navegador móvel) — por
                  isso o botão principal é o que baixa o arquivo. */}
              <button
                type="button"
                onClick={() => window.print()}
                title="Enviar direto pra impressora"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <Printer size={14} strokeWidth={2} />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                type="button"
                onClick={baixarPdf}
                disabled={!!progresso}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-questly-green px-3.5 text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105 disabled:opacity-60 dark:text-[#0c1512]"
              >
                {progresso ? (
                  <Loader2 size={14} strokeWidth={2.1} className="animate-spin" />
                ) : (
                  <Download size={14} strokeWidth={2.1} />
                )}
                {progresso ? "Montando…" : "Baixar PDF"}
              </button>
            </div>

            {erroPdf && (
              <div className="casca-leitura pb-3">
                <p className="flex items-start gap-1.5 rounded-lg border border-questly-orange/40 bg-questly-orange-light px-3 py-2 text-[12px] leading-relaxed text-questly-orange-dark">
                  <AlertTriangle size={14} strokeWidth={2.1} className="mt-[1px] shrink-0" />
                  {erroPdf}
                </p>
              </div>
            )}

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
                {opcoes.gabarito ? "com gabarito no fim" : "sem gabarito"}. O arquivo é montado aqui
                e baixado pronto, em A4 — sai marcado com o seu e-mail ({emailAluno}).
              </p>
            )}
          </div>

          <FolhaProva
            folhaRef={folhaRef}
            variante={variante}
            moldeUff={moldeUff}
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

      {progresso && <ProgressoPdfOverlay progresso={progresso} />}
      {pronto && (
        <ArquivoProntoCartao
          pronto={pronto}
          onFechar={() => {
            URL.revokeObjectURL(pronto.url);
            setPronto(null);
          }}
        />
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
// Entregar o arquivo
// ---------------------------------------------------------------------------

type ArquivoPronto = { url: string; nome: string; blob: Blob; automatico: boolean };

/**
 * iPhone/iPad, inclusive o iPad que se apresenta como Mac.
 *
 * Existe porque o iOS é o caso em que o download automático não só falha como
 * ATRAPALHA: navegar pra uma `blob:` tira o aluno da página, e ele volta pra
 * uma tela que parece ter perdido o trabalho. Lá o arquivo só é oferecido.
 */
function ehIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Põe o arquivo na mão do aluno.
 *
 * O SINTOMA que isto conserta: "no celular ele fica montando o pdf e depois
 * nada acontece". A causa é que `pdf.save()` (um `<a download>` clicado por
 * script) roda DEPOIS de segundos de `await` — fora do gesto que o aluno fez —,
 * e navegador de celular engole esse clique sem erro nenhum: sem exceção, sem
 * aviso, sem arquivo. Não há como detectar a falha; dá pra não depender dela.
 *
 * Então: tenta o download automático onde ele funciona (desktop, Android), e em
 * QUALQUER caso devolve o arquivo pro cartão de "pronto", que traz um botão de
 * verdade. Um toque do aluno é um gesto legítimo em todo navegador — é o único
 * caminho que não tem como sumir em silêncio.
 */
function entregarPdf(blob: Blob, nome: string): ArquivoPronto {
  const url = URL.createObjectURL(blob);
  const automatico = !ehIOS();
  if (automatico) {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // segue pro cartão, que é o caminho garantido
    }
  }
  return { url, nome, blob, automatico };
}

/**
 * O cartão que aparece com o arquivo pronto.
 *
 * Não é um "toast" de confirmação: no celular ele É a entrega. Por isso o botão
 * principal é um `<a download>` de verdade (tocado pelo aluno, nunca clicado
 * por script) e, onde o sistema oferece, um "Salvar / compartilhar" que abre a
 * folha nativa — no iPhone é por ali que o PDF vai parar no app Arquivos.
 */
function ArquivoProntoCartao({
  pronto,
  onFechar,
}: {
  pronto: ArquivoPronto;
  onFechar: () => void;
}) {
  // Derivado, não estado: o cartão só existe depois da geração, já no cliente,
  // e a resposta não muda enquanto ele estiver na tela.
  const podeCompartilhar = useMemo(() => {
    try {
      const arquivo = new File([pronto.blob], pronto.nome, { type: "application/pdf" });
      return !!navigator.canShare?.({ files: [arquivo] });
    } catch {
      return false;
    }
  }, [pronto]);

  async function compartilhar() {
    try {
      const arquivo = new File([pronto.blob], pronto.nome, { type: "application/pdf" });
      await navigator.share({ files: [arquivo], title: pronto.nome });
    } catch {
      // cancelar a folha de compartilhamento não é erro
    }
  }

  const mb = pronto.blob.size / (1024 * 1024);

  return (
    <div className="nao-imprimir fixed inset-x-0 bottom-0 z-50 p-3 sm:p-5">
      <div className="surface mx-auto w-full max-w-[520px] p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-questly-green-light text-questly-green-dark">
            <FileCheck2 size={18} strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold leading-tight">PDF pronto</p>
            <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
              {pronto.nome} · {mb < 0.1 ? "<0,1" : mb.toFixed(1).replace(".", ",")} MB
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={pronto.url}
            download={pronto.nome}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-questly-green px-4 text-[14px] font-bold text-white transition-[filter] hover:brightness-105 dark:text-[#0c1512]"
          >
            <Download size={16} strokeWidth={2.1} />
            {pronto.automatico ? "Baixar de novo" : "Salvar o PDF"}
          </a>
          {podeCompartilhar && (
            <button
              type="button"
              onClick={compartilhar}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-[13.5px] font-semibold transition-colors hover:bg-foreground/[0.05]"
            >
              <Share2 size={15} strokeWidth={2} />
              Compartilhar
            </button>
          )}
        </div>

        {!pronto.automatico && (
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            No iPhone, toque em <b>Salvar o PDF</b> e escolha &quot;Salvar em Arquivos&quot;.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enquanto o arquivo é montado
// ---------------------------------------------------------------------------

/**
 * Tela cheia, de propósito.
 *
 * Montar o PDF mexe na largura da folha por alguns segundos (ver
 * `fixarLarguraDeRender` em lib/imprimir/gerar-pdf.ts, que a trava em 760px pra
 * o arquivo não sair com a diagramação do celular). Sem uma cortina por cima, o
 * aluno veria a página inteira "pular" e concluiria que quebrou.
 */
function ProgressoPdfOverlay({ progresso }: { progresso: ProgressoPdf }) {
  const pct = progresso.total > 0 ? Math.round((progresso.feitos / progresso.total) * 100) : 0;
  return (
    <div className="nao-imprimir fixed inset-0 z-50 flex items-center justify-center bg-background/92 backdrop-blur-sm">
      <div className="surface w-[min(340px,88vw)] p-6 text-center">
        <Loader2 size={26} strokeWidth={2} className="mx-auto animate-spin text-questly-green" />
        <p className="mt-3 text-[14px] font-bold">Montando o PDF…</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Desenhando a folha em A4. Não feche a página.
        </p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-questly-green transition-[width] duration-200"
            style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
          />
        </div>
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
          {/* Aviso, não bloqueio: montar o arquivo é trabalho do aparelho, e num
              celular antigo uma folha de 40+ páginas demora (ou falta memória).
              Sem isto o aluno conclui que o site travou. */}
          {paginas > PAGINAS_DEMAIS && (
            <p className="mt-1.5 text-[11.5px] font-medium text-questly-orange-dark">
              Arquivo longo. Montar isso pode levar um minuto — e num celular antigo pode faltar
              memória. Se travar, baixe em duas partes ou escolha menos espaço pra resolver.
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
