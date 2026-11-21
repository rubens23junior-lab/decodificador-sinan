# Comparação com o microdatasus

Situação em 06/11/2026, comparações refeitas na versão 1.0.0 da ferramenta. Esta é a primeira parte da validação para uso científico (seção 13 dos requisitos): a "comparação com outro método". A dengue vem primeiro. Chikungunya, zika e as duas leishmanioses estão na última seção.

## Método

- **Arquivo:** `DENGBR25.dbc`, baixado do DATASUS pelo Rubens em 01/11/2026. Tem 1.643.215 notificações e 121 colunas. As duas ferramentas leram o mesmo arquivo, sem nenhuma conversão no meio.
- **Nossa ferramenta (versão 1.0.0):** dicionário de dengue conferido pelo Rubens em 01/11/2026. A comparação roda o mesmo código usado na tela (`validacao/ferramenta-pares.js`).
- **microdatasus 3.0.0** (R 4.6.1):
  - Leitura com o leitor interno que o `fetch_datasus()` usa (`read_dbc`, `as_character = TRUE`).
  - Decodificação com `process_sinan_dengue(municipality_data = FALSE)`, pelo script `validacao/microdatasus-pares.R`.
  - A opção `municipality_data = FALSE` só evita a junção que acrescenta colunas de municípios. Assim, as linhas ficam na mesma ordem do arquivo.
- **Comparação:** `validacao/comparar.js` olha cada coluna e cada código original. Para cada um, registra o texto da nossa ferramenta, o texto do microdatasus e o número de registros. Nenhum registro individual sai desse processo; o resultado só tem códigos e contagens.
- **Resultado completo:** `docs/validacao/comparacao-dengue.xlsx`, com três abas:
  - Resumo;
  - Diferenças, uma linha por código, com a fonte oficial que a ferramenta usou;
  - Por coluna.

Para repetir a comparação:

```
Rscript validacao/microdatasus-pares.R dados_publicos/dengue-chikungunya/DENGBR25.dbc process_sinan_dengue dados_publicos/saida/pares-microdatasus-dengue.csv
node validacao/ferramenta-pares.js dados_publicos/dengue-chikungunya/DENGBR25.dbc dengue dados_publicos/saida/pares-ferramenta-dengue.csv
node validacao/comparar.js dengue dados_publicos/saida/pares-ferramenta-dengue.csv dados_publicos/saida/pares-microdatasus-dengue.csv --versao-microdatasus 3.0.0 --arquivo DENGBR25.dbc
```

## Resultado geral

A contagem vai por registro e por coluna, ou seja, cada célula da planilha conta uma vez.

| Grupo | Códigos | Células |
|---|---:|---:|
| Igual | 6.961 | 166.898.416 |
| Só grafia (acentos, maiúsculas, º) | 1.262 | 1.204.467 |
| Significado diferente | 244 | 3.507.969 |
| Só a ferramenta traduz | 45.696 | 10.697.588 |
| Só o microdatasus traduz | 108 | 3.459.767 |
| Microdatasus apaga o valor | 32 | 1.571.271 |
| Nenhuma traduz (texto livre, códigos sem tabela) | 1.184 | 11.489.537 |

As contagens de registros por código são idênticas nas duas ferramentas. Isso confirma que as duas leram o arquivo da mesma forma. Na versão 1.0.0, as idades implausíveis deixaram de ser traduzidas pela ferramenta; por isso, parte delas passou de "Significado diferente" para "Só o microdatasus traduz".

## Achados

### A. Erros no código do microdatasus 3.0.0

Os erros abaixo foram conferidos no próprio código da função `process_sinan_dengue`.

1. **Idade.** A função lê só o 2º e o 3º dígito do código de idade: `substr(NU_IDADE_N, 2, 3)`. O código 4018 (18 anos) vira 1 ano, 4072 (72 anos) vira 7 anos, e 3009 (9 meses) vira 0 meses. Isso afeta 1.643.202 registros, praticamente todos. A nossa ferramenta usa os três dígitos, como manda o dicionário.
2. **Resultado do PCR sobrescrito pelo sorotipo.** O trecho do `SOROTIPO` grava o resultado em `RESUL_PCR_`. Com isso, a coluna do PCR perde o resultado (Positivo/Negativo) e passa a mostrar o sorotipo ("DEN 1", "DEN 2"…), ou fica vazia. A coluna `SOROTIPO` fica sem tradução (48.978 registros).
3. **Imuno-histoquímica sobrescrita pela hospitalização.** O trecho da `HOSPITALIZ` grava "Sim/Não/Ignorado" em `IMUNOH_N`. A coluna `HOSPITALIZ` fica sem tradução (1.280.947 registros com código).
4. **Grafia de UF.** O código 17 aparece como "Tocantis", sem o "n", nas colunas `UF` e `COUFINF`.

### B. Diferenças de dicionário

Nesses casos, a nossa ferramenta segue o dicionário conferido (DIC2024).

