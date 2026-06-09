import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { Colors, Spacing, Radius, Typography, Shadows } from '@theme/index';
import RangoliBorder from '@components/common/RangoliBorder';
import { CommunityPost } from '@components/community';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostReply {
  id: string;
  author: string;
  location: string;
  content: string;
  timeAgo: string;
  likes: number;
  isAIGuru: boolean;
}

type RouteParams = {
  PostDetail: { postId: string; post: CommunityPost };
};

// ─── Mock replies (replace with Firestore) ───────────────────────────────────

const MOCK_REPLIES: Record<string, PostReply[]> = {
  '1': [
    {
      id: 'ai-1',
      author: 'AI Guru',
      location: 'BabySaathi',
      content:
        '2 महीने के शिशु के लिए हर 2-3 घंटे में feeding बिल्कुल normal है। Demand feeding में बच्चे की भूख के signal follow करें — जैसे rooting reflex या हाथ मुंह में डालना। WHO की guideline के अनुसार 6 months तक exclusive breastfeeding recommended है। अगर baby का weight gain ठीक है और wet diapers 6+ per day हैं, तो घबराने की ज़रूरत नहीं।',
      timeAgo: '1h ago',
      likes: 15,
      isAIGuru: true,
    },
    {
      id: 'r1-2',
      author: 'Rekha Mehta',
      location: 'Pune',
      content: 'हाँ bilkul normal है! मेरा बेटा भी 2 महीने तक हर 2.5 घंटे में मांगता था। Pediatrician ने कहा था demand feeding ही best है — schedule की tension mat lo।',
      timeAgo: '45m ago',
      likes: 8,
      isAIGuru: false,
    },
    {
      id: 'r1-3',
      author: 'Dr. Ritu Sharma',
      location: 'Delhi',
      content: 'As a pediatrician, I confirm — 2-3 hour feeding cycle is perfectly normal for a 2-month-old. Track wet diapers (6-8/day) and weight gain to ensure adequate intake.',
      timeAgo: '30m ago',
      likes: 22,
      isAIGuru: false,
    },
  ],
  '2': [
    {
      id: 'ai-2',
      author: 'AI Guru',
      location: 'BabySaathi',
      content:
        '6 months में solids शुरू करने के लिए WHO recommendation है। शुरुआत single-ingredient foods से करें:\n\n🍚 पहला हफ्ता: चावल का पतला पानी / rice cereal\n🍌 दूसरा हफ्ता: केला मैश किया हुआ\n🥕 तीसरा हफ्ता: गाजर/मीठे आलू की purée\n\nHindustan में दाल का पानी और khichdi भी excellent first foods हैं। एक बार में एक नया food introduce करें और 3 दिन wait करें — allergy check के लिए।',
      timeAgo: '4h ago',
      likes: 31,
      isAIGuru: true,
    },
    {
      id: 'r2-2',
      author: 'Nandini Rao',
      location: 'Mysuru',
      content: 'हमने masoor dal का पतला soup और रागी porridge से शुरू किया था। बहुत अच्छे से खाया! South Indian diet में ragi naturally आता है तो आसान था।',
      timeAgo: '3h ago',
      likes: 12,
      isAIGuru: false,
    },
  ],
  '3': [
    {
      id: 'ai-3',
      author: 'AI Guru',
      location: 'BabySaathi',
      content:
        'रात 8-11 बजे का crying spree अक्सर "colic" होती है — especially 3 महीने से कम उम्र में यह common है। Colic का exact कारण अभी तक पूरी तरह समझ नहीं आया, लेकिन कुछ उपाय:\n\n🤱 Feed के बाद अच्छे से burp करवाएं\n🌀 Tummy massage clockwise direction में\n💃 Baby को vertical hold में हल्के हल्के rock करें\n🚗 गाड़ी की ride भी काम करती है\n\nGood news: Colic अक्सर 3-4 महीने में अपने आप ठीक हो जाती है।',
      timeAgo: '20h ago',
      likes: 28,
      isAIGuru: true,
    },
  ],
};

