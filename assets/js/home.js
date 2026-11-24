/* page has arrived: let the hero decoration fade in */
document.documentElement.classList.add('ready');
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('no-anim');

  /* nav: mobile toggle */
  var toggle = document.getElementById('navToggle'), links = document.getElementById('navLinks');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav')) { e.preventDefault(); e.stopPropagation(); setMenu(false); }
  }, true);

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  /* nav border once the hero scrolls away */
  var nav = document.getElementById('nav');
  new IntersectionObserver(function (es) {
    nav.classList.toggle('is-scrolled', !es[0].isIntersecting);
  }, { rootMargin: '-80px 0px 0px 0px' }).observe(document.querySelector('.hero h1'));

  var hero = document.querySelector('.hero');
  /* highlight the section in view */
  var navMap = {};
  links.querySelectorAll('a[href^="#"]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  /* gliding gold highlight: follows the section in view, previews on hover */
  var ind = links.querySelector('.nav-ind');
  function moveInd(a) {
    if (!a || window.innerWidth <= 900) { ind.classList.remove('on'); return; }
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    ind.classList.add('on');
  }
  var currentLink = function () { return links.querySelector('a[aria-current]'); };
  links.addEventListener('mouseover', function (e) { var a = e.target.closest('a'); if (a) moveInd(a); });
  links.addEventListener('mouseleave', function () { moveInd(currentLink()); });
  window.addEventListener('resize', function () { moveInd(currentLink()); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInd(currentLink()); });
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var a = navMap[e.target.id];
      links.querySelectorAll('[aria-current]').forEach(function (x) { x.removeAttribute('aria-current'); });
      if (a) a.setAttribute('aria-current', 'true');
      if (!links.matches(':hover')) moveInd(a);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  spy.observe(hero);

  /* parallax: hero layers follow the mouse (eased) and scroll; star layers drift at 3 speeds */
  var layers = [].slice.call(document.querySelectorAll('.hero .layer'));
  var stars = [].slice.call(document.querySelectorAll('.cosmos .st'));
  var SK = [0.03, 0.08, 0.16], SH = [320, 560, 900];
  var root = document.documentElement, tilt3d = document.querySelector('.rune-tilt'), spot = document.getElementById('spotlight');
  var tx = 0, ty = 0, cx = 0, cy = 0, mx = 0, my = 0, smx = 0, smy = 0, sy = window.scrollY, heroOn = true, ticking = false;
  function frame() {
    var lite = root.classList.contains('lite'), rich = root.dataset.tier === 'high';
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    if (heroOn) {
      var hr = hero.getBoundingClientRect();
      layers.forEach(function (l) {
        var d = lite ? +l.dataset.depth * 0.3 : +l.dataset.depth;
        l.style.transform = 'translate3d(' + (cx * d).toFixed(2) + 'px,' + (cy * d + sy * d / 400).toFixed(2) + 'px,0)';
      });
      if (rich) {
        tilt3d.style.transform = 'rotateX(' + (cy * -14).toFixed(2) + 'deg) rotateY(' + (cx * 14).toFixed(2) + 'deg)';
        smx += (mx - smx) * 0.16; smy += (my - smy) * 0.16;
        spot.style.transform = 'translate3d(' + (smx - hr.left).toFixed(1) + 'px,' + (smy - hr.top).toFixed(1) + 'px,0)';
      }
    }
    stars.forEach(function (st, i) {
      st.style.transform = 'translate3d(' + (cx * (i + 1) * 4).toFixed(2) + 'px,' + (-((sy * SK[i]) % SH[i])).toFixed(2) + 'px,0)';
    });
    var spotMoving = heroOn && rich && (Math.abs(mx - smx) > 0.5 || Math.abs(my - smy) > 0.5);
    if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005 || spotMoving) requestAnimationFrame(frame); else ticking = false;
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduce) {
    window.addEventListener('scroll', function () { sy = window.scrollY; kick(); }, { passive: true });
    if (fine) document.addEventListener('pointermove', function (e) {
      if (!e.clientX && !e.clientY) return;
      tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; mx = e.clientX; my = e.clientY; kick();
    }, { passive: true });
    new IntersectionObserver(function (es) {
      heroOn = es[0].isIntersecting; hero.classList.toggle('is-off', !heroOn);
    }, { rootMargin: '-90px 0px 0px 0px' }).observe(hero);
  }

  /* smoothness governor: steps the quality tier down when frames run rough, or once up when there is clear headroom (never above the device spec, never below light).
     Where the browser reports slow frames itself (Chrome, Edge, Android) it just listens, at no cost.
     Elsewhere it times frames only while the visitor scrolls, when frames are being drawn anyway. */
  (function () {
    var T = window.mrTier; if (!T || T.forced || reduce) return;
    var floor = T.order.indexOf('light'), bad = 0, good = 0, upTried = false, lastChange = 0, t0 = performance.now();
    function verdict(rough, smooth) {
      var now = performance.now(), i = T.order.indexOf(T.get());
      if (rough) { good = 0; if (++bad >= 3 && i > floor && now - lastChange > 3000) { T.set(T.order[i - 1], 'rough frames'); bad = 0; upTried = true; lastChange = now; } }
      else if (smooth) { bad = 0; if (++good >= 6 && !upTried && i < T.order.indexOf(T.spec) && now - lastChange > 8000) { T.set(T.order[i + 1], 'headroom'); good = 0; upTried = true; lastChange = now; } }
    }
    var loaf = window.PerformanceObserver && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.indexOf('long-animation-frame') > -1;
    if (loaf) {
      /* every 2 s, judge the long frames the browser reported (frames over 50 ms) */
      var blocked = 0, slowFrames = 0;
      new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (document.visibilityState !== 'visible') return; slowFrames++; blocked += Math.max(0, e.duration - 50); }); }).observe({ type: 'long-animation-frame', buffered: false });
      setInterval(function () {
        if (document.hidden || performance.now() - t0 < 4000) { blocked = slowFrames = 0; return; }
        var rough = slowFrames >= 6 || blocked > 400;
        verdict(rough, slowFrames === 0);
        blocked = slowFrames = 0;
      }, 2000);
      return;
    }
    /* fallback: time frames for 2 s after a scroll starts */
    var running = false, lastScroll = 0;
    function sample() {
      if (running || document.hidden) return; running = true;
      var start = 0, last = 0, gaps = [];
      requestAnimationFrame(function f(t) {
        if (!start) start = last = t; else { gaps.push(t - last); last = t; }
        if (t - start < 2000 && !document.hidden) { requestAnimationFrame(f); return; }
        running = false; if (gaps.length < 12) return;
        var s2 = gaps.slice().sort(function (x, y) { return x - y; });
        var frame = Math.max(6.9, Math.min(16.7, s2[Math.floor(s2.length * 0.1)])), avg = (t - start) / gaps.length;
        var slow = gaps.filter(function (g) { return g > frame * 2.2; }).length / gaps.length;
        verdict(avg > frame * 1.6 || slow > 0.2, avg < frame * 1.08 && slow < 0.02);
      });
    }
    addEventListener('scroll', function () { var now = performance.now(); if (now - t0 > 3000 && now - lastScroll > 2500) { lastScroll = now; sample(); } }, { passive: true });
  })();

  /* highlight cards: play the latency bars once they are on screen */
  new IntersectionObserver(function (es, o) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('play'); o.disconnect(); } });
  }, { threshold: 0.4 }).observe(document.querySelector('.questlog'));

  /* cards: cursor light + gentle tilt */
  if (fine && !reduce) document.querySelectorAll('.art, .card-id, .edu, .xp-main, .xp-minor, .ql').forEach(function (el) {
    var tilt = el.matches('.art:not(.art-feat), .card-id');
    var spot = document.createElement('span'); spot.className = 'spot'; el.prepend(spot);
    el.classList.add('fx');
    el.addEventListener('pointermove', function (e) {
      if (root.dataset.tier !== 'high') return;
      var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      if (tilt) el.style.transform = 'perspective(1000px) rotateX(' + ((0.5 - py) * 5).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 5).toFixed(2) + 'deg) translateY(-3px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  /* scroll reveal (below the fold only; hero is never hidden) */
  var rev = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('is-in'); rev.unobserve(el);
      setTimeout(function () { el.classList.remove('reveal', 'is-in'); }, 1100); /* hand transitions back to hover/tilt */
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) {
    var sib = [].indexOf.call(el.parentNode.children, el);
    el.style.setProperty('--rd', (sib % 4) * 90 + 'ms');
    if (reduce) el.classList.add('is-in'); else rev.observe(el);
  });
})();

