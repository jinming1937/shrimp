import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import axios from 'axios';
import { ChatCompletionMessageParam } from 'openai/resources';

const RADIO_API_CONFIG = {
  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  model: 'qwen3-tts-instruct-flash',
};

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

  async callOpenAI(
    messages: Array<ChatCompletionMessageParam>,
    model: string,
  ): Promise<string> {
    try {
      // set a timeout for the OpenAI call (e.g., 30 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 30000),
      );

      const openaiPromise = this.openai.chat.completions.create({
        // model: "gpt-5-nano", // OPEN AI
        model,
        messages,
      });

      const result = (await Promise.race([
        openaiPromise,
        timeoutPromise,
      ])) as any;
      console.log('✅ OpenAI API 调用成功：', result);
      return result.choices[0].message.content;
    } catch (error) {
      this.logger.error(`LLM 调用失败: ${error.message}`);
      throw new Error('大模型服务暂时不可用，日志已经记录'); // 返回空对象，避免程序崩溃
    }
  }

  /**
   * 文本转语音接口 || 非大语言模型 || API 接口示例
   * @param text 文本转语音
   * @returns
   */
  async callVoiceAPI(text: string) {
    if (!text) {
      console.error('TTS request received with empty text');
      return 'error: text is empty';
    }
    console.log('TTS request received with text:', text);
    try {
      const response = await axios.post(
        RADIO_API_CONFIG.url,
        {
          model: RADIO_API_CONFIG.model,
          input: {
            text: text,
            voice: 'Chelsie', // "Chelsie"
            language_type: 'Chinese', // "English"
          },
          // parameters: {
          //   sample_rate: 24000,
          //   format: 'mp3',
          // },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          // responseType: 'arraybuffer', //
          timeout: 10000, // 10秒超时
        },
      );

      console.log('TTS API response received, status:', response.data);
      // 将音频数据转换为 base64
      // React Native 中使用 btoa 进行 base64 编码
      // const audioData = response.data;
      console.log('TTS API response:', response.data);
      return { resUrl: response.data.output.audio.url };
    } catch (error) {
      console.error('TTS API error:', error);
    }
  }

  async callImg2SVGLLM() {
    // qwen-vl-plus
    const model = 'qwen-vl-plus';
    const completion = await this.openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: '你是谁？' }],
    });
    console.log(completion.choices[0].message.content);
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
