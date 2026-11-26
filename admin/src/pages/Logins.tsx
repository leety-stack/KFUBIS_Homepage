import { useCallback, useEffect, useState } from "react";
import { useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, pb, showTime, type Rec } from "../lib/pb";

const device = (ua: string) => {
  if (!ua) return "—";
  const m = /iPhone|Android.+Mobile|Mobile/.test(ua) ? "휴대폰" : /iPad|Android/.test(ua) ? "태블릿" : "PC";
  const b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : /python|curl/i.test(ua) ? "프로그램" : "기타";
  return `${m} · ${b}`;
};

export default function Logins() {
  const { user } = useAuth(); const toast = useToast();
  const top = !!user?.expand?.role?.locked;
  const [list, setList] = useState<Rec[]>([]); const [total, setTotal] = useState(0);
  const [f, setF] = useState("전체"); const [who, setWho] = useState(""); const [from, setFrom] = useState(new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10));
  const [kpi, setKpi] = useState({ today: 0, fail7: 0, locked: 0 });
  const [rules, setRules] = useState({ fail_limit: 5, lock_minutes: 30, idle_minutes: 30 });

  const load = useCallback(async () => {
    const p = [pb.filter("created >= {:d}", { d: from + " 00:00:00" })];
    if (f !== "전체") p.push(`ok = ${f === "성공"}`);
    if (who) p.push(pb.filter("email ~ {:w}", { w: who }));
    const r = await pb.collection("login_logs").getList(1, 200, { sort: "-created", filter: p.join(" && ") });
    setList(r.items as Rec[]); setTotal(r.totalItems);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const t = (await pb.collection("login_logs").getList(1, 1, { filter: pb.filter("ok = true && created >= {:d}", { d: today.toISOString().replace("T", " ") }), fields: "id" })).totalItems;
    const f7 = (await pb.collection("login_logs").getList(1, 1, { filter: pb.filter("ok = false && created >= {:d}", { d: new Date(Date.now() - 7 * 864e5).toISOString().replace("T", " ") }), fields: "id" })).totalItems;
    let lk = 0; try { lk = (await pb.collection("users").getFullList({ fields: "locked_until" })).filter((u: any) => u.locked_until && new Date(u.locked_until.replace(" ", "T")) > new Date()).length; } catch {}
    setKpi({ today: t, fail7: f7, locked: lk });
  }, [f, who, from]);
  useEffect(() => { load().catch((e) => toast(errText(e))); }, [load]); // eslint-disable-line
  useEffect(() => { pb.collection("site_settings").getFirstListItem("id != ''").then((s: any) => s.login_rules && setRules({ fail_limit: s.login_rules.fail_limit ?? 5, lock_minutes: s.login_rules.lock_minutes ?? 30, idle_minutes: s.login_rules.idle_minutes ?? 30 })).catch(() => {}); }, []); // eslint-disable-line

  const saveRules = async () => {
    try { const r: any = await pb.send("/api/cms/login-rules", { method: "POST", body: rules }); setRules(r); toast("로그인 규칙을 저장했습니다"); }
    catch (e: any) { toast(e?.response?.message || errText(e)); }
  };

  return (
    <section className="view on">
      <div className="ph"><div><h1>로그인 기록</h1><p>관리자 로그인 성공·실패가 모두 남습니다. 연속으로 틀리면 계정이 잠기고, 잠긴 계정은 "관리자 계정"에서 풀 수 있습니다.</p></div></div>
      <div className="kpis">
        <div className="kpi"><small>오늘 로그인</small><b>{kpi.today}</b><span>성공</span></div>
        <div className="kpi"><small>실패 (7일)</small><b style={{ color: kpi.fail7 ? "var(--pri)" : undefined }}>{kpi.fail7}</b><span>비밀번호 틀림·없는 계정·중지</span></div>
        <div className="kpi"><small>잠긴 계정</small><b style={{ color: kpi.locked ? "var(--pri)" : undefined }}>{kpi.locked}</b><span><a href="#/users" style={{ textDecoration: "underline" }}>관리자 계정에서 풀기</a></span></div>
        <div className="kpi"><small>자동 로그아웃</small><b>{rules.idle_minutes >= 60 ? rules.idle_minutes / 60 + "시간" : rules.idle_minutes + "분"}</b><span>쓰지 않으면</span></div>
      </div>
      <section className="panel">
        <div className="panel-hd"><div className="flt">{["전체", "성공", "실패"].map((x) => <button key={x} className={x === f ? "on" : ""} onClick={() => setF(x)}>{x}</button>)}</div>
          <div style={{ display: "flex", gap: 8 }}><input className="srch" placeholder="메일 검색" value={who} onChange={(e) => setWho(e.target.value)} /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: "auto" }} aria-label="이날부터" /></div></div>
        <div className="tbl"><table>
          <thead><tr><th>시각</th><th>메일</th><th>결과</th><th className="hide-m">내용</th><th className="hide-m">접속 IP</th><th className="hide-m">기기</th></tr></thead>
          <tbody>{list.map((l) => <tr key={l.id}><td className="sub">{showTime(l.created)}</td><td><b>{l.email}</b></td>
            <td>{l.ok ? <span className="tag t-on">성공</span> : <span className="tag t-new">실패</span>}</td><td className="hide-m">{l.reason}</td><td className="hide-m sub">{l.ip}</td><td className="hide-m sub">{device(l.ua)}</td></tr>)}
            {!list.length && <tr><td colSpan={6} className="empty">기록이 없습니다</td></tr>}</tbody></table></div>
        <div className="foot"><span className="cnt">{total}건{total > 200 ? " (최근 200건 표시)" : ""}</span></div>
      </section>
      <section className="panel"><div className="panel-hd"><h2>로그인 규칙</h2>{top ? <button className="btn sm navy" onClick={saveRules}>저장</button> : <span className="help">최고 관리자만 바꿀 수 있습니다</span>}</div>
        <div className="panel-bd"><div className="grid2">
          <div className="f"><label>연속 실패 시 잠금</label><select value={rules.fail_limit} disabled={!top} onChange={(e) => setRules({ ...rules, fail_limit: Number(e.target.value) })}>{[3, 5, 10].map((n) => <option key={n} value={n}>{n}번 틀리면</option>)}</select></div>
          <div className="f"><label>잠금 시간</label><select value={rules.lock_minutes} disabled={!top} onChange={(e) => setRules({ ...rules, lock_minutes: Number(e.target.value) })}>{[15, 30, 60, 1440].map((n) => <option key={n} value={n}>{n === 1440 ? "하루" : n + "분"}</option>)}</select></div>
          <div className="f"><label>자동 로그아웃</label><select value={rules.idle_minutes} disabled={!top} onChange={(e) => setRules({ ...rules, idle_minutes: Number(e.target.value) })}>{[15, 30, 60, 240].map((n) => <option key={n} value={n}>{n >= 60 ? n / 60 + "시간" : n + "분"} 동안 사용 안 하면</option>)}</select></div>
        </div></div></section>
    </section>
  );
}
