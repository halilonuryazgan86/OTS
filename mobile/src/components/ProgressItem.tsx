import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Progress, ProgressStatus } from '../types/course';

const LABELS: Record<ProgressStatus, string> = {
  NotStarted: 'Başlamadı',
  InProgress: 'Devam ediyor',
  Completed: 'Tamamlandı',
};

const COLORS: Record<ProgressStatus, string> = {
  NotStarted: '#9ca3af',
  InProgress: '#d97706',
  Completed: '#16a34a',
};

const NEXT: Record<ProgressStatus, ProgressStatus> = {
  NotStarted: 'InProgress',
  InProgress: 'Completed',
  Completed: 'NotStarted',
};

type Props = {
  item: Progress;
  onChange: (item: Progress, status: ProgressStatus) => void;
};

// Durum etiketine dokununca sıradaki duruma geçer.
export default function ProgressItem({ item, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{item.topicName}</Text>
      <Pressable
        style={[styles.badge, { backgroundColor: COLORS[item.status] }]}
        onPress={() => onChange(item, NEXT[item.status])}
      >
        <Text style={styles.badgeText}>{LABELS[item.status]}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  name: { flex: 1, fontSize: 15 },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
