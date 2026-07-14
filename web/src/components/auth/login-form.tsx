"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  User,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  signInAction,
  signUpAction,
  type AuthFormState,
} from "@/lib/auth/actions";

const initialState: AuthFormState = null;

const CORES_FORCA = ["bg-questly-red", "bg-questly-orange", "bg-questly-green"];

function calcularForca(senha: string) {
  let score = 0;
  if (senha.length >= 8) score++;
  if (/[A-Z]/.test(senha) && /[0-9]/.test(senha)) score++;
  if (senha.length >= 12 || /[^A-Za-z0-9]/.test(senha)) score++;
  return score;
}

const PERKS = [
  {
    icon: Target,
    title: "Missão do dia pronta",
    desc: "Você nunca decide sozinho o que estudar",
  },
  {
    icon: Swords,
    title: "Boss por prova",
    desc: "Progresso calculado pelos assuntos cobrados",
  },
  {
    icon: Sparkles,
    title: "Chance de aprovação",
    desc: "Atualizada conforme você estuda",
  },
];

/** Ícone à esquerda dentro de um Input — wrapper compartilhado pelos campos
 *  de email/nome/senha, no mesmo espírito de ícone-em-input da landing. */
function CampoComIcone({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
      />
      {children}
    </div>
  );
}

function BotaoMostrarSenha({
  mostrar,
  onClick,
}: {
  mostrar: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
    >
      {mostrar ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
    </button>
  );
}

export function LoginForm() {
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialState,
  );
  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpAction,
    initialState,
  );
  const [showSignInPw, setShowSignInPw] = useState(false);
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [senha, setSenha] = useState("");
  const forca = calcularForca(senha);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="surface grid w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl shadow-black/5 md:grid-cols-2 dark:shadow-black/30"
    >
      <div className="p-8 sm:p-11">
        <span className="inline-flex items-center gap-2 rounded-full border border-questly-green/30 bg-questly-green/10 px-3 py-1 text-xs font-medium text-questly-green-dark dark:text-questly-green">
          <Sparkles className="size-3.5" />
          O copiloto da sua aprovação
        </span>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl p-1">
            <TabsTrigger value="signin" className="rounded-lg text-[13.5px] font-semibold">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg text-[13.5px] font-semibold">
              Criar conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <h2 className="mb-1 font-heading text-xl font-semibold tracking-tight">
              Bem-vindo de volta
            </h2>
            <p className="mb-6 text-sm font-semibold text-muted-foreground">
              Entre pra continuar sua campanha.
            </p>

            <form action={signInFormAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email">Email</Label>
                <CampoComIcone icon={Mail}>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    required
                    className="h-11 pl-10"
                  />
                </CampoComIcone>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signin-senha">Senha</Label>
                <CampoComIcone icon={Lock}>
                  <Input
                    id="signin-senha"
                    name="senha"
                    type={showSignInPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    required
                    className="h-11 pr-10 pl-10"
                  />
                  <BotaoMostrarSenha
                    mostrar={showSignInPw}
                    onClick={() => setShowSignInPw((v) => !v)}
                  />
                </CampoComIcone>
              </div>

              {signInState?.error && (
                <p className="rounded-lg bg-questly-red-light px-3 py-2 text-sm font-semibold text-questly-red-dark">
                  {signInState.error}
                </p>
              )}

              <Button type="submit" className="h-12 w-full cursor-pointer text-[15px]" disabled={signInPending}>
                {signInPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <h2 className="mb-1 font-heading text-xl font-semibold tracking-tight">
              Comece sua campanha
            </h2>
            <p className="mb-6 text-sm font-semibold text-muted-foreground">
              Leva 2 minutos. Depois é só configurar suas disciplinas.
            </p>

            <form action={signUpFormAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-nome">Nome</Label>
                <CampoComIcone icon={User}>
                  <Input
                    id="signup-nome"
                    name="nome"
                    autoComplete="name"
                    placeholder="Como podemos te chamar"
                    required
                    className="h-11 pl-10"
                  />
                </CampoComIcone>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <CampoComIcone icon={Mail}>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    required
                    className="h-11 pl-10"
                  />
                </CampoComIcone>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-senha">Senha</Label>
                <CampoComIcone icon={Lock}>
                  <Input
                    id="signup-senha"
                    name="senha"
                    type={showSignUpPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-11 pr-10 pl-10"
                  />
                  <BotaoMostrarSenha
                    mostrar={showSignUpPw}
                    onClick={() => setShowSignUpPw((v) => !v)}
                  />
                </CampoComIcone>
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < forca ? CORES_FORCA[forca - 1] : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                  Mínimo 8 caracteres
                </p>
              </div>

              {signUpState?.error && (
                <p className="rounded-lg bg-questly-red-light px-3 py-2 text-sm font-semibold text-questly-red-dark">
                  {signUpState.error}
                </p>
              )}
              {signUpState?.success && (
                <p className="rounded-lg bg-questly-green-light px-3 py-2 text-sm font-semibold text-questly-green-dark">
                  {signUpState.success}
                </p>
              )}

              <Button type="submit" className="h-12 w-full cursor-pointer text-[15px]" disabled={signUpPending}>
                {signUpPending ? "Criando conta..." : "Criar conta e começar"}
              </Button>
              <p className="text-center text-xs font-semibold text-muted-foreground">
                Ao criar sua conta, você concorda com os Termos de uso e a
                Política de privacidade.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <div className="relative hidden flex-col justify-center gap-8 overflow-hidden bg-gradient-to-br from-questly-green to-questly-green-deep p-10 text-white md:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-[80px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-black/10 blur-[90px]"
        />

        <div className="relative">
          <h3 className="mb-1 font-heading text-xl font-semibold tracking-tight">
            O que te espera depois de entrar
          </h3>
          <p className="text-sm font-semibold text-white/90">
            Sua campanha é montada em cima da sua meta de nota.
          </p>
        </div>
        <div className="relative flex flex-col gap-4">
          {PERKS.map((perk) => {
            const Icon = perk.icon;
            return (
              <div key={perk.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon size={17} strokeWidth={1.75} />
                </div>
                <div>
                  <b className="block font-heading text-sm font-semibold">
                    {perk.title}
                  </b>
                  <span className="block text-xs font-semibold text-white/85">
                    {perk.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mt-auto flex items-center gap-2 text-xs font-semibold text-white/85">
          <ShieldCheck className="size-4" />
          Grátis pra começar · sem cartão de crédito
        </div>
      </div>
    </motion.div>
  );
}
