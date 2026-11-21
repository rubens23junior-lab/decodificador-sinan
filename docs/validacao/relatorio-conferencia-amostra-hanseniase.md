# Conferência por amostra: Hanseníase

Situação em 16/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para hanseníase. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e da malária.

- **Arquivo:** `HANSBR25.dbc` (público, DATASUS, dados preliminares), com 31.319 registros.
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
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261116. Comando: `node validacao/amostra.js --agravo hanseniase --arquivo dados_publicos/hanseniase/HANSBR25.dbc --semente 20261116`, na versão do commit `37565c1`. Nessa versão, o dicionário já estava conferido e as regras de código fora do campo e de zeros à esquerda no CNES já estavam no programa.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 16/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-hanseniase.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-hanseniase.xlsx` em 16/11/2026. As correções que ele pediu foram aplicadas no mesmo dia (ver `docs/inventario-hanseniase.md`).
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o arquivo inteiro foi processado em cerca de 17 segundos, sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências no arquivo de 2025:** 42 linhas. As principais são os códigos que o campo não comporta, que saem como "Inconsistência/Não Preenchido":
  - EPIS_RACIO 0: 11.890;
  - MODODETECT 0: 6.916;
  - BACILOSCOP 0: 1.130;
  - FORMACLINI 0, 6 e 9: 1.127.
- **Unidades de saúde:** com a regra dos zeros à esquerda, só 4 códigos de unidade notificadora ficaram sem nome no CNES, contra 1.930 antes da regra.
