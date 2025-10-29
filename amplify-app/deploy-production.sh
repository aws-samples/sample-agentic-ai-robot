#!/bin/bash

# AWS Amplify Gen 2 Production 배포 스크립트
# 사용법: ./deploy-production.sh [app-id] [branch]

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
log_info "🚀 AWS Amplify Gen 2 Production 배포를 시작합니다..."

# 파라미터 확인
APP_ID=${1:-""}
BRANCH=${2:-"main"}

if [ -z "$APP_ID" ]; then
    log_error "App ID가 필요합니다."
    log_info "사용법: ./deploy-production.sh <app-id> [branch]"
    log_info "예시: ./deploy-production.sh d1234567890abcdef main"
    exit 1
fi

log_info "App ID: $APP_ID"
log_info "Branch: $BRANCH"

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    log_error "package.json을 찾을 수 없습니다. Amplify frontend 디렉토리에서 실행해주세요."
    exit 1
fi

# AWS 자격 증명 확인
log_info "AWS 자격 증명 확인..."
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS 자격 증명이 설정되지 않았습니다."
    log_info "다음 중 하나를 실행하세요:"
    log_info "1. aws configure"
    log_info "2. export AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION"
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

# 의존성 설치
log_info "📦 의존성 설치 중..."
npm install

# TypeScript 컴파일 확인
log_info "🔍 TypeScript 컴파일 확인..."
npx tsc --noEmit

# 프론트엔드 빌드
log_info "🏗️ 프론트엔드 빌드 중..."
npm run build

if [ $? -eq 0 ]; then
    log_success "프론트엔드 빌드 완료"
else
    log_error "프론트엔드 빌드 실패"
    exit 1
fi

# Git 상태 확인
log_info "🔍 Git 상태 확인..."
if [ -d ".git" ]; then
    log_info "Git 리포지토리 확인됨"
    git status --porcelain
    if [ $? -eq 0 ]; then
        log_info "변경사항이 있으면 커밋 후 배포하세요"
    fi
else
    log_warning "Git 리포지토리가 없습니다. CI/CD 파이프라인 배포를 위해서는 Git이 필요합니다."
fi

# Amplify Gen 2 Production 배포
log_info "🚀 Amplify Gen 2 Production 배포 시작..."

# 1. Pipeline Deploy 시도
log_info "CI/CD 파이프라인 배포 시도..."
if npx ampx pipeline-deploy --app-id "$APP_ID" --branch "$BRANCH"; then
    log_success "✅ Pipeline 배포가 성공적으로 완료되었습니다!"
else
    log_warning "Pipeline 배포 실패. 다른 방법을 시도합니다..."
    
    # 2. Deploy 명령어 시도
    log_info "Deploy 명령어 시도..."
    if npx ampx deploy --app-id "$APP_ID" --branch "$BRANCH"; then
        log_success "✅ Deploy 배포가 성공적으로 완료되었습니다!"
    else
        log_error "❌ 모든 배포 방법이 실패했습니다."
        log_info "다음 사항을 확인해주세요:"
        log_info "1. App ID가 올바른지 확인"
        log_info "2. AWS 권한이 충분한지 확인"
        log_info "3. Git 리포지토리가 Amplify에 연결되어 있는지 확인"
        log_info "4. 브랜치가 존재하는지 확인"
        exit 1
    fi
fi

# 배포 결과 확인
log_info "🔍 배포 상태 확인 중..."

# Amplify 상태 확인
if npx ampx status; then
    log_success "배포 상태 확인 완료"
else
    log_warning "배포 상태 확인 실패"
fi

# amplify_outputs.json 확인
if [ -f "amplify_outputs.json" ]; then
    log_info "📄 배포 결과 확인:"
    echo "----------------------------------------"
    cat amplify_outputs.json | jq '.' 2>/dev/null || cat amplify_outputs.json
    echo "----------------------------------------"
fi

log_success "🎉 Production 배포 프로세스가 완료되었습니다!"
log_info "다음 단계:"
log_info "1. AWS Amplify 콘솔에서 배포 상태 확인"
log_info "2. 프론트엔드 애플리케이션 테스트"
log_info "3. GraphQL API 테스트"
log_info "4. 도메인 설정 (필요시)"

echo ""
log_info "📚 유용한 명령어들:"
echo "  - 배포 상태 확인: npx ampx status"
echo "  - 로그 확인: npx ampx logs"
echo "  - 앱 목록: npx ampx list"
echo "  - 프론트엔드 실행: npm start"
