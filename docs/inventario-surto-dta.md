# Inventário das fontes e pendências: Surto de DTA

Documento de trabalho, de 19/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/surto-dta/SDTA_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Surto/DTA, revisado em fevereiro de 2012 | Fonte principal (DICSDTA) |
| `docs/fontes/surto-dta/SDTA_FICHA.pdf` | Ficha de investigação de surto de DTA, Sinan NET, SVS 08/06/2006 | Rótulos dos campos 9, 34 a 38 e 58 (FICHASDTA) |
| `docs/fontes/surto-dta/AJUSTE-DICIONARIO-DE-DADOS-DA-FICHA-DE-SURTO-DTA.pdf` | Ajuste do dicionário pela Nota Técnica nº 45/2024: agente etiológico (AGENTE_ET1 a 3) e alimento causador (ALIMENTO_C) | AJUSTESDTA |
| `docs/fontes/tabelas-apoio/TAB_SINANNET/DTANet.def` | Definições do TabWin para surto de DTA | Confirma os nomes das colunas (SINANNET_SDTA) |

As três primeiras vêm do pacote Docs_TAB_SINAN do DATASUS e foram copiadas para o projeto em 19/11/2026.

## Arquivos reais

| Arquivo | Surtos |
|---|---|
| `SDTABR22.dbc` | 811 |
| `SDTABR23.dbc` | 1.162 |
| `SDTABR24.dbc` | 1.331 |
| `SDTABR25.dbc` | 1.402 |

- Cada registro é um surto. O tipo de notificação é sempre 3 (surto), e o CID muda de surto para surto (22 códigos, sobretudo A08 e A09). Por isso o programa reconhece o arquivo pelo tipo de notificação.
- Os quatro arquivos têm 102 colunas, mas a ordem e o tipo das colunas mudam de ano para ano, e no arquivo de 2023 a coluna ST_IMPRO se chama ST_IMPRO_.
- O microdatasus 3.0.0 não tem função de tradução para surto de DTA (levantamento de 15/11/2026).
- Gerador: `ferramentas/geradores-dicionarios/gerar-surto-dta.mjs`.

## O que os arquivos trazem de diferente

- **Campos vazios com bytes nulos** em 2022 e 2023 (pendência principal: depende de mudar o programa).
- **Texto no lugar do código** em 2022 a 2024 (modo de transmissão, veículo e fatores causais), às vezes com o acento estragado ("NÆo", "NÃ£o", "Alimento/ gua").
- **Datas de transferência em formato americano** (mês/dia/ano) em 2022 e 2023.
- **Data de encerramento "-0010101"** em 297 registros de 2022 e 2023.
- **ID_RG_RESI** traz o código do município de ocorrência, não o da regional.
- **SEM_PRI, DT_DIGITA e DTTRANSRM** vêm "0" ou em branco em todos os registros.
- **Agente etiológico e alimento causador** são texto livre e ficam como vieram.

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-surto-dta.xlsx`.
