# Inventário das fontes e pendências: Violência interpessoal/autoprovocada

Documento de trabalho, gerado em 10/11/2026. Nada aqui foi transformado em dicionário ainda. Serve para o Rubens conferir e decidir as pendências.

## 1. O que é cada arquivo

| Arquivo | O que é | Papel no projeto |
|---|---|---|
| `docs/fontes/violencia/DIC_DADOS_NET_Violencias_v5.pdf` | Dicionário de dados Sinan NET versão 5.0/Patch 5.1, Violência Interpessoal/Autoprovocada (Ministério da Saúde, Secretaria de Vigilância em Saúde, Departamento de Vigilância Epidemiológica, GT-Sinan). Rodapé "Revisado junho/2015". Traz a coluna "DBF" | **Fonte principal** dos campos 1 a 69 |
| `docs/fontes/violencia/violencia_v5.pdf` | Ficha de notificação individual de violência interpessoal/autoprovocada, Sinan, rodapé "SVS 15.06.2015". Agravo Y09 na própria ficha | Referência visual e conferência dos rótulos |
| `docs/fontes/violencia/DIC_DADOS_violencias_4_2_naovigente.pdf` | Dicionário de variáveis da ficha anterior: "Ficha de notificação/investigação individual violência doméstica, sexual e/ou outras violências" (Ministério da Saúde, SVS, Coordenação Geral de Doenças e Agravos Não Transmissíveis). Versão 4.2, conforme o nome do arquivo, que também diz "não vigente". **O documento não traz data.** Obtido pelo Rubens em 10/11/2026 | Fonte dos campos da ficha anterior que o dicionário de 2015 não descreve (ver 2.1) |
| `docs/fontes/notificacao-individual/Dicionario das Fichas de Notificação Individual.pdf` | Já usado nos outros agravos (NOTIF2018) | Campos internos (datas de transferência, digitação) e escolaridade |

Arquivos de dados (públicos, fora do Git): `dados_publicos/violencia/VIOLBR24.dbc` (616.548 registros) e `dados_publicos/violencia/VIOLBR25.dbc` (737.540 registros). Os dois têm as mesmas 159 colunas, na mesma ordem. Não trazem nome, endereço nem telefone.

## 2. Comparação das colunas: dicionário × arquivo real

Lido só o cabeçalho dos DBC. A comparação procurou o nome de cada coluna do arquivo no texto do dicionário.

**Encontradas no dicionário, só com o nome quebrado em duas linhas ou com acento no PDF** (não é diferença real):

- `NUM_ENVOLV`, `ATEND_MULH`, `DELEG_MULH` (quebrados em duas linhas)
- `DELEG_IDOS` e `PROC_VAGIN`: o PDF parece escrever com uma letra a mais, na linha de baixo (`DELEG_IDOSO`, `PROC_VAGINA`). A conferir na página; o arquivo tem 10 caracteres, como todo nome de coluna DBF
- `REL_IRMAO` (o PDF escreve `REL_IRMÃO`)

**Nome diferente entre o dicionário e o arquivo:**

- Campo 64 (ciclo de vida do provável autor): o dicionário diz `CICL_VID_AUTOR` (quebrado); o arquivo traz `CICL_VID`.
- Campo 65 (encaminhamento, Rede da Saúde): o dicionário diz `ENC_SAUDE`; o arquivo traz `REDE_SAU` (preenchida em quase todos os registros) **e também** `ENC_SAUDE` (só 501 registros preenchidos em 2025, junto com outros campos antigos). Ver P2.

**No arquivo e não no dicionário de violência:**

