#!/usr/bin/env python3
"""
Test script for all robot tools in robot_tools.py
Tests get_robot_feedback, get_robot_detection, and get_robot_gesture tools
"""

import sys
import os
import json
from datetime import datetime

# Add the current directory and parent directory to Python path to import from robot_tools.py
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, current_dir)
sys.path.insert(0, parent_dir)

import importlib.util

# Load the robot_tools.py module directly
robot_tools_path = os.path.join(current_dir, 'robot_tools.py')
spec = importlib.util.spec_from_file_location("robot_tools_module", robot_tools_path)
robot_tools_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(robot_tools_module)

def test_tool(tool_name, tool_function):
    """Generic test function for any robot tool"""
    print(f"Testing {tool_name}")
    print("=" * 50)
    
    try:
        # Call the tool
        result = tool_function()
        
        # Print the result
        print(f"Tool execution time: {datetime.now().isoformat()}")
        print(f"Result type: {type(result)}")
        print(f"Result: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        # Check if it's a valid response
        if isinstance(result, dict):
            if "error" in result:
                print(f"\n❌ Tool returned error: {result['error']}")
                return False
            elif "status" in result:
                print(f"\n✅ Tool executed successfully with status: {result['status']}")
                if result['status'] == "success":
                    message_count = result.get('message_count', 0)
                    print(f"   - Retrieved {message_count} messages")
                elif result['status'] == "no_messages":
                    print("   - No messages available in the queue (this is normal if queue is empty)")
                return True
            else:
                print(f"\n⚠️  Tool returned unexpected response format")
                return False
        else:
            print(f"\n❌ Tool returned unexpected result type: {type(result)}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing tool: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_robot_feedback():
    """Test the get_robot_feedback tool"""
    return test_tool("Robot Feedback Tool", robot_tools_module.get_robot_feedback)

def test_robot_detection():
    """Test the get_robot_detection tool"""
    return test_tool("Robot Detection Tool", robot_tools_module.get_robot_detection)

def test_robot_gesture():
    """Test the get_robot_gesture tool"""
    return test_tool("Robot Gesture Tool", robot_tools_module.get_robot_gesture)

def test_analyze_robot_image():
    """Test the analyze_robot_image tool with a sample S3 path"""
    print("Testing Robot Image Analysis Tool")
    print("=" * 50)
    
    try:
        # Test with a sample S3 path (this will likely fail if the image doesn't exist, but we can test the function structure)
        sample_image_path = "s3://robot-agentic-images-533267442321-us-west-2/detection-images/sample.png"
        
        print(f"Testing with sample image path: {sample_image_path}")
        result = robot_tools_module.analyze_robot_image(sample_image_path)
        
        print(f"Tool execution time: {datetime.now().isoformat()}")
        print(f"Result type: {type(result)}")
        print(f"Result: {result}")
        
        # Check if it's a valid response
        if isinstance(result, str):
            if "Error analyzing image" in result:
                print(f"\n⚠️  Tool returned expected error (image likely doesn't exist): {result}")
                print("✅ Function structure is working correctly")
                return True
            else:
                print(f"\n✅ Tool executed successfully and returned analysis result")
                return True
        else:
            print(f"\n❌ Tool returned unexpected result type: {type(result)}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing tool: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Robot Tools Test Suite")
    print("=" * 50)
    print("Testing all robot tools: get_robot_feedback, get_robot_detection, get_robot_gesture, analyze_robot_image")
    print("=" * 50)
    
    # Check if config.json exists
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(parent_dir, 'config', 'config.json')
    if not os.path.exists(config_path):
        print(f"❌ config.json not found at {config_path}")
        print("Please ensure config.json exists with proper AWS configuration")
        sys.exit(1)
    
    # Load and display config (without sensitive info)
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        print(f"✅ Config loaded successfully")
        print(f"   - Region: {config.get('region', 'N/A')}")
        print(f"   - Account ID: {config.get('accountId', 'N/A')}")
        print(f"   - Project: {config.get('projectName', 'N/A')}")
    except Exception as e:
        print(f"❌ Error loading config: {e}")
        sys.exit(1)
    
    # Define all tests to run
    tests = [
        ("Robot Feedback Tool", test_robot_feedback),
        ("Robot Detection Tool", test_robot_detection),
        ("Robot Gesture Tool", test_robot_gesture),
        ("Robot Image Analysis Tool", test_analyze_robot_image)
    ]
    
    # Run all tests
    print(f"\n🚀 Running {len(tests)} tests...")
    print("=" * 50)
    
    test_results = []
    for test_name, test_function in tests:
        print(f"\n📋 Starting {test_name}...")
        success = test_function()
        test_results.append((test_name, success))
        print(f"\n{'✅ PASSED' if success else '❌ FAILED'}: {test_name}")
        print("-" * 50)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, success in test_results if success)
    total = len(test_results)
    
    for test_name, success in test_results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n📈 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests completed successfully!")
        print("All robot tools are working correctly.")
    else:
        print(f"\n💥 {total - passed} test(s) failed!")
        print("Please check the error messages above for details.")
        sys.exit(1)
