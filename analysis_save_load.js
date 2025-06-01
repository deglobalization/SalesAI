// 분석 결과 저장 및 불러오기 시스템

class AnalysisSaveLoadManager {
    constructor() {
        this.storageKey = 'salesAI_saved_analyses';
        this.initializeSaveLoadUI();
    }

    // 저장된 분석 목록 가져오기
    getSavedAnalyses() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {};
    }

    // 분석 결과 저장
    saveAnalysis(name, description = '') {
        if (!name || name.trim() === '') {
            showStatus('❌ 분석 이름을 입력해주세요.', 'error');
            return false;
        }

        // 현재 분석 데이터가 있는지 확인
        if (!window.analysisResults || !window.processedData) {
            showStatus('❌ 저장할 분석 결과가 없습니다. 먼저 분석을 실행해주세요.', 'error');
            return false;
        }

        const analysisData = {
            name: name.trim(),
            description: description.trim(),
            savedAt: new Date().toISOString(),
            data: {
                analysisResults: window.analysisResults,
                processedData: window.processedData,
                segmentationResults: window.segmentationResults || null,
                salesData: window.salesData || null,
                selectedManager: window.selectedManager || null
            },
            metadata: {
                dataSize: window.salesData ? window.salesData.length : 0,
                recentMonth: window.processedData ? window.processedData.recentMonth : null,
                totalCustomers: window.processedData ? window.processedData.totalCustomers : 0,
                totalSales: window.processedData ? window.processedData.totalSales : 0
            }
        };

        const savedAnalyses = this.getSavedAnalyses();
        savedAnalyses[name] = analysisData;

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(savedAnalyses));
            showStatus(`✅ 분석 결과 "${name}"이 저장되었습니다.`, 'success');
            this.updateSavedAnalysesList();
            return true;
        } catch (error) {
            console.error('분석 저장 오류:', error);
            showStatus('❌ 분석 저장에 실패했습니다. 브라우저 저장 공간이 부족할 수 있습니다.', 'error');
            return false;
        }
    }

    // 분석 결과 불러오기
    loadAnalysis(name) {
        const savedAnalyses = this.getSavedAnalyses();
        const analysisData = savedAnalyses[name];

        if (!analysisData) {
            showStatus(`❌ "${name}" 분석을 찾을 수 없습니다.`, 'error');
            return false;
        }

        try {
            // 전역 변수에 데이터 복원
            window.analysisResults = analysisData.data.analysisResults;
            window.processedData = analysisData.data.processedData;
            window.segmentationResults = analysisData.data.segmentationResults;
            window.salesData = analysisData.data.salesData;
            window.selectedManager = analysisData.data.selectedManager;

            // UI 상태 복원
            this.restoreUIState(analysisData);

            showStatus(`✅ 분석 결과 "${name}"을 불러왔습니다.`, 'success');
            
            // 탭을 분석 탭으로 전환
            switchTab('analysis');
            
            return true;
        } catch (error) {
            console.error('분석 불러오기 오류:', error);
            showStatus('❌ 분석 불러오기에 실패했습니다.', 'error');
            return false;
        }
    }

    // UI 상태 복원
    restoreUIState(analysisData) {
        // 담당자 정보 복원
        if (analysisData.data.selectedManager) {
            const managerInfo = document.getElementById('managerInfoText');
            const managerPanel = document.getElementById('currentManagerInfo');
            if (managerInfo && managerPanel) {
                managerInfo.textContent = `담당자: ${analysisData.data.selectedManager}`;
                managerPanel.style.display = 'block';
            }
        }

        // 분석 그리드 표시
        if (window.analysisResults) {
            displayAnalysisResults(window.analysisResults);
        }

        // 세분화 결과가 있으면 표시
        if (window.segmentationResults) {
            displaySegmentationResults(window.segmentationResults);
            
            // 세분화 탭 활성화
            const segmentationBtn = document.getElementById('segmentationBtn');
            const recommendationBtn = document.getElementById('recommendationBtn');
            if (segmentationBtn) segmentationBtn.disabled = false;
            if (recommendationBtn) recommendationBtn.disabled = false;
        }

        // 버튼 상태 업데이트
        const basicAnalysisBtn = document.getElementById('basicAnalysisBtn');
        if (basicAnalysisBtn) basicAnalysisBtn.disabled = false;
    }

    // 분석 삭제
    deleteAnalysis(name) {
        const savedAnalyses = this.getSavedAnalyses();
        
        if (!savedAnalyses[name]) {
            showStatus(`❌ "${name}" 분석을 찾을 수 없습니다.`, 'error');
            return false;
        }

        delete savedAnalyses[name];
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(savedAnalyses));
            showStatus(`✅ 분석 결과 "${name}"이 삭제되었습니다.`, 'success');
            this.updateSavedAnalysesList();
            return true;
        } catch (error) {
            console.error('분석 삭제 오류:', error);
            showStatus('❌ 분석 삭제에 실패했습니다.', 'error');
            return false;
        }
    }

    // 저장된 분석 목록 업데이트
    updateSavedAnalysesList() {
        const listContainer = document.getElementById('savedAnalysesList');
        if (!listContainer) return;

        const savedAnalyses = this.getSavedAnalyses();
        const analyses = Object.values(savedAnalyses);
        
        if (analyses.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">저장된 분석이 없습니다.</p>';
            return;
        }

        // 날짜순으로 정렬 (최신순)
        analyses.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

        const html = analyses.map(analysis => {
            const savedDate = new Date(analysis.savedAt);
            const formattedDate = savedDate.toLocaleString('ko-KR');
            const dataSize = analysis.metadata.dataSize || 0;
            const totalSales = analysis.metadata.totalSales || 0;
            
            return `
                <div class="saved-analysis-item" style="background: rgba(31, 41, 55, 0.5); border: 1px solid rgba(75, 85, 99, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0; color: #00d4ff; font-size: 1rem;">${analysis.name}</h4>
                            ${analysis.description ? `<p style="margin: 5px 0; color: #9ca3af; font-size: 0.9rem;">${analysis.description}</p>` : ''}
                        </div>
                        <div style="display: flex; gap: 8px; flex-shrink: 0;">
                            <button onclick="analysisSaveLoadManager.loadAnalysis('${analysis.name}')" 
                                    style="background: #10b981; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 0.8rem;">
                                📥 불러오기
                            </button>
                            <button onclick="analysisSaveLoadManager.confirmDelete('${analysis.name}')" 
                                    style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 0.8rem;">
                                🗑️ 삭제
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; color: #6b7280; font-size: 0.8rem;">
                        <span>📅 ${formattedDate}</span>
                        <span>📊 ${dataSize.toLocaleString()}건</span>
                        <span>💰 ${Math.round(totalSales / 10000).toLocaleString()}만원</span>
                        ${analysis.data.selectedManager ? `<span>👤 ${analysis.data.selectedManager}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = html;
    }

    // 삭제 확인
    confirmDelete(name) {
        if (confirm(`정말로 "${name}" 분석을 삭제하시겠습니까?`)) {
            this.deleteAnalysis(name);
        }
    }

    // 저장 다이얼로그 표시
    showSaveDialog() {
        const dialog = document.getElementById('saveAnalysisDialog');
        if (dialog) {
            dialog.style.display = 'block';
            document.getElementById('analysisNameInput').focus();
        }
    }

    // 저장 다이얼로그 숨기기
    hideSaveDialog() {
        const dialog = document.getElementById('saveAnalysisDialog');
        if (dialog) {
            dialog.style.display = 'none';
            document.getElementById('analysisNameInput').value = '';
            document.getElementById('analysisDescriptionInput').value = '';
        }
    }

    // 저장 실행
    executeSave() {
        const name = document.getElementById('analysisNameInput').value;
        const description = document.getElementById('analysisDescriptionInput').value;
        
        if (this.saveAnalysis(name, description)) {
            this.hideSaveDialog();
        }
    }

    // 저장/불러오기 UI 초기화
    initializeSaveLoadUI() {
        // DOM이 로드된 후 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.addSaveLoadUI());
        } else {
            this.addSaveLoadUI();
        }
    }

    // 저장/불러오기 UI 추가
    addSaveLoadUI() {
        // 저장/불러오기 탭이 이미 있는지 확인
        if (document.getElementById('saveLoadTab')) return;

        // 탭 네비게이션에 저장/불러오기 탭 추가
        const tabNavigation = document.querySelector('.tab-navigation');
        if (tabNavigation) {
            const saveLoadTab = document.createElement('button');
            saveLoadTab.className = 'tab-button';
            saveLoadTab.id = 'saveLoadTab';
            saveLoadTab.onclick = () => switchTab('saveLoad');
            saveLoadTab.innerHTML = `
                <span class="icon">💾</span>
                <span>저장/불러오기</span>
            `;
            tabNavigation.appendChild(saveLoadTab);
        }

        // 저장/불러오기 탭 콘텐츠 추가
        const tabContainer = document.querySelector('.container');
        if (tabContainer) {
            const saveLoadContent = document.createElement('div');
            saveLoadContent.id = 'saveLoadContent';
            saveLoadContent.className = 'tab-content';
            saveLoadContent.innerHTML = `
                <div class="control-panel">
                    <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #ffffff;">💾 분석 결과 관리</h2>
                        <button onclick="analysisSaveLoadManager.showSaveDialog()" 
                                style="background: #6366f1; color: white; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer; font-size: 0.9rem;">
                            💾 현재 분석 저장
                        </button>
                    </div>
                    <p style="color: #9ca3af; margin-bottom: 20px;">
                        분석 결과를 저장하고 나중에 불러와서 계속 작업할 수 있습니다.
                    </p>
                </div>
                
                <div style="background: rgba(17, 24, 39, 0.8); border: 1px solid rgba(75, 85, 99, 0.3); border-radius: 15px; padding: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #ffffff;">📋 저장된 분석 목록</h3>
                    <div id="savedAnalysesList"></div>
                </div>

                <!-- 저장 다이얼로그 -->
                <div id="saveAnalysisDialog" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 10000; backdrop-filter: blur(5px);">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(17, 24, 39, 0.95); border: 1px solid rgba(75, 85, 99, 0.5); border-radius: 15px; padding: 30px; min-width: 400px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);">
                        <h3 style="margin: 0 0 20px 0; color: #ffffff;">💾 분석 결과 저장</h3>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; color: #e5e7eb; font-size: 0.9rem; margin-bottom: 5px;">분석 이름 *</label>
                            <input type="text" id="analysisNameInput" placeholder="예: 2024년 4월 김병민 담당자 분석" 
                                   style="width: 100%; padding: 10px; background: rgba(55, 65, 81, 0.5); border: 1px solid rgba(75, 85, 99, 0.5); border-radius: 6px; color: #ffffff; font-size: 0.9rem;">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; color: #e5e7eb; font-size: 0.9rem; margin-bottom: 5px;">설명 (선택사항)</label>
                            <textarea id="analysisDescriptionInput" placeholder="분석에 대한 간단한 설명..." 
                                      style="width: 100%; height: 80px; padding: 10px; background: rgba(55, 65, 81, 0.5); border: 1px solid rgba(75, 85, 99, 0.5); border-radius: 6px; color: #ffffff; font-size: 0.9rem; resize: vertical;"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button onclick="analysisSaveLoadManager.hideSaveDialog()" 
                                    style="background: #6b7280; color: white; border: none; border-radius: 6px; padding: 10px 20px; cursor: pointer;">
                                취소
                            </button>
                            <button onclick="analysisSaveLoadManager.executeSave()" 
                                    style="background: #6366f1; color: white; border: none; border-radius: 6px; padding: 10px 20px; cursor: pointer;">
                                💾 저장
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // 마지막 탭 콘텐츠 뒤에 추가
            const lastTabContent = tabContainer.querySelector('#exportContent');
            if (lastTabContent) {
                lastTabContent.parentNode.insertBefore(saveLoadContent, lastTabContent.nextSibling);
            } else {
                tabContainer.appendChild(saveLoadContent);
            }
        }

        // Enter 키로 저장 실행
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.getElementById('saveAnalysisDialog').style.display === 'block') {
                this.executeSave();
            }
        });

        // 초기 목록 업데이트
        setTimeout(() => this.updateSavedAnalysesList(), 100);
    }
}

// 전역 인스턴스 생성
window.analysisSaveLoadManager = new AnalysisSaveLoadManager();

console.log('✅ 분석 저장/불러오기 시스템이 로드되었습니다.'); 