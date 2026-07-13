import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { carregarDadosImportadorAction } from "@/lib/importar/actions";
import { buscarQuestoesAdminAction, contarRelatosPendentesAction } from "@/lib/admin/actions";
import { QuestoesLista } from "@/components/admin/questoes-lista";

export const metadata: Metadata = {
  title: "Questly — Admin de questões",
};

export default async function AdminQuestoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const [{ materias, topicos }, resultado, pendentesRelatos] = await Promise.all([
    carregarDadosImportadorAction(),
    buscarQuestoesAdminAction({ busca: "", materiaId: null, topicoId: null, dificuldade: null, pagina: 0 }),
    contarRelatosPendentesAction(),
  ]);

  if ("error" in resultado) {
    return <p className="p-6 text-sm text-questly-red-dark">{resultado.error}</p>;
  }

  return (
    <QuestoesLista
      materias={materias}
      topicos={topicos}
      questoesIniciais={resultado.questoes}
      totalInicial={resultado.total}
      pendentesRelatos={pendentesRelatos}
    />
  );
}
