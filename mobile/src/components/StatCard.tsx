import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import { colors } from './theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
};

export default function StatCard({ icon, label, value, color, onPress }: Props) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {onPress && <Ionicons name="chevron-forward" size={16} color={colors.neutral} />}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', gap: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 24, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, color: colors.muted, fontWeight: '500' },
});
