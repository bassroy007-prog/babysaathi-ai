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
import { startOfDay, endOfDay } from 'date-fns';
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
  TemperatureEntry,
  MedicationEntry,
  CulturalMilestoneEntry,
  ChatMessage,
  IntroducedFood,
  MomCheckIn,
  EPDSResult,
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

// ─── Temperature ─────────────────────────────────────────────────────────────

export const addTemperature = async (entry: Omit<TemperatureEntry, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.TEMPERATURES), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getTemperatures = async (babyId: string, limitCount = 30): Promise<TemperatureEntry[]> => {
  const q = query(
    collection(db, COLLECTIONS.TEMPERATURES),
    where('babyId', '==', babyId),
    orderBy('time', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    time: toDate(d.data().time),
    createdAt: toDate(d.data().createdAt),
  } as TemperatureEntry));
};

// ─── Medications ─────────────────────────────────────────────────────────────

export const addMedication = async (entry: Omit<MedicationEntry, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.MEDICATIONS), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getMedications = async (babyId: string, limitCount = 50): Promise<MedicationEntry[]> => {
  const q = query(
    collection(db, COLLECTIONS.MEDICATIONS),
    where('babyId', '==', babyId),
    orderBy('givenAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    givenAt: toDate(d.data().givenAt),
    nextDoseAt: d.data().nextDoseAt ? toDate(d.data().nextDoseAt) : undefined,
    createdAt: toDate(d.data().createdAt),
  } as MedicationEntry));
};

export const deleteMedication = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.MEDICATIONS, id));
};

// ─── Cultural Milestones ──────────────────────────────────────────────────────

export const addCulturalMilestone = async (
  entry: Omit<CulturalMilestoneEntry, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTIONS.CULTURAL_MILESTONES), {
    ...entry,
    celebratedDate: entry.celebratedDate ? Timestamp.fromDate(entry.celebratedDate) : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCulturalMilestones = async (babyId: string): Promise<CulturalMilestoneEntry[]> => {
  const q = query(
    collection(db, COLLECTIONS.CULTURAL_MILESTONES),
    where('babyId', '==', babyId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    celebratedDate: d.data().celebratedDate ? toDate(d.data().celebratedDate) : undefined,
    createdAt: toDate(d.data().createdAt),
  } as CulturalMilestoneEntry));
};

export const updateCulturalMilestone = async (
  id: string,
  updates: Partial<Pick<CulturalMilestoneEntry, 'celebrated' | 'celebratedDate' | 'notes'>>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.CULTURAL_MILESTONES, id), {
    ...updates,
    ...(updates.celebratedDate
      ? { celebratedDate: Timestamp.fromDate(updates.celebratedDate) }
      : {}),
  });
};

// ─── Chat Message Persistence ────────────────────────────────────────────────
// Stores chat history per baby for AI Guru memory across sessions.

export const addChatMessage = async (
  babyId: string,
  message: ChatMessage
): Promise<void> => {
  await addDoc(collection(db, COLLECTIONS.CHAT_MESSAGES), {
    babyId,
    messageId: message.id,
    role: message.role,
    content: message.content,
    timestamp: Timestamp.fromDate(message.timestamp),
    createdAt: serverTimestamp(),
  });
};

export const getChatMessages = async (
  babyId: string,
  limitCount = 40
): Promise<ChatMessage[]> => {
  const q = query(
    collection(db, COLLECTIONS.CHAT_MESSAGES),
    where('babyId', '==', babyId),
    orderBy('timestamp', 'asc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.data().messageId as string,
    role: d.data().role as 'user' | 'assistant',
    content: d.data().content as string,
    timestamp: toDate(d.data().timestamp),
  }));
};

export const deleteChatMessages = async (babyId: string): Promise<void> => {
  const q = query(
    collection(db, COLLECTIONS.CHAT_MESSAGES),
    where('babyId', '==', babyId)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
};

// ─── Introduced Foods (Weaning Tracker) ─────────────────────────────────────

export const addIntroducedFood = async (
  entry: Omit<IntroducedFood, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTIONS.INTRODUCED_FOODS), {
    ...entry,
    dateIntroduced: Timestamp.fromDate(entry.dateIntroduced),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getIntroducedFoods = async (babyId: string): Promise<IntroducedFood[]> => {
  const q = query(
    collection(db, COLLECTIONS.INTRODUCED_FOODS),
    where('babyId', '==', babyId),
    orderBy('dateIntroduced', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    ...d.data(),
    id: d.id,
    dateIntroduced: toDate(d.data().dateIntroduced),
    createdAt: toDate(d.data().createdAt),
  } as IntroducedFood));
};

export const deleteIntroducedFood = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.INTRODUCED_FOODS, id));
};

// ─── Postpartum Mom Health ────────────────────────────────────────────────────

export const addMomCheckIn = async (
  entry: Omit<MomCheckIn, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTIONS.MOM_CHECKINS), {
    ...entry,
    date: Timestamp.fromDate(entry.date),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateMomCheckIn = async (id: string, data: Partial<MomCheckIn>): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.MOM_CHECKINS, id), data);
};

export const getTodayMomCheckIn = async (babyId: string): Promise<MomCheckIn | null> => {
  const q = query(
    collection(db, COLLECTIONS.MOM_CHECKINS),
    where('babyId', '==', babyId),
    where('date', '>=', Timestamp.fromDate(startOfDay(new Date()))),
    where('date', '<=', Timestamp.fromDate(endOfDay(new Date()))),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data(), id: d.id, date: toDate(d.data().date), createdAt: toDate(d.data().createdAt) } as MomCheckIn;
};

export const getRecentMomCheckIns = async (babyId: string, limitCount = 7): Promise<MomCheckIn[]> => {
  const q = query(
    collection(db, COLLECTIONS.MOM_CHECKINS),
    where('babyId', '==', babyId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    ...d.data(), id: d.id, date: toDate(d.data().date), createdAt: toDate(d.data().createdAt),
  } as MomCheckIn));
};

export const addEPDSResult = async (
  entry: Omit<EPDSResult, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTIONS.EPDS_RESULTS), {
    ...entry,
    date: Timestamp.fromDate(entry.date),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getEPDSResults = async (babyId: string, limitCount = 5): Promise<EPDSResult[]> => {
  const q = query(
    collection(db, COLLECTIONS.EPDS_RESULTS),
    where('babyId', '==', babyId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    ...d.data(), id: d.id, date: toDate(d.data().date), createdAt: toDate(d.data().createdAt),
  } as EPDSResult));
};

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
