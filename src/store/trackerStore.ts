import { create } from 'zustand';
import {
  FeedEntry,
  SleepEntry,
  DiaperEntry,
  GrowthEntry,
  VaccinationEntry,
  Milestone,
} from '@types/index';
import {
  addFeed, getFeeds, updateFeed, deleteFeed,
  addSleep, getSleepEntries, updateSleep,
  addDiaper, getDiapers,
  addGrowth, getGrowthEntries,
  addVaccination, getVaccinations, updateVaccination,
  addMilestone, getMilestones, updateMilestone,
} from '@services/firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';
import { offlineQueue } from '@services/offline/offlineQueue';

function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err as any)?.message ?? '';
  return (
    msg.includes('network') ||
    msg.includes('unavailable') ||
    msg.includes('offline') ||
    msg.includes('Failed to fetch') ||
    (err as any)?.code === 'unavailable'
  );
}

interface TrackerState {
  // Feeds
  feeds: FeedEntry[];
  todayFeeds: FeedEntry[];
  activeFeed: FeedEntry | null;
  feedLoading: boolean;

  // Sleep
  sleepEntries: SleepEntry[];
  todaySleep: SleepEntry[];
  activeSleep: SleepEntry | null;
  sleepLoading: boolean;

  // Diapers
  diapers: DiaperEntry[];
  todayDiapers: DiaperEntry[];
  diaperLoading: boolean;

  // Growth
  growthEntries: GrowthEntry[];
  growthLoading: boolean;

  // Vaccination
  vaccinations: VaccinationEntry[];
  vaccinationLoading: boolean;

  // Milestones
  milestones: Milestone[];
  milestoneLoading: boolean;

  // Feed actions
  startFeed: (entry: Omit<FeedEntry, 'id' | 'createdAt'>) => Promise<string>;
  stopFeed: (id: string, endTime: Date) => Promise<void>;
  fetchFeeds: (babyId: string) => Promise<void>;
  fetchTodayFeeds: (babyId: string) => Promise<void>;

  // Sleep actions
  startSleep: (entry: Omit<SleepEntry, 'id' | 'createdAt'>) => Promise<string>;
  stopSleep: (id: string, endTime: Date) => Promise<void>;
  fetchSleep: (babyId: string) => Promise<void>;
  fetchTodaySleep: (babyId: string) => Promise<void>;

  // Diaper actions
  addDiaper: (entry: Omit<DiaperEntry, 'id' | 'createdAt'>) => Promise<void>;
  fetchDiapers: (babyId: string) => Promise<void>;
  fetchTodayDiapers: (babyId: string) => Promise<void>;

  // Growth actions
  addGrowth: (entry: Omit<GrowthEntry, 'id' | 'createdAt'>) => Promise<void>;
  fetchGrowth: (babyId: string) => Promise<void>;

  // Vaccination actions
  fetchVaccinations: (babyId: string) => Promise<void>;
  markVaccineAdministered: (id: string, date: Date, doctor?: string) => Promise<void>;

  // Milestone actions
  fetchMilestones: (babyId: string) => Promise<void>;
  markMilestoneAchieved: (id: string, date: Date, photoURL?: string) => Promise<void>;

  // Summary getters
  getTodayFeedCount: () => number;
  getTodaySleepHours: () => number;
  getTodayDiaperCount: () => number;
  getNextVaccination: () => VaccinationEntry | undefined;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  feeds: [],
  todayFeeds: [],
  activeFeed: null,
  feedLoading: false,

  sleepEntries: [],
  todaySleep: [],
  activeSleep: null,
  sleepLoading: false,

  diapers: [],
  todayDiapers: [],
  diaperLoading: false,

  growthEntries: [],
  growthLoading: false,

  vaccinations: [],
  vaccinationLoading: false,

  milestones: [],
  milestoneLoading: false,

  // ── Feed ────────────────────────────────────────────────────────────────────

