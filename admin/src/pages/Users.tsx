import { useCallback, useEffect, useState } from "react";
import { Modal, Tag, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, pb, showTime, type Rec } from "../lib/pb";

const DEPTS = ["홍보팀", "설계사업본부", "감리사업본부", "방재연구소", "R&D센터", "방재사업본부", "경영지원팀"];
const locked = (u: Rec) => !!u.locked_until && new Date(u.locked_until.replace(" ", "T")) > new Date();

export default function Users() {
  const { user, level } = useAuth(); const lv = level("users"); const toast = useToast();
  const top = !!user?.expand?.role?.locked;
  const [list, setList] = useState<Rec[]>([]); const [roles, setRoles] = useState<Rec[]>([]);
  const [f, setF] = useState("전체"); const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Rec | null>(null); const [invite, setInvite] = useState(false);

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([pb.collection("users").getFullList({ sort: "status,name", expand: "role" }), pb.collection("roles").getFullList({ sort: "sort" })]);
    setList(u as Rec[]); setRoles(r as Rec[]);
  }, []);
  useEffect(() => { load().catch((e) => toast("불러오지 못했습니다 — " + errText(e))); }, [load]); // eslint-disable-line
  const shown = list.filter((u) => (f === "전체" || (f === "잠김" ? locked(u) : u.status === f)) && (!q || (u.name + u.email + u.dept).includes(q)));
  const api = async (path: string, body: any, ok: string) => {
    try { await pb.send(path, { method: "POST", body }); toast(ok); load(); return true; }
    catch (e: any) { toast(e?.response?.message || errText(e)); return false; }
  };

  return (
    <section className="view on">
      <div className="ph"><div><h1>관리자 계정</h1><p>관리자 화면을 쓰는 직원 계정입니다. 줄을 누르면 고치고, 퇴사·휴직자는 [사용 중지]로 바로 막습니다. 비밀번호는 본인이 메일로 정하므로 관리자도 모릅니다.</p></div>
        {top && <button className="btn navy" onClick={() => setInvite(true)}>+ 관리자 초대</button>}</div>
      <section className="panel">
        <div className="panel-hd"><div className="flt">{["전체", "사용", "중지", "잠김"].map((x) => <button key={x} className={x === f ? "on" : ""} onClick={() => setF(x)}>{x}{x === "잠김" && list.filter(locked).length ? " " + list.filter(locked).length : ""}</button>)}</div>
          <input className="srch" placeholder="이름·메일·부서 검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="tbl"><table className="blist-t">
          <thead><tr><th>이름</th><th className="hide-m">메일</th><th className="hide-m">부서</th><th>역할</th><th className="hide-m">마지막 접속</th><th>상태</th><th className="hide-m" style={{ width: 70 }} /></tr></thead>
          <tbody>{shown.map((u) => (
            <tr key={u.id} onClick={() => setEdit(u)}>
              <td><b>{u.name || "(이름 없음)"}</b>{u.id === user?.id && <span className="tag t-pub" style={{ marginLeft: 6 }}>나</span>}</td>
              <td className="hide-m sub">{u.email}</td><td className="hide-m">{u.dept}</td><td>{u.expand?.role?.name || <span className="sub">역할 없음</span>}</td>
              <td className="hide-m sub">{showTime(u.last_login, true) || "—"}</td>
              <td><Tag t={u.status || "사용"} />{locked(u) && <span className="tag t-new" style={{ marginLeft: 4 }}>잠김</span>}</td>
              <td className="hide-m"><button className="btn sm">{top ? "수정" : "보기"}</button></td>
            </tr>))}
            {!shown.length && <tr><td colSpan={7} className="empty">계정이 없습니다</td></tr>}</tbody>
        </table></div>
        <div className="foot"><span className="cnt">총 {shown.length}명</span><a className="help" href="#/roles" style={{ textDecoration: "underline" }}>역할별로 볼 수 있는 메뉴는 "역할·권한"에서 정합니다</a></div>
      </section>
      {edit && <EditUser u={edit} roles={roles} top={top} lv={lv} me={user!} api={api} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      {invite && <Invite roles={roles} onClose={() => setInvite(false)} onDone={() => { setInvite(false); load(); }} />}
    </section>
  );
}

