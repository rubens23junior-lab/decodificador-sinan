# Conferência por amostra: Malária

Situação em 14/11/2026. Esta conferência complementa a comparação com o microdatasus (`relatorio-comparacao-malaria.md`).

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`).

- **Arquivo:** `MALABR25.dbc` (público, DATASUS, preliminar), com 2.082 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora os campos vazios, o texto livre, as datas e os códigos sem tradução.
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 8 em CNES/CBO;
  - 10 em colunas extras.
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261115. Comando: `node validacao/amostra.js --agravo malaria --arquivo dados_publicos/malaria/MALABR25.dbc --semente 20261115`, na versão do commit `0ad6c45`.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 14/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-malaria.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada.
