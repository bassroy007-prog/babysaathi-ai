import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { JournalEntry } from '@types/index';

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  tired: '😴',
  worried: '😟',
};

const MOOD_COLORS: Record<string, string> = {
  happy: Colors.success,
  neutral: Colors.textSecondary,
  tired: Colors.sleepColor,
  worried: Colors.warning,
};

interface Props {
  entry: JournalEntry;
  showTimeline?: boolean;
  onPress?: (entry: JournalEntry) => void;
}

const JournalEntryCard = memo(({ entry, showTimeline = false, onPress }: Props) => {
  const moodEmoji = MOOD_EMOJIS[entry.mood ?? 'neutral'] ?? '😐';
  const moodColor = MOOD_COLORS[entry.mood ?? 'neutral'] ?? Colors.textSecondary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(entry)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {showTimeline && <View style={styles.timelineLine} />}
      <View style={styles.header}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{format(entry.date, 'dd')}</Text>
          <Text style={styles.dateMonth}>{format(entry.date, 'MMM')}</Text>
        </View>
        <View style={styles.meta}>
          {entry.title ? <Text style={styles.title}>{entry.title}</Text> : null}
          <Text style={styles.time}>{format(entry.date, 'hh:mm a')}</Text>
          {entry.mood && (
            <Text style={[styles.mood, { color: moodColor }]}>
              {moodEmoji} {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
            </Text>
          )}
        </View>
      </View>

      {entry.content ? (
        <Text style={styles.content} numberOfLines={3}>{entry.content}</Text>
      ) : null}

      {entry.photoURLs.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photos}>
            {entry.photoURLs.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.photo} />
            ))}
          </View>
        </ScrollView>
      )}

      {entry.tags.length > 0 && (
        <View style={styles.tags}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
});

export default JournalEntryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.lg,
    gap: Spacing.md, ...Shadows.sm,
  },
  timelineLine: {
    position: 'absolute', left: 36, top: '100%',
    width: 2, height: Spacing.lg, backgroundColor: Colors.border,
  },
  header: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  dateBadge: {
    width: 48, height: 56, borderRadius: 14,
    backgroundColor: Colors.accent + '20', alignItems: 'center', justifyContent: 'center',
  },
  dateDay: { fontSize: Typography.xl, fontWeight: '800', color: Colors.accent },
  dateMonth: { fontSize: Typography.xs, color: Colors.accent },
  meta: { flex: 1 },
  title: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  time: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  mood: { fontSize: Typography.sm, marginTop: 2, fontWeight: '600' },
  content: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22 },
  photos: { flexDirection: 'row', gap: Spacing.sm },
  photo: { width: 90, height: 90, borderRadius: Radius.lg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    backgroundColor: Colors.accent + '18', borderRadius: Radius.full,
  },
  tagText: { fontSize: Typography.xs, color: Colors.accent, fontWeight: '600' },
});
