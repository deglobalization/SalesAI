"""
SalesAI 프로젝트 상수 관리 모듈
"""

# 데이터 컬럼명 상수
class DataColumns:
    """CSV 데이터의 표준 컬럼명"""
    BASE_YEAR_MONTH = '기준년월'
    ACCOUNT_CODE = '거래처코드'
    ACCOUNT_NAME = '거래처명'
    PRODUCT_GROUP = '품목군'
    PRODUCT_NAME = '품목명'
    TOTAL_SALES = '총매출'
    TOTAL_QUANTITY = '총수량'
    UNIT_PRICE = '단가'
    INPATIENT_SALES = '원내매출'
    OUTPATIENT_SALES = '원외매출'
    MANAGER = '담당자'
    REGION = '권역'

# 고객 세분화 상수
class CustomerSegments:
    """고객 세분화 기준"""
    
    # 매출 기반 세그먼트
    PREMIUM = 'premium'
    HIGH = 'high'
    MEDIUM = 'medium'
    LOW = 'low'
    
    PREMIUM_THRESHOLD = 10000000  # 1천만원
    HIGH_THRESHOLD = 5000000     # 5백만원
    MEDIUM_THRESHOLD = 1000000   # 1백만원
    
    # BCG 매트릭스 세그먼트
    STAR = 'star'
    CASH_COW = 'cash-cow'
    QUESTION_MARK = 'question-mark'
    DOG = 'dog'

# 분석 기준 상수
class AnalysisConstants:
    """분석에 사용되는 기준값들"""
    
    # 성장률 분석 기간
    RECENT_MONTHS = 3
    COMPARISON_MONTHS = 3
    
    # 성공 확률 기준
    MIN_SUCCESS_RATE = 0.6
    HIGH_SUCCESS_RATE = 0.8
    
    # 매출 임계값
    MIN_SALES_AMOUNT = 100000
    HIGH_SALES_AMOUNT = 5000000
    
    # 추천 개수
    DEFAULT_TOP_N = 10
    MAX_RECOMMENDATIONS = 50

# 한미약품 특화 상수
class HanmiProducts:
    """한미약품 제품 분류"""
    
    # 주력 제품군
    AMOZARTAN_FAMILY = ['아모잘탄', '아모잘탄플러스', '아모잘탄큐']
    ROSUZET_FAMILY = ['로수젯', '로수젯큐']
    PALPAL_FAMILY = ['팔팔정', '팔팔정큐']
    
    # 질환별 분류
    HYPERTENSION = ['아모잘탄', '아모잘탄플러스', '팔팔정']
    DIABETES = ['슈가논', '슈가논엠', '당뇨약']
    CARDIOVASCULAR = ['로수젯', '로수젯큐', '심혈관약']
    
    # 우선순위 제품
    PRIORITY_PRODUCTS = [
        '아모잘탄', '로수젯', '팔팔정', 
        '슈가논', '졸피드', '콘서타'
    ]

# API 응답 상수
class APIConstants:
    """API 응답 관련 상수"""
    
    SUCCESS = 'success'
    ERROR = 'error'
    WARNING = 'warning'
    
    # HTTP 상태 코드
    HTTP_OK = 200
    HTTP_CREATED = 201
    HTTP_BAD_REQUEST = 400
    HTTP_UNAUTHORIZED = 401
    HTTP_NOT_FOUND = 404
    HTTP_INTERNAL_ERROR = 500
    
    # 응답 메시지
    MESSAGES = {
        'DATA_LOADED': '데이터가 성공적으로 로드되었습니다.',
        'ANALYSIS_COMPLETE': '분석이 완료되었습니다.',
        'RECOMMENDATIONS_GENERATED': '추천이 생성되었습니다.',
        'FILE_NOT_FOUND': '파일을 찾을 수 없습니다.',
        'INVALID_DATA': '데이터 형식이 올바르지 않습니다.',
        'PROCESSING_ERROR': '처리 중 오류가 발생했습니다.'
    }

# 파일 형식 상수
class FileFormats:
    """지원하는 파일 형식"""
    
    CSV = '.csv'
    EXCEL = '.xlsx'
    JSON = '.json'
    
    ALLOWED_UPLOADS = [CSV, EXCEL]
    EXPORT_FORMATS = [CSV, EXCEL, JSON]

# 로깅 상수
class LogConstants:
    """로깅 관련 상수"""
    
    DEBUG = 'DEBUG'
    INFO = 'INFO'
    WARNING = 'WARNING'
    ERROR = 'ERROR'
    CRITICAL = 'CRITICAL'
    
    # 로그 카테고리
    DATA_PROCESSING = 'data_processing'
    ANALYSIS = 'analysis'
    API = 'api'
    WEB = 'web'
    ENGINE = 'engine'

# 엔진 설정 상수
class EngineConstants:
    """분석 엔진 설정"""
    
    # 머신러닝 모델 파라미터
    RANDOM_FOREST_PARAMS = {
        'n_estimators': 100,
        'random_state': 42,
        'max_depth': 10,
        'min_samples_split': 5
    }
    
    GRADIENT_BOOSTING_PARAMS = {
        'n_estimators': 100,
        'random_state': 42,
        'learning_rate': 0.1,
        'max_depth': 6
    }
    
    KMEANS_PARAMS = {
        'n_clusters': 4,
        'random_state': 42,
        'n_init': 10
    }
    
    # 특성 중요도 임계값
    FEATURE_IMPORTANCE_THRESHOLD = 0.01
    
    # 교차 검증 설정
    CV_FOLDS = 5
    
    # 데이터 전처리
    SCALING_METHOD = 'standard'
    HANDLE_MISSING = 'mean'

# 웹 UI 상수
class UIConstants:
    """웹 UI 관련 상수"""
    
    # 차트 색상
    CHART_COLORS = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
        '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
    ]
    
    # 테이블 페이지 크기
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # 로딩 메시지
    LOADING_MESSAGES = [
        '데이터를 분석하고 있습니다...',
        '추천을 생성하고 있습니다...',
        '결과를 준비하고 있습니다...',
        '보고서를 작성하고 있습니다...'
    ] 