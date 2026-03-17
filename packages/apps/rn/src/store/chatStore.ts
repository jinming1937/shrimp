import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, VoiceState } from '../types';

interface ChatState {
  messages: Message[];
  voiceState: VoiceState;
  isAITyping: boolean;
  addMessage: (text: string, isUser: boolean) => void;
  clearMessages: () => void;
  setVoiceState: (state: Partial<VoiceState>) => void;
  setAITyping: (isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      voiceState: {
        isListening: false,
        isProcessing: false,
        error: null,
      },
      isAITyping: false,
      addMessage: (text, isUser) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: Date.now().toString(),
              text,
              isUser,
              timestamp: Date.now(),
            },
          ],
        })),
      clearMessages: () => set({ messages: [] }),
      setVoiceState: (newState) =>
        set((state) => ({
          voiceState: { ...state.voiceState, ...newState },
        })),
      setAITyping: (isTyping) => set({ isAITyping: isTyping }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
