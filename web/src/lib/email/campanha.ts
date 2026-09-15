// Motor do disparo em massa. Só SERVIDOR — usa service_role.
//
// Três coisas moldam este arquivo, e nenhuma delas é o conteúdo do e-mail:
//
// 1) A LISTA NÃO É COPIADA. Os destinatários saem de `auth.users` na hora do
//    disparo, via service_role. Não existe tabela de "leads" pra desatualizar
//    nem pra vazar; quem apagou a conta simplesmente não aparece.
//
// 2) O DISPARO É EM LOTES, e cada lote é uma requisição curta. Não porque seja
//    elegante, mas porque uma função serverless tem orçamento de segundos e a
//    Brevo entrega ~300/dia no grátis. A tela chama isto várias vezes e vê a
//    barra andar.
//
// 3) DUPLICATA CUSTA MAIS QUE OMISSÃO. Antes de enviar, a vaga é RESERVADA em
//    `email_campanha_envios` (status 'enviando'); só depois a mensagem sai. Se
//    a função morrer no meio, a linha fica 'enviando' e aquele aluno não entra
//    na próxima rodada — recebeu de menos, que é o erro barato. O contrário —
//    escrever depois de enviar — manda o mesmo e-mail duas vezes toda vez que
//    um timeout acontece, e isso vira reclamação de spam.

import { createAdminClient } from "@/lib/supabase/admin";
import { lerPaginado } from "@/lib/supabase/paginado";
import { creditosBrevo, enviarEmail } from "./enviar";
import { linkDescadastro } from "./descadastro";
import { montarEmailCampanha, type ConteudoCampanha } from "./templates-campanha";

/**
 * Quantos e-mails do saldo do dia NÃO podem ser gastos com campanha. É a cota
 * reservada pro transacional: se o disparo consumir os 300, o aluno que se
 * cadastrar hoje à noite não recebe o código e não entra. Campanha pode
 * esperar amanhã; cadastro não.
 */
export const RESERVA_TRANSACIONAL = 60;

/** Envios simultâneos por rodada. Mais que isto não acelera (o gargalo é a
 *  API da Brevo) e aumenta a chance de estourar o tempo da função. */
const PARALELO = 4;

/** Teto por clique. Com 4 em paralelo e ~400ms por envio, 40 cabem com folga
 *  no orçamento de 60s da função. */
export const LOTE_MAX = 40;

export type ResumoCampanha = {
  contas: number;
  naoConfirmadas: number;
  optOut: number;
  enviados: number;
  falhas: number;
  emCurso: number;
  elegiveis: number;
  restantes: number;
  creditos: number | null;
  /** Quanto o próximo lote consegue mandar, já descontada a reserva. */
  tetoDoLote: number;
};

type Usuario = { id: string; email: string; nome: string; confirmado: boolean };

export function baseDoApp(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL ausente — o e-mail precisa de URL absoluta.");
  }
  return base.replace(/\/+$/, "");
}

/**
 * Todos os usuários do Auth. `listUsers` pagina em 50 por padrão; 200 por
 * página mantém pouca ida e volta sem passar do que o GoTrue aceita. O teto de
 * páginas existe pelo mesmo motivo do `maxPaginas` de lerPaginado: uma varredura
 * sem filtro não pode virar loop infinito segurando o request.
 */
async function listarUsuarios(): Promise<Usuario[]> {
  const admin = createAdminClient();
  const porPagina = 200;
  const usuarios: Usuario[] = [];

  for (let pagina = 1; pagina <= 60; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: porPagina });
    if (error) throw new Error(`Falha ao listar contas: ${error.message}`);

    const lote = data?.users ?? [];
    for (const u of lote) {
      if (!u.email) continue;
      usuarios.push({
        id: u.id,
        email: u.email,
        nome: (u.user_metadata?.nome as string | undefined)?.trim() || "",
        confirmado: Boolean(u.email_confirmed_at ?? u.confirmed_at),
      });
    }
    if (lote.length < porPagina) break;
  }
  return usuarios;
}

