# Relatório de testes

Situação em 02/11/2026, versão 1.0.0. Foram feitos dois tipos de teste:

- testes automáticos com arquivos fictícios (`npm test`): 83 testes, todos aprovados;
- teste de ponta a ponta no Microsoft Edge (`npm run testar-navegador`), com a ferramenta aberta direto do disco, nos cinco agravos.

## Casos da seção 13 dos requisitos

| # | Caso | Como é testado | Resultado |
|---|---|---|---|
| 1 | Categoria conhecida vira o rótulo correto | `testes/decodificador.test.js` ("categoria conhecida vira o rótulo", inclusive "01" = "1"); `testes/processar.test.js` | Aprovado |
| 2 | Categoria desconhecida: mantida, destacada e listada nas Inconsistências | `testes/decodificador.test.js`; `testes/processar.test.js` (célula com estilo de destaque e linha na aba Inconsistências); no Edge, os 6 valores inválidos do exemplo fictício aparecem | Aprovado |
| 3 | Campo em branco permanece em branco | `testes/decodificador.test.js` ("nunca vira Ignorado"); `testes/processar.test.js` | Aprovado |
| 4 | Idade codificada em horas, dias, meses e anos | `testes/regras.test.js` (1012 = 12 horas; 2001 = 1 dia; 3009 = 9 meses; 4018 = 18 anos). Idade acima do limite decidido pelo Rubens (23 horas, 29 dias, 11 meses, 110 anos): fica como veio e é listada nas Inconsistências (4111, 1024, 2030, 3012) | Aprovado |
| 5 | Data inválida não quebra o processamento | `testes/regras.test.js` (30/02, mês 13, formato errado); `testes/processar.test.js` (fica como veio, destacada e listada) | Aprovado |
| 6 | Acentuação em codificação antiga | `testes/dbf-dbc.test.js` (DBF em windows-1252); `testes/csv.test.js` (CSV em windows-1252 e em UTF-8) | Aprovado |
| 7 | Arquivo do agravo errado: aviso claro e nenhuma planilha | `testes/decodificador.test.js` (colunas diferentes; mesmas colunas com outro código de agravo); `testes/analisar.test.js`; `testes/processar.test.js`; no Edge, a tela mostra "O arquivo não parece ser de Dengue… Nenhuma planilha foi gerada." | Aprovado |
| 8 | Arquivo grande sem travar a tela | No Edge, o arquivo nacional `DENGBR25.dbc` (1.643.215 notificações) foi analisado em 39 s e processado, filtrado para o RJ, em 46 s, em segundo plano (Web Worker) e com barra de progresso. Medições com outros recortes em `docs/desempenho.md` | Aprovado (ver limites abaixo) |
| 9 | Sem rede durante o processamento | (a) a página declara a política de segurança `connect-src 'none'` e só aceita o próprio código; (b) o empacotamento recusa código com `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `EventSource` ou `importScripts`; (c) no Edge, todas as requisições registradas foram locais (file, blob, data), e nenhuma saiu do computador, inclusive com o arquivo nacional | Aprovado |
| 10 | Dicionário inválido: o verificador aponta código repetido ou rótulo faltando | `testes/verificar-dicionario.test.js` (código repetido, inclusive "1"/"01"; rótulo faltando; fonte, tabela e lista inexistentes; limite de idade que não é número inteiro) | Aprovado |

## Teste de ponta a ponta nos cinco agravos (versão 1.0.0)

Teste feito no Microsoft Edge, com os arquivos públicos do DATASUS de 2025. O arquivo de LV foi extraído com o microdatasus. Cada arquivo foi analisado, processado e baixado como Excel. Em todos os casos, nenhuma requisição saiu do computador e não houve erro na página.

| Agravo | Arquivo | Notificações | Análise | Processamento | Planilha |
|---|---|---|---|---|---|
| Dengue (exemplo fictício) | `exemplo_dengue_FICTICIO.dbc` | 300 | 0,6 s | — | 4 abas conferidas |
| Dengue (filtro RJ) | `DENGBR25.dbc` | 1.643.215 (29.441 na saída) | 33,6 s | 32,0 s | 4 abas conferidas |
| Chikungunya | `CHIKBR25.dbc` | 253.753 | 6,5 s | 65,0 s | 107,3 MB (*) |
| Zika | `ZIKABR25.dbc` | 25.764 | 1,1 s | 7,7 s | 4 abas conferidas |
| Leishmaniose Tegumentar Americana | `LTANBR25.dbc` | 11.299 | 0,4 s | 6,6 s | 4 abas conferidas |
| Leishmaniose Visceral | `LVH.csv` | 87.746 | 3,8 s | 23,1 s | 4 abas conferidas |

(*) A planilha foi gerada e baixada. O script de teste não conseguiu reler as abas porque a aba Dados passa de 512 MB de texto, o limite do Node. Não é falha da ferramenta.

## Formato para análise (R, Stata, Python)

- **Testes automáticos** (`testes/processar.test.js` e `testes/regras.test.js`):
  - nomes do SINAN em minúsculas, com o código em `_cod`;
  - `idade_anos` numérica, com menor de 1 ano = 0 e idade implausível vazia;
  - cabeçalho de uma linha;
  - CSV sem BOM, com vírgula e datas aaaa-mm-dd.
- **No Edge:** a opção marcada na tela gerou a planilha da LTA com os nomes `tp_not`, `tp_not_cod`, `id_agravo`…, sem erro e sem conexão de rede.
- **No R 4.6.1:**
  - o CSV de zika (`readr::read_csv`) e o Excel da LTA (`readxl::read_excel`) foram lidos com todos os nomes válidos sem crase, `dt_notific` como data e `idade_anos` numérica;
  - a `idade_anos` de zika bateu, registro por registro, com um cálculo independente feito no R a partir de `nu_idade_n_cod`.
- **Cuidado no R (documentado no LEIA-ME):** o `read_excel` olha só as primeiras 1.000 linhas para decidir o tipo. Na LTA, a coluna `dt_transdm` estava vazia nesse trecho, foi lida como lógica e perdeu 15 datas. Com `guess_max = 1048576`, as 15 datas foram lidas.

## Limites conhecidos

- O Excel aceita até 1.048.576 linhas por aba. Acima disso, a ferramenta desativa a opção Excel e oferece CSV.
- Acima de cerca de 300 mil notificações, a planilha Excel fica pesada para abrir (MG, com 162 mil, levou 56 s para abrir no Excel). A tela recomenda filtrar ou usar CSV.
- O CSV do Brasil inteiro tem cerca de 1,25 GB. No navegador, a saída é guardada em blocos para não ocupar a memória toda; ainda não foi medida a geração desse CSV completo dentro do navegador.

## Validação para uso científico (concluída em 02/11/2026)

- [x] **Conferência por amostragem.** Foram 500 células, 100 por agravo, conferidas pelo Rubens. O resultado foi 0 erros após a revisão de 2 divergências (IC 95%: 0% a 0,74%). Ver `docs/validacao/relatorio-conferencia-amostra.md`.
- [x] **Comparação com outro método publicado.** O método foi o microdatasus 3.0.0, aplicado aos cinco agravos. Não foi encontrado nenhum erro de tradução na ferramenta. Foram encontrados erros no microdatasus. Ver `docs/validacao/relatorio-comparacao-microdatasus.md`.
- [x] **Registro no projeto.** O método, a amostra, as divergências e as correções estão em `docs/validacao/`. Os scripts estão em `validacao/`.
