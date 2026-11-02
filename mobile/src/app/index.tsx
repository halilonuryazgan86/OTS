import { Redirect } from 'expo-router';
import { useAuth } from '../services/auth';

// Uygulama açılışında kullanıcıyı rolüne göre doğru başlangıç ekranına yönlendirir.
export default function Index() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  if (user.mustChangePassword) return <Redirect href="/change-password" />;
  return <Redirect href={user.role === 'Teacher' ? '/home' : '/children'} />;
}
