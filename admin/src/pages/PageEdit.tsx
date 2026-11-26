import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, Opt, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, fileUrl, pb, showTime, type Rec } from "../lib/pb";

type L2 = { ko: string; en: string };
type Block = { t: "hero" | "text" | "text2" | "nums" | "cta" | "sign"; img?: string; bg?: string; sub?: L2; h?: L2; p?: L2; link?: string; items?: { v: string; l: L2 }[] };
const NAMES: Record<Block["t"], string> = { hero: "제목 배너", text: "글·사진", text2: "사진·글", nums: "숫자 띠", cta: "문의 버튼", sign: "서명" };
const BGS = [["", "흰색"], ["#f5f6f8", "연회색"], ["#1d395e", "남색"], ["#111827", "검정"]];
const DARK = new Set(["#1d395e", "#111827"]);
const LINKS = [["inquiry", "사업 문의 양식"], ["tel", "전화 걸기"], ["profile", "회사소개서 내려받기"]];
const e2 = (ko = ""): L2 => ({ ko, en: "" });
const NEW: Record<Block["t"], () => Block> = {
  hero: () => ({ t: "hero", img: "", bg: "", sub: e2("작은 제목"), h: e2("큰 제목을 입력하세요") }),
  text: () => ({ t: "text", img: "", bg: "", h: e2("제목"), p: e2("본문을 입력하세요") }),
  text2: () => ({ t: "text2", img: "", bg: "", h: e2("제목"), p: e2("본문을 입력하세요") }),
  nums: () => ({ t: "nums", bg: "", items: [0, 1, 2].map(() => ({ v: "0", l: e2("설명") })) }),
  cta: () => ({ t: "cta", bg: "", link: "inquiry", h: e2("안내 문구"), p: { ko: "사업 문의", en: "Contact" } }),
  sign: () => ({ t: "sign", bg: "", p: e2("직함"), h: e2("이름") }),
};
const same = (a: any, b: any) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

