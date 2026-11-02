import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import StudentForm from '../components/StudentForm';
import StudentListItem from '../components/StudentListItem';
import { createStudent, deleteStudent, errorMessage, getStudents } from '../services/api';
import { Student, StudentInput } from '../types/student';

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudents(await getStudents());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (input: StudentInput) => {
    try {
      await createStudent(input);
      await load();
      return true;
    } catch (e) {
      Alert.alert('Kaydedilemedi', errorMessage(e));
      return false;
    }
  };

  const remove = (s: Student) =>
    Alert.alert('Sil', `${s.firstName} ${s.lastName} silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudent(s.id);
            await load();
          } catch (e) {
            Alert.alert('Silinemedi', errorMessage(e));
          }
        },
      },
    ]);

  return (
    <View style={styles.flex}>
      <Text style={styles.title}>Öğrenciler</Text>
      <StudentForm onSubmit={add} />

      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Button title="Tekrar dene" onPress={load} />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => String(s.id)}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={<Text style={styles.empty}>Henüz öğrenci yok.</Text>}
          renderItem={({ item }) => <StudentListItem student={item} onDelete={remove} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', padding: 16 },
  center: { marginTop: 32, alignItems: 'center', gap: 8 },
  error: { color: '#c0392b', textAlign: 'center', paddingHorizontal: 16 },
  empty: { textAlign: 'center', marginTop: 32, color: '#888' },
});
