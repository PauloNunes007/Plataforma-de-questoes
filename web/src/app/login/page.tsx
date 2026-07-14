import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Questly — Entrar ou criar conta",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background px-5 py-8">
      {/* glows na mesma linguagem visual da landing — profundidade sem poluir */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-questly-green/20 blur-[120px]" />
        <div className="absolute top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-questly-purple/15 blur-[120px]" />
        <div className="absolute top-[90%] left-1/3 h-[28rem] w-[28rem] rounded-full bg-questly-blue/10 blur-[120px]" />
      </div>

      <Link href="/" className="relative z-10 self-start">
        <Logo />
      </Link>

      <div className="relative z-10 flex flex-1 items-center justify-center py-6">
        <LoginForm />
      </div>
    </main>
  );
}
