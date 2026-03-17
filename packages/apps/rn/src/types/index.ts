export interface DollConfig {
  name: string;
  hairColor: string;
  skinColor: string;
  eyeColor: string;
  outfitColor: string;
  personality: 'cute' | 'sexy' | 'playful' | 'elegant';
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
}

export type AnimationType = 
  | 'idle' 
  | 'talking' 
  | 'dancing' 
  | 'happy' 
  | 'waving' 
  | 'thinking';
