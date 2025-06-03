#!/usr/bin/env python3
"""
SalesAI 로컬 개발 서버
기존 JSON 데이터를 활용한 웹 애플리케이션 테스트
"""

import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs, unquote
import mimetypes
import socket

PORT = 8080

def find_available_port(start_port=8080, max_port=8150):
    """사용 가능한 포트를 찾습니다."""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    raise OSError(f"포트 {start_port}-{max_port} 범위에서 사용 가능한 포트를 찾을 수 없습니다.")

class SalesAIRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def do_GET(self):
        """GET 요청 처리"""
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path, encoding='utf-8')  # URL 디코딩 추가
        
        # API 엔드포인트 처리
        if path.startswith('/api/'):
            self.handle_api_request(path, parsed_path.query)
        else:
            # 정적 파일 서빙
            if path == '/':
                path = '/index.html'
            elif path == '/advisor':
                path = '/advisor.html'
            
            try:
                # 파일 확장자에 따른 MIME 타입 설정
                file_path = path[1:]  # 맨 앞 '/' 제거
                mime_type, _ = mimetypes.guess_type(file_path)
                
                if os.path.exists(file_path):
                    self.send_response(200)
                    if mime_type:
                        self.send_header('Content-type', mime_type)
                    else:
                        self.send_header('Content-type', 'application/octet-stream')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    with open(file_path, 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    self.send_error(404, "File not found")  # 영어 메시지로 변경
            except Exception as e:
                self.send_error(500, f"Server error: {str(e)}")
    
    def do_POST(self):
        """POST 요청 처리"""
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path, encoding='utf-8')
        
        if path == '/api/recommend':
            self.handle_recommendation_request()
        else:
            self.send_error(404, "API endpoint not found")
    
    def handle_recommendation_request(self):
        """AI 추천 요청 처리"""
        try:
            # 요청 본문 읽기
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            product_group = request_data.get('product_group', '')
            top_n = request_data.get('top_n', 20)
            
            # recommendations_data.json에서 실제 데이터 로드
            try:
                with open('recommendations_data.json', 'r', encoding='utf-8') as f:
                    recommendations_data = json.load(f)
                
                # 요청한 product_group에 대한 추천 데이터 찾기
                if product_group in recommendations_data.get('recommendations', {}):
                    raw_recommendations = recommendations_data['recommendations'][product_group]
                    
                    # 상위 top_n개 추천만 선택
                    selected_recommendations = raw_recommendations[:min(top_n, len(raw_recommendations))]
                    
                    # advisor.html 형식에 맞게 변환
                    formatted_recommendations = []
                    for rec in selected_recommendations:
                        # strategies를 객체 배열로 구성
                        strategies = []
                        confidence_value = rec.get('성공확률', 75)
                        expected_sales = rec.get('예상매출', 0) // 10000  # 만원 단위로 변환
                        
                        # 주요 전략들을 객체로 구성
                        main_strategy = {
                            'title': f"🎯 {product_group} 집중 마케팅",
                            'description': f"타겟 고객: {rec.get('거래처명', '고객명 없음')}",
                            'confidence': confidence_value / 100,  # 0-1 사이 값으로 변환
                            'expectedSales': expected_sales,
                            'timeline': '즉시',
                            'priority': 'high' if confidence_value > 80 else 'medium',
                            'explanation': rec.get('추천이유', '개별 맞춤 전략 수립')
                        }
                        strategies.append(main_strategy)
                        
                        # 추가 전략 생성
                        if rec.get('진료과'):
                            specialty_strategy = {
                                'title': f"🏥 {rec.get('진료과')} 특화 접근",
                                'description': f"진료과별 맞춤 마케팅 전략",
                                'confidence': confidence_value / 100,
                                'expectedSales': expected_sales // 2,
                                'timeline': '1-2주',
                                'priority': 'medium',
                                'specialty_match': rec.get('유사도점수', 0) * 10
                            }
                            strategies.append(specialty_strategy)
                        
                        formatted_recommendations.append({
                            'customer': {
                                'accountName': rec.get('거래처명', '고객명 없음'),
                                'specialty': rec.get('진료과', '정보 없음'),
                                'facilityType': rec.get('시설유형', '일반'),
                                'scale': rec.get('거래처규모', 'Small'),
                                'accountCode': rec.get('거래처코드', 'N/A'),
                                'manager': '미배정'
                            },
                            'analysis': f"""
📊 **추천 분석 결과**
• 성공 확률: {rec.get('성공확률', 0):.1f}%
• 예상 매출: {rec.get('예상매출', 0):,}원
• 진료과: {rec.get('진료과', '정보 없음')}
• 거래처 규모: {rec.get('거래처규모', '정보 없음')}
• 유사도 점수: {rec.get('유사도점수', 0):.2f}
                            """.strip(),
                            'strategies': strategies,
                            'confidence': int(rec.get('성공확률', 75))
                        })
                    
                    response_data = {
                        'recommendations': formatted_recommendations,
                        'product_group': product_group,
                        'total_recommendations': len(formatted_recommendations),
                        'data_source': 'SmartSalesTargetingEngine',
                        'generated_at': recommendations_data.get('generated_at', ''),
                        'engine_version': recommendations_data.get('engine_version', '')
                    }
                    
                else:
                    # 해당 제품에 대한 추천이 없는 경우
                    response_data = {
                        'recommendations': [],
                        'product_group': product_group,
                        'total_recommendations': 0,
                        'error': f'{product_group}에 대한 추천 데이터가 없습니다.',
                        'available_products': list(recommendations_data.get('recommendations', {}).keys())[:10]
                    }
                
            except FileNotFoundError:
                # recommendations_data.json 파일이 없는 경우 기본 더미 응답
                recommendations = []
                for i in range(min(top_n, 5)):
                    recommendations.append({
                        'customer': f'고객{i+1}',
                        'analysis': f'{product_group}에 대한 AI 분석 결과입니다.',
                        'strategies': [
                            f'{product_group} 관련 제품 제안',
                            '고객 관계 강화',
                            '매출 증대 전략'
                        ],
                        'confidence': 85 + (i * 2)
                    })
                
                response_data = {
                    'recommendations': recommendations,
                    'product_group': product_group,
                    'total_recommendations': len(recommendations),
                    'data_source': 'fallback_dummy_data'
                }
            
            self.send_json_response(response_data)
            
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON data")
        except Exception as e:
            self.send_error(500, f"Recommendation error: {str(e)}")
    
    def handle_api_request(self, path, query):
        """API 요청 처리"""
        try:
            if path == '/api/managers':
                self.serve_json_file('manager_list.json')
            elif path == '/api/recommendations':
                self.serve_json_file('recommendations_data.json')
            elif path == '/api/manager-recommendations':
                self.serve_json_file('manager_recommendations_data.json')
            elif path == '/api/products':
                self.serve_json_file('product_groups.json')
            elif path == '/api/manager-focus':
                self.serve_json_file('manager_focus_regions.json')
            elif path == '/api/summary':
                self.serve_json_file('total_managers_summary.json')
            elif path == '/api/health':
                self.send_json_response({
                    'status': 'healthy',
                    'message': 'SalesAI 로컬 서버가 정상 작동 중입니다.',
                    'version': '1.0.0',
                    'available_endpoints': [
                        '/api/managers',
                        '/api/recommendations', 
                        '/api/manager-recommendations',
                        '/api/products',
                        '/api/manager-focus',
                        '/api/summary',
                        'POST /api/recommend'
                    ]
                })
            else:
                self.send_error(404, "API endpoint not found")
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def serve_json_file(self, filename):
        """JSON 파일을 읽어서 응답으로 전송"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.send_json_response(data)
        except FileNotFoundError:
            self.send_error(404, f"{filename} file not found")
        except json.JSONDecodeError:
            self.send_error(500, f"{filename} file has invalid JSON format")
    
    def send_json_response(self, data):
        """JSON 응답 전송"""
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))
    
    def send_error(self, code, message=None):
        """에러 응답 전송 (UTF-8 지원)"""
        try:
            self.send_response(code)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if message is None:
                message = f"Error {code}"
            
            error_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Error {code}</title>
            </head>
            <body>
                <h1>Error {code}</h1>
                <p>{message}</p>
            </body>
            </html>
            """.encode('utf-8')
            
            self.wfile.write(error_html)
        except Exception:
            # 최종 대안으로 기본 에러 처리
            super().send_error(code, "Error occurred")
    
    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """로그 메시지 출력"""
        try:
            print(f"[{self.date_time_string()}] {format % args}")
        except UnicodeEncodeError:
            # 한글 로그 출력 실패시 기본 로그만 출력
            print(f"[{self.date_time_string()}] Request processed")

