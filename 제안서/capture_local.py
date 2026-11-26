"""제안서용 화면 캡처 (시안 html을 파일로 열어 1600x900으로 찍음)
사용: py -3.10 capture_local.py
"""
import pathlib
from playwright.sync_api import sync_playwright

H = pathlib.Path(__file__).resolve().parent
S = H.parent / '시안'
OUT = H / 'shots'; OUT.mkdir(exist_ok=True)

def settle(pg):
    # 스크롤하며 나타나는 애니메이션을 모두 끝낸 상태로
    pg.evaluate('async()=>{for(let y=0;y<document.body.scrollHeight;y+=300){scrollTo(0,y);await new Promise(r=>setTimeout(r,50))}}')
    pg.wait_for_timeout(1500)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    # 시안 A 구역별
    pg.goto((S / 'A_기업정통형.html').as_uri()); pg.wait_for_timeout(2500)
    pg.screenshot(path=str(OUT / 'a_hero.png'))
    settle(pg)
    for name, sel in [('a_biz', '.biz'), ('a_target', '.target'), ('a_case', '.case'), ('a_inq', '#inq')]:
        y = pg.evaluate("s=>{const e=document.querySelector(s).closest('section');return e.getBoundingClientRect().top+scrollY}", sel)
        pg.evaluate('y=>scrollTo(0,y)', y - 120); pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / f'{name}.png'))
    # 관리자 화면
    for v in ['dash', 'menu', 'popup', 'inquiry', 'main', 'works', 'users', 'roles']:
        pg.goto((S / '관리자.html').as_uri() + '#' + v); pg.wait_for_timeout(900)
        pg.screenshot(path=str(OUT / f'adm_{v}.png'))
    pg.goto((S / '관리자.html').as_uri() + '#works'); pg.wait_for_timeout(600)
    pg.click('#v-works tbody tr >> nth=0'); pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / 'adm_board.png'))
    # 휴대폰 (시안 C·D·A 첫 화면)
    m = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    for k, f in [('A', 'A_기업정통형.html'), ('C', 'C_다크프리미엄형.html'), ('D', 'D_화이트모던형.html')]:
        m.goto((S / f).as_uri()); m.wait_for_timeout(2500)
        m.screenshot(path=str(OUT / f'mo_{k}.png'))
    b.close()
print('ok')
