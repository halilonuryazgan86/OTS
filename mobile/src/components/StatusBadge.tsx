import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressStatus } from '../types/course';
import { STATUS } from './theme';

export default function StatusBadge({ status }: { status: ProgressStatus }) {
  const s = STATUS[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.soft }]}>
      <Ionicons name={s.icon} size={14} color={s.color} />
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  text: { fontSize: 12, fontWeight: '700' },
});
