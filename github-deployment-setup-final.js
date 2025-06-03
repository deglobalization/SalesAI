// ===== INSTANT EXECUTION GITHUB PAGES SETUP =====
// 즉시 실행되는 GitHub Pages 호환 스크립트

(function() {
    'use strict';
    
    console.log('🚀 GitHub Pages 즉시 설정 시작...');
    
    // GitHub Pages 환경 감지 (즉시)
    const IS_GITHUB_PAGES = window.location.hostname.includes('github.io') || 
                           window.location.hostname.includes('githubusercontent.com');
    
    if (!IS_GITHUB_PAGES) {
        console.log('🖥️ 로컬 환경 감지 - 스크립트 종료');
        return;
    }
    
    console.log('🌐 GitHub Pages 환경 감지됨!');
    
    // 원본 fetch 즉시 저장
    const ORIGINAL_FETCH = window.fetch.bind(window);
    
    // 즉시 실행 fetch 오버라이드
    window.fetch = async function(url, options = {}) {
        console.log(`🔍 FETCH 호출: ${url}`);
        
        // localhost 호출 완전 차단
        if (typeof url === 'string' && url.includes('localhost')) {
            console.log(`🚫 LOCALHOST 차단: ${url}`);
            
            let staticFile = './health.json'; // 기본값
            
            if (url.includes('/api/products')) {
                staticFile = './product_groups.json';
            } else if (url.includes('/api/recommend')) {
                staticFile = './recommendations_data.json';
            } else if (url.includes('/api/managers')) {
                staticFile = './manager_list.json';
            }
            
            console.log(`🔄 리다이렉트: ${staticFile}`);
            
            // POST 요청 특별 처리
            if (options.method === 'POST' && url.includes('recommend')) {
                console.log('📤 POST 추천 요청 처리');
                
                try {
                    // 요청 데이터에서 품목군 추출
                    let productGroup = null;
                    if (options.body) {
                        const requestData = JSON.parse(options.body);
                        productGroup = requestData.product_group;
                    }
                    
                    console.log(`🔍 요청 품목군: "${productGroup}"`);
                    
                    // 추천 데이터 로드
                    const response = await ORIGINAL_FETCH('./recommendations_data.json');
                    const data = await response.json();
                    
                    const recommendations = data.recommendations || {};
                    const productRecs = recommendations[productGroup] || [];
                    
                    console.log(`✅ 발견된 추천 수: ${productRecs.length}`);
                    
                    return {
                        ok: true,
                        json: async () => ({
                            success: true,
                            recommendations: productRecs.slice(0, 20).map(rec => ({
                                customer: rec.거래처명 || 'Unknown',
                                analysis: `유사도: ${rec.유사도점수 || 'N/A'} | 성공확률: ${rec.성공확률 || 'N/A'}%`,
                                strategies: [`추천이유: ${rec.추천이유 || '데이터 기반 추천'}`],
                                confidence: (rec.성공확률 || 75) / 100,
                                productName: productGroup
                            })),
                            message: `${productRecs.length}개 추천 제공`
                        })
                    };
                    
                } catch (error) {
                    console.error('🚨 추천 처리 오류:', error);
                    return {
                        ok: true,
                        json: async () => ({
                            success: false,
                            recommendations: [],
                            message: '추천 데이터 로드 실패'
                        })
                    };
                }
            }
            
            // 일반 GET 요청
            return ORIGINAL_FETCH(staticFile, options);
        }
        
        // localhost 아닌 경우 정상 처리
        return ORIGINAL_FETCH(url, options);
    };
    
    console.log('✅ fetch 오버라이드 완료');
    
    // 상태 표시
    setTimeout(() => {
        if (typeof showStatus === 'function') {
            showStatus('🌐 GitHub Pages 모드 활성화됨', 'info');
        }
    }, 1000);
    
})();

console.log('📋 GitHub Pages 즉시 설정 스크립트 로딩 완료'); 