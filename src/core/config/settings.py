"""
SalesAI 프로젝트 설정 관리 모듈
"""

import os
from pathlib import Path

# 프로젝트 루트 디렉토리
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent

class Config:
    """기본 설정 클래스"""
    
    # 데이터 경로
    DATA_DIR = PROJECT_ROOT / "src" / "data"
    RAW_DATA_DIR = DATA_DIR / "raw"
    PROCESSED_DATA_DIR = DATA_DIR / "processed"
    EXPORTS_DIR = DATA_DIR / "exports"
    
    # 기본 데이터 파일
    DEFAULT_CSV_FILE = PROJECT_ROOT / "rx-rawdata.csv"
    MANAGER_DATA_DIR = PROJECT_ROOT / "manager_data"
    
    # 분석 엔진 설정
    RANDOM_STATE = 42
    N_ESTIMATORS = 100
    TEST_SIZE = 0.2
    
    # 추천 시스템 설정
    TOP_RECOMMENDATIONS = 10
    MIN_SALES_THRESHOLD = 100000
    MIN_SUCCESS_RATE = 0.6
    
    # 웹 설정
    WEB_HOST = "localhost"
    WEB_PORT = 8080
    DEBUG = True
    
    # API 설정
    API_HOST = "localhost"
    API_PORT = 5000
    API_PREFIX = "/api/v1"
    
    # 로깅 설정
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    @classmethod
    def ensure_directories(cls):
        """필요한 디렉토리들을 생성합니다."""
        directories = [
            cls.DATA_DIR,
            cls.RAW_DATA_DIR,
            cls.PROCESSED_DATA_DIR,
            cls.EXPORTS_DIR
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

class DevelopmentConfig(Config):
    """개발 환경 설정"""
    DEBUG = True
    LOG_LEVEL = "DEBUG"

class ProductionConfig(Config):
    """운영 환경 설정"""
    DEBUG = False
    LOG_LEVEL = "WARNING"
    WEB_HOST = "0.0.0.0"

class TestConfig(Config):
    """테스트 환경 설정"""
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    TEST_SIZE = 0.1  # 테스트용 작은 데이터셋

# 환경에 따른 설정 선택
def get_config():
    """환경 변수에 따라 적절한 설정을 반환합니다."""
    env = os.getenv('SALESAI_ENV', 'development').lower()
    
    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestConfig
    }
    
    return config_map.get(env, DevelopmentConfig)

# 현재 설정 인스턴스
current_config = get_config() 