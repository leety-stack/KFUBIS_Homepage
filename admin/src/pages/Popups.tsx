import { useCallback, useEffect, useState } from "react";
import { buildBody, Field, initVals, type FieldDef, type FormVals } from "../components/fields";
import { Switch, Tag, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, fileUrl, pb, showDate, type Rec } from "../lib/pb";
import { periodState } from "./Banners";

const POS = ["왼쪽 위", "위 가운데", "오른쪽 위", "왼쪽 가운데", "가운데", "오른쪽 가운데", "왼쪽 아래", "아래 가운데", "오른쪽 아래"];
const BASE: FieldDef[] = [
  { name: "title", label: "제목 (관리용)", type: "text", required: true, full: true },
  { name: "start", label: "시작", type: "date" }, { name: "end", label: "끝", type: "date" },
];
const IMGF: FieldDef[] = [{ name: "image", label: "이미지", type: "image" }];
const TXTF: FieldDef[] = [
  { name: "head_ko", label: "글 제목 (국문)", type: "text" }, { name: "head_en", label: "글 제목 (영문)", type: "text" },
  { name: "body_ko", label: "글 내용 (국문)", type: "area" }, { name: "body_en", label: "글 내용 (영문)", type: "area" },
];
const REST: FieldDef[] = [
  { name: "link", label: "누르면 이동할 주소", type: "text", full: true, placeholder: "예: /pr/news" },
  { name: "pages", label: "노출 페이지", type: "select", options: ["메인 화면만", "모든 페이지", "국문 사이트만", "영문 사이트만"], required: true },
  { name: "close_opt", label: "닫기 옵션", type: "select", options: ["오늘 하루 보지 않기", "7일 동안 보지 않기", "다시 보지 않기"], required: true },
];
const ALLF = [...BASE, ...IMGF, ...TXTF, ...REST];

