# Inventário das fontes e pendências: Sífilis em gestante e sífilis congênita

Documento de trabalho, de 16/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/sifilis-gestante/SIFIGEN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Sífilis em Gestante, campos 31 a 45, revisado em julho de 2010 (5 páginas) | Fonte principal da gestante (DICSIFG) |
| `docs/fontes/sifilis-gestante/SIFIGEN_FICHA.pdf` | Ficha de investigação, Sinan NET, 29/09/2008 no rodapé, com a definição de caso atualizada | CID O98.1 e as categorias do teste treponêmico (FICHASIFG) |
| `docs/fontes/sifilis-gestante/SIFIGEN_INSTRUCIONAL.pdf` | Instruções de preenchimento, 29/09/2008 | Apoio (INSTSIFG) |
| `docs/fontes/sifilis-congenita/SIFICN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Sífilis Congênita, campos 31 a 66 e Anexo 1, revisado em abril de 2012 (20 páginas) | Fonte principal da congênita (DICSIFC) |
| `docs/fontes/sifilis-congenita/SIFICN_FICHA.pdf` | Ficha de investigação, Sinan NET, 04/08/2008 no rodapé, com as observações de preenchimento atualizadas | CID A50.9 e as categorias que o DICSIFC não mostra (FICHASIFC) |
| `docs/fontes/sifilis-congenita/SIFICN_INSTRUCIONAL.pdf` | Instruções de preenchimento, 04/08/2008 | Apoio (INSTSIFC) |
| `SIFIGEN_NOTA_INFORMATIVA.pdf` e `SIFICN_NOTA_INFORMATIVA.pdf` | Notas informativas | Imagens escaneadas, sem texto legível pela ferramenta; não usadas (pendência) |

## Arquivos reais

Todos estão no DATASUS só como dados preliminares.

| Arquivo | Registros | Colunas |
|---|---|---|
| `SIFGBR24.dbc` | 89.934 | 32 |
| `SIFGBR25.dbc` | 48.929 | 32 |
| `SIFCBR24.dbc` | 24.631 | 64 |
| `SIFCBR25.dbc` | 12.630 | 64 |

- Os arquivos públicos da sífilis são mais enxutos que os de outros agravos: não trazem a unidade notificadora nem os campos internos de transferência.
- As colunas da notificação vêm do dicionário de hanseníase, já conferido, com as regras gerais do Rubens.
- O microdatasus 3.0.0 não tem função de tradução para sífilis.

## O que os arquivos trazem de diferente

- **Asteriscos no lugar do valor** ("***", "****", "********"), sobretudo nas datas. Na congênita de 2025, por exemplo:
  - data do óbito: 12.475 de 12.630 registros;
  - data do teste treponêmico após 18 meses: 12.615.

  Na gestante de 2025, a data do teste não treponêmico vem assim em 12.473 registros.
- **Congênita, agravo "A50."** em 351 registros (2025) e 689 (2024). Eles formam um grupo à parte, com a UF do pré-natal e a UF de nascimento em código numérico (os demais trazem sigla). Decisão do Rubens (16/11/2026): "A50." e "A50" = Sífilis congênita.
- **Congênita, código 4** no teste de sangue periférico e no de líquor, poucos registros. Sai como "Inconsistência/Não Preenchido".
- **Gestante, classificação final, e congênita, diagnóstico clínico:** vêm sempre em branco.

## Pendências

Estão na aba Pendências das planilhas `docs/conferencia/conferencia-sifilis-gestante.xlsx` e `docs/conferencia/conferencia-sifilis-congenita.xlsx`.

## Conferência (17 e 18/11/2026)

O Rubens conferiu as duas planilhas, e as correções que ele pediu foram aplicadas em 18/11/2026:

- Coluna extra com a semana epidemiológica do diagnóstico, calculada pela data do diagnóstico, porque SEM_DIAG vem sempre em branco. A mesma coluna entrou na hanseníase.
- Congênita, agravo: rótulos da CID-10 (tabela do TabWin): A50.9 Sífilis congênita não especificada; A50.0 Sífilis congênita precoce sintomática; A50. e A50 Sífilis congênita.
- Congênita, UF do pré-natal e UF de nascimento: sigla e código numérico saem com o nome da UF (ligação pela tb_uf.csv do DATASUS).
- Congênita, "outro sinal – especificar" (SIN_OUTR_E): os códigos 1, 2, 3 e 9 do DICSIFC são traduzidos e o texto escrito fica como veio.
- Congênita, LAB_CONF e LABC_EVIDE: categorias do DICSIFC, pela leitura do Rubens.

Os dois dicionários foram marcados como conferidos em 18/11/2026.
