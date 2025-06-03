// 세그먼트 AI 코멘트 관련 함수들

// 고객 생애주기 단계 분석 함수
function analyzeCustomerLifecycle(customer) {
    const recentSales = customer.recentMonthSales || 0;
    const growth3Month = customer.growthVs3Month || 0;
    const growthYearAgo = customer.growthVsYearAgo || 0;
    const totalSales = customer.totalSales || 0;
    const uniqueProducts = customer.uniqueProducts || 0;
    
    // 성장률 계산
    const growth3MonthRate = recentSales > 0 ? (growth3Month / recentSales) * 100 : 0;
    const growthYearAgoRate = recentSales > 0 ? (growthYearAgo / recentSales) * 100 : 0;
    
    // 매출 안정성 지표 (연간 대비 최근 월 비중)
    const salesStability = totalSales > 0 ? (recentSales * 12) / totalSales : 0;
    
    // 생애주기 단계 결정
    let lifecycleStage = '';
    let maturityLevel = '';
    let potential = '';
    
    // 1. 도입기 (Introduction)
    if (recentSales < 10000000 && growth3MonthRate > 30) {
        lifecycleStage = 'introduction';
        maturityLevel = 'low';
        potential = 'high';
    }
    // 2. 성장기 (Growth)
    else if (growth3MonthRate > 15 && growthYearAgoRate > 10 && recentSales >= 10000000) {
        lifecycleStage = 'growth';
        maturityLevel = 'medium';
        potential = 'high';
    }
    // 3. 성숙기 (Maturity)
    else if (recentSales >= 50000000 && Math.abs(growth3MonthRate) < 10 && salesStability > 0.8) {
        lifecycleStage = 'maturity';
        maturityLevel = 'high';
        potential = 'medium';
    }
    // 4. 쇠퇴기 (Decline)
    else if (growth3MonthRate < -10 && growthYearAgoRate < -5) {
        lifecycleStage = 'decline';
        maturityLevel = 'high';
        potential = 'low';
    }
    // 5. 재활성화기 (Revival)
    else if (growth3Month > 0 && growthYearAgo <= 0 && growth3MonthRate > 10) {
        lifecycleStage = 'revival';
        maturityLevel = 'medium';
        potential = 'medium';
    }
    // 6. 안정기 (Stable)
    else {
        lifecycleStage = 'stable';
        maturityLevel = recentSales >= 30000000 ? 'high' : 'medium';
        potential = growth3MonthRate > 5 ? 'medium' : 'low';
    }
    
    return {
        stage: lifecycleStage,
        maturity: maturityLevel,
        potential: potential,
        salesStability: salesStability,
        growth3MonthRate: growth3MonthRate,
        growthYearAgoRate: growthYearAgoRate
    };
}

// 생애주기 기반 전략 추천
function getLifecycleStrategy(lifecycle, customer) {
    const { stage, maturity, potential } = lifecycle;
    const recentSales = customer.recentMonthSales || 0;
    
    switch (stage) {
        case 'introduction':
            if (potential === 'high') {
                return '🌱 신규 도약기, 집중 투자로 성장 가속화';
            }
            return '🌿 초기 관계 구축, 신뢰 기반 확대';
            
        case 'growth':
            if (recentSales >= 50000000) {
                return '🚀 고성장 핵심고객, 전략적 파트너십 강화';
            }
            return '📈 성장 모멘텀 유지, 확장 기회 포착';
            
        case 'maturity':
            if (maturity === 'high' && recentSales >= 100000000) {
                return '💎 프리미엄 파트너, 장기 가치 극대화';
            }
            return '🔄 관계 심화, 새로운 가치 창출 탐색';
            
        case 'decline':
            if (recentSales >= 30000000) {
                return '🚨 주요고객 회복 프로그램, 긴급 대응';
            }
            return '⚠️ 관계 재정립, 손실 최소화 전략';
            
        case 'revival':
            return '🔥 재도약 지원, 회복 모멘텀 강화';
            
        case 'stable':
            if (potential === 'medium') {
                return '⚖️ 안정성 유지, 추가 성장 동력 발굴';
            }
            return '🤝 지속 관계 유지, 효율적 관리';
            
        default:
            return '📊 생애주기 분석 완료, 맞춤 전략 수립';
    }
}

