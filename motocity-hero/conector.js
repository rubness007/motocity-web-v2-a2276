/* Línea azul tipo «mapa de metro» que recorre la home con el scroll.
   Sale desde debajo de la foto del hero, baja por el margen izquierdo y, en cada bloque
   (Servicios, Clientes, Nuestra gente), una derivación entra hasta el rótulo y deja un nodo que
   pulsa al llegar. En pantallas angostas no hay margen libre: la línea baja por el relleno de
   las tarjetas y los nodos quedan sobre ella.
   Al cruzar la franja de logos de clientes la línea pasa «bajo nivel»: se oculta bajo la franja
   (un túnel con boca de entrada y de salida) para no tapar ningún logo. */
(() => {
  const hero = document.querySelector('#mc-video-hero');
  const scene = hero && hero.querySelector('.scene');
  const office = hero && hero.querySelector('.office');
  const block = document.getElementById('mc-services-concept');
  const targets = [
    document.querySelector('#mc-services-concept .eyebrow'),
    document.querySelector('.mc-clients-eyebrow'),
    document.querySelector('#mc-people-accordion .eyebrow'),
  ].filter(Boolean);
  if (!scene || !office || !block || !targets.length) return;

  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls, r) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); if (r) e.setAttribute('r', r); return e; };
  const svg = mk('svg', 'mc-link'); svg.setAttribute('aria-hidden', 'true');
  const path = mk('path', 'mc-link-line');
  const startDot = mk('circle', 'mc-link-dot', 4);
  const head = mk('circle', 'mc-link-head', 5.5);
  const band = document.querySelector('.clients-section .clients-marquee');
  const defs = mk('defs'), mask = mk('mask');
  mask.setAttribute('id', 'mcLinkMask'); mask.setAttribute('maskUnits', 'userSpaceOnUse');
  const mWhite = mk('rect'), mHole = mk('rect');
  mWhite.setAttribute('fill', '#fff'); mHole.setAttribute('fill', '#000');
  mask.append(mWhite, mHole); defs.append(mask); svg.append(defs);
  path.setAttribute('mask', 'url(#mcLinkMask)'); head.setAttribute('mask', 'url(#mcLinkMask)');
  const mouths = [mk('path', 'mc-link-mouth'), mk('path', 'mc-link-mouth')];
  svg.append(path);
  const nodes = targets.map(el => {
    const branch = mk('path', 'mc-link-line mc-link-branch');
    const dot = mk('circle', 'mc-link-dot', 5);
    const ring = mk('circle', 'mc-link-ring', 5);
    svg.append(branch, dot, ring);
    return { el, branch, dot, ring, bLen: 0, dx: 0, dy: 0, on: false, timer: 0 };
  });
  svg.append(startDot, head, ...mouths);
  document.body.appendChild(svg);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = t => Math.min(1, Math.max(0, t));
  let len = 1, y0 = 0, y1 = 0, ticking = false, tunnel = null;

  function layout() {
    const sy = scrollY;
    const s = scene.getBoundingClientRect(), o = office.getBoundingClientRect(), b = block.getBoundingClientRect();
    const rects = nodes.map(n => n.el.getBoundingClientRect());
    const gutter = b.left >= 36;
    const spineX = Math.round(gutter ? b.left - 14 : rects[0].left - 12);
    nodes.forEach((n, i) => {
      n.dx = gutter ? Math.round(rects[i].left - 16) : spineX;
      n.dy = Math.round(rects[i].top + sy + rects[i].height / 2);
    });
    const xs = Math.round(o.left + o.width * .353), ys = Math.round(s.bottom + sy);
    const yTop = Math.round(b.top + sy), mid = Math.round(ys + (yTop - ys) / 2);
    const yEnd = nodes[nodes.length - 1].dy;
    const dir = Math.sign(spineX - xs);
    const r = Math.min(16, Math.abs(spineX - xs) / 2, (mid - ys) / 2);
    const d = (Math.abs(spineX - xs) < 2 || r < 1)
      ? `M${spineX} ${ys} V${yEnd}`
      : `M${xs} ${ys} V${mid - r} Q${xs} ${mid} ${xs + dir * r} ${mid} H${spineX - dir * r} Q${spineX} ${mid} ${spineX} ${mid + r} V${yEnd}`;
    const docH = document.documentElement.scrollHeight;
    svg.style.height = docH + 'px';
    tunnel = null;
    if (band) {
      const br = band.getBoundingClientRect();
      tunnel = { top: Math.round(br.top + sy), bottom: Math.round(br.bottom + sy) };
      mask.setAttribute('x', 0); mask.setAttribute('y', 0); mask.setAttribute('width', innerWidth); mask.setAttribute('height', docH);
      mWhite.setAttribute('x', 0); mWhite.setAttribute('y', 0); mWhite.setAttribute('width', innerWidth); mWhite.setAttribute('height', docH);
      mHole.setAttribute('x', 0); mHole.setAttribute('y', tunnel.top); mHole.setAttribute('width', innerWidth); mHole.setAttribute('height', tunnel.bottom - tunnel.top);
      mouths[0].setAttribute('d', `M${spineX - 9} ${tunnel.top} H${spineX + 9}`);
      mouths[1].setAttribute('d', `M${spineX - 9} ${tunnel.bottom} H${spineX + 9}`);
    }
    path.setAttribute('d', d);
    len = path.getTotalLength() || 1;
    path.style.strokeDasharray = len;
    startDot.setAttribute('cx', xs); startDot.setAttribute('cy', ys);
    nodes.forEach(n => {
      const stub = Math.abs(n.dx - spineX);
      n.branch.setAttribute('d', `M${spineX} ${n.dy} H${n.dx}`);
      n.bLen = stub || 1;
      n.branch.style.strokeDasharray = n.bLen;
      n.branch.style.strokeDashoffset = n.on ? 0 : n.bLen;
      n.branch.style.display = stub < 2 ? 'none' : '';
      n.dot.setAttribute('cx', n.dx); n.dot.setAttribute('cy', n.dy);
      n.ring.setAttribute('cx', n.dx); n.ring.setAttribute('cy', n.dy);
    });
    y0 = ys; y1 = yEnd;
    update();
  }

  function setNode(n, on, headY) {
    if (on === n.on) return;
    n.on = on;
    clearTimeout(n.timer);
    if (!on) {
      n.branch.style.opacity = 0;
      n.branch.style.strokeDashoffset = n.bLen;
      n.dot.classList.remove('on');
      return;
    }
    n.branch.style.opacity = 1;
    n.branch.style.strokeDashoffset = 0;
    const show = () => {
      n.dot.classList.add('on');
      if (!reduced) {
        n.ring.classList.remove('pulse'); void n.ring.getBoundingClientRect(); n.ring.classList.add('pulse');
        n.el.classList.remove('mc-hit'); void n.el.offsetWidth; n.el.classList.add('mc-hit');
      }
    };
    if (reduced || n.branch.style.display === 'none') show();
    else n.timer = setTimeout(show, 450);
  }

  function update() {
    ticking = false;
    const p = reduced ? 1 : clamp((scrollY + innerHeight * .72 - y0) / Math.max(1, y1 - y0));
    path.style.strokeDashoffset = len * (1 - p);
    path.style.opacity = p > 0 ? 1 : 0;
    startDot.classList.toggle('on', p > 0);
    let headY = y0;
    if (p > 0 && p < 0.999) {
      const pt = path.getPointAtLength(len * p);
      head.setAttribute('cx', pt.x); head.setAttribute('cy', pt.y); head.style.opacity = 1;
      headY = pt.y;
    } else { head.style.opacity = 0; if (p >= 0.999) headY = y1; }
    nodes.forEach(n => setNode(n, p > 0 && headY >= n.dy - 2, headY));
    if (tunnel) {
      mouths[0].classList.toggle('on', p > 0 && headY >= tunnel.top);
      mouths[1].classList.toggle('on', p > 0 && headY >= tunnel.bottom);
    }
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  new ResizeObserver(layout).observe(document.body);
  layout();
})();
