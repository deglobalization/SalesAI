// advisor.html의 AI 코멘트 함수 패치
// 브라우저 개발자 도구 콘솔에서 이 파일을 실행하세요

console.log('🔧 AI 코멘트 함수 패치를 적용합니다...');

// 향상된 지능형 규칙 기반 코멘트 생성 (SalesAI-main 19 방식 차용)
function generateEnhancedFallbackComment(customer, segmentType, segment) {
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
}

// 기존 함수를 덮어쓰기
window.generateEnhancedFallbackComment = generateEnhancedFallbackComment;

console.log('✅ AI 코멘트 함수 패치가 성공적으로 적용되었습니다!');
console.log('🔄 세그먼트 상세 페이지를 새로고침하면 향상된 코멘트를 확인할 수 있습니다.');

// 테스트 데이터로 검증
const testCustomers = [
    {
        accountName: "이내과의원",
        recentMonthSales: 42770000,
        growthVs3Month: 1870000,
        growthVsYearAgo: 3060000
    },
    {
        accountName: "연세봄안과의원", 
        recentMonthSales: 19340000,
        growthVs3Month: 3680000,
        growthVsYearAgo: 2270000
    },
    {
        accountName: "미사위대항의원",
        recentMonthSales: 10500000,
        growthVs3Month: -540000,
        growthVsYearAgo: -2790000
    }
];

console.log('🧪 테스트 결과:');
testCustomers.forEach(customer => {
    const comment = generateEnhancedFallbackComment(customer, '', '');
    console.log(`${customer.accountName}: ${comment}`);
}); 