# Conferência por amostra: Tétano neonatal

Situação em 16/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para tétano. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo dos outros agravos, com uma diferença: o arquivo. O tétano neonatal tem pouquíssimas notificações por ano, então a amostra foi sorteada do conjunto de vários anos.

- **Arquivos:** `TETNBR15.dbc` a `TETNBR25.dbc` (públicos, DATASUS; finais até 2022 e preliminares de 2023 a 2025), com 16 registros no total.
  - Eles foram juntados num CSV só, `dados_publicos/tetano-neonatal/TETNBR15-25.csv`, com os códigos como vieram. O comando foi `node ferramentas/juntar-arquivos.js dados_publicos/tetano-neonatal/TETNBR15-25.csv dados_publicos/tetano-neonatal/TETNBR15.dbc … dados_publicos/tetano-neonatal/TETNBR25.dbc`, com os 11 arquivos em ordem de ano.
  - As colunas do CSV são a união das colunas dos 11 arquivos; quando um ano não tem a coluna, a célula fica em branco.
- **Unidade:** a célula traduzida, como nos outros agravos. Ficam de fora os campos vazios, o texto livre, as datas e os códigos sem tradução. Das 16 notificações saem 675 células elegíveis.
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 8 em CNES/CBO;
  - 10 em colunas extras.
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261116. Comando: `node validacao/amostra.js --agravo tetano-neonatal --arquivo dados_publicos/tetano-neonatal/TETNBR15-25.csv --semente 20261116`, na versão do commit `5daa25d`, com o dicionário já conferido.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 16/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-tetano-neonatal.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. Com 100 das 675 células elegíveis conferidas, a amostra cobre cerca de 15% de tudo o que a ferramenta traduz nos arquivos públicos desse agravo de 2015 a 2025.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-tetano-neonatal.xlsx` em 16/11/2026, com as correções aplicadas no mesmo dia (ver `docs/inventario-tetano-neonatal.md`).
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o TETNBR23 foi processado sem erros na página e sem nenhuma conexão de rede.
- **Prévia de 2015 a 2025:** a única inconsistência foi uma classificação final 8 (2023), que sai como "Inconsistência/Não Preenchido". Os arquivos de 2015 a 2019 trazem a data de nascimento completa (`DT_NASC`), que o dicionário reconhece.
