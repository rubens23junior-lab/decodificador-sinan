# Conferência por amostra: Hepatites virais

Situação em 19/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para hepatites. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `HEPABR23.dbc` (público, DATASUS), com 33.206 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - o texto livre (outra fonte de infecção);
  - as datas;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido" ou "Inconsistência/Preenchido erroneamente".
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos (inclusive marcadores sorológicos, exposições, classificação final, forma clínica e etiologia);
  - 8 em CNES/CBO (todas da ocupação, porque o arquivo não traz a unidade de saúde);
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde e semana calculada).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261119. Comando: `node validacao/amostra.js --agravo hepatites-virais --arquivo dados_publicos/hepatites-virais/HEPABR23.dbc --semente 20261119`, com o dicionário já conferido e corrigido (commit `e148c25`; as mudanças seguintes, `a52df4c` e `5b1b1d0`, não alteram nenhuma tradução do arquivo público).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 19/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-hepatites-virais.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu o HCV-RNA (TP_SOROHCV), a etiologia pelo vírus C (HCV), a forma clínica, o genótipo e uma semana da notificação calculada pela data.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-hepatites-virais.xlsx` em 19/11/2026. Correções aplicadas no mesmo dia (ver `docs/inventario-hepatites-virais.md`):
  - data do campo 7 com o nome "Data do diagnóstico ou dos primeiros sintomas", e a orientação de leitura do Rubens registrada na observação da coluna;
  - 9, 09 e 99 = Ignorado na gestante e na forma clínica;
  - código 3 em HIV e em outras DSTs = "Inconsistência/Preenchido erroneamente";
  - exposições do campo 38 com os nomes da ficha;
  - CLASSI_FIN com o nome "Classificação final ajustada";
  - HAV a HEV com o nome do vírus;
  - classificação etiológica (CLAS_ETIOL, campo 50) incluída para arquivos que a tragam, com 09 = Outras hepatites virais.
- **Fonte de apoio:** o arquivo de definições do TabWin para hepatites (HepavirNET.def, pacote TAB_SINANNET) confirmou a ligação de cada coluna com o campo da ficha.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o HEPABR23 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2021 a 2023:** as principais são:
  - datas com o ano errado (por exemplo, "02021215") nas datas de coleta e do acidente;
  - o código 5 nas sorologias do banco de sangue (106 registros);
  - códigos de ocupação fora da CBO (10001, 999990);
  - 18 registros com a UF de residência "99";
  - poucos municípios sem região ou macrorregião de saúde.
