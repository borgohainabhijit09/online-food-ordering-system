import * as SecureStore from 'expo-secure-store';

export const DEFAULT_API_URL = 'https://restobuddy.in';
const TOKEN_KEY = 'restobuddy_auth_token';
const SERVER_URL_KEY = 'restobuddy_api_url';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await Promise.race([
      SecureStore.getItemAsync(TOKEN_KEY),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
  } catch (error) {
    console.warn('Failed to get token:', error);
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to save token:', error);
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to clear token:', error);
  }
}

const ACTIVE_STORE_KEY = 'restobuddy_active_store';

export async function getStoredActiveStore(): Promise<any | null> {
  try {
    const raw = await Promise.race([
      SecureStore.getItemAsync(ACTIVE_STORE_KEY),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to get active store:', error);
    return null;
  }
}

export async function setStoredActiveStore(store: any): Promise<void> {
  try {
    if (store) {
      await SecureStore.setItemAsync(ACTIVE_STORE_KEY, JSON.stringify(store));
    } else {
      await SecureStore.deleteItemAsync(ACTIVE_STORE_KEY);
    }
  } catch (error) {
    console.warn('Failed to save active store:', error);
  }
}

export async function clearStoredActiveStore(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACTIVE_STORE_KEY);
  } catch (error) {
    console.warn('Failed to clear active store:', error);
  }
}

export async function getStoredBaseUrl(): Promise<string> {
  try {
    const saved = await Promise.race([
      SecureStore.getItemAsync(SERVER_URL_KEY),
      new Promise<string>((resolve) => setTimeout(() => resolve(DEFAULT_API_URL), 1500)),
    ]);
    return saved || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setStoredBaseUrl(url: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SERVER_URL_KEY, url.trim().replace(/\/$/, ''));
  } catch (error) {
    console.warn('Failed to save base URL:', error);
  }
}

export interface ApiRequestOptions extends RequestInit {
  tenantSlug?: string;
  timeoutMs?: number;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = await getStoredBaseUrl();
  const token = await getStoredToken();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.tenantSlug) {
    headers['x-tenant-slug'] = options.tenantSlug;
  }

  const timeoutMs = options.timeoutMs ?? 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data?.message ? data.message : `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Network request timed out. Please check server connection.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
