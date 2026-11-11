// Sons do jogo gerados pelo próprio navegador (Web Audio), sem arquivos de áudio.
// Tudo com volume baixo e timbre suave, para ser amigável às crianças.
const Sound = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;

  try { enabled = localStorage.getItem('tr-sound') !== 'off'; } catch (e) { /* sem storage */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.6 : 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, to = null, type = 'sine', dur = 0.15, vol = 0.25, delay = 0 }) {
    const c = ensure();
    if (!c || !enabled) return;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // "Vrum-vrum" fofinho: duas subidas de motor suaves, filtradas.
  function vroom() {
    const c = ensure();
    if (!c || !enabled) return;
    const t = c.currentTime;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.connect(master);
    [[0, 70, 150], [0.28, 85, 210]].forEach(([d, f1, f2]) => {
      const osc = c.createOscillator();
      const wob = c.createOscillator();
      const wobGain = c.createGain();
      const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f1, t + d);
      osc.frequency.exponentialRampToValueAtTime(f2, t + d + 0.25);
      wob.frequency.value = 28;           // "ronco" do motor
      wobGain.gain.value = 12;
      wob.connect(wobGain).connect(osc.frequency);
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.22, t + d + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.32);
      osc.connect(g).connect(filter);
      osc.start(t + d); wob.start(t + d);
      osc.stop(t + d + 0.35); wob.stop(t + d + 0.35);
    });
  }

  function click() { tone({ freq: 660, to: 880, type: 'triangle', dur: 0.09, vol: 0.18 }); }
  function honk() {
    tone({ freq: 523, type: 'square', dur: 0.12, vol: 0.08 });
    tone({ freq: 659, type: 'square', dur: 0.16, vol: 0.08, delay: 0.13 });
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem('tr-sound', on ? 'on' : 'off'); } catch (e) { /* sem storage */ }
    if (master) master.gain.value = on ? 0.6 : 0;
  }

  return { ensure, vroom, click, honk, setEnabled, get enabled() { return enabled; } };
})();
