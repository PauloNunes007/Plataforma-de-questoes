import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ADMIN_EMAIL } from "@/lib/admin/auth";
import { ehPro } from "@/lib/plano/plano";
import { carregarFocoHojeSeg } from "@/lib/foco/foco-data";
import { FocoProvider } from "@/components/foco/foco-provider";
import { FocoBar } from "@/components/foco/foco-bar";
import { NavPendenteProvider } from "@/components/nav-link";
import { TopNav } from "@/components/top-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { BotaoErroRapido } from "@/components/aprovacao/botao-erro-rapido";
import { ConviteAutoResgate } from "@/components/plano/convite-auto-resgate";
import { IndicacaoAuto } from "@/components/afiliados/indicacao-auto";
import { RegistrarServiceWorker } from "@/components/pwa/push-provider";

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

  // As três leituras são independentes — em série, o header do app esperava
  // round-trips a mais em todo carregamento completo de página. A de
  // `afiliados` é barata (índice único em `user_id`, RLS já restringe a "só a
  // própria linha") e é só o que decide se o item "Painel de parceiro"
  // aparece no menu — sem ela o painel (/parceiro) existe mas é inalcançável
  // de dentro do app pra quem não sabe a URL de cor.
  const [{ data: profile }, focoHojeSeg, { data: afiliado }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, username, curso, foto_url, plano, plano_expira_em")
      .eq("id", user.id)
      .maybeSingle(),
    carregarFocoHojeSeg(supabase, user.id),
    supabase.from("afiliados").select("id").eq("user_id", user.id).eq("ativo", true).maybeSingle(),
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
  const isParceiro = !!afiliado;

  return (
    <FocoProvider focoHojeSegInicial={focoHojeSeg} userId={user.id}>
      {/* Guarda o href que o aluno acabou de tocar pra que a aba acenda ANTES
          do payload chegar (ver components/nav-link.tsx). */}
      <NavPendenteProvider>
        {/* `print:block` + `print:min-h-0` não são cosméticos: o Chrome pagina
            MAL dentro de um container flex — a folha de impressão
            (components/imprimir) saía cortada numa página só ou com páginas em
            branco no meio. Em @media print o casco do app vira fluxo de bloco
            normal, que é o que o algoritmo de quebra de página sabe fatiar. */}
        <div className="flex min-h-screen flex-col print:block print:min-h-0">
          {/* Header horizontal + barra de Foco logo abaixo (redesign 2026-09). */}
          <TopNav
            nome={nome}
            username={profile?.username ?? null}
            curso={profile?.curso ?? null}
            fotoUrl={profile?.foto_url ?? null}
            isAdmin={isAdmin}
            ehPro={pro}
            isParceiro={isParceiro}
          />
          <FocoBar />

          {/* Registra o service worker (public/sw.js) — é ele que torna a
              Expectrum instalável e, no iOS 16.4+, o que permite Web Push.
              Não faz cache de NADA, de propósito: ver o cabeçalho do arquivo.
              A PERMISSÃO de notificação não é pedida aqui, e sim no fim da
              primeira lista, onde existe motivo pra dizer sim. */}
          <RegistrarServiceWorker />

          {/* pb-16 abre espaço pra MobileBottomNav (fixed) não tampar o fim da
              página em telas < lg. */}
          <main className="min-w-0 flex-1 pb-16 lg:pb-0 print:block print:pb-0">{children}</main>

          {/* Modo Aprovação (feature de conta única): registrar um erro de
              qualquer página do app — só a conta admin vê. */}
          {isAdmin && <BotaoErroRapido />}

          {/* Convite de testador (/convite/[codigo]) guardou um cupom no cookie:
              aqui é o primeiro ponto do fluxo em que o profile já existe e o Pro
              pode ser ligado sozinho. Sem cookie, não renderiza nada. */}
          <ConviteAutoResgate />

          {/* Link de parceiro (/p/[codigo]) guardou um código no cookie: mesmo
              momento do convite (o profile já existe), outro programa — aqui
              nasce a indicação que paga comissão. Sem cookie, não renderiza
              nada. */}
          <IndicacaoAuto />
          <MobileBottomNav />
        </div>
      </NavPendenteProvider>
    </FocoProvider>
  );
}
