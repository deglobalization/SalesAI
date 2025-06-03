#!/usr/bin/env python3
import json

# 데이터 로드
with open('manager_recommendations_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=== 모든 담당자별 분석 품질 요약 ===')
print(f'총 담당자: {data["total_managers"]}명')
print(f'성공한 담당자: {data["successful_managers"]}명')
print()

total_recommendations = 0
total_success_rate = 0
successful_managers = 0

for manager, mgr_data in data['manager_data'].items():
    info = mgr_data['manager_info']
    total_recommendations += info['recommendations_count']
    if info['avg_success_rate'] > 0:
        total_success_rate += info['avg_success_rate']
        successful_managers += 1
    
    print(f'{manager:8s}: 품목군 {info["product_groups_count"]:3d}개, 추천 {info["recommendations_count"]:4d}개, 성공률 {info["avg_success_rate"]:5.1f}%')

print()
print(f'전체 요약:')
print(f'  - 총 추천 건수: {total_recommendations:,}개')
print(f'  - 평균 성공률: {total_success_rate/max(successful_managers,1):.1f}%')

# 샘플 추천 상세 확인
print('\n=== 김서연 담당자 오잘탄 품목 상위 3개 추천 ===')
kim_data = data['manager_data'].get('김서연')
if kim_data and '오잘탄' in kim_data['recommendations']:
    recommendations = kim_data['recommendations']['오잘탄'][:3]
    for i, rec in enumerate(recommendations, 1):
        print(f'{i}. {rec["거래처명"]} (성공률: {rec["성공확률"]}%, 예상매출: {rec["예상매출"]:,}원)')
        print(f'   진료과: {rec["진료과"]}, 매칭점수: {rec["진료과매칭점수"]}, 추천이유: {rec["추천이유"]}')
        print() 