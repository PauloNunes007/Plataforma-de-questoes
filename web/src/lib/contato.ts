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
// Este aqui é o oposto: existe justamente pra alguém escrever DE VOLTA. Por um
// tempo apontou pro e-mail pessoal do dono, porque `contato@expectrum.com.br`
// não tinha caixa de entrada de verdade por trás (só o registro DNS que
// autoriza a Brevo a ENVIAR em nome do domínio) — agora tem, então volta a ser
// este o endereço público.
export const EMAIL_CONTATO = "contato@expectrum.com.br";
