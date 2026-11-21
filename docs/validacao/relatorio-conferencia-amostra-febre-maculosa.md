# Conferência por amostra: Febre maculosa

Situação em 21/11/2026. Não houve comparação com outro método (como o pacote microdatasus): para este agravo, a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `FMACBR23.dbc` (público, DATASUS), com 17.942 notificações. É o ano com mais notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - os textos livres, o agente e os títulos;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido".
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO (unidade notificadora e ocupação);
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261121. Comando: `node validacao/amostra.js --agravo febre-maculosa --arquivo dados_publicos/febre-maculosa/FMACBR23.dbc --semente 20261121`, com o dicionário já conferido (commit `7d90270`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 21/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-febre-maculosa.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- os sinais e sintomas;
- o contato com animais (carrapato, bovinos, equinos e outros);
- a frequência a ambientes com mata;
- a classificação final, o critério e a evolução;
- a UF e o município prováveis de infecção.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-febre-maculosa.xlsx` em 21/11/2026, com todas as pendências aprovadas sem correção (ver `docs/inventario-febre-maculosa.md`).
- **Fontes:**
  - fonte principal: o dicionário de dados de febre maculosa (revisado em março de 2012) do pacote Docs_TAB_SINAN do DATASUS;
  - apoio: a ficha (2006) e o FMacNet.def do TabWin.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o FMACBR25 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2023 a 2025:** as principais são:
  - a classificação final "8" (2.272 registros);
  - códigos de ocupação fora da CBO;
  - poucas unidades fora do CNES;
  - alguns "9" nos exames.
