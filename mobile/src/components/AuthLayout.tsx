import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow } from './theme';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

// Giriş ve kayıt ekranlarının ortak görünümü: renkli üst alan, logo ve form kartı.
export default function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.hero} />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.brand}>
              <View style={styles.logo}>
                <Ionicons name="school" size={40} color={colors.primary} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.card}>{children}</View>
            {footer}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 24 },
  brand: { alignItems: 'center', gap: 8 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#E0E7FF', textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 20, gap: 16, ...shadow },
});
