// O endereço de CONTATO HUMANO, pra quando alguém precisa escrever e receber
// resposta (o "Falar com a Expectrum" de /parceria, o "precisa de algo que
// não está aqui" de /pro).
//
// NÃO é o mesmo endereço de `EMAIL_REMETENTE` (lib/email/enviar.ts) — aquele é
// só o remetente dos e-mails transacionais (boas-vindas, confirmação de
// cadastro), autenticado via DKIM/SPF na Brevo, e deliberadamente NÃO precisa
// ser uma caixa de entrada real (ver PUBLICAR.md, seção da autenticação de
// domínio) — ninguém responde um e-mail de boas-vindas.
//
// Este aqui é o oposto: existe justamente pra alguém escrever DE VOLTA. Por
// isso é o e-mail pessoal do dono, não `contato@expectrum.com.br` — esse
// domínio nunca teve uma caixa de entrada de verdade criada nele (só o
// registro DNS que autoriza a Brevo a ENVIAR em nome dele), então qualquer
// resposta de um aluno ou parceiro cairia num buraco sem ninguém do outro
// lado. Quando existir uma caixa de verdade em `@expectrum.com.br` (um alias
// que encaminha pro Gmail, ou uma caixa paga de verdade), troca só aqui.
export const EMAIL_CONTATO = "paulocresponunes@gmail.com";
