import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

type Props = { weeks: { weekStart: string; completed: number }[] };

const CHART_HEIGHT = 120;
const label = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

// Haftalık tamamlanan konu sayısı (tek seri, tek renk). Çubuğa dokununca o haftanın değeri gösterilir.
export default function WeeklyBarChart({ weeks }: Props) {
  const [selected, setSelected] = useState(weeks.length - 1);
  const max = Math.max(1, ...weeks.map((w) => w.completed));
  const current = weeks[selected];

  return (
    <View style={styles.wrap}>
      {current && (
        <Text style={styles.readout}>
          <Text style={styles.readoutValue}>{current.completed}</Text> konu · {label(current.weekStart)} haftası
        </Text>
      )}
      <View style={styles.plot}>
        {/* Çekinik taban çizgisi */}
        <View style={styles.baseline} />
        {weeks.map((w, i) => {
          const h = w.completed === 0 ? 2 : Math.max(4, (w.completed / max) * CHART_HEIGHT);
          const active = i === selected;
          return (
            <Pressable
              key={w.weekStart}
              onPress={() => setSelected(i)}
              style={styles.slot}
              accessibilityLabel={`${label(w.weekStart)} haftası: ${w.completed} konu`}
            >
              <View
                style={[
                  styles.bar,
                  { height: h, backgroundColor: w.completed === 0 ? colors.border : colors.primary, opacity: active ? 1 : 0.55 },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.axis}>
        {weeks.map((w, i) => (
          <Text key={w.weekStart} style={[styles.tick, i === selected && styles.tickActive]} numberOfLines={1}>
            {label(w.weekStart)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  readout: { fontSize: 14, color: colors.muted },
  readoutValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  plot: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT, gap: 2 },
  baseline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  // Dokunma alanı çubuktan geniş: tüm sütun yüksekliği.
  slot: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', gap: 2 },
  tick: { flex: 1, fontSize: 10, color: colors.neutral, textAlign: 'center' },
  tickActive: { color: colors.text, fontWeight: '700' },
});
