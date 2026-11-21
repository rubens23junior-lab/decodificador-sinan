# Conferência por amostra: Sífilis adquirida

Situação em 18/11/2026. O pacote microdatasus (versão 3.0.0) não tem função de tradução para sífilis. Por isso não houve comparação com outro método, e a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e das outras sífilis.

- **Arquivo:** `SIFABR25.dbc` (público, DATASUS, dados preliminares), com 133.759 registros.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - o texto livre;
  - as datas;
  - os códigos sem tradução: o "8" da classificação final, que sai como "Inconsistência/Não Preenchido", e o "99" da escolaridade, que fica como veio.
- **Tamanho e cotas:** 100 células:
  - 68 em listas de códigos. A cota é 60; as 8 de CNES/CBO passaram para cá, porque no arquivo de 2025 a ocupação vem sempre em branco e não há campo com CNES;
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261118. Comando: `node validacao/amostra.js --agravo sifilis-adquirida --arquivo dados_publicos/sifilis-adquirida/SIFABR25.dbc --semente 20261118`, na versão do commit `85253ca`, com o dicionário já conferido.
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 18/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-sifilis-adquirida.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-sifilis-adquirida.xlsx` em 18/11/2026, sem correções (ver `docs/inventario-sifilis-adquirida.md`).
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o SIFABR25 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Prévia com 2023, 2024 e 2025:** o mesmo padrão nos três anos. As inconsistências relevantes são:
  - a classificação final 8 (33.406, 30.443 e 12.589 registros), que sai como "Inconsistência/Não Preenchido";
  - a escolaridade 99 (84.873, 86.383 e 43.403), que fica como veio;
  - poucos municípios de residência sem região ou macrorregião de saúde.
