import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import StateView from '../../components/StateView';
import { colors } from '../../components/theme';
import { getChildren } from '../../services/api';
import { useAuth } from '../../services/auth';
import { useApi } from '../../services/useApi';

export default function ChildrenScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useApi(getChildren);

  if (loading) return <StateView kind="loading" />;
  if (error && !data) return <StateView kind="error" message={error} onRetry={reload} />;

  return (
    <FlatList
      style={styles.screen}
      data={data ?? []}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.hello}>Merhaba, {user?.fullName.split(' ')[0]} 👋</Text>
          <Text style={styles.sub}>Çocuğunuzun derslerdeki ilerlemesini buradan takip edebilirsiniz.</Text>
        </View>
      }
      ListEmptyComponent={
        <StateView
          kind="empty"
          icon="people-outline"
          title="Bağlı öğrenci yok"
          message="Hesabınıza henüz bir öğrenci bağlanmamış. Lütfen öğretmenle iletişime geçin."
        />
      }
      renderItem={({ item }) => {
        const name = `${item.firstName} ${item.lastName}`;
        return (
          <Card onPress={() => router.push(`/child/${item.id}`)} style={styles.card}>
            <View style={styles.row}>
              <Avatar name={name} size={56} />
              <View style={styles.flex}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.meta}>{item.gradeLevel}. sınıf</Text>
                {item.teacherName && (
                  <Text style={styles.meta}>
                    <Ionicons name="school-outline" size={13} color={colors.muted} /> {item.teacherName}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
            </View>
            <View style={styles.gap}>
              <Text style={styles.meta}>
                {item.completedTopics} / {item.totalTopics} konu tamamlandı
              </Text>
              <ProgressBar done={item.completedTopics} total={item.totalTopics} />
            </View>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  header: { marginBottom: 4, gap: 4 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  card: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flex: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  gap: { gap: 6 },
});
