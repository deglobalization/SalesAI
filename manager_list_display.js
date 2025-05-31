// 전체 담당자 목록 관리 모듈

// 전체 담당자 목록 데이터 생성
function createManagerListData() {
    const currentManager = window.currentManager;
    const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}');
    
    // 디버깅: 저장된 분석 결과 구조 확인
    console.log('🔍 저장된 분석 결과 구조:', Object.keys(analysisResults));
    if (Object.keys(analysisResults).length > 0) {
        const firstManager = Object.keys(analysisResults)[0];
        console.log(`📊 ${firstManager} 분석 결과 구조:`, analysisResults[firstManager]);
    }
    
    // 모든 담당자 목록 (실제 데이터 건수 기준)
    const allManagers = [
        { name: '김서연', recordCount: 55941 },
        { name: '이한솔B', recordCount: 55733 },
        { name: '김관태', recordCount: 50763 },
        { name: '이창준A', recordCount: 47763 },
        { name: '박경현', recordCount: 47046 },
        { name: '이지형', recordCount: 46503 },
        { name: '이희영', recordCount: 41077 },
        { name: '김인용', recordCount: 39073 },
        { name: '김병민', recordCount: 38214 },
        { name: '이인철', recordCount: 25168 }
    ];
    
    // 담당자 목록 생성
    const managerList = allManagers.map(manager => {
        const isAnalyzed = analysisResults[manager.name] ? true : false;
        const isCurrent = manager.name === currentManager;
        
        let managerStats = null;
        if (isCurrent) {
            // 현재 담당자의 경우 핵심지표와 동일한 processedData 사용
            if (window.processedData) {
                managerStats = {
                    recentMonthSales: window.processedData.recentMonthSales || 0,
                    accountCount: window.processedData.recentMonthAccounts || 0,
                    productCount: window.processedData.recentMonthProducts || 0
                };
                console.log(`📈 현재 담당자 ${manager.name} (핵심지표 기준):`, {
                    매출: managerStats.recentMonthSales,
                    거래처: managerStats.accountCount,
                    품목: managerStats.productCount
                });
            } else if (window.analysisResults?.basic?.managerAnalysis) {
                // 백업: 분석 결과에서 가져오기
                managerStats = window.analysisResults.basic.managerAnalysis.find(m => m.manager === manager.name);
                console.log(`📊 현재 담당자 ${manager.name} (분석결과 백업):`, managerStats?.recentMonthSales);
            }
        } else if (isAnalyzed) {
            // 분석된 담당자의 경우 저장된 분석 결과에서 가져오기
            const savedData = analysisResults[manager.name];
            console.log(`💾 ${manager.name} 저장된 데이터:`, savedData);
            
            // 핵심지표와 동일한 기준: processedData 우선 사용
            if (savedData.processedData) {
                // processedData에서 매출 정보 추출 (핵심지표와 동일한 값)
                managerStats = {
                    recentMonthSales: savedData.processedData.recentMonthSales || 0,
                    accountCount: savedData.processedData.recentMonthAccounts || 0,
                    productCount: savedData.processedData.recentMonthProducts || 0
                };
                console.log(`💰 ${manager.name} processedData 기준:`, {
                    매출: managerStats.recentMonthSales,
                    거래처: managerStats.accountCount,
                    품목: managerStats.productCount
                });
            } else if (savedData.basic?.managerAnalysis && savedData.basic.managerAnalysis.length > 0) {
                // 백업: basic.managerAnalysis에서 해당 담당자 데이터 찾기
                const managerAnalysis = savedData.basic.managerAnalysis.find(m => m.manager === manager.name) || savedData.basic.managerAnalysis[0];
                managerStats = {
                    recentMonthSales: managerAnalysis.recentMonthSales || 0,
                    accountCount: managerAnalysis.accountCount || 0,
                    productCount: managerAnalysis.productCount || 0
                };
                console.log(`📊 ${manager.name} managerAnalysis 백업:`, managerStats.recentMonthSales);
            } else if (savedData.managerAnalysis && savedData.managerAnalysis.length > 0) {
                // 추가 백업: managerAnalysis에서 해당 담당자 데이터 찾기
                const managerAnalysis = savedData.managerAnalysis.find(m => m.manager === manager.name) || savedData.managerAnalysis[0];
                managerStats = {
                    recentMonthSales: managerAnalysis.recentMonthSales || 0,
                    accountCount: managerAnalysis.accountCount || 0,
                    productCount: managerAnalysis.productCount || 0
                };
                console.log(`🔄 ${manager.name} 추가 백업:`, managerStats.recentMonthSales);
            }
            
            console.log(`💰 ${manager.name} 추출된 매출:`, managerStats?.recentMonthSales);
        }
        
        // 백업: 데이터가 없으면 추정값 사용
        if (!managerStats) {
            managerStats = {
                recentMonthSales: manager.recordCount * 5000, // 레코드당 평균 5천원 추정
                accountCount: Math.floor(manager.recordCount / 80),
                productCount: Math.floor(manager.recordCount / 150)
            };
            console.log(`🔢 ${manager.name} 추정값 사용:`, managerStats.recentMonthSales);
        }
        
        return {
            manager: manager.name,
            isCurrent: isCurrent,
            isAnalyzed: isAnalyzed,
            recentMonthSales: managerStats?.recentMonthSales || 0,
            accountCount: managerStats?.accountCount || 0,
            productCount: managerStats?.productCount || 0,
            recordCount: manager.recordCount
        };
    });
    
    // 현재 담당자를 최상위로, 나머지는 매출 순서대로 정렬
    const currentManagerItem = managerList.filter(m => m.isCurrent);
    const otherManagers = managerList.filter(m => !m.isCurrent)
        .sort((a, b) => b.recentMonthSales - a.recentMonthSales);
    
    return [...currentManagerItem, ...otherManagers];
}

