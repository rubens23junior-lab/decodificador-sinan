# Conferência por amostra: Toxoplasmose gestacional

Situação em 21/11/2026. Não houve comparação com outro método (como o pacote microdatasus): para este agravo, a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `TOXGBR24.dbc` (público, DATASUS), com 15.392 notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - os códigos sem tradução e os avisos.
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).

  As cotas que não se completam passam para as listas de códigos.
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261121. Comando: `node validacao/amostra.js --agravo toxoplasmose-gestacional --arquivo dados_publicos/toxoplasmose-gestacional/TOXGBR24.dbc --semente 20261121`, com o dicionário já conferido (commit `a215815`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 21/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-toxoplasmose-gestacional.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu o agravo pelo CID O98.6, a idade gestacional (campo Gestante), a classificação final, o critério, a autoctonia, a UF de infecção e a evolução.

O aviso de B58 em gestante não entra no sorteio, porque a amostra só pega células traduzidas. Ele foi conferido na prévia: 12.805 notificações de 2022 a 2025 o receberam.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-toxoplasmose-gestacional.xlsx` em 21/11/2026, com todas as pendências aprovadas (ver `docs/inventario-toxoplasmoses.md`).
- **Fontes:** não existe dicionário de dados próprio. As fontes foram:
  - a ficha de Notificação/Conclusão (versão da SES-MG de 05/07/2019);
  - o dicionário da notificação individual (NOTIF2018), como na sífilis adquirida.
- **Regra do Rubens:** o CID B58 em gestante fica como veio e recebe o aviso de possível toxoplasmose gestacional (CID esperado O98.6).
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o arquivo de 2025 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2022 a 2025:** a classificação final "8"; o aviso de B58 em gestante (12.805 notificações de 2022 a 2025); poucas unidades fora do CNES.
