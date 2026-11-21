# Conferência por amostra: Acidentes por animais peçonhentos

Situação em 20/11/2026. Não houve comparação com outro método (como o pacote microdatasus): para este agravo, a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `ANIMBR24.dbc` (público, DATASUS), com 346.576 notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - os textos livres;
  - os números de ampolas;
  - os códigos sem tradução.
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO, todas da ocupação;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261120. Comando: `node validacao/amostra.js --agravo animais-peconhentos --arquivo dados_publicos/animais-peconhentos/ANIMBR24.dbc --semente 20261120`, com o dicionário já conferido (commit `ba34fe0`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 20/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-animais-peconhentos.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- a UF e o município de ocorrência do acidente;
- o local da picada e o tempo até o atendimento;
- as manifestações locais e sistêmicas;
- o tempo de coagulação (em que 9 = Não realizado);
- a soroterapia, a classificação do caso e a evolução;
- o acidente relacionado ao trabalho.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-animais-peconhentos.xlsx` em 20/11/2026, com todas as pendências aprovadas (ver `docs/inventario-animais-peconhentos.md`).
  - O texto do campo 51 da ficha entrou nas observações das colunas de ampolas.
  - A complicação "Síndrome Comportamental" ficou como na fonte.
- **Fontes:**
  - fonte principal: o dicionário de dados de acidentes por animais peçonhentos (revisado em julho de 2010) do pacote Docs_TAB_SINAN do DATASUS;
  - apoio: a ficha (2006);
  - o arquivo de definições do TabWin (AnimaispNET.DEF) ligou cada coluna de ampolas ao seu soro.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o ANIMBR24 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2021 a 2024 (1,26 milhão de notificações):** muito poucas. São:
  - códigos de ocupação fora da CBO (10001 e 999990);
  - poucos municípios sem região de saúde;
  - idades acima do limite;
  - uma data de encerramento com o ano errado.
