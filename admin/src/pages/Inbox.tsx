import { Fragment, useCallback, useEffect, useState } from "react";
import { Modal, Tag, useToast } from "../components/ui";
import { useAuth } from "../lib/auth";
import { errText, pb, showDate, showTime, type Rec } from "../lib/pb";
import type { MenuKey } from "../menu";

const DEPTS = ["설계사업본부", "감리사업본부", "방재연구소", "R&D센터", "경영지원팀"];
interface Def {
  key: MenuKey; col: string; title: string; desc: string; states: string[]; expand?: string;
  line: (r: Rec) => string; info: (r: Rec) => [string, string][]; files: string[]; search: string[];
  tpl: { name: string; subject: string; body: (r: Rec, me: string) => string }[];
  csv: [string, (r: Rec) => string][];
}
const sign = (me: string) => `\n\n한방유비스(주) ${me}\nTEL 02-2023-5000`;
export const INBOX: Record<string, Def> = {
  inquiry: {
    key: "inquiry", col: "inquiries", title: "문의 관리", states: ["신규", "처리 중", "완료"], files: ["attachments"], search: ["org", "name", "message"],
    desc: "홈페이지 사업 문의입니다. 문의 분야에 따라 담당 본부가 자동으로 정해지고 본부 메일로 알림이 갑니다. 1영업일이 지나도 신규면 관리자에게 다시 알립니다.",
    line: (r) => `${r.field || "기타"} · ${r.org_type || ""}${r.lang === "en" ? " · 영문" : ""}`,
    info: (r) => [["기관 유형", r.org_type], ["담당자", `${r.name}${r.position ? " " + r.position : ""}`], ["연락처", r.tel], ["메일", r.email], ["문의 분야", r.field], ["받은 시각", showTime(r.created)], ["들어온 경로", r.source || "—"]],
    tpl: [
      { name: "기본 회신 (담당자 연결 안내)", subject: "[한방유비스] 문의 주셔서 감사합니다", body: (r, me) => `${r.name}님, 안녕하세요. 한방유비스입니다.\n문의 주신 내용은 ${r.dept}에서 검토 후 연락드리겠습니다.\n확인 부탁드립니다.${sign(me)}` },
      { name: "RFP 접수 확인", subject: "[한방유비스] 제안요청서 접수 확인", body: (r, me) => `${r.name}님, 안녕하세요.\n보내 주신 제안요청서를 잘 받았습니다. 검토 후 일정에 맞춰 회신드리겠습니다.\n감사합니다.${sign(me)}` },
      { name: "English — general reply", subject: "[Hanbang UBIS] Thank you for your inquiry", body: (r) => `Dear ${r.name},\n\nThank you for contacting Hanbang UBIS. Our team will review your inquiry and get back to you shortly.\n\nBest regards,\nHanbang UBIS Co., Ltd.` },
    ],
    csv: [["받은 시각", (r) => showTime(r.created)], ["상태", (r) => r.status], ["담당 본부", (r) => r.dept], ["기관", (r) => r.org], ["기관 유형", (r) => r.org_type], ["이름", (r) => r.name], ["연락처", (r) => r.tel], ["메일", (r) => r.email], ["분야", (r) => r.field], ["내용", (r) => r.message]],
  },
  certreq: {
    key: "certreq", col: "certreqs", title: "실적증명 요청", states: ["신규", "처리 중", "발급 완료"], files: [], search: ["org", "name", "project"],
    desc: "발주처가 입찰·등록용 실적증명서를 요청한 건입니다. 발급한 PDF를 올리고 [첨부해서 보내기]를 누르면 요청자 메일로 갑니다.",
    line: (r) => r.project,
    info: (r) => [["요청 실적", r.project], ["용도", r.purpose || "—"], ["요청자", r.name], ["연락처", r.tel], ["메일", r.email], ["받은 시각", showTime(r.created)]],
    tpl: [
      { name: "실적증명서 발급 안내", subject: "[한방유비스] 실적증명서 발급", body: (r, me) => `${r.name}님, 안녕하세요. 한방유비스입니다.\n요청하신 "${r.project}" 실적증명서를 첨부해 드립니다.\n확인 부탁드립니다.${sign(me)}` },
      { name: "추가 서류 요청", subject: "[한방유비스] 실적증명 발급을 위한 확인 요청", body: (r, me) => `${r.name}님, 안녕하세요.\n실적증명서 발급을 위해 아래 내용 확인 부탁드립니다.\n- \n감사합니다.${sign(me)}` },
    ],
    csv: [["받은 시각", (r) => showTime(r.created)], ["상태", (r) => r.status], ["기관", (r) => r.org], ["요청자", (r) => r.name], ["연락처", (r) => r.tel], ["메일", (r) => r.email], ["요청 실적", (r) => r.project], ["용도", (r) => r.purpose]],
  },
  apply: {
    key: "apply", col: "applications", title: "입사 지원", states: ["신규", "서류 검토", "면접", "합격", "불합격"], expand: "job", files: ["resume"], search: ["name", "email", "career"],
    desc: "홈페이지 온라인 지원서입니다. 개인정보 보관 기한(접수 후 180일)이 지나면 매일 아침 자동으로 지워집니다.",
    line: (r) => `${r.expand?.job?.title || "공고 삭제됨"}${r.career ? " · " + r.career : ""}`,
    info: (r) => [["지원 공고", r.expand?.job?.title || "—"], ["경력", r.career || "—"], ["연락처", r.tel], ["메일", r.email], ["받은 시각", showTime(r.created)], ["개인정보 삭제 예정", showDate(r.delete_after)]],
    tpl: [
      { name: "서류 접수 확인", subject: "[한방유비스] 입사 지원서 접수 확인", body: (r, me) => `${r.name}님, 안녕하세요. 한방유비스입니다.\n지원서를 잘 받았습니다. 서류 검토 후 결과를 알려 드리겠습니다.\n감사합니다.${sign(me)}` },
      { name: "면접 안내", subject: "[한방유비스] 면접 안내", body: (r, me) => `${r.name}님, 안녕하세요.\n서류 전형 결과 면접 대상이 되셨습니다.\n- 일시: \n- 장소: 서울특별시 성동구 성수일로 77 서울숲IT밸리 9층\n확인 부탁드립니다.${sign(me)}` },
      { name: "불합격 안내", subject: "[한방유비스] 전형 결과 안내", body: (r, me) => `${r.name}님, 안녕하세요.\n한방유비스에 관심 가져 주셔서 감사합니다. 아쉽게도 이번에는 함께하지 못하게 되었습니다.\n앞날에 좋은 일이 있기를 바랍니다.${sign(me)}` },
    ],
    csv: [["받은 시각", (r) => showTime(r.created)], ["상태", (r) => r.status], ["공고", (r) => r.expand?.job?.title], ["이름", (r) => r.name], ["연락처", (r) => r.tel], ["메일", (r) => r.email], ["경력", (r) => r.career]],
  },
};

