// Monta dicionarios/violencia.json. Rótulos transcritos de:
//  DICVIOL2015 = docs/fontes/violencia/DIC_DADOS_NET_Violencias_v5.pdf (texto em modo tabela, páginas pelo rodapé "Revisado junho/2015")
//  FICHAVIOL   = docs/fontes/violencia/violencia_v5.pdf
//  DICVIOL42   = docs/fontes/violencia/DIC_DADOS_violencias_4_2_naovigente.pdf
// Entradas comuns copiadas do dicionário de LV já conferido só quando a fonte é a mesma (NOTIF2018).
// Uso: node gerar-violencia.mjs <raiz do repositório>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2];
const lv = JSON.parse(readFileSync(join(raiz, 'dicionarios/leishmaniose-visceral.json'), 'utf8'));
const deLV = (nome, extra = {}) => ({ ...structuredClone(lv.colunas.find((c) => c.nome === nome)), ...extra });

const cat = (pares) => pares.map(([c, r]) => ({ codigos: Array.isArray(c) ? c : [c], rotulo: r }));
const SNI = cat([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]);
const SNAI = cat([['1', 'Sim'], ['2', 'Não'], ['8', 'Não se aplica'], ['9', 'Ignorado']]);
const p = (n) => `p. ${n}`;

const C = []; // colunas, na ordem do arquivo
const col = (nome, fonte, local, rotulo, tipo, extra = {}) => C.push({ nome, fonte, local, rotulo, tipo, ...extra });
const v5 = (nome, pg, campo, rotulo, tipo, extra) => col(nome, 'DICVIOL2015', `${p(pg)}, campo ${campo}`, rotulo, tipo, extra);
const sni = (nome, pg, campo, rotulo, extra) => v5(nome, pg, campo, rotulo, 'categorico', { lista: 'sim_nao_ignorado', ...extra });
const snai = (nome, pg, campo, rotulo, extra) => v5(nome, pg, campo, rotulo, 'categorico', { lista: 'sim_nao_nsa_ignorado', ...extra });

