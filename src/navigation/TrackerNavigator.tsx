import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TrackerHomeScreen from '@screens/tracker/TrackerHomeScreen';
import FeedTrackerScreen from '@screens/tracker/FeedTrackerScreen';
import SleepTrackerScreen from '@screens/tracker/SleepTrackerScreen';
import DiaperTrackerScreen from '@screens/tracker/DiaperTrackerScreen';
import GrowthTrackerScreen from '@screens/tracker/GrowthTrackerScreen';
import VaccinationTrackerScreen from '@screens/tracker/VaccinationTrackerScreen';
import MilestoneTrackerScreen from '@screens/tracker/MilestoneTrackerScreen';

import { Colors } from '@theme/index';

const Stack = createNativeStackNavigator();

export default function TrackerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="TrackerHome" component={TrackerHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FeedTracker" component={FeedTrackerScreen} options={{ title: 'Feeding' }} />
      <Stack.Screen name="SleepTracker" component={SleepTrackerScreen} options={{ title: 'Sleep' }} />
      <Stack.Screen name="DiaperTracker" component={DiaperTrackerScreen} options={{ title: 'Diaper' }} />
      <Stack.Screen name="GrowthTracker" component={GrowthTrackerScreen} options={{ title: 'Growth' }} />
      <Stack.Screen name="VaccinationTracker" component={VaccinationTrackerScreen} options={{ title: 'Vaccination' }} />
      <Stack.Screen name="MilestoneTracker" component={MilestoneTrackerScreen} options={{ title: 'Milestones' }} />
    </Stack.Navigator>
  );
}
