import React, { memo, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Modal,
  Pressable, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadows } from '@theme/index';
import {
  reportPost,
  REPORT_REASON_LABELS,
  ReportReason,
} from '@services/moderation/contentModerator';
import { useAuthStore } from '@store/authStore';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  location: string;
  timeAgo: string;
  likes: number;
  replies: number;
  hasAIGuruReply: boolean;
  tags?: string[];
}

interface Props {
  post: CommunityPost;
  onPress: (post: CommunityPost) => void;
  onReported?: (postId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Trending':     Colors.rose,
  'पहला बच्चा':   Colors.primary,
  'दूध/Feeding':  Colors.accent,
  'नींद/Sleep':   Colors.peacock,
  'टीका/Vaccines':Colors.mehendi,
  'बीमारी/Illness':Colors.secondary,
};

function PostCard({ post, onPress, onReported }: Props) {
  const categoryColor = CATEGORY_COLORS[post.category] ?? Colors.primary;
  const { user } = useAuthStore();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);

  const handleReport = useCallback(async (reason: ReportReason) => {
    if (!user) return;
    setReporting(true);
    try {
      await reportPost(post.id, reason, user.uid);
      setShowReportModal(false);
      Alert.alert('शुक्रिया!', 'Report submit ho gaya. Hamari team review karegi. 🙏');
      onReported?.(post.id);
    } catch {
      Alert.alert('Error', 'Report nahi ho saka. Dobara try karo.');
    } finally {
      setReporting(false);
    }
  }, [post.id, user, onReported]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(post)}
      activeOpacity={0.85}
    >
      {/* Category + AI Guru badge + report */}
      <View style={styles.topRow}>
        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}18`, borderColor: `${categoryColor}40` }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>{post.category}</Text>
        </View>
        {post.hasAIGuruReply && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiText}>🧿 AI Guru verified</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={(e) => { e.stopPropagation?.(); setShowReportModal(true); }}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="flag-outline" size={14} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

      {/* Content preview */}
      <Text style={styles.content} numberOfLines={2}>{post.content}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: categoryColor }]}>
            <Text style={styles.avatarText}>{post.author.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.author}</Text>
            <Text style={styles.location}>📍 {post.location}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={13} color={Colors.rose} />
            <Text style={styles.statText}>{post.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={13} color={Colors.peacock} />
            <Text style={styles.statText}>{post.replies}</Text>
          </View>
          <Text style={styles.timeAgo}>{post.timeAgo}</Text>
        </View>
      </View>
      {/* Report modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowReportModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Post Report Karo</Text>
            <Text style={styles.modalSubtitle}>Kya problem hai?</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={styles.reportOption}
                  onPress={() => handleReport(reason)}
                  disabled={reporting}
                >
                  <Text style={styles.reportOptionText}>{REPORT_REASON_LABELS[reason]}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowReportModal(false)}
            >
              <Text style={styles.cancelText}>Ruk Jao / Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </TouchableOpacity>
  );
}

export default memo(PostCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  aiBadge: {
    backgroundColor: '#006B6B14',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  aiText: {
    fontSize: Typography.xs,
    color: Colors.peacock,
    fontWeight: '600',
  },
  title: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 21,
  },
  content: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  authorName: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  location: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  reportBtn: {
    marginLeft: 'auto',
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reportOptionText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  cancelBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: `${Colors.rose}14`,
    borderRadius: Radius.md,
  },
  cancelText: {
    fontSize: Typography.sm,
    color: Colors.rose,
    fontWeight: '600',
  },
});
