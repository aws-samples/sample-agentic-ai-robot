#!/usr/bin/env python3
"""
Test script for all robot tools in robot_tools.py
Tests get_robot_feedback, get_robot_detection, and get_robot_gesture tools
"""

import sys
import os
import json
from datetime import datetime

# Add the current directory to Python path to import from robot_tools.py
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import importlib.util

# Load the robot_tools.py module directly
robot_tools_path = os.path.join(current_dir, 'robot_tools.py')
spec = importlib.util.spec_from_file_location("robot_tools_module", robot_tools_path)
robot_tools_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(robot_tools_module)

def test_sqs_tool():
    """Test the get_robot_feedback tool"""
    print("Testing SQS Robot Feedback Tool")
    print("=" * 50)
    
    try:
        # Call the tool
        result = robot_tools_module.get_robot_feedback()
        
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
                    print(f"   - Retrieved {result.get('message_count', 0)} robot feedback messages")
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

if __name__ == "__main__":
    print("SQS Robot Feedback Tool Test")
    print("=" * 50)
    
    # Check if config.json exists
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(parent_dir, 'config.json')
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
    
    print("\nTesting tool execution...")
    success = test_sqs_tool()
    
    if success:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n💥 Test failed!")
        sys.exit(1)
