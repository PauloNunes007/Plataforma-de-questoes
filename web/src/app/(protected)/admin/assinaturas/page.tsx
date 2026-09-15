import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { diagnosticoPagamentoAction, listarAssinaturasAdminAction } from "@/lib/admin/actions";
import { AssinaturasLista } from "@/components/admin/assinaturas-lista";

export const metadata: Metadata = {
  title: "Assinaturas",
};

export default async function AdminAssinaturasPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const [resultado, diagnostico] = await Promise.all([
    listarAssinaturasAdminAction(false),
    diagnosticoPagamentoAction(),
  ]);
  if ("error" in resultado) {
    return <p className="p-6 text-sm text-questly-red-dark">{resultado.error}</p>;
  }

  return (
    <AssinaturasLista
      assinaturasIniciais={resultado.assinaturas}
      diagnostico={"error" in diagnostico ? null : diagnostico}
    />
  );
}
