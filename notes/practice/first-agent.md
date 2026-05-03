---
title: 构建第一个 Agent
date: 2024-05-03
tags: [实战, Python, OpenAI]
---

# 构建第一个 Agent

## 目标

用 OpenAI Function Calling 从零实现一个最简单的 Agent，理解底层运行机制，不依赖任何框架。

## 准备

```bash
pip install openai
export OPENAI_API_KEY="your-key-here"
```

## 实现思路

Agent 的核心是一个**循环**：

```
1. 把用户目标和工具描述发给 LLM
2. LLM 返回：直接回答 或 调用某个工具
3. 如果是工具调用 → 执行工具 → 把结果塞回上下文 → 回到步骤 1
4. 如果是直接回答 → 输出，结束
```

## 完整代码

```python
import json
import openai

client = openai.OpenAI()

# ===== 定义工具 =====
def get_weather(city: str) -> str:
    """模拟天气查询"""
    weather_data = {
        "北京": "晴天，气温 22°C",
        "上海": "多云，气温 25°C",
        "广州": "小雨，气温 28°C",
    }
    return weather_data.get(city, f"暂无 {city} 的天气数据")

def calculate(expression: str) -> str:
    """执行数学计算"""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"计算错误: {e}"

# 工具注册表
TOOLS_MAP = {
    "get_weather": get_weather,
    "calculate": calculate,
}

# OpenAI 工具描述格式
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "查询指定城市的天气情况",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称，如：北京、上海"}
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "执行数学计算，输入数学表达式字符串",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "数学表达式，如：(10 + 20) * 3"}
                },
                "required": ["expression"]
            }
        }
    }
]

# ===== Agent 主循环 =====
def run_agent(user_input: str, max_steps: int = 10):
    messages = [
        {"role": "system", "content": "你是一个智能助手，可以使用工具来帮助用户。"},
        {"role": "user", "content": user_input}
    ]

    for step in range(max_steps):
        print(f"\n--- Step {step + 1} ---")

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOLS_SCHEMA,
        )

        msg = response.choices[0].message
        finish_reason = response.choices[0].finish_reason

        # 直接回答，任务结束
        if finish_reason == "stop":
            print(f"✅ 最终回答: {msg.content}")
            return msg.content

        # 需要调用工具
        if finish_reason == "tool_calls":
            messages.append(msg)  # 把 assistant 消息加入上下文

            for tool_call in msg.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)

                print(f"🔧 调用工具: {fn_name}({fn_args})")
                result = TOOLS_MAP[fn_name](**fn_args)
                print(f"📤 工具结果: {result}")

                # 把工具结果加入上下文
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })

    return "达到最大步骤数，任务未完成"


# ===== 测试 =====
if __name__ == "__main__":
    run_agent("北京今天天气怎么样？另外帮我算一下 (100 + 50) * 2 等于多少")
```

## 运行结果

```
--- Step 1 ---
🔧 调用工具: get_weather({'city': '北京'})
📤 工具结果: 晴天，气温 22°C
🔧 调用工具: calculate({'expression': '(100 + 50) * 2'})
📤 工具结果: 300

--- Step 2 ---
✅ 最终回答: 北京今天天气晴朗，气温 22°C，适合出行。
另外，(100 + 50) × 2 = 300。
```

## 关键理解

这个例子虽然简单，但完整呈现了 Agent 的本质：

1. **LLM 不直接执行工具**，它只是"说"要调用什么工具、传什么参数
2. **我们的代码负责真正执行**，然后把结果告诉 LLM
3. **循环是关键**，LLM 可以在一次回复中调用多个工具，也可以多轮调用

下一步：尝试给 Agent 加上记忆（Memory），让它能记住上一次对话的内容。
