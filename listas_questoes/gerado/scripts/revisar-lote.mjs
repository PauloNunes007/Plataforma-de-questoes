#!/usr/bin/env node
/**
 * revisar-lote.mjs — checagem de revisão do supervisor, complementar aos 3
 * validadores (`validar.mjs`, `render-katex.mjs`, `conferir-alternativas.mjs`).
 *
 * Aqueles olham UM arquivo por dentro. Este olha o LOTE e o mundo externo:
 *   1. sanidade estrutural rápida (campos obrigatórios, gabarito órfão)
 *   2. as `imagem_url` realmente respondem 200 no Storage (e não são 0 bytes)
 *   3. placeholders esquecidos no texto ("corrompida", "não recuperável", "TODO")
 *   4. duplicata de enunciado ENTRE arquivos do lote — pega o erro clássico de
 *      um agente transcrever a prova do semestre errado (pastas da UFF misturam
 *      arquivos "02-2025" dentro da pasta de 2024)
 *   5. artefatos de conversão do pandoc que sobraram no texto
 *
 * Uso:
 *   node listas_questoes/gerado/scripts/revisar-lote.mjs                 # todos os fisica2_uff_*.json
 *   node listas_questoes/gerado/scripts/revisar-lote.mjs a.json b.json   # só esses
 *   node listas_questoes/gerado/scripts/revisar-lote.mjs --sem-rede      # pula o check de imagem
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_GERADO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CAMPOS = ['materia', 'topico', 'dificuldade', 'enunciado', 'alternativas', 'gabarito', 'resolucao'];
// atenção: "TODO"/"FIXME" precisam ser case-SENSITIVE — com /i, "TODO" casa com
// a palavra portuguesa "todo(s)", que aparece o tempo todo nas resoluções.
const PLACEHOLDERS = /corrompid|n[ãa]o recuper[áa]vel|placeholder|\[imagem\]|xxxx+|\bTODO\b|\bFIXME\b/;
// `--` sobra de en-dash do Word; `{.mark}`/`{.underline}` são marcação do pandoc
const ARTEFATOS = [
  [/\{\.(mark|underline|smallcaps)\}/, 'marcação do pandoc'],
  [/(^|[^-])--([^->]|$)/, 'duplo hífen (en-dash do Word)'],
  [/\\\[|\\\]/, 'delimitador LaTeX \\[ \\] (usar $$)'],
  [/ /, 'espaço não-quebrável'],
  [/!\[.*\]\(.*media/, 'link de imagem do pandoc no texto'],
];

const args = process.argv.slice(2);
const semRede = args.includes('--sem-rede');
const alvos = args.filter((a) => !a.startsWith('--'));
const arquivos = (alvos.length ? alvos : readdirSync(DIR_GERADO).filter((f) => /^fisica2_uff_.*\.json$/.test(f)))
  .map((f) => (f.endsWith('.json') ? f : `${f}.json`));

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const problemas = [];
const avisos = [];
const vistos = new Map(); // enunciado normalizado -> "arquivo Q#"
const imagens = []; // { url, origem }

for (const arq of arquivos) {
  let questoes;
  try {
    questoes = JSON.parse(readFileSync(join(DIR_GERADO, arq), 'utf8'));
  } catch (e) {
    problemas.push(`${arq}: JSON inválido — ${e.message}`);
    continue;
  }
  if (!Array.isArray(questoes)) {
    problemas.push(`${arq}: raiz não é um array`);
    continue;
  }

  questoes.forEach((q, i) => {
    const onde = `${arq} Q${i + 1}`;

    for (const campo of CAMPOS) {
      if (!q[campo]) problemas.push(`${onde}: campo "${campo}" vazio/ausente`);
    }
    if (q.alternativas && q.alternativas[q.gabarito] === undefined) {
      problemas.push(`${onde}: gabarito "${q.gabarito}" não existe nas alternativas`);
    }

    const textos = [q.enunciado, q.resolucao, ...Object.values(q.alternativas || {})].filter(
      (t) => typeof t === 'string'
    );
    for (const t of textos) {
      if (PLACEHOLDERS.test(t)) {
        problemas.push(`${onde}: placeholder no texto — "${t.slice(0, 70)}"`);
      }
      for (const [re, nome] of ARTEFATOS) {
        if (re.test(t)) avisos.push(`${onde}: ${nome} — "${t.slice(0, 70)}"`);
      }
    }

    // Duplicata entre arquivos (mesmo enunciado em duas provas = arquivo errado).
    // Texto inteiro igual é problema; só o começo igual costuma ser um par de
    // questões que dividem o mesmo enunciado-mãe ("para as questões 5 e 6...",
    // uma figura só, perguntas diferentes) — legítimo, mas vale conferir.
    const inteiro = norm(q.enunciado);
    const prefixo = inteiro.slice(0, 120);
    if (inteiro) {
      const anterior = vistos.get(prefixo);
      if (anterior && anterior.texto === inteiro) {
        problemas.push(`${onde}: enunciado idêntico ao de ${anterior.onde}`);
      } else if (anterior) {
        avisos.push(`${onde}: mesmo início de enunciado que ${anterior.onde} (enunciado-mãe compartilhado? confira que as perguntas diferem)`);
      } else {
        vistos.set(prefixo, { onde, texto: inteiro });
      }
    }

    if (q.imagem_url) imagens.push({ url: q.imagem_url, origem: onde });
    if (q.imagem_enunciado && !q.imagem_url) {
      avisos.push(`${onde}: imagem_enunciado=true sem imagem_url (vai cair na fila de revisão manual)`);
    }
    for (const [letra, url] of Object.entries(q.alternativas_imagens || {})) {
      imagens.push({ url, origem: `${onde} alt ${letra}` });
    }
  });

  console.log(`${arq}: ${questoes.length} questões, ${questoes.filter((q) => q.imagem_url).length} com figura`);
}

if (!semRede && imagens.length) {
  console.log(`\nconferindo ${imagens.length} imagens no Storage...`);
  const lotes = [];
  for (let i = 0; i < imagens.length; i += 8) lotes.push(imagens.slice(i, i + 8));
  for (const lote of lotes) {
    await Promise.all(
      lote.map(async ({ url, origem }) => {
        try {
          const r = await fetch(url, { method: 'HEAD' });
          if (!r.ok) problemas.push(`${origem}: imagem HTTP ${r.status} — ${url}`);
          else if (Number(r.headers.get('content-length')) < 500) {
            problemas.push(`${origem}: imagem suspeita de estar vazia/corrompida (${r.headers.get('content-length')}B) — ${url}`);
          }
        } catch (e) {
          problemas.push(`${origem}: imagem inacessível (${e.message}) — ${url}`);
        }
      })
    );
  }
}

console.log('');
for (const a of avisos) console.log(`aviso: ${a}`);
if (avisos.length) console.log('');

if (problemas.length) {
  for (const p of problemas) console.log(`PROBLEMA: ${p}`);
  console.log(`\n${problemas.length} problema(s) em ${arquivos.length} arquivo(s).`);
  process.exit(1);
}
console.log(`OK — ${arquivos.length} arquivo(s) revisado(s), nenhum problema.`);
