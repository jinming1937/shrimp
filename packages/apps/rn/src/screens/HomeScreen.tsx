import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import DollCharacter from '../components/DollCharacter';
import VoiceButton from '../components/VoiceButton';
import MessageBubble from '../components/MessageBubble';
import { useDollStore } from '../store/dollStore';
import { useChatStore } from '../store/chatStore';
import aiService from '../services/aiService';
import { useTranslation } from '../hooks/useTranslation';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { config, setAnimation } = useDollStore();
  const { messages, addMessage, voiceState, isAITyping } = useChatStore();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleVoiceResult = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    addMessage(text, true);

    // Set talking animation
    setAnimation('thinking');

    try {
      // Get AI response
      const response = await aiService.sendMessage(
        text,
        config,
        messages.slice(-5)
      );

      // Handle action
      if (response.action) {
        setAnimation(response.action as any);
        // Reset to idle after animation
        setTimeout(() => setAnimation('idle'), 3000);
      } else {
        setAnimation('talking');
        setTimeout(() => setAnimation('idle'), 2000);
      }

      // Add AI message
      addMessage(response.text, false);

      // Speak response
      aiService.speak(response.text);
    } catch (error) {
      console.error('Error processing voice:', error);
      setAnimation('idle');
    }
  }, [config, messages, addMessage, setAnimation]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Animated.Text style={[styles.headerTitle, { opacity: fadeAnim }]}>
          {config.name}
        </Animated.Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Messages Area */}
        <View style={styles.messagesContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={scrollToBottom}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <Animated.Text style={[styles.welcomeText, { opacity: fadeAnim }]}>
                  {t('home.welcome', { name: config.name })}
                </Animated.Text>
              </View>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  dollName={config.name}
                />
              ))
            )}
            {isAITyping && (
              <View style={styles.typingIndicator}>
                <Animated.View style={styles.typingDot} />
                <Animated.View style={[styles.typingDot, { marginHorizontal: 4 }]} />
                <Animated.View style={styles.typingDot} />
              </View>
            )}
          </ScrollView>
        </View>

        {/* Doll Character */}
        <View style={styles.dollContainer}>
          <DollCharacter scale={0.8} />
        </View>
      </View>

      {/* Voice Status */}
      {voiceState.isListening && (
        <View style={styles.statusContainer}>
          <Animated.View style={styles.listeningIndicator}>
            <Ionicons name="mic" size={20} color="#FF69B4" />
            <Animated.Text style={styles.statusText}>{t('home.listening')}</Animated.Text>
          </Animated.View>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        <VoiceButton onVoiceResult={handleVoiceResult} />
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FF69B4',
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  messagesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    zIndex: 10,
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  dollContainer: {
    position: 'absolute',
    top: height * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '500',
  },
  bottomContainer: {
    alignItems: 'center',
    paddingBottom: 30,
    paddingTop: 10,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
});

export default HomeScreen;
