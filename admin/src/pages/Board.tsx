import { useCallback, useEffect, useState } from "react";
import { BOARDS, type BoardDef } from "../boards";
import { Field, type FormVals } from "../components/fields";
import { Modal, Switch, Tag, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, fromInputDate, pb, type Rec } from "../lib/pb";

const PER = 20;

export default function Board({ boardKey }: { boardKey: string }) {
  const B: BoardDef = BOARDS[boardKey];
  const { level } = useAuth();
  const lv = level(B.key);
  const toast = useToast();
  const [cat, setCat] = useState("전체");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Rec[]; totalItems: number; totalPages: number }>({ items: [], totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<{ rec?: Rec } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const parts: string[] = [];
    if (cat !== "전체") parts.push(pb.filter(`${B.catField} = {:c}`, { c: cat }));
    if (q.trim()) parts.push("(" + B.search.map((f) => pb.filter(`${f} ~ {:q}`, { q: q.trim() })).join(" || ") + ")");
    try {
      const r = await pb.collection(B.collection).getList(page, PER, { sort: B.sort, filter: parts.join(" && ") });
      setData(r as any);
    } catch (e) { toast("목록을 불러오지 못했습니다 — " + errText(e)); }
    setLoading(false);
  }, [B, cat, q, page, toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setCat("전체"); setQ(""); setPage(1); }, [boardKey]);

  const toggle = async (r: Rec, on: boolean) => {
    try { await pb.collection(B.collection).update(r.id, { status: on ? "게시" : "숨김" }); toast(on ? "홈페이지에 보이게 했습니다" : "홈페이지에서 숨겼습니다"); load(); }
    catch (e) { toast("바꾸지 못했습니다 — " + errText(e)); }
  };

  return (
    <section className="view on">
      <div className="ph"><div><h1>{B.title}</h1><p>{B.desc}</p></div>
        {lv >= 2 && <button className="btn navy" onClick={() => setEdit({})}>+ 새로 쓰기</button>}</div>
      <section className="panel">
        <div className="panel-hd">
          <div className="flt">{["전체", ...B.cats].map((c) => <button key={c} className={c === cat ? "on" : ""} onClick={() => { setCat(c); setPage(1); }}>{c}</button>)}</div>
          <input className="srch" placeholder="검색" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div className="tbl"><table className="blist-t">
          <thead><tr><th style={{ width: 56 }}>번호</th>{B.cols.map((c) => <th key={c.label} className={c.mobileHide ? "hide-m" : ""}>{c.label}</th>)}<th style={{ width: 90 }}>상태</th><th style={{ width: 70 }}>노출</th><th className="hide-m" style={{ width: 70 }} /></tr></thead>
          <tbody>
            {data.items.map((r, i) => (
              <tr key={r.id} onClick={() => setEdit({ rec: r })}>
                <td className="sub">{data.totalItems - (page - 1) * PER - i}</td>
                {B.cols.map((c, j) => <td key={c.label} className={c.mobileHide ? "hide-m" : ""}>{j === 1 ? <><b>{c.get(r) || "(제목 없음)"}</b> {(B.badges?.(r) || []).map((t) => <span key={t} className={"tag " + (t === "메인" || t === "상단 고정" ? "t-pub" : "t-wait")}>{t}</span>)}{B.enField && !r[B.enField] && <span className="tag t-wait">영문 없음</span>}</> : c.get(r)}</td>)}
                <td><Tag t={r.status} /></td>
                <td>{lv >= 3 ? <Switch on={r.status === "게시"} onChange={(v) => toggle(r, v)} label="홈페이지 노출" /> : <span className="sub">—</span>}</td>
                <td className="hide-m"><button className="btn sm">{lv >= 2 ? "수정" : "보기"}</button></td>
              </tr>
            ))}
            {!loading && !data.items.length && <tr><td colSpan={9} className="empty">조건에 맞는 글이 없습니다</td></tr>}
            {loading && <tr><td colSpan={9} className="empty">불러오는 중…</td></tr>}
          </tbody>
        </table></div>
        <div className="foot"><span className="cnt">총 {data.totalItems}건</span>
          <span className="pager"><button className="btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button><b>{page} / {Math.max(1, data.totalPages)}</b><button className="btn sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>›</button></span></div>
      </section>
      {edit && <Editor B={B} rec={edit.rec} lv={lv} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </section>
  );
}

