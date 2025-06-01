#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import os
import json
from datetime import datetime

def split_csv_by_manager():
    """
    analytics-sales-rawdata.csv 파일을 담당자별로 분리하여 저장
    """
    # 파일 경로
    input_file = 'analytics-sales-rawdata.csv'
    output_dir = 'manager_data'
    
    # 출력 디렉토리 생성
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"📁 {output_dir} 폴더를 생성했습니다.")
    
    try:
        # CSV 파일 읽기
        print(f"📊 {input_file} 파일을 읽는 중...")
        df = pd.read_csv(input_file, encoding='utf-8')
        
        # 컬럼명 정규화 (따옴표 제거 및 분석 코드와 일치시키기)
        column_mapping = {
            '총매출(Net)': '총매출',
            '총입력매출(Net)': '총수량',  # 실제로는 매출이지만 분석에서 수량으로 사용
            '원내입력매출(Net)': '원내매출',
            '원외입력매출(Net)': '원외매출'
        }
        
        # 컬럼명에서 따옴표 제거
        df.columns = df.columns.str.strip().str.replace('"', '')
        
        # 컬럼명 매핑 적용
        df = df.rename(columns=column_mapping)
        
        print(f"📋 정규화된 컬럼명: {list(df.columns)}")
        
        # 담당자 컬럼 확인
        if '담당자' not in df.columns:
            print("❌ '담당자' 컬럼을 찾을 수 없습니다.")
            return False
        
        # 담당자별 데이터 분리
        managers = df['담당자'].dropna().unique()
        manager_info = {}
        
        print(f"👥 총 {len(managers)}명의 담당자를 발견했습니다.")
        
        for manager in managers:
            # 담당자별 데이터 필터링
            manager_data = df[df['담당자'] == manager].copy()
            
            # 파일명 생성 (특수문자 제거)
            safe_manager_name = "".join(c for c in manager if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"manager_{safe_manager_name}.csv"
            filepath = os.path.join(output_dir, filename)
            
            # CSV 파일로 저장
            manager_data.to_csv(filepath, index=False, encoding='utf-8')
            
            # 담당자 정보 수집
            manager_info[manager] = {
                'filename': filename,
                'filepath': filepath,
                'record_count': len(manager_data),
                'safe_name': safe_manager_name
            }
            
            print(f"✅ {manager}: {len(manager_data):,}개 레코드 → {filename}")
        
        # 담당자 정보를 JSON으로 저장
        info_file = os.path.join(output_dir, 'manager_info.json')
        with open(info_file, 'w', encoding='utf-8') as f:
            json.dump({
                'split_date': datetime.now().isoformat(),
                'total_managers': len(managers),
                'total_records': len(df),
                'managers': manager_info
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n📋 담당자 정보가 {info_file}에 저장되었습니다.")
        print(f"📊 총 {len(df):,}개 레코드가 {len(managers)}개 파일로 분리되었습니다.")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ {input_file} 파일을 찾을 수 없습니다.")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return False

def create_manager_index():
    """
    담당자 목록 인덱스 파일 생성
    """
    output_dir = 'manager_data'
    info_file = os.path.join(output_dir, 'manager_info.json')
    
    try:
        with open(info_file, 'r', encoding='utf-8') as f:
            manager_data = json.load(f)
        
        # 담당자 목록을 데이터 건수 순으로 정렬
        sorted_managers = sorted(
            manager_data['managers'].items(),
            key=lambda x: x[1]['record_count'],
            reverse=True
        )
        
        print("\n📋 담당자별 데이터 현황:")
        print("-" * 50)
        for i, (manager, info) in enumerate(sorted_managers, 1):
            print(f"{i:2d}. {manager}: {info['record_count']:,}개 레코드")
        
        return sorted_managers
        
    except FileNotFoundError:
        print("❌ manager_info.json 파일을 찾을 수 없습니다.")
        return []

if __name__ == "__main__":
    print("🚀 담당자별 CSV 파일 분리 시작")
    print("=" * 50)
    
    if split_csv_by_manager():
        print("\n" + "=" * 50)
        create_manager_index()
        print("\n✅ 분리 작업이 완료되었습니다!")
    else:
        print("\n❌ 분리 작업에 실패했습니다.") 