(function(){
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ links.classList.remove('open'); });
    });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.rv');
  if('IntersectionObserver' in window && !reduced && els.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('on'); });
  }

  initMotocityHeroZoom(reduced);
  initTramitesGauge(reduced);
  initClientLogosGuard();
  initTecnologiaMoto(reduced);
  initMotoIconGuard();
  initTramitesAccordion();
  initSideDrawers();
  initRevealText(reduced);
  initCounters(reduced);
  initBackToTop();
  initRetroGame();
})();

function initRetroGame(){
  var openBtn = document.getElementById('openRetroGame');
  var closeBtn = document.getElementById('retroGameClose');
  var overlay = document.getElementById('retroGameOverlay');
  var canvas = document.getElementById('retroGameCanvas');
  if(!openBtn || !overlay || !canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;

  var LANES = [W*0.28, W*0.5, W*0.72];
  var laneIndex = 1;
  var player = { w: 30, h: 46 };
  var traffic = [];
  var roadOffset = 0;
  var speed = 4.2;
  var score = 0;
  var running = false;
  var gameOver = false;
  var rafId = null;
  var spawnTimer = 0;
  var spawnEvery = 70;

  function reset(){
    laneIndex = 1;
    traffic = [];
    roadOffset = 0;
    speed = 4.2;
    score = 0;
    gameOver = false;
    spawnTimer = 0;
    spawnEvery = 70;
  }

  function spawnTraffic(){
    var lane = Math.floor(Math.random()*3);
    var palette = ['#ff2ea6','#8fe8ff','#ffd23f','#7cffb2'];
    traffic.push({ lane: lane, y: -80, w: 30, h: 46, color: palette[Math.floor(Math.random()*palette.length)] });
  }

  function drawBike(x, y, color){
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillRect(-player.w/2, -player.h/2, player.w, player.h*0.62);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-player.w/2+4, -player.h/2+player.h*0.62, player.w-8, player.h*0.14);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-player.w/2+5, player.h/2-4, 5, 0, Math.PI*2);
    ctx.arc(player.w/2-5, player.h/2-4, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayerBike(x, y){
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#4aa3ff';
    ctx.fillRect(-player.w/2, -player.h/2 + 6, player.w, player.h*0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-player.w/2+4, -player.h/2+player.h*0.62, player.w-8, player.h*0.14);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-player.w/2+5, player.h/2-4, 5, 0, Math.PI*2);
    ctx.arc(player.w/2-5, player.h/2-4, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -player.h/2 + 2, 9, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(11,14,26,0.85)';
    ctx.fillRect(-6, -player.h/2 - 1, 12, 6);
    ctx.restore();
  }

  function draw(){
    ctx.fillStyle = '#0b0e1a';
    ctx.fillRect(0,0,W,H);

    var grad = ctx.createLinearGradient(0,0,0,H*0.45);
    grad.addColorStop(0,'#2a0f4a');
    grad.addColorStop(1,'#0b0e1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H*0.45);
    ctx.fillStyle = 'rgba(255,180,60,0.85)';
    ctx.beginPath();
    ctx.arc(W/2, H*0.18, 34, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#141a2e';
    ctx.fillRect(0, H*0.42, W, H*0.58);

    ctx.strokeStyle = 'rgba(143,232,255,0.55)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18,16]);
    [W*0.39, W*0.61].forEach(function(x){
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x, H*0.42);
      ctx.lineDashOffset = -roadOffset;
      ctx.stroke();
    });
    ctx.setLineDash([]);

    traffic.forEach(function(t){ drawBike(LANES[t.lane], t.y, t.color); });
    if(!gameOver) drawPlayerBike(LANES[laneIndex], H-70);

    ctx.fillStyle = '#8fe8ff';
    ctx.font = '700 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + Math.floor(score), 12, 24);

    if(gameOver){
      ctx.fillStyle = 'rgba(6,8,16,0.72)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#ff2ea6';
      ctx.font = '800 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W/2, H/2 - 10);
      ctx.fillStyle = '#fff';
      ctx.font = '600 14px monospace';
      ctx.fillText('Toca o presiona una tecla para reintentar', W/2, H/2 + 20);
      ctx.textAlign = 'left';
    }
  }

  function step(){
    if(running && !gameOver){
      roadOffset += speed;
      speed += 0.0025;
      spawnTimer++;
      if(spawnTimer > spawnEvery){
        spawnTimer = 0;
        spawnEvery = Math.max(34, spawnEvery - 1.2);
        spawnTraffic();
      }
      traffic.forEach(function(t){ t.y += speed; });
      traffic = traffic.filter(function(t){ return t.y < H + 80; });

      var pY = H-70;
      traffic.forEach(function(t){
        if(t.lane === laneIndex && Math.abs(t.y - pY) < (t.h*0.55 + player.h*0.55)){
          gameOver = true;
          running = false;
        }
      });
      score += speed*0.12;
    }
    draw();
    rafId = requestAnimationFrame(step);
  }

  function start(){
    reset();
    running = true;
    if(!rafId) rafId = requestAnimationFrame(step);
  }

  function handlePrimary(){
    if(!overlay.classList.contains('is-open')) return;
    if(gameOver || !running){ start(); return; }
  }

  function moveLeft(){ if(running && !gameOver) laneIndex = Math.max(0, laneIndex-1); }
  function moveRight(){ if(running && !gameOver) laneIndex = Math.min(2, laneIndex+1); }

  document.addEventListener('keydown', function(e){
    if(!overlay.classList.contains('is-open')) return;
    if(e.code === 'ArrowLeft'){ moveLeft(); }
    else if(e.code === 'ArrowRight'){ moveRight(); }
    else if(e.code === 'Space' || e.code === 'Enter'){ handlePrimary(); }
  });

  var touchStartX = null;
  canvas.addEventListener('touchstart', function(e){
    touchStartX = e.touches[0].clientX;
    if(gameOver || !running) handlePrimary();
  });
  canvas.addEventListener('touchend', function(e){
    if(touchStartX === null) return;
    var dx = (e.changedTouches[0].clientX - touchStartX);
    if(Math.abs(dx) > 24){ dx > 0 ? moveRight() : moveLeft(); }
    touchStartX = null;
  });
  canvas.addEventListener('click', function(){
    if(gameOver || !running) handlePrimary();
  });

  function openGame(){
    overlay.classList.add('is-open');
    start();
  }
  function closeGame(){
    overlay.classList.remove('is-open');
    running = false;
  }

  openBtn.addEventListener('click', openGame);
  if(closeBtn) closeBtn.addEventListener('click', closeGame);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) closeGame(); });
  document.addEventListener('keydown', function(e){
    if(e.code === 'Escape' && overlay.classList.contains('is-open')) closeGame();
  });

  draw();
}

