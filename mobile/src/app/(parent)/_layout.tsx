import { Tabs } from 'expo-router';
import { tabIcon } from '../../components/tabIcon';
import { colors, headerOptions } from '../../components/theme';

export default function ParentTabs() {
  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral,
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="children" options={{ title: 'Çocuklarım', tabBarIcon: tabIcon('happy-outline', 'happy') }} />
      <Tabs.Screen
        name="updates"
        options={{ title: 'Son Gelişmeler', tabBarIcon: tabIcon('notifications-outline', 'notifications') }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
