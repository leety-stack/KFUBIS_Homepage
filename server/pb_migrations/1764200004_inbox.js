/// <reference path="../pb_data/types.d.ts" />
// 3단계 — 접수함: 문의(inquiries)·실적증명 요청(certreqs)·입사 지원(applications), 회사 정보에 본부 메일 추가
// 홈페이지(비로그인)는 접수만 가능 — 상태·담당·메모·기록은 못 넣음. 기본값·자동 배정·알림 메일은 pb_hooks/inbox.pb.js

const TOP = "@request.auth.role.locked = true";
const LV = (k, n) => `@request.auth.role.perms.${k} >= ${n}`;
const auto = () => [
  { name: "created", type: "autodate", onCreate: true, onUpdate: false },
  { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
];
const FILES = (name, max) => ({ name, type: "file", maxSelect: max || 3, maxSize: 52428800, mimeTypes: [], protected: true });
const COMMON = () => [
  { name: "memos", type: "json", maxSize: 200000 }, // [{ at, by, text }] 내부 메모
  { name: "log", type: "json", maxSize: 200000 },   // [{ at, by, text }] 처리 기록
  { name: "lang", type: "select", maxSelect: 1, values: ["ko", "en"] },
  { name: "agree", type: "bool", required: true },  // 개인정보 수집·이용 동의
];
// 비로그인 접수 시 손대면 안 되는 칸
const PUBLIC_CREATE = (extra) => ["status", "memos", "log", ...(extra || [])].map((f) => `@request.body.${f}:isset = false`).join(" && ") + " && @request.body.agree = true";
// 본부 담당은 자기 본부 문의만
const SCOPE = "(@request.auth.role.inquiry_scope != '자기 본부' || dept = @request.auth.dept)";

migrate((app) => {
  app.save(new Collection({
    name: "inquiries", type: "base",
    listRule: `${TOP} || (${LV("inquiry", 1)} && ${SCOPE})`,
    viewRule: `${TOP} || (${LV("inquiry", 1)} && ${SCOPE})`,
    createRule: `(@request.auth.id = '' && ${PUBLIC_CREATE(["dept"])}) || ${TOP} || ${LV("inquiry", 2)}`,
    updateRule: `${TOP} || (${LV("inquiry", 2)} && ${SCOPE})`,
    deleteRule: TOP,
    fields: [
      { name: "org", type: "text", required: true, max: 100, presentable: true },
      { name: "name", type: "text", required: true, max: 50 },
      { name: "position", type: "text", max: 50 },
      { name: "tel", type: "text", required: true, max: 30 },
      { name: "email", type: "email" },
      { name: "org_type", type: "select", maxSelect: 1, values: ["공공기관", "대기업·건설사", "연구기관", "해외", "기타"] },
      { name: "field", type: "select", maxSelect: 1, values: ["설계", "감리", "성능위주설계", "연구개발·AI", "방재제품", "기타"] },
      { name: "message", type: "text", max: 5000 },
      FILES("attachments", 3),
      { name: "source", type: "text", max: 500 }, // 들어온 경로 (접속 통계 옵션)
      { name: "status", type: "select", maxSelect: 1, values: ["신규", "처리 중", "완료"] },
      { name: "dept", type: "select", maxSelect: 1, values: ["설계사업본부", "감리사업본부", "방재연구소", "R&D센터", "방재사업본부", "경영지원팀"] },
      ...COMMON(), ...auto(),
    ],
  }));

  app.save(new Collection({
    name: "certreqs", type: "base",
    listRule: `${TOP} || ${LV("certreq", 1)}`, viewRule: `${TOP} || ${LV("certreq", 1)}`,
    createRule: `(@request.auth.id = '' && ${PUBLIC_CREATE(["issued_file"])}) || ${TOP} || ${LV("certreq", 2)}`,
    updateRule: `${TOP} || ${LV("certreq", 2)}`, deleteRule: TOP,
    fields: [
      { name: "org", type: "text", required: true, max: 100, presentable: true },
      { name: "name", type: "text", required: true, max: 50 },
      { name: "tel", type: "text", required: true, max: 30 },
      { name: "email", type: "email", required: true },
      { name: "project", type: "text", required: true, max: 300 }, // 요청 실적
      { name: "purpose", type: "text", max: 200 },
      { name: "message", type: "text", max: 3000 },
      { name: "status", type: "select", maxSelect: 1, values: ["신규", "처리 중", "발급 완료"] },
      FILES("issued_file", 1), // 발급한 실적증명서
      ...COMMON(), ...auto(),
    ],
  }));

  const jobs = app.findCollectionByNameOrId("jobs");
  app.save(new Collection({
    name: "applications", type: "base",
    listRule: `${TOP} || ${LV("apply", 1)}`, viewRule: `${TOP} || ${LV("apply", 1)}`,
    createRule: `(@request.auth.id = '' && ${PUBLIC_CREATE(["delete_after"])}) || ${TOP} || ${LV("apply", 2)}`, // 공고가 모집 중·온라인 지원인지는 hook에서 확인
    updateRule: `${TOP} || ${LV("apply", 2)}`, deleteRule: `${TOP} || ${LV("apply", 3)}`,
    fields: [
      { name: "job", type: "relation", collectionId: jobs.id, maxSelect: 1, required: true },
      { name: "name", type: "text", required: true, max: 50, presentable: true },
      { name: "tel", type: "text", required: true, max: 30 },
      { name: "email", type: "email", required: true },
      { name: "career", type: "text", max: 200 },
      { name: "message", type: "text", max: 3000 },
      FILES("resume", 3),
      { name: "status", type: "select", maxSelect: 1, values: ["신규", "서류 검토", "면접", "합격", "불합격"] },
      { name: "delete_after", type: "date" }, // 개인정보 자동 삭제일
      ...COMMON(), ...auto(),
    ],
  }));

  // 회사 정보: 본부별 알림 메일
  const st = app.findCollectionByNameOrId("site_settings");
  st.fields.add(new JSONField({ name: "dept_emails", maxSize: 20000 })); // { 본부: "a@x, b@x" }
  st.fields.add(new TextField({ name: "admin_email", max: 200 }));       // 1영업일 넘은 문의 알림 받을 메일
  app.save(st);
  const rec = app.findFirstRecordByFilter("site_settings", "id != ''");
  rec.set("dept_emails", { "설계사업본부": "", "감리사업본부": "", "방재연구소": "", "R&D센터": "", "방재사업본부": "", "경영지원팀": "" });
  app.save(rec);
}, (app) => {
  for (const n of ["applications", "certreqs", "inquiries"]) { try { app.delete(app.findCollectionByNameOrId(n)); } catch (_) {} }
  const st = app.findCollectionByNameOrId("site_settings");
  st.fields.removeByName("dept_emails"); st.fields.removeByName("admin_email"); app.save(st);
});
