"use client";

// Barra de comando da jornada + modo lista.
//
// O mapa serpenteante é ótimo pra "onde eu estou", mas numa ementa de 20+
// paradas ele fica com ~3000px de altura: achar UM tópico exigia rolar o
// mapa inteiro no olho. Esta barra resolve isso com três coisas funcionais:
// busca por nome (sem acento), filtros por estado (com contagem real) e um
// botão que leva direto pra parada onde o aluno parou. O modo lista é a
// mesma ementa em formato denso, pra quem quer varrer tudo de uma vez.
import { List, Map as MapIcon, Navigation, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import type { TopicoTrilha } from "@/lib/trilha/trilha-data";
import { COR_ESTADO, visual, type EstadoVisual } from "./no-jornada";

export type FiltroJornada = "tudo" | "fila" | "revisar" | "mestre" | "pulado";
export type ModoJornada = "mapa" | "lista";

const FILTROS: Array<{ id: FiltroJornada; rotulo: string }> = [
  { id: "tudo", rotulo: "Tudo" },
  { id: "fila", rotulo: "Na fila" },
  { id: "revisar", rotulo: "Revisar" },
  { id: "mestre", rotulo: "Mestres" },
  { id: "pulado", rotulo: "Puladas" },
];

const CLASSE_FILTRO: Record<FiltroJornada, string> = {
  tudo: "border-border bg-muted text-foreground",
  fila: "border-border bg-muted text-foreground",
  revisar: "border-questly-orange/40 bg-questly-orange-light text-questly-orange-dark",
  mestre: "border-questly-gold/40 bg-questly-gold-light text-questly-gold-dark",
  pulado: "border-border bg-muted text-foreground",
};

export function casaFiltro(t: TopicoTrilha, f: FiltroJornada): boolean {
  const est = visual(t);
  switch (f) {
    case "fila":
      return est === "pendente" || est === "fronteira";
    case "revisar":
      return t.memoriaCaindo;
    case "mestre":
      return est === "mestre";
    case "pulado":
      return est === "pulado";
    default:
      return true;
  }
}

// busca insensível a acento e caixa — "integrais" acha "Integrais Múltiplas"
const DIACRITICOS = /[̀-ͯ]/g;

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(DIACRITICOS, "");
}

export function casaBusca(t: TopicoTrilha, termo: string): boolean {
  const q = normalizar(termo.trim());
  if (!q) return true;
  return normalizar(t.nome).includes(q) || normalizar(t.descricao || "").includes(q);
}

export function contarPorFiltro(topicos: TopicoTrilha[]): Record<FiltroJornada, number> {
  return FILTROS.reduce(
    (acc, f) => {
      acc[f.id] = topicos.filter((t) => casaFiltro(t, f.id)).length;
      return acc;
    },
    {} as Record<FiltroJornada, number>,
  );
}

export function BarraJornada({
  topicos,
  filtro,
  onFiltro,
  busca,
  onBusca,
  modo,
  onModo,
  visiveis,
  temFronteira,
  onIrParaFronteira,
}: {
  topicos: TopicoTrilha[];
  filtro: FiltroJornada;
  onFiltro: (f: FiltroJornada) => void;
  busca: string;
  onBusca: (s: string) => void;
  modo: ModoJornada;
  onModo: (m: ModoJornada) => void;
  visiveis: number;
  temFronteira: boolean;
  onIrParaFronteira: () => void;
}) {
  const contagens = contarPorFiltro(topicos);
  const filtrando = filtro !== "tudo" || busca.trim() !== "";

  return (
    <div className="sticky top-2 z-30 flex flex-col gap-2.5 rounded-2xl border border-border bg-card/95 p-2.5 shadow-sm backdrop-blur-md sm:p-3">
      <div className="flex items-center gap-2">
        {/* busca */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            placeholder="Buscar parada na ementa..."
            aria-label="Buscar parada na ementa"
            className="h-9 w-full rounded-xl border border-input bg-background pl-8 pr-8 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-questly-green"
          />
          {busca !== "" && (
            <button
              type="button"
              onClick={() => onBusca("")}
              aria-label="Limpar busca"
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={13} strokeWidth={2.25} />
            </button>
          )}
        </div>

        {/* onde eu parei */}
        {temFronteira && (
          <button
            type="button"
            onClick={onIrParaFronteira}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-questly-orange px-2.5 text-[12px] font-semibold text-white transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#241703] sm:px-3"
            title="Ir até a parada onde você está"
          >
            <Navigation size={13} strokeWidth={2.25} />
            <span className="hidden sm:inline">Onde eu parei</span>
          </button>
        )}

        {/* mapa ↔ lista */}
        <div className="flex h-9 shrink-0 items-center rounded-xl border border-border bg-background p-0.5">
          <BotaoModo ativo={modo === "mapa"} onClick={() => onModo("mapa")} rotulo="Mapa">
            <MapIcon size={14} strokeWidth={2} />
          </BotaoModo>
          <BotaoModo ativo={modo === "lista"} onClick={() => onModo("lista")} rotulo="Lista">
            <List size={14} strokeWidth={2} />
          </BotaoModo>
        </div>
      </div>

      {/* filtros por estado — some o chip que não tem nenhuma parada */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTROS.filter((f) => f.id === "tudo" || contagens[f.id] > 0).map((f) => {
          const ativo = filtro === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onFiltro(f.id)}
              aria-pressed={ativo}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-all active:scale-[0.98] ${
                ativo
                  ? CLASSE_FILTRO[f.id] + " ring-2 ring-foreground/15"
                  : "border-border bg-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.rotulo}
              <span className="tnum opacity-70">{f.id === "tudo" ? topicos.length : contagens[f.id]}</span>
            </button>
          );
        })}

        {filtrando && (
          <span className="tnum ml-auto text-[11px] font-medium text-muted-foreground">
            {visiveis} de {topicos.length} paradas
          </span>
        )}
      </div>
    </div>
  );
}

