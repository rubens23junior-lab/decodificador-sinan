# Inventário das fontes e pendências: Doença de Chagas aguda

Documento de trabalho, de 13/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/chagas/CHAGAN_DIC_DADOS.pdf` | Dicionário de dados Sinan NET 5.0, Doença de Chagas, campos 31 a 70, revisado em julho de 2010 (16 páginas) | Fonte principal (DICCHAG) |
| `docs/fontes/chagas/CHAGAN_FICHA.pdf` | Ficha de investigação de Doença de Chagas Aguda, Sinan NET, SVS, 08/10/2009 | Agravo (CID B57.1) e escolaridade |
| `docs/fontes/chagas/CHAGAN_INSTRUCIONAL.pdf` | Instruções de preenchimento | Apoio |
| Dicionário da notificação individual (NOTIF2018) | Já usado nos outros agravos | Campos 1 a 30, campos internos e Anexo I (classificação, critério e evolução) |

Os três PDFs de Chagas vêm do pacote de documentação do TAB_SINAN, baixado pelo Rubens do site do DATASUS (ver `docs/inventario-docs-tab-sinan.md`).

## Arquivo real

`dados_publicos/chagas/CHAGBR25.dbc` (preliminar, baixado pelo Rubens em 13/11/2026): 7.537 registros e 108 colunas.

- Todas as colunas dos campos 31 a 70 estão no DICCHAG. As demais são as comuns da notificação, iguais às de leishmaniose visceral.
- Os valores encontrados em cada coluna de código estão nas listas das fontes, com uma exceção: `CLASSI_FIN` = 8 (1.111 registros), que o DICCHAG não lista e o Anexo I do NOTIF2018 define como "Inconclusivo".

## Decisões aplicadas (regras já definidas pelo Rubens)

- `CLASSI_FIN`, `CRITERIO` e `EVOLUCAO` seguem o Anexo I do NOTIF2018 (novembro/2018), mais recente que o DICCHAG (julho/2010).
- Colunas comuns iguais às de leishmaniose visceral foram copiadas do dicionário já conferido (mesma fonte e página).

## Pendências

Estão na aba Pendências da planilha `docs/conferencia/conferencia-chagas.xlsx`. As principais:

- **Títulos da imunofluorescência** (`TIT_*`): o DICCHAG lista categorias de resultado, mas o arquivo traz títulos numéricos. Mantidos como texto.
- **`HISTORIA`**: o nome do campo diz "120 dias" e a descrição diz "90 dias".
- **`TEMPO`**: tempo de tratamento sem unidade na fonte.

## Validação prevista

O pacote microdatasus (versão 3.0.0) tem `process_sinan_chagas`, então dá para repetir a comparação feita na versão 1.0, além da amostra.

## Conferência e validação (14/11/2026)

- Dicionário conferido pelo Rubens (planilha com a aba Listas; 6 colunas com pedidos já atendidos confirmadas no chat).
- Decisões do Rubens na conferência:
  - 8 = Inconclusivo na classificação final, pela nota do Anexo I do NOTIF2018 (p. 23);
  - títulos da imunofluorescência mantidos como número;
  - nomes e rótulos da ficha em ARRITMIAS, TEMPO e EVOLUCAO 2;
  - 120 dias em HISTORIA.
- Teste no navegador sem erros e sem conexões externas.
- Comparação com o microdatasus 3.0.0: nenhuma diferença indica erro da ferramenta (`docs/validacao/relatorio-comparacao-chagas.md`).
- Conferência por amostra: 0 erros em 100 células (IC 95% de 0% a 3,62%) (`docs/validacao/relatorio-conferencia-amostra-chagas.md`).
