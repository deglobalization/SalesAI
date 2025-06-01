// 거래처별 고품질 추천 분석 표시 함수
async function showCustomerRecommendations(accountName, accountCode) {
    console.log(`🏥 거래처 클릭: ${accountName} (${accountCode})`);
    console.log('🔧 showCustomerRecommendations 함수 실행 중 (customer_recommendations_integration.js)');
    
    // 디버깅: 현재 담당자 정보 확인
    const currentManager = window.currentManager || '전체';
    console.log('🔍 현재 설정된 담당자:', currentManager);
    console.log('🔍 window.currentManager 값:', window.currentManager);
    
    // loadManagerRecommendationsData 함수 존재 확인
    if (typeof window.loadManagerRecommendationsData !== 'function') {
        console.error('❌ loadManagerRecommendationsData 함수가 없습니다!');
        showStatus('담당자별 추천 데이터 로드 함수를 찾을 수 없습니다.', 'error');
        showLoading(false);
        return;
    }
    console.log('✅ loadManagerRecommendationsData 함수가 존재합니다.');
    
    showStatus(`${accountName}에 대한 고품질 추천 분석을 생성하고 있습니다...`, 'info');
    showLoading(true);
    
    try {
        // 담당자별 고품질 추천 데이터 로드
        console.log('📡 담당자별 추천 데이터 로드 시도...');
        const managerData = await window.loadManagerRecommendationsData();
        console.log('📊 로드된 데이터:', managerData);
        
        if (!managerData || !managerData.manager_data) {
            console.error('❌ 담당자별 추천 데이터 구조가 올바르지 않습니다:', managerData);
            throw new Error('담당자별 추천 데이터를 로드할 수 없습니다.');
        }
        
        // 디버깅: 데이터에서 사용 가능한 담당자 목록 확인
        const availableManagers = Object.keys(managerData.manager_data);
        console.log('🔍 데이터에서 사용 가능한 담당자들:', availableManagers);
        console.log('🔍 현재 담당자가 데이터에 있는가?', availableManagers.includes(currentManager));
        
        // 모든 담당자의 추천에서 해당 거래처에 대한 추천을 검색
        const allRecommendations = [];
        
        console.log(`📊 ${accountName} 거래처에 대한 추천 검색 중...`);
        
        // 현재 담당자 우선으로 검색
        let searchManagers = [];
        if (currentManager && currentManager !== '전체' && availableManagers.includes(currentManager)) {
            // 현재 담당자가 유효한 경우 우선 검색
            searchManagers = [currentManager, ...availableManagers.filter(m => m !== currentManager)];
            console.log(`🎯 ${currentManager} 담당자 우선으로 검색합니다.`);
        } else {
            // 전체 담당자 검색
            searchManagers = availableManagers;
            console.log(`🌐 모든 담당자를 대상으로 검색합니다.`);
        }
        
        for (const managerName of searchManagers) {
            console.log(`🔍 ${managerName} 담당자 검색 중...`);
            const recommendations = managerData.manager_data[managerName]?.recommendations || {};
            console.log(`  └─ ${managerName} 담당자의 품목군 수: ${Object.keys(recommendations).length}`);
            
            let managerRecommendationCount = 0;
            
            for (const [productGroup, recs] of Object.entries(recommendations)) {
                // 거래처명 또는 거래처코드로 매칭
                const matchingRecs = recs.filter(rec => {
                    // 거래처명 매칭 - 더 유연한 매칭
                    const recName = rec.거래처명?.toString().trim();
                    const searchName = accountName?.toString().trim();
                    
                    const nameMatch = recName && searchName && (
                        recName === searchName ||
                        recName.toLowerCase() === searchName.toLowerCase() ||
                        recName.includes(searchName) ||
                        searchName.includes(recName) ||
                        recName.replace(/\s+/g, '') === searchName.replace(/\s+/g, '') // 공백 제거 후 비교
                    );
                    
                    // 거래처코드 매칭 - 다양한 형태로 비교
                    const recCode = rec.거래처코드?.toString().trim();
                    const searchCode = accountCode?.toString().trim();
                    
                    const codeMatch = recCode && searchCode && (
                        recCode === searchCode ||
                        parseInt(recCode) === parseInt(searchCode) ||
                        recCode.padStart(10, '0') === searchCode.padStart(10, '0') // 앞자리 0 패딩
                    );
                    
                    const isMatch = nameMatch || codeMatch;
                    
                    // 매칭된 경우 로그 출력
                    if (isMatch) {
                        console.log(`    ✅ 매칭: ${rec.거래처명} (${rec.거래처코드}) vs 검색: ${accountName} (${accountCode})`);
                    }
                    
                    return isMatch;
                });
                
                if (matchingRecs.length > 0) {
                    console.log(`  └─ ${productGroup}: ${matchingRecs.length}개 매칭`);
                    managerRecommendationCount += matchingRecs.length;
                    
                    matchingRecs.forEach(rec => {
                        allRecommendations.push({
                            ...rec,
                            품목군: productGroup,
                            담당자: managerName,
                            우선순위: (currentManager && currentManager !== '전체' && managerName === currentManager) ? 1 : 2 // 현재 담당자 우선
                        });
                    });
                }
            }
            
            console.log(`  └─ ${managerName} 담당자 총 매칭 수: ${managerRecommendationCount}`);
        }
        
        console.log(`✅ 총 ${allRecommendations.length}개의 추천을 발견했습니다.`);
        
        if (allRecommendations.length === 0) {
            throw new Error('해당 거래처에 대한 추천 데이터가 없습니다.');
        }
        
        // 우선순위 및 성공확률순으로 정렬
        allRecommendations.sort((a, b) => {
            if (a.우선순위 !== b.우선순위) return a.우선순위 - b.우선순위;
            return (b.성공확률 || 0) - (a.성공확률 || 0);
        });
        
        // 기존 거래처 상세 카드가 있으면 제거
        const existingCard = document.getElementById('customerDetailCard');
        if (existingCard) {
            existingCard.remove();
        }
        
        // 거래처 상세 분석 카드 생성
        const analysisGrid = document.getElementById('segmentationGrid') || document.getElementById('basicGrid') || document.getElementById('analysisGrid');
        const customerDetailCard = document.createElement('div');
        customerDetailCard.id = 'customerDetailCard';
        customerDetailCard.className = 'analysis-card';
        customerDetailCard.style.border = '3px solid #10b981';
        customerDetailCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 212, 255, 0.1))';
        
        // 통계 계산
        const avgSuccessRate = allRecommendations.length > 0 
            ? (allRecommendations.reduce((sum, r) => sum + (r.성공확률 || 0), 0) / allRecommendations.length).toFixed(1)
            : 0;
        const totalExpectedSales = allRecommendations.reduce((sum, r) => sum + (r.예상매출 || 0), 0);
        const highPriorityCount = allRecommendations.filter(r => (r.성공확률 || 0) >= 80).length;
        const uniqueManagers = [...new Set(allRecommendations.map(r => r.담당자))];
        const productGroups = [...new Set(allRecommendations.map(r => r.품목군))];
        
        customerDetailCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h2 style="color: #10b981; margin: 0;">🏥 ${accountName}</h2>
                    <p style="color: #9ca3af; margin: 5px 0; font-size: 0.9rem;">거래처 코드: ${accountCode} | SmartAI 고품질 추천 분석</p>
                </div>
                <button onclick="this.closest('.analysis-card').remove()" 
                        style="background: #374151; border: none; color: #9ca3af; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
                    ✕ 닫기
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="color: #10b981; font-size: 1.8rem; font-weight: bold;">${allRecommendations.length}</div>
                    <div style="color: #d1d5db; font-size: 0.9rem;">추천 품목</div>
                </div>
                <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="color: #3b82f6; font-size: 1.8rem; font-weight: bold;">${avgSuccessRate}%</div>
                    <div style="color: #d1d5db; font-size: 0.9rem;">평균 성공률</div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="color: #f59e0b; font-size: 1.8rem; font-weight: bold;">${Math.round(totalExpectedSales / 10000).toLocaleString()}</div>
                    <div style="color: #d1d5db; font-size: 0.9rem;">예상매출(만원)</div>
                </div>
                <div style="background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="color: #8b5cf6; font-size: 1.8rem; font-weight: bold;">${highPriorityCount}</div>
                    <div style="color: #d1d5db; font-size: 0.9rem;">고확률 품목</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div style="background: rgba(31, 41, 55, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #10b981; margin: 0 0 10px 0;">📋 분석 담당자</h4>
                    <div style="color: #d1d5db; font-size: 0.9rem;">
                        ${uniqueManagers.join(', ')} (${uniqueManagers.length}명)
                    </div>
                </div>
                <div style="background: rgba(31, 41, 55, 0.5); padding: 15px; border-radius: 10px;">
                    <h4 style="color: #10b981; margin: 0 0 10px 0;">🎯 추천 카테고리</h4>
                    <div style="color: #d1d5db; font-size: 0.9rem;">
                        ${productGroups.slice(0, 3).join(', ')}${productGroups.length > 3 ? ` 외 ${productGroups.length - 3}개` : ''}
                    </div>
                </div>
            </div>
            
            <h3 style="color: #00d4ff; margin-bottom: 15px;">🚀 상위 추천 품목 (성공률 기준)</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>품목군</th>
                            <th>성공확률</th>
                            <th>예상매출</th>
                            <th>진료과</th>
                            <th>담당자</th>
                            <th>분석 근거</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allRecommendations.slice(0, 15).map((rec, index) => {
                            const priorityColor = rec.성공확률 >= 80 ? '#10b981' : rec.성공확률 >= 60 ? '#f59e0b' : '#6b7280';
                            const isCurrentManager = currentManager && currentManager !== '전체' && rec.담당자 === currentManager;
                            
                            return `
                                <tr style="${isCurrentManager ? 'background: rgba(16, 185, 129, 0.1);' : ''}">
                                    <td><strong>${index + 1}</strong></td>
                                    <td>
                                        <strong style="color: #00d4ff; cursor: pointer;" 
                                                onclick="generateSmartAIRecommendationsWithManager('${rec.품목군}')"
                                                title="클릭하여 ${rec.품목군} 전체 추천 보기">
                                            ${rec.품목군}
                                        </strong>
                                        ${isCurrentManager ? '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 5px;">현재담당</span>' : ''}
                                    </td>
                                    <td>
                                        <span style="color: ${priorityColor}; font-weight: bold; font-size: 1.1rem;">
                                            ${rec.성공확률 || 0}%
                                        </span>
                                    </td>
                                    <td><strong>${Math.round((rec.예상매출 || 0) / 10000).toLocaleString()}</strong>만원</td>
                                    <td>
                                        <span style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">
                                            ${rec.진료과 || '일반진료과'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style="color: ${isCurrentManager ? '#10b981' : '#9ca3af'}; font-weight: ${isCurrentManager ? 'bold' : 'normal'};">
                                            ${rec.담당자}
                                        </span>
                                    </td>
                                    <td style="max-width: 200px; font-size: 0.85rem; color: #d1d5db;">
                                        ${(rec.추천이유 || '고품질 AI 분석 기반 추천').substring(0, 50)}${(rec.추천이유 || '').length > 50 ? '...' : ''}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 10px; border-left: 4px solid #10b981;">
                <h4 style="color: #10b981; margin: 0 0 8px 0;">💡 AI 추천 전략</h4>
                <p style="color: #d1d5db; font-size: 0.9rem; margin: 0; line-height: 1.5;">
                    <strong>${accountName}</strong>은 <strong>${avgSuccessRate}%</strong>의 평균 성공률로 
                    <strong>${allRecommendations.length}개 품목</strong>에서 추천 대상으로 선정되었습니다. 
                    특히 <strong>${highPriorityCount}개 고확률 품목</strong>에 집중하여 
                    총 <strong>${Math.round(totalExpectedSales / 10000).toLocaleString()}만원</strong>의 매출 기회를 확보할 수 있습니다.
                    ${currentManager && currentManager !== '전체' ? `현재 ${currentManager} 담당자의 품목을 우선 표시했습니다.` : '모든 담당자의 추천을 통합하여 표시했습니다.'}
                </p>
            </div>
        `;
        
        // 카드를 맨 위에 삽입
        analysisGrid.insertBefore(customerDetailCard, analysisGrid.firstChild);
        
        // 카드로 스크롤
        customerDetailCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        showStatus(`${accountName}의 고품질 추천 분석이 완료되었습니다 (${allRecommendations.length}개 품목).`, 'success');
        showLoading(false);
        
        // SmartAI 추천 탭으로 전환
        if (typeof autoSwitchTab === 'function') {
            autoSwitchTab('segmentation');
        }
        
    } catch (error) {
        console.error('거래처 추천 분석 오류:', error);
        showStatus(`거래처 추천 분석 실패: ${error.message}`, 'error');
        showLoading(false);
    }
}

