"""웹에이전시형 제안서 그림 준비 — 칸 비율에 맞춰 미리 잘라 둔다.
사용: py -3.10 prep_assets.py  (먼저 capture_local.py 실행)
"""
import pathlib
from PIL import Image

H = pathlib.Path(__file__).resolve().parent
S = H.parent / '시안'
SH = H / 'shots'
A = H / 'assets'; A.mkdir(exist_ok=True)

def fit(src, dst, ratio, box=None, width=1600):
    """src에서 box(0~1 비율)를 잘라 ratio(가로/세로)에 맞게 위쪽 기준으로 채움"""
    im = Image.open(src).convert('RGB')
    if box:
        x, y, w, h = box; W, Hh = im.size
        im = im.crop((int(x * W), int(y * Hh), int((x + w) * W), int((y + h) * Hh)))
    W, Hh = im.size
    if W / Hh > ratio:  # 너무 넓음 → 가운데 기준 가로 자르기
        nw = int(Hh * ratio); l = (W - nw) // 2; im = im.crop((l, 0, l + nw, Hh))
    else:               # 너무 높음 → 위쪽 기준 세로 자르기
        nh = int(W / ratio); im = im.crop((0, 0, W, nh))
    if im.width > width: im = im.resize((width, int(width / ratio)), Image.LANCZOS)
    im.save(A / dst, quality=90)

for k in 'ABCD':
    fit(S / 'mock' / f'{k}_pc.jpg', f'{k}_pc.jpg', 1.6)
    fit(S / 'mock' / f'{k}_mo.jpg', f'{k}_mo.jpg', 390 / 844, width=780)
    fit(S / 'mock' / f'showcase_{k}.png', f'{k}_show.jpg', 1.567)
fit(SH / 'a_hero.png', 'j1.jpg', 0.79, (0.02, 0.06, 0.4, 0.9), 900)
fit(SH / 'a_target.png', 'j2.jpg', 0.79, (0.02, 0.04, 0.4, 0.9), 900)
fit(SH / 'a_case.png', 'j3.jpg', 0.79, (0.02, 0.08, 0.4, 0.9), 900)
fit(SH / 'a_inq.png', 'j4.jpg', 0.79, (0.03, 0.08, 0.4, 0.9), 900)
fit(SH / 'adm_page.png', 'adm_page.jpg', 1.6)
for n in ['dash', 'menu', 'popup', 'board', 'inquiry', 'users']:
    fit(SH / f'adm_{n}.png', f'g_{n}.jpg', 1.6, width=1200)
print('ok')
