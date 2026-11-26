import { useCallback, useEffect, useState } from "react";
import { Opt, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, pb, showTime, type Rec } from "../lib/pb";
import { labelOf } from "../menu";

// 바뀐 칸 이름 — 모르는 칸은 그대로 보임
const FL: Record<string, string> = {
  name: "이름", name_ko: "이름(국문)", name_en: "이름(영문)", title: "제목", title_ko: "제목(국문)", title_en: "제목(영문)", label: "이름", key: "문구 키",
  ko: "국문", en: "영문", status: "상태", visible: "노출", sort: "순서", body_ko: "본문(국문)", body_en: "본문(영문)", summary_ko: "요약(국문)", summary_en: "요약(영문)",
  image: "사진", image_mo: "모바일 사진", images: "사진", files: "첨부", file: "첨부", start: "시작", end: "끝", period_from: "시작", period_to: "끝",
  draft: "임시저장 내용", live: "게시 내용", published: "게시 시각", perms: "메뉴별 권한", role: "역할", dept: "부서", tel: "연락처",
  path: "주소", description: "검색 설명", description_en: "검색 설명(영문)", slug: "주소", link_type: "연결 방식", target: "연결할 곳", parent: "상위 메뉴",
  big: "큰 글자", small: "작은 글자", site_name: "사이트 이름", site_url: "홈페이지 주소", og_image: "대표 이미지", naver: "네이버 확인 코드", google: "구글 확인 코드",
  family: "Family Site", dept_emails: "본부 알림 메일", login_rules: "로그인 규칙", pw_temp: "임시 비밀번호", inquiry_scope: "문의 볼 범위",
};
const ACT: Record<string, string> = { 추가: "t-on", 수정: "t-pub", 삭제: "t-new", 되돌리기: "t-wait" };

const show = (v: any, k: string): string => {
  if (v === null || v === undefined || v === "") return "(없음)";
  if (typeof v === "boolean") return v ? (k === "visible" ? "노출" : "예") : (k === "visible" ? "숨김" : "아니요");
  if (Array.isArray(v)) {
    if ((k === "draft" || k === "live") && v.every((b) => b && b.t)) return `블록 ${v.length}개 — ` + v.map((b: any) => (b.h?.ko || b.sub?.ko || b.t)).join(" · ").slice(0, 200);
    return v.length ? v.join(", ").slice(0, 300) : "(없음)";
  }
  if (typeof v === "object") return JSON.stringify(v).slice(0, 300);
  const s = String(v).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) ? showTime(s) : s.length > 300 ? s.slice(0, 300) + "…" : s;
};

