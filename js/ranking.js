// Ranking das turmas (Supabase): guarda a melhor pontuação de cada aluno na corrida.
const Ranking = (() => {
  const $ = (id) => document.getElementById(id);
  const TURMAS = ['5A', '5B'];
  const MAX_PONTOS = 999999999999;            // mesmo limite do banco (supabase/ranking.sql)
  const fmt = (n) => Number(n).toLocaleString('pt-BR');
  const screen = $('rank-screen');
  let turma = TURMAS[0], afterProfile = null, pickTurma = '';

  const ready = () => !!(SUPABASE.url && SUPABASE.key);
  const tidy = (s) => String(s || '').trim().replace(/\s+/g, ' ');
  const same = (a, b) => tidy(a).toLowerCase() === tidy(b).toLowerCase();

  // "maria da silva" -> "Maria da Silva"
  const SMALL = ['da', 'de', 'do', 'das', 'dos', 'e'];
  const capitalize = (nome) => nome.toLowerCase().split(' ').map((w, i) => (i && SMALL.includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');

  // ---------- Quem está jogando (salvo no aparelho) ----------
  function profile() {
    try {
      const p = JSON.parse(localStorage.getItem('tr-player'));
      return p && p.nome && TURMAS.includes(p.turma) ? p : null;
    } catch (e) { return null; }
  }
  function saveProfile(p) {
    try { localStorage.setItem('tr-player', JSON.stringify(p)); } catch (e) { /* sem storage */ }
  }

  // ---------- Conversa com o Supabase ----------
  async function api(path, options = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(SUPABASE.url.replace(/\/+$/, '') + path, {
        ...options,
        signal: ctrl.signal,
        headers: { apikey: SUPABASE.key, Authorization: 'Bearer ' + SUPABASE.key, 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.status === 204 ? null : res.json();
    } finally { clearTimeout(timer); }
  }
  const list = (t) => api(`/rest/v1/ranking?select=nome,turma,pontos,voltas&turma=eq.${encodeURIComponent(t)}&order=pontos.desc,atualizado_em.asc&limit=500`);
  const send = (p, pontos, voltas) => api('/rest/v1/rpc/enviar_pontuacao', {
    method: 'POST',
    body: JSON.stringify({ p_nome: p.nome, p_turma: p.turma, p_pontos: pontos, p_voltas: voltas }),
  });

  // Envia o recorde guardado no aparelho. O banco só troca se for maior que o que já tem,
  // então isto também recupera recordes que não chegaram ao ranking (sem internet, por exemplo).
  async function sync(p, pontos = 0, voltas = 0) {
    let best = 0, laps = 0;
    try { const d = JSON.parse(localStorage.getItem('tr-save')) || {}; best = d.best || 0; laps = d.bestLaps || 0; } catch (e) { /* sem storage */ }
    if (pontos >= best) { best = pontos; laps = voltas; }
    if (best > 0) await send(p, Math.min(Math.floor(best), MAX_PONTOS), Math.min(laps, 100000));
  }

  // ---------- Linhas do ranking ----------
  // bolinha com as iniciais do aluno, numa cor que depende do nome
  function avatar(nome) {
    const words = tidy(nome).split(' ');
    const el = document.createElement('span');
    el.className = 'rank-avatar';
    el.textContent = ((words[0] || '?')[0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
    let h = 0;
    for (const ch of tidy(nome).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % 360;
    el.style.background = `linear-gradient(140deg, hsl(${h}, 85%, 62%), hsl(${(h + 40) % 360}, 80%, 48%))`;
    return el;
  }

  // degrau do pódio (1º, 2º ou 3º lugar)
  function step(r, pos, me) {
    const el = document.createElement('div');
    el.className = `podium-step p${pos}` + (me ? ' me' : '');
    el.innerHTML = '<span class="podium-medal"></span><span class="podium-name"></span><b class="podium-pts"></b><span class="podium-base"></span>';
    el.children[0].textContent = pos === 1 ? '👑' : pos === 2 ? '🥈' : '🥉';
    el.insertBefore(avatar(r.nome), el.children[1]);
    el.querySelector('.podium-name').textContent = r.nome + (me ? ' (você)' : '');
    el.querySelector('.podium-pts').textContent = fmt(r.pontos);
    el.querySelector('.podium-base').textContent = pos + 'º';
    return el;
  }

  function row(r, pos, me) {
    const li = document.createElement('li');
    li.className = 'rank-row' + (pos <= 3 ? ' top' + pos : '') + (me ? ' me' : '');
    li.innerHTML = '<span class="rank-pos"></span><span class="rank-name"></span><span class="rank-laps"></span><b class="rank-pts"></b>';
    li.children[0].textContent = pos + 'º';
    li.children[1].textContent = r.nome + (me ? ' (você)' : '');
    li.children[2].textContent = !r.voltas ? '' : r.voltas === 1 ? '1 volta' : `${r.voltas} voltas`;
    li.children[3].textContent = fmt(r.pontos);
    li.insertBefore(avatar(r.nome), li.children[1]);
    return li;
  }

  // ---------- Tela do ranking ----------
  async function load() {
    const box = $('rank-list'), msg = $('rank-msg'), p = profile();
    document.querySelectorAll('#rank-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.turma === turma));
    $('rank-me').textContent = p ? `${p.nome} · ${p.turma}` : 'Escolher meu nome';
    box.innerHTML = '';
    const podium = $('rank-podium');
    podium.innerHTML = '';
    if (!ready()) { msg.textContent = 'O ranking ainda não foi configurado pelo professor.'; return; }
    msg.textContent = 'Carregando...';
    const asked = turma;
    try {
      if (p) { try { await sync(p); } catch (e) { /* mostra a lista mesmo assim */ } }
      const rows = await list(asked);
      if (asked !== turma) return;                       // a criança já trocou de turma
      if (!rows.length) { msg.textContent = `Ninguém da turma ${asked} correu ainda. Seja o primeiro!`; return; }
      const mine = p && p.turma === asked ? rows.findIndex((r) => same(r.nome, p.nome)) : -1;
      msg.textContent = mine >= 0 ? `Você está em ${mine + 1}º lugar de ${rows.length}.` : `${rows.length} ${rows.length === 1 ? 'piloto' : 'pilotos'} na turma ${asked}.`;
      // com 3 ou mais pilotos, os três primeiros sobem ao pódio (2º, 1º, 3º) e a lista começa no 4º
      const top = rows.length >= 3 ? 3 : 0;
      [1, 0, 2].slice(0, top).forEach((i) => podium.appendChild(step(rows[i], i + 1, i === mine)));
      rows.forEach((r, i) => { if (i >= top) box.appendChild(row(r, i + 1, i === mine)); });
      const el = box.querySelector('.me');
      if (el) el.scrollIntoView({ block: 'center' });
    } catch (e) {
      if (asked === turma) msg.textContent = 'Não foi possível carregar o ranking. Confira a internet e tente de novo.';
    }
  }

  function open() {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    screen.classList.add('active');
    const p = profile();
    if (p) turma = p.turma;
    load();
  }
  function exit() {
    screen.classList.remove('active');
    $('title-screen').classList.add('active');
  }

  // ---------- Cartão "Quem é você?" ----------
  function askProfile(callback) {
    afterProfile = callback || null;
    const p = profile();
    $('player-name').value = p ? p.nome : '';
    pickTurma = p ? p.turma : '';
    $('player-error').textContent = '';
    paintTurma();
    $('profile-overlay').classList.add('show');
  }
  function paintTurma() {
    document.querySelectorAll('#player-turmas button').forEach((b) => b.classList.toggle('on', b.dataset.turma === pickTurma));
  }
  function closeProfile() {
    $('profile-overlay').classList.remove('show');
    $('player-name').blur();
    const cb = afterProfile; afterProfile = null;
    if (cb) cb();
  }
  // Antes da corrida: pergunta o nome uma vez (dá para pular)
  function ensureProfile(callback) {
    let skipped = false;
    try { skipped = sessionStorage.getItem('tr-skip-name') === '1'; } catch (e) { /* sem storage */ }
    if (!ready() || profile() || skipped) { callback(); return; }
    askProfile(callback);
  }

  $('player-save').addEventListener('click', () => {
    const nome = tidy($('player-name').value);
    if (nome.length < 3 || nome.split(' ').length < 2) { $('player-error').textContent = 'Escreva seu nome e sobrenome.'; return; }
    if (nome.length > 40) { $('player-error').textContent = 'O nome pode ter até 40 letras.'; return; }
    if (!pickTurma) { $('player-error').textContent = 'Escolha a sua turma.'; return; }
    saveProfile({ nome: capitalize(nome), turma: pickTurma });
    Sound.correct();
    if (screen.classList.contains('active')) { turma = pickTurma; load(); }
    closeProfile();
  });
  $('player-skip').addEventListener('click', () => {
    try { sessionStorage.setItem('tr-skip-name', '1'); } catch (e) { /* sem storage */ }
    Sound.click();
    closeProfile();
  });
  $('player-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('player-save').click(); });
  document.querySelectorAll('#player-turmas button').forEach((b) => b.addEventListener('click', () => { pickTurma = b.dataset.turma; $('player-error').textContent = ''; Sound.click(); paintTurma(); }));
  document.querySelectorAll('#rank-tabs button').forEach((b) => b.addEventListener('click', () => { turma = b.dataset.turma; Sound.click(); load(); }));
  $('rank-back').addEventListener('click', () => { Sound.click(); exit(); });
  $('rank-me').addEventListener('click', () => { Sound.click(); askProfile(); });

  // ---------- Fim da corrida: envia a pontuação e mostra o pódio da turma ----------
  async function afterRace(pontos, voltas, box) {
    box.innerHTML = '';
    const p = profile();
    if (!ready() || !p) return;
    const note = document.createElement('p');
    note.className = 'over-rank-note';
    note.textContent = 'Enviando para o ranking...';
    box.appendChild(note);
    try {
      let sent = true;
      try { await sync(p, pontos, voltas); } catch (e) { sent = false; }
      const rows = await list(p.turma);
      if (!box.contains(note)) return;                   // a criança já saiu deste cartão
      const mine = rows.findIndex((r) => same(r.nome, p.nome));
      note.textContent = mine >= 0 ? `Ranking da turma ${p.turma}: você está em ${mine + 1}º lugar!` : `Ranking da turma ${p.turma}`;
      const ol = document.createElement('ol');
      ol.className = 'rank-list small';
      rows.slice(0, 5).forEach((r, i) => ol.appendChild(row(r, i + 1, i === mine)));
      if (mine >= 5) ol.appendChild(row(rows[mine], mine + 1, true));
      box.appendChild(ol);
      if (!sent) note.textContent = 'Não foi possível enviar sua pontuação agora. Ela ficou salva neste aparelho e será enviada na próxima vez.';
    } catch (e) {
      note.textContent = 'Sem conexão com o ranking. Sua pontuação ficou salva neste aparelho e será enviada na próxima vez.';
    }
  }

  return { open, exit, ensureProfile, afterRace, profile, ready };
})();