| Coluna | Código | Nossa ferramenta (fonte) | microdatasus | Registros |
|---|---|---|---|---:|
| CRITERIO | 3 | Clínico (DIC2024 p. 12) | Em investigação | 22.480 |
| EVOLUCAO | 2 | Óbito pelo agravo (DIC2024 p. 13) | Óbito por dengue | 1.856 |
| RESUL_NS1, RESUL_VI_N, HISTOPA_N | 1 / 2 | Reagente / Não Reagente (DIC2024) | Positivo / Negativo | 11.888 |
| CS_ESCOL_N | 0 | Analfabeto (DIC2024 p. 5) | sem tradução | 5.844 |
| CS_ESCOL_N | 9 | Ign/Branco (DIC2024 p. 5) | Ignorado | 513.561 |
| CS_ESCOL_N | 3 a 6 | textos do DIC2024 | textos mais longos ("antigo ginásio ou 1º grau") | 522.090 |
| CLASSI_FIN, CRITERIO | 0 | Ignorado (DIC2024 p. 12) | sem tradução | 3.284 |
| TP_SISTEMA | 2 | Sinan Online | sem tradução | 1.590.657 |
| ID_AGRAVO | A90 | Dengue | sem tradução | 1.643.215 |

O microdatasus também traz rótulos de versões antigas da ficha que não aparecem neste arquivo, como "Dengue clássico" e "Febre hemorrágica do dengue" em CLASSI_FIN.

### C. Códigos sem fonte oficial

A nossa ferramenta mantém esses códigos como vieram e os lista nas Inconsistências. O microdatasus faz outra coisa:

- **País:** em `ID_PAIS` e `COPAISINF`, o código 1 vira "BRASIL" (2.783.892 células). É a pendência que o Rubens decidiu manter sem tradução por falta de fonte documental. O microdatasus não informa de onde vem essa tabela.
- **UF:** em `UF` e `COUFINF`, o código 0 vira "Ignorado" (67.427 células). Não há fonte para isso.
- **Valores apagados.** Quem usa o microdatasus não fica sabendo que esses valores existiam:
  - códigos especiais de ocupação (999991, 998999, 999993, 999992, XXX…; 290.672 registros);
  - `COPAISINF` 0 (502.506);
  - códigos de idade fora do formato (0, 6, 62).

### D. Só grafia

São 1,2 milhão de células, quase todas em `ID_OCUPA_N`: o microdatasus usa os nomes da CBO sem acento. Também entram "1o trimestre" contra "1º Trimestre" e "Não reagente" contra "Não Reagente". Nada disso muda o significado.

### E. Pontos decididos depois da comparação

- **Idades implausíveis (decidido em 02/11/2026).** Antes, a ferramenta aplicava a regra do dicionário sem verificar se o resultado fazia sentido: 4405 virava "405 anos", e 3300, "300 meses".
  - **Fontes:** nenhum documento oficial de `docs/fontes` define uma idade máxima geral. Só há limites para outros agravos: rubéola congênita (2 anos), sífilis congênita e AIDS criança (12 anos).
  - **Decisão do Rubens:** os limites passaram a ser 23 horas, 29 dias, 11 meses e 110 anos, registrados no campo `maximo` de cada unidade, nos cinco dicionários.
  - **Como funciona:** acima do limite, o código fica como veio, destacado, e vai para a aba Inconsistências com o motivo, por exemplo "Idade implausível: acima de 110 anos". "0 dias" (2000), que é recém-nascido, continua traduzido.
  - **Dengue 2025:** passam a ser sinalizados 60 registros acima de 110 anos, 16 com 24 horas ou mais, 36 com 30 dias ou mais e 34 com 12 meses ou mais.

## Chikungunya, zika e leishmanioses

Usei o mesmo método e os mesmos scripts. Os resultados estão em `docs/validacao/comparacao-<agravo>.xlsx`.

| Agravo | Arquivo | Registros | Função do microdatasus |
|---|---|---:|---|
| Chikungunya | `CHIKBR25.dbc` | 253.753 | `process_sinan_chikungunya` |
| Zika | `ZIKABR25.dbc` | 25.764 | `process_sinan_zika` |
| Leishmaniose tegumentar | `LTANBR25.dbc` | 11.299 | `process_sinan_leishmaniose_tegumentar` |
| Leishmaniose visceral | `LEIVBR25.dbc` | 9.168 | `process_sinan_leishmaniose_visceral` |

Em 06/11/2026, a comparação de leishmaniose visceral foi refeita com o arquivo original `LEIVBR25.dbc`, de 2025, no lugar do `LVH.csv` (2016 a 2025, extraído com o `fetch_datasus()`). Assim, os cinco agravos ficam com o mesmo ano e o mesmo formato. As contagens por código são idênticas nas duas ferramentas nos cinco agravos.

