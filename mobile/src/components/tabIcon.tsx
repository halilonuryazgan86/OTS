import Ionicons from '@expo/vector-icons/Ionicons';
import { ColorValue } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

// Sekme ikonu: seçiliyken dolu, değilken çizgili ikon.
export const tabIcon =
  (name: IconName, active: IconName) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : name} size={size} color={typeof color === 'string' ? color : undefined} />
  );
