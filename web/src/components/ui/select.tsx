"use client";

// Select do Expectrum — substitui o `<select>` nativo onde a lista aparece na
// frente do aluno.
//
// POR QUE NÃO O NATIVO: o `<select>` é o único controle da tela que o CSS do
// app não alcança. O campo fechado até dá pra estilizar, mas a LISTA aberta é
// desenhada pelo sistema operacional — no Windows ela vem como uma caixa
// branca quadrada, fonte do sistema, sem raio de borda, sem sombra e sem
// noção do tema escuro. No meio do painel do calendário (bordas arredondadas,
// tipografia de 13px, verde da marca) aquilo lê como um pedaço de outro
// programa.
//
// Este componente é o primitivo Select do Base UI — a mesma lib que já
// desenha Button/Input/Tabs aqui — com a pintura da casa por cima. Tudo que o
// nativo dava de graça continua valendo: teclado (setas, Home/End, digitar
// pra pular pro item, Esc pra fechar), leitor de tela (role="listbox"/"option"
// com o estado selecionado) e foco visível.
//
// `cor` é opcional e existe pro caso da DISCIPLINA: o app inteiro identifica
// uma disciplina por um ponto colorido determinístico (ver
// lib/questao/disciplina-cor.ts), e a lista de escolha é justamente onde esse
// código de cor precisa aparecer — senão o aluno escolhe às cegas e só
// descobre a cor depois de salvar.

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpcaoSelect = {
  value: string;
  label: string;
  /** Ponto colorido à esquerda (identidade da disciplina). */
  cor?: string;
  /** Segunda linha discreta no item da lista (contagem, dica, atalho). */
  detalhe?: string;
};

/**
 * `md` é o campo de formulário (altura de 38px, igual ao Input); `sm` é a
 * barra de filtros — a mesma pintura numa altura menor, pra uma fileira de
 * três filtros não empurrar o conteúdo pra fora da dobra. Só isto: não existe
 * um "select de filtro" com outra borda, outro raio ou outra lista.
 */
export type TamanhoSelect = "sm" | "md";

// As alturas são MÍNIMOS em pixel, não padding — é o que garante que um
// Select e um <input> lado a lado numa mesma linha do formulário terminem no
// mesmo pixel, mesmo com corpos de texto diferentes (o padding sozinho não
// garante: a altura final depende da entrelinha herdada).
const ALTURA: Record<TamanhoSelect, string> = {
  sm: "min-h-[34px] rounded-lg px-2.5 py-1.5 text-[12.5px]",
  md: "min-h-[38px] rounded-xl px-3 py-2 text-[13px]",
};

export function Select({
  value,
  onValueChange,
  opcoes,
  placeholder = "Selecione",
  "aria-label": ariaLabel,
  disabled,
  tamanho = "md",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  opcoes: OpcaoSelect[];
  placeholder?: string;
  "aria-label"?: string;
  disabled?: boolean;
  tamanho?: TamanhoSelect;
  className?: string;
}) {
  const selecionada = opcoes.find((o) => o.value === value);
  // Ponto colorido só aparece quando ALGUMA opção tem cor. Sem isto, uma
  // lista sem disciplina (dificuldade, banca, fase) ganhava uma coluna de
  // círculos vazios só pra alinhar o texto.
  const temCor = opcoes.some((o) => o.cor);

  return (
    <SelectPrimitive.Root
      value={value}
      // O Base UI manda `null` quando a seleção é limpa; o estado do chamador
      // é string ("" = "sem disciplina"), então normaliza aqui em vez de
      // espalhar `?? ""` por cada tela.
      onValueChange={(v) => onValueChange((v as string | null) ?? "")}
      disabled={disabled}
      items={opcoes}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "group/select flex w-full cursor-pointer items-center gap-2 border border-input bg-background text-left font-medium text-foreground transition-colors outline-none",
          ALTURA[tamanho],
          "hover:border-questly-green/45",
          "focus-visible:border-questly-green focus-visible:ring-[3px] focus-visible:ring-questly-green/25",
          // data-popup-open (e não :focus): depois do clique o foco vai pra
          // lista, e sem isto o campo aberto voltava a parecer fechado.
          "data-popup-open:border-questly-green data-popup-open:ring-[3px] data-popup-open:ring-questly-green/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        {selecionada?.cor && (
          <i
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: selecionada.cor }}
          />
        )}
        <SelectPrimitive.Value className="min-w-0 flex-1 truncate">
          {selecionada ? selecionada.label : <span className="text-muted-foreground">{placeholder}</span>}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground transition-transform duration-200 group-data-popup-open/select:rotate-180">
          <ChevronDown size={15} strokeWidth={2.4} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          sideOffset={6}
          // z-[60]: no celular o painel do dia vive dentro de um bottom sheet
          // em z-50 — com o padrão, a lista abriria ATRÁS do próprio painel.
          className="z-[60] w-[var(--anchor-width)] outline-none"
          // Sem isto o Base UI ancora o ITEM SELECIONADO no gatilho (estilo
          // macOS), e a lista cobre o campo que o aluno acabou de tocar.
          alignItemWithTrigger={false}
        >
          <SelectPrimitive.Popup
            className={cn(
              "max-h-[min(18rem,var(--available-height))] origin-[var(--transform-origin)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg",
              "transition-[opacity,transform] duration-150 ease-out",
              "data-starting-style:scale-[0.97] data-starting-style:opacity-0",
              "data-ending-style:scale-[0.97] data-ending-style:opacity-0",
            )}
          >
            <SelectPrimitive.List>
              {opcoes.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={o.value}
                  className={cn(
                    "flex cursor-pointer select-none items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none",
                    "data-highlighted:bg-muted",
                    "data-selected:text-questly-green-dark dark:data-selected:text-questly-green",
                  )}
                >
                  {temCor &&
                    (o.cor ? (
                      <i
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: o.cor }}
                      />
                    ) : (
                      <i aria-hidden className="h-2 w-2 shrink-0 rounded-full border border-border" />
                    ))}
                  <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
                    {o.label}
                    {o.detalhe && (
                      <span className="ml-1.5 text-[11.5px] font-normal text-muted-foreground">
                        {o.detalhe}
                      </span>
                    )}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="shrink-0 text-questly-green">
                    <Check size={14} strokeWidth={3} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
