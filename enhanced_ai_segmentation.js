// 향상된 AI 고객 세분화 및 코멘트 생성 시스템
class EnhancedAISegmentation {
    constructor() {
        this.customerProfiles = new Map();
        this.segmentationCriteria = {
            sales: {
                premium: 100000000,   // 1억 이상
                high: 50000000,       // 5천만 이상
                medium: 10000000,     // 1천만 이상
                low: 0                // 그 미만
            },
            bcg: {
                marketShare: { high: 3.0 },
                relativeMarketShare: { high: 0.5 },
                marketGrowth: { high: 20, low: 0 },
                halfYearGrowth: { high: 10 }
            },
            lifecycle: {
                introduction: { salesThreshold: 10000000, growthRate: 30 },
                growth: { salesThreshold: 10000000, growthRate: 15, yearGrowth: 10 },
                maturity: { salesThreshold: 50000000, growthRange: 10, stability: 0.8 },
                decline: { growthRate: -10, yearGrowth: -5 },
                revival: { monthlyGrowth: 10 }
            }
        };
        this.aiPatterns = this.initializeAIPatterns();
    }

    // AI 패턴 매칭 시스템 초기화
    initializeAIPatterns() {
        return [
            // 🌟 고성장 패턴
            {
                id: 'explosive_growth',
                condition: (profile) => profile.growth3MonthRate > 50 && profile.growthYearAgoRate > 30,
                lifecycle: ['introduction', 'growth'],
                comment: (profile) => `🚀 폭발적 성장세, 전략적 파트너십 우선 검토 [잠재력: ${this.calculatePotentialScore(profile)}점]`,
                priority: 'critical',
                timeHorizon: 'immediate'
            },
            
            // 💎 프리미엄 고객 패턴
            {
                id: 'premium_customer',
                condition: (profile) => profile.recentSales >= 100000000 && profile.growth3MonthRate > 10,
                lifecycle: ['maturity', 'growth'],
                comment: (profile) => `💎 프리미엄 핵심고객, VIP 서비스 강화 및 장기 가치 극대화`,
                priority: 'high',
                timeHorizon: 'long_term'
            },
            
            // 🔄 회복세 패턴
            {
                id: 'recovery_trend',
                condition: (profile) => profile.growth3Month > 0 && profile.growthYearAgo < 0 && profile.growth3MonthRate > 20,
                lifecycle: ['revival'],
                comment: (profile) => `🔄 회복세 강화 중, 추가 투자 기회 포착 및 모멘텀 유지`,
                priority: 'medium',
                timeHorizon: 'medium_term'
            },
            
            // ⚠️ 위험 고객 패턴
            {
                id: 'high_risk',
                condition: (profile) => profile.growth3MonthRate < -20 && profile.growthYearAgoRate < -15,
                lifecycle: ['decline'],
                comment: (profile) => `🚨 고위험 고객, 긴급 관계 복구 및 손실 최소화 전략`,
                priority: 'critical',
                timeHorizon: 'immediate'
            },
            
            // 🌱 성장 잠재력 패턴
            {
                id: 'growth_potential',
                condition: (profile) => profile.recentSales < 50000000 && profile.growth3MonthRate > 30,
                lifecycle: ['introduction', 'growth'],
                comment: (profile) => `🌱 성장 잠재력 우수, 맞춤형 확장 지원 및 집중 투자`,
                priority: 'medium',
                timeHorizon: 'short_term'
            },
            
            // 🤝 안정적 파트너 패턴
            {
                id: 'stable_partner',
                condition: (profile) => profile.recentSales >= 50000000 && Math.abs(profile.growth3MonthRate) < 10,
                lifecycle: ['maturity', 'stable'],
                comment: (profile) => `🤝 신뢰할 수 있는 파트너, 장기 관계 유지 및 효율성 극대화`,
                priority: 'low',
                timeHorizon: 'long_term'
            },
            
            // 🔧 디지털 전환 후보 패턴
            {
                id: 'digital_candidate',
                condition: (profile) => profile.recentSales >= 30000000 && Math.abs(profile.growth3MonthRate) < 5 && profile.uniqueProducts >= 3,
                lifecycle: ['maturity', 'stable'],
                comment: (profile) => `🔧 디지털 솔루션 후보, 혁신적 서비스 제안 기회`,
                priority: 'medium',
                timeHorizon: 'medium_term'
            }
        ];
    }

