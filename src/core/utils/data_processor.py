"""
데이터 처리를 위한 공통 유틸리티 모듈
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta

from ..config.constants import DataColumns, AnalysisConstants
from ..config.settings import current_config

logger = logging.getLogger(__name__)

class DataProcessor:
    """데이터 처리를 위한 유틸리티 클래스"""
    
    def __init__(self):
        self.required_columns = [
            DataColumns.BASE_YEAR_MONTH,
            DataColumns.ACCOUNT_CODE,
            DataColumns.ACCOUNT_NAME,
            DataColumns.PRODUCT_GROUP,
            DataColumns.TOTAL_SALES
        ]
    
    def load_csv_data(self, file_path: str, encoding: str = 'utf-8') -> Optional[pd.DataFrame]:
        """CSV 파일을 로드하고 기본 전처리를 수행합니다."""
        try:
            # 여러 인코딩 시도
            encodings = [encoding, 'cp949', 'euc-kr', 'utf-8-sig']
            
            for enc in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=enc)
                    logger.info(f"데이터 로드 완료 (인코딩: {enc}): {len(df):,}개 레코드")
                    logger.info(f"원본 컬럼: {list(df.columns)}")
                    return self.preprocess_data(df)
                except UnicodeDecodeError:
                    continue
            
            logger.error(f"지원되는 인코딩으로 파일을 읽을 수 없습니다: {file_path}")
            return None
            
        except Exception as e:
            logger.error(f"데이터 로드 실패: {e}")
            return None
    
    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """데이터 전처리를 수행합니다."""
        try:
            logger.info("데이터 전처리 시작...")
            
            # 컬럼명 정규화
            df = self._normalize_columns(df)
            logger.info(f"정규화 후 컬럼: {list(df.columns)}")
            
            # 필수 컬럼 존재 확인
            if not self._validate_required_columns(df):
                raise ValueError("필수 컬럼이 누락되었습니다.")
            
            # 데이터 타입 변환
            df = self._convert_data_types(df)
            
            # 기준년월을 datetime으로 변환
            df = self._convert_date_columns(df)
            
            # 이상값 처리
            df = self._handle_outliers(df)
            
            # 중복 데이터 제거
            df = self._remove_duplicates(df)
            
            # 유효한 거래만 필터링
            df = self._filter_valid_transactions(df)
            
            logger.info(f"전처리 완료: {len(df):,}개 유효 레코드")
            return df
            
        except Exception as e:
            logger.error(f"데이터 전처리 실패: {e}")
            import traceback
            logger.error(f"상세 오류: {traceback.format_exc()}")
            raise
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """컬럼명을 정규화합니다."""
        logger.info("컬럼명 정규화 시작...")
        
        # 따옴표 제거
        df.columns = df.columns.str.strip().str.replace('"', '')
        logger.info(f"따옴표 제거 후: {list(df.columns)}")
        
        # 컬럼명 매핑
        column_mapping = {
            '총매출(Net)': DataColumns.TOTAL_SALES,
            '총입력매출(Net)': DataColumns.TOTAL_QUANTITY,
            '원내입력매출(Net)': DataColumns.INPATIENT_SALES,
            '원외입력매출(Net)': DataColumns.OUTPATIENT_SALES,
            '지역': DataColumns.REGION
        }
        
        # 매핑할 컬럼이 실제로 존재하는지 확인
        existing_mappings = {k: v for k, v in column_mapping.items() if k in df.columns}
        logger.info(f"적용할 매핑: {existing_mappings}")
        
        df = df.rename(columns=existing_mappings)
        return df
    
    def _validate_required_columns(self, df: pd.DataFrame) -> bool:
        """필수 컬럼 존재 여부를 확인합니다."""
        missing_columns = [col for col in self.required_columns if col not in df.columns]
        
        if missing_columns:
            logger.error(f"필수 컬럼 누락: {missing_columns}")
            logger.info(f"사용 가능한 컬럼: {list(df.columns)}")
            return False
        
        logger.info("모든 필수 컬럼이 존재합니다.")
        return True
    
    def _convert_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """데이터 타입을 변환합니다."""
        logger.info("데이터 타입 변환 시작...")
        
        # 중복 컬럼명 제거
        df = self._handle_duplicate_columns(df)
        
        # 숫자 컬럼 변환
        numeric_columns = [
            DataColumns.TOTAL_SALES,
            DataColumns.TOTAL_QUANTITY,
            DataColumns.UNIT_PRICE,
            DataColumns.INPATIENT_SALES,
            DataColumns.OUTPATIENT_SALES
        ]
        
        for col in numeric_columns:
            if col in df.columns:
                logger.info(f"숫자 변환 시도: {col}")
                try:
                    # 컬럼이 Series인지 확인
                    if isinstance(df[col], pd.Series):
                        # 컬럼 데이터 타입 확인
                        logger.info(f"{col} 원본 타입: {df[col].dtype}")
                        logger.info(f"{col} 샘플 값: {df[col].head().tolist()}")
                        
                        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                        logger.info(f"{col} 변환 완료")
                    else:
                        logger.warning(f"{col}이 Series가 아닙니다. 타입: {type(df[col])}")
                        # DataFrame인 경우 첫 번째 컬럼만 사용
                        if isinstance(df[col], pd.DataFrame):
                            df[col] = pd.to_numeric(df[col].iloc[:, 0], errors='coerce').fillna(0)
                            logger.info(f"{col} 변환 완료 (DataFrame에서 첫 번째 컬럼 사용)")
                except Exception as e:
                    logger.error(f"{col} 변환 오류: {e}")
                    raise
        
        # 문자열 컬럼 변환
        string_columns = [
            DataColumns.ACCOUNT_CODE,
            DataColumns.ACCOUNT_NAME,
            DataColumns.PRODUCT_GROUP,
            DataColumns.PRODUCT_NAME,
            DataColumns.MANAGER,
            DataColumns.REGION
        ]
        
        for col in string_columns:
            if col in df.columns:
                logger.info(f"문자열 변환 시도: {col}")
                try:
                    if isinstance(df[col], pd.Series):
                        df[col] = df[col].astype(str).fillna('')
                        logger.info(f"{col} 변환 완료")
                    elif isinstance(df[col], pd.DataFrame):
                        df[col] = df[col].iloc[:, 0].astype(str).fillna('')
                        logger.info(f"{col} 변환 완료 (DataFrame에서 첫 번째 컬럼 사용)")
                except Exception as e:
                    logger.error(f"{col} 변환 오류: {e}")
                    # 문자열 변환 실패는 치명적이지 않으므로 계속 진행
        
        return df
    
    def _handle_duplicate_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """중복된 컬럼명을 처리합니다."""
        # 중복 컬럼명 확인
        duplicate_cols = df.columns[df.columns.duplicated()].unique()
        
        if len(duplicate_cols) > 0:
            logger.warning(f"중복 컬럼명 발견: {duplicate_cols}")
            
            # 중복 컬럼명에 번호 추가
            cols = pd.Series(df.columns)
            for dup in duplicate_cols:
                cols[cols[cols == dup].index.values[1:]] = [f"{dup}_{i}" for i in range(1, (cols == dup).sum())]
            
            df.columns = cols
            logger.info(f"중복 컬럼명 수정 완료: {list(df.columns)}")
        
        return df
    
    def _convert_date_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """날짜 컬럼을 변환합니다."""
        if DataColumns.BASE_YEAR_MONTH in df.columns:
            try:
                logger.info("날짜 컬럼 변환 시작...")
                
                # 기준년월 컬럼이 숫자형인지 확인하고 문자열로 변환
                df[DataColumns.BASE_YEAR_MONTH] = df[DataColumns.BASE_YEAR_MONTH].astype(str).str.strip()
                
                # 유효한 년월 형식인지 확인 (YYYYMM)
                valid_dates = df[DataColumns.BASE_YEAR_MONTH].str.match(r'^\d{6}$')
                if not valid_dates.all():
                    logger.warning(f"일부 기준년월 값이 올바르지 않습니다: {df[~valid_dates][DataColumns.BASE_YEAR_MONTH].unique()}")
                
                # datetime 변환
                df[f'{DataColumns.BASE_YEAR_MONTH}_dt'] = pd.to_datetime(
                    df[DataColumns.BASE_YEAR_MONTH], 
                    format='%Y%m',
                    errors='coerce'
                )
                logger.info("날짜 컬럼 변환 완료")
            except Exception as e:
                logger.warning(f"날짜 변환 중 오류 발생: {e}")
        
        return df
    
    def _handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """이상값을 처리합니다."""
        # 매출이 음수인 경우 0으로 변환
        if DataColumns.TOTAL_SALES in df.columns:
            negative_sales = df[DataColumns.TOTAL_SALES] < 0
            if negative_sales.any():
                logger.info(f"음수 매출 {negative_sales.sum()}건을 0으로 변환")
                df.loc[negative_sales, DataColumns.TOTAL_SALES] = 0
        
        return df
    
    def _remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """중복 레코드를 제거합니다."""
        before_count = len(df)
        
        # 주요 컬럼 기준으로 중복 제거
        duplicate_subset = []
        for col in [DataColumns.BASE_YEAR_MONTH, DataColumns.ACCOUNT_CODE, DataColumns.PRODUCT_GROUP]:
            if col in df.columns:
                duplicate_subset.append(col)
        
        if duplicate_subset:
            df = df.drop_duplicates(subset=duplicate_subset, keep='last')
            
            removed_count = before_count - len(df)
            if removed_count > 0:
                logger.info(f"중복 레코드 제거: {removed_count:,}개")
        
        return df
    
    def _filter_valid_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """유효한 거래만 필터링합니다."""
        if DataColumns.TOTAL_SALES in df.columns:
            # 매출이 0보다 큰 거래만 유지
            valid_sales = df[DataColumns.TOTAL_SALES] > 0
            valid_df = df[valid_sales].copy()
            
            filtered_count = len(df) - len(valid_df)
            if filtered_count > 0:
                logger.info(f"무효 거래 필터링: {filtered_count:,}개")
        else:
            valid_df = df.copy()
        
        return valid_df

class DataAggregator:
    """데이터 집계를 위한 유틸리티 클래스"""
    
    @staticmethod
    def group_by_account(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """거래처별로 데이터를 그룹화합니다."""
        if DataColumns.ACCOUNT_CODE in df.columns:
            return dict(list(df.groupby(DataColumns.ACCOUNT_CODE)))
        return {}
    
    @staticmethod
    def group_by_product(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """품목별로 데이터를 그룹화합니다."""
        if DataColumns.PRODUCT_GROUP in df.columns:
            return dict(list(df.groupby(DataColumns.PRODUCT_GROUP)))
        return {}
    
    @staticmethod
    def group_by_manager(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """담당자별로 데이터를 그룹화합니다."""
        if DataColumns.MANAGER in df.columns:
            return dict(list(df.groupby(DataColumns.MANAGER)))
        return {}
    
    @staticmethod
    def calculate_monthly_metrics(df: pd.DataFrame) -> pd.DataFrame:
        """월별 지표를 계산합니다."""
        if DataColumns.BASE_YEAR_MONTH not in df.columns:
            return pd.DataFrame()
            
        monthly_df = df.groupby(DataColumns.BASE_YEAR_MONTH).agg({
            DataColumns.TOTAL_SALES: 'sum',
            DataColumns.TOTAL_QUANTITY: 'sum' if DataColumns.TOTAL_QUANTITY in df.columns else lambda x: 0,
            DataColumns.ACCOUNT_CODE: 'nunique',
            DataColumns.PRODUCT_GROUP: 'nunique'
        }).reset_index()
        
        monthly_df.columns = [
            DataColumns.BASE_YEAR_MONTH,
            '월매출',
            '월수량',
            '월거래처수',
            '월품목수'
        ]
        
        return monthly_df
    
    @staticmethod
    def calculate_growth_metrics(df: pd.DataFrame, account_code: str) -> Dict[str, float]:
        """특정 거래처의 성장률 지표를 계산합니다."""
        if DataColumns.ACCOUNT_CODE not in df.columns or DataColumns.BASE_YEAR_MONTH not in df.columns:
            return {
                'recent_sales': 0,
                'growth_3month': 0,
                'growth_year': 0
            }
            
        account_data = df[df[DataColumns.ACCOUNT_CODE] == account_code]
        
        if len(account_data) == 0:
            return {
                'recent_sales': 0,
                'growth_3month': 0,
                'growth_year': 0
            }
        
        # 월별 매출 계산
        monthly_sales = account_data.groupby(DataColumns.BASE_YEAR_MONTH)[DataColumns.TOTAL_SALES].sum()
        sorted_months = sorted(monthly_sales.index, reverse=True)
        
        # 최근 매출
        recent_sales = monthly_sales.get(sorted_months[0], 0) if sorted_months else 0
        
        # 3개월 전 대비 성장률
        growth_3month = 0
        if len(sorted_months) >= 4:
            current_month = sorted_months[0]
            three_months_ago = sorted_months[3]
            current_sales = monthly_sales.get(current_month, 0)
            prev_sales = monthly_sales.get(three_months_ago, 0)
            
            if prev_sales > 0:
                growth_3month = ((current_sales - prev_sales) / prev_sales) * 100
        
        # 작년 동월 대비 성장률
        growth_year = 0
        if len(sorted_months) >= 12:
            current_month = sorted_months[0]
            year_ago_month = sorted_months[11]
            current_sales = monthly_sales.get(current_month, 0)
            year_ago_sales = monthly_sales.get(year_ago_month, 0)
            
            if year_ago_sales > 0:
                growth_year = ((current_sales - year_ago_sales) / year_ago_sales) * 100
        
        return {
            'recent_sales': recent_sales,
            'growth_3month': growth_3month,
            'growth_year': growth_year
        }

def sample_data(df: pd.DataFrame, sample_size: int) -> pd.DataFrame:
    """데이터를 샘플링합니다."""
    if sample_size >= len(df):
        return df
    
    return df.sample(n=sample_size, random_state=current_config.RANDOM_STATE)

def export_to_excel(data_dict: Dict[str, pd.DataFrame], file_path: str) -> bool:
    """여러 DataFrame을 Excel 파일로 내보냅니다."""
    try:
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            for sheet_name, df in data_dict.items():
                # 시트명 길이 제한 (Excel 제한: 31자)
                safe_sheet_name = sheet_name[:31] if len(sheet_name) > 31 else sheet_name
                df.to_excel(writer, sheet_name=safe_sheet_name, index=False)
        
        logger.info(f"Excel 파일 저장 완료: {file_path}")
        return True
        
    except Exception as e:
        logger.error(f"Excel 파일 저장 실패: {e}")
        return False 