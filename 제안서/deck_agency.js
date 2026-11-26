// 웹에이전시형 제안서 — 한방유비스 대표홈페이지 개편
// 사용: node deck_agency.js   (먼저 py -3.10 prep_assets.py)
const path = require("path");
const pptxgen = require(path.join(process.env.USERPROFILE, ".claude/skills/witco-deck/scripts/node_modules/pptxgenjs"));

const A = (f) => path.join(__dirname, "assets", f);
const OUT = path.join(__dirname, "[한방유비스 홈페이지] 대표홈페이지 개편_제안서(디자인형).pptx");
const R = "NanumSquare", B = "NanumSquare Bold", EB = "NanumSquare ExtraBold";
const C = { dark: "0E1014", dark2: "171A20", off: "F3F1EC", white: "FFFFFF", ink: "15181D", sub: "6B7079", line: "D9D6CF", lineD: "2B2F37", red: "D42A1F", navy: "1D395E", mute: "8A8F98" };

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pptx.title = "한방유비스 대표홈페이지 개편 제안";
pptx.author = "(주)위트코시스템즈";
const W = 13.333, H = 7.5;
const shadow = () => ({ type: "outer", blur: 18, offset: 6, angle: 90, color: "000000", opacity: 0.28 });

function T(s, text, o) { s.addText(text, Object.assign({ fontFace: R, color: C.ink, margin: 0, valign: "top", paraSpaceAfter: 0 }, o)); }
function pageNo(s, n, dark) {
  T(s, String(n).padStart(2, "0"), { x: W - 1.0, y: H - 0.5, w: 0.6, h: 0.25, fontSize: 9, color: dark ? C.mute : C.sub, align: "right", fontFace: B });
  T(s, "KFUBIS WEBSITE RENEWAL PROPOSAL", { x: 0.6, y: H - 0.5, w: 4, h: 0.25, fontSize: 8, color: dark ? C.mute : C.sub, charSpacing: 2 });
}
function label(s, no, en, dark) {
  T(s, no, { x: 0.6, y: 0.55, w: 0.6, h: 0.3, fontSize: 11, fontFace: EB, color: C.red });
  T(s, en, { x: 1.05, y: 0.55, w: 6, h: 0.3, fontSize: 11, fontFace: B, color: dark ? C.white : C.ink, charSpacing: 3 });
}
function browser(s, img, x, y, w) {
  const bar = 0.26, h = w / 1.6;
  s.addShape(pptx.ShapeType.rect, { x, y, w, h: h + bar, fill: { color: "FFFFFF" }, line: { color: "D9DCE1", width: 0.75 }, shadow: shadow() });
  s.addShape(pptx.ShapeType.rect, { x, y, w, h: bar, fill: { color: "ECEDF0" }, line: { color: "ECEDF0" } });
  ["FF5F57", "FEBC2E", "28C840"].forEach((c, i) => s.addShape(pptx.ShapeType.ellipse, { x: x + 0.13 + i * 0.16, y: y + 0.085, w: 0.09, h: 0.09, fill: { color: c }, line: { color: c } }));
  s.addShape(pptx.ShapeType.roundRect, { x: x + w * 0.3, y: y + 0.06, w: w * 0.4, h: 0.14, fill: { color: "FFFFFF" }, line: { color: "FFFFFF" }, rectRadius: 0.05 });
  s.addImage({ path: A(img), x, y: y + bar, w, h });
  return y + bar + h;
}
function phone(s, img, x, y, w) {
  const pad = w * 0.045, iw = w - pad * 2, ih = iw * 844 / 390, h = ih + pad * 2;
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: "111214" }, line: { color: "3A3D44", width: 1 }, rectRadius: w * 0.16, shadow: shadow() });
  s.addImage({ path: A(img), x: x + pad, y: y + pad, w: iw, h: ih, rounding: false });
  return y + h;
}

