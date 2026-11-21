# Inventário das fontes e pendências: Leptospirose

Documento de trabalho, de 20/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/leptospirose/LEPTON_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, leptospirose (campos 31 a 74 e informações complementares; sem data impressa) | Fonte principal (DICLEPT) |
| `docs/fontes/leptospirose/LEPTON_FICHA.pdf` | Ficha de investigação, SVS 02/02/2007 | Apoio (FICHALEPT) |
| `docs/fontes/leptospirose/LEPTON_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio (INSTLEPT) |

Os PDFs vêm do pacote Docs_TAB_SINAN (pasta Downloads) e foram copiados para o projeto em 20/11/2026.

## Arquivos reais

| Arquivo | Notificações |
|---|---|
| `LEPTBR22.dbc` | 15.192 |
| `LEPTBR23.dbc` | 20.888 |
| `LEPTBR24.dbc` | 27.509 |

Os três arquivos têm as mesmas 120 colunas. O dicionário tem 134 colunas: as 120 do arquivo mais 14 do DICLEPT que não vêm no arquivo público.

As colunas da notificação e os campos internos foram copiados da meningite, e a autoctonia da leishmaniose visceral, dicionários já conferidos.

## O que os arquivos trazem de diferente

- **Classificação final:** vem "8" em 2.688 notificações (4%).
- **Resultado da microaglutinação:** vem "4", código que a ficha não tem.
- **Sorovares:** vêm com o código e o nome juntos (por exemplo "10 - COPENHAGENI").
- **UFs em sigla:** a UF do hospital, a de infecção e as das situações de risco vêm em sigla.
- **País de infecção:** vem "0" em 80% dos registros.

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-leptospirose.xlsx`.
