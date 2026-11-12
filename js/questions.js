// Banco de perguntas do Turtle Race.
// level: 1 = forward/backward · 2 = left/right · 3 = goto/color · 4 = begin_fill/end_fill · 5 = formas
// options: { text } (frase) · { code } (código) · { draw } (desenho feito pelo código)
// demo: código que a tartaruga desenha na lousa depois do acerto (se não tiver, usa `code`)
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
];
