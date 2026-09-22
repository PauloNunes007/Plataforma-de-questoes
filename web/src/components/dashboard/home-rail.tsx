"use client";

// Trilho lateral da home: troca a VISÃO da própria página (não navega).
//
// Por que um trilho e não abas: as três visões não são irmãs de mesmo peso —
// "Global" é onde o aluno passa 90% do tempo, e Desempenho/Conquistas são
// consultas ocasionais. Um trilho fixo à esquerda deixa Global sempre em
// primeiro plano e as outras a um clique, sem roubar a dobra do conteúdo.
//
// O botão "Carta" fica SEPARADO do grupo de visões, acima e com moldura
// própria: ele não troca de visão, abre a carta do aluno por cima da tela.
// Misturar os dois no mesmo grupo faria o estado "ativo" mentir.
//
// **Repasse de 2026-09-16 — no celular.** Antes o trilho virava uma fita
// rolável de três caixas de 68px mais o botão Carta, que somava ~70px de
// altura e ainda assim transbordava a largura em 375px (rolagem horizontal
// numa barra de três itens é o próprio sintoma de que ela não cabia). Agora é
// um **controle segmentado** de largura inteira e 40px: três segmentos iguais
// com ícone e rótulo na mesma linha, dentro de um trilho afundado — a forma
// que o resto do app já usa pra "escolha um destes" (ver `SegmentedControl` no
// painel do calendário), e que lê como controle, não como três botões soltos.
//
// O botão **Carta sai do trilho no celular**: a faixa de perfil logo acima já
// é um botão com "Ver minha carta" escrito, e repetir a mesma ação a 40px de
// distância só gastava a largura que os três segmentos precisam. No desktop,
// onde o trilho é uma coluna vertical com espaço de sobra, ele continua lá.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Globe2, IdCard, LineChart, Medal, NotebookPen } from "lucide-react";

export type VisaoHome = "global" | "desempenho" | "conquistas";

const VISOES: { id: VisaoHome; rotulo: string; icone: React.ReactNode }[] = [
  { id: "global", rotulo: "Global", icone: <Globe2 size={20} strokeWidth={1.9} /> },
  { id: "desempenho", rotulo: "Desempenho", icone: <LineChart size={20} strokeWidth={1.9} /> },
  { id: "conquistas", rotulo: "Conquistas", icone: <Medal size={20} strokeWidth={1.9} /> },
];

export function HomeRail({
  visao,
  onVisao,
  onAbrirCarta,
  cadernoAbertos,
  onPreCarregar,
}: {
  visao: VisaoHome;
  onVisao: (v: VisaoHome) => void;
  onAbrirCarta: () => void;
  /** questões esperando no Caderno de Erros — vira o badge do atalho */
  cadernoAbertos: number;
  /** Avisa que o aluno está PRESTES a abrir esta visão (mouse em cima, dedo
   *  encostado) — quem escuta aproveita pra buscar o dado antes do clique.
   *  Hoje só "desempenho" tem o que buscar; o resto já veio com a página. */
  onPreCarregar?: (v: VisaoHome) => void;
}) {
  const semMovimento = useReducedMotion();

  return (
    <nav
      aria-label="Visões da home"
      className="flex shrink-0 flex-col gap-2 lg:w-[92px]"
    >
      {/* Carta — ação, não visão. Some no celular (a faixa de perfil acima já
          abre a carta e diz isso por extenso). */}
      <button
        type="button"
        onClick={onAbrirCarta}
        className="surface-interativa hidden cursor-pointer items-center justify-center gap-1.5 rounded-2xl px-3 py-3 lg:flex lg:flex-col"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-questly-purple to-questly-blue text-white shadow-sm">
          <IdCard size={17} strokeWidth={2.1} />
        </span>
        <span className="text-[11.5px] font-bold tracking-tight">Carta</span>
      </button>

      {/* Caderno de Erros — NAVEGA (não troca a visão), então fica fora do
          grupo de visões pela mesma regra do "Carta" logo acima: dentro do
          tablist o estado "ativo" mentiria. Diferente do Carta, ele NÃO some
          no celular: o Carta tem um gêmeo na faixa de perfil, o Caderno não
          teria nenhum outro caminho aqui — e recurso que só existe no desktop
          é recurso que metade da base nunca encontra (o erro já cometido com
          a aba "Matérias", ver components/nav-items.ts). No celular ele vira
          uma linha de largura inteira ABAIXO do controle segmentado. */}
      <Link
        href="/questoes/caderno"
        className="surface-interativa relative order-last flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 lg:order-none lg:w-auto lg:flex-col lg:py-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-questly-blue to-questly-purple text-white shadow-sm">
          <NotebookPen size={17} strokeWidth={2.1} />
        </span>
        <span className="text-[11.5px] font-bold tracking-tight">Caderno</span>
        {cadernoAbertos > 0 && (
          <span className="tnum absolute right-2 top-2 rounded-full bg-questly-purple px-1.5 py-0.5 text-[10px] font-bold leading-none text-white lg:right-2.5 lg:top-2.5">
            {cadernoAbertos > 99 ? "99+" : cadernoAbertos}
          </span>
        )}
      </Link>

      <div
        role="tablist"
        /* sem `aria-orientation`: o grupo é horizontal no celular e vertical no
           desktop, e o atributo é estático — o padrão (horizontal) é o que vale
           na largura onde a navegação por seta realmente acontece */
        className="surface grid w-full grid-cols-3 gap-1 rounded-2xl p-1 lg:flex lg:w-auto lg:flex-col lg:p-1.5"
      >
        {VISOES.map((v) => {
          const ativo = v.id === visao;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => onVisao(v.id)}
              /* `pointerenter` cobre o mouse; `pointerdown` cobre o toque,
                 onde não existe hover — entre encostar e soltar o dedo há uns
                 bons décimos de segundo, e é neles que a busca cabe. */
              onPointerEnter={() => onPreCarregar?.(v.id)}
              onPointerDown={() => onPreCarregar?.(v.id)}
              onFocus={() => onPreCarregar?.(v.id)}
              className={`relative flex h-10 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-1 transition-colors lg:h-[68px] lg:flex-col lg:gap-1 ${
                ativo
                  ? "text-questly-green-dark dark:text-questly-green"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ativo && (
                <motion.span
                  layoutId={semMovimento ? undefined : "visao-home-ativa"}
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-questly-green-light ring-1 ring-questly-green/25"
                  transition={{ type: "spring", stiffness: 460, damping: 38 }}
                />
              )}
              <span className="relative flex shrink-0 items-center [&>svg]:h-[15px] [&>svg]:w-[15px] lg:[&>svg]:h-5 lg:[&>svg]:w-5">
                {v.icone}
              </span>
              <span className="relative truncate text-[11.5px] font-bold leading-tight tracking-tight lg:text-[10.5px]">
                {v.rotulo}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
