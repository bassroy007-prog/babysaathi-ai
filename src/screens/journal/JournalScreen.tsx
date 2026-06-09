import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Image, TextInput, ScrollView, ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { useRefresh } from '@hooks/useRefresh';
import { SkeletonCard, EmptyState } from '@components/common/index';
import { addJournalEntry, getJournalEntries } from '@services/firebase/firestore';
import { JournalEntry } from '@types/index';

const MOOD_OPTIONS = [
  { key: 'happy', emoji: '😊', color: Colors.success },
  { key: 'neutral', emoji: '😐', color: Colors.textSecondary },
  { key: 'tired', emoji: '😴', color: Colors.sleepColor },
  { key: 'worried', emoji: '😟', color: Colors.warning },
];

const EntryCard = memo(({ item, index, total, t }: {
  item: JournalEntry;
  index: number;
  total: number;
  t: (key: string) => string;
}) => {
  const moodOpt = MOOD_OPTIONS.find((m) => m.key === item.mood);
  return (
    <View style={styles.entryCard}>
      {index < total - 1 && <View style={styles.timelineLine} />}
      <View style={styles.entryHeader}>
        <View style={styles.entryDateBadge}>
          <Text style={styles.entryDay}>{format(item.date, 'dd')}</Text>
          <Text style={styles.entryMonth}>{format(item.date, 'MMM')}</Text>
        </View>
        <View style={styles.entryMeta}>
          {item.title ? <Text style={styles.entryTitle}>{item.title}</Text> : null}
          <Text style={styles.entryTime}>{format(item.date, 'hh:mm a')}</Text>
          {moodOpt && (
            <Text style={styles.entryMood}>{moodOpt.emoji} {t(`journal.mood.${item.mood}`)}</Text>
          )}
        </View>
      </View>
      {item.content ? <Text style={styles.entryContent}>{item.content}</Text> : null}
      {item.photoURLs.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.entryPhotos}>
            {item.photoURLs.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.entryPhoto} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
});

export default function JournalScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('happy');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!activeBaby) return;
    setLoadingEntries(true);
    try {
      const data = await getJournalEntries(activeBaby.id);
      setEntries(data);
    } finally {
      setLoadingEntries(false);
    }
  }, [activeBaby]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const { refreshing, refresh } = useRefresh(loadEntries);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedPhotos(result.assets.map((a) => a.uri));
    }
  };

  const handleSave = async () => {
    if (!activeBaby || !user) return;
    if (!content.trim() && selectedPhotos.length === 0) {
      toast.error('Please add some content or photos.');
      return;
    }
    setSaving(true);
    try {
      await addJournalEntry({
        babyId: activeBaby.id,
        userId: user.uid,
        date: new Date(),
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        photoURLs: selectedPhotos,
        videoURLs: [],
        mood,
        tags: [],
      });
      setShowForm(false);
      setTitle('');
      setContent('');
      setSelectedPhotos([]);
      toast.success('📖 Memory saved!');
      await loadEntries();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save memory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<JournalEntry>) => (
    <EntryCard item={item} index={index} total={entries.length} t={t as any} />
  ), [entries.length, t]);

  const keyExtractor = useCallback((item: JournalEntry) => item.id, []);

  const ListHeader = (
    <View>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#FFB347', '#FF8E53']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('journal.title')}</Text>
            {activeBaby ? <Text style={styles.headerSubtitle}>{activeBaby.name}'s Memories</Text> : null}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.formSection}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <LinearGradient
            colors={['#FFB347', '#FF8E53']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.addBtnGradient}
          >
            <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
            <Text style={styles.addBtnText}>{showForm ? 'Cancel' : t('journal.addEntry')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>New Memory</Text>

            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Give this memory a title..."
              placeholderTextColor={Colors.textDisabled}
            />

            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Write about this moment..."
              placeholderTextColor={Colors.textDisabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.moodLabel}>How's the mood?</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodBtn, mood === m.key && { borderColor: m.color, backgroundColor: m.color + '15' }]}
                  onPress={() => setMood(m.key as JournalEntry['mood'])}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodText, mood === m.key && { color: m.color }]}>
                    {t(`journal.mood.${m.key}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.photoPickerBtn} onPress={pickImages}>
              <Ionicons name="images-outline" size={20} color={Colors.accent} />
              <Text style={styles.photoPickerText}>
                {selectedPhotos.length > 0 ? `${selectedPhotos.length} photos selected` : 'Add Photos'}
              </Text>
            </TouchableOpacity>

            {selectedPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosPreview}>
                  {selectedPhotos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.photoThumb} />
                  ))}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          loadingEntries ? (
            <View style={styles.skeletonContainer}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 52 }}>📖</Text>
              <Text style={styles.emptyTitle}>Start Your Baby's Story</Text>
              <Text style={styles.emptyText}>{t('journal.noEntries')}</Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={refreshing}
        removeClippedSubviews
        maxToRenderPerBatch={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 100 },
  header: { paddingBottom: Spacing.lg },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  formSection: { padding: Spacing.xl, gap: Spacing.lg },
  addBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  addBtnGradient: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  addBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  form: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, gap: Spacing.md, ...Shadows.md },
  formTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  titleInput: {
    fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary,
    borderBottomWidth: 1.5, borderBottomColor: Colors.border, paddingBottom: Spacing.sm,
  },
  contentInput: {
    fontSize: Typography.base, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.lg,
    padding: Spacing.md, minHeight: 100,
  },
  moodLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  moodRow: { flexDirection: 'row', gap: Spacing.sm },
  moodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  moodEmoji: { fontSize: 22 },
  moodText: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  photoPickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.accent,
    padding: Spacing.md, justifyContent: 'center',
  },
  photoPickerText: { fontSize: Typography.base, color: Colors.accent, fontWeight: '600' },
  photosPreview: { flexDirection: 'row', gap: Spacing.sm },
  photoThumb: { width: 72, height: 72, borderRadius: Radius.lg },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.xl, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  skeletonContainer: { padding: Spacing.xl, gap: Spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  entryCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, marginHorizontal: Spacing.xl, gap: Spacing.md, ...Shadows.sm,
  },
  timelineLine: { position: 'absolute', left: 36, top: '100%', width: 2, height: Spacing.lg, backgroundColor: Colors.border },
  entryHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  entryDateBadge: {
    width: 48, height: 56, borderRadius: 14,
    backgroundColor: Colors.accent + '20', alignItems: 'center', justifyContent: 'center',
  },
  entryDay: { fontSize: Typography.xl, fontWeight: '800', color: Colors.accent },
  entryMonth: { fontSize: Typography.xs, color: Colors.accent },
  entryMeta: { flex: 1 },
  entryTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  entryTime: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  entryMood: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  entryContent: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22 },
  entryPhotos: { flexDirection: 'row', gap: Spacing.sm },
  entryPhoto: { width: 100, height: 100, borderRadius: Radius.lg },
});