/* 01 표지 */
{
  const s = pptx.addSlide(); s.background = { color: C.dark };
  T(s, "PROPOSAL  ·  2026", { x: 0.7, y: 0.65, w: 4, h: 0.3, fontSize: 10, color: C.mute, fontFace: B, charSpacing: 4 });
  T(s, "KFUBIS\nWEBSITE\nRENEWAL", { x: 0.65, y: 1.55, w: 6.2, h: 3.3, fontSize: 66, fontFace: EB, color: C.white, charSpacing: -2, lineSpacingMultiple: 0.88 });
  s.addShape(pptx.ShapeType.rect, { x: 0.72, y: 4.95, w: 0.5, h: 0.06, fill: { color: C.red }, line: { color: C.red } });
  T(s, "한방유비스 대표홈페이지 개편 제안", { x: 0.7, y: 5.2, w: 6, h: 0.45, fontSize: 20, fontFace: B, color: C.white });
  T(s, "대기업 · 공공기관과 일하는 회사를 위한 B2B 홈페이지", { x: 0.7, y: 5.7, w: 6, h: 0.35, fontSize: 12.5, color: "B8BDC6" });
  T(s, "2026. 11   |   (주)위트코시스템즈", { x: 0.7, y: 6.75, w: 6, h: 0.3, fontSize: 10, color: C.mute });
  s.addImage({ path: A("A_show.jpg"), x: 6.55, y: 1.25, w: 7.6, h: 7.6 / 1.567 });
}

/* 02 목차 */
{
  const s = pptx.addSlide(); s.background = { color: C.off };
  T(s, "CON\nTENTS", { x: 0.65, y: 0.9, w: 4.5, h: 2.6, fontSize: 64, fontFace: EB, charSpacing: -2, lineSpacingMultiple: 0.88 });
  T(s, "무엇을, 어떻게,\n언제까지 바꾸는지", { x: 0.7, y: 3.75, w: 4, h: 0.9, fontSize: 15, color: C.sub, lineSpacingMultiple: 1.3 });
  const L = [["01", "BACKGROUND", "개편 배경"], ["02", "DIRECTION", "개편 방향 — B2B 5원칙"], ["03", "DESIGN CONCEPTS", "디자인 시안 4종"], ["04", "CMS", "직접 고치는 관리자"], ["05", "SCHEDULE & SCOPE", "일정과 범위"]];
  L.forEach((r, i) => {
    const y = 1.0 + i * 1.08;
    s.addShape(pptx.ShapeType.line, { x: 5.6, y, w: 7.1, h: 0, line: { color: C.line, width: 0.75 } });
    T(s, r[0], { x: 5.6, y: y + 0.28, w: 0.8, h: 0.5, fontSize: 22, fontFace: EB, color: C.red });
    T(s, r[1], { x: 6.5, y: y + 0.26, w: 4, h: 0.4, fontSize: 19, fontFace: EB, charSpacing: 1 });
    T(s, r[2], { x: 6.5, y: y + 0.66, w: 4, h: 0.3, fontSize: 11.5, color: C.sub });
  });
  pageNo(s, 2);
}

