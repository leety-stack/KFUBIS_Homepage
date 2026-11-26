import type { FieldDef } from "./components/fields";
import { showDate, type Rec } from "./lib/pb";
import type { MenuKey } from "./menu";

export interface Col { label: string; get: (r: Rec) => string; mobileHide?: boolean }
export interface BoardDef {
  key: MenuKey; collection: string; title: string; desc: string;
  titleField: string; enField?: string; catField: string; cats: string[];
  sort: string; search: string[]; cols: Col[]; fields: FieldDef[];
  badges?: (r: Rec) => string[];
}

const daysLeft = (d?: string) => (d ? Math.ceil((new Date(d.slice(0, 10)).getTime() - Date.now()) / 864e5) : null);

export const BOARDS: Record<string, BoardDef> = {
  works: {
    key: "works", collection: "works", title: "실적 관리", titleField: "name_ko", enField: "name_en", catField: "type",
    desc: '홈페이지 "실적"과 메인 "수행 사례"에 보이는 내용입니다. 사례(과제·수행·결과)를 채운 실적만 사례로 보입니다.',
    cats: ["공공·국가기간", "초고층·복합", "산업·플랜트"], sort: "-year,sort", search: ["name_ko", "name_en", "client"],
    cols: [{ label: "연도", get: (r) => String(r.year || "") }, { label: "프로젝트", get: (r) => r.name_ko }, { label: "유형", get: (r) => r.type, mobileHide: true }, { label: "범위", get: (r) => r.scope, mobileHide: true }],
    badges: (r) => [r.main ? "메인" : ""].filter(Boolean),
    fields: [
      { name: "type", label: "시설 유형", type: "select", options: ["공공·국가기간", "초고층·복합", "산업·플랜트"] },
      { name: "scope", label: "수행 범위", type: "select", options: ["설계", "감리", "설계+감리", "성능위주설계"] },
      { name: "client", label: "발주처명", type: "text" }, { name: "year", label: "수행 연도", type: "year" },
      { name: "name_ko", label: "프로젝트명 (국문)", type: "text", required: true, full: true },
      { name: "name_en", label: "프로젝트명 (영문)", type: "text", full: true, placeholder: "비워 두면 영문 사이트에서 숨김" },
      { name: "task_ko", label: "사례 — 과제 (국문)", type: "text" }, { name: "task_en", label: "사례 — 과제 (영문)", type: "text" },
      { name: "work_ko", label: "사례 — 수행 (국문)", type: "text" }, { name: "work_en", label: "사례 — 수행 (영문)", type: "text" },
      { name: "result_ko", label: "사례 — 결과 (국문)", type: "text" }, { name: "result_en", label: "사례 — 결과 (영문)", type: "text" },
      { name: "image", label: "대표 사진", type: "image" },
      { name: "main", label: '메인 "수행 사례"에 보이기', type: "bool" },
      { name: "client_hidden", label: "발주처명 숨기기 (비공개 실적)", type: "bool" },
    ],
  },
  news: {
    key: "news", collection: "news", title: "소식·보도자료", titleField: "title_ko", enField: "title_en", catField: "cat",
    desc: "새소식·보도자료·수상 소식을 올립니다. 게시일을 미래로 정하면 그날 자동으로 홈페이지에 보입니다.",
    cats: ["새소식", "보도자료", "수상"], sort: "-pinned,-publish_at,-created", search: ["title_ko", "title_en"],
    cols: [{ label: "구분", get: (r) => r.cat }, { label: "제목", get: (r) => r.title_ko }, { label: "게시일", get: (r) => showDate(r.publish_at), mobileHide: true }],
    badges: (r) => [r.pinned ? "상단 고정" : "", r.status === "게시" && r.publish_at && new Date(r.publish_at) > new Date() ? "예약" : ""].filter(Boolean),
    fields: [
      { name: "cat", label: "구분", type: "select", options: ["새소식", "보도자료", "수상"], required: true },
      { name: "publish_at", label: "게시일 (미래 날짜면 그날 자동 게시)", type: "date" },
      { name: "title_ko", label: "제목 (국문)", type: "text", required: true, full: true },
      { name: "title_en", label: "제목 (영문)", type: "text", full: true, placeholder: "비워 두면 영문 사이트에서 숨김" },
      { name: "body_ko", label: "본문 (국문)", type: "editor" }, { name: "body_en", label: "본문 (영문)", type: "editor" },
      { name: "image", label: "대표 사진", type: "image" }, { name: "attachments", label: "첨부 파일 (5개까지)", type: "files", multiple: true },
      { name: "pinned", label: "목록 맨 위에 고정", type: "bool" },
    ],
  },
  rnd: {
    key: "rnd", collection: "rnd", title: "R&D 과제", titleField: "title_ko", enField: "title_en", catField: "state",
    desc: "연구개발 페이지의 수행 과제 목록입니다.", cats: ["수행 중", "완료"], sort: "-start,-created", search: ["title_ko", "title_en", "org"],
    cols: [{ label: "상태", get: (r) => r.state }, { label: "과제명", get: (r) => r.title_ko }, { label: "기간", get: (r) => [showDate(r.start).slice(0, 7), showDate(r.end).slice(0, 7)].filter(Boolean).join(" ~ "), mobileHide: true }],
    fields: [
      { name: "state", label: "상태", type: "select", options: ["수행 중", "완료"] }, { name: "org", label: "발주 기관", type: "text" },
      { name: "start", label: "시작일", type: "date" }, { name: "end", label: "종료일", type: "date" },
      { name: "title_ko", label: "과제명 (국문)", type: "text", required: true, full: true },
      { name: "title_en", label: "과제명 (영문)", type: "text", full: true, placeholder: "비워 두면 영문 사이트에서 숨김" },
      { name: "summary_ko", label: "요약 (국문)", type: "area" }, { name: "summary_en", label: "요약 (영문)", type: "area" },
      { name: "image", label: "대표 사진", type: "image" },
    ],
  },
  certs: {
    key: "certs", collection: "certs", title: "인증·수상·특허", titleField: "name_ko", enField: "name_en", catField: "cat",
    desc: "회사소개 \"인증·수상\"에 쓰입니다. 유효기간을 넣으면 끝나기 30일 전에 대시보드에 알려 줍니다.",
    cats: ["인증", "수상", "특허", "면허"], sort: "cat,-issued,-created", search: ["name_ko", "name_en", "no", "org"],
    cols: [{ label: "구분", get: (r) => r.cat }, { label: "이름", get: (r) => r.name_ko }, { label: "받은 날", get: (r) => showDate(r.issued), mobileHide: true }, { label: "유효기간", get: (r) => showDate(r.expires), mobileHide: true }],
    badges: (r) => { const d = daysLeft(r.expires); return d !== null && d <= 30 ? [d < 0 ? "만료" : "만료 임박"] : []; },
    fields: [
      { name: "cat", label: "구분", type: "select", options: ["인증", "수상", "특허", "면허"], required: true },
      { name: "org", label: "발급 기관", type: "text" }, { name: "no", label: "번호", type: "text" },
      { name: "issued", label: "받은 날", type: "date" }, { name: "expires", label: "유효기간 끝나는 날 (있으면)", type: "date" },
      { name: "name_ko", label: "이름 (국문)", type: "text", required: true, full: true },
      { name: "name_en", label: "이름 (영문)", type: "text", full: true, placeholder: "비워 두면 영문 사이트에서 숨김" },
      { name: "image", label: "증서 이미지", type: "image" },
    ],
  },
  downloads: {
    key: "downloads", collection: "downloads", title: "자료실", titleField: "name_ko", enField: "name_en", catField: "cat",
    desc: '회사소개서·면허 사본 등 내려받는 자료입니다. "요청 후 발송"으로 두면 이름·회사명을 받고 메일로 보냅니다.',
    cats: ["회사소개서", "면허·등록증", "인증서", "카탈로그"], sort: "cat,-created", search: ["name_ko", "name_en"],
    cols: [{ label: "구분", get: (r) => r.cat }, { label: "자료명", get: (r) => r.name_ko }, { label: "공개", get: (r) => r.access || "누구나", mobileHide: true }, { label: "내려받기", get: (r) => String(r.download_count || 0), mobileHide: true }],
    fields: [
      { name: "cat", label: "구분", type: "select", options: ["회사소개서", "면허·등록증", "인증서", "카탈로그"], required: true },
      { name: "access", label: "공개 방식", type: "select", options: ["누구나", "요청 후 발송"] },
      { name: "name_ko", label: "자료명 (국문)", type: "text", required: true, full: true },
      { name: "name_en", label: "자료명 (영문)", type: "text", full: true },
      { name: "file_ko", label: "파일 (국문판)", type: "files" }, { name: "file_en", label: "파일 (영문판)", type: "files" },
    ],
  },
  jobs: {
    key: "jobs", collection: "jobs", title: "채용공고", titleField: "title", catField: "state",
    desc: "인재채용 페이지 공고입니다.", cats: ["모집 중", "마감"], sort: "-created", search: ["title", "part"],
    cols: [{ label: "상태", get: (r) => r.state }, { label: "공고명", get: (r) => r.title }, { label: "부문", get: (r) => r.part, mobileHide: true }, { label: "마감", get: (r) => (r.until_filled ? "채용 시 마감" : showDate(r.due)), mobileHide: true }],
    fields: [
      { name: "part", label: "모집 부문", type: "text" }, { name: "career", label: "경력", type: "select", options: ["신입", "경력 3년 이상", "경력 5년 이상", "무관"] },
      { name: "due", label: "마감일", type: "date" }, { name: "state", label: "상태", type: "select", options: ["모집 중", "마감"] },
      { name: "until_filled", label: "마감일 없이 채용 시 마감", type: "bool" },
      { name: "title", label: "공고명", type: "text", required: true, full: true },
      { name: "body", label: "공고 내용", type: "editor" },
      { name: "online_apply", label: "홈페이지에서 온라인 지원 받기", type: "bool" },
    ],
  },
};
