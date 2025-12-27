// Mock é o modo padrão - só usa servidor se VITE_USE_SERVER=true
// Se VITE_USE_MOCK estiver explicitamente definido como 'false', também desabilita mock
const USE_SERVER = import.meta.env.VITE_USE_SERVER === 'true' || import.meta.env.VITE_USE_SERVER === 'True' || import.meta.env.VITE_USE_SERVER === 'TRUE';
const MOCK_EXPLICITLY_DISABLED = import.meta.env.VITE_USE_MOCK === 'false' || import.meta.env.VITE_USE_MOCK === 'False' || import.meta.env.VITE_USE_MOCK === 'FALSE';
const USE_MOCK = !USE_SERVER && !MOCK_EXPLICITLY_DISABLED;

// Log de debug (apenas em desenvolvimento)
if (typeof window !== 'undefined' && USE_MOCK) {
  console.log('🔧 Modo MOCK ativo (padrão) - Sistema rodando sem backend');
}

const API_URL = '/api'; // Usa o proxy configurado no vite.config.ts para evitar CORS
const DEFAULT_TIMEOUT = 30000; // 30 segundos
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 segundo base

interface FetchOptions extends RequestInit {
  token?: string;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

// Função para fazer logout quando receber 401
const handleUnauthorized = () => {
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    // Dispara evento customizado para notificar outros componentes
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
};

// Função para verificar se é um erro que deve ser retentado
const shouldRetry = (error: any, retries: number): boolean => {
  if (retries <= 0) return false;
  
  // Retry em erros de rede ou timeout
  if (error instanceof TypeError && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch')
  )) {
    return true;
  }
  
  // Retry em erros 5xx (erro do servidor) - especialmente 500 e 502, 503, 504
  if (error.status >= 500 && error.status < 600) {
    // Não retry em 501 (Not Implemented) pois é permanente
    if (error.status === 501) return false;
    return true;
  }
  
  // Retry em erros 429 (too many requests)
  if (error.status === 429) {
    return true;
  }
  
  return false;
};

// Função para aguardar antes de retentar (backoff exponencial)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para criar fetch com timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout após ${timeout}ms`);
      (timeoutError as any).status = 408;
      (timeoutError as any).isTimeout = true;
      throw timeoutError;
    }
    throw error;
  }
};

const request = async <T>(
  endpoint: string, 
  options: FetchOptions = {},
  retryCount: number = 0
): Promise<T> => {
  // Se modo mock está ativo, usa dados mockados
  if (USE_MOCK) {
    try {
      const { mockApi } = await import('./mockData');
      // Log apenas na primeira chamada
      if (!(window as any).__MOCK_LOGGED) {
        console.log('🔧 Modo MOCK ativado - Sistema rodando sem backend');
        (window as any).__MOCK_LOGGED = true;
      }
      const method = options.method?.toLowerCase() || 'get';
      
      if (method === 'get') {
        return await mockApi.get<T>(endpoint);
      } else if (method === 'post') {
        const body = options.body ? JSON.parse(options.body as string) : undefined;
        return await mockApi.post<T>(endpoint, body);
      } else if (method === 'patch') {
        const body = options.body ? JSON.parse(options.body as string) : undefined;
        return await mockApi.patch<T>(endpoint, body);
      } else if (method === 'put') {
        const body = options.body ? JSON.parse(options.body as string) : undefined;
        return await mockApi.put<T>(endpoint, body);
      } else if (method === 'delete') {
        return await mockApi.delete<T>(endpoint);
      }
    } catch (error: any) {
      // Se mock falhar, lança erro formatado
      console.error('Erro no mock:', error);
      const mockError = new Error(error.message || 'Erro no mock');
      (mockError as any).status = error.status || 500;
      (mockError as any).response = error;
      throw mockError;
    }
    // Se chegou aqui, algo deu errado - não deve tentar servidor real
    throw new Error('Erro no modo mock');
  }

  // Se não está em modo mock, tenta conectar ao servidor real
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Injeta Token JWT se existir no localStorage ou for passado explicitamente
  const token = options.token || localStorage.getItem('auth_token');
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const maxRetries = options.retries ?? DEFAULT_MAX_RETRIES;
  const baseRetryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  try {
    const response = await fetchWithTimeout(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      },
      timeout
    );

    // Tratamento de 401 (Não autorizado)
    if (response.status === 401) {
      handleUnauthorized();
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(errorBody.message || 'Sessão expirada. Por favor, faça login novamente.');
      (error as any).status = 401;
      throw error;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(errorBody.message || `Erro ${response.status}: Falha na requisição`);
      (error as any).status = response.status;
      (error as any).response = errorBody;
      
      // Tenta retry se aplicável
      if (shouldRetry(error, maxRetries - retryCount)) {
        const delayMs = baseRetryDelay * Math.pow(2, retryCount); // Backoff exponencial: 1s, 2s, 4s, 8s...
        console.warn(`Tentativa ${retryCount + 1}/${maxRetries} falhou para ${endpoint}, tentando novamente em ${delayMs}ms...`);
        await delay(delayMs);
        return request<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }

    return response.json();
  } catch (error: any) {
    // Erros de rede ou timeout podem ser retentados
    const isNetworkError = error instanceof TypeError && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    );
    const isTimeout = error.isTimeout || error.name === 'AbortError';
    
    if ((isNetworkError || isTimeout) && retryCount < maxRetries) {
      const delayMs = baseRetryDelay * Math.pow(2, retryCount);
      const errorType = isTimeout ? 'timeout' : 'rede';
      console.warn(`Erro de ${errorType} na tentativa ${retryCount + 1}/${maxRetries} para ${endpoint}, tentando novamente em ${delayMs}ms...`);
      await delay(delayMs);
      return request<T>(endpoint, options, retryCount + 1);
    }

    // Não logar erros esperados (401, 403, 404, etc) como erro crítico
    if (error.status && error.status < 500) {
      console.warn(`API Warning [${endpoint}]: ${error.message || error}`);
    } else {
      console.error(`API Error [${endpoint}]:`, error);
    }
    throw error;
  }
};

export const api = {
  request,

  get<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body?: any) {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: any) {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
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