import type { Metadata } from "next";
import { carregarDadosImportadorAction } from "@/lib/importar/actions";
import { Importador } from "@/components/importar/importador";

export const metadata: Metadata = {
  title: "Questly — Importar questões",
};

export default async function ImportarPage() {
  const { materias, topicos, enunciadosExistentes } = await carregarDadosImportadorAction();

  return (
    <Importador materiasIniciais={materias} topicosIniciais={topicos} enunciadosIniciais={enunciadosExistentes} />
  );
}
