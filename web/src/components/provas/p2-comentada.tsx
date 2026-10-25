"use client";

// Gabarito comentado da P2 2026.2 (Física I e Física 2 da UFF) — a peça de
// divulgação da P3. Ver lib/provas/p2-2026-2.ts pra por que esta página mostra
// gabarito e resolução de graça quando o resto do acervo não mostra.
//
// Dois modos, e o segundo é o que faz a página valer o link no grupo:
//   • "Gabarito aberto": a resposta certa marcada e, embaixo de cada
//     alternativa errada, o erro de raciocínio que leva a ela — é o que o
//     gabarito oficial não tem;
//   • "Modo prova": as respostas somem, o visitante marca a dele, vê na hora
//     se acertou e por quê, e termina com uma nota. Quem tirou 9/15 é
//     exatamente quem vai querer a versão parecida.
//
// Os botões de treino são <a> e não <Link>: apontam pra uma rota GET que cria
// simulado (ou manda pro cadastro), e prefetch numa rota assim não faz sentido.
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookCheck,
  Check,
  Eye,
  EyeOff,
  History,
  Lightbulb,
  PenLine,
  RotateCcw,
  Target,
  Timer,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FiguraQuestao } from "@/components/questao/figura-questao";
import { MathText } from "@/components/questao/math-text";
import {
  hrefTreino,
  type Letra,
  type ProvaComentada,
  type QuestaoComentada,
} from "@/lib/provas/p2-2026-2";
import type { ContagemP3 } from "@/lib/provas/p2-2026-2-treino";

const LETRAS: Letra[] = ["A", "B", "C", "D", "E"];

/** MathText + o pouco de markdown que o conteúdo usa (**negrito**, *itálico*).
 *  O LaTeX desta prova não usa asterisco, então a divisão é segura. */
function Rico({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  const partes = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            <MathText text={p.slice(2, -2)} />
          </strong>
        ) : p.length > 2 && p.startsWith("*") && p.endsWith("*") ? (
          <em key={i}>
            <MathText text={p.slice(1, -1)} />
          </em>
        ) : (
          <MathText key={i} text={p} />
        ),
      )}
    </>
  );
}

export type ExtrasProva = {
  chave: ProvaComentada["chave"];
  totalBanco: number | null;
  p3: ContagemP3[];
};

