// 향상된 통계 표시 시스템

// 원본 displayBasicAnalysis 함수를 백업하고 새로운 함수로 교체
if (typeof window.originalDisplayBasicAnalysis === 'undefined') {
    window.originalDisplayBasicAnalysis = window.displayBasicAnalysis;
}

// 향상된 기본 분석 결과 표시 함수
function displayBasicAnalysis() {
    console.log('🔧 enhanced_stats_display.js displayBasicAnalysis 함수 호출됨');
    
    const analysisGrid = document.getElementById('analysisGrid');
    analysisGrid.innerHTML = '';

    // 기본 통계 카드 + 월별 매출 차트
    const avgMonthlySales = processedData.totalSales / analysisResults.basic.monthlySales.length;
    const recentMonthFormatted = processedData.recentMonth ? `${Math.floor(processedData.recentMonth / 100)}년 ${processedData.recentMonth % 100}월` : '';
    
    // 담당자가 선택되었는지 확인
    const isManagerSelected = window.currentManager && window.currentManager !== "전체" && window.currentManager !== undefined;
    const titleText = isManagerSelected ? `${window.currentManager} 담당자` : "전체";
    
    console.log('🔧 담당자 선택 상태:', { currentManager: window.currentManager, isManagerSelected, titleText });
    
    // 전체 데이터와 비교할 수 있도록 원본 데이터 사용
    const originalData = window.originalProcessedData || processedData;
    const originalAvgMonthlySales = originalData.totalSales / analysisResults.basic.monthlySales.length;
    
    console.log('🔧 데이터 상태:', { 
        hasOriginalData: !!window.originalProcessedData, 
        currentDataRecords: processedData.totalRecords,
        originalDataRecords: originalData.totalRecords 
    });
    
    // 비교 표시 조건: 담당자가 선택되었을 때 항상 표시
    const showComparison = isManagerSelected;
    
    console.log('🔧 비교 표시 여부:', showComparison);
    
    const basicStatsCard = document.createElement('div');
    basicStatsCard.className = 'analysis-card';
    basicStatsCard.innerHTML = `
        <h3>📊 핵심 지표 (${titleText} - ${recentMonthFormatted} 기준)</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${processedData.recentMonthAccounts.toLocaleString()}</div>
                <div class="stat-label">최근월 활성 거래처</div>
                ${showComparison ? `<div class="stat-comparison">전체: ${originalData.recentMonthAccounts.toLocaleString()}개</div>` : ''}
            </div>
            <div class="stat-item">
                <div class="stat-value">${processedData.recentMonthProducts.toLocaleString()}</div>
                <div class="stat-label">최근월 거래 품목군</div>
                ${showComparison ? `<div class="stat-comparison">전체: ${originalData.recentMonthProducts.toLocaleString()}개</div>` : ''}
            </div>
            <div class="stat-item">
                <div class="stat-value">${(processedData.recentMonthSales / 100000000).toFixed(1)}</div>
                <div class="stat-label">최근월 매출 (억원)</div>
                ${showComparison ? `<div class="stat-comparison">전체: ${(originalData.recentMonthSales / 100000000).toFixed(1)}억원</div>` : ''}
            </div>
            <div class="stat-item">
                <div class="stat-value">${processedData.totalRecords.toLocaleString()}</div>
                <div class="stat-label">전체 거래 집계 수</div>
                ${showComparison ? `<div class="stat-comparison">전체: ${originalData.totalRecords.toLocaleString()}개</div>` : ''}
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(avgMonthlySales / 100000000 * 10) / 10}</div>
                <div class="stat-label">월평균 매출 (억원)</div>
                ${showComparison ? `<div class="stat-comparison">전체: ${Math.round(originalAvgMonthlySales / 100000000 * 10) / 10}억원</div>` : ''}
            </div>
            <div class="stat-item">
                <div class="stat-value">${processedData.uniqueAccounts.toLocaleString()}</div>
                <div class="stat-label">활성 거래처</div>
                ${showComparison ? `<div class="stat-comparison">전체: ${originalData.uniqueAccounts.toLocaleString()}개</div>` : ''}
            </div>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid rgba(75, 85, 99, 0.3);">
        
        <h4 style="margin-bottom: 15px; color: #ffffff; font-size: 1.1rem;">📈 월별 매출 및 거래 활동 추이</h4>
        <p style="margin-bottom: 15px; color: #9ca3af; font-size: 0.9rem;">
            월별 집계된 매출액과 거래처-품목 조합 수의 변화를 보여줍니다.
        </p>
        <div class="chart-container">
            <canvas id="monthlySalesChart"></canvas>
        </div>
    `;
    analysisGrid.appendChild(basicStatsCard);

    // 상위 품목 테이블 (최근 월 기준)
    const topProductsCard = document.createElement('div');
    topProductsCard.className = 'analysis-card';
    topProductsCard.innerHTML = `
        <h3>🏆 상위 품목 성과 (${titleText} - ${recentMonthFormatted})</h3>
        <p style="margin-bottom: 15px; color: #9ca3af; font-size: 0.9rem;">
            품목명을 클릭하면 해당 품목을 구매하는 거래처 목록을 볼 수 있습니다.
        </p>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>순위</th>
                        <th>품목군</th>
                        <th>최근월 매출액</th>
                        <th>활성 거래처</th>
                        <th>비중</th>
                    </tr>
                </thead>
                <tbody>
                    ${analysisResults.basic.productAnalysis.slice(0, 10).map((item, index) => `
                        <tr>
                            <td><strong>${index + 1}</strong></td>
                            <td><span class="clickable-product" onclick="showProductCustomers('${item.product}')" style="color: #00d4ff; cursor: pointer; text-decoration: underline;">${item.product}</span></td>
                            <td><strong>${Math.round(item.recentMonthSales / 10000).toLocaleString()}</strong>만원</td>
                            <td>${item.accountCount}개</td>
                            <td><span style="color: #10b981; font-weight: 500;">${((item.recentMonthSales / processedData.recentMonthSales) * 100).toFixed(1)}%</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    analysisGrid.appendChild(topProductsCard);

    // 담당자별 성과 (최근월 기준) - addManagerListToAnalysis 대신 직접 추가
    if (analysisResults.basic.managerAnalysis && analysisResults.basic.managerAnalysis.length > 0) {
        const managerRecentMonthFormatted = processedData.recentMonth ? `${Math.floor(processedData.recentMonth / 100)}년 ${processedData.recentMonth % 100}월` : '';
        const managerCard = document.createElement('div');
        managerCard.className = 'analysis-card';
        managerCard.innerHTML = `
            <h3>👤 담당자 실적 (${managerRecentMonthFormatted})</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>담당자</th>
                            <th>최근월 매출</th>
                            <th>활성 거래처</th>
                            <th>비중</th>
                            <th>취급 품목</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analysisResults.basic.managerAnalysis.map(item => `
                            <tr>
                                <td><strong>${item.manager}</strong></td>
                                <td>${Math.round(item.recentMonthSales / 10000).toLocaleString()}만원</td>
                                <td>${item.accountCount}개</td>
                                <td><span style="color: #10b981; font-weight: 500;">${((item.recentMonthSales / processedData.recentMonthSales) * 100).toFixed(1)}%</span></td>
                                <td>${item.productCount}개</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        analysisGrid.appendChild(managerCard);
    }

    // 차트 생성
    setTimeout(() => {
        if (typeof createMonthlySalesChart === 'function') {
            createMonthlySalesChart();
        }
    }, 100);
    
    console.log('✅ enhanced_stats_display.js displayBasicAnalysis 완료');
}

// 전체 데이터 초기화 함수 (데이터 로드 시 호출)
function initializeOriginalData() {
    if (!window.originalProcessedData || !window.originalProcessedData.totalRecords) {
        window.originalProcessedData = { ...processedData };
        console.log('✅ 전체 데이터가 originalProcessedData에 저장되었습니다.');
    }
}

// 담당자 선택 시 데이터 업데이트 후 호출할 함수
function updateStatsDisplay() {
    if (typeof displayBasicAnalysis === 'function' && document.getElementById('analysisGrid')) {
        displayBasicAnalysis();
    }
}

console.log('✅ 향상된 통계 표시 시스템이 로드되었습니다.');