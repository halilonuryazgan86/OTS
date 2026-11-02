import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import CourseListItem from '../../components/CourseListItem';
import Fab from '../../components/Fab';
import NameFormModal from '../../components/NameFormModal';
import StateView from '../../components/StateView';
import { colors } from '../../components/theme';
import { createCourse, getCourses } from '../../services/api';
import { useApi } from '../../services/useApi';

export default function CoursesScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useApi(getCourses);
  const [adding, setAdding] = useState(false);
  const openCourse = useCallback((id: number) => router.push(`/course/${id}`), [router]);

  if (loading) return <StateView kind="loading" />;
  if (error && !data) return <StateView kind="error" message={error} onRetry={reload} />;

  const add = async (name: string) => {
    const created = await createCourse(name);
    await reload();
    router.push(`/course/${created.id}`);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={data ?? []}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <StateView
            kind="empty"
            icon="book-outline"
            title="Henüz ders yok"
            message="Ders ekleyip konularını tanımlayın; öğrencilerin ilerlemesi bu konular üzerinden takip edilir."
            actionTitle="Ders ekle"
            onAction={() => setAdding(true)}
          />
        }
        renderItem={({ item }) => <CourseListItem course={item} onPress={openCourse} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
      <Fab onPress={() => setAdding(true)} />
      <NameFormModal
        visible={adding}
        title="Yeni ders"
        label="Ders adı"
        icon="book-outline"
        onClose={() => setAdding(false)}
        onSubmit={add}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12, paddingBottom: 100, flexGrow: 1 },
});
