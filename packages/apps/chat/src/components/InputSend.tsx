import React from 'react';

interface InputSendProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  theme?: 'light' | 'dark';
}

const InputSend: React.FC<InputSendProps> = ({ input, setInput, onSend, theme = 'light' }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="flex">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        className={`flex-1 p-2 border rounded mr-1 ${
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }`}
        placeholder="输入消息..."
      />
      <button onClick={onSend} className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded">
        发送
      </button>
    </div>
  );
};

export default InputSend;