export function P2Comentada({
  provas,
  extras,
  treinoIndisponivel,
}: {
  provas: ProvaComentada[];
  extras: ExtrasProva[];
  treinoIndisponivel: boolean;
}) {
  const [chave, setChave] = useState<ProvaComentada["chave"]>(provas[0].chave);
  const [modoProva, setModoProva] = useState(false);
  // Respostas do "modo prova", por prova+questão. Ficam na memória da aba: é
  // um teste de 10 minutos, não um registro.
  const [marcadas, setMarcadas] = useState<Record<string, Letra>>({});

  const prova = provas.find((p) => p.chave === chave) ?? provas[0];
  const extra = extras.find((e) => e.chave === prova.chave);

  const placar = useMemo(() => {
    let feitas = 0;
    let acertos = 0;
    for (const q of prova.questoes) {
      const m = marcadas[`${prova.chave}-${q.numero}`];
      if (!m) continue;
      feitas += 1;
      if (m === q.gabarito) acertos += 1;
    }
    return { feitas, acertos, total: prova.questoes.length };
  }, [marcadas, prova]);

  const assuntos = useMemo(() => {
    const cont = new Map<string, number[]>();
    for (const q of prova.questoes) cont.set(q.assunto, [...(cont.get(q.assunto) ?? []), q.numero]);
    return [...cont.entries()];
  }, [prova]);

  function marcar(q: QuestaoComentada, letra: Letra) {
    const k = `${prova.chave}-${q.numero}`;
    if (marcadas[k]) return; // uma tentativa por questão, como na prova
    setMarcadas((m) => ({ ...m, [k]: letra }));
  }

  function recomecar() {
    setMarcadas((m) =>
      Object.fromEntries(Object.entries(m).filter(([k]) => !k.startsWith(`${prova.chave}-`))),
    );
  }

  const jaNoBanco = prova.questoes.filter((q) => q.jaEstavaNoBanco).map((q) => q.numero);

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="mx-auto max-w-5xl px-5 pt-10 pb-8 sm:pt-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-questly-green/30 bg-questly-green/10 px-3 py-1 text-xs font-medium text-questly-green-dark dark:text-questly-green">
          <BookCheck className="size-3.5" />
          UFF · P2 de 17/10/2026
        </span>
        <h1 className="mt-5 text-3xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
          A P2 de Física I e Física 2,{" "}
          <span className="bg-gradient-to-br from-questly-green to-questly-green-deep bg-clip-text text-transparent">
            corrigida e comentada.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
          O gabarito você já viu. Aqui está o <strong className="font-semibold text-foreground">porquê</strong>{" "}
          de cada resposta — inclusive de cada alternativa errada, que é onde a nota vai embora — e
          duas provas parecidas, montadas com o nosso banco, pra treinar antes da P3.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "30 questões resolvidas",
            "120 alternativas erradas explicadas",
            "2 versões parecidas por prova",
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
          <a href="#gabarito" className={`${buttonVariants({ size: "lg" })} h-12 px-6 text-[15px]`}>
            Ver o gabarito comentado
            <ArrowRight />
          </a>
          <a
            href="#treinar"
            className={`${buttonVariants({ size: "lg", variant: "outline" })} h-12 px-6 text-[15px]`}
          >
            Treinar pra P3
          </a>
        </div>

        {treinoIndisponivel && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-questly-orange/40 bg-questly-orange/10 px-4 py-3 text-sm font-medium text-questly-orange-dark dark:text-questly-orange"
          >
            Não conseguimos montar esse treino agora. Tente de novo em instantes, ou monte um simulado
            em Simulados.
          </p>
        )}
      </section>

      {/* ------------------------------------------- abas + modo (grudados) */}
      <div
        id="gabarito"
        className="sticky top-16 z-30 scroll-mt-16 border-y border-border/60 bg-background/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div role="tablist" aria-label="Prova" className="flex rounded-xl bg-muted p-1">
            {provas.map((p) => (
              <button
                key={p.chave}
                type="button"
                role="tab"
                aria-selected={p.chave === prova.chave}
                onClick={() => setChave(p.chave)}
                className={`cursor-pointer rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors ${
                  p.chave === prova.chave
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.materia === "Física II" ? "Física 2" : p.materia}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {modoProva && (
              <span className="tnum rounded-lg bg-muted px-3 py-2 text-[13px] font-semibold">
                {placar.acertos}/{placar.feitas} certas
              </span>
            )}
            <button
              type="button"
              onClick={() => setModoProva((v) => !v)}
              aria-pressed={modoProva}
              className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-4 text-[13px] font-semibold transition-colors ${
                modoProva
                  ? "border-questly-green/40 bg-questly-green/10 text-questly-green-dark dark:text-questly-green"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {modoProva ? <Eye size={15} strokeWidth={2.1} /> : <EyeOff size={15} strokeWidth={2.1} />}
              {modoProva ? "Mostrar gabarito" : "Modo prova: tentar antes"}
            </button>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-5 py-10">
        {/* ------------------------------------------- cartão-resposta */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="surface rounded-2xl p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {prova.titulo} · {prova.versao}
              </h2>
              <span className="text-[12.5px] text-muted-foreground">
                {prova.questoes.length} questões · {prova.duracao}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {modoProva
                ? "Cartão-resposta: vai preenchendo conforme você responde lá embaixo."
                : "Toque num número pra ir direto à questão."}
            </p>
            <ol className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-8">
              {prova.questoes.map((q) => {
                const m = marcadas[`${prova.chave}-${q.numero}`];
                const mostrar = !modoProva || m;
                const certo = m ? m === q.gabarito : null;
                return (
                  <li key={q.numero}>
                    <a
                      href={`#q-${prova.chave}-${q.numero}`}
                      className={`flex flex-col items-center rounded-xl border px-1 py-2 transition-colors ${
                        modoProva && certo === true
                          ? "border-questly-green/40 bg-questly-green/10"
                          : modoProva && certo === false
                            ? "border-questly-red/40 bg-questly-red/10"
                            : "border-border bg-background hover:border-questly-green/40"
                      }`}
                    >
                      <span className="tnum text-[11px] font-medium text-muted-foreground">{q.numero}</span>
                      <span className="font-heading text-lg font-bold">
                        {mostrar ? q.gabarito : "·"}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
            {modoProva && placar.feitas === placar.total && (
              <ResultadoModoProva
                acertos={placar.acertos}
                total={placar.total}
                onRecomecar={recomecar}
              />
            )}
          </div>

          {/* mapa da prova por assunto */}
          <div className="surface rounded-2xl p-5">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold">
              <Target size={15} strokeWidth={2.2} className="text-questly-green" />
              O que a prova cobrou
            </h3>
            <ul className="mt-3 space-y-2">
              {assuntos.map(([nome, nums]) => (
                <li key={nome} className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="min-w-0 leading-snug">{nome}</span>
                  <span className="tnum shrink-0 text-muted-foreground">
                    {nums.map((n) => `Q${n}`).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {jaNoBanco.length > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-questly-gold/35 bg-questly-gold/10 px-5 py-4">
            <History size={18} strokeWidth={2.1} className="mt-0.5 shrink-0 text-questly-gold" />
            <p className="text-[14px] leading-relaxed text-pretty">
              <strong className="font-semibold">
                As questões {jaNoBanco.join(" e ")} desta prova já estavam no nosso banco
              </strong>
              , praticamente idênticas, vindas de provas antigas da UFF. Quem treinou com elas viu
              essas questões antes da prova.
            </p>
          </div>
        )}

        {/* --------------------------------------------------- questões */}
        <div className="mt-10 space-y-6">
          {prova.questoes.map((q) => (
            <CartaoQuestao
              key={`${prova.chave}-${q.numero}`}
              id={`q-${prova.chave}-${q.numero}`}
              q={q}
              modoProva={modoProva}
              marcada={marcadas[`${prova.chave}-${q.numero}`] ?? null}
              onMarcar={(l) => marcar(q, l)}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- treinar */}
      <section id="treinar" className="scroll-mt-32 border-t border-border/60 bg-muted/20 py-14">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            Treine com provas parecidas com esta
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground text-pretty">
            Pra cada uma das 15 questões da P2 de {prova.materia === "Física II" ? "Física 2" : prova.materia},
            separamos questões do banco que cobram o mesmo assunto com o mesmo tipo de raciocínio.
            Cada versão tem 15 questões na mesma ordem da prova, relógio de 2 horas e resolução
            passo a passo no final.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {(["v1", "v2"] as const).map((v, i) => (
              <div key={v} className="surface flex flex-col rounded-2xl p-5">
                <span className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                  Versão parecida {i + 1}
                </span>
                <p className="mt-2 font-heading text-lg font-semibold">
                  P2 de {prova.materia === "Física II" ? "Física 2" : prova.materia}, outra prova
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Timer size={13} strokeWidth={2.2} />
                  15 questões · 2 horas · correção na hora
                </p>
                <a
                  href={hrefTreino(`${prova.chave}-${v}`)}
                  rel="nofollow"
                  className={`${buttonVariants({ size: "lg" })} mt-5 h-11`}
                >
                  Fazer a versão {i + 1}
                  <ArrowRight />
                </a>
              </div>
            ))}
          </div>

          {/* ------------------------------------------------------- P3 */}
          <div className="mt-12 rounded-3xl border border-questly-green/30 bg-gradient-to-br from-questly-green/10 to-transparent p-6 sm:p-8">
            <span className="text-[11px] font-bold tracking-[0.12em] text-questly-green-dark uppercase dark:text-questly-green">
              Próxima parada
            </span>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
              A P3 de {prova.materia === "Física II" ? "Física 2" : prova.materia} cobra o que vem
              depois da P2
            </h3>
            <p className="mt-2 max-w-2xl text-muted-foreground text-pretty">
              Pela ementa, são estes assuntos — e o banco já tem questão de prova antiga, com
              resolução, pra cada um deles
              {extra?.totalBanco ? ` (no total, ${extra.totalBanco} questões de ${prova.materia === "Física II" ? "Física 2" : prova.materia})` : ""}.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {(extra?.p3.length ? extra.p3 : prova.topicosP3.map((nome) => ({ nome, questoes: 0 }))).map(
                (t) => (
                  <li key={t.nome} className="surface rounded-xl px-4 py-3">
                    <p className="text-[14px] font-semibold leading-snug">{t.nome}</p>
                    {t.questoes > 0 && (
                      <p className="tnum mt-0.5 text-[12.5px] text-muted-foreground">
                        {t.questoes} questões no banco
                      </p>
                    )}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={hrefTreino(`${prova.chave}-p3`)}
                rel="nofollow"
                className={`${buttonVariants({ size: "lg" })} h-12 px-6 text-[15px]`}
              >
                Fazer um simulado da P3
                <ArrowRight />
              </a>
              <span className="text-sm text-muted-foreground">15 questões · 2 horas · grátis</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ResultadoModoProva({
  acertos,
  total,
  onRecomecar,
}: {
  acertos: number;
  total: number;
  onRecomecar: () => void;
}) {
  const nota = Math.round((acertos / total) * 100) / 10;
  const frase =
    acertos === total
      ? "Gabaritou. Agora tente as versões parecidas — sem ter visto o gabarito antes."
      : acertos >= total * 0.7
        ? "Passaria. As versões parecidas mostram se foi domínio ou sorte."
        : "Os comentários de cada questão mostram exatamente onde o raciocínio desviou. Depois, treine a versão parecida.";
  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl bg-muted/70 px-4 py-3.5">
      <span className="tnum font-heading text-3xl font-bold">
        {nota.toFixed(1).replace(".", ",")}
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-pretty">
        <strong className="font-semibold">
          {acertos} de {total}.
        </strong>{" "}
        {frase}
      </p>
      <div className="flex items-center gap-2">
        <a href="#treinar" className={`${buttonVariants({ size: "sm" })}`}>
          Treinar
        </a>
        <button
          type="button"
          onClick={onRecomecar}
          className={`${buttonVariants({ size: "sm", variant: "outline" })} cursor-pointer`}
        >
          <RotateCcw />
          Refazer
        </button>
      </div>
    </div>
  );
}

function CartaoQuestao({
  id,
  q,
  modoProva,
  marcada,
  onMarcar,
}: {
  id: string;
  q: QuestaoComentada;
  modoProva: boolean;
  marcada: Letra | null;
  onMarcar: (l: Letra) => void;
}) {
  // No modo prova, a questão só se revela depois da tentativa.
  const revelada = !modoProva || marcada !== null;
  const temImagemNasAlternativas = LETRAS.some((l) => q.alternativas[l].imagem);

  return (
    <article id={id} className="surface scroll-mt-36 rounded-2xl p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-heading text-[15px] font-bold">Questão {q.numero}</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground">
          {q.assunto}
        </span>
        {q.raciocinioObrigatorio && (
          <span className="inline-flex items-center gap-1 rounded-full bg-questly-blue/10 px-2.5 py-0.5 text-[11.5px] font-medium text-questly-blue">
            <PenLine size={11} strokeWidth={2.4} />
            Exigia o raciocínio escrito
          </span>
        )}
        {q.jaEstavaNoBanco && (
          <span className="inline-flex items-center gap-1 rounded-full bg-questly-gold/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-questly-gold">
            <History size={11} strokeWidth={2.4} />
            Já estava no banco
          </span>
        )}
      </header>

      <div className="mt-3 text-[15px] leading-relaxed">
        <Rico text={q.enunciado} />
      </div>

      {q.figura && (
        <FiguraQuestao
          src={q.figura}
          alt={`Figura da questão ${q.numero}`}
          className="my-4 h-44 rounded-xl sm:h-56"
          prioridade={false}
        />
      )}

      <ul
        className={`mt-4 ${temImagemNasAlternativas ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "space-y-2"}`}
      >
        {LETRAS.map((l) => {
          const alt = q.alternativas[l];
          const certa = l === q.gabarito;
          const escolhida = marcada === l;
          const destaque = revelada && certa;
          const erroDoAluno = revelada && escolhida && !certa;
          const porQue = q.porQueNao[l];
          // Gabarito aberto: explica todas as erradas. Modo prova: só a que
          // o aluno marcou — explicar as outras quatro afogaria a dele.
          const explicar = revelada && !certa && porQue && (!modoProva || escolhida);

          const conteudo = (
            <>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${
                  destaque
                    ? "bg-questly-green text-white dark:text-[#0c1512]"
                    : erroDoAluno
                      ? "bg-questly-red text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {destaque ? <Check size={15} strokeWidth={3} /> : erroDoAluno ? <X size={15} strokeWidth={3} /> : l}
              </span>
              <span className="min-w-0 flex-1">
                {alt.imagem ? (
                  <FiguraQuestao
                    src={alt.imagem}
                    alt={`Alternativa ${l}`}
                    className="h-28 rounded-lg"
                    prioridade={false}
                  />
                ) : (
                  <span className="block text-[14px] leading-relaxed">
                    <Rico text={alt.texto} />
                  </span>
                )}
                {explicar && (
                  <span className="mt-1.5 block text-[12.5px] leading-snug text-muted-foreground">
                    <strong className="font-semibold text-questly-red-dark dark:text-questly-red">
                      Por que não:
                    </strong>{" "}
                    <Rico text={porQue} />
                  </span>
                )}
              </span>
            </>
          );

          const classe = `flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            destaque
              ? "border-questly-green/45 bg-questly-green/10"
              : erroDoAluno
                ? "border-questly-red/40 bg-questly-red/10"
                : "border-border"
          }`;

          return (
            <li key={l}>
              {modoProva && !revelada ? (
                <button
                  type="button"
                  onClick={() => onMarcar(l)}
                  className={`${classe} cursor-pointer hover:border-questly-green/45 hover:bg-muted/50`}
                >
                  {conteudo}
                </button>
              ) : (
                <div className={classe}>{conteudo}</div>
              )}
            </li>
          );
        })}
      </ul>

      {revelada && (
        <div className="mt-4 rounded-xl bg-muted/60 px-4 py-3.5 text-[14px] leading-relaxed">
          <b className="mb-1 flex items-center gap-1.5 font-semibold">
            <Lightbulb size={14} strokeWidth={2} className="text-questly-gold" />
            Resolução
          </b>
          <span className="text-muted-foreground">
            <Rico text={q.resolucao} />
          </span>
        </div>
      )}
    </article>
  );
}
