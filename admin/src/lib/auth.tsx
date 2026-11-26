import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { pb, type Rec } from "./pb";
import type { MenuKey } from "../menu";

interface Auth {
  user: Rec | null;
  /** 0 없음 · 1 보기 · 2 수정(임시저장까지) · 3 게시 */
  level: (k: MenuKey) => number;
  login: (email: string, pw: string) => Promise<void>;
  logout: () => void;
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
  const login = async (email: string, pw: string) => {
    const r = await pb.collection("users").authWithPassword(email, pw, { expand: "role" });
    setUser(r.record as Rec);
  };
  const logout = () => { pb.authStore.clear(); setUser(null); };
  return <Ctx.Provider value={{ user, level, login, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
