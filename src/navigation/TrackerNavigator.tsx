import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TrackerHomeScreen from '@screens/tracker/TrackerHomeScreen';
import FeedTrackerScreen from '@screens/tracker/FeedTrackerScreen';
import SleepTrackerScreen from '@screens/tracker/SleepTrackerScreen';
import DiaperTrackerScreen from '@screens/tracker/DiaperTrackerScreen';
import GrowthTrackerScreen from '@screens/tracker/GrowthTrackerScreen';
import VaccinationTrackerScreen from '@screens/tracker/VaccinationTrackerScreen';
import MilestoneTrackerScreen from '@screens/tracker/MilestoneTrackerScreen';
import MedicineTrackerScreen from '@screens/tracker/MedicineTrackerScreen';
import CulturalMilestonesScreen from '@screens/tracker/CulturalMilestonesScreen';
import BabyFoodGuideScreen from '@screens/tracker/BabyFoodGuideScreen';
import DailyReportScreen from '@screens/tracker/DailyReportScreen';
import MomHealthScreen from '@screens/tracker/MomHealthScreen';
import SleepAnalysisScreen from '@screens/tracker/SleepAnalysisScreen';
import MonthlyReportScreen from '@screens/tracker/MonthlyReportScreen';
import VisitPrepScreen from '@screens/tracker/VisitPrepScreen';
import PhotoTimelineScreen from '@screens/tracker/PhotoTimelineScreen';
import KnowledgeHubScreen from '@screens/tracker/KnowledgeHubScreen';
import CaregiverCardScreen from '@screens/tracker/CaregiverCardScreen';
import GrowthPredictorScreen from '@screens/tracker/GrowthPredictorScreen';
import VaccinePrepScreen from '@screens/tracker/VaccinePrepScreen';
import FeedAnalyticsScreen from '@screens/tracker/FeedAnalyticsScreen';
import ScheduleBuilderScreen from '@screens/tracker/ScheduleBuilderScreen';

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
      <Stack.Screen name="MedicineTracker" component={MedicineTrackerScreen} options={{ title: 'Medicine & Fever' }} />
      <Stack.Screen name="CulturalMilestones" component={CulturalMilestonesScreen} options={{ title: '🙏 Cultural Ceremonies' }} />
      <Stack.Screen name="BabyFoodGuide" component={BabyFoodGuideScreen} options={{ title: '🥗 Baby Food Guide' }} />
      <Stack.Screen name="DailyReport" component={DailyReportScreen} options={{ title: '📋 Daily Report' }} />
      <Stack.Screen name="MomHealth" component={MomHealthScreen} options={{ title: '💝 Mom\'s Wellness' }} />
      <Stack.Screen name="SleepAnalysis" component={SleepAnalysisScreen} options={{ title: '📊 Sleep Analysis' }} />
      <Stack.Screen name="MonthlyReport" component={MonthlyReportScreen} options={{ title: '📅 Monthly Report' }} />
      <Stack.Screen name="VisitPrep" component={VisitPrepScreen} options={{ title: '🩺 Visit Prep' }} />
      <Stack.Screen name="PhotoTimeline" component={PhotoTimelineScreen} options={{ headerShown: false }} />
      <Stack.Screen name="KnowledgeHub"   component={KnowledgeHubScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="CaregiverCard"   component={CaregiverCardScreen}   options={{ title: '🤝 Caregiver Card'    }} />
      <Stack.Screen name="GrowthPredictor" component={GrowthPredictorScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VaccinePrep"     component={VaccinePrepScreen}     options={{ headerShown: false }} />
      <Stack.Screen name="FeedAnalytics"   component={FeedAnalyticsScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="ScheduleBuilder" component={ScheduleBuilderScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
