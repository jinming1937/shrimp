import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';


const RADIO_API_CONFIG = {
  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  model: 'qwen-turbo',
}

const ttsApiKey = 'sk-d00dbdc11fa9493b91a51087c2035547';

@Injectable()
export class SessionService {
  getSessionsList() {
    const sessionsDir = path.resolve(__dirname, '../../../../.chat/sessions');
    try {
      if (!fs.existsSync(sessionsDir)) {
        return [];
      }
      const files = fs.readdirSync(sessionsDir).filter(file => file.endsWith('.json'));
      const sessions = files.map(file => {
        const sessionId = path.parse(file).name;
        try {
          const filePath = path.join(sessionsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const messages = JSON.parse(content);
          const firstMessage = messages.length > 0 ? messages[0].text : '';
          return { id: sessionId, firstMessage };
        } catch (err) {
          console.error(`Error reading session ${sessionId}:`, err);
          return { id: sessionId, firstMessage: '' };
        }
      });
      return sessions.reverse(); // newest first
    } catch (err) {
      console.error('Error listing sessions:', err);
      return [];
    }
  }

  getSessionMessages(sessionId: string) {
    const sessionsDir = path.resolve(__dirname, '../../../../.chat/sessions');
    try {
      const filePath = path.join(sessionsDir, `${sessionId}.json`);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading session messages:', err);
      return [];
    }
  }

  async say(text: string) {
    if (!text) {
      console.error('TTS request received with empty text');
      return 'error: text is empty';
    }
    console.log('TTS request received with text:', text);
    const ttsModel = 'qwen3-tts-instruct-flash';
    // https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
    try {
      const response = await axios.post(
        RADIO_API_CONFIG.url,
        {
          model: ttsModel,
          input: {
            text: text,
            voice: "Chelsie", // "Chelsie"
            language_type: "Chinese" // "English"
          },
          // parameters: {
          //   sample_rate: 24000,
          //   format: 'mp3',
          // },
        },
        {
          headers: {
            'Authorization': `Bearer ${ttsApiKey}`,
            'Content-Type': 'application/json',
          },
          // responseType: 'arraybuffer',
          timeout: 10000, // 10秒超时
        }
      );

      console.log('TTS API response received, status:', response.data);
      // 将音频数据转换为 base64
      // React Native 中使用 btoa 进行 base64 编码
      const audioData = response.data;
      console.log('TTS API response:', response.data);
      return { resUrl: response.data.output.audio.url };
    } catch (error) {
      console.error('TTS API error:', error);
    }
  }
}