/* Stellar Archive: rail tabs + auto-advance driven by the progress bar */
(function () {
  var arc = document.getElementById('archive');
  if (!arc) return;
  var tabs = [].slice.call(arc.querySelectorAll('.rail-item'));
  var panels = [].slice.call(arc.querySelectorAll('.stage > .art'));
  var rail = arc.querySelector('.rail');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, hover = false, focus = false, seen = false;
  /* pages of five in the rail; the pager under it flips between them */
  var PER = 7, pages = Math.ceil(tabs.length / PER), page = -1, pager = document.getElementById('railPager');
  function setPage(pg, dir) {
    pg = (pg + pages) % pages; if (pg === page) return; var first = page < 0; page = pg;
    var k = 0;
    tabs.forEach(function (t, i) { var on = Math.floor(i / PER) === pg; t.hidden = !on; if (on) t.style.setProperty('--k', k++); });
    if (pager) {
      var lo = pg * PER + 1, hi = Math.min(tabs.length, lo + PER - 1);
      pager.querySelector('.pg-label').textContent = (pg === 0 ? 'Spotlight' : 'More builds') + ' · ' + lo + '–' + hi + ' of ' + tabs.length;
      pager.querySelectorAll('.pg-dots i').forEach(function (d, j) { d.classList.toggle('on', j === pg); });
    }
    if (!first && !reduce) { rail.classList.remove('pg-in', 'pg-back'); void rail.offsetWidth; rail.classList.add('pg-in'); if (dir < 0) rail.classList.add('pg-back'); }
    if (rail.scrollLeft) rail.scrollTo({ left: 0 });
  }
  function step(from, d) { /* next project on the same page, wrapping */
    var base = page * PER, size = Math.min(PER, tabs.length - base);
    return base + ((from - base + d) % size + size) % size;
  }
  var portrait = window.matchMedia('(max-width: 860px) and (orientation: portrait)'), stageEl = arc.querySelector('.stage'), mCount = null, mDots = [], mNext = null, mNav = null;
  function fitStage() { stageEl.style.height = portrait.matches ? panels[cur].offsetHeight + 'px' : ''; }
  function show(i, moveFocus, fromScroll) {
    i = (i + tabs.length) % tabs.length; var prev = cur; cur = i;
    if (portrait.matches && !fromScroll) stageEl.scrollTo({ left: panels[i].offsetLeft - panels[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    if (mDots.length) {
      mDots.forEach(function (d, j) { d.setAttribute('aria-current', String(j === i)); });
      var ch = mDots[i]; if (mNav.scrollWidth > mNav.clientWidth) mNav.scrollTo({ left: ch.offsetLeft - mNav.clientWidth / 2 + ch.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      mNext.classList.toggle('last', i === tabs.length - 1);
      mCount.textContent = i === tabs.length - 1 ? 'That\u2019s every project' : 'Swipe for more';
    }
    if (Math.floor(i / PER) !== page) setPage(Math.floor(i / PER), i > prev ? 1 : -1);
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    panels.forEach(function (p, j) { p.classList.toggle('is-on', j === i); if (j === i) p.removeAttribute('inert'); else p.setAttribute('inert', ''); });
    if (moveFocus) tabs[i].focus();
    fitStage();
    var stat = panels[i].querySelector('.main-stat b');
    if (stat && window.countUp) window.countUp(stat);
    if (rail.scrollWidth > rail.clientWidth + 4) { /* horizontal strip on phones */
      var t = tabs[i]; rail.scrollTo({ left: t.offsetLeft - rail.clientWidth / 2 + t.offsetWidth / 2, behavior: 'smooth' });
    }
  }
  rail.addEventListener('scroll', function () { rail.classList.toggle('at-end', rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4); }, { passive: true });
  function sync() { arc.classList.toggle('paused', hover || focus || !seen || document.hidden); }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(i); });
    /* the 9s bar finishing is the timer */
    t.querySelector('.rail-bar').addEventListener('animationend', function () { if (i === cur) show(step(cur, 1)); });
  });
  rail.addEventListener('keydown', function (e) {
    var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); show(step(cur, d), true); }
    else if (e.key === 'Home') { e.preventDefault(); show(page * PER, true); }
    else if (e.key === 'End') { e.preventDefault(); show(Math.min(tabs.length, page * PER + PER) - 1, true); }
  });
  /* phones: side-swipe the card to move between projects */
  var stage = arc.querySelector('.stage'), narrow = window.matchMedia('(max-width: 860px)'), sx = 0, sy = 0, sOn = false;
  stage.addEventListener('touchstart', function (e) {
    sOn = narrow.matches && !portrait.matches && e.touches.length === 1;
    if (sOn) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!sOn) return; sOn = false;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    var d = dx < 0 ? 1 : -1;
    show((cur + d + tabs.length) % tabs.length);
    if (!reduce) {
      var p = panels[cur]; p.classList.remove('sw-next', 'sw-prev'); void p.offsetWidth;
      p.classList.add(d > 0 ? 'sw-next' : 'sw-prev');
      p.addEventListener('animationend', function () { p.classList.remove('sw-next', 'sw-prev'); }, { once: true });
    }
  }, { passive: true });
  /* phone portrait: counter + swipe hint above the cards, dots + next-section button below */
  (function () {
    var next = arc.closest('section') && arc.closest('section').nextElementSibling;
    var nextName = next && next.querySelector('h2') ? next.querySelector('h2').textContent.trim() : '';
    /* every project is a chip; the current one opens up to show its name and takes the spare width, so nothing is ever cut off */
    mNav = document.createElement('div'); mNav.className = 'm-nav'; mNav.setAttribute('role', 'group'); mNav.setAttribute('aria-label', 'Projects');
    tabs.forEach(function (t, j) {
      var d = document.createElement('button'); d.type = 'button'; d.className = 'm-chip';
      d.style.setProperty('--c', t.style.getPropertyValue('--c'));
      d.innerHTML = '<b></b><span></span>';
      d.firstChild.textContent = String(j + 1).padStart(2, '0'); d.lastChild.textContent = t.querySelector('.rail-name').textContent;
      d.setAttribute('aria-label', t.querySelector('.rail-name').textContent);
      d.addEventListener('click', function () { show(j); }); mNav.appendChild(d); mDots.push(d);
    });
    var edges = function () { mNav.classList.toggle('at-start', mNav.scrollLeft < 4); mNav.classList.toggle('at-end', mNav.scrollLeft > mNav.scrollWidth - mNav.clientWidth - 4); };
    mNav.addEventListener('scroll', edges, { passive: true }); setTimeout(edges, 0);
    var foot = document.createElement('div'); foot.className = 'm-foot';
    foot.innerHTML = '<p class="m-hint"><i aria-hidden="true">\u2190</i> <span class="m-count">Swipe for more</span> <i aria-hidden="true">\u2192</i></p>';
    mCount = foot.querySelector('.m-count');
    mNext = document.createElement('a'); mNext.className = 'm-next';
    mNext.href = next && next.id ? '#' + next.id : '#';
    mNext.innerHTML = 'Next: ' + (nextName || 'section') + ' <span aria-hidden="true">↓</span>';
    foot.appendChild(mNext);
    stageEl.parentNode.insertBefore(mNav, stageEl); stageEl.parentNode.insertBefore(foot, stageEl.nextSibling);
    /* phones show the essentials; a toggle reveals the full write-up */
    panels.forEach(function (pn) {
      if (!pn.querySelector('.art-desc, .arch, .older, .flow, .subs li')) return;
      var m = document.createElement('button'); m.type = 'button'; m.className = 'm-more'; m.setAttribute('aria-expanded', 'false');
      m.innerHTML = '<span>Read more</span> <i aria-hidden="true">▾</i>';
      m.addEventListener('click', function () { var o = pn.classList.toggle('m-open'); m.setAttribute('aria-expanded', String(o)); m.firstChild.textContent = o ? 'Show less' : 'Read more'; fitStage(); });
      pn.appendChild(m);
    });
    var st = 0;
    stageEl.addEventListener('scroll', function () {
      if (!portrait.matches) return;
      clearTimeout(st); st = setTimeout(function () {
        var x = stageEl.scrollLeft + panels[0].offsetLeft, best = 0, bd = 1e9;
        panels.forEach(function (pn, j) { var dd = Math.abs(pn.offsetLeft - x); if (dd < bd) { bd = dd; best = j; } });
        if (best !== cur) { mNav.classList.add('swiped'); show(best, false, true); }
      }, 90);
    }, { passive: true });
    var onMode = function () { fitStage(); if (portrait.matches) stageEl.scrollTo({ left: panels[cur].offsetLeft - panels[0].offsetLeft }); };
    if (portrait.addEventListener) portrait.addEventListener('change', onMode); else portrait.addListener(onMode);
    addEventListener('resize', function () { if (portrait.matches) fitStage(); });
  })();
  if (pager && pages > 1) {
    pager.hidden = false;
    var dots = pager.querySelector('.pg-dots'); for (var q = 0; q < pages; q++) dots.appendChild(document.createElement('i'));
    pager.querySelectorAll('.pg-btn').forEach(function (b) {
      b.addEventListener('click', function () { var d = Number(b.dataset.d); setPage(page + d, d); show(page * PER); });
    });
  }
  setPage(0, 1); show(cur);
  if (reduce || window.matchMedia('(max-width: 860px)').matches) return;
  arc.classList.add('auto');
  arc.addEventListener('mouseenter', function () { hover = true; sync(); });
  arc.addEventListener('mouseleave', function () { hover = false; sync(); });
  arc.addEventListener('focusin', function () { focus = true; sync(); });
  arc.addEventListener('focusout', function () { focus = false; sync(); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; sync(); }, { threshold: 0.3 }).observe(arc);
  else seen = true;
  sync();
})();

