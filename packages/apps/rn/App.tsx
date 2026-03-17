import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AISettingsScreen from './src/screens/AISettingsScreen';
import LanguageSettingsScreen from './src/screens/LanguageSettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  AISettings: undefined;
  LanguageSettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FFF0F5' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              presentation: 'modal',
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="AISettings"
            component={AISettingsScreen}
            options={{
              presentation: 'modal',
              animationEnabled: true,
            }}
          />
          <Stack.Screen
            name="LanguageSettings"
            component={LanguageSettingsScreen}
            options={{
              presentation: 'modal',
              animationEnabled: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
