# Decodificador de notificações do SINAN

Documento de requisitos para desenvolvimento. Versão inicial, escrita a partir da ideia do Rubens (vigilância epidemiológica). Onde houver dúvida sobre uma regra ou sobre o significado de um código, o desenvolvimento deve perguntar ao Rubens antes de assumir.

## 1. Objetivo

Receber um arquivo de notificações exportado do SINAN, em que os campos vêm como códigos (1, 2, 3, 9) e os nomes das colunas vêm abreviados, e devolver uma planilha em que tudo está traduzido para linguagem legível, seguindo o dicionário de dados oficial do SINAN.

A ferramenta é gratuita e voltada a quem trabalha com vigilância e não programa. As soluções existentes, como pacotes para R e Python, exigem programação.

## 2. Princípios

1. **Os dados não saem do computador do usuário.** Todo o processamento acontece no navegador, sem servidor e sem envio de arquivo pela internet.
2. **O dicionário vem só de fonte oficial.** Nenhum código ou rótulo é escrito de memória. Cada categoria é transcrita dos documentos oficiais que o Rubens fornece.
3. **Código desconhecido não é inventado.** Se um valor não está no dicionário, ele é mantido como veio e marcado para conferência.
4. **O resultado é verificável.** Toda planilha gerada informa qual dicionário e qual versão foram usados.

## 3. Escopo

Dentro do escopo:

- Leitura de arquivos exportados do SINAN.
- Decodificação dos nomes das colunas e dos valores categóricos.
- Conversão de datas e das regras especiais do dicionário (por exemplo, idade codificada).
- Geração de planilha Excel com os dados decodificados e abas de apoio.
- Dicionários mantidos em arquivos de dados, de modo que novos agravos sejam acrescentados sem mexer no código.

Fora do escopo:

- Análises estatísticas, gráficos e boletins.
- Envio, armazenamento ou compartilhamento de dados.
- Contas de usuário, login e banco de dados.
- Correção ou limpeza de erros de digitação das notificações.

## 4. Funcionamento

1. O usuário abre a ferramenta no navegador.
2. Escolhe o agravo e, quando houver mais de uma, a versão da ficha de notificação.
3. Seleciona o arquivo exportado do SINAN.
4. A ferramenta mostra um resumo: número de registros, colunas encontradas e colunas sem tradução no dicionário.
5. O usuário escolhe as opções de saída (ver 6.4) e clica em processar.
6. A ferramenta gera e baixa a planilha em Excel.

## 5. Entrada

| Formato | Situação |
|---|---|
| DBF | Obrigatório. É o formato de exportação do SINAN no computador local |
| CSV | Obrigatório, com detecção do separador (vírgula ou ponto e vírgula) |
| DBC (formato compactado do DATASUS) | A decidir com o Rubens. Só entra se for viável processar no navegador |

Pontos de atenção:

- **Codificação de caracteres.** Arquivos do SINAN costumam vir em codificação antiga. A ferramenta deve detectar ou permitir escolher a codificação, para que acentos apareçam corretamente.
- **Arquivos grandes.** Deve processar pelo menos 200 mil registros sem travar o navegador, usando processamento em segundo plano e uma barra de progresso.
- **Arquivo errado.** Se as colunas não correspondem ao agravo escolhido, a ferramenta avisa com uma mensagem clara em português e não gera planilha. Também confere o código do agravo (por exemplo, ID_AGRAVO) nos primeiros 1.000 registros, ou em todos, quando o arquivo é menor que isso. Código em branco não conta. Desde 21/11/2026, por decisão do Rubens, o aviso sugere o agravo provável: aquele cujas colunas combinam com o arquivo e cujo código aparece em mais da metade dos registros conferidos. Um botão troca para esse agravo, e a ferramenta nunca troca sozinha.

## 6. Decodificação

### 6.1 Nomes das colunas

Cada coluna do arquivo tem um nome original (por exemplo, `CS_SEXO`) e um nome legível definido no dicionário (por exemplo, "Sexo"). A planilha de saída usa o nome legível. O nome original pode ser mantido em uma segunda linha de cabeçalho ou em coluna separada, conforme a opção do usuário.

