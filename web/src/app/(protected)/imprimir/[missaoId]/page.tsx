import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { ehPro } from "@/lib/plano/plano";
import type { Pergunta } from "@/lib/questao/types";
import { FolhaImpressao } from "@/components/imprimir/folha-impressao";
import { PortaPro } from "@/components/imprimir/porta-pro";

export const metadata: Metadata = {
  title: "Imprimir lista",
};

export const dynamic = "force-dynamic";

// Exportar a lista em PDF — recurso do Pro.
//
// Não existe biblioteca de PDF aqui, e é de propósito: a folha é uma página
// HTML com `@media print` caprichado, e o "PDF" é o próprio
// "Imprimir → Salvar como PDF" do navegador. Gerar PDF no servidor custaria um
// runtime de Chromium (ou uma lib que não sabe renderizar KaTeX), pra entregar
// um arquivo pior que o que o browser já produz — com fórmula matemática no
// meio, isso não é uma economia, é uma regressão.
//
// MARCA D'ÁGUA COM O E-MAIL DO ALUNO: pedido do dono e, no fundo, o que torna
// esta funcionalidade viável. Um PDF do banco de questões é um arquivo que
// circula — no grupo da turma, no Drive do cursinho, no Telegram. A marca não
// impede a cópia (nada impede), mas amarra cada cópia a uma conta: quem
// republica está publicando o próprio e-mail junto. É dissuasão por atribuição,
// o mesmo princípio dos PDFs de editora acadêmica.
export default async function ImprimirPage({
  params,
}: {
  params: Promise<{ missaoId: string }>;
}) {
  const { missaoId } = await params;
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("plano, plano_expira_em, nome")
    .eq("id", user.id)
    .maybeSingle();

  // Gate no SERVIDOR: sem isso, a página seria o caminho mais curto pra um
  // aluno grátis baixar o banco inteiro em PDF — pior que o teto diário que
  // acabamos de instalar, porque sai do app de vez.
  if (!ehPro(perfil)) return <PortaPro contexto="lista" />;

  const { data: missao } = await supabase
    .from("missions")
    .select("id, qtd_questoes, question_ids, topic_ids, subjects(nome)")
    .eq("id", missaoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!missao) {
    return (
      <div className="casca-leitura flex min-h-[70vh] items-center justify-center">
        <p className="text-[13.5px] text-muted-foreground">Essa lista não foi encontrada.</p>
      </div>
    );
  }

  const questionIds: string[] = missao.question_ids || [];
  const topicIds: string[] = missao.topic_ids || [];

  let questoes: Pergunta[] | null = null;
  if (questionIds.length > 0) {
    const { data } = await supabase.from("questions").select("*").in("id", questionIds);
    // A ORDEM da folha segue `question_ids`, não a ordem que o Postgres
    // devolveu: o aluno que está com a lista aberta no app espera a questão 7
    // do papel ser a 7 da tela.
    const porId = new Map((data || []).map((q) => [q.id, q as Pergunta]));
    questoes = questionIds.map((id) => porId.get(id)).filter(Boolean) as Pergunta[];
  } else if (topicIds.length > 0) {
    const { data } = await supabase.from("questions").select("*").in("topic_id", topicIds);
    questoes = (data as Pergunta[] | null) ?? null;
    if (questoes && missao.qtd_questoes) questoes = questoes.slice(0, missao.qtd_questoes);
  }

  if (!questoes || questoes.length === 0) {
    return (
      <div className="casca-leitura flex min-h-[70vh] items-center justify-center">
        <p className="text-[13.5px] text-muted-foreground">Essa lista não tem questões pra imprimir.</p>
      </div>
    );
  }

  const sub = missao.subjects as { nome: string } | { nome: string }[] | null;
  const disciplinaNome = (Array.isArray(sub) ? sub[0]?.nome : sub?.nome) ?? null;

  return (
    <FolhaImpressao
      titulo="Lista de exercícios"
      disciplina={disciplinaNome}
      questoes={questoes}
      // A marca d'água é o e-mail da SESSÃO, lido no servidor. Nunca um valor
      // vindo do cliente: o ponto inteiro é que o aluno não escolha o que sai
      // carimbado no arquivo que ele vai distribuir.
      emailAluno={user.email ?? "conta sem e-mail"}
      nomeAluno={perfil?.nome ?? null}
      voltarHref={`/questao?missao=${missao.id}`}
      voltarRotulo="Voltar pra lista"
    />
  );
}
