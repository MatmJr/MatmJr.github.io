"""Gera studies/index.html (português) e studies/en.html (inglês) a partir de
modelo.html e modelo.en.html, embutindo o código real do projeto.

Os modelos ficam nesta pasta (studies/fonte) e não são para abrir no navegador:
têm marcadores @@...@@ no lugar do código.

Antes de embutir, segue o tutorial numa pasta temporária: copia só os módulos
da opção 1, roda cada trecho "Confira" e usa a saída real na página. Se algum
trecho falhar, nada é gerado. Rode de novo sempre que mudar o código:

    python studies/fonte/gerar.py
"""
import html
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

AQUI = pathlib.Path(__file__).resolve().parent  # studies/fonte: modelos
SAIDA = AQUI.parent                               # studies: as páginas geradas
PROJETO = SAIDA.parent
MODULOS = ["tabuleiro", "sorteio", "regras", "simulacao", "indicadores", "risco", "reproducao", "visualizacao"]

TUTORIAL_INIT = '''\
from .indicadores import aglomerados
from .regras import VIZINHANCA_4, VIZINHANCA_8, RegraBTW, RegraTombamento
from .reproducao import ReproducaoEmOndas
from .risco import MonitorDeRisco, Risco
from .simulacao import Avalanche, Simulacao
from .sorteio import Sorteador, SorteioCentro, SorteioUniforme
from .tabuleiro import Posicao, Tabuleiro, TabuleiroHipotetico
from .visualizacao import AnimacaoPilha
'''

TUTORIAL_MAIN = '''\
from pilha_de_areia import (AnimacaoPilha, MonitorDeRisco, RegraBTW, ReproducaoEmOndas,
                            Simulacao, SorteioUniforme, Tabuleiro)


def animacao():
    # aqui só se montam as peças; trocar uma delas não mexe nas outras
    tabuleiro = Tabuleiro(30)
    regra = RegraBTW()
    simulacao = Simulacao(tabuleiro, SorteioUniforme(), regra)
    # catástrofe = avalanche entre as ~1% maiores num 30x30;
    # a chance média de um grão causar uma é ~1%, o alerta dispara com 5x isso
    monitor = MonitorDeRisco(regra, tamanho_catastrofico=550, chance_alerta=0.05)
    AnimacaoPilha(ReproducaoEmOndas(simulacao, graos_por_quadro=20, monitor=monitor)).mostrar()


if __name__ == "__main__":
    animacao()
'''

