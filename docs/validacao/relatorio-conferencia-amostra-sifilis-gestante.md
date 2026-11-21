# Conferência por amostra: Sífilis em gestante

Situação em 18/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para sífilis. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`), da hanseníase e do tétano.

- **Arquivo:** `SIFGBR25.dbc` (público, DATASUS, dados preliminares), com 48.929 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - o texto livre;
  - as datas;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido".
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 8 em CNES/CBO;
  - 10 em colunas extras. Entre elas está a semana epidemiológica do diagnóstico, calculada pela data do diagnóstico (4 células).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261118. Comando: `node validacao/amostra.js --agravo sifilis-gestante --arquivo dados_publicos/sifilis-gestante/SIFGBR25.dbc --semente 20261118`, na versão do commit `9f2a26d`, com o dicionário já conferido.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 18/11/2026, contra os documentos oficiais de `docs/fontes`. A semana calculada foi conferida no calendário epidemiológico. A planilha está em `docs/validacao/amostra-conferencia-sifilis-gestante.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-sifilis-gestante.xlsx` em 17 e 18/11/2026, com as correções aplicadas em 18/11/2026 (ver `docs/inventario-sifilis.md`).
- **Semana epidemiológica calculada:** antes de entrar no programa, a regra foi comparada com as semanas que o próprio Sinan grava nos arquivos públicos. Foram cerca de 2,5 milhões de registros de dengue, chikungunya, violência, sífilis congênita e hanseníase, e todas as semanas foram iguais.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o SIFGBR25 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Arquivos de 2024 e 2025:** os dois foram processados. As principais inconsistências são:
  - códigos de ocupação com ponto (por exemplo, "9999.9" e "5211.1"), que não estão na CBO e ficam como vieram;
  - poucos códigos de município e de idade fora do formato.
