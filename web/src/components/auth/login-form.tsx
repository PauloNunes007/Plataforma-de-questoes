"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
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
    icon: "🎯",
    title: "Missão do dia pronta",
    desc: "Você nunca decide sozinho o que estudar",
  },
  {
    icon: "🗡️",
    title: "Boss por prova",
    desc: "Progresso calculado pelos assuntos cobrados",
  },
  {
    icon: "📊",
    title: "Chance de aprovação",
    desc: "Atualizada conforme você estuda",
  },
];

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
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:grid-cols-2"
    >
      <div className="p-8 sm:p-11">
        <Logo className="mb-6" />

        <Tabs defaultValue="signin">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <h2 className="mb-1 font-heading text-xl font-semibold">
              Bem-vindo de volta
            </h2>
            <p className="mb-6 text-sm font-semibold text-muted-foreground">
              Entre pra continuar sua campanha.
            </p>

            <form action={signInFormAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signin-senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="signin-senha"
                    name="senha"
                    type={showSignInPw ? "text" : "password"}
                    placeholder="Sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-questly-blue-dark"
                  >
                    {showSignInPw ? "ocultar" : "mostrar"}
                  </button>
                </div>
              </div>

              {signInState?.error && (
                <p className="rounded-lg bg-questly-red-light px-3 py-2 text-sm font-semibold text-questly-red-dark">
                  {signInState.error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={signInPending}>
                {signInPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <h2 className="mb-1 font-heading text-xl font-semibold">
              Comece sua campanha
            </h2>
            <p className="mb-6 text-sm font-semibold text-muted-foreground">
              Leva 2 minutos. Depois é só configurar suas disciplinas.
            </p>

            <form action={signUpFormAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-nome">Nome</Label>
                <Input
                  id="signup-nome"
                  name="nome"
                  placeholder="Como podemos te chamar"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="signup-senha"
                    name="senha"
                    type={showSignUpPw ? "text" : "password"}
                    placeholder="Crie uma senha"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-questly-blue-dark"
                  >
                    {showSignUpPw ? "ocultar" : "mostrar"}
                  </button>
                </div>
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

              <Button type="submit" className="w-full" disabled={signUpPending}>
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

      <div className="hidden flex-col justify-center gap-8 bg-questly-green p-10 text-white md:flex">
        <div>
          <h3 className="mb-1 font-heading text-xl font-semibold">
            O que te espera depois de entrar
          </h3>
          <p className="text-sm font-semibold text-white/90">
            Sua campanha é montada em cima da sua meta de nota.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-base">
                {perk.icon}
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
          ))}
        </div>
      </div>
    </motion.div>
  );
}
