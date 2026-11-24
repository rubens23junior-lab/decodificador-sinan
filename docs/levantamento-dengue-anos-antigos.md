# Levantamento: arquivos antigos de dengue (2000 a 2018)

Documento de trabalho, de 23/11/2026. Os arquivos públicos de dengue de 2000 a 2018 (DENGBR00 a DENGBR18) foram comparados com o dicionário atual de dengue (`dicionarios/dengue.json`, Sinan Online, a partir de 2016). O de 2025 entrou como referência.

## Resultado por época

| Anos | Colunas | O programa (1.1.1) | Situação |
|---|---|---|---|
| 2000 a 2006 | 107 | Recusa o arquivo ("só 33 das 107 colunas correspondem") | Outra estrutura (SINAN da época). Precisa de dicionário próprio |
| 2007 a 2013 | 67 | **Aceita** | **Traduz errado algumas colunas, sem aviso** (ver abaixo) |
| 2014 a 2018 | 121 | Aceita | Mesmas colunas do dicionário atual; poucos códigos sem tradução |
| 2025 | 121 | Aceita | Referência (34.252 registros com "0" em vários campos, já conhecidos) |

## O problema de 2007 a 2013

As 67 colunas desses arquivos têm os mesmos nomes de colunas do dicionário atual, por isso o arquivo é aceito. Mas alguns campos tinham outro significado na ficha do Sinan NET. As conversões oficiais do TabWin (`DengueNET.def` e os `.cnv` em `docs/fontes/tabelas-apoio/TAB_SINANNET`) mostram:

| Coluna | Na ficha antiga (TabWin) | No dicionário atual | Efeito em 2007-2013 |
|---|---|---|---|
| CLASSI_FIN | 1 Dengue Clássico; 2 Dengue com complicações; 3 Febre Hemorrágica do Dengue; 4 Síndrome do Choque do Dengue; 5 Descartado; 8 Inconclusivo (`-Classdeng.cnv`) | 1 Confirmado; 2 Descartado; 8 Inconclusivo; 10 a 13 | Código 2 sai como "Descartado", mas era "Dengue com complicações". Código 1 sai como "Confirmado" (perde o tipo). 3 e 4 ficam sem tradução |
| COMPLICA | Tipo de complicação: 1 Alterações neurológicas ... 8 Não se enquadra em FHD (`CompdengM50mil.cnv` até 2010, `CompdengM20mil.cnv` depois) | 1 Sim; 2 Não; 9 Ignorado | 1 e 2 saem como Sim/Não, errado |
| CON_FHD | Grau da FHD: 1 a 4; 5 Não se aplica (`graufhd.cnv`) | 1 Sim; 2 Não; 9 Ignorado | 1 e 2 saem como Sim/Não, errado |
| EVIDENCIA | 1 Hemoconcentração; 2 Derrames cavitários; 3 Hipoproteinemia (`Evideng.cnv`) | 1 Sim; 2 Não; 9 Ignorado | 1 e 2 saem como Sim/Não, errado |
| PLAQ_MENOR | Contagem de plaquetas (número) | 1 Sim; 2 Não; 9 Ignorado | Número sai sem tradução (amarelo) |
| CRITERIO | Duas conversões: até 2010 (`CONFDESC.CNV`) e depois de 2010 (`CONFDESCDENG2011.CNV`) | 1 Laboratório; 2 Clínico-epidemiológico; 3 Clínico | A conferir |

Volume afetado (registros com código fora do dicionário atual, só os que aparecem em amarelo): CLASSI_FIN 3.670 em 2010; COMPLICA 13.602 em 2010. Os registros traduzidos errado (códigos 1 e 2) não aparecem nessa conta, porque o programa os encontra no dicionário.

## O que fazer

1. **Correção de segurança, logo:** o programa deve reconhecer um arquivo de dengue com a estrutura antiga (67 colunas, sem as colunas da ficha nova) e recusá-lo com uma mensagem clara, até existir um dicionário para ele.
2. **Dicionário da dengue do Sinan NET (2007 a 2013):** montado a partir do `DengueNET.def`, dos `.cnv` e, de preferência, do dicionário de dados oficial da época (não está no pacote Docs_TAB_SINAN, que só tem o Sinan Online). Conferência pelo Rubens, como nos outros.
3. **Dicionário de 2000 a 2006:** depende de documentação da época.
4. **Outros agravos:** o mesmo risco (coluna com o mesmo nome e outro significado em ficha antiga) pode existir. O levantamento por agravo deve comparar os códigos com as conversões do `.def` de cada agravo, e não só os nomes das colunas.
