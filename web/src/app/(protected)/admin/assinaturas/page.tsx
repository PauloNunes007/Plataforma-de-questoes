import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { listarAssinaturasAdminAction } from "@/lib/admin/actions";
import { AssinaturasLista } from "@/components/admin/assinaturas-lista";

export const metadata: Metadata = {
  title: "Questly — Assinaturas",
};

export default async function AdminAssinaturasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const resultado = await listarAssinaturasAdminAction(false);
  if ("error" in resultado) {
    return <p className="p-6 text-sm text-questly-red-dark">{resultado.error}</p>;
  }

  return <AssinaturasLista assinaturasIniciais={resultado.assinaturas} />;
}
