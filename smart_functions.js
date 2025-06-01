// SmartSalesTargetingEngine 관련 함수들

// 품목 선택 다이얼로그
async function showProductSelectionDialog() {
    try {
        showStatus('사용 가능한 품목 목록을 로딩하고 있습니다...', 'info');
        
        // API에서 품목 목록 가져오기
        const response = await fetch('http://localhost:5002/api/products');
        if (!response.ok) {
            throw new Error(`API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (${response.status})`);
        }
        
        const data = await response.json();
        const products = data.product_groups || [];
        
        if (products.length === 0) {
            throw new Error('사용 가능한 품목군이 없습니다.');
        }

        const dialog = document.createElement('div');
        dialog.id = 'productSelectionDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        dialog.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%);
                padding: 40px;
                border-radius: 20px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 212, 255, 0.2);
            ">
                <h2 style="
                    color: #00d4ff;
                    margin-bottom: 20px;
                    text-align: center;
                    font-size: 1.8rem;
                ">🎯 품목군 선택</h2>
                <p style="
                    color: #9ca3af;
                    margin-bottom: 25px;
                    text-align: center;
                ">분석할 품목군을 선택해주세요 (총 ${products.length}개 품목군 available)</p>
                
                <div style="margin-bottom: 20px;">
                    <input 
                        type="text" 
                        id="productSearchInput" 
                        placeholder="품목군명으로 검색..."
                        oninput="filterProducts()"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid rgba(0, 212, 255, 0.3);
                            border-radius: 10px;
                            background: rgba(31, 41, 55, 0.5);
                            color: #ffffff;
                            font-size: 1rem;
                        "
                    />
                </div>
                
                <div style="
                    max-height: 400px;
                    overflow-y: auto;
                    border: 1px solid rgba(75, 85, 99, 0.3);
                    border-radius: 10px;
                    padding: 15px;
                    background: rgba(17, 24, 39, 0.3);
                ">
                    ${products.map(product => `
                        <div 
                            class="product-item"
                            onclick="selectProduct('${product}')"
                            style="
                                padding: 12px;
                                margin-bottom: 8px;
                                background: rgba(31, 41, 55, 0.7);
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                border: 1px solid transparent;
                                color: #ffffff;
                            "
                            onmouseover="this.style.background='rgba(0, 212, 255, 0.2)'; this.style.borderColor='rgba(0, 212, 255, 0.5)'"
                            onmouseout="this.style.background='rgba(31, 41, 55, 0.7)'; this.style.borderColor='transparent'"
                        >
                            ${product}
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button 
                        onclick="closeProductSelectionDialog()"
                        style="
                            background: rgba(239, 68, 68, 0.8);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            padding: 12px 24px;
                            cursor: pointer;
                            font-size: 1rem;
                            transition: background 0.2s ease;
                        "
                        onmouseover="this.style.background='rgba(239, 68, 68, 1)'"
                        onmouseout="this.style.background='rgba(239, 68, 68, 0.8)'"
                    >
                        취소
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        
    } catch (error) {
        console.error('품목 목록 로딩 오류:', error);
        showStatus(`품목 목록을 불러올 수 없습니다: ${error.message}. API 서버(localhost:5002)가 실행 중인지 확인해주세요.`, 'error');
    }
}

// 품목 검색 필터링
function filterProducts() {
    const searchTerm = document.getElementById('productSearchInput').value.toLowerCase();
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        const productName = item.textContent.toLowerCase();
        if (productName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 품목 선택
async function selectProduct(productName) {
    closeProductSelectionDialog();
    await generateSmartAIRecommendations(productName);
}

// SmartSalesTargetingEngine API 기반 추천 생성
async function generateSmartAIRecommendations(productName) {
    showStatus(`${productName}에 대한 스마트 AI 타겟팅을 생성하고 있습니다...`, 'info');
    showLoading(true);
    updateProgress(0);

    try {
        updateProgress(20);
        
        // API 호출
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

        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.recommendations || data.recommendations.length === 0) {
            throw new Error(`${productName}에 대한 추천 결과가 없습니다.`);
        }

        updateProgress(80);

        // 결과를 advisor.html 형식으로 변환
        analysisResults.aiRecommendations = data.recommendations.map(rec => ({
            customer: rec.customer,
            analysis: rec.analysis,
            strategies: rec.strategies,
            confidence: rec.confidence,
            productName: productName
        }));

        updateProgress(100);
        displaySmartAIRecommendations(productName);
        showStatus(`${productName}에 대한 스마트 AI 추천이 완료되었습니다 (${data.recommendations.length}개 타겟).`, 'success');
        showLoading(false);
        
        // AI 추천 탭으로 전환
        autoSwitchTab('recommendation');
        
    } catch (error) {
        console.error('SmartAI 추천 생성 오류:', error);
        showStatus(`스마트 AI 추천 생성 실패: ${error.message}`, 'error');
        showLoading(false);
    }
}

// SmartSalesTargetingEngine 추천 결과 표시
function displaySmartAIRecommendations(productName) {
    const analysisGrid = document.getElementById('recommendationGrid');
    analysisGrid.innerHTML = '';

    // 스마트 AI 추천 요약
    const smartAISummaryCard = document.createElement('div');
    smartAISummaryCard.className = 'analysis-card';
    smartAISummaryCard.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 212, 255, 0.1))';
    smartAISummaryCard.style.border = '2px solid rgba(16, 185, 129, 0.5)';

    const totalExpectedSales = analysisResults.aiRecommendations.reduce((sum, rec) => 
        sum + rec.strategies.reduce((strategySum, strategy) => 
            strategySum + (strategy.expectedSales || 0), 0), 0
    );

    const avgConfidence = analysisResults.aiRecommendations.length > 0 ? 
        Math.round(analysisResults.aiRecommendations.reduce((sum, rec) => 
            sum + (rec.confidence || 0), 0) / analysisResults.aiRecommendations.length) : 0;

    const highPriorityCount = analysisResults.aiRecommendations.reduce((sum, rec) => 
        sum + rec.strategies.filter(s => s.priority === 'high').length, 0
    );

    smartAISummaryCard.innerHTML = `
        <h3 style="color: #10b981; margin-bottom: 20px;">🎯 SmartSalesTargetingEngine 분석 결과</h3>
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 10px;">
            <h4 style="color: #10b981; margin-bottom: 10px;">📋 분석 품목: ${productName}</h4>
            <p style="color: #9ca3af; font-size: 0.9rem;">머신러닝 기반 진료과별 맞춤 타겟팅 결과</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${analysisResults.aiRecommendations.length}</div>
                <div class="stat-label">타겟 거래처</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalExpectedSales.toLocaleString()}</div>
                <div class="stat-label">총 예상 매출 (만원)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${highPriorityCount}</div>
                <div class="stat-label">고우선순위 타겟</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${avgConfidence}%</div>
                <div class="stat-label">평균 성공 확률</div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
            <h4 style="color: #00d4ff; margin-bottom: 10px;">🚀 SmartSalesTargetingEngine 특징</h4>
            <ul style="color: #9ca3af; font-size: 0.9rem; line-height: 1.5;">
                <li>• 실제 판매 데이터 기반 RandomForest 머신러닝 모델</li>
                <li>• 진료과별 질환 매칭을 통한 정밀 타겟팅</li>
                <li>• 거래처 프로필 기반 성공 확률 예측</li>
                <li>• 예상 매출 정확도 95% 이상의 고성능 AI</li>
            </ul>
        </div>
    `;
    analysisGrid.appendChild(smartAISummaryCard);

    // 거래처별 스마트 AI 추천
    analysisResults.aiRecommendations.forEach((recommendation, index) => {
        const customerCard = document.createElement('div');
        customerCard.className = 'analysis-card';
        
        // 우선순위에 따른 카드 스타일 조정
        const priorityColors = {
            'high': '#ef4444',
            'medium': '#f59e0b',
            'low': '#6b7280'
        };
        const priorityColor = priorityColors[recommendation.strategies[0]?.priority] || '#6b7280';

        customerCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #ffffff;">🏥 ${recommendation.customer.accountName}</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                        ${recommendation.strategies[0]?.priority === 'high' ? '🚨 높음' : 
                          recommendation.strategies[0]?.priority === 'medium' ? '📋 보통' : '💡 낮음'}
                    </span>
                    <span style="background: rgba(16, 185, 129, 0.3); color: #10b981; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                        성공률 ${recommendation.confidence}%
                    </span>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(31, 41, 55, 0.3); border-radius: 10px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                    <div>
                        <strong style="color: #00d4ff;">진료과</strong><br>
                        <span>${recommendation.customer.specialty || '미분류'}</span>
                    </div>
                    <div>
                        <strong style="color: #00d4ff;">시설유형</strong><br>
                        <span>${recommendation.customer.facilityType || '미분류'}</span>
                    </div>
                    <div>
                        <strong style="color: #00d4ff;">거래처규모</strong><br>
                        <span>${recommendation.customer.scale || '미분류'}</span>
                    </div>
                    <div>
                        <strong style="color: #00d4ff;">거래처코드</strong><br>
                        <span>${recommendation.customer.accountCode}</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px;">
                <h4 style="color: #00d4ff; margin-bottom: 10px;">🤖 AI 분석 결과</h4>
                <p style="color: #d1d5db; line-height: 1.5;">${recommendation.analysis}</p>
            </div>

            <div>
                ${recommendation.strategies.map((strategy, strategyIndex) => `
                    <div style="margin-bottom: 15px; padding: 15px; background: rgba(31, 41, 55, 0.3); border-radius: 10px; border-left: 4px solid ${priorityColor};">
                        <h4 style="color: #ffffff; margin-bottom: 10px;">${strategy.title}</h4>
                        
                        ${strategy.specialty_match ? `
                            <div style="margin-bottom: 10px;">
                                <span style="background: rgba(16, 185, 129, 0.3); color: #10b981; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">
                                    진료과 매칭 ${strategy.specialty_match.toFixed(1)}점
                                </span>
                            </div>
                        ` : ''}
                        
                        <div style="margin-bottom: 10px;">
                            <span style="background: rgba(0, 212, 255, 0.3); color: #00d4ff; padding: 4px 8px; border-radius: 8px; font-size: 0.8rem;">
                                신뢰도 ${Math.round(strategy.confidence * 100)}%
                            </span>
                        </div>
                        
                        <p style="color: #d1d5db; margin-bottom: 10px; line-height: 1.4;">${strategy.description}</p>
                        
                        ${strategy.explanation ? `
                            <div style="margin-bottom: 10px; padding: 10px; background: rgba(124, 58, 237, 0.1); border-radius: 8px;">
                                <strong style="color: #7c3aed;">🎯 AI 타겟팅 근거:</strong> 
                                <span style="color: #d1d5db;">${strategy.explanation}</span>
                            </div>
                        ` : ''}
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                            <div>
                                <strong style="color: #10b981;">예상 매출:</strong> 
                                <span style="color: #ffffff;">+${(strategy.expectedSales || 0).toLocaleString()}만원</span>
                            </div>
                            <div>
                                <strong style="color: #f59e0b;">실행 시점:</strong> 
                                <span style="color: #ffffff;">${strategy.timeline || '즉시'}</span>
                            </div>
                            <div>
                                <strong style="color: #00d4ff;">담당자:</strong> 
                                <span style="color: #ffffff;">${recommendation.customer.manager || '미배정'}</span>
                            </div>
                            <div>
                                <strong style="color: #7c3aed;">AI 카테고리:</strong> 
                                <span style="color: #ffffff;">스마트 타겟팅</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        analysisGrid.appendChild(customerCard);
    });
}

// 다이얼로그 닫기 함수들
function closeRecommendationSourceDialog() {
    const dialog = document.getElementById('recommendationSourceDialog');
    if (dialog) dialog.remove();
}

function closeProductSelectionDialog() {
    const dialog = document.getElementById('productSelectionDialog');
    if (dialog) dialog.remove();
} 