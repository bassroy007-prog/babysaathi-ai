# 🍼 BabySaathi

> **Har Maa ka Digital Dadi** — AI-powered baby care companion for Indian families

BabySaathi is a React Native + Expo app for Indian parents of babies aged 0–24 months. It combines live daily tracking, deep analytics, Hinglish AI guidance, and culturally-grounded content — all built for offline-first reliability and the Indian family context.

**Live preview:** open [`preview.html`](./preview.html) in any browser for a full interactive demo of all screens.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Screens & Navigation](#screens--navigation)
- [Analytics & Insights](#analytics--insights)
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

### 🍼 Daily Trackers

| Tracker | What it does |
|---|---|
| **Feed Tracker** | Breastfeed (left/right/both) with live stopwatch, formula (ml + brand), solids (food type). Start/stop timer with haptic feedback. |
| **Sleep Tracker** | Start/stop sleep sessions, elapsed display, daily total vs. age-appropriate goal, 16-hr progress bar. |
| **Diaper Tracker** | One-tap wet/dirty/mixed/dry with daily count and timestamped history. |
| **Growth Tracker** | Weight, height, head circumference — with normalized kg/g handling and WhatsApp share button. |
| **Vaccination Tracker** | Full India NIP (BCG → JE), overdue flagging, 7-day + 1-day push reminders. |
| **Milestone Tracker** | 20 WHO milestones across 4 domains; confetti burst on achievement + WhatsApp share. |
| **Medicine Tracker** | Log medicine name, dose, frequency; upcoming reminders. |

### 📊 Analytics & Insights

| Screen | Capability |
|---|---|
| **Feed Analytics** | 24-hour heatmap, type breakdown (breast/formula/solid), night feed %, longest stretches, cluster feeding detection, consolidation trend with 7d/14d/30d range. |
| **Sleep Analysis** | Daily nap vs. night sleep stacked chart (Victory Native), bedtime trend, 28-day pattern, weekly comparison, age-appropriate recommendations. |
| **Growth Predictor** | WHO P3–P50–P97 curve chart, linear regression forecast (4-week + 8-week), velocity scoring vs. WHO targets, percentile trend over last 4 readings. |
| **Schedule Builder** | Age-band wake-window norms (8 bands: newborn → 24m), wake time auto-detected from last 7 days of feed data, full day timeline with colour-coded blocks, WhatsApp share. |

### 🛡️ Vaccine Prep

- Side-effect cards per vaccine (mild/moderate/red-flag)
- Paracetamol dose calculator: `10mg/kg × weight / (120mg/5ml)` rounded to nearest 0.25ml
- Pre-visit interactive checklist (8 items) with live counter
- "Do NOT give paracetamol before DTP" warning baked in
- WhatsApp share of full visit prep summary

### 📚 Guides & Knowledge

| Screen | Content |
|---|---|
| **Knowledge Hub** | Age-gated articles in 5 categories (Development, Feeding, Sleep, Health, Concerns); featured article matched to baby's current week. |
| **Baby Food Guide** | 22 age-appropriate Indian foods (6–12m), filtered by age and category (Grains, Sabzi, Phal, Dal, Dairy, Masale); expandable cards with Hindi name, benefits, preparation, cautions. |
| **Cultural Milestones** | Namkaran, Annaprasan, Mundan — timing, meaning, and modern guidance. |

### 🤝 Family & Care

| Screen | What it does |
|---|---|
| **Caregiver Card** | Live handoff summary (last feed, next feed prediction, last nap, diapers, allergies, emergency contacts); WhatsApp + PDF export. |
| **Mom's Wellness** | Daily check-in: mood emoji, water intake, meals, sleep hours, notes. EPDS 10-question postnatal depression screening with risk classification (low/moderate/high) and iCall helpline integration. |
| **Photo Timeline** | Photo memory journal with date-stamped entries. |
| **Family Sharing** | Invite up to 5 family members (Family plan); role-based access. |

### 🤖 AI Guru

- **Hinglish persona** — warm dadi/nani style (Hindi + English mix)
- **Context injection** — baby name, age in weeks, gender, birth weight, blood group, last 5 feeds, last 5 sleep entries, last 3 diapers on every response
- **Late-feed warning** — flags if no feed logged in 3+ hours
- **Cry analysis** — `expo-av` heuristic classifier: hunger / pain / tired / gas / unknown
- **Daily tips tab** — age-appropriate suggestions
- `buildSystemPrompt()` in `aiAssistant.ts` is ready for real Claude API calls via Firebase Cloud Functions

### 👨‍👩‍👧 Community (Samaj)

- Hinglish posts in 7 categories: Trending, पहला बच्चा, दूध/Feeding, नींद/Sleep, टीका/Vaccines, बीमारी/Illness, सभी/All
- Peacock gradient + rangoli decoration
- `🧿 AI Guru verified` badge on expert posts
- **Report system** — 6 reasons; writes to `moderation_reports`
- **AI auto-flag** — 6 regex patterns scan for spam, unsafe medical advice, crisis keywords, abuse, misinformation, phone PII

### 📋 Reports

| Report | Contents |
|---|---|
| **Daily Report** | Today's feeds, sleep, diapers, growth — exported as PDF via `expo-print` + `expo-sharing` |
| **Monthly Report** | 30-day summary with charts, percentile movement, milestone log |
| **Visit Prep** | 2-week snapshot formatted for a paediatric consultation |

### 🔔 Push Notifications

Managed by `src/services/notifications.ts` and `src/hooks/useNotifications.ts`:

- **Feed reminder** — fires at `lastFeed + avgInterval − 10min`; avgInterval computed from last 10 feeds (30–360min gaps only)
- **Sleep window alert** — fires at `wakeTime + ageBandWakeWindow − 15min`
- **Vaccine alerts** — day-before (10am) + 3-days-before (10am) for any vaccine due in 14 days; capped at 15 concurrent notifications
- All triggers guard `instanceof Date` + `isNaN` before scheduling; failures are silently caught

### 📴 Offline Mode

- All 7 tracker write operations use **optimistic UI** (Zustand updated first)
- Failed writes → `AsyncStorage` queue under `@babysaathi_offline_queue`
- Auto-flushed on reconnect via `@react-native-community/netinfo`
- Max 3 retries per operation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.85.3 + Expo SDK 56 |
| Language | TypeScript (strict mode) |
| State | Zustand 5 |
| Navigation | React Navigation 7 — native stack + bottom tabs |
| Backend | Firebase v10 modular SDK (Firestore, Auth, Storage) |
| Subscriptions | RevenueCat (`react-native-purchases` 10) |
| Notifications | `expo-notifications` |
| Offline queue | `AsyncStorage` + `@react-native-community/netinfo` |
| i18n | `react-i18next` + `i18next` (10 languages) |
| Charts | `victory-native` + `react-native-svg` |
| PDF | `expo-print` + `expo-sharing` |
| Gradients | `expo-linear-gradient` |
| Haptics | `expo-haptics` |
| Camera | `expo-camera` + `expo-image-picker` |
| Audio | `expo-av` (cry detection) |
| Secure storage | `expo-secure-store` (language preference) |
| Animations | React Native Animated API (no Reanimated for confetti) |

---

## Project Structure

```
BabySaathi/
├── App.tsx                              # Root: init auth, offline queue, notifications
├── preview.html                         # Interactive HTML demo of all screens
├── package.json
├── tsconfig.json
├── babel.config.js                      # Path aliases
│
└── src/
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── BlockPrintCorner.tsx     # SVG Bagh/Bagru block-print corner motif (vines, leaves, dots)
    │   │   ├── ConfettiOverlay.tsx      # 60-particle pure-Animated confetti (ref.burst())
    │   │   ├── EmptyState.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── Input.tsx
    │   │   ├── LoadingOverlay.tsx
    │   │   ├── OfflineBanner.tsx        # NetInfo-driven offline indicator
    │   │   ├── RangoliBorder.tsx        # 16-diamond rangoli decorative strip
    │   │   ├── Skeleton.tsx
    │   │   ├── Toast.tsx
    │   │   └── index.ts
    │   └── community/
    │       ├── PostCard.tsx             # Report modal (flag → 6 reasons)
    │       └── index.ts
    │
    ├── constants/
    │   ├── index.ts                     # India NIP schedule, 20 milestones,
    │   │                                # SUPPORTED_LANGUAGES, RevenueCat keys
    │   ├── postpartumData.ts            # MOOD_OPTIONS, EPDS_QUESTIONS, BLEEDING_OPTIONS,
    │   │                                # getEPDSRisk(), getTodaysTip()
    │   └── scheduleGuide.ts            # 8 AgeBand entries (newborn → 24m):
    │                                    # wakeWindowMin/Max, napsPerDay, napDur,
    │                                    # totalSleep, nightSleep, nightFeeds, tips[]
    │
    ├── hooks/
    │   ├── useFeedPredictor.ts          # Next-feed countdown with confidence badge
    │   ├── useGrandparentMode.ts        # GP mode font scale + hit-area enlarger
    │   ├── useHaptic.ts
    │   ├── useNotifications.ts          # Wires feed/sleep/vaccine notifications to store
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
    │   ├── index.tsx                    # Root navigator + modal routes
    │   ├── AuthNavigator.tsx
    │   ├── MainNavigator.tsx            # 5 tabs: Home/Tracker/AI Guru/Community/Profile
    │   ├── OnboardingNavigator.tsx
    │   └── TrackerNavigator.tsx         # 22 stack screens under Tracker tab
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   ├── OTPVerifyScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   ├── onboarding/
    │   │   ├── AddBabyScreen.tsx
    │   │   ├── NotificationsScreen.tsx
    │   │   ├── MicrophoneScreen.tsx
    │   │   ├── CameraScreen.tsx
    │   │   └── OnboardingCompleteScreen.tsx
    │   ├── home/
    │   │   └── HomeScreen.tsx           # Stats grid, feed predictor, AI insights,
    │   │                                # next vaccine card, quick log, tool shortcuts
    │   ├── tracker/
    │   │   ├── TrackerHomeScreen.tsx    # 5 sections with coloured accent bars
    │   │   ├── FeedTrackerScreen.tsx
    │   │   ├── SleepTrackerScreen.tsx
    │   │   ├── DiaperTrackerScreen.tsx
    │   │   ├── GrowthTrackerScreen.tsx
    │   │   ├── VaccinationTrackerScreen.tsx
    │   │   ├── MilestoneTrackerScreen.tsx  # Confetti + WhatsApp share
    │   │   ├── MedicineTrackerScreen.tsx
    │   │   ├── FeedAnalyticsScreen.tsx  # Heatmap, type bar, charts, stretches
    │   │   ├── SleepAnalysisScreen.tsx  # Stacked nap/night chart, bedtime trend
    │   │   ├── GrowthPredictorScreen.tsx  # WHO curve, regression forecast
    │   │   ├── ScheduleBuilderScreen.tsx  # Timeline blocks, age-band norms
    │   │   ├── VaccinePrepScreen.tsx    # Vaccine cards, checklist, dose calculator
    │   │   ├── KnowledgeHubScreen.tsx   # Age-gated articles, weekly feature
    │   │   ├── BabyFoodGuideScreen.tsx  # 22 Indian foods, age+category filters
    │   │   ├── CulturalMilestonesScreen.tsx
    │   │   ├── DailyReportScreen.tsx
    │   │   ├── MonthlyReportScreen.tsx
    │   │   ├── VisitPrepScreen.tsx
    │   │   ├── MomHealthScreen.tsx      # Mood check-in + EPDS screening
    │   │   ├── CaregiverCardScreen.tsx  # Live handoff + WhatsApp/PDF share
    │   │   └── PhotoTimelineScreen.tsx
    │   ├── ai/
    │   │   └── AIScreen.tsx             # Cry / Chat / Tips tabs, 🧿 peacock theme
    │   ├── analytics/
    │   │   └── AnalyticsScreen.tsx
    │   ├── community/
    │   │   ├── CommunityScreen.tsx
    │   │   └── PostDetailScreen.tsx
    │   ├── family/
    │   │   └── FamilySharingScreen.tsx
    │   ├── journal/
    │   │   └── JournalScreen.tsx
    │   ├── profile/
    │   │   └── ProfileScreen.tsx        # Settings, language, PDF export, logout
    │   └── subscription/
    │       └── SubscriptionScreen.tsx   # ₹199/₹349 plans
    │
    ├── services/
    │   ├── ai/
    │   │   ├── aiAssistant.ts           # buildSystemPrompt() + buildResponse()
    │   │   └── cryDetector.ts           # expo-av heuristic cry classifier
    │   ├── firebase/
    │   │   ├── config.ts
    │   │   ├── auth.ts
    │   │   ├── firestore.ts             # CRUD for all collections
    │   │   └── storage.ts
    │   ├── moderation/
    │   │   └── contentModerator.ts      # autoFlag() + reportPost() + reportComment()
    │   ├── notifications.ts             # Feed reminder, sleep window, vaccine alerts
    │   ├── offline/
    │   │   └── offlineQueue.ts          # AsyncStorage queue + NetInfo auto-flush
    │   ├── pdf/
    │   │   └── reportGenerator.ts
    │   └── subscription/
    │       └── revenueCat.ts
    │
    ├── store/
    │   ├── authStore.ts
    │   ├── babyStore.ts
    │   ├── trackerStore.ts              # All writes have offline-queue fallback
    │   ├── aiStore.ts
    │   └── momStore.ts                  # Mom check-ins, EPDS results
    │
    ├── theme/
    │   └── index.ts                     # Desi palette, RangoliColors[16],
    │                                    # named gradients, dark mode tokens
    ├── types/
    │   └── index.ts
    │
    └── utils/
        ├── feedAnalytics.ts             # Heatmap, type breakdown, cluster detection,
        │                                # consolidation trend, WhatsApp text builder
        ├── growthPredictor.ts           # WHO curve data, linear regression,
        │                                # velocity scoring, percentile trend
        ├── percentile.ts                # calculateApproxPercentile(), getWHOCurveData()
        ├── scheduleBuilder.ts           # buildSchedule(), wake detection from feed data,
        │                                # timeline block generation, WhatsApp text builder
        ├── sleepAnalysis.ts             # getDailySleepData(), getSleepStats(),
        │                                # getRecommendedSleep(), getWeeklyTrend()
        ├── vaccinePrep.ts               # fetchVaccinePrepData(), paracetamol dose calc,
        │                                # buildVisitPrepText()
        ├── feedPredictor.ts             # Next-feed prediction with confidence scoring
        ├── share.ts                     # shareViaWhatsApp() + message builders
        └── validation.ts
```

---

## Screens & Navigation

### Bottom Tabs

| Tab | Icon | Screen | Description |
|---|---|---|---|
| Home | 🏠 घर | `HomeScreen` | Live stats, AI feed predictor, AI insights, vaccine card, quick log, tool shortcuts |
| Tracker | 📊 ट्रैकर | `TrackerHomeScreen` | 5 sections: Daily Trackers · Insights · Reports · Guides · Family & Care |
| AI Guru | 🧿 | `AIScreen` | Cry analysis / Chat / Daily tips — Hinglish dadi/nani persona |
| Community | 👨‍👩‍👧 समाज | `CommunityScreen` | Posts, search, 7 category tabs |
| Profile | 👤 प्रोफ़ाइल | `ProfileScreen` | Baby settings, language, PDF export, logout |

### Tracker Sub-screens (22 screens)

#### Daily Trackers
| Screen | Route | Gradient |
|---|---|---|
| Feed Tracker | `FeedTracker` | Orange `#EA580C` |
| Sleep Tracker | `SleepTracker` | Blue `#3B82F6` |
| Diaper Tracker | `DiaperTracker` | Teal `#10B981` |
| Growth Tracker | `GrowthTracker` | Purple `#8B5CF6` |
| Vaccination Tracker | `VaccinationTracker` | Amber `#F59700` |
| Milestone Tracker | `MilestoneTracker` | Pink `#EC4899` |
| Medicine Tracker | `MedicineTracker` | Blue `#2563EB` |

#### Insights
| Screen | Route | Gradient |
|---|---|---|
| Feed Analytics | `FeedAnalytics` | Deep orange `#7C2D12 → #C2410C` |
| Sleep Analysis | `SleepAnalysis` | Midnight blue `#1A3A6B → #3B5FA8` |
| Growth Predictor | `GrowthPredictor` | Indigo `#1E1B4B → #4338CA` |
| Schedule Builder | `ScheduleBuilder` | Teal `#134E4A → #0D9488` |

#### Reports
| Screen | Route |
|---|---|
| Daily Report | `DailyReport` |
| Monthly Report | `MonthlyReport` |
| Visit Prep | `VisitPrep` |

#### Guides
| Screen | Route |
|---|---|
| Knowledge Hub | `KnowledgeHub` |
| Baby Food Guide | `BabyFoodGuide` |
| Vaccine Prep | `VaccinePrep` |
| Cultural Milestones | `CulturalMilestones` |

#### Family & Care
| Screen | Route |
|---|---|
| Mom's Wellness | `MomHealth` |
| Caregiver Card | `CaregiverCard` |
| Photo Timeline | `PhotoTimeline` |

---

## Analytics & Insights

### Feed Analytics (`feedAnalytics.ts`)

```ts
fetchFeedAnalytics(baby: Baby, days: 7 | 14 | 30): Promise<FeedAnalyticsData>
```

- **Input validation** — rejects entries with invalid/future dates, entries outside the requested range
- **Type breakdown** — breastfeed / formula / solid counts and percentages; avg duration (min) and avg amount (ml)
- **24-hour heatmap** — `hourDistribution[24]`, `maxHourCount`, `peakHour`; night hours `{22,23,0,1,2,3,4,5}` rendered at reduced opacity
- **Night feeds** — count, percentage, `daysWithZeroNightFeeds` (celebrated in UI)
- **Longest stretches** — top 3 gaps > 60min, with start/end timestamps
- **Cluster feeding** — detects any 3+ feeds within a 3-hour sliding window per day
- **Consolidation trend** — compares first-half vs. second-half daily averages; classifies as `consolidating | stable | increasing` with ±0.8 threshold

### Growth Predictor (`growthPredictor.ts`)

```ts
fetchGrowthTrendData(baby: Baby): Promise<GrowthTrendData | null>
```

- **Input validation** — rejects null weights, future-dated entries, pre-birth entries, implausible weights (≤0 or >50kg raw)
- **Regression** — unweighted least-squares on last 6 data points; `slope (kg/month) × 1000 / 30.44 = g/day`
- **WHO curves** — `getWHOCurveData(gender, 'weight', maxMonth)` returns P3 / P50 / P97 series
- **Velocity scoring** — `VELOCITY_NORMS` table indexed by age band; classifies as `excellent | good | watch | low`
- **Predictions** — 4-week and 8-week forecasts with `±8% × (weeksAhead/4)` confidence band
- **Percentile trend** — compares first vs. last of last-4-readings; `+5pt` threshold for `rising | stable | falling`

### Schedule Builder (`scheduleBuilder.ts` + `scheduleGuide.ts`)

```ts
buildSchedule(baby: Baby): Promise<ScheduleResult>
```

- **8 age bands** — newborn (0–6w), 6–12w, 3–5m, 5–7m, 7–9m, 9–12m, 12–18m, 18–24m
- **Wake time detection** — queries last 7 days of feeds, filters 4am–10am window per day, takes the **median** first-feed time; `dataConfidence: 'detected' | 'default'`
- **Block types** — `wake | play | feed | nap | bedtime_routine | night_sleep | night_feed`
- **Nap rules** — 3+ nap schedules use a 45-min catnap as final nap; night feeds spaced evenly by `nightSleepDur / (nightFeeds + 1)`

### Sleep Analysis (`sleepAnalysis.ts`)

- 28-day window; splits entries into `nap` (6am–8pm) and `night` (8pm–6am)
- Victory Native stacked bar chart (nap = `#6B9FD4`, night = `#1A3A6B`)
- `getRecommendedSleep(ageWeeks)` returns age-appropriate target range
- `getWeeklyTrend()` compares last 7 days vs. prior 7 days

---

## Services

### `notifications.ts`

```ts
requestNotificationPermissions(): Promise<void>

scheduleFeedReminder(babyName, lastFeedTime, avgIntervalMins)
// fires at: lastFeedTime + avgInterval - 10 min

scheduleSleepWindowAlert(babyName, lastWakeTime, wakeWindowMins)
// fires at: lastWakeTime + wakeWindow - 15 min

scheduleVaccineAlerts(babyName, vaccinations)
// for each pending vaccine due within 14 days:
//   day-of alert at 09:00, 3-day-before at 10:00
// cancels existing vaccine alerts before scheduling; caps at 15 total
```

### `useNotifications.ts`

```ts
export function useNotifications(): void
```

Called once in `TrackerHomeScreen`. Three `useEffect` blocks:
1. Requests permissions on first mount
2. Re-schedules feed reminder whenever `feeds` changes (uses last 10 feeds, 30–360min gaps)
3. Re-schedules sleep alert whenever `sleepEntries` changes (uses `getAgeBand(ageWeeks).wakeWindow`)
4. Schedules vaccine alerts whenever `activeBaby.id` changes

### `vaccinePrep.ts`

```ts
fetchVaccinePrepData(baby: Baby): Promise<VaccinePrepData>
```

- Groups pending/overdue vaccines by date key
- Paracetamol dose: `mg = 10 × weightKg` → `ml = mg × 5 / 120` rounded to nearest 0.25ml
- Guards corrupt `scheduledDate` with `instanceof Date` + `isNaN` check before calling `format()`

### `aiAssistant.ts`

```ts
buildSystemPrompt(baby: Baby, logs: RecentLogs): string
// Full dadi/nani persona with baby profile + recent activity block
// Ready for Claude API via Firebase Cloud Functions

generateResponse(message, baby, stats, logs): AIMessage
// Local rule engine + date-fns time calculations
// Flags if last feed > 3 hours ago
```

### `offlineQueue.ts`

```ts
type QueuedOpType =
  | 'ADD_FEED' | 'STOP_FEED'
  | 'ADD_SLEEP' | 'STOP_SLEEP'
  | 'ADD_DIAPER' | 'ADD_GROWTH'
  | 'MARK_VACCINE' | 'MARK_MILESTONE'

offlineQueue.enqueue(type, payload)   // optimistic → queue
offlineQueue.flush()                  // NetInfo triggers this; MAX_RETRIES = 3
offlineQueue.register(type, handler)  // stores register Firestore handlers
```

### `contentModerator.ts`

```ts
autoFlag(content: string): FlagResult
// Scans 6 patterns: spam, unsafe_medical, crisis, abusive_language,
//                   misinformation, pii_phone

reportPost(postId, reason, reporterUid, notes?)
// → /moderation_reports; increments post.reportCount
```

---

## State Management

| Store | Key state | Key actions |
|---|---|---|
| `authStore` | `user`, `isAuthenticated`, `isLoading`, `hasCompletedOnboarding` | `initialize()`, `logout()` |
| `babyStore` | `babies[]`, `activeBaby` | `fetchBabies()`, `addBaby()`, `setActiveBaby()`, `getBabyAgeText()`, `getBabyAgeWeeks()` |
| `trackerStore` | `feeds`, `sleepEntries`, `diapers`, `growthEntries`, `vaccinations`, `milestones`, `activeFeed`, `activeSleep` | All add/stop/fetch actions; writes fall back to `offlineQueue.enqueue()` on error |
| `aiStore` | `insights[]`, `cryEvents[]`, `messages[]` | `addInsight()`, `addCryEvent()`, `addMessage()`, `fetchInsights()` |
| `momStore` | `todayCheckIn`, `recentCheckIns[]`, `epdsResults[]` | `fetchTodayCheckIn()`, `saveCheckIn()`, `saveEPDSResult()` |

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
| `terra` | `#C1440E` | Terracotta / Rajasthani pottery |
| `clay` | `#9B4A2A` | Clay / Kumhaar's mitti |
| `indigoDye` | `#1B2A5F` | Neel dye / Bagh-Bagru block print |
| `baingan` | `#7B2D8B` | Brinjal purple |
| `feedColor` | `#EA580C` | Orange (feed tracker) |
| `sleepColor` | `#3B82F6` | Blue (sleep tracker) |
| `diaperColor` | `#10B981` | Teal (diaper tracker) |
| `growthColor` | `#8B5CF6` | Purple (growth tracker) |
| `background` | `#FFF8F0` | Warm cream / Malai |
| `textPrimary` | `#412402` | Dark chai brown |

### Named Gradients
`peacock`, `mehendi`, `rose`, `warm`, `header`, `community`, `saffronHaldi`, `terra`, `indigoDye`, `mehendiDeep`, `baingan`

### TrackerSectionColors
Per-section desi accent colors used in `TrackerHomeScreen` for border bars, icon backgrounds, and card left-borders:

| Section | Color | Name |
|---|---|---|
| Daily Trackers | `#C1440E` | Terracotta |
| Insights | `#1B2A5F` | Indigo dye |
| Reports | `#2D5A1B` | Mehendi deep |
| Guides | `#92400E` | Amber dark |
| Family & Care | `#7B2D8B` | Baingan |

### RangoliColors
16-color array cycling saffron → marigold → turmeric → mehendi → peacock → rose; used in `RangoliBorder` — the diamond-dot decorative strip in community screen headers.

### Grandparent Mode
`useGrandparentMode()` hook returns `{ isGP, fs, dim, hit }` — scales font sizes, touch targets, and card dimensions for elderly family members.

### Dark Mode
Full dark token set under `Colors.dark.*` — background, surface, textPrimary, textSecondary, border.

---

## Languages Supported

| Code | Language | Native name |
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

Language is persisted in `expo-secure-store` and restored on app launch. Missing keys fall back to `en`.

---

## Subscription Plans

| Feature | Free | Premium ₹199/mo | Family ₹349/mo |
|---|---|---|---|
| Feed / Sleep / Diaper / Growth tracking | ✅ | ✅ | ✅ |
| Vaccination schedule | ✅ | ✅ | ✅ |
| History | 7 days | Unlimited | Unlimited |
| AI Guru chat (Hinglish) | — | ✅ | ✅ |
| AI Cry detection | — | ✅ | ✅ |
| Feed Analytics + Sleep Analysis | — | ✅ | ✅ |
| Growth Predictor + Schedule Builder | — | ✅ | ✅ |
| Vaccine Prep + Knowledge Hub | — | ✅ | ✅ |
| Mom's Wellness + EPDS | — | ✅ | ✅ |
| Caregiver Card + Photo Timeline | — | ✅ | ✅ |
| Baby Food Guide + Symptom Checker | — | ✅ | ✅ |
| Doctor Report PDF | — | ✅ | ✅ |
| Export all data | — | ✅ | ✅ |
| Family sharing (up to 5) | — | — | ✅ |

Annual plans: **₹1,999/year** (Premium) · **₹3,499/year** (Family) — both include a **7-day free trial**.

RevenueCat silently fails in Expo Go — use a dev build for subscription testing.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app (for quick testing) or Expo Dev Build (for subscriptions/notifications)
- Firebase project with Firestore, Authentication, and Storage enabled
- RevenueCat account (subscription features only)

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

**`src/services/firebase/config.ts`** — paste your Firebase config:

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

| Collection | Documents / purpose |
|---|---|
| `users` | User profiles |
| `babies` | Baby profiles (name, DOB, gender, birthWeight, bloodGroup) |
| `feeds` | Feed log entries (type, startTime, endTime, side, amount, brand, foodType) |
| `sleep` | Sleep sessions (startTime, endTime, duration, autoDetected) |
| `diapers` | Diaper entries (type, color, consistency, timestamp) |
| `growth` | Growth measurements (date, weight, height, headCircumference) |
| `vaccines` | Vaccination records (vaccineName, scheduledDate, status, administeredDate) |
| `milestones` | Milestone records (milestoneId, achievedDate, status) |
| `medicines` | Medicine log entries (name, dose, frequency, startDate) |
| `journal` | Photo journal entries (photoUri, caption, date) |
| `mom_checkins` | Daily mom wellness check-ins (mood, water, meals, sleep, notes) |
| `epds_results` | EPDS screening results (score, risk, date) |
| `cryEvents` | Cry detection results (type, confidence, duration, timestamp) |
| `aiPredictions` | AI insight history (type, title, message, confidence) |
| `community_posts` | Community posts (content, category, reportCount, aiVerified) |
| `moderation_reports` | User-reported + auto-flagged content |
| `subscriptions` | RevenueCat subscription mirror |
| `familyMembers` | Family sharing invites and roles |

All collections use `babyId` as a field for flat-collection queries (not sub-collections) to keep Firestore rules simple.

---

## Architecture Notes

### Optimistic UI + Offline
Every tracker write follows this pattern:
1. Generate a `tempId`, update Zustand state immediately (UI is instant)
2. Attempt Firestore write
3. On network error → `offlineQueue.enqueue(type, payload)`
4. Connectivity restored → `offlineQueue.flush()` replays with max 3 retries

### Data Quality Guards
All analytics utilities (`feedAnalytics.ts`, `growthPredictor.ts`, `vaccinePrep.ts`) filter at ingestion:
- `instanceof Date` + `isNaN()` on every date field
- Future-dated entries rejected
- Weights normalized: `w > 50 ? w / 1000 : w` (handles gram/kg inconsistency)
- Pre-birth age entries rejected (`ageMo < 0`)

### Feed Predictor
`useFeedPredictor()` hook computes next-feed time from the last 10 feeds using a sliding average of gaps within 30–360min range. Confidence is `high` (≥5 feeds), `medium` (3–4), or `low` (<3). Progress bar fills from last feed time to predicted time.

### Cry Detection
`CryDetectorService` polls `expo-av` audio metering at 250ms. A heuristic maps dB level + duration pattern to `hunger | pain | tired | gas | unknown`. Replace `classifyCry()` with a TFLite or ONNX model for production accuracy.

### AI Guru Context
`buildSystemPrompt(baby, logs)` in `aiAssistant.ts` is production-ready for Claude API calls via Firebase Cloud Functions. The local `buildResponse()` rule engine serves as an offline/development fallback.

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
