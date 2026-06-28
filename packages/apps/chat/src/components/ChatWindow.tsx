import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 支持GitHub Flavored Markdown
import { chatIdentify } from '../lib/utils';
import axios from 'axios';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  theme?: 'light' | 'dark';
  thinkingMode?: boolean;
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

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, theme = 'light', thinkingMode = false }) => {
  const scrollDomRef = React.useRef<HTMLDivElement>(null);
  const thinkingLogs = React.useMemo(
    () => messages.filter((msg) => msg.ext?.type === 'thinking'),
    [messages],
  );

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
      {thinkingMode && thinkingLogs.length > 0 ? (
        <div className={`mb-4 rounded-lg border ${theme === 'dark' ? 'border-yellow-600 bg-yellow-950 text-yellow-100' : 'border-yellow-300 bg-yellow-50 text-yellow-900'} p-3`}> 
          <div className="text-sm font-semibold mb-2">思考日志</div>
          {thinkingLogs.map((log, index) => (
            <div key={`thinking-${index}`} className="text-sm leading-5 mb-1">
              {log.text}
            </div>
          ))}
        </div>
      ) : null}
      <div ref={scrollDomRef} className={`flex-1 w-full overflow-y-auto p-4 rounded ${
        theme === 'dark'
          ? 'bg-gray-800'
          : 'bg-gray-50'
      }`}>
        {messages.length > 0 ? messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 w-full flex items-start ${
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
            } ${msg.ext?.type === 'thinking' ? 'border border-yellow-400 bg-yellow-50 text-yellow-900' : ''}`}>
              <div className={`markdown-content prose prose-sm ${theme === 'dark' ? 'prose-invert' : ''}`}>
                {chatIdentify(msg.role) ? (
                  <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}>
                    {msg.isLoading ? 'Loading...' : msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.isLoading ? 'Loading...' : msg.text
                )}
              </div>
              {
                chatIdentify(msg.role) && !msg.isLoading && msg.text ? (
                  <input type="button" value="say" className="text-xs text-gray-500 mt-1 cursor-pointer" onClick={() => say(msg.text, msg.id)} />
                ): null
              }
              {
                msg.ext?.type === 'image_url' && msg.ext?.url ?
                (
                  <div className="flex w-80 h-80">
                    <img className="w-full h-full object-contain" src={msg.ext.url} alt='图片已经过期' />
                  </div>
                ) : null
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