# Conferência por amostra

Situação em 02/11/2026. Esta é a segunda parte da validação para uso científico (seção 13 dos requisitos), depois da comparação com o microdatasus (`relatorio-comparacao-microdatasus.md`).

## Método

- **Arquivos:** os públicos do DATASUS, os mesmos da comparação com o microdatasus:
  - `DENGBR25.dbc`;
  - `CHIKBR25.dbc`;
  - `ZIKABR25.dbc`;
  - `LTANBR25.dbc`;
  - `LVH.csv`.
- **Unidade:** a célula, isto é, um registro em uma coluna, cujo código a ferramenta traduziu. Ficam de fora os campos vazios, o texto livre, as datas e os códigos sem tradução (pendências).
- **Tamanho:** 100 células por agravo, 500 no total.
- **Cotas por tipo de coluna, em cada agravo:**
  - 60 em listas de códigos;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 8 em CNES/CBO;
  - 10 em colunas extras (região e macrorregião de saúde).

  Quando um tipo não tem células suficientes, a sobra vai para as listas de códigos.
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261102. A amostra pode ser refeita: `node validacao/amostra.js`.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 02/11/2026. Cada célula foi conferida no documento oficial de `docs/fontes`, ou na consulta pública do CNES, e marcada como SIM ou NÃO.
- **Revisão das divergências:** cada NÃO foi revisto contra todas as fontes oficiais do projeto. A decisão ficou registrada em `docs/validacao/revisao-amostra.json`, com o motivo. A marcação original continua intacta na planilha.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson). O cálculo é feito por `node validacao/resultado-amostra.js`.

## Resultado

| Agravo | Células | Erros na conferência inicial | Erros após a revisão | Taxa de erro após a revisão (IC 95%) |
|---|---|---|---|---|
| Dengue | 100 | 0 | 0 | 0% (0% a 3,62%) |
| Chikungunya | 100 | 2 | 0 | 0% (0% a 3,62%) |
| Zika | 100 | 0 | 0 | 0% (0% a 3,62%) |
| Leishmaniose Tegumentar Americana | 100 | 0 | 0 | 0% (0% a 3,62%) |
| Leishmaniose Visceral | 100 | 0 | 0 | 0% (0% a 3,62%) |
| **Total** | **500** | **2 (0,40%; IC 95%: 0,05% a 1,44%)** | **0** | **0% (0% a 0,74%)** |

## As duas divergências

- **Onde:** linhas 109 e 110 da amostra. Ambas são o mesmo código, `CLASSI_FIN` = 13 em chikungunya, que a ferramenta traduziu como "Chikungunya".
- **Por que foram marcadas como NÃO:** a coluna "Onde conferir" indicava a regra do campo 73 do DIC2024 (p. 11). Ali o código 13 é citado, mas a lista do próprio campo `CLASSI_FIN` (seq. 70) só traz 0, 1, 2, 8 e 9.
- **Revisão:** a ficha de investigação oficial (`Ficha_DENGCHIK_FINAL.pdf`, p. 2, campo 62 "Classificação") traz "13- Chikungunya". O texto da ferramenta, portanto, tem base oficial. A falha estava na indicação da fonte, que apontava a mais fraca. O Rubens conferiu a ficha e revisou as duas células para SIM.
- **Correção:** nos dicionários de dengue e chikungunya, a fonte do código 13 passou a ser a ficha de 2016, campo 62, com a regra do DIC2024 citada como apoio. O texto traduzido não mudou.

## Limitações

- A conferência foi feita por uma só pessoa e às claras, ou seja, vendo o texto da ferramenta. Não houve segundo conferente.
- Com 0 erros em 100 células por agravo, o limite superior do intervalo, 3,62%, mede só o tamanho da amostra. Ele não indica erros encontrados.
- A amostra cobre células traduzidas. Os códigos sem fonte oficial, que ficam como pendência, foram avaliados à parte, na comparação com o microdatasus.
