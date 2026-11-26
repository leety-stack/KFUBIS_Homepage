/* 한방유비스 홈페이지 관리자 시안 — 대시보드·게시판·접수함·설정 화면
   메뉴 관리 / 페이지 편집 / 팝업은 관리자.html 안의 스크립트(사이트 구성)가 맡는다. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var IMGS = ['img/p_lotte.jpg', 'img/hero_airport.jpg', 'img/hero_coast.jpg', 'img/hero_complex.jpg', 'img/p_tower1.jpg', 'img/p_tower3.jpg', 'img/p_tower4.jpg', 'img/p_night.jpg', 'img/p_data.jpg', 'img/cert_ai.jpg'];
  var sw = function (on, attr) { return '<label class="sw"' + (attr || '') + '><input type="checkbox"' + (on ? ' checked' : '') + '><span></span></label>'; };
  var tag = function (t) { var m = { '게시': 't-on', '노출 중': 't-on', '완료': 't-on', '발급 완료': 't-on', '사용': 't-on', '수행 중': 't-on', '모집 중': 't-on', '신규': 't-new', '처리 중': 't-wait', '임시저장': 't-wait', '예약': 't-wait', '서류 검토': 't-wait', '확인 필요': 't-wait', '숨김': 't-off', '마감': 't-off', '중지': 't-off', '만료 임박': 't-new' }; return '<span class="tag ' + (m[t] || 't-off') + '">' + E(t) + '</span>'; };

  /* ───────────── 화면 목록 ───────────── */
  var TT = {
    dash: '대시보드', main: '메인 화면 구성', banner: '메인 배너', menu: '메뉴 관리', page: '페이지 편집', popup: '팝업 관리',
    works: '실적 관리', news: '소식·보도자료', rnd: 'R&D 과제', certs: '인증·수상·특허', files: '자료실', jobs: '채용공고',
    inquiry: '문의 관리', certreq: '실적증명 요청', apply: '입사 지원',
    company: '회사 정보·하단 문구', i18n: '다국어 문구', seo: '검색 노출 (SEO)', users: '관리자 계정·권한', stats: '접속 통계', history: '변경 이력·되돌리기'
  };
  var built = {};
  function view(v) {
    if (!TT[v]) v = 'dash';
    if (!built[v] && R[v]) { R[v]($('#v-' + v)); built[v] = 1; }
    $$('.view').forEach(function (x) { x.classList.toggle('on', x.id === 'v-' + v); });
    $$('aside a[data-v]').forEach(function (a) { a.classList.toggle('on', a.dataset.v === v); });
    $('#ttl').textContent = TT[v]; $('#side').classList.remove('open'); scrollTo(0, 0);
    if (v === 'popup' && window.drawPop) drawPop();
    if (v === 'stats' || v === 'dash') $$('#v-' + v + ' [data-chart]').forEach(drawChart);
  }
  window.view = view;
  addEventListener('hashchange', function () { view(location.hash.slice(1)); });

  function head(t, p, btns) { return '<div class="ph"><div><h1>' + t + '</h1><p>' + p + '</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">' + (btns || '') + '</div></div>'; }
  var R = {};

  /* ───────────── 차트 (단일 계열, 남색, 마우스 올리면 값) ───────────── */
  var tip = document.createElement('div'); tip.className = 'ctip'; document.body.appendChild(tip);
  function showTip(e, html) { tip.innerHTML = html; tip.style.display = 'block'; var x = e.clientX + 14, y = e.clientY - 10; if (x + 180 > innerWidth) x = e.clientX - 190; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  function hideTip() { tip.style.display = 'none'; }
  function series(n, base, amp, seed) { var a = [], s = seed; for (var i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; var wk = (i % 7 === 5 || i % 7 === 6) ? .55 : 1; a.push(Math.round((base + amp * (s / 233280)) * wk)); } return a; }
  function drawChart(el) {
    var d = JSON.parse(el.dataset.chart), W = el.clientWidth || 600, H = +el.dataset.h || 220, P = { l: 40, r: 12, t: 14, b: 26 };
    var max = Math.max.apply(null, d.v) * 1.15, n = d.v.length, iw = W - P.l - P.r, ih = H - P.t - P.b;
    var X = function (i) { return P.l + iw * (n === 1 ? .5 : i / (n - 1)); }, Y = function (v) { return P.t + ih - ih * v / max; };
    var g = '', ticks = 4;
    for (var k = 0; k <= ticks; k++) { var v = Math.round(max / ticks * k), y = Y(v); g += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y + '" y2="' + y + '" class="gl"/><text x="' + (P.l - 8) + '" y="' + (y + 4) + '" class="ax" text-anchor="end">' + v.toLocaleString() + '</text>'; }
    var step = Math.ceil(n / 6); d.x.forEach(function (lb, i) { if (i % step === 0 || i === n - 1) g += '<text x="' + X(i) + '" y="' + (H - 6) + '" class="ax" text-anchor="middle">' + lb + '</text>'; });
    var pts = d.v.map(function (v, i) { return X(i) + ',' + Y(v); }).join(' ');
    g += '<polygon points="' + P.l + ',' + Y(0) + ' ' + pts + ' ' + X(n - 1) + ',' + Y(0) + '" class="ar"/><polyline points="' + pts + '" class="ln"/>';
    g += '<line class="xh" y1="' + P.t + '" y2="' + Y(0) + '" style="display:none"/><circle class="dot" r="4.5" style="display:none"/>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" role="img" aria-label="' + E(d.name) + '">' + g + '<rect x="' + P.l + '" y="' + P.t + '" width="' + iw + '" height="' + ih + '" fill="transparent" class="hit"/></svg>';
    var svg = el.firstChild, xh = $('.xh', svg), dot = $('.dot', svg);
    $('.hit', svg).addEventListener('mousemove', function (e) {
      var r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) * W / r.width, i = Math.max(0, Math.min(n - 1, Math.round((sx - P.l) / iw * (n - 1))));
      xh.setAttribute('x1', X(i)); xh.setAttribute('x2', X(i)); xh.style.display = ''; dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(d.v[i])); dot.style.display = '';
      showTip(e, '<small>' + d.x[i] + '</small><b>' + d.v[i].toLocaleString() + '</b> ' + d.unit);
    });
    $('.hit', svg).addEventListener('mouseleave', function () { xh.style.display = 'none'; dot.style.display = 'none'; hideTip(); });
  }
  function bars(items, unit) {
    var max = Math.max.apply(null, items.map(function (x) { return x[1]; }));
    return '<div class="hbars">' + items.map(function (x) { return '<div class="hb" data-t="' + E(x[0]) + '" data-v="' + x[1] + '"><span class="hb-l">' + E(x[0]) + '</span><span class="hb-t"><i style="width:' + (x[1] / max * 100) + '%"></i></span><span class="hb-v">' + x[1].toLocaleString() + unit + '</span></div>'; }).join('') + '</div>';
  }
  document.addEventListener('mousemove', function (e) { var b = e.target.closest && e.target.closest('.hb'); if (b) showTip(e, '<small>' + E(b.dataset.t) + '</small><b>' + (+b.dataset.v).toLocaleString() + '</b>'); else if (!e.target.closest || !e.target.closest('.hit')) hideTip(); });

  var days30 = []; for (var i = 29; i >= 0; i--) { var dd = new Date(2026, 10, 26 - i); days30.push((dd.getMonth() + 1) + '/' + dd.getDate()); }
  var visits30 = series(30, 220, 160, 7);

  /* ───────────── 대시보드 ───────────── */
  R.dash = function (el) {
    el.innerHTML = head('대시보드', '2026.11.26 (목) 기준 — 오늘 처리할 일과 홈페이지 현황') +
      '<div class="kpis">' +
      '<a class="kpi" href="#inquiry"><small>처리 대기 문의</small><b style="color:var(--pri)">3</b><span>신규 3 · 1영업일 넘은 것 0</span></a>' +
      '<a class="kpi" href="#stats"><small>방문자 (30일)</small><b>' + visits30.reduce(function (a, b) { return a + b; }, 0).toLocaleString() + '</b><span style="color:var(--ok)">지난 30일보다 12% 늘어남</span></a>' +
      '<a class="kpi" href="#inquiry"><small>이번 달 문의</small><b>27</b><span>공공 11 · 기업 13 · 기타 3</span></a>' +
      '<a class="kpi" href="#i18n"><small>영문 미입력</small><b style="color:var(--warn)">38</b><span>실적 31 · 문구 7</span></a></div>' +
      '<div class="row2">' +
      '<section class="panel"><div class="panel-hd"><h2>오늘 처리할 일</h2></div><ul class="todo">' +
      '<li><a href="#inquiry">' + tag('신규') + ' 사업 문의 3건 — 담당 본부 배정 완료, 회신 필요</a></li>' +
      '<li><a href="#certreq">' + tag('신규') + ' 실적증명 요청 1건 — ○○도시공사</a></li>' +
      '<li><a href="#page">' + tag('임시저장') + ' 페이지 "회사소개 › 인사말" 게시 전</a></li>' +
      '<li><a href="#popup">' + tag('예약') + ' 팝업 "연말연시 휴무 안내" 12.24 자동 시작</a></li>' +
      '<li><a href="#certs">' + tag('만료 임박') + ' 인증 "ISO 9001" 유효기간 12.31 — 갱신본 올리기</a></li>' +
      '<li><a href="#i18n">' + tag('확인 필요') + ' 영문 미입력 38건</a></li></ul></section>' +
      '<section class="panel"><div class="panel-hd"><h2>방문자 추이 (30일)</h2><a class="btn sm" href="#stats">통계 자세히</a></div><div class="panel-bd"><div data-chart=\'' + JSON.stringify({ name: '일별 방문자', x: days30, v: visits30, unit: '명' }) + '\' data-h="200"></div></div></section></div>' +
      '<div class="row2">' +
      '<section class="panel"><div class="panel-hd"><h2>최근 문의</h2><a class="btn sm" href="#inquiry">전체 보기</a></div><div class="tbl"><table><thead><tr><th>기관 / 분야</th><th>상태</th><th class="hide-m">담당</th></tr></thead><tbody>' +
      INQ.slice(0, 5).map(function (q) { return '<tr onclick="location.hash=\'inquiry\'"><td><b>' + E(q.org) + '</b><div class="sub">' + E(q.field) + ' · ' + q.at + '</div></td><td>' + tag(q.st) + '</td><td class="hide-m">' + E(q.dept) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<section class="panel"><div class="panel-hd"><h2>최근 변경</h2><a class="btn sm" href="#history">변경 이력</a></div><ul class="todo">' +
      HIST.slice(0, 5).map(function (h) { return '<li><span class="sub" style="min-width:86px">' + h.at.slice(5) + '</span><span><b>' + E(h.who) + '</b> — ' + E(h.where) + ' · ' + E(h.what) + '</span></li>'; }).join('') + '</ul></section></div>';
  };

  /* ───────────── 메인 화면 구성 ───────────── */
  var SECS = [
    { k: 'hero', n: '첫 화면 (메인 배너)', on: true, set: '배너 3개 · 6초마다 넘김', link: '#banner' },
    { k: 'clients', n: '발주처 이름 띠', on: true, set: '6곳', items: ['인천국제공항공사', '롯데', '현대자동차', '현대제철', '정부종합청사', '주한미군'] },
    { k: 'biz', n: '사업분야', on: true, set: '5개 본부 (사업분야 페이지에서 가져옴)' },
    { k: 'who', n: '발주처별 안내', on: true, set: '4개 유형' },
    { k: 'nums', n: '회사 소개 · 숫자', on: true, set: '1947 · 76 · 20 · 1급', nums: [['1947', '설립'], ['76', '특허'], ['20', '정부 포상·인증'], ['1', '소방시설 설계·감리업']] },
    { k: 'cases', n: '수행 사례', on: true, set: '실적에서 "메인 노출" 3건', link: '#works' },
    { k: 'news', n: '새소식', on: true, set: '최근 4건 자동' },
    { k: 'video', n: '홍보영상', on: false, set: 'YouTube 주소' },
    { k: 'inq', n: '사업 문의', on: true, set: '필수 3칸' }];
  R.main = function (el) {
    el.innerHTML = head('메인 화면 구성', '첫 화면 아래 영역의 순서와 노출을 정합니다. 끌어서 순서를 바꾸고, 영역을 눌러 내용을 고릅니다.', '<a class="btn" href="A_기업정통형.html" target="_blank">미리보기 ↗</a><button class="btn navy" data-save>저장</button>') +
      '<div class="mm"><section class="panel"><div class="panel-hd"><h2>영역 순서</h2><span class="help">⠿ 끌어서 순서 변경</span></div><div class="panel-bd"><ul class="secs" id="secs"></ul></div></section>' +
      '<section class="panel"><div class="panel-hd"><h2 id="sec-t">영역 설정</h2></div><div class="panel-bd" id="sec-p"></div>' +
      '<div class="panel-bd" style="border-top:1px solid var(--line)"><b style="font-size:13px">화면 순서 미리보기</b><div class="mini" id="mini"></div></div></section></div>';
    var cur = 4, dragI = null;
    function draw() {
      var ul = $('#secs'); ul.innerHTML = '';
      SECS.forEach(function (s, i) {
        var li = document.createElement('li'); li.draggable = i > 0; li.className = (i === cur ? 'sel ' : '') + (s.on ? '' : 'off');
        li.innerHTML = '<span class="hd2">' + (i > 0 ? '⠿' : '🔒') + '</span><span><b>' + E(s.n) + '</b><small>' + E(s.set) + '</small></span>' + (i > 0 ? sw(s.on) : '<span class="help">항상 맨 위</span>');
        li.onclick = function (e) { if (e.target.closest('.sw')) return; cur = i; draw(); };
        var c = $('.sw input', li); if (c) c.onchange = function () { s.on = c.checked; draw(); toast(s.n + ' 영역을 ' + (s.on ? '보이게' : '숨김으로') + ' 바꿨습니다'); };
        li.ondragstart = function () { dragI = i; li.classList.add('drag'); }; li.ondragend = function () { li.classList.remove('drag'); };
        li.ondragover = function (e) { if (i > 0) { e.preventDefault(); li.classList.add('over'); } }; li.ondragleave = function () { li.classList.remove('over'); };
        li.ondrop = function (e) { e.preventDefault(); var x = SECS.splice(dragI, 1)[0]; SECS.splice(i, 0, x); cur = i; draw(); };
        ul.appendChild(li);
      });
      $('#mini').innerHTML = SECS.filter(function (s) { return s.on; }).map(function (s) { return '<div class="mini-b mb-' + s.k + '">' + E(s.n) + '</div>'; }).join('');
      var s = SECS[cur], p = '';
      $('#sec-t').textContent = s.n + ' 설정';
      if (s.k === 'nums') p = '<div class="help" style="margin-bottom:8px">숫자는 홈페이지에서 0부터 올라가며 보입니다.</div>' + s.nums.map(function (n, j) { return '<div class="grid2" style="margin-bottom:8px"><div class="f"><label>숫자 ' + (j + 1) + '</label><input value="' + E(n[0]) + '"></div><div class="f"><label>설명 (국문)</label><input value="' + E(n[1]) + '"></div></div>'; }).join('') + '<button class="btn sm">+ 숫자 추가</button>';
      else if (s.k === 'clients') p = '<div class="f"><label>발주처 (이름 또는 로고)</label><div class="chiplist">' + s.items.map(function (x) { return '<span>' + E(x) + ' <button>×</button></span>'; }).join('') + '</div><div style="display:flex;gap:6px;margin-top:8px"><input placeholder="발주처 이름"><button class="btn sm">추가</button><button class="btn sm">로고 이미지 올리기</button></div><span class="help">로고는 사용 허락을 받은 것만 올립니다. 로고가 없으면 이름으로 표시.</span></div>';
      else if (s.k === 'cases') p = '<div class="f"><label>메인에 보일 사례 (최대 3건)</label>' + WORKS.slice(0, 5).map(function (w, j) { return '<label class="ck"><input type="checkbox"' + (j < 3 ? ' checked' : '') + '> ' + E(w.name) + ' <span class="sub">' + E(w.type) + '</span></label>'; }).join('') + '<a class="help" href="#works" style="text-decoration:underline">실적 관리에서 사례 내용 고치기</a></div>';
      else if (s.k === 'hero') p = '<p>첫 화면 사진·문구는 <a href="#banner" style="color:var(--blue);font-weight:700">메인 배너</a>에서 고칩니다.</p>';
      else if (s.k === 'news') p = '<div class="grid2"><div class="f"><label>보일 개수</label><select><option>3건</option><option selected>4건</option><option>6건</option></select></div><div class="f"><label>가져올 글</label><select><option>새소식 + 보도자료</option><option>새소식만</option><option>상단 고정 글만</option></select></div></div>';
      else if (s.k === 'video') p = '<div class="f"><label>YouTube 주소</label><input placeholder="https://www.youtube.com/watch?v=..."></div><div class="f" style="margin-top:10px"><label>배경 사진</label><div class="lib">' + IMGS.slice(0, 4).map(function (x, j) { return '<img src="' + x + '" class="' + (j === 2 ? 'on' : '') + '" alt="">'; }).join('') + '</div></div>';
      else p = '<div class="grid2"><div class="f full"><label>영역 제목 (국문)</label><input value="' + E(s.n) + '"></div><div class="f full"><label>영역 제목 (영문)</label><input placeholder="영문 제목"></div><div class="f full"><label>설명 문구 (국문)</label><textarea>' + E(s.set) + '</textarea></div></div>';
      $('#sec-p').innerHTML = p;
    }
    draw();
  };

  /* ───────────── 메인 배너 ───────────── */
  var BN = [
    { img: 'img/hero_coast.jpg', big: 'Fire Protection Since 1947', ko: '공항·초고층·플랜트의 소방설계와 감리', en: 'Fire protection design & supervision', d: '1947년 설립 · 1급 소방시설 설계·감리업 · 특허 76건', btn: '사업 문의하기', link: '#inquiry', from: '', to: '', on: true },
    { img: 'img/hero_airport.jpg', big: 'Supervision', ko: '국가기간시설 소방·전기·통신 감리', en: 'Integrated supervision', d: '인천국제공항 1·2단계부터 제2여객터미널까지', btn: '실적 보기', link: '/projects', from: '', to: '', on: true },
    { img: 'img/p_data.jpg', big: 'Research', ko: 'AI와 데이터로 여는 소방 엔지니어링', en: 'AI fire engineering', d: '과학기술정보통신부 지정 소방안전 빅데이터센터', btn: 'R&D 보기', link: '/rnd', from: '2026-12-01', to: '', on: false }];
  R.banner = function (el) {
    el.innerHTML = head('메인 배너', '첫 화면에 넘어가는 사진과 문구입니다. 기간을 넣으면 그 기간에만 보입니다.', '<button class="btn" id="bn-add">+ 배너 추가</button><button class="btn navy" data-save>저장</button>') +
      '<section class="panel"><div class="panel-hd"><h2>배너 순서</h2><div style="display:flex;gap:10px;align-items:center"><span class="help">넘김 간격</span><select style="width:auto"><option>4초</option><option selected>6초</option><option>8초</option></select></div></div><div class="bnlist" id="bnlist"></div></section>' +
      '<div class="pp"><section class="panel"><div class="panel-hd"><h2>배너 설정</h2><button class="btn sm" style="color:var(--pri)" id="bn-del">삭제</button></div><div class="panel-bd" id="bnf"></div></section>' +
      '<section class="panel"><div class="panel-hd"><h2>미리보기</h2><span class="help">홈페이지 첫 화면</span></div><div class="panel-bd"><div class="bnprev" id="bnprev"></div></div></section></div>';
    var cur = 0, dragI = null, lang = 'ko';
    function list() {
      var b = $('#bnlist'); b.innerHTML = '';
      BN.forEach(function (x, i) {
        var d = document.createElement('div'); d.className = 'bn' + (i === cur ? ' sel' : '') + (x.on ? '' : ' off'); d.draggable = true;
        d.innerHTML = '<img src="' + x.img + '" alt=""><div><small>' + (i + 1) + '번째</small><b>' + E(x.ko) + '</b>' + (x.on ? (x.from ? tag('예약') : tag('노출 중')) : tag('숨김')) + '</div>';
        d.onclick = function () { cur = i; list(); form(); };
        d.ondragstart = function () { dragI = i; }; d.ondragover = function (e) { e.preventDefault(); d.classList.add('over'); }; d.ondragleave = function () { d.classList.remove('over'); };
        d.ondrop = function (e) { e.preventDefault(); var t = BN.splice(dragI, 1)[0]; BN.splice(i, 0, t); cur = i; list(); form(); };
        b.appendChild(d);
      });
    }
    function prev() { var x = BN[cur]; $('#bnprev').innerHTML = '<img src="' + x.img + '" alt=""><div class="bt"><span class="bb">' + E(x.big) + '</span><b>' + E(lang === 'ko' ? x.ko : x.en) + '</b><small>' + E(x.d) + '</small><i>' + E(x.btn) + '</i></div>'; }
    function form() {
      var x = BN[cur];
      $('#bnf').innerHTML = '<div class="f"><label>사진</label><div class="lib">' + IMGS.slice(0, 9).map(function (s) { return '<img data-s="' + s + '" src="' + s + '" class="' + (s === x.img ? 'on' : '') + '" alt="">'; }).join('') + '</div><span class="help">PC용 1920×1080 이상 · 모바일용 사진을 따로 올리면 폰에서 그 사진을 씀</span></div>' +
        '<div class="seg" id="bnl" style="margin:14px 0 4px"><button class="' + (lang === 'ko' ? 'on' : '') + '" data-l="ko">국문</button><button class="' + (lang === 'en' ? 'on' : '') + '" data-l="en">English</button></div>' +
        '<div class="grid2"><div class="f full"><label>큰 영문 글자</label><input data-k="big" value="' + E(x.big) + '"></div>' +
        '<div class="f full"><label>제목 (' + (lang === 'ko' ? '국문' : '영문') + ')</label><input data-k="' + lang + '" value="' + E(x[lang]) + '"></div>' +
        '<div class="f full"><label>설명</label><input data-k="d" value="' + E(x.d) + '"></div>' +
        '<div class="f"><label>버튼 글자</label><input data-k="btn" value="' + E(x.btn) + '"></div><div class="f"><label>버튼 연결</label><input data-k="link" value="' + E(x.link) + '"></div>' +
        '<div class="f"><label>노출 시작 (비우면 바로)</label><input type="date" data-k="from" value="' + x.from + '"></div><div class="f"><label>노출 끝 (비우면 계속)</label><input type="date" data-k="to" value="' + x.to + '"></div>' +
        '<div class="f"><label>노출</label>' + sw(x.on, ' id="bn-on"') + '</div></div>';
      $$('#bnf .lib img').forEach(function (im) { im.onclick = function () { x.img = im.dataset.s; list(); form(); }; });
      $$('#bnf [data-k]').forEach(function (inp) { inp.oninput = function () { x[inp.dataset.k] = inp.value; list(); prev(); }; });
      $$('#bnl button').forEach(function (b) { b.onclick = function () { lang = b.dataset.l; form(); }; });
      $('#bn-on input').onchange = function (e) { x.on = e.target.checked; list(); };
      prev();
    }
    $('#bn-add').onclick = function () { BN.push({ img: IMGS[4], big: 'New', ko: '새 배너 제목', en: '', d: '', btn: '자세히 보기', link: '', from: '', to: '', on: false }); cur = BN.length - 1; list(); form(); toast('새 배너를 숨김 상태로 추가했습니다'); };
    $('#bn-del').onclick = function () { if (BN.length < 2) return toast('배너는 1개 이상 있어야 합니다'); BN.splice(cur, 1); cur = 0; list(); form(); };
    list(); form();
  };

  /* ───────────── 게시판형 공통 (목록 + 편집) ───────────── */
  var WORKS = [
    { name: '인천국제공항 제2여객터미널 확장(4단계)', en: 'Incheon Airport T2 Expansion', type: '공공·국가기간', scope: '설계', client: '인천국제공항공사', year: '2018', main: true, st: '게시', task: '국가 관문 공항 확장 구간의 소방시설', work: '제2여객터미널 확장 소방설계', res: '1993년 1단계부터 이어진 연속 참여', img: 'img/hero_airport.jpg' },
    { name: '잠실 롯데월드타워', en: 'Lotte World Tower', type: '초고층·복합', scope: '설계+감리', client: '롯데', year: '2010', main: true, st: '게시', task: '123층 초고층 화재·피난 안전', work: '저층부 감리 → 고층부 설계 → 초고층 감리', res: '설계부터 감리까지 연속 수행', img: 'img/p_lotte.jpg' },
    { name: '현대자동차 신사옥(GBC)', en: '', type: '초고층·복합', scope: '설계', client: '현대자동차', year: '2015', main: true, st: '게시', task: '초고층 신사옥 화재·피난 안전', work: '소방설계', res: '', img: 'img/p_tower3.jpg' },
    { name: '현대제철 당진공장 1기', en: '', type: '산업·플랜트', scope: '설계', client: '현대제철', year: '2007', main: false, st: '게시', task: '', work: '', res: '', img: 'img/hero_complex.jpg' },
    { name: '인천국제공항 1·2단계', en: 'Incheon Airport Phase 1·2', type: '공공·국가기간', scope: '감리', client: '인천국제공항공사', year: '2004', main: false, st: '게시', task: '', work: '', res: '', img: 'img/hero_airport.jpg' },
    { name: '○○ 데이터센터 (발주처 비공개)', en: '', type: '산업·플랜트', scope: '성능위주설계', client: '비공개', year: '2025', main: false, st: '임시저장', task: '', work: '', res: '', img: 'img/p_night.jpg' }];
  var BOARDS = {
    works: { title: '실적 관리', desc: '홈페이지 "실적"과 메인 "수행 사례"에 보이는 내용입니다. 사례(과제·수행·결과)를 채운 실적만 사례로 보입니다.', cats: ['공공·국가기간', '초고층·복합', '산업·플랜트'], catKey: 'type', rows: WORKS,
      cols: [['연도', 'year'], ['프로젝트', 'name'], ['유형', 'type', 'm'], ['범위', 'scope', 'm']], badges: function (r) { return (r.main ? '<span class="tag t-pub">메인</span> ' : '') + (r.en ? '' : '<span class="tag t-wait">영문 없음</span>'); },
      fields: [['type', '시설 유형', 'sel', ['공공·국가기간', '초고층·복합', '산업·플랜트']], ['scope', '수행 범위', 'sel', ['설계', '감리', '설계+감리', '성능위주설계']], ['client', '발주처명', 'txt'], ['year', '수행 연도', 'txt'], ['name', '프로젝트명 (국문)', 'txt', 0, 1], ['en', '프로젝트명 (영문)', 'txt', 0, 1], ['task', '사례 — 과제', 'txt', 0, 1], ['work', '사례 — 수행', 'txt', 0, 1], ['res', '사례 — 결과', 'txt', 0, 1], ['img', '대표 사진', 'img'], ['main', '메인 "수행 사례"에 보이기', 'bool'], ['hide', '발주처명 숨기기 (비공개 실적)', 'bool']] },
    news: { title: '소식·보도자료', desc: '새소식·보도자료·수상 소식을 올립니다. 예약 게시를 걸면 그 시각에 자동으로 올라갑니다.', cats: ['새소식', '보도자료', '수상'], catKey: 'cat',
      rows: [{ name: '기후에너지환경부 장관 표창 수상', cat: '수상', date: '2025.11.20', st: '게시', pin: true, en: 'Minister\'s Commendation', img: 'img/cert_ai.jpg' }, { name: '중소벤처기업부 장관 표창 수상', cat: '수상', date: '2025.10.02', st: '게시', en: '' }, { name: '전통시장 AI 전기화재 예방 시스템 국가 R&D 선정', cat: '보도자료', date: '2025.06.12', st: '게시', en: 'National R&D selected', img: 'img/p_data.jpg' }, { name: '2026 국제소방안전박람회 참가 안내', cat: '새소식', date: '2026.12.01', st: '예약', en: '' }],
      cols: [['구분', 'cat'], ['제목', 'name'], ['게시일', 'date', 'm']], badges: function (r) { return (r.pin ? '<span class="tag t-pub">상단 고정</span> ' : '') + (r.en ? '' : '<span class="tag t-wait">영문 없음</span>'); },
      fields: [['cat', '구분', 'sel', ['새소식', '보도자료', '수상']], ['date', '게시일 (미래면 예약)', 'txt'], ['name', '제목 (국문)', 'txt', 0, 1], ['en', '제목 (영문)', 'txt', 0, 1], ['body', '본문', 'editor'], ['img', '대표 사진', 'img'], ['file', '첨부 파일', 'file'], ['pin', '목록 맨 위에 고정', 'bool']] },
    rnd: { title: 'R&D 과제', desc: '연구개발 페이지의 수행 과제 목록입니다.', cats: ['수행 중', '완료'], catKey: 'st2',
      rows: [{ name: '전통시장 특성을 반영한 AI 기반 실시간 전기화재 예방 시스템', st2: '수행 중', org: '행정안전부', period: '2025~2027', st: '게시', en: 'AI electrical fire prevention for markets' }, { name: '전선 단락흔 정량 판별 및 AI 기반 원격 감식·감정 기술', st2: '수행 중', org: '소방청', period: '2025~2028', st: '게시', en: '' }, { name: '리튬배터리 제조사업장 전주기 화재안전관리시스템', st2: '수행 중', org: '산업통상자원부', period: '2024~2026', st: '게시', en: '' }, { name: '원전 광역화재를 고려한 정량적 화재영향평가 기술개발', st2: '완료', org: '—', period: '2015', st: '게시', en: '' }],
      cols: [['상태', 'st2'], ['과제명', 'name'], ['기간', 'period', 'm']], badges: function (r) { return r.en ? '' : '<span class="tag t-wait">영문 없음</span>'; },
      fields: [['st2', '상태', 'sel', ['수행 중', '완료']], ['org', '발주 기관', 'txt'], ['period', '수행 기간', 'txt'], ['name', '과제명 (국문)', 'txt', 0, 1], ['en', '과제명 (영문)', 'txt', 0, 1], ['sum', '요약', 'area'], ['img', '대표 사진', 'img']] },
    certs: { title: '인증·수상·특허', desc: '회사소개 "인증·수상"과 메인 숫자에 쓰입니다. 유효기간을 넣으면 끝나기 30일 전에 대시보드에 알려 줍니다.', cats: ['인증', '수상', '특허', '면허'], catKey: 'cat',
      rows: [{ name: 'ISO 9001 / 14001', cat: '인증', org: '한국능률협회인증원', no: 'QSC81206', date: '2003', exp: '2026.12.31', st: '게시', en: 'ISO 9001/14001' }, { name: '인공지능기술 인증', cat: '인증', org: '한국인공지능협회', no: 'CT8222-I0098', date: '2022', exp: '', st: '게시', en: 'AI Technology Certification', img: 'img/cert_ai.jpg' }, { name: '대통령 표창', cat: '수상', org: '대한민국 정부', no: '240504', date: '2023', st: '게시', en: 'Presidential Citation' }, { name: '1급 소방시설 설계 및 공사감리업', cat: '면허', org: '서울특별시', no: '서울강남 제95-6호', date: '1995', st: '게시', en: '' }],
      cols: [['구분', 'cat'], ['이름', 'name'], ['일자', 'date', 'm']], badges: function (r) { return r.exp === '2026.12.31' ? tag('만료 임박') : (r.en ? '' : '<span class="tag t-wait">영문 없음</span>'); },
      fields: [['cat', '구분', 'sel', ['인증', '수상', '특허', '면허']], ['org', '발급 기관', 'txt'], ['no', '번호', 'txt'], ['date', '받은 날', 'txt'], ['exp', '유효기간 (있으면)', 'txt'], ['name', '이름 (국문)', 'txt', 0, 1], ['en', '이름 (영문)', 'txt', 0, 1], ['img', '증서 이미지', 'img']] },
    files: { title: '자료실', desc: '회사소개서·면허 사본 등 내려받는 자료입니다. "요청 후 발송"으로 두면 이름·회사명을 받고 메일로 보냅니다.', cats: ['회사소개서', '면허·등록증', '인증서', '카탈로그'], catKey: 'cat',
      rows: [{ name: '회사소개서 2025 (국문)', cat: '회사소개서', open: '누구나', dl: 214, st: '게시', en: 'Company Profile 2025' }, { name: '회사소개서 2025 (영문)', cat: '회사소개서', open: '누구나', dl: 61, st: '게시', en: 'Company Profile 2025 (EN)' }, { name: '소방시설 설계·감리업 등록증 사본', cat: '면허·등록증', open: '요청 후 발송', dl: 18, st: '게시', en: '' }, { name: 'CADDY 내진제품 카탈로그', cat: '카탈로그', open: '누구나', dl: 97, st: '게시', en: 'CADDY catalog' }],
      cols: [['구분', 'cat'], ['자료명', 'name'], ['공개', 'open', 'm'], ['내려받기', 'dl', 'm']], badges: function () { return ''; },
      fields: [['cat', '구분', 'sel', ['회사소개서', '면허·등록증', '인증서', '카탈로그']], ['open', '공개 방식', 'sel', ['누구나', '요청 후 발송', '숨김']], ['name', '자료명 (국문)', 'txt', 0, 1], ['en', '자료명 (영문)', 'txt', 0, 1], ['file', '파일 (국문판)', 'file'], ['file2', '파일 (영문판)', 'file']] },
    jobs: { title: '채용공고', desc: '인재채용 페이지 공고입니다. 마감일이 지나면 자동으로 "마감"으로 바뀝니다.', cats: ['모집 중', '마감'], catKey: 'st2',
      rows: [{ name: '소방설계 경력직 채용', st2: '모집 중', part: '설계사업본부', career: '경력 3년 이상', due: '채용 시 마감', st: '게시', apps: 4 }, { name: '소방감리 경력직 채용', st2: '모집 중', part: '감리사업본부', career: '경력 5년 이상', due: '2026.12.15', st: '게시', apps: 2 }, { name: '2025 하반기 신입 공채', st2: '마감', part: '전 부문', career: '신입', due: '2025.10.31', st: '게시', apps: 37 }],
      cols: [['상태', 'st2'], ['공고명', 'name'], ['마감', 'due', 'm'], ['지원자', 'apps', 'm']], badges: function () { return ''; },
      fields: [['part', '모집 부문', 'txt'], ['career', '경력', 'sel', ['신입', '경력 3년 이상', '경력 5년 이상', '무관']], ['due', '마감일', 'txt'], ['st2', '상태', 'sel', ['모집 중', '마감']], ['name', '공고명', 'txt', 0, 1], ['body', '공고 내용', 'editor'], ['online', '홈페이지에서 온라인 지원 받기', 'bool']] }
  };
  function boardView(key) {
    return function (el) {
      var C = BOARDS[key], cat = '전체', q = '', cur = 0;
      el.innerHTML = head(C.title, C.desc, '<button class="btn" data-new>+ 새로 쓰기</button>') +
        '<div class="bd"><section class="panel"><div class="panel-hd"><div class="flt">' + ['전체'].concat(C.cats).map(function (c) { return '<button class="' + (c === '전체' ? 'on' : '') + '">' + c + '</button>'; }).join('') + '</div><input class="srch" placeholder="검색"></div><div class="tbl"><table><thead><tr>' + C.cols.map(function (c) { return '<th' + (c[2] ? ' class="hide-m"' : '') + '>' + c[0] + '</th>'; }).join('') + '<th>상태</th><th>노출</th></tr></thead><tbody></tbody></table></div><div class="foot"><span class="cnt"></span><span class="help">줄을 누르면 오른쪽에서 고칩니다</span></div></section>' +
        '<section class="panel"><div class="panel-hd"><h2 class="ed-t">편집</h2><div style="display:flex;gap:6px"><button class="btn sm" style="color:var(--pri)" data-del>삭제</button><button class="btn sm">임시저장</button><button class="btn sm navy" data-save>게시</button></div></div><div class="panel-bd ed"></div></section></div>';
      function rows() {
        var tb = $('tbody', el), n = 0; tb.innerHTML = '';
        C.rows.forEach(function (r, i) {
          if (cat !== '전체' && r[C.catKey] !== cat) return; if (q && (r.name + (r.en || '')).indexOf(q) < 0) return; n++;
          var tr = document.createElement('tr'); if (i === cur) tr.className = 'sel';
          tr.innerHTML = C.cols.map(function (c, j) { return '<td' + (c[2] ? ' class="hide-m"' : '') + '>' + (j === 1 ? '<b>' + E(r[c[1]]) + '</b><div>' + C.badges(r) + '</div>' : E(r[c[1]])) + '</td>'; }).join('') + '<td>' + tag(r.st) + '</td><td>' + sw(r.st !== '숨김') + '</td>';
          tr.onclick = function (e) { if (e.target.closest('.sw')) return; cur = i; rows(); edit(); };
          $('.sw input', tr).onchange = function (e) { r.st = e.target.checked ? '게시' : '숨김'; rows(); };
          tb.appendChild(tr);
        });
        $('.cnt', el).textContent = '총 ' + n + '건';
      }
      function edit() {
        var r = C.rows[cur], h = '<div class="grid2">';
        if (!r) { $('.ed', el).innerHTML = '<p class="help">왼쪽에서 고를 글을 누르세요</p>'; return; }
        $('.ed-t', el).textContent = r.name ? '편집 — ' + r.name.slice(0, 22) : '새 글';
        C.fields.forEach(function (f) {
          var k = f[0], lab = f[1], t = f[2], full = f[4] || t === 'img' || t === 'editor' || t === 'area' || t === 'file' || t === 'bool', v = r[k];
          h += '<div class="f' + (full ? ' full' : '') + '">';
          if (t === 'bool') h += '<label class="ck"><input type="checkbox" data-k="' + k + '"' + (v ? ' checked' : '') + '> ' + lab + '</label>';
          else {
            h += '<label>' + lab + '</label>';
            if (t === 'sel') h += '<select data-k="' + k + '">' + f[3].map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
            else if (t === 'area') h += '<textarea data-k="' + k + '">' + E(v) + '</textarea>';
            else if (t === 'editor') h += '<div class="rte"><div class="rte-b"><button><b>B</b></button><button><i>I</i></button><button>제목</button><button>목록</button><button>링크</button><button>사진</button><button>표</button></div><div class="rte-a" contenteditable="true">' + (v ? E(v) : '본문을 입력하세요. 한글·워드에서 복사해 붙여도 서식이 정리되어 들어갑니다.') + '</div></div>';
            else if (t === 'img') h += '<div class="lib">' + IMGS.slice(0, 8).map(function (s) { return '<img data-img="' + k + '" data-s="' + s + '" src="' + s + '" class="' + (s === v ? 'on' : '') + '" alt="">'; }).join('') + '</div><span class="help">사진 보관함에서 고르거나 끌어 놓아 새로 올림</span>';
            else if (t === 'file') h += '<div class="drop">파일을 끌어 놓거나 눌러서 선택 · PDF·HWP·ZIP 50MB까지</div>';
            else h += '<input data-k="' + k + '" value="' + E(v) + '"' + (k === 'en' && !v ? ' placeholder="비워 두면 영문 사이트에서 숨김"' : '') + '>';
          }
          h += '</div>';
        });
        h += '</div><p class="help" style="margin-top:12px">고친 내용은 [게시]를 눌러야 홈페이지에 반영되고, 이전 내용은 변경 이력에 남습니다.</p>';
        $('.ed', el).innerHTML = h;
        $$('[data-k]', $('.ed', el)).forEach(function (inp) { inp.oninput = inp.onchange = function () { r[inp.dataset.k] = inp.type === 'checkbox' ? inp.checked : inp.value; if (inp.dataset.k === 'name' || inp.dataset.k === 'en' || inp.dataset.k === C.catKey || inp.type === 'checkbox') rows(); }; });
        $$('[data-img]', $('.ed', el)).forEach(function (im) { im.onclick = function () { r[im.dataset.img] = im.dataset.s; edit(); }; });
      }
      $$('.flt button', el).forEach(function (b) { b.onclick = function () { cat = b.textContent; $$('.flt button', el).forEach(function (x) { x.classList.toggle('on', x === b); }); rows(); }; });
      $('.srch', el).oninput = function (e) { q = e.target.value; rows(); };
      $('[data-new]', el).onclick = function () { var n = { name: '', en: '', st: '임시저장' }; n[C.catKey] = C.cats[0]; C.rows.unshift(n); cur = 0; rows(); edit(); $('.ed input[data-k="name"]', el) && $('.ed input[data-k="name"]', el).focus(); };
      $('[data-del]', el).onclick = function () { if (confirm('삭제할까요? 변경 이력에서 되살릴 수 있습니다.')) { C.rows.splice(cur, 1); cur = 0; rows(); edit(); } };
      rows(); edit();
    };
  }
  Object.keys(BOARDS).forEach(function (k) { R[k] = boardView(k); });

  /* ───────────── 접수함 공통 (문의·실적증명·입사 지원) ───────────── */
  var INQ = [
    { org: '○○도시공사', who: '이○○ 과장', tel: '02-000-0000', mail: 'lee@○○.go.kr', type: '공공기관', field: '감리', at: '11.26 10:12', st: '신규', dept: '감리사업본부', msg: '○○ 복합청사 신축공사 소방·전기 통합 감리 관련 제안요청서를 보내 드립니다. 12월 첫 주 현장 설명회 참석 가능 여부도 알려 주십시오.', file: 'RFP_○○복합청사.pdf' },
    { org: '○○건설', who: '박○○ 대리', tel: '010-0000-0000', mail: 'park@○○.co.kr', type: '대기업·건설사', field: '성능위주설계', at: '11.25 16:40', st: '신규', dept: '방재연구소', msg: '지상 49층 주상복합 성능위주설계 심의 대응 견적을 요청합니다.', file: '' },
    { org: 'Global EPC Co.', who: 'J. Smith', tel: '+65-0000-0000', mail: 'smith@○○.com', type: '해외', field: '설계', at: '11.25 09:03', st: '신규', dept: '설계사업본부', msg: 'We are looking for a Korean fire protection design partner for a data center project in Pyeongtaek.', file: '', en: 1 },
    { org: '○○연구원', who: '김○○ 선임', tel: '042-000-0000', mail: 'kim@○○.re.kr', type: '연구기관', field: '공동연구', at: '11.24 11:20', st: '처리 중', dept: 'R&D센터', msg: '배터리 화재 실증 공동연구 참여 의향을 여쭙니다.', file: '' },
    { org: '○○전자', who: '최○○ 책임', tel: '031-000-0000', mail: 'choi@○○.com', type: '대기업·건설사', field: 'AI 솔루션', at: '11.22 14:05', st: '완료', dept: 'R&D센터', msg: 'AI 설계 검토(ATC+) 데모를 요청합니다.', file: '' }];
  var INBOX = {
    inquiry: { title: '문의 관리', desc: '홈페이지 사업 문의입니다. 문의 분야에 따라 담당 본부가 자동으로 정해지고 담당자에게 메일이 갑니다. 1영업일이 지나면 관리자에게 다시 알립니다.', rows: INQ, line: function (q) { return q.field + (q.en ? ' · 영문' : ''); },
      info: function (q) { return [['기관 유형', q.type], ['담당자', q.who], ['연락처', q.tel], ['메일', q.mail], ['문의 분야', q.field], ['받은 시각', '2026.' + q.at]]; }, tpl: ['기본 회신 (담당자 연결 안내)', 'RFP 접수 확인', '견적 회신', 'English — general reply'] },
    certreq: { title: '실적증명 요청', desc: '발주처가 입찰·등록용 실적증명서를 요청한 건입니다. 발급 파일을 올리고 [보내기]를 누르면 요청자에게 메일로 갑니다.', rows: [
      { org: '○○도시공사', who: '정○○ 주무관', tel: '02-000-0000', mail: 'jung@○○.go.kr', field: '인천국제공항 제2여객터미널 확장 — 설계', at: '11.26 09:30', st: '신규', dept: '경영지원팀', msg: '○○ 입찰 참가자격 심사용으로 실적증명서 1부 요청드립니다. 용도: 입찰 제출', file: '' },
      { org: '○○공사', who: '오○○ 대리', tel: '02-000-0000', mail: 'oh@○○.or.kr', field: '잠실 롯데월드타워 — 감리', at: '11.18 13:10', st: '발급 완료', dept: '경영지원팀', msg: '협력업체 등록용', file: '실적증명서_롯데월드타워.pdf' }],
      line: function (q) { return q.field; }, info: function (q) { return [['요청 실적', q.field], ['요청자', q.who], ['연락처', q.tel], ['메일', q.mail], ['받은 시각', '2026.' + q.at]]; }, tpl: ['실적증명서 발급 안내', '추가 서류 요청'], states: ['신규', '처리 중', '발급 완료'] },
    apply: { title: '입사 지원', desc: '홈페이지 온라인 지원서입니다. 개인정보 보관 기간(채용 종료 후 180일)이 지나면 자동으로 지워집니다.', rows: [
      { org: '홍○○', who: '소방설계 경력직', tel: '010-0000-0000', mail: 'hong@○○.com', field: '소방설계 경력직 · 경력 6년', at: '11.25 21:14', st: '신규', dept: '설계사업본부', msg: '소방기술사 취득 · 초고층 설계 경험', file: '이력서_홍○○.pdf' },
      { org: '윤○○', who: '소방감리 경력직', tel: '010-0000-0000', mail: 'yoon@○○.com', field: '소방감리 경력직 · 경력 8년', at: '11.21 10:02', st: '서류 검토', dept: '감리사업본부', msg: '', file: '이력서_윤○○.pdf' }],
      line: function (q) { return q.field; }, info: function (q) { return [['지원 공고', q.who], ['연락처', q.tel], ['메일', q.mail], ['받은 시각', '2026.' + q.at], ['개인정보 삭제 예정', '2027.06.13']]; }, tpl: ['서류 접수 확인', '면접 안내', '불합격 안내'], states: ['신규', '서류 검토', '면접', '합격', '불합격'] }
  };
  function inboxView(key) {
    return function (el) {
      var C = INBOX[key], st = '전체', cur = 0, states = C.states || ['신규', '처리 중', '완료'];
      el.innerHTML = head(C.title, C.desc, '<button class="btn">엑셀로 내려받기</button>') +
        '<div class="ib"><section class="panel"><div class="panel-hd"><div class="flt">' + ['전체'].concat(states).map(function (s) { return '<button class="' + (s === '전체' ? 'on' : '') + '">' + s + '</button>'; }).join('') + '</div></div><ul class="ilist"></ul></section><section class="panel det"></section></div>';
      function list() {
        var ul = $('.ilist', el); ul.innerHTML = '';
        C.rows.forEach(function (q, i) {
          if (st !== '전체' && q.st !== st) return;
          var li = document.createElement('li'); if (i === cur) li.className = 'sel';
          li.innerHTML = '<div><b>' + E(q.org) + '</b> ' + tag(q.st) + '</div><div class="sub">' + E(C.line(q)) + '</div><div class="sub">' + q.at + ' · ' + E(q.dept) + '</div>';
          li.onclick = function () { cur = i; list(); det(); }; ul.appendChild(li);
        });
      }
      function det() {
        var q = C.rows[cur]; if (!q) return;
        $('.det', el).innerHTML = '<div class="panel-hd"><h2>' + E(q.org) + '</h2><div style="display:flex;gap:8px;align-items:center"><select class="st" style="width:auto">' + states.map(function (s) { return '<option' + (s === q.st ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select><select style="width:auto"><option>' + E(q.dept) + '</option><option>설계사업본부</option><option>감리사업본부</option><option>방재연구소</option><option>R&D센터</option><option>경영지원팀</option></select></div></div>' +
          '<div class="panel-bd"><dl class="info">' + C.info(q).map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + E(x[1]) + '</dd>'; }).join('') + '</dl>' +
          (q.msg ? '<div class="msg">' + E(q.msg) + '</div>' : '') + (q.file ? '<a class="att">📎 ' + E(q.file) + '</a>' : '') +
          '<div class="tl"><b>처리 기록</b><ul><li><span>' + q.at + '</span> 홈페이지로 접수 · ' + E(q.dept) + ' 자동 배정 · 담당자 메일 발송</li>' + (q.st !== '신규' ? '<li><span>다음 날</span> 홍보팀 김○○ — 상태를 "' + E(q.st) + '"(으)로 변경</li>' : '') + '</ul></div>' +
          '<div class="f" style="margin-top:14px"><label>내부 메모 (홈페이지에 안 보임)</label><div style="display:flex;gap:6px"><input placeholder="예: 12/2 현장설명회 참석 — 감리본부 이○○"><button class="btn">남기기</button></div></div>' +
          '<div class="reply"><div class="f"><label>답장 메일</label><select>' + C.tpl.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
          '<textarea>' + E(q.who) + '님, 안녕하세요. 한방유비스입니다.\n문의 주신 내용은 ' + E(q.dept) + '에서 검토 후 연락드리겠습니다.\n확인 부탁드립니다.</textarea>' + (key === 'certreq' ? '<div class="drop">발급한 실적증명서 PDF를 끌어 놓으세요</div>' : '') +
          '<div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn">임시저장</button><button class="btn navy" data-send>보내기</button></div></div></div>';
        $('.st', el).onchange = function (e) { q.st = e.target.value; list(); det(); toast('상태를 "' + q.st + '"(으)로 바꿨습니다'); };
        $('[data-send]', el).onclick = function () { toast(q.mail + ' 로 메일을 보냈습니다 (시안)'); };
      }
      $$('.flt button', el).forEach(function (b) { b.onclick = function () { st = b.textContent; $$('.flt button', el).forEach(function (x) { x.classList.toggle('on', x === b); }); list(); }; });
      list(); det();
    };
  }
  Object.keys(INBOX).forEach(function (k) { R[k] = inboxView(k); });

  /* ───────────── 회사 정보·하단 문구 ───────────── */
  R.company = function (el) {
    var C = { name: '한방유비스(주)', nameEn: 'Hanbang UBIS Co., Ltd.', ceo: '최두찬, 김상일', addr: '(04790) 서울특별시 성동구 성수일로 77 서울숲IT밸리 9층', addrEn: '9F Seoul Forest IT Valley, 77 Seongsuil-ro, Seongdong-gu, Seoul', tel: '02-2023-5000', fax: '02-2023-5007', mail: 'info@kfubis.com', biz: '220-81-15635' };
    el.innerHTML = head('회사 정보·하단 문구', '모든 페이지 맨 아래와 문의 안내, 오시는 길에 함께 쓰입니다. 한 곳에서 고치면 전부 바뀝니다.', '<button class="btn navy" data-save>저장</button>') +
      '<div class="pp"><section class="panel"><div class="panel-hd"><h2>기본 정보</h2></div><div class="panel-bd"><div class="grid2">' +
      [['name', '회사명 (국문)'], ['nameEn', '회사명 (영문)'], ['ceo', '대표자'], ['biz', '사업자등록번호'], ['tel', '대표 전화'], ['fax', '팩스'], ['mail', '대표 메일'], ['addr', '주소 (국문)', 1], ['addrEn', '주소 (영문)', 1]].map(function (f) { return '<div class="f' + (f[2] ? ' full' : '') + '"><label>' + f[1] + '</label><input data-c="' + f[0] + '" value="' + E(C[f[0]]) + '"></div>'; }).join('') +
      '</div><div class="grid2" style="margin-top:14px"><div class="f"><label>로고 (밝은 바탕용)</label><div class="logo-up"><img src="img/logo_a.png" alt=""><button class="btn sm">바꾸기</button></div></div><div class="f"><label>로고 (어두운 바탕용)</label><div class="logo-up dk"><img src="img/logo_b.png" alt=""><button class="btn sm">바꾸기</button></div></div><div class="f"><label>파비콘 (브라우저 탭 아이콘)</label><div class="drop">PNG 512×512</div></div><div class="f"><label>회사소개서 기본 파일</label><select><option>회사소개서 2025 (국문)</option></select></div></div></div></section>' +
      '<section class="panel"><div class="panel-hd"><h2>하단 링크 · 관련 사이트 · SNS</h2></div><div class="panel-bd">' +
      '<div class="f"><label>하단 링크</label><ul class="mini-l"><li>개인정보처리방침 <a href="#page" class="help">페이지 편집 ›</a></li><li>이메일무단수집거부 <a href="#page" class="help">페이지 편집 ›</a></li><li>사이트맵 <span class="help">자동</span></li></ul></div>' +
      '<div class="f"><label>관련 사이트 (Family Site)</label><ul class="mini-l"><li>한방 — hanbang1947.co.kr <button class="btn sm ghost">×</button></li><li>그룹웨어 — 직원용 <button class="btn sm ghost">×</button></li></ul><button class="btn sm">+ 추가</button></div>' +
      '<div class="grid2"><div class="f"><label>YouTube</label><input placeholder="채널 주소"></div><div class="f"><label>블로그</label><input placeholder="블로그 주소"></div></div>' +
      '<b style="font-size:13px;display:block;margin:16px 0 6px">하단 미리보기</b><div class="foot-prev" id="fp"></div></div></section></div>';
    function fp() { $('#fp').innerHTML = '<img src="img/logo_b.png" alt=""><p>' + E(C.name) + ' · 대표이사 ' + E(C.ceo) + ' · ' + E(C.addr) + '<br>TEL ' + E(C.tel) + ' · FAX ' + E(C.fax) + ' · ' + E(C.mail) + ' · 사업자등록번호 ' + E(C.biz) + '</p>'; }
    $$('[data-c]', el).forEach(function (i) { i.oninput = function () { C[i.dataset.c] = i.value; fp(); }; }); fp();
  };

  /* ───────────── 다국어 문구 ───────────── */
  R.i18n = function (el) {
    var T = [['헤더', '사업 문의', 'Contact'], ['헤더', '전체 메뉴', 'Menu'], ['메인', '사업 문의하기', 'Request a consultation'], ['메인', '회사소개서 받기', 'Company profile (PDF)'], ['메인', '함께한 발주처', 'Clients we have worked with'], ['메인', '이런 발주처와 일합니다', 'Who we work with'], ['문의', '이름', 'Name'], ['문의', '회사·기관명', 'Company'], ['문의', '연락처', 'Phone'], ['문의', '개인정보 수집·이용 동의', 'I agree to the collection of personal information'], ['문의', '문의가 접수되었습니다. 1영업일 안에 연락드립니다.', ''], ['게시판', '목록', 'List'], ['게시판', '이전 글', ''], ['게시판', '다음 글', ''], ['실적', '과제', 'Task'], ['실적', '수행', 'Work'], ['실적', '결과', 'Result'], ['하단', '개인정보처리방침', 'Privacy Policy'], ['하단', '이메일무단수집거부', ''], ['오류', '페이지를 찾을 수 없습니다', '']];
    var only = false, q = '';
    el.innerHTML = head('다국어 문구', '버튼·안내문처럼 화면에 고정된 글자입니다. 게시판 글과 페이지 내용은 각 화면에서 국문·영문을 따로 씁니다.', '<button class="btn navy" data-save>저장</button>') +
      '<section class="panel"><div class="panel-hd"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input class="srch" placeholder="문구 검색"><label class="ck"><input type="checkbox" id="only"> 영문 미입력만 보기</label></div><span class="cnt" id="ic"></span></div><div class="tbl"><table><thead><tr><th style="width:90px">위치</th><th>국문</th><th>영문</th></tr></thead><tbody id="it"></tbody></table></div></section>';
    function draw() {
      var tb = $('#it'), miss = 0; tb.innerHTML = '';
      T.forEach(function (t) {
        if (!t[2]) miss++; if (only && t[2]) return; if (q && (t[1] + t[2]).indexOf(q) < 0) return;
        var tr = document.createElement('tr'); tr.innerHTML = '<td><span class="tag t-off">' + t[0] + '</span></td><td><input value="' + E(t[1]) + '"></td><td><input class="' + (t[2] ? '' : 'miss') + '" value="' + E(t[2]) + '" placeholder="영문 입력"></td>';
        var ins = $$('input', tr); ins[0].oninput = function () { t[1] = ins[0].value; }; ins[1].oninput = function () { t[2] = ins[1].value; ins[1].classList.toggle('miss', !t[2]); $('#ic').textContent = '영문 미입력 ' + T.filter(function (x) { return !x[2]; }).length + '건'; };
        tb.appendChild(tr);
      });
      $('#ic').textContent = '영문 미입력 ' + miss + '건';
    }
    $('#only').onchange = function (e) { only = e.target.checked; draw(); }; $('.srch', el).oninput = function (e) { q = e.target.value; draw(); }; draw();
  };

  /* ───────────── 검색 노출 (SEO) ───────────── */
  R.seo = function (el) {
    var P = [['메인', '/', '한방유비스 | 공항·초고층·플랜트 소방설계와 감리', '1947년 설립, 1급 소방시설 설계·감리업. 인천국제공항·롯데월드타워 소방설계와 감리, 성능위주설계, AI 소방 엔지니어링.'], ['회사소개 › 인사말', '/company/ceo', '인사말 | 한방유비스', ''], ['사업분야 › 설계', '/business/design', '소방설계 | 한방유비스', '건축물 용도와 공간에 맞춘 종합 방재계획과 소방시설 설계.'], ['실적', '/projects', '수행 실적 | 한방유비스', '']];
    var cur = 0;
    el.innerHTML = head('검색 노출 (SEO)', '네이버·구글 검색 결과에 보이는 제목과 설명입니다. 비워 두면 페이지 내용에서 자동으로 만듭니다.', '<button class="btn navy" data-save>저장</button>') +
      '<div class="pp"><section class="panel"><div class="panel-hd"><h2>페이지별 설정</h2></div><div class="tbl"><table><thead><tr><th>페이지</th><th class="hide-m">주소</th><th>설명</th></tr></thead><tbody id="st"></tbody></table></div><div class="panel-bd" id="sf"></div></section>' +
      '<section class="panel"><div class="panel-hd"><h2>사이트 전체</h2></div><div class="panel-bd"><div class="grid2"><div class="f full"><label>사이트 이름</label><input value="한방유비스"></div><div class="f full"><label>공유할 때 보일 대표 이미지</label><div class="lib">' + IMGS.slice(0, 4).map(function (s, j) { return '<img src="' + s + '" class="' + (j === 1 ? 'on' : '') + '" alt="">'; }).join('') + '</div></div><div class="f"><label>네이버 서치어드바이저 확인 코드</label><input placeholder="naver-site-verification"></div><div class="f"><label>구글 서치 콘솔 확인 코드</label><input placeholder="google-site-verification"></div></div>' +
      '<ul class="mini-l" style="margin-top:14px"><li>sitemap.xml <span class="tag t-on">자동 생성</span></li><li>robots.txt <span class="tag t-on">자동 생성</span></li><li>영문 페이지 연결 (hreflang) <span class="tag t-on">자동</span></li></ul></div></section></div>';
    function tb() { $('#st').innerHTML = P.map(function (p, i) { return '<tr class="' + (i === cur ? 'sel' : '') + '" data-i="' + i + '"><td><b>' + p[0] + '</b></td><td class="hide-m sub">' + p[1] + '</td><td>' + (p[3] ? tag('사용') : '<span class="tag t-wait">자동</span>') + '</td></tr>'; }).join(''); $$('#st tr').forEach(function (r) { r.onclick = function () { cur = +r.dataset.i; tb(); fm(); }; }); }
    function fm() {
      var p = P[cur]; $('#sf').innerHTML = '<div class="f"><label>검색 제목 <span class="help" id="tl"></span></label><input id="s-t" value="' + E(p[2]) + '"></div><div class="f" style="margin-top:10px"><label>검색 설명 <span class="help" id="dl"></span></label><textarea id="s-d" placeholder="비워 두면 본문 앞부분을 씀">' + E(p[3]) + '</textarea></div><b style="font-size:13px;display:block;margin:14px 0 6px">검색 결과 미리보기</b><div class="serp" id="serp"></div>';
      function upd() { p[2] = $('#s-t').value; p[3] = $('#s-d').value; $('#tl').textContent = p[2].length + '/40자'; $('#dl').textContent = p[3].length + '/120자'; $('#tl').style.color = p[2].length > 40 ? 'var(--pri)' : ''; $('#dl').style.color = p[3].length > 120 ? 'var(--pri)' : '';
        $('#serp').innerHTML = '<small>kfubis.co.kr' + E(p[1] === '/' ? '' : p[1]) + '</small><b>' + E(p[2] || p[0]) + '</b><p>' + E(p[3] || '(본문 앞부분이 자동으로 들어갑니다)') + '</p>'; tb(); }
      $('#s-t').oninput = $('#s-d').oninput = upd; upd();
    }
    tb(); fm();
  };

  /* ───────────── 관리자 계정·권한 ───────────── */
  R.users = function (el) {
    var U = [['김○○', 'kim.hb', '홍보팀', '최고 관리자', '오늘 09:12', true, '사용'], ['이○○', 'lee.hb', '홍보팀', '홍보 담당', '11.25 17:40', true, '사용'], ['박○○', 'park.sv', '감리사업본부', '본부 담당', '11.24 10:03', false, '사용'], ['정○○', 'jung.hr', '경영지원팀', '채용 담당', '11.20 15:22', true, '사용'], ['최○○', 'choi.old', '홍보팀', '홍보 담당', '2026.06.30', false, '중지']];
    var ROLES = ['최고 관리자', '홍보 담당', '본부 담당', '채용 담당'], MEN = ['메인·배너·팝업', '메뉴·페이지', '실적·소식·R&D', '인증·자료실', '채용공고·입사 지원', '문의·실적증명', '회사 정보·SEO', '관리자 계정·권한'];
    var M = { '최고 관리자': [3, 3, 3, 3, 3, 3, 3, 3], '홍보 담당': [3, 3, 3, 3, 1, 2, 2, 0], '본부 담당': [0, 0, 2, 0, 0, 2, 0, 0], '채용 담당': [0, 0, 0, 0, 3, 0, 0, 0] };
    var LV = ['없음', '보기', '수정', '게시'];
    el.innerHTML = head('관리자 계정·권한', '관리자 화면을 쓰는 직원 계정입니다. 역할마다 고칠 수 있는 메뉴가 다르고, 퇴사자는 [중지]로 바로 막습니다.', '<button class="btn navy" id="inv">+ 관리자 초대</button>') +
      '<section class="panel"><div class="tbl"><table><thead><tr><th>이름</th><th class="hide-m">아이디</th><th class="hide-m">부서</th><th>역할</th><th class="hide-m">마지막 접속</th><th class="hide-m">2단계 인증</th><th>상태</th></tr></thead><tbody>' +
      U.map(function (u) { return '<tr><td><b>' + u[0] + '</b></td><td class="hide-m sub">' + u[1] + '</td><td class="hide-m">' + u[2] + '</td><td><select style="width:auto">' + ROLES.map(function (r) { return '<option' + (r === u[3] ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></td><td class="hide-m sub">' + u[4] + '</td><td class="hide-m">' + (u[5] ? tag('사용') : '<span class="tag t-wait">안 씀</span>') + '</td><td>' + tag(u[6]) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<section class="panel"><div class="panel-hd"><h2>역할별 권한</h2><span class="help">칸을 누르면 없음 → 보기 → 수정 → 게시 순으로 바뀝니다</span></div><div class="tbl"><table class="mx"><thead><tr><th>메뉴</th>' + ROLES.map(function (r) { return '<th>' + r + '</th>'; }).join('') + '</tr></thead><tbody>' +
      MEN.map(function (m, i) { return '<tr><td><b>' + m + '</b></td>' + ROLES.map(function (r) { return '<td><button class="lv lv' + M[r][i] + '" data-r="' + r + '" data-i="' + i + '"' + (r === '최고 관리자' ? ' disabled' : '') + '>' + LV[M[r][i]] + '</button></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><div class="panel-bd help">"수정"은 임시저장까지, "게시"는 홈페이지 반영까지 할 수 있습니다. 본부 담당은 자기 본부로 배정된 문의만 봅니다.</div></section>' +
      '<section class="panel"><div class="panel-hd"><h2>로그인 기록</h2><span class="help">최근 30일 · 실패 5회면 계정 잠금</span></div><div class="tbl"><table><tbody><tr><td class="sub">11.26 09:12</td><td>김○○</td><td class="hide-m sub">사무실 (내부망)</td><td>' + tag('완료') + '</td></tr><tr><td class="sub">11.25 22:41</td><td>(알 수 없음) admin</td><td class="hide-m sub">해외 IP</td><td><span class="tag t-new">실패 · 차단</span></td></tr><tr><td class="sub">11.25 17:40</td><td>이○○</td><td class="hide-m sub">사무실 (내부망)</td><td>' + tag('완료') + '</td></tr></tbody></table></div></section>';
    $$('.lv', el).forEach(function (b) { b.onclick = function () { var r = b.dataset.r, i = +b.dataset.i; M[r][i] = (M[r][i] + 1) % 4; b.className = 'lv lv' + M[r][i]; b.textContent = LV[M[r][i]]; }; });
    $('#inv').onclick = function () { toast('초대 메일을 보내면 직원이 직접 비밀번호를 정합니다 (시안)'); };
  };

  /* ───────────── 접속 통계 ───────────── */
  R.stats = function (el) {
    var pv = visits30.map(function (v) { return Math.round(v * 2.7); });
    el.innerHTML = head('접속 통계', '2026.10.28 ~ 11.26 (30일)', '<div class="seg"><button>7일</button><button class="on">30일</button><button>90일</button></div><button class="btn">엑셀로 내려받기</button>') +
      '<div class="kpis"><div class="kpi"><small>방문자</small><b>' + visits30.reduce(function (a, b) { return a + b; }, 0).toLocaleString() + '</b><span style="color:var(--ok)">지난 30일보다 12% 늘어남</span></div><div class="kpi"><small>페이지뷰</small><b>' + pv.reduce(function (a, b) { return a + b; }, 0).toLocaleString() + '</b><span>방문당 2.7쪽</span></div><div class="kpi"><small>문의 전환</small><b>0.4%</b><span>문의 27건 / 방문자</span></div><div class="kpi"><small>해외 방문</small><b>14%</b><span>영문 사이트 기준</span></div></div>' +
      '<section class="panel"><div class="panel-hd"><h2>일별 방문자</h2><span class="help">마우스를 올리면 날짜별 값</span></div><div class="panel-bd"><div data-chart=\'' + JSON.stringify({ name: '일별 방문자', x: days30, v: visits30, unit: '명' }) + '\' data-h="240"></div></div></section>' +
      '<div class="row2"><section class="panel"><div class="panel-hd"><h2>어디서 들어왔나</h2><span class="help">방문자 수</span></div><div class="panel-bd">' + bars([['네이버 검색', 3120], ['구글 검색', 1980], ['직접 입력', 1410], ['나라장터·조달 사이트', 520], ['링크드인', 210], ['기타', 330]], '명') + '</div></section>' +
      '<section class="panel"><div class="panel-hd"><h2>문의한 기관 유형</h2><span class="help">이번 달 문의 건수</span></div><div class="panel-bd">' + bars([['대기업·건설사', 13], ['공공기관', 11], ['연구기관', 2], ['해외', 1]], '건') + '</div></section></div>' +
      '<section class="panel"><div class="panel-hd"><h2>많이 본 페이지</h2></div><div class="tbl"><table><thead><tr><th>페이지</th><th>조회</th><th class="hide-m">평균 머문 시간</th><th class="hide-m">여기서 문의로 간 비율</th></tr></thead><tbody>' +
      [['메인', 9820, '0:48', '0.6%'], ['실적', 3410, '1:52', '1.9%'], ['사업분야 › 설계', 2240, '1:20', '1.1%'], ['회사소개 › 연혁', 1630, '1:05', '0.2%'], ['자료실', 1210, '0:40', '2.4%']].map(function (r) { return '<tr><td><b>' + r[0] + '</b></td><td>' + r[1].toLocaleString() + '</td><td class="hide-m">' + r[2] + '</td><td class="hide-m">' + r[3] + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<details class="panel tblview"><summary>일별 방문자 표로 보기</summary><div class="tbl"><table><tbody>' + days30.map(function (d, i) { return '<tr><td>' + d + '</td><td>' + visits30[i] + '명</td></tr>'; }).join('') + '</tbody></table></div></details>';
  };

  /* ───────────── 변경 이력·되돌리기 ───────────── */
  var HIST = [
    { at: '2026.11.26 09:40', who: '김○○', where: '팝업', what: '"연말연시 휴무 안내" 기간 수정', b: '12.24 ~ 12.31', a: '12.24 ~ 01.02' },
    { at: '2026.11.25 17:38', who: '이○○', where: '실적', what: '"인천국제공항 제2여객터미널" 영문명 입력', b: '(없음)', a: 'Incheon Airport T2 Expansion' },
    { at: '2026.11.20 14:02', who: '김○○', where: '페이지 › 인사말', what: '본문 문구 수정', b: '…스프링클러 설비를 국내에 소개하였습니다.', a: '…스프링클러 설비를 소개했습니다.' },
    { at: '2026.11.18 11:15', who: '김○○', where: '메뉴', what: '"조직도" 숨김', b: '노출', a: '숨김' },
    { at: '2026.11.12 09:41', who: '김○○', where: '페이지 › 인사말', what: '대표 사진 교체', b: 'hero_airport.jpg', a: 'p_lotte.jpg' },
    { at: '2026.11.10 16:20', who: '정○○', where: '채용공고', what: '"소방감리 경력직 채용" 게시', b: '임시저장', a: '게시' }];
  R.history = function (el) {
    el.innerHTML = head('변경 이력·되돌리기', '관리자 화면에서 바꾼 모든 것이 남습니다. 잘못 고쳤으면 [되돌리기]로 바꾸기 전으로 돌아갑니다.', '') +
      '<section class="panel"><div class="panel-hd"><div style="display:flex;gap:8px;flex-wrap:wrap"><select style="width:auto"><option>모든 사람</option><option>김○○</option><option>이○○</option><option>정○○</option></select><select style="width:auto"><option>모든 메뉴</option><option>페이지</option><option>실적</option><option>메뉴</option><option>팝업</option></select><input type="date" style="width:auto" value="2026-11-01"><input type="date" style="width:auto" value="2026-11-26"></div><span class="help">보관 기간 3년</span></div>' +
      '<ul class="hist2">' + HIST.map(function (h, i) { return '<li><div class="h-r"><span class="sub">' + h.at.slice(5) + '</span><span><b>' + E(h.who) + '</b> · ' + E(h.where) + '</span><span class="h-w">' + E(h.what) + '</span><span class="h-b"><button class="btn sm" data-d="' + i + '">바뀐 내용</button><button class="btn sm" data-u="' + i + '">되돌리기</button></span></div><div class="diff" id="df' + i + '"><div><small>바꾸기 전</small><del>' + E(h.b) + '</del></div><div><small>바꾼 뒤</small><ins>' + E(h.a) + '</ins></div></div></li>'; }).join('') + '</ul></section>';
    $$('[data-d]', el).forEach(function (b) { b.onclick = function () { $('#df' + b.dataset.d).classList.toggle('on'); }; });
    $$('[data-u]', el).forEach(function (b) { b.onclick = function () { if (confirm('이 변경을 되돌릴까요? 되돌린 것도 이력에 남습니다.')) toast('바꾸기 전으로 되돌렸습니다 (시안)'); }; });
  };

  /* 저장 버튼 공통 */
  document.addEventListener('click', function (e) { if (e.target.closest('[data-save]')) toast('저장했습니다 — 홈페이지에 반영되었습니다 (시안)'); });
  view(location.hash.slice(1));
})();
