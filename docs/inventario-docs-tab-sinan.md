# Inventário do pacote de documentação do TAB_SINAN (DATASUS)

Documento de trabalho, de 13/11/2026. Serve de mapa para acrescentar agravos. Os documentos só entram em `docs/fontes/<agravo>/` quando o agravo for começado.

## Origem

- **Pacote:** `Docs_TAB_SINAN`, pasta `Documentação/AGRAVOS`, com 134 PDFs. As pastas `MANUAL` e `LEGISLAÇÂO` não são usadas para decodificar.
- **Onde foi obtido:** baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026). A pasta do pacote tem data de 26/03/2025.
- **Conferência de autenticidade:** os PDFs que o projeto já usava são idênticos, byte a byte, aos do pacote:
  - `DENGON_DIC_DADOS.pdf` = `DIC_DADOS_ONLINE.pdf`, e `DENGON_FICHA.pdf` = `Ficha_DENGCHIK_FINAL.pdf`;
  - `LEISHN_*` = dicionário e ficha de leishmaniose visceral;
  - `LTAN_*` = dicionário e ficha de leishmaniose tegumentar;
  - `VIOLEN_*` = dicionário de 2015 e ficha de violência.
- **Arquivo acrescentado à mão:** `AJUSTE-DICIONARIO-DE-DADOS-DA-FICHA-DE-SURTO-DTA.pdf`, com data de 11/11/2026. A origem dele deve ser confirmada quando o surto de DTA for começado.

## Agravos com documento e com arquivo público no DATASUS

A lista de arquivos públicos foi obtida no FTP do DATASUS (`SINAN/DADOS/FINAIS`) em 13/11/2026. A coluna "Revisão" é a data impressa no dicionário. Os nomes dos agravos serão conferidos no dicionário de cada um, ao começar.

| Prefixo do arquivo público | Documentos no pacote | Páginas do dicionário | Revisão |
|---|---|---|---|
| ACBI | ACBION_DIC_DADOS, ACBION_FICHA | 10 | julho/2010 |
| ACGR | ACGRN_DIC_DADOS, ACGRN_FICHA | 7 | julho/2010 |
| ANIM | ANIMPN_DIC_DADOS, FICHA, INSTRUCIONAL | 13 | julho/2010 |
| BOTU | BOTUN_DIC_DADOS, FICHA, INSTRUCIONAL | 21 | julho/2010 |
| CANC | CANCN_DIC_DADOS, CANCN_FICHA | 9 | março/2012 |
| CHAG | CHAGAN_DIC_DADOS, FICHA, INSTRUCIONAL | 16 | julho/2010 |
| COLE | COLEN_DIC_DADOS, FICHA, INSTRUCIONAL | 17 | fevereiro/2012 |
| COQU | COQUEN_DIC_DADOS, FICHA, INSTRUCIONAL | 10 | fevereiro/2012 |
| DERM | DERMN_DIC_DADOS, DERMN_FICHA | 8 | julho/2010 |
| DIFT | DIFTEN_DIC_DADOS, FICHA, INSTRUCIONAL | 12 | julho/2010 |
| ESPO | Dicionario_de_dados_Epizootias_Esporotricose | 1 | sem data; descreve a esporotricose em animais (epizootia), a conferir contra o arquivo |
| ESQU | ESQUIN_DIC_DADOS, FICHA, INSTRUCIONAL | 7 | março/2012 |
| FMAC | FMACUN_DIC_DADOS, FICHA, INSTRUCIONAL | 13 | março/2012 |
| FTIF | FTIFON_DIC_DADOS, FICHA, INSTRUCIONAL | 23 | julho/2010 |
| HANS | HANSN_DIC_DADOS, FICHA, INSTRUCIONAL, CADERNO_ANALISES | 8 | sem data |
| HANT | HANTAN_DIC_DADOS, FICHA, INSTRUCIONAL | 17 | março/2012 |
| IEXO | IEXOGN_DIC_DADOS (julho/2010), FICHA, INSTRUCIONAL; DIC_DADOS_Intoxicacao_Exogena (arquivo de 12/03/2026) | 15 e 16 | a mais recente vale |
| LEPT | LEPTON_DIC_DADOS, FICHA, INSTRUCIONAL | 18 | sem data |
| LERD | LERDN_DIC_DADOS, LERDN_FICHA | 9 | março/2012 |
| MALA | MALAN_DIC_DADOS, FICHA, INSTRUCIONAL | 9 | julho/2010 |
| MENI | MENIN_DIC_DADOS, FICHA, INSTRUCIONAL, CADERNO e TUTORIAL | 23 | julho/2010 |
| MENT | MENTN_DIC_DADOS, MENTN_FICHA | 6 | julho/2010 |
| PAIR | PAIRN_DIC_DADOS, PAIRN_FICHA | 9 | julho/2010 |
| PEST | PESTEN_DIC_DADOS, FICHA, INSTRUCIONAL | 9 | julho/2010 |
| PFAN | PFAN_DIC_DADOS, FICHA, INSTRUCIONAL | 20 | abril/2012 |
| PNEU | PNEUN_DIC_DADOS, PNEUN_FICHA | 7 | março/2012 |
| RAIV | RAIVAN_DIC_DADOS, FICHA, INSTRUCIONAL | 15 | abril/2012 |
| ROTA | DIC_DADOS_ROTA_NET_v5.1 | 6 | arquivo de 09/04/2024 |
| SDTA | SDTA_DIC_DADOS, SDTA_FICHA; AJUSTE da ficha de surto (ver Origem) | 24 | fevereiro/2012 |
| TETA | TETACN_DIC_DADOS, FICHA, INSTRUCIONAL | 10 | fevereiro/2012 |
| TETN | TETANN_DIC_DADOS, FICHA, INSTRUCIONAL | 16 | abril/2012 |
| TUBE | TUBEN_DIC_DADOS, FICHA, FICHA_ACOMP, INSTRUCIONAL, CADERNO | 22 | sem data |

Os dicionários de 2010 e 2012 são mais antigos que os arquivos de 2024 e 2025. Como em violência, deve haver colunas no arquivo que não estão no dicionário; cada caso vira pendência.

## Arquivo público sem documento no pacote

ANTR, DCRJ, NTRA, TOXC, TOXG e TRAC. Só entram se aparecer o dicionário oficial.

## Documento sem arquivo público no FTP

AIDSAN, AIDSCN, HIVAN, HIVCN, HIVCR, HIVG, SIFICN, SIFIGEN, HEPANET, FAMARN, EXANT, SRCN e NINDIN. Sem arquivo real, não há como testar; ficam de fora.

## Já no programa

Dengue, chikungunya (DENGON), zika, leishmaniose visceral (LEISHN), leishmaniose tegumentar (LTAN) e violência (VIOLEN).

## Validação externa

O pacote microdatasus (versão 3.0.0) tem funções de tradução (`process_sinan_*`) para malária e Chagas, além dos agravos já validados. Nesses dois dá para repetir a comparação feita na versão 1.0. Para leptospirose ele só baixa o arquivo, sem traduzir, então não há comparação.
