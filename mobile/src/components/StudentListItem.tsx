import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Student } from '../types/student';
import Avatar from './Avatar';
import Card from './Card';
import ProgressBar from './ProgressBar';
import { colors } from './theme';

type Props = {
  student: Student;
  onPress: (id: number) => void;
};

// memo: arama/filtre değişince yalnızca değişen satırlar yeniden çizilir.
function StudentListItem({ student, onPress }: Props) {
  const name = `${student.firstName} ${student.lastName}`;
  return (
    <Card onPress={() => onPress(student.id)} style={styles.card}>
      <View style={styles.row}>
        <Avatar name={name} />
        <View style={styles.flex}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>
            {student.gradeLevel}. sınıf · {student.completedTopics}/{student.totalTopics} konu
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
      </View>
      <ProgressBar done={student.completedTopics} total={student.totalTopics} />
    </Card>
  );
}

export default memo(StudentListItem);

const styles = StyleSheet.create({
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