### 6.2 Valores categóricos

Cada valor de campo categórico é trocado pelo rótulo do dicionário. Os exemplos abaixo são ilustrativos e devem ser conferidos no dicionário oficial antes de uso.

| Coluna original | Valor | Rótulo esperado |
|---|---|---|
| CS_SEXO | M | Masculino |
| CS_SEXO | F | Feminino |
| CS_SEXO | I | Ignorado |

Para valores como "ignorado", "não se aplica" e campo em branco, a ferramenta mantém a distinção que o dicionário faz. Em branco continua em branco, e nunca é preenchido com "ignorado".

Regras acrescentadas por decisão do Rubens:

- **Código que o campo não comporta** (16/11/2026). Se nenhuma fonte define o código e a ficha mostra que o campo não o comporta, a coluna pode marcar no dicionário um rótulo explícito ("Inconsistência/Não Preenchido"). O valor sai com esse rótulo, destacado, e vai para a aba Inconsistências com o motivo. O código original continua na coluna ao lado.
- **Código do CNES sem os zeros à esquerda** (16/11/2026). Um código com menos de 7 dígitos que não é encontrado na tabela do CNES é procurado também com zeros à esquerda.
- **Valor só com asteriscos** (16/11/2026). Um valor feito só de asteriscos ("***", "********"), forma de alguns arquivos públicos marcarem campo não preenchido, vale como campo em branco, inclusive na coluna do código original. A quantidade aparece na aba Resumo.
- **Valor só com bytes nulos** (19/11/2026). Um valor feito só de bytes nulos (o caractere de código 0), forma de alguns arquivos públicos gravarem o campo vazio (por exemplo, surto de DTA de 2022 e 2023), vale como campo em branco, inclusive na coluna do código original. A quantidade aparece na aba Resumo, como na regra dos asteriscos.
- **Acentos estragados em texto livre** (19/11/2026). Nas colunas de texto marcadas no dicionário ("corrigir_acentos"), o acento estragado por conversão de codificação é consertado quando o estrago tem uma das duas formas exatas e reversíveis: texto em UTF-8 lido como windows-1252 ("Ãgua", "AÃ§aÃ­") e texto da página de código 850 (DOS) lido como windows-1252 ("Norov¡rus", "µgua"). Texto que não se encaixe nessas formas fica como veio. A quantidade de textos consertados aparece na aba Resumo.
- **Data no formato americano** (19/11/2026). Nas colunas de data marcadas no dicionário ("mes_dia_ano"), a data com barras é lida como mês/dia/ano (M/D/AAAA), porque o arquivo grava assim (datas de transferência do surto de DTA de 2022 e 2023). Data que não exista lida desse modo vai para as Inconsistências.
- **Aviso que cruza duas colunas** (21/11/2026). Uma coluna extra ("calculo": "alerta_condicional") mostra um aviso quando duas colunas têm, ao mesmo tempo, valores que indicam possível erro de notificação. Por exemplo, nas toxoplasmoses, o CID B58 (toxoplasmose) em gestante é um possível caso de toxoplasmose gestacional, que deveria ser notificado com O98.6 (regra do Rubens, que trabalhou na qualificação dessas notificações). O dado original não muda; o aviso sai destacado e contado nas Inconsistências.
- **Número em campo de texto** (19/11/2026). Na coluna de texto marcada no dicionário ("numero_fora_do_campo"), um valor só com algarismos sai com o rótulo dado (por exemplo, "Inconsistência/Preenchido erroneamente"), destacado e nas Inconsistências.
- **Semana epidemiológica calculada** (18/11/2026). Quando o arquivo traz a data mas não a semana (por exemplo, SEM_DIAG em branco na sífilis), o dicionário pode pedir uma coluna extra com a semana epidemiológica calculada da data, no formato AAAASS dos dicionários do Sinan. A coluna original continua como veio. A regra (semana de domingo a sábado, semana 1 é a que contém 4 de janeiro) foi conferida contra as semanas gravadas pelo próprio Sinan em cerca de 2,5 milhões de registros públicos, todas iguais. Data inválida não gera semana e vai para as Inconsistências.
- **Texto livre com códigos** (18/11/2026). Num campo de texto em que a fonte também lista códigos (por exemplo, "outro sinal – especificar" na sífilis congênita), os códigos são traduzidos e o texto escrito fica como veio, sem destaque.

