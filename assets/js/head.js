/* Runs before first paint: clickjacking guard, saved theme, device tier, intro flag. */
if (window.top !== window.self) {
  try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; }
}
/* device tier: 'lite' trims layers on weak hardware, data-saver or slow networks; a runtime FPS probe can add it later */
(function () {
  var d = document.documentElement, n = navigator, c = n.connection || {};
  try { var t = localStorage.getItem('mr-theme'); if (t === 'light') document.documentElement.dataset.theme = 'light'; } catch (e) {}
  var fx = (location.search.match(/[?&]fx=(full|lite)/) || [])[1];
  d.classList.add('js');
  try { if (sessionStorage.getItem('mr-intro') || location.hash || (document.referrer && new URL(document.referrer).origin === location.origin) || matchMedia('(prefers-reduced-motion: reduce)').matches) d.classList.add('intro-done'); } catch (e) { d.classList.add('intro-done'); }
  if (fx) { d.dataset.fx = fx; if (fx === 'lite') d.classList.add('lite'); return; }
  if ((n.hardwareConcurrency && n.hardwareConcurrency <= 2) || (n.deviceMemory && n.deviceMemory <= 2) || c.saveData ||
      /(^|-)2g/.test(c.effectiveType || '') || matchMedia('(prefers-reduced-data: reduce)').matches) d.classList.add('lite');
})();