// 미래 잠재력 평가
function assessFuturePotential(customer, lifecycle) {
    const { stage, potential, growth3MonthRate } = lifecycle;
    const recentSales = customer.recentMonthSales || 0;
    const uniqueProducts = customer.uniqueProducts || 0;
    
    // 잠재력 점수 계산 (0-100)
    let potentialScore = 0;
    
    // 생애주기 단계별 기본 점수
    switch (stage) {
        case 'introduction': potentialScore += 40; break;
        case 'growth': potentialScore += 35; break;
        case 'revival': potentialScore += 30; break;
        case 'stable': potentialScore += 20; break;
        case 'maturity': potentialScore += 15; break;
        case 'decline': potentialScore += 10; break;
    }
    
    // 성장률 보정
    if (growth3MonthRate > 30) potentialScore += 25;
    else if (growth3MonthRate > 15) potentialScore += 15;
    else if (growth3MonthRate > 5) potentialScore += 10;
    else if (growth3MonthRate < -10) potentialScore -= 15;
    
    // 매출 규모 보정
    if (recentSales >= 100000000) potentialScore += 20;
    else if (recentSales >= 50000000) potentialScore += 15;
    else if (recentSales >= 10000000) potentialScore += 10;
    
    // 제품 다양성 보정
    if (uniqueProducts >= 5) potentialScore += 10;
    else if (uniqueProducts >= 3) potentialScore += 5;
    
    // 최종 점수 조정
    potentialScore = Math.max(0, Math.min(100, potentialScore));
    
    return {
        score: potentialScore,
        level: potentialScore >= 70 ? 'high' : 
               potentialScore >= 40 ? 'medium' : 'low',
        timeHorizon: stage === 'introduction' || stage === 'growth' ? 'short' :
                    stage === 'revival' ? 'medium' : 'long'
    };
}

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
            // 실패 시 향상된 기존 방식 폴백 코멘트 사용
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
        showStatus('🤖 AI가 거래처별 생애주기 분석 코멘트를 생성하고 있습니다...', 'info');
        
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
        
        showStatus(`✅ ${comments.length}개 거래처의 생애주기 기반 AI 코멘트가 생성되었습니다.`, 'success');
        
    } catch (error) {
        console.error('AI 코멘트 생성 실패:', error);
        
        // 실패 시 폴백 코멘트 표시
        customers.forEach((customer, index) => {
            const commentElement = document.getElementById(`aiComment${index}`);
            if (commentElement) {
                const fallbackComment = generateEnhancedFallbackComment(customer, '', '');
                commentElement.innerHTML = `
                    <span style="color: #f59e0b; font-weight: 500; font-style: normal;">
                        ${fallbackComment}
                    </span>
                `;
            }
        });
        
        showStatus('⚠️ AI 코멘트 생성 실패, 생애주기 기반 분석을 표시합니다.', 'warning');
    }
}

// 생애주기 기반 향상된 AI 코멘트 생성
function generateLifecycleBasedComment(customer, segmentType, segment) {
    // 생애주기 분석
    const lifecycle = analyzeCustomerLifecycle(customer);
    const futurePotential = assessFuturePotential(customer, lifecycle);
    
    // 기본 생애주기 전략
    const lifecycleStrategy = getLifecycleStrategy(lifecycle, customer);
    
    // 세그먼트별 특화 분석
    let segmentInsight = '';
    if (segmentType === 'bcg') {
        switch (segment) {
            case 'star':
                if (lifecycle.stage === 'growth') {
                    segmentInsight = '⭐ 고성장 스타, 장기 투자 확대';
                } else if (lifecycle.stage === 'maturity') {
                    segmentInsight = '💫 성숙 스타, 수익성 최적화';
                } else {
                    segmentInsight = '🌟 스타 잠재력, 성장 동력 강화';
                }
                break;
            case 'cash-cow':
                if (lifecycle.stage === 'maturity') {
                    segmentInsight = '🐄 안정 수익원, 효율성 극대화';
                } else if (lifecycle.stage === 'decline') {
                    segmentInsight = '⚠️ 수익원 보호, 관계 복구 시급';
                } else {
                    segmentInsight = '💰 수익 기반 구축, 장기 관리';
                }
                break;
            case 'question-mark':
                if (lifecycle.stage === 'introduction' || lifecycle.stage === 'growth') {
                    segmentInsight = '❓ 성장 잠재력 검증, 선택적 투자';
                } else {
                    segmentInsight = '🤔 시장 포지션 재평가 필요';
                }
                break;
            case 'dog':
                if (lifecycle.stage === 'revival') {
                    segmentInsight = '🔄 회생 가능성, 단계적 지원';
                } else {
                    segmentInsight = '🐕 포트폴리오 재검토, 효율성 중심';
                }
                break;
        }
    }
    
    // 잠재력 기반 우선순위 조정
    const priorityAdjustment = futurePotential.level === 'high' ? ' [고잠재력]' :
                              futurePotential.level === 'medium' ? ' [중잠재력]' : '';
    
    // 시간 관점 추가
    const timeHorizonNote = futurePotential.timeHorizon === 'short' ? ' (단기집중)' :
                           futurePotential.timeHorizon === 'medium' ? ' (중기전략)' : ' (장기관리)';
    
    // 최종 코멘트 조합
    let finalComment = segmentInsight || lifecycleStrategy;
    
    // 특별 상황 우선 처리
    if (lifecycle.stage === 'decline' && customer.recentMonthSales >= 50000000) {
        finalComment = '🚨 주요고객 위험, 생애주기 재활성화 긴급';
    } else if (lifecycle.stage === 'introduction' && futurePotential.level === 'high') {
        finalComment = '🌱 신성장 동력, 생애주기 초기 집중 투자';
    } else if (lifecycle.stage === 'growth' && customer.recentMonthSales >= 100000000) {
        finalComment = '🚀 생애주기 고성장, 전략적 파트너 육성';
    }
    
    return finalComment + priorityAdjustment + timeHorizonNote;
}

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

// 코멘트 생성 방식 선택 함수 (신규 추가)
function generateCommentByMethod(customer, segmentType, segment, method = 'lifecycle') {
    if (method === 'enhanced') {
        return generateEnhancedFallbackComment(customer, segmentType, segment);
    } else {
        return generateLifecycleBasedComment(customer, segmentType, segment);
    }
}

// 레거시 함수 (하위 호환성)
function generateFallbackComment(customer) {
    return generateLifecycleBasedComment(customer, '', '');
}

console.log('✅ 생애주기 기반 세그먼트 AI 코멘트 모듈이 로드되었습니다.'); 