CONFIRA = {
    "passo1": '''\
from pilha_de_areia.tabuleiro import Tabuleiro, TabuleiroHipotetico

t = Tabuleiro(3)
t.adicionar((1, 1), 2)
print(t[(1, 1)], t.total(), t.contem((3, 0)))

h = TabuleiroHipotetico(t)
h.adicionar((1, 1))
print(h[(1, 1)], t[(1, 1)])  # o original não mudou
''',
    "passo2": '''\
import random
from pilha_de_areia.sorteio import SorteioCentro, SorteioUniforme
from pilha_de_areia.tabuleiro import Tabuleiro

t = Tabuleiro(30)
a = SorteioUniforme(random.Random(42))
b = SorteioUniforme(random.Random(42))
print([a.escolher(t) for _ in range(3)])
print([b.escolher(t) for _ in range(3)])  # mesma semente, mesmos grãos
print(SorteioCentro().escolher(t))
''',
    "passo3": '''\
from pilha_de_areia.regras import RegraBTW
from pilha_de_areia.tabuleiro import Tabuleiro

t = Tabuleiro(3)
for pos in [(0, 1), (1, 0), (1, 2), (2, 1)]:
    t.adicionar(pos, 3)
t.adicionar((1, 1), 4)

for k, onda in enumerate(RegraBTW().ondas(t), 1):
    print(f"onda {k}: {onda}")
print(t.como_matriz())
''',
    "passo4": '''\
import random
from pilha_de_areia.regras import VIZINHANCA_4, RegraBTW
from pilha_de_areia.simulacao import Simulacao
from pilha_de_areia.sorteio import SorteioUniforme
from pilha_de_areia.tabuleiro import Tabuleiro

t = Tabuleiro(20)
sim = Simulacao(t, SorteioUniforme(random.Random(1)), RegraBTW())
perdidos = 0
for _ in range(5000):
    av = sim.passo()
    for i, j in av.tombamentos:  # quem tomba na borda perde grãos para fora
        perdidos += sum(not t.contem((i + di, j + dj)) for di, dj in VIZINHANCA_4)

print(t.total() == 5000 - perdidos, f"densidade {t.total() / 400:.2f}")
print(f"última avalanche: tamanho {av.tamanho}, área {len(av.area)}, duração {av.duracao}")
''',
    "passo5": '''\
import random
from pilha_de_areia.indicadores import aglomerados
from pilha_de_areia.regras import RegraBTW
from pilha_de_areia.simulacao import Simulacao
from pilha_de_areia.sorteio import SorteioUniforme
from pilha_de_areia.tabuleiro import Tabuleiro, TabuleiroHipotetico

regra = RegraBTW()
t = Tabuleiro(30)
sim = Simulacao(t, SorteioUniforme(random.Random(1)), regra)
for _ in range(4000):
    sim.passo()

grupos = aglomerados(t, regra)
print(f"{len(grupos)} aglomerados; o maior tem {max(map(len, grupos))} células")

for grupo in grupos:
    origem = next(iter(grupo))
    hipotese = TabuleiroHipotetico(t)
    hipotese.adicionar(origem)
    tombadas = {p for onda in regra.ondas(hipotese, [origem]) for p in onda}
    assert grupo <= tombadas
print("lema confirmado em todos os aglomerados")
''',
    "passo6": '''\
import copy
import random
from pilha_de_areia.regras import RegraBTW
from pilha_de_areia.risco import MonitorDeRisco
from pilha_de_areia.simulacao import Simulacao
from pilha_de_areia.sorteio import SorteioUniforme
from pilha_de_areia.tabuleiro import Tabuleiro

regra = RegraBTW()
t = Tabuleiro(30)
sim = Simulacao(t, SorteioUniforme(random.Random(1)), regra)
for _ in range(4000):
    sim.passo()

monitor = MonitorDeRisco(regra, tamanho_catastrofico=550, chance_alerta=0.05)
risco = monitor.avaliar(t)
while not risco.zona:  # solta grãos até aparecer uma zona de perigo
    sim.passo()
    risco = monitor.avaliar(t)
print(f"chance de catástrofe: {risco.chance:.1%}, zona com {len(risco.zona)} células")

p = max(risco.mapa, key=risco.mapa.get)  # a célula mais perigosa
copia = copy.deepcopy(t)
copia.adicionar(p)
print("atalho:", risco.mapa[p], " simulação de verdade:", sum(len(o) for o in regra.ondas(copia)))
''',
    "passo7": '''\
import random
from pilha_de_areia.regras import RegraBTW
from pilha_de_areia.reproducao import ReproducaoEmOndas
from pilha_de_areia.risco import MonitorDeRisco
from pilha_de_areia.simulacao import Simulacao
from pilha_de_areia.sorteio import SorteioUniforme
from pilha_de_areia.tabuleiro import Tabuleiro

regra = RegraBTW()
simulacao = Simulacao(Tabuleiro(30), SorteioUniforme(random.Random(11)), regra)
reproducao = ReproducaoEmOndas(simulacao, monitor=MonitorDeRisco(regra, 550, 0.05))

while not reproducao.alerta_novo:  # avança quadro a quadro até o primeiro alerta
    reproducao.avancar()

print(f"primeiro alerta antes do grão {len(reproducao.tamanhos) + 1}")
print(f"{reproducao.risco.chance:.1%} de chance, zona com {len(reproducao.risco.zona)} células")
''',
}


# na página em inglês, o pacote e os módulos (arquivos) ganham nomes em inglês;
# classes, funções e variáveis continuam em português (ver o glossário da página)
NOMES_EN = {"pilha_de_areia": "sandpile", "tabuleiro": "board", "sorteio": "sampling", "regras": "rules",
            "simulacao": "simulation", "indicadores": "indicators", "risco": "risk",
            "reproducao": "playback", "visualizacao": "visualization"}
# só nomes de módulo: o pacote, "pacote.modulo", "pacote/modulo", "from .modulo" e "modulo.py"
MODULO = re.compile(r"\bpilha_de_areia\b|(?<=pilha_de_areia[./])\w+|(?<=from \.)\w+|\b\w+(?=\.py\b)")

