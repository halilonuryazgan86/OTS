import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Course } from '../types/course';
import Card from './Card';
import { colors, radius } from './theme';

const COURSE_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

type Props = {
  course: Course;
  onPress: (id: number) => void;
};

// Renk dersin kimliğine bağlıdır; liste değişince diğer derslerin rengi değişmez.
function CourseListItem({ course, onPress }: Props) {
  const color = COURSE_COLORS[course.id % COURSE_COLORS.length];
  const preview = course.topics.slice(0, 3).map((t) => t.name).join(', ');
  return (
    <Card onPress={() => onPress(course.id)} style={styles.card}>
      <View style={[styles.icon, { backgroundColor: color + '1A' }]}>
        <Ionicons name="book" size={22} color={color} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.name}>{course.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {course.topics.length} konu{preview ? ` · ${preview}` : ''}
          {course.topics.length > 3 ? '…' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
    </Card>
  );
}

export default memo(CourseListItem);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
