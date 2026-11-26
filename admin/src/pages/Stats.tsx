import { useEffect, useRef, useState } from "react";
import { Opt, useToast } from "../components/ui";
import { errText, pb } from "../lib/pb";

interface S {
  from: string; to: string; days: number; visitors: number; views: number; prev: number; en: number; inquiries: number;
  series: { day: string; v: number; pv: number }[]; sources: { name: string; n: number }[]; utms: { name: string; n: number }[];
  pages: { path: string; label: string; n: number; v: number }[]; orgs: { name: string; n: number }[];
}
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

/** 일별 방문자 — 한 계열 선 그래프, 마우스를 올리면 날짜별 값 */
function Line({ x, v, unit, name }: { x: string[]; v: number[]; unit: string; name: string }) {
  const box = useRef<HTMLDivElement>(null); const [W, setW] = useState(800); const [hi, setHi] = useState(-1); const [tip, setTip] = useState({ x: 0, y: 0 });
  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth || 800)); ro.observe(el); return () => ro.disconnect(); }, []);
  const H = 240, P = { l: 40, r: 12, t: 14, b: 26 }, n = v.length, iw = W - P.l - P.r, ih = H - P.t - P.b;
  const top = Math.max(4, ...v) * 1.15;
  const X = (i: number) => P.l + iw * (n === 1 ? 0.5 : i / (n - 1)), Y = (val: number) => P.t + ih - (ih * val) / top;
  const pts = v.map((val, i) => `${X(i)},${Y(val)}`).join(" ");
  const step = Math.ceil(n / 7);
  return (
    <div ref={box} data-chart="" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`${name} — 표로 보기는 아래`}>
        {[0, 1, 2, 3, 4].map((k) => { const val = Math.round((top / 4) * k), y = Y(val); return <g key={k}><line className="gl" x1={P.l} x2={W - P.r} y1={y} y2={y} /><text className="ax" x={P.l - 8} y={y + 4} textAnchor="end">{val.toLocaleString()}</text></g>; })}
        {x.map((lb, i) => (i % step === 0 || i === n - 1) && <text key={i} className="ax" x={X(i)} y={H - 6} textAnchor="middle">{lb}</text>)}
        <polygon className="ar" points={`${P.l},${Y(0)} ${pts} ${X(n - 1)},${Y(0)}`} />
        <polyline className="ln" points={pts} />
        {hi >= 0 && <><line className="xh" x1={X(hi)} x2={X(hi)} y1={P.t} y2={Y(0)} /><circle className="dot" r={4.5} cx={X(hi)} cy={Y(v[hi])} /></>}
        <rect x={P.l} y={P.t} width={iw} height={ih} fill="transparent"
          onMouseMove={(e) => { const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect(); const sx = ((e.clientX - r.left) * W) / r.width; setHi(Math.max(0, Math.min(n - 1, Math.round(((sx - P.l) / iw) * (n - 1))))); setTip({ x: e.clientX, y: e.clientY }); }}
          onMouseLeave={() => setHi(-1)} />
      </svg>
      {hi >= 0 && <div className="ctip" style={{ display: "block", left: tip.x + 12, top: tip.y - 40 }}><small>{x[hi]}</small> <b>{v[hi].toLocaleString()}</b> {unit}</div>}
    </div>
  );
}

function Bars({ items, unit }: { items: { name: string; n: number }[]; unit: string }) {
  if (!items.length) return <p className="help">아직 기록이 없습니다</p>;
  const max = Math.max(...items.map((x) => x.n));
  return <div className="hbars">{items.map((x) => <div key={x.name} className="hb" title={`${x.name} ${x.n.toLocaleString()}${unit}`}><span className="hb-l">{x.name}</span><span className="hb-t"><i style={{ width: `${(x.n / max) * 100}%` }} /></span><span className="hb-v">{x.n.toLocaleString()}{unit}</span></div>)}</div>;
}

