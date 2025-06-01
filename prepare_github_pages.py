#!/usr/bin/env python3
"""
GitHub Pages 배포 준비 스크립트

이 스크립트는 다음 작업을 수행합니다:
1. 추천 결과 사전 생성 (generate_all_recommendations.py 실행)
2. advisor_static.html을 index.html로 복사
3. 필요한 파일들의 존재 확인
4. 배포 준비 완료 메시지 출력
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

def run_command(command, description):
    """명령 실행 및 결과 확인"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} 완료")
            return True
        else:
            print(f"❌ {description} 실패: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} 중 오류: {e}")
        return False

def check_file_exists(filename, description):
    """파일 존재 확인"""
    if os.path.exists(filename):
        size = os.path.getsize(filename)
        if size > 1024 * 1024:  # 1MB 이상
            size_str = f"{size / (1024 * 1024):.2f} MB"
        elif size > 1024:  # 1KB 이상
            size_str = f"{size / 1024:.2f} KB"
        else:
            size_str = f"{size} bytes"
        print(f"✅ {description}: {filename} ({size_str})")
        return True
    else:
        print(f"❌ {description} 파일 없음: {filename}")
        return False

def main():
    print("🚀 GitHub Pages 배포 준비")
    print("=" * 50)
    
    # 현재 디렉토리 확인
    if not os.path.exists('SmartSalesTargetingEngine.py'):
        print("❌ SmartSalesTargetingEngine.py 파일을 찾을 수 없습니다.")
        print("   올바른 프로젝트 디렉토리에서 실행해주세요.")
        return False
    
    # 1단계: 추천 결과 생성
    print("\n📊 1단계: 추천 결과 사전 생성")
    if not run_command("python generate_all_recommendations.py", "모든 추천 결과 생성"):
        return False
    
    # 2단계: 필요한 파일들 확인
    print("\n📁 2단계: 필요한 파일들 확인")
    required_files = [
        ("advisor_static.html", "정적 웹사이트 메인 파일"),
        ("recommendations_data.json", "추천 결과 데이터"),
        ("product_groups.json", "품목군 목록")
    ]
    
    all_files_exist = True
    for filename, description in required_files:
        if not check_file_exists(filename, description):
            all_files_exist = False
    
    if not all_files_exist:
        print("\n❌ 필요한 파일이 누락되었습니다.")
        return False
    
    # 3단계: index.html 생성
    print("\n📝 3단계: GitHub Pages용 index.html 생성")
    try:
        shutil.copy2("advisor_static.html", "index.html")
        print("✅ advisor_static.html → index.html 복사 완료")
    except Exception as e:
        print(f"❌ index.html 생성 실패: {e}")
        return False
    
    # 4단계: .gitignore 생성 (선택사항)
    print("\n📝 4단계: .gitignore 파일 생성")
    gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# 개발용 파일
api_server.py
test_*.py
run_*.py
*.xlsx
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"""
    
    try:
        with open(".gitignore", "w", encoding="utf-8") as f:
            f.write(gitignore_content)
        print("✅ .gitignore 파일 생성 완료")
    except Exception as e:
        print(f"⚠️  .gitignore 생성 실패 (선택사항): {e}")
    
    # 5단계: 배포 안내
    print("\n🎉 GitHub Pages 배포 준비 완료!")
    print("=" * 50)
    print("\n📁 배포할 파일들:")
    deployment_files = [
        "index.html",
        "recommendations_data.json", 
        "product_groups.json"
    ]
    
    total_size = 0
    for filename in deployment_files:
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            total_size += size
            if size > 1024 * 1024:
                size_str = f"{size / (1024 * 1024):.2f} MB"
            else:
                size_str = f"{size / 1024:.2f} KB"
            print(f"  ✅ {filename} ({size_str})")
    
    print(f"\n📊 총 크기: {total_size / (1024 * 1024):.2f} MB")
    
    print("\n🚀 다음 단계:")
    print("1. 새 GitHub Repository 생성")
    print("2. 위 3개 파일을 Repository에 업로드")
    print("3. Repository Settings → Pages → Deploy from branch 설정")
    print("4. main branch / root 폴더 선택 후 Save")
    print("5. 몇 분 후 https://[username].github.io/[repository-name] 접속")
    
    print("\n💡 로컬 테스트:")
    print("   python -m http.server 8090")
    print("   http://localhost:8090 접속")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 