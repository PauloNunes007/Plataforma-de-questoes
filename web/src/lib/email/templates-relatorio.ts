// E-mail do RELATÓRIO SEMANAL (Pro) — enviado toda segunda pela rota de cron.
//
// É o único e-mail RECORRENTE que a plataforma manda pro aluno, e por isso é o
// único transacional que carrega link de descadastro no rodapé: recorrente sem
// saída vira spam, e a reputação do remetente é compartilhada com o e-mail de
// confirmação de cadastro (ver templates-campanha.ts, mesmo raciocínio).
//
// O descadastro daqui NÃO usa o link assinado da campanha: ele desliga só o
// relatório (`profiles.relatorio_semanal`), e não todo contato. Quem clicou em
// "não quero o resumo de segunda" não pediu pra parar de receber o código de
// acesso da própria conta.
//
// Conteúdo: três blocos, nesta ordem, e a ordem é a mensagem —
//   1. o que apertou (faltas/média em risco): é a única coisa que pode fazer o
//      aluno PERDER o semestre, então vem antes de qualquer elogio;
//   2. o que você fez (questões, acerto, dias);
//   3. onde você errou mais (tópicos), com um clique pra treinar.

import { APP_URL } from "@/lib/app-url";
import {
  VERDE,
  TINTA,
  TINTA_SUAVE,
  FONTE,
  blocoBotao,
  blocoDestaques,
  blocoParagrafo,
  blocoTitulo,
  escapar,
  montarCasca,
} from "./casca";
import type { MensagemEmail } from "./enviar";
import type { RelatorioSemanal } from "@/lib/relatorio/relatorio-data";

function primeiroNome(nome: string | null | undefined): string {
  const limpo = (nome ?? "").trim();
  return limpo ? limpo.split(/\s+/)[0] : "";
}

/** Três números grandes lado a lado — o "extrato" da semana. */
function blocoNumeros(itens: { valor: string; rotulo: string }[]): string {
  const celulas = itens
    .map(
      (i) => `
                      <td align="center" width="33%" style="padding:6px 4px;font-family:${FONTE};">
                        <div style="font-size:26px;line-height:1.1;font-weight:800;color:${TINTA};">${escapar(i.valor)}</div>
                        <div style="margin-top:3px;font-size:11.5px;line-height:1.3;color:${TINTA_SUAVE};">${escapar(i.rotulo)}</div>
                      </td>`,
    )
    .join("");

  return `
              <tr>
                <td style="padding:4px 32px 18px 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e6e4;border-radius:14px;">
                    <tr>${celulas}
                    </tr>
                  </table>
                </td>
              </tr>`;
}

