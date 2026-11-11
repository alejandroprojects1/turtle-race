# 🐢🏁 Turtle Race

Jogo educativo para o **5º ano** aprender os conceitos básicos de **Python turtle** (`forward`, `backward`, `left`, `right`, `goto`, `color`, `begin_fill`, `end_fill`) enquanto pilota um kart!

Roda direto no navegador, no celular ou no computador, sem instalar nada.

## Como jogar
Abra o link do jogo (GitHub Pages) no navegador. No celular, jogue com o aparelho deitado.

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
js/main.js        lógica das telas
assets/           imagens (tartaruga piloto)
docs/GDD.md       documento de design do jogo
```

## Andamento
- [x] Parte 1: base e tela inicial
- [ ] Parte 2: pista e controle
- [ ] Parte 3: obstáculos, itens, rivais e tempo
- [ ] Parte 4: mini interpretador turtle + perguntas
- [ ] Parte 5: exercícios estilo Duolingo e banco de questões
- [ ] Parte 6: voltas, níveis, cenários e Pit Stop
- [ ] Parte 7: Modo Treino
- [ ] Parte 8: turbo, personalização, resultado e acabamento
