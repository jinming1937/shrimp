import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ModelHeader from './components/ModelHeader';
import ChatWindow from './components/ChatWindow';
import InputSend from './components/InputSend';
import { isMobile } from './lib/utils';
import { HistoryList } from './components/HistoryList';
import type { ISendExt } from './types';
import { useStore } from './store/app';

function App() {
  const { activeMsgId: currentSessionId, setActiveMsgId, messages, setMessages, addMessages } = useStore();

  const [messageStatus, setMessageStatus] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(isMobile());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // 从 localStorage 读取保存的主题，默认为 'light'
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [thinkingMode, setThinkingMode] = useState<boolean>(false);

  // 主题切换时保存到 localStorage
  const handleThemeChange = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleThinkingMode = () => {
    setThinkingMode((prev) => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    setMessageStatus(true);
  }, []);

  const createNewSession = () => {
    setMessages([]);
    setActiveMsgId(null);
  };

  const sendMessage = async (input: string, ext: ISendExt) => {
    const newId = currentSessionId || Date.now().toString();
    if (!currentSessionId) {
      setActiveMsgId(newId);
    }

    if (!input.trim() && !ext.url) {
      return;
    }

    // Add user message to UI
    setMessages([...messages, { id: `${Date.now()}`, text: input, role: 'user', ext: ext }]);

    try {
      const response = await fetch('http://jm.chat.ai/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId: newId,
          role: 'user',
          ext: ext,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setMessages((prevMessages) => {
                const existingIndex = prevMessages.findIndex(
                  (msg) => msg.id === data.id,
                );
                if (existingIndex !== -1) {
                  // Replace existing message
                  return prevMessages.map((msg, index) =>
                    index === existingIndex ? data : msg,
                  );
                } else {
                  // Add new message
                  return [...prevMessages, data];
                }
              });
            } catch (err) {
              console.error('Failed to parse SSE message:', err);
            }
          }
        }

        // Keep incomplete line in buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessages([
        {
          id: `${Date.now()}`,
          text: 'Failed to send message. Please try again.',
          role: 'system',
        },
      ]);
    }
  };

  return (
    <div className={`h-screen flex w-full ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Left Sidebar */}
      <Sidebar
        onCreateSession={createNewSession}
        theme={theme}
        onThemeChange={handleThemeChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      >
        <HistoryList
          theme={theme}
          activeSessionId={currentSessionId}
        />
      </Sidebar>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Model Header */}
        <ModelHeader
          modelName="OpenAI"
          messageStatus={messageStatus}
          theme={theme}
          onToggleCollapse={toggleSidebar}
          thinkingMode={thinkingMode}
          onToggleThinking={toggleThinkingMode}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow messages={messages} theme={theme} thinkingMode={thinkingMode} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <InputSend onSend={sendMessage} theme={theme} />
        </div>
      </div>
    </div>
  );
}

export default App;