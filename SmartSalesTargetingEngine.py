"""
스마트 세일즈 타겟팅 엔진 (Smart Sales Targeting Engine)
특정 품목을 어떤 거래처에 판매하는 것이 가장 효율적인지 추천하는 AI 시스템

주요 기능:
1. 거래처-품목 매칭 최적화
2. 매출 예측 및 성공 확률 계산
3. 경쟁사 분석 및 시장 기회 발굴
4. 의료진 처방 패턴 분석
5. 지역적/계절적 특성 고려
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, LabelEncoder
from scipy.sparse import csr_matrix
from scipy.spatial.distance import cdist
import warnings
warnings.filterwarnings('ignore')

class SmartSalesTargetingEngine:
    def __init__(self):
        self.data = None
        self.customer_profiles = None
        self.product_profiles = None
        self.similarity_matrix = None
        self.sales_predictor = None
        self.success_classifier = None
        self.customer_segments = None
        
    def _infer_disease_category(self, product_name):
        """품목명에서 질환분류 추정 (한미약품 제품 우선 + 진료과 매칭 강화)"""
        product_lower = product_name.lower()
        
        # 한미약품 제품 우선 인식
        if any(keyword in product_lower for keyword in ['아모잘탄', '로수젯', '팔팔', '한미탐스', '에소메졸', '피도글', '졸피드', '히알루미니']):
            if '아모잘탄' in product_lower:
                return '고혈압/심혈관'
            elif '로수젯' in product_lower:
                return '이상지질혈증'
            elif any(keyword in product_lower for keyword in ['팔팔', '한미탐스']):
                return '비뇨기과'
            elif '에소메졸' in product_lower:
                return '소화기계'
            elif '피도글' in product_lower:
                return '심혈관/혈전'
            elif '졸피드' in product_lower:
                return '정신과/신경과'
            elif '히알루미니' in product_lower:
                return '안과'
        
        # 일반적인 키워드 기반 분류 (진료과 매칭 고려)
        if any(keyword in product_lower for keyword in ['심', '혈압', '고혈압', '심장', '아모디핀', '발사르탄', '로사르탄']):
            return '고혈압/심혈관'
        elif any(keyword in product_lower for keyword in ['콜레스테롤', '지질', '스타틴', '로수바스타틴', '아토르바스타틴']):
            return '이상지질혈증'
        elif any(keyword in product_lower for keyword in ['위', '소화', '장', '위산', '제산', '오메프라졸', '란소프라졸']):
            return '소화기계'
        elif any(keyword in product_lower for keyword in ['폐', '기침', '천식', '호흡', '알레르기', '비염']):
            return '호흡기계'
        elif any(keyword in product_lower for keyword in ['뼈', '관절', '류마티스', '근육', '정형외과']):
            return '정형외과'
        elif any(keyword in product_lower for keyword in ['뇌', '신경', '우울', '불안', '수면', '졸피뎀']):
            return '정신과/신경과'
        elif any(keyword in product_lower for keyword in ['감염', '항생', '바이러스', '세균', '아목시실린']):
            return '감염내과'
        elif any(keyword in product_lower for keyword in ['당뇨', '혈당', '인슐린', '메트포르민']):
            return '내분비내과'
        elif any(keyword in product_lower for keyword in ['신장', '요로', '방광', '전립선', '비뇨기']):
            return '비뇨기과'
        elif any(keyword in product_lower for keyword in ['피부', '알레르기', '아토피', '습진']):
            return '피부과'
        elif any(keyword in product_lower for keyword in ['안과', '점안', '녹내장', '히알루론산']):
            return '안과'
        elif any(keyword in product_lower for keyword in ['이비인후', '귀', '코', '목']):
            return '이비인후과'
        elif any(keyword in product_lower for keyword in ['산부인과', '부인과', '임신']):
            return '산부인과'
        elif any(keyword in product_lower for keyword in ['소아', '어린이']):
            return '소아청소년과'
        else:
            return '일반내과'
        
    def _extract_clinic_specialty(self, clinic_name):
        """거래처명에서 진료과 추출"""
        clinic_lower = clinic_name.lower()
        
        if '내과' in clinic_lower:
            return '일반내과'
        elif '이비인후과' in clinic_lower:
            return '이비인후과'
        elif '피부과' in clinic_lower:
            return '피부과'
        elif '안과' in clinic_lower:
            return '안과'
        elif '비뇨기과' in clinic_lower:
            return '비뇨기과'
        elif '정형외과' in clinic_lower:
            return '정형외과'
        elif '산부인과' in clinic_lower:
            return '산부인과'
        elif '소아청소년과' in clinic_lower or '소아과' in clinic_lower:
            return '소아청소년과'
        elif '정신과' in clinic_lower or '신경과' in clinic_lower:
            return '정신과/신경과'
        elif '가정의학과' in clinic_lower:
            return '가정의학과'
        elif '의원' in clinic_lower or '클리닉' in clinic_lower:
            return '일반의원'
        elif '병원' in clinic_lower:
            return '종합병원'
        else:
            return '기타'
    
    def _calculate_specialty_match_score(self, disease_category, clinic_specialty):
        """질환분류와 진료과 매칭 점수 계산"""
        
        # 질환별 적합한 진료과 매핑
        specialty_mapping = {
            '고혈압/심혈관': ['일반내과', '가정의학과', '심장내과', '종합병원', '일반의원'],
            '이상지질혈증': ['일반내과', '가정의학과', '심장내과', '종합병원', '일반의원'],
            '소화기계': ['일반내과', '가정의학과', '소화기내과', '종합병원', '일반의원'],
            '호흡기계': ['이비인후과', '일반내과', '가정의학과', '호흡기내과', '종합병원'],
            '정형외과': ['정형외과', '재활의학과', '종합병원'],
            '정신과/신경과': ['정신과/신경과', '신경과', '정신건강의학과', '종합병원'],
            '감염내과': ['일반내과', '가정의학과', '감염내과', '종합병원', '일반의원'],
            '내분비내과': ['일반내과', '가정의학과', '내분비내과', '종합병원', '일반의원'],
            '비뇨기과': ['비뇨기과', '종합병원'],
            '피부과': ['피부과', '종합병원'],
            '안과': ['안과', '종합병원'],
            '이비인후과': ['이비인후과', '종합병원'],
            '산부인과': ['산부인과', '종합병원'],
            '소아청소년과': ['소아청소년과', '종합병원'],
            '일반내과': ['일반내과', '가정의학과', '종합병원', '일반의원']
        }
        
        # 매칭 점수 계산
        if disease_category in specialty_mapping:
            suitable_specialties = specialty_mapping[disease_category]
            if clinic_specialty in suitable_specialties:
                # 정확한 매칭일수록 높은 점수
                if clinic_specialty == suitable_specialties[0]:  # 최적 매칭
                    return 2.0
                elif clinic_specialty in suitable_specialties[:2]:  # 우수 매칭
                    return 1.5
                else:  # 적합 매칭
                    return 1.2
            else:
                return 0.5  # 부적합 매칭
        
        return 1.0  # 기본 점수
        
    def load_and_prepare_data(self, sales_data):
        """영업 데이터 로드 및 전처리"""
        self.data = sales_data.copy()
        
        # 질환분류 컬럼이 없으면 추정
        if '질환분류' not in self.data.columns:
            self.data['질환분류'] = self.data['품목명'].apply(self._infer_disease_category)
        
        self._create_customer_profiles()
        self._create_product_profiles()
        self._build_interaction_matrix()
        
    def _create_customer_profiles(self):
        """거래처별 프로필 생성"""
        print("거래처 프로필 생성 중...")
        
        customer_features = []
        
        for customer_code in self.data['거래처코드'].unique():
            customer_data = self.data[self.data['거래처코드'] == customer_code]
            
            # 기본 정보
            customer_name = customer_data['거래처명'].iloc[0]
            region = customer_data['권역'].iloc[0] if '권역' in customer_data.columns else '미분류'
            manager = customer_data['담당자'].iloc[0] if '담당자' in customer_data.columns else '미분류'
            
            # 매출 특성
            total_sales = customer_data['총매출'].sum()
            avg_transaction = customer_data['총매출'].mean()
            transaction_count = len(customer_data)
            active_months = customer_data['기준년월'].nunique()
            
            # 품목 다양성
            unique_products = customer_data['품목군'].nunique()
            unique_categories = customer_data['질환분류'].nunique()
            
            # 성장률 계산 (최근 3개월 vs 이전 3개월)
            months = sorted(customer_data['기준년월'].unique())
            if len(months) >= 6:
                mid_point = len(months) // 2
                recent_months = months[mid_point:]
                prev_months = months[:mid_point]
            else:
                recent_months = months[-3:] if len(months) >= 3 else months
                prev_months = months[:-3] if len(months) >= 3 else []
            
            recent_sales = customer_data[customer_data['기준년월'].isin(recent_months)]['총매출'].sum()
            prev_sales = customer_data[customer_data['기준년월'].isin(prev_months)]['총매출'].sum()
            growth_rate = ((recent_sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
            
            # 계절성 분석
            monthly_sales = customer_data.groupby('기준년월')['총매출'].sum()
            seasonality = monthly_sales.std() / monthly_sales.mean() if monthly_sales.mean() > 0 else 0
            
            # 가격 민감도 (할인율 기반)
            if '원내할인율' in customer_data.columns and '원외할인율' in customer_data.columns:
                avg_discount = (customer_data['원내할인율'].fillna(0).mean() + 
                              customer_data['원외할인율'].fillna(0).mean()) / 2
            else:
                avg_discount = 0
            
            # 거래처 규모 추정
            if total_sales >= 100000000:  # 1억 이상
                scale = 'Large'
            elif total_sales >= 50000000:  # 5천만 이상
                scale = 'Medium'
            elif total_sales >= 10000000:  # 1천만 이상
                scale = 'Small'
            else:
                scale = 'Micro'
            
            # 거래처 유형 추정 (거래처명 기반)
            if any(keyword in customer_name for keyword in ['병원', '의료원', '센터']):
                facility_type = 'Hospital'
            elif any(keyword in customer_name for keyword in ['의원', '클리닉']):
                facility_type = 'Clinic'
            elif '약국' in customer_name:
                facility_type = 'Pharmacy'
            else:
                facility_type = 'Unknown'
            
            # 진료과 추출
            clinic_specialty = self._extract_clinic_specialty(customer_name)
            
            customer_features.append({
                '거래처코드': customer_code,
                '거래처명': customer_name,
                '권역': region,
                '담당자': manager,
                '총매출': total_sales,
                '평균거래액': avg_transaction,
                '거래횟수': transaction_count,
                '활동월수': active_months,
                '품목수': unique_products,
                '질환카테고리수': unique_categories,
                '성장률': growth_rate,
                '계절성지수': seasonality,
                '할인민감도': avg_discount,
                '거래처규모': scale,
                '시설유형': facility_type,
                '진료과': clinic_specialty,
                '최근활동성': 1 if recent_sales > 0 else 0,
                '품목다양성점수': unique_products / unique_categories if unique_categories > 0 else 0
            })
        
        self.customer_profiles = pd.DataFrame(customer_features)
        print(f"거래처 프로필 생성 완료: {len(self.customer_profiles)}개")
        
    def _create_product_profiles(self):
        """품목별 프로필 생성"""
        print("품목 프로필 생성 중...")
        
        product_features = []
        
        for product in self.data['품목군'].unique():
            product_data = self.data[self.data['품목군'] == product]
            
            # 기본 정보
            total_sales = product_data['총매출'].sum()
            total_qty = product_data['총수량'].sum()
            avg_price = total_sales / total_qty if total_qty > 0 else 0
            customer_count = product_data['거래처코드'].nunique()
            
            # 시장 침투율
            total_customers = self.data['거래처코드'].nunique()
            penetration_rate = customer_count / total_customers
            
            # 성장률 계산
            months = sorted(product_data['기준년월'].unique())
            if len(months) >= 6:
                mid_point = len(months) // 2
                recent_months = months[mid_point:]
                prev_months = months[:mid_point]
            else:
                recent_months = months[-3:] if len(months) >= 3 else months
                prev_months = months[:-3] if len(months) >= 3 else []
            
            recent_sales = product_data[product_data['기준년월'].isin(recent_months)]['총매출'].sum()
            prev_sales = product_data[product_data['기준년월'].isin(prev_months)]['총매출'].sum()
            growth_rate = ((recent_sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
            
            # 계절성
            monthly_sales = product_data.groupby('기준년월')['총매출'].sum()
            seasonality = monthly_sales.std() / monthly_sales.mean() if monthly_sales.mean() > 0 else 0
            
            # 경쟁강도 (같은 질환 카테고리 내 제품 수)
            category = product_data['질환분류'].iloc[0]
            category_products = self.data[self.data['질환분류'] == category]['품목군'].nunique()
            competition_intensity = category_products - 1  # 자신 제외
            
            # 가격 포지셔닝
            category_sales = self.data[self.data['질환분류'] == category]['총매출'].sum()
            category_qty = self.data[self.data['질환분류'] == category]['총수량'].sum()
            category_avg_price = category_sales / category_qty if category_qty > 0 else 1
            price_positioning = avg_price / category_avg_price if category_avg_price > 0 else 1
            
            # 거래처 집중도 (상위 20% 거래처가 차지하는 매출 비중)
            customer_sales = product_data.groupby('거래처코드')['총매출'].sum().sort_values(ascending=False)
            top_20_pct_count = max(1, int(len(customer_sales) * 0.2))
            concentration = customer_sales.head(top_20_pct_count).sum() / customer_sales.sum()
            
            product_features.append({
                '품목군': product,
                '질환분류': category,
                '총매출': total_sales,
                '총수량': total_qty,
                '평균단가': avg_price,
                '고객수': customer_count,
                '시장침투율': penetration_rate,
                '성장률': growth_rate,
                '계절성지수': seasonality,
                '경쟁강도': competition_intensity,
                '가격포지셔닝': price_positioning,
                '고객집중도': concentration,
                '시장점유율': total_sales / self.data['총매출'].sum()
            })
        
        self.product_profiles = pd.DataFrame(product_features)
        print(f"품목 프로필 생성 완료: {len(self.product_profiles)}개")
        
    def _build_interaction_matrix(self):
        """거래처-품목 상호작용 매트릭스 구축"""
        print("상호작용 매트릭스 구축 중...")
        
        # Pivot table 생성 (거래처 x 품목)
        interaction_matrix = self.data.pivot_table(
            index='거래처코드',
            columns='품목군',
            values='총매출',
            aggfunc='sum',
            fill_value=0
        )
        
        # 정규화 (0-1 스케일)
        self.interaction_matrix = interaction_matrix.div(interaction_matrix.max(axis=1), axis=0).fillna(0)
        
        # 코사인 유사도 계산
        self.customer_similarity = cosine_similarity(self.interaction_matrix)
        self.product_similarity = cosine_similarity(self.interaction_matrix.T)
        
        print("상호작용 매트릭스 구축 완료")
        
    def build_predictive_models(self):
        """예측 모델 구축"""
        print("예측 모델 구축 중...")
        
        # 학습 데이터 준비
        training_data = []
        
        for _, row in self.data.iterrows():
            customer_code = row['거래처코드']
            product = row['품목군']
            sales = row['총매출']
            
            # 거래처 특성
            customer_profile = self.customer_profiles[
                self.customer_profiles['거래처코드'] == customer_code
            ].iloc[0]
            
            # 품목 특성
            product_profile = self.product_profiles[
                self.product_profiles['품목군'] == product
            ].iloc[0]
            
            # 특성 조합
            features = {
                'customer_total_sales': customer_profile['총매출'],
                'customer_growth_rate': customer_profile['성장률'],
                'customer_product_diversity': customer_profile['품목수'],
                'customer_scale_encoded': self._encode_scale(customer_profile['거래처규모']),
                'product_penetration_rate': product_profile['시장침투율'],
                'product_growth_rate': product_profile['성장률'],
                'product_avg_price': product_profile['평균단가'],
                'product_competition': product_profile['경쟁강도'],
                'category_match': 1 if customer_profile['질환카테고리수'] > 1 else 0,
                'regional_demand': self._calculate_regional_demand(customer_profile['권역'], product),
                'actual_sales': sales,
                'success': 1 if sales > 0 else 0
            }
            
            training_data.append(features)
        
        training_df = pd.DataFrame(training_data)
        
        # 특성과 타겟 분리
        feature_columns = [col for col in training_df.columns if col not in ['actual_sales', 'success']]
        X = training_df[feature_columns].fillna(0)
        y_sales = training_df['actual_sales']
        y_success = training_df['success']
        
        # 매출 예측 모델 (회귀)
        self.sales_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.sales_predictor.fit(X, y_sales)
        
        # 성공 확률 모델 (분류)
        self.success_classifier = GradientBoostingClassifier(n_estimators=100, random_state=42)
        self.success_classifier.fit(X, y_success)
        
        print("예측 모델 구축 완료")
        
    def _encode_scale(self, scale):
        """거래처 규모 인코딩"""
        scale_map = {'Micro': 1, 'Small': 2, 'Medium': 3, 'Large': 4}
        return scale_map.get(scale, 1)
        
    def _calculate_regional_demand(self, region, product):
        """지역별 수요 계산"""
        regional_data = self.data[
            (self.data['권역'] == region) & (self.data['품목군'] == product)
        ]
        return regional_data['총매출'].sum() / len(regional_data) if len(regional_data) > 0 else 0
        
    def recommend_targets_for_product(self, target_product, top_n=10, exclude_existing=True):
        """특정 품목에 대한 최적 타겟 거래처 추천"""
        print(f"'{target_product}' 품목 타겟 추천 생성 중...")
        
        if target_product not in self.product_profiles['품목군'].values:
            print(f"품목 '{target_product}'을 찾을 수 없습니다.")
            return None
        
        # 기존 구매 거래처 (제외할 경우)
        existing_customers = set()
        if exclude_existing:
            existing_customers = set(
                self.data[self.data['품목군'] == target_product]['거래처코드'].unique()
            )
        
        recommendations = []
        
        for _, customer in self.customer_profiles.iterrows():
            customer_code = customer['거래처코드']
            
            # 기존 구매 거래처 제외
            if exclude_existing and customer_code in existing_customers:
                continue
            
            # 예측 특성 준비
            product_profile = self.product_profiles[
                self.product_profiles['품목군'] == target_product
            ].iloc[0]
            
            features = pd.DataFrame([{
                'customer_total_sales': customer['총매출'],
                'customer_growth_rate': customer['성장률'],
                'customer_product_diversity': customer['품목수'],
                'customer_scale_encoded': self._encode_scale(customer['거래처규모']),
                'product_penetration_rate': product_profile['시장침투율'],
                'product_growth_rate': product_profile['성장률'],
                'product_avg_price': product_profile['평균단가'],
                'product_competition': product_profile['경쟁강도'],
                'category_match': 1 if customer['질환카테고리수'] > 1 else 0,
                'regional_demand': self._calculate_regional_demand(customer['권역'], target_product)
            }])
            
            # 예측 수행
            predicted_sales = self.sales_predictor.predict(features)[0]
            success_probability = self.success_classifier.predict_proba(features)[0][1]
            
            # 유사 고객 기반 추천 점수
            similar_customers_score = self._calculate_similarity_score(customer_code, target_product)
            
            # 진료과 매칭 점수 계산
            target_product_category = product_profile['질환분류']
            clinic_specialty = customer['진료과']
            specialty_match_score = self._calculate_specialty_match_score(target_product_category, clinic_specialty)
            
            # 종합 점수 계산 (진료과 매칭 점수 반영)
            composite_score = (
                predicted_sales * 0.3 +
                success_probability * 1000000 * 0.25 +  # 확률을 매출 단위로 변환
                similar_customers_score * 0.2 +
                specialty_match_score * 100000 * 0.25  # 진료과 매칭 점수 추가
            )
            
            recommendations.append({
                '거래처코드': customer_code,
                '거래처명': customer['거래처명'],
                '권역': customer['권역'],
                '담당자': customer['담당자'],
                '예상매출': int(predicted_sales),
                '성공확률': round(success_probability * 100, 1),
                '유사도점수': round(similar_customers_score, 3),
                '진료과매칭점수': round(specialty_match_score, 1),
                '종합점수': round(composite_score, 0),
                '추천이유': self._generate_recommendation_reason(customer, product_profile, success_probability, specialty_match_score),
                '거래처규모': customer['거래처규모'],
                '시설유형': customer['시설유형'],
                '진료과': customer['진료과'],
                '현재품목수': customer['품목수'],
                '성장률': round(customer['성장률'], 1)
            })
        
        # 종합 점수 순으로 정렬
        recommendations.sort(key=lambda x: x['종합점수'], reverse=True)
        
        print(f"추천 완료: 상위 {min(top_n, len(recommendations))}개 거래처")
        return recommendations[:top_n]
        
    def _calculate_similarity_score(self, customer_code, target_product):
        """유사 고객 기반 점수 계산"""
        if customer_code not in self.interaction_matrix.index:
            return 0
        
        customer_idx = self.interaction_matrix.index.get_loc(customer_code)
        similar_customers = np.argsort(self.customer_similarity[customer_idx])[::-1][1:11]  # 상위 10명
        
        score = 0
        for similar_idx in similar_customers:
            similar_customer_code = self.interaction_matrix.index[similar_idx]
            if target_product in self.interaction_matrix.columns:
                similarity = self.customer_similarity[customer_idx][similar_idx]
                purchase_score = self.interaction_matrix.loc[similar_customer_code, target_product]
                score += similarity * purchase_score
        
        return score / len(similar_customers)
        
    def _generate_recommendation_reason(self, customer, product, success_prob, specialty_match_score):
        """추천 이유 생성 (진료과 매칭 정보 포함)"""
        reasons = []
        
        # 진료과 매칭 우선 확인
        if specialty_match_score >= 2.0:
            reasons.append("최적 진료과 매칭")
        elif specialty_match_score >= 1.5:
            reasons.append("우수 진료과 매칭")
        elif specialty_match_score >= 1.2:
            reasons.append("적합 진료과")
        elif specialty_match_score <= 0.5:
            reasons.append("진료과 부적합")
            
        if success_prob > 0.7:
            reasons.append("높은 성공 확률")
        if customer['성장률'] > 10:
            reasons.append("고성장 거래처")
        if customer['품목수'] > 5:
            reasons.append("다품목 취급")
        if customer['거래처규모'] in ['Large', 'Medium']:
            reasons.append("중대형 거래처")
        if customer['최근활동성'] == 1:
            reasons.append("최근 활발한 거래")
        
        return ', '.join(reasons) if reasons else "표준 추천"
        
    def analyze_market_opportunity(self, target_product):
        """시장 기회 분석"""
        print(f"'{target_product}' 시장 기회 분석 중...")
        
        if target_product not in self.product_profiles['품목군'].values:
            return None
        
        product_data = self.data[self.data['품목군'] == target_product]
        product_profile = self.product_profiles[
            self.product_profiles['품목군'] == target_product
        ].iloc[0]
        
        # 현재 상태
        current_customers = product_data['거래처코드'].nunique()
        total_customers = self.customer_profiles.shape[0]
        current_sales = product_data['총매출'].sum()
        
        # 잠재 시장 크기 계산
        similar_products = self.product_profiles[
            self.product_profiles['질환분류'] == product_profile['질환분류']
        ]
        avg_penetration = similar_products['시장침투율'].mean()
        potential_customers = int(total_customers * avg_penetration)
        
        # 성장 가능성
        growth_potential = max(0, potential_customers - current_customers)
        
        analysis = {
            '품목명': target_product,
            '질환분류': product_profile['질환분류'],
            '현재고객수': current_customers,
            '전체고객수': total_customers,
            '현재침투율': round(current_customers / total_customers * 100, 1),
            '목표침투율': round(avg_penetration * 100, 1),
            '성장가능고객수': growth_potential,
            '현재매출': current_sales,
            '예상추가매출': int(growth_potential * product_data['총매출'].mean()),
            '시장성장률': round(product_profile['성장률'], 1),
            '경쟁강도': product_profile['경쟁강도'],
            '추천전략': self._generate_market_strategy(product_profile, growth_potential)
        }
        
        return analysis
        
    def _generate_market_strategy(self, product_profile, growth_potential):
        """시장 전략 생성"""
        strategies = []
        
        if growth_potential > 10:
            strategies.append("적극적 신규 개발")
        if product_profile['성장률'] > 15:
            strategies.append("성장 모멘텀 활용")
        if product_profile['경쟁강도'] < 5:
            strategies.append("선점 기회 활용")
        if product_profile['가격포지셔닝'] > 1.2:
            strategies.append("프리미엄 포지셔닝")
        else:
            strategies.append("가격 경쟁력 강화")
        
        return ', '.join(strategies) if strategies else "안정적 시장 관리"
        
    def generate_sales_plan(self, target_product, period_months=3):
        """영업 계획 생성"""
        recommendations = self.recommend_targets_for_product(target_product, top_n=20)
        market_analysis = self.analyze_market_opportunity(target_product)
        
        if not recommendations or not market_analysis:
            return None
        
        # 월별 목표 설정
        monthly_targets = []
        total_expected_sales = sum(rec['예상매출'] for rec in recommendations[:10])
        
        for month in range(1, period_months + 1):
            target_customers = recommendations[(month-1)*3:month*3]  # 월 3개 거래처
            monthly_sales = sum(rec['예상매출'] for rec in target_customers)
            
            monthly_targets.append({
                '월차': month,
                '타겟거래처수': len(target_customers),
                '예상매출': monthly_sales,
                '주요거래처': [rec['거래처명'] for rec in target_customers],
                '성공확률': round(np.mean([rec['성공확률'] for rec in target_customers]), 1)
            })
        
        sales_plan = {
            '품목명': target_product,
            '계획기간': f"{period_months}개월",
            '총타겟거래처': len(recommendations[:10]),
            '총예상매출': total_expected_sales,
            '월별계획': monthly_targets,
            '시장분석': market_analysis,
            '핵심전략': [
                "높은 성공확률 거래처 우선 공략",
                "지역별 순차적 확산",
                "성장률 높은 거래처 집중",
                "유사 고객 레퍼런스 활용"
            ]
        }
        
        return sales_plan
        
    def export_recommendations(self, target_product, output_path=None):
        """추천 결과 내보내기"""
        if not output_path:
            output_path = f'{target_product}_추천결과.xlsx'
        
        try:
            recommendations = self.recommend_targets_for_product(target_product, top_n=50)
            market_analysis = self.analyze_market_opportunity(target_product)
            sales_plan = self.generate_sales_plan(target_product)
            
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                # 추천 거래처 목록
                pd.DataFrame(recommendations).to_excel(
                    writer, sheet_name='추천거래처', index=False
                )
                
                # 시장 분석
                pd.DataFrame([market_analysis]).to_excel(
                    writer, sheet_name='시장분석', index=False
                )
                
                # 영업 계획
                if sales_plan:
                    plan_summary = {
                        '항목': ['품목명', '계획기간', '총타겟거래처', '총예상매출'],
                        '값': [sales_plan['품목명'], sales_plan['계획기간'], 
                              sales_plan['총타겟거래처'], sales_plan['총예상매출']]
                    }
                    pd.DataFrame(plan_summary).to_excel(
                        writer, sheet_name='영업계획_요약', index=False
                    )
                    
                    pd.DataFrame(sales_plan['월별계획']).to_excel(
                        writer, sheet_name='월별계획', index=False
                    )
            
            print(f"추천 결과 저장 완료: {output_path}")
            return True
            
        except Exception as e:
            print(f"파일 저장 실패: {e}")
            return False

    def recommend_targets_for_product_group(self, target_product_group, top_n=10, exclude_existing=True):
        """품목군에 대한 타겟 거래처 추천"""
        print(f"'{target_product_group}' 품목군 타겟 거래처 추천 중...")
        
        if target_product_group not in self.data['품목군'].values:
            print(f"'{target_product_group}' 품목군을 찾을 수 없습니다.")
            return []
        
        # 해당 품목군 데이터
        product_group_data = self.data[self.data['품목군'] == target_product_group]
        
        # 질환분류 추정 (품목군의 대표 품목으로)
        representative_product = product_group_data['품목명'].iloc[0]
        disease_category = self._infer_disease_category(representative_product)
        
        recommendations = []
        
        for _, customer in self.customer_profiles.iterrows():
            customer_code = customer['거래처코드']
            
            # 기존 구매 여부 확인
            has_purchased = customer_code in product_group_data['거래처코드'].values
            if exclude_existing and has_purchased:
                continue
            
            # 진료과 매칭 점수
            clinic_specialty = self._extract_clinic_specialty(customer['거래처명'])
            specialty_match_score = self._calculate_specialty_match_score(disease_category, clinic_specialty)
            
            # 유사도 점수 계산
            similarity_score = self._calculate_similarity_score_for_group(customer_code, target_product_group)
            
            # 성공 확률 예측
            success_prob = min(0.98, max(0.1, 
                (similarity_score * 0.4 + specialty_match_score * 0.3 + customer['성장률']/100 * 0.3)))
            
            # 거래처규모 인코딩
            scale_encoding = {'Micro': 1, 'Small': 2, 'Medium': 3, 'Large': 4}
            scale_encoded = scale_encoding.get(customer['거래처규모'], 1)
            
            # 예상 매출 계산
            base_sales = product_group_data['총매출'].mean()
            expected_sales = int(base_sales * success_prob * (scale_encoded + 1) / 2)
            
            recommendation = {
                '거래처코드': customer_code,
                '거래처명': customer['거래처명'],
                '유사도점수': round(similarity_score, 3),
                '성공확률': round(success_prob * 100, 1),
                '예상매출': expected_sales,
                '진료과': clinic_specialty,
                '진료과매칭점수': round(specialty_match_score, 1),
                '시설유형': customer.get('시설유형', 'Unknown'),
                '거래처규모': customer.get('거래처규모', 'Unknown'),
                '추천이유': self._generate_recommendation_reason_for_group(customer, target_product_group, success_prob, specialty_match_score)
            }
            
            recommendations.append(recommendation)
        
        # 진료과 매칭 점수와 성공확률을 종합한 정렬
        recommendations.sort(key=lambda x: (x['진료과매칭점수'] * 0.4 + x['성공확률']/100 * 0.6), reverse=True)
        
        print(f"총 {len(recommendations)}개 추천 거래처 발견")
        return recommendations[:top_n]
    
    def _calculate_similarity_score_for_group(self, customer_code, target_product_group):
        """품목군에 대한 고객 유사도 점수 계산"""
        customer_idx = self.customer_profiles[
            self.customer_profiles['거래처코드'] == customer_code
        ].index[0]
        
        # 같은 품목군을 구매한 유사 고객들 찾기
        group_customers = self.data[self.data['품목군'] == target_product_group]['거래처코드'].unique()
        similar_customers = []
        
        for other_customer in group_customers:
            if other_customer != customer_code:
                try:
                    other_idx = self.customer_profiles[
                        self.customer_profiles['거래처코드'] == other_customer
                    ].index[0]
                    similar_customers.append(other_idx)
                except:
                    continue
        
        if not similar_customers:
            return 0.5
        
        # 거래처규모를 숫자로 인코딩
        scale_encoding = {'Micro': 1, 'Small': 2, 'Medium': 3, 'Large': 4}
        customer_profiles_with_encoding = self.customer_profiles.copy()
        customer_profiles_with_encoding['거래처규모_encoded'] = customer_profiles_with_encoding['거래처규모'].map(scale_encoding)
        
        # 유사도 계산
        customer_features = customer_profiles_with_encoding.iloc[customer_idx][
            ['총매출', '품목수', '성장률', '최근활동성', '거래처규모_encoded']
        ].values.reshape(1, -1)
        
        score = 0
        for sim_idx in similar_customers:
            sim_features = customer_profiles_with_encoding.iloc[sim_idx][
                ['총매출', '품목수', '성장률', '최근활동성', '거래처규모_encoded']
            ].values.reshape(1, -1)
            
            similarity = cosine_similarity(customer_features, sim_features)[0][0]
            score += similarity
        
        return score / len(similar_customers)
    
    def analyze_market_opportunity_by_group(self, target_product_group):
        """품목군 시장 기회 분석"""
        print(f"'{target_product_group}' 품목군 시장 기회 분석 중...")
        
        if target_product_group not in self.data['품목군'].values:
            return None
        
        product_group_data = self.data[self.data['품목군'] == target_product_group]
        
        # 대표 품목으로 질환분류 추정
        representative_product = product_group_data['품목명'].iloc[0]
        disease_category = self._infer_disease_category(representative_product)
        
        # 현재 상태
        current_customers = product_group_data['거래처코드'].nunique()
        total_customers = self.customer_profiles.shape[0]
        current_sales = product_group_data['총매출'].sum()
        
        # 품목군 내 품목 수
        products_in_group = product_group_data['품목명'].nunique()
        
        # 잠재 시장 크기 계산 (같은 질환분류의 다른 품목군 기준)
        same_category_data = self.data[
            self.data['품목명'].apply(self._infer_disease_category) == disease_category
        ]
        avg_penetration = same_category_data.groupby('품목군')['거래처코드'].nunique().mean() / total_customers
        potential_customers = int(total_customers * avg_penetration)
        
        # 성장 가능성
        growth_potential = max(0, potential_customers - current_customers)
        
        # 최근 성장률 계산
        months = sorted(product_group_data['기준년월'].unique())
        if len(months) >= 6:
            recent_months = months[-3:]
            prev_months = months[-6:-3]
            recent_sales = product_group_data[product_group_data['기준년월'].isin(recent_months)]['총매출'].sum()
            prev_sales = product_group_data[product_group_data['기준년월'].isin(prev_months)]['총매출'].sum()
            growth_rate = ((recent_sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
        else:
            growth_rate = 0
        
        analysis = {
            '품목군': target_product_group,
            '질환분류': disease_category,
            '품목수': products_in_group,
            '현재고객수': current_customers,
            '전체고객수': total_customers,
            '현재침투율': round(current_customers / total_customers * 100, 1),
            '목표침투율': round(avg_penetration * 100, 1),
            '성장가능고객수': growth_potential,
            '현재매출': current_sales,
            '예상추가매출': int(growth_potential * product_group_data['총매출'].mean()) if growth_potential > 0 else 0,
            '최근성장률': round(growth_rate, 1),
            '추천전략': self._generate_market_strategy_for_group(disease_category, growth_potential, products_in_group)
        }
        
        return analysis
    
    def _generate_market_strategy_for_group(self, disease_category, growth_potential, products_count):
        """품목군 시장 전략 생성"""
        strategies = []
        
        if growth_potential > 10:
            strategies.append("적극적 신규 개발")
        if products_count > 3:
            strategies.append("다품목 포트폴리오 활용")
        
        # 질환분류별 특화 전략
        if disease_category in ['고혈압/심혈관', '이상지질혈증']:
            strategies.append("내과/가정의학과 중점 공략")
        elif disease_category == '정형외과':
            strategies.append("정형외과 전문병원 집중")
        elif disease_category in ['안과', '이비인후과', '피부과']:
            strategies.append("전문과 타겟팅")
        else:
            strategies.append("일반의원 대상 확산")
        
        strategies.append("진료과 매칭도 우선 고려")
        
        return ', '.join(strategies) if strategies else "안정적 시장 관리"
    
    def generate_sales_plan_by_group(self, target_product_group, period_months=3):
        """품목군 영업 계획 생성"""
        recommendations = self.recommend_targets_for_product_group(target_product_group, top_n=20)
        market_analysis = self.analyze_market_opportunity_by_group(target_product_group)
        
        if not recommendations or not market_analysis:
            return None
        
        # 월별 목표 설정
        monthly_targets = []
        total_expected_sales = sum(rec['예상매출'] for rec in recommendations[:10])
        
        for month in range(1, period_months + 1):
            target_customers = recommendations[(month-1)*3:month*3]  # 월 3개 거래처
            monthly_sales = sum(rec['예상매출'] for rec in target_customers)
            
            monthly_targets.append({
                '월차': month,
                '타겟거래처수': len(target_customers),
                '예상매출': monthly_sales,
                '주요거래처': [rec['거래처명'] for rec in target_customers],
                '성공확률': round(np.mean([rec['성공확률'] for rec in target_customers]), 1) if target_customers else 0
            })
        
        sales_plan = {
            '품목군': target_product_group,
            '계획기간': f"{period_months}개월",
            '총타겟거래처': len(recommendations[:10]),
            '총예상매출': total_expected_sales,
            '월별계획': monthly_targets,
            '시장분석': market_analysis,
            '핵심전략': [
                "진료과 매칭도 우선 고려",
                "높은 성공확률 거래처 우선 공략", 
                "지역별 순차적 확산",
                "성장률 높은 거래처 집중",
                "품목군 내 다품목 크로스셀링"
            ]
        }
        
        return sales_plan
    
    def _generate_recommendation_reason_for_group(self, customer, product_group, success_prob, specialty_match_score):
        """품목군 추천 이유 생성 (진료과 매칭 정보 포함)"""
        reasons = []
        
        # 진료과 매칭 우선 확인
        if specialty_match_score >= 2.0:
            reasons.append("최적 진료과 매칭")
        elif specialty_match_score >= 1.5:
            reasons.append("우수 진료과 매칭")
        elif specialty_match_score >= 1.2:
            reasons.append("적합 진료과")
        elif specialty_match_score <= 0.5:
            reasons.append("진료과 부적합")
            
        if success_prob > 0.7:
            reasons.append("높은 성공 확률")
        if customer['성장률'] > 10:
            reasons.append("고성장 거래처")
        if customer['품목수'] > 5:
            reasons.append("다품목 취급")
        if customer['거래처규모'] in ['Large', 'Medium']:
            reasons.append("중대형 거래처")
        if customer['최근활동성'] == 1:
            reasons.append("최근 활발한 거래")
        
        return ', '.join(reasons) if reasons else "표준 추천"


# 사용 예시
if __name__ == "__main__":
    import pandas as pd
    from flask import Flask, jsonify, request, abort
    from flask_cors import CORS
    import json
    
    app = Flask(__name__)
    CORS(app)  # CORS 허용
    
    # 엔진 초기화
    print("스마트 세일즈 타겟팅 엔진 초기화 중...")
    engine = SmartSalesTargetingEngine()
    
    # 데이터 로드
    try:
        print("데이터 로딩 중...")
        df = pd.read_csv('rx-rawdata.csv', encoding='utf-8')
        engine.load_and_prepare_data(df)
        print("예측 모델 구축 중...")
        engine.build_predictive_models()
        print("스마트 세일즈 타겟팅 엔진 준비 완료!")
    except Exception as e:
        print(f"초기화 오류: {e}")
        print("엔진이 제한된 모드로 실행됩니다.")
    
    @app.route('/api/products', methods=['GET'])
    def get_products():
        """사용 가능한 품목군 목록 반환"""
        try:
            if hasattr(engine, 'data') and engine.data is not None:
                product_groups = sorted(engine.data['품목군'].unique().tolist())
            else:
                # 기본 품목군 목록 (데이터가 없을 때)
                product_groups = [
                    "고혈압/심혈관계", "이상지질혈증", "당뇨병", "소화기계", 
                    "호흡기계", "정형외과", "안과", "이비인후과", "피부과", 
                    "비뇨기과", "산부인과", "소아과", "정신과", "신경과"
                ]
            
            return jsonify({
                'status': 'success',
                'product_groups': product_groups,
                'count': len(product_groups)
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @app.route('/api/recommend', methods=['POST'])
    def get_recommendations():
        """특정 품목군에 대한 AI 추천 생성"""
        try:
            data = request.get_json()
            
            if not data or 'product_group' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'product_group이 필요합니다.'
                }), 400
            
            product_group = data['product_group']
            top_n = data.get('top_n', 20)
            
            print(f"'{product_group}' 품목군에 대한 추천 생성 중... (top {top_n})")
            
            # 추천 생성
            recommendations = engine.recommend_targets_for_product_group(product_group, top_n=top_n)
            
            if not recommendations:
                return jsonify({
                    'status': 'error',
                    'message': f'{product_group}에 대한 추천 결과가 없습니다.'
                }), 404
            
            # 결과를 frontend 형식에 맞게 변환
            formatted_recommendations = []
            for rec in recommendations:
                formatted_rec = {
                    'customer': {
                        'accountName': rec.get('거래처명', ''),
                        'accountCode': rec.get('거래처코드', ''),
                        'specialty': rec.get('진료과', ''),
                        'facilityType': rec.get('시설유형', ''),
                        'scale': rec.get('거래처규모', ''),
                        'manager': rec.get('담당자', '')
                    },
                    'analysis': rec.get('추천이유', ''),
                    'confidence': rec.get('성공확률', 0),
                    'strategies': [{
                        'title': f"{product_group} 타겟팅 전략",
                        'description': rec.get('추천이유', ''),
                        'priority': 'high' if rec.get('성공확률', 0) > 0.7 else 'medium' if rec.get('성공확률', 0) > 0.5 else 'low',
                        'confidence': rec.get('성공확률', 0),
                        'expectedSales': rec.get('예상매출', 0),
                        'timeline': '즉시',
                        'specialty_match': rec.get('진료과매칭점수', 0),
                        'explanation': f"AI가 분석한 {rec.get('거래처명', '')} 거래처의 {product_group} 품목군 적합도입니다."
                    }]
                }
                formatted_recommendations.append(formatted_rec)
            
            return jsonify({
                'status': 'success',
                'product_group': product_group,
                'recommendations': formatted_recommendations,
                'count': len(formatted_recommendations)
            })
            
        except Exception as e:
            print(f"추천 생성 오류: {e}")
            return jsonify({
                'status': 'error',
                'message': f'추천 생성 중 오류가 발생했습니다: {str(e)}'
            }), 500
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """서버 상태 확인"""
        return jsonify({
            'status': 'healthy',
            'message': 'SmartSalesTargetingEngine API 서버가 정상 동작 중입니다.'
        })
    
    # 서버 실행
    print("Flask API 서버 시작 중... (포트: 5002)")
    app.run(host='0.0.0.0', port=5002, debug=False)