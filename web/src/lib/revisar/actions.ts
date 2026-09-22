"use server";

import { createClient } from "@/lib/supabase/server";
import { criarListaDeQuestoes } from "@/lib/questly/criar-lista";
import {
  REVISAR_QTD_MAX,
  REVISAR_QTD_POR_TOPICO,
  carregarRevisarHoje,
} from "@/lib/revisar/revisar-data";

/**
 * Monta a lista de revisão dos tópicos que a memória do aluno está perdendo.
 *
 * Os tópicos NÃO vêm do cliente: a action recarrega o diagnóstico do zero
 * (`carregarRevisarHoje`) e usa o que o servidor mesmo apurou. A tela só
 * aperta o botão — sem isso, o payload viraria um jeito de montar lista com
 * tópico arbitrário por fora dos filtros do Banco de Questões, e o cartão
 * poderia ficar desatualizado numa aba aberta desde ontem e montar uma
 * revisão que já não faz sentido.
 *
 * A lista nasce `avulsa`, com `subject_id: null` — uma revisão de memória
 * cruza disciplinas por natureza, e é o mesmo caminho que o Caderno de Erros
 * já usa. Ela paga XP pela via normal de sempre (registrarRespostaAction):
 * revisar é estudo, e nada no diagnóstico em si paga nada.
 */
export async function revisarAgoraAction(): Promise<{
  missaoId: string | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { missaoId: null, error: "Sessão expirada." };

  const diagnostico = await carregarRevisarHoje(supabase, user.id);
  if (!diagnostico || diagnostico.topicos.length === 0) {
    return { missaoId: null, error: "Nada pra revisar agora — sua memória está em dia." };
  }

  const { missaoId } = await criarListaDeQuestoes(supabase, user.id, {
    subjectId: null,
    topicIds: diagnostico.topicos.map((t) => t.topicoId),
    dificuldades: [],
    // O teto por tópico já foi aplicado na contagem do diagnóstico; aqui vale
    // o total, porque o sorteio é feito sobre o conjunto dos três.
    quantidade: Math.min(
      REVISAR_QTD_MAX,
      diagnostico.topicos.length * REVISAR_QTD_POR_TOPICO,
    ),
  });

  if (!missaoId)
    return { missaoId: null, error: "Não deu pra montar a revisão agora." };
  return { missaoId };
}
