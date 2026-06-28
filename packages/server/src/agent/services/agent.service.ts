import { Injectable, Logger } from '@nestjs/common';
import { IImageContent, ITextContent, LlmService } from './llm.service';
import { calculator } from '../tools/calculator.tool';
import { getTime } from '../tools/time.tool';
import { promises as fs, readFileSync } from 'fs';
import * as path from 'path';
import {
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
} from 'openai/resources';
import { WeatherService } from './weather.service';
import { ISendExt, IProgressEvent, OnProgressCallback } from 'src/types';
import axios from 'axios';

type ChatCompletionBasicMessageParam =
  | ChatCompletionSystemMessageParam
  | ChatCompletionUserMessageParam
  | ChatCompletionAssistantMessageParam;


// export interface IAgentGenImageMessage {
//   context: Array<{ user: string; content: Array<{ text: string} | { image: string; }> }>
// }

const encodeImage = (imagePath) => {
    const imageFile = readFileSync(imagePath);
    return imageFile.toString('base64');
  };

const genImgContent = (data, imgDir) => {
  const imgName = data.ext.url?.split('/').pop() || '';
  console.log('imgName', imgName);
  const imgPath = path.join(imgDir, imgName);
  return {
    type: data.ext.type,
    image_url: { url: `data:image/png;base64,${encodeImage(imgPath)}` },
  };
}

const genVisionImageContent = (data, imgDir) => {
  const imgName = data.ext.url?.split('/').pop() || '';
  console.log('vision imgName', imgName);
  const imgPath = path.join(imgDir, imgName);
  return {
    type: 'image_url' as const,
    image_url: {
      url: `data:image/png;base64,${encodeImage(imgPath)}`,
    },
  };
}

const sessionMsgToModelMsg: (msg: { text: string; role: string; ext?: ISendExt }, imgDir: string) => ChatCompletionBasicMessageParam = (msg, imgDir) => {
  let content: Array<ChatCompletionContentPartImage | ChatCompletionContentPartText> = [];
  if (msg.text) {
    content.push({ text: msg.text, type: 'text' });
  }
  if (msg.ext && msg.ext.type === 'image_url' && msg.ext.url) {
    if (msg.role === 'user') {
      content.push(genImgContent(msg, imgDir));
    }
    return {
      role: msg.role as 'user',
      content,
    } as ChatCompletionUserMessageParam;
  }

  if (msg.role === 'system') {
    return {
      role: 'system',
      content: msg.text,
    } as ChatCompletionSystemMessageParam;
  }

  if (msg.role === 'assistant') {
    return {
      role: 'assistant',
      content: msg.text,
    } as ChatCompletionAssistantMessageParam;
  }

  return {
    role: 'user',
    content: msg.text,
  } as ChatCompletionUserMessageParam;
}

type QwenVisionMessage = {
  role: 'user';
  content: Array<{
    type: 'text';
    text: string;
  } | {
    type: 'image_url';
    image_url: {
      url: string;
    };
  }>;
};

