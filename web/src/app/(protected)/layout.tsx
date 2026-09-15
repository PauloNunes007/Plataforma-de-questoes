import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { ehPro } from "@/lib/plano/plano";
import { carregarFocoHojeSeg } from "@/lib/foco/foco-data";
import { FocoProvider } from "@/components/foco/foco-provider";
import { FocoBar } from "@/components/foco/foco-bar";
import { TopNav } from "@/components/top-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { BotaoErroRapido } from "@/components/aprovacao/botao-erro-rapido";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  // Cinto e suspensório: o proxy.ts já redireciona quem não tem sessão,
  // isso aqui só cobre o Server Component sendo renderizado direto.
  if (!user) {
    redirect("/login");
  }

  // As duas leituras são independentes — em série, o header do app esperava
  // um round-trip a mais em todo carregamento completo de página.
  const [{ data: profile }, focoHojeSeg] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, username, curso, foto_url, plano, plano_expira_em")
      .eq("id", user.id)
      .maybeSingle(),
    carregarFocoHojeSeg(supabase, user.id),
  ]);

  // Onboarding obrigatório: sem curso salvo (inclui profile ainda inexistente),
  // nenhuma página da plataforma abre — a campanha precisa existir primeiro.
  // O inverso (já configurado → /dashboard) fica no guard de /onboarding.
  if (!profile?.curso) {
    redirect("/onboarding");
  }

  const nome = profile?.nome || user.email?.split("@")[0] || "Aluno(a)";
  const isAdmin = user.email === ADMIN_EMAIL;
  const pro = ehPro(profile);

  return (
    <FocoProvider focoHojeSegInicial={focoHojeSeg} userId={user.id}>
      <div className="flex min-h-screen flex-col">
        {/* Header horizontal + barra de Foco logo abaixo (redesign 2026-09). */}
        <TopNav
          nome={nome}
          username={profile?.username ?? null}
          curso={profile?.curso ?? null}
          fotoUrl={profile?.foto_url ?? null}
          isAdmin={isAdmin}
          ehPro={pro}
        />
        <FocoBar />

        {/* pb-16 abre espaço pra MobileBottomNav (fixed) não tampar o fim da
            página em telas < lg. */}
        <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>

        {/* Modo Aprovação (feature de conta única): registrar um erro de
            qualquer página do app — só a conta admin vê. */}
        {isAdmin && <BotaoErroRapido />}
        <MobileBottomNav />
      </div>
    </FocoProvider>
  );
}
