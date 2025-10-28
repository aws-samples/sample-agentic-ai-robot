#!/usr/bin/env python3
"""
observer_env 툴 테스트 스크립트
"""

import sys
import os
import asyncio
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from tools.observer_env_agent import observe_env_agent


def test_observe_env():
    """observe_env 툴을 테스트합니다."""
    print("=== observer_env 툴 테스트 시작 ===")
    
    # 테스트 케이스들
    test_cases = [
        {
            "name": "공장 작업 환경 테스트",
            "image_path": "test-images/factory-floor.jpg",
            "description": "로봇이 공장 바닥을 바라보고 있습니다. 작업자들이 기계 주변에서 작업 중입니다."
        },
        {
            "name": "창고 환경 테스트", 
            "image_path": "test-images/warehouse.jpg",
            "description": "창고 내부를 관찰하고 있습니다. 물품들이 선반에 정리되어 있고, 포크리프트가 보입니다."
        },
        {
            "name": "안전 위험 상황 테스트",
            "image_path": "test-images/safety-hazard.jpg", 
            "description": "작업 현장에서 안전모를 착용하지 않은 작업자가 보입니다. 바닥에 물이 흘러있어 미끄러울 수 있습니다."
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- 테스트 케이스 {i}: {test_case['name']} ---")
        print(f"이미지 경로: {test_case['image_path']}")
        print(f"설명: {test_case['description']}")
        print("-" * 50)
        
        try:
            # observe_env 함수 호출
            result = observe_env(test_case['image_path'], test_case['description'])
            
            print("✅ 함수 호출 성공")
            print(f"결과 타입: {type(result)}")
            print(f"결과 길이: {len(str(result))} 문자")
            print("\n📋 분석 결과:")
            print(result)
            
        except Exception as e:
            print(f"❌ 테스트 실패: {str(e)}")
            print(f"에러 타입: {type(e).__name__}")
            
        print("=" * 60)
    
    print("\n=== observer_env 툴 테스트 완료 ===")


def test_observe_env_with_mock():
    """Mock 데이터로 observe_env 툴을 테스트합니다."""
    print("\n=== Mock 데이터로 observer_env 테스트 ===")
    
    # 실제 S3 이미지가 없을 경우를 위한 Mock 테스트
    mock_test_cases = [
        {
            "name": "Mock 공장 환경",
            "image_path": "mock/factory.jpg",
            "description": "Mock 공장 환경입니다. 기계들이 정상적으로 작동하고 있습니다."
        },
        {
            "name": "Mock 안전 위험",
            "image_path": "mock/hazard.jpg", 
            "description": "Mock 위험 상황입니다. 안전 장비가 제대로 착용되지 않았습니다."
        }
    ]
    
    for i, test_case in enumerate(mock_test_cases, 1):
        print(f"\n--- Mock 테스트 {i}: {test_case['name']} ---")
        
        try:
            result = observe_env(test_case['image_path'], test_case['description'])
            print("✅ Mock 테스트 완료")
            print(f"결과: {result}")
            
        except Exception as e:
            print(f"❌ Mock 테스트 실패: {str(e)}")
            # S3 이미지가 없어서 실패하는 것은 예상된 동작
            if "S3" in str(e) or "download" in str(e).lower():
                print("ℹ️  S3 이미지 다운로드 실패 - 예상된 동작입니다.")
            else:
                print(f"⚠️  예상치 못한 에러: {e}")


def test_parameter_validation():
    """매개변수 검증 테스트"""
    print("\n=== 매개변수 검증 테스트 ===")
    
    # 잘못된 매개변수로 테스트
    invalid_cases = [
        {
            "name": "빈 문자열 테스트",
            "image_path": "",
            "description": "빈 이미지 경로 테스트"
        },
        {
            "name": "None 값 테스트", 
            "image_path": None,
            "description": "None 이미지 경로 테스트"
        },
        {
            "name": "잘못된 경로 테스트",
            "image_path": "invalid/path/image.jpg",
            "description": "존재하지 않는 이미지 경로 테스트"
        }
    ]
    
    for i, test_case in enumerate(invalid_cases, 1):
        print(f"\n--- 잘못된 매개변수 테스트 {i}: {test_case['name']} ---")
        
        try:
            result = observe_env(test_case['image_path'], test_case['description'])
            print(f"⚠️  예상치 못한 성공: {result}")
            
        except Exception as e:
            print(f"✅ 예상된 에러 발생: {str(e)}")


if __name__ == "__main__":
    print("observer_env 툴 테스트를 시작합니다...")
    
    # 기본 테스트 실행
    test_observe_env()
    
    # Mock 데이터 테스트
    test_observe_env_with_mock()
    
    # 매개변수 검증 테스트
    test_parameter_validation()
    
    print("\n🎉 모든 테스트가 완료되었습니다!")
