import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { listarRelatosAdminAction } from "@/lib/admin/actions";
import { RelatosLista } from "@/components/admin/relatos-lista";

export const metadata: Metadata = {
  title: "Questly — Relatos",
};

export default async function AdminRelatosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const resultado = await listarRelatosAdminAction(true);
  if ("error" in resultado) {
    return <p className="p-6 text-sm text-questly-red-dark">{resultado.error}</p>;
  }

  return <RelatosLista relatosIniciais={resultado.relatos} />;
}
