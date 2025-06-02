#!/usr/bin/env python3
"""
SalesAI 로컬 개발 서버
기존 JSON 데이터를 활용한 웹 애플리케이션 테스트
"""

import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs
import mimetypes

PORT = 8000

class SalesAIRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def do_GET(self):
        """GET 요청 처리"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
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
                mime_type, _ = mimetypes.guess_type(path[1:])
                if mime_type:
                    self.send_response(200)
                    self.send_header('Content-type', mime_type)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    with open(path[1:], 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    super().do_GET()
            except FileNotFoundError:
                self.send_error(404, "파일을 찾을 수 없습니다.")
    
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
                        '/api/summary'
                    ]
                })
            else:
                self.send_error(404, "API 엔드포인트를 찾을 수 없습니다.")
        except Exception as e:
            self.send_error(500, f"서버 오류: {str(e)}")
    
    def serve_json_file(self, filename):
        """JSON 파일을 읽어서 응답으로 전송"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.send_json_response(data)
        except FileNotFoundError:
            self.send_error(404, f"{filename} 파일을 찾을 수 없습니다.")
        except json.JSONDecodeError:
            self.send_error(500, f"{filename} 파일의 JSON 형식이 올바르지 않습니다.")
    
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
    
    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """로그 메시지 출력"""
        print(f"[{self.date_time_string()}] {format % args}")

def main():
    """메인 함수"""
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
    print("━" * 50)
    print("⚡ 서버를 중지하려면 Ctrl+C를 누르세요.")
    print()
    
    try:
        with socketserver.TCPServer(("", PORT), SalesAIRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 서버를 중지합니다...")
    except Exception as e:
        print(f"❌ 서버 오류: {e}")

if __name__ == '__main__':
    main() 