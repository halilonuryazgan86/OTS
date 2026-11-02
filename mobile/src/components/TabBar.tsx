import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props<T extends string> = {
  tabs: { key: T; title: string }[];
  active: T;
  onChange: (key: T) => void;
};

export default function TabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <View style={styles.bar}>
      {tabs.map((t) => (
        <Pressable key={t.key} style={[styles.tab, t.key === active && styles.active]} onPress={() => onChange(t.key)}>
          <Text style={[styles.text, t.key === active && styles.activeText]}>{t.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  active: { borderTopWidth: 2, borderTopColor: '#2563eb' },
  text: { color: '#666' },
  activeText: { color: '#2563eb', fontWeight: '600' },
});
