import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../services/api';
import { EMAIL_RE, PASSWORD_HINT, passwordError } from '../services/validation';
import { AddParentResult, ParentInput } from '../types/student';
import AppButton from './AppButton';
import FormModal from './FormModal';
import TextField from './TextField';
import { colors, radius } from './theme';

type Props = {
  visible: boolean;
  studentName: string;
  onClose: () => void;
  onSubmit: (input: ParentInput) => Promise<AddParentResult>;
};

// Veli ekleme: yeni hesap oluşturur ya da (kardeş durumunda) mevcut veli hesabını bu öğrenciye de bağlar.
export default function ParentFormModal({ visible, studentName, onClose, onSubmit }: Props) {
  const [existing, setExisting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setExisting(false);
      setFullName('');
      setEmail('');
      setPassword('');
    }
  }, [visible]);

  const submit = async () => {
    const error = !EMAIL_RE.test(email.trim())
      ? 'Geçerli bir e-posta girin.'
      : existing
        ? null
        : !fullName.trim()
          ? 'Veli adı zorunlu.'
          : passwordError(password);
    if (error) return Alert.alert('Eksik bilgi', error);

    setSaving(true);
    try {
      const result = await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        password: existing ? null : password,
      });
      onClose();
      if (result.linkedExisting) {
        Alert.alert(
          'Mevcut veli bağlandı',
          `${result.fullName} zaten kayıtlı bir veli. Hesabı ${studentName} için de bağlandı; mevcut şifresiyle giriş yapıp tüm çocuklarını görebilir.`,
        );
      }
    } catch (e) {
      Alert.alert('Veli eklenemedi', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal visible={visible} title="Veli ekle" onClose={onClose}>
      <View style={styles.toggle}>
        <ToggleOption label="Yeni veli" icon="person-add-outline" active={!existing} onPress={() => setExisting(false)} />
        <ToggleOption label="Kayıtlı veli (kardeş)" icon="people-outline" active={existing} onPress={() => setExisting(true)} />
      </View>

      <Text style={styles.info}>
        {existing
          ? `Velinin başka bir çocuğu zaten kayıtlıysa e-postasını girin; aynı hesap ${studentName} için de bağlanır. Veli tek girişle tüm çocuklarını görür.`
          : `${studentName} için yeni bir veli hesabı oluşturulur. Belirlediğiniz geçici şifreyi veliye iletin; veli ilk girişte kendi şifresini belirler ve yalnızca kendi çocuklarının ilerlemesini görebilir.`}
      </Text>

      {!existing && (
        <TextField label="Ad Soyad" icon="person-outline" value={fullName} onChangeText={setFullName} maxLength={200} />
      )}
      <TextField
        label="E-posta"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        maxLength={200}
      />
      {!existing && (
        <TextField
          label={`Geçici şifre (${PASSWORD_HINT.toLocaleLowerCase('tr-TR')})`}
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secure
          maxLength={100}
        />
      )}
      <AppButton
        title={existing ? 'Veliyi bağla' : 'Veliyi ekle'}
        icon={existing ? 'link-outline' : 'person-add-outline'}
        onPress={submit}
        loading={saving}
      />
    </FormModal>
  );
}

function ToggleOption({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active && styles.optionActive]}>
      <Ionicons name={icon} size={18} color={active ? colors.primary : colors.muted} />
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  optionTextActive: { color: colors.primary },
  info: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
