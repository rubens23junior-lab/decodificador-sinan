# Inventário das fontes e pendências do dicionário de Dengue/Chikungunya

Documento de trabalho, gerado na análise de `docs/fontes` em 01/11/2026. Nada aqui foi transformado em dicionário ainda. Serve para o Rubens conferir e decidir as pendências.

## 1. O que é cada arquivo

| Arquivo | O que é | Páginas | Papel no projeto |
|---|---|---|---|
| `Ficha_DENGCHIK_FINAL.pdf` | Ficha de notificação/investigação Dengue e Chikungunya, Sinan Online versão 3.0 | 2 | Referência visual dos campos 1 a 71 |
| `INSTRUÇÕES PARA PREENCHIMENTO.pdf` | Descrição dos campos da ficha de investigação de dengue | 1 | Apoio |
| `DIC_DADOS_ONLINE.pdf` | Dicionário de dados Sinan Online, Dengue/Chikungunya, versão 3.0 (revisado em 21/10/2015, últimas revisões até 02/12/2015). Traz a coluna "DBF" (nome da coluna no arquivo) | 27 | **Fonte principal dos campos 31 a 71** |
| `Nota_Informativa_059.pdf` | Nota Informativa nº 59/2016 CGPNCD/DEVIT/SVS/MS: lançamento da versão 3.0 em 10/05/2016 e as mudanças em relação à versão 2.10 | 6 | Fonte da data de vigência e das categorias novas da classificação |
| `Dengue e Chikungunya - Notificação.pdf` | Junção dos quatro PDFs acima (2 + 1 + 27 + 6 = 36 páginas) | 36 | Repetido; não precisa ser usado |
| `Dengue e Chikungunya - Notificação.md` | Conversão em texto do PDF acima | — | Só apoio de leitura (tem trechos quebrados) |
| `Fichas de Notificação - Conclusão INdividual.pdf` | Ficha de Notificação/Conclusão Individual do Sinan NET (SVS 27/09/2005) | 1 | Referência visual dos campos 1 a 30 |
| `INstrução de preenchimento da Ficha de Notificação INdividual.pdf` | Instruções de preenchimento da ficha de notificação individual | 3 | Apoio |
| `Dicionario das Fichas de Notificação Individual.pdf` | Dicionário de dados Sinan NET versão 5.0: notificação individual, conclusão e campos internos do sistema, com a coluna "DBF" | 23 | **Fonte principal dos campos 1 a 30 e dos campos internos** |
| `Notificação - Conclusão Individual.pdf` | Junção dos três PDFs acima | — | Repetido; não precisa ser usado |
| `Notificação - Conclusão Individual.md` | Conversão em texto do PDF acima | — | Só apoio de leitura (tem trechos quebrados) |
| `dic_dados_dengue.pdf` | Dicionário de dados do Portal de Dados Abertos, Sinan Online, **Dengue** (DAENT/SVSA; título interno indica fevereiro de 2024). 121 campos, nomes em minúsculas, **sem dados de identificação** | 22 | **Fonte dos arquivos do portal**; comparado abaixo |
| `dic_dados_chikungunya.pdf` | Mesmo modelo do anterior, para **Chikungunya** | 19 | Necessário se você usar o conjunto de chikungunya do portal (ver pendência P10) |
| `dic_dados_zika.pdf` | Mesmo modelo, para **Zika** | 8 | Fora do escopo agora (agravo futuro) |
| `RELATORIO_DTB_BRASIL_MUNICIPIO.xls` | Divisão Territorial Brasileira do IBGE, aba `DTB_Municipio`. Cabeçalho diz **"DATA BASE: 22/11/2024"** | — | Tabela de municípios (ver seção 5) |

Dois dicionários diferentes descrevem os mesmos dados:

- **Dicionários "DBF"** (`DIC_DADOS_ONLINE.pdf` + `Dicionario das Fichas...pdf`): descrevem o arquivo que o próprio Sinan exporta, com nome, endereço e outros dados de identificação.
- **Dicionário do portal** (`dic_dados_dengue.pdf`): descreve o arquivo público, já sem identificação, e inclui campos da ficha antiga (antes de 2016).