// 전체 담당자 목록 카드 생성
function createManagerListCard() {
    const currentMonth = window.processedData?.recentMonth ? 
        `${Math.floor(window.processedData.recentMonth / 100)}년 ${window.processedData.recentMonth % 100}월` : 
        '최근월';
    
    const allManagersData = createManagerListData();
    
    const managerCard = document.createElement('div');
    managerCard.className = 'analysis-card';
    
    managerCard.innerHTML = `
        <h3>👥 전체 담당자 목록 (${currentMonth})</h3>
        <p style="margin-bottom: 15px; color: #9ca3af; font-size: 0.9rem;">
            담당자명을 클릭하면 해당 담당자의 분석으로 전환됩니다. 현재 분석 중인 담당자는 상위에 표시됩니다.
        </p>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="text-align: center;">순위</th>
                        <th>담당자</th>
                        <th style="text-align: center;">분석상태</th>
                        <th style="text-align: right;">최근월 매출</th>
                        <th style="text-align: center;">거래처 수</th>
                    </tr>
                </thead>
                <tbody>
                    ${allManagersData.map((item, index) => `
                        <tr style="${item.isCurrent ? 'background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981;' : ''}" 
                            ${!item.isCurrent ? `onmouseover="this.style.backgroundColor='rgba(99, 102, 241, 0.1)'" onmouseout="this.style.backgroundColor='transparent'"` : ''}>
                            <td style="text-align: center;">
                                ${item.isCurrent ? 
                                    '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">현재</span>' : 
                                    `<strong>${index + 1}</strong>`
                                }
                            </td>
                            <td>
                                ${item.isCurrent ? 
                                    `<strong style="color: #10b981;">${item.manager}</strong>` :
                                    `<span onclick="switchToManager('${item.manager}')" style="color: #00d4ff; cursor: pointer; text-decoration: underline; font-weight: 500;">${item.manager}</span>`
                                }
                                ${item.isAnalyzed && !item.isCurrent ? 
                                    `<br><button onclick="selectAnalyzedManager('${item.manager}')" style="background: #6366f1; color: white; border: none; border-radius: 4px; padding: 2px 6px; font-size: 0.75rem; margin-top: 4px; cursor: pointer;">📊 분석보기</button>` : 
                                    ''
                                }
                            </td>
                            <td style="text-align: center;">
                                ${item.isAnalyzed ? 
                                    '<span style="color: #10b981; font-size: 0.9rem;">✅ 분석완료</span>' : 
                                    '<span style="color: #9ca3af; font-size: 0.9rem;">⏳ 미분석</span>'
                                }
                            </td>
                            <td style="text-align: right;">
                                <strong>${item.recentMonthSales ? Math.round(item.recentMonthSales / 10000).toLocaleString() : '0'}만원</strong>
                            </td>
                            <td style="text-align: center;">${item.accountCount || 0}개</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: rgba(31, 41, 55, 0.3); border-radius: 10px;">
            <div style="margin-bottom: 15px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10b981;">
                <div style="color: #10b981; font-size: 0.9rem; font-weight: 500; margin-bottom: 5px;">📊 데이터 기준 정보</div>
                <div style="color: #9ca3af; font-size: 0.8rem;">
                    현재 담당자: <strong>핵심지표와 동일한 processedData 기준</strong> | 
                    다른 담당자: <strong>저장된 분석결과의 processedData 기준</strong> | 
                    핵심지표 기준 매출: <strong>${window.processedData ? Math.round(window.processedData.recentMonthSales / 10000).toLocaleString() : '0'}만원</strong>
                </div>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button onclick="showBatchAnalysisUI()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: transform 0.2s;" 
                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔄 전체 일괄분석
                </button>
                <button onclick="showAnalyzedManagersList()" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: transform 0.2s;" 
                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    📋 분석결과 목록
                </button>
                <button onclick="changeManager()" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: transform 0.2s;" 
                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    👥 담당자 변경
                </button>
            </div>
        </div>
    `;
    
    return managerCard;
}

// 다른 담당자로 전환
function switchToManager(managerName) {
    if (managerName === window.currentManager) {
        showStatus('이미 해당 담당자를 분석 중입니다.', 'info');
        return;
    }
    
    const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}');
    if (analysisResults[managerName]) {
        // 분석된 담당자인 경우 바로 전환
        selectAnalyzedManager(managerName);
    } else {
        // 미분석 담당자인 경우 분석 시작
        loadNewManagerData(managerName);
    }
}

// 새로운 담당자 데이터 로드 및 분석
function loadNewManagerData(managerName) {
    showStatus(`${managerName} 담당자의 새로운 분석을 시작합니다...`, 'info');
    showLoading(true);
    updateProgress(10);
    
    // manager_data 폴더에서 해당 담당자 파일 로드
    const filename = `manager_data/manager_${managerName}.csv`;
    
    fetch(filename)
        .then(response => {
            if (!response.ok) {
                throw new Error(`${managerName} 담당자 데이터 파일을 찾을 수 없습니다.`);
            }
            return response.text();
        })
        .then(csvText => {
            updateProgress(30);
            
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    if (results.data && results.data.length > 0) {
                        updateProgress(50);
                        
                        // 전역 변수에 설정
                        window.salesData = results.data;
                        window.currentManager = managerName;
                        window.allRawData = results.data;
                        
                        updateProgress(60);
                        
                        // UI 업데이트
                        updateManagerInfoUI();
                        
                        updateProgress(70);
                        
                        // 데이터 전처리
                        preprocessData();
                        
                        updateProgress(85);
                        
                        // 분석 버튼 활성화
                        enableAnalysisButtons();
                        
                        // 기본 분석 수행
                        performBasicAnalysis();
                        
                        updateProgress(100);
                        showLoading(false);
                        showStatus(`${managerName} 담당자 분석이 완료되었습니다.`, 'success');
                        
                        // 분석 탭으로 전환
                        setTimeout(() => {
                            autoSwitchTab('analysis');
                        }, 500);
                        
                    } else {
                        throw new Error('유효한 데이터를 찾을 수 없습니다.');
                    }
                },
                error: function(error) {
                    throw new Error(`CSV 파싱 오류: ${error.message}`);
                }
            });
        })
        .catch(error => {
            console.error('담당자 데이터 로드 오류:', error);
            showLoading(false);
            updateProgress(0);
            showStatus(`${managerName} 담당자 데이터 로드 실패: ${error.message}`, 'error');
        });
}

// 기본 분석 결과에 담당자 목록 추가하는 함수
function addManagerListToAnalysis() {
    const analysisGrid = document.getElementById('analysisGrid');
    if (!analysisGrid) return;
    
    // 기존 담당자 카드가 있다면 제거
    const existingManagerCard = document.querySelector('.manager-list-card');
    if (existingManagerCard) {
        existingManagerCard.remove();
    }
    
    // 새로운 담당자 목록 카드 생성
    const managerCard = createManagerListCard();
    managerCard.classList.add('manager-list-card');
    
    // 분석 그리드에 추가 (마지막에)
    analysisGrid.appendChild(managerCard);
}

// window 전역에 함수들 등록
window.createManagerListData = createManagerListData;
window.createManagerListCard = createManagerListCard;
window.switchToManager = switchToManager;
window.loadNewManagerData = loadNewManagerData;
window.addManagerListToAnalysis = addManagerListToAnalysis; 