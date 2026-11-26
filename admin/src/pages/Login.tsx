import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { login, sendOtp, otp, notice } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // 2단계 인증: 비밀번호가 맞으면 mfaId 를 받고, 메일로 받은 6자리 번호를 넣음
  const [mfa, setMfa] = useState<{ mfaId: string; otpId: string } | null>(null);
  const [code, setCode] = useState("");

  const why = (x: any) => {
    const m = String(x?.response?.message || "");
    if (m.includes("잠겼")) return m;
    if (x?.status === 400) return mfa ? "인증번호가 맞지 않거나 시간이 지났습니다. [인증번호 다시 받기]를 누르세요." : "메일 주소나 비밀번호가 맞지 않거나, 사용이 중지된 계정입니다.";
    return "로그인하지 못했습니다. 잠시 뒤 다시 시도하세요.";
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (mfa) await otp(mfa.otpId, code.trim(), mfa.mfaId);
      else {
        const r = await login(email.trim(), pw);
        if (r.mfaId) { const otpId = await sendOtp(email.trim()); setMfa({ mfaId: r.mfaId, otpId }); setCode(""); }
      }
    } catch (x: any) { setErr(why(x)); }
    setBusy(false);
  };
  const resend = async () => {
    if (!mfa) return; setErr("");
    try { setMfa({ ...mfa, otpId: await sendOtp(email.trim()) }); setErr("인증번호를 다시 보냈습니다."); } catch (x) { setErr(why(x)); }
  };
  return (
    <div className="login">
      <form className="login-box" onSubmit={submit}>
        <img src="/logo_a.png" alt="한방유비스(주)" />
        <h1>홈페이지 관리자</h1>
        {notice && !mfa && <p className="login-err" role="status" style={{ background: "#f1f5f9", color: "#334155" }}>{notice}</p>}
        {!mfa ? <>
          <label>메일 주소<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
          <label>비밀번호<input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        </> : <>
          <p className="help" style={{ margin: 0 }}><b>{email}</b> 로 보낸 6자리 인증번호를 넣으세요. (5분 안)</p>
          <label>인증번호<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required autoFocus /></label>
        </>}
        {err && <p className="login-err" role="alert">{err}</p>}
        <button className="btn navy" disabled={busy}>{busy ? "확인 중…" : mfa ? "확인" : "로그인"}</button>
        {mfa ? <p className="help"><a href="#" onClick={(e) => { e.preventDefault(); resend(); }} style={{ textDecoration: "underline" }}>인증번호 다시 받기</a> · <a href="#" onClick={(e) => { e.preventDefault(); setMfa(null); setErr(""); }} style={{ textDecoration: "underline" }}>처음으로</a></p>
          : <p className="help">계정이 없으면 최고 관리자에게 초대를 요청하세요.</p>}
      </form>
    </div>
  );
}
