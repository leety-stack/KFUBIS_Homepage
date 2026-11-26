// 접수함 공통 함수 — pb_hooks/*.pb.js 에서 require 해서 씀
module.exports = {
  // 문의 분야 → 담당 본부
  deptOf(field) {
    return ({ "설계": "설계사업본부", "감리": "감리사업본부", "성능위주설계": "방재연구소", "연구개발·AI": "R&D센터" })[field] || "경영지원팀";
  },
  // 컬렉션 → 관리자 메뉴 키
  menuOf(col) { return ({ inquiries: "inquiry", certreqs: "certreq", applications: "apply" })[col] || ""; },
  readJson(record, field) {
    const s = record.getString(field);
    if (!s || s === "null") return [];
    try { return JSON.parse(s); } catch (_) { return []; }
  },
  addLog(record, by, text) {
    const log = module.exports.readJson(record, "log");
    log.push({ at: new Date().toISOString(), by: by, text: text });
    record.set("log", log);
  },
  settings() {
    try { return $app.findFirstRecordByFilter("site_settings", "id != ''"); } catch (_) { return null; }
  },
  // 메일 보내기 — 받는 사람 문자열("a@x, b@x") 또는 배열. 실패하면 예외
  send(to, subject, html, attachments) {
    const list = (Array.isArray(to) ? to : String(to || "").split(/[,;\s]+/)).map((x) => x.trim()).filter(Boolean);
    if (!list.length) throw new Error("받는 메일 주소가 없습니다");
    const meta = $app.settings().meta;
    const msg = new MailerMessage({
      from: { address: meta.senderAddress || "noreply@kfubis.co.kr", name: meta.senderName || "한방유비스" },
      to: list.map((a) => ({ address: a })),
      subject: subject,
      html: html,
    });
    if (attachments) msg.attachments = attachments;
    $app.newMailClient().send(msg);
    return list;
  },
  esc(s) { return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); },
};
