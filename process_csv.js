// CSV 데이터 처리 함수
function processCSVData(csvText, fileObj) {
    console.log(`Processing CSV data for file: ${fileObj.name}`);
    
    try {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        console.log(`Processed ${data.length} rows of data`);
        
        // 데이터 분석 및 표시
        if (data.length > 0) {
            const managerName = fileObj.name.replace('manager_', '').replace('.csv', '').replace(/%20/g, ' ');
            if (typeof showCustomerData === 'function') {
                showCustomerData(data, managerName);
            }
            if (typeof calculateSummaryStats === 'function') {
                calculateSummaryStats(data);
            }
            if (typeof showStatus === 'function') {
                showStatus(`${managerName} 담당자의 데이터 로드가 완료되었습니다. (${data.length}개 거래처)`, 'success');
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('CSV 데이터 처리 오류:', error);
        if (typeof showStatus === 'function') {
            showStatus('CSV 데이터 처리 중 오류가 발생했습니다.', 'error');
        }
        return [];
    }
}

// 전역으로 노출
window.processCSVData = processCSVData; 