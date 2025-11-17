import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Prefer environment variable so backend URL can be configured without code changes
const apiBase = process.env.REACT_APP_API_BASE_URL || ''

const axiosInstance = axios.create({
  baseURL: apiBase,
  timeout: 10000,
});

// Mock adapter has been disabled - we use setupProxy.js for API proxying instead
// This ensures all /api requests are forwarded to the real backend via the proxy

axiosInstance.interceptors.request.use(
  (config) => {
    // Add authorization token to headers
    const token = localStorage.getItem('token');
    if (token) {
      // 打印token用于调试
      console.log('🔑 [HTTP] 发送请求，Token:', token);
      
      // 尝试多种认证方式，看后端接受哪一种
      // 方式1: 标准Bearer Token - 使用这个
      config.headers.Authorization = `Bearer ${token}`;
      
      // 方式2: 直接使用token（不带Bearer前缀）
      // config.headers.Authorization = token;
      
      // 方式3: 使用自定义header名称
      // config.headers['X-Auth-Token'] = token;
      // config.headers['token'] = token;
      
      console.log('📤 [HTTP] 请求详情:', {
        url: config.url,
        method: config.method,
        headers: {
          Authorization: config.headers.Authorization,
        }
      });
    } else {
      console.warn('⚠️ [HTTP] 发送请求，但Token不存在');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle errors globally
    console.error('❌ [HTTP] API错误:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
      message: error.message,
      headers: error.response?.headers
    });
    
    // 如果是403错误，给出更详细的提示
    if (error.response?.status === 403) {
      console.error('🚫 [HTTP] 403 Forbidden - 可能的原因:');
      console.error('  1. Token格式不正确（当前使用: Bearer {token}）');
      console.error('  2. Token已过期');
      console.error('  3. 用户权限不足');
      console.error('  4. 后端期望不同的认证方式');
      console.error('  当前Token:', localStorage.getItem('token')?.substring(0, 50) + '...');
    }
    
    return Promise.reject(error);
  }
);

// 创建类型安全的HTTP客户端，响应拦截器返回response.data
interface HttpClient {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  request<T = any, R = any>(config: AxiosRequestConfig): Promise<R>;
}

const http: HttpClient = axiosInstance as any;

export default http;
