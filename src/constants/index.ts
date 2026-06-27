// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = 'BabySaathi AI';
export const APP_VERSION = '1.0.0';

// ─── Firebase Collections ────────────────────────────────────────────────────

// ─── Indian Cultural Milestones ───────────────────────────────────────────────

export const CULTURAL_MILESTONES = [
  {
    id: 'namkaran',
    name: 'Namkaran',
    hindiName: 'नामकरण',
    emoji: '🙏',
    expectedAgeWeeks: 2,
    ageDescription: 'Day 11 after birth',
    tagline: 'Naming Ceremony',
    description: "Baby's name is whispered in the ear and announced to family and the divine. Often guided by a priest using the baby's nakshatra (birth star).",
    significance: 'One of the 16 Sanskrit Samskaras. The name chosen shapes identity and is believed to carry life-long blessings.',
    color: '#C05A00',
    gradientColors: ['#C05A00', '#E07B00'] as [string, string],
  },
  {
    id: 'nishkraman',
    name: 'Nishkraman',
    hindiName: 'निष्क्रमण',
    emoji: '☀️',
    expectedAgeWeeks: 12,
    ageDescription: '3rd or 4th month',
    tagline: 'First Outing Ceremony',
    description: "Baby's first formal outing — shown the sun, sky, and sometimes taken to a temple. Family gathers to bless the baby's entry into the wider world.",
    significance: 'Surya Dev (the sun) is worshipped as a life-giver. This ceremony marks baby moving from indoors to the broader universe.',
    color: '#B8860B',
    gradientColors: ['#B8860B', '#D4A840'] as [string, string],
  },
  {
    id: 'karnavedha',
    name: 'Karnavedha',
    hindiName: 'कर्णवेध',
    emoji: '💍',
    expectedAgeWeeks: 16,
    ageDescription: '3rd to 5th month',
    tagline: 'Ear Piercing Ceremony',
    description: "Baby's ears are pierced on an auspicious day. Traditionally done by a goldsmith or family jeweller, sometimes a doctor.",
    significance: 'Believed to protect from evil and improve hearing. The piercing points correspond to acupressure points in Ayurveda.',
    color: '#A0325A',
    gradientColors: ['#A0325A', '#C75A80'] as [string, string],
  },
  {
    id: 'annaprasan',
    name: 'Annaprasan',
    hindiName: 'अन्नप्राशन',
    emoji: '🍚',
    expectedAgeWeeks: 26,
    ageDescription: '6th month (boy) / 5th or 7th month (girl)',
    tagline: 'First Solid Food Ceremony',
    description: 'Baby tastes solid food for the very first time — traditionally kheer (rice pudding) fed by a special family member during a joyful gathering.',
    significance: "Marks the transition from breast milk to solid nourishment. The foods offered and who feeds baby first carry deep symbolic meaning.",
    color: '#556B2F',
    gradientColors: ['#556B2F', '#7A9645'] as [string, string],
  },
  {
    id: 'dant_puja',
    name: 'Dant Puja',
    hindiName: 'दन्त पूजा',
    emoji: '🦷',
    expectedAgeWeeks: 32,
    ageDescription: '6th to 10th month (first tooth)',
    tagline: 'First Tooth Celebration',
    description: "Baby's first tooth appears — many families celebrate with a small puja, sweets, and photos. A sign of healthy development celebrated with joy.",
    significance: 'In some traditions, the first tooth is preserved as a lucky charm. A moment families love to capture and share.',
    color: '#7A6A5E',
    gradientColors: ['#7A6A5E', '#9E8E7E'] as [string, string],
  },
  {
    id: 'mundan',
    name: 'Mundan',
    hindiName: 'मुंडन',
    emoji: '✂️',
    expectedAgeWeeks: 52,
    ageDescription: '1st or 3rd year',
    tagline: 'First Haircut Ceremony',
    description: "Baby's head is shaved for the first time in a sacred ceremony. The hair is often offered at a temple or immersed in a holy river.",
    significance: 'Removes impurities and promotes healthy hair growth. Also a rite of passage marking the end of infancy.',
    color: '#006B6B',
    gradientColors: ['#006B6B', '#008B8B'] as [string, string],
  },
  {
    id: 'first_birthday',
    name: 'First Birthday',
    hindiName: 'पहला जन्मदिन',
    emoji: '🎂',
    expectedAgeWeeks: 52,
    ageDescription: '1 year',
    tagline: 'Janmadin Puja · Birthday Celebration',
    description: 'A major milestone for the whole family! Many families return to the same temple from Namkaran to offer thanks, followed by a grand celebration.',
    significance: 'Completing one year is deeply auspicious. The deity who blessed the name now blesses the journey of a full year.',
    color: '#E07B00',
    gradientColors: ['#E07B00', '#F5B86A'] as [string, string],
  },
] as const;

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
  TEMPERATURES: 'temperatures',
  MEDICATIONS: 'medications',
  CULTURAL_MILESTONES: 'culturalMilestones',
  CHAT_MESSAGES: 'chatMessages',
  INTRODUCED_FOODS: 'introducedFoods',
  MOM_CHECKINS: 'momCheckIns',
  EPDS_RESULTS: 'epdsResults',
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

