# BabySaathi AI — Setup Guide

## Prerequisites

- Node.js 20+
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Firebase CLI: `npm install -g firebase-tools`

---

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project `BabySaathi`
2. Enable these services:
   - **Authentication** → Email/Password, Phone, Google
   - **Firestore Database** → Start in production mode
   - **Storage** → Start in production mode
   - **Cloud Messaging** (for push notifications)
3. Add Android app: package `com.babysaathi.app`
4. Add iOS app: bundle ID `com.babysaathi.app`
5. Download `google-services.json` → place at `android/app/google-services.json`
6. Download `GoogleService-Info.plist` → place at `ios/BabySaathi/GoogleService-Info.plist`
7. Copy your web app config values into `src/services/firebase/config.ts`

---

## 2. RevenueCat Setup

1. Create account at [RevenueCat](https://app.revenuecat.com)
2. Create a new project → Add iOS and Android apps
3. Copy API keys into `src/constants/index.ts`:
   - `REVENUECAT_API_KEY_IOS`
   - `REVENUECAT_API_KEY_ANDROID`
4. Create entitlements: `premium`, `premium_family`
5. Create offerings with packages: `$rc_monthly`, `$rc_annual`, `family_monthly`, `family_annual`

---

## 3. EAS Build Setup

```bash
cd D:\BabySaathi
eas login
eas init
# Copy the project ID into app.json → extra.eas.projectId
```

---

## 4. Deploy Firestore Rules and Indexes

```bash
firebase login
firebase use --add   # select your Firebase project
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only storage
```

---

## 5. Deploy Cloud Functions

```bash
cd firebase/functions
npm install
npm run build
cd ../..
firebase deploy --only functions
```

---

## 6. Run Locally (Expo Go)

```bash
cd D:\BabySaathi
npx expo start
```

Scan the QR code with Expo Go on Android, or press `i` for iOS simulator.

---

## 7. Build for Production

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Submit
eas submit --platform android
eas submit --platform ios
```

---

## Configuration Files to Update

| File | What to update |
|------|---------------|
| `src/services/firebase/config.ts` | All Firebase config values |
| `src/constants/index.ts` | RevenueCat API keys |
| `app.json` | EAS project ID, Google Services file paths |

---

## India-specific Notes

- Vaccination schedule pre-loaded: 19 vaccines (BCG to JE at 18 months)
- 7 languages: English, Hindi, Bengali, Punjabi, Tamil, Telugu, Marathi
- Phone OTP auth uses Firebase Phone Auth (works with Indian numbers)
- All prices shown in INR — configure RevenueCat pricing per country
