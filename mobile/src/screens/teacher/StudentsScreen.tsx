import { useRouter } from 'expo-router';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Chip from '../../components/Chip';
import Fab from '../../components/Fab';
import SearchBar from '../../components/SearchBar';
import StateView from '../../components/StateView';
import StudentFormModal from '../../components/StudentFormModal';
import StudentListItem from '../../components/StudentListItem';
import { colors } from '../../components/theme';
import { createStudent, getStudents } from '../../services/api';
import { useApi } from '../../services/useApi';
import { StudentInput } from '../../types/student';

export default function StudentsScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useApi(getStudents);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  // Yazarken klavye takılmasın: filtreleme, yazma işinden sonra (ertelenmiş) yapılır.
  const deferredSearch = useDeferredValue(search);

  const students = useMemo(() => data ?? [], [data]);
  const grades = useMemo(() => [...new Set(students.map((s) => s.gradeLevel))].sort((a, b) => a - b), [students]);

  // Arama istemci tarafında; Türkçe büyük/küçük harf duyarsız.
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLocaleLowerCase('tr-TR');
    return students.filter(
      (s) =>
        (grade === null || s.gradeLevel === grade) &&
        (!q || `${s.firstName} ${s.lastName}`.toLocaleLowerCase('tr-TR').includes(q)),
    );
  }, [students, deferredSearch, grade]);

  const openStudent = useCallback((id: number) => router.push(`/student/${id}`), [router]);

  const add = async (input: StudentInput) => {
    const created = await createStudent(input);
    await reload();
    router.push(`/student/${created.id}`);
  };

  if (loading) return <StateView kind="loading" />;
  if (error && !data) return <StateView kind="error" message={error} onRetry={reload} />;

  return (
    <View style={styles.screen}>
      {students.length > 0 && (
        <View style={styles.filters}>
          <SearchBar value={search} onChange={setSearch} placeholder="Öğrenci ara" />
          {grades.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="Tümü" active={grade === null} onPress={() => setGrade(null)} />
              {grades.map((g) => (
                <Chip key={g} label={`${g}. sınıf`} active={grade === g} onPress={() => setGrade(g)} />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          students.length === 0 ? (
            <StateView
              kind="empty"
              icon="people-outline"
              title="Henüz öğrenci yok"
              message="İlk öğrencinizi ekleyerek başlayın."
              actionTitle="Öğrenci ekle"
              onAction={() => setAdding(true)}
            />
          ) : (
            <StateView kind="empty" icon="search-outline" title="Sonuç bulunamadı" message="Aramanızı değiştirmeyi deneyin." />
          )
        }
        renderItem={({ item }) => <StudentListItem student={item} onPress={openStudent} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />

      <Fab onPress={() => setAdding(true)} />
      <StudentFormModal visible={adding} onClose={() => setAdding(false)} onSubmit={add} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filters: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  chips: { gap: 8 },
  list: { padding: 16, gap: 12, paddingBottom: 100, flexGrow: 1 },
});