function BotaoModo({
  ativo,
  onClick,
  rotulo,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      title={rotulo}
      aria-label={rotulo}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[10px] px-2.5 text-[12px] font-semibold transition-colors ${
        ativo ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      <span className="hidden lg:inline">{rotulo}</span>
    </button>
  );
}

// ── Modo lista ───────────────────────────────────────────────────────
// A mesma ementa, em linhas densas: dá pra varrer 25 tópicos numa tela só,
// coisa que o mapa (bonito, mas alto) não entrega. Clicar numa linha abre o
// mesmo PainelTopico (rail no desktop, bottom sheet no celular).

const ROTULO_ESTADO: Record<EstadoVisual, string> = {
  fronteira: "Você está aqui",
  mestre: "Mestre",
  dominado: "Dominado",
  coberto: "Estudado",
  pendente: "Na fila",
  vazio: "Sem questões",
  pulado: "Pulado",
};

export function ListaJornada({
  itens,
  selId,
  onSelect,
}: {
  itens: Array<{ topico: TopicoTrilha; numero: number }>;
  selId: string | null;
  onSelect: (id: string) => void;
}) {
  if (itens.length === 0) {
    return (
      <div className="surface p-8 text-center text-sm text-muted-foreground">
        Nenhuma parada bate com esse filtro.
      </div>
    );
  }

  return (
    <ul className="surface divide-y divide-border overflow-hidden">
      {itens.map(({ topico: t, numero }, i) => {
        const est = visual(t);
        const cor = COR_ESTADO[est];
        const selecionado = t.id === selId;
        return (
          <motion.li
            key={t.id}
            data-no={t.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.015, 0.3) }}
            className="scroll-mt-28"
          >
            <button
              type="button"
              onClick={() => onSelect(t.id)}
              aria-pressed={selecionado}
              className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors sm:px-4 ${
                selecionado ? "bg-muted/70" : "hover:bg-muted/40"
              }`}
            >
              <span
                className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11.5px] font-bold"
                style={{
                  background: `color-mix(in oklab, ${cor} 16%, transparent)`,
                  color: `color-mix(in oklab, ${cor} 88%, var(--foreground))`,
                }}
              >
                {numero}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium leading-tight">{t.nome}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span style={{ color: `color-mix(in oklab, ${cor} 85%, var(--muted-foreground))` }}>
                    {ROTULO_ESTADO[est]}
                  </span>
                  {t.precisao != null && <span className="tnum">{Math.round(t.precisao * 100)}% acerto</span>}
                  {t.questoesDisponiveis > 0 && (
                    <span className="tnum">{t.questoesDisponiveis} questões</span>
                  )}
                  {t.memoriaCaindo && (
                    <span className="font-semibold text-questly-orange-dark">memória caindo</span>
                  )}
                </span>
              </span>

              {/* barra de cobertura compacta */}
              <span className="hidden h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.round(t.cobertura * 100)}%`, background: cor }}
                />
              </span>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
