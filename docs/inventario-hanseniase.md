# Inventário das fontes e pendências: Hanseníase

Documento de trabalho, de 16/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/hanseniase/HANSN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Hanseníase: campos 31 a 43 e tela de acompanhamento (8 páginas, sem data impressa) | Fonte principal (DICHANS) |
| `docs/fontes/hanseniase/HANSN_FICHA.pdf` | Ficha de notificação/investigação de Hanseníase, Sinan NET, SVS, 30/10/2007 | CID A30.9, data do diagnóstico (campo 7), escolaridade, e confirma que o "5 - Não classificado" é da forma clínica (FICHAHANS) |
| `docs/fontes/hanseniase/HANSN_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio (INSTHANS) |
| `docs/fontes/hanseniase/HANSN_CADERNO_ANALISES.pdf` | Roteiro para uso do Sinan NET para hanseníase, manual de tabulação dos indicadores (MS, 2018, versão preliminar) | Consulta; não define códigos |
| `docs/fontes/tabelas-apoio/TAB_SINANNET/HansNET.def` e `reacional.cnv` | Arquivo de definição do TabWin para hanseníase e a tabela do episódio reacional (UT-Sinan, 2019) | Só para o código 4 do episódio reacional (TABHANS) |
| Dicionário da notificação individual (NOTIF2018) | Já usado nos outros agravos | Campos 1 a 30 e campos internos |

Os quatro PDFs vêm do pacote de documentação do TAB_SINAN, baixado pelo Rubens do site do DATASUS (ver `docs/inventario-docs-tab-sinan.md`). O pacote TAB_SINANNET foi baixado por ele em 15/11/2026.

## Arquivo real

`dados_publicos/hanseniase/HANSBR25.dbc`, baixado pelo Rubens em 16/11/2026. Ele aparece no site do DATASUS como "Dados - Preliminares" (conferido em 16/11/2026; o de 2024 também é preliminar). Tem 31.319 registros e 63 colunas.

- 32 colunas são as comuns da notificação, iguais às de leishmaniose visceral, e foram copiadas do dicionário de LV, já conferido.
- As 31 colunas próprias de hanseníase estão todas no DICHANS. A única exceção é `SEM_DIAG`, que nenhum documento descreve.
- O DICHANS também cita campos que não vêm no arquivo público (`NU_PRONTUA`, `NU_NOT_AT`, `DISTRIT_AT`, `BAIRROAT`, `NOBAIRROAT`).
- O microdatasus 3.0.0 não tem função de tradução para hanseníase. Não há comparação com outro método; a validação fica com a conferência do Rubens e a amostra conferida à mão.

## Valores do arquivo que nenhuma fonte define

Contagens do arquivo de 2025, só com totais:

| Coluna | Código | Registros |
|---|---|---|
| FORMACLINI | 0 / 6 / 9 | 1.070 / 42 / 15 |
| CLASSOPERA e CLASSATUAL | 0 / 9 | 23 / 8 (cada) |
| MODOENTR | 0 | 23 (registros com 0 em vários campos) |
| MODODETECT | 0 | 6.916 (6.743 deles não são caso novo) |
| BACILOSCOP | 0 | 1.130 |
| ESQ_INI_N / ESQ_ATU_N | 0 | 130 / 492 |
| EPIS_RACIO | 0 | 11.890 |

No TabWin, as tabelas dessas colunas juntam o que não está listado numa linha "Ign/Branco" (",0-9"), sem dar nome ao 0. Pela regra do projeto, esses códigos ficam como vieram, destacados.

O código 4 de `EPIS_RACIO` (16.169 registros) não está no DICHANS, mas a tabela oficial do TabWin (`reacional.cnv`) dá a ele o nome "Sem Reação". Por isso ele entrou, com essa fonte indicada.

## Unidade de saúde sem os zeros à esquerda

Em `ID_UNIDADE`, 1.930 registros vêm com menos de 7 dígitos (por exemplo, `5428`). Completando com zeros até 7 dígitos, 1.926 são encontrados no CNES. A coluna `ID_UNID_AT` tem o mesmo problema. Nos outros arquivos isso é raro: 8 em LV e 12 em malária. Hoje a ferramenta não completa os zeros. A decisão fica com o Rubens, porque a mudança valeria para todos os agravos.

## Pendências

Estão na aba Pendências da planilha `docs/conferencia/conferencia-hanseniase.xlsx`.

## Conferência e validação (16/11/2026)

- Dicionário conferido pelo Rubens. Decisões dele:
  - códigos que o campo não comporta saem como "Inconsistência/Não Preenchido", destacados e com o motivo nas Inconsistências;
  - rótulos corrigidos ("Transferência" com acento; "Poliquimioterapia Paucibacilar/Multibacilar");
  - SEM_DIAG = semana epidemiológica do diagnóstico do caso notificado;
  - episódio reacional 4 = "Sem reação", com a origem no TabWin indicada;
  - escolaridade 0, 00 e 43 = Analfabeto;
  - CNES com zeros à esquerda, decisão aplicada a todos os agravos.
- Teste no navegador sem erros e sem conexões externas.
- Conferência por amostra: 0 erros em 100 células (IC 95% de 0% a 3,62%) (`docs/validacao/relatorio-conferencia-amostra-hanseniase.md`).
