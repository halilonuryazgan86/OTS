import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from './theme';

export default function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.box}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: radius.md,
  },
  text: { flex: 1, color: colors.danger, fontSize: 14 },
});
