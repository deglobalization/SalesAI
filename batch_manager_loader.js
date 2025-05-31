// =============== 담당자별 일괄 데이터 로더 ===============

// 전역 변수
window.managerBatchData = {
    managers: [],
    currentManagerIndex: 0,
    isProcessing: false,
    results: {}
};

// 담당자 정보 로드
async function loadManagerInfo() {
    try {
        const response = await fetch('manager_data/manager_info.json');
        if (!response.ok) {
            throw new Error('담당자 정보를 불러올 수 없습니다');
        }
        
        const managerInfo = await response.json();
        
        // 담당자 목록을 데이터 건수 순으로 정렬
        const sortedManagers = Object.entries(managerInfo.managers)
            .sort((a, b) => b[1].record_count - a[1].record_count)
            .map(([name, info]) => ({
                name: name,
                ...info
            }));
        
        window.managerBatchData.managers = sortedManagers;
        
        return {
            success: true,
            managers: sortedManagers,
            totalManagers: managerInfo.total_managers,
            totalRecords: managerInfo.total_records
        };
        
    } catch (error) {
        console.error('담당자 정보 로드 오류:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 특정 담당자 데이터 로드
async function loadManagerData(managerInfo) {
    try {
        const response = await fetch(`manager_data/${managerInfo.filename}`);
        if (!response.ok) {
            throw new Error(`${managerInfo.name} 데이터를 불러올 수 없습니다`);
        }
        
        const csvText = await response.text();
        
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    if (results.errors.length > 0) {
                        console.warn(`${managerInfo.name} CSV 파싱 경고:`, results.errors);
                    }
                    
                    const cleanData = results.data.filter(row => {
                        return Object.values(row).some(value => 
                            value !== null && value !== undefined && value !== ''
                        );
                    });
                    
                    resolve({
                        success: true,
                        data: cleanData,
                        manager: managerInfo.name,
                        recordCount: cleanData.length
                    });
                },
                error: function(error) {
                    reject(new Error(`CSV 파싱 오류: ${error.message}`));
                }
            });
        });
        
    } catch (error) {
        console.error(`${managerInfo.name} 데이터 로드 오류:`, error);
        return {
            success: false,
            error: error.message,
            manager: managerInfo.name
        };
    }
}

