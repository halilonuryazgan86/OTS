import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import ActivityItem from '../../components/ActivityItem';
import StateView from '../../components/StateView';
import { colors } from '../../components/theme';
import { getActivity } from '../../services/api';
import { useApi } from '../../services/useApi';

// Velinin çocuklarına ait son ilerleme güncellemeleri ve öğretmen notları.
export default function UpdatesScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useApi(getActivity);

  if (loading) return <StateView kind="loading" />;
  if (error && !data) return <StateView kind="error" message={error} onRetry={reload} />;

  return (
    <FlatList
      style={styles.screen}
      data={data ?? []}
      keyExtractor={(a, i) => `${a.kind}-${a.studentId}-${a.topicId}-${a.date}-${i}`}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      ListEmptyComponent={
        <StateView
          kind="empty"
          icon="notifications-outline"
          title="Henüz gelişme yok"
          message="Öğretmen bir konuyu güncellediğinde veya yorum yazdığında burada görünecek."
        />
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <ActivityItem item={item} onPress={() => router.push(`/child/${item.studentId}`)} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, flexGrow: 1 },
  item: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 4 },
  sep: { height: 10 },
});
