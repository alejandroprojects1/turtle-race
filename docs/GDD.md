# 🐢🏁 Turtle Race — Documento de Design (GDD)

Jogo educativo para o **5º ano** aprender os conceitos básicos de **Python turtle**: comandos de movimento, cores e reconhecimento de códigos que formam figuras geométricas.

- **Plataforma:** navegador (HTML + JavaScript + Canvas), publicado no **GitHub Pages** — nada para instalar.
- **Foco:** **smartphone** (em pé), funcionando também deitado e no PC.
- **Idioma:** interface em português; código em **Python real** (`begin_fill()`, `end_fill()`).
- **Arte:** a tartaruga piloto do kart vermelho nº 1 (imagem enviada pela professora) é o personagem principal.

---

## 1. Modos de jogo

| Modo | Descrição |
|---|---|
| 🏁 **Corrida** | Modo principal: voltas na pista, obstáculos, rivais, bandeiras de pergunta e Pit Stop. |
| 📚 **Treino** | Pratica o conteúdo sem corrida e sem relógio, escolhendo um dos 5 temas. Cada tema começa com uma aulinha (texto curto e a tartaruga desenhando), passa por todos os exercícios e termina com os desafios de montar programa. Quem erra revê a pergunta no fim. As perguntas erradas na Corrida aparecem no cartão **Revisão**. Cada acerto vale uma estrela. |

---

## 2. Corrida

### 2.1 Controles
- **Smartphone:** deslizar ←/→ (ou tocar no lado esquerdo/direito da tela) troca de faixa.
- **PC:** setas ←/→ ou A/D.
- Botão de pausa ⏸ e botão de som 🔊/🔇.

### 2.2 Pista
**Visão 3D por trás do kart**, com o celular em pé (funciona deitado também). A pista tem 3 faixas e vai até o horizonte; **obstáculos, itens e rivais surgem lá em cima (no horizonte) e vêm em direção ao jogador**. Cada **volta** termina num pórtico de chegada.

### 2.3 Voltas e níveis
A cada volta, a velocidade sobe, os obstáculos ficam mais difíceis e o tema das perguntas avança.

| Volta | Cenário | Conteúdo das perguntas |
|---|---|---|
| 1 | Campo ☀️ (grama e árvores verdes) | `forward`, `backward` |
| 2 | Praia 🏖️ (areia, coqueiros e mar) | `left`, `right`, ângulos |
| 3 | Cidade 🏙️ (prédios e postes) | `goto`, `color` |
| 4 | Noite 🌙 (lua, estrelas e postes acesos) | `begin_fill`, `end_fill` |
| 5 | Arco-íris 🌈 (árvores coloridas) | formas completas, tudo misturado |

Depois da volta 5 os cenários se repetem, e a velocidade e os obstáculos continuam aumentando.

### 2.4 Tempo e pontos
- Começa com um cronômetro; **quando o tempo zera, a corrida acaba**.
- **Volta completa = pontos** (voltas mais altas valem mais).
- Pontos extras: estrelas, ultrapassar rivais, acertos em sequência.

### 2.5 Itens e obstáculos
- ⏱️ **Relógio** — tempo extra.
- ⭐ **Estrela** — pontos.
- 🛡️ **Casco-escudo** — protege de 1 batida.
- 🚧 Obstáculos: cones, pedras, poças de óleo (escorrega), buracos. Batida = perde tempo + tremida de tela.

### 2.6 Rivais
Outros **karts pilotados por tartarugas** de cores diferentes (azul, amarelo, roxo…). Eles trocam de faixa e são obstáculos que se movem. **Ultrapassar = bônus.**

### 2.7 Turbo de acertos ⚡
Cada pergunta acertada de primeira acende uma das 3 luzes da barra de turbo. Com 3 acertos seguidos: o kart anda 50% mais rápido por 6 segundos e passa por cima de obstáculos e rivais. Errar apaga a barra.

