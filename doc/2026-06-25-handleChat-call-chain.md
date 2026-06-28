# handleChat 调用链路

## 1. 入口：`AgentController.handleChat()`

- 接收 POST `/api/agent/chat`
- 请求体包含：
  - `message`
  - `sessionId`
  - `role`
  - `ext?`
- 流程：
  1. 生成用户消息 ID
  2. 保存用户消息到会话历史：`agentService.saveMessage(...)`
  3. 发送 SSE loading 消息
  4. 调用：
     - `agentService.onceAgent({ text: message, role, ext }, sessionId)`
  5. 处理 `onceAgent()` 返回值
  6. 保存机器人消息
  7. 发送最终 SSE 回应

## 2. 核心：`AgentService.onceAgent()`

### 2.1 读取历史

- 调用 `this.readHistory(sessionId)`
- 读取 `.chat/sessions/${sessionId}.json`
- 如果不存在，返回 `[]`

### 2.2 模型判断

- 默认模型：`CHAT_MODEL = 'qwen3.6-plus-2026-04-02'`
- 图片模型：`VERSION_MODEL = 'wan2.7-image'`
- 如果历史中存在任何 `ext.type === 'image_url'`，则切换为图片模型

### 2.3 普通文字对话分支

- 如果不是图片模型：
  - 读取最近 8 条历史（不包含 assistant 的图片消息）
  - 调用 `sessionMsgToModelMsg()` 转换为 OpenAI 消息格式
  - 调用 `llmService.callOpenAI(chatContext, model)`
  - 返回 `{ output_text: finalAnswer }`

### 2.4 图片 / 视觉对话分支

- 构造单条 `visionMessage`
- `visionMessage.content` 包含：
  - 可选图片 content
  - 只有一条 text content
- 强制检查：`chatContext.length === 1`
- 调用 `llmService.callOpenAI(chatContext, model)`

#### 2.4.1 包含工具调用时

- 如果 `thinking.includes('"tool"')`
  - 解析 `thinking` 为 JSON
  - 失败时用辅助 prompt 生成 `promptText`
  - 构造 `toolCall`，并补齐图片 URL
  - 调用 `runToolWithRetry(toolCall.tool, toolCall.params)`
  - 返回 `{ output_media: observation }`

#### 2.4.2 不包含工具调用时

- 返回 `{ output_text: thinking }`

## 3. OpenAI 调用：`LlmService.callOpenAI()`

- 使用 OpenAI SDK：`openai.chat.completions.create({ model, messages })`
- 兼容返回格式：
  - `string` 直接返回
  - 数组时提取 `text` / `image`
  - 对象时提取 `text`
- 该处理避免了 `substring` 或 `message.content` 未定义的异常

## 4. 结果返回与保存

### 4.1 处理 `output_media`

- 如果 `result` 包含 `output_media`
  - 从 `content` 中提取 `image` 与 `text`
  - 下载图片：`agentService.downloadImage(image, filename)`
  - 生成 `ext = { type: 'image_url', url: '/api/img/...' }`

### 4.2 处理文本结果

- 如果没有 `output_media`
  - `botText = result.output_text || ''`

### 4.3 保存机器人消息

- 调用 `agentService.saveMessage(sessionId, { id, text: botText, role: 'assistant', ext })`

### 4.4 发送 SSE 最终结果

- `res.write(...)` 返回 `{ id, text: botText, role: 'assistant', ext }`

## 5. 相关辅助方法

- `saveMessage(sessionId, message)`
  - 创建目录 `.chat/sessions`
  - 读取并追加会话文件
- `readHistory(sessionId)`
  - 读取会话 JSON，返回历史数组
- `runToolWithRetry(toolName, params)`
  - 封装工具重试逻辑

## 6. 关键关注点

- `handleChat()` 是入口，负责：
  - 请求接收
  - 用户消息保存
  - SSE loading
  - 调用 `onceAgent()`
  - 保存与发送机器人结果
- `onceAgent()` 决定是否进入图片模式，并负责消息构造与模型调用
- `callOpenAI()` 负责兼容不同返回内容格式，避免 `undefined.substring` 错误
- 图片模式下，`visionMessage` 只能包含一条用户消息，且仅一条 text content
