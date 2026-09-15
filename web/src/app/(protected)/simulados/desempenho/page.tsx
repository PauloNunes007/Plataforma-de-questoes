import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarDesempenhoGeral, carregarStatusPlano } from "@/lib/simulados/simulados-data";
import { DesempenhoView } from "@/components/simulados/desempenho-view";

export const metadata: Metadata = {
  title: "Desempenho nos simulados",
};

export default async function DesempenhoSimuladosPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const [dados, status] = await Promise.all([
    carregarDesempenhoGeral(supabase, user),
    carregarStatusPlano(supabase, user),
  ]);

  return <DesempenhoView dados={dados} podeMontar={status.podeMontar} />;
}
