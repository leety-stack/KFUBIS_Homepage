import { HashRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import Shell from "./layout/Shell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Menus from "./pages/Menus";
import Banners from "./pages/Banners";
import Popups from "./pages/Popups";
import MainSections from "./pages/MainSections";
import Inbox, { INBOX } from "./pages/Inbox";
import Company from "./pages/Company";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Logins from "./pages/Logins";
import { AuthProvider, useAuth } from "./lib/auth";
import { ForcePwChange } from "./components/PwChange";
import { ToastProvider, Opt } from "./components/ui";
import { BOARDS } from "./boards";
import { ALL_ITEMS, HIDDEN, type MenuKey } from "./menu";

function Page() {
  const { key = "dash" } = useParams();
  const { level } = useAuth();
  const item = ALL_ITEMS.find((i) => i.key === key);
  if (!item || HIDDEN.includes(item.key)) return <Navigate to="/dash" replace />;
  if (level(item.key as MenuKey) <= 0) return <section className="view on"><div className="ph"><div><h1>{item.label}</h1><p>이 메뉴를 볼 권한이 없습니다. 최고 관리자에게 요청하세요.</p></div></div></section>;
  if (key === "dash") return <Dashboard />;
  if (BOARDS[key]) return <Board boardKey={key} />;
  if (INBOX[key]) return <Inbox inboxKey={key} />;
  const P: Record<string, () => React.ReactElement> = { menu: Menus, banner: Banners, popup: Popups, main: MainSections, company: Company, users: Users, roles: Roles, logins: Logins };
  if (P[key]) { const C = P[key]; return <C />; }
  return (
    <section className="view on">
      <div className="ph"><div><h1>{item.label}{item.option && <Opt />}</h1><p>다음 단계에서 만듭니다. 화면 구성은 시안(시안/관리자.html#{key})을 따릅니다.</p></div></div>
    </section>
  );
}

function Gate() {
  const { user } = useAuth();
  if (!user) return <Login />;
  if (user.pw_temp) return <ForcePwChange />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/dash" replace />} />
        <Route path="/:key" element={<Page />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter><Gate /></HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
