# 📊 데이터 기반 영업 분석 및 추천 시스템

한국어 영업 데이터를 분석하여 고객 세분화와 AI 기반 맞춤형 영업 전략을 제공하는 종합 시스템입니다.

## 🚀 주요 시스템

### 1. 📱 웹 기반 영업 분석 시스템 (`advisor.html`)
실시간 데이터 분석 및 고객 세분화를 위한 웹 애플리케이션

### 2. 🎯 스마트 세일즈 타겟팅 엔진 (`SmartSalesTargetingEngine.py`)
AI 기반 거래처 타겟팅 및 영업 계획 자동 생성 시스템

---

## 📱 웹 기반 영업 분석 시스템

### 🚀 주요 기능

#### 1. 📈 기본 분석
- **매출 통계**: 총 거래처 수, 품목 수, 매출액, 거래 건수
- **품목 분석**: 상위 품목별 매출, 거래처 수, 평균 단가 분석
- **월별 트렌드**: 최근 12개월 매출 트렌드 시각화
- **거래처 성과**: 상위 거래처별 매출 및 성장률 분석

#### 2. 🎯 고객 세분화
- **매출 세그먼트**: Premium(1,000만+), High(500-1,000만), Medium(100-500만), Low(100만 미만)
- **BCG 매트릭스**: Star, Cash Cow, Question Mark, Dog 분류
- **성장률 분석**: 3개월 대비, 전년 동월 대비 성장률
- **상세 고객 정보**: 세그먼트별 고객 리스트 및 상세 분석

#### 3. 🤖 고급 AI 추천 엔진
- **다중 알고리즘 융합**: 협업 필터링(30%) + 콘텐츠 기반(25%) + 인구통계(20%) + 상황인식(15%) + 비즈니스 룰(10%)
- **고객 생애주기 분석**: 도입, 성장, 성숙, 쇠퇴 단계별 전략
- **이탈 위험도 계산**: 매출 하락 패턴 기반 이탈 리스크 예측
- **계절성 패턴 분석**: 월별 수요 패턴을 활용한 타이밍 전략
- **설명 가능한 AI**: 각 추천에 대한 구체적 근거 및 신뢰도 제공

#### 4. 📊 데이터 내보내기
- **CSV 내보내기**: 분석 결과를 CSV 형태로 다운로드
- **JSON 내보내기**: 상세 분석 데이터를 JSON 형태로 저장
- **PDF 리포트**: 인쇄 가능한 요약 리포트 생성

---

## 🎯 스마트 세일즈 타겟팅 엔진

### 🚀 주요 기능

#### 1. 거래처-품목 매칭 최적화
- 머신러닝 알고리즘을 사용한 최적 타겟 거래처 추천
- 성공 확률 및 예상 매출 예측
- 유사 고객 분석을 통한 교차 판매 기회 발굴

#### 2. 시장 기회 분석
- 품목별 시장 침투율 및 성장 가능성 분석
- 경쟁 강도 및 가격 포지셔닝 분석
- 질환분류별 시장 세분화

#### 3. 영업 계획 수립
- 3개월 단위 체계적 영업 계획 자동 생성
- 월별 타겟 거래처 및 예상 매출 제시
- 핵심 전략 및 실행 가이드 제공

#### 4. 결과 내보내기
- Excel 형태로 상세 분석 결과 저장
- 다양한 시트별 정보 정리 (추천거래처, 시장분석, 영업계획)

### 📦 설치 및 실행

#### 필요 패키지 설치
```bash
pip install pandas numpy scikit-learn scipy openpyxl
```

#### 기본 사용법
```bash
# 모든 기능 실행 (추천 + 분석 + 계획 + 내보내기)
python run_sales_engine.py --product "품목명" --action all

# 샘플 데이터로 빠른 테스트
python run_sales_engine.py --product "졸피드" --action all --sample 1000

# 특정 기능만 실행
python run_sales_engine.py --product "졸피드" --action recommend --top 20
```

#### 테스트 실행
```bash
# 전체 시스템 테스트
python test_sales_engine.py

# 특정 품목 분석 테스트
python run_sales_engine.py --product "졸피드" --action all --sample 1000
```

---

## 📱 정적 웹사이트 버전 (GitHub Pages 배포용)

