const isServer = typeof window === 'undefined';

export const API_BASE = isServer
  ? process.env.API_BASE_INTERNAL || 'http://donney.ddns.net'
  : process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

class ApiClient {
  private csrfToken: string | null = null;

  getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;

    const name = 'csrftoken';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }

    return null;
  }

  async getCSRFToken(): Promise<string> {
    // Try to get from cookie first
    const cookieToken = this.getCsrfTokenFromCookie();
    if (cookieToken) {
      this.csrfToken = cookieToken;
      return cookieToken;
    }

    // If not in cookie, fetch from server
    const response = await fetch(`${API_BASE}/auth/csrf/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    this.csrfToken = data.csrfToken;

    if (!this.csrfToken) {
      throw new Error('CSRF token not found in response');
    }

    return this.csrfToken;
  }

  async post(endpoint: string, body: any) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const csrfToken = await this.getCSRFToken();

    const response = await fetch(`${API_BASE}/${cleanEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return data;
  }

  async patch(endpoint: string, body: any) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const csrfToken = await this.getCSRFToken();

    const response = await fetch(`${API_BASE}/${cleanEndpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return data;
  }

  async delete(endpoint: string) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const csrfToken = await this.getCSRFToken();

    const response = await fetch(`${API_BASE}/${cleanEndpoint}`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return data;
  }

  async get(endpoint: string) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    const response = await fetch(`${API_BASE}/${cleanEndpoint}`, {
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return data;
  }
}

export const apiClient = new ApiClient();

// User endpoints
export const userApi = {
  getItems: (username: string) => apiClient.get(`/users/${username}/items/`),
  getBids: (username: string) => apiClient.get(`/users/${username}/bids/`),
};

// Items endpoints
export const itemsApi = {
  getItem: (itemId: number) => apiClient.get(`/items/${itemId}/`),
  listItems: () => apiClient.get('/items/'),
  createItem: (data: any) => apiClient.post('/items/create/', data),
  editItem: (itemId: number, data: any) =>
    apiClient.patch(`/items/${itemId}/edit/`, data),
  deleteItem: (itemId: number) => apiClient.delete(`/items/${itemId}/delete/`),
  placeBid: (itemId: number, amount: number) =>
    apiClient.post(`/items/${itemId}/bid/`, { amount }),
};