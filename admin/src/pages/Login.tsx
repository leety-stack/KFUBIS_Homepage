import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await login(email.trim(), pw); }
    catch (x: any) { setErr(x?.status === 400 ? "메일 주소나 비밀번호가 맞지 않거나, 사용이 중지된 계정입니다." : "로그인하지 못했습니다. 잠시 뒤 다시 시도하세요."); }
    setBusy(false);
  };
  return (
    <div className="login">
      <form className="login-box" onSubmit={submit}>
        <img src="/logo_a.png" alt="한방유비스(주)" />
        <h1>홈페이지 관리자</h1>
        <label>메일 주소<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <label>비밀번호<input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        {err && <p className="login-err" role="alert">{err}</p>}
        <button className="btn navy" disabled={busy}>{busy ? "확인 중…" : "로그인"}</button>
        <p className="help">계정이 없으면 최고 관리자에게 초대를 요청하세요.</p>
      </form>
    </div>
  );
}
