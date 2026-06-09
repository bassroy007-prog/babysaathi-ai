import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, Radius, Typography, Shadows } from '@theme/index';
import RangoliBorder from '@components/common/RangoliBorder';
import { PostCard, CommunityPost } from '@components/community';

// ─── Mock data (replace with Firestore listener) ──────────────────────────────

const MOCK_POSTS: CommunityPost[] = [
  {
    id: '1',
    title: 'मेरे बच्चे को 3 घंटे में एक बार दूध पिलाना सही है?',
    content: '2 महीने का baby है। Doctor ने कहा demand feeding करो, लेकिन वो हर 3 घंटे में ही मांगता है। क्या यह normal है?',
    category: 'दूध/Feeding',
    author: 'Priya Sharma',
    location: 'Mumbai',
    timeAgo: '2h ago',
    likes: 24,
    replies: 8,
    hasAIGuruReply: true,
    tags: ['newborn', 'feeding', 'breastfeeding'],
  },
  {
    id: '2',
    title: '6 month baby को solid food कब और कैसे शुरू करें?',
    content: 'Pediatrician ने 6 months में solids शुरू करने को कहा। किस food से start करें? Rice cereal या fruits? Indian घर में क्या देते हैं traditionally?',
    category: 'पहला बच्चा',
    author: 'Rahul Gupta',
    location: 'Delhi',
    timeAgo: '5h ago',
    likes: 41,
    replies: 15,
    hasAIGuruReply: true,
    tags: ['solids', 'weaning', '6months'],
  },
  {
    id: '3',
    title: 'रात को बच्चा बहुत रोता है — Gas की problem है क्या?',
    content: 'मेरा 3 महीने का बेटा रात 9 बजे से 11 बजे तक बहुत रोता है। दूध पिलाने के बाद भी नहीं रुकता। दादी कह रही हैं gas है। क्या करूँ?',
    category: 'नींद/Sleep',
    author: 'Sunita Patel',
    location: 'Ahmedabad',
    timeAgo: '1d ago',
    likes: 67,
    replies: 23,
    hasAIGuruReply: true,
    tags: ['colic', 'sleep', 'crying'],
  },
  {
    id: '4',
    title: 'BCG vaccine के बाद बच्चे को बुखार आया — normal है?',
    content: '10 दिन पहले BCG लगवाई। अब injection site पर छोटी सी गांठ बन गई है और हल्का बुखार भी है। Doctor को दिखाना चाहिए?',
    category: 'टीका/Vaccines',
    author: 'Kavitha R',
    location: 'Bengaluru',
    timeAgo: '2d ago',
    likes: 38,
    replies: 11,
    hasAIGuruReply: false,
    tags: ['BCG', 'vaccine', 'fever'],
  },
  {
    id: '5',
    title: '4 months में baby का weight कितना होना चाहिए?',
    content: 'Birth weight था 3.2 kg, अब 4 months में 5.8 kg है। WHO chart देखा तो थोड़ा कम लग रहा है। क्या चिंता करनी चाहिए?',
    category: 'पहला बच्चा',
    author: 'Ananya S',
    location: 'Chennai',
    timeAgo: '3d ago',
    likes: 29,
    replies: 7,
    hasAIGuruReply: true,
    tags: ['growth', 'weight', '4months'],
  },
  {
    id: '6',
    title: 'Sleep training — Cry it out method सही है?',
    content: '7 months की बेटी को अभी तक खुद नींद नहीं आती — गोदी में ही सोती है। Cry it out try करने की सोच रही हूँ पर मन नहीं मानता।',
    category: 'नींद/Sleep',
    author: 'Meena Iyer',
    location: 'Hyderabad',
    timeAgo: '4d ago',
    likes: 54,
    replies: 31,
    hasAIGuruReply: false,
    tags: ['sleep-training', 'CIO', '7months'],
  },
  {
    id: '7',
    title: 'Teething में दर्द कम करने के घरेलू नुस्खे?',
    content: '8 months में दांत निकल रहे हैं। बहुत drooling है और चिड़चिड़ा हो गया है। Clove oil लगाएं? या कुछ और?',
    category: 'बीमारी/Illness',
    author: 'Deepika Nair',
    location: 'Kochi',
    timeAgo: '5d ago',
    likes: 45,
    replies: 18,
    hasAIGuruReply: true,
    tags: ['teething', 'home-remedy', '8months'],
  },
];

const CATEGORIES = [
  'सभी / All',
  'Trending',
  'पहला बच्चा',
  'दूध/Feeding',
  'नींद/Sleep',
  'टीका/Vaccines',
  'बीमारी/Illness',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState('सभी / All');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredPosts = useMemo(() => {
    let posts = MOCK_POSTS;
    if (selectedCategory !== 'सभी / All') {
      posts = posts.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q),
      );
    }
    return posts;
  }, [selectedCategory, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: fetch from Firestore
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const handlePostPress = useCallback(
    (post: CommunityPost) => {
      navigation.navigate('PostDetail', { postId: post.id, post });
    },
    [navigation],
  );

  const renderPost = useCallback(
    ({ item }: { item: CommunityPost }) => (
      <PostCard post={item} onPress={handlePostPress} />
    ),
    [handlePostPress],
  );

  const keyExtractor = useCallback((item: CommunityPost) => item.id, []);

  const ListHeader = (
    <View>
      {/* Hero header */}
      <LinearGradient
        colors={Colors.gradients.community as [string, string]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>👨‍👩‍👧</Text>
          <View>
            <Text style={styles.headerTitle}>समाज · Community</Text>
            <Text style={styles.headerSub}>Indian parents helping each other 🇮🇳</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSearch(v => !v)} style={styles.searchBtn}>
            <Ionicons name={showSearch ? 'close' : 'search'} size={22} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
        <RangoliBorder style={styles.rangoli} />
      </LinearGradient>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIES.map(cat => {
          const active = cat === selectedCategory;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                active && { backgroundColor: Colors.peacock, borderColor: Colors.peacock },
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && { color: Colors.textOnPrimary }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredPosts.length} सवाल · {filteredPosts.reduce((s, p) => s + p.replies, 0)} जवाब
        </Text>
        <Text style={styles.statsHint}>🧿 AI Guru verified answers</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPosts}
        keyExtractor={keyExtractor}
        renderItem={renderPost}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.peacock}
            colors={[Colors.peacock]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤔</Text>
            <Text style={styles.emptyText}>कोई सवाल नहीं मिला</Text>
            <Text style={styles.emptySub}>Be the first to ask!</Text>
          </View>
        }
      />

      {/* FAB — ask a question */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => {
          // TODO: navigate to AskQuestion screen
        }}
      >
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={20} color={Colors.textOnPrimary} />
          <Text style={styles.fabText}>नया सवाल पूछें</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.base,
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textOnPrimary,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  searchBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangoli: {
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  chipsRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  statsText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsHint: {
    fontSize: Typography.xs,
    color: Colors.peacock,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    borderRadius: Radius.full,
    ...Shadows.lg,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  fabText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.base,
    fontWeight: '700',
  },
});