// 일괄 분석 UI 표시
function showBatchAnalysisUI() {
    // 기존 UI 제거
    const existingCard = document.getElementById('batchAnalysisCard');
    if (existingCard) {
        existingCard.remove();
    }
    
    // 업로드 탭으로 전환
    switchTab('upload');
    
    const uploadGrid = document.getElementById('uploadContent') || document.querySelector('.tab-content.active');
    if (!uploadGrid) {
        console.error('업로드 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    // 일괄 분석 카드 생성
    const batchAnalysisCard = document.createElement('div');
    batchAnalysisCard.id = 'batchAnalysisCard';
    batchAnalysisCard.className = 'analysis-card';
    batchAnalysisCard.style.cssText = `
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
        border: 2px solid rgba(16, 185, 129, 0.4);
        margin: 20px;
        padding: 25px;
        border-radius: 15px;
        backdrop-filter: blur(20px);
    `;
    
    batchAnalysisCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #10b981; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">🔄</span>
                담당자별 일괄 분석 시스템
            </h3>
            <button onclick="document.getElementById('batchAnalysisCard').remove();" 
                    style="background: rgba(239, 68, 68, 0.8); color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease;"
                    onmouseover="this.style.background='rgba(239, 68, 68, 1)'"
                    onmouseout="this.style.background='rgba(239, 68, 68, 0.8)'">
                ✕ 닫기
            </button>
        </div>
        
        <div id="batchStatus" style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 10px; border-left: 4px solid #10b981;">
            <h4 style="color: #10b981; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>📊</span> 분리된 파일 확인 중...
            </h4>
            <div id="batchStatusText" style="color: #9ca3af; font-size: 0.9rem;">
                담당자별로 분리된 파일 정보를 불러오는 중입니다...
            </div>
        </div>
        
        <div id="managerListContainer" style="display: none;">
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(31, 41, 55, 0.3); border-radius: 10px;">
                <h4 style="color: #00d4ff; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                    <span>👥</span> 발견된 담당자 목록
                </h4>
                <div id="managerList" style="max-height: 300px; overflow-y: auto;"></div>
            </div>
            
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <button onclick="startBatchAnalysis()" 
                        id="startBatchBtn"
                        style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; padding: 15px; cursor: pointer; font-weight: 500; font-size: 1rem; transition: all 0.3s ease;">
                    🚀 전체 담당자 일괄 분석 시작
                </button>
                <button onclick="showCustomBatchSelection()" 
                        style="flex: 1; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 8px; padding: 15px; cursor: pointer; font-weight: 500; font-size: 1rem; transition: all 0.3s ease;">
                    🎯 선택 담당자 분석
                </button>
            </div>
        </div>
        
        <div id="batchProgress" style="display: none;">
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #10b981; font-weight: 500;">분석 진행률</span>
                    <span id="progressText" style="color: #9ca3af; font-size: 0.9rem;">0 / 0</span>
                </div>
                <div style="background: rgba(31, 41, 55, 0.5); border-radius: 10px; height: 8px; overflow: hidden;">
                    <div id="batchProgressBar" style="background: linear-gradient(90deg, #10b981, #059669); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                </div>
            </div>
            
            <div id="currentAnalysis" style="padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10b981;">
                <div style="color: #10b981; font-size: 0.9rem; font-weight: 500;">현재 분석 중...</div>
                <div id="currentManagerText" style="color: #9ca3af; font-size: 0.8rem; margin-top: 4px;">준비 중...</div>
            </div>
        </div>
        
        <div id="batchResults" style="display: none;">
            <h4 style="color: #10b981; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                <span>📈</span> 일괄 분석 결과
            </h4>
            <div id="resultsContainer" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
    `;
    
    uploadGrid.appendChild(batchAnalysisCard);
    batchAnalysisCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 담당자 정보 로드
    loadManagerInfo().then(result => {
        updateBatchUI(result);
    });
}

// 일괄 분석 UI 업데이트
function updateBatchUI(result) {
    const statusContainer = document.getElementById('batchStatus');
    const statusText = document.getElementById('batchStatusText');
    const managerListContainer = document.getElementById('managerListContainer');
    const managerList = document.getElementById('managerList');
    
    if (result.success) {
        statusText.innerHTML = `
            ✅ <strong>${result.totalManagers}명</strong>의 담당자 데이터 파일을 발견했습니다.<br>
            📊 총 <strong>${result.totalRecords.toLocaleString()}개</strong> 레코드가 분리되어 있습니다.
        `;
        
        // 담당자 목록 표시
        const managerItems = result.managers.map((manager, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin: 4px 0; background: rgba(55, 65, 81, 0.3); border-radius: 6px; border-left: 3px solid #10b981;">
                <div>
                    <span style="color: #ffffff; font-weight: 500;">${index + 1}. ${manager.name}</span>
                    <span style="color: #9ca3af; font-size: 0.85rem; margin-left: 10px;">(${manager.record_count.toLocaleString()}개 레코드)</span>
                </div>
                <div style="color: #10b981; font-size: 0.8rem;">
                    ${manager.filename}
                </div>
            </div>
        `).join('');
        
        managerList.innerHTML = managerItems;
        managerListContainer.style.display = 'block';
        
    } else {
        statusText.innerHTML = `❌ 오류: ${result.error}`;
        statusContainer.style.background = 'rgba(239, 68, 68, 0.1)';
        statusContainer.style.borderLeftColor = '#ef4444';
    }
}

