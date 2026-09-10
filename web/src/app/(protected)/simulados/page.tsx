import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  carregarDesempenhoGeral,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // O painel "como você está indo" usa a MESMA análise da página de
  // desempenho — é uma leitura só, exibida aqui em resumo e lá inteira.
  const [historico, desempenho, opcoes, status, instituicoesDisponiveis] = await Promise.all([
    carregarHistorico(supabase, user),
    carregarDesempenhoGeral(supabase, user),
    carregarOpcoesSimulado(supabase, user),
    carregarStatusPlano(supabase, user),
    listarInstituicoesComQuestoes(),
  ]);

  return (
    <SimuladosLista
      historico={historico}
      desempenho={desempenho}
      status={status}
      reconhecida={opcoes.reconhecida}
      nomeInstituicao={opcoes.nomeInstituicao}
      universidade={opcoes.universidade}
      totalQuestoes={opcoes.totalQuestoes}
      instituicoesDisponiveis={instituicoesDisponiveis}
    />
  );
}
