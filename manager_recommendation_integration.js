/**
 * 담당자별 SmartAI 추천 연동 기능
 * 품목 검색 시 해당 담당자의 추천 거래처를 자동으로 표시
 */

// 담당자별 추천 데이터 캐시
let managerRecommendationsCache = null;

// 담당자별 추천 데이터 로드
async function loadManagerRecommendationsData() {
    if (managerRecommendationsCache) {
        return managerRecommendationsCache;
    }
    
    try {
        const response = await fetch('manager_recommendations_data.json');
        if (response.ok) {
            managerRecommendationsCache = await response.json();
            console.log('📊 담당자별 추천 데이터 로드 완료:', Object.keys(managerRecommendationsCache.manager_data || {}).length + '명');
            return managerRecommendationsCache;
        } else {
            console.warn('담당자별 추천 데이터 파일을 찾을 수 없습니다.');
            return null;
        }
    } catch (error) {
        console.error('담당자별 추천 데이터 로드 실패:', error);
        return null;
    }
}

// 현재 담당자의 품목별 추천 검색
async function findManagerRecommendationsForProduct(productName, managerName) {
    const data = await loadManagerRecommendationsData();
    
    if (!data || !data.manager_data || !managerName || managerName === "전체") {
        return null;
    }
    
    const managerData = data.manager_data[managerName];
    if (!managerData || !managerData.recommendations) {
        console.log(`${managerName} 담당자의 추천 데이터를 찾을 수 없습니다.`);
        return null;
    }
    
    let recommendations = [];
    
    // 1. 정확한 품목명 매칭
    if (managerData.recommendations[productName]) {
        recommendations = managerData.recommendations[productName];
        console.log(`✅ ${managerName} 담당자의 ${productName} 정확 매칭: ${recommendations.length}개`);
    } else {
        // 2. 부분 매칭 시도
        const productLower = productName.toLowerCase();
        for (const [productGroup, recs] of Object.entries(managerData.recommendations)) {
            const groupLower = productGroup.toLowerCase();
            if (groupLower.includes(productLower) || productLower.includes(groupLower)) {
                recommendations = recs;
                console.log(`🔍 ${managerName} 담당자의 ${productGroup} 부분 매칭: ${recommendations.length}개`);
                break;
            }
        }
    }
    
    return recommendations.length > 0 ? recommendations : null;
}

