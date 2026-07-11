import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cinto e suspensório: o proxy.ts já redireciona quem não tem sessão,
  // isso aqui só cobre o Server Component sendo renderizado direto.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, curso")
    .eq("id", user.id)
    .maybeSingle();

  const nome = profile?.nome || user.email?.split("@")[0] || "Aluno(a)";

  return (
    <div className="flex min-h-screen">
      <Sidebar nome={nome} curso={profile?.curso ?? null} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
