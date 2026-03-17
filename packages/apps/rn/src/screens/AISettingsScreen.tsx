import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import aiService from '../services/aiService';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  AISettings: undefined;
};

type AISettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AISettings'>;

interface AISettingsScreenProps {
  navigation: AISettingsScreenNavigationProp;
}

type AIProvider = 'openai' | 'qwen';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

const PROVIDERS = [
  {
    key: 'qwen' as AIProvider,
    name: '通义千问 (Qwen)',
    description: '阿里云大模型，国内访问稳定',
    defaultModel: 'qwen-turbo',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  },
  {
    key: 'openai' as AIProvider,
    name: 'OpenAI',
    description: 'GPT模型，需要国外网络',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  },
];

const AISettingsScreen: React.FC<AISettingsScreenProps> = ({ navigation }) => {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'qwen',
    apiKey: '',
    model: 'qwen-turbo',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const currentConfig = aiService.getConfig();
    setConfig(currentConfig);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await aiService.setConfig(config);
      Alert.alert('保存成功', 'AI配置已更新！', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('保存失败', '请检查配置是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    Alert.alert('确认清除', '确定要清除API Key吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          await aiService.setApiKey('');
          setConfig({ ...config, apiKey: '' });
        },
      },
    ]);
  };

  const selectedProvider = PROVIDERS.find((p) => p.key === config.provider);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI设置</Text>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Provider Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择AI模型</Text>
          {PROVIDERS.map((provider) => (
            <TouchableOpacity
              key={provider.key}
              style={[
                styles.providerCard,
                config.provider === provider.key && styles.providerCardSelected,
              ]}
              onPress={() =>
                setConfig({
                  ...config,
                  provider: provider.key,
                  model: provider.defaultModel,
                })
              }
            >
              <View style={styles.providerInfo}>
                <Text
                  style={[
                    styles.providerName,
                    config.provider === provider.key &&
                      styles.providerNameSelected,
                  ]}
                >
                  {provider.name}
                </Text>
                <Text style={styles.providerDescription}>
                  {provider.description}
                </Text>
              </View>
              {config.provider === provider.key && (
                <Ionicons name="checkmark-circle" size={24} color="#FF69B4" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Model Selection */}
        {selectedProvider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>选择模型版本</Text>
            <View style={styles.modelGrid}>
              {selectedProvider.models.map((model) => (
                <TouchableOpacity
                  key={model}
                  style={[
                    styles.modelButton,
                    config.model === model && styles.modelButtonSelected,
                  ]}
                  onPress={() => setConfig({ ...config, model })}
                >
                  <Text
                    style={[
                      styles.modelText,
                      config.model === model && styles.modelTextSelected,
                    ]}
                  >
                    {model}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* API Key Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Key</Text>
          <View style={styles.apiKeyContainer}>
            <TextInput
              style={styles.apiKeyInput}
              value={config.apiKey}
              onChangeText={(text) => setConfig({ ...config, apiKey: text })}
              placeholder={`输入${selectedProvider?.name} API Key`}
              placeholderTextColor="#999"
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Ionicons
                name={showApiKey ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.helpText}>
              {config.provider === 'qwen'
                ? '获取通义千问API Key: https://dashscope.aliyun.com/'
                : '获取OpenAI API Key: https://platform.openai.com/api-keys'}
            </Text>
          </View>

          {config.apiKey ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              <Text style={styles.clearButtonText}>清除API Key</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Test Connection */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => {
            if (!config.apiKey) {
              Alert.alert('提示', '请先输入API Key');
              return;
            }
            Alert.alert(
              '测试连接',
              '保存配置后，和卡通人物对话即可测试连接是否成功。'
            );
          }}
        >
          <Ionicons name="flash" size={20} color="#FF69B4" />
          <Text style={styles.testButtonText}>测试连接</Text>
        </TouchableOpacity>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteTitle}>💡 使用说明</Text>
          <Text style={styles.noteText}>
            1. 不设置API Key时，应用会使用内置的模拟回复{'\n'}
            2. 设置API Key后，卡通人物会使用AI模型进行智能回复{'\n'}
            3. API Key仅保存在本地，不会上传到任何服务器{'\n'}
            4. 通义千问对中文支持更好，推荐国内用户使用
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EC',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF69B4',
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#FFB6C1',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  providerCardSelected: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFF0F5',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  providerNameSelected: {
    color: '#FF69B4',
  },
  providerDescription: {
    fontSize: 13,
    color: '#666',
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelButtonSelected: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF1493',
  },
  modelText: {
    fontSize: 14,
    color: '#333',
  },
  modelTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  apiKeyInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  helpText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
  },
  clearButtonText: {
    marginLeft: 8,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF69B4',
  },
  noteContainer: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});

export default AISettingsScreen;
