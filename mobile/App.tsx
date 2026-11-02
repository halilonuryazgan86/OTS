import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet } from 'react-native';
import TabBar from './src/components/TabBar';
import CoursesScreen from './src/screens/CoursesScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import StudentsScreen from './src/screens/StudentsScreen';

type Tab = 'students' | 'courses' | 'progress';

const TABS: { key: Tab; title: string }[] = [
  { key: 'students', title: 'Öğrenciler' },
  { key: 'courses', title: 'Dersler' },
  { key: 'progress', title: 'İlerleme' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('students');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        {tab === 'students' && <StudentsScreen />}
        {tab === 'courses' && <CoursesScreen />}
        {tab === 'progress' && <ProgressScreen />}
      </KeyboardAvoidingView>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 32 : 0 },
});
