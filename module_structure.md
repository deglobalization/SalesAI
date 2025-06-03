# 🏗️ SalesAI 프로젝트 모듈화 계획

## 📋 현재 상황 분석

### 문제점
1. **파일 중복**: `advisor.html`, `advisor_backup.html`, `advisor_new.html` 등 유사한 파일 다수
2. **기능 분산**: JavaScript 코드가 HTML 내부와 별도 JS 파일에 혼재
3. **의존성 복잡**: 파일 간 의존 관계가 명확하지 않음
4. **유지보수 어려움**: 코드 중복으로 인한 수정 작업 복잡성

### 목표
1. **모듈 분리**: 기능별 독립적인 모듈 구성
2. **의존성 정리**: 명확한 의존성 계층 구조
3. **코드 재사용**: 공통 기능의 모듈화
4. **확장성**: 새로운 기능 추가 용이

## 🎯 모듈화 전략

### 1. 디렉토리 구조 재설계

```
src/
├── core/                    # 핵심 엔진
│   ├── engines/
│   │   ├── SmartSalesTargetingEngine.py
│   │   ├── SalesRecommendationEngine.py
│   │   └── HanmiProductClassifier.py
│   ├── utils/
│   │   ├── data_processor.py
│   │   ├── file_handler.py
│   │   └── validators.py
│   └── config/
│       ├── settings.py
│       └── constants.py
├── web/                     # 웹 인터페이스
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   ├── templates/
│   └── components/
├── api/                     # API 서버
│   ├── routes/
│   ├── middleware/
│   └── models/
├── data/                    # 데이터 관리
│   ├── raw/
│   ├── processed/
│   └── exports/
└── tests/                   # 테스트
    ├── unit/
    ├── integration/
    └── e2e/
```

### 2. 모듈별 책임 분리

#### Core 모듈
- **Engine**: 핵심 AI 분석 엔진
- **Utils**: 공통 유틸리티 함수
- **Config**: 설정 및 상수 관리

#### Web 모듈
- **Components**: 재사용 가능한 UI 컴포넌트
- **Services**: 백엔드 API 호출 서비스
- **Stores**: 상태 관리

#### API 모듈
- **Routes**: RESTful API 엔드포인트
- **Middleware**: 인증, 로깅 등
- **Models**: 데이터 모델

## 🔧 구현 단계

### Phase 1: 백엔드 모듈화
1. Python 엔진 모듈 분리
2. 공통 유틸리티 추출
3. 설정 관리 시스템

### Phase 2: 프론트엔드 모듈화
1. JavaScript 기능별 모듈 분리
2. CSS 컴포넌트 시스템
3. 상태 관리 구현

### Phase 3: API 표준화
1. RESTful API 설계
2. 에러 핸들링 통합
3. 문서화

### Phase 4: 배포 최적화
1. 빌드 시스템 구축
2. 환경별 설정 분리
3. CI/CD 파이프라인

## 📊 예상 효과

### 개발 효율성
- 코드 중복 제거: 30% 이상
- 버그 수정 시간: 50% 단축
- 새 기능 개발: 40% 빠름

### 유지보수성
- 모듈 독립성으로 영향 범위 최소화
- 테스트 가능한 구조
- 명확한 책임 분리

### 확장성
- 새로운 분석 엔진 추가 용이
- 다양한 UI 버전 지원
- 마이크로서비스 전환 가능 