### 6.3 Regras especiais

Alguns campos não são uma simples troca de código por rótulo. Cada regra especial deve estar descrita no dicionário e vir da fonte oficial. Exemplos que o desenvolvimento deve tratar, sempre confirmando com o Rubens e com a documentação oficial:

- **Datas:** conversão para data real do Excel, com tratamento de data inválida ou vazia.
- **Idade codificada:** o SINAN usa um código que combina a unidade e o valor da idade. A ferramenta converte para uma idade legível, com a unidade (horas, dias, meses ou anos).
- **Códigos de município:** conversão do código IBGE para o nome do município, usando a tabela pública do IBGE fornecida pelo Rubens. Se a tabela não estiver disponível, o código é mantido.
- **Campos de diagnóstico (CID-10) e ocupação (CBO):** conversão opcional, só se o Rubens fornecer as tabelas oficiais.

### 6.4 Opções de saída

- Manter também as colunas originais, ao lado das decodificadas (padrão: não, por decisão do Rubens em 21/11/2026; até a versão 1.0.1 o padrão era sim).
- Incluir o nome original da coluna em uma segunda linha de cabeçalho (padrão: não).
- Incluir apenas as colunas escolhidas pelo usuário (padrão: todas).
- Formato para análise em R, Stata e Python (padrão: não). Incluído em 02/11/2026, por decisão do Rubens. Traz:
  - nomes de coluna do SINAN em minúsculas, com o código original em `<nome>_cod`;
  - coluna numérica `idade_anos`, em anos completos: menor de 1 ano vale 0, e idade inválida ou implausível fica vazia;
  - cabeçalho de uma linha só;
  - no CSV: UTF-8 sem BOM, vírgula como separador, ponto decimal e datas aaaa-mm-dd.

## 7. Saída

Arquivo Excel (.xlsx) com as abas:

| Aba | Conteúdo |
|---|---|
| Dados | Os registros decodificados. Valores sem tradução ficam como vieram e com destaque de cor |
| Inconsistências | Lista de colunas e valores que não foram encontrados no dicionário, com a quantidade de ocorrências |
| Dicionário usado | Agravo, versão da ficha, fonte do dicionário (documento e data) e a lista de colunas e categorias aplicadas |
| Resumo | Número de registros, colunas processadas, data e hora do processamento e versão da ferramenta |

O nome do arquivo de saída inclui o agravo e a data. Exemplo: `agravo_decodificado_2026-10-17.xlsx`.

## 8. Dicionários de dados

Cada agravo tem um arquivo de dicionário em formato estruturado (JSON). Modelo sugerido:

- **agravo:** nome e código.
- **versao_ficha:** identificação da versão da ficha de notificação.
- **fonte:** nome do documento oficial, órgão, data e endereço de onde foi obtido.
- **colunas:** para cada coluna, nome original, nome legível, tipo (texto, número, data, categórico, regra especial) e, se categórico, a tabela de códigos e rótulos.

Regras de manutenção:

- Acrescentar um agravo ou atualizar uma versão não exige alterar o código da ferramenta.
- Deve existir um verificador que confere os dicionários: JSON válido, sem código repetido na mesma coluna, todo campo categórico com rótulos preenchidos.
- A transcrição do dicionário oficial para JSON pode ser feita com ajuda de uma ferramenta de inteligência artificial a partir dos documentos fornecidos, mas **o Rubens confere cada dicionário antes de ele ser usado**. Tudo o que essa ferramenta não conseguir ler com segurança deve ser listado, e não preenchido.

## 9. Privacidade e segurança

