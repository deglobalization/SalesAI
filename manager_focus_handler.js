// =============== 담당자별 지역 포커스 관리 시스템 ===============

// 전역 변수
let managerFocusData = null;

// 담당자 지역 포커스 데이터 로드
async function loadManagerFocusData() {
    try {
        if (managerFocusData) {
            return managerFocusData;
        }
        
        const response = await fetch('./manager_focus_regions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        managerFocusData = await response.json();
        console.log('담당자 지역 포커스 데이터 로드 완료:', managerFocusData);
        return managerFocusData;
    } catch (error) {
        console.error('담당자 지역 포커스 데이터 로드 실패:', error);
        return null;
    }
}

// 특정 담당자의 포커스 지역 정보 가져오기
function getManagerFocusRegion(managerName) {
    if (!managerFocusData || !managerFocusData.manager_focus_regions) {
        console.warn('담당자 지역 포커스 데이터가 로드되지 않았습니다.');
        return null;
    }
    
    const focusInfo = managerFocusData.manager_focus_regions[managerName];
    if (!focusInfo) {
        console.warn(`담당자 ${managerName}의 포커스 지역 정보를 찾을 수 없습니다.`);
        return null;
    }
    
    return focusInfo;
}

// 지역별 담당자 목록 가져오기
function getManagersByRegion(regionName) {
    if (!managerFocusData || !managerFocusData.manager_focus_regions) {
        return [];
    }
    
    const managers = [];
    for (const [managerName, info] of Object.entries(managerFocusData.manager_focus_regions)) {
        if (info.primary_region === regionName) {
            managers.push(managerName);
        }
    }
    
    return managers;
}

// 담당자별 지역 매핑 정보를 기존 시스템에 통합
function integrateManagerFocusToRegionEstimation() {
    // 기존 estimateRegionFromName 함수에 담당자 정보 추가
    if (window.estimateRegionFromName) {
        const originalFunction = window.estimateRegionFromName;
        
        window.estimateRegionFromName = function(accountName, managerArea = null, managerName = null) {
            // 1. 담당자 기반 지역 포커스 우선 적용
            if (managerName) {
                const focusInfo = getManagerFocusRegion(managerName);
                if (focusInfo) {
                    const regionDef = managerFocusData.region_definitions[focusInfo.primary_region];
                    if (regionDef) {
                        return {
                            region: regionDef.parent || '경기',
                            detailedRegion: focusInfo.primary_region,
                            detailedInfo: {
                                lat: focusInfo.coordinates.lat,
                                lng: focusInfo.coordinates.lng,
                                name: regionDef.full_name,
                                parent: regionDef.parent || '경기',
                                bounds: focusInfo.bounds
                            }
                        };
                    }
                }
            }
            
            // 2. 기존 로직 실행
            return originalFunction.call(this, accountName, managerArea, managerName);
        };
    }
}

// 담당자별 포커스 지역 UI 표시
function displayManagerFocusInfo(managerName) {
    const focusInfo = getManagerFocusRegion(managerName);
    if (!focusInfo) return null;
    
    const infoHtml = `
        <div class="manager-focus-info" style="
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1));
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 8px;
            padding: 12px;
            margin: 10px 0;
            backdrop-filter: blur(10px);
        ">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #22c55e; font-size: 1.1rem; margin-right: 8px;">📍</span>
                <span style="color: #ffffff; font-weight: bold;">${managerName} 담당자 포커스 지역</span>
            </div>
            <div style="color: #e5e7eb; font-size: 0.9rem; margin-left: 24px;">
                <div><strong style="color: #22c55e;">주요 담당 지역:</strong> ${focusInfo.description}</div>
                <div><strong style="color: #22c55e;">지역 코드:</strong> ${focusInfo.region_code}</div>
            </div>
        </div>
    `;
    
    return infoHtml;
}

// 지도에서 담당자 포커스 지역으로 이동 (하이라이트 제거)
function highlightManagerFocusRegion(managerName, map = null) {
    const focusInfo = getManagerFocusRegion(managerName);
    if (!focusInfo || !map) return false;
    
    // 포커스 지역으로 지도 이동만 수행
    const bounds = focusInfo.bounds;
    map.flyToBounds(bounds, {
        paddingTopLeft: [20, 20],
        paddingBottomRight: [20, 20],
        duration: 2.0,
        maxZoom: 11
    });
    
    return true;
}

// 담당자 변경 시 포커스 지역 자동 적용 (UI 표시 제거)
function applyManagerFocusOnSelection(managerName) {
    const focusInfo = getManagerFocusRegion(managerName);
    if (!focusInfo) return;
    
    // 지도가 있다면 포커스 지역으로 이동만 수행
    if (window.salesMap) {
        setTimeout(() => {
            highlightManagerFocusRegion(managerName, window.salesMap);
        }, 1000);
    }
    
    console.log(`${managerName} 담당자의 포커스 지역(${focusInfo.primary_region}) 적용 완료`);
}

// 전체 담당자 포커스 지역 요약 정보
function getManagerFocusSummary() {
    if (!managerFocusData) return null;
    
    const summary = {
        구리: [],
        하남: [],
        광주: [],
        용인: []
    };
    
    for (const [managerName, info] of Object.entries(managerFocusData.manager_focus_regions)) {
        const region = info.primary_region;
        if (summary[region]) {
            summary[region].push(managerName);
        }
    }
    
    return summary;
}

// UI에 전체 담당자 포커스 요약 표시
function displayManagerFocusSummaryUI() {
    const summary = getManagerFocusSummary();
    if (!summary) return '';
    
    let summaryHtml = `
        <div class="manager-focus-summary" style="
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
            backdrop-filter: blur(10px);
        ">
            <h3 style="color: #ffffff; margin: 0 0 15px 0; display: flex; align-items: center;">
                <span style="margin-right: 8px;">🗺️</span>
                담당자별 지역 포커스 현황
            </h3>
    `;
    
    for (const [region, managers] of Object.entries(summary)) {
        if (managers.length > 0) {
            summaryHtml += `
                <div style="margin-bottom: 10px;">
                    <span style="color: #6366f1; font-weight: bold; font-size: 1rem;">${region}:</span>
                    <span style="color: #e5e7eb; margin-left: 8px;">${managers.join(', ')}</span>
                </div>
            `;
        }
    }
    
    summaryHtml += '</div>';
    return summaryHtml;
}

// 초기화 함수
async function initializeManagerFocusSystem() {
    console.log('담당자 지역 포커스 시스템 초기화 중...');
    
    try {
        await loadManagerFocusData();
        integrateManagerFocusToRegionEstimation();
        
        // UI 컨테이너 생성
        if (!document.getElementById('managerFocusContainer')) {
            const container = document.createElement('div');
            container.id = 'managerFocusContainer';
            container.style.cssText = 'margin: 10px 0;';
            
            // 적절한 위치에 컨테이너 추가
            const targetElement = document.getElementById('currentManagerInfo') || 
                                  document.querySelector('.analysis-card') ||
                                  document.body;
            
            if (targetElement.nextSibling) {
                targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
            } else {
                targetElement.parentNode.appendChild(container);
            }
        }
        
        console.log('담당자 지역 포커스 시스템 초기화 완료');
        return true;
    } catch (error) {
        console.error('담당자 지역 포커스 시스템 초기화 실패:', error);
        return false;
    }
}

// 기존 담당자 선택 함수에 포커스 적용 기능 추가
function enhanceManagerSelection() {
    // 기존 담당자 선택 이벤트에 포커스 적용 추가
    if (window.updateManagerInfoUI) {
        const originalUpdateUI = window.updateManagerInfoUI;
        
        window.updateManagerInfoUI = function() {
            originalUpdateUI.call(this);
            
            if (window.currentManager) {
                applyManagerFocusOnSelection(window.currentManager);
            }
        };
    }
}

// Export functions for global access
window.loadManagerFocusData = loadManagerFocusData;
window.getManagerFocusRegion = getManagerFocusRegion;
window.getManagersByRegion = getManagersByRegion;
window.displayManagerFocusInfo = displayManagerFocusInfo;
window.highlightManagerFocusRegion = highlightManagerFocusRegion;
window.applyManagerFocusOnSelection = applyManagerFocusOnSelection;
window.getManagerFocusSummary = getManagerFocusSummary;
window.displayManagerFocusSummaryUI = displayManagerFocusSummaryUI;
window.initializeManagerFocusSystem = initializeManagerFocusSystem;

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        await initializeManagerFocusSystem();
        enhanceManagerSelection();
    }, 1000);
});

console.log('담당자 지역 포커스 핸들러 로드 완료'); 