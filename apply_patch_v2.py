#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

def apply_ai_comment_patch_v2():
    """advisor.html 파일의 AI 코멘트 함수를 향상된 로직으로 패치합니다. (개선된 버전)"""
    
    print("🔧 advisor.html AI 코멘트 함수 패치 V2를 시작합니다...")
    
    # 기존 파일 읽기
    with open('advisor.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 새로운 함수 정의 (더 정확한 성장률 계산)
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
    
    # 더 관대한 패턴으로 함수 찾기
    pattern = r'function generateEnhancedFallbackComment\(customer, segmentType, segment\) \{[\s\S]*?\n        \}'
    
    # 패턴 교체 실행
    if re.search(pattern, content):
        print("✅ generateEnhancedFallbackComment 함수를 발견했습니다. 교체를 진행합니다...")
        new_content = re.sub(pattern, new_function, content)
        
        # 파일에 쓰기
        with open('advisor.html', 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("✅ advisor.html 파일이 성공적으로 패치되었습니다!")
        print("🔄 브라우저에서 페이지를 새로고침하면 향상된 AI 코멘트를 확인할 수 있습니다.")
        
        # 실제 테스트 데이터로 검증
        print("\n🧪 패치 검증을 위한 테스트 결과:")
        test_customers = [
            {
                "accountName": "이내과의원",
                "recentMonthSales": 42770000,
                "growthVs3Month": 1870000,
                "growthVsYearAgo": 3060000
            },
            {
                "accountName": "연세봄안과의원", 
                "recentMonthSales": 19340000,
                "growthVs3Month": 3680000,
                "growthVsYearAgo": 2270000
            },
            {
                "accountName": "미사위대항의원",
                "recentMonthSales": 10500000,
                "growthVs3Month": -540000,
                "growthVsYearAgo": -2790000
            }
        ]
        
        for customer in test_customers:
            # JavaScript 로직을 Python으로 재현
            growth3Month = customer.get("growthVs3Month", 0)
            growthYearAgo = customer.get("growthVsYearAgo", 0)
            recentSales = customer.get("recentMonthSales", 0)
            
            growth3MonthRate = (growth3Month / recentSales) * 100 if recentSales > 0 else 0
            growthYearAgoRate = (growthYearAgo / recentSales) * 100 if recentSales > 0 else 0
            
            salesLevel = 'premium' if recentSales >= 100000000 else \
                        'high' if recentSales >= 50000000 else \
                        'medium' if recentSales >= 10000000 else 'low'
            
            isHighGrowth = growth3MonthRate > 20 or growthYearAgoRate > 30
            isGrowing = growth3Month > 0 and growthYearAgo > 0
            isRecovering = growth3Month > 0 and growthYearAgo <= 0
            isDeclining = growth3Month < 0 and growthYearAgo < 0
            isStagnant = abs(growth3MonthRate) < 5 and abs(growthYearAgoRate) < 10
            
            # 코멘트 결정
            if isDeclining and recentSales > 50000000:
                expected = '🚨 주요 고객 이탈 위험, 긴급 대응'
            elif isHighGrowth:
                expected = '🌟 최우선 관리 대상, 파트너십 강화' if salesLevel == 'premium' else '🚀 고성장 고객, 투자 확대 검토'
            elif isGrowing and salesLevel == 'premium':
                expected = '💎 핵심 고객, 장기 관계 심화'
            elif isRecovering:
                expected = '📈 회복 징후, 기회 포착 준비' if salesLevel == 'low' else '🔄 매출 회복 중, 모멘텀 유지'
            elif isDeclining:
                expected = '⚠️ 관계 재점검 필요' if salesLevel == 'low' else '📉 하락세 관리, 원인 분석 필요'
            elif isStagnant and salesLevel == 'premium':
                expected = '🔧 신규 기회 발굴, 관계 활성화'
            elif isStagnant:
                expected = '🤝 안정적 관계, 정기 소통 유지'
            else:
                if recentSales > 100000000:
                    expected = '💼 VIP 고객, 전담 관리 필요'
                elif recentSales > 50000000:
                    expected = '⭐ 중요 고객, 관계 강화 필요'
                elif recentSales > 10000000:
                    expected = '📊 성장 잠재력 평가 필요'
                else:
                    expected = '🌱 신규 기회 개발 검토'
            
            print(f"  {customer['accountName']}: {expected}")
            print(f"    └ 성장률: 3개월 {growth3MonthRate:.1f}%, 1년 {growthYearAgoRate:.1f}%")
        
        return True
    else:
        print("❌ generateEnhancedFallbackComment 함수를 찾을 수 없습니다.")
        # 함수 위치 수동 검색
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'generateEnhancedFallbackComment' in line:
                print(f"📍 {i+1}번째 줄에서 함수 발견: {line.strip()}")
        return False

if __name__ == "__main__":
    apply_ai_comment_patch_v2() 