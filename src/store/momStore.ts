import { create } from 'zustand';
import { MomCheckIn, EPDSResult } from '@types/index';
import {
  addMomCheckIn, updateMomCheckIn, getTodayMomCheckIn,
  getRecentMomCheckIns, addEPDSResult, getEPDSResults,
} from '@services/firebase/firestore';

interface MomState {
  todayCheckIn: MomCheckIn | null;
  recentCheckIns: MomCheckIn[];
  epdsResults: EPDSResult[];
  loading: boolean;

  fetchTodayCheckIn: (babyId: string) => Promise<void>;
  fetchRecentCheckIns: (babyId: string) => Promise<void>;
  saveCheckIn: (entry: Omit<MomCheckIn, 'id' | 'createdAt'>) => Promise<void>;
  fetchEPDSResults: (babyId: string) => Promise<void>;
  saveEPDSResult: (entry: Omit<EPDSResult, 'id' | 'createdAt'>) => Promise<EPDSResult>;
}

export const useMomStore = create<MomState>((set, get) => ({
  todayCheckIn: null,
  recentCheckIns: [],
  epdsResults: [],
  loading: false,

  fetchTodayCheckIn: async (babyId) => {
    set({ loading: true });
    try {
      const todayCheckIn = await getTodayMomCheckIn(babyId);
      set({ todayCheckIn, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchRecentCheckIns: async (babyId) => {
    try {
      const recentCheckIns = await getRecentMomCheckIns(babyId, 7);
      set({ recentCheckIns });
    } catch {}
  },

  saveCheckIn: async (entry) => {
    const existing = get().todayCheckIn;
    const tempEntry: MomCheckIn = { ...entry, id: `local_${Date.now()}`, createdAt: new Date() };
    set({ todayCheckIn: tempEntry });
    try {
      if (existing) {
        await updateMomCheckIn(existing.id, entry);
        set({ todayCheckIn: { ...entry, id: existing.id, createdAt: existing.createdAt } });
      } else {
        const id = await addMomCheckIn(entry);
        set({ todayCheckIn: { ...entry, id, createdAt: new Date() } });
      }
      await get().fetchRecentCheckIns(entry.babyId);
    } catch (err) {
      if (existing) set({ todayCheckIn: existing });
      throw err;
    }
  },

  fetchEPDSResults: async (babyId) => {
    try {
      const epdsResults = await getEPDSResults(babyId, 5);
      set({ epdsResults });
    } catch {}
  },

  saveEPDSResult: async (entry) => {
    const temp: EPDSResult = { ...entry, id: `local_${Date.now()}`, createdAt: new Date() };
    set((s) => ({ epdsResults: [temp, ...s.epdsResults] }));
    try {
      const id = await addEPDSResult(entry);
      const saved: EPDSResult = { ...entry, id, createdAt: new Date() };
      set((s) => ({ epdsResults: s.epdsResults.map((r) => (r.id === temp.id ? saved : r)) }));
      return saved;
    } catch {
      set((s) => ({ epdsResults: s.epdsResults.filter((r) => r.id !== temp.id) }));
      throw new Error('Failed to save EPDS result');
    }
  },
}));