// 기존 generateSmartAIRecommendations 함수를 오버라이드
async function generateSmartAIRecommendationsWithManager(productName) {
    showStatus(`${productName}에 대한 스마트 AI 타겟팅을 생성하고 있습니다...`, 'info');
    showLoading(true);
    updateProgress(0);
    
    try {
        updateProgress(20);
        
        // 현재 담당자 확인
        const currentManager = window.currentManager;
        console.log(`🔍 품목 검색: ${productName}, 현재 담당자: ${currentManager}`);
        
        let recommendations = [];
        let dataSource = 'API';
        
        // 1단계: 담당자별 추천 JSON 파일에서 찾기
        if (currentManager && currentManager !== "전체") {
            updateProgress(30);
            const managerRecs = await findManagerRecommendationsForProduct(productName, currentManager);
            
            if (managerRecs && managerRecs.length > 0) {
                recommendations = managerRecs;
                dataSource = '담당자별 맞춤 데이터';
                console.log(`✅ ${currentManager} 담당자의 맞춤 추천 사용: ${recommendations.length}개`);
            }
        }
        
        updateProgress(50);
        
        // 2단계: 담당자별 추천이 없으면 API 호출
        if (recommendations.length === 0) {
            console.log('💻 API 호출로 전체 추천 생성 중...');
            try {
                const response = await fetch('http://localhost:5002/api/recommend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_group: productName,
                        top_n: 20
                    })
                });
                
                updateProgress(60);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.recommendations && data.recommendations.length > 0) {
                        // API 응답을 JSON 형식으로 변환
                        recommendations = data.recommendations.map(rec => ({
                            거래처코드: rec.customer?.accountCode || '',
                            거래처명: rec.customer?.accountName || '',
                            진료과: rec.customer?.specialty || '',
                            시설유형: rec.customer?.facilityType || '',
                            거래처규모: rec.customer?.scale || '',
                            예상매출: rec.strategies?.[0]?.expectedSales || 0,
                            성공확률: rec.confidence || 0,
                            추천근거: rec.analysis || `${productName} 품목에 대한 AI 추천`
                        }));
                        dataSource = 'API 전체 데이터';
                    }
                } else {
                    throw new Error(`API 요청 실패: ${response.status}`);
                }
            } catch (apiError) {
                console.error('API 호출 실패:', apiError);
                // API 실패 시에도 담당자별 데이터에서 유사한 품목 찾기 시도
                if (currentManager && currentManager !== "전체") {
                    const fallbackRecs = await findSimilarProductRecommendations(productName, currentManager);
                    if (fallbackRecs && fallbackRecs.length > 0) {
                        recommendations = fallbackRecs;
                        dataSource = '유사 품목 기반 추천';
                    }
                }
                
                if (recommendations.length === 0) {
                    throw apiError;
                }
            }
        }
        
        updateProgress(70);
        
        if (recommendations.length === 0) {
            throw new Error(`${productName}에 대한 추천 결과가 없습니다.`);
        }
        
        // 결과를 advisor.html 형식으로 변환
        window.analysisResults = window.analysisResults || {};
        window.analysisResults.aiRecommendations = recommendations.map(rec => ({
            customer: {
                accountCode: rec.거래처코드,
                accountName: rec.거래처명,
                specialty: rec.진료과 || '일반진료과',
                facilityType: rec.시설유형 || 'Unknown',
                scale: rec.거래처규모 || 'Unknown',
                manager: currentManager || '미배정'
            },
            analysis: rec.추천이유 || `${productName} 품목에 대한 맞춤 추천`,
            strategies: [{
                title: `${productName} 맞춤 타겟팅`,
                description: `${currentManager || '전체'} 담당자 기준 ${productName} 영업 전략`,
                priority: rec.성공확률 >= 80 ? 'high' : rec.성공확률 >= 60 ? 'medium' : 'low',
                expectedSales: Math.round((rec.예상매출 || 0) / 10000), // 만원 단위로 변환
                timeline: '즉시',
                confidence: (rec.성공확률 || 0) / 100,
                specialty_match: rec.진료과매칭점수 || 0,
                explanation: `${currentManager ? currentManager + ' 담당자의 ' : ''}${productName} 추천 대상 (${dataSource})`
            }],
            confidence: Math.round(rec.성공확률 || 0),
            productName: productName
        }));
        
        console.log(`✅ 고품질 데이터 변환 완료:`, window.analysisResults.aiRecommendations);
        
        updateProgress(100);
        
        // 기존 displaySmartAIRecommendations 함수 호출
        if (typeof displaySmartAIRecommendations === 'function') {
            displaySmartAIRecommendations(productName);
        } else {
            displayManagerRecommendations(productName, dataSource);
        }
        
        // 담당자별 추천 표시 메시지
        const managerInfo = currentManager && currentManager !== "전체" ? 
            ` (${currentManager} 담당자 맞춤)` : ' (전체 데이터 기준)';
        showStatus(`${productName}${managerInfo}에 대한 스마트 추천이 완료되었습니다 (${recommendations.length}개 타겟, ${dataSource}).`, 'success');
        showLoading(false);
        
        // AI 추천 탭으로 전환
        if (typeof autoSwitchTab === 'function') {
            autoSwitchTab('recommendation');
        }
        
    } catch (error) {
        console.error('SmartAI 추천 생성 오류:', error);
        showStatus(`스마트 AI 추천 생성 실패: ${error.message}`, 'error');
        showLoading(false);
    }
}

// 유사한 품목의 추천 찾기 (백업 기능)
async function findSimilarProductRecommendations(productName, managerName) {
    const data = await loadManagerRecommendationsData();
    
    if (!data || !data.manager_data || !managerName) {
        return null;
    }
    
    const managerData = data.manager_data[managerName];
    if (!managerData || !managerData.recommendations) {
        return null;
    }
    
    // 유사한 품목명을 가진 모든 추천 수집
    const productLower = productName.toLowerCase();
    let allSimilarRecs = [];
    
    for (const [productGroup, recs] of Object.entries(managerData.recommendations)) {
        const groupLower = productGroup.toLowerCase();
        
        // 단어 단위로 유사도 계산
        const productWords = productLower.split(/[\s\-_]/);
        const groupWords = groupLower.split(/[\s\-_]/);
        
        const hasCommonWord = productWords.some(word => 
            word.length > 2 && groupWords.some(groupWord => 
                groupWord.includes(word) || word.includes(groupWord)
            )
        );
        
        if (hasCommonWord) {
            allSimilarRecs.push(...recs.slice(0, 5)); // 각 품목군에서 최대 5개씩
        }
    }
    
    // 성공확률순으로 정렬하여 상위 10개만 반환
    return allSimilarRecs
        .sort((a, b) => (b.성공확률 || 0) - (a.성공확률 || 0))
        .slice(0, 10);
}

