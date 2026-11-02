import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../services/api';
import { EMAIL_RE } from '../services/validation';
import { StudentInput } from '../types/student';
import AppButton from './AppButton';
import Chip from './Chip';
import FormModal from './FormModal';
import TextField from './TextField';
import { colors } from './theme';

type Props = {
  visible: boolean;
  initial?: StudentInput;
  onClose: () => void;
  onSubmit: (input: StudentInput) => Promise<void>;
};

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function StudentFormModal({ visible, initial, onClose, onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFirstName(initial?.firstName ?? '');
    setLastName(initial?.lastName ?? '');
    setEmail(initial?.email ?? '');
    setGrade(initial?.gradeLevel ?? null);
  }, [visible, initial]);

  const submit = async () => {
    const error = !firstName.trim()
      ? 'Ad zorunlu.'
      : !lastName.trim()
        ? 'Soyad zorunlu.'
        : grade === null
          ? 'Sınıf seçin.'
          : email.trim() && !EMAIL_RE.test(email.trim())
            ? 'E-posta adresi geçersiz.'
            : null;
    if (error) return Alert.alert('Eksik bilgi', error);

    setSaving(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        gradeLevel: grade!,
      });
      onClose();
    } catch (e) {
      Alert.alert('Kaydedilemedi', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal visible={visible} title={initial ? 'Öğrenciyi düzenle' : 'Yeni öğrenci'} onClose={onClose}>
      <TextField label="Ad" icon="person-outline" value={firstName} onChangeText={setFirstName} maxLength={100} />
      <TextField label="Soyad" icon="person-outline" value={lastName} onChangeText={setLastName} maxLength={100} />
      <TextField
        label="E-posta (isteğe bağlı)"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={200}
      />
      <View style={styles.gradeWrap}>
        <Text style={styles.label}>Sınıf</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grades}>
          {GRADES.map((g) => (
            <Chip key={g} label={`${g}. sınıf`} active={grade === g} onPress={() => setGrade(g)} />
          ))}
        </ScrollView>
      </View>
      <AppButton title="Kaydet" icon="checkmark" onPress={submit} loading={saving} />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  gradeWrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  grades: { gap: 8 },
});
