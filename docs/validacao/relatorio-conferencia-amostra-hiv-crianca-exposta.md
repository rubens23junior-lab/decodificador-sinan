# Conferência por amostra: HIV em criança exposta

Situação em 20/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para HIV em criança exposta. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `HIVEBR23.dbc` (público, DATASUS, preliminar), com 7.768 notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Preenchido erroneamente" (a escolaridade "1" das notificações do Espírito Santo).
- **Tamanho e cotas:** 100 células:
  - 68 em listas de códigos (as 8 da cota de CNES/CBO passaram para cá, porque a ocupação vem sempre em branco);
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde e semanas calculadas).
- **Composição:** o arquivo só traz preenchidos os campos da notificação. As colunas de encerramento (classificação, critério, doença relacionada ao trabalho e evolução) vêm em branco em todos os registros. Por isso as 68 células de listas são de tipo de notificação, agravo, sexo, gestante, raça/cor e escolaridade.
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261120. Comando: `node validacao/amostra.js --agravo hiv-crianca-exposta --arquivo dados_publicos/hiv-crianca-exposta/HIVEBR23.dbc --semente 20261120`, com o dicionário já conferido e corrigido (commit `dd5d693`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 20/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-hiv-crianca-exposta.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu o agravo pelo nome da CID-10 (Z20.6), a escolaridade "Não se aplica" e as semanas da notificação e do diagnóstico calculadas pela data.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-hiv-crianca-exposta.xlsx` em 20/11/2026, com as correções aplicadas no mesmo dia (ver `docs/inventario-hiv.md`):
  - a evolução do caso usa as categorias do campo 47 da ficha (1 Infectada a 7 Óbito por outras causas);
  - a doença relacionada ao trabalho usa 1 Sim, 2 Não e 9 Ignorado;
  - a escolaridade "1" gravada para a criança nas 394 notificações do Espírito Santo sai como "Inconsistência/Preenchido erroneamente".
- **Fontes:**
  - fonte principal: o dicionário de dados de HIV criança exposta, revisado em fevereiro de 2024, do pacote Docs_TAB_SINAN do DATASUS;
  - apoio: a ficha de 2009, que é um PDF escaneado e foi lida pelas imagens das páginas.
- **Campos fora do dicionário:** os campos 31 a 46 da ficha (mãe/nutriz, parto, aleitamento e exames da criança) não entraram. Nenhum documento dá o nome dessas colunas no banco, e o arquivo público não as traz.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o HIVEBR24 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2022 a 2024:** as principais são:
  - a escolaridade "1" das notificações do Espírito Santo (394);
  - seis idades de 30 dias, acima do limite de 29 dias;
  - dois municípios de residência sem região e macrorregião de saúde.
