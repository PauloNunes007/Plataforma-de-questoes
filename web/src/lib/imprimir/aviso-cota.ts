import type { CotaPdf } from "./cota";
import { PDF_AVISO_RESTANTE, PDF_QUESTOES_MAX } from "@/lib/plano/limites";

// A frase que a folha mostra sobre a cota — montada no servidor, que é quem
// tem a contagem, e só quando há algo a dizer.
//
// O silêncio é o padrão de propósito. Um Pro que exporta a terceira lista do
// mês não precisa de um aviso de limite em cima da folha; isso transformaria
// um teto que quase ninguém encosta num carimbo permanente de "você está sendo
// vigiado". A frase aparece em três situações, todas acionáveis:
//
//   • a lista é maior do que cabe num arquivo (o corte PRECISA ser dito — o
//     aluno estaria imprimindo menos do que pensa);
//   • a cota está acabando (PDF_AVISO_RESTANTE), enquanto ainda dá pra
//     escolher o que exportar;
//   • é reimpressão, e aí a notícia é BOA: não consumiu nada.
export function avisoDaCota(cota: CotaPdf, cortadas: number): string | null {
  const partes: string[] = [];

  if (cortadas > 0) {
    partes.push(
      `Esta lista tem ${cortadas + PDF_QUESTOES_MAX} questões e o arquivo leva as ` +
        `${PDF_QUESTOES_MAX} primeiras — pra imprimir o resto, monte uma lista com as ` +
        `demais no Banco de Questões.`,
    );
  }

  const restante = Math.min(cota.restanteSemana, cota.restanteMes);

  if (cota.reimpressao) {
    partes.push("Você já tinha exportado este documento nesta semana — reimprimir não consome cota.");
  } else if (restante <= PDF_AVISO_RESTANTE) {
    partes.push(
      restante === 0
        ? "Esta foi a sua última exportação da cota. Reimprimir o que você já baixou continua liberado."
        : `Restam ${restante} exportação(ões) na sua cota. Reimprimir o que você já baixou não conta.`,
    );
  }

  return partes.length ? partes.join(" ") : null;
}
