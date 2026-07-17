import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { ModeloMl, type ModeloRow } from "@/components/admin/modelo-ml";

export const metadata: Metadata = {
  title: "Questly — Modelo",
};

// O treino roda dentro de uma Server Action desta rota (dataset completo
// + Adam) — folga acima dos 15s default do Vercel.
export const maxDuration = 60;

export default async function AdminMlPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const { data, error } = await supabase
    .from("ml_modelos")
    .select("id, criado_em, num_exemplos, venceu_baseline, ativo, motivo, metricas")
    .order("criado_em", { ascending: false })
    .limit(12);

  // Tabela ainda não criada (migração pendente) — a página explica em vez de quebrar.
  const migracaoPendente = Boolean(error);

  return <ModeloMl modelos={(data as ModeloRow[]) ?? []} migracaoPendente={migracaoPendente} />;
}
