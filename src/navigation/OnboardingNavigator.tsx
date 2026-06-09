import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddBabyScreen from '@screens/onboarding/AddBabyScreen';
import NotificationsScreen from '@screens/onboarding/NotificationsScreen';
import MicrophoneScreen from '@screens/onboarding/MicrophoneScreen';
import CameraScreen from '@screens/onboarding/CameraScreen';
import OnboardingCompleteScreen from '@screens/onboarding/OnboardingCompleteScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingAddBaby" component={AddBabyScreen} />
      <Stack.Screen name="OnboardingNotifications" component={NotificationsScreen} />
      <Stack.Screen name="OnboardingMicrophone" component={MicrophoneScreen} />
      <Stack.Screen name="OnboardingCamera" component={CameraScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
}
