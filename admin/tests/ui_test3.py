"""관리자 3단계(접수함·회사 정보) 화면 점검
사용: py -3.10 admin/tests/ui_test3.py   (5183·8095 개발 서버, 메일 확인은 MAILBOX=시험 수신기 파일)
"""
import os, pathlib, sys, json, time, urllib.request, requests
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "admin" / "tests" / "shots"; OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:5183/"; PB = "http://127.0.0.1:8095"
EMAIL, PW = os.environ.get("CMS_ADMIN_EMAIL", "admin@kfubis.local"), os.environ.get("CMS_ADMIN_PASSWORD", "kfubis-dev-1234")
MAIL = os.environ.get("MAILBOX"); mails = lambda: open(MAIL, encoding="utf-8").read() if MAIL and os.path.exists(MAIL) else ""
PDF = next((ROOT / "제안서").glob("*.pdf"))
res = []
def check(n, c): res.append(bool(c)); print(("  OK  " if c else "  !!  ") + n)

# 홈페이지 양식으로 들어온 것처럼 접수 (비로그인)
tok = requests.post(f"{PB}/api/collections/users/auth-with-password", json={"identity": EMAIL, "password": PW}).json()["token"]
made = []
r = requests.post(f"{PB}/api/collections/inquiries/records", data={"org": "화면시험공사", "name": "김시험", "position": "과장", "tel": "02-111-2222", "email": "ui@test.local", "org_type": "공공기관", "field": "감리", "message": "복합청사 감리 제안요청서를 보냅니다.", "agree": "true", "source": "나라장터(g2b.go.kr) → 실적 → 사업 문의"}, files={"attachments": ("RFP_시험.pdf", open(PDF, "rb"), "application/pdf")})
made.append(("inquiries", r.json().get("id"))); check(f"홈페이지 문의 접수(첨부) {r.status_code}", r.status_code == 200)
r = requests.post(f"{PB}/api/collections/certreqs/records", json={"org": "화면시험공단", "name": "박시험", "tel": "1", "email": "cert-ui@test.local", "project": "잠실 롯데월드타워 — 감리", "purpose": "입찰 제출", "agree": True}); made.append(("certreqs", r.json().get("id")))
j = requests.post(f"{PB}/api/collections/jobs/records", headers={"Authorization": tok}, json={"title": "화면시험 공고", "status": "게시", "state": "모집 중", "online_apply": True}).json(); made.append(("jobs", j["id"]))
r = requests.post(f"{PB}/api/collections/applications/records", data={"job": j["id"], "name": "홍지원", "tel": "010-0000-0000", "email": "apply-ui@test.local", "career": "소방감리 8년", "agree": "true"}, files={"resume": ("이력서.pdf", open(PDF, "rb"), "application/pdf")}); made.append(("applications", r.json().get("id")))
check(f"입사 지원 접수 {r.status_code}", r.status_code == 200)