## 2. Trechos quebrados nos `.md`, conferidos nos PDFs

| Trecho | Situação |
|---|---|
| Idade (`NU_IDADE_N`) | **Resolvido.** O `dic_dados_dengue.pdf` (p. 3) traz a regra inteira. O 1º dígito é a unidade (1 Hora, 2 Dia, 3 Mês, 4 Ano) e os demais, o valor. Exemplos oficiais: 3009 = nove meses; 4018 = dezoito anos. A continuação no `.md` do Sinan NET diz o mesmo. Falta a conferência formal na p. correspondente do `Dicionario das Fichas...pdf`, que farei na etapa de transcrição |
| Nomes `PETÉQUIA_N` e `ÁCIDO_PEPT` | **Não é erro da conversão.** O acento está no próprio `DIC_DADOS_ONLINE.pdf` (p. 3 e 4). O dicionário do portal escreve `petequia_n` e `acido_pept`. Um nome de coluna DBF não costuma ter acento, mas isso só se confirma com o cabeçalho real (P1) |
| Escolaridade (`CS_ESCOL_N`) | **Duvidoso.** O `.md` tem um "43" solto no meio das categorias. Será conferido no PDF do Sinan NET na transcrição. Ver também P6 |
| Demais quebras (UF, município, gestante, autoctonia, sinais de alarme, dengue grave) | Afetam só a coluna "Características" (regras de validação do sistema). **Não mudam a tradução.** Conferidas no `DIC_DADOS_ONLINE.pdf` |

## 3. Colunas sem correspondência entre o portal e os dicionários DBF

A comparação ignora maiúsculas e minúsculas.

**Só no dicionário do portal** (não aparecem nos dicionários DBF da versão 3.0):

- `ano_nasc` (o portal traz o ano de nascimento no lugar da data `DT_NASC`)
- Campos da ficha anterior a 2016: `mani_hemor`, `epistaxe`, `gengivo`, `metro`, `petequias`, `hematura`, `sangram`, `laco_n`, `plasmatico`, `evidencia`, `plaq_menor`, `con_fhd`, `complica`
- `tp_sistema` (1 Sinan Net, 2 Sinan Online)

**Só nos dicionários DBF** (não aparecem no portal). A maioria identifica a pessoa, o que explica a retirada:

- Identificação e endereço: `NU_NOTIFIC`, `NM_PACIENT`, `DT_NASC`, `ID_CNS_SUS`, `NM_MAE_PAC`, `ID_DISTRIT`, `ID_BAIRRO`, `NM_BAIRRO`, `ID_LOGRADO`, `NM_LOGRADO`, `NU_NUMERO`, `NM_COMPLEM`, `ID_GEO1`, `ID_GEO2`, `NM_REFEREN`, `NU_CEP`, `NU_DDD_TEL`, `NU_TELEFON`, `CS_ZONA`
- Hospitalização: `UF` (UF de hospitalização), `HOSPITAL`, `DDD_HOSP`, `TEL_HOSP`
- Local provável de infecção: `CODISINF`, `CO_BAINF`/`CO_BAINFC`, `NOBAIINF`
- Outros: `CS_SUSPEIT` (não se aplica a dengue), `IN_VINCULA`, `DS_OBS`
- Campos internos de rotina: `FONETICA_N`, `SOUNDEX`, `DT_TRANSUS`, `DT_TRANSDM`, `DT_TRANSSM`, `DT_TRANSRM`, `DT_TRANSRS`, `DT_TRANSSE`, `NU_LOTE_V`, `NU_LOTE_H`, `IDENT_MICR`

**Nome escrito de forma diferente:**

- `CO_BAINFC` (Sinan NET) × `CO_BAINF` (Sinan Online)
- `PETÉQUIA_N` × `petequia_n`; `ÁCIDO_PEPT` × `acido_pept`

**Erro aparente no dicionário do portal:** o campo 64 aparece como `coufinf` ("UF provável da fonte de infecção") logo antes de `municipio` (município do hospital), e `coufinf` volta no campo 67. No dicionário Online, a posição 52 é `UF` (UF de hospitalização). O portal provavelmente repetiu o nome por engano.

