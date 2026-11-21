# Inventário das fontes e pendências: Meningite

Documento de trabalho, de 18/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/meningite/MENIN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Meningite, campos 31 a 60 e quadros I a XII, revisado em julho de 2010 (23 páginas) | Fonte principal (DICMENI) |
| `docs/fontes/meningite/MENIN_FICHA.pdf` | Ficha de investigação, Sinan NET, SVS 15/10/2007 | CID G03.9, tipo de meningite (campo 2) e confirmação de categorias (FICHAMENI) |
| `docs/fontes/meningite/MENIN_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio (INSTMENI) |

As três vêm do pacote Docs_TAB_SINAN do DATASUS. Os arquivos `MENTN_DIC_DADOS.pdf` e `MENTN_FICHA.pdf`, que estavam na mesma pasta, são de transtornos mentais relacionados ao trabalho, não de meningite. Foram baixados por engano, não foram usados e foram enviados para a Lixeira em 18/11/2026, a pedido do Rubens.

## Arquivos reais

| Arquivo | Registros |
|---|---|
| `MENIBR22.dbc` | 20.635 |
| `MENIBR23.dbc` | 26.629 |
| `MENIBR24.dbc` | 25.478 |
| `MENIBR25.dbc` | 26.977 |

- Os quatro arquivos têm as mesmas 131 colunas.
- Os campos 1 a 30 e os campos internos vêm dos dicionários já conferidos:
  - tétano acidental, na maior parte;
  - sífilis em gestante, para a UF de residência, que aqui vem em código numérico;
  - hanseníase, para os campos de duplicidade e de fluxo.
- O microdatasus 3.0.0 não tem função de tradução para meningite (levantamento de 15/11/2026).

## O que os arquivos trazem de diferente

- **Códigos com e sem zero à esquerda** nos exames, no diagnóstico (campo 51), no critério e no sorogrupo. As duas formas entram (pendência).
- **Código 0 nos exames** do campo 49: cerca de 260 registros por exame nos quatro anos.
- **Classificação final 8:** 1.599 registros. O dicionário de meningite não define esse código, e o Anexo I do NOTIF2018 precisa ser lido no PDF (pendência).
- **CON_DIAGES "00"** em 2.003 registros, além de alguns sinais soltos ("%", "X").

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-meningite.xlsx`.
