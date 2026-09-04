# Monta o JSON final (formato do importador do Questly) a partir dos arquivos
# autorados por capitulo em authored/chNN.json. As questoes sao ORIGINAIS
# (cenarios, numeros, enunciado e resolucao proprios), organizadas pela mesma
# taxonomia de topicos de um curso de Fisica universitaria. Cada item traz seu
# proprio capitulo ("ch"); o mapa abaixo converte ch -> (materia, topico).
# Saida: questoes_questly.json (array pronto pro /importar).
import io, json, os, glob

CH_MAP = {
    1:  ("Fisica I",  "Conceitos de Movimento"),
    2:  ("Fisica I",  "Cinematica em Uma Dimensao"),
    3:  ("Fisica I",  "Vetores e Sistemas de Coordenadas"),
    4:  ("Fisica I",  "Cinematica em Duas Dimensoes"),
    5:  ("Fisica I",  "Forca e Movimento"),
    6:  ("Fisica I",  "Dinamica I: Movimento em Linha Reta"),
    7:  ("Fisica I",  "Terceira Lei de Newton"),
    8:  ("Fisica I",  "Dinamica II: Movimento no Plano"),
    9:  ("Fisica I",  "Impulso e Quantidade de Movimento"),
    10: ("Fisica I",  "Energia"),
    11: ("Fisica I",  "Trabalho"),
    12: ("Fisica I",  "Rotacao de um Corpo Rigido"),
    13: ("Fisica I",  "Gravitacao"),
    14: ("Fisica I",  "Oscilacoes"),
    15: ("Fisica I",  "Fluidos e Elasticidade"),
    16: ("Fisica II", "Descricao Macroscopica da Materia"),
    18: ("Fisica II", "Conexao Micro/Macro"),
    19: ("Fisica II", "Maquinas Termicas e Refrigeradores"),
    20: ("Fisica II", "Ondas Progressivas"),
    21: ("Fisica II", "Superposicao de Ondas"),
    22: ("Fisica II", "Optica Ondulatoria"),
    23: ("Fisica II", "Optica Geometrica"),
    24: ("Fisica II", "Instrumentos Opticos"),
    25: ("Fisica III","Cargas e Forcas Eletricas"),
    26: ("Fisica III","Campo Eletrico"),
    27: ("Fisica III","Lei de Gauss"),
    28: ("Fisica III","Potencial Eletrico"),
    29: ("Fisica III","Potencial e Campo"),
    30: ("Fisica III","Corrente e Resistencia"),
    31: ("Fisica III","Fundamentos de Circuitos"),
    32: ("Fisica III","Campo Magnetico"),
    33: ("Fisica III","Inducao Eletromagnetica"),
    34: ("Fisica III","Campos e Ondas Eletromagneticas"),
    35: ("Fisica III","Circuitos de Corrente Alternada"),
    36: ("Fisica IV", "Relatividade"),
    37: ("Fisica IV", "Fundamentos da Fisica Moderna"),
    38: ("Fisica IV", "Quantizacao"),
    39: ("Fisica IV", "Funcoes de Onda e Incerteza"),
    40: ("Fisica IV", "Mecanica Quantica Unidimensional"),
    41: ("Fisica IV", "Fisica Atomica"),
    42: ("Fisica IV", "Fisica Nuclear"),
}

BASE = os.path.dirname(os.path.abspath(__file__))

# Rede de seguranca: se um builder de capitulo esquecer o prefixo r"..." numa
# string com LaTeX, o Python interpreta \t (\times/\text), \f (\frac) etc. como
# caractere de controle. Nenhum campo aqui contem tab/newline de proposito,
# entao reconvertemos qualquer caractere de controle de volta pra \letra.
_CTRL = {'\t': r'\t', '\n': r'\n', '\r': r'\r', '\f': r'\f', '\b': r'\b', '\x0b': r'\v'}
def _repair(s):
    return ''.join(_CTRL.get(ch, ch) for ch in s) if isinstance(s, str) else s

result = []
for path in sorted(glob.glob(os.path.join(BASE, 'authored', 'ch*.json'))):
    batch = json.load(io.open(path, encoding='utf-8'))
    for a in batch:
        ch = a['ch']
        if ch not in CH_MAP:
            raise SystemExit(f'{path}: capitulo {ch} sem materia/topico no CH_MAP')
        materia, topico = CH_MAP[ch]
        gab = a['gabarito']
        alts = {k: _repair(v) for k, v in a['alternativas'].items()}
        if gab not in alts:
            raise SystemExit(f'{path}: gabarito {gab!r} nao existe nas alternativas de "{a['enunciado'][:40]}..."')
        result.append({
            'materia': materia,
            'topico': topico,
            'subtopico': _repair(a['subtopico']),
            'dificuldade': a.get('dificuldade', 'medio'),
            'instituicao': 'Questly 2026',
            'ano': 2026,
            'enunciado': _repair(a['enunciado']),
            'alternativas': alts,
            'gabarito': gab,
            'imagem_enunciado': False,
            'alternativas_com_imagem': [],
            'resolucao': _repair(a['resolucao']),
        })

json.dump(result, io.open(os.path.join(BASE, 'questoes_questly.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=2)
print(f'{len(result)} questoes escritas em questoes_questly.json')
