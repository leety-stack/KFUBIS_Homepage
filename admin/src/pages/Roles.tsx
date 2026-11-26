import { useCallback, useEffect, useState } from "react";
import { Opt, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, pb, type Rec } from "../lib/pb";
import { MENU, type MenuKey } from "../menu";

// 메뉴 성격별 단계: c 콘텐츠(없음·보기·수정·게시), q 접수(없음·보기·처리), a 입사 지원(처리 + 지원서 삭제), v 보기만, h 이력(없음·보기·되돌리기)
const KIND: Partial<Record<MenuKey, "q" | "a" | "v" | "h">> = { dash: "v", inquiry: "q", certreq: "q", apply: "a", stats: "v", logins: "v", history: "h" };
const LV = { c: ["없음", "보기", "수정", "게시"], q: ["없음", "보기", "처리"], a: ["없음", "보기", "처리", "삭제까지"], v: ["없음", "보기"], h: ["없음", "보기", "되돌리기"] };
const cls = (n: number, max: number) => (n === 0 ? 0 : n === max ? 3 : n === 1 ? 1 : 2);

export default function Roles() {
  const { user } = useAuth(); const toast = useToast();
  const top = !!user?.expand?.role?.locked;
  const [roles, setRoles] = useState<Rec[]>([]); const [members, setMembers] = useState<Record<string, number>>({});
  const [cur, setCur] = useState<Rec | null>(null);
  const load = useCallback(async (keep?: string) => {
    const [r, u] = await Promise.all([pb.collection("roles").getFullList({ sort: "sort,created" }), pb.collection("users").getFullList({ fields: "role,status" })]);
    setRoles(r as Rec[]);
    const m: Record<string, number> = {}; (u as Rec[]).forEach((x) => { if (x.status !== "중지") m[x.role] = (m[x.role] || 0) + 1; }); setMembers(m);
    const k = keep ? (r as Rec[]).find((x) => x.id === keep) : (r as Rec[]).find((x) => !x.locked) || r[0];
    setCur(k ? { ...(k as Rec), perms: { ...((k as Rec).perms || {}) } } : null);
  }, []);
  useEffect(() => { load().catch((e) => toast(errText(e))); }, [load]); // eslint-disable-line
  const ro = !top || !!cur?.locked;
  const setP = (k: string, n: number) => setCur((c) => (c ? { ...c, perms: { ...c.perms, [k]: n } } : c));

  const save = async () => {
    if (!cur) return;
    if (!cur.name?.trim()) { toast("역할 이름을 입력하세요"); return; }
    try { await pb.collection("roles").update(cur.id, { name: cur.name, description: cur.description, perms: cur.perms, inquiry_scope: cur.inquiry_scope }); toast("저장했습니다 — 이 역할 사람들은 다음 화면부터 바뀐 권한으로 봅니다"); load(cur.id); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const add = async () => {
    try { const r = await pb.collection("roles").create({ name: `새 역할 ${roles.length}`, description: "", perms: { dash: 1 }, inquiry_scope: "전체", sort: (roles.length + 1) * 10 }); toast("새 역할을 만들었습니다 — 대시보드 보기만 켜져 있습니다"); load(r.id); }
    catch (e) { toast("만들지 못했습니다 — " + errText(e)); }
  };
  const del = async () => {
    if (!cur) return;
    // 화면을 연 뒤 다른 관리자가 계정 역할을 바꿨을 수 있어 지우기 직전에 다시 셈 (중지된 계정도 포함)
    const n = (await pb.collection("users").getList(1, 1, { filter: pb.filter("role = {:r}", { r: cur.id }), fields: "id" })).totalItems;
    if (n) { toast(`이 역할을 쓰는 계정이 ${n}명 있어 지울 수 없습니다 — 먼저 다른 역할로 옮기세요`); load(cur.id); return; }
    if (!confirm(`"${cur.name}" 역할을 삭제할까요?`)) return;
    try { await pb.collection("roles").delete(cur.id); toast("삭제했습니다"); load(); } catch (e) { toast("삭제하지 못했습니다 — " + errText(e)); }
  };

  return (
    <section className="view on">
      <div className="ph"><div><h1>역할·권한</h1><p>역할을 고르고 메뉴마다 할 수 있는 일을 정합니다. 계정에는 역할 하나를 붙입니다. 권한은 서버에서도 똑같이 확인합니다.</p></div>
        {top && <div style={{ display: "flex", gap: 8 }}><button className="btn" onClick={add}>+ 역할 추가</button></div>}</div>
      <div className="rl">
        <section className="panel"><div className="panel-hd"><h2>역할</h2></div>
          <ul className="rlist">{roles.map((r) => (
            <li key={r.id} className={cur?.id === r.id ? "sel" : ""} onClick={() => setCur({ ...r, perms: { ...(r.perms || {}) } })}>
              <b>{r.name}{r.locked && " 🔒"}</b><span className="sub">{r.description}</span><span className="sub">{members[r.id] || 0}명</span></li>))}</ul></section>
        {cur && <section className="panel">
          <div className="panel-hd"><h2>{cur.name} — 메뉴별 권한</h2>
            {cur.locked ? <span className="help">최고 관리자는 모든 권한 — 바꿀 수 없음</span> : top && <div style={{ display: "flex", gap: 6 }}>
              <button className="btn sm" onClick={() => setCur({ ...cur, perms: {} })}>모두 없음</button>
              <button className="btn sm" onClick={() => setCur({ ...cur, perms: Object.fromEntries(MENU.flatMap((g) => g.items).map((i) => [i.key, 1])) })}>모두 보기</button>
              <button className="btn sm" style={{ color: "var(--pri)" }} onClick={del}>삭제</button>
              <button className="btn sm navy" onClick={save}>저장</button></div>}</div>
          <div className="panel-bd" style={{ borderBottom: "1px solid var(--line)" }}><div className="grid2">
            <div className="f"><label>역할 이름</label><input value={cur.name || ""} disabled={ro} onChange={(e) => setCur({ ...cur, name: e.target.value })} /></div>
            <div className="f"><label>문의 볼 범위</label><select value={cur.inquiry_scope || "전체"} disabled={ro} onChange={(e) => setCur({ ...cur, inquiry_scope: e.target.value })}><option>전체</option><option>자기 본부</option></select><span className="help">"자기 본부"면 계정 부서로 배정된 문의만 봄</span></div>
            <div className="f full"><label>설명</label><input value={cur.description || ""} disabled={ro} onChange={(e) => setCur({ ...cur, description: e.target.value })} /></div></div></div>
          <ul className="plist">{MENU.map((g, gi) => [
            <li key={"g" + gi} className="pg">{g.group || "대시보드"}</li>,
            ...g.items.map((i) => {
              const k = KIND[i.key] || "c", L = LV[k], max = L.length - 1;
              const v = cur.locked ? max : Math.min(Number(cur.perms?.[i.key] ?? 0), max);
              return <li key={i.key} className="pr"><span><b>{i.label}</b>{i.option && <Opt />}</span>
                <span className="seg">{L.map((t, n) => <button key={n} type="button" disabled={ro} className={n === v ? "on lvs" + cls(n, max) : ""} onClick={() => setP(i.key, n)}>{t}</button>)}</span></li>;
            })])}</ul>
          <div className="panel-bd help">"수정"은 임시저장까지, "게시"는 홈페이지 반영·노출 켜기까지, "처리"는 상태 변경·메모·답장까지, "되돌리기"는 변경 이력에서 바꾸기 전으로 돌리기까지입니다. 관리자 계정·역할·권한은 최고 관리자만 고칠 수 있습니다.</div>
        </section>}
      </div>
    </section>
  );
}
