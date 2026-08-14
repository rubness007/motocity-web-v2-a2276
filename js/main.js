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
})();

/* Blocks right-click / long-press "save image" on the client logo marquee — shows a small
   "NOP!" toast next to the cursor instead of the native context menu. */
function initClientLogosGuard(){
  var marquee = document.querySelector('.clients-marquee');
  if(!marquee) return;
  marquee.addEventListener('contextmenu', function(e){
    if(e.target.tagName !== 'IMG') return;
    e.preventDefault();
    showNopToast(e.clientX, e.clientY);
  });

  function showNopToast(x, y){
    var el = document.createElement('div');
    el.textContent = 'nop 👀';
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
