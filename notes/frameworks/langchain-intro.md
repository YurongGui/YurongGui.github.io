---
title: LangChain 入门
date: 2024-05-03
tags: [框架, LangChain, Python]
---

# LangChain 入门

## 简介

LangChain 是目前最流行的 Agent/LLM 应用开发框架，提供了构建 Agent 所需的各类抽象：链（Chain）、工具（Tool）、记忆（Memory）、向量检索（Retriever）等。

## 安装

```bash
pip install langchain langchain-openai
```

## 核心概念

### 1. Chain（链）

Chain 是将多个组件串联起来的基础单元：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个 Agent 学习助手"),
    ("human", "{question}")
])

chain = prompt | llm
result = chain.invoke({"question": "什么是 ReAct？"})
print(result.content)
```

### 2. Tool（工具）

工具是 Agent 与外部世界交互的接口：

```python
from langchain_core.tools import tool

@tool
def search_web(query: str) -> str:
    """搜索互联网上的信息"""
    # 实际使用时接入搜索 API
    return f"搜索结果：{query} 相关内容..."

@tool
def calculator(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))
```

### 3. Agent 组装

```python
from langchain.agents import create_tool_calling_agent, AgentExecutor

tools = [search_web, calculator]

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = executor.invoke({"question": "2024年最新的 Agent 框架有哪些？"})
```

## LCEL（LangChain Expression Language）

LCEL 是 LangChain 的声明式链式语法，用 `|` 管道符连接组件：

```python
chain = prompt | llm | output_parser
```

优点：
- 支持流式输出（streaming）
- 自动支持异步（async）
- 易于组合和复用

## 常见踩坑

**问题 1：工具描述写得太简单**
LLM 根据工具的 docstring 决定何时调用哪个工具，描述越清晰，调用越准确。

**问题 2：没有设置 max_iterations**
Agent 可能陷入无限循环，务必设置：
```python
AgentExecutor(agent=agent, tools=tools, max_iterations=10)
```

**问题 3：忽略错误处理**
```python
AgentExecutor(agent=agent, tools=tools, handle_parsing_errors=True)
```

## 参考资料

- [LangChain 官方文档](https://python.langchain.com/)
- [LangChain GitHub](https://github.com/langchain-ai/langchain)
