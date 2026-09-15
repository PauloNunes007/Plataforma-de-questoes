"use client";

import { useState } from "react";
import { Eye, Loader2, Mail, Plus, RefreshCw, Send, Trash2, TriangleAlert, X } from "lucide-react";
import {
  enviarLoteCampanhaAction,
  enviarTesteCampanhaAction,
  limparFalhasCampanhaAction,
  previaCampanhaAction,
  resumoCampanhaAction,
} from "@/lib/admin/actions-campanha";
import type { ConteudoCampanha, Destaque } from "@/lib/email/templates-campanha";
import type { ResumoCampanha } from "@/lib/email/campanha";
import { AdminTabs } from "@/components/admin/admin-tabs";

// Tela do disparo em massa. Três decisões que moldam a UI:
//
// · O TEXTO É EDITÁVEL AQUI. Copy de campanha não deve exigir deploy, e quem
//   assina a mensagem tem que poder reescrever cada frase antes de mandar.
// · A PRÉVIA É O E-MAIL DE VERDADE, renderizada num iframe com o mesmo HTML que
//   a Brevo vai receber. Preview aproximado esconde justamente o que quebra.
// · O DISPARO É EM LOTES, com o progresso à vista. O "enviar tudo" é um laço de
//   lotes, não uma requisição gigante — e ele PARA sozinho quando o saldo do
//   dia chega na reserva do transacional.

const CAMPANHA_INICIAL = "reengajamento-2026-09";

