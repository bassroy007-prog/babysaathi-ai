import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';

import { useAuthStore } from '@store/authStore';
import { Colors } from '@theme/index';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import SubscriptionScreen from '@screens/subscription/SubscriptionScreen';
import FamilySharingScreen from '@screens/family/FamilySharingScreen';
import AnalyticsScreen from '@screens/analytics/AnalyticsScreen';
import PostDetailScreen from '@screens/community/PostDetailScreen';
import BabyFoodGuideScreen from '@screens/features/BabyFoodGuideScreen';
import SymptomCheckerScreen from '@screens/features/SymptomCheckerScreen';

const RootStack = createNativeStackNavigator();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.textPrimary,
    border: Colors.dark.border,
  },
};

export default function AppNavigator() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuthStore();
  const colorScheme = useColorScheme();

  if (isLoading) return null;

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? AppDarkTheme : LightTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasCompletedOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <RootStack.Screen
              name="FamilySharing"
              component={FamilySharingScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <RootStack.Screen
              name="Analytics"
              component={AnalyticsScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="PostDetail"
              component={PostDetailScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="BabyFoodGuide"
              component={BabyFoodGuideScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="SymptomChecker"
              component={SymptomCheckerScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
