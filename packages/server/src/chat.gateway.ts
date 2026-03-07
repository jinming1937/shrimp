import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import OpenAI from "openai";
import { promises as fs } from 'fs';
import * as path from 'path';

// 读取 OPENAI_API_KEY 环境变量
const openaiApiKey = process.env.OPENAI_API_KEY;
const qwenApiKey = process.env.QWEN_API_KEY;

// 验证是否读取成功
if (!openaiApiKey) {
  console.error('❌ 未找到 OPENAI_API_KEY 环境变量，请检查配置！');
  process.exit(1); // 终止程序运行
}

if (!qwenApiKey) {
  console.error('❌ 未找到 QWEN_API_KEY 环境变量，请检查配置！');
  process.exit(1); // 终止程序运行
}

console.log('✅ 成功读取 API Key：', openaiApiKey.substring(0, 8) + '...'); // 只显示前8位，保护密钥
console.log('✅ 成功读取 API Key：', qwenApiKey.substring(0, 8) + '...'); // 只显示前8位，保护密钥

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const openai = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// directory where session history files will be stored
const sessionsDir = path.resolve(__dirname, '../../../.chat/sessions');
fs.mkdir(sessionsDir, { recursive: true })
  .then(() => console.log('📁 Session storage ready at', sessionsDir))
  .catch(console.error);

async function saveMessage(sessionId: string, message: { id: string; text: string; role: 'user'|'robot' }) {
  const filePath = path.join(sessionsDir, `${sessionId}.json`);
  let msgs: Array<{ id: string; text: string; role: string }> = [];
  try {
    const existing = await fs.readFile(filePath, 'utf-8');
    msgs = JSON.parse(existing);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to read history for', sessionId, err);
    }
  }
  msgs.push(message);
  await fs.writeFile(filePath, JSON.stringify(msgs, null, 2), 'utf-8');
}

async function readHistory(sessionId: string) {
  const filePath = path.join(sessionsDir, `${sessionId}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as Array<{ text: string; role: string }>;
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to read history for', sessionId, err);
    }
    return [];
  }
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify allowed origins
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { message: string; sessionId: string; role: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    // generate unique message id
    const userMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // store the user's message immediately
    await saveMessage(data.sessionId, { id: userMessageId, text: data.message, role: data.role as 'user' });

    // generate a unique message ID for the bot response
    const botMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // immediately send a loading message
    this.server.to(data.sessionId).emit('message', {
      message: { id: botMessageId, text: 'Loading...', role: 'robot', isLoading: true },
      sessionId: data.sessionId,
      clientId: client.id,
    });

    try {
      // set a timeout for the OpenAI call (e.g., 30 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 30000)
      );
      console.log('🤖 Sending message to OpenAI:', data.message.substring(0, 10) + '...');

      const openaiPromise = openai.responses.create({
        // model: "gpt-5-nano",
        model: "qwen-plus",
        input: data.message,
        store: true,
      });

      const result = await Promise.race([openaiPromise, timeoutPromise]) as any;

      // save the bot response as well
      const botText = result.output_text || '';
      await saveMessage(data.sessionId, { id: botMessageId, text: botText, role: 'robot' });

      console.log(botText.substring(0, 10) + '...'); // log the beginning of the response for debugging
      // Broadcast the response back to the room, replacing the loading
      this.server.to(data.sessionId).emit('message', {
        message: { id: botMessageId, text: botText, role: 'robot' },
        sessionId: data.sessionId,
        clientId: client.id,
      });
    } catch (err) {
      console.error('Error during OpenAI call:', err);
      await saveMessage(data.sessionId, { id: botMessageId, text: 'ai response timeout', role: 'robot' });
      this.server.to(data.sessionId).emit('message', {
        message: { id: botMessageId, text: 'ai response timeout', role: 'robot' },
        sessionId: data.sessionId,
        clientId: client.id,
      });
    }
  }

  @SubscribeMessage('joinSession')
  async handleJoinSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    client.join(sessionId);
    // no longer send history via websocket, client will fetch via HTTP
    client.emit('joined', { sessionId });
  }
}