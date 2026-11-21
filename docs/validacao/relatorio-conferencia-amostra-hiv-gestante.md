# Conferência por amostra: HIV em gestante

Situação em 20/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para HIV em gestante. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `HIVGBR23.dbc` (público, DATASUS, preliminar), com 8.474 notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - a UF do pré-natal, que vem em sigla e fica como veio;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido" ou "Inconsistência/Preenchido erroneamente".
- **Tamanho e cotas:** 100 células:
  - 68 em listas de códigos (as 8 da cota de CNES/CBO passaram para cá, porque o arquivo público não traz unidade de saúde nem ocupação);
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde e semana calculada).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261120. Comando: `node validacao/amostra.js --agravo hiv-gestante --arquivo dados_publicos/hiv-gestante/HIVGBR23.dbc --semente 20261120`, com o dicionário já conferido e corrigido (commit `dd5d693`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 20/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-hiv-gestante.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- a evidência laboratorial do HIV;
- o pré-natal e o uso de antirretrovirais;
- o tipo do parto, a profilaxia no parto, a evolução da gravidez e o início da profilaxia na criança;
- a UF do parto, que sai em sigla;
- a semana do diagnóstico calculada pela data.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-hiv-gestante.xlsx` em 20/11/2026, com as correções aplicadas no mesmo dia (ver `docs/inventario-hiv.md`):
  - a data do campo 7 passou a se chamar "Data do diagnóstico ou da evidência laboratorial e/ou clínica";
  - na evolução da gravidez (1 a 4) e no início da profilaxia na criança (1 a 4 e 9), qualquer outro código sai como "Inconsistência/Preenchido erroneamente".
- **Fontes:**
  - fonte principal: o dicionário de dados de gestante HIV (o mesmo arquivo do pacote Docs_TAB_SINAN do DATASUS);
  - apoio: a ficha e o instrucional de 2006;
  - o arquivo de definições do TabWin (HivGestNET.def) confirmou a ligação de cada coluna com o campo da ficha.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o HIVGBR24 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2022 a 2024:** as principais são:
  - datas de início dos antirretrovirais com o ano errado (por exemplo "02021203"), cerca de 25 no total;
  - um município do parto inexistente;
  - um município de residência sem região de saúde.
