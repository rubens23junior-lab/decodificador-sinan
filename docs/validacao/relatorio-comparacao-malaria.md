# Comparação com o microdatasus: Malária

Situação em 14/11/2026. O método é o mesmo da comparação de Chagas (`relatorio-comparacao-chagas.md`).

## Método

- **Arquivo:** `MALABR25.dbc` (público, DATASUS, preliminar), com 2.082 registros e 50 colunas.
- **Ferramenta:** `node validacao/ferramenta-pares.js dados_publicos/malaria/MALABR25.dbc malaria dados_publicos/saida/pares-ferramenta-malaria.csv`, com o dicionário conferido pelo Rubens em 14/11/2026.
- **microdatasus 3.0.0:** `Rscript validacao/microdatasus-pares.R dados_publicos/malaria/MALABR25.dbc process_sinan_malaria dados_publicos/saida/pares-microdatasus-malaria.csv`. Houve o mesmo erro na idade dos outros agravos, contornado pelo script.
- **Comparação:** `node validacao/comparar.js malaria … --versao-microdatasus 3.0.0 --arquivo MALABR25.dbc`. A planilha está em `docs/validacao/comparacao-malaria.xlsx`.

## Resultado

| Grupo | Códigos | Células |
|---|---|---|
| Igual | 2.410 | 67.155 |
| Só grafia | 144 | 865 |
| Significado diferente | 149 | 4.742 |
| Só a ferramenta traduz | 1.575 | 12.356 |
| Só o microdatasus traduz | 52 | 2.593 |
| Microdatasus apaga o valor | 15 | 1.939 |
| Nenhuma traduz | 823 | 14.450 |

## As diferenças, uma a uma

Nenhuma diferença indica erro de tradução da ferramenta.

**Significado diferente**
- **Atividade nos últimos 15 dias** (`AT_ATIVIDA`, 38 códigos): **erro do microdatasus.** Em vez da atividade, o pacote grava a sigla do tipo de lâmina (BA, BP ou LVC) da mesma notificação. Por exemplo, o código 10 (Viajante, 535 registros) aparece como "BA", "BP" ou "LVC". A ferramenta segue o DICMAL (p. 2, campo 33) e a ficha (campo 33). O mesmo erro faz o microdatasus pôr siglas em 25 registros com atividade vazia ("Só o microdatasus traduz").
- **Idade** (`NU_IDADE_N`, 91 códigos): o mesmo erro do microdatasus visto nos outros agravos (lê só o 2º e o 3º dígito).
- **Resultado do exame** (`RESULT`) e **parasitemia em cruzes** (`PCRUZ`): o microdatasus usa só as siglas ("V", "Meia cruz"). A ferramenta usa os rótulos do instrutivo ("V (P. vivax)") e do DICMAL ("1/2 + (Meia cruz)"), por decisão do Rubens.
- **Escolaridade** e **ocupação:** diferenças só de grafia (º/o, títulos da CBO), como na versão 1.0.

**Só o microdatasus traduz**
- **País** (`ID_PAIS` e `COPAISINF`): o pacote usa uma tabela própria de países. Na ferramenta, isso segue como pendência, por decisão do Rubens.

**Só a ferramenta traduz**
- Agravo; escolaridade; classificação final 8 (Inconclusivo, decisão do Rubens); tipo de lâmina com os nomes do instrutivo; esquema de tratamento 12 (da ficha), que o pacote não conhece.

**Microdatasus apaga o valor**
- Códigos especiais de ocupação, alguns códigos de atividade e o código 0 de país de infecção (1.596 registros).

## Teste no navegador

Edge, com o arquivo `MALABR25.dbc`: 2.082 registros processados, com a planilha das quatro abas gerada, nenhum erro na página e nenhuma conexão para fora do computador.
