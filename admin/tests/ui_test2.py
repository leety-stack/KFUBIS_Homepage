"""관리자 2단계(사이트 구성) 화면 점검 — 메뉴·배너·팝업·메인 화면 구성
사용: py -3.10 admin/tests/ui_test2.py  (5183·8095 개발 서버 필요)
"""
import os, pathlib, sys, json, urllib.request
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "admin" / "tests" / "shots"; OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:5183/"; PB = "http://127.0.0.1:8095"
EMAIL, PW = os.environ.get("CMS_ADMIN_EMAIL", "admin@kfubis.local"), os.environ.get("CMS_ADMIN_PASSWORD", "kfubis-dev-1234")
IMG = str(ROOT / "시안" / "img" / "p_tower1.jpg")
res = []
def check(n, c): res.append(bool(c)); print(("  OK  " if c else "  !!  ") + n)
def api(path):
    with urllib.request.urlopen(PB + path) as r: return json.loads(r.read())

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1600, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept())
    pg.goto(URL); pg.fill('input[type=email]', EMAIL); pg.fill('input[type=password]', PW); pg.click(".login-box button"); pg.wait_for_selector("aside")

    # ── 메뉴 관리 ──
    pg.goto(URL + "#/menu"); pg.wait_for_selector(".tree .node"); pg.wait_for_timeout(500)
    tops = lambda: pg.locator(".tree > ul > li > .node b").all_inner_texts()
    before = tops(); check(f"메뉴 1단 {len(before)}개", len(before) == 6)
    pg.locator(".tree > ul > li > .node").nth(2).drag_to(pg.locator(".tree > ul > li > .node").nth(0)); pg.wait_for_timeout(1200)
    after = tops(); check(f"끌어서 순서 변경 ({before[2]} → 맨 앞)", after[0] == before[2])
    pg.locator(".tree > ul > li > .node").nth(0).drag_to(pg.locator(".tree > ul > li > .node").nth(2)); pg.wait_for_timeout(1200)
    check("원래 순서로 되돌림", tops() == before)
    pg.locator(".tree .node", has_text="회사소개").first.click(); pg.click("text=+ 하위 메뉴"); pg.wait_for_timeout(800)
    pg.locator(".mm > section").nth(1).locator("input").first.fill("시험 메뉴"); pg.click(".mm >> text=저장"); pg.wait_for_timeout(800)
    check("하위 메뉴 추가·이름 저장", pg.locator(".tree .node", has_text="시험 메뉴").count() == 1)
    check("새 메뉴는 숨김 상태", "숨김" in pg.locator(".tree .node", has_text="시험 메뉴").inner_text())
    pg.locator(".mm").get_by_text("외부 링크").click(); pg.wait_for_timeout(200)
    check("연결 종류 바꾸면 입력칸 바뀜", pg.locator(".mm input[placeholder='https://']").count() == 1)
    pg.click(".mm >> text=삭제"); pg.wait_for_timeout(800)
    check("메뉴 삭제", pg.locator(".tree .node", has_text="시험 메뉴").count() == 0)
    pg.screenshot(path=str(OUT / "menus.png"))

    # ── 메인 배너 ──
    pg.goto(URL + "#/banner"); pg.wait_for_selector(".bnlist .bn"); pg.wait_for_timeout(500)
    first = pg.locator(".bnlist .bn b").first.inner_text()
    pg.fill("#f_title_ko", "배너 제목 시험"); pg.wait_for_timeout(200)
    check("미리보기가 고치는 대로 바뀜", "배너 제목 시험" in pg.inner_text(".bnprev"))
    pg.set_input_files(".imgin >> nth=1 >> input[type=file]", IMG)
    pg.click(".pp >> text=저장"); pg.wait_for_timeout(1200)
    d = api("/api/collections/banners/records?perPage=50")
    check("저장 → 공개 API에 반영", any(x["title_ko"] == "배너 제목 시험" and x["image_mo"] for x in d["items"]))
    pg.fill("#f_title_ko", first); pg.click(".pp >> text=저장"); pg.wait_for_timeout(800)
    names = pg.locator(".bnlist .bn b").all_inner_texts()
    pg.locator(".bnlist .bn").nth(1).drag_to(pg.locator(".bnlist .bn").nth(0)); pg.wait_for_timeout(1200)
    check("배너 순서 바꾸기", pg.locator(".bnlist .bn b").all_inner_texts()[0] == names[1])
    pg.locator(".bnlist .bn").nth(0).drag_to(pg.locator(".bnlist .bn").nth(1)); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / "banners.png"))

    # ── 팝업 ──
    pg.goto(URL + "#/popup"); pg.wait_for_selector("tbody tr"); pg.wait_for_timeout(500)
    pg.click("tbody tr >> nth=0"); pg.wait_for_timeout(300)
    box0 = pg.locator(".site .pop").bounding_box()
    pg.locator(".pos button").nth(8).click(); pg.wait_for_timeout(300)
    box1 = pg.locator(".site .pop").bounding_box()
    check("위치 바꾸면 미리보기가 오른쪽 아래로", box1 and box0 and box1["x"] > box0["x"] and box1["y"] > box0["y"])
    pg.click(".seg >> text=이미지+글"); pg.wait_for_timeout(200)
    check("내용 종류에 따라 입력칸 바뀜", pg.locator(".imgin").count() == 1 and pg.locator("#f_head_ko").count() == 1)
    pg.click(".pp >> text=저장"); pg.wait_for_timeout(900)
    check("팝업 저장", "오른쪽 아래" in pg.inner_text("tbody tr.sel"))
    pg.locator(".pos button").nth(4).click(); pg.click(".seg >> text=글"); pg.click(".pp >> text=저장"); pg.wait_for_timeout(700)
    pg.click(".panel-hd .seg >> text=모바일"); pg.wait_for_timeout(200)
    check("모바일 미리보기", pg.locator(".site.mo").count() == 1)
    pg.screenshot(path=str(OUT / "popups.png"))

    # ── 메인 화면 구성 ──
    pg.goto(URL + "#/main"); pg.wait_for_selector(".secs li"); pg.wait_for_timeout(500)
    check("첫 화면 계열사 선택이 맨 위", "첫 화면 계열사 선택" in pg.locator(".secs li").first.inner_text())
    pg.locator(".gtt tbody tr").nth(2).locator("input").nth(2).fill("https://k-ubis.example")
    pg.click(".mm >> text=저장"); pg.wait_for_timeout(800)
    g = [x for x in api("/api/collections/main_sections/records?perPage=50")["items"] if x["key"] == "gate"][0]
    check("계열사 주소 저장", g["settings"]["companies"][2]["url"] == "https://k-ubis.example")
    pg.locator(".gtt tbody tr").nth(2).locator("input").nth(2).fill(""); pg.click(".mm >> text=저장"); pg.wait_for_timeout(600)
    free = lambda: [t.split("\n")[0] for t in pg.locator(".secs li").all_inner_texts()[2:]]
    f0 = free(); pg.locator(".secs li").nth(3).drag_to(pg.locator(".secs li").nth(2)); pg.wait_for_timeout(1200)
    check("영역 순서 바꾸기", free()[0] == f0[1])
    pg.locator(".secs li").nth(2).drag_to(pg.locator(".secs li").nth(3)); pg.wait_for_timeout(1200)
    check("잠긴 영역은 끌리지 않음", pg.locator(".secs li").first.get_attribute("draggable") is None)
    vid = pg.locator(".secs li", has_text="홍보영상"); vid.locator(".sw").click(); pg.wait_for_timeout(800)
    check("영역 노출 켜기 → 미리보기에 나타남", "홍보영상" in pg.inner_text(".mini"))
    vid.locator(".sw").click(); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT / "main.png"))

    m = b.new_page(viewport={"width": 390, "height": 844}); m.on("pageerror", lambda e: errs.append(str(e)))
    for k in ["menu", "banner", "popup", "main"]:
        m.goto(URL + "#/" + k); m.wait_for_timeout(900)
        check(f"폰 {k} 가로 넘침 없음", m.evaluate("document.documentElement.scrollWidth") <= 392)
    check("스크립트 오류 없음", not errs); errs and print(errs)
    b.close()
print(f"\n{sum(res)}/{len(res)} 통과"); sys.exit(0 if all(res) else 1)
