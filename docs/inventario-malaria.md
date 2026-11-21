# Inventário das fontes e pendências: Malária

Documento de trabalho, de 14/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/malaria/MALAN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Malária, campos 31 a 50, revisado em julho de 2010 (9 páginas) | Fonte principal (DICMAL) |
| `docs/fontes/malaria/MALAN_FICHA.pdf` | Ficha de investigação de Malária, Sinan NET, SVS, 01/01/2010 | Agravo (CID B54), escolaridade e códigos 12 que o DICMAL não lista |
| `docs/fontes/malaria/MALAN_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio; confirma "12 = Motorista" |
| Dicionário da notificação individual (NOTIF2018) | Já usado nos outros agravos | Campos 1 a 30 e campos internos |

Os PDFs de malária vêm do pacote de documentação do TAB_SINAN, baixado pelo Rubens do site do DATASUS (ver `docs/inventario-docs-tab-sinan.md`).

## Arquivo real

`dados_publicos/malaria/MALABR25.dbc` (preliminar, baixado pelo Rubens em 14/11/2026): 2.082 registros e 50 colunas.

- 39 colunas são as comuns da notificação, iguais às de leishmaniose visceral.
- As 11 colunas próprias de malária estão no DICMAL.
- Valores do arquivo que não estão no DICMAL:
  - `AT_ATIVIDA` = 12 (42 registros): está na ficha ("12 - Motorista") e no instrutivo;
  - `TRA_ESQUEM` = 12 (53 registros): está na ficha ("Infecções por Pf com a associação Artemeter+Lumerfantrina em 3 dias");
  - `CLASSI_FIN` = 8 (27 registros): não está em nenhuma fonte de malária, e o Anexo I do NOTIF2018 não tem linha de malária.

## Pendências

Estão na aba Pendências da planilha `docs/conferencia/conferencia-malaria.xlsx`. As principais:

- `CLASSI_FIN` = 8 sem fonte para malária: fica como veio.
- Códigos 12 vindos da ficha, com a grafia "Lumerfantrina" a conferir.
- Siglas do resultado do exame e do tipo de lâmina mantidas como na fonte.

## Validação prevista

O pacote microdatasus (versão 3.0.0) tem `process_sinan_malaria`, então dá para repetir a comparação feita com Chagas.

## Conferência e validação (14/11/2026)

- Dicionário conferido pelo Rubens em duas rodadas.
- Decisões do Rubens na conferência:
  - tipo de lâmina e resultado do exame com os nomes do instrutivo oficial (30/10/2007);
  - esquema de tratamento com os rótulos da ficha;
  - agravo aceita "B54" e "B 54";
  - classificação final 8 = Inconclusivo, por analogia com a nota do Anexo I do NOTIF2018;
  - `ANO_NASC` continua "Ano de nascimento".
- Teste no navegador sem erros e sem conexões externas.
- Comparação com o microdatasus 3.0.0: nenhuma diferença indica erro da ferramenta. O microdatasus grava a sigla do tipo de lâmina no lugar da atividade (`docs/validacao/relatorio-comparacao-malaria.md`).
- Conferência por amostra: 0 erros em 100 células (IC 95% de 0% a 3,62%) (`docs/validacao/relatorio-conferencia-amostra-malaria.md`).
