// Banco de perguntas do Turtle Race.
// level: 1 = forward/backward · 2 = left/right · 3 = goto/color · 4 = begin_fill/end_fill · 5 = formas
//
// type (se não tiver, é 'choice'):
//   choice — options: { text } (frase) · { code } (código) · { draw } (desenho feito pelo código); answer = posição da certa
//   blank  — code com ___ ; options: textos para a lacuna; answer = posição da certa
//   build  — tokens: blocos do comando na ordem certa; extra: blocos que sobram
//   order  — lines: linhas na ordem certa (vale qualquer ordem que faça o mesmo desenho)
//   bug    — code com uma linha errada; answer = número da linha (começa em 0); fix = linha corrigida
//
// picture: código de um desenho mostrado na lousa (sem mostrar o código)
// goal: true mostra na lousa o desenho que o código certo faz
// demo: código que a tartaruga desenha depois do acerto (se não tiver, usa a resposta certa)
const SQUARE = 'forward(100)\nleft(90)\nforward(100)\nleft(90)\nforward(100)\nleft(90)\nforward(100)';
const TRIANGLE = 'forward(100)\nleft(120)\nforward(100)\nleft(120)\nforward(100)';
const RECT = 'forward(150)\nleft(90)\nforward(80)\nleft(90)\nforward(150)\nleft(90)\nforward(80)';

