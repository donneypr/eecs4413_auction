// frontend/lib/api.ts
const isServer = typeof window === 'undefined';

export const API_BASE = isServer
  ? process.env.API_BASE_INTERNAL || 'http://backend-svc:8000'
  : process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

class ApiClient {
  private csrfToken: string | null = null;

  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const name = 'csrftoken';
    for (const raw of document.cookie.split(';')) {
      const [k, v] = raw.trim().split('=');
      if (k === name) return decodeURIComponent(v || '');
    }
    return null;
  }

  private async ensureCsrf(): Promise<string> {
    // 1) try cookie
    const fromCookie = this.getCsrfTokenFromCookie();
    if (fromCookie) {
      this.csrfToken = fromCookie;
      return fromCookie;
    }
    // 2) fetch from backend
    const res = await fetch(`${API_BASE}/auth/csrf/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch CSRF token');
    const json = await res.json();
    const token = json?.csrfToken || json?.csrf || json?.token;
    if (!token) throw new Error('CSRF token not found in response');
    this.csrfToken = token;
    return token;
  }

  private clean(endpoint: string) {
    return endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  }

  private async safeJson(res: Response): Promise<any> {
    const txt = await res.text();
    if (!txt) return null;                // e.g., 204 No Content (logout)
    try { return JSON.parse(txt); } catch { return txt; }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const clean = this.clean(endpoint);

    const headers: Record<string, string> = {};
    if (method === 'GET') {
      headers['Accept'] = 'application/json';
    } else {
      const csrf = await this.ensureCsrf();
      headers['Content-Type'] = 'application/json';
      headers['X-CSRFToken'] = csrf;      // Django expects this
    }

    const res = await fetch(`${API_BASE}/${clean}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await this.safeJson(res);

    if (!res.ok) {
      const msg =
        (data && (data.detail || data.error || data.message)) ||
        `${res.status} ${res.statusText}`;
      throw new Error(String(msg));
    }
    return data as T;
  }

  get<T = any>(endpoint: string)    { return this.request<T>('GET', endpoint); }
  post<T = any>(endpoint: string, body?: unknown)  { return this.request<T>('POST', endpoint, body); }
  patch<T = any>(endpoint: string, body?: unknown) { return this.request<T>('PATCH', endpoint, body); }
  delete<T = any>(endpoint: string) { return this.request<T>('DELETE', endpoint); }
}

export const apiClient = new ApiClient();

// Optional convenience wrappers (match what you had in the PR)
export const userApi = {
  getItems: (username: string) => apiClient.get(`/users/${username}/items/`),
  getBids:  (username: string) => apiClient.get(`/users/${username}/bids/`),
};

export const itemsApi = {
  getItem:   (itemId: number)        => apiClient.get(`/items/${itemId}/`),
  listItems: ()                      => apiClient.get('/items/'),
  createItem:(data: any)             => apiClient.post('/items/create/', data),
  editItem:  (itemId: number, data: any) => apiClient.patch(`/items/${itemId}/edit/`, data),
  deleteItem:(itemId: number)        => apiClient.delete(`/items/${itemId}/delete/`),
  placeBid:  (itemId: number, amount: number) =>
               apiClient.post(`/items/${itemId}/bid/`, { amount }),
};
