# handleChat 中间过程返回计划

## 目标

让 `AgentController.handleChat()` 在处理用户请求时，能够将中间过程（如历史读取、模型调用、工具执行、图片下载等）通过 SSE 返回给前端，避免前端长时间等待最终结果。

## 现状问题

- 入口请求后，前端当前只能收到一个 `loading` 事件，然后等待直到最终结果返回。
- `onceAgent()` 内部有多个阶段，前端无法实时感知处理进度。
- 长对话、工具调用或图片生成时，用户体验较差。

## 预期结果

- 前端可以逐步接收以下状态：
  - 已保存用户消息
  - 正在读取历史
  - 正在构建模型输入
  - 正在调用模型
  - 发现工具调用/图片对话
  - 工具执行结果已返回
  - 图片下载/处理完成
  - 最终响应已生成
- 最终仍然返回标准机器人消息格式。

## 方案概要

1. 保留现有 SSE 连接机制。
2. 在 `AgentService.onceAgent()` 和相关辅助函数中，增加可选的进度事件回调 `onProgress`。
3. 关键节点触发 `onProgress({ type, message, step, data? })`。
4. `AgentController.handleChat()` 将 `res.write(...)` 发送中间事件，并在最终结果返回前继续保持连接。
5. 前端 `ChatWindow` 或 `InputSend` 订阅 SSE 事件，并根据 `type` 渲染进度信息。

## 详细计划

### 1. 设计 SSE 中间事件格式

建议统一事件体为 JSON：

- `type`: 字符串，区分事件类型，如 `loading`, `progress`, `tool`, `final`。
- `step`: 当前步骤名称，如 `save_message`, `read_history`, `call_model`, `tool_execute`。
- `message`: 可展示给用户的可读文案。
- `data?`: 可选字段，携带额外结构化信息，例如工具名称、图片 URL、模型名称等。

示例：
```json
{
  "type": "progress",
  "step": "read_history",
  "message": "正在读取会话历史...",
  "data": { "sessionId": "abc123" }
}
```

### 2. 后端改动点

#### 2.1 `AgentController.handleChat()`

- 在请求入口创建 SSE 发送函数 `sendSseEvent()`。
- 向 `onceAgent()` 传入 `onProgress` 回调。
- 通过 `res.write()` 发送每个中间事件。
- 保持原有最终消息保存与发送逻辑。

#### 2.2 `AgentService.onceAgent()`

- 添加 `onProgress` 参数到方法签名。
- 在关键节点调用：
  - 用户消息保存完成
  - 开始读取历史
  - 历史提取完成
  - 开始构造模型上下文
  - 调用模型前
  - 收到模型返回
  - 进入图片/视觉对话分支
  - 工具调用开始/结束
  - 图片下载开始/结束

#### 2.3 `LlmService.callOpenAI()`

- 在调用前发送 `model_call` 进度事件。
- 在返回后发送 `model_response` 事件。

#### 2.4 工具调用与图片处理

- 如果发现 `tool` 调用，发送 `tool_invocation` 事件。
- 调用完成后发送 `tool_result` 事件。
- 若下载图片，则发送 `image_download` / `image_ready` 事件。

#### 2.5 存储中间状态到本地会话 JSON

- 由于你希望“思考模式”能够看到完整内容，建议把关键中间事件也写入会话历史文件。
- 这种写法可以将 `progress` / `thinking` / `tool` 事件同步存到 `.chat/sessions/${sessionId}.json`。
- 推荐使用特殊 `role` 或 `ext.type` 来区分普通聊天消息和思考日志，例如：
  - `role: 'system'` 或 `role: 'assistant'`
  - `ext: { type: 'thinking', step: 'call_model', status: 'start' }`
- 只保存有价值的阶段性结果，避免过多无用信息刷屏历史文件。
- 最终前端“思考模式”可以读取这些消息，并在独立面板/折叠区展示完整过程。

### 3. 前端改动点

- `ChatWindow` 或 `Sidebar` 接收 SSE 事件。
- 解析 `type` 和 `step`，展示短文本进度提示。
- 可选：增加“处理中...”区域，显示最新几条中间事件。
- 依然保留最终消息入历史。

### 4. 实现方案优先级

1. 实现基础 SSE 进度事件框架。
2. 在 `handleChat()` 和 `onceAgent()` 关键节点发送事件。
3. 前端简单展示“当前进度”文本。
4. 扩展事件类型到工具调用、图片处理等。

## 风险与注意点

- SSE 连接需保持活跃，避免在中间阶段异常关闭。
- 事件发送频率不宜过高，避免前端弹窗刷屏。
- 需处理后端异常，保证异常也能通过 SSE 发送给前端。
- 现有前端仅消费最终消息，需要同步修改订阅逻辑。

## 后续任务

1. 编写后端 `onProgress` 回调类型与公共事件 payload 定义。
2. 修改 `AgentController.handleChat()` 注入并发送中间事件。
3. 修改 `AgentService.onceAgent()` 添加事件触发点。
4. 修改前端 SSE 订阅并展示进度。
5. 测试在普通对话、图片对话、工具调用场景下的中间事件。
