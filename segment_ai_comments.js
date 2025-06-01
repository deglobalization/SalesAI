// 세그먼트 AI 코멘트 관련 함수들

// 다중 거래처 AI 코멘트 생성 (배치 처리)
async function generateBatchComments(customers, segmentType, segment) {
    // 폴백 시스템인 경우 즉시 처리
    if (aiProvider === 'fallback') {
        return customers.map(customer => 
            generateEnhancedFallbackComment(customer, segmentType, segment)
        );
    }

    const comments = [];
    const batchSize = aiProvider === 'huggingface' ? 2 : 3; // HF는 더 보수적으로
    
    for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        const batchPromises = batch.map(customer => 
            generateCustomerComment(customer, segmentType, segment)
        );
        
        try {
            const batchComments = await Promise.all(batchPromises);
            comments.push(...batchComments);
        } catch (error) {
            console.error('배치 AI 코멘트 생성 실패:', error);
            // 실패 시 향상된 폴백 코멘트 사용
            const fallbackComments = batch.map(customer => 
                generateEnhancedFallbackComment(customer, segmentType, segment)
            );
            comments.push(...fallbackComments);
        }
        
        // API 율제한 방지를 위한 딜레이 (공급자별로 다름)
        if (i + batchSize < customers.length) {
            const delay = aiProvider === 'huggingface' ? 1000 : 
                         aiProvider === 'chrome' ? 300 : 500;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return comments;
}

// 세그먼트 상세 테이블의 AI 코멘트 생성
async function generateSegmentAIComments(customers, segmentType, segment) {
    if (customers.length === 0) return;
    
    try {
        showStatus('🤖 AI가 거래처별 코멘트를 생성하고 있습니다...', 'info');
        
        // 배치로 코멘트 생성
        const comments = await generateBatchComments(customers, segmentType, segment);
        
        // UI 업데이트
        comments.forEach((comment, index) => {
            const commentElement = document.getElementById(`aiComment${index}`);
            if (commentElement) {
                commentElement.innerHTML = `
                    <span style="color: #00d4ff; font-weight: 500; font-style: normal;">
                        ${comment}
                    </span>
                `;
            }
        });
        
        showStatus(`✅ ${comments.length}개 거래처의 AI 코멘트가 생성되었습니다.`, 'success');
        
    } catch (error) {
        console.error('AI 코멘트 생성 실패:', error);
        
        // 실패 시 폴백 코멘트 표시
        customers.forEach((customer, index) => {
            const commentElement = document.getElementById(`aiComment${index}`);
            if (commentElement) {
                const fallbackComment = generateFallbackComment(customer);
                commentElement.innerHTML = `
                    <span style="color: #f59e0b; font-weight: 500; font-style: normal;">
                        ${fallbackComment}
                    </span>
                `;
            }
        });
        
        showStatus('⚠️ AI 코멘트 생성 실패, 기본 분석을 표시합니다.', 'warning');
    }
}

// 향상된 지능형 규칙 기반 코멘트 생성
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

// 레거시 함수 (하위 호환성)
function generateFallbackComment(customer) {
    return generateEnhancedFallbackComment(customer, '', '');
}

console.log('✅ 세그먼트 AI 코멘트 모듈이 로드되었습니다.'); 