/** `nome` do profile é melhor que o do metadata: é o que o aluno editou. */
async function lerProfiles(): Promise<Map<string, { nome: string; aceita: boolean }>> {
  const admin = createAdminClient();
  const linhas = await lerPaginado<{ id: string; nome: string | null; aceita_emails: boolean | null }>(
    () => admin.from("profiles").select("id, nome, aceita_emails"),
  );

  const mapa = new Map<string, { nome: string; aceita: boolean }>();
  for (const l of linhas) {
    // `aceita_emails` só é false quando o aluno pediu pra sair. null (linha
    // criada antes da migração) conta como aceite, igual ao default da coluna.
    mapa.set(l.id, { nome: (l.nome ?? "").trim(), aceita: l.aceita_emails !== false });
  }
  return mapa;
}

async function lerEnvios(campanha: string): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const linhas = await lerPaginado<{ user_id: string; status: string }>(() =>
    admin.from("email_campanha_envios").select("user_id, status").eq("campanha", campanha),
  );

  const mapa = new Map<string, string>();
  for (const l of linhas) mapa.set(l.user_id, l.status);
  return mapa;
}

type Contexto = {
  usuarios: Usuario[];
  profiles: Map<string, { nome: string; aceita: boolean }>;
  envios: Map<string, string>;
};

async function carregarContexto(campanha: string): Promise<Contexto> {
  const [usuarios, profiles, envios] = await Promise.all([
    listarUsuarios(),
    lerProfiles(),
    lerEnvios(campanha),
  ]);
  return { usuarios, profiles, envios };
}

/**
 * Quem ainda deve receber. Um aluno entra na fila quando: tem e-mail, confirmou
 * a conta (a não ser que o disparo peça o contrário), não pediu pra sair e
 * ainda não tem linha nesta campanha — inclusive as 'enviando' e 'erro', que
 * ocupam vaga de propósito (ver o item 3 do topo).
 */
function filaDe(ctx: Contexto, incluirNaoConfirmados: boolean): Usuario[] {
  return ctx.usuarios.filter((u) => {
    if (!incluirNaoConfirmados && !u.confirmado) return false;
    if (ctx.profiles.get(u.id)?.aceita === false) return false;
    return !ctx.envios.has(u.id);
  });
}

function nomeDe(ctx: Contexto, u: Usuario): string {
  return ctx.profiles.get(u.id)?.nome || u.nome || "";
}

function tetoDoLote(creditos: number | null, restantes: number): number {
  const porCredito = creditos === null ? LOTE_MAX : Math.max(0, creditos - RESERVA_TRANSACIONAL);
  return Math.max(0, Math.min(LOTE_MAX, restantes, porCredito));
}

export async function resumoCampanha(
  campanha: string,
  incluirNaoConfirmados: boolean,
): Promise<ResumoCampanha> {
  const [ctx, creditos] = await Promise.all([carregarContexto(campanha), creditosBrevo()]);

  let enviados = 0;
  let falhas = 0;
  let emCurso = 0;
  for (const status of ctx.envios.values()) {
    if (status === "enviado") enviados++;
    else if (status === "erro") falhas++;
    else emCurso++;
  }

  const naoConfirmadas = ctx.usuarios.filter((u) => !u.confirmado).length;
  const optOut = ctx.usuarios.filter((u) => ctx.profiles.get(u.id)?.aceita === false).length;
  const restantes = filaDe(ctx, incluirNaoConfirmados).length;
  const elegiveis = ctx.usuarios.filter(
    (u) =>
      (incluirNaoConfirmados || u.confirmado) && ctx.profiles.get(u.id)?.aceita !== false,
  ).length;

  return {
    contas: ctx.usuarios.length,
    naoConfirmadas,
    optOut,
    enviados,
    falhas,
    emCurso,
    elegiveis,
    restantes,
    creditos,
    tetoDoLote: tetoDoLote(creditos, restantes),
  };
}

export type ResultadoLote = {
  enviados: number;
  falhas: number;
  /** Vaga perdida pra outra aba/rodada (violação do índice único). */
  pulados: number;
  restantes: number;
  /** Primeiros erros, pra tela mostrar o motivo em vez de só um número. */
  erros: string[];
  creditos: number | null;
};

