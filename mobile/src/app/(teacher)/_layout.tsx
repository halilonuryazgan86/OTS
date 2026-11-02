import { Tabs } from 'expo-router';
import { tabIcon } from '../../components/tabIcon';
import { colors, headerOptions } from '../../components/theme';

export default function TeacherTabs() {
  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral,
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Ana Sayfa', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen name="students" options={{ title: 'Öğrenciler', tabBarIcon: tabIcon('people-outline', 'people') }} />
      <Tabs.Screen name="courses" options={{ title: 'Dersler', tabBarIcon: tabIcon('book-outline', 'book') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
