"""관리자 4단계(관리자 계정·역할·권한·로그인 기록·2단계 인증·자동 로그아웃) 화면 점검
사용: py -3.10 admin/tests/ui_test4.py   (5183·8095 개발 서버, 메일 확인은 MAILBOX=시험 수신기 파일)
"""
import os, pathlib, re, sys, time, requests
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "admin" / "tests" / "shots"; OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:5183/"; PB = "http://127.0.0.1:8095"
EMAIL, PW = os.environ.get("CMS_ADMIN_EMAIL", "admin@kfubis.local"), os.environ.get("CMS_ADMIN_PASSWORD", "kfubis-dev-1234")
MAIL = os.environ.get("MAILBOX"); mails = lambda: open(MAIL, encoding="utf-8").read() if MAIL and os.path.exists(MAIL) else ""
res = []
def check(n, c): res.append(bool(c)); print(("  OK  " if c else "  !!  ") + n)

tok = requests.post(f"{PB}/api/collections/users/auth-with-password", json={"identity": EMAIL, "password": PW}).json()["token"]
H = {"Authorization": tok}
RULES = {"fail_limit": 5, "lock_minutes": 30, "idle_minutes": 30, "mfa": False}
roles = {r["name"]: r["id"] for r in requests.get(f"{PB}/api/collections/roles/records?perPage=50", headers=H).json()["items"]}
def users(): return requests.get(f"{PB}/api/collections/users/records?perPage=500", headers=H).json()["items"]
def drop_user(email):
    for u in users():
        if u["email"] == email: requests.delete(f"{PB}/api/collections/users/records/{u['id']}", headers=H)
def drop_role(name):
    for r in requests.get(f"{PB}/api/collections/roles/records?perPage=50", headers=H).json()["items"]:
        if r["name"] == name: requests.delete(f"{PB}/api/collections/roles/records/{r['id']}", headers=H)
for e in ("ui4@test.local", "invite-ui4@test.local"): drop_user(e)
drop_role("화면시험 역할")
u = requests.post(f"{PB}/api/collections/users/records", headers=H, json={"email": "ui4@test.local", "password": "test-12345", "passwordConfirm": "test-12345", "name": "화면시험", "dept": "홍보팀", "role": roles["채용 담당"], "status": "사용", "verified": True}).json()
uid = u["id"]

def row_of(pg, email): return pg.locator(".blist-t tbody tr").filter(has=pg.locator("td", has_text=re.compile("^" + re.escape(email) + "$")))
def login(pg, email, pw):
    pg.goto(URL); pg.wait_for_selector(".login-box"); pg.fill('input[type=email]', email); pg.fill('input[type=password]', pw); pg.click(".login-box button")

