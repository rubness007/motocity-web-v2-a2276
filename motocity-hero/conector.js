/* Línea azul que une el hero con la palabra «SERVICIOS».
   Sale desde debajo de la foto de la plataforma (donde termina la animación del hero), baja por el
   espacio entre secciones, gira hacia el bloque de servicios y llega al rótulo. Se dibuja con el
   scroll; al llegar, el punto pulsa y el rótulo reacciona. */
(() => {
  const hero = document.querySelector('#mc-video-hero');
  const scene = hero && hero.querySelector('.scene');
  const office = hero && hero.querySelector('.office');
  const target = document.querySelector('#mc-services-concept .eyebrow');
  const block = document.getElementById('mc-services-concept');
  if (!scene || !office || !target || !block) return;

  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); return e; };
  const svg = mk('svg', 'mc-link'); svg.setAttribute('aria-hidden', 'true');
  const path = mk('path', 'mc-link-line');
  const startDot = mk('circle', 'mc-link-dot'); startDot.setAttribute('r', 4);
  const endDot = mk('circle', 'mc-link-dot'); endDot.setAttribute('r', 5);
  const ring = mk('circle', 'mc-link-ring'); ring.setAttribute('r', 5);
  const head = mk('circle', 'mc-link-head'); head.setAttribute('r', 5.5);
  svg.append(path, startDot, endDot, ring, head);
  document.body.appendChild(svg);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = t => Math.min(1, Math.max(0, t));
  let len = 1, y0 = 0, y1 = 0, hit = false, ticking = false;

  function layout() {
    const sy = scrollY;
    const s = scene.getBoundingClientRect(), o = office.getBoundingClientRect(),
          b = block.getBoundingClientRect(), t = target.getBoundingClientRect();
    const narrow = innerWidth < 860;
    const xe = Math.round(t.left - (narrow ? 12 : 16));
    const ye = Math.round(t.top + sy + t.height / 2);
    const ys = Math.round(s.bottom + sy);
    const xs = narrow ? xe : Math.round(o.left + o.width * .353);
    const yTop = Math.round(b.top + sy);
    const mid = Math.round(ys + (yTop - ys) / 2);
    const r = Math.min(16, Math.abs(xe - xs) / 2, (mid - ys) / 2);
    const dir = Math.sign(xe - xs);
    let d;
    if (Math.abs(xe - xs) < 2 || r < 1) d = `M${xe} ${ys} V${ye}`;
    else d = `M${xs} ${ys} V${mid - r} Q${xs} ${mid} ${xs + dir * r} ${mid} H${xe - dir * r} Q${xe} ${mid} ${xe} ${mid + r} V${ye}`;
    svg.style.height = document.documentElement.scrollHeight + 'px';
    path.setAttribute('d', d);
    len = path.getTotalLength() || 1;
    path.style.strokeDasharray = len;
    startDot.setAttribute('cx', xs); startDot.setAttribute('cy', ys);
    endDot.setAttribute('cx', xe); endDot.setAttribute('cy', ye);
    ring.setAttribute('cx', xe); ring.setAttribute('cy', ye);
    y0 = ys; y1 = ye;
    update();
  }

  function update() {
    ticking = false;
    const p = reduced ? 1 : clamp((scrollY + innerHeight * .72 - y0) / Math.max(1, y1 - y0));
    path.style.strokeDashoffset = len * (1 - p);
    path.style.opacity = p > 0 ? 1 : 0;
    startDot.classList.toggle('on', p > 0);
    const arrived = p >= 0.999;
    endDot.classList.toggle('on', arrived);
    if (p > 0 && p < 0.999) {
      const pt = path.getPointAtLength(len * p);
      head.setAttribute('cx', pt.x); head.setAttribute('cy', pt.y); head.style.opacity = 1;
    } else head.style.opacity = 0;
    if (arrived && !hit) {
      hit = true;
      if (!reduced) {
        ring.classList.remove('pulse'); void ring.getBoundingClientRect(); ring.classList.add('pulse');
        target.classList.remove('mc-hit'); void target.offsetWidth; target.classList.add('mc-hit');
      }
    } else if (!arrived) hit = false;
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  new ResizeObserver(layout).observe(document.body);
  layout();
})();
