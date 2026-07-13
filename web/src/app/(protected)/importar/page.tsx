import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { carregarDadosImportadorAction } from "@/lib/importar/actions";
import { Importador } from "@/components/importar/importador";

export const metadata: Metadata = {
  title: "Questly — Importar questões",
};

export default async function ImportarPage() {
  // O importador escreve conteúdo global (`questions`), agora restrito ao admin
  // no banco (supabase_seguranca_hardening.sql). Trava a rota junto pra um
  // não-admin nem chegar na tela (as Server Actions do importador também são
  // barradas pela RLS de qualquer forma).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const { materias, topicos, enunciadosExistentes } = await carregarDadosImportadorAction();

  return (
    <Importador materiasIniciais={materias} topicosIniciais={topicos} enunciadosIniciais={enunciadosExistentes} />
  );
}
