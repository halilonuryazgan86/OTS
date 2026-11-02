import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors } from './theme';

type Props =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onRetry: () => void }
  | {
      kind: 'empty';
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      message?: string;
      actionTitle?: string;
      onAction?: () => void;
    };

// Yükleniyor / hata / boş liste görünümleri.
export default function StateView(props: Props) {
  if (props.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isError = props.kind === 'error';
  return (
    <View style={styles.center}>
      <View style={[styles.iconWrap, isError && styles.errorWrap]}>
        <Ionicons
          name={isError ? 'cloud-offline-outline' : props.icon}
          size={36}
          color={isError ? colors.danger : colors.primary}
        />
      </View>
      <Text style={styles.title}>{isError ? 'Bir sorun oluştu' : props.title}</Text>
      {props.message && <Text style={styles.message}>{props.message}</Text>}
      {isError ? (
        <AppButton title="Tekrar dene" icon="refresh" variant="secondary" onPress={props.onRetry} />
      ) : (
        props.actionTitle &&
        props.onAction && <AppButton title={props.actionTitle} icon="add" onPress={props.onAction} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: { backgroundColor: colors.dangerSoft },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21 },
});
