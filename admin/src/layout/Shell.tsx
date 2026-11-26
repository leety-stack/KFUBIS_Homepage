import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HIDDEN, MENU, ALL_ITEMS } from "../menu";
import { useAuth } from "../lib/auth";
import { Opt } from "../components/ui";
import { PwChangeModal } from "../components/PwChange";

export default function Shell({ children }: { children: ReactNode }) {
  const { user, level, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const loc = useLocation();
  const cur = ALL_ITEMS.find((i) => "/" + i.key === loc.pathname) ?? ALL_ITEMS[0];
  const role = user?.expand?.role;

  return (
    <>
      <div className="app">
        <aside id="side" className={open ? "open" : ""}>
          <NavLink className="brand" to="/dash" onClick={() => setOpen(false)}><img src="/logo_w.png" alt="한방유비스(주)" /><small>홈페이지 관리자</small></NavLink>
          {MENU.map((g, gi) => {
            const items = g.items.filter((i) => !HIDDEN.includes(i.key) && level(i.key) > 0);
            if (!items.length) return null;
            return (
              <div key={gi}>
                {g.group && <div className="grp">{g.group}</div>}
                {items.map((i) => (
                  <NavLink key={i.key} to={"/" + i.key} className={({ isActive }) => (isActive ? "on" : "")} onClick={() => setOpen(false)}>
                    <span>{i.label}</span>{i.option && <Opt />}{!i.ready && <em className="soon" title="다음 단계에서 만듭니다">준비</em>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </aside>
        <main>
          <div className="top">
            <button className="menu" aria-label="메뉴" onClick={() => setOpen(!open)}>☰</button>
            <img className="tlogo" src="/logo_a.png" alt="한방유비스(주)" />
            <strong id="ttl">{cur.label}{cur.option && <Opt />}</strong>
            <div className="r">
              <span className="hide-m">{user?.dept ? user.dept + " " : ""}{user?.name} ({role?.name ?? "역할 없음"})</span>
              <button className="btn sm" onClick={() => setPwOpen(true)}>비밀번호 변경</button>
              <button className="btn sm" onClick={() => logout()}>로그아웃</button>
            </div>
          </div>
          <div className="content">{children}</div>
        </main>
      </div>
      {pwOpen && <PwChangeModal onClose={() => setPwOpen(false)} />}
    </>
  );
}
