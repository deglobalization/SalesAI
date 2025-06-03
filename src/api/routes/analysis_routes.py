"""
분석 관련 API 라우트
"""

from flask import Blueprint, request, jsonify
import logging
from typing import Dict, Any

from ...core.engines import SmartSalesTargetingEngine, SalesRecommendationEngine
from ...core.utils.data_processor import DataProcessor
from ...core.config.constants import APIConstants

logger = logging.getLogger(__name__)

analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v1/analysis')

@analysis_bp.route('/customer-segmentation', methods=['POST'])
def customer_segmentation():
    """고객 세분화 분석 API"""
    try:
        data = request.get_json()
        
        if not data or 'csv_data' not in data:
            return jsonify({
                'status': APIConstants.ERROR,
                'message': APIConstants.MESSAGES['INVALID_DATA']
            }), APIConstants.HTTP_BAD_REQUEST
        
        # SalesRecommendationEngine 초기화
        engine = SalesRecommendationEngine()
        
        # 데이터 로드 및 분석
        if engine.load_data_from_dict(data['csv_data']):
            customers = engine.analyze_customers()
            products = engine.analyze_products()
            recommendations = engine.generate_sales_recommendations()
            
            return jsonify({
                'status': APIConstants.SUCCESS,
                'message': APIConstants.MESSAGES['ANALYSIS_COMPLETE'],
                'data': {
                    'customers': customers.to_dict('records'),
                    'products': products.to_dict('records'),
                    'recommendations': recommendations.to_dict('records')
                }
            })
        else:
            return jsonify({
                'status': APIConstants.ERROR,
                'message': APIConstants.MESSAGES['PROCESSING_ERROR']
            }), APIConstants.HTTP_INTERNAL_ERROR
    
    except Exception as e:
        logger.error(f"고객 세분화 분석 오류: {e}")
        return jsonify({
            'status': APIConstants.ERROR,
            'message': str(e)
        }), APIConstants.HTTP_INTERNAL_ERROR

@analysis_bp.route('/smart-targeting', methods=['POST'])
def smart_targeting():
    """스마트 타겟팅 분석 API"""
    try:
        data = request.get_json()
        
        if not data or 'product' not in data:
            return jsonify({
                'status': APIConstants.ERROR,
                'message': '품목명이 필요합니다.'
            }), APIConstants.HTTP_BAD_REQUEST
        
        product = data['product']
        top_n = data.get('top_n', 10)
        
        # SmartSalesTargetingEngine 초기화
        engine = SmartSalesTargetingEngine()
        
        # 데이터 로드
        csv_file = data.get('csv_file', 'rx-rawdata.csv')
        sample_size = data.get('sample_size')
        
        if not engine.load_data(csv_file, sample_size):
            return jsonify({
                'status': APIConstants.ERROR,
                'message': APIConstants.MESSAGES['FILE_NOT_FOUND']
            }), APIConstants.HTTP_NOT_FOUND
        
        # 분석 실행
        engine.build_customer_profiles()
        engine.build_product_profiles()
        
        # 추천 생성
        recommendations = engine.recommend_targets_for_product(product, top_n)
        market_analysis = engine.analyze_market_opportunity(product)
        sales_plan = engine.generate_sales_plan(product)
        
        return jsonify({
            'status': APIConstants.SUCCESS,
            'message': APIConstants.MESSAGES['RECOMMENDATIONS_GENERATED'],
            'data': {
                'recommendations': recommendations,
                'market_analysis': market_analysis,
                'sales_plan': sales_plan
            }
        })
    
    except Exception as e:
        logger.error(f"스마트 타겟팅 분석 오류: {e}")
        return jsonify({
            'status': APIConstants.ERROR,
            'message': str(e)
        }), APIConstants.HTTP_INTERNAL_ERROR

@analysis_bp.route('/manager/<manager_name>/recommendations', methods=['GET'])
def get_manager_recommendations(manager_name: str):
    """특정 담당자의 추천 결과 조회 API"""
    try:
        # manager_data에서 담당자 데이터 로드
        processor = DataProcessor()
        manager_file = f'manager_data/manager_{manager_name}.csv'
        
        data = processor.load_csv_data(manager_file)
        if data is None:
            return jsonify({
                'status': APIConstants.ERROR,
                'message': f'담당자 {manager_name}의 데이터를 찾을 수 없습니다.'
            }), APIConstants.HTTP_NOT_FOUND
        
        # SmartSalesTargetingEngine으로 분석
        engine = SmartSalesTargetingEngine()
        engine.data = data
        engine.build_customer_profiles()
        engine.build_product_profiles()
        
        # 모든 품목에 대한 추천 생성
        all_recommendations = {}
        products = data['품목군'].unique()
        
        for product in products[:10]:  # 상위 10개 품목만
            try:
                recommendations = engine.recommend_targets_for_product(product, 5)
                if recommendations:
                    all_recommendations[product] = recommendations
            except:
                continue
        
        return jsonify({
            'status': APIConstants.SUCCESS,
            'message': f'{manager_name} 담당자 추천 생성 완료',
            'data': {
                'manager': manager_name,
                'total_products': len(all_recommendations),
                'recommendations': all_recommendations
            }
        })
    
    except Exception as e:
        logger.error(f"담당자 추천 조회 오류: {e}")
        return jsonify({
            'status': APIConstants.ERROR,
            'message': str(e)
        }), APIConstants.HTTP_INTERNAL_ERROR

@analysis_bp.route('/health', methods=['GET'])
def health_check():
    """API 상태 확인"""
    return jsonify({
        'status': APIConstants.SUCCESS,
        'message': 'Analysis API is running',
        'version': '1.0.0'
    }) 