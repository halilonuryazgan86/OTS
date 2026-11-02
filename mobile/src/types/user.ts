export type Role = 'Teacher' | 'Parent';

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  // Şifresi öğretmen tarafından belirlenen veli, uygulamayı kullanmadan önce şifresini değiştirmelidir.
  mustChangePassword: boolean;
};

export type LoginResponse = {
  token: string;
  user: User;
};
