# Geradores de dicionário

Programas que fizeram a primeira transcrição de cada dicionário a partir das fontes oficiais de `docs/fontes`. Foram criados em pastas temporárias das sessões de trabalho e guardados aqui em 18/11/2026.

Uso: `node ferramentas/geradores-dicionarios/gerar-<agravo>.mjs` (alguns pedem a pasta do projeto como argumento).

**Atenção:** o dicionário que vale é o de `dicionarios/<agravo>.json`, conferido pelo Rubens. Em vários agravos as correções da conferência foram feitas direto no JSON, depois do gerador. Rodar de novo o gerador de um agravo já conferido **desfaz essas correções**. Conferido em 18/11/2026: o da sífilis adquirida não reproduz o dicionário atual. O da meningite também deixou de reproduzir em 19/11/2026, quando as correções da conferência foram feitas no JSON; o das hepatites virais e o do surto de DTA, pelo mesmo motivo, também em 19/11/2026.