### 2.8 Bandeira de pergunta 🏁
Ao passar pela bandeira, **o jogo congela** e abre um cartão de pergunta.
- **Acertou:** a tartaruga desenha o código numa mini lousa e a corrida volta de onde parou.
- **Errou:** **perde 3 segundos**, aparece uma dica curta e amigável e a criança tenta de novo (as opções erradas ficam apagadas) até acertar. A pergunta vai para a lista de revisão do **Modo Treino**.

### 2.9 Pit Stop 🔧 (entre as voltas)
Ao cruzar a linha de chegada, a corrida congela e aparece um **desafio de criar código**: montar um programa inteiro com blocos para a forma pedida (ex.: "quadrado vermelho pintado"). A lousa mostra o objetivo pontilhado e o que a criança já montou.
- **Acertou:** escolhe um prêmio para a próxima volta: ⏱️ +10 segundos, 🛡️ escudo ou ⚡ turbo (6 segundos mais rápido e sem bater).
- **Errou:** perde 3 segundos e tenta de novo; depois de dois erros a resposta é mostrada e a corrida segue sem prêmio.

### 2.10 Fim de corrida
Cartão de resultado com avaliação de 1 a 3 estrelas, pontos, voltas, estrelas coletadas, acertos de primeira e aviso de recorde (com confete). O recorde fica salvo no aparelho.

---

## 3. Exercícios estilo Duolingo (só toque, sem digitar)

| # | Tipo | Exemplo |
|---|---|---|
| 1 | **Monte o comando** | tocar nos blocos `forward` `(` `100` `)` |
| 2 | **Ordene as linhas** | pôr as linhas na ordem certa para desenhar um quadrado |
| 3 | **Complete a lacuna** | `left(__)` → 90 / 120 / 45 |
| 4 | **Que desenho é esse?** | código → escolher entre 3 desenhos |
| 5 | **Que código é esse?** | desenho → escolher entre 3 códigos |
| 6 | **Onde a tartaruga para?** | tocar no ponto da grade (`goto(x, y)`) |
| 7 | **Ache o bug 🐛** | tocar na linha errada |
| 8 | **Pinte certo** | escolher a cor em `color("___")` e ver o preenchimento |

**Primeira versão:** tipos 1, 2, 3, 4, 5 e 7. Os tipos 6 e 8 vêm depois.

**Mini interpretador turtle:** um pequeno interpretador em JavaScript executa de verdade os comandos (`forward`, `backward`, `left`, `right`, `goto`, `color`, `begin_fill`, `end_fill`) e desenha na mini lousa. Isso gera os desenhos das perguntas e confere respostas montadas pela criança.

---

## 4. Personalização (Garagem)
As estrelas ganhas na corrida e no treino liberam **8 pinturas de kart** (vermelho, azul, verde, amarelo, roxo, rosa, preto e dourado, branco). A criança também escolhe o **número do kart** (1 a 9). Tudo fica salvo no aparelho, sem login.

---

## 5. Som 🔊
- **Barulho de motor amigável**: um "vrum" suave e fofinho, gerado pelo próprio navegador (Web Audio). O tom sobe com a velocidade e no turbo.
- Efeitos curtos: acerto ✅, erro (suave, sem susto), pegar item, batida "boing", buzina de largada, confete na chegada.
- Vibração leve no celular nas batidas e acertos.
- Botão para desligar o som.

---

## 6. Plano de desenvolvimento (aprovação parte a parte)
1. **Base e tela inicial**: estrutura, GitHub Pages, asset da tartaruga (fundo transparente), menu Corrida/Treino.
2. **Pista e controle**: kart, troca de faixa (toque + teclado), rolagem, som do motor.
3. **Obstáculos, itens, rivais e tempo**: colisões, relógios, estrelas, escudo, karts rivais.
4. **Mini interpretador turtle + sistema de perguntas**: bandeira, congelar, cartão, retomada.
5. **Exercícios estilo Duolingo e banco de questões por nível**.
6. **Voltas, níveis, cenários e Pit Stop**.
7. **Modo Treino**.
8. **Turbo, personalização, resultado e acabamento** (sons, efeitos, ajustes para celular).