// 일괄 분석 시작
async function startBatchAnalysis() {
    if (window.managerBatchData.isProcessing) {
        showStatus('이미 분석이 진행 중입니다.', 'warning');
        return;
    }
    
    const managers = window.managerBatchData.managers;
    if (!managers || managers.length === 0) {
        showStatus('담당자 데이터를 찾을 수 없습니다.', 'error');
        return;
    }
    
    window.managerBatchData.isProcessing = true;
    window.managerBatchData.currentManagerIndex = 0;
    window.managerBatchData.results = {};
    
    // UI 업데이트
    document.getElementById('managerListContainer').style.display = 'none';
    document.getElementById('batchProgress').style.display = 'block';
    document.getElementById('startBatchBtn').disabled = true;
    
    showStatus(`${managers.length}명의 담당자 일괄 분석을 시작합니다...`, 'info');
    
    // 순차적으로 각 담당자 분석
    for (let i = 0; i < managers.length; i++) {
        const manager = managers[i];
        
        // 진행률 업데이트
        updateBatchProgress(i, managers.length, manager.name);
        
        try {
            // 담당자 데이터 로드
            const loadResult = await loadManagerData(manager);
            
            if (loadResult.success) {
                // 전역 salesData에 설정
                window.salesData = loadResult.data;
                window.currentManager = manager.name;
                
                // 데이터 전처리
                preprocessData();
                
                // 기본 분석 수행
                const analysisResult = await performManagerAnalysis(manager.name);
                
                // 결과 저장 - 실제 분석 데이터 포함
                window.managerBatchData.results[manager.name] = {
                    success: analysisResult.success,
                    recordCount: loadResult.recordCount,
                    ...analysisResult,  // 모든 분석 결과 포함
                    managerInfo: manager
                };
                
                showStatus(`${manager.name} 담당자 분석 완료 (${i + 1}/${managers.length})`, 'success');
                
            } else {
                window.managerBatchData.results[manager.name] = {
                    success: false,
                    error: loadResult.error
                };
                
                showStatus(`${manager.name} 담당자 분석 실패: ${loadResult.error}`, 'error');
            }
            
        } catch (error) {
            console.error(`${manager.name} 분석 중 오류:`, error);
            window.managerBatchData.results[manager.name] = {
                success: false,
                error: error.message
            };
        }
        
        // 잠시 대기 (UI 업데이트 시간)
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 분석 완료
    updateBatchProgress(managers.length, managers.length, '완료');
    window.managerBatchData.isProcessing = false;
    
    // 성공한 담당자들의 분석 결과를 로컬 스토리지에 저장
    const analysisResults = {};
    const successfulManagers = Object.entries(window.managerBatchData.results)
        .filter(([_, result]) => result.success);
    
    successfulManagers.forEach(([managerName, result]) => {
        analysisResults[managerName] = {
            ...result,
            timestamp: new Date().toISOString()
        };
    });
    
    // localStorage에 분석 결과 저장
    if (successfulManagers.length > 0) {
        localStorage.setItem('batchAnalysisResults', JSON.stringify(analysisResults));
        localStorage.setItem('batchAnalysisTimestamp', new Date().toISOString());
        console.log(`✅ ${successfulManagers.length}명 담당자의 분석 결과를 localStorage에 저장했습니다.`);
    }
    
    showStatus('모든 담당자 분석이 완료되었습니다!', 'success');
    
    // 결과 표시
    setTimeout(() => {
        showBatchResults();
    }, 1000);
}

// 진행률 업데이트
function updateBatchProgress(current, total, managerName) {
    const progressBar = document.getElementById('batchProgressBar');
    const progressText = document.getElementById('progressText');
    const currentManagerText = document.getElementById('currentManagerText');
    
    const percentage = Math.round((current / total) * 100);
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${current} / ${total}`;
    if (currentManagerText) currentManagerText.textContent = managerName;
}

// 담당자별 분석 수행
async function performManagerAnalysis(managerName) {
    try {
        // 기본 분석 수행 - 실제 분석 결과 반환
        performBasicAnalysis();
        
        // 고객 세분화 수행
        performCustomerSegmentation();
        
        // 실제 분석 결과를 반환
        return {
            success: true,
            basic: window.analysisResults.basic,
            segmentation: window.analysisResults.segmentation,
            processedData: {
                totalSales: window.processedData.totalSales,
                totalRecords: window.processedData.totalRecords,
                recentMonth: window.processedData.recentMonth,
                recentMonthSales: window.processedData.recentMonthSales,
                recentMonthAccounts: window.processedData.recentMonthAccounts,
                recentMonthProducts: window.processedData.recentMonthProducts,
                uniqueAccounts: window.processedData.uniqueAccounts
            },
            managerAnalysis: window.analysisResults.basic?.managerAnalysis || [],
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`${managerName} 분석 오류:`, error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// 일괄 분석 결과 표시
function showBatchResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultEntries = Object.entries(window.managerBatchData.results);
    
    // 성공/실패 분류
    const successResults = resultEntries.filter(([_, result]) => result.success);
    const failureResults = resultEntries.filter(([_, result]) => !result.success);
    
    // 결과 통계
    const totalManagers = resultEntries.length;
    const successCount = successResults.length;
    const failureCount = failureResults.length;
    
    resultsContainer.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1)); border-radius: 10px; border-left: 4px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #10b981; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span>📊</span> 분석 완료 요약
                </h4>
                <div style="display: flex; gap: 10px;">
                    <button onclick="exportBatchResults()" 
                            style="background: linear-gradient(135deg, #00d4ff, #7c3aed); color: white; border: none; border-radius: 8px; padding: 8px 15px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: transform 0.2s;"
                            onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        📦 배포용 파일 생성
                    </button>
                    <button onclick="showAnalyzedManagersList()" 
                            style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 8px; padding: 8px 15px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: transform 0.2s;"
                            onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        📋 결과 상세보기
                    </button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">
                <div style="text-align: center; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                    <div style="color: #10b981; font-size: 1.5rem; font-weight: bold;">${totalManagers}</div>
                    <div style="color: #9ca3af; font-size: 0.85rem;">총 담당자</div>
                </div>
                <div style="text-align: center; padding: 10px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
                    <div style="color: #22c55e; font-size: 1.5rem; font-weight: bold;">${successCount}</div>
                    <div style="color: #9ca3af; font-size: 0.85rem;">분석 성공</div>
                </div>
                ${failureCount > 0 ? `
                <div style="text-align: center; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                    <div style="color: #ef4444; font-size: 1.5rem; font-weight: bold;">${failureCount}</div>
                    <div style="color: #9ca3af; font-size: 0.85rem;">분석 실패</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        ${successCount > 0 ? `
        <div style="margin-bottom: 20px;">
            <h5 style="color: #22c55e; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>✅</span> 분석 성공 (${successCount}명)
            </h5>
            <div style="max-height: 300px; overflow-y: auto;">
                ${successResults.map(([managerName, result]) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin: 4px 0; background: rgba(34, 197, 94, 0.1); border-radius: 6px; border-left: 3px solid #22c55e;">
                        <div>
                            <span style="color: #ffffff; font-weight: 500;">${managerName}</span>
                            <span style="color: #9ca3af; font-size: 0.85rem; margin-left: 10px;">(${result.recordCount?.toLocaleString() || 0}개 레코드)</span>
                        </div>
                        <button onclick="selectAnalyzedManager('${managerName}')" 
                                style="background: #22c55e; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 0.8rem; font-weight: 500;">
                            📊 결과보기
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${failureCount > 0 ? `
        <div>
            <h5 style="color: #ef4444; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>❌</span> 분석 실패 (${failureCount}명)
            </h5>
            <div style="max-height: 200px; overflow-y: auto;">
                ${failureResults.map(([managerName, result]) => `
                    <div style="padding: 8px 12px; margin: 4px 0; background: rgba(239, 68, 68, 0.1); border-radius: 6px; border-left: 3px solid #ef4444;">
                        <div style="color: #ffffff; font-weight: 500; margin-bottom: 4px;">${managerName}</div>
                        <div style="color: #ef4444; font-size: 0.8rem;">${result.error || '알 수 없는 오류'}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${successCount > 0 ? `
        <div style="margin-top: 25px; padding: 15px; background: rgba(0, 212, 255, 0.1); border-radius: 10px; border-left: 4px solid #00d4ff;">
            <h4 style="color: #00d4ff; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>🚀</span> 배포 준비 완료!
            </h4>
            <p style="color: #9ca3af; margin-bottom: 15px; font-size: 0.9rem;">
                ${successCount}명의 담당자 분석 결과가 준비되었습니다. <strong>배포용 파일 생성</strong> 버튼을 클릭하여 
                GitHub Pages나 다른 호스팅 서비스에 업로드할 준비를 완료하세요.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button onclick="exportBatchResults()" 
                        style="background: linear-gradient(135deg, #00d4ff, #7c3aed); color: white; border: none; border-radius: 10px; padding: 15px 25px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);"
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0, 212, 255, 0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0, 212, 255, 0.3)'">
                    📦 배포용 파일 생성
                </button>
                <button onclick="startNewBatchAnalysis()" 
                        style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 10px; padding: 15px 25px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.3s ease;"
                        onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔄 새 일괄 분석
                </button>
            </div>
        </div>
        ` : ''}
    `;
    
    document.getElementById('batchResults').style.display = 'block';
}

// 새 일괄 분석 시작
function startNewBatchAnalysis() {
    // 기존 결과 초기화
    window.managerBatchData.results = {};
    window.managerBatchData.isProcessing = false;
    window.managerBatchData.currentManagerIndex = 0;
    
    // UI 초기화
    document.getElementById('batchResults').style.display = 'none';
    document.getElementById('batchProgress').style.display = 'none';
    document.getElementById('managerListContainer').style.display = 'block';
    document.getElementById('startBatchBtn').disabled = false;
    
    showStatus('새로운 일괄 분석을 시작할 준비가 되었습니다.', 'info');
}

// 분석된 담당자 선택
function selectAnalyzedManager(managerName) {
    try {
        const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}');
        const result = analysisResults[managerName];
        
        if (!result) {
            showStatus(`${managerName} 담당자의 분석 결과를 찾을 수 없습니다.`, 'error');
            return;
        }
        
        showStatus(`${managerName} 담당자 데이터를 불러오는 중...`, 'info');
        showLoading(true);
        updateProgress(20);
        
        // 해당 담당자의 데이터를 다시 로드
        loadManagerData(result.managerInfo).then(loadResult => {
            if (loadResult.success) {
                updateProgress(40);
                
                // 전역 변수에 설정 (모든 필요한 변수들 설정)
                window.salesData = loadResult.data;
                window.currentManager = managerName;
                window.allRawData = loadResult.data; // 추가: allRawData도 설정
                
                // 디버깅 로그
                console.log(`담당자 데이터 로드 완료:`, {
                    manager: managerName,
                    recordCount: loadResult.data.length,
                    sampleRecord: loadResult.data[0]
                });
                
                updateProgress(60);
                
                // UI 업데이트
                updateManagerInfoUI();
                
                // 데이터 전처리 - 중요: window.salesData를 사용하도록 확인
                try {
                    preprocessData();
                    console.log('데이터 전처리 완료');
                } catch (preprocessError) {
                    console.error('데이터 전처리 오류:', preprocessError);
                    throw new Error(`데이터 전처리 오류: ${preprocessError.message}`);
                }
                
                updateProgress(80);
                
                // 파일 업로드 영역 숨기기
                const fileInputArea = document.getElementById('fileInputArea');
                if (fileInputArea) {
                    fileInputArea.style.display = 'none';
                }
                
                // 수동 업로드 버튼 표시
                showManualUploadButton();
                
                // 분석 버튼 활성화
                enableAnalysisButtons();
                
                // 기본 분석 탭으로 전환
                switchTab('analysis');
                
                updateProgress(90);
                
                // 탭 전환 후 잠시 대기한 다음 분석 실행
                setTimeout(() => {
                    try {
                        console.log('기본 분석 시작 - salesData 길이:', window.salesData ? window.salesData.length : 'undefined');
                        
                        // 기본 분석 실행
                        performBasicAnalysis();
                        
                        updateProgress(100);
                        showLoading(false);
                        
                        showStatus(`${managerName} 담당자 분석 결과를 불러왔습니다. (${loadResult.recordCount.toLocaleString()}개 레코드)`, 'success');
                        
                        // 일괄분석 카드 닫기
                        const batchCard = document.getElementById('batchAnalysisCard');
                        if (batchCard) {
                            batchCard.remove();
                        }
                        
                        // 분석된 담당자 목록 카드 닫기
                        const analyzedCard = document.getElementById('analyzedManagersCard');
                        if (analyzedCard) {
                            analyzedCard.remove();
                        }
                        
                    } catch (analysisError) {
                        console.error('기본 분석 실행 오류:', analysisError);
                        showStatus(`분석은 완료되었지만 표시 중 오류가 발생했습니다: ${analysisError.message}`, 'warning');
                        showLoading(false);
                        
                        // 오류 발생 시에도 로딩 상태 해제
                        updateProgress(100);
                    }
                }, 1000); // 1초로 늘려서 탭 전환이 완전히 완료되도록 함
                
            } else {
                showLoading(false);
                showStatus(`${managerName} 담당자 데이터 로드 실패: ${loadResult.error}`, 'error');
            }
        }).catch(error => {
            console.error('담당자 데이터 로드 오류:', error);
            showLoading(false);
            showStatus(`데이터 로드 중 오류가 발생했습니다: ${error.message}`, 'error');
        });
        
    } catch (error) {
        console.error('분석된 담당자 선택 오류:', error);
        showLoading(false);
        showStatus('담당자 선택 중 오류가 발생했습니다.', 'error');
    }
}

// 분석된 담당자 목록 표시
function showAnalyzedManagersList() {
    try {
        const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}');
        const timestamp = localStorage.getItem('batchAnalysisTimestamp');
        
        if (Object.keys(analysisResults).length === 0) {
            showStatus('저장된 분석 결과가 없습니다.', 'warning');
            return;
        }
        
        // 기존 카드 제거
        const existingCard = document.getElementById('analyzedManagersCard');
        if (existingCard) {
            existingCard.remove();
        }
        
        // 업로드 탭으로 전환
        switchTab('upload');
        
        const uploadGrid = document.getElementById('uploadContent') || document.querySelector('.tab-content.active');
        if (!uploadGrid) {
            console.error('업로드 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 분석된 담당자 목록 카드 생성
        const analyzedManagersCard = document.createElement('div');
        analyzedManagersCard.id = 'analyzedManagersCard';
        analyzedManagersCard.className = 'analysis-card';
        analyzedManagersCard.style.cssText = `
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
            border: 2px solid rgba(99, 102, 241, 0.4);
            margin: 20px;
            padding: 25px;
            border-radius: 15px;
            backdrop-filter: blur(20px);
        `;
        
        // 담당자들을 데이터 건수 순으로 정렬
        const sortedManagers = Object.entries(analysisResults)
            .sort((a, b) => b[1].managerInfo.record_count - a[1].managerInfo.record_count);
        
        const managerItems = sortedManagers.map(([managerName, result], index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin: 8px 0; background: rgba(55, 65, 81, 0.3); border-radius: 8px; border-left: 4px solid #6366f1; cursor: pointer; transition: all 0.2s ease;"
                 onclick="selectAnalyzedManager('${managerName}')"
                 onmouseover="this.style.backgroundColor='rgba(99, 102, 241, 0.1)'; this.style.transform='translateY(-1px)'"
                 onmouseout="this.style.backgroundColor='rgba(55, 65, 81, 0.3)'; this.style.transform='translateY(0)'">
                <div>
                    <div style="color: #ffffff; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                        <span style="background: #6366f1; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">
                            ${index + 1}
                        </span>
                        ${managerName}
                    </div>
                    <div style="color: #9ca3af; font-size: 0.85rem; margin-left: 32px;">
                        📊 ${result.managerInfo.record_count.toLocaleString()}개 레코드 분석 완료
                    </div>
                    <div style="color: #a5b4fc; font-size: 0.8rem; margin-left: 32px;">
                        🕒 ${new Date(result.timestamp).toLocaleString('ko-KR')}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 500;">
                        📈 분석보기
                    </div>
                </div>
            </div>
        `).join('');
        
        analyzedManagersCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">👥</span>
                    분석된 담당자 목록 (${sortedManagers.length}명)
                </h3>
                <button onclick="document.getElementById('analyzedManagersCard').remove();" 
                        style="background: rgba(239, 68, 68, 0.8); color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease;"
                        onmouseover="this.style.background='rgba(239, 68, 68, 1)'"
                        onmouseout="this.style.background='rgba(239, 68, 68, 0.8)'">
                    ✕ 닫기
                </button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(99, 102, 241, 0.1); border-radius: 10px; border-left: 4px solid #6366f1;">
                <h4 style="color: #6366f1; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                    <span>🕒</span> 마지막 일괄분석 정보
                </h4>
                <div style="color: #9ca3af; font-size: 0.9rem; line-height: 1.6;">
                    <p style="margin: 5px 0;">📅 <strong>분석 일시:</strong> ${timestamp ? new Date(timestamp).toLocaleString('ko-KR') : '알 수 없음'}</p>
                    <p style="margin: 5px 0;">👨‍💼 <strong>분석 담당자:</strong> ${sortedManagers.length}명</p>
                    <p style="margin: 5px 0;">💡 <strong>담당자를 클릭하면 해당 담당자의 상세 분석 결과를 볼 수 있습니다</strong></p>
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${managerItems}
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(31, 41, 55, 0.3); border-radius: 10px; text-align: center;">
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="showBatchAnalysisUI()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-size: 0.9rem;">
                        🔄 새로운 일괄분석
                    </button>
                    <button onclick="clearAnalysisResults()" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-size: 0.9rem;">
                        🗑️ 분석결과 삭제
                    </button>
                </div>
            </div>
        `;
        
        uploadGrid.appendChild(analyzedManagersCard);
        analyzedManagersCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('분석된 담당자 목록 표시 오류:', error);
        showStatus('담당자 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 분석 결과 삭제
function clearAnalysisResults() {
    if (confirm('저장된 모든 분석 결과를 삭제하시겠습니까?')) {
        localStorage.removeItem('batchAnalysisResults');
        localStorage.removeItem('batchAnalysisTimestamp');
        
        const analyzedManagersCard = document.getElementById('analyzedManagersCard');
        if (analyzedManagersCard) {
            analyzedManagersCard.remove();
        }
        
        showStatus('분석 결과가 삭제되었습니다.', 'success');
    }
}

// showManualUploadButton 함수 정의 (필요한 경우)
function showManualUploadButton() {
    const manualUploadBtn = document.getElementById('manualUploadBtn');
    if (manualUploadBtn) {
        manualUploadBtn.style.display = 'inline-block';
    }
}

// 일괄 분석 결과 JSON 파일로 저장
function exportBatchResults() {
    const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}');
    
    if (Object.keys(analysisResults).length === 0) {
        showStatus('저장할 분석 결과가 없습니다. 먼저 일괄 분석을 수행해주세요.', 'warning');
        return;
    }
    
    // 결과 데이터 준비
    const exportData = {
        exportDate: new Date().toISOString(),
        totalManagers: Object.keys(analysisResults).length,
        analysisResults: analysisResults,
        metadata: {
            version: '1.0',
            system: 'SalesAI Batch Analysis',
            description: '담당자별 일괄 분석 결과 데이터'
        }
    };
    
    // JSON 파일로 다운로드
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `batch_analysis_results_${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    showStatus(`분석 결과를 JSON 파일로 저장했습니다 (${Object.keys(analysisResults).length}명 담당자)`, 'success');
    
    // 배포용 파일 생성 안내
    showExportGuide();
}

// 배포용 파일 생성 안내
function showExportGuide() {
    const guideCard = document.createElement('div');
    guideCard.className = 'analysis-card';
    guideCard.style.cssText = `
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(124, 58, 237, 0.1));
        border: 2px solid rgba(0, 212, 255, 0.4);
        margin: 20px;
        padding: 25px;
        border-radius: 15px;
        backdrop-filter: blur(20px);
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        max-width: 600px;
        width: 90%;
    `;
    
    guideCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #00d4ff; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">📦</span>
                배포용 설정 가이드
            </h3>
            <button onclick="this.parentElement.parentElement.remove();" 
                    style="background: rgba(239, 68, 68, 0.8); color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 0.9rem;">
                ✕ 닫기
            </button>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 10px; border-left: 4px solid #10b981;">
            <h4 style="color: #10b981; margin-bottom: 10px;">🎯 배포 준비 완료!</h4>
            <p style="color: #9ca3af; margin-bottom: 15px;">
                다운로드된 JSON 파일을 프로젝트 루트에 <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; color: #00d4ff;">preload_analysis_results.json</code>으로 이름을 변경하여 저장하세요.
            </p>
            <div style="background: rgba(0, 0, 0, 0.2); padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.9rem;">
                <div style="color: #10b981; margin-bottom: 10px;">📁 배포 디렉토리 구조:</div>
                <div style="color: #9ca3af;">
                    project-root/<br>
                    ├── index.html<br>
                    ├── advisor.html<br>
                    ├── <span style="color: #00d4ff; font-weight: bold;">preload_analysis_results.json</span> ← 여기에 저장<br>
                    ├── manager_list.json<br>
                    └── ...
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(75, 85, 99, 0.1); border-radius: 10px;">
            <h4 style="color: #00d4ff; margin-bottom: 10px;">⚡ 자동 로드 기능</h4>
            <p style="color: #9ca3af; margin-bottom: 10px;">
                배포 후 방문자가 페이지에 접속하면:
            </p>
            <ul style="color: #9ca3af; margin-left: 20px; list-style-type: disc;">
                <li>분석 없이 즉시 모든 담당자의 결과를 표시</li>
                <li>핵심 지표 자동 계산 및 표시</li>
                <li>담당자 전환 시 즉시 데이터 로드</li>
                <li>빠른 사용자 경험 제공</li>
            </ul>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="createDeploymentFile()" 
                    style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; padding: 12px 20px; cursor: pointer; font-weight: 500;">
                📦 배포용 파일 자동 생성
            </button>
            <button onclick="this.parentElement.parentElement.parentElement.remove();" 
                    style="background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; border-radius: 8px; padding: 12px 20px; cursor: pointer; font-weight: 500;">
                나중에 수동으로 설정
            </button>
        </div>
    `;
    
    document.body.appendChild(guideCard);
}

// 배포용 파일 자동 생성
function createDeploymentFile() {
    const analysisResults = JSON.parse(localStorage.getItem('batchAnalysisResults') || '{}');
    
    const deploymentData = {
        deploymentDate: new Date().toISOString(),
        autoLoad: true,
        totalManagers: Object.keys(analysisResults).length,
        analysisResults: analysisResults
    };
    
    const dataStr = JSON.stringify(deploymentData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'preload_analysis_results.json';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    showStatus('배포용 preload_analysis_results.json 파일이 생성되었습니다!', 'success');
    
    // 가이드 닫기
    const guide = document.querySelector('.analysis-card');
    if (guide && guide.innerHTML.includes('배포용 설정 가이드')) {
        guide.remove();
    }
}

// 배포 시 사전 로드된 분석 결과 자동 로드
async function loadPreloadedAnalysisResults() {
    try {
        const response = await fetch('preload_analysis_results.json');
        if (!response.ok) {
            console.log('📋 사전 로드된 분석 결과 파일이 없습니다. 정상 모드로 시작합니다.');
            return false;
        }
        
        const preloadData = await response.json();
        console.log('🚀 사전 로드된 분석 결과를 발견했습니다:', preloadData);
        
        if (preloadData.autoLoad && preloadData.analysisResults) {
            // localStorage에 분석 결과 저장
            localStorage.setItem('batchAnalysisResults', JSON.stringify(preloadData.analysisResults));
            
            // 로드 완료 상태 표시
            showStatus(`🎉 사전 분석된 ${preloadData.totalManagers}명 담당자 데이터를 자동으로 로드했습니다!`, 'success');
            
            console.log(`✅ 배포 모드: ${preloadData.totalManagers}명 담당자의 분석 결과 자동 로드 완료`);
            
            // 첫 번째 담당자로 자동 설정 (옵션)
            const managerNames = Object.keys(preloadData.analysisResults);
            if (managerNames.length > 0 && !window.currentManager) {
                const firstManager = managerNames[0];
                console.log(`🎯 첫 번째 담당자 ${firstManager}로 자동 설정`);
                
                // 약간의 지연 후 자동 로드
                setTimeout(() => {
                    selectAnalyzedManager(firstManager);
                }, 1000);
            }
            
            return true;
        }
        
    } catch (error) {
        console.log('📋 사전 로드 시도 중 오류 (정상):', error.message);
        return false;
    }
}

// 배포 상태 확인
function isDeploymentMode() {
    return window.location.protocol === 'https:' || 
           window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
}

// 전역 함수로 노출
window.showBatchAnalysisUI = showBatchAnalysisUI;
window.startBatchAnalysis = startBatchAnalysis;
window.loadManagerInfo = loadManagerInfo;
window.loadManagerData = loadManagerData;
window.selectAnalyzedManager = selectAnalyzedManager;
window.showAnalyzedManagersList = showAnalyzedManagersList;
window.clearAnalysisResults = clearAnalysisResults;
window.exportBatchResults = exportBatchResults;
window.showExportGuide = showExportGuide;
window.createDeploymentFile = createDeploymentFile;
window.loadPreloadedAnalysisResults = loadPreloadedAnalysisResults;
window.isDeploymentMode = isDeploymentMode;

console.log('담당자별 일괄 데이터 로더가 로드되었습니다.'); 