import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { ehPro } from "@/lib/plano/plano";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

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
    .select("nome, username, curso, foto_url, plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  const nome = profile?.nome || user.email?.split("@")[0] || "Aluno(a)";
  const isAdmin = user.email === ADMIN_EMAIL;
  const pro = ehPro(profile);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar
        nome={nome}
        username={profile?.username ?? null}
        curso={profile?.curso ?? null}
        fotoUrl={profile?.foto_url ?? null}
        isAdmin={isAdmin}
        ehPro={pro}
      />
      <MobileHeader
        nome={nome}
        username={profile?.username ?? null}
        curso={profile?.curso ?? null}
        fotoUrl={profile?.foto_url ?? null}
        isAdmin={isAdmin}
        ehPro={pro}
      />
      {/* pb-16 abre espaço pra MobileBottomNav (fixed, ~56px + safe-area)
          não tampar o fim da página em telas < lg. */}
      <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
