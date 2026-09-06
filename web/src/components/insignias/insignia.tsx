// Sistema de insígnias da Questly — os "brasões" da plataforma.
//
// Por que existe: até 2026-09 a UI usava emoji cru (🔥 🎯 💎 🏆 …) pra
// conquistas, ligas, nível e comemorações. Emoji é fonte do sistema
// operacional: muda de desenho entre Windows/Android/iOS, não acompanha a
// paleta, não escala com nitidez e não pertence a marca nenhuma. Aqui cada
// símbolo é um SVG vetorial nosso, num mesmo idioma visual (medalha hexagonal
// + campo escuro + motivo gravado no metal), coerente com o escudo alado das
// ligas em components/ranking/liga-emblema.tsx.
//
// Como usar:
//   <Insignia nome="chama" tom="bronze" size={32} titulo="Chama viva" />
//   <Insignia nome="alvo" tom="esmeralda" nua />   // só o motivo, sem moldura
//
// A moldura vira ruído abaixo de ~30px (o motivo fica minúsculo dentro dela):
// abaixo disso use `nua`, que desenha só o motivo, ocupando a caixa inteira.
//
// Os ids de gradiente são DETERMINÍSTICOS por tom (`qi-aro-ouro`), não gerados
// por `useId`: gradiente só depende do tom, então duas insígnias do mesmo metal
// compartilham a mesma definição de propósito — e, sem hook, o componente roda
// igual em Server e Client Component. (Com `useId` havia um bug real: cada
// `renderToStaticMarkup`/raiz React reinicia o contador, os ids colidiam entre
// raízes e TODO brasão herdava o metal do primeiro que a página desenhou.)

export type TomInsignia =
  | "bronze"
  | "prata"
  | "ouro"
  | "platina"
  | "diamante"
  | "esmeralda"
  | "rubi";

type Tons = { claro: string; medio: string; escuro: string; brilho: string; campo: string };

// Metais e pedras. bronze→diamante espelham as cores de liga-visual.ts pra
// que uma insígnia de liga e o escudo da liga nunca discordem; esmeralda é o
// verde da marca (conquistas "da casa") e rubi o calor (streak/foco).
const TONS: Record<TomInsignia, Tons> = {
  bronze: { claro: "#e0a973", medio: "#a86a34", escuro: "#4a2911", brilho: "#f6cfa1", campo: "#2a1608" },
  prata: { claro: "#eef2f6", medio: "#aab6c2", escuro: "#5a6672", brilho: "#ffffff", campo: "#232c35" },
  ouro: { claro: "#f8da85", medio: "#d4a017", escuro: "#7a5a0e", brilho: "#fff3c6", campo: "#33260a" },
  platina: { claro: "#aae8f3", medio: "#46b6cc", escuro: "#176278", brilho: "#dcf7fd", campo: "#0a2f3b" },
  diamante: { claro: "#dccbff", medio: "#a78bfa", escuro: "#5b1fbd", brilho: "#f1e9ff", campo: "#241046" },
  esmeralda: { claro: "#8ef0c6", medio: "#12b981", escuro: "#0a6547", brilho: "#d5fbec", campo: "#062d21" },
  rubi: { claro: "#ffc09a", medio: "#f97316", escuro: "#9a3a06", brilho: "#ffe4cf", campo: "#3a1405" },
};

export type NomeInsignia =
  | "chama"
  | "chama-dupla"
  | "chama-coroada"
  | "alvo"
  | "ascensao"
  | "cume"
  | "estrela"
  | "estrela-dupla"
  | "cometa"
  | "constelacao"
  | "coroa"
  | "gema"
  | "broto"
  | "raio"
  | "trofeu"
  | "cronometro"
  | "pergaminho"
  | "envelope";

/* ------------------------------------------------------------------ *
 * Motivos                                                             *
 * Todos desenhados em torno da ORIGEM (0,0), caixa útil ±13, pra que a *
 * composição (escala, espelho, repetição) seja só transform.           *
 * ------------------------------------------------------------------ */

