import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@constants/index';
import type {
  Baby,
  FeedEntry,
  SleepEntry,
  DiaperEntry,
  GrowthEntry,
  VaccinationEntry,
  Milestone,
  CryEvent,
  JournalEntry,
  FamilyMember,
  AIInsight,
} from '@types/index';

// ─── Generic helpers ─────────────────────────────────────────────────────────

const toDate = (val: any): Date => {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

// ─── Baby ─────────────────────────────────────────────────────────────────────

export const addBaby = async (baby: Omit<Baby, 'id' | 'createdAt' | 'updatedAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.BABIES), {
    ...baby,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getBabies = async (ownerId: string): Promise<Baby[]> => {
  const q = query(collection(db, COLLECTIONS.BABIES), where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    birthDate: toDate(d.data().birthDate),
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
  } as Baby));
};

export const updateBaby = async (id: string, data: Partial<Baby>) => {
  await updateDoc(doc(db, COLLECTIONS.BABIES, id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteBaby = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.BABIES, id));
};

// ─── Feed ─────────────────────────────────────────────────────────────────────

export const addFeed = async (entry: Omit<FeedEntry, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.FEEDS), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getFeeds = async (babyId: string, startDate?: Date, endDate?: Date): Promise<FeedEntry[]> => {
  const constraints: QueryConstraint[] = [
    where('babyId', '==', babyId),
    orderBy('startTime', 'desc'),
  ];
  if (startDate) constraints.push(where('startTime', '>=', Timestamp.fromDate(startDate)));
  if (endDate) constraints.push(where('startTime', '<=', Timestamp.fromDate(endDate)));

  const snapshot = await getDocs(query(collection(db, COLLECTIONS.FEEDS), ...constraints));
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    startTime: toDate(d.data().startTime),
    endTime: d.data().endTime ? toDate(d.data().endTime) : undefined,
    createdAt: toDate(d.data().createdAt),
  } as FeedEntry));
};

export const updateFeed = async (id: string, data: Partial<FeedEntry>) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDS, id), data);
};

export const deleteFeed = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.FEEDS, id));
};

// ─── Sleep ────────────────────────────────────────────────────────────────────

export const addSleep = async (entry: Omit<SleepEntry, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.SLEEP), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getSleepEntries = async (babyId: string, startDate?: Date, endDate?: Date): Promise<SleepEntry[]> => {
  const constraints: QueryConstraint[] = [
    where('babyId', '==', babyId),
    orderBy('startTime', 'desc'),
  ];
  if (startDate) constraints.push(where('startTime', '>=', Timestamp.fromDate(startDate)));
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.SLEEP), ...constraints));
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    startTime: toDate(d.data().startTime),
    endTime: d.data().endTime ? toDate(d.data().endTime) : undefined,
    createdAt: toDate(d.data().createdAt),
  } as SleepEntry));
};

export const updateSleep = async (id: string, data: Partial<SleepEntry>) => {
  await updateDoc(doc(db, COLLECTIONS.SLEEP, id), data);
};

// ─── Diaper ──────────────────────────────────────────────────────────────────

export const addDiaper = async (entry: Omit<DiaperEntry, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.DIAPERS), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getDiapers = async (babyId: string, startDate?: Date): Promise<DiaperEntry[]> => {
  const constraints: QueryConstraint[] = [
    where('babyId', '==', babyId),
    orderBy('time', 'desc'),
  ];
  if (startDate) constraints.push(where('time', '>=', Timestamp.fromDate(startDate)));
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.DIAPERS), ...constraints));
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    time: toDate(d.data().time),
    createdAt: toDate(d.data().createdAt),
  } as DiaperEntry));
};

// ─── Growth ──────────────────────────────────────────────────────────────────

export const addGrowth = async (entry: Omit<GrowthEntry, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.GROWTH), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getGrowthEntries = async (babyId: string): Promise<GrowthEntry[]> => {
  const q = query(
    collection(db, COLLECTIONS.GROWTH),
    where('babyId', '==', babyId),
    orderBy('date', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    date: toDate(d.data().date),
    createdAt: toDate(d.data().createdAt),
  } as GrowthEntry));
};

