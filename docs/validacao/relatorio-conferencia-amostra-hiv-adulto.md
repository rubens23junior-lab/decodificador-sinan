# Conferência por amostra: HIV em adulto

Situação em 20/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para HIV em adulto. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `HIVABR23.dbc` (público, DATASUS, preliminar), com 53.582 notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - a UF do tratamento, que vem em sigla e fica como veio;
  - os códigos sem tradução, entre eles as ocupações gravadas com ponto (por exemplo "5161.1").
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO, todas da ocupação;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde e semana calculada).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261120. Comando: `node validacao/amostra.js --agravo hiv-adulto --arquivo dados_publicos/hiv-adulto/HIVABR23.dbc --semente 20261120`, com o dicionário já conferido e corrigido (commit `8c279f7`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 20/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-hiv-adulto.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu sinais dos dois critérios de definição de caso (Rio de Janeiro/Caracas e CDC adaptado), além do critério óbito, da transmissão vertical e sexual, do teste confirmatório, da evolução, do critério (901, HIV+) e da categoria de exposição.

A coluna extra da ocupação multiplicada por 100 não entrou no sorteio: as colunas extras sorteadas foram as de região, macrorregião e semana. Ela foi testada com dados fictícios e conferida no arquivo de 2023, onde, por exemplo, "5161.1" dá "516110 – Cabeleireiro".

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-hiv-adulto.xlsx` em 20/11/2026, com as correções aplicadas no mesmo dia (ver `docs/inventario-hiv.md`):
  - a explicação da pontuação do critério Rio de Janeiro/Caracas, escrita pelo Rubens, entrou na observação dos 14 sinais;
  - a ocupação gravada com ponto (767 notificações em 2023 e 2024) continua como veio, nas Inconsistências. Uma coluna extra multiplica o código por 100 e procura na CBO, com o aviso de que é uma estratégia para tentar prever o erro de preenchimento (regra nova do programa, commit `fb2a509`);
  - seguindo a ficha, entraram a instituição da transfusão (campo 38, ANT_INSTTR) e a unidade de tratamento (campo 46, TRA_UNIDAD), com o nome das colunas do dicionário de aids adulto de 2012 e do AidsNET.def, para arquivos exportados do próprio Sinan.
- **Fontes:**
  - fonte principal: o dicionário de HIV adulto, revisado em fevereiro de 2024, do pacote Docs_TAB_SINAN do DATASUS;
  - apoio: a ficha e o instrucional de aids adulto (2006) e o dicionário de aids adulto de 2012;
  - o arquivo de definições do TabWin (AidsNET.def) e as suas conversões confirmaram as colunas e os códigos.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o HIVABR24 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2023 e 2024:** as principais são:
  - as ocupações com ponto;
  - poucos municípios de tratamento e de residência inexistentes;
  - três idades acima de 110 anos;
  - duas datas com o ano errado.