- Campos comuns da notificação: `ANO_NASC`, `DT_INVEST`, `CLASSI_FIN`, `EVOLUCAO`, `DT_OBITO`, `DT_DIGITA`, `DT_TRANSUS`, `DT_TRANSDM`, `DT_TRANSSM`, `DT_TRANSRM`, `DT_TRANSRS`, `DT_TRANSSE`, `TPUNINOT`.
- Campos que parecem ser da ficha anterior a 2015 (ver P1): `SEX_PUDOR`, `PEN_ORAL`, `PEN_ANAL`, `PEN_VAGINA`, `CONS_ABORT`, `CONS_GRAV`, `CONS_DST`, `CONS_SUIC`, `CONS_MENT`, `CONS_COMP`, `CONS_ESTRE`, `CONS_OUTR`, `CONS_ESPEC`, `LESAO_NAT`, `LESAO_ESPE`, `LESAO_CORP`, `REL_SEXUAL`, `ENC_TUTELA`, `ENC_VARA`, `ENC_ABRIGO`, `ENC_SENTIN`, `ENC_DEAM`, `ENC_DPCA`, `ENC_DELEG`, `ENC_MPU`, `ENC_MULHER`, `ENC_CREAS`, `ENC_IML`, `ENC_OUTR`, `ENC_ESPEC`, e `ENC_SAUDE`.

### 2.1 O dicionário da versão 4.2 (ficha anterior)

Verificado em 10/11/2026, pelo texto extraído do PDF. Ele descreve quase todos os campos antigos do arquivo, inclusive `CLASSI_FIN` (campo 68, escrito `CLAS_FINAL`) e `EVOLUCAO` (campo 69, escrito `EVOLUCÃO`), com categorias que batem com os valores encontrados em 2025 (seção 3).

Vários nomes no PDF têm mais de 10 caracteres, e o arquivo DBF guarda só os 10 primeiros. Exemplos: `CONS_ESTRES` → `CONS_ESTRE`, `ENC_TUTELAR` → `ENC_TUTELA`, `ENC_SENTINELA` → `ENC_SENTIN`, `LESAO_CORPO` → `LESAO_CORP`, `REL_SEXUAIS` → `REL_SEXUAL`, `PROC_ABORTO` → `PROC_ABORT`. Outros mudam o fim: `CONS_OUTROS` × `CONS_OUTR`, `ENC_OUTROS` × `ENC_OUTR`, `LESAO_ESPEC` × `LESAO_ESPE`, `PEN_VAGINAL` × `PEN_VAGINA`. A correspondência será mostrada na planilha de conferência.

Continuam sem fonte: `CONS_ABORT` (o texto extraído não mostra o nome DBF; será procurado na página), `ANO_NASC` e `TPUNINOT`.

**No dicionário e não no arquivo:** os dados de identificação e endereço (nome, data de nascimento, cartão SUS, nome da mãe, bairro, logradouro, CEP, telefone, geocampos), a unidade notificadora (`ID_UNIDADE`, `NM_UNI_EXT`, `CO_UNI_EXT`, `TP_UNI_EXT`, `CNES_NOT`), regionais (`ID_REGIONA`, `ID_RG_RESI`), distrito, bairro e logradouro de ocorrência, `ZONA`, `ZONA_OCOR`, `IN_VINCULA`, `DS_OBS`. Foram retirados do arquivo público.

## 3. Valores que aparecem de fato em 2025

Contagem feita em 10/11/2026 com `node ferramentas/contar-valores.js dados_publicos/violencia/VIOLBR25.dbc <COLUNAS>` (só totais).

| Coluna | O que se vê | Observação |
|---|---|---|
| Campos da ficha anterior (`SEX_PUDOR`, `PEN_*`, `CONS_*`, `LESAO_*`, `REL_SEXUAL`, `ENC_*`) | Em branco em mais de 99,9% dos registros; algumas centenas preenchidos | `SEX_PUDOR` tem 25.872 registros com "9" e 1.082 com "8" |
| `CLASSI_FIN` | Em branco em 737.004; 1 (426), 8 (61), 2 (35), 3 (14) | A ficha de 2015 não tem classificação final |
| `EVOLUCAO` | Em branco em 737.062; 1, 9, 3, 2, 4 (478 no total) | Também não está na ficha de 2015 |
| `TPUNINOT` | Sempre em branco | |
| `REDE_SAU` | 1 (482.347), 2 (202.526), 9 (22.569), em branco (30.098) | É o campo 65 "Rede da Saúde" em uso |
| `CICL_VID` | 1 a 5 e 9, mais 27.338 em branco | Bate com as categorias do campo 64 |
| `VIOL_MOTIV`, `LOCAL_OCOR` | Sempre com dois dígitos ("01", "09", "88", "99") | O dicionário diz `varchar2(1)`, mas lista códigos de dois dígitos; o arquivo traz 2 caracteres |
| `CS_ESCOL_N` | "00" a "10", sempre com dois dígitos | O PDF do dicionário repete o "43 Analfabeto" já visto nos outros agravos; a ficha diz 0-Analfabeto |

