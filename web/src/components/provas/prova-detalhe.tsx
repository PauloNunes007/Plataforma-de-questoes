// Página pública de UMA prova antiga (ex.: Física II · P1 de 2023.1 da UFF).
//
// Existe por causa da busca de cauda longa: quem procura "p1 de fisica 2 uff
// 2023" não procura uma plataforma de estudos, procura AQUELA prova. Uma
// página por prova responde exatamente essa busca — e cada uma delas leva de
// volta pro catálogo e pras outras provas da mesma disciplina, que é o que
// transforma 31 páginas num acervo navegável em vez de 31 becos.
//
// O corte entre o que é público e o que é pago está no componente inteiro:
// aparece a prova (quantas questões, quais assuntos, uma questão de amostra
// por extenso), não aparece a resposta. `lib/provas/catalogo.ts` nem lê
// gabarito e resolucao do banco — não há o que vazar aqui.
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleCheck, Lock, Sparkles, Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FiguraQuestao } from "@/components/questao/figura-questao";
import { MathText } from "@/components/questao/math-text";
import type { ProvaCatalogo, ProvaPublica } from "@/lib/provas/catalogo";

const ROTULO_DIFICULDADE: Record<string, string> = {
  facil: "fáceis",
  medio: "médias",
  dificil: "difíceis",
};

