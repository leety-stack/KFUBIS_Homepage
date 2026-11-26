/// <reference path="../pb_data/types.d.ts" />
// 초기 데이터 — 역할 4종, 첫 관리자 계정, 회사 정보, 현재 홈페이지에 공개된 실적·인증
// 첫 관리자 계정: 환경변수 CMS_ADMIN_EMAIL / CMS_ADMIN_PASSWORD (없으면 개발용 기본값 — 운영 전 반드시 바꿀 것)

// 메뉴 키 — admin/src/menu.ts 와 같아야 함
const MENUS = ["dash", "main", "banner", "menu", "page", "popup", "works", "news", "rnd", "certs", "downloads", "jobs",
  "inquiry", "certreq", "apply", "company", "i18n", "seo", "stats", "history", "users", "roles", "logins"];
const all = (v) => Object.fromEntries(MENUS.map((m) => [m, v]));

migrate((app) => {
  const rolesCol = app.findCollectionByNameOrId("roles");
  const R = [
    { name: "최고 관리자", description: "모든 메뉴를 보고 고치고 게시. 권한 변경 불가", perms: all(3), inquiry_scope: "전체", locked: true, sort: 1 },
    { name: "홍보 담당", description: "홈페이지 내용·배너·팝업·게시판 담당", inquiry_scope: "전체", sort: 2,
      perms: { ...all(0), dash: 1, main: 3, banner: 3, menu: 3, page: 3, popup: 3, works: 3, news: 3, rnd: 3, certs: 3, downloads: 3, jobs: 1, inquiry: 1, certreq: 2, company: 2, i18n: 3, seo: 2, stats: 1, history: 1 } },
    { name: "본부 담당", description: "자기 본부 문의 처리, 실적·R&D 수정", inquiry_scope: "자기 본부", sort: 3,
      perms: { ...all(0), dash: 1, works: 2, rnd: 2, downloads: 1, inquiry: 2, certreq: 1 } },
    { name: "채용 담당", description: "채용공고 게시, 입사 지원 처리", inquiry_scope: "전체", sort: 4,
      perms: { ...all(0), dash: 1, jobs: 3, apply: 2 } },
  ];
  let topRole = null;
  for (const r of R) {
    const rec = new Record(rolesCol);
    for (const k in r) rec.set(k, r[k]);
    app.save(rec);
    if (r.locked) topRole = rec;
  }

  const email = $os.getenv("CMS_ADMIN_EMAIL") || "admin@kfubis.local";
  const pw = $os.getenv("CMS_ADMIN_PASSWORD") || "kfubis-dev-1234";
  const usersCol = app.findCollectionByNameOrId("users");
  const u = new Record(usersCol);
  u.set("email", email); u.set("name", "최고 관리자"); u.set("dept", "홍보팀");
  u.set("verified", true); u.set("status", "사용"); u.set("role", topRole.id);
  u.setPassword(pw);
  app.save(u);

  const st = new Record(app.findCollectionByNameOrId("site_settings"));
  st.set("name_ko", "한방유비스(주)"); st.set("name_en", "Hanbang UBIS Co., Ltd.");
  st.set("ceo", "최두찬, 김상일"); st.set("biz_no", "220-81-15635");
  st.set("tel", "02-2023-5000"); st.set("fax", "02-2023-5007");
  st.set("addr_ko", "(04790) 서울특별시 성동구 성수일로 77 서울숲IT밸리 9층");
  st.set("addr_en", "9F Seoul Forest IT Valley, 77 Seongsuil-ro, Seongdong-gu, Seoul 04790");
  st.set("family", [{ name: "한방", url: "https://hanbang1947.co.kr" }, { name: "케이유비스", url: "" }, { name: "AI 계열사(가칭)", url: "" }]);
  app.save(st);

  // 현재 홈페이지 연혁에 나온 실적 (사례 결과·사진은 자료 받아 채움)
  const works = app.findCollectionByNameOrId("works");
  const W = [
    ["인천국제공항 제2여객터미널 확장(4단계)", "Incheon Int'l Airport Terminal 2 Expansion (Phase 4)", "공공·국가기간", "설계", "인천국제공항공사", 2018, true],
    ["현대자동차 신사옥(GBC)", "Hyundai Motor GBC", "초고층·복합", "설계", "현대자동차", 2015, true],
    ["잠실 롯데월드타워 초고층 감리", "Lotte World Tower — Supervision", "초고층·복합", "감리", "롯데", 2010, true],
    ["현대제철 당진공장 1기", "Hyundai Steel Dangjin Works Phase 1", "산업·플랜트", "설계", "현대제철", 2007, false],
    ["인천국제공항 1·2단계 소방공사 감리", "Incheon Int'l Airport Phase 1·2 — Supervision", "공공·국가기간", "감리", "인천국제공항공사", 2004, false],
  ];
  W.forEach((w, i) => {
    const r = new Record(works);
    r.set("name_ko", w[0]); r.set("name_en", w[1]); r.set("type", w[2]); r.set("scope", w[3]); r.set("client", w[4]);
    r.set("year", w[5]); r.set("main", w[6]); r.set("sort", i + 1); r.set("status", "게시");
    app.save(r);
  });

  // 현재 홈페이지 연혁에 나온 인증·면허·수상 (번호는 연혁 원문, 날짜는 확인 후 입력)
  const certs = app.findCollectionByNameOrId("certs");
  [["인증", "ISO 9001 / 14001 통합 인증", "ISO 9001 / 14001"], ["인증", "인공지능기술 인증", "AI Technology Certification", "", "CT8222-I0098"],
   ["인증", "소프트웨어 품질 인증(GS)", "GS Certification", "", "KTL-GS-23-0028"], ["면허", "1급 소방시설 설계 및 공사감리업", "Class 1 Fire Design & Supervision", "", "서울강남 제95-6호"],
   ["수상", "대통령 표창", "Presidential Citation", "", "제240504호"], ["수상", "중소벤처기업부 장관 표창", "Minister of SMEs Commendation", "", "제20321호"]]
    .forEach((c) => {
      const r = new Record(certs);
      r.set("cat", c[0]); r.set("name_ko", c[1]); r.set("name_en", c[2] || ""); r.set("no", c[4] || ""); r.set("status", "게시");
      app.save(r);
    });
}, (app) => {
  for (const n of ["certs", "works", "site_settings", "roles"]) {
    const col = app.findCollectionByNameOrId(n);
    app.findAllRecords(col).forEach((r) => app.delete(r));
  }
  const usersCol = app.findCollectionByNameOrId("users");
  app.findAllRecords(usersCol).forEach((r) => app.delete(r));
});