function Editor({ B, rec, lv, onClose, onSaved }: { B: BoardDef; rec?: Rec; lv: number; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const init: FormVals = {};
  B.fields.forEach((f) => { init[f.name] = rec ? rec[f.name] : f.type === "bool" ? false : f.type === "select" && f.required ? f.options![0] : ""; });
  if (!rec && B.catField) init[B.catField] = B.cats[0];
  const [vals, setVals] = useState<FormVals>(init);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setVals((p) => ({ ...p, [k]: v }));
  const ro = lv < 2;

  const save = async (status: string) => {
    for (const f of B.fields) if (f.required && !vals[f.name]) { toast(`"${f.label}"을(를) 입력하세요`); return; }
    const body: Record<string, any> = { status };
    for (const f of B.fields) {
      const v = vals[f.name];
      if (f.type === "image") {
        if (vals[f.name + "__new"]) body[f.name] = vals[f.name + "__new"];
        else if (v === "" && rec?.[f.name]) body[f.name] = null;
      } else if (f.type === "files") {
        const added: File[] = vals[f.name + "__new"] || []; const del: string[] = vals[f.name + "__del"] || [];
        if (f.multiple) { if (added.length) body[f.name + "+"] = added; if (del.length) body[f.name + "-"] = del; }
        else { if (added.length) body[f.name] = added[0]; else if (del.length) body[f.name] = null; }
      } else if (f.type === "date") body[f.name] = v && v.length === 10 ? fromInputDate(v) : v || "";
      else body[f.name] = v ?? "";
    }
    if (B.key === "news" && !body.publish_at) body.publish_at = fromInputDate(new Date().toISOString().slice(0, 10));
    setBusy(true);
    try {
      if (rec) await pb.collection(B.collection).update(rec.id, body); else await pb.collection(B.collection).create(body);
      toast(status === "게시" ? "게시했습니다 — 홈페이지에 반영되었습니다" : "임시저장했습니다 — 홈페이지에는 아직 안 보입니다");
      onSaved();
    } catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
    setBusy(false);
  };
  const del = async () => {
    if (!rec || !confirm(`"${rec[B.titleField]}"을(를) 삭제할까요?`)) return;
    try { await pb.collection(B.collection).delete(rec.id); toast("삭제했습니다"); onSaved(); } catch (e) { toast("삭제하지 못했습니다 — " + errText(e)); }
  };

  return (
    <Modal title={`${B.title} — ${rec ? (ro ? "보기" : "수정") : "새로 쓰기"}`} onClose={onClose}
      footer={<>
        {rec && lv >= 3 && <button className="btn" style={{ color: "var(--pri)", marginRight: "auto" }} onClick={del} disabled={busy}>삭제</button>}
        <button className="btn" onClick={onClose} style={!(rec && lv >= 3) ? { marginLeft: "auto" } : undefined}>닫기</button>
        {lv >= 2 && <button className="btn" onClick={() => save("임시저장")} disabled={busy}>임시저장</button>}
        {lv >= 3 && <button className="btn navy" onClick={() => save("게시")} disabled={busy}>게시</button>}
      </>}>
      <div className="grid2">{B.fields.map((f) => <Field key={f.name} f={f} vals={vals} set={set} rec={rec} disabled={ro} />)}</div>
      <p className="help" style={{ marginTop: 14 }}>{lv >= 3 ? "[게시]를 눌러야 홈페이지에 반영됩니다. 임시저장한 내용은 홈페이지에 보이지 않습니다." : lv >= 2 ? "수정 권한은 임시저장까지입니다. 게시는 게시 권한이 있는 담당자가 합니다." : "보기 권한만 있습니다."}</p>
    </Modal>
  );
}