export default function PageEdit() {
  const { level } = useAuth(); const lv = level("page"); const toast = useToast(); const ro = lv < 2;
  const [pages, setPages] = useState<Rec[]>([]); const [rec, setRec] = useState<Rec | null>(null);
  const [B, setB] = useState<Block[]>([]); const [bs, setBs] = useState(0); const [lang, setLang] = useState<"ko" | "en">("ko"); const [mo, setMo] = useState(false);
  const [hist, setHist] = useState<Rec[]>([]); const [meta, setMeta] = useState<null | { mode: "new" | "edit" }>(null);
  const drag = useRef<number | null>(null);
  const dirty = !!rec && !same(B, rec.draft);

  const open = useCallback(async (id?: string) => {
    const list = (await pb.collection("pages").getFullList({ sort: "name" })) as Rec[]; setPages(list);
    const r = list.find((x) => x.id === id) || list[0] || null; setRec(r); setB(JSON.parse(JSON.stringify(r?.draft || []))); setBs(0);
    if (r && level("history") > 0) pb.collection("change_log").getList(1, 5, { sort: "-created", filter: pb.filter("coll = 'pages' && rec_id = {:id}", { id: r.id }) }).then((h) => setHist(h.items as Rec[])).catch(() => setHist([]));
  }, []); // eslint-disable-line
  useEffect(() => { open().catch((e) => toast("불러오지 못했습니다 — " + errText(e))); }, [open]); // eslint-disable-line
  useEffect(() => { const w = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } }; addEventListener("beforeunload", w); return () => removeEventListener("beforeunload", w); }, [dirty]);

  const change = (fn: (b: Block[]) => void) => setB((prev) => { const n = JSON.parse(JSON.stringify(prev)); fn(n); return n; });
  const L = (o?: L2) => (o ? o[lang] || (lang === "en" ? "(영문 미입력)" : "") : "");
  const img = (name?: string, big = false) => (rec && name ? fileUrl(rec, name, big ? "1600x0" : "400x0") : "");

  const switchPage = (id: string) => { if (dirty && !confirm("저장하지 않은 내용이 있습니다. 버리고 다른 페이지로 갈까요?")) return; open(id); };
  const save = async (publish: boolean) => {
    if (!rec) return;
    if (publish && !confirm("홈페이지에 게시할까요? 지금 게시본은 변경 이력에 남습니다.")) return;
    const body: any = { draft: B }; if (publish) { body.live = B; body.published = new Date().toISOString().replace("T", " "); }
    try { const r = await pb.collection("pages").update(rec.id, body); toast(publish ? "홈페이지에 게시했습니다 — 이전 게시본은 변경 이력에 남습니다" : "임시저장했습니다 — 홈페이지에는 아직 보이지 않습니다"); open(r.id); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const upload = async (f: File) => {
    if (!rec) return;
    try {
      const before = new Set<string>(rec.images || []);
      const r = (await pb.collection("pages").update(rec.id, { "images+": f })) as Rec;
      const added = (r.images as string[]).find((x) => !before.has(x));
      setRec({ ...rec, images: r.images, updated: r.updated });
      if (added) change((b) => { b[bs].img = added; });
      toast("사진을 올렸습니다");
    } catch (e) { toast("올리지 못했습니다 — " + errText(e)); }
  };
  const status = !rec ? "" : dirty ? "수정 중 · 저장 전" : !same(rec.draft, rec.live) ? "임시저장 · 게시 전" : rec.published ? `게시됨 ${showTime(rec.published, true)}` : "게시 전";
  const stCls = dirty || (rec && !same(rec.draft, rec.live)) ? "t-wait" : "t-on";
  const b = B[bs];

  const html = (x: Block, i: number) => {
    const dark = DARK.has(x.bg || ""); const st = { background: x.bg || undefined, color: dark ? "#fff" : undefined };
    let inner: React.ReactNode = null;
    if (x.t === "hero") inner = <div className="b-hero" style={{ backgroundImage: x.img ? `url(${img(x.img, true)})` : undefined, backgroundColor: "#334155" }}><small>{L(x.sub)}</small><h2>{L(x.h)}</h2></div>;
    else if (x.t === "text" || x.t === "text2") inner = <div className={"b-text" + (x.t === "text2" ? " rev" : "")} style={st}><div><h3>{L(x.h)}</h3><p style={{ color: dark ? "#e5e7eb" : undefined }}>{L(x.p)}</p></div>{x.img ? <img src={img(x.img)} alt="" /> : <div style={{ aspectRatio: "4/3", background: "#e5e7eb", display: "grid", placeItems: "center", color: "#6b7280", fontSize: 12 }}>사진 없음</div>}</div>;
    else if (x.t === "nums") inner = <div className="b-nums" style={x.bg ? { background: x.bg, color: dark ? "#fff" : "#111" } : undefined}>{(x.items || []).map((it, k) => <div key={k}><b>{it.v}</b><span>{L(it.l)}</span></div>)}</div>;
    else if (x.t === "sign") inner = <div className="b-sign" style={st}>{L(x.p)}<b style={dark ? { color: "#fff" } : undefined}>{L(x.h)}</b></div>;
    else if (x.t === "cta") inner = <div className="b-cta" style={x.bg ? st : undefined}><strong>{L(x.h)}</strong><a>{L(x.p)}</a></div>;
    return <div key={i} className={"blk" + (i === bs ? " sel" : "")} data-name={NAMES[x.t]} onClick={() => setBs(i)}>{inner}</div>;
  };
  const tf = (label: string, o: L2 | undefined, set: (v: string) => void, multi = false) => (
    <div className="f"><label>{label} <span className="help">({lang === "ko" ? "국문" : "영문"})</span></label>
      {multi ? <textarea value={o?.[lang] || ""} disabled={ro} onChange={(e) => set(e.target.value)} style={{ minHeight: 120 }} /> : <input value={o?.[lang] || ""} disabled={ro} onChange={(e) => set(e.target.value)} />}</div>);
  const imgPick = () => (
    <div className="f"><label>사진</label>
      <div className="imgpick">{b?.img ? <img src={img(b.img)} alt="" /> : <span className="sub">없음</span>}
        {!ro && <label className="btn sm" style={{ justifySelf: "start" }}>내 PC에서 올리기<input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} /></label>}</div>
      {(rec?.images || []).length > 0 && <div className="lib">{(rec!.images as string[]).map((n) => <img key={n} src={img(n)} className={n === b?.img ? "on" : ""} alt="" onClick={() => !ro && change((x) => { x[bs].img = n; })} />)}</div>}
      <span className="help">이 페이지의 사진 보관함에서 고르거나 새로 올림 · PC·모바일 크기는 자동</span></div>);

  return (
    <section className="view on">
      <div className="ph"><div><h1>페이지 편집<Opt /></h1><p>블록을 쌓아 페이지를 만듭니다. 가운데 화면에서 블록을 누르면 오른쪽에서 글·사진을 고칩니다. 임시저장은 홈페이지에 보이지 않고, [게시]해야 반영됩니다.</p></div>
        <div className="pstate">
          <select style={{ width: "auto" }} value={rec?.id || ""} onChange={(e) => switchPage(e.target.value)} aria-label="페이지">{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          {lv >= 3 && <button className="btn sm" onClick={() => setMeta({ mode: "edit" })} disabled={!rec}>이름·주소</button>}
          {lv >= 3 && <button className="btn sm" onClick={() => setMeta({ mode: "new" })}>+ 새 페이지</button>}
          <div className="seg">{(["ko", "en"] as const).map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l === "ko" ? "국문" : "English"}</button>)}</div>
          <div className="seg"><button className={!mo ? "on" : ""} onClick={() => setMo(false)}>PC</button><button className={mo ? "on" : ""} onClick={() => setMo(true)}>모바일</button></div>
          {rec && <span className={"tag " + stCls}>{status}</span>}
          {!ro && <button className="btn" onClick={() => save(false)} disabled={!rec}>임시저장</button>}
          {lv >= 3 && <button className="btn pri" onClick={() => save(true)} disabled={!rec}>게시</button>}
        </div></div>
      {!rec ? <section className="panel"><div className="panel-bd empty">페이지가 없습니다{lv >= 3 ? " — [+ 새 페이지]로 만드세요" : ""}</div></section> :
        <div className="pe">
          <div className="panel"><div className="panel-hd"><h2>블록</h2><span className="help">끌어서 순서 변경</span></div>
            <div className="blist">{B.map((x, i) => (
              <div key={i} className={"bitem" + (i === bs ? " sel" : "")} draggable={!ro} onClick={() => setBs(i)}
                onDragStart={(e) => { drag.current = i; e.currentTarget.classList.add("drag"); }} onDragEnd={(e) => e.currentTarget.classList.remove("drag")}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("over"); }} onDragLeave={(e) => e.currentTarget.classList.remove("over")}
                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("over"); const from = drag.current; if (from === null || from === i) return; change((n) => { const [m] = n.splice(from, 1); n.splice(i, 0, m); }); setBs(i); }}>
                <span className="hd2">⠿</span><div><b>{NAMES[x.t]}</b><small>{(L(x.h) || L(x.sub) || (x.items || []).map((k) => k.v).join(" · ")).slice(0, 18)}</small></div></div>))}
              {!B.length && <p className="help">아래에서 블록을 추가하세요</p>}</div>
            {!ro && <div className="palette">{(Object.keys(NAMES) as Block["t"][]).map((t) => <button key={t} onClick={() => { change((n) => n.splice(bs + 1, 0, NEW[t]())); setBs(B.length ? bs + 1 : 0); toast(NAMES[t] + " 블록을 추가했습니다"); }}>+ {NAMES[t]}</button>)}</div>}
          </div>
          <div className="canvas-wrap"><div className={"canvas" + (mo ? " mo" : "")}><div className="cv-hd"><img src="/logo_a.png" alt="" /><span>kfubis.co.kr{lang === "en" ? "/en" : ""}/{rec.slug}</span></div><div>{B.map(html)}</div></div></div>
          <div className="panel props"><div className="panel-hd"><h2>{b ? NAMES[b.t] + " 설정" : "블록 설정"}</h2>{b && !ro && <button className="btn sm ghost" style={{ color: "var(--pri)" }} onClick={() => { change((n) => n.splice(bs, 1)); setBs(Math.max(0, bs - 1)); }}>블록 삭제</button>}</div>
            <div className="panel-bd">{!b ? <p className="help">블록을 고르세요</p> : <>
              {b.t === "hero" && <>{tf("작은 제목", b.sub, (v) => change((n) => { n[bs].sub![lang] = v; }))}{tf("큰 제목", b.h, (v) => change((n) => { n[bs].h![lang] = v; }))}{imgPick()}</>}
              {(b.t === "text" || b.t === "text2") && <>{tf("제목", b.h, (v) => change((n) => { n[bs].h![lang] = v; }))}{tf("본문", b.p, (v) => change((n) => { n[bs].p![lang] = v; }), true)}{imgPick()}
                <div className="f"><label>사진 위치</label><div className="seg"><button className={b.t === "text2" ? "on" : ""} disabled={ro} onClick={() => change((n) => { n[bs].t = "text2"; })}>왼쪽</button><button className={b.t === "text" ? "on" : ""} disabled={ro} onClick={() => change((n) => { n[bs].t = "text"; })}>오른쪽</button></div></div></>}
              {b.t === "nums" && <>{(b.items || []).map((it, k) => <div className="grid2" key={k}>
                <div className="f"><label>숫자 {k + 1}</label><input value={it.v} disabled={ro} onChange={(e) => change((n) => { n[bs].items![k].v = e.target.value; })} /></div>
                {tf("설명", it.l, (v) => change((n) => { n[bs].items![k].l[lang] = v; }))}</div>)}
                {!ro && <div style={{ display: "flex", gap: 6 }}><button className="btn sm" disabled={(b.items || []).length >= 4} onClick={() => change((n) => n[bs].items!.push({ v: "0", l: e2("설명") }))}>+ 숫자</button><button className="btn sm" disabled={(b.items || []).length <= 1} onClick={() => change((n) => n[bs].items!.pop())}>− 숫자</button></div>}
                <span className="help">숫자는 홈페이지에서 0부터 올라가며 표시됩니다</span></>}
              {b.t === "sign" && <>{tf("직함", b.p, (v) => change((n) => { n[bs].p![lang] = v; }))}{tf("이름", b.h, (v) => change((n) => { n[bs].h![lang] = v; }))}</>}
              {b.t === "cta" && <>{tf("안내 문구", b.h, (v) => change((n) => { n[bs].h![lang] = v; }))}{tf("버튼 글자", b.p, (v) => change((n) => { n[bs].p![lang] = v; }))}
                <div className="f"><label>버튼 연결</label><select value={b.link || "inquiry"} disabled={ro} onChange={(e) => change((n) => { n[bs].link = e.target.value; })}>{LINKS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></div></>}
              {b.t !== "hero" && <div className="f"><label>배경색</label><div className="color">{BGS.map(([c, t]) => <button key={c} title={t} aria-label={t} className={(b.bg || "") === c ? "on" : ""} style={{ background: c || "#fff" }} disabled={ro} onClick={() => change((n) => { n[bs].bg = c; })} />)}</div><span className="help">홈페이지 색 안에서만 고를 수 있어 디자인이 깨지지 않습니다</span></div>}
            </>}</div>
            {level("history") > 0 && <div className="panel-bd" style={{ borderTop: "1px solid var(--line)" }}><b style={{ fontSize: 13 }}>변경 이력</b>
              <div className="hist" style={{ marginTop: 6 }}>{hist.map((h) => <span key={h.id}>{showTime(h.created, true)} {h.who_name} — {h.fields?.includes("live") ? "게시" : h.action === "수정" ? "임시저장" : h.action}</span>)}{!hist.length && <span>아직 없습니다</span>}
                <Link to="/history" style={{ color: "var(--blue)" }}>전체 이력·되돌리기 →</Link></div></div>}
          </div>
        </div>}
      {meta && <PageMeta mode={meta.mode} rec={meta.mode === "edit" ? rec : null} onClose={() => setMeta(null)} onDone={(id) => { setMeta(null); open(id); }} />}
    </section>
  );
}

