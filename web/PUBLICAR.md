# Publicar a Questly (Vercel + Supabase + Mercado Pago)

Guia passo a passo pra colocar o app no ar de graça e mandar pros amigos.
Ordem importa: **1) banco → 2) deploy → 3) pagamento**.

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

   > `NEXT_PUBLIC_APP_URL` você só sabe depois do primeiro deploy. Faça o deploy,
   > copie a URL que o Vercel deu, coloque na variável e **faça um redeploy**.

5. Clique **Deploy**. Pronto — a URL `https://...vercel.app` é o que você manda
   pros amigos.

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
(cartão de crédito, Pix, etc.) → paga → o Mercado Pago avisa nosso webhook → o
Pro é liberado **automaticamente**. O dinheiro cai na sua conta MP e **nenhum
dado seu (CPF, chave Pix, nome) aparece** pro pagante.

> Enquanto quiser testar sem cobrar de verdade, use as **credenciais de teste**
> do Mercado Pago em vez das de produção (cartões de teste na doc deles).

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
