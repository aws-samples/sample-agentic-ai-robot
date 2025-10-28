#!/bin/bash

# 빠른 Amplify 배포 스크립트 (간단 버전)
# 사용법: ./quick-deploy.sh

set -e

echo "🚀 빠른 Amplify 배포 시작..."

# 의존성 설치
echo "📦 의존성 설치..."
npm install

# 빌드
echo "🏗️ 빌드 중..."
npm run build

# Sandbox 배포 (Amplify Gen 2 권장 방법)
echo "🚀 Sandbox 배포 중..."
npx ampx sandbox

echo "✅ 배포 완료!"