const sessionMsgToVisionMsg: (msg: { text: string; role: string; ext?: ISendExt }, imgDir: string) => QwenVisionMessage = (msg, imgDir) => {
  if (msg.ext && msg.ext.type === 'image_url' && msg.ext.url) {
    return {
      role: 'user',
      content: [genVisionImageContent(msg, imgDir)],
    };
  }

  return {
    role: 'user',
    content: [{ type: 'text', text: msg.text }],
  };
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
    console.log('Agent thought:', typeof thought === 'string' ? thought.substring(0, 100) + '...' : String(thought)); // log the beginning of the thought for debugging
    history.push({ role: 'assistant', content: thought });

    // 3. 第二步：决定动作（调用工具/直接回答）
    const action = await this.llmService.callLlm(history);
    console.log('Agent action:', typeof action === 'string' ? action.substring(0, 100) + '...' : String(action)); // log the beginning of the action for debugging
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

  async onceAgent(
    data: { text: string; role: string; ext?: ISendExt },
    sessionId: string,
    onProgress?: OnProgressCallback,
  ) {
    const progress = async (event: IProgressEvent) => {
      if (onProgress) {
        await onProgress(event);
      }
    };

    try {
      const chatContext: ChatCompletionMessageParam[] = [];
      const history = await this.readHistory(sessionId);
      console.log('history', history.length);

      await progress({
        type: 'progress',
        step: 'read_history',
        message: `已读取会话历史，共 ${history.length} 条消息。`,
        data: { count: history.length },
      });

      // 视觉理解模型
      const VERSION_MODEL = 'qwen3.7-plus'; // 'wan2.7-image'; // 'qwen-vl-plus';
      // 对话模型
      const CHAT_MODEL = 'deepseek-v4-flash'; //  'qwen3.6-plus-2026-04-02'; // 'qwen-plus';
      let model = CHAT_MODEL;
      const firstImage = history.find(msg => msg.ext && msg.ext.type === 'image_url' && msg.ext.url);
      const imgList = history.filter(msg => msg.ext?.type === 'image_url' && msg.ext.url).map(msg => msg.ext!.url).map((i, index) => index);
      if (firstImage) {
        model = VERSION_MODEL;
      }
      if (model === VERSION_MODEL) {
        const imageHistory = history.filter(
          (msg) => msg.ext && msg.ext.type === 'image_url' && msg.ext.url,
        );
        const lastImage = imageHistory.length > 0
          ? imageHistory[imageHistory.length - 1]
          : data.ext?.type === 'image_url'
          ? data
          : null;
        const currentText = data.text || history.filter((msg) => !msg.ext || msg.ext.type === 'text').map((msg) => msg.text).join('\n');
        const visionText = `当前对话包含图片信息，图片序号列表：${JSON.stringify(imgList)}。
判断用户意图是否为图片生成或图片修改：
- 如果是，请判断要处理的图片索引，写入 imgIndex（从 0 开始，通常是图片序号列表最后一个索引）。
- 仅当确认需要调用图片工具时才调用 gen_img，返回结果必须是严格 JSON：{"tool":"gen_img","imgIndex":0,"params":[{"role":"user","content":[{"text":"prompt"},{"image":"xxx"}]}]}。
- 综合考虑用户的提示和对话上下文，整理成一个新的prompt传给text字段。
- params 是一组消息内容，image字段为占位字段，不需要传递图片URL；text字段需要传递用户的生成或修改提示文案，需要综合多个上下文的文案。content里的 text 和 image 必须分开，[{"text": ""},{"image": ""}]，绝对不能是[{"text": "", image: ""}]。
- JSON格式必须是合法JSON
- “上一个”“前一个”“前面”等指代通常是图片序号列表中倒数第二张图片。
- 如果无法确认具体图片，请直接询问用户：请问您要修改哪一张图片？等待用户回复后再调用工具。
- 如果用户意图不是生成或修改图片，则不要调用工具，直接给出正常回答。`;
        const content: Array<ChatCompletionContentPartText | ChatCompletionContentPartImage> = [];
        if (lastImage) {
          content.push(genVisionImageContent(lastImage, this.imgDir));
        }
        content.push({
          type: 'text',
          text: currentText ? `${visionText}\n用户输入：${currentText}` : visionText,
        });
        const visionMessage: ChatCompletionUserMessageParam = {
          role: 'user',
          content,
        };
        chatContext.push(visionMessage);
        if (chatContext.length !== 1) {
          throw new Error(`vision model requires exactly 1 top-level message; got ${chatContext.length}`);
        }
      } else if (history.length > 0) {
        history
          .filter((msg) => msg.ext?.type !== 'thinking')
          .slice(-8)
          .forEach((msg, index) => {
            console.log('历史消息', msg, index);
            if (msg.role === 'assistant' && msg.ext?.type === 'image_url') {
              return;
            }
            chatContext.push(sessionMsgToModelMsg(msg, this.imgDir));
          });
      } else {
        chatContext.push(sessionMsgToModelMsg(data, this.imgDir));
      }
      console.log('model: ', model);

      await progress({
        type: 'progress',
        step: 'build_context',
        message: `正在构造模型输入，使用模型 ${model}。`,
        data: { model },
      });

      if (model === VERSION_MODEL) {
        await progress({
          type: 'model',
          step: 'model_call',
          message: `正在调用视觉模型 ${model}。`,
          data: { model },
        });

        const thinking = await this.llmService.callOpenAI(chatContext, model);
        const thinkingText = typeof thinking === 'string' ? thinking : '';
        await progress({
          type: 'model',
          step: 'model_response',
          message: `视觉模型响应已返回。`,
          data: { model, length: thinkingText.length },
        });
        console.log('Agent thinking:', model, thinkingText.slice(0, 1000) + '...'); // log the beginning of the thought for debugging
        let observation;
        if (thinking.includes('"tool"')) {
          await progress({
            type: 'tool',
            step: 'tool_detected',
            message: '检测到工具调用，将执行工具。',
          });

          const list = history.filter(i => !i.ext || i.ext.type === 'text').map((msg, index) => {
            return {
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.text,
            }
          });
          list.unshift({
            role: 'system',
            content: `当前对话是修改图片的对话， 请综合整理一下，生成一个prompt，直接返回prompt文字。`,
          })
          const promptText = await this.llmService.callOpenAI(list, CHAT_MODEL);
          console.log('Tool call detected in thinking.', thinking); // log when a tool call is detected
          console.log('prompt text:', promptText); // log the original tool call instruction for debugging
          let toolCall
          try {
            toolCall = JSON.parse(thinking);
          } catch (e) {
            const imgList = history.filter(msg => msg.ext && msg.ext.type === 'image_url' && msg.ext.url);
            const lastImage = imgList.slice(-1)[0];
            toolCall = {
              tool: 'gen_img',
              imgIndex: imgList.length > 0 ? imgList.length - 1 : 0,
              params: [{
                role: 'user',
                content: [
                  {
                    text: promptText,
                  },
                  {
                    image: genImgContent(lastImage, this.imgDir).image_url.url,
                  },
                ],
              }]
            };
          }
          
          try {
            await progress({
              type: 'tool',
              step: 'tool_execute',
              message: `正在执行工具 ${toolCall.tool}。`,
              data: { tool: toolCall.tool },
            });
            console.log('Tool call:', toolCall.params);
            if (toolCall.params.length > 0) {
              const imageIndex = toolCall.imgIndex || 0;
              toolCall.params.forEach((param, index) => {
                console.log(`image index`, imageIndex);
                console.log(`Tool call param ${index}:`, param);
                param.content.forEach((element, ind) => {
                  if ('image' in element) {
                    const image = history.filter(msg => msg.ext && msg.ext.type === 'image_url' && msg.ext.url)[imageIndex];
                    console.log('Matched image for tool call:', image);
                    element.image = genImgContent(image || firstImage, this.imgDir).image_url.url;
                  }
                  if ('text' in element) {
                    element.text = promptText || element.text + ' ' + data.text;
                  }
                });
                console.log(`Processed tool call param ${index}:`, param.content); // log the processed tool call param for debugging
              });
            }
            console.log('Final tool call params after processing:', toolCall.params);
            observation = await this.runToolWithRetry(
              toolCall.tool,
              toolCall.params,
            );
            await progress({
              type: 'tool',
              step: 'tool_result',
              message: `工具执行完成：${toolCall.tool}。`,
              data: { tool: toolCall.tool, observation },
            });
          } catch (e) {
            console.error('Tool call error:', e);
            observation = '工具调用格式错误';
            await progress({
              type: 'error',
              step: 'tool_error',
              message: '工具调用失败。',
              data: { error: (e as any).message },
            });
          }
        }
        if (observation && observation !== '工具调用格式错误') {
          return { output_media: observation };
        } else {
          return { output_text: thinking };
        }
      } else {
        await progress({
          type: 'model',
          step: 'model_call',
          message: `正在调用对话模型 ${model}。`,
          data: { model },
        });
        const finalAnswer = await this.llmService.callOpenAI(chatContext, model);
        await progress({
          type: 'model',
          step: 'model_response',
          message: `对话模型响应已返回。`,
          data: { model, length: finalAnswer.length },
        });
        console.log('Agent final answer:', typeof finalAnswer === 'string' ? finalAnswer.substring(0, 100) + '...' : String(finalAnswer)); // log the beginning of the final answer for debugging
        return { output_text: finalAnswer };
      }
    } catch (error: unknown) {
      await progress({
        type: 'error',
        step: 'agent_error',
        message: `Agent 执行出错：${(error as any).message || '未知错误'}`,
        data: { error: (error as any).message },
      });
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
    await fs.mkdir(sessionsDir, { recursive: true })
      .then(() => console.log('📁 Session storage ready at', sessionsDir))
      .catch(console.error);
    const filePath = path.join(sessionsDir, `${sessionId}.json`);
    let msgs: Array<{ id: string; text: string; role: string; ext?: ISendExt }> = [];
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
      return JSON.parse(content) as Array<{ id: string; text: string; role: string; ext?: ISendExt }>;
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