def main():
    """메인 함수"""
    global PORT
    
    # 사용 가능한 포트 찾기
    try:
        PORT = find_available_port(8080, 8130)
        print(f"🚀 SalesAI 로컬 서버 시작...")
        print(f"📁 현재 디렉토리: {os.getcwd()}")
        print(f"🌐 서버 주소: http://localhost:{PORT}")
        print(f"📄 메인 페이지: http://localhost:{PORT}/")
        print(f"👨‍💼 어드바이저: http://localhost:{PORT}/advisor")
        print(f"🔧 API 상태: http://localhost:{PORT}/api/health")
        print("━" * 50)
        
        # 기존 JSON 파일들 확인
        json_files = [
            'manager_list.json',
            'recommendations_data.json', 
            'manager_recommendations_data.json',
            'product_groups.json',
            'manager_focus_regions.json',
            'total_managers_summary.json'
        ]
        
        print("📋 사용 가능한 데이터 파일:")
        for file in json_files:
            if os.path.exists(file):
                file_size = os.path.getsize(file) / (1024 * 1024)  # MB
                print(f"  ✅ {file} ({file_size:.1f} MB)")
            else:
                print(f"  ❌ {file} (없음)")
        
        print("━" * 50)
        print("🔍 API 엔드포인트:")
        print("  GET /api/health - 서버 상태 확인")
        print("  GET /api/managers - 담당자 목록")
        print("  GET /api/recommendations - 추천 데이터")
        print("  GET /api/manager-recommendations - 담당자별 추천")
        print("  GET /api/products - 제품 그룹")
        print("  GET /api/manager-focus - 담당자 지역 포커스")
        print("  GET /api/summary - 전체 요약")
        print("  POST /api/recommend - AI 추천 생성")
        print("━" * 50)
        print("⚡ 서버를 중지하려면 Ctrl+C를 누르세요.")
        print()
        
        with socketserver.TCPServer(("", PORT), SalesAIRequestHandler) as httpd:
            httpd.serve_forever()
            
    except OSError as e:
        print(f"❌ 포트 오류: {e}")
        print("💡 다른 포트를 시도하거나 실행 중인 서버를 종료해주세요.")
    except KeyboardInterrupt:
        print(f"\n🛑 서버를 중지합니다... (포트 {PORT})")
    except Exception as e:
        print(f"❌ 서버 오류: {e}")

if __name__ == '__main__':
    main() 