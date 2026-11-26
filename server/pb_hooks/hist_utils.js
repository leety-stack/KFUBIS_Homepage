// 변경 이력 공통 함수 — history.pb.js 에서 require
const MENU = {
  works: "works", news: "news", rnd: "rnd", certs: "certs", downloads: "downloads", jobs: "jobs",
  menus: "menu", banners: "banner", popups: "popup", main_sections: "main", site_settings: "company",
  pages: "page", i18n: "i18n", seo_pages: "seo", seo_site: "seo", roles: "roles", users: "users",
};
const TITLE = ["title_ko", "title", "name_ko", "name", "label", "ko", "key", "big", "site_name", "email", "org"];
const SKIP = { password: 1, tokenKey: 1, created: 1, updated: 1, last_login: 1, locked_until: 1 };

module.exports = {
  MENU,
  COLLS: Object.keys(MENU),
  /** 레코드 → 평범한 JS 값 (json 은 풀어서, 비밀번호·자동 시각 제외) */
  snap(rec) {
    const o = { id: rec.id };
    const fs = rec.collection().fields;
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i], n = f.getName(), t = f.type();
      if (SKIP[n] || t === "password" || t === "autodate" || n === "id") continue;
      if (t === "json") { const s = rec.getString(n); try { o[n] = s && s !== "null" ? JSON.parse(s) : null; } catch (_) { o[n] = s; } }
      else if (t === "bool") o[n] = rec.getBool(n);
      else if (t === "number") o[n] = rec.getFloat(n);
      else if ((t === "file" || t === "select" || t === "relation") && f.isMultiple()) o[n] = [].concat(rec.getStringSlice(n));
      else o[n] = rec.getString(n);
    }
    return o;
  },
  fileFields(col) {
    const out = {}; const fs = col.fields;
    for (let i = 0; i < fs.length; i++) if (fs[i].type() === "file") out[fs[i].getName()] = 1;
    return out;
  },
  title(o) { for (const k of TITLE) if (o && o[k]) return String(o[k]).slice(0, 200); return o ? o.id : ""; },
  diff(a, b) {
    const ks = {}; Object.keys(a || {}).forEach((k) => (ks[k] = 1)); Object.keys(b || {}).forEach((k) => (ks[k] = 1));
    return Object.keys(ks).filter((k) => k !== "id" && JSON.stringify((a || {})[k] ?? null) !== JSON.stringify((b || {})[k] ?? null));
  },
  /** 기록 남기기 — auth 는 요청한 관리자 (없으면 남기지 않음) */
  write(auth, coll, recId, action, before, after, fields) {
    if (!auth) return;
    const r = new Record($app.findCollectionByNameOrId("change_log"));
    r.set("coll", coll); r.set("menu", MENU[coll] || coll); r.set("rec_id", recId);
    r.set("title", this.title(after || before)); r.set("action", action);
    r.set("fields", fields || []); r.set("before", before || null); r.set("after", after || null);
    if (auth.collection().name === "users") { r.set("who", auth.id); r.set("who_name", auth.getString("name") || auth.getString("email")); }
    else r.set("who_name", "시스템 관리자");
    $app.save(r);
  },
  canRevert(auth) {
    if (!auth || auth.collection().name !== "users") return false;
    try {
      const role = $app.findRecordById("roles", auth.getString("role"));
      if (role.getBool("locked")) return true;
      const p = JSON.parse(role.getString("perms") || "{}");
      return Number(p.history || 0) >= 2;
    } catch (_) { return false; }
  },
};
