import { Injectable, Logger } from '@nestjs/common';
import { IImageContent, ITextContent, LlmService } from './llm.service';
import { calculator } from '../tools/calculator.tool';
import { getTime } from '../tools/time.tool';
import { promises as fs, readFileSync } from 'fs';
import * as path from 'path';
import { ChatCompletionContentPart, ChatCompletionContentPartImage, ChatCompletionContentPartText, ChatCompletionMessageParam } from 'openai/resources';
import { WeatherService } from './weather.service';
import { ISendExt } from 'src/types';
import axios from 'axios';

// export interface IAgentGenImageMessage {
//   context: Array<{ user: string; content: Array<{ text: string} | { image: string; }> }>
// }

const encodeImage = (imagePath) => {
    const imageFile = readFileSync(imagePath);
    return imageFile.toString('base64');
  };

const genImgContent = (data, imgDir) => {
  const content: ChatCompletionContentPartImage[] = [];
  const imgName = data.ext.url?.split('/').pop() || '';
  console.log('imgName', imgName);
  const imgPath = path.join(imgDir, imgName);
  content.push({
    type: data.ext.type,
    image_url: {"url": `data:image/png;base64,${encodeImage(imgPath)}`},
  });

  return content;
}

const sessionMsgToModelMsg: (msg: { text: string; role: string, ext: ISendExt }, imgDir: string) => ChatCompletionMessageParam = (msg, imgDir) => {
  let content: Array<ChatCompletionContentPartImage | ChatCompletionContentPartText> = [];
  if (msg.text) {
    content.push({ text: msg.text, type: 'text' });
  }
  if (msg.ext && msg.ext.type !== 'text' && msg.ext.url) {
    content.push(...genImgContent(msg, imgDir));
    return {
      role: msg.role as 'user',
      content,
    };
  } else {
    return {
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.text,
    };
  }
}

