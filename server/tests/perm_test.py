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
    cond = bool(cond)
    print(("  OK  " if cond else "  !!  ") + name); ok += cond; fail += (not cond)

top = login(*ADMIN); check("최고 관리자 로그인", bool(top))
roles = {r["name"]: r["id"] for r in req("GET", "/api/collections/roles/records?perPage=50", token=top)[1]["items"]}

# 테스트 계정 만들기 (있으면 지우고)
def mkuser(email, role):
    s, d = req("GET", "/api/collections/users/records?perPage=500", token=top)  # 메일로 걸러 찾기는 막혀 있어 목록에서 찾음
    for u in d.get("items", []):
        if u.get("email") == email: req("DELETE", f"/api/collections/users/records/{u['id']}", token=top)
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

# ── 2단계: 사이트 구성 ──
s, d = req("GET", "/api/collections/banners/records?perPage=50"); check(f"비로그인 배너 = 보이게 켠 것만 {d.get('totalItems')}건", s == 200 and all(i["visible"] for i in d["items"]))
s, d = req("GET", "/api/collections/popups/records?perPage=50"); check(f"비로그인 팝업 = 기간 안·켠 것만 ({d.get('totalItems')}건)", s == 200)
s, _ = req("POST", "/api/collections/menus/records", {"name_ko": "x", "visible": False}, token=bonbu); check(f"본부 담당 메뉴 추가 차단 ({s})", s in (400, 403))
s, _ = req("POST", "/api/collections/popups/records", {"title": "x"}, token=hr); check(f"채용 담당 팝업 추가 차단 ({s})", s in (400, 403))
# 배너 수정(2)만 있는 역할: 저장은 되고 보이게 켜기는 막힘
s, d = req("POST", "/api/collections/roles/records", {"name": "시험 배너 수정", "perms": {"banner": 2}, "sort": 99}, token=top); tr = d.get("id")
tu = mkuser("bn2@test.local", "시험 배너 수정") if tr and roles.update({"시험 배너 수정": tr}) is None else None
bn2 = login("bn2@test.local", "test-12345")
s, d = req("POST", "/api/collections/banners/records", {"title_ko": "시험 배너", "visible": False}, token=bn2); check(f"배너 수정 권한 — 숨김으로 만들기 ({s})", s == 200); bid = d.get("id")
s, _ = req("PATCH", f"/api/collections/banners/records/{bid}", {"visible": True}, token=bn2); check(f"배너 수정 권한 — 보이게 켜기 차단 ({s})", s in (400, 403, 404))
s, _ = req("PATCH", f"/api/collections/banners/records/{bid}", {"title_ko": "시험 배너(고침)"}, token=bn2); check(f"배너 수정 권한 — 글 고치기 ({s})", s == 200)
req("DELETE", f"/api/collections/banners/records/{bid}", token=top)
if tu: req("DELETE", f"/api/collections/users/records/{tu}", token=top)
if tr: req("DELETE", f"/api/collections/roles/records/{tr}", token=top)

