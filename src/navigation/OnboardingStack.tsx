import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingSignupScreen from '../screens/OnboardingSignupScreen';
import CodeInputScreen from '../screens/CodeInputScreen';
import WelcomeCarouselScreen from '../screens/WelcomeCarouselScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import LoopSelectScreen from '../screens/LoopSelectScreen';
import { OnboardingStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Signup" component={OnboardingSignupScreen} />
      <Stack.Screen name="CodeInput" component={CodeInputScreen} />
      <Stack.Screen name="WelcomeCarousel" component={WelcomeCarouselScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="LoopSelect" component={LoopSelectScreen} />
    </Stack.Navigator>
  );
}