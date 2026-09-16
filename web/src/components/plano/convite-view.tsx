"use client";

// Tela do link de convite (/convite/[codigo]). É a primeira coisa que o
// testador vê depois de tocar no link do WhatsApp, então tem uma tarefa só:
// dizer o que ele ganhou, quando entra no ar, e sair da frente.
//
// O número de dias e as vagas restantes vêm do cupom no banco (nada digitado
// à mão aqui — mesma regra de honestidade da landing). Os recursos listados
// são os de BENEFICIOS_PRO, a mesma fonte que a /pro e a landing usam: se um
// gate mudar, esta tela muda junto e não vira promessa velha.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, Clock, Loader2, Ticket, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { resgatarCupomAction, type EstadoConvite } from "@/lib/plano/actions";
import { BENEFICIOS_PRO, COOKIE_CONVITE } from "@/lib/plano/plano";
import { arredondarPraBaixo, type StatsBanco } from "@/lib/landing/stats";

// 30 dias: o convite sobrevive a "vou criar a conta depois" sem virar um
// fantasma que ressuscita meses adiante num navegador compartilhado.
const DIAS_COOKIE = 30;

function guardarConvite(codigo: string) {
  try {
    const seguro = location.protocol === "https:" ? "; secure" : "";
    const maxAge = DIAS_COOKIE * 24 * 60 * 60;
    document.cookie =
      COOKIE_CONVITE +
      "=" +
      encodeURIComponent(codigo) +
      "; path=/; max-age=" +
      maxAge +
      "; samesite=lax" +
      seguro;
  } catch {
    // Navegador com cookie bloqueado: o aluno ainda consegue resgatar à mão
    // em /pro ("Tenho um cupom"), que é o caminho que o link só automatiza.
  }
}

