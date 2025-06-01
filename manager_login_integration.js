// =============== 로그인 페이지 연동 시스템 ===============

// URL 파라미터 처리 함수
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedManager = urlParams.get('manager');
    const autoStart = urlParams.get('autoStart');
    
    if (selectedManager) {
        console.log(`🎯 로그인 페이지에서 선택된 담당자: ${selectedManager}`);
        
        // 담당자 자동 선택 및 분석 시작
        setTimeout(() => {
            autoSelectManagerAndStart(selectedManager, autoStart === 'true');
        }, 2000);
        
        if (window.showStatus) {
            window.showStatus(`${selectedManager} 담당자로 시스템을 준비하고 있습니다...`, 'info');
        }
    }
}

// 담당자 자동 선택 및 분석 시작
async function autoSelectManagerAndStart(managerName, shouldAutoStart = false) {
    try {
        console.log(`🚀 담당자 자동 선택 시작: ${managerName}`);
        
        // 1. 담당자 지역 포커스 시스템 활성화
        if (window.applyManagerFocusOnSelection) {
            window.applyManagerFocusOnSelection(managerName);
            console.log(`📍 지역 포커스 적용: ${managerName}`);
        }
        
        // 2. 담당자 선택 UI 업데이트 (드롭다운이 있다면)
        const managerSelect = document.getElementById('managerSelect');
        if (managerSelect) {
            // 옵션이 로드될 때까지 대기
            const waitForOptions = () => {
                if (managerSelect.options.length > 1) {
                    // 담당자 선택
                    for (let option of managerSelect.options) {
                        if (option.text.includes(managerName) || option.value === managerName) {
                            managerSelect.value = option.value;
                            
                            // 변경 이벤트 트리거
                            const event = new Event('change', { bubbles: true });
                            managerSelect.dispatchEvent(event);
                            console.log(`👤 드롭다운 담당자 선택: ${managerName}`);
                            break;
                        }
                    }
                } else {
                    setTimeout(waitForOptions, 500);
                }
            };
            waitForOptions();
        }
        
        // 3. 현재 담당자 전역 변수 설정
        if (window.currentManager !== undefined) {
            window.currentManager = managerName;
            console.log(`🔄 전역 담당자 설정: ${managerName}`);
        }
        
        // 4. 자동 분석 시작 (autoStart가 true인 경우)
        if (shouldAutoStart) {
            setTimeout(() => {
                autoStartAnalysis(managerName);
            }, 3000);
        }
        
        if (window.showStatus) {
            window.showStatus(`✅ ${managerName} 담당자 선택 완료! 해당 지역으로 지도를 이동합니다.`, 'success');
        }
        
    } catch (error) {
        console.error('담당자 자동 선택 실패:', error);
        if (window.showStatus) {
            window.showStatus(`⚠️ ${managerName} 담당자 설정 중 오류가 발생했습니다.`, 'warning');
        }
    }
}

// 자동 분석 시작
async function autoStartAnalysis(managerName) {
    try {
        console.log(`📊 자동 분석 시작: ${managerName}`);
        
        if (window.showStatus) {
            window.showStatus(`🚀 ${managerName} 담당자의 분석을 자동으로 시작합니다...`, 'info');
        }
        
        // CSV 파일이 로드되었는지 확인
        if (window.csvData && window.csvData.length > 0) {
            console.log('✅ CSV 데이터가 이미 로드됨, 분석 시작');
            
            // 데이터가 이미 로드된 경우 분석 수행
            if (window.performAnalysis) {
                await window.performAnalysis();
            } else if (window.updateAnalysis) {
                await window.updateAnalysis();
            } else if (window.analyzeData) {
                await window.analyzeData();
            }
            
            if (window.showStatus) {
                window.showStatus(`🎉 ${managerName} 담당자의 분석이 완료되었습니다!`, 'success');
            }
        } else {
            console.log('⏳ CSV 데이터 로드 대기 중...');
            
            // 데이터 로드를 기다린 후 분석 수행
            const waitForData = () => {
                if (window.csvData && window.csvData.length > 0) {
                    console.log('✅ CSV 데이터 로드 완료, 분석 시작');
                    
                    setTimeout(async () => {
                        if (window.performAnalysis) {
                            await window.performAnalysis();
                        } else if (window.updateAnalysis) {
                            await window.updateAnalysis();
                        } else if (window.analyzeData) {
                            await window.analyzeData();
                        }
                        
                        if (window.showStatus) {
                            window.showStatus(`🎉 ${managerName} 담당자의 분석이 완료되었습니다!`, 'success');
                        }
                    }, 1000);
                } else {
                    setTimeout(waitForData, 1000);
                }
            };
            waitForData();
            
            if (window.showStatus) {
                window.showStatus('📊 데이터 로드 완료 후 자동으로 분석을 시작합니다...', 'info');
            }
        }
        
    } catch (error) {
        console.error('자동 분석 시작 실패:', error);
        if (window.showStatus) {
            window.showStatus(`⚠️ ${managerName} 담당자의 자동 분석 중 오류가 발생했습니다.`, 'warning');
        }
    }
}

// 담당자 로그인 상태 표시
function displayManagerLoginStatus(managerName) {
    // 페이지 상단에 로그인 담당자 정보 표시
    const loginStatusHtml = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9));
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 0.9rem;
            box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
        ">
            <span>👤</span>
            <span>${managerName} 담당자</span>
            <button onclick="this.parentElement.style.display='none'" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: 8px;
                font-size: 1.2rem;
                opacity: 0.7;
            ">×</button>
        </div>
    `;
    
    // 기존 로그인 상태 제거
    const existingStatus = document.getElementById('managerLoginStatus');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // 새 로그인 상태 추가
    const statusElement = document.createElement('div');
    statusElement.id = 'managerLoginStatus';
    statusElement.innerHTML = loginStatusHtml;
    document.body.appendChild(statusElement);
    
    // 5초 후 자동으로 투명도 감소
    setTimeout(() => {
        const statusEl = document.getElementById('managerLoginStatus');
        if (statusEl) {
            statusEl.style.opacity = '0.7';
        }
    }, 5000);
}

// Export functions for global access
window.handleURLParameters = handleURLParameters;
window.autoSelectManagerAndStart = autoSelectManagerAndStart;
window.autoStartAnalysis = autoStartAnalysis;
window.displayManagerLoginStatus = displayManagerLoginStatus;

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 로그인 연동 시스템 로드됨');
    
    // URL 파라미터 처리
    setTimeout(() => {
        handleURLParameters();
    }, 500);
});

console.log('🔗 담당자 로그인 연동 시스템 로드 완료'); 