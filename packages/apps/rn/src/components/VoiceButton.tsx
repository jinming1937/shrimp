import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoiceService from '../services/voiceService';
import { useChatStore } from '../store/chatStore';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = 80;

interface VoiceButtonProps {
  onVoiceResult: (text: string) => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ onVoiceResult }) => {
  const [isPressed, setIsPressed] = useState(false);
  const { setVoiceState } = useChatStore();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const voiceServiceRef = useRef<VoiceService | null>(null);

  useEffect(() => {
    voiceServiceRef.current = new VoiceService(
      (text) => {
        onVoiceResult(text);
        setIsPressed(false);
        setVoiceState({ isListening: false, isProcessing: false });
      },
      (error) => {
        console.error('Voice error:', error);
        setIsPressed(false);
        setVoiceState({ isListening: false, isProcessing: false, error });
      }
    );

    return () => {
      voiceServiceRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (isPressed) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Scale animation
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        friction: 3,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnim.setValue(1);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  }, [isPressed]);

  const handlePressIn = async () => {
    setIsPressed(true);
    setVoiceState({ isListening: true, isProcessing: false });
    
    try {
      await voiceServiceRef.current?.startListening('zh-CN');
    } catch (error) {
      console.error('Failed to start listening:', error);
      setIsPressed(false);
      setVoiceState({ isListening: false, isProcessing: false, error: '无法启动语音识别' });
    }
  };

  const handlePressOut = async () => {
    if (!isPressed) return;
    
    setIsPressed(false);
    setVoiceState({ isListening: false, isProcessing: true });
    
    try {
      await voiceServiceRef.current?.stopListening();
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Pulse rings */}
      {isPressed && (
        <>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.5, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [1.2, 1.5],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />
        </>
      )}

      {/* Main button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.buttonContainer}
      >
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: isPressed ? '#FF1493' : '#FF69B4',
            },
          ]}
        >
          <Ionicons
            name={isPressed ? 'mic' : 'mic-outline'}
            size={36}
            color="white"
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    width: 120,
  },
  buttonContainer: {
    zIndex: 10,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FF69B4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FF69B4',
  },
});

export default VoiceButton;
