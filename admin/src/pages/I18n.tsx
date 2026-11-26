import { useEffect, useState } from "react";
import { Modal, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, pb, type Rec } from "../lib/pb";

export default function I18n() {
  const { level } = useAuth(); const lv = level("i18n"); const toast = useToast();
  const [list, setList] = useState<Rec[]>([]); const [edit, setEdit] = useState<Record<string, { ko: string; en: string }>>({});
  const [q, setQ] = useState(""); const [only, setOnly] = useState(false); const [area, setArea] = useState("전체");
  const [adding, setAdding] = useState(false);
  const load = async () => { setList((await pb.collection("i18n").getFullList({ sort: "sort,key" })) as Rec[]); setEdit({}); };
  useEffect(() => { load().catch((e) => toast("불러오지 못했습니다 — " + errText(e))); }, []); // eslint-disable-line

  const val = (r: Rec) => edit[r.id] || { ko: r.ko || "", en: r.en || "" };
  const set = (r: Rec, k: "ko" | "en", v: string) => setEdit((p) => ({ ...p, [r.id]: { ...val(r), [k]: v } }));
  const dirty = Object.keys(edit).filter((id) => { const r = list.find((x) => x.id === id); return r && (edit[id].ko !== (r.ko || "") || edit[id].en !== (r.en || "")); });
  const areas = ["전체", ...Array.from(new Set(list.map((r) => r.area || "기타")))];
  const miss = list.filter((r) => !val(r).en.trim()).length;
  const shown = list.filter((r) => (area === "전체" || (r.area || "기타") === area) && (!only || !val(r).en.trim()) && (!q || (r.key + val(r).ko + val(r).en).toLowerCase().includes(q.toLowerCase())));
  const ro = lv < 2;

  const save = async () => {
    if (!dirty.length) { toast("바뀐 문구가 없습니다"); return; }
    if (dirty.some((id) => !edit[id].ko.trim())) { toast("국문은 비울 수 없습니다"); return; }
    try { for (const id of dirty) await pb.collection("i18n").update(id, edit[id]); toast(`문구 ${dirty.length}개를 저장했습니다 — 홈페이지에 바로 반영됩니다`); load(); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const del = async (r: Rec) => {
    if (!confirm(`"${r.ko}" 문구를 삭제할까요? 홈페이지에서 이 글자를 쓰는 곳은 개발 시 정한 기본 글자로 보입니다.`)) return;
    try { await pb.collection("i18n").delete(r.id); toast("삭제했습니다"); load(); } catch (e) { toast(errText(e)); }
  };

  return (
    <section className="view on">
      <div className="ph"><div><h1>다국어 문구</h1><p>버튼·안내문처럼 홈페이지 화면에 고정된 글자입니다. 게시판 글과 페이지 내용은 각 화면에서 국문·영문을 따로 씁니다. 영문이 비어 있으면 영문 사이트에 국문이 보입니다.</p></div>
        <div style={{ display: "flex", gap: 8 }}>{lv >= 3 && <button className="btn" onClick={() => setAdding(true)}>+ 문구 추가</button>}{!ro && <button className="btn navy" onClick={save}>저장{dirty.length ? ` (${dirty.length})` : ""}</button>}</div></div>
      <section className="panel">
        <div className="panel-hd"><div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="flt">{areas.map((a) => <button key={a} className={a === area ? "on" : ""} onClick={() => setArea(a)}>{a}</button>)}</div>
          <input className="srch" placeholder="문구 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="ck"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> 영문 미입력만 보기</label></div>
          <span className="cnt" style={{ color: miss ? "var(--warn)" : undefined }}>영문 미입력 {miss}건</span></div>
        <div className="tbl"><table>
          <thead><tr><th style={{ width: 90 }}>위치</th><th>국문</th><th>영문</th>{lv >= 3 && <th style={{ width: 60 }} />}</tr></thead>
          <tbody>{shown.map((r) => { const v = val(r); return (
            <tr key={r.id} title={r.key}><td><span className="tag t-off">{r.area || "기타"}</span></td>
              <td><input value={v.ko} disabled={ro} onChange={(e) => set(r, "ko", e.target.value)} aria-label={`${r.key} 국문`} /></td>
              <td><input value={v.en} disabled={ro} className={v.en.trim() ? "" : "miss"} placeholder="영문 입력" onChange={(e) => set(r, "en", e.target.value)} aria-label={`${r.key} 영문`} /></td>
              {lv >= 3 && <td><button className="btn sm" style={{ color: "var(--pri)" }} onClick={() => del(r)}>삭제</button></td>}</tr>); })}
            {!shown.length && <tr><td colSpan={4} className="empty">문구가 없습니다</td></tr>}</tbody></table></div>
        <div className="foot"><span className="cnt">총 {shown.length}개</span>{dirty.length > 0 && <span className="help" style={{ color: "var(--warn)" }}>저장하지 않은 문구 {dirty.length}개</span>}</div>
      </section>
      {adding && <AddText areas={areas.filter((a) => a !== "전체")} onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} sort={(list.length + 1) * 10} />}
    </section>
  );
}

function AddText({ areas, onClose, onDone, sort }: { areas: string[]; onClose: () => void; onDone: () => void; sort: number }) {
  const toast = useToast();
  const [v, setV] = useState({ key: "", area: areas[0] || "기타", ko: "", en: "" });
  const add = async () => {
    if (!/^[a-z0-9._-]+$/.test(v.key)) { toast("문구 키는 영문 소문자·숫자·점(.)으로 — 예: main.cta2"); return; }
    if (!v.ko.trim()) { toast("국문을 입력하세요"); return; }
    try { await pb.collection("i18n").create({ ...v, sort }); toast("추가했습니다"); onDone(); }
    catch (e: any) { toast(e?.response?.data?.key ? "이미 있는 문구 키입니다" : "추가하지 못했습니다 — " + errText(e)); }
  };
  return (
    <Modal title="문구 추가" onClose={onClose} footer={<><button className="btn" style={{ marginLeft: "auto" }} onClick={onClose}>취소</button><button className="btn navy" onClick={add}>추가</button></>}>
      <div className="grid2">
        <div className="f"><label><i>* </i>문구 키</label><input value={v.key} placeholder="예: main.cta2" onChange={(e) => setV({ ...v, key: e.target.value.trim() })} autoFocus /><span className="help">홈페이지 개발 때 이 키로 글자를 불러옵니다</span></div>
        <div className="f"><label>위치</label><input list="i18n-areas" value={v.area} onChange={(e) => setV({ ...v, area: e.target.value })} /><datalist id="i18n-areas">{areas.map((a) => <option key={a} value={a} />)}</datalist></div>
        <div className="f full"><label><i>* </i>국문</label><input value={v.ko} onChange={(e) => setV({ ...v, ko: e.target.value })} /></div>
        <div className="f full"><label>영문</label><input value={v.en} onChange={(e) => setV({ ...v, en: e.target.value })} /></div>
      </div>
    </Modal>
  );
}
