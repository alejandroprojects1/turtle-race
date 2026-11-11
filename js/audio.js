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

  function beep(go) {
    tone({ freq: go ? 880 : 440, type: 'square', dur: go ? 0.45 : 0.16, vol: 0.09 });
  }
  function swish(dir) {
    tone({ freq: dir < 0 ? 420 : 620, to: dir < 0 ? 760 : 380, type: 'sine', dur: 0.12, vol: 0.12 });
  }
  function fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.18, vol: 0.16, delay: i * 0.1 }));
  }

  // Motor contínuo: um "prrrr" grave e macio que sobe de tom com a velocidade.
  let eng = null;
  function engineStart() {
    const c = ensure();
    if (!c || eng) return;
    const out = c.createGain();
    out.gain.value = 0.0001;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 58;
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 29;
    const g2 = c.createGain(); g2.gain.value = 1.4;
    // tremor do motor ("putt-putt")
    const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 11;
    const trem = c.createGain(); trem.gain.value = 0.6;
    const lfoGain = c.createGain(); lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain).connect(trem.gain);
    o1.connect(filter); o2.connect(g2).connect(filter);
    filter.connect(trem).connect(out).connect(master);
    o1.start(); o2.start(); lfo.start();
    out.gain.exponentialRampToValueAtTime(0.11, c.currentTime + 0.3);
    eng = { out, filter, o1, o2, lfo };
  }
  function engineSet(v, revving) {
    if (!eng) return;
    const t = ctx.currentTime;
    const rev = revving ? 0.25 + 0.2 * Math.sin(t * 9) : 0;   // acelera parado na largada
    const x = Math.max(0, Math.min(1, v + rev));
    eng.o1.frequency.setTargetAtTime(58 + x * 82, t, 0.08);
    eng.o2.frequency.setTargetAtTime(29 + x * 41, t, 0.08);
    eng.lfo.frequency.setTargetAtTime(11 + x * 16, t, 0.08);
    eng.filter.frequency.setTargetAtTime(380 + x * 700, t, 0.08);
  }
  function engineStop() {
    if (!eng) return;
    const e = eng; eng = null;
    const t = ctx.currentTime;
    e.out.gain.cancelScheduledValues(t);
    e.out.gain.setTargetAtTime(0.0001, t, 0.08);
    setTimeout(() => { [e.o1, e.o2, e.lfo].forEach((o) => { try { o.stop(); } catch (err) { /* já parou */ } }); }, 500);
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem('tr-sound', on ? 'on' : 'off'); } catch (e) { /* sem storage */ }
    if (master) master.gain.value = on ? 0.6 : 0;
  }

  return { ensure, vroom, click, honk, beep, swish, fanfare, engineStart, engineSet, engineStop, setEnabled, get enabled() { return enabled; } };
})();
