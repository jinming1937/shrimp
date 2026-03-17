import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { useDollStore } from '../store/dollStore';

const { width } = Dimensions.get('window');
const DOLL_SIZE = width * 0.7;

interface DollCharacterProps {
  scale?: number;
}

const DollCharacter: React.FC<DollCharacterProps> = ({ scale = 1 }) => {
  const { config, currentAnimation } = useDollStore();
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const danceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Idle animation - gentle breathing
    const idleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    idleAnimation.start();

    return () => {
      idleAnimation.stop();
    };
  }, []);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    switch (currentAnimation) {
      case 'talking':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'dancing':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(danceAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(danceAnim, {
              toValue: -1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(danceAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'waving':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(waveAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim, {
              toValue: -1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        );
        break;

      case 'happy':
        animation = Animated.sequence([
          Animated.spring(bounceAnim, {
            toValue: -20,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 0,
            friction: 3,
            useNativeDriver: true,
          }),
        ]);
        break;

      case 'thinking':
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 10,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -10,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        break;
    }

    if (animation) {
      animation.start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [currentAnimation]);

  const animatedStyle = {
    transform: [
      {
        translateY: bounceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
      {
        rotate: danceAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-10deg', '0deg', '10deg'],
        }),
      },
    ],
  };

  const headStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [-10, 10],
          outputRange: ['-10deg', '10deg'],
        }),
      },
    ],
  };

  const armStyle = {
    transform: [
      {
        rotate: waveAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-30deg', '0deg', '30deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }, animatedStyle]}>
      <Svg width={DOLL_SIZE} height={DOLL_SIZE} viewBox="0 0 200 300">
        <Defs>
          <LinearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={config.hairColor} />
            <Stop offset="100%" stopColor={config.hairColor} stopOpacity={0.8} />
          </LinearGradient>
          <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={config.skinColor} />
            <Stop offset="100%" stopColor={config.skinColor} stopOpacity={0.9} />
          </LinearGradient>
          <LinearGradient id="outfitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={config.outfitColor} />
            <Stop offset="100%" stopColor={config.outfitColor} stopOpacity={0.8} />
          </LinearGradient>
        </Defs>

        {/* Back Hair */}
        <Path
          d="M50 80 Q30 150 40 200 Q50 220 100 220 Q150 220 160 200 Q170 150 150 80"
          fill="url(#hairGradient)"
        />

        {/* Body/Dress */}
        <Path
          d="M70 140 L50 280 Q100 300 150 280 L130 140 Z"
          fill="url(#outfitGradient)"
        />

        {/* Left Arm */}
        <AnimatedG style={armStyle}>
          <Path
            d="M70 150 Q40 180 35 220"
            stroke={config.skinColor}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <Circle cx="35" cy="225" r="8" fill={config.skinColor} />
        </AnimatedG>

        {/* Right Arm */}
        <AnimatedG style={armStyle}>
          <Path
            d="M130 150 Q160 180 165 220"
            stroke={config.skinColor}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <Circle cx="165" cy="225" r="8" fill={config.skinColor} />
        </AnimatedG>

        {/* Neck */}
        <Rect x="85" y="120" width="30" height="25" fill={config.skinColor} />

        {/* Head Group */}
        <AnimatedG style={headStyle}>
          {/* Face */}
          <Ellipse cx="100" cy="80" rx="55" ry="60" fill="url(#skinGradient)" />

          {/* Blush */}
          <Ellipse cx="65" cy="95" rx="12" ry="8" fill="#FFB6C1" opacity="0.6" />
          <Ellipse cx="135" cy="95" rx="12" ry="8" fill="#FFB6C1" opacity="0.6" />

          {/* Eyes */}
          <G>
            {/* Left Eye */}
            <Ellipse cx="75" cy="75" rx="12" ry="15" fill="white" />
            <Circle cx="75" cy="75" r="8" fill={config.eyeColor} />
            <Circle cx="75" cy="75" r="4" fill="black" />
            <Circle cx="78" cy="72" r="3" fill="white" />

            {/* Right Eye */}
            <Ellipse cx="125" cy="75" rx="12" ry="15" fill="white" />
            <Circle cx="125" cy="75" r="8" fill={config.eyeColor} />
            <Circle cx="125" cy="75" r="4" fill="black" />
            <Circle cx="128" cy="72" r="3" fill="white" />
          </G>

          {/* Eyelashes ok */}
          <Path
            d="M60 65 Q75 55 90 65"
            stroke="#333"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M110 65 Q125 55 140 65"
            stroke="#333"
            strokeWidth="2"
            fill="none"
          />

          {/* Eyebrows */}
          <Path
            d="M65 55 Q75 50 85 55"
            stroke="#8B4513"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M115 55 Q125 50 135 55"
            stroke="#8B4513"
            strokeWidth="2"
            fill="none"
          />

          {/* Nose */}
          <Path
            d="M100 85 L98 95 L102 95 Z"
            fill="#E8B4B4"
          />

          {/* Mouth */}
          <Path
            d="M85 105 Q100 115 115 105"
            stroke="#FF6B6B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Front Hair - Bangs */}
          <Path
            d="M45 60 Q60 30 100 25 Q140 30 155 60 Q150 50 130 45 Q100 50 70 45 Q50 50 45 60"
            fill="url(#hairGradient)"
          />

          {/* Hair accessories */}
          <Circle cx="50" cy="70" r="8" fill="#FF1493" />
          <Circle cx="150" cy="70" r="8" fill="#FF1493" />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
};

// Helper component for animated G
const AnimatedG = Animated.createAnimatedComponent(G);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DollCharacter;
