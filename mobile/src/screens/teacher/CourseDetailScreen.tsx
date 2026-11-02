import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import NameFormModal from '../../components/NameFormModal';
import StateView from '../../components/StateView';
import { colors, radius } from '../../components/theme';
import {
  createTopic,
  deleteCourse,
  deleteTopic,
  errorMessage,
  getCourse,
  updateCourse,
  updateTopic,
} from '../../services/api';
import { useApi } from '../../services/useApi';
import { Topic } from '../../types/course';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = Number(id);
  const router = useRouter();
  const { data: course, loading, refreshing, error, reload, refresh } = useApi(() => getCourse(courseId));

  const [renaming, setRenaming] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <StateView kind="loading" />;
  if (error || !course) return <StateView kind="error" message={error ?? ''} onRetry={reload} />;

  const topics = course.topics;

  const run = async (action: () => Promise<unknown>, failTitle: string) => {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (e) {
      Alert.alert(failTitle, errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // Konuyu bir üst/alt sıraya taşır: iki konunun sırası 1..n olacak şekilde yeniden yazılır.
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= topics.length) return;
    const a = topics[index];
    const b = topics[target];
    run(() => Promise.all([updateTopic(a.id, a.name, target + 1), updateTopic(b.id, b.name, index + 1)]), 'Sıralanamadı');
  };

  const confirmDeleteTopic = (t: Topic) =>
    Alert.alert('Konuyu sil', `"${t.name}" ve bu konudaki tüm öğrenci ilerlemeleri silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => run(() => deleteTopic(t.id), 'Silinemedi') },
    ]);

  const confirmDeleteCourse = () =>
    Alert.alert('Dersi sil', `"${course.name}" dersi, tüm konuları ve ilerleme kayıtları silinecek. Emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCourse(courseId);
            router.back();
          } catch (e) {
            Alert.alert('Silinemedi', errorMessage(e));
          }
        },
      },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: course.name }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      >
        <Card style={styles.header}>
          <View style={styles.bigIcon}>
            <Ionicons name="book" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>{course.name}</Text>
          <Text style={styles.meta}>{topics.length} konu</Text>
          <View style={styles.actions}>
            <AppButton title="Yeniden adlandır" icon="create-outline" variant="secondary" small onPress={() => setRenaming(true)} />
            <AppButton title="Sil" icon="trash-outline" variant="danger" small onPress={confirmDeleteCourse} />
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Konular</Text>
            <AppButton title="Konu ekle" icon="add" variant="secondary" small onPress={() => setAddingTopic(true)} />
          </View>
          {topics.length === 0 ? (
            <Text style={styles.meta}>Henüz konu yok. Öğrenci ilerlemesi konular üzerinden takip edilir.</Text>
          ) : (
            topics.map((t, i) => (
              <View key={t.id} style={styles.topic}>
                <View style={styles.order}>
                  <Text style={styles.orderText}>{i + 1}</Text>
                </View>
                <Pressable style={styles.flex} onPress={() => setEditTopic(t)}>
                  <Text style={styles.topicName}>{t.name}</Text>
                </Pressable>
                <View style={styles.topicActions}>
                  <Pressable disabled={busy || i === 0} onPress={() => move(i, -1)} hitSlop={6} style={styles.iconBtn}>
                    <Ionicons name="arrow-up" size={18} color={i === 0 ? colors.border : colors.muted} />
                  </Pressable>
                  <Pressable
                    disabled={busy || i === topics.length - 1}
                    onPress={() => move(i, 1)}
                    hitSlop={6}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="arrow-down" size={18} color={i === topics.length - 1 ? colors.border : colors.muted} />
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => setEditTopic(t)}
                    hitSlop={6}
                    style={[styles.iconBtn, styles.editBtn]}
                    accessibilityLabel={`${t.name} konusunu düzenle`}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => confirmDeleteTopic(t)}
                    hitSlop={6}
                    style={[styles.iconBtn, styles.deleteBtn]}
                    accessibilityLabel={`${t.name} konusunu sil`}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </Card>
        {topics.length > 0 && (
          <Text style={styles.hint}>Oklarla sıralayın, kalem ile adını düzenleyin, çöp kutusu ile silin.</Text>
        )}
      </ScrollView>

      <NameFormModal
        visible={renaming}
        title="Dersi yeniden adlandır"
        label="Ders adı"
        icon="book-outline"
        initial={course.name}
        onClose={() => setRenaming(false)}
        onSubmit={async (name) => {
          await updateCourse(courseId, name);
          await reload();
        }}
      />
      <NameFormModal
        visible={addingTopic}
        title="Yeni konu"
        label="Konu adı"
        icon="list-outline"
        onClose={() => setAddingTopic(false)}
        onSubmit={async (name) => {
          await createTopic(courseId, name, topics.length + 1);
          await reload();
        }}
      />
      <NameFormModal
        visible={editTopic !== null}
        title="Konuyu düzenle"
        label="Konu adı"
        icon="list-outline"
        initial={editTopic?.name}
        onClose={() => setEditTopic(null)}
        onSubmit={async (name) => {
          await updateTopic(editTopic!.id, name, editTopic!.order);
          await reload();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 6 },
  bigIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  section: { gap: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  order: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  flex: { flex: 1 },
  topicName: { fontSize: 15, color: colors.text, fontWeight: '500' },
  hint: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  topicActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: colors.primarySoft },
  deleteBtn: { backgroundColor: colors.dangerSoft },
});