### 3.1 Conferência com um arquivo real do DATASUS

Arquivo: `dados_publicos/dengue-chikungunya/DENGBR25.dbc` (dados públicos, fora do controle de versões). Lido só o cabeçalho, sem abrir os registros.

- 1.643.215 registros, 121 colunas, registro de 326 bytes. O cabeçalho do DBF vem sem compressão no início do DBC.
- **As 121 colunas são as mesmas do `dic_dados_dengue.pdf`, na mesma ordem**, com duas diferenças, ambas erros de digitação do dicionário:
  - posição 64: o arquivo traz `UF` (UF de hospitalização), e o dicionário escreve `coufinf`. Confirma o erro apontado acima.
  - posição 73: o arquivo traz `CLINC_CHIK`, e o dicionário escreve `clinic_chik`.
- Datas vêm no tipo data do DBF (`D`, 8 caracteres, AAAAMMDD). `NU_IDADE_N` vem como número (`N`, 4). As demais colunas vêm como texto (`C`).
- `PETEQUIA_N` e `ACIDO_PEPT` vêm sem acento no arquivo real.

### 3.2 Valores que aparecem de fato no arquivo real

Contagem feita em 01/11/2026 com `node ferramentas/contar-valores.js dados_publicos/dengue-chikungunya/DENGBR25.dbc <COLUNAS>`. A leitura completa encontrou 1.643.215 registros, o mesmo número anunciado no cabeçalho, sem registros excluídos.

| Coluna | Valores encontrados (quantidade) | Observação |
|---|---|---|
| `CLASSI_FIN` | 10 (1.444.481); 8 (158.115); 11 (35.105); 12 (2.687); 0 (1.646); em branco (1.181) | **Não aparecem** 5 (Descartado, versão 3.0), 13 (Chikungunya), 1 e 2 (portal). O 8 só existe no dicionário de 2024 ("Inconclusivo"); 10, 11 e 12 só nas listas da versão 3.0 |
| `CRITERIO` | 2 (963.025); 1 (512.128); em branco (143.944); 3 (22.480); 0 (1.638) | 0 consta só no dicionário de 2024 (junto com 9 e branco, "Ignorado") |
| `CS_ESCOL_N` | 9; em branco; 6; 10; 8; 3; 5; 4; 1; 2; 7; 0; e **"09" (1 registro)** | Confirma a necessidade da regra "1" = "01" (P6) |
| `EVOLUCAO` | 1; em branco; 9; **0 (2.091)**; 2; 3; 4 | O 0 não está em nenhum dicionário: ficará como veio, nas Inconsistências |
| `TP_SISTEMA` | 2 (1.590.657); **0 (34.252)**; em branco (18.306) | O 0 não está no dicionário (só 1 e 2) |
| `GRAV_ORGAO` | em branco; 0 (34.212); 2 (2.686); 1 (482); **9 (8)** | 0 e 9 não estão no dicionário de 2024 (só 1 e 2) |
| `PLAQ_MENOR` | em branco (1.608.963); 0 (34.252) | Nenhum número de plaquetas. P7 não afeta este arquivo |
| `MANI_HEMOR`, `CON_FHD` | em branco (1.608.963); 0 (34.252) | Campos da ficha antiga, sem uso real em 2025 |

Observação, sem conclusão: o número 34.252 se repete (`TP_SISTEMA` = 0 e os campos antigos = 0). Parece ser um mesmo grupo de registros com campos preenchidos com zero.

## 4. Categorias que divergem entre as fontes

