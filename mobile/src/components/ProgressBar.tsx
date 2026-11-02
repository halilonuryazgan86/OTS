import { StyleSheet, Text, View } from 'react-native';
import { colors, percent } from './theme';

type Props = {
  done: number;
  total: number;
  showLabel?: boolean;
};

export default function ProgressBar({ done, total, showLabel = true }: Props) {
  const value = percent(done, total);
  const color = value >= 80 ? colors.success : value >= 40 ? colors.primary : colors.warning;

  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      {showLabel && <Text style={styles.label}>%{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.neutralSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  label: { width: 42, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.text },
});
