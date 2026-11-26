// 관리자 계정 공통 함수 — accounts.pb.js 에서 require
module.exports = {
  rules() {
    const d = { fail_limit: 5, lock_minutes: 30, idle_minutes: 30 };
    try {
      const st = $app.findFirstRecordByFilter("site_settings", "id != ''");
      const s = st.getString("login_rules"); if (s && s !== "null") return Object.assign(d, JSON.parse(s));
    } catch (_) {}
    return d;
  },
  time(s) { if (!s) return null; const t = new Date(String(s).replace(" ", "T")); return isNaN(t) ? null : t; },
  log(e, rec, email, ok, reason) {
    try {
      const r = new Record($app.findCollectionByNameOrId("login_logs"));
      r.set("email", String(email || (rec ? rec.getString("email") : "")));
      if (rec) r.set("user", rec.id);
      r.set("ok", !!ok); r.set("reason", reason);
      try { r.set("ip", e.realIP()); } catch (_) {}
      let ua = "";
      try { ua = String(e.request.userAgent() || ""); } catch (_) {}
      if (!ua) try { ua = String((e.requestInfo().headers || {})["user_agent"] || ""); } catch (_) {}
      r.set("ua", ua.slice(0, 300));
      $app.save(r);
    } catch (_) {}
  },
  requireTop(e) {
    let role = null; try { role = $app.findRecordById("roles", e.auth.getString("role")); } catch (_) {}
    if (!role || !role.getBool("locked")) throw new ForbiddenError("최고 관리자만 할 수 있습니다");
  },
  target(e) {
    const id = String((e.requestInfo().body || {}).id || "");
    try { return $app.findRecordById("users", id); } catch (_) { throw new NotFoundError("계정을 찾을 수 없습니다"); }
  },
};