| Campo | Dicionário DBF (Sinan Online 3.0, 2015) | Dicionário do portal (2024) |
|---|---|---|
| `CLASSI_FIN` (Classificação) | 5 Descartado; 10 Dengue; 11 Dengue com sinais de alarme; 12 Dengue grave; 13 Chikungunya. A Nota 59/2016 confirma: vale a partir de 10/05/2016 | branco, 0, 9 Ignorado; 1 Confirmado; 2 Descartado; 8 Inconclusivo. **Mas as regras do próprio portal citam 11, 12 e 13**, que não estão na lista |
| `CRITERIO` | 1 Laboratório; 2 Clínico Epidemiológico; **3 Em investigação** | branco, 0, 9 Ignorado; 1 Laboratório; 2 Clínico-epidemiológico; **3 Clínico** |
| `RESUL_NS1`, `RESUL_VI_N`, `RESUL_PCR_`, `HISTOPA_N`, `IMUNOH_N` | 1 **Positivo**; 2 **Negativo**; 3 Inconclusivo; 4 Não realizado | 1 **Reagente**; 2 **Não reagente**; 3 Inconclusivo; 4 Não realizado |
| `GRAV_ORGAO` | Sem categorias no PDF (célula vazia) | 1 Sim; 2 Não |
| `CS_ESCOL_N` | 0 a 10, com 9 Ignorado e 10 Não se aplica (a conferir no PDF) | Lista também formas com dois dígitos (",00", ",01"... e "99") |
| `PLAQ_MENOR` | — | char(7) com categorias Sim/Não/Ignorado. Um campo de 7 caracteres com Sim/Não é estranho; pode ser contagem de plaquetas |

Campos iguais nas duas fontes (exemplos): sinais clínicos e doenças pré-existentes (1 Sim, 2 Não), `HOSPITALIZ`, `TPAUTOCTO`, `EVOLUCAO` (1, 2, 3, 4, 9), `CLINIC_CHIK`, `SOROTIPO`, `CS_SEXO`, `CS_GESTANT`, `CS_RACA`.

## 5. Tabela de municípios do IBGE

- 5.570 municípios, todos com código de 7 dígitos, 27 UFs.
- **Os 6 primeiros dígitos identificam o município sem ambiguidade** (nenhum prefixo repetido). A conversão será: código do Sinan (6 dígitos) = 7 dígitos do IBGE sem o último (dígito verificador).
- O cabeçalho do arquivo diz "DATA BASE: 22/11/2024". Você mencionou DTB 2023 (P8).
- Códigos do Sinan não encontrados na tabela ficam como vieram e vão para a aba Inconsistências, com a contagem.

## 6. Pendências para decisão do Rubens

- **P1.** Origem dos arquivos (resposta do Rubens, 01/11/2026): arquivos públicos baixados em datasus.saude.gov.br/transferencia-de-arquivos, **em formato DBC** (confirmado). O TabNet foi descartado: gera tabelas já contadas e rotuladas, que não precisam de decodificação. **Ainda falta** ver os nomes das colunas de um arquivo real do DATASUS.
- **P2.** **Decidido:** só dados a partir de 2016. **Decidido para `CLASSI_FIN` (Rubens, 01/11/2026, depois da contagem da seção 3.2):** cada código recebe o rótulo do documento oficial que o define, e a fonte de cada código fica registrada no dicionário e na aba "Dicionário usado". Os códigos 5, 10, 11, 12 e 13 vêm do `DIC_DADOS_ONLINE.pdf` e da Nota 59/2016; branco/0/9, 1, 2 e 8, do `dic_dados_dengue.pdf`.
- **Decisão geral (Rubens, 01/11/2026):** a ferramenta trata **somente os arquivos públicos do DATASUS**. A fonte principal do dicionário passa a ser `dic_dados_dengue.pdf` (e `dic_dados_chikungunya.pdf` para chikungunya). Os dicionários DBF de 2015 e do Sinan NET ficam como apoio, para conferir rótulos e regras que o dicionário de 2024 não detalhe.
- **P3.** **Decidido:** `CRITERIO` 3 = "Clínico", conforme o dicionário de 2024.
- **P4.** **Decidido:** os exames usam os rótulos do dicionário de 2024 ("Reagente/Não reagente").
- **P5.** **Decidido:** `GRAV_ORGAO` usa "1 Sim, 2 Não", do dicionário de 2024.
- **P6.** **Decidido:** em `CS_ESCOL_N`, as formas com um e com dois dígitos são a mesma resposta (por exemplo, "1" e "01"), como o dicionário de 2024 lista. A transcrição exata das categorias será conferida no PDF.
- **P7.** `PLAQ_MENOR`: tratar como categórico ou como número?
- **P8.** **Decidido:** a tabela é a DTB 2023 (informação do Rubens). O cabeçalho do arquivo diz "DATA BASE: 22/11/2024"; as duas informações serão registradas como fonte.
- **P9.** **Decidido:** os arquivos do DATASUS vêm em DBC, então a leitura de DBC entra na primeira entrega.
- **P10.** **Decidido:** chikungunya também será decodificada, com o `dic_dados_chikungunya.pdf`. Falta um arquivo DBC de chikungunya do DATASUS para conferir as colunas.

