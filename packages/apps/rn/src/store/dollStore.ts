import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DollConfig, AnimationType } from '../types';

interface DollState {
  config: DollConfig;
  currentAnimation: AnimationType;
  setConfig: (config: Partial<DollConfig>) => void;
  setAnimation: (animation: AnimationType) => void;
  resetConfig: () => void;
}

const defaultConfig: DollConfig = {
  name: 'Luna',
  hairColor: '#FFD700',
  skinColor: '#FFE4D6',
  eyeColor: '#4A90D9',
  outfitColor: '#FF69B4',
  personality: 'cute',
};

export const useDollStore = create<DollState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      currentAnimation: 'idle',
      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      setAnimation: (animation) => set({ currentAnimation: animation }),
      resetConfig: () => set({ config: defaultConfig }),
    }),
    {
      name: 'doll-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