/* Beyond: 3D coverflow with timer, arrows, dots, swipe */
(function () {
  var cover = document.getElementById('cover');
  if (!cover) return;
  var cards = [].slice.call(cover.querySelectorAll('.hobby'));
  var dotsBox = document.getElementById('coverDots');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n = cards.length, cur = 0, timer = null, seen = false, hover = false;
  cards.forEach(function (c, i) {
    var d = document.createElement('button'); d.type = 'button';
    d.setAttribute('aria-label', 'Show ' + c.querySelector('h3').textContent);
    d.addEventListener('click', function () { go(i); }); dotsBox.appendChild(d);
    c.addEventListener('click', function (e) { if (i !== cur) { e.preventDefault(); go(i); } });
  });
  var dots = [].slice.call(dotsBox.children);
  function arrange() {
    var step = Math.min(340, cards[0].offsetWidth * 0.82);
    cards.forEach(function (c, i) {
      var o = i - cur;
      if (o > n / 2) o -= n; if (o < -n / 2) o += n;
      var a = Math.abs(o);
      c.style.transform = 'translateX(' + (o * step) + 'px) translateZ(' + (-a * 130) + 'px) rotateY(' + (o * -14) + 'deg) scale(' + (a ? Math.max(0.74, 1 - a * 0.1) : 1) + ')';
      c.style.opacity = a === 0 ? 1 : window.innerWidth < 480 ? 0 : a === 1 ? 0.5 : a === 2 ? 0.22 : 0;
      c.style.zIndex = 10 - a;
      c.style.pointerEvents = a > 2 ? 'none' : '';
      c.classList.toggle('is-on', a === 0);
      c.setAttribute('aria-hidden', String(a !== 0));
      c.querySelectorAll('a').forEach(function (l) { l.tabIndex = a ? -1 : 0; });
    });
    dots.forEach(function (d, i) { if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  }
  function go(i) { cur = (i + n) % n; arrange(); restart(); }
  function restart() {
    clearInterval(timer); if (reduce) return;
    timer = setInterval(function () { if (seen && !hover && !document.hidden) { cur = (cur + 1) % n; arrange(); } }, 7000);
  }
  document.getElementById('coverPrev').addEventListener('click', function () { go(cur - 1); });
  document.getElementById('coverNext').addEventListener('click', function () { go(cur + 1); });
  cover.addEventListener('mouseenter', function () { hover = true; });
  cover.addEventListener('mouseleave', function () { hover = false; });
  cover.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
  var sx = null;
  cover.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  cover.addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? cur + 1 : cur - 1);
  }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.3 }).observe(cover);
  else seen = true;
  window.addEventListener('resize', arrange);
  arrange(); restart();
})();