function initBackToTop(){
  var btn = document.getElementById('backToTop');
  var footer = document.querySelector('.site-footer');
  if(!btn || !footer) return;
  btn.addEventListener('click', function(){
    window.scrollTo({top:0, behavior:'smooth'});
  });
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        btn.classList.toggle('is-visible', e.isIntersecting);
      });
    }, {threshold:0});
    io.observe(footer);
  } else {
    btn.classList.add('is-visible');
  }
}

/* Word-by-word "light up" reveal for the Quiénes somos copy — words start dim and brighten in
   sequence as the block scrolls through the viewport, tracking scroll position (scrub) rather
   than firing once, so reading pace and reveal pace stay in sync. Splits each <p> into
   <span class="rt-word"> once at init; base dim opacity comes from the .rt-word CSS rule, this
   just drives it toward 1 per word as self.progress advances. */
function wrapWordsPreservingTags(node, allWords){
  Array.prototype.slice.call(node.childNodes).forEach(function(child){
    if(child.nodeType === 3){
      var parts = child.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function(part){
        if(part === '') return;
        if(/^\s+$/.test(part)){
          frag.appendChild(document.createTextNode(part));
        } else {
          var span = document.createElement('span');
          span.className = 'rt-word';
          span.textContent = part;
          frag.appendChild(span);
          allWords.push(span);
        }
      });
      node.replaceChild(frag, child);
    } else if(child.nodeType === 1){
      wrapWordsPreservingTags(child, allWords);
    }
  });
}

