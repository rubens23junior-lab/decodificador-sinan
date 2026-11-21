# Conferência por amostra: Atendimento antirrábico humano

Situação em 21/11/2026. Não houve comparação com outro método (como o pacote microdatasus). Para este agravo, a validação é a conferência do dicionário linha por linha mais esta conferência por amostra.

## Método

O método é o mesmo da versão 1.0 (`relatorio-conferencia-amostra.md`) e dos outros agravos novos.

- **Arquivo:** `ANTRBR24.dbc` (público, DATASUS), com 779.311 notificações. É o ano com mais notificações.
- **Unidade:** a célula, isto é, um registro em uma coluna cujo código a ferramenta traduziu. Ficam de fora:
  - os campos vazios;
  - as datas;
  - os textos livres;
  - os códigos sem tradução, entre eles os que saem como "Inconsistência/Não Preenchido".
- **Tamanho e cotas:** 100 células:
  - 60 em listas de códigos;
  - 8 em CNES/CBO (unidade notificadora e ocupação);
  - 8 em idade;
  - 8 em município;
  - 6 em UF;
  - 10 em colunas extras (região e macrorregião de saúde).
- **Sorteio:** uniforme dentro de cada tipo (amostragem por reservatório), com o gerador mulberry32 e a semente fixa 20261121. Comando: `node validacao/amostra.js --agravo atendimento-antirrabico --arquivo dados_publicos/atendimento-antirrabico/ANTRBR24.dbc --semente 20261121`, com o dicionário já conferido (commit `b9fe1c0`).
- **Conferência:** feita às claras pelo Rubens Araujo da Silva Junior, em 21/11/2026, contra os documentos oficiais de `docs/fontes`. A planilha está em `docs/validacao/amostra-conferencia-atendimento-antirrabico.xlsx`.
- **Estatística:** taxa de erro com intervalo de confiança de 95% exato (Clopper-Pearson).

## Resultado

| Células conferidas | Corretas | Erros | Taxa de erro | IC 95% |
|---|---|---|---|---|
| 100 | 100 | 0 | 0% | 0% a 3,62% |

Nenhuma divergência foi encontrada. A amostra incluiu:

- o tipo de exposição (mordedura, arranhadura e outro);
- a localização e o tipo do ferimento;
- a espécie e a condição do animal agressor;
- os antecedentes de tratamento antirrábico;
- o tratamento indicado, a interrupção e o evento adverso à vacina;
- o CID do agravo.

## Outras verificações

- **Dicionário:** conferido pelo Rubens na planilha `docs/conferencia/conferencia-atendimento-antirrabico.xlsx` em 21/11/2026. Todas as pendências foram aprovadas sem correção (ver `docs/inventario-atendimento-antirrabico.md`).
- **Fontes:** não há dicionário de dados deste agravo no pacote Docs_TAB_SINAN. As fontes são:
  - a ficha de investigação do Sinan NET (`anti_rabico_v5.pdf`, Portal do Sinan);
  - o AntirabNET.def do TabWin.
- **Teste no navegador** (Microsoft Edge, ferramenta empacotada): o ANTRBR24 inteiro foi processado sem erros na página e sem nenhuma conexão de rede.
- **Particularidades dos arquivos de 2020 a 2024:**
  - a data da 5ª dose é sempre igual à da 4ª;
  - as colunas DT_VAC_1 a 5 não têm descrição em nenhuma fonte e vêm vazias;
  - vários campos (laboratório e lote da vacina, soro, peso) vêm sempre vazios no arquivo público;
  - há cerca de 90 registros com "9" em cada coluna de localização, código que a ficha não tem. Eles saem como "Inconsistência/Não Preenchido".
