import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import { carregarMesAgenda, isoDia, mesValido } from "@/lib/agenda/agenda-data";
import { CalendarioView } from "@/components/agenda/calendario-view";
import { questlyModoEstudo } from "@/lib/questly/modo-estudo";

export const metadata: Metadata = {
  title: "Calendário",
};

// Calendário mensal dedicado. O mês CORRENTE vem pronto do servidor (abrir a
// página não custa round-trip); só a navegação entre meses passa por
// carregarMesAgendaAction.
//
// Não chama carregarDadosDashboard: aquilo gera missão do dia, projeta nota e
// calcula liga — nada disso muda por olhar o calendário, e rodar o
// mission-engine aqui teria efeito colateral.
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

  const [mesBruto, subjectsRes, { data: profile }] = await Promise.all([
    carregarMesAgenda(supabase, user, ano, mesIdx),
    supabase.from("subjects").select("id, nome").eq("user_id", user.id).order("nome"),
    supabase.from("profiles").select("modo_estudo").eq("id", user.id).maybeSingle(),
  ]);

  if (!mesBruto) return null;

  // Modo livre: sessões, tarefas e metas continuam — quem não quer plano
  // automático ainda organiza o próprio mês. A PROVA é que sai: ela escreve
  // em `bosses`, que é a porta de entrada do ecossistema de trajetória que
  // esse aluno desligou. Ver lib/questly/modo-estudo.ts.
  const guiado = questlyModoEstudo(profile) === "guiado";
  const mes = guiado ? mesBruto : { ...mesBruto, provas: {} };

  return (
    <CalendarioView
      mesInicial={mes}
      subjects={(subjectsRes.data || []) as { id: string; nome: string }[]}
      hoje={hoje}
      diaInicial={usarPedido ? diaInicial : null}
      guiado={guiado}
    />
  );
}
