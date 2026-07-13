// Não existe coluna de "role"/admin no banco ainda (ver nota em
// supabase_conteudo_compartilhado.sql) — o e-mail é a única forma
// disponível hoje de restringir a tela de edição total de questões
// (/admin/questoes) a uma única conta, sem criar um conceito novo de papel
// pra um caso de uso de uma pessoa só.
export const ADMIN_EMAIL = "paulocresponunes@gmail.com";

export function ehAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
