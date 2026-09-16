import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarMapaTrilha, semProva } from "@/lib/trilha/trilha-data";
import { questlyModoEstudo } from "@/lib/questly/modo-estudo";
import { TrilhaView } from "@/components/trilha/trilha-view";

export const metadata: Metadata = {
  title: "Minha trilha",
};

export default async function TrilhaPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  if (!user) return null;

  const [regioesBrutas, { data: profile }] = await Promise.all([
    carregarMapaTrilha(supabase, user),
    supabase.from("profiles").select("modo_estudo").eq("id", user.id).maybeSingle(),
  ]);

  // A trilha existe nos DOIS modos — ela é o mapa da ementa, não um plano por
  // data de prova. No modo livre só o que fala de prova sai de cena.
  const guiado = questlyModoEstudo(profile) === "guiado";
  const regioes = guiado ? regioesBrutas : regioesBrutas.map(semProva);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header>
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">Minha trilha</h1>
        <p className="mt-0.5 max-w-[640px] text-sm leading-relaxed text-muted-foreground">
          {guiado
            ? "Toque numa disciplina pra abrir a jornada dela até a prova. Cada parada é um tópico da ementa — toque numa parada pra ver detalhes, praticar ou marcar o que você já sabe."
            : "Toque numa disciplina pra abrir a ementa dela. Cada parada é um tópico — toque numa parada pra ver detalhes, praticar ou marcar o que você já sabe."}
        </p>
      </header>

      <TrilhaView regioes={regioes} guiado={guiado} />
    </div>
  );
}
