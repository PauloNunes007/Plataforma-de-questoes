import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  carregarHistorico,
  carregarOpcoesSimulado,
  carregarStatusPlano,
} from "@/lib/simulados/simulados-data";
import { SimuladosLista } from "@/components/simulados/simulados-lista";

export const metadata: Metadata = {
  title: "Questly — Simulados",
};

export default async function SimuladosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [historico, opcoes, status] = await Promise.all([
    carregarHistorico(supabase, user),
    carregarOpcoesSimulado(supabase, user),
    carregarStatusPlano(supabase, user),
  ]);

  return (
    <SimuladosLista
      historico={historico}
      status={status}
      reconhecida={opcoes.reconhecida}
      nomeInstituicao={opcoes.nomeInstituicao}
      universidade={opcoes.universidade}
      totalQuestoes={opcoes.totalQuestoes}
    />
  );
}