const readArr = (v: any): any[] => (Array.isArray(v) ? v : []);

export default function Inbox({ inboxKey }: { inboxKey: string }) {
  const D = INBOX[inboxKey];
  const { user, level } = useAuth(); const lv = level(D.key); const toast = useToast();
  const me = user?.name || user?.email || "";
  const top = !!user?.expand?.role?.locked;
  const [st, setSt] = useState("전체"); const [q, setQ] = useState("");
  const [list, setList] = useState<Rec[]>([]); const [cur, setCur] = useState<Rec | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ftoken, setFtoken] = useState("");
  const [memo, setMemo] = useState(""); const [tpl, setTpl] = useState(0);
  const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const filter = useCallback(() => {
    const p: string[] = [];
    if (st !== "전체") p.push(pb.filter("status = {:s}", { s: st }));
    if (q.trim()) p.push("(" + D.search.map((f) => pb.filter(`${f} ~ {:q}`, { q: q.trim() })).join(" || ") + ")");
    return p.join(" && ");
  }, [st, q, D]);
  const load = useCallback(async (keep?: string) => {
    try {
      const r = (await pb.collection(D.col).getList(1, 200, { sort: "-created", filter: filter(), expand: D.expand })).items as Rec[];
      setList(r);
      const c: Record<string, number> = {};
      for (const s of D.states) c[s] = (await pb.collection(D.col).getList(1, 1, { filter: pb.filter("status = {:s}", { s }), fields: "id" })).totalItems;
      setCounts(c);
      if (keep) { const n = r.find((x) => x.id === keep) || ((await pb.collection(D.col).getOne(keep, { expand: D.expand })) as Rec); setCur(n); }
    } catch (e) { toast("목록을 불러오지 못했습니다 — " + errText(e)); }
  }, [D, filter]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  useEffect(() => { pb.files.getToken().then(setFtoken).catch(() => {}); }, []);
  useEffect(() => { setSt("전체"); setQ(""); }, [inboxKey]);

  const select = (r: Rec | null) => {
    setCur(r); setMemo("");
    if (r) { setTpl(0); setSubject(D.tpl[0].subject); setBody(D.tpl[0].body(r, me)); }
  };
  const logEntry = (text: string) => ({ at: new Date().toISOString(), by: me, text });
  const patch = async (data: Record<string, any>, msg: string) => {
    if (!cur) return;
    try { await pb.collection(D.col).update(cur.id, data); toast(msg); await load(cur.id); }
    catch (e) { toast("저장하지 못했습니다 — " + errText(e)); }
  };
  const setStatus = (s: string) => patch({ status: s, log: [...readArr(cur!.log), logEntry(`상태를 "${s}"(으)로 변경`)] }, `상태를 "${s}"(으)로 바꿨습니다`);
  const setDept = (d: string) => { setBody(D.tpl[tpl].body({ ...cur!, dept: d } as Rec, me)); patch({ dept: d, log: [...readArr(cur!.log), logEntry(`담당 본부를 ${d}(으)로 변경`)] }, `${d}(으)로 넘겼습니다`); };
  const addMemo = () => { if (!memo.trim()) return; patch({ memos: [...readArr(cur!.memos), logEntry(memo.trim())] }, "메모를 남겼습니다").then(() => setMemo("")); };
  const upload = async (f?: File) => {
    if (!cur || !f) return;
    try { await pb.collection(D.col).update(cur.id, { issued_file: f, log: [...readArr(cur.log), logEntry(`실적증명서 올림 (${f.name})`)] }); toast("실적증명서를 올렸습니다"); await load(cur.id); }
    catch (e) { toast("올리지 못했습니다 — " + errText(e)); }
  };
  const send = async (attach = false) => {
    if (!cur) return;
    if (!subject.trim() || !body.trim()) { toast("제목과 내용을 입력하세요"); return; }
    if (!confirm(`${cur.email} 로 메일을 보낼까요?`)) return;
    setBusy(true);
    const next = D.key === "certreq" && attach ? "발급 완료" : cur.status === "신규" ? D.states[1] : undefined;
    try { await pb.send("/api/cms/reply", { method: "POST", body: { collection: D.col, id: cur.id, subject, body, status: next, attach } }); toast(`${cur.email} 로 메일을 보냈습니다`); await load(cur.id); }
    catch (e: any) { toast(e?.response?.message || "보내지 못했습니다 — " + errText(e)); }
    setBusy(false);
  };
  const del = async () => {
    if (!cur || !confirm(`"${cur.org || cur.name}" 접수 건을 삭제할까요? 되살릴 수 없습니다.`)) return;
    try { await pb.collection(D.col).delete(cur.id); toast("삭제했습니다"); setCur(null); load(""); } catch (e) { toast("삭제하지 못했습니다 — " + errText(e)); }
  };
  const exportCsv = async () => {
    const all = (await pb.collection(D.col).getFullList({ sort: "-created", filter: filter(), expand: D.expand })) as Rec[];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "﻿" + [D.csv.map((c) => esc(c[0])).join(","), ...all.map((r) => D.csv.map((c) => esc(c[1](r))).join(","))].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${D.title}_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  const fileLink = (r: Rec, _f: string, name: string) => pb.files.getURL(r, name, { token: ftoken });

  return (
    <section className="view on">
      <div className="ph"><div><h1>{D.title}</h1><p>{D.desc}</p></div><button className="btn" onClick={exportCsv}>엑셀로 내려받기</button></div>
      <section className="panel">
        <div className="panel-hd"><div className="flt">{["전체", ...D.states].map((s) => <button key={s} className={s === st ? "on" : ""} onClick={() => setSt(s)}>{s}{s !== "전체" && counts[s] ? ` ${counts[s]}` : ""}</button>)}</div>
          <input className="srch" placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="tbl"><table className="blist-t">
          <thead><tr><th style={{ width: 56 }}>번호</th><th style={{ width: 120 }}>받은 시각</th><th>{D.key === "apply" ? "지원자" : "기관"}</th><th className="hide-m">{D.key === "inquiry" ? "분야" : D.key === "certreq" ? "요청 실적" : "공고"}</th>{D.key === "inquiry" && <th className="hide-m">담당 본부</th>}<th style={{ width: 96 }}>상태</th><th className="hide-m" style={{ width: 70 }} /></tr></thead>
          <tbody>{list.map((r, i) => (
            <tr key={r.id} onClick={() => select(r)}>
              <td className="sub">{list.length - i}</td><td className="sub">{showTime(r.created, true)}</td>
              <td><b>{r.org || r.name}</b>{r.org && r.name ? <span className="sub"> · {r.name}</span> : null}{readArr(r.memos).length > 0 && <span className="tag t-wait" style={{ marginLeft: 6 }}>메모 {readArr(r.memos).length}</span>}</td>
              <td className="hide-m">{D.line(r)}</td>{D.key === "inquiry" && <td className="hide-m">{r.dept}</td>}
              <td><Tag t={r.status} /></td><td className="hide-m"><button className="btn sm">{lv >= 2 ? "처리" : "보기"}</button></td>
            </tr>))}
            {!list.length && <tr><td colSpan={7} className="empty">접수된 건이 없습니다</td></tr>}</tbody>
        </table></div>
        <div className="foot"><span className="cnt">총 {list.length}건</span><span className="help">줄을 누르면 팝업에서 처리합니다</span></div>
      </section>
      {cur && <Modal title={`${D.title} — ${cur.org || cur.name}`} onClose={() => setCur(null)}
        footer={<>
          {(top || (D.key === "apply" && lv >= 3)) && <button className="btn" style={{ color: "var(--pri)", marginRight: "auto" }} onClick={del}>삭제</button>}
          <button className="btn" style={!(top || (D.key === "apply" && lv >= 3)) ? { marginLeft: "auto" } : undefined} onClick={() => setCur(null)}>닫기</button>
        </>}>
        <div className="ibar">
          <label>상태 <select value={cur.status} disabled={lv < 2} onChange={(e) => setStatus(e.target.value)}>{D.states.map((s) => <option key={s}>{s}</option>)}</select></label>
          {D.key === "inquiry" && <label>담당 본부 <select value={cur.dept} disabled={lv < 2} onChange={(e) => setDept(e.target.value)}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></label>}
        </div>
        <dl className="info">{D.info(cur).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v || "—"}</dd></Fragment>)}</dl>
        {cur.message && <div className="msg">{cur.message}</div>}
        {D.files.flatMap((f) => readArr(Array.isArray(cur[f]) ? cur[f] : cur[f] ? [cur[f]] : []).map((n: string) => <a key={n} className="att" href={fileLink(cur, f, n)} target="_blank" rel="noreferrer">📎 {n.replace(/_[a-z0-9]{10}(\.\w+)$/i, "$1")}</a>))}
        {D.key === "certreq" && <div className="f" style={{ marginTop: 14 }}><label>발급한 실적증명서</label>
          {cur.issued_file ? <a className="att" href={fileLink(cur, "issued_file", cur.issued_file)} target="_blank" rel="noreferrer">📎 {cur.issued_file.replace(/_[a-z0-9]{10}(\.\w+)$/i, "$1")}</a> : <span className="help">아직 없음</span>}
          {lv >= 2 && <label className="drop" style={{ cursor: "pointer" }}>PDF를 눌러서 올리기<input type="file" accept="application/pdf" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>}</div>}
        <div className="tl"><b>처리 기록</b><ul>{readArr(cur.log).map((l, i) => <li key={i}><span>{showTime(l.at, true)}</span>{l.by} — {l.text}</li>)}</ul></div>
        <div className="f" style={{ marginTop: 14 }}><label>내부 메모 (홈페이지·고객에게 안 보임)</label>
          {readArr(cur.memos).map((m, i) => <div key={i} className="memo"><b>{m.by}</b> <span className="sub">{showTime(m.at, true)}</span><div>{m.text}</div></div>)}
          {lv >= 2 && <div style={{ display: "flex", gap: 6 }}><input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 12/2 현장설명회 참석 — 감리본부 이○○" onKeyDown={(e) => e.key === "Enter" && addMemo()} /><button className="btn" onClick={addMemo}>남기기</button></div>}</div>
        {lv >= 2 && <div className="reply">
          <div className="f"><label>답장 메일 — 받는 사람 {cur.email || "(메일 없음)"}</label>
            <select value={tpl} onChange={(e) => { const i = Number(e.target.value); setTpl(i); setSubject(D.tpl[i].subject); setBody(D.tpl[i].body(cur, me)); }}>{D.tpl.map((t, i) => <option key={i} value={i}>{t.name}</option>)}</select></div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="제목" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="내용" />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {D.key === "certreq" && <button className="btn" disabled={busy || !cur.issued_file} onClick={() => send(true)} title={cur.issued_file ? "" : "실적증명서를 먼저 올리세요"}>첨부해서 보내기</button>}
            <button className="btn navy" disabled={busy || !cur.email} onClick={() => send(false)}>{busy ? "보내는 중…" : "보내기"}</button></div>
        </div>}
      </Modal>}
    </section>
  );
}
