import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppButton from '../components/AppButton';
import AuthLayout from '../components/AuthLayout';
import FormError from '../components/FormError';
import TextField from '../components/TextField';
import { colors } from '../components/theme';
import { errorMessage } from '../services/api';
import { useAuth } from '../services/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre zorunlu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Öğrenci Takip Sistemi"
      subtitle="Öğretmen ve veli girişi"
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Özel ders öğretmeni misiniz?</Text>
          <Link href="/register" style={styles.link}>
            Öğretmen hesabı oluşturun
          </Link>
        </View>
      }
    >
      <TextField
        label="E-posta"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="ornek@mail.com"
      />
      <TextField
        label="Şifre"
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        secure
        autoComplete="password"
        onSubmitEditing={submit}
      />
      <FormError message={error} />
      <AppButton title="Giriş yap" icon="log-in-outline" onPress={submit} loading={loading} />
      <Text style={styles.hint}>Veli hesabınız yoksa çocuğunuzun öğretmeninden hesap oluşturmasını isteyin.</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  hint: { textAlign: 'center', fontSize: 13, color: colors.muted, lineHeight: 19 },
  footer: { alignItems: 'center', gap: 4 },
  footerText: { fontSize: 14, color: colors.muted },
  link: { fontSize: 15, fontWeight: '700', color: colors.primary, padding: 4 },
});