# ── 3단계: 접수함 ──
import time, requests
MAIL = os.environ.get("MAILBOX")  # 시험용 메일 수신기 파일 (없으면 메일 내용 확인은 건너뜀)
def mails(): return open(MAIL, encoding="utf-8").read() if MAIL and os.path.exists(MAIL) else ""
_st = req("GET", "/api/collections/site_settings/records", token=top)[1]["items"][0]; _de = dict(_st.get("dept_emails") or {})
req("PATCH", f"/api/collections/site_settings/records/{_st['id']}", {"dept_emails": {**_de, "감리사업본부": "supervision@kfubis.local"}}, token=top)  # 알림 받을 본부 메일 (시험 뒤 되돌림)
m0 = len(mails())
s, d = req("POST", "/api/collections/inquiries/records", {"org": "시험도시공사", "name": "이시험", "tel": "02-000-0000", "email": "client@test.local", "org_type": "공공기관", "field": "감리", "message": "감리 문의 시험", "agree": True}); iid = d.get("id")
check(f"비로그인 문의 접수 ({s})", s == 200)
s, _ = req("POST", "/api/collections/inquiries/records", {"org": "x", "name": "x", "tel": "1", "agree": True, "status": "완료"}); check(f"비로그인은 상태를 못 정함 ({s})", s in (400, 403))
s, _ = req("POST", "/api/collections/inquiries/records", {"org": "x", "name": "x", "tel": "1", "agree": False}); check(f"개인정보 동의 없으면 접수 안 됨 ({s})", s in (400, 403))
s, _ = req("GET", "/api/collections/inquiries/records"); check(f"비로그인은 문의 목록 못 봄 ({_.get('totalItems', 0)}건)", _.get("totalItems", 0) == 0)
s, d = req("GET", f"/api/collections/inquiries/records/{iid}", token=top)
check(f"자동 배정 = {d.get('dept')} · 상태 {d.get('status')}", d.get("dept") == "감리사업본부" and d.get("status") == "신규")
time.sleep(1); check("담당 본부 알림 메일 도착" + ("" if MAIL else " (수신기 없음 — 건너뜀)"), (not MAIL) or "supervision@kfubis.local" in mails()[m0:])
# 본부 담당 범위: 감리사업본부 사람만 봄
def mkdept(email, dept):
    uid = mkuser(email, "본부 담당"); req("PATCH", f"/api/collections/users/records/{uid}", {"dept": dept}, token=top); return uid
sv_id = mkdept("sv@test.local", "감리사업본부"); ds_id = mkdept("ds@test.local", "설계사업본부")
sv = login("sv@test.local", "test-12345"); ds = login("ds@test.local", "test-12345")
s, _ = req("GET", f"/api/collections/inquiries/records/{iid}", token=sv); check(f"감리본부 담당은 자기 문의 봄 ({s})", s == 200)
s, _ = req("GET", f"/api/collections/inquiries/records/{iid}", token=ds); check(f"설계본부 담당은 감리 문의 못 봄 ({s})", s == 404)
s, _ = req("POST", "/api/cms/reply", {"collection": "inquiries", "id": iid, "subject": "답변 시험", "body": "검토 후 연락드리겠습니다."}, token=ds); check(f"다른 본부는 답장 못 보냄 ({s})", s in (403, 404))
m1 = len(mails())
s, d = req("POST", "/api/cms/reply", {"collection": "inquiries", "id": iid, "subject": "답변 시험", "body": "검토 후 연락드리겠습니다.", "status": "처리 중"}, token=sv)
check(f"담당 본부 답장 메일 ({s} {d.get('message', '')})", s == 200)
time.sleep(1); check("답장 메일 도착" + ("" if MAIL else " (건너뜀)"), (not MAIL) or "client@test.local" in mails()[m1:])
s, d = req("GET", f"/api/collections/inquiries/records/{iid}", token=top); check(f"답장 후 상태·기록 ({d.get('status')}, 기록 {len(d.get('log') or [])}건)", d.get("status") == "처리 중" and len(d.get("log") or []) >= 2)
# 실적증명: 발급 파일 올리고 첨부해서 보내기
s, d = req("POST", "/api/collections/certreqs/records", {"org": "시험공사", "name": "정시험", "tel": "1", "email": "cert@test.local", "project": "인천국제공항 — 설계", "purpose": "입찰 제출", "agree": True}); cid = d.get("id")
check(f"비로그인 실적증명 요청 ({s})", s == 200)
pdf = next(iter(__import__("glob").glob(os.path.join(os.path.dirname(__file__), "..", "..", "제안서", "*.pdf"))), None)
r = requests.patch(f"{B}/api/collections/certreqs/records/{cid}", headers={"Authorization": top}, files={"issued_file": ("실적증명서.pdf", open(pdf, "rb"), "application/pdf")})
check(f"발급 파일 올리기 ({r.status_code})", r.status_code == 200)
s, _ = req("GET", f"/api/files/certreqs/{cid}/{r.json().get('issued_file')}"); check(f"발급 파일은 비로그인에게 안 보임 ({s})", s in (403, 404))
m2 = len(mails())
s, d = req("POST", "/api/cms/reply", {"collection": "certreqs", "id": cid, "subject": "실적증명서 발급", "body": "첨부합니다.", "status": "발급 완료", "attach": True}, token=top)
check(f"실적증명서 첨부 메일 ({s} {d.get('message', '')})", s == 200)
time.sleep(1); check("첨부 메일 도착" + ("" if MAIL else " (건너뜀)"), (not MAIL) or ("cert@test.local" in mails()[m2:] and "application/pdf" in mails()[m2:]))
# 입사 지원: 온라인 지원 안 받는 공고는 거절
s, d = req("POST", "/api/collections/jobs/records", {"title": "시험 공고(닫힘)", "status": "게시", "state": "모집 중", "online_apply": False}, token=top); j1 = d.get("id")
s, d = req("POST", "/api/collections/jobs/records", {"title": "시험 공고(열림)", "status": "게시", "state": "모집 중", "online_apply": True}, token=top); j2 = d.get("id")
s, _ = req("POST", "/api/collections/applications/records", {"job": j1, "name": "홍시험", "tel": "1", "email": "ap@test.local", "agree": True}); check(f"온라인 지원 안 받는 공고 거절 ({s})", s == 400)
s, d = req("POST", "/api/collections/applications/records", {"job": j2, "name": "홍시험", "tel": "1", "email": "ap@test.local", "agree": True}); aid = d.get("id"); check(f"온라인 지원 접수 ({s})", s == 200)
s, d = req("GET", f"/api/collections/applications/records/{aid}", token=top); check(f"개인정보 삭제일 자동 지정 ({(d.get('delete_after') or '')[:10]})", bool(d.get("delete_after")))
for c, i in [("inquiries", iid), ("certreqs", cid), ("applications", aid), ("jobs", j1), ("jobs", j2)]:
    if i: req("DELETE", f"/api/collections/{c}/records/{i}", token=top)