/* 03 배경 */
{
  const s = pptx.addSlide(); s.background = { color: C.dark };
  label(s, "01", "BACKGROUND", true);
  T(s, "홈페이지가\n24시간 일하는\n영업 담당자가 됩니다", { x: 0.6, y: 1.5, w: 6.4, h: 3.2, fontSize: 40, fontFace: EB, color: C.white, lineSpacingMultiple: 1.15, charSpacing: -1 });
  T(s, "대기업·공공기관과의 교류가 늘수록, 담당자는 미팅 전에 홈페이지부터 확인합니다.\n지금 홈페이지는 회사 소개에 머물러 있어 그 질문에 바로 답하지 못합니다.", { x: 0.62, y: 4.9, w: 6.2, h: 1.0, fontSize: 12.5, color: "B8BDC6", lineSpacingMultiple: 1.45 });
  const P = [["여러 사람이 각자 봅니다", "실무자는 업무 적합성을, 재무·구매는 신뢰도를, 임원은 실적을 확인합니다."], ["여러 번 다시 옵니다", "정보 수집 → 비교 → 결정 전 확인. 올 때마다 필요한 답이 보여야 합니다."], ["국문·영문 모두 필요합니다", "해외 발주처·EPC와의 협업에 영문 실적·소개가 바로 필요합니다."]];
  P.forEach((p, i) => {
    const y = 1.55 + i * 1.6;
    s.addShape(pptx.ShapeType.line, { x: 7.7, y, w: 5.0, h: 0, line: { color: C.lineD, width: 0.75 } });
    T(s, "0" + (i + 1), { x: 7.7, y: y + 0.25, w: 0.6, h: 0.4, fontSize: 13, fontFace: EB, color: C.red });
    T(s, p[0], { x: 8.35, y: y + 0.22, w: 4.4, h: 0.4, fontSize: 17, fontFace: B, color: C.white });
    T(s, p[1], { x: 8.35, y: y + 0.68, w: 4.3, h: 0.7, fontSize: 11.5, color: "9EA4AE", lineSpacingMultiple: 1.4 });
  });
  pageNo(s, 3, true);
}

/* 04 방향 — 5원칙 */
{
  const s = pptx.addSlide(); s.background = { color: C.off };
  label(s, "02", "DIRECTION");
  T(s, "B2B 홈페이지 5원칙", { x: 0.6, y: 1.05, w: 8, h: 0.8, fontSize: 34, fontFace: EB, charSpacing: -1 });
  T(s, "문의가 들어오는 B2B 홈페이지의 공통점을 시안 전체에 적용했습니다.", { x: 0.62, y: 1.85, w: 8, h: 0.4, fontSize: 13, color: C.sub });
  const P = [["3초 가치 제안", "첫 화면 한 줄에\n무엇을 하는 회사인지", "공항·초고층·플랜트의\n소방설계와 감리"], ["숫자 신뢰 지표", "글보다 숫자, 숫자보다\n발주처 이름", "1947 · 특허 76 · 1급 면허\n발주처 이름 띠"], ["사례 연구", "과제 · 수행 · 결과\n세 줄로 정리", "롯데월드타워\n인천국제공항"], ["타겟 명시", "누구를 위한 회사인지\n발주처 유형별 안내", "공공 · 대기업 · 건설사\n산업시설"], ["간편 문의", "필수는 이름·회사명·연락처\n3칸만", "폰에서는 화면 아래\n문의 버튼 고정"]];
  const cw = 12.1 / 5;
  P.forEach((p, i) => {
    const x = 0.6 + i * cw;
    s.addShape(pptx.ShapeType.line, { x, y: 2.75, w: cw - 0.25, h: 0, line: { color: C.ink, width: 1.5 } });
    T(s, "0" + (i + 1), { x, y: 2.95, w: 2, h: 1.0, fontSize: 54, fontFace: EB, color: i === 0 ? C.red : "C9C5BC", charSpacing: -2 });
    T(s, p[0], { x, y: 4.1, w: cw - 0.3, h: 0.45, fontSize: 17, fontFace: B });
    T(s, p[1], { x, y: 4.62, w: cw - 0.3, h: 0.8, fontSize: 11.5, color: C.sub, lineSpacingMultiple: 1.4 });
    s.addShape(pptx.ShapeType.rect, { x, y: 5.55, w: cw - 0.3, h: 0.9, fill: { color: "FFFFFF" }, line: { color: "FFFFFF" } });
    T(s, p[2], { x: x + 0.15, y: 5.68, w: cw - 0.6, h: 0.7, fontSize: 10.5, color: C.ink, lineSpacingMultiple: 1.35 });
  });
  T(s, "적용 예시", { x: 0.6, y: 5.25, w: 2, h: 0.25, fontSize: 9, color: C.sub, fontFace: B, charSpacing: 2 });
  pageNo(s, 4);
}