## 7. CBO e CNES: material novo de 02/11/2026

Material baixado pelo Rubens em 02/11/2026 e analisado no mesmo dia. **Nenhuma tabela da ferramenta foi trocada.**

### 7.1 CBO (pasta `docs/fontes/tabelas-apoio/CBO/`)

| Arquivo | O que é | Papel no projeto |
|---|---|---|
| `livro-1-portal-cbo.pdf` | Classificação Brasileira de Ocupações, livro 1: códigos, títulos e descrições. Ministério do Trabalho e Emprego, 3ª edição, 2010 | Referência oficial da CBO para o artigo |
| `cbo2002_lista.pdf` | Relatório de títulos da CBO 2002 (ocupações e sinônimos), gerado em 22/06/2023 | Apoio |
| `cbo2002-ocupacao.csv` | 2.694 ocupações (código de 6 dígitos e título), do portal da CBO | Comparada com a tabela da ferramenta (abaixo) |
| `cbo2002-sinonimo.csv`, `-familia.csv`, `-subgrupo-principal.csv`, `-grande-grupo.csv`, `-perfilocupacional.csv` | Sinônimos e níveis da classificação; perfil ocupacional (atividades) | Apoio |
| `cbo2002-subgrupo-principal (1).csv` | Cópia idêntica do arquivo anterior (mesmo conteúdo, byte a byte) | Pode ser apagada |

Comparação com a tabela usada hoje, a `CBO_02.dbf` do pacote TAB_CNES do DATASUS, com 2.705 códigos:

- **118 códigos estão só na lista do Ministério do Trabalho** (atualizações recentes da CBO). Nenhum deles aparece no arquivo de dengue de 2025.
- **129 códigos estão só na tabela do DATASUS.** São códigos antigos que a lista atual não traz mais, como a família 2231 (médicos). Eles aparecem em **21.022 registros** de dengue de 2025. Trocar a tabela do DATASUS pela lista do Ministério do Trabalho faria esses registros perderem o nome da ocupação.
- **Os títulos diferem em 239 códigos.** Quase sempre é só maiúscula ("Deputado Federal" e "Deputado federal").
- **Os códigos especiais do SINAN** (999991, 998999, 999992, 999993, 999994, XXX…, cerca de 275 mil registros de dengue) **não aparecem em nenhum documento da CBO.** São códigos do próprio SINAN, e a pendência continua.

**Conclusão:** a ferramenta continua com a tabela do DATASUS, que é a que o SINAN usa. Os documentos do Ministério do Trabalho ficam como referência oficial.

### 7.2 CNES (pasta `docs/fontes/tabelas-apoio/CNES/`, fora do Git)

É a base de dados completa do CNES, competência **setembro de 2026** (arquivos `*202609.csv`, 2,9 GB, com data de 15/10/2026). Tem 118 tabelas. A que interessa à ferramenta é a `tbEstabelecimento202609.csv`, que traz o código CNES e o nome fantasia.

Comparação com a tabela usada hoje, a `CADGERBR.dbf`, com 695.937 estabelecimentos:

- A base nova tem 640.122 estabelecimentos. **Todos já estão na tabela atual**, e com o mesmo nome em 640.079 deles. Nos 43 restantes, a base nova não tem nome fantasia.
- **55.815 estabelecimentos estão só na tabela atual.** São unidades que já não aparecem no cadastro de setembro de 2026. Nos dados de dengue de 2025, **2.556 registros** perderiam o nome da unidade se a tabela fosse trocada.
- **As 98 unidades sem nome nos dados de dengue de 2025** (7.403 registros) também não estão na base nova.
- A base nova traz dados pessoais: CPF de diretores, telefones e e-mails. **Por isso, e pelo tamanho, ela fica fora do histórico do projeto.**

