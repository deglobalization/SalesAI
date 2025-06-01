#!/usr/bin/env python3
"""
SmartSalesTargetingEngine 모든 담당자별 추천 결과 사전 생성 스크립트
GitHub Pages용 정적 JSON 파일 생성

사용법:
python generate_all_recommendations.py

출력:
- manager_recommendations_data.json: 모든 담당자별 추천 결과가 포함된 JSON 파일
- manager_list.json: 사용 가능한 담당자 목록
"""

import json
import pandas as pd
import os
import glob
from datetime import datetime
from SmartSalesTargetingEngine import SmartSalesTargetingEngine
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_manager_data(manager_name):
    """담당자별 데이터 로드"""
    try:
        file_path = f'manager_data/manager_{manager_name}.csv'
        if not os.path.exists(file_path):
            logger.error(f"파일을 찾을 수 없습니다: {file_path}")
            return None
            
        data = pd.read_csv(file_path, encoding='utf-8')
        
        # 담당자 데이터의 '지역' 컬럼을 '권역'으로 이름 변경 (SmartSalesTargetingEngine 호환성)
        if '지역' in data.columns and '권역' not in data.columns:
            data = data.rename(columns={'지역': '권역'})
            logger.info(f"  - '지역' 컬럼을 '권역'으로 변경")
        
        logger.info(f"{manager_name} 데이터 로드 완료: {len(data)}건")
        return data
    except Exception as e:
        logger.error(f"{manager_name} 데이터 로드 실패: {e}")
        return None

def get_all_managers():
    """manager_data 폴더에서 모든 담당자 목록 추출"""
    manager_files = glob.glob('manager_data/manager_*.csv')
    managers = []
    
    for file_path in manager_files:
        # 파일명에서 담당자명 추출
        filename = os.path.basename(file_path)
        manager_name = filename.replace('manager_', '').replace('.csv', '')
        managers.append(manager_name)
    
    logger.info(f"발견된 담당자: {len(managers)}명 - {managers}")
    return managers

