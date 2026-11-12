# 🐢🏁 Turtle Race

Jogo educativo para o **5º ano** aprender os conceitos básicos de **Python turtle** (`forward`, `backward`, `left`, `right`, `goto`, `color`, `begin_fill`, `end_fill`) enquanto pilota um kart!

Roda direto no navegador, no celular ou no computador, sem instalar nada.

## Como jogar
Abra o link do jogo (GitHub Pages) no navegador. No celular, deslize o dedo para os lados para trocar de faixa.

## Como publicar (GitHub Pages)
1. No GitHub, abra **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch (ex.: `main`) e a pasta **/ (root)** e clique em **Save**.
4. Em alguns minutos o jogo fica disponível em `https://<usuario>.github.io/turtle-race/`.

## Estrutura
```
index.html        página do jogo
css/style.css     visual
js/audio.js       sons gerados pelo navegador (Web Audio)
js/fx.js          faíscas de velocidade do fundo
js/turtle.js      mini interpretador de Python turtle (executa e desenha o código)
js/questions.js   banco de perguntas
js/quiz.js        cartão de pergunta
js/train.js       Modo Treino (temas, aulinhas e revisão)
js/extras.js      Garagem (pinturas do kart), "Como jogar" e confete
js/kart.js        desenho do kart visto por trás
js/items.js       desenho dos obstáculos e itens
js/game.js        corrida 3D: pista, kart e controles
js/main.js        tela inicial e menu
assets/           imagens (tartaruga piloto)
docs/GDD.md       documento de design do jogo
```

## Andamento
- [x] Parte 1: base e tela inicial
- [x] Parte 2: pista e controle
- [x] Parte 3: obstáculos, itens, rivais e tempo
- [x] Parte 4: mini interpretador turtle + perguntas
- [x] Parte 5: exercícios estilo Duolingo e banco de questões
- [x] Parte 6: voltas, níveis, cenários e Pit Stop
- [x] Parte 7: Modo Treino
- [x] Parte 8: turbo, personalização, resultado e acabamento
