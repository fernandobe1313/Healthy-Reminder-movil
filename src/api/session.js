import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'hr_auth_token';
const USER_KEY = 'hr_auth_user';

const webStorage = {
  getItemAsync: async (key) => globalThis.localStorage?.getItem(key) || null,
  setItemAsync: async (key, value) => globalThis.localStorage?.setItem(key, value),
  deleteItemAsync: async (key) => globalThis.localStorage?.removeItem(key),
};

const storage = Platform.OS === 'web' ? webStorage : SecureStore;

export const session = {
  async getToken() {
    return storage.getItemAsync(TOKEN_KEY);
  },
  async getUser() {
    const value = await storage.getItemAsync(USER_KEY);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  async save(token, user) {
    await Promise.all([
      storage.setItemAsync(TOKEN_KEY, token),
      storage.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
  },
  async clear() {
    await Promise.all([
      storage.deleteItemAsync(TOKEN_KEY),
      storage.deleteItemAsync(USER_KEY),
    ]);
  },
};
