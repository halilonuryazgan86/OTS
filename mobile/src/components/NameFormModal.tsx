import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { errorMessage } from '../services/api';
import AppButton from './AppButton';
import FormModal from './FormModal';
import TextField from './TextField';

type Props = {
  visible: boolean;
  title: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  initial?: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

// Tek alanlı ad formu (ders ve konu ekleme/düzenleme).
export default function NameFormModal({ visible, title, label, icon, initial, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setName(initial ?? '');
  }, [visible, initial]);

  const submit = async () => {
    if (!name.trim()) return Alert.alert('Eksik bilgi', `${label} zorunlu.`);
    setSaving(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (e) {
      Alert.alert('Kaydedilemedi', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal visible={visible} title={title} onClose={onClose}>
      <TextField label={label} icon={icon} value={name} onChangeText={setName} maxLength={200} autoFocus />
      <AppButton title="Kaydet" icon="checkmark" onPress={submit} loading={saving} />
    </FormModal>
  );
}
