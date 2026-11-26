"""관리자 5단계(페이지 편집·다국어 문구·검색 노출·접속 통계·변경 이력) 화면 점검
사용: py -3.10 admin/tests/ui_test5.py   (5183·8095 개발 서버)
"""
import os, pathlib, sys, uuid, requests
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "admin" / "tests" / "shots"; OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:5183/"; PB = "http://127.0.0.1:8095"
EMAIL, PW = os.environ.get("CMS_ADMIN_EMAIL", "admin@kfubis.local"), os.environ.get("CMS_ADMIN_PASSWORD", "kfubis-dev-1234")
IMG = ROOT / "server" / "pb_seed" / "p_data.jpg"
res = []
def check(n, c): res.append(bool(c)); print(("  OK  " if c else "  !!  ") + n)

H = {"Authorization": requests.post(f"{PB}/api/collections/users/auth-with-password", json={"identity": EMAIL, "password": PW}).json()["token"]}
page0 = requests.get(f"{PB}/api/collections/pages/records?filter=slug='company/ceo'", headers=H).json()["items"][0]
i18n0 = requests.get(f"{PB}/api/collections/i18n/records?perPage=200&sort=sort", headers=H).json()["items"]
miss0 = next(x for x in i18n0 if not x["en"])
seo0 = next(x for x in requests.get(f"{PB}/api/collections/seo_pages/records?perPage=50", headers=H).json()["items"] if x["path"] == "/projects")
site_page = lambda: requests.get(f"{PB}/api/site/page?slug=company/ceo").json()["blocks"][0]["h"]["ko"]
UA = {"User-Agent": "Mozilla/5.0 Chrome/120"}
for ref in ["https://search.naver.com/", "https://www.google.com/", ""]:
    requests.post(f"{PB}/api/site/hit", headers=UA, json={"path": "/", "ref": ref, "sid": "ui5" + uuid.uuid4().hex[:8]})

