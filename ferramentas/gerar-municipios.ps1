# Gera dicionarios/ibge-municipios.json a partir da planilha do IBGE
# (docs/fontes/tabelas-apoio/RELATORIO_DTB_BRASIL_MUNICIPIO.xls).
#
# Requer o Microsoft Excel instalado (a planilha é aberta somente para leitura).
# Uso, na pasta do projeto:  powershell -ExecutionPolicy Bypass -File ferramentas/gerar-municipios.ps1
#
# O SINAN grava o município com 6 dígitos; o IBGE usa 7 (o último é o dígito
# verificador). A tabela gerada usa como chave os 6 primeiros dígitos.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$origem = Join-Path $raiz 'docs\fontes\tabelas-apoio\RELATORIO_DTB_BRASIL_MUNICIPIO.xls'
$destino = Join-Path $raiz 'dicionarios\tabelas\ibge-municipios.json'

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $livro = $excel.Workbooks.Open($origem, 0, $true)
    $aba = $livro.Worksheets.Item('DTB_Municipio')
    $dataBase = [string]$aba.Range('A4').Text
    $ultima = $aba.UsedRange.Rows.Count
    $cabecalho = @($aba.Range('A7:I7').Value2)
    $esperado = @('UF', 'Nome_UF', 'Região Geográfica Intermediária', 'Nome Região Geográfica Intermediária',
        'Região Geográfica Imediata', 'Nome Região Geográfica Imediata', 'Município', 'Código Município Completo', 'Nome_Município')
    for ($i = 0; $i -lt $esperado.Count; $i++) {
        if ([string]$cabecalho[$i] -ne $esperado[$i]) { throw "Cabeçalho inesperado na coluna $($i + 1): '$($cabecalho[$i])'" }
    }
    $dados = $aba.Range("A8:I$ultima").Value2
    $livro.Close($false)
} finally {
    $excel.Quit()
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
}

$ufs = [ordered]@{}
$municipios = [ordered]@{}
for ($r = 1; $r -le $dados.GetLength(0); $r++) {
    $codUf = [string]$dados[$r, 1]
    if (-not $codUf) { continue }
    $codigo7 = [string]$dados[$r, 8]
    if ($codigo7 -notmatch '^\d{7}$') { throw "Código de município inválido na linha $($r + 7): '$codigo7'" }
    $codigo6 = $codigo7.Substring(0, 6)
    if ($municipios.Contains($codigo6)) { throw "Código de 6 dígitos repetido: $codigo6" }
    $ufs[$codUf] = [string]$dados[$r, 2]
    $municipios[$codigo6] = [ordered]@{ nome = [string]$dados[$r, 9]; uf = $codUf; codigo_ibge = $codigo7 }
}

$saida = [ordered]@{
    fonte = [ordered]@{
        documento = 'Divisão Territorial Brasileira – relatório de municípios (DTB 2023)'
        orgao = 'IBGE'
        data = "DTB 2023, conforme informado pelo Rubens; o cabeçalho do arquivo diz '$dataBase'"
        arquivo = 'docs/fontes/tabelas-apoio/RELATORIO_DTB_BRASIL_MUNICIPIO.xls'
    }
    regra = 'Chave = 6 primeiros dígitos do código IBGE (o SINAN não grava o dígito verificador).'
    total_municipios = $municipios.Count
    ufs = $ufs
    municipios = $municipios
}

$json = $saida | ConvertTo-Json -Depth 5 -Compress
[System.IO.File]::WriteAllText($destino, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Gerado $destino com $($municipios.Count) municípios e $($ufs.Count) UFs."
