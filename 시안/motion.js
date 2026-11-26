/* 시안 공통 애니메이션
   - <body data-reveal="선택자,..."> : 화면에 들어올 때 아래에서 떠오름 (같은 부모 안에서는 차례로)
   - data-reveal-img="선택자"         : 사진이 위에서 아래로 열림
   - [data-count]                     : 숫자가 0부터 올라감
   - .marquee                         : 가로로 흐르는 띠 (마우스 올리면 멈춤)
   - 사용자가 '동작 줄이기'를 켜 두면 모두 끔 */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = document.createElement('style');
  css.textContent =
    '.rv{opacity:0;transform:translateY(32px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}' +
    '.rv.in{opacity:1;transform:none}' +
    '.rvi{clip-path:inset(0 0 100% 0);transition:clip-path 1.2s cubic-bezier(.7,0,.2,1)}' +
    '.rvi.in{clip-path:inset(0 0 0 0)}' +
    '.marquee{overflow:hidden;white-space:nowrap}' +
    '.marquee>div{display:inline-flex;animation:mq 40s linear infinite}' +
    '.marquee:hover>div{animation-play-state:paused}' +
    '@keyframes mq{to{transform:translateX(-50%)}}' +
    '.intro-a{animation:ia 1.1s cubic-bezier(.2,.7,.2,1) both}' +
    '@keyframes ia{from{opacity:0;transform:translateY(40px)}}' +
    '@media (prefers-reduced-motion:reduce){.rv,.rvi{opacity:1!important;transform:none!important;clip-path:none!important;transition:none!important}.marquee>div,.intro-a{animation:none!important}}';
  document.head.appendChild(css);

  function init() {
    // 흐르는 띠: 내용을 한 번 더 붙여 끊김 없이
    document.querySelectorAll('.marquee>div').forEach(function (d) { d.innerHTML += d.innerHTML; });
    // 첫 화면 문구: 차례로 등장
    document.querySelectorAll('[data-intro]').forEach(function (e, i) {
      e.classList.add('intro-a'); e.style.animationDelay = (0.15 + i * 0.18) + 's';
    });
    if (reduce || !('IntersectionObserver' in window)) return;

    var sel = document.body.dataset.reveal, imgSel = document.body.dataset.revealImg;
    var items = sel ? [].slice.call(document.querySelectorAll(sel)) : [];
    var imgs = imgSel ? [].slice.call(document.querySelectorAll(imgSel)) : [];
    items.forEach(function (e) {
      var sib = [].filter.call(e.parentNode.children, function (c) { return items.indexOf(c) > -1; });
      e.classList.add('rv'); e.style.transitionDelay = Math.min(sib.indexOf(e), 5) * 0.09 + 's';
    });
    imgs.forEach(function (e) { e.classList.add('rvi'); });

    // 잘려 있는 사진(clip-path)은 자기 자신이 '안 보임'으로 잡히므로 부모를 지켜본다
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        [x.target].concat(x.target._rv || []).forEach(function (t) { t.classList.add('in'); });
        io.unobserve(x.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (e) { io.observe(e); });
    imgs.forEach(function (e) { var p = e.parentNode; (p._rv = p._rv || []).push(e); io.observe(p); });

    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        cio.unobserve(x.target);
        var el = x.target, to = +el.dataset.count, from = to > 1900 ? 1900 : 0, t0 = null;
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1600, 1), v = from + (to - from) * (1 - Math.pow(1 - p, 3));
          el.textContent = to > 1900 ? Math.round(v) : Math.round(v).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (e) { e.textContent = e.dataset.count > 1900 ? '1900' : '0'; cio.observe(e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
