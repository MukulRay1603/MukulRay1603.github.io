/* Shared by index.html and journal.html: command palette, daylight theme, ambient sound. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var onHome = !!document.getElementById('projects');
  var home = function (hash) { return onHome ? hash : 'index.html' + hash; };

  /* ─── nav on secondary pages (journal): mobile toggle + highlight on the current link ─── */
  if (!onHome) (function () {
    var toggle = document.getElementById('navToggle'), links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    var setMenu = function (open) { toggle.setAttribute('aria-expanded', String(open)); links.classList.toggle('is-open', open); };
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav')) { e.preventDefault(); e.stopPropagation(); setMenu(false); }
    }, true);
    var ind = links.querySelector('.nav-ind'), cur = links.querySelector('[aria-current]');
    var move = function (a) {
      if (!ind) return;
      if (!a || innerWidth <= 900) { ind.classList.remove('on'); return; }
      ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + a.offsetLeft + 'px)'; ind.classList.add('on');
    };
    links.addEventListener('mouseover', function (e) { var a = e.target.closest('a'); if (a) move(a); });
    links.addEventListener('mouseleave', function () { move(cur); });
    addEventListener('resize', function () { move(cur); });
    move(cur);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { move(cur); });
  })();

  /* ─── email: assembled at runtime so scrapers reading the HTML never see it ─── */
  var MAIL = ['ai.mukulray', 'gmail.com'].join(String.fromCharCode(64));
  document.querySelectorAll('[data-mail]').forEach(function (a) { a.href = 'mailto:' + MAIL; });
  window.copyEmail = function () {
    if (navigator.clipboard) navigator.clipboard.writeText(MAIL).then(function () { toast('Email copied: ' + MAIL); }, function () { location.href = 'mailto:' + MAIL; });
    else location.href = 'mailto:' + MAIL;
  };

  /* ─── theme ─── */
  var themeBtn = document.getElementById('themeBtn');
  function applyTheme(t) {
    if (t === 'light') root.dataset.theme = 'light'; else delete root.dataset.theme;
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(t === 'light'));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'light' ? '#f6f0e3' : '#060913';
    try { localStorage.setItem('mr-theme', t); } catch (e) {}
  }
  function toggleTheme(e) {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (!document.startViewTransition || reduce) { applyTheme(next); return; }
    /* circular reveal from the button */
    var r = themeBtn ? themeBtn.getBoundingClientRect() : { left: innerWidth / 2, top: 0, width: 0, height: 0 };
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt-theme');
    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    vt.finished.then(function () { root.classList.remove('vt-theme'); }, function () { root.classList.remove('vt-theme'); });
  }
  if (themeBtn) {
    themeBtn.setAttribute('aria-pressed', String(root.dataset.theme === 'light'));
    themeBtn.addEventListener('click', toggleTheme);
  }

  /* ─── ambient sound: generated live with Web Audio (no files, no licensing) ─── */
  var soundBtn = document.getElementById('soundBtn');
  var ctx = null, master = null, chimeTimer = 0, playing = false;
  var NOTES = [880, 987.77, 1108.73, 1318.51, 1479.98, 1760, 1975.53]; /* A major pentatonic, high */
  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    /* shimmer: feedback delay */
    var delay = ctx.createDelay(); delay.delayTime.value = 0.42;
    var fb = ctx.createGain(); fb.gain.value = 0.38;
    var wet = ctx.createGain(); wet.gain.value = 0.32;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    master.shimmer = delay;
    /* pad: A2 E3 A3 C#4, detuned pairs through a slowly breathing low-pass */
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820; lp.Q.value = 0.6; lp.connect(master);
    [110, 164.81, 220, 277.18].forEach(function (f, i) {
      [-7, 7].forEach(function (d) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = d;
        g.gain.value = i < 2 ? 0.055 : 0.03;
        o.connect(g); g.connect(lp); o.start();
      });
    });
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.045; lg.gain.value = 380; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    return true;
  }
  function chime() {
    if (!playing) return;
    var t = ctx.currentTime, f = NOTES[Math.floor(Math.random() * NOTES.length)];
    [[f, 0.05, 3.6], [f * 2.01, 0.012, 1.8]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = p[0];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(p[1], t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
      o.connect(g); g.connect(master); g.connect(master.shimmer);
      o.start(t); o.stop(t + p[2] + 0.1);
    });
    chimeTimer = setTimeout(chime, 1600 + Math.random() * 3800);
  }
  function setSound(on) {
    if (on && !ctx && !build()) return;
    playing = on;
    try { sessionStorage.setItem('mr-sound', on ? 'on' : 'off'); } catch (e) {}
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.setAttribute('aria-label', on ? 'Turn ambient sound off' : 'Turn ambient sound on');
    }
    if (!ctx) return;
    var t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    clearTimeout(chimeTimer);
    if (on) {
      ctx.resume();
      master.gain.linearRampToValueAtTime(0.2, t + 2.5);
      chimeTimer = setTimeout(chime, 900);
    } else {
      master.gain.linearRampToValueAtTime(0, t + 0.8);
      setTimeout(function () { if (!playing) ctx.suspend(); }, 900);
    }
  }
  if (soundBtn) soundBtn.addEventListener('click', function () { setSound(!playing); });
  /* remember the choice so the ambience follows you between pages; browsers only
     allow audio after an interaction, so resume on the first click or key press */
  var wantSound = false;
  try { wantSound = sessionStorage.getItem('mr-sound') === 'on'; } catch (e) {}
  if (wantSound) {
    if (soundBtn) { soundBtn.setAttribute('aria-pressed', 'true'); soundBtn.setAttribute('aria-label', 'Ambient sound paused; it resumes on your next click or key press'); }
    var kick = function (e) {
      if (soundBtn && soundBtn.contains(e.target)) return; /* the button handles itself */
      ['pointerdown', 'keydown'].forEach(function (t) { document.removeEventListener(t, kick, true); });
      if (!playing) setSound(true);
    };
    ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, kick, true); });
    if (soundBtn) soundBtn.addEventListener('click', function () {
      ['pointerdown', 'keydown'].forEach(function (t) { document.removeEventListener(t, kick, true); });
    });
  }
  document.addEventListener('visibilitychange', function () {
    if (!ctx || !playing) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  /* ─── command palette (Ctrl/⌘ K, or "/") ─── */
  var go = function (href) { return function () {
    var el = href.charAt(0) === '#' && document.querySelector(href);
    if (el) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', href); }
    else location.href = href;
  }; };
  var open = function (url) { return function () { window.open(url, '_blank', 'noopener'); }; };
  var projects = ['PharmaChain', 'Nemesis', 'EmpathRAG', 'RECON', 'Irminsul', 'DocPilot', 'VR Generation'];
  var items = [
    { g: 'Navigate', t: 'Projects', run: go(home('#projects')) },
    { g: 'Navigate', t: 'Experience', run: go(home('#experience')) },
    { g: 'Navigate', t: 'Education', run: go(home('#education')) },
    { g: 'Navigate', t: 'Skills', run: go(home('#skills')) },
    { g: 'Navigate', t: 'Beyond code', run: go(home('#beyond')) },
    { g: 'Navigate', t: 'Contact', run: go(home('#contact')) },
    { g: 'Navigate', t: onHome ? 'Journal' : 'Home', run: go(onHome ? 'journal.html' : 'index.html') }
  ];
  projects.forEach(function (name, i) {
    items.push({ g: 'Projects', t: name, hint: 'project', run: function () {
      if (!onHome) { location.href = 'index.html#projects'; return; }
      var tab = document.getElementById('tab-' + i);
      document.getElementById('projects').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      if (tab) tab.click();
    } });
  });
  items.push(
    { g: 'Links', t: 'Resumé (PDF)', hint: 'opens', run: open('assets/Mukul_Rayana_Resume.pdf') },
    { g: 'Links', t: 'GitHub', hint: 'opens', run: open('https://github.com/MukulRay1603') },
    { g: 'Links', t: 'LinkedIn', hint: 'opens', run: open('https://linkedin.com/in/mukul-rayana') },
    { g: 'Links', t: 'Hugging Face', hint: 'opens', run: open('https://huggingface.co/spaces/MukulRay') },
    { g: 'Links', t: 'PharmaChain live demo', hint: 'opens', run: open('https://ai-cargo-monitor-prod.vercel.app') },
    { g: 'Actions', t: 'Copy email address', run: function () { window.copyEmail(); } },
    { g: 'Actions', t: 'Toggle daylight theme', run: function () { toggleTheme(); } },
    { g: 'Actions', t: 'Toggle ambient sound', run: function () { setSound(!playing); } }
  );

  var dlg = document.createElement('dialog');
  dlg.className = 'cmdk';
  dlg.setAttribute('aria-label', 'Command palette');
  dlg.innerHTML =
    '<div class="cmdk-in"><svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></g></svg>' +
    '<input type="text" role="combobox" aria-expanded="true" aria-controls="cmdkList" aria-autocomplete="list" placeholder="Jump to a section, project or link…" autocomplete="off" spellcheck="false"></div>' +
    '<div class="cmdk-list" id="cmdkList" role="listbox" aria-label="Results"></div>' +
    '<div class="cmdk-foot" aria-hidden="true"><span>↑↓ move</span><span>Enter open</span><span>Esc close</span></div>';
  document.body.appendChild(dlg);
  var input = dlg.querySelector('input'), list = dlg.querySelector('.cmdk-list');
  var shown = [], active = 0;

  function render() {
    var q = input.value.trim().toLowerCase();
    shown = items.filter(function (it) { return !q || (it.t + ' ' + it.g).toLowerCase().indexOf(q) > -1; });
    active = Math.min(active, Math.max(0, shown.length - 1));
    var html = '', last = '';
    shown.forEach(function (it, i) {
      if (it.g !== last) { html += '<div class="cmdk-group" role="presentation">' + it.g + '</div>'; last = it.g; }
      html += '<div class="cmdk-item" role="option" id="cmdk-' + i + '" data-i="' + i + '" aria-selected="' + (i === active) + '"><span>' + it.t + '</span>' + (it.hint ? '<small>' + it.hint + '</small>' : '') + '</div>';
    });
    list.innerHTML = html || '<p class="cmdk-empty">No matches</p>';
    input.setAttribute('aria-activedescendant', shown.length ? 'cmdk-' + active : '');
  }
  function move(d) {
    if (!shown.length) return;
    active = (active + d + shown.length) % shown.length;
    list.querySelectorAll('.cmdk-item').forEach(function (el) { el.setAttribute('aria-selected', String(+el.dataset.i === active)); });
    var el = document.getElementById('cmdk-' + active);
    if (el) el.scrollIntoView({ block: 'nearest' });
    input.setAttribute('aria-activedescendant', 'cmdk-' + active);
  }
  function runActive() { var it = shown[active]; if (!it) return; dlg.close(); it.run(); }
  function openPalette() {
    if (dlg.open) return;
    input.value = ''; active = 0; render();
    dlg.showModal(); input.focus();
  }
  input.addEventListener('input', function () { active = 0; render(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runActive(); }
  });
  list.addEventListener('mousemove', function (e) {
    var el = e.target.closest('.cmdk-item');
    if (el && +el.dataset.i !== active) { active = +el.dataset.i - 0; move(0); }
  });
  list.addEventListener('click', function (e) { var el = e.target.closest('.cmdk-item'); if (el) { active = +el.dataset.i; runActive(); } });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea|select/i.test((e.target.tagName || '')) || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); dlg.open ? dlg.close() : openPalette(); }
    else if (e.key === '/' && !typing && !dlg.open) { e.preventDefault(); openPalette(); }
  });
  var searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', openPalette);
    if (!/Mac|iPhone|iPad/.test(navigator.platform || '')) { var k = searchBtn.querySelector('kbd'); if (k) k.textContent = 'Ctrl K'; }
  }


  /* ─── gold cursor: dot + trailing ring (fine pointers, full tier) ─── */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cur'; ring.className = 'cur-r';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.body.appendChild(dot);
    var tx = -100, ty = -100, rx = -100, ry = -100, moving = false;
    function follow() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      if (Math.abs(tx - rx) > 0.3 || Math.abs(ty - ry) > 0.3) requestAnimationFrame(follow); else moving = false;
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || (!e.clientX && !e.clientY)) return;
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      if (!dot.classList.contains('on')) { dot.classList.add('on'); ring.classList.add('on'); root.classList.add('has-cursor'); }
      if (!moving) { moving = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var h = !!e.target.closest('a, button, [role="tab"], .cmdk-item, .hobby');
      dot.classList.toggle('hover', h); ring.classList.toggle('hover', h);
    });
    document.documentElement.addEventListener('mouseleave', function () { dot.classList.remove('on'); ring.classList.remove('on'); });
    new MutationObserver(function () {
      var modal = !!document.querySelector('dialog[open]');
      root.classList.toggle('modal-open', modal);
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  }

  /* small toast for confirmations */
  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1800);
  }
})();
