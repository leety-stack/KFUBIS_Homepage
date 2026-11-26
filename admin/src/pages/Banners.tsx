import { useCallback, useEffect, useState } from "react";
import { buildBody, Field, initVals, type FieldDef, type FormVals } from "../components/fields";
import { Switch, Tag, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { dragProps, move, saveOrder } from "../lib/order";
import { errText, fileUrl, pb, showDate, type Rec } from "../lib/pb";

const F: FieldDef[] = [
  { name: "image", label: "사진 (PC — 1920×1080 이상)", type: "image" },
  { name: "image_mo", label: "사진 (모바일, 없으면 PC 사진 사용)", type: "image" },
  { name: "big", label: "큰 영문 글자", type: "text", full: true },
  { name: "title_ko", label: "제목 (국문)", type: "text", required: true }, { name: "title_en", label: "제목 (영문)", type: "text" },
  { name: "desc_ko", label: "설명 (국문)", type: "text" }, { name: "desc_en", label: "설명 (영문)", type: "text" },
  { name: "btn_ko", label: "버튼 글자 (국문)", type: "text" }, { name: "btn_en", label: "버튼 글자 (영문)", type: "text" },
  { name: "link", label: "버튼 연결", type: "text", full: true, placeholder: "/projects 또는 https://" },
  { name: "start", label: "노출 시작 (비우면 바로)", type: "date" }, { name: "end", label: "노출 끝 (비우면 계속)", type: "date" },
];
export const periodState = (r: Rec) => {
  if (!r.visible) return "숨김";
  const now = new Date();
  if (r.start && new Date(r.start) > now) return "예약";
  if (r.end && new Date(r.end) < now) return "마감";
  return "노출 중";
};

export default function Banners() {
  const { level } = useAuth(); const lv = level("banner"); const toast = useToast();
  const [items, setItems] = useState<Rec[]>([]);
  const [cur, setCur] = useState<Rec | null>(null);
  const [vals, setVals] = useState<FormVals>({});
  const [from, setFrom] = useState<number | null>(null);
  const [lang, setLang] = useState<"ko" | "en">("ko");

  const load = useCallback(async () => { const r = (await pb.collection("banners").getFullList({ sort: "sort,created" })) as Rec[]; setItems(r); return r; }, []);
  const pick = (r: Rec) => { setCur(r); setVals(initVals(F, r)); };
  useEffect(() => { load().then((r) => r[0] && pick(r[0])); }, []); // eslint-disable-line
  const set = (k: string, v: any) => setVals((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!cur) return;
    if (!vals.title_ko) { toast("제목(국문)을 입력하세요"); return; }
    try { const r = await pb.collection("banners").update(cur.id, buildBody(F, vals, cur)); toast("저장했습니다 — 첫 화면에 반영되었습니다"); const l = await load(); pick(l.find((x) => x.id === r.id)!); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const add = async () => {
    try { const r = await pb.collection("banners").create({ title_ko: "새 배너 제목", big: "New", sort: (items.length + 1) * 10, visible: false }); toast("새 배너를 숨김 상태로 만들었습니다"); await load(); pick(r as Rec); }
    catch (e) { toast("만들지 못했습니다 — " + errText(e)); }
  };
  const del = async () => {
    if (!cur || !confirm(`"${cur.title_ko}" 배너를 삭제할까요?`)) return;
    try { await pb.collection("banners").delete(cur.id); toast("삭제했습니다"); const l = await load(); l[0] ? pick(l[0]) : setCur(null); }
    catch (e) { toast("삭제하지 못했습니다 — " + errText(e)); }
  };
  const toggle = async (on: boolean) => {
    if (!cur) return;
    try { await pb.collection("banners").update(cur.id, { visible: on }); const l = await load(); const n = l.find((x) => x.id === cur.id)!; setCur(n); toast(on ? "보이게 했습니다" : "숨겼습니다"); }
    catch (e) { toast("바꾸지 못했습니다 — " + errText(e)); }
  };

  const prevImg = vals.image__new ? URL.createObjectURL(vals.image__new) : cur?.image && vals.image !== "" ? fileUrl(cur, cur.image, "1200x0") : "";
  return (
    <section className="view on">
      <div className="ph"><div><h1>메인 배너</h1><p>첫 화면에 넘어가는 사진과 문구입니다. 끌어서 순서를 바꾸고, 기간을 넣으면 그 기간에만 보입니다.</p></div>
        {lv >= 2 && <button className="btn" onClick={add}>+ 배너 추가</button>}</div>
      <section className="panel"><div className="panel-hd"><h2>배너 순서</h2><span className="help">⠿ 끌어서 순서 변경 · 넘김 간격은 "메인 화면 구성 › 첫 화면"에서</span></div>
        <div className="bnlist">{items.map((r, i) => (
          <div key={r.id} className={"bn" + (cur?.id === r.id ? " sel" : "") + (r.visible ? "" : " off")} onClick={() => pick(r)}
            {...dragProps(i, { from, setFrom, enabled: lv >= 2, onDrop: async (a, b) => { const next = move(items, a, b); try { await saveOrder("banners", next.map((x) => x.id), Object.fromEntries(items.map((x) => [x.id, x.sort]))); toast("순서를 바꿨습니다"); load(); } catch (e) { toast(errText(e)); } } })}>
            {r.image ? <img src={fileUrl(r, r.image, "400x300")} alt="" /> : <div className="noimg" style={{ height: 100 }}>사진 없음</div>}
            <div><small>{i + 1}번째 {r.start || r.end ? `· ${showDate(r.start) || "…"} ~ ${showDate(r.end) || "…"}` : ""}</small><b>{r.title_ko}</b><Tag t={periodState(r)} /></div>
          </div>))}
          {!items.length && <p className="help" style={{ padding: 10 }}>배너가 없습니다</p>}</div></section>
      {cur && <div className="pp">
        <section className="panel"><div className="panel-hd"><h2>배너 설정</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{lv >= 3 && <><span className="help">노출</span><Switch on={!!cur.visible} onChange={toggle} label="노출" /></>}{lv >= 3 && <button className="btn sm" style={{ color: "var(--pri)" }} onClick={del}>삭제</button>}</div></div>
          <div className="panel-bd"><div className="grid2">{F.map((f) => <Field key={f.name} f={f} vals={vals} set={set} rec={cur} disabled={lv < 2} />)}</div>
            {lv >= 2 && <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><button className="btn navy" onClick={save}>저장</button></div>}</div></section>
        <section className="panel"><div className="panel-hd"><h2>미리보기</h2><div className="seg"><button className={lang === "ko" ? "on" : ""} onClick={() => setLang("ko")}>국문</button><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button></div></div>
          <div className="panel-bd"><div className="bnprev">{prevImg && <img src={prevImg} alt="" />}<div className="bt"><span className="bb">{vals.big}</span><b>{lang === "ko" ? vals.title_ko : vals.title_en || "(영문 제목 없음)"}</b><small>{lang === "ko" ? vals.desc_ko : vals.desc_en}</small>{(lang === "ko" ? vals.btn_ko : vals.btn_en) && <i>{lang === "ko" ? vals.btn_ko : vals.btn_en}</i>}</div></div>
            <p className="help" style={{ marginTop: 8 }}>저장 전에도 고치는 대로 바뀝니다.</p></div></section>
      </div>}
    </section>
  );
}
