#!/bin/sh
set -e

# PocketBase 백그라운드 시작 (마이그레이션 자동 실행)
/pb/pocketbase serve --http=0.0.0.0:8090 &
PB_PID=$!

# 헬스체크 대기
echo "Waiting for PocketBase to be ready..."
until wget -q --spider http://localhost:8090/api/health 2>/dev/null; do
  sleep 1
done
echo "PocketBase is ready."

# 관리자 계정 생성 (env 미설정 시 skip)
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD"
  echo "Superuser created: $PB_ADMIN_EMAIL"
fi

wait $PB_PID
