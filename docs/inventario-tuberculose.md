# Inventário das fontes e pendências: Tuberculose

Documento de trabalho, de 20/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/tuberculose/TUBEN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, tuberculose (campos 31 a 66, sem data impressa) | Fonte principal (DICTUBE) |
| `docs/fontes/tuberculose/TUBEN_FICHA.pdf` | Ficha de notificação/investigação, SVS 02/10/2014 | Apoio (FICHATUBE) |
| `docs/fontes/tuberculose/TUBEN_FICHA_ACOMP.pdf` | Tela de acompanhamento, SVS 09/01/2014 | Apoio (ACOMPTUBE) |
| `docs/fontes/tuberculose/TUBEN_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio (INSTTUBE) |
| `docs/fontes/tuberculose/TUBEN_CADERNO_ANALISE.pdf` | Caderno de análise | Referência |
| `docs/fontes/tabelas-apoio/TAB_SINANNET/TuberculNET5_0.def` | Definições do TabWin e conversões | Liga as colunas aos campos e dá os códigos dos campos antigos (TABTUBE) |

Os PDFs vêm do pacote Docs_TAB_SINAN (pasta Downloads) e foram copiados para o projeto em 20/11/2026.

## Arquivos reais

| Arquivo | Notificações |
|---|---|
| `TUBEBR20.dbc` | 86.160 |
| `TUBEBR21.dbc` | 91.415 |
| `TUBEBR22.dbc` | 103.382 |
| `TUBEBR23.dbc` | 109.919 |
| `TUBEBR24.dbc` | 113.012 |
| `TUBEBR25.dbc` | 112.482 |

Os seis arquivos têm as mesmas 94 colunas. O dicionário tem 105 colunas: as 94 do arquivo mais 11 do DICTUBE que não vêm no arquivo público.

## O que os arquivos trazem de diferente

- **Nomes encurtados:** várias colunas têm no arquivo um nome mais curto que o do DICTUBE (por exemplo, TEST_MOLEC no arquivo e TESTE_MOLEC no dicionário).
- **Colunas da ficha antiga:** o arquivo ainda traz colunas da ficha anterior à de 2014 (drogas do tratamento, teste tuberculínico, situação no 9º e 12º mês, entre outras). Estão quase sempre vazias.
- **CID cortado:** "A16." em 2% dos registros, provavelmente a forma "A16.9" cortada pelo tamanho do campo.
- **Município de transferência:** vem só com os 2 dígitos da UF.
- **Doença relacionada ao trabalho:** vem "0" em cerca de 129 mil registros.
- **Código 3 nas populações especiais:** aparece em profissional de saúde (27 mil registros) e em imigrante (2.150).

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-tuberculose.xlsx`.
