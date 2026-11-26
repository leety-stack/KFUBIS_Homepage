/// <reference path="../pb_data/types.d.ts" />
// 한방유비스 홈페이지 CMS — 1단계 컬렉션
// roles(역할·권한), users 확장, 게시판 6종(works·news·rnd·certs·downloads·jobs), site_settings(회사 정보)

const auto = () => [
  { name: "created", type: "autodate", onCreate: true, onUpdate: false },
  { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
];
const STATUS = { name: "status", type: "select", required: true, maxSelect: 1, values: ["게시", "임시저장", "숨김"] };
const IMG = (name) => ({ name, type: "file", maxSelect: 1, maxSize: 15728640, mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"], thumbs: ["400x300", "1200x0"] });
const DOC = (name, max) => ({ name, type: "file", maxSelect: max || 1, maxSize: 52428800, mimeTypes: [] });
// 권한은 서버에서도 확인 — 역할(roles)의 perms.{메뉴키}: 0 없음 · 1 보기 · 2 수정(임시저장까지) · 3 게시
const TOP = "@request.auth.role.locked = true";
const LV = (k, n) => `@request.auth.role.perms.${k} >= ${n}`;
const WRITE = "@request.auth.id != ''";
// 홈페이지(비로그인)는 "게시"만, 관리자는 보기 권한 이상이면 전부
const rules = (k, pub) => ({
  listRule: `${TOP} || ${LV(k, 1)} || (${pub || "status = '게시'"})`,
  viewRule: `${TOP} || ${LV(k, 1)} || (${pub || "status = '게시'"})`,
  createRule: `${TOP} || ${LV(k, 3)} || (${LV(k, 2)} && @request.body.status != '게시')`,
  updateRule: `${TOP} || ${LV(k, 3)} || (${LV(k, 2)} && @request.body.status != '게시')`,
  deleteRule: `${TOP} || ${LV(k, 3)}`,
});

migrate((app) => {
  // ── 역할 ──
  const roles = new Collection({
    name: "roles", type: "base",
    listRule: WRITE, viewRule: WRITE, createRule: TOP, updateRule: TOP, deleteRule: TOP,
    fields: [
      { name: "name", type: "text", required: true, max: 50, presentable: true },
      { name: "description", type: "text", max: 200 },
      { name: "perms", type: "json", maxSize: 20000 }, // { 메뉴키: 0~3 }
      { name: "inquiry_scope", type: "select", maxSelect: 1, values: ["전체", "자기 본부"] },
      { name: "locked", type: "bool" }, // 최고 관리자 — 권한 변경 불가
      { name: "sort", type: "number" },
      ...auto(),
    ],
    indexes: ["CREATE UNIQUE INDEX idx_roles_name ON roles (name)"],
  });
  app.save(roles);

  // ── 관리자 계정 (기본 users 확장) ──
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({ name: "dept", max: 50 }));
  users.fields.add(new TextField({ name: "tel", max: 30 }));
  users.fields.add(new RelationField({ name: "role", collectionId: roles.id, maxSelect: 1, cascadeDelete: false }));
  users.fields.add(new SelectField({ name: "status", maxSelect: 1, values: ["사용", "중지"] }));
  users.listRule = WRITE;
  users.viewRule = WRITE;
  users.createRule = TOP; // 밖에서 가입 못 함 — 최고 관리자가 초대
  users.updateRule = `${TOP} || (id = @request.auth.id && @request.body.role:isset = false && @request.body.status:isset = false)`;
  users.deleteRule = TOP;
  users.authRule = "status != '중지'"; // 중지된 계정은 로그인 불가
  app.save(users);

  // ── 게시판 ──
  app.save(new Collection({
    name: "works", type: "base", ...rules("works"),
    fields: [
      { name: "name_ko", type: "text", required: true, max: 300, presentable: true },
      { name: "name_en", type: "text", max: 300 },
      { name: "type", type: "select", maxSelect: 1, values: ["공공·국가기간", "초고층·복합", "산업·플랜트"] },
      { name: "scope", type: "select", maxSelect: 1, values: ["설계", "감리", "설계+감리", "성능위주설계"] },
      { name: "client", type: "text", max: 100 },
      { name: "client_hidden", type: "bool" },
      { name: "year", type: "number", onlyInt: true, min: 1947, max: 2100 },
      { name: "task_ko", type: "text", max: 300 }, { name: "task_en", type: "text", max: 300 },
      { name: "work_ko", type: "text", max: 300 }, { name: "work_en", type: "text", max: 300 },
      { name: "result_ko", type: "text", max: 300 }, { name: "result_en", type: "text", max: 300 },
      IMG("image"),
      { name: "main", type: "bool" },
      { name: "sort", type: "number" },
      STATUS, ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "news", type: "base",
    ...rules("news", "status = '게시' && publish_at <= @now"),
    fields: [
      { name: "cat", type: "select", required: true, maxSelect: 1, values: ["새소식", "보도자료", "수상"] },
      { name: "title_ko", type: "text", required: true, max: 300, presentable: true },
      { name: "title_en", type: "text", max: 300 },
      { name: "body_ko", type: "editor", maxSize: 2000000 },
      { name: "body_en", type: "editor", maxSize: 2000000 },
      IMG("image"),
      DOC("attachments", 5),
      { name: "pinned", type: "bool" },
      { name: "publish_at", type: "date" }, // 미래 날짜면 그날 자동 게시
      STATUS, ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "rnd", type: "base", ...rules("rnd"),
    fields: [
      { name: "title_ko", type: "text", required: true, max: 300, presentable: true },
      { name: "title_en", type: "text", max: 300 },
      { name: "org", type: "text", max: 100 },
      { name: "start", type: "date" }, { name: "end", type: "date" },
      { name: "state", type: "select", maxSelect: 1, values: ["수행 중", "완료"] },
      { name: "summary_ko", type: "text", max: 1000 }, { name: "summary_en", type: "text", max: 1000 },
      IMG("image"),
      STATUS, ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "certs", type: "base", ...rules("certs"),
    fields: [
      { name: "cat", type: "select", required: true, maxSelect: 1, values: ["인증", "수상", "특허", "면허"] },
      { name: "name_ko", type: "text", required: true, max: 300, presentable: true },
      { name: "name_en", type: "text", max: 300 },
      { name: "org", type: "text", max: 100 },
      { name: "no", type: "text", max: 100 },
      { name: "issued", type: "date" },
      { name: "expires", type: "date" }, // 끝나기 30일 전 대시보드 알림
      IMG("image"),
      STATUS, ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "downloads", type: "base", ...rules("downloads"),
    fields: [
      { name: "cat", type: "select", required: true, maxSelect: 1, values: ["회사소개서", "면허·등록증", "인증서", "카탈로그"] },
      { name: "name_ko", type: "text", required: true, max: 300, presentable: true },
      { name: "name_en", type: "text", max: 300 },
      DOC("file_ko"), DOC("file_en"),
      { name: "access", type: "select", maxSelect: 1, values: ["누구나", "요청 후 발송"] },
      { name: "download_count", type: "number", onlyInt: true },
      STATUS, ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "jobs", type: "base", ...rules("jobs"),
    fields: [
      { name: "title", type: "text", required: true, max: 300, presentable: true },
      { name: "part", type: "text", max: 100 },
      { name: "career", type: "select", maxSelect: 1, values: ["신입", "경력 3년 이상", "경력 5년 이상", "무관"] },
      { name: "due", type: "date" },
      { name: "until_filled", type: "bool" },
      { name: "state", type: "select", maxSelect: 1, values: ["모집 중", "마감"] },
      { name: "body", type: "editor", maxSize: 2000000 },
      { name: "online_apply", type: "bool" },
      STATUS, ...auto(),
    ],
  }));

  // ── 회사 정보 (한 건) ──
  app.save(new Collection({
    name: "site_settings", type: "base",
    listRule: "", viewRule: "", createRule: TOP, updateRule: `${TOP} || ${LV("company", 2)}`, deleteRule: null,
    fields: [
      { name: "name_ko", type: "text", max: 100 }, { name: "name_en", type: "text", max: 100 },
      { name: "ceo", type: "text", max: 100 }, { name: "biz_no", type: "text", max: 30 },
      { name: "tel", type: "text", max: 30 }, { name: "fax", type: "text", max: 30 }, { name: "email", type: "text", max: 100 },
      { name: "addr_ko", type: "text", max: 300 }, { name: "addr_en", type: "text", max: 300 },
      { name: "family", type: "json", maxSize: 20000 }, // [{ name, url }]
      IMG("logo_light"), IMG("logo_dark"),
      ...auto(),
    ],
  }));
}, (app) => {
  for (const n of ["site_settings", "jobs", "downloads", "certs", "rnd", "news", "works"]) {
    try { app.delete(app.findCollectionByNameOrId(n)); } catch (_) {}
  }
  const users = app.findCollectionByNameOrId("users");
  for (const f of ["dept", "tel", "role", "status"]) users.fields.removeByName(f);
  users.authRule = ""; users.createRule = ""; users.updateRule = "id = @request.auth.id"; users.deleteRule = "id = @request.auth.id"; app.save(users);
  try { app.delete(app.findCollectionByNameOrId("roles")); } catch (_) {}
});