try:
 with sync_playwright() as p:
     b = p.chromium.launch()
     ctx = b.new_context(viewport={"width": 1600, "height": 1000}); pg = ctx.new_page()
     errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept())
     login(pg, EMAIL, PW); pg.wait_for_selector("aside"); pg.wait_for_timeout(800)

     # 관리자 계정
     pg.goto(URL + "#/users"); pg.wait_for_selector(".blist-t tbody tr"); pg.wait_for_timeout(600)
     t = pg.inner_text(".blist-t")
     check("계정 목록: 나·역할·상태", "나" in t and "최고 관리자" in t and "화면시험" in t)
     m0 = len(mails())
     pg.click("text=+ 관리자 초대"); pg.wait_for_selector(".modal")
     pg.locator(".modal input").nth(0).fill("초대시험"); pg.locator(".modal input[type=email]").fill("invite-ui4@test.local")
     pg.locator(".modal select").nth(1).select_option(label="본부 담당"); pg.click(".modal >> text=초대 메일 보내기"); pg.wait_for_timeout(1500)
     check("초대 → 목록에 추가", pg.locator(".blist-t tbody tr", has_text="초대시험").count() == 1)
     time.sleep(1); box = mails()[m0:]
     check("초대 메일(비밀번호 정하기 링크)" + ("" if MAIL else " (수신기 없음)"), (not MAIL) or ("invite-ui4@test.local" in box and "confirm-password-reset" in box))

     row_of(pg, "ui4@test.local").click(); pg.wait_for_selector(".modal")
     pg.locator(".modal select").nth(0).select_option("감리사업본부"); pg.locator(".modal select").nth(1).select_option(label="홍보 담당")
     pg.click(".modal >> text=저장"); pg.wait_for_timeout(1000)
     row = row_of(pg, "ui4@test.local").inner_text()
     check("계정 수정: 부서·역할 반영", "감리사업본부" in row and "홍보 담당" in row)
     pg.locator(".blist-t tbody tr", has_text="최고 관리자").first.click(); pg.wait_for_selector(".modal")
     check("자기 계정은 역할·사용 여부 못 바꿈", pg.locator(".modal select").nth(1).is_disabled() and pg.locator(".modal .seg button").first.is_disabled() and pg.locator(".modal >> text=삭제").count() == 0)
     pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
     pg.screenshot(path=str(OUT / "users.png"))

     # 역할·권한: 새 역할 → 실적 관리 보기만 → 저장 → 서버 값 확인
     pg.goto(URL + "#/roles"); pg.wait_for_selector(".rlist li"); pg.wait_for_timeout(500)
     pg.locator(".rlist li", has_text="최고 관리자").click()
     check("최고 관리자 역할은 잠김", pg.locator(".plist .seg button").first.is_disabled())
     pg.click("text=+ 역할 추가"); pg.wait_for_timeout(1000)
     pg.locator(".panel-bd input").first.fill("화면시험 역할")
     pg.locator(".plist .pr", has_text="실적 관리").locator("button", has_text="보기").click()
     pg.locator(".plist .pr", has_text="입사 지원").locator("button", has_text="삭제까지").click()
     pg.locator("button.navy", has_text="저장").click(); pg.wait_for_timeout(1000)
     r = next((x for x in requests.get(f"{PB}/api/collections/roles/records?perPage=50", headers=H).json()["items"] if x["name"] == "화면시험 역할"), {})
     check("역할 저장: 메뉴별 단계가 서버에", r.get("perms", {}).get("works") == 1 and r.get("perms", {}).get("apply") == 3 and r.get("perms", {}).get("dash") == 1)
     pg.screenshot(path=str(OUT / "roles.png"))
     requests.patch(f"{PB}/api/collections/users/records/{uid}", headers=H, json={"role": r.get("id")})
     pg.locator(".rlist li", has_text="화면시험 역할").click(); pg.locator("button", has_text="삭제").first.click(); pg.wait_for_timeout(800)
     check("쓰는 계정이 있는 역할은 삭제 막힘", pg.locator(".rlist li", has_text="화면시험 역할").count() == 1)

     # 새 역할로 로그인 → 허용된 메뉴만
     c2 = b.new_context(viewport={"width": 1600, "height": 1000}); p2 = c2.new_page(); p2.on("dialog", lambda d: d.accept())
     login(p2, "ui4@test.local", "test-12345"); p2.wait_for_selector("aside"); p2.wait_for_timeout(800)
     side = p2.inner_text("aside")
     check("권한 있는 메뉴만 보임", "실적 관리" in side and "입사 지원" in side and "관리자 계정" not in side and "메인 배너" not in side)
     p2.goto(URL + "#/users"); p2.wait_for_timeout(800)
     check("주소로 들어가도 권한 없음 안내", "권한이 없습니다" in p2.inner_text("main"))

     # 자동 로그아웃: 마지막 입력 시각을 오래전으로 → 20초 안에 로그인 화면 + 안내
     p2.evaluate("localStorage.setItem('kfubis_admin_active', String(Date.now() - 3*3600*1000))")
     try: p2.wait_for_selector(".login-box", timeout=25000); ok = "자동으로 로그아웃" in p2.inner_text(".login-box")
     except Exception: ok = False
     check("쓰지 않으면 자동 로그아웃", ok); c2.close()

     # 잘못된 비밀번호 5번 → 잠김 → 화면에서 풀기
     for _ in range(5): requests.post(f"{PB}/api/collections/users/auth-with-password", json={"identity": "ui4@test.local", "password": "wrong-pw"})
     c3 = b.new_context(); p3 = c3.new_page(); login(p3, "ui4@test.local", "test-12345"); p3.wait_for_selector(".login-err")
     check("잠긴 계정 로그인 → 잠김 안내", "잠겼" in p3.inner_text(".login-err")); c3.close()
     pg.goto(URL + "#/users"); pg.wait_for_selector(".blist-t tbody tr"); pg.wait_for_timeout(500)
     pg.locator(".flt button", has_text="잠김").click(); pg.wait_for_timeout(300)
     check("잠김 걸러 보기", row_of(pg, "ui4@test.local").count() == 1)
     row_of(pg, "ui4@test.local").click(); pg.click(".modal >> text=잠금 풀기"); pg.wait_for_timeout(1000)
     check("잠금 풀기", requests.post(f"{PB}/api/collections/users/auth-with-password", json={"identity": "ui4@test.local", "password": "test-12345"}).status_code == 200)

     # 로그인 기록
     pg.goto(URL + "#/logins"); pg.wait_for_selector(".tbl tbody tr"); pg.wait_for_timeout(800)
     t = pg.inner_text(".tbl")
     check("로그인 기록: 실패·성공·잠김", "ui4@test.local" in t and "실패" in t and "성공" in t and "잠" in t)
     check("로그인 기록: 기기(브라우저) 표시", "PC · Chrome" in t)
     pg.locator(".flt button", has_text="실패").click(); pg.wait_for_timeout(600)
     check("실패만 걸러 보기", "성공" not in pg.locator(".tbl tbody").inner_text())
     pg.screenshot(path=str(OUT / "logins.png"))
     sel = pg.locator(".panel", has_text="로그인 규칙").locator("select")
     sel.nth(0).select_option("3"); sel.nth(3).select_option("켜기"); pg.click(".panel >> text=저장"); pg.wait_for_timeout(1000)
     st = requests.get(f"{PB}/api/collections/site_settings/records").json()["items"][0]["login_rules"]
     check("로그인 규칙 저장 (3번·2단계 켜짐)", st.get("fail_limit") == 3 and st.get("mfa") is True)

     # 2단계 인증 로그인 (메일 인증번호)
     if MAIL:
         c4 = b.new_context(); p4 = c4.new_page(); m1 = len(mails())
         login(p4, "ui4@test.local", "test-12345"); p4.wait_for_selector("input[autocomplete=one-time-code]", timeout=10000)
         check("비밀번호 다음 인증번호 단계", "인증번호" in p4.inner_text(".login-box"))
         time.sleep(1.5); m = re.findall(r"(?:^|\s|>)(\d{6})(?:\s|<|$)", mails()[m1:], re.M)
         p4.fill("input[autocomplete=one-time-code]", "000000" if m and m[-1] == "000000" else "000001"); p4.click(".login-box button"); p4.wait_for_selector(".login-err")
         check("틀린 인증번호 거부", "인증번호" in p4.inner_text(".login-err"))
         p4.fill("input[autocomplete=one-time-code]", m[-1] if m else ""); p4.click(".login-box button")
         try: p4.wait_for_selector("aside", timeout=8000); ok = True
         except Exception: ok = False
         check("메일 인증번호로 로그인", ok); c4.close()
     else: print("  --  2단계 인증 화면 시험 건너뜀 (MAILBOX 없음)")
     check("화면 오류 없음", not errs)
     if errs: print(errs[:3])
finally:
 requests.post(f"{PB}/api/cms/login-rules", headers=H, json=RULES)
 for e in ("ui4@test.local", "invite-ui4@test.local"): drop_user(e)
 drop_role("화면시험 역할")
print(f"\n{sum(res)}/{len(res)} 통과"); sys.exit(0 if all(res) else 1)
