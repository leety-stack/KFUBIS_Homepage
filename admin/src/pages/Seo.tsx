import { useEffect, useState } from "react";
import { Opt, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, fileUrl, pb, type Rec } from "../lib/pb";

const TMAX = 40, DMAX = 120;

export default function Seo() {
  const { level } = useAuth(); const lv = level("seo"); const toast = useToast(); const ro = lv < 2;
  const [rows, setRows] = useState<Rec[]>([]); const [cur, setCur] = useState<Rec | null>(null); const [lang, setLang] = useState<"ko" | "en">("ko");
  const [site, setSite] = useState<Rec | null>(null); const [sv, setSv] = useState({ site_name: "", site_url: "", naver: "", google: "" });
  const load = async (keep?: string) => {
    const r = (await pb.collection("seo_pages").getFullList({ sort: "sort,path" })) as Rec[]; setRows(r);
    const k = r.find((x) => x.id === keep) || r[0]; setCur(k ? { ...k } : null);
    const s = (await pb.collection("seo_site").getFirstListItem("id != ''")) as Rec; setSite(s);
    setSv({ site_name: s.site_name || "", site_url: s.site_url || "", naver: s.naver || "", google: s.google || "" });
  };
  useEffect(() => { load().catch((e) => toast("불러오지 못했습니다 — " + errText(e))); }, []); // eslint-disable-line

  const tk = lang === "ko" ? "title" : "title_en", dk = lang === "ko" ? "description" : "description_en";
  const savePage = async () => {
    if (!cur) return;
    if (!cur.label?.trim() || !/^\//.test(cur.path || "")) { toast("이름과 주소(/로 시작)를 확인하세요"); return; }
    try { await pb.collection("seo_pages").update(cur.id, { label: cur.label, path: cur.path, title: cur.title, description: cur.description, title_en: cur.title_en, description_en: cur.description_en }); toast("저장했습니다 — 검색 사이트에는 다음 수집 때(보통 며칠 안) 반영됩니다"); load(cur.id); }
    catch (e: any) { toast(e?.response?.data?.path ? "이미 있는 주소입니다" : "저장하지 못했습니다 — " + errText(e)); }
  };
  const addPage = async () => {
    try { const r = await pb.collection("seo_pages").create({ label: "새 페이지", path: "/new-" + Date.now().toString(36), sort: (rows.length + 1) * 10 }); toast("추가했습니다 — 이름과 주소를 고치세요"); load(r.id); }
    catch (e) { toast(errText(e)); }
  };
  const delPage = async () => {
    if (!cur || !confirm(`"${cur.label}" 설정을 삭제할까요? 그 페이지는 본문에서 자동으로 만든 제목·설명을 씁니다.`)) return;
    try { await pb.collection("seo_pages").delete(cur.id); toast("삭제했습니다"); load(); } catch (e) { toast(errText(e)); }
  };
  const saveSite = async (og?: File) => {
    if (!site) return;
    if (sv.site_url && !/^https?:\/\/[^/]+/.test(sv.site_url)) { toast("홈페이지 주소는 https:// 로 시작해야 합니다"); return; }
    const fd = new FormData(); Object.entries(sv).forEach(([k, v]) => fd.append(k, v)); if (og) fd.append("og_image", og);
    try { const s = await pb.collection("seo_site").update(site.id, fd); setSite(s as Rec); toast(og ? "대표 이미지를 바꿨습니다" : "저장했습니다"); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const t = (cur?.[tk] || "") as string, d = (cur?.[dk] || "") as string;
  const host = (sv.site_url || "https://kfubis.co.kr").replace(/^https?:\/\//, "").replace(/\/+$/, "");

  return (
    <section className="view on">
      <div className="ph"><div><h1>검색 노출 (SEO)<Opt /></h1><p>네이버·구글 검색 결과에 보이는 제목과 설명입니다. 비워 두면 페이지 내용에서 자동으로 만듭니다.</p></div>
        <div className="seg">{(["ko", "en"] as const).map((l) => <button key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>{l === "ko" ? "국문" : "English"}</button>)}</div></div>
      <div className="pp">
        <section className="panel"><div className="panel-hd"><h2>페이지별 설정</h2>{lv >= 3 && <button className="btn sm" onClick={addPage}>+ 페이지 추가</button>}</div>
          <div className="tbl"><table><thead><tr><th>페이지</th><th className="hide-m">주소</th><th>설명</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id} className={cur?.id === r.id ? "sel" : ""} style={{ cursor: "pointer" }} onClick={() => setCur({ ...r })}>
              <td><b>{r.label}</b></td><td className="hide-m sub">{r.path}</td><td>{(lang === "ko" ? r.description : r.description_en) ? <span className="tag t-on">입력</span> : <span className="tag t-wait">자동</span>}</td></tr>)}</tbody></table></div>
          {cur && <div className="panel-bd" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="grid2">
              <div className="f"><label>페이지 이름</label><input value={cur.label || ""} disabled={ro} onChange={(e) => setCur({ ...cur, label: e.target.value })} /></div>
              <div className="f"><label>주소</label><input value={cur.path || ""} disabled={ro} onChange={(e) => setCur({ ...cur, path: e.target.value.trim() })} /></div></div>
            <div className="f" style={{ marginTop: 10 }}><label>검색 제목 ({lang === "ko" ? "국문" : "영문"}) <span className="help" style={{ color: t.length > TMAX ? "var(--pri)" : undefined }}>{t.length}/{TMAX}자</span></label>
              <input value={t} disabled={ro} onChange={(e) => setCur({ ...cur, [tk]: e.target.value })} placeholder={`${cur.label} | ${sv.site_name}`} /></div>
            <div className="f" style={{ marginTop: 10 }}><label>검색 설명 <span className="help" style={{ color: d.length > DMAX ? "var(--pri)" : undefined }}>{d.length}/{DMAX}자</span></label>
              <textarea value={d} disabled={ro} onChange={(e) => setCur({ ...cur, [dk]: e.target.value })} placeholder="비워 두면 본문 앞부분을 씀" /></div>
            <b style={{ fontSize: 13, display: "block", margin: "14px 0 6px" }}>검색 결과 미리보기</b>
            <div className="serp"><small>{host}{lang === "en" ? "/en" : ""}{cur.path === "/" ? "" : cur.path}</small><b>{t || `${cur.label} | ${sv.site_name}`}</b><p>{d || "(본문 앞부분이 자동으로 들어갑니다)"}</p></div>
            {!ro && <div style={{ display: "flex", gap: 8, marginTop: 14 }}>{lv >= 3 && <button className="btn sm" style={{ color: "var(--pri)" }} onClick={delPage}>삭제</button>}<button className="btn sm navy" style={{ marginLeft: "auto" }} onClick={savePage}>저장</button></div>}
          </div>}
        </section>
        <section className="panel"><div className="panel-hd"><h2>사이트 전체</h2>{!ro && <button className="btn sm navy" onClick={() => saveSite()}>저장</button>}</div>
          <div className="panel-bd"><div className="grid2">
            <div className="f"><label>사이트 이름</label><input value={sv.site_name} disabled={ro} onChange={(e) => setSv({ ...sv, site_name: e.target.value })} /></div>
            <div className="f"><label>홈페이지 주소</label><input value={sv.site_url} disabled={ro} placeholder="https://kfubis.co.kr" onChange={(e) => setSv({ ...sv, site_url: e.target.value.trim() })} /></div>
            <div className="f full"><label>공유할 때 보일 대표 이미지</label>
              <div className="imgpick">{site?.og_image ? <img src={fileUrl(site, site.og_image, "1200x630")} alt="" /> : <span className="sub">없음</span>}
                {!ro && <label className="btn sm" style={{ justifySelf: "start" }}>내 PC에서 올리기<input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && saveSite(e.target.files[0])} /></label>}</div>
              <span className="help">카카오톡·링크드인에 주소를 붙여 넣을 때 보이는 그림입니다 (1200×630 권장)</span></div>
            <div className="f"><label>네이버 서치어드바이저 확인 코드</label><input value={sv.naver} disabled={ro} placeholder="naver-site-verification" onChange={(e) => setSv({ ...sv, naver: e.target.value.trim() })} /></div>
            <div className="f"><label>구글 서치 콘솔 확인 코드</label><input value={sv.google} disabled={ro} placeholder="google-site-verification" onChange={(e) => setSv({ ...sv, google: e.target.value.trim() })} /></div></div>
            <ul className="mini-l" style={{ marginTop: 14 }}>
              <li><a href="/sitemap.xml" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>sitemap.xml</a> <span className="tag t-on">자동 생성</span></li>
              <li><a href="/robots.txt" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>robots.txt</a> <span className="tag t-on">자동 생성</span></li>
              <li>영문 페이지 연결 (hreflang) <span className="tag t-on">자동</span></li></ul>
            <p className="help" style={{ marginTop: 10 }}>사이트맵은 노출 중인 메뉴·게시한 페이지·위 페이지별 설정에서 자동으로 만듭니다. 네이버 서치어드바이저·구글 서치 콘솔에 사이트맵 주소를 한 번 등록해 두면 됩니다.</p>
          </div></section>
      </div>
    </section>
  );
}
