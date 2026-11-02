import { Button, StyleSheet, Text, View } from 'react-native';
import { Student } from '../types/student';

type Props = {
  student: Student;
  onDelete: (student: Student) => void;
};

export default function StudentListItem({ student, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.name}>
          {student.firstName} {student.lastName}
        </Text>
        <Text style={styles.grade}>{student.gradeLevel}. sınıf</Text>
      </View>
      <Button title="Sil" color="#c0392b" onPress={() => onDelete(student)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