## 4. Trechos difíceis de ler no PDF

O dicionário tem colunas desalinhadas: em várias páginas, as categorias de um campo aparecem ao lado do campo seguinte. A transcrição será feita olhando a página, não o texto extraído. Pontos já vistos:

- Campo 39 (deficiências): a ordem das categorias está embaralhada no texto ("1. 2. 8. 9." de um lado, "Sim, Não, Não se aplica, Ignorado" do outro). A ficha confirma: 1-Sim, 2-Não, 8-Não se aplica, 9-Ignorado.
- Campo 37 (identidade de gênero): o dicionário diz "2. Transexual Mulher, 3. Transexual Homem"; a ficha diz "2-Mulher Transexual, 3-Homem Transexual". Ver P4.
- Campo 12 (idade): mesma regra dos outros agravos (1º dígito = unidade).

## 5. Pendências para decisão do Rubens

- **P1.** Campos da ficha anterior a 2015: **resolvida em 10/11/2026.** O Rubens forneceu o dicionário da versão 4.2 (seção 2.1). **Regra decidida pelo Rubens (10/11/2026):** quando as duas versões descrevem a mesma coluna de forma diferente, vale o dicionário de 2015; a versão 4.2 só é usada nos campos que o de 2015 não tem.
- **P2.** `ENC_SAUDE` × `REDE_SAU`: proposta, como na dengue, seguir o arquivo real. `REDE_SAU` recebe o campo 65 "Rede da Saúde" do dicionário de 2015; `ENC_SAUDE` recebe o campo da versão 4.2.
- **P3.** `CLASSI_FIN` e `EVOLUCAO` passam a ter fonte (versão 4.2). Continuam sem fonte `TPUNINOT` (sempre em branco) e `ANO_NASC`.
- **P4.** Rótulos que divergem entre dicionário e ficha (por exemplo, identidade de gênero): qual seguir? Nos outros agravos a regra foi "o documento mais recente"; aqui os dois são de junho de 2015.
- **P5.** `CIRC_LESAO` traz um código CID-10 (capítulo XX). O projeto não tem tabela de CID-10; sem ela, o código fica como veio.
  - Atualização (15/11/2026): tabela `dicionarios/tabelas/cid10.json`, gerada por `ferramentas/gerar-cid10.js` a partir das tabelas do TabWin 2019 (`CNVS CID10 v2019`) e da CID-10 2008 em CSV (`CID10-CSV`), pela regra aprovada pelo Rubens: vale o nome do TabWin 2019; nome cortado é completado com a CSV 2008 só se o começo for igual. 14.447 códigos (1.854 completados), 18 pendências. No arquivo de 2025, o campo também traz códigos de outros capítulos (T74, R45, Z61 etc.); 320.775 dos 320.957 registros preenchidos ganham nome, e os 182 restantes (como `X59.2`, `Y042` sem ponto e números de 5 dígitos) vão para as Inconsistências. Amostra conferida pelo Rubens em 15/11/2026 em `docs/conferencia/conferencia-cid10.xlsx`: 70 de 70 nomes certos (50 completados pela CSV 2008 e 20 inteiros do TabWin).

## 6. Conferência e teste (10/11/2026)

