/* Runs before first paint: clickjacking guard, saved theme, device tier, intro flag. */
if (window.top !== window.self) {
  try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; }
}
/* quality tiers, best to leanest: high > medium > light > lean.
   Picked here from the device before first paint; a smoothness governor in home.js can step it later.
   'lite' stays as the class for light and lean, so the older lite rules keep working. Test with ?fx=high|medium|light|lean. */
(function () {
  var d = document.documentElement, n = navigator, c = n.connection || {}, mm = function (q) { return window.matchMedia && matchMedia(q).matches; };
  var ORDER = ['lean', 'light', 'medium', 'high'];
  function apply(t) { d.dataset.tier = t; d.classList.toggle('lite', t === 'light' || t === 'lean'); d.classList.toggle('lean', t === 'lean'); }
  var q = (location.search.match(/[?&]fx=(high|medium|light|lean|full|lite)\b/) || [])[1];
  if (q) q = q === 'full' ? 'high' : q === 'lite' ? 'light' : q;
  var forced = q || null; try { forced = forced || localStorage.getItem('mr-fx'); } catch (e) {}
  if (forced && ORDER.indexOf(forced) < 0) forced = null;
  var cores = n.hardwareConcurrency || 4, mem = n.deviceMemory || 8, et = c.effectiveType || '', touch = mm('(pointer: coarse)');
  var spec = 'high';
  if (c.saveData || /(^|-)2g/.test(et) || mm('(prefers-reduced-data: reduce)') || cores <= 2 || mem < 2) spec = 'lean';
  else if (et === '3g' || mem <= 2 || (cores <= 4 && mem <= 3)) spec = 'light';
  else if (touch || cores <= 4 || mem <= 4) spec = 'medium';
  if (mm('(prefers-reduced-motion: reduce)') && ORDER.indexOf(spec) > 1) spec = 'light';
  var learned = null; try { learned = sessionStorage.getItem('mr-tier'); } catch (e) {}
  apply(forced || (learned && ORDER.indexOf(learned) > -1 && ORDER.indexOf(learned) < ORDER.indexOf(spec) ? learned : spec));
  window.mrTier = {
    order: ORDER, spec: spec, forced: !!forced,
    get: function () { return d.dataset.tier; },
    set: function (t, why) {
      if (ORDER.indexOf(t) < 0 || t === d.dataset.tier) return;
      apply(t); try { if (!forced) sessionStorage.setItem('mr-tier', t); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent('tierchange', { detail: { tier: t, why: why } })); } catch (e) {}
    }
  };
})();
(function () {
  var d = document.documentElement, n = navigator, c = n.connection || {};
  try { var t = localStorage.getItem('mr-theme'); if (t === 'light') document.documentElement.dataset.theme = 'light'; } catch (e) {}
  d.classList.add('js');
  try { if (localStorage.getItem('mr-sky') === 'midnight' || /[?&]midnight(=|&|$)/.test(location.search)) { d.classList.add('midnight'); var m = document.querySelector('meta[name="theme-color"]'); if (m && d.dataset.theme !== 'light') m.content = '#060913'; } } catch (e) {} /* easter egg */
  try { if (sessionStorage.getItem('mr-intro') || location.hash || (document.referrer && new URL(document.referrer).origin === location.origin) || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 700px)').matches) d.classList.add('intro-done'); } catch (e) { d.classList.add('intro-done'); }
  if (d.classList.contains('lean')) d.classList.add('intro-done'); /* lean skips the opening animation */
})();
