
export interface Message {
  id: string;
  text: string;
  role: 'user' | 'system' | 'assistant' | 'robot';
  isLoading?: boolean;
  messageId?: string; // deprecated, use id
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  firstMessage?: string;
}