    // 종합 고객 프로필 생성
    createCustomerProfile(customer) {
        const profile = {
            // 기본 정보
            accountCode: customer.accountCode,
            accountName: customer.accountName,
            region: customer.region,
            manager: customer.manager,
            
            // 매출 지표
            recentSales: customer.recentMonthSales || 0,
            totalSales: customer.totalSales || 0,
            growth3Month: customer.growthVs3Month || 0,
            growthYearAgo: customer.growthVsYearAgo || 0,
            uniqueProducts: customer.uniqueProducts || 0,
            annualSales: customer.annualSales || 0,
            
            // 계산된 지표
            growth3MonthRate: this.calculateGrowthRate(customer.growthVs3Month, customer.recentMonthSales),
            growthYearAgoRate: this.calculateGrowthRate(customer.growthVsYearAgo, customer.recentMonthSales),
            salesStability: this.calculateSalesStability(customer),
            marketShare: this.calculateMarketShare(customer),
            
            // 세분화 결과
            salesSegment: this.determineSalesSegment(customer.recentMonthSales),
            bcgSegment: this.determineBCGSegment(customer),
            lifecycleStage: this.determineLifecycleStage(customer),
            
            // AI 분석 결과
            aiPatterns: [],
            riskLevel: 'low',
            potentialScore: 0,
            recommendedActions: []
        };
        
        // AI 패턴 매칭 실행
        profile.aiPatterns = this.matchAIPatterns(profile);
        profile.potentialScore = this.calculatePotentialScore(profile);
        profile.riskLevel = this.assessRiskLevel(profile);
        profile.recommendedActions = this.generateRecommendedActions(profile);
        
        this.customerProfiles.set(customer.accountCode, profile);
        return profile;
    }

    // 성장률 계산
    calculateGrowthRate(growth, currentSales) {
        return currentSales > 0 ? (growth / currentSales) * 100 : 0;
    }

    // 매출 안정성 계산
    calculateSalesStability(customer) {
        const totalSales = customer.totalSales || 0;
        const recentSales = customer.recentMonthSales || 0;
        return totalSales > 0 ? (recentSales * 12) / totalSales : 0;
    }

    // 시장 점유율 계산
    calculateMarketShare(customer) {
        // 전체 고객 대비 상대적 점유율 계산 (추후 구현)
        return 0;
    }

    // 매출액 기준 세분화
    determineSalesSegment(recentSales) {
        const criteria = this.segmentationCriteria.sales;
        if (recentSales >= criteria.premium) return 'premium';
        if (recentSales >= criteria.high) return 'high';
        if (recentSales >= criteria.medium) return 'medium';
        return 'low';
    }

    // BCG Matrix 세분화
    determineBCGSegment(customer) {
        const recentSales = customer.recentMonthSales || 0;
        const yearGrowthRate = customer.yearOverYearGrowthRate || 0;
        const halfYearGrowthRate = customer.halfYearGrowthRate || 0;
        
        const avgGrowthRate = (yearGrowthRate + halfYearGrowthRate) / 2;
        const isHighGrowth = avgGrowthRate > this.segmentationCriteria.bcg.marketGrowth.high;
        const isHighShare = recentSales >= 50000000; // 임시 기준
        
        if (isHighGrowth && isHighShare) return 'star';
        if (!isHighGrowth && isHighShare) return 'cash-cow';
        if (isHighGrowth && !isHighShare) return 'question-mark';
        return 'dog';
    }

