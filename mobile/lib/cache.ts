import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface TokenCache {
  getToken: (key: string) => Promise<string | null | undefined>;
  saveToken: (key: string, value: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void>;
}

/**
 * Native (iOS/Android) 하드웨어 암호화 저장소 기반 TokenCache 구현
 */
const createNativeTokenCache = (): TokenCache => {
  return {
    async getToken(key: string) {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
          console.log(`${key} token fetched successfully 🔐`);
        }
        return item;
      } catch (error) {
        console.error('SecureStore get item error: ', error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        return await SecureStore.setItemAsync(key, value);
      } catch (err) {
        console.error('SecureStore save item error: ', err);
      }
    },
    async clearToken(key: string) {
      try {
        return await SecureStore.deleteItemAsync(key);
      } catch (err) {
        console.error('SecureStore clear item error: ', err);
      }
    },
  };
};

/**
 * Web 브라우저 환경 지원용 TokenCache 폴백
 */
const createWebTokenCache = (): TokenCache => {
  return {
    async getToken(key: string) {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch (err) {
        console.error('localStorage get item error: ', err);
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (err) {
        console.error('localStorage save item error: ', err);
      }
    },
    async clearToken(key: string) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (err) {
        console.error('localStorage clear item error: ', err);
      }
    },
  };
};

export const tokenCache: TokenCache =
  Platform.OS === 'web' ? createWebTokenCache() : createNativeTokenCache();
