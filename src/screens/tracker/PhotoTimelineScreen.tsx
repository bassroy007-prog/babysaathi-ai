import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Modal, TextInput, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, differenceInMonths } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { getJournalEntries, addJournalEntry } from '@services/firebase/firestore';
import { buildCollageHTML } from '@utils/photoCollage';
import type { JournalEntry } from '@types/index';

const { width: W } = Dimensions.get('window');
const GAP      = 2;
const PADDING  = Spacing.lg;
const CELL     = (W - PADDING * 2 - GAP * 2) / 3;

interface PhotoItem {
  key:         string;
  url:         string;
  caption?:    string;
  tags:        string[];
  date:        Date;
  monthOfLife: number;
}

interface MonthSection {
  monthOfLife:  number;
  monthLabel:   string;
  calendarLabel: string;
  photos:       PhotoItem[];
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function confettiFor(m: number): string {
  if (m === 0) return ' 🎉';
  if (m === 5) return ' 🎂';  // 6 months
  if (m === 11) return ' 🥳'; // 12 months
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PhotoTimelineScreen() {
  const { activeBaby } = useBabyStore();
  const { user }       = useAuthStore();

  const [entries,     setEntries]     = useState<JournalEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // Viewer
  const [viewerPhoto, setViewerPhoto] = useState<PhotoItem | null>(null);
  const [viewerIdx,   setViewerIdx]   = useState(0);
  const [viewerList,  setViewerList]  = useState<PhotoItem[]>([]);

  // Add memory modal
  const [addVisible,  setAddVisible]  = useState(false);
  const [pickedUri,   setPickedUri]   = useState<string | null>(null);
  const [caption,     setCaption]     = useState('');
  const [saving,      setSaving]      = useState(false);

  // Collage
  const [sharingMonth, setSharingMonth] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!activeBaby) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getJournalEntries(activeBaby.id, 300);
      setEntries(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBaby?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const sections: MonthSection[] = useMemo(() => {
    if (!activeBaby) return [];
    const birthDate = activeBaby.birthDate instanceof Date
      ? activeBaby.birthDate : new Date(activeBaby.birthDate);

    const allPhotos: PhotoItem[] = [];
    entries.forEach((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const monthOfLife = Math.max(0, differenceInMonths(d, birthDate));
      e.photoURLs.forEach((url, i) => {
        allPhotos.push({
          key: `${e.id}_${i}`,
          url,
          caption: e.content ?? e.title,
          tags: e.tags ?? [],
          date: d,
          monthOfLife,
        });
      });
    });

    // Group by month of life
    const map = new Map<number, PhotoItem[]>();
    allPhotos.forEach((p) => {
      const list = map.get(p.monthOfLife) ?? [];
      list.push(p);
      map.set(p.monthOfLife, list);
    });

    // Sort newest month first
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([month, photos]) => {
        const sampleDate = photos[0].date;
        return {
          monthOfLife: month,
          monthLabel: `Month ${month + 1}${confettiFor(month)}`,
          calendarLabel: format(sampleDate, 'MMMM yyyy'),
          photos: photos.sort((a, b) => b.date.getTime() - a.date.getTime()),
        };
      });
  }, [entries, activeBaby]);

  const totalPhotos = useMemo(() => sections.reduce((s, sec) => s + sec.photos.length, 0), [sections]);

  // ── Viewer ─────────────────────────────────────────────────────────────────

  const openViewer = (photo: PhotoItem, section: MonthSection) => {
    setViewerList(section.photos);
    const idx = section.photos.findIndex((p) => p.key === photo.key);
    setViewerIdx(idx >= 0 ? idx : 0);
    setViewerPhoto(photo);
  };

  const viewerCurrent = viewerList[viewerIdx] ?? viewerPhoto;

  // ── Add Memory ─────────────────────────────────────────────────────────────

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.55,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const { base64 } = result.assets[0];
      setPickedUri(`data:image/jpeg;base64,${base64}`);
    }
  };

  const handleSaveMemory = async () => {
    if (!pickedUri || !activeBaby || !user) return;
    setSaving(true);
    try {
      await addJournalEntry({
        babyId: activeBaby.id,
        userId: user.uid,
        date: new Date(),
        title: caption || undefined,
        content: caption || undefined,
        photoURLs: [pickedUri],
        videoURLs: [],
        tags: [],
      });
      setAddVisible(false);
      setPickedUri(null);
      setCaption('');
      await load(true);
    } catch {
      Alert.alert('Error', 'Could not save memory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeAddModal = () => {
    setAddVisible(false);
    setPickedUri(null);
    setCaption('');
  };

  // ── Collage ────────────────────────────────────────────────────────────────

  const handleShareCollage = async (section: MonthSection) => {
    setSharingMonth(section.monthOfLife);
    try {
      const collagePhotos = section.photos.slice(0, 4).map((p) => ({
        url: p.url, caption: p.caption, date: p.date,
      }));
      const html = buildCollageHTML(collagePhotos, section.monthLabel, activeBaby!.name);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch {
      Alert.alert('Error', 'Could not create collage.');
    } finally {
      setSharingMonth(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!activeBaby) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No baby profile found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#6B2FA0', '#9C3AA5']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📸 Memory Wall</Text>
            <Text style={styles.headerSub}>
              {activeBaby.name} · {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} across {sections.length} month{sections.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9C3AA5" />
          <Text style={styles.loadingText}>Loading memories…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {sections.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌟</Text>
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptyBody}>
                Tap the + button below to add your first memory, or add photos when logging journal entries.
              </Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.monthOfLife} style={styles.section}>

                {/* Section header */}
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>{section.monthLabel}</Text>
                    <Text style={styles.sectionSub}>
                      {section.calendarLabel} · {section.photos.length} photo{section.photos.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.collageBtn, sharingMonth === section.monthOfLife && { opacity: 0.5 }]}
                    onPress={() => handleShareCollage(section)}
                    disabled={sharingMonth !== null}
                  >
                    {sharingMonth === section.monthOfLife
                      ? <ActivityIndicator size="small" color="#9C3AA5" />
                      : <>
                          <Ionicons name="images-outline" size={14} color="#9C3AA5" />
                          <Text style={styles.collageBtnText}>Collage</Text>
                        </>}
                  </TouchableOpacity>
                </View>

                {/* 3-column photo grid */}
                {chunkArray(section.photos, 3).map((row, ri) => (
                  <View key={ri} style={styles.photoRow}>
                    {row.map((photo) => (
                      <TouchableOpacity
                        key={photo.key}
                        onPress={() => openViewer(photo, section)}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: photo.url }}
                          style={styles.photoCell}
                          resizeMode="cover"
                        />
                        {photo.tags.length > 0 && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>#{photo.tags[0]}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                    {/* Fill empty cells in last row */}
                    {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
                      <View key={`empty_${i}`} style={styles.photoCellEmpty} />
                    ))}
                  </View>
                ))}
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddVisible(true)} activeOpacity={0.85}>
        <LinearGradient colors={['#6B2FA0', '#9C3AA5']} style={styles.fabGrad}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Full-screen photo viewer ────────────────────────────────────── */}
      <Modal visible={!!viewerPhoto} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.viewerBg}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Close + counter */}
            <View style={styles.viewerTop}>
              <TouchableOpacity onPress={() => setViewerPhoto(null)} style={styles.viewerClose}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
              {viewerList.length > 1 && (
                <Text style={styles.viewerCounter}>{viewerIdx + 1} / {viewerList.length}</Text>
              )}
            </View>

            {/* Photo */}
            <View style={styles.viewerImageWrap}>
              {viewerCurrent && (
                <Image
                  source={{ uri: viewerCurrent.url }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Prev / Next */}
            {viewerList.length > 1 && (
              <View style={styles.viewerNav}>
                <TouchableOpacity
                  onPress={() => setViewerIdx((i) => Math.max(0, i - 1))}
                  disabled={viewerIdx === 0}
                  style={[styles.viewerNavBtn, viewerIdx === 0 && { opacity: 0.2 }]}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewerIdx((i) => Math.min(viewerList.length - 1, i + 1))}
                  disabled={viewerIdx === viewerList.length - 1}
                  style={[styles.viewerNavBtn, viewerIdx === viewerList.length - 1 && { opacity: 0.2 }]}
                >
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Caption overlay */}
            {viewerCurrent && (viewerCurrent.caption || viewerCurrent.tags.length > 0) && (
              <View style={styles.viewerCaption}>
                <Text style={styles.viewerDate}>{format(viewerCurrent.date, 'd MMMM yyyy')}</Text>
                {viewerCurrent.caption && (
                  <Text style={styles.viewerCaptionText}>{viewerCurrent.caption}</Text>
                )}
                {viewerCurrent.tags.length > 0 && (
                  <View style={styles.viewerTags}>
                    {viewerCurrent.tags.map((t) => (
                      <View key={t} style={styles.viewerTag}>
                        <Text style={styles.viewerTagText}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Add Memory modal ──────────────────────────────────────────────── */}
      <Modal visible={addVisible} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.addOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeAddModal} />
          <View style={styles.addSheet}>
            {/* Header */}
            <View style={styles.addHeader}>
              <Text style={styles.addTitle}>Add Memory</Text>
              <TouchableOpacity onPress={closeAddModal}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Photo picker */}
            <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
              {pickedUri ? (
                <Image source={{ uri: pickedUri }} style={styles.photoPickerPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoPickerEmpty}>
                  <Ionicons name="camera-outline" size={40} color="#9C3AA5" />
                  <Text style={styles.photoPickerText}>Tap to choose photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {pickedUri && (
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickPhoto}>
                <Text style={styles.changePhotoText}>Change photo</Text>
              </TouchableOpacity>
            )}

            {/* Caption */}
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption (optional)…"
              placeholderTextColor={Colors.textSecondary}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={2}
            />

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, (!pickedUri || saving) && { opacity: 0.4 }]}
              onPress={handleSaveMemory}
              disabled={!pickedUri || saving}
            >
              <LinearGradient colors={['#6B2FA0', '#9C3AA5']} style={styles.saveBtnGrad}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>💾 Save Memory</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText:   { fontSize: Typography.base, color: Colors.textSecondary },
  loadingText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },

  header:        { paddingBottom: Spacing.xl },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:   { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  scroll: { paddingHorizontal: PADDING, paddingTop: Spacing.lg },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon:  { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyBody:  { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  section:       { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:  { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  sectionSub:    { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  collageBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: '#9C3AA5', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  collageBtnText: { fontSize: Typography.xs, fontWeight: '700', color: '#9C3AA5' },

  photoRow:      { flexDirection: 'row', gap: GAP, marginBottom: GAP },
  photoCell:     { width: CELL, height: CELL, borderRadius: Radius.md, backgroundColor: Colors.border },
  photoCellEmpty: { width: CELL, height: CELL },
  tagBadge:     { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radius.sm, paddingHorizontal: 5, paddingVertical: 2 },
  tagBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  fab:     { position: 'absolute', bottom: 32, right: 24, borderRadius: 28, overflow: 'hidden', ...Shadows.lg },
  fabGrad: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },

  // Viewer
  viewerBg:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  viewerTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  viewerClose:     { padding: 8 },
  viewerCounter:   { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  viewerImageWrap: { flex: 1, justifyContent: 'center' },
  viewerImage:     { width: W, height: W },
  viewerNav:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  viewerNavBtn:    { padding: 8 },
  viewerCaption:   { backgroundColor: 'rgba(0,0,0,0.7)', padding: Spacing.lg, paddingBottom: 32 },
  viewerDate:      { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  viewerCaptionText: { fontSize: Typography.base, color: '#fff', lineHeight: 22 },
  viewerTags:      { flexDirection: 'row', gap: 6, marginTop: Spacing.sm, flexWrap: 'wrap' },
  viewerTag:       { backgroundColor: 'rgba(156,58,165,0.4)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  viewerTagText:   { fontSize: Typography.xs, color: '#E8AAFF', fontWeight: '600' },

  // Add modal
  addOverlay: { flex: 1, justifyContent: 'flex-end' },
  addSheet:   { backgroundColor: Colors.surface, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, paddingBottom: 40, ...Shadows.lg },
  addHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  addTitle:   { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },

  photoPicker:      { height: 200, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.sm, backgroundColor: Colors.background },
  photoPickerPreview: { width: '100%', height: '100%' },
  photoPickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: '#9C3AA5', borderRadius: Radius.xl },
  photoPickerText:  { fontSize: Typography.sm, color: '#9C3AA5', fontWeight: '600' },
  changePhotoBtn:   { alignSelf: 'center', marginBottom: Spacing.md },
  changePhotoText:  { fontSize: Typography.sm, color: '#9C3AA5', fontWeight: '700' },

  captionInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.sm, color: Colors.textPrimary, minHeight: 64, marginBottom: Spacing.lg },

  saveBtn:     { borderRadius: Radius.xl, overflow: 'hidden' },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
