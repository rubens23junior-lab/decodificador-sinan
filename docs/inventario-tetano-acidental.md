# Inventário das fontes e pendências: Tétano acidental

Documento de trabalho, de 16/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/tetano-acidental/TETACN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Tétano Acidental, campos 31 a 55, revisado em fevereiro de 2012 (10 páginas) | Fonte principal (DICTETA) |
| `docs/fontes/tetano-acidental/TETACN_FICHA.pdf` | Ficha de investigação de Tétano Acidental, Sinan NET, SVS, 27/09/2005 | CID A35, escolaridade e confirmação das categorias (FICHATETA) |
| `docs/fontes/tetano-acidental/TETACN_INSTRUCIONAL.pdf` | Instruções de preenchimento, 27/09/2005 | Apoio (INSTTETA) |
| Dicionário da notificação individual (NOTIF2018) | Já usado nos outros agravos | Campos 1 a 30 e campos internos |

Os PDFs vêm do pacote de documentação do TAB_SINAN, baixado pelo Rubens do site do DATASUS (ver `docs/inventario-docs-tab-sinan.md`).

## Arquivo real

`dados_publicos/tetano-acidental/TETABR24.dbc`, baixado pelo Rubens em 16/11/2026. Ele aparece no site do DATASUS como "Dados - Preliminares"; os anos de 2015 a 2023 são finais. Tem 613 registros e 65 colunas.

- As colunas da notificação (campos 1 a 30 e internos) vêm do dicionário de LV, já conferido.
- As colunas próprias do tétano acidental foram transcritas do DICTETA. A conclusão (classificação final, local provável de infecção, autoctonia e evolução) também, porque tem categorias próprias do agravo; ela não foi copiada da LV.
- O DICTETA cita colunas que não vêm no arquivo público (`CODISINF`, `CO_BAINFC`, `NOBAIINF`).
- O microdatasus 3.0.0 não tem função de tradução para tétano. A validação fica com a conferência do Rubens e a amostra conferida à mão.

## O que o arquivo traz de diferente

- **`CLASSI_FIN` = 8** em 50 registros. Nenhuma fonte de tétano acidental lista o 8, e o Anexo I do NOTIF2018 não tem linha de tétano acidental.
- **`SG_UF`** (UF de residência) vem como sigla (179 registros) ou em branco (434), e nunca como código numérico. Fica como veio. O município de residência está preenchido em todos os registros.
- **`SG_UF_INTE` e `NM_MUNIC_H`**: as fontes falam em sigla e nome, mas o arquivo traz os códigos do IBGE, e eles são traduzidos pelas tabelas do IBGE.
- Todos os outros códigos do arquivo estão nas fontes.

## Outros anos (16/11/2026)

O Rubens baixou também TETABR23 (532 registros, final) e TETABR25 (660 registros, preliminar). Ambos têm as mesmas 65 colunas de 2024. A prévia confirmou o mesmo padrão:

- classificação final 8: 41 registros em 2023 e 55 em 2025, que saem como "Inconsistência/Não Preenchido";
- UF de residência em sigla ou em branco (2023: 180 e 352; 2025: 188 e 472);
- poucos códigos de ocupação sem nome (2 e 6) e uma unidade de saúde sem nome no CNES em 2025.

Como nos outros agravos, a amostra de validação pode ser sorteada do arquivo mais recente (TETABR25).

## Pendências

Estão na aba Pendências da planilha `docs/conferencia/conferencia-tetano-acidental.xlsx`.

## Conferência e validação (16/11/2026)

- Dicionário conferido pelo Rubens, com as correções aplicadas no mesmo dia.
- Teste no navegador sem erros e sem conexões externas.
- Conferência por amostra: 0 erros em 100 células (IC 95% de 0% a 3,62%) (`docs/validacao/relatorio-conferencia-amostra-tetano-acidental.md`).