try:
 with sync_playwright() as p:
     b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True); pg = ctx.new_page()
     errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept())
     pg.goto(URL); pg.fill('input[type=email]', EMAIL); pg.fill('input[type=password]', PW); pg.click(".login-box button"); pg.wait_for_selector("aside"); pg.wait_for_timeout(1500)
     check("대시보드 처리 대기 접수", "사업 문의" in pg.inner_text(".kpis") and pg.locator(".todo li", has_text="확인·회신 필요").count() >= 1)

     pg.goto(URL + "#/inquiry"); pg.wait_for_selector(".ilist li"); pg.wait_for_timeout(800)
     pg.locator(".ilist li", has_text="화면시험공사").click(); pg.wait_for_timeout(500)
     det = pg.inner_text(".det")
     check("상세: 담당 본부 자동 배정", "감리사업본부" in pg.locator(".det select").nth(1).input_value())
     check("상세: 들어온 경로·처리 기록", "나라장터" in det and "자동 배정" in det)
     href = pg.get_attribute(".det a.att", "href"); s = requests.get(href).status_code
     check(f"첨부 파일 받기 (관리자 토큰) {s}", s == 200)
     s2 = requests.get(href.split("?")[0]).status_code; check(f"토큰 없이는 첨부 못 받음 {s2}", s2 in (403, 404))
     pg.locator(".det input[placeholder^='예:']").fill("12/2 현장설명회 참석 예정"); pg.click(".det >> text=남기기"); pg.wait_for_timeout(800)
     check("내부 메모 남기기", "현장설명회" in pg.inner_text(".det .memo"))
     m0 = len(mails())
     pg.click(".reply >> text=보내기"); pg.wait_for_timeout(1500)
     check("답장 메일 → 상태 처리 중", pg.locator(".det select").first.input_value() == "처리 중" and "답장 메일 발송" in pg.inner_text(".det .tl"))
     time.sleep(1); check("답장 메일 도착" + ("" if MAIL else " (수신기 없음)"), (not MAIL) or "ui@test.local" in mails()[m0:])
     pg.locator(".det select").nth(1).select_option("설계사업본부"); pg.wait_for_timeout(800)
     check("본부 넘기기 기록", "설계사업본부(으)로 변경" in pg.inner_text(".det .tl"))
     pg.screenshot(path=str(OUT / "inquiry.png"))
     with pg.expect_download() as dl: pg.click("text=엑셀로 내려받기")
     csv = open(dl.value.path(), encoding="utf-8-sig").read(); check("엑셀(CSV) 내려받기", "화면시험공사" in csv and "받은 시각" in csv)

     pg.goto(URL + "#/certreq"); pg.wait_for_selector(".ilist li"); pg.locator(".ilist li", has_text="화면시험공단").click(); pg.wait_for_timeout(400)
     check("발급 전 첨부 보내기 막힘", pg.locator("button", has_text="첨부해서 보내기").is_disabled())
     pg.set_input_files(".det input[type=file]", str(PDF)); pg.wait_for_timeout(1200)
     check("실적증명서 올리기", pg.locator(".det .f a.att").count() == 1)
     m1 = len(mails()); pg.locator("button", has_text="첨부해서 보내기").click(); pg.wait_for_timeout(1800)
     check("첨부 발송 → 발급 완료", pg.locator(".det select").first.input_value() == "발급 완료")
     time.sleep(1); check("첨부 메일 도착" + ("" if MAIL else " (수신기 없음)"), (not MAIL) or ("cert-ui@test.local" in mails()[m1:] and "application/pdf" in mails()[m1:]))
     pg.screenshot(path=str(OUT / "certreq.png"))

     pg.goto(URL + "#/apply"); pg.wait_for_selector(".ilist li"); pg.locator(".ilist li", has_text="홍지원").click(); pg.wait_for_timeout(400)
     det = pg.inner_text(".det"); check("입사 지원: 공고·삭제 예정일·이력서", "화면시험 공고" in det and "개인정보 삭제 예정" in det and pg.locator(".det a.att").count() == 1)
     pg.locator(".det select").first.select_option("서류 검토"); pg.wait_for_timeout(700)
     check("지원 상태 바꾸기", "서류 검토" in pg.inner_text(".ilist li.sel"))

     pg.goto(URL + "#/company"); pg.wait_for_selector("#f_tel"); pg.wait_for_timeout(400)
     pg.locator(".famrow input[placeholder='https://']").nth(1).fill("https://k-ubis.example")
     pg.locator(".famrow").filter(has_text="방재연구소").locator("input").fill("lab@kfubis.local")
     pg.click(".ph >> text=저장"); pg.wait_for_timeout(1000)
     st = requests.get(f"{PB}/api/collections/site_settings/records").json()["items"][0]
     check("회사 정보 저장 (Family Site·본부 메일)", st["family"][1]["url"] == "https://k-ubis.example")
     check("하단 미리보기", "사업자등록번호" in pg.inner_text(".foot-prev"))
     pg.locator(".famrow input[placeholder='https://']").nth(1).fill(""); pg.click(".ph >> text=저장"); pg.wait_for_timeout(600)
     pg.screenshot(path=str(OUT / "company.png"))

     m = ctx.new_page(); m.set_viewport_size({"width": 390, "height": 844}); m.on("pageerror", lambda e: errs.append(str(e)))
     for k in ["inquiry", "certreq", "apply", "company"]:
         m.goto(URL + "#/" + k); m.wait_for_timeout(900); check(f"폰 {k} 가로 넘침 없음", m.evaluate("document.documentElement.scrollWidth") <= 392)
     check("스크립트 오류 없음", not errs); errs and print(errs)
     b.close()

finally:
 for c, i in made:
    if i: requests.delete(f"{PB}/api/collections/{c}/records/{i}", headers={"Authorization": tok})
print(f"\n{sum(res)}/{len(res)} 통과"); sys.exit(0 if all(res) else 1)
