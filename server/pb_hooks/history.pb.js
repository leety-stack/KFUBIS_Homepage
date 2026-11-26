/// <reference path="../pb_data/types.d.ts" />
// 변경 이력·되돌리기 — 관리자 화면(요청)으로 바꾼 것만 남김. 서버 내부 저장(로그인 시각 등)은 남기지 않음

onRecordCreateRequest((e) => {
  e.next();
  const h = require(`${__hooks}/hist_utils.js`);
  try { const a = h.snap(e.record); h.write(e.auth, e.collection.name, e.record.id, "추가", null, a, []); } catch (err) { console.log("change_log create", err); }
}, ...require(`${__hooks}/hist_utils.js`).COLLS);

onRecordUpdateRequest((e) => {
  const h = require(`${__hooks}/hist_utils.js`);
  let before = null;
  try { before = h.snap(e.record.original()); } catch (_) {}
  e.next();
  try {
    const after = h.snap(e.record), f = h.diff(before, after);
    if (f.length) h.write(e.auth, e.collection.name, e.record.id, "수정", before, after, f);
  } catch (err) { console.log("change_log update", err); }
}, ...require(`${__hooks}/hist_utils.js`).COLLS);

onRecordDeleteRequest((e) => {
  const h = require(`${__hooks}/hist_utils.js`);
  const before = h.snap(e.record), coll = e.collection.name, id = e.record.id;
  e.next();
  try { h.write(e.auth, coll, id, "삭제", before, null, []); } catch (err) { console.log("change_log delete", err); }
}, ...require(`${__hooks}/hist_utils.js`).COLLS);

// ── 되돌리기: 수정 → 바꾸기 전 값으로, 추가 → 지움, 삭제 → 다시 만듦(사진·첨부 파일은 복구 안 됨) ──
routerAdd("POST", "/api/cms/history/revert", (e) => {
  const h = require(`${__hooks}/hist_utils.js`);
  if (!h.canRevert(e.auth)) return e.json(403, { message: "되돌리기 권한이 없습니다" });
  const b = e.requestInfo().body || {};
  let L; try { L = $app.findRecordById("change_log", String(b.id || "")); } catch (_) { return e.json(404, { message: "이력을 찾을 수 없습니다" }); }
  if (L.getBool("reverted")) return e.json(400, { message: "이미 되돌린 변경입니다" });
  const act = L.getString("action"), coll = L.getString("coll"), rid = L.getString("rec_id");
  const J = (k) => { const s = L.getString(k); try { return s && s !== "null" ? JSON.parse(s) : null; } catch (_) { return null; } };
  const before = J("before"), after = J("after"), fields = J("fields") || [];
  const col = $app.findCollectionByNameOrId(coll), files = h.fileFields(col);
  let rec = null; try { rec = $app.findRecordById(coll, rid); } catch (_) {}
  try {
    if (act === "수정") {
      if (!rec) return e.json(400, { message: "그 사이 삭제되어 되돌릴 수 없습니다. 삭제 기록에서 먼저 되돌리세요." });
      const cur = h.snap(rec);
      const moved = fields.filter((f) => !files[f] && JSON.stringify(cur[f] ?? null) !== JSON.stringify(after ? after[f] ?? null : null));
      if (moved.length && !b.force) return e.json(409, { message: "이 변경 뒤에 같은 내용이 또 바뀌었습니다. 그래도 되돌리면 그 뒤 변경도 함께 없어집니다.", fields: moved });
      const keep = fields.filter((f) => !files[f]);
      if (!keep.length) return e.json(400, { message: "사진·첨부 파일 교체는 되돌릴 수 없습니다. 파일을 다시 올려 주세요." });
      keep.forEach((f) => rec.set(f, before ? before[f] : null));
      $app.save(rec);
      h.write(e.auth, coll, rid, "되돌리기", cur, h.snap(rec), keep);
    } else if (act === "추가") {
      if (!rec) return e.json(400, { message: "이미 삭제되었습니다" });
      if (coll === "users" && e.auth.id === rid) return e.json(400, { message: "자기 계정은 지울 수 없습니다" });
      const cur = h.snap(rec); $app.delete(rec);
      h.write(e.auth, coll, rid, "되돌리기", cur, null, []);
    } else if (act === "삭제") {
      if (rec) return e.json(400, { message: "이미 다시 만들어져 있습니다" });
      if (coll === "users") return e.json(400, { message: "삭제한 계정은 되돌릴 수 없습니다 — 계정을 새로 만들어 주세요" });
      const n = new Record(col); n.set("id", rid);
      Object.keys(before || {}).forEach((k) => { if (k !== "id" && !files[k]) n.set(k, before[k]); });
      $app.save(n);
      h.write(e.auth, coll, rid, "되돌리기", null, h.snap(n), []);
    } else return e.json(400, { message: "되돌리기 기록은 다시 되돌릴 수 없습니다 — 원래 변경 기록을 보세요" });
  } catch (err) {
    return e.json(400, { message: "되돌리지 못했습니다 — " + String(err).replace(/^Error: /, "") });
  }
  L.set("reverted", true); $app.save(L);
  return e.json(200, { ok: true, files_skipped: act === "삭제" ? Object.keys(files).filter((k) => before && before[k] && before[k].length) : fields.filter((f) => files[f]) });
}, $apis.requireAuth("users"));

// 보관: 변경 이력 3년, 접속 기록 400일
cronAdd("cmsKeep", "30 3 * * *", () => {
  const cut = (days) => new Date(Date.now() - days * 864e5).toISOString().replace("T", " ");
  try { $app.db().newQuery("DELETE FROM change_log WHERE created < {:c}").bind({ c: cut(3 * 365) }).execute(); } catch (err) { console.log("cmsKeep change_log", err); }
  try { $app.db().newQuery("DELETE FROM visits WHERE created < {:c}").bind({ c: cut(400) }).execute(); } catch (err) { console.log("cmsKeep visits", err); }
});
