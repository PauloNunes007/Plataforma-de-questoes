import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarMesAgenda, isoDia, mesValido } from "@/lib/agenda/agenda-data";
import { CalendarioView } from "@/components/agenda/calendario-view";

export const metadata: Metadata = {
  title: "Calendário",
};

// Calendário mensal dedicado. O mês CORRENTE vem pronto do servidor (abrir a
// página não custa round-trip); só a navegação entre meses passa por
// carregarMesAgendaAction.
//
// Não chama carregarDadosDashboard: aquilo calcula liga, resumo do dia e
// tarefas do mês inteiro — nada disso muda por olhar o calendário.
export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string }>;
}) {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  const agora = new Date();
  const hoje = isoDia(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const { dia } = await searchParams;
  const diaInicial = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;

  // O mês aberto é o do dia pedido (card da home) ou o corrente. Um `?dia=`
  // fora da janela de navegação (±5 anos) cai no mês corrente em vez de abrir
  // uma tela vazia — o parâmetro é público e pode vir qualquer coisa.
  const pedido = diaInicial
    ? { ano: Number(diaInicial.slice(0, 4)), mes: Number(diaInicial.slice(5, 7)) - 1 }
    : null;
  const usarPedido = pedido !== null && mesValido(pedido.ano, pedido.mes);
  const ano = usarPedido ? pedido.ano : agora.getFullYear();
  const mesIdx = usarPedido ? pedido.mes : agora.getMonth();

  const [mes, subjectsRes] = await Promise.all([
    carregarMesAgenda(supabase, user, ano, mesIdx),
    // `materia_id` vem junto porque o painel do dia precisa listar os ASSUNTOS
    // da disciplina pra o aluno escolher o que entra no bloco de estudo.
    supabase.from("subjects").select("id, nome, materia_id").eq("user_id", user.id).order("nome"),
  ]);

  if (!mes) return null;

  return (
    <CalendarioView
      mesInicial={mes}
      subjects={((subjectsRes.data || []) as { id: string; nome: string; materia_id: string | null }[]).map(
        (s) => ({ id: s.id, nome: s.nome, materiaId: s.materia_id }),
      )}
      hoje={hoje}
      diaInicial={usarPedido ? diaInicial : null}
    />
  );
}