// ---- Dicionário de 2015 (e comuns) ----
v5('TP_NOT', 1, '1', 'Tipo de notificação', 'categorico', { categorias: cat([['1', 'Negativa'], ['2', 'Individual'], ['3', 'Surto'], ['4', 'Agregado']]) });
col('ID_AGRAVO', 'FICHAVIOL', 'p. 1, campo 2 (Código CID10)', 'Agravo', 'categorico', {
  categorias: cat([['Y09', 'Violência interpessoal/autoprovocada']]),
  observacao: "A ficha traz 'VIOLÊNCIA INTERPESSOAL/AUTOPROVOCADA' e o código Y09. O DICVIOL2015 (p. 1, campo 2) diz que o ponto é retirado ao exportar. O arquivo de 2025 traz só 'Y09'.",
});
v5('DT_NOTIFIC', 2, '3', 'Data da notificação', 'data');
v5('SEM_NOT', 2, 'interno', 'Semana epidemiológica da notificação', 'texto', { observacao: 'Formato AAAASS (ano e semana).' });
v5('NU_ANO', 2, 'interno', 'Ano da notificação', 'texto');
v5('SG_UF_NOT', 2, '4', 'UF de notificação', 'uf', { observacao: 'No arquivo vem o código numérico da UF (IBGE); o nome da UF vem da tabela do IBGE.' });
v5('ID_MUNICIP', 2, '5', 'Município de notificação', 'municipio');
v5('DT_OCOR', 3, '9', 'Data da ocorrência da violência', 'data');
v5('SEM_PRI', 3, 'interno', 'Semana epidemiológica dos primeiros sintomas/diagnósticos', 'texto', {
  observacao: 'Nome do DICVIOL2015, por decisão do Rubens (conferência de 10/11/2026). Formato AAAASS (ano e semana).',
});
C.push(deLV('ANO_NASC', { observacao: 'O NOTIF2018 descreve a data de nascimento (DT_NASC); o arquivo público traz só o ano, na coluna ANO_NASC, que não aparece nas fontes de violência (pendência).' }));
C.push({ ...deLV('NU_IDADE_N'), fonte: 'DICVIOL2015', local: 'p. 4, campo 12' });
v5('CS_SEXO', 4, '13', 'Sexo', 'categorico', { categorias: cat([['M', 'Masculino'], ['F', 'Feminino'], ['I', 'Ignorado']]) });
v5('CS_GESTANT', 4, '14', 'Gestante', 'categorico', {
  categorias: cat([['1', '1º Trimestre'], ['2', '2º Trimestre'], ['3', '3º Trimestre'], ['4', 'Idade gestacional ignorada'], ['5', 'Não'], ['6', 'Não se aplica'], ['9', 'Ignorado']]),
});
v5('CS_RACA', 5, '15', 'Raça/Cor', 'categorico', { categorias: cat([['1', 'Branca'], ['2', 'Preta'], ['3', 'Amarela'], ['4', 'Parda'], ['5', 'Indígena'], ['9', 'Ignorado']]) });
v5('CS_ESCOL_N', 5, '16', 'Escolaridade', 'categorico', {
  categorias: [
    { codigos: ['0', '00', '43'], rotulo: 'Analfabeto', fonte: 'FICHAVIOL', local: 'p. 1, campo 16 (o 43 vem do DICVIOL2015, p. 5)' },
    ...cat([
      [['1', '01'], '1ª a 4ª série incompleta do EF'],
      [['2', '02'], '4ª série completa do EF (antigo 1° grau)'],
      [['3', '03'], '5ª à 8ª série incompleta do EF (antigo ginásio ou 1° grau)'],
      [['4', '04'], 'Ensino fundamental completo (antigo ginásio ou 1° grau)'],
      [['5', '05'], 'Ensino médio incompleto (antigo colegial ou 2° grau)'],
      [['6', '06'], 'Ensino médio completo (antigo colegial ou 2° grau)'],
      [['7', '07'], 'Educação superior incompleta'],
      [['8', '08'], 'Educação superior completa'],
      [['9', '09'], 'Ignorado'],
      [['10'], 'Não se aplica'],
    ]),
  ],
  observacao: "No DICVIOL2015 o Analfabeto aparece como '43'; a ficha de violência (p. 1, campo 16) traz '0-Analfabeto'. Por decisão do Rubens (conferência de 10/11/2026), o 0 e o 43 valem como Analfabeto. As formas com um e dois dígitos seguem a decisão P6 do Rubens; o arquivo de 2025 traz sempre dois dígitos.",
});
v5('SG_UF', 5, '19', 'UF de residência', 'uf');
v5('ID_MN_RESI', 6, '20', 'Município de residência', 'municipio');
C.push({ ...deLV('ID_PAIS'), fonte: 'DICVIOL2015', local: 'p. 8, campo 32' });
C.push({
  nome: 'NDUPLIC', fonte: 'DICVIOL2015', local: 'p. 8 (Não Listar/ Não Contar)', rotulo: 'Identifica duplicidade', tipo: 'categorico',
  categorias: cat([['0', 'Não identificado'], ['1', 'Não é duplicidade (não listar)'], ['2', 'Duplicidade (não contar)']]),
  observacao: "Nome legível tirado da descrição do DICVIOL2015 ('Identifica duplicidade'), por decisão do Rubens (10/11/2026). O DICVIOL2015 chama a coluna de NDUPLIC_N; o arquivo traz NDUPLIC (sempre em branco em 2025). A fonte diz '0 ou branco – Não identificado'. Pela regra do projeto, o branco continua em branco; só o 0 recebe o rótulo.",
});
C.push('__DT_INVEST__'); // preenchido com a versão 4.2 (não está no DICVIOL2015)
C.push({ ...deLV('ID_OCUPA_N'), fonte: 'DICVIOL2015', local: 'p. 9, campo 34' });
v5('SIT_CONJUG', 9, '35', 'Situação conjugal/Estado civil', 'categorico', {
  local: 'p. 9-10, campo 35',
  categorias: cat([['1', 'Solteiro'], ['2', 'Casado/ União consensual'], ['3', 'Viúvo'], ['4', 'Separado'], ['8', 'Não se aplica'], ['9', 'Ignorado']]),
});
// (ORIENT_SEX e IDENT_GEN ficam no fim do arquivo, na posição real)
sni('DEF_TRANS', 10, '38', 'Possui algum tipo de deficiência/transtorno');
snai('DEF_FISICA', 10, '39', 'Deficiência física');
snai('DEF_MENTAL', 10, '39', 'Deficiência intelectual', { observacao: "O DICVIOL2015 chama o campo de 'Deficiência intelectual' (descrição: 'deficiência mental')." });
snai('DEF_VISUAL', 11, '39', 'Deficiência visual');
snai('DEF_AUDITI', 11, '39', 'Deficiência auditiva');
snai('TRAN_MENT', 11, '39', 'Transtorno mental');
snai('TRAN_COMP', 11, '39', 'Transtorno de comportamento', { local: 'p. 11-12, campo 39' });
snai('DEF_OUT', 12, '39', 'Outras deficiências/síndromes');
v5('DEF_ESPEC', 12, '39', 'Outras deficiências/síndromes (especificar)', 'texto');
v5('SG_UF_OCOR', 12, '40', 'UF de ocorrência', 'uf');
v5('ID_MN_OCOR', 12, '41', 'Município de ocorrência', 'municipio');
v5('HORA_OCOR', 14, '51', 'Hora da ocorrência', 'texto', { observacao: 'Formato hh:mm (00:00 a 23:59).' });
v5('LOCAL_OCOR', 14, '52', 'Local de ocorrência', 'categorico', {
  categorias: cat([['01', 'Residência'], ['02', 'Habitação coletiva'], ['03', 'Escola'], ['04', 'Local de prática esportiva'], ['05', 'Bar ou similar'], ['06', 'Via publica'], ['07', 'Comércio/Serviços'], ['08', 'Industrias/ construção'], ['09', 'Outro'], ['99', 'Ignorado']]),
});
v5('LOCAL_ESPE', 14, '52', 'Local de ocorrência - Outro (especificar)', 'texto');
sni('OUT_VEZES', 15, '53', 'Ocorreu outras vezes?');
snai('LES_AUTOP', 15, '54', 'A lesão foi autoprovocada?');
sni('VIOL_FISIC', 15, '56', 'Tipo de violência - Física');
sni('VIOL_PSICO', 15, '56', 'Tipo de violência - Psicológica/moral');
sni('VIOL_TORT', 15, '56', 'Tipo de violência - Tortura');
sni('VIOL_SEXU', 15, '56', 'Tipo de violência - Sexual');
sni('VIOL_TRAF', 15, '56', 'Tipo de violência - Tráfico de seres humanos');
sni('VIOL_FINAN', 15, '56', 'Tipo de violência - Financeira/econômica', { local: 'p. 15-16, campo 56' });
sni('VIOL_NEGLI', 16, '56', 'Tipo de violência - Negligência/abandono');
sni('VIOL_INFAN', 16, '56', 'Tipo de violência - Trabalho infantil');
sni('VIOL_LEGAL', 16, '56', 'Tipo de violência - Intervenção legal');
sni('VIOL_OUTR', 16, '56', 'Tipo de violência - Outros');
v5('VIOL_ESPEC', 16, '56', 'Outros tipos de violência (especificar)', 'texto');
sni('AG_FORCA', 16, '57', 'Meio de agressão - Força corporal/espancamento');
sni('AG_ENFOR', 16, '57', 'Meio de agressão - Enforcamento');
sni('AG_OBJETO', 16, '57', 'Meio de agressão - Objeto contundente');
sni('AG_CORTE', 16, '57', 'Meio de agressão - Objeto perfuro-cortante');
sni('AG_QUENTE', 16, '57', 'Meio de agressão - Substância/objeto quente', { local: 'p. 16-17, campo 57' });
sni('AG_ENVEN', 17, '57', 'Meio de agressão - Envenenamento, intoxicação');
sni('AG_FOGO', 17, '57', 'Meio de agressão - Arma de fogo');
sni('AG_AMEACA', 17, '57', 'Meio de agressão - Ameaça');
sni('AG_OUTROS', 17, '57', 'Meio de agressão - Outro');
v5('AG_ESPEC', 17, '57', 'Outro meio de agressão (especificar)', 'texto');
snai('SEX_ASSEDI', 17, '58', 'Violência sexual - Assédio sexual');
snai('SEX_ESTUPR', 17, '58', 'Violência sexual - Estupro');
C.push('__SEX_PUDOR__');
snai('SEX_PORNO', 18, '58', 'Violência sexual - Pornografia infantil');
snai('SEX_EXPLO', 18, '58', 'Violência sexual - Exploração sexual');
snai('SEX_OUTRO', 18, '58', 'Violência sexual - Outro');
v5('SEX_ESPEC', 19, '58', 'Outro tipo de violência sexual (especificar)', 'texto');
C.push('__PEN_ORAL__', '__PEN_ANAL__', '__PEN_VAGINA__');
snai('PROC_DST', 19, '59', 'Procedimento realizado - Profilaxia DST');
snai('PROC_HIV', 19, '59', 'Procedimento realizado - Profilaxia HIV');
snai('PROC_HEPB', 19, '59', 'Procedimento realizado - Profilaxia Hepatite B');
snai('PROC_SANG', 19, '59', 'Procedimento realizado - Coleta de sangue');
snai('PROC_SEMEN', 19, '59', 'Procedimento realizado - Coleta de sêmen', { local: 'p. 19-20, campo 59' });
snai('PROC_VAGIN', 20, '59', 'Procedimento realizado - Coleta de secreção vaginal', { observacao: "No PDF o nome DBF aparece quebrado em duas linhas ('PROC_VAGIN' / 'A'); o arquivo traz PROC_VAGIN." });
snai('PROC_CONTR', 20, '59', 'Procedimento realizado - Contracepção de emergência');
snai('PROC_ABORT', 20, '59', 'Procedimento realizado - Aborto previsto em lei');
// ---- Campos da ficha anterior (versão 4.2), na ordem do arquivo ----
const v42 = (nome, pg, campo, rotulo, tipo, extra) => col(nome, 'DICVIOL42', `${p(pg)}, campo ${campo}`, rotulo, tipo, extra);
const nome42 = (n) => ({ observacao: `No DICVIOL42 o nome DBF é ${n}; o arquivo guarda só os 10 primeiros caracteres.` });
const lugar = (n) => C.indexOf(`__${n}__`);
C[lugar('SEX_PUDOR')] = { nome: 'SEX_PUDOR', fonte: 'DICVIOL42', local: 'p. 22, campo 53', rotulo: 'Violência sexual - Atentado violento ao pudor', tipo: 'categorico', lista: 'sim_nao_nsa_ignorado' };
C[lugar('PEN_ORAL')] = { nome: 'PEN_ORAL', fonte: 'DICVIOL42', local: 'p. 23, campo 54', rotulo: 'Penetração - Oral', tipo: 'categorico', lista: 'sim_nao_nsa_ignorado' };
C[lugar('PEN_ANAL')] = { nome: 'PEN_ANAL', fonte: 'DICVIOL42', local: 'p. 23, campo 54', rotulo: 'Penetração - Anal', tipo: 'categorico', lista: 'sim_nao_nsa_ignorado' };
C[lugar('PEN_VAGINA')] = { nome: 'PEN_VAGINA', fonte: 'DICVIOL42', local: 'p. 24, campo 54', rotulo: 'Penetração - Vaginal', tipo: 'categorico', lista: 'sim_nao_nsa_ignorado', ...nome42('PEN_VAGINAL') };
C[lugar('DT_INVEST')] = { nome: 'DT_INVEST', fonte: 'NOTIF2018', local: 'p. 9, campo 31', rotulo: 'Data da investigação', tipo: 'data', observacao: 'Não aparece no DICVIOL2015 nem no DICVIOL42; descrita no NOTIF2018.' };