/* 05 이용 흐름 */
{
  const s = pptx.addSlide(); s.background = { color: C.white };
  label(s, "02", "USER JOURNEY");
  T(s, "발주처가 묻는 순서대로 보여 줍니다", { x: 0.6, y: 1.05, w: 9, h: 0.7, fontSize: 30, fontFace: EB, charSpacing: -1 });
  const J = [["j1.jpg", "무엇을 하는 회사인가", "첫 화면 한 줄 소개 + 문의 버튼"], ["j2.jpg", "우리 같은 곳과 일했나", "발주처 유형별 안내"], ["j3.jpg", "비슷한 사례가 있나", "과제 · 수행 · 결과 카드"], ["j4.jpg", "바로 문의할 수 있나", "필수 3칸 문의, 전화번호"]];
  const iw = 2.75, ih = iw / 0.79, gap = (12.13 - iw * 4) / 3;
  J.forEach((j, i) => {
    const x = 0.6 + i * (iw + gap);
    s.addImage({ path: A(j[0]), x, y: 2.0, w: iw, h: ih });
    s.addShape(pptx.ShapeType.rect, { x, y: 2.0, w: iw, h: ih, fill: { type: "none" }, line: { color: "E2E2E2", width: 0.75 } });
    T(s, "STEP " + (i + 1), { x, y: 2.0 + ih + 0.18, w: 2, h: 0.25, fontSize: 9, fontFace: EB, color: C.red, charSpacing: 2 });
    T(s, j[1], { x, y: 2.0 + ih + 0.45, w: iw, h: 0.35, fontSize: 14, fontFace: B });
    T(s, j[2], { x, y: 2.0 + ih + 0.82, w: iw, h: 0.3, fontSize: 10.5, color: C.sub });
  });
  pageNo(s, 5);
}

/* 06~09 디자인 시안 */
const CON = [
  { k: "A", en: "Corporate\nClassic", ko: "기업 정통형", bg: C.navy, fg: C.white, sub: "C5D0E0", pal: ["1D395E", "BC1616", "FFFFFF"], kw: "전체 화면 사진 · 큰 영문 타이포 · 사업 바로가기 줄", fit: "공공기관·대기업에 무난하고 신뢰감 있는 첫인상", desc: "국내 대기업·건설사 홈페이지의 익숙한 구조에, 사진 위 큰 영문 타이포와 첫 화면 아래 사업분야 바로가기를 더했습니다." },
  { k: "B", en: "Project\nPortfolio", ko: "프로젝트 중심형", bg: "FFFFFF", fg: C.ink, sub: C.sub, pal: ["111111", "FFFFFF", "BC1616"], kw: "흰 바탕 · 큰 사진 · 실적 목록이 주인공", fit: "실적으로 말하는 설계사무소 같은 인상", desc: "설계사무소 포트폴리오처럼 실적 목록이 첫 화면의 중심입니다. 줄을 누르면 과제·수행·결과가 펼쳐집니다." },
  { k: "C", en: "Dark\nPremium", ko: "다크 프리미엄형", bg: "101216", fg: C.white, sub: "9EA4AE", pal: ["0B0D11", "D42A1F", "ECEEF2"], kw: "어두운 바탕 · 슬라이드별 큰 영문 단어 · 가로 사례 카드", fit: "기술력과 고급스러움을 강조하고 싶을 때", desc: "DESIGN · SUPERVISION · RESEARCH가 넘어가는 첫 화면, 스크롤하면 한 단어씩 밝아지는 소개 문장으로 인상을 남깁니다." },
  { k: "D", en: "White\nModern", ko: "화이트 모던형", bg: C.off, fg: C.ink, sub: C.sub, pal: ["FFFFFF", "1D395E", "C8191B"], kw: "영문 타이포·사진 겹침 · 사업·발주처 탭 · 홍보영상", fit: "깔끔하면서 정보를 많이 담아야 할 때", desc: "‘SAFETY, ENGINEERED’ 타이포가 사진과 겹치는 첫 화면. 사업분야와 발주처 유형을 탭으로 골라 봅니다." }];
