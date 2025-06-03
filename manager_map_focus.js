// 담당자별 지역 포커싱 데이터
const managerRegionFocus = {
    '김병민': { region: '하남', lat: 37.5394, lng: 127.2145, bounds: [[37.58, 127.18], [37.50, 127.25]] },
    '이인철': { region: '구리', lat: 37.5943, lng: 127.1295, bounds: [[37.63, 127.09], [37.55, 127.17]] },
    '김서연': { region: '광주', lat: 37.4138, lng: 127.2553, bounds: [[37.45, 127.22], [37.37, 127.29]] },
    '김관태': { region: '광주', lat: 37.4138, lng: 127.2553, bounds: [[37.45, 127.22], [37.37, 127.29]] },
    '김인용': { region: '용인', lat: 37.2411, lng: 127.1776, bounds: [[37.30, 127.11], [37.18, 127.25]] },
    '박경현': { region: '용인', lat: 37.2411, lng: 127.1776, bounds: [[37.30, 127.11], [37.18, 127.25]] },
    '이지형': { region: '하남', lat: 37.5394, lng: 127.2145, bounds: [[37.58, 127.18], [37.50, 127.25]] },
    '이창준A': { region: '용인', lat: 37.2411, lng: 127.1776, bounds: [[37.30, 127.11], [37.18, 127.25]] },
    '이한솔B': { region: '용인', lat: 37.2411, lng: 127.1776, bounds: [[37.30, 127.11], [37.18, 127.25]] },
    '이희영': { region: '용인', lat: 37.2411, lng: 127.1776, bounds: [[37.30, 127.11], [37.18, 127.25]] }
};

// 담당자별 지도 포커싱 함수
function focusMapOnManager(managerName) {
    console.log(`🗺️ 지도 포커싱 요청: ${managerName}`);
    
    // salesMap이 초기화될 때까지 대기
    const waitForMap = () => {
        if (typeof salesMap !== 'undefined' && salesMap) {
            const regionInfo = managerRegionFocus[managerName];
            if (!regionInfo) {
                console.warn(`${managerName} 담당자의 지역 정보를 찾을 수 없습니다.`);
                return;
            }
            
            console.log(`🎯 ${managerName} 담당자의 ${regionInfo.region} 지역으로 지도 포커싱`);
            
            // 해당 지역으로 부드럽게 이동하고 확대
            salesMap.flyToBounds(regionInfo.bounds, {
                paddingTopLeft: [20, 20],
                paddingBottomRight: [20, 20],
                duration: 2.5,
                maxZoom: 11
            });
            
            // 포커싱 완료 메시지
            if (typeof showStatus === 'function') {
                showStatus(`🎯 ${managerName} 담당자의 ${regionInfo.region} 지역으로 지도를 포커싱했습니다.`, 'success');
            }
        } else {
            console.log('🕐 지도 초기화 대기 중...');
            setTimeout(waitForMap, 1000);
        }
    };
    
    waitForMap();
}

// URL 파라미터에서 담당자 확인 시 자동 지도 포커싱
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const managerParam = urlParams.get('manager');
    
    if (managerParam) {
        console.log(`📍 URL 파라미터 담당자 발견: ${managerParam}, 지도 포커싱 준비`);
        
        // 지도가 완전히 로드된 후 포커싱 (충분한 지연시간 확보)
        setTimeout(() => {
            focusMapOnManager(managerParam);
        }, 8000);
    }
});

// 전역 함수로 등록
window.focusMapOnManager = focusMapOnManager;
window.managerRegionFocus = managerRegionFocus;

console.log('📍 담당자별 지도 포커싱 모듈이 로드되었습니다.'); 