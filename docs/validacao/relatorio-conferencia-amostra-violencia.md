# Conferência por amostra: Violência interpessoal/autoprovocada

Situação em 11/11/2026. Validação do dicionário de violência (versão 1.1). O pacote microdatasus (versão 3.0.0) não tem função para violência, por isso esta é a única validação externa deste agravo.

## Método

O método é o mesmo da conferência da versão 1.0 (`relatorio-conferencia-amostra.md`).

- **Arquivo:** `VIOLBR25.dbc` (público, DATASUS), com 737.540 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora os campos vazios, o texto livre, as datas e os códigos sem tradução.
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos (de 54 colunas diferentes);
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 8 em CBO;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261110. Comando: `node validacao/amostra.js --agravo violencia --arquivo dados_publicos/violencia/VIOLBR25.dbc --semente 20261110`, na versão do commit `18aaaf4`.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 10 e 11/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-violencia.xlsx`.
  - 98 células foram marcadas SIM na planilha.
  - As linhas 10 e 11 (`CICL_VID`, códigos 3 e 4) ficaram sem marcação e foram confirmadas como corretas pelo Rubens no chat, em 11/11/2026.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada, então não houve revisão de divergências.
