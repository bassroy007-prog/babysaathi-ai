import { create } from 'zustand';
import { CryEvent, CryPrediction, AIInsight, ChatMessage, DigitalTwin } from '@types/index';
import { addCryEvent, getCryEvents, updateCryEvent, getAIInsights, addAIInsight } from '@services/firebase/firestore';

interface AIState {
  // Cry Detection
  isListening: boolean;
  isAnalyzing: boolean;
  currentCryEvent: CryEvent | null;
  cryHistory: CryEvent[];
  lastPredictions: CryPrediction[];

  // AI Insights
  insights: AIInsight[];
  insightsLoading: boolean;

  // Chat
  messages: ChatMessage[];
  isChatLoading: boolean;

  // Digital Twin
  digitalTwin: DigitalTwin | null;

  // Cry actions
  setListening: (listening: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  saveCryEvent: (event: Omit<CryEvent, 'id' | 'createdAt'>) => Promise<string>;
  submitCryFeedback: (id: string, feedback: CryEvent['dominantType']) => Promise<void>;
  fetchCryHistory: (babyId: string) => Promise<void>;
  setLastPredictions: (predictions: CryPrediction[]) => void;

  // Insight actions
  fetchInsights: (babyId: string) => Promise<void>;
  addInsight: (insight: Omit<AIInsight, 'id' | 'createdAt'>) => Promise<void>;

  // Chat actions
  addMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setChatLoading: (loading: boolean) => void;

  // Digital Twin
  setDigitalTwin: (twin: DigitalTwin) => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  isListening: false,
  isAnalyzing: false,
  currentCryEvent: null,
  cryHistory: [],
  lastPredictions: [],

  insights: [],
  insightsLoading: false,

  messages: [],
  isChatLoading: false,

  digitalTwin: null,

  setListening: (isListening) => set({ isListening }),

  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  saveCryEvent: async (eventData) => {
    const id = await addCryEvent(eventData);
    const event: CryEvent = { ...eventData, id, createdAt: new Date() };
    set((s) => ({
      cryHistory: [event, ...s.cryHistory],
      currentCryEvent: event,
    }));
    return id;
  },

  submitCryFeedback: async (id, feedback) => {
    await updateCryEvent(id, { userFeedback: feedback });
    set((s) => ({
      cryHistory: s.cryHistory.map((e) =>
        e.id === id ? { ...e, userFeedback: feedback } : e
      ),
    }));
  },

  fetchCryHistory: async (babyId) => {
    const history = await getCryEvents(babyId);
    set({ cryHistory: history });
  },

  setLastPredictions: (lastPredictions) => set({ lastPredictions }),

  fetchInsights: async (babyId) => {
    set({ insightsLoading: true });
    const insights = await getAIInsights(babyId);
    set({ insights, insightsLoading: false });
  },

  addInsight: async (insight) => {
    await addAIInsight(insight);
    await get().fetchInsights(insight.babyId);
  },

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  clearChat: () => set({ messages: [] }),

  setChatLoading: (isChatLoading) => set({ isChatLoading }),

  setDigitalTwin: (digitalTwin) => set({ digitalTwin }),
}));
