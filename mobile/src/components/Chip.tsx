import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function Chip({ label, active, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 14, color: colors.text, fontWeight: '500' },
  activeText: { color: '#fff', fontWeight: '700' },
});
