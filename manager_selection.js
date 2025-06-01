// =============== 담당자 선택 기능 ===============

// 전역 변수: 현재 선택된 담당자
window.currentManager = null;
window.allRawData = null;

// 담당자 정보 UI 업데이트
function updateManagerInfoUI() {
    const managerInfoPanel = document.getElementById('currentManagerInfo');
    const managerInfoText = document.getElementById('managerInfoText');
    
    if (managerInfoPanel && managerInfoText) {
        if (window.currentManager) {
            managerInfoText.innerHTML = `현재 분석 대상: <strong>${window.currentManager}</strong> 담당자`;
            managerInfoPanel.style.display = 'block';
        } else {
            managerInfoText.innerHTML = '담당자 미선택';
            managerInfoPanel.style.display = 'none';
        }
    }
}

// 기존 handleFileUpload 함수를 확장하여 담당자 선택 기능 추가
const originalHandleFileUpload = window.handleFileUpload;

window.handleFileUpload = function(file) {
    if (!ensureLibrariesLoaded()) return;

    showStatus('파일을 분석하고 있습니다...', 'info');
    showLoading(true);
    updateProgress(20);

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
            try {
                if (results.errors.length > 0) {
                    console.warn('CSV 파싱 경고:', results.errors);
                }

                if (!results.data || results.data.length === 0) {
                    showStatus('파일에 유효한 데이터가 없습니다.', 'error');
                    showLoading(false);
                    return;
                }

                let allData = results.data.filter(row => {
                    return Object.values(row).some(value => 
                        value !== null && value !== undefined && value !== ''
                    );
                });

                if (allData.length === 0) {
                    showStatus('파일에서 유효한 데이터를 찾을 수 없습니다.', 'error');
                    showLoading(false);
                    return;
                }

                // 전체 데이터 저장
                window.allRawData = allData;

                // 담당자 목록 추출 및 분석
                const managerColumn = '담당자';
                const managersData = {};
                
                allData.forEach(row => {
                    const manager = row[managerColumn];
                    if (manager && manager.trim() !== '') {
                        const cleanManager = manager.replace(/"/g, '').trim();
                        if (!managersData[cleanManager]) {
                            managersData[cleanManager] = 0;
                        }
                        managersData[cleanManager]++;
                    }
                });

                const managerList = Object.entries(managersData)
                    .sort((a, b) => b[1] - a[1]) // 데이터 건수 순으로 정렬
                    .map(([manager, count]) => ({ manager, count }));

                updateProgress(50);
                showLoading(false);

                if (managerList.length === 0) {
                    showStatus('담당자 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                if (managerList.length === 1) {
                    // 담당자가 1명인 경우 자동 선택
                    selectManager(managerList[0].manager);
                } else {
                    // 담당자 선택 UI 표시
                    showManagerSelection(managerList);
                }

            } catch (error) {
                console.error('파일 처리 중 오류:', error);
                showStatus('파일 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                showLoading(false);
            }
        },
        error: function(error) {
            console.error('CSV 파싱 오류:', error);
            showStatus('CSV 파일 파싱 중 오류가 발생했습니다.', 'error');
            showLoading(false);
        }
    });
};

