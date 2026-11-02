import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Progress } from '../types/course';
import Card from './Card';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { colors, formatDate } from './theme';

type Props = {
  courseName: string;
  items: Progress[];
  // Konuya dokununca detay (durum, tarih, yorumlar) açılır.
  onPressTopic?: (item: Progress) => void;
  // Çok ders varken kartlar kapalı başlar; konular yalnızca açılan kartta çizilir.
  initiallyOpen?: boolean;
};

// Bu sayıdan fazla ders varsa kartlar kapalı başlar.
export const OPEN_COURSE_LIMIT = 3;

// İlerleme listesini ders bazında gruplar (API sıralı döner).
export function groupByCourse(items: Progress[]) {
  const map = new Map<number, { courseName: string; items: Progress[] }>();
  for (const p of items) {
    const g = map.get(p.courseId) ?? { courseName: p.courseName, items: [] };
    g.items.push(p);
    map.set(p.courseId, g);
  }
  return [...map.entries()].map(([courseId, g]) => ({ courseId, ...g }));
}

// Bir dersin konu bazında ilerlemesi; başlığa dokununca konular açılır/kapanır.
export default function CourseProgressCard({ courseName, items, onPressTopic, initiallyOpen = true }: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  const done = items.filter((i) => i.status === 'Completed').length;

  return (
    <Card style={styles.card}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.course}>{courseName}</Text>
          <Text style={styles.count}>
            {done}/{items.length} konu tamamlandı
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
      </Pressable>
      <ProgressBar done={done} total={items.length} />

      {open &&
        items.map((item) => (
          <Pressable
            key={item.topicId}
            disabled={!onPressTopic}
            onPress={() => onPressTopic?.(item)}
            style={({ pressed }) => [styles.topic, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <Text style={styles.topicName}>{item.topicName}</Text>
              {item.statusDate && <Text style={styles.date}>{formatDate(item.statusDate)}</Text>}
              {item.lastComment && (
                <Text style={styles.note} numberOfLines={2}>
                  <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.muted} /> {item.lastComment}
                </Text>
              )}
            </View>
            <View style={styles.right}>
              <StatusBadge status={item.status} />
              {item.commentCount > 0 && (
                <View style={styles.comments}>
                  <Ionicons name="chatbubbles-outline" size={13} color={colors.primary} />
                  <Text style={styles.commentCount}>{item.commentCount}</Text>
                </View>
              )}
            </View>
            {onPressTopic && <Ionicons name="chevron-forward" size={18} color={colors.neutral} />}
          </Pressable>
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  course: { fontSize: 17, fontWeight: '700', color: colors.text },
  count: { fontSize: 13, color: colors.muted },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  topicName: { fontSize: 15, color: colors.text, fontWeight: '500' },
  note: { fontSize: 13, color: colors.muted },
  date: { fontSize: 12, color: colors.neutral },
  right: { alignItems: 'flex-end', gap: 4 },
  comments: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  commentCount: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
