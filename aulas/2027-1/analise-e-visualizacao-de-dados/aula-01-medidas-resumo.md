---
title: Medidas-resumo
date: 2027-02-11
resumo: Média, mediana e desvio padrão — o que cada uma conta sobre os dados e quando enganam.
# slides: slides/aula-01.pdf
# notebook: notebooks/aula-01.ipynb
---

> **Aula-modelo.** Mostra fórmulas, que são escritas entre `$$` (no meio do texto ou num
> parágrafo sozinho), e código com gráfico. Copie, renomeie para `aula-02-tema.md` e troque o conteúdo.
{: .nota}

## Média e desvio padrão

Para uma amostra $$x_1, \dots, x_n$$, a média é

$$
\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i
$$

e o desvio padrão mede o quanto os valores se afastam dela:

$$
s = \sqrt{\frac{1}{n - 1} \sum_{i=1}^{n} \left(x_i - \bar{x}\right)^2}
$$

A divisão por $$n - 1$$ em vez de $$n$$ corrige o viés de estimar a média com a própria amostra.

## Quando a média engana

A média é sensível a valores extremos; a mediana, não. Em salários, por exemplo, poucos valores
muito altos puxam a média para cima, e a mediana descreve melhor o "salário típico".

```python
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(42)
salarios = rng.lognormal(mean=8, sigma=0.6, size=1_000)

plt.hist(salarios, bins=40, color="#c9963b")
plt.axvline(np.mean(salarios), color="#b8321e", label="média")
plt.axvline(np.median(salarios), color="#2453d6", label="mediana")
plt.legend()
plt.show()
```

## Exercício

Gere 1.000 valores de uma distribuição normal e compare média e mediana. Depois troque um único
valor por 1.000.000 e compare de novo. O que mudou em cada uma?
