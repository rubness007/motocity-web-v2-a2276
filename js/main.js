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
})();

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
  var text = document.getElementById('motocityHeroText');
  if(!sequence || !stage || !img || !text) return;

  if(reduced || !window.gsap || !window.ScrollTrigger){
    sequence.classList.add('is-static');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Measured directly from assets/hero.jpg (3200x1785): the laptop screen's bounding box.
  var SCREEN_X = 0.4923;   // center, as a fraction of image width
  var SCREEN_Y = 0.6552;   // center, as a fraction of image height
  var SCREEN_W = 0.0647;   // width, as a fraction of image width
  var SCREEN_H = 0.0678;   // height, as a fraction of image height
  var OVERSHOOT = 1.2;     // extra zoom past "exact fit" so the screen bezel fully clears the viewport
  var TEXT_FONT_RATIO = 0.062;    // base (rest-state) font-size, as a fraction of the screen's rendered width
  // Width/font-size stays proportional at every step (so line-wrapping never changes mid-scroll).
  // Desktop keeps long, wide lines (matches the screen's own wide aspect ratio); mobile uses
  // shorter lines so the final headline can grow bigger without overflowing a narrow viewport.
  var TEXT_WIDTH_TO_FONT = 0.82 / 0.062;

  var geo = null;
  var lastP = 0;
  var lastPolish = 1;

  function computeGeometry(){
    var boxW = stage.clientWidth;
    var boxH = stage.clientHeight;
    var naturalW = img.naturalWidth;
    var naturalH = img.naturalHeight;
    if(!boxW || !boxH || !naturalW || !naturalH) return null;

    var imgRatio = naturalW / naturalH;
    var boxRatio = boxW / boxH;
    var scaledW, scaledH;
    if(imgRatio > boxRatio){ scaledH = boxH; scaledW = boxH * imgRatio; }
    else { scaledW = boxW; scaledH = boxW / imgRatio; }

    // Where the screen's center lands as a fraction of the rendered box (object-position: center center).
    var boxFracX = 0.5 + (SCREEN_X - 0.5) * (scaledW / boxW);
    var boxFracY = 0.5 + (SCREEN_Y - 0.5) * (scaledH / boxH);
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
    var baseFontSize = Math.max(3, screenPxW * TEXT_FONT_RATIO);
    var finalFontSize = Math.max(baseFontSize, Math.min(boxW * (0.86 / TEXT_WIDTH_TO_FONT), boxH * 0.105));

    return {
      originXPct: boxFracX * 100,
      originYPct: boxFracY * 100,
      originPxX: originPxX,
      originPxY: originPxY,
      translateX: boxW * 0.5 - originPxX,
      translateY: boxH * 0.5 - originPxY,
      finalScale: finalScale,
      baseFontSize: baseFontSize,
      finalFontSize: finalFontSize
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
    img.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + scale.toFixed(4) + ')';

    var focalX = geo.originPxX + tx;
    var focalY = geo.originPxY + ty;
    text.style.left = focalX.toFixed(2) + 'px';
    text.style.top = focalY.toFixed(2) + 'px';

    var fontSize = (geo.baseFontSize + (geo.finalFontSize - geo.baseFontSize) * p) * polish;
    text.style.fontSize = fontSize.toFixed(2) + 'px';
    text.style.width = (fontSize * TEXT_WIDTH_TO_FONT).toFixed(1) + 'px';
  }

  function refreshGeometry(){
    geo = computeGeometry();
    if(!geo) return;
    render(lastP, lastPolish);
  }

  function build(isDesktop){
    TEXT_WIDTH_TO_FONT = isDesktop ? (0.82 / 0.062) : 9.5;
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
