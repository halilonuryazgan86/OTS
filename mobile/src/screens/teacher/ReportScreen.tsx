import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from '../../components/Avatar';
import BarRow from '../../components/BarRow';
import Card from '../../components/Card';
import StateView from '../../components/StateView';
import StatusBreakdown from '../../components/StatusBreakdown';
import { colors, percent } from '../../components/theme';
import WeeklyBarChart from '../../components/WeeklyBarChart';
import { getReport } from '../../services/api';
import { useApi } from '../../services/useApi';

const LIST_SIZE = 5;

// "Genel başarı" raporu: durum dağılımı, haftalık gidişat, ders/sınıf bazında başarı, öne çıkan öğrenciler.
export default function ReportScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useApi(getReport);

  if (loading) return <StateView kind="loading" />;
  if (error || !data) return <StateView kind="error" message={error ?? ''} onRetry={reload} />;

  if (data.studentCount === 0 || data.topicCount === 0) {
    return (
      <StateView
        kind="empty"
        icon="bar-chart-outline"
        title="Rapor için veri yok"
        message="Rapor oluşabilmesi için en az bir öğrenci ve konu ekleyin."
      />
    );
  }

  const { totals } = data;
  const possible = data.studentCount * data.topicCount;
  const top = data.students.slice(0, LIST_SIZE);
  // Listeler çakışmasın: en az 2×LIST_SIZE öğrenci yoksa yalnızca en alttakiler (kalanlar) gösterilir.
  const bottom = [...data.students].reverse().slice(0, Math.min(LIST_SIZE, Math.max(0, data.students.length - LIST_SIZE)));

  const studentRow = (s: (typeof data.students)[number]) => (
    <BarRow
      key={s.id}
      title={s.name}
      subtitle={`${s.gradeLevel}. sınıf · ${s.completed}/${s.total}`}
      done={s.completed}
      total={s.total}
      leading={<Avatar name={s.name} size={32} />}
      onPress={() => router.push(`/student/${s.id}`)}
    />
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
    >
      <Card style={styles.gap}>
        <Text style={styles.cardTitle}>Genel başarı</Text>
        <View style={styles.hero}>
          <Text style={styles.heroValue}>%{percent(totals.completed, possible)}</Text>
          <Text style={styles.heroSub}>
            {data.studentCount} öğrenci × {data.topicCount} konu içinde {totals.completed} konu tamamlandı
          </Text>
        </View>
        <StatusBreakdown {...totals} />
      </Card>

      <Card style={styles.gap}>
        <Text style={styles.cardTitle}>Haftalık tamamlanan konular</Text>
        <Text style={styles.sub}>Son 8 hafta</Text>
        <WeeklyBarChart weeks={data.weeks} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Ders bazında başarı</Text>
        {data.courses.map((c) => (
          <BarRow
            key={c.id}
            title={c.name}
            subtitle={`${c.topicCount} konu`}
            done={c.completed}
            total={c.possible}
            onPress={() => router.push(`/course/${c.id}`)}
          />
        ))}
      </Card>

      {data.grades.length > 1 && (
        <Card>
          <Text style={styles.cardTitle}>Sınıf bazında başarı</Text>
          {data.grades.map((g) => (
            <BarRow
              key={g.gradeLevel}
              title={`${g.gradeLevel}. sınıf`}
              subtitle={`${g.studentCount} öğrenci`}
              done={g.completed}
              total={g.possible}
            />
          ))}
        </Card>
      )}

      <Card>
        <Text style={styles.cardTitle}>En yüksek ilerleme</Text>
        {top.map(studentRow)}
      </Card>

      {bottom.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Desteğe ihtiyaç duyabilecekler</Text>
          <Text style={styles.sub}>En az konu tamamlayan öğrenciler</Text>
          {bottom.map(studentRow)}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  gap: { gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.muted, marginTop: -8 },
  hero: { gap: 2 },
  heroValue: { fontSize: 40, fontWeight: '800', color: colors.text },
  heroSub: { fontSize: 14, color: colors.muted },
});
