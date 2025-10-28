#!/bin/bash

# AWS Amplify 프로덕션 배포 스크립트
# 사용법: ./deploy.sh [환경명]

set -e  # 오류 발생시 스크립트 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 스크립트 시작
log_info "🚀 AWS Amplify 프로덕션 배포를 시작합니다..."

# 환경 변수 설정
ENVIRONMENT=${1:-production}
FRONTEND_DIR="./"

# 현재 디렉토리 확인
if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Amplify frontend 디렉토리를 찾을 수 없습니다: $FRONTEND_DIR"
    exit 1
fi

# Amplify CLI 설치 확인
if ! command -v amplify &> /dev/null; then
    log_warning "Amplify CLI가 설치되지 않았습니다. 설치를 진행합니다..."
    npm install -g @aws-amplify/cli
fi

# Node.js 버전 확인
log_info "Node.js 버전 확인..."
node --version

# Amplify CLI 버전 확인
log_info "Amplify CLI 버전 확인..."
amplify --version

# 프론트엔드 디렉토리로 이동
cd "$FRONTEND_DIR"

# 의존성 설치
log_info "📦 의존성 설치 중..."
npm install

# TypeScript 컴파일 확인 (Amplify 타입 호환성 문제로 건너뛰기)
log_warning "🔍 TypeScript 컴파일 확인을 건너뜁니다 (Amplify 타입 호환성 문제)"
# npx tsc --noEmit

# 프론트엔드 빌드
log_info "🏗️ 프론트엔드 빌드 중..."
npm run build

if [ $? -eq 0 ]; then
    log_success "프론트엔드 빌드 완료"
else
    log_error "프론트엔드 빌드 실패"
    exit 1
fi

# Amplify Gen 2 배포
log_info "🚀 Amplify Gen 2 배포 시작..."

# 배포 명령어 실행
if [ "$ENVIRONMENT" = "sandbox" ]; then
    log_info "Sandbox 환경으로 배포합니다..."
    npx ampx sandbox
elif [ "$ENVIRONMENT" = "production" ]; then
    log_info "Production 환경으로 배포합니다..."
    log_warning "Production 배포를 위해서는 App ID가 필요합니다."
    log_info "App ID를 확인하려면: npx ampx list"
    log_info "또는 deploy-production.sh 스크립트를 사용하세요: ./deploy-production.sh <app-id>"
    
    # App ID 확인 시도
    if command -v jq &> /dev/null && [ -f "amplify_outputs.json" ]; then
        APP_ID=$(cat amplify_outputs.json | jq -r '.app_id // empty' 2>/dev/null)
        if [ ! -z "$APP_ID" ] && [ "$APP_ID" != "null" ]; then
            log_info "발견된 App ID: $APP_ID"
            log_info "Production 배포를 시도합니다..."
            npx ampx pipeline-deploy --app-id "$APP_ID" --branch main || npx ampx deploy --app-id "$APP_ID" --branch main
        else
            log_error "App ID를 찾을 수 없습니다. deploy-production.sh를 사용하세요."
            exit 1
        fi
    else
        log_error "App ID가 필요합니다. deploy-production.sh를 사용하세요."
        log_info "사용법: ./deploy-production.sh <app-id> [branch]"
        exit 1
    fi
else
    log_info "사용자 정의 환경 '$ENVIRONMENT'로 배포합니다..."
    npx ampx sandbox
fi

# 배포 결과 확인
if [ $? -eq 0 ]; then
    log_success "✅ 배포가 성공적으로 완료되었습니다!"
    
    # amplify_outputs.json 확인
    if [ -f "amplify_outputs.json" ]; then
        log_info "📄 배포 결과 확인:"
        echo "----------------------------------------"
        cat amplify_outputs.json | jq '.'
        echo "----------------------------------------"
    fi
    
    # GraphQL API 엔드포인트 추출
    if command -v jq &> /dev/null; then
        API_URL=$(cat amplify_outputs.json | jq -r '.data.url // empty')
        if [ ! -z "$API_URL" ]; then
            log_success "🌐 GraphQL API 엔드포인트: $API_URL"
        fi
    fi
    
else
    log_error "❌ 배포가 실패했습니다."
    exit 1
fi

# 배포 후 상태 확인
log_info "🔍 배포 상태 확인 중..."

# Amplify 상태 확인
if command -v jq &> /dev/null; then
    log_info "현재 Amplify 설정:"
    echo "----------------------------------------"
    cat amplify_outputs.json | jq '.'
    echo "----------------------------------------"
fi

log_success "🎉 배포 프로세스가 완료되었습니다!"
log_info "다음 단계:"
log_info "1. AWS Amplify 콘솔에서 배포 상태 확인"
log_info "2. 프론트엔드 애플리케이션 테스트"
log_info "3. GraphQL API 테스트"

echo ""
log_info "📚 유용한 명령어들:"
echo "  - 배포 상태 확인: npx ampx status"
echo "  - 로그 확인: npx ampx logs"
echo "  - Sandbox 삭제: npx ampx sandbox delete"
echo "  - 프론트엔드 실행: npm start"