export function ProvaDetalhe({
  dados,
  irmas,
}: {
  dados: ProvaPublica;
  /** Outras provas da MESMA disciplina, pro leitor não terminar num beco. */
  irmas: ProvaCatalogo[];
}) {
  const { prova, topicos, subtopicos, dificuldades, amostra } = dados;
  const titulo = `${prova.materiaNome} · ${prova.prova} de ${prova.periodo}`;

  const mix = (["facil", "medio", "dificil"] as const)
    .filter((d) => dificuldades[d] > 0)
    .map((d) => `${dificuldades[d]} ${ROTULO_DIFICULDADE[d]}`);

  return (
    <>
      {/* --------------------------------------------------------- cabeçalho */}
      <section className="mx-auto max-w-4xl px-5 pt-10 pb-10">
        <Link
          href="/provas/fisica-uff"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Provas de Física da UFF
        </Link>

        <h1 className="mt-5 text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[2.75rem]">
          {prova.materiaNome} da UFF — {prova.prova} de {prova.periodo}
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
          A prova completa, digitada do original:{" "}
          <strong className="font-semibold text-foreground">{prova.questoes} questões</strong> na
          ordem em que foram aplicadas, cada uma catalogada pelo assunto que cobra e com resolução
          passo a passo.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            `${prova.questoes} questões`,
            `${prova.duracaoMin} min sugeridos`,
            `${topicos.length} ${topicos.length === 1 ? "assunto" : "assuntos"}`,
            ...(mix.length > 0 ? [mix.join(" · ")] : []),
          ].map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-[12.5px] font-medium"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/login" className={`${buttonVariants({ size: "lg" })} h-12 px-6 text-[15px]`}>
            Refazer esta prova cronometrada
            <ArrowRight />
          </Link>
          <span className="text-sm text-muted-foreground">Grátis · sem cartão</span>
        </div>
      </section>

      {/* ------------------------------------------------------- o que cobra */}
      <section className="border-y border-border/60 bg-muted/20 py-14">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            O que esta prova cobra
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground text-pretty">
            Cada questão foi classificada no tópico da ementa a que pertence. É isso que permite
            estudar só o recorte da sua turma em vez de refazer a prova inteira.
          </p>

          <ul className="mt-7 space-y-2">
            {topicos.map((t) => (
              <li key={t.nome} className="surface flex items-center gap-3 rounded-xl px-4 py-3">
                <CircleCheck
                  className="size-4 shrink-0 text-questly-green"
                  strokeWidth={2.5}
                />
                <span className="min-w-0 flex-1 text-[14.5px] font-medium">{t.nome}</span>
                <span className="tnum shrink-0 text-[12.5px] text-muted-foreground">
                  {t.questoes} {t.questoes === 1 ? "questão" : "questões"}
                </span>
              </li>
            ))}
          </ul>

          {subtopicos.length > 0 && (
            <div className="mt-7">
              <p className="text-[13px] font-semibold text-muted-foreground">
                Recortes específicos que aparecem nela
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {subtopicos.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------- amostra */}
      {amostra && (
        <section className="mx-auto max-w-4xl px-5 py-14">
          <h2 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            Uma questão desta prova
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground text-pretty">
            Como ela aparece na plataforma — enunciado, figura e alternativas. A resposta comentada é
            o que fica do outro lado do cadastro.
          </p>

          <article className="surface mt-7 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {amostra.ordem != null && (
                <span className="inline-flex items-center rounded-full bg-questly-green/12 px-2.5 py-1 text-[11.5px] font-semibold text-questly-green-dark dark:text-questly-green">
                  Questão {amostra.ordem}
                </span>
              )}
              {amostra.topicoNome && (
                <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11.5px] font-medium">
                  {amostra.topicoNome}
                </span>
              )}
              {amostra.subtopico && (
                <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11.5px] font-medium">
                  {amostra.subtopico}
                </span>
              )}
            </div>

            <div className="mt-5 text-[15.5px] leading-relaxed sm:text-[16px]">
              <MathText text={amostra.enunciado} />
            </div>

            {amostra.imagemUrl && (
              <FiguraQuestao
                src={amostra.imagemUrl}
                alt={`Figura da questão ${amostra.ordem ?? ""} da ${titulo}`}
                className="mt-5 h-[280px] rounded-xl border border-border p-3 sm:h-[380px]"
              />
            )}

            <ul className="mt-6 flex flex-col gap-2.5">
              {amostra.alternativas.map((a) => (
                <li
                  key={a.letra}
                  className="flex items-start gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-[12px] font-bold">
                    {a.letra}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] leading-relaxed">
                    {a.imagem && (
                      <FiguraQuestao
                        src={a.imagem}
                        alt={`Figura da alternativa ${a.letra}`}
                        className="mb-2 h-[150px] w-full rounded-lg border border-border p-2"
                        prioridade={false}
                      />
                    )}
                    <MathText text={a.texto} />
                  </span>
                </li>
              ))}
            </ul>

            {/* o corte: daqui pra frente é produto */}
            <div className="mt-7 rounded-2xl border border-questly-green/30 bg-questly-green/[0.06] p-5">
              <p className="flex items-center gap-2 text-[14px] font-semibold">
                <Lock className="size-4 text-questly-green" strokeWidth={2.5} />
                Gabarito e resolução passo a passo
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground text-pretty">
                Na plataforma, esta questão vem com a resposta certa, o caminho até ela e o registro
                do seu acerto no tópico — pra você ver, no fim do semestre, em qual assunto ainda
                está escorregando.
              </p>
              <Link href="/login" className={`${buttonVariants()} mt-4`}>
                Criar conta e ver a resolução
                <ArrowRight />
              </Link>
            </div>
          </article>
        </section>
      )}

      {/* ------------------------------------------------------------- irmãs */}
      {irmas.length > 0 && (
        <section className="border-t border-border/60 bg-muted/20 py-14">
          <div className="mx-auto max-w-4xl px-5">
            <h2 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              Outras provas de {prova.materiaNome}
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {irmas.map((p) => (
                <li key={p.codigo}>
                  <Link
                    href={`/provas/fisica-uff/${p.slug}`}
                    className="surface group flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-questly-green/40"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-questly-green/12 text-[12.5px] font-bold text-questly-green-dark dark:text-questly-green">
                      {p.prova}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] leading-tight font-semibold">
                        {p.prova} de {p.periodo}
                      </span>
                      <span className="tnum mt-0.5 block text-[12px] text-muted-foreground">
                        {p.questoes} questões
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/provas/fisica-uff"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-questly-green-dark transition-opacity hover:opacity-80 dark:text-questly-green"
            >
              Ver o catálogo completo
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- cta final */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="surface rounded-3xl p-8 text-center sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-questly-green/12 px-3 py-1 text-xs font-semibold text-questly-green-dark dark:text-questly-green">
            <Sparkles className="size-3.5" strokeWidth={2.5} />
            {prova.questoes} questões resolvidas esperando
          </span>
          <h2 className="mx-auto mt-5 max-w-xl text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            Faça a {prova.prova} de {prova.periodo} como se fosse hoje.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground text-pretty">
            Relógio ligado, ordem original, boletim no fim e a resolução de cada questão que você
            errou.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className={`${buttonVariants({ size: "lg" })} h-12 px-7 text-[15px]`}
            >
              Criar conta grátis
              <ArrowRight />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Timer className="size-4" strokeWidth={2} />
              {prova.duracaoMin} minutos
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
