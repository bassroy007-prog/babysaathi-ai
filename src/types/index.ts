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