function EditUser({ u, roles, top, me, api, onClose, onSaved }: { u: Rec; roles: Rec[]; top: boolean; lv: number; me: Rec; api: (p: string, b: any, ok: string) => Promise<boolean>; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ name: u.name || "", dept: u.dept || "", tel: u.tel || "", role: u.role || "", status: u.status || "사용" });
  const set = (k: string, x: string) => setV((p) => ({ ...p, [k]: x }));
  const self = u.id === me.id;
  const save = async () => {
    if (self && (v.status === "중지" || v.role !== u.role)) { toast("자기 계정의 역할·사용 여부는 바꿀 수 없습니다"); return; }
    try { await pb.collection("users").update(u.id, v); toast("저장했습니다"); onSaved(); } catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const del = async () => {
    if (self) return;
    if (!confirm(`"${u.name}" 계정을 삭제할까요? 퇴사자는 삭제 대신 [사용 중지]를 권합니다 — 처리 기록에 이름이 남아야 하기 때문입니다.`)) return;
    try { await pb.collection("users").delete(u.id); toast("삭제했습니다"); onSaved(); } catch (e) { toast("삭제하지 못했습니다 — " + errText(e)); }
  };
  const ro = !top;
  return (
    <Modal title={`관리자 계정 — ${u.name || u.email}`} onClose={onClose}
      footer={<>{top && !self && <button className="btn" style={{ color: "var(--pri)", marginRight: "auto" }} onClick={del}>삭제</button>}
        <button className="btn" style={!(top && !self) ? { marginLeft: "auto" } : undefined} onClick={onClose}>닫기</button>{top && <button className="btn navy" onClick={save}>저장</button>}</>}>
      <div className="grid2">
        <div className="f"><label>이름</label><input value={v.name} disabled={ro} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="f"><label>메일 (아이디)</label><input value={u.email} disabled /></div>
        <div className="f"><label>부서</label><select value={v.dept} disabled={ro} onChange={(e) => set("dept", e.target.value)}><option value="">선택</option>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select><span className="help">"본부 담당"은 이 부서로 배정된 문의만 봅니다</span></div>
        <div className="f"><label>연락처</label><input value={v.tel} disabled={ro} onChange={(e) => set("tel", e.target.value)} /></div>
        <div className="f"><label>역할</label><select value={v.role} disabled={ro || self} onChange={(e) => set("role", e.target.value)}><option value="">역할 없음 (아무 메뉴도 못 봄)</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          <span className="help">{roles.find((r) => r.id === v.role)?.description}</span></div>
        <div className="f"><label>사용 여부</label><div className="seg">{["사용", "중지"].map((x) => <button key={x} type="button" className={v.status === x ? "on" : ""} disabled={ro || self} onClick={() => set("status", x)}>{x === "중지" ? "사용 중지" : "사용"}</button>)}</div>
          <span className="help">중지하면 바로 로그인할 수 없고, 처리 기록은 그대로 남습니다</span></div>
      </div>
      <dl className="info" style={{ marginTop: 16 }}><dt>마지막 접속</dt><dd>{showTime(u.last_login) || "—"}</dd><dt>계정 잠금</dt><dd>{locked(u) ? `잠김 — ${showTime(u.locked_until)}까지` : "없음"}</dd><dt>만든 날</dt><dd>{showTime(u.created)}</dd></dl>
      {top && <div className="f" style={{ marginTop: 10 }}><label>보안</label><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn sm" onClick={() => confirm(`${u.email} 로 비밀번호 재설정 메일을 보낼까요?`) && api("/api/cms/users/reset", { id: u.id }, "비밀번호 재설정 메일을 보냈습니다")}>비밀번호 재설정 메일 보내기</button>
        {locked(u) && <button type="button" className="btn sm" onClick={() => api("/api/cms/users/unlock", { id: u.id }, "잠금을 풀었습니다").then((ok) => ok && onSaved())}>잠금 풀기</button>}
        {!self && <button type="button" className="btn sm" onClick={() => confirm("이 계정을 모든 기기에서 로그아웃시킬까요?") && api("/api/cms/users/logout-all", { id: u.id }, "모든 기기에서 로그아웃시켰습니다")}>모든 기기에서 로그아웃</button>}
      </div></div>}
    </Modal>
  );
}

function Invite({ roles, onClose, onDone }: { roles: Rec[]; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ email: "", name: "", dept: "", tel: "", role: roles.find((r) => r.name === "홍보 담당")?.id || "" });
  const set = (k: string, x: string) => setV((p) => ({ ...p, [k]: x }));
  const send = async () => {
    if (!v.email || !v.name) { toast("이름과 메일을 입력하세요"); return; }
    try {
      const r: any = await pb.send("/api/cms/users/invite", { method: "POST", body: v });
      toast(r.mailed ? `${v.email} 로 초대 메일을 보냈습니다` : r.message); onDone();
    } catch (e: any) { toast(e?.response?.message || errText(e)); }
  };
  return (
    <Modal title="관리자 초대" onClose={onClose} footer={<><button className="btn" style={{ marginLeft: "auto" }} onClick={onClose}>취소</button><button className="btn navy" onClick={send}>초대 메일 보내기</button></>}>
      <div className="grid2">
        <div className="f"><label><i>* </i>이름</label><input value={v.name} onChange={(e) => set("name", e.target.value)} autoFocus /></div>
        <div className="f"><label><i>* </i>회사 메일 (아이디)</label><input type="email" value={v.email} placeholder="name@kfubis.com" onChange={(e) => set("email", e.target.value)} /></div>
        <div className="f"><label>부서</label><select value={v.dept} onChange={(e) => set("dept", e.target.value)}><option value="">선택</option>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="f"><label>역할</label><select value={v.role} onChange={(e) => set("role", e.target.value)}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
      </div>
      <p className="help" style={{ marginTop: 14 }}>초대 메일을 받은 직원이 링크를 눌러 직접 비밀번호를 정합니다(30분 안). 관리자는 비밀번호를 알 수 없습니다.</p>
    </Modal>
  );
}