### 🚀 주요 특징
- **사전 계산된 추천**: 모든 180개 품목군의 추천 결과를 미리 계산하여 JSON 파일로 저장
- **GitHub Pages 호환**: 서버 없이 정적 파일만으로 동작
- **빠른 응답**: API 대기 시간 없이 즉시 결과 표시
- **오프라인 지원**: 한 번 로드되면 인터넷 연결 없이도 사용 가능

### 📁 정적 버전 구성 파일
- `advisor_static.html`: 정적 웹사이트 메인 페이지
- `recommendations_data.json`: 모든 추천 결과 (1.97MB)
- `product_groups.json`: 품목군 목록 및 메타데이터 (41.8KB)
- `generate_all_recommendations.py`: 추천 결과 사전 생성 스크립트

### 🚀 빠른 시작 (정적 버전)

#### 1단계: 추천 결과 사전 생성
```bash
python generate_all_recommendations.py
```

#### 2단계: 로컬 테스트
```bash
python -m http.server 8090
# 브라우저에서 http://localhost:8090/advisor_static.html 접속
```

#### 3단계: GitHub Pages 배포
1. 새 Repository 생성
2. 다음 파일들 업로드:
   - `advisor_static.html` → `index.html`로 이름 변경
   - `recommendations_data.json`
   - `product_groups.json`
3. Repository Settings → Pages → Deploy from branch 활성화
4. 배포된 URL에서 접속

### 📊 사전 생성된 데이터 정보
- **총 품목군**: 180개
- **품목군당 추천**: 최대 20개 거래처
- **시장 분석**: 품목군별 침투율, 성장률 분석
- **영업 계획**: 3개월 단위 체계적 계획
- **데이터 크기**: 총 2MB 미만

## 🛠️ 웹 시스템 사용 방법

### 1단계: 데이터 업로드
- CSV 파일을 드래그 앤 드롭하거나 파일 선택
- 필수 컬럼: `기준년월`, `거래처코드`, `거래처명`, `품목군`, `판매금액`

### 2단계: 기본 분석
- "기본 분석 시작" 버튼 클릭
- 데이터 검증 및 기본 통계 생성
- 품목 및 거래처 성과 분석

### 3단계: 고객 세분화
- "고객 세분화" 버튼 클릭
- 매출 기반 세그먼트 분류
- BCG 매트릭스 포지셔닝

### 4단계: AI 추천 생성
- "추천 생성" 버튼 클릭
- 고급 AI 엔진을 통한 맞춤형 전략 생성
- 우선순위별 실행 계획 제시

## 📋 CSV 데이터 형식

```csv
기준년월,거래처코드,거래처명,품목군,총매출,총수량,품목명
202312,A001,ABC병원,감기약,1500000,100,타이레놀정
202312,A002,XYZ약국,비타민,2300000,150,종합비타민
202311,A001,ABC병원,소화제,1200000,80,베아제정
```

## 🎯 AI 추천 전략 유형

### 세그먼트 맞춤 전략
- **VIP 맞춤 서비스**: Premium 고객 대상 전담 서비스
- **전략적 파트너십**: High 고객 대상 장기 계약
- **맞춤 S/A 전략**: Medium/Low 고객 대상 효율적 관계 관리

### BCG 매트릭스 전략
- **성장 가속화**: Star 고객 대상 투자 확대
- **수익성 최적화**: Cash Cow 고객 대상 효율성 개선
- **잠재력 발굴**: Question Mark 고객 대상 시장 조사
- **관계 재정립**: Dog 고객 대상 비용 효율적 서비스

### 타겟팅 엔진 전략
- **신규 거래처 발굴**: 유사 프로필 기반 타겟 선정
- **교차 판매 확대**: 품목간 연관성 분석
- **시장 침투 전략**: 미개척 지역/고객군 우선순위 제시

## 🔧 기술 스택

### 웹 시스템
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Charts**: Chart.js
- **AI Engine**: 다중 알고리즘 융합 규칙 기반 시스템
- **Data Processing**: 클라이언트 사이드 CSV 파싱

### 타겟팅 엔진
- **Backend**: Python 3.8+
- **ML Libraries**: scikit-learn, pandas, numpy
- **Analysis**: RandomForest, GradientBoosting, K-means clustering
- **Export**: openpyxl (Excel), matplotlib (visualization)

## 📱 브라우저 호환성

- Chrome 90+ (권장)
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 배포 및 실행

