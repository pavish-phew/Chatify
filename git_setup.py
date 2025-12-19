import subprocess
import os

def run_git_cmd(cmd):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    else:
        print(f"Success: {result.stdout}")
    return result.returncode

os.chdir(r"c:\Users\Pavish s\Desktop\chat application")

# Try to remove origin if it exists
run_git_cmd(["git", "remote", "remove", "origin"])

# Add origin
run_git_cmd(["git", "remote", "add", "origin", "https://github.com/pavish-phew/Chatify.git"])

# Set branch to main
run_git_cmd(["git", "branch", "-M", "main"])

# Verify
run_git_cmd(["git", "remote", "-v"])
run_git_cmd(["git", "status"])
