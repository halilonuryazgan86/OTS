import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { Progress, ProgressStatus } from '../types/course';
import { colors, radius, STATUS } from './theme';

// Tamamlandı / Devam ediyor / Başlamadı sayıları.
export default function ProgressSummary({ items }: { items: Progress[] }) {
  const order: ProgressStatus[] = ['Completed', 'InProgress', 'NotStarted'];
  return (
    <View style={styles.row}>
      {order.map((s) => {
        const meta = STATUS[s];
        return (
          <View key={s} style={[styles.box, { backgroundColor: meta.soft }]}>
            <Ionicons name={meta.icon} size={18} color={meta.color} />
            <Text style={[styles.value, { color: meta.color }]}>{items.filter((i) => i.status === s).length}</Text>
            <Text style={styles.label}>{meta.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.md, gap: 2 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 12, color: colors.muted, fontWeight: '600', textAlign: 'center' },
});