export function ConviteView({
  convite,
  logado,
  jaEhPro,
  stats,
}: {
  convite: EstadoConvite;
  logado: boolean;
  jaEhPro: boolean;
  stats: StatsBanco;
}) {
  const reduzir = useReducedMotion();
  const valido = convite.estado === "valido";
  const codigo = convite.codigo;

  // Guarda o código assim que a página abre — ANTES de qualquer clique. Quem
  // vier pelo link e criar a conta cai no app já com o Pro ligado (o resgate
  // automático mora em components/plano/convite-auto-resgate.tsx); quem
  // desistir no meio e voltar dias depois continua com o convite no bolso.
  useEffect(() => {
    if (valido) guardarConvite(codigo);
  }, [valido, codigo]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background px-5 py-6">
      {/* mesma linguagem visual da landing e do /login */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
        <div className="absolute top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-gold/12 blur-[120px]" />
      </div>

      <Link
        href="/"
        className="relative z-10 flex w-fit items-center gap-2 rounded-xl py-1 pr-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Logo />
      </Link>

      <main className="relative z-10 flex flex-1 items-center justify-center py-8">
        <motion.div
          initial={reduzir ? undefined : { opacity: 0, y: 14 }}
          animate={reduzir ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          {convite.estado === "valido" ? (
            <ConviteValido
              codigo={convite.codigo}
              diasPro={convite.diasPro}
              vagasRestantes={convite.vagasRestantes}
              logado={logado}
              jaEhPro={jaEhPro}
              stats={stats}
            />
          ) : (
            <ConviteIndisponivel convite={convite} logado={logado} />
          )}
        </motion.div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------ convite ok */

function ConviteValido({
  codigo,
  diasPro,
  vagasRestantes,
  logado,
  jaEhPro,
  stats,
}: {
  codigo: string;
  diasPro: number;
  vagasRestantes: number | null;
  logado: boolean;
  jaEhPro: boolean;
  stats: StatsBanco;
}) {
  const router = useRouter();
  const [resgatando, setResgatando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [liberado, setLiberado] = useState(false);

  async function ativar() {
    setErro(null);
    setResgatando(true);
    const res = await resgatarCupomAction(codigo);
    setResgatando(false);
    if ("error" in res) {
      setErro(res.error);
      return;
    }
    setLiberado(true);
    router.refresh();
  }

  if (liberado) {
    return (
      <Cartao>
        <Selo tom="verde" icone={<BadgeCheck className="size-3.5" strokeWidth={2.4} />}>
          Pro liberado
        </Selo>
        <h1 className="mt-4 font-heading text-[26px] leading-tight font-semibold tracking-tight">
          Pronto — {diasPro} dias de Pro na sua conta.
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
          Tudo já está liberado. Monte sua primeira lista ou um simulado com questões de
          provas anteriores.
        </p>
        <Link
          href="/dashboard"
          className={buttonVariants({ size: "lg" }) + " mt-6 h-12 w-full px-6 text-[15px]"}
        >
          Ir pro meu painel
          <ArrowRight />
        </Link>
      </Cartao>
    );
  }

  return (
    <Cartao>
      <Selo tom="dourado" icone={<Ticket className="size-3.5" strokeWidth={2.4} />}>
        Convite de testador
      </Selo>

      <h1 className="mt-4 font-heading text-[26px] leading-tight font-semibold tracking-tight text-balance sm:text-[30px]">
        <span className="tnum">{diasPro}</span> dias de Questly Pro, por nossa conta.
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground text-pretty">
        Você está entre os primeiros a testar a plataforma. Crie sua conta e o Pro entra no ar na
        hora — sem cartão, sem cobrança no fim.
      </p>

      <ul className="mt-6 flex flex-col gap-2.5">
        {BENEFICIOS_PRO.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
            <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-questly-green/15 text-questly-green-dark dark:text-questly-green">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-3">
        {jaEhPro ? (
          // Já tem Pro (pagante ou de outro convite): os dias SOMAM em cima da
          // validade atual — resgatar nunca encurta o que a pessoa já tinha.
          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
            Sua conta já está no Pro. Ativar este convite soma {diasPro} dias ao fim da validade que
            você já tem — não substitui nem encurta.
          </p>
        ) : null}

        {logado ? (
          <button
            type="button"
            onClick={ativar}
            disabled={resgatando}
            className={
              buttonVariants({ size: "lg" }) +
              " h-12 w-full px-6 text-[15px] disabled:pointer-events-none disabled:opacity-60"
            }
          >
            {resgatando ? <Loader2 className="size-4 animate-spin" /> : null}
            Ativar meus {diasPro} dias
            {resgatando ? null : <ArrowRight />}
          </button>
        ) : (
          <Link
            href="/login"
            className={buttonVariants({ size: "lg" }) + " h-12 w-full px-6 text-[15px]"}
          >
            Criar minha conta grátis
            <ArrowRight />
          </Link>
        )}

        {erro ? <p className="text-[12.5px] text-questly-red-dark">{erro}</p> : null}

        {!logado ? (
          <p className="text-center text-[12px] text-muted-foreground">
            O convite fica guardado neste navegador — o Pro é liberado sozinho assim que a conta
            estiver pronta.
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-[12px] text-muted-foreground">
        {vagasRestantes !== null ? (
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" strokeWidth={2} />
            <span className="tnum font-semibold text-foreground">{vagasRestantes}</span>
            {vagasRestantes === 1 ? "vaga restante" : "vagas restantes"}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" strokeWidth={2} />
          {diasPro} dias a partir do resgate
        </span>
        {stats.aoVivo ? (
          <span className="flex items-center gap-1.5">
            <BadgeCheck className="size-3.5" strokeWidth={2} />
            {arredondarPraBaixo(stats.total)} questões catalogadas
          </span>
        ) : null}
      </div>
    </Cartao>
  );
}

/* --------------------------------------------------- convite indisponível */

// Um convite queimado é um fim de linha comum (o link é reencaminhado). Diz a
// verdade sobre o motivo e oferece a porta normal — nunca finge que o código
// "quase" funcionou.
function ConviteIndisponivel({
  convite,
  logado,
}: {
  convite: Exclude<EstadoConvite, { estado: "valido" }>;
  logado: boolean;
}) {
  if (convite.estado === "ja_usado") {
    return (
      <Cartao>
        <Selo tom="verde" icone={<BadgeCheck className="size-3.5" strokeWidth={2.4} />}>
          Convite já usado
        </Selo>
        <h1 className="mt-4 font-heading text-[26px] leading-tight font-semibold tracking-tight">
          Este convite já está na sua conta.
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
          Os {convite.diasPro} dias de Pro foram liberados quando você resgatou. Cada convite vale
          uma vez por conta.
        </p>
        <Link
          href="/dashboard"
          className={buttonVariants({ size: "lg" }) + " mt-6 h-12 w-full px-6 text-[15px]"}
        >
          Ir pro meu painel
          <ArrowRight />
        </Link>
      </Cartao>
    );
  }

  const texto =
    convite.estado === "esgotado"
      ? "Todas as vagas deste convite foram preenchidas — ele era limitado a um grupo pequeno de testadores."
      : convite.estado === "expirado"
        ? "Este convite passou da validade."
        : "Não encontramos este convite. Confira se o link veio completo — um pedaço a menos e o código muda.";

  return (
    <Cartao>
      <Selo tom="neutro" icone={<Ticket className="size-3.5" strokeWidth={2.4} />}>
        Convite indisponível
      </Selo>
      <h1 className="mt-4 font-heading text-[26px] leading-tight font-semibold tracking-tight">
        {convite.estado === "esgotado" ? "As vagas acabaram." : "Este convite não vale mais."}
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground text-pretty">
        {texto}
      </p>
      <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
        A Questly continua de portas abertas: o plano grátis tem o banco de questões, a trilha da ementa,
        banco de questões com resolução e um simulado cronometrado por semana.
      </p>
      <Link
        href={logado ? "/dashboard" : "/login"}
        className={buttonVariants({ size: "lg" }) + " mt-6 h-12 w-full px-6 text-[15px]"}
      >
        {logado ? "Ir pro meu painel" : "Criar conta grátis"}
        <ArrowRight />
      </Link>
      <Link
        href="/"
        className="mt-3 block text-center text-[12.5px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Conhecer a plataforma
      </Link>
    </Cartao>
  );
}

/* ------------------------------------------------------------------ peças */

function Cartao({ children }: { children: React.ReactNode }) {
  return <div className="surface rounded-3xl px-6 py-7 sm:px-8 sm:py-9">{children}</div>;
}

function Selo({
  children,
  icone,
  tom,
}: {
  children: React.ReactNode;
  icone: React.ReactNode;
  tom: "dourado" | "verde" | "neutro";
}) {
  const cor =
    tom === "dourado"
      ? "bg-questly-gold/15 text-questly-gold"
      : tom === "verde"
        ? "bg-questly-green/15 text-questly-green-dark dark:text-questly-green"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase " +
        cor
      }
    >
      {icone}
      {children}
    </span>
  );
}