/* headline numbers count up the first time they appear; magnetic hero buttons */
(function () {
  var root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var els = [].slice.call(document.querySelectorAll('.ql-v[data-count], .main-stat b, .xs-v'));
  function run(el) {
    if (root.classList.contains('lite')) return;
    var fin = el.dataset.final || (el.dataset.final = el.textContent); /* real value, captured once */
    var m = fin.match(/\d[\d,]*\.?\d*/);
    if (!m) return;
    if (el._cu) cancelAnimationFrame(el._cu);
    var raw = m[0].replace(/,/g, ''), target = parseFloat(raw), dec = (raw.split('.')[1] || '').length;
    var pre = fin.slice(0, m.index), post = fin.slice(m.index + m[0].length), t0 = 0, dur = 1100;
    el.style.minWidth = el.offsetWidth + 'px';
    el._cu = requestAnimationFrame(function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = k < 1 ? pre + (target * e).toFixed(dec) + post : fin;
      if (k < 1) el._cu = requestAnimationFrame(step); else { el._cu = 0; el.style.minWidth = ''; }
    });
  }
  window.countUp = run;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && !e.target.closest('[inert]')) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.hero-cta .btn').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      if (root.classList.contains('lite')) return;
      var r = btn.getBoundingClientRect();
      btn.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
    });
    btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
  });
})();

