import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Switch, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { dragProps, move, saveOrder } from "../lib/order";
import { errText, pb, type Rec } from "../lib/pb";

export default function MainSections() {
  const { level } = useAuth(); const lv = level("main"); const toast = useToast();
  const [items, setItems] = useState<Rec[]>([]);
  const [curId, setCurId] = useState("");
  const [st, setSt] = useState<any>({});
  const [from, setFrom] = useState<number | null>(null);
  const load = useCallback(async () => { const r = (await pb.collection("main_sections").getFullList({ sort: "sort" })) as Rec[]; setItems(r); return r; }, []);
  const pick = (r: Rec) => { setCurId(r.id); setSt(JSON.parse(JSON.stringify(r.settings || {}))); };
  useEffect(() => { load().then((r) => r[0] && pick(r[0])); }, []); // eslint-disable-line
  const cur = items.find((x) => x.id === curId);
  const ro = lv < 2;
  const locked = items.filter((x) => x.locked), free = items.filter((x) => !x.locked);

  const toggle = async (r: Rec, on: boolean) => {
    try { await pb.collection("main_sections").update(r.id, { visible: on }); toast(`${r.name} 영역을 ${on ? "보이게" : "숨김으로"} 바꿨습니다`); load(); }
    catch (e) { toast("바꾸지 못했습니다 — " + errText(e)); }
  };
  const saveSettings = async () => {
    if (!cur) return;
    try { await pb.collection("main_sections").update(cur.id, { settings: st }); toast("저장했습니다 — 메인 화면에 반영되었습니다"); load(); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const S = (k: string, v: any) => setSt((p: any) => ({ ...p, [k]: v }));
  const arr = (k: string): any[] => st[k] || [];
  const setRow = (k: string, i: number, f: string, v: any) => S(k, arr(k).map((x, j) => (j === i ? (typeof x === "object" ? { ...x, [f]: v } : v) : x)));

  const row = (r: Rec, i: number, list: Rec[]) => (
    <li key={r.id} className={(r.id === curId ? "sel " : "") + (r.visible ? "" : "off")} onClick={() => pick(r)}
      {...(r.locked ? {} : dragProps(i, { from, setFrom, enabled: lv >= 2, onDrop: async (a, b) => { const next = move(list, a, b); try { await saveOrder("main_sections", [...locked, ...next].map((x) => x.id), Object.fromEntries(items.map((x) => [x.id, x.sort]))); toast("순서를 바꿨습니다"); load(); } catch (e) { toast(errText(e)); } } }))}>
      <span className="hd2">{r.locked ? "🔒" : "⠿"}</span>
      <span><b>{r.name}</b><small>{summary(r)}</small></span>
      {r.key === "hero" ? <span className="help">항상 보임</span> : lv >= 3 ? <Switch on={!!r.visible} onChange={(v) => toggle(r, v)} label="노출" /> : <span />}
    </li>
  );

  let body: React.ReactNode = null;
  if (cur) switch (cur.key) {
    case "gate": body = <>
      <p className="help" style={{ marginBottom: 10 }}>홈페이지에 들어오면 맨 먼저 뜨는 회사 선택 화면입니다. 한방유비스를 고르면 바로 메인으로, 다른 회사는 그 홈페이지로 이동합니다.</p>
      <div className="f"><label>회사 (순서대로 나옴)</label>
        <table className="gtt"><thead><tr><th>회사</th><th>영문</th><th>홈페이지 주소</th><th>소개 한 줄</th><th>이 사이트</th><th /></tr></thead><tbody>
          {arr("companies").map((c, i) => <tr key={i}>
            <td><input value={c.name} disabled={ro} onChange={(e) => setRow("companies", i, "name", e.target.value)} /></td>
            <td><input value={c.en} disabled={ro} onChange={(e) => setRow("companies", i, "en", e.target.value)} /></td>
            <td><input value={c.url} disabled={ro || c.me} placeholder={c.me ? "(지금 홈페이지)" : "https://"} onChange={(e) => setRow("companies", i, "url", e.target.value)} /></td>
            <td><input value={c.desc} disabled={ro} placeholder="소개 입력" onChange={(e) => setRow("companies", i, "desc", e.target.value)} /></td>
            <td style={{ textAlign: "center" }}><input type="radio" name="me" checked={!!c.me} disabled={ro} onChange={() => S("companies", arr("companies").map((x, j) => ({ ...x, me: j === i })))} /></td>
            <td>{!ro && !c.me && <button className="btn sm ghost" onClick={() => S("companies", arr("companies").filter((_, j) => j !== i))}>×</button>}</td>
          </tr>)}</tbody></table>
        {!ro && <button className="btn sm" style={{ marginTop: 8 }} onClick={() => S("companies", [...arr("companies"), { name: "", en: "", url: "", desc: "", me: false }])}>+ 회사 추가</button>}</div>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="f"><label>다시 뜨는 기준</label><select value={st.repeat} disabled={ro} onChange={(e) => S("repeat", e.target.value)}>{["새로 접속할 때마다 한 번", "하루에 한 번", "처음 한 번만"].map((o) => <option key={o}>{o}</option>)}</select></div>
        <div className="f"><label>"다음부터 바로 한방유비스로"</label><select value={st.remember ? "보이기" : "숨기기"} disabled={ro} onChange={(e) => S("remember", e.target.value === "보이기")}><option>보이기</option><option>숨기기</option></select></div>
      </div></>; break;
    case "hero": body = <><p>첫 화면 사진·문구는 <Link to="/banner" style={{ color: "var(--blue)", fontWeight: 700 }}>메인 배너</Link>에서 고칩니다.</p>
      <div className="f" style={{ marginTop: 12, maxWidth: 240 }}><label>넘김 간격</label><select value={st.interval || 6} disabled={ro} onChange={(e) => S("interval", Number(e.target.value))}>{[4, 6, 8, 10].map((n) => <option key={n} value={n}>{n}초</option>)}</select></div></>; break;
    case "clients": body = <div className="f"><label>발주처 이름 (로고는 사용 허락 받은 것만)</label>
      <div className="chiplist">{arr("items").map((x, i) => <span key={i}>{x}{!ro && <button onClick={() => S("items", arr("items").filter((_, j) => j !== i))}>×</button>}</span>)}</div>
      {!ro && <form style={{ display: "flex", gap: 6, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); const i = (e.currentTarget.elements.namedItem("n") as HTMLInputElement); if (i.value.trim()) { S("items", [...arr("items"), i.value.trim()]); i.value = ""; } }}><input name="n" placeholder="발주처 이름" /><button className="btn sm">추가</button></form>}</div>; break;
    case "nums": body = <div className="f"><label>숫자 (홈페이지에서 0부터 올라가며 보임)</label>
      {arr("items").map((x, i) => <div key={i} className="numrow"><input value={x.v} disabled={ro} onChange={(e) => setRow("items", i, "v", e.target.value)} /><input value={x.ko} disabled={ro} placeholder="설명 (국문)" onChange={(e) => setRow("items", i, "ko", e.target.value)} /><input value={x.en} disabled={ro} placeholder="설명 (영문)" onChange={(e) => setRow("items", i, "en", e.target.value)} />{!ro && <button className="btn sm ghost" onClick={() => S("items", arr("items").filter((_, j) => j !== i))}>×</button>}</div>)}
      {!ro && <button className="btn sm" onClick={() => S("items", [...arr("items"), { v: "0", ko: "", en: "" }])}>+ 숫자 추가</button>}</div>; break;
    case "cases": body = <><div className="f" style={{ maxWidth: 240 }}><label>보일 개수</label><select value={st.count || 3} disabled={ro} onChange={(e) => S("count", Number(e.target.value))}>{[3, 4, 6].map((n) => <option key={n} value={n}>{n}건</option>)}</select></div>
      <p className="help" style={{ marginTop: 10 }}><Link to="/works" style={{ textDecoration: "underline" }}>실적 관리</Link>에서 "메인 수행 사례에 보이기"를 켠 실적이 나옵니다.</p></>; break;
    case "news": body = <div className="grid2"><div className="f"><label>보일 개수</label><select value={st.count || 4} disabled={ro} onChange={(e) => S("count", Number(e.target.value))}>{[3, 4, 6].map((n) => <option key={n} value={n}>{n}건</option>)}</select></div>
      <div className="f"><label>가져올 글</label><select value={st.source} disabled={ro} onChange={(e) => S("source", e.target.value)}>{["새소식 + 보도자료", "새소식만", "상단 고정 글만"].map((o) => <option key={o}>{o}</option>)}</select></div></div>; break;
    case "video": body = <div className="f"><label>YouTube 주소</label><input value={st.youtube || ""} disabled={ro} placeholder="https://www.youtube.com/watch?v=..." onChange={(e) => S("youtube", e.target.value)} /></div>; break;
    default: body = <div className="grid2"><div className="f full"><label>영역 제목 (국문)</label><input value={st.title_ko || ""} disabled={ro} onChange={(e) => S("title_ko", e.target.value)} /></div><div className="f full"><label>영역 제목 (영문)</label><input value={st.title_en || ""} disabled={ro} onChange={(e) => S("title_en", e.target.value)} /></div></div>;
  }

  return (
    <section className="view on">
      <div className="ph"><div><h1>메인 화면 구성</h1><p>메인 화면에 나오는 영역의 순서와 노출을 정합니다. 맨 위 두 영역(🔒)은 자리가 고정이고, 나머지는 끌어서 순서를 바꿉니다.</p></div></div>
      <div className="mm">
        <section className="panel"><div className="panel-hd"><h2>영역 순서</h2><span className="help">⠿ 끌어서 순서 변경</span></div>
          <div className="panel-bd"><ul className="secs">{locked.map((r, i) => row(r, i, locked))}{free.map((r, i) => row(r, i, free))}</ul></div></section>
        <section className="panel"><div className="panel-hd"><h2>{cur ? cur.name + " 설정" : "영역 설정"}</h2>{cur && lv >= 2 && <button className="btn navy sm" onClick={saveSettings}>저장</button>}</div>
          <div className="panel-bd">{body}</div>
          <div className="panel-bd" style={{ borderTop: "1px solid var(--line)" }}><b style={{ fontSize: 13 }}>화면 순서 미리보기</b>
            <div className="mini">{items.filter((x) => x.visible || x.key === "hero").map((x) => <div key={x.id} className={"mini-b mb-" + x.key}>{x.name}</div>)}</div></div>
        </section>
      </div>
    </section>
  );
}

function summary(r: Rec): string {
  const s = r.settings || {};
  switch (r.key) {
    case "gate": return (s.companies || []).map((c: any) => c.name).join(" · ");
    case "hero": return `메인 배너 · ${s.interval || 6}초마다 넘김`;
    case "clients": return `${(s.items || []).length}곳`;
    case "nums": return (s.items || []).map((x: any) => x.v).join(" · ");
    case "cases": return `실적에서 메인 노출 ${s.count || 3}건`;
    case "news": return `최근 ${s.count || 4}건 · ${s.source || ""}`;
    case "video": return s.youtube ? "영상 연결됨" : "영상 주소 없음";
    default: return s.title_ko || "";
  }
}
