# Comparação com o microdatasus: Doença de Chagas aguda

Situação em 14/11/2026. O método é o mesmo da comparação da versão 1.0 (`relatorio-comparacao-microdatasus.md`).

## Método

- **Arquivo:** `CHAGBR25.dbc` (público, DATASUS, preliminar), com 7.537 registros e 108 colunas.
- **Ferramenta:** `node validacao/ferramenta-pares.js dados_publicos/chagas/CHAGBR25.dbc chagas dados_publicos/saida/pares-ferramenta-chagas.csv`, com o dicionário conferido pelo Rubens em 14/11/2026.
- **microdatasus 3.0.0:** `Rscript validacao/microdatasus-pares.R dados_publicos/chagas/CHAGBR25.dbc process_sinan_chagas dados_publicos/saida/pares-microdatasus-chagas.csv`, com `municipality_data = FALSE`.
  - A função parou com erro na idade, como nos agravos da versão 1.0. O script repetiu o processamento com `NU_IDADE_N` convertida para número.
- **Comparação:** `node validacao/comparar.js chagas … --versao-microdatasus 3.0.0 --arquivo CHAGBR25.dbc`. A planilha está em `docs/validacao/comparacao-chagas.xlsx`.

## Resultado

| Grupo | Códigos | Células |
|---|---|---|
| Igual | 4.223 | 684.393 |
| Só grafia | 157 | 1.169 |
| Significado diferente | 141 | 8.071 |
| Só a ferramenta traduz | 4.168 | 42.880 |
| Só o microdatasus traduz | 17 | 10.823 |
| Microdatasus apaga o valor | 40 | 19.552 |
| Nenhuma traduz | 963 | 47.103 |

## As diferenças, uma a uma

Nenhuma diferença indica erro de tradução da ferramenta.

**Significado diferente**
- **Idade** (`NU_IDADE_N`, 126 códigos): é o mesmo erro do microdatasus visto na versão 1.0. Ele lê só o 2º e o 3º dígito, e por isso 4039 (39 anos) vira "3 anos".
- **Presença de vestígios de triatomídeos** (`PRESENCA`, código 3, 458 registros): a ferramenta traduz "Não realizado" e o microdatasus, "Não se aplica". O DICCHAG (p. 2-3, campo 34) e a ficha (campo 34) dizem "3 - Não Realizado". **A ferramenta segue as duas fontes oficiais.**
- **Ocupação** (`ID_OCUPA_N`, 9 códigos): títulos diferentes da CBO, como na versão 1.0. A ferramenta usa a tabela do DATASUS (CBO_02.dbf).
- **Diferenças só de redação:**
  - `EVOLUCAO` 3: "Óbito por outras causas" × "Óbito por outra causa";
  - `CON_PROVAV` 6: "Outra" × "Outro";
  - `COUFINF` 17: "Tocantins" × "Tocantis", grafia errada no microdatasus.

**Só o microdatasus traduz**
- **País** (`ID_PAIS` e `COPAISINF`): o código 1 vira "BRASIL". É a pendência que o Rubens decidiu manter sem tradução, por falta de fonte documental.
- **Hemoaglutinação S2 e IgG S1** (`HEM_IGM_S2`, `HEM_IGG_S2`, `HEM_IGG_S1`): o microdatasus põe rótulos (Reagente, Não realizado…) em campos que estão vazios no arquivo. A ferramenta mantém o vazio, como manda a regra do projeto. Aparentemente o pacote preenche essas colunas a partir de outras.
- **Títulos da imunofluorescência** (`TIT_IGM_S1`, `TIT_IGG_S1`): o microdatasus trata o título como categoria (1 = Reagente, 4 = Não realizado), repetindo o engano do DICCHAG. Pela ficha, o título é a diluição; decisão do Rubens: manter o número.

**Só a ferramenta traduz**
- Agravo, escolaridade, duplicidade, UFs de deslocamento e algumas categorias que o pacote deixa como vieram.

**Microdatasus apaga o valor**
- Em várias colunas, o pacote apaga códigos como 9 (Ignorado) e os códigos especiais de ocupação. Quem usa o microdatasus não fica sabendo que esses valores existiam.

## Teste no navegador

Edge, com o arquivo `CHAGBR25.dbc`: 7.537 registros processados em 8,5 s, com a planilha das quatro abas gerada, nenhum erro na página e nenhuma conexão para fora do computador.
