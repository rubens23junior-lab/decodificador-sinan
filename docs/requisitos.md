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
- **Arquivo errado.** Se as colunas não correspondem ao agravo escolhido, a ferramenta avisa com uma mensagem clara em português e não gera planilha.

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

### 6.3 Regras especiais

Alguns campos não são uma simples troca de código por rótulo. Cada regra especial deve estar descrita no dicionário e vir da fonte oficial. Exemplos que o desenvolvimento deve tratar, sempre confirmando com o Rubens e com a documentação oficial:

- **Datas:** conversão para data real do Excel, com tratamento de data inválida ou vazia.
- **Idade codificada:** o SINAN usa um código que combina a unidade e o valor da idade. A ferramenta converte para uma idade legível, com a unidade (horas, dias, meses ou anos).
- **Códigos de município:** conversão do código IBGE para o nome do município, usando a tabela pública do IBGE fornecida pelo Rubens. Se a tabela não estiver disponível, o código é mantido.
- **Campos de diagnóstico (CID-10) e ocupação (CBO):** conversão opcional, só se o Rubens fornecer as tabelas oficiais.

### 6.4 Opções de saída

- Manter também as colunas originais, ao lado das decodificadas (padrão: sim).
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
