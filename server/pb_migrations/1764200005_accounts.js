/// <reference path="../pb_data/types.d.ts" />
// 4단계 — 관리자 계정·로그인 기록·로그인 규칙 (메일 인증·2단계 인증 없음: 최고 관리자가 임시 비밀번호를 정해 주고 본인이 첫 로그인 때 바꿈)
const TOP = "@request.auth.role.locked = true";

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new DateField({ name: "locked_until" })); // 로그인 실패가 많아 잠긴 시각까지
  users.fields.add(new DateField({ name: "last_login" }));
  users.fields.add(new BoolField({ name: "pw_temp" })); // 관리자가 정해 준 임시 비밀번호 — 첫 로그인 때 본인이 바꿔야 함
  // 본인은 이름·연락처·비밀번호만 고침 (역할·사용 여부·잠금·접속 시각·임시 표시는 못 건드림)
  users.updateRule = `${TOP} || (id = @request.auth.id && @request.body.role:isset = false && @request.body.status:isset = false && @request.body.locked_until:isset = false && @request.body.last_login:isset = false && @request.body.pw_temp:isset = false && @request.body.email:isset = false)`;
  app.save(users);

  app.save(new Collection({
    name: "login_logs", type: "base",
    listRule: `${TOP} || @request.auth.role.perms.logins >= 1`, viewRule: `${TOP} || @request.auth.role.perms.logins >= 1`,
    createRule: null, updateRule: null, deleteRule: TOP, // 기록은 서버(hook)만 남김
    fields: [
      { name: "email", type: "text", max: 200, presentable: true },
      { name: "user", type: "relation", collectionId: users.id, maxSelect: 1, cascadeDelete: false },
      { name: "ok", type: "bool" },
      { name: "reason", type: "text", max: 300 },
      { name: "ip", type: "text", max: 64 },
      { name: "ua", type: "text", max: 300 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
    indexes: ["CREATE INDEX idx_login_logs_created ON login_logs (created)"],
  }));

  const st = app.findCollectionByNameOrId("site_settings");
  st.fields.add(new JSONField({ name: "login_rules", maxSize: 2000 }));
  app.save(st);
  const rec = app.findFirstRecordByFilter("site_settings", "id != ''");
  rec.set("login_rules", { fail_limit: 5, lock_minutes: 30, idle_minutes: 30 });
  app.save(rec);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("login_logs")); } catch (_) {}
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("locked_until"); users.fields.removeByName("last_login"); users.fields.removeByName("pw_temp"); app.save(users);
  const st = app.findCollectionByNameOrId("site_settings"); st.fields.removeByName("login_rules"); app.save(st);
});
