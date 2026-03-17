import React from 'react';
import { ISession, Theme } from '../type';

interface HistoryListProps {
    historySessions: ISession[];
    activeSessionId: string | null;
    onSessionSelect: (sessionId: string) => void;
    theme: Theme;

}

export const HistoryList: React.FC<HistoryListProps> = ({ historySessions, activeSessionId, onSessionSelect, theme }) => {

    return (
      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className={`px-4 pt-4 pb-4 text-sm font-bold`}>
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
    )
}