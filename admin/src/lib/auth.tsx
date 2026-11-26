import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { pb, type Rec } from "./pb";
import type { MenuKey } from "../menu";

interface Auth {
  user: Rec | null;
  /** 0 없음 · 1 보기 · 2 수정(임시저장까지) · 3 게시 */
  level: (k: MenuKey) => number;
  login: (email: string, pw: string) => Promise<void>;
  /** 본인 비밀번호 바꾸기 — 바꾸면 기존 로그인이 풀리므로 새 비밀번호로 다시 로그인함 */
  changePw: (oldPw: string, newPw: string) => Promise<void>;
  logout: (why?: string) => void;
  /** 자동 로그아웃 등으로 로그인 화면에 보여 줄 안내 */
  notice: string;
}
const Ctx = createContext<Auth>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Rec | null>(pb.authStore.isValid ? (pb.authStore.record as Rec) : null);

  // 저장된 로그인이 있으면 역할까지 다시 읽음 (권한이 바뀌었을 수 있음)
  useEffect(() => {
    if (!pb.authStore.isValid) return;
    pb.collection("users").authRefresh({ expand: "role" })
      .then((r) => setUser(r.record as Rec))
      .catch(() => { pb.authStore.clear(); setUser(null); });
  }, []);

  const level = (k: MenuKey) => {
    const role = user?.expand?.role;
    if (!role) return 0;
    if (role.locked) return 9;
    return Number(role.perms?.[k] ?? 0);
  };
  const [notice, setNotice] = useState("");
  const login = async (email: string, pw: string) => {
    const r = await pb.collection("users").authWithPassword(email, pw, { expand: "role" });
    setNotice(""); setUser(r.record as Rec);
  };
  const changePw = async (oldPw: string, newPw: string) => {
    const me = user!;
    await pb.collection("users").update(me.id, { oldPassword: oldPw, password: newPw, passwordConfirm: newPw });
    const r = await pb.collection("users").authWithPassword(me.email, newPw, { expand: "role" });
    setUser(r.record as Rec);
  };
  const logout = (why = "") => { pb.authStore.clear(); setUser(null); setNotice(why); };

  // 자동 로그아웃 — 로그인 규칙의 idle_minutes 동안 마우스·키보드 입력이 없으면 (탭 여러 개면 가장 최근 입력 기준)
  useEffect(() => {
    if (!user) return;
    let limit = 30;
    pb.collection("site_settings").getFirstListItem("id != ''").then((s: any) => { if (s.login_rules?.idle_minutes) limit = Number(s.login_rules.idle_minutes); }).catch(() => {});
    const K = "kfubis_admin_active";
    const touch = () => localStorage.setItem(K, String(Date.now()));
    touch();
    const ev = ["mousedown", "keydown", "touchstart", "scroll"];
    let last = 0;
    const on = () => { const n = Date.now(); if (n - last > 5000) { last = n; touch(); } };
    ev.forEach((x) => window.addEventListener(x, on, { passive: true }));
    const t = window.setInterval(() => {
      const a = Number(localStorage.getItem(K) || Date.now());
      if (Date.now() - a > limit * 60000) logout(`${limit >= 60 ? limit / 60 + "시간" : limit + "분"} 동안 사용하지 않아 자동으로 로그아웃했습니다. 다시 로그인하세요.`);
    }, 20000);
    return () => { ev.forEach((x) => window.removeEventListener(x, on)); window.clearInterval(t); };
  }, [user?.id]); // eslint-disable-line

  return <Ctx.Provider value={{ user, level, login, changePw, logout, notice }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
