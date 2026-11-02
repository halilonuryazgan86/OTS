import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from './theme';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
};

const formatDay = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
const formatTime = (d: Date) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

// Tarih ve saat seçimi. İleri bir tarih seçilemez (sunucu da kontrol eder).
export default function DateTimeField({ label, value, onChange }: Props) {
  const now = new Date();

  // Android'de tarih ve saat ayrı pencerelerde seçilir; seçilen parça mevcut değerle birleştirilir.
  const openAndroid = (mode: 'date' | 'time') =>
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      maximumDate: now,
      onValueChange: (_, picked) => {
        const next = new Date(value);
        if (mode === 'date') next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        onChange(next > new Date() ? new Date() : next);
      },
    });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => onChange(new Date())} hitSlop={8}>
          <Text style={styles.now}>Şimdi</Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          locale="tr-TR"
          maximumDate={now}
          onValueChange={(_, picked) => onChange(picked)}
          style={styles.ios}
        />
      ) : (
        <View style={styles.row}>
          <Pressable style={styles.box} onPress={() => openAndroid('date')}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.value}>{formatDay(value)}</Text>
          </Pressable>
          <Pressable style={[styles.box, styles.timeBox]} onPress={() => openAndroid('time')}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.value}>{formatTime(value)}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  now: { fontSize: 13, fontWeight: '700', color: colors.primary },
  row: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timeBox: { flex: 0, minWidth: 100 },
  value: { fontSize: 15, color: colors.text, fontWeight: '500' },
  ios: { alignSelf: 'flex-start' },
});
