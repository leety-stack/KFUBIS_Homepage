/// <reference path="../pb_data/types.d.ts" />
// 관리자 계정 — 로그인 기록·실패 잠금, 초대·비밀번호 재설정·잠금 풀기·모든 기기 로그아웃, 로그인 규칙

// ── 비밀번호 로그인: 잠금 확인, 성공·실패 기록, 실패가 쌓이면 잠금 ──
onRecordAuthWithPasswordRequest((e) => {
  const a = require(`${__hooks}/acct_utils.js`);
  const rules = a.rules(), rec = e.record, now = new Date();
  if (rec) {
    const lu = a.time(rec.getString("locked_until"));
    if (lu && lu > now) {
      a.log(e, rec, e.identity, false, "잠긴 계정으로 로그인 시도");
      throw new BadRequestError(`로그인 실패가 많아 계정이 잠겼습니다. ${Math.ceil((lu - now) / 60000)}분 뒤 다시 시도하거나 최고 관리자에게 잠금 해제를 요청하세요.`);
    }
  }
  try {
    e.next();
  } catch (err) {
    const msg = String(err);
    if (/multi-factor|mfa/i.test(msg)) { a.log(e, rec, e.identity, true, "비밀번호 확인 · 2단계 인증 대기"); throw err; }
    a.log(e, rec, e.identity, false, rec ? (rec.getString("status") === "중지" ? "중지된 계정" : "비밀번호 틀림") : "없는 계정");
    if (rec) {
      // 마지막 성공 이후, 잠금 시간 안의 연속 실패 수
      const since = new Date(Math.max(now - rules.lock_minutes * 60000, a.time(rec.getString("last_login")) || 0)).toISOString().replace("T", " ");
      const fails = $app.findRecordsByFilter("login_logs", "user = {:u} && ok = false && created >= {:s}", "", 100, 0, { u: rec.id, s: since }).length;
      if (fails >= rules.fail_limit) {
        rec.set("locked_until", new Date(Date.now() + rules.lock_minutes * 60000).toISOString().replace("T", " "));
        $app.save(rec);
        a.log(e, rec, e.identity, false, `연속 ${fails}번 실패 — ${rules.lock_minutes}분 잠금`);
      }
    }
    throw err;
  }
  if (e.record) {
    e.record.set("last_login", new Date().toISOString().replace("T", " "));
    e.record.set("locked_until", "");
    $app.save(e.record);
    a.log(e, e.record, e.identity, true, "로그인");
  }
}, "users");

// ── 2단계 인증(메일 인증번호) 완료 ──
onRecordAuthWithOTPRequest((e) => {
  const a = require(`${__hooks}/acct_utils.js`);
  try { e.next(); } catch (err) { a.log(e, e.record, e.record ? e.record.getString("email") : "", false, "인증번호 틀림"); throw err; }
  if (e.record) { e.record.set("last_login", new Date().toISOString().replace("T", " ")); $app.save(e.record); a.log(e, e.record, e.record.getString("email"), true, "로그인 · 2단계 인증 완료"); }
}, "users");

// ── 최고 관리자 전용 API ──
routerAdd("POST", "/api/cms/users/invite", (e) => {
  const a = require(`${__hooks}/acct_utils.js`); a.requireTop(e);
  const b = e.requestInfo().body || {};
  const email = String(b.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return e.json(400, { message: "메일 주소를 확인하세요" });
  try { $app.findAuthRecordByEmail("users", email); return e.json(400, { message: "이미 있는 메일 주소입니다" }); } catch (_) {}
  const col = $app.findCollectionByNameOrId("users");
  const u = new Record(col);
  u.set("email", email); u.set("name", String(b.name || "")); u.set("dept", String(b.dept || "")); u.set("tel", String(b.tel || ""));
  u.set("role", String(b.role || "")); u.set("status", "사용"); u.set("verified", true);
  u.setPassword($security.randomString(24)); // 본인이 메일로 비밀번호를 정함 — 관리자는 모름
  $app.save(u);
  let mailed = true, warn = "";
  try { $mails.sendRecordPasswordReset($app, u); } catch (err) { mailed = false; warn = String(err); }
  return e.json(200, { id: u.id, mailed: mailed, message: mailed ? "" : `계정은 만들었지만 초대 메일을 보내지 못했습니다 — ${warn}` });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/cms/users/reset", (e) => {
  const a = require(`${__hooks}/acct_utils.js`); a.requireTop(e);
  const u = a.target(e);
  try { $mails.sendRecordPasswordReset($app, u); } catch (err) { return e.json(502, { message: `메일을 보내지 못했습니다 — ${err}` }); }
  return e.json(200, { ok: true });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/cms/users/unlock", (e) => {
  const a = require(`${__hooks}/acct_utils.js`); a.requireTop(e);
  const u = a.target(e); u.set("locked_until", ""); $app.save(u);
  return e.json(200, { ok: true });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/cms/users/logout-all", (e) => {
  const a = require(`${__hooks}/acct_utils.js`); a.requireTop(e);
  const u = a.target(e); u.refreshTokenKey(); $app.save(u); // 지금까지 받은 로그인 토큰을 모두 무효로
  return e.json(200, { ok: true });
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/cms/login-rules", (e) => {
  const a = require(`${__hooks}/acct_utils.js`); a.requireTop(e);
  const b = e.requestInfo().body || {};
  const r = {
    fail_limit: Math.min(20, Math.max(3, Number(b.fail_limit) || 5)),
    lock_minutes: Math.min(1440, Math.max(5, Number(b.lock_minutes) || 30)),
    idle_minutes: Math.min(480, Math.max(10, Number(b.idle_minutes) || 30)),
    mfa: !!b.mfa,
  };
  const st = $app.findFirstRecordByFilter("site_settings", "id != ''"); st.set("login_rules", r); $app.save(st);
  const col = $app.findCollectionByNameOrId("users");
  col.otp.enabled = r.mfa; col.otp.duration = 300; col.otp.length = 6;
  col.mfa.enabled = r.mfa; col.mfa.duration = 600;
  $app.save(col);
  return e.json(200, r);
}, $apis.requireAuth("users"));

// 역할 삭제 — 쓰는 계정이 있으면 막음 (관계가 필수가 아니라 그냥 지우면 계정 역할이 비어 버림), 최고 관리자 역할은 지울 수 없음
onRecordDeleteRequest((e) => {
  if (e.record.getBool("locked")) throw new BadRequestError("최고 관리자 역할은 지울 수 없습니다");
  const n = $app.countRecords("users", $dbx.hashExp({ role: e.record.id }));
  if (n > 0) throw new BadRequestError(`이 역할을 쓰는 계정이 ${n}명 있어 지울 수 없습니다 — 먼저 다른 역할로 옮기세요`);
  e.next();
}, "roles");
