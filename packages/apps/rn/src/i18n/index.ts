import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'zh' | 'en';

const LANGUAGE_KEY = '@app-language';

// 翻译内容
export const translations = {
  zh: {
    // 通用
    common: {
      save: '保存',
      cancel: '取消',
      confirm: '确定',
      back: '返回',
      loading: '加载中...',
      error: '错误',
      success: '成功',
    },
    // 首页
    home: {
      title: 'AI Doll',
      welcome: '按住下方按钮，开始和{{name}}对话吧~',
      listening: '正在聆听...',
      settings: '设置',
    },
    // 设置页面
    settings: {
      title: '设置',
      name: '名字',
      namePlaceholder: '输入名字',
      personality: '性格',
      appearance: '外观',
      hairColor: '发色',
      skinColor: '肤色',
      eyeColor: '眼睛颜色',
      outfitColor: '服装颜色',
      preview: '预览',
      reset: '恢复默认设置',
      aiSettings: 'AI模型设置',
      language: '语言设置',
      personalities: {
        cute: '可爱',
        sexy: '性感',
        playful: '调皮',
        elegant: '优雅',
      },
    },
    // AI设置页面
    aiSettings: {
      title: 'AI设置',
      selectModel: '选择AI模型',
      selectVersion: '选择模型版本',
      apiKey: 'API Key',
      apiKeyPlaceholder: '输入{{provider}} API Key',
      testConnection: '测试连接',
      clearApiKey: '清除API Key',
      helpText: {
        qwen: '获取通义千问API Key: https://dashscope.aliyun.com/',
        openai: '获取OpenAI API Key: https://platform.openai.com/api-keys',
      },
      providers: {
        qwen: {
          name: '通义千问 (Qwen)',
          description: '阿里云大模型，国内访问稳定',
        },
        openai: {
          name: 'OpenAI',
          description: 'GPT模型，需要国外网络',
        },
      },
      note: {
        title: '💡 使用说明',
        content: '1. 不设置API Key时，应用会使用内置的模拟回复\n2. 设置API Key后，卡通人物会使用AI模型进行智能回复\n3. API Key仅保存在本地，不会上传到任何服务器\n4. 通义千问对中文支持更好，推荐国内用户使用',
      },
    },
    // 语言设置页面
    language: {
      title: '语言设置',
      selectLanguage: '选择语言',
      languages: {
        zh: '简体中文',
        en: 'English',
      },
    },
    // 消息
    messages: {
      saveSuccess: '保存成功',
      saveError: '保存失败',
      configUpdated: '配置已更新！',
      clearConfirm: '确定要清除API Key吗？',
      resetConfirm: '确定要恢复默认设置吗？',
      enterApiKey: '请先输入API Key',
    },
  },
  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'OK',
      back: 'Back',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    // Home
    home: {
      title: 'AI Doll',
      welcome: 'Hold the button below to start chatting with {{name}}~',
      listening: 'Listening...',
      settings: 'Settings',
    },
    // Settings
    settings: {
      title: 'Settings',
      name: 'Name',
      namePlaceholder: 'Enter name',
      personality: 'Personality',
      appearance: 'Appearance',
      hairColor: 'Hair Color',
      skinColor: 'Skin Color',
      eyeColor: 'Eye Color',
      outfitColor: 'Outfit Color',
      preview: 'Preview',
      reset: 'Reset to Default',
      aiSettings: 'AI Model Settings',
      language: 'Language Settings',
      personalities: {
        cute: 'Cute',
        sexy: 'Sexy',
        playful: 'Playful',
        elegant: 'Elegant',
      },
    },
    // AI Settings
    aiSettings: {
      title: 'AI Settings',
      selectModel: 'Select AI Model',
      selectVersion: 'Select Model Version',
      apiKey: 'API Key',
      apiKeyPlaceholder: 'Enter {{provider}} API Key',
      testConnection: 'Test Connection',
      clearApiKey: 'Clear API Key',
      helpText: {
        qwen: 'Get Qwen API Key: https://dashscope.aliyun.com/',
        openai: 'Get OpenAI API Key: https://platform.openai.com/api-keys',
      },
      providers: {
        qwen: {
          name: 'Qwen (Alibaba)',
          description: 'Alibaba Cloud LLM, stable access in China',
        },
        openai: {
          name: 'OpenAI',
          description: 'GPT models, requires international network',
        },
      },
      note: {
        title: '💡 Instructions',
        content: '1. Without API Key, the app uses built-in mock responses\n2. With API Key, the doll uses AI for smart replies\n3. API Key is stored locally only, never uploaded\n4. Qwen has better Chinese support, recommended for Chinese users',
      },
    },
    // Language Settings
    language: {
      title: 'Language Settings',
      selectLanguage: 'Select Language',
      languages: {
        zh: '简体中文',
        en: 'English',
      },
    },
    // Messages
    messages: {
      saveSuccess: 'Save Successful',
      saveError: 'Save Failed',
      configUpdated: 'Configuration updated!',
      clearConfirm: 'Are you sure you want to clear the API Key?',
      resetConfirm: 'Are you sure you want to reset to default settings?',
      enterApiKey: 'Please enter API Key first',
    },
  },
};

// 获取嵌套对象的值
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // 返回路径作为fallback
    }
  }
  return typeof value === 'string' ? value : path;
}

// 替换模板变量
function replaceVars(text: string, vars?: Record<string, string>): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] || match);
}

class I18nService {
  private currentLanguage: Language = 'zh';
  private listeners: ((lang: Language) => void)[] = [];

  constructor() {
    this.loadLanguage();
  }

  private async loadLanguage() {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
        this.currentLanguage = savedLang;
        this.notifyListeners();
      }
    } catch (e) {
      console.log('No saved language found');
    }
  }

  private async saveLanguage() {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, this.currentLanguage);
    } catch (e) {
      console.error('Failed to save language:', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentLanguage));
  }

  // 获取当前语言
  getLanguage(): Language {
    return this.currentLanguage;
  }

  // 设置语言
  async setLanguage(lang: Language) {
    this.currentLanguage = lang;
    await this.saveLanguage();
    this.notifyListeners();
  }

  // 切换语言
  async toggleLanguage() {
    const newLang = this.currentLanguage === 'zh' ? 'en' : 'zh';
    await this.setLanguage(newLang);
  }

  // 订阅语言变化
  subscribe(listener: (lang: Language) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 翻译
  t(key: string, vars?: Record<string, string>): string {
    const translation = translations[this.currentLanguage];
    const text = getNestedValue(translation, key);
    return replaceVars(text, vars);
  }
}

export const i18n = new I18nService();
