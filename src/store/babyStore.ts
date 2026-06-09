import { create } from 'zustand';
import { Baby, DashboardStats, DigitalTwin } from '@types/index';
import { getBabies, addBaby, updateBaby } from '@services/firebase/firestore';
import { differenceInDays, differenceInWeeks } from 'date-fns';

interface BabyState {
  babies: Baby[];
  activeBaby: Baby | null;
  digitalTwin: DigitalTwin | null;
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;

  fetchBabies: (ownerId: string) => Promise<void>;
  setActiveBaby: (baby: Baby) => void;
  addBaby: (baby: Omit<Baby, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBaby: (id: string, data: Partial<Baby>) => Promise<void>;
  setDashboardStats: (stats: DashboardStats) => void;
  setDigitalTwin: (twin: DigitalTwin) => void;
  getBabyAgeText: () => string;
  getBabyAgeWeeks: () => number;
}

export const useBabyStore = create<BabyState>((set, get) => ({
  babies: [],
  activeBaby: null,
  digitalTwin: null,
  dashboardStats: null,
  isLoading: false,
  error: null,

  fetchBabies: async (ownerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const babies = await getBabies(ownerId);
      set({ babies, isLoading: false });
      if (babies.length > 0 && !get().activeBaby) {
        set({ activeBaby: babies[0] });
      }
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  setActiveBaby: (baby) => set({ activeBaby: baby }),

  addBaby: async (babyData) => {
    const id = await addBaby(babyData);
    await get().fetchBabies(babyData.ownerId);
    return id;
  },

  updateBaby: async (id, data) => {
    await updateBaby(id, data);
    const updated = get().babies.map((b) => (b.id === id ? { ...b, ...data } : b));
    set({ babies: updated });
    if (get().activeBaby?.id === id) {
      set({ activeBaby: { ...get().activeBaby!, ...data } });
    }
  },

  setDashboardStats: (dashboardStats) => set({ dashboardStats }),

  setDigitalTwin: (digitalTwin) => set({ digitalTwin }),

  getBabyAgeText: () => {
    const { activeBaby } = get();
    if (!activeBaby) return '';
    const days = differenceInDays(new Date(), activeBaby.birthDate);
    const weeks = differenceInWeeks(new Date(), activeBaby.birthDate);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} old`;
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} old`;
    const months = Math.floor(days / 30.44);
    if (months < 24) return `${months} month${months !== 1 ? 's' : ''} old`;
    const years = Math.floor(days / 365.25);
    return `${years} year${years !== 1 ? 's' : ''} old`;
  },

  getBabyAgeWeeks: () => {
    const { activeBaby } = get();
    if (!activeBaby) return 0;
    return differenceInWeeks(new Date(), activeBaby.birthDate);
  },
}));