| Grupo (células) | Chikungunya | Zika | LTA | LV |
|---|---:|---:|---:|---:|
| Igual | 26.182.756 | 605.076 | 563.968 | 598.071 |
| Só grafia | 125.537 | 6.685 | 25.471 | 1.312 |
| Significado diferente | 485.624 | 28.368 | 24.106 | 9.828 |
| Só a ferramenta traduz | 1.556.984 | 128.035 | 83.992 | 49.242 |
| Só o microdatasus traduz | 467.141 | 31.725 | 21.222 | 10.584 |
| Microdatasus apaga o valor | 309.715 | 23.597 | 7.098 | 18.227 |
| Nenhuma traduz | 1.830.109 | 155.546 | 98.970 | 110.140 |

### A. Erros no código do microdatasus 3.0.0

Os erros abaixo foram conferidos no código das funções.

1. **As quatro funções param com erro.** O trecho da idade compara `NU_IDADE_N` com o número 999. Só que o leitor do próprio pacote (`read_dbc`, `as_character = TRUE`, o mesmo do `fetch_datasus()`) entrega a coluna como texto. Com o dplyr 1.2.1, a função para com a mensagem "Can't convert `..1 (left)` <double> to <character>". **Para a comparação seguir**, a idade foi convertida para número só na entrada da função; o script registra esse ajuste. A dengue não tem o problema.
2. **Idade:** é o mesmo erro da dengue (lê só o 2º e o 3º dígito) e afeta praticamente todos os registros dos quatro agravos.
3. **Imuno-histoquímica sobrescrita pela hospitalização** também na chikungunya, como na dengue. A coluna `HOSPITALIZ` fica sem tradução.
4. **Textos copiados de outro agravo:**
   - Zika: `EVOLUCAO` 2 aparece como "Óbito por dengue" (1 registro).
   - Leishmaniose tegumentar: `EVOLUCAO` 3 aparece como "Óbito por LV" (16 registros), quando deveria ser "Óbito por LTA" (DICLTA p. 10, campo 56).
   - Leishmaniose tegumentar: `TRA_OUTR_N` (outra droga, usada na falência do tratamento) recebe a lista da droga inicial: 1 Antimonial Pentavalente, 2 Anfotericina b, 3 Pentamidina, 4 Outras. O dicionário oficial (DICLTA p. 6, campo 46, conferido no PDF) diz 1 Anfotericina B, 2 Pentamidina, 3 Outros, 4 Não se aplica. São **5.222 registros com o significado trocado**; 4.498 deles ("Não se aplica") aparecem como "Outras".
5. **"Tocantis"**, sem o "n", em `COUFINF`, nos quatro agravos.

### B. "Ignorado" vira campo vazio

O microdatasus transforma o código 9 (Ignorado) em vazio em várias colunas. Quem usa o pacote não consegue mais separar "ignorado" de "não preenchido":
- **Leishmaniose visceral:** `HIV` (1.267 registros); 12 sinais e sintomas (`FEBRE`, `FRAQUEZA`, `EDEMA`, `EMAGRA`, `TOSSE`, `PALIDEZ`, `BACO`, `INFECCIOSO`, `FEN_HEMORR`, `FIGADO`, `ICTERICIA`, `OUTROS`); `ENTRADA`; e `DOENCA_TRA`.
- **Leishmaniose tegumentar:** `CLI_CO_HIV` (1.927), `CLA_TIPO_N`, `CLAS_FORMA` e `DOENCA_TRA`.

Nos quatro agravos, o pacote também apaga os códigos especiais de ocupação (999991, 999992, 999993…) e o código 0 de país de infecção.

### C. Códigos que só a nossa ferramenta traduz, todos com fonte oficial

- **Leishmaniose visceral:** `DROGA` 6 "Não utilizada" (3.217), `DOSE` 1 a 3, `FALENCIA` 4 "Não se aplica" (174), `CO_UF_1` a `CO_UF_3`.
- **Leishmaniose tegumentar:** `TRA_DOSE` 1 a 5, `EVOLUCAO` 6 "Mudança de diagnóstico" (335), `LAB_PARASI` 3 e `LAB_IRM` 3 "Não realizado".
- **Zika:** `CS_ESCOL_N` com dois dígitos ("01" a "09", 20.204 registros); `NDUPLIC_N` e `IN_VINCULA`.
- **Todos:** o código do agravo (`ID_AGRAVO`).

### D. Diferenças de dicionário e códigos sem fonte

- Os exames aparecem como Positivo/Negativo no microdatasus e como Reagente/Não Reagente na nossa ferramenta (decisão do Rubens, pelo DIC2024). A escolaridade tem textos mais longos no pacote. Na LTA, `EVOLUCAO` 1 é "Cura" no pacote e "Alta por cura" no DICLTA.
- **Zika:** o microdatasus traduz `CLASSI_FIN` 8 como "Inconclusivo" (1.353 registros). O dicionário de zika não tem esse código, e ele continua como pendência.
- **Países:** o pacote usa uma tabela própria de países (1 BRASIL, 126 PARAGUAI, 138 VENEZUELA, 199 GUIANA…), sem informar a fonte. Na nossa ferramenta, isso segue como pendência, por decisão do Rubens.
- `COUFINF` 0 vira "Ignorado" no pacote, sem fonte.
