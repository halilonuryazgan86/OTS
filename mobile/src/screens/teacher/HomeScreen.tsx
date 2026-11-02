import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import ActivityItem from '../../components/ActivityItem';
import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import StatCard from '../../components/StatCard';
import StateView from '../../components/StateView';
import { APP_BUILD, colors, percent } from '../../components/theme';
import { getDashboard } from '../../services/api';
import { useAuth } from '../../services/auth';
import { useApi } from '../../services/useApi';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useApi(getDashboard);

  if (loading) return <StateView kind="loading" />;
  if (error || !data) return <StateView kind="error" message={error ?? ''} onRetry={reload} />;

  // Genel tamamlama: tamamlanan konu kayıtları / (öğrenci × konu).
  const possible = data.studentCount * data.topicCount;
  const firstName = user?.fullName.split(' ')[0];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
    >
      <View>
        <Text style={styles.hello}>Merhaba, {firstName} 👋</Text>
        <Text style={styles.sub}>Sınıfınızın güncel durumu · Sürüm {APP_BUILD}</Text>
      </View>

      <View style={styles.grid}>
        <StatCard
          icon="people"
          label="Öğrenci"
          value={data.studentCount}
          color="#6366F1"
          onPress={() => router.push('/students')}
        />
        <StatCard icon="book" label="Ders" value={data.courseCount} color="#0EA5E9" onPress={() => router.push('/courses')} />
        <StatCard icon="list" label="Konu" value={data.topicCount} color="#F59E0B" onPress={() => router.push('/courses')} />
        <StatCard
          icon="trophy"
          label="Genel başarı (rapor)"
          value={`%${percent(data.completedCount, possible)}`}
          color="#16A34A"
          onPress={() => router.push('/report')}
        />
      </View>

      <Card style={styles.gap} onPress={() => router.push('/report')}>
        <Text style={styles.cardTitle}>Sınıf ilerlemesi</Text>
        <Text style={styles.sub}>
          {data.completedCount} / {possible} konu tamamlandı
        </Text>
        <ProgressBar done={data.completedCount} total={possible} />
      </Card>

      {(data.studentCount === 0 || data.courseCount === 0) && (
        <Card style={styles.gap}>
          <Text style={styles.cardTitle}>Başlarken</Text>
          <Text style={styles.sub}>Önce derslerinizi ve konularını, ardından öğrencilerinizi ekleyin.</Text>
          <View style={styles.actions}>
            <AppButton title="Ders ekle" icon="book-outline" variant="secondary" small onPress={() => router.push('/courses')} />
            <AppButton title="Öğrenci ekle" icon="person-add-outline" variant="secondary" small onPress={() => router.push('/students')} />
          </View>
        </Card>
      )}

      <Card>
        <Text style={styles.cardTitle}>Son güncellemeler ve veli yorumları</Text>
        {data.recentActivity.length === 0 ? (
          <Text style={[styles.sub, styles.empty]}>Henüz ilerleme kaydı yok.</Text>
        ) : (
          data.recentActivity.map((a, i) => (
            <ActivityItem
              key={`${a.kind}-${a.studentId}-${a.topicId}-${a.date}-${i}`}
              item={a}
              onPress={() => router.push(`/student/${a.studentId}`)}
            />
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gap: { gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  empty: { paddingVertical: 12 },
});
