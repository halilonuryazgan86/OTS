import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Activity } from '../types/course';
import { colors, formatDate, STATUS } from './theme';

type Props = {
  item: Activity;
  showStudent?: boolean;
  // Verilirse satır dokunulabilir olur (ör. öğrencinin detayına gitmek için).
  onPress?: () => void;
};

// Akış satırı: durum değişikliği ("Matematik · Kesirler → Tamamlandı") ya da yorum ("Ayşe Hanım: …").
export default function ActivityItem({ item, showStudent = true, onPress }: Props) {
  const isComment = item.kind === 'Comment';
  const s = item.status ? STATUS[item.status] : null;
  const icon = isComment ? 'chatbubble-ellipses' : s!.icon;
  const tint = isComment ? colors.primary : s!.color;
  const soft = isComment ? colors.primarySoft : s!.soft;

  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.dot, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.body}>
        {showStudent && <Text style={styles.student}>{item.studentName}</Text>}
        <Text style={styles.topic}>
          {item.courseName} · {item.topicName}
        </Text>
        {isComment ? (
          <Text style={styles.comment} numberOfLines={3}>
            <Text style={styles.author}>{item.authorName}: </Text>“{item.text}”
          </Text>
        ) : (
          <Text style={[styles.status, { color: tint }]}>{s!.label}</Text>
        )}
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.neutral} style={styles.chevron} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  pressed: { opacity: 0.6 },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  student: { fontSize: 15, fontWeight: '700', color: colors.text },
  topic: { fontSize: 14, color: colors.text },
  status: { fontSize: 13, fontWeight: '700' },
  comment: { fontSize: 13, color: colors.text, marginTop: 2 },
  author: { fontWeight: '700' },
  date: { fontSize: 12, color: colors.neutral, marginTop: 2 },
  chevron: { alignSelf: 'center' },
});