// 담당자 선택 UI 표시
function showManagerSelection(managerList) {
    // 기존 선택 카드가 있으면 제거
    const existingCard = document.getElementById('managerSelectionCard');
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

    // 분석된 담당자가 있는지 확인
    const analysisResults = localStorage.getItem('batchAnalysisResults');
    const hasAnalyzedManagers = analysisResults && Object.keys(JSON.parse(analysisResults)).length > 0;

    // 담당자 선택 카드 생성
    const managerSelectionCard = document.createElement('div');
    managerSelectionCard.id = 'managerSelectionCard';
    managerSelectionCard.className = 'analysis-card';
    managerSelectionCard.style.cssText = `
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
        border: 2px solid rgba(99, 102, 241, 0.4);
        margin: 20px;
        padding: 25px;
        border-radius: 15px;
        backdrop-filter: blur(20px);
    `;

    const managerOptions = managerList.map((item, index) => `
        <tr style="cursor: pointer; border-bottom: 1px solid rgba(75, 85, 99, 0.3); transition: all 0.2s ease;" 
            onclick="selectManager('${item.manager}')"
            onmouseover="this.style.backgroundColor='rgba(99, 102, 241, 0.1)'; this.style.transform='translateY(-1px)'"
            onmouseout="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'">
            <td style="text-align: center; padding: 12px 8px; font-weight: bold; color: #ffffff;">
                ${index + 1}
            </td>
            <td style="padding: 12px 8px; font-weight: bold; color: #6366f1;">
                ${item.manager}
            </td>
            <td style="text-align: right; padding: 12px 8px; color: #ffffff;">
                ${item.count.toLocaleString()}건
            </td>
            <td style="text-align: center; padding: 12px 8px;">
                <span style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 500;">
                    선택하기
                </span>
            </td>
        </tr>
    `).join('');

    managerSelectionCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">👥</span>
                담당자 선택 (총 ${managerList.length}명)
            </h3>
            <button onclick="document.getElementById('managerSelectionCard').remove(); showFileUploadArea();" 
                    style="background: rgba(239, 68, 68, 0.8); color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease;"
                    onmouseover="this.style.background='rgba(239, 68, 68, 1)'"
                    onmouseout="this.style.background='rgba(239, 68, 68, 0.8)'">
                ✕ 다시 선택
            </button>
        </div>
        
        ${hasAnalyzedManagers ? `
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 10px; border-left: 4px solid #10b981;">
            <h4 style="color: #10b981; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>⚡</span> 빠른 접근
            </h4>
            <div style="color: #9ca3af; font-size: 0.9rem; margin-bottom: 10px;">
                이전에 분석된 담당자 데이터가 있습니다. 빠르게 접근할 수 있습니다.
            </div>
            <button onclick="showAnalyzedManagersList(); document.getElementById('managerSelectionCard').remove();" 
                    style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; padding: 10px 15px; cursor: pointer; font-size: 0.9rem; font-weight: 500;">
                📈 분석된 담당자 목록 보기
            </button>
        </div>` : ''}
        
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(99, 102, 241, 0.1); border-radius: 10px; border-left: 4px solid #6366f1;">
            <h4 style="color: #6366f1; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>📊</span> 파일 정보
            </h4>
            <div style="color: #9ca3af; font-size: 0.9rem; line-height: 1.6;">
                <p style="margin: 5px 0;">📋 <strong>총 데이터:</strong> ${window.allRawData ? window.allRawData.length.toLocaleString() : 0}개 레코드</p>
                <p style="margin: 5px 0;">👨‍💼 <strong>담당자 수:</strong> ${managerList.length}명</p>
                <p style="margin: 5px 0;">💡 <strong>분석할 담당자를 선택하세요</strong></p>
            </div>
        </div>

        <div class="table-container" style="overflow-x: auto; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; background: rgba(17, 24, 39, 0.7); border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: rgba(99, 102, 241, 0.3);">
                        <th style="padding: 15px 8px; text-align: center; color: #ffffff; font-weight: 600; min-width: 60px;">순위</th>
                        <th style="padding: 15px 8px; text-align: left; color: #ffffff; font-weight: 600; min-width: 120px;">담당자명</th>
                        <th style="padding: 15px 8px; text-align: center; color: #ffffff; font-weight: 600; min-width: 100px;">데이터 건수</th>
                        <th style="padding: 15px 8px; text-align: center; color: #ffffff; font-weight: 600; min-width: 80px;">선택</th>
                    </tr>
                </thead>
                <tbody>
                    ${managerOptions}
                </tbody>
            </table>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: rgba(31, 41, 55, 0.3); border-radius: 10px;">
            <h4 style="color: #00d4ff; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span>💡</span> 분석 안내
            </h4>
            <div style="color: #9ca3af; font-size: 0.9rem; line-height: 1.6;">
                <p style="margin-bottom: 8px;">
                    🎯 <strong>담당자별 분석:</strong> 선택한 담당자의 데이터만으로 세부 분석을 수행합니다
                </p>
                <p style="margin-bottom: 8px;">
                    📈 <strong>개별 성과:</strong> 해당 담당자의 고객 세분화, 추천 품목 등을 분석합니다
                </p>
                <p style="margin-bottom: 0;">
                    🔄 <strong>담당자 변경:</strong> 언제든지 다른 담당자로 변경하여 분석할 수 있습니다
                </p>
            </div>
        </div>
    `;

    // 카드를 업로드 컨테이너에 추가
    uploadGrid.appendChild(managerSelectionCard);
    
    // 카드로 스크롤
    managerSelectionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    showStatus(`${managerList.length}명의 담당자를 발견했습니다. 분석할 담당자를 선택하세요.`, 'info');
}

// 담당자 선택 처리
function selectManager(selectedManager) {
    showStatus(`${selectedManager} 담당자의 데이터를 필터링하고 있습니다...`, 'info');
    showLoading(true);
    updateProgress(20);

    try {
        if (!window.allRawData) {
            throw new Error('원본 데이터가 없습니다.');
        }

        // 선택된 담당자의 데이터만 필터링
        salesData = window.allRawData.filter(row => {
            const manager = row['담당자'];
            if (manager) {
                const cleanManager = manager.replace(/"/g, '').trim();
                return cleanManager === selectedManager;
            }
            return false;
        });

        updateProgress(40);

        if (salesData.length === 0) {
            showStatus(`${selectedManager} 담당자의 데이터를 찾을 수 없습니다.`, 'error');
            showLoading(false);
            return;
        }

        // 담당자 선택 카드 제거
        const managerSelectionCard = document.getElementById('managerSelectionCard');
        if (managerSelectionCard) {
            managerSelectionCard.remove();
        }

        updateProgress(60);

        // 현재 선택된 담당자 정보 저장 및 UI 업데이트
        window.currentManager = selectedManager;
        updateManagerInfoUI();
        
        // 데이터 전처리
        preprocessData();
        
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
        
        showStatus(`${selectedManager} 담당자 데이터 로드 완료: ${salesData.length.toLocaleString()}개 레코드`, 'success');
        
        updateProgress(90);
        
        // 기본 분석 탭으로 전환
        switchTab('analysis');
        
        // 탭 전환 후 잠시 대기한 다음 자동으로 기본 분석 실행
        setTimeout(() => {
            try {
                performBasicAnalysis();
                updateProgress(100);
                showLoading(false);
                showStatus(`${selectedManager} 담당자 기본 분석이 완료되었습니다.`, 'success');
            } catch (analysisError) {
                console.error('기본 분석 실행 오류:', analysisError);
                showStatus(`데이터는 로드되었지만 분석 표시 중 오류가 발생했습니다: ${analysisError.message}`, 'warning');
                showLoading(false);
            }
        }, 500); // 500ms 대기 후 분석 실행

    } catch (error) {
        console.error('담당자 데이터 처리 중 오류:', error);
        showStatus('담당자 데이터 처리 중 오류가 발생했습니다: ' + error.message, 'error');
        showLoading(false);
    }
}

// 담당자 변경 기능 추가
function changeManager() {
    // 먼저 저장된 분석 결과가 있는지 확인
    const analysisResults = localStorage.getItem('batchAnalysisResults');
    
    if (analysisResults) {
        // 분석된 담당자가 있으면 분석 결과 목록을 먼저 표시
        showAnalyzedManagersList();
        return;
    }
    
    if (!window.allRawData) {
        showStatus('원본 데이터가 없습니다. 파일을 다시 업로드해주세요.', 'error');
        return;
    }

    // 담당자 목록 다시 추출
    const managersData = {};
    window.allRawData.forEach(row => {
        const manager = row['담당자'];
        if (manager && manager.trim() !== '') {
            const cleanManager = manager.replace(/"/g, '').trim();
            if (!managersData[cleanManager]) {
                managersData[cleanManager] = 0;
            }
            managersData[cleanManager]++;
        }
    });

    const managerList = Object.entries(managersData)
        .sort((a, b) => b[1] - a[1])
        .map(([manager, count]) => ({ manager, count }));

    showManagerSelection(managerList);
}

// 전역에 함수 노출
window.changeManager = changeManager;
window.selectManager = selectManager;
window.updateManagerInfoUI = updateManagerInfoUI;

// showFileUploadArea 함수 정의 (advisor.html에서 호출됨)
function showFileUploadArea() {
    const fileInputArea = document.getElementById('fileInputArea');
    if (fileInputArea) {
        fileInputArea.style.display = 'block';
    }
}
window.showFileUploadArea = showFileUploadArea;

// 현재 담당자 정보 표시 기능
function showCurrentManagerInfo() {
    if (window.currentManager) {
        return `현재 분석 대상: <strong style="color: #6366f1;">${window.currentManager}</strong> 담당자`;
    }
    return '담당자 미선택';
}

// 페이지 로드 시 담당자 정보 UI 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 1초 후 UI 업데이트 (다른 초기화 코드 완료 후)
    setTimeout(() => {
        updateManagerInfoUI();
    }, 1000);
});

console.log('담당자 선택 기능이 로드되었습니다.'); 