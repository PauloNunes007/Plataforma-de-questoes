 # Publicar a Questly (Vercel + Supabase + Mercado Pago)

Guia passo a passo pra colocar o app no ar de graça e mandar pros amigos.
Ordem importa: **1) banco → 2) deploy → 3) pagamento → 4) email**.

> ⚠️ O passo **4) email é obrigatório antes de divulgar o link**. Sem ele, o
> Supabase manda no máximo **2 emails por hora** — e só para endereços da sua
> própria equipe. Na prática: nenhum aluno consegue confirmar a conta.

---

## 1) Banco (Supabase) — rodar as migrations que faltam

No **SQL Editor** do seu projeto Supabase, rode **nesta ordem** (são idempotentes,
pode rodar de novo sem medo). Só precisa rodar as que você ainda não rodou:

1. `supabase_plano_pro.sql` — cria o plano Pro (colunas em `profiles`, tabela
   `assinaturas`, e já te dá Pro vitalício na conta admin).
2. **`supabase_seguranca_hardening.sql`** ⚠️ **NOVO e OBRIGATÓRIO antes de publicar.**
   Fecha o furo em que qualquer aluno virava Pro de graça (e inflava o ranking)
   escrevendo direto no banco pelo console do navegador. Trava as colunas de
   plano/XP/liga, restringe a escrita de questões ao admin e estreita as
   assinaturas.

> Depois de rodar a #2, o ganho de XP, a virada de semana da liga e a ativação
> do Pro passam a depender da **service_role key** no servidor (próximo passo).
> Sem ela, essas ações falham silenciosamente.

---

## 2) Deploy no Vercel

1. Suba o código pro GitHub (se ainda não está): crie um repositório e dê push.
2. Entre em **vercel.com**, faça login com o GitHub e clique **Add New → Project**.
3. Selecione o repositório. Em **Root Directory**, escolha **`web`** (o Next.js
   está na subpasta `web/`, não na raiz).
4. Em **Environment Variables**, adicione (valores em `web/.env.example`):

   | Variável | Onde pegar | Segredo? |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | não |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → anon/publishable | não |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → **service_role (secret)** | **SIM** |
   | `MP_ACCESS_TOKEN` | Mercado Pago (passo 3) | **SIM** |
   | `MP_WEBHOOK_SECRET` | Mercado Pago (passo 3) | **SIM** |
   | `NEXT_PUBLIC_APP_URL` | a URL do próprio deploy, ex. `https://questly.vercel.app` (sem `/` no fim) | não |
   | `BREVO_API_KEY` | Brevo (passo 4) | **SIM** |
   | `EMAIL_REMETENTE` | o endereço verificado na Brevo (passo 4) | não |
   | `EMAIL_REMETENTE_NOME` | nome que aparece como remetente, ex. `Questly` | não |
   | `SEND_EMAIL_HOOK_SECRET` | Supabase → Authentication → Hooks (passo 4) | **SIM** |

   > `NEXT_PUBLIC_APP_URL` você só sabe depois do primeiro deploy. Faça o deploy,
   > copie a URL que o Vercel deu, coloque na variável e **faça um redeploy**.

