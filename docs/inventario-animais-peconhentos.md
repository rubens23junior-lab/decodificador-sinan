# Inventário das fontes e pendências: Acidentes por animais peçonhentos

Documento de trabalho, de 20/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/animais-peconhentos/ANIMPN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0 (campos 31 a 59), revisado em julho/2010 | Fonte principal (DICANIM) |
| `docs/fontes/animais-peconhentos/ANIMPN_FICHA.pdf` | Ficha de investigação, SVS 19/01/2006 | Apoio (FICHAANIM) |
| `docs/fontes/animais-peconhentos/ANIMPN_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio (INSTANIM) |
| `docs/fontes/animais-peconhentos/ANIMPN_CADERNO_ANALISES.pdf` | Caderno de análises | Referência |
| `docs/fontes/tabelas-apoio/TAB_SINANNET/AnimaispNET.DEF` | Definições do TabWin | Confirma as colunas, inclusive o soro de cada coluna de ampolas (TABANIM) |

Os PDFs vêm do pacote Docs_TAB_SINAN (pasta Downloads) e foram copiados para o projeto em 20/11/2026.

## Arquivos reais

| Arquivo | Notificações |
|---|---|
| `ANIMBR21.dbc` | 262.723 |
| `ANIMBR22.dbc` | 298.821 |
| `ANIMBR23.dbc` | 352.994 |
| `ANIMBR24.dbc` | 346.576 |

Os quatro arquivos têm as mesmas 75 colunas. O dicionário tem 78: as 75 do arquivo mais 3 do DICANIM que não vêm no arquivo público.

As colunas da notificação foram copiadas da meningite, dicionário já conferido.

## O que os arquivos trazem de diferente

- **Nomes de colunas:** NU_AMPO_5 e NU_AMPO_7 têm no arquivo um nome diferente do DICANIM (NU_AMPOL_5 e NU_AMPOL_7). O .def registra essa correção em 2008.
- **Complicação local:** COM_COMPOR, chamada de COM_COMPAR no DICANIM.
- **Tempo de coagulação:** o 9 quer dizer "Não realizado", e não "Ignorado".
- **Prévia:** muito limpa. Só aparecem códigos de ocupação fora da CBO (10001 e 999990), poucos municípios sem região de saúde e idades acima do limite.

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-animais-peconhentos.xlsx`.
