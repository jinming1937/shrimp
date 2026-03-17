

export type Theme = 'light' | 'dark';


export interface IMessage {
  text: string;
  role: 'user' | 'robot' | 'system' | 'assistant';
  isLoading?: boolean;
  messageId?: string;
  id: string;
}



export interface ISession {
    id: string;
    title: string;
    messages: IMessage[];
    firstMessage?: string; // 用于没有消息时显示的占位文本
}