// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = 'BabySaathi AI';
export const APP_VERSION = '1.0.0';

// ─── Firebase Collections ────────────────────────────────────────────────────

export const COLLECTIONS = {
  USERS: 'users',
  BABIES: 'babies',
  FEEDS: 'feeds',
  SLEEP: 'sleep',
  DIAPERS: 'diapers',
  GROWTH: 'growth',
  VACCINES: 'vaccines',
  MILESTONES: 'milestones',
  JOURNAL: 'journal',
  CRY_EVENTS: 'cryEvents',
  AI_PREDICTIONS: 'aiPredictions',
  SUBSCRIPTIONS: 'subscriptions',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  FAMILY_MEMBERS: 'familyMembers',
  DIGITAL_TWINS: 'digitalTwins',
} as const;

// ─── India Vaccination Schedule ──────────────────────────────────────────────

export const INDIA_VACCINE_SCHEDULE = [
  { id: 'bcg', name: 'BCG', ageWeeks: 0, description: 'Bacillus Calmette–Guérin', diseases: ['Tuberculosis'] },
  { id: 'opv0', name: 'OPV 0', ageWeeks: 0, description: 'Oral Polio Vaccine (birth dose)', diseases: ['Polio'] },
  { id: 'hepb1', name: 'Hepatitis B 1', ageWeeks: 0, description: 'Hepatitis B birth dose', diseases: ['Hepatitis B'] },
  { id: 'dtpipvhib1', name: 'DTP+IPV+Hib 1', ageWeeks: 6, description: 'Pentavalent 1st dose', diseases: ['Diphtheria', 'Tetanus', 'Pertussis', 'Polio', 'Hib'] },
  { id: 'pcv1', name: 'PCV 1', ageWeeks: 6, description: 'Pneumococcal Conjugate Vaccine 1', diseases: ['Pneumonia', 'Meningitis'] },
  { id: 'rotavirus1', name: 'Rotavirus 1', ageWeeks: 6, description: 'Rotavirus 1st dose', diseases: ['Rotavirus diarrhoea'] },
  { id: 'dtpipvhib2', name: 'DTP+IPV+Hib 2', ageWeeks: 10, description: 'Pentavalent 2nd dose', diseases: ['Diphtheria', 'Tetanus', 'Pertussis', 'Polio', 'Hib'] },
  { id: 'pcv2', name: 'PCV 2', ageWeeks: 10, description: 'Pneumococcal Conjugate Vaccine 2', diseases: ['Pneumonia', 'Meningitis'] },
  { id: 'rotavirus2', name: 'Rotavirus 2', ageWeeks: 10, description: 'Rotavirus 2nd dose', diseases: ['Rotavirus diarrhoea'] },
  { id: 'dtpipvhib3', name: 'DTP+IPV+Hib 3', ageWeeks: 14, description: 'Pentavalent 3rd dose', diseases: ['Diphtheria', 'Tetanus', 'Pertussis', 'Polio', 'Hib'] },
  { id: 'pcv3', name: 'PCV 3', ageWeeks: 14, description: 'Pneumococcal Conjugate Vaccine 3', diseases: ['Pneumonia', 'Meningitis'] },
  { id: 'rotavirus3', name: 'Rotavirus 3', ageWeeks: 14, description: 'Rotavirus 3rd dose', diseases: ['Rotavirus diarrhoea'] },
  { id: 'measles1', name: 'Measles-Rubella 1', ageWeeks: 36, description: 'MR vaccine 1st dose', diseases: ['Measles', 'Rubella'] },
  { id: 'je1', name: 'JE 1', ageWeeks: 36, description: 'Japanese Encephalitis 1', diseases: ['Japanese Encephalitis'] },
  { id: 'vitamin_a_1', name: 'Vitamin A 1st dose', ageWeeks: 36, description: 'Vitamin A supplementation', diseases: [] },
  { id: 'measles2', name: 'Measles-Rubella 2', ageWeeks: 72, description: 'MR vaccine 2nd dose', diseases: ['Measles', 'Rubella'] },
  { id: 'dtp_booster', name: 'DTP Booster 1', ageWeeks: 72, description: 'DTP booster dose', diseases: ['Diphtheria', 'Tetanus', 'Pertussis'] },
  { id: 'je2', name: 'JE 2', ageWeeks: 72, description: 'Japanese Encephalitis 2', diseases: ['Japanese Encephalitis'] },
] as const;

// ─── Milestone Definitions ────────────────────────────────────────────────────

export const MILESTONE_DEFINITIONS = [
  // Physical
  { id: 'm1', category: 'physical', title: 'First Smile', expectedAgeWeeks: 6 },
  { id: 'm2', category: 'physical', title: 'Holds Head Up', expectedAgeWeeks: 8 },
  { id: 'm3', category: 'physical', title: 'First Roll', expectedAgeWeeks: 16 },
  { id: 'm4', category: 'physical', title: 'Sits Without Support', expectedAgeWeeks: 28 },
  { id: 'm5', category: 'physical', title: 'First Crawl', expectedAgeWeeks: 36 },
  { id: 'm6', category: 'physical', title: 'Pulls to Stand', expectedAgeWeeks: 40 },
  { id: 'm7', category: 'physical', title: 'First Step', expectedAgeWeeks: 52 },
  { id: 'm8', category: 'physical', title: 'First Tooth', expectedAgeWeeks: 28 },
  // Social
  { id: 'm9', category: 'social', title: 'Recognizes Parents', expectedAgeWeeks: 4 },
  { id: 'm10', category: 'social', title: 'Social Smile', expectedAgeWeeks: 6 },
  { id: 'm11', category: 'social', title: 'Waves Bye-Bye', expectedAgeWeeks: 40 },
  { id: 'm12', category: 'social', title: 'Plays Peek-a-Boo', expectedAgeWeeks: 32 },
  // Language
  { id: 'm13', category: 'language', title: 'First Coo', expectedAgeWeeks: 8 },
  { id: 'm14', category: 'language', title: 'Babbling', expectedAgeWeeks: 20 },
  { id: 'm15', category: 'language', title: 'Says Mama/Dada', expectedAgeWeeks: 40 },
  { id: 'm16', category: 'language', title: 'First Word', expectedAgeWeeks: 52 },
  // Cognitive
  { id: 'm17', category: 'cognitive', title: 'Tracks Moving Objects', expectedAgeWeeks: 8 },
  { id: 'm18', category: 'cognitive', title: 'Reaches for Objects', expectedAgeWeeks: 16 },
  { id: 'm19', category: 'cognitive', title: 'Object Permanence', expectedAgeWeeks: 36 },
  { id: 'm20', category: 'cognitive', title: 'Imitates Actions', expectedAgeWeeks: 44 },
];

// ─── Cry Detection ────────────────────────────────────────────────────────────

export const CRY_ANALYSIS_DURATION = 5; // seconds
export const CRY_MIN_DURATION = 2; // seconds
export const CRY_CONFIDENCE_THRESHOLD = 0.6;

// ─── Analytics ────────────────────────────────────────────────────────────────

export const DAILY_FEED_GOAL = 8;
export const DAILY_SLEEP_GOAL = 16; // hours for newborn
export const DAILY_DIAPER_GOAL = 6;

// ─── Subscription ────────────────────────────────────────────────────────────

export const REVENUECAT_API_KEY_IOS = 'your_revenuecat_ios_key';
export const REVENUECAT_API_KEY_ANDROID = 'your_revenuecat_android_key';

export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  PREMIUM_FAMILY: 'premium_family',
} as const;

// ─── Supported Languages ─────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
] as const;
