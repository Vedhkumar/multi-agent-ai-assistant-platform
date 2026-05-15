"""Code execution tool using E2B sandbox with local fallback."""

import logging
import subprocess
import tempfile
import os
from typing import Any

from langchain_core.tools import tool

from app.config import settings

logger = logging.getLogger(__name__)


@tool
def execute_code(code: str, language: str = "python") -> str:
    """
    Execute code in a sandboxed environment and return the output.
    Supports Python and JavaScript execution.
    
    Args:
        code: The code to execute
        language: Programming language ('python' or 'javascript')
    """
    if settings.e2b_api_key and settings.e2b_api_key.startswith("e2b-"):
        try:
            return _e2b_execute(code, language)
        except Exception as e:
            logger.error(f"E2B execution error: {e}")
            return _local_execute(code, language)
    else:
        logger.info("E2B API key not configured, using local sandbox")
        return _local_execute(code, language)


def _e2b_execute(code: str, language: str) -> str:
    """Execute code using E2B sandbox."""
    from e2b_code_interpreter import Sandbox
    
    sandbox = Sandbox(api_key=settings.e2b_api_key)
    try:
        if language == "python":
            execution = sandbox.run_code(code)
        else:
            execution = sandbox.run_code(code, language=language)
        
        output = ""
        if execution.logs.stdout:
            output += "\n".join(execution.logs.stdout)
        if execution.logs.stderr:
            output += "\n[STDERR]\n" + "\n".join(execution.logs.stderr)
        if execution.error:
            output += f"\n[ERROR] {execution.error.name}: {execution.error.value}"
        
        return output if output.strip() else "[No output produced]"
    finally:
        sandbox.kill()


def _local_execute(code: str, language: str) -> str:
    """Execute code locally with safety limits (fallback for development)."""
    try:
        if language == "python":
            # Write to temp file and execute with timeout
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False
            ) as f:
                f.write(code)
                temp_path = f.name
            
            try:
                result = subprocess.run(
                    ["python3", temp_path],
                    capture_output=True,
                    text=True,
                    timeout=30,  # 30 second timeout
                    cwd=tempfile.gettempdir(),
                )
                
                output = ""
                if result.stdout:
                    output += result.stdout
                if result.stderr:
                    output += "\n[STDERR]\n" + result.stderr
                if result.returncode != 0:
                    output += f"\n[Exit code: {result.returncode}]"
                
                return output if output.strip() else "[No output produced]"
            finally:
                os.unlink(temp_path)
                
        elif language in ("javascript", "js"):
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".js", delete=False
            ) as f:
                f.write(code)
                temp_path = f.name
            
            try:
                result = subprocess.run(
                    ["node", temp_path],
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=tempfile.gettempdir(),
                )
                
                output = ""
                if result.stdout:
                    output += result.stdout
                if result.stderr:
                    output += "\n[STDERR]\n" + result.stderr
                    
                return output if output.strip() else "[No output produced]"
            finally:
                os.unlink(temp_path)
        else:
            return f"[ERROR] Unsupported language: {language}. Supported: python, javascript"
            
    except subprocess.TimeoutExpired:
        return "[ERROR] Code execution timed out after 30 seconds"
    except FileNotFoundError:
        return f"[ERROR] Runtime for '{language}' not found on this system"
    except Exception as e:
        return f"[ERROR] Execution failed: {str(e)}"
