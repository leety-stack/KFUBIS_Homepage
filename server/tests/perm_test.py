"""서버 권한 규칙 점검 — 개발 서버(127.0.0.1:8095)에 실제로 요청해 본다.
사용: py -3.10 server/tests/perm_test.py   (개발용 초기 계정 기준)
"""
import json, os, sys, urllib.request, urllib.error, datetime

B = os.environ.get("PB", "http://127.0.0.1:8095")
ADMIN = (os.environ.get("CMS_ADMIN_EMAIL", "admin@kfubis.local"), os.environ.get("CMS_ADMIN_PASSWORD", "kfubis-dev-1234"))
ok = fail = 0

def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(B + path, data=data, method=method, headers={"Content-Type": "application/json", **({"Authorization": token} if token else {})})
    try:
        with urllib.request.urlopen(r) as x: return x.status, json.loads(x.read() or b"{}")
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b"{}")

def login(email, pw):
    s, d = req("POST", "/api/collections/users/auth-with-password", {"identity": email, "password": pw})
    return d.get("token") if s == 200 else None

def check(name, cond):
    global ok, fail
    print(("  OK  " if cond else "  !!  ") + name); ok += cond; fail += (not cond)

top = login(*ADMIN); check("최고 관리자 로그인", bool(top))
roles = {r["name"]: r["id"] for r in req("GET", "/api/collections/roles/records?perPage=50", token=top)[1]["items"]}

# 테스트 계정 만들기 (있으면 지우고)
def mkuser(email, role):
    s, d = req("GET", "/api/collections/users/records?filter=" + urllib.parse.quote(f'email="{email}"'), token=top)
    for u in d.get("items", []): req("DELETE", f"/api/collections/users/records/{u['id']}", token=top)
    s, d = req("POST", "/api/collections/users/records", {"email": email, "password": "test-12345", "passwordConfirm": "test-12345", "name": role, "role": roles[role], "status": "사용", "verified": True}, token=top)
    return d.get("id")
import urllib.parse
bonbu_id = mkuser("bonbu@test.local", "본부 담당")
hr_id = mkuser("hr@test.local", "채용 담당")
bonbu = login("bonbu@test.local", "test-12345"); hr = login("hr@test.local", "test-12345")
check("본부 담당·채용 담당 로그인", bool(bonbu and hr))

# 밖에서 가입 막힘
s, _ = req("POST", "/api/collections/users/records", {"email": "x@x.x", "password": "12345678", "passwordConfirm": "12345678"})
check(f"비로그인 가입 차단 ({s})", s in (400, 403))

# 공개 읽기: 게시만
s, d = req("GET", "/api/collections/works/records?perPage=50"); check(f"비로그인 실적 목록 = 게시 {d.get('totalItems')}건", s == 200 and all(i["status"] == "게시" for i in d["items"]))

# 본부 담당(실적 수정=2): 임시저장 가능, 게시·삭제 불가
s, d = req("POST", "/api/collections/works/records", {"name_ko": "권한 테스트", "status": "임시저장"}, token=bonbu); check(f"본부 담당 실적 임시저장 ({s})", s == 200); wid = d.get("id")
s, _ = req("POST", "/api/collections/works/records", {"name_ko": "권한 테스트2", "status": "게시"}, token=bonbu); check(f"본부 담당 실적 게시 차단 ({s})", s in (400, 403))
s, _ = req("GET", f"/api/collections/works/records/{wid}"); check(f"비로그인은 임시저장 글 못 봄 ({s})", s == 404)
s, _ = req("DELETE", f"/api/collections/works/records/{wid}", token=bonbu); check(f"본부 담당 실적 삭제 차단 ({s})", s in (400, 403, 404))
s, _ = req("POST", "/api/collections/news/records", {"cat": "새소식", "title_ko": "x", "status": "임시저장"}, token=bonbu); check(f"본부 담당 소식 쓰기 차단 ({s})", s in (400, 403))

# 자기 역할 올리기 차단
s, _ = req("PATCH", f"/api/collections/users/records/{bonbu_id}", {"role": roles["최고 관리자"]}, token=bonbu); check(f"자기 역할 바꾸기 차단 ({s})", s in (400, 403, 404))
s, _ = req("PATCH", f"/api/collections/users/records/{bonbu_id}", {"name": "본부 담당(이름 변경)"}, token=bonbu); check(f"자기 이름 바꾸기는 가능 ({s})", s == 200)
s, _ = req("PATCH", f"/api/collections/roles/records/{roles['본부 담당']}", {"perms": {"works": 3}}, token=bonbu); check(f"역할 권한 고치기 차단 ({s})", s in (400, 403, 404))

# 채용 담당(채용 게시=3): 게시 가능, 실적은 못 씀
s, d = req("POST", "/api/collections/jobs/records", {"title": "권한 테스트 공고", "status": "게시"}, token=hr); check(f"채용 담당 공고 게시 ({s})", s == 200); jid = d.get("id")
s, _ = req("POST", "/api/collections/works/records", {"name_ko": "x", "status": "임시저장"}, token=hr); check(f"채용 담당 실적 쓰기 차단 ({s})", s in (400, 403))

# 소식 예약 게시: 미래 날짜는 비로그인에게 안 보임
fut = (datetime.date.today() + datetime.timedelta(days=10)).isoformat() + " 00:00:00.000Z"
s, d = req("POST", "/api/collections/news/records", {"cat": "새소식", "title_ko": "예약 테스트", "status": "게시", "publish_at": fut}, token=top); nid = d.get("id")
s, _ = req("GET", f"/api/collections/news/records/{nid}"); check(f"예약 게시 글은 그날 전까지 안 보임 ({s})", s == 404)

# 중지 계정 로그인 차단
req("PATCH", f"/api/collections/users/records/{hr_id}", {"status": "중지"}, token=top)
check("중지된 계정 로그인 차단", login("hr@test.local", "test-12345") is None)

# 정리
for c, i in [("works", wid), ("jobs", jid), ("news", nid)]:
    if i: req("DELETE", f"/api/collections/{c}/records/{i}", token=top)
for i in [bonbu_id, hr_id]: req("DELETE", f"/api/collections/users/records/{i}", token=top)
print(f"\n{ok}개 통과, {fail}개 실패"); sys.exit(1 if fail else 0)