// ─── Cry Events ───────────────────────────────────────────────────────────────

export const addCryEvent = async (entry: Omit<CryEvent, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.CRY_EVENTS), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCryEvents = async (babyId: string, limitCount = 50): Promise<CryEvent[]> => {
  const q = query(
    collection(db, COLLECTIONS.CRY_EVENTS),
    where('babyId', '==', babyId),
    orderBy('detectedAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    detectedAt: toDate(d.data().detectedAt),
    createdAt: toDate(d.data().createdAt),
  } as CryEvent));
};

export const updateCryEvent = async (id: string, data: Partial<CryEvent>) => {
  await updateDoc(doc(db, COLLECTIONS.CRY_EVENTS, id), data);
};

// ─── Vaccination ─────────────────────────────────────────────────────────────

export const addVaccination = async (entry: Omit<VaccinationEntry, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.VACCINES), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getVaccinations = async (babyId: string): Promise<VaccinationEntry[]> => {
  const q = query(
    collection(db, COLLECTIONS.VACCINES),
    where('babyId', '==', babyId),
    orderBy('scheduledDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    scheduledDate: toDate(d.data().scheduledDate),
    administeredDate: d.data().administeredDate ? toDate(d.data().administeredDate) : undefined,
    createdAt: toDate(d.data().createdAt),
  } as VaccinationEntry));
};

export const updateVaccination = async (id: string, data: Partial<VaccinationEntry>) => {
  await updateDoc(doc(db, COLLECTIONS.VACCINES, id), data);
};

// ─── Milestones ──────────────────────────────────────────────────────────────

export const addMilestone = async (entry: Omit<Milestone, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.MILESTONES), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getMilestones = async (babyId: string): Promise<Milestone[]> => {
  const q = query(collection(db, COLLECTIONS.MILESTONES), where('babyId', '==', babyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    achievedDate: d.data().achievedDate ? toDate(d.data().achievedDate) : undefined,
    createdAt: toDate(d.data().createdAt),
  } as Milestone));
};

export const updateMilestone = async (id: string, data: Partial<Milestone>) => {
  await updateDoc(doc(db, COLLECTIONS.MILESTONES, id), data);
};

// ─── Journal ─────────────────────────────────────────────────────────────────

export const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.JOURNAL), {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getJournalEntries = async (babyId: string, limitCount = 30): Promise<JournalEntry[]> => {
  const q = query(
    collection(db, COLLECTIONS.JOURNAL),
    where('babyId', '==', babyId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    date: toDate(d.data().date),
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
  } as JournalEntry));
};

// ─── AI Insights ─────────────────────────────────────────────────────────────

export const getAIInsights = async (babyId: string, limitCount = 5): Promise<AIInsight[]> => {
  const q = query(
    collection(db, COLLECTIONS.AI_PREDICTIONS),
    where('babyId', '==', babyId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    createdAt: toDate(d.data().createdAt),
    expiresAt: d.data().expiresAt ? toDate(d.data().expiresAt) : undefined,
  } as AIInsight));
};

export const addAIInsight = async (insight: Omit<AIInsight, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.AI_PREDICTIONS), {
    ...insight,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// ─── Range query aliases used by Analytics ────────────────────────────────────

export const getFeedsByDateRange = (babyId: string, start: Date, end: Date) =>
  getFeeds(babyId, start, end);

export const getSleepByDateRange = (babyId: string, start: Date, end: Date) =>
  getSleepEntries(babyId, start, end);

export const getDiapersByDateRange = (babyId: string, start: Date) =>
  getDiapers(babyId, start);

// ─── Realtime Listener for Dashboard ─────────────────────────────────────────

export const subscribeToInsights = (babyId: string, callback: (insights: AIInsight[]) => void) => {
  const q = query(
    collection(db, COLLECTIONS.AI_PREDICTIONS),
    where('babyId', '==', babyId),
    orderBy('createdAt', 'desc'),
    limit(3)
  );
  return onSnapshot(q, (snapshot) => {
    const insights = snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      createdAt: toDate(d.data().createdAt),
    } as AIInsight));
    callback(insights);
  });
};