CON.forEach((c, i) => {
  const s = pptx.addSlide(); s.background = { color: c.bg };
  const dark = c.fg === C.white;
  label(s, "03", "DESIGN CONCEPT " + c.k, dark);
  T(s, c.en, { x: 0.6, y: 1.2, w: 4.6, h: 2.0, fontSize: 46, fontFace: EB, color: c.fg, charSpacing: -1.5, lineSpacingMultiple: 0.9 });
  T(s, c.k + ". " + c.ko, { x: 0.62, y: 3.25, w: 4.4, h: 0.4, fontSize: 17, fontFace: B, color: c.fg });
  T(s, c.desc, { x: 0.62, y: 3.8, w: 4.2, h: 1.2, fontSize: 11.5, color: c.sub, lineSpacingMultiple: 1.5 });
  T(s, "KEYWORD", { x: 0.62, y: 5.1, w: 2, h: 0.22, fontSize: 8.5, fontFace: EB, color: C.red, charSpacing: 2 });
  T(s, c.kw, { x: 0.62, y: 5.36, w: 4.3, h: 0.5, fontSize: 11, color: c.fg, lineSpacingMultiple: 1.35 });
  T(s, "COLOR", { x: 0.62, y: 6.0, w: 2, h: 0.22, fontSize: 8.5, fontFace: EB, color: C.red, charSpacing: 2 });
  c.pal.forEach((p, j) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.62 + j * 0.62, y: 6.28, w: 0.5, h: 0.5, fill: { color: p }, line: { color: dark ? "8A96A8" : "BDB9B1", width: 1 } });
  });
  T(s, "추천: " + c.fit, { x: 2.65, y: 6.33, w: 2.15, h: 0.45, fontSize: 9.5, color: c.sub, lineSpacingMultiple: 1.3 });
  browser(s, c.k + "_pc.jpg", 5.55, 0.95, 7.25);
  phone(s, c.k + "_mo.jpg", 4.95, 3.55, 1.6);
  pageNo(s, 6 + i, dark);
});

/* 10 반응형 */
{
  const s = pptx.addSlide(); s.background = { color: C.red };
  T(s, "03", { x: 0.6, y: 0.55, w: 0.6, h: 0.3, fontSize: 11, fontFace: EB, color: C.white });
  T(s, "RESPONSIVE", { x: 1.05, y: 0.55, w: 6, h: 0.3, fontSize: 11, fontFace: B, color: C.white, charSpacing: 3 });
  T(s, "ONE CONTENT,\nEVERY SCREEN", { x: 0.6, y: 1.25, w: 5, h: 1.9, fontSize: 40, fontFace: EB, color: C.white, charSpacing: -1, lineSpacingMultiple: 0.9 });
  T(s, "PC · 태블릿 · 폰에서 같은 내용을 그대로.\n폰에서는 화면 아래에 전화·사업 문의 버튼이 늘 떠 있어, 미팅 중에도 바로 연락할 수 있습니다.", { x: 0.62, y: 3.4, w: 4.3, h: 1.6, fontSize: 12, color: "FFE3E0", lineSpacingMultiple: 1.5 });
  T(s, "국문 / 영문 전환 · 메뉴 펼침 · 하단 고정 문의", { x: 0.62, y: 5.3, w: 4.3, h: 0.3, fontSize: 10.5, color: C.white, fontFace: B });
  ["A", "B", "C", "D"].forEach((k, i) => phone(s, k + "_mo.jpg", 5.35 + i * 1.95, 1.0 + (i % 2) * 0.45, 1.75));
  pageNo(s, 10, true);
}

