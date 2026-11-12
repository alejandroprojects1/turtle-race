// Modo Treino: a criança escolhe um tema e pratica sem relógio.
// Cada tema começa com uma aulinha, passa pelas perguntas e termina com os desafios de montar.
const Train = (() => {
  const $ = (id) => document.getElementById(id);
  const screen = $('train-screen');
  const list = $('train-list');

  const TOPICS = [
    { level: 1, title: 'Andar', cmds: ['forward', 'backward'], color: '#ff5a5f' },
    { level: 2, title: 'Girar', cmds: ['left', 'right'], color: '#ffb23d' },
    { level: 3, title: 'Cores e pontos', cmds: ['color', 'goto'], color: '#4cc9ff' },
    { level: 4, title: 'Pintar', cmds: ['begin_fill', 'end_fill'], color: '#8be04e' },
    { level: 5, title: 'Formas', cmds: ['quadrado', 'triângulo', 'retângulo'], color: '#b98bff' },
  ];

  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sem storage */ }
  };
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const byId = (id) => QUESTIONS.find((q) => q.id === id) || PIT_STOPS.find((q) => q.id === id);
  const exercises = (level) => [...QUESTIONS.filter((q) => q.level === level), ...PIT_STOPS.filter((q) => q.level === level)];

  let session = null;

  // ---------- Lista de temas ----------
  function render() {
    const mastered = load('tr-train', {});
    const review = load('tr-review', []).filter(byId);
    $('train-stars').textContent = load('tr-save', {}).stars || 0;
    list.innerHTML = '';

    if (review.length) {
      const b = document.createElement('button');
      b.className = 'topic topic-review';
      b.innerHTML = `<span class="topic-num">!</span><span class="topic-body"><b>Revisão</b><small></small></span><span class="topic-go">›</span>`;
      b.querySelector('small').textContent = review.length === 1
        ? '1 pergunta que você errou'
        : `${review.length} perguntas que você errou`;
      b.addEventListener('click', () => { Sound.click(); start({ review: true }); });
      list.appendChild(b);
    }

    TOPICS.forEach((t) => {
      const all = exercises(t.level);
      const done = all.filter((q) => mastered[q.id]).length;
      const b = document.createElement('button');
      b.className = 'topic';
      b.style.setProperty('--tc', t.color);
      b.innerHTML = `<span class="topic-num">${t.level}</span>
        <span class="topic-body"><b></b><span class="topic-cmds"></span>
          <span class="topic-bar"><i style="width:${Math.round(done / all.length * 100)}%"></i></span>
          <small>${done} de ${all.length} exercícios certos${done === all.length ? ' · completo!' : ''}</small>
        </span><span class="topic-go">›</span>`;
      b.querySelector('b').textContent = t.title;
      const cmds = b.querySelector('.topic-cmds');
      t.cmds.forEach((c) => { const s = document.createElement('code'); s.textContent = c; cmds.appendChild(s); });
      b.addEventListener('click', () => { Sound.click(); start({ topic: t }); });
      list.appendChild(b);
    });
  }

  function open() {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    screen.classList.add('active');
    $('train-done').classList.remove('show');
    render();
  }

  function exit() {
    screen.classList.remove('active');
    $('title-screen').classList.add('active');
    $('total-stars').textContent = load('tr-save', {}).stars || 0;
  }

  // ---------- Sessão de treino ----------
  function start(opts) {
    let queue;
    if (opts.review) {
      queue = shuffle(load('tr-review', []).map(byId).filter(Boolean));
    } else {
      const lv = opts.topic.level;
      queue = [
        ...LESSONS.filter((l) => l.level === lv),
        ...shuffle(QUESTIONS.filter((q) => q.level === lv)),
        ...PIT_STOPS.filter((q) => q.level === lv),
      ];
    }
    const total = queue.filter((q) => q.type !== 'lesson').length;
    session = { opts, queue, total, done: 0, first: 0, stars: 0, retried: {}, streak: 0 };
    next();
  }

  function next() {
    const s = session;
    if (!s) return;
    if (!s.queue.length) { finish(); return; }
    const q = s.queue.shift();
    const lesson = q.type === 'lesson';
    let again = false;
    Quiz.ask({
      question: q, train: true, streak: s.streak,
      tag: lesson ? 'Aula' : s.opts.review ? 'Revisão' : 'Treino',
      progress: s.total ? s.done / s.total : 0,
    }, {
      onWrong() { s.streak = 0; again = true; },
      onCorrect(first, revealed) {
        if (first && !revealed) {
          s.first++; s.stars++; s.streak++;
          const mastered = load('tr-train', {});
          mastered[q.id] = 1;
          save('tr-train', mastered);
          save('tr-review', load('tr-review', []).filter((id) => id !== q.id));
        } else again = true;
      },
      onClose() {
        if (lesson) { next(); return; }
        // errou: a pergunta volta uma vez no fim da fila, como no Duolingo
        if (again && !s.retried[q.id]) { s.retried[q.id] = 1; s.queue.push(q); }
        else s.done++;
        next();
      },
      onExit() { session = null; render(); },
    });
  }

  function finish() {
    const s = session;
    const data = load('tr-save', {});
    data.stars = (data.stars || 0) + s.stars;
    save('tr-save', data);
    $('done-first').textContent = `${s.first} de ${s.total}`;
    $('done-stars').textContent = `+${s.stars}`;
    $('done-msg').textContent = s.first === s.total
      ? 'Perfeito! Você acertou tudo.'
      : s.first >= s.total * 0.6 ? 'Muito bem! Treine de novo para acertar tudo.'
        : 'Bom treino! Refaça com calma e leia as dicas.';
    $('train-done').classList.add('show');
    Sound.fanfare();
    render();
  }

  $('train-back').addEventListener('click', () => { Sound.click(); exit(); });
  $('done-again').addEventListener('click', () => {
    Sound.click();
    $('train-done').classList.remove('show');
    const opts = session.opts;
    if (opts.review && !load('tr-review', []).filter(byId).length) { session = null; return; }
    start(opts);
  });
  $('done-menu').addEventListener('click', () => { Sound.click(); $('train-done').classList.remove('show'); session = null; });

  return { open, exit, get session() { return session; } };
})();
