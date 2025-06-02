#!/usr/bin/env python3
"""
SalesAI 모듈화된 애플리케이션 메인 진입점
"""

import sys
import os
import logging
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.core.config.settings import current_config
from src.core.config.constants import LogConstants
from src.core.engines import SmartSalesTargetingEngine, SalesRecommendationEngine, HanmiProductClassifier
from src.core.utils.data_processor import DataProcessor

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, current_config.LOG_LEVEL),
    format=current_config.LOG_FORMAT
)

logger = logging.getLogger(__name__)

class SalesAIApplication:
    """SalesAI 메인 애플리케이션 클래스"""
    
    def __init__(self):
        self.config = current_config
        self.data_processor = DataProcessor()
        self.engines = {
            'smart_targeting': None,
            'sales_recommendation': None,
            'hanmi_classifier': None
        }
        
        # 필요한 디렉토리 생성
        self.config.ensure_directories()
        
        logger.info("SalesAI 애플리케이션 초기화 완료")
    
    def initialize_engines(self):
        """분석 엔진들을 초기화합니다."""
        try:
            self.engines['smart_targeting'] = SmartSalesTargetingEngine()
            self.engines['sales_recommendation'] = SalesRecommendationEngine()
            self.engines['hanmi_classifier'] = HanmiProductClassifier()
            
            logger.info("모든 분석 엔진 초기화 완료")
            return True
            
        except Exception as e:
            logger.error(f"엔진 초기화 실패: {e}")
            return False
    
    def load_data(self, file_path: str = None, sample_size: int = None):
        """데이터를 로드합니다."""
        if not file_path:
            file_path = str(self.config.DEFAULT_CSV_FILE)
        
        logger.info(f"데이터 로드 시작: {file_path}")
        
        # 데이터 처리기로 데이터 로드
        data = self.data_processor.load_csv_data(file_path)
        
        if data is None:
            logger.error("데이터 로드 실패")
            return False
        
        # 샘플링 적용
        if sample_size and sample_size < len(data):
            from src.core.utils.data_processor import sample_data
            data = sample_data(data, sample_size)
            logger.info(f"데이터 샘플링 적용: {len(data):,}개 레코드")
        
        # 모든 엔진에 데이터 설정
        for engine_name, engine in self.engines.items():
            if engine:
                if hasattr(engine, 'data'):
                    engine.data = data
                elif hasattr(engine, 'load_data'):
                    # CSV 파일 경로로 로드하는 엔진
                    engine.load_data(file_path)
        
        logger.info("모든 엔진에 데이터 로드 완료")
        return True
    
    def run_smart_targeting_analysis(self, product: str, top_n: int = 10):
        """스마트 타겟팅 분석을 실행합니다."""
        engine = self.engines['smart_targeting']
        
        if not engine or not hasattr(engine, 'data') or engine.data is None:
            logger.error("스마트 타겟팅 엔진이 준비되지 않았습니다.")
            return None
        
        try:
            logger.info(f"스마트 타겟팅 분석 시작: {product}")
            
            # 데이터 준비 및 분석 실행
            engine.load_and_prepare_data(engine.data)
            engine.build_predictive_models()
            
            # 추천 생성
            recommendations = engine.recommend_targets_for_product(product, top_n)
            market_analysis = engine.analyze_market_opportunity(product)
            sales_plan = engine.generate_sales_plan(product)
            
            result = {
                'product': product,
                'recommendations': recommendations,
                'market_analysis': market_analysis,
                'sales_plan': sales_plan
            }
            
            logger.info(f"스마트 타겟팅 분석 완료: {len(recommendations) if recommendations else 0}개 추천")
            return result
            
        except Exception as e:
            logger.error(f"스마트 타겟팅 분석 오류: {e}")
            return None
    
    def run_customer_segmentation(self):
        """고객 세분화 분석을 실행합니다."""
        engine = self.engines['sales_recommendation']
        
        if not engine:
            logger.error("영업 추천 엔진이 준비되지 않았습니다.")
            return None
        
        try:
            logger.info("고객 세분화 분석 시작")
            
            customers = engine.analyze_customers()
            products = engine.analyze_products()
            recommendations = engine.generate_sales_recommendations()
            
            result = {
                'customers': customers,
                'products': products,
                'recommendations': recommendations
            }
            
            logger.info(f"고객 세분화 분석 완료: {len(customers)}개 고객, {len(products)}개 품목")
            return result
            
        except Exception as e:
            logger.error(f"고객 세분화 분석 오류: {e}")
            return None
    
    def run_hanmi_analysis(self):
        """한미약품 특화 분석을 실행합니다."""
        engine = self.engines['hanmi_classifier']
        
        if not engine:
            logger.error("한미 분류기가 준비되지 않았습니다.")
            return None
        
        try:
            logger.info("한미약품 특화 분석 시작")
            
            # 데이터가 로드되어 있는지 확인
            if not hasattr(engine, 'data') or engine.data is None:
                logger.error("한미 분류기에 데이터가 로드되지 않았습니다.")
                return None
            
            classified_products = engine.classify_all_products()
            analysis_result = engine.generate_hanmi_sales_analysis()
            
            result = {
                'classified_products': classified_products,
                'analysis_result': analysis_result
            }
            
            logger.info("한미약품 특화 분석 완료")
            return result
            
        except Exception as e:
            logger.error(f"한미약품 분석 오류: {e}")
            return None
    
    def export_results(self, results: dict, output_dir: str = None):
        """분석 결과를 내보냅니다."""
        if not output_dir:
            output_dir = str(self.config.EXPORTS_DIR)
        
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            from src.core.utils.data_processor import export_to_excel
            import pandas as pd
            
            # 결과를 DataFrame으로 변환하여 Excel로 내보내기
            export_data = {}
            
            for analysis_type, data in results.items():
                if isinstance(data, dict):
                    for key, value in data.items():
                        if isinstance(value, (list, pd.DataFrame)):
                            if isinstance(value, list) and len(value) > 0:
                                export_data[f"{analysis_type}_{key}"] = pd.DataFrame(value)
                            elif isinstance(value, pd.DataFrame):
                                export_data[f"{analysis_type}_{key}"] = value
            
            if export_data:
                output_file = os.path.join(output_dir, 'salesai_analysis_results.xlsx')
                success = export_to_excel(export_data, output_file)
                
                if success:
                    logger.info(f"분석 결과 내보내기 완료: {output_file}")
                    return output_file
                else:
                    logger.error("분석 결과 내보내기 실패")
                    return None
            else:
                logger.warning("내보낼 데이터가 없습니다.")
                return None
                
        except Exception as e:
            logger.error(f"결과 내보내기 오류: {e}")
            return None

