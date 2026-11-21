# Conferência por amostra: Surto de doenças transmitidas por alimentos (DTA)

Situação em 19/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para surto de DTA. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `SDTABR23.dbc` (público, DATASUS), com 1.162 surtos. Foi escolhido o ano de 2023 porque ele traz as formas irregulares do surto: texto no lugar do código, às vezes com o acento estragado, campos vazios gravados com bytes nulos e datas de transferência no formato americano.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - o texto livre (agente etiológico, alimento causador, resultados das amostras e campos "especificar");
  - as datas;
  - os números (quantidade de doentes, de amostras etc.);
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido" ou "Inconsistência/Preenchido erroneamente".
- **Tamanho e cotas:** 100 células:
  - 68 em listas de códigos (as 8 da cota de idade passaram para cá, porque o surto não tem coluna de idade);
  - 8 em tabela de apoio (3 da unidade de saúde pelo CNES e 5 da regional de saúde de ocorrência pela tabela de regiões de saúde);
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde e semana calculada).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261119. Comando: `node validacao/amostra.js --agravo surto-dta --arquivo dados_publicos/surto-dta/SDTABR23.dbc --semente 20261119`, com o dicionário já conferido e corrigido (commit `b816fc2`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 19/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-surto-dta.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- o modo de transmissão e o veículo gravados como texto ("Indireta", "Alimento/água" com o acento estragado);
- o local de ingestão (TP_LOCAL, campo 38);
- a coluna ST_IMPRO_ (nome da coluna ST_IMPRO no arquivo de 2023);
- a regional de saúde de ocorrência traduzida pela região de saúde do município.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-surto-dta.xlsx` em 19/11/2026. As decisões sobre TP_LOCAL e NU_RESU_3 foram tomadas no chat. As correções foram aplicadas no mesmo dia (ver `docs/inventario-surto-dta.md`):
  - R699 é lido como R69, "Causas desconhecidas e não especificadas de morbidade"; N199 fica como veio, destacado;
  - ID_RG_RESI traz o código do município de ocorrência e passa a sair com a região de saúde desse município;
  - as datas de transferência de 2022 e 2023 (mês/dia/ano) são convertidas;
  - os acentos estragados do agente etiológico e do alimento causador são consertados;
  - número no NU_RESU_3 (campo 46, texto) sai como "Inconsistência/Preenchido erroneamente";
  - TP_LOCAL ficou confirmado como o campo 38;
  - entraram 28 colunas do dicionário oficial que não vêm no arquivo público, para arquivos que as tragam.
- **Regras novas do programa** (commits `c8664cf` e `bfd8c7e`, registradas em `docs/requisitos.md`, seção 6.2):
  - valor só com bytes nulos vale como campo em branco;
  - conserto de acentos estragados em texto livre, só nas duas formas exatas conhecidas;
  - data no formato mês/dia/ano nas colunas marcadas;
  - número em campo de texto vira inconsistência.

  Todas têm testes automáticos com dados fictícios.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o SDTABR22 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Inconsistências de 2022 a 2025:** as principais são:
  - a data de encerramento "-0010101" (297 registros em 2022 e 2023);
  - os números no NU_RESU_3;
  - o CID N199 (1 registro);
  - alguns códigos de unidade de saúde que não estão no CNES;
  - um município de ocorrência inexistente (539920);
  - o código "0" no local de ingestão (1 registro).
