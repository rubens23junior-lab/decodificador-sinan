# Conferência por amostra: HIV em criança

Situação em 20/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para HIV em criança. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** os três arquivos públicos do DATASUS (preliminares) juntados num só, porque o agravo tem poucas notificações. Foram `HIVCBR22.dbc` (186), `HIVCBR23.dbc` (186; nenhuma se repete com 2022) e `HIVCBR24.dbc` (1), num total de 373 notificações. A junção foi feita com `node ferramentas/juntar-arquivos.js dados_publicos/hiv-crianca/HIVCBR22-24.csv` seguido dos três arquivos, como no tétano neonatal. Os códigos ficam como vieram.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora os campos vazios, as datas, a idade da mãe (número) e os códigos sem tradução.
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO, todas da ocupação da mãe;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde e semana calculada).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261120. Comando: `node validacao/amostra.js --agravo hiv-crianca --arquivo dados_publicos/hiv-crianca/HIVCBR22-24.csv --semente 20261120`, com o dicionário já conferido (commit `8c279f7`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 20/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-hiv-crianca.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- dezenas de sinais do critério CDC adaptado, entre eles uma das colunas de herpes (CLI_CDC_HE) e a trombocitopenia (CLI_TUPULM);
- a raça/cor e a ocupação da mãe;
- a transmissão vertical e sexual;
- os testes de detecção de ácido nucléico;
- a UF do tratamento.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-hiv-crianca.xlsx` em 20/11/2026, com todas as pendências aprovadas sem correção. As principais foram:
  - as três colunas de herpes, ligadas pelo AidsCriNET.def;
  - o código 4 da evolução (Transferência para outro município), que veio da ficha;
  - 9, 09 e 99 = Ignorado na escolaridade.
- **Fontes:**
  - fonte principal: o dicionário de HIV criança, revisado em fevereiro de 2024, do pacote Docs_TAB_SINAN do DATASUS;
  - apoio: a ficha e o instrucional de aids criança (2006);
  - o arquivo de definições do TabWin (AidsCriNET.def) e as suas conversões confirmaram as colunas e os códigos.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o HIVCBR23 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2022 a 2024:** nenhuma.
