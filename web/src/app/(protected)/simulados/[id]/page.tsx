import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import {
  carregarHistorico,
  carregarRankingProva,
  carregarSimulado,
} from "@/lib/simulados/simulados-data";
import { lerCodigoProva, rotuloProva } from "@/lib/simulados/provas-oficiais";
import { SimuladoRunner } from "@/components/simulados/simulado-runner";
import { SimuladoResultado } from "@/components/simulados/simulado-resultado";

export const metadata: Metadata = {
  title: "Simulado",
};

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileQuestion size={20} strokeWidth={1.75} className="text-muted-foreground" />
      </span>
      <p className="text-sm leading-relaxed text-muted-foreground">{mensagem}</p>
      <Link
        href="/simulados"
        className="inline-flex items-center rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
      >
        Voltar aos simulados
      </Link>
    </div>
  );
}

export default async function SimuladoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const { id } = await params;
  // `?modo=cartao` é o que o montador manda quando o aluno escolheu imprimir a
  // prova. É só o estado INICIAL da tela — o seletor continua lá e trocar de
  // modo no meio não perde nada (ver SimuladoRunner).
  const { modo } = await searchParams;
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const simulado = await carregarSimulado(supabase, user, id);
  if (!simulado) return <EstadoVazio mensagem="Não encontramos esse simulado." />;
  if (simulado.perguntas.length === 0) {
    return <EstadoVazio mensagem="Esse simulado não tem questões disponíveis." />;
  }

  if (simulado.status === "concluido") {
    // Comparação com o próprio histórico: só os simulados concluídos ANTES
    // deste entram, senão a "média anterior" incluiria a nota que está sendo
    // comparada e o delta ficaria sempre amortecido.
    // Ranking só pra prova antiga oficial: é a única em que todos os alunos
    // responderam exatamente as mesmas questões. Ver ranking-prova.tsx.
    const partes = simulado.prova_codigo ? lerCodigoProva(simulado.prova_codigo) : null;
    const [historico, ranking] = await Promise.all([
      carregarHistorico(supabase, user),
      partes && simulado.prova_codigo
        ? carregarRankingProva(supabase, user, simulado.prova_codigo)
        : Promise.resolve(null),
    ]);
    const anteriores = historico
      .filter((s) => s.status === "concluido" && s.id !== simulado.id && s.criado_em < simulado.criado_em)
      .map((s) => Number(s.nota ?? 0));

    return (
      <SimuladoResultado
        simulado={simulado}
        ranking={ranking}
        rotuloProva={partes ? rotuloProva(partes) : null}
        contexto={{
          anteriores: anteriores.length,
          mediaAnterior:
            anteriores.length > 0
              ? Math.round((anteriores.reduce((a, b) => a + b, 0) / anteriores.length) * 10) / 10
              : null,
          melhorAnterior: anteriores.length > 0 ? Math.max(...anteriores) : null,
        }}
      />
    );
  }
  if (simulado.status === "abandonado") {
    return <EstadoVazio mensagem="Esse simulado foi abandonado. Monte um novo pra praticar." />;
  }
  return <SimuladoRunner simulado={simulado} modoInicial={modo === "cartao" ? "cartao" : "tela"} />;
}
