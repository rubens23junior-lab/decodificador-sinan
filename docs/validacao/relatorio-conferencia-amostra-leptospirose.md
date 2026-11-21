# Conferência por amostra: Leptospirose

Situação em 20/11/2026. Não houve comparação com outro método (como o pacote microdatasus): para este agravo, a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `LEPTBR24.dbc` (público, DATASUS), com 27.509 notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - os textos livres, os sorovares e os títulos;
  - as UFs em sigla;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido".
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO (unidade notificadora e ocupação);
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261120. Comando: `node validacao/amostra.js --agravo leptospirose --arquivo dados_publicos/leptospirose/LEPTBR24.dbc --semente 20261120`, com o dicionário já conferido (commit `b902fb9`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 20/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-leptospirose.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- as situações de risco (água ou lama de enchente, plantio/colheita, fossa, roedores e outras);
- os casos anteriores humanos e animais;
- os sinais e sintomas;
- a hospitalização e o município do hospital;
- a sorologia Elisa e o RT-PCR;
- o critério de confirmação e a evolução.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-leptospirose.xlsx` em 20/11/2026, com todas as pendências aprovadas sem correção (ver `docs/inventario-leptospirose.md`). Entre elas:
  - a classificação final "8" sai como "Inconsistência/Não Preenchido";
  - o código 4 no resultado da microaglutinação também sai como inconsistência.
- **Fontes:**
  - fonte principal: o dicionário de dados de leptospirose do pacote Docs_TAB_SINAN do DATASUS;
  - apoio: a ficha (2007) e o instrucional;
  - os campos comuns vieram da meningite e da leishmaniose visceral, já conferidas.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o LEPTBR24 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2022 a 2024:** as principais são:
  - a classificação final "8" (2.688 registros);
  - o código 4 na microaglutinação (cerca de 880);
  - códigos de ocupação fora da CBO (10001 e 999990);
  - poucas unidades de saúde fora do CNES.
