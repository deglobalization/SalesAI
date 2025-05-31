// 전역 변수: 추천 데이터 캐시 (중복 선언 방지)
if (typeof window.recommendationsDataCache === 'undefined') {
    window.recommendationsDataCache = null;
}

// 추천 데이터 로드 함수
async function loadRecommendationsData() {
    console.log('=== loadRecommendationsData 함수 시작 ===');
    
    // 캐시된 데이터가 있으면 사용
    if (window.recommendationsDataCache) {
        console.log('캐시된 추천 데이터 사용');
        return window.recommendationsDataCache;
    }

    try {
        console.log('recommendations_data.json 파일 로드 시작...');
        const response = await fetch('recommendations_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('HTTP 응답 성공, JSON 파싱 중...');
        window.recommendationsDataCache = await response.json();
        console.log('추천 데이터 로드 완료:', Object.keys(window.recommendationsDataCache.recommendations || {}).length, '개 품목');
        console.log('데이터 구조 확인:', {
            hasRecommendations: !!window.recommendationsDataCache.recommendations,
            firstProductGroup: window.recommendationsDataCache.recommendations ? Object.keys(window.recommendationsDataCache.recommendations)[0] : null,
            sampleDataCount: window.recommendationsDataCache.recommendations ? window.recommendationsDataCache.recommendations[Object.keys(window.recommendationsDataCache.recommendations)[0]]?.length : 0
        });
        return window.recommendationsDataCache;
    } catch (error) {
        console.error('추천 데이터 로드 실패:', error);
        showStatus('추천 데이터를 불러오는데 실패했습니다.', 'error');
        return null;
    }
}

// 거래처별 추천 품목 표시 함수
async function showCustomerRecommendations(accountName, accountCode) {
    console.log('=== showCustomerRecommendations 함수 호출됨 ===');
    console.log('거래처명:', accountName);
    console.log('거래처코드:', accountCode);
    
    showStatus(`${accountName}의 추천 품목을 분석하고 있습니다...`, 'info');
    showLoading(true);

    try {
        // 추천 데이터 로드
        const recommendationsData = await loadRecommendationsData();
        console.log('로드된 데이터:', recommendationsData);
        console.log('데이터 존재 여부:', !!recommendationsData);
        console.log('recommendations 속성 존재 여부:', !!recommendationsData?.recommendations);
        
        if (!recommendationsData || !recommendationsData.recommendations) {
            console.error('추천 데이터 구조 문제:', {
                data: recommendationsData,
                hasRecommendations: !!recommendationsData?.recommendations
            });
            throw new Error('추천 데이터가 없습니다.');
        }

        // 해당 거래처의 추천 품목들을 찾기
        const customerRecommendations = [];
        
        console.log(`"${accountName}" (코드: ${accountCode}) 거래처에 대한 추천 품목 검색 중...`);
        console.log('검색할 품목군 개수:', Object.keys(recommendationsData.recommendations).length);
        
        // 모든 품목군을 순회하며 해당 거래처에 대한 추천 찾기
        Object.entries(recommendationsData.recommendations).forEach(([productGroup, recommendations]) => {
            console.log(`품목군 "${productGroup}" 검색 중... (${recommendations.length}개 거래처)`);
            
            // 거래처명 또는 거래처코드로 매칭 (다양한 형태로 시도)
            const customerRecommendation = recommendations.find(rec => {
                const nameMatch = rec.거래처명 === accountName || 
                                rec.거래처명?.toLowerCase() === accountName?.toLowerCase() ||
                                rec.거래처명?.includes(accountName) ||
                                accountName?.includes(rec.거래처명);
                
                const codeMatch = rec.거래처코드 === accountCode || 
                                rec.거래처코드 === parseInt(accountCode) ||
                                rec.거래처코드?.toString() === accountCode?.toString();
                
                if (nameMatch || codeMatch) {
                    console.log(`매칭 발견! 품목군: ${productGroup}, 거래처: ${rec.거래처명} (${rec.거래처코드})`);
                    return true;
                }
                return false;
            });
            
            if (customerRecommendation) {
                customerRecommendations.push({
                    productGroup: productGroup,
                    ...customerRecommendation
                });
            }
        });
        
        console.log(`총 ${customerRecommendations.length}개의 추천 품목을 찾았습니다.`);
        
        // 매칭된 품목들의 정보 출력
        if (customerRecommendations.length > 0) {
            console.log('매칭된 품목들:', customerRecommendations.map(r => r.productGroup));
        }

        // 기존 추천 카드가 있으면 제거
        const existingCard = document.getElementById('customerRecommendationCard');
        if (existingCard) {
            existingCard.remove();
        }

        if (customerRecommendations.length === 0) {
            showStatus(`${accountName}에 대한 추천 품목이 없습니다.`, 'info');
            showLoading(false);
            return;
        }

        // 성공확률 순으로 정렬
        customerRecommendations.sort((a, b) => (b.성공확률 || 0) - (a.성공확률 || 0));

        // 새로운 추천 카드 생성
        const analysisGrid = document.getElementById('segmentationGrid');
        const customerRecommendationCard = document.createElement('div');
        customerRecommendationCard.id = 'customerRecommendationCard';
        customerRecommendationCard.className = 'analysis-card';
        customerRecommendationCard.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(0, 212, 255, 0.1))';
        customerRecommendationCard.style.border = '2px solid rgba(124, 58, 237, 0.4)';
        customerRecommendationCard.style.marginTop = '20px';

        // 추천 품목 통계 계산
        const totalRecommendations = customerRecommendations.length;
        const avgSuccessRate = customerRecommendations.reduce((sum, rec) => sum + (rec.성공확률 || 0), 0) / totalRecommendations;
        const totalExpectedSales = customerRecommendations.reduce((sum, rec) => sum + (rec.예상매출 || 0), 0);
        const highPriorityCount = customerRecommendations.filter(rec => (rec.성공확률 || 0) >= 70).length;

        customerRecommendationCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #7c3aed;">🎯 ${accountName} 추천 품목 분석</h3>
                <button onclick="document.getElementById('customerRecommendationCard').remove()" 
                        style="background: rgba(239, 68, 68, 0.8); color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 0.9rem;">
                    ✕ 닫기
                </button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(124, 58, 237, 0.1); border-radius: 10px; border-left: 4px solid #7c3aed;">
                <h4 style="color: #7c3aed; margin-bottom: 15px;">📊 추천 요약</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div>
                        <strong style="color: #7c3aed;">추천 품목 수</strong><br>
                        <span style="font-size: 1.3rem; color: #ffffff;">${totalRecommendations}개</span>
                    </div>
                    <div>
                        <strong style="color: #7c3aed;">평균 성공확률</strong><br>
                        <span style="font-size: 1.3rem; color: #ffffff;">${avgSuccessRate.toFixed(1)}%</span>
                    </div>
                    <div>
                        <strong style="color: #7c3aed;">총 예상매출</strong><br>
                        <span style="font-size: 1.3rem; color: #ffffff;">${Math.round(totalExpectedSales / 10000).toLocaleString()}만원</span>
                    </div>
                    <div>
                        <strong style="color: #7c3aed;">고확률 품목</strong><br>
                        <span style="font-size: 1.3rem; color: #10b981;">${highPriorityCount}개</span>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>품목군</th>
                            <th>성공확률</th>
                            <th>예상매출</th>
                            <th>진료과매칭</th>
                            <th>추천이유</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customerRecommendations.map((rec, index) => {
                            const priorityColor = (rec.성공확률 || 0) >= 70 ? '#10b981' : 
                                                 (rec.성공확률 || 0) >= 50 ? '#f59e0b' : '#ef4444';
                            const matchingScore = rec.진료과매칭점수 || 0;
                            const matchingColor = matchingScore >= 2.0 ? '#10b981' : 
                                                 matchingScore >= 1.5 ? '#f59e0b' : 
                                                 matchingScore >= 1.0 ? '#6b7280' : '#ef4444';
                            
                            return `
                                <tr style="cursor: pointer;" onclick="showProductDetails('${rec.productGroup}')" title="클릭하여 품목 상세 정보 보기">
                                    <td><strong>${index + 1}</strong></td>
                                    <td><strong style="color: #7c3aed;">${rec.productGroup}</strong></td>
                                    <td><span style="color: ${priorityColor}; font-weight: 600; font-size: 1.1rem;">${(rec.성공확률 || 0).toFixed(1)}%</span></td>
                                    <td><strong>${Math.round((rec.예상매출 || 0) / 10000).toLocaleString()}만원</strong></td>
                                    <td><span style="color: ${matchingColor}; font-weight: 600;">${matchingScore.toFixed(1)}점</span></td>
                                    <td style="font-size: 0.9rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rec.추천이유 || 'N/A'}">${rec.추천이유 || 'N/A'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(31, 41, 55, 0.3); border-radius: 10px;">
                <h4 style="color: #00d4ff; margin-bottom: 10px;">💡 추천 전략</h4>
                <div style="color: #9ca3af; font-size: 0.9rem; line-height: 1.5;">
                    <p style="margin-bottom: 8px;">
                        <strong style="color: #10b981;">우선순위 높음 (70% 이상):</strong> ${highPriorityCount}개 품목은 즉시 접촉 권장
                    </p>
                    <p style="margin-bottom: 8px;">
                        <strong style="color: #f59e0b;">중간 우선순위 (50-69%):</strong> ${customerRecommendations.filter(rec => (rec.성공확률 || 0) >= 50 && (rec.성공확률 || 0) < 70).length}개 품목은 관계 구축 후 접근
                    </p>
                    <p style="margin-bottom: 0;">
                        <strong style="color: #6b7280;">장기 전략 (50% 미만):</strong> ${customerRecommendations.filter(rec => (rec.성공확률 || 0) < 50).length}개 품목은 시장 상황 변화 시 고려
                    </p>
                </div>
            </div>
        `;

        // 카드를 맨 위에 삽입
        analysisGrid.insertBefore(customerRecommendationCard, analysisGrid.firstChild);
        
        // 카드로 스크롤
        customerRecommendationCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        showStatus(`${accountName}의 추천 품목 ${totalRecommendations}개를 표시했습니다.`, 'success');
        showLoading(false);

    } catch (error) {
        console.error('거래처 추천 품목 표시 오류:', error);
        showStatus(`추천 품목을 불러오는데 실패했습니다: ${error.message}`, 'error');
        showLoading(false);
    }
}

// 품목 상세 정보 표시 함수 (기존 함수 재사용)
function showProductDetails(productName) {
    // 기존 showProductCustomers 함수 호출
    showProductCustomers(productName);
} 