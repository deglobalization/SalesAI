// GitHub Pages 배포를 위한 설정 스크립트

// 원본 fetch 함수 저장 (오버라이드 전에 미리 저장)
const originalFetch = window.fetch;

// API 호출을 상대 경로로 변경하는 함수
function convertToStaticPaths() {
    // advisor.html에서 API 호출을 정적 파일 경로로 변경
    const apiMappings = {
        // 상대 경로 API
        '/api/products': './product_groups.json',
        '/api/managers': './manager_list.json', 
        '/api/recommendations': './recommendations_data.json',
        '/api/manager-recommendations': './manager_recommendations_data.json',
        '/api/manager-focus': './manager_focus_regions.json',
        '/api/summary': './total_managers_summary.json',
        '/api/health': './health.json',
        '/api/recommend': './recommendations_data.json',
        
        // localhost 절대 경로 API
        'http://localhost:8080/api/products': './product_groups.json',
        'http://localhost:8080/api/managers': './manager_list.json',
        'http://localhost:8080/api/recommendations': './recommendations_data.json',
        'http://localhost:8080/api/manager-recommendations': './manager_recommendations_data.json',
        'http://localhost:8080/api/manager-focus': './manager_focus_regions.json',
        'http://localhost:8080/api/summary': './total_managers_summary.json',
        'http://localhost:8080/api/health': './health.json',
        'http://localhost:8080/api/recommend': './recommendations_data.json',
        
        // CSV 파일들을 JSON으로 리다이렉트 (GitHub Pages에서 CSV 제한 때문)
        './rx-rawdata.csv': './manager_recommendations_data.json',
        'rx-rawdata.csv': './manager_recommendations_data.json'
    };
    
    // 담당자별 CSV 파일 매핑 추가
    const managerNames = ['김관태', '김병민', '김서연', '김인용', '박경현', '이인철', '이지형', '이창준A', '이한솔B', '이희영'];
    managerNames.forEach(name => {
        const encodedName = encodeURIComponent(name);
        apiMappings[`manager_data/manager_${encodedName}.csv`] = './manager_recommendations_data.json';
        apiMappings[`./manager_data/manager_${encodedName}.csv`] = './manager_recommendations_data.json';
    });
    
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

// URL 정규화 함수
function normalizeUrl(url) {
    if (typeof url !== 'string') return url;
    
    // 쿼리 파라미터와 fragment 제거하여 깔끔한 매핑
    try {
        const urlObj = new URL(url, window.location.href);
        return urlObj.pathname;
    } catch (error) {
        // URL 파싱 실패 시 원본 반환
        return url;
    }
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
            let staticPath = null;
            
            // 디버깅: 모든 매핑 확인
            console.log(`🔍 매핑 대상 URL: "${url}"`);
            console.log(`🔍 URL 타입: ${typeof url}`);
            
            // GitHub Pages에서 localhost 호출 완전 차단
            if (typeof url === 'string' && url.includes('localhost')) {
                console.log(`🚫 GitHub Pages에서 localhost 호출 차단: ${url}`);
                
                // localhost URL을 강제로 정적 파일로 변환
                if (url.includes('/api/products')) {
                    staticPath = './product_groups.json';
                } else if (url.includes('/api/recommend')) {
                    staticPath = './recommendations_data.json';
                } else if (url.includes('/api/managers')) {
                    staticPath = './manager_list.json';
                } else if (url.includes('/api/summary')) {
                    staticPath = './total_managers_summary.json';
                } else if (url.includes('/api/health')) {
                    staticPath = './health.json';
                } else {
                    staticPath = './health.json'; // 기본 fallback
                }
                
                console.log(`🔄 localhost → 정적 파일 강제 변환: ${staticPath}`);
            }
            
            // 1단계: 정확한 URL 매칭
            if (!staticPath && apiMappings[url]) {
                staticPath = apiMappings[url];
                console.log(`✅ 1단계 정확 매칭: "${url}" → "${staticPath}"`);
            }
            
            // 2단계: URL 정규화 매칭  
            if (!staticPath) {
                const normalizedUrl = normalizeUrl(url);
                if (apiMappings[normalizedUrl]) {
                    staticPath = apiMappings[normalizedUrl];
                    console.log(`✅ 2단계 정규화 매칭: "${normalizedUrl}" → "${staticPath}"`);
                }
            }
            
            // 3단계: 패턴 매칭 (localhost API 호출들)
            if (!staticPath && typeof url === 'string') {
                if (url.includes('localhost:8080/api/products')) {
                    staticPath = './product_groups.json';
                    console.log(`✅ 3단계 패턴 매칭: products API → "${staticPath}"`);
                } else if (url.includes('localhost:8080/api/recommend')) {
                    staticPath = './recommendations_data.json';
                    console.log(`✅ 3단계 패턴 매칭: recommend API → "${staticPath}"`);
                } else if (url.includes('localhost:8080/api/managers')) {
                    staticPath = './manager_list.json';
                    console.log(`✅ 3단계 패턴 매칭: managers API → "${staticPath}"`);
                } else if (url.includes('localhost:8080/api/')) {
                    staticPath = './health.json';  // 기본 fallback
                    console.log(`✅ 3단계 패턴 매칭: 기타 API → "${staticPath}"`);
                }
            }
            
            // 4단계: 여전히 매핑 없으면 원본 사용
            if (!staticPath) {
                staticPath = url;
                console.log(`⚠️ 매핑 실패, 원본 사용: "${url}"`);
            }
            
            console.log(`🌐 GitHub Pages 모드: ${url} → ${staticPath}`);
            
            // POST 요청은 실제 데이터 로드 시도 (GitHub Pages)
            if (options.method === 'POST') {
                console.log('📤 POST 요청 감지, GitHub Pages용 실제 데이터 로드 시도');
                
                // 추천 요청인 경우 실제 recommendations_data.json에서 데이터 로드 (경량화 버전)
                if (url.includes('recommend')) {
                    try {
                        // POST 요청의 body에서 product_group 추출
                        let productGroup = null;
                        if (options.body) {
                            const requestData = JSON.parse(options.body);
                            productGroup = requestData.product_group;
                        }
                        
                        console.log(`🔍 요청된 품목군: "${productGroup}"`);
                        
                        // recommendations_data.json 로드 (더 안정적)
                        const recommendationsResponse = await originalFetch('./recommendations_data.json');
                        if (!recommendationsResponse.ok) {
                            throw new Error(`추천 데이터 파일 로드 실패: ${recommendationsResponse.status}`);
                        }
                        
                        const recommendationsData = await recommendationsResponse.json();
                        const allRecommendations = recommendationsData.recommendations || {};
                        
                        // 요청된 품목군의 데이터 찾기
                        let productRecommendations = [];
                        if (productGroup && allRecommendations[productGroup]) {
                            productRecommendations = allRecommendations[productGroup];
                            console.log(`✅ "${productGroup}" 품목군 데이터 발견: ${productRecommendations.length}개 추천`);
                        } else {
                            console.log(`❌ "${productGroup}" 품목군 데이터 없음`);
                            console.log(`📋 사용 가능한 품목군 (일부):`, Object.keys(allRecommendations).slice(0, 10));
                            
                            return {
                                ok: true,
                                json: async () => ({
                                    success: false,
                                    recommendations: [],
                                    message: `"${productGroup}" 품목군에 대한 추천 데이터가 없습니다.`,
                                    available_products: Object.keys(allRecommendations).slice(0, 10)
                                })
                            };
                        }
                        
                        // 최대 20개까지 제한
                        const limitedRecommendations = productRecommendations.slice(0, 20);
                        
                        return {
                            ok: true,
                            json: async () => ({
                                success: true,
                                recommendations: limitedRecommendations.map(rec => ({
                                    customer: rec.거래처명 || rec.customer || 'Unknown',
                                    analysis: `유사도: ${rec.유사도점수 || 'N/A'} | 성공확률: ${rec.성공확률 || 'N/A'}%`,
                                    strategies: [
                                        `추천 이유: ${rec.추천이유 || '데이터 기반 추천'}`,
                                        `예상 매출: ${rec.예상매출 || 'N/A'}원`
                                    ],
                                    confidence: (rec.성공확률 || 75) / 100,
                                    productName: productGroup,
                                    rawData: rec // 원본 데이터도 포함
                                })),
                                message: `"${productGroup}" 품목군에 대한 ${limitedRecommendations.length}개 추천을 제공합니다.`,
                                source: 'recommendations_data',
                                product_group: productGroup,
                                total_recommendations: productRecommendations.length
                            })
                        };
                        
                    } catch (error) {
                        console.error('🚨 추천 데이터 로드 실패:', error);
                        
                        // 실패시 기본 더미 응답
                        return {
                            ok: true,
                            json: async () => ({
                                success: false,
                                recommendations: [],
                                message: `추천 데이터 로드 실패: ${error.message}`,
                                error: true
                            })
                        };
                    }
                }
                
                // 기타 POST 요청은 기본 더미 응답  
                if (url.includes('products')) {
                    return {
                        ok: true,
                        json: async () => ({
                            success: true,
                            recommendations: [
                                {
                                    customer: "샘플 거래처 1",
                                    analysis: "GitHub Pages 정적 데이터 기반 분석",
                                    strategies: ["정적 환경 기본 전략"],
                                    confidence: 0.75
                                },
                                {
                                    customer: "샘플 거래처 2", 
                                    analysis: "GitHub Pages 제한 환경",
                                    strategies: ["로컬 환경에서 전체 기능 이용 권장"],
                                    confidence: 0.60
                                }
                            ],
                            message: 'GitHub Pages에서는 제한된 추천 데이터를 제공합니다.'
                        })
                    };
                }
                
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: [],
                        message: 'GitHub Pages에서는 동적 기능이 제한됩니다.'
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
                    showStatus('🌐 GitHub Pages에서 실행 중입니다. localhost 호출은 모두 정적 파일로 자동 변환됩니다.', 'info');
                }
            }, 2000);
            
            // 추가 환경 정보 표시
            setTimeout(() => {
                console.log('📋 GitHub Pages 환경 상세 정보:');
                console.log('  - localhost:8080 → 정적 JSON 파일 자동 매핑');
                console.log('  - POST 요청 → 실제 추천 데이터 로드');
                console.log('  - 전체 기능은 로컬 환경(http://localhost:8080)에서 이용 가능');
            }, 3000);
        } else {
            console.log('🖥️ 로컬 환경 감지됨 - 모든 API 기능 사용 가능');
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