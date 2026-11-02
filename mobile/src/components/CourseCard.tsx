import { Button, StyleSheet, Text, View } from 'react-native';
import { Course, Topic } from '../types/course';
import NameInput from './NameInput';

type Props = {
  course: Course;
  onDelete: (course: Course) => void;
  onAddTopic: (course: Course, name: string) => Promise<boolean>;
  onDeleteTopic: (topic: Topic) => void;
};

export default function CourseCard({ course, onDelete, onAddTopic, onDeleteTopic }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{course.name}</Text>
        <Button title="Sil" color="#c0392b" onPress={() => onDelete(course)} />
      </View>

      {course.topics.length === 0 ? (
        <Text style={styles.empty}>Henüz konu yok.</Text>
      ) : (
        course.topics.map((t) => (
          <View key={t.id} style={styles.topic}>
            <Text style={styles.topicName}>
              {t.order}. {t.name}
            </Text>
            <Button title="Kaldır" color="#c0392b" onPress={() => onDeleteTopic(t)} />
          </View>
        ))
      )}

      <NameInput placeholder="Konu adı" onSubmit={(name) => onAddTopic(course, name)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '600', flex: 1 },
  empty: { color: '#888' },
  topic: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topicName: { flex: 1 },
});
