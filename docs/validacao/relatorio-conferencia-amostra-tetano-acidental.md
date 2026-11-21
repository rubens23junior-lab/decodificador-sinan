# Conferência por amostra: Tétano acidental

Situação em 16/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para tétano. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`), da malária e da hanseníase.

- **Arquivo:** `TETABR25.dbc` (público, DATASUS, dados preliminares), com 660 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - o texto livre;
  - as datas;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido".
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 8 em CNES/CBO;
  - 10 em colunas extras.
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261116. Comando: `node validacao/amostra.js --agravo tetano-acidental --arquivo dados_publicos/tetano-acidental/TETABR25.dbc --semente 20261116`, na versão do commit `5daa25d`, com o dicionário já conferido.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 16/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-tetano-acidental.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-tetano-acidental.xlsx` em 16/11/2026, com as correções aplicadas no mesmo dia (ver `docs/inventario-tetano-acidental.md`).
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o TETABR25 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Prévia com 2023, 2024 e 2025:** o mesmo padrão nos três anos. As únicas inconsistências relevantes são:
  - a classificação final 8 (41, 50 e 55 registros), que sai como "Inconsistência/Não Preenchido";
  - a UF de residência, que vem em sigla e fica como veio.
