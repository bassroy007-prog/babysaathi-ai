// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'parent' | 'grandparent' | 'caregiver' | 'pediatrician';

export interface User {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  fcmToken?: string;
  language: string;
  subscriptionTier: SubscriptionTier;
  activeBabyId?: string;
}

// ─── Baby Profile ───────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface Baby {
  id: string;
  ownerId: string;
  name: string;
  birthDate: Date;
  gender: Gender;
  birthWeight: number; // grams
  birthHeight: number; // cm
  headCircumference: number; // cm
  bloodGroup: BloodGroup;
  hospitalName?: string;
  pediatricianName?: string;
  photoURL?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Feeding ────────────────────────────────────────────────────────────────

export type FeedType = 'breastfeed' | 'formula' | 'solid';
export type BreastSide = 'left' | 'right' | 'both';

export interface FeedEntry {
  id: string;
  babyId: string;
  userId: string;
  type: FeedType;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  // breastfeed
  side?: BreastSide;
  // formula
  amount?: number; // ml
  brand?: string;
  // solid
  foodType?: string;
  quantity?: string;
  notes?: string;
  createdAt: Date;
}

// ─── Sleep ──────────────────────────────────────────────────────────────────

export type SleepQuality = 'good' | 'fair' | 'poor';

export interface SleepEntry {
  id: string;
  babyId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  quality?: SleepQuality;
  notes?: string;
  autoDetected: boolean;
  createdAt: Date;
}

// ─── Diaper ─────────────────────────────────────────────────────────────────

export type DiaperType = 'wet' | 'dirty' | 'mixed' | 'dry';
export type DiaperColor = 'yellow' | 'green' | 'brown' | 'black' | 'red' | 'other';

export interface DiaperEntry {
  id: string;
  babyId: string;
  userId: string;
  time: Date;
  type: DiaperType;
  color?: DiaperColor;
  notes?: string;
  createdAt: Date;
}

// ─── Growth ─────────────────────────────────────────────────────────────────

export interface GrowthEntry {
  id: string;
  babyId: string;
  userId: string;
  date: Date;
  weight?: number; // grams
  height?: number; // cm
  headCircumference?: number; // cm
  notes?: string;
  createdAt: Date;
}

// ─── Vaccination ─────────────────────────────────────────────────────────────

export interface VaccineSchedule {
  id: string;
  name: string;
  ageWeeks: number;
  description: string;
  diseases: string[];
}

export interface VaccinationEntry {
  id: string;
  babyId: string;
  vaccineId: string;
  vaccineName: string;
  scheduledDate: Date;
  administeredDate?: Date;
  doctorName?: string;
  hospitalName?: string;
  certificateURL?: string;
  photoURL?: string;
  notes?: string;
  status: 'pending' | 'administered' | 'skipped' | 'overdue';
  createdAt: Date;
}

// ─── Milestones ──────────────────────────────────────────────────────────────

export type MilestoneCategory = 'physical' | 'social' | 'language' | 'cognitive';

export interface Milestone {
  id: string;
  babyId: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  achievedDate?: Date;
  expectedAgeWeeks: number;
  photoURL?: string;
  videoURL?: string;
  notes?: string;
  achieved: boolean;
  createdAt: Date;
}

// ─── Cry Detection ──────────────────────────────────────────────────────────

export type CryType = 'hunger' | 'sleep' | 'discomfort' | 'pain' | 'unknown';

export interface CryEvent {
  id: string;
  babyId: string;
  userId: string;
  detectedAt: Date;
  duration: number; // seconds
  predictions: CryPrediction[];
  dominantType: CryType;
  userFeedback?: CryType;
  audioURL?: string;
  createdAt: Date;
}

export interface CryPrediction {
  type: CryType;
  confidence: number; // 0-100
}

// ─── AI ─────────────────────────────────────────────────────────────────────

