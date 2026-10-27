/* Hero Motocity — secuencia de entrega.
   Una sola línea de tiempo continua: el video termina, la línea sale hacia la tarjeta, la tarjeta
   aparece justo cuando la línea llega, la línea sigue hasta el monitor y el estado pasa a
   «Finalizado» en el mismo instante en que la punta toca la pantalla. */
(() => {
  const root = document.getElementById('mc-video-hero');
  if (!root) return;
  const $ = s => root.querySelector(s);
  const hero = $('.hero'), scene = $('.scene'), delivery = $('.delivery'), status = $('.status'),
        office = $('.office'), svg = $('.wires'), video = $('video'), clock = $('time'),
        first = $('.one'), second = $('.two'), start = $('.start'), finish = $('.finish'),
        badge = $('.platform-badge');

  const NS = 'http://www.w3.org/2000/svg';
  const mk = cls => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('class', cls); c.setAttribute('r', cls === 'head' ? 5.5 : 5); return c; };
  const ring = mk('ring'), head = mk('head');
  svg.append(ring, head);

  /* Checks de las filas ya finalizadas (#1038, #1040, #1041), sobre la foto de la plataforma.
     Posiciones en % de la foto (1794x877); van de abajo hacia arriba y la fila #1042 cierra. */
  const rowTicks = [[56.0, 57.1], [55.2, 40.1], [54.9, 31.8]].map(([x, y]) => {
    const t = document.createElement('span');
    t.className = 'row-tick'; t.setAttribute('aria-hidden', 'true'); t.textContent = '✓';
    t.style.left = x + '%'; t.style.top = y + '%';
    office.appendChild(t);
    return t;
  });
  let screenTimers = [];

  /* Botón «Ver de nuevo»: la secuencia se ve una sola vez; al terminar aparece este botón en la
     esquina del video y reproduce la secuencia completa otra vez cuando el visitante lo pide. */
  const replayBtn = document.createElement('button');
  replayBtn.type = 'button';
  replayBtn.className = 'replay-btn';
  replayBtn.setAttribute('aria-label', 'Ver la animación de nuevo');
  replayBtn.title = 'Ver de nuevo';
  replayBtn.innerHTML = '<span aria-hidden="true">↻</span>';
  delivery.appendChild(replayBtn);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reloj de la tarjeta: fecha y hora local del visitante */
  function tick() {
    const d = new Date();
    clock.dateTime = d.toISOString();
    clock.textContent = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('-', '/') +
      ' · ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  tick();
  setInterval(tick, 10000);

  /* Parámetros de la animación */
  const SPEED = 430;          // px por segundo: misma velocidad en ambos tramos
  const MIN_SEG = 0.55;       // duración mínima de un tramo (s)
  const CARD_LEAD = 0.12;     // la tarjeta aparece un instante antes de que la línea llegue
  const GAP = 0.05;           // pausa entre llegar a la tarjeta y salir de ella
  const SCREEN_DELAY = 550;   // ms entre que la línea toca el monitor y empieza el cambio en pantalla
  const ROW_STEP = 170;       // ms entre cada check (de abajo hacia arriba)
  const EARLY = 0.3;          // la línea parte este tiempo antes de que termine el video (s)
  const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);   // easeInOutSine
  const clamp = t => Math.min(1, Math.max(0, t));

  let len1 = 1, len2 = 1, state = 'idle', raf = 0, t0 = 0;

  /* Tramo con esquinas redondeadas: horizontal – vertical – horizontal */
  function route(x1, y1, x2, y2, mx) {
    const dy = y2 - y1, s = Math.sign(dy);
    const r = Math.min(16, Math.abs(dy) / 2, Math.abs(mx - x1) / 2, Math.abs(x2 - mx) / 2);
    if (r < 1) return `M${x1} ${y1} H${mx} V${y2} H${x2}`;
    return `M${x1} ${y1} H${mx - r} Q${mx} ${y1} ${mx} ${y1 + s * r} V${y2 - s * r} Q${mx} ${y2} ${mx + r} ${y2} H${x2}`;
  }

  function draw() {
    const w = scene.clientWidth, h = scene.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const sx = delivery.offsetLeft + delivery.offsetWidth,
          sy = delivery.offsetTop + delivery.offsetHeight * .3;
    /* La tarjeta se centra a la altura de salida de la línea: el primer tramo sale recto, sin escalón */
    status.style.top = Math.round(sy - status.offsetHeight / 2) + 'px';
    const tx = status.offsetLeft,
          ty = status.offsetTop + status.offsetHeight * .5;
    first.setAttribute('d', route(sx, sy, tx, ty, (sx + tx) / 2));

    const ax = status.offsetLeft + status.offsetWidth * .5,
          ay = status.offsetTop + status.offsetHeight,
          ex = office.offsetLeft + office.offsetWidth * .353,
          ey = office.offsetTop,
          mid = (ay + ey) / 2,
          r = Math.min(16, (ey - ay) / 6, (ax - ex) / 5);
    second.setAttribute('d', `M${ax} ${ay} V${mid - r} Q${ax} ${mid} ${ax - r} ${mid} H${ex + r} Q${ex} ${mid} ${ex} ${mid + r} V${ey}`);

    len1 = first.getTotalLength() || 1;
    len2 = second.getTotalLength() || 1;
    start.setAttribute('cx', sx); start.setAttribute('cy', sy);
    finish.setAttribute('cx', ex); finish.setAttribute('cy', ey);
    ring.setAttribute('cx', ex); ring.setAttribute('cy', ey);
    if (state === 'done') setProgress(1, 1);
  }
  new ResizeObserver(draw).observe(scene);

  function setProgress(p1, p2) {
    first.style.strokeDashoffset = 1 - p1;
    first.style.opacity = p1 > 0 ? 1 : 0;       // evita el punto que deja el trazo redondeado en reposo
    second.style.strokeDashoffset = 1 - p2;
    second.style.opacity = p2 > 0 ? 1 : 0;
  }

  function placeHead(path, len, p) {
    const pt = path.getPointAtLength(len * p);
    head.setAttribute('cx', pt.x);
    head.setAttribute('cy', pt.y);
    head.style.opacity = 1;
  }

  function arrive() {
    state = 'done';
    setProgress(1, 1);
    head.style.opacity = 0;
    hero.classList.add('show-card');
    finish.classList.add('on');
    ring.classList.remove('pulse'); void ring.getBoundingClientRect(); ring.classList.add('pulse');
    rowTicks.forEach((t, i) => screenTimers.push(setTimeout(() => t.classList.add('on'), SCREEN_DELAY + i * ROW_STEP)));
    screenTimers.push(setTimeout(() => {
      badge.textContent = 'Finalizado';
      hero.classList.add('finalized');
      if (!reduced) replayBtn.classList.add('show');
    }, SCREEN_DELAY + rowTicks.length * ROW_STEP));
  }

  function frame(now) {
    const t = (now - t0) / 1000;
    const d1 = Math.max(MIN_SEG, len1 / SPEED), d2 = Math.max(MIN_SEG, len2 / SPEED);
    const t2start = d1 + GAP, end = t2start + d2;

    const p1 = ease(clamp(t / d1)), p2 = ease(clamp((t - t2start) / d2));
    setProgress(p1, p2);

    if (t >= d1 - CARD_LEAD) hero.classList.add('show-card');

    if (p2 > 0 && p2 < 1) placeHead(second, len2, p2);
    else if (p1 > 0 && p1 < 1) placeHead(first, len1, p1);
    else head.style.opacity = 0;

    if (t >= end) { arrive(); return; }
    raf = requestAnimationFrame(frame);
  }

  function begin() {
    if (state !== 'idle') return;
    state = 'run';
    draw();
    start.classList.add('on');
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function reset() {
    cancelAnimationFrame(raf);
    screenTimers.forEach(clearTimeout); screenTimers = [];
    replayBtn.classList.remove('show');
    rowTicks.forEach(t => t.classList.remove('on'));
    state = 'idle';
    hero.classList.remove('show-card', 'finalized');
    start.classList.remove('on'); finish.classList.remove('on'); ring.classList.remove('pulse');
    head.style.opacity = 0;
    setProgress(0, 0);
    badge.textContent = 'En progreso';
  }

  function showFinal() {
    draw();
    start.classList.add('on');
    hero.classList.add('show-card');
    finish.classList.add('on');
    rowTicks.forEach(t => t.classList.add('on'));
    badge.textContent = 'Finalizado';
    hero.classList.add('finalized');
    state = 'done';
    setProgress(1, 1);
  }

  async function play() {
    reset();
    video.pause();
    video.currentTime = 0;
    draw();
    if (reduced) { showFinal(); return; }
    try { await video.play(); } catch (e) { begin(); }
  }

  /* La línea parte un poco antes del final del video para que se sienta continua con la entrega */
  video.addEventListener('timeupdate', () => {
    if (state === 'idle' && video.duration && video.duration - video.currentTime <= EARLY) begin();
  });
  video.addEventListener('ended', begin);
  video.addEventListener('error', () => { if (state === 'idle') begin(); });

  replayBtn.addEventListener('click', play);
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting)) { play(); obs.disconnect(); }
  }, { threshold: .25 }).observe(hero);

  setProgress(0, 0);
  draw();
})();
