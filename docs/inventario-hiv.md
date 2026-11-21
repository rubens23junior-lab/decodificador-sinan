# Inventário das fontes e pendências: HIV (gestante, criança exposta, adulto e criança)

Documento de trabalho, de 19/11/2026. Decisões do Rubens:

- os dicionários de HIV de 2024 do pacote Docs_TAB_SINAN são a fonte principal; os PDFs de aids (versão 5) servem de apoio;
- a conferência é feita em duas etapas: primeiro gestante e criança exposta, depois adulto e criança.

## Fontes

| Pasta | Arquivo | O que é | Papel |
|---|---|---|---|
| `hiv-gestante` | `DIC_DADOS_Gestante_HIV_v5.pdf` | Dicionário de dados, gestante HIV, campos 31 a 47 (sem data). É o mesmo arquivo do HIVG_DIC_DADOS do pacote | Fonte principal (DICHIVG) |
| `hiv-gestante` | `Gestante_HIV_v5.pdf` e `Gestante_HIV_v5_instr.pdf` | Ficha e instrucional, SVS 17/07/2006 | Apoio (FICHAHIVG, INSTHIVG) |
| `hiv-crianca-exposta` | `HIVCR_DIC_DADOS.pdf` | Dicionário de dados, HIV criança exposta, revisado em fevereiro/2024 (pacote Docs_TAB_SINAN) | Fonte principal (DICHIVE) |
| `hiv-crianca-exposta` | `11140250-ficha-de-investigacao-crianca-exposta-ao-hiv.pdf` | Ficha de notificação/investigação, SVS 18/05/2009. É um PDF escaneado; foi lida pelas imagens das páginas | Apoio (FICHAHIVE) |
| `hiv-adulto` | `HIVAN_DIC_DADOS.pdf` | Dicionário de dados, HIV adulto, revisado em fevereiro/2024 (pacote) | Fonte principal (etapa 2) |
| `hiv-adulto` | `DIC_DADOS_Aids_adulto_v5.pdf`, `Aids_adulto_v5.pdf`, `Aids_adulto_v5_instr.pdf` | Dicionário, ficha e instrucional de aids adulto, versão 5 | Apoio (etapa 2) |
| `hiv-crianca` | `HIVCN_DIC_DADOS.pdf` | Dicionário de dados, HIV criança, revisado em fevereiro/2024 (pacote) | Fonte principal (etapa 2) |
| `hiv-crianca` | `DIC_DADOS_Aids_crianca_v5.pdf`, `Aids_crianca_v5.pdf`, `Aids_crianca_v5_instr.pdf` | Dicionário, ficha e instrucional de aids criança, versão 5 | Apoio (etapa 2) |
| `tabelas-apoio/TAB_SINANNET` | `HivGestNET.def`, `AidsNET.def`, `AidsCriNET.def` | Definições do TabWin | Confirmam o nome das colunas |

Os PDFs de aids e de gestante foram colocados pelo Rubens em `docs/fontes` em 19/11/2026 e organizados em pastas por agravo. Os dicionários de 2024 foram copiados do pacote Docs_TAB_SINAN (pasta Downloads).

Os dicionários de 2024 descrevem todas as colunas dos arquivos públicos. Os de aids v5 não descrevem algumas (por exemplo DTTRIAGEM no adulto; ESC_MAE_N e CLI_OTITE na criança).

## Arquivos reais

| Agravo | Arquivos | Notificações | Colunas | CID |
|---|---|---|---|---|
| Gestante | HIVGBR22 a 24 | 7.885, 8.474, 3.598 | 31 | Z21 |
| Criança exposta | HIVEBR22 a 24 | 8.120, 7.768, 1.089 | 27 | Z206 |
| Adulto | HIVABR23 e 24 | 53.582, 25.736 | 76 | — |
| Criança | HIVCBR22 a 24 | 186, 186, 1 | 103 | — |

Os arquivos são preliminares. Os de criança de 2022 e 2023 têm o mesmo número de registros por coincidência: nenhum registro se repete entre eles.

## Etapa 1: gestante e criança exposta

- Dicionários `dicionarios/hiv-gestante.json` (35 colunas: 31 do arquivo mais 4 do DICHIVG fora do arquivo) e `dicionarios/hiv-crianca-exposta.json` (27 colunas).
- Os campos da notificação foram copiados do dicionário de hepatites, já conferido.
- Geradores em `ferramentas/geradores-dicionarios/gerar-hiv-gestante.mjs` e `gerar-hiv-crianca-exposta.mjs`.
- Planilhas: `docs/conferencia/conferencia-hiv-gestante.xlsx` (49 linhas amarelas) e `conferencia-hiv-crianca-exposta.xlsx` (33 linhas amarelas).

**O que os arquivos trazem de diferente:**

- **Gestante.** A UF do pré-natal vem em sigla, e a UF do parto vem em código numérico (com duas siglas no meio). Há datas de início dos antirretrovirais com o ano errado (por exemplo "02021203"), que vão para as Inconsistências.
- **Criança exposta.** As 394 notificações do Espírito Santo vêm em outro formato. Tipo de notificação, semanas, regional e país vêm em branco, a idade vem "****" e a escolaridade vem "1". As colunas de encerramento vêm vazias em todos os registros.

## Pendências

Estão na aba Pendências de cada planilha de conferência.

## Etapa 2: adulto e criança

- Dicionários `dicionarios/hiv-adulto.json` (76 colunas) e `dicionarios/hiv-crianca.json` (103 colunas), sem nenhuma coluna a mais nem a menos que os arquivos, como nos dicionários de 2024.
- Geradores em `ferramentas/geradores-dicionarios/gerar-hiv-adulto.mjs` e `gerar-hiv-crianca.mjs`. As partes comuns aos dois estão em `hiv-comum.mjs`.
- Planilhas: `docs/conferencia/conferencia-hiv-adulto.xlsx` (142 linhas amarelas) e `conferencia-hiv-crianca.xlsx` (183 linhas amarelas).
- O PDF dos dicionários de 2024 desalinha as linhas da tabela. Os nomes dos sinais clínicos vieram das fichas de aids (2006), conferidos com o dicionário e com os arquivos de definições do TabWin (AidsNET.def e AidsCriNET.def).

**O que os arquivos trazem de diferente:**

- **Adulto.**
  - Escolaridade "99" em 24% das notificações.
  - Ocupação com ponto em 767 notificações (por exemplo "5161.1", que parece ser 516110 dividido por 100).
  - Critério sempre 901 (HIV+).
  - UF do tratamento em sigla.
- **Criança.**
  - Só 373 notificações.
  - Nenhuma inconsistência na prévia.
  - Idade da mãe "***" em 84 notificações (vale como campo em branco).
  - UF do tratamento em código numérico.
