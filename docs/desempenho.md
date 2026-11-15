# Desempenho com arquivos reais

Medições feitas em 01/11/2026 com `node ferramentas/decodificar.js`, que usa o mesmo código da ferramenta. Computador do Rubens (Windows 10, Excel de 64 bits). Arquivo: `DENGBR25.dbc` (dengue 2025, DATASUS), com 1.643.215 notificações e 66 MB compactado.

## Tempo e tamanho

| Recorte | Notificações | Saída | Tamanho | Tempo para gerar | Memória | Tempo para o Excel abrir |
|---|---|---|---|---|---|---|
| UF de notificação = RJ (33) | 29.441 | Excel | 10 MB | 32 s | 290 MB | 10 s |
| UF de notificação = MG (31) | 161.667 | Excel | 65 MB | 59 s | 410 MB | 56 s |
| UF de notificação = SP (35) | 894.683 | Excel (compactação nível 6) | 342 MB | 6 min | 980 MB | não medido (estimativa: vários minutos) |
| Brasil inteiro | 1.643.215 | CSV + Excel de apoio | 1,25 GB | 2 min 15 s | 2,7 GB | o Excel abre no máximo 1.048.576 linhas |

Cerca de 20 segundos de cada processamento são a leitura e a descompactação do arquivo nacional inteiro, que acontecem mesmo quando o filtro deixa poucos registros.

## Compactação do Excel

Medido com o recorte de MG (161.667 notificações):

| Nível | Tempo | Tamanho |
|---|---|---|
| 6 | 95 s | (não medido) |
| 3 | 60 s | 65 MB |
| 1 | 57 s | 72 MB |

Escolhido o **nível 3**: quase tão rápido quanto o 1 e cerca de 10% menor.

## Conclusões para a tela (Etapa 5)

- Até cerca de **300 mil notificações**, o Excel é prático.
- Acima disso, recomendar filtros (UF, município, período) ou a saída em **CSV**.
- O Excel não abre mais de 1.048.576 linhas: o Brasil inteiro só cabe em CSV, e mesmo assim o CSV não abre por completo no Excel (serve para R, Stata, Power BI etc.).
- No navegador, a saída grande precisa ir sendo guardada em blocos (Blob) para não ocupar a memória toda; o CSV do Brasil inteiro tem 1,25 GB.

## Inconsistências encontradas no Brasil inteiro (resumo)

Valores que ficaram como vieram, destacados e listados na aba Inconsistências:

| Situação | Ocorrências |
|---|---|
| Ocupação com códigos especiais do Sinan, ausentes da CBO (999991, 998999, 999993, 999992, XXX…) | 274.862 |
| Um mesmo grupo de cerca de 34.252 registros com "0" em dezenas de colunas (sinais de alarme, exames, campos da ficha antiga, TP_SISTEMA, UF e município de infecção e de hospitalização) | cerca de 34 mil por coluna |
| Código "9" em doenças pré-existentes e sinais de alarme (o dicionário só prevê 1 Sim e 2 Não) | 45 a 104 por coluna |
| Unidade de saúde com código ausente do CNES (98 códigos, vários com menos de 7 dígitos) | 7.403 |
| Evolução = 0 | 2.091 |
| Idade fora do formato de 4 dígitos (ex.: "0", "62", "6") | 7 |
| Município de residência sem região de saúde (códigos 350000, 410000, 530160) | 3 |
