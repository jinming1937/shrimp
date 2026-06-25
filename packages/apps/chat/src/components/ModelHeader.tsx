import React from 'react';

interface ModelHeaderProps {
  modelName?: string;
  theme?: 'light' | 'dark';
  messageStatus?: boolean; // 是否在线
  onToggleCollapse?: () => void;
  thinkingMode?: boolean;
  onToggleThinking?: () => void;
}

const ModelHeader: React.FC<ModelHeaderProps> = ({ modelName = 'OpenAI', messageStatus = false, theme = 'light', onToggleCollapse, thinkingMode = false, onToggleThinking }) => {
  return (
    <div className={`h-14 border-b flex items-center justify-between px-6 ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <div title='折叠' onClick={onToggleCollapse} className="cursor-pointer">⋮⋮</div>
      <h1 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{modelName}</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleThinking}
          className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} ${thinkingMode ? 'border border-yellow-400' : ''}`}
        >
          {thinkingMode ? '思考模式：开' : '思考模式：关'}
        </button>
        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>分享</span>
        <div className={`w-2 h-2 rounded-full ${messageStatus ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
    </div>
  );
};

export default ModelHeader;
