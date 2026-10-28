(() => {
  'use strict';
  const root = document.getElementById('mc-people-accordion');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const video = root.querySelector('video');
  const replay = root.querySelector('.pause');
  const groups = Array.from(root.querySelectorAll('details'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const totalPlays = 3;
  let completed = 0;
  let finished = false;
  let visible = false;
  let started = false;
  let consentToMotion = !reducedMotion.matches;

  async function play() {
    if (finished) {
      completed = 0;
      finished = false;
      video.currentTime = 0;
    }
    if (video.ended) video.currentTime = 0;
    replay.hidden = true;
    try {
      await video.play();
      started = true;
    } catch (_) {
      replay.hidden = false;
    }
  }

  video.addEventListener('ended', () => {
    completed += 1;
    if (completed >= totalPlays) {
      finished = true;
      replay.hidden = false;
      return;
    }
    video.currentTime = 0;
    if (visible && !document.hidden && consentToMotion) play();
  });
  video.addEventListener('error', () => { replay.hidden = false; });
  replay.addEventListener('click', () => {
    consentToMotion = true;
    play();
  });

  groups.forEach(group => group.addEventListener('toggle', () => {
    if (group.open) groups.forEach(other => {
      if (other !== group && other.open) other.open = false;
    });
  }));

  function checkPlayback() {
    if (!visible || document.hidden) {
      video.pause();
    } else if (!finished && consentToMotion) {
      play();
    }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      checkPlayback();
    }, { threshold: 0.3 });
    observer.observe(video);
  } else {
    visible = true;
    checkPlayback();
  }
  document.addEventListener('visibilitychange', checkPlayback);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      consentToMotion = false;
      video.pause();
      replay.hidden = false;
    } else if (!started) {
      consentToMotion = true;
      checkPlayback();
    }
  });
  if (reducedMotion.matches) replay.hidden = false;
})();