// 거래처에 대한 추천 데이터 존재 여부를 빠르게 확인하는 함수
async function hasRecommendationsForAccount(accountName, accountCode) {
    try {
        if (typeof window.loadManagerRecommendationsData !== 'function') {
            return false;
        }
        
        const managerData = await window.loadManagerRecommendationsData();
        if (!managerData || !managerData.manager_data) {
            return false;
        }
        
        // 모든 담당자의 추천에서 해당 거래처 검색
        for (const managerName of Object.keys(managerData.manager_data)) {
            const recommendations = managerData.manager_data[managerName]?.recommendations || {};
            
            for (const [productGroup, recs] of Object.entries(recommendations)) {
                const hasMatch = recs.some(rec => {
                    // 거래처명 매칭
                    const recName = rec.거래처명?.toString().trim();
                    const searchName = accountName?.toString().trim();
                    
                    const nameMatch = recName && searchName && (
                        recName === searchName ||
                        recName.toLowerCase() === searchName.toLowerCase() ||
                        recName.includes(searchName) ||
                        searchName.includes(recName) ||
                        recName.replace(/\s+/g, '') === searchName.replace(/\s+/g, '')
                    );
                    
                    // 거래처코드 매칭
                    const recCode = rec.거래처코드?.toString().trim();
                    const searchCode = accountCode?.toString().trim();
                    
                    const codeMatch = recCode && searchCode && (
                        recCode === searchCode ||
                        parseInt(recCode) === parseInt(searchCode) ||
                        recCode.padStart(10, '0') === searchCode.padStart(10, '0')
                    );
                    
                    return nameMatch || codeMatch;
                });
                
                if (hasMatch) {
                    return true; // 하나라도 매칭되면 true 반환
                }
            }
        }
        
        return false; // 아무것도 매칭되지 않으면 false
    } catch (error) {
        console.error('추천 데이터 확인 오류:', error);
        return false;
    }
}

// 거래처명을 클릭 가능/불가능하게 스타일링하는 함수
function formatCustomerNameWithRecommendations(customerName, customerCode, hasRecommendations) {
    if (hasRecommendations) {
        // 추천 데이터가 있는 경우: 클릭 가능
        return `<strong style="color: #00d4ff; cursor: pointer; text-decoration: underline;" 
                        onclick="showCustomerRecommendations('${customerName}', '${customerCode}')" 
                        title="클릭하여 AI 추천 품목 보기 (추천 데이터 있음)">
                    ${customerName}
                </strong>`;
    } else {
        // 추천 데이터가 없는 경우: 비활성화
        return `<strong style="color: #6b7280; cursor: not-allowed; text-decoration: none;" 
                        title="추천 데이터 없음 (클릭 불가)">
                    ${customerName}
                    <span style="color: #ef4444; font-size: 0.7rem; margin-left: 5px;">●</span>
                </strong>`;
    }
}

// 전역으로 노출
window.hasRecommendationsForAccount = hasRecommendationsForAccount;
window.formatCustomerNameWithRecommendations = formatCustomerNameWithRecommendations; 