"""
한미약품 제품군 특화 의료 품목 분류 시스템
Hanmi Pharmaceutical Product Classification System

주요 기능:
1. 한미약품 주력 제품 우선 인식 및 분류
2. 아모잘탄패밀리, 로수젯, 팔팔정 등 특화 추천
3. 질환별 세분화된 영업 전략 제공
4. 실제 영업 데이터 기반 맞춤 추천
"""

import pandas as pd
import numpy as np
import re
from datetime import datetime
import os
import sys

class HanmiProductClassifier:
    def __init__(self):
        self.data = None
        self.classified_products = None
        self.hanmi_product_map = self._initialize_hanmi_products()
        self.disease_categories = self._initialize_disease_categories()
        self.keyword_patterns = self._initialize_keyword_patterns()
        
    def _initialize_hanmi_products(self):
        """한미약품 주력 제품 매핑"""
        return {
            # 아모잘탄 패밀리
            '아모잘탄': {'category': '고혈압', 'subcategory': '한미-아모잘탄패밀리', 'priority': 10},
            '아모잘탄정': {'category': '고혈압', 'subcategory': '한미-아모잘탄패밀리', 'priority': 10},
            '아모잘탄플러스': {'category': '고혈압', 'subcategory': '한미-아모잘탄패밀리', 'priority': 10},
            '아모잘탄큐': {'category': '고혈압', 'subcategory': '한미-아모잘탄패밀리', 'priority': 10},
            '아모잘탄엑스큐': {'category': '고혈압', 'subcategory': '한미-아모잘탄패밀리', 'priority': 10},
            
            # 로수젯
            '로수젯': {'category': '이상지질혈증', 'subcategory': '한미-로수젯', 'priority': 10},
            '로수젯정': {'category': '이상지질혈증', 'subcategory': '한미-로수젯', 'priority': 10},
            
            # 팔팔정
            '팔팔정': {'category': '피부/비뇨', 'subcategory': '한미-팔팔정', 'priority': 10},
            '팔팔': {'category': '피부/비뇨', 'subcategory': '한미-팔팔정', 'priority': 10},
            
            # 한미탐스
            '한미탐스': {'category': '피부/비뇨', 'subcategory': '한미-한미탐스', 'priority': 10},
            '한미탐스캡슐': {'category': '피부/비뇨', 'subcategory': '한미-한미탐스', 'priority': 10},
            
            # 기타 한미약품 제품
            '에소메졸': {'category': '소화기', 'subcategory': '한미-에소메졸', 'priority': 10},
            '피도글': {'category': '혈전/순환기', 'subcategory': '한미-피도글', 'priority': 10},
            '피도글정': {'category': '혈전/순환기', 'subcategory': '한미-피도글', 'priority': 10},
            '마미아이': {'category': '소화기', 'subcategory': '한미-정장제', 'priority': 10},
            '매창안': {'category': '소화기', 'subcategory': '한미-정장제', 'priority': 10},
            '이탄징': {'category': '호흡기', 'subcategory': '한미-감기약', 'priority': 10},
            '모테손플러스': {'category': '호흡기', 'subcategory': '한미-비염치료제', 'priority': 10},
            '모테손플러스나잘스프레이': {'category': '호흡기', 'subcategory': '한미-비염치료제', 'priority': 10},
            '세포독심': {'category': '감염', 'subcategory': '한미-항생제', 'priority': 10},
            '세포독심건조시럽': {'category': '감염', 'subcategory': '한미-항생제', 'priority': 10},
            '졸피드': {'category': '정신과/신경과', 'subcategory': '한미-수면제', 'priority': 10},
            '졸피드정': {'category': '정신과/신경과', 'subcategory': '한미-수면제', 'priority': 10},
            '히알루미니': {'category': '안과', 'subcategory': '한미-인공눈물', 'priority': 10},
            '히알루미니점안액': {'category': '안과', 'subcategory': '한미-인공눈물', 'priority': 10}
        }
    
    def _initialize_disease_categories(self):
        """질환별 카테고리 정의"""
        return {
            '고혈압': {
                'category_code': 'HT',
                'description': '고혈압 및 심혈관계 질환',
                'hanmi_flagship': ['아모잘탄패밀리']
            },
            '이상지질혈증': {
                'category_code': 'DL',
                'description': '이상지질혈증 및 콜레스테롤',
                'hanmi_flagship': ['로수젯']
            },
            '피부/비뇨': {
                'category_code': 'DERM_URO',
                'description': '피부과 및 비뇨기과',
                'hanmi_flagship': ['팔팔정', '한미탐스']
            },
            '소화기': {
                'category_code': 'GI',
                'description': '소화기계 질환',
                'hanmi_flagship': ['에소메졸', '마미아이', '매창안']
            },
            '호흡기': {
                'category_code': 'RESP',
                'description': '호흡기계 질환',
                'hanmi_flagship': ['모테손플러스', '이탄징']
            },
            '안과': {
                'category_code': 'OPHTH',
                'description': '안과 질환',
                'hanmi_flagship': ['히알루미니']
            },
            '정신과/신경과': {
                'category_code': 'NEURO_PSYC',
                'description': '정신과 및 신경과',
                'hanmi_flagship': ['졸피드']
            },
            '감염': {
                'category_code': 'INFECT',
                'description': '감염성 질환',
                'hanmi_flagship': ['세포독심']
            },
            '혈전/순환기': {
                'category_code': 'CARDIO',
                'description': '혈전 및 순환기계',
                'hanmi_flagship': ['피도글']
            },
            '당뇨': {
                'category_code': 'DM', 
                'description': '당뇨병 및 혈당조절',
                'hanmi_flagship': []
            },
            '기타': {
                'category_code': 'ETC',
                'description': '기타 의약품',
                'hanmi_flagship': []
            }
        }
    
    def _initialize_keyword_patterns(self):
        """키워드 패턴 정의 (한미약품 제품 최우선)"""
        return {
            '고혈압': {
                'hanmi_exact': ['아모잘탄', '아모잘탄정', '아모잘탄플러스', '아모잘탄큐', '아모잘탄엑스큐'],
                'exact_matches': [
                    '로사르탄', '발사르탄', '칸데사르탄', '텔미사르탄', '올메사르탄',
                    '암로디핀', '니페디핀', '딜티아젬', '베라파밀',
                    '에날라프릴', '리시노프릴', '캅토프릴',
                    '아테놀롤', '프로프라놀롤', '메토프롤롤',
                    '히드로클로로티아지드', '푸로세미드', '클로르탈리돈'
                ],
                'keywords': ['혈압', '고혈압', '심혈관', '강압']
            },
            '이상지질혈증': {
                'hanmi_exact': ['로수젯', '로수젯정'],
                'exact_matches': [
                    '아토르바스타틴', '로수바스타틴', '심바스타틴',
                    '에제티미브', '제티아', '페노피브레이트'
                ],
                'keywords': ['콜레스테롤', '지질', '고지혈증']
            },
            '피부/비뇨': {
                'hanmi_exact': ['팔팔정', '팔팔', '한미탐스', '한미탐스캡슐'],
                'exact_matches': [
                    '탐스로신', '독사조신', '실데나필', '타다라필',
                    '테르비나핀', '베타메타손'
                ],
                'keywords': ['전립선', '발기부전', '비뇨기', '피부']
            },
            '소화기': {
                'hanmi_exact': ['에소메졸', '마미아이', '매창안'],
                'exact_matches': [
                    '오메프라졸', '란소프라졸', '에소메프라졸',
                    '라니티딘', '파모티딘', '비오플'
                ],
                'keywords': ['위', '소화', '역류성식도염', '정장제']
            },
            '호흡기': {
                'hanmi_exact': ['모테손플러스', '모테손플러스나잘스프레이', '이탄징'],
                'exact_matches': [
                    '살부타몰', '세티리진', '모메타손', '부데소니드'
                ],
                'keywords': ['천식', '비염', '기침', '알레르기', '감기']
            },
            '안과': {
                'hanmi_exact': ['히알루미니', '히알루미니점안액'],
                'exact_matches': [
                    '라타노프로스트', '브리모니딘', '히알루론산'
                ],
                'keywords': ['안약', '점안', '녹내장', '인공눈물']
            },
            '정신과/신경과': {
                'hanmi_exact': ['졸피드', '졸피드정'],
                'exact_matches': [
                    '졸피뎀', '세르트랄린', '알프라졸람'
                ],
                'keywords': ['수면', '우울', '불안', '정신']
            },
            '감염': {
                'hanmi_exact': ['세포독심', '세포독심건조시럽'],
                'exact_matches': [
                    '아목시실린', '세팔렉신', '아지스로마이신'
                ],
                'keywords': ['항생제', '감염', '세균']
            },
            '혈전/순환기': {
                'hanmi_exact': ['피도글', '피도글정'],
                'exact_matches': [
                    '클로피도그렐', '와파린', '아스피린'
                ],
                'keywords': ['혈전', '항응고', '순환기']
            }
        }
    
    def load_data(self, csv_file_path):
        """데이터 로드"""
        try:
            # 여러 인코딩 시도
            encodings = ['utf-8', 'cp949', 'euc-kr']
            for encoding in encodings:
                try:
                    self.data = pd.read_csv(csv_file_path, encoding=encoding)
                    print(f"데이터 로드 완료 (인코딩: {encoding}): {len(self.data):,}개 레코드")
                    return True
                except UnicodeDecodeError:
                    continue
            
            print("지원되는 인코딩으로 파일을 읽을 수 없습니다.")
            return False
            
        except Exception as e:
            print(f"데이터 로드 실패: {e}")
            return False
    
    def classify_product(self, product_name, product_group=None):
        """제품 분류 (한미약품 제품 우선)"""
        if pd.isna(product_name):
            product_name = ''
        
        product_text = str(product_name).lower()
        if product_group and not pd.isna(product_group):
            product_text += " " + str(product_group).lower()
        
        # 1. 한미약품 제품 직접 매칭 (최우선)
        for hanmi_product, info in self.hanmi_product_map.items():
            if hanmi_product.lower() in product_text:
                return info['category'], info['subcategory'], 1.0
        
        # 2. 질환별 패턴 매칭
        best_match = {'category': '기타', 'subcategory': '미분류', 'score': 0.0}
        
        for disease, patterns in self.keyword_patterns.items():
            score = 0.0
            
            # 한미약품 제품 매칭 (높은 점수)
            for hanmi_product in patterns.get('hanmi_exact', []):
                if hanmi_product.lower() in product_text:
                    score += 15.0
            
            # 일반 정확 매칭
            for exact_match in patterns.get('exact_matches', []):
                if exact_match.lower() in product_text:
                    score += 8.0
            
            # 키워드 매칭
            for keyword in patterns.get('keywords', []):
                if keyword.lower() in product_text:
                    score += 3.0
            
            if score > best_match['score']:
                best_match = {
                    'category': disease,
                    'subcategory': '일반',
                    'score': score
                }
        
        confidence = min(best_match['score'] / 15.0, 1.0)
        return best_match['category'], best_match['subcategory'], confidence
    
    def classify_all_products(self):
        """모든 제품 분류"""
        if self.data is None:
            print("데이터를 먼저 로드해주세요.")
            return None
        
        print("한미약품 특화 제품 분류 시작...")
        
        # 고유 제품 추출
        unique_products = self.data[['품목군', '품목명']].drop_duplicates()
        
        results = []
        hanmi_detected = 0
        
        for idx, row in unique_products.iterrows():
            product_group = row['품목군']
            product_name = row.get('품목명', '')
            
            category, subcategory, confidence = self.classify_product(product_name, product_group)
            
            is_hanmi = subcategory.startswith('한미-')
            if is_hanmi:
                hanmi_detected += 1
            
            results.append({
                '품목군': product_group,
                '품목명': product_name,
                '질환분류': category,
                '세부분류': subcategory,
                '신뢰도': round(confidence, 3),
                '한미약품여부': is_hanmi,
                '분류코드': self.disease_categories[category]['category_code']
            })
            
            if (idx + 1) % 50 == 0:
                print(f"진행: {idx + 1:,}/{len(unique_products):,} (한미약품 제품: {hanmi_detected}개)")
        
        self.classified_products = pd.DataFrame(results)
        print(f"분류 완료: 총 {len(results):,}개 제품 (한미약품: {hanmi_detected}개)")
        
        return self.classified_products
    
    def generate_hanmi_sales_analysis(self):
        """한미약품 제품 매출 분석"""
        if self.data is None or self.classified_products is None:
            return None
        
        # 분류 결과와 원본 데이터 병합
        merged_data = pd.merge(
            self.data,
            self.classified_products[['품목군', '질환분류', '세부분류', '한미약품여부']],
            on='품목군',
            how='left'
        )
        
        # 한미약품 제품 분석
        hanmi_data = merged_data[merged_data['한미약품여부'] == True]
        
        if len(hanmi_data) == 0:
            print("한미약품 제품이 감지되지 않았습니다.")
            return None
        
        analysis = {
            '한미약품_총매출': hanmi_data['총매출'].sum(),
            '한미약품_거래처수': hanmi_data['거래처코드'].nunique(),
            '한미약품_제품수': hanmi_data['품목군'].nunique(),
            '전체매출대비비중': hanmi_data['총매출'].sum() / merged_data['총매출'].sum() * 100
        }
        
        # 제품별 상세 분석
        product_analysis = hanmi_data.groupby('세부분류').agg({
            '총매출': 'sum',
            '거래처코드': 'nunique',
            '품목군': 'nunique'
        }).sort_values('총매출', ascending=False)
        
        print(f"\n🚀 한미약품 제품 성과 분석")
        print(f"총 매출: {analysis['한미약품_총매출']/100000000:.1f}억원")
        print(f"거래처 수: {analysis['한미약품_거래처수']:,}개")
        print(f"전체 대비 비중: {analysis['전체매출대비비중']:.1f}%")
        
        print(f"\n주요 제품별 성과:")
        for product, data in product_analysis.head(5).iterrows():
            print(f"• {product}: {data['총매출']/100000000:.1f}억원 ({data['거래처코드']}개 거래처)")
        
        return analysis, product_analysis
    
    def export_hanmi_results(self, output_path='한미약품_품목분류_결과.xlsx'):
        """한미약품 특화 결과 내보내기"""
        try:
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                # 분류 결과
                if self.classified_products is not None:
                    self.classified_products.to_excel(writer, sheet_name='전체품목분류', index=False)
                    
                    # 한미약품 제품만 별도
                    hanmi_products = self.classified_products[
                        self.classified_products['한미약품여부'] == True
                    ]
                    hanmi_products.to_excel(writer, sheet_name='한미약품제품', index=False)
                
                # 원본 데이터 + 분류
                if self.data is not None and self.classified_products is not None:
                    merged = pd.merge(
                        self.data,
                        self.classified_products[['품목군', '질환분류', '세부분류', '한미약품여부']],
                        on='품목군',
                        how='left'
                    )
                    merged.to_excel(writer, sheet_name='전체데이터_분류포함', index=False)
                
                # 한미약품 제품 매핑표
                hanmi_map_df = pd.DataFrame([
                    {
                        '제품명': product,
                        '질환분류': info['category'],
                        '세부분류': info['subcategory'],
                        '우선순위': info['priority']
                    }
                    for product, info in self.hanmi_product_map.items()
                ])
                hanmi_map_df.to_excel(writer, sheet_name='한미약품제품매핑', index=False)
            
            print(f"결과 저장 완료: {output_path}")
            return True
            
        except Exception as e:
            print(f"파일 저장 실패: {e}")
            return False

