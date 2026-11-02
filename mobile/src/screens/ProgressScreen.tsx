import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import ProgressItem from '../components/ProgressItem';
import { errorMessage, getProgress, getStudents, updateProgress } from '../services/api';
import { Progress, ProgressStatus } from '../types/course';
import { Student } from '../types/student';

export default function ProgressScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [items, setItems] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getStudents();
      setStudents(list);
      setSelectedId((id) => (id && list.some((s) => s.id === id) ? id : (list[0]?.id ?? null)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProgress = useCallback(async (studentId: number) => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getProgress(studentId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (selectedId) loadProgress(selectedId);
    else setItems([]);
  }, [selectedId, loadProgress]);

  const sections = useMemo(() => {
    const map = new Map<string, Progress[]>();
    for (const p of items) map.set(p.courseName, [...(map.get(p.courseName) ?? []), p]);
    return [...map].map(([title, data]) => ({ title, data }));
  }, [items]);

  const change = async (item: Progress, status: ProgressStatus) => {
    if (!selectedId) return;
    try {
      const updated = await updateProgress(selectedId, item.topicId, status, item.note);
      setItems((list) => list.map((p) => (p.topicId === updated.topicId ? updated : p)));
    } catch (e) {
      Alert.alert('Güncellenemedi', errorMessage(e));
    }
  };

  const retry = () => (selectedId ? loadProgress(selectedId) : loadStudents());

  return (
    <View style={styles.flex}>
      <Text style={styles.title}>İlerleme</Text>

      <FlatList
        horizontal
        data={students}
        keyExtractor={(s) => String(s.id)}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, item.id === selectedId && styles.chipActive]}
            onPress={() => setSelectedId(item.id)}
          >
            <Text style={item.id === selectedId ? styles.chipTextActive : undefined}>
              {item.firstName} {item.lastName}
            </Text>
          </Pressable>
        )}
      />

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Button title="Tekrar dene" onPress={retry} />
        </View>
      ) : !selectedId ? (
        <Text style={styles.empty}>Önce öğrenci ekleyin.</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(p) => String(p.topicId)}
          refreshing={loading}
          onRefresh={retry}
          ListEmptyComponent={<Text style={styles.empty}>Henüz konu yok. Dersler sekmesinden ekleyin.</Text>}
          renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
          renderItem={({ item }) => <ProgressItem item={item} onChange={change} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', padding: 16 },
  chips: { flexGrow: 0, marginBottom: 8 },
  chipsContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  section: { backgroundColor: '#f3f4f6', paddingVertical: 6, paddingHorizontal: 16, fontWeight: '600' },
  center: { marginTop: 32, alignItems: 'center', gap: 8 },
  error: { color: '#c0392b', textAlign: 'center', paddingHorizontal: 16 },
  empty: { textAlign: 'center', marginTop: 32, color: '#888' },
});
