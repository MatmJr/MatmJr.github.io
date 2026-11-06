---
title: O que faz um engenheiro de dados
date: 2027-02-10
resumo: O ciclo de vida dos dados, os papéis em um time de dados e a arquitetura em camadas bronze, prata e ouro.
# Campos opcionais (tire o # para usar):
# slides: slides/aula-01.pdf            # PDF nesta pasta, ou um link https://...
# notebook: notebooks/aula-01.ipynb     # gera os botões "Abrir no Colab" e "Baixar notebook"
# materiais:
#   - nome: Lista de exercícios
#     url: listas/lista-01.pdf
#   - nome: Leitura complementar
#     url: https://...
---

> **Aula-modelo.** Este arquivo mostra o que dá para usar numa aula: títulos, listas, tabelas,
> código e destaques. Copie, renomeie para `aula-02-tema.md` e troque o conteúdo.
{: .nota}

## Objetivos

Ao final da aula, você deve conseguir:

1. Descrever as etapas do ciclo de vida dos dados.
2. Diferenciar engenharia, análise e ciência de dados.
3. Explicar a ideia das camadas bronze, prata e ouro.

## O ciclo de vida dos dados

Todo dado passa por **geração**, **ingestão**, **armazenamento**, **transformação** e **disponibilização**.
O trabalho do engenheiro de dados é fazer esse caminho ser confiável, reprodutível e barato.

| Camada | O que guarda | Exemplo |
|--------|--------------|---------|
| Bronze | o dado como chegou da fonte | resposta JSON de uma API |
| Prata  | o dado limpo e padronizado | tabela com tipos corrigidos |
| Ouro   | o dado pronto para consumo | indicadores agregados por mês |

## Um pipeline mínimo

```python
import pandas as pd
import requests

# extrair: série 433 (IPCA) da API do Banco Central
url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json"
bruto = requests.get(url, timeout=30).json()

# transformar: tipos corretos e só os últimos 12 meses
df = pd.DataFrame(bruto)
df["data"] = pd.to_datetime(df["data"], dayfirst=True)
df["valor"] = df["valor"].astype(float)
ultimos = df.tail(12)

# carregar
ultimos.to_csv("ipca_12_meses.csv", index=False)
```

## Para a próxima aula

- Instale o Python 3.11+ e o Docker.
- Leia o capítulo 1 de *Fundamentals of Data Engineering*.
