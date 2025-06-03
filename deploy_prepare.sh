#!/bin/bash
# GitHub 배포용 파일 준비 스크립트

echo "🚀 GitHub Pages 배포용 파일 준비 중..."

# 배포용 디렉토리 생성
mkdir -p deploy

# 핵심 HTML 파일들
cp index.html deploy/
cp advisor.html deploy/

# 필수 JavaScript 파일들
cp manager_map_focus.js deploy/
cp github-deployment-setup.js deploy/

# 스타일 파일
cp mobile-optimization.css deploy/

# 데이터 파일들 (JSON만)
cp manager_list.json deploy/
cp product_groups.json deploy/
cp manager_focus_regions.json deploy/
cp recommendations_data.json deploy/
cp manager_recommendations_data.json deploy/
cp total_managers_summary.json deploy/
cp health.json deploy/

# 설정 파일들
cp .gitignore deploy/
cp README.md deploy/
cp requirements.txt deploy/

echo "✅ 핵심 파일들 복사 완료!"

# 파일 크기 확인
echo "📊 배포 파일 크기:"
du -sh deploy/*

echo ""
echo "🌐 GitHub Pages 배포 준비 완료!"
echo "📁 deploy/ 폴더의 파일들을 GitHub 리포지토리에 업로드하세요."
echo ""
echo "🔧 추가 설정 필요사항:"
echo "1. advisor.html에 github-deployment-setup.js 추가"
echo "2. CSV 파일들은 .gitignore로 제외됨"
echo "3. GitHub Pages 활성화: Settings → Pages → Branch: main" 