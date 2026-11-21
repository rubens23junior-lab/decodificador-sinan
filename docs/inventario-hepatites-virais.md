# Inventário das fontes e pendências: Hepatites virais

Documento de trabalho, de 19/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/hepatites-virais/HEPANET_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Hepatites Virais, campos 31 a 52 e campos ajustados (16 páginas). Sem data; o cabeçalho é da Secretaria de Vigilância em Saúde e Ambiente | Fonte principal (DICHEPA) |
| `docs/fontes/hepatites-virais/HEPANET_FICHA.pdf` | Ficha de investigação, Sinan NET, SVS 29/09/2006 | CID B19, classificação final (campo 48), forma clínica (campo 49), provável fonte (campo 51) e confirmação das categorias (FICHAHEPA) |
| `docs/fontes/hepatites-virais/HEPANET_INSTRUCIONAL.pdf` | Instruções de preenchimento, 16/06/2008 | Data do diagnóstico (item 7) e definições dos campos 48 e 49 (INSTHEPA) |

As três vêm do pacote Docs_TAB_SINAN do DATASUS e foram copiadas para o projeto em 19/11/2026.

## Arquivos reais

| Arquivo | Registros |
|---|---|
| `HEPABR21.dbc` | 26.271 |
| `HEPABR22.dbc` | 30.608 |
| `HEPABR23.dbc` | 33.206 |

- Os três arquivos têm as mesmas 80 colunas. O agravo é sempre B19.
- O arquivo não traz a unidade de saúde, o ano de nascimento, as datas de digitação e transferência nem o campo 50 (classificação etiológica).
- Os campos 1 a 30 vêm dos dicionários já conferidos:
  - tétano acidental, na maior parte;
  - sífilis em gestante, para a UF de residência, que vem em código numérico.
- A data do diagnóstico (DT_DIAG e SEM_DIAG) segue o modelo da hanseníase.
- O microdatasus 3.0.0 não tem função de tradução para hepatites (levantamento de 15/11/2026).
- Gerador: `ferramentas/geradores-dicionarios/gerar-hepatites-virais.mjs`.

## O que os arquivos trazem de diferente

- **Nomes diferentes do dicionário de dados:** o DICHEPA descreve CLASSI_FIN_AJ, FORMA_AJ e VIRUS_A a VIRUS_E; o arquivo traz CLASSI_FIN, FORMA e HAV, HBV, HCV, HDV e HEV (pendência).
- **Forma clínica 99** em 18.135 registros (20%): a ficha só tem 1 a 4.
- **Gestante com dois dígitos** (06, 02, 01) e "99" em 3.129 registros.
- **Semana "20"** na notificação e no diagnóstico dos 1.119 registros do Espírito Santo. Foram criadas colunas extras com a semana calculada pela data.
- **UF de exposição** com código e sigla misturados (CO_UF_EXP).
- **Códigos que o campo não comporta:** o 3 em HIV e em outras DSTs (3 registros); o 5 nas sorologias do banco de sangue (106 registros).

## Prévia da decodificação (2021 a 2023)

Feita com o dicionário ainda não conferido, só na memória. Além dos pontos acima, aparecem:

- datas com o ano errado (por exemplo, "02021215") nas datas de coleta e do acidente;
- poucos códigos de ocupação fora da CBO (10001, 999990);
- 18 registros com a UF de residência "99";
- poucos municípios de residência sem região ou macrorregião de saúde.

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-hepatites-virais.xlsx`.
