import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';

type Props = {
  placeholder: string;
  onSubmit: (name: string) => Promise<boolean>;
};

// Tek alanlı "ad gir + ekle" formu (ders ve konu eklemede kullanılır).
export default function NameInput({ placeholder, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Eksik bilgi', `${placeholder} zorunlu.`);
      return;
    }
    setSaving(true);
    const ok = await onSubmit(name.trim());
    setSaving(false);
    if (ok) setName('');
  };

  return (
    <View style={styles.row}>
      <TextInput style={styles.input} placeholder={placeholder} maxLength={200} value={name} onChangeText={setName} />
      <Button title="Ekle" onPress={submit} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10 },
});
