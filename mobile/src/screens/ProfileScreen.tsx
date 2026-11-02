import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import PasswordFormModal from '../components/PasswordFormModal';
import { colors } from '../components/theme';
import { useAuth } from '../services/auth';

// Öğretmen ve veli için ortak profil ekranı.
export default function ProfileScreen() {
  const { user, signOut, changePassword } = useAuth();
  const [changing, setChanging] = useState(false);

  if (!user) return null;

  const confirmSignOut = () =>
    Alert.alert('Çıkış yap', 'Hesabınızdan çıkış yapılsın mı?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.profile}>
        <Avatar name={user.fullName} size={80} />
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.role}>
          <Ionicons name={user.role === 'Teacher' ? 'school-outline' : 'people-outline'} size={14} color={colors.primary} />
          <Text style={styles.roleText}>{user.role === 'Teacher' ? 'Öğretmen' : 'Veli'}</Text>
        </View>
      </Card>

      <Card style={styles.menu}>
        <MenuItem icon="key-outline" label="Şifremi değiştir" onPress={() => setChanging(true)} />
        <MenuItem icon="log-out-outline" label="Çıkış yap" danger onPress={confirmSignOut} />
      </Card>

      <PasswordFormModal
        visible={changing}
        title="Şifremi değiştir"
        requireCurrent
        onClose={() => setChanging(false)}
        onSubmit={(next, current) => changePassword(current, next)}
      />
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      <Text style={[styles.itemText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.neutral} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16 },
  profile: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  email: { fontSize: 14, color: colors.muted },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 4,
  },
  roleText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  menu: { paddingVertical: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  pressed: { opacity: 0.6 },
  itemText: { flex: 1, fontSize: 16, fontWeight: '500' },
});