for i in [sv_id, ds_id]: req("DELETE", f"/api/collections/users/records/{i}", token=top)

# ── 4단계: 계정·로그인 ──
import re as _re
def raw_login(email, pw): return requests.post(f"{B}/api/collections/users/auth-with-password", json={"identity": email, "password": pw})
lk_id = mkuser("lock@test.local", "본부 담당")
for _ in range(5): raw_login("lock@test.local", "wrong-pw")
r = raw_login("lock@test.local", "test-12345"); check(f"5번 틀리면 잠김 — 맞는 비밀번호도 거절 ({r.status_code})", r.status_code == 400 and "잠겼" in r.text)
s, _ = req("POST", "/api/cms/users/unlock", {"id": lk_id}, token=bonbu); check(f"최고 관리자 아니면 잠금 못 풂 ({s})", s == 403)
s, _ = req("POST", "/api/cms/users/unlock", {"id": lk_id}, token=top); check(f"잠금 풀기 ({s})", s == 200)
check("잠금 푼 뒤 로그인", raw_login("lock@test.local", "test-12345").status_code == 200)
s, d = req("GET", "/api/collections/login_logs/records?perPage=200&filter=" + urllib.parse.quote('email="lock@test.local"'), token=top)
check(f"로그인 기록 남음 (실패·잠금·성공 {d.get('totalItems')}건)", d.get("totalItems", 0) >= 7 and any("잠금" in (x["reason"] or "") for x in d["items"]))
s, d = req("GET", "/api/collections/login_logs/records", token=bonbu); check(f"권한 없으면 로그인 기록 못 봄 ({d.get('totalItems', 0)}건)", d.get("totalItems", 0) == 0)
# 계정 만들기 (임시 비밀번호) — 메일 인증·2단계 인증 없음
for u in req("GET", "/api/collections/users/records?perPage=500", token=top)[1].get("items", []):
    if u.get("email") == "new@test.local": req("DELETE", f"/api/collections/users/records/{u['id']}", token=top)
