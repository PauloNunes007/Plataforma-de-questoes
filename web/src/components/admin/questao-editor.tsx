"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Save, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { limparFormatacao, montarPayload, validarAntesDeAprovar } from "@/lib/importar/logic";
import { atualizarQuestaoAdminAction, excluirQuestaoAdminAction } from "@/lib/admin/actions";
import { ImgPicker } from "@/components/importar/img-picker";
import { PreviewCard } from "@/components/importar/preview-card";
import { LETRAS_ALTERNATIVA, type ItemImportado, type Letra, type Materia, type Topico } from "@/lib/importar/types";

const BTN_PRIMARIO =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#0c1512]";
const BTN_SECUNDARIO =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50";
const INPUT =
  "rounded-lg border border-border bg-card px-2.5 py-2 text-xs outline-none transition-colors focus:border-questly-green focus:ring-2 focus:ring-questly-green/20";

export function QuestaoEditor({
  questaoId,
  itemInicial,
  materias,
  topicos,
}: {
  questaoId: string;
  itemInicial: ItemImportado;
  materias: Materia[];
  topicos: Topico[];
}) {
  const router = useRouter();
  const [item, setItem] = useState<ItemImportado>(itemInicial);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function atualizar(patch: Partial<ItemImportado>) {
    setItem((prev) => ({ ...prev, ...patch }));
    setSalvo(false);
  }

  function atualizarAlternativaTexto(letra: Letra, valor: string) {
    const alternativas = { ...item.alternativas };
    if (valor.trim()) alternativas[letra] = valor;
    else delete alternativas[letra];
    let gabarito = item.gabarito;
    if (gabarito === letra && !(alternativas[letra] || item.alternativasImagens[letra])) gabarito = null;
    atualizar({ alternativas, gabarito });
  }

  function atualizarAlternativaImagem(letra: Letra, url: string | null) {
    const alternativasImagens = { ...item.alternativasImagens };
    if (url) alternativasImagens[letra] = url;
    else delete alternativasImagens[letra];
    let gabarito = item.gabarito;
    if (gabarito === letra && !(item.alternativas[letra] || alternativasImagens[letra])) gabarito = null;
    atualizar({ alternativasImagens, gabarito });
  }

  function formatarTudoClick() {
    const alternativas = { ...item.alternativas };
    (Object.keys(alternativas) as Letra[]).forEach((l) => {
      alternativas[l] = limparFormatacao(alternativas[l]);
    });
    atualizar({
      enunciado: limparFormatacao(item.enunciado),
      alternativas,
      resolucao: item.resolucao ? limparFormatacao(item.resolucao) : item.resolucao,
    });
  }

  async function salvar() {
    const erro = validarAntesDeAprovar(item);
    if (erro) {
      alert(erro);
      return;
    }
    setSalvando(true);
    const resultado = await atualizarQuestaoAdminAction(questaoId, montarPayload(item));
    setSalvando(false);
    if ("error" in resultado) {
      alert("Não foi possível salvar: " + resultado.error);
      return;
    }
    setSalvo(true);
  }

  async function excluir() {
    const trecho = item.enunciado.length > 80 ? `${item.enunciado.slice(0, 80)}...` : item.enunciado;
    if (!confirm(`Excluir permanentemente essa questão?\n\n"${trecho}"`)) return;
    setExcluindo(true);
    const resultado = await excluirQuestaoAdminAction(questaoId);
    setExcluindo(false);
    if ("error" in resultado) {
      alert(resultado.error);
      return;
    }
    router.push("/admin/questoes");
  }

  const topicosMateria = topicos.filter((t) => t.materia_id === item.materiaId);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/admin/questoes"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={2} /> Voltar
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-questly-purple/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-questly-purple">
          <ShieldCheck size={13} strokeWidth={2} /> Editando questão
        </span>
        <button
          type="button"
          disabled={excluindo}
          onClick={excluir}
          className="inline-flex items-center gap-1.5 rounded-lg border border-questly-red/30 bg-card px-3 py-1.5 text-[12.5px] font-medium text-questly-red-dark transition-colors hover:bg-questly-red-light disabled:pointer-events-none disabled:opacity-50"
        >
          <Trash2 size={14} strokeWidth={1.85} /> {excluindo ? "Excluindo..." : "Excluir"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">Editar</h3>
              <button type="button" onClick={formatarTudoClick} className={BTN_SECUNDARIO}>
                <Sparkles size={13} strokeWidth={1.75} /> Formatar tudo
              </button>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <select
                value={item.materiaId || ""}
                onChange={(e) => atualizar({ materiaId: e.target.value || null, topicoId: null })}
                className={`${INPUT} font-medium`}
              >
                <option value="">Matéria...</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
              <select
                value={item.topicoId || ""}
                disabled={!item.materiaId}
                onChange={(e) => atualizar({ topicoId: e.target.value || null })}
                className={`${INPUT} font-medium disabled:opacity-50`}
              >
                <option value="">{item.materiaId ? "Tópico..." : "Selecione a matéria antes"}</option>
                {topicosMateria.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <input
                value={item.subtopico || ""}
                onChange={(e) => atualizar({ subtopico: e.target.value.trim() || null })}
                placeholder="Subtópico (opcional, ex: Regra da cadeia)"
                className={`${INPUT} w-full`}
              />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <select
                value={item.dificuldade}
                onChange={(e) => atualizar({ dificuldade: e.target.value, dificuldadeInvalida: false })}
                className={`${INPUT} font-medium`}
              >
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
              <input
                value={item.instituicao || ""}
                onChange={(e) => atualizar({ instituicao: e.target.value.trim() || null })}
                placeholder="Instituição"
                className={INPUT}
              />
              <input
                type="number"
                value={item.ano ?? ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  atualizar({ ano: Number.isNaN(v) ? null : v });
                }}
                placeholder="Ano"
                className={`${INPUT} tnum`}
              />
            </div>

            <div className="mb-1.5 flex items-center justify-between">
              <span className="kicker">Enunciado</span>
              <button
                type="button"
                onClick={() => atualizar({ enunciado: limparFormatacao(item.enunciado) })}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-questly-green-dark transition-opacity hover:opacity-80"
              >
                <Sparkles size={11} strokeWidth={2} /> formatar
              </button>
            </div>
            <textarea
              value={item.enunciado}
              onChange={(e) => atualizar({ enunciado: e.target.value })}
              rows={4}
              className={`${INPUT} mb-4 w-full`}
            />

            <div className="mb-1.5">
              <span className="kicker">Imagem do enunciado</span>
            </div>
            <div className="mb-4">
              <ImgPicker
                currentUrl={item.imagemUrl}
                pastaPrefixo="enunciado"
                onChange={(url) => atualizar({ imagemUrl: url })}
              />
            </div>

            <div className="kicker mb-2">Alternativas (marque a correta)</div>
            <div className="mb-4 flex flex-col gap-2.5">
              {LETRAS_ALTERNATIVA.map((letra) => (
                <div
                  key={letra}
                  className={`rounded-xl border p-3 transition-colors ${
                    item.gabarito === letra ? "border-questly-green/60 bg-questly-green-light" : "border-border"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                      {letra.toUpperCase()}
                    </span>
                    <textarea
                      value={item.alternativas[letra] || ""}
                      onChange={(e) => atualizarAlternativaTexto(letra, e.target.value)}
                      rows={1}
                      placeholder={`Texto da alternativa ${letra.toUpperCase()} (opcional se tiver imagem)`}
                      className={`${INPUT} flex-1 resize-none`}
                    />
                    <button
                      type="button"
                      title="Limpar formatação"
                      onClick={() => atualizarAlternativaTexto(letra, limparFormatacao(item.alternativas[letra]))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Sparkles size={14} strokeWidth={1.75} />
                    </button>
                    <label className="flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <input
                        type="radio"
                        name="gabarito"
                        checked={item.gabarito === letra}
                        onChange={() => atualizar({ gabarito: letra })}
                        className="h-4 w-4 accent-questly-green"
                      />
                      correta
                    </label>
                  </div>
                  <ImgPicker
                    currentUrl={item.alternativasImagens[letra] || null}
                    pastaPrefixo={`alt-${letra}`}
                    onChange={(url) => atualizarAlternativaImagem(letra, url)}
                  />
                </div>
              ))}
            </div>

            <div className="mb-1.5 flex items-center justify-between">
              <span className="kicker">Resolução (opcional)</span>
              <button
                type="button"
                onClick={() => atualizar({ resolucao: limparFormatacao(item.resolucao) })}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-questly-green-dark transition-opacity hover:opacity-80"
              >
                <Sparkles size={11} strokeWidth={2} /> formatar
              </button>
            </div>
            <textarea
              value={item.resolucao || ""}
              onChange={(e) => atualizar({ resolucao: e.target.value })}
              rows={3}
              className={`${INPUT} w-full`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <PreviewCard item={item} motivos={[]} />
        </div>
      </div>

      <div className="sticky bottom-16 mt-5 flex items-center gap-3 border-t border-border bg-background/90 py-4 backdrop-blur lg:bottom-0">
        <button type="button" disabled={salvando} onClick={salvar} className={`${BTN_PRIMARIO} flex-1 sm:flex-none`}>
          <Save size={15} strokeWidth={2} /> {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
        {salvo && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-questly-green-dark">
            <Check size={15} strokeWidth={2.5} /> Salvo
          </span>
        )}
      </div>
    </div>
  );
}
