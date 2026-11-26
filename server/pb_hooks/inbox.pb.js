/// <reference path="../pb_data/types.d.ts" />
// 접수함 — 접수 기본값·자동 배정, 알림 메일, 답장 메일, 매일 정리

// ── 접수될 때: 상태·담당 본부·처리 기록·삭제일 ──
onRecordCreate((e) => {
  const u = require(`${__hooks}/cms_utils.js`);
  const r = e.record, col = r.collection().name;
  if (!r.getString("status")) r.set("status", "신규");
  if (col === "inquiries" && !r.getString("dept")) r.set("dept", u.deptOf(r.getString("field")));
  if (col === "applications" && !r.getString("delete_after")) {
    const d = new Date(Date.now() + 180 * 864e5); r.set("delete_after", d.toISOString().replace("T", " "));
  }
  if (!u.readJson(r, "log").length) {
    u.addLog(r, "홈페이지", col === "inquiries" ? `홈페이지로 접수 · ${r.getString("dept")} 자동 배정` : "홈페이지로 접수");
  }
  e.next();
}, "inquiries", "certreqs", "applications");

// ── 홈페이지 입사 지원: 공고가 모집 중이고 온라인 지원을 받는지 ──
onRecordCreateRequest((e) => {
  if (!e.auth) {
    let job = null; try { job = $app.findRecordById("jobs", e.record.getString("job")); } catch (_) {}
    if (!job || job.getString("status") !== "게시" || job.getString("state") !== "모집 중" || !job.getBool("online_apply"))
      throw new BadRequestError("온라인 지원을 받지 않는 공고입니다");
  }
  e.next();
}, "applications");

// ── 접수된 뒤: 담당에게 알림 메일 ──
onRecordAfterCreateSuccess((e) => {
  e.next();
  const u = require(`${__hooks}/cms_utils.js`);
  const r = e.record, col = r.collection().name;
  const st = u.settings(); if (!st) return;
  let to = "", what = "";
  if (col === "inquiries") { to = (u.readJson(st, "dept_emails") || {})[r.getString("dept")] || st.getString("admin_email"); what = `[홈페이지 문의] ${r.getString("org")} · ${r.getString("field")}`; }
  else if (col === "certreqs") { to = (u.readJson(st, "dept_emails") || {})["경영지원팀"] || st.getString("admin_email"); what = `[실적증명 요청] ${r.getString("org")} · ${r.getString("project")}`; }
  else { to = st.getString("admin_email"); what = `[입사 지원] ${r.getString("name")}`; }
  if (!to) return;
  try {
    const sent = u.send(to, what, `<p>${u.esc(what)}</p><p>${u.esc(r.getString("message")).replace(/\n/g, "<br>")}</p><p>관리자 화면에서 확인하세요.</p>`);
    u.addLog(r, "시스템", `담당 알림 메일 발송 (${sent.join(", ")})`);
  } catch (err) {
    u.addLog(r, "시스템", `담당 알림 메일 실패 — ${err}`);
  }
  try { $app.save(r); } catch (_) {}
}, "inquiries", "certreqs", "applications");

// ── 답장 메일 ──
// POST /api/cms/reply  { collection, id, subject, body, status?, attach? }
routerAdd("POST", "/api/cms/reply", (e) => {
  const u = require(`${__hooks}/cms_utils.js`);
  const data = e.requestInfo().body || {};
  const col = String(data.collection || ""), key = u.menuOf(col);
  if (!key) return e.json(400, { message: "잘못된 요청입니다" });
  const auth = e.auth;
  let role = null; try { role = $app.findRecordById("roles", auth.getString("role")); } catch (_) {}
  const perms = role ? (u.readJson(role, "perms") || {}) : {};
  const top = role && role.getBool("locked");
  if (!top && !(Number(perms[key] || 0) >= 2)) return e.json(403, { message: "처리 권한이 없습니다" });
  let rec; try { rec = $app.findRecordById(col, String(data.id || "")); } catch (_) { return e.json(404, { message: "접수 건을 찾을 수 없습니다" }); }
  if (col === "inquiries" && !top && role.getString("inquiry_scope") === "자기 본부" && rec.getString("dept") !== auth.getString("dept"))
    return e.json(403, { message: "다른 본부 문의입니다" });
  const to = rec.getString("email");
  if (!to) return e.json(400, { message: "받는 사람 메일 주소가 없습니다" });

  let attachments = null, readers = [], fsys = null;
  try {
    if (data.attach && col === "certreqs" && rec.getString("issued_file")) {
      fsys = $app.newFilesystem();
      const name = rec.getString("issued_file");
      const rd = fsys.getReader(rec.baseFilesPath() + "/" + name); readers.push(rd);
      attachments = {}; attachments[name.replace(/_[a-z0-9]{10}(\.\w+)$/i, "$1")] = rd;
    }
    u.send(to, String(data.subject || "한방유비스 답변"), String(data.body || "").split("\n").map((l) => u.esc(l)).join("<br>"), attachments);
  } catch (err) {
    return e.json(502, { message: `메일을 보내지 못했습니다 — ${err}. 관리자 PocketBase 설정의 메일(SMTP)을 확인하세요.` });
  } finally {
    readers.forEach((r) => { try { r.close(); } catch (_) {} });
    if (fsys) { try { fsys.close(); } catch (_) {} }
  }
  const who = (auth.getString("name") || auth.getString("email"));
  u.addLog(rec, who, `답장 메일 발송 (${to})${attachments ? " · 실적증명서 첨부" : ""} — ${String(data.subject || "")}`);
  if (data.status) rec.set("status", String(data.status));
  $app.save(rec);
  return e.json(200, { ok: true });
}, $apis.requireAuth("users"));

// ── 매일 09:00: 기한 지난 지원서 삭제, 1영업일 넘은 신규 문의 알림 ──
cronAdd("cmsDaily", "0 9 * * *", () => {
  const u = require(`${__hooks}/cms_utils.js`);
  const now = new Date().toISOString().replace("T", " ");
  const old = $app.findRecordsByFilter("applications", "delete_after != '' && delete_after <= {:now}", "", 500, 0, { now: now });
  old.forEach((r) => { try { $app.delete(r); } catch (_) {} });
  const day = new Date(); const back = day.getDay() === 1 ? 3 : day.getDay() === 0 ? 2 : 1; // 월요일이면 금요일 것부터
  const lim = new Date(Date.now() - back * 864e5).toISOString().replace("T", " ");
  const late = $app.findRecordsByFilter("inquiries", "status = '신규' && created <= {:lim}", "created", 100, 0, { lim: lim });
  const st = u.settings();
  if (late.length && st && st.getString("admin_email")) {
    try { u.send(st.getString("admin_email"), `[홈페이지] 1영업일 넘게 처리 안 된 문의 ${late.length}건`, late.map((r) => `${u.esc(r.getString("org"))} · ${u.esc(r.getString("dept"))} · ${r.getString("created").slice(0, 10)}`).join("<br>")); } catch (_) {}
  }
});