  startFeed: async (entry) => {
    const tempId = `local_${Date.now()}`;
    const newEntry: FeedEntry = { ...entry, id: tempId, createdAt: new Date() };
    set((s) => ({ feeds: [newEntry, ...s.feeds], activeFeed: newEntry }));
    try {
      const id = await addFeed(entry);
      set((s) => ({
        feeds: s.feeds.map((f) => (f.id === tempId ? { ...f, id } : f)),
        activeFeed: { ...newEntry, id },
      }));
      return id;
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('ADD_FEED', { ...entry, localId: tempId });
        return tempId;
      }
      throw err;
    }
  },

  stopFeed: async (id, endTime) => {
    const feed = get().feeds.find((f) => f.id === id);
    if (!feed) return;
    const duration = Math.round((endTime.getTime() - feed.startTime.getTime()) / 60000);
    set((s) => ({
      feeds: s.feeds.map((f) => (f.id === id ? { ...f, endTime, duration } : f)),
      activeFeed: null,
    }));
    try {
      await updateFeed(id, { endTime, duration });
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('STOP_FEED', { id, endTime: endTime.toISOString(), duration });
        return;
      }
      throw err;
    }
  },

  fetchFeeds: async (babyId) => {
    set({ feedLoading: true });
    const feeds = await getFeeds(babyId);
    set({ feeds, feedLoading: false });
  },

  fetchTodayFeeds: async (babyId) => {
    const today = new Date();
    const feeds = await getFeeds(babyId, startOfDay(today), endOfDay(today));
    set({ todayFeeds: feeds });
  },

  // ── Sleep ───────────────────────────────────────────────────────────────────

  startSleep: async (entry) => {
    const tempId = `local_${Date.now()}`;
    const newEntry: SleepEntry = { ...entry, id: tempId, createdAt: new Date() };
    set((s) => ({ sleepEntries: [newEntry, ...s.sleepEntries], activeSleep: newEntry }));
    try {
      const id = await addSleep(entry);
      set((s) => ({
        sleepEntries: s.sleepEntries.map((e) => (e.id === tempId ? { ...e, id } : e)),
        activeSleep: { ...newEntry, id },
      }));
      return id;
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('ADD_SLEEP', { ...entry, localId: tempId });
        return tempId;
      }
      throw err;
    }
  },

  stopSleep: async (id, endTime) => {
    const sleep = get().sleepEntries.find((s) => s.id === id);
    if (!sleep) return;
    const duration = Math.round((endTime.getTime() - sleep.startTime.getTime()) / 60000);
    set((s) => ({
      sleepEntries: s.sleepEntries.map((e) => (e.id === id ? { ...e, endTime, duration } : e)),
      activeSleep: null,
    }));
    try {
      await updateSleep(id, { endTime, duration });
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('STOP_SLEEP', { id, endTime: endTime.toISOString(), duration });
        return;
      }
      throw err;
    }
  },

  fetchSleep: async (babyId) => {
    set({ sleepLoading: true });
    const sleepEntries = await getSleepEntries(babyId);
    set({ sleepEntries, sleepLoading: false });
  },

  fetchTodaySleep: async (babyId) => {
    const today = new Date();
    const entries = await getSleepEntries(babyId, startOfDay(today), endOfDay(today));
    set({ todaySleep: entries });
  },

  // ── Diaper ──────────────────────────────────────────────────────────────────

  addDiaper: async (entry) => {
    const tempEntry: DiaperEntry = { ...entry, id: `local_${Date.now()}`, createdAt: new Date() };
    set((s) => ({ diapers: [tempEntry, ...s.diapers], todayDiapers: [tempEntry, ...s.todayDiapers] }));
    try {
      await addDiaper(entry);
      await get().fetchTodayDiapers(entry.babyId);
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('ADD_DIAPER', entry as Record<string, any>);
        return;
      }
      throw err;
    }
  },

  fetchDiapers: async (babyId) => {
    set({ diaperLoading: true });
    const diapers = await getDiapers(babyId);
    set({ diapers, diaperLoading: false });
  },

  fetchTodayDiapers: async (babyId) => {
    const diapers = await getDiapers(babyId, startOfDay(new Date()));
    set({ todayDiapers: diapers });
  },

  // ── Growth ──────────────────────────────────────────────────────────────────

  addGrowth: async (entry) => {
    try {
      await addGrowth(entry);
      await get().fetchGrowth(entry.babyId);
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('ADD_GROWTH', entry as Record<string, any>);
        return;
      }
      throw err;
    }
  },

  fetchGrowth: async (babyId) => {
    set({ growthLoading: true });
    const growthEntries = await getGrowthEntries(babyId);
    set({ growthEntries, growthLoading: false });
  },

  // ── Vaccination ─────────────────────────────────────────────────────────────

  fetchVaccinations: async (babyId) => {
    set({ vaccinationLoading: true });
    const vaccinations = await getVaccinations(babyId);
    set({ vaccinations, vaccinationLoading: false });
  },

  markVaccineAdministered: async (id, date, doctor) => {
    set((s) => ({
      vaccinations: s.vaccinations.map((v) =>
        v.id === id ? { ...v, administeredDate: date, doctorName: doctor, status: 'administered' } : v
      ),
    }));
    try {
      await updateVaccination(id, { administeredDate: date, doctorName: doctor, status: 'administered' });
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('MARK_VACCINE', { id, date: date.toISOString(), doctor });
        return;
      }
      throw err;
    }
  },

  // ── Milestones ──────────────────────────────────────────────────────────────

  fetchMilestones: async (babyId) => {
    set({ milestoneLoading: true });
    const milestones = await getMilestones(babyId);
    set({ milestones, milestoneLoading: false });
  },

  markMilestoneAchieved: async (id, date, photoURL) => {
    set((s) => ({
      milestones: s.milestones.map((m) =>
        m.id === id ? { ...m, achieved: true, achievedDate: date, photoURL } : m
      ),
    }));
    try {
      await updateMilestone(id, { achieved: true, achievedDate: date, photoURL });
    } catch (err) {
      if (isNetworkError(err)) {
        await offlineQueue.enqueue('MARK_MILESTONE', { id, date: date.toISOString(), photoURL });
        return;
      }
      throw err;
    }
  },

  // ── Computed Getters ─────────────────────────────────────────────────────────

  getTodayFeedCount: () => get().todayFeeds.length,

  getTodaySleepHours: () => {
    const total = get().todaySleep.reduce((acc, s) => acc + (s.duration ?? 0), 0);
    return Math.round((total / 60) * 10) / 10;
  },

  getTodayDiaperCount: () => get().todayDiapers.length,

  getNextVaccination: () => {
    return get().vaccinations.find((v) => v.status === 'pending' || v.status === 'overdue');
  },
}));
