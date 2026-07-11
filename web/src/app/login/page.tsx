import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Questly — Entrar ou criar conta",
};

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 py-12"
      style={{
        background:
          "radial-gradient(circle at 12% 15%, var(--questly-green-light) 0%, transparent 45%), radial-gradient(circle at 88% 85%, var(--questly-blue-light) 0%, transparent 45%), var(--muted)",
      }}
    >
      <LoginForm />
    </main>
  );
}
