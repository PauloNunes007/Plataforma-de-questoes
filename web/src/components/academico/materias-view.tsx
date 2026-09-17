"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpen, Lock } from "lucide-react";
import type { MateriaAcademica } from "@/lib/academico/academico-data";
import { alertasDaVidaAcademica } from "@/lib/academico/academico-data";
import { MateriaCartao } from "./materia-cartao";
import { MateriaPainel } from "./materia-painel";
import { RelatorioToggle } from "./relatorio-toggle";
import { ProEmblema } from "@/components/plano/pro-ui";
import { fmt } from "./tons";

// "Minhas matérias" — o semestre do aluno FORA das questões.
//
// Esta tela existe porque as duas contas que mais decidem a vida acadêmica dele
// não tinham nada a ver com o banco de questões: quantas faltas ainda cabem e
// quanto ele precisa tirar na próxima. Ele fazia as duas no caderno, no grupo
// da turma, ou não fazia — e descobria em novembro.
//
// ESTRUTURA (redesenho 2026-09-17): faixa de resumo → grade de cartões
// compactos → painel. A versão anterior empilhava, pra CADA disciplina, um
// cartão de faltas e um de notas com listas e formulários abertos inline: com
// seis matérias a tela tinha seis alturas de rolagem, e abrir um formulário
// empurrava tudo o que estava abaixo. Aqui a grade inteira cabe numa olhada e
// o detalhe é uma camada por cima, não mais scroll.
//
// PLANO GRÁTIS: a tela aparece inteira, com os dados que existirem, e só a
// EDIÇÃO é travada (`editavel={false}`). Esconder a tela venderia menos e, pior,
// faria quem já foi Pro achar que perdeu o que digitou.
export function MateriasView({
  materias,
  ehPro,
  relatorioSemanal,
}: {
  materias: MateriaAcademica[];
  ehPro: boolean;
  relatorioSemanal: boolean;
}) {
  const router = useRouter();
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const alertas = useMemo(() => alertasDaVidaAcademica(materias), [materias]);

  // A disciplina aberta é derivada do array, nunca copiada pro estado: assim o
  // painel se atualiza sozinho no `router.refresh()` que vem depois de cada
  // gravação, em vez de mostrar a cópia velha até ser fechado.
  const aberta = materias.find((m) => m.subjectId === abertaId) ?? null;

  function recarregar() {
    // O cálculo é todo derivado das linhas do banco (nenhum contador
    // denormalizado), então revalidar o server component é a forma mais barata
    // e menos enganosa de atualizar — não existe estado local pra divergir.
    router.refresh();
  }

  if (materias.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        {!ehPro && <ConvitePro />}
        <VazioSemDisciplinas />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FaixaResumo materias={materias} alertas={alertas} />

      {!ehPro && <ConvitePro />}

      {alertas.length > 0 && <Alertas alertas={alertas} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {materias.map((m) => (
          <MateriaCartao key={m.subjectId} materia={m} onAbrir={() => setAbertaId(m.subjectId)} />
        ))}
      </div>

      {ehPro && <RelatorioToggle inicial={relatorioSemanal} />}

      <MateriaPainel
        materia={aberta}
        editavel={ehPro}
        onFechar={() => setAbertaId(null)}
        onMudou={recarregar}
      />
    </div>
  );
}

/* ---------------------------------------------------------- faixa de resumo */

/**
 * O semestre inteiro em quatro números.
 *
 * Os dois do meio são os que valem a faixa: a MENOR margem de faltas e a MAIOR
 * nota exigida entre todas as disciplinas — os dois extremos que decidem o
 * semestre. Uma média entre as matérias não diria nada: reprovar em uma já
 * basta.
 */
function FaixaResumo({
  materias,
  alertas,
}: {
  materias: MateriaAcademica[];
  alertas: ReturnType<typeof alertasDaVidaAcademica>;
}) {
  const emRisco = materias.filter(
    (m) =>
      m.frequencia.nivel === "reprovado" ||
      m.frequencia.nivel === "limite" ||
      m.frequencia.nivel === "atencao" ||
      m.notas.situacao === "impossivel" ||
      m.notas.situacao === "reprovado" ||
      m.notas.situacao === "dificil",
  ).length;

  const comMargem = materias
    .filter((m) => m.frequencia.restantes != null)
    .sort((a, b) => (a.frequencia.restantes as number) - (b.frequencia.restantes as number))[0];

  const maiorAlvo = materias
    .filter((m) => m.proxima?.precisa != null)
    .sort((a, b) => (b.proxima?.precisa as number) - (a.proxima?.precisa as number))[0];

  return (
    <div className="surface relative overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-questly-green/40 to-transparent"
      />
      {/* Hairline por `gap-px` sobre o fundo `bg-border`, e não `divide-x`: num
          grid o `divide-*` pinta a borda de todo item menos o primeiro, então o
          item que ABRE a segunda linha ganhava uma borda esquerda solta. */}
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <Tile rotulo="Disciplinas" valor={String(materias.length)} />
        <Tile
          rotulo="Pedindo atenção"
          valor={String(emRisco)}
          detalhe={alertas.length > 0 ? `${alertas.length} aviso${alertas.length === 1 ? "" : "s"}` : "tudo certo"}
          tom={emRisco > 0 ? "alerta" : "ok"}
        />
        <Tile
          rotulo="Menor margem"
          valor={
            comMargem?.frequencia.restantes != null
              ? String(Math.max(0, comMargem.frequencia.restantes))
              : "—"
          }
          detalhe={comMargem ? `faltas · ${comMargem.nome}` : "sem limite definido"}
        />
        <Tile
          rotulo="Maior alvo"
          valor={maiorAlvo?.proxima?.precisa != null ? fmt(Math.max(0, maiorAlvo.proxima.precisa)) : "—"}
          detalhe={
            maiorAlvo?.proxima ? `${maiorAlvo.proxima.nome} · ${maiorAlvo.nome}` : "nenhuma prova pendente"
          }
        />
      </div>
    </div>
  );
}

function Tile({
  rotulo,
  valor,
  detalhe,
  tom,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  tom?: "ok" | "alerta";
}) {
  const cor =
    tom === "alerta" ? "text-questly-orange-dark" : tom === "ok" ? "text-questly-green-dark" : "";
  return (
    <div className="min-w-0 bg-card px-4 py-3">
      <p className="kicker text-[10px]">{rotulo}</p>
      <p className={`tnum font-heading text-[24px] font-semibold leading-tight tracking-tight ${cor}`}>
        {valor}
      </p>
      {detalhe && <p className="truncate text-[11px] text-muted-foreground">{detalhe}</p>}
    </div>
  );
}

/* ----------------------------------------------------------------- avisos */

function Alertas({ alertas }: { alertas: ReturnType<typeof alertasDaVidaAcademica> }) {
  const [tudo, setTudo] = useState(false);
  const visiveis = tudo ? alertas : alertas.slice(0, 3);

  return (
    <div className="rounded-2xl border border-questly-orange/30 bg-questly-orange/[0.07] px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-questly-orange-dark">
        <AlertTriangle size={13} strokeWidth={2.3} />
        {alertas.length === 1 ? "1 ponto de atenção" : `${alertas.length} pontos de atenção`}
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {visiveis.map((a, i) => (
          <li key={i} className="text-[12.5px] leading-relaxed">
            <b className="font-semibold">{a.disciplina}:</b>{" "}
            <span className="text-muted-foreground">{a.texto}</span>
          </li>
        ))}
      </ul>
      {alertas.length > 3 && (
        <button
          type="button"
          onClick={() => setTudo((v) => !v)}
          className="mt-2 cursor-pointer text-[11.5px] font-semibold text-questly-orange-dark underline-offset-2 hover:underline"
        >
          {tudo ? "Mostrar menos" : `Ver os outros ${alertas.length - 3}`}
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- estados */

function ConvitePro() {
  return (
    <div className="surface-gold flex flex-col items-start gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:p-5">
      <ProEmblema size={38} />
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[15px] font-semibold tracking-tight">
          Faltas e notas fazem parte do Pro
        </p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
          Você pode ver o que já registrou, mas pra lançar falta, cadastrar avaliação e projetar a nota que
          falta é preciso assinar.
        </p>
      </div>
      <Link
        href="/pro"
        className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-questly-gold/35 bg-questly-gold/10 px-4 text-[13px] font-semibold text-questly-gold transition-colors hover:bg-questly-gold/20 sm:w-auto"
      >
        <Lock size={13} strokeWidth={2.1} />
        Conhecer o Pro
        <ArrowRight size={13} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

function VazioSemDisciplinas() {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <BookOpen size={18} strokeWidth={1.75} className="text-muted-foreground" />
      </span>
      <p className="mb-1 text-[15px] font-medium">Você ainda não tem disciplinas</p>
      <p className="mb-5 max-w-[380px] text-sm text-muted-foreground">
        Cadastre as matérias do semestre em Configurações — é a mesma lista que o resto do app usa.
      </p>
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-1.5 rounded-xl bg-questly-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] dark:text-[#0c1512]"
      >
        Cadastrar disciplinas
        <ArrowRight size={14} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
