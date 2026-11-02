import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';
import { StudentInput } from '../types/student';

type Props = {
  onSubmit: (input: StudentInput) => Promise<boolean>;
};

function validate(firstName: string, lastName: string, gradeLevel: string): string | null {
  if (!firstName.trim()) return 'Ad zorunlu.';
  if (!lastName.trim()) return 'Soyad zorunlu.';
  const grade = Number(gradeLevel);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) return 'Sınıf 1 ile 12 arasında olmalı.';
  return null;
}

export default function StudentForm({ onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const error = validate(firstName, lastName, gradeLevel);
    if (error) {
      Alert.alert('Eksik bilgi', error);
      return;
    }

    setSaving(true);
    const ok = await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: null,
      gradeLevel: Number(gradeLevel),
    });
    setSaving(false);

    if (ok) {
      setFirstName('');
      setLastName('');
      setGradeLevel('');
    }
  };

  return (
    <View style={styles.form}>
      <TextInput style={styles.input} placeholder="Ad" maxLength={100} value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Soyad" maxLength={100} value={lastName} onChangeText={setLastName} />
      <TextInput
        style={styles.input}
        placeholder="Sınıf (1-12)"
        keyboardType="number-pad"
        maxLength={2}
        value={gradeLevel}
        onChangeText={setGradeLevel}
      />
      <Button title={saving ? 'Kaydediliyor...' : 'Ekle'} onPress={submit} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10 },
});
