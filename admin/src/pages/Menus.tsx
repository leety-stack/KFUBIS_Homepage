import { useCallback, useEffect, useState } from "react";
import { Switch, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { dragProps, move, saveOrder } from "../lib/order";
import { errText, pb, type Rec } from "../lib/pb";

const BOARD_TARGETS: [string, string][] = [["works", "실적"], ["news", "새소식"], ["rnd", "R&D 과제"], ["certs", "인증·수상"], ["downloads", "자료실"], ["jobs", "채용공고"]];
const TYPES: [string, string][] = [["page", "페이지"], ["board", "게시판"], ["url", "외부 링크"], ["none", "하위 메뉴만"]];

export default function Menus() {
  const { level } = useAuth(); const lv = level("menu"); const toast = useToast();
  const [items, setItems] = useState<Rec[]>([]);
  const [sel, setSel] = useState<string>("");
  const [form, setForm] = useState<Rec | null>(null);
  const [from, setFrom] = useState<number | null>(null);
  const [dragParent, setDragParent] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await pb.collection("menus").getFullList({ sort: "sort,created" });
    setItems(r as Rec[]);
    return r as Rec[];
  }, []);
  useEffect(() => { load().then((r) => { if (r[0]) pick(r[0]); }); }, []); // eslint-disable-line

  const pick = (r: Rec) => { setSel(r.id); setForm({ ...r }); };
  const tops = items.filter((i) => !i.parent);
  const kids = (id: string) => items.filter((i) => i.parent === id);

  const reorder = async (siblings: Rec[], a: number, b: number) => {
    const next = move(siblings, a, b);
    try { await saveOrder("menus", next.map((x) => x.id), Object.fromEntries(siblings.map((x) => [x.id, x.sort]))); toast("순서를 바꿨습니다"); await load(); }
    catch (e) { toast("순서를 저장하지 못했습니다 — " + errText(e)); }
  };
  const toggle = async (r: Rec, on: boolean) => {
    try { await pb.collection("menus").update(r.id, { visible: on }); toast(`"${r.name_ko}" 메뉴를 ${on ? "보이게" : "숨김으로"} 바꿨습니다`); await load(); if (form?.id === r.id) setForm({ ...form!, visible: on }); }
    catch (e) { toast("바꾸지 못했습니다 — " + errText(e)); }
  };
  const save = async () => {
    if (!form) return;
    if (!form.name_ko?.trim()) { toast("메뉴 이름(국문)을 입력하세요"); return; }
    const { name_ko, name_en, slug, link_type, target, new_window, show_pc, show_mo } = form;
    try { await pb.collection("menus").update(form.id, { name_ko, name_en, slug, link_type, target, new_window, show_pc, show_mo }); toast("저장했습니다 — 홈페이지 메뉴에 반영되었습니다"); await load(); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const add = async (parent?: string) => {
    const sib = parent ? kids(parent) : tops;
    try {
      const r = await pb.collection("menus").create({ name_ko: parent ? "새 하위 메뉴" : "새 메뉴", link_type: "page", show_pc: true, show_mo: true, visible: false, sort: (sib.length + 1) * 10, parent: parent || "" });
      toast("새 메뉴를 숨김 상태로 만들었습니다 — 이름을 고치고 보이게 켜세요"); await load(); pick(r as Rec);
    } catch (e) { toast("만들지 못했습니다 — " + errText(e)); }
  };
  const del = async () => {
    if (!form) return;
    const n = kids(form.id).length;
    if (!confirm(`"${form.name_ko}" 메뉴를 삭제할까요?${n ? ` 하위 메뉴 ${n}개도 함께 지워집니다.` : ""} (연결된 페이지·게시판 글은 지워지지 않습니다)`)) return;
    try { await pb.collection("menus").delete(form.id); toast("삭제했습니다"); const r = await load(); setForm(null); setSel(""); if (r[0]) pick(r[0]); }
    catch (e) { toast("삭제하지 못했습니다 — " + errText(e)); }
  };

  const node = (r: Rec, i: number, siblings: Rec[], parentId: string) => (
    <li key={r.id}>
      <div className={"node" + (r.id === sel ? " sel" : "") + (r.visible ? "" : " off")} onClick={() => pick(r)}
        {...dragProps(i, { from: dragParent === parentId ? from : null, setFrom: (n) => { setFrom(n); setDragParent(n === null ? null : parentId); }, onDrop: (a, b) => reorder(siblings, a, b), enabled: lv >= 2 })}>
        <span className="hd2" title="끌어서 순서 변경">⠿</span>
        <span><b>{r.name_ko}</b><small>{r.name_en || "(영문 없음)"}</small></span>
        <span className={"tag " + (r.visible ? "t-on" : "t-off")}>{r.visible ? "노출" : "숨김"}</span>
        {lv >= 3 ? <Switch on={!!r.visible} onChange={(v) => toggle(r, v)} label="노출" /> : <span />}
      </div>
      {!r.parent && kids(r.id).length > 0 && <ul>{kids(r.id).map((c, j, arr) => node(c, j, arr, r.id))}</ul>}
    </li>
  );

  const set = (k: string, v: any) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const ro = lv < 2;
  return (
    <section className="view on">
      <div className="ph"><div><h1>메뉴 관리</h1><p>왼쪽 ⠿ 손잡이를 끌어 같은 단계 안에서 순서를 바꾸고, 메뉴를 눌러 이름·연결할 곳을 고칩니다. 순서와 노출은 바로 반영됩니다.</p></div>
        {lv >= 2 && <button className="btn" onClick={() => add()}>+ 1단 메뉴 추가</button>}</div>
      <div className="mm">
        <section className="panel"><div className="panel-hd"><h2>메뉴 구조</h2><span className="cnt">메뉴 {items.length}개</span></div>
          <div className="tree"><ul>{tops.map((r, i) => node(r, i, tops, ""))}</ul></div></section>
        <section className="panel">
          <div className="panel-hd"><h2>{form ? `메뉴 설정 — ${form.name_ko}` : "메뉴 설정"}</h2>
            {form && lv >= 2 && <div style={{ display: "flex", gap: 6 }}>{!form.parent && <button className="btn sm" onClick={() => add(form.id)}>+ 하위 메뉴</button>}{lv >= 3 && <button className="btn sm" style={{ color: "var(--pri)" }} onClick={del}>삭제</button>}</div>}</div>
          {form ? (
            <div className="panel-bd" style={{ display: "grid", gap: 14 }}>
              <div className="grid2">
                <div className="f"><label><i>* </i>메뉴 이름 (국문)</label><input value={form.name_ko || ""} disabled={ro} onChange={(e) => set("name_ko", e.target.value)} /></div>
                <div className="f"><label>메뉴 이름 (영문)</label><input value={form.name_en || ""} disabled={ro} onChange={(e) => set("name_en", e.target.value)} /><span className="help">비워 두면 영문 사이트에서 숨김</span></div>
              </div>
              <div className="linkbox">
                <div className="f"><label>누르면 이동할 곳</label>
                  <div className="chips">{TYPES.map(([k, l]) => <label key={k}><input type="radio" name="lt" checked={form.link_type === k} disabled={ro} onChange={() => set("link_type", k)} /> {l}</label>)}</div></div>
                {form.link_type === "board" && <div className="f"><label>연결 게시판</label><select value={form.target || ""} disabled={ro} onChange={(e) => set("target", e.target.value)}><option value="">선택</option>{BOARD_TARGETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>}
                {form.link_type === "page" && <div className="f"><label>연결 페이지</label><input value={form.target || ""} disabled={ro} placeholder="예: 인사말" onChange={(e) => set("target", e.target.value)} /><span className="help">페이지 내용은 "페이지 편집(옵션)"에서 만듭니다</span></div>}
                {form.link_type === "url" && <div className="f"><label>외부 주소</label><input value={form.target || ""} disabled={ro} placeholder="https://" onChange={(e) => set("target", e.target.value)} /></div>}
                {form.link_type !== "none" && <label className="ck"><input type="checkbox" checked={!!form.new_window} disabled={ro} onChange={(e) => set("new_window", e.target.checked)} /> 새 창으로 열기</label>}
              </div>
              <div className="grid2">
                <div className="f"><label>기기별 노출</label><div style={{ display: "flex", gap: 16 }}>
                  <label className="ck"><input type="checkbox" checked={!!form.show_pc} disabled={ro} onChange={(e) => set("show_pc", e.target.checked)} /> PC</label>
                  <label className="ck"><input type="checkbox" checked={!!form.show_mo} disabled={ro} onChange={(e) => set("show_mo", e.target.checked)} /> 모바일</label></div></div>
                <div className="f"><label>메뉴 주소</label><input value={form.slug || ""} disabled={ro} onChange={(e) => set("slug", e.target.value)} /><span className="help">kfubis.co.kr/<b>{form.slug}</b></span></div>
              </div>
              {lv >= 2 && <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn navy" onClick={save}>저장</button></div>}
              {lv < 3 && <p className="help">노출 켜고 끄기는 게시 권한이 있는 담당자가 합니다.</p>}
            </div>
          ) : <div className="panel-bd help">왼쪽에서 메뉴를 고르세요</div>}
        </section>
      </div>
    </section>
  );
}
