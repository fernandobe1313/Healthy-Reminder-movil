import { api } from './client';
import { session } from './session';

export async function loginMobile(username, password) {
  const result = await api.post('/auth/login', { username, password });
  if (!['dentist', 'patient'].includes(result.user?.role)) {
    throw new Error('Esta cuenta es de administración y debe ingresar desde la aplicación web.');
  }
  await session.save(result.token, result.user);
  return result.user;
}

export async function restoreMobileSession() {
  const storedUser = await session.getUser();
  if (!storedUser) return null;
  try {
    const current = await api.get('/auth/me');
    if (!['dentist', 'patient'].includes(current?.role)) {
      await session.clear();
      return null;
    }
    await session.save(await session.getToken(), current);
    return current;
  } catch {
    await session.clear();
    return null;
  }
}

export async function logoutMobile() {
  await session.clear();
}
