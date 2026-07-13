import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { compilarTikz, ENGINES_VALIDOS, type Engine } from "@/lib/importar/tikz-server";

// Route Handler (não Server Action) porque a compilação chama um serviço
// externo e usa mupdf/wasm: precisa do runtime Node explícito e de um
// maxDuration folgado — coisas que se configuram por rota, não por action.
// Só usuários logados podem compilar (mesma superfície de escrita do resto
// do importador).
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  let corpo: { codigo?: string; engine?: string };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const codigo = typeof corpo.codigo === "string" ? corpo.codigo : "";
  if (!codigo.trim()) return NextResponse.json({ erro: "Código TikZ vazio." }, { status: 400 });

  const engine: Engine = ENGINES_VALIDOS.includes(corpo.engine as Engine) ? (corpo.engine as Engine) : "pdflatex";

  const resultado = await compilarTikz(supabase, codigo, engine);
  if ("erro" in resultado) {
    return NextResponse.json({ erro: resultado.erro, log: resultado.log }, { status: 422 });
  }
  return NextResponse.json(resultado);
}
