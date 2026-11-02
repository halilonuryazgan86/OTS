import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import Card from '../../components/Card';
import CourseProgressCard, { groupByCourse, OPEN_COURSE_LIMIT } from '../../components/CourseProgressCard';
import ProgressBar from '../../components/ProgressBar';
import ProgressSummary from '../../components/ProgressSummary';
import StateView from '../../components/StateView';
import { colors } from '../../components/theme';
import TopicDetailModal from '../../components/TopicDetailModal';
import { getChildren, getProgress } from '../../services/api';
import { useApi } from '../../services/useApi';
import { Progress } from '../../types/course';

// Velinin çocuğunun ders bazında ilerlemesi. Durumu öğretmen belirler; veli konulara yorum yazabilir.
export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const childId = Number(id);
  const { data, setData, loading, refreshing, error, reload, refresh } = useApi(() =>
    Promise.all([getChildren(), getProgress(childId)]),
  );
  const [selected, setSelected] = useState<Progress | null>(null);

  if (loading) return <StateView kind="loading" />;
  if (error || !data) return <StateView kind="error" message={error ?? ''} onRetry={reload} />;

  const [children, progress] = data;
  const child = children.find((c) => c.id === childId);
  const name = child ? `${child.firstName} ${child.lastName}` : 'Öğrenci';
  const done = progress.filter((p) => p.status === 'Completed').length;
  const groups = groupByCourse(progress);

  const commentsChanged = (topicId: number, commentCount: number, lastComment: string | null) =>
    setData([children, progress.map((p) => (p.topicId === topicId ? { ...p, commentCount, lastComment } : p))]);

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      >
        <Card style={styles.gap}>
          <Text style={styles.title}>Genel ilerleme</Text>
          <Text style={styles.meta}>
            {done} / {progress.length} konu tamamlandı
          </Text>
          <ProgressBar done={done} total={progress.length} />
        </Card>

        {progress.length > 0 && <ProgressSummary items={progress} />}

        {groups.length === 0 ? (
          <StateView kind="empty" icon="book-outline" title="Henüz ders yok" message="Öğretmen ders eklediğinde burada görünecek." />
        ) : (
          <>
            <Text style={styles.hint}>Öğretmenin yorumlarını görmek ve yorum yazmak için bir konuya dokunun.</Text>
            {groups.map((g) => (
              <CourseProgressCard
                key={g.courseId}
                courseName={g.courseName}
                items={g.items}
                onPressTopic={setSelected}
                initiallyOpen={groups.length <= OPEN_COURSE_LIMIT}
              />
            ))}
          </>
        )}
      </ScrollView>

      <TopicDetailModal
        studentId={childId}
        item={selected}
        editable={false}
        onClose={() => setSelected(null)}
        onCommentsChanged={commentsChanged}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40, flexGrow: 1 },
  gap: { gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  hint: { fontSize: 13, color: colors.muted },
});
