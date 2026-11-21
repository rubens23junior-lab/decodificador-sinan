# Conferência por amostra: Sífilis congênita

Situação em 18/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para sífilis. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`), da hanseníase e do tétano.

- **Arquivo:** `SIFCBR25.dbc` (público, DATASUS, dados preliminares), com 12.630 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - o texto livre (inclusive o texto escrito em "outro sinal – especificar");
  - as datas;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido".
- **Tamanho e cotas:** 100 células:
  - 68 em listas de códigos. A cota é 60; as 8 de CNES/CBO passaram para cá, porque no arquivo de 2025 nenhuma ocupação foi traduzida (12.549 registros em branco e 81 com códigos de 3 a 5 dígitos que não estão na CBO) e não há outro campo com CNES;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras. Entre elas está a semana epidemiológica do diagnóstico, calculada pela data do diagnóstico (3 células).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261118. Comando: `node validacao/amostra.js --agravo sifilis-congenita --arquivo dados_publicos/sifilis-congenita/SIFCBR25.dbc --semente 20261118`, na versão do commit `9f2a26d`, com o dicionário já conferido.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 18/11/2026, contra os documentos oficiais de `docs/fontes`. A semana calculada foi conferida no calendário epidemiológico. A planilha está em `docs/validacao/amostra-conferencia-sifilis-congenita.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu as duas formas de UF que o arquivo traz: código numérico ("32", Espírito Santo) e sigla ("SP" e "PA").

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-sifilis-congenita.xlsx` em 17 e 18/11/2026, com as correções aplicadas em 18/11/2026 (ver `docs/inventario-sifilis.md`).
- **Semana epidemiológica calculada:** antes de entrar no programa, a regra foi comparada com as semanas que o próprio Sinan grava nos arquivos públicos. Foram cerca de 2,5 milhões de registros de dengue, chikungunya, violência, sífilis congênita e hanseníase, e todas as semanas foram iguais.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o SIFCBR25 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Arquivos de 2024 e 2025:**
  - Nos dois, as colunas de UF e o agravo não tiveram nenhuma inconsistência.
  - As principais inconsistências são:
    - o código 4 nos testes de sangue periférico e de líquor, que sai como "Inconsistência/Não Preenchido";
    - datas de teste com o ano errado (por exemplo, "00241221");
    - códigos de ocupação de 4 ou 5 dígitos.

## Alteração depois da conferência (19/11/2026)

Na conferência da meningite, o Rubens decidiu que a UF que vem em sigla fica só com a sigla, em todos os agravos. Na sífilis congênita, isso mudou as colunas UF_PRE_NAT e ANT_UF_CRI, que misturam sigla e código numérico:

- antes (18/11/2026): sigla e código saíam com o nome da UF;
- agora (19/11/2026): a sigla fica como veio e o código numérico sai com a sigla correspondente, pela mesma tabela de UFs do DATASUS (`tb_uf.csv`). A lista nova foi montada direto dessa tabela e tem os mesmos 27 pares de código e sigla da lista conferida.

Três células da amostra são dessas colunas. A ligação entre código e UF conferida pelo Rubens não mudou; mudou só o texto da saída:

| Nº | Coluna | Código original | Texto conferido em 18/11 | Texto a partir de 19/11 |
|---|---|---|---|---|
| 4 | ANT_UF_CRI | 32 | Espírito Santo | ES |
| 99 | UF_PRE_NAT | SP | São Paulo | SP |
| 100 | UF_PRE_NAT | PA | Pará | PA |

Por decisão do Rubens (19/11/2026), a amostra não foi sorteada de novo: a mudança fica registrada aqui, e o resultado (0 erros em 100) continua valendo. Depois da mudança, o SIFCBR25 inteiro foi processado de novo no Edge, sem erros e sem conexão de rede. Nas duas colunas, todas as siglas saíram iguais às do arquivo, e os 351 registros com o código 32 saíram como ES.