- Nenhuma requisição de rede durante o processamento. A página deve declarar uma política que bloqueie conexões externas (Content-Security-Policy), e todas as bibliotecas devem estar empacotadas junto, sem carregar nada da internet em tempo de uso.
- Sem cookies, sem análise de uso e sem registro do conteúdo dos arquivos.
- O arquivo e o resultado existem apenas na memória do navegador enquanto a página está aberta.
- A tela inicial exibe aviso: "Os dados não saem do seu computador. A planilha gerada contém os mesmos dados pessoais do arquivo original e deve ser tratada conforme as regras do seu serviço."
- Desenvolvimento e testes somente com dados fictícios.

## 10. Requisitos não funcionais

- Funciona nos navegadores Chrome e Edge atuais, no Windows.
- Funciona sem internet depois de aberta.
- Linguagem da interface e das mensagens: português do Brasil.
- Interface simples, com poucos passos, pensada para quem não é da área de TI.
- Mensagens de erro explicam o problema e o que o usuário pode fazer.
- Código organizado e documentado, para o Rubens conseguir manter e para facilitar a revisão ao registrar o software.

## 11. Tecnologia sugerida

- Aplicação web estática: HTML, CSS e JavaScript, sem servidor. Pode ser distribuída como pasta compactada para abrir no computador ou hospedada como página estática (o processamento continua local).
- Bibliotecas para ler DBF e CSV e para gerar XLSX, a escolher pela ferramenta de inteligência artificial usada no desenvolvimento, preferindo as mantidas ativamente e de licença livre.
- Processamento pesado em segundo plano (Web Worker) para não travar a tela.

A sugestão pode ser trocada se houver motivo, desde que os princípios da seção 2 sejam mantidos.

## 12. Entrega

Uma entrega única com:

1. Leitura de DBF e CSV (DBC conforme decisão da seção 5).
2. Dicionário de um agravo completo e conferido pelo Rubens, com a estrutura pronta para acrescentar outros.
3. Decodificação de nomes, categorias e regras especiais da seção 6.
4. Planilha de saída com as quatro abas.
5. Verificador de dicionários.
6. Testes automatizados e relatório de validação (seção 13).
7. Ambiente de demonstração: arquivos fictícios de exemplo e um README com instruções de uso.

## 13. Testes e validação

Os casos abaixo usam dados fictícios e devem virar testes automatizados.

1. **Categoria conhecida.** Um valor presente no dicionário é trocado pelo rótulo correto.
2. **Categoria desconhecida.** Um valor ausente do dicionário é mantido, destacado e listado na aba Inconsistências.
3. **Campo em branco.** Permanece em branco na saída.
4. **Idade codificada.** Códigos de idade em horas, dias, meses e anos são convertidos corretamente.
5. **Data inválida.** Não quebra o processamento. Fica sinalizada e registrada nas inconsistências.
6. **Acentuação.** Um arquivo em codificação antiga sai com acentos corretos.
7. **Arquivo do agravo errado.** Gera aviso claro e nenhuma planilha.
8. **Arquivo grande.** Processa o volume mínimo da seção 5 sem travar a tela.
9. **Sem rede.** Durante o processamento não há nenhuma requisição de rede.
10. **Dicionário inválido.** O verificador aponta código repetido ou rótulo faltando.

Validação para o uso científico (necessária se a ferramenta virar artigo):

- Conferência por amostragem: o Rubens confere, contra o dicionário oficial, uma amostra de registros decodificados e anota o resultado.
- Comparação com outro método: processar o mesmo conjunto público do DATASUS com a ferramenta e com um método já publicado, e comparar os resultados campo a campo.
- O relatório da validação (método, amostra, divergências e correções) fica guardado no projeto.

## 14. Pontos em aberto

- Qual agravo vem primeiro. Sugestão: o que o Rubens mais domina, para conferir com segurança.
- Documentos oficiais do dicionário e da ficha desse agravo (o Rubens fornece).
- Tabela de municípios do IBGE, e tabelas de CID-10 e CBO se forem usadas.
- Se o formato DBC entra na primeira entrega.
- Nome da ferramenta.
- Licença de uso (a definir pelo autor).
- Forma de distribuição: pasta compactada, página hospedada, ou ambas.
