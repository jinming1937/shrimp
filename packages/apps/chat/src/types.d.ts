
export interface Message {
  id: string;
  text: string;
  role: 'user' | 'system' | 'assistant' | 'robot';
  isLoading?: boolean;
  messageId?: string; // deprecated, use id
  ext?: ISendExt;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  firstMessage?: string;
}

export type ISendExt = { type: 'image_url' | 'video_url' | 'text', url?: string }