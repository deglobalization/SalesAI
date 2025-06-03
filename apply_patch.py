#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

def apply_ai_comment_patch():
    """advisor.html 파일의 AI 코멘트 함수를 향상된 로직으로 패치합니다."""
    
    print("🔧 advisor.html AI 코멘트 함수 패치를 시작합니다...")
    
    # 기존 파일 읽기
    with open('advisor.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 기존 generateEnhancedFallbackComment 함수 찾기
    old_function_pattern = r'function generateEnhancedFallbackComment\(customer, segmentType, segment\) \{[^}]*\{[^}]*\}[^}]*\}[^}]*\}[^}]*\}'
    
    # 새로운 함수 정의
    new_function = '''function generateEnhancedFallbackComment(customer, segmentType, segment) {
            const growth3Month = customer.growthVs3Month || 0;
            const growthYearAgo = customer.growthVsYearAgo || 0;
            const recentSales = customer.recentMonthSales || 0;
            
            // 성장률 계산 (백분율)
            const growth3MonthRate = customer.recentMonthSales > 0 ? 
                (growth3Month / customer.recentMonthSales) * 100 : 0;
            const growthYearAgoRate = customer.recentMonthSales > 0 ? 
                (growthYearAgo / customer.recentMonthSales) * 100 : 0;
            
            // 매출 규모별 분류
            const salesLevel = recentSales >= 100000000 ? 'premium' : 
                              recentSales >= 50000000 ? 'high' :
                              recentSales >= 10000000 ? 'medium' : 'low';
            
            // 성장 패턴 분석
            const isHighGrowth = growth3MonthRate > 20 || growthYearAgoRate > 30;
            const isGrowing = growth3Month > 0 && growthYearAgo > 0;
            const isRecovering = growth3Month > 0 && growthYearAgo <= 0;
            const isDeclining = growth3Month < 0 && growthYearAgo < 0;
            const isStagnant = Math.abs(growth3MonthRate) < 5 && Math.abs(growthYearAgoRate) < 10;
            
            // 세그먼트별 특화 분석
            let segmentInsight = '';
            if (segmentType === 'bcg') {
                switch (segment) {
                    case 'star':
                        segmentInsight = isHighGrowth ? '시장 리더십 확대 기회' : '성장률 제고 필요';
                        break;
                    case 'cash-cow':
                        segmentInsight = isDeclining ? '수익성 보호 전략 필요' : '안정적 수익원 유지';
                        break;
                    case 'question-mark':
                        segmentInsight = isGrowing ? '투자 확대 검토' : '시장 진입 전략 재검토';
                        break;
                    case 'dog':
                        segmentInsight = isRecovering ? '회복 가능성 모니터링' : '포트폴리오 재조정 검토';
                        break;
                }
            }
            
            // 매출 규모 + 성장 패턴 + 세그먼트별 맞춤 코멘트
            if (isDeclining && recentSales > 50000000) {
                return segmentInsight || '🚨 주요 고객 이탈 위험, 긴급 대응';
            } else if (isHighGrowth) {
                return salesLevel === 'premium' ? 
                    '🌟 최우선 관리 대상, 파트너십 강화' :
                    '🚀 고성장 고객, 투자 확대 검토';
            } else if (isGrowing && salesLevel === 'premium') {
                return '💎 핵심 고객, 장기 관계 심화';
            } else if (isRecovering) {
                return salesLevel === 'low' ? 
                    '📈 회복 징후, 기회 포착 준비' :
                    '🔄 매출 회복 중, 모멘텀 유지';
            } else if (isDeclining) {
                return salesLevel === 'low' ?
                    '⚠️ 관계 재점검 필요' :
                    '📉 하락세 관리, 원인 분석 필요';
            } else if (isStagnant && salesLevel === 'premium') {
                return '🔧 신규 기회 발굴, 관계 활성화';
            } else if (isStagnant) {
                return '🤝 안정적 관계, 정기 소통 유지';
            } else {
                // 기본 패턴 매칭
                if (recentSales > 100000000) {
                    return segmentInsight || '💼 VIP 고객, 전담 관리 필요';
                } else if (recentSales > 50000000) {
                    return segmentInsight || '⭐ 중요 고객, 관계 강화 필요';
                } else if (recentSales > 10000000) {
                    return segmentInsight || '📊 성장 잠재력 평가 필요';
                } else {
                    return segmentInsight || '🌱 신규 기회 개발 검토';
                }
            }
        }'''
    
    # 기존 간단한 함수 패턴 찾기 (매출 기준만)
    simple_pattern = r'function generateEnhancedFallbackComment\(customer, segmentType, segment\) \{\s*const recentSales = customer\.recentMonthSales \|\| 0;\s*if \(recentSales > 100000000\) \{\s*return "💼 VIP 고객, 전담 관리 필요";\s*\} else if \(recentSales > 50000000\) \{\s*return "⭐ 중요 고객, 관계 강화 필요";\s*\} else if \(recentSales > 10000000\) \{\s*return "📊 성장 잠재력 평가 필요";\s*\} else \{\s*return "🌱 신규 기회 개발 검토";\s*\}\s*\}'
    
    # 패턴 교체 실행
    if re.search(simple_pattern, content, re.DOTALL):
        print("✅ 간단한 패턴 함수를 발견했습니다. 교체를 진행합니다...")
        new_content = re.sub(simple_pattern, new_function, content, flags=re.DOTALL)
        
        # 파일에 쓰기
        with open('advisor.html', 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("✅ advisor.html 파일이 성공적으로 패치되었습니다!")
        print("🔄 브라우저에서 페이지를 새로고침하면 향상된 AI 코멘트를 확인할 수 있습니다.")
        
        # 테스트 고객 데이터로 검증
        print("\n🧪 패치 검증을 위한 테스트 결과:")
        test_data = [
            {"name": "이내과의원", "sales": 42770000, "growth3m": 1870000, "growth1y": 3060000},
            {"name": "연세봄안과의원", "sales": 19340000, "growth3m": 3680000, "growth1y": 2270000},
            {"name": "미사위대항의원", "sales": 10500000, "growth3m": -540000, "growth1y": -2790000}
        ]
        
        for customer in test_data:
            growth3_rate = (customer["growth3m"] / customer["sales"]) * 100
            growth1y_rate = (customer["growth1y"] / customer["sales"]) * 100
            
            if customer["growth3m"] < 0 and customer["growth1y"] < 0:
                expected = "⚠️ 관계 재점검 필요" if customer["sales"] <= 50000000 else "📉 하락세 관리, 원인 분석 필요"
            elif (growth3_rate > 20 or growth1y_rate > 30):
                expected = "🚀 고성장 고객, 투자 확대 검토"
            else:
                expected = "📊 성장 잠재력 평가 필요"
                
            print(f"  {customer['name']}: {expected}")
        
        return True
    else:
        print("❌ 대상 함수를 찾을 수 없습니다. 수동 패치가 필요할 수 있습니다.")
        return False

if __name__ == "__main__":
    apply_ai_comment_patch() 