def main():
    """메인 실행 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SalesAI 모듈화된 애플리케이션')
    parser.add_argument('--data', type=str, help='CSV 데이터 파일 경로')
    parser.add_argument('--sample', type=int, help='샘플 데이터 크기')
    parser.add_argument('--product', type=str, help='스마트 타겟팅 분석할 품목명')
    parser.add_argument('--analysis', choices=['all', 'targeting', 'segmentation', 'hanmi'], 
                      default='all', help='실행할 분석 유형')
    parser.add_argument('--output', type=str, help='결과 출력 디렉토리')
    
    args = parser.parse_args()
    
    # 애플리케이션 초기화
    app = SalesAIApplication()
    
    if not app.initialize_engines():
        logger.error("엔진 초기화 실패")
        return 1
    
    # 데이터 로드
    if not app.load_data(args.data, args.sample):
        logger.error("데이터 로드 실패")
        return 1
    
    # 분석 실행
    results = {}
    
    if args.analysis in ['all', 'segmentation']:
        logger.info("고객 세분화 분석 실행...")
        segmentation_result = app.run_customer_segmentation()
        if segmentation_result:
            results['segmentation'] = segmentation_result
    
    if args.analysis in ['all', 'targeting'] and args.product:
        logger.info(f"스마트 타겟팅 분석 실행: {args.product}")
        targeting_result = app.run_smart_targeting_analysis(args.product)
        if targeting_result:
            results['targeting'] = targeting_result
    
    if args.analysis in ['all', 'hanmi']:
        logger.info("한미약품 특화 분석 실행...")
        hanmi_result = app.run_hanmi_analysis()
        if hanmi_result:
            results['hanmi'] = hanmi_result
    
    # 결과 내보내기
    if results:
        output_file = app.export_results(results, args.output)
        if output_file:
            print(f"\n✅ 분석 완료! 결과 파일: {output_file}")
        else:
            print("\n❌ 결과 내보내기 실패")
            return 1
    else:
        print("\n❌ 분석 결과가 없습니다.")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main()) 