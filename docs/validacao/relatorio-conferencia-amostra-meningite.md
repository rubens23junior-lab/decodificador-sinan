# Conferência por amostra: Meningite

Situação em 19/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para meningite. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `MENIBR25.dbc` (público, DATASUS), com 26.977 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - o texto livre;
  - as datas e os números (doses de vacina, exame quimiocitológico, número de comunicantes);
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido": o "8" da classificação do caso, o "0" dos exames do campo 49 e o "00" e outros sinais em "Se confirmado, especifique".
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO (6 da unidade notificadora e 2 da ocupação);
  - 8 em idade;
  - 8 em município (inclusive 3 do município do hospital);
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261119. Comando: `node validacao/amostra.js --agravo meningite --arquivo dados_publicos/meningite/MENIBR25.dbc --semente 20261119`, com o dicionário já conferido e corrigido (o mesmo do commit `a4ae161`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 19/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-meningite.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu resultados de exames pelos quadros do dicionário (por exemplo, "61" = Não realizado na cultura), a classificação do caso, o critério de confirmação e o tipo de meningite.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-meningite.xlsx` em 19/11/2026. Correções aplicadas no mesmo dia:
  - G03.9/G039 = Meningite não especificada, pela CID-10 (tabela do TabWin);
  - a UF de residência, que vem em código, sai com o nome da UF; a UF do hospital, que vem em sigla, fica só com a sigla;
  - quatro colunas que não vêm no arquivo público (hospital pelo CNES, e nome, telefone e endereço do contato) entraram para arquivos exportados do próprio Sinan. Foram testadas com um arquivo fictício.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o MENIBR25 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências no MENIBR25:** as principais são:
  - a classificação do caso 8 (504 registros);
  - "00" em "Se confirmado, especifique" (764);
  - o código 0 nos exames do campo 49 (de 12 a 77 por exame);
  - códigos de ocupação fora da CBO (10001, 999990);
  - poucos municípios sem região ou macrorregião de saúde e poucas idades implausíveis.