/* opening animation: once per visit; any click or key skips it */
(function () {
  var intro = document.getElementById('intro');
  if (!intro || document.documentElement.classList.contains('intro-done')) return;
  try { sessionStorage.setItem('mr-intro', '1'); } catch (e) {}
  var done = function () { document.documentElement.classList.add('intro-done'); };
  intro.addEventListener('animationend', function (e) { if (e.target === intro) done(); });
  ['pointerdown', 'keydown'].forEach(function (t) { addEventListener(t, done, { once: true }); });
  setTimeout(done, 1500);
})();

/* contact form → Web3Forms (lands in Mukul's inbox; Reply goes to the sender).
   Spam layers: hidden honeypot, minimum fill time, 30s cooldown, link limit,
   length limits, single in-flight send; Web3Forms filters server-side too. */
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var btn = document.getElementById('cfSend'), status = document.getElementById('cfStatus');
  var msg = document.getElementById('cfMsg'), count = document.getElementById('cfCount');
  var openedAt = Date.now(), sending = false, MAX = 2000;
  var fields = {
    cfName: function (v) { return !v ? 'Please add your name.' : v.length > 80 ? 'Please keep your name under 80 characters.' : ''; },
    cfEmail: function (v) { return !v ? 'Please add your email so I can reply.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'That email doesn\u2019t look right.' : ''; },
    cfCompany: function (v) { return v.length > 100 ? 'Please keep this under 100 characters.' : ''; },
    cfMsg: function (v) {
      if (v.length < 10) return 'Please write at least a sentence (10+ characters).';
      if (v.length > MAX) return 'Please keep it under ' + MAX + ' characters.';
      if ((v.match(/https?:\/\//gi) || []).length > 3) return 'Please include at most 3 links.';
      return '';
    }
  };
  function check(id) {
    var el = document.getElementById(id), err = fields[id](el.value.trim()), out = document.getElementById(id + 'Err');
    el.setAttribute('aria-invalid', err ? 'true' : 'false');
    el.classList.toggle('is-bad', !!err);
    if (out) out.textContent = err;
    return !err;
  }
  Object.keys(fields).forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('blur', function () { if (el.value) check(id); });
    el.addEventListener('input', function () { if (el.classList.contains('is-bad')) check(id); });
  });
  function counter() {
    var n = msg.value.length;
    count.textContent = n + ' / ' + MAX;
    count.classList.toggle('over', n > MAX);
  }
  msg.addEventListener('input', counter); counter();

  function say(text, isErr, withCopy) {
    status.className = 'form-status' + (isErr ? ' err' : '');
    status.textContent = text;
    if (withCopy) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'copy-mail'; b.textContent = 'Copy my email';
      b.addEventListener('click', function () { if (window.copyEmail) window.copyEmail(); });
      status.appendChild(document.createTextNode(' ')); status.appendChild(b);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    var ok = Object.keys(fields).map(check).every(Boolean);
    if (!ok) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); say('Please fix the highlighted fields.', true); return; }
    if (form.botcheck.checked) return;                                    /* honeypot: silently drop bots */
    if (Date.now() - openedAt < 3000) { say('That was quick! Please take a second and try again.', true); return; }
    var last = 0; try { last = +localStorage.getItem('mr-sent') || 0; } catch (err) {}
    var wait = 30 - Math.floor((Date.now() - last) / 1000);
    if (wait > 0) { say('Thanks! Please wait ' + wait + 's before sending another message.', true); return; }

    var v = function (id) { return document.getElementById(id).value.trim(); };
    var topic = v('cfTopic'), name = v('cfName');
    var payload = {
      access_key: form.access_key.value,
      subject: '[Portfolio] ' + topic + ' from ' + name,
      from_name: 'Mukul Rayana · Portfolio',
      name: name, email: v('cfEmail'), topic: topic,
      company: v('cfCompany') || '—', message: v('cfMsg'),
      page: location.href, botcheck: false
    };
    sending = true; btn.disabled = true; btn.classList.add('is-busy'); btn.textContent = 'Sending…'; say('');
    var ctrl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.success === false) throw new Error(j.message || 'send failed'); }); })
      .then(function () {
        try { localStorage.setItem('mr-sent', String(Date.now())); } catch (err) {}
        var card = document.getElementById('cfDone');
        document.getElementById('cfDoneName').textContent = name.split(' ')[0];
        form.hidden = true; card.hidden = false; card.focus();
      })
      .catch(function () {
        say('Your message couldn\u2019t be sent right now. You can email me directly instead:', true, true);
      })
      .then(function () { clearTimeout(to); sending = false; btn.disabled = false; btn.classList.remove('is-busy'); btn.textContent = 'Send message'; });
  });
  document.getElementById('cfAgain').addEventListener('click', function () {
    form.reset(); counter(); openedAt = Date.now();
    document.getElementById('cfDone').hidden = true; form.hidden = false; document.getElementById('cfName').focus();
  });
})();

