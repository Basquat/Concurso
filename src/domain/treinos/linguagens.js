// Treinos de linguagens e conhecimentos gerais: crase, concordância, regência, classes de palavras, conectivos,
// figuras de linguagem, inglês instrumental e história e geografia do Brasil. Norma-padrão como referência.

const OK = 'Correta';
const ERRO = 'Incorreta';

export default {
  gramatica: {
    intro: 'Crase, concordância, regência e classes de palavras no padrão das bancas — com a regra explicada a cada resposta.',
    teoria: '**Crase** = preposição a + artigo a. Teste: troque por palavra masculina — se virar "ao", há crase. Proibida antes de masculino, verbo, pronomes pessoais e de tratamento (exceto senhora/senhorita) e palavras repetidas. Facultativa antes de possessivo feminino singular, nome próprio feminino de pessoa e depois de "até".',
    exercicios: [
      { tipo: 'classificar', id: 'crase', titulo: 'Crase', pergunta: 'No espaço (a/à/às), a crase é:', categorias: ['Obrigatória', 'Proibida', 'Facultativa'], itens: [
        ['Fui ___ farmácia comprar remédio.', 'Obrigatória', '"Fui ao mercado": a + a.'], ['Vou ___ Bahia nas férias.', 'Obrigatória', '"Volto da Bahia": há artigo.'], ['Estou ___ disposição da comissão.', 'Obrigatória', 'Locução feminina.'], ['O ônibus parte ___ duas horas.', 'Obrigatória', 'Hora determinada.'], ['Assistimos ___ peça de teatro.', 'Obrigatória', 'Assistir (ver) pede "a".'], ['Saiu ___ francesa.', 'Obrigatória', 'À moda francesa.'],
        ['Refiro-me ___ você.', 'Proibida', 'Pronome pessoal/de tratamento.'], ['Ele começou ___ estudar.', 'Proibida', 'Antes de verbo.'], ['Vou ___ Brasília.', 'Proibida', '"Volto de Brasília": sem artigo.'], ['Ficaram frente ___ frente.', 'Proibida', 'Palavras repetidas.'], ['Andou ___ cavalo.', 'Proibida', 'Palavra masculina.'], ['Chegamos ___ uma conclusão.', 'Proibida', 'Antes de artigo indefinido.'], ['Escreveu ___ lápis.', 'Proibida'],
        ['Entreguei o livro ___ minha irmã.', 'Facultativa', 'Possessivo feminino singular.'], ['Caminhou até ___ porta.', 'Facultativa', 'Depois de "até".'], ['Pediu ajuda ___ Maria.', 'Facultativa', 'Nome próprio feminino de pessoa.'],
      ] },
      { tipo: 'classificar', id: 'concordancia', titulo: 'Concordância verbal', pergunta: 'Pela norma-padrão, a frase está:', categorias: [OK, ERRO], itens: [
        ['Houve muitos problemas na reunião.', OK, '"Haver" (existir) é impessoal.'], ['Precisa-se de funcionários.', OK, 'VTI + se: verbo no singular.'], ['Deve haver soluções para o caso.', OK, 'O auxiliar fica no singular com "haver" impessoal.'], ['Bastam duas assinaturas.', OK], ['Existem várias opções.', OK, '"Existir" concorda com o sujeito.'], ['Mais de um candidato faltou à prova.', OK], ['Fui eu que fiz o relatório.', OK],
        ['Fazem dois anos que me mudei.', ERRO, '"Fazer" indicando tempo é impessoal: faz dois anos.'], ['Haviam muitos candidatos na fila.', ERRO, 'Havia muitos candidatos.'], ['Vende-se casas na praia.', ERRO, 'Voz passiva sintética: vendem-se casas.'], ['Devem haver soluções.', ERRO, 'Deve haver.'], ['Aluga-se apartamentos.', ERRO, 'Alugam-se apartamentos.'], ['Falta muitas peças no estoque.', ERRO, 'Faltam muitas peças.'], ['Os Estados Unidos é um país rico.', ERRO, 'Com artigo plural: são.'],
      ] },
      { tipo: 'classificar', id: 'regencia', titulo: 'Regência verbal', pergunta: 'Pela norma-padrão, a frase está:', categorias: [OK, ERRO], itens: [
        ['Prefiro café a chá.', OK, 'Preferir algo a algo.'], ['Obedeça às normas.', OK, 'Obedecer a.'], ['O médico assistiu o paciente.', OK, 'Assistir = prestar assistência (VTD).'], ['Visamos ao bem comum.', OK, 'Visar = almejar (VTI).'], ['Esqueci-me do compromisso.', OK], ['A decisão implicou mudanças.', OK, 'Implicar = acarretar (VTD).'], ['Informei-o de que a reunião foi adiada.', OK],
        ['Assisti o filme ontem.', ERRO, 'Assistir = ver pede "a": assisti ao filme.'], ['Prefiro mais café do que chá.', ERRO, 'Preferir dispensa "mais" e "do que".'], ['Aspiro o cargo de diretor.', ERRO, 'Aspirar = desejar pede "a": aspiro ao cargo.'], ['Ele namorava com a vizinha.', ERRO, 'Namorar é VTD: namorava a vizinha.'], ['Obedeça o regulamento.', ERRO, 'Obedecer ao regulamento.'], ['Chegou em casa cedo.', ERRO, 'Verbos de movimento pedem "a": chegou a casa / ao trabalho.'],
      ] },
      { tipo: 'classificar', id: 'classes', titulo: 'Classes de palavras', pergunta: 'A palavra destacada é:', categorias: ['Substantivo', 'Adjetivo', 'Verbo', 'Advérbio', 'Pronome', 'Preposição', 'Conjunção'], itens: [
        ['O **cansaço** venceu a equipe.', 'Substantivo'], ['O **jantar** estava ótimo.', 'Substantivo', 'Verbo substantivado pelo artigo.'],
        ['Recebemos um parecer **favorável**.', 'Adjetivo'], ['A sala estava **vazia**.', 'Adjetivo'],
        ['Os servidores **analisaram** o processo.', 'Verbo'], ['É preciso **revisar** o texto.', 'Verbo'],
        ['Ele respondeu **rapidamente**.', 'Advérbio'], ['Chegou **cedo** à reunião.', 'Advérbio'],
        ['**Nós** aprovamos o projeto.', 'Pronome'], ['**Aquele** relatório está pronto.', 'Pronome'],
        ['O documento estava **sob** a mesa.', 'Preposição'], ['Saiu **sem** guarda-chuva.', 'Preposição'],
        ['Estudou, **mas** não passou.', 'Conjunção'], ['**Embora** cansado, terminou o trabalho.', 'Conjunção'],
      ] },
    ],
  },

  semantica: {
    intro: 'Relações de sentido dos conectivos e figuras de linguagem: o coração das questões de interpretação.',
    teoria: 'Adversidade: mas, porém, contudo, todavia, entretanto. Concessão: embora, ainda que, mesmo que, apesar de. Causa: porque, já que, visto que. Conclusão: portanto, logo, por isso. Condição: se, caso, desde que. Finalidade: para que, a fim de que.',
    exercicios: [
      { tipo: 'classificar', id: 'conectivos', titulo: 'Relação estabelecida pelo conectivo', pergunta: 'O termo destacado expressa:', categorias: ['Adição', 'Adversidade', 'Causa', 'Conclusão', 'Concessão', 'Condição', 'Finalidade'], itens: [
        ['Estudou **e** trabalhou o ano todo.', 'Adição'], ['**Não só** aprovou, **mas também** foi o primeiro.', 'Adição'],
        ['Tentou, **porém** não conseguiu.', 'Adversidade'], ['O prazo era curto; **contudo**, entregamos.', 'Adversidade'], ['Estava cansado; **no entanto**, continuou.', 'Adversidade'],
        ['Faltou **porque** estava doente.', 'Causa'], ['**Já que** choveu, o evento foi adiado.', 'Causa'], ['**Visto que** o sistema caiu, voltamos ao papel.', 'Causa'],
        ['Estudou muito; **portanto**, foi aprovado.', 'Conclusão'], ['O orçamento acabou, **logo** a obra parou.', 'Conclusão'],
        ['**Embora** chovesse, saímos.', 'Concessão'], ['**Mesmo que** atrase, o voo sairá hoje.', 'Concessão'], ['**Apesar de** cansada, terminou o relatório.', 'Concessão'],
        ['**Se** houver quórum, a sessão começa.', 'Condição'], ['**Caso** precise, ligue.', 'Condição'], ['Aprovarei, **desde que** corrijam o erro.', 'Condição'],
        ['Estudou **para que** passasse no concurso.', 'Finalidade'], ['Reuniram-se **a fim de** decidir.', 'Finalidade'],
      ] },
      { tipo: 'classificar', id: 'figuras', titulo: 'Figuras de linguagem', pergunta: 'A frase apresenta:', categorias: ['Metáfora', 'Comparação', 'Metonímia', 'Hipérbole', 'Eufemismo', 'Ironia', 'Antítese', 'Prosopopeia'], itens: [
        ['Aquela servidora é uma fera nos cálculos.', 'Metáfora', 'Comparação implícita.'], ['A vida é uma estrada.', 'Metáfora'],
        ['Ele é forte como um touro.', 'Comparação', 'Há conectivo comparativo ("como").'], ['Trabalhou feito um condenado.', 'Comparação'],
        ['Adoro ler Machado de Assis.', 'Metonímia', 'O autor pela obra.'], ['Bebeu dois copos de água.', 'Metonímia', 'O continente pelo conteúdo.'],
        ['Já te disse isso um milhão de vezes.', 'Hipérbole'], ['Morri de rir com a piada.', 'Hipérbole'],
        ['Ele nos deixou ontem (morreu).', 'Eufemismo'], ['Faltou com a verdade (mentiu).', 'Eufemismo'],
        ['Que pontualidade! Chegou só três horas atrasado.', 'Ironia'], ['Belo serviço: quebrou tudo.', 'Ironia'],
        ['Entre o riso e o choro, escolheu o silêncio.', 'Antítese'], ['O dia e a noite se alternavam na janela.', 'Antítese'],
        ['O vento sussurrava segredos.', 'Prosopopeia', 'Ação humana atribuída a ser inanimado.'], ['A cidade dormia tranquila.', 'Prosopopeia'],
      ] },
    ],
  },

  ingles: {
    intro: 'Falsos cognatos, tempos verbais e conectivos — o que mais decide as questões de inglês instrumental.',
    teoria: 'Falsos cognatos clássicos: actually (na verdade), pretend (fingir), library (biblioteca), eventually (finalmente), parents (pais), realize (perceber), push (empurrar). Present perfect: have/has + particípio. Simple past com marcadores definidos (yesterday, ago, last).',
    exercicios: [
      { tipo: 'classificar', id: 'cognatos', titulo: 'Cognato verdadeiro ou falso?', pergunta: 'A palavra é:', categorias: ['Falso cognato', 'Cognato verdadeiro'], itens: [
        ['actually', 'Falso cognato', 'Significa "na verdade".'], ['pretend', 'Falso cognato', 'Significa "fingir".'], ['library', 'Falso cognato', 'Significa "biblioteca".'], ['eventually', 'Falso cognato', 'Significa "finalmente, com o tempo".'], ['parents', 'Falso cognato', 'Significa "pais".'], ['realize', 'Falso cognato', 'Significa "perceber".'], ['push', 'Falso cognato', 'Significa "empurrar".'], ['college', 'Falso cognato', 'Significa "faculdade".'], ['sensible', 'Falso cognato', 'Significa "sensato".'], ['lunch', 'Falso cognato', 'Significa "almoço".'], ['attend', 'Falso cognato', 'Significa "comparecer".'],
        ['information', 'Cognato verdadeiro'], ['government', 'Cognato verdadeiro'], ['important', 'Cognato verdadeiro'], ['security', 'Cognato verdadeiro'], ['economy', 'Cognato verdadeiro'], ['digital', 'Cognato verdadeiro'], ['administration', 'Cognato verdadeiro'],
      ] },
      { tipo: 'classificar', id: 'tempos', titulo: 'Tempos verbais', pergunta: 'O verbo destacado está no:', categorias: ['Simple present', 'Present continuous', 'Simple past', 'Present perfect', 'Future (will)'], itens: [
        ['The office **opens** at 8 a.m.', 'Simple present'], ['She usually **checks** her e-mail first.', 'Simple present'],
        ['They **are updating** the system now.', 'Present continuous'], ['I **am writing** the report at the moment.', 'Present continuous'],
        ['We **signed** the contract yesterday.', 'Simple past'], ['The director **left** two hours ago.', 'Simple past'],
        ['He **has worked** here since 2019.', 'Present perfect'], ['Have you ever **visited** Salvador?', 'Present perfect'], ['They **have** already **finished** the audit.', 'Present perfect'],
        ['I **will help** you tomorrow.', 'Future (will)'], ['The new law **will take** effect next year.', 'Future (will)'],
      ] },
      { tipo: 'classificar', id: 'conectivos', titulo: 'Linking words', pergunta: 'O conectivo expressa:', categorias: ['Adição', 'Contraste', 'Causa', 'Conclusão', 'Exemplo'], itens: [
        ['moreover', 'Adição'], ['furthermore', 'Adição'], ['in addition', 'Adição'],
        ['however', 'Contraste'], ['nevertheless', 'Contraste'], ['although', 'Contraste', 'Concessão (embora).'], ['whereas', 'Contraste'],
        ['because of', 'Causa'], ['due to', 'Causa'], ['since (= já que)', 'Causa'],
        ['therefore', 'Conclusão'], ['thus', 'Conclusão'], ['hence', 'Conclusão'],
        ['for instance', 'Exemplo'], ['such as', 'Exemplo'],
      ] },
    ],
  },

  brasil: {
    intro: 'Estados e regiões, biomas e a linha do tempo da história do Brasil.',
    teoria: 'Norte (7): AC, AM, AP, PA, RO, RR, TO. Nordeste (9): AL, BA, CE, MA, PB, PE, PI, RN, SE. Centro-Oeste: GO, MT, MS e DF. Sudeste (4): ES, MG, RJ, SP. Sul (3): PR, RS, SC.',
    exercicios: [
      { tipo: 'classificar', id: 'regioes', titulo: 'Estados e regiões', pergunta: 'O estado pertence à Região:', categorias: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'], itens: [
        ['Acre', 'Norte'], ['Amazonas', 'Norte'], ['Amapá', 'Norte'], ['Pará', 'Norte'], ['Rondônia', 'Norte'], ['Roraima', 'Norte'], ['Tocantins', 'Norte', 'Criado em 1988, pertence ao Norte.'],
        ['Alagoas', 'Nordeste'], ['Bahia', 'Nordeste'], ['Ceará', 'Nordeste'], ['Maranhão', 'Nordeste'], ['Paraíba', 'Nordeste'], ['Pernambuco', 'Nordeste'], ['Piauí', 'Nordeste'], ['Rio Grande do Norte', 'Nordeste'], ['Sergipe', 'Nordeste'],
        ['Goiás', 'Centro-Oeste'], ['Mato Grosso', 'Centro-Oeste'], ['Mato Grosso do Sul', 'Centro-Oeste'], ['Distrito Federal', 'Centro-Oeste'],
        ['Espírito Santo', 'Sudeste'], ['Minas Gerais', 'Sudeste'], ['Rio de Janeiro', 'Sudeste'], ['São Paulo', 'Sudeste'],
        ['Paraná', 'Sul'], ['Rio Grande do Sul', 'Sul'], ['Santa Catarina', 'Sul'],
      ] },
      { tipo: 'classificar', id: 'biomas', titulo: 'Biomas brasileiros', pergunta: 'A característica descreve o bioma:', categorias: ['Amazônia', 'Cerrado', 'Mata Atlântica', 'Caatinga', 'Pantanal', 'Pampa'], itens: [
        ['Maior bioma do país, com floresta equatorial', 'Amazônia'], ['Maior biodiversidade de árvores e a maior bacia hidrográfica', 'Amazônia'],
        ['Savana com árvores de troncos retorcidos, chamado "berço das águas"', 'Cerrado'], ['Principal área de expansão da soja no Brasil central', 'Cerrado'],
        ['Floresta do litoral, a mais devastada desde a colonização', 'Mata Atlântica'], ['Bioma onde vive a maior parte da população', 'Mata Atlântica'],
        ['Vegetação adaptada à seca, exclusiva do Brasil', 'Caatinga'], ['Plantas que perdem folhas na estiagem do semiárido', 'Caatinga'],
        ['Maior planície alagável do mundo', 'Pantanal'], ['Ciclo de cheias e vazantes em MT e MS', 'Pantanal'],
        ['Campos do extremo sul, ligados à pecuária', 'Pampa'],
      ] },
      { tipo: 'ordenar', id: 'periodos', titulo: 'Períodos da história do Brasil', passos: ['Colônia', 'Primeiro Reinado', 'Período Regencial', 'Segundo Reinado', 'República Velha', 'Era Vargas', 'República de 1946', 'Regime militar', 'Nova República'] },
      { tipo: 'ordenar', id: 'eventos', titulo: 'Linha do tempo', passos: ['Governo-geral em Salvador (1549)', 'Inconfidência Mineira (1789)', 'Chegada da família real (1808)', 'Independência do Brasil (1822)', 'Independência da Bahia (1823)', 'Lei Áurea (1888)', 'Proclamação da República (1889)', 'Revolução de 1930', 'Inauguração de Brasília (1960)', 'Constituição Federal (1988)'] },
    ],
  },
};
