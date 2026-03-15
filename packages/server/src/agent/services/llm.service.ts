import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import axios from 'axios';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly openai: OpenAI;

  constructor() {
    // 读取 OPENAI_API_KEY 环境变量
    // const openaiApiKey = process.env.OPENAI_API_KEY;
    const qwenApiKey = process.env.QWEN_API_KEY;
    
    // 验证是否读取成功
    // if (!openaiApiKey) {
    //   console.error('❌ 未找到 OPENAI_API_KEY 环境变量，请检查配置！');
    //   process.exit(1); // 终止程序运行
    // }
    
    if (!qwenApiKey) {
      console.error('❌ 未找到 QWEN_API_KEY 环境变量，请检查配置！');
      process.exit(1); // 终止程序运行
    }
    
    // console.log('✅ 成功读取 API Key：', openaiApiKey.substring(0, 8) + '...'); // 只显示前8位，保护密钥
    console.log('✅ 成功读取 API Key：', qwenApiKey.substring(0, 8) + '...'); // 只显示前8位，保护密钥
    
    // const openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY,
    // });
    
    this.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.apiKey = qwenApiKey;
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
    });
  }

  async callOpenAI(messages: Array<ChatCompletionMessageParam>) : Promise<string> {
    try {
      // set a timeout for the OpenAI call (e.g., 30 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 30000)
      );

      const openaiPromise = this.openai.chat.completions.create({
        // model: "gpt-5-nano", // OPEN AI
        model: "qwen-plus",
        messages,
      });

      const result = await Promise.race([openaiPromise, timeoutPromise]) as any;
      console.log('✅ OpenAI API 调用成功：', result);
      return result.choices[0].message.content;
    } catch (error) {
      this.logger.error(`LLM 调用失败: ${error.message}`);
      throw new Error('大模型服务暂时不可用，日志已经记录'); // 返回空对象，避免程序崩溃
    }
  }


  /**
   * 调用大模型 API
   * @param messages 对话历史
   * @returns 大模型返回内容
   */
  async callLlm(messages: Array<{ role: string; content: string }>) {
    try {
      const response = await axios.post(
        `${this.baseUrl}`,
        {
          model: 'doubao-1.5-pro',
          messages,
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`LLM 调用失败: ${error.message}`);
      throw new Error('大模型服务暂时不可用');
    }
  }
}