/* 11 CMS */
{
  const s = pptx.addSlide(); s.background = { color: C.dark };
  label(s, "04", "CMS", true);
  T(s, "EASY CMS", { x: 0.6, y: 1.15, w: 5, h: 0.9, fontSize: 46, fontFace: EB, color: C.white, charSpacing: -1.5 });
  T(s, "오픈 뒤 글·사진을 고치려고\n개발사를 부를 일이 없습니다", { x: 0.62, y: 2.1, w: 4.4, h: 0.9, fontSize: 16, fontFace: B, color: C.white, lineSpacingMultiple: 1.3 });
  const P = [["블록으로 페이지 편집", "제목·글·사진·숫자 블록을 끌어서 배치하고 바로 미리보기"], ["메뉴·팝업·배너 직접 관리", "메뉴 순서와 노출, 팝업 기간·위치, 첫 화면 배너까지"], ["임시저장 → 게시 → 되돌리기", "게시 전에는 안 보이고, 모든 변경은 이력으로 되돌림"]];
  P.forEach((p, i) => {
    const y = 3.35 + i * 1.02;
    T(s, "0" + (i + 1), { x: 0.62, y, w: 0.5, h: 0.35, fontSize: 12, fontFace: EB, color: C.red });
    T(s, p[0], { x: 1.1, y: y - 0.02, w: 3.9, h: 0.35, fontSize: 13.5, fontFace: B, color: C.white });
    T(s, p[1], { x: 1.1, y: y + 0.36, w: 3.9, h: 0.5, fontSize: 10.5, color: "9EA4AE", lineSpacingMultiple: 1.35 });
  });
  browser(s, "adm_page.jpg", 5.45, 1.15, 7.35);
  T(s, "관리자 시안 화면 — 페이지 편집 · 표본 데이터", { x: 5.45, y: 6.15, w: 7.35, h: 0.25, fontSize: 9, color: C.mute, align: "right" });
  pageNo(s, 11, true);
}

/* 12 CMS 21개 화면 */
{
  const s = pptx.addSlide(); s.background = { color: C.off };
  label(s, "04", "CMS — 21 SCREENS");
  T(s, "홈페이지의 모든 것을 한 곳에서", { x: 0.6, y: 1.05, w: 9, h: 0.7, fontSize: 30, fontFace: EB, charSpacing: -1 });
  const G = [["g_dash.jpg", "대시보드", "오늘 처리할 일 · 방문자 · 최근 변경"], ["g_menu.jpg", "메뉴 관리", "끌어서 순서 변경 · 노출 · 연결 페이지"], ["g_popup.jpg", "팝업", "기간 · 위치 · 기기 · 바로 미리보기"], ["g_board.jpg", "게시판 (실적 외 5종)", "목록에서 눌러 팝업으로 편집 · 국/영문"], ["g_inquiry.jpg", "문의 관리", "담당 본부 자동 배정 · 메모 · 답장"], ["g_users.jpg", "관리자 계정·권한", "역할별 보기 · 수정 · 게시 권한"]];
  const gw = 3.3, gh = gw / 1.6, gx = (12.13 - gw * 3) / 2;
  G.forEach((g, i) => {
    const x = 0.6 + (i % 3) * (gw + gx), y = 1.85 + Math.floor(i / 3) * (gh + 0.55);
    s.addImage({ path: A(g[0]), x, y, w: gw, h: gh });
    s.addShape(pptx.ShapeType.rect, { x, y, w: gw, h: gh, fill: { type: "none" }, line: { color: "D5D2CB", width: 0.75 } });
    T(s, [{ text: g[1] + "   ", options: { fontFace: B, fontSize: 12, color: C.ink } }, { text: g[2], options: { fontSize: 9.5, color: C.sub } }], { x, y: y + gh + 0.1, w: gw + 0.3, h: 0.3 });
  });
  pageNo(s, 12);
}

