import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { listarCuponsAdminAction } from "@/lib/admin/actions";
import { CuponsLista } from "@/components/admin/cupons-lista";

export const metadata: Metadata = {
  title: "Cupons",
};

export default async function AdminCuponsPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const resultado = await listarCuponsAdminAction();
  if ("error" in resultado) {
    return <p className="p-6 text-sm text-questly-red-dark">{resultado.error}</p>;
  }

  return <CuponsLista cuponsIniciais={resultado.cupons} />;
}
