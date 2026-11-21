# Inventário das fontes e pendências: Toxoplasmose congênita e toxoplasmose gestacional

Documento de trabalho, de 21/11/2026.

## Fontes

Não existe dicionário de dados próprio das toxoplasmoses (informação do Rubens). As fichas são de Notificação/Conclusão, o modelo genérico do Sinan NET, como na sífilis adquirida.

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/toxoplasmose-congenita/Ficha de Notificação Toxoplasmose Congênita P37.1 SINAN MG_2019.pdf` | Ficha de Notificação/Conclusão, versão da SES-MG de 05/07/2019 | Fonte (FICHATOXC) |
| `docs/fontes/toxoplasmose-gestacional/toxoplasmose-gestacional-ficha-de-notificacao.pdf` | Ficha de Notificação/Conclusão, CID O98.6, versão da SES-MG de 05/07/2019. O PDF não tem texto e foi lido pela imagem da página | Fonte (FICHATOXG) |
| `docs/fontes/notificacao-individual/` | Dicionário da notificação individual (NOTIF2018) | Campos 1 a 30 e internos |

As fichas foram colocadas pelo Rubens em docs/fontes em 20/11/2026.

## Arquivos reais

| Arquivo | Notificações | CIDs |
|---|---|---|
| `TOXCBR22` a `25` | 4.583, 6.600, 7.403, 7.279 | P37.1 (maioria), B58, O98.6 |
| `TOXGBR22` a `25` | 12.447, 15.023, 15.392, 14.818 | O98.6 (maioria), B58 (cerca de 22%), P37.1 |

Os dois agravos têm 38 colunas, iguais nos dois.

## Regra nova: aviso de B58 em gestante (Rubens, 21/11/2026)

O Rubens foi referência regional de toxoplasmose na microrregião de Pirapora e trabalhou na qualificação dessas notificações. A orientação era que, quando a pessoa é gestante, o CID B58 (toxoplasmose) fosse trocado por O98.6 (toxoplasmose gestacional).

Por isso, quando o CID é B58 e o campo Gestante indica gestação (1º, 2º ou 3º trimestre ou idade gestacional ignorada), o programa:

- mantém o CID como veio;
- mostra o aviso de possível toxoplasmose gestacional numa coluna extra, destacado e contado nas Inconsistências.

Isso exigiu uma regra nova no programa ("alerta_condicional"), registrada em `docs/requisitos.md`.

Na prévia, 12.805 notificações do arquivo da gestacional receberam o aviso. No arquivo da congênita, nenhuma, porque ali o campo Gestante vem quase sempre como "Não se aplica".

## Pendências

Estão na aba Pendências das planilhas `docs/conferencia/conferencia-toxoplasmose-congenita.xlsx` e `conferencia-toxoplasmose-gestacional.xlsx`.