const semFonte = (nome, fonte, rotulo) => col(nome, fonte, 'não aparece na fonte', rotulo, 'codigo', {
  observacao: 'Coluna sem descrição nas fontes de violência. O nome legível é decisão do Rubens (conferência de 10/11/2026), sem documento oficial; os códigos ficam como vieram, porque nenhuma fonte diz o que significam.',
});
semFonte('CONS_ABORT', 'DICVIOL42', 'Consequência de aborto');
v42('CONS_GRAV', 25, '56', 'Consequência no momento da notificação - Gravidez', 'categorico', { lista: 'sim_nao_nsa_ignorado' });
v42('CONS_DST', 26, '56', 'Consequência no momento da notificação - DST', 'categorico', { lista: 'sim_nao_nsa_ignorado' });
v42('CONS_SUIC', 26, '56', 'Consequência no momento da notificação - Tentativa de suicídio', 'categorico', { lista: 'sim_nao_nsa_ignorado' });
v42('CONS_MENT', 26, '56', 'Consequência no momento da notificação - Transtorno mental', 'categorico', { lista: 'sim_nao_nsa_ignorado' });
v42('CONS_COMP', 26, '56', 'Consequência no momento da notificação - Transtorno comportamental', 'categorico', { lista: 'sim_nao_nsa_ignorado' });
v42('CONS_ESTRE', 26, '56', 'Consequência no momento da notificação - Estresse pós-traumático', 'categorico', { lista: 'sim_nao_nsa_ignorado', ...nome42('CONS_ESTRES') });
v42('CONS_OUTR', 27, '56', 'Consequência no momento da notificação - Outros', 'categorico', { lista: 'sim_nao_nsa_ignorado', observacao: 'No DICVIOL42 o nome DBF é CONS_OUTROS; o arquivo traz CONS_OUTR.' });
v42('CONS_ESPEC', 27, '56', 'Consequências - Outros (especificar)', 'texto');
v42('LESAO_NAT', 27, '57', 'Natureza da lesão', 'categorico', {
  categorias: cat([['01', 'Contusão'], ['02', 'Corte/perfuração/laceração'], ['03', 'Entorse/luxação'], ['04', 'Fratura'], ['05', 'Amputação'], ['06', 'Traumatismo dentário'], ['07', 'Traumatismo crânio Encefálico'], ['08', 'Politraumatismo'], ['09', 'Intoxicação'], ['10', 'Queimadura'], ['11', 'Outros'], ['88', 'Não se aplica'], ['99', 'Ignorado']]),
});
v42('LESAO_ESPE', 27, '57', 'Natureza da lesão (especificar)', 'texto', { observacao: 'No DICVIOL42 o nome DBF é LESAO_ESPEC; o arquivo traz LESAO_ESPE.' });
v42('LESAO_CORP', 28, '58', 'Parte do corpo atingida', 'categorico', {
  categorias: cat([['01', 'Cabeça/face'], ['02', 'Pescoço'], ['03', 'Boca/dentes'], ['04', 'Coluna/medula'], ['05', 'Tórax/dorso'], ['06', 'Abdome'], ['07', 'Quadril/pelve'], ['08', 'Membros superiores'], ['09', 'Membros inferiores'], ['10', 'Órgãos genitais/ânus'], ['11', 'Múltiplos órgãos/regiões'], ['88', 'Não se aplica'], [['89', '99'], 'Ignorado']]),
  observacao: "No DICVIOL42 o nome DBF é LESAO_CORPO. A fonte lista '89- Ignorado'; o arquivo de 2025 traz '99' em 103 registros e nenhum '89'. Por decisão do Rubens (conferência de 10/11/2026), o 99 também vale como Ignorado.",
});
v5('NUM_ENVOLV', 21, '60', 'Número de envolvidos', 'categorico', {
  categorias: cat([['1', 'Um'], ['2', 'Dois ou mais'], ['9', 'Ignorado']]),
  observacao: "No PDF o nome DBF aparece quebrado em duas linhas ('NUM_ENVOL' / 'V').",
});
v42('REL_SEXUAL', 12, '33', 'Relações sexuais', 'categorico', {
  categorias: cat([['1', 'Só com homens'], ['2', 'Só com mulheres'], ['3', 'Com homens e mulheres'], ['8', 'Não se aplica'], ['9', 'Ignorado']]),
  ...nome42('REL_SEXUAIS'),
});
const rel = (nome, pg, rotulo, extra) => sni(nome, pg, '61', `Relação com a pessoa atendida - ${rotulo}`, extra);
rel('REL_PAI', 21, 'Pai'); rel('REL_MAE', 21, 'Mãe'); rel('REL_PAD', 21, 'Padrasto');
rel('REL_CONJ', 21, 'Cônjuge'); rel('REL_EXCON', 21, 'Ex-cônjuge'); rel('REL_NAMO', 21, 'Namorado(a)');
rel('REL_EXNAM', 21, 'Ex-namorado(a)'); rel('REL_FILHO', 21, 'Filho(a)'); rel('REL_DESCO', 22, 'Desconhecido');
rel('REL_IRMAO', 22, 'Irmão(ã)', { observacao: 'O PDF escreve o nome DBF com acento (REL_IRMÃO); o arquivo traz REL_IRMAO.' });
rel('REL_CONHEC', 22, 'Amigos/conhecidos'); rel('REL_CUIDA', 22, 'Cuidador'); rel('REL_PATRAO', 22, 'Patrão/chefe');
rel('REL_INST', 22, 'Pessoa com relação institucional'); rel('REL_POL', 22, 'Policial/agente da lei');
rel('REL_PROPRI', 22, 'Própria pessoa'); rel('REL_OUTROS', 22, 'Outros');
v5('REL_ESPEC', 22, '61', 'Relação com a pessoa atendida - Outros (especificar)', 'texto');
v5('AUTOR_SEXO', 23, '62', 'Sexo do provável autor da violência', 'categorico', { categorias: cat([['1', 'Masculino'], ['2', 'Feminino'], ['3', 'Ambos os sexos'], ['9', 'Ignorado']]) });
sni('AUTOR_ALCO', 23, '63', 'Suspeita de uso de álcool');
v42('ENC_SAUDE', 32, '63', 'Encaminhamento no setor saúde (ficha anterior)', 'categorico', {
  categorias: cat([['1', 'Encaminhamento atenção básica'], ['2', 'Internação hospitalar'], ['8', 'Não se aplica'], ['9', 'Ignorado']]),
  observacao: "O DICVIOL2015 (p. 23, campo 65) dá o nome ENC_SAUDE ao encaminhamento 'Rede da Saúde', mas o arquivo traz esse campo na coluna REDE_SAU. A coluna ENC_SAUDE do arquivo segue a ficha anterior (DICVIOL42), cujas categorias batem com os valores encontrados (pendência P2).",
});
const enc42 = (nome, pg, rotulo, extra) => v42(nome, pg, '64', `Encaminhamento para outros setores - ${rotulo}`, 'categorico', { lista: 'sim_nao_ignorado', ...extra });
enc42('ENC_TUTELA', 32, 'Conselho tutelar (criança/adolescente)', nome42('ENC_TUTELAR'));
enc42('ENC_VARA', 32, 'Vara da infância/juventude');
enc42('ENC_ABRIGO', 32, 'Casa abrigo');
enc42('ENC_SENTIN', 32, 'Programa sentinela', nome42('ENC_SENTINELA'));
enc42('ENC_DEAM', 33, 'Delegacia de atendimento à mulher/DEAM');
enc42('ENC_DPCA', 33, 'Delegacia de proteção da criança e adolescente');
enc42('ENC_DELEG', 33, 'Outras delegacias');
enc42('ENC_MPU', 33, 'Ministério Público');
enc42('ENC_MULHER', 33, 'Centro de referência da mulher');
enc42('ENC_CREAS', 34, 'Centro de referencia da assistência social/CREAS-CRAS');
enc42('ENC_IML', 34, 'Instituto Médico Legal (IML)');
enc42('ENC_OUTR', 34, 'Outros', { observacao: 'No DICVIOL42 o nome DBF é ENC_OUTROS; o arquivo traz ENC_OUTR.' });
v42('ENC_ESPEC', 34, '64', 'Encaminhamento para outros setores - Outros (especificar)', 'texto');
sni('REL_TRAB', 24, '66', 'Violência relacionada ao trabalho');
snai('REL_CAT', 24, '67', 'Se sim, foi emitida a Comunicação de Acidente do Trabalho (CAT)');
v5('CIRC_LESAO', 24, '68', 'Circunstância da lesão (CID-10, capítulo XX)', 'codigo', { observacao: 'Código da CID-10 (capítulo XX, V01 a Y98). O projeto não tem tabela da CID-10: o código fica como veio (pendência P5).' });
v42('CLASSI_FIN', 35, '68', 'Classificação final', 'categorico', {
  categorias: cat([['1', 'Confirmado'], ['2', 'Descartado'], ['3', 'Provável'], ['8', 'Inconclusivo']]),
  observacao: 'Campo da ficha anterior (no DICVIOL42, CLAS_FINAL). A ficha de 2015 não tem classificação final; em 2025 só 536 registros vêm preenchidos.',
});
v42('EVOLUCAO', 35, '69', 'Evolução do caso', 'categorico', {
  categorias: cat([['1', 'Alta'], ['2', 'Evasão/fuga'], ['3', 'Óbito por violência'], ['4', 'Óbito por outras causas'], ['9', 'Ignorado']]),
  observacao: "Campo da ficha anterior (no DICVIOL42, 'EVOLUCÃO'). A ficha de 2015 não tem evolução.",
});
v42('DT_OBITO', 35, '70', 'Se óbito por violência, data', 'data');
for (const n of ['DT_DIGITA', 'DT_TRANSUS', 'DT_TRANSDM', 'DT_TRANSSM', 'DT_TRANSRM', 'DT_TRANSRS', 'DT_TRANSSE']) C.push(deLV(n));
rel('REL_MAD', 21, 'Madrasta');
semFonte('TPUNINOT', 'DICVIOL2015', 'Tipo da unidade notificadora (estabelecimento de saúde que realizou o registro do caso)');
v5('ORIENT_SEX', 10, '36', 'Orientação sexual', 'categorico', { categorias: cat([['1', 'Heterossexual'], ['2', 'Homossexual (gay/lésbica)'], ['3', 'Bissexual'], ['8', 'Não se aplica'], ['9', 'Ignorado']]) });
v5('IDENT_GEN', 10, '37', 'Identidade de gênero', 'categorico', {
  categorias: [
    ...cat([['1', 'Travesti']]),
    { codigos: ['2'], rotulo: 'Mulher Transexual', fonte: 'FICHAVIOL', local: 'p. 1, campo 37' },
    { codigos: ['3'], rotulo: 'Homem Transexual', fonte: 'FICHAVIOL', local: 'p. 1, campo 37' },
    ...cat([['8', 'Não se aplica'], ['9', 'Ignorado']]),
  ],
  observacao: "O DICVIOL2015 escreve '2. Transexual Mulher' e '3. Transexual Homem'; por decisão do Rubens (10/11/2026), seguem os rótulos da ficha de 2015.",
});
v5('VIOL_MOTIV', 15, '55', 'Violência motivada por', 'categorico', {
  categorias: cat([['01', 'Sexismo'], ['02', 'Homofobia/Lesbofobia/Bifobia/Transfobia'], ['03', 'Racismo'], ['04', 'Intolerância religiosa'], ['05', 'Xenofobia'], ['06', 'Conflito geracional'], ['07', 'Situação de rua'], ['08', 'Deficiência'], ['09', 'Outros'], ['88', 'Não se aplica'], ['99', 'Ignorado']]),
});
v5('CICL_VID', 23, '64', 'Ciclo de vida do provável autor da violência', 'categorico', {
  categorias: [
    ...[['1', 'Criança (0 a 9 anos)'], ['2', 'Adolescente (10 a 19 anos)'], ['3', 'Jovem (20 a 24 anos)'], ['4', 'Pessoa adulta (25 a 59 anos)'], ['5', 'Pessoa idosa (60 anos ou mais)']]
      .map(([c, r]) => ({ codigos: [c], rotulo: r, fonte: 'FICHAVIOL', local: 'p. 2, campo 64' })),
    ...cat([['9', 'Ignorado']]),
  ],
  observacao: 'No DICVIOL2015 o nome DBF é CICL_VID_AUTOR (quebrado em duas linhas); o arquivo traz CICL_VID. Rótulos com as faixas de idade da ficha de 2015, por decisão do Rubens (10/11/2026).',
});
// Nomes legíveis do campo 65 como estão na ficha de 2015 (decisão do Rubens, 10/11/2026); categorias e nomes DBF do DICVIOL2015.
const enc = (nome, pg, rotulo, extra = {}) => sni(nome, pg, '65', `Encaminhamento - ${rotulo}`, {
  ...extra,
  observacao: ['Nome legível como na ficha de 2015 (p. 2, campo 65), por decisão do Rubens (10/11/2026).', extra.observacao].filter(Boolean).join(' '),
});
enc('REDE_SAU', 23, 'Rede da Saúde (Unidade Básica de Saúde, hospital, outras)', { observacao: 'No DICVIOL2015 este campo aparece com o nome DBF ENC_SAUDE; o arquivo traz REDE_SAU, preenchida em quase todos os registros (P2, aprovada pelo Rubens).' });
enc('ASSIST_SOC', 23, 'Rede da Assistência Social (CRAS, CREAS, outras)'); enc('REDE_EDUCA', 23, 'Rede da Educação (Creche, escola, outras)');
enc('ATEND_MULH', 23, 'Rede de Atendimento à Mulher (Centro Especializado de Atendimento à Mulher, Casa da Mulher Brasileira, outras)', { observacao: "No PDF o nome DBF aparece quebrado em duas linhas ('ATEND_MUL' / 'H')." });
enc('CONS_TUTEL', 23, 'Conselho Tutelar'); enc('CONS_IDO', 23, 'Conselho do Idoso');
enc('DELEG_IDOS', 23, 'Delegacia de Atendimento ao Idoso', { observacao: "No PDF o nome DBF aparece como 'DELEG_IDOS' / 'O' (duas linhas); o arquivo traz DELEG_IDOS." });
enc('DIR_HUMAN', 23, 'Centro de Referência dos Direitos Humanos');
enc('MPU', 23, 'Ministério Público', { local: 'p. 23-24, campo 65' });
enc('DELEG_CRIA', 24, 'Delegacia Especializada de Proteção à Criança e Adolescente');
enc('DELEG_MULH', 24, 'Delegacia de Atendimento à Mulher', { observacao: "No PDF o nome DBF aparece quebrado em duas linhas ('DELEG_MUL' / 'H')." });
enc('DELEG', 24, 'Outras delegacias'); enc('INFAN_JUV', 24, 'Justiça da Infância e da Juventude'); enc('DEFEN_PUBL', 24, 'Defensoria Pública');
v5('DT_ENCERRA', 24, '69', 'Data de encerramento', 'data');

