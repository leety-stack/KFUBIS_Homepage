/// <reference path="../pb_data/types.d.ts" />
// 2단계 — 사이트 구성: 메뉴(menus), 메인 배너(banners), 팝업(popups), 메인 화면 구성(main_sections)
// 공개 여부는 visible. 권한: 3 게시(보이게 켜기 포함), 2 수정(보이게 켜기는 못 함)

const TOP = "@request.auth.role.locked = true";
const LV = (k, n) => `@request.auth.role.perms.${k} >= ${n}`;
const auto = () => [
  { name: "created", type: "autodate", onCreate: true, onUpdate: false },
  { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
];
const IMG = (name) => ({ name, type: "file", maxSelect: 1, maxSize: 15728640, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"], thumbs: ["400x300", "1200x0", "800x0"] });
const rules = (k, pub) => ({
  listRule: `${TOP} || ${LV(k, 1)} || (${pub})`,
  viewRule: `${TOP} || ${LV(k, 1)} || (${pub})`,
  createRule: `${TOP} || ${LV(k, 3)} || (${LV(k, 2)} && @request.body.visible != true)`,
  updateRule: `${TOP} || ${LV(k, 3)} || (${LV(k, 2)} && @request.body.visible != true)`,
  deleteRule: `${TOP} || ${LV(k, 3)}`,
});
// 기간: 비어 있으면 제한 없음
const PERIOD = "visible = true && (start = '' || start <= @now) && (end = '' || end >= @now)";

migrate((app) => {
  const menus = new Collection({
    name: "menus", type: "base", ...rules("menu", "visible = true"),
    fields: [
      { name: "name_ko", type: "text", required: true, max: 50, presentable: true },
      { name: "name_en", type: "text", max: 80 },
      { name: "slug", type: "text", max: 200 },
      { name: "link_type", type: "select", maxSelect: 1, values: ["page", "board", "url", "none"] },
      { name: "target", type: "text", max: 300 },
      { name: "new_window", type: "bool" },
      { name: "show_pc", type: "bool" }, { name: "show_mo", type: "bool" },
      { name: "sort", type: "number" },
      { name: "visible", type: "bool" },
      ...auto(),
    ],
  });
  app.save(menus);
  menus.fields.add(new RelationField({ name: "parent", collectionId: menus.id, maxSelect: 1, cascadeDelete: true }));
  app.save(menus);

  app.save(new Collection({
    name: "banners", type: "base", ...rules("banner", PERIOD),
    fields: [
      IMG("image"), IMG("image_mo"),
      { name: "big", type: "text", max: 60 },
      { name: "title_ko", type: "text", required: true, max: 120, presentable: true }, { name: "title_en", type: "text", max: 160 },
      { name: "desc_ko", type: "text", max: 200 }, { name: "desc_en", type: "text", max: 260 },
      { name: "btn_ko", type: "text", max: 30 }, { name: "btn_en", type: "text", max: 40 },
      { name: "link", type: "text", max: 300 },
      { name: "start", type: "date" }, { name: "end", type: "date" },
      { name: "sort", type: "number" }, { name: "visible", type: "bool" },
      ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "popups", type: "base", ...rules("popup", PERIOD),
    fields: [
      { name: "title", type: "text", required: true, max: 100, presentable: true },
      { name: "kind", type: "select", maxSelect: 1, values: ["이미지", "글", "이미지+글"] },
      IMG("image"), IMG("image_mo"),
      { name: "head_ko", type: "text", max: 100 }, { name: "body_ko", type: "text", max: 1000 },
      { name: "head_en", type: "text", max: 140 }, { name: "body_en", type: "text", max: 1400 },
      { name: "link", type: "text", max: 300 },
      { name: "pos", type: "number", onlyInt: true, min: 0, max: 8 },
      { name: "width", type: "number", onlyInt: true, min: 240, max: 640 },
      { name: "show_pc", type: "bool" }, { name: "show_mo", type: "bool" },
      { name: "pages", type: "select", maxSelect: 1, values: ["메인 화면만", "모든 페이지", "국문 사이트만", "영문 사이트만"] },
      { name: "close_opt", type: "select", maxSelect: 1, values: ["오늘 하루 보지 않기", "7일 동안 보지 않기", "다시 보지 않기"] },
      { name: "start", type: "date" }, { name: "end", type: "date" },
      { name: "sort", type: "number" }, { name: "visible", type: "bool" },
      ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "main_sections", type: "base", ...rules("main", "visible = true"),
    fields: [
      { name: "key", type: "text", required: true, max: 30, presentable: true },
      { name: "name", type: "text", max: 50 },
      { name: "locked", type: "bool" }, // 맨 위 고정 (첫 화면 계열사 선택·메인 배너)
      { name: "settings", type: "json", maxSize: 200000 },
      { name: "sort", type: "number" }, { name: "visible", type: "bool" },
      ...auto(),
    ],
    indexes: ["CREATE UNIQUE INDEX idx_main_sections_key ON main_sections (key)"],
  }));

  // ── 초기 데이터 ──
  const M = [
    ["회사소개", "Company", "company", "none", "", [["인사말", "CEO Message", "company/ceo"], ["경영이념", "Vision", "company/vision"], ["연혁", "History", "company/history"], ["조직도", "Organization", "company/org"], ["인증·수상", "Certifications", "company/certs"], ["오시는 길", "Location", "company/location"]]],
    ["사업분야", "Business", "business", "none", "", [["설계", "Design", "business/design"], ["감리", "Supervision", "business/supervision"], ["방재연구", "Research", "business/research"], ["R&D Center", "R&D Center", "business/rnd"], ["방재제품", "Products", "business/products"]]],
    ["주요실적", "Projects", "projects", "board", "works", []],
    ["연구개발", "R&D", "rnd", "board", "rnd", []],
    ["홍보센터", "PR", "pr", "none", "", [["새소식", "News", "pr/news", "board", "news"], ["자료실", "Downloads", "pr/downloads", "board", "downloads"]]],
    ["인재채용", "Careers", "careers", "board", "jobs", []],
  ];
  const mcol = app.findCollectionByNameOrId("menus");
  M.forEach((m, i) => {
    const top = new Record(mcol);
    top.set("name_ko", m[0]); top.set("name_en", m[1]); top.set("slug", m[2]); top.set("link_type", m[3]); top.set("target", m[4]);
    top.set("show_pc", true); top.set("show_mo", true); top.set("sort", (i + 1) * 10); top.set("visible", true);
    app.save(top);
    m[5].forEach((c, j) => {
      const r = new Record(mcol);
      r.set("name_ko", c[0]); r.set("name_en", c[1]); r.set("slug", c[2]); r.set("link_type", c[3] || "page"); r.set("target", c[4] || c[0]);
      r.set("show_pc", true); r.set("show_mo", true); r.set("sort", (j + 1) * 10); r.set("visible", true); r.set("parent", top.id);
      app.save(r);
    });
  });

  const file = (n) => { try { return $filesystem.fileFromPath("pb_seed/" + n); } catch (_) { return null; } };
  const bcol = app.findCollectionByNameOrId("banners");
  [["hero_coast.jpg", "Fire Protection Since 1947", "공항·초고층·플랜트의 소방설계와 감리", "Fire protection design & supervision for airports, towers and plants", "1947년 설립 · 1급 소방시설 설계·감리업 · 특허 76건", "사업 문의하기", "Request a consultation", "#inquiry", true],
   ["hero_airport.jpg", "Supervision", "국가기간시설 소방·전기·통신 감리", "Integrated supervision for national infrastructure", "인천국제공항 1·2단계부터 제2여객터미널까지", "실적 보기", "View projects", "/projects", true],
   ["p_data.jpg", "Research", "AI와 데이터로 여는 소방 엔지니어링", "Fire engineering powered by AI and data", "과학기술정보통신부 지정 소방안전 빅데이터센터", "R&D 보기", "View R&D", "/rnd", false]]
    .forEach((b, i) => {
      const r = new Record(bcol); const f = file(b[0]); if (f) r.set("image", f);
      r.set("big", b[1]); r.set("title_ko", b[2]); r.set("title_en", b[3]); r.set("desc_ko", b[4]); r.set("btn_ko", b[5]); r.set("btn_en", b[6]); r.set("link", b[7]);
      r.set("sort", (i + 1) * 10); r.set("visible", b[8]); app.save(r);
    });

  const pcol = app.findCollectionByNameOrId("popups");
  const p1 = new Record(pcol);
  p1.set("title", "연말연시 휴무 안내"); p1.set("kind", "글"); p1.set("head_ko", "연말연시 휴무 안내");
  p1.set("body_ko", "12월 31일(목)~1월 1일(금)은 휴무입니다.\n문의는 1월 4일부터 순서대로 답변드립니다."); p1.set("pos", 4); p1.set("width", 340);
  p1.set("show_pc", true); p1.set("show_mo", true); p1.set("pages", "메인 화면만"); p1.set("close_opt", "오늘 하루 보지 않기");
  p1.set("start", "2026-12-24 00:00:00.000Z"); p1.set("end", "2027-01-02 23:59:59.000Z"); p1.set("sort", 10); p1.set("visible", true); app.save(p1);
  const p2 = new Record(pcol); const pf = file("promo.png"); if (pf) p2.set("image", pf);
  p2.set("title", "회사 홍보 영상 안내"); p2.set("kind", "이미지"); p2.set("link", "/pr/news"); p2.set("pos", 0); p2.set("width", 300);
  p2.set("show_pc", true); p2.set("show_mo", false); p2.set("pages", "메인 화면만"); p2.set("close_opt", "7일 동안 보지 않기"); p2.set("sort", 20); p2.set("visible", false); app.save(p2);

  const scol = app.findCollectionByNameOrId("main_sections");
  const S = [
    ["gate", "첫 화면 계열사 선택", true, { repeat: "새로 접속할 때마다 한 번", remember: true, companies: [
      { name: "한방", en: "HANBANG", url: "https://hanbang1947.co.kr", desc: "", me: false },
      { name: "한방유비스", en: "HANBANG UBIS", url: "", desc: "공항·초고층·플랜트의 소방설계와 감리", me: true },
      { name: "케이유비스", en: "K-UBIS", url: "", desc: "", me: false },
      { name: "AI 계열사(가칭)", en: "HANBANG AI", url: "", desc: "소방 데이터·AI 엔지니어링", me: false }] }],
    ["hero", "첫 화면 (메인 배너)", true, { interval: 6 }],
    ["clients", "발주처 이름 띠", false, { items: ["인천국제공항공사", "롯데", "현대자동차", "현대제철", "정부종합청사", "주한미군"] }],
    ["biz", "사업분야", false, { title_ko: "사업분야", title_en: "Business" }],
    ["who", "발주처별 안내", false, { title_ko: "이런 발주처와 일합니다", title_en: "Who we work with" }],
    ["nums", "회사 소개 · 숫자", false, { items: [{ v: "1947", ko: "설립", en: "Founded" }, { v: "76", ko: "특허", en: "Patents" }, { v: "20", ko: "정부 포상·인증", en: "Awards" }, { v: "1", ko: "소방시설 설계·감리업 (급)", en: "Class 1 license" }] }],
    ["cases", "수행 사례", false, { count: 3, note: '실적 관리에서 "메인 수행 사례에 보이기"를 켠 것' }],
    ["news", "새소식", false, { count: 4, source: "새소식 + 보도자료" }],
    ["video", "홍보영상", false, { youtube: "" }],
    ["inq", "사업 문의", false, { title_ko: "사업 문의", title_en: "Project Inquiry" }],
  ];
  S.forEach((x, i) => {
    const r = new Record(scol);
    r.set("key", x[0]); r.set("name", x[1]); r.set("locked", x[2]); r.set("settings", x[3]); r.set("sort", (i + 1) * 10); r.set("visible", x[0] !== "video");
    app.save(r);
  });
}, (app) => {
  for (const n of ["main_sections", "popups", "banners", "menus"]) {
    try { app.delete(app.findCollectionByNameOrId(n)); } catch (_) {}
  }
});
