// Formlardaki istemci tarafı kontroller; sunucudaki kurallarla aynıdır (asıl kontrol sunucudadır).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_HINT = 'En az 8 karakter, en az bir harf ve bir rakam';

export function passwordError(password: string): string | null {
  if (password.length < 8 || password.length > 100) return 'Şifre 8-100 karakter olmalı.';
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Şifre en az bir harf ve bir rakam içermeli.';
  return null;
}