function initRevealText(reduced){
  var containers = document.querySelectorAll('.reveal-copy');
  if(!containers.length) return;
  if(window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  containers.forEach(function(container){
    var paragraphs = container.querySelectorAll('p');
    var allWords = [];
    paragraphs.forEach(function(p){
      wrapWordsPreservingTags(p, allWords);
    });
    if(reduced || !window.gsap || !window.ScrollTrigger || !allWords.length){
      allWords.forEach(function(w){ w.style.opacity = 1; });
      return;
    }
    var N = allWords.length;
    var BAND = Math.max(3, Math.round(N / 8)); // how many words are mid-transition at once
    ScrollTrigger.create({
      trigger: container,
      start: 'top 80%',
      end: 'bottom 55%',
      scrub: true,
      onUpdate: function(self){
        var cursor = self.progress * N;
        allWords.forEach(function(w, i){
          var t = (cursor - i) / BAND + 0.5;
          t = Math.max(0, Math.min(1, t));
          w.style.opacity = (0.25 + t * 0.75).toFixed(2);
        });
      }
    });
  });
}

/* Counts the "+12 AÑOS" stamp up from 0 the first time it scrolls into view (not scrubbed —
   this one only needs to play once, like a odometer tick, not track scroll position). */
function initCounters(reduced){
  var counters = document.querySelectorAll('[data-counter-to]');
  if(!counters.length) return;
  counters.forEach(function(el){
    var target = parseInt(el.getAttribute('data-counter-to'), 10) || 0;
    if(reduced || !window.gsap || !window.ScrollTrigger){
      el.textContent = '+' + target;
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: function(){
        var obj = { val: 0 };
        gsap.to(obj, {
          val: target, duration: 3.2, ease: 'power1.out',
          onUpdate: function(){ el.textContent = '+' + Math.round(obj.val); }
        });
      }
    });
  });
}

/* Seguro / Reclutamiento side drawers — opened via [data-drawer-open="<id>"] buttons, closed via
   the shared overlay, any element with [data-drawer-close], or Escape. Only one drawer opens at
   a time (opening a second one while one is open just closes the first first). */
function initSideDrawers(){
  var overlay = document.getElementById('drawerOverlay');
  if(!overlay) return;
  var openTriggers = document.querySelectorAll('[data-drawer-open]');
  var closeTriggers = document.querySelectorAll('[data-drawer-close]');
  var current = null;

  function closeDrawer(){
    if(!current) return;
    current.classList.remove('is-open');
    current.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    current = null;
  }

  function openDrawer(id){
    var drawer = document.getElementById(id);
    if(!drawer) return;
    if(current && current !== drawer) closeDrawer();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    current = drawer;
  }

  openTriggers.forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      openDrawer(btn.getAttribute('data-drawer-open'));
    });
  });
  closeTriggers.forEach(function(el){
    el.addEventListener('click', closeDrawer);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeDrawer();
  });
}

/* Trámites category lists collapse into an accordion on mobile only — the toggle class is
   harmless on desktop/tablet since the CSS that hides/shows content only applies below 560px;
   above that every category just stays visually expanded regardless of this class. */
function initTramitesAccordion(){
  var cats = document.querySelectorAll('.tramites-cat');
  cats.forEach(function(cat){
    var toggle = cat.querySelector('.tramites-cat-toggle');
    if(!toggle) return;
    toggle.addEventListener('click', function(){
      cat.classList.toggle('is-open');
    });
  });
}

/* Small cursor-anchored toast, shared by the right-click guards below (client logos, moto icon). */
function showCursorToast(text, x, y){
  var el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = [
    'position:fixed', 'left:' + x + 'px', 'top:' + y + 'px',
    'transform:translate(-50%,-120%)', 'background:#1a1a1a', 'color:#fff',
    'padding:6px 14px', 'border-radius:8px', 'font-size:13px', 'font-weight:600',
    'z-index:9999', 'pointer-events:none', 'box-shadow:0 4px 14px rgba(0,0,0,0.25)',
    'opacity:0', 'transition:opacity .15s ease, transform .15s ease'
  ].join(';');
  document.body.appendChild(el);
  requestAnimationFrame(function(){
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,-140%)';
  });
  setTimeout(function(){
    el.style.opacity = '0';
    setTimeout(function(){ el.remove(); }, 200);
  }, 900);
}

