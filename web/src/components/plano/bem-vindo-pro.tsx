"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Brain,
  CalendarX2,
  FileDown,
  FileText,
  Heart,
  Infinity as InfinityIcon,
  Mail,
  Target,
  type LucideIcon,
} from "lucide-react";
import { ProEmblema } from "@/components/plano/pro-ui";
import { ehProDeLancamento } from "@/lib/plano/lancamento";

// A tela de BOAS-VINDAS ao Pro — o que o aluno vê no segundo seguinte ao
// pagamento aprovado.
//
// Antes daqui existia só o `StatusPro`: um cartão com "Assinatura ativa" e a
// data de validade. Correto e frio. O problema é de produto, não de estética —
// o momento logo após o pagamento é o único em que o aluno está 100% disposto
// a aprender o que acabou de comprar, e a tela gastava esse momento informando
// uma data. Quem não sabe o que ganhou não usa; quem não usa não renova.
//
// Por isso cada benefício aqui é um LINK pra onde ele é usado, e não um item
// de lista: a diferença entre "você tem controle de faltas" e "clique aqui e
// configure suas faltas agora" é a diferença entre ler e ativar.
//
// A lista é escrita à mão em vez de mapear BENEFICIOS_PRO porque aqui cada
// item precisa de destino e ícone — e um benefício sem tela pra onde ir não
// deveria estar nesta página de qualquer forma. A regra de lib/plano/plano.ts
// continua valendo: nada listado aqui existe sem gate real no código.

type Destino = {
  icone: LucideIcon;
  titulo: string;
  texto: string;
  href: string;
  cta: string;
};

const DESTINOS: Destino[] = [
  {
    icone: CalendarX2,
    titulo: "Controle de faltas",
    texto:
      "Diga quantas faltas cada disciplina permite e registre as suas. O app avisa antes de você passar do limite.",
    href: "/materias",
    cta: "Configurar faltas",
  },
  {
    icone: Target,
    titulo: "Calculadora de notas",
    texto:
      "Cadastre P1, P2 e trabalhos com os pesos certos. A gente calcula quanto falta tirar pra passar.",
    href: "/materias",
    cta: "Lançar minhas notas",
  },
  {
    icone: InfinityIcon,
    titulo: "Questões sem teto",
    texto:
      "Acabou o limite diário. Maratone a véspera da prova inteira, se for o caso.",
    href: "/questoes",
    cta: "Ir pro banco de questões",
  },
  {
    icone: FileText,
    titulo: "Simulados ilimitados",
    texto:
      "Prova cronometrada quantas vezes quiser — inclusive as provas antigas da sua universidade.",
    href: "/simulados",
    cta: "Montar um simulado",
  },
  {
    icone: FileDown,
    titulo: "Exportar em PDF",
    texto:
      "Baixe qualquer lista pra imprimir e resolver no papel, do jeito que a prova vai ser.",
    href: "/questoes/listas",
    cta: "Ver minhas listas",
  },
  {
    icone: Brain,
    titulo: "Autópsia do erro",
    texto:
      "Em cada erro, o porquê: conceito, conta, interpretação ou chute. E o padrão que se repete.",
    href: "/questoes",
    cta: "Praticar agora",
  },
  {
    icone: BarChart3,
    titulo: "Estatísticas avançadas",
    texto: "Percentil, comparativo com quem mais estuda e seus recordes.",
    href: "/dashboard",
    cta: "Ver meu desempenho",
  },
  {
    icone: Mail,
    titulo: "Relatório semanal",
    texto:
      "Toda segunda, no seu e-mail: o que você estudou, onde está fraco e quais disciplinas estão apertando.",
    href: "/materias",
    cta: "Ajustar o relatório",
  },
];

export function BemVindoPro({
  ciclo,
  expiraEm,
}: {
  ciclo: string | null;
  expiraEm: string | null;
}) {
  const validade = expiraEm
    ? new Date(expiraEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  // Esta tela nasceu pro segundo seguinte ao PAGAMENTO, e por isso abria com
  // "Pagamento aprovado". A semana de lançamento chega na mesma tela sem que
  // ninguém tenha pago — e o mesmo cabeçalho viraria a afirmação de uma
  // cobrança que não existiu, que é a forma mais rápida de fazer um brinde
  // parecer golpe.
  const lancamento = ehProDeLancamento({ plano_ciclo: ciclo });

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5"
    >
      <div className="surface-gold rounded-2xl px-6 py-7 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-questly-green/10 text-questly-green ring-1 ring-questly-green/25">
          <BadgeCheck size={26} strokeWidth={2} />
        </span>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-questly-gold">
          {lancamento ? "Semana de lançamento" : "Pagamento aprovado"}
        </p>
        <h2 className="mt-1.5 font-heading text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]">
          Bem-vindo ao Expectrum Pro
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
          Tudo abaixo já está liberado nesta conta — agora mesmo, sem esperar
          nada.{" "}
          {lancamento
            ? "É a semana Pro de lançamento: nada foi cobrado, e no fim do prazo a conta volta ao grátis sozinha."
            : ciclo === "semestral"
              ? "Você garantiu o semestre inteiro."
              : "Seu mês de Pro começa agora."}
        </p>

        {validade && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-questly-gold/30 bg-questly-gold/10 px-3 py-1 text-[12px] font-semibold text-questly-gold">
            <ProEmblema size={14} />
            {lancamento ? "Vai até" : "Ativo até"} {validade}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 px-1 font-heading text-[16px] font-semibold tracking-tight">
          O que você acabou de destravar
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DESTINOS.map((d, i) => (
            <motion.div
              key={d.titulo}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
            >
              <Link
                href={d.href}
                className="surface-interativa group flex h-full flex-col p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-questly-gold/12 text-questly-gold">
                  <d.icone size={16} strokeWidth={2} />
                </span>
                <p className="mt-2.5 text-[13.5px] font-semibold tracking-tight">
                  {d.titulo}
                </p>
                <p className="mt-1 flex-1 text-[12px] leading-relaxed text-muted-foreground">
                  {d.texto}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-questly-green-dark">
                  {d.cta}
                  <ArrowRight
                    size={12}
                    strokeWidth={2.4}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-muted-foreground">
        <Heart size={12} strokeWidth={2} className="text-questly-red" />
        Obrigado por apoiar a Expectrum — é assinatura de aluno que mantém o
        banco de questões crescendo.
      </p>
    </motion.section>
  );
}
