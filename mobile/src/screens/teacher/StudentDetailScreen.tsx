import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import CourseProgressCard, { groupByCourse, OPEN_COURSE_LIMIT } from '../../components/CourseProgressCard';
import ParentFormModal from '../../components/ParentFormModal';
import PasswordFormModal from '../../components/PasswordFormModal';
import ProgressBar from '../../components/ProgressBar';
import TopicDetailModal from '../../components/TopicDetailModal';
import ProgressSummary from '../../components/ProgressSummary';
import StateView from '../../components/StateView';
import StudentFormModal from '../../components/StudentFormModal';
import { colors } from '../../components/theme';
import {
  addParent,
  deleteStudent,
  errorMessage,
  getProgress,
  getStudent,
  removeParent,
  resetParentPassword,
  updateProgress,
  updateStudent,
} from '../../services/api';
import { useApi } from '../../services/useApi';
import { Progress } from '../../types/course';
import { Parent } from '../../types/student';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);
  const router = useRouter();
  const { data, setData, loading, refreshing, error, reload, refresh } = useApi(() =>
    Promise.all([getStudent(studentId), getProgress(studentId)]),
  );

  const [editing, setEditing] = useState(false);
  const [addingParent, setAddingParent] = useState(false);
  const [resetFor, setResetFor] = useState<Parent | null>(null);
  const [progressItem, setProgressItem] = useState<Progress | null>(null);

  if (loading) return <StateView kind="loading" />;
  if (error || !data) return <StateView kind="error" message={error ?? ''} onRetry={reload} />;

  const [student, progress] = data;
  const name = `${student.firstName} ${student.lastName}`;
  const groups = groupByCourse(progress);

  const confirmDelete = () =>
    Alert.alert('Öğrenciyi sil', `${name} ve tüm ilerleme kayıtları silinecek. Emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudent(studentId);
            router.back();
          } catch (e) {
            Alert.alert('Silinemedi', errorMessage(e));
          }
        },
      },
    ]);

  const confirmRemoveParent = (p: Parent) =>
    Alert.alert('Veliyi kaldır', `${p.fullName} artık ${name} bilgilerini göremeyecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeParent(studentId, p.id);
            await reload();
          } catch (e) {
            Alert.alert('Kaldırılamadı', errorMessage(e));
          }
        },
      },
    ]);

  const saveProgress = async (status: Progress['status'], date: Date | null) => {
    const updated = await updateProgress(studentId, progressItem!.topicId, status, date);
    const items = progress.map((p) => (p.topicId === updated.topicId ? updated : p));
    const completed = items.filter((p) => p.status === 'Completed').length;
    setData([{ ...student, completedTopics: completed }, items]);
    setProgressItem(updated);
  };

  // Yorum eklenip silinince listedeki sayaç ve son yorum önizlemesi güncellenir.
  const commentsChanged = (topicId: number, commentCount: number, lastComment: string | null) =>
    setData([student, progress.map((p) => (p.topicId === topicId ? { ...p, commentCount, lastComment } : p))]);

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      >
        <Card style={styles.profile}>
          <Avatar name={name} size={72} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {student.gradeLevel}. sınıf{student.email ? ` · ${student.email}` : ''}
          </Text>
          <View style={styles.fullWidth}>
            <ProgressBar done={student.completedTopics} total={student.totalTopics} />
          </View>
          <View style={styles.actions}>
            <AppButton title="Düzenle" icon="create-outline" variant="secondary" small onPress={() => setEditing(true)} />
            <AppButton title="Sil" icon="trash-outline" variant="danger" small onPress={confirmDelete} />
          </View>
        </Card>

        {progress.length > 0 && <ProgressSummary items={progress} />}

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veliler</Text>
            <AppButton title="Ekle" icon="person-add-outline" variant="secondary" small onPress={() => setAddingParent(true)} />
          </View>
          {student.parents.length === 0 ? (
            <Text style={styles.meta}>Henüz veli eklenmedi. Veli hesabı oluşturarak ilerlemeyi veliyle paylaşın.</Text>
          ) : (
            student.parents.map((p) => (
              <View key={p.id} style={styles.parent}>
                <Avatar name={p.fullName} size={36} />
                <View style={styles.flex}>
                  <Text style={styles.parentName}>{p.fullName}</Text>
                  <Text style={styles.meta}>{p.email}</Text>
                </View>
                <Pressable onPress={() => setResetFor(p)} hitSlop={8} style={styles.iconBtn}>
                  <Ionicons name="key-outline" size={20} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => confirmRemoveParent(p)} hitSlop={8} style={styles.iconBtn}>
                  <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                </Pressable>
              </View>
            ))
          )}
        </Card>

        <Text style={styles.heading}>Ders ilerlemesi</Text>
        {groups.length === 0 ? (
          <Card>
            <Text style={styles.meta}>Henüz ders veya konu yok. Dersler sekmesinden ekleyebilirsiniz.</Text>
          </Card>
        ) : (
          <>
            <Text style={styles.hint}>Durumu, tarih-saati güncellemek veya veliyle yorumlaşmak için bir konuya dokunun.</Text>
            {groups.map((g) => (
              <CourseProgressCard
                key={g.courseId}
                courseName={g.courseName}
                items={g.items}
                onPressTopic={setProgressItem}
                initiallyOpen={groups.length <= OPEN_COURSE_LIMIT}
              />
            ))}
          </>
        )}
      </ScrollView>

      <StudentFormModal
        visible={editing}
        initial={student}
        onClose={() => setEditing(false)}
        onSubmit={async (input) => {
          await updateStudent(studentId, input);
          await reload();
        }}
      />
      <ParentFormModal
        visible={addingParent}
        studentName={name}
        onClose={() => setAddingParent(false)}
        onSubmit={async (input) => {
          const result = await addParent(studentId, input);
          await reload();
          return result;
        }}
      />
      <PasswordFormModal
        visible={resetFor !== null}
        title="Veli şifresini yenile"
        description={`${resetFor?.fullName} için geçici bir şifre belirleyip veliye iletin. Hesap kilitliyse kilit kalkar; veli ilk girişte kendi şifresini belirlemek zorunda olur.`}
        requireCurrent={false}
        onClose={() => setResetFor(null)}
        onSubmit={(pw) => resetParentPassword(studentId, resetFor!.id, pw)}
      />
      <TopicDetailModal
        studentId={studentId}
        item={progressItem}
        editable
        onClose={() => setProgressItem(null)}
        onSave={saveProgress}
        onCommentsChanged={commentsChanged}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  profile: { alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  meta: { fontSize: 14, color: colors.muted },
  fullWidth: { alignSelf: 'stretch', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  parent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  parentName: { fontSize: 15, fontWeight: '600', color: colors.text },
  iconBtn: { padding: 4 },
  flex: { flex: 1 },
  heading: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  hint: { fontSize: 13, color: colors.muted, marginTop: -8 },
});
