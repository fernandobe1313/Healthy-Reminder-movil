import { fetch } from 'expo/fetch';
import { session } from './session';

const configuredBase = process.env.EXPO_PUBLIC_API_URL
  || 'https://healthy-reminder-backend.onrender.com/api/v1';
export const API_BASE_URL = configuredBase.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, code = 'REQUEST_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  const token = await session.getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;
    if (!response.ok) {
      if (response.status === 401) await session.clear();
      throw new ApiError(data?.error || `Error HTTP ${response.status}`, response.status, data?.code);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw new ApiError('La solicitud tardó demasiado.', 0, 'TIMEOUT');
    throw new ApiError('No fue posible conectar con HealthyReminder.', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};
