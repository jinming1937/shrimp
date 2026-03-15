import React from 'react';

interface Message {
  text: string;
  role: 'user' | 'robot' | 'system' | 'assistant';
  isLoading?: boolean;
  messageId?: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  firstMessage?: string;
}

interface SidebarProps {
  historySessions: Session[];
  onSessionSelect: (sessionId: string) => void;
  onCreateSession: () => void;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
  // id of the currently active session, if any
  activeSessionId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ historySessions, onSessionSelect, onCreateSession, theme, onThemeChange, activeSessionId, isCollapsed, onToggleCollapse }) => {

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex flex-col h-screen transition-all duration-300 z-50
        ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}
        w-64
        ${isCollapsed ? 'md:absolute md:-translate-x-full' : 'md:relative md:translate-x-0'}
        fixed left-0 top-0
        ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
      `}>
      {/* Top Section */}
      <div className={`p-4 border-b`}>
        <div className="flex items-center mb-4">
          <img src="/vite.svg" alt="Logo" className="w-8 h-8 mr-2" />
          <span className="text-lg font-bold">Chat</span>
        </div>

        <div className="space-y-2 items-start text-left">
          <button
            onClick={onCreateSession}
            className={`w-full p-2 rounded text-sm font-medium text-left ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            + 新建会话
          </button>

          <button
            onClick={onThemeChange}
            className={`w-full p-2 rounded text-sm text-left ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="主题切换"
          >
            {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
          </button>

          <button
            className={`w-full p-2 rounded text-sm text-left ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title="设置"
          >
            ⚙️ 设置
          </button>
        </div>
      </div>

      {/* Bottom Section - History Sessions */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className={`px-4 pt-4 pb-4 text-sm font-bold mb-4`}>
          历史会话
        </h3>
        <ul className="flex-1 overflow-y-auto px-2">
          {historySessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <li key={session.id} className="mb-2">
                <button
                  className={`w-full text-left p-2 text-sm truncate ${
                    isActive
                      ? 'bg-gray-200 font-semibold text-gray-900'
                      : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => onSessionSelect(session.id)}
                >
                {session.messages && session.messages.length > 0
                  ? session.messages[0].text.substring(0, 30)
                  : session.firstMessage || session.title || '无标题会话' }
              </button>
            </li>)
          })}
        </ul>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
