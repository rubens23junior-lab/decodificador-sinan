# Inventário das fontes e pendências: Sífilis adquirida

Documento de trabalho, de 18/11/2026.

## Fontes

| Arquivo | O que é | Papel |
|---|---|---|
| `docs/fontes/sifilis-adquirida/sifilis-adquirida.pdf` | Ficha de investigação, Sinan NET, 05/10/2010 no rodapé, com instruções de preenchimento na p. 2. Baixada pelo Rubens do Portal do Sinan | CID A53.9, data do diagnóstico, escolaridade, ocupação e classificação final (FICHASIFA) |
| `docs/fontes/notificacao-individual/Fichas de Notificação - Conclusão INdividual.pdf` | Ficha de Notificação/Conclusão, SVS 27/09/2005 | Categorias do critério e da evolução (FICHANC) |
| `docs/fontes/notificacao-individual/Dicionario das Fichas de Notificação Individual.pdf` | Dicionário da notificação individual, revisado em novembro de 2018 | Campos 1 a 30 e campos 31 a 43 dos agravos de Notificação/Conclusão (NOTIF2018) |

Não há dicionário de dados específico de sífilis adquirida no pacote Docs_TAB_SINAN do DATASUS.

## Arquivos reais

Os três arquivos estão no DATASUS só como dados preliminares.

| Arquivo | Registros | Colunas |
|---|---|---|
| `SIFABR23.dbc` | 249.082 | 27 |
| `SIFABR24.dbc` | 259.565 | 27 |
| `SIFABR25.dbc` | 133.759 | 27 |

- O arquivo traz os campos 1 a 30 da notificação, a ocupação e os campos de conclusão da ficha de Notificação/Conclusão: DT_INVEST, CLASSI_FIN, CRITERIO, DOENCA_TRA, EVOLUCAO, DT_OBITO e DT_ENCERRA.
- Os campos 32 a 41 da ficha de investigação não vêm no arquivo: antecedente, comportamento sexual, testes, classificação clínica e tratamento.
- As colunas comuns vêm dos dicionários de sífilis já conferidos.
- O microdatasus 3.0.0 não tem função de tradução para sífilis.

## O que os arquivos trazem de diferente

- **Classificação final, código 8:** cerca de 13% dos registros (33.406 em 2023, 30.443 em 2024, 12.589 em 2025). Decisão do Rubens (18/11/2026): sai como "Inconsistência/Não Preenchido".
- **Escolaridade, código 99:** cerca de um terço dos registros. Nenhuma fonte define esse código (pendência).
- **Semana do diagnóstico:** vem preenchida, então não é preciso calcular.

## Pendências

Estão na aba Pendências de `docs/conferencia/conferencia-sifilis-adquirida.xlsx`.
