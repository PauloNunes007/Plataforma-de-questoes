"use client";

import { useCallback, useEffect, useState } from "react";
import {
  removerInscricaoPushAction,
  salvarInscricaoPushAction,
} from "@/lib/push/actions";

// Registro do service worker e inscrição de push, num lugar só.
//
// O SW é registrado em TODA carga do app logado (é o que torna a Expectrum
// instalável e, no iOS 16.4+, o que permite push). A PERMISSÃO, ao contrário,
// nunca é pedida aqui: quem pede é a tela que tem um motivo pra pedir — hoje,
// o fim da primeira lista. Um `Notification.requestPermission()` no primeiro
// segundo da sessão é o jeito mais rápido de receber um "Bloquear" definitivo,
// e permissão negada no navegador NÃO se pede de novo.

/** Converte a chave VAPID (base64url) pro formato que o navegador exige.
 *  `ArrayBuffer` explícito e não `Uint8Array` genérico: o tipo de
 *  `applicationServerKey` exige um buffer não-compartilhado. */
function chaveParaBytes(base64: string): ArrayBuffer {
  const preenchido = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const normal = preenchido.replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(normal);
  const buffer = new ArrayBuffer(bruto.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return buffer;
}

export function suportaPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Registra o service worker. Idempotente: o navegador reaproveita o registro
 * existente, então chamar em toda carga não custa nada.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      // Falha de registro não pode derrubar nada: o app inteiro funciona sem
      // SW, só não é instalável nem recebe push.
      console.error("Não foi possível registrar o service worker:", e);
    });
  }, []);
  return null;
}

export type EstadoPush = "indisponivel" | "negado" | "inativo" | "ativo";

/**
 * Estado da inscrição neste aparelho + as duas ações.
 *
 * O estado é do APARELHO, não da conta: o aluno pode ter o lembrete ligado no
 * celular e desligado no notebook, e é assim que tem que ser — o aparelho que
 * importa pro lembrete é o que fica no bolso.
 */
export function usePush(chavePublica: string | null) {
  const [estado, setEstado] = useState<EstadoPush>("indisponivel");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function conferir() {
      if (!suportaPush() || !chavePublica) return;
      if (Notification.permission === "denied") {
        if (ativo) setEstado("negado");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();
      if (ativo) setEstado(inscricao ? "ativo" : "inativo");
    }
    conferir().catch(() => {});
    return () => {
      ativo = false;
    };
  }, [chavePublica]);

  const ativar = useCallback(async () => {
    if (!suportaPush() || !chavePublica || ocupado) return false;
    setOcupado(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "negado" : "inativo");
        return false;
      }
      const registro = await navigator.serviceWorker.ready;
      const inscricao =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({
          // Exigido pelos navegadores: toda mensagem tem que ser visível pro
          // usuário. Push silencioso pra rastrear alguém não é possível aqui,
          // e isso é uma garantia, não uma limitação.
          userVisibleOnly: true,
          applicationServerKey: chaveParaBytes(chavePublica),
        }));

      const json = inscricao.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      const r = await salvarInscricaoPushAction({
        endpoint: json.endpoint || "",
        p256dh: json.keys?.p256dh || "",
        auth: json.keys?.auth || "",
      });
      if (!r.ok) {
        // Não deu pra guardar no servidor: desfaz a inscrição do navegador
        // pra não sobrar um aparelho "inscrito" que nunca receberá nada.
        await inscricao.unsubscribe().catch(() => {});
        setEstado("inativo");
        return false;
      }
      setEstado("ativo");
      return true;
    } finally {
      setOcupado(false);
    }
  }, [chavePublica, ocupado]);

  const desativar = useCallback(async () => {
    if (!suportaPush() || ocupado) return;
    setOcupado(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();
      if (inscricao) {
        await removerInscricaoPushAction(inscricao.endpoint);
        await inscricao.unsubscribe().catch(() => {});
      }
      setEstado("inativo");
    } finally {
      setOcupado(false);
    }
  }, [ocupado]);

  return { estado, ocupado, ativar, desativar };
}
