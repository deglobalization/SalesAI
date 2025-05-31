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
    const batchResults = document.getElementById('batchResults');
    
    if (!resultsContainer || !batchResults) return;
    
    const results = window.managerBatchData.results;
    const managers = window.managerBatchData.managers;
    
    let successCount = 0;
    let failCount = 0;
    
    // 성공한 담당자들의 분석 결과를 로컬 스토리지에 저장
    const analysisResults = {};
    
    const resultItems = managers.map(manager => {
        const result = results[manager.name];
        const isSuccess = result && result.success;
        
        if (isSuccess) {
            successCount++;
            // 성공한 담당자의 분석 결과 저장
            analysisResults[manager.name] = {
                ...result,
                managerInfo: manager,
                timestamp: new Date().toISOString()
            };
        } else {
            failCount++;
        }
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin: 8px 0; background: rgba(55, 65, 81, 0.3); border-radius: 8px; border-left: 4px solid ${isSuccess ? '#10b981' : '#ef4444'};">
                <div>
                    <div style="color: #ffffff; font-weight: 500;">${manager.name}</div>
                    <div style="color: #9ca3af; font-size: 0.85rem;">
                        ${manager.record_count.toLocaleString()}개 레코드
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="color: ${isSuccess ? '#10b981' : '#ef4444'}; font-size: 0.9rem; font-weight: 500;">
                        ${isSuccess ? '✅ 분석 완료' : '❌ 분석 실패'}
                    </div>
                    ${isSuccess ? `<button onclick="selectAnalyzedManager('${manager.name}')" style="background: #10b981; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem; margin-top: 4px; cursor: pointer;">📊 상세보기</button>` : ''}
                    ${!isSuccess && result ? `<div style="color: #9ca3af; font-size: 0.8rem;">${result.error}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // 분석 결과를 로컬 스토리지에 저장
    if (successCount > 0) {
        localStorage.setItem('batchAnalysisResults', JSON.stringify(analysisResults));
        localStorage.setItem('batchAnalysisTimestamp', new Date().toISOString());
    }
    
    resultsContainer.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #10b981;">✅ 성공:</span>
                <span style="color: #ffffff; font-weight: 500;">${successCount}명</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #ef4444;">❌ 실패:</span>
                <span style="color: #ffffff; font-weight: 500;">${failCount}명</span>
            </div>
            ${successCount > 0 ? `
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="showAnalyzedManagersList()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; padding: 12px 20px; cursor: pointer; font-weight: 500; font-size: 0.9rem;">
                    👥 분석된 담당자 목록 보기
                </button>
            </div>` : ''}
        </div>
        ${resultItems}
    `;
    
    batchResults.style.display = 'block';
    batchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// 전역 함수로 노출
window.showBatchAnalysisUI = showBatchAnalysisUI;
window.startBatchAnalysis = startBatchAnalysis;
window.loadManagerInfo = loadManagerInfo;
window.loadManagerData = loadManagerData;
window.selectAnalyzedManager = selectAnalyzedManager;
window.showAnalyzedManagersList = showAnalyzedManagersList;
window.clearAnalysisResults = clearAnalysisResults;

console.log('담당자별 일괄 데이터 로더가 로드되었습니다.'); 