def generate_manager_recommendations(manager_name):
    """특정 담당자에 대한 고품질 추천 결과 생성 (SmartSalesTargetingEngine 활용)"""
    logger.info(f"📊 {manager_name} 담당자 추천 결과 생성 중...")
    
    # 담당자 데이터 로드
    data = load_manager_data(manager_name)
    if data is None:
        return None
    
    try:
        # 데이터 전처리: NaN 값 처리
        data = data.dropna(subset=['총매출', '거래처코드', '품목군'])
        data = data[data['총매출'] > 0]  # 매출이 0보다 큰 데이터만
        
        if len(data) == 0:
            logger.error(f"  - {manager_name}: 유효한 데이터가 없습니다.")
            return None
        
        # SmartSalesTargetingEngine 초기화
        logger.info(f"  🤖 {manager_name}용 SmartSalesTargetingEngine 초기화 중...")
        engine = SmartSalesTargetingEngine()
        
        # 담당자 데이터로 엔진 완전 초기화 (프로파일링 포함)
        engine.load_and_prepare_data(data)
        logger.info(f"  - 거래처 프로필: {engine.customer_profiles.shape[0] if engine.customer_profiles is not None else 0}개")
        logger.info(f"  - 품목 프로필: {engine.product_profiles.shape[0] if engine.product_profiles is not None else 0}개")
        
        # 담당자의 품목군 목록
        manager_product_groups = data['품목군'].unique()
        logger.info(f"  - {manager_name} 담당 품목군: {len(manager_product_groups)}개")
        
        # 고품질 추천 결과 생성
        manager_recommendations = {}
        manager_market_analyses = {}
        manager_sales_plans = {}
        successful_products = 0
        
        # 각 품목군별로 SmartSalesTargetingEngine을 활용한 분석 수행
        for i, product_group in enumerate(manager_product_groups, 1):
            try:
                logger.info(f"    [{i}/{len(manager_product_groups)}] {product_group} 분석 중...")
                
                # SmartSalesTargetingEngine을 활용한 고품질 추천
                recommendations = engine.recommend_targets_for_product_group(
                    target_product_group=product_group, 
                    top_n=15,
                    exclude_existing=False
                )
                
                if recommendations and len(recommendations) > 0:
                    # 추천 결과를 고품질 형식으로 변환
                    high_quality_recs = []
                    for rec in recommendations:
                        # 기존 recommendations_data.json과 동일한 형식으로 변환
                        high_quality_rec = {
                            '거래처코드': int(rec.get('거래처코드', 0)),
                            '거래처명': str(rec.get('거래처명', '')),
                            '유사도점수': float(rec.get('유사도점수', 0.0)),
                            '성공확률': float(rec.get('성공확률', 0.0)),
                            '예상매출': int(rec.get('예상매출', 0)),
                            '진료과': str(rec.get('진료과', '')),
                            '진료과매칭점수': float(rec.get('진료과매칭점수', 0.0)),
                            '시설유형': str(rec.get('시설유형', 'Unknown')),
                            '거래처규모': str(rec.get('거래처규모', 'Unknown')),
                            '추천이유': str(rec.get('추천이유', f'{product_group} 품목군 타겟 분석'))
                        }
                        high_quality_recs.append(high_quality_rec)
                    
                    # 성공확률 순으로 정렬
                    high_quality_recs.sort(key=lambda x: x['성공확률'], reverse=True)
                    
                    # 시장 분석 생성
                    group_data = data[data['품목군'] == product_group]
                    market_analysis = {
                        '품목군': product_group,
                        '총매출': int(group_data['총매출'].sum()),
                        '거래처수': group_data['거래처코드'].nunique(),
                        '평균매출': int(group_data['총매출'].mean()),
                        '최대매출': int(group_data['총매출'].max()),
                        '추천타겟수': len(high_quality_recs),
                        '예상총매출': int(sum(rec['예상매출'] for rec in high_quality_recs)),
                        '평균성공확률': round(sum(rec['성공확률'] for rec in high_quality_recs) / len(high_quality_recs), 1),
                        '고확률타겟수': len([rec for rec in high_quality_recs if rec['성공확률'] >= 70]),
                        '진료과분포': {}
                    }
                    
                    # 진료과별 분포 계산
                    specialty_counts = {}
                    for rec in high_quality_recs:
                        specialty = rec['진료과']
                        specialty_counts[specialty] = specialty_counts.get(specialty, 0) + 1
                    market_analysis['진료과분포'] = specialty_counts
                    
                    # 영업 계획 생성
                    total_expected = market_analysis['예상총매출']
                    high_prob_targets = market_analysis['고확률타겟수']
                    
                    sales_plan = {
                        '품목군': product_group,
                        '목표매출': int(total_expected * 0.7),  # 예상 매출의 70%를 목표
                        '우선타겟수': min(high_prob_targets, 8),
                        '일반타겟수': min(len(high_quality_recs) - high_prob_targets, 7),
                        '기간': '3개월',
                        '주요전략': [],
                        '예상ROI': round((total_expected * 0.7) / max(group_data['총매출'].sum(), 1), 2)
                    }
                    
                    # 주요 전략 수립
                    if market_analysis['평균성공확률'] >= 70:
                        sales_plan['주요전략'].append('고확률 타겟 집중 공략')
                    if len(specialty_counts) <= 3:
                        sales_plan['주요전략'].append('특정 진료과 전문화')
                    if market_analysis['거래처수'] >= 10:
                        sales_plan['주요전략'].append('기존 고객 확대')
                    else:
                        sales_plan['주요전략'].append('신규 고객 개발')
                    
                    # 결과 저장
                    manager_recommendations[product_group] = high_quality_recs
                    manager_market_analyses[product_group] = market_analysis
                    manager_sales_plans[product_group] = sales_plan
                    successful_products += 1
                    
                    logger.info(f"      ✅ {product_group}: 추천 {len(high_quality_recs)}개 (평균확률: {market_analysis['평균성공확률']}%)")
                
                else:
                    logger.warning(f"      ⚠️  {product_group}: 추천 결과 없음")
                    manager_recommendations[product_group] = []
                    manager_market_analyses[product_group] = None
                    manager_sales_plans[product_group] = None
                
            except Exception as e:
                logger.error(f"      ❌ {product_group} 처리 오류: {e}")
                manager_recommendations[product_group] = []
                manager_market_analyses[product_group] = None
                manager_sales_plans[product_group] = None
        
        # 담당자 종합 정보 수집
        total_recommendations = sum(len(recs) for recs in manager_recommendations.values() if recs)
        successful_analyses = len([ma for ma in manager_market_analyses.values() if ma])
        
        manager_info = {
            'name': manager_name,
            'total_records': len(data),
            'product_groups_count': len(manager_product_groups),
            'successful_product_groups': successful_products,
            'product_groups': manager_product_groups.tolist(),
            'total_sales': int(data['총매출'].sum()),
            'total_customers': data['거래처코드'].nunique(),
            'total_products': data['품목명'].nunique(),
            'date_range': {
                'from': int(data['기준년월'].min()),
                'to': int(data['기준년월'].max())
            },
            'recommendations_count': total_recommendations,
            'market_analyses_count': successful_analyses,
            'avg_success_rate': round(
                sum(ma['평균성공확률'] for ma in manager_market_analyses.values() if ma) / max(successful_analyses, 1), 1
            ),
            'total_expected_sales': int(sum(ma['예상총매출'] for ma in manager_market_analyses.values() if ma)),
            'engine_version': 'SmartSalesTargetingEngine v2.0',
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info(f"  ✅ {manager_name} 완료 - 추천: {total_recommendations}개, 평균 성공률: {manager_info['avg_success_rate']}%")
        
        return {
            'manager_info': manager_info,
            'recommendations': manager_recommendations,
            'market_analyses': manager_market_analyses,
            'sales_plans': manager_sales_plans
        }
        
    except Exception as e:
        logger.error(f"{manager_name} 추천 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return None

def generate_all_manager_recommendations():
    """모든 담당자에 대한 추천 결과 생성"""
    logger.info("🚀 모든 담당자별 추천 결과 생성 시작...")
    
    # 모든 담당자 목록 가져오기
    all_managers = get_all_managers()
    if not all_managers:
        logger.error("담당자 데이터 파일을 찾을 수 없습니다.")
        return False
    
    # 결과 저장용 딕셔너리
    all_manager_data = {}
    manager_summary = []
    
    # 각 담당자별로 추천 결과 생성
    for i, manager_name in enumerate(all_managers, 1):
        logger.info(f"\n[{i}/{len(all_managers)}] '{manager_name}' 처리 중...")
        
        manager_result = generate_manager_recommendations(manager_name)
        
        if manager_result:
            all_manager_data[manager_name] = manager_result
            manager_summary.append(manager_result['manager_info'])
            logger.info(f"  ✅ {manager_name} 완료 - 추천: {manager_result['manager_info']['recommendations_count']}개")
        else:
            logger.error(f"  ❌ {manager_name} 실패")
    
    # 담당자 목록 파일 저장
    manager_list_data = {
        'generated_at': datetime.now().isoformat(),
        'total_managers': len(all_managers),
        'successful_managers': len(manager_summary),
        'managers': sorted(manager_summary, key=lambda x: x['total_sales'], reverse=True)
    }
    
    with open('manager_list.json', 'w', encoding='utf-8') as f:
        json.dump(manager_list_data, f, ensure_ascii=False, indent=2)
    
    logger.info("✅ 담당자 목록 저장 완료: manager_list.json")
    
    # 전체 담당자별 추천 결과 통합
    manager_recommendations_data = {
        'generated_at': datetime.now().isoformat(),
        'engine_version': 'SmartSalesTargetingEngine v2.0',
        'total_managers': len(all_managers),
        'successful_managers': len(all_manager_data),
        'failed_managers': len(all_managers) - len(all_manager_data),
        'manager_data': all_manager_data
    }
    
    # JSON 파일로 저장
    with open('manager_recommendations_data.json', 'w', encoding='utf-8') as f:
        json.dump(manager_recommendations_data, f, ensure_ascii=False, indent=2)
    
    logger.info("✅ 전체 담당자별 추천 결과 저장 완료: manager_recommendations_data.json")
    
    # 파일 크기 확인
    json_size = os.path.getsize('manager_recommendations_data.json') / (1024 * 1024)  # MB
    list_size = os.path.getsize('manager_list.json') / 1024  # KB
    
    logger.info(f"\n📊 생성 완료 요약:")
    logger.info(f"  - 처리된 담당자: {len(all_manager_data)}/{len(all_managers)}명")
    logger.info(f"  - 총 추천 건수: {sum(mgr['manager_info']['recommendations_count'] for mgr in all_manager_data.values())}개")
    logger.info(f"  - manager_recommendations_data.json: {json_size:.2f} MB")
    logger.info(f"  - manager_list.json: {list_size:.2f} KB")
    logger.info(f"  - 생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return True

def validate_json_files():
    """생성된 JSON 파일 검증"""
    logger.info("🔍 JSON 파일 검증 중...")
    
    try:
        # manager_recommendations_data.json 검증
        with open('manager_recommendations_data.json', 'r', encoding='utf-8') as f:
            rec_data = json.load(f)
        
        logger.info(f"  - manager_recommendations_data.json: {len(rec_data['manager_data'])}개 담당자")
        
        # manager_list.json 검증
        with open('manager_list.json', 'r', encoding='utf-8') as f:
            list_data = json.load(f)
        
        logger.info(f"  - manager_list.json: {len(list_data['managers'])}개 담당자")
        
        # 일치성 검증
        if len(rec_data['manager_data']) == len(list_data['managers']):
            logger.info("✅ 파일 검증 성공")
            return True
        else:
            logger.error("❌ 파일 간 담당자 수 불일치")
            return False
            
    except Exception as e:
        logger.error(f"❌ 파일 검증 실패: {e}")
        return False

if __name__ == "__main__":
    print("🎯 SmartSalesTargetingEngine 모든 담당자별 추천 결과 생성")
    print("=" * 60)
    
    success = generate_all_manager_recommendations()
    
    if success:
        print("\n🔍 파일 검증 중...")
        validate_json_files()
        
        print("\n🎉 모든 담당자별 추천 결과 생성 완료!")
        print("\n📁 생성된 파일:")
        print("  - manager_recommendations_data.json: 모든 담당자별 추천 결과")
        print("  - manager_list.json: 담당자 목록")
        print("\n💡 이제 이 JSON 파일들을 사용하여 정적 웹사이트를 구현할 수 있습니다.")
    else:
        print("\n❌ 추천 결과 생성 실패") 