// ─── Fever Thresholds (Celsius) ──────────────────────────────────────────────

export const FEVER_THRESHOLDS = {
  axillary:  { low_grade: 37.2, fever: 37.8, high_fever: 39.5 },
  oral:      { low_grade: 37.5, fever: 38.0, high_fever: 39.5 },
  rectal:    { low_grade: 38.0, fever: 38.5, high_fever: 39.5 },
  forehead:  { low_grade: 37.5, fever: 38.0, high_fever: 39.5 },
} as const;

// ─── Common Baby Medicines ────────────────────────────────────────────────────

export const COMMON_BABY_MEDICINES = [
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    brandNames: ['Calpol', 'Metacin', 'Meftal'],
    dosePerKgMin: 10, // mg/kg
    dosePerKgMax: 15, // mg/kg
    concentration: 120,  // mg per 5 ml
    concentrationVolume: 5, // ml
    unit: 'ml' as const,
    frequency: 'Every 4–6 hours',
    maxDosesPerDay: 4,
    intervalHours: 5,
    minAgeWeeks: 0,
    icon: '🔴',
    color: '#C05A00',
    reason: 'Fever / Pain',
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    brandNames: ['Brufen', 'Ibugesic', 'Emflam'],
    dosePerKgMin: 5,
    dosePerKgMax: 10,
    concentration: 100, // mg per 5 ml
    concentrationVolume: 5,
    unit: 'ml' as const,
    frequency: 'Every 6–8 hours',
    maxDosesPerDay: 3,
    intervalHours: 7,
    minAgeWeeks: 24, // 6 months
    icon: '🟠',
    color: '#E07B00',
    reason: 'Fever / Pain (6m+)',
  },
  {
    id: 'ors',
    name: 'ORS',
    brandNames: ['Electral', 'Pedialyte'],
    dosePerKgMin: null,
    dosePerKgMax: null,
    concentration: null,
    concentrationVolume: null,
    unit: 'ml' as const,
    frequency: 'As needed',
    maxDosesPerDay: null,
    intervalHours: null,
    minAgeWeeks: 0,
    icon: '💧',
    color: '#006B6B',
    reason: 'Diarrhea / Dehydration',
  },
  {
    id: 'zinc',
    name: 'Zinc Syrup',
    brandNames: ['Zinconia', 'Zincovit'],
    dosePerKgMin: null,
    dosePerKgMax: null,
    concentration: null,
    concentrationVolume: null,
    unit: 'ml' as const,
    frequency: 'Once daily × 14 days',
    maxDosesPerDay: 1,
    intervalHours: 24,
    minAgeWeeks: 24,
    icon: '🟡',
    color: '#B8860B',
    reason: 'Diarrhea (6m+)',
  },
  {
    id: 'vitamin_d',
    name: 'Vitamin D Drops',
    brandNames: ['D-Rise', 'Arachitol', 'Aquadek'],
    dosePerKgMin: null,
    dosePerKgMax: null,
    concentration: null,
    concentrationVolume: null,
    unit: 'drops' as const,
    frequency: 'Once daily',
    maxDosesPerDay: 1,
    intervalHours: 24,
    minAgeWeeks: 0,
    icon: '☀️',
    color: '#556B2F',
    reason: 'Daily Supplement',
  },
] as const;

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
