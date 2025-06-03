#!/usr/bin/env python3
"""
로컬 개발용 API 서버
GitHub Pages에서는 정적 파일만 사용하지만, 로컬에서는 API 서버가 필요합니다.
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # CORS 활성화

# 전역 데이터 캐시
_product_groups_cache = None
_recommendations_cache = None

def load_product_groups():
    """품목군 데이터 로드 및 캐싱"""
    global _product_groups_cache
    if _product_groups_cache is None:
        try:
            with open('product_groups.json', 'r', encoding='utf-8') as f:
                _product_groups_cache = json.load(f)
            print(f"✅ 품목군 데이터 로드 완료: {_product_groups_cache.get('total_count', 0)}개")
        except Exception as e:
            print(f"❌ 품목군 데이터 로드 실패: {e}")
            _product_groups_cache = {"error": "데이터 로드 실패"}
    return _product_groups_cache

def load_recommendations():
    """추천 데이터 로드 및 캐싱"""
    global _recommendations_cache
    if _recommendations_cache is None:
        try:
            with open('recommendations_data.json', 'r', encoding='utf-8') as f:
                _recommendations_cache = json.load(f)
            total_groups = len(_recommendations_cache.get('recommendations', {}))
            print(f"✅ 추천 데이터 로드 완료: {total_groups}개 품목군")
        except Exception as e:
            print(f"❌ 추천 데이터 로드 실패: {e}")
            _recommendations_cache = {"error": "데이터 로드 실패"}
    return _recommendations_cache

# 정적 파일 서빙 (HTML, CSS, JS)
@app.route('/')
def index():
    return send_from_directory('.', 'advisor.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

# API 엔드포인트들
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'server': 'Local Development Server',
        'message': 'SalesAI Local API Server',
        'data_status': {
            'product_groups_loaded': _product_groups_cache is not None,
            'recommendations_loaded': _recommendations_cache is not None
        }
    })

@app.route('/api/products')
def get_products():
    """품목군 목록 반환"""
    try:
        data = load_product_groups()
        if "error" in data:
            return jsonify(data), 500
        
        print(f"📋 품목군 목록 요청: {data.get('total_count', 0)}개 반환")
        return jsonify(data)
    except Exception as e:
        print(f"❌ 품목군 API 오류: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/managers')
def get_managers():
    try:
        with open('manager_list.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({'error': 'manager_list.json 파일을 찾을 수 없습니다'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommend', methods=['POST'])
def recommend():
    """품목군별 고객 추천 API - 담당자별 필터링 지원"""
    try:
        # POST 요청 데이터 파싱
        request_data = request.get_json()
        if not request_data:
            return jsonify({
                'success': False,
                'recommendations': [],
                'message': '요청 데이터가 없습니다'
            }), 400
        
        product_group = request_data.get('product_group')
        manager = request_data.get('manager', '전체')
        
        if not product_group:
            return jsonify({
                'success': False,
                'recommendations': [],
                'message': 'product_group이 필요합니다'
            }), 400
        
        print(f"📤 추천 요청: '{product_group}', 담당자: '{manager}'")
        
        # 담당자별 추천 데이터 사용
        if manager != '전체':
            # 담당자별 데이터 사용
            try:
                with open('manager_recommendations_data.json', 'r', encoding='utf-8') as f:
                    manager_data = json.load(f)
                
                if manager not in manager_data.get('manager_data', {}):
                    available_managers = list(manager_data.get('manager_data', {}).keys())[:10]
                    return jsonify({
                        'success': False,
                        'recommendations': [],
                        'message': f"'{manager}' 담당자 데이터가 없습니다",
                        'available_managers_sample': available_managers
                    })
                
                manager_recommendations = manager_data['manager_data'][manager].get('recommendations', {})
                product_recs = manager_recommendations.get(product_group, [])
                
                print(f"✅ '{manager}' 담당자의 '{product_group}' 데이터: {len(product_recs)}개")
                
            except FileNotFoundError:
                print("⚠️ manager_recommendations_data.json 파일이 없어서 전체 데이터를 사용합니다")
                # 전체 데이터로 fallback
                recommendations_data = load_recommendations()
                if "error" in recommendations_data:
                    return jsonify({
                        'success': False,
                        'recommendations': [],
                        'message': '추천 데이터 로드 실패'
                    }), 500
                
                all_recommendations = recommendations_data.get('recommendations', {})
                product_recs = all_recommendations.get(product_group, [])
                
        else:
            # 전체 담당자 데이터 사용
            recommendations_data = load_recommendations()
            if "error" in recommendations_data:
                return jsonify({
                    'success': False,
                    'recommendations': [],
                    'message': '추천 데이터 로드 실패'
                }), 500
            
            all_recommendations = recommendations_data.get('recommendations', {})
            product_recs = all_recommendations.get(product_group, [])
        
        if not product_recs:
            print(f"❌ '{product_group}' 품목군 데이터 없음 (담당자: {manager})")
            
            return jsonify({
                'success': False,
                'recommendations': [],
                'message': f"'{product_group}' 품목군의 추천 데이터가 없습니다 (담당자: {manager})"
            })
        
        print(f"✅ '{product_group}' 추천 데이터 발견: {len(product_recs)}개")
        
        # 추천 데이터 포맷팅 (최대 20개)
        formatted_recs = []
        for i, rec in enumerate(product_recs[:20]):
            try:
                # 프론트엔드에서 요구하는 정확한 구조
                formatted_rec = {
                    'customer': {
                        'name': rec.get('거래처명', f'Unknown_{i}'),
                        'accountName': rec.get('거래처명', f'Unknown_{i}'),  # 🏥 표시용
                        'code': rec.get('거래처코드', 'N/A'),
                        'accountCode': rec.get('거래처코드', 'N/A'),  # 호환성
                        'specialty': rec.get('진료과', 'Unknown'),
                        'facilityType': rec.get('시설유형', 'Unknown'),
                        'scale': rec.get('거래처규모', 'Unknown'),
                        'size': rec.get('거래처규모', 'Unknown'),  # 호환성
                        'manager': manager if manager != '전체' else '미배정'
                    },
                    'analysis': f"유사도: {rec.get('유사도점수', 'N/A')} | 성공확률: {rec.get('성공확률', 'N/A')}%",
                    'confidence': float(rec.get('성공확률', 75)),  # 퍼센트 형태로 (성공률 표시용)
                    'productName': product_group,
                    'similarityScore': rec.get('유사도점수', 'N/A'),
                    'expectedRevenue': rec.get('예상매출', 0),
                    'specialtyMatchScore': rec.get('진료과매칭점수', 0),
                    
                    # strategies 배열 - 프론트엔드에서 기대하는 구조
                    'strategies': [{
                        'title': rec.get('거래처명', f'Unknown_{i}'),
                        'description': rec.get('추천이유', '데이터 기반 추천'),
                        'priority': 'high' if rec.get('성공확률', 0) > 80 else 'medium' if rec.get('성공확률', 0) > 60 else 'low',
                        'confidence': float(rec.get('성공확률', 75)) / 100,  # 0-1 범위 (신뢰도 표시용)
                        'expectedSales': round(rec.get('예상매출', 0) / 10000),  # 만원 단위로 변환
                        'timeline': '즉시',
                        'specialty_match': rec.get('진료과매칭점수', 0),
                        'explanation': rec.get('추천이유', '데이터 기반 추천')
                    }],
                    
                    # 추가 호환성 필드들
                    'customerCode': rec.get('거래처코드', 'N/A'),
                    'specialty': rec.get('진료과', 'Unknown'),
                    'facilityType': rec.get('시설유형', 'Unknown'),
                    'customerSize': rec.get('거래처규모', 'Unknown'),
                    'name': rec.get('거래처명', f'Unknown_{i}'),
                    'successRate': rec.get('성공확률', 75),
                    'reason': rec.get('추천이유', '데이터 기반 추천'),
                    'score': rec.get('유사도점수', 1.0),
                }
                formatted_recs.append(formatted_rec)
            except Exception as rec_error:
                print(f"⚠️ 추천 #{i} 포맷팅 오류: {rec_error}")
                continue
        
        response_data = {
            'success': True,
            'recommendations': formatted_recs,
            'message': f'{len(formatted_recs)}개 추천 제공 (총 {len(product_recs)}개 중, 담당자: {manager})',
            'total_available': len(product_recs),
            'product_group': product_group,
            'manager': manager
        }
        
        print(f"🎯 응답 완료: {len(formatted_recs)}개 추천 반환 (담당자: {manager})")
        return jsonify(response_data)
        
    except json.JSONDecodeError:
        return jsonify({
            'success': False,
            'recommendations': [],
            'message': 'JSON 파싱 오류'
        }), 400
    except Exception as e:
        print(f"❌ 추천 처리 중 오류: {e}")
        return jsonify({
            'success': False,
            'recommendations': [],
            'message': f'서버 오류: {str(e)}'
        }), 500

@app.route('/api/recommend/debug')
def recommend_debug():
    """디버깅용 엔드포인트 - 사용 가능한 품목군 목록"""
    try:
        recommendations_data = load_recommendations()
        if "error" in recommendations_data:
            return jsonify(recommendations_data), 500
        
        all_recommendations = recommendations_data.get('recommendations', {})
        product_groups = list(all_recommendations.keys())
        
        # 각 품목군별 추천 수 카운트
        group_counts = {
            group: len(recs) for group, recs in all_recommendations.items()
        }
        
        return jsonify({
            'total_groups': len(product_groups),
            'sample_groups': product_groups[:20],  # 처음 20개
            'group_counts_sample': dict(list(group_counts.items())[:10])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 로컬 API 서버 시작...")
    print("📍 URL: http://localhost:8101")
    print("📋 API 엔드포인트:")
    print("   - GET  /api/health")
    print("   - GET  /api/products") 
    print("   - GET  /api/managers")
    print("   - POST /api/recommend")
    print("   - GET  /api/recommend/debug")
    print("\n🔧 데이터 파일 로딩 중...")
    
    # 시작 시 데이터 미리 로드
    load_product_groups()
    load_recommendations()
    
    print("✅ 서버 준비 완료!")
    app.run(host='0.0.0.0', port=8101, debug=True) 