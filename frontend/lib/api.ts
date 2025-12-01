const isServer = typeof window === "undefined";

export const API_BASE = isServer
  ? process.env.API_BASE_INTERNAL || "http://backend:8000"
  // in the browser, reach Django at localhost
  : process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
        'Accept': 'application/json',
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
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const csrfToken = await this.getCSRFToken();   // ensures cookie+token

  const res = await fetch(`${API_BASE}/${clean}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,            // Django expects this
    },
    body: JSON.stringify(body ?? {}),
  });

  // tolerate 204/empty; still parse if there is text
  const text = await res.text();
  let data: any = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.error || data.message)) ||
      `Request failed with ${res.status}`;
    throw new Error(msg);
  }
  return data; // may be null for logout
}

  async get(endpoint: string) {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const res = await fetch(`${API_BASE}/${clean}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  const text = await res.text();
  let data: any = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.error || data.message)) ||
      `Request failed with ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
}

export const apiClient = new ApiClient();
