"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing, Check } from "lucide-react";
import { usePush, suportaPush } from "@/components/pwa/push-provider";

// O convite pra ligar o lembrete de ofensiva.
//
// QUANDO ele aparece é a decisão mais importante deste arquivo: no fim de uma
// lista, depois de o aluno ter acabado de estudar — nunca no primeiro segundo
// da sessão. Permissão de notificação negada no navegador NÃO se pede de novo,
// então só vale gastar o pedido no momento em que o aluno tem motivo pra
// dizer sim. É o mesmo raciocínio que colocou o aviso do Pro no fim da lista
// em vez de num banner da home.
//
// E só aparece com uma ofensiva JÁ EM ANDAMENTO (>= 2 dias): "não perca sua
// sequência" só é um argumento pra quem tem uma sequência. Pra quem está no
// primeiro dia, é uma permissão pedida em troca de nada.
//
// Uma vez dispensado, não volta neste navegador (localStorage). Insistir num
// pedido de permissão é como o produto ensina o aluno a bloquear.

const CHAVE_DISPENSADO = "expectrum_convite_lembrete_v1";
const STREAK_MINIMO = 2;

// A dispensa é uma loja externa minúscula lida por `useSyncExternalStore`, e
// não `useState` + `useEffect`: ler `localStorage` no render inicial faria
// servidor e cliente discordarem do HTML, e escrever estado dentro de um
// efeito esbarra na regra `react-hooks/set-state-in-effect` do React 19.
// Mesmo padrão (e mesmo motivo) da preferência de recolhimento em
// components/dashboard/perfil-bar.tsx. O retrato do servidor é "dispensado",
// pra o convite nunca PISCAR na tela de quem já disse não.
const ouvintes = new Set<() => void>();
let cacheDispensado: boolean | null = null;

function assinarDispensa(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
  };
}

function lerDispensa() {
  if (cacheDispensado === null) {
    try {
      cacheDispensado = localStorage.getItem(CHAVE_DISPENSADO) === "1";
    } catch {
      // Janela anônima ou storage bloqueado: mostra o convite. O pior caso é
      // o aluno dispensar de novo.
      cacheDispensado = false;
    }
  }
  return cacheDispensado;
}

function lerDispensaNoServidor() {
  return true;
}

function gravarDispensa() {
  cacheDispensado = true;
  try {
    localStorage.setItem(CHAVE_DISPENSADO, "1");
  } catch {
    /* sem storage o convite volta na próxima lista; não é motivo pra falhar */
  }
  ouvintes.forEach((aoMudar) => aoMudar());
}

export function ConviteLembrete({
  chavePublica,
  streakAtual,
}: {
  chavePublica: string | null;
  streakAtual: number;
}) {
  const { estado, ocupado, ativar } = usePush(chavePublica);
  const dispensado = useSyncExternalStore(
    assinarDispensa,
    lerDispensa,
    lerDispensaNoServidor,
  );
  const [acabouDeAtivar, setAcabouDeAtivar] = useState(false);

  async function ligar() {
    const ok = await ativar();
    if (ok) {
      setAcabouDeAtivar(true);
      gravarDispensa();
    } else {
      // Negou ou fechou o diálogo do navegador: não insiste.
      gravarDispensa();
    }
  }

  if (acabouDeAtivar) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-questly-green/30 bg-questly-green-light/60 p-3.5 text-left text-[13px] font-medium text-questly-green-dark dark:bg-questly-green/10">
        <Check size={15} strokeWidth={2.4} />
        Pronto — a gente te avisa se sua ofensiva estiver pra acabar.
      </div>
    );
  }

  if (dispensado || !suportaPush() || !chavePublica) return null;
  if (estado !== "inativo") return null;
  if (streakAtual < STREAK_MINIMO) return null;

  return (
    <div className="mb-4 rounded-xl border border-questly-orange/30 bg-questly-orange/5 p-4 text-left">
      <div className="mb-1.5 flex items-center gap-2 text-[14.5px] font-semibold text-questly-orange-dark">
        <BellRing size={16} strokeWidth={2} />
        Proteger sua ofensiva de {streakAtual} dias
      </div>
      <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">
        Um aviso no fim do dia, só quando você ainda não tiver estudado. Nada
        de propaganda — e dá pra desligar em Configurações quando quiser.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={ligar}
          disabled={ocupado}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-questly-orange-dark px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:text-[#1a0f02]"
        >
          {ocupado ? "Ativando..." : "Quero ser avisado"}
        </button>
        <button
          type="button"
          onClick={gravarDispensa}
          className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
