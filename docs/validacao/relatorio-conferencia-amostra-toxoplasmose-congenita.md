# Conferência por amostra: Toxoplasmose congênita

Situação em 21/11/2026. Não houve comparação com outro método (como o pacote microdatasus): para este agravo, a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `TOXCBR24.dbc` (público, DATASUS), com 7.403 notificações.
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
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261121. Comando: `node validacao/amostra.js --agravo toxoplasmose-congenita --arquivo dados_publicos/toxoplasmose-congenita/TOXCBR24.dbc --semente 20261121`, com o dicionário já conferido (commit `a215815`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 21/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-toxoplasmose-congenita.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu o agravo pelos CIDs P37.1 e O98.6, a classificação final, o critério, a autoctonia e a evolução.

No arquivo da congênita nenhuma notificação recebeu o aviso, porque ali o campo Gestante vem quase sempre como "Não se aplica".

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-toxoplasmose-congenita.xlsx` em 21/11/2026, com todas as pendências aprovadas (ver `docs/inventario-toxoplasmoses.md`).
- **Fontes:** não existe dicionário de dados próprio. As fontes foram:
  - a ficha de Notificação/Conclusão (versão da SES-MG de 05/07/2019);
  - o dicionário da notificação individual (NOTIF2018), como na sífilis adquirida.
- **Regra do Rubens:** o CID B58 em gestante fica como veio e recebe o aviso de possível toxoplasmose gestacional (CID esperado O98.6).
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o arquivo de 2025 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2022 a 2025:** a classificação final "8" e algumas idades de 30 dias (acima do limite de 29 dias); poucas unidades fora do CNES.
