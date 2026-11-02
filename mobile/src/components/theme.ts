import { Platform } from 'react-native';
import { ProgressStatus } from '../types/course';

export const colors = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primarySoft: '#EEF2FF',
  background: '#F4F6FB',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  neutral: '#9CA3AF',
  neutralSoft: '#F3F4F6',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24 };

// Ekranda gösterilen sürüm etiketi: telefonun güncel kodu çalıştırdığını doğrulamak için. Her teslimde artırılır.
export const APP_BUILD = '2026.11.02-r4';

export const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  default: { elevation: 2 },
});

export const STATUS: Record<ProgressStatus, { label: string; color: string; soft: string; icon: 'ellipse-outline' | 'time-outline' | 'checkmark-circle' }> = {
  NotStarted: { label: 'Başlamadı', color: colors.neutral, soft: colors.neutralSoft, icon: 'ellipse-outline' },
  InProgress: { label: 'Devam ediyor', color: colors.warning, soft: colors.warningSoft, icon: 'time-outline' },
  Completed: { label: 'Tamamlandı', color: colors.success, soft: colors.successSoft, icon: 'checkmark-circle' },
};

export const percent = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

// Tab ve Stack başlıklarının ortak görünümü.
export const headerOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
};