const QUESTIONS = [
  // ---------- Nível 1: forward e backward ----------
  {
    id: 'f1', level: 1, prompt: 'O que a tartaruga faz com este comando?', code: 'forward(100)',
    options: [{ text: 'Anda 100 passos para frente' }, { text: 'Anda 100 passos para trás' }, { text: 'Gira 100 graus' }],
    answer: 0, hint: '"forward" quer dizer "para frente" em inglês.',
    explain: 'forward(100) faz a tartaruga andar 100 passos para frente, riscando uma linha.',
  },
  {
    id: 'f2', level: 1, prompt: 'Qual comando faz a tartaruga andar para trás?',
    options: [{ code: 'forward(50)' }, { code: 'backward(50)' }, { code: 'left(50)' }],
    answer: 1, hint: '"back" quer dizer "trás" em inglês.', demo: 'backward(50)',
    explain: 'backward(50) faz a tartaruga andar 50 passos de ré, sem virar.',
  },
  {
    id: 'f3', level: 1, prompt: 'Onde a tartaruga termina depois deste código?', code: 'forward(100)\nbackward(100)',
    options: [{ text: '200 passos à frente' }, { text: '100 passos atrás' }, { text: 'No mesmo lugar em que começou' }],
    answer: 2, hint: 'Ela vai 100 passos e depois volta os mesmos 100.',
    explain: 'Ela anda 100 para frente e volta 100 para trás: termina onde começou.',
  },
  {
    id: 'f4', level: 1, prompt: 'Qual linha é a mais comprida?',
    options: [{ code: 'forward(30)' }, { code: 'forward(150)' }, { code: 'forward(80)' }],
    answer: 1, hint: 'Quanto maior o número, mais passos a tartaruga dá.', demo: 'forward(150)',
    explain: 'O número dentro dos parênteses é a quantidade de passos: 150 é o maior.',
  },

  // ---------- Nível 2: left e right ----------
  {
    id: 'l1', level: 2, prompt: 'O que a tartaruga faz com este comando?', code: 'left(90)',
    options: [{ text: 'Anda 90 passos para a esquerda' }, { text: 'Gira 90 graus para a esquerda' }, { text: 'Gira 90 graus para a direita' }],
    answer: 1, hint: 'left e right só giram a tartaruga, sem sair do lugar.', demo: 'forward(60)\nleft(90)\nforward(60)',
    explain: 'left(90) gira a tartaruga 90 graus para a esquerda. Ela não anda, só vira.',
  },
  {
    id: 'l2', level: 2, prompt: 'Que desenho este código faz?', code: 'forward(100)\nleft(90)\nforward(100)',
    options: [{ draw: 'forward(100)\nright(90)\nforward(100)' }, { draw: 'forward(200)' }, { draw: 'forward(100)\nleft(90)\nforward(100)' }],
    answer: 2, hint: 'Depois de andar, ela vira para a ESQUERDA e anda de novo.',
    explain: 'Ela anda, vira 90 graus para a esquerda (para cima) e anda de novo: forma um "L".',
  },
  {
    id: 'l3', level: 2, prompt: 'Quantos graus a tartaruga gira para fazer o canto de um quadrado?',
    options: [{ code: 'left(45)' }, { code: 'left(90)' }, { code: 'left(180)' }],
    answer: 1, hint: 'O canto de um quadrado é um ângulo reto.', demo: SQUARE,
    explain: 'Cada canto do quadrado tem 90 graus (ângulo reto).',
  },
  {
    id: 'l4', level: 2, prompt: 'Qual comando faz a tartaruga virar para a direita?',
    options: [{ code: 'right(90)' }, { code: 'left(90)' }, { code: 'forward(90)' }],
    answer: 0, hint: '"right" quer dizer "direita" em inglês.', demo: 'forward(60)\nright(90)\nforward(60)',
    explain: 'right(90) gira a tartaruga 90 graus para a direita.',
  },

  // ---------- Nível 3: goto e color ----------
  {
    id: 'c1', level: 3, prompt: 'O que este comando faz?', code: 'color("red")',
    options: [{ text: 'Apaga o desenho' }, { text: 'Pinta a tela inteira de vermelho' }, { text: 'Muda a cor da caneta para vermelho' }],
    answer: 2, hint: 'A tartaruga carrega uma caneta. color escolhe a cor dela.', demo: 'color("red")\nforward(100)',
    explain: 'color("red") troca a cor da caneta: as próximas linhas saem vermelhas.',
  },
  {
    id: 'c2', level: 3, prompt: 'Que desenho este código faz?', code: 'color("blue")\nforward(100)',
    options: [{ draw: 'color("red")\nforward(100)' }, { draw: 'color("blue")\nforward(100)' }, { draw: 'color("green")\nforward(100)' }],
    answer: 1, hint: '"blue" é azul em inglês.',
    explain: 'A caneta fica azul e a tartaruga risca uma linha azul.',
  },
  {
    id: 'g1', level: 3, prompt: 'O que este comando faz?', code: 'goto(100, 50)',
    options: [{ text: 'Vai direto para o ponto x = 100, y = 50' }, { text: 'Anda 100 passos e gira 50 graus' }, { text: 'Desenha um retângulo de 100 por 50' }],
    answer: 0, hint: '"go to" quer dizer "vá para". Os números são um endereço na tela.',
    explain: 'goto(100, 50) leva a tartaruga em linha reta até o ponto (100, 50).',
  },
  {
    id: 'g2', level: 3, prompt: 'Para onde a tartaruga vai com este comando?', code: 'goto(0, 0)',
    options: [{ text: 'Para o canto da tela' }, { text: 'Para o centro da tela, onde ela começa' }, { text: 'Para lugar nenhum' }],
    answer: 1, hint: 'O ponto (0, 0) é onde a tartaruga nasce.', demo: 'forward(80)\nleft(90)\nforward(60)\ngoto(0, 0)',
    explain: 'O ponto (0, 0) é o centro da tela. goto(0, 0) leva a tartaruga de volta para lá.',
  },

  // ---------- Nível 4: begin_fill e end_fill ----------
  {
    id: 'p1', level: 4, prompt: 'Para que servem begin_fill() e end_fill()?',
    options: [{ text: 'Para apagar a forma' }, { text: 'Para pintar a forma por dentro' }, { text: 'Para a tartaruga andar mais rápido' }],
    answer: 1, hint: '"fill" quer dizer "preencher".', demo: 'color("orange")\nbegin_fill()\n' + SQUARE + '\nend_fill()',
    explain: 'Tudo o que for desenhado entre begin_fill() e end_fill() fica pintado por dentro.',
  },
  {
    id: 'p2', level: 4, prompt: 'Que desenho este código faz?', code: 'color("red")\nbegin_fill()\n' + SQUARE + '\nend_fill()',
    options: [{ draw: 'color("red")\n' + SQUARE }, { draw: 'color("blue")\nbegin_fill()\n' + SQUARE + '\nend_fill()' }, { draw: 'color("red")\nbegin_fill()\n' + SQUARE + '\nend_fill()' }],
    answer: 2, hint: 'Repare na cor e se tem begin_fill() e end_fill().',
    explain: 'A cor é vermelha e o quadrado está entre begin_fill() e end_fill(): fica pintado de vermelho.',
  },
  {
    id: 'p3', level: 4, prompt: 'Qual comando vem ANTES de desenhar a forma que vai ser pintada?',
    options: [{ code: 'end_fill()' }, { code: 'begin_fill()' }, { code: 'forward(0)' }],
    answer: 1, hint: '"begin" quer dizer "começar".', demo: 'color("green")\nbegin_fill()\n' + TRIANGLE + '\nend_fill()',
    explain: 'begin_fill() vem antes da forma e end_fill() vem depois dela.',
  },

  // ---------- Nível 5: formas ----------
  {
    id: 's1', level: 5, prompt: 'Que forma este código desenha?', code: SQUARE,
    options: [{ draw: TRIANGLE }, { draw: SQUARE }, { draw: RECT }],
    answer: 1, hint: 'São 4 lados do mesmo tamanho e cantos de 90 graus.',
    explain: '4 lados iguais com giros de 90 graus formam um quadrado.',
  },
  {
    id: 's2', level: 5, prompt: 'Que forma este código desenha?', code: TRIANGLE,
    options: [{ text: 'Quadrado' }, { text: 'Retângulo' }, { text: 'Triângulo' }],
    answer: 2, hint: 'Conte quantas vezes aparece forward: são 3 lados.',
    explain: '3 lados iguais com giros de 120 graus formam um triângulo.',
  },
  {
    id: 's3', level: 5, prompt: 'Que forma este código desenha?', code: RECT,
    options: [{ text: 'Retângulo' }, { text: 'Quadrado' }, { text: 'Triângulo' }],
    answer: 0, hint: 'Os lados têm dois tamanhos diferentes: 150 e 80.',
    explain: 'Dois lados compridos (150) e dois curtos (80), com cantos de 90 graus: é um retângulo.',
  },
  {
    id: 's4', level: 5, prompt: 'Qual giro a tartaruga usa para desenhar um triângulo de lados iguais?',
    options: [{ code: 'left(90)' }, { code: 'left(60)' }, { code: 'left(120)' }],
    answer: 2, hint: 'No quadrado é 90. No triângulo ela precisa girar mais.', demo: TRIANGLE,
    explain: 'No triângulo de lados iguais a tartaruga gira 120 graus em cada ponta.',
  },

  // ====================== Exercícios estilo Duolingo ======================

  // ---------- Nível 1 ----------
  {
    id: 'b_f1', level: 1, type: 'build', prompt: 'Monte o comando para a tartaruga andar 100 passos para frente.',
    tokens: ['forward', '(', '100', ')'], extra: ['backward', 'left'],
    hint: 'Primeiro o nome do comando, depois o número entre parênteses.',
    explain: 'forward(100): o nome do comando e, entre parênteses, quantos passos.',
  },
  {
    id: 'b_f2', level: 1, type: 'build', prompt: 'Monte o comando para a tartaruga andar 50 passos para trás.',
    tokens: ['backward', '(', '50', ')'], extra: ['forward', '100'],
    hint: 'Para trás é backward. Quantos passos o enunciado pede?',
    explain: 'backward(50) faz a tartaruga andar 50 passos de ré.',
  },
  {
    id: 'k_f1', level: 1, type: 'blank', prompt: 'Complete para a tartaruga andar para FRENTE.', code: '___(80)',
    options: ['forward', 'backward', 'left'], answer: 0,
    hint: '"forward" quer dizer "para frente".',
    explain: 'forward(80) faz a tartaruga andar 80 passos para frente.',
  },
  {
    id: 'k_f2', level: 1, type: 'blank', prompt: 'A tartaruga precisa andar 200 passos. Que número falta?', code: 'forward(___)',
    options: ['20', '200', '2'], answer: 1,
    hint: 'O número entre parênteses é a quantidade de passos.',
    explain: 'forward(200): a tartaruga anda exatamente 200 passos.',
  },
  {
    id: 'x_f1', level: 1, type: 'bug', prompt: 'Uma linha tem um erro de digitação. Toque nela!',
    code: 'forward(100)\nfoward(50)\nbackward(30)', answer: 1, fix: 'forward(50)',
    hint: 'Leia cada palavra com calma, letra por letra.',
    explain: 'Estava escrito "foward", sem um "r". O computador só entende forward escrito certinho.',
  },

  // ---------- Nível 2 ----------
  {
    id: 'b_l1', level: 2, type: 'build', prompt: 'Monte o comando para a tartaruga virar 90 graus para a esquerda.',
    tokens: ['left', '(', '90', ')'], extra: ['right', 'forward'],
    hint: 'Esquerda em inglês é "left".',
    explain: 'left(90) gira a tartaruga 90 graus para a esquerda.', demo: 'forward(60)\nleft(90)\nforward(60)',
  },
  {
    id: 'k_l1', level: 2, type: 'blank', prompt: 'Complete o código para fazer este desenho.', code: 'forward(100)\n___(90)\nforward(100)',
    options: ['left', 'right', 'backward'], answer: 1, goal: true,
    hint: 'A tartaruga começa olhando para a direita da tela. No desenho ela desce.',
    explain: 'Para descer, a tartaruga vira para a direita dela: right(90).',
  },
  {
    id: 'o_l1', level: 2, type: 'order', prompt: 'Coloque as linhas em ordem para fazer o desenho pontilhado.',
    lines: ['forward(100)', 'left(90)', 'forward(50)'],
    hint: 'A linha deitada é a mais comprida e vem primeiro.',
    explain: 'Primeiro anda 100, depois vira para a esquerda e anda 50.',
  },
  {
    id: 'x_l1', level: 2, type: 'bug', prompt: 'Este código devia desenhar um quadrado, mas uma linha está errada. Toque nela!',
    code: 'forward(100)\nleft(90)\nforward(100)\nleft(45)\nforward(100)\nleft(90)\nforward(100)', answer: 3, fix: 'left(90)',
    hint: 'No quadrado, todos os giros são iguais.',
    explain: 'Um dos giros estava com 45 graus. No quadrado todos os cantos têm 90 graus.',
  },
  {
    id: 'd_l1', level: 2, prompt: 'Qual código faz este desenho?', picture: 'forward(100)\nleft(90)\nforward(100)',
    options: [{ code: 'forward(100)\nleft(90)\nforward(100)' }, { code: 'forward(100)\nright(90)\nforward(100)' }, { code: 'forward(100)\nforward(100)' }],
    answer: 0, hint: 'A tartaruga começa olhando para a direita da tela. No desenho ela sobe.',
    explain: 'Para subir, a tartaruga vira para a esquerda dela: left(90).',
  },
  {
    id: 'l5', level: 2, prompt: 'A tartaruga faz left(90) e depois right(90). Para onde ela fica olhando?',
    options: [{ text: 'Para o mesmo lado de antes' }, { text: 'Para trás' }, { text: 'Para cima' }],
    answer: 0, hint: 'Um giro desfaz o outro.', demo: 'forward(50)\nleft(90)\nright(90)\nforward(50)',
    explain: 'Ela vira 90 para a esquerda e volta 90 para a direita: fica olhando para onde estava.',
  },

  // ---------- Nível 3 ----------
  {
    id: 'b_c1', level: 3, type: 'build', prompt: 'Monte o comando para deixar a caneta azul.',
    tokens: ['color', '(', '"blue"', ')'], extra: ['"red"', 'forward'],
    hint: 'Azul em inglês é "blue".',
    explain: 'color("blue") deixa a caneta azul. O nome da cor fica entre aspas.', demo: 'color("blue")\nforward(100)',
  },
  {
    id: 'b_g1', level: 3, type: 'build', prompt: 'Monte o comando para ir até o ponto x = 50, y = 100.',
    tokens: ['goto', '(', '50', ',', '100', ')'], extra: ['forward'],
    hint: 'Primeiro vem o x, depois a vírgula, depois o y.',
    explain: 'goto(50, 100): primeiro o x (para os lados), depois o y (para cima).',
  },
  {
    id: 'k_c1', level: 3, type: 'blank', prompt: 'Complete o código para a linha sair verde.', code: 'color("___")\nforward(100)',
    options: ['red', 'green', 'blue'], answer: 1, goal: true,
    hint: 'Verde em inglês é "green".',
    explain: 'color("green") deixa a caneta verde.',
  },
  {
    id: 'o_c1', level: 3, type: 'order', prompt: 'Coloque as linhas em ordem para desenhar uma linha VERMELHA.',
    lines: ['color("red")', 'forward(100)'],
    hint: 'A tartaruga precisa escolher a cor antes de riscar.',
    explain: 'Primeiro escolhe a cor, depois desenha. Se desenhar antes, a linha sai preta.',
  },
  {
    id: 'x_c1', level: 3, type: 'bug', prompt: 'Falta um detalhe numa linha. Toque nela!',
    code: 'color(red)\nforward(100)\nleft(90)', answer: 0, fix: 'color("red")',
    hint: 'O nome da cor precisa de um par de sinais em volta.',
    explain: 'O nome da cor fica sempre entre aspas: color("red").',
  },
  {
    id: 'd_c1', level: 3, prompt: 'Qual código faz este desenho?', picture: 'color("red")\nforward(100)',
    options: [{ code: 'color("blue")\nforward(100)' }, { code: 'forward(100)' }, { code: 'color("red")\nforward(100)' }],
    answer: 2, hint: 'Repare na cor da linha.',
    explain: 'A linha é vermelha, então o código começa com color("red").',
  },

  // ---------- Nível 4 ----------
  {
    id: 'b_p1', level: 4, type: 'build', prompt: 'Monte o comando que COMEÇA a pintura da forma.',
    tokens: ['begin_fill', '(', ')'], extra: ['end_fill', 'color'],
    hint: '"begin" quer dizer "começar".',
    explain: 'begin_fill() avisa: "a partir daqui, pinte por dentro".', demo: 'color("orange")\nbegin_fill()\n' + TRIANGLE + '\nend_fill()',
  },
  {
    id: 'k_p1', level: 4, type: 'blank', prompt: 'Complete o código para o triângulo ficar pintado.', code: 'color("blue")\n___()\n' + TRIANGLE + '\nend_fill()',
    options: ['end_fill', 'begin_fill', 'forward'], answer: 1, goal: true,
    hint: 'A pintura precisa começar antes da forma.',
    explain: 'begin_fill() vem antes da forma, e end_fill() fecha a pintura no final.',
  },
  {
    id: 'o_p1', level: 4, type: 'order', prompt: 'Coloque os blocos em ordem para pintar o quadrado de laranja.',
    lines: ['color("orange")', 'begin_fill()', SQUARE, 'end_fill()'],
    hint: 'Cor, começar a pintura, desenhar a forma, terminar a pintura.',
    explain: 'A ordem é: escolher a cor, begin_fill(), desenhar a forma e end_fill().',
  },
  {
    id: 'x_p1', level: 4, type: 'bug', prompt: 'O triângulo não ficou pintado. Qual linha está errada?',
    code: 'color("red")\nbegin_fill()\n' + TRIANGLE + '\nbegin_fill()', answer: 7, fix: 'end_fill()',
    hint: 'A pintura começa com begin_fill() e termina com outro comando.',
    explain: 'A última linha precisa ser end_fill() para fechar a pintura.',
  },
  {
    id: 'p4', level: 4, prompt: 'O que acontece se você esquecer o end_fill()?',
    options: [{ text: 'A forma não fica pintada' }, { text: 'A forma fica pintada duas vezes' }, { text: 'A tartaruga some' }],
    answer: 0, hint: 'A tinta só aparece quando a pintura é terminada.', demo: 'color("purple")\nbegin_fill()\n' + SQUARE + '\nend_fill()',
    explain: 'A pintura só acontece quando o end_fill() é chamado. Sem ele, fica só o contorno.',
  },

  // ---------- Nível 5 ----------
  {
    id: 'o_s1', level: 5, type: 'order', prompt: 'Coloque as linhas em ordem para desenhar o triângulo.',
    lines: ['forward(100)', 'left(120)', 'forward(100)', 'left(120)', 'forward(100)'],
    hint: 'Anda, vira, anda, vira, anda.',
    explain: 'O triângulo alterna: anda um lado, gira 120 graus, e repete.',
  },
  {
    id: 'k_s1', level: 5, type: 'blank', prompt: 'Que número falta para fechar o quadrado?', code: 'forward(100)\nleft(90)\nforward(100)\nleft(___)\nforward(100)\nleft(90)\nforward(100)',
    options: ['45', '90', '120'], answer: 1, goal: true,
    hint: 'Todos os cantos do quadrado são iguais.',
    explain: 'Todos os giros do quadrado são de 90 graus.',
  },
  {
    id: 'k_s2', level: 5, type: 'blank', prompt: 'Que número falta para desenhar o triângulo?', code: 'forward(100)\nleft(120)\nforward(100)\nleft(___)\nforward(100)',
    options: ['90', '60', '120'], answer: 2, goal: true,
    hint: 'Os dois giros do triângulo são iguais.',
    explain: 'No triângulo de lados iguais, cada giro é de 120 graus.',
  },
  {
    id: 'x_s1', level: 5, type: 'bug', prompt: 'Este retângulo não fecha direito. Qual linha está errada?',
    code: 'forward(150)\nleft(90)\nforward(80)\nleft(90)\nforward(100)\nleft(90)\nforward(80)', answer: 4, fix: 'forward(150)',
    hint: 'No retângulo, os lados de frente um para o outro têm o mesmo tamanho.',
    explain: 'O lado de cima precisa ter 150, igual ao de baixo.',
  },
  {
    id: 'b_s1', level: 5, type: 'build', prompt: 'Monte o giro que a tartaruga faz em cada canto do quadrado.',
    tokens: ['left', '(', '90', ')'], extra: ['120', '45'],
    hint: 'O canto do quadrado é um ângulo reto.',
    explain: 'left(90): cada canto do quadrado tem 90 graus.', demo: SQUARE,
  },
];
