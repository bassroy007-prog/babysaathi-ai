import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@services/firebase/config';

// ─── Auto-flag keyword scan ───────────────────────────────────────────────────

const FLAG_PATTERNS: Array<{ pattern: RegExp; reason: string; severity: 'low' | 'medium' | 'high' }> = [
  // Spam / commercial
  { pattern: /buy\s+now|click\s+here|free\s+offer|discount|sale|₹\d{3,}|whatsapp\s+\d{10}/i, reason: 'spam', severity: 'low' },
  // Unsafe medical advice
  { pattern: /guaranteed\s+cure|100%\s+safe|doctor\s+nahi|hospital\s+nahi|dawa\s+band|medicine\s+band/i, reason: 'unsafe_medical', severity: 'high' },
  // Self-harm / crisis
  { pattern: /suicide|khud\s+ko\s+hurt|harm\s+myself|khatam\s+kar|jeena\s+nahi/i, reason: 'crisis', severity: 'high' },
  // Hate / abuse
  { pattern: /\b(ch\*\*|mc|bc|bh\*\*d)\b|abusive|gali/i, reason: 'abusive_language', severity: 'medium' },
  // Misinformation patterns
  { pattern: /proven\s+fake|government\s+conspiracy|vaccine\s+harmful|teeka\s+khatarnak/i, reason: 'misinformation', severity: 'medium' },
  // Personal data (phone numbers, emails in posts)
  { pattern: /\b[6-9]\d{9}\b/, reason: 'pii_phone', severity: 'low' },
];

export interface FlagResult {
  flagged: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

export function autoFlag(content: string): FlagResult {
  for (const { pattern, reason, severity } of FLAG_PATTERNS) {
    if (pattern.test(content)) {
      return { flagged: true, reason, severity };
    }
  }
  return { flagged: false };
}

// ─── Report reasons ───────────────────────────────────────────────────────────

export type ReportReason =
  | 'spam'
  | 'misinformation'
  | 'unsafe_medical'
  | 'abusive_language'
  | 'off_topic'
  | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: '📢 Spam / Advertisement',
  misinformation: '⚠️ Galat Jaankari',
  unsafe_medical: '🏥 Khatarnak Medical Advice',
  abusive_language: '🚫 Abusive Language',
  off_topic: '🔇 Off Topic',
  other: '📝 Other',
};

// ─── Submit user report to Firestore ─────────────────────────────────────────

export async function reportPost(
  postId: string,
  reason: ReportReason,
  reporterUid: string,
  notes?: string
): Promise<void> {
  // Write to /moderation_reports collection
  await addDoc(collection(db, 'moderation_reports'), {
    postId,
    reason,
    notes: notes ?? null,
    reporterUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Increment report count on the post so mods can see volume
  await updateDoc(doc(db, 'community_posts', postId), {
    reportCount: increment(1),
  });
}

export async function reportComment(
  commentId: string,
  postId: string,
  reason: ReportReason,
  reporterUid: string
): Promise<void> {
  await addDoc(collection(db, 'moderation_reports'), {
    commentId,
    postId,
    reason,
    reporterUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
