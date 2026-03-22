import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 支持GitHub Flavored Markdown
import { chatIdentify } from '../lib/utils';
import axios from 'axios';


interface Message {
  id: string;
  text: string;
  role: 'user' | 'robot' | 'system' | 'assistant';
  isLoading?: boolean;
  messageId?: string; // deprecated, use id
}

interface ChatWindowProps {
  messages: Message[];
  theme?: 'light' | 'dark';
}

function getCatchSpeech(messageId: string) {
  try {
    const data = localStorage.getItem(messageId);
    const { url, expires } = JSON.parse(data || '{}');

    if (url && (!expires || Date.now() < expires)) {
      return url;
    }
  } catch (error) {
    console.error('Error occurred while fetching catch speech:', error);
  }

  return null;
}

function setCatchSpeech(messageId: string, url: string, expiresInSeconds: number) {
  const expires = Date.now() + expiresInSeconds * 1000;
  const data = JSON.stringify({ url, expires });
  localStorage.setItem(messageId, data);
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, theme = 'light' }) => {
  const scrollDomRef = React.useRef<HTMLDivElement>(null);

  // Whenever messages change, scroll to the bottom
  React.useEffect(() => {
    if (scrollDomRef.current) {
      scrollDomRef.current.scrollTop = scrollDomRef.current.scrollHeight;
    }
  }, [messages]);

  const [src, setSrc] = React.useState<string>('');
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const say = async (text: string, messageId: string) => {
    const catchURL = await getCatchSpeech(messageId);
    if (catchURL) {
      setSrc(catchURL);
        // setSrc(`data:audio/mpeg;base64,${audioData}`);
        // 等待音频加载后再播放
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.oncanplay = () => {
            audioRef.current?.play().catch(err => console.error('Audio play failed:', err));
          };
        }

      console.log('ggooo', catchURL);
      return;
    }

    // https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
    try {
      const response = await axios.post(
        '/api/agent/text2voice',
        {
          text,
        }
      );

      // 将音频数据转换为 base64
      // React Native 中使用 btoa 进行 base64 编码
      const audioData = response.data.resUrl;
      console.log('TTS API response:', response.data.resUrl);
      if (typeof audioData === 'string' && audioData) {
        setSrc(audioData);
        // setSrc(`data:audio/mpeg;base64,${audioData}`);
        // 等待音频加载后再播放
        if (audioRef.current) {
          setCatchSpeech(messageId, audioData, 3600 * 24); // 缓存1小时
          audioRef.current.load();
          audioRef.current.oncanplay = () => {
            audioRef.current?.play().catch(err => console.error('Audio play failed:', err));
          };
        }
      } else {
        console.error('Invalid audio data received');
      }
    } catch (error) {
      console.error('TTS API error:', error);
    }
  }
  return (
    <>
      <audio ref={audioRef} id="audio-player" controls className='hidden' src={src} />
      <div ref={scrollDomRef} className={`flex-1 overflow-y-auto p-4 rounded ${
        theme === 'dark'
          ? 'bg-gray-800'
          : 'bg-gray-50'
      }`}>
        {messages.length > 0 ? messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 flex items-start ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {chatIdentify(msg.role) && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                🤖
              </div>
            )}
            <div className={`p-2 rounded ${
              theme === 'dark'
                ? 'bg-gray-700'
                : 'bg-white'
            }`}>
              <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                {chatIdentify(msg.role) ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.isLoading ? 'Loading...' : msg.text}</ReactMarkdown>
                ) : (
                  msg.isLoading ? 'Loading...' : msg.text
                )}
              </div>
              {
                chatIdentify(msg.role) && !msg.isLoading ? (
                  <input type="button" value="say" className="text-xs text-gray-500 mt-1 cursor-pointer" onClick={() => say(msg.text, msg.id)} />
                ): null
              }
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                😊
              </div>
            )}
          </div>
        )) : (
          <div className="text-center text-gray-500">
            输入您的问题，AI助手将为您提供解答！😊
          </div>
        )
      }
      </div>
    </>
  );
};

export default ChatWindow;