def main():
    print("="*60)
    print("    한미약품 특화 의료 품목 분류 시스템")
    print("="*60)
    
    classifier = HanmiProductClassifier()
    
    # CSV 파일 찾기
    possible_files = ['rx-rawdata.csv', 'rxrawdata.csv', 'sales_data.csv']
    csv_file = None
    
    for filename in possible_files:
        if os.path.exists(filename):
            csv_file = filename
            break
    
    if not csv_file:
        print("❌ CSV 파일을 찾을 수 없습니다.")
        print("다음 파일명 중 하나로 저장해주세요:")
        for filename in possible_files:
            print(f"  - {filename}")
        return
    
    print(f"📁 데이터 파일: {csv_file}")
    
    # 데이터 로드
    if not classifier.load_data(csv_file):
        print("❌ 데이터 로드에 실패했습니다.")
        return
    
    # 제품 분류
    print("\n🔍 제품 분류 수행 중...")
    classified_products = classifier.classify_all_products()
    
    if classified_products is None:
        print("❌ 제품 분류에 실패했습니다.")
        return
    
    # 한미약품 제품 분석
    print("\n📊 한미약품 제품 매출 분석 중...")
    analysis_result = classifier.generate_hanmi_sales_analysis()
    
    # 결과 내보내기
    print("\n💾 결과 파일 저장 중...")
    if classifier.export_hanmi_results():
        print("\n✅ 모든 작업이 완료되었습니다!")
        print("\n📋 생성된 파일 내용:")
        print("  • 전체품목분류: 모든 제품의 질환별 분류")
        print("  • 한미약품제품: 한미약품 제품만 별도 정리")
        print("  • 전체데이터_분류포함: 원본 데이터 + 분류 정보")
        print("  • 한미약품제품매핑: 한미약품 제품 인식 규칙")
        
        # 요약 정보
        hanmi_count = len(classified_products[classified_products['한미약품여부'] == True])
        total_count = len(classified_products)
        
        print(f"\n📈 분류 결과 요약:")
        print(f"  • 전체 제품: {total_count:,}개")
        print(f"  • 한미약품 제품: {hanmi_count:,}개")
        print(f"  • 한미약품 비중: {hanmi_count/total_count*100:.1f}%")
        
        print(f"\n🎯 한미약품 주력 제품군:")
        for category, info in classifier.disease_categories.items():
            if info['hanmi_flagship']:
                products = ', '.join(info['hanmi_flagship'])
                print(f"  • {category}: {products}")
    
    else:
        print("❌ 결과 저장에 실패했습니다.")

if __name__ == "__main__":
    main()