export default function Stats() {
  const toast = useToast();
  const [days, setDays] = useState(30); const [s, setS] = useState<S | null>(null);
  useEffect(() => { pb.send(`/api/cms/stats?days=${days}`, {}).then((r) => setS(r as S)).catch((e) => toast("불러오지 못했습니다 — " + errText(e))); }, [days]); // eslint-disable-line

  const csv = () => {
    if (!s) return;
    const rows = [["날짜", "방문자", "페이지뷰"], ...s.series.map((r) => [r.day, r.v, r.pv]), [], ["들어온 곳", "방문자"], ...s.sources.map((r) => [r.name, r.n]), [], ["페이지", "조회", "방문자"], ...s.pages.map((r) => [r.label || r.path, r.n, r.v])];
    const blob = new Blob(["﻿" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `접속통계_${s.from}_${s.to}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const ch = s && s.prev ? Math.round(((s.visitors - s.prev) / s.prev) * 100) : null;

  return (
    <section className="view on">
      <div className="ph"><div><h1>접속 통계<Opt /></h1><p>{s ? `${s.from.replace(/-/g, ".")} ~ ${s.to.slice(5).replace("-", ".")} (${s.days}일)` : "불러오는 중…"} · 홈페이지에 넣은 자체 수집 기능으로 모읍니다</p></div>
        <div style={{ display: "flex", gap: 8 }}><div className="seg">{[7, 30, 90].map((d) => <button key={d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>{d}일</button>)}</div><button className="btn" onClick={csv}>엑셀로 내려받기</button></div></div>
      {s && <>
        <div className="kpis">
          <div className="kpi"><small>방문자</small><b>{s.visitors.toLocaleString()}</b><span style={{ color: ch === null ? undefined : ch >= 0 ? "var(--ok)" : "var(--pri)" }}>{ch === null ? "지난 기간 기록 없음" : `지난 ${s.days}일보다 ${Math.abs(ch)}% ${ch >= 0 ? "늘어남" : "줄어듦"}`}</span></div>
          <div className="kpi"><small>페이지뷰</small><b>{s.views.toLocaleString()}</b><span>방문당 {s.visitors ? (s.views / s.visitors).toFixed(1) : 0}쪽</span></div>
          <div className="kpi"><small>문의 전환</small><b>{pct(s.inquiries, s.visitors)}%</b><span>사업 문의 {s.inquiries}건 / 방문자</span></div>
          <div className="kpi"><small>영문 사이트 방문</small><b>{pct(s.en, s.visitors)}%</b><span>방문자 {s.en.toLocaleString()}명</span></div>
        </div>
        {!s.visitors && <p className="help" style={{ margin: "0 0 14px" }}>아직 모인 기록이 없습니다. 홈페이지를 공개하면 방문할 때마다 쌓입니다.</p>}
        <section className="panel"><div className="panel-hd"><h2>일별 방문자</h2><span className="help">마우스를 올리면 날짜별 값</span></div>
          <div className="panel-bd"><Line name="일별 방문자" x={s.series.map((r) => md(r.day))} v={s.series.map((r) => r.v)} unit="명" /></div></section>
        <div className="row2">
          <section className="panel"><div className="panel-hd"><h2>어디서 들어왔나</h2><span className="help">방문자 수 · 처음 연 페이지 기준</span></div><div className="panel-bd"><Bars items={s.sources} unit="명" /></div></section>
          <section className="panel"><div className="panel-hd"><h2>문의한 기관 유형</h2><span className="help">같은 기간 사업 문의 건수</span></div><div className="panel-bd"><Bars items={s.orgs} unit="건" /></div></section>
        </div>
        {s.utms.length > 0 && <section className="panel"><div className="panel-hd"><h2>홍보 링크별 방문</h2><span className="help">주소 꼬리표(?utm_source=…) 기준</span></div><div className="panel-bd"><Bars items={s.utms} unit="명" /></div></section>}
        <section className="panel"><div className="panel-hd"><h2>많이 본 페이지</h2></div>
          <div className="tbl"><table><thead><tr><th>페이지</th><th className="hide-m">주소</th><th>조회</th><th>방문자</th></tr></thead>
            <tbody>{s.pages.map((r) => <tr key={r.path}><td><b>{r.label || r.path}</b></td><td className="hide-m sub">{r.path}</td><td>{r.n.toLocaleString()}</td><td>{r.v.toLocaleString()}</td></tr>)}
              {!s.pages.length && <tr><td colSpan={4} className="empty">기록이 없습니다</td></tr>}</tbody></table></div></section>
        <section className="panel"><div className="panel-hd"><h2>어떻게 모으나</h2><span className="help">외부 분석 도구 없이 동작</span></div><div className="panel-bd"><ul className="mini-l">
          <li><span><b>들어온 곳</b> — 브라우저가 알려 주는 직전 주소로 네이버·구글·나라장터·링크드인 등을 구분</span></li>
          <li><span><b>홍보 링크</b> — 메일·링크드인·전시회 QR 주소에 꼬리표(?utm_source=전시회)를 붙이면 어느 홍보에서 왔는지 따로 셈</span></li>
          <li><span><b>문의와 연결</b> — 처음 들어온 경로를 문의서에 함께 저장해 "어디서 온 문의인지"를 문의 관리에서 확인</span></li>
          <li><span><b>개인정보</b> — 이름·IP를 저장하지 않음, 검색 로봇 제외, 기록은 400일 뒤 자동 삭제</span></li></ul></div></section>
        <details className="panel tblview"><summary>일별 방문자 표로 보기</summary><div className="tbl"><table><thead><tr><th>날짜</th><th>방문자</th><th>페이지뷰</th></tr></thead>
          <tbody>{s.series.map((r) => <tr key={r.day}><td>{r.day}</td><td>{r.v}명</td><td>{r.pv}</td></tr>)}</tbody></table></div></details>
      </>}
    </section>
  );
}
