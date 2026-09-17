"use client";

import Link from "next/link";
import { ArrowRight, Clock, Layers, ListChecks, NotebookPen, Star, Timer } from "lucide-react";
import { HubTiltCard } from "@/components/questoes/hub-tilt-card";

// Hub sem fetch — cada sub-rota trata seu próprio empty-state (sem
// disciplina cadastrada, sem matéria vinculada). Duas portas de entrada
// pro mesmo pool de questões: montar sua própria prática (Banco) ou
// navegar disciplina → tópico como listas prontas (Listas). Cards com
// tilt 3D (mesma física da carta TCG do ranking) — pedido explícito do
// usuário de algo "dinâmico ao passar o mouse e legal no celular".
export default function QuestoesPage() {
  return (
    <div className="casca flex flex-col gap-6 py-6 lg:py-8">
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Questões</h1>
        <p className="mt-0.5 max-w-[620px] text-sm leading-relaxed text-muted-foreground">
          Duas formas de praticar: monte sua própria seleção ou escolha uma lista pronta por tópico.
        </p>
      </header>

      {/* Duas faixas a partir de xl: as portas de entrada (os dois pôsteres e
          o simulado) na coluna larga, e "Minha coleção" num trilho de 360px.
          Numa coluna só, com a casca larga, os pôsteres viravam painéis de
          quase 900px e a coleção continuava lá embaixo, fora da dobra. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <HubTiltCard
              href="/questoes/banco"
              Icone={Layers}
              corA="#f5b93d"
              corB="#e0862a"
              titulo="Banco de"
              tituloDestaque="Questões"
              descricao="Monte sua própria prática: disciplina, tópicos, dificuldade e quantidade, do seu jeito."
            />
            <HubTiltCard
              href="/questoes/listas"
              Icone={ListChecks}
              corA="#4f8ff5"
              corB="#2f5fd9"
              titulo="Listas de"
              tituloDestaque="Questões"
              descricao="Escolha uma disciplina e pratique tópico por tópico, com listas já prontas."
            />
          </div>

          {/* Simulados — prova cronometrada montada pelo aluno (a fonte das
              questões é escolha dele desde 2026-09-16, não mais o perfil) */}
          <Link
            href="/simulados"
            className="group surface relative flex items-center gap-4 overflow-hidden p-5 transition-all hover:border-questly-green/30 hover:shadow-md"
          >
            <Timer
              size={120}
              strokeWidth={1}
              className="pointer-events-none absolute -right-4 -top-4 text-questly-green/[0.06] transition-transform group-hover:scale-110"
              aria-hidden
            />
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-questly-green text-white shadow-sm dark:text-[#0c1512]">
              <Clock size={24} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold">Simulados</p>
                <span className="rounded-full bg-questly-green-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-questly-green-dark">
                  Cronometrado
                </span>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                Monte uma prova cronometrada com provas de universidade, questões autorais ou as duas — e veja
                seu resultado.
              </p>
            </div>
            <ArrowRight
              size={18}
              strokeWidth={2}
              className="relative shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          </Link>
        </div>

        <aside className="min-w-0">
          <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Minha coleção
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              {
                href: "/questoes/favoritos",
                icone: <Star size={17} strokeWidth={1.9} />,
                corBg: "bg-questly-gold-light text-questly-gold-dark",
                titulo: "Favoritas",
                desc: "Questões que você marcou pra revisar depois.",
              },
              {
                href: "/questoes/anotacoes",
                icone: <NotebookPen size={17} strokeWidth={1.9} />,
                corBg: "bg-questly-blue-light text-questly-blue-dark",
                titulo: "Minhas anotações",
                desc: "Questões em que você deixou uma anotação.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group surface flex items-center gap-3.5 p-4 transition-all hover:border-questly-green/30 hover:shadow-md"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.corBg}`}>
                  {item.icone}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{item.titulo}</p>
                  <p className="text-[12.5px] leading-snug text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight
                  size={17}
                  strokeWidth={2}
                  className="shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
