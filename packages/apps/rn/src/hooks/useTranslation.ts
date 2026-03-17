import { useState, useEffect, useCallback } from 'react';
import { i18n, Language } from '../i18n';

export function useTranslation() {
  const [language, setLanguageState] = useState<Language>(i18n.getLanguage());

  useEffect(() => {
    // 订阅语言变化
    const unsubscribe = i18n.subscribe((newLang) => {
      setLanguageState(newLang);
    });
    return unsubscribe;
  }, []);

  // 翻译函数
  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      return i18n.t(key, vars);
    },
    [language]
  );

  // 设置语言
  const setLanguage = useCallback(async (lang: Language) => {
    await i18n.setLanguage(lang);
  }, []);

  // 切换语言
  const toggleLanguage = useCallback(async () => {
    await i18n.toggleLanguage();
  }, []);

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
  };
}
