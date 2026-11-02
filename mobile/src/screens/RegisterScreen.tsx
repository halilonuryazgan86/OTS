import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppButton from '../components/AppButton';
import AuthLayout from '../components/AuthLayout';
import FormError from '../components/FormError';
import PasswordRules from '../components/PasswordRules';
import TextField from '../components/TextField';
import { colors } from '../components/theme';
import { errorMessage } from '../services/api';
import { useAuth } from '../services/auth';
import { EMAIL_RE, passwordError } from '../services/validation';

// Bağımsız özel ders öğretmeninin kendi hesabını açması; şifreyi kendisi belirler.
export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const problem =
      fullName.trim().length < 3
        ? 'Ad soyad en az 3 karakter olmalı.'
        : !EMAIL_RE.test(email.trim())
          ? 'Geçerli bir e-posta girin.'
          : (passwordError(password) ?? (password !== confirm ? 'Şifreler eşleşmiyor.' : null));
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUp(fullName, email, password);
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Öğretmen Kaydı"
      subtitle="Öğrencilerinizi, derslerinizi ve velilerinizi tek yerden yönetin"
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
          <Link href="/login" style={styles.link}>
            Giriş yapın
          </Link>
        </View>
      }
    >
      <TextField label="Ad Soyad" icon="person-outline" value={fullName} onChangeText={setFullName} maxLength={200} />
      <TextField
        label="E-posta"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        maxLength={200}
      />
      <TextField label="Şifre" icon="lock-closed-outline" value={password} onChangeText={setPassword} secure maxLength={100} />
      <TextField
        label="Şifre (tekrar)"
        icon="lock-closed-outline"
        value={confirm}
        onChangeText={setConfirm}
        secure
        maxLength={100}
        onSubmitEditing={submit}
      />

      <PasswordRules password={password} confirm={confirm} />

      <FormError message={error} />
      <AppButton title="Hesap oluştur" icon="person-add-outline" onPress={submit} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', gap: 4 },
  footerText: { fontSize: 14, color: colors.muted },
  link: { fontSize: 15, fontWeight: '700', color: colors.primary, padding: 4 },
});
