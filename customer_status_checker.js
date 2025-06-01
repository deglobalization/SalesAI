// 거래처별 추천 데이터 존재 여부 확인 후 UI 업데이트
async function updateCustomerRecommendationStatus(customers) {
    if (!customers || customers.length === 0) return;
    
    console.log(`📋 ${customers.length}개 거래처의 추천 데이터 상태를 확인합니다...`);
    
    for (let index = 0; index < customers.length; index++) {
        const customer = customers[index];
        const element = document.getElementById(`customerName${index}`);
        
        if (element) {
            try {
                // 추천 데이터 존재 여부 확인
                const hasRecommendations = await window.hasRecommendationsForAccount(customer.accountName, customer.accountCode);
                
                if (hasRecommendations) {
                    // 추천 데이터가 있는 경우: 클릭 가능
                    element.innerHTML = `<strong style="color: #00d4ff; cursor: pointer; text-decoration: underline;" 
                                                onclick="showCustomerRecommendations('${customer.accountName}', '${customer.accountCode}')" 
                                                title="클릭하여 AI 추천 품목 보기 (추천 데이터 있음)">
                                            ${customer.accountName}
                                        </strong>`;
                } else {
                    // 추천 데이터가 없는 경우: 비활성화
                    element.innerHTML = `<strong style="color: #6b7280; cursor: not-allowed; text-decoration: none;" 
                                                title="추천 데이터 없음 (클릭 불가)">
                                            ${customer.accountName}
                                            <span style="color: #ef4444; font-size: 0.7rem; margin-left: 5px;">●</span>
                                        </strong>`;
                }
            } catch (error) {
                console.error(`거래처 ${customer.accountName} 추천 데이터 확인 오류:`, error);
                // 오류가 발생한 경우 기본적으로 클릭 가능하게 유지
                element.innerHTML = `<strong style="color: #00d4ff; cursor: pointer; text-decoration: underline;" 
                                            onclick="showCustomerRecommendations('${customer.accountName}', '${customer.accountCode}')" 
                                            title="클릭하여 추천 품목 보기">
                                        ${customer.accountName}
                                    </strong>`;
            }
        }
        
        // 너무 빠른 요청을 방지하기 위한 약간의 지연
        if (index % 10 === 9) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log(`✅ ${customers.length}개 거래처의 추천 데이터 상태 확인 완료`);
}

// 품목 상세 분석에서 거래처별 추천 데이터 상태 업데이트
async function updateProductCustomerRecommendationStatus(customers) {
    if (!customers || customers.length === 0) return;
    
    console.log(`📋 품목 상세: ${customers.length}개 거래처의 추천 데이터 상태를 확인합니다...`);
    
    for (let index = 0; index < customers.length; index++) {
        const customer = customers[index];
        const element = document.getElementById(`productCustomerName${index}`);
        
        if (element) {
            try {
                // 추천 데이터 존재 여부 확인
                const hasRecommendations = await window.hasRecommendationsForAccount(customer.accountName, customer.accountCode);
                
                if (hasRecommendations) {
                    // 추천 데이터가 있는 경우: 클릭 가능
                    element.innerHTML = `<strong style="color: #00d4ff; cursor: pointer; text-decoration: underline;" 
                                                onclick="showCustomerRecommendations('${customer.accountName}', '${customer.accountCode}')" 
                                                title="클릭하여 AI 추천 품목 보기 (추천 데이터 있음)">
                                            ${customer.accountName}
                                        </strong>`;
                } else {
                    // 추천 데이터가 없는 경우: 비활성화
                    element.innerHTML = `<strong style="color: #6b7280; cursor: not-allowed; text-decoration: none;" 
                                                title="추천 데이터 없음 (클릭 불가)">
                                            ${customer.accountName}
                                            <span style="color: #ef4444; font-size: 0.7rem; margin-left: 5px;">●</span>
                                        </strong>`;
                }
            } catch (error) {
                console.error(`품목 상세에서 거래처 ${customer.accountName} 추천 데이터 확인 오류:`, error);
                // 오류가 발생한 경우 기본적으로 클릭 가능하게 유지
                element.innerHTML = `<strong style="color: #00d4ff; cursor: pointer; text-decoration: underline;" 
                                            onclick="showCustomerRecommendations('${customer.accountName}', '${customer.accountCode}')" 
                                            title="클릭하여 추천 품목 보기">
                                        ${customer.accountName}
                                    </strong>`;
            }
        }
        
        // 너무 빠른 요청을 방지하기 위한 약간의 지연
        if (index % 10 === 9) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log(`✅ 품목 상세: ${customers.length}개 거래처의 추천 데이터 상태 확인 완료`);
}

// 전역으로 노출
window.updateCustomerRecommendationStatus = updateCustomerRecommendationStatus;
window.updateProductCustomerRecommendationStatus = updateProductCustomerRecommendationStatus; 