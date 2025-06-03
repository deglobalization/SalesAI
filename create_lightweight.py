import json
print('📊 경량화된 추천 데이터 생성 중...')

# 원본 데이터 로드
with open('manager_recommendations_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 경량화된 버전 생성
lightweight_data = {}

for manager_name, manager_info in data['manager_data'].items():
    if 'recommendations' in manager_info:
        for product_group, recommendations in manager_info['recommendations'].items():
            if product_group not in lightweight_data:
                lightweight_data[product_group] = []
            
            # 상위 5개만 선택하고 필수 정보만 유지
            top_recommendations = recommendations[:5]
            for rec in top_recommendations:
                lightweight_rec = {
                    '거래처명': rec.get('거래처명', 'Unknown'),
                    '유사도점수': rec.get('유사도점수', 0),
                    '성공확률': rec.get('성공확률', 0),
                    '예상매출': rec.get('예상매출', 0),
                    '추천이유': rec.get('추천이유', '데이터 기반 추천'),
                    '담당자': manager_name
                }
                lightweight_data[product_group].append(lightweight_rec)

# 각 품목군별로 최대 20개까지 제한
for product_group in lightweight_data:
    # 성공확률 순으로 정렬
    lightweight_data[product_group].sort(key=lambda x: x['성공확률'], reverse=True)
    lightweight_data[product_group] = lightweight_data[product_group][:20]

# 저장
output_data = {
    'generated_at': data.get('generated_at', ''),
    'total_product_groups': len(lightweight_data),
    'recommendations': lightweight_data
}

with open('recommendations_lightweight.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f'✅ 경량화 완료!')
print(f'   - 품목군 수: {len(lightweight_data)}')
print(f'   - 평균 추천수: {sum(len(recs) for recs in lightweight_data.values()) // len(lightweight_data) if lightweight_data else 0}') 