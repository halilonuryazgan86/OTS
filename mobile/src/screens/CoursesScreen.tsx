import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import CourseCard from '../components/CourseCard';
import NameInput from '../components/NameInput';
import { createCourse, createTopic, deleteCourse, deleteTopic, errorMessage, getCourses } from '../services/api';
import { Course, Topic } from '../types/course';

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await getCourses());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ekleme işlemleri için ortak sarmalayıcı: hata varsa gösterir, başarılıysa listeyi yeniler.
  const run = async (action: () => Promise<unknown>, failTitle: string) => {
    try {
      await action();
      await load();
      return true;
    } catch (e) {
      Alert.alert(failTitle, errorMessage(e));
      return false;
    }
  };

  const confirm = (message: string, action: () => Promise<unknown>) =>
    Alert.alert('Sil', message, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => run(action, 'Silinemedi') },
    ]);

  const addTopic = (course: Course, name: string) => {
    const nextOrder = course.topics.reduce((max, t) => Math.max(max, t.order), 0) + 1;
    return run(() => createTopic(course.id, name, nextOrder), 'Konu eklenemedi');
  };

  const removeCourse = (c: Course) =>
    confirm(`"${c.name}" dersi ve tüm konuları silinsin mi?`, () => deleteCourse(c.id));

  const removeTopic = (t: Topic) => confirm(`"${t.name}" konusu silinsin mi?`, () => deleteTopic(t.id));

  return (
    <View style={styles.flex}>
      <Text style={styles.title}>Dersler</Text>
      <View style={styles.form}>
        <NameInput placeholder="Ders adı" onSubmit={(name) => run(() => createCourse(name), 'Ders eklenemedi')} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Button title="Tekrar dene" onPress={load} />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => String(c.id)}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={<Text style={styles.empty}>Henüz ders yok.</Text>}
          renderItem={({ item }) => (
            <CourseCard course={item} onDelete={removeCourse} onAddTopic={addTopic} onDeleteTopic={removeTopic} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', padding: 16 },
  form: { paddingHorizontal: 16, marginBottom: 12 },
  center: { marginTop: 32, alignItems: 'center', gap: 8 },
  error: { color: '#c0392b', textAlign: 'center', paddingHorizontal: 16 },
  empty: { textAlign: 'center', marginTop: 32, color: '#888' },
});
