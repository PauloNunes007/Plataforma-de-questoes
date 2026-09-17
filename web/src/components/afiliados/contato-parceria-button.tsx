"use client";

// CTA de contato do programa de parceiros (/parceria). É um <a href="mailto:">
// comum — funciona sozinho em qualquer navegador com cliente de e-mail
// configurado — mas esta página é feita pra ser aberta a partir de um link do
// Instagram (bio, story, DM), e o navegador embutido do Instagram (junto de
// vários navegadores móveis sem app de e-mail padrão) não sabe abrir
// `mailto:` e cai numa busca do Google pelo texto do link, deixando quem
// clicou sem entender o que aconteceu — foi isso que o dono relatou.
//
// A defesa é em camadas, nenhuma dependendo da anterior funcionar:
//   1. o href mailto: continua ali — em navegador normal, abre o app de e-mail;
//   2. ao clicar, tentamos copiar o endereço pro clipboard e avisamos — cobre
//      quem caiu na busca sem perceber que o clique "funcionou" por baixo;
//   3. o endereço fica escrito por extenso do lado do botão, sempre — é o
//      que sobra quando as duas primeiras falham (clipboard bloqueado, JS
//      desligado, in-app browser capando as duas coisas).
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { EMAIL_CONTATO } from "@/lib/contato";

const ASSUNTO_PARCERIA = "Quero ser parceiro da Expectrum";

export function ContatoParceriaButton({
  texto,
  className,
  centralizado,
}: {
  texto: string;
  className: string;
  /** Uso dentro de um bloco `text-center` (a seção de CTA final da página). */
  centralizado?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  async function aoClicar() {
    try {
      await navigator.clipboard.writeText(EMAIL_CONTATO);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 5000);
    } catch {
      // Sem clipboard (permissão negada, contexto não seguro): o endereço
      // visível abaixo do botão continua sendo o caminho que sempre funciona.
    }
  }

  return (
    <span
      className={
        "inline-flex flex-col gap-1.5 " + (centralizado ? "items-center" : "items-start")
      }
    >
      <a
        href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(ASSUNTO_PARCERIA)}`}
        onClick={aoClicar}
        className={className}
      >
        {texto}
        <ArrowRight />
      </a>
      <span className="text-[12px] text-muted-foreground">
        {copiado ? (
          <span className="inline-flex items-center gap-1 font-semibold text-questly-green-dark dark:text-questly-green">
            <Check className="size-3.5" strokeWidth={2.5} />
            E-mail copiado — cole em qualquer app
          </span>
        ) : (
          <>Não abriu seu app de e-mail? Copia: {EMAIL_CONTATO}</>
        )}
      </span>
    </span>
  );
}
