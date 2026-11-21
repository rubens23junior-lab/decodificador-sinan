# Inventário das fontes e pendências: Tétano neonatal

Documento de trabalho, de 16/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/tetano-neonatal/TETANN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Tétano Neonatal, campos 31 a 62, revisado em abril de 2012 (16 páginas) | Fonte principal (DICTETN) |
| `docs/fontes/tetano-neonatal/TETANN_FICHA.pdf` | Ficha de investigação de Tétano Neonatal, Sinan NET, SVS, 27/09/2005 | CID A33, rótulos completos da evolução e confirmação das categorias (FICHATETN) |
| `docs/fontes/tetano-neonatal/TETANN_INSTRUCIONAL.pdf` | Instruções de preenchimento, 27/09/2005 | Apoio (INSTTETN) |
| Dicionário da notificação individual (NOTIF2018) | Já usado nos outros agravos | Campos 1 a 30 e campos internos |

Os PDFs vêm do pacote de documentação do TAB_SINAN, baixado pelo Rubens do site do DATASUS (ver `docs/inventario-docs-tab-sinan.md`).

## Arquivo real

`dados_publicos/tetano-neonatal/TETNBR24.dbc`, baixado pelo Rubens em 16/11/2026, "Dados - Preliminares". Tem **1 notificação** e 83 colunas. Com esse único registro, a prévia não mostrou nenhuma inconsistência. Ainda assim, um registro só não basta para saber quais códigos aparecem de fato, nem para sortear a amostra de 100 células. O DATASUS tem arquivos de 2015 a 2026 (finais até 2022), e é preciso juntar vários anos.

- As colunas da notificação (campos 1 a 30 e internos) são as mesmas do tétano acidental, que as copiou da LV. A UF de residência vem aqui como código numérico, por isso usa a definição da LV (no acidental ela vem como sigla).
- Todas as colunas próprias do neonatal e as da conclusão foram transcritas do DICTETN. Elas não foram copiadas do acidental, mesmo quando a coluna tem o mesmo nome:
  - a ocupação é **da mãe**;
  - `CS_RISO` é a **contratura labial**, e não o riso sardônico;
  - a evolução 2 é "óbito por **tétano neonatal**".
- O DICTETN cita colunas que não vêm no arquivo público (`CODISINF`, `CO_BAINFC`, `NOBAIINF`).
- O microdatasus 3.0.0 não tem função de tradução para tétano.

## Anos anteriores (16/11/2026)

O Rubens baixou também TETNBR15 a TETNBR23 e TETNBR25. Somando de 2015 a 2025 são **16 notificações**: 0 em 2015, 2018, 2019 e 2021; 1 em 2016, 2017, 2020 e 2024; 4 em 2022; 5 em 2023; 3 em 2025 (preliminar). Na prévia, a única inconsistência foi uma classificação final 8 em 2023, que sai como "Inconsistência/Não Preenchido" (mesma regra do tétano acidental).

- Os arquivos de 2015 a 2019 trazem `DT_NASC` (data de nascimento completa) no lugar de `ANO_NASC`. Também não trazem `CS_SEXO` nem `CS_GESTANT`. `DT_NASC` entrou no dicionário como data, pela definição do NOTIF2018 (campo 9).
- Com tão poucas notificações, não dá para sortear 100 células. A proposta é conferir **todas** as células traduzidas das 16 notificações (censo).

## Pendências

Estão na aba Pendências da planilha `docs/conferencia/conferencia-tetano-neonatal.xlsx`.

## Conferência e validação (16/11/2026)

- Dicionário conferido pelo Rubens, com as correções aplicadas no mesmo dia.
- Teste no navegador sem erros e sem conexões externas.
- Conferência por amostra: 0 erros em 100 células (IC 95% de 0% a 3,62%) (`docs/validacao/relatorio-conferencia-amostra-tetano-neonatal.md`).