export default function Popups() {
  const { level } = useAuth(); const lv = level("popup"); const toast = useToast();
  const [items, setItems] = useState<Rec[]>([]);
  const [cur, setCur] = useState<Rec | null>(null);
  const [vals, setVals] = useState<FormVals>({});
  const [dev, setDev] = useState<"pc" | "mo">("pc");
  const load = useCallback(async () => { const r = (await pb.collection("popups").getFullList({ sort: "sort,-created" })) as Rec[]; setItems(r); return r; }, []);
  const pick = (r: Rec) => { setCur(r); setVals({ ...initVals(ALLF, r), kind: r.kind || "이미지", pos: r.pos ?? 4, width: r.width || 340, show_pc: r.show_pc, show_mo: r.show_mo }); };
  useEffect(() => { load().then((r) => r[0] && pick(r[0])); }, []); // eslint-disable-line
  const set = (k: string, v: any) => setVals((p) => ({ ...p, [k]: v }));
  const ro = lv < 2;

  const save = async () => {
    if (!cur) return;
    if (!vals.title) { toast("제목을 입력하세요"); return; }
    const body = { ...buildBody(ALLF, vals, cur), kind: vals.kind, pos: vals.pos, width: vals.width, show_pc: !!vals.show_pc, show_mo: !!vals.show_mo };
    try { await pb.collection("popups").update(cur.id, body); toast("저장했습니다"); const l = await load(); pick(l.find((x) => x.id === cur.id)!); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const add = async () => {
    try { const r = await pb.collection("popups").create({ title: "새 팝업", kind: "이미지", pos: 0, width: 320, show_pc: true, show_mo: true, pages: "메인 화면만", close_opt: "오늘 하루 보지 않기", visible: false, sort: 0 }); toast("새 팝업을 꺼진 상태로 만들었습니다"); await load(); pick(r as Rec); }
    catch (e) { toast("만들지 못했습니다 — " + errText(e)); }
  };
  const del = async () => {
    if (!cur || !confirm(`"${cur.title}" 팝업을 삭제할까요?`)) return;
    try { await pb.collection("popups").delete(cur.id); toast("삭제했습니다"); const l = await load(); l[0] ? pick(l[0]) : setCur(null); }
    catch (e) { toast("삭제하지 못했습니다 — " + errText(e)); }
  };
  const toggle = async (r: Rec, on: boolean) => {
    try { await pb.collection("popups").update(r.id, { visible: on }); toast(on ? "켰습니다 — 기간 안이면 바로 뜹니다" : "껐습니다"); const l = await load(); if (cur?.id === r.id) setCur(l.find((x) => x.id === r.id)!); }
    catch (e) { toast("바꾸지 못했습니다 — " + errText(e)); }
  };

  // 미리보기 위치
  const p = vals.pos ?? 4, col = p % 3, row = Math.floor(p / 3);
  const img = vals.image__new ? URL.createObjectURL(vals.image__new) : cur?.image && vals.image !== "" ? fileUrl(cur, cur.image, "800x0") : "";
  const show = dev === "pc" ? vals.show_pc : vals.show_mo;
  const popStyle: React.CSSProperties = dev === "mo" ? { left: 0, right: 0, bottom: 0, width: "100%", maxWidth: "100%", height: vals.kind === "글" ? "34%" : "58%" } : {
    width: `${Math.round((vals.width || 340) / 14.4 * 1.6)}%`, height: vals.kind === "글" ? "auto" : `${Math.round((vals.width || 340) / 14.4 * 1.6 * 1.2 * 0.62)}%`,
    left: col === 0 ? 14 : col === 1 ? "50%" : "auto", right: col === 2 ? 14 : "auto", top: row === 0 ? 34 : row === 1 ? "50%" : "auto", bottom: row === 2 ? 14 : "auto",
    transform: `${col === 1 ? "translateX(-50%) " : ""}${row === 1 ? "translateY(-50%)" : ""}`,
  };
  return (
    <section className="view on">
      <div className="ph"><div><h1>팝업</h1><p>기간을 정해 두면 그 기간에만 자동으로 뜹니다. 여러 개가 겹치면 순서대로 나란히 뜹니다.</p></div>
        {lv >= 2 && <button className="btn" onClick={add}>+ 새 팝업</button>}</div>
      <section className="panel"><div className="tbl"><table>
        <thead><tr><th>제목</th><th>기간</th><th className="hide-m">위치</th><th className="hide-m">기기</th><th>상태</th><th>켜기</th></tr></thead>
        <tbody>{items.map((r) => (
          <tr key={r.id} className={cur?.id === r.id ? "sel" : ""} onClick={() => pick(r)} style={{ cursor: "pointer" }}>
            <td><b>{r.title}</b></td><td>{showDate(r.start) || "…"} ~ {showDate(r.end) || "…"}</td><td className="hide-m">{POS[r.pos ?? 4]}</td>
            <td className="hide-m">{[r.show_pc && "PC", r.show_mo && "모바일"].filter(Boolean).join("·")}</td>
            <td><Tag t={periodState(r)} /></td><td>{lv >= 3 ? <Switch on={!!r.visible} onChange={(v) => toggle(r, v)} label="켜기" /> : "—"}</td>
          </tr>))}
          {!items.length && <tr><td colSpan={6} className="empty">팝업이 없습니다</td></tr>}</tbody></table></div></section>
      {cur && <div className="pp">
        <section className="panel"><div className="panel-hd"><h2>팝업 설정</h2>{lv >= 3 && <button className="btn sm" style={{ color: "var(--pri)" }} onClick={del}>삭제</button>}</div>
          <div className="panel-bd" style={{ display: "grid", gap: 14 }}>
            <div className="grid2">{BASE.map((f) => <Field key={f.name} f={f} vals={vals} set={set} rec={cur} disabled={ro} />)}</div>
            <div className="f"><label>내용 종류</label><div className="seg">{["이미지", "글", "이미지+글"].map((k) => <button key={k} type="button" className={vals.kind === k ? "on" : ""} disabled={ro} onClick={() => set("kind", k)}>{k}</button>)}</div></div>
            {vals.kind !== "글" && IMGF.map((f) => <Field key={f.name} f={f} vals={vals} set={set} rec={cur} disabled={ro} />)}
            {vals.kind !== "이미지" && <div className="grid2">{TXTF.map((f) => <Field key={f.name} f={f} vals={vals} set={set} rec={cur} disabled={ro} />)}</div>}
            <div className="grid2">
              <div className="f"><label>위치 (PC)</label><div className="pos">{POS.map((n, i) => <button key={i} type="button" title={n} className={vals.pos === i ? "on" : ""} disabled={ro} onClick={() => set("pos", i)} />)}</div><span className="help">{POS[vals.pos ?? 4]}</span></div>
              <div className="f"><label>크기 (PC, 가로 {vals.width}px)</label><input type="range" min={260} max={520} step={10} value={vals.width || 340} disabled={ro} onChange={(e) => set("width", Number(e.target.value))} /></div>
              <div className="f"><label>노출 기기</label><div style={{ display: "flex", gap: 16 }}>
                <label className="ck"><input type="checkbox" checked={!!vals.show_pc} disabled={ro} onChange={(e) => set("show_pc", e.target.checked)} /> PC</label>
                <label className="ck"><input type="checkbox" checked={!!vals.show_mo} disabled={ro} onChange={(e) => set("show_mo", e.target.checked)} /> 모바일</label></div><span className="help">모바일은 화면 아래에서 올라오는 형태</span></div>
              {REST.slice(1).map((f) => <Field key={f.name} f={{ ...f, full: false }} vals={vals} set={set} rec={cur} disabled={ro} />)}
            </div>
            <Field f={REST[0]} vals={vals} set={set} rec={cur} disabled={ro} />
            {lv >= 2 && <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn navy" onClick={save}>저장</button></div>}
          </div></section>
        <section className="panel"><div className="panel-hd"><h2>미리보기</h2><div className="seg"><button className={dev === "pc" ? "on" : ""} onClick={() => setDev("pc")}>PC</button><button className={dev === "mo" ? "on" : ""} onClick={() => setDev("mo")}>모바일</button></div></div>
          <div className="panel-bd"><div className={"site" + (dev === "mo" ? " mo" : "")}>
            {show ? <div className="pop" style={popStyle}>
              {vals.kind !== "글" && (img ? <img src={img} alt="" /> : <div className="noimg" style={{ flex: 1 }}>이미지 없음</div>)}
              {vals.kind !== "이미지" && <div className="tx"><b>{vals.head_ko}</b><span style={{ whiteSpace: "pre-line" }}>{vals.body_ko}</span></div>}
              <div className="ft"><span>{vals.close_opt}</span><span>닫기 ✕</span></div></div> : <div className="pop-off">이 기기에서는 안 뜹니다</div>}
          </div><p className="help" style={{ marginTop: 10 }}>실제 첫 화면 위에 뜨는 모습입니다. 고치는 대로 바뀝니다.</p></div></section>
      </div>}
    </section>
  );
}
