import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import axios from 'axios';
import { ChatCompletionMessageParam } from 'openai/resources';

export interface ITextContent {
  text: string;
}

export interface IImageContent {
  image: string; // 图片 URL
}

export interface IAgentGenImageMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<ITextContent | IImageContent>;
}

const RADIO_API_CONFIG = {
  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  // model: 'qwen3-tts-instruct-flash',
  model: 'paraformer-v2',
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
    const apiKey = process.env.QWEN_API_KEY;

    if (!apiKey) {
      console.error('❌ 未找到 QWEN_API_KEY 环境变量，请检查配置！');
      process.exit(1); // 终止程序运行
    }

    console.log('✅ 成功读取 API Key：', apiKey.substring(0, 8) + '...'); // 只显示前8位，保护密钥

    this.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
    });
    // const openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY,
    // });
  }

  /**
   * 通用的 OpenAI 调用接口，支持超时设置和错误处理
   * @param messages 消息历史
   * @param model 模型
   * @returns 消息
   */
  async callOpenAI(
    messages: Array<ChatCompletionMessageParam>,
    model: string,
  ): Promise<string> {
    console.log('Calling OpenAI with model:', model);
    console.log('Messages:', messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.slice(0, 10) : '非文本内容' })));
    console.log('bytes:', JSON.stringify(messages).length);
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
      const message = result?.choices?.[0]?.message;
      if (!message) {
        throw new Error('OpenAI response missing message');
      }
      const content = message.content ?? (message as any).text ?? message;
      if (content == null) {
        this.logger.warn('OpenAI response has no content, returning empty string', { message });
        return '';
      }
      if (typeof content === 'string') {
        return content;
      }
      if (Array.isArray(content)) {
        const text = content
          .map((item) => {
            if (item && typeof item === 'object') {
              if ('text' in item && typeof item.text === 'string') {
                return item.text;
              }
              if ('image' in item && typeof item.image === 'string') {
                return item.image;
              }
              if ('content' in item && typeof item.content === 'string') {
                return item.content;
              }
            }
            return '';
          })
          .filter(Boolean)
          .join('\n');
        return text || JSON.stringify(content);
      }
      if (typeof content === 'object') {
        if ('text' in content && typeof content.text === 'string') {
          return content.text;
        }
        if ('content' in content && typeof (content as any).content === 'string') {
          return (content as any).content;
        }
        return JSON.stringify(content);
      }
      return String(content);
    } catch (error: unknown) {
      this.logger.error(`LLM 调用失败: ${(error as any).message}`);
      throw new Error(`大模型服务(${model})暂时不可用，日志已经记录：LLM 调用失败: ${(error as any).message}` );
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

  /**
   * 调用图像生成
   * https://bailian.console.aliyun.com/cn-beijing?spm=5176.29597918.J_C-NDPSQ8SFKWB4aef8i6I.1.2888133cJA91xG&tab=api#/api/?type=model&url=2976416
   */
  async callImageGenLLM(messages: IAgentGenImageMessage[]) {
    // https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
    const imageBeiJing = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    try {
      /**
       * 
       curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $QWEN_API_KEY" \
--data '{
    "model": "qwen-image-2.0-pro",
    "input": {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20260310/rdsgaa/image+%2815%29.png"
                    },
                    {
                        "image": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20260310/qokhtl/image+%2816%29.png"
                    },
                    {
                        "text": "使用图一的城市照片作为底图。请勿更改照片中的真实建筑、街道、车辆或人物。保持照片的真实性。三个图二中的卡通形象在建筑物周围，一个趴在建筑物上方，一个从建筑物的右边探出头来，一个坐在建筑物前的空地上。该形象应采用扁平化的图形风格绘制，轮廓清晰，类似于壁画或海报插图。"
                    }
                ]
            }
        ]
    },
    "parameters": {
        "n": 1,
        "negative_prompt": " ",
        "prompt_extend": true,
        "watermark": false,
        "size": "1024*1024"
    }
}'
       */

      // console.log('Calling Image Gen API with messages:', messages.map(m => ({ role: m.role, content: m.content.map(c => 'text' in c ? c.text.slice(0, 10) : c.image.slice(0, 100)) })));

      messages.forEach((msg, index) => {
        console.log(`Message ${index} role:`, msg.role);
        msg.content.forEach((content, cIndex) => {
          if ('text' in content) {
            console.log(`Message ${index} content ${cIndex} text:`, content.text.slice(0, 10));
          } else if ('image' in content) {
            console.log(`Message ${index} content ${cIndex} image URL:`, content.image.slice(0, 100));
          }
        });
      });

      // return { role: 'assistant', content: [{ image: '' }] };

      const response = await axios.post(
        imageBeiJing,
        {
          model: 'qwen-image-2.0-pro-2026-04-22',
          input: {
            messages: [
              ...messages
            ],
          },
          "parameters": {
              "n": 1,
              "negative_prompt": " ",
              "prompt_extend": true,
              "watermark": false,
              "size": "1024*1024"
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )
      /***
{
    "output": {
        "choices": [
            {
                "finish_reason": "stop",
                "message": {
                    "content": [
                        {
                            "image": "https://dashscope-result-sz.oss-cn-shenzhen.aliyuncs.com/xxx.png?Expires=xxx"
                        }
                    ],
                    "role": "assistant"
                }
            }
        ]
    },
    "usage": {
        "height": 2048,
        "image_count": 1,
        "width": 2048
    },
    "request_id": "571ae02f-5c9d-436c-83c2-f221e6df0xxx"
}
      */
      console.log('Image Gen API response received');
      return response.data.output.choices[0].message;
    } catch (error) {
      this.logger.error(`图像生成调用失败: ${(error as any).message}`);
      throw new Error('图像生成服务暂时不可用，日志已经记录');
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
    } catch (error: unknown) {
      this.logger.error(`LLM 调用失败: ${(error as any).message}`);
      throw new Error('大模型服务暂时不可用');
    }
  }
}
