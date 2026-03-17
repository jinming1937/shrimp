import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';

class VoiceService {
  private isAvailable: boolean = false;
  private onSpeechResults: (text: string) => void;
  private onSpeechError: (error: any) => void;

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
      const available = await Voice.isAvailable();
      this.isAvailable = available;
      
      Voice.onSpeechResults = this.handleSpeechResults;
      Voice.onSpeechError = this.handleSpeechError;
      Voice.onSpeechEnd = this.handleSpeechEnd;
    } catch (e) {
      console.error('Voice initialization error:', e);
    }
  }

  private handleSpeechResults = (e: any) => {
    if (e.value && e.value.length > 0) {
      this.onSpeechResults(e.value[0]);
    }
  };

  private handleSpeechError = (e: any) => {
    this.onSpeechError(e.error);
  };

  private handleSpeechEnd = () => {
    console.log('Speech ended');
  };

  async startListening(locale: string = 'zh-CN') {
    if (!this.isAvailable) {
      throw new Error('Voice recognition is not available');
    }

    try {
      await Voice.start(locale);
    } catch (e) {
      console.error('Start listening error:', e);
      throw e;
    }
  }

  async stopListening() {
    try {
      await Voice.stop();
    } catch (e) {
      console.error('Stop listening error:', e);
    }
  }

  async destroy() {
    try {
      await Voice.destroy();
    } catch (e) {
      console.error('Destroy voice error:', e);
    }
  }

  getAvailability() {
    return this.isAvailable;
  }
}

export default VoiceService;
