# 🧿 BabySaathi AI

> **Har Maa ka Digital Dadi** — AI-powered parenting companion for Indian families

BabySaathi AI is a React Native + Expo app for Indian parents of babies 0–24 months. It combines daily baby tracking, Hinglish AI guidance, community support, age-appropriate food and symptom advice — all built around Indian culture and offline-first reliability.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Screens & Navigation](#screens--navigation)
- [Services](#services)
- [State Management](#state-management)
- [Theme & Design System](#theme--design-system)
- [Languages Supported](#languages-supported)
- [Subscription Plans](#subscription-plans)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Building for Production](#building-for-production)
- [Firestore Collections](#firestore-collections)
- [Architecture Notes](#architecture-notes)

---

## Features

### 🍼 Baby Tracker
- **Feed tracking** — breastfeed (left/right side), formula (ml + brand), solids (food type) with live stopwatch timer
- **Sleep tracking** — start/stop timer, elapsed display, daily total vs. age-appropriate goal
- **Diaper logging** — one-tap wet/dirty/mixed/dry with daily count and history
- **Growth tracking** — weight, height, head circumference with history list + WhatsApp share button
- **Vaccination schedule** — full India NIP (19 vaccines, BCG to JE), overdue flagging, 7-day + 1-day push reminders per vaccine
- **Milestone tracker** — 20 WHO milestones across physical/social/language/cognitive; confetti burst on achievement + WhatsApp share

### 🧿 AI Guru
- **Hinglish persona** — warm dadi/nani style, responds in Hindi + English mix
- **Context-aware** — injects baby's name, age in weeks, gender, birth weight, blood group, last 5 feeds, last 5 sleep entries, and last 3 diapers into every response
- **Last-feed warning** — if no feed in 3+ hours, AI proactively flags it
- **Cry analysis tab** — audio-based cry detection (hunger / pain / tired / gas / unknown)
- **Chat tab** — free-text parenting questions with regex-based intent routing
- **Daily tips tab** — age-appropriate suggestions
- **System prompt builder** (`buildSystemPrompt`) — production-ready for real Claude API via Cloud Functions

### 👨‍👩‍👧 Community (Samaj)
- Hinglish posts in 7 categories: Trending, पहला बच्चा, दूध/Feeding, नींद/Sleep, टीका/Vaccines, बीमारी/Illness, सभी/All
- Peacock gradient header, rangoli decoration, search toggle, pull-to-refresh
- `🧿 AI Guru verified` badge on expert-answered posts
- **Report system** — flag icon on every post; 6 report reasons (spam, misinformation, unsafe medical, abusive, off-topic, other); writes to Firestore `moderation_reports`
- **AI auto-flag** — 6 regex patterns scan new content for spam, unsafe medical advice, crisis keywords, abuse, misinformation, PII phone numbers

### 🍲 Baby Food Guide
- 22 age-appropriate Indian foods from 6 to 12 months
- Filter by baby's current age (auto-detected) or a specific age stage
- 6 food categories: Grains/Anaj, Vegetables/Sabzi, Fruits/Phal, Protein/Dal, Dairy/Dudh, Spices/Masale
- Expandable cards: Hindi name, benefits, preparation method (how-to), caution notes
- Classic Indian foods included: Khichdi, Ragi porridge, Moong dal, Dahi, Desi Ghee, Haldi, Chikoo, Ragi

### 🩺 Symptom Checker
- 11 symptoms across 6 categories: fever, digestion, sleep, skin, breathing, feeding
- **Age-aware severity** based on baby's actual age in weeks: 🏠 Home / 👀 Monitor / 👨‍⚕️ Doctor / 🚨 Emergency
- Each result shows: English clinical advice + traditional **Desi gharelu nuskhe** (home remedies)
- Emergency severity shows a "Call 108 (Ambulance)" button using `Linking`
- Symptoms include: low/high fever, colic, constipation, diarrhea, not sleeping, diaper rash, jaundice, cold/congestion, refusing feeds, vomiting

### 📴 Offline Mode
- All 7 tracker write operations work offline with **optimistic UI updates**
- Operations queued in `AsyncStorage` as `QueuedOperation[]`
- Auto-flushed to Firestore on reconnect via `@react-native-community/netinfo`
- Up to 3 retries per operation before dropping
- Queue status logged to console for debugging

### 🔔 Push Notifications
- **Feed reminder** — 3 hours after last logged feed, cancelled and rescheduled on every new feed
- **Vaccine alert** — 7 days before + 1 day before scheduled date
- **Milestone nudge** — when baby is within 4 weeks of expected milestone age
- **Daily AI insight** — repeating trigger at 08:00 daily
- **Sleep goal reminder** — fires at 21:00 if daily sleep target not yet met
- `cancelAllNotifications()` called on logout cleanup

### 📊 Analytics & Reports
- Victory Native charts: feed frequency, sleep duration, growth curves (7/14/30-day range)
- **Doctor report PDF** — 30-day health summary exported via `expo-print` + `expo-sharing`
- Download or share directly from Profile screen

### 👑 Subscription (RevenueCat)
- Free / Premium ₹199/mo / Family ₹349/mo
- Annual plans: ₹1,999/yr (Premium) · ₹3,499/yr (Family)
- 7-day free trial on both paid plans
- 7-day history limit on free tier
- RevenueCat silently fails in Expo Go — dev build required for testing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.85 + Expo SDK 56 |
| Language | TypeScript (strict mode) |
| State | Zustand 5 |
| Navigation | React Navigation 7 — native stack + bottom tabs |
| Backend | Firebase v10 modular SDK (Firestore, Auth, Storage) |
| Subscriptions | RevenueCat (`react-native-purchases` 10) |
| Notifications | expo-notifications |
| Offline queue | AsyncStorage + @react-native-community/netinfo |
| i18n | react-i18next + i18next (10 languages) |
| Animations | React Native Animated API (no Reanimated dependency for confetti) |
| Charts | victory-native + react-native-svg |
| PDF | expo-print + expo-sharing |
| Gradients | expo-linear-gradient |
| Haptics | expo-haptics |
| Blur | expo-blur |
| Camera | expo-camera + expo-image-picker |
| Audio | expo-av (cry detection) |
| Secure storage | expo-secure-store (language preference) |

---

## Project Structure

```
BabySaathi/
├── App.tsx                              # Root — init auth, offline queue, notifications
├── package.json
├── tsconfig.json
├── babel.config.js                      # Path aliases
│
└── src/
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── ConfettiOverlay.tsx      # 60-particle pure-Animated confetti (ref.burst())
    │   │   ├── EmptyState.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── Input.tsx
    │   │   ├── LoadingOverlay.tsx
    │   │   ├── OfflineBanner.tsx        # NetInfo-driven offline indicator
    │   │   ├── RangoliBorder.tsx        # 16-diamond rangoli decoration strip
    │   │   ├── Skeleton.tsx
    │   │   ├── Toast.tsx
    │   │   └── index.ts
    │   └── community/
    │       ├── PostCard.tsx             # Report modal (flag icon → bottom sheet → 6 reasons)
    │       └── index.ts
    │
    ├── constants/
    │   └── index.ts                     # India vaccine schedule, 20 milestones,
    │                                    # SUPPORTED_LANGUAGES (10), RevenueCat keys
    │
    ├── hooks/
    │   ├── useHaptic.ts                 # light / medium / heavy / success / error / selection
    │   └── useRefresh.ts
    │
    ├── i18n/
    │   ├── index.ts                     # i18next init — 10 languages, fallback: en
    │   └── locales/
    │       ├── en.ts   hi.ts   bn.ts
    │       ├── pa.ts   ta.ts   te.ts
    │       ├── mr.ts   gu.ts   kn.ts
    │       └── ml.ts
    │
    ├── navigation/
    │   ├── index.tsx                    # Root navigator + all modal routes
    │   ├── AuthNavigator.tsx
    │   ├── MainNavigator.tsx            # 5 tabs: Home/Tracker/AI Guru/Community/Profile
    │   ├── OnboardingNavigator.tsx
    │   └── TrackerNavigator.tsx
    │
    ├── screens/
    │   ├── auth/                        # Welcome, Login, Register, OTPVerify, ForgotPassword
    │   ├── onboarding/                  # AddBaby, Notifications, Microphone, Camera, Complete
    │   ├── home/                        # HomeScreen — stats, AI insights, vaccine card,
    │   │                                #              quick log, feature tool shortcuts
    │   ├── tracker/
    │   │   ├── TrackerHomeScreen.tsx
    │   │   ├── FeedTrackerScreen.tsx
    │   │   ├── SleepTrackerScreen.tsx
    │   │   ├── DiaperTrackerScreen.tsx
    │   │   ├── GrowthTrackerScreen.tsx   # + WhatsApp share
    │   │   ├── VaccinationTrackerScreen.tsx
    │   │   └── MilestoneTrackerScreen.tsx # + confetti + WhatsApp share
    │   ├── ai/                           # AIScreen — cry/chat/tips tabs, 🧿 peacock theme
    │   ├── community/
    │   │   ├── CommunityScreen.tsx
    │   │   └── PostDetailScreen.tsx
    │   ├── features/
    │   │   ├── BabyFoodGuideScreen.tsx   # 22 Indian foods, age filter, category filter
    │   │   └── SymptomCheckerScreen.tsx  # 11 symptoms, age-aware, desi remedies
    │   ├── analytics/                    # Victory Native charts
    │   ├── family/                       # Family sharing invite flow
    │   ├── journal/                      # Photo memory journal
    │   ├── profile/                      # Settings, language, doctor PDF, logout
    │   └── subscription/                 # SubscriptionScreen — ₹199/₹349 plans
    │
    ├── services/
    │   ├── ai/
    │   │   ├── aiAssistant.ts            # buildSystemPrompt() + buildResponse()
    │   │   │                             # RecentLogs interface, context-aware rules
    │   │   └── cryDetector.ts            # expo-av heuristic classifier
    │   ├── firebase/
    │   │   ├── config.ts
    │   │   ├── auth.ts
    │   │   ├── firestore.ts              # CRUD for all collections
    │   │   └── storage.ts
    │   ├── moderation/
    │   │   └── contentModerator.ts       # autoFlag() + reportPost() + reportComment()
    │   ├── notifications/
    │   │   └── notificationService.ts    # 5 scheduled trigger types
    │   ├── offline/
    │   │   └── offlineQueue.ts           # AsyncStorage queue + NetInfo auto-flush
    │   ├── pdf/
    │   │   └── reportGenerator.ts
    │   └── subscription/
    │       └── revenueCat.ts
    │
    ├── store/
    │   ├── authStore.ts
    │   ├── babyStore.ts
    │   ├── trackerStore.ts               # All writes have offline-queue fallback
    │   └── aiStore.ts
    │
    ├── theme/
    │   └── index.ts                      # Desi palette, RangoliColors[16],
    │                                     # named gradients, dark mode tokens
    ├── types/
    │   └── index.ts
    │
    └── utils/
        ├── share.ts                      # shareViaWhatsApp() + message builders
        └── validation.ts
```

---

## Screens & Navigation

### Bottom Tabs

| Tab | Icon | Screen | Description |
|---|---|---|---|
| Home | 🏠 घर | `HomeScreen` | Live stats, AI insights, vaccine card, quick log, tool shortcuts |
| Tracker | 📊 ट्रैकर | `TrackerHomeScreen` | Entry to all 6 tracker screens |
| AI Guru | 🧿 | `AIScreen` | Cry analysis / Chat / Daily tips |
| Community | 👨‍👩‍👧 समाज | `CommunityScreen` | Posts, search, categories |
| Profile | 👤 प्रोफ़ाइल | `ProfileScreen` | Baby profile, language, PDF export, logout |

### Modal / Stack Screens

| Screen | Route name | How to reach |
|---|---|---|
| Post detail | `PostDetail` | Tap a community post |
| Baby Food Guide | `BabyFoodGuide` | Home tools grid → 🍲 |
| Symptom Checker | `SymptomChecker` | Home tools grid → 🩺 |
| Subscription | `Subscription` | Profile → upgrade, or gated feature |
| Family Sharing | `FamilySharing` | Profile → family |
| Analytics | `Analytics` | Home → see all stats |

---

## Services

### `aiAssistant.ts`

```ts
interface RecentLogs {
  feeds: FeedEntry[];      // last 5
  sleep: SleepEntry[];     // last 5
  diapers: DiaperEntry[];  // last 3
}

buildSystemPrompt(baby: Baby, logs: RecentLogs): string
// Returns a full dadi/nani persona system prompt with baby profile block
// + recent activity block (timestamps, durations, feed types)
// + "last feed >3hrs" warning when relevant
// Ready for real Claude API calls via Firebase Cloud Functions

generateResponse(msg, baby, stats, logs): AIMessage
// Local rule engine: regex patterns + date-fns time calculations
// References actual baby name + today's real feed/sleep counts in responses
```

### `offlineQueue.ts`

Persists `QueuedOperation[]` to `AsyncStorage` under `@babysaathi_offline_queue`.

```ts
type QueuedOpType =
  | 'ADD_FEED' | 'STOP_FEED'
  | 'ADD_SLEEP' | 'STOP_SLEEP'
  | 'ADD_DIAPER' | 'ADD_GROWTH'
  | 'MARK_VACCINE' | 'MARK_MILESTONE'

offlineQueue.init()           // subscribe to NetInfo
offlineQueue.enqueue(type, payload)  // add to queue; flushes immediately if online
offlineQueue.register(type, handler) // store registers its Firestore handler
offlineQueue.flush()          // process queue (MAX_RETRIES = 3)
offlineQueue.destroy()        // unsubscribe (called on App unmount)
```

### `notificationService.ts`

```ts
requestNotificationPermission()         // also creates Android channel
scheduleFeedReminder(baby, lastFeedTime) // fires 3h after last feed
scheduleVaccineAlert(baby, vaccine)      // 7-day + 1-day before due
scheduleMilestoneNudge(baby, milestone)  // within 4 weeks of expected age
scheduleDailyInsightNotification(name)   // repeating daily 08:00
scheduleSleepGoalReminder(baby, hours)   // 21:00 if goal not met
cancelAllForBaby(babyId)                 // cancel all notifications for one baby
cancelAllNotifications()                 // called on logout
setupNotificationResponseHandler(fn)     // navigate on tap
```

### `contentModerator.ts`

```ts
autoFlag(content: string): FlagResult
// Scans against 6 patterns:
//   spam, unsafe_medical, crisis, abusive_language, misinformation, pii_phone

reportPost(postId, reason, reporterUid, notes?)
// → writes to /moderation_reports
// → increments reportCount on the post document

reportComment(commentId, postId, reason, reporterUid)
```

---

## State Management

| Store | Key state | Key actions |
|---|---|---|
| `authStore` | `user`, `isAuthenticated`, `isLoading`, `hasCompletedOnboarding` | `initialize()`, `logout()` |
| `babyStore` | `babies[]`, `activeBaby` | `fetchBabies()`, `addBaby()`, `setActiveBaby()`, `getBabyAgeWeeks()` |
| `trackerStore` | `feeds`, `sleepEntries`, `diapers`, `growthEntries`, `vaccinations`, `milestones`, `activeFeed`, `activeSleep` | All add/stop/fetch actions; every write falls back to `offlineQueue.enqueue()` on network error |
| `aiStore` | `insights[]`, `cryEvents[]`, `messages[]` | `addInsight()`, `addCryEvent()`, `addMessage()` |

---

## Theme & Design System

BabySaathi uses a **Desi palette** inspired by Indian textiles, spices, and festivals.

### Color Tokens

| Token | Hex | Inspiration |
|---|---|---|
| `primary` | `#C05A00` | Saffron / Kesari |
| `secondary` | `#B8860B` | Turmeric / Haldi |
| `accent` | `#E07B00` | Marigold / Genda phool |
| `peacock` | `#006B6B` | Peacock feather / Mor |
| `mehendi` | `#556B2F` | Mehndi / Henna |
| `rose` | `#A0325A` | Gulabi / Gulab |
| `background` | `#FFF8F0` | Warm cream / Malai |
| `textPrimary` | `#412402` | Dark chai brown |

### Named Gradients
`peacock`, `mehendi`, `rose`, `warm`, `header`, `community`

### RangoliColors
16-color array cycling saffron → marigold → turmeric → mehendi → peacock → rose, used in `RangoliBorder` — the diamond-dot decorative strip shown in all screen headers.

### Dark Mode
Full dark token set under `Colors.dark.*` — background, surface, textPrimary, textSecondary, border.

---

## Languages Supported

| Code | Language | Native Name |
|---|---|---|
| `en` | English | English |
| `hi` | Hindi | हिंदी |
| `bn` | Bengali | বাংলা |
| `pa` | Punjabi | ਪੰਜਾਬੀ |
| `ta` | Tamil | தமிழ் |
| `te` | Telugu | తెలుగు |
| `mr` | Marathi | मराठी |
| `gu` | Gujarati | ગુજરાતી |
| `kn` | Kannada | ಕನ್ನಡ |
| `ml` | Malayalam | മലയാളം |

Language is persisted in `expo-secure-store` and restored on app launch. Missing keys fall back to English via `fallbackLng: 'en'`.

---

## Subscription Plans

| Feature | Free | Premium ₹199/mo | Family ₹349/mo |
|---|---|---|---|
| Feed / Sleep / Diaper / Growth tracking | ✅ | ✅ | ✅ |
| Vaccination schedule | ✅ | ✅ | ✅ |
| History / Itihas | 7 days | Unlimited | Unlimited |
| 🧿 AI Guru chat (Hinglish) | — | ✅ | ✅ |
| AI Cry detection | — | ✅ | ✅ |
| Photo Journal | — | ✅ | ✅ |
| Growth charts & analytics | — | ✅ | ✅ |
| Baby Food Guide | — | ✅ | ✅ |
| Symptom Checker | — | ✅ | ✅ |
| Doctor Report PDF | — | ✅ | ✅ |
| Export all data | — | ✅ | ✅ |
| Family sharing (up to 5) | — | — | ✅ |

Annual plans: **₹1,999/year** (Premium) · **₹3,499/year** (Family) — includes 7-day free trial.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (for quick testing)
- Firebase project with Firestore, Authentication, and Storage enabled
- RevenueCat account (subscription features only; silently skipped in Expo Go)

### Install

```bash
cd BabySaathi
npm install
```

### Run

```bash
npm start          # Expo Go
npm run android    # Android emulator / device
npm run ios        # iOS simulator / device
```

---

## Environment Configuration

**`src/services/firebase/config.ts`** — paste your Firebase web app config:

```ts
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

**`src/constants/index.ts`** — paste RevenueCat keys:

```ts
export const REVENUECAT_API_KEY_IOS     = 'appl_YOUR_KEY';
export const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_KEY';
```

---

## Building for Production

```bash
npm install -g eas-cli
eas login
eas init

# Android APK / AAB
eas build --platform android --profile production

# iOS IPA
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles |
| `babies` | Baby profiles |
| `feeds` | Feed log entries |
| `sleep` | Sleep session entries |
| `diapers` | Diaper log entries |
| `growth` | Growth measurements |
| `vaccines` | Vaccination records |
| `milestones` | Milestone records |
| `journal` | Photo journal entries |
| `cryEvents` | Cry detection results |
| `aiPredictions` | AI insight history |
| `community_posts` | Community posts |
| `moderation_reports` | User-reported content + auto-flagged content |
| `subscriptions` | RevenueCat subscription mirror |
| `familyMembers` | Family sharing invites and roles |

---

## Architecture Notes

### Optimistic UI + Offline
Every tracker write follows this pattern:
1. Generate a `tempId` and update Zustand state immediately (UI feels instant)
2. Attempt Firestore write
3. On network error → `offlineQueue.enqueue(type, payload)`
4. When connectivity returns → `offlineQueue.flush()` replays all queued ops

### Cry Detection
`CryDetectorService` uses `expo-av` audio metering polled at 250ms. A heuristic classifier maps dB level + duration patterns to cry types. Replace `classifyCry()` in `cryDetector.ts` with a TFLite or ONNX model for production accuracy.

### AI Guru Context
`buildSystemPrompt(baby, logs)` in `aiAssistant.ts` produces a full system prompt ready for the Anthropic Claude API (via Firebase Cloud Functions). The local `buildResponse()` is a rule engine fallback for offline/development use.

### Path Aliases

```
@components → src/components
@screens    → src/screens
@store      → src/store
@services   → src/services
@hooks      → src/hooks
@utils      → src/utils
@types      → src/types
@constants  → src/constants
@theme      → src/theme
@i18n       → src/i18n
```

---

*Built with ❤️ for Indian families · Har bachche ki pehli app 🧿*
