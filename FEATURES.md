# BabySaathi AI — Features Guide

> AI-powered parenting companion built for Indian families with newborns and infants (0–24 months).

---

## Table of Contents

1. [Feed Tracker](#1-feed-tracker)
2. [Sleep Tracker](#2-sleep-tracker)
3. [Diaper Tracker](#3-diaper-tracker)
4. [Growth Tracker](#4-growth-tracker)
5. [Vaccination Tracker](#5-vaccination-tracker)
6. [Milestone Tracker](#6-milestone-tracker)
7. [AI Cry Detection](#7-ai-cry-detection)
8. [AI Parenting Assistant](#8-ai-parenting-assistant)
9. [Daily AI Insights](#9-daily-ai-insights)
10. [Memory Journal](#10-memory-journal)
11. [Analytics & Charts](#11-analytics--charts)
12. [Doctor Report PDF](#12-doctor-report-pdf)
13. [Family Sharing](#13-family-sharing)
14. [Multi-Language Support](#14-multi-language-support)
15. [Subscription Tiers](#15-subscription-tiers)
16. [Notifications & Reminders](#16-notifications--reminders)
17. [Offline Support](#17-offline-support)
18. [Grandparent Mode](#18-grandparent-mode)

---

## 1. Feed Tracker

Track every feeding session — breastfeeding, formula, and solid food — with a live timer and full history.

### What you can log
| Type | Details captured |
|------|-----------------|
| Breastfeed | Left side / Right side / Both, duration via live stopwatch |
| Formula | Amount in ml, brand name |
| Solid food | Food name, portion size |

### How it works
- Tap **Start Feed** — a stopwatch begins counting
- Switch sides mid-feed without stopping the timer
- Tap **Stop** — the session is saved automatically
- View today's full feed list, sorted newest first
- Pull down to refresh anytime

### Smart alerts
- If no feed is logged for 3+ hours, a push notification reminds you
- Today's feed count is shown on the Home dashboard

---

## 2. Sleep Tracker

Monitor every nap and night sleep with a one-tap timer, daily goal tracking, and session history.

### How it works
- Tap **Start Sleep** when baby falls asleep — the timer counts up live
- Tap **Stop Sleep** when baby wakes — duration is saved
- See today's total sleep hours vs. the **16-hour daily goal**
- A progress bar fills as the goal is reached
- The last 10 sleep sessions are listed with start time, end time, and duration

### Dashboard summary
- Hours today
- Number of sessions
- Hours remaining toward the daily goal

---

## 3. Diaper Tracker

One-tap logging for every diaper change, with a daily summary and health alerts.

### Diaper types
| Type | Icon | Meaning |
|------|------|---------|
| Wet | 💧 | Urine only |
| Dirty | 💩 | Stool only |
| Mixed | 🔄 | Both |
| Dry | ✅ | No output (useful for tracking dry periods) |

### How it works
- Four large quick-log buttons — tap once to record instantly
- Today's summary shows total changes, wet count, and dirty count
- An alert banner appears if fewer than 4 changes are logged (normal: 6–8/day for infants)
- Pull to refresh the list at any time

---

## 4. Growth Tracker

Record weight, height, and head circumference measurements over time and watch your baby grow.

### What you can track
- **Weight** — in kilograms (e.g. 6.5 kg)
- **Height** — in centimetres (e.g. 65 cm)
- **Head circumference** — in centimetres (e.g. 40 cm)

### How it works
- Tap **Add Measurement** to open the entry form
- Each measurement is optional — log just weight if that's all you have
- Latest measurements are always shown at the top
- History shows the last 10 entries, most recent first
- Growth data feeds the Analytics charts for trend visualisation

---

## 5. Vaccination Tracker

Full India National Immunization Schedule — never miss a vaccine again.

### Coverage
- **19 vaccines** from birth to 18 months
- BCG, OPV 0/1/2/3, Hepatitis B, DPT, IPV, Hib, RVV, PCV, MMR, Typhoid, Hepatitis A, JE
- Due dates are calculated automatically from baby's birth date

### How it works
- **Pending tab** — shows upcoming vaccines sorted by due date
- **Administered tab** — shows completed vaccines with the date given
- Overdue vaccines are highlighted with a red border and ⚠️ badge
- Tap the checkmark on any vaccine → confirmation prompt → mark as done → toast confirmation
- Doctor name is saved with each administered vaccine if provided

### Reminders
- Push notification 7 days before each vaccine is due
- Cloud Function runs daily at 9 AM IST to check and send reminders

---

## 6. Milestone Tracker

Track 20 WHO developmental milestones across four categories with an achievement timeline.

### Categories
| Category | Examples |
|----------|---------|
| 🤸 Physical | Holds head up, rolls over, sits without support, walks |
| 😊 Social | Smiles responsively, recognises parents, waves bye-bye |
| 💬 Language | Coos, babbles, says "mama/dada", 2-word sentences |
| 🧠 Cognitive | Follows moving objects, looks for hidden toys, imitates actions |

### How it works
- Filter milestones by category using the chip selector
- Milestones approaching within 4 weeks show an **"Approaching soon!"** badge
- Tap the checkmark → celebrate prompt → mark as achieved → stored with the date
- Progress bar shows X / 20 milestones achieved
- Baby's current age in weeks is displayed for easy reference

---

## 7. AI Cry Detection

On-device audio analysis that classifies your baby's cry in real time — no internet required.

> **Premium feature** — requires Premium or Family subscription

### How it works
1. Tap **Start Listening** — microphone activates
2. The app monitors audio levels every 250 ms using `expo-av`
3. When a cry is detected (above –35 dB threshold), analysis begins
4. The cry is classified into one of five types:

| Cry type | Meaning | Suggested action |
|----------|---------|-----------------|
| 🍼 Hunger | Rhythmic, low-pitched, rising | Feeding time |
| 😴 Sleepy | Whiny, intermittent, nasal | Put baby down to sleep |
| 😣 Discomfort | Continuous, mid-pitched | Check diaper, temperature |
| 😢 Pain | High-pitched, sudden, intense | Comfort immediately, check for cause |
| ❓ Unknown | Unclear pattern | Observe and try common comforts |

### Confidence display
- An animated **CryPredictionBar** shows the confidence level for each classification
- User feedback (thumbs up / thumbs down) trains the baby's Digital Twin over time

### Privacy
- All audio processing happens **on-device** — no audio is ever uploaded to any server
- TFLite / ONNX model integration ready for production-grade accuracy

---

## 8. AI Parenting Assistant

A conversational AI chat assistant that answers parenting questions, personalised to your baby's age and profile.

> **Premium feature** — requires Premium or Family subscription

### Topics covered
- Feeding schedules and amounts by age
- Sleep training methods and nap schedules
- Vaccine information and preparation tips
- Growth percentiles and what's normal
- Milestone guidance and developmental activities
- Common infant illnesses and when to see a doctor
- General parenting tips and Indian family practices

### How it works
- Type any question in natural language
- The assistant recognises intent from keywords and provides age-appropriate answers
- Baby's name, age in weeks, and feeding type are woven into responses
- Chat history is preserved within the session
- Suggested quick questions appear for common topics

---

## 9. Daily AI Insights

Automatically generated insights about your baby's patterns, delivered fresh every morning.

> **Premium feature** — requires Premium or Family subscription

### Types of insights
| Type | Example |
|------|---------|
| 🍼 Feeding | "Aarav fed 8 times yesterday — slightly above average. Consider longer intervals." |
| 😴 Sleep | "Sleep duration dropped by 2 hours this week. Check for teething or growth spurt." |
| 📏 Growth | "Weight gain is on track with WHO standards for 12-week-old boys." |
| ⭐ Milestone | "Aarav is approaching the 'rolls over' milestone — try tummy time today!" |
| 💡 General | "Hot weather alert: increase feeds by 1–2 sessions to prevent dehydration." |

### How it works
- A Cloud Function runs every day at **8 AM IST**
- It analyses the last 7 days of tracker data
- Up to 5 personalised insights are written to Firestore
- Insights appear on the Home screen and in the AI tab
- Tap to dismiss insights you've acted on

---

## 10. Memory Journal

A beautiful photo diary for capturing and cherishing your baby's precious moments.

> **Premium feature** — requires Premium or Family subscription

### What you can add
- **Title** — a name for the memory (optional)
- **Content** — a written note about the moment
- **Mood** — 😊 Happy / 😐 Neutral / 😴 Tired / 😟 Worried
- **Photos** — multiple images from your gallery

### How it works
- Tap **+ New Memory** to expand the entry form inline
- Select multiple photos at once
- Preview thumbnails before saving
- Entries are saved to Firestore and appear in a timeline view
- Timeline cards show the date badge, mood, text, and photo strip
- Pull to refresh loads new entries

---

## 11. Analytics & Charts

Visual charts of your baby's health data over time, powered by Victory Native.

> **Premium feature** — requires Premium or Family subscription

### Available charts
| Chart | Type | Data |
|-------|------|------|
| Feeding frequency | Line chart | Feeds per day over selected period |
| Sleep duration | Bar chart | Total sleep hours per day |
| Diaper changes | Stacked bar | Wet + dirty + mixed per day |
| Weight trend | Line chart | Weight measurements over time |
| Height trend | Line chart | Height measurements over time |

### Time ranges
- Last **7 days**
- Last **14 days**
- Last **30 days**

---

## 12. Doctor Report PDF

Generate a professional 30-day health summary PDF in one tap — ready to share with your paediatrician.

> **Premium feature** — requires Premium or Family subscription

### What the report includes
- Baby's profile (name, date of birth, gender, blood group)
- 30-day feeding summary (total feeds, average per day, types)
- 30-day sleep summary (total hours, average per day)
- Growth measurements table (weight / height / head circumference with dates)
- Vaccination status table (administered vs pending)
- Recent milestone achievements

### How it works
1. Tap **Doctor Report** in Profile → Settings
2. Data is fetched from the `generateDoctorReport` Cloud Function
3. A branded HTML template is rendered on-device via `expo-print`
4. The share sheet opens — send via WhatsApp, email, or save to files

---

## 13. Family Sharing

Invite up to 5 family members to access and contribute to your baby's care — with role-based permissions.

> **Family tier feature** — requires Premium Family subscription

### Roles
| Role | Permissions |
|------|------------|
| Parent | Full access — read, write, delete all data |
| Caregiver | Read + write tracker data, no profile changes |
| Grandparent | Read-only access with Grandparent Mode UI |
| Doctor | Read-only access to growth, vaccines, and reports |

### How it works
1. Tap **Invite Family** in Profile → Family Sharing
2. Enter the family member's email address and select their role
3. The `sendFamilyInvite` Cloud Function sends an invitation email
4. When they accept, they're added to the baby's `familyMembers` collection
5. They can switch to this baby's profile from their own account

---

## 14. Multi-Language Support

BabySaathi speaks **7 Indian languages** — switch instantly from the Profile screen.

| Language | Script |
|----------|--------|
| English | Latin |
| हिन्दी Hindi | Devanagari |
| বাংলা Bengali | Bengali |
| ਪੰਜਾਬੀ Punjabi | Gurmukhi |
| தமிழ் Tamil | Tamil |
| తెలుగు Telugu | Telugu |
| मराठी Marathi | Devanagari |

- Language preference is saved to device secure storage
- Restored automatically on next app launch
- All screens, labels, error messages, and notifications are translated
- Date formats follow Indian conventions (DD MMM YYYY)

---

## 15. Subscription Tiers

| Feature | Free | Premium | Family |
|---------|:----:|:-------:|:------:|
| Feed / Sleep / Diaper / Growth tracking | ✅ | ✅ | ✅ |
| India vaccination schedule | ✅ | ✅ | ✅ |
| Milestone tracker | ✅ | ✅ | ✅ |
| Multi-language (7 languages) | ✅ | ✅ | ✅ |
| AI Cry Detection | ❌ | ✅ | ✅ |
| AI Parenting Assistant | ❌ | ✅ | ✅ |
| Daily AI Insights | ❌ | ✅ | ✅ |
| Baby Digital Twin | ❌ | ✅ | ✅ |
| Growth Charts & Analytics | ❌ | ✅ | ✅ |
| Doctor Report PDF | ❌ | ✅ | ✅ |
| Memory Journal with Photos | ❌ | ✅ | ✅ |
| Data Export | ❌ | ✅ | ✅ |
| Family Sharing (up to 5 members) | ❌ | ❌ | ✅ |
| Grandparent Mode | ❌ | ❌ | ✅ |

Subscriptions are managed via **RevenueCat** with monthly and annual billing options, priced in INR.

---

## 16. Notifications & Reminders

BabySaathi sends timely push notifications so nothing important is missed.

| Notification | Trigger | Time |
|-------------|---------|------|
| Feed reminder | No feed logged for 3+ hours | Real-time check every 30 min |
| Vaccine due | Vaccine due in 7 days | Daily at 9 AM IST |
| Daily insight ready | New AI insights generated | Daily at 8 AM IST |
| Family invite | Member accepted invitation | Triggered on accept |

- All notifications use **Firebase Cloud Messaging (FCM)**
- Notification permission is requested during onboarding (Step 2)
- Users can disable notifications from Profile → Settings

---

## 17. Offline Support

BabySaathi continues working when your internet connection drops.

- An **orange "No Internet Connection" banner** slides in from the top automatically
- Detected via `@react-native-community/netinfo`
- Banner dismisses automatically when connection is restored
- Tracker data already loaded remains viewable offline
- New entries are queued and sync when connection returns (Firestore offline persistence)

---

## 18. Grandparent Mode

A special display mode designed for elderly family members who may struggle with small text and buttons.

- Larger font sizes across all screens
- Bigger touch targets for all buttons
- Higher contrast colours
- Simplified navigation
- Activated automatically for accounts with the **Grandparent** role
- Available to Family tier subscribers

---

## Privacy & Security

- All audio processing for cry detection is **100% on-device** — no audio leaves your phone
- Firestore security rules ensure users can only access their own data
- Baby data is accessible only to the account owner and explicitly invited family members
- Subscription and notification records are **write-protected** — only Cloud Functions can modify them
- Photos are stored in Firebase Storage with per-user access rules (5 MB limit per photo)
- Phone authentication uses Firebase's secure OTP flow — no phone numbers stored in plain text

---

*BabySaathi AI — Built with love for Indian parents 🇮🇳*
