"""Code agent: writes and executes code using sandboxed environment."""

import logging
import time
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.agents.state import AgentState
from app.tools.code_executor import execute_code
from app.config import settings

logger = logging.getLogger(__name__)

CODER_SYSTEM_PROMPT = """You are the Code Agent in a multi-agent AI system. Your role is to:

1. Analyze the task and determine what code needs to be written
2. Write clean, well-commented Python or JavaScript code
3. The code will be executed in a sandbox, and you'll receive the output
4. Explain what the code does and interpret the results

Guidelines:
- Write production-quality code with error handling
- Include comments explaining the logic
- Keep code focused on the specific task
- Use standard libraries when possible
- Always include print statements so output is captured

Respond with:
1. A brief explanation of your approach
2. The code block
3. Interpretation of the execution results
"""


def coder_node(state: AgentState) -> AgentState:
    """Code agent node: writes and executes code."""
    logger.info("Code agent starting...")
    start_time = time.time()

    task = state["task"]
    iteration_count = state.get("iteration_count", 0) + 1

    # Check if researcher provided context
    agent_outputs = state.get("agent_outputs", {})
    research_context = agent_outputs.get("researcher", "")

    try:
        if settings.openai_api_key and not settings.openai_api_key.startswith("sk-your"):
            try:
                from langchain_openai import ChatOpenAI

                llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=settings.openai_api_key,
                    temperature=0.2,
                    max_tokens=3000,
                )

                context_msg = ""
                if research_context:
                    context_msg = f"\n\nResearch context from previous agent:\n{research_context[:1000]}"

                messages = [
                    SystemMessage(content=CODER_SYSTEM_PROMPT),
                    HumanMessage(
                        content=f"Task: {task}{context_msg}\n\n"
                        f"Write Python code to accomplish this task. "
                        f"Include print() statements for output. "
                        f"Respond with ONLY the Python code, no markdown fences."
                    ),
                ]

                response = llm.invoke(messages)
                generated_code = response.content

                # Clean up code (remove markdown fences if present)
                code = _clean_code(generated_code)

                # Execute the code
                execution_result = execute_code.invoke({
                    "code": code,
                    "language": "python",
                })

                code_output = (
                    f"### Approach\n"
                    f"Generated Python code to address the task.\n\n"
                    f"### Code\n```python\n{code}\n```\n\n"
                    f"### Execution Output\n```\n{execution_result}\n```\n"
                )

                token_usage = {
                    "coder": {
                        "prompt_tokens": response.usage_metadata.get("input_tokens", 0) if response.usage_metadata else 0,
                        "completion_tokens": response.usage_metadata.get("output_tokens", 0) if response.usage_metadata else 0,
                        "model": "gpt-4o-mini",
                    }
                }
            except Exception as e:
                logger.error(f"LLM code generation failed: {e}")
                code_output = _generate_demo_code(task)
                token_usage = {}
        else:
            # No API key — generate demo code
            code_output = _generate_demo_code(task)
            token_usage = {}

    except Exception as e:
        logger.error(f"Code agent error: {e}")
        code_output = f"Code generation encountered an error: {str(e)}"
        token_usage = {}

    latency = int((time.time() - start_time) * 1000)

    metadata = state.get("metadata", {})
    metadata["coder_latency_ms"] = latency
    existing_tokens = metadata.get("token_usage", {})
    existing_tokens.update(token_usage)
    metadata["token_usage"] = existing_tokens

    agent_outputs["coder"] = code_output

    return {
        **state,
        "current_agent": "coder",
        "status": "executing",
        "agent_outputs": agent_outputs,
        "iteration_count": iteration_count,
        "metadata": metadata,
        "messages": state["messages"] + [
            AIMessage(content=code_output, name="coder")
        ],
    }


def _clean_code(code: str) -> str:
    """Remove markdown code fences from LLM output."""
    code = code.strip()
    if code.startswith("```python"):
        code = code[len("```python"):].strip()
    elif code.startswith("```"):
        code = code[3:].strip()
    if code.endswith("```"):
        code = code[:-3].strip()
    return code


def _generate_demo_code(task: str) -> str:
    """Generate demo code when no API key is available."""
    demo_code = '''# Demo code generated for task analysis
import json
from datetime import datetime

def analyze_task(task_description):
    """Analyze and break down a task into components."""
    words = task_description.lower().split()
    
    analysis = {
        "task": task_description[:100],
        "word_count": len(words),
        "timestamp": datetime.now().isoformat(),
        "complexity": "medium" if len(words) > 10 else "simple",
        "key_topics": list(set(w for w in words if len(w) > 4))[:5],
        "recommendation": "Task analyzed successfully. Ready for implementation."
    }
    
    return analysis

# Execute analysis
result = analyze_task("""''' + task[:200] + '''""")
print(json.dumps(result, indent=2))
'''

    # Actually execute it
    execution_result = execute_code.invoke({
        "code": demo_code,
        "language": "python",
    })

    return (
        f"### Approach\n"
        f"Generated a task analysis script to process the request.\n\n"
        f"### Code\n```python\n{demo_code}\n```\n\n"
        f"### Execution Output\n```\n{execution_result}\n```\n"
    )