export default function History() {
  const { level } = useAuth(); const lv = level("history"); const toast = useToast();
  const [list, setList] = useState<Rec[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [who, setWho] = useState(""); const [menu, setMenu] = useState(""); const [people, setPeople] = useState<string[]>([]); const [menus, setMenus] = useState<string[]>([]);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)); const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = useCallback(async (p = 1) => {
    const f = [pb.filter("created >= {:f} && created <= {:t}", { f: from + " 00:00:00", t: to + " 23:59:59" })];
    if (who) f.push(pb.filter("who_name = {:w}", { w: who }));
    if (menu) f.push(pb.filter("menu = {:m}", { m: menu }));
    const r = await pb.collection("change_log").getList(1, p * 50, { sort: "-created", filter: f.join(" && ") });
    setList(r.items as Rec[]); setTotal(r.totalItems); setPage(p);
  }, [who, menu, from, to]);
  useEffect(() => { load().catch((e) => toast("불러오지 못했습니다 — " + errText(e))); }, [load]); // eslint-disable-line
  useEffect(() => {
    pb.collection("change_log").getList(1, 500, { sort: "-created", fields: "who_name,menu" }).then((r) => {
      setPeople(Array.from(new Set(r.items.map((x: any) => x.who_name).filter(Boolean)))); setMenus(Array.from(new Set(r.items.map((x: any) => x.menu).filter(Boolean))));
    }).catch(() => {});
  }, []);

  const revert = async (h: Rec, force = false) => {
    const what = h.action === "추가" ? "추가한 것을 지웁니다" : h.action === "삭제" ? "지운 것을 다시 만듭니다 (사진·첨부 파일은 복구되지 않음)" : "바꾸기 전 값으로 돌립니다";
    if (!force && !confirm(`"${h.title}" — ${what}. 되돌린 것도 이력에 남습니다. 되돌릴까요?`)) return;
    try {
      const r: any = await pb.send("/api/cms/history/revert", { method: "POST", body: { id: h.id, force } });
      toast(r.files_skipped?.length ? "되돌렸습니다 — 사진·첨부 파일은 다시 올려 주세요" : "되돌렸습니다"); load(page);
    } catch (e: any) {
      if (e?.status === 409 && confirm(e.response.message + "\n\n그래도 되돌릴까요?")) return revert(h, true);
      if (e?.status !== 409) toast(e?.response?.message || errText(e));
    }
  };

  return (
    <section className="view on">
      <div className="ph"><div><h1>변경 이력·되돌리기<Opt /></h1><p>관리자 화면에서 바꾼 것이 모두 남습니다. 잘못 고쳤으면 [되돌리기]로 바꾸기 전으로 돌아갑니다. 접수함(문의·지원)은 각 화면의 처리 기록을 보세요.</p></div></div>
      <section className="panel">
        <div className="panel-hd"><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select style={{ width: "auto" }} value={who} onChange={(e) => setWho(e.target.value)} aria-label="사람"><option value="">모든 사람</option>{people.map((p) => <option key={p}>{p}</option>)}</select>
          <select style={{ width: "auto" }} value={menu} onChange={(e) => setMenu(e.target.value)} aria-label="메뉴"><option value="">모든 메뉴</option>{menus.map((m) => <option key={m} value={m}>{labelOf(m)}</option>)}</select>
          <input type="date" style={{ width: "auto" }} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="이날부터" />
          <input type="date" style={{ width: "auto" }} value={to} onChange={(e) => setTo(e.target.value)} aria-label="이날까지" /></div>
          <span className="help">보관 기간 3년</span></div>
        <ul className="hist2">{list.map((h) => {
          const fields: string[] = h.fields || [];
          const what = h.action === "수정" || h.action === "되돌리기" ? (fields.length ? fields.map((f) => FL[f] || f).join(", ") + (h.action === "되돌리기" ? " 되돌림" : " 수정") : h.action) : h.action;
          return (
            <li key={h.id}>
              <div className="h-r"><span className="sub">{showTime(h.created, true)}</span>
                <span><b>{h.who_name || "—"}</b> · {labelOf(h.menu)}</span>
                <span className="h-w"><span className={"tag " + (ACT[h.action] || "t-off")}>{h.action}</span> "{h.title}" — {what}{h.reverted && <span className="tag t-off" style={{ marginLeft: 6 }}>되돌림</span>}</span>
                <span className="h-b"><button className="btn sm" onClick={() => setOpen({ ...open, [h.id]: !open[h.id] })}>바뀐 내용</button>
                  {lv >= 2 && !h.reverted && h.action !== "되돌리기" && <button className="btn sm" onClick={() => revert(h)}>되돌리기</button>}</span></div>
              <div className={"diff" + (open[h.id] ? " on" : "")}>
                {h.action === "추가" || h.action === "삭제" ? <div style={{ gridColumn: "1/-1" }}><small>{h.action === "추가" ? "추가한 내용" : "삭제한 내용"}</small>
                  {Object.entries((h.after || h.before) || {}).filter(([k, v]) => k !== "id" && v !== "" && v !== null && !(Array.isArray(v) && !v.length)).slice(0, 12).map(([k, v]) => <div key={k} style={{ border: 0, padding: "2px 0" }}><b>{FL[k] || k}</b> {show(v, k)}</div>)}</div>
                  : fields.map((f) => [<div key={f + "b"}><small>{FL[f] || f} — 바꾸기 전</small><del>{show(h.before?.[f], f)}</del></div>, <div key={f + "a"}><small>바꾼 뒤</small><ins>{show(h.after?.[f], f)}</ins></div>])}
              </div>
            </li>);
        })}
          {!list.length && <li className="empty" style={{ padding: 30, textAlign: "center" }}>이 기간에 바뀐 것이 없습니다</li>}</ul>
        <div className="foot"><span className="cnt">{total}건</span>{list.length < total && <button className="btn sm" onClick={() => load(page + 1)}>더 보기</button>}</div>
      </section>
    </section>
  );
}
