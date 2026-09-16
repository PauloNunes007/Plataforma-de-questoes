import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/auth/sessao";
import {
  carregarContextoInstituicao,
  carregarHistorico,
  carregarStatusPlano,
  contarProvasOficiais,
} from "@/lib/simulados/simulados-data";
import { listarInstituicoesComQuestoes } from "@/lib/cursos/actions";
import { SimuladosLista } from "@/components/simulados/simulados-lista";

export const metadata: Metadata = {
  title: "Simulados",
};

export default async function SimuladosPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return null;

  // O hub mostra só o resumo (última/média/melhor), calculado do próprio
  // histórico — a análise pesada é a página /simulados/desempenho inteira.
  // A universidade do aluno entra pelo caminho LEVE (8 linhas de
  // `vw_instituicoes`): desde 2026-09-16 ela não libera nem bloqueia nada,
  // só escolhe o texto, então montar a árvore inteira de matérias aqui era
  // pagar a conta do montador em toda visita ao hub.
  const [historico, contexto, status, instituicoesDisponiveis, provasOficiais] = await Promise.all([
    carregarHistorico(supabase, user),
    carregarContextoInstituicao(supabase, user),
    carregarStatusPlano(supabase, user),
    listarInstituicoesComQuestoes(),
    contarProvasOficiais(supabase),
  ]);

  return (
    <SimuladosLista
      historico={historico}
      status={status}
      reconhecida={contexto.reconhecida}
      nomeInstituicao={contexto.nomeInstituicao}
      universidade={contexto.universidade}
      instituicoesDisponiveis={instituicoesDisponiveis}
      provasOficiais={provasOficiais}
    />
  );
}
