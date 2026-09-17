// O CSS da folha impressa, num módulo só.
//
// Vive fora do componente porque é uma string longa e estável, e porque a
// folha de lista, a de simulado e o cartão-resposta impresso usam exatamente o
// mesmo tratamento de página — um só lugar pra mexer quando a margem do A4
// estiver errada.
//
// Decisões que parecem detalhe e não são:
//
//  · a folha é sempre CLARA, mesmo com o app no tema escuro. Papel não tem
//    tema, e um fundo escuro imprimiria como um borrão de toner (ou, com
//    "imprimir fundos" desligado, texto branco em página branca);
//  · o corpo é SERIFADO. É o que faz o arquivo parecer uma prova da
//    universidade e não um site impresso — e, em corpo pequeno sobre papel,
//    serifa lê melhor que sans;
//  · as questões não quebram no meio (`break-inside: avoid`), porque
//    enunciado numa página e alternativas na outra é uma prova inutilizável;
//  · cabeçalho e rodapé correm em TODA página via `position: fixed` dentro de
//    @media print — é o único jeito confiável de carimbar todas as folhas sem
//    saber quantas são. Eles cabem dentro das margens do @page (por isso a
//    margem de topo/base é maior que a lateral), então não cobrem texto.

/** Altura do espaço de resolução por questão, em mm, por nível de espaçamento. */
export const ALTURA_RESOLUCAO_MM = { compacto: 0, normal: 22, amplo: 45 } as const;

export const CSS_IMPRESSAO = `
  .folha {
    color: #111827;
    background: #ffffff;
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia,
      "Times New Roman", serif;
  }
  .folha .sans {
    font-family: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
  }

  /* Espaço em branco pro aluno desenvolver a questão no papel. Pauta muito
     leve: guia a escrita sem competir com o enunciado na fotocópia. */
  .espaco-resolucao {
    border-top: 1px dashed #d4d9dd;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 7.9mm,
      #eef1f3 7.9mm,
      #eef1f3 8mm
    );
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @media print {
    /* O que é do app (header, barra de foco, barra inferior, botões) some: o
       que vai pro papel é a folha, e só.
       ATENCAO: nao da pra fazer isso com "body > *:not(.folha-raiz)" — a folha
       nasce DENTRO do layout de (protected), varios niveis abaixo do body,
       entao aquele seletor nao pegaria nada. Cada peca de cromo leva a classe
       print:hidden (ver top-nav, foco-bar, mobile-bottom-nav) e o que e desta
       tela usa .nao-imprimir. */
    .nao-imprimir { display: none !important; }

    @page {
      size: A4;
      margin: 17mm 14mm 17mm 14mm;
    }

    html, body, .folha-raiz, .folha {
      background: #ffffff !important;
      color: #111827 !important;
    }

    .folha { padding: 0 !important; max-width: none !important; }

    .questao-bloco {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .quebra-pagina { break-before: page; page-break-before: always; }
    .sem-quebra { break-inside: avoid; page-break-inside: avoid; }

    /* Cabeçalho e rodapé de TODA folha. -webkit-print-color-adjust mantém a
       cor quando o navegador tenta "economizar tinta" achatando cinzas. */
    .cabecalho-corrente,
    .rodape-marca {
      position: fixed;
      left: 0;
      right: 0;
      display: flex !important;
      align-items: center;
      gap: 8px;
      font-size: 7.5pt;
      color: #6b7280 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cabecalho-corrente {
      top: 4mm;
      justify-content: space-between;
      border-bottom: 0.4pt solid #d4d9dd;
      padding-bottom: 1.5mm;
    }
    .rodape-marca {
      bottom: 4mm;
      justify-content: center;
      text-align: center;
    }

    /* Na tela a marca acompanha a folha (absolute); no papel ela vira fixed,
       que é o que a repete em TODAS as páginas do PDF. */
    .marca-diagonal {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .folha-conteudo { position: relative; z-index: 1; }

    /* Bolhas do cartão-resposta e filetes do cabeçalho precisam sobreviver ao
       "economizar tinta" do navegador, senão a folha sai sem onde marcar. */
    .tinta-exata {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;
