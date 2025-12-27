const API_URL = '/api'; // Usa o proxy configurado no vite.config.ts para evitar CORS

interface FetchOptions extends RequestInit {
  token?: string;
}

const request = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Injeta Token JWT se existir no localStorage ou for passado explicitamente
  const token = options.token || localStorage.getItem('auth_token');
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  try {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/dbeba631-e9e7-4094-9f61-38418196391d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:20',message:'Fetch request starting',data:{url:`${API_URL}${endpoint}`,method:options.method,hasAuth:!!headers.Authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/dbeba631-e9e7-4094-9f61-38418196391d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:25',message:'Fetch response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,url:response.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/dbeba631-e9e7-4094-9f61-38418196391d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:28',message:'Response not OK',data:{status:response.status,errorBody},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw new Error(errorBody.message || `Erro ${response.status}: Falha na requisição`);
    }

    return response.json();
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/dbeba631-e9e7-4094-9f61-38418196391d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:34',message:'API request error caught',data:{errorMessage:error?.message,errorName:error?.name,endpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const api = {
  request,

  get<T>(endpoint: string) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/dbeba631-e9e7-4094-9f61-38418196391d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:40',message:'API GET request initiated',data:{endpoint,fullUrl:`${API_URL}${endpoint}`,hasToken:!!localStorage.getItem('auth_token')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body: any) {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body: any) {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body: any) {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  
  delete<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'DELETE' });
  }
};