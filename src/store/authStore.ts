import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@types/index';
import { subscribeToAuthState } from '@services/firebase/auth';
import { getUserDocument } from '@services/firebase/auth';
import { revenueCat } from '@services/subscription/revenueCat';

const GP_MODE_KEY = '@babysaathi_gp_mode';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  error: string | null;

  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  grandparentMode: boolean;
  toggleGrandparentMode: () => Promise<void>;
  setOnboardingComplete: (complete: boolean) => void;
  logout: () => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  grandparentMode: false,
  error: null,

  setFirebaseUser: (firebaseUser) =>
    set({ firebaseUser, isAuthenticated: !!firebaseUser }),

  setUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  toggleGrandparentMode: async () => {
    const next = !useAuthStore.getState().grandparentMode;
    set({ grandparentMode: next });
    await AsyncStorage.setItem(GP_MODE_KEY, next ? 'true' : 'false');
  },

  setOnboardingComplete: (hasCompletedOnboarding) =>
    set({ hasCompletedOnboarding }),

  logout: () =>
    set({
      firebaseUser: null,
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      error: null,
    }),

  initialize: () => {
    set({ isLoading: true });
    AsyncStorage.getItem(GP_MODE_KEY).then((val) => {
      if (val === 'true') set({ grandparentMode: true });
    });
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        set({ firebaseUser, isAuthenticated: true });
        revenueCat.identify(firebaseUser.uid).catch(() => {});
        try {
          const userDoc = await getUserDocument(firebaseUser.uid);
          set({ user: userDoc, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      } else {
        revenueCat.logout().catch(() => {});
        set({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });
    return unsubscribe;
  },
}));
