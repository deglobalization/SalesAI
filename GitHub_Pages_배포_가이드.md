# GitHub Pages 배포 가이드

## 개요
SmartSalesTargetingEngine의 모든 추천 결과를 사전 계산하여 정적 웹사이트로 배포하는 방법입니다.

## 📁 필요한 파일들

### 핵심 파일
- `advisor_static.html`: 정적 웹사이트 메인 페이지
- `recommendations_data.json`: 모든 추천 결과 (1.97MB)
- `product_groups.json`: 품목군 목록 (41.8KB)

### 생성 스크립트
- `generate_all_recommendations.py`: 추천 결과 사전 생성 스크립트
- `SmartSalesTargetingEngine.py`: 추천 엔진 코어
- `rx-rawdata.csv`: 원본 데이터

## 🚀 배포 단계

### 1단계: 추천 결과 생성
```bash
# 모든 품목군에 대한 추천 결과 생성
python generate_all_recommendations.py
```

### 2단계: GitHub Repository 설정
1. 새 Repository 생성 또는 기존 Repository 사용
2. 다음 파일들을 Repository에 업로드:
   - `advisor_static.html` → `index.html`로 이름 변경
   - `recommendations_data.json`
   - `product_groups.json`

### 3단계: GitHub Pages 활성화
1. Repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: main (또는 master)
4. Folder: / (root)
5. Save 클릭

### 4단계: 접속 확인
- URL: `https://[username].github.io/[repository-name]`
- 데이터 로딩 및 품목군 선택 테스트

## 📊 생성된 데이터 정보

### recommendations_data.json
```json
{
  "generated_at": "2025-05-27T21:50:55",
  "engine_version": "SmartSalesTargetingEngine v2.0",
  "total_product_groups": 180,
  "data_summary": {
    "total_sales_records": 33614,
    "total_customers": 71,
    "total_products": 180,
    "date_range": {
      "from": 202301,
      "to": 202312
    }
  },
  "recommendations": {
    "아모잘탄": [...],
    "로수젯정": [...],
    // ... 모든 품목군
  },
  "market_analyses": {
    // 시장 분석 결과
  },
  "sales_plans": {
    // 영업 계획
  }
}
```

### product_groups.json
```json
{
  "generated_at": "2025-05-27T21:50:55",
  "total_count": 180,
  "product_groups": [
    {
      "품목군": "아모잘탄",
      "대표품목": "아모잘탄정10/160mg",
      "질환분류": "고혈압/심혈관",
      "총매출": 1234567890,
      "고객수": 45,
      "품목수": 3,
      "평균단가": 2500
    },
    // ... 모든 품목군 정보
  ]
}
```

## 🎯 주요 특징

### 성능 최적화
- **사전 계산**: 모든 추천 결과를 미리 계산하여 즉시 응답
- **경량화**: 총 2MB 미만의 데이터로 180개 품목군 지원
- **빠른 로딩**: API 서버 없이 JSON 파일 직접 로드

### 사용자 경험
- **즉시 응답**: 서버 대기 시간 없음
- **오프라인 지원**: 한 번 로드되면 오프라인에서도 사용 가능
- **안정성**: 서버 다운타임 없음

### 데이터 업데이트
- 새로운 데이터가 있을 때마다 `generate_all_recommendations.py` 실행
- 생성된 JSON 파일들을 GitHub에 커밋
- 자동으로 웹사이트 업데이트

## 🔧 로컬 테스트

### 방법 1: Python HTTP 서버
```bash
python -m http.server 8080
# http://localhost:8080/advisor_static.html 접속
```

### 방법 2: Live Server (VS Code)
1. VS Code에서 `advisor_static.html` 열기
2. Live Server 확장 설치
3. 우클릭 → "Open with Live Server"

## 📈 데이터 현황

- **총 품목군**: 180개
- **총 거래처**: 71개
- **데이터 기간**: 2023년 1월 ~ 12월
- **추천 결과**: 품목군당 최대 20개 거래처
- **생성 시간**: 약 4분 (180개 품목군)

## 🚨 주의사항

### 파일 크기
- `recommendations_data.json`: 1.97MB
- GitHub Pages 파일 크기 제한: 100MB (충분함)

### 브라우저 호환성
- 모던 브라우저 (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+ 문법 사용
- fetch API 사용

### 보안
- 데이터는 클라이언트 사이드에서 처리
- 민감한 정보는 포함하지 않음
- HTTPS로 자동 제공 (GitHub Pages)

## 📝 커스터마이징

### UI 수정
- `advisor_static.html`의 CSS 섹션 수정
- 색상, 폰트, 레이아웃 변경 가능

### 기능 확장
- JavaScript 섹션에서 추가 기능 구현
- 필터링, 정렬, 검색 기능 강화

### 데이터 추가
- `generate_all_recommendations.py`에서 추가 메트릭 계산
- JSON 스키마에 새 필드 추가

## 🔄 업데이트 워크플로우

1. **데이터 업데이트**: 새로운 `rx-rawdata.csv` 준비
2. **추천 재생성**: `python generate_all_recommendations.py`
3. **검증**: 로컬에서 테스트
4. **배포**: JSON 파일들을 GitHub에 푸시
5. **확인**: GitHub Pages 사이트에서 동작 확인

## 📞 지원

문제가 발생하면:
1. 브라우저 콘솔에서 오류 메시지 확인
2. JSON 파일 유효성 검사
3. 로컬 테스트로 디버깅 