5. Clique **Deploy**. Pronto — a URL `https://...vercel.app` é o que você manda
   pros amigos.

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` também é usada no BUILD.** A landing (`/`) é
> pré-renderizada com as contagens reais do banco (`lib/landing/stats.ts`) — a
> policy de `questions` só libera leitura pra autenticado, então a chave anônima
> traria zero. Sem a variável no ambiente de build, a página **não quebra**
> (cai num piso conservador), mas os números ficam desatualizados. Ela é
> revalidada de hora em hora (`export const revalidate = 3600`).

> 📣 **Antes de divulgar o link**, confira que estes três respondem 200 no
> domínio publicado: `/robots.txt`, `/sitemap.xml` e `/opengraph-image`. Eles são
> pedidos **sem sessão** (crawler do Google, bot do WhatsApp) e por isso estão
> isentos do guard em `src/proxy.ts` (`ARQUIVOS_PUBLICOS`). Se algum devolver
> 307, o link colado no grupo da turma aparece sem título e sem imagem.

### Campanha de lançamento (UFF)

O recorte editorial da landing mora em **`src/lib/landing/campanha.ts`**. Quando
a prova de Física passar, edite lá (ou ponha `ativa: false`) e a fita do topo, a
seção dedicada, o selo do hero, o painel do /login e o FAQ voltam sozinhos ao
discurso geral — nenhum JSX precisa ser tocado. Os números NÃO ficam nesse
arquivo: vêm do banco em tempo real.

> Sem `MP_ACCESS_TOKEN` o app **funciona igual**, só que o botão "Assinar" cai no
> fluxo manual (registra a intenção e você confirma em `/admin/assinaturas`).
> Nenhum dado seu aparece em nenhum dos dois casos.

---

## 3) Pagamento (Mercado Pago) — cartão de crédito sem expor sua conta

1. Crie uma conta em **mercadopago.com.br** (grátis).
2. Vá em **Seu negócio → Configurações → Credenciais → Credenciais de produção**.
   Copie o **Access Token** de produção → é o `MP_ACCESS_TOKEN` no Vercel.
3. Configure o **Webhook**: painel do Mercado Pago → **Webhooks / Notificações**,
   adicione a URL:
   ```
   https://SUA-URL.vercel.app/api/mercadopago/webhook
   ```
   marque o evento **Pagamentos** (`payment`). Copie a **assinatura secreta**
   que ele gerar → é o `MP_WEBHOOK_SECRET` no Vercel.
4. Redeploy no Vercel pra pegar as variáveis novas.

**Como fica pro aluno:** clica em "Assinar" → vai pro checkout do Mercado Pago
(cartão de crédito, Pix, etc.) → paga → o Pro é liberado **automaticamente**,
sem ninguém aprovar nada. O dinheiro cai na sua conta MP e **nenhum dado seu
(CPF, chave Pix, nome) aparece** pro pagante.

**São dois caminhos independentes até a mesma ativação** (idempotente — rodar os
dois não cobra nem libera duas vezes):

1. **Webhook** — o MP avisa `/api/mercadopago/webhook` assim que aprova. É o
   caminho rápido, e o único que funciona com o aluno de aba fechada.
2. **Conferência da tela `/pro`** — quando o aluno volta do checkout, a página
   pergunta o status direto pra API do MP antes de renderizar e, enquanto estiver
   "processando", fica checando a cada poucos segundos (`conferirPagamentoAction`
   em `src/lib/plano/actions.ts`). É a rede de segurança: funciona mesmo com o
   webhook mal configurado, bloqueado ou atrasado.

Por isso o passo 3 do webhook acima **não pode travar uma venda** se sair errado
— mas configure assim mesmo, é ele que cobre quem paga e fecha a aba.

> **Como saber se está tudo de pé:** abra `/admin/assinaturas` logado como admin.
> Se faltar `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_APP_URL` (https) ou
> `MP_WEBHOOK_SECRET`, aparece uma tarja laranja dizendo exatamente o quê — e a
> URL do webhook pra colar no painel do MP. Sem tarja, está completo.
>
> Cada pedido pendente tem **"Conferir no MP"**: pergunta pro Mercado Pago e
> ativa na hora se estiver aprovado. "Ativar à mão" continua existindo, mas é
> contingência (pagamento recebido por fora) e pede confirmação.

> Enquanto quiser testar sem cobrar de verdade, use as **credenciais de teste**
> do Mercado Pago em vez das de produção (cartões de teste na doc deles).

---

## 4) Email de confirmação (Brevo) — sem limite de 2/hora

**Por que é obrigatório:** o serviço de email embutido do Supabase é de teste.
Ele manda **2 emails por hora no projeto inteiro** e **só entrega para endereços
da equipe do projeto**. Com aluno de verdade se cadastrando, ninguém recebe nada
e a conta nunca é confirmada.

A solução aqui **não é trocar o SMTP do Supabase**: é tirar o envio da mão dele.
Com o **Send Email Hook** ligado, o Supabase para de mandar email e chama a nossa
rota `/api/auth/email-hook`, que entrega pela Brevo com o template da Questly
(código de 6 dígitos + botão). O token continua sendo do Supabase — nós somos só
o carteiro. Custo: **R$ 0,00** (Brevo grátis = 300 emails/dia, sem cartão).

### 4.1) Conta na Brevo

1. Crie uma conta em **brevo.com** (grátis, sem cartão).
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: cadastre o
   endereço que vai aparecer como remetente e **confirme pelo email** que a
   Brevo manda. Sem domínio próprio, pode ser seu email pessoal mesmo.
3. **SMTP & API → API Keys → Generate a new API key**. Copie — ela só aparece
   uma vez. É o `BREVO_API_KEY`.
4. No Vercel, preencha `BREVO_API_KEY`, `EMAIL_REMETENTE` (o endereço do passo 2)
   e `EMAIL_REMETENTE_NOME`.

> 📬 **Entregabilidade sem domínio próprio — leia antes de divulgar.** Mandando
> de um `@gmail.com` pelos servidores da Brevo, o SPF do gmail.com não autoriza
> a Brevo e o DKIM é assinado por ela, não pelo gmail.com: nenhum dos dois
> alinha com o domínio do remetente, e a política DMARC do próprio gmail.com
> manda quarentenar. Na prática, **para destinatários no Gmail o email cai em
> spam de forma consistente** — não é "uma parte". Verificado em 2026-09-10.
>
> Nenhum ajuste de assunto, conteúdo ou template resolve (o nosso já é o
> formato mais seguro possível: tabela, sem imagem, com versão texto). A única
> correção real é domínio próprio (`.com.br` ~R$40/ano no registro.br),
> autenticado na Brevo com 3 registros DNS; depois muda só o `EMAIL_REMETENTE`
> — **nenhum código muda**. Enquanto isso não existe, conte com o aviso "olhe
> a caixa de spam" que já está na tela de verificação.

### 4.2) Ligar o hook no Supabase

1. Supabase → **Authentication → Hooks → Send Email Hook** → **Enable**.
2. Tipo: **HTTPS**. URL:
   ```
   https://SUA-URL.vercel.app/api/auth/email-hook
   ```
3. O Supabase gera um **secret** (`v1,whsec_...`). Copie o valor **inteiro,
   com o prefixo** → é o `SEND_EMAIL_HOOK_SECRET` no Vercel.
4. **Redeploy** no Vercel pra pegar as variáveis novas.

### 4.3) Soltar o limite e apertar o código

Ainda no Supabase:

- **Authentication → Rate Limits → "Emails sent per hour"**: com o hook ligado
  esse número vira configurável. Suba pra algo folgado, mas **não infinito** —
  ele é o que impede alguém de queimar seus 300 emails/dia da Brevo num script.
  `100/hora` é um começo sensato.
- **Authentication → Providers → Email → Email OTP Expiration**: baixe de
  86400s (24h) para **3600s (1 hora)**. O código de 6 dígitos tem 1 milhão de
  combinações e o `/verify` do Supabase aceita 30 tentativas por IP a cada 5
  min; encurtar a validade reduz a janela de chute.

> ⚠️ **Não mexa no "Email OTP Length".** A tela de verificação renderiza um
> número fixo de casas (`DIGITOS` em `components/auth/verificar-email-form.tsx`,
> hoje **6**) e o servidor valida o mesmo tamanho em `verificarCodigoAction`.
> Subir pra 8 no painel faz chegar um código que **não cabe no formulário** —
> e nada acusa erro, o aluno só não consegue digitar. Se um dia quiser 8, mude
> os dois lados juntos.

### 4.4) Testar

Crie uma conta com um email seu que **não** seja o da equipe do Supabase (o ponto
é justamente provar que passou a chegar em qualquer endereço). Você deve cair em
`/verificar-email`, receber o email com o código e entrar digitando os 6 dígitos
— **ou** clicando no botão, inclusive de outro aparelho.

Se der erro no cadastro, o log da rota no Vercel (**Deployments → Functions →
`/api/auth/email-hook`**) diz exatamente o quê: `401` = secret errado,
`Brevo respondeu 401` = API key errada, `Brevo respondeu 400` = remetente não
verificado.

### 4.5) Se "não chega email" e NADA acusa erro

Duas armadilhas fazem o fluxo falhar em silêncio — o Supabase devolve 200, a
tela diz "confira seu email", e nada chega. Já custaram uma sessão inteira de
debug; confira as duas antes de procurar em outro lugar.

**a) O rate limit barra ANTES do hook.** Com "Emails sent per hour" ainda no
padrão (2), o Supabase rejeita com `429 over_email_send_rate_limit` sem sequer
chamar o hook — então **nenhuma requisição aparece nos logs do Vercel**, o que
é indistinguível de "hook não configurado". Meia dúzia de testes de cadastro já
queima a cota. É o passo 4.3; faça-o antes de testar.

**b) A Brevo aceita e recusa depois.** Com o remetente não verificado, a API da
Brevo devolve **2xx na hora** e só rejeita **assincronamente**
(`Sending has been rejected because the sender you used ... is not valid`).
Como `enviarEmail` só enxerga o 2xx, a rota responde 200 e a "falha fechada"
não cobre esse caso. Sintoma lateral: o widget "300 restantes de 300" da Brevo
não desce, porque nada foi enviado de fato.

**Diagnóstico que não depende de painel.** Ponha `BREVO_API_KEY` no
`web/.env.local` (já é gitignored) e consulte a API direto:

```bash
# Quais remetentes existem e se estão realmente verificados (active)
curl -s -H "api-key: $BREVO_API_KEY" https://api.brevo.com/v3/senders

