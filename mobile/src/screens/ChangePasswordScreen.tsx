import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import AppButton from '../components/AppButton';
import AuthLayout from '../components/AuthLayout';
import FormError from '../components/FormError';
import PasswordRules from '../components/PasswordRules';
import TextField from '../components/TextField';
import { colors } from '../components/theme';
import { errorMessage } from '../services/api';
import { useAuth } from '../services/auth';
import { passwordError } from '../services/validation';

// Zorunlu şifre değiştirme: öğretmenin belirlediği geçici şifreyle giren veli, devam etmeden yeni şifre belirler.
export default function ChangePasswordScreen() {
  const { user, changePassword, signOut } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const problem = !current
      ? 'Size verilen geçici şifreyi girin.'
      : (passwordError(next) ??
        (next !== confirm ? 'Yeni şifreler eşleşmiyor.' : next === current ? 'Yeni şifre geçici şifreyle aynı olamaz.' : null));
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await changePassword(current, next);
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Yeni şifre belirleyin"
      subtitle={`Hoş geldiniz${user ? `, ${user.fullName.split(' ')[0]}` : ''}`}
      footer={
        <Pressable onPress={() => void signOut()} style={styles.footer}>
          <Text style={styles.link}>Çıkış yap</Text>
        </Pressable>
      }
    >
      <Text style={styles.info}>
        Hesabınızın şifresi öğretmeniniz tarafından belirlendi. Güvenliğiniz için devam etmeden önce yalnızca sizin
        bildiğiniz yeni bir şifre belirleyin.
      </Text>
      <TextField label="Geçici şifre" icon="lock-closed-outline" value={current} onChangeText={setCurrent} secure />
      <TextField label="Yeni şifre" icon="key-outline" value={next} onChangeText={setNext} secure maxLength={100} />
      <TextField
        label="Yeni şifre (tekrar)"
        icon="key-outline"
        value={confirm}
        onChangeText={setConfirm}
        secure
        maxLength={100}
        onSubmitEditing={submit}
      />
      <PasswordRules password={next} confirm={confirm} />
      <FormError message={error} />
      <AppButton title="Şifreyi kaydet ve devam et" icon="checkmark" onPress={submit} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  info: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  footer: { alignItems: 'center', padding: 8 },
  link: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
