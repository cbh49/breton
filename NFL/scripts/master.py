#!/usr/bin/env python3
"""
Historical Master Script
Runs all historical data collection scripts and TypeScript image generation scripts in sequence.
"""

import subprocess
import sys
import time
from pathlib import Path

# Script directory
SCRIPT_DIR = Path(__file__).parent

# List of historical scripts to run in order
HISTORICAL_SCRIPTS = [
    # "quarterback_lines.py",
    # "runningback_lines.py",
    # "receiver_lines.py",
    # "touchdown_lines.py",
    # "QBProps-5.py",
    # "RBProps-5.py",
    # "WRProps-5.py",
    # "TDProps.py",
]

# List of TypeScript image generation scripts to run
TYPESCRIPT_SCRIPTS = [
    "QBImage.ts",
    "RBImage.ts", 
    "WRImage.ts",
    "TDImage.ts",
]

def run_script(script_name):
    """Run a single script and return success status"""
    script_path = SCRIPT_DIR / script_name
    print(f"\n{'='*60}")
    print(f"Running {script_name}...")
    print(f"{'='*60}")
    
    try:
        # Determine if it's a Python or TypeScript script
        if script_name.endswith('.py'):
            # Run Python script
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=SCRIPT_DIR,
                capture_output=True,
                text=True,
                timeout=1800  # 30 minute timeout
            )
        elif script_name.endswith('.ts'):
            # Run TypeScript script with npx tsx
            result = subprocess.run(
                ['npx', 'tsx', str(script_path)],
                cwd=SCRIPT_DIR,
                capture_output=True,
                text=True,
                timeout=1800  # 30 minute timeout
            )
        else:
            print(f"❌ Unknown script type: {script_name}")
            return False
        
        if result.returncode == 0:
            print(f"✅ {script_name} completed successfully")
            if result.stdout:
                print("Output:")
                print(result.stdout)
            return True
        else:
            print(f"❌ {script_name} failed with return code {result.returncode}")
            if result.stderr:
                print("Error output:")
                print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {script_name} timed out after 30 minutes")
        return False
    except Exception as e:
        print(f"💥 {script_name} failed with exception: {e}")
        return False

def main():
    """Main function to run all historical and TypeScript scripts"""
    print("🚀 Starting Historical Data Collection and Image Generation Master Script")
    print(f"📁 Working directory: {SCRIPT_DIR}")
    
    # Combine all scripts
    all_scripts = HISTORICAL_SCRIPTS + TYPESCRIPT_SCRIPTS
    print(f"📋 Python scripts to run: {len(HISTORICAL_SCRIPTS)}")
    print(f"📋 TypeScript scripts to run: {len(TYPESCRIPT_SCRIPTS)}")
    print(f"📋 Total scripts to run: {len(all_scripts)}")
    
    start_time = time.time()
    successful_scripts = []
    failed_scripts = []
    
    # Run each script
    for i, script_name in enumerate(all_scripts, 1):
        print(f"\n📊 Progress: {i}/{len(all_scripts)}")
        
        if run_script(script_name):
            successful_scripts.append(script_name)
        else:
            failed_scripts.append(script_name)
        
        # Add a small delay between scripts
        if i < len(all_scripts):
            print("⏳ Waiting 5 seconds before next script...")
            time.sleep(5)
    
    # Summary
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"\n{'='*60}")
    print("📊 FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"⏱️  Total execution time: {duration:.1f} seconds ({duration/60:.1f} minutes)")
    print(f"✅ Successful scripts: {len(successful_scripts)}")
    print(f"❌ Failed scripts: {len(failed_scripts)}")
    
    if successful_scripts:
        print(f"\n✅ Successfully completed:")
        for script in successful_scripts:
            print(f"   • {script}")
    
    if failed_scripts:
        print(f"\n❌ Failed scripts:")
        for script in failed_scripts:
            print(f"   • {script}")
        print(f"\n⚠️  Some scripts failed. Check the output above for details.")
        return 1
    else:
        print(f"\n🎉 All scripts completed successfully!")
        return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

