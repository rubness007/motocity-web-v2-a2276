/* Nuestra gente — video 360° controlado por el scroll.
   El motorista gira con el scroll (una vuelta mientras el bloque cruza la pantalla) y también
   se puede girar arrastrando. El botón «Ver de nuevo» reproduce la vuelta completa a velocidad
   normal y después se vuelve al control por scroll. El video se carga cuando el bloque se acerca. */
(() => {
  'use strict';
  const root = document.getElementById('mc-people-accordion');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';

  const video = root.querySelector('video');
  const panel = root.querySelector('.video-panel');
  const replay = root.querySelector('.pause');
  const groups = Array.from(root.querySelectorAll('details'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Acordeón: solo un grupo abierto a la vez */
  groups.forEach(group => group.addEventListener('toggle', () => {
    if (group.open) groups.forEach(other => {
      if (other !== group && other.open) other.open = false;
    });
  }));

  let duration = 0;
  let dragOffset = 0;      // segundos que el visitante giró arrastrando (se acumula)
  let shown = 0;           // posición suavizada que se muestra
  let mode = 'scrub';      // 'scrub' (scroll/arrastre) | 'play' (vuelta completa automática)
  let dragging = false;
  let visible = false;
  let raf = 0;
  let loaded = false;

  const clamp = t => Math.min(1, Math.max(0, t));
  const wrap = t => duration ? ((t % duration) + duration) % duration : 0;
  const shortest = d => duration ? d - duration * Math.round(d / duration) : 0;   // camino más corto en el círculo

  function scrollTarget() {
    if (reducedMotion.matches) return 0;
    const r = panel.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh * 0.9, end = vh * 0.15;        // 0 cuando el panel entra, 1 cuando sale por arriba
    const p = clamp((start - r.top) / (start - end + r.height));
    return p * (duration - 0.04);
  }

  function tick() {
    raf = 0;
    if (!visible || !duration) return;
    if (mode === 'scrub') {
      const effective = wrap(scrollTarget() + dragOffset);
      const diff = shortest(effective - shown);
      shown = Math.abs(diff) < 0.004 ? effective : wrap(shown + diff * (dragging ? 0.55 : 0.2));
      if (!video.seeking && Math.abs(video.currentTime - shown) > 0.012) video.currentTime = shown;
    }
    schedule();
  }
  function schedule() { if (!raf && visible) raf = requestAnimationFrame(tick); }

  /* Arrastrar para girar: arrastrar todo el ancho del panel = una vuelta completa */
  panel.addEventListener('pointerdown', e => {
    if (e.target.closest('.video-controls') || !duration || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (mode === 'play') {                               // el visitante toma el control durante la reproducción
      video.pause();
      mode = 'scrub';
      shown = video.currentTime;
      dragOffset = wrap(shown - scrollTarget());
    }
    dragging = true;
    const startX = e.clientX, startOffset = dragOffset, width = panel.getBoundingClientRect().width || 1;
    panel.classList.add('is-dragging');
    try { panel.setPointerCapture(e.pointerId); } catch (_) {}
    const move = ev => {
      dragOffset = startOffset + ((ev.clientX - startX) / width) * duration;
      schedule();
    };
    const up = () => {
      dragging = false;
      panel.classList.remove('is-dragging');
      panel.removeEventListener('pointermove', move);
      panel.removeEventListener('pointerup', up);
      panel.removeEventListener('pointercancel', up);
    };
    panel.addEventListener('pointermove', move);
    panel.addEventListener('pointerup', up);
    panel.addEventListener('pointercancel', up);
  });
  panel.addEventListener('dragstart', e => e.preventDefault());

  /* «Ver de nuevo»: una vuelta completa a velocidad normal; al terminar vuelve el control por scroll */
  function playOnce() {
    if (!duration) return;
    mode = 'play';
    video.currentTime = 0;
    const p = video.play();
    if (p && p.catch) p.catch(() => { mode = 'scrub'; schedule(); });
  }
  replay.addEventListener('click', playOnce);
  video.addEventListener('ended', () => {
    if (mode !== 'play') return;
    mode = 'scrub';
    shown = 0;
    video.currentTime = 0;                               // la vuelta cierra en la misma posición que empieza
    dragOffset = wrap(0 - scrollTarget());
    schedule();
  });

  function ready() {
    duration = video.duration || 0;
    if (!duration) return;
    shown = wrap(scrollTarget() + dragOffset);
    video.currentTime = shown;
    schedule();
  }
  video.addEventListener('loadedmetadata', ready);
  if (video.readyState >= 1) ready();

  /* El video se descarga cuando el bloque se acerca a la pantalla; el scroll solo corre mientras es visible */
  function load() {
    if (loaded) return;
    loaded = true;
    video.preload = 'auto';
    video.load();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) load();
      });
    }, { rootMargin: '900px 0px' }).observe(panel);
    new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) schedule();
      else if (mode === 'play') video.pause();
    }, { threshold: 0 }).observe(panel);
  } else {
    visible = true;
    load();
    schedule();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') video.pause(); });

  replay.hidden = false;                                  // el botón siempre está disponible
})();
