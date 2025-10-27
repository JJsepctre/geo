import http from './http';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import { Message } from '@arco-design/web-react';

/**
 * Global request options
 */
export interface RequestOptions<TIn = any, TOut = any> {
  /** Show a UI error on failure (default: true) */
  showError?: boolean;
  /** Map raw response data into desired shape */
  transform?: (data: TIn) => TOut;
  /** Custom error message, or mapping by status code */
  errorMessage?: string | Record<number, string>;
}

/**
 * Normalize various server response shapes:
 * - If server already returns the final data, just pass it through.
 * - If server wraps data like { code, message, data }, unwrap data by default.
 * You can override by passing a custom `transform` in options.
 */
function defaultTransform<T>(raw: any): T {
  if (raw && typeof raw === 'object') {
    // common shapes
    if ('data' in raw && (('code' in raw) || ('message' in raw) || ('success' in raw))) {
      return raw.data as T;
    }
  }
  return raw as T;
}

function getMessageFromStatus(status?: number) {
  switch (status) {
    case 400: return 'Bad request';
    case 401: return 'Unauthorized, please login';
    case 403: return 'Forbidden';
    case 404: return 'Not found';
    case 408: return 'Request timeout';
    case 413: return 'Payload too large';
    case 429: return 'Too many requests';
    case 500: return 'Server error';
    case 502: return 'Bad gateway';
    case 503: return 'Service unavailable';
    case 504: return 'Gateway timeout';
    default: return 'Request failed';
  }
}

function showErrorUI(message: string) {
  // Arco Message is lightweight and global—fits most cases
  Message.error({
    content: message,
  });
}

function handleAxiosError(error: unknown, options?: RequestOptions): never {
  const err = error as AxiosError<any>;
  const status = err.response?.status;
  const serverMsg: string | undefined =
    (err.response?.data && (err.response.data.message || err.response.data.msg)) ||
    undefined;

  let message: string;
  if (typeof options?.errorMessage === 'string') {
    message = options.errorMessage;
  } else if (typeof options?.errorMessage === 'object' && status && options.errorMessage[status]) {
    message = options.errorMessage[status];
  } else if (serverMsg) {
    message = serverMsg;
  } else if (status) {
    message = `${getMessageFromStatus(status)} (${status})`;
  } else if (err.code === 'ECONNABORTED') {
    message = 'Request timeout, please retry';
  } else if (err.message?.toLowerCase().includes('network')) {
    message = 'Network error, please check your connection';
  } else {
    message = err.message || 'Unknown error';
  }

  if (options?.showError !== false) {
    showErrorUI(message);
  }
  // Re-throw so callers can handle if needed
  throw err;
}

async function request<T = any, RIn = any>(
  config: AxiosRequestConfig,
  options?: RequestOptions<RIn, T>
): Promise<T> {
  try {
    // http is an axios instance; by default, its response interceptor returns response.data
    const raw = await http.request<any, RIn>(config);
    const transform = (options?.transform ?? defaultTransform<T>) as (x: RIn) => T;
    return transform(raw);
  } catch (e) {
    handleAxiosError(e, options);
  }
}

/**
 * Shorthand helpers
 */
export function get<T = any, RIn = any>(
  url: string,
  config?: AxiosRequestConfig,
  options?: RequestOptions<RIn, T>
) {
  return request<T, RIn>({ method: 'GET', url, ...(config || {}) }, options);
}

export function post<T = any, B = any, RIn = any>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
  options?: RequestOptions<RIn, T>
) {
  return request<T, RIn>({ method: 'POST', url, data: body, ...(config || {}) }, options);
}

export function put<T = any, B = any, RIn = any>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
  options?: RequestOptions<RIn, T>
) {
  return request<T, RIn>({ method: 'PUT', url, data: body, ...(config || {}) }, options);
}

export function del<T = any, RIn = any>(
  url: string,
  config?: AxiosRequestConfig,
  options?: RequestOptions<RIn, T>
) {
  return request<T, RIn>({ method: 'DELETE', url, ...(config || {}) }, options);
}

/**
 * Example usage:
 *
import { get, post, put, del } from '@/utils/api';

// GET 列表
const list = await get<ListItem[]>('/forecast/designs');

// POST 新建（自定义数据解包）
const created = await post<{ id: string }>(
  '/forecast/designs',
  formData,
  undefined,
  { transform: (raw) => raw?.data ?? raw }
);

// DELETE 自定义错误文案
await del(`/forecast/designs/${id}`, undefined, { errorMessage: '删除失败，请稍后重试' });

// PUT 静默失败（不弹UI）
await put('/user/profile', payload, undefined, { showError: false });
 */
