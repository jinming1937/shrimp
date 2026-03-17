import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDollStore } from '../store/dollStore';
import { DollConfig } from '../types';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  AISettings: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const COLORS = {
  hair: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'],
  skin: ['#FFE4D6', '#FFDBAC', '#F1C27D', '#E0AC69', '#8D5524', '#C68642'],
  eyes: ['#4A90D9', '#50C878', '#8B4513', '#9370DB', '#FF1493', '#20B2AA'],
  outfit: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FF6347', '#40E0D0', '#DDA0DD'],
};

const PERSONALITIES = [
  { key: 'cute', label: '可爱', icon: 'heart' },
  { key: 'sexy', label: '性感', icon: 'flame' },
  { key: 'playful', label: '调皮', icon: 'happy' },
  { key: 'elegant', label: '优雅', icon: 'flower' },
] as const;

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { config, setConfig, resetConfig } = useDollStore();
  const [localConfig, setLocalConfig] = useState<DollConfig>(config);

  const handleSave = () => {
    setConfig(localConfig);
    Alert.alert('保存成功', '卡通人物设置已更新！', [
      { text: '确定', onPress: () => navigation.goBack() },
    ]);
  };

  const handleReset = () => {
    Alert.alert('确认重置', '确定要恢复默认设置吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => {
          resetConfig();
          setLocalConfig({
            name: 'Luna',
            hairColor: '#FFD700',
            skinColor: '#FFE4D6',
            eyeColor: '#4A90D9',
            outfitColor: '#FF69B4',
            personality: 'cute',
          });
        },
      },
    ]);
  };

  const ColorPicker = ({
    label,
    colors,
    selected,
    onSelect,
  }: {
    label: string;
    colors: string[];
    selected: string;
    onSelect: (color: string) => void;
  }) => (
    <View style={styles.colorSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.colorGrid}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selected === color && styles.colorButtonSelected,
            ]}
            onPress={() => onSelect(color)}
          >
            {selected === color && (
              <Ionicons name="checkmark" size={20} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>设置</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>名字</Text>
          <TextInput
            style={styles.nameInput}
            value={localConfig.name}
            onChangeText={(text) => setLocalConfig({ ...localConfig, name: text })}
            placeholder="输入名字"
            maxLength={10}
          />
        </View>

        {/* Personality Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>性格</Text>
          <View style={styles.personalityGrid}>
            {PERSONALITIES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.personalityButton,
                  localConfig.personality === p.key && styles.personalityButtonSelected,
                ]}
                onPress={() =>
                  setLocalConfig({ ...localConfig, personality: p.key as any })
                }
              >
                <Ionicons
                  name={p.icon as any}
                  size={24}
                  color={localConfig.personality === p.key ? 'white' : '#FF69B4'}
                />
                <Text
                  style={[
                    styles.personalityText,
                    localConfig.personality === p.key && styles.personalityTextSelected,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外观</Text>

          <ColorPicker
            label="发色"
            colors={COLORS.hair}
            selected={localConfig.hairColor}
            onSelect={(color) => setLocalConfig({ ...localConfig, hairColor: color })}
          />

          <ColorPicker
            label="肤色"
            colors={COLORS.skin}
            selected={localConfig.skinColor}
            onSelect={(color) => setLocalConfig({ ...localConfig, skinColor: color })}
          />

          <ColorPicker
            label="眼睛颜色"
            colors={COLORS.eyes}
            selected={localConfig.eyeColor}
            onSelect={(color) => setLocalConfig({ ...localConfig, eyeColor: color })}
          />

          <ColorPicker
            label="服装颜色"
            colors={COLORS.outfit}
            selected={localConfig.outfitColor}
            onSelect={(color) => setLocalConfig({ ...localConfig, outfitColor: color })}
          />
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>预览</Text>
          <View style={styles.previewContainer}>
            <View style={styles.previewDoll}>
              <View
                style={[
                  styles.previewHead,
                  { backgroundColor: localConfig.skinColor },
                ]}
              >
                <View
                  style={[
                    styles.previewHair,
                    { backgroundColor: localConfig.hairColor },
                  ]}
                />
                <View
                  style={[
                    styles.previewEye,
                    { backgroundColor: localConfig.eyeColor },
                  ]}
                />
                <View
                  style={[
                    styles.previewEye,
                    { backgroundColor: localConfig.eyeColor, left: 40 },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.previewBody,
                  { backgroundColor: localConfig.outfitColor },
                ]}
              />
            </View>
          </View>
        </View>

        {/* AI Settings Button */}
        <TouchableOpacity
          style={styles.aiSettingsButton}
          onPress={() => navigation.navigate('AISettings')}
        >
          <Ionicons name="sparkles" size={20} color="#FF69B4" />
          <Text style={styles.aiSettingsButtonText}>AI模型设置</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" style={styles.aiSettingsArrow} />
        </TouchableOpacity>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color="#FF6B6B" />
          <Text style={styles.resetButtonText}>恢复默认设置</Text>
        </TouchableOpacity>

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
  nameInput: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  personalityButton: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personalityButtonSelected: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF1493',
  },
  personalityText: {
    marginTop: 4,
    fontSize: 12,
    color: '#FF69B4',
    fontWeight: '500',
  },
  personalityTextSelected: {
    color: 'white',
  },
  colorSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  previewDoll: {
    alignItems: 'center',
  },
  previewHead: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
  },
  previewHair: {
    position: 'absolute',
    top: -10,
    left: 10,
    right: 10,
    height: 30,
    borderRadius: 15,
  },
  previewEye: {
    position: 'absolute',
    top: 30,
    left: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  previewBody: {
    width: 60,
    height: 70,
    borderRadius: 10,
    marginTop: -5,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  resetButtonText: {
    marginLeft: 8,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  aiSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiSettingsButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  aiSettingsArrow: {
    marginLeft: 'auto',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen;