/* 13 일정 — 간트 */
{
  const s = pptx.addSlide(); s.background = { color: C.white };
  label(s, "05", "SCHEDULE");
  T(s, "착수부터 오픈까지 약 12주", { x: 0.6, y: 1.05, w: 9, h: 0.7, fontSize: 30, fontFace: EB, charSpacing: -1 });
  const x0 = 3.6, cw = (12.73 - x0) / 12, y0 = 2.15, rh = 0.56;
  for (let w = 0; w < 12; w++) {
    T(s, "W" + (w + 1), { x: x0 + w * cw, y: y0, w: cw, h: 0.3, fontSize: 9, fontFace: B, color: C.sub, align: "center" });
    s.addShape(pptx.ShapeType.line, { x: x0 + w * cw, y: y0 + 0.35, w: 0, h: rh * 7 + 0.1, line: { color: "EEEEEE", width: 0.5 } });
  }
  const rows = [["요구사항 · 시안 확정", "메뉴 구조, 자료 목록, 시안 선택", 0, 2, C.ink], ["디자인", "메인 · 하위 화면, 국/영문", 2, 5, C.navy], ["관리자 설계", "화면 · 권한 · 게시 흐름", 3, 5, C.navy], ["개발", "반응형 홈페이지 · 관리자", 5, 10, C.red], ["자료 이관", "실적 · 인증 · 소식 · 연혁", 7, 10, C.red], ["검수 · 교육", "접근성 · 보안 점검, 담당자 교육", 10, 12, "6B7079"], ["오픈", "", 11.75, 12, C.red]];
  rows.forEach((r, i) => {
    const y = y0 + 0.45 + i * rh;
    s.addShape(pptx.ShapeType.line, { x: 0.6, y: y + rh - 0.04, w: 12.13, h: 0, line: { color: "F0F0F0", width: 0.5 } });
    T(s, r[0], { x: 0.6, y: y + 0.07, w: 2.9, h: 0.28, fontSize: 12, fontFace: B });
    if (r[1]) T(s, r[1], { x: 0.6, y: y + 0.33, w: 2.9, h: 0.22, fontSize: 8.5, color: C.sub });
    if (r[0] === "오픈") {
      s.addShape(pptx.ShapeType.diamond, { x: x0 + 11.6 * cw, y: y + 0.1, w: 0.32, h: 0.32, fill: { color: C.red }, line: { color: C.red } });
    } else {
      s.addShape(pptx.ShapeType.rect, { x: x0 + r[2] * cw + 0.03, y: y + 0.14, w: (r[3] - r[2]) * cw - 0.06, h: 0.26, fill: { color: r[4] }, line: { color: r[4] } });
    }
  });
  const ms = [[2, "시안 확정"], [5, "디자인 확정"], [12, "오픈"]];
  ms.forEach((m) => T(s, "▲ " + m[1], { x: x0 + m[0] * cw - 0.75, y: y0 + 0.45 + 7 * rh + 0.05, w: 1.5, h: 0.25, fontSize: 9, fontFace: B, color: C.red, align: "center" }));
  T(s, "기간은 시안 확정 시점과 자료(사진·실적·영문) 준비 속도에 따라 조정합니다.", { x: 0.62, y: 1.72, w: 9, h: 0.25, fontSize: 9.5, color: C.sub });
  pageNo(s, 13);
}