**Conclusão:** a tabela atual (CADGERBR) é mais completa para decodificar notificações, porque guarda também unidades antigas. A base de setembro de 2026 não acrescenta nenhum estabelecimento.

**Decisão do Rubens (02/11/2026):** a base de setembro de 2026 foi apagada da pasta do projeto depois desta análise. Os documentos da CBO (seção 7.1) foram mantidos.

### 7.3 Observação sobre a tabela atual do CNES

Quando o estabelecimento não tem nome fantasia, a `CADGERBR.dbf` usa o documento e a razão social no lugar do nome. Há 2 casos com **CPF** de pessoa física ("CPF 000.000.000/00-NOME") e 42 com CNPJ. Esses nomes vêm assim do arquivo oficial e são públicos. Mesmo assim, aparecem na planilha gerada sempre que uma notificação usa uma dessas unidades. Nenhuma delas aparece nos dados de dengue de 2025.

Atualização de 15/11/2026: uma busca mais ampla achou 45 nomes com números de 11 dígitos, em geral o CPF do profissional, com ou sem o rótulo "CPF" e em formatos variados. Desde então, o gerador da tabela (`ferramentas/gerar-tabelas.js`) troca esses números por "[número omitido]" e mantém o resto do nome. Os CNPJ (14 dígitos) não são afetados.

### 7.4 Regionais do SINAN (ID_REGIONA e ID_RG_RESI)

**Decisão do Rubens (02/11/2026):** manter como está. O código da regional do SINAN fica como veio, porque não há tabela oficial que corresponda a ele. A tabela de regiões de saúde do DATASUS coincide em só 2% dos códigos, e as tabelas `*_regsaud.cnv` do pacote TAB_CNES usam essa mesma numeração. Para análise, a planilha traz as colunas extras "Região de saúde" (REGSAUD_NOT e REGSAUD_RES), calculadas pelo município com a tabela oficial do DATASUS. O repositório do GitHub com regionais de saúde (lansaviniec/shapefile_das_regionais_de_saude_sus), que não é fonte oficial, não foi usado.

### 7.5 Planilha de regiões e macrorregiões de saúde do Ministério da Saúde

- **Arquivo:** `docs/fontes/tabelas-apoio/Regionais/4caf4b19-1dc1-4980-9dbf-f7396f2851d9.xlsx`. O nome é o que o painel deu ao arquivo.
- **Origem:** painel "Macrorregiões" da SEIDIGI/DEMAS do Ministério da Saúde (https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_MACRORREGIOES/SEIDIGI_DEMAS_MACRORREGIOES.html), baixado pelo Rubens em 02/11/2026. Segundo o painel, a atualização é de 02/11/2026 às 06:00:22, com dados do Departamento de Gestão Interfederativa e Participativa (DGIP/SE/MS), informação do Rubens. A população vem da estimativa do IBGE de 2022.
- **Conteúdo:** 5.571 municípios, cada um com região (439), macrorregião (121) e, para 53 municípios, a macrorregião interestadual (MIS-PEBA, Pernambuco e Bahia).

Comparação, feita em 02/11/2026:

- **Regionais do SINAN:** a planilha usa a mesma numeração das regiões de saúde do DATASUS. Só 2,1% dos registros de dengue de 2025 têm em ID_REGIONA ou ID_RG_RESI um código que existe na planilha. **A pendência continua** (ver 7.4).
- **Região de saúde por município:** igual à tabela do DATASUS usada na coluna extra "Região de saúde" em todos os 5.571 municípios. O DATASUS tem um código a mais, 530000 (Distrito Federal sem município). Os nomes das regiões só diferem em maiúsculas e acentos. **Isso confirma a coluna extra atual.**
- **Macrorregião por município:** igual à relação do DATASUS (`rl_regsaud_macsaud.csv` com `tb_macsaud.csv`) em 5.561 municípios. A diferença está nos 10 municípios da região 11003 (Central, RO): no DATASUS ela pertence à macro 1102 (Porto Velho) e no painel à macro 1101 (Cacoal).