- Dicionário conferido pelo Rubens em duas rodadas na planilha `docs/conferencia/conferencia-violencia.xlsx`; 9 categorias que ele ditou foram confirmadas no chat.
- Teste no navegador (Edge, arquivo `VIOLBR25.dbc`, 737.540 registros, 159 colunas, todas reconhecidas):
  - Excel com o Brasil inteiro: a ferramenta avisa que passaria de 4 GB e não gera a planilha (comportamento previsto).
  - Excel filtrado pelo Rio de Janeiro (UF 33): 81.804 registros, 59,7 MB, em 86 s.
  - CSV com o Brasil inteiro: 958 MB, em 105 s.
  - Nenhuma conexão para fora do computador.
- Valores sem tradução no Brasil inteiro: 223.726, dos quais 223.558 são códigos especiais de ocupação do Sinan (`ID_OCUPA_N`, por exemplo 999991). O restante: 57 municípios de residência sem região de saúde, 52 idades fora dos limites, 1 município de notificação.
- O teste acusou um aviso de segurança da página (um estilo bloqueado pela política de conteúdo). O mesmo aviso aparece na versão 1.0.0 congelada e com o exemplo de dengue; não foi causado por este dicionário.
  - Causa (investigada em 10/11/2026): o Git no Windows entrega o arquivo de estilo com quebras de linha CRLF nas cópias de trabalho; o navegador troca CRLF por LF antes de conferir o estilo, a conferência não batia e o estilo inteiro da página era bloqueado (a tela abria sem formatação). O pacote 1.0.0 distribuído foi gerado com LF e não foi afetado. Corrigido em `ferramentas/construir.js`, que agora converte as quebras de linha para LF antes de calcular a conferência; a política de segurança continua a mesma.

## 7. Códigos especiais de ocupação (decisão de 10/11/2026)

Os códigos especiais do Sinan em `ID_OCUPA_N` (999991, 999992, 999993, 999994, 999995, 998999, XXX) aparecem em dois documentos que o Rubens encontrou: uma "Consulta Ocupação" impressa do Sinan NET (`736621032-LISTA-DE-OCUPACOES-SINAN-NET.pdf`) e uma planilha CBO do CEREST Tocantins (`Anexo-A-do-instrutivo.pdf`). Nenhum dos dois tem origem oficial verificável, e por isso eles não entraram no projeto.

Atualização (15/11/2026): o Rubens baixou do DATASUS o pacote TAB_SINANNET do TabWin. Nele, o `ViolenciaNet.def` (GT-Sinan/MS) lê `ID_OCUPA_N` pela tabela `OCUPANET.DBF`, que traz esses códigos com nome. A ferramenta passou a usá-la como complemento da CBO 2002 (a CBO tem prioridade): `dicionarios/tabelas/ocupacoes-sinan.json`, gerada por `ferramentas/gerar-ocupacoes-sinan.js`, com os 9 códigos do OCUPANET ausentes da CBO. No arquivo de 2025, 220.513 dos 223.558 valores antes sem tradução ganham nome; continuam sem nome 10001 (2.516), 999990 (515) e poucos outros. O DBF está na página de código 850 do DOS. Conferida pelo Rubens em 15/11/2026 (`docs/conferencia/conferencia-ocupacoes-sinan.xlsx`): 7 nomes certos e 2 com observação, ambos mantidos como no arquivo oficial por decisão dele. 223610 (FONOAUDIOLOGO) é código antigo, ausente da CBO 2002 (Fonoaudiólogo é 223810). 999994 diz "HABITACAO HABITUAL", provável erro de digitação de "ocupação", sem documento que confirme. As duas observações ficam gravadas na tabela. O complemento foi aplicado também aos outros sete agravos; os arquivos de definição de Chagas, chikungunya, dengue, malária e das leishmanioses usam o mesmo `ocupanet.dbf` (a zika não tem arquivo de definição próprio no pacote).

**Decisão do Rubens:** os códigos ficam como vieram, como nos demais agravos, até haver documento oficial.

## 8. Conferência por amostra (11/11/2026)

O Rubens conferiu 100 células sorteadas do `VIOLBR25.dbc` e encontrou 0 erros (IC 95%: 0% a 3,62%). Detalhes em `docs/validacao/relatorio-conferencia-amostra-violencia.md`.
