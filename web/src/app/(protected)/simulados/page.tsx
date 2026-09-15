import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import {
  carregarHistorico,
  carregarOpcoesSimulado,
  carregarStatusPlano,
} from "@/lib/simulados/simulados-data";
import { listarInstituicoesComQuestoes } from "@/lib/cursos/actions";
import { SimuladosLista } from "@/components/simulados/simulados-lista";

export const metadata: Metadata = {
  title: "Simulados",
};

export default async function SimuladosPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  // O hub mostra só o resumo (última/média/melhor), calculado do próprio
  // histórico — a análise pesada é a página /simulados/desempenho inteira.
  const [historico, opcoes, status, instituicoesDisponiveis] = await Promise.all([
    carregarHistorico(supabase, user),
    carregarOpcoesSimulado(supabase, user),
    carregarStatusPlano(supabase, user),
    listarInstituicoesComQuestoes(),
  ]);

  return (
    <SimuladosLista
      historico={historico}
      status={status}
      reconhecida={opcoes.reconhecida}
      nomeInstituicao={opcoes.nomeInstituicao}
      universidade={opcoes.universidade}
      instituicoesDisponiveis={instituicoesDisponiveis}
    />
  );
}
