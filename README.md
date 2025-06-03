# 🎯 SalesAI - 데이터 기반 영업 분석 시스템

> 담당자별 영업 데이터 분석 및 지역 기반 시각화를 제공하는 웹 애플리케이션

## ✨ 주요 기능

- 📊 **담당자별 영업 분석**: 10명의 담당자 개별 성과 분석
- 🗺️ **지역 기반 지도 시각화**: 경기도 하남/구리/광주/용인 지역 포커싱
- 📈 **매출 통계 및 차트**: 실시간 데이터 시각화
- 👥 **담당자 선택 인터페이스**: 직관적인 카드 기반 UI
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 최적화

## 🚀 빠른 시작

### GitHub Pages 배포 (정적 호스팅)

1. **리포지토리 Fork/Clone**
   ```bash
   git clone https://github.com/your-username/SalesAI.git
   cd SalesAI
   ```

2. **GitHub Pages 활성화**
   - Repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)

3. **접속**
   - `https://your-username.github.io/SalesAI`

### 로컬 개발 환경

1. **Python 환경 설정**
   ```bash
   pip install -r requirements.txt
   ```

2. **로컬 서버 실행**
   ```bash
   python local_server.py
   ```

3. **접속**
   - `http://localhost:8080`

## 📁 프로젝트 구조

```
SalesAI/
├── index.html                 # 메인 담당자 선택 페이지
├── advisor.html              # 데이터 분석 대시보드
├── manager_map_focus.js      # 지도 포커싱 기능
├── github-deployment-setup.js # GitHub Pages 호환성
├── health.json               # 헬스체크 엔드포인트
├── local_server.py           # 로컬 개발 서버
├── requirements.txt          # Python 의존성
├── mobile-optimization.css   # 모바일 최적화
└── data/                     # JSON 데이터 파일들
    ├── manager_list.json
    ├── product_groups.json
    └── manager_focus_regions.json
```

## 👥 담당자 정보

총 10명의 담당자 (가나다순):

| 담당자 | 지역 | 경력 | 월평균 매출 | 거래처 | 품목군 |
|--------|------|------|-------------|--------|--------|
| 김관태 | 광주시 | 3년 | 1.4억원 | 64개 | 265개 |
| 김병민 | 하남시 | 11년 | 1.8억원 | 71개 | 262개 |
| 김서연 | 광주시 | 8년 | 1.4억원 | 55개 | 272개 |
| 김인용 | 용인시 | 7년 | 1.4억원 | 55개 | 278개 |
| 박경현 | 용인시 | 7년 | 1.7억원 | 49개 | 266개 |
| 이인철 | 구리시 | 13년 | 1.7억원 | 38개 | 254개 |
| 이지형 | 하남시 | 8년 | 1.3억원 | 54개 | 272개 |
| 이창준A | 용인시 | 7년 | 1.1억원 | 75개 | 233개 |
| 이한솔B | 용인시 | 3년 | 1.0억원 | 67개 | 266개 |
| 이희영 | 용인시 | 8년 | 1.4억원 | 54개 | 249개 |

## 🗺️ 지역별 분포

- **용인시**: 5명 (50%)
- **광주시**: 2명 (20%)
- **하남시**: 2명 (20%)
- **구리시**: 1명 (10%)

## 🎮 사용법

1. **메인 페이지**에서 담당자 카드 클릭
2. **지도 자동 포커싱**으로 해당 지역 확인
3. **분석 대시보드**에서 상세 데이터 확인
4. **키보드 단축키**: 숫자키 1-5로 빠른 선택

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **지도**: Leaflet.js + OpenStreetMap
- **차트**: Chart.js
- **백엔드**: Python Flask (로컬 개발용)
- **배포**: GitHub Pages (정적 호스팅)

## 📊 데이터 호환성

### GitHub Pages (정적)
✅ 담당자 선택 및 기본 분석  
✅ 지도 포커싱  
✅ 통계 차트  
❌ AI 추천 기능  
❌ CSV 업로드  

### 로컬 환경 (동적)
✅ 모든 기능 사용 가능  
✅ AI 추천 시스템  
✅ CSV 데이터 업로드  

## 🔧 커스터마이징

### 담당자 추가/수정
`index.html`의 `managers` 배열 수정:

```javascript
const managers = [
    {
        name: '새담당자',
        area: '새지역',
        accounts: 50,
        products: 200,
        recentSales: 1.5,
        // ... 기타 정보
    }
];
```

### 지역 포커싱 추가
`manager_map_focus.js`의 `managerRegionFocus` 객체 수정:

```javascript
'새담당자': { 
    region: '새지역', 
    lat: 37.123, 
    lng: 127.456, 
    bounds: [[37.15, 127.42], [37.09, 127.49]] 
}
```

## 📝 라이센스

MIT License - 자유롭게 사용하세요!

## 🤝 기여하기

1. Fork 하기
2. Feature branch 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. Branch에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📞 지원

문제가 있거나 제안사항이 있으시면 Issue를 생성해주세요!

---

⭐ **이 프로젝트가 도움이 되셨다면 Star를 눌러주세요!** 