function Chama({ c }: { c: Tons }) {
  return (
    <>
      <path
        d="M0 -11.5c5.2 5.6 8.4 9.2 8.4 14.2 0 5-3.8 8.8-8.4 8.8s-8.4-3.8-8.4-8.8c0-3.4 1.6-5.6 3.4-7.8.5 2.3 1.6 3.7 2.9 4.5-.6-4.2.3-7.9 2.1-10.9Z"
        fill={c.claro}
        stroke={c.escuro}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M0 -0.4c2.4 2.6 3.8 4.3 3.8 6.4 0 2.2-1.7 3.8-3.8 3.8s-3.8-1.6-3.8-3.8c0-2.1 1.4-3.8 3.8-6.4Z"
        fill={c.brilho}
        opacity="0.9"
      />
    </>
  );
}

function Estrela({ c, brilhoInterno = true }: { c: Tons; brilhoInterno?: boolean }) {
  return (
    <>
      <path
        d="M0 -11.5 L2.7 -3.72 L10.94 -3.55 L4.37 1.42 L6.76 9.3 L0 4.6 L-6.76 9.3 L-4.37 1.42 L-10.94 -3.55 L-2.7 -3.72 Z"
        fill={c.claro}
        stroke={c.escuro}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {brilhoInterno && <path d="M0 -11.5 L2.7 -3.72 L0 -1 Z" fill={c.brilho} opacity="0.95" />}
    </>
  );
}