const DEFAULT_REPLIES: PostReply[] = [
  {
    id: 'default-1',
    author: 'AI Guru',
    location: 'BabySaathi',
    content: 'यह एक बहुत अच्छा सवाल है! Community के अनुभवी माता-पिता जल्द ही जवाब देंगे। अगर urgent हो तो BabySaathi के AI Chat में पूछ सकते हैं।',
    timeAgo: 'just now',
    likes: 3,
    isAIGuru: true,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'PostDetail'>>();
  const { post } = route.params;

  const replies = MOCK_REPLIES[post.id] ?? DEFAULT_REPLIES;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [replyText, setReplyText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleLike = useCallback(() => {
    setLiked(v => !v);
    setLikeCount(c => (liked ? c - 1 : c + 1));
  }, [liked]);

  const handleSubmitReply = useCallback(() => {
    if (!replyText.trim()) return;
    Alert.alert('जवाब भेजा गया! 🙏', 'आपका जवाब community में add हो गया।');
    setReplyText('');
  }, [replyText]);

  const renderReply = useCallback(
    ({ item }: { item: PostReply }) => (
      <View style={[styles.replyCard, item.isAIGuru && styles.aiReplyCard]}>
        {item.isAIGuru ? (
          <LinearGradient
            colors={['#006B6B14', '#006B6B08']}
            style={styles.aiReplyGradient}
          >
            <ReplyContent reply={item} />
          </LinearGradient>
        ) : (
          <ReplyContent reply={item} />
        )}
      </View>
    ),
    [],
  );

  const ListHeader = (
    <View>
      {/* Back header */}
      <LinearGradient
        colors={Colors.gradients.community as [string, string]}
        style={styles.topBar}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>समाज · Community</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>
      <RangoliBorder />

      {/* Post card */}
      <View style={styles.postCard}>
        <View style={styles.postCategoryRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{post.category}</Text>
          </View>
          {post.hasAIGuruReply && (
            <View style={styles.aiPill}>
              <Text style={styles.aiPillText}>🧿 AI Guru verified</Text>
            </View>
          )}
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {post.tags.map(tag => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        )}

        {/* Author + actions */}
        <View style={styles.postFooter}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{post.author.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.author}</Text>
              <Text style={styles.authorMeta}>📍 {post.location} · {post.timeAgo}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={18}
                color={liked ? Colors.rose : Colors.textTertiary}
              />
              <Text style={[styles.actionCount, liked && { color: Colors.rose }]}>
                {likeCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => inputRef.current?.focus()}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.peacock} />
              <Text style={[styles.actionCount, { color: Colors.peacock }]}>
                {replies.length}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>
        {replies.length} जवाब · Answers
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={replies}
          keyExtractor={item => item.id}
          renderItem={renderReply}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        {/* Reply input */}
        <View style={styles.replyInputBar}>
          <TextInput
            ref={inputRef}
            style={styles.replyInput}
            placeholder="अपना जवाब लिखें... / Write your answer"
            placeholderTextColor={Colors.textTertiary}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
            onPress={handleSubmitReply}
            disabled={!replyText.trim()}
          >
            <Ionicons name="send" size={18} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Reply content (shared between AI and regular replies) ────────────────────

function ReplyContent({ reply }: { reply: PostReply }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(reply.likes);

  return (
    <View style={styles.replyInner}>
      <View style={styles.replyHeader}>
        <View style={[styles.replyAvatar, reply.isAIGuru && styles.aiAvatar]}>
          <Text style={styles.avatarText}>
            {reply.isAIGuru ? '🧿' : reply.author.charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.replyNameRow}>
            <Text style={[styles.replyAuthor, reply.isAIGuru && { color: Colors.peacock }]}>
              {reply.author}
            </Text>
            {reply.isAIGuru && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.replyMeta}>📍 {reply.location} · {reply.timeAgo}</Text>
        </View>
      </View>
      <Text style={styles.replyContent}>{reply.content}</Text>
      <TouchableOpacity
        style={styles.replyLike}
        onPress={() => {
          setLiked(v => !v);
          setCount(c => (liked ? c - 1 : c + 1));
        }}
      >
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? Colors.rose : Colors.textTertiary} />
        <Text style={[styles.replyLikeCount, liked && { color: Colors.rose }]}>{count} helpful</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  postCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  postCategoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryPill: {
    backgroundColor: `${Colors.primary}18`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  categoryPillText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  aiPill: {
    backgroundColor: `${Colors.peacock}14`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  aiPillText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.peacock,
  },
  postTitle: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  postContent: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tag: {
    fontSize: Typography.xs,
    color: Colors.peacock,
    backgroundColor: `${Colors.peacock}10`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  authorName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  authorMeta: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  replyCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  aiReplyCard: {
    borderColor: `${Colors.peacock}40`,
    borderWidth: 1.5,
  },
  aiReplyGradient: {
    flex: 1,
  },
  replyInner: {
    padding: Spacing.md,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatar: {
    backgroundColor: `${Colors.peacock}20`,
  },
  replyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  replyAuthor: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    backgroundColor: Colors.peacock,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: 9,
    color: Colors.textOnPrimary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  replyMeta: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  replyContent: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  replyLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyLikeCount: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  replyInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.peacock,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textDisabled,
  },
});
