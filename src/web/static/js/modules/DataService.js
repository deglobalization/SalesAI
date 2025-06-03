/**
 * 데이터 서비스 모듈
 * API 호출 및 데이터 관리를 담당
 */

class DataService {
    constructor() {
        this.baseURL = '/api/v1';
        this.cache = new Map();
    }

    /**
     * CSV 파일을 읽어서 JSON 형태로 변환
     */
    async parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csvText = e.target.result;
                    const data = this.parseCSV(csvText);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'utf-8');
        });
    }

    /**
     * CSV 텍스트를 파싱하여 객체 배열로 변환
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCSVLine(line);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        return data;
    }

    /**
     * CSV 라인을 파싱 (쉼표로 구분된 값 처리)
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/"/g, ''));
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim().replace(/"/g, ''));
        return result;
    }

    /**
     * 고객 세분화 분석 API 호출
     */
    async performCustomerSegmentation(data) {
        try {
            const response = await fetch(`${this.baseURL}/analysis/customer-segmentation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ csv_data: data })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('고객 세분화 분석 오류:', error);
            throw error;
        }
    }

    /**
     * 스마트 타겟팅 분석 API 호출
     */
    async performSmartTargeting(product, options = {}) {
        try {
            const requestData = {
                product: product,
                top_n: options.topN || 10,
                csv_file: options.csvFile || 'rx-rawdata.csv',
                sample_size: options.sampleSize
            };

            const response = await fetch(`${this.baseURL}/analysis/smart-targeting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('스마트 타겟팅 분석 오류:', error);
            throw error;
        }
    }

    /**
     * 담당자별 추천 결과 조회
     */
    async getManagerRecommendations(managerName) {
        const cacheKey = `manager_${managerName}`;
        
        // 캐시 확인
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${this.baseURL}/analysis/manager/${managerName}/recommendations`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // 성공한 경우에만 캐시에 저장
            if (result.status === 'success') {
                this.cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error('담당자 추천 조회 오류:', error);
            throw error;
        }
    }

    /**
     * 사전 생성된 추천 데이터 로드
     */
    async loadPreloadedRecommendations() {
        const cacheKey = 'preloaded_recommendations';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch('/recommendations_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('사전 생성된 추천 데이터 로드 오류:', error);
            throw error;
        }
    }

    /**
     * 담당자별 사전 생성된 데이터 로드
     */
    async loadManagerRecommendationsData() {
        const cacheKey = 'manager_recommendations_data';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch('/manager_recommendations_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('담당자별 추천 데이터 로드 오류:', error);
            throw error;
        }
    }

    /**
     * 캐시 클리어
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 특정 키의 캐시 삭제
     */
    removeCacheItem(key) {
        this.cache.delete(key);
    }
}

// 전역 인스턴스 생성
window.dataService = new DataService();

export default DataService; 