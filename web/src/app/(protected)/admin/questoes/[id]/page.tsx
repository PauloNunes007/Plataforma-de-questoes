import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { carregarDadosImportadorAction } from "@/lib/importar/actions";
import { carregarQuestaoAdminAction } from "@/lib/admin/actions";
import { QuestaoEditor } from "@/components/admin/questao-editor";

export const metadata: Metadata = {
  title: "Questly — Editar questão",
};

export default async function EditarQuestaoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const [{ materias, topicos }, resultado] = await Promise.all([
    carregarDadosImportadorAction(),
    carregarQuestaoAdminAction(id),
  ]);

  if ("error" in resultado) notFound();

  return <QuestaoEditor questaoId={id} itemInicial={resultado.item} materias={materias} topicos={topicos} />;
}
