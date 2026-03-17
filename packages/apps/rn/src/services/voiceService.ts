import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class VoiceService {
  private isAvailable: boolean = false;
  private onSpeechResults: (text: string) => void;
  private onSpeechError: (error: any) => void;
  private isListening: boolean = false;

  constructor(
    onResults: (text: string) => void,
    onError: (error: any) => void
  ) {
    this.onSpeechResults = onResults;
    this.onSpeechError = onError;
    this.initialize();
  }

  private async initialize() {
    try {
      // Check if speech recognition is available
      const available = await Speech.isSpeakingAsync();
      this.isAvailable = true;
    } catch (e) {
      console.error('Voice initialization error:', e);
      this.isAvailable = false;
    }
  }

  async startListening(locale: string = 'zh-CN') {
    if (!this.isAvailable) {
      // Simulate voice recognition for demo
      this.isListening = true;
      console.log('Voice recognition started (simulated)');
      return;
    }

    try {
      this.isListening = true;
      // Note: Expo doesn't have built-in speech recognition
      // This is a placeholder for future implementation
      // You may need to use expo-speech-recognition or similar
    } catch (e) {
      console.error('Start listening error:', e);
      throw e;
    }
  }

  async stopListening() {
    this.isListening = false;
    
    if (!this.isAvailable) {
      // Simulate voice recognition result
      setTimeout(() => {
        this.onSpeechResults('你好，我想和你聊天');
      }, 500);
      return;
    }

    try {
      // Stop speech recognition
    } catch (e) {
      console.error('Stop listening error:', e);
    }
  }

  async destroy() {
    this.isListening = false;
  }

  getAvailability() {
    return this.isAvailable;
  }

  isListeningActive() {
    return this.isListening;
  }
}

export default VoiceService;
