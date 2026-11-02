import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressStatus } from '../types/course';
import { colors, percent, STATUS } from './theme';

type Props = { completed: number; inProgress: number; notStarted: number };

const ORDER: ProgressStatus[] = ['Completed', 'InProgress', 'NotStarted'];

// Durum dağılımı: tek yığılmış çubuk + ikonlu/etiketli açıklama (renk tek başına anlam taşımaz).
export default function StatusBreakdown({ completed, inProgress, notStarted }: Props) {
  const values: Record<ProgressStatus, number> = { Completed: completed, InProgress: inProgress, NotStarted: notStarted };
  const total = completed + inProgress + notStarted;

  return (
    <View style={styles.wrap}>
      <View style={styles.bar} accessibilityLabel="Durum dağılımı">
        {total === 0 ? (
          <View style={[styles.segment, { flex: 1, backgroundColor: colors.neutralSoft }]} />
        ) : (
          ORDER.filter((s) => values[s] > 0).map((s) => (
            <View key={s} style={[styles.segment, { flex: values[s], backgroundColor: STATUS[s].color }]} />
          ))
        )}
      </View>
      <View style={styles.legend}>
        {ORDER.map((s) => (
          <View key={s} style={styles.item}>
            <Ionicons name={STATUS[s].icon} size={16} color={STATUS[s].color} />
            <Text style={styles.label}>{STATUS[s].label}</Text>
            <Text style={styles.value}>
              {values[s]} <Text style={styles.pct}>(%{percent(values[s], total)})</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  // Segmentler arasında 2px yüzey boşluğu; uçlar yuvarlatılmış.
  bar: { flexDirection: 'row', height: 14, gap: 2, borderRadius: 7, overflow: 'hidden' },
  segment: { height: '100%' },
  legend: { gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontSize: 14, color: colors.text },
  value: { fontSize: 14, fontWeight: '700', color: colors.text },
  pct: { fontWeight: '500', color: colors.muted },
});
