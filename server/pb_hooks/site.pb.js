/// <reference path="../pb_data/types.d.ts" />
// 홈페이지(사용자단)용 공개 API와 접속 통계
//  POST /api/site/hit       — 페이지 열 때 한 번 (path, ref, utm, sid, lang). 이름·IP는 저장하지 않음, 검색 로봇 제외
//  GET  /api/site/page      — ?slug=company/ceo  게시본 블록만
//  GET  /sitemap.xml, /robots.txt
//  GET  /api/cms/stats      — ?days=7|30|90  관리자(접속 통계 보기 권한)

routerAdd("POST", "/api/site/hit", (e) => {
  const ua = String(e.request.userAgent() || "");
  if (!ua || /bot|crawl|spider|slurp|headless|python|curl|wget|facebookexternalhit|preview/i.test(ua)) return e.noContent(204);
  const b = e.requestInfo().body || {};
  const path = String(b.path || "/").slice(0, 300), ref = String(b.ref || ""), utm = String(b.utm || "").slice(0, 100);
  const sid = String(b.sid || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  if (!sid) return e.json(400, { message: "sid 필요" });
  let host = ""; try { host = (ref.match(/^https?:\/\/([^/?#]+)/i) || [])[1] || ""; } catch (_) {}
  host = host.toLowerCase();
  const self = String(e.request.host || "").toLowerCase();
  const src = utm ? "홍보 링크"
    : !host || host === self ? "직접 입력"
    : /naver\./.test(host) ? "네이버 검색"
    : /google\./.test(host) ? "구글 검색"
    : /daum\.|kakao\./.test(host) ? "다음·카카오"
    : /g2b\.go\.kr|pps\.go\.kr|koneps|d2b\.go\.kr/.test(host) ? "나라장터·조달 사이트"
    : /linkedin\./.test(host) ? "링크드인"
    : "기타";
  const r = new Record($app.findCollectionByNameOrId("visits"));
  r.set("day", new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
  r.set("path", path); r.set("src", src); r.set("utm", utm); r.set("sid", sid); r.set("lang", b.lang === "en" ? "en" : "ko");
  $app.save(r);
  return e.noContent(204);
});

routerAdd("GET", "/api/site/page", (e) => {
  const slug = String(e.request.url.query().get("slug") || "");
  let p; try { p = $app.findFirstRecordByFilter("pages", "slug = {:s}", { s: slug }); } catch (_) { return e.json(404, { message: "페이지가 없습니다" }); }
  const s = p.getString("live");
  return e.json(200, { name: p.getString("name"), slug, published: p.getString("published"), files: `/api/files/pages/${p.id}/`, blocks: s && s !== "null" ? JSON.parse(s) : [] });
});

// (pb.js 맨 위 함수는 처리기 안에서 보이지 않아 각 처리기 안에 둠)
routerAdd("GET", "/sitemap.xml", (e) => {
  const base = (() => { try { const s = $app.findFirstRecordByFilter("seo_site", "id != ''"); return (s.getString("site_url") || "https://kfubis.co.kr").replace(/\/+$/, ""); } catch (_) { return "https://kfubis.co.kr"; } })();
  const paths = { "/": 1 };
  try { $app.findRecordsByFilter("seo_pages", "path != ''", "sort", 500, 0).forEach((r) => (paths[r.getString("path")] = 1)); } catch (_) {}
  try { $app.findRecordsByFilter("menus", "visible = true && slug != '' && (link_type = 'page' || link_type = 'board')", "sort", 500, 0).forEach((r) => (paths["/" + r.getString("slug").replace(/^\/+/, "")] = 1)); } catch (_) {}
  try { $app.findRecordsByFilter("pages", "published != ''", "", 500, 0).forEach((r) => (paths["/" + r.getString("slug").replace(/^\/+/, "")] = 1)); } catch (_) {}
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const url = (p) => {
    const ko = base + (p === "/" ? "/" : p), en = base + "/en" + (p === "/" ? "/" : p);
    return `<url><loc>${esc(ko)}</loc><xhtml:link rel="alternate" hreflang="ko" href="${esc(ko)}"/><xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/></url>`;
  };
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${Object.keys(paths).map(url).join("\n")}\n</urlset>`;
  e.response.header().set("Content-Type", "application/xml; charset=utf-8");
  return e.string(200, xml);
});

routerAdd("GET", "/robots.txt", (e) => {
  let base = "https://kfubis.co.kr";
  try { base = ($app.findFirstRecordByFilter("seo_site", "id != ''").getString("site_url") || base).replace(/\/+$/, ""); } catch (_) {}
  e.response.header().set("Content-Type", "text/plain; charset=utf-8");
  return e.string(200, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /_/\n\nSitemap: ${base}/sitemap.xml\n`);
});

routerAdd("GET", "/api/cms/stats", (e) => {
  // 권한: 최고 관리자 또는 접속 통계 보기
  let ok = false;
  try { const role = $app.findRecordById("roles", e.auth.getString("role")); ok = role.getBool("locked") || Number(JSON.parse(role.getString("perms") || "{}").stats || 0) >= 1; } catch (_) {}
  if (!ok) return e.json(403, { message: "접속 통계를 볼 권한이 없습니다" });
  const days = Math.min(365, Math.max(1, Number(e.request.url.query().get("days")) || 30));
  const kst = (d) => new Date(d + 9 * 3600e3).toISOString().slice(0, 10);
  const to = kst(Date.now()), from = kst(Date.now() - (days - 1) * 864e5), pfrom = kst(Date.now() - (2 * days - 1) * 864e5);
  const q = (sql, params, shape) => { const rows = arrayOf(new DynamicModel(shape)); $app.db().newQuery(sql).bind(params).all(rows); return rows; };

  const daily = q("SELECT day, COUNT(DISTINCT sid) AS v, COUNT(*) AS pv FROM visits WHERE day >= {:f} AND day <= {:t} GROUP BY day", { f: from, t: to }, { day: "", v: 0, pv: 0 });
  const map = {}; daily.forEach((r) => (map[r.day] = { v: r.v, pv: r.pv }));
  const series = []; for (let i = days - 1; i >= 0; i--) { const d = kst(Date.now() - i * 864e5); series.push({ day: d, v: (map[d] || {}).v || 0, pv: (map[d] || {}).pv || 0 }); }
  const one = (sql, params) => q(sql, params, { n: 0 })[0].n;
  const visitors = one("SELECT COUNT(DISTINCT sid) AS n FROM visits WHERE day >= {:f} AND day <= {:t}", { f: from, t: to });
  const views = one("SELECT COUNT(*) AS n FROM visits WHERE day >= {:f} AND day <= {:t}", { f: from, t: to });
  const prev = one("SELECT COUNT(DISTINCT sid) AS n FROM visits WHERE day >= {:f} AND day < {:t}", { f: pfrom, t: from });
  const en = one("SELECT COUNT(DISTINCT sid) AS n FROM visits WHERE day >= {:f} AND day <= {:t} AND lang = 'en'", { f: from, t: to });
  // 들어온 곳: 방문(sid)마다 처음 연 페이지의 경로
  const sources = q("SELECT v.src AS name, COUNT(*) AS n FROM visits v JOIN (SELECT sid, MIN(created) AS c FROM visits WHERE day >= {:f} AND day <= {:t} GROUP BY sid) x ON v.sid = x.sid AND v.created = x.c GROUP BY v.src ORDER BY n DESC", { f: from, t: to }, { name: "", n: 0 });
  const utms = q("SELECT utm AS name, COUNT(DISTINCT sid) AS n FROM visits WHERE day >= {:f} AND day <= {:t} AND utm != '' GROUP BY utm ORDER BY n DESC LIMIT 10", { f: from, t: to }, { name: "", n: 0 });
  const pages = q("SELECT path, COUNT(*) AS n, COUNT(DISTINCT sid) AS v FROM visits WHERE day >= {:f} AND day <= {:t} GROUP BY path ORDER BY n DESC LIMIT 15", { f: from, t: to }, { path: "", n: 0, v: 0 });
  // 문의: 같은 기간(KST) 접수된 사업 문의, 기관 유형별
  const ufrom = new Date(Date.parse(from + "T00:00:00+09:00")).toISOString().replace("T", " ");
  const orgs = q("SELECT org_type AS name, COUNT(*) AS n FROM inquiries WHERE created >= {:f} GROUP BY org_type ORDER BY n DESC", { f: ufrom }, { name: "", n: 0 });
  const inquiries = orgs.reduce((a, r) => a + r.n, 0);
  const labels = {}; try { $app.findRecordsByFilter("seo_pages", "id != ''", "", 500, 0).forEach((r) => (labels[r.getString("path")] = r.getString("label"))); } catch (_) {}
  return e.json(200, {
    from, to, days, visitors, views, prev, en, inquiries, series,
    sources: sources.map((r) => ({ name: r.name, n: r.n })), utms: utms.map((r) => ({ name: r.name, n: r.n })),
    pages: pages.map((r) => ({ path: r.path, label: labels[r.path] || "", n: r.n, v: r.v })),
    orgs: orgs.map((r) => ({ name: r.name || "(미입력)", n: r.n })),
  });
}, $apis.requireAuth("users"));