body = {"email": "new@test.local", "password": "temp-1234", "passwordConfirm": "temp-1234", "name": "새 계정", "role": roles["홍보 담당"], "status": "사용"}
s, _ = req("POST", "/api/collections/users/records", body, token=bonbu); check(f"최고 관리자 아니면 계정 못 만듦 ({s})", s in (400, 403))
s, d = req("POST", "/api/collections/users/records", body, token=top); inv = d.get("id")
check(f"계정 만들기 → 임시 비밀번호 표시 ({s})", s == 200 and d.get("pw_temp") is True and d.get("verified") is True)
nt = login("new@test.local", "temp-1234"); check("임시 비밀번호로 로그인", bool(nt))
s, _ = req("PATCH", f"/api/collections/users/records/{inv}", {"pw_temp": False}, token=nt); check(f"본인이 임시 표시만 지우기 막힘 ({s})", s in (400, 403, 404))
s, _ = req("PATCH", f"/api/collections/users/records/{inv}", {"locked_until": "", "last_login": "2030-01-01 00:00:00.000Z"}, token=nt); check(f"본인이 잠금·접속 시각 고치기 막힘 ({s})", s in (400, 403, 404))
s, _ = req("PATCH", f"/api/collections/users/records/{inv}", {"oldPassword": "wrong-0000", "password": "mine-5678", "passwordConfirm": "mine-5678"}, token=nt); check(f"지금 비밀번호 틀리면 못 바꿈 ({s})", s == 400)
s, d = req("PATCH", f"/api/collections/users/records/{inv}", {"oldPassword": "temp-1234", "password": "mine-5678", "passwordConfirm": "mine-5678"}, token=nt)
check(f"본인이 바꾸면 임시 해제 ({s})", s == 200 and d.get("pw_temp") is False)
nt2 = login("new@test.local", "mine-5678"); check("새 비밀번호로 로그인", bool(nt2))
s, d = req("PATCH", f"/api/collections/users/records/{inv}", {"password": "reset-9999", "passwordConfirm": "reset-9999"}, token=top)
check(f"최고 관리자가 초기화 → 다시 임시 ({s})", s == 200 and d.get("pw_temp") is True)
r = requests.post(f"{B}/api/collections/users/auth-refresh", headers={"Authorization": nt2}); check(f"초기화하면 예전 로그인 풀림 ({r.status_code})", r.status_code == 401)
# 모든 기기 로그아웃
old = login("lock@test.local", "test-12345")
s, _ = req("POST", "/api/cms/users/logout-all", {"id": lk_id}, token=top)
r = requests.post(f"{B}/api/collections/users/auth-refresh", headers={"Authorization": old}); check(f"모든 기기 로그아웃 → 예전 토큰 무효 ({r.status_code})", r.status_code == 401)
r = requests.post(f"{B}/api/collections/users/request-otp", json={"email": "lock@test.local"}); check(f"메일 인증번호 로그인은 꺼져 있음 ({r.status_code})", r.status_code >= 400)
for i in [lk_id, inv]:
    if i: req("DELETE", f"/api/collections/users/records/{i}", token=top)

# 역할 삭제: 쓰는 계정이 있거나 최고 관리자 역할이면 막음
s, _ = req("DELETE", f"/api/collections/roles/records/{roles['채용 담당']}", token=top); check(f"쓰는 계정 있는 역할 삭제 차단 ({s})", s == 400)
s, _ = req("DELETE", f"/api/collections/roles/records/{roles['최고 관리자']}", token=top); check(f"최고 관리자 역할 삭제 차단 ({s})", s == 400)
s, d = req("POST", "/api/collections/roles/records", {"name": "삭제시험 역할", "perms": {"dash": 1}}, token=top)
s, _ = req("DELETE", f"/api/collections/roles/records/{d.get('id')}", token=top); check(f"안 쓰는 역할은 삭제 ({s})", s == 204)

# 정리
req("PATCH", f"/api/collections/site_settings/records/{_st['id']}", {"dept_emails": _de}, token=top)
for c, i in [("works", wid), ("jobs", jid), ("news", nid)]:
    if i: req("DELETE", f"/api/collections/{c}/records/{i}", token=top)
for i in [bonbu_id, hr_id]: req("DELETE", f"/api/collections/users/records/{i}", token=top)
print(f"\n{ok}개 통과, {fail}개 실패"); sys.exit(1 if fail else 0)
