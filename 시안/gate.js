/* 첫 화면 계열사 선택 — 한방유비스 대표홈페이지 위에 덮이는 첫 화면
   - 한방유비스를 고르면 덮개가 위로 걷히며 바로 메인으로 (주소는 그대로라 검색 노출에 손해 없음)
   - 다른 회사를 고르면 그 회사 홈페이지로 이동
   - 새로 접속할 때마다 한 번 뜸, "다음부터 바로 한방유비스로"를 고르면 다시 안 뜸
   - 주소 끝에 ?gate=1 을 붙이면 기억을 무시하고 다시 보여 줌, ?gate=0 이면 띄우지 않음 (확인·캡처용)
   - 회사 목록·사진·문구·켜고 끄기는 관리자 "메인 화면 구성 › 첫 화면 계열사 선택"에서 관리 */
(function () {
  var CO = [
    { k: 'hb', nm: '한방', en: 'HANBANG', c: '#2b4a7a', img: 'img/hero_complex.jpg', d: '회사 소개 한 줄 — 자료 받아서 작성', url: 'https://hanbang1947.co.kr', host: 'hanbang1947.co.kr' },
    { k: 'ubis', nm: '한방유비스', en: 'HANBANG UBIS', c: '#bc1616', img: 'img/hero_airport.jpg', d: '공항·초고층·플랜트의 소방설계와 감리, 성능위주설계', url: '', host: '지금 보는 홈페이지', me: 1 },
    { k: 'kubis', nm: '케이유비스', en: 'K-UBIS', c: '#0f766e', img: 'img/p_tower3.jpg', d: '신설 법인 — 사업 소개 받아서 작성', url: '#kubis', host: '주소 받기', tag: 'NEW' },
    { k: 'ai', nm: 'AI 계열사', en: 'HANBANG AI', c: '#5b3fd1', img: 'img/p_data.jpg', d: '소방 데이터·AI 엔지니어링 — 빅데이터, AI 설계 검토', url: '#ai', host: '주소 받기', tag: '가칭' }];
  var q = new URLSearchParams(location.search), force = q.get('gate') === '1';
  if (q.get('gate') === '0') return; /* 화면 캡처용 */
  if (!force && (localStorage.getItem('kfubis_gate') === 'skip' || sessionStorage.getItem('kfubis_gate') === 'seen')) return;
  var en = q.get('lang') === 'en';

  var css = document.createElement('style');
  css.textContent =
    '.gt{position:fixed;inset:0;z-index:9999;background:#0b0d11;color:#fff;font-family:Pretendard,"Malgun Gothic",sans-serif;display:flex;flex-direction:column;transition:transform 1s cubic-bezier(.7,0,.2,1),opacity .6s;word-break:keep-all}' +
    '.gt.out{transform:translateY(-100%)}' +
    '.gt-top{position:absolute;z-index:3;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;padding:30px 44px}' +
    '.gt-top b{letter-spacing:.16em;font-size:14px}.gt-top b small{letter-spacing:.02em;opacity:.7;font-weight:600;margin-left:8px;font-size:12px}' +
    '.gt-top span{font-size:13px;opacity:.75}' +
    '.gt-in{position:absolute;z-index:3;left:44px;right:44px;top:96px;pointer-events:none}' +
    '.gt-in h1{font-size:clamp(26px,3vw,44px);font-weight:800;letter-spacing:-.03em;line-height:1.25;animation:gtu 1s .2s both}' +
    '.gt-in p{opacity:.75;margin-top:8px;animation:gtu 1s .4s both}' +
    '@keyframes gtu{from{opacity:0;transform:translateY(24px)}}' +
    '.gt-row{flex:1;display:flex}' +
    '.gt a{position:relative;flex:1;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;padding:0 34px 86px;border-left:1px solid rgba(255,255,255,.12);color:#fff;text-decoration:none;transition:flex .6s cubic-bezier(.2,.7,.2,1);animation:gtp .9s both}' +
    '.gt a:nth-child(2){animation-delay:.1s}.gt a:nth-child(3){animation-delay:.2s}.gt a:nth-child(4){animation-delay:.3s}' +
    '@keyframes gtp{from{opacity:0;transform:translateY(40px)}}' +
    '.gt a:first-child{border-left:0}' +
    '.gt a img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(.7) brightness(.42);transform:scale(1.08);transition:filter .6s,transform 1.2s}' +
    '.gt a::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.85),rgba(0,0,0,.1) 60%)}' +
    '.gt a::before{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;background:var(--c);z-index:2;transform:scaleX(0);transform-origin:left;transition:transform .5s}' +
    '.gt a>*{position:relative;z-index:1}' +
    '.gt a:hover,.gt a:focus-visible{flex:1.9;outline:none}.gt a:hover img,.gt a:focus-visible img{filter:brightness(.6);transform:scale(1)}.gt a:hover::before,.gt a:focus-visible::before{transform:scaleX(1)}' +
    '.gt a.me::before{transform:scaleX(1)}' +
    '.gt .no{font-size:13px;opacity:.6;font-weight:700;letter-spacing:.1em}' +
    '.gt h2{font-size:clamp(22px,2.3vw,36px);font-weight:800;letter-spacing:-.03em;margin:6px 0 2px;white-space:nowrap}' +
    '.gt h2 i{font-style:normal;font-size:11px;font-weight:700;background:var(--c);padding:2px 8px;margin-left:8px;vertical-align:4px;letter-spacing:0}' +
    '.gt .en{font-size:12px;letter-spacing:.16em;opacity:.65}' +
    '.gt .d{max-height:0;overflow:hidden;opacity:0;transition:max-height .6s,opacity .6s;font-size:15px;color:#d1d5db;margin-top:12px;max-width:420px}' +
    '.gt a:hover .d,.gt a:focus-visible .d{max-height:120px;opacity:1}' +
    '.gt .go{margin-top:16px;font-weight:700;font-size:14px;opacity:.9}' +
    '.gt-ft{position:absolute;z-index:3;left:0;right:0;bottom:0;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:20px 44px;font-size:13px;background:linear-gradient(0deg,rgba(0,0,0,.6),transparent)}' +
    '.gt-ft label{display:flex;gap:8px;align-items:center;cursor:pointer}' +
    '.gt-ft button{background:none;border:1px solid rgba(255,255,255,.5);color:#fff;padding:7px 14px;font:inherit;cursor:pointer}' +
    '@media (max-width:900px){.gt{overflow:auto}.gt-in{position:relative;left:auto;right:auto;top:auto;padding:84px 22px 20px}.gt-top{padding:22px}' +
    '.gt-row{flex-direction:column;flex:none}.gt a{min-height:170px;flex:none!important;padding:0 22px 22px;border-left:0;border-top:1px solid rgba(255,255,255,.12)}' +
    '.gt a img{filter:grayscale(.3) brightness(.5)}.gt .d{max-height:none;opacity:1;font-size:13.5px;margin-top:4px}.gt-ft{position:relative;padding:18px 22px 26px}}' +
    '@media (prefers-reduced-motion:reduce){.gt,.gt *{animation:none!important;transition:none!important}}';
  document.head.appendChild(css);

  var g = document.createElement('div'); g.className = 'gt'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-label', '계열사 선택');
  g.innerHTML = '<div class="gt-top"><b>HANBANG GROUP<small>' + (en ? 'Hanbang Group' : '한방그룹') + '</small></b><span>' + (en ? 'Choose a company' : '회사를 선택하세요') + '</span></div>' +
    '<div class="gt-in"><h1>' + (en ? 'Since 1947,<br>every step of fire safety' : '1947년부터,<br>대한민국 화재안전의 모든 단계') + '</h1><p>' + (en ? 'Select the company you are looking for' : '찾으시는 회사를 선택하세요') + '</p></div>' +
    '<div class="gt-row">' + CO.map(function (c, i) {
      return '<a href="' + (c.me ? '#' : c.url) + '" class="' + (c.me ? 'me' : '') + '" data-me="' + (c.me ? 1 : '') + '" style="--c:' + c.c + '"><img src="' + c.img + '" alt=""><span class="no">0' + (i + 1) + '</span>' +
        '<h2>' + c.nm + (c.tag ? '<i>' + c.tag + '</i>' : '') + '</h2><span class="en">' + c.en + '</span><p class="d">' + c.d + '</p><span class="go">' + (c.me ? (en ? 'Enter →' : '홈페이지 들어가기 →') : c.host + ' ↗') + '</span></a>';
    }).join('') + '</div>' +
    '<div class="gt-ft"><label><input type="checkbox" id="gtRem"> ' + (en ? 'Go straight to Hanbang UBIS next time' : '다음부터 바로 한방유비스로') + '</label><button type="button" id="gtSkip">' + (en ? 'Skip' : '건너뛰기') + '</button></div>';
  document.body.appendChild(g);
  var prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';

  function close() {
    if (document.getElementById('gtRem').checked) localStorage.setItem('kfubis_gate', 'skip');
    sessionStorage.setItem('kfubis_gate', 'seen');
    g.classList.add('out'); document.body.style.overflow = prevOverflow;
    setTimeout(function () { g.remove(); }, 1100);
  }
  g.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (a.dataset.me) { e.preventDefault(); close(); return; }
      if (document.getElementById('gtRem').checked) localStorage.setItem('kfubis_gate', 'skip');
      sessionStorage.setItem('kfubis_gate', 'seen');
    });
  });
  document.getElementById('gtSkip').onclick = close;
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.contains(g)) close(); });
  setTimeout(function () { var me = g.querySelector('a.me'); if (me) me.focus({ preventScroll: true }); }, 50);
})();