/* 14 범위 */
{
  const s = pptx.addSlide(); s.background = { color: C.off };
  label(s, "05", "SCOPE");
  T(s, "만들어 드리는 것과\n함께 준비할 것", { x: 0.6, y: 1.05, w: 5, h: 1.4, fontSize: 30, fontFace: EB, charSpacing: -1, lineSpacingMultiple: 1.1 });
  const L = [["반응형 홈페이지", "PC · 태블릿 · 모바일, 국문 / 영문"], ["관리자(CMS) 21개 화면", "메뉴 · 페이지 · 배너 · 팝업 · 게시판 · 접수함 · 계정"], ["자료 이관", "현재 홈페이지 실적 · 인증 · 소식 · 연혁"], ["품질 점검", "웹 접근성, 보안 점검, 검색 노출(SEO)"], ["교육 · 안정화", "담당자 교육, 오픈 후 안정화 지원"]];
  T(s, "DELIVERABLES", { x: 0.6, y: 2.85, w: 4, h: 0.25, fontSize: 9, fontFace: EB, color: C.red, charSpacing: 2 });
  L.forEach((l, i) => {
    const y = 3.2 + i * 0.7;
    s.addShape(pptx.ShapeType.line, { x: 0.6, y, w: 5.6, h: 0, line: { color: C.line, width: 0.75 } });
    T(s, l[0], { x: 0.6, y: y + 0.12, w: 2.4, h: 0.3, fontSize: 12.5, fontFace: B });
    T(s, l[1], { x: 3.0, y: y + 0.14, w: 3.3, h: 0.45, fontSize: 10.5, color: C.sub, lineSpacingMultiple: 1.3 });
  });
  s.addShape(pptx.ShapeType.rect, { x: 6.9, y: 1.05, w: 5.83, h: 5.6, fill: { color: C.dark }, line: { color: C.dark } });
  T(s, "TOGETHER", { x: 7.35, y: 1.45, w: 4, h: 0.25, fontSize: 9, fontFace: EB, color: C.red, charSpacing: 2 });
  T(s, "시작 전에 함께 정할 것", { x: 7.35, y: 1.8, w: 5, h: 0.5, fontSize: 20, fontFace: B, color: C.white });
  const Q = [["시안 선택", "A~D 중 하나, 또는 장점을 조합"], ["사진 · 사례 자료", "현장 사진과 실적별 과제 · 결과"], ["발주처 로고", "사용 허락을 받은 로고만 게시"], ["영문 범위", "전체 번역 또는 주요 화면만"], ["도메인 · 호스팅", "현재 주소 유지, 서버 위치"]];
  Q.forEach((q, i) => {
    const y = 2.6 + i * 0.78;
    T(s, "0" + (i + 1), { x: 7.35, y, w: 0.5, h: 0.3, fontSize: 11, fontFace: EB, color: C.red });
    T(s, q[0], { x: 7.85, y: y - 0.02, w: 4.5, h: 0.3, fontSize: 13, fontFace: B, color: C.white });
    T(s, q[1], { x: 7.85, y: y + 0.3, w: 4.5, h: 0.3, fontSize: 10.5, color: "9EA4AE" });
  });
  pageNo(s, 14);
}

/* 15 마무리 */
{
  const s = pptx.addSlide(); s.background = { color: C.dark };
  s.addImage({ path: A("C_pc.jpg"), x: 6.2, y: 0, w: 7.133, h: 7.5, sizing: { type: "cover", w: 7.133, h: 7.5 }, transparency: 55 });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 7.2, h: H, fill: { color: C.dark }, line: { color: C.dark } });
  T(s, "THANK\nYOU", { x: 0.65, y: 1.6, w: 6, h: 2.8, fontSize: 80, fontFace: EB, color: C.white, charSpacing: -2, lineSpacingMultiple: 0.88 });
  s.addShape(pptx.ShapeType.rect, { x: 0.72, y: 4.6, w: 0.5, h: 0.06, fill: { color: C.red }, line: { color: C.red } });
  T(s, "시안은 브라우저로 직접 열어 보실 수 있습니다.\n국문 / 영문, PC / 폰, 관리자 화면까지 실제로 눌러 보실 수 있습니다.", { x: 0.7, y: 4.85, w: 6, h: 0.8, fontSize: 12, color: "B8BDC6", lineSpacingMultiple: 1.5 });
  T(s, "(주)위트코시스템즈", { x: 0.7, y: 6.55, w: 5, h: 0.3, fontSize: 11, fontFace: B, color: C.white });
}

pptx.writeFile({ fileName: OUT }).then((f) => console.log("written", f));