    // 생애주기 단계 결정
    determineLifecycleStage(customer) {
        const recentSales = customer.recentMonthSales || 0;
        const growth3Month = customer.growthVs3Month || 0;
        const growthYearAgo = customer.growthVsYearAgo || 0;
        const totalSales = customer.totalSales || 0;
        
        const growth3MonthRate = this.calculateGrowthRate(growth3Month, recentSales);
        const growthYearAgoRate = this.calculateGrowthRate(growthYearAgo, recentSales);
        const salesStability = this.calculateSalesStability(customer);
        
        const criteria = this.segmentationCriteria.lifecycle;
        
        // 도입기
        if (recentSales < criteria.introduction.salesThreshold && growth3MonthRate > criteria.introduction.growthRate) {
            return 'introduction';
        }
        
        // 성장기
        if (growth3MonthRate > criteria.growth.growthRate && 
            growthYearAgoRate > criteria.growth.yearGrowth && 
            recentSales >= criteria.growth.salesThreshold) {
            return 'growth';
        }
        
        // 성숙기
        if (recentSales >= criteria.maturity.salesThreshold && 
            Math.abs(growth3MonthRate) < criteria.maturity.growthRange && 
            salesStability > criteria.maturity.stability) {
            return 'maturity';
        }
        
        // 쇠퇴기
        if (growth3MonthRate < criteria.decline.growthRate && growthYearAgoRate < criteria.decline.yearGrowth) {
            return 'decline';
        }
        
        // 재활성화기
        if (growth3Month > 0 && growthYearAgo <= 0 && growth3MonthRate > criteria.revival.monthlyGrowth) {
            return 'revival';
        }
        
        // 안정기 (기본)
        return 'stable';
    }

    // AI 패턴 매칭
    matchAIPatterns(profile) {
        return this.aiPatterns.filter(pattern => {
            try {
                return pattern.condition(profile) && 
                       pattern.lifecycle.includes(profile.lifecycleStage);
            } catch (error) {
                console.warn('패턴 매칭 오류:', pattern.id, error);
                return false;
            }
        });
    }

    // 잠재력 점수 계산
    calculatePotentialScore(profile) {
        let score = 0;
        
        // 생애주기 단계별 기본 점수
        const lifecycleScores = {
            introduction: 40, growth: 35, revival: 30,
            stable: 20, maturity: 15, decline: 10
        };
        score += lifecycleScores[profile.lifecycleStage] || 0;
        
        // 성장률 보정
        if (profile.growth3MonthRate > 30) score += 25;
        else if (profile.growth3MonthRate > 15) score += 15;
        else if (profile.growth3MonthRate > 5) score += 10;
        else if (profile.growth3MonthRate < -10) score -= 15;
        
        // 매출 규모 보정
        if (profile.recentSales >= 100000000) score += 20;
        else if (profile.recentSales >= 50000000) score += 15;
        else if (profile.recentSales >= 10000000) score += 10;
        
        // 제품 다양성 보정
        if (profile.uniqueProducts >= 5) score += 10;
        else if (profile.uniqueProducts >= 3) score += 5;
        
        // AI 패턴 보정
        score += profile.aiPatterns.length * 5;
        
        return Math.max(0, Math.min(100, score));
    }

    // 위험도 평가
    assessRiskLevel(profile) {
        if (profile.growth3MonthRate < -20 || profile.growthYearAgoRate < -15) {
            return 'high';
        }
        if (profile.growth3MonthRate < -5 || profile.lifecycleStage === 'decline') {
            return 'medium';
        }
        return 'low';
    }

