import { useState } from "react";
import { useAuth } from "../lib/auth";
import { Modal, useToast } from "./ui";

/** 비밀번호 규칙 — 8자 이상, 영문·숫자 섞기 */
export const pwProblem = (pw: string, again: string, old?: string) =>
  pw.length < 8 ? "새 비밀번호는 8자 이상이어야 합니다"
  : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "영문과 숫자를 섞어 주세요"
  : pw !== again ? "새 비밀번호 두 칸이 서로 다릅니다"
  : old !== undefined && pw === old ? "지금 비밀번호와 다른 비밀번호로 정하세요" : "";

function useChange(onDone: () => void) {
  const { changePw } = useAuth();
  const [v, setV] = useState({ old: "", pw: "", again: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault(); const p = pwProblem(v.pw, v.again, v.old); if (p) { setErr(p); return; }
    setBusy(true); setErr("");
    try { await changePw(v.old, v.pw); onDone(); }
    catch (x: any) { setErr(x?.response?.data?.oldPassword ? "지금 비밀번호가 맞지 않습니다" : "바꾸지 못했습니다 — " + (x?.response?.message || x)); }
    setBusy(false);
  };
  const fields = <>
    <label>지금 비밀번호<input type="password" autoComplete="current-password" value={v.old} onChange={(e) => setV({ ...v, old: e.target.value })} required autoFocus /></label>
    <label>새 비밀번호<input type="password" autoComplete="new-password" value={v.pw} onChange={(e) => setV({ ...v, pw: e.target.value })} required /></label>
    <label>새 비밀번호 한 번 더<input type="password" autoComplete="new-password" value={v.again} onChange={(e) => setV({ ...v, again: e.target.value })} required /></label>
    <p className="help" style={{ margin: 0 }}>8자 이상, 영문과 숫자를 섞어 주세요.</p>
    {err && <p className="login-err" role="alert">{err}</p>}
  </>;
  return { submit, fields, busy };
}

/** 첫 로그인(임시 비밀번호) — 바꾸기 전에는 다른 화면으로 못 감 */
export function ForcePwChange() {
  const { user, logout } = useAuth();
  const { submit, fields, busy } = useChange(() => {});
  return (
    <div className="login">
      <form className="login-box" onSubmit={submit}>
        <img src="/logo_a.png" alt="한방유비스(주)" />
        <h1>비밀번호 바꾸기</h1>
        <p className="help" style={{ margin: 0 }}><b>{user?.name || user?.email}</b> 님, 관리자가 정해 준 임시 비밀번호로 로그인했습니다. 본인만 아는 비밀번호로 바꾼 뒤 사용하세요.</p>
        {fields}
        <button className="btn navy" disabled={busy}>{busy ? "바꾸는 중…" : "바꾸고 시작하기"}</button>
        <p className="help"><a href="#" onClick={(e) => { e.preventDefault(); logout(); }} style={{ textDecoration: "underline" }}>로그아웃</a></p>
      </form>
    </div>
  );
}

/** 머리 줄 [비밀번호 변경] 팝업 */
export function PwChangeModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { submit, fields, busy } = useChange(() => { toast("비밀번호를 바꿨습니다 — 다른 기기의 로그인은 풀립니다"); onClose(); });
  return (
    <Modal title="비밀번호 변경" onClose={onClose} footer={<><button className="btn" style={{ marginLeft: "auto" }} onClick={onClose}>취소</button><button className="btn navy" disabled={busy} onClick={() => submit()}>바꾸기</button></>}>
      <form className="pwform" onSubmit={submit}>{fields}<button hidden /></form>
    </Modal>
  );
}