# Todo envio tentado nas últimas 24h: requests / delivered / error + motivo
curl -s -H "api-key: $BREVO_API_KEY" \
  "https://api.brevo.com/v3/smtp/statistics/events?days=1&limit=30"
```

Essa segunda chamada é a fonte da verdade — tempo real, ao contrário do widget
de uso do plano. `delivered` significa que chegou; `error` traz o motivo em
texto claro.

Um POST sem assinatura em `/api/auth/email-hook` também é um teste útil: `401`
prova que o `SEND_EMAIL_HOOK_SECRET` está presente no Vercel (se faltasse,
seria `500` com "Hook de email não configurado no servidor").

---

## Notas de segurança (o que foi endurecido)

- **Auto-concessão de Pro / inflar ranking:** bloqueado por trigger no banco —
  as colunas de plano/XP/liga só mudam via `service_role` (servidor) ou admin.
- **Vandalismo do banco de questões:** escrever/editar `questions`/`materias`/
  `topicos` agora é só do admin. O importador (`/importar`) também virou rota de
  admin.
- **Assinaturas:** o aluno só cria pendente e só cancela — não consegue se
  marcar "ativa".
- **Admin:** toda Server Action de admin revalida o e-mail no servidor (a UI
  esconder o link não basta); a rota `/importar` e as `/admin/*` são gateadas.
- **Webhook:** valida a assinatura HMAC do Mercado Pago **e** re-consulta o
  pagamento na API do MP — uma notificação forjada não consegue simular um
  "aprovado".
- O seu CPF/chave Pix saiu do código (não vai mais no bundle do navegador).
