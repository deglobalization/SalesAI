// 사전 로드 시스템 - 배포 시 분석 결과 자동 로드
console.log('🚀 사전 로드 시스템이 로드되었습니다.');

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
            if (window.showStatus) {
                window.showStatus(`🎉 사전 분석된 ${preloadData.totalManagers}명 담당자 데이터를 자동으로 로드했습니다!`, 'success');
            }
            
            console.log(`✅ 배포 모드: ${preloadData.totalManagers}명 담당자의 분석 결과 자동 로드 완료`);
            
            // 첫 번째 담당자로 자동 설정 (옵션)
            const managerNames = Object.keys(preloadData.analysisResults);
            if (managerNames.length > 0 && !window.currentManager) {
                const firstManager = managerNames[0];
                console.log(`🎯 첫 번째 담당자 ${firstManager}로 자동 설정`);
                
                // 약간의 지연 후 자동 로드
                setTimeout(() => {
                    if (window.selectAnalyzedManager) {
                        window.selectAnalyzedManager(firstManager);
                    }
                }, 2000);
            }
            
            // 담당자 목록 및 핵심 지표 업데이트
            setTimeout(() => {
                if (window.addManagerListToAnalysis) {
                    window.addManagerListToAnalysis();
                }
                if (window.updateCoreMetricsDisplay) {
                    window.updateCoreMetricsDisplay();
                }
            }, 3000);
            
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
           (window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1' &&
            window.location.hostname !== '');
}

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 배포 모드 확인 중...');
    
    if (isDeploymentMode()) {
        console.log('🌐 배포 모드 감지 - 사전 로드된 분석 결과 확인 중...');
        
        // 약간의 지연 후 사전 로드 시도
        setTimeout(async () => {
            try {
                const preloadSuccess = await loadPreloadedAnalysisResults();
                if (preloadSuccess) {
                    console.log('✅ 배포 모드 자동 초기화 완료');
                } else {
                    console.log('📋 사전 로드 파일 없음 - 일반 모드로 진행');
                }
            } catch (error) {
                console.log('⚠️ 사전 로드 시도 중 오류:', error);
            }
        }, 3000);
    } else {
        console.log('🖥️ 로컬 개발 모드 감지 - 일반 모드로 진행');
    }
});

// 전역 함수로 노출
window.loadPreloadedAnalysisResults = loadPreloadedAnalysisResults;
window.isDeploymentMode = isDeploymentMode;

console.log('✅ 사전 로드 시스템 초기화 완료'); 