/* project demo tiles: a muted preview loop plays only while visible (never with reduced motion or lite);
   clicking a tile opens a small viewer. The YouTube player (privacy-enhanced domain) loads only on click. */
(function () {
  var groups = document.querySelectorAll('.demos');
  if (!groups.length) return;
  /* checked every time: the runtime FPS probe can switch the page to lite later */
  var still = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('lite'); };
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var dlg = document.createElement('dialog');
  dlg.className = 'cv pv'; dlg.setAttribute('aria-labelledby', 'pvTitle');
  dlg.innerHTML = '<div class="cv-bar"><h2 id="pvTitle"></h2><div class="cv-acts"><a class="cv-btn" target="_blank" rel="noopener"></a>' +
    '<button type="button" class="cv-x" aria-label="Close viewer">' + X + '</button></div></div><div class="pv-body"></div><p class="pv-note" hidden></p>';
  document.body.appendChild(dlg);
  var body = dlg.querySelector('.pv-body'), title = dlg.querySelector('h2'), link = dlg.querySelector('.cv-btn'), note = dlg.querySelector('.pv-note'), last = null;
  dlg.querySelector('.cv-x').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { body.innerHTML = ''; if (last) last.focus(); sync(); });
  function open(tile, name) {
    last = tile; body.innerHTML = ''; note.hidden = true;
    if (tile.dataset.open === 'video') {
      title.innerHTML = name + ' <small>Overview video · 2:20</small>';
      link.href = 'https://youtu.be/' + tile.dataset.yt; link.innerHTML = 'Watch on YouTube <span aria-hidden="true">↗</span>';
      var fr = document.createElement('iframe');
      fr.src = 'https://www.youtube-nocookie.com/embed/' + tile.dataset.yt + '?autoplay=1&rel=0';
      fr.title = name + ' overview video'; fr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      fr.referrerPolicy = 'strict-origin-when-cross-origin'; body.appendChild(fr);
    } else {
      title.innerHTML = name + ' <small>Live demo</small>';
      link.href = tile.dataset.url; link.innerHTML = 'Open the live demo <span aria-hidden="true">↗</span>';
      var src = tile.querySelector('video');
      var v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.controls = true; v.poster = src.poster || src.dataset.poster || '';
      /* the pop-up gets the sharp version (loaded only now); the card keeps the small loop */
      if (tile.dataset.hd) [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(function (f) { var so = document.createElement('source'); so.src = tile.dataset.hd + '.' + f[0]; so.type = f[1]; v.appendChild(so); });
      else Array.prototype.forEach.call(src.querySelectorAll('source'), function (s) { v.appendChild(s.cloneNode()); });
      body.appendChild(v); if (!still()) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      note.textContent = tile.dataset.note || ''; note.hidden = !tile.dataset.note;
    }
    dlg.showModal(); sync();
  }
  /* a card loop plays only while its card is the active one, on screen, in a visible tab */
  var vids = [], seen = new WeakMap();
  var sync = function () {
    vids.forEach(function (v) {
      if (seen.get(v) && !v.closest('[inert]') && !document.hidden && !dlg.open && !still()) { if (v.paused) { v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } }
      else if (!v.paused) v.pause();
    });
  };
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (es) {
    es.forEach(function (e) { seen.set(e.target, e.isIntersecting); }); sync();
  }, { threshold: 0.35 });
  document.addEventListener('tierchange', function () { sync(); });
  /* posters load only when the projects section comes near the screen */
  var near = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.querySelectorAll('video[data-poster]').forEach(function (v) { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); }); near.unobserve(e.target); } });
  }, { rootMargin: '600px 0px' }) : null;
  groups.forEach(function (g) { if (near) near.observe(g.closest('.stage') || g); else g.querySelectorAll('video[data-poster]').forEach(function (v) { v.poster = v.dataset.poster; }); });
  groups.forEach(function (g) {
    g.querySelectorAll('.demo-tile').forEach(function (t) {
      var v = t.querySelector('video'); if (v) { vids.push(v); if (io) io.observe(v); }
      t.addEventListener('click', function () { open(t, g.dataset.title || ''); });
    });
  });
  /* tab clicks, keys, swipes and auto-rotation all toggle inert/is-on on the panels */
  if ('MutationObserver' in window) {
    var mo = new MutationObserver(sync);
    document.querySelectorAll('.stage>.art').forEach(function (p) { mo.observe(p, { attributes: true, attributeFilter: ['inert', 'class'] }); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('visibilitychange', sync);
})();

/* motion budget: gold sweeps and stat-icon animations repaint on the main thread, so they run in short bursts, only on screen */
(function () {
  var root = document.documentElement;
  var calm = function () { return root.classList.contains('lite') || matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden; };
  if (!('IntersectionObserver' in window)) return;
  /* a single sweep every 12 s for whatever gold text is on screen */
  var gold = [].slice.call(document.querySelectorAll('.hero h1 span, .foil')), seen = new WeakMap();
  var gio = new IntersectionObserver(function (es) { es.forEach(function (e) { seen.set(e.target, e.isIntersecting); }); }, { threshold: 0.2 });
  gold.forEach(function (g) { gio.observe(g); g.addEventListener('animationend', function () { g.classList.remove('sweep'); }); });
  function sweep() { if (!calm()) gold.forEach(function (g) { if (seen.get(g)) g.classList.add('sweep'); }); }
  setTimeout(function () { sweep(); setInterval(sweep, 12000); }, 1500);
  /* stat icons animate for ~9 s when their card comes into view or becomes the active project, then rest */
  var icons = [].slice.call(document.querySelectorAll('.mi')), vis = new WeakMap(), timers = new WeakMap();
  function wake(mi) {
    var card = mi.closest('.art');
    if (calm() || !vis.get(mi) || (card && !card.classList.contains('is-on') && card.parentNode && card.parentNode.classList.contains('stage'))) return;
    mi.classList.add('mi-on'); clearTimeout(timers.get(mi));
    timers.set(mi, setTimeout(function () { mi.classList.remove('mi-on'); }, 6000));
  }
  var mio = new IntersectionObserver(function (es) { es.forEach(function (e) { vis.set(e.target, e.isIntersecting); if (e.isIntersecting) wake(e.target); else e.target.classList.remove('mi-on'); }); }, { threshold: 0.3 });
  icons.forEach(function (mi) { mio.observe(mi); });
  /* sections scrolled off screen pause all their animation */
  var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('off', !e.isIntersecting); }); }, { rootMargin: '-90px 0px 0px 0px' });
  document.querySelectorAll('main > .section, main > section').forEach(function (sec) { sio.observe(sec); });
  var stage = document.querySelector('.stage');
  if (stage && 'MutationObserver' in window) new MutationObserver(function (ms) {
    var arcEl = document.getElementById('archive');
    if (arcEl && arcEl.classList.contains('auto') && !arcEl.matches(':hover, :focus-within')) return; /* automatic rotation: let the card arrive quietly */
    ms.forEach(function (m) { if (m.target.classList && m.target.classList.contains('is-on')) m.target.querySelectorAll('.mi').forEach(wake); });
  }).observe(stage, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();
