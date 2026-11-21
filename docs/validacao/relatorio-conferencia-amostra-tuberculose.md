# Conferência por amostra: Tuberculose

Situação em 20/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para tuberculose. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `TUBEBR24.dbc` (público, DATASUS), com 113.012 notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - os números (total de contatos);
  - os códigos mantidos como vieram (por exemplo, o município de transferência);
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido".
- **Tamanho e cotas:** 100 células:
  - 64 em listas de códigos (as cotas que não se completam passam para cá);
  - 4 em CNES/CBO, todas da ocupação, que vem preenchida em poucos registros;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261120. Comando: `node validacao/amostra.js --agravo tuberculose --arquivo dados_publicos/tuberculose/TUBEBR24.dbc --semente 20261120`, com o dicionário já conferido e corrigido (commit `6c0ff2e`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 20/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-tuberculose.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- o tipo de entrada, a forma clínica e os agravos associados;
- as populações especiais;
- as baciloscopias de diagnóstico e de acompanhamento;
- a radiografia, o HIV, a terapia antirretroviral, a histopatologia, a cultura e o teste molecular rápido;
- a situação de encerramento;
- colunas com o nome encurtado em relação ao dicionário: AGRAVDROGA, AGRAVTABAC, ANT_RETRO, TEST_MOLEC, BAC_APOS_6, SG_UF_AT e ID_MUNIC_A.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-tuberculose.xlsx` em 20/11/2026, com todas as pendências aprovadas. Ver `docs/inventario-tuberculose.md`.
  - Única correção: na localização extrapulmonar, "1/", "2,", "6/" e "[2" valem como 1, 2, 6 e 2.
- **Fontes:**
  - fonte principal: o dicionário de dados de tuberculose do pacote Docs_TAB_SINAN do DATASUS, com a ficha de 2014 e a tela de acompanhamento;
  - o arquivo de definições do TabWin (TuberculNET5_0.def) ligou as colunas do arquivo aos campos, inclusive as de nome encurtado e as da ficha anterior a 2014.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o TUBEBR25 inteiro (112.482 notificações) foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2020 a 2025:** as principais são:
  - doença relacionada ao trabalho com "0" (cerca de 129 mil registros);
  - código 3 nas populações especiais (profissional de saúde e imigrante);
  - histopatologia 6;
  - poucos valores com letras ou sinais de pontuação.
