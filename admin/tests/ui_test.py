"""관리자 화면 동작 점검 — 개발 서버(5183)와 PocketBase(8095)가 떠 있어야 함.
사용: py -3.10 admin/tests/ui_test.py
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "admin" / "tests" / "shots"; OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:5183/"
EMAIL, PW = os.environ.get("CMS_ADMIN_EMAIL", "admin@kfubis.local"), os.environ.get("CMS_ADMIN_PASSWORD", "kfubis-dev-1234")
IMG = str(ROOT / "시안" / "img" / "p_lotte.jpg")
PDF = next((str(p) for p in (ROOT / "제안서").glob("*.pdf")), IMG)
res = []
def check(n, c): res.append(c); print(("  OK  " if c else "  !!  ") + n)

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1600, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector(".login-box")
    pg.fill('input[type=email]', EMAIL); pg.fill('input[type=password]', "wrong-pw"); pg.click(".login-box button")
    pg.wait_for_selector(".login-err"); check("틀린 비밀번호 안내", "맞지 않" in pg.inner_text(".login-err"))
    pg.fill('input[type=password]', PW); pg.click(".login-box button"); pg.wait_for_selector("aside")
    check("로그인 → 사이드바", pg.locator("aside a").count() >= 20)
    pg.wait_for_timeout(1200); pg.screenshot(path=str(OUT / "dash.png"))
    check("대시보드 숫자", "등록된 글" in pg.inner_text(".kpis"))

    pg.click("aside >> text=실적 관리"); pg.wait_for_selector(".blist-t tbody tr >> nth=0"); pg.wait_for_timeout(500)
    check(f"실적 목록 {pg.locator('.blist-t tbody tr').count()}건", pg.locator(".blist-t tbody tr").count() >= 5)
    pg.click(".flt >> text=초고층·복합"); pg.wait_for_timeout(500)
    check("유형 필터", all("초고층" in t for t in pg.locator(".blist-t tbody td:nth-child(4)").all_inner_texts()))
    pg.click(".flt >> text=전체"); pg.wait_for_timeout(400)
    pg.click(".blist-t tbody tr >> nth=0"); pg.wait_for_selector(".modal.on")
    pg.set_input_files('.imgin input[type=file]', IMG); pg.fill("#f_result_ko", "1993년 1단계부터 이어진 연속 참여")
    pg.screenshot(path=str(OUT / "works_modal.png"))
    pg.click(".m-ft >> text=게시"); pg.wait_for_selector(".modal.on", state="detached"); pg.wait_for_timeout(600)
    check("실적 사진 올려 게시", "게시했습니다" in pg.inner_text(".toast"))
    pg.click(".blist-t tbody tr >> nth=0"); pg.wait_for_selector(".modal.on")
    check("올린 사진이 다시 보임", "/api/files/" in (pg.get_attribute(".imgin img", "src") or ""))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)

    pg.click("aside >> text=소식·보도자료"); pg.wait_for_timeout(600)
    pg.click("text=+ 새로 쓰기"); pg.wait_for_selector(".modal.on")
    pg.fill("#f_title_ko", "관리자 화면 시험 글"); pg.locator(".rte-a").first.click(); pg.keyboard.type("본문 시험입니다.")
    pg.set_input_files('.filesin input[type=file]', PDF)
    pg.click(".m-ft >> text=임시저장"); pg.wait_for_selector(".modal.on", state="detached"); pg.wait_for_timeout(600)
    row = pg.locator(".blist-t tbody tr", has_text="관리자 화면 시험 글")
    check("소식 새 글 임시저장", row.count() == 1 and "임시저장" in row.inner_text())
    row.click(); pg.wait_for_selector(".modal.on")
    check("첨부 파일 저장됨", pg.locator(".filesin .fi a").count() == 1)
    pg.on("dialog", lambda d: d.accept()); pg.click(".m-ft >> text=삭제"); pg.wait_for_timeout(800)
    check("시험 글 삭제", pg.locator(".blist-t tbody tr", has_text="관리자 화면 시험 글").count() == 0)
    pg.screenshot(path=str(OUT / "news_list.png"))

    pg.click("aside >> text=문의 관리"); pg.wait_for_timeout(300)
    check("다음 단계 화면 안내", "다음 단계" in pg.inner_text(".content"))
    m = b.new_page(viewport={"width": 390, "height": 844}); m.on("pageerror", lambda e: errs.append(str(e)))
    m.goto(URL + "#/works"); m.wait_for_timeout(1500); m.screenshot(path=str(OUT / "mobile.png"))
    check("폰 가로 넘침 없음", m.evaluate("document.documentElement.scrollWidth") <= 392)
    check("스크립트 오류 없음", not errs); errs and print(errs)
    b.close()
print(f"\n{sum(res)}/{len(res)} 통과"); sys.exit(0 if all(res) else 1)
