import React from 'react';
import { Theme } from '../type';

interface SidebarProps {
  onCreateSession: () => void;
  theme: Theme;
  onThemeChange: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: React.ReactElement;
}

const Sidebar: React.FC<SidebarProps> = ({ onCreateSession, theme, onThemeChange, isCollapsed, onToggleCollapse, children }) => {

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
      {children}
    </div>
    </>
  );
};

export default Sidebar;
