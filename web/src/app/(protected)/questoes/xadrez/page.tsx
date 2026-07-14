import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarDisciplinasPratica } from "@/lib/disciplinas/disciplinas-data";
import { contarPartidasHoje } from "@/lib/xadrez/xadrez-data";
import { ehPro } from "@/lib/plano/plano";
import { ArenaXadrez } from "@/components/xadrez/arena-xadrez";

// Arena de Xadrez — fetch inicial no servidor (disciplinas do aluno, plano,
// partidas de hoje pro gate freemium); o jogo em si é todo client
// (components/xadrez/arena-xadrez.tsx). ?debugFen= só existe fora de
// produção, pra forçar posições de teste (mate em 1 etc.).
export default async function XadrezPage({
  searchParams,
}: {
  searchParams: Promise<{ debugFen?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, disciplinas, partidasHoje] = await Promise.all([
    supabase.from("profiles").select("plano, plano_expira_em").eq("id", user.id).maybeSingle(),
    carregarDisciplinasPratica(supabase, user),
    contarPartidasHoje(supabase, user.id),
  ]);

  const { debugFen } = await searchParams;

  return (
    <ArenaXadrez
      disciplinas={disciplinas}
      ehProAluno={ehPro(profile)}
      partidasHojeIniciais={partidasHoje}
      debugFen={process.env.NODE_ENV !== "production" ? (debugFen ?? null) : null}
    />
  );
}
