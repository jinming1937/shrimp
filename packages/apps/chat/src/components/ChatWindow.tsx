import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 支持GitHub Flavored Markdown


interface Message {
  id: string;
  text: string;
  role: 'user' | 'robot';
  isLoading?: boolean;
  messageId?: string; // deprecated, use id
}

interface ChatWindowProps {
  messages: Message[];
  theme?: 'light' | 'dark';
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, theme = 'light' }) => {
  const scrollDomRef = React.useRef<HTMLDivElement>(null);

  // Whenever messages change, scroll to the bottom
  React.useEffect(() => {
    if (scrollDomRef.current) {
      scrollDomRef.current.scrollTop = scrollDomRef.current.scrollHeight;
    }
  }, [messages]);
  return (
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
          {msg.role === 'robot' && (
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
              {msg.role === 'robot' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.isLoading ? 'Loading...' : msg.text}</ReactMarkdown>
              ) : (
                msg.isLoading ? 'Loading...' : msg.text
              )}
            </div>
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
  );
};

export default ChatWindow;