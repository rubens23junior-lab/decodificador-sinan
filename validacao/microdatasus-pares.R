# Validação: decodifica um arquivo DBC do DATASUS com o pacote microdatasus
# e conta, para cada coluna, os pares "código original -> texto do microdatasus".
#
# A leitura usa o mesmo leitor interno que o fetch_datasus() usa depois de
# baixar o arquivo (read_dbc com as_character = TRUE), mas a partir de um
# arquivo já baixado: nada é buscado na internet.
#
# Uso (no terminal):
#   Rscript validacao/microdatasus-pares.R <arquivo.dbc|arquivo.csv> <funcao> <saida.csv>
# Exemplo:
#   Rscript validacao/microdatasus-pares.R dados_publicos/DENGBR25.dbc process_sinan_dengue dados_publicos/saida/pares-microdatasus-dengue.csv
#
# Saída (CSV em UTF-8): coluna, codigo, rotulo, n
#   - campo vazio no arquivo original aparece com codigo vazio;
#   - na idade (NU_IDADE_N), o rótulo é montado a partir das colunas
#     IDADEminutos/IDADEhoras/IDADEdias/IDADEmeses/IDADEanos criadas pelo pacote.

suppressMessages({
  library(microdatasus)
  library(dplyr)
  library(data.table)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 3) stop("Uso: Rscript validacao/microdatasus-pares.R <arquivo.dbc> <funcao> <saida.csv>")
arquivo <- args[1]
funcao <- get(args[2], envir = asNamespace("microdatasus"))
saida <- args[3]

inicio <- Sys.time()
# CSV: arquivo já extraído com o fetch_datasus() e salvo como texto (todas as
# colunas lidas como texto; campo vazio = NA, como o read_dbc devolve).
bruto <- if (grepl("\\.csv$", arquivo, ignore.case = TRUE)) {
  tibble::as_tibble(fread(arquivo, colClasses = "character", na.strings = "", encoding = "UTF-8"))
} else {
  microdatasus:::read_dbc(arquivo, as_character = TRUE)
}
cat("Lidos:", nrow(bruto), "registros e", ncol(bruto), "colunas\n")

# municipality_data = FALSE: a junção com a tabela de municípios do pacote só
# acrescenta colunas novas; sem ela, a ordem e o número de linhas ficam iguais
# aos do arquivo, o que permite comparar código e texto linha a linha.
processado <- tryCatch(funcao(bruto, municipality_data = FALSE), error = function(e) {
  # Nas funções de chikungunya, zika e leishmanioses (versão 3.0.0), o trecho
  # da idade compara NU_IDADE_N com o número 999, mas o leitor do próprio
  # pacote entrega a coluna como texto, e a função para com erro. Para a
  # comparação seguir, a idade é passada como número, e o ajuste é registrado.
  cat("A função parou com erro:", conditionMessage(e), "\n")
  if (!"NU_IDADE_N" %in% names(bruto)) stop(e)
  cat("AJUSTE: repetindo com NU_IDADE_N convertida para número.\n")
  ajustado <- bruto
  ajustado$NU_IDADE_N <- as.numeric(ajustado$NU_IDADE_N)
  funcao(ajustado, municipality_data = FALSE)
})
if (nrow(processado) != nrow(bruto)) stop("O número de linhas mudou no processamento.")
versao <- as.character(packageVersion("microdatasus"))
cat("Processado com microdatasus", versao, "\n")

texto <- function(x) {
  x <- as.character(x)
  x[is.na(x)] <- ""
  x
}

pares <- list()
for (coluna in intersect(names(bruto), names(processado))) {
  pares[[coluna]] <- data.table(codigo = texto(bruto[[coluna]]), rotulo = texto(processado[[coluna]]))[
    , .(n = .N), by = .(codigo, rotulo)][, coluna := coluna]
}

# Idade: o pacote cria colunas novas, uma por unidade.
unidades <- c(IDADEminutos = "minutos", IDADEhoras = "horas", IDADEdias = "dias",
              IDADEmeses = "meses", IDADEanos = "anos")
if ("NU_IDADE_N" %in% names(bruto)) {
  rotulo <- rep("", nrow(processado))
  for (u in names(unidades)) {
    if (!u %in% names(processado)) next
    v <- processado[[u]]
    preencher <- !is.na(v) & rotulo == ""
    rotulo[preencher] <- paste(v[preencher], unidades[[u]])
  }
  pares[["NU_IDADE_N"]] <- data.table(codigo = texto(bruto$NU_IDADE_N), rotulo = rotulo)[
    , .(n = .N), by = .(codigo, rotulo)][, coluna := "NU_IDADE_N"]
}

resultado <- rbindlist(pares)[, .(coluna, codigo, rotulo, n)]
fwrite(resultado, saida, bom = FALSE, na = "")
cat("Gravado", saida, "com", nrow(resultado), "pares;",
    round(as.numeric(difftime(Sys.time(), inicio, units = "secs"))), "s\n")
