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
    var lite = root.classList.contains('lite');
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    if (heroOn) {
      var hr = hero.getBoundingClientRect();
      layers.forEach(function (l) {
        var d = lite ? +l.dataset.depth * 0.3 : +l.dataset.depth;
        l.style.transform = 'translate3d(' + (cx * d).toFixed(2) + 'px,' + (cy * d + sy * d / 400).toFixed(2) + 'px,0)';
      });
      if (!lite) {
        tilt3d.style.transform = 'rotateX(' + (cy * -14).toFixed(2) + 'deg) rotateY(' + (cx * 14).toFixed(2) + 'deg)';
        smx += (mx - smx) * 0.16; smy += (my - smy) * 0.16;
        spot.style.transform = 'translate3d(' + (smx - hr.left).toFixed(1) + 'px,' + (smy - hr.top).toFixed(1) + 'px,0)';
      }
    }
    stars.forEach(function (st, i) {
      st.style.transform = 'translate3d(' + (cx * (i + 1) * 4).toFixed(2) + 'px,' + (-((sy * SK[i]) % SH[i])).toFixed(2) + 'px,0)';
    });
    var spotMoving = heroOn && !lite && (Math.abs(mx - smx) > 0.5 || Math.abs(my - smy) > 0.5);
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
    }).observe(hero);
  }

  /* runtime FPS probe: if the first ~2s run under ~40fps, switch to the lite tier */
  if (!reduce && !root.classList.contains('lite') && !root.dataset.fx) {
    var frames = 0, t0 = 0;
    setTimeout(function () {
      requestAnimationFrame(function probe(t) {
        if (!t0) t0 = t;
        frames++;
        if (t - t0 < 2000) requestAnimationFrame(probe);
        else if (frames / ((t - t0) / 1000) < 28) root.classList.add('lite');
      });
    }, 2500);
  }

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
      if (root.classList.contains('lite')) return;
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
  function show(i, moveFocus) {
    i = (i + tabs.length) % tabs.length; cur = i;
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    panels.forEach(function (p, j) { p.classList.toggle('is-on', j === i); if (j === i) p.removeAttribute('inert'); else p.setAttribute('inert', ''); });
    if (moveFocus) tabs[i].focus();
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
    t.querySelector('.rail-bar').addEventListener('animationend', function () { if (i === cur) show(cur + 1); });
  });
  rail.addEventListener('keydown', function (e) {
    var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); show(cur + d, true); }
    else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
    else if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
  });
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
    c.addEventListener('click', function () { if (i !== cur) go(i); });
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
  setTimeout(done, 2600);
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
