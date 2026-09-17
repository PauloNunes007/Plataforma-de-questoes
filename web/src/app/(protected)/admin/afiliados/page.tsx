import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import {
  listarAfiliadosAdminAction,
  listarRepassesAdminAction,
} from "@/lib/admin/actions-afiliados";
import { AfiliadosLista } from "@/components/admin/afiliados-lista";

export const metadata: Metadata = { title: "Parceiros" };

// Dinheiro a pagar muda a cada venda — nunca cachear.
export const dynamic = "force-dynamic";

export default async function AdminAfiliadosPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const [afiliados, repasses] = await Promise.all([
    listarAfiliadosAdminAction(),
    listarRepassesAdminAction(),
  ]);

  if ("error" in afiliados) {
    return <p className="p-6 text-sm text-questly-red-dark">{afiliados.error}</p>;
  }

  return (
    <AfiliadosLista
      afiliadosIniciais={afiliados.afiliados}
      repassesIniciais={"error" in repasses ? [] : repasses.repasses}
    />
  );
}
