import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createStudent, deleteStudent, getStudents, Student } from './src/api';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStudents(await getStudents());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    try {
      await createStudent({
        firstName,
        lastName,
        email: null,
        gradeLevel: Number(gradeLevel),
      });
      setFirstName('');
      setLastName('');
      setGradeLevel('');
      await load();
    } catch (e) {
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : 'Bilinmeyen hata');
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
            Alert.alert('Silinemedi', e instanceof Error ? e.message : 'Bilinmeyen hata');
          }
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Text style={styles.title}>Öğrenciler</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Ad" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Soyad" value={lastName} onChangeText={setLastName} />
          <TextInput
            style={styles.input}
            placeholder="Sınıf (1-12)"
            keyboardType="number-pad"
            value={gradeLevel}
            onChangeText={setGradeLevel}
          />
          <Button title="Ekle" onPress={add} />
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
            data={students}
            keyExtractor={(s) => String(s.id)}
            refreshing={loading}
            onRefresh={load}
            ListEmptyComponent={<Text style={styles.empty}>Henüz öğrenci yok.</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.name}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.grade}>{item.gradeLevel}. sınıf</Text>
                </View>
                <Button title="Sil" color="#c0392b" onPress={() => remove(item)} />
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 32 : 0 },
  title: { fontSize: 24, fontWeight: '700', padding: 16 },
  form: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10 },
  center: { marginTop: 32, alignItems: 'center', gap: 8 },
  error: { color: '#c0392b', textAlign: 'center', paddingHorizontal: 16 },
  empty: { textAlign: 'center', marginTop: 32, color: '#888' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  name: { fontSize: 16, fontWeight: '600' },
  grade: { color: '#666', marginTop: 2 },
});
