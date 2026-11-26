import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/* ── 알림 ── */
const ToastCtx = createContext<(m: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState(""); const t = useRef<number>(0);
  const show = (m: string) => { setMsg(m); clearTimeout(t.current); t.current = window.setTimeout(() => setMsg(""), 2600); };
  return <ToastCtx.Provider value={show}>{children}<div className={"toast" + (msg ? " on" : "")} role="status">{msg}</div></ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);

/* ── 팝업 ── */
export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="modal on" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="m-box">
        <div className="m-hd"><h2>{title}</h2><button className="m-x" aria-label="닫기" onClick={onClose}>×</button></div>
        <div className="m-bd">{children}</div>
        <div className="m-ft">{footer}</div>
      </div>
    </div>
  );
}

/* ── 켜고 끄기 ── */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <label className="sw" title={label} onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} aria-label={label} /><span /></label>;
}

const TAG: Record<string, string> = { 게시: "t-on", "노출 중": "t-on", 완료: "t-on", 사용: "t-on", "수행 중": "t-on", "모집 중": "t-on", 임시저장: "t-wait", 예약: "t-wait", 숨김: "t-off", 마감: "t-off", 중지: "t-off", "만료 임박": "t-new", 신규: "t-new" };
export const Tag = ({ t }: { t: string }) => <span className={"tag " + (TAG[t] || "t-off")}>{t}</span>;
export const Opt = () => <i className="opt" title="옵션 항목 — 필요 없으면 숨길 수 있음">옵션</i>;