    // 추천 액션 생성
    generateRecommendedActions(profile) {
        const actions = [];
        
        // AI 패턴 기반 액션
        profile.aiPatterns.forEach(pattern => {
            actions.push({
                type: 'pattern_based',
                priority: pattern.priority,
                timeHorizon: pattern.timeHorizon,
                description: pattern.comment(profile),
                category: pattern.id
            });
        });
        
        // 위험도 기반 액션
        if (profile.riskLevel === 'high') {
            actions.push({
                type: 'risk_mitigation',
                priority: 'critical',
                timeHorizon: 'immediate',
                description: '긴급 관계 복구 프로그램 실행',
                category: 'risk_management'
            });
        }
        
        // 세그먼트 기반 액션
        const segmentActions = this.getSegmentSpecificActions(profile);
        actions.push(...segmentActions);
        
        return actions.sort((a, b) => {
            const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // 세그먼트별 특화 액션
    getSegmentSpecificActions(profile) {
        const actions = [];
        
        // BCG 세그먼트별 액션
        switch (profile.bcgSegment) {
            case 'star':
                actions.push({
                    type: 'bcg_strategy',
                    priority: 'high',
                    timeHorizon: 'long_term',
                    description: '⭐ 스타 고객 투자 확대 및 시장 리더십 강화',
                    category: 'investment_expansion'
                });
                break;
            case 'cash-cow':
                actions.push({
                    type: 'bcg_strategy',
                    priority: 'medium',
                    timeHorizon: 'long_term',
                    description: '🐄 현금 확보 최적화 및 효율성 극대화',
                    category: 'efficiency_optimization'
                });
                break;
            case 'question-mark':
                actions.push({
                    type: 'bcg_strategy',
                    priority: 'medium',
                    timeHorizon: 'medium_term',
                    description: '❓ 선택적 투자 및 성장 잠재력 검증',
                    category: 'selective_investment'
                });
                break;
            case 'dog':
                actions.push({
                    type: 'bcg_strategy',
                    priority: 'low',
                    timeHorizon: 'short_term',
                    description: '🐕 포트폴리오 재조정 및 효율성 중심 관리',
                    category: 'portfolio_optimization'
                });
                break;
        }
        
        return actions;
    }

    // 종합 AI 코멘트 생성
    generateComprehensiveComment(customer, segmentType = 'comprehensive', segment = '') {
        const profile = this.createCustomerProfile(customer);
        
        // 최우선 패턴 선택
        const primaryPattern = profile.aiPatterns.length > 0 ? profile.aiPatterns[0] : null;
        
        // 기본 전략 코멘트
        let baseComment = '';
        if (primaryPattern) {
            baseComment = primaryPattern.comment(profile);
        } else {
            baseComment = this.getLifecycleBasedComment(profile);
        }
        
        // 세그먼트별 특화 정보 추가
        const segmentInfo = this.getSegmentSpecificInfo(profile, segmentType, segment);
        
        // 잠재력 및 시간 관점 추가
        const potentialInfo = profile.potentialScore >= 70 ? ' [고잠재력]' :
                             profile.potentialScore >= 40 ? ' [중잠재력]' : ' [저잠재력]';
        
        const timeHorizonInfo = primaryPattern ? 
            this.getTimeHorizonText(primaryPattern.timeHorizon) : ' (표준관리)';
        
        // 위험 수준 표시
        const riskInfo = profile.riskLevel === 'high' ? ' ⚠️' :
                        profile.riskLevel === 'medium' ? ' ⚡' : '';
        
        return `${baseComment}${segmentInfo}${potentialInfo}${timeHorizonInfo}${riskInfo}`;
    }

    // 생애주기 기반 기본 코멘트
    getLifecycleBasedComment(profile) {
        const comments = {
            introduction: '🌱 도입기 고객, 관계 구축 및 성장 지원',
            growth: '📈 성장기 고객, 확장 기회 적극 포착',
            maturity: '💎 성숙기 고객, 가치 극대화 및 관계 심화',
            decline: '📉 쇠퇴기 고객, 회복 전략 수립 필요',
            revival: '🔄 재활성화 고객, 회복 모멘텀 지원',
            stable: '⚖️ 안정기 고객, 효율적 관계 유지'
        };
        
        return comments[profile.lifecycleStage] || '📊 종합 분석 완료, 맞춤 전략 수립';
    }

    // 세그먼트별 특화 정보
    getSegmentSpecificInfo(profile, segmentType, segment) {
        if (segmentType === 'bcg' && segment) {
            const bcgInfo = {
                star: ' (스타전략)',
                'cash-cow': ' (수익최적화)',
                'question-mark': ' (선택투자)',
                dog: ' (효율관리)'
            };
            return bcgInfo[segment] || '';
        }
        
        if (segmentType === 'sales' && segment) {
            const salesInfo = {
                premium: ' (프리미엄)',
                high: ' (중요고객)',
                medium: ' (성장대상)',
                low: ' (기회발굴)'
            };
            return salesInfo[segment] || '';
        }
        
        return '';
    }

    // 시간 관점 텍스트
    getTimeHorizonText(timeHorizon) {
        const horizonTexts = {
            immediate: ' (즉시실행)',
            short_term: ' (단기집중)',
            medium_term: ' (중기전략)',
            long_term: ' (장기관리)'
        };
        return horizonTexts[timeHorizon] || ' (표준관리)';
    }

    // 배치 코멘트 생성
    async generateBatchComments(customers, segmentType = 'comprehensive', segment = '') {
        const comments = [];
        const batchSize = 5;
        
        for (let i = 0; i < customers.length; i += batchSize) {
            const batch = customers.slice(i, i + batchSize);
            
            const batchComments = batch.map(customer => {
                try {
                    return this.generateComprehensiveComment(customer, segmentType, segment);
                } catch (error) {
                    console.error('코멘트 생성 오류:', customer.accountName, error);
                    return '📊 분석 진행 중, 잠시 후 확인해주세요';
                }
            });
            
            comments.push(...batchComments);
            
            // 배치 간 지연 (UI 응답성 유지)
            if (i + batchSize < customers.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return comments;
    }

    // 고객 프로필 상세 정보 조회
    getCustomerProfileDetails(accountCode) {
        return this.customerProfiles.get(accountCode);
    }

    // 세분화 기준 업데이트
    updateSegmentationCriteria(type, criteria) {
        this.segmentationCriteria[type] = { ...this.segmentationCriteria[type], ...criteria };
    }

    // 통계 정보 생성
    generateSegmentationStats(customers) {
        const stats = {
            total: customers.length,
            byLifecycle: {},
            bySalesSegment: {},
            byBCGSegment: {},
            byRiskLevel: { high: 0, medium: 0, low: 0 },
            averagePotentialScore: 0,
            topPerformers: [],
            riskCustomers: []
        };
        
        let totalPotentialScore = 0;
        
        customers.forEach(customer => {
            const profile = this.createCustomerProfile(customer);
            
            // 생애주기별 통계
            stats.byLifecycle[profile.lifecycleStage] = (stats.byLifecycle[profile.lifecycleStage] || 0) + 1;
            
            // 매출 세그먼트별 통계
            stats.bySalesSegment[profile.salesSegment] = (stats.bySalesSegment[profile.salesSegment] || 0) + 1;
            
            // BCG 세그먼트별 통계
            stats.byBCGSegment[profile.bcgSegment] = (stats.byBCGSegment[profile.bcgSegment] || 0) + 1;
            
            // 위험도별 통계
            stats.byRiskLevel[profile.riskLevel]++;
            
            // 잠재력 점수 누적
            totalPotentialScore += profile.potentialScore;
            
            // 상위 성과자 (잠재력 점수 80점 이상)
            if (profile.potentialScore >= 80) {
                stats.topPerformers.push({
                    accountName: profile.accountName,
                    potentialScore: profile.potentialScore,
                    lifecycleStage: profile.lifecycleStage
                });
            }
            
            // 위험 고객 (고위험)
            if (profile.riskLevel === 'high') {
                stats.riskCustomers.push({
                    accountName: profile.accountName,
                    riskLevel: profile.riskLevel,
                    growth3MonthRate: Math.round(profile.growth3MonthRate)
                });
            }
        });
        
        stats.averagePotentialScore = Math.round(totalPotentialScore / customers.length);
        
        return stats;
    }
}

// 전역 인스턴스 생성
window.enhancedAISegmentation = new EnhancedAISegmentation();

// 기존 함수와의 호환성을 위한 래퍼 함수들
window.generateLifecycleBasedComment = function(customer, segmentType, segment) {
    return window.enhancedAISegmentation.generateComprehensiveComment(customer, segmentType, segment);
};

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

// 전역 함수로 등록
window.generateEnhancedFallbackComment = generateEnhancedFallbackComment;

window.generateBatchComments = function(customers, segmentType, segment) {
    return window.enhancedAISegmentation.generateBatchComments(customers, segmentType, segment);
};

console.log('✅ 향상된 AI 고객 세분화 및 코멘트 생성 시스템이 로드되었습니다.');
console.log('📊 지원 기능: 생애주기 분석, BCG Matrix, 매출 세분화, AI 패턴 매칭, 위험도 평가, 잠재력 점수'); 