import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../services/api';
import { Progress, ProgressStatus } from '../types/course';
import AppButton from './AppButton';
import CommentThread from './CommentThread';
import DateTimeField from './DateTimeField';
import FormModal from './FormModal';
import StatusBadge from './StatusBadge';
import { APP_BUILD, colors, formatDate, radius, STATUS } from './theme';

type Props = {
  studentId: number;
  item: Progress | null;
  // Öğretmen durumu ve tarihi değiştirebilir; veli yalnızca görür ve yorum yazar.
  editable: boolean;
  onClose: () => void;
  onSave?: (status: ProgressStatus, date: Date | null) => Promise<void>;
  onCommentsChanged: (topicId: number, count: number, last: string | null) => void;
};

const ORDER: ProgressStatus[] = ['NotStarted', 'InProgress', 'Completed'];

// Konu detayı: durum + işlem tarihi-saati (öğretmen) ve öğretmen-veli yorumları.
export default function TopicDetailModal({ studentId, item, editable, onClose, onSave, onCommentsChanged }: Props) {
  const [status, setStatus] = useState<ProgressStatus>('NotStarted');
  const [date, setDate] = useState(new Date());
  const [saving, setSaving] = useState(false);
  // Kullanıcı durum ya da tarihte değişiklik yaptı mı (kaydet butonu için).
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (item) {
      setStatus(item.status);
      setDate(item.statusDate ? new Date(item.statusDate) : new Date());
      setDirty(false);
    }
  }, [item]);

  const changeStatus = (s: ProgressStatus) => {
    setStatus(s);
    setDirty(true);
  };
  const changeDate = (d: Date) => {
    setDate(d);
    setDirty(true);
  };

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(status, status === 'NotStarted' ? null : date);
      setDirty(false);
      Alert.alert('Kaydedildi', 'Konu durumu güncellendi.');
    } catch (e) {
      Alert.alert('Güncellenemedi', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal visible={item !== null} title={item?.topicName ?? ''} onClose={onClose}>
      <Text style={styles.course}>
        {item?.courseName} · Sürüm {APP_BUILD}
      </Text>

      {editable ? (
        <>
          <View style={styles.options}>
            {ORDER.map((s) => {
              const meta = STATUS[s];
              const active = status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => changeStatus(s)}
                  style={[styles.option, active && { borderColor: meta.color, backgroundColor: meta.soft }]}
                >
                  <Ionicons name={meta.icon} size={24} color={active ? meta.color : colors.neutral} />
                  <Text style={[styles.optionText, active && { color: meta.color }]}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {status !== 'NotStarted' ? (
            <DateTimeField
              label={status === 'Completed' ? 'Tamamlanma tarihi ve saati' : 'İşlem tarihi ve saati'}
              value={date}
              onChange={changeDate}
            />
          ) : (
            <Text style={styles.hint}>
              Tarih ve saat girmek için durumu "Devam ediyor" veya "Tamamlandı" olarak seçin.
            </Text>
          )}
          <AppButton title="Durumu kaydet" icon="checkmark" onPress={save} loading={saving} disabled={!dirty} />
        </>
      ) : (
        item && (
          <View style={styles.readonly}>
            <StatusBadge status={item.status} />
            {item.statusDate && <Text style={styles.date}>{formatDate(item.statusDate)}</Text>}
          </View>
        )
      )}

      <View style={styles.divider} />
      {item && (
        <CommentThread
          key={item.topicId}
          studentId={studentId}
          topicId={item.topicId}
          onChanged={(count, last) => onCommentsChanged(item.topicId, count, last)}
        />
      )}
    </FormModal>
  );
}

const styles = StyleSheet.create({
  course: { fontSize: 14, color: colors.muted, marginTop: -8 },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionText: { fontSize: 13, fontWeight: '600', color: colors.muted, textAlign: 'center' },
  readonly: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  date: { fontSize: 14, color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  hint: { fontSize: 13, color: colors.muted, lineHeight: 18 },
});
