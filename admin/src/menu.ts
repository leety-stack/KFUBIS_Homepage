// 관리자 메뉴 — 키는 server/pb_migrations/1764200001_seed.js 의 MENUS 와 같아야 함
export type MenuKey =
  | "dash" | "main" | "banner" | "menu" | "page" | "popup"
  | "works" | "news" | "rnd" | "certs" | "downloads" | "jobs"
  | "inquiry" | "certreq" | "apply"
  | "company" | "i18n" | "seo" | "stats" | "history"
  | "users" | "roles" | "logins";

export interface MenuItem { key: MenuKey; label: string; option?: boolean; ready?: boolean }
export interface MenuGroup { group?: string; items: MenuItem[] }

/** option: 숨길 수 있는 옵션 기능(노란 표시), ready: 이번 단계에서 동작 */
export const MENU: MenuGroup[] = [
  { items: [{ key: "dash", label: "대시보드", ready: true }] },
  { group: "사이트 구성", items: [
    { key: "main", label: "메인 화면 구성", ready: true }, { key: "banner", label: "메인 배너", ready: true }, { key: "menu", label: "메뉴 관리", ready: true },
    { key: "page", label: "페이지 편집", option: true, ready: true }, { key: "popup", label: "팝업", ready: true }] },
  { group: "게시판·콘텐츠", items: [
    { key: "works", label: "실적 관리", ready: true }, { key: "news", label: "소식·보도자료", ready: true }, { key: "rnd", label: "R&D 과제", ready: true },
    { key: "certs", label: "인증·수상·특허", ready: true }, { key: "downloads", label: "자료실", ready: true }, { key: "jobs", label: "채용공고", ready: true }] },
  { group: "고객", items: [{ key: "inquiry", label: "문의 관리", ready: true }, { key: "certreq", label: "실적증명 요청", ready: true }, { key: "apply", label: "입사 지원", ready: true }] },
  { group: "설정", items: [
    { key: "company", label: "회사 정보·하단 문구", ready: true }, { key: "i18n", label: "다국어 문구", ready: true },
    { key: "seo", label: "검색 노출 (SEO)", option: true, ready: true }, { key: "stats", label: "접속 통계", option: true, ready: true }, { key: "history", label: "변경 이력·되돌리기", option: true, ready: true }] },
  { group: "관리자", items: [{ key: "users", label: "관리자 계정", ready: true }, { key: "roles", label: "역할·권한", ready: true }, { key: "logins", label: "로그인 기록", ready: true }] },
];

/** 옵션 기능 숨김 — 담당자가 숨기려면 여기에 키를 넣는다 (예: ["page", "seo", "stats", "history"]) */
export const HIDDEN: MenuKey[] = [];

export const ALL_ITEMS = MENU.flatMap((g) => g.items);
export const labelOf = (k: string) => ALL_ITEMS.find((i) => i.key === k)?.label ?? k;