/* Blocks right-click / long-press "save image" on the client logo marquee — shows a small
   "nop" toast next to the cursor instead of the native context menu. */
function initClientLogosGuard(){
  var marquee = document.querySelector('.clients-marquee');
  if(!marquee) return;
  marquee.addEventListener('contextmenu', function(e){
    if(e.target.tagName !== 'IMG') return;
    e.preventDefault();
    showCursorToast('nop 👀', e.clientX, e.clientY);
  });
}

/* Same right-click guard on the scrolling motorcycle icon, with its own message. */
function initMotoIconGuard(){
  var icon = document.querySelector('.moto-scroll-icon');
  if(!icon) return;
  icon.addEventListener('contextmenu', function(e){
    e.preventDefault();
    showCursorToast('¿Te gustó la moto? 🏍️', e.clientX, e.clientY);
  });
}

/* Decorative speedometer needle next to the "Trámites y gestiones" heading — sweeps from -90°
   (far left) to +90° (far right) as the #tramites section scrolls through the viewport (from
   the moment it first appears at the bottom to the moment it fully exits at the top), using the
   same GSAP ScrollTrigger already loaded for the hero. No numbers by design — it's a "speed"
   motif, not a literal gauge reading. */
function initTramitesGauge(reduced){
  var section = document.getElementById('tramites');
  var needles = document.querySelectorAll('.speed-gauge-needle');
  if(!section || !needles.length) return;
  if(reduced || !window.gsap || !window.ScrollTrigger){
    needles.forEach(function(n){ n.setAttribute('transform', 'rotate(0 100 100)'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: function(self){
      var angle = -90 + self.progress * 180;
      needles.forEach(function(n){ n.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 100 100)'); });
    }
  });
}

/* Decorative motorcycle icon that rides left-to-right along the bottom of the "Tecnología"
   section as it scrolls through the viewport — same scrub pattern as the trámites gauge, but
   translating x instead of rotating. Track width is measured live (not hardcoded) so it stays
   correct across viewport sizes/resizes without a separate resize listener — cheap enough to
   just re-read on every scrub tick. */
function initTecnologiaMoto(reduced){
  var track = document.querySelector('.moto-scroll-track');
  var icon = document.querySelector('.moto-scroll-icon');
  if(!track || !icon) return;
  var section = track.closest('section');
  if(reduced || !window.gsap || !window.ScrollTrigger){
    icon.style.transform = 'translateY(-50%)';
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: function(self){
      var iconWidth = icon.getBoundingClientRect().width;
      var startX = -iconWidth;
      var maxX = Math.max(startX, track.clientWidth - iconWidth);
      var x = startX + self.progress * (maxX - startX);
      icon.style.transform = 'translate(' + x.toFixed(1) + 'px, -50%)';
    }
  });
}

/* ============ MOTOCITY HERO SEQUENCE ============
   Scroll-driven "camera push" into the laptop screen already present in assets/hero.jpg.
   The screen's position/size inside the source photo is fixed (measured once from the
   original file), but the on-screen (rendered) focal point and the scale needed to fill
   the viewport both depend on the current viewport's aspect ratio versus the photo's —
   because object-fit:cover crops differently at different ratios. So instead of a single
   hardcoded transform-origin/scale, geometry is recomputed from the real rendered box +
   image every time ScrollTrigger refreshes (load, resize, orientation change), and only
   the resulting numbers are applied as transform/opacity — no layout-affecting properties
   are touched during scroll, so this stays smooth on scrub.
*/
function initMotocityHeroZoom(reduced){
  var sequence = document.getElementById('motocityHeroSequence');
  var stage = document.getElementById('motocityHeroStage');
  var img = document.getElementById('motocityHeroImg');
  var imgBg = document.getElementById('motocityHeroImgBg');
  var clouds = document.getElementById('motocityHeroClouds');
  var text = document.getElementById('motocityHeroText');
  var header = document.getElementById('siteHeader');
  var badge = document.getElementById('motocityHeroBadge');
  var scrollDown = document.getElementById('motocityHeroScrollDown');
  if(!sequence || !stage || !img || !imgBg || !clouds || !text) return;

  if(reduced || !window.gsap || !window.ScrollTrigger){
    sequence.classList.add('is-static');
    // No scroll-driven transform to key off of here, so start the header in its "done" state
    // (solid blue, white text) rather than leaving it transparent over non-photo content.
    if(header) header.classList.add('is-hero-solid');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Desktop values measured from assets/hero.jpg (3200x1785) via pixel-flood-fill of the
  // screen's actual white area. Mobile values measured the same way from assets/hero-mobile.jpg
  // (1800x2400, the "Hero mobile expand 2" composite) — a SEPARATE custom photo the user built
  // for the tall portrait crop (laptop centered, rider included), not a crop of the desktop
  // photo — so every fraction below is independent per breakpoint, not derived from the other.
  // Desktop re-measured for "IMAGEN ALTA CON LAPTOP SOBREPUESTO" — the user's own higher-
  // quality laptop composite replacing the previous hero.jpg's laptop cutout (same desk/rider/
  // background, just a better laptop). Nearly identical to the old measurement (same framing),
  // confirming the composite kept the laptop in essentially the same spot.
  var SCREEN_X_DESKTOP = 0.4919, SCREEN_X_MOBILE = 0.4269; // center, fraction of image width
  var SCREEN_W_DESKTOP = 0.0663, SCREEN_W_MOBILE = 0.1083; // width, fraction of image width
  var SCREEN_Y_DESKTOP = 0.6537, SCREEN_Y_MOBILE = 0.6977; // center, fraction of image height
  var SCREEN_H_DESKTOP = 0.0700, SCREEN_H_MOBILE = 0.0479; // height, fraction of image height
  var SCREEN_X = SCREEN_X_DESKTOP; // active values, switched per-breakpoint in build()
  var SCREEN_W = SCREEN_W_DESKTOP;
  var SCREEN_Y = SCREEN_Y_DESKTOP;
  var SCREEN_H = SCREEN_H_DESKTOP;
  // object-position, as a fraction (0.5 = center). Both breakpoints use object-fit:cover (see
  // USE_COVER). The laptop sits almost exactly at the horizontal center of both photos (see
  // SCREEN_X above), so this stays centered on both — no need to shift the crop window.
  var OBJECT_POS_X = 0.5;
  var OBJECT_POS_Y = 0.5;
  var USE_COVER = true;    // object-fit:cover math — kept as a named flag in computeGeometry()
                            // in case a future breakpoint ever needs the contain variant again
  var OVERSHOOT = 1.2;     // extra zoom past "exact fit" so the screen bezel fully clears the viewport
  var MAX_BLUR = 4;        // px of blur the background reaches — kept from updating every single
                            // frame (see the rounding/dedupe in render()) so a bigger radius here
                            // doesn't cost more than a small one
  var BLUR_RAMP_END = 0.4;  // blur reaches MAX_BLUR by this fraction of the zoom, then holds flat —
                             // no point still recalculating it once the background is barely in frame
  var HEADER_SOLID_AT = 0.92; // header switches from transparent to solid Motocity blue once the
                               // zoom is essentially complete (not at the first hint of scroll)
  var REST_UI_FADE_END = 0.06; // the top badge + scroll-down button are rest-state affordances —
                                // fully gone within the first hint of scroll, not dragged through the zoom
  // Sharp mask covers ONLY the laptop and the strip of desk right around it — measured from
  // each photo, centered a little below/forward of the screen itself (the desk surface, not the
  // chair or the tray further along the desk). Everything outside this small ellipse blurs.
  var MASK_X_DESKTOP = 0.4960, MASK_X_MOBILE = 0.425;
  var MASK_Y_DESKTOP = 0.6663, MASK_Y_MOBILE = 0.699;
  // Radii sized so the laptop's full bbox sits entirely inside the mask's "still fully opaque"
  // zone (the gradient holds opaque out to 55% of the radius, see SHARP_MASK below) — otherwise
  // the laptop's own edges fall into the feather band and blur along with the background,
  // instead of staying sharp everywhere. Mobile's laptop bbox: half-width~0.0867, half-height~0.0458.
  var MASK_RX_DESKTOP = 0.095, MASK_RX_MOBILE = 0.1364;
  var MASK_RY_DESKTOP = 0.11,  MASK_RY_MOBILE = 0.0701;
  var MASK_X = MASK_X_DESKTOP;   // active values, switched per-breakpoint in build()
  var MASK_Y = MASK_Y_DESKTOP;
  var MASK_RX = MASK_RX_DESKTOP;
  var MASK_RY = MASK_RY_DESKTOP;
  var SHARP_MASK = 'radial-gradient(ellipse {rx}% {ry}% at {x}% {y}%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)';
  // Width/font-size stays proportional at every step (so line-wrapping never changes mid-scroll).
  // Desktop keeps long, wide lines (matches the screen's own wide aspect ratio); mobile uses
  // shorter lines so the final headline can grow bigger without overflowing a narrow viewport.
  var TEXT_WIDTH_TO_FONT = 0.82 / 0.062;
  var REST_FONT_SCALE = 1; // shrinks only the REST-state (p=0) headline size, per breakpoint —
                            // mobile's initial "Relájate..." read too large on the small rest-
                            // state screen; the zoomed-in end state is untouched (see baseFontSize).
  var TEXT_Y_NUDGE = 0; // shifts the headline down from dead-center, as a multiple of its OWN
                            // current font-size — scales with zoom instead of a fixed pixel offset.
                            // Zero centers the text exactly on the screen's own center (SCREEN_Y),
                            // per request — any offset here pushes it off-center or past the bezel.
  var TEXT_Y_EXTRA_PX = 0; // additional flat offset, ramped in with p so it lands fully once the
                             // zoom settles into the final hero layout (not applied at rest, where
                             // the headline is still tiny and needs to stay inside the little screen)

  var geo = null;
  var lastP = 0;
  var lastPolish = 1;
  var lastBlurPx = -1;

  function computeGeometry(){
    var boxW = stage.clientWidth;
    var boxH = stage.clientHeight;
    var naturalW = img.naturalWidth;
    var naturalH = img.naturalHeight;
    if(!boxW || !boxH || !naturalW || !naturalH) return null;

    var imgRatio = naturalW / naturalH;
    var boxRatio = boxW / boxH;
    var scaledW, scaledH;
    // COVER picks the LARGER natural rendering (crops the excess); CONTAIN picks the SMALLER
    // one (letterboxes the gap) — same "which axis wins" test, opposite dimension chosen.
    var imgWins = imgRatio > boxRatio;
    if(USE_COVER ? imgWins : !imgWins){ scaledH = boxH; scaledW = boxH * imgRatio; }
    else { scaledW = boxW; scaledH = boxW / imgRatio; }

    // Same conversion for the sharp-mask ellipse: a fraction-of-image radius maps to a
    // fraction-of-box radius by the same cover-crop scale factor used for the offset above.
    var maskXPct = (OBJECT_POS_X + (MASK_X - OBJECT_POS_X) * (scaledW / boxW)) * 100;
    var maskYPct = (OBJECT_POS_Y + (MASK_Y - OBJECT_POS_Y) * (scaledH / boxH)) * 100;
    var maskRxPct = MASK_RX * (scaledW / boxW) * 100;
    var maskRyPct = MASK_RY * (scaledH / boxH) * 100;

    // Where the screen's center lands as a fraction of the rendered box, given the image's
    // actual object-position (OBJECT_POS_X/Y — stays centered on both breakpoints; see the
    // constants above for why mobile doesn't need a shift once it's using contain).
    var boxFracX = OBJECT_POS_X + (SCREEN_X - OBJECT_POS_X) * (scaledW / boxW);
    var boxFracY = OBJECT_POS_Y + (SCREEN_Y - OBJECT_POS_Y) * (scaledH / boxH);
    var originPxX = boxFracX * boxW;
    var originPxY = boxFracY * boxH;

    var screenPxW = SCREEN_W * scaledW;
    var screenPxH = SCREEN_H * scaledH;
    var finalScale = Math.max(boxW / screenPxW, boxH / screenPxH) * OVERSHOOT;

    // The text's target size at the END of the zoom is defined relative to the VIEWPORT,
    // not simply "baseFontSize * finalScale" — on tall/narrow viewports the image has to
    // scale a lot more on one axis than the screen rectangle's own aspect ratio would need
    // (to fill height), and naively matching that scale would push the headline wider than
    // the viewport. Capping it against both boxW and boxH keeps it a well-proportioned
    // headline (like a real hero) no matter how extreme the image's own zoom had to be.
    //
    // The base (rest-state) size must derive from the SAME width/font ratio used for the
    // box's own `width` (TEXT_WIDTH_TO_FONT) rather than an independent TEXT_FONT_RATIO —
    // otherwise the two disagree and the text box renders wider than the little laptop
    // screen itself while still tiny/at-rest, spilling past its edges from frame one.
    var baseFontSize = Math.max(3, Math.min(screenPxW * (0.86 / TEXT_WIDTH_TO_FONT), screenPxH * 0.3)) * REST_FONT_SCALE;
    var finalFontSize = Math.max(baseFontSize, Math.min(boxW * (0.86 / TEXT_WIDTH_TO_FONT), boxH * 0.16));

    return {
      originPxX: originPxX,
      originPxY: originPxY,
      translateX: boxW * 0.5 - originPxX,
      translateY: boxH * 0.5 - originPxY,
      finalScale: finalScale,
      baseFontSize: baseFontSize,
      finalFontSize: finalFontSize,
      maskXPct: maskXPct,
      maskYPct: maskYPct,
      maskRxPct: maskRxPct,
      maskRyPct: maskRyPct
    };
  }

  // p: 0..1 main zoom progress. polish: 1..~1.06 extra growth applied only in the final
  // "settle into hero" segment. The image is a GPU-scaled bitmap (transform), which is fine
  // for a photo — but the text is repositioned/resized via real left/top/font-size so it is
  // laid out and painted fresh every frame instead of being scaled as a blurry cached bitmap.
  function render(p, polish){
    lastP = p;
    lastPolish = polish;
    if(!geo) return;
    var scale = (1 + (geo.finalScale - 1) * p) * polish;
    var tx = geo.translateX * p;
    var ty = geo.translateY * p;
    var transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + scale.toFixed(4) + ')';
    // Background, sharp-masked foreground, and clouds are the same photo/frame stacked —
    // sharing one transform every frame keeps them pixel-locked to each other as the camera pushes in.
    img.style.transform = transform;
    imgBg.style.transform = transform;
    clouds.style.transform = transform;

    if(header) header.classList.toggle('is-hero-solid', p >= HEADER_SOLID_AT);

    var restUiOpacity = Math.max(0, 1 - p / REST_UI_FADE_END);
    if(badge) badge.style.opacity = restUiOpacity;
    if(scrollDown) scrollDown.style.opacity = restUiOpacity;

    // Round + only touch style.filter when it actually changes — re-filtering a full-bleed
    // image is expensive, and scrub fires onUpdate on tiny sub-pixel scroll deltas.
    var blurPx = Math.round(MAX_BLUR * Math.min(p / BLUR_RAMP_END, 1) * 4) / 4;
    if(blurPx !== lastBlurPx){
      lastBlurPx = blurPx;
      imgBg.style.filter = blurPx > 0 ? 'blur(' + blurPx + 'px)' : 'none';
    }

    var fontSize = (geo.baseFontSize + (geo.finalFontSize - geo.baseFontSize) * p) * polish;

    var focalX = geo.originPxX + tx;
    var focalY = geo.originPxY + ty + fontSize * TEXT_Y_NUDGE + TEXT_Y_EXTRA_PX * p;
    text.style.left = focalX.toFixed(2) + 'px';
    text.style.top = focalY.toFixed(2) + 'px';

    text.style.fontSize = fontSize.toFixed(2) + 'px';
    text.style.width = (fontSize * TEXT_WIDTH_TO_FONT).toFixed(1) + 'px';
  }

  function refreshGeometry(){
    // A transient 0×0 read (mid-reflow, e.g. right as the pin engages/disengages) is not
    // uncommon here — keep the last good geometry rather than nulling it out and silently
    // freezing the whole effect until some future refresh happens to land at a good moment.
    var next = computeGeometry();
    if(!next) return;
    geo = next;
    var mask = SHARP_MASK
      .replace('{rx}', geo.maskRxPct.toFixed(2))
      .replace('{ry}', geo.maskRyPct.toFixed(2))
      .replace('{x}', geo.maskXPct.toFixed(2))
      .replace('{y}', geo.maskYPct.toFixed(2));
    img.style.maskImage = mask;
    img.style.webkitMaskImage = mask;
    // Anchor the scale exactly on the screen's own point instead of the CSS fallback's fixed
    // 49.2%/65.5% — that static guess is only close enough at modest zoom factors. Contain
    // mode's finalScale is huge (~60x+, since the letterboxed image is much smaller than the
    // box), and at that scale even a small mismatch between the CSS origin and the real
    // computed origin gets amplified into a translation of thousands of px (verified: this is
    // exactly what sent the image flying off-screen on mobile before this fix).
    var originStr = geo.originPxX.toFixed(2) + 'px ' + geo.originPxY.toFixed(2) + 'px';
    img.style.transformOrigin = originStr;
    imgBg.style.transformOrigin = originStr;
    clouds.style.transformOrigin = originStr;
    render(lastP, lastPolish);
  }

  function build(isDesktop){
    TEXT_WIDTH_TO_FONT = isDesktop ? (0.82 / 0.062) : 9.5;
    REST_FONT_SCALE = isDesktop ? 1 : 0.82;
    USE_COVER = true;   // both breakpoints fill 100vh edge-to-edge, no letterbox bars
    // hero-mobile.jpg is a separate custom composite (laptop centered, rider included, tall
    // portrait canvas) — not a crop of hero.jpg — so every geometry fraction swaps per breakpoint.
    // "Hero mobile expand 2" repositioned the rider with real margin from the right edge (the
    // first composite had him nearly touching it, forcing OBJECT_POS_X off-center to 0.68 to
    // bring him into frame) — a dead-center crop now keeps both the laptop centered AND the
    // rider mostly in frame, so the off-center nudge is no longer needed.
    OBJECT_POS_X = isDesktop ? 0.5 : SCREEN_X_MOBILE;
    var objectPosCss = (OBJECT_POS_X * 100).toFixed(1) + '% center';
    img.style.objectPosition = objectPosCss;
    imgBg.style.objectPosition = objectPosCss;
    SCREEN_X = isDesktop ? SCREEN_X_DESKTOP : SCREEN_X_MOBILE;
    SCREEN_W = isDesktop ? SCREEN_W_DESKTOP : SCREEN_W_MOBILE;
    SCREEN_Y = isDesktop ? SCREEN_Y_DESKTOP : SCREEN_Y_MOBILE;
    SCREEN_H = isDesktop ? SCREEN_H_DESKTOP : SCREEN_H_MOBILE;
    MASK_X = isDesktop ? MASK_X_DESKTOP : MASK_X_MOBILE;
    MASK_Y = isDesktop ? MASK_Y_DESKTOP : MASK_Y_MOBILE;
    MASK_RX = isDesktop ? MASK_RX_DESKTOP : MASK_RX_MOBILE;
    MASK_RY = isDesktop ? MASK_RY_DESKTOP : MASK_RY_MOBILE;
    refreshGeometry();
    render(0, 1);

    var holdPct = isDesktop ? 12 : 8;
    var zoomPct = isDesktop ? 63 : 66;
    var stabilizePct = isDesktop ? 25 : 26;

    var state = { p: 0, polish: 1 };

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sequence,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: stage,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: refreshGeometry
      }
    });

    tl.to(state, { p: 0, duration: holdPct, onUpdate: function(){ render(state.p, state.polish); } })
      .to(state, {
        p: 1, duration: zoomPct, ease: 'power1.inOut',
        onUpdate: function(){ render(state.p, state.polish); }
      })
      .to(state, {
        polish: 1.06, duration: stabilizePct, ease: 'power1.out',
        onUpdate: function(){ render(state.p, state.polish); }
      });

    return tl;
  }

  var mm = gsap.matchMedia();
  mm.add({
    isDesktop: '(min-width: 861px)',
    isMobile: '(max-width: 860px)'
  }, function(context){
    build(context.conditions.isDesktop);
  });

  if(img.complete && img.naturalWidth){ refreshGeometry(); }
  else { img.addEventListener('load', refreshGeometry, { once: true }); }
}