### 정적 웹사이트 (GitHub Pages 권장)
```bash
# 1. 추천 결과 사전 생성
python generate_all_recommendations.py

# 2. 로컬 테스트
python -m http.server 8090
# http://localhost:8090/advisor_static.html 접속

# 3. GitHub Pages 배포
# - advisor_static.html을 index.html로 이름 변경
# - recommendations_data.json, product_groups.json과 함께 업로드
# - Repository Settings → Pages 활성화
```

### 동적 웹 시스템 (API 서버 필요)
```bash
# 1. API 서버 실행
python api_server.py

# 2. 웹 서버 실행 (다른 터미널)
python -m http.server 8090
# http://localhost:8090/advisor.html 접속
```

### 타겟팅 엔진 직접 사용
```bash
# Python 환경 설정 및 패키지 설치
pip install pandas numpy scikit-learn scipy openpyxl

# 명령행 실행
python run_sales_engine.py --product "졸피드" --action all --sample 1000
```

### 배포 옵션 비교
| 방식 | 장점 | 단점 | 용도 |
|------|------|------|------|
| **정적 웹사이트** | 무료, 빠름, 안정적 | 데이터 업데이트 수동 | GitHub Pages, 일반 사용 |
| **동적 웹사이트** | 실시간 분석, 유연함 | 서버 비용, 복잡함 | 내부 시스템, 고급 사용 |

## 📁 프로젝트 구조

```
SalesAdvisor/
├── advisor.html                      # 웹 기반 분석 시스템 (API 서버 필요)
├── advisor_static.html               # 정적 웹사이트 버전 (GitHub Pages용)
├── SmartSalesTargetingEngine.py      # AI 타겟팅 엔진
├── api_server.py                     # Flask API 서버
├── generate_all_recommendations.py   # 정적 데이터 사전 생성 스크립트
├── run_sales_engine.py               # 메인 실행 스크립트
├── test_sales_engine.py              # 테스트 스크립트
├── recommendations_data.json         # 사전 생성된 모든 추천 결과
├── product_groups.json               # 품목군 목록 및 메타데이터
├── GitHub_Pages_배포_가이드.md        # GitHub Pages 배포 가이드
├── 사용법_가이드.md                    # 상세 사용법 가이드
├── rx-rawdata.csv                    # 샘플 영업 데이터
├── README.md                         # 프로젝트 개요
└── *.xlsx                            # 분석 결과 파일들
```

## 🔒 보안 및 개인정보

- **클라이언트 사이드 처리**: 웹 시스템의 모든 데이터는 로컬에서 처리
- **외부 전송 없음**: 데이터가 외부 서버로 전송되지 않음
- **즉시 삭제**: 페이지 새로고침 시 모든 데이터 초기화
- **로컬 실행**: 타겟팅 엔진은 로컬 환경에서 실행

## 🔗 시스템 연동

### advisor.html ↔ SmartSalesTargetingEngine 연동

advisor.html의 AI 추천 섹션에서 실제 SmartSalesTargetingEngine을 직접 사용할 수 있습니다:

#### 🚀 연동 설정
1. **API 서버 시작**:
   ```bash
   python api_server.py
   ```

2. **웹 서버 시작**:
   ```bash
   python -m http.server 8080
   ```

3. **연동 사용**: 
   - `http://localhost:8080/advisor.html` 접속
   - "💡 AI 추천 생성" 버튼 클릭
   - "🎯 SmartSalesTargetingEngine" 선택
   - 원하는 품목 선택하여 실제 AI 타겟팅 결과 확인

#### ⭐ 연동의 장점
- **실제 AI 분석**: 규칙 기반이 아닌 실제 머신러닝 기반 추천
- **진료과별 매칭**: 품목의 질환분류와 거래처 진료과 자동 매칭  
- **정확한 예측**: RandomForest 모델을 통한 높은 정확도의 예상 매출 및 성공 확률
- **실시간 연동**: 웹 인터페이스에서 바로 실제 AI 엔진 결과 확인

## 📖 상세 문서

- [`사용법_가이드.md`](./사용법_가이드.md) - SmartSalesTargetingEngine 상세 사용법
- [`연동_가이드.md`](./연동_가이드.md) - advisor.html과 SmartSalesTargetingEngine 연동 가이드
- 웹 시스템은 인터페이스에서 직접 가이드 제공

## 📞 지원 및 문의

프로젝트에 대한 문의사항이나 개선 제안이 있으시면 Issues를 통해 연락해주세요.

## 📄 라이선스

MIT License

---

**Made with ❤️ for Korean Sales Teams** 