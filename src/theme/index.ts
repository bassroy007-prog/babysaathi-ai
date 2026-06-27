import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette — Desi / Indian Festive Theme ─────────────────────────────

export const Colors = {
  // Primary brand — Saffron
  primary: '#C05A00',
  primaryLight: '#E8976A',
  primaryDark: '#8F3D00',

  // Secondary — Turmeric
  secondary: '#B8860B',
  secondaryLight: '#D4B04A',
  secondaryDark: '#8A6208',

  // Accent — Marigold
  accent: '#E07B00',
  accentLight: '#F5B86A',
  accentDark: '#A05200',

  // Extended palette — India-inspired
  peacock: '#006B6B',
  peacockLight: '#008B8B',
  peacockDark: '#004D4D',
  mehendi: '#556B2F',
  mehendiLight: '#7A9645',
  mehendiDark: '#3A4A1F',
  rose: '#A0325A',
  roseLight: '#C75A80',
  roseDark: '#7A1E40',

  // Terracotta — fired earth, Rajasthani pottery
  terra: '#C1440E',
  terraLight: '#E8785A',
  terraDark: '#8F2E07',

  // Clay — unglazed earthen pot
  clay: '#9B4A2A',
  clayLight: '#C07856',

  // Indigo — natural neel dye (Bagh/Bagru block-print base)
  indigoDye: '#1B2A5F',
  indigoDyeLight: '#4A5898',

  // Baingan — brinjal purple (vibrant Indian hue)
  baingan: '#7B2D8B',
  bainganLight: '#A855B8',

  // Semantic colors — remapped to desi palette
  success: '#556B2F',
  successLight: '#A5C468',
  warning: '#B8860B',
  warningLight: '#D4B04A',
  error: '#B03020',
  errorLight: '#E8A898',

  // Cry type colors
  cryHunger: '#C05A00',
  crySleep: '#006B6B',
  cryDiscomfort: '#E07B00',
  cryPain: '#A0325A',
  cryUnknown: '#9E8E7E',

  // Tracker colors
  feedColor: '#C05A00',
  sleepColor: '#006B6B',
  diaperColor: '#B8860B',
  growthColor: '#556B2F',

  // Neutral — warm cream base
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceVariant: '#FAEEDA',
  border: '#E8C99A',
  divider: '#F0E4D0',

  // Text — warm brown tones
  textPrimary: '#412402',
  text: '#412402',
  textSecondary: '#7A4820',
  textTertiary: '#A07050',
  textDisabled: '#C4A080',
  textOnPrimary: '#FFFFFF',

  // Dark Mode overrides
  dark: {
    background: '#1A0E00',
    surface: '#2D1800',
    surfaceVariant: '#3D2500',
    border: '#5D3500',
    divider: '#3D2500',
    textPrimary: '#F5E8D8',
    textSecondary: '#C4986A',
    textDisabled: '#6B4820',
  },

  // Gradients (as array pairs)
  gradients: {
    primary: ['#C05A00', '#E07B00'],
    secondary: ['#B8860B', '#D4A840'],
    peacock: ['#006B6B', '#008B8B'],
    mehendi: ['#556B2F', '#7A9645'],
    rose: ['#A0325A', '#C75A80'],
    soft: ['#FFF8F0', '#FAEEDA'],
    warm: ['#E07B00', '#C05A00'],
    header: ['#412402', '#6B3A10'],
    community: ['#006B6B', '#008B8B'],
    // New desi gradients
    saffronHaldi: ['#C05A00', '#E07B00'],   // tracker header
    terra:        ['#C1440E', '#E07B00'],   // daily trackers section
    indigoDye:    ['#1B2A5F', '#2D3580'],   // insights section
    mehendiDeep:  ['#3A4A1F', '#556B2F'],   // guides section
    baingan:      ['#7B2D8B', '#A855B8'],   // family section
  },
} as const;

// ─── Tracker section accent colors — one per section ─────────────────────────
// Used in TrackerHomeScreen for section headers + card left-border accents

export const TrackerSectionColors = {
  'Daily Trackers': '#C1440E',   // terracotta
  'Insights':       '#1B2A5F',   // indigo dye
  'Reports':        '#2D5A1B',   // mehendi
  'Guides':         '#92400E',   // dark amber / haldi brown
  'Family & Care':  '#7B2D8B',   // baingan purple
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  fontRegular: 'System',
  fontMedium: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',

  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 40,

  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.8,

  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 11, lineHeight: 16 },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: '#C05A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#C05A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C05A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Screen Dimensions ───────────────────────────────────────────────────────

export const Screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
  isTablet: SCREEN_WIDTH >= 768,
} as const;

// ─── Animation Durations ─────────────────────────────────────────────────────

export const Animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

// ─── Grandparent Mode ────────────────────────────────────────────────────────

export const GrandparentTheme = {
  fontSize: {
    base: 18,
    md: 20,
    lg: 24,
    xl: 28,
  },
  buttonHeight: 60,
  iconSize: 32,
} as const;

// ─── Rangoli dot strip colors ─────────────────────────────────────────────────
// Used by RangoliBorder component; defined here so screens can customize them

export const RangoliColors = [
  '#C05A00',
  '#E07B00',
  '#B8860B',
  '#556B2F',
  '#006B6B',
  '#A0325A',
  '#E07B00',
  '#C05A00',
  '#B8860B',
  '#556B2F',
  '#006B6B',
  '#A0325A',
  '#E07B00',
  '#C05A00',
  '#B8860B',
  '#006B6B',
] as const;

export default {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Screen,
  Animations,
  GrandparentTheme,
  RangoliColors,
  TrackerSectionColors,
};
