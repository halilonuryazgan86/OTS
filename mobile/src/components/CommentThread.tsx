import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addComment, deleteComment, errorMessage, getComments } from '../services/api';
import { useAuth } from '../services/auth';
import { Comment } from '../types/course';
import { colors, formatDate, radius } from './theme';

type Props = {
  studentId: number;
  topicId: number;
  // Yorum eklenince/silinince listedeki sayaç ve son yorum güncellensin diye.
  onChanged?: (count: number, last: string | null) => void;
};

// Konu altındaki öğretmen-veli yorumlaşması. Kendi yorumuna uzun basınca silinir.
export default function CommentThread({ studentId, topicId, onChanged }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    getComments(studentId, topicId)
      .then((list) => active && setComments(list))
      .catch((e) => active && setError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, [studentId, topicId]);

  const update = (list: Comment[]) => {
    setComments(list);
    onChanged?.(list.length, list.length ? list[list.length - 1].text : null);
  };

  const send = async () => {
    const value = text.trim();
    if (!value || !comments) return;
    setSending(true);
    try {
      const created = await addComment(studentId, topicId, value);
      update([...comments, created]);
      setText('');
    } catch (e) {
      Alert.alert('Yorum gönderilemedi', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const remove = (c: Comment) =>
    Alert.alert('Yorumu sil', 'Bu yorum silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(c.id);
            update((comments ?? []).filter((x) => x.id !== c.id));
          } catch (e) {
            Alert.alert('Silinemedi', errorMessage(e));
          }
        },
      },
    ]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Yorumlar</Text>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : comments === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>Henüz yorum yok. İlk yorumu siz yazın.</Text>
      ) : (
        comments.map((c) => {
          const mine = c.authorId === user?.id;
          return (
            <Pressable
              key={c.id}
              onLongPress={mine ? () => remove(c) : undefined}
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
            >
              <Text style={styles.author}>
                {mine ? 'Siz' : c.authorName} · {c.authorRole === 'Teacher' ? 'Öğretmen' : 'Veli'}
              </Text>
              <Text style={styles.text}>{c.text}</Text>
              <Text style={styles.date}>{formatDate(c.createdAt)}</Text>
            </Pressable>
          );
        })
      )}

      {comments !== null && !error && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Yorum yazın…"
            placeholderTextColor={colors.neutral}
            multiline
            maxLength={1000}
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={[styles.send, (sending || !text.trim()) && styles.sendDisabled]}
            accessibilityLabel="Yorumu gönder"
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      )}
      {comments !== null && comments.some((c) => c.authorId === user?.id) && (
        <Text style={styles.hint}>Kendi yorumunuzu silmek için üzerine uzun basın.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  empty: { fontSize: 14, color: colors.muted },
  error: { fontSize: 14, color: colors.danger },
  bubble: { maxWidth: '88%', padding: 10, borderRadius: radius.md, gap: 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primarySoft, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  author: { fontSize: 12, fontWeight: '700', color: colors.muted },
  text: { fontSize: 15, color: colors.text, lineHeight: 20 },
  date: { fontSize: 11, color: colors.neutral, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  hint: { fontSize: 12, color: colors.neutral, textAlign: 'center' },
});
