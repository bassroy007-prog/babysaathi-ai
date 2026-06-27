import { create } from 'zustand';
import { CryEvent, CryPrediction, AIInsight, ChatMessage, DigitalTwin } from '@types/index';
import {
  addCryEvent,
  getCryEvents,
  updateCryEvent,
  getAIInsights,
  addAIInsight,
  addChatMessage,
  getChatMessages,
  deleteChatMessages,
} from '@services/firebase/firestore';

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
  streamingText: string;
  isStreaming: boolean;
  chatHistoryLoaded: boolean;

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
  clearChatWithHistory: (babyId: string) => Promise<void>;
  setChatLoading: (loading: boolean) => void;

  // Streaming actions
  startStream: () => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (babyId: string) => Promise<void>;
  cancelStream: () => void;

  // History persistence
  fetchChatHistory: (babyId: string) => Promise<void>;
  persistMessage: (babyId: string, message: ChatMessage) => Promise<void>;

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
  streamingText: '',
  isStreaming: false,
  chatHistoryLoaded: false,

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

  clearChat: () => set({ messages: [], streamingText: '', isStreaming: false }),

  clearChatWithHistory: async (babyId) => {
    await deleteChatMessages(babyId);
    set({ messages: [], streamingText: '', isStreaming: false, chatHistoryLoaded: false });
  },

  setChatLoading: (isChatLoading) => set({ isChatLoading }),

  // ── Streaming ─────────────────────────────────────────────────────────────────

  startStream: () => set({ isStreaming: true, streamingText: '' }),

  appendStreamChunk: (chunk) =>
    set((s) => ({ streamingText: s.streamingText + chunk })),

  finalizeStream: async (babyId) => {
    const { streamingText } = get();
    if (!streamingText.trim()) {
      set({ isStreaming: false, streamingText: '' });
      return;
    }
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: streamingText,
      timestamp: new Date(),
    };
    set((s) => ({
      messages: [...s.messages, msg],
      isStreaming: false,
      streamingText: '',
    }));
    await addChatMessage(babyId, msg).catch(() => {});
  },

  cancelStream: () => set({ isStreaming: false, streamingText: '' }),

  // ── History persistence ───────────────────────────────────────────────────────

  fetchChatHistory: async (babyId) => {
    if (get().chatHistoryLoaded) return;
    try {
      const history = await getChatMessages(babyId, 40);
      set({ messages: history, chatHistoryLoaded: true });
    } catch {
      set({ chatHistoryLoaded: true });
    }
  },

  persistMessage: async (babyId, message) => {
    await addChatMessage(babyId, message).catch(() => {});
  },

  setDigitalTwin: (digitalTwin) => set({ digitalTwin }),
}));
