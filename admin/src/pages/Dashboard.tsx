import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tag } from "../components/ui";
import { useAuth } from "../lib/auth";
import { pb, showDate, type Rec } from "../lib/pb";
import { BOARDS } from "../boards";

interface Recent { key: string; title: string; status: string; updated: string }

export default function Dashboard() {
  const { level } = useAuth();
  const [counts, setCounts] = useState<Record<string, { all: number; draft: number }>>({});
  const [noEn, setNoEn] = useState(0);
  const [expiring, setExpiring] = useState<Rec[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    (async () => {
      const keys = Object.keys(BOARDS).filter((k) => level(BOARDS[k].key) > 0);
      const c: Record<string, { all: number; draft: number }> = {}; let en = 0; const rec: Recent[] = [];
      for (const k of keys) {
        const B = BOARDS[k], col = pb.collection(B.collection);
        const all = await col.getList(1, 1, { fields: "id" });
        const draft = await col.getList(1, 1, { filter: 'status = "임시저장"', fields: "id" });
        c[k] = { all: all.totalItems, draft: draft.totalItems };
        if (B.enField) en += (await col.getList(1, 1, { filter: `${B.enField} = ""`, fields: "id" })).totalItems;
        const latest = await col.getList(1, 3, { sort: "-updated" });
        latest.items.forEach((r: any) => rec.push({ key: k, title: r[B.titleField], status: r.status, updated: r.updated }));
      }
      setCounts(c); setNoEn(en);
      setRecent(rec.sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6));
      if (level("certs") > 0) {
        const lim = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
        const ex = await pb.collection("certs").getFullList({ filter: `expires != "" && expires <= "${lim} 23:59:59"`, sort: "expires" });
        setExpiring(ex as Rec[]);
      }
    })().catch(() => {});
  }, []); // eslint-disable-line

  const drafts = Object.values(counts).reduce((a, b) => a + b.draft, 0);
  const total = Object.values(counts).reduce((a, b) => a + b.all, 0);
  const today = new Date();
  return (
    <section className="view on">
      <div className="ph"><div><h1>대시보드</h1><p>{today.getFullYear()}.{String(today.getMonth() + 1).padStart(2, "0")}.{String(today.getDate()).padStart(2, "0")} 기준 — 처리할 일과 홈페이지 현황</p></div></div>
      <div className="kpis">
        <div className="kpi"><small>등록된 글 (게시판 전체)</small><b>{total}</b><span>실적 {counts.works?.all ?? 0} · 소식 {counts.news?.all ?? 0} · 인증 {counts.certs?.all ?? 0}</span></div>
        <div className="kpi"><small>게시 대기 (임시저장)</small><b style={{ color: drafts ? "var(--warn)" : undefined }}>{drafts}</b><span>게시 권한자가 확인 후 게시</span></div>
        <div className="kpi"><small>영문 미입력</small><b style={{ color: noEn ? "var(--warn)" : undefined }}>{noEn}</b><span>영문 사이트에서 숨겨짐</span></div>
        <div className="kpi"><small>유효기간 임박 인증</small><b style={{ color: expiring.length ? "var(--pri)" : undefined }}>{expiring.length}</b><span>30일 안에 끝남</span></div>
      </div>
      <div className="row2">
        <section className="panel"><div className="panel-hd"><h2>처리할 일</h2></div><ul className="todo">
          {expiring.map((r) => <li key={r.id}><Link to="/certs"><Tag t="만료 임박" /> 인증 "{r.name_ko}" 유효기간 {showDate(r.expires)}</Link></li>)}
          {Object.entries(counts).filter(([, v]) => v.draft).map(([k, v]) => <li key={k}><Link to={"/" + k}><Tag t="임시저장" /> {BOARDS[k].title} {v.draft}건 게시 전</Link></li>)}
          {noEn > 0 && <li><span className="tag t-wait">확인 필요</span> 영문 미입력 {noEn}건</li>}
          {!expiring.length && !drafts && !noEn && <li className="sub">처리할 일이 없습니다</li>}
        </ul></section>
        <section className="panel"><div className="panel-hd"><h2>최근 바뀐 글</h2></div><ul className="todo">
          {recent.map((r, i) => <li key={i}><span className="sub" style={{ minWidth: 86 }}>{showDate(r.updated).slice(5)}</span><Link to={"/" + r.key}><b>{BOARDS[r.key].title}</b> — {r.title} <Tag t={r.status} /></Link></li>)}
          {!recent.length && <li className="sub">아직 없습니다</li>}
        </ul></section>
      </div>
    </section>
  );
}
