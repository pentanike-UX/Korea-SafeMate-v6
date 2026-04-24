#!/bin/bash
# SafeMate v3 — 통합 배포 스크립트
# 실행: ./deploy.sh "커밋 메시지" [--skip-migration] [--skip-push]
# 예시: ./deploy.sh "feat: guardian profile update"

set -e  # 에러 발생 시 즉시 중단

# ── 색상 정의 ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_step() { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }
log_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_err()  { echo -e "${RED}❌ $1${NC}"; }

# ── 인자 파싱 ──────────────────────────────────────────────
COMMIT_MSG="${1:-}"
SKIP_MIGRATION=false
SKIP_PUSH=false

for arg in "$@"; do
  [[ "$arg" == "--skip-migration" ]] && SKIP_MIGRATION=true
  [[ "$arg" == "--skip-push" ]] && SKIP_PUSH=true
done

# ── DEPLOY_MESSAGE.txt 자동 읽기 (Claude가 남긴 메시지 우선) ──
if [[ -z "$COMMIT_MSG" && -f "DEPLOY_MESSAGE.txt" ]]; then
  COMMIT_MSG=$(cat DEPLOY_MESSAGE.txt)
  log_warn "DEPLOY_MESSAGE.txt 에서 커밋 메시지 읽음: \"$COMMIT_MSG\""
fi

# ── 커밋 메시지 없으면 자동 생성 ──────────────────────────
if [[ -z "$COMMIT_MSG" ]]; then
  COMMIT_MSG="chore: deploy $(date '+%Y-%m-%d %H:%M')"
  log_warn "커밋 메시지 없음 → 자동 생성: \"$COMMIT_MSG\""
fi

echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  SafeMate v3 — 통합 배포${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  커밋 메시지 : ${YELLOW}$COMMIT_MSG${NC}"
echo -e "  Migration   : $([ "$SKIP_MIGRATION" = true ] && echo '건너뜀' || echo '실행')"
echo -e "  GitHub Push : $([ "$SKIP_PUSH" = true ] && echo '건너뜀' || echo '실행')"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# ══ STEP 1: Supabase DB Migration ══════════════════════════
if [ "$SKIP_MIGRATION" = false ]; then
  log_step "STEP 1/3 — Supabase DB Migration"

  if ! command -v supabase &>/dev/null; then
    log_err "supabase CLI가 설치되어 있지 않습니다."
    echo "  설치: brew install supabase/tap/supabase"
    echo "  또는: npm install -g supabase"
    echo "  스킵하려면: ./deploy.sh \"메시지\" --skip-migration"
    exit 1
  fi

  # linked 상태 확인
  if ! supabase status &>/dev/null 2>&1; then
    log_warn "supabase 프로젝트가 link되지 않았습니다. 연결 시도..."
    supabase link --project-ref "$(grep NEXT_PUBLIC_SUPABASE_URL .env.local 2>/dev/null | grep -o '[a-z0-9]*\.supabase\.co' | cut -d'.' -f1)" || {
      log_err "supabase link 실패. 수동으로 실행하세요:"
      echo "  supabase link --project-ref <PROJECT_REF>"
      exit 1
    }
  fi

  echo "  migration 파일 목록:"
  ls supabase/migrations/*.sql 2>/dev/null | while read f; do
    echo "    • $(basename $f)"
  done

  supabase db push && log_ok "Supabase migration 완료" || {
    log_err "Supabase migration 실패"
    exit 1
  }
else
  log_warn "STEP 1/3 — Supabase Migration 건너뜀 (--skip-migration)"
fi

# ══ STEP 2: Git Commit & Push ══════════════════════════════
if [ "$SKIP_PUSH" = false ]; then
  log_step "STEP 2/3 — Git Commit & Push"

  # 변경사항 확인
  CHANGED=$(git status --porcelain)
  if [[ -z "$CHANGED" ]]; then
    log_warn "변경된 파일 없음. git push만 진행합니다."
  else
    echo "  변경된 파일:"
    git status --short | head -20 | while read line; do echo "    $line"; done

    git add -A
    git commit -m "$COMMIT_MSG"
    log_ok "Git commit 완료"
  fi

  git push origin main && log_ok "GitHub push 완료 → Vercel 자동 배포 시작됨" || {
    log_err "GitHub push 실패"
    exit 1
  }

  # DEPLOY_MESSAGE.txt 정리
  if [[ -f "DEPLOY_MESSAGE.txt" ]]; then
    rm DEPLOY_MESSAGE.txt
    log_ok "DEPLOY_MESSAGE.txt 삭제됨"
  fi
else
  log_warn "STEP 2/3 — Git Push 건너뜀 (--skip-push)"
fi

# ══ STEP 3: 완료 요약 ══════════════════════════════════════
log_step "STEP 3/3 — 배포 완료"
echo ""
echo -e "${GREEN}${BOLD}🚀 배포 완료!${NC}"
echo ""
[ "$SKIP_MIGRATION" = false ] && echo -e "  ${GREEN}✅ Supabase DB migration 적용됨${NC}"
[ "$SKIP_PUSH" = false ]      && echo -e "  ${GREEN}✅ GitHub main 브랜치 push 완료${NC}"
[ "$SKIP_PUSH" = false ]      && echo -e "  ${GREEN}✅ Vercel 자동 배포 트리거됨${NC}"
echo ""
echo -e "  Vercel 배포 상태 확인: ${BLUE}https://vercel.com/dashboard${NC}"
echo ""
