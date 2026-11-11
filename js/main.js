// Turtle Race — parte 1: tela inicial e menu.
(() => {
  const toast = document.getElementById('toast');
  const soundBtn = document.getElementById('sound-toggle');
  const hero = document.querySelector('.hero-kart');
  let toastTimer = null;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function updateSoundBtn() {
    soundBtn.textContent = Sound.enabled ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', Sound.enabled ? 'Som ligado' : 'Som desligado');
  }

  soundBtn.addEventListener('click', () => {
    Sound.setEnabled(!Sound.enabled);
    updateSoundBtn();
    Sound.click();
  });
  updateSoundBtn();

  // Tocar na tartaruga faz "vrum-vrum"
  hero.parentElement.addEventListener('click', () => {
    Sound.vroom();
    hero.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(6%)' }, { transform: 'translateX(0)' }],
      { duration: 500, easing: 'ease-out' }
    );
  });

  document.querySelectorAll('.menu .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'race') {
        Sound.vroom();
        showToast('🏁 A pista está sendo construída! (parte 2)');
      } else if (action === 'train') {
        Sound.honk();
        showToast('📚 O Modo Treino chega em breve!');
      }
    });
  });

  // Desbloqueia o áudio no primeiro toque (exigência dos navegadores de celular)
  window.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
})();
