/// <reference path="../pb_data/types.d.ts" />
// 5단계 — 다국어 문구(i18n), 페이지 편집(pages), 검색 노출(seo_pages·seo_site), 접속 통계(visits), 변경 이력(change_log)
const TOP = "@request.auth.role.locked = true";
const LV = (k, n) => `@request.auth.role.perms.${k} >= ${n}`;
const auto = () => [
  { name: "created", type: "autodate", onCreate: true, onUpdate: false },
  { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
];
const IMG_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  // ── 다국어 문구: 버튼·안내문처럼 화면에 고정된 글자 ──
  app.save(new Collection({
    name: "i18n", type: "base",
    listRule: "", viewRule: "",
    createRule: `${TOP} || ${LV("i18n", 3)}`, updateRule: `${TOP} || ${LV("i18n", 2)}`, deleteRule: `${TOP} || ${LV("i18n", 3)}`,
    fields: [
      { name: "key", type: "text", required: true, max: 100, presentable: true },
      { name: "area", type: "text", max: 30 },
      { name: "ko", type: "text", max: 500 },
      { name: "en", type: "text", max: 500 },
      { name: "sort", type: "number" },
      ...auto(),
    ],
    indexes: ["CREATE UNIQUE INDEX idx_i18n_key ON i18n (key)"],
  }));

  // ── 페이지 편집: 블록(국/영문 함께)을 임시저장(draft) → 게시(live). 홈페이지는 /api/site/page 로 게시본만 읽음 ──
  app.save(new Collection({
    name: "pages", type: "base",
    listRule: `${TOP} || ${LV("page", 1)}`, viewRule: `${TOP} || ${LV("page", 1)}`,
    createRule: `${TOP} || ${LV("page", 3)}`,
    updateRule: `${TOP} || ${LV("page", 3)} || (${LV("page", 2)} && @request.body.live:isset = false && @request.body.published:isset = false)`,
    deleteRule: `${TOP} || ${LV("page", 3)}`,
    fields: [
      { name: "name", type: "text", required: true, max: 100, presentable: true }, // 예: 회사소개 › 인사말
      { name: "slug", type: "text", required: true, max: 200 },                     // 예: company/ceo
      { name: "draft", type: "json", maxSize: 2000000 },
      { name: "live", type: "json", maxSize: 2000000 },
      { name: "published", type: "date" },
      { name: "images", type: "file", maxSelect: 200, maxSize: 15 * 1024 * 1024, mimeTypes: IMG_MIME, thumbs: ["400x0", "1600x0"] },
      ...auto(),
    ],
    indexes: ["CREATE UNIQUE INDEX idx_pages_slug ON pages (slug)"],
  }));

  // ── 검색 노출 ──
  app.save(new Collection({
    name: "seo_pages", type: "base",
    listRule: "", viewRule: "",
    createRule: `${TOP} || ${LV("seo", 3)}`, updateRule: `${TOP} || ${LV("seo", 2)}`, deleteRule: `${TOP} || ${LV("seo", 3)}`,
    fields: [
      { name: "label", type: "text", required: true, max: 100, presentable: true },
      { name: "path", type: "text", required: true, max: 200 },
      { name: "title", type: "text", max: 100 },
      { name: "description", type: "text", max: 300 },
      { name: "title_en", type: "text", max: 100 },
      { name: "description_en", type: "text", max: 300 },
      { name: "sort", type: "number" },
      ...auto(),
    ],
    indexes: ["CREATE UNIQUE INDEX idx_seo_path ON seo_pages (path)"],
  }));
  app.save(new Collection({
    name: "seo_site", type: "base",
    listRule: "", viewRule: "", createRule: TOP, updateRule: `${TOP} || ${LV("seo", 2)}`, deleteRule: null,
    fields: [
      { name: "site_name", type: "text", max: 60, presentable: true },
      { name: "site_url", type: "text", max: 200 },
      { name: "og_image", type: "file", maxSelect: 1, maxSize: 10 * 1024 * 1024, mimeTypes: IMG_MIME, thumbs: ["1200x630"] },
      { name: "naver", type: "text", max: 200 },
      { name: "google", type: "text", max: 200 },
      ...auto(),
    ],
  }));

  // ── 접속 통계: 홈페이지가 /api/site/hit 로 보냄 (이름·IP 저장 안 함). 직접 읽기는 막고 /api/cms/stats 로 합계만 ──
  app.save(new Collection({
    name: "visits", type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: "day", type: "text", max: 10 },     // KST 날짜 YYYY-MM-DD
      { name: "path", type: "text", max: 300 },
      { name: "src", type: "text", max: 40 },     // 네이버 검색·구글 검색·직접 입력·나라장터·링크드인·홍보 링크·기타
      { name: "utm", type: "text", max: 100 },
      { name: "sid", type: "text", max: 40 },     // 브라우저 탭 단위 무작위 값 (사람을 알 수 없음)
      { name: "lang", type: "text", max: 5 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
    indexes: ["CREATE INDEX idx_visits_day ON visits (day)"],
  }));

  // ── 변경 이력: 관리자 화면에서 바꾼 것 (hooks/history.pb.js 가 남김) ──
  app.save(new Collection({
    name: "change_log", type: "base",
    listRule: `${TOP} || ${LV("history", 1)}`, viewRule: `${TOP} || ${LV("history", 1)}`,
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: "coll", type: "text", max: 50 },
      { name: "menu", type: "text", max: 20 },     // 관리자 메뉴 키 (걸러 보기용)
      { name: "rec_id", type: "text", max: 30 },
      { name: "title", type: "text", max: 200, presentable: true },
      { name: "action", type: "text", max: 10 },   // 추가 · 수정 · 삭제 · 되돌리기
      { name: "fields", type: "json", maxSize: 5000 },
      { name: "before", type: "json", maxSize: 4000000 },
      { name: "after", type: "json", maxSize: 4000000 },
      { name: "who", type: "relation", collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { name: "who_name", type: "text", max: 100 },
      { name: "reverted", type: "bool" },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
    indexes: ["CREATE INDEX idx_change_log_created ON change_log (created)", "CREATE INDEX idx_change_log_rec ON change_log (rec_id)"],
  }));

  // ── 처음 넣는 내용 ──
  const I = [
    ["header.contact", "헤더", "사업 문의", "Contact"], ["header.menu", "헤더", "전체 메뉴", "Menu"],
    ["main.cta", "메인", "사업 문의하기", "Request a consultation"], ["main.profile", "메인", "회사소개서 받기", "Company profile (PDF)"],
    ["main.clients", "메인", "함께한 발주처", "Clients we have worked with"],
    ["form.name", "문의", "이름", "Name"], ["form.org", "문의", "회사·기관명", "Company"], ["form.tel", "문의", "연락처", "Phone"],
    ["form.agree", "문의", "개인정보 수집·이용 동의", "I agree to the collection of personal information"],
    ["form.done", "문의", "문의가 접수되었습니다. 1영업일 안에 연락드립니다.", ""],
    ["board.list", "게시판", "목록", "List"], ["board.prev", "게시판", "이전 글", ""], ["board.next", "게시판", "다음 글", ""],
    ["works.task", "실적", "과제", "Task"], ["works.work", "실적", "수행", "Work"], ["works.result", "실적", "결과", "Result"],
    ["footer.privacy", "하단", "개인정보처리방침", "Privacy Policy"], ["footer.noemail", "하단", "이메일무단수집거부", ""],
    ["error.404", "오류", "페이지를 찾을 수 없습니다", ""],
  ];
  const ic = app.findCollectionByNameOrId("i18n");
  I.forEach((x, n) => { const r = new Record(ic); r.set("key", x[0]); r.set("area", x[1]); r.set("ko", x[2]); r.set("en", x[3]); r.set("sort", (n + 1) * 10); app.save(r); });

  const file = (n) => { try { return $filesystem.fileFromPath("pb_seed/" + n); } catch (_) { return null; } };
  const pc = app.findCollectionByNameOrId("pages");
  const pg = new Record(pc);
  pg.set("name", "회사소개 › 인사말"); pg.set("slug", "company/ceo");
  const imgs = ["hero_coast.jpg", "hero_airport.jpg"].map(file).filter((f) => f);
  if (imgs.length) pg.set("images", imgs);
  app.save(pg);
  const names = pg.get("images") || [];
  const blocks = [
    { t: "hero", img: names[0] || "", bg: "", sub: { ko: "회사소개", en: "Company" }, h: { ko: "인사말", en: "CEO Message" } },
    { t: "text", img: names[1] || "", bg: "", h: { ko: "79년, 소방 한 길", en: "79 years in fire protection" }, p: { ko: "1947년 조선소방기자재(주)로 출발한 한방유비스는 국내 처음으로 가스소화설비와 스프링클러 설비를 소개했습니다.\n앞으로도 사람의 생명을 지키는 기술로 보답하겠습니다.", en: "Founded in 1947, Hanbang UBIS introduced Korea's first gas suppression and sprinkler systems.\nWe will keep protecting lives through engineering." } },
    { t: "nums", bg: "", items: [{ v: "1947", l: { ko: "설립", en: "Founded" } }, { v: "76", l: { ko: "특허", en: "Patents" } }, { v: "20", l: { ko: "포상·인증", en: "Awards" } }] },
    { t: "sign", bg: "", p: { ko: "한방유비스(주) 대표이사", en: "CEO, Hanbang UBIS" }, h: { ko: "대표이사 이름", en: "" } },
    { t: "cta", bg: "", link: "inquiry", h: { ko: "프로젝트를 검토 중이신가요?", en: "Planning a project?" }, p: { ko: "사업 문의", en: "Contact us" } },
  ];
  pg.set("draft", blocks); pg.set("live", blocks); pg.set("published", new Date().toISOString().replace("T", " "));
  app.save(pg);

  const sc = app.findCollectionByNameOrId("seo_pages");
  [["메인", "/", "한방유비스 | 공항·초고층·플랜트 소방설계와 감리", "1947년 설립, 1급 소방시설 설계·감리업. 인천국제공항·롯데월드타워 소방설계와 감리, 성능위주설계, AI 소방 엔지니어링."],
   ["회사소개 › 인사말", "/company/ceo", "인사말 | 한방유비스", ""],
   ["사업분야 › 설계", "/business/design", "소방설계 | 한방유비스", "건축물 용도와 공간에 맞춘 종합 방재계획과 소방시설 설계."],
   ["실적", "/projects", "수행 실적 | 한방유비스", ""]].forEach((x, n) => {
    const r = new Record(sc); r.set("label", x[0]); r.set("path", x[1]); r.set("title", x[2]); r.set("description", x[3]); r.set("sort", (n + 1) * 10); app.save(r);
  });
  const ss = new Record(app.findCollectionByNameOrId("seo_site"));
  ss.set("site_name", "한방유비스"); ss.set("site_url", $os.getenv("SITE_URL") || "https://kfubis.co.kr");
  const og = file("hero_airport.jpg"); if (og) ss.set("og_image", og);
  app.save(ss);
}, (app) => {
  for (const n of ["change_log", "visits", "seo_site", "seo_pages", "pages", "i18n"]) { try { app.delete(app.findCollectionByNameOrId(n)); } catch (_) {} }
});
