// GitHub Pages 배포를 위한 설정 스크립트

// 원본 fetch 함수 저장 (오버라이드 전에 미리 저장)
const originalFetch = window.fetch;

// API 호출을 상대 경로로 변경하는 함수
function convertToStaticPaths() {
    // advisor.html에서 API 호출을 정적 파일 경로로 변경
    const apiMappings = {
        '/api/products': './product_groups.json',
        '/api/managers': './manager_list.json', 
        '/api/recommendations': './recommendations_data.json',
        '/api/manager-recommendations': './manager_recommendations_data.json',
        '/api/manager-focus': './manager_focus_regions.json',
        '/api/summary': './total_managers_summary.json',
        '/api/health': './health.json' // 더미 헬스체크 파일
    };
    
    return apiMappings;
}

// GitHub Pages 환경 감지
function isGitHubPages() {
    try {
        return window.location.hostname.includes('github.io') || 
               window.location.hostname.includes('githubusercontent.com');
    } catch (error) {
        console.warn('GitHub Pages 환경 감지 실패:', error);
        return false;
    }
}

// 헬스체크 더미 파일 생성 함수
function createHealthCheck() {
    return {
        status: 'ok',
        server: 'GitHub Pages',
        timestamp: new Date().toISOString(),
        message: 'SalesAI running on GitHub Pages'
    };
}

// 정적 파일용 fetch 함수 (재귀 방지)
let isStaticFetchActive = false;

async function staticFetch(url, options = {}) {
    // 재귀 호출 방지
    if (isStaticFetchActive) {
        console.warn('🔄 staticFetch 재귀 호출 감지, 원본 fetch 사용:', url);
        return originalFetch(url, options);
    }
    
    try {
        isStaticFetchActive = true;
        
        if (isGitHubPages()) {
            const apiMappings = convertToStaticPaths();
            const staticPath = apiMappings[url] || url;
            
            console.log(`🌐 GitHub Pages 모드: ${url} → ${staticPath}`);
            
            // POST 요청은 더미 응답 반환
            if (options.method === 'POST') {
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        recommendations: [],
                        message: 'GitHub Pages에서는 AI 추천 기능이 제한됩니다.'
                    })
                };
            }
            
            // 원본 fetch 사용하여 무한 재귀 방지
            return await originalFetch(staticPath, options);
        } else {
            return await originalFetch(url, options);
        }
    } catch (error) {
        console.error('🚨 staticFetch 오류:', error);
        return await originalFetch(url, options);
    } finally {
        isStaticFetchActive = false;
    }
}

// 전역 fetch 오버라이드 (GitHub Pages에서만, 안전하게)
try {
    if (isGitHubPages()) {
        window.originalFetch = originalFetch;
        window.fetch = staticFetch;
        console.log('🚀 GitHub Pages 모드로 전환되었습니다.');
    }
} catch (error) {
    console.error('🚨 fetch 오버라이드 실패:', error);
}

// 상태 메시지 표시
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (isGitHubPages()) {
            setTimeout(() => {
                if (typeof showStatus === 'function') {
                    showStatus('🌐 GitHub Pages에서 실행 중입니다. 일부 AI 기능은 제한될 수 있습니다.', 'info');
                }
            }, 2000);
        }
    } catch (error) {
        console.error('🚨 상태 메시지 표시 오류:', error);
    }
});

// 안전한 전역 함수 등록
try {
    window.isGitHubPages = isGitHubPages;
    window.staticFetch = staticFetch;
} catch (error) {
    console.error('🚨 전역 함수 등록 오류:', error);
} 