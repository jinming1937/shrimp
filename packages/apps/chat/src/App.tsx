import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Sidebar from './components/Sidebar';
import ModelHeader from './components/ModelHeader';
import ChatWindow from './components/ChatWindow';
import InputSend from './components/InputSend';
import { isMobile } from './lib/utils';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'system' | 'assistant' | 'robot';
  isLoading?: boolean;
  messageId?: string; // deprecated, use id
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
}

function App() {
  const [historySessions, setHistorySessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [messageStatus, setMessageStatus] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(isMobile());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // 从 localStorage 读取保存的主题，默认为 'light'
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  // 主题切换时保存到 localStorage
  const handleThemeChange = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    // Fetch history sessions on load
    fetch('/api/sessions/list')
      .then(res => res.json())
      .then((sessions = []) => {
        const mapped = sessions.map((s: any) => ({ ...s, messages: []}));
        setHistorySessions(mapped);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // listen for socket events; only attach handlers once per socket instance
  useEffect(() => {
    if (!socket) {
      setMessageStatus(false);
      return;
    }

    const handleMessage = (data: { message: Message; sessionId: string }) => {
      console.log('Looking for loading message with id:', data);
      setMessages(prev => {
        if (data.message.isLoading) {
          // If it's a loading message, append it
          return [...prev, data.message];
        } else {
          const currentMsgId = data.message.id;
          const matchLoadingIndex = prev.findIndex(
            msg => msg.isLoading && msg.role === 'system' && msg.id === currentMsgId
          );
          if (matchLoadingIndex !== -1) {
            // replace the placeholder loading message
            return prev.map((msg, index) =>
              index === matchLoadingIndex ? data.message : msg
            );
          } else {
            const exists = prev.some(msg => msg.id === data.message.id);
            if (exists) {
              return prev.map(msg =>
                msg.id === data.message.id ? data.message : msg
              );
            }
            return [...prev, data.message];
          }
        }
      });
    };

    const handleJoined = () => {
      setMessageStatus(true);
    };

    socket.on('message', handleMessage);
    socket.on('joined', handleJoined);

    // cleanup to avoid duplicate listeners when socket changes or component unmounts
    return () => {
      socket.off('message', handleMessage);
      socket.off('joined', handleJoined);
    };
  }, [socket, currentSessionId]);

  const createNewSession = () => {
    if (currentSessionId && !historySessions.find(i => i.id === currentSessionId)) {
      setHistorySessions(prev => [{ id: currentSessionId, messages, firstMessage: messages[0]?.text, title: messages[0]?.text }, ...prev]);
    }
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // fetch messages for this session via HTTP
    fetch(`/api/sessions/${sessionId}/messages`)
      .then(res => res.json())
      .then(messages => {
        setHistorySessions(prev =>
          prev.map(session =>
            session.id === sessionId
              ? { ...session, messages }
              : session
          )
        );
        setMessages(messages);
      })
      .catch(console.error);
  };

  const sendMessage = (input: string) => {
    const newId = currentSessionId || Date.now().toString();
    if (!currentSessionId) {
      setCurrentSessionId(newId);
      if (socket) {
        socket.emit('joinSession', newId);
      }
    } else {
      socket.emit('joinSession', currentSessionId);
    }
    if (input.trim() && socket) {
      setMessages(prev => [...prev, { id: `${Date.now()}`, text: input, role: 'user' }]);
      console.log('Sending message:', input);
      socket.emit('sendMessage', { message: input, sessionId: newId, role: 'user' });
    }
  };

  return (
    <div className={`h-screen flex w-full ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Left Sidebar */}
      <Sidebar
        historySessions={historySessions}
        onSessionSelect={handleSessionSelect}
        onCreateSession={createNewSession}
        theme={theme}
        onThemeChange={handleThemeChange}
        activeSessionId={currentSessionId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Model Header */}
        <ModelHeader modelName="OpenAI" messageStatus={messageStatus} theme={theme} onToggleCollapse={toggleSidebar} />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow messages={messages} theme={theme} />
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