try:
 with sync_playwright() as p:
     b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 1600, "height": 1000}, accept_downloads=True); pg = ctx.new_page()
     errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept())
     pg.goto(URL); pg.fill("input[type=email]", EMAIL); pg.fill("input[type=password]", PW); pg.click(".login-box button"); pg.wait_for_selector("aside")

     # 페이지 편집
     pg.goto(URL + "#/page"); pg.wait_for_selector(".bitem"); pg.wait_for_timeout(800)
     n0 = pg.locator(".bitem").count()
     check(f"블록 목록·가운데 미리보기 ({n0}개)", n0 >= 3 and pg.locator(".canvas .blk").count() == n0)
     pg.locator(".bitem").first.click(); pg.locator(".props input").nth(1).fill("화면시험 인사말")
     check("고치면 '수정 중' 표시·미리보기 반영", "수정 중" in pg.inner_text(".pstate") and "화면시험 인사말" in pg.inner_text(".canvas"))
     pg.click(".pstate >> text=임시저장"); pg.wait_for_timeout(1200)
     check("임시저장 → 홈페이지는 그대로", site_page() != "화면시험 인사말" and "게시 전" in pg.inner_text(".pstate"))
     pg.click(".pstate button.pri"); pg.wait_for_timeout(1200)
     check("게시 → 홈페이지에 반영", site_page() == "화면시험 인사말" and "게시됨" in pg.inner_text(".pstate"))
     pg.click(".pstate >> text=English"); pg.wait_for_timeout(300)
     check("English 전환 → 영문 칸", pg.locator(".props input").nth(1).input_value() == (page0["draft"][0]["h"].get("en") or ""))
     pg.click(".pstate >> text=국문")
     pg.click(".palette >> text=+ 숫자 띠"); pg.wait_for_timeout(300)
     check("블록 추가", pg.locator(".bitem").count() == n0 + 1)
     pg.locator(".bitem", has_text="글·사진").first.click(); pg.wait_for_timeout(200)
     nimg = pg.locator(".props .lib img").count()
     pg.set_input_files(".props input[type=file]", str(IMG)); pg.wait_for_timeout(2000)
     check("사진 올리기 → 보관함에 추가·블록에 적용", pg.locator(".props .lib img").count() == nimg + 1 and pg.locator(".props .lib img.on").count() == 1)
     pg.click(".pstate >> text=모바일"); pg.wait_for_timeout(500)
     check("모바일 미리보기", "mo" in (pg.get_attribute(".canvas", "class") or ""))
     pg.screenshot(path=str(OUT / "page_edit.png"))
     pg.click(".pstate >> text=PC")

     # 다국어 문구
     pg.goto(URL + "#/i18n"); pg.wait_for_selector(".tbl tbody tr"); pg.wait_for_timeout(500)
     m0 = pg.inner_text(".panel-hd .cnt")
     pg.check("text=영문 미입력만 보기"); pg.wait_for_timeout(300)
     rows = pg.locator(".tbl tbody tr")
     check(f"영문 미입력만 걸러 보기 ({m0})", rows.count() >= 1 and all(not rows.nth(i).locator("input").nth(1).input_value() for i in range(rows.count())))
     pg.locator(f"input[aria-label='{miss0['key']} 영문']").fill("Inquiry received. We will contact you within one business day.")
     pg.click(".ph >> text=저장"); pg.wait_for_timeout(1000)
     check("영문 입력·저장", requests.get(f"{PB}/api/collections/i18n/records/{miss0['id']}").json()["en"].startswith("Inquiry received") and pg.inner_text(".panel-hd .cnt") != m0)

     # 검색 노출
     pg.goto(URL + "#/seo"); pg.wait_for_selector(".pp tbody tr"); pg.locator(".pp tbody tr", has_text="/projects").click(); pg.wait_for_timeout(300)
     t = "한방유비스 수행 실적 — 공항·초고층·플랜트 소방 프로젝트 모음 시험"
     pg.locator(".pp .panel").first.locator("input").nth(2).fill(t)
     check("제목 글자 수·미리보기", f"{len(t)}/40자" in pg.inner_text(".pp") and t in pg.inner_text(".serp"))
     pg.locator(".pp .panel").first.locator("button.navy").click(); pg.wait_for_timeout(800)
     check("검색 설정 저장", requests.get(f"{PB}/api/collections/seo_pages/records/{seo0['id']}").json()["title"] == t)
     pg.screenshot(path=str(OUT / "seo.png"))

     # 접속 통계
     pg.goto(URL + "#/stats"); pg.wait_for_selector(".kpis"); pg.wait_for_timeout(1000)
     check("통계: 방문자·그래프·들어온 곳", int(pg.locator(".kpi b").first.inner_text().replace(",", "")) >= 3 and pg.locator("[data-chart] polyline").count() == 1 and "네이버 검색" in pg.inner_text(".hbars"))
     pg.locator("[data-chart] rect").hover(); pg.wait_for_timeout(200)
     check("그래프에 마우스 → 날짜별 값", pg.locator(".ctip").count() == 1)
     pg.click(".ph .seg >> text=7일"); pg.wait_for_timeout(800)
     check("기간 7일로", "(7일)" in pg.inner_text(".ph"))
     with pg.expect_download() as dl: pg.click("text=엑셀로 내려받기")
     check("엑셀(CSV) 내려받기", "방문자" in open(dl.value.path(), encoding="utf-8-sig").read())
     pg.screenshot(path=str(OUT / "stats.png"))

     # 변경 이력·되돌리기 (방금 저장한 영문 문구를 화면에서 되돌림)
     pg.goto(URL + "#/history"); pg.wait_for_selector(".hist2 li"); pg.wait_for_timeout(600)
     row = pg.locator(".hist2 li", has_text=miss0["ko"][:10]).first
     check("이력: 누가·어느 메뉴·무엇을", "다국어 문구" in row.inner_text() and "영문 수정" in row.inner_text())
     row.locator("text=바뀐 내용").click(); pg.wait_for_timeout(200)
     check("바뀐 내용: 전·후", "Inquiry received" in row.locator(".diff").inner_text() and "(없음)" in row.locator(".diff").inner_text())
     row.locator("button", has_text="되돌리기").click(); pg.wait_for_timeout(1200)
     check("화면에서 되돌리기", requests.get(f"{PB}/api/collections/i18n/records/{miss0['id']}").json()["en"] == "")
     pg.locator(".ph select, .panel-hd select").nth(1).select_option(label="페이지 편집"); pg.wait_for_timeout(600)
     check("메뉴로 걸러 보기", pg.locator(".hist2 li").count() >= 1 and all("페이지 편집" in pg.locator(".hist2 li").nth(i).inner_text() for i in range(pg.locator(".hist2 li").count())))
     pg.screenshot(path=str(OUT / "history.png"))

     # 역할·권한: 이력 메뉴는 없음·보기·되돌리기
     pg.goto(URL + "#/roles"); pg.wait_for_selector(".plist .pr")
     check("역할: 변경 이력 단계 = 되돌리기", "되돌리기" in pg.locator(".plist .pr", has_text="변경 이력").inner_text())
     # 메뉴 관리: 연결 페이지 고르기
     pg.goto(URL + "#/menu"); pg.wait_for_timeout(800)
     check("화면 오류 없음", not errs)
     if errs: print(errs[:3])
finally:
 requests.patch(f"{PB}/api/collections/pages/records/{page0['id']}", headers=H, json={"draft": page0["draft"], "live": page0["live"], "images": page0["images"]})
 requests.patch(f"{PB}/api/collections/i18n/records/{miss0['id']}", headers=H, json={"en": ""})
 requests.patch(f"{PB}/api/collections/seo_pages/records/{seo0['id']}", headers=H, json={"title": seo0["title"]})
print(f"\n{sum(res)}/{len(res)} 통과"); sys.exit(0 if all(res) else 1)
