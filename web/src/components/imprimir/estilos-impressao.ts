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
//  · o MIOLO da questão (enunciado + alternativas) não quebra no meio
//    (`break-inside: avoid`), mas o espaço de resolução QUEBRA. Ver o bloco
//    "PAGINAÇÃO" abaixo: proibir a quebra do bloco inteiro era o que produzia
//    páginas quase vazias quando o espaço pra conta cresceu;
//  · o rodapé corre em TODA página via `position: fixed` dentro de @media
//    print — é o único jeito confiável de carimbar todas as folhas sem saber
//    quantas são. Cabeçalho corrente NÃO existe: o Chrome ancora o `fixed` na
//    caixa de conteúdo, e `top` caía em cima da primeira linha de cada página.

export const CSS_IMPRESSAO = `
  .folha {
    color: #111827;
    background: #ffffff;
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia,
      "Times New Roman", serif;
    overflow-wrap: break-word;
  }
  .folha .sans {
    font-family: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
  }

  /* Espaço em branco pro aluno desenvolver a questão no papel.
     Sem pauta, por pedido do dono: conta de Física não anda em linha reta —
     tem diagrama, vetor, sistema de eixos —, e a pauta atrapalhava mais do que
     guiava. Só um filete no topo separando do enunciado. */
  .espaco-resolucao {
    border-top: 1px dashed #dfe3e6;
  }

  /* KaTeX na folha.
     "MathText" embrulha fórmula de BLOCO num "overflow-x-auto" — certíssimo na
     tela (a matriz rola sozinha no celular em vez de empurrar a página), e um
     defeito silencioso no papel: o que passa da largura é CORTADO, e o aluno
     recebe um PDF com a equação faltando o fim sem nenhum aviso.
     Aqui o recorte é desligado e o corpo da fórmula de bloco encolhe um
     pouco, que é o que faz a maioria caber na coluna A4 em vez de sangrar. */
  .folha .overflow-x-auto {
    overflow: visible !important;
  }
  .folha .katex-display {
    overflow: visible;
    font-size: 0.95em;
  }
  .folha .katex { font-size: 1em; }

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

    /* PAGINAÇÃO. O casco do app é flex (ver (protected)/layout.tsx, que já
       vira bloco no print) e a própria folha usa flex/grid em vários pontos —
       e o Chrome fragmenta MAL dentro de flex: é isso que produzia página
       cortada, conteúdo sumido e folha em branco no meio do PDF. Aqui a folha
       inteira volta a ser fluxo de bloco, que é o que o algoritmo de quebra
       sabe fatiar. */
    .folha-raiz, .folha, .folha-conteudo, .folha ol, .folha ol > li {
      display: block !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
    }

    .folha { padding: 0 !important; max-width: none !important; width: 100% !important; }

    /* O que não pode partir é o MIOLO da questão: enunciado numa página e
       alternativas na outra é uma prova inutilizável. O espaço de resolução,
       ao contrário, pode partir — meia folha de espaço em branco no fim de uma
       página e o resto no começo da outra não atrapalha ninguém, e proibir a
       quebra dele era o que empurrava questões inteiras pra página seguinte,
       deixando metade da anterior vazia. */
    .questao-miolo, .sem-quebra {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .questao-bloco {
      break-inside: auto;
      page-break-inside: auto;
    }
    .folha img {
      break-inside: avoid;
      page-break-inside: avoid;
      max-width: 100% !important;
    }

    /* Figuras em MILÍMETROS no papel, não em px.
       Na tela um "max-h-[250px]" é uma altura razoável; no A4 ele é 1/4 da
       folha, e uma questão com figura no enunciado MAIS cinco figuras de
       alternativa não cabia numa página — o miolo indivisível era empurrado
       pra folha seguinte e ficava meia página em branco atrás dele. Com o teto
       em mm, a questão inteira cabe e o espaço de resolução continua servindo
       pra alguma coisa. */
    .figura-enunciado { max-height: 46mm !important; }
    .figura-alternativa { max-height: 20mm !important; }

    .quebra-pagina { break-before: page; page-break-before: always; }

    /* Repetido dentro do print porque o utilitário do Tailwind pode vencer
       por ordem de cascata na folha de estilos do app. */
    .folha .overflow-x-auto, .folha .katex-display {
      overflow: visible !important;
    }

    /* Rodapé de TODA folha. -webkit-print-color-adjust mantém a cor quando o
       navegador tenta "economizar tinta" achatando cinzas.

       NÃO EXISTE cabeçalho corrente, e não é esquecimento: o Chrome posiciona
       elemento "fixed" pela CAIXA DE CONTEÚDO da página, não pela folha —
       "bottom" cai na sobra depois do texto e funciona, mas "top" cai EM CIMA
       da primeira linha, e o resultado era o título da lista impresso por cima
       do cabeçalho corrente, letra sobre letra. A identificação da cópia já
       está no rodapé (que se repete) e no cabeçalho da primeira página. */
    .rodape-marca {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 4mm;
      display: flex !important;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-align: center;
      font-size: 7.5pt;
      color: #6b7280 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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
       "economizar tinta" do navegador, senão a folha sai sem onde marcar.
       O grid do cartão e do gabarito é a exceção do reset de display acima:
       esses dois PRECISAM continuar em grade, e são blocos curtos que cabem
       numa página. */
    .tinta-exata {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .grade-impressao { display: grid !important; }
    .linha-impressao { display: flex !important; }
  }
`;
