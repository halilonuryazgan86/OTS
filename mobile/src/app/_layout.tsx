import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import StateView from '../components/StateView';
import { headerOptions } from '../components/theme';
import { AuthProvider, useAuth } from '../services/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

// Rol bazlı erişim: giriş yapmamış kullanıcı yalnızca login'i, öğretmen ve veli yalnızca kendi ekranlarını görür.
// Asıl yetki kontrolü sunucudadır; bu yalnızca doğru ekranları göstermek içindir.
function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <StateView kind="loading" />;

  // Şifresini değiştirmesi gereken kullanıcı, değiştirene kadar yalnızca şifre ekranını görür.
  const mustChange = !!user?.mustChangePassword;
  const isTeacher = user?.role === 'Teacher' && !mustChange;
  const isParent = user?.role === 'Parent' && !mustChange;

  return (
    <Stack screenOptions={{ ...headerOptions, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={mustChange}>
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isTeacher}>
        <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
        <Stack.Screen name="student/[id]" options={{ title: 'Öğrenci' }} />
        <Stack.Screen name="course/[id]" options={{ title: 'Ders' }} />
        <Stack.Screen name="report" options={{ title: 'Başarı Raporu' }} />
      </Stack.Protected>
      <Stack.Protected guard={isParent}>
        <Stack.Screen name="(parent)" options={{ headerShown: false }} />
        <Stack.Screen name="child/[id]" options={{ title: 'İlerleme' }} />
      </Stack.Protected>
    </Stack>
  );
}