function Campo({
  rotulo,
  valor,
  onChange,
  dica,
  multilinha,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  dica?: string;
  multilinha?: boolean;
  placeholder?: string;
}) {
  const classe =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] outline-none transition-colors focus:border-questly-purple/60";
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-muted-foreground">{rotulo}</span>
      {multilinha ? (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${classe} resize-y leading-relaxed`}
        />
      ) : (
        <input
          type="text"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={classe}
        />
      )}
      {dica && <span className="mt-1 block text-[11.5px] leading-snug text-muted-foreground/80">{dica}</span>}
    </label>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="tnum font-heading text-[19px] font-semibold leading-none">{valor}</div>
      <div className="mt-1 text-[11.5px] text-muted-foreground">{rotulo}</div>
    </div>
  );
}

export function CampanhaEmail({
  conteudoPadrao,
  linkPadrao,
  previaInicial,
  erroBase,
  emailAdmin,
}: {
  conteudoPadrao: ConteudoCampanha;
  linkPadrao: string;
  previaInicial: string;
  erroBase: string | null;
  emailAdmin: string;
}) {
  const [conteudo, setConteudo] = useState<ConteudoCampanha>(conteudoPadrao);
  const [link, setLink] = useState(linkPadrao);
  const [campanha, setCampanha] = useState(CAMPANHA_INICIAL);
  const [incluirNaoConfirmados, setIncluirNaoConfirmados] = useState(false);

  const [previa, setPrevia] = useState(previaInicial);
  const [resumo, setResumo] = useState<ResumoCampanha | null>(null);
  const [emailTeste, setEmailTeste] = useState(emailAdmin);

  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [progresso, setProgresso] = useState<{ enviados: number; falhas: number } | null>(null);

  function set<K extends keyof ConteudoCampanha>(chave: K, valor: ConteudoCampanha[K]) {
    setConteudo((prev) => ({ ...prev, [chave]: valor }));
  }

  function setDestaque(i: number, campo: keyof Destaque, valor: string) {
    setConteudo((prev) => ({
      ...prev,
      destaques: prev.destaques.map((d, idx) => (idx === i ? { ...d, [campo]: valor } : d)),
    }));
  }

  async function atualizarPrevia() {
    setOcupado("previa");
    const res = await previaCampanhaAction(conteudo, link);
    setOcupado(null);
    if ("error" in res) {
      setAviso({ tipo: "erro", texto: res.error });
      return;
    }
    setPrevia(res.html);
  }

  async function carregarResumo() {
    setOcupado("resumo");
    const res = await resumoCampanhaAction(campanha, incluirNaoConfirmados);
    setOcupado(null);
    if ("error" in res) {
      setAviso({ tipo: "erro", texto: res.error });
      return;
    }
    setResumo(res.resumo);
    setAviso(null);
  }

  async function enviarTeste() {
    setOcupado("teste");
    const res = await enviarTesteCampanhaAction(emailTeste, conteudo, link);
    setOcupado(null);
    setAviso(
      "error" in res
        ? { tipo: "erro", texto: res.error }
        : {
            tipo: "ok",
            // Onde procurar faz parte da instrução: o e-mail leva cabeçalho de
            // campanha (List-Unsubscribe), e é justamente isso que o Gmail usa
            // pra arquivar em Promoções. Sem esta frase, o teste parece ter
            // falhado quando na verdade foi entregue.
            texto: `Teste enviado para ${emailTeste}. Procure também em Promoções e Spam — e-mail de campanha costuma cair lá. No Gmail, buscar "in:anywhere" pelo remetente acha na hora.`,
          },
    );
  }

  /**
   * Um lote. Devolve quantos ainda faltam (ou null se deu erro), pra que o
   * "enviar tudo" saiba se continua.
   */
  async function rodarLote(limite: number): Promise<number | null> {
    const res = await enviarLoteCampanhaAction({
      campanha,
      conteudo,
      link,
      incluirNaoConfirmados,
      limite,
    });
    if ("error" in res) {
      setAviso({ tipo: "erro", texto: res.error });
      return null;
    }
    const r = res.resultado;
    setProgresso((prev) => ({
      enviados: (prev?.enviados ?? 0) + r.enviados,
      falhas: (prev?.falhas ?? 0) + r.falhas,
    }));
    if (r.erros.length > 0) {
      setAviso({ tipo: "erro", texto: `Falhas neste lote — ${r.erros.join(" · ")}` });
    }
    // Nada enviado e nada pulado num lote com fila significa parede (saldo do
    // dia no limite da reserva). Devolver 0 encerra o laço em vez de girar.
    if (r.enviados === 0 && r.pulados === 0 && r.falhas === 0) return 0;
    return r.restantes;
  }

  async function dispararTudo() {
    const alvo = resumo?.restantes ?? 0;
    if (alvo === 0) {
      setAviso({ tipo: "erro", texto: "Carregue o resumo primeiro — preciso saber quantos faltam." });
      return;
    }
    if (
      !confirm(
        `Enviar o e-mail "${conteudo.assunto}" para ${alvo} aluno(s)?\n\n` +
          `Isso não tem desfazer. Mande um teste pra você antes, se ainda não mandou.`,
      )
    ) {
      return;
    }

    setOcupado("disparo");
    setProgresso({ enviados: 0, falhas: 0 });
    setAviso(null);

    // Teto de voltas como rede de segurança: se algo devolver "restantes" que
    // nunca zera, o laço termina mesmo assim em vez de martelar a Brevo.
    for (let volta = 0; volta < 40; volta++) {
      const faltam = await rodarLote(40);
      if (faltam === null) break;
      if (faltam <= 0) break;
    }

    setOcupado(null);
    await carregarResumo();
  }

  async function limparFalhas() {
    setOcupado("falhas");
    const res = await limparFalhasCampanhaAction(campanha);
    setOcupado(null);
    if ("error" in res) {
      setAviso({ tipo: "erro", texto: res.error });
      return;
    }
    setAviso({ tipo: "ok", texto: `${res.removidas} falha(s) devolvida(s) para a fila.` });
    await carregarResumo();
  }

  const podeDisparar = !ocupado && Boolean(resumo) && (resumo?.restantes ?? 0) > 0;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:py-9">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-questly-purple/12 text-questly-purple">
            <Mail size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">E-mail para a base</h1>
            <p className="text-[13px] text-muted-foreground">
              Disparo em massa para quem já tem conta. Sai em lotes, com registro de quem recebeu.
            </p>
          </div>
        </div>
        <AdminTabs />
      </div>

      {erroBase && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-questly-red/30 bg-questly-red/8 px-4 py-3 text-[13px] text-questly-red-dark">
          <TriangleAlert size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>{erroBase}</span>
        </div>
      )}

      {aviso && (
        <div
          className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-[13px] ${
            aviso.tipo === "ok"
              ? "border-questly-green/30 bg-questly-green-light text-questly-green-dark"
              : "border-questly-red/30 bg-questly-red/8 text-questly-red-dark"
          }`}
        >
          <span className="leading-relaxed">{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Fechar aviso">
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        {/* ── Coluna da esquerda: o texto e o disparo ─────────────────── */}
        <div className="flex flex-col gap-5">
          <section className="surface flex flex-col gap-3.5 p-4">
            <h2 className="font-heading text-[15px] font-semibold">Mensagem</h2>
            <Campo
              rotulo="Assunto"
              valor={conteudo.assunto}
              onChange={(v) => set("assunto", v)}
              dica="A única coisa que a pessoa lê antes de decidir abrir."
            />
            <Campo
              rotulo="Prévia (preheader)"
              valor={conteudo.preheader}
              onChange={(v) => set("preheader", v)}
              dica="Linha que o Gmail mostra ao lado do assunto, na lista."
            />
            <Campo
              rotulo="Título"
              valor={conteudo.titulo}
              onChange={(v) => set("titulo", v)}
              dica="Vira “Fulano, faz tempo que você não aparece” quando sabemos o nome."
            />
            <Campo rotulo="Abertura" valor={conteudo.intro} onChange={(v) => set("intro", v)} multilinha />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-muted-foreground">Novidades</span>
                <button
                  type="button"
                  onClick={() =>
                    setConteudo((p) => ({ ...p, destaques: [...p.destaques, { titulo: "", texto: "" }] }))
                  }
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-questly-purple hover:bg-questly-purple/10"
                >
                  <Plus size={13} strokeWidth={2.4} />
                  Adicionar
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {conteudo.destaques.map((d, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/40 p-2.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <input
                        type="text"
                        value={d.titulo}
                        onChange={(e) => setDestaque(i, "titulo", e.target.value)}
                        placeholder="Título do destaque"
                        className="min-w-0 flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] font-semibold outline-none focus:border-questly-purple/60"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConteudo((p) => ({ ...p, destaques: p.destaques.filter((_, idx) => idx !== i) }))
                        }
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-questly-red/10 hover:text-questly-red-dark"
                        aria-label="Remover destaque"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                    <textarea
                      value={d.texto}
                      onChange={(e) => setDestaque(i, "texto", e.target.value)}
                      placeholder="O que essa novidade faz, em uma frase."
                      rows={2}
                      className="w-full resize-y rounded-md border border-border bg-card px-2.5 py-1.5 text-[12.5px] leading-relaxed outline-none focus:border-questly-purple/60"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Campo rotulo="Texto do botão" valor={conteudo.rotuloBotao} onChange={(v) => set("rotuloBotao", v)} />
            <Campo
              rotulo="Link do botão"
              valor={link}
              onChange={setLink}
              dica="Para onde o botão leva. /login é o caminho mais curto de volta."
            />
            <Campo rotulo="Fecho" valor={conteudo.fecho} onChange={(v) => set("fecho", v)} multilinha />

            <button
              type="button"
              onClick={atualizarPrevia}
              disabled={ocupado !== null}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-60"
            >
              {ocupado === "previa" ? (
                <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
              ) : (
                <Eye size={14} strokeWidth={2.2} />
              )}
              Atualizar prévia
            </button>
          </section>

          <section className="surface flex flex-col gap-3.5 p-4">
            <h2 className="font-heading text-[15px] font-semibold">Disparo</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <Campo
                rotulo="Nome da campanha"
                valor={campanha}
                onChange={setCampanha}
                dica="Identifica quem já recebeu. Trocar isto recomeça do zero."
              />
              <label className="flex items-start gap-2 self-end rounded-lg border border-border bg-card px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={incluirNaoConfirmados}
                  onChange={(e) => setIncluirNaoConfirmados(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-questly-purple"
                />
                <span className="text-[12.5px] leading-snug">
                  Incluir contas não confirmadas
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                    Elas não conseguem entrar sem confirmar o e-mail — o botão não resolve nada pra elas.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={carregarResumo}
                disabled={ocupado !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-60"
              >
                {ocupado === "resumo" ? (
                  <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} strokeWidth={2.2} />
                )}
                Conferir a base
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="email"
                  value={emailTeste}
                  onChange={(e) => setEmailTeste(e.target.value)}
                  placeholder="seu@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] outline-none focus:border-questly-purple/60"
                />
                <button
                  type="button"
                  onClick={enviarTeste}
                  disabled={ocupado !== null}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-60"
                >
                  {ocupado === "teste" ? (
                    <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
                  ) : (
                    <Send size={14} strokeWidth={2.2} />
                  )}
                  Enviar teste
                </button>
              </div>
            </div>

            {resumo && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Numero rotulo="contas" valor={resumo.contas} />
                  <Numero rotulo="já receberam" valor={resumo.enviados} />
                  <Numero rotulo="faltam" valor={resumo.restantes} />
                  <Numero rotulo="saldo Brevo hoje" valor={resumo.creditos ?? "—"} />
                </div>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  {resumo.naoConfirmadas} conta(s) sem confirmar · {resumo.optOut} pediram pra não receber ·{" "}
                  {resumo.falhas} falha(s) · {resumo.emCurso} em curso.
                  {resumo.creditos !== null && (
                    <>
                      {" "}
                      O disparo para sozinho quando o saldo do dia chega em 60 — essa reserva é o que garante
                      que aluno novo consiga confirmar o cadastro.
                    </>
                  )}
                </p>
              </>
            )}

            {progresso && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-[12.5px]">
                <span className="tnum font-semibold">{progresso.enviados}</span> enviado(s)
                {progresso.falhas > 0 && (
                  <>
                    {" · "}
                    <span className="tnum font-semibold text-questly-red-dark">{progresso.falhas}</span> falha(s)
                  </>
                )}
                {ocupado === "disparo" && " · enviando…"}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={dispararTudo}
                disabled={!podeDisparar}
                className="inline-flex items-center gap-1.5 rounded-lg bg-questly-purple px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              >
                {ocupado === "disparo" ? (
                  <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
                ) : (
                  <Send size={14} strokeWidth={2.2} />
                )}
                Enviar para quem falta
              </button>

              {(resumo?.falhas ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={limparFalhas}
                  disabled={ocupado !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-60"
                >
                  {ocupado === "falhas" ? (
                    <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} strokeWidth={2.2} />
                  )}
                  Tentar as falhas de novo
                </button>
              )}
            </div>
          </section>
        </div>

        {/* ── Coluna da direita: o e-mail de verdade ──────────────────── */}
        <section className="surface flex flex-col gap-3 p-4 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[15px] font-semibold">Prévia</h2>
            <span className="text-[11.5px] text-muted-foreground">HTML idêntico ao que sai</span>
          </div>
          <iframe
            title="Prévia do e-mail"
            srcDoc={previa}
            sandbox=""
            className="h-[640px] w-full rounded-xl border border-border bg-white"
          />
        </section>
      </div>
    </div>
  );
}
