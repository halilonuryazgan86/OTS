import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

// Şifre yazılırken kuralların karşılanıp karşılanmadığını canlı gösterir.
export default function PasswordRules({ password, confirm }: { password: string; confirm: string }) {
  const rules = [
    { ok: password.length >= 8, label: 'En az 8 karakter' },
    { ok: /\p{L}/u.test(password), label: 'En az bir harf' },
    { ok: /\d/.test(password), label: 'En az bir rakam' },
    { ok: password.length > 0 && password === confirm, label: 'Şifreler eşleşiyor' },
  ];

  return (
    <View style={styles.rules}>
      {rules.map((r) => (
        <View key={r.label} style={styles.rule}>
          <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.ok ? colors.success : colors.neutral} />
          <Text style={[styles.text, r.ok && styles.ok]}>{r.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rules: { gap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 13, color: colors.muted },
  ok: { color: colors.success },
});