function PageMeta({ mode, rec, onClose, onDone }: { mode: "new" | "edit"; rec: Rec | null; onClose: () => void; onDone: (id: string) => void }) {
  const toast = useToast();
  const [v, setV] = useState({ name: rec?.name || "", slug: rec?.slug || "" });
  const save = async () => {
    const slug = v.slug.replace(/^\/+|\/+$/g, "");
    if (!v.name.trim() || !/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(slug)) { toast("이름과 주소(영문 소문자·숫자·-, 예: company/history)를 확인하세요"); return; }
    try {
      const r = mode === "new" ? await pb.collection("pages").create({ name: v.name, slug, draft: [NEW.hero()], live: [] }) : await pb.collection("pages").update(rec!.id, { name: v.name, slug });
      toast(mode === "new" ? "페이지를 만들었습니다 — 메뉴 관리에서 이 페이지를 메뉴에 연결하세요" : "저장했습니다"); onDone(r.id);
    } catch (e: any) { toast(e?.response?.data?.slug ? "이미 있는 주소입니다" : "저장하지 못했습니다 — " + errText(e)); }
  };
  const del = async () => {
    if (!rec || !confirm(`"${rec.name}" 페이지를 삭제할까요? 메뉴에 연결되어 있으면 홈페이지에서 빈 페이지가 됩니다.`)) return;
    try { await pb.collection("pages").delete(rec.id); toast("삭제했습니다"); onDone(""); } catch (e) { toast(errText(e)); }
  };
  return (
    <Modal title={mode === "new" ? "새 페이지" : "페이지 이름·주소"} onClose={onClose}
      footer={<>{mode === "edit" && <button className="btn" style={{ color: "var(--pri)", marginRight: "auto" }} onClick={del}>삭제</button>}<button className="btn" style={mode === "new" ? { marginLeft: "auto" } : undefined} onClick={onClose}>취소</button><button className="btn navy" onClick={save}>{mode === "new" ? "만들기" : "저장"}</button></>}>
      <div className="grid2">
        <div className="f"><label><i>* </i>페이지 이름</label><input value={v.name} placeholder="예: 회사소개 › 연혁" onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus /></div>
        <div className="f"><label><i>* </i>주소</label><input value={v.slug} placeholder="예: company/history" onChange={(e) => setV({ ...v, slug: e.target.value.trim().toLowerCase() })} /><span className="help">kfubis.co.kr/{v.slug || "…"}</span></div>
      </div>
    </Modal>
  );
}
