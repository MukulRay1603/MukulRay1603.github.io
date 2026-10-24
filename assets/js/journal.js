(function () {
  /* star layers drift at three speeds on scroll */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var st = document.querySelectorAll('.cosmos .st'), K = [0.03, 0.08, 0.16], H = [320, 560, 900], tk = false;
    window.addEventListener('scroll', function () {
      if (tk) return; tk = true;
      requestAnimationFrame(function () {
        st.forEach(function (el, i) { el.style.transform = 'translate3d(0,' + (-((window.scrollY * K[i]) % H[i])).toFixed(2) + 'px,0)'; });
        tk = false;
      });
    }, { passive: true });
  }

  /* reading dialogs: native <dialog> handles focus trap + Escape */
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var d = document.getElementById(btn.dataset.open);
      if (!d) return;
      d.showModal();
      d.scrollTop = 0;
      document.body.style.overflow = 'hidden';
    });
  });
  document.querySelectorAll('dialog.read').forEach(function (d) {
    d.addEventListener('close', function () { document.body.style.overflow = ''; });
    d.querySelector('.read-close').addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); /* backdrop */
  });

  /* carousel buttons scroll the snap track by one slide */
  document.querySelectorAll('.carousel').forEach(function (c) {
    var track = c.querySelector('.slides');
    function go(dir) {
      var w = track.clientWidth, max = track.scrollWidth - w;
      var x = track.scrollLeft + dir * w;
      if (x > max + 2) x = 0; else if (x < -2) x = max;
      track.scrollTo({ left: x, behavior: 'smooth' });
    }
    c.querySelector('.c-prev').addEventListener('click', function () { go(-1); });
    c.querySelector('.c-next').addEventListener('click', function () { go(1); });
  });
})();
