import { useEffect, useState } from "react";
import { buildBody, Field, initVals, type FieldDef, type FormVals } from "../components/fields";
import { useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, fileUrl, pb, type Rec } from "../lib/pb";

const F: FieldDef[] = [
  { name: "name_ko", label: "회사명 (국문)", type: "text" }, { name: "name_en", label: "회사명 (영문)", type: "text" },
  { name: "ceo", label: "대표자", type: "text" }, { name: "biz_no", label: "사업자등록번호", type: "text" },
  { name: "tel", label: "대표 전화", type: "text" }, { name: "fax", label: "팩스", type: "text" },
  { name: "email", label: "대표 메일", type: "text" }, { name: "admin_email", label: "1영업일 넘은 문의 알림 받을 메일", type: "text" },
  { name: "addr_ko", label: "주소 (국문)", type: "text", full: true }, { name: "addr_en", label: "주소 (영문)", type: "text", full: true },
];
const LOGOS: FieldDef[] = [{ name: "logo_light", label: "로고 (밝은 바탕용)", type: "image" }, { name: "logo_dark", label: "로고 (어두운 바탕용)", type: "image" }];
const DEPTS = ["설계사업본부", "감리사업본부", "방재연구소", "R&D센터", "방재사업본부", "경영지원팀"];

export default function Company() {
  const { level } = useAuth(); const lv = level("company"); const toast = useToast();
  const [rec, setRec] = useState<Rec | null>(null);
  const [vals, setVals] = useState<FormVals>({});
  const [family, setFamily] = useState<{ name: string; url: string }[]>([]);
  const [depts, setDepts] = useState<Record<string, string>>({});
  const load = async () => {
    const r = (await pb.collection("site_settings").getFirstListItem("id != ''")) as Rec;
    setRec(r); setVals(initVals([...F, ...LOGOS], r)); setFamily(r.family || []); setDepts(r.dept_emails || {});
  };
  useEffect(() => { load().catch((e) => toast("불러오지 못했습니다 — " + errText(e))); }, []); // eslint-disable-line
  const set = (k: string, v: any) => setVals((p) => ({ ...p, [k]: v }));
  const ro = lv < 2;

  const save = async () => {
    if (!rec) return;
    try { await pb.collection("site_settings").update(rec.id, { ...buildBody([...F, ...LOGOS], vals, rec), family: family.filter((f) => f.name.trim()), dept_emails: depts }); toast("저장했습니다 — 모든 페이지 하단·문의 안내에 반영되었습니다"); load(); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const logo = vals.logo_dark__new ? URL.createObjectURL(vals.logo_dark__new) : rec?.logo_dark && vals.logo_dark !== "" ? fileUrl(rec, rec.logo_dark) : "/logo_w.png";

  return (
    <section className="view on">
      <div className="ph"><div><h1>회사 정보·하단 문구</h1><p>모든 페이지 맨 아래, 문의 안내, 오시는 길에 함께 쓰입니다. 한 곳에서 고치면 전부 바뀝니다.</p></div>
        {lv >= 2 && <button className="btn navy" onClick={save}>저장</button>}</div>
      {rec && <div className="pp">
        <section className="panel"><div className="panel-hd"><h2>기본 정보</h2></div>
          <div className="panel-bd"><div className="grid2">{F.map((f) => <Field key={f.name} f={f} vals={vals} set={set} rec={rec} disabled={ro} />)}</div>
            <div className="grid2" style={{ marginTop: 14 }}>{LOGOS.map((f) => <Field key={f.name} f={{ ...f, full: false }} vals={vals} set={set} rec={rec} disabled={ro} />)}</div></div></section>
        <section className="panel"><div className="panel-hd"><h2>Family Site · 본부 알림 메일</h2></div>
          <div className="panel-bd">
            <div className="f"><label>Family Site (모든 페이지 하단 선택 상자에 이 순서로, 새 창)</label>
              {family.map((x, i) => <div key={i} className="famrow">
                <input value={x.name} disabled={ro} placeholder="회사 이름" onChange={(e) => setFamily(family.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
                <input value={x.url} disabled={ro} placeholder="https://" onChange={(e) => setFamily(family.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)))} />
                {!ro && <button className="btn sm ghost" onClick={() => setFamily(family.filter((_, j) => j !== i))}>×</button>}</div>)}
              {!ro && <button className="btn sm" onClick={() => setFamily([...family, { name: "", url: "" }])}>+ 추가</button>}</div>
            <div className="f" style={{ marginTop: 16 }}><label>본부 알림 메일 (문의가 배정되면 이 주소로 알림 — 여러 명은 쉼표로)</label>
              {DEPTS.map((d) => <div key={d} className="famrow"><span className="sub" style={{ alignSelf: "center" }}>{d}</span><input value={depts[d] || ""} disabled={ro} placeholder="name@kfubis.com" onChange={(e) => setDepts({ ...depts, [d]: e.target.value })} /></div>)}</div>
            <b style={{ fontSize: 13, display: "block", margin: "16px 0 6px" }}>하단 미리보기</b>
            <div className="foot-prev"><img src={logo} alt="" /><p>{vals.name_ko} · 대표이사 {vals.ceo} · {vals.addr_ko}<br />TEL {vals.tel} · FAX {vals.fax}{vals.email ? " · " + vals.email : ""} · 사업자등록번호 {vals.biz_no}</p>
              <select aria-label="Family Site" style={{ marginTop: 8, maxWidth: 220, background: "#1b1f26", color: "#ccc", borderColor: "#444" }}><option>Family Site</option>{family.filter((f) => f.name).map((f, i) => <option key={i}>{f.name}</option>)}</select></div>
          </div></section>
      </div>}
    </section>
  );
}
