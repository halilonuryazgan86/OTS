import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ProgressBar from './ProgressBar';
import { colors } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  done: number;
  total: number;
  leading?: ReactNode;
  onPress?: () => void;
};

// Raporlarda bir satır: ad, alt bilgi ve tamamlanma çubuğu.
export default function BarRow({ title, subtitle, done, total, leading, onPress }: Props) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {leading}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <ProgressBar done={done} total={total} />
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.neutral} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  pressed: { opacity: 0.6 },
  body: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  title: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted },
});
