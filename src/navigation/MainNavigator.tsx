import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '@screens/home/HomeScreen';
import TrackerNavigator from './TrackerNavigator';
import AIScreen from '@screens/ai/AIScreen';
import CommunityScreen from '@screens/community/CommunityScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';

import { Colors, Spacing, Radius, Typography } from '@theme/index';
import { useAuthStore } from '@store/authStore';

const Tab = createBottomTabNavigator();

// ─── Desi tab icon wrapper ────────────────────────────────────────────────────

interface TabIconProps {
  focused: boolean;
  color: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isGuru?: boolean;
  isGrandparent?: boolean;
}

function TabIcon({ focused, color, iconName, isGuru, isGrandparent }: TabIconProps) {
  const iconSize = isGrandparent ? 28 : 22;
  return (
    <View
      style={[
        styles.iconWrap,
        { width: iconSize + 16, height: iconSize + 8 },
        focused && {
          backgroundColor: isGuru
            ? `${Colors.peacock}18`
            : `${Colors.primary}18`,
        },
      ]}
    >
      {isGuru ? (
        <Text style={{ fontSize: iconSize - 2 }}>🧿</Text>
      ) : (
        <Ionicons name={iconName} size={iconSize} color={color} />
      )}
    </View>
  );
}

// ─── Navigator ────────────────────────────────────────────────────────────────

export default function MainNavigator() {
  const { user } = useAuthStore();
  const isGrandparent = user?.role === 'grandparent';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          borderTopLeftRadius: Radius['2xl'],
          borderTopRightRadius: Radius['2xl'],
        },
        tabBarInactiveTintColor: Colors.textDisabled,
        tabBarLabelStyle: {
          fontSize: isGrandparent ? 12 : 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const isGuru = route.name === 'AI';

          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          let activeTint = Colors.primary;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tracker':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'AI':
              iconName = 'sparkles';
              activeTint = Colors.peacock;
              break;
            case 'Community':
              iconName = focused ? 'people' : 'people-outline';
              activeTint = Colors.peacock;
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return (
            <TabIcon
              focused={focused}
              color={focused ? activeTint : color}
              iconName={iconName}
              isGuru={isGuru}
              isGrandparent={isGrandparent}
            />
          );
        },
        tabBarActiveTintColor: route.name === 'AI' || route.name === 'Community'
          ? Colors.peacock
          : Colors.primary,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'घर · Home' }}
      />
      <Tab.Screen
        name="Tracker"
        component={TrackerNavigator}
        options={{ tabBarLabel: 'ट्रैकर · Track' }}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{ tabBarLabel: '🧿 AI Guru' }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarLabel: 'समाज · Community' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'प्रोफ़ाइल' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
});
