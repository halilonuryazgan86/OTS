import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { errorMessage } from '../services/api';
import { PASSWORD_HINT, passwordError } from '../services/validation';
import AppButton from './AppButton';
import FormModal from './FormModal';
import TextField from './TextField';
import { colors } from './theme';

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  // Kendi şifresini değiştiren kullanıcıdan mevcut şifre istenir; öğretmenin veli şifresini yenilemesinde istenmez.
  requireCurrent: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string, currentPassword: string) => Promise<void>;
};

export default function PasswordFormModal({ visible, title, description, requireCurrent, onClose, onSubmit }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrent('');
      setNext('');
      setConfirm('');
    }
  }, [visible]);

  const submit = async () => {
    const error =
      requireCurrent && !current
        ? 'Mevcut şifrenizi girin.'
        : passwordError(next)
          ? passwordError(next)
          : next !== confirm
            ? 'Yeni şifreler eşleşmiyor.'
            : null;
    if (error) return Alert.alert('Eksik bilgi', error);

    setSaving(true);
    try {
      await onSubmit(next, current);
      onClose();
      Alert.alert('Başarılı', 'Şifre güncellendi.');
    } catch (e) {
      Alert.alert('Şifre güncellenemedi', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal visible={visible} title={title} onClose={onClose}>
      {description && <Text style={styles.info}>{description}</Text>}
      {requireCurrent && (
        <TextField label="Mevcut şifre" icon="lock-closed-outline" value={current} onChangeText={setCurrent} secure />
      )}
      <TextField label="Yeni şifre" icon="key-outline" value={next} onChangeText={setNext} secure maxLength={100} />
      <Text style={styles.info}>{PASSWORD_HINT}</Text>
      <TextField label="Yeni şifre (tekrar)" icon="key-outline" value={confirm} onChangeText={setConfirm} secure maxLength={100} />
      <AppButton title="Şifreyi güncelle" icon="checkmark" onPress={submit} loading={saving} />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  info: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
