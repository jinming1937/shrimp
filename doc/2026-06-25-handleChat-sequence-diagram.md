# handleChat 时序图

下面的时序图展示了 `handleChat()` 的调用链路，包括普通文本对话与图片对话两个分支。

```mermaid
sequenceDiagram
    participant Frontend
    participant AgentController
    participant AgentService
    participant LlmService
    participant FileStorage
    participant ToolRunner

    Frontend->>AgentController: POST /api/agent/chat
    AgentController->>AgentService: saveMessage(user message)
    AgentService->>FileStorage: write session history
    AgentController-->>Frontend: SSE Loading
    AgentController->>AgentService: onceAgent(data, sessionId)
    AgentService->>AgentService: readHistory(sessionId)
    AgentService->>FileStorage: read .chat/sessions/sessionId.json
    FileStorage-->>AgentService: session history

    alt History contains image_url
      AgentService->>AgentService: build single visionMessage
      AgentService->>LlmService: callOpenAI([visionMessage], wan2.7-image)
      LlmService-->>AgentService: thinking
      alt thinking contains "tool"
        AgentService->>AgentService: parse toolCall
        AgentService->>ToolRunner: runToolWithRetry(gen_img params)
        ToolRunner->>LlmService: callImageGenLLM(params)
        LlmService-->>ToolRunner: image response
        ToolRunner-->>AgentService: output_media
        AgentService-->>AgentController: { output_media }
      else no tool
        AgentService-->>AgentController: { output_text: thinking }
      end
    else Text-only dialogue
      AgentService->>AgentService: build chatContext from history
      AgentService->>LlmService: callOpenAI(chatContext, qwen3.6-plus-2026-04-02)
      LlmService-->>AgentService: finalAnswer
      AgentService-->>AgentController: { output_text: finalAnswer }
    end

    AgentController->>AgentService: saveMessage(bot message)
    AgentService->>FileStorage: append session history
    AgentController-->>Frontend: SSE final message
```

## 说明

- `AgentController.handleChat()` 是入口，负责接收请求、写入用户消息、发送 SSE loading、调用 `onceAgent()`、保存机器人消息、返回最终结果。
- `AgentService.onceAgent()` 读取历史并判断是否进入图片对话分支。
- 图片分支只发送一个 `visionMessage` 给 `wan2.7-image`，并在返回中检查是否需要调用 `gen_img` 工具。
- 普通文字分支使用最近 8 条历史消息，调用 `qwen3.6-plus-2026-04-02`。
- `LlmService.callOpenAI()` 负责调用 OpenAI SDK 并兼容返回的 `message.content` 结构。
- 如果图片工具返回 `output_media`，最终会下载图片并将图像附加到历史消息中。
