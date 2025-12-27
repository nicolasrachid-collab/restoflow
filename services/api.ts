const API_URL = '/api'; // Usa o proxy configurado no vite.config.ts para evitar CORS

interface FetchOptions extends RequestInit {
  token?: string;
  retries?: number;
  retryDelay?: number;
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
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Retry em erros 5xx (erro do servidor)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Retry em erros 429 (too many requests)
  if (error.status === 429) {
    return true;
  }
  
  return false;
};

// Função para aguardar antes de retentar
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const request = async <T>(
  endpoint: string, 
  options: FetchOptions = {},
  retryCount: number = 0
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Injeta Token JWT se existir no localStorage ou for passado explicitamente
  const token = options.token || localStorage.getItem('auth_token');
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const maxRetries = options.retries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

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
        console.warn(`Tentativa ${retryCount + 1}/${maxRetries} falhou para ${endpoint}, tentando novamente...`);
        await delay(retryDelay * (retryCount + 1)); // Backoff exponencial
        return request<T>(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }

    return response.json();
  } catch (error: any) {
    // Erros de rede podem ser retentados
    if (error instanceof TypeError && error.message.includes('fetch') && retryCount < maxRetries) {
      console.warn(`Erro de rede na tentativa ${retryCount + 1}/${maxRetries} para ${endpoint}, tentando novamente...`);
      await delay(retryDelay * (retryCount + 1));
      return request<T>(endpoint, options, retryCount + 1);
    }

    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const api = {
  request,

  get<T>(endpoint: string) {
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