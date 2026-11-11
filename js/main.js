// Turtle Race — parte 1: tela inicial e menu.
(() => {
  const toast = document.getElementById('toast');
  const soundBtn = document.getElementById('sound-toggle');
  const hero = document.querySelector('.hero');
  const typer = document.getElementById('typer');
  let toastTimer = null;

  // ---------- Recordes salvos no aparelho ----------
  try {
    const save = JSON.parse(localStorage.getItem('tr-save') || '{}');
    document.getElementById('best-score').textContent = save.best || 0;
    document.getElementById('total-stars').textContent = save.stars || 0;
  } catch (e) { /* sem storage */ }

  // ---------- Aviso rápido ----------
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ---------- Som ----------
  function updateSoundBtn() {
    soundBtn.classList.toggle('muted', !Sound.enabled);
    soundBtn.setAttribute('aria-label', Sound.enabled ? 'Som ligado' : 'Som desligado');
  }
  soundBtn.addEventListener('click', () => {
    Sound.setEnabled(!Sound.enabled);
    updateSoundBtn();
    Sound.click();
  });
  updateSoundBtn();

  // Tocar na tartaruga faz "vrum-vrum"
  hero.addEventListener('click', () => {
    Sound.vroom();
    hero.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(5%)' }, { transform: 'translateX(0)' }],
      { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' }
    );
  });

  // ---------- Terminal digitando comandos turtle ----------
  const lines = [
    'forward(100)',
    'left(90)',
    'color("red")',
    'begin_fill()',
    'goto(0, 0)',
    'end_fill()',
    'right(120)',
    'backward(50)',
  ];
  // Colore o código: nome do comando, textos e números
  function highlight(src) {
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return src.replace(/^(\w+)|("[^"]*"?)|(\d+)|([^\w"]+)/g, (m, fn, str, num) => {
      if (fn) return `<span class="fn">${esc(fn)}</span>`;
      if (str) return `<span class="str">${esc(str)}</span>`;
      if (num) return `<span class="num">${esc(num)}</span>`;
      return esc(m);
    });
  }
  // Formas que a "tartaruga" desenha ao lado do código
  const shapePath = document.getElementById('shape-path');
  const shapes = [
    'M8 8H32V32H8Z',                                   // quadrado
    'M20 6L34 32H6Z',                                  // triângulo
    'M5 12H35V28H5Z',                                  // retângulo
    'M20 5L24.400 15 35 16 27 23.500 29.500 34 20 28.500 10.500 34 13 23.500 5 16 15.600 15Z', // estrela
    'M20 5L33 12.500V27.500L20 35 7 27.500V12.500Z',           // hexágono
  ].map((d) => d.replace(/(\d)00\b/g, '$1'));
  const shapeColors = ['#ff4656', '#8be04e', '#4cc9ff', '#ffc83d', '#c58bff'];
  function drawShape(n) {
    shapePath.setAttribute('d', shapes[n % shapes.length]);
    shapePath.style.stroke = shapeColors[n % shapeColors.length];
    shapePath.style.animation = 'none';
    void shapePath.getBoundingClientRect();
    shapePath.style.animation = '';
  }

  let li = 0;
  function typeLine() {
    const text = lines[li % lines.length];
    drawShape(li);
    let i = 0;
    const step = () => {
      i++;
      typer.innerHTML = highlight(text.slice(0, i));
      if (i < text.length) setTimeout(step, 70);
      else setTimeout(() => { li++; typeLine(); }, 1400);
    };
    step();
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typer.innerHTML = highlight(lines[0]);
    drawShape(0);
  } else {
    setTimeout(typeLine, 900);
  }

  // ---------- Menu ----------
  document.querySelectorAll('.menu .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'race') {
        Sound.vroom();
        showToast('🏁 A pista está sendo construída (parte 2)');
      } else {
        Sound.honk();
        showToast('📚 O Modo Treino chega em breve');
      }
    });
  });

  // Desbloqueia o áudio no primeiro toque (exigência dos navegadores de celular)
  window.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
})();