@Injectable()
export class AgentService {
  private readonly sessionsDir: string;
  private readonly imgDir: string;
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly weatherService: WeatherService,
  ) {
    this.sessionsDir = path.resolve(__dirname, '../../../../../.chat/sessions');
    this.imgDir = path.resolve(__dirname, '../../../../../.chat/imgs');
  }

  /**
   * 执行 Agent 思考循环（ReAct 范式）
   * @param userInput 用户输入
   * @returns Agent 执行结果
   */
  async runAgent(userInput: string) {
    // 1. 初始化对话历史（System Prompt 定义 Agent 行为）
    const history = [
      {
        role: 'system',
        content: `你是一个基于 ReAct 范式的 AI 智能体，严格遵循：思考→行动→观察→总结。
可用工具：
- calculator: 计算（参数：a, b, op（add/sub/mul/div））
- time: 获取当前时间（无参数）
- weather: 获取天气（无参数）
工具调用格式必须是 JSON：{"tool":"工具名","params":{"key":value}}`,
      },
      { role: 'user', content: userInput },
    ];

    // 2. 第一步：思考
    const thought = await this.llmService.callLlm(history);
    console.log('Agent thought:', thought.substring(0, 100) + '...'); // log the beginning of the thought for debugging
    history.push({ role: 'assistant', content: thought });

    // 3. 第二步：决定动作（调用工具/直接回答）
    const action = await this.llmService.callLlm(history);
    console.log('Agent action:', action.substring(0, 100) + '...'); // log the beginning of the action for debugging
    let observation = '';

    // 解析工具调用指令
    if (action.includes('"tool"')) {
      try {
        const toolCall = JSON.parse(action);
        observation = await this.runToolWithRetry(
          toolCall.tool,
          toolCall.params,
        );
      } catch (e) {
        observation = '工具调用格式错误';
      }
    }

    // 4. 第三步：结合观察结果生成最终回答
    history.push({ role: 'system', content: `观察结果：${observation}` });
    const finalAnswer = await this.llmService.callLlm(history);
    console.log('Agent final answer:', finalAnswer.substring(0, 100) + '...'); // log the beginning of the final answer for debugging
    return {
      thought, // 思考过程
      action, // 执行动作
      observation, // 工具返回结果
      finalAnswer, // 最终回答
    };
  }

  async runAgentByAct(data: { text: string; role: string, ext: ISendExt }, sessionId: string) {
    const chatContext: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `你是一个基于 ReAct 范式的 AI 智能体，严格遵循：思考→行动→观察→总结。
可用工具：
- calculator: 计算（参数：a, b, op（add/sub/mul/div））
- time: 获取当前时间（无参数）
- weather: 获取天气（无参数）
- gen_img: 根据文本生成图像（参数：prompt（prompt 类型：Array<{ user: string; content: Array<{ text: string} | { image: string; }> }>））
工具调用格式必须是 JSON：{"tool":"工具名","params":{"key":value}}。
最终输出结果的格式：
先给最简短的结果输出（不需要任何多余的解释）；
给出思考过程（思考过程必须包含工具调用的理由和使用的工具名称）；
总结最终回答（如果调用了工具，必须结合工具返回的结果进行总结；如果没有调用工具，直接总结回答）。
`,
      },
      { role: 'user', content: data.text },
    ];
    try {
      const thinking = await this.llmService.callOpenAI(chatContext, 'qwen-plus');
      console.log('Agent thinking:', thinking.substring(0, 100) + '...'); // log the beginning of the thought for debugging
      chatContext.push({ role: 'assistant', content: thinking });

      const action = await this.llmService.callOpenAI(chatContext, 'qwen-plus');
      console.log('Agent action:', action.substring(0, 100) + '...'); // log the beginning of the action for debugging
      let observation = '';

      if (action.includes('"tool"')) {
        try {
          const toolCall = JSON.parse(action);
          observation = await this.runToolWithRetry(
            toolCall.tool,
            toolCall.params,
          );
        } catch (e) {
          observation = '工具调用格式错误';
        }
      } else {
        // 如果没有工具调用，直接把 action 作为最终回答
        observation = action;
      }
      chatContext.push({ role: 'system', content: `观察结果：${observation}` });
      const finalAnswer = await this.llmService.callOpenAI(chatContext, 'qwen-plus');
      console.log('Agent final answer:', finalAnswer.substring(0, 100) + '...'); // log the beginning of the final answer for debugging

      return { output_text: finalAnswer, thinking, action, observation };
    } catch (error) {
      return { output_text: error };
    }
  }

  async onceAgent(data: { text: string; role: string, ext: ISendExt }, sessionId: string) {
    try {
      const chatContext: ChatCompletionMessageParam[] = [];
      const history = await this.readHistory(sessionId);
      console.log('history', history.length);
      let model = 'qwen-plus';
      let hasImageQuestion = false;
      if (history.length > 0) {
        history.slice(-8).forEach((msg) => {
          if (msg.ext && msg.ext.type === 'image_url' && msg.ext.url) {
            hasImageQuestion = true;
            model = 'qwen-vl-plus';
          }
          chatContext.push(sessionMsgToModelMsg(msg, this.imgDir));
        });
      } else {
        if (data.ext && data.ext.type === 'image_url' && data.ext.url) {
            hasImageQuestion = true;
            model = 'qwen-vl-plus';
          }
        chatContext.push(sessionMsgToModelMsg(data, this.imgDir));
      }

      if ((hasImageQuestion || model === 'qwen-vl-plus')) {
        return await this.callImageGenLLM(chatContext);
      } else {
        const finalAnswer = await this.llmService.callOpenAI(chatContext, model);
        console.log('Agent final answer:', finalAnswer.substring(0, 100) + '...'); // log the beginning of the final answer for debugging
        return { output_text: finalAnswer };
      }
    } catch (error: unknown) {
      return { output_text: (error as any).message || 'Agent 执行出错' };
    }
  }

  async callImageGenLLM(contents: ChatCompletionMessageParam[]) {
    try {
      const messages = contents.map((item) => {
        const content: Array<ITextContent | IImageContent> = [];
        if (typeof item.content === 'string') {
          content.push({ text: item.content as string });
        } else if (Array.isArray(item.content)) {
          item.content.forEach((part: any) => {
            if (part.type === 'text') {
              content.push({ text: part.text });
            } else if (part.type === 'image_url') {
              content.push({
                image: part.image_url.url,
              });
            }
          });
        }
        return {
          role: item.role as 'user' | 'assistant' | 'system',
          content: content,
        }
      })
      const response = await this.llmService.callImageGenLLM(messages);
      console.log('Image Gen LLM response:', response);
      return { output_media: response };
    } catch (error) {
      throw new Error((error as any).message || '图像生成出错');
      // return { output_media: (error as any).message || '图像生成出错' };
    }
  }

  async saveMessage(
    sessionId: string,
    message: {
      id: string;
      text: string;
      role: 'user' | 'robot' | 'system' | 'assistant';
      ext?: ISendExt;
    },
  ) {
    // directory where session history files will be stored
    const sessionsDir = this.sessionsDir;
    fs.mkdir(sessionsDir, { recursive: true })
      .then(() => console.log('📁 Session storage ready at', sessionsDir))
      .catch(console.error);
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

  async readHistory(sessionId: string) {
    const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Array<{ text: string; role: string, ext: ISendExt }>;
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to read history for', sessionId, err);
      }
      return [];
    }
  }

  /**
   * 统一工具调用入口
   */
  private async runTool(toolName: string, params: any) {
    switch (toolName) {
      case 'calculator':
        return calculator(params.a, params.b, params.op);
      case 'time':
        return getTime();
      case 'weather':
        return await this.weatherService.getWeather();
      case 'gen_img':
        return await this.llmService.callImageGenLLM(params);
      default:
        return `未找到工具：${toolName}`;
    }
  }

  // 工具调用加重试
  private async runToolWithRetry(toolName: string, params: any, retry = 2) {
    try {
      return await this.runTool(toolName, params);
    } catch (error) {
      this.logger.warn(`工具调用失败，重试剩余${retry}次：${toolName}`);
      if (retry > 0) {
        return await this.runToolWithRetry(toolName, params, retry - 1);
      }
      throw new Error(`工具调用失败：${toolName} → ${(error as any).message}`);
    }
  }

  async text2Voice(text: string) {
    return this.llmService.callVoiceAPI(text);
  }

  async img2SVG() {
    return this.llmService.callImg2SVGLLM();
  }

  async downloadImage(url: string, filename: string) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = response.data; // response.data is already a Buffer in Node.js
      const filePath = path.join(this.imgDir, filename);
      await fs.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      console.error('Failed to download image:', error);
      throw new Error('图片下载失败');
    }
  }
}
