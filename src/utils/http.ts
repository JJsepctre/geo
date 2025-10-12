import axios from 'axios';

// Prefer environment variable so backend URL can be configured without code changes
const apiBase = process.env.REACT_APP_API_BASE_URL || ''

const http = axios.create({
  baseURL: apiBase,
  timeout: 10000,
});

// If no backend configured, enable lightweight mock so the page can work standalone
if (!apiBase) {
  type AnyObject = Record<string, any>
  let mockData: AnyObject[] = []
  let idSeq = 1

  http.defaults.adapter = async (config) => {
    const { method = 'get', url = '', params = {}, data } = config
    const toResponse = (payload: AnyObject, status = 200) => {
      return Promise.resolve({
        data: payload,
        status,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      } as any)
    }

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 200))

    if (method.toLowerCase() === 'get' && url?.includes('/forecast/designs')) {
      const page = Number((params as AnyObject).page || 1)
      const pageSize = Number((params as AnyObject).pageSize || 10)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = mockData.slice(start, end)
      return toResponse({ list, total: mockData.length })
    }

    if (method.toLowerCase() === 'post' && url?.endsWith('/forecast/designs')) {
      const body = typeof data === 'string' ? JSON.parse(data) : data
      const now = new Date()
      mockData.unshift({
        id: String(idSeq++),
        createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
        ...body,
      })
      return toResponse({ success: true })
    }

    if (method.toLowerCase() === 'delete' && /\/forecast\/designs\//.test(url || '')) {
      const id = (url || '').split('/').pop()
      mockData = mockData.filter((i) => i.id !== id)
      return toResponse({ success: true })
    }

    if (method.toLowerCase() === 'post' && url?.endsWith('/forecast/designs/batch-delete')) {
      const body = typeof data === 'string' ? JSON.parse(data) : data
      const ids: string[] = body?.ids || []
      mockData = mockData.filter((i) => !ids.includes(i.id))
      return toResponse({ success: true })
    }

    if (method.toLowerCase() === 'post' && url?.endsWith('/forecast/designs/import')) {
      // create some mock rows to visualize import
      for (let i = 0; i < 5; i++) {
        mockData.push({
          id: String(idSeq++),
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          method: ['A', 'B', 'C'][i % 3],
          startMileage: `DK713+${(i * 100).toString().padStart(3, '0')}`,
          endMileage: `DK713+${((i + 1) * 100).toString().padStart(3, '0')}`,
          length: 100,
          minBurialDepth: Number((Math.random() * 5 + 1).toFixed(1)),
          designTimes: 1,
        })
      }
      return toResponse({ success: true, added: 5 })
    }

    // Fallback
    return toResponse({})
  }
}

http.interceptors.request.use(
  (config) => {
    // Add authorization token to headers
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle errors globally
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export default http;
