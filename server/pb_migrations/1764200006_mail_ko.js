/// <reference path="../pb_data/types.d.ts" />
// 관리자 계정 메일을 한국어로 — 인증번호(2단계 인증), 비밀번호 정하기·재설정(초대 포함), 메일 변경
const wrap = (body) => `<div style="font-family:'Malgun Gothic',sans-serif;font-size:14px;line-height:1.7;color:#111">${body}<p style="color:#888;font-size:12px;margin-top:24px">한방유비스(주) 홈페이지 관리자 · 본인이 요청하지 않았다면 이 메일은 무시하세요.</p></div>`;

migrate((app) => {
  const u = app.findCollectionByNameOrId("users");
  u.otp.emailTemplate.subject = "[한방유비스 관리자] 로그인 인증번호";
  u.otp.emailTemplate.body = wrap(`<p>로그인 인증번호입니다. 5분 안에 입력하세요.</p><p style="font-size:26px;font-weight:700;letter-spacing:4px">{OTP}</p>`);
  u.resetPasswordTemplate.subject = "[한방유비스 관리자] 비밀번호 정하기";
  u.resetPasswordTemplate.body = wrap(`<p>한방유비스 홈페이지 관리자 계정의 비밀번호를 정하는 메일입니다. (처음 초대받았거나 재설정을 요청한 경우)</p><p><a href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" style="display:inline-block;background:#1d395e;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">비밀번호 정하기</a></p><p style="color:#666">링크는 30분 동안만 쓸 수 있습니다.</p>`);
  u.confirmEmailChangeTemplate.subject = "[한방유비스 관리자] 메일 주소 변경 확인";
  u.confirmEmailChangeTemplate.body = wrap(`<p>관리자 계정의 메일 주소를 바꾸려면 아래를 누르세요.</p><p><a href="{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}">메일 주소 변경 확인</a></p>`);
  app.save(u);
}, (_) => {});