// 담당자별 추천 표시 (백업 표시 함수)
function displayManagerRecommendations(productName, dataSource) {
    const analysisGrid = document.getElementById('recommendationGrid');
    if (!analysisGrid) {
        console.error('recommendationGrid 요소를 찾을 수 없습니다.');
        return;
    }
    
    const recommendations = window.analysisResults?.aiRecommendations || [];
    const currentManager = window.currentManager || '전체';
    
    let html = `
        <div class="analysis-card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 212, 255, 0.1)); border: 2px solid rgba(16, 185, 129, 0.5);">
            <h3 style="color: #10b981; margin-bottom: 15px;">
                🤖 ${productName} SmartAI 추천 결과
                <span style="color: #6b7280; font-size: 0.8rem; font-weight: normal;">
                    (${currentManager} 담당자 - ${dataSource})
                </span>
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="color: #00d4ff; font-size: 1.8rem; font-weight: bold;">${recommendations.length}</div>
                    <div style="color: #9ca3af; font-size: 0.9rem;">추천 거래처</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="color: #10b981; font-size: 1.8rem; font-weight: bold;">
                        ${Math.round(recommendations.reduce((sum, r) => sum + (r.confidence || 0), 0) / Math.max(recommendations.length, 1))}%
                    </div>
                    <div style="color: #9ca3af; font-size: 0.9rem;">평균 신뢰도</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="color: #f59e0b; font-size: 1.8rem; font-weight: bold;">
                        ${Math.round(recommendations.reduce((sum, r) => sum + (r.strategies?.[0]?.expectedSales || 0), 0) / 10000).toLocaleString()}만원
                    </div>
                    <div style="color: #9ca3af; font-size: 0.9rem;">예상 총 매출</div>
                </div>
            </div>
        </div>
    `;
    
    // 개별 추천 카드들
    recommendations.forEach((rec, index) => {
        const priorityColor = rec.strategies?.[0]?.priority === 'high' ? '#10b981' : 
                             rec.strategies?.[0]?.priority === 'medium' ? '#f59e0b' : '#6b7280';
        
        html += `
            <div class="analysis-card" style="border-left: 4px solid ${priorityColor};">
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h4 style="color: #00d4ff; margin: 0 0 5px 0;">${rec.customer.accountName}</h4>
                        <div style="color: #9ca3af; font-size: 0.9rem;">
                            ${rec.customer.accountCode} | ${rec.customer.specialty || '전문과목 미상'} | ${rec.customer.scale || '규모 미상'}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; margin-bottom: 5px;">
                            신뢰도 ${rec.confidence}%
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="color: #e5e7eb; font-size: 0.95rem; line-height: 1.5;">
                        ${rec.analysis}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 10px; border-radius: 8px;">
                        <div style="color: #10b981; font-size: 0.8rem; margin-bottom: 3px;">예상 매출</div>
                        <div style="color: #e5e7eb; font-weight: bold;">
                            ${Math.round((rec.strategies?.[0]?.expectedSales || 0) / 10000).toLocaleString()}만원
                        </div>
                    </div>
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 10px; border-radius: 8px;">
                        <div style="color: #3b82f6; font-size: 0.8rem; margin-bottom: 3px;">우선순위</div>
                        <div style="color: #e5e7eb; font-weight: bold;">
                            ${rec.strategies?.[0]?.priority === 'high' ? '높음' : 
                              rec.strategies?.[0]?.priority === 'medium' ? '보통' : '낮음'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    analysisGrid.innerHTML = html;
}

// 기존 함수를 오버라이드
if (typeof window !== 'undefined') {
    // advisor.html에서 호출할 수 있도록 전역 함수로 등록
    window.generateSmartAIRecommendationsWithManager = generateSmartAIRecommendationsWithManager;
    window.loadManagerRecommendationsData = loadManagerRecommendationsData;
    
    // 페이지 로드 시 데이터 미리 로드
    document.addEventListener('DOMContentLoaded', function() {
        loadManagerRecommendationsData();
    });
} 