/** Faixa de ALERTA — o que pode custar o semestre. Vermelha, e no topo. */
function blocoAlertas(alertas: { disciplina: string; texto: string }[]): string {
  if (alertas.length === 0) return "";
  const linhas = alertas
    .slice(0, 4)
    .map(
      (a, i) => `
                    <tr>
                      <td style="padding:${i === 0 ? "0" : "10px"} 0 0 0;font-family:${FONTE};font-size:13.5px;line-height:1.5;color:${TINTA};">
                        <b>${escapar(a.disciplina)}:</b> <span style="color:${TINTA_SUAVE};">${escapar(a.texto)}</span>
                      </td>
                    </tr>`,
    )
    .join("");

  return `
              <tr>
                <td style="padding:0 32px 18px 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fdeeee;border:1px solid #f3cccc;border-radius:14px;">
                    <tr>
                      <td style="padding:18px 20px;">
                        <div style="margin-bottom:8px;font-family:${FONTE};font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#b93838;">Precisa da sua atenção</div>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${linhas}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

export function montarEmailRelatorioSemanal(input: {
  para: string;
  nome: string | null;
  relatorio: RelatorioSemanal;
}): MensagemEmail {
  const r = input.relatorio;
  const nome = primeiroNome(input.nome);

  const precisaoTexto = r.precisao != null ? `${Math.round(r.precisao * 100)}%` : "—";
  const assunto = r.alertas.length
    ? `Sua semana na Expectrum — e ${r.alertas.length === 1 ? "1 ponto" : `${r.alertas.length} pontos`} de atenção`
    : "Sua semana na Expectrum";

  const intro = r.questoes
    ? `${r.periodoLabel}: ${r.questoes} ${r.questoes === 1 ? "questão respondida" : "questões respondidas"} em ${r.diasEstudados} ${r.diasEstudados === 1 ? "dia" : "dias"}.`
    : `${r.periodoLabel}: você não respondeu questões nesta semana — mas tem coisa no seu semestre pedindo atenção.`;

  const destaques = r.topicosFracos.map((t) => ({
    titulo: t.nome,
    texto: `${t.erros} ${t.erros === 1 ? "erro" : "erros"} em ${t.total} ${t.total === 1 ? "questão" : "questões"}. Vale uma lista só disso nesta semana.`,
  }));

  const variacao =
    r.variacaoQuestoes == null
      ? ""
      : r.variacaoQuestoes > 0
        ? `Foram ${r.variacaoQuestoes} questões a mais que na semana anterior.`
        : r.variacaoQuestoes < 0
          ? `Foram ${Math.abs(r.variacaoQuestoes)} questões a menos que na semana anterior.`
          : "Mesmo volume da semana anterior.";

  const corpo = [
    blocoTitulo(nome ? `${nome}, como foi sua semana` : "Como foi sua semana", intro),
    blocoAlertas(r.alertas),
    r.questoes
      ? blocoNumeros([
          { valor: String(r.questoes), rotulo: "questões" },
          { valor: precisaoTexto, rotulo: "de acerto" },
          { valor: `${r.diasEstudados}/7`, rotulo: "dias estudados" },
        ])
      : "",
    destaques.length
      ? blocoParagrafo(
          `<b style="color:${TINTA};">Onde você mais errou</b>`,
          "0 32px 10px 32px",
        ) + blocoDestaques(destaques)
      : "",
    variacao ? blocoParagrafo(escapar(variacao), "18px 32px 0 32px") : "",
    blocoBotao(
      r.alertas.length ? "Ver minhas matérias" : "Continuar estudando",
      r.alertas.length ? `${APP_URL}/materias` : `${APP_URL}/questoes`,
      "20px 32px 8px 32px",
    ),
    blocoParagrafo(
      `Este resumo é parte do <b style="color:${VERDE};">Expectrum Pro</b>. Dá pra desligar em Minhas matérias, quando quiser.`,
      "14px 32px 28px 32px",
    ),
  ].join("");

  const texto = [
    nome ? `${nome}, como foi sua semana` : "Como foi sua semana",
    intro,
    "",
    ...(r.alertas.length
      ? ["Precisa da sua atenção:", ...r.alertas.map((a) => `- ${a.disciplina}: ${a.texto}`), ""]
      : []),
    ...(r.questoes
      ? [`Questões: ${r.questoes} · Acerto: ${precisaoTexto} · Dias estudados: ${r.diasEstudados}/7`, ""]
      : []),
    ...(destaques.length
      ? ["Onde você mais errou:", ...destaques.map((d) => `- ${d.titulo}: ${d.texto}`), ""]
      : []),
    variacao,
    `Acesse: ${APP_URL}/materias`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    para: input.para,
    nomePara: input.nome ?? undefined,
    assunto,
    html: montarCasca({
      assunto,
      preheader: r.alertas.length
        ? `${r.alertas[0].disciplina}: ${r.alertas[0].texto}`
        : `${r.questoes} questões, ${precisaoTexto} de acerto, ${r.diasEstudados} dias de estudo.`,
      corpo,
      rodape: `Você recebe este resumo porque é assinante Pro. <a href="${APP_URL}/materias" style="color:${TINTA_SUAVE};">Desligar o relatório semanal</a>.`,
    }),
    texto,
    cabecalhos: {
      // O Gmail mostra "Cancelar inscrição" ao lado do remetente quando este
      // cabeçalho existe — é o botão que o aluno aperta EM VEZ de marcar spam.
      "List-Unsubscribe": `<${APP_URL}/materias>`,
    },
  };
}
