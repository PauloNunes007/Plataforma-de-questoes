import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { carregarDisciplinasPratica, carregarTopicosPratica } from "@/lib/disciplinas/disciplinas-data";
import { ListaTopicoCard } from "@/components/questoes/lista-topico-card";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Questly — Listas de Questões",
};

export default async function ListasDaDisciplinaPage({
  params,
}: {
  params: Promise<{ materiaId: string }>;
}) {
  const { materiaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const disciplinas = await carregarDisciplinasPratica(supabase, user);
  const disciplina = disciplinas.find((d) => d.materiaId === materiaId);

  if (!disciplina) {
    return (
      <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-4 px-4 py-6 sm:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground">Disciplina não encontrada.</p>
        <Link href="/questoes/listas" className="text-sm font-medium text-questly-green">
          Voltar pras disciplinas
        </Link>
      </div>
    );
  }

  const topicos = await carregarTopicosPratica(supabase, user, disciplina.materiaId);

  return (
    <div className="mx-auto flex w-full max-w-[1128px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        titulo={disciplina.nome}
        descricao="Cada tópico é uma lista pronta — toque em Começar pra praticar todas as questões dele."
        voltarHref="/questoes/listas"
        voltarLabel="Listas de Questões"
      />

      {!disciplina.matriculada && (
        <p className="surface px-4 py-3 text-sm text-muted-foreground">
          Você ainda não tem <b className="text-foreground">{disciplina.nome}</b> nas suas disciplinas — pode
          praticar à vontade mesmo assim. Se quiser acompanhar provas e progresso dela, adicione em{" "}
          <Link href="/configuracoes" className="font-medium text-questly-green">
            Configurações
          </Link>
          .
        </p>
      )}

      {topicos.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Essa disciplina ainda não tem questões cadastradas.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topicos.map((t, i) => (
            <ListaTopicoCard
              key={t.id}
              subjectId={disciplina.subjectId}
              disciplinaNome={disciplina.nome}
              topico={t}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
