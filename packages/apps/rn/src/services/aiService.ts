import axios from 'axios';
import * as Speech from 'expo-speech';
import { DollConfig } from '../types';

const API_URL = 'https://api.openai.com/v1/chat/completions';

interface AIResponse {
  text: string;
  action?: string;
}

class AIService {
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async sendMessage(
    message: string,
    dollConfig: DollConfig,
    history: { text: string; isUser: boolean }[] = []
  ): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.getMockResponse(message, dollConfig);
    }

    try {
      const personalityPrompt = this.getPersonalityPrompt(dollConfig);
      
      const messages = [
        {
          role: 'system',
          content: `${personalityPrompt}

你可以执行以下动作，在回复时用 [ACTION:动作名] 的格式：
- [ACTION:dance] - 跳舞
- [ACTION:wave] - 挥手
- [ACTION:happy] - 开心
- [ACTION:thinking] - 思考

请保持回复简短友好，适合语音对话。`,
        },
        ...history.slice(-5).map((h) => ({
          role: h.isUser ? 'user' : 'assistant',
          content: h.text,
        })),
        { role: 'user', content: message },
      ];

      const response = await axios.post(
        API_URL,
        {
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.8,
          max_tokens: 150,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseResponse(content);
    } catch (error) {
      console.error('AI API error:', error);
      return this.getMockResponse(message, dollConfig);
    }
  }

  private getPersonalityPrompt(config: DollConfig): string {
    const personalities = {
      cute: `你是${config.name}，一个可爱、活泼的卡通女孩。你总是用甜美的语气说话，喜欢撒娇，经常使用"呢"、"呀"、"啦"等语气词。`,
      sexy: `你是${config.name}，一个性感、迷人的卡通女孩。你说话优雅而有魅力，带有一点神秘感。`,
      playful: `你是${config.name}，一个调皮、爱玩的卡通女孩。你喜欢开玩笑，充满活力，总是让人开心。`,
      elegant: `你是${config.name}，一个优雅、温柔的卡通女孩。你说话温和有礼，像一位淑女。`,
    };

    return personalities[config.personality] || personalities.cute;
  }

  private parseResponse(content: string): AIResponse {
    const actionMatch = content.match(/\[ACTION:(\w+)\]/);
    const action = actionMatch ? actionMatch[1] : undefined;
    const text = content.replace(/\[ACTION:\w+\]/g, '').trim();

    return { text, action };
  }

  private getMockResponse(message: string, dollConfig: DollConfig): AIResponse {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('跳舞') || lowerMsg.includes('dance')) {
      return {
        text: `好的呀，${dollConfig.name}给你跳支舞！`,
        action: 'dance',
      };
    }
    
    if (lowerMsg.includes('你好') || lowerMsg.includes('hello')) {
      return {
        text: `你好呀！我是${dollConfig.name}，很高兴见到你！`,
        action: 'wave',
      };
    }
    
    if (lowerMsg.includes('再见') || lowerMsg.includes('bye')) {
      return {
        text: '再见啦！记得想我哦~',
        action: 'wave',
      };
    }

    const responses = [
      '嗯嗯，我在听呢，继续说呀~',
      '真的吗？好有趣哦！',
      '嘻嘻，你真可爱~',
      '哇，好棒呀！',
      '我也这么觉得呢！',
    ];

    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      action: 'happy',
    };
  }

  speak(text: string, language: string = 'zh-CN') {
    Speech.stop();
    Speech.speak(text, {
      language,
      pitch: 1.2,
      rate: 0.9,
    });
  }

  stopSpeaking() {
    Speech.stop();
  }
}

export default new AIService();
