import os
import sys
import json
import hashlib
import tempfile
import traceback
import subprocess
from datetime import datetime
import threading
import signal

def generate_unique_filename():
    """Generate a unique filename for the temporary script."""
    timestamp = datetime.now().isoformat()
    unique_hash = hashlib.md5(timestamp.encode()).hexdigest()[:8]
    return f"code_exec_{unique_hash}.py"

def run_code(code, timeout=10):
    """
    Securely execute Python code using subprocess.Popen
    
    Args:
        code (str): Python code to execute
        timeout (int): Maximum execution time in seconds
    
    Returns:
        dict: Execution results with status, output, and error details
    """
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Generate unique filename
            filename = generate_unique_filename()
            script_path = os.path.join(temp_dir, filename)
            
            # Write code to temporary file
            with open(script_path, 'w') as f:
                f.write(code)
            
            # Prepare process communication
            output = []
            error = []
            
            # Start the process
            process = subprocess.Popen(
                ['python', script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            # Capture output
            def capture_output(pipe, output_list):
                for line in pipe:
                    output_list.append(line.strip())
            
            # Create threads to read stdout and stderr
            stdout_thread = threading.Thread(target=capture_output, args=(process.stdout, output))
            stderr_thread = threading.Thread(target=capture_output, args=(process.stderr, error))
            
            stdout_thread.start()
            stderr_thread.start()
            
            # Wait for the process with timeout
            try:
                process.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                # Kill the entire process group
                os.kill(process.pid, signal.CTRL_C_EVENT)
                return {
                    'status': 'error',
                    'output': 'Execution timed out',
                    'exit_code': -1
                }
            
            # Wait for output threads to complete
            stdout_thread.join()
            stderr_thread.join()
            
            # Combine output
            combined_output = '\n'.join(output + error)
            
            # Determine status
            status = 'success' if process.returncode == 0 else 'error'
            
            return {
                'status': status,
                'output': combined_output,
                'exit_code': process.returncode
            }
    
    except Exception as e:
        # Catch any unexpected errors
        return {
            'status': 'error',
            'output': f'Execution failed: {str(e)}\n{traceback.format_exc()}',
            'exit_code': -2
        }

def main():
    # Ensure code is provided
    if len(sys.argv) < 2:
        print(json.dumps({
            'status': 'error',
            'output': 'No code provided',
            'exit_code': -3
        }))
        sys.exit(1)
    
    # Read code from command line argument
    code = sys.argv[1]
    
    # Execute code and print results
    result = run_code(code)
    print(json.dumps(result))

if __name__ == "__main__":
    main()