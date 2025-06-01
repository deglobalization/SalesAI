#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from datetime import datetime

def calculate_total_summary():
    """
    manager_list.json에서 전체 담당자들의 핵심 지표 합계를 계산
    """
    
    # manager_list.json 파일 읽기
    try:
        with open('manager_list.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("manager_list.json 파일을 찾을 수 없습니다.")
        return None
    
    # 전체 담당자들의 지표 합계 계산
    total_summary = {
        "generated_at": datetime.now().isoformat(),
        "total_managers": data.get("total_managers", 0),
        "successful_managers": data.get("successful_managers", 0),
        "aggregated_metrics": {
            "total_records": 0,
            "total_sales": 0,
            "total_customers": 0,
            "total_products": 0,
            "total_recommendations": 0,
            "total_market_analyses": 0,
            "total_expected_sales": 0,
            "avg_success_rate": 0,
            "unique_product_groups": set()
        },
        "manager_details": []
    }
    
    managers = data.get("managers", [])
    success_rates = []
    
    for manager in managers:
        # 각 담당자의 핵심 지표 합산
        total_summary["aggregated_metrics"]["total_records"] += manager.get("total_records", 0)
        total_summary["aggregated_metrics"]["total_sales"] += manager.get("total_sales", 0)
        total_summary["aggregated_metrics"]["total_customers"] += manager.get("total_customers", 0)
        total_summary["aggregated_metrics"]["total_products"] += manager.get("total_products", 0)
        total_summary["aggregated_metrics"]["total_recommendations"] += manager.get("recommendations_count", 0)
        total_summary["aggregated_metrics"]["total_market_analyses"] += manager.get("market_analyses_count", 0)
        total_summary["aggregated_metrics"]["total_expected_sales"] += manager.get("total_expected_sales", 0)
        
        # 성공률 수집
        if manager.get("avg_success_rate"):
            success_rates.append(manager.get("avg_success_rate"))
        
        # 품목군 수집
        product_groups = manager.get("product_groups", [])
        total_summary["aggregated_metrics"]["unique_product_groups"].update(product_groups)
        
        # 담당자별 요약 정보
        manager_summary = {
            "name": manager.get("name"),
            "total_sales": manager.get("total_sales", 0),
            "total_customers": manager.get("total_customers", 0),
            "total_products": manager.get("total_products", 0),
            "product_groups_count": manager.get("product_groups_count", 0),
            "avg_success_rate": manager.get("avg_success_rate", 0),
            "total_expected_sales": manager.get("total_expected_sales", 0)
        }
        total_summary["manager_details"].append(manager_summary)
    
    # 평균 성공률 계산
    if success_rates:
        total_summary["aggregated_metrics"]["avg_success_rate"] = round(sum(success_rates) / len(success_rates), 2)
    
    # 고유 품목군 수를 숫자로 변환하고 리스트로 저장
    unique_product_groups = list(total_summary["aggregated_metrics"]["unique_product_groups"])
    total_summary["aggregated_metrics"]["unique_product_groups_count"] = len(unique_product_groups)
    total_summary["aggregated_metrics"]["unique_product_groups"] = sorted(unique_product_groups)
    
    # 추가 통계
    total_summary["statistics"] = {
        "avg_sales_per_manager": round(total_summary["aggregated_metrics"]["total_sales"] / len(managers), 2) if managers else 0,
        "avg_customers_per_manager": round(total_summary["aggregated_metrics"]["total_customers"] / len(managers), 2) if managers else 0,
        "avg_products_per_manager": round(total_summary["aggregated_metrics"]["total_products"] / len(managers), 2) if managers else 0,
        "total_success_rate": total_summary["aggregated_metrics"]["avg_success_rate"],
        "expected_roi": round((total_summary["aggregated_metrics"]["total_expected_sales"] / total_summary["aggregated_metrics"]["total_sales"]) * 100, 2) if total_summary["aggregated_metrics"]["total_sales"] > 0 else 0
    }
    
    return total_summary

def save_total_summary():
    """
    계산된 전체 요약을 JSON 파일로 저장
    """
    summary = calculate_total_summary()
    
    if summary:
        # total_managers_summary.json 파일로 저장
        filename = 'total_managers_summary.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 전체 담당자 핵심 지표 합계가 '{filename}' 파일에 저장되었습니다.")
        
        # 주요 지표 출력
        metrics = summary["aggregated_metrics"]
        stats = summary["statistics"]
        
        print("\n📊 전체 담당자 핵심 지표 합계:")
        print(f"• 총 담당자 수: {summary['total_managers']}명")
        print(f"• 총 매출액: {metrics['total_sales']:,}원")
        print(f"• 총 고객 수: {metrics['total_customers']:,}개")
        print(f"• 총 제품 수: {metrics['total_products']:,}개")
        print(f"• 총 품목군 수: {metrics['unique_product_groups_count']}개")
        print(f"• 총 추천 건수: {metrics['total_recommendations']:,}건")
        print(f"• 평균 성공률: {metrics['avg_success_rate']}%")
        print(f"• 총 예상 매출: {metrics['total_expected_sales']:,}원")
        print(f"• 예상 ROI: {stats['expected_roi']}%")
        
        return filename
    else:
        print("❌ 요약 계산에 실패했습니다.")
        return None

if __name__ == "__main__":
    save_total_summary() 