// Token storage — NATIVE.
// Delegates 1:1 to expo-secure-store so native behaviour is unchanged.
// The web counterpart (secureStore.web.ts) backs the same async API with
// localStorage. Importers use `import * as SecureStore from '@/services/secureStore'`.
import * as SecureStore from 'expo-secure-store';

export const getItemAsync = (key: string): Promise<string | null> =>
  SecureStore.getItemAsync(key);

export const setItemAsync = (key: string, value: string): Promise<void> =>
  SecureStore.setItemAsync(key, value);

export const deleteItemAsync = (key: string): Promise<void> =>
  SecureStore.deleteItemAsync(key);
