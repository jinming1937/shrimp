import React, { useEffect, useState } from 'react';
import { Message, Session } from '../types';
import { useStore } from '../store/app';


interface HistoryListProps {
    theme: 'light' | 'dark';
    activeSessionId: string | null;
}

export const HistoryList: React.FC<HistoryListProps> = ({ theme, activeSessionId }) => {
  const [historySessions, setHistorySessions] = useState<Session[]>([]);
  const { setMessages, setActiveMsgId } = useStore();

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
    const handleSessionSelect = (sessionId: string) => {
        setActiveMsgId(sessionId);
        // fetch messages for this session via HTTP
        fetch(`/api/sessions/${sessionId}/messages`)
        .then(res => res.json())
        .then((messages: Message[]) => {
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


    return (
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
                                className={`w-full text-left p-2 text-sm truncate ${isActive
                                        ? 'bg-gray-200 font-semibold text-gray-900'
                                        : theme === 'dark'
                                            ? 'bg-gray-700 hover:bg-gray-600'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                onClick={() => handleSessionSelect(session.id)}
                            >
                                {session.messages && session.messages.length > 0
                                    ? session.messages[0].text.substring(0, 30)
                                    : session.firstMessage || session.title || '无标题会话'}
                            </button>
                        </li>)
                })}
            </ul>
        </div>
    );
}