# uma página por idioma; o código e as saídas são os mesmos nas duas, a não ser pelos nomes dos módulos
PAGINAS = [
    {"modelo": "modelo.html", "saida": "index.html", "copiar": "Copiar", "rotulo_saida": "saída",
     "arquivo_confira": "confere.py", "nomes": {}},
    {"modelo": "modelo.en.html", "saida": "en.html", "copiar": "Copy", "rotulo_saida": "output",
     "arquivo_confira": "check.py", "nomes": NOMES_EN},
]


def renomear(texto: str, nomes: dict[str, str]) -> str:
    return MODULO.sub(lambda m: nomes.get(m.group(0), m.group(0)), texto) if nomes else texto


def bloco(codigo: str, legenda: str, idioma: dict, saida: str | None = None) -> str:
    codigo, legenda = renomear(codigo, idioma["nomes"]), renomear(legenda, idioma["nomes"])
    h = (f'<figure class="codigo"><figcaption><span>{html.escape(legenda)}</span>'
         f'<button type="button" class="copiar">{idioma["copiar"]}</button></figcaption>'
         f'<pre><code class="py">{html.escape(codigo.rstrip())}</code></pre>')
    if saida is not None:
        h += (f'<div class="saida"><span class="rotulo">{idioma["rotulo_saida"]}</span>'
              f'<pre>{html.escape(saida.rstrip())}</pre></div>')
    return h + "</figure>"


def montar(idioma: dict, saidas: dict[str, str]) -> None:
    pagina = (AQUI / idioma["modelo"]).read_text(encoding="utf-8")
    pagina = re.sub(r"<!--MODELO.*?<!--/MODELO-->\n", "", pagina, flags=re.S)  # faixa de aviso do modelo
    pagina = re.sub(r"@@ARQUIVO (\S+)@@",
                    lambda m: bloco((PROJETO / m.group(1)).read_text(encoding="utf-8"), m.group(1), idioma),
                    pagina)
    pagina = re.sub(r"@@CONFIRA (\w+)@@",
                    lambda m: bloco(CONFIRA[m.group(1)], idioma["arquivo_confira"], idioma, saidas[m.group(1)]),
                    pagina)
    codigos = {"init": (TUTORIAL_INIT, "pilha_de_areia/__init__.py"), "main": (TUTORIAL_MAIN, "main.py")}
    pagina = re.sub(r"@@CODIGO (\w+)@@", lambda m: bloco(*codigos[m.group(1)], idioma), pagina)
    assert "@@" not in pagina and "MODELO" not in pagina, f"sobrou marcador em {idioma['modelo']}"
    (SAIDA / idioma["saida"]).write_text(pagina, encoding="utf-8")


def rodar(pasta: pathlib.Path, codigo: str) -> str:
    env = dict(os.environ, MPLBACKEND="Agg", PYTHONIOENCODING="utf-8")
    r = subprocess.run([sys.executable, "-c", codigo], cwd=pasta, env=env,
                       capture_output=True, text=True, encoding="utf-8", timeout=300)
    if r.returncode != 0:
        raise SystemExit(f"falhou:\n{codigo}\n{r.stderr}")
    return r.stdout


def main():
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="tutorial_"))
    pacote = tmp / "pilha_de_areia"
    pacote.mkdir()
    for m in MODULOS:
        shutil.copy(PROJETO / "pilha_de_areia" / f"{m}.py", pacote / f"{m}.py")

    # passos 1-8: __init__.py vazio, como o tutorial manda
    (pacote / "__init__.py").write_text("", encoding="utf-8")
    saidas = {}
    for nome, codigo in CONFIRA.items():
        print(f"conferindo {nome}...")
        saidas[nome] = rodar(tmp, codigo)

    # passo 9: __init__ completo e main.py do tutorial
    (pacote / "__init__.py").write_text(TUTORIAL_INIT, encoding="utf-8")
    (tmp / "main.py").write_text(TUTORIAL_MAIN, encoding="utf-8")
    print("conferindo main.py...")
    rodar(tmp, "import main; main.animacao()")
    shutil.rmtree(tmp)

    for idioma in PAGINAS:
        montar(idioma, saidas)
    print(f"pronto: abra {SAIDA / 'index.html'} no navegador (o botão EN leva para en.html)")


if __name__ == "__main__":
    main()