export interface AIInsight {
  id: string;
  babyId: string;
  type: 'feeding' | 'sleep' | 'growth' | 'cry' | 'general';
  title: string;
  message: string;
  confidence: number;
  actionable: boolean;
  action?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  babyId: string;
  userId: string;
  date: Date;
  title?: string;
  content?: string;
  photoURLs: string[];
  videoURLs: string[];
  milestoneId?: string;
  mood?: 'happy' | 'neutral' | 'tired' | 'worried';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Family ─────────────────────────────────────────────────────────────────

export type FamilyPermission = 'view' | 'edit' | 'admin';

export interface FamilyMember {
  id: string;
  babyId: string;
  userId: string;
  email?: string;
  phoneNumber?: string;
  displayName: string;
  role: UserRole;
  permission: FamilyPermission;
  invitedAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'active' | 'revoked';
}

// ─── Subscription ────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'premium' | 'premium_family';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  revenueCatId?: string;
  platform: 'ios' | 'android' | 'web';
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'feed_reminder'
  | 'sleep_prediction'
  | 'vaccine_due'
  | 'cry_detected'
  | 'milestone_available'
  | 'growth_update'
  | 'ai_insight';

export interface AppNotification {
  id: string;
  userId: string;
  babyId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
}

// ─── Cultural Milestones ─────────────────────────────────────────────────────

export interface CulturalMilestoneEntry {
  id: string;
  babyId: string;
  userId: string;
  ceremonyId: string;
  ceremonyName: string;
  celebratedDate?: Date;
  celebrated: boolean;
  notes?: string;
  photoURL?: string;
  createdAt: Date;
}

// ─── Postpartum Mom Health ────────────────────────────────────────────────────

export type MomMood = 'great' | 'good' | 'okay' | 'low' | 'overwhelmed';
export type MomBleeding = 'heavy' | 'moderate' | 'light' | 'none' | 'na';
export type EPDSRisk = 'low' | 'moderate' | 'high';

export interface MomCheckIn {
  id: string;
  babyId: string;
  userId: string;
  date: Date;
  mood: MomMood;
  moodScore: number;      // 0–4
  waterGlasses: number;   // target 8
  mealsCount: number;     // 0–3
  sleepHours: number;     // mom's sleep last night
  painLevel: number;      // 0–5
  bleeding: MomBleeding;
  notes?: string;
  createdAt: Date;
}

export interface EPDSResult {
  id: string;
  babyId: string;
  userId: string;
  date: Date;
  answers: number[];    // 10 scores (0–3 each)
  totalScore: number;   // 0–30
  risk: EPDSRisk;
  createdAt: Date;
}

// ─── Baby Food & Weaning ─────────────────────────────────────────────────────

export type IntroducedFoodReaction = 'good' | 'mild' | 'allergic';

export interface IntroducedFood {
  id: string;
  babyId: string;
  foodId: string;
  foodName: string;
  dateIntroduced: Date;
  reaction: IntroducedFoodReaction;
  notes?: string;
  createdAt: Date;
}

// ─── Temperature & Medicine ──────────────────────────────────────────────────

export type TemperatureSite = 'axillary' | 'oral' | 'rectal' | 'forehead';
export type FeverStatus = 'normal' | 'low_grade' | 'fever' | 'high_fever';

export interface TemperatureEntry {
  id: string;
  babyId: string;
  userId: string;
  time: Date;
  temperature: number; // Celsius
  site: TemperatureSite;
  feverStatus: FeverStatus;
  notes?: string;
  createdAt: Date;
}

export type MedicationUnit = 'ml' | 'mg' | 'drops' | 'sachet' | 'tablet';

export interface MedicationEntry {
  id: string;
  babyId: string;
  userId: string;
  medicineName: string;
  dose: number;
  unit: MedicationUnit;
  givenAt: Date;
  nextDoseAt?: Date;
  prescribedBy?: string;
  reason?: string;
  notes?: string;
  createdAt: Date;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  BabySetup: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerify: { phoneNumber: string };
};

export type OnboardingStackParamList = {
  OnboardingAddBaby: undefined;
  OnboardingNotifications: undefined;
  OnboardingMicrophone: undefined;
  OnboardingCamera: undefined;
  OnboardingComplete: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tracker: undefined;
  AI: undefined;
  Journal: undefined;
  Profile: undefined;
};

export type TrackerStackParamList = {
  TrackerHome: undefined;
  FeedTracker: undefined;
  SleepTracker: undefined;
  DiaperTracker: undefined;
  GrowthTracker: undefined;
  VaccinationTracker: undefined;
  MilestoneTracker: undefined;
  MedicineTracker: undefined;
  CulturalMilestones: undefined;
  BabyFoodGuide: undefined;
  DailyReport: undefined;
  MomHealth: undefined;
  SleepAnalysis: undefined;
  MonthlyReport: undefined;
  VisitPrep: undefined;
  PhotoTimeline: undefined;
  KnowledgeHub: undefined;
  CaregiverCard: undefined;
  GrowthPredictor: undefined;
  VaccinePrep: undefined;
  FeedAnalytics: undefined;
  ScheduleBuilder: undefined;
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  feedCount: number;
  sleepHours: number;
  diaperCount: number;
  cryEvents: number;
  nextVaccine?: VaccinationEntry;
  latestInsight?: AIInsight;
  babyAgeWeeks: number;
  babyAgeDays: number;
}

// ─── Digital Twin ────────────────────────────────────────────────────────────

export interface DigitalTwin {
  babyId: string;
  avgFeedInterval: number; // minutes
  avgSleepDuration: number; // minutes
  typicalHungerCues: string[];
  dominantCryTypes: Record<CryType, number>;
  preferredSoothingMethods: string[];
  growthPercentile: number;
  lastUpdated: Date;
  predictionAccuracy: number; // 0-100
}