const faltando = C.filter((c) => typeof c === 'string');
if (faltando.length) throw new Error('Faltam: ' + faltando);

const fontesLV = ['NOTIF2018', 'IBGE_DTB2023', 'DATASUS_MUNICIPIOS', 'DATASUS_REGSAUD', 'CBO', 'MS_MACRORREGIOES'];
const dic = {
  formato: 1,
  agravo: { nome: 'Violência interpessoal/autoprovocada', codigos: ['Y09'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos VIOLBRxx.dbc), Sinan NET 5.0 (ficha de 2015), com os campos da ficha anterior (versão 4.2)',
  conferencia: {
    conferido: true,
    por: 'Rubens Araujo da Silva Junior',
    data: '2026-11-10',
    registro: 'docs/conferencia/conferencia-violencia.xlsx (duas rodadas de conferência na planilha em 10/11/2026; 9 categorias ditadas pelo Rubens confirmadas no chat no mesmo dia)',
  },
  convencoes: [
    ...lv.convencoes,
    'Quando o dicionário de 2015 (DICVIOL2015) e o da ficha anterior (DICVIOL42) descrevem a mesma coluna de forma diferente, vale o de 2015; o DICVIOL42 só é usado nos campos que o de 2015 não tem (decisão do Rubens, 10/11/2026).',
  ],
  fontes: {
    DICVIOL2015: {
      documento: 'Dicionário de Dados – Sinan NET – versão 5.0/Patch 5.1 – Violência Interpessoal/Autoprovocada',
      orgao: 'Ministério da Saúde / SVS / Departamento de Vigilância Epidemiológica / GT-Sinan',
      data: "revisado em junho de 2015 (rodapé 'Revisado junho/2015')",
      arquivo: 'docs/fontes/violencia/DIC_DADOS_NET_Violencias_v5.pdf',
    },
    FICHAVIOL: {
      documento: 'Ficha de Notificação Individual – Violência interpessoal/autoprovocada – Sinan',
      orgao: 'Ministério da Saúde / SVS',
      data: "15/06/2015 (rodapé 'SVS 15.06.2015')",
      arquivo: 'docs/fontes/violencia/violencia_v5.pdf',
    },
    DICVIOL42: {
      documento: 'Dicionário de variáveis – Ficha de notificação/investigação individual violência doméstica, sexual e/ou outras violências (ficha anterior a 2015)',
      orgao: 'Ministério da Saúde / SVS / Coordenação Geral de Doenças e Agravos Não Transmissíveis',
      data: "sem data no documento; o nome do arquivo indica versão 4.2, 'não vigente'. Obtido pelo Rubens em 10/11/2026",
      arquivo: 'docs/fontes/violencia/DIC_DADOS_violencias_4_2_naovigente.pdf',
    },
    ...Object.fromEntries(fontesLV.map((id) => [id, lv.fontes[id]])),
  },
  tabelas: Object.fromEntries(Object.entries(lv.tabelas).filter(([id]) => id !== 'cnes')),
  regras_tabelas: lv.regras_tabelas,
  listas: {
    sim_nao_ignorado: SNI,
    sim_nao_nsa_ignorado: SNAI,
  },
  derivadas: lv.derivadas.map((d) => ({ ...d, depois_de: d.de })),
  colunas: C,
  pendencias: [
    { coluna: 'REDE_SAU e ENC_SAUDE', descricao: "P2. O DICVIOL2015 chama de ENC_SAUDE o encaminhamento 'Rede da Saúde' (Sim/Não), mas o arquivo traz esse campo em REDE_SAU. Proposta: REDE_SAU com o campo 65 de 2015; ENC_SAUDE com o campo 63 da ficha anterior (categorias 1, 2, 8, 9, que batem com o arquivo). Confirmar." },
    { coluna: 'IDENT_GEN', descricao: "P4. O DICVIOL2015 escreve '2. Transexual Mulher' e '3. Transexual Homem'; a ficha de 2015 escreve '2-Mulher Transexual' e '3-Homem Transexual'. Usado o dicionário. Confirmar qual seguir." },
    { coluna: 'CIRC_LESAO', descricao: 'P5. Código da CID-10 (capítulo XX). Sem tabela oficial da CID-10 no projeto, o código fica como veio.' },
    { coluna: 'LESAO_CORP', descricao: "O DICVIOL42 lista '89- Ignorado', mas o arquivo de 2025 traz '99' (103 registros) e nenhum '89'. O 99 fica como veio e vai para as Inconsistências. Confirmar." },
    { coluna: 'CONS_ABORT', descricao: 'Coluna sem descrição em nenhuma fonte (o DICVIOL42 lista outras consequências, mas não esta). Fica como veio.' },
    { coluna: 'TPUNINOT', descricao: 'Coluna sem descrição em nenhuma fonte de violência; sempre em branco em 2025. Fica como veio.' },
    { coluna: 'ANO_NASC', descricao: 'Coluna do arquivo público ausente das fontes de violência (que trazem a data de nascimento completa). Mantida como texto.' },
    ...lv.pendencias.filter((x) => ['CS_ESCOL_N', 'ID_PAIS', 'ID_OCUPA_N'].includes(x.coluna)).map((x) => ({ ...x, descricao: x.descricao.replace('ficha de LV', 'ficha de violência').replace('o NOTIF2018 mostra', 'o DICVIOL2015 mostra') })),
  ],
};
writeFileSync(join(raiz, 'dicionarios/violencia.json'), JSON.stringify(dic, null, 2) + '\n');
console.log('violencia.json:', C.length, 'colunas');
