import { create } from 'zustand'
import { Message } from '../types'

interface AppStoreProps {
    messages: Message[];
    activeMsgId: string | null;

    setActiveMsgId: (id: string | null) => void;
    setMessages: (msg: Message[] | ((prev: Message[]) => Message[])) => void;
    addMessages: (msg: Message[]) => void;
}

export const useStore = create<AppStoreProps>((set) => ({
    activeMsgId: '',
    setActiveMsgId: (id: string | null) => set((state) => ({ activeMsgId: state.activeMsgId = id})),

    messages: [],
    setMessages: (newMsg: Message[] | ((prev: Message[]) => Message[])) => set((state) => ({ 
        messages: typeof newMsg === 'function' ? newMsg(state.messages) : newMsg 
    })),
    addMessages: (msg: Message[]) => set((state) => ({messages: [...state.messages, ...msg]}))
}));
