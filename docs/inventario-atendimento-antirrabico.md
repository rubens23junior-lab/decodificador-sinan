# Inventário das fontes e pendências: Atendimento antirrábico humano

Documento de trabalho, de 21/11/2026.

## Fontes

Não há dicionário de dados deste agravo no pacote Docs_TAB_SINAN.

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/atendimento-antirrabico/anti_rabico_v5.pdf` | Ficha de investigação de atendimento anti-rábico humano, Sinan NET, SVS 27/09/2005, baixada pelo Rubens do Portal do Sinan | Fonte (FICHAANTR) |
| `docs/fontes/tabelas-apoio/TAB_SINANNET/AntirabNET.def` | Definições do TabWin e conversões | Liga cada coluna ao campo e dá os códigos (TABANTR) |

## Arquivos reais

| Arquivo | Notificações |
|---|---|
| `ANTRBR20.dbc` | 575.884 |
| `ANTRBR21.dbc` | 637.187 |
| `ANTRBR22.dbc` | 688.125 |
| `ANTRBR23.dbc` | 755.150 |
| `ANTRBR24.dbc` | 779.311 |

São 3,4 milhões de notificações no total, sempre com as mesmas 79 colunas.

As colunas da notificação foram copiadas da leptospirose, dicionário já conferido.

## O que os arquivos trazem de diferente

- **Data do atendimento:** o campo 7 é a "Data do Atendimento", e não a dos primeiros sintomas.
- **5ª dose:** a data da 5ª dose é sempre igual à da 4ª. Parece cópia na geração do arquivo.
- **Colunas sem descrição:** DT_VAC_1 a 5 não aparecem em nenhuma fonte e vêm sempre vazias.
- **Campos que o DATASUS não divulga:** vêm sempre vazios o tipo de notificação, o laboratório e o lote da vacina, o laboratório e a partida do soro, o peso e a quantidade de soro.
- **Localização:** vem "9" em cerca de 90 registros por coluna, código que a ficha não tem.

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-atendimento-antirrabico.xlsx`.