export async function enviarLoteCampanha(opcoes: {
  campanha: string;
  conteudo: ConteudoCampanha;
  link: string;
  incluirNaoConfirmados: boolean;
  limite: number;
}): Promise<ResultadoLote> {
  const admin = createAdminClient();
  const base = baseDoApp();

  const [ctx, creditos] = await Promise.all([carregarContexto(opcoes.campanha), creditosBrevo()]);
  const fila = filaDe(ctx, opcoes.incluirNaoConfirmados);
  const teto = Math.min(
    Math.max(0, Math.trunc(opcoes.limite)),
    tetoDoLote(creditos, fila.length),
  );
  const alvos = fila.slice(0, teto);

  let enviados = 0;
  let falhas = 0;
  let pulados = 0;
  const erros: string[] = [];

  async function despachar(u: Usuario) {
    // 1. Reserva a vaga. O índice único (campanha, user_id) é quem decide:
    //    se outra rodada chegou antes, o insert falha com 23505 e a gente sai
    //    sem enviar, em vez de mandar duplicado.
    const { error: erroReserva } = await admin
      .from("email_campanha_envios")
      .insert({ campanha: opcoes.campanha, user_id: u.id, email: u.email, status: "enviando" });

    if (erroReserva) {
      if ((erroReserva as { code?: string }).code === "23505") {
        pulados++;
        return;
      }
      falhas++;
      if (erros.length < 5) erros.push(`${u.email}: ${erroReserva.message}`);
      return;
    }

    // 2. Envia.
    const descadastro = linkDescadastro(base, u.id);
    const { assunto, html, texto } = montarEmailCampanha({
      conteudo: opcoes.conteudo,
      nome: nomeDe(ctx, u),
      link: opcoes.link,
      linkDescadastro: descadastro,
    });

    const envio = await enviarEmail({
      para: u.email,
      nomePara: nomeDe(ctx, u) || undefined,
      assunto,
      html,
      texto,
      cabecalhos: {
        // O "Cancelar inscrição" nativo do Gmail. Vale mais que o link do
        // rodapé: é o botão que a pessoa aperta em vez de "marcar como spam",
        // e é spam que queima o remetente que entrega a confirmação de conta.
        "List-Unsubscribe": `<${descadastro}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    // 3. Fecha a linha com o resultado.
    await admin
      .from("email_campanha_envios")
      .update({
        status: envio.ok ? "enviado" : "erro",
        erro: envio.ok ? null : envio.erro.slice(0, 500),
        atualizado_em: new Date().toISOString(),
      })
      .eq("campanha", opcoes.campanha)
      .eq("user_id", u.id);

    if (envio.ok) {
      enviados++;
    } else {
      falhas++;
      if (erros.length < 5) erros.push(`${u.email}: ${envio.erro}`);
    }
  }

  for (let i = 0; i < alvos.length; i += PARALELO) {
    await Promise.all(alvos.slice(i, i + PARALELO).map(despachar));
  }

  return {
    enviados,
    falhas,
    pulados,
    restantes: fila.length - enviados - pulados - falhas,
    erros,
    creditos,
  };
}

/**
 * Manda UMA cópia pra um endereço qualquer, sem tocar no registro da campanha.
 * É o passo que impede o disparo de virar arrependimento: erro de texto só
 * aparece de verdade dentro do cliente de e-mail, não no preview.
 */
export async function enviarTesteCampanha(opcoes: {
  para: string;
  conteudo: ConteudoCampanha;
  link: string;
  /** Id de quem está testando — assina um descadastro real e clicável. */
  userId: string;
}): Promise<{ ok: true } | { ok: false; erro: string }> {
  const base = baseDoApp();
  const descadastro = linkDescadastro(base, opcoes.userId);
  const { assunto, html, texto } = montarEmailCampanha({
    conteudo: opcoes.conteudo,
    nome: "",
    link: opcoes.link,
    linkDescadastro: descadastro,
  });

  const envio = await enviarEmail({
    para: opcoes.para,
    assunto: `[TESTE] ${assunto}`,
    html,
    texto,
    cabecalhos: {
      "List-Unsubscribe": `<${descadastro}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  return envio.ok ? { ok: true } : { ok: false, erro: envio.erro };
}

/** Devolve as falhas pra fila apagando as linhas 'erro'. As 'enviado' e
 *  'enviando' ficam — só o que sabidamente não saiu pode ser retentado. */
export async function limparFalhasCampanha(campanha: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_campanha_envios")
    .delete()
    .eq("campanha", campanha)
    .eq("status", "erro")
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/** Marca um HTML de preview sem enviar nada — a tela renderiza num iframe. */
export function previaCampanha(conteudo: ConteudoCampanha, link: string, nome: string): string {
  return montarEmailCampanha({
    conteudo,
    nome,
    link,
    linkDescadastro: "#previa",
  }).html;
}
