"""
영업 활동 추천 모델 (Sales Recommendation Engine)
의료기기/의약품 영업팀을 위한 데이터 기반 영업 전략 추천 시스템

주요 기능:
1. 고객 세분화 (RFM 분석 기반)
2. 교차판매 기회 발굴
3. 이탈 위험 고객 조기 감지
4. 영업 우선순위 추천
5. 성장 기회 분석
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

class SalesRecommendationEngine:
    def __init__(self):
        self.data = None
        self.customer_segments = None
        self.product_analysis = None
        self.recommendations = []
        self.scaler = StandardScaler()
        
    def load_data(self, csv_file_path):
        """CSV 데이터 로드 및 전처리"""
        try:
            self.data = pd.read_csv(csv_file_path, encoding='utf-8')
            print(f"데이터 로드 완료: {len(self.data)}개 레코드")
            self._preprocess_data()
            return True
        except Exception as e:
            print(f"데이터 로드 실패: {e}")
            return False
    
    def _preprocess_data(self):
        """데이터 전처리"""
        # 기준년월을 datetime으로 변환
        self.data['기준년월_dt'] = pd.to_datetime(self.data['기준년월'].astype(str), format='%Y%m')
        
        # 숫자 컬럼 null 값 처리
        numeric_columns = ['총매출', '총수량', '원내매출', '원외매출', '단가']
        for col in numeric_columns:
            if col in self.data.columns:
                self.data[col] = pd.to_numeric(self.data[col], errors='coerce').fillna(0)
        
        # 유효한 거래만 필터링 (매출이 0보다 큰 경우)
        self.data = self.data[self.data['총매출'] > 0].copy()
        
        print(f"전처리 완료: {len(self.data)}개 유효 거래")
    
    def analyze_customers(self):
        """고객 분석 및 세분화 (RFM + 성장률 분석)"""
        
        # 거래처별 집계 분석
        customer_analysis = []
        
        for account_code in self.data['거래처코드'].unique():
            account_data = self.data[self.data['거래처코드'] == account_code]
            
            # 기본 정보
            account_name = account_data['거래처명'].iloc[0]
            manager = account_data['담당자'].iloc[0] if '담당자' in account_data.columns else '미지정'
            region = account_data['권역'].iloc[0] if '권역' in account_data.columns else '미지정'
            
            # 매출 지표
            total_sales = account_data['총매출'].sum()
            total_qty = account_data['총수량'].sum()
            transaction_count = len(account_data)
            product_count = account_data['품목군'].nunique()
            
            # 시간 기반 분석
            latest_date = account_data['기준년월_dt'].max()
            earliest_date = account_data['기준년월_dt'].min()
            active_months = account_data['기준년월'].nunique()
            
            # 최근성 분석 (Recency) - 최근 3개월 활동
            recent_cutoff = pd.Timestamp('2025-02-01')  # 기준점
            recent_data = account_data[account_data['기준년월_dt'] >= recent_cutoff]
            days_since_last_purchase = (recent_cutoff - latest_date).days
            
            # 빈도 분석 (Frequency) - 전체 기간 대비 활동 비율
            total_possible_months = 16  # 2024-01 ~ 2025-04
            frequency_score = active_months / total_possible_months
            
            # 금액 분석 (Monetary)
            avg_transaction_value = total_sales / transaction_count if transaction_count > 0 else 0
            
            # 성장률 분석
            recent_3months = account_data[account_data['기준년월'].isin([202502, 202503, 202504])]
            prev_3months = account_data[account_data['기준년월'].isin([202411, 202412, 202501])]
            
            recent_sales = recent_3months['총매출'].sum()
            prev_sales = prev_3months['총매출'].sum()
            growth_rate = ((recent_sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
            
            # 고객 상태 판단
            recency_score = 1 if days_since_last_purchase <= 90 else 0.5 if days_since_last_purchase <= 180 else 0
            frequency_score = min(frequency_score, 1.0)
            monetary_score = min(total_sales / 10000000, 1.0)  # 1천만원 기준으로 정규화
            
            # RFM 종합 점수
            rfm_score = (recency_score + frequency_score + monetary_score) / 3
            
            # 세그먼트 분류
            if recency_score >= 0.8 and frequency_score >= 0.6 and monetary_score >= 0.3:
                segment = 'Champions'  # 최우수 고객
                priority = 1
            elif recency_score >= 0.8 and frequency_score >= 0.4:
                segment = 'Loyal Customers'  # 충성 고객
                priority = 2
            elif recency_score >= 0.8 and monetary_score >= 0.2:
                segment = 'Potential Loyalists'  # 잠재 충성 고객
                priority = 3
            elif recency_score >= 0.8:
                segment = 'New Customers'  # 신규 고객
                priority = 4
            elif frequency_score >= 0.4 and monetary_score >= 0.2:
                segment = 'At Risk'  # 위험 고객
                priority = 2  # 높은 우선순위로 관리 필요
            elif frequency_score >= 0.3:
                segment = 'Cannot Lose Them'  # 놓칠 수 없는 고객
                priority = 3
            else:
                segment = 'Lost'  # 이탈 고객
                priority = 5
            
            customer_analysis.append({
                '거래처코드': account_code,
                '거래처명': account_name,
                '담당자': manager,
                '권역': region,
                '총매출': total_sales,
                '총수량': total_qty,
                '거래건수': transaction_count,
                '품목수': product_count,
                '활동월수': active_months,
                '최근구매일수': days_since_last_purchase,
                '최근3개월매출': recent_sales,
                '이전3개월매출': prev_sales,
                '성장률': round(growth_rate, 1),
                '월평균매출': round(total_sales / active_months, 0),
                '거래당평균': round(avg_transaction_value, 0),
                'Recency점수': round(recency_score, 2),
                'Frequency점수': round(frequency_score, 2),
                'Monetary점수': round(monetary_score, 2),
                'RFM점수': round(rfm_score, 2),
                '세그먼트': segment,
                '우선순위': priority
            })
        
        self.customer_segments = pd.DataFrame(customer_analysis)
        print(f"고객 분석 완료: {len(self.customer_segments)}개 거래처")
        
        return self.customer_segments
    
    def analyze_products(self):
        """품목 분석 및 교차판매 기회 발굴"""
        
        product_analysis = []
        
        for product in self.data['품목군'].unique():
            product_data = self.data[self.data['품목군'] == product]
            
            # 기본 지표
            total_sales = product_data['총매출'].sum()
            total_qty = product_data['총수량'].sum()
            customer_count = product_data['거래처코드'].nunique()
            avg_price = product_data['단가'].mean() if '단가' in product_data.columns else total_sales / total_qty
            
            # 성장률 분석
            recent_3months = product_data[product_data['기준년월'].isin([202502, 202503, 202504])]
            prev_3months = product_data[product_data['기준년월'].isin([202411, 202412, 202501])]
            
            recent_sales = recent_3months['총매출'].sum()
            prev_sales = prev_3months['총매출'].sum()
            growth_rate = ((recent_sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
            
            # 계절성 분석 (월별 변동계수)
            monthly_sales = product_data.groupby('기준년월')['총매출'].sum()
            seasonality = monthly_sales.std() / monthly_sales.mean() if monthly_sales.mean() > 0 else 0
            
            product_analysis.append({
                '품목군': product,
                '총매출': total_sales,
                '총수량': total_qty,
                '고객수': customer_count,
                '평균단가': round(avg_price, 0),
                '최근3개월매출': recent_sales,
                '성장률': round(growth_rate, 1),
                '계절성지수': round(seasonality, 2),
                '시장점유율': round(total_sales / self.data['총매출'].sum() * 100, 2)
            })
        
        self.product_analysis = pd.DataFrame(product_analysis).sort_values('총매출', ascending=False)
        print(f"품목 분석 완료: {len(self.product_analysis)}개 품목군")
        
        return self.product_analysis
    
    def find_cross_selling_opportunities(self):
        """교차판매 기회 발굴"""
        
        # 고객-품목 매트릭스 생성
        customer_product_matrix = self.data.pivot_table(
            index='거래처코드', 
            columns='품목군', 
            values='총매출', 
            aggfunc='sum', 
            fill_value=0
        )
        
        # 코사인 유사도로 고객 간 유사성 계산
        customer_similarity = cosine_similarity(customer_product_matrix)
        customer_similarity_df = pd.DataFrame(
            customer_similarity, 
            index=customer_product_matrix.index, 
            columns=customer_product_matrix.index
        )
        
        cross_sell_opportunities = []
        
        for customer_code in customer_product_matrix.index:
            # 해당 고객이 구매한 품목
            purchased_products = customer_product_matrix.loc[customer_code]
            purchased_products = purchased_products[purchased_products > 0].index.tolist()
            
            # 유사한 고객들 찾기 (상위 5명)
            similar_customers = customer_similarity_df[customer_code].sort_values(ascending=False)[1:6]
            
            # 유사 고객들이 구매했지만 해당 고객이 구매하지 않은 품목들
            recommended_products = set()
            for similar_customer in similar_customers.index:
                similar_purchased = customer_product_matrix.loc[similar_customer]
                similar_purchased = similar_purchased[similar_purchased > 0].index.tolist()
                
                for product in similar_purchased:
                    if product not in purchased_products:
                        recommended_products.add(product)
            
            if recommended_products:
                customer_name = self.data[self.data['거래처코드'] == customer_code]['거래처명'].iloc[0]
                cross_sell_opportunities.append({
                    '거래처코드': customer_code,
                    '거래처명': customer_name,
                    '현재품목수': len(purchased_products),
                    '추천품목': list(recommended_products)[:5],  # 상위 5개만
                    '추천품목수': len(list(recommended_products)[:5])
                })
        
        return pd.DataFrame(cross_sell_opportunities)
    
    def detect_churn_risk(self):
        """이탈 위험 고객 감지"""
        
        churn_risk_customers = []
        
        for _, customer in self.customer_segments.iterrows():
            risk_score = 0
            risk_factors = []
            
            # 위험 요소 1: 최근 구매일이 오래됨
            if customer['최근구매일수'] > 90:
                risk_score += 30
                risk_factors.append('최근 구매 없음 (90일 이상)')
            elif customer['최근구매일수'] > 60:
                risk_score += 15
                risk_factors.append('구매 간격 증가 (60일 이상)')
            
            # 위험 요소 2: 매출 감소
            if customer['성장률'] < -20:
                risk_score += 25
                risk_factors.append(f'매출 급감 ({customer["성장률"]}%)')
            elif customer['성장률'] < -10:
                risk_score += 15
                risk_factors.append(f'매출 감소 ({customer["성장률"]}%)')
            
            # 위험 요소 3: 활동 빈도 감소
            if customer['Frequency점수'] < 0.3:
                risk_score += 20
                risk_factors.append('활동 빈도 낮음')
            
            # 위험 요소 4: 품목 다양성 부족
            if customer['품목수'] <= 3 and customer['총매출'] > 5000000:  # 500만원 이상인데 품목이 3개 이하
                risk_score += 10
                risk_factors.append('품목 집중도 높음')
            
            # 위험 등급 결정
            if risk_score >= 50:
                risk_level = '높음'
            elif risk_score >= 30:
                risk_level = '중간'
            elif risk_score >= 15:
                risk_level = '낮음'
            else:
                risk_level = '안전'
            
            if risk_score >= 15:  # 위험도가 있는 고객만 포함
                churn_risk_customers.append({
                    '거래처코드': customer['거래처코드'],
                    '거래처명': customer['거래처명'],
                    '담당자': customer['담당자'],
                    '위험점수': risk_score,
                    '위험등급': risk_level,
                    '위험요소': ', '.join(risk_factors),
                    '총매출': customer['총매출'],
                    '최근3개월매출': customer['최근3개월매출'],
                    '성장률': customer['성장률']
                })
        
        return pd.DataFrame(churn_risk_customers).sort_values('위험점수', ascending=False)
    
    def generate_sales_recommendations(self):
        """종합 영업 추천 생성"""
        
        recommendations = []
        
        # 1. 고객 세그먼트별 추천
        segment_strategies = {
            'Champions': {
                '전략': 'VIP 관리 강화',
                '액션': ['전담 서비스 제공', '신제품 우선 소개', '특별 할인 혜택', '정기 방문 일정 수립']
            },
            'Loyal Customers': {
                '전략': '관계 심화',
                '액션': ['교차판매 기회 탐색', '로열티 프로그램 참여', '정기 소통 강화', '맞춤 솔루션 제안']
            },
            'Potential Loyalists': {
                '전략': '충성도 향상',
                '액션': ['추가 구매 유도', '서비스 품질 개선', '맞춤 상품 추천', '피드백 수집']
            },
            'New Customers': {
                '전략': '관계 구축',
                '액션': ['온보딩 프로그램 실행', '제품 교육 제공', '초기 할인 혜택', '정기 체크인']
            },
            'At Risk': {
                '전략': '재활성화',
                '액션': ['즉시 연락', '문제점 파악', '맞춤 솔루션 제공', '특별 오퍼 제안']
            },
            'Cannot Lose Them': {
                '전략': '관계 회복',
                '액션': ['고위급 미팅', '서비스 재검토', '맞춤 혜택 제공', '장기 계약 논의']
            },
            'Lost': {
                '전략': '재유치',
                '액션': ['win-back 캠페인', '경쟁사 분석', '가격 재검토', '새로운 가치 제안']
            }
        }
        
        for segment, strategy in segment_strategies.items():
            segment_customers = self.customer_segments[self.customer_segments['세그먼트'] == segment]
            if len(segment_customers) > 0:
                recommendations.append({
                    '추천유형': '세그먼트별 전략',
                    '대상': f'{segment} ({len(segment_customers)}개 거래처)',
                    '전략': strategy['전략'],
                    '구체적액션': strategy['액션'],
                    '우선순위': segment_customers['우선순위'].min(),
                    '예상효과': f'매출 {segment_customers["총매출"].sum():,.0f}원 영향'
                })
        
        # 2. 고성장 기회 품목 추천
        high_growth_products = self.product_analysis[self.product_analysis['성장률'] > 20].head(5)
        if len(high_growth_products) > 0:
            recommendations.append({
                '추천유형': '성장 품목 집중',
                '대상': f'{len(high_growth_products)}개 고성장 품목',
                '전략': '성장 모멘텀 활용',
                '구체적액션': [
                    '고성장 품목 재고 확보',
                    '관련 고객 우선 방문',
                    '경쟁사 대비 우위점 강조',
                    '번들 상품 제안'
                ],
                '우선순위': 1,
                '예상효과': f'성장률 평균 {high_growth_products["성장률"].mean():.1f}%'
            })
        
        # 3. 교차판매 기회
        cross_sell_opps = self.find_cross_selling_opportunities()
        top_cross_sell = cross_sell_opps.nlargest(10, '추천품목수')
        if len(top_cross_sell) > 0:
            recommendations.append({
                '추천유형': '교차판매 기회',
                '대상': f'{len(top_cross_sell)}개 우수 거래처',
                '전략': '품목 다각화',
                '구체적액션': [
                    '유사 고객 성공사례 공유',
                    '번들 할인 제안',
                    '샘플 제품 제공',
                    '단계적 도입 계획 수립'
                ],
                '우선순위': 2,
                '예상효과': f'평균 {top_cross_sell["추천품목수"].mean():.1f}개 품목 확장 가능'
            })
        
        # 4. 이탈 위험 고객 대응
        churn_risks = self.detect_churn_risk()
        high_risk_customers = churn_risks[churn_risks['위험등급'].isin(['높음', '중간'])]
        if len(high_risk_customers) > 0:
            recommendations.append({
                '추천유형': '위험 고객 관리',
                '대상': f'{len(high_risk_customers)}개 위험 거래처',
                '전략': '이탈 방지',
                '구체적액션': [
                    '즉시 고객 접촉',
                    '불만사항 청취',
                    '맞춤 솔루션 제안',
                    '관계 복원 노력'
                ],
                '우선순위': 1,
                '예상효과': f'매출 {high_risk_customers["총매출"].sum():,.0f}원 보호'
            })
        
        self.recommendations = pd.DataFrame(recommendations).sort_values('우선순위')
        return self.recommendations
    
    def generate_monthly_action_plan(self, target_month=None):
        """월별 액션 플랜 생성"""
        
        if target_month is None:
            target_month = datetime.now().strftime('%Y년 %m월')
        
        action_plan = {
            '목표월': target_month,
            '주요목표': [],
            '우선액션': [],
            '이차액션': [],
            '장기액션': []
        }
        
        # 우선순위별 액션 분류
        for _, rec in self.recommendations.iterrows():
            action_item = {
                '제목': rec['추천유형'],
                '대상': rec['대상'],
                '액션': rec['구체적액션'][:2] if isinstance(rec['구체적액션'], list) else [rec['구체적액션']],
                '예상효과': rec['예상효과']
            }
            
            if rec['우선순위'] == 1:
                action_plan['우선액션'].append(action_item)
            elif rec['우선순위'] == 2:
                action_plan['이차액션'].append(action_item)
            else:
                action_plan['장기액션'].append(action_item)
        
        # 주요 목표 설정
        total_sales = self.customer_segments['총매출'].sum()
        high_priority_sales = self.customer_segments[
            self.customer_segments['우선순위'] <= 2
        ]['총매출'].sum()
        
        action_plan['주요목표'] = [
            f'위험 고객 이탈 방지 (매출 영향: {high_priority_sales:,.0f}원)',
            f'교차판매를 통한 거래당 평균 매출 10% 증대',
            f'신규 고객 관계 구축 및 재구매율 향상',
            f'성장 품목 집중 공략으로 전체 성장률 개선'
        ]
        
        return action_plan
    
    def export_analysis_report(self, output_path='sales_analysis_report.xlsx'):
        """분석 결과를 Excel 파일로 내보내기"""
        
        try:
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                # 고객 세분화 결과
                self.customer_segments.to_excel(writer, sheet_name='고객세분화', index=False)
                
                # 품목 분석 결과
                self.product_analysis.to_excel(writer, sheet_name='품목분석', index=False)
                
                # 교차판매 기회
                cross_sell = self.find_cross_selling_opportunities()
                cross_sell.to_excel(writer, sheet_name='교차판매기회', index=False)
                
                # 이탈 위험 고객
                churn_risk = self.detect_churn_risk()
                churn_risk.to_excel(writer, sheet_name='이탈위험고객', index=False)
                
                # 추천사항
                self.recommendations.to_excel(writer, sheet_name='영업추천', index=False)
                
                # 월별 액션 플랜
                action_plan = self.generate_monthly_action_plan()
                action_df = pd.DataFrame([action_plan])
                action_df.to_excel(writer, sheet_name='액션플랜', index=False)
            
            print(f"분석 보고서가 '{output_path}'에 저장되었습니다.")
            return True
            
        except Exception as e:
            print(f"보고서 저장 실패: {e}")
            return False
    
    def print_summary_report(self):
        """요약 보고서 출력"""
        
        print("\n" + "="*60)
        print("           영업 활동 추천 분석 보고서")
        print("="*60)
        
        # 전체 현황
        total_customers = len(self.customer_segments)
        total_sales = self.customer_segments['총매출'].sum()
        avg_growth = self.customer_segments['성장률'].mean()
        
        print(f"\n📊 전체 현황")
        print(f"   • 총 거래처 수: {total_customers:,}개")
        print(f"   • 총 매출액: {total_sales:,.0f}원 ({total_sales/100000000:.1f}억원)")
        print(f"   • 평균 성장률: {avg_growth:.1f}%")
        
        # 고객 세분화 현황
        print(f"\n🎯 고객 세분화 현황")
        segment_summary = self.customer_segments.groupby('세그먼트').agg({
            '거래처코드': 'count',
            '총매출': 'sum',
            '성장률': 'mean'
        }).round(1)
        
        for segment, data in segment_summary.iterrows():
            sales_ratio = data['총매출'] / total_sales * 100
            print(f"   • {segment}: {data['거래처코드']}개 "
                  f"(매출비중 {sales_ratio:.1f}%, 성장률 {data['성장률']:.1f}%)")
        
        # 상위 추천사항
        print(f"\n💡 주요 추천사항 (상위 3개)")
        for i, (_, rec) in enumerate(self.recommendations.head(3).iterrows(), 1):
            print(f"   {i}. {rec['추천유형']}")
            print(f"      → 대상: {rec['대상']}")
            print(f"      → 전략: {rec['전략']}")
            print(f"      → 예상효과: {rec['예상효과']}\n")
        
        # 즉시 액션 필요 고객
        urgent_customers = self.customer_segments[
            (self.customer_segments['세그먼트'].isin(['At Risk', 'Cannot Lose Them'])) |
            (self.customer_segments['성장률'] < -20)
        ]
        
        if len(urgent_customers) > 0:
            print(f"🚨 즉시 관심 필요 고객 ({len(urgent_customers)}개)")
            for _, customer in urgent_customers.head(5).iterrows():
                print(f"   • {customer['거래처명']}: "
                      f"매출 {customer['총매출']/10000:.0f}만원, "
                      f"성장률 {customer['성장률']:.1f}%, "
                      f"세그먼트: {customer['세그먼트']}")
        
        print("\n" + "="*60)


# 사용 예시
if __name__ == "__main__":
    # 엔진 초기화
    engine = SalesRecommendationEngine()
    
    # 데이터 로드 (CSV 파일 경로 지정)
    if engine.load_data('rxrawdata.csv'):
        
        # 분석 수행
        print("고객 분석 시작...")
        customers = engine.analyze_customers()
        
        print("품목 분석 시작...")
        products = engine.analyze_products()
        
        print("영업 추천 생성...")
        recommendations = engine.generate_sales_recommendations()
        
        # 결과 출력
        engine.print_summary_report()
        
        # 보고서 내보내기
        engine.export_analysis_report('영업분석보고서.xlsx')
        
        print("\n분석이 완료되었습니다!")
    else:
        print("데이터를 로드할 수 없습니다. 파일 경로를 확인해주세요.")