function MotivoPor({ nome, c }: { nome: NomeInsignia; c: Tons }) {
  const traco = { fill: "none", stroke: c.claro, strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (nome) {
    case "chama":
      return <Chama c={c} />;

    /* Streak de uma semana: duas chamas, a da frente maior. */
    case "chama-dupla":
      return (
        <>
          {[1, -1].map((lado) => (
            <g key={lado} transform={`translate(${lado * 8} 4.4) scale(0.5)`}>
              <path
                d="M0 -11.5c5.2 5.6 8.4 9.2 8.4 14.2 0 5-3.8 8.8-8.4 8.8s-8.4-3.8-8.4-8.8c0-3.4 1.6-5.6 3.4-7.8.5 2.3 1.6 3.7 2.9 4.5-.6-4.2.3-7.9 2.1-10.9Z"
                fill={c.medio}
                stroke={c.escuro}
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
            </g>
          ))}
          <g transform="translate(0 -2) scale(0.88)">
            <Chama c={c} />
          </g>
        </>
      );

    /* Streak lendário: a chama coroada — o topo da família de streak
       (chama → três chamas → chama coroada), em vez de um motivo novo que
       não conversava com os outros dois. */
    case "chama-coroada":
      return (
        <>
          <g transform="translate(0 3.6) scale(0.84)">
            <Chama c={c} />
          </g>
          <g transform="translate(0 -10.2) scale(0.58)">
            <path
              d="M-12 8.4 L-12 -6.6 L-5.4 0.4 L0 -8.8 L5.4 0.4 L12 -6.6 L12 8.4 Z"
              fill={c.brilho}
              stroke={c.escuro}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        </>
      );

    /* Primeiras questões: mira acertada. */
    case "alvo":
      return (
        <>
          <circle cx="0" cy="0" r="10.6" {...traco} />
          <circle cx="0" cy="0" r="5.6" {...traco} strokeWidth="2.2" />
          <circle cx="0" cy="0" r="2.3" fill={c.brilho} />
          <path d="M13.2 -13.2 L3.2 -3.2" {...traco} stroke={c.brilho} />
          <path d="M13.2 -13.2 L7.6 -12.4 M13.2 -13.2 L12.4 -7.6" {...traco} strokeWidth="2.1" stroke={c.brilho} />
        </>
      );

    /* Volume que vira curva: o maratonista. */
    case "ascensao":
      return (
        <>
          <rect x="-12.4" y="1.4" width="6.4" height="10.2" rx="1.8" fill={c.medio} stroke={c.escuro} strokeWidth="1.1" />
          <rect x="-3.2" y="-3.4" width="6.4" height="15" rx="1.8" fill={c.claro} stroke={c.escuro} strokeWidth="1.1" />
          <rect x="6" y="-8.2" width="6.4" height="19.8" rx="1.8" fill={c.brilho} stroke={c.escuro} strokeWidth="1.1" />
          <path d="M-11 -6.6 L-2.4 -11.4 L6.2 -13.4" {...traco} strokeWidth="2.3" stroke={c.brilho} />
          <path d="M6.2 -13.4 L1.4 -13.8 M6.2 -13.4 L4.6 -9.2" {...traco} strokeWidth="2" stroke={c.brilho} />
        </>
      );

    /* Veterano: o cume com a bandeira fincada. */
    case "cume":
      return (
        <>
          <path
            d="M-13.6 11 L-4.6 -5.6 L1 3.4 L5 -3.4 L13.6 11 Z"
            fill={c.medio}
            stroke={c.escuro}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M-4.6 -5.6 L-8.6 1.6 L-6.2 0.2 L-4.2 1.6 L-2 0.2 L-1.1 1.4 Z" fill={c.brilho} opacity="0.95" />
          <path d="M-4.6 -5.6 L-4.6 -13.6" {...traco} strokeWidth="2.1" stroke={c.brilho} />
          <path d="M-4.6 -13.6 L3.2 -11.6 L-4.6 -9.6 Z" fill={c.claro} stroke={c.escuro} strokeWidth="1" strokeLinejoin="round" />
        </>
      );

    case "estrela":
      return <Estrela c={c} />;

    /* Nível alto: a estrela ganha companhia. */
    case "estrela-dupla":
      return (
        <>
          <g transform="translate(7.6 -7.8) scale(0.46)">
            <Estrela c={c} brilhoInterno={false} />
          </g>
          <g transform="translate(-2.4 2.2) scale(0.82)">
            <Estrela c={c} />
          </g>
        </>
      );

    /* Nível lendário: estrela em queda, com rastro. */
    case "cometa":
      return (
        <>
          <path d="M-13 11.5 C-8 7.5 -5 4.5 -2 1.5" {...traco} stroke={c.medio} strokeWidth="3" opacity="0.55" />
          <path d="M-11.5 4.5 C-8 2 -6 0.5 -4 -1" {...traco} stroke={c.medio} strokeWidth="2.2" opacity="0.4" />
          <path d="M-5.5 11 C-3 8.5 -1.5 7 0 5.5" {...traco} stroke={c.medio} strokeWidth="2.2" opacity="0.4" />
          <g transform="translate(3.4 -3.4) scale(0.74)">
            <Estrela c={c} />
          </g>
        </>
      );

    /* Multidisciplinar: disciplinas ligadas num mesmo mapa. */
    case "constelacao":
      return (
        <>
          <path d="M0 -0.8 L0 -9.4 M0 -0.8 L-9 6.2 M0 -0.8 L9 6.2" {...traco} strokeWidth="2" stroke={c.medio} />
          <circle cx="0" cy="-9.4" r="3.6" fill={c.brilho} stroke={c.escuro} strokeWidth="1.1" />
          <circle cx="-9" cy="6.2" r="3.6" fill={c.claro} stroke={c.escuro} strokeWidth="1.1" />
          <circle cx="9" cy="6.2" r="3.6" fill={c.claro} stroke={c.escuro} strokeWidth="1.1" />
          <circle cx="0" cy="-0.8" r="2.6" fill={c.medio} stroke={c.escuro} strokeWidth="1.1" />
        </>
      );

    /* Liga alta: coroa. */
    case "coroa":
      return (
        <>
          <path
            d="M-12 8.4 L-12 -6.6 L-5.4 0.4 L0 -8.8 L5.4 0.4 L12 -6.6 L12 8.4 Z"
            fill={c.claro}
            stroke={c.escuro}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M-12 4.6 L12 4.6" stroke={c.escuro} strokeWidth="1.4" opacity="0.5" />
          <circle cx="0" cy="-4.4" r="2.1" fill={c.brilho} />
          <circle cx="-8.4" cy="-3.2" r="1.6" fill={c.brilho} opacity="0.9" />
          <circle cx="8.4" cy="-3.2" r="1.6" fill={c.brilho} opacity="0.9" />
        </>
      );

    /* Diamante lapidado — a liga máxima. */
    case "gema":
      return (
        <>
          <path
            d="M-6.6 -9.6 L6.6 -9.6 L11.4 -2.6 L0 11.6 L-11.4 -2.6 Z"
            fill={c.medio}
            stroke={c.escuro}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M-6.6 -9.6 L-3.4 -2.6 L0 11.6 L-11.4 -2.6 Z" fill={c.claro} opacity="0.75" />
          <path d="M-3.4 -2.6 L3.4 -2.6 L0 11.6 Z" fill={c.brilho} opacity="0.55" />
          <path d="M-11.4 -2.6 L11.4 -2.6 M-6.6 -9.6 L-3.4 -2.6 M6.6 -9.6 L3.4 -2.6 M0 11.6 L-3.4 -2.6 M0 11.6 L3.4 -2.6" stroke={c.escuro} strokeWidth="1.1" fill="none" opacity="0.55" />
        </>
      );

    /* Começando agora. */
    case "broto":
      return (
        <>
          <path d="M0 12 L0 -1.5" {...traco} stroke={c.claro} />
          {[1, -1].map((lado) => (
            <path
              key={lado}
              transform={lado === -1 ? "scale(-1,1)" : undefined}
              d="M-0.6 1.6 C-7 1 -10.2 -2.6 -10.2 -7.8 C-4.4 -7.8 -1 -4.2 -0.6 1.6 Z"
              fill={c.claro}
              stroke={c.escuro}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          ))}
          <path d="M-0.6 1.6 C-4 -0.6 -6.4 -3.2 -8 -6" stroke={c.escuro} strokeWidth="1" fill="none" opacity="0.4" />
        </>
      );

    case "raio":
      return (
        <path
          d="M2.6 -12.4 L-8.4 1.6 L-0.6 1.6 L-3 12.4 L8.4 -2.2 L0.4 -2.2 Z"
          fill={c.claro}
          stroke={c.escuro}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      );

    case "trofeu":
      return (
        <>
          <path d="M-7.6 -8.4 C-12.8 -8.4 -12.8 -1 -7.2 -0.6 M7.6 -8.4 C12.8 -8.4 12.8 -1 7.2 -0.6" {...traco} strokeWidth="2.1" stroke={c.medio} />
          <path
            d="M-7.8 -11 L7.8 -11 L7.2 -2.6 C7.2 2 3.8 5.2 0 5.2 C-3.8 5.2 -7.2 2 -7.2 -2.6 Z"
            fill={c.claro}
            stroke={c.escuro}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M-3.4 -8.6 C-3.4 -3.6 -3 -1 -1 1.4" stroke={c.brilho} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M0 5.2 L0 8.4" {...traco} strokeWidth="2.4" stroke={c.medio} />
          <path d="M-6.4 12.2 L6.4 12.2 L5.2 8.4 L-5.2 8.4 Z" fill={c.medio} stroke={c.escuro} strokeWidth="1.2" strokeLinejoin="round" />
        </>
      );

    /* Sessão de foco. */
    case "cronometro":
      return (
        <>
          <circle cx="0" cy="1.4" r="10.4" {...traco} />
          <path d="M-3.4 -12.4 L3.4 -12.4 M0 -12.4 L0 -9" {...traco} strokeWidth="2.3" />
          <path d="M0 -4.6 L0 1.4 L5 4.4" {...traco} strokeWidth="2.3" stroke={c.brilho} />
        </>
      );

    /* Questão/prova — usado em vazios de conteúdo. */
    case "pergaminho":
      return (
        <>
          <path
            d="M-8.6 -12 L6 -12 L10.4 -7.4 L10.4 12 L-8.6 12 Z"
            fill={c.claro}
            stroke={c.escuro}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M6 -12 L6 -7.4 L10.4 -7.4" fill="none" stroke={c.escuro} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M-4.6 -3.6 L6 -3.6 M-4.6 1.4 L6 1.4 M-4.6 6.4 L1.6 6.4" stroke={c.escuro} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
        </>
      );

    /* Confirme seu email. */
    case "envelope":
      return (
        <>
          <rect x="-12" y="-8.4" width="24" height="17.4" rx="2.6" fill={c.claro} stroke={c.escuro} strokeWidth="1.4" />
          <path d="M-12 -6.6 L0 2.6 L12 -6.6" fill="none" stroke={c.escuro} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-12 9 L-2.6 0.6 M12 9 L2.6 0.6" fill="none" stroke={c.escuro} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
        </>
      );
  }
}

/* Hexágono de ponta pra cima, raio r, centrado na origem. */
function hexagono(r: number): string {
  const pontos = [-90, -30, 30, 90, 150, 210].map((g) => {
    const rad = (g * Math.PI) / 180;
    return `${(r * Math.cos(rad)).toFixed(2)} ${(r * Math.sin(rad)).toFixed(2)}`;
  });
  return `M${pontos.join(" L")} Z`;
}

export function Insignia({
  nome,
  tom = "esmeralda",
  size = 40,
  titulo,
  nua = false,
  apagada = false,
  className = "",
}: {
  nome: NomeInsignia;
  tom?: TomInsignia;
  size?: number;
  /** Vira o aria-label. Sem ele a insígnia é decorativa (aria-hidden). */
  titulo?: string;
  /** Só o motivo, sem a medalha — pra tamanhos pequenos e texto corrido. */
  nua?: boolean;
  /** Conquista ainda não obtida: dessatura e escurece, sem sumir. */
  apagada?: boolean;
  className?: string;
}) {
  const c = TONS[tom];
  const gAro = `qi-aro-${tom}`;
  const gCampo = `qi-campo-${tom}`;
  const gGloss = "qi-gloss";

  const acessivel = titulo ? { role: "img" as const, "aria-label": titulo } : { "aria-hidden": true };

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={apagada ? { filter: "grayscale(1)", opacity: 0.42 } : undefined}
      {...acessivel}
    >
      {titulo && <title>{titulo}</title>}
      <defs>
        <linearGradient id={gAro} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={c.brilho} />
          <stop offset="0.22" stopColor={c.claro} />
          <stop offset="0.55" stopColor={c.medio} />
          <stop offset="0.82" stopColor={c.medio} />
          <stop offset="1" stopColor={c.escuro} />
        </linearGradient>
        <linearGradient id={gCampo} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.escuro} />
          <stop offset="1" stopColor={c.campo} />
        </linearGradient>
        <linearGradient id={gGloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g transform="translate(32 32)">
        {!nua && (
          <>
            {/* aro metálico */}
            <path d={hexagono(30)} fill={`url(#${gAro})`} stroke={c.escuro} strokeWidth="1.6" strokeLinejoin="round" />
            {/* campo interno escuro, pro motivo ter contraste em qualquer tema */}
            <path d={hexagono(24.6)} fill={`url(#${gCampo})`} stroke={c.escuro} strokeWidth="1" strokeLinejoin="round" />
            {/* bisel claro entre aro e campo */}
            <path d={hexagono(26.2)} fill="none" stroke={c.brilho} strokeWidth="1.1" strokeLinejoin="round" opacity="0.45" />
            {/* brilho de topo no metal */}
            <path d="M0 -30 L26 -15 L26 -6 C14 -13 -14 -13 -26 -6 L-26 -15 Z" fill={`url(#${gGloss})`} opacity="0.55" />
          </>
        )}
        <g transform={nua ? "scale(2.15)" : "scale(0.84)"}>
          <MotivoPor nome={nome} c={c} />
        </g>
      </g>
    </svg>
  );
}
