/* 시안 공통 애니메이션 — 사용자 동작(스크롤·마우스)에만 반응 (11/26 한방유비스 검토의견 반영)
   - 페이지를 열자마자 저절로 움직이는 것은 없음: 첫 화면 등장 효과·자동 넘김·흐르는 띠·반복 효과 없음
   - <body data-reveal="선택자,..."> : 스크롤해서 화면에 들어올 때만 살짝 떠오름 (처음부터 보이는 것은 그대로 보임)
   - [data-count]                     : 스크롤해서 보일 때 숫자가 올라감 (처음부터 보이면 최종 숫자)
   - .marquee                         : 움직이지 않는 로고 목록
   - 사용자가 '동작 줄이기'를 켜 두면 모두 끔 */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = document.createElement('style');
  css.textContent =
    '.rv{opacity:0;transform:translateY(16px);transition:opacity .6s ease-out,transform .6s ease-out}' +
    '.rv.in{opacity:1;transform:none}' +
    '.marquee{overflow:visible;white-space:normal}' +
    '.marquee>div{display:flex!important;flex-wrap:wrap;justify-content:space-around;gap:10px 40px;animation:none!important}' +
    '.marquee>div>*{margin-right:0!important}' +
    '@media (prefers-reduced-motion:reduce){.rv{opacity:1!important;transform:none!important;transition:none!important}}';
  document.head.appendChild(css);

  // 사용자가 스크롤하기 전에는 아무것도 움직이지 않음 (사진이 늦게 읽혀 자리가 밀려도)
  var scrolled = false;
  ['wheel', 'touchmove', 'keydown'].forEach(function (t) { addEventListener(t, function () { scrolled = true; }, { passive: true, once: true }); });
  addEventListener('scroll', function () { if (scrollY > 0) scrolled = true; }, { passive: true });
  var show = function (e) { e.style.transition = 'none'; e.classList.add('in'); void e.offsetWidth; e.style.transition = ''; };

  function init() {
    var vh = window.innerHeight;
    var onScreen = function (e) { var r = e.getBoundingClientRect(); return r.top < vh && r.bottom > 0; };

    // 숫자: 처음부터 보이면 최종값, 아래에 있으면 스크롤해서 보일 때 올라감
    var counts = [].slice.call(document.querySelectorAll('[data-count]'));
    var fin = function (el) { var to = +el.dataset.count; el.textContent = to > 1900 ? to : to.toLocaleString(); };
    if (reduce || !('IntersectionObserver' in window)) { counts.forEach(fin); return; }

    var sel = document.body.dataset.reveal;
    var items = sel ? [].slice.call(document.querySelectorAll(sel)) : [];
    items = items.filter(function (e) { return !onScreen(e); }); // 첫 화면에 보이는 것은 움직이지 않음
    items.forEach(function (e) {
      var sib = [].filter.call(e.parentNode.children, function (c) { return items.indexOf(c) > -1; });
      e.style.transition = 'none'; e.classList.add('rv'); // 숨기는 것도 효과 없이 바로
      e.dataset.d = Math.min(sib.indexOf(e), 3) * 0.06 + 's';
    });
    if (items.length) void document.body.offsetWidth;
    items.forEach(function (e) { e.style.transition = ''; e.style.transitionDelay = e.dataset.d; });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (!x.isIntersecting) return; if (scrolled) x.target.classList.add('in'); else show(x.target); io.unobserve(x.target); });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (e) { io.observe(e); });

    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        cio.unobserve(x.target);
        if (!scrolled) { fin(x.target); return; }
        var el = x.target, to = +el.dataset.count, from = to > 1900 ? 1900 : 0, t0 = null;
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1200, 1), v = from + (to - from) * (1 - Math.pow(1 - p, 3));
          el.textContent = to > 1900 ? Math.round(v) : Math.round(v).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counts.forEach(function (e) {
      if (onScreen(e)) { fin(e); return; }
      e.textContent = e.dataset.count > 1900 ? '1900' : '0'; cio.observe(e);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
