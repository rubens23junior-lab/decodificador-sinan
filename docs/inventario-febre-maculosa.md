# Inventário das fontes e pendências: Febre maculosa

Documento de trabalho, de 20/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/febre-maculosa/FMACUN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0 (campos 31 a 63), revisado em março/2012 | Fonte principal (DICFMAC) |
| `docs/fontes/febre-maculosa/FMACUN_FICHA.pdf` | Ficha de investigação, SVS 19/09/2006 | Apoio (FICHAFMAC) |
| `docs/fontes/febre-maculosa/FMACUN_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio (INSTFMAC) |
| `docs/fontes/tabelas-apoio/TAB_SINANNET/FMacNet.def` | Definições do TabWin | Confirma as colunas (TABFMAC) |

Os PDFs vêm do pacote Docs_TAB_SINAN (pasta Downloads) e foram copiados para o projeto em 20/11/2026.

## Arquivos reais

| Arquivo | Notificações |
|---|---|
| `FMACBR23.dbc` | 17.942 |
| `FMACBR24.dbc` | 9.962 |
| `FMACBR25.dbc` | 11.010 |

Os três arquivos têm as mesmas 95 colunas. O dicionário tem 101: as 95 do arquivo mais 6 do DICFMAC que não vêm no arquivo público.

As colunas da notificação, os campos internos e a autoctonia foram copiados da leptospirose, que tem a mesma estrutura.

## O que os arquivos trazem de diferente

- **Classificação final:** vem "8" em 2.272 notificações (6%).
- **Critério:** vem "3" (Clínico) em 163 notificações. A categoria existe na ficha, mas o DICFMAC a dá como inválida na versão 4.0.
- **UF do hospital:** coluna mista, com código numérico e, às vezes, a sigla ES.
- **Agente:** vem como texto com número e nome.
- **IDENT_MICR:** coluna sem descrição em nenhuma fonte, sempre vazia.

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-febre-maculosa.xlsx`.
